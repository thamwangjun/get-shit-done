---
quick_id: 260418
slug: merge-v1360a
status: complete
date: 2026-04-18
commit: c7cba0c
---

# Summary: Merge v1.36.0.a into thamw-main

## What Was Done

Merged `v1.36.0.a` (Fix Update Functionality) into `thamw-main` (Fix Hooks Installation). Both milestones were completed in parallel on separate branches from common ancestor `d895c9c`.

## Conflicts Resolved

All 5 conflicts were in `.planning/` docs only — `bin/install.js` auto-merged cleanly since the two branches touched different regions of the file.

| File | Resolution |
|------|-----------|
| MILESTONES.md | Combined both milestone entries (v1.36.0.b + v1.36.0.a), newest first |
| ROADMAP.md | Listed all 3 milestones; included both phase detail blocks and progress rows |
| STATE.md | Merged status to `complete`; combined decisions from both milestones |
| PROJECT.md | Combined FIX-01/02/03 (v1.36.0.b) + HOOK/INST/UPD (v1.36.0.a) requirements; merged Key Decisions table |
| RETROSPECTIVE.md | Added v1.36.0.a retrospective after v1.36.0.b; updated Cross-Milestone Trends table and Top Lessons |

## Source Code

- `bin/install.js`: both changes coexist — SHA version detection (lines ~55) from v1.36.0.a + ensureHooksDist helper (lines ~204) from v1.36.0.b
- `hooks/gsd-check-update-worker.js`, `hooks/gsd-statusline.js`, `get-shit-done/workflows/update.md`, `tests/version-detection.test.cjs`: v1.36.0.a additions, no conflicts
