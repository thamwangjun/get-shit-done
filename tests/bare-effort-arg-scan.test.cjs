'use strict';
// allow-test-rule: source-text-is-the-product

/**
 * Bare Effort Arg Scan
 *
 * Regression guard for quick task 260606-x8b (effort= keyword fix).
 * Verifies that no {*_effort_arg} token appears bare inside an Agent() invocation
 * — every such token must be preceded by `effort=` on the same invocation line.
 *
 * Detection algorithm:
 *   - Process each file char by char to track paren depth
 *   - When `Agent(` is encountered, set depth=1; `(` increments, `)` decrements
 *   - Lines where depth > 0 are inside an Agent() call
 *   - Within those lines, find {identifier_effort_arg} tokens
 *   - For each token, check the 7 characters before `{` — if not `effort=`, it's a violation
 *
 * Scope: agents/, get-shit-done/workflows/, commands/gsd/
 */

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

const SCAN_DIRS = [
  'agents',
  'get-shit-done/workflows',
  'commands/gsd',
];

// ─── File collection ─────────────────────────────────────────────────────────

function collectMarkdownFiles(dir) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...collectMarkdownFiles(fullPath));
      } else if (entry.name.endsWith('.md')) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  return results;
}

const ALL_FILES = [];
for (const dir of SCAN_DIRS) {
  ALL_FILES.push(...collectMarkdownFiles(path.join(ROOT, dir)));
}

// ─── Scanner ─────────────────────────────────────────────────────────────────

function scanForBareEffortArg(filePath, content) {
  const violations = [];
  const lines = content.split('\n');
  let depth = 0;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];

    // Process char by char to update depth and identify Agent() regions on this line.
    // Collect the ranges: array of [startCol, endCol] where depth > 0.
    const inAgentRanges = [];
    let rangeStart = depth > 0 ? 0 : -1;

    for (let ci = 0; ci < line.length; ci++) {
      // Detect "Agent(" transition: depth 0 → 1
      if (depth === 0 && line.slice(ci, ci + 6) === 'Agent(') {
        depth = 1;
        ci += 5; // advance past "Agent(" — the `(` is consumed here
        rangeStart = ci + 1; // inside Agent() starts after the `(`
        continue;
      }
      if (depth > 0) {
        if (line[ci] === '(') depth++;
        else if (line[ci] === ')') {
          depth--;
          if (depth === 0) {
            inAgentRanges.push([rangeStart, ci]);
            rangeStart = -1;
          }
        }
      }
    }
    // If depth > 0 at end of line, the Agent() call continues onto the next line
    if (depth > 0 && rangeStart !== -1) {
      inAgentRanges.push([rangeStart, line.length]);
    }

    // For each in-Agent range, scan for bare {*_effort_arg} tokens
    for (const [start, end] of inAgentRanges) {
      const segment = line.slice(start, end);
      const tokenRe = /\{[a-zA-Z_]+_effort_arg\}/g;
      let m;
      while ((m = tokenRe.exec(segment)) !== null) {
        const colInLine = start + m.index; // 0-based column of `{` in full line
        // Check 7 chars before `{` in the full line
        const prefix = colInLine >= 7 ? line.slice(colInLine - 7, colInLine) : line.slice(0, colInLine);
        if (!prefix.endsWith('effort=')) {
          violations.push({
            file: filePath,
            line: lineIdx + 1,
            col: colInLine + 1,
            token: m[0],
          });
        }
      }
    }
  }

  return violations;
}

describe('bare-effort-arg-scan: no bare {*_effort_arg} in Agent invocations', () => {
  test('no bare effort_arg tokens in agents/ and get-shit-done/workflows/ and commands/', () => {
    const violations = [];

    for (const file of ALL_FILES) {
      const relPath = path.relative(ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const fileViolations = scanForBareEffortArg(relPath, content);
      violations.push(...fileViolations);
    }

    assert.equal(
      violations.length,
      0,
      `Bare {*_effort_arg} tokens found inside Agent() invocations without effort= prefix.\n` +
      `Fix: use effort={token} (not bare {token}) in Agent() calls.\n` +
      violations.map(v => `  ${v.file}:${v.line}:${v.col} — ${v.token}`).join('\n')
    );
  });
});
