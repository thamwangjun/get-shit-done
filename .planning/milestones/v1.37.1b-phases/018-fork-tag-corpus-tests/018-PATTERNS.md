# Phase 18: Fork Tag Corpus Tests — Pattern Map

**Mapped:** 2026-04-28
**Files analyzed:** 2 (new test files to create)
**Analogs found:** 2 / 2

---

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `tests/fork-persona-tag.test.cjs` | test | batch (corpus scan) | `tests/agent-frontmatter.test.cjs` | exact |
| `tests/fork-intent-tag.test.cjs` | test | batch (corpus scan) | `tests/negative-framing-scan.test.cjs` | exact |

---

## Pattern Assignments

### `tests/fork-persona-tag.test.cjs` (test, batch corpus scan)

**Primary analog:** `tests/agent-frontmatter.test.cjs`
**Secondary analog:** `tests/agent-required-reading-consistency.test.cjs`

Both analogs perform per-agent subtests inside a single `describe()` loop over
`ALL_AGENTS`. The new file follows the same shape exactly.

---

**`use strict` directive** — `tests/negative-framing-scan.test.cjs` line 1:

```javascript
'use strict';
```

`agent-frontmatter.test.cjs` omits `'use strict'` but `negative-framing-scan.test.cjs`
and `agent-required-reading-consistency.test.cjs` do not. The research template includes
it. Use it for consistency with the more recent scan-style tests.

---

**Imports pattern** — `tests/agent-frontmatter.test.cjs` lines 11-14:

```javascript
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
```

Note: `agent-size-budget.test.cjs` uses the same import block (lines 20-23) and
`agent-required-reading-consistency.test.cjs` uses identical imports (lines 10-13).
This is the canonical four-import pattern for all corpus scan tests.

---

**Directory constant** — `tests/agent-frontmatter.test.cjs` line 16:

```javascript
const AGENTS_DIR = path.join(__dirname, '..', 'agents');
```

---

**File collection pattern** — `tests/agent-frontmatter.test.cjs` lines 20-22:

```javascript
const ALL_AGENTS = fs.readdirSync(AGENTS_DIR)
  .filter(f => f.startsWith('gsd-') && f.endsWith('.md'))
  .map(f => f.replace('.md', ''));
```

The `.map(f => f.replace('.md', ''))` strips the extension so test names and
`readFileSync` calls can be written as `agent + '.md'`. Copy this exactly.

---

**Per-file subtest loop** — `tests/agent-size-budget.test.cjs` lines 65-78:

```javascript
describe('SIZE: agent line-count budget', () => {
  for (const agent of ALL_AGENTS) {
    const { tier, limit } = budgetFor(agent);
    test(`${agent} (${tier}) stays under ${limit} lines`, () => {
      const filePath = path.join(AGENTS_DIR, agent + '.md');
      const lines = lineCount(filePath);
      assert.ok(
        lines <= limit,
        `${agent}.md has ${lines} lines — exceeds ${tier} budget of ${limit}. ` +
        `Extract shared boilerplate to get-shit-done/references/ or raise the budget ` +
        `in tests/agent-size-budget.test.cjs with a rationale.`
      );
    });
  }
});
```

For `fork-persona-tag.test.cjs`, create 2 subtests per agent (one `<persona>` check,
one `<role>` absence check) using the same `for...of` loop structure. The describe
label uses a short ALL-CAPS prefix: `'PERSONA: ...'`.

---

**`assert.ok()` with action-oriented error message** — `tests/agent-frontmatter.test.cjs` lines 36-43:

```javascript
test(`${agent} has anti-heredoc instruction`, () => {
  const content = fs.readFileSync(path.join(AGENTS_DIR, agent + '.md'), 'utf-8');
  assert.ok(
    /only use the write tool/i.test(content),
    `${agent} missing 'Only use the Write tool' instruction`
  );
});
```

Error messages always name the file and say what to do about the failure. The
`<persona>` check message should include "upstream merge may have reverted to
`<role>`" so the developer understands the regression context.

---

**Code-fence stripping before absence check** — research pattern (derived from
`tests/negative-framing-scan.test.cjs` code-block tracking, lines 144-155):

```javascript
// Strip code fence content to allow <role> in documentation examples
const withoutFences = content.replace(/```[\s\S]*?```/g, '');
assert.ok(
  !/<role>/.test(withoutFences),
  `${file} must not use <role> as persona XML tag (outside code fences) — use <persona> instead`
);
```

`negative-framing-scan.test.cjs` tracks `inCodeBlock` state across lines (lines
144-155); the single-regex approach is sufficient for the `<role>` case and matches
the research-recommended pattern. Use the regex form, not the stateful line iterator.

---

**`readFileSync` call style** — `tests/agent-required-reading-consistency.test.cjs` lines 26-27:

```javascript
const content = fs.readFileSync(path.join(AGENTS_DIR, agent + '.md'), 'utf-8');
```

Always inline the read inside the `test()` callback — do not pre-cache all file
contents at module load time.

---

### `tests/fork-intent-tag.test.cjs` (test, batch corpus scan)

**Primary analog:** `tests/negative-framing-scan.test.cjs`
**Secondary analog:** `tests/agent-frontmatter.test.cjs`

`negative-framing-scan.test.cjs` is the closest match: it scans a large flat corpus
(multiple directories), collects violations into an array, and reports them all in a
single aggregating `assert`. It also demonstrates the per-file-loop-inside-one-test
pattern used for the `<task>`-absence guard.

---

**`use strict` + imports** — `tests/negative-framing-scan.test.cjs` lines 1 and 26-29:

```javascript
'use strict';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
```

---

**Directory constant for commands** — derived from `tests/agent-frontmatter.test.cjs` line 18:

```javascript
const COMMANDS_DIR = path.join(__dirname, '..', 'commands', 'gsd');
```

`agent-frontmatter.test.cjs` defines `COMMANDS_DIR` this way (line 18), used for
spawn-type consistency tests. Copy exactly.

---

**Flat-directory file collection with `.sort()`** — research pattern:

```javascript
const commands = fs.readdirSync(COMMANDS_DIR)
  .filter(f => f.endsWith('.md'))
  .sort();
```

No prefix filter needed (`commands/gsd/` is all commands). `.sort()` ensures stable
test order across platforms. Compare with agents collection (which omits `.sort()`
but the agent directory also happens to be sorted alphabetically).

---

**Aggregating violations test** — `tests/negative-framing-scan.test.cjs` lines 418-438:

```javascript
test('no bare DO NOT directives in agent files', () => {
  const agentFiles = allFiles.filter(f => f.includes('/agents/'));
  const violations = [];

  for (const file of agentFiles) {
    const relPath = path.relative(PROJECT_ROOT, file);
    const content = fs.readFileSync(file, 'utf-8');
    const { doNot } = scanForNegativeFraming(content);
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

For the `<task>`-absence guard, use the same pattern: collect all violations into
an array, then assert `violations.length === 0` with a formatted list. The
`assert.deepEqual(violations, [], ...)` form (research template) is equivalent and
preferable for clarity:

```javascript
assert.deepEqual(violations, [],
  `Command files with bare <task> blocks:\n${violations.join('\n')}`
);
```

---

**Line-by-line bare-tag detection** — research pattern:

```javascript
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '<task>') {
    violations.push(`${file}:${i + 1} uses bare <task> block — replace with <intent>`);
  }
}
```

`line.trim() === '<task>'` is the correct form. It matches only a standalone XML
opener on its own line, not `<task>` embedded in prose or attribute values. See
`negative-framing-scan.test.cjs` line 150 for the analogous `line.trim().startsWith('```')`
bare-line sentinel pattern.

---

**Filtered per-file subtests** — `tests/agent-required-reading-consistency.test.cjs`
lines 52-77 (filtering corpus before generating subtests):

```javascript
const AGENTS_WITH_READING = ALL_AGENTS.filter(name => {
  const content = fs.readFileSync(path.join(AGENTS_DIR, name + '.md'), 'utf-8');
  return content.includes('required_reading') || content.includes('files_to_read');
});

// ...

for (const agent of AGENTS_WITH_READING) {
  test(`${agent} uses required_reading (not files_to_read)`, () => {
    // ...
  });
}
```

For `fork-intent-tag.test.cjs`, apply the same filter-then-loop to scope the
`<intent>` presence subtests to only the 47 files that already have `<intent>`:

```javascript
const intentFiles = commands.filter(f => {
  const content = fs.readFileSync(path.join(COMMANDS_DIR, f), 'utf-8');
  return content.includes('<intent>');
});

for (const file of intentFiles) {
  test(`${file} contains <intent> block`, () => {
    // ...
  });
}
```

---

**`assert.ok()` positive-presence check** — `tests/agent-required-reading-consistency.test.cjs`
lines 68-73:

```javascript
assert.ok(
  content.includes('required_reading'),
  `${agent} has reading instructions but does not use required_reading`
);
```

For the `<intent>` subtest, the message should explain the regression risk:

```javascript
assert.ok(
  content.includes('<intent>'),
  `${file} must contain <intent> block — upstream merge may have replaced with <task>`
);
```

---

## Shared Patterns

### `'use strict'` directive

**Source:** `tests/negative-framing-scan.test.cjs` line 1
**Apply to:** Both new test files
**Note:** `agent-frontmatter.test.cjs` omits it; the newer scan-style tests include it.
Use `'use strict'` for both Phase 18 files.

```javascript
'use strict';
```

---

### Describe label prefix convention

**Source:** `tests/agent-frontmatter.test.cjs` lines 34, 65, 80, 104, 218
**Apply to:** Both new test files

All `describe()` labels use a short ALL-CAPS prefix followed by a colon and a
human-readable description:

```javascript
describe('HDOC: anti-heredoc instruction', () => { ... });
describe('SKILL: skills frontmatter absent', () => { ... });
describe('SIZE: agent line-count budget', () => { ... });
```

For Phase 18: `'PERSONA: ...'` and `'INTENT: ...'`.

---

### `assert.ok()` error message style

**Source:** `tests/agent-frontmatter.test.cjs` lines 71-75
**Apply to:** Both new test files

Error messages follow the pattern: `${filename} [expected condition] — [why it matters
/ what happened / how to fix]`. They include the file name, a human-readable
expectation, and an em-dash followed by context:

```javascript
assert.ok(
  !frontmatter.includes('skills:'),
  `${agent} has skills: in frontmatter — skills: breaks Gemini CLI and must be removed`
);
```

---

### `readFileSync` inside `test()` callback (no pre-caching)

**Source:** `tests/agent-required-reading-consistency.test.cjs` lines 26-27
**Apply to:** Both new test files

Read file contents inside each `test()` callback — do not read all files at module
load time. This keeps memory bounded and failures isolated:

```javascript
test(`${agent} does not contain <files_to_read>`, () => {
  const content = fs.readFileSync(path.join(AGENTS_DIR, agent + '.md'), 'utf-8');
  // ...
});
```

The one exception is the filtered-collection setup outside the loop
(`agent-required-reading-consistency.test.cjs` lines 53-55), where a pre-read is
needed to build the filtered list. This is acceptable for the `intentFiles` filter.

---

### No `describe()` nesting

**Source:** All four analog test files
**Apply to:** Both new test files

None of the analogs nest `describe()` inside `describe()`. All use a flat structure:
multiple top-level `describe()` blocks, each containing `test()` calls directly.
The `for...of` subtest loop lives directly inside `describe()`.

---

### Test file registration — none needed

**Source:** `scripts/run-tests.cjs` (verified by research)
**Apply to:** Both new test files

Dropping a `.test.cjs` file in `tests/` is sufficient. No import, no manifest, no
`package.json` change required.

---

## No Analog Found

None. Both new files have close analogs in the existing test suite.

---

## Metadata

**Analog search scope:** `tests/*.test.cjs` (full directory), focused on:
- `tests/agent-frontmatter.test.cjs`
- `tests/agent-size-budget.test.cjs`
- `tests/negative-framing-scan.test.cjs`
- `tests/agent-required-reading-consistency.test.cjs`

**Files scanned:** 4 analog files read in full
**Pattern extraction date:** 2026-04-28
