# GitHub Issues for Adamik SDK

## ✅ Issue #1: [BLOCKER] Remove package-lock.json - COMPLETED
**Author**: hakim-adamik  
**Body**: 
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/package-lock.json

This file should be removed + we should only use `pnpm`, not `npm`

(pnpm --> pnpm-lock.yaml)
(npm --> package-lock.json)

NOTE: please review the whole project for other references to "npm", as I think there may be in a couple different places, e.g package.json

---

## ✅ Issue #3: [BLOCKER] Node.js version alignment - COMPLETED
**Author**: hakim-adamik  
**Body**: 
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/README.md?plain=1#L82

In package.json you are using node v24, the two versions should be aligned.
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/package.json#L46

My recommendation is to actually use the lowest possible node version, because it allows more compatibility for users (they can use the SDK if they're still lagging on node 18, otherwise the SDK won't be compatible with their stack)

---

## ✅ Issue #4: [BLOCKER] Change package name to @adamik/sdk - COMPLETED
**Author**: hakim-adamik  
**Body**: 
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/README.md?plain=1#L88-L92

Our package name (the name of our lib as users will use it) should be: `@adamik/sdk`.

This is to remain consistent with the naming we chose when we pushed some first packages recently:
https://www.npmjs.com/search?q=%40adamik

You should change all references from `adamik-sdk` to `@adamik/sdk`, including the package name in package.json:
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/package.json#L2

---

## Issue #5: [IMPROVEMENT] Update "Placeholder" wording
**Author**: hakim-adamik  
**Body**: 
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/README.md?plain=1#L155

"Placeholder" could be misleading, I suggest a straightforward "❌ Not supported yet", or '"coming soon" or equivalent...

---

## Issue #6: [IMPROVEMENT] Move Features section to top of README
**Author**: hakim-adamik  
**Body**: 
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/README.md?plain=1#L267

I would move this at the top of the README, as a nice overview of the value proposition.

---

## Issue #7: [BLOCKER] Change npm references to pnpm in README
**Author**: hakim-adamik  
**Body**: 
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/README.md?plain=1#L384-L395

All references to `npm` should be changed to `pnpm`

---

## Issue #8: [IMPROVEMENT] Remove Architecture section from README
**Author**: hakim-adamik  
**Body**: 
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/README.md?plain=1#L462

This section is a bit heavy and doesn't quite belong in a README, I would remove it.

My advice is to simply replace it with inline comments in the source code directly, because navigating open-source code is often the simplest and most straightforward way for a dev to understand it.

---

## Issue #9: [IMPROVEMENT] Simplify README sections
**Author**: hakim-adamik  
**Body**: 
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/README.md?plain=1#L142

"Transaction Decoding" and "Security Verification" sections seem maybe a bit too verbose (personal taste), and also redundant with the Quick Start section.

Personally I would be happy with either just "Quick Start" with maybe a bit more details, or just the two other sections with maybe less detail, so that the README is shorter and more readable.

---

## Issue #10: [BLOCKER] Remove RELEASE_CHECKLIST.md
**Author**: hakim-adamik  
**Body**: 
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/RELEASE_CHECKLIST.md

This file is a nice memento while working before the first release 👍  but it doesn't have a purpose in an open-source codebase, I think it should be completely addressed then removed before going open-source.

---

## Issue #11: [IMPROVEMENT] Remove ROADMAP.md
**Author**: hakim-adamik  
**Body**: 
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/ROADMAP.md

Same for this file, its scope seems a bit vague to me.
The "new decoder guidelines" could be usefully merged into CONTRIBUTING.md, then I would just remove the file, just to make the doc more concise and efficient.

---

## Issue #12: [IMPROVEMENT] Merge SECURITY.md into README
**Author**: hakim-adamik  
**Body**: 
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/SECURITY.md

These instructions are also at the end of the README, I don't think we need a dedicated file for it, I suggest merging it into README then removing it.

---

## ✅ Issue #13: [BLOCKER] Change npm to pnpm in prepublishOnly script - COMPLETED
**Author**: hakim-adamik  
**Body**: 
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/package.json#L19

This should use `pnpm` instead of `npm`

---

## ✅ Issue #14: [BLOCKER] Update repository URLs in package.json - COMPLETED
**Author**: hakim-adamik  
**Body**: 
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/package.json#L36-L41

These URLs should be updated to target the org's repo.

---

## Issue #15: [IMPROVEMENT] Remove unused files
**Author**: hakim-adamik  
**Body**: 
- https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/adamik.code-workspace
- https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/audit-ci.json

Unsure what these files are for, if unused you can remove them.

---

## Issue #16: [BLOCKER] Remove unnecessary SDK functions
**Author**: hakim-adamik  
**Body**: 
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/src/index.ts#L114
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/src/index.ts#L132

I would remove these functions:
- `isChainSupported`
- `getSupportedFormats`

as they provide little additional value on top of `getSupportedChains`, which the user will always have to call first anyway.

A lean and clean SDK interface has more value IMHO.

---
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/src/index.ts#L306

Same case for the `processEncodedTransaction` function, I'm not sure I see what it does additionally to the `verify` function?
Unless there's a use-case I didn't see, I would just remove it.

---

## Issue #17: [IMPROVEMENT] Decoder format auto-detection
**Author**: hakim-adamik  
**Body**: 
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/src/index.ts#L178

**(Idea for later, could be skipped for a 1st version)**

Maybe the decoder doesn't need to also take the `RawFormat` as input, and instead it could silently try decoding all the various supported formats for the given chain: whether any of them succeeds or none of them, we can either return the successfully decoded data or fail as we currently do.

- I don't think there can ever be any ambiguity, of two different formats succeeding with _different_ decoded data
- I don't think there's any meaningful perf impact as all decoding operations should have a negligible perf impact

---

## Issue #18: [IMPROVEMENT] Map decoders by family instead of chain
**Author**: hakim-adamik  
**Body**: 
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/src/decoders/registry.ts#L13

Decoders could be mapped per family instead of per chain.

Doesn't change a lot, just less records to store and a bit less lines of code.

---

## Issue #19: [IMPROVEMENT] Store chain info in TypeScript instead of JSON
**Author**: hakim-adamik  
**Body**: 
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/src/constants/chains.json

While JSON makes sense a priori, I suggest storing chain info in TypeScript instead, for a couple reasons:
- It's a lot easier to spot typos somewhere in the data
- It's a lot easier to update it with c/p from the reference on API side which is also in TS, instead of converting to JSON each time

---

## Issue #20: [IMPROVEMENT] Simplify error system
**Author**: hakim-adamik  
**Body**: 
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/src/schemas/errors.ts

The whole error system seems a bit heavy and overkill for what we need, I would have started with something simpler.

Maybe you can just ask Claude to try and make it simpler, otherwise no pb we can keep that.

---

## Issue #21: [BLOCKER] Types & Utils organization
**Author**: hakim-adamik  
**Body**: 
Global comment on the file structure:

The code in `/types`, `/schema` and `/utils` seems a bit mixed up, with both types and functions mixed together.

Here's my recommendation:
- `/types` should contain only TS types and/or zod schemas. Ideally they can be organized in a few separate files with clean scopes, or they can just be all in a single `types.ts` file, that can replace the `/types` folder.
- `/utils` should contain only functions or classes. Same guideline applies, functions can be split in scoped files, or put all together in a same `utils.ts` file that will replace the folder.
- `index.ts` files are not necessary, I usually consider them clutter more than anything.

---

## Issue #22: [BLOCKER] Move parseAmount to utils
**Author**: hakim-adamik  
**Body**: 
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/src/decoders/base.ts#L26

This rather belongs in `/utils` as a standalone function.

---

## Issue #23: [BLOCKER] Remove DecoderWithPlaceholder class
**Author**: hakim-adamik  
**Body**: 
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/src/decoders/base.ts#L38

I don't think that additional class is required, `isPlaceholder` doesn't seem used at the moment, and I don't think it should be.
It's better to only have full, real decoder implementations, and for example just check if a chain has a decoder instance in the `DecoderRegistry` to know whether it's supported or not.

So I think you can just remove the `DecoderWithPlaceholder` class.

---

## Issue #24: [BLOCKER] Remove unused decoder.validate function
**Author**: hakim-adamik  
**Body**: 
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/src/decoders/base.ts#L21

I just noticed that the `decoder.validate` function is actually never used. Is there a plan to use it later?
Otherwise we can remove it, as the validation is actually always done by the `TransactionVerifier`.

---

## Issue #25: [BLOCKER] Refactor transaction-verifier.ts
**Author**: hakim-adamik  
**Body**: 
https://github.com/AdamikHQ/adamik-sdk/blob/bd19e38d5c3b5c0634ba30210ee6b64e93f50ed8/src/utils/transaction-verifier.ts#L8

This file is important but I find its functions not clear enough.

I suggest renaming them in a more standardized way, e.g:
- `verifyIntentAgainstAPI` --> `verifyIntentAgainstAPIData`
- `verifyDecodedAgainstIntent` --> `verifyIntentAgainstAPIDecoded`
- `verifyDecodedAgainstAPI` --> `verifyAPIDataAgainstAPIDecoded`
- `verifyModeSpecificFields` --> the function is only used once, I recommend putting its code there and removing the function
- `parseAmount` --> should not be part of this class, should be moved to `/utils` instead

---
Also, not sure about the result, but I suggest asking Claude to try and make the code more concise and reduce the number of lines in this file, as it's very verbose for what it does (a lot of it coming from error handling). Maybe won't do much improvement, but worth trying :)

---

## Issue #26: [IMPROVEMENT] API Types
**Author**: hakim-adamik  
**Body**: 
**General improvement idea but not for initial release, can be done later and separately.**

Since a while now we've been copying API types a bit across all our projects.
It would be best to instead extract from the API those types that are useful on client(s) side in a dedicated `@adamik/types` JS lib, then that lib can be used consistently across all our projects.

This is not a trivial task though, let's discuss it when appropriate.

---

# Summary

**Total Issues**: 26
**Blockers**: 13 (5 completed, 8 remaining)
**Improvements**: 13

## Completed Blockers:
- ✅ Issue #1: Remove package-lock.json
- ✅ Issue #3: Align Node.js version requirements  
- ✅ Issue #4: Change package name to @adamik/sdk
- ✅ Issue #13: Change npm to pnpm in prepublishOnly script
- ✅ Issue #14: Update repository URLs in package.json

## Remaining Blockers:
- Issue #7: Change npm references to pnpm in README
- Issue #10: Remove RELEASE_CHECKLIST.md
- Issue #16: Remove unnecessary SDK functions
- Issue #21: Reorganize types, schema, and utils structure
- Issue #22: Move parseAmount to utils
- Issue #23: Remove DecoderWithPlaceholder class
- Issue #24: Remove unused decoder.validate function
- Issue #25: Refactor transaction-verifier.ts functions