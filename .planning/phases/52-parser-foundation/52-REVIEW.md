---
phase: 52-parser-foundation
reviewed: 2026-06-01T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - get-shit-done/bin/lib/core.cjs
  - sdk/src/model-catalog.ts
  - sdk/src/parse-model-effort.test.ts
  - tests/fixtures/parse-model-effort.json
  - tests/parse-model-effort-parity.test.cjs
  - tests/parse-model-effort.test.cjs
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 52: Code Review Report

**Reviewed:** 2026-06-01
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Reviewed the `parseModelEffort` parser foundation: the CJS implementation in `core.cjs`, the TS mirror in `model-catalog.ts`, the shared parity fixture, and three test files. The core split/allowlist logic is sound and the shell-safety contract (no `;` leaking into resolved model strings via `resolveModelInternal`) is enforced and tested. No correctness bugs in the happy path or security vulnerabilities found.

The defects center on **parity drift** between the two "mirror" implementations and **untested edge cases** in the shared fixture. The TS file's own header comment claims it is a "Mirror of the CJS implementation," but the two have diverged in observable behavior (warning text), and the parity test is structurally incapable of catching that divergence because it only compares return values. Several boundary inputs (empty suffix, empty model, non-string parity) are exercised in CJS unit tests but absent from the shared fixture, so the TS side is never verified against them.

## Warnings

### WR-01: TS and CJS "mirror" implementations emit divergent warning text

**File:** `sdk/src/model-catalog.ts:91` and `get-shit-done/bin/lib/core.cjs:1250-1254`
**Issue:** The TS header (`model-catalog.ts:73`) states this is a "Mirror of the CJS implementation." The warning messages have diverged:
- TS: `gsd: warning — unknown effort "${suffix}" in "${label}". Effort omitted.`
- CJS: `gsd: warning — unknown effort suffix "${suffix}" in "${label}". Allowed efforts: low, medium, high, xhigh, max. Ignoring suffix and using model "${base}".`

The CJS unit test (`tests/parse-model-effort.test.cjs:74-75`) asserts the message matches `/gsd: warning —/` and contains the typo token — the TS message would pass those loose matchers, but the human-facing diagnostics differ (different wording, the TS form omits the allowlist hint and the resolved model). A "mirror" that drifts on observable output is a maintenance hazard: the next editor cannot trust the two stay in sync.
**Fix:** Make the TS message string-identical to the CJS one (or extract a single shared message builder), and add a parity assertion on warning text — not just return value. Minimum: align the TS template literal with the CJS wording.

### WR-02: Parity test compares return values only — warning-path and ordering divergence is invisible

**File:** `tests/parse-model-effort-parity.test.cjs:14-21`, `sdk/src/parse-model-effort.test.ts:20-23`
**Issue:** Both "parity" suites only assert `parseModelEffort(input)` deep-equals `{ model, effort }`. They never compare the two implementations against each other, never assert on warning emission, and never assert the one-time-per-label dedup behavior. So the two files are not actually tested for parity — they are independently tested against the same fixture for the return value alone. WR-01's divergence sailed through precisely because of this gap. The suite name ("TS/CJS parity") overstates what is verified.
**Fix:** Add cases asserting warning text and warn-once semantics on both sides, or run both implementations in a single cross-runtime harness that diffs their full observable output (return value plus captured stderr).

### WR-03: Shared fixture omits boundary inputs that the CJS unit tests cover — TS side is never verified against them

**File:** `tests/fixtures/parse-model-effort.json:1-11`
**Issue:** The fixture has 8 cases. The CJS unit test file covers additional behaviors the TS side is never exercised against because they are absent from the shared fixture:
- Embedded/multiple semicolons: `a;b;high` → `{ model: 'a;b', effort: 'high' }` (`parse-model-effort.test.cjs:57`) and `a;b;hihg` → `{ model: 'a;b', effort: null }` (line 59).
- Non-string inputs: `null`, `undefined`, `{}` (`parse-model-effort.test.cjs:108-111`). The TS signature is typed `label: string` and casts (`label as unknown as string`), so a runtime non-string would behave differently from the typed contract — untested.
- Trailing-semicolon / empty suffix: `opus;` (idx found, suffix `''`) is in neither fixture nor unit tests; it currently warns on an empty suffix and returns `{ model: 'opus', effort: null }`.

Because `parse-model-effort.json` is the single source feeding both parity suites, every case missing from it is a TS-side coverage hole.
**Fix:** Add `a;b;high`, `a;b;hihg`, `opus;` (empty suffix), and at least an empty-string `""` case to the shared fixture so both runtimes verify them. Decide and pin the intended `opus;` behavior explicitly.

### WR-04: Empty effort suffix triggers a confusing "unknown effort" warning

**File:** `get-shit-done/bin/lib/core.cjs:1241-1257`
**Issue:** For input `'opus;'`, `idx` is found, `suffix` is `''`, and since `''` is not in `EFFORT_TOKENS`, the code emits `gsd: warning — unknown effort suffix "" in "opus;"...`. A trailing semicolon with no suffix is more plausibly an editing artifact than a typo'd effort token; warning about an empty `""` suffix is misleading. The TS mirror has the identical issue (`model-catalog.ts:88-92`).
**Fix:** Short-circuit empty suffix before the allowlist check — e.g. `if (suffix === '') return { model: base, effort: null };` — and skip the warning, or emit a distinct "trailing semicolon ignored" message. Apply the same fix to both implementations.

## Info

### IN-01: Non-string return shape differs subtly between TS type and runtime

**File:** `sdk/src/model-catalog.ts:82-83`
**Issue:** `parseModelEffort` is typed to return `{ model: string; effort: string | null }`, but the non-string guard returns the original non-string value cast as `string` (`label as unknown as string`). The runtime value can be `null`/`undefined`/object while the type claims `string`. The CJS version has no such type contract, so callers porting between them may rely on the (false) TS guarantee.
**Fix:** Either narrow the public type to `{ model: string | unknown; effort: string | null }` or coerce/normalize non-string input to a defined shape. At minimum, document that the type is best-effort for non-string input.

### IN-02: EFFORT_TOKENS allowlist is duplicated across TS and CJS as separate literals

**File:** `sdk/src/model-catalog.ts:79` and `get-shit-done/bin/lib/core.cjs:1218`
**Issue:** `new Set(['low','medium','high','xhigh','max'])` is hand-copied in both files. A future effort token added to one will silently diverge from the other (same drift class as WR-01). Unlike the model catalog (loaded from shared JSON), this list is an inline literal in two places.
**Fix:** Source the allowlist from the shared catalog JSON (or a shared constants file) on both sides, consistent with how `model-catalog.json` is already the single source for profiles/agents.

### IN-03: TS module-level warn cache has no reset; cross-test leakage possible

**File:** `sdk/src/model-catalog.ts:80`
**Issue:** `_warnedEffortLabels` is a module-level `Set` with no reset export (the CJS side exports `_resetEffortWarningCacheForTests` for exactly this). Vitest module caching means a label warned in one test stays cached for later tests in the same module, which can make any future warn-assertion test order-dependent and flaky on the TS side.
**Fix:** Export a TS reset helper mirroring `_resetEffortWarningCacheForTests`, and call it in `beforeEach` for any future warning-path TS tests.

---

_Reviewed: 2026-06-01_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
