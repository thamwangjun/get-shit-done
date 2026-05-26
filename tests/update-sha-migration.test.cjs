/**
 * update-sha-migration.test.cjs
 *
 * Static content assertions for the Phase 43 SHA migration of
 * get-shit-done/workflows/update.md. Covers D-truths D-07 through D-11:
 * binary SHA equality in compare_versions, absence of dev-install/semver
 * branches, up-to-date display with SHA labels, no no-network sentinel
 * conditional branch, and all three grep -Eq SHA patterns present.
 *
 * All tests are static source analysis — no live workflow execution needed.
 */
'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const UPDATE_MD_PATH = path.join(__dirname, '..', 'get-shit-done', 'workflows', 'update.md');
const updateText = fs.readFileSync(UPDATE_MD_PATH, 'utf8');

// Extract the compare_versions step region for targeted assertions.
// Slice from the opening <step name="compare_versions"> tag to the closing </step> tag.
const compareVersionsStart = updateText.indexOf('<step name="compare_versions">');
const compareVersionsEnd = updateText.indexOf('</step>', compareVersionsStart);
const compareVersionsRegion = compareVersionsStart !== -1 && compareVersionsEnd !== -1
  ? updateText.slice(compareVersionsStart, compareVersionsEnd + '</step>'.length)
  : '';

// ─── D-07: Binary SHA equality (no semver ordering) ──────────────────────────

describe('D-07: binary SHA equality in compare_versions', () => {
  test('compare_versions step uses == for SHA comparison', () => {
    assert.ok(
      compareVersionsRegion.length > 0,
      'compare_versions step region must exist in update.md'
    );
    assert.ok(
      compareVersionsRegion.includes('=='),
      'compare_versions step must use == equality for SHA comparison'
    );
  });

  test('compare_versions step does not reference semver', () => {
    assert.ok(
      !compareVersionsRegion.toLowerCase().includes('semver'),
      'compare_versions step must not contain "semver" — SHA comparison has no ordering'
    );
  });

  test('compare_versions step does not implement semver ordering logic (greater-than branch)', () => {
    // The phrase "has no ordering" is acceptable documentation prose.
    // What must be absent is any greater-than/less-than ordering branch (e.g., ">" or "<" used
    // between version variables, or semver comparison operators).
    // We assert the known semver ordering patterns are absent.
    assert.ok(
      !compareVersionsRegion.includes('INSTALLED_VERSION > LATEST') &&
      !compareVersionsRegion.includes('INSTALLED_VERSION < LATEST') &&
      !compareVersionsRegion.includes('semver') &&
      !compareVersionsRegion.includes('compareVersions'),
      'compare_versions step must not contain semver ordering logic (>, <, compareVersions)'
    );
  });

  test('compare_versions step does not contain installed > latest semver branch', () => {
    assert.ok(
      !compareVersionsRegion.includes('installed > latest'),
      'compare_versions step must not contain "installed > latest" — semver ordering branch must be removed'
    );
  });

  test('compare_versions step does not reference dev-install', () => {
    assert.ok(
      !compareVersionsRegion.includes('dev-install') && !compareVersionsRegion.includes('devInstall'),
      'compare_versions step must not reference dev-install logic'
    );
  });
});

// ─── D-08: No dev-install warning branch anywhere in update.md ───────────────

describe('D-08: no dev-install warning branch in update.md', () => {
  test('update.md does not contain installed > latest', () => {
    assert.ok(
      !updateText.includes('installed > latest'),
      'update.md must not contain "installed > latest" — dev-install warning branch must be removed'
    );
  });

  test('update.md does not contain isDevInstall', () => {
    assert.ok(
      !updateText.includes('isDevInstall'),
      'update.md must not contain "isDevInstall" — the dev-install detection variable must be removed'
    );
  });
});

// ─── D-09: Up-to-date display shows SHA labels with correct message ───────────

describe('D-09: up-to-date display uses SHA labels and correct message', () => {
  test('update.md contains "Installed SHA:" label', () => {
    assert.ok(
      updateText.includes('Installed SHA:'),
      'update.md must contain "Installed SHA:" in the up-to-date display'
    );
  });

  test('update.md contains "Latest SHA:" label', () => {
    assert.ok(
      updateText.includes('Latest SHA:'),
      'update.md must contain "Latest SHA:" in the up-to-date display'
    );
  });

  test('update.md contains up-to-date message', () => {
    assert.ok(
      updateText.includes("You're already on the latest version"),
      'update.md must contain "You\'re already on the latest version" message'
    );
  });
});

// ─── D-10: No no-network sentinel used as conditional branch value ────────────

describe('D-10: no-network sentinel is not a conditional branch target', () => {
  test('update.md does not use no-network as an equality branch value', () => {
    // The sentinel may appear in grep -Eq patterns (which is acceptable),
    // but must not appear as a direct equality comparison target.
    assert.ok(
      !updateText.includes('= "no-network"'),
      'update.md must not contain \'= "no-network"\' — sentinel must not be used as a conditional branch value'
    );
    assert.ok(
      !updateText.includes("= 'no-network'"),
      "update.md must not contain \"= 'no-network'\" — sentinel must not be used as a conditional branch value"
    );
    assert.ok(
      !updateText.includes('== "no-network"'),
      'update.md must not contain \'== "no-network"\' — sentinel must not be a branch target'
    );
  });

  test('no-network appears exactly 3 times and only in grep -Eq pattern lines', () => {
    const occurrences = (updateText.match(/no-network/g) || []).length;
    assert.equal(
      occurrences,
      3,
      `Expected exactly 3 occurrences of "no-network" (one per grep -Eq pattern), found ${occurrences}`
    );
  });

  test('all no-network occurrences are within grep -Eq pattern lines', () => {
    const lines = updateText.split('\n');
    const noNetworkLines = lines.filter(line => line.includes('no-network'));
    for (const line of noNetworkLines) {
      assert.ok(
        line.includes('grep -Eq'),
        `Line containing "no-network" must be a grep -Eq pattern line, but found: ${line.trim()}`
      );
    }
  });
});

// ─── D-11: Three SHA grep patterns present ───────────────────────────────────

describe('D-11: three grep -Eq SHA patterns present in update.md', () => {
  test('grep -Eq SHA pattern appears exactly 3 times', () => {
    const pattern = "grep -Eq '^[0-9a-f]{7}|no-network'";
    const occurrences = updateText.split(pattern).length - 1;
    assert.equal(
      occurrences,
      3,
      `Expected exactly 3 occurrences of the grep -Eq SHA pattern, found ${occurrences}. ` +
        'All three VERSION file validations must use the SHA pattern (D-11).'
    );
  });

  test('semver grep pattern is absent from update.md', () => {
    assert.ok(
      !updateText.includes("grep -Eq '^[0-9]+\\.[0-9]+\\.[0-9]+'"),
      'update.md must not contain the semver grep -Eq pattern — all three must be SHA patterns (D-11)'
    );
  });
});
