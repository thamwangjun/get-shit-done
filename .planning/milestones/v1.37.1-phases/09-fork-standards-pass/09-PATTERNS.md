# Phase 9: Fork Standards Pass - Pattern Map

**Mapped:** 2026-04-18
**Files analyzed:** 24 (19 new files for V09 audit + 5 modified files with upstream-introduced violations + VIOLATIONS.md to create)
**Analogs found:** 24 / 24

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `commands/gsd/inbox.md` | command (prompt) | request-response | `commands/gsd/spike.md` | exact — same `<objective>` + `<execution_context>` + `<context>` + `<process>` structure |
| `commands/gsd/sketch.md` | command (prompt) | request-response | `commands/gsd/spike.md` | exact |
| `commands/gsd/sketch-wrap-up.md` | command (prompt) | request-response | `commands/gsd/spike-wrap-up.md` | exact |
| `commands/gsd/spec-phase.md` | command (prompt) | request-response | `commands/gsd/spike.md` | exact — uses `<objective>` + `<success_criteria>` extension |
| `commands/gsd/spike.md` | command (prompt) | request-response | `commands/gsd/spec-phase.md` | exact |
| `commands/gsd/spike-wrap-up.md` | command (prompt) | request-response | `commands/gsd/sketch-wrap-up.md` | exact |
| `get-shit-done/references/autonomous-smart-discuss.md` | reference (injected fragment) | transform | `get-shit-done/references/project-skills-discovery.md` | role-match |
| `get-shit-done/references/debugger-philosophy.md` | reference (injected fragment) | transform | `get-shit-done/references/sketch-interactivity.md` | role-match |
| `get-shit-done/references/mandatory-initial-read.md` | reference (injected fragment) | request-response | `get-shit-done/references/project-skills-discovery.md` | role-match |
| `get-shit-done/references/project-skills-discovery.md` | reference (injected fragment) | request-response | `get-shit-done/references/mandatory-initial-read.md` | exact |
| `get-shit-done/references/sketch-interactivity.md` | reference (injected fragment) | transform | `get-shit-done/references/debugger-philosophy.md` | exact |
| `get-shit-done/references/sketch-theme-system.md` | reference (injected fragment) | transform | `get-shit-done/references/sketch-interactivity.md` | exact |
| `get-shit-done/references/sketch-tooling.md` | reference (injected fragment) | transform | `get-shit-done/references/sketch-interactivity.md` | exact |
| `get-shit-done/references/sketch-variant-patterns.md` | reference (injected fragment) | transform | `get-shit-done/references/sketch-interactivity.md` | exact |
| `get-shit-done/workflows/sketch.md` | workflow (prompt orchestration) | event-driven, multi-step | `get-shit-done/workflows/spike.md` | exact — same `<purpose>` + `<required_reading>` + `<process>/<step>` structure |
| `get-shit-done/workflows/sketch-wrap-up.md` | workflow (prompt orchestration) | event-driven, multi-step | `get-shit-done/workflows/spike-wrap-up.md` | exact |
| `get-shit-done/workflows/spec-phase.md` | workflow (prompt orchestration) | event-driven, multi-step | `get-shit-done/workflows/spike.md` | role-match |
| `get-shit-done/workflows/spike.md` | workflow (prompt orchestration) | event-driven, multi-step | `get-shit-done/workflows/sketch.md` | exact |
| `get-shit-done/workflows/spike-wrap-up.md` | workflow (prompt orchestration) | event-driven, multi-step | `get-shit-done/workflows/sketch-wrap-up.md` | exact |
| `agents/gsd-debugger.md` (L1074, L1135) | agent (prompt) | request-response | `agents/gsd-executor.md` (framing fix pattern) | exact — same violation class; same fix strategy |
| `agents/gsd-executor.md` (L202, L203, L209) | agent (prompt) | request-response | Phase 7 commit `928a206` framing fix pattern | exact |
| `get-shit-done/workflows/discuss-phase.md` (L122) | workflow (prompt) | event-driven | `get-shit-done/workflows/verify-work.md` (L248) | role-match |
| `get-shit-done/workflows/verify-work.md` (L248) | workflow (prompt) | event-driven | `get-shit-done/workflows/discuss-phase.md` (L122) | role-match |
| `get-shit-done/workflows/transition.md` (L534) | workflow (prompt) | event-driven | Phase 7 commit `928a206` framing fix pattern | role-match |
| `.planning/phases/09-fork-standards-pass/09-VIOLATIONS.md` | doc (audit record) | batch | `.planning/research/VIOLATIONS.md` | exact — same structure |

---

## Pattern Assignments

### Plan 01: New Files — V09 Structural Audit

#### Command Files Pattern

**Primary analog:** `commands/gsd/spike.md` (lines 1–41)

All 6 command files share the same V09-conformant structure. Use `spike.md` as the quality reference when auditing the others.

**Compliant command structure** (`commands/gsd/spike.md`, lines 1–41):
```markdown
---
name: gsd:<name>
description: <one-line description>
argument-hint: "<args>"
allowed-tools:
  - Read
  - Write
  ...
---
<objective>
{What the command achieves — one clear sentence or short paragraph. Position: HIGH attention (top).}
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/<workflow>.md
@~/.claude/get-shit-done/references/<ref>.md
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `AskUserQuestion`.
</runtime_note>

<context>
{Variable substitution and flag descriptions. Position: MIDDLE.}
$ARGUMENTS
</context>

<process>
Execute the <name> workflow from @~/.claude/get-shit-done/workflows/<name>.md end-to-end.
</process>
```

**Extended variant** (`commands/gsd/spec-phase.md`, lines 14–62) — adds `<success_criteria>` when the command has measurable acceptance criteria:
```markdown
<success_criteria>
- {Falsifiable criterion 1}
- {Falsifiable criterion 2}
</success_criteria>
```

**V09 dimensions to check per command file:**

| Dimension | Check | Common gap |
|-----------|-------|-----------|
| Task specification | `<objective>` present, one clear sentence | Absent or buried in `<context>` |
| Context placement | `<objective>` first, `<context>` middle, `<process>` last | `<context>` placed before `<objective>` |
| Positive framing | Zero bare negative directives | Scanner will catch |
| Constraint enforcement | `<constraints>` present only if behavioral rules exist; must pair `<permitted>` + restriction | Not applicable to thin command wrappers |
| CoT gating | No chain-of-thought trigger unless multi-step symbolic reasoning | Commands typically do not need CoT |
| Persona | Present only if open-ended creative task | Commands typically do not need persona |
| Compression | No padding; process block is a delegation sentence | Multi-paragraph process blocks are a gap |

---

#### Workflow Files Pattern

**Primary analog:** `get-shit-done/workflows/spike.md` (lines 1–57)

All 5 workflow files share the same V09-conformant structure. Use `spike.md` as the quality reference.

**Compliant workflow structure** (`get-shit-done/workflows/spike.md`, lines 1–10):
```markdown
<purpose>
{One-paragraph description of what the workflow produces and where artifacts land.
Companion workflow reference if applicable.}
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="<step_name>">
{Step content}
</step>

...

</process>
```

**Sketch workflow variant** (`get-shit-done/workflows/sketch.md`, lines 1–14) — adds explicit `@file` includes inside `<required_reading>` when the workflow itself references resources not loaded by the command:
```markdown
<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.

@~/.claude/get-shit-done/references/sketch-theme-system.md
@~/.claude/get-shit-done/references/sketch-variant-patterns.md
@~/.claude/get-shit-done/references/sketch-interactivity.md
@~/.claude/get-shit-done/references/sketch-tooling.md
</required_reading>
```

**V09 dimensions to check per workflow file:**

| Dimension | Check | Common gap |
|-----------|-------|-----------|
| Task specification | `<purpose>` present; one clear sentence about what is produced | Missing or merged with first step |
| Context placement | `<purpose>` first, `<required_reading>` second, `<process>` last | `<process>` placed before `<purpose>` |
| XML structure | All sections in named XML tags; `<step name="...">` for each discrete action | Steps using `##` markdown headers instead of `<step>` tags |
| Positive framing | Zero bare negative directives (scanner gate) | Covered by scanner run |
| Priority ordering | Explicit ordering within steps when multiple criteria apply | Implicit ordering |
| Constraint enforcement | Restrictions inside `<step>` context are paired with an affirmative alternative | Bare prohibitions |

---

#### Reference Files Pattern

**Primary analogs:** `get-shit-done/references/sketch-interactivity.md` (complete) and `get-shit-done/references/project-skills-discovery.md` (complete)

Reference files are injected fragments loaded via `@file` includes into agent/workflow context. They do NOT require command-layer XML structure. They use plain Markdown with section headers.

**Sketch-interactivity pattern** (reference, data/rule table format, lines 1–42):
```markdown
# {Title}

{One-sentence purpose statement.}

## {Section}

| {Col} | {Col} |
|-------|-------|
| {item} | {rule} |

## {Section}

{Descriptive prose with code example where applicable.}
```

**Project-skills-discovery pattern** (reference, procedural-steps format, lines 1–20):
```markdown
# {Title}

{One-sentence purpose statement.}

**{Section label} (shared across all GSD agents):**
1. {Step}
2. {Step}
...

**{Application section}**
- {Role}: {how rule applies}
```

**V09 dimensions applicable to reference files:**

| Dimension | Check | Note |
|-----------|-------|------|
| Task specification | Clear `# Title` + one-line purpose | Pure data docs may omit `<task>` XML — that is acceptable |
| Positive framing | Zero bare negative directives | Scanner covers this |
| XML structure | Not required for data/reference documents — plain Markdown is correct | Do NOT add XML tags to data docs |
| Compression | Content tightly scoped to the injection purpose; no padding | Check for redundant sections |

**Key judgment:** Reference files that are pure data (tables, code examples, taxonomy) do not need XML wrapping. Reference files that contain behavioral instructions for the agent should use a `<task>` or `<purpose>` block. Distinguish before auditing.

---

### Plan 02: Modified Files — Upstream-Introduced Violation Fixes

#### Violation Fix Pattern

**Primary analog:** Phase 7 commit `928a206` — `fix(07-02): restore fork-specific patches lost during upstream merge`

That commit demonstrates the canonical fix approach: identify the exact violation line, determine the correct affirmative behavior from surrounding context, replace using the Edit tool with a targeted line replacement.

**Fix template** (from `plans/05-POSITIVE_FRAMING_PASS_V01.md`, lines 49–75):
```
Before (violation): Do NOT X
After (positive):   [Affirmative instruction specifying what to do instead of X]

Rule: The replacement MUST name the correct behavior. Deleting the prohibition without
adding a positive instruction is not a valid fix.
```

**5 files requiring fixes and their violation lines:**

**File 1: `agents/gsd-debugger.md`** — 2 violations

Line 1074 (current text):
```markdown
**Do NOT proceed to fix_and_verify.**
```
Context: This line ends the `investigation_loop` step when root cause is not confirmed. The constraint guards against premature progression.

Line 1135 (current text):
```markdown
Do NOT move file to `resolved/` in this step.
```
Context: This appears in the `fix_and_verify` step, before human confirmation of fix.

**Fix pattern from RESEARCH.md** (conversion table):
```markdown
# Before (violation):
Do NOT proceed to fix_and_verify.

# After (positive framing):
Stop here — surface the finding to the human before fixing.
```
```markdown
# Before (violation):
Do NOT move file to `resolved/` in this step.

# After (positive framing):
Move file to `resolved/` only after human confirmation in `archive_session`.
```

---

**File 2: `agents/gsd-executor.md`** — 3 violations

Lines 202, 203 (current text, consecutive):
```markdown
- Do NOT fix them
- Do NOT re-run builds hoping they resolve themselves
```
Context: Scope boundary — out-of-scope issues discovered during current task. Deferred items go to `deferred-items.md`.

Line 209 (current text):
```markdown
- Do NOT restart the build to find more issues
```
Context: Fix attempt limit guard — after 3 auto-fix attempts, executor stops and documents.

**Fix pattern from RESEARCH.md** (code examples section):
```markdown
# Before (violations, lines 202-203):
- Do NOT fix them
- Do NOT re-run builds hoping they resolve themselves

# After (positive framing):
- Investigate root cause before attempting any fix
- Diagnose build failures from error output before re-running
```
```markdown
# Before (violation, line 209):
- Do NOT restart the build to find more issues

# After (positive framing):
- Identify all failing tests before modifying any file
```

---

**File 3: `get-shit-done/workflows/discuss-phase.md`** — 1 violation

Line 122 (current text):
```markdown
Do NOT retry the AskUserQuestion or generate more questions when "Other" is selected with empty text.
```
Context: Exception-branch instruction for the "Other" TUI option with empty body. Step 1–4 above it already specify the positive behavior: wait, reflect, continue.

**Fix pattern from RESEARCH.md** (code examples section):
```markdown
# Before (violation):
Do NOT retry the AskUserQuestion or generate more questions when "Other" is selected with empty text.

# After (positive framing):
When "Other" is selected with empty text: wait for the user's next message,
reflect it back, and continue from where you left off.
```

---

**File 4: `get-shit-done/workflows/verify-work.md`** — 1 violation

Line 248 (current text):
```markdown
- Do NOT add commentary before or after the block.
```
Context: Response hygiene section inside a checkpoint output step. The positive instruction precedes it: "Your entire response MUST equal `{CHECKPOINT}` byte-for-byte."

**Fix** (the positive behavior is already stated; this line is redundant reinforcement):
```markdown
# Before (violation):
- Do NOT add commentary before or after the block.

# After (positive framing / remove redundancy):
[Remove this line — the preceding sentence "Your entire response MUST equal {CHECKPOINT} byte-for-byte" already states the positive behavior completely.]
```
Alternative if context is needed: `Output only the checkpoint block — discard any prefix or suffix text.`

---

**File 5: `get-shit-done/workflows/transition.md`** — 1 violation

Line 534 (current text):
```markdown
Override auto-advance: do NOT auto-continue to milestone completion.
```
Context: Inside `<if mode="yolo">` block — guards against auto-chaining when a blocking condition is detected. Positive behavior: present the blocking information and stop.

**Fix**:
```markdown
# Before (violation):
Override auto-advance: do NOT auto-continue to milestone completion.

# After (positive framing):
Override auto-advance: present the blocking information and stop here.
```

---

### `09-VIOLATIONS.md` (audit record)

**Analog:** `.planning/research/VIOLATIONS.md` (lines 1–329)

That file is the canonical VIOLATIONS.md from the v1.36.0 post-merge audit. Phase 9's VIOLATIONS.md follows the same structure but scoped to Phase 9 findings only.

**Structure to copy** (from `.planning/research/VIOLATIONS.md`, lines 1–28):
```markdown
# Prompt Standards Violation Audit

**Branch:** `thamw-main`
**Audited against:** `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md`, `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md`
**Trigger:** {trigger description}
**Date:** {date}

---

## Summary

| Category | Violation Count | Files Affected | Status |
|----------|----------------|----------------|--------|
| Upstream-introduced framing violations | 8 | 5 files | FIX IN PHASE 9 |
| Pre-existing framing violations (non-gsd-code-fixer) | 4 | 3 files | PRE-EXISTING — out of scope |
| gsd-code-fixer pre-existing violations | 3 | 1 file | OUT OF SCOPE (PROJECT.md precedent) |

---

## Category A: Upstream-Introduced Violations (Fix in Phase 9)

| File | Line | Violation Text | Status |
|------|------|----------------|--------|
| `agents/gsd-debugger.md` | L1074 | `**Do NOT proceed to fix_and_verify.**` | TO FIX |
...

## Category B: Pre-Existing Violations (Out of Scope)

| File | Line | Violation Text | Status |
|------|------|----------------|--------|
| `agents/gsd-code-fixer.md` | L138, L240, L344 | ... | PRE-EXISTING — out of scope per PROJECT.md §Out of Scope |
| `get-shit-done/workflows/import.md` | L276 | ... | PRE-EXISTING — out of scope (same precedent as gsd-code-fixer) |
...
```

---

## Shared Patterns

### Positive Framing Replacement Rule
**Source:** `plans/05-POSITIVE_FRAMING_PASS_V01.md` (lines 49–75) + `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md` Step 2
**Apply to:** All 5 files with upstream-introduced violations (Plan 02)

```
Rule: Every "Do NOT X" or "NEVER X" must be replaced with an affirmative instruction
that names the correct behavior. The replacement must be semantically equivalent
to the prohibition, not merely shorter.

Constraint pair rule: If removing a negative leaves only a prohibition with no positive
alternative, add the positive. Both parts must be present.
```

**Conversion table (from `plans/05-POSITIVE_FRAMING_PASS_V01.md`, lines 53–71):**

| Negative (remove) | Positive (replace with) |
|---|---|
| `do not proceed` | `stop here` or `stop and report the blocking condition` |
| `do not re-run` | `diagnose from error output before re-running` |
| `do not restart` | `identify all failing tests before modifying any file` |
| `do not fix them` | `investigate root cause before attempting any fix` |
| `do not X (redundant after positive already stated)` | Remove the clause |

### Scanner Invocation Pattern
**Source:** `tests/negative-framing-scan.test.cjs` (invocation) + RESEARCH.md §Scanner Invocation
**Apply to:** Every Plan 01 and Plan 02 task commit

```bash
# After each file edit — fast framing check (34 tests, ~30s):
node --test tests/negative-framing-scan.test.cjs

# Expected output when clean:
# ℹ tests 34
# ℹ pass 34
# ℹ fail 0

# After wave merge — full suite gate (D-04):
npm test
# Gate: ≥ 4110/4112 pass
```

### Pre-Merge Diff Pattern (Plan 02 triage)
**Source:** RESEARCH.md §Pre-Merge Diff Commands
**Apply to:** Any additional files that need diff-based triage beyond the 5 confirmed violation files

```bash
# Extract pre-merge version of a file for comparison:
git show a7abc5c:<file>

# Compare pre-merge vs current for a specific file:
git diff a7abc5c -- <file>

# Key refs:
# Pre-merge fork HEAD: a7abc5c8bac35a24bf1b664035a55822d0562c11
# Upstream v1.37.1 merge commit: 14ca3f4
```

### Frontmatter Preservation Rule
**Source:** `plans/05-POSITIVE_FRAMING_PASS_V01.md` (lines 115–122) + `tests/agent-frontmatter.test.cjs`
**Apply to:** All agent file edits in Plan 02

```
Rule: The YAML frontmatter block (between --- delimiters) must not be touched.
Locate frontmatter boundaries before editing:
  grep -n "^---" <file>
Make zero changes inside the frontmatter block.
```

### Edit Tool Pattern (targeted replacement)
**Source:** `plans/05-POSITIVE_FRAMING_PASS_V01.md` (lines 90–100)
**Apply to:** All Plan 02 framing fixes

```
Use targeted Edit tool replacements — never full rewrites.
Each edit replaces exactly the violation line(s) with the positive alternative.
Report after each edit: file | line | old text | new text
```

### Valid Constraint Pair Exemptions (DO NOT touch these)
**Source:** `tests/negative-framing-scan.test.cjs` scanner logic + RESEARCH.md §Architecture Patterns
**Apply to:** Any line that looks like a violation during V09 audit or Plan 02 triage

```markdown
DO NOT use Write tool for rollback — a partial write corrupts the file.   ← VALID (em-dash)
**DO NOT flag style preferences.** Only flag issues that cause bugs.       ← VALID (period+sentence)
DO NOT use Bash for listing (use Glob tool instead)                        ← VALID (parenthetical)
Your job is not to confirm it works — it's to try to break it.             ← VALID (reframe)
NEVER X — always Y                                                         ← VALID (em-dash + alternative)
```

### Role Block Preservation Check (5 agents)
**Source:** RESEARCH.md §5 Refactored Agents — Preservation Verification
**Apply to:** Any edit to gsd-debugger, gsd-executor, gsd-planner, gsd-verifier, gsd-phase-researcher

```bash
# Confirm <role> block at line 14 is intact after edits:
grep -n "<role>" agents/gsd-debugger.md
grep -n "<role>" agents/gsd-executor.md
# Expected: each shows line 14
```

---

## No Analog Found

All files in this phase have analogs in the codebase. No files require falling back to RESEARCH.md patterns exclusively.

---

## Metadata

**Analog search scope:** `commands/gsd/`, `get-shit-done/workflows/`, `get-shit-done/references/`, `agents/`, `plans/`, `.planning/research/`, `tests/`, git history (commit `928a206`)
**Files scanned:** 14 prompt files (command + workflow + reference analogs) + 5 violation files + 2 plan files + 1 research VIOLATIONS.md + 1 scanner test + git diff output
**Pattern extraction date:** 2026-04-18
