import { z } from "zod";
import { ErrorCode, ErrorSeverity, VerificationError, VerificationResult } from "../schemas/errors";

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
    return `${error.code}:${error.context?.field || ""}:${error.severity}:${error.context?.expected || ""}:${error.context?.actual || ""}`;
  }

  /**
   * Get recovery strategy for an error code
   */
  private getRecoveryStrategy(code: ErrorCode, severity: ErrorSeverity): string | undefined {
    switch (code) {
      case ErrorCode.MISSING_DECODER:
        return "This blockchain may not be fully supported yet. Consider implementing a custom decoder or checking if the chain ID and format are correct.";

      case ErrorCode.INVALID_API_RESPONSE:
      case ErrorCode.INVALID_INTENT:
        return "Check that your data matches the expected format for this blockchain. Refer to the documentation for valid field values.";

      case ErrorCode.DECODE_FAILED:
      case ErrorCode.INVALID_DECODED_STRUCTURE:
        return "The encoded transaction data may be corrupted or in an unexpected format. Verify the transaction was encoded correctly.";

      case ErrorCode.CRITICAL_CHAIN_MISMATCH:
        return "SECURITY ALERT: Do not sign this transaction! The transaction is for a different blockchain network than expected.";

      case ErrorCode.CRITICAL_RECIPIENT_MISMATCH:
      case ErrorCode.CRITICAL_AMOUNT_MISMATCH:
      case ErrorCode.CRITICAL_TOKEN_MISMATCH:
      case ErrorCode.CRITICAL_VALIDATOR_MISMATCH:
        return "SECURITY ALERT: Do not sign this transaction! The encoded data does not match your intent. This could be a malicious API response.";

      case ErrorCode.MODE_MISMATCH:
      case ErrorCode.SENDER_MISMATCH:
      case ErrorCode.RECIPIENT_MISMATCH:
      case ErrorCode.AMOUNT_MISMATCH:
      case ErrorCode.TOKEN_MISMATCH:
      case ErrorCode.VALIDATOR_MISMATCH:
        return severity === "critical"
          ? "SECURITY ALERT: Do not sign this transaction! Critical field mismatch detected."
          : "Some fields in the API response do not match your original intent. Review the differences and ensure they are acceptable.";

      case ErrorCode.DECODED_API_MISMATCH:
        return "The decoded transaction data does not match the API response. This could indicate data corruption or encoding issues.";

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
      ...(recoveryStrategy && { recoveryStrategy }),
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
        message: `${field} mismatch: expected ${expected}, got ${actual}`,
        context: { field, expected, actual },
        ...(recoveryStrategy && { recoveryStrategy }),
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
