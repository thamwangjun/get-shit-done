---
phase: 64-citation-pattern-exploration
reviewed: 2026-06-09T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - scripts/scan-citations.cjs
findings:
  critical: 2
  warning: 3
  info: 1
  total: 6
status: issues_found
---

# Phase 64: Code Review Report

**Reviewed:** 2026-06-09
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

`scripts/scan-citations.cjs` is a one-pass markdown citation scanner for five scoped prompt-content directories. The overall structure is sound — regex resets per line are correct, ENOENT tolerance is intentional, and the argument-validation guard is appropriate. However, two correctness defects can cause silent incorrect output (false positives and false negatives), and the output write mechanism violates the project's stated synchronous-write convention, risking data loss on pipe teardown.

---

## Critical Issues

### CR-01: Mid-document `---` incorrectly activates frontmatter suppression

**File:** `scripts/scan-citations.cjs:123`

**Issue:** The frontmatter detector triggers on any `---` line that appears before `frontmatterDone` is set, with no guard requiring it to be on line 1. YAML frontmatter by spec must begin at line 1. For a `.md` file that does NOT start with `---` but contains a thematic break (`---`) later in the body, the scanner will enter `inFrontmatter = true` at that point and suppress all citation detection until the next `---` (or end of file if none follows). Because `frontmatterDone` is then set, this suppression cannot repeat — but an entire section of the document can be silently skipped, producing false-negative citation misses.

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
  // else: a '---' thematic break with no frontmatter open — treat as normal line
}
```

---

### CR-02: 3-digit numeric hex colors produce false-positive citation hits

**File:** `scripts/scan-citations.cjs:88`

**Issue:** The lookbehind `(?<![0-9a-fA-F#])` in `INLINE_RE` prevents matching mid-hex-string sequences (e.g., the `70` tail of `#e8c170`) but does NOT prevent matching short hex colors whose digits are purely numeric. A CSS or inline color value like `#123`, `#456`, or `#999` satisfies `#(\d+)\b` and passes the lookbehind (since no hex character precedes the `#` when it appears at word start), producing a spurious `inline` citation hit. These are valid 3-digit and 6-digit CSS hex colors when all digits are `[0-9]`.

**Fix:** Extend the lookbehind or add a negative-lookahead that rules out exactly-3 and exactly-6 digit sequences commonly used as hex colors, or post-filter hits where the match body is 3 or 6 digits with no surrounding code-context signals. A minimal regex fix:

```js
// Add negative lookahead to exclude 3- and 6-digit purely-numeric sequences
// that are plausibly hex colors (heuristic; tunable):
const INLINE_RE = /(?<![0-9a-fA-F#])#(\d+)\b(?!\s*[;:,])/g;
// Alternatively, require at least 4 digits for bare #NNN to be treated as a citation,
// acknowledging that #1, #12, #123 as issue numbers are ambiguous with hex colors:
const INLINE_RE = /(?<![0-9a-fA-F#])#(\d{1,2}|\d{4,})\b/g;
```

The right threshold depends on the project's citation numbering conventions. At minimum, document the known false-positive risk for 3-digit and 6-digit all-numeric sequences in a comment.

---

## Warnings

### WR-01: Unclosed code fence silently suppresses all remaining citations in a file

**File:** `scripts/scan-citations.cjs:136`

**Issue:** The code-fence toggle is symmetric (`inCodeBlock = !inCodeBlock`) with no depth tracking and no end-of-file reset. If a markdown file contains a fenced block that is never closed (malformed document), `inCodeBlock` remains `true` for all subsequent lines in that file. Every citation after the unclosed fence is silently discarded with no warning. For an audit/discovery script, silent omission is a correctness failure — the caller has no way to know the scan is incomplete.

**Fix:** Emit a stderr warning when a file ends while `inCodeBlock` is still true, so operators can identify malformed inputs:

```js
  } // end of lines loop

  if (inCodeBlock) {
    process.stderr.write(`Warning: unclosed code fence in ${relPath} — citations after open fence may be missed\n`);
  }
```

---

### WR-02: Output uses `process.stdout.write` instead of synchronous `fs.writeSync`

**File:** `scripts/scan-citations.cjs:171`

**Issue:** The project convention in CLAUDE.md states: "Always `fs.writeSync(1, data)` (synchronous, avoids pipe teardown race)." `process.stdout.write` on a pipe is asynchronous — if the consuming process closes the pipe before Node.js drains the buffer, the JSON output can be truncated silently. For large scan results this is a real risk.

**Fix:**

```js
// Replace:
process.stdout.write(JSON.stringify(hits, null, 2) + '\n');

// With:
const out = JSON.stringify(hits, null, 2) + '\n';
fs.writeSync(1, out);
```

---

### WR-03: Unreadable files are silently skipped with no stderr notice

**File:** `scripts/scan-citations.cjs:102`

**Issue:** When `readFileSync` throws for any reason other than ENOENT (e.g., permission denied, I/O error), the `catch` block silently `continue`s. The scan result is incomplete with no indication to the caller. A permission error on a large file in an active scan directory would go completely unnoticed, and the JSON output would be treated as a complete and authoritative result.

**Fix:** Distinguish expected vs. unexpected read failures, echoing unexpected ones to stderr:

```js
  } catch (err) {
    if (err.code === 'ENOENT') continue;   // file disappeared between collect and read — benign
    process.stderr.write(`Warning: could not read ${relPath}: ${err.message}\n`);
    continue;
  }
```

---

## Info

### IN-01: Module-level side-effecting file collection runs unconditionally at require-time

**File:** `scripts/scan-citations.cjs:78`

**Issue:** `ALL_FILES` is populated by `readdirSync` calls at module load time (lines 78–81), outside any function. This is acceptable for a CLI script that is never `require()`'d, but it deviates from the project's function-design convention (helpers should return plain values rather than causing side effects on load) and makes the scan scope impossible to override or test without monkey-patching `fs`. Low risk given the script's purpose.

**Fix:** Wrap collection in a `main()` function and call it at the bottom of the file, consistent with how other CLI scripts in this project are structured. This also enables future `--dir` flag support without restructuring.

---

_Reviewed: 2026-06-09_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
