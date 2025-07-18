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
import type { HashFormat, RawFormat, TransactionMode } from "../schemas/transaction";

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
  from?: string;
  to?: string;
  value?: string;
  data?: string;
  mode?: TransactionMode;
  recipientAddress?: string;
  amount?: string;
  senderAddress?: string;
  tokenId?: string;
  raw?: unknown;
}
