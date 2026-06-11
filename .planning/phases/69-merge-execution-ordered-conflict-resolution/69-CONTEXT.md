# Phase 69: Merge Execution & Ordered Conflict Resolution - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Merge upstream tag `v1.3.1` (`open-gsd/gsd-core`, `1bb253c9`) into the fork via `git merge -s ort` (shared history), resolve every conflict in documented triage order with incremental commits, restore fork-only files upstream deletes, reconcile `package.json`/`package-lock.json`, and accept upstream's `sdk/` deletion.

**This milestone is merge-only.** Functional integration of upstream changes is in scope; the fork's prompt-quality/positive-framing conformance pass is NOT — it is deferred to a future milestone. Tests are allowed to fail (verification is structural/grep-based, never "all tests pass").

</domain>

<decisions>
## Implementation Decisions

### Prompt-content conflict resolution
- **D-01:** When a prompt-content file (`agents/`, `commands/gsd/`, `get-shit-done/workflows/`, `get-shit-done/references/`) conflicts, **hand-merge** — integrate upstream's functional changes into the fork file per-file. No bulk `-X theirs` (forbidden by MERGE-03).
- **D-02:** Hand-merge depth = **integrate upstream changes while preserving all fork patches**. Do NOT apply the fork's positive-framing/quality-bar conformance during this merge. Conformance is a separate future milestone, not Phase 69/70/71.

### Commit granularity
- **D-03:** **Per-file commits everywhere** for conflict resolution — every resolved file lands as its own commit across all triage tiers (not just the prompt-content tier). Maximizes traceability and satisfies MERGE-03's "more than one resolution commit / no mega-commit" by a wide margin. Triage *order* still governs the sequence of those per-file commits.

### package.json reconciliation
- **D-04:** Fork identity fields are **sacred** on conflict: `name` (`get-shit-done-cc`), the `bin` map (`get-shit-done-redux`, `gsd-sdk`, `gsd-tools`), `repository.url`, and fork `version`. Take upstream for genuinely new dependencies / scripts / engines unless they break the fork. Reconcile to upstream base + these preserved fork values; regenerate the lockfile cleanly (`npm install` exits 0, no churn on a second run).

### Abort / recovery protocol
- **D-05:** **Abort-and-restart before commits.** Any resolution mistake caught before a resolution commit lands → `git merge --abort` and restart from clean rather than untangling a bad partial state. The `pre-merge-v1.3.1-backup` branch (created in Phase 68) is the hard recovery anchor if HEAD is ever lost.

### Claude's Discretion
- Exact per-file ordering *within* each triage tier (the tier order itself is locked by MERGE-03).
- Mechanics of detecting fork-only deletions vs. real conflicts.
- How the lockfile is regenerated (delete + reinstall vs. targeted) so long as the clean-regeneration criterion (D-04 / MERGE-04) holds.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — MERGE-02, MERGE-03, MERGE-04, PATCH-03, SDK-02 (the locked requirements for this phase)
- `.planning/ROADMAP.md` — Phase 69 goal, success criteria, and the milestone triage-order definition

### Triage order (from MERGE-03 / ROADMAP success criteria)
- Resolution order: `.planning/` + `CLAUDE.md` (ours) → infrastructure → fork-critical → prompt content (per-file) → tests → new upstream additions

### Phase 68 anchors (prerequisites already on disk)
- `pre-merge-v1.3.1-backup` branch — recovery anchor (git branch, not a file)
- Phase 68 fork-edit inventory + architecture-decision records under `.planning/phases/68-*/` — KEEP fork SHA-based update-check worker (PATCH-02); ACCEPT upstream `sdk/` deletion after SDK-01 documentation
- Phase 68 `sdk/` capability documentation in `.planning/` — restoration-grade record consulted before accepting the `sdk/` deletion (SDK-02 depends on SDK-01)

### Fork standards (context only — NOT applied this milestone)
- `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md`, `PROMPT_ENGINEERING_GUIDE_V09.md` — the fork quality bar. Referenced so the planner understands what is being deliberately deferred; conformance is a future milestone, not Phase 69.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `pre-merge-v1.3.1-backup` branch (Phase 68): hard rollback anchor for D-05.
- `git config diff.renameLimit` / `merge.renameLimit` already set to `5000` (Phase 68) — required for `-s ort` rename detection across the large prompt corpus.
- `upstream` remote already points at `https://github.com/open-gsd/gsd-core.git`.

### Established Patterns
- Fork-owned paths (per Phase 68 inventory): `agents/`, `commands/gsd/`, `get-shit-done/workflows/`, `get-shit-done/references/`, `bin/install.js`, `hooks/` — these carry fork patches that must survive the hand-merge (D-02).
- Verification is structural/grep-based (no `git status` conflict markers; named-file presence checks), never test-suite-green.

### Integration Points
- `package.json` / `package-lock.json` reconciliation (D-04 / MERGE-04).
- `sdk/` delete/modify conflicts resolved in upstream's favor → `ls sdk/` must fail after merge (SDK-02).
- Fork-only files upstream deletes must remain populated: `CLAUDE.md`, `CATALOGUE.json`, `.planning/` (PATCH-03).
- Directory rename `get-shit-done/` → `gsd-core/` is OUT of scope for Phase 69 (MERGE-02 forbids pre-renaming; Phase 71 handles the rename sweep).

</code_context>

<specifics>
## Specific Ideas

- Merge must be a true shared-history merge: `git merge -s ort`, no `--allow-unrelated-histories`, no pre-renamed directory. The resulting merge commit's second parent must be `1bb253c9`.
- "Merge only" framing is explicit from the user: integrate functional upstream changes, preserve fork patches, defer all quality-bar conformance, and accept failing tests as a documented backlog rather than a blocker.

</specifics>

<deferred>
## Deferred Ideas

- **Prompt-quality / positive-framing conformance pass** for newly-integrated upstream content — explicitly deferred by the user to a future milestone (not Phase 69/70/71).
- **Directory rename adoption** (`get-shit-done/` → `gsd-core/`) — Phase 71 (Rename Sweep).
- **Fork-patch restoration & TypeScript port** of `bin/lib` additions — Phase 70.

</deferred>

---

*Phase: 69-merge-execution-ordered-conflict-resolution*
*Context gathered: 2026-06-11*
