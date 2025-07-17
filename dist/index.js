"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecoderRegistry = exports.AdamikSDK = void 0;
const registry_1 = require("./decoders/registry");
class AdamikSDK {
    constructor() {
        this.decoderRegistry = new registry_1.DecoderRegistry();
    }
    /**
     * Verifies that an Adamik API response matches the original transaction intent
     * @param apiResponse The response from Adamik API encode endpoint
     * @param originalIntent The original transaction intent sent to the API
     * @returns Verification result with validation status and any errors
     */
    async verify(apiResponse, originalIntent) {
        const errors = [];
        try {
            // Step 1: Validate API response structure
            if (!apiResponse.chainId || !apiResponse.transaction) {
                errors.push('Invalid API response structure');
                return { isValid: false, errors };
            }
            const { chainId, transaction } = apiResponse;
            const { data, encoded } = transaction;
            // Step 2: Verify transaction mode matches
            if (data.mode !== originalIntent.mode) {
                errors.push(`Transaction mode mismatch: expected ${originalIntent.mode}, got ${data.mode}`);
            }
            // Step 3: Verify core transaction fields
            const verifyField = (field, label) => {
                if (originalIntent[field] !== undefined && data[field] !== originalIntent[field]) {
                    errors.push(`${label} mismatch: expected ${originalIntent[field]}, got ${data[field]}`);
                }
            };
            verifyField('senderAddress', 'Sender address');
            verifyField('recipientAddress', 'Recipient address');
            verifyField('validatorAddress', 'Validator address');
            verifyField('targetValidatorAddress', 'Target validator address');
            verifyField('tokenId', 'Token ID');
            // Step 4: Verify amounts (if not using max amount)
            if (!originalIntent.useMaxAmount && originalIntent.amount !== undefined) {
                if (data.amount !== originalIntent.amount) {
                    errors.push(`Amount mismatch: expected ${originalIntent.amount}, got ${data.amount}`);
                }
            }
            // Step 5: Decode and verify encoded transaction (placeholder for now)
            let decodedRaw;
            if (encoded && encoded.length > 0) {
                try {
                    const decoder = this.decoderRegistry.getDecoder(chainId, encoded[0].raw.format);
                    if (decoder) {
                        decodedRaw = await decoder.decode(encoded[0].raw.value);
                        // Additional verification logic would go here
                    }
                    else {
                        errors.push(`No decoder available for ${chainId} with format ${encoded[0].raw.format}`);
                    }
                }
                catch (decodeError) {
                    errors.push(`Failed to decode transaction: ${decodeError}`);
                }
            }
            // Step 6: Return verification result
            return {
                isValid: errors.length === 0,
                errors: errors.length > 0 ? errors : undefined,
                decodedData: {
                    chainId,
                    transaction: data,
                    raw: decodedRaw
                }
            };
        }
        catch (error) {
            errors.push(`Verification error: ${error}`);
            return { isValid: false, errors };
        }
    }
    /**
     * Compares two transaction data objects for equality
     * @param data1 First transaction data
     * @param data2 Second transaction data
     * @returns true if they match, false otherwise
     */
    compareTransactionData(data1, data2) {
        const keysToCompare = [
            'mode', 'senderAddress', 'recipientAddress', 'amount',
            'tokenId', 'validatorAddress', 'targetValidatorAddress'
        ];
        return keysToCompare.every(key => data1[key] === data2[key]);
    }
}
exports.AdamikSDK = AdamikSDK;
// Export main functions and types
__exportStar(require("./types"), exports);
var registry_2 = require("./decoders/registry");
Object.defineProperty(exports, "DecoderRegistry", { enumerable: true, get: function () { return registry_2.DecoderRegistry; } });
// Default export for convenience
exports.default = AdamikSDK;
//# sourceMappingURL=index.js.map