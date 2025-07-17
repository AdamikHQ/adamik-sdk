import { ChainId, RawFormat } from '../types';
import { BaseDecoder } from './base';
export declare class DecoderRegistry {
    private decoders;
    constructor();
    /**
     * Registers default decoders for supported chains
     */
    private registerDefaultDecoders;
    /**
     * Registers a decoder for a specific chain and format
     */
    registerDecoder(decoder: BaseDecoder): void;
    /**
     * Gets a decoder for a specific chain and format
     */
    getDecoder(chainId: ChainId, format: RawFormat): BaseDecoder | undefined;
    /**
     * Creates a unique key for chain and format combination
     */
    private getKey;
    /**
     * Lists all registered decoders
     */
    listDecoders(): string[];
}
//# sourceMappingURL=registry.d.ts.map