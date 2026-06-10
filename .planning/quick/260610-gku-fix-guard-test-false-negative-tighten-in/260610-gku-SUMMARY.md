---
phase: 260610-gku
plan: "01"
subsystem: tests/corpus-guard
tags: [guard-test, regex, citation-cleanup, tdd]
dependency_graph:
  requires: []
  provides: [tightened INLINE_RE, owner/repo#NNN detection, no-issue-citations corpus GREEN]
  affects: [tests/no-issue-citations.test.cjs, agents/*-researcher.md, agents/gsd-executor.md]
tech_stack:
  added: []
  patterns: [TDD RED/GREEN/REFACTOR, atomic commits in strict order]
key_files:
  created: []
  modified:
    - tests/no-issue-citations.test.cjs
    - agents/gsd-ai-researcher.md
    - agents/gsd-advisor-researcher.md
    - agents/gsd-domain-researcher.md
    - agents/gsd-executor.md
    - agents/gsd-phase-researcher.md
    - agents/gsd-project-researcher.md
    - agents/gsd-ui-researcher.md
decisions:
  - "Removed hex lookbehind from INLINE_RE entirely; hex colors in prose are accepted as false positives — false negatives (owner/repo#NNN slipping through) are worse"
  - "Applied D-04 replacement prose to all 7 agent files that contained the citation (Rule 1 auto-fix)"
metrics:
  duration: ~10 minutes
  completed: "2026-06-10T04:22:25Z"
  tasks_completed: 3
  tasks_total: 3
---

# Phase 260610-gku Plan 01: Fix Guard Test False Negative — Tighten INLINE_RE Summary

Tightened `INLINE_RE` in the corpus citation guard by removing the hex color lookbehind, enabling detection of `owner/repo#NNN` citations like `anthropics/claude-code#13898`, and eliminated that citation from all 7 affected agent files (1 plan target + 6 Rule 1 auto-fixes).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add failing unit test for owner/repo#NNN detection (RED) | 63dd01a9 | tests/no-issue-citations.test.cjs |
| 2 | Remove INLINE_RE lookbehind and update docs (unit GREEN, corpus RED) | b71a6cf7 | tests/no-issue-citations.test.cjs |
| 3 | Remove citation from gsd-ai-researcher.md and verify full suite GREEN | 6da88a41 | agents/gsd-ai-researcher.md + 6 others |

## Outcome

- `INLINE_RE` is now `/#(\d+)\b/g` — no lookbehind, catches `owner/repo#NNN` patterns
- New unit test `github-style citation: owner/repo#NNN is detected` exists and passes
- Existing hex exemption test `hex color exemption (D-11): #e8c170 produces zero hits` still passes (D-09/D-10 exclusions protect hex colors in frontmatter/code-fences; prose hex is accepted as false positive)
- `anthropics/claude-code#13898` removed from all 7 agent files
- Full test suite: 9019 pass, 0 fail

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed citation in 6 additional agent files beyond the plan target**

- **Found during:** Task 3 — npm test revealed 6 corpus failures for files not listed in the plan
- **Issue:** The plan only listed `agents/gsd-ai-researcher.md` as a target, but the tightened `INLINE_RE` exposed the same `anthropics/claude-code#13898` citation in 6 other agent files: `gsd-advisor-researcher.md`, `gsd-domain-researcher.md`, `gsd-executor.md`, `gsd-phase-researcher.md`, `gsd-project-researcher.md`, `gsd-ui-researcher.md`
- **Fix:** Applied identical D-04 replacement prose to all 6 additional files in the same Task 3 commit
- **Files modified:** agents/gsd-advisor-researcher.md, agents/gsd-domain-researcher.md, agents/gsd-executor.md, agents/gsd-phase-researcher.md, agents/gsd-project-researcher.md, agents/gsd-ui-researcher.md
- **Commit:** 6da88a41

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Remove hex lookbehind entirely (not replace with narrower pattern) | False negatives (citation escapes like `owner/repo#NNN`) are worse than false positives (prose hex colors matched) — user preference documented in D-02 |
| Extend citation removal to 6 additional agent files | Rule 1 auto-fix: same citation was directly exposed by the regex change; fixing in the same commit keeps the TDD commit order intact and achieves all-GREEN in one pass |

## Self-Check

- [x] tests/no-issue-citations.test.cjs — modified with new unit test, regex change, JSDoc/comment updates
- [x] agents/gsd-ai-researcher.md — citation removed
- [x] agents/gsd-advisor-researcher.md — citation removed
- [x] agents/gsd-domain-researcher.md — citation removed
- [x] agents/gsd-executor.md — citation removed
- [x] agents/gsd-phase-researcher.md — citation removed
- [x] agents/gsd-project-researcher.md — citation removed
- [x] agents/gsd-ui-researcher.md — citation removed
- [x] Three commits in strict TDD order: 63dd01a9 → b71a6cf7 → 6da88a41
- [x] npm test: 9019 pass, 0 fail

## Self-Check: PASSED
