import { getAddress } from "viem";

/**
 * Utility class for normalizing blockchain addresses based on chain type
 */
export class AddressNormalizer {
  private static readonly EVM_CHAINS = [
    "ethereum", 
    "polygon", 
    "bsc", 
    "avalanche", 
    "arbitrum", 
    "optimism", 
    "fantom", 
    "cronos", 
    "moonbeam", 
    "celo",
    "sepolia",
    "base"
  ];

  /**
   * Checks if a chain is EVM-based
   */
  static isEVMChain(chainId: string): boolean {
    return this.EVM_CHAINS.includes(chainId.toLowerCase());
  }

  /**
   * Normalizes an address based on the blockchain type
   * - For EVM chains: returns checksummed address (EIP-55)
   * - For other chains: returns the address as-is
   * 
   * @param address The address to normalize
   * @param chainId The blockchain identifier
   * @returns The normalized address
   */
  static normalize(address: string, chainId: string): string {
    if (!address) return address;
    
    if (this.isEVMChain(chainId)) {
      try {
        // For EVM chains, use checksummed address format for consistent comparison
        return getAddress(address);
      } catch {
        // If not a valid address, return as-is
        return address;
      }
    }
    
    // For non-EVM chains, return as-is
    return address;
  }
}