---
name: 260610-gku-context
description: Decisions for fixing the INLINE_RE false negative that lets anthropics/claude-code#13898 escape the guard test
metadata:
  type: project
---

# Quick Task 260610-gku: Fix Guard Test False Negative — Context

**Gathered:** 2026-06-10
**Status:** Ready for planning

<domain>
## Task Boundary

Fix the `INLINE_RE` guard test false negative in `tests/no-issue-citations.test.cjs`.
The citation `anthropics/claude-code#13898` in `agents/gsd-ai-researcher.md:26` escapes
detection because the lookbehind `(?<![0-9a-fA-F#])` treats the `e` in `claude-code` as
a hex character and blocks the match.

Three changes required, in strict TDD commit order:
1. Add failing unit test (corpus test goes RED)
2. Fix the regex (unit test GREEN, corpus test RED for gsd-ai-researcher.md)
3. Remove the citation from gsd-ai-researcher.md (all tests GREEN)

</domain>

<decisions>
## Implementation Decisions

### Commit granularity
- **3 atomic commits** in TDD order:
  - Commit 1: add unit test `'github-style citation: owner/repo#NNN is detected'` — RED (old regex misses it)
  - Commit 2: fix regex — unit test GREEN, corpus test for gsd-ai-researcher.md RED (citation now caught)
  - Commit 3: remove citation from gsd-ai-researcher.md — all tests GREEN

### Lookbehind approach
- **Remove the lookbehind entirely** — user preference is false positives over false negatives.
  The current `(?<![0-9a-fA-F#])` lookbehind is the wrong tool: hex colors in frontmatter are
  already excluded by D-09, and in code fences by D-10. Relying on a single-char lookbehind
  to protect in-prose hex is fragile and produces false negatives.
  New regex: `/#(\d+)\b/g` (no lookbehind).
  The existing hex exemption test (`#e8c170 produces zero hits`) still passes because `e` follows
  `#` and is not a digit — `#(\d+)` never matches `#e8c170`.

### Error message update
- Update the assertion error message in the corpus test to guide agent judgment:
  "If this is a hex color, move it to a code fence or add it to PLACEHOLDER_DIGITS with a
  comment explaining why. If it is an issue or PR citation, remove it."
- Update inline comments and JSDoc that reference D-11 (hex lookbehind) to reflect that the
  lookbehind is removed and hex colors are now protected solely by the frontmatter and code-fence
  exclusions.

### Citation replacement (gsd-ai-researcher.md:26)
- Rephrase prose without the issue number. Current text:
  "(upstream bug anthropics/claude-code#13898 strips MCP tools from agents with a `tools:`
  frontmatter restriction)"
- New text (user directive: minimal, no citation number):
  "(some AI coding runtimes strip MCP tools from agents that declare a `tools:` frontmatter
  restriction)"

### Claude's Discretion
- Exact phrasing for the unit test description string
- Whether to add a comment in the test explaining why the lookbehind was removed (D-11 superseded)

</decisions>

<specifics>
## Specific Requirements

- `INLINE_RE` in `tests/no-issue-citations.test.cjs` changes from:
    `const INLINE_RE = /(?<![0-9a-fA-F#])#(\d+)\b/g;`
  to:
    `const INLINE_RE = /#(\d+)\b/g;`
- New unit test (in the `'scanContent() — inline citation detection'` describe block):
  ```js
  test('github-style citation: owner/repo#NNN is detected', () => {
    const hits = scanContent('upstream bug anthropics/claude-code#13898 strips MCP tools');
    assert.equal(hits.length, 1, 'should detect one hit');
    assert.equal(hits[0].text, '#13898', 'text should be #13898');
    assert.equal(hits[0].category, 'inline', 'category should be inline');
  });
  ```
- The unit test is added in Commit 1 BEFORE the regex is changed — it is RED at that point.
- Commit 2 changes the regex; the unit test turns GREEN but corpus turns RED.
- Commit 3 fixes gsd-ai-researcher.md:26 so all tests are GREEN.
- All three commits must pass `npm test` at the END of each respective commit? No — only
  Commit 1 and Commit 2 intentionally leave tests RED. Only Commit 3 restores full GREEN.
  The executor MUST NOT run `npm test` between commits 1 and 2 as a gate; only after Commit 3.

</specifics>

<canonical_refs>
## Canonical References

- `tests/no-issue-citations.test.cjs` — guard test being modified
- `agents/gsd-ai-researcher.md:26` — citation being removed
- Phase 67 VERIFICATION.md — documents the original false negative with full context

</canonical_refs>
