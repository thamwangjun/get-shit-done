# Phase 8: CATALOGUE Sync - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Add all 20 new v1.37.1 prompt files to CATALOGUE.json (6 commands, 8 references, 5 workflows, 1 template), update `counts` and `total`, and verify `docs/ARCHITECTURE.md` command count is accurate. Phase 8 closes when CATALOGUE.json is in sync with the filesystem and `tests/command-count-sync.test.cjs` passes.

</domain>

<decisions>
## Implementation Decisions

### Entry Descriptions
- **D-01:** Commands — use the YAML `description:` field from each file's frontmatter verbatim. All 6 new command files have this field.
- **D-02:** References, workflows, and templates — derive a 1-line description from the file's header subtitle (the sentence immediately after the H1 title) or `<purpose>` tag, trimmed and styled to match existing CATALOGUE entry conciseness (≤ ~120 chars, no newlines).

### Count Target
- **D-03:** The authoritative count is derived from a disk-vs-CATALOGUE diff, not the plan's wording. Exact targets:
  - **20 CATALOGUE entries** to add (not 21 — the plan overcounted by mistakenly including 2 `docs/` files that CATALOGUE does not track)
  - **Total: 270** (not ~271 — 250 current + 20 new entries)
  - `counts` update: commands 73→79, references 40→48, workflows 75→80, templates 31→32
- **D-04:** The 2 `docs/` files added by the upstream merge (`docs/gsd-sdk-query-migration-blurb.md`, `docs/skills/discovery-contract.md`) do NOT go in CATALOGUE.json — the `docs/` directory is not a tracked category.
- **D-05:** Executor runs a disk-vs-CATALOGUE diff at plan time to confirm 20 missing entries before writing. This guards against any files that may have been added or removed between the discuss and execute phases.

### ARCHITECTURE.md
- **D-06:** `docs/ARCHITECTURE.md` already shows `Total commands: 79` on both line 116 and line 412 (the upstream merge updated it). The `command-count-sync` test likely already passes. Executor verifies by running the test before making changes — only update if the test is currently failing.

### Claude's Discretion
- Alphabetical insertion position within each CATALOGUE array (existing arrays are alphabetical — maintain that order)
- Whether to write all 20 entries in a single atomic write or category-by-category
- Exact description phrasing for references/workflows (within the style constraints of D-02)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and Success Criteria
- `.planning/REQUIREMENTS.md` §CATALOGUE — CAT-01 through CAT-06 define the exact files to add per category and the verification conditions
- `.planning/ROADMAP.md` §Phase 8 — 5 success criteria with grep-verifiable checks

### Primary Data Source
- `CATALOGUE.json` — the file being modified; read current structure and counts before writing
- `tests/command-count-sync.test.cjs` — the gate test for CAT-06 (ARCHITECTURE.md command count)

No external specs — all requirements are fully captured in REQUIREMENTS.md and the decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CATALOGUE.json` — structured JSON with `total`, `counts`, and per-category arrays. Each entry: `{ "file": "relative/path/to/file.md", "description": "..." }`. Arrays are sorted alphabetically by `file` path.
- `tests/command-count-sync.test.cjs` — verifies `docs/ARCHITECTURE.md` "Total commands: N" matches actual `ls commands/gsd/*.md | wc -l`. Run before and after any ARCHITECTURE.md edit.

### Established Patterns
- **Alphabetical ordering**: all category arrays in CATALOGUE.json are sorted alphabetically by the `file` field. New entries must be inserted at the correct position, not appended.
- **Minimal diff principle** (from Phase 7): change only what is needed — do not reformat existing entries or reorder lines beyond the insertions.

### Integration Points
- `CATALOGUE.json` counts block must be updated in sync with the array additions — `counts.commands`, `counts.references`, `counts.workflows`, `counts.templates`, and `total` all change.
- `docs/ARCHITECTURE.md` line 116 (`**Total commands:** 79`) and line 412 (`commands/gsd/*.md  # 79 slash commands`) — both reference the command count. If the test is failing, both lines need updating to match the actual file count.

### New Files — Category Breakdown
| Category | Files to Add | Current Count | New Count |
|----------|-------------|---------------|-----------|
| commands | inbox.md, sketch.md, sketch-wrap-up.md, spec-phase.md, spike.md, spike-wrap-up.md | 73 | 79 |
| references | autonomous-smart-discuss.md, debugger-philosophy.md, mandatory-initial-read.md, project-skills-discovery.md, sketch-interactivity.md, sketch-theme-system.md, sketch-tooling.md, sketch-variant-patterns.md | 40 | 48 |
| workflows | sketch.md, sketch-wrap-up.md, spec-phase.md, spike.md, spike-wrap-up.md | 75 | 80 |
| templates | spec.md | 31 | 32 |

</code_context>

<specifics>
## Specific Ideas

- The plan's "21 entries / ~271 total" wording is a confirmed miscounting error — the 2 new `docs/` files (`docs/gsd-sdk-query-migration-blurb.md`, `docs/skills/discovery-contract.md`) were mistakenly included in the CATALOGUE entry estimate. Executor should not add these.
- ARCHITECTURE.md update is conditional on the test failing — upstream v1.37.1 appears to have already updated it to 79 as part of the merge.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-catalogue-sync*
*Context gathered: 2026-04-17*
