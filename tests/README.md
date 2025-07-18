# Adamik SDK Test Suite

This directory contains the comprehensive test suite for the Adamik SDK.

## Overview

**30 tests** across **4 test suites** providing complete coverage of:
- ✅ Intent validation (API response vs user intent)
- ✅ Encoded transaction validation (real RLP decoding for EVM)
- ✅ Security attack scenarios
- ✅ Multi-chain support

## Test Files

### Core Test Suites

- **`sdk-validation.test.ts`** (10 tests) - Core SDK validation with real data
- **`scenarios.test.ts`** (8 tests) - Simple scenario-based testing
- **`decoders.test.ts`** (10 tests) - Decoder functionality and registry
- **`integration.test.ts`** (2 tests) - End-to-end workflow testing

### Fixtures

- **`fixtures/real-transactions.json`** - Real blockchain transaction data

## Running Tests

```bash
# All tests
npm test

# Specific suites
npm test -- --testNamePattern="SDK Validation"
npm test -- --testNamePattern="Test Scenarios"
npm test -- --testNamePattern="Decoders"

# Verbose output
npm test -- --verbose

# Watch mode
npm run test:watch
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

## Security Testing Coverage

### Attack Scenarios Covered

1. **Malicious encoded transactions**
   - API shows recipient A but encoded transaction sends to recipient B
   - API shows amount X but encoded transaction sends amount Y

2. **Data tampering detection** 
   - Transaction mode mismatches
   - Recipient address manipulation
   - Amount tampering

3. **EVM security validation**
   - Real RLP decoding and verification
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