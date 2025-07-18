import { BitcoinDecoder } from "../src/decoders/bitcoin";
import { EVMDecoder } from "../src/decoders/evm";
import { CosmosDecoder } from "../src/decoders/cosmos";
import { DecoderRegistry } from "../src/decoders/registry";
import ethereumTransactions from "./fixtures/bruno-imported/ethereum.json";
import bitcoinTransactions from "./fixtures/bruno-imported/bitcoin.json";
import cosmosTransactions from "./fixtures/bruno-imported/cosmoshub.json";

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
      const transferTx = ethereumTransactions.find(tx => tx.intent.mode === "transfer");
      expect(transferTx).toBeDefined();
      
      const decoded = await decoder.decode(transferTx!.encodedTransaction);

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
      const transferTx = bitcoinTransactions.find(tx => tx.intent.mode === "transfer");
      expect(transferTx).toBeDefined();
      
      const decoded = await decoder.decode(transferTx!.encodedTransaction);

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
      const transferTx = cosmosTransactions.find(tx => tx.intent.mode === "transfer");
      expect(transferTx).toBeDefined();
      
      const decoded = await decoder.decode(transferTx!.encodedTransaction);

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