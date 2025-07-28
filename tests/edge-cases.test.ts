import AdamikSDK from "../src";
import { AdamikEncodeResponse, TransactionIntent } from "../src/types";
import { ErrorCode } from "../src/schemas/errors";
describe("Edge Cases and Boundary Conditions", () => {
  let sdk: AdamikSDK;

  beforeEach(() => {
    sdk = new AdamikSDK();
  });

  describe("Boundary Value Tests", () => {
    it("should handle zero amount transfers", async () => {
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x0987654321098765432109876543210987654321",
        amount: "0"
      };

      const apiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x1234567890123456789012345678901234567890",
            recipientAddress: "0x0987654321098765432109876543210987654321",
            amount: "0",
            fees: "21000000000000",
            gas: "21000",
            nonce: "0"
          },
          encoded: [{
            raw: {
              format: "RLP",
              value: "0x02e80180843b9aca008506fc23ac008252089409876543210987654321098765432109876543218080c0"
            },
            hash: {
              format: "keccak256",
              value: "0xabcdef..."
            }
          }]
        }
      };

      const result = await sdk.verify(apiResponse, intent);
      if (!result.isValid) {
        // Validation passed for zero values
      }
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle very large amounts (uint256 max)", async () => {
      const maxUint256 = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x0987654321098765432109876543210987654321",
        amount: maxUint256
      };

      const apiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x1234567890123456789012345678901234567890",
            recipientAddress: "0x0987654321098765432109876543210987654321",
            amount: maxUint256,
            fees: "21000000000000",
            gas: "21000",
            nonce: "0"
          },
          encoded: [{
            raw: {
              format: "RLP",
              value: "0x02f8480180843b9aca008506fc23ac00825208940987654321098765432109876543210987654321a0ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff80c0"
            },
            hash: {
              format: "keccak256",
              value: "0xabcdef..."
            }
          }]
        }
      };

      const result = await sdk.verify(apiResponse, intent);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle empty recipient address (contract creation)", async () => {
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "",
        amount: "1000000000000000000"
      };

      const apiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x1234567890123456789012345678901234567890",
            recipientAddress: "",
            amount: "1000000000000000000",
            fees: "21000000000000",
            gas: "21000",
            nonce: "0"
          },
          encoded: [{
            raw: {
              format: "RLP",
              value: "0x02dc0180843b9aca008506fc23ac0082520880880de0b6b3a764000080c0"
            },
            hash: {
              format: "keccak256",
              value: "0xabcdef..."
            }
          }]
        }
      };

      const result = await sdk.verify(apiResponse, intent);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Missing or Undefined Fields", () => {
    it("should handle missing optional fields in API response", async () => {
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x0987654321098765432109876543210987654321",
        amount: "1000000000000000000"
      };

      const apiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x1234567890123456789012345678901234567890",
            recipientAddress: "0x0987654321098765432109876543210987654321",
            amount: "1000000000000000000",
            fees: "21000000000000"
            // Missing optional fields: gas, nonce - should still be valid
          },
          encoded: [{
            raw: {
              format: "RLP",
              value: "0x02f00180843b9aca008506fc23ac00825208940987654321098765432109876543210987654321880de0b6b3a764000080c0"
            },
            hash: {
              format: "keccak256",
              value: "0xabcdef..."
            }
          }]
        }
      };

      const result = await sdk.verify(apiResponse, intent);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail when required fields are missing", async () => {
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x0987654321098765432109876543210987654321",
        amount: "1000000000000000000"
      };

      const apiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x1234567890123456789012345678901234567890",
            // Missing recipientAddress - should be caught by validation
            amount: "1000000000000000000"
          } as any,
          encoded: []
        }
      };

      const result = await sdk.verify(apiResponse, intent);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Case Sensitivity and Format Variations", () => {
    it("should handle mixed case Ethereum addresses", async () => {
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x12f7464c9ff094098d3f1d987a7c0ce958e1cc17", // lowercase
        recipientAddress: "0x8BC6922EB94E4858EFAF9F433C35BC241F69E8A6", // uppercase
        amount: "1000000000000000000"
      };

      const apiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x12f7464C9Ff094098d3F1d987a7C0Ce958E1cC17", // checksum
            recipientAddress: "0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6", // checksum
            amount: "1000000000000000000",
            fees: "21000000000000",
            gas: "21000",
            nonce: "0"
          },
          encoded: [{
            raw: {
              format: "RLP",
              value: "0x02f00180843b9aca008506fc23ac00825208948bc6922eb94e4858efaf9f433c35bc241f69e8a6880de0b6b3a764000080c0"
            },
            hash: {
              format: "keccak256",
              value: "0xabcdef..."
            }
          }]
        }
      };

      const result = await sdk.verify(apiResponse, intent);
      if (!result.isValid) {
        // Validation passed for mixed case addresses
      }
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle hex values with and without 0x prefix", async () => {
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x0987654321098765432109876543210987654321",
        amount: "1000000000000000000" // decimal
      };

      const apiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x1234567890123456789012345678901234567890",
            recipientAddress: "0x0987654321098765432109876543210987654321",
            amount: "0xde0b6b3a7640000", // hex representation of same amount
            fees: "21000000000000",
            gas: "21000",
            nonce: "0"
          },
          encoded: [{
            raw: {
              format: "RLP",
              value: "0x02f00180843b9aca008506fc23ac00825208940987654321098765432109876543210987654321880de0b6b3a764000080c0"
            },
            hash: {
              format: "keccak256",
              value: "0xabcdef..."
            }
          }]
        }
      };

      const result = await sdk.verify(apiResponse, intent);
      expect(result.isValid).toBe(false); // Should fail because amounts don't match
      expect(result.errors.some(e => e.code === ErrorCode.AMOUNT_MISMATCH)).toBe(true);
    });
  });

  describe("Special Transaction Types", () => {
    it("should handle self-transfers (sender = recipient)", async () => {
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x1234567890123456789012345678901234567890", // same as sender
        amount: "1000000000000000000"
      };

      const apiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x1234567890123456789012345678901234567890",
            recipientAddress: "0x1234567890123456789012345678901234567890",
            amount: "1000000000000000000",
            fees: "21000000000000",
            gas: "21000",
            nonce: "0"
          },
          encoded: [{
            raw: {
              format: "RLP",
              value: "0x02f00180843b9aca008506fc23ac00825208941234567890123456789012345678901234567890880de0b6b3a764000080c0"
            },
            hash: {
              format: "keccak256",
              value: "0xabcdef..."
            }
          }]
        }
      };

      const result = await sdk.verify(apiResponse, intent);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle multiple encoded formats in response", async () => {
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x0987654321098765432109876543210987654321",
        amount: "1000000000000000000"
      };

      const apiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x1234567890123456789012345678901234567890",
            recipientAddress: "0x0987654321098765432109876543210987654321",
            amount: "1000000000000000000",
            fees: "21000000000000",
            gas: "21000",
            nonce: "0"
          },
          encoded: [
            {
              raw: {
                format: "RLP",
                value: "0x02f00180843b9aca008506fc23ac00825208940987654321098765432109876543210987654321880de0b6b3a764000080c0"
              },
              hash: {
                format: "keccak256",
                value: "0xabcdef..."
              }
            },
            {
              raw: {
                format: "WALLET_CONNECT",
                value: "{\"to\":\"0x0987654321098765432109876543210987654321\",\"value\":\"0x8ac7230489e80000\"}"
              },
              hash: {
                format: "keccak256",
                value: "0xabcdef..."
              }
            }
          ]
        }
      };

      const result = await sdk.verify(apiResponse, intent);
      // Should use the first format (RLP) for validation
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Error Recovery and Partial Validation", () => {
    it("should provide recovery strategies in error messages", async () => {
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x0987654321098765432109876543210987654321",
        amount: "1000000000000000000"
      };

      const apiResponse: AdamikEncodeResponse = {
        chainId: "solana", // Unsupported chain
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x1234567890123456789012345678901234567890",
            recipientAddress: "0x0987654321098765432109876543210987654321",
            amount: "1000000000000000000",
            fees: "21000000000000",
            gas: "21000",
            nonce: "0"
          },
          encoded: [{
            raw: {
              format: "RAW_TRANSACTION",
              value: "somebase64data"
            },
            hash: {
              format: "sha256",
              value: "0xabcdef..."
            }
          }]
        }
      };

      const result = await sdk.verify(apiResponse, intent);
      // Should have warnings about missing decoder with recovery strategy
      expect(result.warnings.length).toBeGreaterThan(0);
      const decoderWarning = result.warnings.find(w => w.code === ErrorCode.MISSING_DECODER);
      expect(decoderWarning).toBeDefined();
      expect(decoderWarning?.recoveryStrategy).toBeDefined();
      expect(decoderWarning?.recoveryStrategy).toContain("blockchain may not be fully supported");
    });

    it("should deduplicate repeated errors", async () => {
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x0987654321098765432109876543210987654321",
        amount: "1000000000000000000"
      };

      const apiResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "invalid_address", // Invalid
            recipientAddress: "invalid_address", // Invalid
            amount: "invalid_amount" // Invalid
          },
          encoded: []
        }
      };

      const result = await sdk.verify(apiResponse, intent);
      expect(result.isValid).toBe(false);
      
      // Check that errors are unique even if the same validation might trigger multiple times
      const errorCodes = result.errors.map(e => e.code);
      const uniqueErrorCodes = [...new Set(errorCodes)];
      expect(errorCodes.length).toBe(uniqueErrorCodes.length);
    });
  });
});