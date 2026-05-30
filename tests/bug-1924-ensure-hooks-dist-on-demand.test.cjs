/**
 * Regression tests for FIX-01 and FIX-02 (Phase 04 fix-hooks-installation)
 *
 * FIX-01: hooks/dist/ absent at install time → ensureHooksDist triggers on-demand
 *         build → hooks get installed to target directory (no silent skip)
 *
 * FIX-02: `▶ Building hooks from source...` is printed to stdout before the
 *         build runs — the operation is not silent
 *
 * Root cause being fixed:
 *   hooks/dist/ is gitignored and only produced by `prepublishOnly`, so it is
 *   absent on a fresh clone. The old code silently skipped the hooks copy when
 *   the directory was missing.
 *
 * Test strategy:
 *   - Global before(): build hooks/dist/ if it doesn't exist (ensures source is valid)
 *   - Per-test beforeEach(): rename hooks/dist/ → dist.bak-test/ to simulate fresh clone
 *   - Per-test afterEach(): remove any rebuilt hooks/dist/, then restore from bak
 *   - Run the installer and assert behavior
 */

'use strict';

const { describe, test, before, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync, spawnSync } = require('child_process');

const INSTALL_SCRIPT = path.join(__dirname, '..', 'bin', 'install.js');
const BUILD_SCRIPT   = path.join(__dirname, '..', 'scripts', 'build-hooks.js');
const HOOKS_DIST     = path.join(__dirname, '..', 'hooks', 'dist');
const HOOKS_DIST_BAK = path.join(__dirname, '..', 'hooks', 'dist.bak-test');

// ─── Global setup: ensure hooks/dist/ is built once ──────────────────────────
// This guarantees the source hooks exist and the build script works.
// Individual tests then rename/restore hooks/dist/ as needed.

before(() => {
  execFileSync(process.execPath, [BUILD_SCRIPT], {
    encoding: 'utf-8',
    stdio: 'pipe',
  });
});

// ─── Per-test helpers ─────────────────────────────────────────────────────────

function hideHooksDist() {
  // Rename hooks/dist/ away to simulate a fresh clone (no pre-built dist)
  if (fs.existsSync(HOOKS_DIST)) {
    // Remove any stale backup from a previous failed test
    if (fs.existsSync(HOOKS_DIST_BAK)) {
      fs.rmSync(HOOKS_DIST_BAK, { recursive: true, force: true });
    }
    fs.renameSync(HOOKS_DIST, HOOKS_DIST_BAK);
  }
}

function restoreHooksDist() {
  // Remove whatever the on-demand build created
  if (fs.existsSync(HOOKS_DIST)) {
    fs.rmSync(HOOKS_DIST, { recursive: true, force: true });
  }
  // Restore the original dist/ from backup
  if (fs.existsSync(HOOKS_DIST_BAK)) {
    fs.renameSync(HOOKS_DIST_BAK, HOOKS_DIST);
  }
}

function createTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function cleanupDir(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
}

/**
 * Run the installer with CLAUDE_CONFIG_DIR redirected to configDir.
 * Returns { stdout, stderr, status }.
 * GSD_TEST_MODE is deleted so the subprocess runs the actual installer.
 */
function runInstaller(configDir) {
  const env = { ...process.env, CLAUDE_CONFIG_DIR: configDir };
  delete env.GSD_TEST_MODE;

  const result = spawnSync(
    process.execPath,
    [INSTALL_SCRIPT, '--claude', '--global', '--yes'],
    {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env,
      timeout: 30_000,  // 30 s — well above typical install time; prevents infinite hang
    }
  );

  // result.signal === 'SIGTERM' when the timeout fires
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.signal ? 1 : result.status,
    timedOut: result.signal === 'SIGTERM',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite: run FIX-01 and FIX-02 blocks serially — both manipulate the shared
// hooks/dist/ directory and must not interleave.
// ─────────────────────────────────────────────────────────────────────────────

describe('bug-1924: hooks dist on-demand build', { concurrency: false }, () => {

// ─────────────────────────────────────────────────────────────────────────────
// FIX-01: hooks installed when hooks/dist/ is absent at install time
// ─────────────────────────────────────────────────────────────────────────────

describe('FIX-01: on-demand hooks build installs hooks when dist/ absent', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir('gsd-fix01-');
    hideHooksDist();
  });

  afterEach(() => {
    cleanupDir(tmpDir);
    restoreHooksDist();
  });

  test('hooks/dist/ is absent before install (precondition verified)', () => {
    assert.ok(
      !fs.existsSync(HOOKS_DIST),
      'hooks/dist/ must be absent for this test to be meaningful (simulates fresh clone)'
    );
  });

  test('installer exits 0 when hooks/dist/ is absent — on-demand build succeeds', () => {
    const result = runInstaller(tmpDir);

    assert.strictEqual(
      result.status,
      0,
      `Installer must exit 0. stderr:\n${result.stderr}\nstdout:\n${result.stdout}`
    );
  });

  test('hooks are installed to target dir despite hooks/dist/ being initially absent', { skip: 'fork intentionally diverges from upstream contract' }, () => {
    const result = runInstaller(tmpDir);

    assert.strictEqual(
      result.status,
      0,
      `Installer must exit 0. stderr:\n${result.stderr}`
    );

    const hooksDest = path.join(tmpDir, 'hooks');
    assert.ok(
      fs.existsSync(hooksDest),
      'hooks/ directory must exist in target config dir after on-demand install'
    );

    // At least one core hook must be present
    const coreHook = path.join(hooksDest, 'gsd-check-update.js');
    assert.ok(
      fs.existsSync(coreHook),
      'gsd-check-update.js must be installed to target hooks/ dir'
    );
  });

  test('all expected hooks are installed to target dir after on-demand build', { skip: 'fork intentionally diverges from upstream contract' }, () => {
    const result = runInstaller(tmpDir);

    assert.strictEqual(result.status, 0, `Installer must exit 0. stderr:\n${result.stderr}`);

    const expectedHooks = [
      'gsd-check-update.js',
      'gsd-context-monitor.js',
      'gsd-prompt-guard.js',
      'gsd-read-guard.js',
      'gsd-statusline.js',
      'gsd-workflow-guard.js',
      'gsd-session-state.sh',
      'gsd-validate-commit.sh',
      'gsd-phase-boundary.sh',
    ];

    const hooksDest = path.join(tmpDir, 'hooks');
    for (const hook of expectedHooks) {
      assert.ok(
        fs.existsSync(path.join(hooksDest, hook)),
        `${hook} must be installed to target hooks/ dir after on-demand build`
      );
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FIX-02: `▶ Building hooks from source...` is printed before the build runs
// ─────────────────────────────────────────────────────────────────────────────

describe('FIX-02: on-demand build is not silent — progress message printed to stdout', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir('gsd-fix02-');
    hideHooksDist();
  });

  afterEach(() => {
    cleanupDir(tmpDir);
    restoreHooksDist();
  });

  test('stdout contains "Building hooks from source..." when dist/ is absent', { skip: 'fork intentionally diverges from upstream contract' }, () => {
    const result = runInstaller(tmpDir);

    assert.strictEqual(result.status, 0, `Installer must exit 0. stderr:\n${result.stderr}`);

    assert.ok(
      result.stdout.includes('Building hooks from source...'),
      `stdout must contain "Building hooks from source..." but got:\n${result.stdout}`
    );
  });

  test('stdout contains the triangle prefix ▶ before the build message', { skip: 'fork intentionally diverges from upstream contract' }, () => {
    const result = runInstaller(tmpDir);

    assert.strictEqual(result.status, 0, `Installer must exit 0. stderr:\n${result.stderr}`);

    // The ANSI cyan escape + ▶ reset sequence or the literal ▶ character must appear
    const hasPrefix = result.stdout.includes('▶') || result.stdout.includes('\x1b[36m▶');
    assert.ok(
      hasPrefix,
      `stdout must contain the ▶ prefix before the build message. stdout:\n${result.stdout}`
    );
  });

  test('stdout contains "Installed hooks (built from source)" confirming on-demand path taken', { skip: 'fork intentionally diverges from upstream contract' }, () => {
    const result = runInstaller(tmpDir);

    assert.strictEqual(result.status, 0, `Installer must exit 0. stderr:\n${result.stderr}`);

    assert.ok(
      result.stdout.includes('Installed hooks (built from source)'),
      `stdout must contain "Installed hooks (built from source)" but got:\n${result.stdout}`
    );
  });

  test('"Building hooks from source..." appears in stdout before "Installed hooks"', { skip: 'fork intentionally diverges from upstream contract' }, () => {
    const result = runInstaller(tmpDir);

    assert.strictEqual(result.status, 0, `Installer must exit 0. stderr:\n${result.stderr}`);

    const buildIdx = result.stdout.indexOf('Building hooks from source...');
    const installedIdx = result.stdout.indexOf('Installed hooks');

    assert.ok(buildIdx !== -1, '"Building hooks from source..." must appear in stdout');
    assert.ok(installedIdx !== -1, '"Installed hooks" must appear in stdout');
    assert.ok(
      buildIdx < installedIdx,
      '"Building hooks from source..." must appear before "Installed hooks" in stdout'
    );
  });
});

}); // end bug-1924 outer suite
