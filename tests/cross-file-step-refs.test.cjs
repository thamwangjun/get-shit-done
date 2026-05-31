'use strict';

/**
 * cross-file-step-refs.test.cjs
 *
 * Cross-file step reference integrity scanner (XREF-01, D-04, D-05, D-06, D-08).
 *
 * Invariant: Every prose cross-file reference of the form
 *   "<file>.md step N"  (Pattern 1)  OR
 *   "step N in <file>.md"  (Pattern 2)
 * in SCAN_DIRS must point at a real Step N heading or Pattern D ordered-list
 * item in the target file.
 *
 * Same-file refs are skipped (D-04): if the file referencing equals the file
 * being referenced, the ref is internal and not classified as cross-file.
 *
 * Code-fenced refs and code-fenced target steps are both skipped (D-05 —
 * symmetric fence skip per RESEARCH.md Pitfall 3).
 *
 * Future upstream merges that break this invariant will fail CI — no more
 * manual cross-file ref audits each merge cycle (XREF-01).
 */

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJECT_ROOT = path.join(__dirname, '..');

// Directories containing prompt files to scan
// (literal copy from tests/step-numbering-scan.test.cjs:36-40 — scope synchronization)
const SCAN_DIRS = [
  'agents',
  'get-shit-done/workflows',
  'commands/gsd',
];

// Pattern C files excluded from all corpus subtests (per CONTEXT.md D-07)
// (literal copy from tests/step-numbering-scan.test.cjs:43-47 — scope synchronization)
const PATTERN_C_EXCLUDES = new Set([
  'get-shit-done/workflows/plan-phase.md',
  'get-shit-done/workflows/new-milestone.md',
  'get-shit-done/workflows/new-project.md',
]);

// Cross-file ref discovery patterns — two word-order variants per D-04.
// Capture group asymmetry:
//   XREF_PATTERNS[0]: m[1] = filename, m[2] = step number
//   XREF_PATTERNS[1]: m[1] = step number, m[2] = filename
// Only whole-integer step numbers captured (no fractional suffix) — decimal refs
// are the normalize script's domain; cross-file integrity validates whole-integer refs.
const XREF_PATTERNS = [
  /([a-z0-9_./-]+\.md)\s+step\s+(\d+)/gi,
  /step\s+(\d+)\s+in\s+([a-z0-9_./-]+\.md)/gi,
];

// ─── File collection ─────────────────────────────────────────────────────────

// collectMarkdownFiles duplicated inline per Phase 48 D-06 — do NOT add to tests/helpers.cjs.
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
    // Tolerate missing directories (ENOENT) only — skip them silently.
    // Re-throw unexpected errors so they surface rather than causing silent empty scans.
    if (err.code !== 'ENOENT') throw err;
  }
  return results;
}

// Collect all markdown files from SCAN_DIRS — identical to step-numbering-scan.test.cjs:55-63
const ALL_FILES = [];
for (const dir of SCAN_DIRS) {
  ALL_FILES.push(...collectMarkdownFiles(path.join(PROJECT_ROOT, dir)));
}

// Filter out Pattern C files from corpus subtests
const SCAN_FILES = ALL_FILES.filter(f =>
  !PATTERN_C_EXCLUDES.has(path.relative(PROJECT_ROOT, f).split(path.sep).join('/'))
);

// Build a fast target-lookup index keyed by basename → array of absolute paths.
// Populated from ALL_FILES (not filtered) — target files may be Pattern C
// if a cross-file ref points at them; the scanner only ASSERTS over SCAN_FILES
// as the source set.
// Multiple files can share the same basename (e.g., commands/gsd/execute-phase.md
// and get-shit-done/workflows/execute-phase.md). A cross-file ref to execute-phase.md
// is valid if step N exists in ANY of the files with that basename — the thin command
// file delegates to the workflow, which is the canonical step owner.
const FILES_BY_BASENAME = new Map();
for (const file of ALL_FILES) {
  const key = path.basename(file);
  if (!FILES_BY_BASENAME.has(key)) {
    FILES_BY_BASENAME.set(key, []);
  }
  FILES_BY_BASENAME.get(key).push(file);
}

// ─── Detection helpers ────────────────────────────────────────────────────────

/**
 * Extract the set of valid whole-integer step labels in a target file.
 * Skips content inside code fences (D-05 — symmetric fence skip).
 *
 * Heading match: ## Step N, ### Step N, **Step N:** — whole integer only.
 * Negative lookahead excludes decimals and letter suffixes.
 *
 * Pattern D match: ordered-list item at column 0-2 (`N. `).
 *
 * @param {string} content - Full file content
 * @returns {Set<number>} Set of valid step numbers
 */
function extractStepSet(content) {
  const stepSet = new Set();
  const lines = content.split('\n');
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code fence toggle (D-05 — symmetric skip on target-step extraction side)
    if (/^```/.test(trimmed)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Headings: ## Step N, ### Step N, **Step N:** — whole integer, no decimals/letters
    const headingMatch = trimmed.match(/^(?:#{1,6}\s+|\*?\*?)Step\s+(\d+)(?!\d|\.|[a-z])/i);
    if (headingMatch) {
      stepSet.add(parseInt(headingMatch[1], 10));
    }

    // Pattern D ordered-list items at column 0-2 (`N. `)
    const listMatch = line.match(/^\s{0,2}(\d+)\.\s/);
    if (listMatch) {
      stepSet.add(parseInt(listMatch[1], 10));
    }
  }

  return stepSet;
}

/**
 * Find all cross-file step references in a source file.
 * Skips content inside code fences (D-05 — symmetric fence skip on source-ref side).
 * Skips same-file refs (D-04 + RESEARCH.md Pitfall 4).
 *
 * @param {string} sourceFile - Absolute path to source file
 * @param {string} content - Full file content
 * @returns {Array<{lineNumber: number, targetBasename: string, step: number, context: string}>}
 */
function findCrossFileRefs(sourceFile, content) {
  const refs = [];
  const lines = content.split('\n');
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code fence toggle (D-05 — symmetric skip on source-ref extraction side; Pitfall 3)
    if (/^```/.test(trimmed)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Apply both XREF_PATTERNS to each non-fenced line
    for (const re of XREF_PATTERNS) {
      // Reset lastIndex before each exec loop — /g regexes carry mutable state across calls
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        // Determine capture-group mapping from the asymmetric pattern variants:
        //   Pattern 1 (m[1] ends with .md): m[1]=file, m[2]=step
        //   Pattern 2 (m[1] does not end with .md): m[1]=step, m[2]=file
        let matchedFile, matchedStep;
        if (m[1] && m[1].endsWith('.md')) {
          matchedFile = m[1];
          matchedStep = m[2];
        } else {
          matchedStep = m[1];
          matchedFile = m[2];
        }

        const targetBasename = path.basename(matchedFile);
        // stepNum is always a valid integer: XREF_PATTERNS use (\d+) which
        // guarantees non-empty digit characters; parseInt on non-empty digits
        // is always a finite integer, never NaN.
        const stepNum = parseInt(matchedStep, 10);

        // Same-file ref skip (D-04 + RESEARCH.md Pitfall 4):
        // Require BOTH basename equality AND path-suffix endsWith to agree
        // before classifying as same-file. Naive endsWith alone produces false
        // negatives on basename collisions across different paths.
        const isSameBasename = path.basename(sourceFile) === targetBasename;
        const sourceRelPath = path.relative(PROJECT_ROOT, sourceFile).split(path.sep).join('/');
        const isSameBySuffix = sourceRelPath === matchedFile ||
                               sourceRelPath.endsWith('/' + targetBasename);
        if (isSameBasename && isSameBySuffix) continue;
        // Conservative: if only basename matches (no suffix match), still treat as same-file
        if (isSameBasename) continue;

        refs.push({
          lineNumber: i + 1,
          targetBasename,
          step: stepNum,
          context: trimmed,
        });
      }
    }
  }

  return refs;
}

// ─── Unit tests: extractStepSet() ────────────────────────────────────────────

describe('extractStepSet() — synthetic content', () => {
  test('detects whole-integer **Step N:** heading', () => {
    const result = extractStepSet('**Step 5:** thing\n');
    assert.ok(result.has(5), 'Set must contain 5');
    assert.equal(result.size, 1, 'Set must have size 1');
  });

  test('detects ## Step N heading', () => {
    const result = extractStepSet('## Step 7\n');
    assert.ok(result.has(7), 'Set must contain 7');
  });

  test('detects Pattern D ordered-list item at column 0', () => {
    const result = extractStepSet('5. **Worktree cleanup**\n');
    assert.ok(result.has(5), 'Set must contain 5');
  });

  test('detects Pattern D ordered-list item at column 2', () => {
    const result = extractStepSet('  5. **Nested**\n');
    assert.ok(result.has(5), 'Set must contain 5');
  });

  test('skips Pattern D inside code fence (per D-05)', () => {
    const result = extractStepSet('```\n5. inside fence\n```\n');
    assert.equal(result.size, 0, 'Pattern D inside code fence must not be extracted');
  });

  test('skips **Step N:** inside code fence (per D-05 — symmetric)', () => {
    const result = extractStepSet('```\n**Step 5:** inside fence\n```\n');
    assert.equal(result.size, 0, '**Step N:** inside code fence must not be extracted');
  });

  test('skips decimal labels (whole-integer only)', () => {
    const result = extractStepSet('**Step 5.5:** decimal\n');
    assert.equal(result.size, 0, 'Decimal step labels are not whole-integer and must not be extracted');
  });

  test('skips letter-suffix labels (whole-integer only)', () => {
    const result = extractStepSet('**Step 5a:** suffix\n');
    assert.equal(result.size, 0, 'Letter-suffix step labels are not whole-integer and must not be extracted');
  });
});

// ─── Unit tests: findCrossFileRefs() ─────────────────────────────────────────

describe('findCrossFileRefs() — synthetic content', () => {
  test('detects filename.md step N variant', () => {
    const sourceFile = '/tmp/fake/source.md';
    const content = 'See execute-phase.md step 7 for the flow.\n';
    const refs = findCrossFileRefs(sourceFile, content);
    assert.equal(refs.length, 1, 'Must detect one cross-file ref');
    assert.equal(refs[0].targetBasename, 'execute-phase.md');
    assert.equal(refs[0].step, 7);
  });

  test('detects step N in filename.md variant', () => {
    const sourceFile = '/tmp/fake/source.md';
    const content = 'See step 7 in execute-phase.md for the flow.\n';
    const refs = findCrossFileRefs(sourceFile, content);
    assert.equal(refs.length, 1, 'Must detect one cross-file ref');
    assert.equal(refs[0].targetBasename, 'execute-phase.md');
    assert.equal(refs[0].step, 7);
  });

  test('skips same-file refs (D-04)', () => {
    const sourceFile = path.join(PROJECT_ROOT, 'get-shit-done/workflows/execute-phase.md');
    const content = 'See execute-phase.md step 5 here.\n';
    const refs = findCrossFileRefs(sourceFile, content);
    assert.equal(refs.length, 0, 'Same-file ref must be skipped');
  });

  test('skips refs inside code fences (per D-05 — symmetric source-side)', () => {
    const sourceFile = '/tmp/fake/source.md';
    const content = '```\nSee execute-phase.md step 999 inside fence.\n```\n';
    const refs = findCrossFileRefs(sourceFile, content);
    assert.equal(refs.length, 0, 'Refs inside code fences must be skipped');
  });

  test('detects plain integer step refs in cross-file references', () => {
    // XREF_PATTERNS capture only (\d+) — whole integers. "step 5.5" would be
    // captured as step 5 (integer prefix before the fractional dot), not NaN.
    // This test verifies that a plain integer ref is detected and parsed correctly.
    const sourceFile = '/tmp/fake/source.md';
    const content = 'See execute-phase.md step 5 for this.\n';
    const refs = findCrossFileRefs(sourceFile, content);
    assert.equal(refs.length, 1, 'Integer step ref must be detected');
    assert.equal(refs[0].step, 5, 'Step number must be parsed as integer 5');
  });
});

// ─── Corpus tests ─────────────────────────────────────────────────────────────

describe('corpus scan — cross-file step refs point at existing steps', () => {
  for (const file of SCAN_FILES) {
    const relPath = path.relative(PROJECT_ROOT, file).split(path.sep).join('/');
    test(`no stale cross-file step refs in ${relPath}`, () => {
      const content = fs.readFileSync(file, 'utf-8');
      const refs = findCrossFileRefs(file, content);

      const staleRefs = [];
      const unresolvedTargets = [];

      for (const ref of refs) {
        const targetPaths = FILES_BY_BASENAME.get(ref.targetBasename);

        if (!targetPaths || targetPaths.length === 0) {
          unresolvedTargets.push(ref);
          continue;
        }

        // A ref is valid if step N exists in ANY file with the target basename.
        // This handles the case where multiple files share a basename
        // (e.g., commands/gsd/execute-phase.md + get-shit-done/workflows/execute-phase.md).
        let foundInAny = false;
        for (const targetAbsPath of targetPaths) {
          const targetContent = fs.readFileSync(targetAbsPath, 'utf-8');
          const targetSteps = extractStepSet(targetContent);
          if (targetSteps.has(ref.step)) {
            foundInAny = true;
            break;
          }
        }

        if (!foundInAny) {
          staleRefs.push(ref);
        }
      }

      assert.deepStrictEqual(staleRefs, [],
        `Stale cross-file step refs in ${relPath}:\n${
          staleRefs.map(r =>
            `  line ${r.lineNumber}: step ${r.step} not found in ${r.targetBasename} — context: ${r.context}`
          ).join('\n')
        }`
      );

      assert.deepStrictEqual(unresolvedTargets, [],
        `Unresolved target files in ${relPath}:\n${
          unresolvedTargets.map(r =>
            `  line ${r.lineNumber}: target file ${r.targetBasename} not found in corpus — context: ${r.context}`
          ).join('\n')
        }`
      );
    });
  }
});

// ─── RED test: synthetic stale ref injection ──────────────────────────────────

describe('cross-file scanner — RED test (synthetic stale ref)', () => {
  test('detects a stale cross-file ref pointing at a nonexistent step', () => {
    // Per D-06: inject stale ref in a TEMPORARY file via fs.mkdtempSync(os.tmpdir()).
    // The corpus is never mutated.
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-xref-red-'));
    const synthFile = path.join(tmpDir, 'synthetic-source.md');
    fs.writeFileSync(
      synthFile,
      '# Synthetic test\n\nSee execute-phase.md step 999 for more.\n',
      'utf-8'
    );
    try {
      const targetContent = fs.readFileSync(
        path.join(PROJECT_ROOT, 'get-shit-done/workflows/execute-phase.md'),
        'utf-8'
      );
      const targetSteps = extractStepSet(targetContent);

      // Sanity check: Step 999 must NOT exist in the real corpus.
      // If a future upstream merge introduces an actual Step 999, this assertion
      // fails first with a clear message rather than producing a confusing false-positive.
      assert.ok(!targetSteps.has(999),
        'sanity: step 999 must not exist in execute-phase.md — update the test if it does'
      );

      const sourceContent = fs.readFileSync(synthFile, 'utf-8');
      const refs = findCrossFileRefs(synthFile, sourceContent);

      assert.equal(refs.length, 1, 'Scanner must detect the synthetic cross-file ref');
      assert.equal(refs[0].step, 999, 'Detected ref must point at step 999');
      assert.equal(refs[0].targetBasename, 'execute-phase.md', 'Detected ref must target execute-phase.md');

      const stale = refs.filter(r => !targetSteps.has(r.step));
      assert.equal(stale.length, 1, 'Scanner must flag the stale ref to step 999 as missing in target');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
