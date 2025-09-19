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

    it("should decode Solana transfer transaction (placeholder)", () => {
      const rawTx =
        "010001020b22abf2a5724f66cf158a3af547f9bea1c838b16dd2acb7070cba512ea5b8710000000000000000000000000000000000000000000000000000000000000000342616747323a13ba16a6747b2fe612e4edcd535363d9ff0545f20767951fa1001010200000c02000000193f210900000000";
      const decoded = decoder.decode(rawTx);

      expect(decoded).toHaveProperty("chainId", "solana");
      expect(decoded).toHaveProperty("chainSpecificData");
      expect(decoded).toHaveProperty("senderAddress");
      expect(decoded).toHaveProperty("recipientAddress");
      expect(decoded).toHaveProperty("amount");
    });

    it("should decode Solana token transfer transaction", () => {
      const rawTx =
        "010001030b22abf2a5724f66cf158a3af547f9bea1c838b16dd2acb7070cba512ea5b871930898241649b5b112a260e38cfab73773b0fb4962f0ba911a7d35933f857f0b06ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a90ede3f1d58a3b06147fb3e55fd65f18841f32508e7fa838231fc4a7ea961a0710102030101000903f811ab0000000000";
      const decoded = decoder.decode(rawTx);

      expect(decoded).toHaveProperty("chainId", "solana");
      expect(decoded).toHaveProperty("chainSpecificData");
      expect(decoded).toHaveProperty("senderAddress");
      expect(decoded).toHaveProperty("recipientAddress");
      expect(decoded).toHaveProperty("amount");
      expect(decoded).toHaveProperty("tokenId");
    });

    it("should decode Solana staking transfer transaction", () => {
      const rawTx =
        "0200070993cee9268b371061d3e57cbc861b59db8194b7fead70ee5c45d7906a290075b2c8299ff49804dd402d8ccff945f080cba8da55768dfb19ccd1c788878808994d0000000000000000000000000000000000000000000000000000000000000000bb92012657eb9b0bbd98e0109c08a1a16514df3f22df949d5d1b9e2f04aaeb6e06a1d8179137542a983437bdfe2a7ab2557f535c8a78722b68a49dc00000000006a1d817a502050b680791e6ce6db88e1e5b7150f61fc6790a4eb4d10000000006a7d51718c774c928566398691d5eb68b5eb8a39b4b6d5c73555b210000000006a7d517192c5c51218cc94c3d4af17f58daee089ba1fd44e3dbd98a0000000006a7d517193584d0feed9bb3431d13206be544281b57b8566cc5375ff400000043259204d9518da1535935baefcb3ec3d95638f06e17ef29c4f1fc81a1fbce6a030202000134000000008096980000000000c80000000000000006a1d8179137542a983437bdfe2a7ab2557f535c8a78722b68a49dc00000000004020107740000000093cee9268b371061d3e57cbc861b59db8194b7fead70ee5c45d7906a290075b293cee9268b371061d3e57cbc861b59db8194b7fead70ee5c45d7906a290075b200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004060103060805000402000000";
      const decoded = decoder.decode(rawTx);

      expect(decoded).toHaveProperty("chainId", "solana");
      expect(decoded).toHaveProperty("chainSpecificData");
      expect(decoded).toHaveProperty("senderAddress");
      expect(decoded).toHaveProperty("targetValidatorAddress");
      expect(decoded).toHaveProperty("amount");
    });
  });
});
