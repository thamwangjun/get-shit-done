# Phase 48: TDD Red Gate - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Write `tests/step-numbering-scan.test.cjs` — a permanent scanner test that:
1. Detects decimal step labels (Pattern A/B: `**Step N.M**` headings; Pattern D: ordered-list items like `2.5.`) across agents, workflows, and commands
2. Detects out-of-order step sequences per section (strict sequential, gap+reversed)
3. Fails RED against the current unmodified corpus for decimal violations in the 6 known violating files

Phase 48 is the TDD Red Gate only. No file normalization (that is Phase 49). No maintenance script (that is Phase 50).

</domain>

<decisions>
## Implementation Decisions

### Out-of-Order Detection Scope (Phase 48)
- **D-01:** Out-of-order corpus tests do NOT need to fail RED. The corpus may have no genuine out-of-order violations currently. Out-of-order detection is verified via synthetic unit test fixtures only.
- **D-02:** Corpus RED gate is exclusively about decimal violations in the 6 known violating files.

### Out-of-Order Detection Algorithm
- **D-03:** Strict sequential detection — flag BOTH reversed steps (Step 1, Step 3, Step 2) AND gaps (Step 1, Step 3, Step 4 with no Step 2). Any non-sequential jump triggers a failure.
- **D-04:** Detection scope is per-section: step counter resets when a markdown heading (`##` or `###`) is encountered. Each section's steps are checked independently. This prevents false positives in files with multiple independent step sequences.

### Pattern A/B Detection (Bold headings)
- **D-05:** No indentation guard for Pattern A/B. All `**Step N.M**` headings are detected as violations regardless of leading whitespace. This ensures execute-phase.md's `**Step 7.0**`–`**Step 7.3**` (indented at 3 spaces) are correctly flagged.

### Test Structure
- **D-06:** One test per file per pattern — each file gets two subtests: one for decimal violations, one for out-of-order violations. Departs from `negative-framing-scan.test.cjs` pattern intentionally, to provide clearer failure attribution during Phase 49 normalization.

### Carrying Forward from STATE.md
- **D-07:** Pattern C files (`plan-phase.md`, `new-milestone.md`, `new-project.md`) are OUT OF SCOPE — `## N.N.` section headings without the "Step" keyword are a different pattern deferred to a follow-on milestone. Exclude these files from the scanner via explicit path exclusion.
- **D-08:** Step N.0 labels (e.g., `**Step 7.0**`) ARE violations — the decimal point is a decimal point regardless of the fractional digit.
- **D-09:** execute-phase.md Step 7.0–7.3 sub-steps are violations to be DETECTED by the scanner. Phase 49 will rename them as lettered branches (7a, 7b, etc.) rather than sequential integers — but the Phase 48 scanner catches them as decimal violations.

### Claude's Discretion
- Pattern D detection regex and the exact indentation threshold for the ordered-list guard (the research recommends excluding Pattern D items with 3+ leading spaces — Claude can apply this since Pattern D items in the corpus are at column 0 anyway)
- Whether to include a `collectMarkdownFiles` function at module scope (mirroring `negative-framing-scan.test.cjs`) or inline the traversal — follow existing pattern
- False-positive guards for letter-suffix steps (e.g., `Step 7a`) — scanner must require `\.[0-9]` not `\.[a-z0-9]` for the decimal digit

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Violation Inventory and Architecture
- `.planning/research/SUMMARY.md` — primary reference: 6 in-scope violating files with exact line numbers, decimal step counts, cross-file reference chains, test files requiring co-update, build order recommendation, and critical pitfalls (including silent false-passes from `indexOf` returning -1)

### Canonical Scanner Pattern
- `tests/negative-framing-scan.test.cjs` — the established scanner test structure to adapt for Phase 48: module-scope file collection via `collectMarkdownFiles`, pure `scanContent(content)` function, unit tests before corpus tests, per-directory `describe` blocks

### Project Context
- `.planning/STATE.md` §Accumulated Context — carries the three scope decisions (Pattern C deferral, Step N.0 as violation, execute-phase.md sub-steps as lettered branches) that must not be re-litigated

### Roadmap
- `.planning/ROADMAP.md` §Phase 48 — success criteria with the 4 specific acceptance conditions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/negative-framing-scan.test.cjs` — direct structural template. Copy the `collectMarkdownFiles` traversal, the per-directory `describe` wrapping, and the code-fence skip (`inCodeBlock` toggle). Adapt the detection and assertion logic.
- `tests/helpers.cjs` — do NOT add new exports here (would break the `test-count` assertion in `helpers.test.cjs`). Keep scanner utilities inline in the new test file.

### Established Patterns
- Scan dirs (same as negative-framing-scan.test.cjs): `agents/`, `get-shit-done/workflows/`, `commands/gsd/`
- Code-fence exclusion: toggle `inCodeBlock` on ` ``` ` lines; skip detection inside fences
- Module-scope file collection: collect once at module scope (not inside each test) — single filesystem traversal
- `assert.deepStrictEqual(violations, [])` with a `violations` array built per file — standard failure reporting pattern

### Integration Points
- This test file is added to `tests/` and picked up automatically by `scripts/run-tests.cjs` (globs `tests/*.test.cjs`)
- No changes to `package.json`, `scripts/run-tests.cjs`, or any lib module — Phase 48 is tests only

### Watch-Outs (from SUMMARY.md)
- `gsd-verifier.md` uses letter-suffix steps (`Step Nb`) that look decimal to a naive regex — scanner must require `\.[0-9]` not `\.[a-z]`
- `quick.md` lines 691 and 706 contain `Step 1` and `Step 2` inside a code block — must not be detected (code-fence guard handles this)
- Step 0 is a valid starting label in `gsd-verifier.md`, `gsd-planner.md`, and `commands/gsd/graphify.md` — do not treat Step 0 as a violation; it is a valid step number

</code_context>

<specifics>
## Specific Ideas

- Test file name is locked by ROADMAP.md success criteria: `tests/step-numbering-scan.test.cjs`
- The 6 known violating files that must fail RED: `agents/gsd-intel-updater.md`, `agents/gsd-phase-researcher.md`, `get-shit-done/workflows/progress.md`, `get-shit-done/workflows/quick.md`, `get-shit-done/workflows/execute-phase.md` (Pattern D column-0 items and Pattern A/B Step 7.0–7.3). The 6th file from the research inventory is `execute-phase/steps/post-merge-gate.md` (cross-file reference, not a primary violation source) — confirm whether this is the 6th or if the count is from primary violations only.

</specifics>

<deferred>
## Deferred Ideas

- Cross-file reference detection (execute-plan.md → execute-phase.md step 5.5) — belongs in Phase 50 (Maintenance Script and Cross-Ref Scanner)
- Pattern C normalization (plan-phase.md, new-milestone.md, new-project.md `## N.N.` headings) — deferred to a follow-on milestone after v2.1.0-d

</deferred>

---

*Phase: 48-TDD Red Gate*
*Context gathered: 2026-05-30*
