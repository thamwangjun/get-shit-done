# Phase 20: Baseline Audit - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Produce a committed inventory of all in-scope files across four levels — agents/ (31), commands/gsd/ (79), get-shit-done/workflows/ (80), get-shit-done/templates/ (35), get-shit-done/references/ (49) — documenting each file's current primary directive tag state before any conversion begins. upstream/v1.37.1 defines the file corpus in scope; the audit documents the fork's current state only.

</domain>

<decisions>
## Implementation Decisions

### Artifact format
- **D-01:** Produce both a Markdown file and a JSON file — Markdown for human reference across phases; JSON for downstream automation (phases 21–24 can parse it to target conversions without re-scanning).
- **D-02:** Both files live in the phase directory only: `.planning/phases/20-baseline-audit/`.
- **D-03:** Markdown is structured as one table per level (5 sections — one per directory). Each section has a per-level summary (total files, anomaly count) followed by the file table.

### Anomaly detail
- **D-04:** Each file entry is rich: file path + current tag found (or "none") + expected canonical tag for that level + anomaly type (missing / wrong-level / multiple). This gives phases 21–24 enough to target conversions without re-scanning.
- **D-05:** Anomaly types are: `missing` (no primary directive tag), `wrong-level` (has a tag but not the canonical one for this level), `multiple` (more than one primary directive tag). Files that are correct get status `ok`.

### Upstream comparison scope
- **D-06:** upstream/v1.37.1 defines which files are in scope (the corpus). The audit documents the fork's current tag state — no upstream-vs-fork delta column needed.

### Scanning script
- **D-07:** A scanning script is committed to the repo as `scripts/audit-tags.js` using Node.js CJS (matching the existing test file pattern). It outputs the JSON artifact and can be re-run by phases 21–24 to verify conversion progress.

### Claude's Discretion
- Exact JSON schema structure (fields per entry, top-level keys)
- Column ordering in the Markdown tables
- Whether to group anomalies into a separate summary section at the top of the Markdown file
- Script invocation interface (flags, stdout vs file output)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §AUDIT-01 — Defines what "baseline audit complete" means; anomaly taxonomy (no tag, multiple tags, wrong-level tag)

### Existing test patterns (model for the scanning script)
- `tests/fork-persona-tag.test.cjs` — Corpus-scan pattern for agents/ (L1); script should follow the same file-discovery approach
- `tests/fork-intent-tag.test.cjs` — Corpus-scan pattern for commands/gsd/ (L2)

### Tag hierarchy model
- `.planning/ROADMAP.md` §Phase 20–24 — Canonical tag per level: L1=`<persona>`, L2=`<intent>`, L3=`<objective>`, L4=`<task>`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/fork-persona-tag.test.cjs`: File-discovery pattern (`fs.readdirSync` + filter + sort) can be reused directly in `scripts/audit-tags.js`
- `tests/fork-intent-tag.test.cjs`: Bare-block detection logic (strip code fences, line-by-line scan) is the right approach for primary directive detection

### Established Patterns
- All existing corpus-scan tests use Node.js CJS (`require`, `fs`, `path`) — audit script must match this
- Code-fence stripping (`content.replace(/```[\s\S]*?```/g, '')`) is standard in this codebase before tag scanning to avoid false positives on documentation examples

### Integration Points
- Script outputs to `.planning/phases/20-baseline-audit/20-BASELINE-AUDIT.json` and `.planning/phases/20-baseline-audit/20-BASELINE-AUDIT.md`
- Phases 21–24 reference the JSON by that path for conversion targeting

</code_context>

<specifics>
## Specific Ideas

- No specific references — open to standard approaches for artifact layout

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 20-baseline-audit*
*Context gathered: 2026-04-29*
