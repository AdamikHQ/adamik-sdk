import AdamikSDK from "../src";
import { DecoderRegistry } from "../src/decoders/registry";
import { BaseDecoder } from "../src/decoders/base";
import { ChainId } from "../src/types";

describe("Error Handling Paths", () => {
  let sdk: AdamikSDK;

  beforeEach(() => {
    sdk = new AdamikSDK();
  });

  describe("Decoder Errors", () => {
    it("should handle decoder throwing exceptions", async () => {
      // Create a custom decoder that throws
      class ThrowingDecoder extends BaseDecoder {
        constructor() {
          super("ethereum" as ChainId, "RLP");
        }
        
        async decode(_rawData: string): Promise<unknown> {
          throw new Error("Decoder internal error");
        }
        
        validate(_decodedData: unknown): boolean {
          return false;
        }
      }

      // Replace the default decoder
      const registry = (sdk as any).decoderRegistry as DecoderRegistry;
      registry.registerDecoder(new ThrowingDecoder());

      const intent = {
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
            senderAddress: "0x1234567890123456789012345678901234567890",
            recipientAddress: "0x0987654321098765432109876543210987654321",
            amount: "1000000000000000000",
          fees: "21000000000000"
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
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === "DECODE_FAILED")).toBe(true);
      const decodeError = result.errors.find(e => e.code === "DECODE_FAILED");
      expect(decodeError?.message).toContain("Decoder internal error");
      expect(decodeError?.recoveryStrategy).toContain("encoded transaction data may be corrupted");
    });

    it("should handle malformed encoded data", async () => {
      const intent = {
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
            senderAddress: "0x1234567890123456789012345678901234567890",
            recipientAddress: "0x0987654321098765432109876543210987654321",
            amount: "1000000000000000000",
          fees: "21000000000000"
          },
          encoded: [{
            raw: {
              format: "RLP",
              value: "invalid_hex_not_starting_with_0x"
            },
            hash: {
              format: "keccak256",
              value: "0xabcdef..."
            }
          }]
        }
      };

      const result = await sdk.verify(apiResponse, intent);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === "DECODE_FAILED")).toBe(true);
    });
  });

  describe("Schema Validation Errors", () => {
    it("should handle completely invalid API response structure", async () => {
      const intent = {
        mode: "transfer",
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x0987654321098765432109876543210987654321",
        amount: "1000000000000000000"
      };

      const apiResponse = {
        // Missing required fields
        foo: "bar"
      };

      const result = await sdk.verify(apiResponse, intent);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === "INVALID_API_RESPONSE")).toBe(true);
      const validationError = result.errors.find(e => e.code === "INVALID_API_RESPONSE");
      // Recovery strategy might not be present for all error types
      expect(validationError).toBeDefined();
    });

    it("should handle invalid intent structure", async () => {
      const intent = {
        // Missing required mode field
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x0987654321098765432109876543210987654321",
        amount: "1000000000000000000"
      };

      const apiResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x1234567890123456789012345678901234567890",
            recipientAddress: "0x0987654321098765432109876543210987654321",
            amount: "1000000000000000000",
          fees: "21000000000000"
          },
          encoded: []
        }
      };

      const result = await sdk.verify(apiResponse, intent);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === "INVALID_INTENT")).toBe(true);
    });

    it("should handle API response with wrong types", async () => {
      const intent = {
        mode: "transfer",
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x0987654321098765432109876543210987654321",
        amount: "1000000000000000000"
      };

      const apiResponse = {
        chainId: 123, // Should be string
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x1234567890123456789012345678901234567890",
            recipientAddress: "0x0987654321098765432109876543210987654321",
            amount: "1000000000000000000" // Should be string but testing wrong type
          },
          encoded: "not_an_array" // Should be array
        }
      };

      const result = await sdk.verify(apiResponse as any, intent);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === "INVALID_API_RESPONSE")).toBe(true);
    });
  });

  describe("Field Validation Errors", () => {
    it("should handle null values in required fields", async () => {
      const intent = {
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
            senderAddress: null, // Invalid null
            recipientAddress: "0x0987654321098765432109876543210987654321",
            amount: "1000000000000000000",
          fees: "21000000000000"
          },
          encoded: []
        }
      };

      const result = await sdk.verify(apiResponse as any, intent);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should handle undefined values vs missing fields differently", async () => {
      const intent = {
        mode: "transfer",
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x0987654321098765432109876543210987654321",
        amount: "1000000000000000000"
      };

      // API response with undefined (which gets stripped in JSON)
      const apiResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x1234567890123456789012345678901234567890",
            recipientAddress: "0x0987654321098765432109876543210987654321",
            amount: "1000000000000000000",
            fees: "21000000000000",
            tokenId: undefined // Should be ignored
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

      const result = await sdk.verify(apiResponse as any, intent);
      // Should still be valid since undefined fields are optional
      // The viem decoder will handle this gracefully
      expect(result.isValid).toBe(true);
    });
  });

  describe("Cross-validation Errors", () => {
    it("should catch mismatches between decoded data and API response", async () => {
      // Mock a decoder that returns different data than API response
      class MismatchedDecoder extends BaseDecoder {
        constructor() {
          super("ethereum" as ChainId, "RLP");
        }
        
        async decode(_rawData: string): Promise<unknown> {
          return {
            mode: "transfer",
            recipientAddress: "0xDifferentAddress1234567890123456789012345",
            amount: "2000000000000000000", // Different amount
            senderAddress: ""
          };
        }
        
        validate(_decodedData: unknown): boolean {
          return true;
        }
      }

      // Replace the default decoder
      const registry = (sdk as any).decoderRegistry as DecoderRegistry;
      registry.registerDecoder(new MismatchedDecoder());

      const intent = {
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
            senderAddress: "0x1234567890123456789012345678901234567890",
            recipientAddress: "0x0987654321098765432109876543210987654321",
            amount: "1000000000000000000",
          fees: "21000000000000"
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
      expect(result.isValid).toBe(false);
      expect(result.criticalErrors.length).toBeGreaterThan(0);
      expect(result.criticalErrors.some(e => e.code === "CRITICAL_RECIPIENT_MISMATCH")).toBe(true);
      expect(result.criticalErrors.some(e => e.code === "CRITICAL_AMOUNT_MISMATCH")).toBe(true);
    });
  });

  describe("Exception Handling", () => {
    it("should handle unexpected exceptions gracefully", async () => {
      const intent = {
        mode: "transfer",
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x0987654321098765432109876543210987654321",
        amount: "1000000000000000000"
      };

      // Force an internal error by passing non-object values
      const result = await sdk.verify("not an object" as any, intent);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === "INVALID_API_RESPONSE")).toBe(true);
    });

    it("should handle BigInt conversion errors", async () => {
      const intent = {
        mode: "transfer",
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x0987654321098765432109876543210987654321",
        amount: "not_a_number"
      };

      const apiResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x1234567890123456789012345678901234567890",
            recipientAddress: "0x0987654321098765432109876543210987654321",
            amount: "also_not_a_number"
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
      // Should handle the error gracefully
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});