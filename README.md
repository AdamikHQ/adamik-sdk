# Adamik SDK

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/@adamik/sdk.svg)](https://badge.fury.io/js/@adamik/sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green)](https://nodejs.org/)

A TypeScript/Node.js SDK with two powerful capabilities:

1. **🔓 Multi-chain Transaction Decoder** - Decode raw unsigned transactions across multiple blockchains
2. **🛡️ Security Verification** - Verify that API responses match your original transaction intent before signing

## Two Ways to Use This SDK

### 1. As a Multi-chain Decoder

Decode raw transaction data from any blockchain without needing blockchain-specific libraries:

```typescript
import AdamikSDK from "@adamik/sdk";

const sdk = new AdamikSDK();

// Decode an Ethereum transaction
const ethResult = await sdk.decode({
  chainId: "ethereum",
  format: "RLP",
  encodedData: "0xf86c0a8502540be400..."
});

console.log(ethResult.decoded);
// { recipientAddress: "0x...", amount: "1000000000000000000", ... }

// Decode a Bitcoin PSBT
const btcResult = await sdk.decode({
  chainId: "bitcoin", 
  format: "PSBT",
  encodedData: "cHNidP8BAH0CAAAAAf..."
});

// Decode a Cosmos transaction
const cosmosResult = await sdk.decode({
  chainId: "cosmoshub",
  format: "COSMOS_PROTOBUF",
  encodedData: "0a9f010a9c010a..."
});
```

### 2. As a Security Verification Tool

Verify that transaction data from any API matches your original intent:

```typescript
// Your intent
const intent = { recipientAddress: "0x123...", amount: "1000" };

// API response (from Adamik or any source)
const apiResponse = await getTransactionFromAPI(intent);

// Verify before signing!
const result = await sdk.verify(apiResponse, intent);
if (!result.isValid) {
  throw new Error("Transaction doesn't match intent!");
}
```

## Features

- **🔓 Multi-chain Decoding**: Unified interface for decoding transactions across blockchains
- **🛡️ Security Verification**: Two-step validation of API responses
- **📦 TypeScript Support**: Full type definitions and IDE support
- **🔍 Real Decoders**: Production-ready decoders for EVM, Bitcoin, Cosmos, and Tron
- **✅ Comprehensive Testing**: 92 tests across 9 test suites
- **🏗️ Clean Architecture**: Modular design with utility classes
- **⚡ Minimal Dependencies**: Only trusted blockchain libraries
- **🔍 Chain Discovery**: Runtime methods to discover supported chains and formats

## Supported Blockchains

**Real Decoders Available:**
- **EVM Chains**: Ethereum, Polygon, BSC, Avalanche, Arbitrum, Optimism, Base (37 chains using `viem`)
- **Bitcoin**: Bitcoin mainnet and testnet (5 chains using `bitcoinjs-lib`)
- **Cosmos SDK**: Cosmos Hub, Celestia, Injective, Babylon (42 chains using `@cosmjs/proto-signing`)
- **Tron**: Tron mainnet with TRC20 support (using `tronweb`)
- **Solana**: Solana with SPL token support (using `@solana/web3.js`)

**Total: 86 chains with real decoders**

Use `sdk.getSupportedChains()` to get the complete list of supported chains at runtime.

## Prerequisites

- Node.js >= 18.0.0
- TypeScript >= 5.0 (for development)

## Installation

```bash
npm install @adamik/sdk
# or
yarn add @adamik/sdk
# or
pnpm add @adamik/sdk
```

## Quick Start

### Decode Transactions

```typescript
import AdamikSDK from "@adamik/sdk";

const sdk = new AdamikSDK();

// Example: Decode an Ethereum transaction
const result = await sdk.decode({
  chainId: "ethereum",
  format: "RLP",
  encodedData: "0xf86c0a8502540be400..."
});

if (result.decoded) {
  console.log("To:", result.decoded.recipientAddress);
  console.log("Amount:", result.decoded.amount);
  console.log("Mode:", result.decoded.mode);
}
```

### Verify API Responses

```typescript
// Your transaction intent
const intent = {
  mode: "transfer",
  recipientAddress: "0x123...",
  amount: "1000000000000000000" // 1 ETH
};

// Get response from API
const apiResponse = await fetch(...).then(r => r.json());

// Verify before signing!
const verification = await sdk.verify(apiResponse, intent);

if (verification.isValid) {
  // Safe to sign
  await wallet.sign(apiResponse.transaction.encoded[0].raw.value);
} else {
  console.error("Transaction tampered:", verification.errors);
}
```

### Supported Formats

| Blockchain | Format | Status | Library Used |
|------------|--------|--------|--------------|
| Ethereum, Polygon, BSC, etc. | RLP | ✅ Real | `viem` |
| Bitcoin | PSBT | ✅ Real | `bitcoinjs-lib` |
| Cosmos Hub, Celestia, etc. | COSMOS_PROTOBUF | ✅ Real | `@cosmjs/proto-signing` |
| Tron | RAW_TRANSACTION | ✅ Real | `tronweb` |
| Solana | BORSH | ✅ Real | `@solana/web3.js` |
| Algorand, Aptos, TON | Various | ❌ Not supported yet | - |

### How Security Works

The SDK provides two levels of verification:

**1. Intent Validation** (all chains):
- Transaction mode matches (transfer, stake, etc.)
- Recipient address matches
- Amount matches
- Token ID matches (for token transfers)

**2. Encoded Validation** (EVM, Bitcoin, Cosmos, Tron, Solana):
- Decodes the actual transaction bytes
- Verifies decoded data matches intent
- Catches malicious encoded transactions

```typescript
// Attack example: API shows correct data but encoded transaction sends elsewhere
const intent = { 
  recipientAddress: "0xYourFriend...",
  amount: "100"
};

const maliciousResponse = {
  transaction: {
    data: intent, // Shows correct data
    encoded: [{
      raw: { 
        value: "0x..." // But sends to attacker!
      }
    }]
  }
};

// SDK catches the attack
const result = await sdk.verify(maliciousResponse, intent);
console.log(result.isValid); // false
console.log(result.errors); // ["Critical: Decoded recipient mismatch"]
```

## Usage Examples

### Complete Example with Adamik API

```typescript
import AdamikSDK from "@adamik/sdk";

const sdk = new AdamikSDK();

// 1. Define your transaction intent
const intent = {
  mode: "transfer",
  senderAddress: "0x1234...",
  recipientAddress: "0xABCD...",
  amount: "1000000000000000000" // 1 ETH
};

// 2. Get encoded transaction from Adamik API
const apiResponse = await fetch("https://api.adamik.io/v1/ethereum/transaction/encode", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ transaction: { data: intent } })
}).then(r => r.json());

// 3. Verify the response
const verification = await sdk.verify(apiResponse, intent);

if (verification.isValid) {
  // 4. Optionally decode to inspect
  const decoded = await sdk.decode({
    chainId: apiResponse.chainId,
    format: apiResponse.transaction.encoded[0].raw.format,
    encodedData: apiResponse.transaction.encoded[0].raw.value
  });
  
  console.log("Transaction details:", decoded.decoded);
  
  // 5. Safe to sign
  const tx = apiResponse.transaction.encoded[0].raw.value;
  await wallet.signTransaction(tx);
} else {
  console.error("DO NOT SIGN:", verification.errors);
}
```

### Decode-Only Usage

For when you just need to decode transactions:

```typescript
// Decode various blockchain transactions
const examples = [
  {
    name: "Ethereum Transfer",
    chainId: "ethereum",
    format: "RLP",
    encodedData: "0xf86c0a85..."
  },
  {
    name: "Bitcoin PSBT",
    chainId: "bitcoin",
    format: "PSBT", 
    encodedData: "cHNidP8BAH..."
  },
  {
    name: "Cosmos Send",
    chainId: "cosmoshub",
    format: "COSMOS_PROTOBUF",
    encodedData: "0a9f010a9c..."
  }
];

for (const tx of examples) {
  const result = await sdk.decode(tx);
  console.log(`${tx.name}:`, result.decoded);
}
```

## Development

### Run Tests

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test -- --testNamePattern="SDK Validation"
pnpm test -- --testNamePattern="Test Scenarios"
pnpm test -- --testNamePattern="Decoders"

# Run with real API integration
USE_REAL_API=true pnpm test

# Run in watch mode
pnpm run test:watch
```

### Test Organization

The SDK includes a streamlined test suite with:

```bash
# Core test files
tests/sdk-validation.test.ts        # Complete validation tests (12 tests)
tests/attack-scenarios.test.ts      # Security attack tests (9 tests)
tests/decoders.test.ts             # Decoder and registry tests (17 tests)
tests/integration.test.ts          # End-to-end tests (1 test)
tests/api-responses.test.ts        # API response validation tests (12 tests)
tests/edge-cases.test.ts           # Boundary condition tests (11 tests)
tests/error-handling.test.ts       # Error path tests (10 tests)
tests/evm-chainid-real-data.test.ts # EVM chain ID security tests (8 tests)

# Fixtures
tests/fixtures/api-responses/    # Real API response data per blockchain
```

See `tests/README.md` for detailed test documentation.

### Build

```bash
pnpm run build
```

### Run in Development

```bash
pnpm run dev
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

### `decode(params: DecodeParams): Promise<DecodeResult>`

Decodes raw transaction data for a specific blockchain without running verification.

**Parameters:**

- `params`: Object containing:
  - `chainId`: The blockchain identifier (e.g., "ethereum", "bitcoin")
  - `format`: The encoding format (e.g., "RLP", "PSBT")
  - `encodedData`: The encoded transaction data as a string

**Returns:**

- `DecodeResult` object containing:
  - `decoded`: The decoded transaction data (null if decoding failed)
  - `warnings`: Any warnings generated during decoding
  - `error`: Error message if decoding failed

**Example:**

```typescript
const result = await sdk.decode({
  chainId: "ethereum",
  format: "RLP",
  encodedData: "0xf86c0a8502540be400...",
});

if (result.decoded) {
  console.log("Recipient:", result.decoded.recipientAddress);
  console.log("Amount:", result.decoded.amount);
  console.log("Fee:", result.decoded.fee);
}
```

### `getSupportedChains(): Record<string, ChainInfo>`

Gets all blockchain chains that have decoder support in the SDK.

**Returns:**

An object mapping chain IDs to their information:
- `family`: The blockchain family (e.g., "evm", "bitcoin", "cosmos")
- `formats`: Array of supported encoding formats
- `hasDecoder`: Always true for returned chains

**Example:**

```typescript
const supportedChains = sdk.getSupportedChains();
console.log(supportedChains);
// {
//   "ethereum": { family: "evm", formats: ["RLP"], hasDecoder: true },
//   "bitcoin": { family: "bitcoin", formats: ["PSBT"], hasDecoder: true },
//   "cosmoshub": { family: "cosmos", formats: ["COSMOS_PROTOBUF", "SIGNDOC_DIRECT", ...], hasDecoder: true },
//   ...
// }

// Count chains by family
const families = Object.values(supportedChains).reduce((acc, chain) => {
  acc[chain.family] = (acc[chain.family] || 0) + 1;
  return acc;
}, {});
console.log(families); // { evm: 37, bitcoin: 5, cosmos: 42, tron: 1, solana: 1 }
```

### DecodedTransaction Structure

The decoded transaction object contains:

```typescript
interface DecodedTransaction {
  chainId?: string;          // Blockchain identifier
  mode?: TransactionMode;    // "transfer", "transferToken", "stake", etc.
  senderAddress?: string;    // Transaction sender
  recipientAddress?: string; // Transaction recipient
  amount?: string;          // Transaction amount in smallest unit
  fee?: string;             // Transaction fee in native currency
  memo?: string;            // Transaction memo/message
  tokenId?: string;         // Token contract address (for token transfers)
  validatorAddress?: string; // Validator address (for staking operations)
  targetValidatorAddress?: string; // Target validator (for re-delegation)
  chainSpecificData?: unknown; // Chain-specific additional data
}
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

For detailed guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md) (coming soon).

## Security

### Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

### Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to contact@adamik.io.

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

This information will help us triage your report more quickly.

### Preferred Languages

We prefer all communications to be in English.

### Policy

Adamik follows the principle of Coordinated Vulnerability Disclosure.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Links

- [GitHub Repository](https://github.com/AdamikHQ/adamik-sdk)
- [NPM Package](https://www.npmjs.com/package/@adamik/sdk)
- [Report Issues](https://github.com/AdamikHQ/adamik-sdk/issues)
- [Adamik API Documentation](https://docs.adamik.io)
