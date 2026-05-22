---
phase: 018-fork-tag-corpus-tests
fixed_at: 2026-04-28T00:00:00Z
fix_scope: all
findings_in_scope: 5
fixed: 5
skipped: 0
iteration: 1
status: all_fixed
---

# Phase 018: Code Review Fix Report

**Fixed:** 2026-04-28
**Scope:** All (Critical + Warning + Info — 5 findings)
**Status:** all_fixed

## Fixes Applied

### WR-01 — Intent test strips code fences (false positive eliminated)

**File:** `tests/fork-intent-tag.test.cjs`
**Change:** Added `content.replace(/```[\s\S]*?```/g, '')` before splitting lines for bare-tag detection.

`research-phase.md` was previously reported as a violation because it documented `<objective>` inside a triple-backtick code fence. After the fix, the file passes. The 33 remaining failures are all BY DESIGN (genuine unmigrated `<objective>` blocks, documented in the DESIGN NOTE comment).

**Commit:** `fix(018): strip code fences in intent test; add </role> closing tag guard`

---

### WR-02 — Persona test guards against orphaned `</role>` closing tags

**File:** `tests/fork-persona-tag.test.cjs`
**Change:** Added a second `assert.ok` in the `<role>` absence test to also reject `</role>` closing tags outside code fences.

Previously a partial upstream revert that replaced only `</persona>` with `</role>` (leaving `<persona>` as the opening tag) would produce a malformed block that passed both tests silently. The additional assertion closes that gap.

**Commit:** `fix(018): strip code fences in intent test; add </role> closing tag guard`

---

### IN-01 — Correct stale count in DESIGN NOTE comment

**File:** `tests/fork-intent-tag.test.cjs:11`
**Change:** Updated comment from "32 command files" to "33 command files" (verified by enumeration).

**Commit:** `fix(018): apply info-level review fixes`

---

### IN-02 — Add `.sort()` to agents array for deterministic ordering

**File:** `tests/fork-persona-tag.test.cjs:22-23`
**Change:** Added `.sort()` to the `fs.readdirSync()` chain, matching the approach in `fork-intent-tag.test.cjs`.

**Commit:** `fix(018): apply info-level review fixes`

---

### IN-03 — Strip inline backtick spans in persona `<role>` absence check

**File:** `tests/fork-persona-tag.test.cjs:38`
**Change:** Extended fence stripping to also remove inline backtick spans (`.replace(/\`[^\`]+\`/g, '')`), closing the false-positive gap for agent files that document `<role>` in inline code rather than a fenced block.

**Commit:** `fix(018): apply info-level review fixes`

---

_Fixed: 2026-04-28_
_Fixer: Claude (gsd-code-fixer)_
