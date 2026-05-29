# Phase 44: Resolver Core - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-28
**Phase:** 44-resolver-core
**Areas discussed:** Test file placement, seen Set + depth design, Bare-line definition, sourceRoot path mapping

---

## Test File Placement

| Option | Description | Selected |
|--------|-------------|----------|
| New tests/resolve-includes.test.cjs | Dedicated file — matches focused unit test files like atomic-write.test.cjs | ✓ |
| Add to tests/install.test.cjs | Extend existing installer tests — already large, mixing concerns | |
| New tests/install-resolve-includes.test.cjs | Hyphenated variant grouping with install-* files | |

**User's choice:** New dedicated `tests/resolve-includes.test.cjs`
**Notes:** Test scope = exactly the 4 success criteria from ROADMAP.md Phase 44. Additional edge cases belong in Phase 46 regression suite.

---

## seen Set + depth design

| Option | Description | Selected |
|--------|-------------|----------|
| Separate: seen Set for circular, depth counter for limit | Clean semantics — seen catches A→B→A; depth catches long linear chains | ✓ |
| seen.size as depth proxy | Simpler but incorrect for diamond patterns | |
| You decide | Defer to Claude | |

**User's choice:** Separate mechanisms
**Notes:** Circular detection must fail fast — throw on detection. This should be both tested and enforced in install.js. Depth 4+ throws with descriptive error (not silent skip). Function signature: `resolveIncludes(content, sourceRoot, seen, depth = 0)` — 4th parameter with default for recursive calls.

---

## Bare-line Definition

| Option | Description | Selected |
|--------|-------------|----------|
| Trimmed-line match for @~/.claude/ only | Scoped to GSD-specific paths | |
| Column-0 only | No leading whitespace allowed | |
| You decide | Defer to Claude | |

**User's choice:** Any bare `@filepath` on its own line (general); `` !`cat <any path>` `` forms
**Notes:** User clarified the patterns are more general — expand any bare `@filepath` line and any `` !`cat` `` form (not limited to `~/.claude/` paths). Other `` !`bash...` `` forms are not expanded.

---

## sourceRoot Path Mapping

| Option | Description | Selected |
|--------|-------------|----------|
| sourceRoot = project root, ~ maps to it | Strip `~/.claude/` prefix, join remainder with sourceRoot | ✓ |
| sourceRoot = ~/.claude equivalent | sourceRoot IS the directory @ paths are relative to | |

**User's choice:** sourceRoot = project root, strip `~/.claude/` prefix
**Notes:** Same stripping applies to `` !`cat ~/.claude/...` `` and `$HOME/.claude/` forms. Non-`~/.claude/` @-refs resolve relative to the source file's directory.

---

## Claude's Discretion

- Function placement within `bin/install.js` (near content-processing helpers around lines 1572–1750)
- Error message wording for circular and depth limit errors
- Whether a `sourceFilePath` parameter is needed for relative `@`-reference resolution
- Section banner naming

## Deferred Ideas

None — discussion stayed within phase scope.
