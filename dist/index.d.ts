import { AdamikEncodeResponse, TransactionIntent, VerificationResult, TransactionData } from './types';
export declare class AdamikSDK {
    private decoderRegistry;
    constructor();
    /**
     * Verifies that an Adamik API response matches the original transaction intent
     * @param apiResponse The response from Adamik API encode endpoint
     * @param originalIntent The original transaction intent sent to the API
     * @returns Verification result with validation status and any errors
     */
    verify(apiResponse: AdamikEncodeResponse, originalIntent: TransactionIntent): Promise<VerificationResult>;
    /**
     * Compares two transaction data objects for equality
     * @param data1 First transaction data
     * @param data2 Second transaction data
     * @returns true if they match, false otherwise
     */
    compareTransactionData(data1: TransactionData, data2: TransactionData): boolean;
}
export * from './types';
export { DecoderRegistry } from './decoders/registry';
export default AdamikSDK;
//# sourceMappingURL=index.d.ts.map