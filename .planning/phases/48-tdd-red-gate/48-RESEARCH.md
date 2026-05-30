# Phase 48: TDD Red Gate - Research

**Researched:** 2026-05-30
**Domain:** Node.js test scanner (static text analysis); regex pattern detection on markdown corpus
**Confidence:** HIGH

## Summary

Phase 48 writes a single new test file — `tests/step-numbering-scan.test.cjs` — that detects two violation classes (decimal step labels and out-of-order step numbering) across the corpus of `agents/`, `commands/gsd/`, and `get-shit-done/workflows/` markdown files. The phase ships only the test; it produces NO file normalizations, NO maintenance script, and NO changes to lib modules, `package.json`, or `scripts/run-tests.cjs`. The success state is RED — the test fails for documented reasons against the unmodified corpus.

The canonical structural template is `tests/negative-framing-scan.test.cjs`. Phase 48 adapts that file's shape (module-scope file collection, `inCodeBlock` toggle, pure `scanContent(content)` function, per-directory `describe` blocks, unit tests before corpus tests) and substitutes the detection regexes. All design decisions that affected scope are locked in `48-CONTEXT.md` decisions D-01 through D-09 — research must not re-litigate them.

**Primary recommendation:** Implement two detection regexes (Pattern A/B for `Step N.M` labels with `\.[0-9]` guard against letter-suffix steps; Pattern D for ordered-list decimals `\d+\.\d+\.`), one out-of-order detector (per-section reset on `##`/`###` headings, strict sequential), and three corpus subtests per directory (decimal-A/B, decimal-D, out-of-order). Unit tests use synthetic fixtures (D-01 says corpus out-of-order does not need to fail RED). Corpus decimal subtests MUST fail RED for the six known files.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Out-of-Order Detection Scope (Phase 48)**
- **D-01:** Out-of-order corpus tests do NOT need to fail RED. The corpus may have no genuine out-of-order violations currently. Out-of-order detection is verified via synthetic unit test fixtures only.
- **D-02:** Corpus RED gate is exclusively about decimal violations in the 6 known violating files.

**Out-of-Order Detection Algorithm**
- **D-03:** Strict sequential detection — flag BOTH reversed steps (Step 1, Step 3, Step 2) AND gaps (Step 1, Step 3, Step 4 with no Step 2). Any non-sequential jump triggers a failure.
- **D-04:** Detection scope is per-section: step counter resets when a markdown heading (`##` or `###`) is encountered. Each section's steps are checked independently. This prevents false positives in files with multiple independent step sequences.

**Pattern A/B Detection (Bold headings)**
- **D-05:** No indentation guard for Pattern A/B. All `**Step N.M**` headings are detected as violations regardless of leading whitespace. This ensures execute-phase.md's `**Step 7.0**`–`**Step 7.3**` (indented at 3 spaces) are correctly flagged.

**Test Structure**
- **D-06:** One test per file per pattern — each file gets two subtests: one for decimal violations, one for out-of-order violations. Departs from `negative-framing-scan.test.cjs` pattern intentionally, to provide clearer failure attribution during Phase 49 normalization.

**Carrying Forward from STATE.md**
- **D-07:** Pattern C files (`plan-phase.md`, `new-milestone.md`, `new-project.md`) are OUT OF SCOPE — `## N.N.` section headings without the "Step" keyword are a different pattern deferred to a follow-on milestone. Exclude these files from the scanner via explicit path exclusion.
- **D-08:** Step N.0 labels (e.g., `**Step 7.0**`) ARE violations — the decimal point is a decimal point regardless of the fractional digit.
- **D-09:** execute-phase.md Step 7.0–7.3 sub-steps are violations to be DETECTED by the scanner. Phase 49 will rename them as lettered branches (7a, 7b, etc.) rather than sequential integers — but the Phase 48 scanner catches them as decimal violations.

### Claude's Discretion

- Pattern D detection regex and the exact indentation threshold for the ordered-list guard (the research recommends excluding Pattern D items with 3+ leading spaces — Claude can apply this since Pattern D items in the corpus are at column 0 anyway)
- Whether to include a `collectMarkdownFiles` function at module scope (mirroring `negative-framing-scan.test.cjs`) or inline the traversal — follow existing pattern
- False-positive guards for letter-suffix steps (e.g., `Step 7a`) — scanner must require `\.[0-9]` not `\.[a-z0-9]` for the decimal digit

### Deferred Ideas (OUT OF SCOPE)

- Cross-file reference detection (`execute-plan.md` → `execute-phase.md` step 5.5) — belongs in Phase 50 (Maintenance Script and Cross-Ref Scanner)
- Pattern C normalization (`plan-phase.md`, `new-milestone.md`, `new-project.md` `## N.N.` headings) — deferred to a follow-on milestone after v2.1.0-d

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCAN-01 | Scanner detects decimal step labels (e.g. `Step 2.5`, `Step 7.0`, Pattern D `2.5.`) in `agents/`, `commands/gsd/`, `get-shit-done/workflows/`; confirmed RED before any fixes | Pattern A/B regex `/Step\s+\d+\.\d+/i` with `\.[0-9]` guard; Pattern D regex `/^\s*\d+\.\d+\./`; code-fence skip via `inCodeBlock` toggle (verified against `negative-framing-scan.test.cjs`); 6 corpus files enumerated below with exact violation lines |
| SCAN-02 | Scanner detects out-of-order step numbering in agents/commands/workflows and fails | Per-section sequential check resetting on `##`/`###` headings (D-04); strict sequential (D-03) flags both reversed sequences and gaps; verified via synthetic unit fixtures (D-01) — corpus failure not required |

## Project Constraints (from CLAUDE.md)

- **Test framework:** Node.js built-in `--test` runner. No external framework. Tests use `node:test` and `node:assert/strict`. Required Node.js >=20 (root package requires >=22).
- **Test file extension:** `.test.cjs` — CommonJS only. The new file MUST be `tests/step-numbering-scan.test.cjs`.
- **Test runner glob:** `scripts/run-tests.cjs` globs `tests/*.test.cjs`. No `package.json` or `scripts/run-tests.cjs` changes are required for the new file to be picked up.
- **Coverage:** Coverage measured only against `get-shit-done/bin/lib/*.cjs` (test files themselves are not coverage targets). No coverage gate affects this phase.
- **Helpers constraint:** Project instructions in `CONTEXT.md` say not to add exports to `tests/helpers.cjs`. The new scanner inlines its file-collection traversal and helper functions in the test file — no `helpers.cjs` modification needed.
- **CLAUDE.md `GSD Workflow Enforcement`:** All code changes go through a GSD workflow. The plan must execute via `/gsd-execute-phase` (this phase is part of the active milestone).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Markdown file traversal | Node.js test layer | — | Test-time only; matches negative-framing-scan.test.cjs precedent |
| Regex pattern detection | Pure function in test file | — | `scanContent(content)` is pure, returns `{ patternAB: [...], patternD: [...], outOfOrder: [...] }` |
| Code-fence exclusion | Pure scanner function (line loop) | — | `inCodeBlock` boolean toggle on ``` lines — same shape as negative-framing-scan |
| Per-directory subtest grouping | `describe()` blocks in test file | — | Matches negative-framing-scan structure for parallel discoverability |
| Out-of-order step tracking | Pure scanner function (per-section state) | — | Counter resets on `##`/`###` heading (D-04); strict sequential check (D-03) |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:test` | built-in (Node >=22) | Test runner | [VERIFIED: codebase] Existing convention in all `tests/*.test.cjs` files; no external framework allowed per CLAUDE.md |
| `node:assert/strict` | built-in (Node >=22) | Assertions | [VERIFIED: codebase] `assert.equal`, `assert.ok`, `assert.deepStrictEqual` used throughout |
| `fs` | built-in | File I/O | [VERIFIED: codebase] `fs.readdirSync({ withFileTypes: true })` and `fs.readFileSync(file, 'utf-8')` are the established traversal/read primitives |
| `path` | built-in | Path manipulation | [VERIFIED: codebase] `path.join`, `path.relative` for cross-platform paths |

### Supporting
*(none — no external dependencies added)*

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline `collectMarkdownFiles` function | Adding it as an export in `tests/helpers.cjs` | Project rule (CONTEXT.md) and `negative-framing-scan.test.cjs` precedent both keep this inline — reuse via helpers would broaden change scope unnecessarily |
| `assert.deepStrictEqual(violations, [])` | Custom error builder with file:line formatting | The negative-framing scanner uses the violations-array-with-template-error-message pattern; adopt it for consistency |

**Installation:** None — all dependencies are Node built-ins.

**Version verification:** Verified via codebase inspection of `tests/negative-framing-scan.test.cjs` lines 26–48: `require('node:test')`, `require('node:assert/strict')`, `require('fs')`, `require('path')` — same set the new test file will use.

## Package Legitimacy Audit

*Not applicable — Phase 48 installs zero external packages. All required modules are Node.js built-ins (`node:test`, `node:assert/strict`, `fs`, `path`). No `npm install` step in any task.*

## Architecture Patterns

### System Architecture Diagram

```
                   ┌──────────────────────────────────┐
                   │  scripts/run-tests.cjs           │
                   │  (globs tests/*.test.cjs)        │
                   └────────────────┬─────────────────┘
                                    │
                                    ▼
                ┌───────────────────────────────────────┐
                │  tests/step-numbering-scan.test.cjs   │
                │  (new file, this phase)               │
                └───┬──────────────────┬────────────────┘
                    │                  │
       ┌────────────▼──────────┐   ┌───▼──────────────────┐
       │ module-scope:         │   │ unit tests (synthetic)│
       │ ALL_FILES = collect   │   │ - scanContent()       │
       │ markdown from         │   │ - scanForOutOfOrder() │
       │ SCAN_DIRS, minus      │   │ - inCodeBlock guard   │
       │ PATTERN_C_EXCLUDES    │   │ - letter-suffix guard │
       └────────────┬──────────┘   │ - decimal A/B detect  │
                    │              │ - Pattern D detect    │
                    │              │ - out-of-order detect │
                    │              └──────────────────────-┘
                    ▼
       ┌────────────────────────────────────────────┐
       │  corpus describe() blocks (per directory)  │
       │  - decimal A/B in agents (RED expected)    │
       │  - decimal A/B in workflows (RED expected) │
       │  - decimal A/B in commands (GREEN now)     │
       │  - Pattern D in workflows (RED expected)   │
       │  - out-of-order per file (GREEN expected)  │
       └────────────────────────────────────────────┘
                    │
                    ▼ reads
       ┌────────────────────────────────────────────┐
       │  6 violating files (RED):                  │
       │  - agents/gsd-intel-updater.md             │
       │  - agents/gsd-phase-researcher.md          │
       │  - get-shit-done/workflows/progress.md     │
       │  - get-shit-done/workflows/quick.md        │
       │  - get-shit-done/workflows/execute-phase.md│
       │  - .../execute-phase/steps/                │
       │      post-merge-gate.md (cross-ref only)   │
       └────────────────────────────────────────────┘
```

### Recommended Project Structure
```
tests/
├── negative-framing-scan.test.cjs   # template — already exists
└── step-numbering-scan.test.cjs     # NEW — Phase 48 deliverable
```

### Pattern 1: Module-Scope File Collection
**What:** Collect all markdown files once at module scope. Each `describe` block filters `ALL_FILES` by directory. One filesystem traversal instead of N.
**When to use:** Always for corpus scanner tests in this codebase.
**Example:**
```javascript
// Source: tests/negative-framing-scan.test.cjs:42-48
const SCAN_DIRS = [
  'agents',
  'get-shit-done/workflows',
  'commands/gsd',
];

// All markdown files across SCAN_DIRS — collected once at module scope.
const ALL_FILES = [];
for (const dir of SCAN_DIRS) {
  ALL_FILES.push(...collectMarkdownFiles(path.join(PROJECT_ROOT, dir)));
}
```

**Phase 48 adaptation:** Use the same SCAN_DIRS list (DROP the `get-shit-done/references` directory present in negative-framing — Phase 48 scope is `agents`, `commands/gsd`, `workflows` per the success criteria). Add a Pattern C exclude filter:
```javascript
const PATTERN_C_EXCLUDES = new Set([
  'get-shit-done/workflows/plan-phase.md',
  'get-shit-done/workflows/new-milestone.md',
  'get-shit-done/workflows/new-project.md',
]);
// Filter ALL_FILES after collection
const SCAN_FILES = ALL_FILES.filter(f =>
  !PATTERN_C_EXCLUDES.has(path.relative(PROJECT_ROOT, f))
);
```

### Pattern 2: ENOENT-Tolerant Recursive Collector
**What:** Recurse into directories collecting `.md` files; tolerate missing directories (returns `[]`) but rethrow other errors so silent empty scans don't pass.
**Source:** `tests/negative-framing-scan.test.cjs:374-392`
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
    if (err.code !== 'ENOENT') throw err;
  }
  return results;
}
```

### Pattern 3: Code-Fence Skip via `inCodeBlock` Toggle
**What:** Track a boolean that toggles on every ``` line. Skip detection while `inCodeBlock === true`.
**Source:** `tests/negative-framing-scan.test.cjs:252-263`
```javascript
let inCodeBlock = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  if (/^```/.test(trimmed)) {
    inCodeBlock = !inCodeBlock;
    continue;
  }
  if (inCodeBlock) continue;
  // detection logic here
}
```

**Why this matters for Phase 48:** `get-shit-done/workflows/quick.md` lines 691 and 706 contain `Step 1 — ...` and `Step 2 — ...` INSIDE a JS template-literal code fence (verified by direct inspection 2026-05-30). Without the code-fence skip, the scanner would catch these and Step 1/Step 2 are not decimal violations anyway — but the fence guard also protects against future code-block patterns that look like decimal steps.

### Pattern 4: Per-Section Out-of-Order Detection
**What:** Track expected next step as a running integer. Reset to `null` (unset) every time a `##` or `###` heading is encountered. When a `Step N` label is found, if it isn't the expected value, record an out-of-order violation; then advance expectation.
**Recommended shape:**
```javascript
function scanForOutOfOrder(content) {
  const lines = content.split('\n');
  const violations = []; // { lineNumber, expected, actual, line }
  let inCodeBlock = false;
  let expectedNext = null; // null = no sequence active; integer = next expected step
  let sectionStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (/^```/.test(trimmed)) { inCodeBlock = !inCodeBlock; continue; }
    if (inCodeBlock) continue;

    // Section boundary: ## or ### heading resets the counter (D-04)
    if (/^#{2,3}\s/.test(line)) {
      expectedNext = null;
      sectionStart = i + 1;
      continue;
    }

    // Detect Step N (whole-integer only — skip decimal labels which are caught
    // by the decimal scanner; treating them here would produce double-reporting)
    const stepMatch = line.match(/\*?\*?Step\s+(\d+)(?![\.\da-z])/i);
    if (stepMatch) {
      const n = parseInt(stepMatch[1], 10);
      if (expectedNext === null) {
        expectedNext = n + 1; // start sequence at whatever number appears first
      } else if (n !== expectedNext) {
        violations.push({
          lineNumber: i + 1,
          expected: expectedNext,
          actual: n,
          line: trimmed,
        });
        expectedNext = n + 1; // advance from actual, not expected, to limit cascading errors
      } else {
        expectedNext = n + 1;
      }
    }
  }

  return violations;
}
```

**Key design notes:**
- Step 0 is a valid starting label (D-04 says "start sequence at whatever number appears first" — so Step 0, Step 1, Step 2 is a valid sequence).
- The regex `/\*?\*?Step\s+(\d+)(?![\.\da-z])/i` uses negative lookahead to require the digit NOT be followed by `.`, another digit, or a letter — this is what excludes decimal labels (Step 7.0), multi-digit numbers (Step 10 is fine; the lookahead only blocks `.` and `[a-z]`), and letter-suffix labels (Step 7a).
- Cascading-error mitigation: when a violation is found, advance from `actual + 1`, not `expected + 1`. Otherwise a single missed step produces N violations downstream.

### Pattern 5: Per-File Subtest with Violations Array
**What:** Each corpus subtest builds a `violations` array, then asserts `deepStrictEqual(violations, [])` with a template-formatted error message listing file + line + content.
**Source:** `tests/negative-framing-scan.test.cjs:812-855`
```javascript
test('no decimal step labels in agent files (Pattern A/B)', () => {
  const agentFiles = SCAN_FILES.filter(f => f.includes('/agents/'));
  const violations = [];
  for (const file of agentFiles) {
    const relPath = path.relative(PROJECT_ROOT, file);
    const content = fs.readFileSync(file, 'utf-8');
    const { patternAB } = scanContent(content);
    if (patternAB.length > 0) {
      violations.push({ file: relPath, lines: patternAB });
    }
  }
  assert.equal(violations.length, 0,
    `Decimal step labels found in agent files. Renumber to whole integers:\n${
      violations.map(v =>
        `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
      ).join('\n')
    }`
  );
});
```

**D-06 adaptation:** "One test per file per pattern — each file gets two subtests." Interpretation: for the corpus block, instead of aggregating all files per directory into a single subtest, emit a dynamic subtest per file. Sketch:
```javascript
describe('corpus scan — decimal step labels (Pattern A/B)', () => {
  for (const file of SCAN_FILES) {
    const relPath = path.relative(PROJECT_ROOT, file);
    test(`no decimal Pattern A/B labels in ${relPath}`, () => {
      const content = fs.readFileSync(file, 'utf-8');
      const { patternAB } = scanContent(content);
      assert.deepStrictEqual(patternAB, [],
        `Decimal step labels in ${relPath}. Renumber to whole integers.`
      );
    });
  }
});
```
This produces clearer failure attribution during Phase 49 normalization — each file's status is visible per-subtest rather than masked behind a single aggregate failure.

### Anti-Patterns to Avoid
- **Aggregating all corpus files into one assertion:** Phase 49 normalizers will fix files one at a time. Per-file subtests let them see exactly which files still fail. (D-06 mandates per-file structure.)
- **Adding exports to `tests/helpers.cjs`:** Inline the scanner utilities in the test file (CONTEXT.md instruction; matches negative-framing-scan precedent).
- **Naive regex `/Step\s+\d+\.\d+/`:** Without the trailing-letter guard, this misclassifies `Step 7a` and `Step 7b` in `gsd-verifier.md`. The regex must end with `\.[0-9]` (or use a character class that excludes `[a-z]`).
- **Using `content.indexOf("Step 2.5")` as a positional test assertion:** `-1` is truthy in JavaScript. `assert.ok(content.indexOf(...))` passes silently. Use `content.includes(...)` or `assert.notEqual(content.indexOf(...), -1)`. Phase 48 does not introduce this anti-pattern (the assertion is on `violations.length`), but downstream Phase 49 test updates must follow this rule.
- **Including `get-shit-done/references/` in SCAN_DIRS:** Out of fork scan scope per REQUIREMENTS.md. negative-framing-scan.test.cjs scans references but Phase 48 does NOT — copy `SCAN_DIRS` selectively.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown AST parsing | A full markdown parser to detect step headings | Line-by-line regex with `inCodeBlock` toggle | The corpus pattern set is finite and well-characterized; existing scanner (negative-framing-scan.test.cjs) uses regex and is correct on 99/99 subtests |
| File globbing | An npm glob/minimatch library | `fs.readdirSync({ withFileTypes: true })` recursion | Zero dependencies. The recursive `collectMarkdownFiles` pattern is established in the codebase |
| Test scheduling | A test framework choice (mocha, jest, vitest) | Node built-in `node:test` | CLAUDE.md prescribes; existing `tests/*.test.cjs` use `node:test` exclusively |

**Key insight:** Phase 48 is a 1-file, ~250-line addition that mirrors an existing pattern. Don't introduce new dependencies, new helpers, or new test infrastructure.

## Runtime State Inventory

*Not applicable — Phase 48 is greenfield (adds a single new test file) with no rename/refactor/migration of runtime state.*

## Common Pitfalls

### Pitfall 1: Silent False-Passes from `indexOf` Returning -1
**What goes wrong:** A test that uses `assert.ok(content.indexOf("Step 2.5"))` passes silently after Step 2.5 is renamed because `indexOf` returns `-1` (truthy in JavaScript).
**Why it happens:** JS coercion: `Boolean(-1) === true`. The assertion checks truthiness, not presence.
**How to avoid:** Phase 48's scanner does NOT use this pattern (asserts on `violations.length`, not on string presence). But the Phase 48 unit tests MUST use `content.includes("Step 2.5")` or `assert.notEqual(content.indexOf(...), -1)` when verifying scanner-positive cases against synthetic fixtures.
**Warning signs:** A scanner that passes 100% of the time even after the corpus is supposedly violating — first thing to check is the assertion shape.
[CITED: STATE.md §Accumulated Context "Key Risk: Silent Test False-Passes"]

### Pitfall 2: Letter-Suffix Steps Look Decimal to Naive Regex
**What goes wrong:** `gsd-verifier.md` uses `Step 2a`, `Step 2b`, `Step 4b`, `Step 7b` as branch labels. A regex like `/Step\s+\d+\.\w/` or `/Step\s+\d+\.[a-z0-9]/i` flags these as decimal violations.
**Why it happens:** Letter suffixes ARE valid step branch labels per the milestone scope (D-09 says Phase 49 will rename execute-phase.md Step 7.0–7.3 TO lettered branches like 7a, 7b). The Phase 48 scanner must accept letter suffixes.
**How to avoid:** Pattern A/B regex uses `\.[0-9]`, not `\.[a-z0-9]` and not `\.\w`. Add an explicit unit test:
```javascript
test('does not flag letter-suffix steps (Step 7a, Step 4b)', () => {
  const content = 'Step 2a: do thing\n**Step 4b: Other**\n';
  const { patternAB } = scanContent(content);
  assert.equal(patternAB.length, 0, 'letter-suffix steps must not be flagged');
});
```
**Warning signs:** Running the scanner produces violations for `gsd-verifier.md` (which is NOT in the 6 known violating files).
[VERIFIED: codebase] Lines confirmed via `grep -nE "Step\s+[0-9]+[a-z]" agents/gsd-verifier.md`: lines 114, 122, 144, 264, 446, 490 contain Step 2a/2b/2c/4b/7b.

### Pitfall 3: Code-Block Steps in `quick.md` Misclassified as Violations
**What goes wrong:** Lines 691 and 706 of `quick.md` contain `Step 1 — HEAD attachment assertion` and `Step 2 — Base correctness` inside a JavaScript template-literal code fence. A scanner without code-fence guard would treat these as out-of-order steps (since the surrounding section already has Step 5/6/etc.).
**Why it happens:** `quick.md` includes embedded JS snippets that mention "Step 1" / "Step 2" as documentation within shell `${...}` template strings.
**How to avoid:** Use the `inCodeBlock` toggle (Pattern 3 above). Verify with a synthetic unit fixture:
```javascript
test('does not flag step references inside code blocks', () => {
  const content = ['**Step 5: do X**', '```', 'Step 1 - inside code', 'Step 2 - also inside', '```', '**Step 6: do Y**'].join('\n');
  const { outOfOrder } = scanForOutOfOrder(content);
  assert.equal(outOfOrder.length, 0);
});
```
**Warning signs:** Running the scanner produces violations on `quick.md` lines around 691 attributed to "out-of-order Step 1 after Step 6" — the code-fence guard is broken.
[VERIFIED: codebase] Confirmed lines 691/706 are inside a ``` fence by direct file inspection 2026-05-30.

### Pitfall 4: `Step 0` Treated as a Violation
**What goes wrong:** Scanner assumes the first step in every section must be `Step 1`. `gsd-verifier.md`, `gsd-planner.md`, and `commands/gsd/graphify.md` start sections with `Step 0`.
**Why it happens:** Step 0 is a valid "pre-flight check" convention in these files. Treating it as out-of-order would produce false positives.
**How to avoid:** Out-of-order detector starts the sequence at "whatever number appears first" (see Pattern 4 code above). Add a unit test:
```javascript
test('treats Step 0 as a valid starting label', () => {
  const content = ['## Section A', '**Step 0:** pre-flight', '**Step 1:** do thing', '**Step 2:** next'].join('\n');
  const { outOfOrder } = scanForOutOfOrder(content);
  assert.equal(outOfOrder.length, 0, 'Step 0 followed by Step 1, Step 2 is a valid sequence');
});
```
**Warning signs:** Running the scanner produces violations on `gsd-verifier.md`, `gsd-planner.md`, or `commands/gsd/graphify.md` (none of which are in the 6 known violating files).
[VERIFIED: codebase] grep confirmed: gsd-verifier.md:79, gsd-planner.md:570, commands/gsd/graphify.md:15.

### Pitfall 5: Pattern D False-Positives on Indented Lists
**What goes wrong:** A nested ordered list with items like `   2.5. nested item` could be misclassified as a Pattern D decimal step.
**Why it happens:** Pattern D regex `/^\s*\d+\.\d+\./` matches indented as well as column-0 decimal items.
**How to avoid:** Per CONTEXT.md Claude's Discretion section: "exclude Pattern D items with 3+ leading spaces". Use `/^\s{0,2}\d+\.\d+\./` to limit Pattern D detection to columns 0–2.
**Verification:** All Pattern D violations in execute-phase.md (lines 510, 741, 819, 832, 864) are at column 0, so the indentation guard does not produce false negatives.
[VERIFIED: codebase] Via grep `command grep -nE "^\s*[0-9]+\.[0-9]+\." get-shit-done/workflows/execute-phase.md` — all Pattern D matches are at column 0.

### Pitfall 6: Wrong `SCAN_DIRS` (Including References)
**What goes wrong:** Copying `SCAN_DIRS` verbatim from `negative-framing-scan.test.cjs` includes `get-shit-done/references` — which is OUT OF SCOPE for v2.1.0-d per REQUIREMENTS.md "Out of Scope" table.
**Why it happens:** Direct copy-paste from the canonical pattern without scope review.
**How to avoid:** Use `SCAN_DIRS = ['agents', 'get-shit-done/workflows', 'commands/gsd']` — three dirs, NOT four.
**Warning signs:** The scanner flags decimal steps in `get-shit-done/references/` files (e.g., references/verification-patterns.md may have step-numbered headings).

## Code Examples

### Example: Pattern A/B Detection Function

```javascript
// Pattern A/B: bold or plain "Step N.M" labels with decimal point
// Guard: require \.[0-9] (excludes letter-suffix branches like "Step 7a")
// D-05: no indentation guard — all leading whitespace allowed
const STEP_DECIMAL_RE = /(?:^|\s|\*\*)Step\s+\d+\.\d/i;

function scanContent(content) {
  const lines = content.split('\n');
  const patternAB = []; // { lineNumber, line }
  const patternD = [];  // { lineNumber, line }
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (/^```/.test(trimmed)) { inCodeBlock = !inCodeBlock; continue; }
    if (inCodeBlock) continue;

    // Pattern A/B: "Step N.M" with leading boundary (start of line, space, or **)
    if (STEP_DECIMAL_RE.test(line)) {
      patternAB.push({ lineNumber: i + 1, line: trimmed });
    }

    // Pattern D: ordered-list decimal items at columns 0-2 only
    if (/^\s{0,2}\d+\.\d+\./.test(line)) {
      patternD.push({ lineNumber: i + 1, line: trimmed });
    }
  }

  return { patternAB, patternD };
}
```

### Example: Out-of-Order Detection Function

See Pattern 4 above. Key correctness invariants:
1. Counter resets on `##` or `###` heading (D-04).
2. Sequence starts at whatever number appears first (handles Step 0 case).
3. Strict sequential — both gaps and reversals flagged (D-03).
4. Cascading-error suppression — after violation, advance from `actual + 1`.

### Example: Test File Skeleton

```javascript
'use strict';

/**
 * Step Numbering Scan
 *
 * Regression guard for the v2.1.0-d whole-integer step numbering milestone.
 * Detects two violation classes:
 *   1. Decimal step labels: "Step N.M" headings (Pattern A/B) and "N.M." ordered-list
 *      items (Pattern D) at columns 0-2.
 *   2. Out-of-order step numbering: per-section sequence validation that flags both
 *      reversed sequences and gaps.
 *
 * SCAN_DIRS:    agents/, get-shit-done/workflows/, commands/gsd/
 * EXCLUDED:     get-shit-done/workflows/{plan-phase,new-milestone,new-project}.md
 *               (Pattern C files — `## N.N.` headings without "Step" keyword;
 *                deferred to follow-on milestone per CONTEXT.md D-07)
 *
 * Phase 48 RED expectation: 6 files fail (5 primary + 1 cross-ref):
 *   - agents/gsd-intel-updater.md (Step 6.5)
 *   - agents/gsd-phase-researcher.md (Step 1.3, 1.5, 2.5, 2.6)
 *   - get-shit-done/workflows/progress.md (Step 1.5, 1.6)
 *   - get-shit-done/workflows/quick.md (Step 2.5, 4.5, 4.75, 5.5, 5.6, 6.25, 6.5)
 *   - get-shit-done/workflows/execute-phase.md (Pattern A/B 7.0-7.3, Pattern D 2.5/5.5-5.8)
 *   - get-shit-done/workflows/execute-phase/steps/post-merge-gate.md (inline "step 5.8" ref on line 60)
 */

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const SCAN_DIRS = ['agents', 'get-shit-done/workflows', 'commands/gsd'];
const PATTERN_C_EXCLUDES = new Set([
  'get-shit-done/workflows/plan-phase.md',
  'get-shit-done/workflows/new-milestone.md',
  'get-shit-done/workflows/new-project.md',
]);

// ─── File collection ─────────────────────────────────────────────────────────
function collectMarkdownFiles(dir) { /* … as Pattern 2 … */ }

const ALL_FILES = [];
for (const dir of SCAN_DIRS) {
  ALL_FILES.push(...collectMarkdownFiles(path.join(PROJECT_ROOT, dir)));
}
const SCAN_FILES = ALL_FILES.filter(f =>
  !PATTERN_C_EXCLUDES.has(path.relative(PROJECT_ROOT, f).split(path.sep).join('/'))
);

// ─── Detection ───────────────────────────────────────────────────────────────
function scanContent(content) { /* … as above … */ }
function scanForOutOfOrder(content) { /* … as Pattern 4 … */ }

// ─── Unit tests: synthetic content ───────────────────────────────────────────
describe('scanContent() — decimal detection', () => {
  test('flags Pattern A/B "**Step 2.5**" heading', () => {
    const { patternAB } = scanContent('**Step 2.5:** do thing\n');
    assert.equal(patternAB.length, 1);
  });

  test('flags Pattern A/B "Step 7.0" (zero fractional digit)', () => {
    const { patternAB } = scanContent('**Step 7.0 — branch label**\n');
    assert.equal(patternAB.length, 1, 'Step N.0 is a violation per D-08');
  });

  test('flags Pattern A/B with indentation (D-05: no indentation guard)', () => {
    const { patternAB } = scanContent('   **Step 7.0** indented sub-step\n');
    assert.equal(patternAB.length, 1, 'indented Step N.M must still be flagged');
  });

  test('does not flag letter-suffix step (Step 7a)', () => {
    const { patternAB } = scanContent('**Step 7a:** branch label\n');
    assert.equal(patternAB.length, 0);
  });

  test('does not flag whole-integer step (Step 7)', () => {
    const { patternAB } = scanContent('**Step 7:** do thing\n');
    assert.equal(patternAB.length, 0);
  });

  test('flags Pattern D ordered-list decimal "5.5. text"', () => {
    const { patternD } = scanContent('5.5. **Worktree cleanup**\n');
    assert.equal(patternD.length, 1);
  });

  test('does not flag Pattern D inside code block', () => {
    const { patternD } = scanContent('```\n5.5. inside fence\n```\n');
    assert.equal(patternD.length, 0);
  });
});

describe('scanForOutOfOrder() — synthetic content', () => {
  test('flags reversed sequence Step 1, Step 3, Step 2', () => {
    const c = ['## Section', '**Step 1:** a', '**Step 3:** b', '**Step 2:** c'].join('\n');
    assert.equal(scanForOutOfOrder(c).length, 2, 'both Step 3 and Step 2 are out of order');
  });

  test('flags gap Step 1, Step 3 (missing Step 2)', () => {
    const c = ['## Section', '**Step 1:** a', '**Step 3:** b'].join('\n');
    assert.equal(scanForOutOfOrder(c).length, 1);
  });

  test('does not flag sequence Step 0, Step 1, Step 2', () => {
    const c = ['## Section', '**Step 0:** a', '**Step 1:** b', '**Step 2:** c'].join('\n');
    assert.equal(scanForOutOfOrder(c).length, 0);
  });

  test('resets sequence on ## heading', () => {
    const c = ['## A', '**Step 1:** a', '## B', '**Step 1:** restart'].join('\n');
    assert.equal(scanForOutOfOrder(c).length, 0, 'new section resets counter');
  });

  test('resets sequence on ### heading', () => {
    const c = ['## A', '**Step 1:** a', '### Subsection', '**Step 1:** restart'].join('\n');
    assert.equal(scanForOutOfOrder(c).length, 0);
  });

  test('ignores Step references inside code blocks', () => {
    const c = ['## A', '**Step 5:** a', '```', 'Step 1 inside', 'Step 2 inside', '```', '**Step 6:** b'].join('\n');
    assert.equal(scanForOutOfOrder(c).length, 0);
  });
});

// ─── Corpus tests (D-06: one subtest per file per pattern) ───────────────────
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

describe('corpus scan — decimal ordered-list items (Pattern D)', () => {
  for (const file of SCAN_FILES) {
    const relPath = path.relative(PROJECT_ROOT, file).split(path.sep).join('/');
    test(`no Pattern D decimal items in ${relPath}`, () => {
      const content = fs.readFileSync(file, 'utf-8');
      const { patternD } = scanContent(content);
      assert.deepStrictEqual(patternD, [],
        `Pattern D decimal ordered-list items in ${relPath}. Renumber sequentially.`
      );
    });
  }
});

describe('corpus scan — out-of-order step numbering', () => {
  for (const file of SCAN_FILES) {
    const relPath = path.relative(PROJECT_ROOT, file).split(path.sep).join('/');
    test(`no out-of-order step labels in ${relPath}`, () => {
      const content = fs.readFileSync(file, 'utf-8');
      const violations = scanForOutOfOrder(content);
      assert.deepStrictEqual(violations, [],
        `Out-of-order step labels in ${relPath}. Renumber sequentially.`
      );
    });
  }
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single aggregate subtest per directory (negative-framing-scan precedent) | Dynamic per-file subtests for clearer failure attribution (D-06) | This phase (2026-05-30) | Phase 49 normalizers see per-file status; reduces silent regression risk |
| Detecting steps via `/Step\s+\d+\.\d+/` (naive) | `\.[0-9]` guard against letter-suffix branches | Codified in CONTEXT.md Claude's Discretion section | Avoids false positives on `Step 7a`, `Step 4b` |
| Whole-corpus scan including `references/` | SCAN_DIRS limited to `agents`, `commands/gsd`, `workflows` | This phase (per REQUIREMENTS.md Out-of-Scope table) | Aligns scope with v2.1.0-d milestone |

**Deprecated/outdated:**
- *(none — this is a greenfield scanner)*

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The 6th file from CONTEXT.md "specifics" refers to `execute-phase/steps/post-merge-gate.md` containing the inline "step 5.8" reference on line 60 | Phase Requirements / Code Examples | If incorrect, the count of RED files differs but the scanner's correctness is unaffected. The "specifics" section itself notes this needs confirmation. Risk: cosmetic (acceptance criterion 4 says "the 6 known violating files"). |
| A2 | Pattern D ordered-list items use `^\s{0,2}\d+\.\d+\.` (column 0-2 inclusive) | Code Examples / Pitfall 5 | If a Pattern D item exists at column 3+ in the corpus, the scanner misses it. Verified: all current Pattern D items are at column 0, so the 0-2 threshold is safe. |
| A3 | `scripts/run-tests.cjs` globs `tests/*.test.cjs` (no allowlist) | Project Constraints | If the runner uses an allowlist, the new file must be added explicitly. [VERIFIED: codebase CLAUDE.md states "Test files are tests/*.test.cjs (CommonJS)" and "scripts/run-tests.cjs ... globs tests/*.test.cjs"] |
| A4 | Out-of-order detection should ignore decimal-labeled steps (only count whole-integer matches) | Pattern 4 / Out-of-Order Code | If decimal steps SHOULD count toward sequence, the test produces additional out-of-order violations after decimals are flagged by the decimal scanner — double-reporting. The recommended interpretation (skip decimals in the out-of-order pass) avoids double-reporting. |
| A5 | Cross-file reference in `post-merge-gate.md` line 60 ("same as step 5.8") IS a Pattern A/B violation that the scanner should catch | Phase Requirements | Confirmed via direct grep: line 60 contains `"step 5.8"` lowercase. The scanner's regex must be case-insensitive (`/i` flag) to catch this — already specified in STEP_DECIMAL_RE above. |

**Risk severity:** All assumptions are LOW severity. A1 is cosmetic counting; A2-A5 are verified design choices the planner can confirm by inspecting CONTEXT.md and the linked files.

## Open Questions (RESOLVED)

1. **Does the 6th violating file include `post-merge-gate.md`, or is the count 5 primary files only?**
   - What we know: CONTEXT.md "specifics" lists 5 primary files and adds "The 6th file from the research inventory is `execute-phase/steps/post-merge-gate.md` (cross-file reference, not a primary violation source) — confirm whether this is the 6th or if the count is from primary violations only."
   - What's unclear: Whether `post-merge-gate.md` is INCLUDED in the SCAN_DIRS traversal. `execute-phase/steps/` is a subdirectory of `get-shit-done/workflows/execute-phase/`, which IS under SCAN_DIRS (`get-shit-done/workflows/`). The recursive `collectMarkdownFiles` will pick it up.
   - Recommendation: Include it. The scanner will catch the lowercase "step 5.8" reference (regex is `/i`). If the planner wants to exclude cross-references from Phase 48 scope (matching Deferred Ideas note that cross-file ref detection is Phase 50), they can add `post-merge-gate.md` to PATTERN_C_EXCLUDES or use a more specific path exclude. But since the reference is in-file (a description of the step's purpose, not a true cross-file ref), my recommendation is to keep it in scope — the scanner correctly flags it as a Pattern A/B match and Phase 49 will rename it.
   - **RESOLVED:** Include `post-merge-gate.md` — recursive `collectMarkdownFiles` picks it up under `get-shit-done/workflows/`; scanner's `/i` flag correctly catches the lowercase "step 5.8" reference. The plan proceeds with 6 known violating files.

2. **Should `## 4b` style headings in `gsd-verifier.md` and `gsd-planner.md` be tested as out-of-order?**
   - What we know: `gsd-verifier.md` has `## Step 2a`, `## Step 2b`, `## Step 2c`, `## Step 3b`, `## Step 4b`, `## Step 7b`. These are lettered branches, not sequence violations.
   - What's unclear: Whether the out-of-order detector should treat `Step 2a, 2b, 2c, 3, 3b, 4, 4b` as valid (whole-integer base sequence + letter branches).
   - Recommendation: The out-of-order regex `/\*?\*?Step\s+(\d+)(?![\.\da-z])/i` already EXCLUDES letter-suffix steps via the `[a-z]` in the negative lookahead. The sequence will be tracked as `2, 3, 4` (only the base integers), skipping `2a`, `2b`, etc. — this matches the existing convention without special-casing.
   - **RESOLVED:** No special-casing needed. The negative lookahead `(?![\.\da-z])` in the out-of-order regex already excludes `Step 7a`, `Step 4b`, etc. — only pure integer steps (`Step 2`, `Step 3`) are tracked for sequence continuity.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Test execution | ✓ | >=22 (CLAUDE.md package.json engines) | — |
| `node:test` module | Test runner | ✓ | built-in (Node >=22) | — |
| `node:assert/strict` | Assertions | ✓ | built-in | — |
| `fs`, `path` | File I/O, path manipulation | ✓ | built-in | — |
| `command grep` | Manual verification during development | ✓ | system tool | — |
| Existing 6 violating files | Corpus tests must find these files | ✓ | verified via grep 2026-05-30 | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` runner (Node >=22) |
| Config file | none — runner is `scripts/run-tests.cjs` (globs `tests/*.test.cjs`) |
| Quick run command | `node --test tests/step-numbering-scan.test.cjs` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCAN-01 | Pattern A/B detection — `Step N.M` labels in any of agents/, workflows/, commands/gsd/ | unit + corpus | `node --test tests/step-numbering-scan.test.cjs` | ❌ Wave 0 — file is the phase deliverable |
| SCAN-01 | Pattern D detection — `\d+\.\d+\.` ordered-list items | unit + corpus | `node --test tests/step-numbering-scan.test.cjs` | ❌ Wave 0 |
| SCAN-01 | Code-fence skip — patterns inside ``` blocks ignored | unit (synthetic) | `node --test tests/step-numbering-scan.test.cjs` | ❌ Wave 0 |
| SCAN-01 | Letter-suffix guard — `Step 7a` not flagged | unit (synthetic) | `node --test tests/step-numbering-scan.test.cjs` | ❌ Wave 0 |
| SCAN-01 | Pattern C exclusion — `plan-phase.md`, `new-milestone.md`, `new-project.md` not scanned | unit + corpus | `node --test tests/step-numbering-scan.test.cjs` | ❌ Wave 0 |
| SCAN-02 | Out-of-order detection — reversed sequence flagged | unit (synthetic) | `node --test tests/step-numbering-scan.test.cjs` | ❌ Wave 0 |
| SCAN-02 | Out-of-order detection — gap flagged | unit (synthetic) | `node --test tests/step-numbering-scan.test.cjs` | ❌ Wave 0 |
| SCAN-02 | Out-of-order detection — reset on `##` or `###` heading | unit (synthetic) | `node --test tests/step-numbering-scan.test.cjs` | ❌ Wave 0 |
| SCAN-02 | Out-of-order detection — Step 0 valid starting label | unit (synthetic) | `node --test tests/step-numbering-scan.test.cjs` | ❌ Wave 0 |
| Acceptance criterion 4 | The 6 known violating files fail RED for decimal subtests | corpus (RED expected) | `npm test -- tests/step-numbering-scan.test.cjs` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test tests/step-numbering-scan.test.cjs` (single-file run, < 5 seconds expected)
- **Per wave merge:** `npm test` — confirms no regressions in the full suite (4000+ tests; ~30-60s on this machine)
- **Phase gate:** `npm test` green except for the deliberate RED subtests in `step-numbering-scan.test.cjs` (this RED is the success state of Phase 48). Phase 48 verifier MUST distinguish "RED for documented reasons in the 6 files" from "RED for unrelated reasons in other files".

### Wave 0 Gaps
- [ ] `tests/step-numbering-scan.test.cjs` — covers SCAN-01, SCAN-02. This file is the phase deliverable; the entire phase is its creation.
- [ ] No framework install needed.
- [ ] No shared fixture file needed (synthetic fixtures inlined as string constants per `negative-framing-scan.test.cjs` precedent).

## Security Domain

*Not applicable in the conventional sense — Phase 48 adds a static-analysis test file with no network access, no user input, no auth, no secrets, no persistence. The file performs read-only operations against committed `.md` files in the repo.*

**ASVS categories that nominally apply:**
| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V5 Input Validation | partial | The "input" is committed markdown files in this repo. No untrusted input. The scanner uses regex with anchors and no backtracking risk (patterns are linear). |

**Known threat patterns:** None applicable. Regex patterns are simple and bounded (no nested quantifiers, no catastrophic-backtracking risk).

## Sources

### Primary (HIGH confidence)
- `.planning/phases/48-tdd-red-gate/48-CONTEXT.md` — Locked decisions D-01 through D-09; canonical refs section listing required reading
- `.planning/research/SUMMARY.md` — Violation inventory with exact line counts (37 violations across 6 files)
- `tests/negative-framing-scan.test.cjs` — canonical structural template (verified via full file read 2026-05-30)
- `.planning/REQUIREMENTS.md` — SCAN-01, SCAN-02 definitions and Out-of-Scope table
- `.planning/STATE.md §Accumulated Context` — silent-false-pass risk, three scope decisions
- Direct file inspection 2026-05-30 (`command grep -nE "Step\s+[0-9]+\.[0-9]"` against all SCAN_DIRS files) — confirmed exact violation line numbers in `agents/gsd-intel-updater.md`, `agents/gsd-phase-researcher.md`, `get-shit-done/workflows/progress.md`, `get-shit-done/workflows/quick.md`, `get-shit-done/workflows/execute-phase.md`, `get-shit-done/workflows/execute-phase/steps/post-merge-gate.md`
- Direct file inspection — confirmed `Step Nb` letter-suffix usage in `gsd-verifier.md` (lines 114, 122, 144, 264, 446, 490)
- Direct file inspection — confirmed `Step 0` usage as valid label in `gsd-verifier.md:79`, `gsd-planner.md:570`, `commands/gsd/graphify.md:15`
- Direct file inspection — confirmed `quick.md` lines 691, 706 are inside a JS template-literal code fence (lines 688–725)

### Secondary (MEDIUM confidence)
- *(none — all claims in this research are verified against the codebase or cited from locked context documents)*

### Tertiary (LOW confidence)
- *(none)*

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Node built-ins only, all verified in codebase, no external dependencies introduced
- Architecture: HIGH — direct adaptation of `negative-framing-scan.test.cjs` (existing, working pattern at 99/99 subtests)
- Pitfalls: HIGH — all six pitfalls verified by grep against the actual corpus on 2026-05-30
- Out-of-order algorithm: MEDIUM-HIGH — the per-section reset is straightforward; the negative-lookahead regex is well-formed but should be unit-tested with the synthetic fixtures listed in Section "Code Examples"

**Research date:** 2026-05-30
**Valid until:** 2026-06-30 (1 month — the corpus is stable; the only change risk is an upstream merge introducing new violating files, which is exactly what the scanner exists to catch)
