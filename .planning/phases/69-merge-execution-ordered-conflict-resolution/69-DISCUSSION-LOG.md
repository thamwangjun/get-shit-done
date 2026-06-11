# Phase 69: Merge Execution & Ordered Conflict Resolution - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-11
**Phase:** 69-merge-execution-ordered-conflict-resolution
**Areas discussed:** Prompt-content policy, Commit granularity, package.json fields, Abort/recovery protocol

---

## Prompt-content conflict policy

| Option | Description | Selected |
|--------|-------------|----------|
| Keep ours, defer conformance | Resolve prompt conflicts toward fork version; conform in Phase 70/71 | |
| Hand-merge upstream now | Manually weave upstream prompt changes into fork files during the merge | ✓ |

**User's choice:** Hand-merge upstream now.
**Notes:** Follow-up on depth — integrate upstream functional changes while preserving fork patches, but leave the positive-framing/quality-bar conformance pass to another (future) milestone. This milestone is merge-only; tests are allowed to fail.

---

## Commit granularity

| Option | Description | Selected |
|--------|-------------|----------|
| Tier commits + per-file prompts | One commit per triage tier; per-file only for prompt-content tier | |
| Per-file everywhere | Every resolved file is its own commit across all tiers | ✓ |

**User's choice:** Per-file everywhere.
**Notes:** Maximum traceability; triage order still governs the sequence.

---

## package.json reconciliation

| Option | Description | Selected |
|--------|-------------|----------|
| Identity fields sacred | Preserve fork name, bin map, repository URL, version; take upstream for new deps/scripts | ✓ |
| Fork file wins wholesale | Keep fork package.json entirely, cherry-pick upstream deps afterward | |

**User's choice:** Identity fields sacred.

---

## Abort / recovery protocol

| Option | Description | Selected |
|--------|-------------|----------|
| Abort-and-restart before commits | Pre-commit mistake → git merge --abort and restart clean; backup branch is anchor | ✓ |
| Push through with reverts | Keep merge in progress; fix with follow-up commits/reverts | |

**User's choice:** Abort-and-restart before commits.

---

## Claude's Discretion

- Exact per-file ordering within each triage tier (tier order itself is locked).
- Mechanics of distinguishing fork-only deletions from real conflicts.
- Lockfile regeneration mechanics, provided clean-regeneration criterion holds.

## Deferred Ideas

- Prompt-quality / positive-framing conformance pass for upstream content — future milestone.
- Directory rename adoption (`get-shit-done/` → `gsd-core/`) — Phase 71.
- Fork-patch restoration & TypeScript port — Phase 70.
