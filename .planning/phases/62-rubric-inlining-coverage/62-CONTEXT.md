# Phase 62: Rubric Inlining Coverage - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Add one test to `tests/debug-session-management.test.cjs` that reads `agents/gsd-user-profiler.md` and asserts (via three separate `assert.ok()` calls) that the `load_rubric` step exists and references the Eta-inlined rubric via `<reference>` block rather than a bare file read. All assertions target the full file — no block slicing needed (the load_rubric step is the only rubric-loading site).

**In scope:** One new `describe` block with one `test()` in the existing test file; three `assert.ok()` calls.
**Out of scope:** Modifying any agent/workflow source file; adding new test files.

</domain>

<decisions>
## Implementation Decisions

### Test file & structure
- **D-01:** Add a new `describe('phase-62: rubric inlining coverage', () => { ... })` block to `tests/debug-session-management.test.cjs`, appended after the existing blocks. Matches the pattern of phases 60/61 appending new describe blocks to existing files, and keeps both coverage-gap phases (62 and 63) in the same file.

### Assertion tokens (three separate assert.ok() calls)
- **D-02:** `assert.ok(content.includes('<step name="load_rubric">'), ...)` — confirms the load_rubric step exists in the file (SC-1).
- **D-03:** `assert.ok(content.includes('user-profiling.md'), ...)` — confirms the specific rubric filename is referenced (SC-2 literal match from ROADMAP).
- **D-04:** `assert.ok(content.includes('included above in the \`<reference>\` block'), ...)` — confirms the inlining confirmation phrase from the load_rubric step body (RIC-01 requirement text). This is the strongest guard against regression to a bare-read pattern.

### Why three assertions
Three separate calls give unambiguous failure attribution: SC-1 and SC-2 are the ROADMAP's stated success criteria; D-04 is the additional token from the RIC-01 requirement text that confirms the step explicitly describes the inlined approach rather than just referencing the filename.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source file under test
- `agents/gsd-user-profiler.md` — read the `<step name="load_rubric">` block (line 54–55) and the `<reference>` block (lines 40–50). The Eta include tag `<%~ include('get-shit-done/references/user-profiling.md') %>` is on line 41; the inlining phrase is on line 55.

### Test file to extend
- `tests/debug-session-management.test.cjs` — append a new `describe('phase-62: ...)` block after the final existing `describe` block. Existing tests here use `fs.readFileSync(path.join(process.cwd(), 'agents', '...'), 'utf8')` + `assert.ok(content.includes(...))` — mirror this pattern exactly.

### Requirements & success criteria
- `.planning/REQUIREMENTS.md` §Rubric Inlining Coverage (RIC-01) — the locked requirement.
- `.planning/ROADMAP.md` "Phase 62: Rubric Inlining Coverage" — 4 success criteria (SC-1 through SC-4).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Pattern from `debug-session-management.test.cjs` existing tests:
  ```js
  const content = fs.readFileSync(path.join(process.cwd(), 'agents', 'gsd-user-profiler.md'), 'utf8');
  assert.ok(content.includes('<step name="load_rubric">'), 'gsd-user-profiler missing load_rubric step');
  ```
  Reuse `fs` and `path` already imported at top of file — no new requires needed.

### Established Patterns
- One `test()` per logical assertion group; `assert.ok(condition, failureMessage)` with descriptive message naming the file and token.
- New `describe` block appended at end of file — do not fold into existing debug-session-manager describe blocks.
- No block slicing needed for this phase (unlike phase 61's `<task_commit_protocol>` slice) — load_rubric is the only rubric-loading site.

### Integration Points
- New describe block appended to `tests/debug-session-management.test.cjs`; no other test or source files touched.

</code_context>

<specifics>
## Specific Ideas

- The three assertion tokens are drawn directly from the existing file content verified during discussion:
  - `<step name="load_rubric">` — line 54
  - `user-profiling.md` — line 41 (inside Eta include tag)
  - `included above in the \`<reference>\` block` — line 55 (load_rubric step body)
- The "included above" phrase is the distinguishing marker: a bare-read regression would say something like "Read agents/user-profiling.md" instead.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 62-rubric-inlining-coverage*
*Context gathered: 2026-06-08*
