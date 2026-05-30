# Phase 45: Pipeline Integration - Context

**Gathered:** 2026-05-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Pivot from the custom `resolveIncludes()` resolver (Phase 44) to **Eta v4** as the install-time template engine. This phase:

1. Removes Phase 44's `resolveIncludes()` implementation and its 5 unit tests
2. Adds `eta` as a runtime dependency
3. Converts all bare-line install-time references across commands, agents, workflows, and references to Eta `{%~ include('...') %}` tags
4. Converts all bare-line `@.planning/X` runtime refs to `` !`cat .planning/X` `` form (cross-runtime compatible)
5. Wires Eta rendering into both `copyWithPathReplacement()` and the agent install loop as the first transform step

The result: every installed file is fully self-contained — no surviving `@~/.claude/` patterns in any installed output.

</domain>

<decisions>
## Implementation Decisions

### Template Engine

- **D-01:** Use **Eta v4** as the template engine. Add `eta` to `dependencies` in `package.json` (runtime dep, not devDep — no build step needed; `npx get-shit-done-redux` installs dependencies).
- **D-02:** Configure Eta with **custom delimiters** `{%` / `%}` to avoid collision with `{{ }}` notation already used in GSD agent prose files.
- **D-03:** Use raw output prefix `~` for includes: `{%~ include('get-shit-done/path/to/file.md') %}`. The `~` suppresses HTML escaping — required for Markdown content.
- **D-04:** Configure Eta with `autoEscape: false` and `useWith: true`. Set `views` to `sourceRoot` (the repo root) so include paths resolve relative to repo root.
- **D-05:** Phase 44's `resolveIncludes()` function and `tests/resolve-includes.test.cjs` (5 tests) are removed. RESV-01 through RESV-07 requirements are superseded by the Eta pivot.

### Conversion Rules

- **D-06:** Install-time GSD static refs → Eta include tag:
  - `` !`cat $HOME/.claude/get-shit-done/X` `` → `{%~ include('get-shit-done/X') %}`
  - `` !`cat ~/.claude/get-shit-done/X` `` → `{%~ include('get-shit-done/X') %}`
  - `@~/.claude/get-shit-done/X` (bare-line only) → `{%~ include('get-shit-done/X') %}`
  - `@$HOME/.claude/get-shit-done/X` (bare-line only) → `{%~ include('get-shit-done/X') %}`
- **D-07:** Runtime project-specific refs → cross-runtime bash form:
  - `@.planning/X` (bare-line) → `` !`cat .planning/X` ``
  - `` !`cat .planning/X` `` → **retain as-is** (already correct form)
- **D-08:** Inline `@~` references within prose (not on their own line) → **retain as-is**. These are instructional text directed at the AI model, not injected content.
- **D-09:** Reason for retaining `` !`cat .planning/X` `` as runtime: `.planning/` files are project-specific state that varies per project. They must be read at runtime, not inlined at install time. The `@` notation is Claude Code-only and does not work in Skills runtimes (Codex, Copilot, Cursor, etc.) — `` !`cat .planning/X` `` is the cross-runtime compatible form.

### Conversion Scope

- **D-10:** Full conversion scope across all 4 layers:

  | Layer | Files | Lines |
  |-------|-------|-------|
  | `commands/gsd/` | 55 files | 115 `` !`cat $HOME/.claude/...` `` lines |
  | `agents/` | 7 files | 26 bare-line `@~` lines + any `@.planning/` lines |
  | `get-shit-done/workflows/` | 19 files | 38 bare-line `@~` lines |
  | `get-shit-done/references/` | 1 file | 1 bare-line `@~` line |
  | **Total** | **~82 files** | **~180 lines** |

  Notable: `agents/gsd-planner.md` has 3 `@.planning/` bare-line refs that convert to `` !`cat .planning/X` `` form.

### Wiring in install.js

- **D-11:** Wire Eta rendering into `copyWithPathReplacement()` (line ~6571 in `bin/install.js`) as the **first transform step** — immediately after `fs.readFileSync(srcPath, 'utf8')`, before path substitution regexes and all runtime converters.
- **D-12:** Wire Eta rendering into the **agent install loop** (line ~8646 in `bin/install.js`) as the first transform step — same position: after `readFileSync`, before path substitution.
- **D-13:** Skills path (`applyRuntimeContentRewritesInPlace`) does NOT need a resolver call — skills SKILL.md files have 0 install-time include refs (confirmed by codebase scout).
- **D-14:** INTG-05 (`.planning/` exclusion) is handled by design — Eta only processes explicit `{%~ include() %}` tags. `` !`cat .planning/STATE.md` `` is not an Eta tag and passes through unchanged.
- **D-15:** Eta `sourceRoot` = repo root (the directory containing `get-shit-done/`, `agents/`, `commands/`). Pass as `path.join(__dirname, '..')` since `bin/install.js` lives in `bin/`.

### Phase 44 Cleanup

- **D-16:** Remove `resolveIncludes` from `module.exports` block in `bin/install.js`.
- **D-17:** Delete `tests/resolve-includes.test.cjs`.
- **D-18:** Update `REQUIREMENTS.md`: mark RESV-01 through RESV-07 as superseded (Eta pivot). Update INTG-01 through INTG-06 to reflect Eta approach.
- **D-19:** Update `ROADMAP.md` Phase 44 and Phase 45 descriptions to reflect the pivot decision.

### Claude's Discretion

- Exact Eta constructor config and where to place it in `bin/install.js` (near the content-processing cluster, lines 1572–1750 area, or at top of file as a module-level constant).
- Whether to add a `// ─── Eta Template Engine ───` section banner for the Eta setup block.
- Error handling when Eta fails to resolve an include — whether to throw (fail fast) or warn and skip.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and Roadmap
- `.planning/REQUIREMENTS.md` — INTG-01 through INTG-06 definitions (update these to reflect Eta); RESV-01–07 will be marked superseded
- `.planning/ROADMAP.md` §Phase 45 — success criteria; note SC #3 now requires converting all 4 layers

### Key Source Files
- `bin/install.js` — Main installer. `copyWithPathReplacement()` at line ~6539; agent install loop at line ~8646; `resolveIncludes()` (to remove) at line 1760; `module.exports` block at line ~11540.
- `agents/gsd-planner.md` lines 465–467 — Has `@.planning/` bare-line refs that must convert to `` !`cat .planning/X` `` form.

### Eta Documentation
- `STACK-template-engine.md` at `.planning/research/STACK-template-engine.md` — Full evaluation that recommended Eta v4. Contains Eta config examples, delimiter customization, `autoEscape`, `useWith`, CJS/ESM note (verify `const { Eta } = require('eta')` works before implementing).
- Eta npm: `eta` v4.6.0, zero runtime deps, CJS build available. **Verify CJS import works**: `const { Eta } = require('eta')` — the research notes v4 is ESM-first; confirm the CJS path.

### Phase 44 Artifacts (to supersede)
- `.planning/phases/44-resolver-core/44-CONTEXT.md` — D-01 through D-19 decisions from Phase 44; all are superseded by the Eta pivot.
- `tests/resolve-includes.test.cjs` — 5 tests to delete.

### Testing Patterns
- `tests/helpers.cjs` — `createTempDir()`, `cleanup()` for fixture directories.
- `tests/install.test.cjs` — Pattern for testing `bin/install.js` exports with `GSD_TEST_MODE=1`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Wiring Points in bin/install.js
- `copyWithPathReplacement()` at line 6539: processes commands and `get-shit-done/` subtree. The `let content = fs.readFileSync(srcPath, 'utf8')` at line ~6571 is the insertion point — add `content = eta.renderString(content, {})` immediately after.
- Agent install loop at line ~8646: same pattern — `let content = fs.readFileSync(...)` followed immediately by path substitution. Insert Eta rendering before path substitution.
- `processAttribution()` at line 1572 — style reference: pure `(content, ...params) → content` transformer. Eta rendering follows the same pattern.
- `replaceRelativePathReference()` at line 1739 — another content string transformer. Good style reference.

### Conversion Script Approach
- 55 command files, 26 agent lines, 38 workflow lines, 1 reference line — too many for manual edits. The planner should design a conversion script (Node.js or bash) that applies D-06 and D-07 transformations across all affected files atomically, with a post-conversion grep verification.

### Package.json
- Current `dependencies`: `@anthropic-ai/claude-agent-sdk`, `ws`. Add `eta` here (not `devDependencies`).
- `prepublishOnly`: currently `npm run build:hooks && npm run build:sdk`. No build step needed for Eta (runtime dep).

### GSD_TEST_MODE Pattern
- `bin/install.js` exports functions only when `process.env.GSD_TEST_MODE` is set. The Eta instance setup should happen inside the module body (module-level), not guarded by `GSD_TEST_MODE` — the Eta instance is needed both in tests and production.

</code_context>

<specifics>
## Specific Ideas

- The `STACK-template-engine.md` research file contains working Eta config examples with custom `{%`, `%}` delimiters — use those directly rather than reconstructing from Eta docs.
- Verify `const { Eta } = require('eta')` works (CJS import) before anything else — v4 is ESM-first per the research notes.
- The conversion script should handle BOTH the `` !`cat $HOME/.claude/get-shit-done/X` `` and `@~/.claude/get-shit-done/X` bare-line forms in a single pass. After conversion, run: `grep -r '@~/.claude/get-shit-done/' commands/ agents/ get-shit-done/` should return 0 results.

</specifics>

<deferred>
## Deferred Ideas

- Converting inline `@~` prose references (e.g., `"See @~/.claude/.../foo.md"`) — these are instructional text, not runtime-injected content, and are intentionally out of scope for this milestone.
- Variable substitution and conditionals in Eta templates — Eta supports these but this milestone only uses file includes. Future milestone if needed.

</deferred>

---

*Phase: 45-pipeline-integration*
*Context gathered: 2026-05-28*
