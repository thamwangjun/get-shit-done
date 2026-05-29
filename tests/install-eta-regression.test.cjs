// allow-test-rule: source-text-is-the-product
// Regression tests for the Eta v4 rendering pipeline wired in Phase 45.
// TEST-01 checks installed skills output; TEST-02 through TEST-05 invoke
// renderEtaContent directly on source files to verify Eta rendering behavior.

'use strict';

process.env.GSD_TEST_MODE = '1';

const { test, describe, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { createTempDir, cleanup } = require('./helpers.cjs');
const { installRuntimeArtifacts, renderEtaContent } = require('../bin/install.js');
const { EtaFileResolutionError } = require('eta');

const {
  loadSkillsManifest,
  resolveProfile,
} = require('../get-shit-done/bin/lib/install-profiles.cjs');

const REAL_COMMANDS_DIR = path.join(__dirname, '..', 'commands', 'gsd');
const MANIFEST = loadSkillsManifest(REAL_COMMANDS_DIR);
const RESOLVED_CORE = resolveProfile({ modes: ['core'], manifest: MANIFEST });

// Repo root — the views root Eta uses for include resolution at install time.
const REPO_ROOT = path.join(__dirname, '..');

/**
 * Recursively walk a directory and return all .md file paths.
 * @param {string} dir - Directory to walk
 * @returns {string[]} Array of absolute .md file paths
 */
function walkMdFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkMdFiles(full));
    else if (entry.name.endsWith('.md')) results.push(full);
  }
  return results;
}

// ─── TEST-01 ───────────────────────────────────────────────────────────────────

describe('TEST-01: No unresolved @~/.claude/ references in installed output', () => {
  let tmpDir;
  afterEach(() => cleanup(tmpDir));

  test('Claude runtime install contains zero bare-line @~/.claude/ references', () => {
    tmpDir = createTempDir('gsd-eta-test01-');
    installRuntimeArtifacts('claude', tmpDir, 'global', RESOLVED_CORE);

    const mdFiles = walkMdFiles(tmpDir);
    assert.ok(mdFiles.length > 0, 'Install must produce at least one .md file');

    for (const filePath of mdFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      // Use a line-anchored regex to avoid false positives from the ${...} conditional
      // expression in execute-phase.md which contains '@~/.claude/' as an interior string
      // literal on a non-bare line (per RESEARCH.md pitfall 1). Lines starting with
      // '@~/.claude/' are unresolved include references; interior occurrences are not.
      assert.ok(
        !/^@~\/.claude\//m.test(content),
        `Unresolved bare-line @~/.claude/ found in installed file: ${filePath}`
      );
    }
  });
});

// ─── TEST-02 ───────────────────────────────────────────────────────────────────

describe('TEST-02: Conditional @~ expression preserved verbatim after Eta rendering', () => {
  test('Eta rendering of execute-phase.md preserves the ${...} conditional expression', () => {
    // Read the source file directly and render with Eta using the repo root as
    // viewsRoot — the same configuration used during install. This verifies that
    // Eta does NOT treat ${...} JS template literal expressions as include tags.
    const srcPath = path.join(REPO_ROOT, 'get-shit-done', 'workflows', 'execute-phase.md');
    assert.ok(fs.existsSync(srcPath), `execute-phase.md not found at ${srcPath}`);

    const source = fs.readFileSync(srcPath, 'utf8');
    const rendered = renderEtaContent(source, srcPath, REPO_ROOT);

    const EXPECTED = "${CONTEXT_WINDOW < 200000 ? '' : '@~/.claude/get-shit-done/references/executor-examples.md'}";
    assert.ok(
      rendered.includes(EXPECTED),
      `Eta rendering of execute-phase.md dropped the conditional @~ expression.\nExpected to find: ${EXPECTED}`
    );
  });
});

// ─── TEST-03 ───────────────────────────────────────────────────────────────────

describe('TEST-03: Inlined reference content present after Eta rendering of gsd-executor.md', () => {
  test('Eta rendering of gsd-executor.md inlines "Mandatory Initial Read" from mandatory-initial-read.md', () => {
    // Read the source file directly and render with Eta using the repo root as
    // viewsRoot. This confirms that Eta resolves the include directive at line 21
    // (<%~ include('get-shit-done/references/mandatory-initial-read.md') %>) and
    // inlines the referenced content.
    const srcPath = path.join(REPO_ROOT, 'agents', 'gsd-executor.md');
    assert.ok(fs.existsSync(srcPath), `gsd-executor.md not found at ${srcPath}`);

    const source = fs.readFileSync(srcPath, 'utf8');
    const rendered = renderEtaContent(source, srcPath, REPO_ROOT);

    assert.ok(
      rendered.includes('Mandatory Initial Read'),
      'Eta rendering of gsd-executor.md missing "Mandatory Initial Read" — Eta failed to inline mandatory-initial-read.md'
    );
  });
});

// ─── TEST-04 ───────────────────────────────────────────────────────────────────

describe('TEST-04: Circular include detection', () => {
  let tmpDir;
  afterEach(() => cleanup(tmpDir));

  test('Self-referencing include throws Error with fixture path in message', () => {
    tmpDir = createTempDir('gsd-eta-test04-');
    const fixturePath = path.join(tmpDir, 'a.md');
    // Fixture includes itself — produces RangeError in Eta which renderEtaContent converts
    // to a descriptive Error (per D-09, RESEARCH.md pitfall 2: pass tmpDir as viewsRoot)
    fs.writeFileSync(fixturePath, "<%~ include('a.md') %>");
    const content = fs.readFileSync(fixturePath, 'utf8');

    assert.throws(
      () => renderEtaContent(content, fixturePath, tmpDir),
      (err) => {
        assert.ok(!(err instanceof RangeError), 'Should be a descriptive Error, not raw RangeError');
        assert.ok(err.message.includes(fixturePath), `Error message should contain fixture path.\nGot: ${err.message}`);
        return true;
      }
    );
  });
});

// ─── TEST-05 ───────────────────────────────────────────────────────────────────

describe('TEST-05: Missing-file include throws EtaFileResolutionError', () => {
  let tmpDir;
  afterEach(() => cleanup(tmpDir));

  test('Include of nonexistent file throws EtaFileResolutionError naming the missing path', () => {
    tmpDir = createTempDir('gsd-eta-test05-');
    const fixturePath = path.join(tmpDir, 'bad-include.md');
    fs.writeFileSync(fixturePath, "<%~ include('nonexistent-path-xyz.md') %>");
    const content = fs.readFileSync(fixturePath, 'utf8');

    assert.throws(
      () => renderEtaContent(content, fixturePath, tmpDir),
      (err) => {
        assert.ok(err instanceof EtaFileResolutionError, `Expected EtaFileResolutionError, got ${err.constructor.name}`);
        assert.ok(
          err.message.includes('nonexistent-path-xyz.md'),
          `Error message should contain missing filename.\nGot: ${err.message}`
        );
        return true;
      }
    );
  });
});
