# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
