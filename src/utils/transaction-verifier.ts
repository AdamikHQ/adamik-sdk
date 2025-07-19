import { TransactionData, TransactionIntent, DecodedTransaction } from "../types";
import { ErrorCollector, ErrorCode } from "../schemas/errors";
import { AddressNormalizer } from "../utils/address-normalizer";

/**
 * Handles transaction verification logic
 */
export class TransactionVerifier {
  /**
   * Verifies transaction fields between intent and API data
   */
  static verifyIntentAgainstAPI(
    originalIntent: TransactionIntent,
    apiData: TransactionData,
    errorCollector: ErrorCollector,
    chainId: string
  ): void {
    // Verify mode
    if (apiData.mode !== originalIntent.mode) {
      errorCollector.addFieldMismatch(
        ErrorCode.MODE_MISMATCH,
        "mode",
        originalIntent.mode,
        apiData.mode
      );
    }

    // Verify sender address
    if (originalIntent.senderAddress !== undefined) {
      const normalizedIntentSender = AddressNormalizer.normalize(originalIntent.senderAddress, chainId);
      const normalizedDataSender = AddressNormalizer.normalize(apiData.senderAddress || '', chainId);
      
      if (normalizedDataSender !== normalizedIntentSender) {
        errorCollector.addFieldMismatch(
          ErrorCode.SENDER_MISMATCH,
          "senderAddress",
          originalIntent.senderAddress,
          apiData.senderAddress
        );
      }
    }

    // Verify amount (if not using max amount)
    if ('amount' in originalIntent && originalIntent.amount !== undefined) {
      if (!('useMaxAmount' in originalIntent) || !originalIntent.useMaxAmount) {
        if (apiData.amount !== originalIntent.amount) {
          errorCollector.addFieldMismatch(
            ErrorCode.AMOUNT_MISMATCH,
            "amount",
            originalIntent.amount,
            apiData.amount
          );
        }
      }
    }

    // Verify mode-specific fields
    this.verifyModeSpecificFields(originalIntent, apiData, errorCollector, chainId);
  }

  /**
   * Verifies mode-specific fields (recipient, validator, token)
   */
  private static verifyModeSpecificFields(
    originalIntent: TransactionIntent,
    apiData: TransactionData,
    errorCollector: ErrorCollector,
    chainId: string
  ): void {
    const intent = originalIntent as any;
    const data = apiData as any;
    
    // Recipient address (for transfers)
    if ('recipientAddress' in intent && intent.recipientAddress !== undefined) {
      const normalizedIntentRecipient = AddressNormalizer.normalize(intent.recipientAddress, chainId);
      const normalizedDataRecipient = AddressNormalizer.normalize(data.recipientAddress || '', chainId);
      
      if (normalizedDataRecipient !== normalizedIntentRecipient) {
        errorCollector.addFieldMismatch(
          ErrorCode.RECIPIENT_MISMATCH,
          "recipientAddress",
          intent.recipientAddress,
          data.recipientAddress
        );
      }
    }
    
    // Validator addresses (for staking)
    if ('validatorAddress' in intent && intent.validatorAddress !== undefined && data.validatorAddress !== intent.validatorAddress) {
      errorCollector.addFieldMismatch(
        ErrorCode.VALIDATOR_MISMATCH,
        "validatorAddress",
        intent.validatorAddress,
        data.validatorAddress
      );
    }
    
    if ('targetValidatorAddress' in intent && intent.targetValidatorAddress !== undefined && data.targetValidatorAddress !== intent.targetValidatorAddress) {
      errorCollector.addFieldMismatch(
        ErrorCode.VALIDATOR_MISMATCH,
        "targetValidatorAddress",
        intent.targetValidatorAddress,
        data.targetValidatorAddress
      );
    }
    
    // Token ID (for token transfers)
    if ('tokenId' in intent && intent.tokenId !== undefined && data.tokenId !== intent.tokenId) {
      errorCollector.addFieldMismatch(
        ErrorCode.TOKEN_MISMATCH,
        "tokenId",
        intent.tokenId,
        data.tokenId
      );
    }
  }

  /**
   * Verifies decoded transaction against original intent
   */
  static verifyDecodedAgainstIntent(
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

    const intent = originalIntent as any;

    // Verify recipient address
    if ('recipientAddress' in intent && intent.recipientAddress !== undefined) {
      const normalizedIntentRecipient = AddressNormalizer.normalize(intent.recipientAddress, chainId);
      const normalizedDecodedRecipient = AddressNormalizer.normalize(String(decoded.recipientAddress || ''), chainId);
      
      if (normalizedDecodedRecipient !== normalizedIntentRecipient) {
        errorCollector.addError(
          ErrorCode.CRITICAL_RECIPIENT_MISMATCH,
          `Critical: Decoded transaction recipient mismatch: expected ${intent.recipientAddress}, got ${decoded.recipientAddress}`,
          "critical",
          { expected: intent.recipientAddress, actual: String(decoded.recipientAddress) }
        );
      }
    }
    
    // Verify validator addresses
    if ('validatorAddress' in intent && decoded.validatorAddress !== intent.validatorAddress) {
      errorCollector.addError(
        ErrorCode.CRITICAL_VALIDATOR_MISMATCH,
        `Critical: Decoded transaction validator mismatch: expected ${intent.validatorAddress}, got ${decoded.validatorAddress}`,
        "critical",
        { expected: intent.validatorAddress, actual: String(decoded.validatorAddress) }
      );
    }
    
    if ('targetValidatorAddress' in intent && decoded.targetValidatorAddress !== intent.targetValidatorAddress) {
      errorCollector.addError(
        ErrorCode.CRITICAL_VALIDATOR_MISMATCH,
        `Critical: Decoded transaction target validator mismatch: expected ${intent.targetValidatorAddress}, got ${decoded.targetValidatorAddress}`,
        "critical",
        { expected: intent.targetValidatorAddress, actual: String(decoded.targetValidatorAddress) }
      );
    }

    // Verify amount
    if ('amount' in intent && intent.amount && !('useMaxAmount' in intent && intent.useMaxAmount)) {
      const expectedAmount = BigInt(intent.amount);
      const decodedAmount = this.parseAmount(decoded.amount);

      if (decodedAmount !== expectedAmount) {
        errorCollector.addError(
          ErrorCode.CRITICAL_AMOUNT_MISMATCH,
          `Critical: Decoded transaction amount mismatch: expected ${expectedAmount.toString()}, got ${decodedAmount.toString()}`,
          "critical",
          { expected: expectedAmount.toString(), actual: decodedAmount.toString() }
        );
      }
    }

    // Verify token ID
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
   * Verifies consistency between decoded transaction and API response
   */
  static verifyDecodedAgainstAPI(
    decoded: Record<string, unknown>,
    apiData: TransactionData,
    errorCollector: ErrorCollector,
    chainId: string
  ): void {
    // For non-staking transactions, verify recipient address
    if (apiData.mode !== 'stake' && apiData.mode !== 'unstake' && apiData.mode !== 'claimRewards') {
      const normalizedDecodedRecipient = AddressNormalizer.normalize(String(decoded.recipientAddress || ''), chainId);
      const normalizedApiRecipient = AddressNormalizer.normalize(apiData.recipientAddress || '', chainId);
      
      if (normalizedDecodedRecipient !== normalizedApiRecipient) {
        errorCollector.addError(
          ErrorCode.DECODED_API_MISMATCH,
          `Warning: Decoded recipient (${decoded.recipientAddress}) doesn't match API data (${apiData.recipientAddress})`,
          "warning",
          { decoded: decoded.recipientAddress, apiData: apiData.recipientAddress }
        );
      }
    }
    
    // For staking operations, verify validator address
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

    // Verify mode consistency
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
   * Helper to parse amount from various formats
   */
  private static parseAmount(amount: unknown): bigint {
    if (typeof amount === "bigint") {
      return amount;
    }
    if (typeof amount === "string") {
      return BigInt(amount);
    }
    return 0n;
  }
}