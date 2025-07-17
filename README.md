# Adamik SDK

[![CI](https://github.com/fabricedautriat/adamik-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/fabricedautriat/adamik-sdk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/adamik-sdk.svg)](https://badge.fury.io/js/adamik-sdk)

A TypeScript/Node.js SDK for verifying Adamik API responses. This open-source SDK allows developers to verify that transaction data returned by the Adamik API matches the original transaction intent.

**⚠️ Note**: This SDK currently provides **Layer 1 verification** (readable data fields) with **placeholder decoders** for Layer 2 (encoded transaction verification). See [Security & Current Limitations](#️-security--current-limitations) below.

## Core Principle: Two-Variable Verification

The Adamik SDK follows a simple but crucial security pattern:

```typescript
// 🔒 Security Pattern: Always verify API responses against original intent

// Variable A: Your original intent (what you want to do)
const originalIntent = {
  mode: "transfer",
  senderAddress: "0x...",
  recipientAddress: "0x...",
  amount: "1000000000000000000",
};

// Variable B: API response (intent + computed fields like fees)
const apiResponse = await adamikAPI.encodeTransaction(chainId, originalIntent);

// ✅ Verification: Does B match A?
const result = await sdk.verify(apiResponse, originalIntent);
```

**Why this matters**: This prevents malicious APIs from changing recipient addresses, amounts, or transaction types without your knowledge.

### What Gets Verified

The SDK compares these critical fields between your intent and the API response:

- ✅ **Transaction mode** (`transfer`, `stake`, `transferToken`, etc.)
- ✅ **Sender address** (your wallet address)
- ✅ **Recipient address** (where funds are going)
- ✅ **Amount** (how much you want to send)
- ✅ **Token ID** (which token for token transfers)
- ✅ **Validator addresses** (for staking operations)

**Note**: The API is allowed to add computed fields like `fees`, `gas`, `nonce` - these are expected and safe.

## ⚠️ Security & Current Limitations

### Two-Layer Security Model

Complete transaction verification requires **two layers of checking**:

```typescript
// 🔍 LAYER 1: Data Field Verification (✅ Currently Implemented)
// Check: transaction.data vs your original intent
const dataMatches = sdk.verify(apiResponse, originalIntent);

// 🔍 LAYER 2: Encoded Transaction Verification (❌ Currently Limited)
// Check: Decode transaction.encoded and verify it matches your intent
const decoded = decoder.decode(apiResponse.transaction.encoded[0].raw.value);
const encodedMatches = decoded.amount === originalIntent.amount;
```

### ⚠️ Current Implementation Status

**Layer 1** ✅ **Fully Implemented**:

- Verifies `transaction.data` fields match your intent
- Catches API tampering with readable fields

**Layer 2** ❌ **Currently Using Placeholder Decoders**:

- The decoders return mock data, not real decoded transactions
- **This means the encoded transaction is NOT actually verified**
- A malicious API could return correct `transaction.data` but incorrect `transaction.encoded`

### 🚨 Security Implications

**What you're protected from**:

- ✅ API changing recipient address in `transaction.data`
- ✅ API modifying amount in `transaction.data`
- ✅ API switching transaction mode in `transaction.data`

**What you're NOT currently protected from**:

- ❌ Malicious API providing correct `transaction.data` but wrong `transaction.encoded`
- ❌ Bugs causing mismatch between readable data and encoded transaction
- ❌ Hash verification of the encoded transaction

### 💡 Production Recommendations

For production use, you should:

1. **Implement real decoders** using libraries like:
   - `ethers.js` or `viem` for EVM chains
   - `bitcoinjs-lib` for Bitcoin
   - Chain-specific libraries for other networks

2. **Verify the decoded transaction** matches your original intent
3. **Implement hash verification** of the encoded data
4. **Consider using multiple verification methods**

```typescript
// Production-ready verification would look like:
const sdk = new AdamikSDK();
const result = await sdk.verify(apiResponse, originalIntent);

if (result.isValid) {
  // Additional verification with real decoder
  const realDecoder = new RealEthereumDecoder();
  const decoded = await realDecoder.decode(apiResponse.transaction.encoded[0].raw.value);

  if (decoded.to !== originalIntent.recipientAddress) {
    throw new Error("🚨 SECURITY ALERT: Encoded transaction doesn't match intent!");
  }

  // Now safe to sign
  console.log("✅ Both layers verified - safe to sign");
}
```

## Features

### ✅ Currently Implemented

- **Layer 1 Verification**: Compare readable `transaction.data` fields against your intent
- **Multi-chain Support**: EVM, Bitcoin, and extensible architecture
- **Real API Integration**: `AdamikAPIClient` for calling actual Adamik API
- **TypeScript Support**: Full type definitions and IDE support
- **Comprehensive Testing**: 30+ tests covering core functionality

### 🚧 In Development

- **Layer 2 Verification**: Real decoding of `transaction.encoded` (currently placeholder)
- **Production Decoders**: Integration with `ethers.js`, `bitcoinjs-lib`, etc.
- **Hash Validation**: Cryptographic verification of encoded transactions

## Installation

```bash
npm install adamik-sdk
```

## Configuration

For real API integration, you'll need:

```bash
export ADAMIK_API_BASE_URL=https://api.adamik.io
export ADAMIK_API_KEY=your-actual-api-key
```

Visit [Adamik](https://dashboard.adamik.io) to get your API key.

## Usage

### Basic Usage with Mock Data

The core pattern: **always compare your original intent with the API response**.

```typescript
import AdamikSDK from "adamik-sdk";

const sdk = new AdamikSDK();

// VARIABLE A: Your original transaction intent (what you want to do)
const intent = {
  mode: "transfer",
  senderAddress: "0x1234567890123456789012345678901234567890",
  recipientAddress: "0x0987654321098765432109876543210987654321",
  amount: "1000000000000000000", // 1 ETH in wei
};

// VARIABLE B: API response (simulated - in real usage, this comes from Adamik API)
const apiResponse = {
  chainId: "ethereum",
  transaction: {
    data: {
      mode: "transfer",
      senderAddress: "0x1234567890123456789012345678901234567890",
      recipientAddress: "0x0987654321098765432109876543210987654321",
      amount: "1000000000000000000",
      fees: "21000000000000",
      gas: "21000",
      nonce: "5",
    },
    encoded: [
      {
        hash: {
          format: "keccak256",
          value: "0xabcdef...",
        },
        raw: {
          format: "RLP",
          value: "0xf869...",
        },
      },
    ],
  },
};

// 🔒 SECURITY CHECK: Verify API response matches your original intent
const result = await sdk.verify(apiResponse, intent);

if (result.isValid) {
  console.log("✅ Transaction verified successfully");
  console.log("Decoded data:", result.decodedData);
} else {
  console.error("❌ Verification failed:", result.errors);
}
```

### Real API Integration

Here's the two-variable pattern with a real API:

```typescript
import AdamikSDK, { AdamikAPIClient } from "adamik-sdk";

// Create API client
const apiClient = new AdamikAPIClient({
  baseUrl: "https://api.adamik.io",
  apiKey: "your-api-key-here",
});

// Or create from environment variables
const apiClient = AdamikAPIClient.fromEnvironment();

const sdk = new AdamikSDK();

// VARIABLE A: Your original transaction intent (what you want to do)
const intent = {
  mode: "transfer",
  senderAddress: "0x1234567890123456789012345678901234567890",
  recipientAddress: "0x0987654321098765432109876543210987654321",
  amount: "1000000000000000000", // 1 ETH in wei
};

// VARIABLE B: Call real Adamik API to encode the transaction
const apiResponse = await apiClient.encodeTransaction("ethereum", intent);

// 🔒 SECURITY CHECK: Verify the API response matches your original intent
const result = await sdk.verify(apiResponse, intent);

if (result.isValid) {
  console.log("✅ Transaction verified! Ready for signing.");
  console.log("Hash to sign:", apiResponse.transaction.encoded[0]?.hash?.value);
} else {
  console.error("❌ Verification failed:", result.errors);
  console.error("⚠️  DO NOT SIGN - API response doesn't match your intent!");
}
```

## Architecture

### Core Components

1. **AdamikSDK**: Main class providing the `verify` method
2. **AdamikAPIClient**: HTTP client for calling the real Adamik API
3. **DecoderRegistry**: Manages decoders for different blockchain formats
4. **BaseDecoder**: Abstract base class for implementing decoders
5. **Chain-specific decoders**: EVMDecoder, BitcoinDecoder, etc.

### Supported Chains

- **EVM Chains**: Ethereum, Polygon, BSC, Avalanche, Arbitrum, Optimism, Base
- **Bitcoin-like**: Bitcoin, Bitcoin Testnet
- More chains can be easily added by implementing new decoders

### Transaction Formats

- **RLP**: Used by EVM chains
- **PSBT**: Used by Bitcoin
- Additional formats can be supported by extending the decoder system

## Development

### Run Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Build

```bash
npm run build
```

### Run in Development

```bash
npm run dev
```

## Extending the SDK

### Adding a New Chain Decoder

1. Create a new decoder class extending `BaseDecoder`:

```typescript
import { BaseDecoder } from "./base";

export class MyChainDecoder extends BaseDecoder {
  constructor(chainId: ChainId) {
    super(chainId, "MY_FORMAT");
  }

  async decode(rawData: string): Promise<unknown> {
    // Implement decoding logic
  }

  validate(decodedData: unknown): boolean {
    // Implement validation logic
  }
}
```

2. Register the decoder in `DecoderRegistry`:

```typescript
this.registerDecoder(new MyChainDecoder("mychain"));
```

## Future Enhancements

### Planned Security Improvements

1. **Real Decoder Implementation**:
   - Replace placeholder decoders with production-grade libraries
   - Full RLP decoding for EVM chains using `ethers.js` or `viem`
   - PSBT parsing for Bitcoin using `bitcoinjs-lib`
   - Support for additional chain formats

2. **Enhanced Layer 2 Verification**:
   - Cryptographic hash validation
   - Signature verification capabilities
   - Transaction replay protection
   - Deep field-by-field comparison of decoded vs intent

### Additional Features

3. **Development Tools**:
   - Transaction simulation and dry-run capabilities
   - Gas estimation verification
   - Multi-signature transaction support
   - Debugging and analysis tools

4. **Developer Experience**:
   - More detailed error messages with recovery suggestions
   - Retry mechanisms for network issues
   - Better TypeScript inference and IDE support

## API Reference

### `verify(apiResponse: AdamikEncodeResponse, originalIntent: TransactionIntent): Promise<VerificationResult>`

Verifies that an Adamik API response matches the original transaction intent.

**Parameters:**

- `apiResponse`: The response from Adamik API encode endpoint
- `originalIntent`: The original transaction intent

**Returns:**

- `VerificationResult` object containing:
  - `isValid`: Boolean indicating if verification passed
  - `errors`: Array of error messages (if any)
  - `decodedData`: Decoded transaction data

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Security

Security considerations and current limitations are covered in the [Security & Current Limitations](#️-security--current-limitations) section above.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.
