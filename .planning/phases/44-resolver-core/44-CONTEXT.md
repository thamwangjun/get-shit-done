# Phase 44: Resolver Core - Context

**Gathered:** 2026-05-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Build and unit-test `resolveIncludes(content, sourceRoot, seen, depth = 0)` as a correct, fully-tested pure function in `bin/install.js`. All edge cases are validated in isolation before any pipeline wiring. The function inlines bare-line `@filepath` and `` !`cat ...` `` references by reading referenced files at source repo paths.

This phase writes one new function and one new test file. It does not wire the function into the install pipeline (that is Phase 45).

</domain>

<decisions>
## Implementation Decisions

### Test File
- **D-01:** New dedicated test file: `tests/resolve-includes.test.cjs`
- **D-02:** Test scope = exactly the 4 success criteria from ROADMAP.md Phase 44 (not all 7 RESV requirements). Additional edge cases belong in Phase 46 regression suite.

### Function Signature
- **D-03:** `resolveIncludes(content, sourceRoot, seen, depth = 0)` — 4 parameters, `depth` defaults to 0 so external callers omit it, recursive calls pass `depth + 1`.
- **D-04:** `seen` is a `Set` tracking file paths in the current call stack; callers pass `new Set()`.

### Circular Detection and Depth Limiting
- **D-05:** Separate mechanisms — `seen` Set for circular detection, `depth` integer for depth limiting. They are not the same: a diamond include pattern (A→B→D and A→C→D) would confuse `seen.size` as depth but works correctly with a separate counter.
- **D-06:** Circular detection: if the file to be included is already in `seen`, throw an Error naming the full include chain. Must fail fast — no infinite recursion.
- **D-07:** Depth limit: if `depth >= 3`, throw with a descriptive error naming the chain that triggered it (matches RESV-07 "aborts with a descriptive error at depth 4+"). Silent skip is not acceptable.
- **D-08:** Circular detection is both tested (unit test asserting the error message contains the include chain) and enforced in `bin/install.js`.

### Bare-Line Pattern Matching
- **D-09:** Expand **any bare `@filepath`** that is the sole meaningful content of a line (trim and check). Not limited to `@~/.claude/` — any `@`-reference on its own line is expanded.
- **D-10:** Expand **`` !`cat <any path>` ``** bare lines. Scoped to `cat` commands only — other `` !`...` `` commands are not expanded (non-read-only, dynamic output).
- **D-11:** Skip patterns inside fenced code blocks (toggle on triple-backtick) — content between ` ``` ` markers is passed through verbatim.
- **D-12:** Skip `@~` and `` !`...` `` patterns inside `${...}` template expressions — the conditional guard in `execute-phase.md:619` must pass through unchanged.

### Source Path Resolution
- **D-13:** `sourceRoot` = project root (repo root, the directory containing `get-shit-done/`, `bin/`, `agents/`, etc.).
- **D-14:** For `@~/.claude/foo` and `@$HOME/.claude/foo`: strip the `@`, strip the `~/.claude/` or `$HOME/.claude/` prefix, then `path.join(sourceRoot, remainder)`.
- **D-15:** Same strip logic for `` !`cat ~/.claude/foo` `` and `` !`cat $HOME/.claude/foo` `` forms.
- **D-16:** For bare `@`-references that do NOT start with `~/.claude/` or `$HOME/.claude/` (e.g., `@agents/foo.md`): resolve relative to the source file's directory (standard include semantics). The function needs the source file's path for this case.

### Claude's Discretion
- Function placement within `bin/install.js`: place near other content-processing helper functions (around the `processAttribution`/`replaceRelativePathReference` cluster, lines 1572–1750). Use a `// ─── Include Resolution ───` section banner.
- Error message wording for circular and depth errors — use descriptive prose that names the chain.
- Whether to add a `sourceFilePath` parameter to handle relative `@`-references (D-16 may require it) — Claude decides based on what the success criteria tests actually need.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and Roadmap
- `.planning/REQUIREMENTS.md` — RESV-01 through RESV-07 definitions (the full contract for resolveIncludes)
- `.planning/ROADMAP.md` §Phase 44 — 4 success criteria that define when phase 44 is complete; these map directly to the 4 unit tests

### Key Source File
- `bin/install.js` — Where the function lives. 11,522 lines. Content-processing functions cluster around lines 1572–1750. Exports block is near the end (~line 11440). `module.exports` follows the `GSD_TEST_MODE` guard pattern.
- `get-shit-done/workflows/execute-phase.md` line 619 — The conditional `@~` expression `${CONTEXT_WINDOW < 200000 ? '' : '@~/.claude/...'}` that MUST pass through the resolver verbatim (RESV-03 test case).

### Testing Patterns
- `tests/helpers.cjs` — Shared test utilities. `createTempDir()` for fixture directories.
- `tests/install.test.cjs` — Example of how to import and test exported functions from `bin/install.js` using `GSD_TEST_MODE=1` guard.
- `tests/frontmatter.test.cjs` — Example of a focused pure-function unit test file (closest analog to what resolve-includes.test.cjs should look like).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `processAttribution(content, attribution)` (bin/install.js:1572) — Pure string→string content transformer. `resolveIncludes` should follow the same pattern: takes content string, returns modified content string.
- `replaceRelativePathReference(content, fromPath, toPath)` (bin/install.js:1739) — Another content string transformer. Good style reference.
- `createTempDir()` in `tests/helpers.cjs` — Use this for writing fixture files that resolveIncludes reads during tests.

### Established Patterns
- `GSD_TEST_MODE` guard: `bin/install.js` only runs main logic when `!process.env.GSD_TEST_MODE`. Test files set `process.env.GSD_TEST_MODE = '1'` before requiring the module.
- Export pattern: single `module.exports = { ... }` block at the bottom of `bin/install.js`. Add `resolveIncludes` there so tests can import it directly.
- Content transformer functions take `(content, ...params)` and return the modified content string. Pure — no side effects.
- Test helper `createTempDir()` + `fs.writeFileSync()` for fixture files, `cleanup(tmpDir)` in `afterEach`.

### Integration Points
- Phase 45 will wire `resolveIncludes` at two points in `copyWithPathReplacement` (bin/install.js:6399) — the function must be designed to slot in as a content post-processor.
- The `seen` Set and `depth` parameters enable safe recursive calls when inlined content itself contains `@`-references.

</code_context>

<specifics>
## Specific Ideas

- The conditional expression in `execute-phase.md:619` is the canonical test case for RESV-03 — the test should use the actual line from that file (or an exact copy of it) as fixture input.
- Circular include detection error message must name the full chain (e.g., "Circular include detected: a.md → b.md → a.md") — the ROADMAP success criterion says "full include chain in the error message".
- Missing file error must name both the source file and the unresolvable path — the ROADMAP says "throws with an error naming both".

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 44-resolver-core*
*Context gathered: 2026-05-28*
