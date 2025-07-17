import AdamikSDK from "../src";
import { AdamikEncodeResponse, TransactionIntent } from "../src/types";
import realTransactions from "./fixtures/real-transactions.json";

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

  describe("Encoded Transaction Validation", () => {
    it("should validate real RLP transaction", async () => {
      const realTx = realTransactions.ethereum.transfer;
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
        recipientAddress: realTx.decoded.recipientAddress,
        amount: realTx.decoded.amount,
      };

      const apiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
            recipientAddress: realTx.decoded.recipientAddress,
            amount: realTx.decoded.amount,
            fees: "105000000000000",
            gas: "21000",
            nonce: "9",
          },
          encoded: [
            {
              hash: {
                format: "keccak256",
                value: "0x374f3a049e006f36f6cf91b02a3b0ee16c858af2f75858733eb0e927b5b7126c",
              },
              raw: {
                format: "RLP",
                value: realTx.encoded,
              },
            },
          ],
        },
      };

      const result = await sdk.verify(apiResponse, intent);

      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(result.decodedData).toBeDefined();
    });

    it("should detect encoded recipient tampering", async () => {
      const realTx = realTransactions.ethereum.transfer;
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
        recipientAddress: "0x1111111111111111111111111111111111111111", // Different from encoded
        amount: realTx.decoded.amount,
      };

      const apiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
            recipientAddress: "0x1111111111111111111111111111111111111111", // Matches intent but not encoded
            amount: realTx.decoded.amount,
            fees: "105000000000000",
            gas: "21000",
            nonce: "9",
          },
          encoded: [
            {
              hash: {
                format: "keccak256",
                value: "0x374f3a049e006f36f6cf91b02a3b0ee16c858af2f75858733eb0e927b5b7126c",
              },
              raw: {
                format: "RLP",
                value: realTx.encoded, // Still sends to 0x3535...3535
              },
            },
          ],
        },
      };

      const result = await sdk.verify(apiResponse, intent);

      expect(result.isValid).toBe(false);
      expect(result.errors?.some(err => err.includes("Critical: Decoded transaction recipient mismatch"))).toBe(true);
    });

    it("should detect encoded amount tampering", async () => {
      const realTx = realTransactions.ethereum.transfer;
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
        recipientAddress: realTx.decoded.recipientAddress,
        amount: "500000000000000000", // Different from encoded (0.5 ETH vs 1 ETH)
      };

      const apiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
            recipientAddress: realTx.decoded.recipientAddress,
            amount: "500000000000000000", // Matches intent but not encoded
            fees: "105000000000000",
            gas: "21000",
            nonce: "9",
          },
          encoded: [
            {
              hash: {
                format: "keccak256",
                value: "0x374f3a049e006f36f6cf91b02a3b0ee16c858af2f75858733eb0e927b5b7126c",
              },
              raw: {
                format: "RLP",
                value: realTx.encoded, // Still sends 1 ETH
              },
            },
          ],
        },
      };

      const result = await sdk.verify(apiResponse, intent);

      expect(result.isValid).toBe(false);
      expect(result.errors?.some(err => err.includes("Critical: Decoded transaction amount mismatch"))).toBe(true);
    });

    it("should detect malicious API providing correct data but wrong encoded transaction", async () => {
      const realTx = realTransactions.ethereum.transfer;
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
        recipientAddress: "0x1111111111111111111111111111111111111111",
        amount: "500000000000000000",
      };

      // Malicious API: Shows correct data but provides wrong encoded transaction
      const apiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
            recipientAddress: "0x1111111111111111111111111111111111111111", // Shows what user wants
            amount: "500000000000000000", // Shows what user wants
            fees: "105000000000000",
            gas: "21000",
            nonce: "9",
          },
          encoded: [
            {
              hash: {
                format: "keccak256",
                value: "0x374f3a049e006f36f6cf91b02a3b0ee16c858af2f75858733eb0e927b5b7126c",
              },
              raw: {
                format: "RLP",
                value: realTx.encoded, // But actually sends 1 ETH to 0x3535...3535
              },
            },
          ],
        },
      };

      const result = await sdk.verify(apiResponse, intent);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Critical: Decoded transaction recipient mismatch"),
          expect.stringContaining("Critical: Decoded transaction amount mismatch"),
        ])
      );
    });
  });
});