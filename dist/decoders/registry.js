"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecoderRegistry = void 0;
const evm_1 = require("./evm");
const bitcoin_1 = require("./bitcoin");
class DecoderRegistry {
    constructor() {
        this.decoders = new Map();
        this.registerDefaultDecoders();
    }
    /**
     * Registers default decoders for supported chains
     */
    registerDefaultDecoders() {
        // EVM chains
        const evmChains = [
            'ethereum', 'sepolia', 'polygon', 'bsc', 'avalanche',
            'arbitrum', 'optimism', 'base'
        ];
        evmChains.forEach(chainId => {
            this.registerDecoder(new evm_1.EVMDecoder(chainId));
        });
        // Bitcoin-like chains
        const bitcoinChains = ['bitcoin', 'bitcoin-testnet'];
        bitcoinChains.forEach(chainId => {
            this.registerDecoder(new bitcoin_1.BitcoinDecoder(chainId));
        });
        // Additional decoders can be added here as they are implemented
    }
    /**
     * Registers a decoder for a specific chain and format
     */
    registerDecoder(decoder) {
        const key = this.getKey(decoder.chainId, decoder.format);
        this.decoders.set(key, decoder);
    }
    /**
     * Gets a decoder for a specific chain and format
     */
    getDecoder(chainId, format) {
        const key = this.getKey(chainId, format);
        return this.decoders.get(key);
    }
    /**
     * Creates a unique key for chain and format combination
     */
    getKey(chainId, format) {
        return `${chainId}:${format}`;
    }
    /**
     * Lists all registered decoders
     */
    listDecoders() {
        return Array.from(this.decoders.keys());
    }
}
exports.DecoderRegistry = DecoderRegistry;
//# sourceMappingURL=registry.js.map