# Phase 39: Stage and Commit Tests & SDK Validation - Research

**Researched:** 2026-05-22
**Domain:** Git staging/commit automation with subset verification
**Confidence:** HIGH

## Summary

Phase 39 is the fourth of five batch staging phases in a sequential git history refactoring workflow. It stages and commits 22 files: 20 test files (`tests/*.test.cjs`) modified since tag `v1.41.2`, the test runner (`scripts/run-tests.cjs`), and the SDK CLI entry point (`sdk/src/cli.ts`). Staging is automated via a new `scripts/stage-batch-4.cjs` script that follows the established batch pattern from Phases 36-38. The script remains untracked (committed later in Batch 5).

The implementation is a straightforward adaptation of the existing batch staging pattern with one key difference from previous batches: test files are discovered via dynamic filesystem scan (`tests/*.test.cjs` glob) rather than a hardcoded manifest, while `sdk/src/cli.ts` remains hardcoded per D-04. All other patterns — branch guard, auto-unstage, duplicate commit detection, subset verification, missing-file abort, silent skip — are identical to batches 2 and 3.

**Primary recommendation:** Create `scripts/stage-batch-4.cjs` by adapting the Batch 2 pattern template. Use dynamic scanning for `tests/*.test.cjs` (similar to Batch 1's `.planning/references/` scan) plus hardcoded entries for `scripts/run-tests.cjs` and `sdk/src/cli.ts`. Commit message: `test: refactor core tests and SDK validation (Batch 4)`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| File discovery (test files) | Filesystem (Node.js fs) | -- | Dynamic `fs.readdirSync` on `tests/` matching `*.test.cjs` |
| Change detection | Git CLI | -- | `git diff --quiet v1.41.2 -- <file>` determines if a file has diverged from baseline |
| Staging | Git CLI | -- | `git add -f <file>` stages files; `git reset` clears pre-existing staged state |
| Subset verification | Script logic | Git CLI | `git diff --cached --name-only` lists staged files; script validates they are subset of expected set |
| Commit creation | Git CLI | -- | `git commit -m "test: refactor core tests and SDK validation (Batch 4)"` |
| Branch safety | Script logic | -- | `git rev-parse --abbrev-ref HEAD` checked against `thamw-main`; overridable via `ALLOW_ANY_BRANCH=1` |
| Duplicate prevention | Script logic | Git CLI | `git log -n 1 --pretty=format:%s` compared to expected commit message |

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Create `scripts/stage-batch-4.cjs` mirroring the batches 1-3 pattern: Node.js script using `execFileSync` for git commands, active branch guard, auto-unstage before staging, duplicate commit detection, subset verification, and missing-file abort.
- **D-02:** The script stays untracked in the workspace as a development artifact (staged and committed later in Batch 5).
- **D-03:** Stage only files matching `tests/*.test.cjs` — 20 test files currently modified since v1.41.2. Test infrastructure files (`tests/helpers.cjs`, vitest configs) are NOT included unless they match the `.test.cjs` pattern.
- **D-04:** SDK scope is strictly `sdk/src/cli.ts` only — hardcoded, no dynamic scan of the `sdk/` directory.
- **D-05:** `scripts/run-tests.cjs` is included in Batch 4 (test runner groups with test files). `scripts/gen-inventory-manifest.cjs` is explicitly excluded — it belongs in Batch 5 (maintenance/utility).
- **D-06:** Commit message: `test: refactor core tests and SDK validation (Batch 4)`.
- **D-07:** Active branch guard — abort if current branch is not `thamw-main`, unless overridden via `ALLOW_ANY_BRANCH=1`.
- **D-08:** Auto-unstage — run `git reset` before staging to clear any pre-existing staged changes.
- **D-09:** Duplicate commit detection — check latest commit message; if it already matches the Batch 4 commit message, exit 0 early.
- **D-10:** Subset verification — verify all staged files are a subset of the expected file list. Any unauthorized files cause immediate abort and index reset.
- **D-11:** Missing-file abort — if any target file is completely missing from disk, fail the staging process.
- **D-12:** Silent skip — if a target file exists but has no changes since v1.41.2, skip it silently.

### Claude's Discretion

None specified. Follow the established `scripts/stage-batch-N.cjs` pattern from batches 1-3.

### Deferred Ideas (OUT OF SCOPE)

- `scripts/gen-inventory-manifest.cjs` — modified but belongs in Batch 5 (maintenance/utility scripts), not Batch 4 (tests).

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STAGE-04 | Stage and commit Batch 4: Core unit and integration tests and validation runner (`tests/*.test.cjs`, `scripts/run-tests.cjs`) | Verified: 20 test files changed since v1.41.2, all present on disk. `scripts/run-tests.cjs` and `sdk/src/cli.ts` also modified. Batch staging pattern from scripts/stage-batch-{1,2,3}.cjs is fully characterized. No test infrastructure files (helpers.cjs, vitest configs) are changed since v1.41.2 — D-03 exclusion is safe. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js (built-in) | 24.14.1 [VERIFIED: `node --version`] | Script runtime | Only runtime available; no external packages needed |
| `child_process.execFileSync` | built-in | Synchronous git command execution | Used by all 3 existing batch scripts; zero-dependency pattern |
| `fs` (readdirSync, existsSync) | built-in | Directory scanning, file existence checks | Used by Batch 1 for `.planning/references/` scan |
| `path` (join) | built-in | Path resolution | Used by all existing batch scripts |
| Git CLI | 2.54.0 [VERIFIED: `git --version`] | All git operations | Only interface to git; executed via `execFileSync` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `process.exit` | built-in | Exit with code 0 (success) or 1 (failure) | All error paths and early-exit conditions |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `execFileSync` | `execSync` | `execFileSync` is safer (no shell injection); used consistently by batches 1-3 |
| Dynamic scan of `sdk/` | Hardcoded `sdk/src/cli.ts` | D-04 locks scope to single file; hardcoded is safer and matches batch 2-3 pattern |

**Installation:** No external packages required. The script uses only Node.js built-in modules and the git CLI.

## Architecture Patterns

### System Architecture Diagram

```
Entry Point: node scripts/stage-batch-4.cjs
                    |
                    v
          +-------------------+
          | Branch Guard      |
          | (D-07)            |---> ALLOW_ANY_BRANCH=1? --> bypass
          +-------------------+
                    | branch == thamw-main?
                    v
          +-------------------+
          | Duplicate Check   |
          | (D-09)            |---> latest commit == Batch 4 msg? --> exit 0
          +-------------------+
                    | new commit needed
                    v
          +-------------------+
          | Build Expected Set|
          | (D-03, D-04, D-05)|---> dynamic scan tests/*.test.cjs
          +-------------------+     + scripts/run-tests.cjs
                    |               + sdk/src/cli.ts
                    v
          +-------------------+
          | Missing-File Check|
          | (D-11)            |---> any expected file missing? --> exit 1
          +-------------------+
                    | all present
                    v
          +-------------------+
          | Git Reset         |
          | (D-08)            |---> clear pre-existing staged state
          +-------------------+
                    |
                    v
          +-------------------+
          | Per-File Iteration|
          | (D-12)            |---> for each expected file:
          +-------------------+       - unchanged since v1.41.2? --> silent skip
                    |                 - changed? --> git add -f <file>
                    v
          +-------------------+
          | Subset Verification|
          | (D-10)            |---> staged files not in expected set? --> reset + exit 1
          +-------------------+
                    | all staged files valid subset
                    v
          +-------------------+
          | Empty Stage Guard |---> no files staged? --> exit 0
          +-------------------+
                    | files staged
                    v
          +-------------------+
          | Git Commit (D-06) |---> "test: refactor core tests and SDK validation (Batch 4)"
          +-------------------+
                    |
                    v
                 exit 0
```

**Data flow:** Filesystem scan --> expected Set --> git diff baseline check --> git add --> git diff --cached verification --> git commit

### Recommended Project Structure

No new directory structure. The only new artifact is:
```
scripts/
└── stage-batch-4.cjs    # NEW: Batch 4 staging automation (untracked per D-02)
```

### Pattern 1: Batch Staging Script (10-Step Structure)

**What:** A self-contained Node.js CommonJS script that stages files based on an expected set, validates the staging index, and commits. All 3 existing batch scripts follow this exact structure.

**When to use:** Any batch staging operation in this refactoring milestone.

**Example (canonical 10-step flow from batches 1-3):**
```
1. Build expected file Set (dynamic scan + hardcoded entries)
2. Check duplicate commit (latest commit message comparison)
3. Perform file existence check on all expected files (abort on missing)
4. Run `git reset` (clear pre-existing staged state)
5. Iterate expected files: check `hasChangesSinceV1_41_2()`, `git add -f` if changed
6. Run `git diff --cached --name-only` to get staged file list
7. Subset verification: all staged files must be in expected Set
8. If unauthorized files found: log, reset, exit 1
9. If no files staged: log, exit 0
10. `git commit -m "<message>"`
```

**Key difference from batches 1-3:** This is the first batch that combines dynamic scanning (for `tests/*.test.cjs`) with hardcoded entries (`scripts/run-tests.cjs`, `sdk/src/cli.ts`). Batch 1 used pure dynamic scanning (`.planning/references/*.md`). Batches 2 and 3 used pure hardcoded lists.

### Pattern 2: `hasChangesSinceV1_41_2()` Helper

**What:** A function that determines whether a file in the working tree has diverged from its state at tag `v1.41.2`. Uses two-phase check: (1) does the file exist at v1.41.2? (2) if yes, is `git diff --quiet v1.41.2 -- <file>` non-zero?

**When to use:** Every file in the expected set must be checked against v1.41.2 before staging.

**Behavior matrix:**
| File exists on disk? | File exists at v1.41.2? | git diff --quiet result | Return |
|---------------------|------------------------|------------------------|--------|
| No | -- | -- | `false` |
| Yes | No | -- | `true` (new file since v1.41.2) |
| Yes | Yes | exit 0 (identical) | `false` (no changes) |
| Yes | Yes | exit 1 (different) | `true` (modified) |

Source: Identical implementation in all three `scripts/stage-batch-{1,2,3}.cjs` [VERIFIED: codebase grep]

### Pattern 3: Subset Verification with Abort-and-Reset

**What:** After staging, `git diff --cached --name-only` lists all staged files. The script compares this list against the expected Set. Any file in the staged list that is NOT in the expected Set triggers an abort: the script logs the unauthorized files, runs `git reset` to clear the index, and exits with code 1.

**When to use:** After every `git add` operation, before committing.

**Rationale:** This is the safety net that prevents accidentally committing files from other batches. If a file from Batch 5 slips into the staging area, the script catches it.

### Anti-Patterns to Avoid

- **Manual staging:** Running `git add tests/*.test.cjs` manually bypasses all safety guards (subset verification, duplicate detection, branch guard). Always use the staging script.
- **Staging `tests/helpers.cjs`:** This file has no changes since v1.41.2 [VERIFIED: `git diff --quiet v1.41.2 -- tests/helpers.cjs` exits 0], but even if it did, it does not match `*.test.cjs` pattern and should not be in Batch 4.
- **Staging vitest configs:** `vitest.config.ts` and `sdk/vitest.config.ts` are infrastructure files, not tests. They are excluded by the `*.test.cjs` pattern and are not part of Batch 4.
- **Dynamic scan of `sdk/`:** D-04 explicitly locks scope to `sdk/src/cli.ts` only. Scanning the entire directory would risk including `sdk/src/query/`, `sdk/src/config.ts`, etc.
- **Skipping subset verification:** Even though the expected set is tightly controlled, git pre-existing staged state or concurrent operations could introduce unexpected files. The verification catches this.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Staging individual files | Custom `git add` wrapper | `git add -f <file>` via `execFileSync` | Established pattern; `-f` ensures `.gitignore` doesn't interfere |
| Change detection | Custom diff logic | `git diff --quiet v1.41.2 -- <file>` | Leverages git's optimized diff engine; matches batches 1-3 exactly |
| Staged file listing | Custom index parser | `git diff --cached --name-only` | Simple, reliable, used by all existing batch scripts |
| File existence at tag | Custom tree walker | `git cat-file -e v1.41.2:<file>` | Lightweight; doesn't require checking out the tag |

**Key insight:** The batch staging pattern relies entirely on git primitives — there is no hand-rolled git logic. Every git interaction is a single `execFileSync` call to a well-known git subcommand. This keeps the scripts auditable and consistent.

## Runtime State Inventory

> This is not a rename/refactor/migration phase. No runtime state inventory is needed — no strings are being renamed, no services are being reconfigured, and no data migrations are required. The phase purely stages and commits already-modified files.

## Common Pitfalls

### Pitfall 1: Test File Count Mismatches Due to Stale Baseline

**What goes wrong:** The researcher counts `tests/*.test.cjs` files with changes since v1.41.2 and gets 20 files. During implementation, the count changes because new quick tasks or upstream merges modified additional test files.

**Why it happens:** The working tree is not frozen — other operations can modify files between research and execution.

**How to avoid:** The staging script uses dynamic scanning (`fs.readdirSync` on `tests/` matching `*.test.cjs`), not a hardcoded list of 20 filenames. This means the script always discovers the current set of modified test files at execution time. The 20-file count in D-03 is descriptive (the current state), not prescriptive (a locked list).

**Warning signs:** `git diff --name-only v1.41.2 -- 'tests/*.test.cjs'` returns a different count than expected.

### Pitfall 2: Pre-existing Staged Files from Prior Work

**What goes wrong:** If files are already in the staging index from a previous operation, `git add -f` for new files silently joins them. The staged set would then contain both Batch 4 files and whatever was staged before — subset verification may or may not catch this.

**Why it happens:** Git's staging index is global, not per-script.

**How to avoid:** D-08 mandates `git reset` at the start of the script. All three existing batch scripts implement this [VERIFIED: codebase grep]. The reset must run before any `git add` operations, not after.

**Warning signs:** `git diff --cached --name-only` shows files before the script starts.

### Pitfall 3: `sdk/src/cli.ts` Missing from TypeScript Compilation Artifacts

**What goes wrong:** If `sdk/src/cli.ts` was a new file created after v1.41.2, the `hasChangesSinceV1_41_2()` helper still correctly returns `true` (the `git cat-file -e v1.41.2:sdk/src/cli.ts` check fails, meaning "new file, definitely has changes").

**Why it happens:** The helper handles both "modified since v1.41.2" and "new since v1.41.2" as the same case: `return true`.

**How to avoid:** The helper is already correct. No special handling needed for new files.

**Verification:** `git diff --name-only v1.41.2 -- sdk/src/cli.ts` returns the file — confirming it either changed or is new. [VERIFIED: working tree check]

### Pitfall 4: Wrong Batch Commit Order

**What goes wrong:** Running Batch 4 before Batch 3 would produce an incorrect git history where test files appear before their corresponding source files.

**Why it happens:** The scripts are independent; nothing enforces sequential execution.

**How to avoid:** The duplicate commit check on Batch 4's script is independent of whether earlier batches exist. However, the Phase 41 zero-diff validation only passes if all 5 batches are committed in order. The planning system enforces sequential phase execution.

**Warning signs:** Attempting to run Batch 4 when Batch 3 commit is not the latest.

## Code Examples

Verified patterns from canonical reference `scripts/stage-batch-1.cjs` [CITED: codebase]:

### hasChangesSinceV1_41_2 Helper (Identical in Batches 1-3)

```javascript
// Source: scripts/stage-batch-1.cjs (identical in batch-2.cjs, batch-3.cjs)
function hasChangesSinceV1_41_2(file, repoRoot) {
  const fullPath = path.join(repoRoot, file);
  if (!fs.existsSync(fullPath)) {
    return false;
  }

  // Check if it exists in v1.41.2
  let existsInV1_41_2 = true;
  try {
    execFileSync('git', ['cat-file', '-e', `v1.41.2:${file}`], { cwd: repoRoot, stdio: 'ignore' });
  } catch (err) {
    existsInV1_41_2 = false;
  }

  if (!existsInV1_41_2) {
    return true; // New file since v1.41.2
  }

  // Check if file differs from v1.41.2
  try {
    execFileSync('git', ['diff', '--quiet', 'v1.41.2', '--', file], { cwd: repoRoot });
    return false;
  } catch (err) {
    return true; // Non-zero exit means differences exist
  }
}
```

### Dynamic Filesystem Scan Pattern (from Batch 1)

```javascript
// Source: scripts/stage-batch-1.cjs (adapted for tests directory)
// Pattern: scan a directory for files matching a pattern, add to expected Set
const testsDir = path.join(repoRoot, 'tests');
if (fs.existsSync(testsDir)) {
  const files = fs.readdirSync(testsDir);
  for (const file of files) {
    if (file.endsWith('.test.cjs')) {
      expectedFiles.add(`tests/${file}`);
    }
  }
}
```

### Full Script Structure (from Batch 2 — branch guard variant)

```javascript
// Source: scripts/stage-batch-2.cjs (canonical for Batch 4 adaptation)
// The 10-step structure with branch guard, existence check, and commit:
//
// 1. repoRoot = path.join(__dirname, '..')
// 2. Branch guard: git rev-parse --abbrev-ref HEAD; if != thamw-main && !ALLOW_ANY_BRANCH, exit 1
// 3. Duplicate check: git log -n 1 --pretty=format:%s; if matches Batch 4, exit 0
// 4. Build expected Set (dynamic + hardcoded)
// 5. Missing-file check: for each expected file, fs.existsSync; if missing, exit 1
// 6. git reset
// 7. For each file: hasChangesSinceV1_41_2 ? git add -f : silent skip
// 8. git diff --cached --name-only
// 9. Subset verification; unauthorized files -> reset + exit 1
// 10. No files? exit 0. Else: git commit -m "test: refactor core tests and SDK validation (Batch 4)"
```

### Git Commands Used

```bash
# Branch guard
git rev-parse --abbrev-ref HEAD

# Duplicate check
git log -n 1 --pretty=format:%s

# Clear staged state
git reset

# Check file existence at tag
git cat-file -e v1.41.2:<file>

# Check file changes since tag
git diff --quiet v1.41.2 -- <file>

# Stage a file (force, bypass .gitignore)
git add -f <file>

# List staged files
git diff --cached --name-only

# Create commit
git commit -m "test: refactor core tests and SDK validation (Batch 4)"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `git add` per file | Automated staging script with subset verification | Phases 36-38 (Batch 1-3) | Eliminates human error in batch staging; safety net catches cross-batch contamination |
| Hardcoded file list (Batch 2,3) | Dynamic scan + hardcoded (Batch 4) | Phase 39 | Adapts to file count changes between research and execution |

**Deprecated/outdated:**
- Manual batch staging is fully superseded by the `scripts/stage-batch-N.cjs` pattern.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | All 20 currently-modified test files will still exist on disk at execution time | File Scope | LOW — the missing-file check (D-11) catches this at runtime and aborts |
| A2 | No new `*.test.cjs` files will be added/modified between research and execution that should be excluded | Common Pitfalls | LOW — if new test files have changes, the dynamic scan correctly includes them; if they should be excluded, they wouldn't have changes since v1.41.2 |
| A3 | `scripts/run-tests.cjs` and `sdk/src/cli.ts` existence matches current state | File Scope | LOW — missing-file check catches this at runtime |

## Open Questions

None. The batch staging pattern is fully specified across D-01 through D-12. All three reference scripts (`stage-batch-1.cjs`, `stage-batch-2.cjs`, `stage-batch-3.cjs`) are available and consistent. The file scope is precisely defined (dynamic `tests/*.test.cjs` + hardcoded `scripts/run-tests.cjs` + `sdk/src/cli.ts`). The commit message is locked.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Script runtime | Yes | 24.14.1 | -- |
| Git CLI | All git operations | Yes | 2.54.0 | -- |
| npm | Test execution (`npm test`) | Yes | bundled with Node | -- |
| `thamw-main` branch | Branch guard (D-07) | Yes | current branch | `ALLOW_ANY_BRANCH=1` |

**Missing dependencies with no fallback:**
- None. All dependencies are available on the target machine.

**Missing dependencies with fallback:**
- None.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in `--test` runner [VERIFIED: package.json scripts.test] |
| Config file | None (Node.js --test needs no config file) |
| Quick run command | `npm test` |
| Full suite command | `npm run test:coverage` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STAGE-04 | Stage script stages only expected files | integration | `node scripts/stage-batch-4.cjs; git diff --cached --name-only` | Wave 0 |
| STAGE-04 | Subset verification rejects unauthorized files | unit (script logic) | Manual: stage an unexpected file, run script, verify abort | Wave 0 |
| STAGE-04 | Branch guard blocks non-thamw-main execution | unit (script logic) | `ALLOW_ANY_BRANCH=0 node scripts/stage-batch-4.cjs` on wrong branch | Wave 0 |
| STAGE-04 | Duplicate commit detection exits cleanly | unit (script logic) | Run script twice; second run exits 0 with "already committed" | Wave 0 |

### Sampling Rate

- **Per task commit:** Not applicable — this is a single-script phase
- **Per wave merge:** `npm test` (full test suite)
- **Phase gate:** Batch 4 commit exists in git log; `git diff --cached` is empty (no unstaged leaks)

### Wave 0 Gaps

- [ ] `scripts/stage-batch-4.cjs` — the staging script itself needs to be created
- [ ] No existing test file for batch staging scripts — verification is manual (run script, inspect git log, verify staged files). This follows the pattern of batches 1-3 where staging scripts are tested by execution, not by unit tests.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | No | -- |
| V3 Session Management | No | -- |
| V4 Access Control | No | -- |
| V5 Input Validation | Yes | The staging script validates: (1) branch name before execution, (2) file existence on disk, (3) staged files are subset of expected set. All input paths are constrained by the script logic. |
| V6 Cryptography | No | -- |

### Known Threat Patterns for Batch Staging

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Staging files from wrong batch | Spoofing | Subset verification catches unauthorized files; `git reset` aborts |
| Committing on wrong branch | Tampering | Branch guard (D-07) prevents execution on non-thamw-main branches |
| Double-commit of same batch | Tampering | Duplicate commit detection (D-09) checks latest commit message |
| Missing files not detected | Denial of Service | Missing-file abort (D-11) validates all expected files exist on disk |
| Shell injection via filename | Elevation of Privilege | `execFileSync` with argument array (not string interpolation) prevents injection |

## Sources

### Primary (HIGH confidence)
- `scripts/stage-batch-1.cjs` — Canonical batch staging pattern; `hasChangesSinceV1_41_2` helper, dynamic directory scan, subset verification [CITED: codebase]
- `scripts/stage-batch-2.cjs` — Batch staging with branch guard, existence check, hardcoded file list [CITED: codebase]
- `scripts/stage-batch-3.cjs` — Batch staging with large hardcoded file list (61 files) [CITED: codebase]
- `.planning/phases/39-stage-and-commit-tests-sdk-validation/39-CONTEXT.md` — All locked decisions D-01 through D-12 [CITED: codebase]
- `.planning/REQUIREMENTS.md` — STAGE-04 requirement definition [CITED: codebase]
- `package.json` — Test command verification [CITED: codebase]
- Git CLI (`git diff --name-only v1.41.2 -- 'tests/*.test.cjs'`) — Verified exact file list of 20 test files [VERIFIED: working tree]
- `.planning/config.json` — nyquist_validation enabled [CITED: codebase]

### Secondary (MEDIUM confidence)
- Git log (`git log --oneline -10`) — Verified prior batch commits exist (Batch 1 at c3e20002, Batch 2 at 56ad7c4f, Batch 3 at 8d9992fe) [VERIFIED: working tree]

### Tertiary (LOW confidence)
- None. All findings are verified against the codebase or working tree.

## Project Constraints (from CLAUDE.md)

- **Zero-dependency pattern:** The staging script must use only Node.js built-in modules (no npm packages). All existing batch scripts follow this pattern. [CITED: CLAUDE.md]
- **Test runner:** `npm test` runs `node scripts/run-tests.cjs` (Node.js built-in `--test`). Coverage via `c8`. Tests must pass at final HEAD (VALID-02), but intermediate batch commits may have failures since test infrastructure is split from test logic. [CITED: CLAUDE.md and .planning/REQUIREMENTS.md]
- **No content changes:** Phase 39 only stages and commits — it does not modify file contents. Content fixes are explicitly out of scope per REQUIREMENTS.md. [CITED: .planning/REQUIREMENTS.md]
- **Git safety:** Never skip hooks, never force push to main. The staging script uses standard `git add -f` and `git commit -m` — no destructive operations. [CITED: CLAUDE.md]
- **File-writing agents:** If this phase uses agents (planner/executor), they must include `Only use the Write tool` and `# hooks:` commented in frontmatter per `agent-frontmatter.test.cjs`. [CITED: CLAUDE.md]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Node.js built-in modules only; verified via `node --version` and codebase grep
- Architecture: HIGH — 3 canonical reference scripts (batches 1-3) fully characterize the pattern
- Pitfalls: HIGH — all pitfalls are direct consequences of the git staging model and the batch refactoring design
- File scope: HIGH — `git diff --name-only v1.41.2` confirmed exact file list; dynamic scan ensures runtime correctness

**Research date:** 2026-05-22
**Valid until:** 2026-06-05 (14 days — stable pattern, no external API dependencies)
