import { describe, it, expect } from 'vitest';
import { parseModelEffort } from './model-catalog.js';
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

describe('parseModelEffort (TS/CJS parity)', () => {
  it.each(cases)('$input → { model: $expectedModel, effort: $expectedEffort }', (c) => {
    expect(parseModelEffort(c.input)).toEqual({ model: c.expectedModel, effort: c.expectedEffort });
  });
});
