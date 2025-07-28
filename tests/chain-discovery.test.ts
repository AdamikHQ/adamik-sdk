import { AdamikSDK } from "../src";

describe("Chain Discovery", () => {
  let sdk: AdamikSDK;

  beforeEach(() => {
    sdk = new AdamikSDK();
  });

  describe("getSupportedChains", () => {
    it("should return all chains with decoder support", () => {
      const supported = sdk.getSupportedChains();
      
      // Should have entries
      expect(Object.keys(supported).length).toBeGreaterThan(0);
      
      // Check structure for a known chain
      expect(supported["ethereum"]).toBeDefined();
      expect(supported["ethereum"]).toEqual({
        family: "evm",
        formats: ["RLP"],
        hasDecoder: true
      });
      
      // Check Bitcoin
      expect(supported["bitcoin"]).toBeDefined();
      expect(supported["bitcoin"]).toEqual({
        family: "bitcoin",
        formats: ["PSBT"],
        hasDecoder: true
      });
      
      // Check Cosmos (should have multiple formats)
      expect(supported["cosmoshub"]).toBeDefined();
      expect(supported["cosmoshub"].family).toBe("cosmos");
      expect(supported["cosmoshub"].formats).toContain("COSMOS_PROTOBUF");
      expect(supported["cosmoshub"].formats).toContain("SIGNDOC_DIRECT");
      expect(supported["cosmoshub"].hasDecoder).toBe(true);
      
      // Check Tron
      expect(supported["tron"]).toBeDefined();
      expect(supported["tron"]).toEqual({
        family: "tron",
        formats: ["RAW_TRANSACTION"],
        hasDecoder: true
      });
      
      // Check Solana
      expect(supported["solana"]).toBeDefined();
      expect(supported["solana"]).toEqual({
        family: "solana",
        formats: ["BORSH"],
        hasDecoder: true
      });
      
      // Verify no unsupported chains are included (e.g., Algorand, Aptos, TON)
      expect(supported["algorand"]).toBeUndefined();
      expect(supported["aptos"]).toBeUndefined();
      expect(supported["ton"]).toBeUndefined();
      expect(supported["starknet"]).toBeUndefined();
    });
    
    it("should include all EVM chains", () => {
      const supported = sdk.getSupportedChains();
      const evmChains = Object.entries(supported)
        .filter(([_, info]) => info.family === "evm")
        .map(([chainId]) => chainId);
      
      // Should include major EVM chains
      expect(evmChains).toContain("ethereum");
      expect(evmChains).toContain("polygon");
      expect(evmChains).toContain("bsc");
      expect(evmChains).toContain("avalanche");
      expect(evmChains).toContain("arbitrum");
      expect(evmChains).toContain("optimism");
      
      // All EVM chains should support RLP
      evmChains.forEach(chainId => {
        expect(supported[chainId].formats).toEqual(["RLP"]);
      });
    });
  });

  
  describe("Chain coverage statistics", () => {
    it("should provide useful statistics about decoder coverage", () => {
      const supported = sdk.getSupportedChains();
      const supportedChains = Object.keys(supported);
      
      // Count by family
      const familyCounts: Record<string, number> = {};
      Object.values(supported).forEach(info => {
        familyCounts[info.family] = (familyCounts[info.family] || 0) + 1;
      });
      
      // Log statistics (useful for documentation)
      Object.entries(familyCounts).forEach(([_family, _count]) => {
        // Family statistics
      });
      
      // Verify we have good coverage
      expect(supportedChains.length).toBeGreaterThan(20); // Should support many chains
      expect(familyCounts["evm"]).toBeGreaterThan(10); // Many EVM chains
      expect(familyCounts["bitcoin"]).toBeGreaterThanOrEqual(2); // At least mainnet and testnet
      expect(familyCounts["cosmos"]).toBeGreaterThanOrEqual(4); // Multiple Cosmos chains
      expect(familyCounts["tron"]).toBeGreaterThanOrEqual(1);
      expect(familyCounts["solana"]).toBeGreaterThanOrEqual(1);
    });
  });
});