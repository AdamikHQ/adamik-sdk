# Claude Development Context

> **Purpose**: This file provides essential context for Claude when working on the Adamik SDK project. Read this first in any new session to understand the current state, architecture, and development patterns.

## Quick Context Summary
- **What**: TypeScript SDK for verifying Adamik API transaction responses
- **Status**: Production-ready core, EVM fully implemented with EIP-55 support, Bitcoin placeholder
- **Tests**: 58 tests passing across 5 suites (including new Bruno imported test suite)
- **Recent**: EIP-55 address checksumming + Bruno test data migration completed

## Project Overview

**Adamik SDK** - TypeScript/Node.js **Pure Verification SDK** for validating API responses against original transaction intent.

**Design Philosophy**: This SDK follows the Unix principle of "do one thing well" - it focuses solely on verification, not API integration. Users bring their own API responses (from fetch, axios, backends, etc.) and the SDK verifies them.

**Core Security Problem**: Malicious APIs can show correct readable data but provide tampered encoded transactions.

**Solution - Two-Step Verification**:
1. **Intent Validation** - Compare API response data vs user intent (✅ Implemented)
2. **Encoded Transaction Validation** - Decode and verify actual transaction bytes (✅ EVM, ⚠️ Others placeholder)

**Key Classes**:
- `AdamikSDK.verify(apiResponse, originalIntent)` - Main verification method
- `DecoderRegistry` - Manages blockchain-specific decoders
- `BaseDecoder` - Abstract class for chain-specific implementations

## Current Architecture

### Core Components
```
src/
├── index.ts              # Main AdamikSDK class with verify() method
├── client.ts             # API client (legacy - see Future Enhancements)
├── types/index.ts        # TypeScript type definitions
└── decoders/
    ├── base.ts           # Abstract BaseDecoder class
    ├── registry.ts       # DecoderRegistry for managing decoders
    ├── evm.ts           # Real EVM RLP decoder using viem
    └── bitcoin.ts       # Placeholder Bitcoin PSBT decoder
```

### Test Structure
```
tests/
├── decoders.test.ts         # Decoder tests (9 tests) 
├── sdk-validation.test.ts   # Core SDK tests (10 tests)
├── integration.test.ts      # End-to-end tests (2 tests)
├── scenarios.test.ts        # Simple scenarios (8 tests)
├── bruno-imported.test.ts   # Bruno imported data tests (29 tests)
└── fixtures/
    ├── bruno-imported/      # Real Bruno API test data (16 chain files)
    └── real-transactions.json # Legacy test data (deprecated)
```

**Total: 58 tests across 5 suites, all passing ✅**

## Current Implementation Status

### ✅ Fully Implemented
- **Intent validation** for all transaction types
- **Real EVM RLP decoding** using viem library (Ethereum, Polygon, BSC, etc.)
- **EIP-55 checksum addresses** - All EVM addresses use proper checksumming
- **Pure verification design** - no network calls, just validation
- **Comprehensive test suite** with security attack scenarios + Bruno imported data
- **TypeScript support** with strict mode

### ⚠️ Placeholder/Limited
- **Bitcoin decoder** - Uses mock PSBT data (needs bitcoinjs-lib integration)
- **Other chain decoders** - Only EVM has real implementation

## Recent Major Changes (December 2024 - January 2025)

### ✅ Completed: Code Quality Improvements
**What**: Complete codebase review and cleanup
**Impact**: Significantly improved maintainability
**Changes**:
- **Extracted shared validation logic** from `src/index.ts` - eliminated duplication in field verification
- **Added named constants** - `DEFAULT_TIMEOUT_MS = 30000` in `src/client.ts`
- **Standardized error messages** - consistent format, removed emoji inconsistencies
- **Fixed import ordering** - local imports first, external libraries second
- **Removed unused code** - deleted `bufferToHex()` method from `src/decoders/base.ts`

### ✅ Completed: Test Suite Simplification  
**What**: Replaced complex testing infrastructure with simple scenario-based tests
**Impact**: Same coverage, dramatically reduced complexity
**Before**: 1,200+ lines of configuration-driven testing (ScenarioRunner, PatternRunner, etc.)
**After**: Clean, readable Jest tests with clear scenarios
**Files removed**: `src/test-utils/` directory, `tests/config-driven.test.ts`, `tests/test-config.json`
**Files added**: `tests/scenarios.test.ts` - 8 simple, clear test scenarios

### ✅ Completed: Documentation Cleanup
**What**: Streamlined documentation structure
**Changes**:
- Removed redundant `TEST.md` (root)
- Enhanced `tests/README.md` as single source of test documentation
- Updated `README.md` and `CHANGELOG.md` to reflect simplifications

### ✅ Completed: EIP-55 Checksum Implementation (January 2025)
**What**: Added proper EIP-55 address checksumming to EVM decoder
**Impact**: Enhanced security and standards compliance
**Changes**:
- Updated `src/decoders/evm.ts` to use viem's `getAddress` for EIP-55 checksumming
- All decoded EVM addresses now returned in proper checksum format
- Ensures address integrity throughout transaction verification flow
- Example: `0x8bc6922eb94e4858efaf9f433c35bc241f69e8a6` → `0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6`

### ✅ Completed: Bruno Test Data Migration (January 2025)
**What**: Migrated from legacy test fixtures to Bruno imported data
**Impact**: Better real-world test coverage with actual API responses
**Changes**:
- Added `tests/fixtures/bruno-imported/` with 16 chain-specific test files
- Updated all decoder tests to use Bruno data instead of `real-transactions.json`
- Added new `bruno-imported.test.ts` with 29 tests covering all imported chains
- Test count increased from 30 to 58 tests
- Better coverage of edge cases and real API response formats

## Key Security Features

### Attack Detection
- **Malicious encoded transactions** - API shows correct data but sends to different recipient/amount
- **Data tampering** - Mode, recipient, amount mismatches
- **Real RLP verification** - Cryptographic validation for EVM chains

### Critical Security Tests
- ✅ **Malicious API detection** - API shows correct data but encoded transaction sends elsewhere
- ✅ **Recipient tampering** - `Critical: Decoded transaction recipient mismatch`
- ✅ **Amount manipulation** - `Critical: Decoded transaction amount mismatch`
- ✅ **Mode confusion** - Transaction type switching attacks
- ✅ **Real RLP decoding** - Uses `viem` library for authentic EVM validation

### Test File Breakdown
- `scenarios.test.ts` (8 tests) - Simple, clear scenarios covering valid/invalid/attack cases
- `sdk-validation.test.ts` (10 tests) - Core validation with Bruno transaction data
- `decoders.test.ts` (9 tests) - Blockchain decoder functionality with Bruno data
- `integration.test.ts` (2 tests) - End-to-end API + SDK workflows
- `bruno-imported.test.ts` (29 tests) - Comprehensive testing of all Bruno imported chains

## Development Patterns

### Adding New Features
1. **Types first** - Update `src/types/index.ts` with new interfaces
2. **Implementation** - Update `src/index.ts` verify method logic
3. **Tests** - Add to appropriate test file (see test file breakdown above)
4. **Update CLAUDE.md** - Document architectural changes
5. **Documentation** - Update README if user-facing

### Adding New Chain Support (Follow EVM Pattern)
```typescript
// 1. Create decoder extending BaseDecoder
export class NewChainDecoder extends BaseDecoder {
  constructor(chainId: ChainId) {
    super(chainId, "NEW_FORMAT");
  }
  async decode(rawData: string): Promise<DecodedTransaction> { /* impl */ }
  validate(decodedData: unknown): boolean { /* impl */ }
}

// 2. Register in DecoderRegistry.registerDefaultDecoders()
this.registerDecoder(new NewChainDecoder("newchain"));

// 3. Add real transaction data to fixtures/bruno-imported/[chain].json
// 4. Add tests to decoders.test.ts
// 5. Update ChainId type in src/types/index.ts
```

### Code Quality Standards (Enforced)
- **No code duplication** - Extract to private methods (see `verifyTransactionFields`, `verifyDecodedFields`)
- **Named constants** - No magic numbers (e.g., `DEFAULT_TIMEOUT_MS = 30000`)
- **Consistent imports** - Local first, external second (see `src/decoders/evm.ts:1-3`)
- **Error message format** - No emojis, consistent: `"Critical: [description]"`
- **TypeScript strict mode** - Full type safety, all tests pass
- **Single responsibility** - Methods should do one thing well
- **Clear naming** - Descriptive variable and method names

## Build & Test Commands

```bash
# Development
npm run dev          # Run with ts-node
npm run build        # TypeScript compilation
npm run format       # Prettier formatting

# Testing  
npm test             # All 58 tests
npm run test:watch   # Watch mode

# Specific test suites (use exact names)
npm test -- --testNamePattern="SDK Validation"     # Core validation tests
npm test -- --testNamePattern="Test Scenarios"     # Simple scenario tests  
npm test -- --testNamePattern="Decoders"           # Decoder functionality
npm test -- --testNamePattern="Integration"        # End-to-end tests
npm test -- --testNamePattern="Bruno imported"     # Bruno imported data tests
```

## Technical Stack

### Production Dependencies
- **viem** (^2.32.0) - Real EVM RLP decoding (parseTransaction, isAddress, isHex, getAddress)
  - Used in `src/decoders/evm.ts` for authentic blockchain transaction parsing
  - Provides EIP-55 checksum address formatting via getAddress
  - Enables real security validation for EVM chains

### Development Stack
- **TypeScript** (^5.8.3) - Strict mode enabled, full type safety
- **Jest** (^30.0.4) - Testing framework, 58 tests across 5 suites
- **Prettier** (^3.6.2) - Code formatting (npm run format)
- **ts-node** (^10.9.2) - Development execution
- **ts-jest** (^29.4.0) - TypeScript Jest integration

### Key Libraries NOT Used (Potential Additions)
- **bitcoinjs-lib** - Needed for real Bitcoin PSBT decoding
- **ethers.js** - Alternative to viem for EVM
- **@solana/web3.js** - Future Solana support

## Future Enhancements (Planned)

### 🔥 High Priority (Next Features)
- **Real Bitcoin decoder** - Replace `src/decoders/bitcoin.ts` placeholder with bitcoinjs-lib
  - Current: Returns mock data
  - Needed: Real PSBT parsing and validation
- **Hash validation** - Verify `transaction.encoded[0].hash.value` matches actual transaction
- **Additional EVM chains** - Easy wins: Avalanche-C, Fantom, etc.

### 📋 Medium Priority
- **Gas estimation verification** - Ensure API doesn't overcharge fees
- **Solana decoder** - New architecture needed for Solana transaction format
- **Retry mechanisms** - Better network error handling in API client

### 💡 Nice to Have
- **Multi-signature support** - Transaction signing workflows
- **Transaction simulation** - Dry-run capabilities
- **Browser compatibility** - Currently Node.js only

## Working with Claude

### Session Start Checklist
1. **Read this file completely** - Understand current state
2. **Check recent changes section** - What was done and why
3. **Review development patterns** - How to add features consistently
4. **Note current limitations** - What's placeholder vs fully implemented

### Effective Communication
- **Reference specific locations**: `src/index.ts:45-60`, `tests/scenarios.test.ts:125`
- **Include context**: "When adding EVM support" vs "When adding features"
- **Specify test requirements**: "Add to scenarios.test.ts with attack scenario"
- **Mention constraints**: "Following the BaseDecoder pattern"

### Update This File When
- **Major architectural changes** (new core classes, significant refactoring)
- **New development patterns** (different way of adding features)
- **Completing planned enhancements** (move from planned to implemented)
- **Changing testing approach** (different test organization)
- **API changes** (breaking changes to public methods)

### Don't Update For
- Minor bug fixes
- Small refactors within existing patterns
- Documentation-only changes
- Adding simple test cases

## Important Notes for Development

### ⚠️ Key Constraints
- **EVM only** for real encoded validation - other chains use placeholder decoders
- **Test with real data** - Use `fixtures/bruno-imported/` for authentic API responses
- **Security focus** - Always test malicious API scenarios
- **TypeScript strict** - No `any` types, full type safety required
- **EIP-55 compliance** - All EVM addresses must use proper checksumming

### 🎯 Current Priorities
1. **Real Bitcoin decoder** - Replace placeholder with bitcoinjs-lib
2. **Additional EVM chains** - Easy wins following existing pattern
3. **Hash validation** - Cryptographic verification of encoded transactions

### 🚫 Avoid These Patterns
- Complex configuration-driven testing (was removed for good reason)
- Magic numbers in code (use named constants)
- Code duplication (extract to shared methods)
- Inconsistent error message formats

## Git Configuration
- Do not include Claude co-author line in commits
- Use standard commit format without attribution

---

## Last Updated
**Date**: January 2025  
**Session**: EIP-55 implementation and Bruno test data migration  
**Major Changes**: 
- Added EIP-55 checksum address support to EVM decoder
- Migrated all tests to use Bruno imported data (real API responses)
- Increased test coverage from 30 to 58 tests
- Improved real-world test scenarios with actual API data
**Next Session Should**: Consider implementing real Bitcoin decoder with bitcoinjs-lib or adding more EVM chain support

## Future Product Direction

### Current: Pure Verification SDK
- **Focus**: Security validation only
- **User provides**: API responses from any source
- **SDK provides**: Verification that response matches intent
- **Benefits**: Clean separation of concerns, no network dependencies

### Potential Future: Full Integration SDK
- **Would include**: Built-in API client + verification
- **User provides**: Just the transaction intent
- **SDK provides**: API calls + automatic verification
- **Benefits**: Simpler integration, one-stop solution
- **Trade-offs**: More opinionated, harder to customize

**Note**: The AdamikAPIClient exists in the codebase but is not part of the current Pure Verification SDK design. It may be utilized if we pivot to a Full Integration SDK approach.