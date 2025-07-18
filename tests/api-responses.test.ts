import AdamikSDK from "../src";
import { AdamikEncodeResponse, TransactionIntent } from "../src/types";
import ethereumFixtures from "./fixtures/api-responses/ethereum.json";
import bitcoinFixtures from "./fixtures/api-responses/bitcoin.json";
import cosmosFixtures from "./fixtures/api-responses/cosmos.json";

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
        expect(result.decodedData?.transaction.recipientAddress?.toLowerCase()).toBe(
          fixture.intent.recipientAddress?.toLowerCase()
        );
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
        expect(result.decodedData?.transaction.recipientAddress).toBe(fixture.intent.recipientAddress);
        expect(result.decodedData?.transaction.amount).toBe(fixture.intent.amount);
      });
    });
  });

  describe("Cosmos", () => {
    const fixtures = cosmosFixtures as ApiTestFixture[];
    
    fixtures.forEach(fixture => {
      it.skip(`should validate ${fixture.name} (skipped: Cosmos decoder is placeholder)`, async () => {
        const result = await sdk.verify(fixture.response, fixture.intent);

        expect(result.isValid).toBe(true);
        expect(result.errors || []).toHaveLength(0);
        
        // Verify decoded transaction matches intent
        expect(result.decodedData).toBeDefined();
        expect(result.decodedData?.transaction.recipientAddress).toBe(fixture.intent.recipientAddress);
        expect(result.decodedData?.transaction.amount).toBe(fixture.intent.amount);
        
        // Check memo if present
        if (fixture.intent.memo) {
          expect(result.decodedData?.transaction.memo).toBe(fixture.intent.memo);
        }
      });
    });
  });
});