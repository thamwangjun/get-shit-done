---
phase: 20-baseline-audit
fixed_at: 2026-04-29T00:00:00Z
review_path: .planning/phases/20-baseline-audit/20-REVIEW.md
iteration: 1
fix_scope: all
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 20: Code Review Fix Report

**Fixed at:** 2026-04-29T00:00:00Z
**Source review:** .planning/phases/20-baseline-audit/20-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 7
- Fixed: 7
- Skipped: 0

## Fixed Issues

### WR-01: Level field value does not match label for "Level 4b"

**Files modified:** `scripts/audit-tags.js`
**Commit:** 3dc2b2d8
**Applied fix:** Changed the fifth LEVELS entry label from `'Level 4b — References'` to `'Level 5 — References'` so the human-readable label matches the numeric `level: 5` field value. This prevents downstream JSON consumers from misclassifying files when reading the `level` field.

### WR-02 + WR-03: `readdirSync`/`readFileSync` crash risk and EISDIR risk

**Files modified:** `scripts/audit-tags.js`
**Commit:** 1be0c5cd
**Applied fix:** Both warnings were resolved together since they affect the same loop section:
- (WR-02) Wrapped `fs.readdirSync` in a `try/catch` that emits a `[WARN]` message and pushes an empty result entry before `continue`-ing to the next level, preventing the script from crashing on missing directories. Also wrapped `fs.readFileSync` in a `try/catch` that warns and skips the file.
- (WR-03) Added an `fs.statSync(full).isFile()` guard inside the `readdirSync` filter so subdirectories (including any whose names end in `.md`) are excluded before the filename filter runs. The `statSync` call is inside the outer `try/catch` so a stat failure on a directory entry also triggers the graceful warn-and-skip path.

### IN-01: Trailing newline inconsistency between JSON and Markdown output

**Files modified:** `scripts/audit-tags.js`
**Commit:** 58b72099
**Applied fix:** Changed the Markdown `writeFileSync` call from `mdLines.join('\n')` to `mdLines.join('\n') + '\n'` so both output files end with a trailing newline, matching POSIX conventions and editor expectations. Also removed the redundant inline comment on that line (superseded by IN-04 fix).

### IN-02: All scan logic runs at module top-level, preventing safe import

**Files modified:** `scripts/audit-tags.js`
**Commit:** 8bc190e4
**Applied fix:** Wrapped the entire main execution block (timestamp initialization, level scan loop, JSON write, Markdown write, console summary) in `if (require.main === module) { ... }`. Helper functions `detectTags` and `classifyStatus` remain at module top-level so they can be imported and tested independently without triggering filesystem I/O.

### IN-03: Redundant object re-mapping in JSON output construction

**Files modified:** `scripts/audit-tags.js`
**Commit:** b0950ae2
**Applied fix:** Replaced the explicit field-by-field `.map()` with a destructuring spread that drops only the `label` field, and added a comment: `// Omit human-readable 'label' from machine output; label lives in the MD artifact only.` This makes the intent clear and removes the implicit "copy all other fields" boilerplate.

### IN-04: Inline comments restate the obvious on write calls

**Files modified:** `scripts/audit-tags.js`
**Commit:** 7aa15a76
**Applied fix:** Removed the `// writes 20-BASELINE-AUDIT.json` inline comment from the `writeFileSync` call for the JSON artifact. The Markdown write comment was already removed as part of the IN-01 fix. The variable names `JSON_OUT_PATH` and `MD_OUT_PATH` make the destination self-evident.

---

_Fixed: 2026-04-29T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
