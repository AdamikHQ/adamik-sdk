import { ChainId, RawFormat } from "../types";
import { BaseDecoder, DecoderWithPlaceholder } from "./base";
import { EVMDecoder } from "./evm";
import { BitcoinDecoder } from "./bitcoin";
import { CosmosDecoder } from "./cosmos";
import { TronDecoder } from "./tron";
import { SolanaDecoder } from "./solana";
import { getChainsByFamily } from "../utils/chain-utils";

export class DecoderRegistry {
  private decoders: Map<string, BaseDecoder> = new Map();

  constructor() {
    this.registerDefaultDecoders();
  }

  /**
   * Registers default decoders for supported chains
   */
  private registerDefaultDecoders(): void {
    // EVM chains - get all chains from the EVM family
    const evmChains = getChainsByFamily("evm");
    evmChains.forEach((chain) => {
      this.registerDecoder(new EVMDecoder(chain.id as ChainId));
    });

    // Bitcoin family chains
    const bitcoinChains = getChainsByFamily("bitcoin");
    bitcoinChains.forEach((chain) => {
      this.registerDecoder(new BitcoinDecoder(chain.id as ChainId));
    });

    // Cosmos SDK chains
    const cosmosChains = getChainsByFamily("cosmos");
    
    // Cosmos chains can use multiple formats
    const cosmosFormats: RawFormat[] = [
      "COSMOS_PROTOBUF",
      "SIGNDOC_DIRECT",
      "SIGNDOC_DIRECT_JSON",
      "SIGNDOC_AMINO",
      "SIGNDOC_AMINO_JSON"
    ];
    
    cosmosChains.forEach((chain) => {
      // Register the same decoder for all Cosmos formats
      cosmosFormats.forEach((format) => {
        const decoder = new CosmosDecoder(chain.id as ChainId, format as any);
        this.registerDecoder(decoder);
      });
    });

    // Tron family chains
    const tronChains = getChainsByFamily("tron");
    tronChains.forEach((chain) => {
      this.registerDecoder(new TronDecoder(chain.id as ChainId));
    });

    // Solana family chains
    const solanaChains = getChainsByFamily("solana");
    solanaChains.forEach((chain) => {
      this.registerDecoder(new SolanaDecoder(chain.id as ChainId));
    });

    // Additional decoders can be added here as they are implemented
    // For families without decoders yet (algorand, aptos, starknet, ton), 
    // we could register placeholder decoders or leave them unregistered
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
