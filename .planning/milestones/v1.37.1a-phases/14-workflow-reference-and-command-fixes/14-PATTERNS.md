# Phase 14: Workflow, Reference, and Command Fixes - Pattern Map

**Mapped:** 2026-04-22
**Files analyzed:** 11 (modified only — no new files)
**Analogs found:** 11 / 11 (self-referential: patterns drawn from surrounding positive-framing blocks within the same files, and from Phase 13 analogs)

---

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `get-shit-done/workflows/analyze-dependencies.md` | prompt/workflow | transform | Own surrounding bullet block (lines 97–99) | exact — same file, bare imperative bullet style |
| `get-shit-done/workflows/discuss-phase.md` | prompt/workflow | request-response | Own surrounding bullet block (lines 169–171) | exact — same file, bare imperative bullet style |
| `get-shit-done/workflows/execute-plan.md` | prompt/workflow | request-response | Own surrounding bullet block (lines 197–202) | exact — same file, bold-label bullet style |
| `get-shit-done/workflows/import.md` | prompt/workflow | transform | Own positive bullet examples (surrounding sections) | exact — same file, section-rewrite |
| `get-shit-done/workflows/transition.md` | prompt/workflow | event-driven | Own `**Stop here.**` line (line 570) | exact — deletion leaves adjacent positive gate intact |
| `get-shit-done/workflows/verify-phase.md` | prompt/workflow | transform | Own surrounding numbered-list sentences (lines 235–240) | exact — same file, sentence style |
| `get-shit-done/references/planner-source-audit.md` | prompt/reference | transform | Own surrounding list-header structure (lines 28–33) | exact — same file, list-header colon style |
| `commands/gsd/docs-update.md` | prompt/command | request-response | `commands/gsd/execute-phase.md` lines 49–53 | exact — parallel block with identical framing pattern |
| `commands/gsd/execute-phase.md` | prompt/command | request-response | `commands/gsd/docs-update.md` lines 37–41 (after FRAMING-15 fix) | exact — parallel block |
| `commands/gsd/reapply-patches.md` | prompt/command | request-response | Own surrounding sequencing-gate sentences (lines 265–270, 272–275) | exact — same file, sequencing-gate style |
| `tests/execute-phase-active-flags.test.cjs` | test | request-response | Own test body (lines 35–61) — parallel `content.includes(...)` assertions | exact — same file, same assertion pattern |

---

## Pattern Assignments

### `get-shit-done/workflows/analyze-dependencies.md` — FRAMING-07 (line 100)

**Edit type:** Line replacement

**Current violation (line 100):**
```markdown
- Do not reorder phases
```

**Style anchor — surrounding positive bullet block (lines 97–99):**
```markdown
- Locate the phase entry and add or update the `Depends on:` field
- Preserve all other phase content unchanged
```

**Prescribed replacement (D-01, locked):**
```markdown
- Preserve the existing phase order — relocate only the dependency field
```

**Scanner check:** Em-dash complement suppresses scanner detection AND removes the bare `Do not` directive. Line has no `do not`, `DO NOT`, or `NEVER`. Safe.

---

### `get-shit-done/workflows/discuss-phase.md` — FRAMING-08 (line 172)

**Edit type:** Line replacement

**Current violation (line 172):**
```markdown
- Do not continue with the steps below
```

**Style anchor — surrounding positive bullet block (lines 169–171):**
```markdown
**Power mode** — If `--power` is present in ARGUMENTS:
- Skip interactive questioning entirely
- Read and execute @~/.claude/get-shit-done/workflows/discuss-phase-power.md end-to-end
```

**Prescribed replacement (D-02, locked):**
```markdown
- Stop here — power mode handles all remaining steps
```

**Scanner check:** Em-dash complement present. No `do not`. Safe.

---

### `get-shit-done/workflows/execute-plan.md` — FRAMING-09 (line 203)

**Edit type:** Line replacement

**Current violation (line 203):**
```markdown
- **Scope boundary**: do not auto-fix pre-existing issues unrelated to current task
```

**Style anchor — adjacent bold-label bullet (line 200):**
```markdown
- **Rules 1-3** (bugs, missing critical, blockers): auto-fix, test, verify, track as deviations
```

**Prescribed replacement (D-03, locked):**
```markdown
- **Scope boundary**: Scope auto-fixes to issues introduced by the current task only — leave pre-existing issues untouched
```

**Scanner check:** Em-dash complement present. No bare `do not`. Safe.

---

### `get-shit-done/workflows/import.md` — FRAMING-10 (lines 274–283, block rewrite)

**Edit type:** Block replacement (old_string = full Anti-Patterns block, new_string = Required Patterns block)

**Current block (lines 274–283):**
```markdown
## Anti-Patterns

Do NOT:
- Use markdown tables (`|---|`) in the conflict detection report — use plain-text [BLOCKER]/[WARNING]/[INFO] labels
- Write PLAN.md files as `PLAN-01.md` or `plan-01.md` — always use `{NN}-{MM}-PLAN.md`
- Use `pbr:plan-checker` or `pbr:planner` — use `gsd-plan-checker` and `gsd-planner`
- Write `.planning/.active-skill` — this is a PBR pattern with no GSD equivalent
- Reference `pbr-tools`, `pbr:`, or `PLAN-BUILD-RUN` anywhere
- Write any PLAN.md file when blockers exist — the safety gate must hold
- Skip path validation on the --from file argument
```

**Style anchor — bare positive imperative bullet (Phase 13 / own surrounding sections):**
Direct verb phrase, no preamble ("You should...", "Please..."), no modal hedging.

**Prescribed replacement (D-04, block rewrite — exact wording at executor discretion, pattern is locked):**
```markdown
## Required Patterns

Use these conventions in all import operations:
- Use plain-text [BLOCKER]/[WARNING]/[INFO] labels in the conflict detection report
- Name PLAN.md files using the `{NN}-{MM}-PLAN.md` format
- Use `gsd-plan-checker` and `gsd-planner` for plan checking and planning
- Omit `.planning/.active-skill` — this PBR pattern has no GSD equivalent
- Use only GSD-native tool names and prefixes
- Hold the safety gate: skip PLAN.md creation when blockers exist
- Validate the `--from` file argument path before proceeding
```

**Scanner check:** No `do not`, `DO NOT`, or `NEVER` anywhere in block. Safe.

**Critical note:** The scanner only flagged the `Do NOT:` header (1 violation) because each list item had an em-dash complement. D-04 requires converting all 7 items anyway — a scanner pass alone does NOT confirm requirement met. Post-edit, verify the Anti-Patterns section no longer exists and all 7 items are affirmative.

---

### `get-shit-done/workflows/transition.md` — FRAMING-11 + FRAMING-12 (lines 567–568, deletion)

**Edit type:** Block deletion (two lines removed, no replacement)

**Current lines 567–568 (violations):**
```markdown
Do NOT suggest `/gsd-complete-milestone` or `/gsd-new-milestone`.
Do NOT auto-invoke any further slash commands.
```

**Full surrounding block (lines 564–570):**
```markdown
---
```

Do NOT suggest `/gsd-complete-milestone` or `/gsd-new-milestone`.
Do NOT auto-invoke any further slash commands.

**Stop here.** The user must explicitly decide what to do next.
```

**After deletion — expected shape:**
```markdown
---
```

**Stop here.** The user must explicitly decide what to do next.
```

**Style anchor:** The `**Stop here.**` sentence at line 570 (becomes 568 after deletion) already covers the intent positively with no negative directive.

**Critical note:** Use Edit with the exact two-line string as old_string and empty string as new_string. Read lines 562–575 first to confirm exact current text — do not delete by line number since upstream edits can shift offsets.

---

### `get-shit-done/workflows/verify-phase.md` — FRAMING-13 (line 241)

**Edit type:** Line replacement

**Current violation (line 241):**
```markdown
   Do NOT invent example inputs.
```

**Style anchor — surrounding numbered-list sentences (lines 235–240):**
```markdown
1. Check if the command exists and required inputs are available:
   - Look for example files in `templates/`, `fixtures/`, `test/`, `examples/`, or `testdata/`
   - Check if the CLI binary/script exists on PATH or in the project
2. **If no suitable inputs or fixtures exist:** Mark as `? NEEDS HUMAN` with reason
   "No test fixtures available — requires manual verification" and move on.
```

Note the 3-space indent used in this block for sub-sentences.

**Prescribed replacement (D-07, locked):**
```markdown
   Source inputs exclusively from actual test fixtures and codebase examples.
```

**Scanner check:** No `do not`, `DO NOT`, or `NEVER`. Preserves 3-space indent. Safe.

---

### `get-shit-done/references/planner-source-audit.md` — FRAMING-14 (line 30)

**Edit type:** Line replacement

**Current violation (line 30):**
```markdown
Do not flag these as MISSING:
```

**Style anchor — section header structure (line 28 and surrounding list):**
```markdown
### What is NOT a Gap

Do not flag these as MISSING:
- Items in `## Deferred Ideas` in CONTEXT.md — developer chose to defer these
- Items scoped to a different phase via `phase_req_ids` — not assigned to this phase
- Items in RESEARCH.md explicitly marked "out of scope" or "future work" by the researcher
```

The replacement must retain the colon so the following bullet items remain grammatically attached.

**Prescribed replacement (D-08, locked):**
```markdown
Treat these as expected and exclude them from MISSING flags:
```

**Scanner check:** No `do not`, `DO NOT`, or `NEVER`. Colon preserved for bullet attachment. Safe.

---

### `commands/gsd/docs-update.md` — FRAMING-15 (line 42)

**Edit type:** Line replacement

**Current violation (line 42):**
```markdown
- Do not infer that a flag is active just because it is documented in this prompt
```

**Style anchor — parallel block in `commands/gsd/execute-phase.md` (lines 49–53), identical structure:**
```markdown
**Active flags must be derived from `$ARGUMENTS`:**
- `--wave N` is active only if the literal `--wave` token is present in `$ARGUMENTS`
- `--gaps-only` is active only if the literal `--gaps-only` token is present in `$ARGUMENTS`
- `--interactive` is active only if the literal `--interactive` token is present in `$ARGUMENTS`
- If none of these tokens appear, run the standard full-phase execution flow with no flag-specific filtering
```

**Prescribed replacement (D-09, locked — exact wording specified):**
```markdown
- Treat a flag as active only if its literal token is present in `$ARGUMENTS`
```

**Scanner check:** No `do not`, `DO NOT`, or `NEVER`. Safe.

---

### `commands/gsd/execute-phase.md` — FRAMING-16 (line 54)

**Edit type:** Line replacement (must be done atomically with the test update below)

**Current violation (line 54):**
```markdown
- Do not infer that a flag is active just because it is documented in this prompt
```

**Style anchor — surrounding block (lines 49–53, same file):**
```markdown
**Active flags must be derived from `$ARGUMENTS`:**
- `--wave N` is active only if the literal `--wave` token is present in `$ARGUMENTS`
- `--gaps-only` is active only if the literal `--gaps-only` token is present in `$ARGUMENTS`
- `--interactive` is active only if the literal `--interactive` token is present in `$ARGUMENTS`
- If none of these tokens appear, run the standard full-phase execution flow with no flag-specific filtering
```

**Prescribed replacement (D-10, locked — identical to FRAMING-15 for consistency):**
```markdown
- Treat a flag as active only if its literal token is present in `$ARGUMENTS`
```

**Scanner check:** No `do not`, `DO NOT`, or `NEVER`. Safe.

**Atomicity constraint:** This edit and the test file update (below) must be done in the same sequential task batch. The test suite will fail between the two edits if they are in separate waves.

---

### `tests/execute-phase-active-flags.test.cjs` — test update for FRAMING-16 (line 50)

**Edit type:** Assertion string replacement (must immediately follow FRAMING-16 source edit)

**Current assertion (line 50):**
```javascript
      content.includes('Do not infer that a flag is active just because it is documented in this prompt'),
```

**Current failure message (line 51):**
```javascript
      'context should forbid inferring flags from documentation alone'
```

**Style anchor — parallel assertions in same test (lines 37–44):**
```javascript
    assert.ok(
      content.includes('Available optional flags (documentation only'),
      'context should clearly label flags as documentation only'
    );
    assert.ok(
      content.includes('Active flags must be derived from `$ARGUMENTS`'),
      'context should have a separate active-flags section'
    );
```

**Prescribed replacement (D-11, locked):**
```javascript
      content.includes('Treat a flag as active only if its literal token is present in `$ARGUMENTS`'),
      'context should require deriving flag state from $ARGUMENTS literal token'
```

**Note:** Replace both line 50 (the includes string) and line 51 (the failure message string) in one Edit call to keep the assertion semantically coherent.

---

### `commands/gsd/reapply-patches.md` — FRAMING-17 (line 271)

**Edit type:** Line replacement

**Current violation (line 271):**
```markdown
Do not proceed to cleanup until the user confirms they have resolved all unverified hunks.
```

**Style anchor — surrounding sequencing sentences (lines 272–274):**
```markdown
**Only when all rows show `verified: yes`** (or when all files had zero user-added hunks) may execution continue to Step 6.

## Step 6: Cleanup option
```

**Prescribed replacement (D-12, locked):**
```markdown
Proceed to Step 6 only after the user confirms all unverified hunks are resolved.
```

**Scanner check:** No `do not`, `DO NOT`, or `NEVER`. Positive sequencing gate. Safe.

---

## Shared Patterns

### Affirmative Imperative Style
**Source:** `agents/gsd-assumptions-analyzer.md` `<rules>` block (lines 95–104) — established in Phase 13
**Apply to:** All replacement lines (FRAMING-07, -08, -09, -13, -14, -17)

The consistent pattern across all these files is a bare imperative verb phrase:
- "Preserve the existing phase order..."
- "Stop here — power mode handles..."
- "Scope auto-fixes to issues introduced..."
- "Source inputs exclusively from..."
- "Treat these as expected and..."
- "Proceed to Step 6 only after..."

No auxiliary preamble ("You should...", "Please..."). No modal hedging ("may", "might"). Direct imperative. Em-dash complements are acceptable (and used in several rewrites) — they are positive complement pairs, not negative directives.

### Scanner Exemption Awareness
**Source:** `tests/negative-framing-scan.test.cjs` lines 54–66 (`hasPositiveComplement()` function)
**Apply to:** All replacements

The scanner flags `/\bdo not\b/i` with no positive complement (no em-dash, double-dash, period-uppercase, or parenthetical on the same line). All replacements must contain zero instances of bare `do not`, `Do NOT`, `DO NOT`, or any capitalisation variant. They must also avoid bare `NEVER [verb]` directives. The replacements in this document satisfy both constraints.

Key detail for FRAMING-10: scanner passes for the list items because each has an em-dash — but D-04 requires converting all 7 items to pure positive imperatives regardless. Scanner green ≠ requirement met for FRAMING-10.

### Edit Tool (not Write Tool) Constraint
**Source:** `14-RESEARCH.md` Architecture Patterns section; Phase 13 precedent
**Apply to:** All 11 files

Use the Edit tool for each targeted change. Using Write on these large markdown files risks accidentally dropping unrelated content or mutating line endings/indentation. Read the surrounding context window specified in CONTEXT.md `canonical_refs` before each edit to confirm exact current text.

### Atomicity Constraint for FRAMING-16
**Source:** `14-RESEARCH.md` Pitfall 2; `14-CONTEXT.md` D-11
**Apply to:** `commands/gsd/execute-phase.md` + `tests/execute-phase-active-flags.test.cjs`

These two edits must execute in the same sequential task batch. If execute-phase.md is updated in wave N and the test is updated in wave N+1, the test suite will fail between waves because line 50 still asserts the now-deleted string.

### List-Header Colon Preservation
**Source:** `get-shit-done/references/planner-source-audit.md` structure (lines 28–33)
**Apply to:** FRAMING-14 replacement

When replacing a list header, preserve the trailing colon so the bullet items below it remain grammatically attached. Example: `Treat these as expected and exclude them from MISSING flags:` (colon retained).

---

## No Analog Found

Not applicable. All 11 modifications are in-place text replacements or deletions. Style analogs are drawn from:
1. Surrounding positive-framing blocks within the same file (primary — self-referential)
2. Phase 13 established patterns (`agents/` files) — same methodology, same scanner, same style constraints
3. Parallel blocks in sibling files (FRAMING-15 and FRAMING-16 are identical structures in two command files)

No new files are created; no external code analogs are required.

---

## Metadata

**Analog search scope:** Surrounding blocks within each target file; Phase 13 PATTERNS.md for methodology precedent; `tests/negative-framing-scan.test.cjs` for scanner logic
**Files scanned:** 10 markdown source files + 1 test file
**Pattern extraction date:** 2026-04-22
