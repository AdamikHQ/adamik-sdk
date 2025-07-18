import { BitcoinDecoder } from "../src/decoders/bitcoin";
import { EVMDecoder } from "../src/decoders/evm";
import { DecoderRegistry } from "../src/decoders/registry";
import ethereumTransactions from "./fixtures/bruno-imported/ethereum.json";
import bitcoinTransactions from "./fixtures/bruno-imported/bitcoin.json";

describe("Decoders", () => {
  describe("DecoderRegistry", () => {
    let registry: DecoderRegistry;

    beforeEach(() => {
      registry = new DecoderRegistry();
    });

    it("should have default decoders registered", () => {
      const evmDecoder = registry.getDecoder("ethereum", "RLP");
      const btcDecoder = registry.getDecoder("bitcoin", "PSBT");

      expect(evmDecoder).toBeInstanceOf(EVMDecoder);
      expect(btcDecoder).toBeInstanceOf(BitcoinDecoder);
    });

    it("should list all registered decoders", () => {
      const decoders = registry.listDecoders();

      expect(decoders).toContain("ethereum:RLP");
      expect(decoders).toContain("bitcoin:PSBT");
      expect(decoders).toContain("polygon:RLP");
      expect(decoders).toContain("bsc:RLP");
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
      expect(typeof decoded.amount).toBe("bigint");
    });

    it("should validate decoded transaction", () => {
      const validTx = {
        mode: "transfer",
        senderAddress: "0x1234567890123456789012345678901234567890",
        recipientAddress: "0x0987654321098765432109876543210987654321",
        amount: BigInt("1000000000000000000"),
        fees: BigInt("21000000000000"),
        gas: BigInt("21000"),
        nonce: BigInt("5"),
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
      expect(decoded).toHaveProperty("version");
      expect(decoded).toHaveProperty("inputs");
      expect(decoded).toHaveProperty("outputs");
      expect(decoded).toHaveProperty("locktime");
    });

    it("should validate decoded transaction", () => {
      const validTx = {
        version: 2,
        inputs: [
          {
            txid: "0000000000000000000000000000000000000000000000000000000000000000",
            vout: 0,
            sequence: 0xffffffff,
          },
        ],
        outputs: [
          {
            value: 100000,
            scriptPubKey: "76a914...",
          },
        ],
        locktime: 0,
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
});