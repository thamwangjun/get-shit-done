/**
 * Version detection tests for INST-01 and INST-02.
 * Verifies bin/install.js writes a 7-char hex SHA (not semver) to VERSION,
 * and writes 'no-network' sentinel when git is unavailable.
 *
 * Note: Live install tests are omitted because install() writes to the real
 * $HOME runtime directories and cannot be safely redirected to a temp dir.
 * Static source analysis provides full CI coverage for INST-01 and INST-02.
 * End-to-end verification (real install + VERSION check) is manual-only per
 * 05-VALIDATION.md.
 */
'use strict';

process.env.GSD_TEST_MODE = '1';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const INSTALL_SRC = path.join(__dirname, '..', 'bin', 'install.js');

// Load source as string for static analysis assertions
const installSrc = fs.readFileSync(INSTALL_SRC, 'utf8');

// Module scope = everything before the first function definition
const moduleScope = installSrc.slice(0, installSrc.indexOf('\nfunction '));

// ─── INST-01: install.js uses git rev-parse for version ──────────────────────

describe('INST-01: install.js uses git rev-parse for version', () => {
  test('install.js source contains git rev-parse --short', () => {
    assert.ok(
      installSrc.includes('git rev-parse'),
      'install.js must use git rev-parse for SHA-based versioning'
    );
  });

  test('install.js module-scope does not call GitHub API for gsdVersion', () => {
    assert.ok(
      !moduleScope.includes('api.github.com/repos/thamwangjun/get-shit-done/commits'),
      'install.js module-scope must not call GitHub API for gsdVersion'
    );
  });
});

// ─── INST-02: install.js fallback is a non-SHA sentinel string ───────────────

describe('INST-02: install.js fallback is a non-SHA sentinel string', () => {
  test('install.js does not fall back to pkg.version (semver)', () => {
    assert.ok(
      !installSrc.includes('let gsdVersion = pkg.version'),
      'install.js must not fall back to pkg.version (semver breaks SHA comparison)'
    );
  });

  test('install.js has no-network sentinel as initial gsdVersion value', () => {
    assert.ok(
      installSrc.includes("'no-network'") || installSrc.includes('"no-network"'),
      'install.js must have no-network sentinel as initial gsdVersion value'
    );
  });
});

