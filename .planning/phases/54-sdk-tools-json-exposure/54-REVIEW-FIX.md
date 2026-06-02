---
phase: 54-sdk-tools-json-exposure
fixed_at: 2026-06-02T13:30:00Z
review_path: .planning/phases/54-sdk-tools-json-exposure/54-REVIEW.md
iteration: 1
findings_in_scope: 14
fixed: 14
skipped: 0
status: all_fixed
---

# Phase 54: Code Review Fix Report

**Fixed at:** 2026-06-02T13:30:00Z
**Source review:** .planning/phases/54-sdk-tools-json-exposure/54-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 14
- Fixed: 14
- Skipped: 0

## Fixed Issues

### CR-01: `cmdInitRemoveWorkspace` (CJS) — no path traversal guard on workspace name

**Files modified:** `get-shit-done/bin/lib/init.cjs`
**Commit:** 68a3a9c6
**Applied fix:** Added path traversal guard after the `if (!name)` check at line 1703 in `cmdInitRemoveWorkspace`. Rejects names containing `/`, `\`, or `..` with an error message, mirroring the T-14-01 guard already in `sdk/src/handlers/init/composer.ts:1296-1301`.

---

### CR-02: `initManager` (SDK) — `all_complete` and `completed_count` include 999.x backlog phases

**Files modified:** `sdk/src/handlers/init/complex.ts`
**Commit:** c31bc728
**Applied fix:** Added `nonBacklogPhases` filter (`/^999(?:\.|$)/` exclusion) before computing `completedCount`. Updated both `completed_count` and `all_complete` in the result object to use `nonBacklogPhases` instead of the raw `phases` array. Mirrors CJS `cmdInitManager` behavior (init.cjs:1399-1400, issue #2129).

---

### CR-03: `initManager` (SDK) — `is_next_to_discuss` set without `deps_satisfied` guard

**Files modified:** `sdk/src/handlers/init/complex.ts`
**Commit:** a0e66325
**Applied fix:** Added `&& !!(phase.deps_satisfied)` conjunction to the `is_next_to_discuss` assignment in the phase loop, matching the CJS guard at init.cjs:1311-1314. Prevents recommending phases for discussion when their dependencies are unsatisfied.
**Note:** requires human verification — logic condition change.

---

### WR-01: `initManager` (SDK) — `phaseDirEntries` not filtered by current milestone

**Files modified:** `sdk/src/handlers/init/complex.ts`
**Commit:** c561a825
**Applied fix:** Added `import { getMilestonePhaseFilter } from '../../query/state.js'` to complex.ts. Updated the `phaseDirEntries` collection to call `getMilestonePhaseFilter(projectDir, workstream)` and filter directory entries through it, preventing prior-milestone directories from contaminating disk-status lookups.

---

### WR-02: `initManager` (SDK) — `state_exists: true` hardcoded unconditionally

**Files modified:** `sdk/src/handlers/init/complex.ts`
**Commit:** 24438c91
**Applied fix:** Replaced `state_exists: true` with `state_exists: existsSync(paths.state)`, making the field computed dynamically. `paths.state` is already in scope from the earlier `planningPaths(projectDir, workstream)` call.

---

### WR-03: `initManager` (SDK) — recommended action commands are not runtime-aware

**Files modified:** `sdk/src/handlers/init/complex.ts`
**Commit:** 06fe3b54
**Applied fix:** Added `import { canonicalizeRuntimeName } from '../../runtime/name-policy.js'` and a local `formatGsdSlash(commandName, runtime)` helper that maps codex runtime to `$gsd-<cmd>` and all other runtimes to `/gsd-<cmd>`. Added `const runtime = detectRuntime(config)` before the `recommendedActions` loop and replaced all three hardcoded `/gsd-*` strings with `formatGsdSlash('execute-phase'|'plan-phase'|'discuss-phase', runtime)` calls.

---

### WR-04: `initMilestoneOp` (SDK) — only scans root-level summaries, misses nested `plans/` subdir

**Files modified:** `sdk/src/handlers/init/composer.ts`
**Commit:** faf4be28
**Applied fix:** Replaced the inline `readdirSync` + `hasSummary` pattern in both the ROADMAP-driven and fallback paths with a local `hasPhaseSummary(phaseDir)` helper that checks both the root directory and the nested `plans/` subdir for summary files (matching CJS `listPhaseSummaryFiles` → `scanPhasePlans` behavior).

---

### WR-05: `initExecutePhase` and `initPlanPhase` (SDK) — `--validate` flag not handled

**Files modified:** `sdk/src/handlers/init/composer.ts`
**Commit:** 6e462990
**Applied fix:** Added `const validateFlag = args.includes('--validate')` to both `initExecutePhase` and `initPlanPhase`. After the result object is built in each handler, added a `if (validateFlag)` block that reads STATE.md, sets `state_validation_ran: true`, checks for plan-count mismatch between STATE.md and disk, and sets `state_warnings: string[]`. Matches CJS init.cjs:256-276 and 443-457.

---

### WR-06: `gitWorktreeInfo` and `detectNestedSubdir` duplicated verbatim in `composer.ts` and `complex.ts`

**Files modified:** `sdk/src/handlers/init/composer.ts`, `sdk/src/handlers/init/complex.ts`, `sdk/src/handlers/init/git-helpers.ts` (new file)
**Commit:** 88ce1e86
**Applied fix:** Created `sdk/src/handlers/init/git-helpers.ts` exporting `gitWorktreeInfo` and `detectNestedSubdir`. Replaced the duplicate inline definitions in both composer.ts and complex.ts with `import { gitWorktreeInfo, detectNestedSubdir } from './git-helpers.js'`. Removed the now-unused `execSync` import from complex.ts. The `pathExists` duplication was not extracted (it's a trivial 1-line wrapper and extraction would require a more invasive refactor).

---

### WR-07: `initManager` (SDK) — section boundary regex less precise than CJS (decimal phase headings)

**Files modified:** `sdk/src/handlers/init/complex.ts`
**Commit:** bad6f2b0
**Applied fix:** Changed `/\n#{2,4}\s+Phase\s+\d/i` to `/\n#{2,4}\s+Phase\s+\d[\d.]*/i` to match decimal phase headings (e.g., `Phase 2.1`), matching the CJS regex (issue #3691 fix). Added an inline comment citing the issue number.

---

### IN-01: `getModelAlias` and `getEffort` make separate `resolveModel` calls per agent

**Files modified:** `sdk/src/handlers/init/composer.ts`, `sdk/src/handlers/init/complex.ts`
**Commit:** 6ba47b85
**Applied fix:** Added `getModelAndEffort(agentType, projectDir)` helper to both files that makes a single `resolveModel` call and returns `{ model, effort }`. Kept existing `getModelAlias`/`getEffort` wrappers (marked `@deprecated`) to avoid a large refactor, but had them delegate to `getModelAndEffort`. Updated all call sites in both files to use `getModelAndEffort` directly in their `Promise.all` blocks, reducing total `resolveModel` invocations by ~50% across all init handlers.

---

### IN-02: Golden parity table missing rows for 12 newly ported `init` handlers

**Files modified:** `sdk/src/golden/read-only-golden-rows.ts`
**Commit:** f0107ba6
**Applied fix:** Added 12 parity rows to `READ_ONLY_JSON_PARITY_ROWS` for: `init.plan-phase`, `init.quick`, `init.todos`, `init.milestone-op`, `init.verify-work`, `init.resume`, `init.progress`, `init.manager`, `init.map-codebase`, `init.phase-op`, `init.new-milestone`, and `init.new-project` (via new-milestone). Added `init.quick` to `readOnlyGoldenCanonicals()` since it uses volatile-strip normalization. Each row includes a comment explaining any normalization requirements.
**Note:** `init.quick` requires `omitInitQuickVolatile` in the integration test's volatile-strip block — the test file itself was not modified here; the row is registered for CI tracking purposes.

---

### IN-03: `model-catalog.ts` — `readFileSync` at module load with no error boundary

**Files modified:** `sdk/src/model-catalog.ts`
**Commit:** cf6e0d4c
**Applied fix:** Wrapped the synchronous `JSON.parse(readFileSync(...))` call in a try/catch that rethrows a descriptive `Error` with the catalog path and a `npm run build` hint, matching the fix suggestion exactly. The exported `catalog` const now reads from the `_catalog` intermediate variable.

---

### IN-04: `INIT_EXECUTE_PHASE_VOLATILE_KEYS` — omits `date` without a comment explaining why

**Files modified:** `sdk/src/golden/init-golden-normalize.ts`
**Commit:** 26679eb8
**Applied fix:** Added a multi-line JSDoc comment above `INIT_EXECUTE_PHASE_VOLATILE_KEYS` explaining that `initExecutePhase` intentionally does not emit `date`/`timestamp` (unlike `initQuick`), and that omitting them from the volatile list is deliberate — not an oversight.

---

_Fixed: 2026-06-02T13:30:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
