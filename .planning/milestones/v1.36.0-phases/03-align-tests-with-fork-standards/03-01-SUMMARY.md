---
phase: 03-align-tests-with-fork-standards
plan: 01
subsystem: tests, references
tags: [test-alignment, positive-framing, ios-scaffold, fork-standards]
dependency_graph:
  requires: []
  provides: [TEST-01, TEST-02]
  affects: [tests/ios-scaffold-safety.test.cjs, get-shit-done/references/ios-scaffold.md]
tech_stack:
  added: []
  patterns: [positive-framing, prohibition-keyword removal]
key_files:
  modified:
    - tests/ios-scaffold-safety.test.cjs
    - get-shit-done/references/ios-scaffold.md
decisions:
  - "Removed 2 prohibition-check test blocks (D-01, D-02): tests must reflect fork behavior, not upstream prohibition keywords"
  - "Replaced DO NOT USE code comment with outcome description (D-04): positive framing describes what the pattern produces"
  - "Preserved 'Never Use Package.swift' section heading and '**Prohibited pattern:**' subheading (D-05, D-06): structural labels are out of scope for this pass"
requirements_completed: [TEST-01, TEST-02]
metrics:
  duration: ~5 min
  completed: "2026-04-16T12:12:46Z"
  tasks_completed: 2
  files_modified: 2
---

# Phase 03 Plan 01: Remove Prohibition-Check Test Blocks and Fix Code Comment Summary

Removed 2 failing prohibition-style test blocks from `ios-scaffold-safety.test.cjs` and replaced the `DO NOT USE` code comment in `ios-scaffold.md` with a positive outcome label. All 6 remaining tests pass with 0 failures.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Remove 2 prohibition-check test blocks from ios-scaffold-safety.test.cjs | 6f643a0 | tests/ios-scaffold-safety.test.cjs |
| 2 | Replace DO NOT USE code comment in ios-scaffold.md | 2087cf0 | get-shit-done/references/ios-scaffold.md |

## Changes Made

### Task 1 — tests/ios-scaffold-safety.test.cjs

Removed 35 lines (2 complete test blocks):

- **Removed block 1** (`reference prohibits Package.swift as primary build system for iOS apps`): asserted that `ios-scaffold.md` contained `Package.swift` alongside prohibition keywords (`NEVER`, `never`, `prohibited`, `do not`, `Do not`, `must not`). After Phase 2's positive-framing pass, these keywords no longer appear in the file — the test was asserting upstream behavior, not fork behavior.

- **Removed block 2** (`reference prohibits .executableTarget for iOS apps`): same pattern — asserted `executableTarget` co-occurrence with prohibition keywords. Equally invalidated by the Phase 2 pass.

Test count: 8 → 6. `node --test tests/ios-scaffold-safety.test.cjs` result before: `fail 2`. After: `pass 6, fail 0`.

### Task 2 — get-shit-done/references/ios-scaffold.md

Single line changed on line 13 inside the Swift code block:

- Before: `// Package.swift — DO NOT USE for iOS apps`
- After: `// Incorrect — produces macOS CLI, not an iOS app`

The replacement describes the actual outcome of the prohibited pattern rather than issuing a bare negative imperative, consistent with the fork's positive framing standard (D-04).

Preserved unchanged per D-05 and D-06:
- Line 7: `## Critical Rule: Never Use Package.swift as the Primary Build System for iOS Apps`
- Line 11: `**Prohibited pattern:**`

## Verification Results

```
node --test tests/ios-scaffold-safety.test.cjs
tests 6 | pass 6 | fail 0
```

All acceptance criteria met:
- `grep -c "test(" tests/ios-scaffold-safety.test.cjs` → 6
- `grep "prohibitsPackageSwift|prohibitsExecutableTarget" tests/ios-scaffold-safety.test.cjs` → 0 matches
- `grep "DO NOT USE" get-shit-done/references/ios-scaffold.md` → 0 matches
- `grep "Incorrect — produces macOS CLI" get-shit-done/references/ios-scaffold.md` → 1 match
- `grep "Never Use Package.swift" get-shit-done/references/ios-scaffold.md` → 1 match (D-05 preserved)
- `grep "Prohibited pattern" get-shit-done/references/ios-scaffold.md` → 1 match (D-06 preserved)

## Decisions Made

1. Removed prohibition-check test blocks entirely rather than rewriting them — the fork standard requires tests to validate what the file instructs, not assert negative-framing keywords are present.
2. Kept `**Prohibited pattern:**` subheading (D-06 explicitly out of scope) — label identifies a pattern section, not a directive.
3. Kept `Never Use Package.swift` section heading (D-05) — section headings are structural, not prompt directives.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — changes are test file edits and a single code comment replacement inside a fenced code block. No new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

- `tests/ios-scaffold-safety.test.cjs` exists and contains 6 test() calls: FOUND
- `get-shit-done/references/ios-scaffold.md` exists with `Incorrect — produces macOS CLI` on line 13: FOUND
- Commit `6f643a0` exists: FOUND
- Commit `2087cf0` exists: FOUND
- `node --test tests/ios-scaffold-safety.test.cjs` exits 0: CONFIRMED
