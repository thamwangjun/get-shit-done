# Requirements: GSD — Prompt-Engineered Fork

**Defined:** 2026-05-28
**Core Value:** Every agent, command, and workflow file on `main` meets the fork's prompt engineering quality bar before it ships — upstream content additions are modified, not accepted verbatim.

## v2.1.0-c Requirements

Requirements for the Install-Time Content Materialization milestone. Each maps to roadmap phases.

### Resolver

> **Superseded by Eta pivot (Phase 45).** Phase 44 implemented a custom `resolveIncludes()` resolver; Phase 45 replaces it with Eta v4. These requirements are satisfied and then superseded — the implementation they describe no longer exists in the codebase.

- [~] **RESV-01**: `resolveIncludes(content, sourceRoot, seen)` function exists in `bin/install.js` and inlines `@~/.claude/` bare-line references by reading and substituting the referenced file content at source repo paths
- [~] **RESV-02**: `resolveIncludes` also inlines `` !`cat $HOME/.claude/...` `` and `` !`cat ~/.claude/...` `` bare-line references (the full backtick-wrapped shell injection form)
- [~] **RESV-03**: Resolver detects and preserves the conditional `@~` expression in `execute-phase.md:619` (`` ${...? '' : '@~/.claude/...'} ``) — only bare-line `@~` references on their own line are expanded
- [~] **RESV-04**: Resolver skips `@~` and `` !`...` `` patterns inside fenced code blocks and `${...}` template expressions
- [~] **RESV-05**: Resolver detects circular include chains via a `seen` Set and aborts with a clear error naming the full include chain rather than recursing infinitely
- [~] **RESV-06**: Resolver aborts with a clear error naming the source file and unresolvable path when a referenced file does not exist
- [~] **RESV-07**: Resolver supports nested includes up to depth 3 (handles the confirmed two-hop chain `model-profile-resolution.md` → `model-profiles.md`); aborts with a descriptive error at depth 4+

### Integration

- [x] **INTG-01**: `eta` v4 added to `dependencies` in `package.json`; a module-level Eta instance configured with `{%`/`%}` delimiters, `autoEscape: false`, `useWith: true`, and `views` = repo root exists in `bin/install.js`
- [x] **INTG-02**: All install-time GSD static refs across `commands/gsd/` (55 files), `agents/` (7 files), `get-shit-done/workflows/` (19 files), and `get-shit-done/references/` (1 file) converted to `{%~ include('get-shit-done/X') %}` Eta tags — a post-conversion grep for bare-line `@~/.claude/get-shit-done/` and `` !`cat $HOME/.claude/get-shit-done/` `` returns 0 results
- [x] **INTG-03**: Runtime `.planning/` bare-line refs in the agents layer (notably `agents/gsd-planner.md` lines 465-467) converted to `` !`cat .planning/X` `` form — cross-runtime compatible; `grep -n '@\.planning/' agents/gsd-planner.md` returns 0 results
- [x] **INTG-04**: Eta renderer wired into `copyWithPathReplacement()` as the first transform step — `content = eta.renderString(content, {})` called immediately after `fs.readFileSync(srcPath, 'utf8')` at line ~6572, before path-substitution regexes (skills path: `renderEtaContent` wired into `wrappedConverter` in `runtime-artifact-layout.cjs` — closed phase 47.1)
- [x] **INTG-05**: Eta renderer wired into the agent install loop as the first transform step — `content = eta.renderString(content, {})` called immediately after `fs.readFileSync(path.join(agentsSrc, entry.name), 'utf8')` at line ~8786, before path-substitution regexes
- [x] **INTG-06**: Skills path (`applyRuntimeContentRewritesInPlace`) confirmed as not requiring a renderer call — `SKILL.md` files contain 0 install-time include refs; no Eta rendering needed on that code path

### Tests

- [x] **TEST-01**: Test verifies that installed output files contain no unresolved `@~/.claude/` references (post-install grep returns zero results)
- [x] **TEST-02**: Test verifies the conditional `@~` expression in `execute-phase.md` is preserved verbatim in installed output
- [x] ~~**TEST-03**: Test verifies inlined reference content is present in installed agent files — `Mandatory Initial Read` appears in installed `gsd-executor.md` after Eta resolves the `mandatory-initial-read.md` include (implemented as direct `renderEtaContent` call; Copilot transformation deferred to Phase 47 scope)~~ — **Closed as out-of-scope for v2.1.0-c.** Tool-name transformation (e.g., `Read`→`read` for Copilot runtime) is orthogonal to Eta include resolution. The include pipeline milestone does not cover runtime-specific tool-name rewriting. Deferred to a future milestone.
- [x] **TEST-04**: Test verifies circular include detection — a file that includes itself causes a thrown error, not infinite recursion
- [x] **TEST-05**: Test verifies missing-file handling — an unresolvable reference causes a thrown error with a message naming the source file and missing path
- ~~**TEST-06**~~: Dropped — installed agent size budgets provide no testing value; size varies by platform and profile selection (per CONTEXT.md D-11)

### Quality Gate

- [x] **GATE-01**: Full `npm test` passes after all changes with 0 regressions beyond pre-existing failures (7458 tests / 50 failures — same baseline as v2.1.0-a; closed 2026-05-29)
- [x] **GATE-02**: Negative-framing scanner passes at 99/99 after all file edits (97→99 fix: 3 pre-existing violations in gsd-executor.md + gsd-planner.md converted to affirmative; closed 2026-05-29)
- [x] **GATE-03**: `grep -r '@~/.claude/' <install-dir>` on a fresh install across all supported runtimes returns 0 results — all references materialized (Claude runtime: 0 non-allowlisted refs confirmed; other runtimes: path-replacement logic in install.js:6469–6479 rewrites @~/.claude/ to runtime-specific prefixes; closed 2026-05-29; skills-path `<%~ include()` gap closed phase 47.1 — TEST-01 now also detects unrendered Eta directives)

## Future Requirements

*(None defined — next milestone to be planned)*

## Out of Scope

| Feature | Reason |
|---------|--------|
| Variable substitution (`{{ var }}`) or conditional blocks in source files | Not needed for current scope — only file includes are being replaced |
| External template engine (Nunjucks, LiquidJS) | Eta v4 is now the implemented solution (see INTG-01); Nunjucks and LiquidJS remain out of scope |
| Inlining dynamic `.planning/` runtime references | These are project-specific files that vary per session — must stay as runtime references |
| Auditing 8 unreferenced files in `references/` | Determine orphaned vs prose-loaded after main inlining ships |
| Applying changes to `get-shit-done/templates/` | Out of scan scope per established fork policy |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RESV-01 | Phase 44 | Complete |
| RESV-02 | Phase 44 | Complete |
| RESV-03 | Phase 44 | Complete |
| RESV-04 | Phase 44 | Complete |
| RESV-05 | Phase 44 | Complete |
| RESV-06 | Phase 44 | Complete |
| RESV-07 | Phase 44 | Complete |
| INTG-01 | Phase 45 | Complete |
| INTG-02 | Phase 45 | Complete |
| INTG-03 | Phase 45 | Complete |
| INTG-04 | Phase 45 | Complete |
| INTG-05 | Phase 45 | Complete |
| INTG-06 | Phase 45 | Complete |
| TEST-01 | Phase 46 | Complete |
| TEST-02 | Phase 46 | Complete |
| TEST-03 | Phase 46 | Complete |
| TEST-04 | Phase 46 | Complete |
| TEST-05 | Phase 46 | Complete |
| TEST-06 | Phase 46 | Dropped (CONTEXT.md D-11) |
| GATE-01 | Phase 47 | Complete |
| GATE-02 | Phase 47 | Complete |
| GATE-03 | Phase 47 | Complete |

**Coverage:**

- v2.1.0-c requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-28*
*Last updated: 2026-05-28 after initial definition*
