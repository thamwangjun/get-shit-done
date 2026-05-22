#!/usr/bin/env node
// Cross-platform test runner — resolves test file globs via Node
// instead of relying on shell expansion (which fails on Windows PowerShell/cmd).
// Propagates NODE_V8_COVERAGE so c8 collects coverage from the child process.
'use strict';

const { readdirSync } = require('fs');
const { join } = require('path');
const { execFileSync } = require('child_process');

const testDir = join(__dirname, '..', 'tests');
const allFiles = readdirSync(testDir)
  .filter(f => f.endsWith('.test.cjs'))
  .sort()
  .map(f => join('tests', f));

if (allFiles.length === 0) {
  console.error('No test files found in tests/');
  process.exit(1);
}

// Tests that mutate hooks/dist/ (shared filesystem state) must run serially
// and in isolation to avoid cross-file race conditions with concurrent installers.
// path.normalize ensures forward-slash literals match OS-native separators on Windows.
const SERIAL_FILES = new Set([
  'tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs',
].map(f => join(f)));  // join() with a single arg normalises separators cross-platform
const serialFiles = allFiles.filter(f => SERIAL_FILES.has(f));
const parallelFiles = allFiles.filter(f => !SERIAL_FILES.has(f));

const concurrency = process.env.TEST_CONCURRENCY
  ? `--test-concurrency=${process.env.TEST_CONCURRENCY}`
  : '--test-concurrency=4';

// Run parallel tests first
if (parallelFiles.length > 0) {
  try {
    execFileSync(process.execPath, ['--test', concurrency, ...parallelFiles], {
      stdio: 'inherit',
      env: { ...process.env },
    });
  } catch (err) {
    process.exit(err.status || 1);
  }
}

// Run serial (hooks/dist-mutating) tests with concurrency=1 to avoid races
if (serialFiles.length > 0) {
  try {
    execFileSync(process.execPath, ['--test', '--test-concurrency=1', ...serialFiles], {
      stdio: 'inherit',
      env: { ...process.env },
    });
  } catch (err) {
    process.exit(err.status || 1);
  }
}
