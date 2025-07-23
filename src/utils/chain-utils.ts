import type { Chain, ChainFamily, ChainsData } from "../types";
import chainsData from "../constants/chains.json";

// Type assertion for the imported JSON
const typedChainsData = chainsData as ChainsData;

/**
 * Get a chain by its Adamik ID
 */
export function getChainById(chainId: string): Chain | undefined {
  return typedChainsData.chains[chainId];
}

/**
 * Get all chains for a specific family
 */
export function getChainsByFamily(family: ChainFamily): Chain[] {
  return Object.values(typedChainsData.chains).filter(
    (chain) => chain.family === family
  );
}

/**
 * Get the mainnet chain for a testnet
 */
export function getMainnetForTestnet(testnetId: string): Chain | undefined {
  const testnet = getChainById(testnetId);
  if (!testnet?.isTestnetFor) {
    return undefined;
  }
  return getChainById(testnet.isTestnetFor);
}

/**
 * Check if a chain is a testnet
 */
export function isTestnet(chainId: string): boolean {
  const chain = getChainById(chainId);
  return !!chain?.isTestnetFor;
}

/**
 * Get the native ID for an EVM chain (the numeric network ID)
 */
export function getEvmNetworkId(chainId: string): string | undefined {
  const chain = getChainById(chainId);
  if (chain?.family !== "evm") {
    return undefined;
  }
  return chain.nativeId;
}

/**
 * Find a chain by its native ID
 */
export function getChainByNativeId(nativeId: string, family?: ChainFamily): Chain | undefined {
  return Object.values(typedChainsData.chains).find(
    (chain) => chain.nativeId === nativeId && (!family || chain.family === family)
  );
}

/**
 * Get all supported chain IDs
 */
export function getAllChainIds(): string[] {
  return Object.keys(typedChainsData.chains);
}

/**
 * Check if a chain supports a specific transaction type
 */
export function chainSupportsTransactionType(
  chainId: string,
  transactionType: keyof Chain["supportedFeatures"]["write"]["transaction"]["type"]
): boolean {
  const chain = getChainById(chainId);
  if (!chain) {
    return false;
  }
  return chain.supportedFeatures.write.transaction.type[transactionType];
}

/**
 * Get the decimals for a chain's native currency
 */
export function getChainDecimals(chainId: string): number | undefined {
  return getChainById(chainId)?.decimals;
}

/**
 * Get the ticker symbol for a chain's native currency
 */
export function getChainTicker(chainId: string): string | undefined {
  return getChainById(chainId)?.ticker;
}