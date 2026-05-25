// allow-test-rule: source-text-is-the-product
// Reads commands/gsd/*.md product files whose deployed text IS what the
// runtime loads — testing text content tests the deployed contract.

/**
 * Ensures all @ file-reference notation in commands/gsd/ has been converted
 * to shell-cat form: `!`cat $HOME/...`` or `!`cat relative/path``.
 *
 * @ notation (e.g. @~/.claude/..., @$HOME/..., @.planning/...) is the legacy
 * Claude Code "mention file" syntax. The canonical form is the shell-cat
 * equivalent so that the reference is explicit and runtime-agnostic.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const COMMANDS_DIR = path.join(__dirname, '..', 'commands', 'gsd');

// Lines starting with @ followed by a path indicator (file reference notation)
const AT_NOTATION_RE = /^@(?:~|\/|\$|\.)/;

function getCommandFiles() {
  return fs.readdirSync(COMMANDS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(COMMANDS_DIR, f));
}

describe('commands/gsd @ notation conversion', () => {
  test('no @ file-reference notation remains in any command file', () => {
    const files = getCommandFiles();
    assert.ok(files.length > 0, 'Expected command files to exist');

    const violations = [];

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (AT_NOTATION_RE.test(lines[i])) {
          violations.push(`${path.basename(filePath)}:${i + 1}: ${lines[i].trim()}`);
        }
      }
    }

    assert.strictEqual(
      violations.length,
      0,
      `Found ${violations.length} @ notation line(s) that must be converted to shell-cat form:\n${violations.join('\n')}`,
    );
  });

  test('no ! notation has a space before the backtick', () => {
    const files = getCommandFiles();
    const violations = [];

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        // Catch `! ` followed by a backtick — the space is wrong
        if (/^! `/.test(lines[i])) {
          violations.push(`${path.basename(filePath)}:${i + 1}: ${lines[i].trim()}`);
        }
      }
    }

    assert.strictEqual(
      violations.length,
      0,
      `Found ${violations.length} ! notation line(s) with a space before the backtick (must be !\`...\`, not ! \`...\`):\n${violations.join('\n')}`,
    );
  });

  test('converted lines use shell-cat form', () => {
    const files = getCommandFiles();
    const catLines = [];

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        // Collect lines that look like shell-cat conversions
        if (/^!`cat /.test(lines[i])) {
          catLines.push({ file: path.basename(filePath), line: i + 1, text: lines[i] });
        }
      }
    }

    // All shell-cat lines must reference a valid-looking path
    for (const { file, line, text } of catLines) {
      assert.match(
        text,
        /^!`cat (?:\$HOME\/|\.)/,
        `${file}:${line}: shell-cat line must start with $HOME/ or relative path: ${text}`,
      );
    }
  });
});
