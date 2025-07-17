import { BaseDecoder } from './base';
import { ChainId } from '../types';
interface EVMTransaction {
    nonce?: string;
    gasPrice?: string;
    gasLimit?: string;
    to?: string;
    value?: string;
    data?: string;
    v?: string;
    r?: string;
    s?: string;
    chainId?: number;
    from?: string;
}
export declare class EVMDecoder extends BaseDecoder {
    constructor(chainId: ChainId);
    decode(rawData: string): Promise<EVMTransaction>;
    validate(decodedData: unknown): boolean;
    private getChainIdNumber;
}
export {};
//# sourceMappingURL=evm.d.ts.map