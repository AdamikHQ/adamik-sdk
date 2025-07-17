import { ChainId, RawFormat } from "../types";
import { BaseDecoder } from "./base";
import { EVMDecoder } from "./evm";
import { BitcoinDecoder } from "./bitcoin";

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
    const bitcoinChains: ChainId[] = ["bitcoin", "bitcoin-testnet"];
    bitcoinChains.forEach((chainId) => {
      this.registerDecoder(new BitcoinDecoder(chainId));
    });

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
