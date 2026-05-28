/**
 * Statusline SHA migration tests for STAT-01 and STAT-02.
 * Verifies hooks/gsd-statusline.js no longer contains the parseV() semver
 * block that was used for dev-install divergence detection in the stale-hooks
 * display path.
 *
 * Static source analysis only — no live hook invocation needed.
 * The stale-hooks display path is a pure string-formatting concern; the
 * assertion that parseV() is gone is fully falsifiable by reading source.
 */
'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const STATUSLINE_PATH = path.join(__dirname, '..', 'hooks', 'gsd-statusline.js');
const src = fs.readFileSync(STATUSLINE_PATH, 'utf8');

// ─── STAT-01: parseV() semver block is removed from statusline ───────────────

describe('STAT-01: gsd-statusline.js does not contain the parseV() semver block', () => {
  test('source does not define a parseV function or variable', () => {
    assert.ok(
      !src.includes('parseV'),
      'gsd-statusline.js must not contain "parseV" — the semver block must have been removed'
    );
  });
});

// ─── STAT-02: stale-hooks condition is a simple if guard with no IIFE or isDevInstall ──

describe('STAT-02: stale-hooks condition is simplified — no IIFE, no isDevInstall', () => {
  test('source does not reference isDevInstall variable', () => {
    assert.ok(
      !src.includes('isDevInstall'),
      'gsd-statusline.js must not contain "isDevInstall" — the dev-install divergence check must be gone'
    );
  });

  test('source does not contain an IIFE (() =>) adjacent to stale_hooks logic', () => {
    // Locate the stale_hooks block and assert the IIFE pattern is absent from it.
    // The old block had: const isDevInstall = (() => { ... })();
    // We look for the IIFE pattern globally since the old block was the only one
    // that used IIFEs in the stale-hooks display path.
    const staleHooksIdx = src.indexOf('stale_hooks');
    assert.ok(
      staleHooksIdx !== -1,
      'Expected stale_hooks reference to exist in gsd-statusline.js'
    );

    // Extract the region around stale_hooks (500 chars each direction is generous)
    const windowStart = Math.max(0, staleHooksIdx - 100);
    const windowEnd = Math.min(src.length, staleHooksIdx + 500);
    const staleHooksRegion = src.slice(windowStart, windowEnd);

    assert.ok(
      !staleHooksRegion.includes('(() =>'),
      'The stale_hooks block must not contain an IIFE (() =>) — the parseV block must have been removed'
    );
  });

  test('stale-hooks block has a single gsdUpdate += line (no branching for dev install)', () => {
    // The simplified block should be:
    //   if (cache.stale_hooks && cache.stale_hooks.length > 0) {
    //     gsdUpdate += '\x1b[31m...\x1b[0m │ ';
    //   }
    // The old block had TWO gsdUpdate += branches (dev-install vs normal).
    // We verify the stale_hooks region contains exactly one gsdUpdate assignment.
    const staleHooksIdx = src.indexOf('stale_hooks');
    // Find the enclosing if-block: start from the line before stale_hooks occurrence
    // and scan forward to find the closing brace of the if block.
    const blockStart = src.lastIndexOf('\n', staleHooksIdx);
    // Read 600 chars forward to capture the full if block
    const blockRegion = src.slice(blockStart, blockStart + 600);

    // Count gsdUpdate += occurrences in this region
    const matches = blockRegion.match(/gsdUpdate\s*\+=/g) || [];
    assert.ok(
      matches.length === 1,
      `Expected exactly 1 "gsdUpdate +=" in the stale_hooks block region, found ${matches.length}. ` +
        `The old dev-install branch added a second assignment — it must have been removed.`
    );
  });
});
