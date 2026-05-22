# Phase 8: CATALOGUE Sync - Pattern Map

**Mapped:** 2026-04-17
**Files analyzed:** 2 (CATALOGUE.json modified; docs/ARCHITECTURE.md conditionally modified)
**Analogs found:** 2 / 2

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `CATALOGUE.json` | config (data registry) | batch transform | `CATALOGUE.json` (itself — extend existing structure) | exact |
| `docs/ARCHITECTURE.md` | config (count reference) | transform | `tests/command-count-sync.test.cjs` (gate that validates it) | role-match |

## Pattern Assignments

### `CATALOGUE.json` (config, batch transform)

**Analog:** `CATALOGUE.json` — the file being extended. All new entries must copy the shape of existing entries exactly.

**Entry shape pattern** (lines 11–83 for commands, 86–161 for workflows, 195–235 for references, 237–269 for templates):

```json
{ "file": "relative/path/to/file.md", "description": "One-line description matching existing style" }
```

**Counts block pattern** (lines 2–9 — update all five fields atomically with array changes):

```json
{
  "total": 270,
  "counts": {
    "commands": 79,
    "workflows": 80,
    "agents": 31,
    "references": 48,
    "templates": 32
  }
}
```

**Alphabetical ordering rule:** Arrays are sorted by the `file` field value, ascending. New entries must be inserted at the correct position, not appended. All 20 entries below are pre-sorted with their insertion neighbors.

---

#### Commands — 6 entries to insert (commands 73 → 79)

**Insertion 1** — between line 39 (`commands/gsd/help.md`) and line 40 (`commands/gsd/import.md`):

```json
{ "file": "commands/gsd/inbox.md", "description": "Triage and review all open GitHub issues and PRs against project templates and contribution guidelines" }
```

**Insertion 2** — between line 73 (`commands/gsd/settings.md`) and line 74 (`commands/gsd/ship.md`):

```json
{ "file": "commands/gsd/sketch.md", "description": "Rapidly sketch UI/design ideas using throwaway HTML mockups with multi-variant exploration" },
{ "file": "commands/gsd/sketch-wrap-up.md", "description": "Package sketch design findings into a persistent project skill for future build conversations" }
```

**Insertion 3** — after line 75 (`commands/gsd/stats.md`) and before line 76 (`commands/gsd/thread.md`):

```json
{ "file": "commands/gsd/spec-phase.md", "description": "Socratic spec refinement — clarify WHAT a phase delivers with ambiguity scoring before discuss-phase" },
{ "file": "commands/gsd/spike.md", "description": "Rapidly spike an idea with throwaway experiments to validate feasibility before planning" },
{ "file": "commands/gsd/spike-wrap-up.md", "description": "Package spike findings into a persistent project skill for future build conversations" }
```

Note: `spec-phase` sorts before `spike` alphabetically (spec < spi). `sketch` and `sketch-wrap-up` sort between `settings` and `ship` (sett < ske < sh).

---

#### References — 8 entries to insert (references 40 → 48)

**Insertion 1** — between line 199 (`references/artifact-types.md`) and line 200 (`references/checkpoints.md`):

```json
{ "file": "get-shit-done/references/autonomous-smart-discuss.md", "description": "Autonomous-mode variant of discuss-phase — proposes grey-area answers in batch tables for user acceptance or override" }
```

**Insertion 2** — between line 204 (`references/decimal-phase-calculation.md`) and line 205 (`references/domain-probes.md`):

```json
{ "file": "get-shit-done/references/debugger-philosophy.md", "description": "Evergreen debugging disciplines applicable across every bug, language, and system — loaded by gsd-debugger" }
```

**Insertion 3** — between line 213 (`references/model-profiles.md`) and line 214 (`references/phase-argument-parsing.md`):

```json
{ "file": "get-shit-done/references/mandatory-initial-read.md", "description": "Protocol requiring agents to load all required_reading files before performing any other actions" }
```

**Insertion 4** — between line 220 (`references/planning-config.md`) and line 221 (`references/questioning.md`):

```json
{ "file": "get-shit-done/references/project-skills-discovery.md", "description": "Steps for discovering and applying project-defined skills before execution — shared across all GSD agents" }
```

**Insertion 5** — between line 222 (`references/revision-loop.md`) and line 223 (`references/tdd.md`):

```json
{ "file": "get-shit-done/references/sketch-interactivity.md", "description": "Required interactivity patterns for sketch mockups — every interactive element must respond to user actions" },
{ "file": "get-shit-done/references/sketch-theme-system.md", "description": "Shared CSS variable theme system for sketch artifacts stored in .planning/sketches/themes/" },
{ "file": "get-shit-done/references/sketch-tooling.md", "description": "Floating toolbar specification included in every sketch for reset, variant switching, and note capture" },
{ "file": "get-shit-done/references/sketch-variant-patterns.md", "description": "Multi-variant HTML patterns for sketches — tab-based switching between 2-3 design variants" }
```

---

#### Workflows — 5 entries to insert (workflows 75 → 80)

**Insertion 1** — between line 150 (`workflows/settings.md`) and line 151 (`workflows/ship.md`):

```json
{ "file": "get-shit-done/workflows/sketch.md", "description": "Explores design directions through throwaway HTML mockups with multi-variant comparison and artifact storage" },
{ "file": "get-shit-done/workflows/sketch-wrap-up.md", "description": "Curates sketch findings and packages them into a persistent project skill with a wrap-up summary" }
```

**Insertion 2** — after line 152 (`workflows/stats.md`) and before `workflows/transition.md`:

```json
{ "file": "get-shit-done/workflows/spec-phase.md", "description": "Clarifies phase deliverables through Socratic ambiguity scoring and produces a SPEC.md with falsifiable requirements" },
{ "file": "get-shit-done/workflows/spike.md", "description": "Rapid feasibility validation through focused throwaway experiments with observable evidence" },
{ "file": "get-shit-done/workflows/spike-wrap-up.md", "description": "Curates spike findings and packages them into a persistent project skill with a wrap-up summary" }
```

---

#### Templates — 1 entry to insert (templates 31 → 32)

**Insertion** — between line 256 (`templates/SECURITY.md`) and line 257 (`templates/state.md`):

```json
{ "file": "get-shit-done/templates/spec.md", "description": "Phase spec template locking falsifiable requirements before discuss-phase begins" }
```

---

### `docs/ARCHITECTURE.md` (config, transform — conditional)

**Analog:** `tests/command-count-sync.test.cjs`

**Gate rule** (D-06): Run the test FIRST. Only edit ARCHITECTURE.md if the test fails.

**What the test checks** (lines 37–49 of `tests/command-count-sync.test.cjs`):

```javascript
// prose match: "**Total commands:** N"
const m = content.match(/\*\*Total commands:\*\*\s+(\d+)/);

// tree match: "commands/gsd/*.md  # N slash commands"
const m = content.match(/commands\/gsd\/\*\.md[^\n]*#\s*(\d+)\s+slash commands/);
```

**If test fails**, both of these patterns in `docs/ARCHITECTURE.md` need updating to match actual `commands/gsd/` count (79 after phase 8):
- Line 116: `**Total commands:** 79`
- Line 412: `commands/gsd/*.md  # 79 slash commands`

**Expected state** (D-06): upstream v1.37.1 already set both to 79 — verify by running `node --test tests/command-count-sync.test.cjs` before touching the file.

---

## Shared Patterns

### JSON Entry Format
**Source:** `CATALOGUE.json` lines 11–83 (commands array)
**Apply to:** All 20 new entries across all four categories

```json
{ "file": "path/to/file.md", "description": "Concise present-tense or noun-phrase description" }
```

Rules extracted from existing entries:
- Description is a noun phrase or present-tense fragment, not a full sentence with trailing period
- No newlines in description value
- Maximum ~120 characters (enforced by D-02)
- Commands: use YAML `description:` verbatim (D-01)
- References/workflows/templates: derive from file H1 subtitle or `<purpose>` first sentence (D-02)

### Minimal Diff Principle
**Source:** Phase 7 established pattern (recorded in CONTEXT.md `## Established Patterns`)
**Apply to:** Both CATALOGUE.json and docs/ARCHITECTURE.md

Change only what is needed. Do not reformat existing entries, reorder existing lines, or alter whitespace outside the insertion points.

### Atomic Write Strategy
**Source:** CONTEXT.md `## Claude's Discretion`

Executor may write all 20 entries in a single atomic edit or category-by-category — both are acceptable. The counts block and array insertions must be written together so the file is never in a partially-updated state.

---

## No Analog Found

None — both files being modified have clear structural patterns directly in the codebase.

---

## Pre-flight Verification Pattern

Before writing any entries, executor runs a disk-vs-CATALOGUE diff (D-05):

```bash
# List files on disk for each category
ls /path/to/commands/gsd/*.md | sort
ls /path/to/get-shit-done/workflows/*.md | sort
# etc.

# Compare against CATALOGUE.json file paths for that category
# Confirm exactly 20 entries are missing before proceeding
```

This guards against any files added or removed between the discuss and execute phases.

---

## Metadata

**Analog search scope:** `CATALOGUE.json`, `tests/command-count-sync.test.cjs`, all 20 new prompt files
**Files scanned:** 22 (CATALOGUE.json + test + 20 new files)
**Pattern extraction date:** 2026-04-17
