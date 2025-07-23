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

/**
 * Helper class for collecting errors during validation
 */
export class ErrorCollector {
  private errors: VerificationError[] = [];
  private errorKeys = new Set<string>();
  
  /**
   * Generate a unique key for error deduplication
   */
  private getErrorKey(error: VerificationError): string {
    return `${error.code}:${error.field || ''}:${error.severity}:${error.context?.expected || ''}:${error.context?.actual || ''}`;
  }
  
  /**
   * Get recovery strategy for an error code
   */
  private getRecoveryStrategy(code: ErrorCode, severity: ErrorSeverity): string | undefined {
    switch (code) {
      case ErrorCode.MISSING_DECODER:
        return 'This blockchain may not be fully supported yet. Consider implementing a custom decoder or checking if the chain ID and format are correct.';
      
      case ErrorCode.INVALID_API_RESPONSE:
      case ErrorCode.INVALID_INTENT:
        return 'Check that your data matches the expected format for this blockchain. Refer to the documentation for valid field values.';
      
      case ErrorCode.DECODE_FAILED:
      case ErrorCode.INVALID_DECODED_STRUCTURE:
        return 'The encoded transaction data may be corrupted or in an unexpected format. Verify the transaction was encoded correctly.';
      
      case ErrorCode.CRITICAL_RECIPIENT_MISMATCH:
      case ErrorCode.CRITICAL_AMOUNT_MISMATCH:
      case ErrorCode.CRITICAL_TOKEN_MISMATCH:
      case ErrorCode.CRITICAL_VALIDATOR_MISMATCH:
        return 'SECURITY ALERT: Do not sign this transaction! The encoded data does not match your intent. This could be a malicious API response.';
      
      case ErrorCode.MODE_MISMATCH:
      case ErrorCode.SENDER_MISMATCH:
      case ErrorCode.RECIPIENT_MISMATCH:
      case ErrorCode.AMOUNT_MISMATCH:
      case ErrorCode.TOKEN_MISMATCH:
      case ErrorCode.VALIDATOR_MISMATCH:
        return severity === 'critical' 
          ? 'SECURITY ALERT: Do not sign this transaction! Critical field mismatch detected.'
          : 'Some fields in the API response do not match your original intent. Review the differences and ensure they are acceptable.';
      
      case ErrorCode.DECODED_API_MISMATCH:
        return 'The decoded transaction data does not match the API response. This could indicate data corruption or encoding issues.';
      
      default:
        return undefined;
    }
  }
  
  addError(
    code: ErrorCode,
    message: string,
    severity: ErrorSeverity = "error",
    context?: VerificationError["context"]
  ): void {
    const recoveryStrategy = this.getRecoveryStrategy(code, severity);
    const error: VerificationError = { 
      code, 
      severity, 
      message, 
      context,
      ...(recoveryStrategy && { recoveryStrategy })
    };
    const key = this.getErrorKey(error);
    
    // Deduplicate errors
    if (!this.errorKeys.has(key)) {
      this.errorKeys.add(key);
      this.errors.push(error);
    }
  }
  
  addFieldMismatch(
    code: ErrorCode,
    field: string,
    expected: string | undefined,
    actual: string | undefined,
    severity: ErrorSeverity = "error"
  ): void {
    if (expected !== actual) {
      const recoveryStrategy = this.getRecoveryStrategy(code, severity);
      const error: VerificationError = {
        code,
        severity,
        field,
        message: `${field} mismatch: expected ${expected}, got ${actual}`,
        context: { expected, actual },
        ...(recoveryStrategy && { recoveryStrategy })
      };
      const key = this.getErrorKey(error);
      
      // Deduplicate errors
      if (!this.errorKeys.has(key)) {
        this.errorKeys.add(key);
        this.errors.push(error);
      }
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
  
  /**
   * Group errors by field for better context
   */
  private groupErrorsByField(errors: VerificationError[]): Map<string, VerificationError[]> {
    const grouped = new Map<string, VerificationError[]>();
    
    errors.forEach(error => {
      const field = error.field || 'general';
      if (!grouped.has(field)) {
        grouped.set(field, []);
      }
      grouped.get(field)!.push(error);
    });
    
    return grouped;
  }
  
  getResult(decodedData?: VerificationResult["decodedData"]): VerificationResult {
    const errors = this.errors.filter((e) => e.severity === "error");
    const warnings = this.errors.filter((e) => e.severity === "warning");
    const criticalErrors = this.errors.filter((e) => e.severity === "critical");
    
    // Add context aggregation for related errors
    const errorsByField = this.groupErrorsByField(this.errors);
    
    // Add field grouping info to errors that have multiple issues
    errorsByField.forEach((fieldErrors, _field) => {
      if (fieldErrors.length > 1) {
        fieldErrors.forEach(error => {
          if (!error.context) error.context = {};
          error.context.relatedErrors = fieldErrors.length - 1;
        });
      }
    });
    
    return {
      isValid: errors.length === 0 && criticalErrors.length === 0,
      errors: errors.length > 0 ? errors : [],
      warnings: warnings.length > 0 ? warnings : [],
      criticalErrors: criticalErrors.length > 0 ? criticalErrors : [],
      decodedData,
    };
  }
}