# Quick Task 260608-njm: Review HEAD execute-phase.md Compression — Context

**Gathered:** 2026-06-08
**Status:** Ready for planning

<domain>
## Task Boundary

Compare HEAD of `get-shit-done/workflows/execute-phase.md` against commit `57a000b1ad818c1837b2b128011c94149221fd1e` (the pre-compression original). Identify all essential fidelity losses, then restore them via targeted edits.

Context: A prior compression pass (commit `a619eef4`) reduced the file from ~1722 lines to a much smaller form. A previous quick task (260608-msc) already restored several losses. HEAD is at 761 lines; the original was 1722. This task covers any remaining losses.

</domain>

<decisions>
## Implementation Decisions

### What counts as "essential fidelity"
- **Behavior-changing content** — missing init parse fields, removed bash code blocks, entirely absent steps (step 12b), stripped logic paths
- **Key explanatory context** — CODEX RUNTIME rules, "FIRST ACTION / DO NOT SKIP" emphasis, safety rationale for worktree guards, error message reinstall hints

Generic explanatory verbosity (multi-paragraph prose restating what code already says) does NOT need restoration.

### Restoration approach
- **Clean rewrite** — write restored content fresh to match the original's intent, potentially cleaner/more concise than verbatim copy. Acceptable to deviate from exact wording as long as behavior and safety contracts are preserved.

### Specific items to restore (confirmed analysis)

**Behavior-changing (must restore):**
1. `initialize` step — JSON parse list missing: `commit_docs`, `branching_strategy`, `branch_name`, `phase_slug`, `plan_count`, `incomplete_count`, `roadmap_exists`, `phase_req_ids`, `response_language`
2. `execute_waves` — Step 12b (pre-wave dependency check) is entirely absent; must be fully restored
3. `initialize` step — MVP+TDD gate: restore inline bash code block (is_behavior_adding check + RED commit detection) instead of one-liner summary
4. `initialize` step — safe_resume_gate: restore bash code block for deriving CURRENT_PLAN_ID and SUMMARY_PATH
5. `regression_gate` step — restore full test command resolution code (config → Makefile → language sniff chain)
6. `code_review_gate` step — restore specific review status detection code (`PADDED`, `REVIEW_FILE`, `REVIEW_STATUS` bash block + suggest `--fix`)

**Key context (restore as appropriate):**
7. Executor agent prompt — restore CODEX RUNTIME rule ("After calling Agent(), stop working on this task immediately…") — currently absent from the executor agent prompt
8. `execute_waves` wave-start description step — restore "FIRST ACTION" / "DO NOT SKIP" emphasis for heartbeat emission
9. `parse_args` — restore note: "If `--wave` is absent, preserve the current behavior of executing all incomplete waves in the phase"
10. `initialize` error message — restore `npx` reinstall hint when gsd-sdk not found
11. `handle_branching` — restore uncommitted changes warning before branch creation
12. `failure_handling` — restore CLASS_JSON bash code block for quota classification
13. `offer_next` — restore `${GSD_WS}` workspace suffix in suggested commands + "Do not invent commands" guard

### Claude's Discretion
- Ordering and prose style within restored sections
- Whether to keep or trim the "Benefits of interactive mode" section in check_interactive_mode (it's informational but not behavior-changing)

</decisions>

<specifics>
## Specific References

- Original file: commit `57a000b1ad818c1837b2b128011c94149221fd1e` (available as `/tmp/execute-phase-original.md`)
- HEAD file: `get-shit-done/workflows/execute-phase.md`
- Full diff: `/tmp/execute-phase-diff.md`

The executor must read both the original and HEAD to perform clean rewrites — do not blindly copy verbatim diffs as they may include content that was already restored in the 260608-msc task.

</specifics>
