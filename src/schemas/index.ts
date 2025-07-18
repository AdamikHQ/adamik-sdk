/**
 * Main export file for all schemas
 * Provides a clean API for importing schemas and types
 */

export * from "./common";
export * from "./transaction";
export * from "./errors";

// Re-export schemas grouped for convenience
export { TransactionIntentSchema, TransactionDataSchema, AdamikEncodeResponseSchema } from "./transaction";
export { ChainIdSchema, TransactionModeSchema, HashFormatSchema, RawFormatSchema } from "./common";
export { ErrorCode, ErrorCollector } from "./errors";

// Export type utilities
import { z } from "zod";
import { TransactionIntentSchema, AdamikEncodeResponseSchema } from "./transaction";

/**
 * Exported schemas for users who want to validate data themselves
 */
export const Schemas = {
  TransactionIntent: TransactionIntentSchema,
  AdamikEncodeResponse: AdamikEncodeResponseSchema,
} as const;