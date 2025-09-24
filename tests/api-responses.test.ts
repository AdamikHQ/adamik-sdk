import AdamikSDK from "../src";
import bitcoinFixtures from "./fixtures/api-responses/bitcoin.json";
import celestiaFixtures from "./fixtures/api-responses/celestia.json";
import cosmosFixtures from "./fixtures/api-responses/cosmos.json";
import ethereumFixtures from "./fixtures/api-responses/ethereum.json";
import injectiveFixtures from "./fixtures/api-responses/injective.json";
import solanaFixtures from "./fixtures/api-responses/solana.json";
import tronFixtures from "./fixtures/api-responses/tron.json";

/**
 * API Response Test Suite
 *
 * This test suite contains real API responses manually collected from the Adamik API.
 * Each fixture includes the original intent sent to the API and the actual response received.
 * The SDK verifies these responses independently.
 */

describe("API Response Validation", () => {
  const sdk = new AdamikSDK();

  // Helper function to run tests for each blockchain
  const runBlockchainTests = (
    blockchainName: string,
    fixtures: Record<string, any>,
    customValidations?: (txData: any, intentData: any) => void
  ) => {
    describe(blockchainName, () => {
      Object.entries(fixtures).forEach(([name, data]) => {
        it(`should validate ${name}`, async () => {
          const intent = data.intent.transaction.data;
          const response = data.response;

          const result = await sdk.verify(response, intent);

          // Verify decoded transaction matches intent
          expect(result.decodedData).toBeDefined();
          const txData = result.decodedData?.transaction as any;

          // Common validations
          if ("recipientAddress" in intent) {
            expect(txData.recipientAddress).toBe(intent.recipientAddress);
          }
          if ("validatorAddress" in intent) {
            expect(txData.validatorAddress).toBe(intent.validatorAddress);
          }
          if ("targetValidatorAddress" in intent) {
            expect(txData.targetValidatorAddress).toBe(intent.targetValidatorAddress);
          }
          if ("amount" in intent && !intent.useMaxAmount && intent.mode !== "claimRewards") {
            expect(txData.amount).toBe(intent.amount);
          }
          if ("tokenId" in intent) {
            expect(txData.tokenId).toBe(intent.tokenId);
          }
          if ("senderAddress" in intent) {
            expect(txData.senderAddress).toBe(intent.senderAddress);
          }
          if ("useMaxAmount" in intent && intent.useMaxAmount) {
            expect(txData.amount).toBeDefined();
            expect(txData.amount).toBe(response.transaction.data.amount);
          }

          expect(result.isValid).toBe(true);
          expect(result.errors || []).toHaveLength(0);
          expect(result.criticalErrors || []).toHaveLength(0);

          // Run custom validations if provided
          if (customValidations) {
            customValidations(txData, intent);
          }
        });
      });
    });
  };

  // Run tests for each blockchain
  runBlockchainTests("Ethereum", ethereumFixtures, (txData, intent) => {
    // EVM addresses are case-insensitive
    if ("recipientAddress" in intent && intent.recipientAddress) {
      expect(txData.recipientAddress?.toLowerCase()).toBe(intent.recipientAddress.toLowerCase());
    }
  });

  runBlockchainTests("Bitcoin", bitcoinFixtures);
  runBlockchainTests("Cosmos", cosmosFixtures);
  runBlockchainTests("Injective", injectiveFixtures);
  runBlockchainTests("Tron", tronFixtures);
  runBlockchainTests("Celestia", celestiaFixtures);
  runBlockchainTests("Solana", solanaFixtures);
});
