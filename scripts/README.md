# Bruno Test Import Scripts

This directory contains scripts for importing test scenarios from the Adamik API's Bruno test suite.

## Philosophy

The SDK performs **independent verification** of API responses. While we import test scenarios from the API's Bruno tests, we do NOT trust their assertions. Instead:

1. We use Bruno tests for **test scenarios** (different transaction types, chains, edge cases)
2. We perform our **own decoding and verification**
3. We can **catch bugs in the API** even if the API's tests pass

## Usage

```bash
# Import Bruno tests from adamik-api
pnpm run import-bruno-tests
```

This will:
1. Read all `.bru` files from `adamik-api/src/tests/bruno/encodeTransaction`
2. Extract transaction intents and encoded responses
3. Generate test fixtures in `tests/fixtures/bruno-imported/`
4. Group fixtures by chain (ethereum.json, bitcoin.json, etc.)

## How It Works

The import process:
```
Bruno Test (.bru) → Parse → Extract Data → Generate Fixture → Save JSON
```

Example Bruno test:
```bru
body:json {
  {
    "transaction": {
      "data": {
        "mode": "transfer",
        "senderAddress": "0x123...",
        "recipientAddress": "0x456...",
        "amount": "1000"
      }
    }
  }
}

assert {
  res.body.transaction.encoded[0].raw.value: eq 0xf869...
}
```

Becomes SDK fixture:
```json
{
  "id": "ethereum-transfer",
  "name": "ethereum [transfer]",
  "chainId": "ethereum",
  "intent": {
    "mode": "transfer",
    "senderAddress": "0x123...",
    "recipientAddress": "0x456...",
    "amount": "1000"
  },
  "encodedTransaction": "0xf869...",
  "source": "bruno/encodeTransaction/evm/ethereum [transfer].bru"
}
```

## Independent Verification

The SDK test suite (`bruno-imported.test.ts`) uses these fixtures but:
- **Does NOT check against Bruno's expectations**
- **Decodes transactions independently**
- **Determines validity based on SDK's own verification logic**
- **Can detect malicious transactions that API tests might miss**

This maintains the SDK's role as an independent security layer.