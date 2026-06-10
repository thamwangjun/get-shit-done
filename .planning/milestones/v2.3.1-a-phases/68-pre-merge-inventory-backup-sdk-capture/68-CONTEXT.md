# Phase 68: Pre-Merge Inventory, Backup & SDK Capture - Context

**Gathered:** 2026-06-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Create every recovery anchor, fork-edit baseline, architecture-decision record, and
the fork's `sdk/` capability documentation on disk **before** any destructive merge
operation runs. This phase writes artifacts only — it performs no merge, no conflict
resolution, and no rename work (those are Phases 69–71).

Deliverables (from ROADMAP success criteria, MERGE-01 + SDK-01):
1. `pre-merge-v1.3.1-backup` recovery branch pointing at pre-merge HEAD
2. A durable, non-empty fork-edit inventory from `git diff fa4bba47..HEAD` over fork-owned paths
3. Restoration-grade documentation of the fork's `sdk/` capability
4. Both pre-made architecture decisions recorded in `.planning/`, plus
   `git config diff.renameLimit` / `merge.renameLimit` both set to `5000`

</domain>

<decisions>
## Implementation Decisions

### Fork-Edit Inventory (criterion 2)
- **D-01:** The inventory is **durable**, not ephemeral. Save it inside the phase
  directory (`.planning/milestones/v2.3.1-a-phases/68-pre-merge-inventory-backup-sdk-capture/`),
  NOT `/tmp` as the research draft suggested — it is the audit baseline that Phases 70–71
  use to verify fork-patch survival, so it must survive reboots and be committed to git.
- **D-02:** Form is **raw `git diff` output** (e.g. `68-FORK-EDIT-INVENTORY.diff`). No
  curated summary required — the raw diff is greppable and re-generatable. The exact
  `git diff fa4bba47..HEAD -- <fork-owned paths>` command and path set come from the
  research (`agents/`, `commands/gsd/`, `get-shit-done/workflows/`, `get-shit-done/references/`,
  `bin/install.js`, `hooks/`).

### SDK Capability Documentation (criterion 3, SDK-01)
- **D-03:** Capture is **restoration-grade**. For each module document: purpose,
  public surface (exports + signatures), runtime behavior, integration points, and
  external dependencies — detailed enough that a future SDKR-01 milestone can rebuild
  it compatibly with upstream's post-deletion structure **without** needing the original
  source (which the merge deletes).
- **D-04:** Coverage must include every named module — `session-runner.ts`, `config.ts`,
  `model-catalog.ts`, `ws-transport.ts` — AND the supporting modules in `sdk/src/`. The
  success criterion greps the doc for each named module, so each must appear literally.
  Planner should enumerate the actual `sdk/src/` tree at plan time rather than assume the
  four named files are exhaustive.

### Architecture Decision Records (criterion 4)
- **D-05:** Record both pre-made decisions in a **single self-contained doc** in the phase
  directory (`68-DECISIONS.md`). No project-wide ADR convention is being introduced in this
  phase (the repo currently has none). The doc must state each decision, its rationale, and
  the requirement IDs it satisfies so a grep can confirm presence:
  - **KEEP** the fork's SHA-based update-check worker over upstream's semver/npm approach (PATCH-02)
  - **ACCEPT** upstream's `sdk/` deletion, gated on SDK-01 documentation existing first (SDK-01 → SDK-02)

### Claude's Discretion
- Exact filenames within the phase dir (the `68-` prefixed names above are suggestions;
  keep them greppable and aligned with the success-criteria grep targets).
- Git plumbing details for the backup branch and renameLimit config — fully mechanical,
  specified by research.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone requirements & roadmap
- `.planning/REQUIREMENTS.md` — MERGE-01 and SDK-01 definitions (the two requirements this phase satisfies); SDK-02, SDKR-01 for the gating relationship
- `.planning/ROADMAP.md` §"Phase 68" — success criteria this CONTEXT serves; milestone goal paragraph with the two pre-made architecture decisions

### Research (HIGH confidence, grounded in live git commands)
- `.planning/research/SUMMARY.md` §"Phase 1: Pre-Merge Inventory and Backup" — exact deliverables, the `git diff fa4bba47..HEAD` command, fork-owned path list, and Pitfalls 3/4/5/6 this phase avoids
- `.planning/research/PITFALLS.md` — mass-deletion traps (Pitfall 3), tag-namespace contamination (Pitfall 4), pre-rename trap (Pitfall 5)
- `.planning/research/ARCHITECTURE.md` — the "Fork-authored files that must be migrated manually" table (defines what the inventory must capture)
- `.planning/research/FEATURES.md` — upstream change inventory, `sdk/` deletion scope (305 files)
- `.planning/research/STACK.md` — merge mechanics, merge-base `fa4bba47`, renameLimit=5000 rationale

### Source under documentation
- `sdk/src/*.ts` — the live fork SDK source the SDK-01 doc must capture before the merge deletes it (read at plan/execute time to enumerate the full module set)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `sdk/src/session-runner.ts`, `config.ts`, `model-catalog.ts`, `ws-transport.ts` + supporting modules — the subjects of the SDK-01 capability doc; must be read to produce restoration-grade documentation.
- `CLAUDE.md` "## Technology Stack" / "## Architecture" sections already describe the SDK at a high level (`session-runner.ts` powers `query()`, `ws-transport.ts` provides the WebSocket server) — a starting point, not sufficient on its own for restoration-grade.

### Established Patterns
- Phase artifacts live under `.planning/milestones/{version}-phases/{phase}-{slug}/` with `{padded}-` prefixed filenames (e.g. `68-CONTEXT.md`). New durable artifacts (inventory, decisions, SDK doc) follow the same convention and commit with the phase.
- Merge-base constant `fa4bba47` and upstream tag commit `1bb253c9` are fixed inputs — do not re-derive or fetch upstream `--tags` (tag namespace is contaminated; fetch only `refs/tags/v1.3.1`).

### Integration Points
- The fork-edit inventory (D-01/D-02) is consumed by Phase 70 (fork-patch restoration) and Phase 71 (verification) as the survival-audit baseline.
- The SDK-01 doc gates SDK-02 (accepting the `sdk/` deletion) in Phase 69 — Phase 69 must not accept the deletion until this doc exists.

</code_context>

<specifics>
## Specific Ideas

- Inventory and decisions are durable + committed; the research's `/tmp/fork-edit-inventory.txt` suggestion is explicitly overridden (D-01).
- SDK doc is restoration-grade and self-sufficient (D-03) — a future restorer should not need the deleted source.

</specifics>

<deferred>
## Deferred Ideas

- **Restoring the fork's SDK features** — captured as SDK-01 documentation only; actual restoration is a future SDKR-01 milestone, explicitly out of scope here.
- **Project-wide ADR / decisions-log convention** — considered (option to seed `.planning/DECISIONS-INDEX.md`) but declined for this phase; decisions recorded in a single phase-local `68-DECISIONS.md` instead. A future milestone may formalize a project-wide convention.
- **Curated/annotated inventory summary** — considered but deferred in favor of the raw diff (D-02); can be added later if Phase 70 auditing proves the raw diff insufficient.

None of these belong in Phase 68's scope.

</deferred>

---

*Phase: 68-Pre-Merge Inventory, Backup & SDK Capture*
*Context gathered: 2026-06-10*
