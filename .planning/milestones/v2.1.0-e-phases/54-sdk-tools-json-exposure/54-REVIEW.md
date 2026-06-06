---
phase: 54-sdk-tools-json-exposure
reviewed: 2026-06-02T12:00:00Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - get-shit-done/bin/lib/init.cjs
  - get-shit-done/bin/lib/commands.cjs
  - tests/init.test.cjs
  - tests/commands.test.cjs
  - tests/core.test.cjs
  - sdk/src/query/resolve-model-effort.test.ts
  - sdk/src/model-catalog.ts
  - sdk/src/query/config-query.ts
  - sdk/src/query/config-query.test.ts
  - sdk/src/handlers/init/composer.ts
  - sdk/src/handlers/init/complex.ts
  - sdk/src/golden/init-golden-normalize.ts
  - sdk/src/golden/read-only-golden-rows.ts
  - sdk/src/golden/read-only-parity.integration.test.ts
findings:
  critical: 3
  warning: 7
  info: 4
  total: 14
status: issues_found
---

# Phase 54: Code Review Report

**Reviewed:** 2026-06-02
**Depth:** standard
**Files Reviewed:** 14
**Status:** issues_found

## Summary

This phase ports 16 CJS `init.cjs` handlers to the SDK layer (`composer.ts`, `complex.ts`), exposes `*_effort` sibling fields via `resolveModel`, adds a static `runtimesWithReasoningEffort` allowlist, and validates CJS↔SDK JSON parity through new golden tests. The effort-exposure work itself is clean and correctly implemented. Three critical issues were found: a path-traversal gap in CJS `cmdInitRemoveWorkspace` that the SDK port correctly fixed but left unpatched in the CJS layer; a backlog-exclusion bug in `initManager` that makes `all_complete` permanently false when any 999.x phase exists; and a missing `deps_satisfied` guard in `is_next_to_discuss` that causes the SDK to recommend blocked phases. Seven warnings cover parity gaps between the SDK port and the CJS original.

---

## Critical Issues

### CR-01: `cmdInitRemoveWorkspace` (CJS) — no path traversal guard on workspace name

**File:** `get-shit-done/bin/lib/init.cjs:1707`
**Issue:** The `name` parameter is passed directly to `path.join(defaultBase, name)` at line 1707 without validation. A caller supplying `name = "../../etc"` would resolve outside `~/gsd-workspaces/` and probe arbitrary paths via `execGit(['status', '--porcelain'], { cwd: repoPath })` at line 1740. The SDK port at `composer.ts:1296-1301` correctly rejects such names, but the CJS layer — which is still the primary dispatch path for non-SDK callers — lacks this guard entirely.

**Fix** (init.cjs, after the `if (!name)` guard at line 1703):
```javascript
// T-14-01: Reject path traversal attempts (mirrors SDK composer.ts:1296-1301)
if (name.includes('/') || name.includes('\\') || name.includes('..')) {
  error(`Invalid workspace name: ${name} (path separators not allowed)`);
}
```

---

### CR-02: `initManager` (SDK) — `all_complete` and `completed_count` include 999.x backlog phases

**File:** `sdk/src/handlers/init/complex.ts:769`
**Issue:** `completedCount` is computed over the full `phases` array including backlog phases (`999.x` numbered). The `all_complete` comparison also uses the raw `phases.length`. The CJS `cmdInitManager` explicitly excludes backlog phases via the `nonBacklogPhases` filter (init.cjs:1399-1400), citing issue #2129. A project with any undiscussed `999.x` parking-lot phase will never reach `all_complete: true` even after all real work ships, and `completed_count` will under-report. This is a behavioral regression from the CJS contract.

**Fix:**
```typescript
// Replace lines 769-829 result object with:
const nonBacklogPhases = phases.filter(p => !/^999(?:\.|$)/.test(p.number as string));
const completedCount = nonBacklogPhases.filter(p => p.disk_status === 'complete').length;

// In the result:
completed_count: completedCount,
all_complete: completedCount === nonBacklogPhases.length && nonBacklogPhases.length > 0,
```

---

### CR-03: `initManager` (SDK) — `is_next_to_discuss` set without `deps_satisfied` guard

**File:** `sdk/src/handlers/init/complex.ts:694-696`
**Issue:** The SDK sets `is_next_to_discuss` based solely on disk status:
```typescript
phase.is_next_to_discuss = (status === 'empty' || status === 'no_directory');
```
The CJS sets it with a `deps_satisfied` conjunction (init.cjs:1311-1314):
```javascript
phase.is_next_to_discuss =
  (phase.disk_status === 'empty' || phase.disk_status === 'no_directory') &&
  phase.deps_satisfied;
```
The `discuss` action is later appended for any phase where `is_next_to_discuss` is true. Without the guard, the SDK recommends discussing phases whose dependencies have not completed, causing the `/gsd-manager` dashboard to suggest starting blocked work. The golden parity row for `init.manager` is absent from `READ_ONLY_JSON_PARITY_ROWS`, so this divergence is not caught by CI.

**Fix:**
```typescript
for (const phase of phases) {
  const status = phase.disk_status as string;
  phase.is_next_to_discuss =
    (status === 'empty' || status === 'no_directory') &&
    !!(phase.deps_satisfied);
}
```

---

## Warnings

### WR-01: `initManager` (SDK) — `phaseDirEntries` not filtered by current milestone

**File:** `sdk/src/handlers/init/complex.ts:572-576`
**Issue:** Phase directories are collected from all subdirs under `paths.phases` with no milestone filter. The CJS `cmdInitManager` applies `getMilestonePhaseFilter(cwd)` (init.cjs:1162) before looking up phase directories, preventing phases from prior milestones (not yet archived) from contaminating the current milestone's disk-status lookup. The SDK would wrongly match a phase number reused across milestones, reporting the old milestone's directory as the live phase.

**Fix:**
```typescript
const isDirInMilestone = await getMilestonePhaseFilter(projectDir, workstream);
phaseDirEntries = readdirSync(paths.phases, { withFileTypes: true })
  .filter(e => e.isDirectory() && isDirInMilestone(e.name))
  .map(e => e.name);
```

---

### WR-02: `initManager` (SDK) — `state_exists: true` hardcoded unconditionally

**File:** `sdk/src/handlers/init/complex.ts:835`
**Issue:** The result emits `state_exists: true` unconditionally. All other init handlers compute this field dynamically with `existsSync(paths.state)`. While the CJS guards entry with `error()` if STATE.md is missing (so `state_exists` would normally be true when execution reaches the result), callers invoking the SDK handler directly — e.g. in tests or via the query registry — may not reach the same precondition. Any consumer relying on this field would receive incorrect data if STATE.md was absent.

**Fix:**
```typescript
state_exists: existsSync(paths.state),
```

---

### WR-03: `initManager` (SDK) — recommended action commands are not runtime-aware

**File:** `sdk/src/handlers/init/complex.ts:742,753,764`
**Issue:** The `command` fields in `recommendedActions` are hardcoded as literal slash commands (`/gsd-execute-phase`, `/gsd-plan-phase`, `/gsd-discuss-phase`). The CJS `cmdInitManager` passes these through `formatGsdSlash(cmd, _slashRuntime)` which adapts them for non-Claude runtimes (e.g., Codex uses `$gsd-execute-phase` shell-variable form). On runtimes other than Claude, the emitted commands would be syntactically invalid.

**Fix:**
```typescript
import { formatGsdSlash } from '../../query/runtime-slash.js';
// ...
const runtime = detectRuntime(config as { runtime?: unknown });
// Replace hardcoded strings:
command: `${formatGsdSlash('execute-phase', runtime)} ${phase.number}`,
```

---

### WR-04: `initMilestoneOp` (SDK) — only scans root-level summaries, misses nested `plans/` subdir

**File:** `sdk/src/handlers/init/composer.ts:1086-1088,1100-1102`
**Issue:** The `hasSummary` check is `phaseFiles.some(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md')`. This only inspects the phase root directory. The CJS `listPhaseSummaryFiles` delegates to `scanPhasePlans` which additionally scans the `plans/` nested subdirectory for `SUMMARY-N-*.md` files. A phase using the extended slug layout would be reported as incomplete even when all summaries exist, causing `all_phases_complete: false` to fire incorrectly.

**Fix:** Use the `listPhasePlanAndSummaryCounts` helper already present in `complex.ts`:
```typescript
// For the ROADMAP-driven path (lines 1086-1088):
const { summaries } = listPhasePlanAndSummaryCounts(join(phasesDir, dirName));
const hasSummary = summaries.length > 0;
```

---

### WR-05: `initExecutePhase` and `initPlanPhase` (SDK) — `--validate` flag not handled

**File:** `sdk/src/handlers/init/composer.ts:429,524`
**Issue:** The code comments note that the CJS router parses `['validate', 'tdd']` flags, but the SDK port only extracts `--tdd`. The `--validate` path in the CJS handlers (init.cjs:256-276, 443-457) injects `state_validation_ran: true` and `state_warnings: string[]` into the result. Callers passing `--validate` to the SDK dispatch silently receive a result without these fields, breaking any workflow relying on drift detection.

**Fix:**
```typescript
const validateFlag = args.includes('--validate');
// After building the base result:
if (validateFlag) {
  try {
    const stateContent = readFileSync(join(planningDir, 'STATE.md'), 'utf-8');
    result.state_validation_ran = true;
    const warnings: string[] = [];
    // ... port validation logic from init.cjs:256-276
    result.state_warnings = warnings;
  } catch { /* intentionally empty */ }
}
```

---

### WR-06: `gitWorktreeInfo` and `detectNestedSubdir` duplicated verbatim in `composer.ts` and `complex.ts`

**File:** `sdk/src/handlers/init/composer.ts:105-151` and `sdk/src/handlers/init/complex.ts:85-131`
**Issue:** Both functions are copy-pasted identically into both files. Bug fixes must be applied twice. The same duplication applies to `pathExists`. This is a maintainability hazard: if the CJS behavior changes (e.g., cross-platform path normalization), the SDK divergence will not be caught until a parity test runs against the new behavior.

**Fix:** Extract to a shared module `sdk/src/handlers/init/git-helpers.ts` and import from both files.

---

### WR-07: `initManager` (SDK) — section boundary regex less precise than CJS (decimal phase headings)

**File:** `sdk/src/handlers/init/complex.ts:592`
**Issue:** The section boundary regex is `/\n#{2,4}\s+Phase\s+\d/i`. The CJS uses `/\n#{2,4}\s+Phase\s+\d[\d.]*/i` which also matches decimal phase headings (issue #3691 fix). With the SDK regex, a section for `Phase 2` could bleed into adjacent content from `Phase 2.1` if the heading is not terminated before the next match.

**Fix:**
```typescript
const nextHeader = restOfContent.match(/\n#{2,4}\s+Phase\s+\d[\d.]*/i);
```

---

## Info

### IN-01: `getModelAlias` and `getEffort` make separate `resolveModel` calls per agent

**File:** `sdk/src/handlers/init/composer.ts:43-57`, `sdk/src/handlers/init/complex.ts:52-66`
**Issue:** For each agent type, two independent async calls to `resolveModel` are made — one for the model alias, one for the effort token. In `initExecutePhase` (2 agents) this creates 4 `resolveModel` invocations where 2 would suffice. Each call internally calls `loadConfig` and reads config.json. A combined helper would halve the I/O and remove the theoretical TOCTOU window where config could change between the two reads.

**Fix:**
```typescript
async function getModelAndEffort(
  agentType: string, projectDir: string
): Promise<{ model: string; effort: string | null }> {
  const result = await resolveModel([agentType], projectDir);
  const data = result.data as Record<string, unknown>;
  return {
    model: (data.model as string) || 'sonnet',
    effort: typeof data.effort === 'string' ? data.effort : null,
  };
}
```

---

### IN-02: Golden parity table missing rows for 12 newly ported `init` handlers

**File:** `sdk/src/golden/read-only-golden-rows.ts:20-70`
**Issue:** Only `init.execute-phase` (with volatile-strip) and `init.list-workspaces` have parity rows. The remaining 12 newly ported handlers (`init.plan-phase`, `init.quick`, `init.resume`, `init.verify-work`, `init.phase-op`, `init.todos`, `init.milestone-op`, `init.map-codebase`, `init.new-milestone`, `init.new-project`, `init.progress`, `init.manager`) have no golden coverage. Behavioral divergences in any of these handlers will not be caught by CI.

**Fix:** Add parity rows for each new handler, applying volatile-strip normalizers as needed (e.g., `init.quick` emits `quick_id` and `timestamp` which vary per run).

---

### IN-03: `model-catalog.ts` — `readFileSync` at module load with no error boundary

**File:** `sdk/src/model-catalog.ts:28`
**Issue:** The catalog is loaded synchronously at module import time. If `shared/model-catalog.json` is missing (partial build, wrong working directory, package corruption), every SDK consumer throws an opaque `ENOENT` at import time with no indication of the root cause.

**Fix:**
```typescript
let _catalog: ModelCatalog;
try {
  _catalog = JSON.parse(readFileSync(fileURLToPath(CATALOG_PATH), 'utf-8'));
} catch (e) {
  throw new Error(
    `GSD: Failed to load model-catalog.json from ${String(CATALOG_PATH)}. ` +
    `Run npm run build to regenerate. Original error: ${e}`
  );
}
export const catalog = _catalog;
```

---

### IN-04: `INIT_EXECUTE_PHASE_VOLATILE_KEYS` — omits `date` without a comment explaining why

**File:** `sdk/src/golden/init-golden-normalize.ts:24-29`
**Issue:** `omitInitExecutePhaseVolatile` does not strip `date` or `timestamp`. This is correct (the handler does not emit them), but there is no comment explaining the deliberate exclusion. Compared with `INIT_QUICK_VOLATILE_KEYS` which does strip `timestamp`, a reader performing maintenance may incorrectly assume `date` was forgotten.

**Fix:** Add an inline explanatory comment:
```typescript
// Note: initExecutePhase does not emit date/timestamp (unlike initQuick),
// so those keys are intentionally absent from this volatile list.
export const INIT_EXECUTE_PHASE_VOLATILE_KEYS = [
  'project_root',
  'agents_installed',
  'missing_agents',
  'project_title',
] as const;
```

---

_Reviewed: 2026-06-02_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
