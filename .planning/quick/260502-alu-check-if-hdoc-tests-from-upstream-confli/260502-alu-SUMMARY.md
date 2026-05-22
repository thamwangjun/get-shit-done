---
quick_id: 260502-alu
status: complete
date: 2026-05-02
commit: 3a100c66
---

# Quick Task 260502-alu — Summary

**Task:** Check if HDOC tests from upstream conflict with positive framing in our fork, and remove/disable them if so.

**Decision:** User explicitly decided to disable all HDOC tests. Decision recorded in memory.

**Change:** `tests/agent-frontmatter.test.cjs` line 34 — `describe(...)` → `describe.skip(...)` for the `HDOC: anti-heredoc instruction` block. Two tests skipped: `${agent} has anti-heredoc instruction` (per FILE_WRITING_AGENTS) and `no active heredoc patterns in any agent file`.

**Commit:** 3a100c66
