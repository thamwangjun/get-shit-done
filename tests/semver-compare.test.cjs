/**
 * Tests for the isNewer() SHA comparison function used in gsd-check-update-worker.js.
 *
 * WHY DUPLICATED: isNewer() lives inside gsd-check-update-worker.js as a
 * plain function — it runs in a detached child process that has no module
 * exports. The function cannot be require()'d from this test file.
 * We mirror the implementation here so the logic is testable in isolation.
 * If the worker's implementation diverges from this copy, update this mirror.
 */
'use strict';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WORKER_PATH = path.join(__dirname, '..', 'hooks', 'gsd-check-update-worker.js');
const workerSrc = fs.readFileSync(WORKER_PATH, 'utf8');

// Mirror of isNewer() from hooks/gsd-check-update-worker.js
function isNewer(latest, installed) {
  return !!latest && latest.slice(0, 7) !== installed;
}

describe('isNewer (SHA equality)', () => {
  test('same 7-char SHA — no update', () => {
    assert.strictEqual(isNewer('a1b2c3d', 'a1b2c3d'), false);
  });

  test('different 7-char SHA — update available', () => {
    assert.strictEqual(isNewer('b2c3d4e', 'a1b2c3d'), true);
  });

  test('full 40-char SHA — truncates to 7 for comparison (match)', () => {
    assert.strictEqual(isNewer('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', 'a1b2c3d'), false);
  });

  test('full 40-char SHA — truncates to 7 for comparison (mismatch)', () => {
    assert.strictEqual(isNewer('b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3', 'a1b2c3d'), true);
  });

  test('null latest — no false positive', () => {
    assert.strictEqual(isNewer(null, 'a1b2c3d'), false);
  });

  test('undefined latest — no false positive', () => {
    assert.strictEqual(isNewer(undefined, 'a1b2c3d'), false);
  });

  test('empty string latest — no false positive', () => {
    assert.strictEqual(isNewer('', 'a1b2c3d'), false);
  });

  test('null latest on API failure — no false positive (D-06 fallback)', () => {
    // D-06: GitHub API unavailable → latest variable remains null in writeResult()
    // update_available line receives null → false
    assert.strictEqual(isNewer(null, 'a1b2c3d'), false);
  });

  test('installed is unknown — real SHA differs from unknown', () => {
    // If VERSION file is missing, installed = 'unknown'. A real SHA will differ.
    assert.strictEqual(isNewer('a1b2c3d', 'unknown'), true);
  });
});

// ─── HOOK-03: worker defines isNewer before writeResult uses it ───────────────
// Static analysis: verifies the ReferenceError fix — isNewer must be defined
// (appear as a function declaration) before the writeResult() call that
// invokes isNewer(latest, installed).

describe('HOOK-03: worker source — isNewer defined before use', () => {
  test('worker source contains function isNewer definition', () => {
    assert.ok(
      workerSrc.includes('function isNewer'),
      'Expected "function isNewer" to be present in gsd-check-update-worker.js'
    );
  });

  test('isNewer is defined before writeResult in source order', () => {
    const isNewerPos = workerSrc.indexOf('function isNewer');
    const writeResultDefPos = workerSrc.indexOf('function writeResult');
    assert.ok(isNewerPos !== -1, '"function isNewer" not found in worker source');
    assert.ok(writeResultDefPos !== -1, '"function writeResult" not found in worker source');
    assert.ok(
      isNewerPos < writeResultDefPos,
      'isNewer must be defined before writeResult (which calls isNewer)'
    );
  });

  test('writeResult definition calls isNewer', () => {
    const writeResultDefPos = workerSrc.indexOf('function writeResult');
    // Find the closing brace of writeResult by scanning after its start
    const bodySlice = workerSrc.slice(writeResultDefPos, writeResultDefPos + 300);
    assert.ok(
      bodySlice.includes('isNewer('),
      'writeResult body must call isNewer()'
    );
  });
});

// ─── HOOK-04: worker fetches from fork's GitHub repo, not npm registry ───────
// Static analysis: verifies the URL is the fork's GitHub Commits API endpoint.

describe('HOOK-04: worker source — GitHub API endpoint, not npm registry', () => {
  test('worker source contains fork GitHub repo URL', () => {
    assert.ok(
      workerSrc.includes('{{GSD_REPO}}'),
      'Expected "{{GSD_REPO}}" template in worker source (fork GitHub URL)'
    );
  });

  test('worker source uses https.get for the fetch call', () => {
    assert.ok(
      workerSrc.includes('https.get'),
      'Expected "https.get" in worker source (GitHub API fetch)'
    );
  });

  test('worker source does not contact npmjs.com', () => {
    assert.ok(
      !workerSrc.includes('npmjs.com'),
      'Worker must not reference npmjs.com (old npm registry approach)'
    );
  });

  test('worker source does not reference the upstream npm package name', () => {
    assert.ok(
      !workerSrc.includes('get-shit-done-cc'),
      'Worker must not reference "get-shit-done-cc" (old npm package name)'
    );
  });

  test('worker source uses the GitHub Commits API path', () => {
    assert.ok(
      workerSrc.includes('api.github.com/repos/{{GSD_REPO}}/commits/{{GSD_BRANCH}}'),
      'Worker must call the GitHub Commits API using {{GSD_REPO}}/{{GSD_BRANCH}} templates'
    );
  });
});
