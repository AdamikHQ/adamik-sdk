import { join } from "path";
import { ScenarioRunner } from "../src/test-utils/scenario-runner";
import { PatternRunner } from "../src/test-utils/pattern-runner";
import { TestEnvironmentManager } from "../src/test-utils/test-environment";

describe("Configuration-Driven Tests", () => {
  let envManager: TestEnvironmentManager;
  let runner: ScenarioRunner;

  beforeAll(async () => {
    envManager = TestEnvironmentManager.getInstance();
    const configPath = join(__dirname, "test-config.json");
    const environment = envManager.getCurrentEnvironment();
    runner = new ScenarioRunner(configPath, environment);
    await runner.loadConfiguration();
  });

  describe("Core Scenarios", () => {
    it("should run valid ETH transfer scenario", async () => {
      const result = await runner.runScenario({
        id: "eth-valid-transfer",
        name: "Valid ETH Transfer",
        chainId: "ethereum",
        intent: {
          mode: "transfer",
          senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
          recipientAddress: "0x3535353535353535353535353535353535353535",
          amount: "1000000000000000000",
        },
        expectedResult: {
          isValid: true,
          shouldHaveErrors: false,
        },
        tags: ["ethereum", "transfer", "valid"],
      });

      expect(result.passed).toBe(true);
      expect(result.actualResult?.isValid).toBe(true);
      expect(result.actualResult?.errors).toBeUndefined();
    });

    it("should handle token transfer with placeholder decoder", async () => {
      const result = await runner.runScenario({
        id: "token-transfer-placeholder",
        name: "Token Transfer (Placeholder Decoder)",
        chainId: "ethereum",
        intent: {
          mode: "transferToken",
          tokenId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
          recipientAddress: "0x3535353535353535353535353535353535353535",
          amount: "1000000",
        },
        expectedResult: {
          isValid: false,
          shouldHaveErrors: true,
          expectedErrors: ["Failed to decode transaction"],
        },
        tags: ["ethereum", "token", "placeholder"],
      });

      expect(result.passed).toBe(true); // Test passes because it correctly detects the expected failure
      expect(result.actualResult?.isValid).toBe(false);
    });

    it("should detect transaction mode mismatch", async () => {
      const result = await runner.runScenario({
        id: "mode-mismatch",
        name: "Transaction Mode Mismatch",
        chainId: "ethereum",
        intent: {
          mode: "transfer",
          senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
          recipientAddress: "0x3535353535353535353535353535353535353535",
          amount: "1000000000000000000",
        },
        apiResponse: {
          transaction: {
            data: {
              mode: "stake",
            },
          },
        },
        expectedResult: {
          isValid: false,
          shouldHaveErrors: true,
          expectedErrors: ["Transaction mode mismatch"],
        },
        tags: ["ethereum", "validation", "mode-mismatch"],
      });

      expect(result.passed).toBe(true);
      expect(result.actualResult?.isValid).toBe(false);
    });

    it("should run all scenarios from configuration", async () => {
      const scenarioIds = [
        "eth-valid-transfer",
        "token-transfer-placeholder", 
        "bitcoin-transfer",
        "mode-mismatch",
      ];

      const results = await runner.runScenarios(scenarioIds);
      expect(results).toHaveLength(4);

      // Check that valid scenarios pass (exclude placeholder scenarios)
      const validResults = results.filter(r => 
        r.scenario.tags?.includes("valid") && 
        !r.scenario.tags?.includes("placeholder")
      );
      validResults.forEach(result => {
        expect(result.passed).toBe(true);
      });

      // Check that validation failure scenarios work correctly
      const validationResults = results.filter(r => 
        r.scenario.tags?.includes("mode-mismatch")
      );
      validationResults.forEach(result => {
        expect(result.passed).toBe(true); // Test should pass
        expect(result.actualResult?.isValid).toBe(false); // But SDK should detect the issue
      });
    });
  });

  describe("Attack Pattern Testing", () => {
    let patternRunner: PatternRunner;

    beforeAll(async () => {
      const configPath = join(__dirname, "test-config.json");
      const environment = envManager.getCurrentEnvironment();
      patternRunner = new PatternRunner(configPath, environment);
      await patternRunner.initialize();
    });

    it("should detect encoded recipient mismatch attack", async () => {
      const result = await patternRunner.runPattern("encoded-recipient-mismatch", "attack-pattern-base");

      expect(result.passed).toBe(true);
      expect(result.actualResult?.isValid).toBe(false);
      expect(result.actualResult?.errors?.some(err => err.includes("🚨 CRITICAL: Decoded transaction recipient mismatch"))).toBe(true);
    });

    it("should run multiple attack patterns", async () => {
      const results = await patternRunner.runPatternsByCategory("malicious-api", "attack-pattern-base");

      expect(results.length).toBeGreaterThan(0);
      
      results.forEach(result => {
        expect(result.passed).toBe(true);
        expect(result.actualResult?.isValid).toBe(false);
      });
    });
  });
});