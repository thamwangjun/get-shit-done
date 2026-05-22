# Phase 19: Convert objective tags to intent in skill files - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-28
**Phase:** 19-convert-objective-tags-to-intent-in-skill-files
**Areas discussed:** Conversion scope, Test gate definition, Collateral updates

---

## Conversion scope

| Option | Description | Selected |
|--------|-------------|----------|
| Tag rename only | Mechanical find-and-replace: `<objective>` → `<intent>` and `</objective>` → `</intent>`. Content inside each block unchanged. Already-converted files show content style is consistent. | ✓ |
| Tag rename + content review | Rename tags AND manually verify each file's `<intent>` content matches the fork's intent style (concise one-liner). | |

**User's choice:** Tag rename only
**Notes:** Fast, mechanical, zero risk. Content inside `<objective>` blocks already follows the same style used in the 47 already-converted files.

---

## Test gate definition

| Option | Description | Selected |
|--------|-------------|----------|
| CONVERT-01 in REQUIREMENTS.md (79/79 pass) | Add formal CONVERT-01 requirement: all 79 command files pass the intent-tag test. Update DESIGN NOTE in test file to remove "33 failures by design" language. | ✓ |
| Update DESIGN NOTE only | No new REQUIREMENTS.md entry. Just fix the comment in fork-intent-tag.test.cjs. | |

**User's choice:** CONVERT-01 in REQUIREMENTS.md (79/79 pass)
**Notes:** Closes the loop on Phase 18's INTENT-01 story; provides formal traceability.

---

## Collateral updates

| Option | Description | Selected |
|--------|-------------|----------|
| REQUIREMENTS.md + test DESIGN NOTE + PROJECT.md Key Decisions | Full audit trail. UPSTREAM_TO_FORK_CHANGES_GUIDE.md left for Claude's discretion. | ✓ |
| REQUIREMENTS.md + test DESIGN NOTE only | Formal gate + test comment updated. PROJECT.md Key Decisions table not touched. | |

**User's choice:** REQUIREMENTS.md + test DESIGN NOTE + PROJECT.md Key Decisions
**Notes:** Complete audit trail across all relevant documents.

---

## Claude's Discretion

- Whether to update `.planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md` with a note about `<objective>` → `<intent>`

## Deferred Ideas

None.
