---
phase: 69-merge-execution-ordered-conflict-resolution
plan: 04b
type: execute
wave: 5
depends_on: ["69-04a"]
files_modified:
  - get-shit-done/workflows/
  - get-shit-done/references/
  - get-shit-done/templates/
autonomous: true
requirements: [MERGE-03, D-01, D-02]
must_haves:
  truths:
    - "D-08: ordinary single-parent per-file follow-up commits AFTER the closed merge (no MERGE_HEAD)"
    - "D-01: every fork get-shit-done/workflows|references|templates file gets upstream's functional changes integrated by HAND, per-file — never bulk -X theirs"
    - "D-02: integrate upstream functional changes while preserving all fork patches; NO conformance pass"
    - "MERGE-02: files stay at their get-shit-done/ paths (rename to gsd-core/ NOT adopted — Phase 71); incoming gsd-core/ tree already accepted additively in 69-01"
    - "D-03: every integrated file lands as its own per-file commit"
  artifacts:
    - path: get-shit-done/workflows/execute-phase.md
      provides: "Fork workflow with upstream functional changes integrated at its get-shit-done/ path"
  key_links:
    - from: "fork get-shit-done/{workflows,references,templates}/ files (OURS from merge commit)"
      to: "fork file with upstream functional changes folded in, same path"
      via: "per-file hand integration (D-01), per-file commit (D-03)"
      pattern: "git commit -m \"merge(69-04b)"
---

<objective>
Execute **Step B / Tier 4b**: integrate upstream's functional changes into the fork `get-shit-done/workflows/`, `get-shit-done/references/`, and `get-shit-done/templates/` markdown files as ordinary per-file follow-up commits after the closed merge. Fold upstream functional changes into each fork file while preserving fork patches (D-01/D-02); no conformance pass. Files stay at their `get-shit-done/` paths — the rename is Phase 71. Per-file commits (D-03).

Purpose: This 04b slice covers the get-shit-done/ prompt corpus (workflows/references/templates), the second of three Tier-4 slices, so no single plan integrates ~150 files. The 69-01 merge commit left these fork files at their OURS state at get-shit-done/ paths; upstream's functional deltas are folded in here.

Output: All fork get-shit-done/ workflows/references/templates files updated with upstream functional changes via per-file follow-up commits, at their original paths.

CRITICAL: Merge is CLOSED (MERGE_HEAD cleared in 69-01) — ordinary commits only. To see upstream's functional change for a get-shit-done/ file, note upstream renamed it to gsd-core/: diff the fork path against upstream's rename target — `git diff $(git merge-base HEAD 1bb253c9):get-shit-done/<path> 1bb253c9:gsd-core/<path>` (use the rename-detected counterpart). Apply functional changes into the fork file by hand; KEEP it at `get-shit-done/` (do NOT move to gsd-core/ — Phase 71). The incoming `gsd-core/**` tree is already accepted additively (69-01) — do NOT touch it. NEVER `-X theirs`.
</objective>

<execution_context>
On branch `dev`, merge already committed by 69-01 (MERGE_HEAD cleared). Stay on `dev`. Fork get-shit-done/ files hold OURS content from the merge commit. Upstream's counterpart lives at the renamed `gsd-core/<same-relative-path>`; diff against it to extract the functional change, then apply into the fork file keeping the get-shit-done/ path. The additive gsd-core/ tree is out of scope.
</execution_context>

<tasks>

<task type="auto">
  <name>Task 1: Integrate upstream functional changes into fork get-shit-done/workflows/ (per-file)</name>
  <files>get-shit-done/workflows/</files>
  <read_first>
    - .planning/phases/69-merge-execution-ordered-conflict-resolution/69-RESEARCH.md (Tier 4 table: get-shit-done/ paired with gsd-core/ rename target; Pitfall 1)
    - .planning/phases/69-merge-execution-ordered-conflict-resolution/69-CONTEXT.md (D-01/D-02/D-03; MERGE-02 rename NOT adopted)
  </read_first>
  <action>
    For each fork workflow file, extract upstream's functional change from the renamed counterpart (`git diff $(git merge-base HEAD 1bb253c9):get-shit-done/workflows/<file> 1bb253c9:gsd-core/workflows/<file>` where the rename pairs) and apply it INTO the fork file per D-01/D-02 — preserve fork patches, no conformance. KEEP the file at `get-shit-done/workflows/` (do NOT move to gsd-core/ — Phase 71). `git add` + per-file commit (D-03): `git commit -m "merge(69-04b): integrate upstream into get-shit-done/workflows/<file> [Tier 4]"`. NEVER `-X theirs`. If a fork workflow has no upstream functional change, note in deviations and skip.
  </action>
  <acceptance_criteria>
    - No conflict markers remain in get-shit-done/workflows/
    - Files remain at their `get-shit-done/workflows/` paths (no gsd-core/ move)
    - Each changed file landed as its own commit tagged `[Tier 4]`
  </acceptance_criteria>
  <verify>
    <automated>test -z "$(command grep -rlE '^(<<<<<<<|>>>>>>>)' get-shit-done/workflows/ 2>/dev/null)" && ls get-shit-done/workflows >/dev/null 2>&1</automated>
  </verify>
  <done>All fork get-shit-done/workflows/ files integrated with upstream functional changes at their original paths, committed per-file.</done>
</task>

<task type="auto">
  <name>Task 2: Integrate upstream functional changes into fork get-shit-done/references/ and templates/ (per-file)</name>
  <files>get-shit-done/references/, get-shit-done/templates/</files>
  <read_first>
    - .planning/phases/69-merge-execution-ordered-conflict-resolution/69-RESEARCH.md (Tier 4 table: references/templates UU paired with gsd-core/)
    - .planning/phases/69-merge-execution-ordered-conflict-resolution/69-CONTEXT.md (D-01/D-02/D-03; MERGE-02)
  </read_first>
  <action>
    For each fork references/ and templates/ file, extract upstream's functional change from the renamed counterpart (`git diff $(git merge-base HEAD 1bb253c9):get-shit-done/references/<file> 1bb253c9:gsd-core/references/<file>`, likewise for templates/) and apply it into the fork file per D-01/D-02 — preserve fork patches, no conformance. KEEP files at their `get-shit-done/` paths (rename is Phase 71). `git add` + per-file commit (D-03): `git commit -m "merge(69-04b): integrate upstream into get-shit-done/<path> [Tier 4]"`. NEVER `-X theirs`. Skip files with no upstream functional change (note in deviations).
  </action>
  <acceptance_criteria>
    - No conflict markers remain in get-shit-done/references/ or get-shit-done/templates/
    - Files remain at their get-shit-done/ paths
    - `git status --porcelain | command grep -E '^(UU|UD|DU|AA|AU) get-shit-done/(references|templates)/'` is empty (merge stays closed)
    - Each changed file landed as its own commit tagged `[Tier 4]`
  </acceptance_criteria>
  <verify>
    <automated>test -z "$(command grep -rlE '^(<<<<<<<|>>>>>>>)' get-shit-done/references/ get-shit-done/templates/ 2>/dev/null)" && test -z "$(git status --porcelain | command grep -E '^(UU|UD|DU|AA|AU) get-shit-done/(references|templates)/')"</automated>
  </verify>
  <done>All fork get-shit-done/references/ and templates/ files integrated with upstream functional changes at their original paths, committed per-file.</done>
</task>

</tasks>

<verification>
- No conflict markers in get-shit-done/workflows|references|templates
- Files stay at `get-shit-done/` paths (rename deferred to Phase 71)
- Merge stays closed (no MERGE_HEAD, no unmerged paths) — ordinary follow-up commits (D-08)
</verification>

<success_criteria>
All Tier-4b fork get-shit-done/ prompt content integrated per-file with upstream functional changes at original paths, fork patches preserved (D-01/D-02), no conformance pass, committed per-file (D-03) — ready for Tier 4c (69-04c).
</success_criteria>

<output>
Create `.planning/phases/69-merge-execution-ordered-conflict-resolution/69-04b-SUMMARY.md` when done. Merge already closed; ordinary follow-up commits.
</output>
</content>
