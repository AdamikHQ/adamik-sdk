import AdamikSDK from "../src";
import { AdamikEncodeResponse, TransactionIntent, TransactionMode } from "../src/types";

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
      expect(result.errors).toBeUndefined();
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
      expect(result.errors).toContain("Transaction mode mismatch: expected transfer, got stake");
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
      expect(result.errors?.some(err => err.includes("Recipient address mismatch"))).toBe(true);
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
      expect(result.errors?.some(err => err.includes("Amount mismatch"))).toBe(true);
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
      expect(result.errors).toBeUndefined();
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
      expect(result.errors).toBeUndefined();
    });
  });
});