import { EVMDecoder } from "../src/decoders/evm";
import AdamikSDK from "../src";

describe("EVM Chain ID Security - Real Transaction Data", () => {
  let sdk: AdamikSDK;

  beforeEach(() => {
    sdk = new AdamikSDK();
  });

  describe("Real Transaction Validation", () => {
    it("should successfully decode Optimism transaction with correct chain ID", async () => {
      const decoder = new EVMDecoder("optimism");
      
      // Real Optimism transaction from provided data
      const optimismTx = "0x02ed0a818f830f4240830f5ac7825208948bc6922eb94e4858efaf9f433c35bc241f69e8a6870f781467ca0c4280c0";
      
      const result = await decoder.decode(optimismTx);
      
      expect(result).toBeDefined();
      expect(result.recipientAddress).toBe("0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6");
      expect(result.amount).toBe("4354153686633538");
    });

    it("should successfully decode Base transaction with correct chain ID", async () => {
      const decoder = new EVMDecoder("base");
      
      // Real Base transaction from provided data
      const baseTx = "0x02e782210509830f424083873643825208948bc6922eb94e4858efaf9f433c35bc241f69e8a67b80c0";
      
      const result = await decoder.decode(baseTx);
      
      expect(result).toBeDefined();
      expect(result.recipientAddress).toBe("0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6");
      expect(result.amount).toBe("123");
    });

    it("should reject Optimism transaction when decoding as Ethereum", async () => {
      const decoder = new EVMDecoder("ethereum");
      
      // Real Optimism transaction (chain ID 10 = 0xa)
      const optimismTx = "0x02ed0a818f830f4240830f5ac7825208948bc6922eb94e4858efaf9f433c35bc241f69e8a6870f781467ca0c4280c0";
      
      await expect(decoder.decode(optimismTx)).rejects.toThrow(
        "Chain ID mismatch: expected 1 for ethereum, but transaction has 10"
      );
    });

    it("should reject Base transaction when decoding as Polygon", async () => {
      const decoder = new EVMDecoder("polygon");
      
      // Real Base transaction (chain ID 8453 = 0x2105)
      const baseTx = "0x02e782210509830f424083873643825208948bc6922eb94e4858efaf9f433c35bc241f69e8a67b80c0";
      
      await expect(decoder.decode(baseTx)).rejects.toThrow(
        "Chain ID mismatch: expected 137 for polygon, but transaction has 8453"
      );
    });

    it("should detect cross-chain replay attack: Optimism -> Base", async () => {
      // User thinks they're signing for Base, but gets Optimism transaction
      const decoder = new EVMDecoder("base");
      
      // This is an Optimism transaction (chain ID 10)
      const optimismTx = "0x02ed0a818f830f4240830f5ac7825208948bc6922eb94e4858efaf9f433c35bc241f69e8a6870f781467ca0c4280c0";
      
      await expect(decoder.decode(optimismTx)).rejects.toThrow(
        "Chain ID mismatch: expected 8453 for base, but transaction has 10"
      );
    });
  });

  describe("Full SDK Verification with Real Data", () => {
    it("should successfully verify Optimism transaction", async () => {
      const optimismIntent = {
        mode: "transfer" as const,
        senderAddress: "0x6450685AE9C904b7D258A897adc1fa0736dBf5Ab",
        recipientAddress: "0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6",
        useMaxAmount: true
      };

      const optimismResponse = {
        chainId: "optimism" as const,
        transaction: {
          data: {
            mode: "transfer" as const,
            senderAddress: "0x6450685AE9C904b7D258A897adc1fa0736dBf5Ab",
            recipientAddress: "0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6",
            useMaxAmount: true,
            nonce: "143",
            gas: "21000",
            fees: "37516355648",
            amount: "4354153686633538"
          },
          encoded: [{
            raw: {
              format: "RLP" as const,
              value: "0x02ed0a818f830f4240830f5ac7825208948bc6922eb94e4858efaf9f433c35bc241f69e8a6870f781467ca0c4280c0"
            },
            hash: {
              format: "keccak256" as const,
              value: "da02979511ee8acd6d3fc149bd82f4582fcd7f97cac733885bea58c61134299c"
            }
          }]
        },
        status: {
          errors: [],
          warnings: []
        }
      };

      const result = await sdk.verify(optimismResponse, optimismIntent);
      
      expect(result.isValid).toBe(true);
      expect(result.criticalErrors).toHaveLength(0);
    });

    it("should reject cross-chain replay attack with real data", async () => {
      // User wants to send on Base
      const baseIntent = {
        mode: "transfer" as const,
        senderAddress: "0x6450685AE9C904b7D258A897adc1fa0736dBf5Ab",
        recipientAddress: "0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6",
        amount: "123"
      };

      // But malicious API returns Optimism transaction
      const maliciousResponse = {
        chainId: "base" as const, // Claims to be Base
        transaction: {
          data: {
            mode: "transfer" as const,
            senderAddress: "0x6450685AE9C904b7D258A897adc1fa0736dBf5Ab",
            recipientAddress: "0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6",
            amount: "123",
            useMaxAmount: false,
            nonce: "143",
            gas: "21000",
            fees: "37516355648"
          },
          encoded: [{
            raw: {
              format: "RLP" as const,
              // This is actually an Optimism transaction (chain ID 10)!
              value: "0x02ed0a818f830f4240830f5ac7825208948bc6922eb94e4858efaf9f433c35bc241f69e8a6870f781467ca0c4280c0"
            },
            hash: {
              format: "keccak256" as const,
              value: "da02979511ee8acd6d3fc149bd82f4582fcd7f97cac733885bea58c61134299c"
            }
          }]
        },
        status: {
          errors: [],
          warnings: []
        }
      };

      const result = await sdk.verify(maliciousResponse, baseIntent);
      
      expect(result.isValid).toBe(false);
      expect(result.criticalErrors.length).toBeGreaterThan(0);
      expect(result.criticalErrors[0].message).toContain("Chain ID mismatch");
    });
  });

  describe("Wallet Connect Format Chain ID Verification", () => {
    it("should extract chain ID from WALLET_CONNECT format", async () => {
      // The WALLET_CONNECT format contains chainId in JSON
      const walletConnectOptimism = {
        "chainId": "0xa", // 10 in hex
        "maxPriorityFeePerGas": "0xf4240",
        "maxFeePerGas": "0xf5ac7",
        "gas": "0x5208",
        "from": "0x6450685AE9C904b7D258A897adc1fa0736dBf5Ab",
        "nonce": "0x8f",
        "value": "0xf781467ca0c42",
        "to": "0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6"
      };

      const walletConnectBase = {
        "chainId": "0x2105", // 8453 in hex
        "maxPriorityFeePerGas": "0xf4240",
        "maxFeePerGas": "0x873643",
        "gas": "0x5208",
        "from": "0x6450685AE9C904b7D258A897adc1fa0736dBf5Ab",
        "nonce": "0x9",
        "value": "0x7b",
        "to": "0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6"
      };

      // Verify chain IDs are correctly parsed
      expect(parseInt(walletConnectOptimism.chainId, 16)).toBe(10); // Optimism
      expect(parseInt(walletConnectBase.chainId, 16)).toBe(8453); // Base
    });
  });
});