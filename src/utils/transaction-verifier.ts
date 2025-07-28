import { TransactionData, TransactionIntent } from "../types";
import { ErrorCode } from "../schemas/errors";
import { ErrorCollector } from "./error-collector";
import { AddressNormalizer } from "./address-normalizer";
import { parseAmount } from "./amount";

/**
 * Handles transaction verification logic
 */
export class TransactionVerifier {
  /**
   * Verifies transaction intent against API data
   */
  static verifyIntentAgainstAPIData(
    originalIntent: TransactionIntent,
    apiData: TransactionData,
    errorCollector: ErrorCollector,
    chainId: string
  ): void {
    // Verify mode
    if (apiData.mode !== originalIntent.mode) {
      errorCollector.addFieldMismatch(ErrorCode.MODE_MISMATCH, "mode", originalIntent.mode, apiData.mode);
    }

    // Verify sender address
    if (originalIntent.senderAddress !== undefined) {
      const normalizedIntentSender = AddressNormalizer.normalize(originalIntent.senderAddress, chainId);
      const normalizedDataSender = AddressNormalizer.normalize(apiData.senderAddress || '', chainId);
      
      if (normalizedDataSender !== normalizedIntentSender) {
        errorCollector.addFieldMismatch(ErrorCode.SENDER_MISMATCH, "senderAddress", originalIntent.senderAddress, apiData.senderAddress);
      }
    }

    // Verify amount (if not using max amount)
    if ('amount' in originalIntent && originalIntent.amount !== undefined && 
        !('useMaxAmount' in originalIntent && originalIntent.useMaxAmount) && 
        apiData.amount !== originalIntent.amount) {
      errorCollector.addFieldMismatch(ErrorCode.AMOUNT_MISMATCH, "amount", originalIntent.amount, apiData.amount);
    }

    // Verify recipient address (for transfers)
    if ('recipientAddress' in originalIntent && originalIntent.recipientAddress !== undefined && 'recipientAddress' in apiData) {
      const normalizedIntentRecipient = AddressNormalizer.normalize(originalIntent.recipientAddress, chainId);
      const normalizedDataRecipient = AddressNormalizer.normalize(apiData.recipientAddress || '', chainId);
      
      if (normalizedDataRecipient !== normalizedIntentRecipient) {
        errorCollector.addFieldMismatch(ErrorCode.RECIPIENT_MISMATCH, "recipientAddress", originalIntent.recipientAddress, apiData.recipientAddress);
      }
    }
    
    // Verify validator addresses (for staking)
    if ('validatorAddress' in originalIntent && originalIntent.validatorAddress !== undefined && 
        'validatorAddress' in apiData && apiData.validatorAddress !== originalIntent.validatorAddress) {
      errorCollector.addFieldMismatch(ErrorCode.VALIDATOR_MISMATCH, "validatorAddress", originalIntent.validatorAddress, apiData.validatorAddress);
    }
    
    if ('targetValidatorAddress' in originalIntent && originalIntent.targetValidatorAddress !== undefined && 
        'targetValidatorAddress' in apiData && apiData.targetValidatorAddress !== originalIntent.targetValidatorAddress) {
      errorCollector.addFieldMismatch(ErrorCode.VALIDATOR_MISMATCH, "targetValidatorAddress", originalIntent.targetValidatorAddress, apiData.targetValidatorAddress);
    }
    
    // Verify token ID (for token transfers)
    if ('tokenId' in originalIntent && originalIntent.tokenId !== undefined && 
        'tokenId' in apiData && apiData.tokenId !== originalIntent.tokenId) {
      errorCollector.addFieldMismatch(ErrorCode.TOKEN_MISMATCH, "tokenId", originalIntent.tokenId, apiData.tokenId);
    }
  }

  /**
   * Verifies transaction intent against decoded API data
   */
  static verifyIntentAgainstAPIDecoded(
    decoded: Record<string, unknown>,
    originalIntent: TransactionIntent,
    errorCollector: ErrorCollector,
    chainId: string
  ): void {
    // Verify transaction mode
    if (decoded.mode !== originalIntent.mode) {
      errorCollector.addFieldMismatch(ErrorCode.MODE_MISMATCH, "mode", originalIntent.mode, String(decoded.mode));
    }

    // Verify recipient address
    if ('recipientAddress' in originalIntent && originalIntent.recipientAddress !== undefined) {
      const normalizedIntentRecipient = AddressNormalizer.normalize(originalIntent.recipientAddress, chainId);
      const decodedRecipient = decoded.recipientAddress;
      const recipientStr = typeof decodedRecipient === 'string' ? decodedRecipient : '';
      const normalizedDecodedRecipient = AddressNormalizer.normalize(recipientStr, chainId);
      
      if (normalizedDecodedRecipient !== normalizedIntentRecipient) {
        errorCollector.addError(
          ErrorCode.CRITICAL_RECIPIENT_MISMATCH,
          `Critical: Decoded transaction recipient mismatch: expected ${originalIntent.recipientAddress}, got ${String(decoded.recipientAddress)}`,
          "critical",
          { expected: originalIntent.recipientAddress, actual: String(decoded.recipientAddress) }
        );
      }
    }
    
    // Verify validator addresses
    if ('validatorAddress' in originalIntent && originalIntent.validatorAddress !== undefined && 
        decoded.validatorAddress !== originalIntent.validatorAddress) {
      errorCollector.addError(
        ErrorCode.CRITICAL_VALIDATOR_MISMATCH,
        `Critical: Decoded transaction validator mismatch: expected ${originalIntent.validatorAddress}, got ${String(decoded.validatorAddress)}`,
        "critical",
        { expected: originalIntent.validatorAddress, actual: String(decoded.validatorAddress) }
      );
    }
    
    if ('targetValidatorAddress' in originalIntent && originalIntent.targetValidatorAddress !== undefined && 
        decoded.targetValidatorAddress !== originalIntent.targetValidatorAddress) {
      errorCollector.addError(
        ErrorCode.CRITICAL_VALIDATOR_MISMATCH,
        `Critical: Decoded transaction target validator mismatch: expected ${originalIntent.targetValidatorAddress}, got ${String(decoded.targetValidatorAddress)}`,
        "critical",
        { expected: originalIntent.targetValidatorAddress, actual: String(decoded.targetValidatorAddress) }
      );
    }

    // Verify amount
    if ('amount' in originalIntent && originalIntent.amount && 
        !('useMaxAmount' in originalIntent && originalIntent.useMaxAmount)) {
      const expectedAmount = BigInt(originalIntent.amount);
      const decodedAmount = parseAmount(decoded.amount);

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
    if ('tokenId' in originalIntent && originalIntent.tokenId && 
        decoded.tokenId !== originalIntent.tokenId) {
      errorCollector.addError(
        ErrorCode.CRITICAL_TOKEN_MISMATCH,
        `Critical: Decoded transaction token mismatch: expected ${originalIntent.tokenId}, got ${String(decoded.tokenId)}`,
        "critical",
        { expected: originalIntent.tokenId, actual: String(decoded.tokenId) }
      );
    }
  }

  /**
   * Verifies consistency between API data and decoded API data
   */
  static verifyAPIDataAgainstAPIDecoded(
    decoded: Record<string, unknown>,
    apiData: TransactionData,
    errorCollector: ErrorCollector,
    chainId: string
  ): void {
    // For non-staking transactions, verify recipient address
    if (apiData.mode !== 'stake' && apiData.mode !== 'unstake' && apiData.mode !== 'claimRewards') {
      const decodedRecipient = decoded.recipientAddress;
      const recipientStr = typeof decodedRecipient === 'string' ? decodedRecipient : '';
      const normalizedDecodedRecipient = AddressNormalizer.normalize(recipientStr, chainId);
      const normalizedApiRecipient = AddressNormalizer.normalize(apiData.recipientAddress || '', chainId);
      
      if (normalizedDecodedRecipient !== normalizedApiRecipient) {
        errorCollector.addError(
          ErrorCode.DECODED_API_MISMATCH,
          `Warning: Decoded recipient (${String(decoded.recipientAddress)}) doesn't match API data (${apiData.recipientAddress})`,
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
          `Warning: Decoded validator (${String(decodedValidator)}) doesn't match API data (${String(apiValidator)})`,
          "warning",
          { decoded: decodedValidator, apiData: apiValidator }
        );
      }
    }

    // Verify mode consistency
    if (decoded.mode !== apiData.mode) {
      errorCollector.addError(
        ErrorCode.DECODED_API_MISMATCH,
        `Warning: Decoded mode (${String(decoded.mode)}) doesn't match API data (${apiData.mode})`,
        "warning",
        { decoded: decoded.mode, apiData: apiData.mode }
      );
    }
  }
}