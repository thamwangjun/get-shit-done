---
phase: 64-citation-pattern-exploration
fixed_at: 2026-06-09T00:00:00Z
review_path: .planning/phases/64-citation-pattern-exploration/64-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 64: Code Review Fix Report

**Fixed at:** 2026-06-09
**Source review:** `.planning/phases/64-citation-pattern-exploration/64-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 7
- Fixed: 7
- Skipped: 0

## Fixed Issues

### WR-01: Mid-document `---` incorrectly activates frontmatter suppression

**Files modified:** `scripts/scan-citations.cjs`
**Commit:** `8f30da01`
**Applied fix:** Added `lineNumber === 1` guard to the frontmatter open-detection branch so `---` on any line other than line 1 is treated as a thematic break (normal content) rather than a frontmatter opening delimiter.

---

### WR-02: Unclosed code fence silently suppresses all remaining citations in a file

**Files modified:** `scripts/scan-citations.cjs`
**Commit:** `3a0aad14`
**Applied fix:** Added a check after the per-file lines loop: if `inCodeBlock` is still `true` at end-of-file, emit a stderr warning naming the file and noting that citations after the open fence may have been missed.

---

### WR-03: Unreadable files are silently skipped with no diagnostic output

**Files modified:** `scripts/scan-citations.cjs`
**Commit:** `1f8083c0`
**Applied fix:** Replaced the bare `continue` in the read-error catch block with a check on `err.code`: ENOENT continues silently (file vanished after collection — benign); all other errors emit a stderr warning with the relative path and error message before continuing. The relative path is computed inside the catch block (as `errRelPath`) since `relPath` is declared after the try/catch in the original code.

---

### WR-04: Output uses `process.stdout.write` instead of synchronous `fs.writeSync`

**Files modified:** `scripts/scan-citations.cjs`
**Commit:** `de51caa1`
**Applied fix:** Replaced `process.stdout.write(JSON.stringify(hits, null, 2) + '\n')` with `const out = JSON.stringify(hits, null, 2) + '\n'; fs.writeSync(1, out);` to match the project convention in CLAUDE.md and avoid pipe teardown data loss.

---

### IN-01: 3-digit all-numeric hex colors are potential false-positive citation hits

**Files modified:** `scripts/scan-citations.cjs`
**Commit:** `61bde259`
**Applied fix:** Added a multi-line comment above `INLINE_RE` documenting the known false-positive: 3-digit all-numeric CSS hex colors (`#123`, `#456`, `#999`) pass the lookbehind and are reported as `inline` citations. The comment notes the low probability in prompt markdown files and suggests a stricter regex if project citation numbers are always 4+ digits.

---

### IN-02: Module-level file collection runs unconditionally at require-time

**Files modified:** `scripts/scan-citations.cjs`
**Commit:** `157993aa`
**Applied fix:** Removed the module-level `ALL_FILES` collection and the top-level scan loop. Wrapped the collection and scan driver in a `main(projectRoot, scanDirs)` function. Added a `require.main === module` guard so `main()` is only called when the script is run directly. Added `module.exports = { collectMarkdownFiles, main }` at the bottom to enable unit testing with fixture directories.

---

### IN-03: Argument validation loop rejects `--` separator injected by some shells and npm scripts

**Files modified:** `scripts/scan-citations.cjs`
**Commit:** `11760bf9`
**Applied fix:** Added `if (arg === '--') continue;` as the first statement in the argument validation loop so the bare `--` separator (injected by `npm exec` and some shell wrappers) is silently skipped rather than triggering an "Unknown flag" error.

---

_Fixed: 2026-06-09_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
