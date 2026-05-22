---
phase: 14-workflow-reference-and-command-fixes
verified: 2026-04-22T14:00:00Z
status: passed
score: 14/14 must-haves verified
overrides_applied: 0
re_verification: false
---

# Phase 14: Workflow, Reference, and Command Fixes — Verification Report

**Phase Goal:** Replace all bare "do not" directive violations in workflow, reference, and command files with affirmative positive instructions, and keep the test suite green.
**Verified:** 2026-04-22T14:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | analyze-dependencies.md line 100 contains "Preserve the existing phase order — relocate only the dependency field" with no "do not" phrasing | VERIFIED | `grep` returns match at line 100; original "Do not reorder phases" absent |
| 2 | discuss-phase.md line 172 contains "Stop here — power mode handles all remaining steps" with no "do not" phrasing | VERIFIED | `grep` returns match at line 172; original "Do not continue with the steps below" absent |
| 3 | execute-plan.md line 203 contains "Scope auto-fixes to issues introduced by the current task only" with no "do not" phrasing | VERIFIED | `grep` returns match at line 203; "do not auto-fix" absent |
| 4 | import.md Anti-Patterns block replaced with Required Patterns — no "Do NOT:" header remains, all 7 list items are positive imperatives | VERIFIED | "Required Patterns" at line 274; "Anti-Patterns" section header and "Do NOT:" absent |
| 5 | transition.md "Do NOT suggest" and "Do NOT auto-invoke" lines deleted; "**Stop here.**" line preserved | VERIFIED | Both violation strings absent; "Stop here." present at line 567 |
| 6 | verify-phase.md line 241 contains "Source inputs exclusively from actual test fixtures and codebase examples" with no "do not" phrasing | VERIFIED | `grep` returns match at line 241; "Do NOT invent" absent |
| 7 | planner-source-audit.md line 30 contains "Treat these as expected and exclude them from MISSING flags:" with no "do not" phrasing | VERIFIED | `grep` returns match at line 30; "Do not flag these as MISSING" absent |
| 8 | docs-update.md line 42 contains "Treat a flag as active only if its literal token is present in `$ARGUMENTS`" with no "do not" phrasing | VERIFIED | `grep` returns match at line 42; "Do not infer" absent |
| 9 | execute-phase.md line 54 contains the identical positive inference rule with no "do not" phrasing | VERIFIED | `grep` returns match at line 54; "Do not infer" absent |
| 10 | tests/execute-phase-active-flags.test.cjs line 50 asserts the new positive text; old "Do not infer..." assertion string is gone | VERIFIED | Line 50 asserts `content.includes('Treat a flag as active only if its literal token is present in \`$ARGUMENTS\`')`; old string absent |
| 11 | reapply-patches.md line 271 contains "Proceed to Step 6 only after the user confirms all unverified hunks are resolved" | VERIFIED | `grep` returns match at line 271; "Do not proceed to cleanup" absent |
| 12 | npm test workflow corpus scan subtest passes (0 violations) | VERIFIED | `no bare DO NOT directives in workflow files` passes in the full corpus scan suite |
| 13 | npm test reference corpus scan subtest passes (0 violations) | VERIFIED | `no bare DO NOT directives in reference files` passes in the full corpus scan suite |
| 14 | npm test command corpus scan subtest passes (0 violations) | VERIFIED | `no bare DO NOT directives in command files` passes in the full corpus scan suite |

**Score:** 14/14 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `get-shit-done/workflows/analyze-dependencies.md` | FRAMING-07 fix — positive phase-order instruction | VERIFIED | Line 100: "Preserve the existing phase order — relocate only the dependency field" |
| `get-shit-done/workflows/discuss-phase.md` | FRAMING-08 fix — positive stop instruction | VERIFIED | Line 172: "Stop here — power mode handles all remaining steps" |
| `get-shit-done/workflows/execute-plan.md` | FRAMING-09 fix — positive scope boundary | VERIFIED | Line 203: "Scope auto-fixes to issues introduced by the current task only — leave pre-existing issues untouched" |
| `get-shit-done/workflows/import.md` | FRAMING-10 fix — Required Patterns block replacing Anti-Patterns | VERIFIED | Line 274: "## Required Patterns" with 7 positive imperative list items; "Anti-Patterns" header absent |
| `get-shit-done/workflows/transition.md` | FRAMING-11 + FRAMING-12 fix — violation lines deleted | VERIFIED | "Do NOT suggest" and "Do NOT auto-invoke" lines absent; "Stop here." line preserved at line 567 |
| `get-shit-done/workflows/verify-phase.md` | FRAMING-13 fix — positive source instruction | VERIFIED | Line 241: "Source inputs exclusively from actual test fixtures and codebase examples." |
| `get-shit-done/references/planner-source-audit.md` | FRAMING-14 fix — affirmative exclusion header | VERIFIED | Line 30: "Treat these as expected and exclude them from MISSING flags:" |
| `commands/gsd/docs-update.md` | FRAMING-15 fix — positive token-check rule | VERIFIED | Line 42: "Treat a flag as active only if its literal token is present in `$ARGUMENTS`" |
| `commands/gsd/execute-phase.md` | FRAMING-16 fix — positive token-check rule | VERIFIED | Line 54: "Treat a flag as active only if its literal token is present in `$ARGUMENTS`" |
| `tests/execute-phase-active-flags.test.cjs` | D-11 test sync — assertion updated | VERIFIED | Line 50 asserts new positive text; failure message updated to "context should require deriving flag state from $ARGUMENTS literal token" |
| `commands/gsd/reapply-patches.md` | FRAMING-17 fix — positive sequencing gate | VERIFIED | Line 271: "Proceed to Step 6 only after the user confirms all unverified hunks are resolved." |
| `tests/negative-framing-scan.test.cjs` | Command DO NOT corpus subtest added | VERIFIED | "no bare DO NOT directives in command files" subtest present and passing (Rule 2 deviation — required for acceptance criteria) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `get-shit-done/workflows/import.md` | Required Patterns block | Block rewrite of Anti-Patterns section | VERIFIED | "Required Patterns" header at line 274; complete 7-item positive list present |
| `get-shit-done/workflows/transition.md` | **Stop here.** line | Deletion of "Do NOT suggest" and "Do NOT auto-invoke" lines | VERIFIED | Stop here gate at line 567 intact; violation lines absent |
| `commands/gsd/execute-phase.md` | `tests/execute-phase-active-flags.test.cjs` | Test assertion string must match source text exactly | VERIFIED | Both contain identical string "Treat a flag as active only if its literal token is present in `$ARGUMENTS`" |

### Data-Flow Trace (Level 4)

Not applicable. Phase 14 produces only text edits to markdown prompt files and test assertion updates. No dynamic data rendering involved.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 4168 tests pass with 0 failures | `npm test` | 4168 pass, 0 fail | PASS |
| Workflow corpus scan: 0 bare DO NOT violations | `npm test` — "no bare DO NOT directives in workflow files" | Passing | PASS |
| Reference corpus scan: 0 bare DO NOT violations | `npm test` — "no bare DO NOT directives in reference files" | Passing | PASS |
| Command corpus scan: 0 bare DO NOT violations | `npm test` — "no bare DO NOT directives in command files" | Passing | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| FRAMING-07 | 14-01-PLAN.md | analyze-dependencies.md:100 — "Do not reorder phases" → positive | SATISFIED | Line 100 confirmed; violation absent |
| FRAMING-08 | 14-01-PLAN.md | discuss-phase.md:172 — "Do not continue" → positive stop | SATISFIED | Line 172 confirmed; violation absent |
| FRAMING-09 | 14-01-PLAN.md | execute-plan.md:203 — "do not auto-fix" → positive scope | SATISFIED | Line 203 confirmed; violation absent |
| FRAMING-10 | 14-01-PLAN.md | import.md:276 — "Do NOT:" block → Required Patterns | SATISFIED | "Required Patterns" block present; "Anti-Patterns" + "Do NOT:" absent |
| FRAMING-11 | 14-01-PLAN.md | transition.md:567 — "Do NOT suggest /gsd-complete-milestone" deleted | SATISFIED | Line absent; Stop here gate preserved |
| FRAMING-12 | 14-01-PLAN.md | transition.md:568 — "Do NOT auto-invoke" deleted | SATISFIED | Line absent |
| FRAMING-13 | 14-01-PLAN.md | verify-phase.md:241 — "Do NOT invent example inputs" → positive | SATISFIED | Line 241 confirmed; violation absent |
| FRAMING-14 | 14-01-PLAN.md | planner-source-audit.md:30 — "Do not flag these as MISSING:" → affirmative | SATISFIED | Line 30 confirmed; violation absent |
| FRAMING-15 | 14-02-PLAN.md | docs-update.md:42 — "Do not infer that a flag is active" → positive | SATISFIED | Line 42 confirmed; violation absent |
| FRAMING-16 | 14-02-PLAN.md | execute-phase.md:54 — same fix; test assertion co-updated | SATISFIED | Line 54 confirmed; test line 50 asserts new text |
| FRAMING-17 | 14-02-PLAN.md | reapply-patches.md:271 — "Do not proceed to cleanup" → positive gate | SATISFIED | Line 271 confirmed; violation absent |

**Orphaned requirements check:** TEST-05 is assigned to Phase 15 in REQUIREMENTS.md. Phase 14 plans do not claim TEST-05. The Phase 14 plans instead validate via explicit scan subtests within their own acceptance criteria (not under TEST-05). TEST-05 is not an orphan for Phase 14 — it belongs to Phase 15.

Note: REQUIREMENTS.md traceability table still shows all FRAMING-07 through FRAMING-17 as "Pending" (using `[ ]` checkboxes). This is a documentation tracking artifact — the codebase evidence confirms all requirements are implemented. Updating REQUIREMENTS.md checkboxes is not required for phase goal achievement.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `get-shit-done/workflows/discuss-phase.md` | 119, 130, 496, 620, 675, 732, 825, 981, 1148 | Remaining "do not" / "Do NOT" occurrences | Info | These are NOT at the target lines and are not bare violations per the scanner's `hasPositiveComplement` logic (they have em-dash complements, parentheticals, or are preceded by periods). Corpus scan passes, confirming they are correctly excluded. |
| `get-shit-done/workflows/execute-plan.md` | 13, 139, 158, 166, 258, 275 | Remaining "do not" occurrences | Info | Same as above — not bare violations; all pass the scanner's complement check. |
| `get-shit-done/workflows/import.md` | 118, 241 | Remaining "do not" occurrences | Info | Not bare violations; em-dash complements or non-targeted lines. |
| `get-shit-done/workflows/transition.md` | 523 | "Do NOT suggest completing..." | Info | Confirmed scanner exclusion — has period-before-uppercase pattern (`hasPositiveComplement`), noted explicitly in 14-01-SUMMARY.md as a deliberate non-edit. |
| `commands/gsd/reapply-patches.md` | 202, 221 | Remaining "do not" occurrences | Info | Not at the target line (271); have positive complements. |

No blocker anti-patterns found. All remaining "do not" occurrences in the modified files are outside the targeted violation sites and pass the corpus scanner's complement logic.

### Human Verification Required

None. All must-haves are verifiable programmatically via grep and the test suite.

### Gaps Summary

No gaps. All 11 FRAMING requirements (FRAMING-07 through FRAMING-17) are implemented and verified. All 14 observable truths pass. The test suite shows 4168 passing tests and 0 failures. The corpus scan suite shows all 4 subtests (agent, command, workflow, reference) passing with 0 bare DO NOT violations.

---

_Verified: 2026-04-22T14:00:00Z_
_Verifier: Claude (gsd-verifier)_
