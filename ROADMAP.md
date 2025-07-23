# Adamik SDK Roadmap

## Overview

This document outlines the future development priorities for the Adamik SDK, organized by priority and complexity.

## Current Status

### ✅ Implemented Decoders
- **EVM** (37 chains) - Using viem library
- **Bitcoin** (5 chains) - Using bitcoinjs-lib
- **Cosmos** (42 chains) - Using @cosmjs/proto-signing
- **Tron** (1 chain) - Using tronweb
- **Solana** (1 chain) - Using @solana/web3.js (basic transfers only)

### 🔍 Available Features
- Intent validation for all transaction types
- Real transaction decoding for supported chains
- Chain discovery methods (getSupportedChains, isChainSupported, getSupportedFormats)
- Public decode() method for direct transaction decoding
- Comprehensive security testing (92 tests)

## Priority 1: Complete Blockchain Coverage

### TON Decoder 🔥
**Complexity**: High  
**Value**: High - Popular blockchain with complex transaction format  
**Reference**: Minitel has comprehensive TON parser at `/Users/fabricedautriat/Documents/GitHub/minitel/src/lib/ton/`

Key implementation steps:
1. Install `tonweb` dependency
2. Port TonParser from Minitel
3. Handle BOC (Bag of Cells) format
4. Support transfer and staking operations

### Algorand Decoder
**Complexity**: Medium  
**Value**: Medium - Required for complete chains.json coverage  
**Dependencies**: `algosdk`

### Aptos Decoder  
**Complexity**: Medium  
**Value**: Medium - Growing Move-based blockchain  
**Dependencies**: `@aptos-labs/ts-sdk`

### Starknet Decoder
**Complexity**: High  
**Value**: Medium - Cairo-based L2 solution  
**Dependencies**: `starknet`

## Priority 2: Enhanced Features

### Solana Staking Operations
**Current Gap**: Only basic transfers implemented  
**Add Support For**:
- Stake operations
- Unstake operations  
- Withdraw rewards
- Delegate/undelegate

### Fee Calculation for Tron
**Current Gap**: Tron decoder doesn't extract fee information  
**Implementation**: Extract fee data from transaction parameters

### Transaction Hash Validation
**Security Enhancement**: Verify transaction hash matches encoded data  
**Implementation**:
- Add `generateHash()` method to BaseDecoder interface
- Implement for each blockchain (reference Minitel implementations)
- Add validation in TransactionVerifier

## Priority 3: Advanced Features

### Substrate Support (Polkadot/Kusama)
**Complexity**: Very High - Requires WebSocket management  
**Dependencies**: `@polkadot/api`  
**Reference**: Minitel's WebSocket client implementation

### Multi-signature Transaction Support
**Expand SDK capabilities** to handle:
- Partially signed transactions
- Multi-sig coordination
- Signature collection workflows

### Browser Compatibility
**Current**: Node.js only  
**Goal**: Full browser support for client-side verification

## Implementation Guidelines

### For Each New Decoder

1. **Follow existing patterns**:
   ```typescript
   export class NewChainDecoder extends BaseDecoder {
     constructor(chainId: ChainId) {
       super(chainId, "FORMAT_NAME");
     }
     async decode(rawData: string): Promise<DecodedTransaction> {
       // Implementation
     }
   }
   ```

2. **Add comprehensive tests**:
   - Unit tests in `tests/decoders.test.ts`
   - Integration tests in `tests/api-responses.test.ts`
   - Real transaction fixtures in `tests/fixtures/api-responses/[chain].json`

3. **Update types**:
   - Add chain to ChainId type
   - Add format to RawFormat type
   - Register in DecoderRegistry

4. **Document thoroughly**:
   - Update this ROADMAP when completed
   - Add usage examples to README
   - Note any limitations or known issues

## Success Metrics

- **Coverage**: 100% of chains in chains.json have real decoders
- **Security**: All decoders pass security test scenarios
- **Performance**: Decoding completes in <100ms for typical transactions
- **Reliability**: 99.9% success rate for valid transactions
- **Documentation**: Every feature has examples and API docs

## Contributing

See CONTRIBUTING.md for guidelines on implementing new features. Key principles:
- Maintain backward compatibility
- Follow existing code patterns
- Add comprehensive tests
- Document all changes