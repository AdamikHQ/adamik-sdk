import AdamikSDK from "../src";
import { AdamikEncodeResponse, TransactionIntent } from "../src/types";

describe("Attack Scenarios", () => {
  let sdk: AdamikSDK;

  beforeEach(() => {
    sdk = new AdamikSDK();
  });

  describe("Malicious Encoded Transactions", () => {
    it("should detect malicious encoded transaction with different recipient", async () => {
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
        recipientAddress: "0x1111111111111111111111111111111111111111", // User wants to send here
        amount: "1000000000000000000",
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
                value: transferFixture.encodedTransaction, // But encoded transaction sends to different address
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
      const transferFixture = ethereumFixtures.find(f => f.intent.mode === "transfer")!;
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
        recipientAddress: transferFixture.intent.recipientAddress,
        amount: "500000000000000000", // User wants to send 0.5 ETH
        useMaxAmount: false // Override useMaxAmount
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
                value: transferFixture.encodedTransaction, // But encoded transaction sends different amount
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
      // This is the most critical security test - API shows what user expects but encoded transaction is malicious
      const maliciousTransaction = "0xf86c098504a817c800825208941111111111111111111111111111111111111111880de0b6b3a76400008025a028ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276a067cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83";
      
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
        recipientAddress: "0x3535353535353535353535353535353535353535", // User expects funds to go here
        amount: "1000000000000000000",
      };

      const apiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            ...intent, // API shows correct recipient and amount
            fees: "21000000000000",
            gas: "21000",
            nonce: "9",
          },
          encoded: [
            {
              hash: {
                format: "keccak256",
                value: "0xf4bf8d3c9861b0f2c6c5e8fa4b4b7f23e3f7dc9b8ae96d25e4d5b7c5af62b17f",
              },
              raw: {
                format: "RLP",
                value: maliciousTransaction, // But this sends to 0x1111... instead
              },
            },
          ],
        },
      };

      const result = await sdk.verify(apiResponse, intent);
      expect(result.isValid).toBe(false);
      expect(result.errors?.some(err => err.includes("Critical: Decoded transaction recipient mismatch"))).toBe(true);
    });
  });
});