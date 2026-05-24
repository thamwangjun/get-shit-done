# Phase 36: Stage and Commit Configuration & Rules - Pattern Map

**Mapped:** 2026-05-22
**Files analyzed:** 3
**Analogs found:** 1 / 1

## File Classification
| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
| --- | --- | --- | --- | --- |
| `scripts/stage-batch-1.cjs` | Staging & Commit orchestrator | Runs git commands to stage/commit Batch 1 files and validates staged subset | `scripts/run-tests.cjs` | High |

## Pattern Assignments

### New File: `scripts/stage-batch-1.cjs`
- **Analog file path:** `scripts/run-tests.cjs` (executing child processes), `get-shit-done/bin/lib/core.cjs` (git execution), `scripts/diff-touches-shipped-paths.cjs` (path validation logic)
- **Imports pattern:**
  Uses CommonJS `require()` for built-ins:
  ```javascript
  const fs = require('fs');
  const path = require('path');
  const { execFileSync } = require('child_process');
  ```
- **Auth/Guard pattern:**
  N/A (Local utility script).
- **Core CRUD pattern:**
  Executes git operations using `execFileSync` to avoid shell interpolation:
  ```javascript
  // Unstage everything first (D-03)
  execFileSync('git', ['reset'], { stdio: 'ignore' });

  // Stage target files explicitly (D-01)
  execFileSync('git', ['add', filePath], { stdio: 'inherit' });
  ```
- **Error handling pattern:**
  Try-catch around `execFileSync` to log errors, abort staging by running `git reset` (D-03 / D-04), and propagate status codes:
  ```javascript
  try {
    execFileSync('git', ['reset'], { stdio: 'inherit' });
  } catch (err) {
    process.exit(err.status || 1);
  }
  ```
- **Validation pattern:**
  Compares staged files with allowed Batch 1 files to ensure strict subset matches (D-04, D-05).
  ```javascript
  const stdout = execFileSync('git', ['diff', '--cached', '--name-only'], { encoding: 'utf8' });
  const staged = stdout.trim().split('\n').map(s => s.trim()).filter(Boolean);
  
  const extraFiles = staged.filter(f => !expectedFiles.has(f));
  if (extraFiles.length > 0) {
    // Abort
    execFileSync('git', ['reset']);
    process.exit(1);
  }
  ```
- **Testing pattern:**
  Manual validation by verifying git cached diff and the commit message:
  ```bash
  git diff --cached --name-only
  git log -n 1 --pretty=format:%s
  ```

## Shared Patterns
### Subprocess Execution Safety
In accordance with `.clinerules` (line 26), avoid using `execSync` with string interpolation. Always use `execFileSync` with array arguments to prevent shell injection and handle path spaces correctly:
```javascript
// Good
execFileSync('git', ['add', filePath], { stdio: 'inherit' });

// Bad
execSync(`git add ${filePath}`);
```

### Exit Code Propagation
Child process exits must be handled explicitly. When catching an execution error, propagate `err.status || 1` to ensure CI/harnesses detect the failure:
```javascript
try {
  execFileSync('git', ...);
} catch (err) {
  process.exit(err.status || 1);
}
```

## No Analog Found
None. The required child process operations and path subset check patterns are well represented in the codebase.

## Metadata
- **Analog search scope:** `scripts/`, `get-shit-done/bin/lib/`
- **Files scanned:** 3
- **Pattern extraction date:** 2026-05-22
