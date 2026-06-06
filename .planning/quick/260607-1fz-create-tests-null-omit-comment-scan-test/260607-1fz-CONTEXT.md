---
quick_id: 260607-1fz
gathered: 2026-06-06
status: Ready for planning
---

# Quick Task 260607-1fz: Create null-omit-comment-scan test — Context

**Gathered:** 2026-06-06
**Status:** Ready for planning

<domain>
## Task Boundary

Create `tests/null-omit-comment-scan.test.cjs` — a regression guard that fails if any
standalone `effort={*_effort_arg}` line inside an Agent() invocation is missing its
`# omit this line when` comment. Guards against regressions to the convention added in
quick task 260607-0kd.

</domain>

<decisions>
## Implementation Decisions

### Helper reuse
- Copy `collectMarkdownFiles` and the paren-depth state machine loop verbatim from
  `bare-effort-arg-scan.test.cjs` into the new file. Self-contained, no shared-module
  coupling. Do not re-implement the helpers differently.

### Column coordinate
- `col` in violation records is the actual 1-based column of `effort=` in the full line
  (i.e. `line.indexOf('effort=') + 1`). Matches the editor-navigation precision pattern
  established by bare-effort-arg-scan.

### Claude's Discretion
- Exact internal variable names for the scanner function
- Whether to name the helper `collectMarkdownFiles` or `walkDir` (either is fine; spec
  says "reuse the walkDir and paren-depth logic")

</decisions>

<specifics>
## Specific Requirements

- Standalone detection regex: `/^\s*effort=\{([A-Za-z_][A-Za-z_0-9]*_effort_arg)\}/`
- Null-omit comment pattern: `# omit this line when` (substring check)
- Scan dirs: `agents/`, `get-shit-done/workflows/`, `commands/`
- Describe block name: `'null-omit-comment-scan: effort= lines must carry null-omit comment'`
- Test name: `'every standalone effort={*_effort_arg} in Agent invocations has # omit this line when'`
- Header comment: `// allow-test-rule: source-text-is-the-product`
- Violation format: `file:line:col — effort={token} missing null-omit comment`

Known inline (non-standalone) cases that MUST NOT be flagged:
- `get-shit-done/workflows/code-review-fix.md` lines 207, 290, 324
- `get-shit-done/workflows/new-milestone.md` lines 343, 376, 510
- `get-shit-done/workflows/discuss-phase-assumptions.md` line 272

</specifics>

<canonical_refs>
## Canonical References

- `tests/bare-effort-arg-scan.test.cjs` — source for verbatim helper copy
- Quick task 260607-0kd — established the null-omit comment convention being guarded

</canonical_refs>
