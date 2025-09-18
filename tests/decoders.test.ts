import { BaseDecoder } from "../src/decoders/base";
import { BitcoinDecoder } from "../src/decoders/bitcoin";
import { CosmosDecoder } from "../src/decoders/cosmos";
import { EVMDecoder } from "../src/decoders/evm";
import { DecoderRegistry } from "../src/decoders/registry";
import { SolanaDecoder } from "../src/decoders/solana";

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
      const solanaDecoder = registry.getDecoder("solana", "BORSH");

      expect(evmDecoder).toBeInstanceOf(EVMDecoder);
      expect(btcDecoder).toBeInstanceOf(BitcoinDecoder);
      expect(cosmosDecoder).toBeInstanceOf(CosmosDecoder);
      expect(solanaDecoder).toBeInstanceOf(SolanaDecoder);
    });

    it("should list all registered decoders", () => {
      const decoders = registry.listDecoders();

      expect(decoders).toContain("ethereum:RLP");
      expect(decoders).toContain("bitcoin:PSBT");
      expect(decoders).toContain("polygon:RLP");
      expect(decoders).toContain("bsc:RLP");
      expect(decoders).toContain("cosmoshub:COSMOS_PROTOBUF");
      expect(decoders).toContain("celestia:COSMOS_PROTOBUF");
      expect(decoders).toContain("solana:BORSH");
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

    it("should decode real RLP transaction", () => {
      // Real Ethereum transfer transaction RLP
      const rlpData =
        "0xf86c098504a817c800825208943535353535353535353535353535353535353535880de0b6b3a76400008025a028ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276a067cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83";

      const decoded = decoder.decode(rlpData);

      expect(decoded).toBeDefined();
      expect(decoded).toHaveProperty("mode");
      expect(decoded).toHaveProperty("senderAddress");
      expect(decoded).toHaveProperty("recipientAddress");
      expect(decoded).toHaveProperty("amount");
      expect(decoded.mode).toBe("transfer");
      expect(typeof decoded.amount).toBe("string"); // DecodedTransaction uses string for amounts
    });
  });

  describe("BitcoinDecoder", () => {
    let decoder: BitcoinDecoder;

    beforeEach(() => {
      decoder = new BitcoinDecoder("bitcoin");
    });

    it("should decode PSBT data (placeholder implementation)", () => {
      // Real PSBT data from Bitcoin API response (hex format)
      const psbtData =
        "70736274ff01007102000000011b43b6166ed0207832f41f743b3ef1a1f1399a44f48ae760d82ed525426e252d0100000000fdffffff02e8030000000000001600143fac1a8303a3a9c25593f341d3b70cf0dfdd59c1a03f0000000000001600143fac1a8303a3a9c25593f341d3b70cf0dfdd59c1000000000001011f10470000000000001600143fac1a8303a3a9c25593f341d3b70cf0dfdd59c1000000";

      const decoded = decoder.decode(psbtData);

      expect(decoded).toBeDefined();
      expect(decoded).toHaveProperty("mode");
      expect(decoded).toHaveProperty("recipientAddress");
      expect(decoded).toHaveProperty("amount");
      expect(decoded).toHaveProperty("chainSpecificData");
    });
  });

  describe("CosmosDecoder", () => {
    let decoder: CosmosDecoder;

    beforeEach(() => {
      decoder = new CosmosDecoder("cosmoshub");
    });

    it("should decode Cosmos protobuf data", () => {
      // Use actual SignDoc data from the cosmos.json fixture (in hex format)
      const protoData =
        "0aa3010a8e010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e64126e0a2d636f736d6f73316738343933346a70753376356465357971756b6b6b68786d63767377337532616a787670646c122d636f736d6f73316738343933346a70753376356465357971756b6b6b68786d63767377337532616a787670646c1a0e0a057561746f6d1205313030303012106164616d696b2d746573742d6d656d6f12680a510a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a210388459b2653519948b12492f1a0b464720110c147a8155d23d423a5cc3c21d89a12040a02080118b40112130a0d0a057561746f6d1204323739311093e8061a0b636f736d6f736875622d3420f6f201";

      const decoded = decoder.decode(protoData);

      expect(decoded).toBeDefined();
      expect(decoded).toHaveProperty("mode");
      expect(decoded).toHaveProperty("recipientAddress");
      expect(decoded).toHaveProperty("amount");
      expect(decoded).toHaveProperty("chainSpecificData");
    });
  });

  describe("TronDecoder", () => {
    let decoder: BaseDecoder;

    beforeEach(() => {
      const tronDecoder = new DecoderRegistry().getDecoder("tron", "RAW_TRANSACTION");
      if (!tronDecoder) throw new Error("Tron decoder not found");
      decoder = tronDecoder;
    });

    it("should decode Tron transaction (placeholder)", () => {
      const rawTx =
        "0a02170b2208c6e099ee41aa8ac740a8ac84ed81335a66080112620a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412310a1541d43543fa38eabb1d10a302dd4c249662f0da3de91215411c506ba436e22d4892be0a949f3f065878a38d9718b96070e8dcdfec8133";
      const decoded = decoder.decode(rawTx);

      // Since this is a placeholder decoder, it returns fixed values
      expect(decoded).toHaveProperty("chainId", "tron");
      expect(decoded).toHaveProperty("senderAddress");
      expect(decoded).toHaveProperty("recipientAddress");
      expect(decoded).toHaveProperty("amount");
      expect(decoded).toHaveProperty("chainSpecificData");
    });
  });

  describe("SolanaDecoder", () => {
    let decoder: BaseDecoder;

    beforeEach(() => {
      const solanaDecoder = new DecoderRegistry().getDecoder("solana", "BORSH");
      if (!solanaDecoder) throw new Error("Tron decoder not found");
      decoder = solanaDecoder;
    });

    it("should decode Solana transaction (placeholder)", () => {
      const rawTx =
        "010001020b22abf2a5724f66cf158a3af547f9bea1c838b16dd2acb7070cba512ea5b8710000000000000000000000000000000000000000000000000000000000000000342616747323a13ba16a6747b2fe612e4edcd535363d9ff0545f20767951fa1001010200000c02000000193f210900000000";
      const decoded = decoder.decode(rawTx);

      // Since this is a placeholder decoder, it returns fixed values
      expect(decoded).toHaveProperty("chainId", "solana");
      expect(decoded).toHaveProperty("senderAddress");
      expect(decoded).toHaveProperty("recipientAddress");
      expect(decoded).toHaveProperty("amount");
      expect(decoded).toHaveProperty("chainSpecificData");
    });
  });
});
