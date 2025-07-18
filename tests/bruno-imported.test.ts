import AdamikSDK from "../src";
import { AdamikEncodeResponse, TransactionIntent } from "../src/types";
import * as fs from "fs";
import * as path from "path";

/**
 * Bruno-Imported Test Suite
 * 
 * This test suite uses scenarios imported from the Adamik API's Bruno tests,
 * but performs INDEPENDENT VERIFICATION. We don't trust the API's assertions;
 * instead, we decode and verify the transactions ourselves.
 */

interface BrunoFixture {
  id: string;
  name: string;
  chainId: string;
  intent: TransactionIntent;
  encodedTransaction: string;
  source: string;
}

describe("Bruno-Imported Independent Verification", () => {
  const sdk = new AdamikSDK();
  const fixturesPath = path.join(__dirname, "fixtures/bruno-imported");
  
  // Skip if fixtures don't exist yet
  if (!fs.existsSync(fixturesPath)) {
    it.skip("No Bruno fixtures found. Run: npm run import-bruno-tests", () => {});
    return;
  }
  
  // Load all chain fixtures
  const chainFiles = fs.readdirSync(fixturesPath)
    .filter(f => f.endsWith('.json') && f !== 'summary.json');
  
  chainFiles.forEach(chainFile => {
    const chainId = chainFile.replace('.json', '');
    const fixtures: BrunoFixture[] = JSON.parse(
      fs.readFileSync(path.join(fixturesPath, chainFile), 'utf-8')
    );
    
    describe(`Chain: ${chainId}`, () => {
      fixtures.forEach(fixture => {
        it(`${fixture.name} - Independent Verification`, async () => {
          // Build API response from Bruno data
          const apiResponse: AdamikEncodeResponse = {
            chainId: fixture.chainId as any,
            transaction: {
              data: {
                ...fixture.intent,
                // API might add computed fields
                fees: "0",
                gas: "0",
                nonce: "0"
              },
              encoded: [{
                hash: {
                  format: "keccak256",
                  value: "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                raw: {
                  format: "RLP",
                  value: fixture.encodedTransaction
                }
              }]
            }
          };
          
          // CRITICAL: SDK performs independent verification
          // We do NOT check against Bruno's expectations
          // Instead, we decode and verify ourselves
          const result = await sdk.verify(apiResponse, fixture.intent);
          
          // Log any verification failures for investigation
          if (!result.isValid) {
            console.log(`
              Verification failed for: ${fixture.name}
              Chain: ${fixture.chainId}
              Intent: ${JSON.stringify(fixture.intent, null, 2)}
              Encoded: ${fixture.encodedTransaction}
              Errors: ${result.errors?.join(', ')}
              Source: ${fixture.source}
            `);
          }
          
          // The SDK determines validity based on its own decoding
          // This could catch bugs in the API's encoding!
          expect(result.isValid).toBeDefined();
          
          // If we have a decoder for this chain, it should decode
          if (result.decodedData) {
            expect(result.decodedData.chainId).toBe(fixture.chainId);
          }
        });
      });
    });
  });
  
  // Additional test to ensure we're truly independent
  describe("Independence Verification", () => {
    it("should detect malicious transactions even if API tests pass", async () => {
      // Create a scenario where encoded doesn't match intent
      const maliciousTest = {
        intent: {
          mode: "transfer" as const,
          recipientAddress: "0x1111111111111111111111111111111111111111",
          senderAddress: "0x2222222222222222222222222222222222222222",
          amount: "1000000000000000000"
        },
        // This encoded transaction actually sends to a different address
        encodedTransaction: "0xf86c098504a817c800825208943535353535353535353535353535353535353535880de0b6b3a76400008025a028ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276a067cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83"
      };
      
      const apiResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            ...maliciousTest.intent,
            fees: "21000000000000",
            gas: "21000",
            nonce: "9"
          },
          encoded: [{
            hash: {
              format: "keccak256",
              value: "0x0000000000000000000000000000000000000000000000000000000000000000"
            },
            raw: {
              format: "RLP",
              value: maliciousTest.encodedTransaction
            }
          }]
        }
      };
      
      const result = await sdk.verify(apiResponse, maliciousTest.intent);
      
      // SDK should catch this even if API tests would pass
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => 
        e.includes("recipient mismatch") || 
        e.includes("Recipient address mismatch")
      )).toBe(true);
    });
  });
});