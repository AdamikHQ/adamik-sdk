import { DecoderRegistry } from "../src/decoders/registry";
import { EVMDecoder } from "../src/decoders/evm";
import { BitcoinDecoder } from "../src/decoders/bitcoin";

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

  it("should decode RLP data (placeholder test)", async () => {
    const rawData =
      "0xf86905850430e2340082520894098765432109876543210987654321098765432188016345785d8a0000801ba0";
    const decoded = await decoder.decode(rawData);

    expect(decoded).toBeDefined();
    expect(decoded).toHaveProperty("nonce");
    expect(decoded).toHaveProperty("to");
    expect(decoded).toHaveProperty("value");
  });

  it("should validate decoded transaction", () => {
    const validTx = {
      to: "0x0987654321098765432109876543210987654321",
      value: "1000000000000000000",
      nonce: "5",
      gasPrice: "20000000000",
      gasLimit: "21000",
    };

    expect(decoder.validate(validTx)).toBe(true);
  });

  it("should reject invalid transaction", () => {
    const invalidTx = {
      // Missing required fields
      nonce: "5",
    };

    expect(decoder.validate(invalidTx)).toBe(false);
  });
});

describe("BitcoinDecoder", () => {
  let decoder: BitcoinDecoder;

  beforeEach(() => {
    decoder = new BitcoinDecoder("bitcoin");
  });

  it("should decode PSBT data (placeholder test)", async () => {
    const rawData = "70736274ff0100750200000001268171371edff285e937adeea";
    const decoded = await decoder.decode(rawData);

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
