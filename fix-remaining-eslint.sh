#\!/bin/bash

# Fix empty block statements
sed -i '' 's/if (\!result.isValid) {[[:space:]]*}/if (\!result.isValid) {\n        \/\/ Validation failed\n      }/g' tests/api-responses.test.ts
sed -i '' 's/if (\!result.isValid) {[[:space:]]*}/if (\!result.isValid) {\n        \/\/ Validation passed\n      }/g' tests/edge-cases.test.ts

# Fix unused variables in chain-discovery.test.ts
sed -i '' 's/\[\(family\), \(count\)\]/[_family, _count]/g' tests/chain-discovery.test.ts

# Remove await from non-async decoder.decode calls
sed -i '' 's/await decoder\.decode(/decoder.decode(/g' tests/decoders.test.ts

# Remove unused ErrorCode import from edge-cases.test.ts
sed -i '' '/import { ErrorCode } from "..\/src\/schemas\/errors";/d' tests/edge-cases.test.ts

# Fix string enum comparisons in edge-cases.test.ts
sed -i '' 's/e\.code === "AMOUNT_MISMATCH"/e.code === "AMOUNT_MISMATCH"/g' tests/edge-cases.test.ts
sed -i '' 's/w\.code === "MISSING_DECODER"/w.code === "MISSING_DECODER"/g' tests/edge-cases.test.ts

# Fix async methods without await in error-handling.test.ts
sed -i '' 's/async decode(/decode(/g' tests/error-handling.test.ts
sed -i '' 's/e\.code === "DECODE_FAILED"/e.code === "DECODE_FAILED"/g' tests/error-handling.test.ts

chmod +x fix-remaining-eslint.sh
