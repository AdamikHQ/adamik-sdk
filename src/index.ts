import { DecoderWithPlaceholder } from "./decoders/base";
import { DecoderRegistry } from "./decoders/registry";
import { AdamikEncodeResponseSchema, TransactionIntentSchema } from "./schemas";
import { ErrorCode, ErrorCollector } from "./schemas/errors";
import {
  DecodeParams,
  DecodeResult,
  DecodedTransaction,
  TransactionData,
  TransactionIntent,
  VerificationResult,
} from "./types";
import { TransactionVerifier } from "./utils/transaction-verifier";

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
   * Decodes raw transaction data for a specific blockchain
   *
   * This method provides direct access to the SDK's decoding capabilities without
   * running the full verification flow. Useful for inspecting transaction contents
   * or debugging purposes.
   *
   * @param params - The decoding parameters
   * @param params.chainId - The blockchain identifier (e.g., "ethereum", "bitcoin")
   * @param params.format - The encoding format (e.g., "RLP_HEX", "PSBT_BASE64")
   * @param params.encodedData - The encoded transaction data as a string
   *
   * @returns A DecodeResult object containing:
   *   - decoded: The decoded transaction data (null if decoding failed)
   *   - isPlaceholder: Whether a placeholder decoder was used
   *   - warnings: Any warnings generated during decoding
   *   - error: Error message if decoding failed
   *
   * @example
   * ```typescript
   * const result = await sdk.decode({
   *   chainId: "ethereum",
   *   format: "RLP_HEX",
   *   encodedData: "0xf86c0a8502540be400..."
   * });
   *
   * if (result.decoded) {
   *   console.log('Recipient:', result.decoded.recipientAddress);
   *   console.log('Amount:', result.decoded.amount);
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Decode from API response
   * const result = await sdk.decode({
   *   chainId: apiResponse.chainId,
   *   format: apiResponse.transaction.encoded[0].raw.format,
   *   encodedData: apiResponse.transaction.encoded[0].raw.value
   * });
   * ```
   */
  async decode(params: DecodeParams): Promise<DecodeResult> {
    const warnings: Array<{ code: string; message: string }> = [];

    try {
      // Get the appropriate decoder
      const decoder = this.decoderRegistry.getDecoder(params.chainId, params.format);

      if (!decoder) {
        return {
          decoded: null,
          isPlaceholder: false,
          error: `No decoder available for ${params.chainId} with format ${params.format}`,
        };
      }

      // Check if this is a placeholder decoder
      const decoderWithPlaceholder = decoder as DecoderWithPlaceholder;
      const isPlaceholder = decoderWithPlaceholder.isPlaceholder === true;

      if (isPlaceholder) {
        warnings.push({
          code: "PLACEHOLDER_DECODER",
          message: `Using placeholder decoder for ${params.chainId} - decoded data may be incomplete`,
        });
      }

      // Attempt to decode
      const decodedRaw = await decoder.decode(params.encodedData);

      // Convert the raw decoded data to DecodedTransaction format
      const decoded: DecodedTransaction = decodedRaw as DecodedTransaction;

      return {
        decoded,
        isPlaceholder,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      return {
        decoded: null,
        isPlaceholder: false,
        error: `Failed to decode transaction: ${error}`,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }
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
  async verify(apiResponse: unknown, originalIntent: unknown): Promise<VerificationResult> {
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

      // Step 2: Verify intent against API response
      TransactionVerifier.verifyIntentAgainstAPI(validatedIntent, data, errorCollector, chainId);

      // Step 3: Decode and verify encoded transaction
      let decodedRaw: unknown;
      if (encoded && encoded.length > 0 && encoded[0].raw) {
        decodedRaw = await this.decodeAndVerify(
          chainId,
          encoded[0].raw,
          validatedIntent,
          data,
          errorCollector
        );
      }

      // Step 4: Return verification result
      return errorCollector.getResult({
        chainId,
        transaction: data,
        raw: decodedRaw,
      });
    } catch (error) {
      errorCollector.addError(ErrorCode.INVALID_API_RESPONSE, `Verification error: ${error}`, "error", {
        error: String(error),
      });
      return errorCollector.getResult();
    }
  }

  /**
   * Decodes and verifies the encoded transaction
   * @private
   */
  private async decodeAndVerify(
    chainId: string,
    raw: { format: string; value: string },
    originalIntent: TransactionIntent,
    apiData: TransactionData,
    errorCollector: ErrorCollector
  ): Promise<unknown> {
    try {
      const decoder = this.decoderRegistry.getDecoder(chainId as any, raw.format as any);
      if (!decoder) {
        errorCollector.addError(
          ErrorCode.MISSING_DECODER,
          `No decoder available for ${chainId} with format ${raw.format}`,
          "warning",
          { chainId, format: raw.format }
        );
        return undefined;
      }

      const decodedRaw = await decoder.decode(raw.value);

      // Check if this is a placeholder decoder
      const decoderWithPlaceholder = decoder as DecoderWithPlaceholder;
      if (decoderWithPlaceholder.isPlaceholder) {
        errorCollector.addError(
          ErrorCode.MISSING_DECODER,
          `Using placeholder decoder for ${chainId} - encoded validation skipped`,
          "warning"
        );
        return decodedRaw;
      }

      // Verify decoded transaction
      if (!decodedRaw || typeof decodedRaw !== "object") {
        errorCollector.addError(
          ErrorCode.INVALID_DECODED_STRUCTURE,
          "Decoded transaction has invalid structure",
          "error"
        );
        return decodedRaw;
      }

      const decoded = decodedRaw as Record<string, unknown>;

      // Verify decoded against intent
      TransactionVerifier.verifyDecodedAgainstIntent(decoded, originalIntent, errorCollector, chainId);

      // Cross-verify decoded against API
      TransactionVerifier.verifyDecodedAgainstAPI(decoded, apiData, errorCollector, chainId);

      return decodedRaw;
    } catch (decodeError) {
      errorCollector.addError(
        ErrorCode.DECODE_FAILED,
        `Failed to decode transaction: ${decodeError}`,
        "error",
        { error: String(decodeError) }
      );
      return undefined;
    }
  }
}

// Export main functions and types
export { DecoderRegistry } from "./decoders/registry";
export { Schemas } from "./schemas";
export * from "./types";

// Export utilities for advanced usage
export { AddressNormalizer } from "./utils/address-normalizer";
export { TransactionVerifier } from "./utils/transaction-verifier";

// Default export for convenience
export default AdamikSDK;
