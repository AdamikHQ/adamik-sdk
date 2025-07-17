import AdamikSDK from "../src";
import { AdamikEncodeResponse, TransactionIntent } from "../src/types";

describe("AdamikSDK", () => {
  let sdk: AdamikSDK;

  beforeEach(() => {
    sdk = new AdamikSDK();
  });

  describe("verify", () => {
    it("should return valid for matching transaction", async () => {
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
            nonce: "5",
          },
          encoded: [
            {
              hash: {
                format: "keccak256",
                value: "0xabcdef1234567890",
              },
              raw: {
                format: "RLP",
                value:
                  "0xf86905850430e2340082520894098765432109876543210987654321098765432188016345785d8a0000801ba0...",
              },
            },
          ],
        },
      };

      const result = await sdk.verify(apiResponse, intent);

      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(result.decodedData).toBeDefined();
      expect(result.decodedData?.chainId).toBe("ethereum");
    });

    it("should return invalid for mismatched transaction mode", async () => {
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
            mode: "transferToken", // Different mode
            senderAddress: intent.senderAddress,
            recipientAddress: intent.recipientAddress,
            amount: intent.amount,
            fees: "21000000000000",
            tokenId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
          },
          encoded: [],
        },
      };

      const result = await sdk.verify(apiResponse, intent);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Transaction mode mismatch: expected transfer, got transferToken");
    });

    it("should return invalid for mismatched addresses", async () => {
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
          },
          encoded: [],
        },
      };

      const result = await sdk.verify(apiResponse, intent);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Recipient address mismatch: expected 0x0987654321098765432109876543210987654321, got 0x1111111111111111111111111111111111111111"
      );
    });

    it("should return invalid for mismatched amount", async () => {
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
          },
          encoded: [],
        },
      };

      const result = await sdk.verify(apiResponse, intent);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Amount mismatch: expected 1000000000000000000, got 2000000000000000000"
      );
    });

    it("should handle useMaxAmount correctly", async () => {
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
            ...intent,
            amount: "5000000000000000000", // API computed amount
            fees: "21000000000000",
          },
          encoded: [],
        },
      };

      const result = await sdk.verify(apiResponse, intent);

      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it("should return invalid for invalid API response structure", async () => {
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x0987654321098765432109876543210987654321",
        amount: "1000000000000000000",
      };

      const invalidResponse = {
        chainId: "ethereum",
        // Missing transaction property
      } as AdamikEncodeResponse;

      const result = await sdk.verify(invalidResponse, intent);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid API response structure");
    });
  });

  describe("compareTransactionData", () => {
    it("should return true for identical transaction data", () => {
      const data1 = {
        mode: "transfer" as const,
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x0987654321098765432109876543210987654321",
        amount: "1000000000000000000",
        fees: "21000000000000",
      };

      const data2 = { ...data1 };

      expect(sdk.compareTransactionData(data1, data2)).toBe(true);
    });

    it("should return false for different transaction data", () => {
      const data1 = {
        mode: "transfer" as const,
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x0987654321098765432109876543210987654321",
        amount: "1000000000000000000",
        fees: "21000000000000",
      };

      const data2 = {
        ...data1,
        amount: "2000000000000000000", // Different amount
      };

      expect(sdk.compareTransactionData(data1, data2)).toBe(false);
    });
  });
});
