# Phase 39: Stage and Commit Tests & SDK Validation - Pattern Map

**Mapped:** 2026-05-22
**Files analyzed:** 1 new file
**Analogs found:** 3 / 1

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/stage-batch-4.cjs` | script/utility | batch/staging-pipeline | `scripts/stage-batch-2.cjs` | exact |

**Note:** Phase 39 creates only the staging script itself (`scripts/stage-batch-4.cjs`). The 22 files it stages (20 `tests/*.test.cjs` + `scripts/run-tests.cjs` + `sdk/src/cli.ts`) are already modified on disk with no further content changes needed. The script stays untracked per D-02 (committed later in Batch 5).

## Pattern Assignments

### `scripts/stage-batch-4.cjs` (script/utility, batch/staging-pipeline)

**Analog:** `scripts/stage-batch-2.cjs` (primary structural template — branch guard + existence check + hardcoded entries)
**Secondary analog:** `scripts/stage-batch-1.cjs` (dynamic directory scan for `tests/*.test.cjs`)
**Tertiary analog:** `scripts/stage-batch-3.cjs` (confirms pattern is stable across all three scripts)

The Batch 4 script combines:
- Batch 2's branch guard and file existence check (10-step structure)
- Batch 1's dynamic `fs.readdirSync` scanning (for `tests/*.test.cjs`)
- Batch 2/3's hardcoded file entries (for `scripts/run-tests.cjs`, `sdk/src/cli.ts`)

This is the first batch to combine dynamic scanning with hardcoded entries. Batch 1 used pure dynamic scanning; Batches 2 and 3 used pure hardcoded lists.

---

#### Imports Pattern — `scripts/stage-batch-2.cjs` lines 1-3 (identical in batch-1 line 1-3, batch-3 line 1-3)

```javascript
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
```

**Copy verbatim.** All three scripts use exactly these three imports. No other modules are needed.

---

#### `hasChangesSinceV1_41_2` Helper — `scripts/stage-batch-2.cjs` lines 5-32 (identical in batch-1 lines 5-32, batch-3 lines 5-32)

```javascript
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
    // If it doesn't exist in v1.41.2, it is a new file since v1.41.2!
    return true;
  }

  // If it exists in v1.41.2, check if there are differences between v1.41.2 and the working tree.
  try {
    execFileSync('git', ['diff', '--quiet', 'v1.41.2', '--', file], { cwd: repoRoot });
    return false;
  } catch (err) {
    // Exit code non-zero means there are differences.
    return true;
  }
}
```

**Copy verbatim.** This function is byte-for-byte identical across all three canonical scripts. No changes needed.

---

#### Branch Guard Pattern — `scripts/stage-batch-2.cjs` lines 37-50 (identical in batch-3 lines 37-50)

```javascript
  // Check the active branch guard: if process.env.ALLOW_ANY_BRANCH !== '1',
  // retrieve current branch using git, and if it is not "thamw-main", log error and abort with exit code 1.
  let currentBranch = '';
  try {
    currentBranch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8', cwd: repoRoot }).trim();
  } catch (err) {
    console.error('Failed to retrieve current branch:', err.message);
    process.exit(1);
  }

  if (process.env.ALLOW_ANY_BRANCH !== '1' && currentBranch !== 'thamw-main') {
    console.error(`Error: Current branch is "${currentBranch}", but "thamw-main" is required to run this script. Set ALLOW_ANY_BRANCH=1 to override.`);
    process.exit(1);
  }
```

**Copy verbatim.** The branch guard implementation is identical in batches 2 and 3. Batch 4 uses the exact same guard (D-07).

---

#### Duplicate Commit Check Pattern — `scripts/stage-batch-2.cjs` lines 52-64

```javascript
  // Check if the latest git commit message is already "test: refactor core tests and SDK validation (Batch 4)".
  // If so, print "Batch 4 already committed" and exit 0.
  let latestCommit = '';
  try {
    latestCommit = execFileSync('git', ['log', '-n', '1', '--pretty=format:%s'], { encoding: 'utf8', cwd: repoRoot }).trim();
  } catch (err) {
    console.warn('Warning: Could not get latest commit message:', err.message);
  }

  if (latestCommit === 'test: refactor core tests and SDK validation (Batch 4)') {
    console.log('Batch 4 already committed');
    process.exit(0);
  }
```

**Copy structure, replace message.** The commit message string is the only thing that changes per batch. Batch 4 uses `'test: refactor core tests and SDK validation (Batch 4)'` per D-06.

---

#### Dynamic Directory Scan Pattern — `scripts/stage-batch-1.cjs` lines 54-63 (adapted for tests directory)

```javascript
  // Dynamically scan `tests/` for test files (`.test.cjs`) and add their relative paths to the expected files Set.
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

**Copy structure, adapt directory and glob.** This pattern comes from Batch 1's `.planning/references/*.md` scan but adapted to `tests/*.test.cjs` per D-03. The structure (existsSync guard, readdirSync, filter, add with relative path prefix) is identical.

---

#### Hardcoded Entries Pattern — `scripts/stage-batch-2.cjs` lines 67-71

```javascript
  // Add hardcoded entries for scripts/run-tests.cjs and sdk/src/cli.ts
  expectedFiles.add('scripts/run-tests.cjs');
  expectedFiles.add('sdk/src/cli.ts');
```

**Copy structure, adapt entries.** Batches 2 and 3 add hardcoded entries after the Set initialization. Batch 4 adds exactly two: `scripts/run-tests.cjs` (D-05) and `sdk/src/cli.ts` (D-04).

---

#### Missing-File Check Pattern — `scripts/stage-batch-2.cjs` lines 73-81 (identical in batch-3 lines 131-139)

```javascript
  // Perform file existence checks on disk: for each expected file, if it is missing on disk,
  // log validation failed and exit 1.
  for (const file of expectedFiles) {
    const fullPath = path.join(repoRoot, file);
    if (!fs.existsSync(fullPath)) {
      console.error(`Validation failed: Expected file is missing on disk: ${file}`);
      process.exit(1);
    }
  }
```

**Copy verbatim.** Identical in batches 2 and 3. Batch 4 uses the same pattern (D-11).

---

#### Git Reset Pattern — `scripts/stage-batch-2.cjs` lines 83-90 (identical in batch-1 lines 66-72, batch-3 lines 141-148)

```javascript
  // Run git reset to unstage any pre-existing staged changes.
  console.log('Unstaging any pre-existing staged changes...');
  try {
    execFileSync('git', ['reset'], { cwd: repoRoot, stdio: 'ignore' });
  } catch (err) {
    console.error('Failed to run git reset:', err.message);
    process.exit(1);
  }
```

**Copy verbatim.** Identical across all three scripts (D-08).

---

#### Per-File Stage Loop Pattern — `scripts/stage-batch-2.cjs` lines 92-105 (identical structure in batch-1 lines 75-87, batch-3 lines 150-163)

```javascript
  // Iterate through the expected files list. For each file, check if it has changes since v1.41.2.
  // If the file has no changes, skip staging and log output for it silently.
  // Otherwise, execute git add -f <file> using execFileSync.
  for (const file of expectedFiles) {
    if (hasChangesSinceV1_41_2(file, repoRoot)) {
      console.log(`Staging modified Batch 4 file: ${file}`);
      try {
        execFileSync('git', ['add', '-f', file], { cwd: repoRoot });
      } catch (err) {
        console.error(`Failed to git add ${file}:`, err.message);
        process.exit(1);
      }
    }
  }
```

**Copy structure, update batch number in log message.** The `Batch N` reference in the log string is the only change. D-12 (silent skip for unchanged files) is handled by the `hasChangesSinceV1_41_2` guard — files with no changes are silently skipped because no log line is emitted inside the `if` block.

---

#### Subset Verification Pattern — `scripts/stage-batch-2.cjs` lines 107-134 (identical structure in batch-1 lines 89-116, batch-3 lines 165-193)

```javascript
  // Execute git diff --cached --name-only to list all currently staged files.
  let stagedFiles = [];
  try {
    const stagedOutput = execFileSync('git', ['diff', '--cached', '--name-only'], { encoding: 'utf8', cwd: repoRoot });
    stagedFiles = stagedOutput.split('\n').map(line => line.trim()).filter(Boolean);
  } catch (err) {
    console.error('Failed to list staged files:', err.message);
    process.exit(1);
  }

  // Verify that all staged files are a subset of the expected files Set.
  const unauthorized = [];
  for (const file of stagedFiles) {
    if (!expectedFiles.has(file)) {
      unauthorized.push(file);
    }
  }

  if (unauthorized.length > 0) {
    console.error('Validation failed: Unauthorized files staged:', unauthorized);
    console.log('Aborting staging and resetting repository index...');
    try {
      execFileSync('git', ['reset'], { cwd: repoRoot, stdio: 'ignore' });
    } catch (err) {
      console.error('Failed to reset after abort:', err.message);
    }
    process.exit(1);
  }

  // If there are no staged files at all, log "No modifications to stage for Batch 4" and exit 0.
  if (stagedFiles.length === 0) {
    console.log('No modifications to stage for Batch 4');
    process.exit(0);
  }
```

**Copy verbatim except batch number in log message.** D-10 requires subset verification with abort-and-reset on unauthorized files. This pattern is identical across all three scripts.

---

#### Commit Pattern — `scripts/stage-batch-2.cjs` lines 142-150 (identical structure, different message per batch)

```javascript
  // If validation passes and files are staged, execute git commit
  console.log('Committing staged Batch 4 files...');
  try {
    execFileSync('git', ['commit', '-m', 'test: refactor core tests and SDK validation (Batch 4)'], { cwd: repoRoot, stdio: 'inherit' });
    console.log('Batch 4 commit successful.');
  } catch (err) {
    console.error('Failed to commit Batch 4 changes:', err.message);
    process.exit(1);
  }
```

**Copy structure, replace commit message per D-06.** Batch 3 uses an array form for clarity with a long message; Batch 4's message is moderately long. The array form `['commit', '-m', 'test: refactor core tests and SDK validation (Batch 4)']` (as in batch-3 lines 203-207) is preferred for readability.

---

#### Entry Point Pattern — `scripts/stage-batch-2.cjs` line 153 (identical in batch-1 line 135, batch-3 line 215)

```javascript
run();
```

**Copy verbatim.** All three scripts define a `run()` function and call it once at the bottom.

---

## Shared Patterns

### Overall 10-Step Structure

All three canonical scripts follow this exact flow. Batch 4 follows it identically, combining Batch 2's structural template with Batch 1's dynamic scanning for step 4:

| Step | What | Source Analog | Batch 4 Adaptation |
|------|------|---------------|-------------------|
| 1 | `repoRoot = path.join(__dirname, '..')` | batch-2 line 35 | Copy verbatim |
| 2 | Branch guard (D-07) | batch-2 lines 37-50 | Copy verbatim |
| 3 | Duplicate commit check (D-09) | batch-2 lines 52-64 | Replace commit message |
| 4 | Build expected Set | batch-1 lines 54-63 + batch-2 lines 67-71 | Dynamic scan `tests/*.test.cjs` + hardcoded `scripts/run-tests.cjs`, `sdk/src/cli.ts` |
| 5 | Missing-file check (D-11) | batch-2 lines 73-81 | Copy verbatim |
| 6 | Git reset (D-08) | batch-2 lines 83-90 | Copy verbatim |
| 7 | Per-file stage loop (D-12) | batch-2 lines 92-105 | Update batch number in log |
| 8 | Subset verification (D-10) | batch-2 lines 107-134 | Update batch number in log |
| 9 | Empty stage guard | batch-2 lines 136-140 | Update batch number in log |
| 10 | Git commit (D-06) | batch-2 lines 142-150 | Replace commit message |

### Error Handling

**Source:** All three scripts follow the same pattern — no shared error utility, each script does its own inline error handling:

```javascript
try {
  execFileSync('git', [...], { cwd: repoRoot, stdio: 'ignore' });
} catch (err) {
  console.error('Contextual error message:', err.message);
  process.exit(1);
}
```

Each `execFileSync` call that can fail is wrapped in its own try/catch. Non-critical failures (duplicate commit check) use `console.warn` instead of `process.exit(1)`.

### Git Command Pattern

All git interactions use `execFileSync` with argument arrays (never string interpolation). This prevents shell injection and matches the established pattern:

| Operation | Command | Flags |
|-----------|---------|-------|
| Get branch | `git rev-parse --abbrev-ref HEAD` | `{ encoding: 'utf8', cwd: repoRoot }` |
| Get latest commit | `git log -n 1 --pretty=format:%s` | `{ encoding: 'utf8', cwd: repoRoot }` |
| Check file at tag | `git cat-file -e v1.41.2:<file>` | `{ cwd: repoRoot, stdio: 'ignore' }` |
| Diff against tag | `git diff --quiet v1.41.2 -- <file>` | `{ cwd: repoRoot }` |
| Clear index | `git reset` | `{ cwd: repoRoot, stdio: 'ignore' }` |
| Stage file | `git add -f <file>` | `{ cwd: repoRoot }` |
| List staged | `git diff --cached --name-only` | `{ encoding: 'utf8', cwd: repoRoot }` |
| Commit | `git commit -m "<message>"` | `{ cwd: repoRoot, stdio: 'inherit' }` |

### No External Dependencies

All three scripts use only `fs`, `path`, and `child_process.execFileSync` — no npm packages. Batch 4 follows the same zero-dependency pattern.

### Exit Code Conventions

- `process.exit(0)` — success (including early exits for "already committed" and "nothing to stage")
- `process.exit(1)` — failure (branch mismatch, missing files, unauthorized staged files, git operation failure)

## No Analog Found

None. All patterns needed for `scripts/stage-batch-4.cjs` have exact matches in the codebase.

## Metadata

**Analog search scope:** `scripts/stage-batch-{1,2,3}.cjs`
**Files scanned:** 3 (all canonical batch staging scripts)
**Pattern extraction date:** 2026-05-22
