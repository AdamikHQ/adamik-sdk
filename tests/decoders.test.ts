import { BitcoinDecoder } from "../src/decoders/bitcoin";
import { EVMDecoder } from "../src/decoders/evm";
import { CosmosDecoder } from "../src/decoders/cosmos";
import { DecoderRegistry } from "../src/decoders/registry";

describe("Decoders", () => {
  describe("DecoderRegistry", () => {
    let registry: DecoderRegistry;

    beforeEach(() => {
      registry = new DecoderRegistry();
    });

    it("should have default decoders registered", () => {
      const evmDecoder = registry.getDecoder("ethereum", "RLP");
      const btcDecoder = registry.getDecoder("bitcoin", "PSBT");
      const cosmosDecoder = registry.getDecoder("cosmoshub", "COSMOS_PROTOBUF");

      expect(evmDecoder).toBeInstanceOf(EVMDecoder);
      expect(btcDecoder).toBeInstanceOf(BitcoinDecoder);
      expect(cosmosDecoder).toBeInstanceOf(CosmosDecoder);
    });

    it("should list all registered decoders", () => {
      const decoders = registry.listDecoders();

      expect(decoders).toContain("ethereum:RLP");
      expect(decoders).toContain("bitcoin:PSBT");
      expect(decoders).toContain("polygon:RLP");
      expect(decoders).toContain("bsc:RLP");
      expect(decoders).toContain("cosmoshub:COSMOS_PROTOBUF");
      expect(decoders).toContain("celestia:COSMOS_PROTOBUF");
    });

    it("should return undefined for unsupported decoder", () => {
      const decoder = registry.getDecoder("ethereum", "PSBT");
      expect(decoder).toBeUndefined();
    });
  });

  describe("EVMDecoder", () => {
    let decoder: EVMDecoder;

    beforeEach(() => {
      decoder = new EVMDecoder("ethereum");
    });

    it("should decode real RLP transaction", async () => {
      // Real Ethereum transfer transaction RLP
      const rlpData = "0xf86c098504a817c800825208943535353535353535353535353535353535353535880de0b6b3a76400008025a028ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276a067cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83";
      
      const decoded = await decoder.decode(rlpData);

      expect(decoded).toBeDefined();
      expect(decoded).toHaveProperty("mode");
      expect(decoded).toHaveProperty("senderAddress");
      expect(decoded).toHaveProperty("recipientAddress");
      expect(decoded).toHaveProperty("amount");
      expect(decoded.mode).toBe("transfer");
      expect(typeof decoded.amount).toBe("string"); // DecodedTransaction uses string for amounts
    });

    it("should validate decoded transaction", () => {
      const validTx = {
        mode: "transfer",
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x0987654321098765432109876543210987654321",
        amount: "1000000000000000000", // String format for DecodedTransaction
      };

      expect(decoder.validate(validTx)).toBe(true);
    });

    it("should reject invalid transaction", () => {
      const invalidTx = {
        mode: "transfer",
        senderAddress: "invalid-address", // Invalid format
      };

      expect(decoder.validate(invalidTx)).toBe(false);
    });
  });

  describe("BitcoinDecoder", () => {
    let decoder: BitcoinDecoder;

    beforeEach(() => {
      decoder = new BitcoinDecoder("bitcoin");
    });

    it("should decode PSBT data (placeholder implementation)", async () => {
      // Real PSBT data from Bitcoin API response (hex format)
      const psbtData = "70736274ff01007102000000011b43b6166ed0207832f41f743b3ef1a1f1399a44f48ae760d82ed525426e252d0100000000fdffffff02e8030000000000001600143fac1a8303a3a9c25593f341d3b70cf0dfdd59c1a03f0000000000001600143fac1a8303a3a9c25593f341d3b70cf0dfdd59c1000000000001011f10470000000000001600143fac1a8303a3a9c25593f341d3b70cf0dfdd59c1000000";
      
      const decoded = await decoder.decode(psbtData);

      expect(decoded).toBeDefined();
      expect(decoded).toHaveProperty("mode");
      expect(decoded).toHaveProperty("recipientAddress");
      expect(decoded).toHaveProperty("amount");
      expect(decoded).toHaveProperty("raw");
    });

    it("should validate decoded transaction", () => {
      const validTx = {
        mode: "transfer",
        recipientAddress: "bc1q4gwr68h0sqqwca8p40kamch69ynttq4ypw8pwu",
        amount: "1000",
        senderAddress: "bc1qxwhn3cj8spt7kawsdsf2vw36qqjrkmj2ucaf0f",
      };

      expect(decoder.validate(validTx)).toBe(true);
    });

    it("should reject invalid transaction", () => {
      const invalidTx = {
        version: 2,
        // Missing required fields
      };

      expect(decoder.validate(invalidTx)).toBe(false);
    });
  });

  describe("CosmosDecoder", () => {
    let decoder: CosmosDecoder;

    beforeEach(() => {
      decoder = new CosmosDecoder("cosmoshub");
    });

    it("should decode Cosmos protobuf data (placeholder implementation)", async () => {
      // Example Cosmos protobuf data (base64)
      const protoData = "CpABChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEnAKLWNvc21vczFxeXFzenFnaDZreTlmNGdmeXVkM3g5dHRtOTRleDQzNTBrNDZyEi1jb3Ntb3MxNmg5d3VqZzR0bHBoZzg0Y3UzNjZreGg2dDNxMHowZnJ5MW1oMhoQCgV1YXRvbRIHMTAwMDAwMA==";
      
      const decoded = await decoder.decode(protoData);

      expect(decoded).toBeDefined();
      expect(decoded).toHaveProperty("mode");
      expect(decoded).toHaveProperty("recipientAddress");
      expect(decoded).toHaveProperty("amount");
      expect(decoded).toHaveProperty("raw");
    });

    it("should validate decoded transaction", () => {
      const validTx = {
        mode: "transfer",
        recipientAddress: "cosmos1g84934jpu3v5de5yqukkkhxmcvsw3u2ajxvpdl",
        amount: "10000",
        senderAddress: "cosmos1g84934jpu3v5de5yqukkkhxmcvsw3u2ajxvpdl",
        raw: "0x1234",
      };

      expect(decoder.validate(validTx)).toBe(true);
    });

    it("should reject invalid transaction", () => {
      const invalidTx = {
        mode: "transfer",
        recipientAddress: "invalid-address", // Not a valid Cosmos address
        amount: "10000",
      };

      expect(decoder.validate(invalidTx)).toBe(false);
    });

    it("should validate addresses from different Cosmos chains", () => {
      const addresses = [
        "cosmos1g84934jpu3v5de5yqukkkhxmcvsw3u2ajxvpdl",
        "celestia1tkepfylhl7fmkrzsvphky2z0r7upvr9ttd5cs3",
        "osmo1234567890abcdef",
        "juno1234567890abcdef",
        "secret1234567890abcdef",
        "inj1234567890abcdef",
        "bbn1234567890abcdef",
      ];

      addresses.forEach(address => {
        const tx = {
          mode: "transfer",
          recipientAddress: address,
          amount: "1000",
          raw: "0x",
        };
        expect(decoder.validate(tx)).toBe(true);
      });
    });
  });
});