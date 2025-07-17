import { AdamikAPIClient } from "../src/client";
import { TransactionIntent } from "../src/types";

// Mock fetch globally
global.fetch = jest.fn();

describe("AdamikAPIClient", () => {
  let client: AdamikAPIClient;

  beforeEach(() => {
    client = new AdamikAPIClient({
      baseUrl: "https://test-api.adamik.io",
      apiKey: "test-api-key",
      timeout: 5000,
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with correct configuration", () => {
      expect(client).toBeInstanceOf(AdamikAPIClient);
    });

    it("should remove trailing slash from baseUrl", () => {
      const clientWithSlash = new AdamikAPIClient({
        baseUrl: "https://test-api.adamik.io/",
        apiKey: "test-key",
      });
      expect(clientWithSlash).toBeInstanceOf(AdamikAPIClient);
    });

    it("should set default timeout", () => {
      const clientDefaultTimeout = new AdamikAPIClient({
        baseUrl: "https://test-api.adamik.io",
        apiKey: "test-key",
      });
      expect(clientDefaultTimeout).toBeInstanceOf(AdamikAPIClient);
    });
  });

  describe("fromEnvironment", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should create client from environment variables", () => {
      process.env.ADAMIK_API_BASE_URL = "https://env-api.adamik.io";
      process.env.ADAMIK_API_KEY = "env-api-key";

      const envClient = AdamikAPIClient.fromEnvironment();
      expect(envClient).toBeInstanceOf(AdamikAPIClient);
    });

    it("should throw error if base URL is missing", () => {
      delete process.env.ADAMIK_API_BASE_URL;
      process.env.ADAMIK_API_KEY = "test-key";

      expect(() => AdamikAPIClient.fromEnvironment()).toThrow(
        "ADAMIK_API_BASE_URL environment variable is required"
      );
    });

    it("should throw error if API key is missing", () => {
      process.env.ADAMIK_API_BASE_URL = "https://test.com";
      delete process.env.ADAMIK_API_KEY;

      expect(() => AdamikAPIClient.fromEnvironment()).toThrow(
        "ADAMIK_API_KEY environment variable is required"
      );
    });
  });

  describe("testConnection", () => {
    it("should return success for valid API response", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await client.testConnection();

      expect(result.success).toBe(true);
      expect(result.message).toBe("Connection successful");
      expect(fetch).toHaveBeenCalledWith("https://test-api.adamik.io/api", {
        method: "GET",
        headers: {
          Authorization: "test-api-key",
        },
      });
    });

    it("should return failure for HTTP error", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      const result = await client.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toBe("HTTP 401: Unauthorized");
    });

    it("should handle network errors", async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      const result = await client.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toBe("Network error");
    });
  });

  describe("encodeTransaction", () => {
    const mockIntent: TransactionIntent = {
      mode: "transfer",
      senderAddress: "0x1234567890123456789012345678901234567890",
      recipientAddress: "0x0987654321098765432109876543210987654321",
      amount: "1000000000000000000",
    };

    const mockApiResponse = {
      chainId: "ethereum",
      transaction: {
        data: {
          mode: "transfer",
          senderAddress: "0x1234567890123456789012345678901234567890",
          recipientAddress: "0x0987654321098765432109876543210987654321",
          amount: "1000000000000000000",
          fees: "21000000000000",
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
              value: "0xf869...",
            },
          },
        ],
      },
      status: {
        errors: [],
        warnings: [],
      },
    };

    it("should successfully encode transaction", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockApiResponse),
      });

      const result = await client.encodeTransaction("ethereum", mockIntent);

      expect(result).toEqual(mockApiResponse);
      expect(fetch).toHaveBeenCalledWith("https://test-api.adamik.io/api/ethereum/transaction/encode", {
        method: "POST",
        headers: {
          Authorization: "test-api-key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction: {
            data: {
              mode: "transfer",
              senderAddress: "0x1234567890123456789012345678901234567890",
              recipientAddress: "0x0987654321098765432109876543210987654321",
              amount: "1000000000000000000",
            },
          },
        }),
        signal: expect.any(AbortSignal),
      });
    });

    it("should include optional fields when present", async () => {
      const intentWithOptionals: TransactionIntent = {
        ...mockIntent,
        senderPubKey: "0xpubkey123",
        tokenId: "0xtoken456",
        memo: "test memo",
        useMaxAmount: true,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockApiResponse),
      });

      await client.encodeTransaction("ethereum", intentWithOptionals);

      const expectedBody = {
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x1234567890123456789012345678901234567890",
            recipientAddress: "0x0987654321098765432109876543210987654321",
            senderPubKey: "0xpubkey123",
            amount: "1000000000000000000",
            useMaxAmount: true,
            tokenId: "0xtoken456",
            memo: "test memo",
          },
        },
      };

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(expectedBody),
        })
      );
    });

    it("should handle API errors with status", async () => {
      const errorResponse = {
        status: {
          errors: [{ message: "Invalid sender address" }],
          warnings: [],
        },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValueOnce(errorResponse),
      });

      await expect(client.encodeTransaction("ethereum", mockIntent)).rejects.toThrow(
        "Adamik API Error: Invalid sender address"
      );
    });

    it("should handle HTTP errors without status", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: jest.fn().mockResolvedValueOnce({}),
      });

      await expect(client.encodeTransaction("ethereum", mockIntent)).rejects.toThrow(
        "Adamik API Error: HTTP 500: Internal Server Error"
      );
    });

    it("should validate response format", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ invalid: "response" }),
      });

      await expect(client.encodeTransaction("ethereum", mockIntent)).rejects.toThrow(
        "Invalid response format from Adamik API"
      );
    });

    it("should handle network errors", async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network connection failed"));

      await expect(client.encodeTransaction("ethereum", mockIntent)).rejects.toThrow(
        "Network connection failed"
      );
    });

    it("should handle timeout", async () => {
      const abortError = new Error("Request timeout");
      abortError.name = "AbortError";

      (fetch as jest.Mock).mockRejectedValueOnce(abortError);

      await expect(client.encodeTransaction("ethereum", mockIntent)).rejects.toThrow(
        "Request timeout after 5000ms"
      );
    });
  });
});
