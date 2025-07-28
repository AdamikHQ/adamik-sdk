# Contributing to Adamik SDK

Thank you for your interest in contributing to the Adamik SDK! This document provides guidelines for contributing to the project.

## Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/adamik-sdk.git
   cd adamik-sdk
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Run Tests**
   ```bash
   pnpm test
   ```

4. **Build Project**
   ```bash
   pnpm run build
   ```

## Development Workflow

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write your code following the existing patterns
   - Add tests for new functionality
   - Update documentation as needed

3. **Lint and Format Code**
   ```bash
   pnpm run lint:fix
   pnpm run format
   ```

4. **Run Tests**
   ```bash
   pnpm test
   ```

5. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

6. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Code Style

- Use TypeScript for all code
- Follow the existing code style (enforced by Prettier)
- Write clear, descriptive variable and function names
- Add JSDoc comments for public APIs
- Keep functions focused and single-purpose

## Adding New Chain Support

To add support for a new blockchain:

1. **Create a Decoder**
   ```typescript
   // src/decoders/mychain.ts
   import { BaseDecoder } from './base';
   import { DecodedTransaction } from '../types';
   
   export class MyChainDecoder extends BaseDecoder {
     constructor(chainId: ChainId) {
       super(chainId, 'MY_FORMAT');
     }
   
     async decode(rawData: string): Promise<DecodedTransaction> {
       // Implement decoding logic
       // Parse the raw transaction data
       // Extract sender, recipient, amount, etc.
       return {
         chainId: this.chainId,
         mode: 'transfer',
         senderAddress: '...',
         recipientAddress: '...',
         amount: '...',
         fee: '...',
         // ... other fields
       };
     }
   }
   ```

2. **Register the Decoder**
   ```typescript
   // src/decoders/registry.ts
   import { MyChainDecoder } from './mychain';
   
   // Add to registerDefaultDecoders()
   this.registerDecoder(new MyChainDecoder('mychain'));
   ```

3. **Update Types**
   - Add chain to `ChainId` type in `src/types.ts`
   - Add format to `RawFormat` type if needed
   - Ensure chain exists in `src/constants/chains.json`

4. **Add Tests**
   - Create unit tests in `tests/decoders.test.ts`
   - Add integration tests in `tests/api-responses.test.ts`
   - Create real transaction fixtures in `tests/fixtures/api-responses/mychain.json`

5. **Follow These Guidelines**
   - Use established libraries when available (e.g., `viem` for EVM, `bitcoinjs-lib` for Bitcoin)
   - Handle errors gracefully - return warnings rather than throwing
   - Ensure decoded addresses match the chain's format
   - Extract all available transaction data (fee, memo, etc.)
   - Test with real transaction data from the Adamik API

## Testing

- Write unit tests for all new functionality
- Ensure tests pass: `pnpm test`
- Aim for high test coverage
- Use descriptive test names and organize tests logically

## Pull Request Guidelines

- Create focused PRs that address a single concern
- Include tests for new functionality
- Update documentation as needed
- Ensure CI passes
- Write clear commit messages

## Commit Message Format

Use conventional commits:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `test:` for test-related changes
- `refactor:` for code refactoring
- `chore:` for maintenance tasks

## Security Issues

If you discover a security vulnerability, please email security@adamik.io instead of opening a public issue.

## Questions?

If you have questions about contributing, please open an issue or reach out to the maintainers.