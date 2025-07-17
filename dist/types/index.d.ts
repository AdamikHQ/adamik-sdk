export type ChainId = 'ethereum' | 'sepolia' | 'bitcoin' | 'bitcoin-testnet' | 'polygon' | 'bsc' | 'avalanche' | 'arbitrum' | 'optimism' | 'base' | 'aptos' | 'cosmos' | 'algorand' | 'ton' | 'starknet' | 'solana' | 'tron';
export type TransactionMode = 'transfer' | 'transferToken' | 'stake' | 'unstake' | 'claimRewards' | 'deployAccount' | 'withdraw' | 'registerStake' | 'convertAsset';
export type HashFormat = 'sha256' | 'keccak256' | 'sha512_256' | 'pedersen';
export type RawFormat = 'RLP' | 'WALLET_CONNECT' | 'SIGNDOC_DIRECT' | 'SIGNDOC_DIRECT_JSON' | 'SIGNDOC_AMINO' | 'SIGNDOC_AMINO_JSON' | 'BOC' | 'RAW_TRANSACTION' | 'MSGPACK' | 'PSBT' | 'BCS' | 'BORSH';
export interface TransactionIntent {
    mode: TransactionMode;
    senderAddress?: string;
    senderPubKey?: string;
    recipientAddress?: string;
    amount?: string;
    useMaxAmount?: boolean;
    tokenId?: string;
    validatorAddress?: string;
    targetValidatorAddress?: string;
    sourceValidatorAddress?: string;
    stakeId?: string;
    compound?: boolean;
    memo?: string;
}
export interface TransactionData extends TransactionIntent {
    fees: string;
    gas?: string;
    nonce?: string;
    params?: unknown;
}
export interface EncodedTransaction {
    hash: {
        format: HashFormat;
        value: string;
    };
    raw: {
        format: RawFormat;
        value: string;
    };
}
export interface AdamikEncodeResponse {
    chainId: ChainId;
    transaction: {
        data: TransactionData;
        encoded: EncodedTransaction[];
    };
}
export interface VerificationResult {
    isValid: boolean;
    errors?: string[];
    decodedData?: {
        chainId: ChainId;
        transaction: TransactionData;
        raw?: unknown;
    };
}
//# sourceMappingURL=index.d.ts.map