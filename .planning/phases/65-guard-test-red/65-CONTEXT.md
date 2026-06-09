# Phase 65: Guard Test (RED) - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Write `tests/no-issue-citations.test.cjs` — a permanent guard that fails RED (enumerating every offending file:line) before Phase 66 cleans up citations. The test has self-contained inline detection logic; the Phase 64 discovery artifacts (`scripts/scan-citations.cjs` and `tests/citation-scan.test.cjs`) are deleted in this same phase.

Deliverables:
1. `tests/no-issue-citations.test.cjs` — permanent corpus guard
2. `scripts/scan-citations.cjs` deleted
3. `tests/citation-scan.test.cjs` deleted

</domain>

<decisions>
## Implementation Decisions

### Detection Architecture
- **D-01:** Inline detection — `no-issue-citations.test.cjs` contains its own regex logic. No import of `scripts/scan-citations.cjs`. Mirrors the `tests/step-numbering-scan.test.cjs` pattern (fully self-contained).
- **D-02:** `scripts/scan-citations.cjs` is deleted in this phase. Its discovery purpose (Phase 64) is fulfilled; the guard test replaces its detection function.
- **D-03:** `tests/citation-scan.test.cjs` (673-line Phase 64 Nyquist test for the scanner) is deleted in this phase. Those CITE-01/CITE-02 requirements are already satisfied.

### Placeholder Exemption
- **D-04:** Use an exact value allowlist: `const PLACEHOLDER_DIGITS = new Set([1, 2, 45, 123])`. In the detection loop, skip any matched `#NNN` where the parsed integer is in this set. This catches `#686` (real 3-digit citation at `chain.md:57`) correctly while exempting known illustrative placeholder values.
- **D-05:** `#45` does not actually appear in the corpus (confirmed by Phase 64 scan) — it is in the allowlist as a defensive measure per CITE-05 requirements. The allowlist comment must cite Phase 64 FINDINGS as provenance.

### Failure Output Format
- **D-06:** Each violation line: `file:line #NNN (category)` + indented context line showing the surrounding text. Final line of the failure message: `To add an allowlist exemption: add the digit to PLACEHOLDER_DIGITS`. This gives a human or upstream-merge reviewer enough context to decide whether a new failure is a real citation or a new illustrative placeholder.
- **D-07:** Category labels follow Phase 64 taxonomy: `inline`, `parenthetical`, `feat-form`.

### Scan Scope and Exclusions
- **D-08:** Same 5 dirs as Phase 64: `commands/`, `get-shit-done/workflows/`, `agents/`, `get-shit-done/references/`, `get-shit-done/templates/`.
- **D-09:** Exclude YAML frontmatter blocks (lines between opening `---` and closing `---` when frontmatter starts on line 1) — same logic as scan-citations.cjs.
- **D-10:** Exclude fenced code blocks (``` triple-backtick fences) — same logic as scan-citations.cjs. This is what reduces 228 raw grep hits to 103 scanner hits.
- **D-11:** Apply hex color lookbehind `(?<![0-9a-fA-F#])` to prevent matching tails of 6-char hex codes (e.g., `#22c55e` — the `5e` tail would otherwise match `#5e`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 64 Findings (primary detector contract)
- `.planning/phases/64-citation-pattern-exploration/64-FINDINGS.md` — Full 103-hit findings table, allowlist candidates with grep evidence, delta documentation. Phase 65 detector regexes and allowlist entries are derived from this document — **read it before writing any regex**.

### Milestone Requirements
- `.planning/REQUIREMENTS.md` — CITE-03, CITE-04, CITE-05 define Phase 65 acceptance criteria
- `.planning/ROADMAP.md` §Phase 65 — Goal, success criteria, 4 specific pass/fail conditions

### Reference Implementation
- `tests/step-numbering-scan.test.cjs` — Primary structural analog. Self-contained inline detection, same 3-dir scope (subset of Phase 65 5-dir scope), `describe`/`test` layout, corpus + unit test structure.

### Existing Scanner (to be deleted)
- `scripts/scan-citations.cjs` — Detection regexes and exclusion logic to inline into the guard test, then delete. Key regexes: `INLINE_RE`, `PAREN_RE`, frontmatter-block and code-block state machine.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/step-numbering-scan.test.cjs` — Copy structure: module-level file collection, `describe` per pattern type, unit subtests + corpus subtest per describe block.
- `scripts/scan-citations.cjs` — Source for: `INLINE_RE`, `PAREN_RE`, feat-form regex, frontmatter exclusion state machine, code-block exclusion state machine, `collectMarkdownFiles()` traversal.
- `tests/install-eta-regression.test.cjs` — Reference for `ALLOWED_INLINE_REFS` / `PLACEHOLDER_DIGITS` allowlist pattern (exact-value Set).

### Established Patterns
- All test files in `tests/*.test.cjs` are CommonJS, self-contained, use Node.js built-in `--test` runner.
- Scanner SCAN_DIRS are 5 dirs for Phase 65 (different from step-numbering-scan's 3 dirs — use Phase 64's 5-dir list).
- File collection: recursive `fs.readdirSync` with `.md` filter — same helper pattern across test files.

### Integration Points
- `npm test` runs all `tests/*.test.cjs` automatically — no manual registration needed.
- Deletions: `scripts/scan-citations.cjs` and `tests/citation-scan.test.cjs` must be removed before the final npm test run to ensure no orphaned-import errors.

</code_context>

<specifics>
## Specific Ideas

- Expected RED count at Phase 65 commit: 103 hits (from 64-FINDINGS.md) minus any that fall in the PLACEHOLDER_DIGITS set. The PLACEHOLDER_DIGITS set accounts for `#1`/`#2`/`#123` hits; the effective RED count is approximately 97 violations (103 − 6 placeholder hits).
- `feat-3347` at `get-shit-done/references/planner-graphify-auto-update.md:62` is the only `feat-form` hit — test must detect it.
- `#686` at `get-shit-done/workflows/discuss-phase/modes/chain.md:57` is the only 3-digit real citation — the allowlist design was specifically validated to catch this.
- Failure message must include: "To add an allowlist exemption: add the digit to PLACEHOLDER_DIGITS" — explicit reviewability hint for upstream merge scenarios.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 65-Guard Test (RED)*
*Context gathered: 2026-06-09*
