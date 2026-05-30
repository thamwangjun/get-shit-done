---
phase: 50-maintenance-script-and-cross-ref-scanner
plan: 02
subsystem: scripts
tags: [maintenance, normalize, step-numbering, cross-file-refs, idempotent]
dependency_graph:
  requires: [50-01]
  provides: [scripts/normalize-step-numbers.cjs]
  affects: [agents/, get-shit-done/workflows/, commands/gsd/]
tech_stack:
  added: []
  patterns:
    - "CLI --dry-run flag (mirrors scripts/strip-prose-atrefs.cjs pattern)"
    - "Code-fence toggle (symmetric in buildRenameMap, applyRenameMap, discoverCrossFileRefs)"
    - "Per-section counter reset on ## and ### headings (mirrors step-numbering-scan.test.cjs Pattern 5)"
key_files:
  created:
    - scripts/normalize-step-numbers.cjs
  modified: []
decisions:
  - "Section-reset (## / ###) resets counter WITHOUT continue — heading lines are still scanned for STEP_DECIMAL_RE violations (discovered during Task 2 synthetic probe)"
  - "Cross-file refs whose text matches STEP_DECIMAL_RE are updated via the rename pass (symmetrical); xref counter is reserved for refs that survive the rename pass (whole-integer xrefs to renamed steps)"
  - "Skipped --file <path> ergonomic flag (Open Question 1) — cross-file discovery still requires whole-corpus scan; partial runs leak inconsistencies"
metrics:
  duration: "~45 minutes"
  completed: "2026-05-30"
  tasks_completed: 2
  files_created: 1
  commits: 2
---

# Phase 50 Plan 02: Normalize Step Numbers Script — Summary

Cross-file-aware, idempotent CLI that detects decimal/letter-suffix step labels, renumbers them to sequential whole integers per section, discovers cross-file prose references dynamically, and updates them in-place.

## What Was Built

`scripts/normalize-step-numbers.cjs` — a new Node.js CLI script (470 lines) that implements:

- **D-01 (dynamic discovery):** Cross-file prose refs discovered by grepping the entire corpus on every run — no MAP-01 manifest consumed.
- **D-02 (explicit logging):** Per-file rename counts and cross-file ref counts reported to stdout alongside file-level stats.
- **D-03 (idempotency):** `--dry-run` exits 0 with "No changes needed." on the post-Phase-49 clean corpus.
- **NORM-02 (scope sync):** `SCAN_DIRS` and `PATTERN_C_EXCLUDES` are literal copies of `tests/step-numbering-scan.test.cjs` constants.

### Design

The script follows a three-pass architecture:

1. **First pass:** Build per-file rename maps (old step label → new step label) using `STEP_DECIMAL_RE` (Pattern A/B) and `PATTERN_D_RE` (Pattern D ordered-list items). Section boundaries (`##`/`###`) reset the per-section sequential counter.
2. **Second pass:** `discoverCrossFileRefs()` scans the entire corpus with two `XREF_PATTERNS` (`/gi`) to find cross-file prose refs (`file.md step N` and `step N in file.md`). Same-file refs are excluded via dual check: basename equality AND path-suffix agreement.
3. **Third pass:** `processFile()` applies both rename maps and xref updates. Write is gated on `!DRY_RUN`.

### CLI Interface

```bash
node scripts/normalize-step-numbers.cjs           # apply changes in-place
node scripts/normalize-step-numbers.cjs --dry-run # report without writing
```

Unknown flags are rejected with non-zero exit (V5 input validation).

## Task Execution

### Task 1: Write normalize-step-numbers.cjs

Created the full script in one pass. All acceptance criteria verified:

- File exists with correct shebang, `'use strict'`, `DRY_RUN` flag parsing
- `SCAN_DIRS`, `PATTERN_C_EXCLUDES`, `STEP_DECIMAL_RE` are literal copies from `step-numbering-scan.test.cjs`
- Both XREF_PATTERNS have `/gi` flags
- `collectMarkdownFiles(dir)` duplicated inline (Phase 48 D-06 — do not extend helpers.cjs)
- `!DRY_RUN` gate on `fs.writeFileSync`
- Unknown flags exit non-zero
- Clean corpus: `--dry-run` exits 0, "No changes needed."
- Clean corpus: apply mode exits 0, no git diff against SCAN_DIRS

**Commit:** `04ee6791`

### Task 2: Synthetic dirty-corpus verification

Injected two violations into `agents/gsd-intel-updater.md`:
- Pattern A/B: `### **Step 1.5:** Synthetic injection...` (heading containing decimal step label)
- Pattern D: `1.5. **Synthetic Pattern D item**` (ordered-list decimal item)

Also injected a cross-file ref into `commands/gsd/workspace.md`:
- `See gsd-intel-updater.md step 1.5 for the synthetic flow.`

**Dry-run result (violations present):** Detected 2 files, 2 renames in gsd-intel-updater.md (both Pattern A/B and Pattern D), 1 rename in workspace.md (the cross-file ref text matched STEP_DECIMAL_RE — see deviation note below).

**Apply result:** Both patterns renumbered correctly. Scanner (`step-numbering-scan.test.cjs`) passed 632/632 after apply. Second dry-run: "No changes needed." (idempotency D-03 re-verified). Reverted: `git checkout -- agents/gsd-intel-updater.md commands/gsd/workspace.md`.

**Commit:** `655f41cf` (fix: remove `continue` after section-reset in `buildRenameMap`)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Section-reset `continue` prevented Pattern A/B detection on heading lines**
- **Found during:** Task 2 synthetic probe
- **Issue:** `buildRenameMap` had `if (/^#{2,3}\s/.test(line)) { sectionCounter = 0; continue; }` which skipped the STEP_DECIMAL_RE check on the heading line itself. The synthetic injection `### **Step 1.5:**` was not detected as a violation (only the Pattern D `1.5.` item was detected).
- **Fix:** Removed `continue` — section boundary resets counter but does not skip the rest of the line's checks.
- **Files modified:** `scripts/normalize-step-numbers.cjs`
- **Commit:** `655f41cf`

### Behavioral Notes (not bugs)

**Cross-file refs matched by STEP_DECIMAL_RE are handled via rename pass, not xref pass**

The injected cross-file ref text `See gsd-intel-updater.md step 1.5 for the synthetic flow.` contains `step 1.5` which matches `STEP_DECIMAL_RE` (case-insensitive). The rename pass in `applyRenameMap` replaced it symmetrically alongside the in-file renames. This means the xref counter showed 0 while 1 rename was attributed to workspace.md.

This is correct behavior: the rename pass is symmetric — any line containing a decimal step label anywhere in the corpus is updated, including cross-file prose. The dedicated xref discovery path (`discoverCrossFileRefs`) handles cross-file refs that would NOT be caught by the rename pass (e.g., a plain integer reference to a step in a file that has renames). D-02 transparency is maintained: all changes are logged.

## Clean-Corpus Idempotency Verified

The three empirically verified cross-file refs in `get-shit-done/workflows/execute-plan.md` (lines 143, 369, 475 — all pointing at `execute-phase.md step 7`) match against an empty rename map for `execute-phase.md` (step 7 is a whole integer, not a decimal/letter violation). The script correctly produces "No changes needed." on every clean-corpus run.

## Known Stubs

None — the script is fully wired end-to-end. NORM-02 is satisfied.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns beyond `SCAN_DIRS`, or schema changes introduced.

## Self-Check: PASSED

- `scripts/normalize-step-numbers.cjs` exists: YES
- Commits `04ee6791` and `655f41cf` exist: YES (verified via `git log`)
- Clean corpus dry-run exits 0 with "No changes needed.": YES
- `step-numbering-scan.test.cjs` passes 632/632: YES
- No modifications to SCAN_DIRS corpus: YES
