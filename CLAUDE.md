# Claude Development Context

> **Purpose**: This file provides essential context for Claude when working on the Adamik SDK project. Read this first in any new session to understand the current state, architecture, and development patterns.

## Quick Context Summary

- **What**: TypeScript SDK for verifying Adamik API transaction responses
- **Status**: Production-ready core, EVM fully implemented with EIP-55 support and Chain ID validation, Bitcoin with real PSBT decoding, Cosmos with real protobuf decoding (including stake/unstake/claim rewards), Tron with real transaction parsing, Solana with BORSH decoding
- **Tests**: 92 tests across 9 suites (all passing)
- **Recent**: Chain discovery methods added - getSupportedChains(), isChainSupported(), getSupportedFormats()

## Project Overview

**Adamik SDK** - TypeScript/Node.js **Pure Verification SDK** for validating API responses against original transaction intent.

**Design Philosophy**: This SDK follows the Unix principle of "do one thing well" - it focuses solely on verification, not API integration. Users bring their own API responses (from fetch, axios, backends, etc.) and the SDK verifies them.

**Core Security Problem**: Malicious APIs can show correct readable data but provide tampered encoded transactions.

**Solution - Two-Step Verification**:

1. **Intent Validation** - Compare API response data vs user intent (✅ Implemented)
2. **Encoded Transaction Validation** - Decode and verify actual transaction bytes (✅ EVM, Bitcoin & Cosmos, ⚠️ others placeholder)

**Key Classes**:

- `AdamikSDK` - Main SDK class with `verify()` and `decode()` methods
- `DecoderRegistry` - Manages blockchain-specific decoders
- `BaseDecoder` - Abstract class for chain-specific implementations
- `TransactionVerifier` - Handles verification logic (in utils/)
- `AddressNormalizer` - EVM address normalization with EIP-55 support (in utils/)

## Current Architecture

### Core Components

```
src/
├── index.ts              # Main AdamikSDK class with verify() and decode() methods
├── types/index.ts        # TypeScript type definitions including DecodedTransaction
├── schemas/              # Zod schemas and error handling
│   ├── index.ts         # Main schema exports
│   ├── errors.ts        # Enhanced ErrorCollector with deduplication
│   └── transaction.ts   # Transaction validation schemas
├── utils/                # Utility classes
│   ├── address-normalizer.ts    # EVM address normalization with EIP-55 support
│   └── transaction-verifier.ts  # Transaction verification logic
└── decoders/
    ├── base.ts           # Abstract BaseDecoder class + DecoderWithPlaceholder interface
    ├── registry.ts       # DecoderRegistry for managing decoders
    ├── evm.ts           # Real EVM RLP decoder using viem
    ├── bitcoin.ts       # Real Bitcoin PSBT decoder using bitcoinjs-lib
    ├── cosmos.ts        # Real Cosmos SDK decoder using @cosmjs/proto-signing
    └── tron.ts          # Real Tron decoder using tronweb
```

### Test Structure

```
tests/
├── decoders.test.ts         # Decoder tests (17 tests)
├── sdk-validation.test.ts   # Core SDK tests (12 tests)
├── integration.test.ts      # End-to-end tests (1 test)
├── attack-scenarios.test.ts # Security attack tests (9 tests)
├── edge-cases.test.ts       # Boundary condition tests (11 tests)
├── error-handling.test.ts   # Error path tests (10 tests)
├── api-responses.test.ts    # Real API response tests (12 tests)
├── evm-chainid-real-data.test.ts # EVM chain ID security tests (8 tests)
├── chain-discovery.test.ts  # Chain discovery functionality tests (9 tests)
└── fixtures/
    └── api-responses/       # Real API response data by blockchain (object format)
        ├── ethereum.json    # Ethereum test cases
        ├── bitcoin.json     # Bitcoin test cases
        ├── cosmos.json      # Cosmos test cases
        ├── injective.json   # Injective test cases
        ├── tron.json        # Tron test cases
        └── celestia.json    # Celestia test cases
```

**Total: 76 tests across 9 suites (all passing)**

### Test Summary Table

All test runs now display a comprehensive summary table showing:

- Overall test results with pass rates
- Per-suite breakdown with timing information
- Blockchain-specific test counts (Bitcoin, EVM, Other)
- List of all executed tests with duration
- Failed test details (if any)

This is powered by a custom Jest reporter at `scripts/jest-table-reporter.js`

## Current Implementation Status

### ✅ Fully Implemented

- **Intent validation** for all transaction types
- **Real EVM RLP decoding** using viem library (Ethereum, Polygon, BSC, etc.)
- **EVM Chain ID validation** - Prevents replay attacks by validating transaction chain ID matches expected network
- **Real Bitcoin PSBT decoding** using bitcoinjs-lib (Bitcoin mainnet and testnet)
- **Real Cosmos protobuf decoding** using @cosmjs/proto-signing (Cosmos Hub, Celestia, Injective, Babylon)
- **Cosmos staking operations** - Full support for stake (MsgDelegate), unstake (MsgUndelegate), and claim rewards (MsgWithdrawDelegatorReward)
- **Real Tron decoder** using tronweb library (Tron mainnet with TRC20 token support)
- **Real Solana decoder** using @solana/web3.js (Solana mainnet with SPL token support)
- **EIP-55 checksum addresses** - All EVM addresses use proper checksumming
- **Pure verification design** - no network calls, just validation
- **Comprehensive test suite** with security attack scenarios + real API response data
- **TypeScript support** with strict mode
- **Enhanced error handling** - Deduplication, context aggregation, recovery strategies
- **Development tooling** - ESLint, type checking, prepublish scripts
- **Chain discovery methods** - getSupportedChains(), isChainSupported(), getSupportedFormats() for runtime discovery

### ⚠️ Placeholder/Limited

- **Other chain decoders** - Only EVM, Bitcoin, Cosmos, Tron, and Solana have real implementations (Algorand, Aptos, TON, etc. still need decoders)

## Recent Major Changes (December 2024 - July 2025)

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
- Updated `README.md` to reflect simplifications

### ✅ Completed: EIP-55 Checksum Implementation (July 2025)

**What**: Added proper EIP-55 address checksumming to EVM decoder
**Impact**: Enhanced security and standards compliance
**Changes**:

- Updated `src/decoders/evm.ts` to use viem's `getAddress` for EIP-55 checksumming
- All decoded EVM addresses now returned in proper checksum format
- Ensures address integrity throughout transaction verification flow
- Example: `0x8bc6922eb94e4858efaf9f433c35bc241f69e8a6` → `0x8bc6922Eb94e4858efaF9F433c35Bc241F69e8a6`

### ✅ Completed: Bruno Test Data Migration (July 2025)

**What**: Migrated from legacy test fixtures to Bruno imported data
**Impact**: Better real-world test coverage with actual API responses
**Changes**:

- Added `tests/fixtures/bruno-imported/` with 16 chain-specific test files
- Updated all decoder tests to use Bruno data instead of `real-transactions.json`
- Added new `bruno-imported.test.ts` with 29 tests covering all imported chains
- Test count increased from 30 to 58 tests
- Better coverage of edge cases and real API response formats

### ✅ Completed: Real Bitcoin Decoder Implementation (July 2025)

**What**: Replaced placeholder Bitcoin decoder with real PSBT parsing
**Impact**: Bitcoin transactions now have full validation capabilities
**Changes**:

- Integrated `bitcoinjs-lib` for PSBT parsing
- Implemented real address extraction from PSBT data
- Added proper amount calculation from transaction outputs
- Bitcoin decoder now returns consistent DecodedTransaction format
- Supports both mainnet and testnet Bitcoin networks

### ✅ Completed: Test Suite Consolidation (July 2025)

**What**: Removed redundancies and reorganized test files
**Impact**: Reduced from 58 to 51 tests while maintaining full coverage
**Changes**:

- Removed duplicate basic validation tests from scenarios.test.ts
- Consolidated all attack detection tests into scenarios.test.ts
- Removed redundant Bruno data test from sdk-validation.test.ts
- Clear separation: sdk-validation for happy path, scenarios for attacks

### ✅ Completed: Cosmos Decoder Addition (July 2025)

**What**: Added Cosmos SDK chain decoder support
**Impact**: Architecture ready for Cosmos chains (cosmoshub, celestia, injective, babylon-testnet)
**Changes**:

- Created CosmosDecoder class (placeholder implementation)
- Added COSMOS_PROTOBUF to RawFormat type
- Registered 4 Cosmos chains in decoder registry
- Added 4 new decoder tests
- Note: Real implementation requires protobuf parsing libraries

### ✅ Completed: Bruno Test Removal and Manual API Response Tests (July 2025)

**What**: Replaced Bruno-imported tests with manual API response fixtures
**Impact**: Cleaner test structure with real API responses organized by blockchain
**Changes**:

- Removed bruno-imported.test.ts and all bruno-imported fixtures per CTO feedback
- Created api-responses.test.ts with JSON fixtures per blockchain family
- Now have ethereum.json, bitcoin.json, cosmos.json with real API responses
- Test count reduced from 51 to 23 (focusing on quality over quantity)
- Added status field to AdamikEncodeResponse type with support for warnings
- Updated Cosmos decoder registration to support multiple formats (SIGNDOC_DIRECT, etc.)

### ✅ Completed: Real Cosmos Decoder Implementation (July 2025)

**What**: Replaced placeholder Cosmos decoder with real protobuf parsing
**Impact**: Cosmos chains now have full transaction validation capabilities
**Changes**:

- Integrated @cosmjs/proto-signing, @cosmjs/encoding, and @cosmjs/stargate for protobuf parsing
- Implemented SignDoc parsing for SIGNDOC_DIRECT format
- Added support for MsgSend transaction type decoding
- Properly extracts sender, recipient, and amount from Cosmos transactions
- Added basic Cosmos address validation (bech32 format)
- All 23 tests now passing (previously 1 was skipped)

### ✅ Completed: Test Fixture Standardization (July 2025)

**What**: Standardized all test fixtures to object format and implemented DRY test helper
**Impact**: Improved test maintainability and consistency
**Changes**:

- Converted all API response fixtures from array format to object format
  - Before: `[{name: "test1", ...}, {name: "test2", ...}]`
  - After: `{"test1": {...}, "test2": {...}}`
- Implemented `runBlockchainTests` helper function in api-responses.test.ts
- Eliminated code duplication across blockchain tests
- Added Celestia test fixtures with useMaxAmount and specific amount cases
- Test count increased to 29 tests (added Celestia and more scenarios)

### ✅ Completed: Zod Validation & Enhanced Error Management (July 2025)

**What**: Integrated Zod for runtime validation matching Adamik API patterns
**Impact**: Type-safe validation with rich error reporting
**Changes**:

- Added Zod v3 as dependency for schema validation
- Created schema definitions matching API's discriminated unions
- Implemented enhanced error structure with severity levels
- Added ErrorCollector for structured error aggregation
- Updated verify() method to use Zod validation
- Maintained backward compatibility with existing tests
- Improved autocomplete through Zod type inference

### ✅ Completed: Real Tron Decoder Implementation (July 2025)

**What**: Replaced placeholder Tron decoder with real transaction parsing
**Impact**: Tron transactions now have full validation capabilities
**Changes**:

- Integrated TronWeb library (v6.0.3) for transaction parsing and address conversion
- Implemented hex pattern matching for TransferContract and TriggerSmartContract types
- Added proper hex to base58 address conversion (41... to T... format)
- Extracts sender, recipient, amount from both native TRX and TRC20 token transfers
- Added Tron address validation using TronWeb.isAddress()
- Test count increased from 29 to 37 tests (added Tron-specific tests)

### ✅ Completed: Comprehensive Code Quality Improvements (July 2025)

**What**: Implemented all recommendations from senior architect review
**Impact**: Significantly improved type safety, error handling, and test coverage
**Changes**:

- **Type Safety**: Created DecoderWithPlaceholder interface to replace unsafe `as any` casting
- **Error Handling**: Implemented error deduplication, context aggregation, and recovery strategies
- **Development Scripts**: Added typecheck, lint, lint:fix, prepublishOnly npm scripts
- **ESLint Configuration**: Added comprehensive linting rules for TypeScript
- **Test Coverage**: Added 30 new tests across attack-scenarios, edge-cases, and error-handling
- **EVM Address Normalization**: Implemented case-insensitive address comparison for EVM chains
- Test count increased from 38 to 63 tests (later increased to 80 with additional tests)

### ✅ Completed: EVM Chain ID Security Fix (July 2025)

**What**: Implemented comprehensive chain ID validation for EVM transactions
**Impact**: Prevents replay attacks across different EVM networks
**Changes**:

- **Chain ID extraction** - EVM decoder extracts chainId from transactions
- **Chain ID validation** - Decoder validates transaction chainId matches expected network
- **Security error handling** - Chain ID mismatches throw critical errors with clear messages
- **Integration with verify()** - Main SDK treats chain ID mismatches as critical security errors
- **Comprehensive tests** - Added evm-chainid-real-data.test.ts with 8 tests covering replay attack scenarios
  **Security benefit**: Transactions can only be executed on their intended network, preventing cross-chain replay attacks

### ✅ Completed: EVM Sender Address Analysis (July 2025)

**What**: Investigated why EVM decoder returns empty sender address
**Impact**: Clarified design decision and improved integration documentation
**Key Findings**:

- **EVM unsigned transactions don't contain sender address** - Must be recovered from signature
- **Design is intentional** - EVM decoder returns empty string with comment "Will be filled by verification logic"
- **Other decoders extract sender** - Bitcoin (from PSBT UTXO), Cosmos (from protobuf), Tron (from raw data)
- **SDK provides full context** - Returns both API data (validated) and decoded data (raw)
  **Integration Note**: UI implementations (like adamik-link) should use API response sender for EVM chains when decoded is empty

### ✅ Completed: Public Decode Method & Architecture Refactoring (July 2025)

**What**: Added public decode() method and refactored SDK architecture
**Impact**: Improved code maintainability and added new functionality
**Changes**:

- **Added public decode() method** - Direct access to decoding without verification
- **Created utility classes** - AddressNormalizer and TransactionVerifier
- **Extracted verification logic** - Moved from index.ts to TransactionVerifier class
- **Simplified main SDK class** - Now focuses on orchestration rather than implementation
- **Removed unused code** - Deleted compareTransactionData() method
- **Test improvements** - Updated tests to use real transaction data from fixtures
- Test count now at 69 tests (all passing)

### ✅ Completed: Enhanced Cosmos Decoder with Full Staking Support (July 2025)

**What**: Extended Cosmos decoder to support unstake and claim rewards operations
**Impact**: Complete Cosmos staking workflow support
**Changes**:

- **Added MsgUndelegate support** - Proper decoding of unstake transactions
- **Added MsgWithdrawDelegatorReward support** - Decoding of claim rewards transactions
- **Fixed graceful failure handling** - Decoder now properly handles all Cosmos transaction types
- **Added 3 new test cases** - cosmos_unstake, cosmos_claim_rewards, cosmos_claim_rewards_with_amount
- **Improved error handling** - SDK no longer fails when encountering unsupported transaction types
- Test count increased from 69 to 72 tests (all passing)

### ✅ Completed: SDK Dogfooding - verify() now uses decode() internally (July 2025)

**What**: Refactored verify() to use the public decode() method internally
**Impact**: Eliminated code duplication and ensured consistency between verify and decode results
**Changes**:

- **Refactored internal method** - Renamed `decodeAndVerify()` to `processEncodedTransaction()` for clarity
- **Now calls public decode()** - Method delegates decoding to the public decode() method
- **Fixed type imports** - Added ChainId and RawFormat imports to properly type parameters
- **Preserved behavior** - Maintained backward compatibility for missing decoder warnings
- **Error mapping** - Properly maps DecodeResult errors/warnings to ErrorCollector entries
- **Code consistency** - Both verify() and decode() now share exact same decoding path
- **Improved documentation** - Added clear comments explaining what the method does and doesn't do
  **Benefits**:
- No more risk of divergence between decode() and verify() behaviors
- Single source of truth for decoding logic
- Clearer method naming that reflects actual responsibility
- Easier maintenance and future enhancements
- All 72 tests continue to pass

### ✅ Completed: Improved DecodedTransaction Structure (July 2025)

**What**: Refactored DecodedTransaction interface for better API consistency
**Impact**: Breaking changes that improve API clarity and consistency
**Changes**:

- **Moved fee to top level** - `fee` field now at same level as amount, not buried in `raw`
- **Removed redundant fields** - Eliminated `from`, `to`, `value`, `data` duplicates
- **Standardized naming** - Consistent use of `senderAddress` and `recipientAddress`
- **Bitcoin fee calculation** - Added proper fee calculation as (inputs - outputs)
- **All decoders updated** - EVM, Bitcoin, and Cosmos now return fees at top level
- **Documentation updated** - README reflects new structure
  **Benefits**:
- Cleaner, more intuitive API structure
- Fees are easily accessible for all blockchains
- No more confusion between `from` vs `senderAddress`
- Better consistency across different blockchain decoders
- All 80 tests pass (8 new tests added)

### ✅ Completed: Chain Types and Utilities (July 2025)

**What**: Added comprehensive Chain type system based on Adamik API chains.json
**Impact**: Better type safety and chain metadata access
**Changes**:

- **Created Chain types** - Comprehensive interfaces for chain metadata
- **Added chain utilities** - Helper functions for accessing chain information
- **Updated EVM constants** - Now uses chains.json as single source of truth
- **Removed redundant files** - Deleted hardcoded evm-chains.ts

### ✅ Completed: Enhanced DecodedTransaction Fields (July 2025)

**What**: Renamed raw field and added memo support
**Impact**: Clearer API and standard memo field support
**Changes**:

- **Renamed raw to chainSpecificData** - More descriptive field name
- **Added memo field** - Standard field for transaction memos
- **Updated all decoders** - Cosmos decoder extracts memo from transactions
- **Updated all tests** - Fixed references to use new field names

### ✅ Completed: Removed isPlaceholder from DecodeResult (July 2025)

**What**: Removed the isPlaceholder field from DecodeResult interface
**Impact**: Cleaner API without confusing implementation details
**Changes**:

- **Removed isPlaceholder field** - This was an internal implementation detail that confused users
- **Internal handling only** - Placeholder decoder detection is now handled internally
- **Maintained warnings** - Placeholder decoders still generate appropriate warnings
- **No breaking changes** - Users weren't supposed to rely on this field anyway

### ✅ Completed: Solana Decoder Implementation (July 2025)

**What**: Added real Solana decoder with BORSH format support
**Impact**: Solana transactions now have full validation capabilities
**Changes**:

- **Integrated @solana/web3.js** - For address validation and PublicKey handling
- **BORSH format parsing** - Handles Adamik's custom BORSH encoding for Solana
- **SOL transfers** - Extracts sender, recipient, and amount from native transfers
- **SPL token transfers** - Supports token transfers with amount extraction
- **Address extraction** - Properly identifies sender and recipient addresses
- **Limitations**:
  - Token ID is currently hardcoded for USDC - proper implementation would need to parse token mint address from instruction data
  - Recipient address for SPL token transfers is simplified - in reality, SPL tokens are sent to Associated Token Accounts (ATAs), not wallet addresses directly
  - The decoder cannot determine the actual recipient wallet from ATA addresses without additional data
  - Staking operations (stake, unstake, withdraw) are not yet implemented - would require parsing different instruction types and stake account data
- Test count increased from 80 to 83 tests (added 3 Solana tests)

### ✅ Completed: Chain Discovery Methods (July 2025)
**What**: Added public methods for discovering supported blockchain chains
**Impact**: Users can now programmatically discover which chains have decoder support
**Changes**:
- **Added getSupportedChains()** - Returns all chains with their family, formats, and decoder status
- **Added isChainSupported()** - Quick check if a specific chain has decoder support
- **Added getSupportedFormats()** - Get supported encoding formats for a specific chain
- **86 supported chains** - Across EVM (37), Bitcoin (5), Cosmos (42), Tron (1), and Solana (1)
- **Added chain-discovery.test.ts** - 9 new tests for chain discovery functionality
- **Updated README** - Added API reference documentation and examples
- **Test count increased** - From 83 to 92 tests
**Benefits**:
- Users can check chain support before attempting to decode/verify
- Clear visibility into which blockchains have real vs placeholder decoders
- Enables dynamic UI that adapts to available decoders
- Better developer experience with runtime discovery

## Key Security Features

### Attack Detection

- **Malicious encoded transactions** - API shows correct data but sends to different recipient/amount
- **Data tampering** - Mode, recipient, amount mismatches
- **Real RLP verification** - Cryptographic validation for EVM chains
- **Real PSBT verification** - Authentic Bitcoin transaction parsing

### Critical Security Tests

- ✅ **Malicious API detection** - API shows correct data but encoded transaction sends elsewhere
- ✅ **Recipient tampering** - `Critical: Decoded transaction recipient mismatch`
- ✅ **Amount manipulation** - `Critical: Decoded transaction amount mismatch`
- ✅ **Mode confusion** - Transaction type switching attacks
- ✅ **Real RLP decoding** - Uses `viem` library for authentic EVM validation
- ✅ **Real PSBT decoding** - Uses `bitcoinjs-lib` for authentic Bitcoin validation

### Test File Breakdown

- `attack-scenarios.test.ts` (9 tests) - Security attack detection (EVM, Bitcoin, tokens, Cosmos)
- `edge-cases.test.ts` (11 tests) - Boundary conditions and special cases
- `error-handling.test.ts` (10 tests) - Error path coverage and exception handling
- `sdk-validation.test.ts` (6 tests) - Core validation logic (happy path)
- `decoders.test.ts` (17 tests) - Blockchain decoder functionality
- `integration.test.ts` (1 test) - End-to-end workflow
- `api-responses.test.ts` (12 tests) - Real API response validation (Ethereum, Bitcoin, Cosmos with stake/unstake/claim rewards, Injective, Tron, Celestia)

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
  async decode(rawData: string): Promise<DecodedTransaction> {
    /* impl */
  }
  validate(decodedData: unknown): boolean {
    /* impl */
  }
}

// 2. Register in DecoderRegistry.registerDefaultDecoders()
this.registerDecoder(new NewChainDecoder("newchain"));

// 3. Add real transaction data to fixtures/api-responses/[chain].json
// 4. Add tests to api-responses.test.ts or decoders.test.ts
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

**IMPORTANT: Always use pnpm instead of npm for all commands.**

```bash
# Development
pnpm run dev          # Run with ts-node
pnpm run build        # TypeScript compilation
pnpm run format       # Prettier formatting

# Testing
pnpm test             # All 92 tests
pnpm run test:watch   # Watch mode
pnpm run typecheck    # TypeScript type checking
pnpm run lint         # ESLint checking
pnpm run lint:fix     # ESLint auto-fix
```

For detailed test commands and test suite organization, see [tests/README.md](tests/README.md).

## Technical Stack

### Production Dependencies

- **viem** (^2.32.0) - Real EVM RLP decoding (parseTransaction, isAddress, isHex, getAddress)
  - Used in `src/decoders/evm.ts` for authentic blockchain transaction parsing
  - Provides EIP-55 checksum address formatting via getAddress
  - Enables real security validation for EVM chains
- **bitcoinjs-lib** (^6.1.7) - Real Bitcoin PSBT parsing and decoding
  - Used in `src/decoders/bitcoin.ts` for PSBT transaction parsing
  - Extracts addresses, amounts, and transaction details from PSBT format
  - Supports both mainnet and testnet Bitcoin networks
- **@cosmjs/proto-signing** (^0.34.0) - Cosmos protobuf transaction decoding
  - Used in `src/decoders/cosmos.ts` for SignDoc and transaction parsing
  - Provides decodeTxRaw for parsing Cosmos transactions
- **@cosmjs/encoding** (^0.34.0) - Cosmos encoding utilities (fromHex, toBech32)
- **@cosmjs/stargate** (^0.34.0) - Cosmos registry types for message decoding
- **cosmjs-types** (^0.9.0) - Protobuf type definitions for Cosmos messages
- **tronweb** (^6.0.3) - Tron transaction parsing and address conversion
  - Used in `src/decoders/tron.ts` for transaction decoding
  - Provides hex to base58 address conversion (41... to T... format)
  - Validates Tron addresses and handles TRC20 token transfers
- **@solana/web3.js** (^1.95.0) - Solana transaction parsing and address validation
  - Used in `src/decoders/solana.ts` for BORSH format parsing
  - Provides PublicKey validation and base58 address conversion
  - Handles SOL transfers and SPL token transfers
- **@solana/spl-token** (^0.4.13) - SPL token support for Solana
  - Provides TOKEN_PROGRAM_ID constant for identifying token transfers

### Development Stack

- **TypeScript** (^5.8.3) - Strict mode enabled, full type safety
- **Jest** (^30.0.4) - Testing framework, 92 tests across 9 suites
- **Prettier** (^3.6.2) - Code formatting (pnpm run format)
- **ESLint** (^9.1.1) - Linting with TypeScript support
- **ts-node** (^10.9.2) - Development execution
- **ts-jest** (^29.4.0) - TypeScript Jest integration
- **Zod** (^3.24.1) - Runtime validation with type inference

### Key Libraries NOT Used (Potential Additions)

- **ethers.js** - Alternative to viem for EVM
- **algosdk** - Future Algorand support
- **@aptos-labs/ts-sdk** - Future Aptos support
- **tonweb** - Future TON blockchain support

## Working with Claude CLI

When using Claude for development on this project, always use the `--dangerously-skip-permissions` flag:

```bash
claude --dangerously-skip-permissions
```

This prevents permission prompts during the development session and ensures smooth workflow when Claude needs to read, write, or execute files.

## 🚨 Pre-Release Requirements

All critical pre-release requirements have been addressed:
- ✅ GitHub Actions CI/CD workflows added
- ✅ .npmignore file created for proper package publishing
- ✅ Repository URLs updated to organization
- ✅ Package name changed to @adamik/sdk

## Future Enhancements

See [ROADMAP.md](ROADMAP.md) for detailed future development priorities and implementation guidelines.

## Working with Claude

### Session Start Checklist

1. **Read this file completely** - Understand current state
2. **Check recent changes section** - What was done and why
3. **Review development patterns** - How to add features consistently
4. **Note current limitations** - What's placeholder vs fully implemented

### Important Development Guidelines

- **Always use pnpm** - Never use npm for any commands
- **Always challenge assumptions** - Verify data formats and API responses before implementation
- **Propose alternatives** - When something seems suboptimal, suggest better approaches
- **Use Claude CLI with --dangerously-skip-permissions** - When using Claude for development, always include this flag to avoid permission prompts

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

- **EVM, Bitcoin, Cosmos, Tron, and Solana** have real encoded validation - Other chains still need decoders
- **Test with real data** - Use `fixtures/api-responses/` for authentic API responses
- **Security focus** - Always test malicious API scenarios
- **TypeScript strict** - No `any` types, full type safety required
- **EIP-55 compliance** - All EVM addresses must use proper checksumming
- **EVM Chain ID validation** - ✅ Already implemented to prevent replay attacks
- **Solana uses Adamik's custom BORSH encoding** - Not standard Solana transaction format
- **Always use pnpm** - Package manager consistency is important

### 🎯 Current Priorities

1. **Add GitHub Actions CI/CD** - BLOCKING RELEASE - Essential for open-source quality
2. **Create .npmignore** - BLOCKING RELEASE - Prevents publishing unnecessary files
3. **TON decoder** - Next major feature, complex but valuable
4. **Complete decoder coverage** - Algorand, Aptos, Starknet implementations

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

**Date**: July 2025  
**Session**: Chain Discovery Methods Implementation
**Major Changes**:

- Added getSupportedChains(), isChainSupported(), and getSupportedFormats() methods
- Users can now programmatically discover which of the 86 chains have decoder support
- Added comprehensive test suite with 9 new tests
- Updated README with API reference and examples
- Test count increased from 83 to 92 tests
**Previous Session**: Solana Decoder Implementation
**Next Session Should**: Implement TON decoder or add Solana staking operations

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

**Note**: The AdamikAPIClient has been removed to maintain the Pure Verification SDK design philosophy. Users should bring their own API responses from any source.
