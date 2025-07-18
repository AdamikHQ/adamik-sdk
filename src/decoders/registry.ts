import { ChainId, RawFormat } from "../types";
import { BaseDecoder } from "./base";
import { EVMDecoder } from "./evm";
import { BitcoinDecoder } from "./bitcoin";
import { CosmosDecoder } from "./cosmos";
import { TronDecoder } from "./tron";

export class DecoderRegistry {
  private decoders: Map<string, BaseDecoder> = new Map();

  constructor() {
    this.registerDefaultDecoders();
  }

  /**
   * Registers default decoders for supported chains
   */
  private registerDefaultDecoders(): void {
    // EVM chains
    const evmChains: ChainId[] = [
      "ethereum",
      "sepolia",
      "polygon",
      "bsc",
      "avalanche",
      "arbitrum",
      "optimism",
      "base",
    ];

    evmChains.forEach((chainId) => {
      this.registerDecoder(new EVMDecoder(chainId));
    });

    // Bitcoin-like chains
    const bitcoinChains: ChainId[] = ["bitcoin", "bitcoin-testnet", "bitcoin-signet"];
    bitcoinChains.forEach((chainId) => {
      this.registerDecoder(new BitcoinDecoder(chainId));
    });

    // Cosmos SDK chains
    const cosmosChains: ChainId[] = [
      "cosmoshub",
      "celestia",
      "injective",
      "babylon-testnet"
    ];
    
    // Cosmos chains can use multiple formats
    const cosmosFormats: RawFormat[] = [
      "COSMOS_PROTOBUF",
      "SIGNDOC_DIRECT",
      "SIGNDOC_DIRECT_JSON",
      "SIGNDOC_AMINO",
      "SIGNDOC_AMINO_JSON"
    ];
    
    cosmosChains.forEach((chainId) => {
      // Register the same decoder for all Cosmos formats
      cosmosFormats.forEach((format) => {
        const decoder = new CosmosDecoder(chainId);
        // Override the format for registration
        (decoder as any).format = format;
        this.registerDecoder(decoder);
      });
    });

    // Tron
    this.registerDecoder(new TronDecoder("tron"));

    // Additional decoders can be added here as they are implemented
  }

  /**
   * Registers a decoder for a specific chain and format
   */
  registerDecoder(decoder: BaseDecoder): void {
    const key = this.getKey(decoder.chainId, decoder.format);
    this.decoders.set(key, decoder);
  }

  /**
   * Gets a decoder for a specific chain and format
   */
  getDecoder(chainId: ChainId, format: RawFormat): BaseDecoder | undefined {
    const key = this.getKey(chainId, format);
    return this.decoders.get(key);
  }

  /**
   * Creates a unique key for chain and format combination
   */
  private getKey(chainId: ChainId, format: RawFormat): string {
    return `${chainId}:${format}`;
  }

  /**
   * Lists all registered decoders
   */
  listDecoders(): string[] {
    return Array.from(this.decoders.keys());
  }
}
