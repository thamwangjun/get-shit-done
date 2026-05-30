# Project Research Summary

**Project:** GSD — Prompt-Engineered Fork (v2.1.0-c Install-Time Content Materialization)
**Domain:** Installer pipeline extension — static file inlining at install time
**Researched:** 2026-05-28
**Confidence:** HIGH

## Executive Summary

The v2.1.0-c milestone solves a runtime reliability problem: GSD currently ships agent, workflow, and command files containing `@~/.claude/...` and `` !`cat` `` include directives, relying on Claude to inject referenced content at runtime. This creates a brittle dependency on the AI tool's file-injection feature. The fix is an install-time `resolveIncludes()` pass in `bin/install.js` that inlines all referenced content into installed files before they are written to disk, so every installed file is fully self-contained.

The research establishes a clear, bounded scope: 107 `@` references across 4 layers (commands, workflows, agents, references) and 117 `` !`cat` `` references (exclusively in `commands/gsd/`). Two insertion points in `install.js` cover the entire corpus: `copyWithPathReplacement()` at line 6432 handles commands, workflows, and references; the agent install loop at line 8646 handles agents. The include corpus is static leaf-node content — reference files do not chain more than two hops — which means the resolver requires only a shallow recursive implementation with a cycle guard. No external template engine dependency is necessary; a focused `resolveIncludes()` pure function of ~80 lines is the right implementation unit.

The highest-risk element is a single conditional include in `execute-phase.md` (line 619) embedded inside a JavaScript template literal: `${CONTEXT_WINDOW < 200000 ? '' : '@~/.claude/...'}`. Any resolver that matches `@~` without confirming the reference is a bare standalone line will corrupt the conditional expression or unconditionally inline a 200+ line file into every agent dispatch. This is the gate constraint the implementation must satisfy before any other inlining logic is written. Everything else — agent size budgets, tool-name transform ordering, single-brace placeholder preservation — follows from it.

## Key Findings

### Recommended Stack

No external template engine is required for this milestone. The scope is bounded to `@~/.claude/...` and `` !`cat ~/.claude/...` `` patterns only — no variable substitution, no conditionals beyond the one that must be preserved verbatim. A focused `resolveIncludes(content, sourceRoot, seen)` function handles the full use case without introducing a new dependency.

If future requirements extend to variable substitution or conditional includes authored in source files, **Eta v4.6.0** is the recommended engine: zero runtime dependencies, 204 KB unpacked, actively maintained (last release 2026-04-25), configurable delimiters (avoids `{{ }}` collision with existing agent prose), and synchronous `render()` API compatible with `install.js`'s synchronous pipeline. Eta would be added as a `devDependency` and bundled into the installer via the existing esbuild build step, preserving the zero-runtime-dependency constraint. LiquidJS v10.27.0 is a viable fallback (actively maintained, familiar Liquid syntax) but 9x larger and carries one transitive dependency. Nunjucks and Mustache are eliminated due to being unmaintained.

**Core technologies:**
- **Custom `resolveIncludes()` function**: Inline `@~` and `` !`cat` `` references — sufficient for current scope, zero footprint
- **Eta v4.6.0** (future devDep, if needed): Template engine for variable/conditional needs — zero runtime deps, esbuild-bundlable, `autoEscape: false` required for Markdown
- **esbuild** (already present): Bundle step infrastructure for any future installer pre-compilation

### Scope of Changes (Features Research)

The research audited all reference injection patterns across the entire codebase. The scope is well-defined.

**Must implement:**
- Inline `@~/.claude/get-shit-done/references/*.md` in workflows (57 occurrences, 20 files) and agents (42 occurrences, 7 files)
- Inline `` !`cat ~/.claude/get-shit-done/workflows/*.md` `` and `` !`cat ~/.claude/get-shit-done/references/*.md` `` in commands (117 occurrences, 55 files)
- Fix 4 command files: `complete-milestone.md` (still on `@` notation); `extract-learnings.md`, `mvp-phase.md`, `ship.md` (mixed notation with duplicate references)
- Remove the duplicate workflow references in the 3 mixed-notation files (each loads the same workflow twice, wasting context)

**Preserve verbatim (must not inline):**
- `.planning/STATE.md` and `.planning/ROADMAP.md` in `add-tests.md` — runtime project files that vary per session
- Conditional `@~` in `execute-phase.md` line 619 — JS template literal evaluated at agent dispatch time
- Agent definition reference in `discuss-phase/modes/advisor.md` — semantically incorrect to inline an agent definition into an orchestrator prompt

**Defer:**
- Auditing 8 unreferenced files in `references/` (`artifact-types.md`, `decimal-phase-calculation.md`, `git-planning-commit.md`, `planner-graphify-auto-update.md`, `planner-human-verify-mode.md`, `planning-config.md`, `workstream-flag.md`, `model-profile-resolution.md`-external) — determine orphaned vs prose-loaded after the main inlining work ships

### Architecture Approach

`resolveIncludes()` is a pure transform function inserted at **position 0** in the existing install pipeline — before path substitution, before runtime-specific converters, before attribution. The pipeline per file becomes: (1) readFileSync raw content, (2) `resolveIncludes()` to expand all static includes against source repo paths, (3) path substitution (`~/.claude/` → runtime prefix), (4) runtime converter (`convertClaudeTo*`), (5) attribution + namespace normalization, (6) writeFileSync.

This ordering is non-negotiable: reference files contain canonical Claude tool names (`Read`, `Bash`) and `~/.claude/` paths that must be present as input to the runtime transform steps. Inlining after any transform step means inlined content bypasses tool-name conversion.

**Two insertion points cover the entire corpus:**
1. `copyWithPathReplacement()` at line 6432 — immediately after `fs.readFileSync(srcPath)`. Covers commands, workflows, references, templates.
2. Agent install loop at line 8646 — immediately after `fs.readFileSync(agentsSrc/entry.name)`. Covers all 7 agent files with `@` references.

**`resolveIncludes()` design contract:**
- Input: raw content string, absolute sourceRoot, optional `seen: Set<string>` for cycle detection
- Path resolution: strip `~/.claude/` or `$HOME/.claude/` prefix, join with sourceRoot (repo layout mirrors install layout)
- Only expand `@~` that appears as a standalone bare reference on its own line — never inside `${}`, backtick expressions, or fenced code blocks
- Missing files: abort with a clear error naming the source file and unresolvable path
- Cycles: abort with the full include chain in the error message
- Max depth: 3 levels (current corpus max is 2 hops; depth 3 is belt-and-suspenders)
- Verbatim insertion only — no substitution on `{{}}` or `{}` tokens in inserted content
- Defined near top of `install.js` alongside existing pure transform functions (`processAttribution`, `replaceRelativePathReference`)

**Skills path note:** `applyRuntimeContentRewritesInPlace` handles `SKILL.md` files (staged copies of commands). Whether this path needs a separate resolver call depends on staging timing — if commands are resolved before staging, skill files inherit the resolved content automatically. If not, a resolver call inside the `walkAndRewrite` loop is needed.

### Critical Pitfalls

1. **Conditional include corruption in `execute-phase.md`** — Line 619 embeds `@~` inside a JS template literal conditional. A naive line-matching regex inlines unconditionally or produces broken syntax. The bare-line detection rule must be implemented first, before any inlining code runs. Automated test required: assert `${CONTEXT_WINDOW < 200000 ?` survives verbatim in installed `execute-phase.md`.

2. **Transform ordering — inlined content bypasses runtime converters** — Inlining after Copilot's `convertClaudeToCopilotContent` leaves `Read`/`Bash` in inlined sections rather than `read`/`execute`. The inline-before-transform invariant must be enforced at both insertion points. Test: install `gsd-executor.md` for Copilot and assert tool names in the inlined `checkpoints.md` section are lowercased.

3. **Circular include chain** — Current corpus has one two-hop chain (`model-profile-resolution.md` → `model-profiles.md`). Cycles can hang the installer. `Set<string>` visit stack with throw-on-cycle must be present in the initial implementation, not added as hardening later.

4. **Agent size budget violation** — `gsd-executor.md` at 771 lines plus `checkpoints.md` at 814 lines approaches the LARGE budget (1,000 lines). The `executor-examples.md` conditional guard (pitfall #1) prevents the worst case, but a post-install line count check is required. Existing `agent-size-budget.test.cjs` runs against source files — it must also run against installed output.

5. **Single-brace placeholder corruption** — Reference files contain intentional literal `{N}`, `{resolved_model}`, `{EXPECTED_BASE}`, `{SOURCE}` patterns. The inliner must insert file content verbatim with zero substitution. Test: assert `{N}` survives in installed output of any file that includes `references/revision-loop.md`.

6. **Double-load in mixed-notation command files** — `extract-learnings.md`, `mvp-phase.md`, and `ship.md` each load the same workflow via both `@` and `` !`cat` ``, duplicating content in the context window. Fix mixed files before wiring the resolver — not after.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Resolver Core + Conditional Guard
**Rationale:** The conditional include guard is the gate constraint — write and unit-test `resolveIncludes()` in isolation before wiring into the install pipeline. Validate the hardest constraint first in a controlled environment.
**Delivers:** `resolveIncludes()` pure function with bare-line detection, cycle guard (`Set<string>` visit stack), max depth 3, missing-file abort, and verbatim insertion. Unit tests: happy path, conditional passthrough, cycle detection, missing file, depth limit.
**Avoids:** Pitfall #1 (conditional corruption), Pitfall #3 (circular chain), Pitfall #5 (placeholder corruption)

### Phase 2: Mixed-File Cleanup + Pipeline Integration
**Rationale:** Fix mixed-notation files first so the resolver sees clean input. Then wire into both `install.js` insertion points and validate end-to-end for the Claude runtime.
**Delivers:** `extract-learnings.md`, `mvp-phase.md`, `ship.md` duplicate references removed. `complete-milestone.md` migrated from `@` to inlining. `resolveIncludes()` called at lines 6432 and 8646. End-to-end Claude runtime install produces zero surviving `@~/.claude/get-shit-done/references/` patterns.
**Avoids:** Pitfall #2 (transform ordering confirmed by integration), Pitfall #6 (double-load removed before wiring)

### Phase 3: Regression Test Suite
**Rationale:** Tests must run against installed output, not source files, for size budget and tool-name transform checks. Build the safety net before expanding to the full runtime matrix.
**Delivers:** Six regression tests — (1) no unresolved `@~` in installed output, (2) conditional include preserved in `execute-phase.md`, (3) tool names transformed inside inlined content for Copilot, (4) circular reference detection throws, (5) missing reference file throws, (6) installed agent line count within budget.
**Uses:** Existing `tests/helpers.cjs` `createTempDir()` and install invocation patterns
**Avoids:** Pitfall #4 (size budget tested on installed output)

### Phase 4: Full Runtime Matrix + Verification
**Rationale:** Validate all supported runtimes produce self-contained files. `npm test` 0 new failures confirms no regressions.
**Delivers:** Zero `@~` or `` !`cat ~/.claude/` `` patterns in installed output across Claude, Copilot, Codex, Gemini, OpenCode, Cursor, and Antigravity runtimes. Full `npm test` green.

### Phase Ordering Rationale

- Phase 1 before Phase 2: the resolver must be correct in isolation before it processes real corpus data. Discovering the conditional guard bug during install testing costs far more than catching it in a targeted unit test.
- Mixed-file cleanup in Phase 2, not Phase 3: cleanup changes the inputs to the resolver — doing it after integration would require re-running integration tests.
- Phase 3 before Phase 4: the regression tests must exist before running the runtime matrix, so failures produce reproducible test cases rather than manual observation.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Pipeline integration):** The `applyRuntimeContentRewritesInPlace` path for skills (`SKILL.md`) needs investigation — determine whether skills are staged before or after command-path resolution runs, and whether a third resolver call is needed.
- **Phase 4 (Runtime matrix):** Copilot and Codex have the most bespoke tool-name transformation logic. Verify that `references/checkpoints.md` and `references/mandatory-initial-read.md` (both contain `Read`/`Bash` in prose) are correctly transformed when inlined for all non-Claude runtimes.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Resolver core):** Algorithm fully specified by ARCHITECTURE.md. Implement against the provided pseudocode.
- **Phase 3 (Regression tests):** Testing patterns established in `tests/helpers.cjs`. Follow existing install-smoke-test patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | npm registry data confirmed; Eta v4.6.0 version, deps, date verified directly. Custom-function recommendation based on bounded scope analysis. |
| Features | HIGH | Reference counts derived from direct grep of source corpus. Mixed-notation files and dynamic exceptions confirmed by line-level inspection. |
| Architecture | HIGH | Pipeline structure derived from direct reading of `bin/install.js` lines 6399–8727. Two insertion points identified with exact line numbers. |
| Pitfalls | HIGH | Each pitfall traced to a specific file and line. Test requirements mapped to existing test infrastructure. |

**Overall confidence:** HIGH

### Gaps to Address

- **Skills path (`applyRuntimeContentRewritesInPlace`):** Right answer depends on whether skills are staged before or after command-path resolution. Resolve at Phase 2 planning time.
- **`discuss-phase/modes/advisor.md` agent reference:** The `@` reference targets an agent definition file inside a spawn string. Bare-line detection should exclude it, but verify during Phase 2 that it is not expanded.
- **8 unreferenced reference files:** Determine during or after Phase 2 whether each needs `@` wiring added or can be deleted as dead code.

## Sources

### Primary (HIGH confidence)
- Direct inspection of `bin/install.js` (11,522 lines) — pipeline structure, insertion points at lines 6432 and 8646
- Direct grep of `agents/*.md`, `get-shit-done/workflows/*.md`, `commands/gsd/*.md`, `get-shit-done/references/*.md` — reference counts, dynamic exceptions identified by line
- `tests/agent-size-budget.test.cjs` — budget thresholds (XL=1600, LARGE=1000, DEFAULT=500)
- npm registry `npm info eta --json` — v4.6.0, 0 deps, published 2026-04-25, 204 KB unpacked
- Context7 `/eta-dev/eta` — Eta configuration, CJS/ESM build, `useWith`, `autoEscape`, delimiter customization
- npm registry for LiquidJS v10.27.0, Nunjucks v3.2.4, Mustache v4.2.0 — eliminated alternatives

### Secondary (MEDIUM confidence)
- esbuild bundling strategy for devDep installers — standard ecosystem practice, no single canonical source
- Community consensus on regex-based parsers being fragile for structured text (Markdown `{`, `}`, `%` in code fences)

---
*Research completed: 2026-05-28*
*Ready for roadmap: yes*
