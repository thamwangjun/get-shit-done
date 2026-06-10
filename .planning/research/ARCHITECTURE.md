# Architecture: Rename Blast Radius & Fork-Patch Survival

**Milestone:** v2.3.1-a Upstream v1.3.1 Merge & Rename Adoption
**Researched:** 2026-06-10
**Scope:** `get-shit-done/` → `gsd-core/` directory rename and `get-shit-done-cc` → `@opengsd/gsd-core` npm package rename blast radius.

---

## 1. Blast-Radius Enumeration

### 1a. Directory path literal `get-shit-done/`

Every occurrence below was verified by grep at HEAD.

#### `bin/install.js` (fork-owned, 3,400+ lines)

| Line(s) | Nature |
|---------|--------|
| 21, 33 | `require('../get-shit-done/bin/lib/shell-command-projection.cjs')` and `runtime-homes.cjs` — bootstrap requires at top of file |
| 157 | `const _gsdLibDir = path.join(__dirname, '..', 'get-shit-done', 'bin', 'lib')` — central lib-dir constant; all subsequent lib `require()` calls flow through this |
| 5032, 5038–5039 | Codex path-substitution block: replaces `~/.claude/get-shit-done/` and `$HOME/.claude/get-shit-done/` in file content during install |
| 6989–7005 | Uninstall: `path.join(targetDir, 'get-shit-done')` — removes the directory; preserves `get-shit-done/USER-PROFILE.md` |
| 7163, 7204 | Settings key filtering: `key.includes('get-shit-done')` |
| 7313, 7359–7360 | OpenCode permission path: `~/.config/opencode/get-shit-done/*` |
| 7393, 7433–7434 | Kilo permission path: `~/.config/kilo/get-shit-done/*` |
| 7605, 7630 | Manifest generation: `path.join(configDir, 'get-shit-done')` and `manifest.files['get-shit-done/' + rel]` |
| 7735, 7817 | Install roots comment and manifest key deletion: `get-shit-done/` prefix in file map |
| 8066, 8871–9236 (x6) | `{{GSD_REPO}}` replacement with literal `'thamwangjun/get-shit-done'` — six call sites |
| 8132 | Path prefix stripping comment: `$HOME/.claude/` → `<pathPrefix>get-shit-done/bin/...` |
| 8259, 8311, 8323, 8380–8381 | VERSION file paths: `get-shit-done/VERSION` (pre-install, early, rollback) |
| 8636–8643, 8651, 8666 | Skill copy: `path.join(src, 'get-shit-done')`, `path.join(targetDir, 'get-shit-done')`, `verifyInstalled(skillDest, 'get-shit-done')`, display string |
| 8816, 8827 | CHANGELOG.md and VERSION dest paths: `path.join(targetDir, 'get-shit-done', 'CHANGELOG.md')` |
| 9054, 9153–9154 | Rollback VERSION restore path |
| 10567, 10574 | Error-message git clone path: `get-shit-done-redux && cd get-shit-done/sdk` — user-facing suggestion |

Total operative path literals in install.js: approximately 35 distinct sites.

#### `hooks/` (fork-owned)

| File | Lines | Nature |
|------|-------|--------|
| `hooks/gsd-check-update.js` | 19, 23, 39–40 | `path.join(envDir/baseDir/configDir, 'get-shit-done', 'VERSION')` — version file discovery |
| `hooks/gsd-check-update-worker.js` | 99–103 | `{{GSD_REPO}}` and `{{GSD_BRANCH}}` template literals (replaced at install time); no bare `get-shit-done/` path |
| `hooks/gsd-context-monitor.js` | 140, 143 | `path.join(__dirname, '..', 'get-shit-done', 'bin', 'gsd-tools.cjs')` — runtime gsd-tools lookup |
| `hooks/dist/` (mirrored) | same line numbers | Identical — `build:hooks` copies source to `dist/`; both must be updated |

#### `tests/` (fork-owned)

Files with `require('../get-shit-done/bin/lib/...')` or equivalent path builds — over 60 test files. Representative set:
- `tests/helpers.cjs:9` — `TOOLS_PATH = path.join(__dirname, '..', 'get-shit-done', 'bin', 'gsd-tools.cjs')` — used by every CLI test via this helper
- `tests/helpers/cli-negative.cjs:32` — same TOOLS_PATH pattern
- `tests/audit.test.cjs:16`, `tests/feat-53-*.cjs`, `tests/feat-57-*.cjs`, `tests/feat-58-*.cjs`, `tests/parse-model-effort*.cjs`, `tests/install-eta-regression.test.cjs`, `tests/bug-2992-*.cjs`, and approximately 55 more — all contain `require('../get-shit-done/bin/lib/<module>.cjs')`
- `tests/agent-frontmatter.test.cjs:21` — `WORKFLOWS_DIR = path.join(__dirname, '..', 'get-shit-done', 'workflows')`; line 387 — `get-shit-done/templates/discussion-log.md`
- `tests/catalogue-sync.test.cjs` lines 54–109 — asserts specific paths like `'get-shit-done/references/...'`, `'get-shit-done/workflows/...'`, `'get-shit-done/templates/spec.md'`
- `tests/negative-framing-scan.test.cjs:36–37` — `SCAN_DIRS` array contains `'get-shit-done/workflows'`, `'get-shit-done/references'`
- `tests/no-issue-citations.test.cjs:46–49` — `SCAN_DIRS` contains `'get-shit-done/workflows'`, `'get-shit-done/references'`, `'get-shit-done/templates'`
- `tests/step-numbering-scan.test.cjs:29, 35–37` — `SCAN_DIRS` and exclusion array hardcode `'get-shit-done/workflows'` paths
- `tests/phase-30-affirmative-replacements.test.cjs` — six subtests reference `'get-shit-done/workflows/<file>.md'`
- `tests/phase-38-nyquist.test.cjs` lines 59–74 — sixteen `'get-shit-done/workflows/<file>.md'` entries
- `tests/bug-2994-verify-reapply-patches-installed-path.test.cjs:53, 62` — `${GSD_HOME}/` env var in workflow file assertions

Fork guard tests with scan-dir path literals (highest clobber risk):
- `tests/no-issue-citations.test.cjs`
- `tests/negative-framing-scan.test.cjs`
- `tests/step-numbering-scan.test.cjs`
- `tests/cross-file-step-refs.test.cjs`

#### `package.json` (fork-owned)

| Key | Value |
|-----|-------|
| `"name"` | `"get-shit-done-cc"` — must become `"@opengsd/gsd-core"` (or chosen fork name) |
| `bin."get-shit-done-redux"` | `"bin/install.js"` — bin name must change |
| `files[0]` | `"get-shit-done"` — npm publish includes this directory by its old name |
| `test:coverage` script | `--include 'get-shit-done/bin/lib/*.cjs'` — c8 glob |
| `test:coverage:unit` script | same `--include` glob |

#### `.github/` CI workflows (fork-owned)

| File | Content |
|------|---------|
| `test.yml:14`, `test-skip.yml:16` | `'get-shit-done/**'` path filter for CI triggers |
| `hotfix.yml` (multiple lines) | `get-shit-done-redux` npm package name in `npm view`, `npm dist-tag` |
| `install-smoke.yml:174, 179–180, 293–294` | `command -v get-shit-done-redux`, invocation of `get-shit-done-redux --claude --local` |
| `release-sdk.yml` (multiple) | `@opengsd/get-shit-done-redux` — already scoped name |
| `release.yml` (multiple) | `@opengsd/get-shit-done-redux` |
| `ISSUE_TEMPLATE/bug_report.yml` | `ls -la ~/.claude/get-shit-done/`, `cat ~/.claude/get-shit-done/gsd-file-manifest.json` |

Note: release.yml and release-sdk.yml already reference `@opengsd/get-shit-done-redux`. The upstream v1.3.1 rename target is `@opengsd/gsd-core`, so these will need a second update pass.

#### `get-shit-done/bin/lib/*.cjs` (upstream-provided, path strings in runtime code)

These are upstream-provided source files containing `get-shit-done/` path strings as runtime strings. The merge will update them:
- `core.cjs:524` — `GSD_HOME` env var fallback
- `core.cjs:1092–1104` — `__dirname` resolution comment and logic
- `init.cjs:1949–1950` — `.claude/get-shit-done/skills` path
- `installer-migrations/000-first-time-baseline.cjs:16–33` — per-runtime `'get-shit-done'` baseline directory entries
- `installer-migration-report.cjs:131–138` — stale SDK artifact detection
- `model-catalog.cjs:8–14` — co-located install path comment
- `cjs-sdk-bridge.cjs:20, 45` — install path comment

#### `sdk/src/` TypeScript (upstream-provided)

- `sdk/src/query/command-seam-coverage.test.ts:102–108` — six `require('../../../get-shit-done/bin/lib/<router>.cjs')` lines
- Multiple `.ts` files contain `get-shit-done/` in comments and JSDoc — cosmetic
- `sdk/dist/*.d.ts` — compiled declaration files with path strings in JSDoc — cosmetic

#### `.planning/` references (fork-owned, no code paths)

- `.planning/codebase/ARCHITECTURE.md` — documentation, cosmetic
- `.planning/references/PROMPT_ENGINEERING_GUIDE_V10.md` — no path literals
- `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md` — no path literals

### 1b. Package name `get-shit-done-cc`

| Location | Value |
|----------|-------|
| `package.json:"name"` | `"get-shit-done-cc"` — rename to `"@opengsd/gsd-core"` or fork variant |
| `package-lock.json:"name"` | `"get-shit-done-cc"` — regenerated by `npm install` |
| `tests/semver-compare.test.cjs:128–129` | assertion: worker must not contain `"get-shit-done-cc"` — already guards against old name; passes post-rename |

### 1c. Env vars `GSD_HOME` and `GSD_AGENTS_DIR`

Neither env var name changes. They are path-override env vars whose values may contain `get-shit-done` only if the user sets them that way. Code reading them: `core.cjs:524` (GSD_HOME) and `core.cjs:1101–1102` (GSD_AGENTS_DIR). No rename action required on these vars themselves.

---

## 2. Fork-Authored vs Upstream-Provided

### Fork-Authored (fork must migrate manually)

| File | Fork Content at Risk |
|------|---------------------|
| `bin/install.js` | SHA/path logic; `_gsdLibDir` constant; `{{GSD_REPO}}` literal `thamwangjun/get-shit-done`; Codex path-sub; uninstall dir name; manifest key names |
| `hooks/gsd-check-update-worker.js` | `isNewer()` SHA comparison; `{{GSD_REPO}}/{{GSD_BRANCH}}` templates |
| `hooks/gsd-check-update.js` | VERSION file path: `get-shit-done/VERSION` |
| `hooks/gsd-context-monitor.js` | `gsd-tools.cjs` lookup path |
| `hooks/dist/*` | Mirrored from source — must be rebuilt after source edits |
| `package.json` | `"name"`, `"bin"`, `"files"`, c8 `--include` globs |
| `.github/workflows/test.yml` | `get-shit-done/**` path trigger |
| `.github/workflows/test-skip.yml` | same |
| `.github/workflows/hotfix.yml` | `get-shit-done-redux` npm package name |
| `.github/workflows/install-smoke.yml` | `get-shit-done-redux` binary name |
| `tests/helpers.cjs` | `TOOLS_PATH` |
| `tests/helpers/cli-negative.cjs` | `TOOLS_PATH` |
| All ~60 `tests/*.test.cjs` with `require('../get-shit-done/bin/lib/...')` | module require paths |
| Fork guard tests: `tests/no-issue-citations.test.cjs`, `tests/negative-framing-scan.test.cjs`, `tests/step-numbering-scan.test.cjs`, `tests/agent-frontmatter.test.cjs`, `tests/cross-file-step-refs.test.cjs`, `tests/phase-30-affirmative-replacements.test.cjs`, `tests/phase-38-nyquist.test.cjs` | `SCAN_DIRS`, file path strings |
| `tests/version-detection.test.cjs` | assertions about `'thamwangjun/get-shit-done'` literal in install.js |
| `tests/bug-2992-check-latest-version.test.cjs` | GitHub API URL assertion with fork repo |

### Upstream-Provided (merge handles replacement)

| File | What Merge Brings |
|------|------------------|
| `get-shit-done/bin/lib/core.cjs` (→ `gsd-core/bin/lib/core.cjs`) | Updated `__dirname` navigation; `GSD_HOME`/`GSD_AGENTS_DIR` preserved |
| `get-shit-done/bin/lib/installer-migrations/000-first-time-baseline.cjs` | Per-runtime baseline arrays: `'get-shit-done'` → `'gsd-core'` |
| `get-shit-done/bin/lib/init.cjs` | Skills path: `.claude/get-shit-done/skills` → `.claude/gsd-core/skills` |
| `get-shit-done/bin/lib/installer-migration-report.cjs` | SDK stale-artifact pattern updated |
| All `get-shit-done/workflows/*.md` | Upstream may change content; fork must re-scan for framing violations |
| `sdk/src/query/command-seam-coverage.test.ts` | Require paths updated by upstream |

---

## 3. Fork-Critical Patches

### Patch 1: SHA-based `isNewer()` in `hooks/gsd-check-update-worker.js`

**What it does:** Replaces semver comparison with 7-char SHA prefix comparison. `isNewer(latest, installed)` returns true iff `latest` is non-null and `latest.slice(0,7) !== installed`. Uses GitHub Commits API at `{{GSD_REPO}}/commits/{{GSD_BRANCH}}`.

**Clobber risk:** Upstream v1.3.1 ships a new `gsd-check-update-worker.js`. If upstream changes the version-check mechanism or API endpoint, the merge replaces the file, removing `isNewer()` or switching away from GitHub Commits API.

**Detection post-merge:**
```bash
grep -n "isNewer" hooks/gsd-check-update-worker.js
grep -n "GSD_REPO\|GSD_BRANCH" hooks/gsd-check-update-worker.js
grep -n "api.github.com" hooks/gsd-check-update-worker.js
```
All three must return results. `isNewer` must still implement `latest.slice(0,7) !== installed`.

### Patch 2: `{{GSD_REPO}}` template replacement pointing to fork repo in `bin/install.js`

**What it does:** Six call sites replace `{{GSD_REPO}}` with `'thamwangjun/get-shit-done'` at install time, so installed hooks fetch update info from the fork's GitHub repo rather than upstream.

**Clobber risk:** Upstream v1.3.1 changes these literals to `'open-gsd/gsd-core'`. The merge replaces all six sites. The fork must restore `thamwangjun/get-shit-done` (or the fork's current canonical repo) at all six sites.

**Detection post-merge:**
```bash
grep -n "GSD_REPO\|thamwangjun\|open-gsd/gsd-core" bin/install.js | grep "replace"
```
Must show the correct fork repo literal.

Also: `tests/version-detection.test.cjs:68–71` asserts `installSrc.includes("'thamwangjun/get-shit-done'")`. Test failure post-merge is the expected detection signal.

### Patch 3: `ensureHooksDist()` in `bin/install.js`

**What it does:** On-demand build of `hooks/dist/` when absent on fresh clone. Added in v1.36.0.b. Guarded by `tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs` (8 tests).

**Clobber risk:** Upstream may rename, remove, or restructure this helper during the large install.js rewrite for v1.3.1.

**Detection post-merge:**
```bash
grep -n "ensureHooksDist" bin/install.js
npm test 2>&1 | grep "ensure-hooks-dist"
```

### Patch 4: Fork guard test corpus — `SCAN_DIRS` path literals

**What it does:** Four fork-created corpus guard tests scan prompt content for quality violations. All hardcode `'get-shit-done/workflows'`, `'get-shit-done/references'`, etc. as scan directory paths.

**Clobber risk:** After rename the directory `get-shit-done/workflows/` does not exist. The tests silently pass vacuously — no files found means zero violations detected. This is the worst failure mode: green test suite, dead quality guards.

**Files requiring SCAN_DIRS update:**
- `tests/no-issue-citations.test.cjs` — lines 46–49
- `tests/negative-framing-scan.test.cjs` — lines 36–37
- `tests/step-numbering-scan.test.cjs` — lines 29, 35–37
- `tests/agent-frontmatter.test.cjs` — line 21 (`WORKFLOWS_DIR`), line 387 (template path)
- `tests/cross-file-step-refs.test.cjs` — workflow paths (verify by grep)
- `tests/phase-30-affirmative-replacements.test.cjs` — six workflow path strings
- `tests/phase-38-nyquist.test.cjs` — sixteen workflow path strings
- `tests/catalogue-sync.test.cjs` — reference/workflow/template path assertions

**Detection post-merge:**
```bash
grep "SCAN_DIRS" tests/negative-framing-scan.test.cjs | grep gsd-core
grep "SCAN_DIRS" tests/no-issue-citations.test.cjs | grep gsd-core
grep "SCAN_DIRS" tests/step-numbering-scan.test.cjs | grep gsd-core
```
And confirm non-empty corpus: verify `ls gsd-core/workflows/*.md | wc -l` returns 60+.

### Patch 5: Fork reference docs in `.planning/references/`

**What they do:** `PROMPT_ENGINEERING_GUIDE_V10.md` and `PROMPT_IMPROVEMENT_GUIDE_V01.md` define the fork's quality standards.

**Clobber risk:** None. `.planning/` is not part of the upstream merge.

**Detection post-merge:**
```bash
ls .planning/references/PROMPT_ENGINEERING_GUIDE_V10.md
ls .planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md
```

### Patch 6: `tests/version-detection.test.cjs` — fork repo assertion

**What it does:** Lines 68–71 assert `installSrc.includes("'thamwangjun/get-shit-done'")`. Also checks `check-latest-version.cjs` does not fetch from npmjs.com.

**Clobber risk:** After merge, upstream replaces the install.js literal with `'open-gsd/gsd-core'`. This test FAILS post-merge, signaling the fork must re-insert its repo literal. Test failure is the intended detection mechanism.

---

## 4. Rename Interaction with c8 Coverage, Test Requires, and Path Resolution

### c8 Coverage — Silent Vacuous Green Risk

`package.json` defines:
```
c8 --check-coverage --lines 70 --include 'get-shit-done/bin/lib/*.cjs'
```

After rename, the glob `'get-shit-done/bin/lib/*.cjs'` matches zero files. c8 with `--all` and a non-matching `--include` glob may produce zero covered lines and zero total lines. Depending on c8 version, `--check-coverage --lines 70` either passes vacuously (0/0) or reports 0% which fails. Either way, the coverage enforcement is broken.

**What breaks:** `npm run test:coverage` no longer enforces the 70% line coverage requirement against actual source files.

**Fix required:** Both coverage scripts in `package.json` must change:
- `'get-shit-done/bin/lib/*.cjs'` → `'gsd-core/bin/lib/*.cjs'`

### Test `require()` Paths — Loud MODULE_NOT_FOUND Failures

Tests use three patterns:
1. `require('../get-shit-done/bin/lib/<module>.cjs')` — approximately 60 test files
2. `path.join(ROOT, 'get-shit-done', 'bin', 'lib', '<module>.cjs')` — approximately 10 test files
3. `path.join(__dirname, '..', 'get-shit-done', 'bin', 'gsd-tools.cjs')` — `tests/helpers.cjs` and `tests/helpers/cli-negative.cjs`

After rename, all three patterns produce paths that do not exist. Node.js `require()` throws `MODULE_NOT_FOUND` on test file load, not on assertion. The failure mode is loud (cascading load errors), not silent.

**What breaks:** Approximately 60+ test files fail to load. Test count drops from ~9,800 pass to near zero.

**Fix required:** Mechanical find-and-replace across all test files. The two helpers are the highest-leverage fix: fixing `tests/helpers.cjs` and `tests/helpers/cli-negative.cjs` repairs every test that calls gsd-tools through those helpers without per-file edits.

### `GSD_HOME` and `GSD_AGENTS_DIR` Resolution — Unaffected

`core.cjs` computes config dir via `process.env.GSD_HOME || os.homedir()`. The `__dirname` self-location logic navigates up 3 levels from `gsd-core/bin/lib/` — same depth as before, still reaches config root correctly.

`GSD_AGENTS_DIR` is a full-path override with no directory-name dependency.

Neither env var is affected by the rename. No action required on these two variables.

### Scan-Dir Tests — Silent Vacuous Pass (Most Dangerous)

As described in Patch 4: if `SCAN_DIRS` arrays still reference `'get-shit-done/workflows'` after rename, the scan finds zero files and all assertions pass with zero violations. The test suite is entirely green while quality guards are dead.

**Mitigation:** Add a non-empty corpus assertion to each fork guard test immediately after building the file list:
```javascript
assert.ok(allFiles.length > 0, 'SCAN_DIR must contain at least one file — check path after rename');
```
This converts silent vacuous green into a loud assertion failure when the directory is missing or misnamed.

---

## 5. Post-Merge Verification Checklist

### A. Rename Fully Adopted

- [ ] `ls gsd-core/` exists and contains `bin/`, `workflows/`, `references/`, `templates/`
- [ ] `ls get-shit-done/` returns "No such file or directory"
- [ ] `grep '"name"' package.json` shows new package name (`@opengsd/gsd-core` or fork variant), not `get-shit-done-cc`
- [ ] `grep '"get-shit-done"' package.json` returns no results in the `files` array
- [ ] `grep 'gsd-core/bin/lib' package.json` shows updated c8 include globs in both coverage scripts
- [ ] `grep 'get-shit-done' package.json` returns no results
- [ ] `grep 'get-shit-done' .github/workflows/test.yml .github/workflows/test-skip.yml` returns no results
- [ ] `grep 'get-shit-done-redux' .github/workflows/hotfix.yml .github/workflows/install-smoke.yml` returns no results (or expected new bin name)
- [ ] `node -e "require('./gsd-core/bin/gsd-tools.cjs')"` loads without error
- [ ] `npm test 2>&1 | grep "MODULE_NOT_FOUND"` returns no results

### B. Fork-Critical Patches Intact

- [ ] `grep -n "isNewer" hooks/gsd-check-update-worker.js` — function present
- [ ] `grep -n "latest.slice(0,7)" hooks/gsd-check-update-worker.js` — SHA truncation logic present
- [ ] `grep -n "GSD_REPO\|GSD_BRANCH" hooks/gsd-check-update-worker.js` — template vars present
- [ ] `grep -n "api.github.com" hooks/gsd-check-update-worker.js` — GitHub Commits API in use (not npmjs.com)
- [ ] `grep -n "{{GSD_REPO}}" bin/install.js | wc -l` returns at least 6
- [ ] `grep -n "thamwangjun" bin/install.js` returns results (OR `tests/version-detection.test.cjs` updated to new fork URL)
- [ ] `grep -n "ensureHooksDist" bin/install.js` returns results
- [ ] `ls .planning/references/PROMPT_ENGINEERING_GUIDE_V10.md .planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md` — both present
- [ ] `grep "SCAN_DIRS\|WORKFLOWS_DIR" tests/negative-framing-scan.test.cjs | grep gsd-core` — scan dirs updated
- [ ] `grep "SCAN_DIRS" tests/no-issue-citations.test.cjs | grep gsd-core` — scan dirs updated
- [ ] `grep "SCAN_DIRS" tests/step-numbering-scan.test.cjs | grep gsd-core` — scan dirs updated
- [ ] `grep "WORKFLOWS_DIR" tests/agent-frontmatter.test.cjs | grep gsd-core` — workflows dir updated
- [ ] `grep "gsd-core" tests/catalogue-sync.test.cjs | wc -l` returns a positive number

### C. Test Suite Health

- [ ] `npm test 2>&1 | grep -E "^# pass"` shows pass count comparable to pre-merge baseline (not near zero)
- [ ] `npm run test:coverage 2>&1 | grep "Lines"` shows a real non-zero percentage
- [ ] `npm test 2>&1 | grep "negative-framing" | grep -v "0 passing"` — scanner runs and finds files
- [ ] `npm test 2>&1 | grep "step-numbering" | grep -v "0 passing"` — scanner runs and finds files
- [ ] `npm test 2>&1 | grep "no-issue-citations" | grep -v "0 passing"` — scanner runs and finds files
- [ ] `npm test 2>&1 | grep "ensure-hooks-dist"` shows 8 passing

### D. Runtime Smoke

- [ ] `node bin/install.js --claude --local --config-dir /tmp/gsd-smoke-test/` completes without error
- [ ] `ls /tmp/gsd-smoke-test/gsd-core/VERSION` exists
- [ ] `ls /tmp/gsd-smoke-test/get-shit-done/` returns "No such file or directory"
- [ ] `grep "gsd-hook-version" /tmp/gsd-smoke-test/hooks/gsd-check-update-worker.js` shows a SHA value, not the template `{{GSD_VERSION}}`

---

## Migration Work Breakdown

| Workstream | Files | Effort | Risk |
|------------|-------|--------|------|
| `bin/install.js` — `_gsdLibDir` + ~35 path sites + `{{GSD_REPO}}` literals | 1 file | High | Critical — merge clobbers |
| `hooks/` source + dist — VERSION path + gsd-tools path | 4 files (2 src + 2 dist) | Low | High — merge clobbers |
| `package.json` — name, bin, files, c8 globs | 1 file | Trivial | Medium — c8 silent failure |
| `.github/workflows/` — path triggers, bin names | 4 files | Low | Low |
| `tests/helpers.cjs` + `tests/helpers/cli-negative.cjs` — TOOLS_PATH | 2 files | Trivial | High leverage — fixes ~60 downstream tests |
| ~60 `tests/*.test.cjs` — require paths | ~60 files | Medium | Loud failure (MODULE_NOT_FOUND) |
| Fork guard tests — SCAN_DIRS, WORKFLOWS_DIR, catalogue paths | 8 files | Medium | Critical — silent vacuous pass |
| `tests/version-detection.test.cjs` — fork repo assertion | 1 file | Low | Detection mechanism |
| `sdk/src/query/command-seam-coverage.test.ts` — require paths | 1 file | Trivial | Medium |

**Highest-risk items (silent failure without detection):**
1. Fork guard `SCAN_DIRS` not updated — vacuous green corpus scans
2. c8 `--include` glob not updated — vacuous green coverage

**Recommended phase sequencing:**
1. Run upstream merge; let upstream handle its own `get-shit-done/` → `gsd-core/` changes in its files
2. Fix `bin/install.js`: `_gsdLibDir` constant first (single fix, all downstream lib requires flow through it), then all path literals, then restore `{{GSD_REPO}}` fork literal
3. Fix `hooks/` source files, then run `npm run build:hooks` to rebuild `hooks/dist/`
4. Fix `package.json` (name, bin, files, c8 globs)
5. Fix `tests/helpers.cjs` and `tests/helpers/cli-negative.cjs` (highest leverage)
6. Bulk mechanical update of ~60 test `require()` paths
7. Update fork guard test `SCAN_DIRS` arrays + add non-empty corpus assertions
8. Run post-merge verification checklist
