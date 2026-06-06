'use strict';
// allow-test-rule: source-text-is-the-product

/**
 * Null-Omit Comment Scan
 *
 * Regression guard for quick task 260607-0kd (null-omit comment convention).
 * Verifies that every standalone effort={*_effort_arg} line inside an Agent()
 * invocation carries the '# omit this line when' comment.
 *
 * Without the comment, the AI template engine will include the effort= parameter
 * even when the variable is null — passing a literal null value instead of omitting
 * the parameter. The comment signals to the AI to skip that line conditionally.
 *
 * Detection algorithm:
 *   - Process each file char by char to track paren depth
 *   - When `Agent(` is encountered, set depth=1; `(` increments, `)` decrements
 *   - Lines where depth > 0 are inside an Agent() call
 *   - Within those lines, find lines whose full content matches:
 *     /^\s*effort=\{([A-Za-z_][A-Za-z_0-9]*_effort_arg)\}/  (standalone anchor)
 *   - For each match, check for presence of '# omit this line when' substring
 *   - Missing comment = violation
 *
 * The standalone regex `^\s*effort=` excludes known inline cases (code-review-fix.md,
 * new-milestone.md, discuss-phase-assumptions.md) where effort= appears mid-line
 * alongside other Agent() parameters — those lines do not start with effort=.
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

function scanForMissingNullOmitComment(filePath, content) {
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

    // For each in-Agent range, check for standalone effort= lines missing null-omit comment
    if (inAgentRanges.length > 0) {
      const standaloneRe = /^\s*effort=\{([A-Za-z_][A-Za-z_0-9]*_effort_arg)\}/;
      const m = standaloneRe.exec(line);
      if (m && !line.includes('# omit this line when')) {
        violations.push({
          file: filePath,
          line: lineIdx + 1,
          col: line.indexOf('effort=') + 1,
          token: m[1],
        });
      }
    }
  }

  return violations;
}

describe('null-omit-comment-scan: effort= lines must carry null-omit comment', () => {
  test('every standalone effort={*_effort_arg} in Agent invocations has # omit this line when', () => {
    const violations = [];

    for (const file of ALL_FILES) {
      const relPath = path.relative(ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const fileViolations = scanForMissingNullOmitComment(relPath, content);
      violations.push(...fileViolations);
    }

    assert.equal(
      violations.length,
      0,
      `Standalone effort= lines found inside Agent() invocations without null-omit comment.\n` +
      `Fix: add  # omit this line when <condition>\n` +
      violations.map(v => `  ${v.file}:${v.line}:${v.col} — effort={${v.token}} missing null-omit comment`).join('\n')
    );
  });
});
