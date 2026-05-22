# Phase 3: Align Tests with Fork Standards - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix the test suite so all tests pass by reflecting fork standards, not by reverting fork-standard changes. Two test files need correction: `ios-scaffold-safety.test.cjs` has prohibition-language assertions that conflict with the fork's positive framing standard; `bug-patterns-reference.test.cjs` has a `startsWith` assertion that fails because the file now uses the fork-standard XML `<task>` opener. Files modified in Phase 2 (framing passes) are out of scope for re-reverting.

</domain>

<decisions>
## Implementation Decisions

### ios-scaffold-safety.test.cjs (TEST-01, TEST-02)

- **D-01:** Remove the 2 failing prohibition test assertions — `reference prohibits Package.swift as primary build system for iOS apps` and `reference prohibits .executableTarget for iOS apps`. The positive checks (`project.yml` and `xcodegen` presence) already verify the file provides correct guidance.
- **D-02:** Rationale: test assertions that check for prohibition language (`NEVER`, `prohibited`, `do not`) directly contradict the fork's positive framing standard. The test should validate what the file tells the AI to do, not how strongly it phrases what not to do.
- **D-03:** The remaining 5 assertions in `ios-scaffold-safety.test.cjs` stay unchanged (file existence, project.yml, xcodegen, deployment target, executor reference).

### ios-scaffold.md content

- **D-04:** Replace the `// Package.swift — DO NOT USE for iOS apps` code comment with a positive equivalent — label it as the wrong pattern rather than issuing a prohibition directive. Suggested form: `// Incorrect — produces macOS CLI, not an iOS app`.
- **D-05:** The section heading `## Critical Rule: Never Use Package.swift as the Primary Build System for iOS Apps` is a valid safety heading — leave unchanged.
- **D-06:** The `**Prohibited pattern:**` subheading is out of scope for this phase (not a failing test assertion, and no REQUIREMENTS.md item targets it).

### bug-patterns-reference.test.cjs (TEST-03)

- **D-07:** Remove the `content.startsWith('# Common Bug Patterns')` assertion entirely from the `has title and intro` test. The structural tests (at least 5 categories, bold bullets per section, `---` separator) are sufficient. The startsWith check is overly specific to one file format.
- **D-08:** The `content.includes('---')` check inside the same `has title and intro` test can be retained — the file still contains `---` separators.

### Claude's Discretion

- Exact wording for the replacement code comment in ios-scaffold.md (positive label for the wrong pattern)
- Whether to restructure the `has title and intro` test description now that startsWith is removed

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Fork Standards
- `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md` — Positive framing rule; reframe pattern exception definition
- `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md` — Section 6: reframe pattern; positive framing conversion rules

### Requirements
- `.planning/REQUIREMENTS.md` — TEST-01, TEST-02, TEST-03, TEST-04 success criteria

### Prior Phase Context
- `.planning/phases/02-apply-fork-standards-to-v1-36-0-files/02-CONTEXT.md` — D-07 (SECURITY-style exception), D-08 (replacement must specify correct behavior)

### Test Files
- `tests/ios-scaffold-safety.test.cjs` — The test file being modified (assertions to remove: lines ~43-66)
- `tests/bug-patterns-reference.test.cjs` — The test file being modified (startsWith assertion to remove)

### Reference Files
- `get-shit-done/references/ios-scaffold.md` — Code comment to replace (line ~13: `// Package.swift — DO NOT USE for iOS apps`)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/helpers.cjs` — Shared test utilities; not needed for these file-content tests
- `tests/negative-framing.test.cjs` — Fork-side framing test; pattern to follow when writing test assertions that check for positive framing

### Established Patterns
- Test assertions use `assert.ok(condition, message)` and `assert.ok(fs.existsSync(...))` — same pattern applies
- Tests organized as `describe/test` blocks with Node.js built-in runner (`require('node:test')`)
- The other assertions in both test files pass and must not be disturbed

### Integration Points
- Both test files are exercised by `npm test` — run after each change to verify no regressions in the remaining assertions
- `get-shit-done/references/ios-scaffold.md` is also referenced by `gsd-executor.md` and `universal-anti-patterns.md` — those files are not being changed, only the code comment inside ios-scaffold.md

</code_context>

<specifics>
## Specific Ideas

- Replacement code comment for ios-scaffold.md: `// Incorrect — produces macOS CLI, not an iOS app`
- Both test changes are deletions (removing assertions), not rewrites — minimal change principle applies

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-align-tests-with-fork-standards*
*Context gathered: 2026-04-16*
