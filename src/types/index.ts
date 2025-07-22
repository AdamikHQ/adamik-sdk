/**
 * Re-export types from Zod schemas for backward compatibility
 * All types are now inferred from Zod schemas for consistency
 */
export type {
  ChainId,
  TransactionMode,
  HashFormat,
  RawFormat,
  TransactionIntent,
  TransactionData,
  AdamikEncodeResponse,
} from "../schemas/transaction";

export type { VerificationResult, VerificationError } from "../schemas/errors";

// Import types for use in legacy interfaces
import type { ChainId, HashFormat, RawFormat, TransactionMode } from "../schemas/transaction";

/**
 * Legacy types maintained for backward compatibility
 */
export interface EncodedTransaction {
  hash: {
    format: HashFormat;
    value: string;
  };
  raw: {
    format: RawFormat;
    value: string;
  };
}

export interface DecodedTransaction {
  chainId?: string;
  mode?: TransactionMode;
  senderAddress?: string;
  recipientAddress?: string;
  amount?: string;
  fee?: string;
  tokenId?: string;
  validatorAddress?: string;
  targetValidatorAddress?: string;
  raw?: unknown;
}

/**
 * Parameters for decoding a transaction
 */
export interface DecodeParams {
  chainId: ChainId;
  format: RawFormat;
  encodedData: string;
}

/**
 * Result of decoding a transaction
 */
export interface DecodeResult {
  /** The decoded transaction data, null if decoding failed */
  decoded: DecodedTransaction | null;
  /** Whether the decoder used is a placeholder implementation */
  isPlaceholder: boolean;
  /** Any warnings generated during decoding */
  warnings?: Array<{
    code: string;
    message: string;
  }>;
  /** Error message if decoding failed */
  error?: string;
}
