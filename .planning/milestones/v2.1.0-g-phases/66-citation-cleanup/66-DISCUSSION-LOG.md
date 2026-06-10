# Phase 66: Citation Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-09
**Phase:** 66-citation-cleanup
**Areas discussed:** Cleanup approach, Sentence repair depth, Plan structure

---

## Cleanup Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Script (normalize-step-numbers analog) | Write scripts/remove-citations.cjs with --dry-run. Fast, consistent, auditable. | |
| Executor agent, file by file | Agent reads and edits each file with prose judgment. | ✓ |
| Hybrid: script for mechanical, agent for complex | Script handles simple cases; agent handles complex long-sentence cases. | |

**User's choice:** Executor agent, file by file
**Notes:** Prose repair depth (contextual rewriting of clauses) requires agent judgment beyond what a regex script provides.

---

## Plan Structure

| Option | Description | Selected |
|--------|-------------|----------|
| One plan, all 45 files | Single executor run. Simpler, one commit. | |
| Split by directory (5 plans) | One plan per scoped dir. Granular rollback per directory. | ✓ |
| Split by file count (batches of ~15) | 3 plans of ~15 files. | |

**User's choice:** Split by directory (5 plans)
**Notes:** 5 plans: commands/, get-shit-done/workflows/, agents/, get-shit-done/references/, get-shit-done/templates/.

---

## Sentence Repair Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal: strip token + clean artifacts | Delete #NNN and orphaned parens/dash. Don't rephrase. | |
| Contextual: rewrite the clause to flow naturally | Rewrite clauses; remove connectors (—, see, etc.) that have nothing to point to. | ✓ |

**User's choice:** Contextual rewrite

---

## Citation-Only Clauses

| Option | Description | Selected |
|--------|-------------|----------|
| Keep explanation, drop the citation | Preserve rationale prose; only remove #NNN token. | |
| Drop whole clause if citation-only | If clause exists solely to cite an issue, delete the entire clause. Keep prose with independent meaning. | ✓ |

**User's choice:** Drop citation-only clauses; keep prose that has independent meaning beyond the reference.

---

## Claude's Discretion

None — all areas were explicitly decided by the user.

## Deferred Ideas

None — discussion stayed within phase scope.
