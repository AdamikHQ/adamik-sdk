import { ScenarioRunner } from "./scenario-runner";
import { 
  TestScenario, 
  TestPattern, 
  TestConfiguration, 
  TestResult, 
  TestPatternModifications,
  TestEnvironment 
} from "./types";

/**
 * Runner for applying attack patterns to base scenarios
 */
export class PatternRunner {
  private scenarioRunner: ScenarioRunner;
  private config!: TestConfiguration; // Will be initialized in initialize method

  constructor(configPath: string, environment: TestEnvironment) {
    this.scenarioRunner = new ScenarioRunner(configPath, environment);
  }

  /**
   * Initialize the pattern runner
   */
  async initialize(): Promise<void> {
    await this.scenarioRunner.loadConfiguration();
    this.config = (this.scenarioRunner as any).config; // Access private config
  }

  /**
   * Run a specific pattern against a base scenario
   */
  async runPattern(patternId: string, baseScenarioId: string): Promise<TestResult> {
    const pattern = this.config.patterns[patternId];
    if (!pattern) {
      throw new Error(`Pattern '${patternId}' not found in configuration`);
    }

    const baseScenario = this.config.scenarios.find(s => s.id === baseScenarioId);
    if (!baseScenario) {
      throw new Error(`Base scenario '${baseScenarioId}' not found in configuration`);
    }

    console.log(`🎭 Applying pattern: ${pattern.name} to scenario: ${baseScenario.name}`);

    // Apply pattern modifications to create a new scenario
    const modifiedScenario = this.applyPattern(baseScenario, pattern);

    // Run the modified scenario
    return await this.scenarioRunner.runScenario(modifiedScenario);
  }

  /**
   * Run all patterns against a base scenario
   */
  async runAllPatterns(baseScenarioId: string): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const patternIds = Object.keys(this.config.patterns);

    console.log(`🎭 Running ${patternIds.length} patterns against base scenario: ${baseScenarioId}`);

    for (const patternId of patternIds) {
      try {
        const result = await this.runPattern(patternId, baseScenarioId);
        results.push(result);
      } catch (error) {
        console.error(`❌ Failed to run pattern ${patternId}: ${error}`);
        
        // Create a failed test result
        const failedResult: TestResult = {
          scenario: {
            id: `${baseScenarioId}-${patternId}`,
            name: `Pattern: ${patternId}`,
            chainId: this.config.scenarios.find(s => s.id === baseScenarioId)?.chainId || 'ethereum',
            intent: {},
            expectedResult: { isValid: false, shouldHaveErrors: true }
          } as TestScenario,
          passed: false,
          duration: 0,
          errors: [`Pattern execution failed: ${error}`],
          metadata: {
            executedAt: new Date().toISOString(),
            environment: 'unit',
            chainId: 'ethereum'
          }
        };
        
        results.push(failedResult);
      }
    }

    return results;
  }

  /**
   * Run patterns by category
   */
  async runPatternsByCategory(category: string, baseScenarioId: string): Promise<TestResult[]> {
    const matchingPatterns = Object.entries(this.config.patterns)
      .filter(([_, pattern]) => pattern.categories.includes(category))
      .map(([id, _]) => id);

    console.log(`🎭 Running ${matchingPatterns.length} patterns in category '${category}'`);

    const results: TestResult[] = [];
    for (const patternId of matchingPatterns) {
      const result = await this.runPattern(patternId, baseScenarioId);
      results.push(result);
    }

    return results;
  }

  /**
   * Run patterns by severity level
   */
  async runPatternsBySeverity(severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW", baseScenarioId: string): Promise<TestResult[]> {
    const matchingPatterns = Object.entries(this.config.patterns)
      .filter(([_, pattern]) => pattern.severity === severity)
      .map(([id, _]) => id);

    console.log(`🎭 Running ${matchingPatterns.length} patterns with severity '${severity}'`);

    const results: TestResult[] = [];
    for (const patternId of matchingPatterns) {
      const result = await this.runPattern(patternId, baseScenarioId);
      results.push(result);
    }

    return results;
  }

  /**
   * Apply a pattern to a base scenario
   */
  private applyPattern(baseScenario: TestScenario, pattern: TestPattern): TestScenario {
    // Deep clone the base scenario
    const modifiedScenario: TestScenario = JSON.parse(JSON.stringify(baseScenario));

    // Update scenario metadata
    modifiedScenario.id = `${baseScenario.id}-${pattern.id}`;
    modifiedScenario.name = `${baseScenario.name} - ${pattern.name}`;
    modifiedScenario.description = `${baseScenario.description || ''} | Applied pattern: ${pattern.description}`;
    modifiedScenario.tags = [...(baseScenario.tags || []), 'pattern-applied', pattern.id, ...pattern.categories];

    // Apply pattern modifications
    modifiedScenario.apiResponse = modifiedScenario.apiResponse || {};
    modifiedScenario.apiResponse.transaction = modifiedScenario.apiResponse.transaction || {};
    modifiedScenario.apiResponse.transaction.data = modifiedScenario.apiResponse.transaction.data || {};
    modifiedScenario.apiResponse.transaction.encoded = modifiedScenario.apiResponse.transaction.encoded || [{}];

    const modifications = pattern.modifications;

    // Apply API data modifications
    if (modifications.apiDataRecipient) {
      modifiedScenario.apiResponse.transaction.data.recipientAddress = modifications.apiDataRecipient;
    }
    if (modifications.apiDataAmount) {
      modifiedScenario.apiResponse.transaction.data.amount = modifications.apiDataAmount;
    }
    if (modifications.apiDataMode) {
      modifiedScenario.apiResponse.transaction.data.mode = modifications.apiDataMode as any;
    }

    // Apply encoded transaction modifications
    if (modifications.encodedRecipient || modifications.encodedAmount || modifications.encodedMode || modifications.encodedTokenId) {
      // These modifications need to be applied to the actual encoded data
      // For now, we'll use a special marker that the test runner can interpret
      modifiedScenario.apiResponse.transaction.encoded[0].raw = {
        format: "RLP",
        value: this.generateModifiedEncodedData(baseScenario, modifications)
      };
    }

    if (modifications.replaceEncodedTransaction) {
      modifiedScenario.apiResponse.transaction.encoded[0].raw = {
        format: "RLP",
        value: modifications.replaceEncodedTransaction
      };
    }

    // Apply custom modifications
    if (modifications.customModifications) {
      for (const [key, value] of Object.entries(modifications.customModifications)) {
        (modifiedScenario.apiResponse as any)[key] = value;
      }
    }

    // Update expected results
    modifiedScenario.expectedResult = {
      isValid: false,
      shouldHaveErrors: true,
      expectedErrors: pattern.expectedErrors
    };

    return modifiedScenario;
  }

  /**
   * Generate modified encoded data based on pattern modifications
   */
  private generateModifiedEncodedData(baseScenario: TestScenario, modifications: TestPatternModifications): string {
    // For EVM chains, we need to create a real RLP transaction with the modified data
    if (baseScenario.chainId === 'ethereum' || baseScenario.chainId === 'polygon' || baseScenario.chainId === 'bsc') {
      return this.createModifiedEVMTransaction(baseScenario, modifications);
    }

    // For other chains, use the original encoded data as fallback
    const realDataKey = `${baseScenario.chainId}-${baseScenario.intent.mode}`;
    const realData = this.config.realTransactions[realDataKey];
    
    if (realData) {
      return realData.encoded;
    }

    // Default RLP transaction
    return "0xf86c098504a817c800825208943535353535353535353535353535353535353535880de0b6b3a76400008025a028ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276a067cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83";
  }

  /**
   * Create a modified EVM transaction for pattern testing
   */
  private createModifiedEVMTransaction(baseScenario: TestScenario, modifications: TestPatternModifications): string {
    // This is a simplified implementation
    // In a real implementation, you would use libraries like ethers.js to construct valid RLP transactions
    
    const baseRecipient = baseScenario.intent.recipientAddress || "0x3535353535353535353535353535353535353535";
    const baseAmount = baseScenario.intent.amount || "1000000000000000000";

    const modifiedRecipient = modifications.encodedRecipient || baseRecipient;
    const modifiedAmount = modifications.encodedAmount || baseAmount;

    // Create different RLP transactions based on the recipient
    const transactions: Record<string, string> = {
      "0x1111111111111111111111111111111111111111": "0xf86c098504a817c800825208941111111111111111111111111111111111111111880de0b6b3a76400008025a028ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276a067cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83",
      "0x2222222222222222222222222222222222222222": "0xf86c098504a817c800825208942222222222222222222222222222222222222222880de0b6b3a76400008025a028ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276a067cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83",
      "0x3333333333333333333333333333333333333333": "0xf86c098504a817c800825208943333333333333333333333333333333333333333880de0b6b3a76400008025a028ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276a067cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83",
      "0x4444444444444444444444444444444444444444": "0xf86c098504a817c800825208944444444444444444444444444444444444444444880de0b6b3a76400008025a028ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276a067cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83",
      "0x5555555555555555555555555555555555555555": "0xf86c098504a817c800825208945555555555555555555555555555555555555555880de0b6b3a76400008025a028ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276a067cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83"
    };

    // Return the modified transaction or the original as fallback
    return transactions[modifiedRecipient] || transactions[baseRecipient] || "0xf86c098504a817c800825208943535353535353535353535353535353535353535880de0b6b3a76400008025a028ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276a067cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83";
  }

  /**
   * Get available patterns by category
   */
  getPatternsByCategory(): Record<string, string[]> {
    const categories: Record<string, string[]> = {};
    
    for (const [patternId, pattern] of Object.entries(this.config.patterns)) {
      for (const category of pattern.categories) {
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(patternId);
      }
    }
    
    return categories;
  }

  /**
   * Get available patterns by severity
   */
  getPatternsBySeverity(): Record<string, string[]> {
    const severities: Record<string, string[]> = {
      CRITICAL: [],
      HIGH: [],
      MEDIUM: [],
      LOW: []
    };
    
    for (const [patternId, pattern] of Object.entries(this.config.patterns)) {
      severities[pattern.severity].push(patternId);
    }
    
    return severities;
  }

  /**
   * Get pattern statistics
   */
  getPatternStats() {
    const patterns = Object.values(this.config.patterns);
    
    return {
      total: patterns.length,
      bySeverity: {
        CRITICAL: patterns.filter(p => p.severity === 'CRITICAL').length,
        HIGH: patterns.filter(p => p.severity === 'HIGH').length,
        MEDIUM: patterns.filter(p => p.severity === 'MEDIUM').length,
        LOW: patterns.filter(p => p.severity === 'LOW').length
      },
      byCategory: this.getPatternsByCategory(),
      categories: [...new Set(patterns.flatMap(p => p.categories))]
    };
  }
}