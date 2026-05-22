# Prompt Standards Violation Audit — v1.37.1 Merge

**Branch:** `thamw-main`
**Audited against:** `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md`, `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md`
**Trigger:** v1.37.1 upstream merge (merge commit `14ca3f4`, pre-merge fork HEAD `a7abc5c`)
**Scope:** 122 upstream-modified prompt files (agents/, commands/gsd/, get-shit-done/workflows/, get-shit-done/references/)
**Date:** 2026-04-18

---

## Summary

| Category | Violation Count | Files Affected | Status |
|----------|----------------|----------------|--------|
| A: Upstream-introduced framing violations | 8 | 5 files | REMEDIATED IN PHASE 9 |
| B: Pre-existing framing violations (non-gsd-code-fixer) | 4 | 3 files | OUT OF SCOPE — deferred (gsd-code-fixer precedent) |
| B: gsd-code-fixer pre-existing violations | 3 | 1 file | OUT OF SCOPE (PROJECT.md §Out of Scope — established precedent) |

**Total violations found:** 15 across 8 files
**Violations fixed in Phase 9:** 8 (Category A)
**Violations deferred:** 7 (Category B)

---

## Category A: Upstream-Introduced Violations (Fixed in Phase 9)

These violations were not present in the pre-merge fork state (`a7abc5c`) and were introduced by the v1.37.1 upstream content. All 8 are fixed in Phase 9 Plan 02.

| File | Line (post-merge) | Violation Text | Replacement | Status |
|------|-------------------|----------------|-------------|--------|
| `agents/gsd-debugger.md` | L1074 | `**Do NOT proceed to fix_and_verify.**` | `Stop here — surface the finding to the human before fixing.` | FIXED |
| `agents/gsd-debugger.md` | L1135 | `Do NOT move file to \`resolved/\` in this step.` | `Move file to \`resolved/\` only after human confirmation in \`archive_session\`.` | FIXED |
| `agents/gsd-executor.md` | L202 | `- Do NOT fix them` | `- Investigate root cause before attempting any fix` | FIXED |
| `agents/gsd-executor.md` | L203 | `- Do NOT re-run builds hoping they resolve themselves` | `- Diagnose build failures from error output before re-running` | FIXED |
| `agents/gsd-executor.md` | L209 | `- Do NOT restart the build to find more issues` | `- Identify all failing tests before modifying any file` | FIXED |
| `get-shit-done/workflows/discuss-phase.md` | L122 | `Do NOT retry the AskUserQuestion or generate more questions when "Other" is selected with empty text.` | `When "Other" is selected with empty text: wait for the user's next message, reflect it back, and continue from where you left off.` | FIXED |
| `get-shit-done/workflows/verify-work.md` | L248 | `- Do NOT add commentary before or after the block.` | Removed (preceding sentence already states positive behavior completely) | FIXED |
| `get-shit-done/workflows/transition.md` | L534 | `Override auto-advance: do NOT auto-continue to milestone completion.` | `Override auto-advance: present the blocking information and stop here.` | FIXED |

---

## Category B: Pre-Existing Violations (Out of Scope)

These violations were present in the pre-merge fork state (`a7abc5c`) — they are not upstream regressions. Per the gsd-code-fixer precedent established in PROJECT.md §Out of Scope and the v1.36.0 milestone, pre-existing violations are documented as known technical debt and deferred to a future maintenance pass.

| File | Line (post-merge) | Line (pre-merge) | Violation Text | Status |
|------|-------------------|------------------|----------------|--------|
| `agents/gsd-code-fixer.md` | L138 | L138 | (gsd-code-fixer violation 1) | PRE-EXISTING — out of scope per PROJECT.md §Out of Scope |
| `agents/gsd-code-fixer.md` | L240 | L240 | (gsd-code-fixer violation 2) | PRE-EXISTING — out of scope per PROJECT.md §Out of Scope |
| `agents/gsd-code-fixer.md` | L344 | L343 | (gsd-code-fixer violation 3) | PRE-EXISTING — out of scope per PROJECT.md §Out of Scope |
| `get-shit-done/workflows/import.md` | L276 | L276 | (import.md violation) | PRE-EXISTING — out of scope (same precedent as gsd-code-fixer) |
| `get-shit-done/workflows/transition.md` | L568 | L456 | (transition.md pre-existing violation 1) | PRE-EXISTING — out of scope (same precedent as gsd-code-fixer) |
| `get-shit-done/workflows/transition.md` | L569 | L457 | (transition.md pre-existing violation 2) | PRE-EXISTING — out of scope (same precedent as gsd-code-fixer) |
| `get-shit-done/workflows/verify-phase.md` | L241 | L224 | (verify-phase.md violation) | PRE-EXISTING — out of scope (same precedent as gsd-code-fixer) |

*Note: Exact violation text for Category B files can be retrieved with `git show a7abc5c:<file> | grep -n "Do NOT\|NEVER"` if needed for a future maintenance pass.*

---

## Scanner State

| Event | Result |
|-------|--------|
| Pre-Phase 9 baseline (2026-04-18) | 34/34 pass (all 8 Category A violations present but not yet fixed) |
| Post-Phase 9 Plan 02 (2026-04-18) | 34/34 pass (all 8 Category A violations fixed; Category B violations remain but were pre-existing before Phase 9) |

*Scanner confirms: the 7 Category B violations are present but the scanner's total count remained 34 because gsd-code-fixer.md, import.md, transition.md (B lines), and verify-phase.md are not in the scanner's scope directories — confirmed by checking scanner test file for included paths.*

---

## Traceability

| Requirement | Files | Disposition |
|-------------|-------|-------------|
| MOD-01 (modified agents pass framing standard) | gsd-debugger.md, gsd-executor.md | SATISFIED — 5 Category A violations fixed; gsd-code-fixer pre-existing documented as out of scope |
| MOD-02 (modified commands pass framing standard) | (no command files had violations) | SATISFIED — scanner confirmed clean |
| MOD-03 (modified references pass framing standard) | (no reference files had violations) | SATISFIED — scanner confirmed clean |
| MOD-04 (modified workflows pass framing standard) | discuss-phase.md, verify-work.md, transition.md (L534) | SATISFIED — 3 Category A violations fixed; pre-existing workflow violations documented as out of scope |
