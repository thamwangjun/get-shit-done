# Phase 36: Stage and Commit Configuration & Rules - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 36-Stage and Commit Configuration & Rules
**Areas discussed:** File Staging Target, Staging Safety Gate, Verification Strictness

---

## File Staging Target

### Question 1: How should the staging logic target the files in Batch 1?

| Option | Description | Selected |
|--------|-------------|----------|
| Strict Explicit List | Only stage the exact files listed in the requirements: CATALOGUE.json, mise.toml, .planning/config.json, and .planning/references/* | ✓ |
| Flexible Pattern Matching | Find and stage any modified JSON, TOML, and .planning/references/* files | |
| You decide | Let the agent determine the best approach at execution time | |

**User's choice:** Strict Explicit List
**Notes:** Safer approach to ensure no stray files are accidentally committed in Batch 1.

### Question 2: If a specified file has no modifications since v1.41.2, how should the staging script handle it?

| Option | Description | Selected |
|--------|-------------|----------|
| Skip Silently | Skip the file and proceed without staging it, since Git has no changes to record for it | ✓ |
| Fail/Warn | Fail the execution because all specified files are expected to have changes | |
| You decide | Let the agent decide at execution time | |

**User's choice:** Skip Silently
**Notes:** Standard git behavior, avoids erroring out when files are unchanged.

---

## Staging Safety Gate

### Question 1: How should the staging script handle pre-existing staged files in the working directory?

| Option | Description | Selected |
|--------|-------------|----------|
| Abort/Fail | Terminate execution if any files are already staged | |
| Auto-unstage | Automatically unstage any pre-existing staged changes before staging Batch 1 | ✓ |
| You decide | Let the agent decide at execution time | |

**User's choice:** Auto-unstage
**Notes:** Automatically unstaging provides a cleaner, more automated execution flow.

---

## Verification Strictness

### Question 1: How strictly should the verification step check the staged files against the expected Batch 1 list?

| Option | Description | Selected |
|--------|-------------|----------|
| Exact Match Gate | The verification step must match the expected Batch 1 files exactly. Any extra files cause immediate abort | ✓ |
| Permissive Gate | Log a warning if there is any mismatch, but allow committing to proceed | |
| You decide | Let the agent decide at execution time | |

**User's choice:** Exact Match Gate
**Notes:** Guarantees that only Batch 1 files are committed, preventing leak of files from other batches.

### Question 2: How should the verification gate handle expected files that were skipped because they had no modifications?

| Option | Description | Selected |
|--------|-------------|----------|
| Subset verification | Verify that all staged files are a subset of the expected list (no extra files allowed), ignoring files that had no changes | ✓ |
| Strict modified check | Check that every modified file in the workspace that matches Batch 1 is staged, and no others | |
| You decide | Let the agent decide at execution time | |

**User's choice:** Subset verification
**Notes:** Aligns with the silent skip decision for unmodified files.

---

## the agent's Discretion

None deferred to the agent.

## Deferred Ideas

None.
