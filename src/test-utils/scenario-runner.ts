import { promises as fs } from "fs";
import { join } from "path";
import AdamikSDK from "../index";
import { AdamikAPIClient } from "../client";
import { AdamikEncodeResponse, TransactionIntent, VerificationResult } from "../types";
import {
  TestScenario,
  TestConfiguration,
  TestResult,
  TestReport,
  TestEnvironment,
  RealTransactionData,
  TestApiResponse,
} from "./types";

/**
 * Core class for running configuration-driven test scenarios
 */
export class ScenarioRunner {
  private sdk: AdamikSDK;
  private apiClient?: AdamikAPIClient;
  private config!: TestConfiguration; // Will be initialized in loadConfiguration
  private environment: TestEnvironment;
  private configPath: string;

  constructor(configPath: string, environment: TestEnvironment) {
    this.configPath = configPath;
    this.environment = environment;
    this.sdk = new AdamikSDK();
    
    if (environment.useRealAPI && environment.apiConfig) {
      this.apiClient = new AdamikAPIClient({
        baseUrl: environment.apiConfig.baseUrl,
        apiKey: process.env.ADAMIK_API_KEY || "",
        timeout: environment.apiConfig.timeout,
      });
    }
  }

  /**
   * Load configuration from file
   */
  async loadConfiguration(): Promise<void> {
    try {
      const configContent = await fs.readFile(this.configPath, "utf-8");
      this.config = JSON.parse(configContent);
      
      // Validate configuration version
      if (!this.config.version) {
        throw new Error("Configuration missing version field");
      }
      
      console.log(`📋 Loaded configuration: ${this.config.metadata.name}`);
      console.log(`📊 Found ${this.config.scenarios.length} scenarios, ${Object.keys(this.config.patterns).length} patterns`);
    } catch (error) {
      throw new Error(`Failed to load configuration from ${this.configPath}: ${error}`);
    }
  }

  /**
   * Run a single test scenario
   */
  async runScenario(scenario: TestScenario): Promise<TestResult> {
    const startTime = Date.now();
    
    console.log(`🧪 Running scenario: ${scenario.name}`);
    
    try {
      // Skip if not applicable to current environment
      if (scenario.environments && !scenario.environments.includes(this.environment.name)) {
        console.log(`⏭️  Skipping ${scenario.name} - not applicable to ${this.environment.name}`);
        return {
          scenario,
          passed: true, // Skipped tests are considered passed
          duration: Date.now() - startTime,
          metadata: {
            executedAt: new Date().toISOString(),
            environment: this.environment.name,
            chainId: scenario.chainId,
          },
        };
      }

      // Build API response
      const apiResponse = await this.buildApiResponse(scenario);
      
      // Run verification
      const verificationResult = await this.sdk.verify(apiResponse, scenario.intent);
      
      // Validate results against expectations
      const validationResult = this.validateResults(scenario, verificationResult);
      
      const result: TestResult = {
        scenario,
        passed: validationResult.passed,
        duration: Date.now() - startTime,
        errors: validationResult.errors,
        actualResult: verificationResult,
        metadata: {
          executedAt: new Date().toISOString(),
          environment: this.environment.name,
          chainId: scenario.chainId,
        },
      };

      if (result.passed) {
        console.log(`✅ ${scenario.name} - PASSED`);
      } else {
        console.log(`❌ ${scenario.name} - FAILED`);
        result.errors?.forEach(error => console.log(`   ${error}`));
      }

      return result;
    } catch (error) {
      console.log(`💥 ${scenario.name} - ERROR: ${error}`);
      
      return {
        scenario,
        passed: false,
        duration: Date.now() - startTime,
        errors: [`Test execution failed: ${error}`],
        metadata: {
          executedAt: new Date().toISOString(),
          environment: this.environment.name,
          chainId: scenario.chainId,
        },
      };
    }
  }

  /**
   * Run multiple scenarios
   */
  async runScenarios(scenarioIds?: string[]): Promise<TestResult[]> {
    const scenarios = scenarioIds
      ? this.config.scenarios.filter(s => scenarioIds.includes(s.id))
      : this.config.scenarios.filter(s => !s.skip);

    const results: TestResult[] = [];

    if (this.environment.execution.parallel) {
      // Run scenarios in parallel
      const promises = scenarios.map(scenario => this.runScenario(scenario));
      const parallelResults = await Promise.allSettled(promises);
      
      for (const result of parallelResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Parallel execution failed: ${result.reason}`);
        }
      }
    } else {
      // Run scenarios sequentially
      for (const scenario of scenarios) {
        const result = await this.runScenario(scenario);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Run all scenarios and generate a report
   */
  async runAll(): Promise<TestReport> {
    console.log(`🚀 Starting test execution - ${this.environment.name} environment`);
    
    const results = await this.runScenarios();
    const report = this.generateReport(results);
    
    console.log(`📊 Test execution complete:`);
    console.log(`   Total: ${report.summary.total}`);
    console.log(`   Passed: ${report.summary.passed}`);
    console.log(`   Failed: ${report.summary.failed}`);
    console.log(`   Duration: ${report.summary.duration}ms`);
    
    return report;
  }

  /**
   * Build API response for a scenario
   */
  private async buildApiResponse(scenario: TestScenario): Promise<AdamikEncodeResponse> {
    if (this.environment.useRealAPI && this.apiClient) {
      // Use real API
      try {
        return await this.apiClient.encodeTransaction(scenario.chainId, scenario.intent);
      } catch (error) {
        throw new Error(`Real API call failed: ${error}`);
      }
    } else {
      // Build mock response
      return this.buildMockApiResponse(scenario);
    }
  }

  /**
   * Build mock API response from scenario configuration
   */
  private buildMockApiResponse(scenario: TestScenario): AdamikEncodeResponse {
    const baseResponse: AdamikEncodeResponse = {
      chainId: scenario.chainId,
      transaction: {
        data: {
          ...scenario.intent,
          fees: "21000000000000",
          gas: "21000",
          nonce: "9",
        },
        encoded: this.getEncodedData(scenario),
      },
    };

    // Apply scenario-specific API response overrides
    if (scenario.apiResponse) {
      return this.mergeApiResponse(baseResponse, scenario.apiResponse);
    }

    return baseResponse;
  }

  /**
   * Get encoded transaction data for a scenario
   */
  private getEncodedData(scenario: TestScenario): AdamikEncodeResponse["transaction"]["encoded"] {
    // Check if we have real transaction data
    const realDataKey = `${scenario.chainId}-${scenario.intent.mode}`;
    const realData = this.config.realTransactions[realDataKey];
    
    if (realData) {
      return [{
        hash: {
          format: "keccak256",
          value: "0x374f3a049e006f36f6cf91b02a3b0ee16c858af2f75858733eb0e927b5b7126c",
        },
        raw: {
          format: realData.format,
          value: realData.encoded,
        },
      }];
    }

    // Use default encoded data
    return [{
      hash: {
        format: "keccak256",
        value: "0x374f3a049e006f36f6cf91b02a3b0ee16c858af2f75858733eb0e927b5b7126c",
      },
      raw: {
        format: "RLP",
        value: "0xf86c098504a817c800825208943535353535353535353535353535353535353535880de0b6b3a76400008025a028ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276a067cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83",
      },
    }];
  }

  /**
   * Merge API response with overrides
   */
  private mergeApiResponse(base: AdamikEncodeResponse, override: Partial<TestApiResponse>): AdamikEncodeResponse {
    const merged = JSON.parse(JSON.stringify(base));
    
    if (override.chainId) {
      merged.chainId = override.chainId;
    }
    
    if (override.transaction) {
      if (override.transaction.data) {
        merged.transaction.data = {
          ...merged.transaction.data,
          ...override.transaction.data,
        };
      }
      
      if (override.transaction.encoded) {
        merged.transaction.encoded = override.transaction.encoded.map((enc, index) => ({
          ...merged.transaction.encoded[index],
          ...enc,
        }));
      }
    }
    
    return merged;
  }

  /**
   * Validate verification results against expectations
   */
  private validateResults(scenario: TestScenario, actual: VerificationResult): { passed: boolean; errors: string[] } {
    const errors: string[] = [];
    const expected = scenario.expectedResult;

    // Check validity
    if (actual.isValid !== expected.isValid) {
      errors.push(`Expected isValid: ${expected.isValid}, got: ${actual.isValid}`);
    }

    // Check error presence
    if (expected.shouldHaveErrors && (!actual.errors || actual.errors.length === 0)) {
      errors.push("Expected errors to be present, but none found");
    }

    if (!expected.shouldHaveErrors && actual.errors && actual.errors.length > 0) {
      errors.push(`Expected no errors, but found: ${actual.errors.join(", ")}`);
    }

    // Check specific error messages
    if (expected.expectedErrors && actual.errors) {
      for (const expectedError of expected.expectedErrors) {
        const found = actual.errors.some(error => error.includes(expectedError));
        if (!found) {
          errors.push(`Expected error containing "${expectedError}" not found`);
        }
      }
    }

    // Check decoded data fields
    if (expected.expectedDecodedFields && actual.decodedData) {
      for (const field of expected.expectedDecodedFields) {
        if (!(field in actual.decodedData)) {
          errors.push(`Expected decoded data field "${field}" not found`);
        }
      }
    }

    return {
      passed: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate test report from results
   */
  private generateReport(results: TestResult[]): TestReport {
    const summary = {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      skipped: 0, // TODO: Track skipped tests
      duration: results.reduce((sum, r) => sum + r.duration, 0),
    };

    const categories: Record<string, { total: number; passed: number; failed: number }> = {};
    const chains: Record<string, { total: number; passed: number; failed: number }> = {};

    for (const result of results) {
      const scenario = result.scenario;
      
      // Process tags as categories
      if (scenario.tags) {
        for (const tag of scenario.tags) {
          if (!categories[tag]) {
            categories[tag] = { total: 0, passed: 0, failed: 0 };
          }
          categories[tag].total++;
          if (result.passed) {
            categories[tag].passed++;
          } else {
            categories[tag].failed++;
          }
        }
      }

      // Process chains
      const chainId = scenario.chainId;
      if (!chains[chainId]) {
        chains[chainId] = { total: 0, passed: 0, failed: 0 };
      }
      chains[chainId].total++;
      if (result.passed) {
        chains[chainId].passed++;
      } else {
        chains[chainId].failed++;
      }
    }

    return {
      summary,
      categories,
      chains: chains as any,
      results,
      coverage: {
        scenarios: this.config.scenarios.length,
        patterns: Object.keys(this.config.patterns).length,
        chains: [...new Set(results.map(r => r.scenario.chainId))],
        modes: [...new Set(results.map(r => r.scenario.intent.mode))],
      },
    };
  }

  /**
   * Get configuration statistics
   */
  getConfigStats() {
    return {
      scenarios: this.config.scenarios.length,
      patterns: Object.keys(this.config.patterns).length,
      realTransactions: Object.keys(this.config.realTransactions).length,
      chains: [...new Set(this.config.scenarios.map(s => s.chainId))],
      modes: [...new Set(this.config.scenarios.map(s => s.intent.mode))],
    };
  }
}