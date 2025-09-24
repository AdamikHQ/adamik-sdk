import AdamikSDK from "../src";
import { ErrorCode } from "../src/schemas/errors";
import { AdamikEncodeResponse, TransactionIntent } from "../src/types";
describe("Attack Scenarios - Encoded Transaction Tampering", () => {
  let sdk: AdamikSDK;

  beforeEach(() => {
    sdk = new AdamikSDK();
  });

  describe("Malicious API - Ethereum/EVM Attacks", () => {
    it("should detect when encoded RLP transaction sends to different recipient", async () => {
      // User wants to send to address A
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x12f7464C9Ff094098d3F1d987a7C0Ce958E1cC17",
        recipientAddress: "0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6", // Legitimate recipient
        amount: "1000000000000000000", // 1 ETH
      };

      // Malicious API shows correct data but encodes transaction to different address
      const maliciousResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x12f7464C9Ff094098d3F1d987a7C0Ce958E1cC17",
            recipientAddress: "0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6", // Shows correct address
            amount: "1000000000000000000",
            nonce: "7",
            gas: "21000",
            fees: "21000000000000",
          },
          encoded: [
            {
              raw: {
                format: "RLP",
                // This RLP actually sends to attacker address: 0x0000000000000000000000000000000000000001
                value:
                  "0x02ef0107830b7980850109399877825208940000000000000000000000000000000000000001880de0b6b3a764000080c0",
              },
              hash: {
                format: "keccak256",
                value: "0xmalicioustxhash",
              },
            },
          ],
        },
      };

      const result = await sdk.verify(maliciousResponse, intent);

      expect(result.isValid).toBe(false);
      expect(result.criticalErrors.length).toBeGreaterThan(0);
      expect(result.criticalErrors.some((e) => e.code === ErrorCode.CRITICAL_RECIPIENT_MISMATCH)).toBe(true);

      const criticalError = result.criticalErrors.find(
        (e) => e.code === ErrorCode.CRITICAL_RECIPIENT_MISMATCH
      );
      expect(criticalError?.recoveryStrategy).toContain("SECURITY ALERT: Do not sign this transaction!");
    });

    it("should detect when encoded amount differs from displayed amount", async () => {
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x12f7464C9Ff094098d3F1d987a7C0Ce958E1cC17",
        recipientAddress: "0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6",
        amount: "1000000000000000000", // 1 ETH
      };

      const maliciousResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x12f7464C9Ff094098d3F1d987a7C0Ce958E1cC17",
            recipientAddress: "0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6",
            amount: "1000000000000000000", // Shows 1 ETH
            nonce: "7",
            gas: "21000",
            fees: "21000000000000",
          },
          encoded: [
            {
              raw: {
                format: "RLP",
                // This RLP actually sends 10 ETH (10x more)
                value:
                  "0x02ef0107830b7980850109399877825208948bc6922eb94e4858efaf9f433c35bc241f69e8a6888ac7230489e8000080c0",
              },
              hash: {
                format: "keccak256",
                value: "0xmalicioustxhash",
              },
            },
          ],
        },
      };

      const result = await sdk.verify(maliciousResponse, intent);

      expect(result.isValid).toBe(false);
      expect(result.criticalErrors.length).toBeGreaterThan(0);
      expect(result.criticalErrors.some((e) => e.code === ErrorCode.CRITICAL_AMOUNT_MISMATCH)).toBe(true);
    });

    it("should detect subtle attacks with valid-looking but different addresses", async () => {
      // Attack using similar looking address (only last few chars different)
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x12f7464C9Ff094098d3F1d987a7C0Ce958E1cC17",
        recipientAddress: "0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6",
        amount: "1000000000000000000",
      };

      const maliciousResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x12f7464C9Ff094098d3F1d987a7C0Ce958E1cC17",
            recipientAddress: "0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6", // Shows correct
            amount: "1000000000000000000",
            nonce: "7",
            gas: "21000",
            fees: "21000000000000",
          },
          encoded: [
            {
              raw: {
                format: "RLP",
                // Sends to 0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8FF (last chars changed)
                value:
                  "0x02ef0107830b7980850109399877825208948bc6922eb94e4858efaf9f433c35bc241f69e8ff880de0b6b3a764000080c0",
              },
              hash: {
                format: "keccak256",
                value: "0xmalicioustxhash",
              },
            },
          ],
        },
      };

      const result = await sdk.verify(maliciousResponse, intent);

      expect(result.isValid).toBe(false);
      expect(result.criticalErrors.some((e) => e.code === ErrorCode.CRITICAL_RECIPIENT_MISMATCH)).toBe(true);
    });
  });

  describe("Malicious API - Bitcoin Attacks", () => {
    it("should detect when Bitcoin PSBT sends to wrong address", async () => {
      // Note: The Bitcoin decoder can parse PSBT and detect mismatches
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "bc1q87kp4qcr5w5uy4vn7dqa8dcv7r0a6kwpw0r2dv",
        recipientAddress: "bc1q0000000000000000000000000000000000000", // User wants to send here
        amount: "1000", // in satoshis
      };

      const maliciousResponse: AdamikEncodeResponse = {
        chainId: "bitcoin",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "bc1q87kp4qcr5w5uy4vn7dqa8dcv7r0a6kwpw0r2dv",
            recipientAddress: "bc1q0000000000000000000000000000000000000", // Shows what user wants
            amount: "1000",
            fees: "904",
          },
          encoded: [
            {
              raw: {
                format: "PSBT",
                // But this PSBT actually sends to bc1q87kp4qcr5w5uy4vn7dqa8dcv7r0a6kwpw0r2dv (same as sender)
                value:
                  "70736274ff01007102000000011b43b6166ed0207832f41f743b3ef1a1f1399a44f48ae760d82ed525426e252d0100000000fdffffff02e8030000000000001600143fac1a8303a3a9c25593f341d3b70cf0dfdd59c1a03f0000000000001600143fac1a8303a3a9c25593f341d3b70cf0dfdd59c1000000000001011f10470000000000001600143fac1a8303a3a9c25593f341d3b70cf0dfdd59c1000000",
              },
              hash: {
                format: "sha256",
                value: "placeholder-hash",
              },
            },
          ],
        },
      };

      const result = await sdk.verify(maliciousResponse, intent);

      expect(result.isValid).toBe(false);
      expect(result.criticalErrors.length).toBeGreaterThan(0);
      expect(result.criticalErrors.some((e) => e.code === ErrorCode.CRITICAL_RECIPIENT_MISMATCH)).toBe(true);
    });
  });

  describe("Malicious API - Token Transfer Attacks", () => {
    it("should detect when ERC20 token transfer encodes wrong recipient", async () => {
      const intent: TransactionIntent = {
        mode: "transferToken",
        senderAddress: "0x12f7464C9Ff094098d3F1d987a7C0Ce958E1cC17",
        recipientAddress: "0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6",
        tokenId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
        amount: "1000000", // 1 USDC (6 decimals)
      };

      const maliciousResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transferToken",
            senderAddress: "0x12f7464C9Ff094098d3F1d987a7C0Ce958E1cC17",
            recipientAddress: "0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6",
            tokenId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            amount: "1000000",
            nonce: "7",
            gas: "65000",
            fees: "65000000000000",
          },
          encoded: [
            {
              raw: {
                format: "RLP",
                // This would encode a transfer to address 0x0000000000000000000000000000000000000001
                value:
                  "0x02f86c0107830b798085010939987782fde894a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4880b844a9059cbb000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000f4240c0",
              },
              hash: {
                format: "keccak256",
                value: "0xmalicioustokentxhash",
              },
            },
          ],
        },
      };

      const result = await sdk.verify(maliciousResponse, intent);

      expect(result.isValid).toBe(false);
      expect(result.criticalErrors.some((e) => e.code === ErrorCode.CRITICAL_RECIPIENT_MISMATCH)).toBe(true);
    });

    it("should detect when wrong token contract is used", async () => {
      const intent: TransactionIntent = {
        mode: "transferToken",
        senderAddress: "0x12f7464C9Ff094098d3F1d987a7C0Ce958E1cC17",
        recipientAddress: "0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6",
        tokenId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // User wants USDC
        amount: "1000000",
      };

      const maliciousResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transferToken",
            senderAddress: "0x12f7464C9Ff094098d3F1d987a7C0Ce958E1cC17",
            recipientAddress: "0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6",
            tokenId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Shows USDC
            amount: "1000000",
            nonce: "7",
            gas: "65000",
            fees: "65000000000000",
          },
          encoded: [
            {
              raw: {
                format: "RLP",
                // This actually interacts with wrong token contract: 0x0000000000000000000000000000000000000bad
                value:
                  "0x02f86c0107830b798085010939987782fde8940000000000000000000000000000000000000bad80b844a9059cbb0000000000000000000000008bc6922eb94e4858efaf9f433c35bc241f69e8a600000000000000000000000000000000000000000000000000000000000f4240c0",
              },
              hash: {
                format: "keccak256",
                value: "0xmalicioustokentxhash",
              },
            },
          ],
        },
      };

      const result = await sdk.verify(maliciousResponse, intent);

      expect(result.isValid).toBe(false);
      expect(result.criticalErrors.some((e) => e.code === ErrorCode.CRITICAL_TOKEN_MISMATCH)).toBe(true);
    });
  });

  describe("Complex Attack Scenarios", () => {
    it("should detect attacks even with valid computed fields", async () => {
      // API adds valid fees, gas, nonce but still has malicious encoded data
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x12f7464C9Ff094098d3F1d987a7C0Ce958E1cC17",
        recipientAddress: "0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6",
        amount: "1000000000000000000",
      };

      const maliciousResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x12f7464C9Ff094098d3F1d987a7C0Ce958E1cC17",
            recipientAddress: "0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6",
            amount: "1000000000000000000",
            // All these computed fields are valid
            nonce: "7",
            gas: "21000",
            fees: "21000000000000",
          },
          encoded: [
            {
              raw: {
                format: "RLP",
                // But encoded tx still sends to wrong address: 0x0000000000000000000000000000000000000001
                value:
                  "0x02ef0107830b7980850109399877825208940000000000000000000000000000000000000001880de0b6b3a764000080c0",
              },
              hash: {
                format: "keccak256",
                value: "0xmalicioustxhash",
              },
            },
          ],
        },
        status: {
          errors: [],
          warnings: [],
        },
      };

      const result = await sdk.verify(maliciousResponse, intent);

      expect(result.isValid).toBe(false);
      expect(result.criticalErrors.length).toBeGreaterThan(0);
      // Valid computed fields don't make the transaction safe
      expect(result.criticalErrors.some((e) => e.code === ErrorCode.CRITICAL_RECIPIENT_MISMATCH)).toBe(true);
    });

    it("should handle attacks with multiple encoded formats where only one is malicious", async () => {
      const intent: TransactionIntent = {
        mode: "transfer",
        senderAddress: "0x12f7464C9Ff094098d3F1d987a7C0Ce958E1cC17",
        recipientAddress: "0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6",
        amount: "1000000000000000000",
      };

      const maliciousResponse: AdamikEncodeResponse = {
        chainId: "ethereum",
        transaction: {
          data: {
            mode: "transfer",
            senderAddress: "0x12f7464C9Ff094098d3F1d987a7C0Ce958E1cC17",
            recipientAddress: "0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6",
            amount: "1000000000000000000",
            nonce: "7",
            gas: "21000",
            fees: "21000000000000",
          },
          encoded: [
            {
              raw: {
                format: "RLP",
                // First format is malicious - sends to 0x0000000000000000000000000000000000000001
                value:
                  "0x02ef0107830b7980850109399877825208940000000000000000000000000000000000000001880de0b6b3a764000080c0",
              },
              hash: {
                format: "keccak256",
                value: "0xmalicioustxhash",
              },
            },
            {
              raw: {
                format: "WALLET_CONNECT",
                // Second format might be correct, but SDK should catch the first one
                value: '{"to":"0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6","value":"0x0de0b6b3a7640000"}',
              },
              hash: {
                format: "keccak256",
                value: "0xlegittxhash",
              },
            },
          ],
        },
      };

      const result = await sdk.verify(maliciousResponse, intent);

      // SDK validates the first format (RLP) and should detect the attack
      expect(result.isValid).toBe(false);
      expect(result.criticalErrors.length).toBeGreaterThan(0);
    });
  });

  describe("Cosmos/Staking Attack Scenarios", () => {
    it("should detect when staking transaction delegates to wrong validator", async () => {
      const intent: TransactionIntent = {
        mode: "stake",
        senderAddress: "cosmos1g84934jpu3v5de5yqukkkhxmcvsw3u2ajxvpdl",
        targetValidatorAddress: "cosmosvaloper1different_validator_than_encoded", // User wants this validator
        amount: "10000",
      };

      const maliciousResponse: AdamikEncodeResponse = {
        chainId: "cosmoshub",
        transaction: {
          data: {
            mode: "stake",
            senderAddress: "cosmos1g84934jpu3v5de5yqukkkhxmcvsw3u2ajxvpdl",
            targetValidatorAddress: "cosmosvaloper1different_validator_than_encoded", // Shows what user wants
            amount: "10000",
            fees: "4724",
            gas: "188954",
          },
          encoded: [
            {
              raw: {
                format: "SIGNDOC_DIRECT",
                // This is the real stake transaction from fixture - it actually delegates to cosmosvaloper1z8zjv3lntpwxua0rtpvgrcwl0nm0tltgpgs6l7
                value:
                  "0ab1010a9c010a232f636f736d6f732e7374616b696e672e763162657461312e4d736744656c656761746512750a2d636f736d6f73316738343933346a70753376356465357971756b6b6b68786d63767377337532616a787670646c1234636f736d6f7376616c6f706572317a387a6a76336c6e7470777875613072747076677263776c306e6d30746c7467706773366c371a0e0a057561746f6d1205313030303012106164616d696b2d746573742d6d656d6f12680a510a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a210388459b2653519948b12492f1a0b464720110c147a8155d23d423a5cc3c21d89a12040a02080118b40112130a0d0a057561746f6d120434373234109ac40b1a0b636f736d6f736875622d3420f6f201",
              },
              hash: {
                format: "sha256",
                value: "be61a24b1eeee510cbb29e91c2a0f1e616df9294bfb1208c17d36603af3c291e",
              },
            },
          ],
        },
      };

      const result = await sdk.verify(maliciousResponse, intent);

      expect(result.isValid).toBe(false);
      expect(result.criticalErrors.some((e) => e.code === ErrorCode.CRITICAL_VALIDATOR_MISMATCH)).toBe(true);
    });
  });
});
