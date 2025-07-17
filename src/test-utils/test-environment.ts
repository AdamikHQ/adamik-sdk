import { TestEnvironment } from "./types";

/**
 * Test environment configuration and utilities
 */
export class TestEnvironmentManager {
  private static instance: TestEnvironmentManager;
  private currentEnvironment: TestEnvironment;

  private constructor() {
    this.currentEnvironment = this.getDefaultEnvironment();
  }

  static getInstance(): TestEnvironmentManager {
    if (!TestEnvironmentManager.instance) {
      TestEnvironmentManager.instance = new TestEnvironmentManager();
    }
    return TestEnvironmentManager.instance;
  }

  /**
   * Get default test environment based on NODE_ENV and other factors
   */
  private getDefaultEnvironment(): TestEnvironment {
    const nodeEnv = process.env.NODE_ENV || 'test';
    const useRealAPI = process.env.USE_REAL_API === 'true';
    const runIntegration = process.env.RUN_INTEGRATION_TESTS === 'true';

    if (runIntegration && useRealAPI) {
      return this.getIntegrationEnvironment();
    } else if (useRealAPI) {
      return this.getE2EEnvironment();
    } else {
      return this.getUnitEnvironment();
    }
  }

  /**
   * Get unit test environment (mocked API calls)
   */
  getUnitEnvironment(): TestEnvironment {
    return {
      name: 'unit',
      useRealAPI: false,
      execution: {
        parallel: true,
        timeout: 10000,
        retries: 0
      }
    };
  }

  /**
   * Get integration test environment (real API calls with limited scenarios)
   */
  getIntegrationEnvironment(): TestEnvironment {
    return {
      name: 'integration',
      useRealAPI: true,
      apiConfig: {
        baseUrl: process.env.ADAMIK_API_BASE_URL || 'https://api.adamik.io',
        timeout: 30000,
        retries: 3
      },
      execution: {
        parallel: false,
        timeout: 60000,
        retries: 2
      }
    };
  }

  /**
   * Get E2E test environment (full real API testing)
   */
  getE2EEnvironment(): TestEnvironment {
    return {
      name: 'e2e',
      useRealAPI: true,
      apiConfig: {
        baseUrl: process.env.ADAMIK_API_BASE_URL || 'https://api.adamik.io',
        timeout: 60000,
        retries: 5
      },
      execution: {
        parallel: false,
        timeout: 120000,
        retries: 3
      }
    };
  }

  /**
   * Set current environment
   */
  setEnvironment(env: TestEnvironment): void {
    this.currentEnvironment = env;
  }

  /**
   * Get current environment
   */
  getCurrentEnvironment(): TestEnvironment {
    return this.currentEnvironment;
  }

  /**
   * Check if real API is available
   */
  isRealAPIAvailable(): boolean {
    return !!(process.env.ADAMIK_API_BASE_URL && process.env.ADAMIK_API_KEY);
  }

  /**
   * Check if environment supports real API calls
   */
  shouldUseRealAPI(): boolean {
    return this.currentEnvironment.useRealAPI && this.isRealAPIAvailable();
  }

  /**
   * Get environment-specific configuration
   */
  getEnvironmentConfig() {
    return {
      name: this.currentEnvironment.name,
      useRealAPI: this.shouldUseRealAPI(),
      execution: this.currentEnvironment.execution,
      apiConfig: this.currentEnvironment.apiConfig
    };
  }

  /**
   * Validate environment configuration
   */
  validateEnvironment(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const env = this.currentEnvironment;

    // Check API configuration if real API is requested
    if (env.useRealAPI) {
      if (!env.apiConfig?.baseUrl) {
        errors.push('API base URL is required for real API testing');
      }
      
      if (!process.env.ADAMIK_API_KEY) {
        errors.push('ADAMIK_API_KEY environment variable is required for real API testing');
      }
      
      if (env.apiConfig?.timeout && env.apiConfig.timeout < 1000) {
        errors.push('API timeout should be at least 1000ms');
      }
    }

    // Check execution configuration
    if (env.execution.timeout < 1000) {
      errors.push('Execution timeout should be at least 1000ms');
    }

    if (env.execution.retries < 0) {
      errors.push('Retry count cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Conditional test execution utilities
 */
export class ConditionalTest {
  private static envManager = TestEnvironmentManager.getInstance();

  /**
   * Execute tests only in unit environment
   */
  static describeUnit(name: string, tests: () => void): void {
    const env = this.envManager.getCurrentEnvironment();
    if (env.name === 'unit') {
      describe(`${name} (Unit)`, tests);
    } else {
      describe.skip(`${name} (Unit - Skipped in ${env.name})`, tests);
    }
  }

  /**
   * Execute tests only in integration environment
   */
  static describeIntegration(name: string, tests: () => void): void {
    const env = this.envManager.getCurrentEnvironment();
    if (env.name === 'integration' && this.envManager.shouldUseRealAPI()) {
      describe(`${name} (Integration)`, tests);
    } else {
      describe.skip(`${name} (Integration - Skipped)`, tests);
    }
  }

  /**
   * Execute tests only in E2E environment
   */
  static describeE2E(name: string, tests: () => void): void {
    const env = this.envManager.getCurrentEnvironment();
    if (env.name === 'e2e' && this.envManager.shouldUseRealAPI()) {
      describe(`${name} (E2E)`, tests);
    } else {
      describe.skip(`${name} (E2E - Skipped)`, tests);
    }
  }

  /**
   * Execute tests with real API only
   */
  static describeRealAPI(name: string, tests: () => void): void {
    if (this.envManager.shouldUseRealAPI()) {
      describe(`${name} (Real API)`, tests);
    } else {
      describe.skip(`${name} (Real API - Skipped)`, tests);
    }
  }

  /**
   * Execute tests with mocked API only
   */
  static describeMocked(name: string, tests: () => void): void {
    if (!this.envManager.shouldUseRealAPI()) {
      describe(`${name} (Mocked)`, tests);
    } else {
      describe.skip(`${name} (Mocked - Skipped)`, tests);
    }
  }

  /**
   * Skip tests based on environment
   */
  static skipInEnvironment(envName: string, testFn: () => void): void {
    const env = this.envManager.getCurrentEnvironment();
    if (env.name === envName) {
      console.log(`⏭️  Skipping test - not supported in ${envName} environment`);
      return;
    }
    testFn();
  }

  /**
   * Only run tests in specific environment
   */
  static onlyInEnvironment(envName: string, testFn: () => void): void {
    const env = this.envManager.getCurrentEnvironment();
    if (env.name !== envName) {
      console.log(`⏭️  Skipping test - only supported in ${envName} environment`);
      return;
    }
    testFn();
  }
}

/**
 * Test timing utilities
 */
export class TestTiming {
  private static timers = new Map<string, number>();

  /**
   * Start timing a test operation
   */
  static start(key: string): void {
    this.timers.set(key, Date.now());
  }

  /**
   * Stop timing and get duration
   */
  static stop(key: string): number {
    const start = this.timers.get(key);
    if (!start) {
      throw new Error(`Timer '${key}' not found`);
    }
    const duration = Date.now() - start;
    this.timers.delete(key);
    return duration;
  }

  /**
   * Measure execution time of a function
   */
  static async measure<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = Date.now();
    const result = await operation();
    const duration = Date.now() - start;
    return { result, duration };
  }

  /**
   * Assert operation completes within timeout
   */
  static async assertWithinTimeout<T>(operation: () => Promise<T>, timeout: number, message?: string): Promise<T> {
    const { result, duration } = await this.measure(operation);
    
    if (duration > timeout) {
      throw new Error(message || `Operation took ${duration}ms, expected less than ${timeout}ms`);
    }
    
    return result;
  }
}

// Export singleton instance
export const testEnvironment = TestEnvironmentManager.getInstance();