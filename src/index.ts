import { DecoderWithPlaceholder } from "./decoders/base";
import { DecoderRegistry } from "./decoders/registry";
import { AdamikEncodeResponseSchema, TransactionIntentSchema } from "./schemas";
import { ErrorCode, ErrorCollector } from "./schemas/errors";
import {
  ChainFamily,
  ChainId,
  DecodedTransaction,
  DecodeParams,
  DecodeResult,
  RawFormat,
  TransactionData,
  TransactionIntent,
  VerificationResult,
} from "./types";
import { getChainById } from "./utils/chain-utils";
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
   * Gets all supported chains with their available decoders
   * 
   * @returns An object mapping chain IDs to their supported formats and decoder status
   * 
   * @example
   * ```typescript
   * const sdk = new AdamikSDK();
   * const supported = sdk.getSupportedChains();
   * console.log(supported);
   * // {
   * //   "ethereum": {
   * //     "family": "evm",
   * //     "formats": ["RLP"],
   * //     "hasDecoder": true
   * //   },
   * //   "bitcoin": {
   * //     "family": "bitcoin", 
   * //     "formats": ["PSBT"],
   * //     "hasDecoder": true
   * //   },
   * //   ...
   * // }
   * ```
   */
  getSupportedChains(): Record<string, { family: ChainFamily; formats: RawFormat[]; hasDecoder: boolean }> {
    const result: Record<string, { family: ChainFamily; formats: RawFormat[]; hasDecoder: boolean }> = {};
    
    // Get all registered decoders
    const decoderKeys = this.decoderRegistry.listDecoders();
    const chainFormats = new Map<string, Set<string>>();
    
    // Parse decoder keys to build chain->formats mapping
    decoderKeys.forEach(key => {
      const [chainId, format] = key.split(':');
      if (!chainFormats.has(chainId)) {
        chainFormats.set(chainId, new Set());
      }
      const set = chainFormats.get(chainId);
      if (set) {
        set.add(format);
      }
    });
    
    // Build result with chain metadata
    chainFormats.forEach((formats, chainId) => {
      const chain = getChainById(chainId);
      if (chain) {
        result[chainId] = {
          family: chain.family,
          formats: Array.from(formats) as RawFormat[],
          hasDecoder: true
        };
      }
    });
    
    return result;
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
          error: `No decoder available for ${params.chainId} with format ${params.format}`,
        };
      }

      // Check if this is a placeholder decoder
      const decoderWithPlaceholder = decoder as DecoderWithPlaceholder;
      const hasPlaceholder = decoderWithPlaceholder.isPlaceholder === true;

      if (hasPlaceholder) {
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
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      return {
        decoded: null,
        error: `Failed to decode transaction: ${error instanceof Error ? error.message : String(error)}`,
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
        decodedRaw = await this.processEncodedTransaction(
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
        chainSpecificData: decodedRaw,
      });
    } catch (error) {
      errorCollector.addError(ErrorCode.INVALID_API_RESPONSE, `Verification error: ${error instanceof Error ? error.message : String(error)}`, "error", {
        error: String(error),
      });
      return errorCollector.getResult();
    }
  }

  /**
   * Processes the encoded transaction by decoding it and verifying against intent and API data
   * 
   * This method:
   * 1. Delegates decoding to the public decode() method
   * 2. Maps any decode errors/warnings to the ErrorCollector
   * 3. Performs two-step verification if decoding succeeds:
   *    - Verifies decoded data matches the original user intent
   *    - Cross-verifies decoded data matches the API response
   * 
   * @param chainId - The blockchain identifier
   * @param raw - The raw encoded transaction data (format and value)
   * @param originalIntent - The user's original transaction intent
   * @param apiData - The transaction data from the API response
   * @param errorCollector - Collector for errors and warnings
   * @returns The decoded transaction data if successful, undefined otherwise
   */
  private async processEncodedTransaction(
    chainId: string,
    raw: { format: string; value: string },
    originalIntent: TransactionIntent,
    apiData: TransactionData,
    errorCollector: ErrorCollector
  ): Promise<unknown> {
    // Decode using the public method
    const decodeResult = await this.decode({
      chainId: chainId as ChainId,
      format: raw.format as RawFormat,
      encodedData: raw.value
    });

    // Handle decode errors
    if (decodeResult.error) {
      if (decodeResult.error.includes("No decoder available")) {
        errorCollector.addError(
          ErrorCode.MISSING_DECODER,
          decodeResult.error,
          "warning",
          { chainId, format: raw.format }
        );
      } else if (decodeResult.error.includes("Chain ID mismatch")) {
        // Chain ID mismatches are critical security errors
        errorCollector.addError(
          ErrorCode.DECODE_FAILED,
          decodeResult.error,
          "critical",
          { 
            chainId, 
            format: raw.format,
            recoveryStrategy: "SECURITY ALERT: Do not sign this transaction! The transaction is for a different blockchain network than expected."
          }
        );
      } else {
        errorCollector.addError(
          ErrorCode.DECODE_FAILED,
          decodeResult.error,
          "error",
          { chainId, format: raw.format }
        );
      }
      return undefined;
    }

    // Map warnings
    if (decodeResult.warnings) {
      decodeResult.warnings.forEach(warning => {
        const code = warning.code === "PLACEHOLDER_DECODER" 
          ? ErrorCode.MISSING_DECODER 
          : ErrorCode.DECODE_FAILED;
        errorCollector.addError(code, warning.message, "warning");
      });
    }

    // Ensure we have decoded data
    if (!decodeResult.decoded) {
      errorCollector.addError(
        ErrorCode.INVALID_DECODED_STRUCTURE,
        "Decoded transaction is null",
        "error"
      );
      return undefined;
    }

    // Skip verification for placeholder decoders
    const hasPlaceholderWarning = decodeResult.warnings?.some(w => w.code === "PLACEHOLDER_DECODER");
    if (hasPlaceholderWarning) {
      return decodeResult.decoded;
    }

    // Validate decoded structure
    const decoded = decodeResult.decoded;
    if (!decoded || typeof decoded !== "object") {
      errorCollector.addError(
        ErrorCode.INVALID_DECODED_STRUCTURE,
        "Decoded transaction has invalid structure",
        "error"
      );
      return decoded;
    }

    // Perform two-step verification
    TransactionVerifier.verifyDecodedAgainstIntent(
      decoded as Record<string, unknown>, 
      originalIntent, 
      errorCollector, 
      chainId
    );

    TransactionVerifier.verifyDecodedAgainstAPI(
      decoded as Record<string, unknown>, 
      apiData, 
      errorCollector, 
      chainId
    );

    return decoded;
  }
}

// Export main functions and types
export { DecoderRegistry } from "./decoders/registry";
export { Schemas } from "./schemas";
export * from "./types";

// Export utilities for advanced usage
export { AddressNormalizer } from "./utils/address-normalizer";
export { TransactionVerifier } from "./utils/transaction-verifier";
export * from "./utils/chain-utils";

// Default export for convenience
export default AdamikSDK;
