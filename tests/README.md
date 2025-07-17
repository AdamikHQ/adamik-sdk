# Adamik SDK Test Suite

This document provides an overview of the test suite for the Adamik SDK.

## Test Architecture

The test suite follows a **two-step security model** with comprehensive coverage:

1. **Intent Validation**: Verify API response data matches user intent
2. **Encoded Transaction Validation**: Decode and verify actual transaction bytes
3. **Configuration-Driven Testing**: Flexible JSON-based test scenarios and attack patterns

## Test Structure

```
tests/
├── fixtures/
│   └── real-transactions.json     # Centralized real transaction data
├── test-config.json              # Single consolidated test configuration
├── api-client.test.ts            # API client functionality tests
├── decoders.test.ts              # Decoder and registry tests
├── sdk-validation.test.ts        # Complete SDK validation tests
├── integration.test.ts           # End-to-end integration tests
├── config-driven.test.ts         # Configuration-driven tests
└── README.md                     # This documentation
```

## Test Files Overview

### Core Validation Tests

- **`sdk-validation.test.ts`** - Comprehensive SDK validation tests covering both intent and encoded transaction validation
- **`decoders.test.ts`** - Decoder functionality and registry tests  
- **`api-client.test.ts`** - HTTP client and API integration tests
- **`integration.test.ts`** - End-to-end workflow tests

### Configuration-Driven Tests

- **`config-driven.test.ts`** - JSON configuration-based tests with scenario and attack pattern support
- **`test-config.json`** - Single consolidated configuration file with scenarios, patterns, and real transaction data
- **`fixtures/real-transactions.json`** - Centralized real transaction data for all test files

## Running Tests

```bash
# Run all tests
npm test

# Run specific test categories
npm test -- --testNamePattern="SDK Validation"
npm test -- --testNamePattern="Configuration-Driven"

# Run with real API integration
USE_REAL_API=true npm test

# Run in watch mode
npm run test:watch
```

## Test Coverage

### Security Testing
- ✅ Intent validation (readable data tampering detection)
- ✅ Encoded transaction validation (RLP decoding for EVM)
- ✅ Malicious API detection
- ✅ Attack pattern testing (recipient/amount tampering)
- ✅ Multi-chain support (EVM chains + Bitcoin placeholders)

### Functionality Testing
- ✅ Transaction mode validation
- ✅ Address and amount validation
- ✅ Token transfer support
- ✅ useMaxAmount handling
- ✅ Error handling and edge cases

### API Integration
- ✅ Real API client testing
- ✅ Environment configuration
- ✅ Network error handling
- ✅ Timeout scenarios

## Configuration-Driven Testing

Tests can be defined in `test-config.json` with:

```json
{
  "scenarios": [
    {
      "id": "eth-valid-transfer",
      "name": "Valid ETH Transfer",
      "chainId": "ethereum",
      "intent": { ... },
      "expectedResult": { ... }
    }
  ],
  "patterns": {
    "encoded-recipient-mismatch": {
      "modifications": { ... },
      "expectedErrors": [ ... ]
    }
  }
}
```

This allows for easy addition of new test scenarios without modifying test code.

## Adding New Tests

### For simple unit tests:
Add to existing test files (`sdk-validation.test.ts`, `decoders.test.ts`, etc.)

### For new scenarios:
Add to `test-config.json` scenarios section

### For new attack patterns:
Add to `test-config.json` patterns section

### For new real transaction data:
Add to `fixtures/real-transactions.json`