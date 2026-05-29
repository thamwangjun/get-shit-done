// allow-test-rule: source-text-is-the-product
// Regression tests for the Eta v4 rendering pipeline wired in Phase 45.
// TEST-01 performs a full Claude runtime install to a /tmp directory and walks
// all installed .md files to confirm no non-allowlisted @~/.claude/ references
// survive in the installed output.
// TEST-02 through TEST-05 invoke renderEtaContent directly on source files
// to verify Eta rendering behavior.

'use strict';

process.env.GSD_TEST_MODE = '1';

const { test, describe, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { createTempDir, cleanup } = require('./helpers.cjs');
const { renderEtaContent } = require('../bin/install.js');
const { installRuntimeArtifacts } = require('../bin/install.js');
const { EtaFileResolutionError } = require('eta');
const { loadSkillsManifest, resolveProfile } = require('../get-shit-done/bin/lib/install-profiles.cjs');

// Repo root — the views root Eta uses for include resolution at install time.
const REPO_ROOT = path.join(__dirname, '..');

const REAL_COMMANDS_DIR = path.join(__dirname, '..', 'commands', 'gsd');
const MANIFEST = loadSkillsManifest(REAL_COMMANDS_DIR);
const RESOLVED_CORE = resolveProfile({ modes: ['core'], manifest: MANIFEST });

// Intentional prose references to @~/.claude/ paths present in installed output.
// These are AI instruction strings, not unresolved Eta templates.
// Classification:
//   'prose'       — agent/workflow instruction text (e.g., "Read @~/.claude/...")
//   'conditional' — inside ${...} JS template literal expression preserved by Eta
//
// When a @~/.claude/ occurrence is NOT in this list and found by TEST-01, it is
// either an Eta template that should have been inlined (fix with <%~ include() %>)
// or a new intentional prose ref that must be added here.
const ALLOWED_INLINE_REFS = [
  // agents/gsd-debugger.md, agents/gsd-executor.md, agents/gsd-planner.md,
  // agents/gsd-phase-researcher.md, agents/gsd-verifier.md
  '@~/.claude/get-shit-done/references/project-skills-discovery.md',
  // agents/gsd-debugger.md
  '@~/.claude/get-shit-done/references/common-bug-patterns.md',
  // agents/gsd-executor.md
  '@~/.claude/get-shit-done/references/checkpoints.md',
  '@~/.claude/get-shit-done/references/execute-mvp-tdd.md',
  '@~/.claude/get-shit-done/templates/summary.md',
  // agents/gsd-planner.md
  '@~/.claude/get-shit-done/references/planner-antipatterns.md',
  '@~/.claude/get-shit-done/references/tdd.md',
  '@~/.claude/get-shit-done/references/planner-mvp-mode.md',
  '@~/.claude/get-shit-done/references/user-story-template.md',
  '@~/.claude/get-shit-done/references/skeleton-template.md',
  '@~/.claude/get-shit-done/references/planner-chunked.md',
  // agents/gsd-verifier.md
  '@~/.claude/get-shit-done/references/verify-mvp-mode.md',
  // commands/gsd/complete-milestone.md
  '@~/.claude/get-shit-done/workflows/complete-milestone.md',
  '@~/.claude/get-shit-done/templates/milestone-archive.md',
  // commands/gsd/extract-learnings.md
  '@~/.claude/get-shit-done/workflows/extract-learnings.md',
  // commands/gsd/mvp-phase.md
  '@~/.claude/get-shit-done/workflows/mvp-phase.md',
  // commands/gsd/ship.md
  '@~/.claude/get-shit-done/workflows/ship.md',
  // get-shit-done/references/planner-mvp-mode.md
  // (skeleton-template.md already listed above)
  // get-shit-done/references/verification-patterns.md
  // (checkpoints.md already listed above)
  // get-shit-done/workflows/discuss-phase/modes/advisor.md
  '@~/.claude/agents/gsd-advisor-researcher.md',
  // get-shit-done/workflows/discuss-phase/modes/power.md
  '@~/.claude/get-shit-done/workflows/discuss-phase-power.md',
  // get-shit-done/workflows/discuss-phase.md
  '@~/.claude/get-shit-done/references/scout-codebase.md',
  // get-shit-done/workflows/execute-phase.md (conditional — inside ${...} expression)
  '@~/.claude/get-shit-done/references/executor-examples.md',
  // get-shit-done/workflows/execute-phase.md (prose comment)
  '@~/.claude/get-shit-done/references/planner-antipatterns.md',
  // get-shit-done/workflows/mvp-phase.md
  '@~/.claude/get-shit-done/references/phase-argument-parsing.md',
  '@~/.claude/get-shit-done/references/spidr-splitting.md',
  // get-shit-done/workflows/plan-phase.md
  // (tdd.md, planner-mvp-mode.md, skeleton-template.md already listed)
  // get-shit-done/workflows/spec-phase.md
  '@~/.claude/get-shit-done/templates/spec.md',
  // get-shit-done/workflows/verify-work.md
  '@~/.claude/get-shit-done/workflows/diagnose-issues.md',
  // (verify-mvp-mode.md already listed)
  // get-shit-done/templates/codebase/structure.md
  '@~/.claude/get-shit-done/workflows/{name}.md',
  // get-shit-done/templates/phase-prompt.md
  // (checkpoints.md already listed)
];

// ─── TEST-01 ───────────────────────────────────────────────────────────────────

describe('TEST-01: No unexpected @~/.claude/ references survive in full Claude install output', () => {
  let tmpDir;
  afterEach(() => cleanup(tmpDir));

  test('Full Claude runtime install leaves no non-allowlisted @~/.claude/ refs in any installed .md file', () => {
    tmpDir = createTempDir('gsd-eta-test01-');
    installRuntimeArtifacts('claude', tmpDir, 'global', RESOLVED_CORE);

    // Walk every installed .md file and check for @~/.claude/ occurrences.
    // Any occurrence not covered by ALLOWED_INLINE_REFS is a test failure.
    // tmpDir is always in os.tmpdir() (e.g. /tmp) — never affects the live Claude install.
    const unexpected = [];

    function walkDir(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Non-line-anchored check (per D-01): match any occurrence, not just bare-line refs.
            if (line.includes('@~/.claude/')) {
              // Find all @~/.claude/ substrings on this line.
              let idx = 0;
              while ((idx = line.indexOf('@~/.claude/', idx)) !== -1) {
                const matchStr = line.slice(idx);
                // Check if this occurrence is covered by an allowlisted path (per D-02).
                const allowed = ALLOWED_INLINE_REFS.some(ref => matchStr.includes(ref));
                if (!allowed) {
                  unexpected.push({ file: fullPath, lineNo: i + 1, match: line.trim() });
                }
                idx += '@~/.claude/'.length;
              }
            }
          }
        }
      }
    }

    walkDir(tmpDir);

    if (unexpected.length > 0) {
      const details = unexpected.map(({ file, lineNo, match }) =>
        `Found unexpected @~/.claude/ reference in installed output:\n` +
        `  File: ${file}:${lineNo}\n` +
        `  Match: ${match}\n` +
        `\n` +
        `To resolve: if this is an intentional prose instruction for the AI (e.g., 'Read @~/.claude/...'),\n` +
        `add the exact path string to ALLOWED_INLINE_REFS in tests/install-eta-regression.test.cjs.\n` +
        `If this is an unresolved Eta template, fix the source file by replacing with <%~ include('...') %>.`
      ).join('\n\n---\n\n');
      assert.fail(`${unexpected.length} unexpected @~/.claude/ reference(s) found:\n\n${details}`);
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
