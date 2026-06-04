---
quick_task: 260604-8ol
title: Amend locked planning artifacts — abolish effort omission (medium floor)
type: docs-only
status: complete
date: 2026-06-04
files_modified:
  - .planning/REQUIREMENTS.md
  - .planning/ROADMAP.md
commit: 8b1ef7be
requirements: [SPAWN-02]
---

# Quick Task 260604-8ol: Amend Locked Planning Artifacts Summary

Amended the two live, locked planning artifacts (`REQUIREMENTS.md`, `ROADMAP.md`) so they reflect Phase 56 decisions D-08 (allowlist-gated `medium` floor) and D-04 (mechanistic pre-built carrier token): a bare `{claude, codex}` slot now floors to `medium` instead of resolving to `null`/omit. Docs-only, single commit, no code or tests touched.

## What Changed

Applied the (a)/(b)/(c) classification rule to every grep hit; only category (c) clauses (the "bare → null → zero-emission / byte-identical / resolve identically" guarantees for `{claude, codex}`) were edited. Category (a) parser `;`-delimiter text and category (b) non-effort-runtime/`inherit` omit text were left verbatim.

### REQUIREMENTS.md (3 category-(c) edits)
- **Intro (line 8):** "purely additive … resolve identically to today" qualified — plumbing is additive, but bare `{claude, codex}` slots now floor to `medium` (D-08); `inherit` + non-effort runtimes still omit.
- **SPAWN-02:** "pass effort conditionally, omitting it entirely when absent" rewritten to the medium-floor + pre-built-carrier-token (D-04) semantics. ID and checkbox preserved.
- **TEST-01:** rebaselined — the golden snapshot now proves the INTENDED post-D-08 resolution (bare claude/codex effort `null` → `medium`; MODEL values unchanged; pre ≠ post expected).

### ROADMAP.md (7 category-(c) clauses across Milestone goal + Phases 53/54/56/57/58)
- **Milestone Goal:** "purely additive — resolve identically" qualified to the D-08 floor.
- **Phase 53 Goal + criterion 2:** bare `{claude, codex}` fallthrough is now `medium`, not omit; `inherit` + bare adaptive still omit. Criterion 4 ("Every runtime outside `{claude, codex}` omits effort") left verbatim (category b).
- **Phase 54 Goal + criterion 4:** exposure layer mirrors the resolver floor — bare claude/codex expose `medium`; inherit/non-effort stay `null`. Phase 54 D-01 explicit-null contract retained.
- **Phase 56 Goal + criterion 2:** rewritten to the pre-built carrier token + medium floor; added a one-line note that D-08 reopens the Phase 53 resolver (`resolveReasoningEffortInternal` gains the allowlist-gated floor).
- **Phase 57 criterion 3:** zero-emission guard now scoped to the 8 non-effort runtimes; `{claude, codex}` emit `medium` for bare slots. Criteria 1–2 unchanged.
- **Phase 58 Goal + criterion 1:** golden snapshot reworded to prove intended new resolution (bare claude/codex → `medium`), not pre==post identity. Criteria 2–5 (parser fixtures, omit/translate contract, strict-equality, full-suite) intact.

## Preservation Verification
- All 30 requirement IDs present (unchanged count).
- Diff is balanced 1-for-1 line replacements: REQUIREMENTS 3+/3-, ROADMAP 10+/10- — no rows/headings/checkboxes/depends-on lines/plan lists added or removed.
- `{claude, codex}` allowlist language retained throughout (REQUIREMENTS ×6, ROADMAP ×12) — it now scopes the floor, not deleted.
- "Every runtime outside `{claude, codex}` omits effort" (category b) preserved verbatim at ROADMAP line 344.
- KEEP hits untouched: PARSE-01/02, RESOLVE-05/06, CONFIG-01 (categories a/b).
- `git show` confirms commit contains only the two `.planning/*.md` files — no `.cjs`/`.ts`/`.test.` files.

## Deviations from Plan

None — plan executed exactly as written. No auto-fixes, no checkpoints, no auth gates.

## Self-Check: PASSED
- FOUND: .planning/REQUIREMENTS.md
- FOUND: .planning/ROADMAP.md
- FOUND commit: 8b1ef7be
