# Phase 46: Regression Test Suite - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-29
**Phase:** 46-regression-test-suite
**Areas discussed:** Error handling gap (TEST-04/05), Eta delimiter choice, TEST-06 budget thresholds, Test file organization, TEST-03 target runtime and file

---

## Error Handling Gap (TEST-04 and TEST-05)

| Option | Description | Selected |
|--------|-------------|----------|
| Eta native behavior | Rely on Eta v4 throwing EtaFileResolutionError on missing files natively | ✓ (TEST-05) |
| Override eta.readFile() | Intercept missing-file errors by overriding a library method | |
| Try/catch + rethrow RangeError | Wrap eta.renderString() in try/catch; catch RangeError (stack overflow) → rethrow with descriptive message | ✓ (TEST-04) |
| Defer TEST-04 | Skip circular detection; Phase 46 ships 4 tests | |

**User's choice:** TEST-05 (missing file) works natively via EtaFileResolutionError — no wrapper needed. TEST-04 (circular): wrap `eta.renderString()` in try/catch, catch RangeError, rethrow as `Error('Circular include detected in: <path>')`.

**Notes:** User challenged the option to override a library method (`eta.readFile()`), prompting a cleaner try/catch approach. The EtaFileResolutionError finding was confirmed by testing the actual install.js Eta config — my earlier test showing silent pass-through was incorrect because it omitted `parse: { raw: '~' }` from the Eta constructor, causing the `{%~ include()` tag to not be recognized.

---

## Eta Custom Delimiters

| Option | Description | Selected |
|--------|-------------|----------|
| Keep custom `{%` / `%}` | Phase 45 decision D-02; already applied across 81 files | |
| Switch to Eta defaults `<%` / `%>` | No technical reason for custom delimiters; fewer config options | ✓ |

**User's choice:** Switch to default delimiters in Phase 46 Plan 01.

**Notes:** The Phase 45 rationale (D-02) cited avoiding collision with `{{ }}` notation — but Eta's defaults are `<%` / `%>`, which don't interact with `{{ }}` at all. `<%` appears zero times in any GSD source file. The user correctly identified that custom delimiters are superfluous configuration. This becomes Phase 46 Plan 01 (not reopening Phase 45 which is already verified). Tested: both delimiter sets throw `EtaFileResolutionError` identically on missing files.

---

## TEST-06 — Installed Agent Size Budgets

| Option | Description | Selected |
|--------|-------------|----------|
| New installed-output thresholds | Define separate budget constants for expanded agent files (e.g. gsd-planner ≤ 2500 lines) | |
| Drop TEST-06 | Source budgets in agent-size-budget.test.cjs already guard against bloat; installed sizes are intentionally larger | ✓ |
| Smoke test (assert installed > source) | Verify Eta expansion happened without defining exact limits | |

**User's choice:** Drop TEST-06.

**Notes:** After checking include counts, `gsd-planner.md` would expand from 1244 to ~2327 lines (7 includes adding ~1083 lines). All 7 agents with includes would exceed their source budgets when installed. Phase 46 ships 5 tests (TEST-01 through TEST-05).

---

## Test File Organization

| Option | Description | Selected |
|--------|-------------|----------|
| One new file: install-eta-regression.test.cjs | All 5 tests in one cohesive file | ✓ |
| Add to install-regressions.test.cjs | Co-locate with other installer regression tests | |

**User's choice:** One new file `install-eta-regression.test.cjs`.

**TEST-01 scan scope:**

| Option | Description | Selected |
|--------|-------------|----------|
| Full tree scan | Walk all installed .md files, assert zero @~/.claude/ matches | ✓ |
| Spot-check key files | Pick 3-4 representative files | |

**User's choice:** Full tree scan.

---

## TEST-03 Target Runtime and File

| Option | Description | Selected |
|--------|-------------|----------|
| Copilot runtime, gsd-executor | Test Read→read transformation inside inlined content | |
| Claude runtime, gsd-executor | Verify inlined content IS present; assert "Mandatory Initial Read" appears | ✓ |

**User's choice:** Claude runtime install to a temp dir. Assert installed `gsd-executor.md` contains `"Mandatory Initial Read"` (text from `mandatory-initial-read.md`, which gsd-executor includes).

**Notes:** User's main concern was not affecting the live `~/.claude/` installation — all tests must use `createTempDir()` and pass as `configDir`. Copilot runtime tool-name transformation testing deferred to Phase 47's full matrix sweep.

---

## Claude's Discretion

- Exact mechanism for TEST-04/05 to invoke Eta rendering path (export thin helper vs. minimal installRuntimeArtifacts call)
- Whether to add `// allow-test-rule: source-text-is-the-product` comment
- Sed vs. Node.js script for Plan 01 conversion

## Deferred Ideas

- **TEST-06 (installed agent size budgets):** Dropped entirely — source budgets are the right enforcement point.
- **Copilot runtime tool-name transformation test (original TEST-03 intent):** Deferred to Phase 47 matrix sweep.
