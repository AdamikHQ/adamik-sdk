import { ChainId, RawFormat } from '../types';
export declare abstract class BaseDecoder {
    readonly chainId: ChainId;
    readonly format: RawFormat;
    constructor(chainId: ChainId, format: RawFormat);
    /**
     * Decodes the raw transaction data
     * @param rawData The encoded transaction data as a hex string
     * @returns The decoded transaction object
     */
    abstract decode(rawData: string): Promise<unknown>;
    /**
     * Validates the decoded data matches expected structure
     * @param decodedData The decoded transaction data
     * @returns true if valid, false otherwise
     */
    abstract validate(decodedData: unknown): boolean;
    /**
     * Helper method to convert hex string to buffer
     */
    protected hexToBuffer(hex: string): Buffer;
    /**
     * Helper method to convert buffer to hex string
     */
    protected bufferToHex(buffer: Buffer): string;
}
//# sourceMappingURL=base.d.ts.map