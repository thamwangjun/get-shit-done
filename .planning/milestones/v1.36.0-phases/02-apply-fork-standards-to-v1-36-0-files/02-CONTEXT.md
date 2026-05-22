# Phase 2: Apply Fork Standards to v1.36.0 Files - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply the fork's positive framing standard to every prompt file added or modified by the v1.36.0 upstream merge: replace bare negative imperatives with affirmative equivalents that specify the correct behavior. Also replace the recurring `Do NOT load full AGENTS.md files` boilerplate globally across all affected agents. Structural passes (XML wrapping), test fixes, and files outside the v1.36.0 change set are out of scope.

</domain>

<decisions>
## Implementation Decisions

### AGENTS.md Boilerplate Replacement (NEW-11)

- **D-01:** The global replacement text for `Do NOT load full AGENTS.md files (100KB+ context cost)` is: **`Load specific agent files only`** — shorter, unambiguous, no rationale needed
- **D-02:** This sweep runs as the **first plan (02-03)**, before the per-file passes (02-01 and 02-02), to avoid double-touching lines in agents that also have other violations

### Borderline Case Handling

- **D-03:** `STOP -- DO NOT READ THIS FILE` section in `commands/gsd/graphify.md` — **delete the section entirely**. The model is assumed capable; the guard is unnecessary
- **D-04:** Quoted user speech in reference files (e.g., `"I don't know my requirements yet"` in `get-shit-done/references/ai-frameworks.md`) — **preserve as-is**; quoted speech is not a directive
- **D-05:** Editorial `don't` in informational reference files (e.g., `get-shit-done/references/ai-evals.md`) — **preserve as-is**; editorial voice in reference/data documents is not a prompt directive

### Execution Order

- **D-06:** Plan execution order: **02-03 (global boilerplate) → 02-01 (11 new files) → 02-02 (15 modified files)**

### SECURITY-Style Patterns

- **D-07:** `Never X — always Y` paired patterns (e.g., `Never shell-interpolate the prompt — always pipe via stdin`) are **valid reframe exceptions** — confirm and leave unchanged, do not convert. This is a standing fork rule from PROJECT.md.

### Positive Framing Replacement Rule

- **D-08:** Every replacement must specify the correct behavior — not merely delete the prohibition. "Do NOT X" → affirmative instruction stating what to do instead. Deletions (like D-03) are only valid when the instruction itself is unnecessary.

### Claude's Discretion

- Exact affirmative phrasing for each individual violation beyond the patterns documented in `.planning/research/VIOLATIONS.md` — follow the conversion patterns table there; for novel cases, apply the principle in D-08
- Whether to batch multiple violations in a single edit per file or fix one at a time

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Fork Standards
- `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md` — Step-by-step prompt improvement process; positive framing rules
- `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md` — Full prompt engineering guide; Section 5 (Instruction Framing) governs positive framing

### Requirements and Violations Audit
- `.planning/REQUIREMENTS.md` — All 15 NEW-xx and MOD-xx requirements for this phase; success criteria
- `.planning/research/VIOLATIONS.md` — Full audit: 54 violations across 28 files, per-file line numbers, and affirmative conversion patterns table

### Project Rules
- `.planning/PROJECT.md` — Key Decisions table: SECURITY-style exception, tests-may-be-modified rule

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.planning/research/VIOLATIONS.md` — Pre-computed per-file violation lists with exact line numbers; affirmative conversion patterns table. Agents should read this before touching any file — it eliminates the need to re-scan.
- `tests/negative-framing.test.cjs` (or equivalent) — Fork-side test that validates positive framing; run after each file to confirm 0 violations

### Established Patterns
- Conversion pattern table in VIOLATIONS.md is authoritative for recurring patterns (`Do NOT load full AGENTS.md`, `Do NOT present output directly to user`, `Do NOT research beyond`, etc.)
- Agents with `Write` in their tools list must retain `Only use the Write tool` string — do not accidentally remove it during a framing pass

### Integration Points
- Each modified file is an agent or workflow that is also exercised by `npm test` (agent-frontmatter.test.cjs validates YAML frontmatter). YAML frontmatter must not be touched during the framing pass.
- Plan 02-03 touches agents that Plans 02-01 and 02-02 may also touch — running 02-03 first prevents conflicting edits on the same lines

</code_context>

<specifics>
## Specific Ideas

- Graphify's `STOP -- DO NOT READ THIS FILE` section: delete entirely, no rewrite needed
- AGENTS.md boilerplate: use `Load specific agent files only` (shorter form preferred over VIOLATIONS.md's proposed form)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-apply-fork-standards-to-v1-36-0-files*
*Context gathered: 2026-04-15*
