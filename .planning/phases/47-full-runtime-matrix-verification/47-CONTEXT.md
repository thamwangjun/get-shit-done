# Phase 47: Full Runtime Matrix + Verification - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 47 closes the v2.1.0-c milestone. It delivers:

1. **Exception-list test (TEST-01 upgrade):** Update TEST-01 in `tests/install-eta-regression.test.cjs` to use a non-line-anchored `@~/.claude/` check (matching GATE-03 literally). Add an `ALLOWED_INLINE_REFS` array for known intentional prose refs. Failure message must be actionable: identify which new refs are NOT in the allowlist and explain how an agent should classify them (valid prose instruction → add to allowlist; unresolved Eta template → fix with `<%~ include() %>`).

2. **GATE-03 satisfaction:** After the exception-list approach, `grep -r '@~/.claude/'` on a fresh Claude install returns only the allowlisted refs. All non-allowlisted refs are either resolved Eta includes or legitimate exceptions explicitly recorded.

3. **GATE-01 / GATE-02 gates:** `npm test` passes with 0 new failures; negative-framing scanner passes at 99/99.

The runtime matrix sweep tests Claude only — other runtimes share the same `_applyRuntimeRewrites` code path.

</domain>

<decisions>
## Implementation Decisions

### GATE-03 Interpretation

- **D-01:** GATE-03 uses a **non-line-anchored** check — `grep -r '@~/.claude/'` matching any occurrence, not just bare-line refs. REQUIREMENTS.md will be updated to clarify this.
- **D-02:** Known intentional inline prose refs are captured in an **`ALLOWED_INLINE_REFS` array inline in `tests/install-eta-regression.test.cjs`**. Each entry should be the exact string (e.g., the file path pattern) that identifies the allowed ref.
- **D-03:** When the test finds a `@~/.claude/` occurrence NOT in the allowlist, the failure message must include:
  - The file path and line where the unexpected ref was found
  - The exact matching string
  - Instructions: "If this is an intentional prose instruction for the AI agent (e.g., 'Read @~/.claude/references/foo.md'), add the pattern to `ALLOWED_INLINE_REFS`. If this is an Eta template that should have been inlined, replace with `<%~ include('path/to/file.md') %>`."

### Runtime Matrix Scope

- **D-04:** Matrix sweep tests **Claude runtime only**. TEST-01 (upgraded with exception list) is the primary gate. Other runtimes rely on the shared `_applyRuntimeRewrites` path; no additional runtime installs in the test suite.

### Copilot Transformation Test

- **D-05:** The original REQUIREMENTS.md TEST-03 (Copilot `Read`→`read` tool-name transformation in inlined content) is **closed as out-of-scope** for this milestone. REQUIREMENTS.md will be updated with strike-through and rationale: tool-name transformation is a separate install concern, not part of the Eta pipeline milestone. The Eta pipeline (include resolution) and tool-name rewriting are orthogonal.

### Existing Test Behavior

- **D-06:** TEST-02 through TEST-05 remain unchanged — they test Eta rendering behavior (conditional expression preservation, include inlining, circular detection, missing-file error) and are not affected by the GATE-03 change.
- **D-07:** TEST-01's test description and assertion should be updated to reflect the new non-line-anchored check and exception-list approach, replacing the current line-anchored `/^@~\/.claude\//m` regex.

### Claude's Discretion

- Exact format of `ALLOWED_INLINE_REFS` entries — string prefix match, exact string, or regex. Use the simplest form that correctly identifies each known ref without over-matching.
- Whether to count and report total allowlisted refs vs. new unallowlisted refs in the failure message, or just list the new ones.
- Whether to add a brief comment above each `ALLOWED_INLINE_REFS` entry explaining WHY it's allowed (prose instruction, conditional expression, etc.).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and Roadmap

- `.planning/REQUIREMENTS.md` — GATE-01, GATE-02, GATE-03 definitions; TEST-03 Copilot gap to be struck through with rationale in Phase 47
- `.planning/ROADMAP.md` §Phase 47 — success criteria: SC #1 (zero @~ refs across runtimes), SC #2 (negative framing scanner 99/99), SC #3 (npm test 0 new failures)

### Phase 46 Decisions (prerequisite context)

- `.planning/phases/46-regression-test-suite/46-CONTEXT.md` — D-04 through D-10: test file structure, TEST-01 through TEST-05 design, `ALLOWED_INLINE_REFS` predecessor (TEST-01's line-anchored regex that D-07 supersedes)
- `.planning/phases/46-regression-test-suite/46-VERIFICATION.md` — Truth #11 failure (TEST-03 Copilot gap) and truth #7 approach deviation (TEST-02 source-file rendering vs. full install); these are the known gaps Phase 47 addresses

### Phase 45 Decisions (Eta pipeline context)

- `.planning/phases/45-pipeline-integration/45-CONTEXT.md` — D-09 (intentional retention of `!`cat .planning/X`` runtime refs); deferred section (inline `@~` prose refs are instructional text, intentionally not inlined)

### Key Source Files

- `tests/install-eta-regression.test.cjs` — The file Phase 47 modifies. Current TEST-01 at lines 26–37 uses line-anchored regex; D-07 replaces this.
- `bin/install.js` — `installRuntimeArtifacts(runtime, configDir, mode, profile)` at line ~8363; `renderEtaContent(content, srcPath, viewsRoot)` exported at line ~11517; `_applyRuntimeRewrites(content, runtime, pathPrefix)` at line ~5933.
- `agents/*.md`, `commands/gsd/*.md`, `get-shit-done/workflows/*.md` — Source of the 38 inline `@~/.claude/` prose refs that the allowlist will enumerate. Run `grep -rn '@~/.claude/' agents/ commands/gsd/ get-shit-done/workflows/` to produce the current list before writing the allowlist.

### Testing Patterns

- `tests/helpers.cjs` — `createTempDir()`, `cleanup()` patterns
- `tests/install-runtime-artifacts.test.cjs` — Pattern for `installRuntimeArtifacts` with temp configDir and `loadSkillsManifest` + `resolveProfile` setup

</canonical_refs>

<code_context>
## Existing Code Insights

### TEST-01 Current Implementation

- Line 33: `assert.ok(!/^@~\/.claude\//m.test(rendered), ...)` — line-anchored regex to be replaced with non-anchored check + allowlist logic
- Renders only `agents/gsd-executor.md` via `renderEtaContent` — scope stays the same; only the assertion logic changes

### Inline Prose Refs to Enumerate for Allowlist

There are 38 `@~/.claude/` references in source files that are intentional prose instructions:

```
agents/gsd-phase-researcher.md — @~/.claude/get-shit-done/references/project-skills-discovery.md
agents/gsd-verifier.md — @~/.claude/get-shit-done/references/project-skills-discovery.md (×2, incl. verify-mvp-mode.md)
agents/gsd-planner.md — multiple refs (project-skills-discovery, planner-antipatterns, tdd.md, planner-mvp-mode, user-story-template, skeleton-template, planner-chunked)
agents/gsd-debugger.md — @~/.claude/get-shit-done/references/project-skills-discovery.md, common-bug-patterns.md
agents/gsd-executor.md — project-skills-discovery.md, checkpoints.md, execute-mvp-tdd.md, templates/summary.md
commands/gsd/complete-milestone.md — workflows/complete-milestone.md, templates/milestone-archive.md
commands/gsd/extract-learnings.md, mvp-phase.md, ship.md — workflow refs
get-shit-done/workflows/* — various references including execute-phase.md:619 (inside ${...} JS template literal — MUST be preserved verbatim, same as TEST-02 target)
```

Agent should run `grep -rn '@~/.claude/' agents/ commands/gsd/ get-shit-done/` to get the full canonical list before building `ALLOWED_INLINE_REFS`.

### Installed Output Pattern

Phase 46 TEST-01 already installs Claude runtime via `installRuntimeArtifacts` and checks rendered output. The upgraded TEST-01 should do the same — install to tmpDir, walk all installed `.md` files, check each for non-allowlisted `@~/.claude/` occurrences.

</code_context>

<specifics>
## Specific Ideas

- The `ALLOWED_INLINE_REFS` array should store the patterns in a way that's easy for a future agent to understand. A simple string array of the exact reference paths (e.g., `'@~/.claude/get-shit-done/references/project-skills-discovery.md'`) with a comment block explaining the classification criteria is cleaner than regex.
- The test failure message format: "Found unexpected @~/.claude/ reference in installed output:\n  File: {path}\n  Match: {match}\n\nTo resolve: if this is an intentional prose instruction for the AI (e.g., 'Read @~/.claude/...'), add it to ALLOWED_INLINE_REFS in this file. If this is an unresolved Eta template, fix the source file by replacing with <%~ include('...') %>."

</specifics>

<deferred>
## Deferred Ideas

- **Copilot tool-name transformation test** — Closed as out-of-scope for v2.1.0-c. Original REQUIREMENTS.md TEST-03 intent (verifying `Read`→`read` in inlined content for Copilot runtime) is a separate concern from Eta include resolution. Can be addressed in a future milestone focused on non-Claude runtime quality.
- **Non-Claude runtime matrix tests** — Testing Gemini, Copilot, etc. via `installRuntimeArtifacts` is deferred. The shared `_applyRuntimeRewrites` path is trusted; Claude-only coverage is sufficient for this milestone.

</deferred>

---

*Phase: 47-full-runtime-matrix-verification*
*Context gathered: 2026-05-29*
