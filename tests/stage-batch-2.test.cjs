/**
 * Structural validation tests for scripts/stage-batch-2.cjs
 *
 * The stage-batch-2.cjs script calls run() at module load time, which
 * performs real git operations. These tests validate the script's
 * structure and behavior without importing it directly:
 *
 *   1. Syntax validity (node -c)
 *   2. CommonJS import structure (fs, path, execFileSync)
 *   3. Script ends with run() call
 *   4. hasChangesSinceV1_41_2 function uses git cat-file + git diff --quiet
 *   5. expectedFiles Set contains exactly 3 Batch 2 files
 *   6. Branch guard checks for thamw-main and ALLOW_ANY_BRANCH override
 *   7. Missing-file detection runs before any git add
 *   8. Duplicate commit detection for exact Batch 2 commit message
 *   9. git reset runs before git add
 *   10. git add uses -f flag
 *   11. Subset verification catches unauthorized files and exits 1
 *   12. No-staged-files early exit with "No modifications to stage for Batch 2"
 *   13. Correct commit message is hardcoded
 *   14. Silent skip behavior (no else branch logging for unchanged files)
 *   15. End-to-end: script detects duplicate commit (Batch 2 already committed) and exits 0
 *   16. All git commands use execFileSync with argument arrays (no string interpolation)
 *   17. Failed commit log query is non-fatal (console.warn)
 *   18. Commit message has correct conventional commit format
 *   19. Runtime verification: git log confirms commit exists with expected message
 *
 * Methodology:
 *   - Structural tests: parse source text, verify patterns
 *   - Syntax test: node -c in child process
 *   - Function comparison: extract hasChangesSinceV1_41_2 bodies
 *   - Behavioral: run script in subprocess with ALLOW_ANY_BRANCH=1
 */

'use strict';

const { describe, test, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const REPO_ROOT = path.join(__dirname, '..');
const SCRIPT_PATH = path.join(REPO_ROOT, 'scripts', 'stage-batch-2.cjs');
const BATCH_1_PATH = path.join(REPO_ROOT, 'scripts', 'stage-batch-1.cjs');

const BATCH_2_COMMIT_MSG = 'feat(scanner): refactor scanner logic and audit scripts (Batch 2)';
const BATCH_2_EXPECTED_FILES = [
  'hooks/gsd-read-injection-scanner.js',
  'scripts/audit-tags.js',
  'hooks/gsd-check-update.js',
];

/**
 * Extract the body of a named function from source text.
 * Handles `function name(args) { ... }` forms.
 * Returns the body content between the outermost braces, or null.
 */
function extractFunctionBody(src, funcName) {
  const pattern = new RegExp(
    `function\\s+${funcName}\\s*\\([^)]*\\)\\s*\\{`,
    'm'
  );
  const match = src.match(pattern);
  if (!match) return null;

  const startIdx = match.index + match[0].length;
  let depth = 1;
  let i = startIdx;
  while (i < src.length && depth > 0) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
    i++;
  }
  if (depth !== 0) return null;
  return src.slice(startIdx, i - 1);
}

/**
 * Extract the 'run' function body from source text.
 */
function extractRunFunctionBody(src) {
  return extractFunctionBody(src, 'run');
}

/**
 * Run a node script in a subprocess and return { exitCode, stdout, stderr }.
 */
function runNodeScript(scriptPath, env = {}) {
  try {
    const result = execFileSync(process.execPath, [scriptPath], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    });
    return { exitCode: 0, stdout: result.trim(), stderr: '' };
  } catch (err) {
    return {
      exitCode: err.status || 1,
      stdout: (err.stdout || '').toString().trim(),
      stderr: (err.stderr || err.message || '').toString().trim(),
    };
  }
}

// ─── Test Suite ──────────────────────────────────────────────────

describe('stage-batch-2.cjs', () => {
  let scriptSrc;
  let batch1Src;

  before(() => {
    scriptSrc = fs.readFileSync(SCRIPT_PATH, 'utf-8');
    batch1Src = fs.readFileSync(BATCH_1_PATH, 'utf-8');
  });

  // ── 1. Syntax validity ──────────────────────────────────────

  test('script has no syntax errors', () => {
    try {
      execFileSync(process.execPath, ['-c', SCRIPT_PATH], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (err) {
      assert.fail(`Syntax error in stage-batch-2.cjs: ${err.stderr || err.message}`);
    }
  });

  test('script starts with expected CommonJS imports', () => {
    const lines = scriptSrc.split('\n');
    assert.strictEqual(lines[0], "const fs = require('fs');",
      "Line 1 must be: const fs = require('fs');");
    assert.strictEqual(lines[1], "const path = require('path');",
      "Line 2 must be: const path = require('path');");
    assert.strictEqual(lines[2], "const { execFileSync } = require('child_process');",
      "Line 3 must be: const { execFileSync } = require('child_process');");
  });

  test('script ends with run() call', () => {
    const trimmed = scriptSrc.trimEnd();
    assert.ok(trimmed.endsWith('run();'),
      'Script must end with run(); call');
  });

  // ── 2. hasChangesSinceV1_41_2 function validation ───────────

  test('hasChangesSinceV1_41_2 function exists and uses git cat-file for existence check', () => {
    const fnBody = extractFunctionBody(scriptSrc, 'hasChangesSinceV1_41_2');
    assert.ok(fnBody !== null, 'hasChangesSinceV1_41_2 function must exist in script');
    assert.ok(
      fnBody.includes("cat-file") && fnBody.includes("v1.41.2"),
      'hasChangesSinceV1_41_2 must use git cat-file referencing v1.41.2 tag'
    );
  });

  test('hasChangesSinceV1_41_2 uses git diff --quiet for change detection', () => {
    const fnBody = extractFunctionBody(scriptSrc, 'hasChangesSinceV1_41_2');
    assert.ok(
      fnBody.includes('diff') && fnBody.includes('--quiet') && fnBody.includes('v1.41.2'),
      'hasChangesSinceV1_41_2 must use git diff --quiet against v1.41.2'
    );
  });

  test('hasChangesSinceV1_41_2 returns true for new files not in v1.41.2', () => {
    // When git cat-file -e fails (file doesn't exist in v1.41.2),
    // the function should return true (it's a new file since v1.41.2)
    const fnBody = extractFunctionBody(scriptSrc, 'hasChangesSinceV1_41_2');
    assert.ok(fnBody !== null);
    // After the catch block where existsInV1_41_2 = false, should return true
    assert.ok(
      fnBody.includes('return true'),
      'hasChangesSinceV1_41_2 must return true when file does not exist in v1.41.2'
    );
  });

  test('hasChangesSinceV1_41_2 is byte-for-byte identical to batch-1', () => {
    const batch2Body = extractFunctionBody(scriptSrc, 'hasChangesSinceV1_41_2');
    const batch1Body = extractFunctionBody(batch1Src, 'hasChangesSinceV1_41_2');

    assert.ok(batch2Body !== null, 'hasChangesSinceV1_41_2 must exist in stage-batch-2.cjs');
    assert.ok(batch1Body !== null, 'hasChangesSinceV1_41_2 must exist in stage-batch-1.cjs');

    const normalize = (s) => s.split('\n').map(l => l.trim()).filter(l => l.length > 0).join('\n');
    assert.strictEqual(normalize(batch2Body), normalize(batch1Body),
      'hasChangesSinceV1_41_2 body must be byte-for-byte identical to batch-1');
  });

  // ── 3. expectedFiles Set construction ────────────────────────

  test('expectedFiles Set contains exactly 3 Batch 2 files', () => {
    // Each expected file must appear in the Set construction
    for (const file of BATCH_2_EXPECTED_FILES) {
      assert.ok(
        scriptSrc.includes(file),
        `expectedFiles Set must include: ${file}`
      );
    }
  });

  test('expectedFiles Set does not contain extra files beyond Batch 2 scope', () => {
    // Verify no unexpected files leaked in. The Set should contain EXACTLY 3 entries.
    const setStart = scriptSrc.indexOf('const expectedFiles = new Set(');
    const setEnd = scriptSrc.indexOf(']);', setStart) + 2;
    const setBlock = scriptSrc.slice(setStart, setEnd);

    // Count single-quoted strings (file entries)
    const fileEntries = setBlock.match(/'.+?'/g) || [];
    assert.strictEqual(fileEntries.length, 3,
      `expectedFiles Set must contain exactly 3 entries, found ${fileEntries.length}: ${fileEntries.join(', ')}`);
  });

  test('expectedFiles Set includes hooks/gsd-read-injection-scanner.js', () => {
    assert.ok(
      scriptSrc.includes("hooks/gsd-read-injection-scanner.js"),
      'hooks/gsd-read-injection-scanner.js must be in expectedFiles Set'
    );
  });

  test('expectedFiles Set includes scripts/audit-tags.js', () => {
    assert.ok(
      scriptSrc.includes("scripts/audit-tags.js"),
      'scripts/audit-tags.js must be in expectedFiles Set'
    );
  });

  test('expectedFiles Set includes hooks/gsd-check-update.js', () => {
    assert.ok(
      scriptSrc.includes("hooks/gsd-check-update.js"),
      'hooks/gsd-check-update.js must be in expectedFiles Set'
    );
  });

  // ── 4. Branch guard ──────────────────────────────────────────

  test('branch guard checks for thamw-main', () => {
    assert.ok(
      scriptSrc.includes("'thamw-main'") || scriptSrc.includes('"thamw-main"'),
      'Must check for thamw-main branch'
    );
  });

  test('branch guard uses ALLOW_ANY_BRANCH override', () => {
    assert.ok(
      scriptSrc.includes('ALLOW_ANY_BRANCH'),
      'Must support ALLOW_ANY_BRANCH environment variable override'
    );
  });

  test('branch guard uses git rev-parse --abbrev-ref HEAD', () => {
    assert.ok(
      scriptSrc.includes('rev-parse') && scriptSrc.includes('--abbrev-ref'),
      'Must use git rev-parse --abbrev-ref HEAD for branch detection'
    );
  });

  test('branch guard exits 1 on wrong branch', () => {
    const branchGuardSection = scriptSrc.slice(
      scriptSrc.indexOf('ALLOW_ANY_BRANCH')
    );
    assert.ok(
      branchGuardSection.includes('process.exit(1)'),
      'Must exit 1 when branch guard fails'
    );
  });

  test('branch guard abort message references current branch', () => {
    assert.ok(
      scriptSrc.includes('Current branch is'),
      'Must report the current branch name in the abort error message'
    );
  });

  // ── 5. Missing-file detection ────────────────────────────────

  test('missing-file check validates all expected files exist on disk', () => {
    assert.ok(
      scriptSrc.includes('Expected file is missing on disk'),
      'Must validate all expected files exist on disk before staging'
    );
  });

  test('missing-file check exits 1 when file is absent', () => {
    const missingSection = scriptSrc.slice(
      scriptSrc.indexOf('Expected file is missing on disk')
    );
    assert.ok(
      missingSection.includes('process.exit(1)'),
      'Must exit 1 when expected file is missing'
    );
  });

  test('missing-file check runs before any git add operation', () => {
    const missingCheckIdx = scriptSrc.indexOf('Expected file is missing on disk');
    const firstGitAddIdx = scriptSrc.indexOf("git', ['add'");
    assert.ok(
      missingCheckIdx > 0 && firstGitAddIdx > 0,
      'Both missing-file check and git add must exist'
    );
    assert.ok(
      missingCheckIdx < firstGitAddIdx,
      'Missing-file check must occur before any git add operations'
    );
  });

  // ── 6. Duplicate commit detection ────────────────────────────

  test('duplicate commit detection exits 0 when Batch 2 is already committed', () => {
    const dupSection = scriptSrc.slice(
      scriptSrc.indexOf('Batch 2 already committed')
    );
    assert.ok(
      dupSection.includes('process.exit(0)'),
      'Must exit 0 when duplicate commit is detected'
    );
  });

  test('duplicate commit detection uses exact commit message', () => {
    assert.ok(
      scriptSrc.includes('Batch 2 already committed'),
      'Must have early-exit log: "Batch 2 already committed"'
    );
  });

  test('duplicate commit detection uses git log with --pretty=format:%s', () => {
    assert.ok(
      scriptSrc.includes('--pretty=format:%s'),
      'Must use git log --pretty=format:%s to get latest commit message'
    );
  });

  // ── 7. git reset before git add ──────────────────────────────

  test('git reset runs before any git add', () => {
    const resetIdx = scriptSrc.indexOf("git', ['reset']");
    const addIdx = scriptSrc.indexOf("git', ['add'");
    assert.ok(resetIdx > 0, 'git reset call must exist');
    assert.ok(addIdx > 0, 'git add call must exist');
    assert.ok(resetIdx < addIdx,
      'git reset must run before any git add operation');
  });

  test('git reset log message confirms unstaging operation', () => {
    assert.ok(
      scriptSrc.includes('Unstaging any pre-existing staged changes'),
      'Must log message about unstaging pre-existing staged changes'
    );
  });

  // ── 8. git add -f flag ───────────────────────────────────────

  test('git add uses -f flag to bypass .gitignore', () => {
    assert.ok(
      scriptSrc.includes("'add', '-f'") || scriptSrc.includes('"add", "-f"'),
      'Must use git add -f to bypass .gitignore'
    );
  });

  // ── 9. Subset verification ───────────────────────────────────

  test('subset verification catches unauthorized files and logs them', () => {
    assert.ok(
      scriptSrc.includes('Unauthorized files staged'),
      'Must log "Unauthorized files staged" when subset check fails'
    );
  });

  test('subset verification runs git reset on unauthorized files', () => {
    assert.ok(
      scriptSrc.includes('Aborting staging and resetting repository index'),
      'Must abort and reset on unauthorized files'
    );
  });

  test('subset verification exits 1 on unauthorized files', () => {
    const unauthorizedSection = scriptSrc.slice(
      scriptSrc.indexOf('Unauthorized files staged')
    );
    assert.ok(
      unauthorizedSection.includes('process.exit(1)'),
      'Must exit 1 after detecting unauthorized staged files'
    );
  });

  // ── 10. No-staged-files early exit ───────────────────────────

  test('no staged files produces early exit 0 with Batch 2 message', () => {
    assert.ok(
      scriptSrc.includes('No modifications to stage for Batch 2'),
      'Must exit 0 with "No modifications to stage for Batch 2" when nothing to stage'
    );
  });

  test('no staged files exit uses process.exit(0)', () => {
    const noModSection = scriptSrc.slice(
      scriptSrc.indexOf('No modifications to stage for Batch 2')
    );
    assert.ok(
      noModSection.includes('process.exit(0)'),
      'Must exit 0 when no modifications to stage'
    );
  });

  // ── 11. Commit message ───────────────────────────────────────

  test('correct commit message is hardcoded', () => {
    // Must appear at least twice: once in the duplicate check, once in the commit command
    const escapedMsg = BATCH_2_COMMIT_MSG.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const occurrences = (scriptSrc.match(new RegExp(escapedMsg, 'g')) || []).length;
    assert.ok(occurrences >= 2,
      `Commit message "${BATCH_2_COMMIT_MSG}" must appear at least twice (duplicate check + commit command), found ${occurrences}`);
  });

  test('git commit uses -m flag with message as separate argument', () => {
    assert.ok(
      scriptSrc.includes("'commit', '-m'") || scriptSrc.includes('"commit", "-m"'),
      'Must use git commit -m with message as separate array argument (no string interpolation)'
    );
  });

  // ── 12. Silent skip behavior ─────────────────────────────────

  test('silent skip produces no else-branch logging for unchanged files', () => {
    const runBody = extractRunFunctionBody(scriptSrc);
    assert.ok(runBody !== null, 'run() function must exist');

    // The staging loop should only log when hasChangesSinceV1_41_2 returns true.
    // There should be no else clause logging "skipping" or "no changes" for unchanged files.
    const elseSkipPattern = /else\s*\{[^}]*log/i;
    const stagingLoopStart = scriptSrc.indexOf('for (const file of expectedFiles)');
    const stagingLoopEnd = scriptSrc.indexOf('// Execute git diff', stagingLoopStart);
    const stagingLoop = scriptSrc.slice(stagingLoopStart, stagingLoopEnd);

    assert.ok(
      !elseSkipPattern.test(stagingLoop),
      'Staging loop must not have an else branch that logs for unchanged files (silent skip)'
    );
  });

  // ── 13. All git commands use execFileSync with argument arrays ──

  test('all git commands use execFileSync with argument arrays', () => {
    // Verify no string-interpolated git commands (execFileSync('git', [...]) is the safe pattern)
    const gitCalls = scriptSrc.match(/execFileSync\('git'/g) || [];
    assert.ok(gitCalls.length >= 6,
      `Must have at least 6 execFileSync git calls (branch, commit log, cat-file, diff, reset, add, diff-cached, commit), found ${gitCalls.length}`);
  });

  test('no backtick-interpolated git commands anywhere in script', () => {
    // Security: string-interpolated git commands are vulnerable to shell injection.
    // execFileSync with argument arrays is the safe pattern.
    const backtickGit = scriptSrc.match(/`git\s/);
    assert.strictEqual(backtickGit, null,
      'Must never use backtick-interpolated git commands (use execFileSync argument arrays)');
  });

  // ── 14. Failed commit log query is non-fatal ─────────────────

  test('failed commit log query is non-fatal (console.warn, not error or exit)', () => {
    assert.ok(
      scriptSrc.includes('console.warn'),
      'Failed commit log query must use console.warn (non-fatal)'
    );
    // Verify it does not exit after a failed commit log query — the warn
    // message must be inside the git-log catch block, not followed by exit
    const gitLogCatch = scriptSrc.slice(
      scriptSrc.indexOf("execFileSync('git', ['log'"),
    );
    const catchIdx = gitLogCatch.indexOf('catch');
    const warnIdx = gitLogCatch.indexOf('console.warn');
    const exitInCatch = gitLogCatch.indexOf('process.exit', catchIdx);
    assert.ok(
      warnIdx > catchIdx && (exitInCatch === -1 || exitInCatch > warnIdx),
      'console.warn must be in the git-log catch block, and there must be no process.exit in that same catch block'
    );
  });

  // ── 15. End-to-end: duplicate commit detection ───────────────

  test('script exits 0 without side effects when Batch 2 files are unchanged since HEAD', function () {
    // The Batch 2 commit (56ad7c4f) is already committed on this repo.
    // However, the duplicate commit detection only triggers when HEAD is exactly the
    // Batch 2 commit. Since subsequent commits exist on this branch, HEAD is NOT the
    // Batch 2 commit. Instead, the script's change detection and staging logic kicks in:
    // the files HAVE changes since v1.41.2, so they get staged, but then git diff --cached
    // (which compares staged vs HEAD) returns nothing because the files match HEAD.
    // The script correctly exits 0 without creating a duplicate commit.
    const result = runNodeScript(SCRIPT_PATH, { ALLOW_ANY_BRANCH: '1' });
    assert.strictEqual(result.exitCode, 0,
      `Script should exit 0 when Batch 2 files match HEAD. stdout: ${result.stdout}, stderr: ${result.stderr}`);
    // The script should not create a new commit — it should print one of these expected messages
    const hasExpectedMessage =
      result.stdout.includes('No modifications to stage for Batch 2') ||
      result.stdout.includes('Batch 2 already committed');
    assert.ok(hasExpectedMessage,
      `Should print safe-exit message. stdout: "${result.stdout}"`);
  });

  test('script leaves no dirty staged changes when Batch 2 is already in history', function () {
    // When Batch 2 files match HEAD (already committed), the script stages them
    // (they have changes since v1.41.2), but then git diff --cached returns empty
    // (staged content == HEAD), so the script exits 0 without creating a commit.
    // The git reset at script start ensures any pre-existing staged files are cleared.
    // Verify: index is clean after script completes.
    const result = runNodeScript(SCRIPT_PATH, { ALLOW_ANY_BRANCH: '1' });
    assert.strictEqual(result.exitCode, 0);

    // Verify git index has no differences from HEAD (no dirty staged changes)
    try {
      execFileSync('git', ['diff', '--cached', '--quiet'], { cwd: REPO_ROOT, stdio: 'ignore' });
      // Exit 0 means no staged changes — this is what we want
    } catch (err) {
      assert.fail('Script left staged changes in the index after processing');
    }
  });

  // ── 16. Branch guard behavioral test ─────────────────────────

  test('branch guard allows execution with ALLOW_ANY_BRANCH=1', function () {
    const result = runNodeScript(SCRIPT_PATH, { ALLOW_ANY_BRANCH: '1' });
    // Should pass branch guard and then either hit duplicate commit or proceed.
    // Either way, it should NOT fail with a branch guard error.
    assert.ok(
      !result.stderr.includes('Current branch is') || result.stderr.includes('ALLOW_ANY_BRANCH'),
      `Branch guard should not block when ALLOW_ANY_BRANCH=1 is set. stderr: "${result.stderr}"`
    );
  });

  // ── 17. Runtime verification: git log confirms commit exists ─

  test('runtime git log confirms Batch 2 commit exists with expected message', function () {
    let actualMessage;
    try {
      actualMessage = execFileSync(
        'git', ['log', '-n', '1', '--pretty=format:%s', '56ad7c4f'],
        { encoding: 'utf8', cwd: REPO_ROOT }
      ).trim();
    } catch (err) {
      assert.fail(`Failed to query git log: ${err.message}`);
    }
    assert.strictEqual(actualMessage, BATCH_2_COMMIT_MSG,
      `git log --pretty=format:%s on 56ad7c4f must return "${BATCH_2_COMMIT_MSG}", got "${actualMessage}"`);
  });

  test('runtime git show confirms Batch 2 commit contains only expected files', function () {
    let actualFiles;
    try {
      actualFiles = execFileSync(
        'git', ['show', '--name-only', '--pretty=format:', '56ad7c4f'],
        { encoding: 'utf8', cwd: REPO_ROOT }
      ).split('\n').map(l => l.trim()).filter(Boolean);
    } catch (err) {
      assert.fail(`Failed to query git show: ${err.message}`);
    }

    // All files in the commit must be a subset of the expected Batch 2 files
    for (const file of actualFiles) {
      assert.ok(
        BATCH_2_EXPECTED_FILES.includes(file),
        `File "${file}" in Batch 2 commit is not in expected Batch 2 file list`
      );
    }

    // All expected files must be in the commit
    for (const expected of BATCH_2_EXPECTED_FILES) {
      assert.ok(
        actualFiles.includes(expected),
        `Expected file "${expected}" is missing from Batch 2 commit. Files found: ${actualFiles.join(', ')}`
      );
    }
  });

  test('git status shows no staged changes in working tree', function () {
    // Verify there are no leftover staged changes from running the script
    try {
      execFileSync('git', ['diff', '--cached', '--quiet'], { cwd: REPO_ROOT, stdio: 'ignore' });
      // Exit 0 means clean index — success
    } catch (err) {
      // There are staged changes — list them for debugging
      const staged = execFileSync(
        'git', ['diff', '--cached', '--name-only'],
        { encoding: 'utf8', cwd: REPO_ROOT }
      ).trim();
      assert.fail(`Working tree has staged changes that should not exist: ${staged}`);
    }
  });
});