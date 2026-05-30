# Step-Label Pattern Inventory

**Project:** GSD — v2.1.0-d Whole-Integer Step Numbering
**Researched:** 2026-05-30
**Scope:** `agents/*.md`, `commands/gsd/*.md`, `get-shit-done/workflows/**/*.md`

---

## Pattern Taxonomy

Four distinct step-label styles exist across the corpus. The normalization goal applies to patterns that use the literal word "Step":

| Pattern Style | Format | Examples | In Scope? |
|---------------|--------|---------|-----------|
| **A — Bold label** | `**Step N: Title**` | `**Step 2.5: Handle branching**` | YES |
| **B — H2/H3 heading with "Step"** | `## Step N: Title` / `### Step N: Title` | `## Step 1.3: Load Graph Context` | YES |
| **C — Numbered section heading** (no "Step" keyword) | `## N.N. Title` | `## 5.5. Resolve Model Profile` | Borderline — see note |
| **D — Ordered-list item** | `N.N. **bold**` | `2.5. **Per-plan worktree decision**` | YES |

**Note on Pattern C:** Files `new-project.md`, `new-milestone.md`, and `plan-phase.md` use `## N.N.` section headers with no "Step" keyword. Prose within those files refers to these sections as "step N.N" (lowercase, no label). These sections are numbered chapters, not step-label declarations. They contain decimal fractions. Whether Pattern C is in scope depends on the scanner regex. If the scanner matches `[Ss]tep [0-9]+\.[0-9]`, body-text references (e.g., "proceed to Step 5.5") will fire but the section header itself will not. This document catalogs both.

---

## Decimal Step Inventory — Files Requiring Changes

### 1. `agents/gsd-intel-updater.md`

**Pattern:** `### Step N:` heading style (Pattern B)
**Decimal violations:** 1

Complete ordered step sequence:
```
### Step 1: Orientation        (line 211)
### Step 2: Stack Detection    (line 218)
### Step 3: File Graph         (line 225)
### Step 4: API Surface        (line 236)
### Step 5: Dependencies       (line 245)
### Step 6: Architecture       (line 254)
### Step 6.5: Self-Check       (line 259)  <- DECIMAL
### Step 7: Snapshot           (line 271)
```

**Renumbering plan:** Step 6.5 becomes Step 7; current Step 7 becomes Step 8.

**Inline body-text cross-references to decimal steps:** None found.

**Cross-file references to these steps:** None found.

---

### 2. `agents/gsd-phase-researcher.md`

**Pattern:** `## Step N:` heading style (Pattern B). Note: lines 272-313 use a separate `### Step N` sequence for a sub-section (supply-chain check); these are whole integers and not affected.

**Decimal violations:** 4 label definitions + 2 inline body-text references

Complete ordered step sequence (main section, lines 591+):
```
## Step 1: Receive Scope and Load Context         (line 591)
## Step 1.3: Load Graph Context                   (line 624)  <- DECIMAL
## Step 1.5: Architectural Responsibility Mapping (line 659)  <- DECIMAL
## Step 2: Identify Research Domains              (line 686)
## Step 2.5: Runtime State Inventory              (line 696)  <- DECIMAL
## Step 2.6: Environment Availability Audit       (line 716)  <- DECIMAL
## Step 3: Execute Research Protocol              (line 778)
## Step 4: Validation Architecture Research       (line 782)
## Step 5: Quality Check                          (line 795)
## Step 6: Write RESEARCH.md                      (line 803)
## Step 7: Commit Research (optional)             (line 842)
## Step 8: Return Structured Result               (line 848)
```

**Inline body-text cross-references to decimal steps (within this file):**
- Line 657: `continue to Step 1.5 without graph context.` — references `## Step 1.5`
- Line 776: `output: "Step 2.6: SKIPPED (no external dependencies identified)"` — literal output string the agent writes; must be updated when Step 2.6 is renumbered

**Renumbering plan:**
- Step 1 stays Step 1
- Step 1.3 becomes Step 2
- Step 1.5 becomes Step 3
- Step 2 becomes Step 4
- Step 2.5 becomes Step 5
- Step 2.6 becomes Step 6
- Step 3 becomes Step 7
- Step 4 becomes Step 8
- Step 5 becomes Step 9
- Step 6 becomes Step 10
- Step 7 becomes Step 11
- Step 8 becomes Step 12

Update line 657: `continue to Step 3 without graph context.`
Update line 776: change `"Step 2.6: SKIPPED ..."` to `"Step 6: SKIPPED ..."`

**Cross-file references to these steps:** None found (agents are self-contained).

---

### 3. `get-shit-done/workflows/progress.md`

**Pattern:** `**Step N: Title**` bold label style (Pattern A)
**Decimal violations:** 2

Complete ordered step sequence:
```
**Step 1: Count plans, summaries, and issues in current phase**  (line 182)
**Step 1.5: Check for unaddressed UAT gaps**                     (line 194)  <- DECIMAL
**Step 1.6: Cross-phase health check**                           (line 207)  <- DECIMAL
**Step 2: Route based on counts**                                (line 235)
**Step 3: Check milestone status (only when phase complete)**    (line 395)
```

**Renumbering plan:**
- Step 1 stays Step 1
- Step 1.5 becomes Step 2
- Step 1.6 becomes Step 3
- Step 2 becomes Step 4
- Step 3 becomes Step 5

**Inline body-text cross-references to decimal steps (within this file):**
- Line 242: `Go to Step 3` — references current Step 2 "Route based on counts". After renumbering Step 2 becomes Step 4, so this must become `Go to Step 4`.

**Cross-file references to these steps:** None found.

---

### 4. `get-shit-done/workflows/quick.md`

**Pattern:** `**Step N: Title**` bold label style (Pattern A)
**Decimal violations:** 6

Complete ordered step sequence:
```
**Step 1: Parse arguments and get task description**           (line 30)
**Step 2: Initialize**                                         (line 125)
**Step 2.5: Handle quick-task branching**                      (line 185)  <- DECIMAL
**Step 3: Create task directory**                              (line 241)
**Step 4: Create quick task directory**                        (line 249)
**Step 4.5: Discussion phase (only when $DISCUSS_MODE)**       (line 268)  <- DECIMAL
**Step 4.75: Research phase (only when $RESEARCH_MODE)**       (line 395)  <- DECIMAL
**Step 5: Spawn planner (quick mode)**                         (line 462)
**Step 5.5: Plan-checker loop (only when $VALIDATE_MODE)**     (line 521)  <- DECIMAL
**Step 5.6: Pre-dispatch plan commit (worktree mode only)**    (line 635)  <- DECIMAL
**Step 6: Spawn executor**                                     (line 667)
**Step 6.25: Code review (auto)**                              (line 807)  <- DECIMAL
**Step 6.5: Verification (only when $VALIDATE_MODE)**          (line 858)  <- DECIMAL
**Step 7: Update STATE.md**                                    (line 907)
**Step 8: Final commit and completion**                        (line 962)
```

**Renumbering plan:**
- Step 1 stays Step 1
- Step 2 stays Step 2
- Step 2.5 becomes Step 3
- Step 3 becomes Step 4
- Step 4 becomes Step 5
- Step 4.5 becomes Step 6
- Step 4.75 becomes Step 7
- Step 5 becomes Step 8
- Step 5.5 becomes Step 9
- Step 5.6 becomes Step 10
- Step 6 becomes Step 11
- Step 6.25 becomes Step 12
- Step 6.5 becomes Step 13
- Step 7 becomes Step 14
- Step 8 becomes Step 15

**Inline body-text cross-references to decimal steps (within this file):**
- Line 310: `skip to Step 5 (no CONTEXT.md written)` — references current Step 5 "Spawn planner"; after renumbering becomes Step 8.
- Line 580: `proceed to step 6` — references current Step 6 "Spawn executor"; after renumbering becomes Step 11.
- Line 639: `PLAN.md is committed in Step 8 as usual` — references current Step 8 "Final commit"; after renumbering becomes Step 15.
- Line 764: `the orchestrator handles the docs commit in Step 8` — same as above, becomes Step 15.
- Line 901: `continue to step 7` — references current Step 7 "Update STATE.md"; after renumbering becomes Step 14.

Note: Lines 691 and 706 contain `Step 1` and `Step 2` inside a code-block snippet describing executor git invariants — these are internal sub-step labels within a code block, not top-level step labels. They should not be renumbered.

**Cross-file references to these steps:** See Cross-File References section below. `fast.md` lines 75 and 83 reference "quick.md Step 7" in comments.

---

### 5. `get-shit-done/workflows/execute-phase.md`

**Pattern:** Main content uses `<step name="...">` XML tags (no numeric step labels). Decimal instances are of two kinds.

**Kind A — Ordered-list sub-items (Pattern D) within `<step name="execute_waves">`:**
```
1.   Intra-wave files_modified overlap check    (line 451)
2.   Describe what's being built               (line 484)
2.5. Per-plan worktree decision                (line 510)  <- DECIMAL list item
3.   Spawn executor agents                     (line 516)
4.   Wait for all agents                       (line 686)
5.   Post-wave hook validation                 (line 728)
5.5. Worktree cleanup                          (line 741)  <- DECIMAL list item
5.6. Post-merge build & test gate              (line 819)  <- DECIMAL list item
5.7. Post-wave shared artifact update          (line 832)  <- DECIMAL list item
5.8. Handle test gate failures                 (line 864)  <- DECIMAL list item
6.   Report completion                         (line 893)
7.   Handle failures                           (line 924)
8.   Execute checkpoint plans                  (line 958)
9.   Proceed to next wave                      (line 959)
```

Within list item 7, failure-handling branches are labeled with the "Step" keyword:
```
**Step 7.0 — classify before branching**  (line 925)  <- DECIMAL inline label
**Step 7.1 — quota-exceeded**             (line 934)  <- DECIMAL inline label
**Step 7.2 — classify-handoff-bug**       (line 947)  <- DECIMAL inline label
**Step 7.3 — unknown-failure**            (line 949)  <- DECIMAL inline label
```

**Kind B — Prose body-text references within this file:**
- Line 356: `**Optional step 2.5 —` (section label for the `cross_ai_delegation` step, not a list item)
- Line 527: `evaluated per-plan in step 2.5`
- Line 660: `forced it false in step 2.5`
- Line 809: `**When to skip step 5.5:**`
- Line 811: `WAVE_WORKTREE_PLANS from step 2.5 is empty`
- Line 813: `proceed to step 5.6`

**Complexity note:** The Step 7.0-7.3 sub-labels are branch labels within list item 7, not independent top-level steps. The question of whether to renumber these depends on whether the scanner targets `**Step N.N**` inside list items. These can be renamed to labeled branches (e.g., `**7a —`, `**7b —`) without using decimal step numbers.

**Cross-file references to this file's decimal steps:** See Cross-File References section below.

---

### 6. `get-shit-done/workflows/execute-phase/steps/post-merge-gate.md`

**Pattern:** Prose body-text cross-reference only; no decimal step label definitions in this file.

- Line 60: `same as step 5.8` — references list item 5.8 in `execute-phase.md`

**No decimal step label definitions in this file.** When `execute-phase.md` list item 5.8 is renumbered, this reference must be updated.

---

## Numbered-Section Files (Pattern C — "Step" keyword not in heading)

These files use `## N.N. Title` section headings. The word "Step" does not appear in the heading itself. Body text within these files uses "step N.N" prose references pointing at those sections.

### `get-shit-done/workflows/new-project.md`

Decimal section headings:
```
## 5.1. Sub-Repo Detection         (line 778)
## 5.5. Resolve Model Profile      (line 810)
## 7.5. Project Structure Mode     (line 1226)
```

Body-text reference to decimal section:
- Line 502: `Proceed to Step 5.5.` — references section `## 5.5.`

### `get-shit-done/workflows/new-milestone.md`

Decimal section headings:
```
## 2.5. Scan Planted Seeds                          (line 49)
## 3.5. Verify Milestone Understanding              (line 104)
## 7.5 Reset-phase safety                           (line 255)
## 10.5. Link Pending Todos to Roadmap Phases       (line 547)
```

Body-text reference:
- Line 398: `from step 2.5` — references section `## 2.5.`

### `get-shit-done/workflows/plan-phase.md`

Decimal section headings (extensive — 13 entries):
```
## 1.5. Closed-Phase Gate            (line 67)
## 2.5. Validate --reviews           (line 186)
## 3.5. Handle PRD Express Path      (line 217)
## 3.6. Handle ADR Ingest            (line 321)
## 4.5. Check AI-SPEC                (line 386)
## 5.5. Create Validation Strategy   (line 565)
## 5.55. Security Threat Model Gate  (line 595)
## 5.6. UI Design Contract Gate      (line 621)
## 5.7. Schema Push Detection Gate   (line 693)
## 7.5. Verify Nyquist Artifacts     (line 786)
## 7.8. Spawn gsd-pattern-mapper     (line 809)
## 8.5. Chunked Planning Mode        (line 1006)
## 12.5. Plan Bounce                 (line 1385)
```

Body-text references to decimal sections:
- Line 159: `The PRD express path (Step 3.5) creates CONTEXT.md` — references `## 3.5.`
- Line 338: `step 3.5/3.6` — references `## 3.5.` and `## 3.6.`
- Line 605: `Skip to step 5.6` — references `## 5.6.`
- Line 619: `Continue to step 5.6` — references `## 5.6.`
- Line 691: `Skip silently to step 5.7` — references `## 5.7.`
- Line 807: `Proceed to Step 7.8` — references `## 7.8.`
- Line 1004: `proceed to step 8.5 instead` — references `## 8.5.`

---

## Cross-File References

References in one file to a step number defined in another file.

| Source File | Line | Reference Text | Target File | Target Step |
|-------------|------|---------------|-------------|-------------|
| `execute-plan.md` | 143 | `execute-phase.md step 5.5)` | `execute-phase.md` | ordered-list item 5.5 |
| `execute-plan.md` | 369 | `execute-phase.md step 5.5)` | `execute-phase.md` | ordered-list item 5.5 |
| `execute-plan.md` | 475 | `execute-phase.md step 5.5)` | `execute-phase.md` | ordered-list item 5.5 |
| `execute-phase/steps/post-merge-gate.md` | 60 | `same as step 5.8` | `execute-phase.md` | ordered-list item 5.8 |
| `fast.md` | 75 | `quick.md Step 7 creates a 5-column table` | `quick.md` | Step 7 "Update STATE.md" |
| `fast.md` | 83 | `5-column schema from quick.md Step 7` | `quick.md` | Step 7 "Update STATE.md" |

**Cross-file reference impact summary:**
- If `execute-phase.md` list item 5.5 is renumbered, `execute-plan.md` lines 143, 369, 475 must be updated.
- If `execute-phase.md` list item 5.8 is renumbered, `post-merge-gate.md` line 60 must be updated.
- If `quick.md` Step 7 is renumbered (to Step 14), `fast.md` lines 75 and 83 (comment text only) must be updated.

---

## Whole-Integer-Only Files (No Changes Needed)

All 67 command files in `commands/gsd/` are clean — no decimal step labels found in any of them.

Of the 33 agents, 31 are clean. Violations: `gsd-intel-updater.md`, `gsd-phase-researcher.md`.

Of the 90 workflow files plus 3 sub-step files:
- Files with decimal label definitions: `execute-phase.md`, `quick.md`, `progress.md`
- Files with cross-file references only (no label definitions): `execute-plan.md`, `execute-phase/steps/post-merge-gate.md`, `fast.md`
- Files with Pattern C sections (no "Step" keyword): `new-project.md`, `new-milestone.md`, `plan-phase.md`
- All remaining files are clean.

---

## Scope Clarification for Scanner Design

The scanner for STEP-01 must decide which patterns to flag. Recommendation based on this inventory:

**Definite in-scope (the word "Step" in the label):**
1. `**Step N.N` — bold label format (quick.md, progress.md, execute-phase.md inline)
2. `## Step N.N` or `### Step N.N` — heading format with "Step" keyword (gsd-intel-updater.md, gsd-phase-researcher.md)

**Ordered-list items (no "Step" keyword):**
3. `^N.N. ` at start of line — decimal ordered list items (execute-phase.md items 2.5, 5.5-5.8) — violations if the scope includes all decimal step numbering regardless of "Step" keyword

**Pattern C sections (no "Step" keyword in heading):**
4. `^## N.N.` headings — borderline; body-text prose references say "step N.N" but the headings themselves do not contain "Step". These are in scope for renumbering only if the project decision includes numbered-chapter files.

**Recommended scanner regex for "Step" keyword violations:**
```
[Ss]tep\s+\d+\.\d
```
This captures Patterns A, B, and inline references. Ordered-list items (Pattern D) require a separate regex: `^\s*\d+\.\d+\.`.
