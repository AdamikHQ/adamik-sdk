import { AdamikEncodeResponse, ChainId, TransactionIntent, TransactionData, EncodedTransaction } from "../types";

/**
 * Configuration for a single test scenario
 */
export interface TestScenario {
  /** Unique identifier for the scenario */
  id: string;
  /** Human-readable name for the scenario */
  name: string;
  /** Detailed description of what this scenario tests */
  description?: string;
  /** The blockchain this scenario targets */
  chainId: ChainId;
  /** The original transaction intent */
  intent: TransactionIntent;
  /** Override specific parts of the API response */
  apiResponse?: Partial<TestApiResponse>;
  /** Expected verification results */
  expectedResult: TestExpectedResult;
  /** Tags for categorizing and filtering tests */
  tags?: string[];
  /** Skip this scenario during test execution */
  skip?: boolean;
  /** Override for specific test environments */
  environments?: ("unit" | "integration" | "e2e")[];
}

/**
 * API response structure for test scenarios
 */
export interface TestApiResponse {
  chainId?: ChainId;
  transaction?: {
    data?: Partial<TransactionData>;
    encoded?: Partial<EncodedTransaction>[];
  };
}

/**
 * Expected results for a test scenario
 */
export interface TestExpectedResult {
  /** Whether the verification should pass */
  isValid: boolean;
  /** Whether errors should be present */
  shouldHaveErrors: boolean;
  /** Specific error messages that should be present */
  expectedErrors?: string[];
  /** Expected warning messages */
  expectedWarnings?: string[];
  /** Specific fields that should be present in decoded data */
  expectedDecodedFields?: string[];
  /** Custom validation function */
  customValidation?: string; // Function name to call for custom validation
}

/**
 * Attack pattern definition for security testing
 */
export interface TestPattern {
  /** Unique identifier for the pattern */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of the attack or edge case */
  description: string;
  /** How to modify the base scenario */
  modifications: TestPatternModifications;
  /** Expected results when pattern is applied */
  expectedErrors: string[];
  /** Severity level of the issue this pattern tests */
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  /** Categories this pattern belongs to */
  categories: string[];
}

/**
 * Modifications to apply to a base scenario
 */
export interface TestPatternModifications {
  /** Modify the encoded transaction recipient */
  encodedRecipient?: string;
  /** Modify the encoded transaction amount */
  encodedAmount?: string;
  /** Modify the encoded transaction mode */
  encodedMode?: string;
  /** Modify the encoded transaction token ID */
  encodedTokenId?: string;
  /** Modify the API response data recipient */
  apiDataRecipient?: string;
  /** Modify the API response data amount */
  apiDataAmount?: string;
  /** Modify the API response data mode */
  apiDataMode?: string;
  /** Replace the entire encoded transaction */
  replaceEncodedTransaction?: string;
  /** Add or modify arbitrary fields */
  customModifications?: Record<string, unknown>;
}

/**
 * Real transaction data for testing
 */
export interface RealTransactionData {
  /** Chain this transaction belongs to */
  chainId: ChainId;
  /** Type of transaction */
  type: "transfer" | "transferToken" | "stake" | "unstake" | "complex";
  /** RLP or other encoded format */
  encoded: string;
  /** Format of the encoded data */
  format: "RLP" | "PSBT" | "RAW_TRANSACTION";
  /** Decoded representation for validation */
  decoded: {
    recipientAddress: string;
    amount: string;
    mode: string;
    tokenId?: string;
  };
  /** Description of this transaction */
  description?: string;
  /** Source URL or reference */
  source?: string;
}

/**
 * Complete test configuration
 */
export interface TestConfiguration {
  /** Configuration format version */
  version: string;
  /** Metadata about this configuration */
  metadata: {
    name: string;
    description: string;
    author?: string;
    created: string;
    updated?: string;
  };
  /** Test scenarios */
  scenarios: TestScenario[];
  /** Attack patterns */
  patterns: Record<string, TestPattern>;
  /** Real transaction data */
  realTransactions: Record<string, RealTransactionData>;
  /** Global configuration */
  config: {
    /** Default timeout for tests */
    defaultTimeout?: number;
    /** Parallel execution settings */
    parallel?: boolean;
    /** Retry settings */
    retry?: {
      attempts: number;
      delay: number;
    };
  };
}

/**
 * Test execution result
 */
export interface TestResult {
  /** The scenario that was executed */
  scenario: TestScenario;
  /** Whether the test passed */
  passed: boolean;
  /** Execution time in milliseconds */
  duration: number;
  /** Any errors encountered */
  errors?: string[];
  /** Actual verification result */
  actualResult?: {
    isValid: boolean;
    errors?: string[];
    decodedData?: unknown;
  };
  /** Additional metadata */
  metadata?: {
    executedAt: string;
    environment: string;
    chainId: ChainId;
  };
}

/**
 * Test execution report
 */
export interface TestReport {
  /** Summary statistics */
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  };
  /** Results by category */
  categories: Record<string, {
    total: number;
    passed: number;
    failed: number;
  }>;
  /** Results by chain */
  chains: Record<ChainId, {
    total: number;
    passed: number;
    failed: number;
  }>;
  /** Individual test results */
  results: TestResult[];
  /** Coverage analysis */
  coverage: {
    scenarios: number;
    patterns: number;
    chains: ChainId[];
    modes: string[];
  };
}

/**
 * Validation result for configuration
 */
export interface ConfigValidationResult {
  /** Whether the configuration is valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
  /** Statistics about the configuration */
  stats: {
    totalScenarios: number;
    totalPatterns: number;
    totalRealTransactions: number;
    chainsSupported: ChainId[];
    modesSupported: string[];
  };
}

/**
 * Test environment configuration
 */
export interface TestEnvironment {
  /** Environment name */
  name: "unit" | "integration" | "e2e";
  /** Whether to use real API calls */
  useRealAPI: boolean;
  /** API configuration */
  apiConfig?: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  /** Test execution settings */
  execution: {
    parallel: boolean;
    timeout: number;
    retries: number;
  };
}