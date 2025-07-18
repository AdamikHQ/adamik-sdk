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
                value: "0xf86c098504a817c800825208942222222222222222222222222222222222222222880de0b6b3a76400008025a028ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276a067cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83", // But encoded transaction sends to different address (0x2222...)
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
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
        recipientAddress: "0x3535353535353535353535353535353535353535",
        amount: "500000000000000000", // User wants to send 0.5 ETH
        useMaxAmount: false
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
                value: "0xf86c098504a817c800825208943535353535353535353535353535353535353535880de0b6b3a76400008025a028ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276a067cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83", // But encoded transaction sends 1 ETH instead of 0.5
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

  describe("Malicious Injective Transactions", () => {
    it("should detect malicious Injective transaction with different recipient", async () => {
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "inj1akxycslq8cjt0uffw4rjmfm3echchptu52a2dq",
        recipientAddress: "inj1akxycslq8cjt0uffw4rjmfm3echchptu52a2dq", // User wants to send here
        amount: "10000",
        memo: "adamik-test-memo"
      };

      // This is a malicious response where the API shows correct data but the encoded transaction
      // actually sends to a different address
      const maliciousResponse: AdamikEncodeResponse = {
        chainId: "injective",
        transaction: {
          data: {
            ...intent,
            fees: "101068800000000",
            gas: "144384",
            nonce: "86202117",
            senderPubKey: "AuCghumv/N4EYLDfm60KhVZ8z3p9FtP/jjJtbqihS+IB",
            useMaxAmount: false
          }, // API shows correct data
          encoded: [
            {
              raw: {
                format: "SIGNDOC_DIRECT",
                // This encoded transaction actually sends to inj1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (different address)
                value: "0a9b010a86010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e6412660a2a696e6a31616b787963736c7138636a74307566667734726a6d666d336563686368707475353261326471122a696e6a3178787878787878787878787878787878787878787878787878787878787878787878787878781a0c0a03696e6a1205313030303012106164616d696b2d746573742d6d656d6f1281010a610a540a2d2f696e6a6563746976652e63727970746f2e763162657461312e657468736563703235366b312e5075624b657912230a2102e0a086e9affcde0460b0df9bad0a85567ccf7a7d16d3ff8e326d6ea8a14be20112040a0208011885ae8d29121c0a160a03696e6a120f3130313036383830303030303030301080e8081a0b696e6a6563746976652d3120d127"
              },
              hash: {
                format: "keccak256",
                value: "8bad28ac4c07641fd97810e5c722b8d0c93b17571e7385995336cd00dad5cf4a"
              }
            }
          ]
        },
        status: {
          errors: [],
          warnings: []
        }
      };

      const result = await sdk.verify(maliciousResponse, intent);
      expect(result.isValid).toBe(false);
      expect(result.errors?.some(err => err.includes("Critical: Decoded transaction recipient mismatch"))).toBe(true);
    });

    it("should detect malicious Injective transaction with different amount", async () => {
      // User thinks they're sending 100000 but encoded transaction only sends 10000
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "inj1akxycslq8cjt0uffw4rjmfm3echchptu52a2dq",
        recipientAddress: "inj1akxycslq8cjt0uffw4rjmfm3echchptu52a2dq",
        amount: "100000", // User wants to send 100000
        memo: "adamik-test-memo"
      };

      const maliciousResponse: AdamikEncodeResponse = {
        chainId: "injective",
        transaction: {
          data: {
            ...intent, // API shows 100000
            fees: "101068800000000",
            gas: "144384",
            nonce: "86202117",
            senderPubKey: "AuCghumv/N4EYLDfm60KhVZ8z3p9FtP/jjJtbqihS+IB",
            useMaxAmount: false
          },
          encoded: [
            {
              raw: {
                format: "SIGNDOC_DIRECT",
                // This is the actual encoded transaction that only sends 10000
                value: "0a9b010a86010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e6412660a2a696e6a31616b787963736c7138636a74307566667734726a6d666d336563686368707475353261326471122a696e6a31616b787963736c7138636a74307566667734726a6d666d3365636863687074753532613264711a0c0a03696e6a1205313030303012106164616d696b2d746573742d6d656d6f1281010a610a540a2d2f696e6a6563746976652e63727970746f2e763162657461312e657468736563703235366b312e5075624b657912230a2102e0a086e9affcde0460b0df9bad0a85567ccf7a7d16d3ff8e326d6ea8a14be20112040a0208011885ae8d29121c0a160a03696e6a120f3130313036383830303030303030301080e8081a0b696e6a6563746976652d3120d127"
              },
              hash: {
                format: "keccak256",
                value: "8bad28ac4c07641fd97810e5c722b8d0c93b17571e7385995336cd00dad5cf4a"
              }
            }
          ]
        },
        status: {
          errors: [],
          warnings: []
        }
      };

      const result = await sdk.verify(maliciousResponse, intent);
      expect(result.isValid).toBe(false);
      expect(result.errors?.some(err => err.includes("Critical: Decoded transaction amount mismatch"))).toBe(true);
    });
  });
});