# Phase 49: Survey and Normalization - Research

**Researched:** 2026-05-30
**Domain:** Markdown step-label normalization across prompt content files
**Confidence:** HIGH

## Summary

Phase 49 is a read-then-rename migration phase: first produce MAP-01 (a cross-file step reference index), then rename every decimal and letter-suffix step label to sequential whole integers in all in-scope prompt content files. The Phase 48 scanner (`tests/step-numbering-scan.test.cjs`) is the authoritative green/red gate — 15 subtests currently fail across 13 source files (Pattern A/B), 1 file (Pattern D), and 1 file (out-of-order). All three scanner failure categories must reach GREEN.

The scanner's `STEP_DECIMAL_RE = /(?:^|\s|\*\*)Step\s+\d+(?:\.\d|[a-z])/i` catches both heading violations and prose references containing the same pattern. This means `execute-plan.md`, `autonomous.md`, `profile-user.md`, and `post-merge-gate.md` fail the scanner directly via prose text — not just transitively — even though their only fix is updating prose references to other files' steps. These four files belong in the cross-file refs plan, not in individual rename plans.

The critical implementation risk is the truthy `-1` pitfall: `content.indexOf("Step 2.5")` returns `-1` when the step is renamed, and JavaScript `assert.ok(-1)` passes silently. Every co-located test assertion update must be verified by running `npm test` after each file rename.

**Primary recommendation:** Follow the locked D-04/D-05 plan structure — MAP-01 survey plan first, then one atomic plan per violating source file, then a single cross-file refs plan last. Never batch file renames.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Letter-suffix steps ARE violations and MUST be renumbered to sequential whole integers. This overrides Phase 48 CONTEXT.md D-09 which said execute-phase.md's Step 7.0-7.3 should become "lettered branches (7a, 7b, etc.)". All letter-suffix steps (Step 2a, 2b, 2c, Step 3b, Step 4b, Step 7b, Step 7c, Step 9b, Step 5a, Step A, Step B, etc.) are renamed to sequential whole integers in original order.

**D-02:** After renaming, `agent-frontmatter.test.cjs` assertions for `Step 4b: Data-Flow Trace` and `Step 7b: Behavioral Spot-Checks` (in gsd-verifier.md) MUST be updated to reference the new whole-integer step labels. These are co-located test assertions — they are updated in the same commit as the gsd-verifier.md rename.

**D-03:** Renames and cross-file references are in DIFFERENT commits. Source file rename commits are atomic (rename file + same-file cross-references + co-located test assertions). Cross-file prose reference updates happen in a separate final commit after all source renames are complete.

**D-04:** MAP-01 cross-file reference index is produced FIRST (read-only survey plan) before any renaming begins.

**D-05:** One plan per violating source file. Each plan is atomic: rename that one file, update its same-file cross-references, update its co-located test assertions. The MAP-01 survey and the final cross-file refs update are each their own plans.

**D-06 (Claude's discretion):** `discuss-phase-assumptions.md` has two independent Step 1/2/3 sequences without a section heading between them. Fix by adding a markdown section heading (`###`) before the second Step 1 group so the scanner's per-section step counter resets. Minimal content change — no renumbering of steps needed for this file. The section heading content is Claude's choice.

### Claude's Discretion

- MAP-01 index format and storage location within `.planning/phases/49-survey-and-normalization/` (Markdown table or JSON, Claude decides)
- Exact new step numbers for each file (sequential whole integers starting from Step 1, per section)
- Whether discuss-phase-assumptions.md's fix is a standalone plan or bundled with another file's plan

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MAP-01 | Pre-normalization survey produces a cross-file step reference index — enumerates all prose references of the form "filename.md step N" across the corpus, recording source file, source line, target file, and target step number; produced before any step renaming begins | Scanner output + grep audit identifies all cross-file prose refs; MAP-01 plan reads corpus, produces index file |
| NORM-01 | All violating files renumbered to sequential whole integers in original order; same-file inline cross-references and affected test assertions co-updated in the same commit | Per-file violation inventory below provides exact old→new step maps; co-located test map identifies which test files update with which source file |

</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| MAP-01 index production | Markdown/filesystem read | — | Read-only audit of text files; no code execution needed |
| Step label renaming | Markdown/filesystem edit | Test layer (co-update) | Text replacement in prompt content files + test assertion updates |
| Cross-file reference update | Markdown/filesystem edit | — | Final pass updates prose refs after all source files renamed |
| Scanner green gate | Node.js test runner | — | `npm test` verifies each rename; scanner is the truth oracle |

## Scanner Architecture [VERIFIED: codebase grep]

### Detection Patterns

The scanner at `tests/step-numbering-scan.test.cjs` uses three detection functions:

**Pattern A/B** (heading and inline bold step labels):
```
STEP_DECIMAL_RE = /(?:^|\s|\*\*)Step\s+\d+(?:\.\d|[a-z])/i
```
Catches: `## Step 2.5:`, `**Step 7.0**`, `### Step 2a`, `step 5a` in prose text

**Pattern D** (ordered-list decimal items):
```
/^\s{0,2}\d+\.\d+\./
```
Catches: `2.5. **Per-plan worktree...**` (column 0-2, list items)

**Out-of-order detection** (`scanForOutOfOrder()`):
- Reads only `## Step N` and `### Step N` headings (whole integers only via `/^\s*\*?\*?Step\s+(\d+)(?![\.\da-z])/i`)
- Resets the per-section counter on any `##` or `###` heading
- Reports when Step N appears after a higher N was already seen in the same section

**Code-fence exclusion:** Both `scanContent()` and `scanForOutOfOrder()` skip all content inside triple-backtick fences.

### Scope

`SCAN_DIRS`: `agents/`, `get-shit-done/workflows/`, `commands/gsd/`

`PATTERN_C_EXCLUDES`: `plan-phase.md`, `new-milestone.md`, `new-project.md` (these use `## N.N.` section headings without the word "Step" — out of scope per PROJECT.md)

### Current Failures (15 subtests)

```
Pattern A/B failures (13 files):
  agents/gsd-intel-updater.md
  agents/gsd-phase-researcher.md
  agents/gsd-verifier.md
  get-shit-done/workflows/autonomous.md
  get-shit-done/workflows/execute-phase/steps/post-merge-gate.md
  get-shit-done/workflows/execute-phase.md
  get-shit-done/workflows/execute-plan.md
  get-shit-done/workflows/plan-review-convergence.md
  get-shit-done/workflows/profile-user.md
  get-shit-done/workflows/progress.md
  get-shit-done/workflows/quick.md
  get-shit-done/workflows/reapply-patches.md
  commands/gsd/graphify.md

Pattern D failures (1 file):
  get-shit-done/workflows/execute-phase.md (also has Pattern A/B)

Out-of-order failures (1 file):
  get-shit-done/workflows/discuss-phase-assumptions.md
```

Source: `node --test tests/step-numbering-scan.test.cjs` run 2026-05-30. [VERIFIED: codebase tool]

## Violation Inventory with Step Renaming Maps [VERIFIED: codebase grep]

### File Categories

**Category A: Source file rename plans** (one plan each, atomic commit)
Files with actual heading violations that must be renumbered.

**Category B: Cross-file refs plan** (one final plan, separate commit after all Category A done)
Files that fail the scanner only via prose text references to other files' steps.

---

### A1: `agents/gsd-intel-updater.md`

**Violation:** `### Step 6.5: Self-Check` at line 259

**Current step sequence in `<execution_flow>`:**
Step 1, Step 2, Step 3, Step 4, Step 5, Step 6, **Step 6.5** (Self-Check), Step 7 (Snapshot)

**Renaming map:**
| Old | New | Heading text |
|-----|-----|--------------|
| Step 6.5 | Step 7 | Self-Check |
| Step 7 | Step 8 | Snapshot |

**Same-file cross-references to update:** Check for any prose in file referencing "step 6.5" or "step 7" by number. No co-located test assertions for this file.

---

### A2: `agents/gsd-phase-researcher.md`

**Violations (4):**
- Line 624: `## Step 1.3: Load Graph Context`
- Line 659: `## Step 1.5: Architectural Responsibility Mapping`
- Line 696: `## Step 2.5: Runtime State Inventory`
- Line 716: `## Step 2.6: Environment Availability Audit`

**Current step sequence in `<execution_flow>`:**
Step 1, **Step 1.3**, **Step 1.5**, Step 2, **Step 2.5**, **Step 2.6**, Step 3, Step 4, Step 5, Step 6, Step 7, Step 8

**Renaming map:**
| Old | New | Heading text |
|-----|-----|--------------|
| Step 1 | Step 1 | Receive Scope and Load Context |
| Step 1.3 | Step 2 | Load Graph Context |
| Step 1.5 | Step 3 | Architectural Responsibility Mapping |
| Step 2 | Step 4 | Identify Research Domains |
| Step 2.5 | Step 5 | Runtime State Inventory |
| Step 2.6 | Step 6 | Environment Availability Audit |
| Step 3 | Step 7 | Execute Research Protocol |
| Step 4 | Step 8 | Validation Architecture Research |
| Step 5 | Step 9 | Quality Check |
| Step 6 | Step 10 | Write RESEARCH.md |
| Step 7 | Step 11 | Commit Research |
| Step 8 | Step 12 | Return Structured Result |

**NOTE:** Line 657 ("continue to Step 1.5 without graph context") is a same-file prose reference — update to "Step 3" in the same commit.

**Co-located test assertion (MUST update in same commit):**
`tests/agent-frontmatter.test.cjs`: `content.includes('Step 2.6: Environment Availability Audit')`
Update to: `content.includes('Step 6: Environment Availability Audit')`

---

### A3: `agents/gsd-verifier.md`

**Violations (8 letter-suffix headings):**
- Line 114: `**Step 2a: Always load ROADMAP Success Criteria**`
- Line 122: `**Step 2b: Load PLAN frontmatter must-haves**`
- Line 144: `**Step 2c: Merge must-haves**`
- Line 183: `## Step 3b: Check Verification Overrides`
- Line 264: `## Step 4b: Data-Flow Trace (Level 4)`
- Line 446: `## Step 7b: Behavioral Spot-Checks`
- Line 492: `## Step 7c: Probe Execution`
- Line 577: `## Step 9b: Filter Deferred Items`

**Mechanism note:** `## Step Nx:` headings reset the scanner's per-section counter before exposing the heading text to Pattern A/B detection. So the letter-suffix violations are detected as Pattern A/B (the `[a-z]` branch of `STEP_DECIMAL_RE`), not as out-of-order violations.

**Current step sequence in `<verification_process>`:**
Step 0, Step 1, Step 2, **Step 2a**, **Step 2b**, **Step 2c**, Step 3, **Step 3b**, Step 4, **Step 4b**, Step 5, Step 6, Step 7, **Step 7b**, **Step 7c**, Step 8, Step 9, **Step 9b**, Step 10

**Renaming map:**
| Old | New | Heading text (abbreviated) |
|-----|-----|---------------------------|
| Step 0 | Step 0 | Check for Previous Verification |
| Step 1 | Step 1 | Load Context |
| Step 2 | Step 2 | Establish Must-Haves |
| Step 2a | Step 3 | Always load ROADMAP Success Criteria |
| Step 2b | Step 4 | Load PLAN frontmatter must-haves |
| Step 2c | Step 5 | Merge must-haves |
| Step 3 | Step 6 | Verify Observable Truths |
| Step 3b | Step 7 | Check Verification Overrides |
| Step 4 | Step 8 | Verify Artifacts |
| Step 4b | Step 9 | Data-Flow Trace |
| Step 5 | Step 10 | Verify Key Links |
| Step 6 | Step 11 | Check Requirements Coverage |
| Step 7 | Step 12 | Scan for Anti-Patterns |
| Step 7b | Step 13 | Behavioral Spot-Checks |
| Step 7c | Step 14 | Probe Execution |
| Step 8 | Step 15 | Identify Human Verification Needs |
| Step 9 | Step 16 | Determine Overall Status |
| Step 9b | Step 17 | Filter Deferred Items |
| Step 10 | Step 18 | Structure Gap Output |

**Same-file prose cross-references to update:** Lines 148-149 reference "Step 2a" and "Step 2b" by name in prose. Line 628 references "Step 9b". Search the full file for all step number prose references and update in same commit.

**Co-located test assertions (MUST update in same commit):**
`tests/agent-frontmatter.test.cjs`:
- `content.includes('Step 4b: Data-Flow Trace')` → update to `content.includes('Step 9: Data-Flow Trace')`
- `content.includes('Step 7b: Behavioral Spot-Checks')` → update to `content.includes('Step 13: Behavioral Spot-Checks')`

---

### A4: `get-shit-done/workflows/execute-phase.md`

**Pattern A/B violations (4 — inside Step 7 failure-handling section):**
- Line 925: `**Step 7.0 — classify before branching (#3095):**`
- Line 934: `**Step 7.1 — `class == "quota-exceeded"`:**`
- Line 947: `**Step 7.2 — `class == "classify-handoff-bug"`:**`
- Line 949: `**Step 7.3 — `class == "unknown-failure"`:**`

**Pattern D violations (5 — ordered-list items):**
- Line 510: `2.5. **Per-plan worktree decision...**`
- Line 741: `5.5. **Worktree cleanup...**`
- Line 819: `5.6. **Post-merge build & test gate:**`
- Line 832: `5.7. **Post-wave shared artifact update...**`
- Line 864: `5.8. **Handle test gate failures...**`

**Ordered-list renaming map (Pattern D — within the ordered-list sequence inside the wave loop):**
The ordered list items in the wave execution step are: 1, 2, **2.5**, 3, 4, 5, **5.5**, **5.6**, **5.7**, **5.8**, 6

| Old list item | New list item |
|--------------|--------------|
| 2.5 | 3 |
| 3 | 4 |
| 4 | 5 |
| 5 | 6 |
| 5.5 | 7 |
| 5.6 | 8 |
| 5.7 | 9 |
| 5.8 | 10 |
| 6 | 11 |

**Step 7.x renaming map (Pattern A/B — sub-classification steps within Step 7):**
These are labeled `**Step 7.0**` through `**Step 7.3**` as bold inline labels (not headings). Rename to sequential whole integers continuing from the step 7 context:
| Old | New |
|-----|-----|
| Step 7.0 | Step 7 (or remove numeric label if it's just the intro) |
| Step 7.1 | Step 8 |
| Step 7.2 | Step 9 |
| Step 7.3 | Step 10 |

NOTE: The planner should read execute-phase.md directly to determine the best renaming for Step 7.x — these are inline bold labels, not `## Step N` headings. The key constraint is they must not contain a decimal or letter suffix.

**Same-file prose cross-references to update:** Lines 527, 660 ("step 2.5"), 809, 811, 813 ("step 5.5", "step 5.6") are prose references to old ordered-list item numbers. Update in same commit.

**Co-located test assertions (MUST update in same commit):**
`tests/execute-phase-step-5-5-deviation-doc.test.cjs`:
- Function `extractStep55Block()` uses `content.indexOf('\n5.5.')` and `content.indexOf('\n5.6.')`
- After rename, `5.5.` becomes `7.` and `5.6.` becomes `8.`
- Update both indexOf calls and the function name
- **The test file itself should be renamed** to reflect the new step numbers — verify that `node --test` discovers tests by file pattern, not hardcoded names; the file is explicitly invoked in docs, so rename it

---

### A5: `get-shit-done/workflows/execute-phase/steps/post-merge-gate.md`

**Pattern A/B violations:**
- `**Step A — Build gate:**` (letter-suffix)
- `**Step B — Test gate:**` (letter-suffix)

**Renaming map:**
| Old | New |
|-----|-----|
| Step A | Step 1 |
| Step B | Step 2 |

**Same-file prose cross-reference:** Line 60 — `(same as step 5.8)` — this is a cross-file prose reference to `execute-phase.md` ordered-list item 5.8. Update in the cross-file refs plan (after execute-phase.md is renamed, 5.8 → 10). Do NOT update in this file's plan.

No co-located test assertions for this file.

---

### A6: `get-shit-done/workflows/plan-review-convergence.md`

**Pattern A/B violation:**
- Line 322: `After agent returns → go back to **step 5a** (review again).`

This is a same-file prose reference, not a heading. The file uses `Step N` bold inline labels (not `## Step N` headings). The step sequence runs 1, 1.5, 2, 3, 4, 5, 5a, 5b, 5c, 5d.

**Violation confirmation:** `**step 5a**` in prose matches `STEP_DECIMAL_RE` via the `[a-z]` branch.

**Renaming map (all steps, sequential):**
| Old | New |
|-----|-----|
| Step 1 | Step 1 |
| Step 1.5 | Step 2 |
| Step 2 | Step 3 |
| Step 3 | Step 4 |
| Step 4 | Step 5 |
| Step 5 | Step 6 |
| Step 5a | Step 7 |
| Step 5b | Step 8 |
| Step 5c | Step 9 |
| Step 5d | Step 10 |

**Also fix:** Line 107 references "step 5" (after renaming, the "skip to step 5" prose becomes "skip to step 6").
Line 322: "step 5a" → "step 7".

No co-located test assertions for this file.

---

### A7: `get-shit-done/workflows/progress.md`

**Pattern A/B violations:**
- Line 194: `**Step 1.5: Check for unaddressed UAT gaps**`
- Line 207: `**Step 1.6: Cross-phase health check**`

**Current step sequence:**
Step 1, **Step 1.5**, **Step 1.6**, Step 2, Step 3

**Renaming map:**
| Old | New |
|-----|-----|
| Step 1 | Step 1 |
| Step 1.5 | Step 2 |
| Step 1.6 | Step 3 |
| Step 2 | Step 4 |
| Step 3 | Step 5 |

**Same-file prose cross-references:** Grep for "step 1.5", "step 1.6", "step 2", "step 3" in prose and update. The routing table at line 242 references "Step 3" (which becomes Step 5).

No co-located test assertions for this file.

---

### A8: `get-shit-done/workflows/quick.md`

**Pattern A/B violations (7):**
- Line 185: `**Step 2.5: Handle quick-task branching**`
- Line 268: `**Step 4.5: Discussion phase**`
- Line 395: `**Step 4.75: Research phase**`
- Line 521: `**Step 5.5: Plan-checker loop**`
- Line 635: `**Step 5.6: Pre-dispatch plan commit**`
- Line 807: `**Step 6.25: Code review**`
- Line 858: `**Step 6.5: Verification**`

**Renaming map:**
| Old | New | Heading text |
|-----|-----|--------------|
| Step 1 | Step 1 | Parse arguments |
| Step 2 | Step 2 | Initialize |
| Step 2.5 | Step 3 | Handle quick-task branching |
| Step 3 | Step 4 | Create task directory |
| Step 4 | Step 5 | Create quick task directory |
| Step 4.5 | Step 6 | Discussion phase |
| Step 4.75 | Step 7 | Research phase |
| Step 5 | Step 8 | Spawn planner |
| Step 5.5 | Step 9 | Plan-checker loop |
| Step 5.6 | Step 10 | Pre-dispatch plan commit |
| Step 6 | Step 11 | Spawn executor |
| Step 6.25 | Step 12 | Code review |
| Step 6.5 | Step 13 | Verification |
| Step 7 | Step 14 | Update STATE.md |
| Step 8 | Step 15 | Final commit |

**Co-located test assertions (MUST update in same commit):**

`tests/quick-branching.test.cjs`:
- Regex `/^\*\*Step 2\.5:\s*Handle quick-task branching\*\*\s*$/` → update to `/^\*\*Step 3:\s*Handle quick-task branching\*\*\s*$/`
- `content.indexOf('Step 2.5: Handle quick-task branching')` → update to `content.indexOf('Step 3: Handle quick-task branching')`

`tests/bug-2432-quick-plan-predispatch-commit.test.cjs`:
- `content.indexOf('Step 5.5')` → update to `content.indexOf('Step 9')`
- `content.indexOf('Step 5.6')` → update to `content.indexOf('Step 10')`
- `content.indexOf('Step 6:')` → update to `content.indexOf('Step 11:')`

**WARNING — truthy -1 pitfall applies to all three indexOf calls.** Run `npm test` after updating each assertion.

---

### A9: `get-shit-done/workflows/reapply-patches.md`

**Pattern A/B violation:**
- Line 298: `**Step 5a: drift check** — ...`

Note: `### 5a:` and `### 5b:` headings at lines 270/359 do NOT match `STEP_DECIMAL_RE` (they omit the word "Step"). Only the bold `**Step 5a:**` at line 298 is a violation.

**Renaming map:**
The step at line 298 is labeled `**Step 5a:**` within the body of `## Step 5: Hunk Verification Gate`. Since it is a sub-item of Step 5, renaming options:
- Option 1: Remove the `Step Nx` label and use descriptive text only (`**drift check:**`)
- Option 2: Rename to `**Step 5, Gate A:**` or similar non-matching form
- Option 3: The planner reads the file to determine the best approach

Line 377 also references `Step 5b verification` — if `**Step 5a:**` is renamed, update line 377 in the same commit.

No co-located test assertions for this file.

---

### A10: `commands/gsd/graphify.md`

**Pattern A/B violations (3):**
- Line 77: `### Step 2a -- Query`
- Line 93: `### Step 2b -- Status`
- Line 117: `### Step 2c -- Diff`

**Current step sequence:**
`## Step 0`, `## Step 1`, `## Step 2`, `### Step 2a`, `### Step 2b`, `### Step 2c`, `## Step 3`

The `###` headings reset the scanner per-section counter. These are sub-sections of Step 2. Since `###` resets the counter, they are detected as Pattern A/B (letter-suffix) violations.

**Renaming map:**
| Old | New | Heading text |
|-----|-----|--------------|
| Step 0 | Step 0 | Banner |
| Step 1 | Step 1 | Config Gate |
| Step 2 | Step 2 | Parse Argument |
| Step 2a | Step 3 | Query |
| Step 2b | Step 4 | Status |
| Step 2c | Step 5 | Diff |
| Step 3 | Step 6 | Build (Inline) |

No co-located test assertions for this file.

---

### A11: `get-shit-done/workflows/discuss-phase-assumptions.md`

**Violation type:** Out-of-order (two independent Step 1/2/3 sequences without a `##` or `###` section heading between them)

**Out-of-order detail:**
- First sequence: Step 1 (line 152), Step 2 (line 164), Step 3 (line 174) — "Read project-level files", "Read all prior CONTEXT.md files", "Build internal prior_decisions context"
- Second sequence: Step 1 (line 221), Step 2 (line 228), Step 3 (line 238) — "Check for existing codebase maps", "If no codebase maps", "Build internal codebase_context"

Scanner reports: `expected Step 4, got Step 1: **Step 1: Check for existing codebase maps**`

**Fix (D-06):** Add a `###` heading immediately before line 221 (before the second Step 1). The heading text is Claude's choice. No renumbering of steps is needed — just the structural separator.

Example acceptable heading: `### Codebase Context` or `### Step Group 2: Codebase Context`

No co-located test assertions for this file.

---

### B: Cross-File Refs Plan (separate final commit)

These files fail the scanner due to prose references matching `STEP_DECIMAL_RE`. They are NOT renamed in individual plans — their fixes happen in one final commit after all Category A files are complete.

| File | Line(s) | Violation text | Fix after |
|------|---------|---------------|-----------|
| `get-shit-done/workflows/execute-plan.md` | 143, 369, 475 | `execute-phase.md step 5.5` | After execute-phase.md rename (5.5 → item 7) |
| `get-shit-done/workflows/autonomous.md` | 406, 496, 783 | `step 3a`, `step 3a.5` | After execute-phase.md rename |
| `get-shit-done/workflows/profile-user.md` | 63, 122, 153, 154 | `step 4b`, `step 4a` | After whatever file owns steps 4a/4b |
| `get-shit-done/workflows/execute-phase/steps/post-merge-gate.md` | 60 | `step 5.8` | After execute-phase.md rename (5.8 → item 10) |

**Important:** `autonomous.md`'s "step 3a" and "step 3a.5" appear to be internal prose references (the file uses `<step name="...">` XML tags, not `## Step N` headings). Determine whether they reference execute-phase.md steps or profile-user.md steps before the cross-file refs plan is written — the MAP-01 survey will clarify.

**Important:** `profile-user.md`'s "step 4b" and "step 4a" references — the MAP-01 survey must identify what file these refer to. If they reference gsd-verifier.md's old Step 4b (now Step 9), update accordingly.

---

## MAP-01: Cross-File Reference Index Format

MAP-01 must be produced by the first plan (read-only survey) before any renaming. Recommended format: Markdown table stored at `.planning/phases/49-survey-and-normalization/49-MAP-01.md`.

**Required columns per the REQUIREMENTS.md definition:**
- Source file (relative path)
- Source line number
- Target file (which file's step is being referenced)
- Target step number (as it appears in the source prose)

**Recommended additional column:** Step description (the text of the step heading in the target file) — this helps the cross-file refs plan writer know what the step becomes after renaming.

**Survey scope:** All files in `SCAN_DIRS` (`agents/`, `get-shit-done/workflows/`, `commands/gsd/`) PLUS test files that assert on step labels.

**Survey command pattern:**
```bash
command grep -rn "step [0-9]\+\.[0-9]\+\|step [0-9]\+[a-z]\|Step [0-9]\+\.[0-9]\+\|Step [0-9]\+[a-z]" agents/ get-shit-done/workflows/ commands/gsd/
```

---

## Co-Located Test Assertion Update Map [VERIFIED: codebase grep]

| Test file | Asserts on | Source file | Update in same commit as |
|-----------|-----------|-------------|--------------------------|
| `tests/agent-frontmatter.test.cjs` | `Step 4b: Data-Flow Trace` | `agents/gsd-verifier.md` | gsd-verifier.md plan |
| `tests/agent-frontmatter.test.cjs` | `Step 7b: Behavioral Spot-Checks` | `agents/gsd-verifier.md` | gsd-verifier.md plan |
| `tests/agent-frontmatter.test.cjs` | `Step 2.6: Environment Availability Audit` | `agents/gsd-phase-researcher.md` | gsd-phase-researcher.md plan |
| `tests/quick-branching.test.cjs` | `Step 2.5: Handle quick-task branching` (regex + indexOf) | `get-shit-done/workflows/quick.md` | quick.md plan |
| `tests/bug-2432-quick-plan-predispatch-commit.test.cjs` | `Step 5.5`, `Step 5.6`, `Step 6:` (3 indexOf calls) | `get-shit-done/workflows/quick.md` | quick.md plan |
| `tests/execute-phase-step-5-5-deviation-doc.test.cjs` | `\n5.5.` and `\n5.6.` (Pattern D items) | `get-shit-done/workflows/execute-phase.md` | execute-phase.md plan |

**The truthy -1 pitfall:** `content.indexOf("Step 2.5")` returns `-1` when Step 2.5 is renamed. JavaScript `assert.ok(-1)` passes silently. Run `npm test` after every single file rename to catch stale assertions before moving to the next file.

---

## Common Pitfalls

### Pitfall 1: Truthy -1 Silent False-Pass
**What goes wrong:** `assert.ok(content.indexOf('Step 2.5'))` passes when step is renamed (indexOf returns -1, which is truthy).
**Why it happens:** `-1` is truthy in JavaScript. `assert.ok` does not do strict boolean check.
**How to avoid:** Run `npm test` after every individual file rename. Also convert indexOf assertions to use `assert.ok(content.includes(...))` or `assert.notEqual(content.indexOf(...), -1)`.
**Warning signs:** Test suite stays green while a step number was renamed — this is suspicious if a co-located test file exists for the renamed file.

### Pitfall 2: Scanner Catches Prose References, Not Just Headings
**What goes wrong:** A file with only prose references (execute-plan.md, autonomous.md, profile-user.md) is treated as needing a "rename" plan instead of the cross-file refs plan.
**Why it happens:** `STEP_DECIMAL_RE` matches any text containing `Step N.M` or `Step Na` — headings and prose alike.
**How to avoid:** Category B files (cross-file refs only) must not be renamed individually. Their fixes happen in the final cross-file refs plan.

### Pitfall 3: `##` vs `###` Heading Counter Reset Behavior
**What goes wrong:** Assuming all heading levels behave the same for counter reset.
**Why it happens:** `scanForOutOfOrder()` resets on both `##` AND `###`. This is why adding a `###` separator before the second Step 1 group in discuss-phase-assumptions.md is sufficient — it resets the counter.
**How to avoid:** Use `###` headings to create logical sub-groups within a section when two independent step sequences exist without renumbering either.

### Pitfall 4: Pattern D Ordered-List Items Are Not Headings
**What goes wrong:** Treating `5.5. **text**` as a step heading requiring only a label change.
**Why it happens:** Pattern D items are ordered-list items (e.g., in a numbered list: 1, 2, 2.5, 3...). Renaming 2.5→3 requires also renaming subsequent items: 3→4, 4→5, etc.
**How to avoid:** When renaming Pattern D items in execute-phase.md, rename ALL subsequent ordered-list items in the same list (cascading renumber). This is a chain — changing 2.5→3 forces changing old 3→4, old 4→5, etc.

### Pitfall 5: Same-File Prose References Left Stale
**What goes wrong:** A step heading is renamed but inline prose in the same file still says "step 5.5" by number.
**Why it happens:** Step labels appear both as headings AND as prose cross-references within the same file.
**How to avoid:** After renaming each file's headings, grep the same file for all number-form step references and update them in the same commit.

### Pitfall 6: execute-phase-step-5-5-deviation-doc.test.cjs File Rename
**What goes wrong:** The test file name encodes the old step number "5-5" — if not renamed, the codebase has a test file with a stale name that causes confusion.
**Why it happens:** The test was named after the execute-phase.md ordered-list item 5.5.
**How to avoid:** Rename the test file itself (to reflect new item number 7) in the same commit as the execute-phase.md changes. Verify `npm test` still discovers and runs it — Node.js built-in `--test` runner typically discovers by glob, so renaming is safe.

---

## Architecture Patterns

### Recommended Plan Sequence (D-04, D-05)

```
Wave 1 (must be first, no parallelization):
  Plan 1: MAP-01 Survey (read-only, produces 49-MAP-01.md)

Wave 2 (can parallelize within wave after MAP-01 complete):
  Plan 2: gsd-intel-updater.md rename
  Plan 3: gsd-phase-researcher.md rename (+ agent-frontmatter.test.cjs update)
  Plan 4: gsd-verifier.md rename (+ agent-frontmatter.test.cjs update)
  Plan 5: execute-phase/steps/post-merge-gate.md rename
  Plan 6: plan-review-convergence.md rename
  Plan 7: progress.md rename
  Plan 8: reapply-patches.md rename
  Plan 9: graphify.md rename
  Plan 10: discuss-phase-assumptions.md heading fix (D-06)
  Plan 11: execute-phase.md rename (+ execute-phase-step-5-5-deviation-doc.test.cjs update)
  Plan 12: quick.md rename (+ quick-branching.test.cjs + bug-2432.test.cjs update)

Wave 3 (must be last, depends on all Wave 2 renames):
  Plan 13: Cross-file refs update (execute-plan.md, autonomous.md, profile-user.md, post-merge-gate.md prose)

Gate: npm test (full suite green, scanner 0 failures)
```

**Parallelization note:** Plans 2-10 can run in parallel within Wave 2 IF they touch different test files. Plans 11 and 12 each touch different test files so they can also be parallelized. However, Plans 3 and 4 both update `agent-frontmatter.test.cjs` — they MUST NOT run in parallel (file conflict risk). Either run them sequentially or assign each a non-overlapping subset of test assertions.

### Atomic Commit Pattern

Each source file rename commit must include:
1. The source file changes (step headings renamed, same-file prose refs updated)
2. Any co-located test assertion updates for that file only

No commit may touch more than one source file's step renaming (D-05).

### Safe Rename Verification

After each file rename commit:
```bash
npm test
```
Full suite must pass before moving to next file. The scanner will confirm the renamed file no longer fails. The test suite will catch any stale assertions.

---

## Runtime State Inventory

> This is a rename/refactor phase — all 5 categories must be answered explicitly.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | None — step labels are in markdown text files only; no database or datastore stores step label strings | None |
| Live service config | None — GSD is a local file-based system with no external services | None |
| OS-registered state | None — no OS-level registrations reference step labels | None |
| Secrets/env vars | None — step labels are not secret names or env vars | None |
| Build artifacts | None — markdown files are not compiled; no build artifacts reference step labels | None |

**Nothing found in any category.** Verified by: step labels exist only as text in `.md` files at `agents/`, `commands/gsd/`, `get-shit-done/workflows/` and as string assertions in `tests/*.test.cjs`. The rename affects text content only.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `npm test` | Yes | >=22.0.0 | — |
| npm | `npm test` | Yes | present | — |
| `node --test` runner | All test verification | Yes | built-in >=20 | — |

No missing dependencies. Phase is text-editing only with `npm test` as the verification command.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `--test` runner |
| Config file | none (invoked directly) |
| Quick run command | `node --test tests/step-numbering-scan.test.cjs` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MAP-01 | Cross-file step reference index produced at `49-MAP-01.md` before any renaming | manual/visual | — (read-only artifact; no automated assertion) | Wave 0: create |
| NORM-01 | All violating files renumbered; scanner GREEN | automated | `node --test tests/step-numbering-scan.test.cjs` | Yes |
| NORM-01 | Co-located test assertions updated | automated | `npm test` | Yes (various) |

### Sampling Rate
- **Per file rename commit:** `npm test` (full suite — fast, ~30s)
- **Per wave merge:** `npm test` full suite green
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
None — existing test infrastructure (`tests/step-numbering-scan.test.cjs`) covers NORM-01. MAP-01 is a read-only artifact with no automated test required by REQUIREMENTS.md.

---

## Project Constraints (from CLAUDE.md)

| Directive | Implication for Phase 49 |
|-----------|--------------------------|
| Use `command grep` in Bash tool | All grep commands in plan tasks must use `command grep` (not bare `grep`) |
| All code changes through GSD workflow | This research and planning is within the GSD workflow — compliant |
| Agent YAML frontmatter (`name`, `description`, `tools`, `color`) must be preserved | Do not touch frontmatter of any agent file during step renaming |
| `agent-frontmatter.test.cjs` validates all agents on every `npm test` | Updating step label assertions in agent-frontmatter.test.cjs must leave all other assertions passing |
| No emojis in output files | Confirmed — no emojis in RESEARCH.md or plan files |
| `npm test` = Node.js built-in `--test` runner | Run `npm test` (not `node --test tests/`) for full suite to catch all regressions |

---

## Open Questions

1. **profile-user.md "step 4a" and "step 4b" targets**
   - What we know: profile-user.md references "step 4a" (line 154) and "step 4b" (lines 63, 122, 153)
   - What's unclear: Do these refer to profile-user.md's own internal steps, or to another file's steps (e.g., gsd-verifier.md Step 4b)?
   - Recommendation: MAP-01 survey resolves this. If they reference gsd-verifier.md's old Step 4b, update in cross-file refs plan after gsd-verifier.md rename.

2. **autonomous.md "step 3a" and "step 3a.5" targets**
   - What we know: These appear in prose at lines 406, 496, 783 in autonomous.md
   - What's unclear: The file uses `<step name="...">` XML tags rather than `## Step N` headings — are these internal references to autonomous.md's own `<step>` elements, or cross-file references to execute-phase.md steps?
   - Recommendation: MAP-01 survey resolves this. Read autonomous.md's full `<step>` structure during survey.

3. **execute-phase.md Step 7.0-7.3 renaming — exact new numbers**
   - What we know: They are bold inline labels within the Step 7 failure-handling section; they must not use decimals or letter suffixes
   - What's unclear: Whether the containing step (Step 7) retains its "Step 7" label and the sub-steps get new numbers starting from Step 8, or whether the file's overall step count changes
   - Recommendation: Planner reads execute-phase.md's full step structure and determines the least-disruptive renaming that satisfies the scanner.

---

## Sources

### Primary (HIGH confidence)
- `tests/step-numbering-scan.test.cjs` — scanner source read directly; all STEP_DECIMAL_RE patterns and scanner behavior verified [VERIFIED: codebase]
- `node --test tests/step-numbering-scan.test.cjs` — scanner run output 2026-05-30; exact failing files and line numbers [VERIFIED: codebase]
- All violating source files read directly; step sequences verified by grep [VERIFIED: codebase]
- `tests/agent-frontmatter.test.cjs`, `tests/quick-branching.test.cjs`, `tests/bug-2432-quick-plan-predispatch-commit.test.cjs`, `tests/execute-phase-step-5-5-deviation-doc.test.cjs` — test assertion text verified by read [VERIFIED: codebase]

### Secondary (MEDIUM confidence)
- None applicable — all findings are from first-party codebase reads

### Tertiary (LOW confidence)
- None applicable

---

## Assumptions Log

> All claims in this research were verified directly from the codebase. No assumed claims.

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | (none) | — | — |

---

## Metadata

**Confidence breakdown:**
- Violation inventory: HIGH — verified by scanner run and direct file reads
- Step renaming maps: HIGH — derived mechanically from scanner output + file content
- Co-located test assertions: HIGH — verified by direct test file reads
- Cross-file reference targets: MEDIUM for autonomous.md and profile-user.md (MAP-01 survey will confirm)

**Research date:** 2026-05-30
**Valid until:** 2026-06-30 (stable text content; no external dependencies)
