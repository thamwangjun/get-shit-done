---
phase: 64-citation-pattern-exploration
reviewed: 2026-06-09T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - scripts/scan-citations.cjs
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 64: Code Review Report

**Reviewed:** 2026-06-09
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

One file reviewed: `scripts/scan-citations.cjs`, a standalone one-pass discovery script that scans five prompt-content directories for four citation pattern categories and emits a JSON array to stdout.

The script is compact and largely well-structured. The most serious correctness concern is the frontmatter detection heuristic — it can silently suppress citation output for entire sections of files that contain `---` horizontal-rule separators in their body. Three additional warnings cover an unclosed-fence blind spot, a silent error swallow, and a deviation from the project's synchronous output convention. Three info items address testability and code quality.

---

## Warnings

### WR-01: Mid-document `---` incorrectly activates frontmatter suppression, causing false-negative citation misses

**File:** `scripts/scan-citations.cjs:123`

**Issue:** The frontmatter detector triggers on any `---` line as long as `frontmatterDone` is `false`. YAML frontmatter by specification must begin on line 1. For a `.md` file that does NOT start with `---` but contains a thematic break (`---`) anywhere in the body, the scanner will enter `inFrontmatter = true` at that point and suppress all citation detection until the next `---` is encountered — or until end-of-file if none follows. The caller receives a JSON result with no indication that part of the document was excluded. This is a silent false-negative producing incorrect scan output.

**Fix:** Add a line-1 guard so frontmatter detection is only ever initiated on the very first line of the file:

```js
// Replace the existing frontmatter toggle block:
if (!frontmatterDone && trimmed === '---') {
  if (!inFrontmatter && lineNumber === 1) {   // <-- add lineNumber === 1 guard
    inFrontmatter = true;
    continue;
  } else if (inFrontmatter) {
    inFrontmatter = false;
    frontmatterDone = true;
    continue;
  }
  // else: a '---' thematic break with no frontmatter open — treat as normal content line
}
```

---

### WR-02: Unclosed code fence silently suppresses all remaining citations in a file

**File:** `scripts/scan-citations.cjs:136`

**Issue:** The code-fence toggle is symmetric (`inCodeBlock = !inCodeBlock`) with no depth tracking and no end-of-file reset. If a markdown file contains a fenced block that is never closed (malformed document), `inCodeBlock` remains `true` for all subsequent lines in that file and every citation after the unclosed fence is silently discarded. For a discovery/audit script this is a correctness failure — the caller has no way to distinguish a file that was fully scanned from one that was partially skipped.

**Fix:** Emit a stderr warning when a file ends while `inCodeBlock` is still `true`:

```js
  } // end of lines loop

  if (inCodeBlock) {
    process.stderr.write(`Warning: unclosed code fence in ${relPath} — citations after open fence may be missed\n`);
  }
```

---

### WR-03: Unreadable files are silently skipped with no diagnostic output

**File:** `scripts/scan-citations.cjs:102-106`

**Issue:** The `catch` block on `fs.readFileSync` uses a bare `continue` regardless of the error type. Any error other than a missing file — `EACCES` (permission denied), `EIO` (device error), etc. — is silently swallowed. The caller receives a JSON result that is silently incomplete with no indication of which files were skipped. The `collectMarkdownFiles` function correctly distinguishes `ENOENT` from unexpected errors (lines 72–73) and re-throws unexpected ones; the read loop does not apply the same discipline.

**Fix:** Distinguish benign ENOENT from unexpected failures and warn on the latter:

```js
  } catch (err) {
    if (err.code === 'ENOENT') continue;  // file disappeared between collect and read — benign
    process.stderr.write(`Warning: could not read ${relPath}: ${err.message}\n`);
    continue;
  }
```

---

### WR-04: Output uses `process.stdout.write` instead of synchronous `fs.writeSync`, risking pipe teardown data loss

**File:** `scripts/scan-citations.cjs:171`

**Issue:** The project convention in `CLAUDE.md` explicitly states: "Always `fs.writeSync(1, data)` (synchronous, avoids pipe teardown race)." `process.stdout.write` on a pipe is asynchronous — if the consuming process closes the read-end of the pipe before Node.js drains the internal stream buffer, the JSON output can be truncated without error or warning. For large scan results (many files, many hits) this is a concrete risk.

**Fix:**

```js
// Replace:
process.stdout.write(JSON.stringify(hits, null, 2) + '\n');

// With:
const out = JSON.stringify(hits, null, 2) + '\n';
fs.writeSync(1, out);
```

---

## Info

### IN-01: 3-digit all-numeric hex colors are potential false-positive citation hits

**File:** `scripts/scan-citations.cjs:88`

**Issue:** The lookbehind `(?<![0-9a-fA-F#])` in `INLINE_RE` prevents matching mid-hex-string sequences (e.g., the `70` tail of `#e8c170`) but does NOT prevent matching short hex colors whose digits are purely numeric. A CSS inline color value like `#123`, `#456`, or `#999` passes the lookbehind (no hex character precedes the `#` when it appears at a word boundary) and produces a spurious `inline` citation hit. In the current scan corpus (prompt markdown files) this is low-probability, but the scanner will misclassify any purely-numeric 3-digit hex color it encounters as a citation.

**Fix:** Document the known false-positive risk in a comment, or add a note in the output schema. A stricter fix requiring 4+ digits for bare `#N` references is a possible heuristic if the project's actual citation numbers are all 4+ digits.

---

### IN-02: Module-level file collection runs unconditionally at require-time

**File:** `scripts/scan-citations.cjs:78-81`

**Issue:** `ALL_FILES` is populated by synchronous `readdirSync` calls at module load time, outside any function. This is acceptable for a CLI script that is never `require()`'d, but it makes the scan directories impossible to override or test in isolation without monkey-patching `fs`, and deviates from the project's function-design convention (side effects belong in functions, not module scope). If a future test wants to exercise `collectMarkdownFiles` with a fixture directory, importing this module will unconditionally scan the real project tree.

**Fix:** Wrap the collection and main driver in a `main()` function gated by `require.main === module`, and optionally export `collectMarkdownFiles` for unit testing.

---

### IN-03: Argument validation loop rejects `--` separator injected by some shells and npm scripts

**File:** `scripts/scan-citations.cjs:31-34`

**Issue:** The validation loop exits with an error for every element of `process.argv.slice(2)`, including a bare `--` separator that npm's `exec` and some shell wrappers inject automatically. Invoking `npm exec -- node scripts/scan-citations.cjs` would fail unexpectedly with "Unknown flag: --".

**Fix:**

```js
for (const arg of process.argv.slice(2)) {
  if (arg === '--') continue; // allow shell/npm-injected separator
  process.stderr.write(`Unknown flag: ${arg}\nUsage: node scripts/scan-citations.cjs\n`);
  process.exit(1);
}
```

---

_Reviewed: 2026-06-09_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
