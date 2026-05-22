---
phase: 08-catalogue-sync
reviewed: 2026-04-17T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - CATALOGUE.json
  - docs/ARCHITECTURE.md
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 8: Code Review Report

**Reviewed:** 2026-04-17
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Phase 8 added 20 new v1.37.1 entries to CATALOGUE.json (6 commands, 8 references, 5 workflows, 1 template) and updated ARCHITECTURE.md's workflow count from 76 to 80.

The counts block in CATALOGUE.json is fully accurate (total=270, commands=79, references=48, workflows=80, templates=32, agents=31). All file path prefixes are correct across all five sections. No duplicate entries exist. No JSON validity problems were found.

Two ordering violations are directly attributable to phase 8 (new entries appended at incorrect positions). Two stale inline counts in ARCHITECTURE.md were not updated alongside the heading-level counts. Several pre-existing ordering violations also exist across commands, workflows, and references — these predate phase 8 and are documented as Info items for completeness.

---

## Warnings

### WR-01: New template `AI-SPEC.md` appended at wrong position in templates array

**File:** `CATALOGUE.json:1096`
**Issue:** `get-shit-done/templates/AI-SPEC.md` was appended at position 31 (the last entry). Case-insensitive alphabetical ordering places `AI-SPEC.md` before `claude-md.md` (A < c), so it should be at position 0. Every other template entry is in alphabetical order relative to each other; this single misplacement breaks the array's sort invariant from the first element onward.
**Fix:** Move the `AI-SPEC.md` object to the start of the `"templates"` array, before `claude-md.md`:
```json
"templates": [
  {
    "file": "get-shit-done/templates/AI-SPEC.md",
    "description": "AI integration specification template for phases that involve building AI systems"
  },
  {
    "file": "get-shit-done/templates/claude-md.md",
    ...
  },
  ...
]
```

---

### WR-02: New reference `mandatory-initial-read.md` inserted at wrong position

**File:** `CATALOGUE.json:858`
**Issue:** `get-shit-done/references/mandatory-initial-read.md` is at position 20, after `model-profile-resolution.md` (pos 18) and `model-profiles.md` (pos 19). Alphabetically, `mandatory-` (ma) precedes `model-` (mo), so `mandatory-initial-read.md` should appear before both `model-profile-resolution.md` entries — at position 18. This misplacement is caused by the entry being inserted near the end of the pre-existing block rather than at its correct sorted position.
**Fix:** Move `mandatory-initial-read.md` to appear before `model-profile-resolution.md`:
```json
    { "file": "get-shit-done/references/mandatory-initial-read.md", ... },
    { "file": "get-shit-done/references/model-profile-resolution.md", ... },
    { "file": "get-shit-done/references/model-profiles.md", ... },
```

---

### WR-03: ARCHITECTURE.md references section heading states stale count `(35 total)`

**File:** `docs/ARCHITECTURE.md:141`
**Issue:** The References section opens with "Shared knowledge documents that workflows and agents `@-reference` (35 total):" but there are now 48 references in the catalogue. The heading-level counts on lines 127 and 135 were correctly updated to 80 and 31 respectively; the inline parenthetical on line 141 was missed.
**Fix:**
```markdown
Shared knowledge documents that workflows and agents `@-reference` (48 total):
```

---

### WR-04: ARCHITECTURE.md File System Layout comment lists stale workflow and reference counts

**File:** `docs/ARCHITECTURE.md:416-417`
**Issue:** The ASCII file system tree on lines 416–417 reads:
```
│   ├── workflows/*.md              # 72 workflow definitions
│   ├── references/*.md             # 35 shared reference docs
```
Both numbers are stale. Workflows is now 80 (not 72) and references is now 48 (not 35). The section-level headings were updated but these inline comments in the diagram were not.
**Fix:**
```
│   ├── workflows/*.md              # 80 workflow definitions
│   ├── references/*.md             # 48 shared reference docs
```

---

## Info

### IN-01: Pre-existing ordering violations in `commands` array (5 adjacent-pair swaps)

**File:** `CATALOGUE.json:62-66, 143-147, 244-248, 275-281, 284-290`
**Issue:** Five pairs of commands are swapped relative to strict ASCII-lowercase alphabetical order. These all predate phase 8:
- `code-review.md` before `code-review-fix.md` (should be: fix < base)
- `inbox.md` before `import.md` (should be: import < inbox — 'im' < 'in')
- `review.md` before `review-backlog.md` (should be: backlog < base)
- `sketch.md` before `sketch-wrap-up.md` (should be: wrap-up < base)
- `spike.md` before `spike-wrap-up.md` (should be: wrap-up < base)

These appear to reflect a deliberate "base before variant" convention applied inconsistently, since other hyphenated pairs (e.g., `audit-fix` before `audit-milestone`) follow strict ASCII order. A project-wide decision on convention (strict ASCII vs. base-first) would resolve these.
**Fix:** If strict ASCII is the convention, swap each pair. If base-before-variants is intentional, document it and apply consistently.

---

### IN-02: Pre-existing ordering violations in `workflows` array (4 pairs)

**File:** `CATALOGUE.json:374-378, 397-409, 594-600, 609-615`
**Issue:** Four groups of workflow entries are out of ASCII-lowercase sort order, all predating phase 8:
- `code-review.md` before `code-review-fix.md`
- `discuss-phase.md` before `discuss-phase-assumptions.md` and `discuss-phase-power.md`
- `sketch.md` before `sketch-wrap-up.md`
- `spike.md` before `spike-wrap-up.md`

Same base-before-variant pattern as IN-01.
**Fix:** Apply the same convention decision as IN-01 consistently.

---

### IN-03: Pre-existing ordering violations in `references` array (3 pairs)

**File:** `CATALOGUE.json:817-821, 868-878`
**Issue:** Three pairs of reference entries are out of ASCII-lowercase sort order, all predating phase 8:
- `decimal-phase-calculation.md` before `debugger-philosophy.md` (should be: debugger < decimal — 'deb' < 'dec')
- `planner-source-audit.md` before `planner-revision.md` (should be: revision < source-audit — 'r' < 's')

**Fix:** Swap each pair to restore strict alphabetical order.

---

_Reviewed: 2026-04-17_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
