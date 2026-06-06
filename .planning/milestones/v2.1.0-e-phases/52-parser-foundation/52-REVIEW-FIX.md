---
phase: 52-parser-foundation
fixed_at: 2026-06-01T07:30:00Z
review_path: .planning/phases/52-parser-foundation/52-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 52: Code Review Fix Report

**Fixed at:** 2026-06-01T07:30:00Z
**Source review:** .planning/phases/52-parser-foundation/52-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 7
- Fixed: 7
- Skipped: 0

All four Warnings and all three Info findings were addressed. The two
`parseModelEffort` mirror implementations now share string-identical warning
text and a test-enforced allowlist-parity guard, the shared fixture covers the
previously TS-untested boundary inputs, and both parity suites assert observable
output (warning text + warn-once) rather than return value alone.

## Fixed Issues

### WR-01: TS and CJS "mirror" implementations emit divergent warning text

**Files modified:** `sdk/src/model-catalog.ts`, `get-shit-done/bin/lib/core.cjs`
**Commit:** d8e74480
**Applied fix:** Rewrote the TS warning to be string-identical to the CJS one
(`gsd: warning — unknown effort suffix "..." in "...". Allowed efforts: ...
Ignoring suffix and using model "...".`). Added a cross-reference comment. The
parity suites (WR-02) now build the expected string from a single shared
template and assert it on both sides, so future divergence fails the build.

### WR-02: Parity test compares return values only

**Files modified:** `tests/parse-model-effort-parity.test.cjs`, `sdk/src/parse-model-effort.test.ts`
**Commit:** 0b3597b8
**Applied fix:** Both suites now assert the exact shared warning text, the
warn-once-per-label dedup (with reset re-arming), the silent empty-suffix path,
and that the two `EFFORT_TOKENS` allowlists equal a canonical ordered list. The
TS suite uses `vi.spyOn(process.stderr, 'write')` with `_resetEffortWarningCacheForTests`
in `beforeEach`; the CJS suite captures `process.stderr.write`.

### WR-03: Shared fixture omits boundary inputs

**Files modified:** `tests/fixtures/parse-model-effort.json`
**Commit:** a6bf74b7
**Applied fix:** Added `a;b;high` → `{a;b, high}`, `a;b;hihg` → `{a;b, null}`,
`opus;` → `{opus, null}` (empty suffix), and `""` → `{"", null}`. Both parity
runtimes now verify these. The intended `opus;` behavior is pinned to
`{ model: 'opus', effort: null }` consistent with the WR-04 silent short-circuit.

### WR-04: Empty effort suffix triggers a confusing "unknown effort" warning

**Files modified:** `get-shit-done/bin/lib/core.cjs`, `sdk/src/model-catalog.ts`
**Commit:** d8e74480
**Applied fix:** Added `if (suffix === '') return { model: base, effort: null };`
before the allowlist check in BOTH implementations, so a trailing semicolon is
stripped silently instead of warning about an empty `""` suffix. Covered by the
new fixture case and a dedicated "silent empty-suffix" assertion in both suites.

### IN-01: Non-string return shape differs between TS type and runtime

**Files modified:** `sdk/src/model-catalog.ts`
**Commit:** d8e74480
**Applied fix:** Widened the return type to
`{ model: string | unknown; effort: string | null }` and dropped the misleading
`label as unknown as string` cast, so callers no longer rely on a false `string`
guarantee for non-string input. `tsc --noEmit` passes for the whole SDK.

### IN-02: EFFORT_TOKENS allowlist duplicated as separate literals

**Files modified:** `sdk/src/model-catalog.ts`, `get-shit-done/bin/lib/core.cjs`
**Commit:** d8e74480 (impl) + 0b3597b8 (test guard)
**Applied fix:** Rather than restructure runtime module loading across the
CJS/TS boundary (higher risk), the drift is now test-enforced: `EFFORT_TOKENS`
is exported from both modules and each parity suite asserts it equals the same
canonical ordered list. Cross-reference comments in both files document the
single-source obligation. Adding a token to one side without mirroring it fails
the suite.

### IN-03: TS module-level warn cache has no reset

**Files modified:** `sdk/src/model-catalog.ts`
**Commit:** d8e74480
**Applied fix:** Exported `_resetEffortWarningCacheForTests()` from the TS
module, mirroring the CJS export, and wired it into `beforeEach` in the TS
warning-path tests to prevent cross-test cache leakage.

## Verification

- CJS: `node --test tests/parse-model-effort.test.cjs tests/parse-model-effort-parity.test.cjs` → 36/36 pass.
- TS: `npx vitest run src/parse-model-effort.test.ts` → 16/16 pass.
- TS typecheck: `npx tsc --noEmit` → clean.
- Full root suite: `npm test` → exit 0, 0 failures.

---

_Fixed: 2026-06-01T07:30:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
