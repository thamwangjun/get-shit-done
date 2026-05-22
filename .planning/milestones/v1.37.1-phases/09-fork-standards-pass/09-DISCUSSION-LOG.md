# Phase 9: Fork Standards Pass - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-18
**Phase:** 09-fork-standards-pass
**Areas discussed:** Scanner already green — Plan 01 scope, XML structure standards, Modified files disambiguation (Plan 02), Test suite target after Phase 9

---

## Scanner already green — Plan 01 scope

| Option | Description | Selected |
|--------|-------------|----------|
| Document clean | Run scanner, confirm 34/34, write VIOLATIONS.md showing zero — lightweight, scanner evidence is the deliverable | |
| Structural audit | Scanner + manual review of XML blocks in all 20 files against PROMPT_IMPROVEMENT_GUIDE steps | ✓ |
| Scanner first, spot-check thin files | Run scanner to confirm clean, then spot-check structurally sparse files | |

**User's choice:** Structural audit — scanner run + full structural review of all 20 new files.
**Notes:** Key context: the negative-framing scanner is already green (34/34) entering Phase 9. The "confirmed violations" in the roadmap's success criteria are already resolved — either they're valid constraint pairs (em-dash complements) or were fixed in Phase 7's FORK-CORRUPTION triage.

---

## XML structure standards

| Option | Description | Selected |
|--------|-------------|----------|
| PROMPT_IMPROVEMENT_GUIDE steps only | All 8 steps from V01 guide — canonical, same as prior passes | |
| Lightweight | Just task→intent rename and malformed-tag check — faster but narrower | |
| Full PROMPT_ENGINEERING_GUIDE V09 review | Deeper quality bar than the improvement guide — covers additional quality dimensions | ✓ |

**User's choice:** Full PROMPT_ENGINEERING_GUIDE V09 review — the highest bar, same standard as the original improvement pass.

---

## Modified files disambiguation (Plan 02)

| Option | Description | Selected |
|--------|-------------|----------|
| Scanner-only pass | Run scanner against the git-modified file list, document result — fast, scanner already green | |
| Diff-based triage | For each modified file, compare fork's pre-merge version to post-merge to find silently degraded quality | ✓ |
| Targeted spot-check | Scanner + V09 spot-check on agents/workflows/references subset only | |

**User's choice:** Diff-based triage — compare pre/post merge for all 193 upstream-modified files to catch quality degradation the scanner exempts (e.g., constraint pairs that are technically valid but represent a quality regression from the pre-merge state).

---

## Test suite target after Phase 9

| Option | Description | Selected |
|--------|-------------|----------|
| Scanner tests stay green | 34/34 negative-framing-scan passes — minimal gate | |
| No regressions | Full npm test must not go below current 4098/4112 pass count | ✓ |
| Advance the baseline | Fix at least 1 of the 14 remaining failures if achievable — opportunistic | |

**User's choice:** No regressions — `npm test` must stay at or above 4098/4112; scanner must remain 34/34. Advancing the 14-failure baseline is Phase 10's job.

---

## Claude's Discretion

- Order of reviewing the 20 new files in Plan 01
- Which V09 quality dimensions to prioritize within each file
- Git strategy for extracting pre-merge file versions (git show, merge-base)
- Whether to group Plan 02 fixes by category or process all files together

## Deferred Ideas

None — discussion stayed within phase scope.
