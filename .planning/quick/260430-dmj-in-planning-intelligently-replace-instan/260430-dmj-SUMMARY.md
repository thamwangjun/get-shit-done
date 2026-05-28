---
phase: quick-260430-dmj
plan: "01"
status: complete
subsystem: documentation
tags: [path-fix, refs-migration, housekeeping, planning-docs]

requires: []

provides:
  - All active .planning/ docs use .planning/references/<file> paths (not stale refs/<file>)

affects: [planning doc readers, agents reading context files, upstream merge checklist users]

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - .planning/research/STACK.md
    - .planning/research/fork-regression-tests-research.md
    - .planning/fork_plans/C0-POSITIVE_FRAMING_PASS_V01.md
    - .planning/fork_plans/D0-TAG_HIERARCHY_IMPLEMENTATION_V01.md
    - .planning/milestones/v1.36.0-phases/02-apply-fork-standards-to-v1-36-0-files/02-RESEARCH.md
    - .planning/milestones/v1.37.1-phases/12-tech-debt-remediation/12-PATTERNS.md
    - .planning/milestones/v1.37.1-phases/12-tech-debt-remediation/12-RESEARCH.md
    - .planning/milestones/v1.37.1b-phases/018-fork-tag-corpus-tests/018-RESEARCH.md
    - .planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/19-CONTEXT.md
    - .planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/19-REVIEW.md
    - .planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/19-VERIFICATION.md
    - .planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/19-DISCUSSION-LOG.md
    - .planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/019-02-PLAN.md
    - .planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/019-02-SUMMARY.md
    - .planning/milestones/v1.37.1c-REQUIREMENTS.md
    - .planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md
    - .planning/PROJECT.md

key-decisions: []

duration: ~4min
completed: 2026-04-30
---

# Quick Task 260430-dmj: Update refs/ Path Prefix to .planning/references/ in Active Docs

**Replaced all stale `refs/<file>` navigational path references with `.planning/references/<file>` across 17 active .planning/ documents, leaving historical migration records and milestone audit files untouched.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-30T09:51:06Z
- **Completed:** 2026-04-30T09:54:52Z
- **Tasks:** 2 (combined into single commit)
- **Files modified:** 17

## Accomplishments

- Scanned all active .planning/ documents for stale `refs/[A-Z_]` path patterns
- Replaced all navigational `refs/<FILENAME>.md` path strings with `.planning/references/<FILENAME>.md` in 17 files
- Left historical records untouched: STATE.md quick tasks table, v1.37.1b-MILESTONE-AUDIT.md, 03-DISCUSSION-LOG.md (user quote), 20-DISCUSSION-LOG.md, and the 260429-esn migration description files
- Zero stale refs remain in active operational documents

## Task Commits

1. **Tasks 1-2: Identify, replace, and verify refs/ paths** — `ded6328e`

## Files Modified

All 17 files had `refs/<FILENAME>` path strings replaced with `.planning/references/<FILENAME>`:

- `.planning/research/STACK.md` — 1 replacement (PROMPT_IMPROVEMENT_GUIDE_V01.md)
- `.planning/research/fork-regression-tests-research.md` — 2 replacements (UPSTREAM_TO_FORK_CHANGES_GUIDE.md x2)
- `.planning/fork_plans/C0-POSITIVE_FRAMING_PASS_V01.md` — 1 replacement (PROMPT_IMPROVEMENT_GUIDE_V01.md)
- `.planning/fork_plans/D0-TAG_HIERARCHY_IMPLEMENTATION_V01.md` — 1 replacement (UPSTREAM_TO_FORK_CHANGES_GUIDE.md)
- `.planning/milestones/v1.36.0-phases/02-apply-fork-standards-to-v1-36-0-files/02-RESEARCH.md` — 1 replacement
- `.planning/milestones/v1.37.1-phases/12-tech-debt-remediation/12-PATTERNS.md` — 1 replacement
- `.planning/milestones/v1.37.1-phases/12-tech-debt-remediation/12-RESEARCH.md` — 1 replacement
- `.planning/milestones/v1.37.1b-phases/018-fork-tag-corpus-tests/018-RESEARCH.md` — 2 replacements
- `.planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/19-CONTEXT.md` — 2 replacements
- `.planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/19-REVIEW.md` — 3 replacements
- `.planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/19-VERIFICATION.md` — 1 replacement
- `.planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/19-DISCUSSION-LOG.md` — 1 replacement (not in original plan but also had stale ref)
- `.planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/019-02-PLAN.md` — 9 replacements
- `.planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/019-02-SUMMARY.md` — 3 replacements
- `.planning/milestones/v1.37.1c-REQUIREMENTS.md` — 1 replacement
- `.planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md` — 1 replacement (merge checklist glob pattern)
- `.planning/PROJECT.md` — 2 replacements (not in original plan but also had stale refs)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] Updated 19-DISCUSSION-LOG.md**
- **Found during:** Task 1 verification grep
- **Issue:** `19-DISCUSSION-LOG.md` had a stale `refs/UPSTREAM_TO_FORK_CHANGES_GUIDE.md` reference not listed in the plan's file set. The plan excluded `20-DISCUSSION-LOG.md` but not `19-DISCUSSION-LOG.md`.
- **Fix:** Applied same replacement — this is a navigational reference (which file to update), not narrative about the migration.
- **Files modified:** `.planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/19-DISCUSSION-LOG.md`
- **Commit:** ded6328e

**2. [Rule 2 - Missing] Updated PROJECT.md**
- **Found during:** Initial grep scan
- **Issue:** `PROJECT.md` had two stale `refs/UPSTREAM_TO_FORK_CHANGES_GUIDE.md` references not in the plan's file set. These were active navigational references pointing to a non-existent location.
- **Fix:** Updated both: the DOCS-01 requirement checkbox and the "Fork standards references" context block.
- **Files modified:** `.planning/PROJECT.md`
- **Commit:** ded6328e

## Self-Check: PASSED

- FOUND: .planning/research/STACK.md
- FOUND: .planning/research/fork-regression-tests-research.md
- FOUND: .planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md
- FOUND: .planning/PROJECT.md
- FOUND commit ded6328e
- Stale refs grep returns zero lines in active documents
