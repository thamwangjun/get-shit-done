# Phase 64: Citation Pattern Exploration - Pattern Map

**Mapped:** 2026-06-09
**Files analyzed:** 2 (1 new script, 1 new findings document)
**Analogs found:** 2 / 2

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `scripts/scan-citations.cjs` | utility (scan script) | batch / transform | `scripts/normalize-step-numbers.cjs` | exact |
| `.planning/phases/64-citation-pattern-exploration/64-FINDINGS.md` | findings document | N/A (handwritten artifact) | `tests/step-numbering-scan.test.cjs` (structure) + CONTEXT.md (schema) | role-match |

---

## Pattern Assignments

### `scripts/scan-citations.cjs` (utility, batch/transform)

**Primary analog:** `scripts/normalize-step-numbers.cjs`
**Secondary analog:** `tests/step-numbering-scan.test.cjs` (for `collectMarkdownFiles` and `SCAN_DIRS` shape)

---

**Shebang + module JSDoc** (`scripts/normalize-step-numbers.cjs` lines 1–23):
```javascript
#!/usr/bin/env node
/**
 * scan-citations.cjs
 *
 * <one-line purpose>
 *
 * Phase 64 / CITE-01 discovery script. Implements:
 *   D-08: CommonJS discovery script at scripts/scan-citations.cjs
 *   D-09: Outputs JSON to stdout; post-processing step converts to 64-FINDINGS.md format
 *   D-10: One-pass scan for all citation patterns; frontmatter blocks excluded
 */

'use strict';
```

---

**Argument validation** (`scripts/normalize-step-numbers.cjs` lines 30–37):
```javascript
// ─── Argument validation ──────────────────────────────────────────────────────

for (const arg of process.argv.slice(2)) {
  if (arg !== '--dry-run') {
    process.stderr.write(`Unknown flag: ${arg}\nUsage: node scripts/normalize-step-numbers.cjs [--dry-run]\n`);
    process.exit(1);
  }
}
```
For `scan-citations.cjs`, adapt to accept `--json` / `--md` output-format flags if needed; otherwise keep the same shape.

---

**Constants block — SCAN_DIRS** (`scripts/normalize-step-numbers.cjs` lines 39–58, `tests/step-numbering-scan.test.cjs` lines 24–38):

The Phase 64 scan covers **5** dirs (not 3). Copy the `SCAN_DIRS` constant and expand it:
```javascript
// ─── Constants ────────────────────────────────────────────────────────────────

const PROJECT_ROOT = path.join(__dirname, '..');

// Phase 64 citation scan scope (CONTEXT.md domain — all 5 scoped prompt-content dirs)
const SCAN_DIRS = [
  'commands',
  'get-shit-done/workflows',
  'agents',
  'get-shit-done/references',
  'get-shit-done/templates',
];
```
Note: prior scans used 3 dirs; citation scope is explicitly 5 dirs per CONTEXT.md.

---

**`collectMarkdownFiles` helper** (`scripts/normalize-step-numbers.cjs` lines 84–103, `tests/step-numbering-scan.test.cjs` lines 160–178):

Copy verbatim — identical in both analogs (the script comment at line 80 confirms this):
```javascript
/**
 * Recursively collect all .md files under dir.
 * Tolerates missing directories (ENOENT) silently; re-throws unexpected errors.
 *
 * @param {string} dir
 * @returns {string[]}
 */
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

---

**File collection at module scope** (`scripts/normalize-step-numbers.cjs` lines 106–114):
```javascript
const ALL_FILES = [];
for (const dir of SCAN_DIRS) {
  ALL_FILES.push(...collectMarkdownFiles(path.join(PROJECT_ROOT, dir)));
}
```
No exclusion set is needed for the citation scanner (no PATTERN_C_EXCLUDES analog). Use `ALL_FILES` directly as `SCAN_FILES`.

---

**Code-fence toggle pattern** (`scripts/normalize-step-numbers.cjs` lines 142–145, `tests/step-numbering-scan.test.cjs` lines 81–85):

Apply inside the per-line scan loop to skip content inside fenced code blocks:
```javascript
// Code fence toggle (symmetric skip — Pitfall 3)
if (/^```/.test(trimmed)) {
  inCodeBlock = !inCodeBlock;
  continue;
}
if (inCodeBlock) continue;
```

---

**Frontmatter exclusion pattern** (CONTEXT.md D-10; analog shape from `tests/negative-framing-scan.test.cjs` structure):

YAML frontmatter is delimited by leading `---` lines. Exclude lines inside the frontmatter block. Add a frontmatter toggle parallel to the code-fence toggle:
```javascript
// Frontmatter toggle: skip YAML block at file start (D-10)
let inFrontmatter = false;
let frontmatterDone = false;
// At the start of file processing:
if (!frontmatterDone && trimmed === '---') {
  if (!inFrontmatter) { inFrontmatter = true; continue; }
  else { inFrontmatter = false; frontmatterDone = true; continue; }
}
if (inFrontmatter) continue;
```

---

**JSON output to stdout** (CONTEXT.md D-09; `scripts/normalize-step-numbers.cjs` output shape via `console.log`):

The script writes results to stdout. Model after the final `console.log` summary in the analog, but emit structured JSON:
```javascript
// ─── Main driver ──────────────────────────────────────────────────────────────

const hits = [];

for (const filePath of ALL_FILES) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relPath = path.relative(PROJECT_ROOT, filePath).split(path.sep).join('/');
  // ... scan per-line, push { file, line, text, category } to hits ...
}

process.stdout.write(JSON.stringify(hits, null, 2) + '\n');
process.exit(0);
```

---

**Error handling on file reads** (`scripts/normalize-step-numbers.cjs` lines 277–280 pattern):
```javascript
let content;
try {
  content = fs.readFileSync(filePath, 'utf-8');
} catch (err) {
  continue; // skip unreadable files silently
}
```

---

### `.planning/phases/64-citation-pattern-exploration/64-FINDINGS.md` (findings document)

**No direct file analog exists** — no prior phase produced a structured FINDINGS.md in this repo. The schema is defined entirely by CONTEXT.md decisions D-01 through D-03 and the downstream contract with Phase 65.

**Required structure** (from CONTEXT.md D-01, D-02, D-03, D-06, D-07):

```markdown
# Phase 64: Citation Pattern Exploration — Findings

**Generated:** <date>
**Scan scope:** commands/, get-shit-done/workflows/, agents/, get-shit-done/references/, get-shit-done/templates/
**Files scanned:** <count>

## Summary

| Category | Count | Notes |
|---|---|---|
| inline (`#NNN`) | 211 | confirmed baseline 2026-06-09 |
| parenthetical (`(#NNN)`) | <count> | subset of inline |
| word-form (`issue NNN`, `PR NNN`) | <count> | |
| feat-form (`feat-NNNN`) | <count> | |
| <other> | <count> | |

## Findings Table

| file:line | matched_text | category |
|---|---|---|
| commands/gsd/foo.md:42 | `post-#2790` | inline |
| get-shit-done/references/planner-graphify-auto-update.md:N | `feat-3347` | feat-form |

## Allowlist Candidates

Patterns the Phase 65 guard test must NOT flag:

| Pattern | Example | Grep evidence (scoped dirs) | Status |
|---|---|---|---|
| Hex color codes | `#e8c170` | <grep hit or "not present"> | candidate / not present |
| Markdown heading markers | `## Heading` | <grep hit> | candidate |
| Illustrative placeholders | `#123`, `#45` | <grep hit or "not present"> | candidate / not present |
| Frontmatter color fields | `color: '#e8c170'` | <grep hit or "not present"> | candidate / not present |
```

---

## Shared Patterns

### File traversal (`collectMarkdownFiles` + `SCAN_DIRS` + module-scope collection)

**Source:** `scripts/normalize-step-numbers.cjs` lines 84–114 (identical copy also in `tests/step-numbering-scan.test.cjs` lines 160–178)
**Apply to:** `scripts/scan-citations.cjs`

The function + collection loop is stable and copy-paste reusable. The only change is expanding `SCAN_DIRS` from 3 entries to 5 (the citation scope adds `get-shit-done/references` and `get-shit-done/templates`).

---

### Code-fence + frontmatter skipping

**Source:** `scripts/normalize-step-numbers.cjs` lines 141–145 (code-fence toggle); D-10 pattern for frontmatter toggle
**Apply to:** `scripts/scan-citations.cjs` per-line scan loop

Both skip mechanisms must be active simultaneously. Initialize `inCodeBlock = false`, `inFrontmatter = false`, `frontmatterDone = false` before the line loop per file. Reset all three at the start of each new file.

---

### JSON stdout output + `process.exit(0)`

**Source:** `scripts/normalize-step-numbers.cjs` lines 464–471 (final reporting pattern)
**Apply to:** `scripts/scan-citations.cjs`

Replace `console.log` text output with `process.stdout.write(JSON.stringify(...))`. Keep `process.exit(0)` at the end.

---

### Imports block

**Source:** `scripts/normalize-step-numbers.cjs` lines 26–29
```javascript
'use strict';

const fs   = require('fs');
const path = require('path');
```
No additional dependencies needed. The scanner is zero-dependency CommonJS, consistent with all other scripts in `scripts/`.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `64-FINDINGS.md` | findings document | N/A | No prior phase produced a structured findings markdown; schema comes entirely from CONTEXT.md decisions |

---

## Metadata

**Analog search scope:** `scripts/`, `tests/`, `.planning/phases/`
**Files scanned:** 3 analog files read (`normalize-step-numbers.cjs`, `step-numbering-scan.test.cjs`, `negative-framing-scan.test.cjs`)
**Pattern extraction date:** 2026-06-09
