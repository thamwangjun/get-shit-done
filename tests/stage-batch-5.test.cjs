/**
 * Structural validation tests for scripts/stage-batch-5.cjs and .gitignore Antigravity block.
 * Static analysis only — reads file content, never executes the script.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.join(__dirname, '..');
const SCRIPT_PATH = path.join(REPO_ROOT, 'scripts', 'stage-batch-5.cjs');
const GITIGNORE_PATH = path.join(REPO_ROOT, '.gitignore');

// ─── GAP 1 (T1a): scripts/stage-batch-5.cjs structural validation ───────────

describe('stage-batch-5.cjs structural validation', () => {
  let scriptContent;

  test('script file exists on disk', () => {
    assert.ok(fs.existsSync(SCRIPT_PATH), `Expected script at ${SCRIPT_PATH}`);
    scriptContent = fs.readFileSync(SCRIPT_PATH, 'utf8');
  });

  test('syntax: node --check exits 0', () => {
    // Reads current file content first to confirm file present
    const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
    assert.ok(content.length > 0, 'script file must be non-empty');

    execFileSync(process.execPath, ['--check', SCRIPT_PATH], {
      stdio: 'pipe',
    });
    // If execFileSync throws, the test fails automatically
  });

  test('self-referential: expectedFiles contains scripts/stage-batch-5.cjs', () => {
    const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
    assert.ok(
      content.includes("'scripts/stage-batch-5.cjs'") || content.includes('"scripts/stage-batch-5.cjs"'),
      'scripts/stage-batch-5.cjs must include itself in the expectedFiles set (self-referential per D-04)'
    );
  });

  test('full git log: uses --pretty=format:%s for duplicate detection', () => {
    const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
    assert.ok(
      content.includes('--pretty=format:%s'),
      'must use --pretty=format:%s for full git log duplicate detection'
    );
  });

  test('full git log: does NOT use -n 1 immediately adjacent to git log command', () => {
    const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
    // Find the git log call for duplicate detection and verify -n 1 is absent
    // We look for the array form: ['log', '--pretty=format:%s'] without '-n', '1' in between
    // A line containing both --pretty=format:%s and -n 1 in the same git call would be a violation
    const logLineMatch = content.match(/execFileSync\s*\([^)]*['"]log['"][^)]*['"]--pretty=format:%s['"][^)]*\)/s);
    if (logLineMatch) {
      assert.ok(
        !logLineMatch[0].includes("'-n'") && !logLineMatch[0].includes('"-n"'),
        'git log for duplicate detection must NOT use -n 1 (must scan full history)'
      );
    } else {
      // If the format is array-style across multiple lines, check no -n 1 appears near the log call
      // Find the block of code containing --pretty=format:%s
      const idx = content.indexOf('--pretty=format:%s');
      assert.ok(idx !== -1, '--pretty=format:%s must be present');
      // Extract 300 chars around the occurrence and check for -n 1
      const surrounding = content.slice(Math.max(0, idx - 150), idx + 150);
      assert.ok(
        !surrounding.includes("'-n'") && !surrounding.includes('"-n"'),
        'git log for duplicate detection must NOT use -n 1 — found near --pretty=format:%s'
      );
    }
  });

  test('no lib files: security.cjs absent from expectedFiles block', () => {
    const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
    // Find the expectedFiles Set construction
    const setMatch = content.match(/new Set\s*\(\s*\[([^\]]*)\]/s);
    if (setMatch) {
      assert.ok(
        !setMatch[1].includes('security.cjs'),
        'security.cjs must NOT be in the expectedFiles Set (goes in separate fix(lib) commit per D-02)'
      );
    } else {
      assert.ok(
        !content.includes("'get-shit-done/bin/lib/security.cjs'") &&
        !content.includes('"get-shit-done/bin/lib/security.cjs"'),
        'security.cjs must NOT appear in expectedFiles'
      );
    }
  });

  test('no lib files: state.cjs absent from expectedFiles block', () => {
    const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
    const setMatch = content.match(/new Set\s*\(\s*\[([^\]]*)\]/s);
    if (setMatch) {
      assert.ok(
        !setMatch[1].includes('state.cjs'),
        'state.cjs must NOT be in the expectedFiles Set (goes in separate fix(lib) commit per D-02)'
      );
    } else {
      assert.ok(
        !content.includes("'get-shit-done/bin/lib/state.cjs'") &&
        !content.includes('"get-shit-done/bin/lib/state.cjs"'),
        'state.cjs must NOT appear in expectedFiles'
      );
    }
  });

  test('logs handling: uses readdirSync and logs/ path', () => {
    const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
    assert.ok(
      content.includes('readdirSync'),
      'must use fs.readdirSync to enumerate log files'
    );
    assert.ok(
      content.includes("logs/") || content.includes("'logs'"),
      "must reference 'logs/' directory for untracked log file handling"
    );
  });

  test('commit message: contains exact Batch 5 commit message string', () => {
    const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
    assert.ok(
      content.includes('chore(maintenance): refactor quick tasks, logs, and state files (Batch 5)'),
      'must contain the exact Batch 5 commit message (per D-05)'
    );
  });

  test('branch guard: references main', () => {
    const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
    assert.ok(
      content.includes('main'),
      'must include main branch guard'
    );
  });
});

// ─── GAP 2 (T1b): .gitignore Antigravity CLI block ──────────────────────────

describe('.gitignore Antigravity CLI block', () => {
  let gitignoreContent;

  test('.gitignore file exists and is readable', () => {
    assert.ok(fs.existsSync(GITIGNORE_PATH), `.gitignore not found at ${GITIGNORE_PATH}`);
    gitignoreContent = fs.readFileSync(GITIGNORE_PATH, 'utf8');
    assert.ok(gitignoreContent.length > 0, '.gitignore must be non-empty');
  });

  test('.gitignore contains .antigravity/ entry', () => {
    const content = fs.readFileSync(GITIGNORE_PATH, 'utf8');
    const lines = content.split('\n').map(l => l.trim());
    assert.ok(
      lines.includes('.antigravity/'),
      '.gitignore must contain a .antigravity/ line'
    );
  });

  test('.gitignore contains .antigravitycli/ entry', () => {
    const content = fs.readFileSync(GITIGNORE_PATH, 'utf8');
    const lines = content.split('\n').map(l => l.trim());
    assert.ok(
      lines.includes('.antigravitycli/'),
      '.gitignore must contain a .antigravitycli/ line'
    );
  });

  test('.gitignore contains .claudeignore entry (no trailing slash)', () => {
    const content = fs.readFileSync(GITIGNORE_PATH, 'utf8');
    const lines = content.split('\n').map(l => l.trim());
    // Must have .claudeignore exactly — not .claudeignore/
    assert.ok(
      lines.includes('.claudeignore'),
      '.gitignore must contain a .claudeignore line (file, not directory)'
    );
    assert.ok(
      !lines.includes('.claudeignore/'),
      '.claudeignore must NOT have a trailing slash (it is a file, not a directory)'
    );
  });

  test('.gitignore contains # Antigravity CLI comment block', () => {
    const content = fs.readFileSync(GITIGNORE_PATH, 'utf8');
    assert.ok(
      content.includes('# Antigravity CLI'),
      '.gitignore must include a # Antigravity CLI comment block'
    );
  });

  test('Antigravity entries are grouped under the comment block', () => {
    const content = fs.readFileSync(GITIGNORE_PATH, 'utf8');
    const commentIdx = content.indexOf('# Antigravity CLI');
    assert.ok(commentIdx !== -1, '# Antigravity CLI comment must be present');

    // After the comment, all three entries must appear before any other section header
    const afterComment = content.slice(commentIdx);
    const antigravityLineIdx = afterComment.indexOf('.antigravity/');
    const antigravitycliLineIdx = afterComment.indexOf('.antigravitycli/');
    const claudeignoreLineIdx = afterComment.indexOf('.claudeignore');

    assert.ok(antigravityLineIdx !== -1, '.antigravity/ must appear after # Antigravity CLI comment');
    assert.ok(antigravitycliLineIdx !== -1, '.antigravitycli/ must appear after # Antigravity CLI comment');
    assert.ok(claudeignoreLineIdx !== -1, '.claudeignore must appear after # Antigravity CLI comment');

    // Find next section comment after the Antigravity block
    const nextSectionMatch = afterComment.slice(1).match(/\n#\s/);
    if (nextSectionMatch) {
      const nextSectionIdx = nextSectionMatch.index + 1;
      assert.ok(
        antigravityLineIdx < nextSectionIdx,
        '.antigravity/ must be within the Antigravity CLI section'
      );
      assert.ok(
        antigravitycliLineIdx < nextSectionIdx,
        '.antigravitycli/ must be within the Antigravity CLI section'
      );
      assert.ok(
        claudeignoreLineIdx < nextSectionIdx,
        '.claudeignore must be within the Antigravity CLI section'
      );
    }
  });
});
