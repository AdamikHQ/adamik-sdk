import { ChainId } from "../types";

/**
 * Mapping of Adamik chain IDs to EVM network chain IDs
 * This is critical for preventing replay attacks across EVM networks
 */
export const EVM_CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  sepolia: 11155111,
  polygon: 137,
  bsc: 56,
  avalanche: 43114,
  arbitrum: 42161,
  optimism: 10,
  base: 8453,
  // Add more as needed
} as const;

/**
 * Get the expected EVM chain ID for an Adamik chain ID
 */
export function getEVMChainId(chainId: ChainId): number | undefined {
  return EVM_CHAIN_IDS[chainId];
}

/**
 * Check if a chain ID is an EVM chain
 */
export function isEVMChain(chainId: ChainId): boolean {
  return chainId in EVM_CHAIN_IDS;
}

/**
 * Validate that a transaction's chain ID matches the expected chain ID
 */
export function validateChainId(
  chainId: ChainId,
  transactionChainId: number | undefined
): { valid: boolean; error?: string } {
  const expectedChainId = getEVMChainId(chainId);
  
  if (!expectedChainId) {
    return { valid: true }; // Not an EVM chain, no validation needed
  }

  if (transactionChainId === undefined) {
    return {
      valid: false,
      error: `Transaction does not contain chain ID, vulnerable to replay attacks`,
    };
  }

  if (transactionChainId !== expectedChainId) {
    return {
      valid: false,
      error: `Chain ID mismatch: expected ${expectedChainId} for ${chainId}, but transaction has ${transactionChainId}. This could be a replay attack.`,
    };
  }

  return { valid: true };
}