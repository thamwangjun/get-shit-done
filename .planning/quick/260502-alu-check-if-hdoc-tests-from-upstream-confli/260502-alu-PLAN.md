---
quick_id: 260502-alu
slug: check-if-hdoc-tests-from-upstream-confli
description: Check if HDOC tests from upstream conflict with positive framing in our fork, and remove/disable them if so
date: 2026-05-02
status: complete
---

# Quick Task 260502-alu

**Goal:** Investigate HDOC tests in `tests/agent-frontmatter.test.cjs` for conflict with the fork's positive framing standard. Disable them if a conflict or incompatibility exists.

## Tasks

1. Locate all HDOC-related tests in `tests/agent-frontmatter.test.cjs`
2. Assess whether they conflict with positive framing (user decided: yes, disable)
3. Change `describe(...)` to `describe.skip(...)` for the HDOC block
4. Commit atomically
5. Update STATE.md
