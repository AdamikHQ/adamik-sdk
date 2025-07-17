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
   npm install
   ```

3. **Run Tests**
   ```bash
   npm test
   ```

4. **Build Project**
   ```bash
   npm run build
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

3. **Format Code**
   ```bash
   npm run format
   ```

4. **Run Tests**
   ```bash
   npm test
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
   
   export class MyChainDecoder extends BaseDecoder {
     constructor(chainId: ChainId) {
       super(chainId, 'MY_FORMAT');
     }
   
     async decode(rawData: string): Promise<unknown> {
       // Implement decoding logic
     }
   
     validate(decodedData: unknown): boolean {
       // Implement validation logic
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

3. **Add Tests**
   ```typescript
   // tests/mychain.test.ts
   describe('MyChainDecoder', () => {
     // Add comprehensive tests
   });
   ```

## Testing

- Write unit tests for all new functionality
- Ensure tests pass: `npm test`
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

## Questions?

If you have questions about contributing, please open an issue or reach out to the maintainers.