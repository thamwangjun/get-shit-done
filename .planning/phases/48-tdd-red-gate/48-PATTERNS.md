# Phase 48: TDD Red Gate - Pattern Map

**Mapped:** 2026-05-30
**Files analyzed:** 1 new file (no modifications)
**Analogs found:** 1 / 1

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `tests/step-numbering-scan.test.cjs` | test (corpus scanner) | file-I/O (read-only static analysis, line-by-line scan) | `tests/negative-framing-scan.test.cjs` | exact (same role + same data flow + same scan corpus + same CONTEXT.md-cited template) |

**Scope reminder:**
- Phase 48 ships exactly one new file. No edits to `package.json`, `scripts/run-tests.cjs`, `tests/helpers.cjs`, or any `get-shit-done/bin/lib/*.cjs` module (per CONTEXT.md "Reusable Assets" and RESEARCH.md §Project Constraints).
- Phase 48 is the TDD red gate ONLY — no corpus normalization (deferred to Phase 49), no maintenance script (deferred to Phase 50).

## Pattern Assignments

### `tests/step-numbering-scan.test.cjs` (test, file-I/O / corpus scanner)

**Analog:** `tests/negative-framing-scan.test.cjs`

The analog is the canonical structural template explicitly named in CONTEXT.md ("Reusable Assets") and RESEARCH.md ("canonical structural template"). All seven patterns below are sourced from that file and ported with the substitutions documented in CONTEXT.md decisions D-01 through D-09.

#### Pattern 1 — Imports + module-scope constants (lines 26–39)

Copy this shape verbatim, then adjust `SCAN_DIRS` (drop `references`) and add a `PATTERN_C_EXCLUDES` set:

```javascript
const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');

// Directories containing prompt files to scan
const SCAN_DIRS = [
  'agents',
  'get-shit-done/workflows',
  'get-shit-done/references',     // ← REMOVE for Phase 48 (per RESEARCH.md Pitfall 6)
  'commands/gsd',
];
```

**Phase 48 substitution** (per RESEARCH.md §Pattern 1 and Pitfall 6, plus CONTEXT.md D-07):

```javascript
const SCAN_DIRS = [
  'agents',
  'get-shit-done/workflows',
  'commands/gsd',
];

const PATTERN_C_EXCLUDES = new Set([
  'get-shit-done/workflows/plan-phase.md',
  'get-shit-done/workflows/new-milestone.md',
  'get-shit-done/workflows/new-project.md',
]);
```

#### Pattern 2 — Module-scope file collection (lines 41–48)

Copy this shape verbatim — single filesystem traversal at module load, all `describe` blocks filter `ALL_FILES`:

```javascript
// All markdown files across SCAN_DIRS — collected once at module scope so that
// each corpus describe block can reference ALL_FILES directly, avoiding 10
// identical filesystem traversals and a single point-of-truth for SCAN_DIRS changes.
// (collectMarkdownFiles is a function declaration and is hoisted above this initializer.)
const ALL_FILES = [];
for (const dir of SCAN_DIRS) {
  ALL_FILES.push(...collectMarkdownFiles(path.join(PROJECT_ROOT, dir)));
}
```

**Phase 48 addition** (filter the Pattern C excludes after collection — RESEARCH.md §Pattern 1 example):

```javascript
const SCAN_FILES = ALL_FILES.filter(f =>
  !PATTERN_C_EXCLUDES.has(path.relative(PROJECT_ROOT, f).split(path.sep).join('/'))
);
```

Use `path.sep`-to-`/` normalization to keep the exclude check cross-platform (Windows path separators would otherwise miss the set membership check).

#### Pattern 3 — ENOENT-tolerant recursive collector (lines 374–392)

Copy verbatim. The function is declared at file scope (not exported), and JavaScript function-declaration hoisting allows it to be called from the module-scope `for` loop above:

```javascript
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
```

Re-throwing non-ENOENT errors is mandatory — silent empty scans would mask a corpus the scanner was supposed to read.

#### Pattern 4 — Pure scanner function skeleton (lines 233–263, 350–369)

The analog's `scanForNegativeFraming` is the structural template for Phase 48's `scanContent`. Lines 233–263 show the canonical shape: split content into lines, track `inCodeBlock`, toggle it on ``` lines, skip detection inside fences:

```javascript
function scanForNegativeFraming(content) {
  const lines = content.split('\n');
  // … per-pattern arrays …
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track code fence state
    if (/^```/.test(trimmed)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // … per-pattern detection blocks …
  }

  return { violations: { … }, warnings: { … } };
}
```

**Phase 48 adaptation** (per RESEARCH.md §Code Examples, Pattern A/B + Pattern D):

```javascript
// Pattern A/B: bold or plain "Step N.M" labels with decimal point
// Guard: require \.[0-9] (excludes letter-suffix branches like "Step 7a")
// D-05: no indentation guard — all leading whitespace allowed
const STEP_DECIMAL_RE = /(?:^|\s|\*\*)Step\s+\d+\.\d/i;

function scanContent(content) {
  const lines = content.split('\n');
  const patternAB = [];
  const patternD = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (/^```/.test(trimmed)) { inCodeBlock = !inCodeBlock; continue; }
    if (inCodeBlock) continue;

    if (STEP_DECIMAL_RE.test(line)) {
      patternAB.push({ lineNumber: i + 1, line: trimmed });
    }
    // Pattern D: ordered-list decimal items at columns 0-2 only (RESEARCH.md Pitfall 5)
    if (/^\s{0,2}\d+\.\d+\./.test(line)) {
      patternD.push({ lineNumber: i + 1, line: trimmed });
    }
  }

  return { patternAB, patternD };
}
```

**Return-shape contract** — model on the analog's lines 350–369: return a flat object whose keys map directly to the violation buckets corpus subtests destructure (`const { patternAB } = scanContent(content);`).

#### Pattern 5 — Per-section out-of-order detector (NEW for Phase 48)

There is no direct analog in `negative-framing-scan.test.cjs` for stateful per-section sequence tracking. The scaffold below is sourced from RESEARCH.md §Pattern 4 and implements CONTEXT.md decisions D-03 (strict sequential) and D-04 (reset on `##`/`###`):

```javascript
function scanForOutOfOrder(content) {
  const lines = content.split('\n');
  const violations = []; // { lineNumber, expected, actual, line }
  let inCodeBlock = false;
  let expectedNext = null; // null = no sequence active; integer = next expected step

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (/^```/.test(trimmed)) { inCodeBlock = !inCodeBlock; continue; }
    if (inCodeBlock) continue;

    // Section boundary: ## or ### heading resets the counter (D-04)
    if (/^#{2,3}\s/.test(line)) {
      expectedNext = null;
      continue;
    }

    // Whole-integer step only — negative lookahead excludes decimal AND letter suffixes
    const stepMatch = line.match(/\*?\*?Step\s+(\d+)(?![\.\da-z])/i);
    if (stepMatch) {
      const n = parseInt(stepMatch[1], 10);
      if (expectedNext === null) {
        expectedNext = n + 1;        // start sequence at first observed integer (handles Step 0)
      } else if (n !== expectedNext) {
        violations.push({ lineNumber: i + 1, expected: expectedNext, actual: n, line: trimmed });
        expectedNext = n + 1;         // advance from actual to limit cascading errors
      } else {
        expectedNext = n + 1;
      }
    }
  }

  return violations;
}
```

**Key invariants** (per RESEARCH.md Pitfalls 2, 3, 4):
1. `(?![\.\da-z])` lookahead excludes `Step 7.0`, `Step 10` is fine (the `\d` block is only the next char), and `Step 7a` is excluded.
2. Counter starts at the first observed integer (handles `Step 0` as a valid starting label).
3. Strict sequential — both gaps and reversals are flagged (D-03).
4. After a violation, advance from `actual + 1`, not `expected + 1`, to limit cascading errors.

#### Pattern 6 — Synthetic unit-test block (lines 394–800)

The analog runs ~30 synthetic unit tests against `scanForNegativeFraming` using inline string fixtures before any corpus tests. Copy this exact structure for Phase 48 — RESEARCH.md §Code Examples lists the seven Pattern A/B unit tests and six out-of-order unit tests that must exist:

```javascript
describe('scanForNegativeFraming() — synthetic content', () => {
  test('flags bare NEVER directive', () => {
    const content = [
      '## Rules',
      '',
      'NEVER use time estimates.',
      '',
      'Always derive from scope.',
    ].join('\n');
    const result = scanForNegativeFraming(content);
    assert.equal(result.violations.never.length, 1, 'should detect one NEVER violation');
    assert.ok(result.violations.never[0].line.includes('NEVER use time estimates'));
  });
  // … many more synthetic-fixture tests …
});
```

**Phase 48 substitution** — port to `scanContent` and `scanForOutOfOrder` (the unit tests in RESEARCH.md §Code Examples §"Test File Skeleton" are the exact list to ship):
- 7 unit tests on `scanContent` — Pattern A/B flag, Step N.0 flag (D-08), indentation flag (D-05), letter-suffix non-flag, whole-integer non-flag, Pattern D flag, Pattern D inside code block non-flag.
- 6 unit tests on `scanForOutOfOrder` — reversed sequence, gap, Step 0 valid start, `##` reset, `###` reset, code-block ignore.

**Why this matters:** D-01 says corpus out-of-order subtests do NOT need to fail RED. The synthetic unit tests are the ONLY proof of out-of-order correctness — they must be exhaustive.

#### Pattern 7 — Per-file corpus subtest (lines 812–855, adapted for D-06)

The analog uses one aggregate subtest per directory (lines 812–833):

```javascript
test('no bare DO NOT directives in agent files', () => {
  const agentFiles = ALL_FILES.filter(f => f.includes('/agents/'));
  const violations = [];

  for (const file of agentFiles) {
    const relPath = path.relative(PROJECT_ROOT, file);
    const content = fs.readFileSync(file, 'utf-8');
    const { doNot } = scanForNegativeFraming(content).violations;
    if (doNot.length > 0) {
      violations.push({ file: relPath, lines: doNot });
    }
  }

  assert.equal(violations.length, 0,
    `Bare DO NOT directives found in agent files. Convert to affirmative instructions:\n${
      violations.map(v =>
        `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
      ).join('\n')
    }`
  );
});
```

**Phase 48 deviation per D-06** — emit a dynamic subtest *per file per pattern* instead of one aggregate subtest per directory. This is an intentional departure to give Phase 49 normalizers per-file failure attribution. RESEARCH.md §Pattern 5 documents this shape:

```javascript
describe('corpus scan — decimal step labels (Pattern A/B)', () => {
  for (const file of SCAN_FILES) {
    const relPath = path.relative(PROJECT_ROOT, file).split(path.sep).join('/');
    test(`no decimal Pattern A/B labels in ${relPath}`, () => {
      const content = fs.readFileSync(file, 'utf-8');
      const { patternAB } = scanContent(content);
      assert.deepStrictEqual(patternAB, [],
        `Decimal step labels in ${relPath}. Renumber to whole integers (Phase 49 will fix).`
      );
    });
  }
});
```

Three corpus describe blocks total (one per detection class): Pattern A/B decimal, Pattern D decimal, out-of-order.

## Shared Patterns

### Code-fence guard (`inCodeBlock` toggle)
**Source:** `tests/negative-framing-scan.test.cjs:252-263`
**Apply to:** Both `scanContent` and `scanForOutOfOrder` in Phase 48
**Why it matters here:** RESEARCH.md Pitfall 3 documents `quick.md` lines 691, 706 contain `Step 1` and `Step 2` inside a JS template-literal code fence — without this guard the out-of-order detector would flag them as restarting after Step 5/6.

```javascript
if (/^```/.test(trimmed)) {
  inCodeBlock = !inCodeBlock;
  continue;
}
if (inCodeBlock) continue;
```

### Violations-array-with-template-error-message
**Source:** `tests/negative-framing-scan.test.cjs:826-832, 1102-1110`
**Apply to:** All three corpus describe blocks in Phase 48

```javascript
assert.equal(violations.length, 0,
  `<message describing the violation class and the remediation path>:\n${
    violations.map(v =>
      `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
    ).join('\n')
  }`
);
```

**Phase 48 substitution per D-06:** because each file gets its own subtest, the message is per-file rather than aggregated. Use `assert.deepStrictEqual(patternAB, [], …)` style (per RESEARCH.md §Pattern 5) to leverage Node's deep-equal diff output for clearer failure attribution.

### Cross-platform path normalization
**Source:** New for Phase 48 — RESEARCH.md §Pattern 1 example
**Apply to:** Anywhere a path is matched against a hard-coded `forward-slash` literal (Pattern C exclude set, dynamic subtest titles)

```javascript
const relPath = path.relative(PROJECT_ROOT, file).split(path.sep).join('/');
```

The analog uses `f.includes('/agents/')` without normalization (lines 814, 836, 871, etc.) because Node test runs in this repo on POSIX. For Phase 48 the same convention is safe — `.split(path.sep).join('/')` is included for the Pattern C exclude lookup since the constants are hard-coded with `/`.

## Anti-Patterns to Reject (sourced from RESEARCH.md §Anti-Patterns)

These patterns appear in code that looks similar to the analog but must NOT be copied:

1. **Aggregating all corpus files into one assertion** — analog does this (lines 812–833), but D-06 mandates per-file subtests for Phase 48. Reject the aggregate form.
2. **Adding exports to `tests/helpers.cjs`** — would break `helpers.test.cjs` test-count assertion. Inline all utilities (`collectMarkdownFiles`, `scanContent`, `scanForOutOfOrder`) in the new test file, mirroring the analog (lines 374–392 inline `collectMarkdownFiles`).
3. **Naive regex `/Step\s+\d+\.\d+/`** — must use `\.[0-9]` not `\.\w` to exclude letter-suffix branches (`Step 7a`, `Step 4b` in `gsd-verifier.md`). The analog has no equivalent risk; this is a new constraint for Phase 48.
4. **Using `content.indexOf("Step 2.5")` for positional assertions** — `-1` is truthy in JavaScript, silently passes. Phase 48 asserts on `violations.length` / `deepStrictEqual` to avoid this entirely.
5. **Including `get-shit-done/references/` in `SCAN_DIRS`** — analog includes it (line 37) but Phase 48 must drop it per REQUIREMENTS.md "Out of Scope" and CONTEXT.md "Reusable Assets" scope list.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (none) | — | — | All Phase 48 patterns map cleanly to `tests/negative-framing-scan.test.cjs`. The only NEW logic (per-section out-of-order detection, Pattern 5 above) is documented in RESEARCH.md §Pattern 4 with a complete code sketch — the planner should treat that sketch as the analog for the out-of-order detector. |

## Metadata

**Analog search scope:**
- `tests/*.test.cjs` (118+ files; the closest match — `negative-framing-scan.test.cjs` — is explicitly named in both CONTEXT.md and RESEARCH.md, so wider search produced no better candidates)

**Files scanned:** 2 (CONTEXT.md, RESEARCH.md fully; `tests/negative-framing-scan.test.cjs` fully — 1,424 lines, read once)

**Pattern extraction date:** 2026-05-30
