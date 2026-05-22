# Phase 9: Fork Standards Pass — Research

**Researched:** 2026-04-18
**Domain:** Prompt engineering quality enforcement — positive framing pass and XML structure audit on v1.37.1 new/modified files
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Run the negative-framing scanner on all 20 new files first to confirm the baseline (currently green at 34/34). Then perform a full structural audit of each file against PROMPT_ENGINEERING_GUIDE V09 — not just framing, but XML block presence, context placement, priority ordering, persona, CoT gating, constraint pairing, and compression. Fix all quality gaps found.

**D-02:** XML structure standard = full PROMPT_ENGINEERING_GUIDE V09 review. This is the highest bar and the same standard applied during the original improvement pass. Each of the 20 new files is reviewed against all V09 quality dimensions — not just the lightweight task→intent rename check.

The 20 new files in scope:
- commands/gsd: inbox.md, sketch.md, sketch-wrap-up.md, spec-phase.md, spike.md, spike-wrap-up.md
- get-shit-done/references: autonomous-smart-discuss.md, debugger-philosophy.md, mandatory-initial-read.md, project-skills-discovery.md, sketch-interactivity.md, sketch-theme-system.md, sketch-tooling.md, sketch-variant-patterns.md
- get-shit-done/workflows: sketch.md, sketch-wrap-up.md, spec-phase.md, spike.md, spike-wrap-up.md
- (get-shit-done/templates/spec.md is exempt)

**D-03:** Use a diff-based triage approach rather than scanner-only. For each of the 193 upstream-modified files, compare the fork's pre-merge version (from `git log --diff-filter=M` or equivalent) to the post-merge state to detect framing or structural quality that was silently degraded. This catches cases where the scanner exempts a line (e.g., em-dash complement) but the underlying quality regressed. Fix only confirmed degraded files — scanner-first discovery still applies for scope.

The 5 refactored agents (gsd-debugger, gsd-planner, gsd-executor, gsd-verifier, gsd-phase-researcher) must be verified: their `<role>` block restructuring from Phase 7 must be preserved in the final state.

**D-04:** No regressions gate. After all Phase 9 edits, `npm test` must return at least 4098/4112 (the current pass count). The negative-framing scanner must remain 34/34. Phase 9 is not responsible for advancing the 14-failure baseline — that belongs to Phase 10 — but Phase 9 edits must not decrease the count.

### Claude's Discretion

- Order in which the 20 new files are reviewed in Plan 01
- Specific V09 quality dimensions to prioritize within each file
- How to extract pre-merge file versions for the diff-based triage (git show, merge-base, etc.)
- Whether to group Plan 02 fixes by file category (agents, workflows, references) or process all together

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NEW-01 | `commands/gsd/inbox.md` passes positive framing standard | Scanner confirms CLEAN; full V09 audit still required per D-01/D-02 |
| NEW-02 | `commands/gsd/sketch.md` passes positive framing standard | Scanner confirms CLEAN; V09 audit required |
| NEW-03 | `commands/gsd/sketch-wrap-up.md` passes positive framing standard | Scanner confirms CLEAN; V09 audit required |
| NEW-04 | `commands/gsd/spec-phase.md` passes positive framing standard (1 confirmed violation) | Scanner now shows CLEAN — violation was resolved in Phase 7 FORK-CORRUPTION triage; V09 audit still required |
| NEW-05 | `commands/gsd/spike.md` passes positive framing standard | Scanner confirms CLEAN; V09 audit required |
| NEW-06 | `commands/gsd/spike-wrap-up.md` passes positive framing standard | Scanner confirms CLEAN; V09 audit required |
| NEW-07 | `get-shit-done/references/autonomous-smart-discuss.md` passes positive framing (2 confirmed violations) | Scanner now shows CLEAN — violations resolved in Phase 7; V09 audit required |
| NEW-08 | `get-shit-done/references/debugger-philosophy.md` passes positive framing (2 confirmed violations) | Scanner now shows CLEAN — violations resolved in Phase 7; V09 audit required |
| NEW-09 | `get-shit-done/references/mandatory-initial-read.md` passes positive framing standard | Scanner confirms CLEAN; V09 audit required |
| NEW-10 | `get-shit-done/references/project-skills-discovery.md` passes positive framing (1 confirmed violation) | Scanner now shows CLEAN — violation resolved in Phase 7; V09 audit required |
| NEW-11 | `get-shit-done/references/sketch-interactivity.md` passes positive framing standard | Scanner confirms CLEAN; V09 audit required |
| NEW-12 | `get-shit-done/references/sketch-theme-system.md` passes positive framing standard | Scanner confirms CLEAN; V09 audit required |
| NEW-13 | `get-shit-done/references/sketch-tooling.md` passes positive framing standard | Scanner confirms CLEAN; V09 audit required |
| NEW-14 | `get-shit-done/references/sketch-variant-patterns.md` passes positive framing standard | Scanner confirms CLEAN; V09 audit required |
| NEW-15 | `get-shit-done/templates/spec.md` — evaluated (templates/ exempt from fork standards) | Out of scope per REQUIREMENTS.md — no action |
| NEW-16 | `get-shit-done/workflows/sketch.md` passes positive framing standard | Scanner confirms CLEAN; V09 audit required |
| NEW-17 | `get-shit-done/workflows/sketch-wrap-up.md` passes positive framing standard | Scanner confirms CLEAN; V09 audit required |
| NEW-18 | `get-shit-done/workflows/spec-phase.md` passes positive framing (2 confirmed violations) | Scanner now shows CLEAN — violations resolved in Phase 7; V09 audit required |
| NEW-19 | `get-shit-done/workflows/spike.md` passes positive framing standard | Scanner confirms CLEAN; V09 audit required |
| NEW-20 | `get-shit-done/workflows/spike-wrap-up.md` passes positive framing standard | Scanner confirms CLEAN; V09 audit required |
| MOD-01 | All modified agents pass positive framing standard — scanner-first | 3 agents violating: gsd-debugger.md (2), gsd-executor.md (3); gsd-code-fixer.md (3 pre-existing, out of scope) |
| MOD-02 | All modified commands pass positive framing standard — scanner-first | All command files currently CLEAN per scanner |
| MOD-03 | All modified references pass positive framing standard — scanner-first | All reference files currently CLEAN per scanner |
| MOD-04 | All modified workflows pass positive framing standard — scanner-first | 4 workflows violating: discuss-phase.md (1), import.md (1 pre-existing), transition.md (2 of 3 pre-existing), verify-phase.md (1 pre-existing), verify-work.md (1 new) |

</phase_requirements>

---

## Summary

Phase 9 applies the fork's positive framing and V09 XML structure standards to all 20 new prompt files added by v1.37.1 (Plan 01) and to the subset of upstream-modified files where framing degraded (Plan 02).

**Critical discovery from pre-planning research:** The scanner is currently 34/34 (fully green), meaning all framing violations previously listed in the success criteria (spec-phase command 1 violation, spec-phase workflow 2 violations, debugger-philosophy 2 violations, autonomous-smart-discuss 2 violations, project-skills-discovery 1 violation) were resolved during Phase 7 FORK-CORRUPTION triage. Plan 01 opens in an advantageous position — no scanner remediation work remains; the focus is entirely on the V09 structural quality audit of 19 in-scope new files (NEW-15 is exempt).

**For Plan 02:** Scanner-based triage of the 122 upstream-modified prompt files reveals 8 files with 15 total violations. Of these, gsd-code-fixer.md's 3 violations are documented as pre-existing and out of scope (PROJECT.md §Out of Scope). The remaining 7 files have 12 violations, with 4 of those in import.md/transition.md/verify-phase.md being pre-existing (were already present before the v1.37.1 merge). The newly-introduced violations from upstream are concentrated in: gsd-debugger.md (2), gsd-executor.md (3), discuss-phase.md (1), verify-work.md (1), and one new line in transition.md (1).

**Primary recommendation:** Plan 01 = run scanner to confirm baseline is green, then execute full V09 audit on all 19 non-exempt new files. Plan 02 = fix 7 upstream-introduced violations across 5 files; treat 4 pre-existing violations as the same out-of-scope category as gsd-code-fixer (unless user decides otherwise); produce VIOLATIONS.md listing all 12 non-code-fixer violations with resolution status.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Positive framing scan (scanner tool) | Repository layer | — | `node --test` runs against checked-out files; no runtime involvement |
| V09 structural audit (Plan 01) | Repository layer | — | File-by-file read + edit; no service boundary |
| Pre-merge diff triage (Plan 02) | Repository layer | Git history | Comparing HEAD vs pre-merge commit via `git show` |
| Test suite gate | CI/test layer | — | `npm test` runs Node built-in test runner against local files |
| Framing fix edits | Prompt content layer | — | Text edits to .md files; no code changes |

---

## Standard Stack

### Core Tools
| Tool | Version/Location | Purpose | Why Standard |
|------|-----------------|---------|--------------|
| `tests/negative-framing-scan.test.cjs` | repo root | Primary framing scanner | Fork's canonical gate; currently 34/34 |
| `node --test` | Node.js built-in | Test runner invocation | Matches `npm test` infrastructure |
| `npm test` | package.json | Full suite gate | Required by D-04 no-regressions constraint |
| `git show <commit>:<file>` | git CLI | Extract pre-merge file content | Diff-based triage for Plan 02 |
| `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md` | repo root | V09 quality bar reference | Canonical guide for structural audit |
| `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md` | repo root | 8-step improvement process | Process guide for applying V09 |

### Scanner Invocation
```bash
# Run scanner only (fast, 34 tests):
node --test tests/negative-framing-scan.test.cjs

# Run full suite (gate check after edits):
npm test

# Check specific file for violations (inline, no test framework):
node -e "
const fs = require('fs');
// [paste scanner helper functions from test file]
const content = fs.readFileSync('path/to/file.md', 'utf-8');
const result = scanForNegativeFraming(content);
console.log(result);
"
```

### Pre-Merge Diff Commands
```bash
# Identify upstream-modified prompt files (confirmed: 122 files):
git diff --name-only a7abc5c 14ca3f4 -- 'agents/*.md' 'commands/gsd/*.md' 'get-shit-done/workflows/*.md' 'get-shit-done/references/*.md'

# Extract pre-merge version of a file for comparison:
git show a7abc5c:<file>

# Compare pre-merge vs current for a specific file:
git diff a7abc5c -- <file>
```

**Key git refs:** [VERIFIED: git log]
- Upstream v1.37.1 merge commit: `14ca3f4`
- Pre-merge fork HEAD: `a7abc5c8bac35a24bf1b664035a55822d0562c11`

---

## Architecture Patterns

### Scanner Logic (from `tests/negative-framing-scan.test.cjs`) [VERIFIED: direct file read]

The scanner detects two violation categories:

**1. NEVER directives** — flags `\bNEVER\b` unless:
- Preceded by an auxiliary/linking verb ("is never", "was never", "have NEVER seen") → factual adverb
- Appears mid-sentence after a subject phrase (`\w+\s+NEVER\s+\w`) and NOT at clause start → factual
- Inside parentheses → table cell or example context
- Line starts with conditional word (If/When/Unless/Whether/While/After/Before) → conditional branch
- Matches reframe pattern ("Your job is not to X — it's to Y")
- Inside a code fence block (between `` ``` `` markers)

**2. DO NOT directives** — flags `\b(DO NOT|Do NOT|do NOT)\b` unless it has a positive complement on the same line:
- Em-dash or double-dash: `DO NOT X — use Y` or `DO NOT X -- use Y`
- Period followed by uppercase word: `DO NOT X. Use Y.` (or `**DO NOT X.** Use Y.`)
- Parenthetical with ≥4 chars: `DO NOT X (use Y instead)`
- Also exempt: conditional branches, reframe patterns, code fence content

**Valid constraint pair examples:**
```
DO NOT use Bash for listing (use Glob tool)          ← EXEMPT (parenthetical)
DO NOT modify source files. Review is read-only.     ← EXEMPT (period + sentence)
DO NOT use Write tool — a partial write corrupts.    ← EXEMPT (em-dash)
NEVER X — always Y                                   ← EXEMPT (double-dash complement) via DO NOT logic
```

**Violation examples:**
```
NEVER use time estimates.        ← VIOLATION (bare directive)
Do NOT proceed to fix_and_verify.  ← VIOLATION (no complement)
Do NOT create REVIEW-FIX.md     ← VIOLATION (no complement)
```

### Positive Framing Replacement Rule [VERIFIED: PROJECT.md, CONTEXT.md]

> Negative directives (`do not X`, `never X`, `avoid X`) are replaced with affirmative instructions that state what to do instead — the replacement MUST specify the correct behavior, not merely delete the prohibition.

**Conversion table (from PROMPT_IMPROVEMENT_GUIDE_V01.md):**

| Negative (remove) | Positive (replace with) |
|---|---|
| "NEVER use time estimates" | "Derive timeline from scope only" |
| "Do NOT create REVIEW-FIX.md" | "Write all findings directly in the response" |
| "Do NOT proceed to fix_and_verify" | "Stop here — surface the finding before fixing" |
| "Do NOT re-run builds hoping they resolve" | "Investigate the root cause before retrying" |
| "Do NOT skip the fix" | "Apply the fix even when syntax checking is unavailable" |

**Exception — valid paired-negative reframe (PRESERVE VERBATIM):**
```
Your job is not to confirm the implementation works — it's to try to break it.
```
This is the `isReframePattern()` — a deliberate pattern to displace a strong model default.

### V09 Quality Dimensions for Audit [VERIFIED: .planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md]

Full V09 audit (per D-02) checks each new file against these 8 dimensions:

1. **Task Specification (Step 1):** Explicit `<task>`, `<audience>`, `<quality_bar>`; no conflicting constraints
2. **Positive Framing (Step 2):** Zero bare negative directives (scanner gate)
3. **XML Structure (Step 3):** Sections separated by semantically named XML tags from the V09 vocabulary
4. **Context Placement (Step 4):** `<task>` first (high attention), `<context>` middle, `<input>` last
5. **Priority Ordering (Step 5):** Explicit `<priority_order>` when multiple criteria apply; tie-breaking rule
6. **Persona (Step 6):** Present only for open-ended tasks; specific (constrains voice/domain), gender-neutral
7. **Chain-of-Thought (Step 7):** CoT trigger only for math/symbolic reasoning/multi-step logic
8. **Constraint Enforcement (Step 8):** Every restriction paired with a permission; `<permitted>` + `<reserved_for_human_review>`

**Tag vocabulary for commands layer (fork convention):**

| Tag | Purpose | Notes |
|-----|---------|-------|
| `<intent>` | Command-layer primary instruction | Fork uses `<intent>` not `<task>` in commands to avoid collision |
| `<objective>` | Extended intent with workflow pointer | Pattern used by spec-phase.md |
| `<context>` | Background / runtime context | |
| `<constraints>` | Behavioral rules | With `<permitted>` / `<reserved_for_human_review>` sub-tags |
| `<persona>` | Role and strengths | Only when needed |
| `<execution_context>` | @file includes | Used in command files to load workflow |
| `<process>` | Step-by-step execution instructions | In workflow files |
| `<success_criteria>` | Acceptance criteria | Pass/fail checkboxes |
| `<critical_rules>` | Hard constraints | Enumerated list |

---

## Solved Problems (Don't Hand-Roll)

| Problem | Use Instead | Why |
|---------|-------------|-----|
| Framing violation detection | `tests/negative-framing-scan.test.cjs` scanner helpers | Production-tested with exemption logic for 6 valid patterns; custom detection misses edge cases |
| Pre-merge file comparison | `git show a7abc5c:<file>` | Direct and accurate; no re-parsing needed |
| Full suite regression check | `npm test` | Covers all 7 fork-specific tests including scanner, frontmatter, and size budgets |
| V09 audit checklist | `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md` Final Checklist | 30-item checklist; each dimension with concrete fix instructions |

---

## Plan 01: Confirmed State of 19 New Files [VERIFIED: scanner run 2026-04-18]

All 19 in-scope new files pass the negative-framing scanner. The violations listed in the roadmap success criteria were resolved during Phase 7 FORK-CORRUPTION triage.

| File | Scanner | V09 Audit Needed |
|------|---------|-----------------|
| commands/gsd/inbox.md | CLEAN | Yes — full V09 |
| commands/gsd/sketch.md | CLEAN | Yes — full V09 |
| commands/gsd/sketch-wrap-up.md | CLEAN | Yes — full V09 |
| commands/gsd/spec-phase.md | CLEAN | Yes — full V09 |
| commands/gsd/spike.md | CLEAN | Yes — full V09 |
| commands/gsd/spike-wrap-up.md | CLEAN | Yes — full V09 |
| get-shit-done/references/autonomous-smart-discuss.md | CLEAN | Yes — full V09 |
| get-shit-done/references/debugger-philosophy.md | CLEAN | Yes — full V09 |
| get-shit-done/references/mandatory-initial-read.md | CLEAN | Yes — full V09 |
| get-shit-done/references/project-skills-discovery.md | CLEAN | Yes — full V09 |
| get-shit-done/references/sketch-interactivity.md | CLEAN | Yes — full V09 |
| get-shit-done/references/sketch-theme-system.md | CLEAN | Yes — full V09 |
| get-shit-done/references/sketch-tooling.md | CLEAN | Yes — full V09 |
| get-shit-done/references/sketch-variant-patterns.md | CLEAN | Yes — full V09 |
| get-shit-done/workflows/sketch.md | CLEAN | Yes — full V09 |
| get-shit-done/workflows/sketch-wrap-up.md | CLEAN | Yes — full V09 |
| get-shit-done/workflows/spec-phase.md | CLEAN | Yes — full V09 |
| get-shit-done/workflows/spike.md | CLEAN | Yes — full V09 |
| get-shit-done/workflows/spike-wrap-up.md | CLEAN | Yes — full V09 |
| get-shit-done/templates/spec.md | EXEMPT | Out of scope |

**Implication for Plan 01:** The plan opens with a scanner confirmation run (expected: 34/34 unchanged), then pivots entirely to the V09 structural audit. There is no scanner remediation work in Plan 01.

---

## Plan 02: Confirmed Violations in Modified Files [VERIFIED: scanner run 2026-04-18]

**Scanner run on 122 upstream-modified prompt files found 8 files with 15 total violations.**

### Violations by File — Current State

**Category A: Upstream-introduced (new violations not present pre-merge)**

| File | Violations | Lines | Text |
|------|-----------|-------|------|
| agents/gsd-debugger.md | 2 | L1074, L1135 | `**Do NOT proceed to fix_and_verify.**` / `Do NOT move file to resolved/ in this step.` |
| agents/gsd-executor.md | 3 | L202, L203, L209 | `- Do NOT fix them` / `- Do NOT re-run builds hoping they resolve themselves` / `- Do NOT restart the build to find more issues` |
| get-shit-done/workflows/discuss-phase.md | 1 | L122 | `Do NOT retry the AskUserQuestion or generate more questions when "Other" is selected...` |
| get-shit-done/workflows/verify-work.md | 1 | L248 | `- Do NOT add commentary before or after the block.` |
| get-shit-done/workflows/transition.md | 1 | L534 | `Override auto-advance: do NOT auto-continue to milestone completion.` |

**Total upstream-introduced violations requiring fixes: 8 across 5 files**

**Category B: Pre-existing violations (present before v1.37.1 merge)**

| File | Violations | Status |
|------|-----------|--------|
| agents/gsd-code-fixer.md | 3 (L138, L240, L344) | Out of scope per PROJECT.md §Out of Scope — established precedent |
| get-shit-done/workflows/import.md | 1 (L276) | Pre-existing (was at L276 pre-merge); scope decision needed |
| get-shit-done/workflows/transition.md | 2 (L568, L569) | Pre-existing (were at L456, L457 pre-merge); scope decision needed |
| get-shit-done/workflows/verify-phase.md | 1 (L241) | Pre-existing (was at L224 pre-merge); scope decision needed |

**Total pre-existing violations: 7 across 4 files**

### Scope Decision for Pre-Existing Violations (Claude's Discretion per D-03)

The CONTEXT.md specifies "scanner-first approach; confirmed violations fixed." The key question for import.md, transition.md (2), and verify-phase.md (1) is whether they were "silently degraded" by the upstream merge or were pre-existing technical debt. Pre-merge research confirms they were already present. Per PROJECT.md precedent (gsd-code-fixer pre-existing violations treated as out of scope), these 4 pre-existing violations should be treated as out-of-scope for Phase 9 unless instructed otherwise.

**Recommended scope for Plan 02: Fix the 8 upstream-introduced violations; document pre-existing 4 as known debt in VIOLATIONS.md with same precedent as gsd-code-fixer.**

### 5 Refactored Agents — Preservation Verification [VERIFIED: direct file read]

All 5 agents have `<role>` block at line 14 — present and structurally intact:
- `agents/gsd-debugger.md` — `<role>` at L14 ✓
- `agents/gsd-planner.md` — `<role>` at L14 ✓
- `agents/gsd-executor.md` — `<role>` at L14 ✓
- `agents/gsd-verifier.md` — `<role>` at L14 ✓
- `agents/gsd-phase-researcher.md` — `<role>` at L14 ✓

The role block structure from Phase 7 is preserved. Note: gsd-executor.md and gsd-debugger.md have upstream-introduced framing violations (Category A above) in their bodies, but their `<role>` blocks are intact and unaffected by the fixes.

---

## Common Pitfalls

### Pitfall 1: Treating Roadmap Violation Counts as Current State
**What goes wrong:** The roadmap success criteria lists specific violations (spec-phase 1, debugger-philosophy 2, etc.) — if taken as the starting state for Plan 01, it implies scanner remediation work that does not exist.
**Root cause:** Roadmap was written before Phase 7 FORK-CORRUPTION triage resolved these exact violations.
**Prevention:** Always run `node --test tests/negative-framing-scan.test.cjs` as the first action in Plan 01 to confirm the actual starting state.
**Warning signs:** If scanner shows violations in the "confirmed" files, something regressed and Phase 7 triage output is suspect.

### Pitfall 2: Editing gsd-code-fixer.md Violations
**What goes wrong:** gsd-code-fixer.md shows 3 violations (L138, L240, L344). A scanner-first approach will surface these. If fixed in Phase 9, it creates scope creep and may alter behavior unexpectedly.
**Root cause:** These violations are documented as pre-existing in PROJECT.md §Out of Scope since v1.36.0.
**Prevention:** Check PROJECT.md §Out of Scope before committing any edit to gsd-code-fixer.md. Skip it.

### Pitfall 3: Touching Agent YAML Frontmatter
**What goes wrong:** `tests/agent-frontmatter.test.cjs` validates all agent frontmatter on every `npm test` run. Any modification to `name`, `description`, `tools`, `color`, `hooks` fails this test.
**Root cause:** Content edits sometimes accidentally affect surrounding YAML during line-by-line edits.
**Prevention:** Open the file, identify the `---` frontmatter block, and make zero changes inside it. Verify with `grep -n "^---" <file>` to locate frontmatter boundaries.

### Pitfall 4: Missing the Positive Complement Requirement
**What goes wrong:** Deleting the prohibition without adding a positive instruction ("What to do instead"). The scanner stops flagging the line, but the prompt loses behavioral guidance.
**Root cause:** It's easier to delete a line than construct an affirmative equivalent.
**Prevention:** Every fix must name the correct behavior: "Do NOT X" → "[Affirmative instruction specifying what to do instead of X]". The replacement must be semantically equivalent, not merely shorter.

### Pitfall 5: V09 Audit Scope Inflation (Plan 01)
**What goes wrong:** Treating the V09 audit as a rewrite pass — restructuring files that already meet quality bar, adding unnecessary sections, or expanding size beyond budget.
**Root cause:** V09 is a thorough guide; it's tempting to apply every dimension even when a file already satisfies it.
**Prevention:** For each dimension, first assess whether the current file already satisfies it. Fix only genuine gaps. Check `tests/agent-size-budget.test.cjs` passes after any expansion (34/34 currently passing).

### Pitfall 6: Conflating DO NOT Context (em-dash patterns inside prose)
**What goes wrong:** Flagging lines that have em-dash complements as violations. The `hasPositiveComplement()` function in the scanner exempts any line containing ` — ` (em-dash with spaces).
**Root cause:** Some valid constraint pairs look like violations at a glance.
**Prevention:** Before proposing a fix, run the specific line through `hasPositiveComplement()` or check for `—`, `. [A-Z]`, or `([content])` patterns. Lines with these patterns are not scanner violations.

### Pitfall 7: Leaving Pre-Existing Violations in VIOLATIONS.md as "To Fix"
**What goes wrong:** VIOLATIONS.md lists import.md, transition.md, verify-phase.md violations as requiring Phase 9 fixes, leading the executor to attempt them.
**Root cause:** Confusion between newly-introduced and pre-existing violations.
**Prevention:** In VIOLATIONS.md, clearly mark pre-existing violations with `STATUS: PRE-EXISTING — out of scope (same as gsd-code-fixer precedent)` so executor skips them.

---

## Code Examples

### Canonical Fix Pattern — DO NOT to Positive [VERIFIED: .planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md]

```markdown
# Before (violation):
Do NOT retry the AskUserQuestion or generate more questions when "Other" is selected with empty text.

# After (positive framing):
When "Other" is selected with empty text: wait for the user's next message, 
reflect it back, and continue from where you left off.
```

```markdown
# Before (violation):
- Do NOT fix them
- Do NOT re-run builds hoping they resolve themselves
- Do NOT restart the build to find more issues

# After (positive framing):
- Investigate root cause before attempting any fix
- Diagnose build failures from error output before re-running
- Identify all failing tests before modifying any file
```

### Valid Constraint Pairs (DO NOT touch these) [VERIFIED: scanner helper function]

```markdown
DO NOT use Write tool for rollback — a partial write corrupts the file.     ← VALID (em-dash)
**DO NOT flag style preferences.** Only flag issues that cause bugs.         ← VALID (period+sentence)
DO NOT use Bash for listing (use Glob tool instead)                          ← VALID (parenthetical)
Your job is not to confirm it works — it's to try to break it.               ← VALID (reframe)
NEVER X — always Y                                                           ← VALID (em-dash with alternative)
```

### V09 XML Structure Pattern [VERIFIED: .planning/references/PROMPT_ENGINEERING_GUIDE_V09.md, .planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md]

```xml
<intent>
{What the command achieves — one clear sentence}
</intent>

<context>
{Background; helpful but not critical — placed in MIDDLE}
</context>

<constraints>
  <permitted>
    - {Actions the agent may take}
  </permitted>
  <reserved_for_human_review>
    - {Actions requiring explicit confirmation}
  </reserved_for_human_review>
</constraints>

<execution_context>
@~/.claude/get-shit-done/workflows/{workflow}.md
</execution_context>
```

### Scanner Run Command [VERIFIED: test file invocation]

```bash
# Expected output when clean:
node --test tests/negative-framing-scan.test.cjs
# ℹ tests 34
# ℹ pass 34
# ℹ fail 0

# If violations exist, the output shows:
# AssertionError: NEVER directives found in agent files. Run plans/05...
# file.md:
#   line 42: NEVER add placeholder data
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual framing review | `negative-framing-scan.test.cjs` automated scanner | v1.36.0 Phase 3 | Violations caught instantly on every `npm test` |
| task→intent rename as primary gate | Full V09 quality bar (all 8 dimensions) | v1.36.0 Phase 2 precedent | Phase 9 applies full V09, not just framing |
| Count-based scope (193 files) | Scanner-first discovery | CONTEXT.md D-03 | Actual edit count expected 20–40; current research shows 8 upstream-introduced violations |
| gsd-code-fixer pre-existing violations "to fix" | Documented as out of scope | v1.36.0 milestone | Phase 9 does not touch these 3 lines |

---

## Assumptions Log

> All claims tagged `[ASSUMED]` in this research.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Pre-existing violations in import.md, transition.md (2), verify-phase.md (1) should be treated as out-of-scope per the same gsd-code-fixer precedent | Plan 02 scope | If user wants them fixed, 4 additional edits needed — low-risk additions if incorrect |

**If this table had only one entry:** Almost all claims were verified against the live codebase, scanner output, and git history. The sole assumed decision is the scope treatment of pre-existing violations outside gsd-code-fixer.

---

## Open Questions (RESOLVED)

1. **Pre-existing violations: fix in Phase 9 or defer?**
   - What we know: import.md (L276), transition.md (L568, L569), verify-phase.md (L241) were all present before the v1.37.1 merge — they are not upstream-introduced degradation.
   - What is unclear: Whether Phase 9 should fix them anyway (opportunistic improvement) or maintain strict scope discipline.
   - Recommendation: Follow gsd-code-fixer precedent — treat as out of scope. Document in VIOLATIONS.md as "pre-existing, deferred." Planner should implement this default unless user overrides.
   - **RESOLVED: Treat pre-existing violations as out-of-scope per gsd-code-fixer precedent — documented in VIOLATIONS.md Category B.**

2. **V09 audit depth for workflow files in Plan 01**
   - What we know: Workflow files (sketch.md, spec-phase.md, spike.md, etc.) are complex, multi-step documents. Full V09 audit is the stated standard (D-02).
   - What is unclear: Whether these workflows already match V09 structure or need significant restructuring.
   - Recommendation: Auditor should read each workflow end-to-end against the PROMPT_IMPROVEMENT_GUIDE_V01.md checklist. The prior v1.36.0 Phase 2 pass established the pattern.
   - **RESOLVED: Full V09 audit per D-02; analogs (spike.md, sketch.md) are assumed conformant and used as structural references without re-auditing.**

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Scanner, `npm test` | Yes | v22.x (inferred from npm test working) | — |
| `tests/negative-framing-scan.test.cjs` | Plan 01 scanner gate, Plan 02 triage | Yes | Current | — |
| `npm test` | D-04 no-regressions gate | Yes | Working — 4112 tests, 4110 pass | — |
| git CLI | Plan 02 pre-merge diff triage | Yes | Working — merge history verified | — |
| `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md` | Plan 01 V09 audit | Yes | Confirmed at repo root | — |
| `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md` | Plan 01 audit process | Yes | Confirmed at repo root | — |

**Missing dependencies with no fallback:** None.

**Current test suite state:** [VERIFIED: npm test run 2026-04-18]
- Total: 4112 tests
- Pass: 4110
- Fail: 2 (managed-hooks.test.cjs: gsd-read-injection-scanner.js missing from MANAGED_HOOKS; verification-overrides.test.cjs: required_reading block position — both are Phase 10 scope, pre-existing from Phase 7 baseline)
- Phase 9 must not increase the failure count

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (`node:test`) |
| Config file | `package.json` scripts section (runs `run-tests.cjs`) |
| Quick scanner run | `node --test tests/negative-framing-scan.test.cjs` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NEW-01 through NEW-20 | Positive framing standard | Automated scan | `node --test tests/negative-framing-scan.test.cjs` | Yes |
| NEW-01 through NEW-20 | V09 structural quality | Manual audit | Read file against checklist in PROMPT_IMPROVEMENT_GUIDE_V01.md | N/A — manual |
| MOD-01 | gsd-debugger, gsd-executor violations fixed | Automated scan | `node --test tests/negative-framing-scan.test.cjs` | Yes |
| MOD-02 | Modified commands pass framing | Automated scan | `node --test tests/negative-framing-scan.test.cjs` | Yes |
| MOD-03 | Modified references pass framing | Automated scan | `node --test tests/negative-framing-scan.test.cjs` | Yes |
| MOD-04 | Modified workflows (new violations fixed) | Automated scan | `node --test tests/negative-framing-scan.test.cjs` | Yes |
| D-04 | No regression in test suite | Full suite | `npm test` (gate: ≥ 4110/4112) | Yes |

### Sampling Rate

- **Per task commit:** `node --test tests/negative-framing-scan.test.cjs` (30s max)
- **Per wave merge:** `npm test` (full suite ~30s)
- **Phase gate:** Full suite ≥ 4110/4112 before marking phase complete

### Wave 0 Gaps

None — existing test infrastructure covers all automated validation requirements. The V09 structural audit is by nature a manual process (no automated test exists for XML tag presence or context placement quality).

---

## Security Domain

> Not applicable to this phase — Phase 9 is a prompt engineering quality pass on text files only. No code changes, no authentication, no data handling, no external services.

---

## Sources

### Primary (HIGH confidence)

- `tests/negative-framing-scan.test.cjs` — Scanner logic, exemption rules, scan directories, invocation
- `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md` — V09 quality bar, XML tag vocabulary, all 23 sections
- `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md` — 8-step improvement process, Final Checklist (30 items)
- `.planning/phases/09-fork-standards-pass/09-CONTEXT.md` — Locked decisions D-01 through D-04
- `.planning/REQUIREMENTS.md` §Fork Standards — NEW-01 through NEW-20, MOD-01 through MOD-04
- `.planning/PROJECT.md` — Constraints, Out of Scope declarations, Key Decisions
- `.planning/phases/07-merge-and-conflict-resolution/07-02-SUMMARY.md` — Phase 7 triage decisions

### Secondary (MEDIUM confidence)

- Live scanner run (`node --test tests/negative-framing-scan.test.cjs`) — confirmed 34/34 pass
- Live scanner on 19 new files — confirmed 0 violations
- Live scanner on 122 upstream-modified files — confirmed 8 files with 15 violations
- `npm test` run — confirmed 4110/4112 pass, 2 failures (pre-existing Phase 10 scope)
- `git diff a7abc5c 14ca3f4` — confirmed 122 prompt files modified in merge
- `git show a7abc5c:<file>` — confirmed pre-existing violations in import.md, transition.md, verify-phase.md

### Flagged for Validation (LOW confidence)

None — all key findings were verified against live codebase state.

---

## Metadata

**Confidence breakdown:**
- Scanner behavior: HIGH — direct source code read + live execution
- Plan 01 new file baseline: HIGH — scanner run on all 19 files confirmed
- Plan 02 violation catalog: HIGH — scanner run on all 122 modified files + git history for pre-existing classification
- 5 agent role block preservation: HIGH — direct grep of current files
- V09 audit scope for new files: HIGH — confirmed in D-02 locked decision
- Pre-existing violation scope decision: MEDIUM — based on PROJECT.md precedent; could be overridden

**Research date:** 2026-04-18
**Valid until:** 2026-05-18 (stable file-based domain; scanner logic does not change frequently)
