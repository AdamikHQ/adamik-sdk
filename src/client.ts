import { AdamikEncodeResponse, ChainId, TransactionIntent } from "./types";

/**
 * Configuration for the Adamik API client
 */
export interface AdamikAPIConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
}

/**
 * Request format for the Adamik API encode endpoint
 * Based on the actual API schema from adamik-api/src/app/api/[chainId]/transaction/encode/schema.ts
 */
export interface AdamikEncodeRequest {
  transaction: {
    data: {
      mode: string;
      senderAddress: string;
      senderPubKey?: string;
      recipientAddress?: string;
      amount?: string;
      useMaxAmount?: boolean;
      tokenId?: string;
      validatorAddress?: string;
      targetValidatorAddress?: string;
      sourceValidatorAddress?: string;
      stakeId?: string;
      memo?: string;
    };
  };
}

/**
 * Error response format from Adamik API
 */
export interface AdamikAPIError {
  status: {
    errors: Array<{ message: string }>;
    warnings: Array<{ message: string }>;
  };
}

/**
 * Client for interacting with the Adamik API
 * Implements the real API calls based on adamik-link and adamik-api implementations
 */
export class AdamikAPIClient {
  private static readonly DEFAULT_TIMEOUT_MS = 30000;
  
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(config: AdamikAPIConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || AdamikAPIClient.DEFAULT_TIMEOUT_MS;
  }

  /**
   * Encodes a transaction using the Adamik API
   * @param chainId The blockchain to encode for
   * @param intent The transaction intent to encode
   * @returns The encoded transaction response
   */
  async encodeTransaction(chainId: ChainId, intent: TransactionIntent): Promise<AdamikEncodeResponse> {
    const requestBody: AdamikEncodeRequest = {
      transaction: {
        data: {
          mode: intent.mode,
          senderAddress: intent.senderAddress || "",
          recipientAddress: intent.recipientAddress || "",
        },
      },
    };

    // Add optional fields if present
    if (intent.senderPubKey) {
      requestBody.transaction.data.senderPubKey = intent.senderPubKey;
    }
    if (intent.amount) {
      requestBody.transaction.data.amount = intent.amount;
    }
    if (intent.useMaxAmount !== undefined) {
      requestBody.transaction.data.useMaxAmount = intent.useMaxAmount;
    }
    if (intent.tokenId) {
      requestBody.transaction.data.tokenId = intent.tokenId;
    }
    if (intent.validatorAddress) {
      requestBody.transaction.data.validatorAddress = intent.validatorAddress;
    }
    if (intent.targetValidatorAddress) {
      requestBody.transaction.data.targetValidatorAddress = intent.targetValidatorAddress;
    }
    if (intent.sourceValidatorAddress) {
      requestBody.transaction.data.sourceValidatorAddress = intent.sourceValidatorAddress;
    }
    if (intent.stakeId) {
      requestBody.transaction.data.stakeId = intent.stakeId;
    }
    if (intent.memo) {
      requestBody.transaction.data.memo = intent.memo;
    }

    const url = `${this.baseUrl}/api/${chainId}/transaction/encode`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data: unknown = await response.json();

      if (!response.ok) {
        const errorData = data as AdamikAPIError;
        const errorMessage =
          errorData.status?.errors?.[0]?.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Adamik API Error: ${errorMessage}`);
      }

      // Validate response has required structure
      const responseData = data as Record<string, unknown>;
      if (!responseData.chainId || !responseData.transaction) {
        throw new Error("Invalid response format from Adamik API");
      }

      return data as unknown as AdamikEncodeResponse;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error(`Request timeout after ${this.timeout}ms`);
        }
        throw error;
      }
      throw new Error("Unknown error occurred while calling Adamik API");
    }
  }

  /**
   * Helper method to create a client from environment variables
   * Follows the pattern used in adamik-link
   */
  static fromEnvironment(): AdamikAPIClient {
    const baseUrl = process.env.ADAMIK_API_BASE_URL;
    const apiKey = process.env.ADAMIK_API_KEY;

    if (!baseUrl) {
      throw new Error("ADAMIK_API_BASE_URL environment variable is required");
    }
    if (!apiKey) {
      throw new Error("ADAMIK_API_KEY environment variable is required");
    }

    return new AdamikAPIClient({ baseUrl, apiKey });
  }

  /**
   * Test connectivity to the Adamik API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api`, {
        method: "GET",
        headers: {
          Authorization: this.apiKey,
        },
      });

      if (response.ok) {
        return { success: true, message: "Connection successful" };
      } else {
        return { success: false, message: `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown connection error",
      };
    }
  }
}
