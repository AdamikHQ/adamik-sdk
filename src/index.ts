import { DecoderRegistry } from "./decoders/registry";
import { AdamikEncodeResponse, TransactionData, TransactionIntent, VerificationResult, VerificationError } from "./types";
import { AdamikEncodeResponseSchema, TransactionIntentSchema, Schemas } from "./schemas";
import { ErrorCollector, ErrorCode } from "./schemas/errors";
import { z } from "zod";

/**
 * Adamik SDK - Pure verification SDK for validating API responses
 * 
 * @example
 * ```typescript
 * const sdk = new AdamikSDK();
 * const result = await sdk.verify(apiResponse, originalIntent);
 * 
 * if (result.isValid) {
 *   // Safe to sign the transaction
 * } else {
 *   console.error('Validation failed:', result.errors);
 * }
 * ```
 */
export class AdamikSDK {
  private decoderRegistry: DecoderRegistry;

  constructor() {
    this.decoderRegistry = new DecoderRegistry();
  }

  /**
   * Verifies that an Adamik API response matches the original transaction intent
   * 
   * @param apiResponse The response from Adamik API encode endpoint
   * @param originalIntent The original transaction intent sent to the API
   * @returns Verification result with validation status and any errors
   * 
   * @example
   * ```typescript
   * const result = await sdk.verify(apiResponse, {
   *   mode: 'transfer',
   *   recipientAddress: '0x...',
   *   amount: '1000000000000000000'
   * });
   * ```
   */
  async verify(
    apiResponse: unknown,
    originalIntent: unknown
  ): Promise<VerificationResult> {
    const errorCollector = new ErrorCollector();

    try {
      // Step 1: Validate inputs using Zod schemas
      const intentValidation = TransactionIntentSchema.safeParse(originalIntent);
      if (!intentValidation.success) {
        errorCollector.addZodError(intentValidation.error, ErrorCode.INVALID_INTENT);
        return errorCollector.getResult();
      }

      const responseValidation = AdamikEncodeResponseSchema.safeParse(apiResponse);
      if (!responseValidation.success) {
        errorCollector.addZodError(responseValidation.error, ErrorCode.INVALID_API_RESPONSE);
        return errorCollector.getResult();
      }

      const validatedIntent = intentValidation.data;
      const validatedResponse = responseValidation.data;
      const { chainId, transaction } = validatedResponse;
      const { data, encoded } = transaction;

      // Step 2: Verify transaction mode matches
      if (data.mode !== validatedIntent.mode) {
        errorCollector.addFieldMismatch(
          ErrorCode.MODE_MISMATCH,
          "mode",
          validatedIntent.mode,
          data.mode
        );
      }

      // Step 3: Verify core transaction fields
      this.verifyTransactionFields(validatedIntent, data, errorCollector);

      // Step 4: Verify amounts (if not using max amount)
      if ('amount' in validatedIntent && validatedIntent.amount !== undefined) {
        if (!('useMaxAmount' in validatedIntent) || !validatedIntent.useMaxAmount) {
          if (data.amount !== validatedIntent.amount) {
            errorCollector.addFieldMismatch(
              ErrorCode.AMOUNT_MISMATCH,
              "amount",
              validatedIntent.amount,
              data.amount
            );
          }
        }
      }

      // Step 5: Decode and verify encoded transaction (encoded validation)
      let decodedRaw: unknown;
      if (encoded && encoded.length > 0 && encoded[0].raw) {
        try {
          const decoder = this.decoderRegistry.getDecoder(chainId, encoded[0].raw.format);
          if (decoder) {
            decodedRaw = await decoder.decode(encoded[0].raw.value);

            // Encoded validation: Compare decoded transaction with original intent
            this.verifyDecodedTransaction(decodedRaw, validatedIntent, data, errorCollector);
          } else {
            errorCollector.addError(
              ErrorCode.MISSING_DECODER,
              `No decoder available for ${chainId} with format ${encoded[0].raw.format}`,
              "error",
              { chainId, format: encoded[0].raw.format }
            );
          }
        } catch (decodeError) {
          errorCollector.addError(
            ErrorCode.DECODE_FAILED,
            `Failed to decode transaction: ${decodeError}`,
            "error",
            { error: String(decodeError) }
          );
        }
      }

      // Step 6: Return verification result
      return errorCollector.getResult({
        chainId,
        transaction: data,
        raw: decodedRaw,
      });
    } catch (error) {
      errorCollector.addError(
        ErrorCode.INVALID_API_RESPONSE,
        `Verification error: ${error}`,
        "error",
        { error: String(error) }
      );
      return errorCollector.getResult();
    }
  }

  /**
   * Verifies that the decoded transaction matches the original intent (encoded validation)
   * @param decodedTransaction The decoded transaction from the encoded data
   * @param originalIntent The original transaction intent
   * @param apiData The transaction data from API response
   * @param errorCollector The error collector instance
   */
  private verifyDecodedTransaction(
    decodedTransaction: unknown,
    originalIntent: TransactionIntent,
    apiData: TransactionData,
    errorCollector: ErrorCollector
  ): void {
    // Type guard for decoded transaction structure
    if (!decodedTransaction || typeof decodedTransaction !== "object") {
      errorCollector.addError(
        ErrorCode.INVALID_DECODED_STRUCTURE,
        "Decoded transaction has invalid structure",
        "error"
      );
      return;
    }

    const decoded = decodedTransaction as Record<string, unknown>;

    // Verify core decoded transaction fields
    this.verifyDecodedFields(decoded, originalIntent, errorCollector);
    
    // Cross-verify decoded transaction against API response data
    this.verifyCrossConsistency(decoded, apiData, errorCollector);
  }

  /**
   * Verifies core transaction fields between intent and API data
   */
  private verifyTransactionFields(
    originalIntent: TransactionIntent,
    data: TransactionData,
    errorCollector: ErrorCollector
  ): void {
    // Check common fields
    if (originalIntent.senderAddress !== undefined && data.senderAddress !== originalIntent.senderAddress) {
      errorCollector.addFieldMismatch(
        ErrorCode.SENDER_MISMATCH,
        "senderAddress",
        originalIntent.senderAddress,
        data.senderAddress
      );
    }

    // Check mode-specific fields
    const intent = originalIntent as any;
    const txData = data as any;
    
    if ('recipientAddress' in intent && intent.recipientAddress !== undefined && txData.recipientAddress !== intent.recipientAddress) {
      errorCollector.addFieldMismatch(
        ErrorCode.RECIPIENT_MISMATCH,
        "recipientAddress",
        intent.recipientAddress,
        txData.recipientAddress
      );
    }
    
    if ('validatorAddress' in intent && intent.validatorAddress !== undefined && txData.validatorAddress !== intent.validatorAddress) {
      errorCollector.addFieldMismatch(
        ErrorCode.VALIDATOR_MISMATCH,
        "validatorAddress",
        intent.validatorAddress,
        txData.validatorAddress
      );
    }
    
    if ('tokenId' in intent && intent.tokenId !== undefined && txData.tokenId !== intent.tokenId) {
      errorCollector.addFieldMismatch(
        ErrorCode.TOKEN_MISMATCH,
        "tokenId",
        intent.tokenId,
        txData.tokenId
      );
    }
  }

  /**
   * Verifies core decoded transaction fields against original intent
   */
  private verifyDecodedFields(
    decoded: Record<string, unknown>,
    originalIntent: TransactionIntent,
    errorCollector: ErrorCollector
  ): void {
    // Verify transaction mode
    if (decoded.mode !== originalIntent.mode) {
      errorCollector.addFieldMismatch(
        ErrorCode.MODE_MISMATCH,
        "mode",
        originalIntent.mode,
        String(decoded.mode)
      );
    }

    // Verify recipient address
    const intent = originalIntent as any;
    if ('recipientAddress' in intent && decoded.recipientAddress !== intent.recipientAddress) {
      errorCollector.addError(
        ErrorCode.CRITICAL_RECIPIENT_MISMATCH,
        `Critical: Decoded transaction recipient mismatch: expected ${intent.recipientAddress}, got ${decoded.recipientAddress}`,
        "critical",
        { expected: intent.recipientAddress, actual: String(decoded.recipientAddress) }
      );
    }

    // Verify amount (handle bigint vs string conversion)
    if ('amount' in intent && intent.amount && !('useMaxAmount' in intent && intent.useMaxAmount)) {
      const expectedAmount = BigInt(intent.amount);
      const decodedAmount =
        typeof decoded.amount === "bigint"
          ? decoded.amount
          : typeof decoded.amount === "string"
            ? BigInt(decoded.amount)
            : 0n;

      if (decodedAmount !== expectedAmount) {
        errorCollector.addError(
          ErrorCode.CRITICAL_AMOUNT_MISMATCH,
          `Critical: Decoded transaction amount mismatch: expected ${expectedAmount.toString()}, got ${decodedAmount.toString()}`,
          "critical",
          { expected: expectedAmount.toString(), actual: decodedAmount.toString() }
        );
      }
    }

    // Verify token ID for token transfers
    if ('tokenId' in intent && intent.tokenId && decoded.tokenId !== intent.tokenId) {
      errorCollector.addError(
        ErrorCode.CRITICAL_TOKEN_MISMATCH,
        `Critical: Decoded transaction token mismatch: expected ${intent.tokenId}, got ${decoded.tokenId}`,
        "critical",
        { expected: intent.tokenId, actual: String(decoded.tokenId) }
      );
    }
  }

  /**
   * Verifies consistency between decoded transaction and API response data
   */
  private verifyCrossConsistency(
    decoded: Record<string, unknown>,
    apiData: TransactionData,
    errorCollector: ErrorCollector
  ): void {
    if (decoded.recipientAddress !== apiData.recipientAddress) {
      errorCollector.addError(
        ErrorCode.DECODED_API_MISMATCH,
        `Warning: Decoded recipient (${decoded.recipientAddress}) doesn't match API data (${apiData.recipientAddress})`,
        "warning",
        { decoded: decoded.recipientAddress, apiData: apiData.recipientAddress }
      );
    }

    if (decoded.mode !== apiData.mode) {
      errorCollector.addError(
        ErrorCode.DECODED_API_MISMATCH,
        `Warning: Decoded mode (${decoded.mode}) doesn't match API data (${apiData.mode})`,
        "warning",
        { decoded: decoded.mode, apiData: apiData.mode }
      );
    }
  }

  /**
   * Compares two transaction data objects for equality
   * @param data1 First transaction data
   * @param data2 Second transaction data
   * @returns true if they match, false otherwise
   */
  compareTransactionData(data1: TransactionData, data2: TransactionData): boolean {
    const keysToCompare = [
      "mode",
      "senderAddress",
      "recipientAddress",
      "amount",
      "tokenId",
      "validatorAddress",
      "targetValidatorAddress",
    ] as const;

    return keysToCompare.every((key) => data1[key] === data2[key]);
  }
}

// Export main functions and types
export { DecoderRegistry } from "./decoders/registry";
export * from "./types";
export { Schemas } from "./schemas";

// Default export for convenience
export default AdamikSDK;
