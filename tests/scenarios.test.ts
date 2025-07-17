import AdamikSDK from "../src";
import { AdamikEncodeResponse, TransactionIntent } from "../src/types";
import realTransactions from "./fixtures/real-transactions.json";

describe("Test Scenarios", () => {
  let sdk: AdamikSDK;

  beforeEach(() => {
    sdk = new AdamikSDK();
  });

  describe("Valid Scenarios", () => {
    it("should validate basic ETH transfer", async () => {
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
        recipientAddress: "0x3535353535353535353535353535353535353535",
        amount: "1000000000000000000",
      };

      const apiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            ...intent,
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

    it("should validate ETH transfer with real encoded transaction", async () => {
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
            ...intent,
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
    });

    it("should validate token transfer", async () => {
      const intent: TransactionIntent = {
        mode: "transferToken",
        tokenId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
        recipientAddress: "0x3535353535353535353535353535353535353535",
        amount: "1000000",
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
          encoded: [], // No encoded validation for token transfers in this test
        },
      };

      const result = await sdk.verify(apiResponse, intent);
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });
  });

  describe("Invalid Scenarios", () => {
    it("should detect mode mismatch", async () => {
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
        recipientAddress: "0x3535353535353535353535353535353535353535",
        amount: "1000000000000000000",
      };

      const apiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            ...intent,
            mode: "stake", // Different mode
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

    it("should detect recipient mismatch", async () => {
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
        recipientAddress: "0x3535353535353535353535353535353535353535",
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
        senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
        recipientAddress: "0x3535353535353535353535353535353535353535",
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
  });

  describe("Attack Scenarios", () => {
    it("should detect malicious encoded transaction with different recipient", async () => {
      const realTx = realTransactions.ethereum.transfer;
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
        recipientAddress: "0x1111111111111111111111111111111111111111", // User wants to send here
        amount: realTx.decoded.amount,
      };

      const apiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            ...intent,
            fees: "105000000000000",
            gas: "21000",
            nonce: "9",
          }, // API shows correct data
          encoded: [
            {
              hash: {
                format: "keccak256",
                value: "0x374f3a049e006f36f6cf91b02a3b0ee16c858af2f75858733eb0e927b5b7126c",
              },
              raw: {
                format: "RLP",
                value: realTx.encoded, // But encoded transaction sends to 0x3535...3535
              },
            },
          ],
        },
      };

      const result = await sdk.verify(apiResponse, intent);
      expect(result.isValid).toBe(false);
      expect(result.errors?.some(err => err.includes("Critical: Decoded transaction recipient mismatch"))).toBe(true);
    });

    it("should detect malicious encoded transaction with different amount", async () => {
      const realTx = realTransactions.ethereum.transfer;
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
        recipientAddress: realTx.decoded.recipientAddress,
        amount: "500000000000000000", // User wants to send 0.5 ETH
      };

      const apiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            ...intent,
            fees: "105000000000000",
            gas: "21000",
            nonce: "9",
          }, // API shows 0.5 ETH
          encoded: [
            {
              hash: {
                format: "keccak256",
                value: "0x374f3a049e006f36f6cf91b02a3b0ee16c858af2f75858733eb0e927b5b7126c",
              },
              raw: {
                format: "RLP",
                value: realTx.encoded, // But encoded transaction sends 1 ETH
              },
            },
          ],
        },
      };

      const result = await sdk.verify(apiResponse, intent);
      expect(result.isValid).toBe(false);
      expect(result.errors?.some(err => err.includes("Critical: Decoded transaction amount mismatch"))).toBe(true);
    });
  });
});