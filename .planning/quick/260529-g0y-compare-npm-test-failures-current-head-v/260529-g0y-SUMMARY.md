---
quick_id: 260529-g0y
slug: compare-npm-test-failures-current-head-v
status: complete
date: 2026-05-29
---

# Quick Task 260529-g0y: Compare npm test failures — dev HEAD vs upstream v1.01.0

## Objective

Compare `npm test` results between the current fork HEAD (`97bb0f4`, branch `dev`) and upstream remote v1.01.0 (`13c64e02`) to identify test failures introduced by fork changes.

## Method

- Ran `npm test` on `dev` HEAD in-place → `/tmp/test-dev.log`
- Created a detached git worktree at `/tmp/gsd-upstream-v1.01.0` from `13c64e02`, installed deps, ran `npm test` → `/tmp/test-upstream-v1.01.0.log`
- Both logs written with exit codes to `/tmp/test-dev.exitcode` and `/tmp/test-upstream-v1.01.0.exitcode`

## Results

| | dev `97bb0f4` | upstream v1.01.0 `13c64e02` |
|---|---|---|
| Total tests | 7,430 | 4,336 |
| Pass | 7,401 | 4,336 |
| **Fail** | **25** | **0** |

Upstream also runs an earlier batch (6,300 tests) with 1 failure — see below.

---

## Upstream's 1 failure (dev PASSES this)

- **`workflow.ai_integration_phase defaults to true`** (`config.test.cjs`)
  - Upstream expects this config key to default to `true`; fork intentionally changed this behavior

---

## Dev's 25 failures — root causes

### Root cause 1: Missing `semver-compare.cjs` (~12 failures)

`scripts/changeset/cli.cjs:27` requires `../../get-shit-done/bin/lib/semver-compare.cjs` which does not exist on the `dev` branch. The module and its exported `isInstalledAheadOfLatest` function are referenced but were never created.

**Affected tests:**
- `changeset-cli.test.cjs` — all 10 version-range extraction / render / github-release-notes tests
- `semver-compare.test.cjs` — `isInstalledAheadOfLatest` (2 tests)

**Fix needed:** Create `get-shit-done/bin/lib/semver-compare.cjs` with `isInstalledAheadOfLatest` and the semver comparison helpers expected by `changeset/cli.cjs`.

---

### Root cause 2: Installer writes git hash as VERSION, not semver (15 failures)

`bin/install.js:143`:
```js
gsdVersion = execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], ...)
// → '97bb0f4' on dev
```

`installer-migration-install-integration.test.cjs:189` asserts:
```
actual:   '97bb0f4'
expected: '1.1.0'
```

All 15 runtime end-to-end install tests fail identically (claude, codex, cursor, gemini, windsurf, antigravity, augment, cline, codebuddy, copilot, hermes, kilo, opencode, qwen, trae).

**Why upstream passes:** Upstream v1.01.0 was also running `git rev-parse --short HEAD` but the test fixture on that commit presumably used a different assertion or was run from a tagged release environment. Both `package.json` files show version `1.1.0` — the divergence is that the dev working tree produces a git hash, not the semver.

**Fix needed:** Either update `bin/install.js` to read version from `package.json` instead of git, or update the test fixture to accept either form.

---

### Root cause 3: Content-contract failures (8 failures)

Fork modifications to agent/workflow/command `.md` files drifted from what tests assert. Each is an independent fix:

| Test file | What it checks |
|---|---|
| `bug-1834-sh-hooks-installed` | `.sh` hooks (gsd-session-state.sh etc.) deployed alongside `.js` hooks |
| `bug-1924-ensure-hooks-dist-on-demand` | on-demand hooks dist build triggers and emits progress message |
| `bug-2136-sh-hook-version` | stale bash hook detector reports zero stale hooks post fresh install |
| `bug-2543-slash-command-namespace` | no `/gsd-<cmd>` (retired) syntax in Claude-facing source files |
| `bug-2948-spike-wrap-up-dispatch` | `spike.md` frontmatter + section contract for `--wrap-up` dispatch |
| `bug-3135-capture-backlog-workflow` | `capture.md` `execution_context` @-includes `add-backlog.md` |
| `bug-3320-planner-deep-work-rules` | planner agent prose keeps implementation code out of `<action>` blocks |
| `bug-3678-executor-commit-docs-respect` | executor body addresses `commit_docs:false` config flag |
| `debug-session-management` | `gsd-debugger.md` contains DATA_START security note |
| `few-shot-calibration` | `gsd-plan-checker.md` and `gsd-verifier.md` reference few-shot examples |
| `import-command` + `ingest-docs-command` | commands reference `doc-conflict-engine`, `gate-prompts` |

---

## Prioritized fix order

1. **`semver-compare.cjs`** — missing module, hard crash, 12 tests dead. Create the file.
2. **VERSION write strategy** — 15 tests. Decide: read from `package.json` or update test expectations.
3. **Content contracts** — 8 tests. Fix agent/workflow text to match what tests assert (or update tests if the fork intentionally changed the contract).
