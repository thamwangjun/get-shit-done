# Phase 46: Regression Test Suite - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 46 delivers two things:

1. **Delimiter cleanup (Plan 01):** Remove the unjustified custom delimiter config (`{%`/`%}`) from the Eta constructor in `bin/install.js` and switch to Eta's defaults (`<%`/`%>`). Update all 81 source files accordingly. No functional change — purely eliminating unnecessary configuration.

2. **Regression test suite (Plan 02):** Five tests in `tests/install-eta-regression.test.cjs` that run against installed output (not source files), covering every critical failure mode of the Eta v4 pipeline wired in Phase 45.

This phase is the safety net before Phase 47's full runtime matrix sweep.

</domain>

<decisions>
## Implementation Decisions

### Plan 01 — Default Delimiter Switch

- **D-01:** Remove `tags: ['{%', '%}']` and `parse: { raw: '~' }` from the Eta constructor in `bin/install.js` (lines ~1753–1760). Eta's default delimiters `<%` / `%>` work identically — there is no collision with `{{ }}` notation in GSD files (which the custom delimiter rationale incorrectly cited), and `<%` / `%>` appear zero times in any source file.
- **D-02:** Replace all `{%~ include(` with `<%~ include(` and all closing `%}` on include lines with `%>` across the 81 converted source files. A conversion script (Node.js or sed one-liner) should handle this atomically with a post-conversion grep verification confirming zero `{%~ include` survivors.
- **D-03:** After conversion, run `npm test` to confirm zero regressions before proceeding to Plan 02.

### Plan 02 — Regression Tests

- **D-04:** All 5 tests live in one new file: `tests/install-eta-regression.test.cjs`. This keeps cohesive Eta pipeline tests together and runnable in isolation via `node --test tests/install-eta-regression.test.cjs`.
- **D-05:** All tests use `createTempDir()` from `tests/helpers.cjs` as the `configDir` — never the live `~/.claude/` installation. `cleanup(tmpDir)` runs in `afterEach`.
- **D-06:** **TEST-01** — Install Claude runtime to a temp dir via `installRuntimeArtifacts('claude', tmpDir, 'global', profile)`. Walk all installed `.md` files recursively. Assert zero matches for `/@~\/.claude\//`. This is a full tree scan, not a spot-check.
- **D-07:** **TEST-02** — Same Claude runtime install. Find the installed copy of `execute-phase.md`. Assert the conditional `@~` expression (the one inside a `${}` JS template literal at the original source line ~619) is preserved verbatim in the installed output.
- **D-08:** **TEST-03** — Install Claude runtime to a temp dir. Read the installed `agents/gsd-executor.md`. Assert the installed file contains `"Mandatory Initial Read"` — text that originates in `get-shit-done/references/mandatory-initial-read.md`, which `gsd-executor.md` includes. This confirms Eta resolved the include and inlined the content (distinct from TEST-01 which checks for absence of unresolved refs).
- **D-09:** **TEST-04** — Add a try/catch wrapper around both `eta.renderString(content, {})` calls in `bin/install.js` (lines ~6455 and ~8670). Catch `RangeError` (JavaScript stack overflow from infinite recursion) and rethrow as `new Error('Circular include detected in: ' + srcPath)`. The test creates a temp fixture file that includes itself, calls the Eta rendering path directly or via a minimal install, and asserts the thrown error message contains the fixture file path.
- **D-10:** **TEST-05** — Create a temp fixture file containing `<%~ include('nonexistent-path-xyz.md') %>`. Pass it through the Eta rendering path. Assert an `EtaFileResolutionError` is thrown (Eta v4 throws this natively on missing files) and the error message contains `'nonexistent-path-xyz.md'`.
- **D-11:** **TEST-06 is dropped.** The source-file agent size budget (in `agent-size-budget.test.cjs`) already guards against unbounded growth. Installed-output line counts are intentionally larger due to Eta expansion — a separate installed-output budget provides no meaningful safety net.

### Claude's Discretion

- Exact mechanism for TEST-04 and TEST-05 to invoke the Eta rendering path: either export a thin `renderEtaContent(content, srcPath)` helper from `bin/install.js` under `GSD_TEST_MODE`, or call `installRuntimeArtifacts` with a minimal fixture tree. Prefer whichever requires less test scaffolding.
- Whether to add an `// allow-test-rule: source-text-is-the-product` comment at the top of `install-eta-regression.test.cjs` (consistent with other install test files that read product `.md` files).
- Sed vs. Node.js script for the Plan 01 conversion — use whichever is cleaner to verify and commit atomically.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and Roadmap
- `.planning/REQUIREMENTS.md` — TEST-01 through TEST-05 definitions (TEST-06 dropped per discussion); GATE-01 through GATE-03 quality gates
- `.planning/ROADMAP.md` §Phase 46 — success criteria (note SC #4 maps to TEST-04 + TEST-05; SC #5 from TEST-06 is dropped)

### Phase 45 Decisions (prerequisite context)
- `.planning/phases/45-pipeline-integration/45-CONTEXT.md` — D-01 through D-15: Eta v4 config decisions, conversion rules, wiring points. D-02 (custom delimiters) is superseded by Phase 46 D-01.

### Key Source Files
- `bin/install.js` — Eta constructor at lines ~1747–1769; `eta.renderString()` call in `copyWithPathReplacement()` at line ~6455; second `eta.renderString()` call in agent install loop at line ~8670. Plan 01 edits lines ~1753–1760. Plan 02 wraps lines ~6455 and ~8670 in try/catch.
- `get-shit-done/references/mandatory-initial-read.md` — Contains `"Mandatory Initial Read"` and `Read` tool reference; used as TEST-03 assertion target.
- `get-shit-done/workflows/execute-phase.md` line ~619 — Contains the conditional `@~` expression inside a `${}` JS template literal that must survive Eta rendering verbatim (TEST-02 target).

### Testing Patterns
- `tests/helpers.cjs` — `createTempDir()`, `cleanup()`, `createTempProject()`; `loadSkillsManifest` + `resolveProfile` pattern from `tests/install-runtime-artifacts.test.cjs` for setting up `installRuntimeArtifacts` calls
- `tests/install-runtime-artifacts.test.cjs` — Pattern for calling `installRuntimeArtifacts(runtime, configDir, 'global', profile)` with a temp configDir
- `tests/install.test.cjs` — Pattern for `GSD_TEST_MODE=1` + requiring `bin/install.js` exports in tests
- `tests/agent-size-budget.test.cjs` — Reference for budget tier constants (XL/LARGE/DEFAULT) — informational only; TEST-06 dropped

</canonical_refs>

<code_context>
## Existing Code Insights

### Eta Wiring Points in bin/install.js
- `eta.renderString(content, {})` at line ~6455: inside `copyWithPathReplacement()`, processes commands and `get-shit-done/` subtree. This is where the Plan 01 delimiter change takes effect and where Plan 02 TEST-04/05 try/catch wrapping goes.
- `eta.renderString(content, {})` at line ~8670: inside the agent install loop. Same pattern — same try/catch wrapping needed.
- `eta.resolvePath` override at line ~1764: forces all includes to resolve from `views` root (repo root). Must be preserved when removing the custom delimiter config.

### Test Infrastructure
- `installRuntimeArtifacts(runtime, configDir, mode, profile)` takes positional args — confirmed from `tests/install-runtime-artifacts.test.cjs` usage at line 84.
- `loadSkillsManifest(COMMANDS_DIR)` + `resolveProfile({ modes: ['core'], manifest })` is the standard profile setup for install tests.
- `process.env.GSD_TEST_MODE = '1'` must be set before requiring `bin/install.js`.

### Conversion Scope for Plan 01
- 81 source files contain `{%~ include(` (confirmed by grep). Files span `commands/gsd/` (55), `agents/` (7), `get-shit-done/workflows/` (19), `get-shit-done/references/` (1) — per Phase 45 D-10 table.
- Post-conversion verification: `grep -r '{%~ include' commands/ agents/ get-shit-done/` should return zero results.

</code_context>

<specifics>
## Specific Ideas

- For the Plan 01 conversion, a single sed command covers all 81 files atomically: `find commands/gsd agents get-shit-done -name '*.md' | xargs sed -i 's/{%~ include(/<%~ include(/g; s/ %}/ %>/g'`. Run post-conversion grep to verify zero survivors before committing.
- TEST-04 fixture design: the simplest circular include is a temp file `a.md` that contains `<%~ include('a.md') %>` and is placed in the temp dir configured as Eta's views root.
- For TEST-02, the conditional expression to assert verbatim is `${CONTEXT_WINDOW < 200000 ?` (or similar JS template literal pattern at execute-phase.md ~619). Read the actual line before writing the assertion to get the exact string.

</specifics>

<deferred>
## Deferred Ideas

- **TEST-06 (installed agent size budgets):** Dropped. Source-file budgets in `agent-size-budget.test.cjs` are the right enforcement point. Installed-output budgets would need separate thresholds and provide limited value.
- **Copilot runtime tool-name transformation test:** Originally the TEST-03 target. Deferred — a dedicated transformation test for non-Claude runtimes belongs in Phase 47's matrix sweep, where all runtimes are validated end-to-end.

</deferred>

---

*Phase: 46-regression-test-suite*
*Context gathered: 2026-05-29*
