# Release Checklist for Adamik SDK

## 🚨 CRITICAL: Must Complete Before v1.0.0 Release

### 1. ~~Fix All 189 ESLint Errors~~ ✅ COMPLETED
**Status**: DONE  
**Impact**: Code quality issues resolved

### 1. Add GitHub Actions CI/CD 🔴
**Status**: BLOCKING RELEASE  
**Impact**: No automated testing or publishing

Create `.github/workflows/test.yml`:
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

Create `.github/workflows/publish.yml` for npm releases with:
- Automated version tagging
- npm publish on release
- GitHub release creation

### 2. Create .npmignore File 🔴
**Status**: BLOCKING RELEASE  
**Impact**: Publishing 3x larger package with unnecessary files

Create `.npmignore`:
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
RELEASE_CHECKLIST.md
ROADMAP.md

# Git and CI
.github/
.git/
.gitignore

# Keep only:
# dist/
# LICENSE
# README.md
# package.json
```

## Additional Pre-Release Tasks

- [x] Remove `adamik.code-workspace` file ✓
- [ ] Resolve TODO comments in `src/decoders/tron.ts`
- [ ] Update repository URL in package.json (if moving to organization)
- [x] Create SECURITY.md with vulnerability disclosure process ✓
- [ ] Add GitHub issue templates (.github/ISSUE_TEMPLATE/)
- [x] Update README.md to be more professional ✓
- [x] Create/update CONTRIBUTING.md ✓
- [ ] Update package.json scripts to ensure clean build before publish
- [ ] Test the published package locally with `npm pack`
- [ ] Ensure all dependencies are properly declared
- [ ] Review and update LICENSE file
- [ ] Tag the release commit with semantic version

## Release Process

1. Complete all checklist items above
2. Update version in package.json
3. Create GitHub release with detailed release notes
4. Run `pnpm run build` to ensure clean build
5. Run `pnpm test` to ensure all tests pass
6. Create git tag: `git tag -a v1.0.0 -m "Release v1.0.0"`
7. Push to GitHub with tags: `git push origin main --tags`
8. GitHub Actions will automatically publish to npm