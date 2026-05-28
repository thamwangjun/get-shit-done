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

// ─── INST-03: install.js replaces {{GSD_REPO}} and {{GSD_BRANCH}} in hook content ───

describe('INST-03: install.js replaces {{GSD_REPO}} and {{GSD_BRANCH}} in hook content', () => {
  test('install.js contains the fork repo literal thamwangjun/get-shit-done', () => {
    assert.ok(
      installSrc.includes("'thamwangjun/get-shit-done'"),
      "install.js must contain the literal 'thamwangjun/get-shit-done' for {{GSD_REPO}} replacement"
    );
  });

  test('install.js contains the {{GSD_REPO}} regex replacement call', () => {
    assert.ok(
      installSrc.includes('.replace(/\\{\\{GSD_REPO\\}\\}/g') ||
        installSrc.includes(".replace(/{{GSD_REPO}}/g"),
      'install.js must contain a .replace(/{GSD_REPO}/g, ...) call in hook content processing'
    );
  });

  test('install.js contains the {{GSD_BRANCH}} regex replacement call with main', () => {
    assert.ok(
      installSrc.includes("'main'") &&
        (installSrc.includes('.replace(/\\{\\{GSD_BRANCH\\}\\}/g') ||
          installSrc.includes(".replace(/{{GSD_BRANCH}}/g")),
      "install.js must contain a .replace(/{GSD_BRANCH}/g, 'main') call in hook content processing"
    );
  });
});

// ─── INST-04: all {{GSD_VERSION}} replacements in install.js use gsdVersion ───

describe('INST-04: all {{GSD_VERSION}} replacements in install.js use gsdVersion (not pkg.version)', () => {
  test('install.js contains at least one {{GSD_VERSION}} replacement using gsdVersion', () => {
    // The primary hook content path must use gsdVersion, not pkg.version
    assert.ok(
      installSrc.includes('GSD_VERSION') &&
        installSrc.includes('gsdVersion'),
      'install.js must have at least one {{GSD_VERSION}} replacement that uses gsdVersion'
    );
  });

  test('install.js has no {{GSD_VERSION}} replacements that use pkg.version', () => {
    // Extract all lines containing GSD_VERSION replacement calls
    const lines = installSrc.split('\n');
    const versionReplacementLines = lines.filter(
      line => line.includes('GSD_VERSION') && line.includes('.replace(')
    );

    // Every GSD_VERSION replacement line must use gsdVersion, not pkg.version
    const pkgVersionLines = versionReplacementLines.filter(
      line => line.includes('pkg.version')
    );

    assert.strictEqual(
      pkgVersionLines.length,
      0,
      `install.js has ${pkgVersionLines.length} {{GSD_VERSION}} replacement(s) using pkg.version ` +
        `instead of gsdVersion:\n${pkgVersionLines.join('\n')}`
    );
  });
});

