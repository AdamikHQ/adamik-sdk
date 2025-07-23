# Adamik SDK Improvement Guide

## 🚨 CRITICAL: Pre-Release Requirements (TOP PRIORITY)

### Must Fix Before Public Release

#### 1. Fix All 189 ESLint Errors 🔴 BLOCKING
**Impact**: Code quality and potential bugs
**Action Steps**:
```bash
# First, try auto-fix
pnpm run lint:fix

# Then manually fix remaining issues:
# - Unsafe `any` usage throughout the code
# - Missing `await` in async functions  
# - Unused variables
# - Type safety violations
# - Test files not included in TypeScript project config
```

#### 2. Add GitHub Actions CI/CD 🔴 BLOCKING
**Impact**: No automated testing or publishing
**Create**: `.github/workflows/test.yml`
```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g pnpm
      - run: pnpm install
      - run: pnpm run lint
      - run: pnpm run typecheck
      - run: pnpm test
```

**Create**: `.github/workflows/publish.yml` for npm releases

#### 3. Create .npmignore File 🔴 BLOCKING
**Impact**: Publishing 3x larger package with unnecessary files
**Create**: `.npmignore`
```
# Source files (only dist/ should be published)
src/
tests/
scripts/

# Config files
.eslintrc.js
.prettierrc
jest.config.js
tsconfig.json
*.code-workspace

# Documentation
CLAUDE.md
CONTRIBUTING.md
ADAMIK_SDK_IMPROVEMENTS.md

# Keep only:
# dist/
# LICENSE
# README.md
# CHANGELOG.md
# package.json
```

### Additional Pre-Release Tasks
- Remove `adamik.code-workspace` file
- Resolve TODO comments in `src/decoders/tron.ts`
- Update repository URLs from personal to organization (if applicable)
- Add SECURITY.md and issue templates

---

## Feature Improvements: Integrating Minitel Patterns

This section provides specific recommendations for improving Adamik SDK by integrating proven patterns from Minitel.

## 1. Add Solana Decoder ✅ IMPLEMENTED

### Current Status

Solana decoder has been implemented with support for SOL transfers and SPL token transfers.

### Implementation Details

1. **Install Solana Web3.js dependency**

```bash
pnpm add @solana/web3.js
```

2. **Create new decoder file**: `src/decoders/solana.ts`

```typescript
import { BaseDecoder, DecoderWithPlaceholder } from "./base";
import { ChainId, DecodedTransaction, RawFormat } from "../types";
import { Transaction, PublicKey } from "@solana/web3.js";

export class SolanaDecoder extends BaseDecoder implements DecoderWithPlaceholder {
  readonly isPlaceholder = false;

  constructor(chainId: ChainId) {
    super(chainId, "SOLANA_VERSIONED_TX");
  }

  async decode(rawData: string): Promise<DecodedTransaction> {
    try {
      // Reference: minitel/src/lib/parseSolTx.ts
      const txBuffer = Buffer.from(rawData, "hex");
      const tx = Transaction.from(txBuffer);

      // Extract transaction details
      const instructions = tx.instructions;
      const signatures = tx.signatures;

      // For transfer instructions, extract from/to/amount
      // This requires parsing the instruction data based on program ID
      let from: string | undefined;
      let to: string | undefined;
      let amount: string | undefined;

      if (tx.feePayer) {
        from = tx.feePayer.toBase58();
      }

      // Parse first instruction (typically the main operation)
      if (instructions.length > 0) {
        const instruction = instructions[0];
        if (instruction.keys.length >= 2) {
          to = instruction.keys[1].pubkey.toBase58();
        }
        // Amount parsing requires understanding the instruction data format
        // This varies by program (System Program, Token Program, etc.)
      }

      return {
        chainId: this.chainId,
        senderAddress: from,
        recipientAddress: to,
        amount: amount,
        mode: "transfer",
        chainSpecificData: {
          instructions: instructions.map((i) => ({
            programId: i.programId.toBase58(),
            keys: i.keys.map((k) => ({
              pubkey: k.pubkey.toBase58(),
              isSigner: k.isSigner,
              isWritable: k.isWritable,
            })),
            data: i.data.toString("hex"),
          })),
          signatures: signatures.map((s) => (s ? Buffer.from(s).toString("hex") : null)),
        },
      };
    } catch (error) {
      throw new Error(`Failed to decode Solana transaction: ${error.message}`);
    }
  }

  validate(decodedData: unknown): boolean {
    // Implement validation logic
    const data = decodedData as DecodedTransaction;
    return !!(data.senderAddress && data.chainSpecificData);
  }
}
```

3. **Update ChainId type in** `src/schemas/common.ts`

```typescript
export const ChainIdSchema = z.enum([
  // ... existing chains ...
  "solana",
  "solana-devnet",
  // ... rest ...
]);
```

4. **Update RawFormat type in** `src/schemas/common.ts`

```typescript
export const RawFormatSchema = z.enum([
  // ... existing formats ...
  "SOLANA_VERSIONED_TX",
  "SOLANA_LEGACY_TX",
  // ... rest ...
]);
```

5. **Register decoder in** `src/decoders/registry.ts`

```typescript
// Add import
import { SolanaDecoder } from "./solana";

// In registerDefaultDecoders():
// Solana
this.registerDecoder(new SolanaDecoder("solana"));
this.registerDecoder(new SolanaDecoder("solana-devnet"));
```

6. **Add test fixture**: `tests/fixtures/api-responses/solana.json`

```json
{
  "solana_transfer": {
    "intent": {
      "mode": "transfer",
      "recipientAddress": "Destination5accountGdSzZbEF7YQKCCCahuMEadA1J",
      "amount": "1000000000",
      "senderAddress": "Source5accountXqFoy8qN6svxGCqS9KHC8uZBmRwc6"
    },
    "response": {
      "transaction": {
        "encoded": [
          {
            "raw": {
              "format": "SOLANA_VERSIONED_TX",
              "value": "030000000000000000..." // Real Solana transaction hex
            }
          }
        ]
      }
    }
  }
}
```

### Implementation Notes

**Key Findings:**
- Adamik uses a custom BORSH encoding format, not standard Solana transaction format
- Transaction structure has addresses at specific byte offsets (4 and 36)
- SPL token transfers use Associated Token Accounts (ATAs)
- Token ID cannot be reliably extracted from the custom format and is currently hardcoded for USDC

### Known Limitations

1. **Custom BORSH Format**: The decoder handles Adamik's custom BORSH encoding, not standard Solana transactions
2. **Token ID Hardcoding**: SPL token mint addresses cannot be extracted from the transaction data and must be hardcoded
3. **ATA Handling**: Token transfers to same wallet show sender address for both sender and recipient
4. **Limited Operations**: Only supports basic transfers and SPL token transfers (no staking operations yet)
5. **Amount Extraction**: Relies on specific byte patterns that may vary with different transaction types

### Files Created/Modified

- Created: `src/decoders/solana.ts` - Solana decoder implementation
- Modified: `src/decoders/registry.ts` - Added Solana decoder registration
- Created: `tests/fixtures/api-responses/solana.json` - Test fixtures
- Modified: `tests/api-responses.test.ts` - Added Solana tests
- Modified: `package.json` - Added @solana/web3.js and @solana/spl-token dependencies

---

## 2. Chain Discovery Methods ✅ IMPLEMENTED

### Implementation Summary

Added three public methods to enable runtime discovery of supported blockchains:

1. **`getSupportedChains()`** - Returns detailed information about all 86 supported chains
2. **`isChainSupported(chainId)`** - Quick boolean check for chain support
3. **`getSupportedFormats(chainId)`** - Returns supported encoding formats for a chain

### Key Benefits

- **Dynamic UI Building** - Applications can programmatically discover supported chains
- **Format Discovery** - Know which encoding formats each chain supports (important for Cosmos)
- **Type Safety** - Full TypeScript support with proper types
- **No Breaking Changes** - Purely additive feature

### Files Modified

- Modified: `src/index.ts` - Added three public methods
- Created: `tests/chain-discovery.test.ts` - 9 comprehensive tests
- Modified: `README.md` - Added API reference documentation
- Modified: `CHANGELOG.md` - Documented the new feature

---

## 3. Implement TON Decoder

### Current Gap

TON decoder is mentioned but not implemented. Minitel has a comprehensive TON parser.

### Implementation Steps

1. **Install TON dependencies**

```bash
pnpm add tonweb
```

2. **Copy TON parser logic**: Create `src/decoders/ton/TonParser.ts`
   - Copy from: `/Users/fabricedautriat/Documents/GitHub/minitel/src/lib/ton/TonParser.ts`
   - Also copy: `/Users/fabricedautriat/Documents/GitHub/minitel/src/lib/ton/constants.ts`

3. **Create TON decoder**: `src/decoders/ton.ts`

```typescript
import { BaseDecoder } from "./base";
import { ChainId, DecodedTransaction, RawFormat } from "../types";
import TonWeb from "tonweb";
import { TonParser } from "./ton/TonParser";

export class TonDecoder extends BaseDecoder {
  constructor(chainId: ChainId) {
    super(chainId, "TON_BOC");
  }

  async decode(rawData: string): Promise<DecodedTransaction> {
    try {
      // Reference: minitel/src/lib/parseTonTx.ts
      const boc = TonWeb.boc.Cell.fromBoc(rawData);
      const cells = [];

      for (let i = 0; i < boc.length; i++) {
        const parser = new TonParser(boc[i]);
        cells.push({
          body: parser.parseTx(),
          message: boc[i].refs[0] ? new TonParser(boc[i].refs[0]).parseCommonMsgInfo() : null,
        });
      }

      // Extract key transaction details
      const firstCell = cells[0];
      const message = firstCell?.message?.header;

      return {
        chainId: this.chainId,
        senderAddress: message?.src?.nonBouncable || undefined,
        recipientAddress: message?.dest?.nonBouncable || undefined,
        amount: message?.grams?.toString() || undefined,
        mode: "transfer",
        chainSpecificData: cells,
      };
    } catch (error) {
      throw new Error(`Failed to decode TON transaction: ${error.message}`);
    }
  }

  validate(decodedData: unknown): boolean {
    return true; // Implement validation
  }
}
```

4. **Update types and registry** (similar to Solana steps)

### Reference Files

- TON Parser: `/Users/fabricedautriat/Documents/GitHub/minitel/src/lib/ton/TonParser.ts`
- TON Constants: `/Users/fabricedautriat/Documents/GitHub/minitel/src/lib/ton/constants.ts`
- Example usage: `/Users/fabricedautriat/Documents/GitHub/minitel/src/lib/parseTonTx.ts`

---

## 3. Add Substrate (Polkadot/Kusama) Support

### Current Gap

No Substrate chain support. Minitel has WebSocket-based implementation.

### Implementation Steps

1. **Install Polkadot dependencies**

```bash
pnpm add @polkadot/api @polkadot/util
```

2. **Create WebSocket client**: `src/utils/substrate/substrateWsClient.ts`
   - Copy from: `/Users/fabricedautriat/Documents/GitHub/minitel/src/lib/substrate/substrateWsClient.ts`

3. **Create Substrate decoder**: `src/decoders/substrate.ts`

```typescript
import { BaseDecoder } from "./base";
import { ChainId, DecodedTransaction, RawFormat } from "../types";
import { SubstrateWsClient } from "../utils/substrate/substrateWsClient";
import { compactToU8a, u8aConcat } from "@polkadot/util";

const chains = {
  polkadot: {
    chainName: "Polkadot",
    specName: "polkadot",
    rpcUrl: "wss://rpc.polkadot.io",
  },
  kusama: {
    chainName: "Kusama",
    specName: "kusama",
    rpcUrl: "wss://kusama-rpc.polkadot.io",
  },
};

export class SubstrateDecoder extends BaseDecoder {
  private wsClient: SubstrateWsClient | null = null;

  constructor(chainId: ChainId) {
    super(chainId, "SUBSTRATE_EXTRINSIC");
  }

  async decode(rawData: string): Promise<DecodedTransaction> {
    try {
      // Reference: minitel/src/lib/parseSubstrateTx.ts
      const chainConfig = chains[this.chainId];
      if (!chainConfig) {
        throw new Error(`Unsupported Substrate chain: ${this.chainId}`);
      }

      // Get or create WebSocket client
      if (!this.wsClient || !this.wsClient.isConnected) {
        this.wsClient = new SubstrateWsClient(chainConfig.rpcUrl);
        await this.wsClient.connect();
      }

      const decodedExtrinsic = this.wsClient.client.createType("Call", rawData);
      const prefixed = u8aConcat(compactToU8a(decodedExtrinsic.encodedLength), rawData);
      const extrinsicPayload = this.wsClient.client.createType("ExtrinsicPayload", prefixed).toHuman();

      // Extract transaction details based on extrinsic type
      const method = decodedExtrinsic.method;
      let mode: string = "transfer";
      let recipientAddress: string | undefined;
      let amount: string | undefined;

      // Parse based on pallet and method
      if (method.section === "balances" && method.method === "transfer") {
        recipientAddress = method.args[0]?.toString();
        amount = method.args[1]?.toString();
      }

      return {
        chainId: this.chainId,
        recipientAddress,
        amount,
        mode,
        chainSpecificData: {
          ...decodedExtrinsic.toHuman(),
          ...extrinsicPayload,
        },
      };
    } catch (error) {
      throw new Error(`Failed to decode Substrate transaction: ${error.message}`);
    }
  }

  async cleanup(): Promise<void> {
    if (this.wsClient) {
      await this.wsClient.disconnect();
    }
  }

  validate(decodedData: unknown): boolean {
    return true; // Implement validation
  }
}
```

### Reference Files

- WebSocket Client: `/Users/fabricedautriat/Documents/GitHub/minitel/src/lib/substrate/substrateWsClient.ts`
- Parser implementation: `/Users/fabricedautriat/Documents/GitHub/minitel/src/lib/parseSubstrateTx.ts`

---

## 4. Add Transaction Hash Validation

### Current Gap

Hash validation is planned but not implemented. Minitel has this for multiple chains.

### Implementation Steps

1. **Add hash generation to EVM decoder**: Update `src/decoders/evm.ts`

```typescript
import { keccak256, serializeTransaction } from "viem";

// Add method to EVMDecoder class:
async generateHash(rawData: string): Promise<string> {
  // Reference: minitel/src/lib/parseEthTx.ts lines 19-22
  const hex = rawData.startsWith("0x") ? rawData : `0x${rawData}`;
  const parsed = parseTransaction(hex as `0x${string}`);
  return keccak256(serializeTransaction(parsed));
}
```

2. **Add hash validation to verification**: Update `src/utils/transaction-verifier.ts`

```typescript
// In verifyTransaction method, add:
if (apiResponse.transaction.encoded?.[0]?.hash?.value) {
  const calculatedHash = await decoder.generateHash(encodedData);
  if (calculatedHash !== apiResponse.transaction.encoded[0].hash.value) {
    errors.add({
      severity: "critical",
      code: "HASH_MISMATCH",
      message: "Transaction hash does not match encoded data",
      context: {
        expected: apiResponse.transaction.encoded[0].hash.value,
        calculated: calculatedHash,
      },
    });
  }
}
```

3. **Add hash generation interface to BaseDecoder**

```typescript
// In src/decoders/base.ts
abstract generateHash?(rawData: string): Promise<string>;
```

### Reference Implementation

- Ethereum: `/Users/fabricedautriat/Documents/GitHub/minitel/src/lib/parseEthTx.ts` (hashEthTx function)
- Generic hash: `/Users/fabricedautriat/Documents/GitHub/minitel/src/routes/+page.server.ts` (lines 33-44)

---

## 6. Complete Decoder Coverage for All Chain Families

### Current Gap

The SDK needs decoder implementations for all blockchain families defined in `src/constants/chains.json`. Currently missing decoders for several families.

### Blockchain Families Status

Based on chains.json, the SDK supports these families:
- ✅ **evm** - Fully implemented (Ethereum, Polygon, BSC, etc.)
- ✅ **bitcoin** - Fully implemented 
- ✅ **cosmos** - Fully implemented
- ✅ **tron** - Fully implemented
- ✅ **solana** - Implemented (basic transfers and SPL tokens only)
- ⚠️ **algorand** - Needs implementation
- ⚠️ **aptos** - Needs implementation
- ⚠️ **starknet** - Needs implementation
- ⚠️ **ton** - Needs implementation

### Implementation Priority

Focus on implementing decoders for all chains in chains.json to ensure complete SDK coverage. This provides better support than targeting individual chains.

---

## 8. Protocol Registry Pattern

### Current Gap

Chain configurations are scattered. Minitel has a clean protocol registry.

### Implementation Steps

1. **Create protocol registry**: `src/utils/protocols.ts`

```typescript
// Inspired by minitel/src/lib/protocol.ts
export const PROTOCOLS = {
  ethereum: { name: "Ethereum", symbol: "ETH", decimals: 18 },
  solana: { name: "Solana", symbol: "SOL", decimals: 9 },
  polkadot: { name: "Polkadot", symbol: "DOT", decimals: 10 },
  // ... add all chains
} as const;

export type ProtocolId = keyof typeof PROTOCOLS;
```

2. **Use in decoders for consistent chain metadata**

---


## Testing Each Implementation

For each new decoder:

1. **Add test fixtures** in `tests/fixtures/api-responses/[chain].json`
2. **Add decoder tests** in `tests/decoders.test.ts`
3. **Add integration tests** in `tests/api-responses.test.ts`
4. **Use example transactions from** `/Users/fabricedautriat/Documents/GitHub/minitel/src/lib/examples.ts`

## Priority Order

1. ~~**Solana decoder**~~ - ✅ Implemented with basic transfer and SPL token support
2. ~~**Chain discovery methods**~~ - ✅ Implemented getSupportedChains(), isChainSupported(), getSupportedFormats()
3. **TON decoder** - Complex but valuable, good test of architecture flexibility
4. **Complete decoder coverage** - Ensure all chain families from chains.json have implementations (Algorand, Aptos, Starknet)
5. **Substrate support** - Advanced feature, requires WebSocket management
6. **Hash validation** - Security feature to verify transaction integrity

## Key Success Factors

1. **Maintain Adamik SDK patterns** - Use BaseDecoder, proper error handling
2. **Copy proven logic** - Minitel's parsers are battle-tested
3. **Add comprehensive tests** - Use Minitel's example transactions
4. **Document thoroughly** - Update CLAUDE.md with new features
5. **Keep security focus** - Validate everything, handle errors gracefully

Each implementation should take 2-4 hours with these specific references and examples.
