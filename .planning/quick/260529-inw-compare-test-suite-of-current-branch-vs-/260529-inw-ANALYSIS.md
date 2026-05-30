# Test Suite Comparison: dev HEAD vs Upstream 13c64e02 (v1.01.0)

**Generated:** 2026-05-29
**Upstream ref:** 13c64e02999a41e180fa498085a4ac4674077a2d (upstream v1.01.0)
**Fork branch:** dev (HEAD)
**Scope:** `tests/*.test.cjs` (root-level) and `tests/**/*.test.cjs` (subdirectories)

---

## Summary

The fork's test suite has diverged substantially from upstream v1.01.0. The diff touches 84 files with 7,867 lines inserted and 896 deleted. At the file-structure level, the fork has added 26 new test files (covering new fork-specific features) and removed none. No upstream test files were deleted or renamed. Of the 58 files that exist in both branches and were modified, the changes fall into four repeating patterns: (1) fork-specific feature tests added to existing files, (2) upstream tests marked `{ skip: 'fork intentionally diverges from upstream contract' }` where the fork's implementation differs, (3) wholesale rewrites of tests that previously assumed semver versioning (now rewritten for SHA-based versioning), and (4) small assertion updates to accommodate relaxed or changed size/count thresholds. The single largest deletion is `changeset-cli.test.cjs` losing its entire `extract` describe block (308 lines removed) because the fork reverted upstream's semver `extract` subcommand.

---

## File Structure Changes

### Added Test Files (26 — fork only, not in upstream)

| File | Purpose |
|------|---------|
| `tests/bug-167-query-meta-command.test.cjs` | Verifies `query` meta-command prefixes direct gsd-tools calls |
| `tests/bug-17-askuserquestion-option-cap.test.cjs` | Validates AskUserQuestion option arrays respect a max-4 cap |
| `tests/bug-170-workflow-fallback-install-hint.test.cjs` | Ensures fallback hints don't reference the upstream package name |
| `tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs` | On-demand hooks/dist build integration test (several cases skipped — fork diverges) |
| `tests/bug-222-research-synthesizer-write-contract.test.cjs` | Research synthesizer must use Write tool for SUMMARY.md (not return message) |
| `tests/bug-224-pick-stdout-capture.test.cjs` | `--pick` stdout capture contract and fd=1 interception |
| `tests/bug-33-settings-model-profile-adaptive.test.cjs` | Schema and settings.md UI sync for `adaptive` model_profile value |
| `tests/bug-phase45-eta-wiring.test.cjs` | Eta dependency wiring, instance config, and zero bare-line `@~` survivors |
| `tests/catalogue-sync.test.cjs` | CATALOGUE.json sync: commands, references, workflows, templates, total count |
| `tests/command-at-notation.test.cjs` | Verifies `@` file-reference notation fully converted to shell-cat form in commands/ |
| `tests/dispatch/trace-correlation.test.cjs` | End-to-end parentTraceId propagation across dispatch events |
| `tests/eta-template-syntax.test.cjs` | Enforces `{%` Eta syntax is banned — only `<%` allowed |
| `tests/install-eta-regression.test.cjs` | Full install Eta rendering: no bare `@~/.claude/` refs, no unrendered `<%~` directives |
| `tests/negative-framing-scan.test.cjs` | 1,424-line scanner for negative framing in all prompt content files |
| `tests/observability/event.test.cjs` | `makeDispatchEvent` shape and UUID traceId tests |
| `tests/observability/hub-logger-integration.test.cjs` | Hub + logger `onEvent` integration: one event per dispatch |
| `tests/observability/logger.test.cjs` | `createNoOpLogger` and `createDefaultLogger` behavior |
| `tests/observability/redaction.test.cjs` | `shouldIncludeArgs` / `redactEvent` for GSD_AUDIT_ARGS env var |
| `tests/phase-30-affirmative-replacements.test.cjs` | Phase 30 prompt engineering: affirmative replacement verification in agents/ and workflows/ |
| `tests/phase-38-nyquist.test.cjs` | Phase 38 Batch 3 commit structure verification (commit hash pinning) |
| `tests/stage-batch-2.test.cjs` | `scripts/stage-batch-2.cjs` structure and logic validation |
| `tests/stage-batch-4.test.cjs` | `scripts/stage-batch-4.cjs` structure and logic validation |
| `tests/stage-batch-5.test.cjs` | `scripts/stage-batch-5.cjs` structure and self-referential validation |
| `tests/statusline-sha.test.cjs` | Verifies statusline no longer uses semver parseV — uses SHA only |
| `tests/update-sha-migration.test.cjs` | `update.md` SHA migration: no semver ordering logic, correct compare_versions |
| `tests/version-detection.test.cjs` | `install.js` uses `git rev-parse --short` for version (not semver pkg.version) |

### Removed Test Files

None. No upstream test files were deleted.

### Renamed Test Files

None.

---

## Test Case Changes Per File (58 Modified Files)

Files are grouped by the type of change applied.

### A. Semver → SHA Migration (wholesale rewrites)

These files had their entire test logic replaced because the fork reverted upstream's semver versioning in favor of SHA-based version detection and comparison.

**`tests/semver-compare.test.cjs`** (+156 / -19 net)
- REMOVED: `describe('isNewer (semver comparison)')` with 9 semver tests (newer major/minor/patch, equal, older, pre-release, installed-ahead, npm-ahead, null/undefined/empty)
- ADDED: `describe('isNewer (SHA equality)')` with 9 SHA-based tests: same/different 7-char SHA, 40-char truncation, null/undefined/empty latest, `null` on API failure (D-06 fallback), `unknown` installed
- ADDED: `describe('HOOK-03: worker source — isNewer defined before use')` (3 tests): source order assertions
- ADDED: `describe('HOOK-04: worker source — GitHub API endpoint, not npm registry')` (6 tests): verifies GitHub API used, no npmjs.com contact

**`tests/bug-2992-check-latest-version.test.cjs`** (+209 lines)
- REMOVED: `describe('Bug #2992: deterministic latest-version check')` with npm/semver-based tests
- REMOVED: `describe('Bug #2992: error paths')` testing npm exit codes and FAIL_NPM_FAILED
- ADDED: `describe('Bug #2992: SHA-based latest-version check — constants')`: GITHUB_API_URL constant test
- ADDED: `describe('Bug #2992: SHA-based latest-version check — success paths')`: `{ ok: true, sha }` on valid SHA, 40→7 truncation
- ADDED: `describe('Bug #2992: SHA-based latest-version check — error paths')`: FAIL_FETCH_FAILED, FAIL_INVALID_SHA variants

**`tests/bug-2136-sh-hook-version.test.cjs`** (+44 lines)
- ADDED: SHA regex assertion `const isSha = /^[0-9a-f]{7}$/.test(stamped)` replacing semver check

**`tests/installer-migration-install-integration.test.cjs`** (+8 lines)
- ADDED: SHA version regex `/^[0-9a-f]{7}$/.test(installedVersion) || installedVersion === 'no-network'`

**`tests/gsd-statusline.test.cjs`** (+17 lines)
- ADDED: `describe('isInstalledAheadOfLatest')` with 2 new tests (prerelease patch increment, equal base version prerelease)

### B. "skip: fork intentionally diverges" — Upstream Tests Preserved But Suppressed

These files had one or more tests wrapped in `{ skip: 'fork intentionally diverges from upstream contract' }` because the fork's implementation differs from what the upstream test asserts.

| File | Test(s) Skipped |
|------|----------------|
| `tests/bug-1834-sh-hooks-installed.test.cjs` | `hook copy loop has an else branch for non-.js files` |
| `tests/bug-2543-gsd-slash-namespace.test.cjs` | `no /gsd-<cmd> retired syntax in Claude-facing source files` |
| `tests/bug-2948-spike-wrap-up-dispatch.test.cjs` | `execution_context section includes spike-wrap-up workflow reference` |
| `tests/bug-3135-capture-backlog-workflow.test.cjs` | `capture.md execution_context @-includes add-backlog.md` |
| `tests/bug-3320-planner-deep-work-rules.test.cjs` | `planner agent explicitly keeps implementation code out of action blocks` |
| `tests/bug-3678-executor-commit-docs-respect.test.cjs` | `A2: agent body explicitly forbids raw git fallback when SDK skips` |
| `tests/debug-session-management.test.cjs` | `gsd-debugger contains security note about DATA_START` |
| `tests/few-shot-calibration.test.cjs` | `gsd-plan-checker.md contains reference to plan-checker few-shot examples`; `gsd-verifier.md contains reference to verifier few-shot examples` |
| `tests/import-command.test.cjs` | `references the import workflow` |
| `tests/ingest-docs.test.cjs` | `references the ingest-docs workflow`; `references the doc-conflict-engine`; `references gate-prompts` |
| `tests/release-tarball-smoke.install.test.cjs` | Entire `describe('release-tarball-smoke')` → `describe.skip(...)` |
| `tests/gsd-check-update-worker-platform-gate.test.cjs` | Entire `describe('gsd-check-update-worker: Windows npm spawn platform gate')` → `describe.skip(...)` |
| `tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs` | Multiple hook install and stdout tests in FIX-01 and FIX-02 |

**Pattern:** Upstream added integration tests that assert `@-include` or `shell-cat` syntax for workflow references. The fork converted commands to Eta `<%~ include(...)` syntax, so upstream assertion regexes no longer match. Rather than removing these tests (which would lose the regression signal entirely), the fork wraps them with `.skip` and annotates the reason.

### C. Antigravity 2.x Layout — New Dir Detection

**`tests/bug-3608-antigravity-update-runtime-classification.test.cjs`** (+74 lines)
- CHANGED: `RUNTIME_DIRS antigravity entry points at .gemini/antigravity` → `RUNTIME_DIRS includes antigravity entries for 2.x + legacy dirs`
- CHANGED: local-scope scan dir list test updated for `2.x antigravity dirs before .gemini`
- CHANGED: path-to-runtime classification test updated for `antigravity 2.x and legacy paths`

**`tests/bug-3126-global-skills-base-runtime-path.test.cjs`** (+24 lines)
- ADDED: `antigravity detects 2.x IDE dir when legacy dir is absent`

**`tests/install.test.cjs`** (+79 lines)
- ADDED: `describe('getGlobalDir/getConfigDirFromHome — antigravity 2.x layout detection')` with 3 tests: ide vs cli dir selection, legacy fallback
- CHANGED: `antigravity returns .agent (local) and .gemini, antigravity (global)` → `antigravity returns .agent (local) and legacy fallback global path when no 2.x dirs exist`

### D. CommandRoutingHub Refactor (SDK mode removed)

**`tests/command-routing-hub.test.cjs`** (+698 / -117 net — largest single-file delta)
- REMOVED: `ERROR_KINDS contains exactly the 6 documented values`; `throws on invalid mode`; `accepts mode: sdk`; `accepts mode: cjs`; `describe('CommandRoutingHub — happy path, mode: sdk')` (dispatch returns ok, passes registryCommand, uses mode:json); `hub does not throw when SDK handler throws (sdk mode)`
- ADDED: `ERROR_KINDS contains exactly the 4 documented values (SdkDispatchFailed and SdkLoadFailed removed)`; `ERROR_KINDS does NOT contain SdkDispatchFailed`; `ERROR_KINDS does NOT contain SdkLoadFailed`
- ADDED: `constructs successfully without any mode parameter`; `mode parameter is ignored — passing mode: sdk does not route to SDK`; `mode parameter is ignored — passing mode: cjs also routes through CJS`; `sdkLoader parameter is inert — passing sdkLoader does not cause SDK dispatch`; `constructs successfully with only cjsRegistry`
- RENAMED describes: `errorKind: *` → `kind: *`; `HandlerFailure details.originalError` → `HandlerFailure cause`

### E. Changeset CLI — `extract` Subcommand Removed

**`tests/changeset-cli.test.cjs`** (-308 lines, net negative)
- REMOVED: Entire `describe('changeset cli extract: version-range changelog extraction (#3496)')` block — 14 tests covering `--from`/`--to` flags, semver range filtering, pre-release exclusion, v-prefix parsing, linked-header parsing, nested bullets, and `workflows/update.md extract subcommand invocation`

The fork reverted upstream's `extract` subcommand (which performed semver CHANGELOG range extraction) because the fork uses SHA-based versioning. The test file now has no net additions.

### F. Agent Frontmatter Test Changes

**`tests/agent-frontmatter.test.cjs`** (+10 / -2 lines)
- CHANGED: `describe('HDOC: anti-heredoc instruction')` → `describe.skip(...)` — fork's anti-heredoc rule uses positive framing (`only use the Write tool`) instead of the upstream's negatively-framed instruction, so the upstream test text pattern no longer matches
- ADDED: `/only use the write tool/i.test(content)` assertion added inside the skipped block to document what the fork expects

### G. Fork-Specific Feature Additions to Existing Files

**`tests/state.test.cjs`** (+66 lines)
- ADDED: `describe('cross-milestone progress preservation (#3242 Bug A)')` — `cmdStateBuild preserves curated total_phases when frontmatter exceeds disk-derived count`

**`tests/phase.test.cjs`** (+74 lines)
- ADDED: `bug-16: integer phase remove renumbers canonical phases above 999 while preserving 999.x backlog`

**`tests/lint-shared-module-handsync.test.cjs`** (+41 lines)
- ADDED: `describe('lint-shared-module-handsync: cross-name pair support')` — `surfaces declared cross-name migrateMeBacklog pair in warnings`

**`tests/commands.test.cjs`** (+18 lines)
- ADDED: `dispatches directly to CJS handler (no SDK bridge) to avoid Windows native crash path`

**`tests/bug-3751-init-local-agents.test.cjs`** (+82 / -16 net)
- CHANGED: Test descriptions updated from `init.ts checkAgentsInstalled` → `init composer checkAgentsInstalled`; `init-complex.ts initNewProject` → `init complex initNewProject` (reflects file renames in SDK layer)

**`tests/bug-2979-hook-absolute-node.test.cjs`** (+14 lines)
- ADDED: `Windows Claude .sh hook omits explicit bash.exe wrapper (#166)`

### H. Size/Count Threshold Relaxations

| File | Change |
|------|--------|
| `tests/planner-decomposition.test.cjs` | Char limit raised: `under 45K chars` → `under 52K chars` |
| `tests/reachability-check.test.cjs` | Char limit raised: `under 50000 char limit` → `under 55000 char limit` |
| `tests/config-schema-sdk-parity.test.cjs` | Label change: `configuration module` → `config module` |

### I. Eta `@-include` Syntax Migration in Assertions

Several test files updated their regex patterns to accept either legacy `@~/.claude/...` notation or the new Eta `<%~ include('...')` notation. This pattern appears in:

- `tests/few-shot-calibration.test.cjs` — `hasLegacyRef || hasEtaRef` dual-acceptance
- `tests/import-command.test.cjs` — `hasEtaRef` check added
- `tests/ingest-docs.test.cjs` — `hasEtaRef` checks added for workflow, doc-conflict-engine, gate-prompts
- `tests/bug-2948-spike-wrap-up-dispatch.test.cjs` — Eta `{%~? include` regex added
- `tests/bug-3135-capture-backlog-workflow.test.cjs` — Eta `{%~? include` regex added
- `tests/mvp-phase-command.test.cjs` — `<%~? include` regex added
- `tests/reapply-patches.test.cjs` — `<%~? include` regex added
- `tests/workspace.test.cjs` — `<%~? include` regex added

### J. Minor / Mechanical Changes

| File | Change |
|------|--------|
| `tests/audit-fix-command.test.cjs` | Removed `has <objective> section` test (-5 lines) |
| `tests/bug-patterns-reference.test.cjs` | `has title and intro` → `has separator` |
| `tests/edit-phase.test.cjs` | Variable rename `antiPatterns[1]` → `expectedPatterns[1]` |
| `tests/ios-scaffold-safety.test.cjs` | Removed 2 tests: `reference prohibits Package.swift as primary build system` and `reference prohibits .executableTarget for iOS apps` (-36 lines) |
| `tests/lint-test-file-count.test.cjs` | Removed `exits 0 against real repo (allowlist covers all current violations)` (-2 lines) |
| `tests/package-legitimacy-gate.test.cjs` | Removed `package-legitimacy checkpoint uses blocking-human gate and non-auto-approvable language` (-2 lines) |
| `tests/read-injection-scanner.test.cjs` | `EXCL-05: .claude/hooks/ files are silently skipped` → `EXCL-05: hook install directory files are silently skipped` |
| `tests/secure-phase.test.cjs` | `has <role> section` removed; `has <objective> section mentioning states A, B, C` → `mentions states A, B, C` |
| `tests/verification-overrides.test.cjs` | Removed `required_reading block is between </role> and <project_context>` (-15 lines) |
| `tests/windows-test-parity-guard.test.cjs` | Removed `test teardown rmSync without maxRetries` (-2 lines) |
| `tests/cjs-sdk-bridge-integration.test.cjs` | Added `afterEach` to imports |
| `tests/debug-session-management.test.cjs` | Updated anti-heredoc assertion to use `/only use the write tool/i` pattern |

---

## Why The Difference

The divergence from upstream v1.01.0 falls into five distinct strategic categories:

### 1. SHA-based versioning (pervasive, ~15 files)

The most systemic change. Upstream v1.01.0 migrated to semver for version comparison (`isNewer()`, `PACKAGE_NAME` constant, npm registry queries). The fork reverted this and uses 7-character git SHA equality instead of semver ordering. This required wholesale rewrites of: `semver-compare.test.cjs`, `bug-2992-check-latest-version.test.cjs`, `statusline-sha.test.cjs`, `update-sha-migration.test.cjs`, `version-detection.test.cjs`, and several minor assertion updates in `installer-migration-install-integration.test.cjs`, `bug-2136-sh-hook-version.test.cjs`. The fork also removed the changeset `extract` subcommand tests since that feature was tied to semver changelog parsing.

### 2. Eta template migration (pervasive, ~12 files)

The fork converted all `@~/.claude/...` file-reference notation in `commands/gsd/` to Eta `<%~ include('...')` template syntax. Tests that previously asserted the `@`-notation now either accept both forms (dual-regex), skip with explanation, or assert the Eta form exclusively. New test files `eta-template-syntax.test.cjs`, `install-eta-regression.test.cjs`, and `command-at-notation.test.cjs` were added to guard against regressions in the Eta wiring.

### 3. Fork-specific infrastructure and tooling (new test files, ~10 files)

The fork added its own scripts (`stage-batch-2/4/5.cjs`), prompt engineering scanner (`negative-framing-scan.test.cjs`, 1,424 lines), CATALOGUE.json sync guard (`catalogue-sync.test.cjs`), commit verification snapshots (`phase-38-nyquist.test.cjs`), and bug regression tests for fork-only issues (`bug-167`, `bug-17`, `bug-170`, `bug-222`, `bug-224`, `bug-33`). These have no upstream equivalent.

### 4. Observability layer (new subdirectory, 4 new files)

The fork added a new `tests/observability/` subdirectory (4 files, ~1,166 lines) and `tests/dispatch/trace-correlation.test.cjs` (227 lines). These test the dispatch event hub, traceId/parentTraceId propagation, logger behavior, and arg redaction — a fork-specific observability feature not present in upstream.

### 5. Positive framing enforcement (fork quality bar)

The fork's `CLAUDE.md` mandates replacing negative directives (`do not X`) with affirmative instructions. Several tests were updated to match the fork's positive-framing rewrites: agent frontmatter anti-heredoc assertion, debug session manager assertion, and various content checks. Tests whose upstream assertions can no longer match are suppressed with `{ skip: 'fork intentionally diverges...' }` rather than deleted, preserving intent for future reference.

---

## File Count Summary

| Category | Count |
|----------|-------|
| Test files in HEAD (root `tests/`) | 81 |
| Test files in upstream (root `tests/`) | 55 |
| Net new root-level test files | +26 |
| Test files in HEAD subdirs (`observability/`, `dispatch/`) | 5 |
| Test files in upstream subdirs | 0 |
| Files modified in both branches | 58 |
| Files deleted from upstream | 0 |
| Files renamed | 0 |
| Total files touched by diff | 84 |
| Lines inserted | 7,867 |
| Lines deleted | 896 |
