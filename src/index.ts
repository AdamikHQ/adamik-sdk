import { DecoderRegistry } from "./decoders/registry";
import { AdamikEncodeResponse, TransactionData, TransactionIntent, VerificationResult } from "./types";
import { AdamikEncodeResponseSchema, TransactionIntentSchema, Schemas } from "./schemas";
import { ErrorCollector, ErrorCode } from "./schemas/errors";
import { DecoderWithPlaceholder } from "./decoders/base";
import { z } from "zod";
import { getAddress } from "viem";

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
   * Checks if a chain is EVM-based
   */
  private isEVMChain(chainId: string): boolean {
    const evmChains = [
      "ethereum", "polygon", "bsc", "avalanche", "arbitrum", 
      "optimism", "fantom", "cronos", "moonbeam", "celo"
    ];
    return evmChains.includes(chainId.toLowerCase());
  }

  /**
   * Normalizes addresses for comparison based on chain type
   */
  private normalizeAddress(address: string, chainId: string): string {
    if (!address) return address;
    
    if (this.isEVMChain(chainId)) {
      try {
        // For EVM chains, use checksummed address format for consistent comparison
        return getAddress(address);
      } catch {
        // If not a valid address, return as-is
        return address;
      }
    }
    
    // For non-EVM chains, return as-is
    return address;
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
      this.verifyTransactionFields(validatedIntent, data, errorCollector, chainId);

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

            // Skip encoded validation for placeholder decoders
            const decoderWithPlaceholder = decoder as DecoderWithPlaceholder;
            if (decoderWithPlaceholder.isPlaceholder) {
              // For placeholder decoders, we only do intent validation (already done above)
              // Add a warning to indicate this is a placeholder
              errorCollector.addError(
                ErrorCode.MISSING_DECODER,
                `Using placeholder decoder for ${chainId} - encoded validation skipped`,
                "warning"
              );
            } else {
              // Encoded validation: Compare decoded transaction with original intent
              this.verifyDecodedTransaction(decodedRaw, validatedIntent, data, errorCollector, chainId);
            }
          } else {
            errorCollector.addError(
              ErrorCode.MISSING_DECODER,
              `No decoder available for ${chainId} with format ${encoded[0].raw.format}`,
              "warning",
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
   * @param chainId The blockchain identifier
   */
  private verifyDecodedTransaction(
    decodedTransaction: unknown,
    originalIntent: TransactionIntent,
    apiData: TransactionData,
    errorCollector: ErrorCollector,
    chainId: string
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
    this.verifyDecodedFields(decoded, originalIntent, errorCollector, chainId);
    
    // Cross-verify decoded transaction against API response data
    this.verifyCrossConsistency(decoded, apiData, errorCollector, chainId);
  }

  /**
   * Verifies core transaction fields between intent and API data
   */
  private verifyTransactionFields(
    originalIntent: TransactionIntent,
    data: TransactionData,
    errorCollector: ErrorCollector,
    chainId: string
  ): void {
    // Check common fields with normalized addresses for EVM chains
    if (originalIntent.senderAddress !== undefined) {
      const normalizedIntentSender = this.normalizeAddress(originalIntent.senderAddress, chainId);
      const normalizedDataSender = this.normalizeAddress(data.senderAddress || '', chainId);
      
      if (normalizedDataSender !== normalizedIntentSender) {
        errorCollector.addFieldMismatch(
          ErrorCode.SENDER_MISMATCH,
          "senderAddress",
          originalIntent.senderAddress,
          data.senderAddress
        );
      }
    }

    // Check mode-specific fields
    const intent = originalIntent as any;
    const txData = data as any;
    
    if ('recipientAddress' in intent && intent.recipientAddress !== undefined) {
      const normalizedIntentRecipient = this.normalizeAddress(intent.recipientAddress, chainId);
      const normalizedDataRecipient = this.normalizeAddress(txData.recipientAddress || '', chainId);
      
      if (normalizedDataRecipient !== normalizedIntentRecipient) {
        errorCollector.addFieldMismatch(
          ErrorCode.RECIPIENT_MISMATCH,
          "recipientAddress",
          intent.recipientAddress,
          txData.recipientAddress
        );
      }
    }
    
    if ('validatorAddress' in intent && intent.validatorAddress !== undefined && txData.validatorAddress !== intent.validatorAddress) {
      errorCollector.addFieldMismatch(
        ErrorCode.VALIDATOR_MISMATCH,
        "validatorAddress",
        intent.validatorAddress,
        txData.validatorAddress
      );
    }
    
    if ('targetValidatorAddress' in intent && intent.targetValidatorAddress !== undefined && txData.targetValidatorAddress !== intent.targetValidatorAddress) {
      errorCollector.addFieldMismatch(
        ErrorCode.VALIDATOR_MISMATCH,
        "targetValidatorAddress",
        intent.targetValidatorAddress,
        txData.targetValidatorAddress
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
    errorCollector: ErrorCollector,
    chainId: string
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

    // Verify recipient address with normalization for EVM chains
    const intent = originalIntent as any;
    if ('recipientAddress' in intent && intent.recipientAddress !== undefined) {
      const normalizedIntentRecipient = this.normalizeAddress(intent.recipientAddress, chainId);
      const normalizedDecodedRecipient = this.normalizeAddress(String(decoded.recipientAddress || ''), chainId);
      
      if (normalizedDecodedRecipient !== normalizedIntentRecipient) {
        errorCollector.addError(
          ErrorCode.CRITICAL_RECIPIENT_MISMATCH,
          `Critical: Decoded transaction recipient mismatch: expected ${intent.recipientAddress}, got ${decoded.recipientAddress}`,
          "critical",
          { expected: intent.recipientAddress, actual: String(decoded.recipientAddress) }
        );
      }
    }
    
    // Verify validator address for staking operations
    if ('validatorAddress' in intent && decoded.validatorAddress !== intent.validatorAddress) {
      errorCollector.addError(
        ErrorCode.CRITICAL_VALIDATOR_MISMATCH,
        `Critical: Decoded transaction validator mismatch: expected ${intent.validatorAddress}, got ${decoded.validatorAddress}`,
        "critical",
        { expected: intent.validatorAddress, actual: String(decoded.validatorAddress) }
      );
    }
    
    // Verify target validator address for staking operations (alternative field name)
    if ('targetValidatorAddress' in intent && decoded.targetValidatorAddress !== intent.targetValidatorAddress) {
      errorCollector.addError(
        ErrorCode.CRITICAL_VALIDATOR_MISMATCH,
        `Critical: Decoded transaction target validator mismatch: expected ${intent.targetValidatorAddress}, got ${decoded.targetValidatorAddress}`,
        "critical",
        { expected: intent.targetValidatorAddress, actual: String(decoded.targetValidatorAddress) }
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
    errorCollector: ErrorCollector,
    chainId: string
  ): void {
    // For staking transactions, skip recipient address check as they use targetValidatorAddress
    if (apiData.mode !== 'stake' && apiData.mode !== 'unstake' && apiData.mode !== 'claimRewards') {
      const normalizedDecodedRecipient = this.normalizeAddress(String(decoded.recipientAddress || ''), chainId);
      const normalizedApiRecipient = this.normalizeAddress(apiData.recipientAddress || '', chainId);
      
      if (normalizedDecodedRecipient !== normalizedApiRecipient) {
        errorCollector.addError(
          ErrorCode.DECODED_API_MISMATCH,
          `Warning: Decoded recipient (${decoded.recipientAddress}) doesn't match API data (${apiData.recipientAddress})`,
          "warning",
          { decoded: decoded.recipientAddress, apiData: apiData.recipientAddress }
        );
      }
    }
    
    // For staking operations, verify the validator address instead
    if (apiData.mode === 'stake' || apiData.mode === 'unstake') {
      const decodedValidator = decoded.targetValidatorAddress || decoded.validatorAddress;
      const apiValidator = apiData.targetValidatorAddress || apiData.validatorAddress;
      if (decodedValidator !== apiValidator) {
        errorCollector.addError(
          ErrorCode.DECODED_API_MISMATCH,
          `Warning: Decoded validator (${decodedValidator}) doesn't match API data (${apiValidator})`,
          "warning",
          { decoded: decodedValidator, apiData: apiValidator }
        );
      }
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

}

// Export main functions and types
export { DecoderRegistry } from "./decoders/registry";
export * from "./types";
export { Schemas } from "./schemas";

// Default export for convenience
export default AdamikSDK;
