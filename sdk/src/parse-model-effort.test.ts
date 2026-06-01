import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseModelEffort,
  EFFORT_TOKENS,
  _resetEffortWarningCacheForTests,
} from './model-catalog.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

interface ParityCase {
  input: string;
  expectedModel: string;
  expectedEffort: string | null;
}

// Load shared fixture from tests/fixtures/ (../../tests/fixtures relative to sdk/src/)
const __filename = fileURLToPath(import.meta.url);
const fixtureDir = resolve(__filename, '..', '..', '..', 'tests', 'fixtures');
const cases: ParityCase[] = JSON.parse(
  readFileSync(resolve(fixtureDir, 'parse-model-effort.json'), 'utf-8')
);

// Canonical allowlist — the CJS parity suite asserts the same ordered list, so
// the two EFFORT_TOKENS Sets cannot drift without one side failing (IN-02).
const CANONICAL_EFFORT_TOKENS = ['low', 'medium', 'high', 'xhigh', 'max'];

// Shared warning template — must stay string-identical to the CJS mirror in
// get-shit-done/bin/lib/core.cjs (WR-01).
function expectedWarning(suffix: string, label: string, base: string): string {
  return (
    `gsd: warning — unknown effort suffix "${suffix}" in "${label}". ` +
    `Allowed efforts: ${CANONICAL_EFFORT_TOKENS.join(', ')}. ` +
    `Ignoring suffix and using model "${base}".\n`
  );
}

describe('parseModelEffort (TS/CJS parity)', () => {
  it.each(cases)('$input → { model: $expectedModel, effort: $expectedEffort }', (c) => {
    expect(parseModelEffort(c.input)).toEqual({ model: c.expectedModel, effort: c.expectedEffort });
  });
});

describe('parseModelEffort allowlist parity', () => {
  it('EFFORT_TOKENS matches the canonical list mirrored on the CJS side', () => {
    expect([...EFFORT_TOKENS]).toEqual(CANONICAL_EFFORT_TOKENS);
  });
});

describe('parseModelEffort warning-path parity (WR-02)', () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    _resetEffortWarningCacheForTests();
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  it('unknown suffix emits the exact shared warning text', () => {
    parseModelEffort('opus;hihg');
    expect(stderrSpy).toHaveBeenCalledTimes(1);
    expect(stderrSpy).toHaveBeenCalledWith(expectedWarning('hihg', 'opus;hihg', 'opus'));
  });

  it('warns exactly once per distinct label, then again after reset', () => {
    parseModelEffort('opus;zzz');
    parseModelEffort('opus;zzz');
    expect(stderrSpy).toHaveBeenCalledTimes(1);

    _resetEffortWarningCacheForTests();
    parseModelEffort('opus;zzz');
    expect(stderrSpy).toHaveBeenCalledTimes(2);
  });

  it('empty suffix (trailing ";") is silent — no warning (WR-04)', () => {
    expect(parseModelEffort('opus;')).toEqual({ model: 'opus', effort: null });
    expect(stderrSpy).not.toHaveBeenCalled();
  });
});
