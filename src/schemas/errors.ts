/**
 * Error codes and types for validation failures
 * This file contains only type definitions and enums, no functions or classes
 */

/**
 * Error codes for different validation failures
 */
export enum ErrorCode {
  // Structure validation errors
  INVALID_API_RESPONSE = "INVALID_API_RESPONSE",
  INVALID_INTENT = "INVALID_INTENT",
  MISSING_DECODER = "MISSING_DECODER",
  DECODE_FAILED = "DECODE_FAILED",
  INVALID_DECODED_STRUCTURE = "INVALID_DECODED_STRUCTURE",
  
  // Field mismatch errors
  MODE_MISMATCH = "MODE_MISMATCH",
  SENDER_MISMATCH = "SENDER_MISMATCH",
  RECIPIENT_MISMATCH = "RECIPIENT_MISMATCH",
  AMOUNT_MISMATCH = "AMOUNT_MISMATCH",
  TOKEN_MISMATCH = "TOKEN_MISMATCH",
  VALIDATOR_MISMATCH = "VALIDATOR_MISMATCH",
  
  // Critical security errors
  CRITICAL_RECIPIENT_MISMATCH = "CRITICAL_RECIPIENT_MISMATCH",
  CRITICAL_AMOUNT_MISMATCH = "CRITICAL_AMOUNT_MISMATCH",
  CRITICAL_TOKEN_MISMATCH = "CRITICAL_TOKEN_MISMATCH",
  CRITICAL_VALIDATOR_MISMATCH = "CRITICAL_VALIDATOR_MISMATCH",
  
  // Cross-validation warnings
  DECODED_API_MISMATCH = "DECODED_API_MISMATCH",
}

/**
 * Error severity levels
 */
export type ErrorSeverity = "error" | "warning" | "critical";

/**
 * Enhanced error structure with context
 */
export interface VerificationError {
  code: ErrorCode;
  severity: ErrorSeverity;
  message: string;
  field?: string;
  recoveryStrategy?: string;
  context?: {
    expected?: string;
    actual?: string;
    chainId?: string;
    format?: string;
    [key: string]: unknown;
  };
}

/**
 * Verification result with enhanced error reporting
 */
export interface VerificationResult {
  isValid: boolean;
  errors: VerificationError[];
  warnings: VerificationError[];
  criticalErrors: VerificationError[];
  decodedData?: {
    chainId: string;
    transaction: unknown;
    chainSpecificData?: unknown;
  };
}

