# Upstream to Fork Changes Guide

> A reference for understanding what `main` changes relative to upstream `main` and how to maintain those changes across future upstream merges. This is the authoritative record of every category of fork modification.

---

## Fork Identity

**Branch:** `main`  
**Upstream:** `upstream/main` (merged via `git merge upstream/main`)  
**Quality bar:** `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md` and `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md`  
**Core rule:** Every prompt file on `main` meets the fork's prompt engineering quality bar before it ships — upstream content additions are modified, not accepted verbatim.

As of 2026-04-23, `main` is 412 commits ahead of `v1.37.1` across 476 changed files (54,407 insertions / 5,006 deletions).

---

## Category 1: Prompt Engineering — Positive Framing

### What changed

All negative directives in prompt files were converted to affirmative instructions:

| Upstream pattern | Fork pattern |
|---|---|
| `Do NOT fix them` | `Investigate root cause before attempting any fix` |
| `Do NOT re-run builds hoping they resolve themselves` | `Diagnose build failures from error output before re-running` |
| `Do NOT restart the build to find more issues` | `Identify all failing tests before modifying any file` |
| `NEVER run git clean inside a worktree` | `Run git clean only in the main repo — worktrees must not use git clean` |
| `Never use blanket reset or clean operations` | `Discard changes to specific files only — use git checkout -- path/to/specific/file` |
| `ALWAYS use the Write tool to create files — never use Bash(cat << 'EOF')` | `Only use the Write tool with the full file content as a string parameter` |
| `Do not continue with the steps below` | `Stop here — power mode handles all remaining steps` |
| `Do NOT retry the AskUserQuestion or generate more questions when "Other" is selected with empty text` | `When "Other" is selected with empty text: wait for the user's next message, reflect it back, and continue from where you left off` |
| `Do not infer that a flag is active just because it is documented in this prompt` | `Treat a flag as active only if its literal token is present in $ARGUMENTS` |

**Scope:** agents/, get-shit-done/workflows/, get-shit-done/references/, commands/gsd/ — all four scan directories.

**Exception:** Paired negative+positive patterns like `Never X — always Y` (e.g., security D-07 patterns) are preserved verbatim. The replacement rule requires the negative phrase to be fully removed; paired patterns are valid rewrites.

### Rule

The fork's replacement rule: negative directives (`do not X`, `never X`, `avoid X`) are replaced with affirmative instructions that state what to do instead. The replacement must specify the correct behavior — merely deleting the prohibition is not sufficient.

**Verified by:** `tests/negative-framing-scan.test.cjs` — 34 subtests covering agents, workflows, references, and commands.

### How to apply after an upstream merge

1. Run `npm test` — the negative-framing-scan subtests will identify any new violations introduced by upstream.
2. For each violation, rewrite the directive as an affirmative instruction.
3. Re-run `npm test` to confirm the corpus scan passes.

---

## Category 2: Prompt Engineering — XML Structural Changes

### `<role>` → `<persona>` in agent files

Upstream uses `<role>` as the XML tag for agent persona sections. The fork standardizes on `<persona>`.

**Scope:** All 31 agent files in `agents/`.

**Why:** Consistent semantic tagging; `agent-frontmatter.test.cjs` validates the tag name on every `npm test` run.

**Risk at merge time:** Upstream may revert `<persona>` back to `<role>` in modified agents. After each merge, run `npm test` and look for `agent-frontmatter` failures — if any agent reverts to `<role>`, re-apply the rename.

**Verified by:** `tests/agent-frontmatter.test.cjs` — 155 subtests.

---

## Category 3: Fork-Only Reference Files

These two files do not exist in upstream and must be preserved across merges:

### `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md` (1,806 lines)

The canonical prompt engineering guide that defines the fork's quality bar. Covers task specification, XML structure, context placement, priority ordering, persona design, chain-of-thought gating, constraint pairing, and output format. This is the standard every prompt file is measured against.

### `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md` (502 lines)

A step-by-step guide for improving an existing prompt, derived from the engineering guide. Includes symptom classification, per-step checklists, and a final exit checklist. Used during each upstream merge pass to assess and fix new/modified files.

**Risk at merge time:** Upstream will never add these files, so merge conflicts on them are impossible. However, upstream may add `refs/` files that overlap in purpose — treat those as additive, not replacements.

---

## Category 4: CATALOGUE.json

### What it is

`CATALOGUE.json` at the repo root is a fork-maintained inventory of all prompt content files. It records every agent, command, workflow, and reference file with metadata.

**Entry count progression:** 227 (v1.36.0) → 250 (v1.36.0 + new files) → 270 (v1.37.1 + new files)

### How to maintain after an upstream merge

1. Run `npm test` — `tests/catalogue-sync.test.cjs` will report any files present in the repo that are missing from CATALOGUE.json, and any entries that point to non-existent files.
2. Add entries for new upstream files; remove entries for deleted files.
3. CATALOGUE.json is the only place the fork tracks the full inventory — git history is not a substitute.

**Verified by:** `tests/catalogue-sync.test.cjs` — 198 tests.

---

## Category 5: Runtime — Version System

### What changed

Upstream tracks the installed version via the npm package semver (`package.json` version field). The fork replaces this with a 7-character git SHA.

| Aspect | Upstream | Fork |
|---|---|---|
| Version source | `pkg.version` (semver from package.json) | `git rev-parse --short=7 HEAD` |
| VERSION file content | Semver string (e.g. `1.37.1`) | 7-char hex SHA (e.g. `14f3d9e`) |
| Offline fallback | Semver from package.json | `no-network` sentinel (non-SHA, fails validation intentionally) |
| Comparison method | Semver integer comparison (`isNewer` with major/minor/patch) | SHA equality (`norm(hookVersion) !== norm(installed)`) |

### Why

The fork is not published to npm. Semver version numbers are meaningless for a git-cloned fork. The git SHA provides a precise, unambiguous version identifier that can be compared against GitHub's API to detect whether an update is available.

The `no-network` sentinel ensures that offline installs never silently masquerade as a valid version — any downstream check that expects a 7-char hex SHA will correctly identify `no-network` as invalid.

### Files affected

- `bin/install.js` — `gsdVersion` variable; `ensureHooksDist()` helper; `git rev-parse --short=7 HEAD` call with `cwd` pinned to repo root
- `hooks/gsd-check-update-worker.js` — `isNewer()` now does SHA equality; HTTPS GitHub API call replaces `npm view`
- `hooks/gsd-statusline.js` — removed semver-based "dev install" detection; now uses SHA equality path exclusively

---

## Category 6: Runtime — Update Worker

### What changed

Upstream's update worker calls `npm view get-shit-done-cc version` (execSync) to find the latest published version. The fork replaces this with an HTTPS request to the GitHub API to find the latest commit SHA on the fork's branch.

**Upstream:**
```js
latest = execFileSync('npm', ['view', 'get-shit-done-cc', 'version'], { encoding: 'utf8', timeout: 10000 }).trim();
```

**Fork:**
```js
https.get('https://api.github.com/repos/{{GSD_REPO}}/commits/{{GSD_BRANCH}}', ..., (res) => {
  const sha = JSON.parse(body).sha;
  if (sha && /^[0-9a-f]{40}$/.test(sha)) { latest = sha.slice(0, 7); }
});
```

`{{GSD_REPO}}` and `{{GSD_BRANCH}}` are template variables replaced at install time with the fork's GitHub coordinates.

### Why

The fork is not on npm. The GitHub API provides the ground truth for "what is the latest commit on the fork's branch" — the same information that `git pull` would retrieve. The template variables make the worker portable to any fork-of-a-fork without hardcoding.

### Key behavioral differences

- Worker is now fully async (callback-based HTTPS) rather than sync
- `writeResult()` function called from HTTPS response end, error, and timeout handlers
- `isNewer(latest, installed)` now does `latest.slice(0,7) !== installed` (SHA equality)
- `read_error` field added to result JSON for diagnostics
- Stale hook detection normalized to 7-char prefix on both sides

---

## Category 7: Runtime — Installer

### `ensureHooksDist()` helper

Added to `bin/install.js`. Called before the `if (!isCodex && ...)` block so both Claude and Codex install paths benefit.

**Purpose:** When `hooks/dist/` is absent (e.g., freshly cloned repo without running the build), the installer triggers an on-demand build using `scripts/build-hooks.js` via `spawnSync`. If the build fails, the installer aborts with a non-zero exit and a diagnostic message.

**Implementation detail:** Uses `spawnSync` (not `execSync`) with `stdio: 'pipe'` to suppress build stdout while capturing stderr for error reporting. `require('child_process')` is scoped inside the function body to avoid conflict with the existing `execSync` try-block at module scope.

### `cwd` pinning for `git rev-parse`

The `git rev-parse --short=7 HEAD` call that determines `gsdVersion` pins `cwd` to `path.join(__dirname, '..')` (the repo root). This ensures the command works correctly for global installs where the current working directory may be the user's home directory rather than the GSD repo.

### Verified by

`tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs` — 8 tests covering on-demand build triggering and console notice output.

---

## Category 8: Runtime — Statusline

### What changed

Upstream's statusline hook contained semver-based "dev install" detection: if the installed version was ahead of the npm-published version, it showed a yellow "dev install" warning instead of the red "stale hooks" warning.

The fork removed this dev-install branch entirely. With SHA-based versioning, "installed ahead of latest" is not a meaningful concept — the comparison is equality-based, not ordered.

**Upstream:**
```js
const isDevInstall = (() => { ... semver comparison ... })();
if (isDevInstall) {
  gsdUpdate += '\x1b[33m⚠ dev install — re-run installer to sync hooks\x1b[0m │ ';
} else {
  gsdUpdate += '\x1b[31m⚠ stale hooks — run /gsd-update\x1b[0m │ ';
}
```

**Fork:**
```js
gsdUpdate += '\x1b[31m⚠ stale hooks — run /gsd-update\x1b[0m │ ';
```

Additionally: a defensive `try/catch` was added to the `fs.statSync` call in the todos directory scan to handle the race condition where a file disappears between `readdir` and `stat`.

---

## Category 9: Test Suite

The fork adds four test files not present in upstream:

| File | Lines | What it tests |
|---|---|---|
| `tests/negative-framing-scan.test.cjs` | 568 | Corpus scan of agents, workflows, refs, commands for bare "do not"/"never" directives — 34 subtests |
| `tests/catalogue-sync.test.cjs` | 198 | CATALOGUE.json synchronization with actual prompt files on disk |
| `tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs` | 268 | `ensureHooksDist()` triggers on-demand build and prints console notice |
| `tests/version-detection.test.cjs` | 64 | VERSION file contains valid 7-char SHA after install |

### `scripts/run-tests.cjs` — serial isolation

The test runner was updated to run `bug-1924-ensure-hooks-dist-on-demand.test.cjs` serially, outside the concurrent batch. This file mutates `hooks/dist/` (renames it and restores it), which is shared mutable state. Running it concurrently with other tests that spawn installer subprocesses causes race conditions.

**Implementation:** `SERIAL_FILES` set in `run-tests.cjs`; parallel files run first with `--test-concurrency=4`, serial files run after in a separate `execFileSync` call.

### Scanner precedence rule

When test assertions conflict with fork standards (e.g., a test asserts for an upstream negative-framing string that the fork has rewritten), modify the test to reflect fork behavior — established precedent from v1.36.0 Phase 3. Tests should validate fork behavior, not upstream behavior.

### Anti-heredoc phrasing: "Always use the Write tool"

Upstream uses the phrasing "Only use the Write tool" in file-writing agent prompts and the matching test assertion `/only use the write tool/i` in `agent-frontmatter.test.cjs`. The fork's positive-framing replacement rule rewrites this to "Always use the Write tool".

**Test consequence:** The `HDOC: anti-heredoc instruction` suite in `agent-frontmatter.test.cjs` asserts `/always use the write tool/i` (not the upstream form). Per-agent tests in other test files (e.g. `debug-session-management.test.cjs`) must not duplicate this assertion — `agent-frontmatter.test.cjs` is the single owner. If a per-agent duplicate appears after an upstream merge, remove it rather than update it.

---

## Category 10: Planning Artifacts

The `plans/` directory contains canonical playbooks for recurring work types. These files do not exist in upstream.

| File | Purpose |
|---|---|
| `.planning/fork_plans/A0-MERGE_UPSTREAM_CONFLICTS_V01.md` | Full upstream merge lifecycle — conflict resolution, CATALOGUE sync, fork standards pass, test gate |
| `.planning/fork_plans/B0-SYNC_CATALOGUE_V01.md` | CATALOGUE.json sync procedure |
| `.planning/fork_plans/C0-POSITIVE_FRAMING_PASS_V01.md` | Positive framing conversion pass |

---

## Upstream Merge Checklist

When a new upstream version is released, run these steps in order:

1. **Merge:** `git merge upstream/main` — resolve any conflicts favoring fork changes for fork-owned files (`.planning/references/PROMPT_*`, `CATALOGUE.json`, `hooks/gsd-check-update-worker.js`, `bin/install.js`)

2. **Test:** `npm test` — identify failures before touching anything

3. **Triage new files:**
   - New prompt files → apply positive framing pass, check XML structure, add to CATALOGUE.json
   - New agents → verify no `skills:` in frontmatter; apply positive framing pass
   - New commands → apply positive framing pass; no tag conversion required
   - New workflows → apply positive framing pass; no tag conversion required

4. **Triage modified files:**
   - Run negative-framing scanner output to identify which upstream-modified files now have violations
   - Apply positive framing only to files with actual violations (scanner-first approach avoids unnecessary edits)

5. **Check agent reverts:** Verify `<persona>` tag is present in all 31 agents (upstream may revert to `<role>`); `npm test` catches this via `agent-frontmatter.test.cjs` (155 subtests)

6. **Sync CATALOGUE.json:** Add entries for new files, remove entries for deleted files

7. **Test gate:** `npm test` must pass 100% before the merge phase closes

8. **Commit:** Use the `A0-MERGE_UPSTREAM_CONFLICTS_V01.md` plan template as the execution guide

---

## Files Upstream Should Never Overwrite

These files are fork-owned. If a merge conflict appears on them, the fork version wins:

- `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md` — fork-only, does not exist in upstream
- `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md` — fork-only, does not exist in upstream
- `CATALOGUE.json` — fork-maintained inventory; upstream does not have this file
- `hooks/gsd-check-update-worker.js` — fork runtime (SHA-based); upstream uses npm semver
- `hooks/gsd-statusline.js` — fork runtime (SHA equality); upstream uses semver comparison
- `bin/install.js` — fork runtime (git SHA version, ensureHooksDist); upstream uses pkg.version
- `tests/negative-framing-scan.test.cjs` — fork-only test
- `tests/catalogue-sync.test.cjs` — fork-only test
- `tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs` — fork-only test
- `tests/version-detection.test.cjs` — fork-only test
- `plans/` — fork-only planning directory
- `scripts/run-tests.cjs` — fork-modified serial isolation

---

*Last updated: 2026-04-30 — four-level tag hierarchy conversion removed from active requirements; merge checklist updated*
