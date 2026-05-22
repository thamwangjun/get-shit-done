---
phase: 09-fork-standards-pass
reviewed: 2026-04-18T00:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - get-shit-done/workflows/spec-phase.md
  - get-shit-done/references/mandatory-initial-read.md
  - agents/gsd-debugger.md
  - agents/gsd-executor.md
  - get-shit-done/workflows/discuss-phase.md
  - get-shit-done/workflows/verify-work.md
  - get-shit-done/workflows/transition.md
findings:
  critical: 0
  warning: 5
  info: 3
  total: 8
status: issues_found
---

# Phase 9: Code Review Report

**Reviewed:** 2026-04-18
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

These files are GSD workflow prompt files reviewed against the V09 prompt standard
(positive framing, structural conformance, behavioral instruction quality, and
cross-file consistency). The primary goal of Phase 9 was to remediate 8
upstream-introduced framing violations; all 8 fixes were verified as correctly
applied. However, several additional issues were found during full-file analysis:

- 5 warnings covering surviving bare negative directives (without positive
  alternatives), a missing positive alternative in a constraint, and a structural
  block not present in the V09 analog pattern
- 3 info items covering a mojibake encoding artifact, a required_reading
  inconsistency between files, and two consecutive bare negatives at the end of
  the Route B1 block in transition.md

No critical issues were found. All Phase 9 primary objectives (the 8 Category A
violation fixes) were completed correctly.

## Warnings

### WR-01: `spec-phase.md` — Bare negative directives in `<critical_rules>` with no positive alternatives

**File:** `get-shit-done/workflows/spec-phase.md:263-266`
**Issue:** The `<critical_rules>` block contains three bare negative directives that
have no affirmative alternative paired in the same or immediately following
sentence:

- L263: `SPEC.md is NEVER written if the user selects "Abandon"` — no positive
  alternative ("Write SPEC.md only after..." form) is paired.
- L264: `Do NOT ask about HOW to implement — that is discuss-phase territory` — the
  em-dash clause explains WHY, not WHAT TO DO instead. The exemption pattern
  requires an affirmative (`NEVER X — always Y`), not just a rationale.
- L266: `do not frontload all questions at once` — no affirmative constraint given.

These are not in VIOLATIONS.md Category A (upstream-introduced), which means they
were either pre-existing or overlooked during the audit. Given Phase 9's explicit
scope covers new file audits (Plan 01) AND that spec-phase.md is listed as a new
V09 file in 09-PATTERNS.md ("exact" match to spike.md), these violations are
within scope for this phase.

**Fix:**
```markdown
# L263 — replace:
- SPEC.md is NEVER written if the user selects "Abandon"
# with:
- Write SPEC.md only when the user confirms ("Yes", "Write it anyway", "Done talking")

# L264 — replace:
- Do NOT ask about HOW to implement — that is discuss-phase territory
# with:
- Ask only about WHAT and WHY — implementation decisions belong in discuss-phase

# L266 — replace:
- Max 2–3 questions per round — do not frontload all questions at once
# with:
- Max 2–3 questions per round — ask only those, then wait for user response
```

---

### WR-02: `discuss-phase.md` L496 — Bare `Do NOT` with no positive alternative on same or next line

**File:** `get-shit-done/workflows/discuss-phase.md:496`
**Issue:** Inside the SPEC.md awareness block:

```
- Do NOT generate gray areas about WHAT to build or WHY — those are locked.
- Only generate gray areas about HOW to implement: ...
```

Line 496 is a bare prohibition. Line 497 provides the positive alternative, but it
is a separate bullet point beginning with "Only", which satisfies the *intent* of
positive framing but not the exemption pattern. The exemption requires either an
em-dash continuation on the same line (`NEVER X — always Y`) or the positive
immediately following on the *same* bullet. Two separate bullets create a structural
gap where the prohibition could be read in isolation.

**Fix:** Merge into a single constraint pair:
```markdown
- Generate gray areas about HOW to implement only — WHAT and WHY are locked by SPEC.md.
  Include: technical approach, library choices, UX/UI patterns, interaction details, error handling style.
```

---

### WR-03: `discuss-phase.md` L981 — Bare `Do NOT duplicate` with no inline positive

**File:** `get-shit-done/workflows/discuss-phase.md:981`
**Issue:**
```
- Do NOT duplicate requirements text from SPEC.md into `<decisions>` — agents read SPEC.md directly.
```
The em-dash clause is a rationale, not an affirmative alternative. The exemption
pattern requires the em-dash to name what to do instead, e.g., `NEVER X — always
Y`. "agents read SPEC.md directly" explains why, but does not name the positive
action.

**Fix:**
```markdown
- Write only implementation decisions in `<decisions>` — requirements live in SPEC.md, which agents read directly.
```

---

### WR-04: `gsd-executor.md` L478, L508 — Two `Do NOT` directives without inline positive alternatives

**File:** `agents/gsd-executor.md:478` and `agents/gsd-executor.md:508`
**Issue:**

L478:
```
Do NOT mark a plan as complete if stubs exist that prevent the plan's goal
from being achieved — either wire the data or document in the plan why the
stub is intentional and which future plan will resolve it.
```
The em-dash clause provides options but the positive action is buried after
"either...or". This is borderline; the em-dash does provide a positive path.
However, L508 is a cleaner violation:

L508:
```
Do NOT skip. Do NOT proceed to state updates if self-check fails.
```
This is two consecutive bare prohibitions with no positive alternative statement.
What to do instead is not stated (the affirmative would be: "Run self-check
before proceeding; resolve all failures before updating state").

**Fix for L508:**
```markdown
Run self-check before any state updates. Resolve all failures listed before proceeding.
```

**Fix for L478 (optional tighten):**
```markdown
Mark a plan complete only when all stubs are wired or documented with their
resolution phase — stubs that block the plan's goal require one or the other before marking done.
```

---

### WR-05: `verify-work.md` — `<available_agent_types>` is a non-V09-standard structural block

**File:** `get-shit-done/workflows/verify-work.md:7-11`
**Issue:** The `<available_agent_types>` block appears between `<purpose>` and
`<philosophy>` and is not present in the V09 workflow analog (spike.md, sketch.md).
The PATTERNS.md pattern table for workflow files defines: `<purpose>` first,
`<required_reading>` second, `<process>` last. An intermediate `<available_agent_types>`
block deviates from the V09 structural pattern.

Additionally, line 8 contains a bare negative directive:
```
Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
```
The em-dash here provides a rationale ("use exact names"), not a positive alternative
for the prohibition. The positive form would be: "use exact names listed below."

**Fix (structure):** Move agent type information into the relevant `<step>` where
subagents are spawned, or into a note inside `<process>`. This follows the V09
principle of placing constraints near the action they govern.

**Fix (framing on L8):**
```markdown
Valid GSD subagent types — use only the exact names listed below:
```

---

## Info

### IN-01: `gsd-executor.md` L341 — Encoding artifact (mojibake) in TDD error handling

**File:** `agents/gsd-executor.md:341`
**Issue:** The TDD error handling line contains a broken character sequence:
```
**Error handling:** RED doesn't fail ��� investigate. GREEN doesn't pass → debug/iterate.
```
The `���` is a replacement character sequence (U+FFFD), likely from a copy-paste
encoding mismatch. The intended character is probably `→` (rightwards arrow, as
used in the rest of the line).

**Fix:**
```markdown
**Error handling:** RED doesn't fail → investigate. GREEN doesn't pass → debug/iterate. REFACTOR breaks → undo.
```

---

### IN-02: `spec-phase.md` `<required_reading>` inconsistency with mandatory-initial-read reference

**File:** `get-shit-done/workflows/spec-phase.md:54-56`
**Issue:** The `<required_reading>` block reads:
```
Read all files referenced by the invoking prompt's execution_context before starting.
```
This is the same instruction as the content in `get-shit-done/references/mandatory-initial-read.md`,
but spec-phase.md does not include an `@file` reference to that file. Other workflow
files (e.g., discuss-phase.md uses `@~/.claude/get-shit-done/references/...` patterns
in similar contexts). This creates a cross-file inconsistency: the instruction is
duplicated as prose rather than sourced from the canonical reference file.

By contrast, `agents/gsd-debugger.md` line 24 correctly uses:
```
@~/.claude/get-shit-done/references/mandatory-initial-read.md
```

**Fix:** Replace the prose instruction with the `@file` include, consistent with
the agent pattern:
```markdown
<required_reading>
@~/.claude/get-shit-done/references/mandatory-initial-read.md
</required_reading>
```

---

### IN-03: `transition.md` L567-568 — Two consecutive bare `Do NOT` directives at end of Route B1

**File:** `get-shit-done/workflows/transition.md:567-568`
**Issue:**
```
Do NOT suggest `/gsd-complete-milestone` or `/gsd-new-milestone`.
Do NOT auto-invoke any further slash commands.
```
Both lines are bare negative directives with no affirmative alternative. The line
immediately following (`**Stop here.** The user must explicitly decide what to do
next.`) provides the positive intent but is separated by a blank line and is
phrased as a meta-directive rather than as the paired alternative. VIOLATIONS.md
classifies these as Category B pre-existing violations (out of scope for Phase 9),
documented here for the record and for a future maintenance pass.

**Fix (for future pass):**
```markdown
Present only the workstream status table and the two next-step commands above.
Stop here — the user must explicitly decide what to do next.
```

---

_Reviewed: 2026-04-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
