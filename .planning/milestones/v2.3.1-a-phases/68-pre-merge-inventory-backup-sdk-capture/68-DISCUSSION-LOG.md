# Phase 68: Pre-Merge Inventory, Backup & SDK Capture - Discussion Log

**Date:** 2026-06-10
**For human reference only** — not consumed by downstream agents.

## Carried Forward (not re-asked)

- KEEP fork's SHA-based update-check worker over upstream's semver/npm approach (PATCH-02) — locked in milestone roadmap goal
- ACCEPT upstream's `sdk/` deletion, gated on SDK-01 documentation existing first (SDK-01 → SDK-02) — locked in milestone roadmap goal
- Merge mechanics (`git merge -s ort`, renameLimit=5000, fetch only `refs/tags/v1.3.1`, merge-base `fa4bba47`) — fully specified by `.planning/research/`

## Areas Discussed

### Area 1 — Fork-edit inventory: location & form
**Options presented:**
- Durable in .planning/, raw diff
- Durable + curated summary
- Ephemeral /tmp as research said

**User selected:** Durable in .planning/, raw diff
**Notes:** Inventory is the audit baseline for Phases 70–71 patch-survival checks; /tmp is ephemeral and would not survive. Raw diff is greppable and re-generatable. → D-01, D-02

### Area 2 — SDK-01 documentation thoroughness
**Options presented:**
- Restoration-grade (recommended)
- Inventory-grade
- Capture source verbatim too

**User selected:** Restoration-grade
**Notes:** Per-module purpose, public surface, behavior, integration points, deps — sufficient for a future SDKR-01 milestone to rebuild without the deleted source. Must cover all named modules + supporting `sdk/src/` modules (success criterion greps for each). → D-03, D-04

### Area 3 — Recording the two architecture decisions
**Options presented:**
- Single decisions doc in phase dir
- Start a project-level ADR file
- Fold into CONTEXT.md only

**User selected:** Single decisions doc in phase dir
**Notes:** Repo has no existing ADR convention; declined to introduce one this phase. Single self-contained `68-DECISIONS.md` with rationale + requirement IDs (PATCH-02, SDK-01/02) for grep confirmation. → D-05

## Deferred Ideas Captured

- Fork SDK feature restoration → future SDKR-01 milestone
- Project-wide ADR/decisions-log convention → declined this phase
- Curated/annotated inventory summary → raw diff preferred; revisit if Phase 70 needs it

## Claude's Discretion

- Exact artifact filenames within the phase dir (kept greppable, aligned to success-criteria grep targets)
- Git plumbing for backup branch + renameLimit config (mechanical, research-specified)
