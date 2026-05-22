---
phase: 20-baseline-audit
reviewed: 2026-04-29T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - scripts/audit-tags.js
findings:
  critical: 0
  warning: 3
  info: 4
  total: 7
status: issues_found
---

# Phase 20: Code Review Report

**Reviewed:** 2026-04-29T00:00:00Z
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

Reviewed `scripts/audit-tags.js`, a 209-line Node.js audit script that scans GSD prompt files across five directory levels and writes JSON and Markdown inventory artifacts. The script has no security issues. Three warnings cover crash-risk conditions (unhandled filesystem errors and a missing directory type check) and a level-numbering inconsistency that will silently corrupt the JSON output consumed by downstream phases 21–24. Four info items cover code quality and consistency.

## Warnings

### WR-01: Level field value does not match label for "Level 4b"

**File:** `scripts/audit-tags.js:52-59`
**Issue:** The `LEVELS` array defines five entries. The fourth entry has `level: 4` and label `'Level 4a — Templates'`; the fifth has `level: 5` and label `'Level 4b — References'`. The JSON artifact will therefore emit `"level": 5` for what both the label and the project's milestone documentation call "Level 4b". Any downstream phase that reads the JSON and branches on the numeric `level` field will silently mis-classify these files.
**Fix:** Either change the fifth entry's `level` field to `4` and add a `sublevel` discriminator, or rename the label to match the numeric value. Simplest fix:
```js
// Option A — keep numerics 1–5, fix labels to match
{ level: 5, label: 'Level 5 — References', ... }

// Option B — keep 4a/4b labeling, add sublevel field, keep level:4 for both
{ level: 4, sublevel: 'b', label: 'Level 4b — References', ... }
```

---

### WR-02: `readdirSync` and `readFileSync` crash the process if a directory does not exist

**File:** `scripts/audit-tags.js:110,115`
**Issue:** Both `fs.readdirSync(lvl.dir)` and `fs.readFileSync(filePath, 'utf-8')` throw synchronous errors when a path is missing or unreadable. Because they are called inside a bare `for` loop with no `try/catch`, a single missing directory (e.g., if `get-shit-done/references` has not yet been created) terminates the script immediately with a Node.js stack trace and no partial output. For a re-runnable audit script this makes it brittle against incomplete repo states.
**Fix:**
```js
let filenames;
try {
  filenames = fs.readdirSync(lvl.dir).filter(lvl.filter).sort();
} catch (err) {
  console.warn(`[WARN] Cannot read directory ${lvl.dir}: ${err.message}`);
  levelResults.push({ level: lvl.level, label: lvl.label, directory, canonical_tag: lvl.canonical, total: 0, ok: 0, anomalies: 0, files: [] });
  continue;
}
```
Apply a similar guard around `readFileSync`.

---

### WR-03: `readdirSync` filter does not exclude subdirectories

**File:** `scripts/audit-tags.js:110`
**Issue:** `fs.readdirSync` returns all entries including subdirectories. For levels 2–5 the filter is `f.endsWith('.md')`. A subdirectory whose name ends in `.md` (uncommon but not impossible) would pass the filter and cause `readFileSync` to throw `EISDIR`. For level 1 the filter also checks `startsWith('gsd-')`, so the risk is lower but not zero.
**Fix:** Add a `isFile` guard after `readdirSync`:
```js
const filenames = fs.readdirSync(lvl.dir)
  .filter(f => {
    const full = path.join(lvl.dir, f);
    return fs.statSync(full).isFile() && lvl.filter(f);
  })
  .sort();
```

---

## Info

### IN-01: Trailing newline inconsistency between JSON and Markdown output

**File:** `scripts/audit-tags.js:166,201`
**Issue:** The JSON write appends `+ '\n'` (line 166), so the file ends with a newline. The Markdown write uses `mdLines.join('\n')` without a trailing newline (line 201), so the `.md` file does not end with a newline. Most editors and POSIX tools expect a trailing newline.
**Fix:** Change line 201 to:
```js
fs.writeFileSync(MD_OUT_PATH, mdLines.join('\n') + '\n', 'utf-8');
```

---

### IN-02: All scan logic runs at module top-level, preventing safe import

**File:** `scripts/audit-tags.js:104-208`
**Issue:** The scan, file writes, and `console.log` calls execute unconditionally when the file is `require`'d or `import`'ed. This makes unit testing impossible without triggering real filesystem I/O and prevents reuse of helper functions (`detectTags`, `classifyStatus`) in isolation.
**Fix:** Wrap the main execution block in a guard:
```js
if (require.main === module) {
  // ... all scan and write logic ...
}
```

---

### IN-03: Redundant object re-mapping in JSON output construction

**File:** `scripts/audit-tags.js:154-163`
**Issue:** `levelResults` objects already carry every field written to `jsonOutput.levels`. The `.map()` call only drops the `label` field, but this intent is not documented.
**Fix:** Add a comment to clarify:
```js
// Omit human-readable `label` from machine output; label lives in the MD artifact only.
levels: levelResults.map(({ label: _label, ...rest }) => rest),
```

---

### IN-04: Inline comments restate the obvious on write calls

**File:** `scripts/audit-tags.js:166,201`
**Issue:** `// writes 20-BASELINE-AUDIT.json` and `// writes 20-BASELINE-AUDIT.md` repeat what the variable name `JSON_OUT_PATH` and `MD_OUT_PATH` already convey. They add no diagnostic value.
**Fix:** Remove both inline comments or replace with a comment explaining why the path is hardcoded rather than derived from a shared constant.

---

_Reviewed: 2026-04-29T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
