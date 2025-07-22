# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Bitcoin Fee Calculation** - Added transaction fee extraction to Bitcoin decoder
  - Calculate fee as (total inputs - total outputs)
  - Added `totalInputValue` and `totalOutputValue` to raw output
  - Support both witness and non-witness UTXO inputs
  - Verified fee calculation matches expected values in test cases

### Changed

- **Improved DecodedTransaction Structure** - Breaking changes for better API consistency
  - Moved `fee` field from `raw` to top level of `DecodedTransaction`
  - Removed redundant `from`, `to`, `value`, and `data` fields
  - Standardized on `senderAddress` and `recipientAddress` naming
  - All decoders now return fees at the top level when available
  - Updated documentation to reflect new structure

- **SDK Dogfooding - verify() now uses decode() internally** - Eliminated code duplication
  - Renamed internal method from `decodeAndVerify()` to `processEncodedTransaction()` for better clarity
  - Refactored to use the public `decode()` method internally instead of duplicating logic
  - Ensures consistency between `verify()` and `decode()` results
  - Single source of truth for decoding logic
  - Properly maps DecodeResult errors/warnings to ErrorCollector entries
  - Fixed type imports for ChainId and RawFormat to ensure type safety
  - Maintained backward compatibility for missing decoder warnings
  - Improved method documentation to clarify responsibilities
  - All 72 tests continue to pass

- **Enhanced Cosmos Decoder with Full Staking Support** - Complete staking workflow
  - Added `MsgUndelegate` support for unstake transactions
  - Added `MsgWithdrawDelegatorReward` support for claim rewards transactions
  - Cosmos decoder now properly handles all common transaction types
  - Added 3 new test cases: `cosmos_unstake`, `cosmos_claim_rewards`, `cosmos_claim_rewards_with_amount`
  - Test count increased from 69 to 72 tests

- **Public `decode()` Method** - Direct transaction decoding without verification
  - Added public `decode()` method to `AdamikSDK` class for standalone decoding
  - Supports direct decoding of raw transaction data for debugging and inspection
  - Returns `DecodeResult` with decoded data, placeholder indicators, and warnings
- **Real Tron Decoder Implementation** - Full transaction parsing for Tron blockchain
  - Integrated `tronweb` library for authentic Tron transaction decoding
  - Support for TRC20 token transfers and native TRX transactions
  - Proper address validation and amount extraction for Tron format
- **Refactored Architecture with Cleaner Separation of Concerns**
  - Created utility classes: `AddressNormalizer` and `TransactionVerifier`
  - Moved verification logic from main SDK class to dedicated `TransactionVerifier`
  - Extracted address normalization logic to `AddressNormalizer` with EIP-55 support
  - Simplified main `AdamikSDK` class to focus on orchestration
- **Enhanced Error Handling with Deduplication and Recovery Strategies**
  - Improved `ErrorCollector` class with deduplication capabilities
  - Better error recovery and graceful degradation for failed operations
  - Standardized error message format across entire codebase
- **Comprehensive Test Suite with 72 Tests Across 7 Suites**
  - Updated test count from 45+ to 72 tests across 7 organized test suites
  - Enhanced test coverage with real transaction data from fixtures
  - Improved test organization and maintainability
- **Real Cosmos Decoder Implementation** - Full protobuf parsing for Cosmos SDK chains
  - Integrated `@cosmjs/proto-signing`, `@cosmjs/encoding`, and `@cosmjs/stargate` libraries
  - Support for SignDoc (SIGNDOC_DIRECT) format parsing
  - Decodes MsgSend transactions with sender, recipient, and amount extraction
  - Basic Cosmos address validation (bech32 format)
  - Support for Cosmos Hub, Celestia, Injective, and Babylon testnet
- **Injective Test Support** - Added Injective-specific test cases
  - Created `injective.json` fixture with real API response
  - Added attack scenarios for Injective transactions
  - Test count increased from 23 to 29
- **Manual API Response Testing Structure** - New test framework for real API responses
  - Created `api-responses.test.ts` for validating real API responses
  - Added JSON fixtures organized by blockchain (`ethereum.json`, `bitcoin.json`, `cosmos.json`, `injective.json`)
  - Support for optional `status` field in `AdamikEncodeResponse` type
  - Status warnings can be strings or objects with `message` property

### Changed

- **Bruno Test Removal** - Replaced Bruno-imported tests with manual fixtures
  - Removed `bruno-imported.test.ts` and all Bruno test fixtures per CTO feedback
  - Test fixtures now in `tests/fixtures/api-responses/` directory
  - Cleaner test organization with real-world API responses
- **Cosmos Decoder Enhancement** - From placeholder to full implementation
  - Updated decoder registry to support multiple Cosmos formats (SIGNDOC_DIRECT, SIGNDOC_DIRECT_JSON, etc.)
  - Cosmos tests now passing (previously skipped)

### Fixed

- **Codebase Review & Cleanup** - Complete code quality improvements
  - **Eliminated code duplication** in field verification by extracting shared validation logic
  - **Replaced magic numbers** with named constants (timeout values)
  - **Standardized error message format** across entire codebase (removed inconsistent emojis)
  - **Fixed import ordering** to follow consistent patterns (local imports first)
  - **Removed unused code** and helper methods

- **Test Suite Simplification** - Major reduction in testing complexity
  - **Removed 1,200+ lines** of overly complex configuration-driven testing infrastructure
  - **Deleted complex test utilities** (pattern-runner, scenario-runner, test-environment)
  - **Replaced with simple scenario-based tests** (45 clear, maintainable tests)
  - **Eliminated JSON configuration files** in favor of straightforward Jest tests
  - **Same test coverage** with dramatically reduced complexity
  - All 45 tests passing with better readability and maintenance

### Added

- Initial project structure with TypeScript support
- Core `AdamikSDK` class with two-step transaction verification (intent + encoded validation)
- Extensible decoder architecture for blockchain-specific transaction formats
- **Real EVM RLP decoding** using `viem` library for Ethereum, Polygon, BSC, Arbitrum, Optimism, Base
- Bitcoin decoder with placeholder PSBT parsing (mock data)
- `AdamikAPIClient` for HTTP integration with actual Adamik API
- Environment variable configuration support (`ADAMIK_API_BASE_URL`, `ADAMIK_API_KEY`)
- **Simple scenario-based testing** - Clear, maintainable test cases
- **Real security testing** with authentic RLP-encoded transaction data
- **Attack scenario coverage** - Tests for malicious API detection
- Integration tests combining API client + SDK verification flows
- **Attack detection capabilities** - malicious API providing correct data but wrong encoded transactions
- Comprehensive test suite (45+ tests) with streamlined organization
- Clear test documentation in `TEST.md`
- Development tools (Prettier, VS Code settings, ESLint)
- Examples demonstrating real API integration and security verification

### Changed

- **Updated security terminology** - eliminated confusing "Layer 1/Layer 2" references
- Adopted clearer "Intent Validation" and "Encoded Transaction Validation" terminology
- **Simplified test architecture** - moved from complex configuration-driven to simple scenario tests
- **Enhanced code maintainability** - extracted shared validation logic and standardized patterns
- Enhanced documentation with detailed security implications and current limitations
- Improved error messages with consistent formatting and clear security warnings
- **Streamlined test suite** - reduced complexity while maintaining full coverage (45+ tests)
- **Improved developer experience** - cleaner codebase and easier-to-understand tests

### Security

- **Real encoded transaction verification** for EVM chains using cryptographic RLP decoding
- **Security attack scenario testing** covering:
  - Encoded recipient mismatch attacks (CRITICAL)
  - Encoded amount manipulation attacks (CRITICAL)
  - API data tampering detection
  - Mode confusion and validation
- Detection of malicious APIs that provide correct readable data but tampered encoded transactions
- Protection against recipient address tampering in encoded transactions
- Protection against amount manipulation in encoded transactions
- ERC-20 token transfer detection and validation
- Two-step security model ensuring both readable data and encoded transaction match user intent
- **Clear security testing** - straightforward test scenarios for all attack vectors
