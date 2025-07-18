import { z } from "zod";

/**
 * Common schema for string to BigInt conversion
 * Matches the API's stringToBigIntSchema pattern
 */
export const stringToBigIntSchema = z
  .string()
  .refine(
    (value) => {
      try {
        const num = Number(value);
        return (
          !isNaN(num) &&
          Number.isInteger(num) &&
          String(value) === String(BigInt(value)) &&
          BigInt(value) >= 0n
        );
      } catch {
        return false;
      }
    },
    { message: "Amount must be a positive integer string" }
  )
  .transform((val) => val); // Keep as string for JSON compatibility

/**
 * Transaction modes matching API's enum values
 */
export const TransactionModeSchema = z.enum([
  "transfer",
  "transferToken",
  "stake",
  "unstake",
  "claimRewards",
  "deployAccount",
  "withdraw",
  "registerStake",
  "convertAsset",
]);

/**
 * Hash formats supported by the API
 */
export const HashFormatSchema = z.enum([
  "sha256",
  "keccak256",
  "sha512_256",
  "pedersen",
]);

/**
 * Raw transaction formats supported by the API
 */
export const RawFormatSchema = z.enum([
  "RLP",
  "WALLET_CONNECT",
  "SIGNDOC_DIRECT",
  "SIGNDOC_DIRECT_JSON",
  "SIGNDOC_AMINO",
  "SIGNDOC_AMINO_JSON",
  "BOC",
  "RAW_TRANSACTION",
  "MSGPACK",
  "PSBT",
  "BCS",
  "BORSH",
  "COSMOS_PROTOBUF",
]);

/**
 * Chain IDs supported by the SDK
 */
export const ChainIdSchema = z.enum([
  "ethereum",
  "sepolia",
  "bitcoin",
  "bitcoin-testnet",
  "bitcoin-signet",
  "polygon",
  "bsc",
  "avalanche",
  "arbitrum",
  "optimism",
  "base",
  "aptos",
  "aptos-testnet",
  "cosmos",
  "cosmoshub",
  "celestia",
  "injective",
  "babylon-testnet",
  "algorand",
  "ton",
  "starknet",
  "solana",
  "tron",
  "hoodi",
]);

/**
 * Common optional fields
 */
export const memoSchema = z.string().optional();
export const nonceSchema = z.string().optional();
export const gasSchema = z.string().optional();
export const feesSchema = z.string();

/**
 * Status schema matching API's error/warning structure
 */
export const StatusSchema = z.object({
  errors: z.array(z.string()),
  warnings: z.array(
    z.union([
      z.string(),
      z.object({ message: z.string() }),
    ])
  ),
});

/**
 * Encoded transaction schema
 */
export const EncodedTransactionSchema = z.object({
  hash: z.object({
    format: HashFormatSchema,
    value: z.string(),
  }),
  raw: z.object({
    format: RawFormatSchema,
    value: z.string(),
  }),
});