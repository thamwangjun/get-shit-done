---
phase: 54-sdk-tools-json-exposure
reviewed: 2026-06-02T10:30:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - get-shit-done/bin/lib/init.cjs
  - get-shit-done/bin/lib/commands.cjs
  - sdk/src/model-catalog.ts
  - sdk/src/query/config-query.ts
  - sdk/src/handlers/init/composer.ts
  - sdk/src/handlers/init/complex.ts
  - sdk/src/golden/init-golden-normalize.ts
  - sdk/src/golden/read-only-golden-rows.ts
findings:
  critical: 2
  warning: 5
  info: 2
  total: 9
status: issues_found
---

# Phase 54: Code Review Report

**Reviewed:** 2026-06-02T10:30:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

This phase adds `*_effort` siblings to all `init` command builders (EXPOSE-01) and makes `cmdResolveModel` always emit a canonical `effort` field (EXPOSE-02). The CJS layer (`init.cjs`, `commands.cjs`) and the SDK port layer (`composer.ts`, `complex.ts`, `config-query.ts`, `model-catalog.ts`) were both modified. The effort-exposure work itself is clean and correct. The review surfaces two pre-existing security/correctness bugs that this phase's code touches, plus several CJS/SDK behavioral divergences in the `initManager` port that were introduced or exposed by this work.

---

## Critical Issues

### CR-01: `cmdInitRemoveWorkspace` in `init.cjs` — no path traversal check on workspace name

**File:** `get-shit-done/bin/lib/init.cjs:1707`
**Issue:** The `name` parameter is passed directly to `path.join(defaultBase, name)` without any validation. A caller can supply a name containing `..`, `/`, or `\` to escape `~/gsd-workspaces/` and read git status or probe arbitrary paths. The SDK port (`composer.ts:1296`) correctly rejects such names with `T-14-01` validation, but the CJS implementation that is still exercised by non-SDK dispatch lacks this guard entirely.

**Fix:**
```javascript
function cmdInitRemoveWorkspace(cwd, name, raw) {
  const homedir = process.env.HOME || require('os').homedir();
  const defaultBase = path.join(homedir, 'gsd-workspaces');

  if (!name) {
    error('workspace name required for init remove-workspace');
  }

  // T-14-01: Reject path traversal attempts (mirrors SDK composer.ts:1296)
  if (name.includes('/') || name.includes('\\') || name.includes('..')) {
    error(`Invalid workspace name: ${name} (path separators not allowed)`);
  }

  const wsPath = path.join(defaultBase, name);
  // ... rest unchanged
```

---

### CR-02: `initManager` SDK — `all_complete` and `completed_count` include backlog (999.x) phases

**File:** `sdk/src/handlers/init/complex.ts:769-829`
**Issue:** `completedCount` is computed as `phases.filter(p => p.disk_status === 'complete').length` over the full `phases` array, which includes backlog phases numbered `999.x`. The `all_complete` field then compares this count against the total phases (also including backlog), so a project with an undiscussed `999.x` parking-lot phase will never reach `all_complete: true` even when all real work is shipped. The CJS implementation explicitly excludes backlog phases via `nonBacklogPhases` (#2129).

**Fix:**
```typescript
// In initManager (complex.ts), replace:
const completedCount = phases.filter(p => p.disk_status === 'complete').length;

// With (mirrors CJS cmdInitManager lines 1398-1400):
const nonBacklogPhases = phases.filter(p => !/^999(?:\.|$)/.test(p.number as string));
const completedCount = nonBacklogPhases.filter(p => p.disk_status === 'complete').length;

// And in the result object:
all_complete: completedCount === nonBacklogPhases.length && nonBacklogPhases.length > 0,
```

---

## Warnings

### WR-01: `initManager` SDK — `phaseDirEntries` not filtered by current milestone

**File:** `sdk/src/handlers/init/complex.ts:572-576`
**Issue:** The SDK builds `phaseDirEntries` from all subdirectories under `paths.phases` with no milestone filter. The CJS `cmdInitManager` applies `isDirInMilestone = getMilestonePhaseFilter(cwd)` at line 1213 before looking up phase directories, preventing phases from prior milestones (not yet archived) from contaminating the current milestone's disk status. The SDK would wrongly match a phase number that was reused across milestones, reporting the old milestone's directory as the live phase.

**Fix:**
```typescript
// After loading phaseDirEntries, apply milestone filter:
import { getMilestonePhaseFilter } from '../../query/state.js';

const isDirInMilestone = await getMilestonePhaseFilter(projectDir, workstream);
phaseDirEntries = readdirSync(paths.phases, { withFileTypes: true })
  .filter(e => e.isDirectory() && isDirInMilestone(e.name))
  .map(e => e.name);
```

---

### WR-02: `initManager` SDK — `state_exists: true` hardcoded without checking STATE.md

**File:** `sdk/src/handlers/init/complex.ts:835`
**Issue:** The result object emits `state_exists: true` unconditionally. CJS `cmdInitManager` at line 1157 gates the handler with `error()` if STATE.md is missing, and all other init handlers compute `state_exists` dynamically. While the CJS also errors on missing STATE.md (so the field normally would be true), the hardcoded value means downstream consumers who rely on this field — or who call the SDK directly — would receive incorrect data if STATE.md was deleted mid-workflow.

**Fix:**
```typescript
state_exists: existsSync(paths.state),
```

---

### WR-03: `initManager` SDK — recommended action commands are hardcoded `/gsd-*` (not runtime-aware)

**File:** `sdk/src/handlers/init/complex.ts:742,753,764`
**Issue:** The `command` fields in `recommendedActions` are hardcoded as `/gsd-execute-phase`, `/gsd-plan-phase`, and `/gsd-discuss-phase`. The CJS `cmdInitManager` passes these through `formatGsdSlash(cmd, _slashRuntime)` which adapts them for non-Claude runtimes (e.g., Codex uses `$gsd-<cmd>` shell-variable form). Workflows running under Codex that consume the SDK `initManager` output will emit syntactically invalid commands to the user.

**Fix:**
```typescript
// Resolve runtime-aware command format; mirrors CJS cmdInitManager lines 1147/1339-1356
// Pass runtime context through or compute it from config:
const runtime = detectRuntime(config as { runtime?: unknown });
// then replace hardcoded paths:
command: formatGsdSlash('execute-phase', runtime) + ` ${phase.number}`,
```

---

### WR-04: `initMilestoneOp` SDK — only scans root-level summaries, missing nested `plans/` subdirectory

**File:** `sdk/src/handlers/init/composer.ts:1086-1088,1100-1102`
**Issue:** The `hasSummary` check uses `phaseFiles.some(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md')` which only inspects the phase root directory. The CJS `listPhaseSummaryFiles` delegates to `scanPhasePlans` (via `plan-scan.generated.cjs`) which additionally scans the `plans/` nested subdirectory for `SUMMARY-N-*.md` files. A phase whose summaries live entirely in the `plans/` subdir (using the extended slug layout) would be reported as not completed by the SDK, causing `all_phases_complete: false` when it should be true.

**Fix:** Replace the inline `.some()` check with the same `listPhasePlanAndSummaryCounts` helper already used by `initProgress` and `initManager`:
```typescript
import { listPhasePlanAndSummaryCounts } from './complex.js'; // or inline the helper

// Replace the phaseFiles.some() block:
const phaseFls = readdirSync(join(phasesDir, dirName));
const { summaries: phaseSummaries } = listPhasePlanAndSummaryCounts(join(phasesDir, dirName));
const hasSummary = phaseSummaries.length > 0;
```

---

### WR-05: `initExecutePhase` and `initPlanPhase` SDK — `--validate` flag not handled

**File:** `sdk/src/handlers/init/composer.ts:422-508,516-632`
**Issue:** The comment at line 429 explicitly notes that the CJS router parses `['validate', 'tdd']` flags, but only `--tdd` is extracted in the SDK port (`args.includes('--tdd')`). The `--validate` path in the CJS handlers (#1627) injects `state_validation_ran: true` and `state_warnings: string[]` into the result when the flag is present. Callers passing `--validate` to the SDK dispatch would silently receive a result without these fields, breaking any workflow that relies on them for drift detection.

**Fix:**
```typescript
// In initExecutePhase and initPlanPhase:
const validateFlag = args.includes('--validate');

// Then after building the base result, if validateFlag is set:
if (validateFlag) {
  try {
    const stateContent = readFileSync(join(planningDir, 'STATE.md'), 'utf-8');
    const warnings: string[] = [];
    result.state_validation_ran = true;
    // ... port the CJS validation logic from init.cjs:256-276 and 443-457
    result.state_warnings = warnings;
  } catch { /* intentionally empty */ }
}
```

---

## Info

### IN-01: `getModelAlias` and `getEffort` make separate `resolveModel` calls per agent

**File:** `sdk/src/handlers/init/composer.ts:43-57`, `sdk/src/handlers/init/complex.ts:52-66`
**Issue:** For each agent type, two independent async calls to `resolveModel` are made — one for the model alias, one for the effort token. This means for `initExecutePhase` (2 agents) there are 4 `resolveModel` calls, each internally calling `loadConfig`. The results are logically from the same slot and should always be read together. A combined helper would halve the overhead and eliminate any theoretical TOCTOU window where config could change between the two calls.

**Fix:** Introduce a combined helper:
```typescript
async function getModelAndEffort(agentType: string, projectDir: string): Promise<{ model: string; effort: string | null }> {
  const result = await resolveModel([agentType], projectDir);
  const data = result.data as Record<string, unknown>;
  return {
    model: (data.model as string) || 'sonnet',
    effort: typeof data.effort === 'string' ? data.effort : null,
  };
}
```

---

### IN-02: `initManager` SDK — section boundary regex less precise than CJS

**File:** `sdk/src/handlers/init/complex.ts:592`
**Issue:** The `nextHeader` regex is `/\n#{2,4}\s+Phase\s+\d/i` which only requires a single digit to establish a section boundary. The CJS uses `/\n#{2,4}\s+Phase\s+\d[\d.]*/i` which also matches decimal phase headings (e.g., `### Phase 02.3:`). While the SDK regex still correctly terminates sections at any phase heading (the single `\d` is sufficient), the comment in CJS at line 1193 marks this as a deliberate fix for decimal phases (#3691), and divergence here is a maintenance hazard.

**Fix:** Align with CJS:
```typescript
const nextHeader = restOfContent.match(/\n#{2,4}\s+Phase\s+\d[\d.]*/i);
```

---

_Reviewed: 2026-06-02T10:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
