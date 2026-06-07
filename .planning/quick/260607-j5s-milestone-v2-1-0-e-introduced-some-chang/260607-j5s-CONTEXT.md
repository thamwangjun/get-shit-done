# Quick Task 260607-j5s: Find Testing Gaps for Milestone v2.1.0-e - Context

**Gathered:** 2026-06-07
**Status:** Ready for planning

<domain>
## Task Boundary

Investigate prompt file changes introduced in Milestone v2.1.0-e and identify gaps in the test suite — places where a change was made but either no regression test exists or existing tests do not assert the new behavior.

This is an investigation-only task. No test files are written; a structured gap report is the deliverable.

</domain>

<decisions>
## Implementation Decisions

### Scope
- Investigate ALL prompt file categories: agents/*.md, workflows/*.md, commands/gsd/*.md
- Complete coverage of every changed .md file in v2.1.0-e, not a subset

### Gap Definition
All four gap types are in scope:
1. **No regression test exists** — a changed behavior has zero test coverage (most critical)
2. **Existing test doesn't assert the new behavior** — a test exists but was not updated to cover the v2.1.0-e change
3. **Structural/frontmatter gaps** — frontmatter rules (tools:, no skills:, file-writing agents) changed but not tested
4. **Content/behavior gaps** — prompt text changes that alter agent behavior but have no corresponding behavioral test

### Output Format
Produce a **structured gap report** for each identified gap:
- Changed file (path)
- What changed (summary of the v2.1.0-e modification)
- Which test covers it, if any (test file + assertion)
- Gap type (from the four types above)
- Priority (High / Medium / Low)

### Claude's Discretion
- How to identify v2.1.0-e changes: use git log/diff to find commits belonging to the milestone; check .planning/ for milestone artifacts if available
- Prioritization criteria: gaps in agent frontmatter rules are High; gaps in behavioral prompt changes are Medium; gaps in workflow orchestration text are Low unless they affect a critical path

</decisions>

<specifics>
## Specific Ideas

- Use git log to find commits associated with Milestone v2.1.0-e (tag, branch, or commit range)
- Cross-reference changed files against tests/ directory to identify which changes have corresponding tests
- The existing `agent-frontmatter.test.cjs` is the primary frontmatter regression guard — check what it covers vs. what v2.1.0-e changed
- Recent commit `2d720394` (null-omit-comment-scan regression guard) is an example of a test added for a v2.1.0-e change — use it to understand the pattern and find what's missing

</specifics>

<canonical_refs>
## Canonical References

- `tests/agent-frontmatter.test.cjs` — primary frontmatter validation test
- `tests/` directory — all existing tests to cross-reference against
- `.planning/` — milestone artifacts for v2.1.0-e scope definition
- Recent commits on `dev` branch — source of truth for what changed in v2.1.0-e

</canonical_refs>
