/**
 * Regression test for bug #2801
 *
 * `/gsd-ingest-docs` was broken because:
 * 1. `workflows/ingest-docs.md` called `gsd-sdk query init.ingest-docs` but the
 *    installed binary is `gsd-tools` (not `gsd-sdk`).
 * 2. `gsd-tools init` had no `ingest-docs` case in its dispatch switch.
 *
 * The fix:
 * - Added `case 'ingest-docs'` to the `init` switch in `gsd-tools.cjs`.
 * - Exported `cmdInitIngestDocs` from `init.cjs`.
 * - Updated `workflows/ingest-docs.md` to call `gsd-tools init ingest-docs`.
 *
 * This test prevents regression of the dispatch omission.
 */

'use strict';

const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const childProc = require('node:child_process');
const { createTempProject, cleanup, TOOLS_PATH } = require('./helpers.cjs');

const REPO_ROOT = path.join(__dirname, '..');
const WORKFLOW_FILE = path.join(REPO_ROOT, 'get-shit-done', 'workflows', 'ingest-docs.md');

function spawnGsdTools(args, projectDir) {
  let stdout = '';
  let exitCode = 0;
  try {
    stdout = childProc.execFileSync(
      process.execPath,
      [TOOLS_PATH, ...args, '--cwd', projectDir],
      {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, GSD_SESSION_KEY: '' },
      }
    );
  } catch (err) {
    exitCode = err.status ?? 1;
    stdout = (err.stdout?.toString() ?? '') + (err.stderr?.toString() ?? '');
  }
  return { exitCode, stdout };
}

describe('bug-2801: gsd-tools init ingest-docs handler exists', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject('gsd-test-2801-');
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('init ingest-docs exits 0 (not "Unknown init workflow")', () => {
    const { exitCode, stdout } = spawnGsdTools(['init', 'ingest-docs', '--raw'], tmpDir);
    assert.strictEqual(exitCode, 0, `expected exit 0, got: ${stdout}`);
  });

  test('init ingest-docs returns JSON with project_exists field', () => {
    const { exitCode, stdout } = spawnGsdTools(['init', 'ingest-docs', '--raw'], tmpDir);
    assert.strictEqual(exitCode, 0);
    let json;
    try { json = JSON.parse(stdout.trim()); } catch { assert.fail(`non-JSON output: ${stdout}`); }
    assert.ok(Object.prototype.hasOwnProperty.call(json, 'project_exists'), 'project_exists present');
  });

  test('init ingest-docs returns JSON with planning_exists field', () => {
    const { exitCode, stdout } = spawnGsdTools(['init', 'ingest-docs', '--raw'], tmpDir);
    assert.strictEqual(exitCode, 0);
    const json = JSON.parse(stdout.trim());
    assert.ok(Object.prototype.hasOwnProperty.call(json, 'planning_exists'), 'planning_exists present');
  });

  test('init ingest-docs returns JSON with has_git field', () => {
    const { exitCode, stdout } = spawnGsdTools(['init', 'ingest-docs', '--raw'], tmpDir);
    assert.strictEqual(exitCode, 0);
    const json = JSON.parse(stdout.trim());
    assert.ok(Object.prototype.hasOwnProperty.call(json, 'has_git'), 'has_git present');
  });

  test('init ingest-docs returns JSON with project_path field', () => {
    const { exitCode, stdout } = spawnGsdTools(['init', 'ingest-docs', '--raw'], tmpDir);
    assert.strictEqual(exitCode, 0);
    const json = JSON.parse(stdout.trim());
    assert.ok(Object.prototype.hasOwnProperty.call(json, 'project_path'), 'project_path present');
    assert.ok(Object.prototype.hasOwnProperty.call(json, 'commit_docs'), 'commit_docs present');
  });

  test('planning_exists is true when .planning/ directory exists', () => {
    const { exitCode, stdout } = spawnGsdTools(['init', 'ingest-docs', '--raw'], tmpDir);
    assert.strictEqual(exitCode, 0);
    const json = JSON.parse(stdout.trim());
    assert.strictEqual(json.planning_exists, true, 'planning_exists should be true (.planning/ created by createTempProject)');
  });
});

describe('bug-2801: ingest-docs.md workflow uses #3668 SDK-resolution (no primary gsd-sdk call)', () => {
  test('no bash code block in ingest-docs.md calls gsd-sdk as a primary invocation', () => {
    const content = fs.readFileSync(WORKFLOW_FILE, 'utf-8');
    // Extract bash fenced code blocks structurally.
    const bashBlocks = [];
    const codeBlockRe = /```bash\r?\n([\s\S]*?)```/g;
    let m;
    while ((m = codeBlockRe.exec(content)) !== null) {
      bashBlocks.push(m[1]);
    }
    assert.ok(bashBlocks.length > 0, 'expected bash code blocks in workflow');

    // Check every non-comment line in every bash block for gsd-sdk references.
    const allSdkLines = bashBlocks
      .join('\n')
      .split('\n')
      .filter((line) => !/^\s*#/.test(line))
      .filter((line) => /\bgsd-sdk\b/.test(line));

    // The #3668 fallback block legitimately references gsd-sdk in exactly three ways:
    //   1. `command -v gsd-sdk` — PATH probe
    //   2. `GSD_SDK="gsd-sdk"` — variable assignment fallback
    //   3. `gsd-sdk not found` — error message
    // Filter these out; anything remaining is an illegitimate primary invocation.
    const illegitimateLines = allSdkLines.filter(
      (line) =>
        !/command\s+-v\s+gsd-sdk/.test(line) &&
        !/GSD_SDK="gsd-sdk"/.test(line) &&
        !/gsd-sdk not found/.test(line)
    );

    assert.deepStrictEqual(
      illegitimateLines,
      [],
      `primary gsd-sdk invocation found — only the #3668 fallback block may reference gsd-sdk: ${illegitimateLines.join(', ')}`
    );

    // Positive guard: no non-comment bash line may contain a primary literal gsd-sdk query/init call
    // (the original bug-2801 form: `gsd-sdk query init.ingest-docs` or `gsd-sdk init ...`).
    const primaryCalls = bashBlocks
      .join('\n')
      .split('\n')
      .filter((line) => !/^\s*#/.test(line))
      .filter((line) => /\bgsd-sdk\s+(query|init)\b/.test(line));

    assert.deepStrictEqual(
      primaryCalls,
      [],
      `primary literal gsd-sdk query/init call found (bug-2801 regression): ${primaryCalls.join(', ')}`
    );
  });

  test('ingest-docs.md init step uses canonical node-path gsd-tools.cjs invocation', () => {
    const content = fs.readFileSync(WORKFLOW_FILE, 'utf-8');
    // Parse fenced bash blocks structurally — do not match raw markdown text.
    const codeBlockRe = /```bash\r?\n([\s\S]*?)```/g;
    const bashLines = [...content.matchAll(codeBlockRe)]
      .flatMap((m) => m[1].split('\n'))
      .filter((l) => !/^\s*#/.test(l));

    // Under #3668, the workflow builds a GSD_TOOLS variable pointing to gsd-tools.cjs,
    // assigns GSD_SDK="node $GSD_TOOLS", then calls $GSD_SDK init ingest-docs.
    // Assert all three elements are present.
    const hasGsdToolsResolution = bashLines.some((l) =>
      /GSD_TOOLS=.*get-shit-done\/bin\/gsd-tools\.cjs/.test(l)
    );
    assert.ok(
      hasGsdToolsResolution,
      'workflow must resolve GSD_TOOLS to get-shit-done/bin/gsd-tools.cjs'
    );

    const hasGsdSdkNodeAssignment = bashLines.some((l) =>
      /GSD_SDK="node \$GSD_TOOLS"/.test(l)
    );
    assert.ok(
      hasGsdSdkNodeAssignment,
      'workflow must assign GSD_SDK="node $GSD_TOOLS" (canonical node-path form)'
    );

    const hasInitInvocation = bashLines.some((l) =>
      /\$GSD_SDK\s+(query\s+)?init.*ingest-docs\b|\$GSD_SDK\s+init\s+ingest-docs\b/.test(l)
    );
    assert.ok(
      hasInitInvocation,
      'workflow must invoke init ingest-docs via $GSD_SDK variable'
    );
  });

  test('cmdInitIngestDocs is exported from init.cjs', () => {
    const init = require(path.join(REPO_ROOT, 'get-shit-done', 'bin', 'lib', 'init.cjs'));
    assert.strictEqual(typeof init.cmdInitIngestDocs, 'function', 'cmdInitIngestDocs must be exported');
  });
});
