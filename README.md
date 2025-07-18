# Adamik SDK

[![CI](https://github.com/fabricedautriat/adamik-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/fabricedautriat/adamik-sdk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/adamik-sdk.svg)](https://badge.fury.io/js/adamik-sdk)

A TypeScript/Node.js SDK for verifying Adamik API responses. This **Pure Verification SDK** focuses solely on security validation - it verifies that transaction data returned by any source (Adamik API or otherwise) matches your original transaction intent before signing.

**⚠️ Note**: This SDK currently provides **intent validation** (readable data fields) with **real encoded transaction validation** for EVM and placeholder decoders for other chains. See [Security & Current Limitations](#️-security--current-limitations) below.

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

### Two-Step Security Model

Complete transaction verification requires **two steps of checking**:

```typescript
// 🔍 STEP 1: Intent Validation (✅ Fully Implemented)
// Check: transaction.data vs your original intent
const dataMatches = sdk.verify(apiResponse, originalIntent);

// 🔍 STEP 2: Encoded Transaction Validation (✅ Implemented for EVM)
// Check: Decode transaction.encoded and verify it matches your intent
const decoded = decoder.decode(apiResponse.transaction.encoded[0].raw.value);
const encodedMatches = decoded.amount === originalIntent.amount;
```

### ⚠️ Current Implementation Status

**Step 1: Intent Validation** ✅ **Fully Implemented**:

- Verifies `transaction.data` fields match your intent
- Catches API tampering with readable fields

**Step 2: Encoded Transaction Validation** ✅ **Implemented for EVM, Limited for Others**:

- ✅ **EVM**: Real RLP decoding using `viem` library
- ❌ **Bitcoin/Other chains**: Using placeholder decoders with mock data
- **For EVM transactions**: Both steps provide real security protection
- **For other chains**: Only Step 1 provides protection

### 🚨 Security Implications

**For EVM Chains** (Full Protection):

- ✅ API changing recipient address in `transaction.data` (Intent validation)
- ✅ API modifying amount in `transaction.data` (Intent validation)
- ✅ API switching transaction mode in `transaction.data` (Intent validation)
- ✅ Malicious API providing correct `transaction.data` but wrong `transaction.encoded` (Encoded validation)
- ✅ Detection of encoded transaction tampering via RLP decoding (Encoded validation)

**For Other Chains** (Intent Validation Only):

- ✅ API changing recipient address in `transaction.data`
- ✅ API modifying amount in `transaction.data`
- ✅ API switching transaction mode in `transaction.data`
- ❌ Malicious API providing correct `transaction.data` but wrong `transaction.encoded`
- ❌ Bugs causing mismatch between readable data and encoded transaction

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
  console.log("✅ Both steps verified - safe to sign");
}
```

## Features

### ✅ Currently Implemented

- **Intent Validation**: Compare readable `transaction.data` fields against your intent
- **Multi-chain Support**: EVM, Bitcoin, and extensible architecture
- **Pure Verification Focus**: Security-first design that validates any API response
- **TypeScript Support**: Full type definitions and IDE support
- **Scenario-Based Testing**: Clear, maintainable test scenarios covering all use cases
- **Comprehensive Testing**: 30+ tests focused on verification logic

### 🚧 In Development

- **Encoded Transaction Validation**: Real decoding of `transaction.encoded` (placeholder for non-EVM)
- **Production Decoders**: Integration with `ethers.js`, `bitcoinjs-lib`, etc.
- **Hash Validation**: Cryptographic verification of encoded transactions

## Installation

```bash
npm install adamik-sdk
```

## Getting Started

Since this is a pure verification SDK, you'll need:

1. **An API key from Adamik** - Visit [Adamik](https://dashboard.adamik.io) to get your API key
2. **Your own HTTP client** - fetch, axios, or any other method to call the Adamik API
3. **This SDK** - To verify responses before signing transactions

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

### Real-World Usage Pattern

The SDK is designed for **pure verification** - it doesn't fetch data, it verifies data you already have:

```typescript
import AdamikSDK from "adamik-sdk";

const sdk = new AdamikSDK();

// STEP 1: Get API response from ANY source
// This could be from fetch(), axios, your backend, or any other method
const apiResponse = await fetch('https://api.adamik.io/v1/ethereum/transaction/encode', {
  method: 'POST',
  headers: {
    'Authorization': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ transaction: { data: intent } })
}).then(r => r.json());

// STEP 2: Verify BEFORE signing
const result = await sdk.verify(apiResponse, intent);

if (result.isValid) {
  // SAFE: The encoded transaction matches your intent
  const encodedTx = apiResponse.transaction.encoded[0].raw.value;
  // Now you can safely sign with your wallet
  await wallet.signTransaction(encodedTx);
} else {
  // DANGER: DO NOT SIGN!
  console.error("🚨 Security Alert:", result.errors);
  // The API returned a transaction that doesn't match what you intended
}
```

### Why Pure Verification?

This SDK follows the Unix philosophy of "do one thing well":

- **You control the API integration** - Use fetch, axios, or any HTTP client
- **You control error handling** - Retry logic, timeouts, etc.
- **You control the workflow** - Backend proxy, direct calls, caching
- **SDK focuses on security** - Just verification, nothing else

This separation of concerns means:
- No hidden API calls or network dependencies
- Works with any HTTP client or integration pattern
- Can verify responses from any source (not just Adamik)
- Easier to test and mock in your applications

## Architecture

### Core Components

1. **AdamikSDK**: Main class providing the `verify` method
2. **Transaction Types**: Comprehensive type definitions for all supported chains
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
# Run all tests
npm test

# Run specific test suites
npm test -- --testNamePattern="SDK Validation"
npm test -- --testNamePattern="Test Scenarios"
npm test -- --testNamePattern="Decoders"

# Run with real API integration
USE_REAL_API=true npm test

# Run in watch mode
npm run test:watch
```

### Test Organization

The SDK includes a streamlined test suite with:

```bash
# Core test files
tests/sdk-validation.test.ts     # Complete validation tests (10 tests)
tests/scenarios.test.ts          # Simple scenario-based tests (8 tests)
tests/decoders.test.ts          # Decoder and registry tests (10 tests)
tests/integration.test.ts       # End-to-end tests (2 tests)

# Fixtures
tests/fixtures/real-transactions.json  # Real transaction data
```

See `tests/README.md` for detailed test documentation.

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

2. **Enhanced Encoded Transaction Validation**:
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
