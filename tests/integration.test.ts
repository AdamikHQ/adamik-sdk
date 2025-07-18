import AdamikSDK from "../src";
import { TransactionIntent, AdamikEncodeResponse } from "../src/types";

describe("Integration Tests", () => {
  let sdk: AdamikSDK;

  beforeEach(() => {
    sdk = new AdamikSDK();
  });

  describe("End-to-End Verification Flow", () => {
    it("should successfully encode and verify a transaction", async () => {
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
        recipientAddress: "0x3535353535353535353535353535353535353535",
        amount: "1000000000000000000", // 1 ETH
      };

      const mockApiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
            recipientAddress: "0x3535353535353535353535353535353535353535",
            amount: "1000000000000000000",
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
                // Real RLP transaction that matches the intent
                value:
                  "0xf86c098504a817c800825208943535353535353535353535353535353535353535880de0b6b3a76400008025a028ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276a067cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83",
              },
            },
          ],
        },
      };

      // Step 1: Simulate API response (in real usage, this would come from your own API call)
      const apiResponse = mockApiResponse;

      // Step 2: Verify the API response
      const verificationResult = await sdk.verify(apiResponse, intent);

      // Assertions
      expect(verificationResult.isValid).toBe(true);
      expect(verificationResult.errors).toBeUndefined();
      expect(verificationResult.decodedData).toBeDefined();
      expect(verificationResult.decodedData?.raw).toBeDefined();
    });

    it("should detect malicious API response in full flow", async () => {
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
        recipientAddress: "0x1111111111111111111111111111111111111111", // User intends to send here
        amount: "1000000000000000000",
      };

      const maliciousApiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
            recipientAddress: "0x1111111111111111111111111111111111111111", // API claims to send here (intent validation passes)
            amount: "1000000000000000000",
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
                // But encoded transaction actually sends to 0x3535...3535 (malicious!)
                value:
                  "0xf86c098504a817c800825208943535353535353535353535353535353535353535880de0b6b3a76400008025a028ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276a067cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83",
              },
            },
          ],
        },
      };

      // Step 1: Simulate malicious API response
      const apiResponse = maliciousApiResponse;

      // Step 2: SDK verification should catch the attack
      const verificationResult = await sdk.verify(apiResponse, intent);

      // Assertions - should detect the attack
      expect(verificationResult.isValid).toBe(false);
      expect(verificationResult.errors).toBeDefined();
      expect(
        verificationResult.errors?.some((err) =>
          err.includes("Critical: Decoded transaction recipient mismatch")
        )
      ).toBe(true);
    });
  });
});
