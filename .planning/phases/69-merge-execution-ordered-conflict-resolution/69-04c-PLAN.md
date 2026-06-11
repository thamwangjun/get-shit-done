---
phase: 69-merge-execution-ordered-conflict-resolution
plan: 04c
type: execute
wave: 6
depends_on: ["69-04b"]
files_modified:
  - docs/
  - README.md
  - README.ja-JP.md
  - README.ko-KR.md
  - README.pt-BR.md
  - README.zh-CN.md
  - CONTRIBUTING.md
autonomous: true
requirements: [MERGE-03, D-01, D-02]
must_haves:
  truths:
    - "D-08: ordinary single-parent per-file follow-up commits AFTER the closed merge (no MERGE_HEAD)"
    - "D-01: docs/, READMEs, CONTRIBUTING.md get upstream's functional changes integrated by HAND, per-file — never bulk -X theirs"
    - "D-02: integrate upstream functional changes while preserving fork-specific doc content; NO conformance pass"
    - "D-03: every integrated doc file lands as its own per-file commit"
    - "No gsd-core/ pre-renaming in doc references (Phase 71 owns the rename sweep)"
  artifacts:
    - path: README.md
      provides: "Fork README with upstream functional changes integrated"
  key_links:
    - from: "fork docs/ + READMEs + CONTRIBUTING.md (OURS from merge commit)"
      to: "fork doc with upstream functional changes folded in"
      via: "per-file hand integration (D-01), per-file commit (D-03)"
      pattern: "git commit -m \"merge(69-04c)"
---

<objective>
Execute **Step B / Tier 4c**: integrate upstream's functional changes into the fork `docs/**`, the 5 `README*.md`, and `CONTRIBUTING.md` as ordinary per-file follow-up commits after the closed merge. Fold upstream functional changes into each fork doc while preserving fork-specific content (D-01/D-02); no conformance pass. Per-file commits (D-03).

Purpose: This 04c slice covers docs + READMEs + CONTRIBUTING.md, the third and final Tier-4 slice, so no single plan integrates ~150 files. The 69-01 merge commit left these fork docs at their OURS state; upstream's functional deltas are folded in here.

Output: All fork docs/, READMEs, and CONTRIBUTING.md updated with upstream functional changes via per-file follow-up commits.

CRITICAL: Merge is CLOSED (MERGE_HEAD cleared in 69-01) — ordinary commits only. To see upstream's functional change: `git diff $(git merge-base HEAD 1bb253c9) 1bb253c9 -- <path>` (for docs upstream may have renamed into gsd-core/docs/ — use the rename-detected counterpart where applicable). Apply functional changes into the fork doc by hand. Do NOT pre-rename any `gsd-core/` doc references (Phase 71). NEVER `-X theirs`.
</objective>

<execution_context>
On branch `dev`, merge already committed by 69-01 (MERGE_HEAD cleared). Stay on `dev`. Fork docs/READMEs/CONTRIBUTING.md hold OURS content from the merge commit. Diff upstream's functional change per file (using the gsd-core/ rename counterpart where upstream moved a doc), then apply into the fork doc keeping fork-specific content.
</execution_context>

<tasks>

<task type="auto">
  <name>Task 1: Integrate upstream functional changes into docs/ (per-file)</name>
  <files>docs/</files>
  <read_first>
    - .planning/phases/69-merge-execution-ordered-conflict-resolution/69-RESEARCH.md (Tier 4 table: docs/** UU/AA)
    - .planning/phases/69-merge-execution-ordered-conflict-resolution/69-CONTEXT.md (D-01/D-02/D-03)
  </read_first>
  <action>
    For each fork doc that upstream changed (USER-GUIDE, CONFIGURATION, adr/, prd/, agents/, zh-CN/, branching, etc.), extract upstream's functional change (`git diff $(git merge-base HEAD 1bb253c9) 1bb253c9 -- docs/<path>`, using the gsd-core/docs/ rename counterpart where upstream moved it) and apply it into the fork doc per D-01/D-02 — preserve fork-specific content, no conformance. Do NOT pre-rename gsd-core/ references (Phase 71). `git add` + per-file commit (D-03): `git commit -m "merge(69-04c): integrate upstream into docs/<path> [Tier 4]"`. NEVER `-X theirs`. Skip docs with no upstream functional change (note in deviations).
  </action>
  <acceptance_criteria>
    - No conflict markers remain in docs/
    - Each changed doc landed as its own commit tagged `[Tier 4]`
    - `git status --porcelain | command grep -E '^(UU|UD|DU|AA|AU) docs/'` is empty (merge stays closed)
  </acceptance_criteria>
  <verify>
    <automated>test -z "$(command grep -rlE '^(<<<<<<<|>>>>>>>)' docs/ 2>/dev/null)" && test -z "$(git status --porcelain | command grep -E '^(UU|UD|DU|AA|AU) docs/')"</automated>
  </verify>
  <done>All fork docs/ files integrated with upstream functional changes, committed per-file as ordinary follow-up commits.</done>
</task>

<task type="auto">
  <name>Task 2: Integrate upstream functional changes into READMEs and CONTRIBUTING.md (per-file)</name>
  <files>README.md, README.ja-JP.md, README.ko-KR.md, README.pt-BR.md, README.zh-CN.md, CONTRIBUTING.md</files>
  <read_first>
    - .planning/phases/69-merge-execution-ordered-conflict-resolution/69-RESEARCH.md (Tier 4 table: 5 READMEs, CONTRIBUTING.md UU)
    - .planning/phases/69-merge-execution-ordered-conflict-resolution/69-CONTEXT.md (D-03 per-file commits)
  </read_first>
  <action>
    For each README and CONTRIBUTING.md, extract upstream's functional change (`git diff $(git merge-base HEAD 1bb253c9) 1bb253c9 -- <file>`) and apply it into the fork file per D-01/D-02 — preserve fork-specific content (fork name/branding/URLs), no conformance. Do NOT pre-rename gsd-core/ references. `git add` + per-file commit (D-03): `git commit -m "merge(69-04c): integrate upstream into <file> [Tier 4]"`. NEVER `-X theirs`. Skip files with no upstream functional change (note in deviations).
  </action>
  <acceptance_criteria>
    - No conflict markers remain in any README or CONTRIBUTING.md
    - Each changed file committed per-file tagged `[Tier 4]`
    - `git status --porcelain | command grep -E '^(UU|UD|DU|AA|AU) (README|CONTRIBUTING.md)'` is empty
  </acceptance_criteria>
  <verify>
    <automated>test -z "$(command grep -lE '^(<<<<<<<|>>>>>>>)' README*.md CONTRIBUTING.md 2>/dev/null)" && test -z "$(git status --porcelain | command grep -E '^(UU|UD|DU|AA|AU) (README|CONTRIBUTING.md)')"</automated>
  </verify>
  <done>All fork READMEs and CONTRIBUTING.md integrated with upstream functional changes, fork-specific content preserved, committed per-file.</done>
</task>

</tasks>

<verification>
- No conflict markers in docs/, READMEs, CONTRIBUTING.md
- No gsd-core/ pre-renaming in doc references (rename deferred to Phase 71)
- Merge stays closed (no MERGE_HEAD, no unmerged paths) — ordinary follow-up commits (D-08)
</verification>

<success_criteria>
All Tier-4c docs/README/CONTRIBUTING files integrated per-file with upstream functional changes, fork-specific content preserved (D-01/D-02), no conformance pass, committed per-file (D-03) — ready for Tier 5 (69-05).
</success_criteria>

<output>
Create `.planning/phases/69-merge-execution-ordered-conflict-resolution/69-04c-SUMMARY.md` when done. Merge already closed; ordinary follow-up commits.
</output>
</content>
