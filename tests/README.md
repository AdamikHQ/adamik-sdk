# Adamik SDK Test Suite

This directory contains the comprehensive test suite for the Adamik SDK.

## Overview

**~45 tests** across **5 test suites** providing complete coverage of:
- ✅ Intent validation (API response vs user intent)
- ✅ Encoded transaction validation (real RLP decoding for EVM and PSBT for Bitcoin)
- ✅ Security attack scenarios
- ✅ Multi-chain support (16 blockchains)

## Test Files

### Core Test Suites

- **`sdk-validation.test.ts`** (6 tests) - Core SDK validation logic (happy path)
- **`scenarios.test.ts`** (3 tests) - Attack scenarios and security testing
- **`decoders.test.ts`** (9 tests) - Decoder functionality and registry
- **`integration.test.ts`** (1 test) - End-to-end workflow testing
- **`bruno-imported.test.ts`** (28 tests) - Comprehensive real-world API data testing

### Fixtures

- **`fixtures/bruno-imported/`** - Real blockchain transaction data from Bruno API tests (16 chain files)

## Running Tests

```bash
# All tests
pnpm test

# Specific suites
pnpm test -- --testNamePattern="SDK Validation"
pnpm test -- --testNamePattern="Attack Scenarios"
pnpm test -- --testNamePattern="Decoders"
pnpm test -- --testNamePattern="Integration"
pnpm test -- --testNamePattern="Bruno imported"

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
3. **Real data** - Uses actual blockchain transactions
4. **Clear naming** - Descriptive test names and structure

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

### For new transaction data:
Add to `fixtures/real-transactions.json`

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

**For new transaction data**: Add to `fixtures/real-transactions.json`
```json
{
  "chainId": {
    "scenarioName": {
      "encoded": "0x...",
      "decoded": { /* expected fields */ }
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

- **`bruno-imported.test.ts`** - Real-world data validation
  - 16 blockchain chains
  - Actual API responses
  - Independent verification

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

### Real Transaction Data

Uses actual blockchain data from `fixtures/real-transactions.json`:
```json
{
  "ethereum": {
    "transfer": {
      "encoded": "0xf86c098504a817c800825208943535...",
      "decoded": {
        "recipientAddress": "0x3535353535353535353535353535353535353535",
        "amount": "1000000000000000000",
        "mode": "transfer"
      }
    }
  }
}
```

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