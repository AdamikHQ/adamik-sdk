import AdamikSDK from "../src";
import { AdamikEncodeResponse, TransactionIntent } from "../src/types";
import ethereumFixtures from "./fixtures/api-responses/ethereum.json";
import bitcoinFixtures from "./fixtures/api-responses/bitcoin.json";
import cosmosFixtures from "./fixtures/api-responses/cosmos.json";
import injectiveFixtures from "./fixtures/api-responses/injective.json";
import tronFixtures from "./fixtures/api-responses/tron.json";
import celestiaFixtures from "./fixtures/api-responses/celestia.json";

/**
 * API Response Test Suite
 * 
 * This test suite contains real API responses manually collected from the Adamik API.
 * Each fixture includes the original intent sent to the API and the actual response received.
 * The SDK verifies these responses independently.
 */

interface ApiTestFixture {
  name: string;
  intent: TransactionIntent;
  response: AdamikEncodeResponse;
}

describe("API Response Validation", () => {
  const sdk = new AdamikSDK();

  describe("Ethereum", () => {
    const fixtures = ethereumFixtures as ApiTestFixture[];
    
    fixtures.forEach(fixture => {
      it(`should validate ${fixture.name}`, async () => {
        const result = await sdk.verify(fixture.response, fixture.intent);

        expect(result.isValid).toBe(true);
        expect(result.errors || []).toHaveLength(0);
        
        // Verify decoded transaction matches intent
        expect(result.decodedData).toBeDefined();
        const txData = result.decodedData?.transaction as any;
        if ('recipientAddress' in fixture.intent && fixture.intent.recipientAddress) {
          expect(txData.recipientAddress?.toLowerCase()).toBe(
            fixture.intent.recipientAddress.toLowerCase()
          );
        }
      });
    });
  });

  describe("Bitcoin", () => {
    const fixtures = bitcoinFixtures as ApiTestFixture[];
    
    fixtures.forEach(fixture => {
      it(`should validate ${fixture.name}`, async () => {
        const result = await sdk.verify(fixture.response, fixture.intent);

        expect(result.isValid).toBe(true);
        expect(result.errors || []).toHaveLength(0);
        
        // Verify decoded transaction matches intent
        expect(result.decodedData).toBeDefined();
        const txData = result.decodedData?.transaction as any;
        if ('recipientAddress' in fixture.intent) {
          expect(txData.recipientAddress).toBe(fixture.intent.recipientAddress);
        }
        if ('amount' in fixture.intent) {
          expect(txData.amount).toBe(fixture.intent.amount);
        }
      });
    });
  });

  describe("Cosmos", () => {
    const fixtures = cosmosFixtures as ApiTestFixture[];
    
    fixtures.forEach(fixture => {
      it(`should validate ${fixture.name}`, async () => {
        const result = await sdk.verify(fixture.response, fixture.intent);

        expect(result.isValid).toBe(true);
        expect(result.errors || []).toHaveLength(0);
        
        // Verify decoded transaction matches intent
        expect(result.decodedData).toBeDefined();
        const txData = result.decodedData?.transaction as any;
        if ('recipientAddress' in fixture.intent) {
          expect(txData.recipientAddress).toBe(fixture.intent.recipientAddress);
        }
        if ('amount' in fixture.intent) {
          expect(txData.amount).toBe(fixture.intent.amount);
        }
      });
    });
  });

  describe("Injective", () => {
    const fixtures = injectiveFixtures as ApiTestFixture[];
    
    fixtures.forEach(fixture => {
      it(`should validate ${fixture.name}`, async () => {
        const result = await sdk.verify(fixture.response, fixture.intent);

        expect(result.isValid).toBe(true);
        expect(result.errors || []).toHaveLength(0);
        
        // Verify decoded transaction matches intent
        expect(result.decodedData).toBeDefined();
        const txData = result.decodedData?.transaction as any;
        if ('recipientAddress' in fixture.intent) {
          expect(txData.recipientAddress).toBe(fixture.intent.recipientAddress);
        }
        if ('amount' in fixture.intent) {
          expect(txData.amount).toBe(fixture.intent.amount);
        }
        
        // Verify sender address for Injective
        if ('senderAddress' in fixture.intent) {
          expect(txData.senderAddress).toBe(fixture.intent.senderAddress);
        }
      });
    });
  });

  describe("Tron", () => {
    const tronTestCases = Object.entries(tronFixtures).map(([name, data]) => ({
      name,
      intent: data.intent.transaction.data,
      response: data.response
    }));
    
    tronTestCases.forEach(testCase => {
      it(`should validate ${testCase.name}`, async () => {
        const result = await sdk.verify(testCase.response, testCase.intent);

        expect(result.isValid).toBe(true);
        expect(result.errors || []).toHaveLength(0);
        
        // Verify decoded transaction matches intent
        expect(result.decodedData).toBeDefined();
        const txData = result.decodedData?.transaction as any;
        const intentData = testCase.intent as any;
        
        if ('recipientAddress' in intentData) {
          expect(txData.recipientAddress).toBe(intentData.recipientAddress);
        }
        if ('amount' in intentData) {
          expect(txData.amount).toBe(intentData.amount);
        }
        if ('tokenId' in intentData) {
          expect(txData.tokenId).toBe(intentData.tokenId);
        }
        if ('senderAddress' in intentData) {
          expect(txData.senderAddress).toBe(intentData.senderAddress);
        }
      });
    });
  });

  describe("Celestia", () => {
    const celestiaTestCases = Object.entries(celestiaFixtures).map(([name, data]) => ({
      name,
      intent: data.intent.transaction.data,
      response: data.response
    }));
    
    celestiaTestCases.forEach(testCase => {
      it(`should validate ${testCase.name}`, async () => {
        const result = await sdk.verify(testCase.response, testCase.intent);

        expect(result.isValid).toBe(true);
        expect(result.errors || []).toHaveLength(0);
        
        // Verify decoded transaction matches intent
        expect(result.decodedData).toBeDefined();
        const txData = result.decodedData?.transaction as any;
        const intentData = testCase.intent as any;
        
        if ('recipientAddress' in intentData) {
          expect(txData.recipientAddress).toBe(intentData.recipientAddress);
        }
        if ('amount' in intentData && !intentData.useMaxAmount) {
          expect(txData.amount).toBe(intentData.amount);
        }
        if ('tokenId' in intentData) {
          expect(txData.tokenId).toBe(intentData.tokenId);
        }
        if ('senderAddress' in intentData) {
          expect(txData.senderAddress).toBe(intentData.senderAddress);
        }
        if ('useMaxAmount' in intentData && intentData.useMaxAmount) {
          // When useMaxAmount is true, the API calculates the actual amount
          expect(txData.amount).toBeDefined();
          expect(txData.amount).toBe(testCase.response.transaction.data.amount);
        }
      });
    });
  });
});