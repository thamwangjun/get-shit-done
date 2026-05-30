# Technology Stack: Step-Number Normalization Tooling

**Project:** GSD Fork — v2.1.0-d Whole-Integer Step Numbering
**Researched:** 2026-05-30
**Scope:** What Node.js utilities/patterns already exist and are reusable vs. what must be built from scratch for STEP-01 (scanner test) and STEP-03 (normalization script).

---

## Existing Tooling

### Runtime and Module Format

- **Node.js >=22.0.0** — confirmed in `package.json` (root)
- **CommonJS (.cjs)** — all lib modules, all test files, all maintenance scripts use `require`/`module.exports`; no ES modules in this layer
- **Node.js built-in `--test` runner** — all tests in `tests/*.test.cjs`; no external test framework

### Shared Test Infrastructure (`tests/helpers.cjs`)

The helpers file exports the following utilities:

| Helper | Purpose | Reusability for STEP-01 |
|--------|---------|------------------------|
| `captureConsole(fn)` | Captures console.log/warn/error output | Potentially useful if the scanner emits warnings |
| `parseFrontmatter(content)` | Parses YAML frontmatter | Not needed — step-number scanning works on body content |
| `createTempDir` / `createTempProject` | Temp directory scaffolding | Not needed — corpus scan uses live repo files |
| `cleanup(tmpDir)` | Temp dir teardown | Not needed |

**Key finding:** `tests/helpers.cjs` does NOT export `collectMarkdownFiles`. The negative-framing scanner defines its own inline `collectMarkdownFiles` function and calls it at module scope. The STEP-01 scanner test follows the same pattern — inline definition, not imported from helpers.

### The Canonical Scanner Test Pattern (`tests/negative-framing-scan.test.cjs`)

This file is the direct structural template for the new step-number scanner test. Reusable conventions:

1. **Module-scope file collection** — collect all `.md` files from `SCAN_DIRS` once at module top, shared across all `describe` blocks
2. **`SCAN_DIRS` constant** — array of directories relative to `PROJECT_ROOT`; the same dirs apply: `agents`, `get-shit-done/workflows`, `commands/gsd`
3. **Pure `scanContent(content)` function** — takes a string, returns a result object with violation arrays; no filesystem I/O inside the scan logic
4. **Code-fence tracking** — `let inCodeBlock = false` + toggle on `/^```/` lines; step labels inside fenced blocks must be skipped
5. **Unit tests first** — `describe` blocks for synthetic content test the scanner logic in isolation before corpus tests run
6. **Corpus tests** — per-directory `describe` + `test` pairs: load files, call scanner, collect violations, `assert.equal(violations.length, 0, diagnosticMessage)`
7. **Diagnostic message format** — `violations.map(v => \` \${v.file}:\n\${v.lines.map(l => \` line \${l.lineNumber}: \${l.line}\`).join('\n')}\`).join('\n')`

The `{ lineNumber, line }` violation object shape (trimmed line text + 1-based line number) is the established convention.

### Maintenance Script Pattern (`scripts/convert-refs.cjs`, `scripts/strip-prose-atrefs.cjs`)

Both existing maintenance scripts share a structure directly applicable to `scripts/normalize-step-numbers.cjs`:

| Pattern | Both Scripts | Implication for normalize script |
|---------|-------------|----------------------------------|
| `--dry-run` flag via `process.argv.includes('--dry-run')` | Yes | Implement the same flag |
| Inline `collectMdFiles(dir)` recursive collector | Yes | Inline the same collector |
| `TARGET_DIRS` array of absolute paths | Yes | Same four scan directories |
| Line-by-line transform: `content.split('\n')`, map, `out.join('\n')` | Yes | Same split/join approach |
| Idempotent write: compare result to original before writing | Yes — `if (result === original) return false` | Apply the same guard |
| `process.stdout.write` for progress output | Yes | Consistent with existing scripts |
| Summary at end: files processed / changed / lines changed | Yes | Replicate same summary shape |
| `process.exit(0)` explicit exit | Yes | Required — Node.js sometimes hangs on implicit exit in CJS scripts |

The `transformLine(line)` → `string | null` (null = no change) contract in `convert-refs.cjs` is clean for line-level transforms. For the normalizer, the transform requires file-level state (a renumbering map built in a first pass), so the right unit is `transformFile(filePath, options)` that processes full file content rather than individual lines.

---

## Reusable Patterns

### 1. Inline `collectMarkdownFiles` Function

Used verbatim in `negative-framing-scan.test.cjs` (lines 374–392). The ENOENT-tolerant pattern is required:

```javascript
function collectMarkdownFiles(dir) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) results.push(...collectMarkdownFiles(fullPath));
      else if (entry.name.endsWith('.md')) results.push(fullPath);
    }
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  return results;
}
```

Both the scanner test and the normalizer script inline this — extracting to helpers is not necessary and would require updating the helpers test count assertion.

### 2. Code-Fence Skip Guard

The `inCodeBlock` toggle from `negative-framing-scan.test.cjs` (lines 253–263):

```javascript
let inCodeBlock = false;
// inside the per-line loop:
if (/^```/.test(trimmed)) { inCodeBlock = !inCodeBlock; continue; }
if (inCodeBlock) continue;
```

Step labels inside fenced code blocks are examples, not behavioral steps. Both the scanner and the normalizer must apply this guard.

### 3. SCAN_DIRS + ALL_FILES Module-Scope Initialization

The pattern of building `ALL_FILES` once at module scope from `SCAN_DIRS` (lines 34–48 of the scanner test) avoids redundant filesystem traversals across describe blocks and is the established convention for corpus scanner tests.

---

## What Must Be Built From Scratch

### A. `scanForDecimalSteps(content)` Function

No existing scanner handles step numbering. Must build from scratch. Returns:

```javascript
{
  violations: Array<{ lineNumber: number, line: string }>
}
```

### B. Cross-Reference Detection

The corpus (23 occurrences across 7 files) shows two forms of decimal step labels:

1. **Section headers** — lines that define a step (the heading itself):
   - `## Step 1.3: Load Graph Context` (`gsd-phase-researcher.md`)
   - `### Step 6.5: Self-Check` (`gsd-intel-updater.md`)
   - `**Step 2.5: Runtime State Inventory**` (`gsd-phase-researcher.md`)
   - `**Step 1.5: Check for unaddressed UAT gaps**` (`progress.md`)

2. **Inline cross-references** — prose that mentions a step by its decimal label:
   - `continue to Step 1.5 without graph context` (`gsd-phase-researcher.md`)
   - `Proceed to Step 7.8 (or Step 8 if pattern mapper is disabled)` (`plan-phase.md`)
   - `Proceed to Step 5.5.` (`new-project.md`)

Both forms must be detected by the scanner. The normalizer must renumber both forms consistently within each file.

### C. Per-File Renumbering Algorithm (`scripts/normalize-step-numbers.cjs`)

No existing script does multi-step renumbering with cross-reference tracking. Must build:

1. **Pass 1 — collect all decimal step labels** in the file in document order, building a `Map<originalDecimalLabel, newWholeIntegerLabel>` that respects ordering and avoids collisions with pre-existing whole-integer step numbers
2. **Pass 2 — apply replacements** to every line, replacing both section headings and inline cross-references using the map from Pass 1
3. **File-scoped operation** — the renumbering map is built fresh per file; no state crosses file boundaries

---

## Regex Strategy

### Detection Regex (for scanner)

One regex covers all surface forms:

```javascript
/\bStep\s+\d+\.\d+/i
```

This matches `Step 2.5`, `Step 4.75`, `Step 7.0`, `Step 1.3` regardless of whether they appear in a heading or prose. Deliberately broad — any `Step N.M` is a violation by definition (the milestone goal is whole-integer-only). Code-fence exclusion is the only filter needed.

**Note on `Step 7.0` in `execute-phase.md`:** The corpus contains `Step 7.0`, `Step 7.1`, `Step 7.2`, `Step 7.3` (lines 925–949 of `execute-phase.md`) used as a sub-step group. `N.0` is technically decimal by the regex but semantically "the whole step". Whether to treat `N.0` as a violation is a scope decision for the implementation phase. The recommended default is to flag it — "whole integer only" means no decimal point.

### Heading vs. Cross-Reference Identification (for normalizer)

To distinguish step-defining headings from inline references, test the line start:

```javascript
// Markdown heading form
/^(#{1,6})\s+(Step\s+\d+\.\d+)(.*)/i

// Bold inline heading form (common in workflows)
/^(\*\*Step\s+\d+\.\d+)(.*)/i
```

Any line that matches `/\bStep\s+\d+\.\d+/i` but does NOT match the heading patterns is an inline cross-reference.

### Word-Boundary-Safe Replacement (for normalizer)

When replacing `Step 2.5` with `Step 3`, the regex must not match `Step 2.50`:

```javascript
// decimalNumber = "2.5", escape the dot
line.replace(
  new RegExp(`\\bStep\\s+${decimalNumber.replace('.', '\\.')}(?!\\d)`, 'gi'),
  newLabel
)
```

The negative lookahead `(?!\d)` prevents `2.5` from matching inside `2.50`.

---

## Corpus Summary

Decimal step labels found across all three scan directories (as of 2026-05-30):

| File | Decimal Step Labels (headers) | Inline Cross-References |
|------|------------------------------|------------------------|
| `agents/gsd-phase-researcher.md` | Step 1.3, Step 1.5, Step 2.5, Step 2.6 | Step 1.5, Step 2.6 (in skip note) |
| `agents/gsd-intel-updater.md` | Step 6.5 | — |
| `get-shit-done/workflows/progress.md` | Step 1.5, Step 1.6 | — |
| `get-shit-done/workflows/execute-phase.md` | Step 7.0, Step 7.1, Step 7.2, Step 7.3 | — |
| `get-shit-done/workflows/quick.md` | Step 2.5, Step 4.5, Step 4.75, Step 5.5, Step 5.6, Step 6.25, Step 6.5 | — |
| `get-shit-done/workflows/plan-phase.md` | — | Step 3.5, Step 7.8 (cross-refs in prose) |
| `get-shit-done/workflows/new-project.md` | — | Step 5.5 (cross-ref in prose) |

Total: ~23 occurrences across 7 files. All in agents and workflows; zero in commands.

---

## Compatibility Notes

- All new files (scanner test + normalizer script) use `.cjs` extension and CommonJS `require`/`module.exports`
- No new npm dependencies required — `fs`, `path`, `node:test`, `node:assert/strict` are all built-in
- `scripts/normalize-step-numbers.cjs` runs standalone via `node scripts/normalize-step-numbers.cjs`; does not need to be registered in `package.json` scripts (like other maintenance scripts in `scripts/`)
