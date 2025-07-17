import { BaseDecoder } from './base';
import { ChainId } from '../types';
interface BitcoinTransaction {
    version: number;
    inputs: Array<{
        txid: string;
        vout: number;
        scriptSig?: string;
        sequence: number;
    }>;
    outputs: Array<{
        value: number;
        scriptPubKey: string;
    }>;
    locktime: number;
}
export declare class BitcoinDecoder extends BaseDecoder {
    constructor(chainId: ChainId);
    decode(rawData: string): Promise<BitcoinTransaction>;
    validate(decodedData: unknown): boolean;
}
export {};
//# sourceMappingURL=bitcoin.d.ts.map