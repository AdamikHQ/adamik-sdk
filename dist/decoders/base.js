"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseDecoder = void 0;
class BaseDecoder {
    constructor(chainId, format) {
        this.chainId = chainId;
        this.format = format;
    }
    /**
     * Helper method to convert hex string to buffer
     */
    hexToBuffer(hex) {
        // Remove 0x prefix if present
        const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
        return Buffer.from(cleanHex, 'hex');
    }
    /**
     * Helper method to convert buffer to hex string
     */
    bufferToHex(buffer) {
        return '0x' + buffer.toString('hex');
    }
}
exports.BaseDecoder = BaseDecoder;
//# sourceMappingURL=base.js.map