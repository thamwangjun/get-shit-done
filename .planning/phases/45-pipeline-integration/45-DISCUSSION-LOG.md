# Phase 45: Pipeline Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-28
**Phase:** 45-pipeline-integration
**Areas discussed:** Revert strategy, Template engine pivot, .planning/ ref exclusion, Skills path wiring (INTG-06)

---

## Revert Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| git revert (two commits) | Revert 9892c377 then 4ba5dde1 | |
| Scripted sed pass | Replace !`cat $HOME/.claude/` with @$HOME/.claude/ across 55 files | |
| Pivot to Eta v4 | Convert all refs to Eta include tags instead of reverting to @~ | ✓ |

**User's choice:** Pivot to Eta v4 — after discovering the STACK-template-engine.md research (which recommended Eta) had been bypassed in Phase 44 with a custom resolver.
**Notes:** User asked "aren't we converting to a single templating format?" — which surfaced that Phase 44 implemented a custom `resolveIncludes()` without formally choosing between the research recommendation (Eta) and the custom approach.

---

## Template Engine

| Option | Description | Selected |
|--------|-------------|----------|
| Stick with custom resolver | resolveIncludes() already built and tested (5 unit tests). Covers this milestone's scope (file inlining only). | |
| Pivot to Eta v4 | Adopt research recommendation. Cleaner long-term if variables/conditionals needed. Requires rewriting Phase 44. | ✓ |

**User's choice:** Pivot to Eta v4.
**Notes:** Full pivot in Phase 45 — not staged. Phase 44's `resolveIncludes()` and 5 tests are removed; RESV-01–07 requirements superseded.

### Eta Bundling

| Option | Description | Selected |
|--------|-------------|----------|
| esbuild bundle: install.dist.js | Add esbuild devDep + build:installer script. Shipped binary becomes install.dist.js. | |
| Add eta as runtime dependency | Add eta to dependencies (not devDependencies). Simple — require('eta') just works. | ✓ |
| Inline Eta CJS source | Copy Eta's ~204KB CJS into install.js directly. | |

**User's choice:** Add eta as runtime dependency.
**Notes:** No build step needed. `npx get-shit-done-redux` installs dependencies automatically.

### Eta Tag Syntax

| Option | Description | Selected |
|--------|-------------|----------|
| Custom delimiters: {%~ include('...') %} | Avoids {{ }} collision with GSD agent prose. | ✓ |
| Default delimiters: <%~ include('...') %> | Eta's default. Simpler config. | |

**User's choice:** Custom delimiters `{%`, `%}`.

---

## Conversion Rules Clarification

Discussion surfaced important runtime/install-time distinction:

- `@` notation is **Claude Code-only** — not supported in Skills runtimes (Codex, Copilot, Cursor, etc.)
- Skills runtimes only support `` !`bash command` `` notation for runtime substitution
- Eta `{%~ include() %}` handles install-time static GSD file inlining
- `` !`cat .planning/X` `` is the correct cross-runtime form for runtime project-specific refs

`@.planning/X` bare-line refs (found in `agents/gsd-planner.md` lines 465–467) must convert to `` !`cat .planning/X` `` form, not Eta tags, because `.planning/` content is project-specific and must be read at runtime.

---

## Conversion Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Expand Phase 45 to all 3 layers | Commands + agents + workflows all converted. SC #3 achievable. | ✓ |
| Commands + wiring only; agents/workflows in Phase 47 | SC #3 deferred. | |
| Split into sub-phases 45.1 / 45.2 | Smaller execution units. | |

**User's choice:** Expand Phase 45 to all 3 layers (commands 55 files, agents 7 files, workflows 19 files, references 1 file — ~180 lines).

---

## .planning/ Ref Exclusion (INTG-05)

**Resolved by design.** With Eta's explicit `{%~ include() %}` tags, `` !`cat .planning/STATE.md` `` is not an Eta tag and passes through unchanged. No extra guard needed.

User clarified that `.planning/` refs should remain as `` !`cat .planning/X` `` form (cross-runtime), not `@` notation (Claude-only).

---

## Skills Path Wiring (INTG-06)

**No wiring needed.** Codebase scout confirmed 0 `@~/.claude/` or `` !`cat` `` refs in `get-shit-done/skills/` SKILL.md files. Skills are self-contained. `applyRuntimeContentRewritesInPlace` does not need a resolver call.

---

## Claude's Discretion

- Exact Eta constructor config placement in `bin/install.js`
- Whether to add a section banner for the Eta setup block
- Error handling when Eta fails to resolve an include (throw vs warn-and-skip)
- Conversion script design (Node.js vs bash, single-pass vs staged)

## Deferred Ideas

- Variable substitution and conditionals via Eta — out of scope for this milestone (file inlining only)
- Converting inline `@~` prose references — intentionally retained as instructional text, not executed
