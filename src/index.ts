import { DecoderRegistry } from "./decoders/registry";
import { AdamikEncodeResponse, TransactionData, TransactionIntent, VerificationResult } from "./types";

export class AdamikSDK {
  private decoderRegistry: DecoderRegistry;

  constructor() {
    this.decoderRegistry = new DecoderRegistry();
  }

  /**
   * Verifies that an Adamik API response matches the original transaction intent
   * @param apiResponse The response from Adamik API encode endpoint
   * @param originalIntent The original transaction intent sent to the API
   * @returns Verification result with validation status and any errors
   */
  async verify(
    apiResponse: AdamikEncodeResponse,
    originalIntent: TransactionIntent
  ): Promise<VerificationResult> {
    const errors: string[] = [];

    try {
      // Step 1: Validate API response structure
      if (!apiResponse.chainId || !apiResponse.transaction) {
        errors.push("Invalid API response structure");
        return { isValid: false, errors };
      }

      const { chainId, transaction } = apiResponse;
      const { data, encoded } = transaction;

      // Step 2: Verify transaction mode matches
      if (data.mode !== originalIntent.mode) {
        errors.push(`Transaction mode mismatch: expected ${originalIntent.mode}, got ${data.mode}`);
      }

      // Step 3: Verify core transaction fields
      this.verifyTransactionFields(originalIntent, data, errors);

      // Step 4: Verify amounts (if not using max amount)
      if (!originalIntent.useMaxAmount && originalIntent.amount !== undefined) {
        if (data.amount !== originalIntent.amount) {
          errors.push(`Amount mismatch: expected ${originalIntent.amount}, got ${data.amount}`);
        }
      }

      // Step 5: Decode and verify encoded transaction (encoded validation)
      let decodedRaw: unknown;
      if (encoded && encoded.length > 0) {
        try {
          const decoder = this.decoderRegistry.getDecoder(chainId, encoded[0].raw.format);
          if (decoder) {
            decodedRaw = await decoder.decode(encoded[0].raw.value);

            // Encoded validation: Compare decoded transaction with original intent
            const decodedVerificationErrors = this.verifyDecodedTransaction(decodedRaw, originalIntent, data);
            errors.push(...decodedVerificationErrors);
          } else {
            errors.push(`No decoder available for ${chainId} with format ${encoded[0].raw.format}`);
          }
        } catch (decodeError) {
          errors.push(`Failed to decode transaction: ${decodeError}`);
        }
      }

      // Step 6: Return verification result
      return {
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        decodedData: {
          chainId,
          transaction: data,
          raw: decodedRaw,
        },
      };
    } catch (error) {
      errors.push(`Verification error: ${error}`);
      return { isValid: false, errors };
    }
  }

  /**
   * Verifies that the decoded transaction matches the original intent (encoded validation)
   * @param decodedTransaction The decoded transaction from the encoded data
   * @param originalIntent The original transaction intent
   * @param apiData The transaction data from API response
   * @returns Array of error messages (empty if verification passes)
   */
  private verifyDecodedTransaction(
    decodedTransaction: unknown,
    originalIntent: TransactionIntent,
    apiData: TransactionData
  ): string[] {
    const errors: string[] = [];

    // Type guard for decoded transaction structure
    if (!decodedTransaction || typeof decodedTransaction !== "object") {
      errors.push("Decoded transaction has invalid structure");
      return errors;
    }

    const decoded = decodedTransaction as Record<string, unknown>;

    // Verify core decoded transaction fields
    this.verifyDecodedFields(decoded, originalIntent, errors);
    
    // Cross-verify decoded transaction against API response data
    this.verifyCrossConsistency(decoded, apiData, errors);

    return errors;
  }

  /**
   * Verifies core transaction fields between intent and API data
   */
  private verifyTransactionFields(
    originalIntent: TransactionIntent,
    data: TransactionData,
    errors: string[]
  ): void {
    const fieldMappings: Array<{ field: keyof TransactionIntent; label: string }> = [
      { field: "senderAddress", label: "Sender address" },
      { field: "recipientAddress", label: "Recipient address" },
      { field: "validatorAddress", label: "Validator address" },
      { field: "targetValidatorAddress", label: "Target validator address" },
      { field: "tokenId", label: "Token ID" }
    ];

    fieldMappings.forEach(({ field, label }) => {
      if (originalIntent[field] !== undefined && data[field] !== originalIntent[field]) {
        errors.push(`${label} mismatch: expected ${originalIntent[field]}, got ${data[field]}`);
      }
    });
  }

  /**
   * Verifies core decoded transaction fields against original intent
   */
  private verifyDecodedFields(
    decoded: Record<string, unknown>,
    originalIntent: TransactionIntent,
    errors: string[]
  ): void {
    // Verify transaction mode
    if (decoded.mode !== originalIntent.mode) {
      errors.push(`Decoded transaction mode mismatch: expected ${originalIntent.mode}, got ${decoded.mode}`);
    }

    // Verify recipient address
    if (decoded.recipientAddress !== originalIntent.recipientAddress) {
      errors.push(
        `Critical: Decoded transaction recipient mismatch: expected ${originalIntent.recipientAddress}, got ${decoded.recipientAddress}`
      );
    }

    // Verify amount (handle bigint vs string conversion)
    if (originalIntent.amount && !originalIntent.useMaxAmount) {
      const expectedAmount = BigInt(originalIntent.amount);
      const decodedAmount =
        typeof decoded.amount === "bigint"
          ? decoded.amount
          : typeof decoded.amount === "string"
            ? BigInt(decoded.amount)
            : 0n;

      if (decodedAmount !== expectedAmount) {
        errors.push(
          `Critical: Decoded transaction amount mismatch: expected ${expectedAmount.toString()}, got ${decodedAmount.toString()}`
        );
      }
    }

    // Verify token ID for token transfers
    if (originalIntent.tokenId && decoded.tokenId !== originalIntent.tokenId) {
      errors.push(
        `Critical: Decoded transaction token mismatch: expected ${originalIntent.tokenId}, got ${decoded.tokenId}`
      );
    }
  }

  /**
   * Verifies consistency between decoded transaction and API response data
   */
  private verifyCrossConsistency(
    decoded: Record<string, unknown>,
    apiData: TransactionData,
    errors: string[]
  ): void {
    if (decoded.recipientAddress !== apiData.recipientAddress) {
      errors.push(
        `Warning: Decoded recipient (${decoded.recipientAddress}) doesn't match API data (${apiData.recipientAddress})`
      );
    }

    if (decoded.mode !== apiData.mode) {
      errors.push(
        `Warning: Decoded mode (${decoded.mode}) doesn't match API data (${apiData.mode})`
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
    const keysToCompare: (keyof TransactionData)[] = [
      "mode",
      "senderAddress",
      "recipientAddress",
      "amount",
      "tokenId",
      "validatorAddress",
      "targetValidatorAddress",
    ];

    return keysToCompare.every((key) => data1[key] === data2[key]);
  }
}

// Export main functions and types
export { AdamikAPIClient } from "./client";
export { DecoderRegistry } from "./decoders/registry";
export * from "./types";

// Default export for convenience
export default AdamikSDK;
