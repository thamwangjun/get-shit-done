'use strict';

/**
 * Eta template syntax enforcement.
 *
 * Only <%~ include(...) %> is allowed. The curly-brace form {%~ include(...) %}
 * is banned — it is the old syntax and must not appear in any command, workflow,
 * or agent file.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const SCANNED_DIRS = [
  path.join(ROOT, 'commands', 'gsd'),
  path.join(ROOT, 'get-shit-done', 'workflows'),
  path.join(ROOT, 'agents'),
];

function collectMdFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(dir, f));
}

describe('Eta template syntax — {%  is banned, only <% is allowed', () => {
  test('no .md file in commands/, workflows/, or agents/ contains {%', () => {
    const offenders = [];
    for (const dir of SCANNED_DIRS) {
      for (const file of collectMdFiles(dir)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('{%')) {
          const lines = content.split('\n');
          lines.forEach((line, i) => {
            if (line.includes('{%')) {
              offenders.push(`${path.relative(ROOT, file)}:${i + 1}: ${line.trim()}`);
            }
          });
        }
      }
    }
    assert.deepStrictEqual(
      offenders,
      [],
      `Banned Eta syntax {%  found (use <%  instead):\n${offenders.join('\n')}`
    );
  });
});
