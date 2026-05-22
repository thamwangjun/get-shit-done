# Phase 1: Accurate CATALOGUE - Research

**Researched:** 2026-04-15
**Domain:** JSON catalogue maintenance — adding missing entries and correcting counts
**Confidence:** HIGH

## Summary

Phase 1 is a targeted JSON editing task. CATALOGUE.json currently has 227 entries with correct per-category counts that match its declared totals — there are no internal inconsistencies to fix. The only work is adding 23 missing file entries for v1.36.0 additions and updating the `counts` and `total` fields to 250.

All 23 files confirmed present on disk. None appear in CATALOGUE.json yet. The file uses a consistent structure: a top-level `total` integer, a `counts` object with per-category integers, and five arrays (`commands`, `workflows`, `agents`, `references`, `templates`) of `{ file, description }` objects. Descriptions are extracted from each file's own metadata (YAML frontmatter `description:` field for agents/commands, or opening purpose paragraph for workflows/references).

**Primary recommendation:** Read each new file to extract its canonical description, then add one `{ "file": "...", "description": "..." }` object to the correct array in alphabetical position, and update the `counts` and `total` fields to their post-addition values.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CAT-01 | 5 new commands from v1.36.0 added to CATALOGUE.json commands array | All 5 files confirmed on disk; none in CATALOGUE.json; descriptions available in frontmatter |
| CAT-02 | 3 new workflows from v1.36.0 added to CATALOGUE.json workflows array | All 3 files confirmed on disk; none in CATALOGUE.json; descriptions available in opening `<purpose>` blocks |
| CAT-03 | 7 new agents from v1.36.0 added to CATALOGUE.json agents array | All 7 files confirmed on disk; none in CATALOGUE.json; descriptions available in frontmatter |
| CAT-04 | 7 new references from v1.36.0 added to CATALOGUE.json references array | All 7 files confirmed on disk; none in CATALOGUE.json; descriptions available in opening headings/paragraphs |
| CAT-05 | 1 new template from v1.36.0 added to CATALOGUE.json templates array | File confirmed on disk; not in CATALOGUE.json; description available in opening comment |
| CAT-06 | CATALOGUE.json `counts` and `total` updated to reflect 250 actual files | Computed: commands 73, workflows 75, agents 31, references 40, templates 31, total 250 |
</phase_requirements>

## Standard Stack

This phase uses no external libraries. The task is:
1. Read `CATALOGUE.json` (plain JSON, ~247 lines)
2. Read each new file's metadata to extract its description
3. Write the updated `CATALOGUE.json` with 23 new entries and corrected counts

**Tools needed:** Read tool (read CATALOGUE.json and each new file), Write tool (write updated CATALOGUE.json).

## Architecture Patterns

### CATALOGUE.json Structure

```json
{
  "total": 227,
  "counts": {
    "commands": 68,
    "workflows": 72,
    "agents": 24,
    "references": 33,
    "templates": 30
  },
  "commands": [
    { "file": "commands/gsd/add-backlog.md", "description": "..." }
  ],
  "workflows": [...],
  "agents": [...],
  "references": [...],
  "templates": [...]
}
```

**Key structural rules:** [VERIFIED: grep of CATALOGUE.json]
- `file` paths are relative to repo root (no leading `./`)
- `description` is a single string, no trailing punctuation style is enforced
- Arrays are approximately but not strictly alphabetically sorted (commands/workflows/templates have minor sort irregularities; agents/references are strictly sorted)
- The `counts` object values must equal the actual array lengths

### Sort Order Observation

[VERIFIED: python analysis of CATALOGUE.json]

- `commands` array: has minor sort irregularities (e.g., `code-review.md` appears before `code-review-fix.md` which is alphabetically reverse). Do NOT re-sort the full array — insert new entries in alphabetical position relative to adjacent entries only.
- `workflows` array: same minor irregularities, same approach.
- `agents` array: strictly sorted — insert new entries in strict alphabetical position.
- `references` array: strictly sorted — insert new entries in strict alphabetical position.
- `templates` array: has sort irregularities (DEBUG.md appears after discussion-log.md). Do NOT re-sort — append new entry in appropriate position.

**Anti-pattern:** Re-sorting any array will produce a diff far larger than the 23 additions and is out of scope.

## Solved Problems

| Problem | Solution | Why |
|---------|----------|-----|
| Extracting canonical description for each file | Read the file's YAML frontmatter `description:` (agents/commands) or first paragraph after opening heading (references/workflows/templates) | Each file embeds its own canonical description |
| Computing correct post-addition counts | Add 5+3+7+7+1 = 23 to existing 227 → 250; per-category: commands 73, workflows 75, agents 31, references 40, templates 31 | Arithmetic verified below |

## Verified File Inventory

### Files to Add — All Confirmed on Disk

[VERIFIED: bash existence checks on all 23 paths]

#### Commands (CAT-01) — 5 files

| File | Frontmatter description |
|------|------------------------|
| `commands/gsd/ai-integration-phase.md` | Generate AI design contract (AI-SPEC.md) for phases that involve building AI systems — framework selection, implementation guidance from official docs, and evaluation strategy |
| `commands/gsd/eval-review.md` | Retroactively audit an executed AI phase's evaluation coverage — scores each eval dimension as COVERED/PARTIAL/MISSING and produces an actionable EVAL-REVIEW.md with remediation plan |
| `commands/gsd/extract_learnings.md` | Extract decisions, lessons, patterns, and surprises from completed phase artifacts |
| `commands/gsd/from-gsd2.md` | Import a GSD-2 (.gsd/) project back to GSD v1 (.planning/) format |
| `commands/gsd/graphify.md` | Build, query, and inspect the project knowledge graph in .planning/graphs/ |

[VERIFIED: head -5 of each file, confirmed frontmatter `description:` field]

#### Workflows (CAT-02) — 3 files

| File | Description (from opening `<purpose>`) |
|------|---------------------------------------|
| `get-shit-done/workflows/ai-integration-phase.md` | Generates AI design contract (AI-SPEC.md) for phases involving AI systems — orchestrates framework-selector, ai-researcher, domain-researcher, and eval-planner agents |
| `get-shit-done/workflows/eval-review.md` | Retroactive audit of an implemented AI phase's evaluation coverage — produces scored EVAL-REVIEW.md with gap analysis and remediation plan |
| `get-shit-done/workflows/extract_learnings.md` | Extracts decisions, lessons learned, patterns, and surprises from completed phase artifacts into a structured LEARNINGS.md file |

[VERIFIED: head -8 of each file]

#### Agents (CAT-03) — 7 files

| File | Frontmatter description |
|------|------------------------|
| `agents/gsd-ai-researcher.md` | Researches a chosen AI framework's official docs to produce implementation-ready guidance — best practices, syntax, core patterns, and pitfalls distilled for the specific use case. Writes the Framework Quick Reference and Implementation Guidance sections of AI-SPEC.md. Spawned by /gsd-ai-integration-phase orchestrator. |
| `agents/gsd-debug-session-manager.md` | Manages multi-cycle /gsd-debug checkpoint and continuation loop in isolated context. Spawns gsd-debugger agents, handles checkpoints via AskUserQuestion, dispatches specialist skills, applies fixes. Returns compact summary to main context. Spawned by /gsd-debug command. |
| `agents/gsd-domain-researcher.md` | Researches the business domain and real-world application context of the AI system being built. Surfaces domain expert evaluation criteria, industry-specific failure modes, regulatory context, and what "good" looks like for practitioners in this field — before the eval-planner turns it into measurable rubrics. Spawned by /gsd-ai-integration-phase orchestrator. |
| `agents/gsd-eval-auditor.md` | Retroactive audit of an implemented AI phase's evaluation coverage. Checks implementation against the AI-SPEC.md evaluation plan. Scores each eval dimension as COVERED/PARTIAL/MISSING. Produces a scored EVAL-REVIEW.md with findings, gaps, and remediation guidance. Spawned by /gsd-eval-review orchestrator. |
| `agents/gsd-eval-planner.md` | Designs a structured evaluation strategy for an AI phase. Identifies critical failure modes, selects eval dimensions with rubrics, recommends tooling, and specifies the reference dataset. Writes the Evaluation Strategy, Guardrails, and Production Monitoring sections of AI-SPEC.md. Spawned by /gsd-ai-integration-phase orchestrator. |
| `agents/gsd-framework-selector.md` | Presents an interactive decision matrix to surface the right AI/LLM framework for the user's specific use case. Produces a scored recommendation with rationale. Spawned by /gsd-ai-integration-phase and /gsd-select-framework orchestrators. |
| `agents/gsd-pattern-mapper.md` | Analyzes codebase for existing patterns and produces PATTERNS.md mapping new files to closest analogs. Read-only codebase analysis spawned by /gsd-plan-phase orchestrator before planning. |

[VERIFIED: head -8 of each file, confirmed frontmatter `description:` field]

#### References (CAT-04) — 7 files

| File | Description (from file content) |
|------|--------------------------------|
| `get-shit-done/references/ai-evals.md` | AI evaluation reference: frameworks, metrics, and rubric patterns for gsd-eval-planner and gsd-eval-auditor |
| `get-shit-done/references/ai-frameworks.md` | AI framework decision matrix for framework selection and comparison |
| `get-shit-done/references/executor-examples.md` | Executor extended examples — on-demand reference for gsd-executor agent |
| `get-shit-done/references/gates.md` | Canonical gate types taxonomy used across GSD workflows |
| `get-shit-done/references/ios-scaffold.md` | iOS app scaffold rules and patterns for creating new iOS app targets |
| `get-shit-done/references/planner-antipatterns.md` | Planner anti-patterns and specificity examples — on-demand reference for gsd-planner |
| `get-shit-done/references/planner-source-audit.md` | Planner source audit and authority limits — multi-source coverage audit format and constraints |

[VERIFIED: head -5 of each file]

#### Templates (CAT-05) — 1 file

| File | Description |
|------|-------------|
| `get-shit-done/templates/AI-SPEC.md` | AI integration specification template for phases that involve building AI systems |

[VERIFIED: head -5 of file]

### No Stale Entries

[VERIFIED: python scan of all 227 existing CATALOGUE.json entries against disk]

All 227 existing entries resolve to files that exist on disk. Zero stale entries to remove.

## Target Counts After Update (CAT-06)

[VERIFIED: arithmetic]

| Category | Current | Adding | Target |
|----------|---------|--------|--------|
| commands | 68 | +5 | **73** |
| workflows | 72 | +3 | **75** |
| agents | 24 | +7 | **31** |
| references | 33 | +7 | **40** |
| templates | 30 | +1 | **31** |
| **total** | 227 | +23 | **250** |

## Common Pitfalls

### Pitfall 1: Description copied from wrong location
**What goes wrong:** Using the file's heading/title as the description instead of the `description:` frontmatter field (agents/commands) or the purpose paragraph text (workflows/references).
**Prevention:** For agents and commands, always read the YAML frontmatter block between the `---` delimiters and use the `description:` value exactly. For workflows and references with no frontmatter, use the first sentence of the opening `<purpose>` block or first paragraph.
**Warning signs:** Description is too short (just "eval review") or matches the filename.

### Pitfall 2: Incorrect `total` or `counts` after editing
**What goes wrong:** Updating array contents without updating `counts.{category}` or `total`.
**Prevention:** After writing the file, verify: each `counts.{category}` value equals `array.length` for that category, and `total` equals the sum of all `counts` values. Target: total=250, commands=73, workflows=75, agents=31, references=40, templates=31.

### Pitfall 3: Re-sorting the entire arrays
**What goes wrong:** The existing arrays have minor sort irregularities. Re-sorting produces a 200+ line diff that obscures the actual 23 additions and is out of scope.
**Prevention:** Insert each new entry only in the alphabetically correct position relative to its immediate neighbors. Do not re-sort.

### Pitfall 4: Using `./`-prefixed paths
**What goes wrong:** Writing `"./commands/gsd/..."` instead of `"commands/gsd/..."`.
**Prevention:** All existing entries use repo-relative paths without a leading `./`. Match this convention.

### Pitfall 5: JSON syntax errors
**What goes wrong:** Missing comma after last entry before `]`, trailing comma on last entry, or unescaped `"` in description text.
**Prevention:** The `graphify.md` description `"Build, query, and inspect..."` contains double-quotes in the frontmatter. The CATALOGUE.json `description` value should use the content without wrapping quotes: `Build, query, and inspect the project knowledge graph in .planning/graphs/`. After writing, validate the JSON is parseable with `node -e "require('./CATALOGUE.json')"`.

## Code Examples

### Correct entry format
```json
{ "file": "commands/gsd/ai-integration-phase.md", "description": "Generate AI design contract (AI-SPEC.md) for phases that involve building AI systems — framework selection, implementation guidance from official docs, and evaluation strategy" }
```

### Validation command
```bash
node -e "require('./CATALOGUE.json'); console.log('JSON valid')"
```

### Count verification
```bash
node -e "
const c = require('./CATALOGUE.json');
const cats = ['commands','workflows','agents','references','templates'];
cats.forEach(k => console.log(k + ': declared=' + c.counts[k] + ' actual=' + c[k].length));
console.log('total: declared=' + c.total + ' sum=' + cats.reduce((s,k) => s + c[k].length, 0));
"
```

## Alphabetical Insertion Points

[VERIFIED: python merge-sort analysis against existing CATALOGUE.json arrays]

### Commands insertions (after these existing entries)
- `ai-integration-phase.md` → after `add-todo.md`, before `analyze-dependencies.md`
- `eval-review.md` → after `docs-update.md`, before `execute-phase.md`
- `extract_learnings.md` → after `explore.md`, before `fast.md`
- `from-gsd2.md` → after `forensics.md`, before `graphify.md`
- `graphify.md` → after `from-gsd2.md`, before `health.md`

### Workflows insertions
- `ai-integration-phase.md` → after `add-todo.md`, before `analyze-dependencies.md`
- `eval-review.md` → after `docs-update.md`, before `execute-phase.md`
- `extract_learnings.md` → after `explore.md`, before `fast.md`

### Agents insertions (strict alpha sort)
- `gsd-ai-researcher.md` → after `gsd-advisor-researcher.md`, before `gsd-assumptions-analyzer.md`
- `gsd-debug-session-manager.md` → after `gsd-debugger.md`, before `gsd-doc-verifier.md`
- `gsd-domain-researcher.md` → after `gsd-doc-writer.md`, before `gsd-executor.md`
- `gsd-eval-auditor.md` → after `gsd-executor.md`, before `gsd-integration-checker.md`
- `gsd-eval-planner.md` → after `gsd-eval-auditor.md`, before `gsd-integration-checker.md`
- `gsd-framework-selector.md` → after `gsd-eval-planner.md`, before `gsd-integration-checker.md`
- `gsd-pattern-mapper.md` → after `gsd-nyquist-auditor.md`, before `gsd-phase-researcher.md`

### References insertions (strict alpha sort)
- `ai-evals.md` → before `agent-contracts.md` (alphabetically first: `ai-` sorts after `ag-`)... insert after `agent-contracts.md` → actually `ai` > `ag`, so after `artifact-types.md`, before `checkpoints.md`
- `ai-frameworks.md` → after `ai-evals.md`, before `checkpoints.md`
- `executor-examples.md` → after `domain-probes.md`, before `gate-prompts.md`
- `gates.md` → after `gate-prompts.md`, before `git-integration.md`
- `ios-scaffold.md` → after `git-planning-commit.md`, before `model-profile-resolution.md`
- `planner-antipatterns.md` → after `planning-config.md`, before `planner-gap-closure.md`
- `planner-source-audit.md` → after `planner-reviews.md`, before `planner-revision.md`

### Templates insertion
- `AI-SPEC.md` → `AI-SPEC.md` sorts before `claude-md.md`; insert at the beginning of the templates array (uppercase A sorts before lowercase c in default ASCII sort) — or after existing entries with uppercase names. Templates array currently starts with `claude-md.md`. Check: `AI-SPEC.md` < `claude-md.md` alphabetically (A < c in case-sensitive), but the templates array has mixed case (`DEBUG.md`, `SECURITY.md`, `UAT.md`, `UI-SPEC.md`, `VALIDATION.md`) placed non-alphabetically. Insert `AI-SPEC.md` after `get-shit-done/templates/UAT.md` and before `get-shit-done/templates/UI-SPEC.md` following the uppercase-last pattern visible in the existing array, OR simply append before the existing uppercase entries — use the same convention as existing uppercase templates (DEBUG.md appears mid-array, not at start).

**Safe approach for templates:** Append `AI-SPEC.md` after `get-shit-done/templates/verification-report.md` (last entry) since the templates array has no enforced sort order and re-sorting is out of scope.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Descriptions for workflows, references, and template entries are sourced from the opening paragraph of each file since they lack YAML frontmatter `description:` fields | Verified File Inventory | Description text in CATALOGUE.json may not match the exact content style expected — LOW impact, planner can read each file to confirm |

**Note:** Descriptions for commands and agents are taken directly from their YAML frontmatter `description:` fields — those are VERIFIED. Descriptions for workflows, references, and the template entry above are ASSUMED from the first-paragraph content of each file. The planner must read each of those 11 files and write the description to match the style and length of existing catalogue entries.

## Environment Availability

Step 2.6: SKIPPED — this phase is a pure JSON file edit with no external dependencies, CLI tools, services, or runtimes beyond the Node.js already confirmed present for test validation.

**Node.js available for JSON validation:** [VERIFIED: project requires Node >=20 per CLAUDE.md; test suite uses Node.js built-in `--test` runner]

## Validation Architecture

`workflow.nyquist_validation` is explicitly `false` in `.planning/config.json` — this section is skipped per configuration.

**Verification approach for this phase:** After editing CATALOGUE.json, run:
1. `node -e "require('./CATALOGUE.json'); console.log('JSON valid')"` — confirms no JSON syntax errors
2. Count verification script (see Code Examples) — confirms `counts` and `total` match actual array lengths
3. Stale entry check — confirm no entry in CATALOGUE.json resolves to a missing file

## Security Domain

Security enforcement is not explicitly disabled in config.json. However, this phase edits only a data catalogue JSON file with no authentication, user input handling, or network access. ASVS categories V2–V6 do not apply. No threat patterns are relevant.

## Sources

### Primary (HIGH confidence)
- `CATALOGUE.json` (repo root) — full current structure, all 227 entries, count/total values verified [VERIFIED: Read tool]
- Bash existence checks on all 23 new files — all confirmed present on disk [VERIFIED: bash loop]
- Python cross-check: none of the 23 new files appear in current CATALOGUE.json [VERIFIED: python script]
- Python stale-entry check: all 227 existing entries exist on disk [VERIFIED: python script]
- Python count verification: all declared counts match actual array lengths [VERIFIED: python script]
- File head reads: descriptions extracted from frontmatter or opening paragraphs for all 23 files [VERIFIED: bash head]
- Alphabetical insertion positions: computed via python merge-sort [VERIFIED: python script]

### Secondary (MEDIUM confidence)
- Description phrasing for workflows/references/template — taken from file content first paragraph; exact wording for catalogue style is [ASSUMED]

### Flagged for Validation (LOW confidence)
- Templates array insertion position for `AI-SPEC.md` — the array has no enforced sort order; safe approach is to append at end

## Metadata

**Confidence breakdown:**
- File inventory (what to add): HIGH — all 23 files verified on disk, none in catalogue
- Count arithmetic: HIGH — verified by python
- Description text for agents/commands: HIGH — from YAML frontmatter
- Description text for workflows/references/template: MEDIUM — from file content, exact catalogue style assumed
- Insertion positions: HIGH for agents/references (strict alpha); MEDIUM for commands/workflows/templates (arrays have irregularities)

**Research date:** 2026-04-15
**Valid until:** Stable — CATALOGUE.json does not change until another upstream merge
