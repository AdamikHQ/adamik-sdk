import { z } from "zod";

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
    raw?: unknown;
  };
}

/**
 * Helper class for collecting errors during validation
 */
export class ErrorCollector {
  private errors: VerificationError[] = [];
  
  addError(
    code: ErrorCode,
    message: string,
    severity: ErrorSeverity = "error",
    context?: VerificationError["context"]
  ): void {
    this.errors.push({ code, severity, message, context });
  }
  
  addFieldMismatch(
    code: ErrorCode,
    field: string,
    expected: string | undefined,
    actual: string | undefined,
    severity: ErrorSeverity = "error"
  ): void {
    if (expected !== actual) {
      this.errors.push({
        code,
        severity,
        field,
        message: `${field} mismatch: expected ${expected}, got ${actual}`,
        context: { expected, actual },
      });
    }
  }
  
  addZodError(error: z.ZodError, code: ErrorCode): void {
    error.errors.forEach((issue) => {
      this.errors.push({
        code,
        severity: "error",
        message: issue.message,
        field: issue.path.join("."),
        context: {
          path: issue.path,
          type: issue.code,
        },
      });
    });
  }
  
  hasErrors(): boolean {
    return this.errors.length > 0;
  }
  
  hasCriticalErrors(): boolean {
    return this.errors.some((e) => e.severity === "critical");
  }
  
  getResult(decodedData?: VerificationResult["decodedData"]): VerificationResult {
    const errors = this.errors.filter((e) => e.severity === "error");
    const warnings = this.errors.filter((e) => e.severity === "warning");
    const criticalErrors = this.errors.filter((e) => e.severity === "critical");
    
    return {
      isValid: errors.length === 0 && criticalErrors.length === 0,
      errors: errors.length > 0 ? errors : [],
      warnings: warnings.length > 0 ? warnings : [],
      criticalErrors: criticalErrors.length > 0 ? criticalErrors : [],
      decodedData,
    };
  }
}