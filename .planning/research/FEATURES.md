# Upstream Changes Inventory: fa4bba47 → v1.3.1

**Merge target:** `v1.3.1` (`open-gsd/gsd-core`, commit `1bb253c9`)
**Merge base:** `fa4bba47`
**Researched:** 2026-06-10
**Method:** `git diff --name-status fa4bba47 v1.3.1`, `git log --oneline fa4bba47..v1.3.1`, `git ls-tree` comparisons, targeted `git diff` and `git show` on key files.

---

## 1. New Top-Level Structure at v1.3.1

### Structure delta

**Present at merge-base, absent at v1.3.1 (deleted top-level):**
- `sdk/` — entire subtree deleted (305 files)

**Present at v1.3.1, absent at merge-base (new top-level):**
- `src/` — 44 new `.cts` (CommonJS TypeScript) source files; replaces hand-written `bin/lib/*.cjs` as source of truth (ADR-457)
- `eslint-rules/` — 4 custom ESLint rule files (`no-elapsed-assertion.cjs`, `no-magic-sleep-in-tests.cjs`, `no-raw-rmsync-in-tests.cjs`, `no-source-grep.cjs`)
- `eslint.config.mjs` — new flat ESLint config (replaces old config)
- `tsconfig.build.json` — new TS build config for `src/` → `gsd-core/bin/lib/` compilation
- `stryker.config.mjs` — mutation testing config
- `rollout-next-phase1.sh`, `rollout-next-phase2.sh`, `next-branch-files.tar.gz` — release tooling artifacts

**Restructured directories:**
- `get-shit-done/` renamed to `gsd-core/` (commit `463cffd8`, issue #604)
- `sdk/src/` → `src/` (the TS sources for bin/lib moved to repo root `src/`)
- `docs/` massively expanded with Diataxis restructure (commit `3bb2f8f1`): added `docs/adr/`, `docs/explanation/`, `docs/how-to/`, `docs/tutorials/`, `docs/reference/`, `docs/prd/`, and four locale subtrees (`docs/ja-JP/`, `docs/ko-KR/`, `docs/pt-BR/`, `docs/zh-CN/`) — 170 new docs files, 13 deleted, 71 modified

**gsd-core/ vs old get-shit-done/ contents:**
- Same five subdirs: `bin/`, `contexts/`, `references/`, `templates/`, `workflows/`
- `gsd-core/bin/lib/` has only 2 new files: `legacy-cleanup.cjs`, `package-identity.cjs`
  — all old hand-written CJS lib files (core.cjs, phase.cjs, init.cjs, state.cjs, etc.) were deleted from this path; they are now compiled at publish time from `src/*.cts` into a generated `gsd-core/bin/lib/` tree that does NOT exist in the git working tree
- NEW: `gsd-core/bin/shared/` — four shipped JSON manifest files:
  - `config-defaults.manifest.json`
  - `config-schema.manifest.json`
  - `model-catalog.json`
  - `runtime-aliases.manifest.json`
- NEW: `gsd-core/references/worktree-branch-check.md` — shared fragment for worktree guard
- NEW: `gsd-core/workflows/_runtime-launcher.snippet.sh` — shared launcher snippet

---

## 2. Major Functional Changes by Area

### commands/ (59 modified, 0 added, 0 deleted)

All 59 existing commands were modified; no commands were added or removed. The diff covers prompt-content updates across every command file. Key functional changes embedded in these edits:

- All commands pick up `gsd-core/` path references in place of `get-shit-done/`
- `/gsd-ship` (#41): now extracts per-commit `gate_status` into PR-body TDD Audit section and squash trailer
- `/gsd-review` (#34): Antigravity CLI (`agy`) added as a peer reviewer
- `/gsd-cleanup` (#40): branch pruning integrated into archival workflow

### workflows/ (all 87 renamed get-shit-done/ → gsd-core/, ~80% had content changes)

No workflows were added or removed. The rename similarity scores range from R051 to R100 (many significantly modified). Key functional workflow changes:

- `execute-phase.md` (#38): misleading "approved" checkpoint in `human_needed` branch replaced with actionable flow; wave-cleanup pinned to orchestrator root via manifest not worktree-list first-entry (#630)
- `audit-fix.md` (#214): OpenCode write-truncation contract applied — forbid Write in fix mode, add truncation guard
- `plan-phase.md` (#621): post-planning-gaps routed through `gsd_run` launcher
- `graphify.md` (#622): `graph.html` copy made optional in build chain
- `progress.md`: liveness hints added to GSD spawn announcements (#558)
- Many workflows: `worktree_branch_check` fragment deduplicated into canonical shared reference (#588); cwd-drift guard added (#48)

### agents/ (20 modified, 0 added, 0 deleted)

No agents were added or removed. All 20 modified agents received content changes from upstream. Specific functional changes:

- `gsd-phase-researcher.md` (#214): survival hardening for OpenCode write-tool truncation
- `gsd-doc-writer.md` (#214, #571): Write forbidden in fix mode; Edit added to tools
- Six writer agents (#582, commit `692343f8`): `Edit` added to their `tools:` frontmatter list so Edit-only discipline is enforceable
- `gsd-executor.md` (#260): absolute-path worktree safety added (prose guard; enforced by new PreToolUse hook)
- `gsd-roadmapper.md` (#163): granularity defaults tightened to reduce thin-phase fragmentation
- `gsd-verifier.md` (#586): `PHASE_VERIFICATION_INCOMPLETE` status made actionable; dead `pass` branch dropped

### bin/lib CLI tooling (MAJOR — architecture change, ADR-457)

**Before (merge-base):** Hand-written CJS files lived directly in `get-shit-done/bin/lib/*.cjs` and were tracked in git.

**After (v1.3.1):** All hand-written CJS lib files were migrated to TypeScript source in `src/*.cts`. The git-tracked `get-shit-done/bin/lib/` CJS files were deleted (485 deletions overall). The generated CJS are compiled at publish time and do NOT live in the working tree. Only two net-new lib-level CJS files ship directly: `gsd-core/bin/lib/legacy-cleanup.cjs` and `gsd-core/bin/lib/package-identity.cjs`.

Key new TS modules in `src/`:
- `src/installer-migrations/003-rename-get-shit-done-to-gsd-core.cts` — auto-removes legacy `get-shit-done/` files on upgrade
- `src/package-identity.d.cts` — single package-name seam (fixes undefined-name bug in update checker, #378)
- `src/model-catalog.cts`, `src/model-profiles.cts` — effort catalog wiring
- `src/roadmap-upgrade.cts` — migration tool for M-NN phase ID convention
- `src/installer-migration-authoring.cts` — migration framework

New manifest files (baked at publish, read at runtime): `config-defaults.manifest.json`, `model-catalog.json`, `runtime-aliases.manifest.json`, `config-schema.manifest.json` — loaded by `install.js` at install time (lazy-loaded to avoid test side-effects).

### hooks/ (7 modified, 2 new)

**New hooks:**
- `hooks/gsd-worktree-path-guard.js` — PreToolUse hard-blocking guard that prevents Edit/Write to absolute paths outside the worktree root (#260)
- `hooks/managed-hooks-registry.cjs` — authoritative managed-hooks list; shared with tests to replace source-grep assertions; must be in `HOOKS_TO_COPY` to ship to installed `hooks/dist/`

**Modified:**
- `hooks/gsd-check-update-worker.js` — see collision analysis below
- `hooks/gsd-statusline.js` — updated for semver versioning
- `hooks/gsd-check-update.js`, `hooks/gsd-context-monitor.js`, `hooks/gsd-workflow-guard.js`, `hooks/gsd-update-banner.js` — various fixes

### sdk/ (DELETED — 305 files)

The entire `sdk/` subtree was removed. The `sdk/src/*.ts` session-runner and related files were either retired or superseded:
- `sdk/src/cli.ts`, `sdk/src/cli-transport.ts`, `sdk/src/context-engine.ts`, etc. — retired dead references
- Stale generated banner files (`sdk/src/generated/`) — retired
- `sdk/package.json`, `sdk/prompts/templates/` — deleted
- Chore commit `9b5ee373`: "retire orphaned CJS↔SDK hand-sync tooling"
- Chore commit `d15a4467`: "remove dead sdk/ references from eslint & stryker config"

Note: the fork currently has `sdk/src/model-catalog.ts`, `sdk/src/config.ts`, `sdk/src/session-runner.ts`, and the `@anthropic-ai/claude-agent-sdk` dependency. These are fork-owned additions that do not appear in upstream v1.3.1.

### bin/install.js (MAJOR — 2,506-line diff, 11,088 → 11,468 lines)

Key changes:
- `require('../get-shit-done/...')` → `require('../gsd-core/...')` throughout (53+ call sites)
- Marker strings: "managed by get-shit-done installer" → "managed by gsd-core installer"
- `_gsdLibDir` path updated to `gsd-core/bin/lib`
- New lazy-loaded effort catalog (`_getGsdEffortCatalog()`) reads `gsd-core/bin/shared/config-defaults.manifest.json`
- New imports: `shellHookOmitsBashRunner`, `buildLocalShellHookCommand` from `shell-command-projection.cjs`; `resolveAntigravityGlobalDir` from `runtime-homes.cjs`
- `EFFORT_SET` imported from `core.cjs`
- Self-healing checksum drift fix for installer-migration checksums (1.3.1 hotfix, commit `50eda858`)
- Installer auto-cleanup of old `get-shit-done-cc` package leftovers (per-package cache with `package_name` lineage field)
- Antigravity 2.x config directory split support (#213)
- Windows: dropped `bash.exe` wrapper from local `.sh` hooks (#580)

### tests/ (605 total changes: 129 added, 67 deleted, ~400 modified)

Massive test expansion. Notable additions:
- `tests/551-eslint-bin-lib-coverage.test.cjs` — ESLint coverage for hand-written bin/lib
- `tests/allowlist-ratchet.test.cjs` — replaces count-based ratchet guards with named-set allowlists
- `tests/backwards-compat-phase-id.test.cjs` — M-NN migration backwards compat
- `tests/bug-10-semver-policy-consolidation.test.cjs`
- `tests/worktree-safety.test.cjs` — real-worktree e2e for cwd-drift guard
- 140 new changeset fragments in `.changeset/`

Deleted tests: `tests/agents-doc-parity.test.cjs` and 66 other test files removed (many replaced by behavioral tests per #425 "replace source-grep assertions with behavioral coverage").

### CI (.github/workflows/)

New workflows: `auto-backmerge.yml`, `discord-changelog.yml`, `mutation.yml`, `pr-target-validator.yml`
Deleted: `release-sdk.yml` (SDK release retired), `test-skip.yml`
Modified: `release.yml`, `test.yml`, `hotfix.yml`, `install-smoke.yml`, and others

### docs/

Complete Diataxis restructure (commit `3bb2f8f1`, "rebrand to GSD Core and restructure docs with Diataxis"). The existing flat `docs/*.md` files were reorganized into `how-to/`, `explanation/`, `tutorials/`, `reference/` sections, with four locale mirrors. New files include: `docs/cleanup-get-shit-done-cc.md`, `docs/installer-migrations.md`, `docs/adr/` (11 ADR files added), `docs/ship-pr-body-sections.md`, `docs/workflow-discuss-mode.md`.

---

## 3. Notable Upstream Chores Affecting the Merge

### Package and bin rename (#604, #607)

| Before (merge-base) | After (v1.3.1) |
|---------------------|----------------|
| package: `@opengsd/get-shit-done-redux` | `@opengsd/gsd-core` |
| bin: `get-shit-done-redux` | `gsd-core` |
| runtime dir: `get-shit-done/` | `gsd-core/` |
| gsd-tools bin path: `bin/gsd-sdk.js` | `gsd-core/bin/gsd-tools.cjs` |

The installer migration `003-rename-get-shit-done-to-gsd-core.cts` handles removing stale `get-shit-done/` files from user installs on upgrade. Update-cache poisoning from old `get-shit-done-cc` packages is mitigated by `package_name` lineage validation in the cache.

### TypeScript source of truth migration (ADR-457, commits `df04aae5`, `5cd52eb1`)

All hand-written `bin/lib/*.cjs` files are now generated from `src/*.cts` at publish time. The `.cjs` files no longer exist in git. This makes a normal three-way merge of fork changes to `get-shit-done/bin/lib/*.cjs` impossible — those files do not exist at the target. Fork-side lib changes must be ported to the `src/*.cts` equivalents.

### Single-source package name (#498, #378)

`PACKAGE_NAME` constant in `gsd-core/bin/lib/package-identity.cjs` is the sole source of truth for the npm package name used in update checks. The previous `require('../package.json').name` resolved to `undefined` in the installed tree (only `{"type":"commonjs"}` ships). This fixes the bug where the update checker never reported updates.

### Retire dead sdk/ references (#556, #504)

Multiple chore commits removed hand-sync scripts (`sdk/scripts/check-*-fresh.mjs`), stale generated banner files, and CJS↔SDK adapter code. The `sdk/` directory that the fork extended (adding `session-runner.ts`, `config.ts`, `model-catalog.ts`) is entirely deleted upstream.

### ESLint migration replacing source-grep assertions (#597, #603, #425)

Count-based ratchet guards and `source-grep` test patterns were replaced by AST-based ESLint rules (`no-source-grep`, `no-elapsed-assertion`, etc.) and named-set allowlists. Fork tests that use source-grep patterns (`no-issue-citations.test.cjs`, `negative-framing-scan.test.cjs`) are unaffected — they are fork-owned tests not present in upstream.

### Managed-hooks registry externalized

`MANAGED_HOOKS` array was hardcoded in `gsd-check-update-worker.js` at merge-base. Upstream externalized it to `hooks/managed-hooks-registry.cjs`. This is a build requirement: `scripts/build-hooks.js` must include `managed-hooks-registry.cjs` in `HOOKS_TO_COPY`.

---

## 4. Collision Analysis: Fork Modifications vs Upstream Changes

### CRITICAL — hooks/gsd-check-update-worker.js

**Fork state:** SHA-based `isNewer()` using GitHub Commits API (`api.github.com/repos/thamwangjun/get-shit-done/commits/main`). Installed version is a 7-char SHA written by `bin/install.js`. No npm registry involved.

**Upstream v1.3.1 state:** Semver-based `isSemverNewer()` from `semver-compare.cjs`. Version is a semver string from a version file. Update check delegates to `checkLatestVersion()` which calls npm registry. Imports `PACKAGE_NAME` from `package-identity.cjs`.

These are architecturally incompatible. The fork's SHA approach was a deliberate rewrite (v2.1.0-a) to avoid npm registry dependency. Upstream has moved to a proper package-identity seam with npm. A three-way merge will produce semantic conflict even if git resolves it textually.

**Decision required:** Accept upstream's semver+npm approach (means reverting fork's SHA work), OR keep fork's SHA approach (means discarding upstream's package-identity seam for this file). The fork's repo URL in the GitHub API call (`thamwangjun/get-shit-done`) is already stale regardless.

### CRITICAL — bin/install.js

The fork has significant functional changes to `install.js`:
- `ensureHooksDist()` helper (v1.36.0.b)
- SHA versioning write via `git rev-parse --short=7 HEAD` (v2.1.0-a)
- Eta v4 rendering (`renderEtaContent`, `copyWithPathReplacement`) (v2.1.0-c)
- Codex effort resolution seam (`resolveEffort`, `translateEffortForCodex`) (v2.1.0-e)
- `{{GSD_REPO}}` and `{{GSD_BRANCH}}` template replacements in hook files

Upstream's install.js has a 2,506-line diff covering: gsd-core path updates, lazy effort catalog loading, new Antigravity support, Windows bash wrapper removal, self-healing checksum fix, new manifest loading patterns.

Both sides modified the same large file extensively. This is the highest-risk merge conflict in the entire inventory. Fork's functional additions must be re-applied on top of upstream's structural changes.

### CRITICAL — get-shit-done/bin/lib/*.cjs → src/*.cts

The fork has 5+ modified CJS lib files that no longer exist in upstream's git tree (replaced by `src/*.cts`). No three-way merge is possible. Fork patches must be manually ported:

| Fork-modified CJS | Upstream TS equivalent |
|-------------------|----------------------|
| `get-shit-done/bin/lib/core.cjs` | `src/core.cts` |
| `get-shit-done/bin/lib/model-catalog.cjs` | `src/model-catalog.cts` |
| `get-shit-done/bin/lib/state.cjs` | `src/state.cts` |
| `get-shit-done/bin/lib/init.cjs` | `src/init.cts` |
| `get-shit-done/bin/lib/phase.cjs` | `src/phase.cts` |

Fork additions include: `parseModelEffort()`, `resolveReasoningEffortInternal()`, `EFFORT_SET`, `*_effort` init fields, `renderEtaContent()` (in install.js not lib), SHA `isNewer()` (in worker not lib).

### HIGH — agents/ (20 modified)

20 agents have upstream content changes. The fork also modified agents for:
- Negative framing fixes (positive framing replacements)
- Effort wiring (`model;effort` annotations in frontmatter comments)
- Citation cleanup (removed `#NNN` references)
- Step number normalization

Key agents with high collision probability (both fork and upstream have changes):
- `gsd-executor.md` — fork: step numbering, effort, citation cleanup; upstream: worktree path guard prose, OpenCode write discipline
- `gsd-phase-researcher.md` — fork: step numbering, positive framing; upstream: OpenCode truncation survival
- `gsd-doc-writer.md` — fork: positive framing, citations; upstream: Edit added to tools, Write forbidden in fix mode
- `gsd-roadmapper.md` — fork: step numbering, effort; upstream: granularity defaults tightened
- `gsd-verifier.md` — fork: positive framing, effort; upstream: PHASE_VERIFICATION_INCOMPLETE actionable fix

The `tools:` frontmatter additions upstream made to 6 agents (#582) will conflict if the fork has different tool lists. The `agent-frontmatter.test.cjs` gate will catch any mismatch.

### HIGH — commands/ (59 modified)

All 59 commands were modified upstream (mostly path reference updates). The fork also modified all commands for citation cleanup and positive framing. Most changes are non-overlapping (fork touched prompt body lines; upstream touched `gsd-core` path strings) but volume ensures conflicts.

### HIGH — workflows/ (87 renamed + modified)

The rename from `get-shit-done/workflows/` to `gsd-core/workflows/` means git surfaces these as delete+add pairs unless the merge strategy explicitly follows renames. Fork's step-numbering normalizations and citation cleanup across workflow files will conflict with upstream content changes. `execute-phase.md` is highest risk: fork has 5 recent commits to this file; upstream has a 1,723-line diff.

### MODERATE — sdk/ deletion vs fork's sdk additions

The fork extended the `sdk/` directory (added `session-runner.ts`, `config.ts`, `model-catalog.ts`, `ws-transport.ts`). Upstream deleted the entire `sdk/` subtree. A `git merge` will produce delete/modify conflicts for every fork-added file under `sdk/`. The fork must decide: (a) keep fork's sdk additions at a new path, (b) delete them accepting the milestone scope constraint, or (c) move them to `src/`.

### MODERATE — tests/

Fork-side tests are mostly additive and won't conflict. Higher-risk files:
- `tests/agent-frontmatter.test.cjs` — both sides modified heavily; agent list, tool allowlists, effort fields
- Fork's `tests/feat-58-regression.test.cjs` — fork-only effort regression tests; may need updating for TS-generated artifacts
- `tests/negative-framing-scan.test.cjs` — fork-owned; no upstream equivalent; no collision expected

---

## 5. Behavioral and Breaking Changes the Fork Must Consciously Accept

### Breaking: package name and bin name

`get-shit-done-cc` → `@opengsd/gsd-core`. Binary `get-shit-done-cc` → `gsd-core`. Any fork-internal references to the old package name (in tests, scripts, documentation) need updating. The fork's `gsd-check-update-worker.js` currently fetches from `api.github.com/repos/thamwangjun/get-shit-done` — this URL is stale regardless of which update approach is kept.

### Breaking: bin/lib CJS files are no longer source files

After adopting the upstream tree, `gsd-core/bin/lib/*.cjs` are generated artifacts, not source files. Fork contributors editing CLI behavior must work in `src/*.cts`. This changes the development workflow and invalidates any fork documentation or plans that reference editing the CJS files directly.

### Breaking: `gsd-tools` bin path changed

At merge-base: `bin/gsd-sdk.js`. At v1.3.1: `gsd-core/bin/gsd-tools.cjs`. Fork tests and scripts that invoke the gsd-tools binary by path need updating.

### Behavioral: update check mechanism changed

Upstream switched from SHA/GitHub Commits API (fork's approach) to semver/npm registry with `PACKAGE_NAME` seam. Installed version files now contain semver strings, not 7-char SHAs. If the fork retains its SHA approach, version files in user installs will be incompatible with upstream's `isSemverNewer()` logic.

### Behavioral: worktree path guard is now a hard-blocking hook

The new `gsd-worktree-path-guard.js` PreToolUse hook blocks Edit/Write/MultiEdit calls with absolute paths outside the worktree root. Any fork test that mocks Edit/Write calls to absolute paths in worktree contexts may start failing.

### Behavioral: M-NN milestone-prefixed phase IDs (#39)

New optional convention for phase IDs (`M-01/phase-1` style). Old phase IDs remain valid. Fork's step-numbering scanner and cross-file-step-refs scanner should be verified against M-NN format.

### Behavioral: per-phase granularity overrides (#68)

`granularities.<phaseType>` config key now allows per-phase override of roadmapper phase-count targets. Tightened defaults (#163) reduce thin-phase fragmentation. Fork tests asserting specific roadmap output shapes may need updating.

### Behavioral: provider-neutral model policy presets (#49)

`model_policy` config key with presets (`economy`, `standard`, `performance`). `resolveModelForTier` now checks `Object.hasOwn` guards and a `model_policy` precedence layer. Fork's `resolveReasoningEffortInternal` changes interact with this new precedence chain.

### Behavioral: Antigravity CLI added as runtime (#34, #213, #503)

Three commits add Antigravity 2.x support. Fork's `qwen-install.test.cjs` and `agent-install-validation.test.cjs` tests enumerate supported runtimes; they will need Antigravity added.

### Behavioral: self-healing migration checksums (v1.3.1 hotfix)

Commit `50eda858` adds self-healing recovery for installer-migration checksum drift. Changes install behavior when checksums don't match — previously hard-fail, now self-heals. Fork's install tests may need updating to expect the new behavior.

---

## Summary Table

| Area | Change Type | Scale | Fork Collision Risk |
|------|-------------|-------|---------------------|
| `get-shit-done/` → `gsd-core/` rename | Breaking structural | All ~87 workflows, all references | HIGH — rename must be adopted throughout |
| `sdk/` deleted | Breaking structural | 305 files gone | HIGH — fork added files here |
| `bin/lib/*.cjs` → `src/*.cts` | Breaking architectural | ~40 CJS files deleted from git | CRITICAL — fork has CJS edits to port to TS |
| `bin/install.js` | Heavy modification | 2,506-line diff | CRITICAL — both sides heavily modified |
| `hooks/gsd-check-update-worker.js` | Incompatible rewrite | Full file | CRITICAL — fork and upstream chose different architectures |
| agents/ (20 files) | Content + frontmatter | 20 modified | HIGH — fork has framing/effort/citation edits on same files |
| commands/ (59 files) | Content | 59 modified | MODERATE — mostly non-overlapping but volume is high |
| workflows/ (87 files) | Rename + content | 87 renamed, ~70 modified | HIGH — execute-phase especially |
| Package name/bin | Breaking identity | package.json, tests, docs | HIGH — must update all fork references |
| New hooks (2 added) | Additive | gsd-worktree-path-guard.js, managed-hooks-registry.cjs | LOW — additive, but registry affects build |
| tests/ | Additive + modified | 129 added, 67 deleted | MODERATE — agent-frontmatter.test.cjs is high-risk |
| docs/ | Restructured | 170 added, 13 deleted | LOW — fork doesn't own docs |
| New features (M-NN, granularity, model_policy, Antigravity) | Behavioral | Config schema, tests | MODERATE — fork tests may assert old shapes |
