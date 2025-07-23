import AdamikSDK from "../src";
import { AdamikEncodeResponse, TransactionIntent } from "../src/types";

describe("AdamikSDK - Complete Validation Tests", () => {
  let sdk: AdamikSDK;

  beforeEach(() => {
    sdk = new AdamikSDK();
  });

  describe("Intent Validation", () => {
    it("should validate matching transaction data", async () => {
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x0987654321098765432109876543210987654321",
        amount: "1000000000000000000", // 1 ETH in wei
      };

      const apiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            ...intent,
            fees: "21000000000000", // gas fee
            gas: "21000",
            nonce: "9",
          },
          encoded: [], // Empty for intent-only validation
        },
      };

      const result = await sdk.verify(apiResponse, intent);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect transaction mode mismatch", async () => {
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x0987654321098765432109876543210987654321",
        amount: "1000000000000000000",
      };

      const apiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            ...intent,
            mode: "stake", // Different mode - should fail
            fees: "21000000000000",
            gas: "21000",
            nonce: "9",
          },
          encoded: [],
        },
      };

      const result = await sdk.verify(apiResponse, intent);

      expect(result.isValid).toBe(false);
      expect(result.errors?.some(err => err.message.includes("mode mismatch"))).toBe(true);
    });

    it("should detect recipient address mismatch", async () => {
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x0987654321098765432109876543210987654321",
        amount: "1000000000000000000",
      };

      const apiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            ...intent,
            recipientAddress: "0x1111111111111111111111111111111111111111", // Different recipient
            fees: "21000000000000",
            gas: "21000",
            nonce: "9",
          },
          encoded: [],
        },
      };

      const result = await sdk.verify(apiResponse, intent);

      expect(result.isValid).toBe(false);
      expect(result.errors?.some(err => err.message.includes("recipientAddress mismatch"))).toBe(true);
    });

    it("should detect amount mismatch", async () => {
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x0987654321098765432109876543210987654321",
        amount: "1000000000000000000",
      };

      const apiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            ...intent,
            amount: "2000000000000000000", // Different amount
            fees: "21000000000000",
            gas: "21000",
            nonce: "9",
          },
          encoded: [],
        },
      };

      const result = await sdk.verify(apiResponse, intent);

      expect(result.isValid).toBe(false);
      expect(result.errors?.some(err => err.message.includes("amount mismatch"))).toBe(true);
    });

    it("should handle token transfers", async () => {
      const intent: TransactionIntent = {
        mode: "transferToken",
        tokenId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x0987654321098765432109876543210987654321",
        amount: "1000000", // 1 USDC
      };

      const apiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            ...intent,
            fees: "105000000000000",
            gas: "50000",
            nonce: "9",
          },
          encoded: [],
        },
      };

      const result = await sdk.verify(apiResponse, intent);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle useMaxAmount transfers", async () => {
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x0987654321098765432109876543210987654321",
        useMaxAmount: true,
      };

      const apiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x1234567890123456789012345678901234567890",
            recipientAddress: "0x0987654321098765432109876543210987654321",
            amount: "999979000000000000", // Some calculated max amount
            useMaxAmount: true,
            fees: "21000000000000",
            gas: "21000",
            nonce: "9",
          },
          encoded: [],
        },
      };

      const result = await sdk.verify(apiResponse, intent);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Decode Functionality", () => {
    it("should decode EVM transaction successfully", async () => {
      // Real RLP-encoded Ethereum transaction from test fixtures
      const result = await sdk.decode({
        chainId: "ethereum",
        format: "RLP",
        encodedData: "0x02ee0107830b7980850109399877825208948bc6922eb94e4858efaf9f433c35bc241f69e8a68736261e3597046a80c0"
      });

      expect(result.decoded).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.decoded?.recipientAddress).toBe("0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6");
      expect(result.decoded?.mode).toBe("transfer");
    });

    it("should handle missing decoder gracefully", async () => {
      const result = await sdk.decode({
        chainId: "unknown-chain" as any,
        format: "UNKNOWN_FORMAT" as any,
        encodedData: "0xdeadbeef"
      });

      expect(result.decoded).toBeNull();
      expect(result.error).toContain("No decoder available");
    });

    it("should handle decoder errors gracefully", async () => {
      const result = await sdk.decode({
        chainId: "ethereum",
        format: "RLP",
        encodedData: "invalid-hex-data"
      });

      expect(result.decoded).toBeNull();
      expect(result.error).toContain("Failed to decode transaction");
    });

    it("should warn when using placeholder decoder", async () => {
      // Assuming Solana has a placeholder decoder
      const result = await sdk.decode({
        chainId: "solana" as any,
        format: "SOLANA_ENCODED" as any,
        encodedData: "base64encodeddata"
      });

      // Since solana decoder doesn't exist, it should fail with no decoder
      expect(result.error).toContain("No decoder available");
    });

    it("should decode Bitcoin PSBT transaction", async () => {
      // Real Bitcoin PSBT data from test fixtures (hex format)
      const psbtData = "70736274ff01007102000000011b43b6166ed0207832f41f743b3ef1a1f1399a44f48ae760d82ed525426e252d0100000000fdffffff02e8030000000000001600143fac1a8303a3a9c25593f341d3b70cf0dfdd59c1a03f0000000000001600143fac1a8303a3a9c25593f341d3b70cf0dfdd59c1000000000001011f10470000000000001600143fac1a8303a3a9c25593f341d3b70cf0dfdd59c1000000";
      
      const result = await sdk.decode({
        chainId: "bitcoin",
        format: "PSBT",
        encodedData: psbtData
      });

      expect(result.decoded).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.decoded?.mode).toBe("transfer");
      expect(result.decoded?.recipientAddress).toBeTruthy();
      expect(result.decoded?.amount).toBeTruthy();
    });

    it("should decode from API response structure", async () => {
      // Simulating decoding from an actual API response
      const apiResponse = {
        chainId: "ethereum" as const,
        transaction: {
          encoded: [{
            raw: {
              format: "RLP" as const,
              value: "0x02ee0107830b7980850109399877825208948bc6922eb94e4858efaf9f433c35bc241f69e8a68736261e3597046a80c0"
            }
          }]
        }
      };

      const result = await sdk.decode({
        chainId: apiResponse.chainId,
        format: apiResponse.transaction.encoded[0].raw.format,
        encodedData: apiResponse.transaction.encoded[0].raw.value
      });

      expect(result.decoded).toBeDefined();
      expect(result.decoded?.recipientAddress).toBe("0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6");
    });
  });
});