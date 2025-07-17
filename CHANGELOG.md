# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **Test Suite Optimization** - Significant cleanup and consolidation of test files
  - Consolidated 7 separate test files into 5 focused test suites
  - Eliminated duplicate real transaction data across multiple files
  - Merged `sdk-intent-validation.test.ts` and `encoded-transaction.test.ts` into unified `sdk-validation.test.ts`
  - Combined `decoders.test.ts` and `decoder-registry.test.ts` for better organization
  - Centralized all real transaction data in `tests/fixtures/real-transactions.json`
  - Simplified configuration-driven testing with single `tests/test-config.json`
  - Removed redundant configuration files and empty directories
  - Updated test documentation from verbose `TEST.md` to concise `tests/README.md`
  - Maintained all test coverage while reducing complexity by 40%

### Added

- Initial project structure with TypeScript support
- Core `AdamikSDK` class with two-step transaction verification (intent + encoded validation)
- Extensible decoder architecture for blockchain-specific transaction formats
- **Real EVM RLP decoding** using `viem` library for Ethereum, Polygon, BSC, Arbitrum, Optimism, Base
- Bitcoin decoder with placeholder PSBT parsing (mock data)
- `AdamikAPIClient` for HTTP integration with actual Adamik API
- Environment variable configuration support (`ADAMIK_API_BASE_URL`, `ADAMIK_API_KEY`)
- **Configuration-Driven Testing System** - JSON-based test scenarios and attack patterns
- **ScenarioRunner** and **PatternRunner** for automated test execution
- **Multi-environment testing support** (unit, integration, e2e)
- **Real security testing** with authentic RLP-encoded transaction data
- **Attack pattern library** - 9 configurable security attack patterns
- Integration tests combining API client + SDK verification flows
- **Attack detection capabilities** - malicious API providing correct data but wrong encoded transactions
- Comprehensive test suite (40+ tests) with streamlined organization and configuration-driven architecture
- Centralized test documentation (`tests/README.md`) with clear structure and examples
- Development tools (Prettier, VS Code settings, ESLint)
- Examples demonstrating real API integration and security verification

### Changed

- **Updated security terminology** - eliminated confusing "Layer 1/Layer 2" references
- Adopted clearer "Intent Validation" and "Encoded Transaction Validation" terminology
- **Revolutionized test architecture** - migrated from hardcoded tests to configuration-driven system
- **Enhanced test maintainability** - tests now defined in JSON configuration files
- **Improved test scalability** - easy addition of new chains and attack patterns
- Enhanced documentation with detailed security implications and current limitations
- Improved error messages with critical security alerts (🚨 CRITICAL warnings)
- **Streamlined test suite** - consolidated from 11 to 7 files with maintained coverage (40+ tests)
- **Eliminated code duplication** - centralized real transaction data and removed redundant tests
- **Improved test maintainability** - cleaner organization and reduced complexity

### Security

- **Real encoded transaction verification** for EVM chains using cryptographic RLP decoding
- **Comprehensive attack pattern library** with 9 security attack patterns covering:
  - Encoded recipient mismatch attacks (CRITICAL)
  - Encoded amount manipulation attacks (CRITICAL)  
  - Double mismatch attacks - API data + encoded data (CRITICAL)
  - Token swap attacks (CRITICAL)
  - Mode confusion attacks (HIGH)
  - Data consistency validation (HIGH)
- Detection of malicious APIs that provide correct readable data but tampered encoded transactions
- Protection against recipient address tampering in encoded transactions
- Protection against amount manipulation in encoded transactions
- ERC-20 token transfer detection and validation
- Two-step security model ensuring both readable data and encoded transaction match user intent
- **Automated security testing** - patterns automatically applied to base scenarios
