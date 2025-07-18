# Adamik SDK Test Suite

This directory contains the comprehensive test suite for the Adamik SDK.

## Overview

**23 tests** across **5 test suites** providing complete coverage of:
- ✅ Intent validation (API response vs user intent)
- ✅ Encoded transaction validation (real RLP decoding for EVM, PSBT for Bitcoin, and protobuf for Cosmos)
- ✅ Security attack scenarios
- ✅ Multi-chain support (Bitcoin, Ethereum, Cosmos, Injective, Tron, Celestia)

## Test Files

### Core Test Suites

- **`sdk-validation.test.ts`** (6 tests) - Core SDK validation logic (happy path)
- **`scenarios.test.ts`** (5 tests) - Attack scenarios and security testing
- **`decoders.test.ts`** (13 tests) - Decoder functionality and registry
- **`integration.test.ts`** (1 test) - End-to-end workflow testing
- **`api-responses.test.ts`** (4 tests) - Real API response validation

### Fixtures

- **`fixtures/api-responses/`** - Real API response data organized by blockchain family:
  - `ethereum.json` - Ethereum mainnet transactions
  - `bitcoin.json` - Bitcoin mainnet transactions
  - `cosmos.json` - Cosmos Hub transactions
  - `injective.json` - Injective transactions
  - `tron.json` - Tron transactions
  - `celestia.json` - Celestia transactions

## Running Tests

```bash
# All tests
pnpm test

# Specific suites
pnpm test -- --testNamePattern="SDK Validation"
pnpm test -- --testNamePattern="Attack Scenarios"
pnpm test -- --testNamePattern="Decoders"
pnpm test -- --testNamePattern="Integration"
pnpm test -- --testNamePattern="API Response"

# Blockchain-specific tests
pnpm test:bitcoin    # Bitcoin-related tests
pnpm test:evm        # EVM-related tests
pnpm test:decoders   # All decoder tests

# Watch mode
pnpm run test:watch
```

## Test Architecture

### Simple & Maintainable

The test suite follows a **simple, readable approach**:

1. **Direct test cases** - No complex configuration files
2. **Self-contained** - Each test is easy to understand
3. **Real data** - Uses actual API responses from the Adamik API
4. **Clear naming** - Descriptive test names and structure
5. **DRY principle** - Common test logic extracted into helper functions

### Security Focus

All critical security scenarios are covered:

```typescript
// Example security test
it("should detect malicious encoded transaction", async () => {
  const intent = { recipientAddress: "0x1111..." };
  const apiResponse = {
    data: intent, // API shows correct data
    encoded: [{ raw: { value: maliciousTransaction } }] // But sends elsewhere
  };
  
  const result = await sdk.verify(apiResponse, intent);
  expect(result.isValid).toBe(false);
  expect(result.errors).toContain("Critical: Decoded transaction recipient mismatch");
});
```

## Adding Tests

### For new functionality:
Add to existing test files based on component

### For new scenarios:
Add to `scenarios.test.ts`

### For new API responses:
Add to appropriate file in `fixtures/api-responses/` directory

## Design Philosophy

**Previous approach**: 1,200+ lines of complex configuration-driven testing infrastructure

**Current approach**: Simple, focused tests with same coverage but dramatically reduced complexity

This demonstrates **"less is more"** - comprehensive coverage with better maintainability.

## Test Development

### Adding New Tests

**For new functionality**: Add to existing test files based on component
```typescript
// Add to sdk-validation.test.ts for core SDK features
// Add to decoders.test.ts for decoder functionality  
// Add to api-client.test.ts for HTTP client features
```

**For new scenarios**: Add to `scenarios.test.ts`
```typescript
it("should handle new scenario", async () => {
  const intent = { /* setup */ };
  const apiResponse = { /* response */ };
  const result = await sdk.verify(apiResponse, intent);
  expect(result.isValid).toBe(expected);
});
```

**For new API responses**: Add to appropriate file in `fixtures/api-responses/`
```json
{
  "test_case_name": {
    "intent": {
      "transaction": {
        "data": { /* original transaction intent */ }
      }
    },
    "response": {
      "chainId": "blockchain_id",
      "transaction": {
        "data": { /* API response data */ },
        "encoded": [ /* encoded transaction data */ ]
      },
      "status": {
        "errors": [],
        "warnings": []
      }
    }
  }
}
```

### Test Patterns

**Basic Test Structure**:
```typescript
it("should describe what it tests", async () => {
  // 1. Setup
  const intent = { /* user intent */ };
  const apiResponse = { /* API response */ };

  // 2. Execute  
  const result = await sdk.verify(apiResponse, intent);

  // 3. Assert
  expect(result.isValid).toBe(expected);
  expect(result.errors).toContain("expected error");
});
```

**Security Test Pattern**:
```typescript
it("should detect [specific attack]", async () => {
  // Create legitimate intent
  const intent = { recipientAddress: "0x1111..." };
  
  // Create malicious API response
  const apiResponse = {
    data: intent, // Looks correct
    encoded: [{ raw: { value: maliciousTransaction } }] // But isn't
  };
  
  // Verify attack is detected
  const result = await sdk.verify(apiResponse, intent);
  expect(result.isValid).toBe(false);
  expect(result.errors).toContain("Critical: [specific error]");
});
```

## Test Organization

### Test File Purposes

- **`sdk-validation.test.ts`** - Core validation logic (happy path scenarios)
  - Basic intent validation
  - Field matching tests
  - Token transfer validation
  - useMaxAmount handling

- **`scenarios.test.ts`** - Security attack scenarios
  - Malicious encoded transactions
  - Recipient/amount tampering
  - Critical security tests

- **`decoders.test.ts`** - Decoder unit tests
  - Registry functionality
  - EVM/Bitcoin decoder tests
  - Format validation

- **`integration.test.ts`** - End-to-end workflow
  - Complete verification flow

- **`api-responses.test.ts`** - Real API response validation
  - Test data organized by blockchain
  - Actual API responses from Adamik API
  - DRY helper function for consistent testing

## Security Testing Coverage

### Attack Scenarios (in scenarios.test.ts)

1. **Malicious encoded transactions**
   - API shows correct data but encoded transaction differs
   - Recipient tampering detection
   - Amount manipulation detection

2. **Critical security validation**
   - Real RLP decoding for EVM chains
   - PSBT parsing for Bitcoin
   - Cross-validation between intent and decoded data

### Real API Response Data

Uses actual API responses from `fixtures/api-responses/`:
- Each blockchain has its own JSON file
- Consistent object-based format for easy test maintenance
- Includes both intent and response for complete validation

### Test Organization Pattern

The `api-responses.test.ts` file uses a DRY helper function:
```typescript
const runBlockchainTests = (
  blockchainName: string,
  fixtures: Record<string, any>,
  customValidations?: (txData: any, intentData: any) => void
) => {
  // Common test logic for all blockchains
}
```

This approach:
- Eliminates code duplication
- Ensures consistent testing across blockchains
- Makes it easy to add new blockchain tests
- Allows for blockchain-specific validations when needed

## Benefits of Current Architecture

### ✅ Advantages
1. **Simplicity**: Easy to understand and maintain
2. **Clarity**: Each test is self-contained and readable
3. **Performance**: No complex infrastructure overhead
4. **Debugging**: Clear stack traces and error messages
5. **Coverage**: All security scenarios covered with real data

### 🚀 Evolution
**Before**: 1,200+ lines of complex configuration-driven testing infrastructure  
**After**: Simple, focused tests with same coverage but dramatically reduced complexity

This demonstrates **"less is more"** - maintaining comprehensive test coverage while dramatically improving maintainability and developer experience.