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
  memo?: string;
  tokenId?: string;
  validatorAddress?: string;
  targetValidatorAddress?: string;
  chainSpecificData?: unknown;
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
  /** Any warnings generated during decoding */
  warnings?: Array<{
    code: string;
    message: string;
  }>;
  /** Error message if decoding failed */
  error?: string;
}

/**
 * Chain families supported by Adamik
 */
export type ChainFamily = "algorand" | "aptos" | "bitcoin" | "cosmos" | "evm" | "solana" | "starknet" | "ton" | "tron";

/**
 * Supported features for reading blockchain data
 */
export interface ReadFeatures {
  token: boolean;
  validators: boolean;
  transaction: {
    native: boolean;
    tokens: boolean;
    staking: boolean;
  };
  account: {
    balances: {
      native: boolean;
      tokens: boolean;
      staking: boolean;
    };
    transactions: {
      native: boolean;
      tokens: boolean;
      staking: boolean;
    };
  };
}

/**
 * Supported features for writing blockchain data
 */
export interface WriteFeatures {
  transaction: {
    type: {
      deployAccount: boolean;
      transfer: boolean;
      transferToken: boolean;
      stake: boolean;
      unstake: boolean;
      claimRewards: boolean;
      withdraw: boolean;
      registerStake: boolean;
      convertAsset: boolean;
    };
    field: {
      memo: boolean;
    };
  };
}

/**
 * Utility features supported
 */
export interface UtilsFeatures {
  addresses: boolean;
}

/**
 * Combined supported features
 */
export interface SupportedFeatures {
  read: ReadFeatures;
  write: WriteFeatures;
  utils: UtilsFeatures;
}

/**
 * Cryptographic curve types
 */
export type CryptographicCurve = "ed25519" | "secp256k1" | "secp256r1" | "stark";

/**
 * Hash function types
 */
export type HashFunction = "sha512_256" | "sha256" | "keccak256" | "pedersen";

/**
 * Signature format types
 */
export type SignatureFormat = "rs" | "rsv" | "der";

/**
 * Signer specification for a chain
 */
export interface SignerSpec {
  curve: CryptographicCurve;
  hashFunction: HashFunction;
  signatureFormat: SignatureFormat;
  coinType: string;
}

/**
 * Complete chain information from Adamik API
 */
export interface Chain {
  /** Chain family (bitcoin, evm, cosmos, etc.) */
  family: ChainFamily;
  /** Adamik chain identifier (e.g., "ethereum", "polygon") */
  id: string;
  /** Native chain identifier (e.g., "1" for Ethereum, "cosmoshub-4" for Cosmos) */
  nativeId: string;
  /** Human-readable chain name */
  name: string;
  /** Native currency ticker symbol */
  ticker: string;
  /** Number of decimal places for the native currency */
  decimals: number;
  /** Optional: indicates this is a testnet for another chain */
  isTestnetFor?: string;
  /** Features supported by this chain */
  supportedFeatures: SupportedFeatures;
  /** Cryptographic specifications for signing */
  signerSpec: SignerSpec;
}

/**
 * Chains response from Adamik API
 */
export interface ChainsData {
  chains: Record<string, Chain>;
}
