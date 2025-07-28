#!/bin/bash

# Fix enum comparisons in attack-scenarios.test.ts
sed -i '' 's/e\.code === "CRITICAL_RECIPIENT_MISMATCH"/e.code === ErrorCode.CRITICAL_RECIPIENT_MISMATCH/g' tests/attack-scenarios.test.ts
sed -i '' 's/e\.code === "CRITICAL_AMOUNT_MISMATCH"/e.code === ErrorCode.CRITICAL_AMOUNT_MISMATCH/g' tests/attack-scenarios.test.ts
sed -i '' 's/e\.code === "CRITICAL_TOKEN_MISMATCH"/e.code === ErrorCode.CRITICAL_TOKEN_MISMATCH/g' tests/attack-scenarios.test.ts
sed -i '' 's/e\.code === "CRITICAL_VALIDATOR_MISMATCH"/e.code === ErrorCode.CRITICAL_VALIDATOR_MISMATCH/g' tests/attack-scenarios.test.ts

# Fix enum comparisons in edge-cases.test.ts
sed -i '' 's/e\.code === "MODE_MISMATCH"/e.code === ErrorCode.MODE_MISMATCH/g' tests/edge-cases.test.ts
sed -i '' 's/e\.code === "RECIPIENT_MISMATCH"/e.code === ErrorCode.RECIPIENT_MISMATCH/g' tests/edge-cases.test.ts

# Fix enum comparisons in error-handling.test.ts
sed -i '' 's/e\.code === "INVALID_API_RESPONSE"/e.code === ErrorCode.INVALID_API_RESPONSE/g' tests/error-handling.test.ts
sed -i '' 's/e\.code === "INVALID_INTENT"/e.code === ErrorCode.INVALID_INTENT/g' tests/error-handling.test.ts
sed -i '' 's/e\.code === "MISSING_DECODER"/e.code === ErrorCode.MISSING_DECODER/g' tests/error-handling.test.ts
sed -i '' 's/e\.code === "CRITICAL_RECIPIENT_MISMATCH"/e.code === ErrorCode.CRITICAL_RECIPIENT_MISMATCH/g' tests/error-handling.test.ts
sed -i '' 's/e\.code === "DECODE_FAILED"/e.code === ErrorCode.DECODE_FAILED/g' tests/error-handling.test.ts

# Add ErrorCode import to test files
sed -i '' '2a\
import { ErrorCode } from "../src/schemas/errors";' tests/attack-scenarios.test.ts

sed -i '' '2a\
import { ErrorCode } from "../src/schemas/errors";' tests/edge-cases.test.ts

sed -i '' '2a\
import { ErrorCode } from "../src/schemas/errors";' tests/error-handling.test.ts

# Remove console.log statements from tests
sed -i '' '/console\.log/d' tests/api-responses.test.ts
sed -i '' '/console\.log/d' tests/chain-discovery.test.ts
sed -i '' '/console\.log/d' tests/edge-cases.test.ts

# Fix await issues in decoders.test.ts - remove async from validate methods
sed -i '' 's/async validate(/validate(/g' tests/decoders.test.ts

# Fix non-null assertion
sed -i '' 's/decoded\.tokenId!/decoded.tokenId/g' tests/decoders.test.ts

echo "ESLint fixes applied"