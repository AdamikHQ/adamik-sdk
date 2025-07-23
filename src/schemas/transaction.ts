import { z } from "zod";
import {
  ChainIdSchema,
  HashFormatSchema,
  RawFormatSchema,
  StatusSchema,
  stringToBigIntSchema,
  TransactionModeSchema,
} from "./common";

/**
 * Base transaction fields that are common across all modes
 */
const baseTransactionFields = {
  senderAddress: z.string().optional(),
  senderPubKey: z.string().optional(),
  memo: z.string().optional(),
};

/**
 * Transaction intent schemas using discriminated union pattern
 * This matches the API's input transaction data structure
 */
export const TransactionIntentSchema = z.discriminatedUnion("mode", [
  // Transfer native token
  z.object({
    ...baseTransactionFields,
    mode: z.literal("transfer"),
    recipientAddress: z.string(),
    amount: stringToBigIntSchema.optional(),
    useMaxAmount: z.boolean().optional(),
  }),
  
  // Transfer token
  z.object({
    ...baseTransactionFields,
    mode: z.literal("transferToken"),
    recipientAddress: z.string(),
    amount: stringToBigIntSchema.optional(),
    useMaxAmount: z.boolean().optional(),
    tokenId: z.string(),
  }),
  
  // Stake
  z.object({
    ...baseTransactionFields,
    mode: z.literal("stake"),
    targetValidatorAddress: z.string(),
    amount: stringToBigIntSchema.optional(),
    useMaxAmount: z.boolean().optional(),
  }),
  
  // Unstake
  z.object({
    ...baseTransactionFields,
    mode: z.literal("unstake"),
    validatorAddress: z.string(),
    amount: stringToBigIntSchema.optional(),
    useMaxAmount: z.boolean().optional(),
    stakeId: z.string().optional(),
  }),
  
  // Claim rewards
  z.object({
    ...baseTransactionFields,
    mode: z.literal("claimRewards"),
    validatorAddress: z.string().optional(),
    compound: z.boolean().optional(),
  }),
  
  // Deploy account
  z.object({
    ...baseTransactionFields,
    mode: z.literal("deployAccount"),
  }),
  
  // Withdraw
  z.object({
    ...baseTransactionFields,
    mode: z.literal("withdraw"),
    validatorAddress: z.string(),
    amount: stringToBigIntSchema.optional(),
    useMaxAmount: z.boolean().optional(),
  }),
  
  // Register stake
  z.object({
    ...baseTransactionFields,
    mode: z.literal("registerStake"),
    validatorAddress: z.string(),
  }),
  
  // Convert asset
  z.object({
    ...baseTransactionFields,
    mode: z.literal("convertAsset"),
    from: z.object({
      chainId: ChainIdSchema,
      tokenId: z.string().optional(),
      amount: stringToBigIntSchema,
    }),
    to: z.object({
      chainId: ChainIdSchema,
      tokenId: z.string().optional(),
    }),
  }),
]);

/**
 * Transaction data schema - for backward compatibility, we make all fields optional
 * The API adds computed fields like fees, gas, nonce to the original intent
 */
export const TransactionDataSchema = z.object({
  mode: TransactionModeSchema,
  senderAddress: z.string().optional(),
  senderPubKey: z.string().optional(),
  recipientAddress: z.string().optional(),
  amount: z.string().optional(),
  useMaxAmount: z.boolean().optional(),
  tokenId: z.string().optional(),
  validatorAddress: z.string().optional(),
  targetValidatorAddress: z.string().optional(),
  sourceValidatorAddress: z.string().optional(),
  stakeId: z.string().optional(),
  compound: z.boolean().optional(),
  memo: z.string().optional(),
  fees: z.string(),
  gas: z.string().optional(),
  nonce: z.string().optional(),
  params: z.unknown().optional(),
  from: z.object({
    chainId: ChainIdSchema,
    tokenId: z.string().optional(),
    amount: z.string(),
  }).optional(),
  to: z.object({
    chainId: ChainIdSchema,
    tokenId: z.string().optional(),
  }).optional(),
});

/**
 * Encoded transaction array schema
 */
export const EncodedTransactionArraySchema = z.array(
  z.object({
    hash: z.object({
      format: HashFormatSchema,
      value: z.string(),
    }).optional(),
    raw: z.object({
      format: RawFormatSchema,
      value: z.string(),
    }).optional(),
  })
);

/**
 * Complete API response schema for transaction/encode endpoint
 */
export const AdamikEncodeResponseSchema = z.object({
  chainId: ChainIdSchema,
  transaction: z.object({
    data: TransactionDataSchema,
    encoded: EncodedTransactionArraySchema,
  }),
  status: StatusSchema.optional(),
});

/**
 * Type inference from schemas
 */
export type TransactionIntent = z.infer<typeof TransactionIntentSchema>;
export type TransactionData = z.infer<typeof TransactionDataSchema>;
export type AdamikEncodeResponse = z.infer<typeof AdamikEncodeResponseSchema>;
export type TransactionMode = z.infer<typeof TransactionModeSchema>;
export type ChainId = z.infer<typeof ChainIdSchema>;
export type HashFormat = z.infer<typeof HashFormatSchema>;
export type RawFormat = z.infer<typeof RawFormatSchema>;