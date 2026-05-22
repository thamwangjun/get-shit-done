# Phase 7: Merge and Conflict Resolution - Research

**Researched:** 2026-04-17
**Domain:** Git merge conflict resolution — fork-patch preservation in a large upstream merge
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** All merge conflicts — both the 3 known high-risk files and any unexpected files — must be resolved before Phase 7 closes. No deferred conflicts.
- **D-02:** `hooks/gsd-check-update-worker.js` — preserve the fork's `thamwangjun` SHA equality check; do not let upstream's npm semver check overwrite it. Verification: `grep thamwangjun hooks/gsd-check-update-worker.js` returns a match.
- **D-03:** `bin/install.js` — preserve `ensureHooksDist` helper and `git rev-parse --short=7 HEAD` version detection across the 479-line conflict. Verification: `grep ensureHooksDist bin/install.js` returns the function definition.
- **D-04:** `tests/agent-frontmatter.test.cjs` — preserve the fork's positive-framing assertion (`/only use the write tool/i`); do not let upstream's prohibition-form assertion overwrite it. Verification: `grep -i "only use" tests/agent-frontmatter.test.cjs` returns a match.
- **D-05:** For any file beyond the 3 known ones that conflicts: inspect and resolve in Phase 7. Default behavior for non-fork-patched content is to take upstream's version; any file containing fork-specific logic requires manual inspection.
- **D-06:** Fork-specific test failures must be fixed in Phase 7. Upstream-introduced failures are documented as the baseline failure list and deferred to Phase 10.
- **D-07:** Test was passing before merge and now fails because a fork-specific file was corrupted during conflict resolution → fix in Phase 7. Test fails because upstream added new content that the fork's standards scanner catches → Phase 10 scope.
- **D-08:** Commit message format: `chore: merge upstream v1.37.1 (55 commits, 3 conflict files resolved)` — adjust conflict file count if unexpected conflicts are encountered.

### Claude's Discretion

- Specific hunk-level resolution approach within each conflict file (which hunks to take from ours vs theirs, beyond the fork-patch preservation rules)
- Order in which conflict files are resolved
- Whether to use `git mergetool` or manual editor resolution

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MERGE-01 | Fork branch `thamw-main` integrates all upstream v1.37.1 commits via `git merge upstream/main` | Confirmed 55 commits ahead; merge command documented with exact verification check |
| MERGE-02 | `hooks/gsd-check-update-worker.js` preserves the fork's GitHub SHA equality check — `grep thamwangjun hooks/gsd-check-update-worker.js` returns a match after merge | Fork patch fully characterized; upstream's conflicting approach (npm semver) documented |
| MERGE-03 | `bin/install.js` preserves `ensureHooksDist` and `git rev-parse --short=7 HEAD` — `grep ensureHooksDist bin/install.js` returns the function definition after merge | 29 diff hunks catalogued; fork-patch locations pinpointed (lines 207-237 and 5779) |
| MERGE-04 | `tests/agent-frontmatter.test.cjs` preserves the fork's positive-framing assertion — not replaced by upstream's prohibition form | Exact diff documented; both versions of the assertion string recorded |
</phase_requirements>

---

## Summary

Phase 7 executes a single `git merge upstream/main` that brings 55 upstream v1.37.1 commits into `thamw-main`. The merge will produce conflicts in at least 3 known high-risk files where the fork's patches directly overwrite upstream code. The fork's patches encode irreversible business logic decisions: SHA-based update detection in the worker, on-demand hooks build in the installer, and positive-framing test assertions in the frontmatter test. Silent auto-resolution on any of these files would produce a branch that appears clean but breaks update detection, hooks installation, or fork standards validation — poisoning all downstream phases.

The conflict scope is well-characterized: upstream changed 193 files and the fork changed approximately 229 files relative to the common ancestor. Many diverged files (agents, workflows, commands, references) will auto-resolve cleanly because the fork only added content (prompt engineering improvements) that upstream did not touch at the same locations. The 3 high-risk files are high-risk precisely because upstream actively maintains the same sections the fork patched. Beyond the 3 known files, the most likely unexpected conflicts are `hooks/gsd-check-update.js`, `hooks/gsd-statusline.js`, `scripts/run-tests.cjs`, and `tests/semver-compare.test.cjs` — each has substantive divergence documented below.

Plan 07-01 (the merge and resolution) is the blocking gate. Plan 07-02 (post-merge test run) captures the baseline: fork-specific test failures discovered here must be fixed before the phase closes; upstream-introduced failures are catalogued as input for Phase 10.

**Primary recommendation:** Perform the merge, grep-verify all 3 critical patches immediately after conflict resolution (before running any tests), then run `npm test` to establish the baseline.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| `git merge upstream/main` | Developer CLI | — | Pure git operation; no runtime tiers involved |
| Conflict resolution — worker | API / Backend (hooks) | — | `gsd-check-update-worker.js` is a Node.js background process spawned at session start |
| Conflict resolution — installer | Developer CLI (install script) | — | `bin/install.js` runs at install time, not during normal operation |
| Conflict resolution — test | Test layer | — | `tests/agent-frontmatter.test.cjs` validates agent file content at test time |
| Post-merge test run | Test layer | — | `npm test` invokes Node.js built-in test runner across all `tests/*.test.cjs` files |
| Fork-patch verification (grep checks) | Developer CLI | — | Shell grep commands verify patch survival after merge |

---

## Standard Stack

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| git | system | Merge, conflict detection, commit | Single source of truth for all changes |
| Node.js test runner | built-in (v18+) | Run test suite | Already configured; `npm test` invokes `scripts/run-tests.cjs` |
| npm | system | Run `npm test` script | Delegates to `scripts/run-tests.cjs` |

[VERIFIED: codebase grep]

### Supporting

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| `scripts/run-tests.cjs` | — | Orchestrates parallel + serial test execution | Called by `npm test`; handles SERIAL_FILES isolation for hooks/dist-mutating tests |
| `git diff --name-only --diff-filter=U` | — | Authoritative list of conflicted files after merge | Run immediately after `git merge` to discover all conflicts before manual resolution begins |

### No Alternatives Considered

This phase uses git merge exclusively. No rebase, no cherry-pick. The prior v1.36.0 precedent used `git merge upstream/main` and that pattern is locked.

---

## Architecture Patterns

### System Architecture Diagram

```
Developer runs: git merge upstream/main
          |
          v
    Git detects 3+ conflict files
          |
          +---> Conflict file list (git diff --name-only --diff-filter=U)
          |
          v
    Manual resolution for each conflict file
          |
          +---> hooks/gsd-check-update-worker.js  (preserve: thamwangjun URL, SHA isNewer)
          +---> bin/install.js                    (preserve: ensureHooksDist fn, gsdVersion block)
          +---> tests/agent-frontmatter.test.cjs  (preserve: /only use the write tool/i)
          +---> [unexpected files]                (inspect; default: take upstream)
          |
          v
    git add <resolved-files>
          |
          v
    Grep verification (all 4 success criteria)
          |
          v
    git commit (merge commit with D-08 message)
          |
          v
    npm test  [Plan 07-02]
          |
          +---> fork-specific failures → fix in Phase 7
          +---> upstream-introduced failures → document as baseline for Phase 10
```

### Recommended Resolution Approach

The canonical playbook is `plans/XX-MERGE_UPSTREAM_CONFLICTS_V01.md`. Its resolution strategy is: **take all upstream feature additions + preserve fork's structural conventions**. For Phase 7, the structural conventions are the 3 fork patches listed in the decisions.

### Pattern 1: Minimal-Diff Patch Preservation

**What:** When resolving a conflict in a fork-patched file, retain the fork's exact function/variable names and logic. Take upstream's surrounding new content. Do not rename fork variables to match upstream names.

**When to use:** All 3 high-risk files.

**Example — correct resolution for worker isNewer:**
```javascript
// Source: thamw-main fork (VERIFIED: codebase read)
// CORRECT — fork's SHA equality semantics preserved
function isNewer(latest, installed) {
  return !!latest && latest.slice(0, 7) !== installed;
}
// API call must use thamwangjun's GitHub repo, NOT npm registry
https.get('https://api.github.com/repos/thamwangjun/get-shit-done/commits/thamw-main', ...)
```

```javascript
// Source: upstream/main (VERIFIED: git show upstream/main:hooks/gsd-check-update-worker.js)
// WRONG if taken verbatim — uses npm semver comparison and npm registry
function isNewer(a, b) { /* semver logic */ }
execFileSync('npm', ['view', 'get-shit-done-cc', 'version'], ...)
```

**Example — correct resolution for install.js version block:**
```javascript
// Source: thamw-main fork (VERIFIED: codebase read, lines 58-73)
// CORRECT — fork's SHA-based version detection preserved
let gsdVersion = 'no-network';
try {
  const { execSync } = require('child_process');
  const sha = execSync('git rev-parse --short=7 HEAD', { ... }).trim();
  if (/^[0-9a-f]{7}$/.test(sha)) { gsdVersion = sha; }
} catch (e) {}
```

**Example — correct resolution for agent-frontmatter test:**
```javascript
// Source: thamw-main fork (VERIFIED: codebase read, line 39)
// CORRECT — positive framing assertion
assert.ok(/only use the write tool/i.test(content), ...)

// Source: upstream/main (VERIFIED: git show upstream/main:tests/agent-frontmatter.test.cjs)
// WRONG if taken verbatim — prohibition-form assertion
assert.ok(content.includes("never use `Bash(cat << 'EOF')` or heredoc"), ...)
```

### Anti-Patterns to Avoid

- **Silent auto-resolution acceptance:** Never trust git's automatic merge result on the 3 high-risk files without grep-verifying the 4 success criteria. Git may silently choose upstream's version.
- **Running tests before grep verification:** The grep checks are faster and more targeted than the test suite. Always grep-verify the 3 patches before running `npm test` — a failed grep tells you exactly which file to re-fix.
- **Treating unexpected conflicts as low-risk:** Any conflict file could contain fork-specific logic added after the common ancestor. Check each unexpected conflict file for the keywords: `thamwangjun`, `ensureHooksDist`, `only use the write tool`, `isNewer`, `spawnSync`.
- **Deferring unexpected conflicts:** D-01 prohibits this. All conflicts must be resolved in Phase 7.

---

## Solved Problems

| Problem | Use Instead | Why |
|---------|-------------|-----|
| Verifying patch survival | `grep` shell commands (4 specified in success criteria) | Faster and more targeted than reading entire files |
| Finding all conflict files | `git diff --name-only --diff-filter=U` | Authoritative — catches large files that manual inspection misses |
| Verifying no stray conflict markers | `grep -r "<<<<<<\|=======\|>>>>>>>" agents/ commands/ get-shit-done/ hooks/ bin/ tests/` | Catches missed markers across all resolved files |
| Running tests with proper isolation | `npm test` (delegates to `scripts/run-tests.cjs`) | run-tests.cjs serializes `bug-1924-ensure-hooks-dist-on-demand.test.cjs` to avoid hooks/dist/ race conditions |

---

## Conflict File Analysis

### File 1: `hooks/gsd-check-update-worker.js` (MERGE-02)

**Risk level:** CRITICAL — upstream rewrites the entire update-check mechanism

**Fork patch (must survive):**
- Uses `https.get` against `https://api.github.com/repos/thamwangjun/get-shit-done/commits/thamw-main`
- `isNewer(latest, installed)` returns `!!latest && latest.slice(0, 7) !== installed` (SHA equality, not semver)
- `installed` initialized to `'unknown'` (not `'0.0.0'`)
- `projectVersionFile` and `globalVersionFile` default to `''` (not `undefined`)
- Stale hook comparison uses `norm()` function with 7-char prefix normalization
- `MANAGED_HOOKS` array does NOT include `'gsd-read-injection-scanner.js'`
- `writeResult()` function pattern (async, callback-based)

**Upstream version (must NOT overwrite fork):**
- Uses `execFileSync('npm', ['view', 'get-shit-done-cc', 'version'], ...)` — npm registry
- `isNewer(a, b)` uses semver comparison with split('.') and Number()
- `installed` initialized to `'0.0.0'`
- Stale hook comparison: `isNewer(installed, hookVersion)` (reversed args, different semantics)
- `MANAGED_HOOKS` includes `'gsd-read-injection-scanner.js'`
- Synchronous result write (no writeResult function)

**Resolution approach:** The fork's version is almost entirely different from upstream. The 2 files are not just structurally different — they embody different architectures. Take the fork's version as-is. The fork already incorporates all the correct hook-version logic (including the `norm()` normalization from #1750). Check the upstream diff for any new entries in `MANAGED_HOOKS` that may need to be added to the fork's list (upstream added `gsd-read-injection-scanner.js` — evaluate whether to include it in the fork's managed hooks list).

[VERIFIED: git diff upstream/main thamw-main -- hooks/gsd-check-update-worker.js]

### File 2: `bin/install.js` (MERGE-03)

**Risk level:** CRITICAL — 29 conflict hunks across a 6700+ line file

**Fork patch locations (must survive, verified by grep):**
- Lines 58-73: `gsdVersion` block using `git rev-parse --short=7 HEAD`
- Lines 93: `hasPortableHooks` line is ABSENT from fork (the fork intentionally removed this)
- Lines 207-237: `ensureHooksDist(src)` function definition
- Line 445: Banner uses `gsdVersion` not `pkg.version`
- Line 5779: `ensureHooksDist(src)` call site (before `if (!isCodex...)` block)

**Upstream additions (should be preserved where not conflicting):**
- `hasPortableHooks` feature (line 93 removed by fork, but upstream depends on it in `buildHookCommand` and `finishInstall`)
- Portable hooks path logic in `buildHookCommand` (lines ~502-534 in upstream)
- New runtime support additions
- Many new helper lines throughout the 6778-line file

**Critical conflict: `hasPortableHooks` removal.** The fork removed this flag because it was not part of the fork's scope (prompt content only, not CLI functionality). However, upstream v1.37.1 added substantial new functionality that depends on `hasPortableHooks`. The resolution approach per D-05 is: non-fork-patched content → take upstream's version. This means `hasPortableHooks`, the portable hooks path logic in `buildHookCommand`, and all related code should be restored from upstream. The fork's patches (gsdVersion, ensureHooksDist, the ensureHooksDist call site) must be layered on top of upstream's new content.

**Resolution approach:** Start with the upstream version of `bin/install.js`. Apply the 5 fork patch locations on top. This is safer than starting with the fork's version and adding 29 hunks of upstream changes.

[VERIFIED: git diff upstream/main thamw-main -- bin/install.js; git diff hunk count: 29]

### File 3: `tests/agent-frontmatter.test.cjs` (MERGE-04)

**Risk level:** MEDIUM — small diff, specific assertion strings

**Fork patch (must survive):**
```javascript
// lines 38-40 (VERIFIED: codebase read)
assert.ok(
  /only use the write tool/i.test(content),
  `${agent} missing 'Only use the Write tool' instruction`
);
```

**Fork patch part 2 (line 52 skip-line guard):**
```javascript
// CORRECT — fork's version (does NOT include 'never use' in skip condition)
if (line.includes('NEVER') || line.trim().startsWith('```')) continue;
```

**Upstream version (must NOT overwrite):**
```javascript
// upstream's version
assert.ok(
  content.includes("never use `Bash(cat << 'EOF')` or heredoc"),
  `${agent} missing anti-heredoc instruction`
);
// AND includes 'never use' in the skip condition:
if (line.includes('never use') || line.includes('NEVER') || line.trim().startsWith('```')) continue;
```

**Resolution approach:** Take upstream's file structure, swap in the 2 fork assertions. This is a 6-line diff with no structural complexity.

[VERIFIED: git diff upstream/main thamw-main -- tests/agent-frontmatter.test.cjs]

---

## Likely Unexpected Conflicts

These files have substantive divergence and may conflict during merge. Check with `git diff --name-only --diff-filter=U` after the merge runs — these are predictions, not guarantees.

### `hooks/gsd-check-update.js`

Fork removed the inline comment block from `buildHookCommand` call (3 lines). Upstream added new comment explaining portable hooks. Minor conflict, take upstream comment additions.

[VERIFIED: git diff upstream/main thamw-main -- hooks/gsd-check-update.js]

### `hooks/gsd-statusline.js`

Fork reverted upstream's CLAUDE_CODE_AUTO_COMPACT_WINDOW dynamic calculation (#2219) back to the hardcoded 16.5% buffer constant. Upstream keeps the dynamic calculation. This is a substantive logic conflict.

**Fork's position:** `const AUTO_COMPACT_BUFFER_PCT = 16.5;`
**Upstream's position:** Dynamic `acw`-based calculation.

Resolution per D-05: The statusline is not fork-patched content (it's runtime code, not prompt content). Take upstream's version of the statusline logic.

[VERIFIED: git diff upstream/main thamw-main -- hooks/gsd-statusline.js]

### `scripts/run-tests.cjs`

Fork added SERIAL_FILES isolation for `bug-1924-ensure-hooks-dist-on-demand.test.cjs`. Upstream uses the original simple runner. This is an additive fork change on top of a file upstream has not changed. Git will likely auto-merge this cleanly since upstream did not modify `scripts/run-tests.cjs` — but verify after merge.

[VERIFIED: git show upstream/main:scripts/run-tests.cjs; git diff upstream/main thamw-main -- scripts/run-tests.cjs]

### `tests/semver-compare.test.cjs`

Fork rewrote this test for SHA equality semantics (139 lines). Upstream keeps the original semver semantics (81 lines). These are fundamentally different tests testing different behaviors. The fork's version tests the worker's SHA equality `isNewer`. Upstream's version tests the npm semver `isNewer`. Since the fork's worker uses SHA equality (MERGE-02 requirement), the fork's version of `semver-compare.test.cjs` is correct. Take fork's version if this conflicts.

[VERIFIED: comparison of both file contents]

---

## Common Pitfalls

### Pitfall 1: Grep Verification Skipped After Resolution

**What goes wrong:** Developer resolves conflicts, runs `npm test`, some tests fail. Developer edits test files to fix failures without noticing that a fork patch in a non-test file was silently clobbered by upstream's auto-resolution.

**Root cause:** The test suite is 3945 tests. A single corrupted function in gsd-check-update-worker.js does not cause an immediately obvious test failure — it causes update detection to silently regress.

**Prevention:** Immediately after resolving all conflicts and before running `npm test`, run all 4 grep success criteria:
```bash
git log --oneline upstream/main ^thamw-main | wc -l  # should be 0 after commit
grep thamwangjun hooks/gsd-check-update-worker.js
grep ensureHooksDist bin/install.js
grep -i "only use" tests/agent-frontmatter.test.cjs
```

**Warning signs:** Any grep returning no output after the merge commit.

### Pitfall 2: Taking Upstream bin/install.js Wholesale

**What goes wrong:** Conflict resolver runs `git checkout --theirs bin/install.js` on the largest file to avoid manual resolution. The fork's `gsdVersion` block, `ensureHooksDist` function, and call site are all lost. `npm test` still passes (the bugs are runtime, not test-caught) and downstream phases ship a broken installer.

**Root cause:** `git checkout --theirs` discards all fork patches in one command.

**Prevention:** Never use `git checkout --theirs` on any of the 3 high-risk files. Always manually reconstruct the resolved file by starting from one branch's version and applying the other's additions.

**Warning signs:** `grep ensureHooksDist bin/install.js` returns nothing.

### Pitfall 3: MANAGED_HOOKS Array Divergence

**What goes wrong:** Fork's `gsd-check-update-worker.js` has `MANAGED_HOOKS` without `gsd-read-injection-scanner.js`. Upstream added it. If the fork takes its own version wholesale, users with the upstream's `gsd-read-injection-scanner.js` installed will never see stale-hook warnings for it.

**Root cause:** Upstream added a new hook (`gsd-read-injection-scanner.js`) to the managed set. The fork removed it because it was already tracking a pre-hook-scanner version of the file.

**Prevention:** When resolving the worker, evaluate whether `gsd-read-injection-scanner.js` belongs in the fork's `MANAGED_HOOKS`. Check: `ls hooks/dist/ | grep injection`. If the file ships in the fork's hooks/dist/, add it to MANAGED_HOOKS.

**Warning signs:** `ls hooks/dist/ | grep injection` returns a file but `grep injection hooks/gsd-check-update-worker.js` returns nothing.

### Pitfall 4: Test Failure Misclassification (D-07 Boundary)

**What goes wrong:** After the merge, `tests/execute-phase-wave.test.cjs` fails because it asserts for strings that upstream's workflow file changed. Developer fixes the test in Phase 7. But the correct action is to fix the workflow file (which is a fork standards issue for Phase 9).

**Root cause:** The failure appears to be a test string mismatch — but the root cause is that upstream changed `get-shit-done/workflows/execute-phase.md` to use different strings than the fork requires.

**Prevention:** For each failing test in Plan 07-02, check whether the failure is caused by (a) a conflict-resolution corruption in a fork-specific file (fix in Phase 7) or (b) a new upstream file that doesn't yet meet fork standards (defer to Phase 10). The key question: was this test passing before the merge with the fork's current code?

**Warning signs:** A test that asserts for fork-specific content fails, but the asserted content is present in the fork's file — meaning the test is now failing because a different file (the subject file) was overwritten during merge.

---

## Code Examples

### Merge Execution Sequence

```bash
# Source: v1.36.0 merge precedent + canonical playbook plans/XX-MERGE_UPSTREAM_CONFLICTS_V01.md
# [VERIFIED: codebase read]

# Step 1: Verify upstream commit count before merge
git log --oneline upstream/main ^thamw-main | wc -l
# Expected: ~55 (recount at merge time in case upstream has pushed new commits)

# Step 2: Execute the merge
git merge upstream/main
# Git will stop at conflicts and list conflicted files

# Step 3: Get authoritative list of all conflict files
git diff --name-only --diff-filter=U | grep -v "package-lock.json"

# Step 4: Resolve each conflict file manually (no git checkout --theirs on high-risk files)

# Step 5: Stage resolved files
git add hooks/gsd-check-update-worker.js bin/install.js tests/agent-frontmatter.test.cjs
# (plus any other resolved files)

# Step 6: Grep-verify all 4 success criteria BEFORE committing
grep thamwangjun hooks/gsd-check-update-worker.js
grep ensureHooksDist bin/install.js
grep -i "only use" tests/agent-frontmatter.test.cjs
# All 3 must return matches

# Step 7: Verify no stray conflict markers
grep -r "<<<<<<\|=======\|>>>>>>>" agents/ commands/gsd/ get-shit-done/ hooks/ bin/ tests/
# Expected: no output

# Step 8: Commit
git commit -m "chore: merge upstream v1.37.1 (55 commits, 3 conflict files resolved)"
# Adjust conflict file count if unexpected conflicts were found

# Step 9: Verify MERGE-01 success criterion
git log --oneline upstream/main ^thamw-main | wc -l
# Expected: 0
```

### Post-Merge Test Run (Plan 07-02)

```bash
# Source: PROJECT.md + scripts/run-tests.cjs
# [VERIFIED: codebase read]

npm test
# Captures all failures as baseline for Phase 10
# Fork-specific tests that fail must be fixed before Phase 7 closes

# Fork-specific tests that MUST pass after Phase 7:
# - tests/agent-frontmatter.test.cjs  (135 tests — verifies MERGE-04)
# - tests/negative-framing-scan.test.cjs  (fork-added, verifies positive framing standard)
# - tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs  (8 tests — verifies MERGE-03 runtime)
# - tests/execute-phase-wave.test.cjs  (verifies fork workflow strings)
# - tests/ios-scaffold-safety.test.cjs  (verifies fork reference file)
# - tests/version-detection.test.cjs  (verifies fork's SHA-based version detection)
# - tests/semver-compare.test.cjs  (verifies fork's SHA isNewer semantics)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| npm semver check in worker | SHA equality check against GitHub API | v1.36.0.a milestone | Upstream's worker still uses semver; must preserve fork's SHA approach in MERGE-02 |
| `pkg.version` for installer banner | `gsdVersion` (7-char git SHA) | v1.36.0.a milestone | Upstream still uses `pkg.version`; must preserve fork's `gsdVersion` in MERGE-03 |
| Prohibition-form anti-heredoc assertion | Positive-framing assertion (`/only use the write tool/i`) | v1.36.0 Phase 3 | Upstream still uses prohibition form; must preserve fork's assertion in MERGE-04 |
| No on-demand hooks build | `ensureHooksDist(src)` called before copy loop | v1.36.0.b milestone | Fork-only patch; upstream never added this; present only in fork's `bin/install.js` |

**Active in this merge (upstream v1.37.1 additions):**
- `gsd-read-injection-scanner.js` hook added to MANAGED_HOOKS in upstream worker (decision: evaluate for inclusion in fork's managed set)
- `--portable-hooks` flag and `buildHookCommand` portable path logic added in upstream installer (decision: take upstream version per D-05)
- 16 new test files added by upstream (auto-added by merge; listed in research section below)
- Dynamic `CLAUDE_CODE_AUTO_COMPACT_WINDOW` calculation in statusline (upstream; take upstream per D-05)

---

## New Test Files Added by Upstream (auto-added during merge)

These 16 files will be added to `tests/` automatically by the merge. They require no action in Phase 7 but may fail (contributing to the Phase 10 baseline):

[VERIFIED: comm comparison of upstream vs fork test file lists]

1. `tests/agent-size-budget.test.cjs` — enforces size budget on agents (fork agents must pass; research confirms all 31 fork agents currently pass)
2. `tests/architecture-counts.test.cjs` — guards ARCHITECTURE.md component count drift
3. `tests/autonomous-decomposition.test.cjs` — new in v1.37.1
4. `tests/bug-2248-local-install-statusline.test.cjs`
5. `tests/bug-2268-parallel-discuss.test.cjs`
6. `tests/bug-2334-quick-gsd-sdk-preflight.test.cjs`
7. `tests/bug-2344-read-guard-claudecode-env.test.cjs`
8. `tests/bug-2346-agent-read-loop-guards.test.cjs`
9. `tests/bug-2351-intel-kilo-layout.test.cjs`
10. `tests/command-count-sync.test.cjs` — validates ARCHITECTURE.md command count matches actual .md files (will fail until Phase 8 adds 6 new commands to ARCHITECTURE.md)
11. `tests/discuss-all-flag.test.cjs`
12. `tests/helpers.cjs` — shared test helper (not a test file itself)
13. `tests/init-manager-deps.test.cjs`
14. `tests/progress-forensic.test.cjs`
15. `tests/prune-orphaned-worktrees.test.cjs`
16. `tests/read-injection-scanner.test.cjs`

**Phase 7 scope for new tests:** Do not fix failures caused by upstream content not yet meeting fork standards (e.g., `command-count-sync.test.cjs` will fail because Phase 8 hasn't added the 6 new commands yet). Document all such failures in the Plan 07-02 baseline list.

---

## Fork-Only Test Files (must NOT be lost during merge)

These 3 files exist in the fork but not in upstream. Git will preserve them automatically (no conflict possible), but verify they are present after the merge:

[VERIFIED: comm comparison]

1. `tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs` — 8 tests for `ensureHooksDist` on-demand build
2. `tests/negative-framing-scan.test.cjs` — 487-line scanner for fork's positive framing standard
3. `tests/version-detection.test.cjs` — 64-line test for fork's SHA-based version detection

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| git | `git merge upstream/main` | ✓ | system | — |
| Node.js | `npm test`, `scripts/run-tests.cjs` | ✓ | system | — |
| npm | `npm test` | ✓ | system | `node scripts/run-tests.cjs` directly |
| upstream/main remote | `git merge upstream/main` | ✓ | `https://github.com/gsd-build/get-shit-done.git` | — |

[VERIFIED: git remote -v; npm test runs successfully pre-merge (3945/3945 pass)]

**Pre-merge baseline:** 3945 tests, 3945 pass, 0 fail. [VERIFIED: npm test output]

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (no jest/mocha/vitest) |
| Config file | `scripts/run-tests.cjs` (custom orchestrator) |
| Quick run command | `node --test tests/agent-frontmatter.test.cjs tests/negative-framing-scan.test.cjs tests/semver-compare.test.cjs` |
| Full suite command | `npm test` |

[VERIFIED: package.json `"test": "node scripts/run-tests.cjs"`, scripts/run-tests.cjs]

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MERGE-01 | All 55 upstream commits reachable from thamw-main | git check | `git log --oneline upstream/main ^thamw-main \| wc -l` (expect 0) | n/a — git command |
| MERGE-02 | thamwangjun URL present in worker | grep | `grep thamwangjun hooks/gsd-check-update-worker.js` | n/a — grep command |
| MERGE-03 | ensureHooksDist function present in installer | grep + unit | `grep ensureHooksDist bin/install.js` + `node --test tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs` | yes — test file exists |
| MERGE-04 | positive-framing assertion present in test | grep + unit | `grep -i "only use" tests/agent-frontmatter.test.cjs` + `node --test tests/agent-frontmatter.test.cjs` | yes — test file exists |

### Sampling Rate

- **Per conflict file resolved:** Run the relevant grep check immediately
- **After all conflicts staged:** Run all 4 grep checks before committing
- **Plan 07-01 gate:** All 4 grep checks pass + `git log --oneline upstream/main ^thamw-main` returns 0
- **Plan 07-02:** `npm test` full suite — capture output, triage failures by D-07 rule

### Wave 0 Gaps

None — existing test infrastructure covers all phase requirements. No new test files or framework setup needed for Phase 7.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `gsd-read-injection-scanner.js` in fork's hooks/dist/ should be evaluated for inclusion in MANAGED_HOOKS | Pitfall 3 | If absent from MANAGED_HOOKS but present in installed hooks, users never get stale-hook warnings — LOW risk since it's a monitoring feature, not core functionality |
| A2 | The portable-hooks feature (`hasPortableHooks`, `buildHookCommand` with `opts.portableHooks`) should be restored from upstream in bin/install.js | File 2 conflict analysis | If the fork intentionally removed it (not just a byproduct of minimal-diff patching), restoring it would re-introduce removed functionality. Check git log on thamw-main for the commit that removed it before restoring. |

---

## Open Questions

1. **Was `hasPortableHooks` intentionally removed from the fork or accidentally excluded?**
   - What we know: The fork's `bin/install.js` does not have `hasPortableHooks` or the portable-hooks path logic. Upstream added this feature in commit `62261a3 fix: add --portable-hooks flag for WSL/Docker $HOME-relative settings.json paths`.
   - What is unclear: Whether the fork explicitly decided to not carry this feature, or whether the fork's patching simply predated this feature and it was never added.
   - Recommendation: Check `git log thamw-main --oneline -- bin/install.js` for any commit that explicitly mentions removing `--portable-hooks`. If no such commit exists, the omission is a byproduct of patching order and the feature should be included via the upstream resolution (D-05 default: take upstream for non-fork-patched content).

2. **Will `tests/command-count-sync.test.cjs` fail immediately after merge?**
   - What we know: This new upstream test validates that `docs/ARCHITECTURE.md` command count matches the actual `.md` file count in `commands/gsd/`. Upstream added 6 new commands in v1.37.1. Phase 8 (CATALOGUE Sync) adds these 6 commands to ARCHITECTURE.md.
   - What is unclear: Whether the test will fail on the post-merge count before Phase 8 runs.
   - Recommendation: Document this as an expected Phase 10 failure in the Plan 07-02 baseline list. Do not fix it in Phase 7 — it is Phase 8 scope (CAT-06).

---

## Sources

### Primary (HIGH confidence)

- Codebase direct reads: `hooks/gsd-check-update-worker.js`, `bin/install.js` (targeted reads), `tests/agent-frontmatter.test.cjs`, `scripts/run-tests.cjs` — file contents verified
- Git diff commands: `git diff upstream/main thamw-main -- [file]` — exact patch contents verified
- `git log --oneline upstream/main ^thamw-main` — 55 commits confirmed as of 2026-04-17
- `npm test` output — pre-merge baseline 3945/3945 confirmed
- `.planning/phases/07-merge-and-conflict-resolution/07-CONTEXT.md` — locked decisions
- `.planning/PROJECT.md` — key decisions table
- `.planning/REQUIREMENTS.md` — MERGE-01 through MERGE-04
- `plans/XX-MERGE_UPSTREAM_CONFLICTS_V01.md` — canonical conflict resolution playbook

### Secondary (MEDIUM confidence)

- `.planning/milestones/v1.36.0-phases/` — prior merge precedent for v1.36.0 (referenced by CONTEXT.md)
- `git show upstream/main:tests/agent-frontmatter.test.cjs` — upstream's test version verified
- `git show upstream/main:hooks/gsd-check-update-worker.js` — upstream's worker version verified

### Flagged for Validation (LOW confidence)

- Assessment that `hasPortableHooks` removal was unintentional (A2 above) — inferred from absence of explicit removal commit in git log; not confirmed by git log inspection

---

## Metadata

**Confidence breakdown:**
- Conflict file analysis: HIGH — both sides of every conflict verified by direct file read and git diff
- Fork patch locations: HIGH — verified by grep with line number context
- Unexpected conflict predictions: MEDIUM — based on git diff analysis; actual conflicts determined only after `git merge` runs
- New test file list: HIGH — verified by comm comparison of upstream tree vs fork local files
- Pre-merge test baseline: HIGH — verified by running `npm test`

**Research date:** 2026-04-17
**Valid until:** 2026-05-17 (stable domain — git merge conflict resolution patterns do not change; upstream commit count is accurate as of research date and must be rechecked with `git log --oneline upstream/main ^thamw-main | wc -l` at merge time)
