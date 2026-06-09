# Phase 64: Citation Pattern Exploration - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Scan the 5 scoped prompt-content directories (`commands/`, `get-shit-done/workflows/`, `agents/`, `get-shit-done/references/`, `get-shit-done/templates/`) for every citation format present — not just `#NNN` — and document findings so Phase 65 can write a correctly-scoped guard test without re-scanning.

Deliverable: `64-FINDINGS.md` in the phase directory containing a summary section, a 3-column findings table (file:line | matched_text | category), and an Allowlist Candidates section with grep-confirmed evidence.

</domain>

<decisions>
## Implementation Decisions

### Findings Format
- **D-01:** Findings go in `64-FINDINGS.md` in the phase directory — not inline in CONTEXT.md. Phase 65 reads it directly.
- **D-02:** Table columns: `file:line | matched_text | category`. Minimal 3-column table; Phase 65 derives detector regexes from the `category` column.
- **D-03:** File opens with a summary section: categories found, count per category, `#NNN` total confirmed. Phase 65 author gets an overview before reading the full table.

### Citation Boundary
- **D-04:** A "citation" is any reference to a GitHub issue or PR number: `#NNN` inline, `(#NNN)` parenthetical, word-form (`issue NNN`), and feat-form (`feat-NNNN` where NNNN is clearly a tracker ID). Test filenames and ADR slugs (e.g., `adr-014`) are not citations.
- **D-05:** `feat-3347` appearing in prose (e.g., in a comment referencing a test filename) IS a citation — it encodes a tracker ID. Flag it; Phase 65 can allowlist if needed. Category: `feat-form`.

### Allowlist Pre-scoping
- **D-06:** `64-FINDINGS.md` includes a dedicated "Allowlist Candidates" section listing patterns Phase 65 must NOT flag: hex color codes (e.g., `#e8c170`), markdown heading markers (`## Heading`), illustrative placeholders (`#123`, `#45`), and frontmatter blocks.
- **D-07:** Each allowlist candidate is confirmed with grep evidence — at least one sample hit from the scoped dirs. If a pattern doesn't appear in the scoped dirs, it is noted as "not present — no allowlist entry needed".

### Scanning Approach
- **D-08:** A small CommonJS discovery script at `scripts/scan-citations.cjs` runs the multi-pattern scan. Committed alongside the findings.
- **D-09:** Script outputs JSON to stdout. A post-processing step (inline in the plan or within the script itself) converts JSON to the markdown format required for `64-FINDINGS.md`.
- **D-10:** The script scans for all citation patterns in one pass: `#NNN` inline, `(#NNN)` parenthetical, word-form (`issue \d+`, `PR \d+`), feat-form (`feat-\d{3,}`), and any other variants found. Frontmatter blocks are excluded from hits (YAML lines starting with `color:`, etc.).

### Claude's Discretion
- If additional citation forms are discovered during scripting that don't match any of the four expected categories, add new categories rather than forcing a fit. Category taxonomy is open-ended.
- Script implementation details (argument parsing, file traversal approach, JSON schema) are left to the implementer.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Requirements
- `.planning/REQUIREMENTS.md` — CITE-01 and CITE-02 define Phase 64's acceptance criteria
- `.planning/ROADMAP.md` §Phase 64 — Goal, success criteria, and dependency on Phase 63

### Downstream Phase Dependencies
- Phase 65 (Guard Test RED) reads `64-FINDINGS.md` directly — the findings file format is the contract
- Phase 65 success criteria are in `.planning/ROADMAP.md` §Phase 65 — implementer should understand what Phase 65 needs before designing the output format

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/` directory: existing scripts follow CommonJS pattern — `scan-citations.cjs` fits here alongside `normalize-step-numbers.cjs`
- `tests/step-numbering-scan.test.cjs`: comparable scan-then-test pattern — reference for how to structure a scanner that finds violations across the same 5 scoped dirs

### Established Patterns
- The 5 scoped dirs (`commands/`, `get-shit-done/workflows/`, `agents/`, `get-shit-done/references/`, `get-shit-done/templates/`) are the canonical scan boundary used in all prior content-quality phases
- Frontmatter exclusion: prior scanners skip or exempt YAML frontmatter — `scan-citations.cjs` should do the same

### Integration Points
- `64-FINDINGS.md` is the handoff artifact to Phase 65 — no shared runtime integration needed

</code_context>

<specifics>
## Specific Ideas

- Confirmed baseline: `#NNN` hits = 211 across the 5 scoped dirs (as of 2026-06-09). This is the cleanup target count for Phase 66.
- `feat-3347` in `get-shit-done/references/planner-graphify-auto-update.md` is a confirmed feat-form hit.
- `post-#2790` pattern appears in multiple `commands/gsd/*.md` files — example of `#NNN` embedded in prose rather than standalone parenthetical.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 64-Citation Pattern Exploration*
*Context gathered: 2026-06-09*
