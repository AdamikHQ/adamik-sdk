# Adamik SDK

[![CI](https://github.com/fabricedautriat/adamik-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/fabricedautriat/adamik-sdk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/adamik-sdk.svg)](https://badge.fury.io/js/adamik-sdk)

A TypeScript/Node.js SDK for verifying Adamik API responses. This SDK allows developers to verify that transaction data returned by the Adamik API matches the original transaction intent.

## Features

- ✅ Verify transaction integrity between intent and API response
- ✅ Support for multiple blockchain types (EVM, Bitcoin, etc.)
- ✅ Extensible decoder architecture for different transaction formats
- ✅ TypeScript support with full type definitions
- ✅ Comprehensive test coverage

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

```typescript
import AdamikSDK from "adamik-sdk";

const sdk = new AdamikSDK();

// Define your transaction intent
const intent = {
  mode: "transfer",
  senderAddress: "0x1234567890123456789012345678901234567890",
  recipientAddress: "0x0987654321098765432109876543210987654321",
  amount: "1000000000000000000", // 1 ETH in wei
};

// Get response from Adamik API (example)
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

// Verify the response
const result = await sdk.verify(apiResponse, intent);

if (result.isValid) {
  console.log("✅ Transaction verified successfully");
  console.log("Decoded data:", result.decodedData);
} else {
  console.error("❌ Verification failed:", result.errors);
}
```

### Real API Integration

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

// Define your transaction intent
const intent = {
  mode: "transfer",
  senderAddress: "0x1234567890123456789012345678901234567890",
  recipientAddress: "0x0987654321098765432109876543210987654321",
  amount: "1000000000000000000", // 1 ETH in wei
};

// Call real Adamik API to encode the transaction
const apiResponse = await apiClient.encodeTransaction("ethereum", intent);

// Verify the API response against your original intent
const result = await sdk.verify(apiResponse, intent);

if (result.isValid) {
  console.log("✅ Transaction verified! Ready for signing.");
  console.log("Hash to sign:", apiResponse.transaction.encoded[0]?.hash?.value);
} else {
  console.error("❌ Verification failed:", result.errors);
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

For enhanced production capabilities, consider:

1. **Real Decoding Libraries**:
   - Use ethers.js or web3.js for EVM transaction decoding
   - Use bitcoinjs-lib for Bitcoin transaction parsing

2. **Enhanced Verification**:
   - Deep validation of decoded transaction fields
   - Signature verification
   - Hash validation

3. **Additional Features**:
   - Transaction simulation
   - Gas estimation verification
   - Multi-signature support

4. **Error Handling**:
   - More detailed error messages
   - Recovery suggestions
   - Retry mechanisms

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

Please see [SECURITY.md](SECURITY.md) for information about reporting security vulnerabilities.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.
