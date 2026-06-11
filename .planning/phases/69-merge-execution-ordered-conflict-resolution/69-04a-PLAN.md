---
phase: 69-merge-execution-ordered-conflict-resolution
plan: 04a
type: execute
wave: 4
depends_on: ["69-03"]
files_modified:
  - agents/
  - commands/gsd/
autonomous: true
requirements: [MERGE-03, D-01, D-02]
must_haves:
  truths:
    - "D-08: Step B — ordinary single-parent per-file follow-up commits AFTER the closed merge (no MERGE_HEAD)"
    - "D-01: every fork agents/ and commands/gsd/ file gets upstream's functional changes integrated by HAND, per-file — never bulk -X theirs"
    - "D-02: integrate upstream functional changes while preserving all fork patches; NO positive-framing/quality-bar conformance applied (deferred milestone)"
    - "D-03: every integrated file lands as its own per-file commit"
    - "Fork agent frontmatter is preserved exactly (no skills: key introduced; Write-tool agents keep their guardrail string; valid-agent list intact)"
  artifacts:
    - path: agents/gsd-executor.md
      provides: "Fork executor agent with upstream functional changes integrated, frontmatter preserved"
  key_links:
    - from: "fork agents/ + commands/gsd/ files (OURS from merge commit)"
      to: "fork file with upstream functional changes folded in"
      via: "per-file hand integration (D-01), per-file commit (D-03)"
      pattern: "git commit -m \"merge(69-04a)"
---

<objective>
Execute **Step B / Tier 4a**: integrate upstream's functional changes into the fork `agents/gsd-*.md` (11) and `commands/gsd/*.md` (~67) files, as ordinary per-file follow-up commits after the closed merge. Fold upstream's functional changes into each fork file while preserving all fork patches (D-01/D-02); do NOT apply the fork's positive-framing/quality-bar conformance pass (deferred milestone). Per-file commits (D-03).

Purpose: Tier 4 is the largest tier; this 04a slice covers agents + commands only so no single plan integrates ~150 files (keeps each within a single context budget and quality high). The 69-01 merge commit left these fork files at their OURS state; here upstream's functional deltas are folded in one file at a time.

Output: All fork agents/ and commands/gsd/ files updated with upstream functional changes via per-file follow-up commits.

CRITICAL: Merge is CLOSED (MERGE_HEAD cleared in 69-01) — these are ordinary commits; do NOT reference MERGE_HEAD or run `git merge --continue`. To see upstream's functional change for a file: `git diff $(git merge-base HEAD 1bb253c9) 1bb253c9 -- <path>`, then apply it into the fork file by hand. NEVER bulk-overwrite with upstream (`-X theirs`/`git checkout --theirs`) — that loses fork patches (D-01, Pitfall 4). Agent frontmatter must be preserved exactly — `agent-frontmatter.test.cjs` validates all agents; do NOT introduce a `skills:` key (breaks Gemini CLI) and keep the `Only use the Write tool` guardrail string in Write-tool agents.
</objective>

<execution_context>
On branch `dev`, merge already committed by 69-01 (MERGE_HEAD cleared). Stay on `dev`. The fork agents/ + commands/gsd/ files currently hold the fork (OURS) content from the merge commit. Diff upstream functional change per file via `git diff $(git merge-base HEAD 1bb253c9) 1bb253c9 -- <path>`. The incoming `gsd-core/**` tree is already accepted additively (69-01) and is OUT of scope here.
</execution_context>

<tasks>

<task type="auto">
  <name>Task 1: Integrate upstream functional changes into fork agents/ (per-file)</name>
  <files>agents/</files>
  <read_first>
    - .planning/phases/69-merge-execution-ordered-conflict-resolution/69-RESEARCH.md (Tier 4 table; Pitfall 4 no -X theirs)
    - .planning/phases/69-merge-execution-ordered-conflict-resolution/69-CONTEXT.md (D-01 hand-integrate, D-02 preserve fork patches / no conformance, D-03 per-file commits)
    - CLAUDE.md (agent-frontmatter rules: no skills:, Write-tool guardrail string, valid-agent list)
  </read_first>
  <action>
    For each fork agent file, diff upstream's functional change (`git diff $(git merge-base HEAD 1bb253c9) 1bb253c9 -- agents/<file>`) and apply it INTO the fork file per D-01/D-02 — integrate functional changes while preserving every fork patch; do NOT run positive-framing/quality-bar conformance (deferred). Preserve agent frontmatter exactly: no `skills:` key, keep the `Only use the Write tool` guardrail in Write-tool agents, keep the fork's valid-agent membership. `git add agents/<file>`, commit per-file (D-03): `git commit -m "merge(69-04a): integrate upstream into agents/<file> [Tier 4]"`. NEVER `git checkout --theirs`/`-X theirs`. The 11 headline agents: debugger, debug-session-manager, doc-writer, executor, intel-updater, phase-researcher, plan-checker, planner, research-synthesizer, user-profiler, verifier. If upstream made no functional change to a fork agent, note it in deviations and skip.
  </action>
  <acceptance_criteria>
    - No conflict markers remain in agents/ (grep for `<<<<<<<`/`>>>>>>>` empty)
    - No agent file contains a `skills:` frontmatter key
    - Each changed agent landed as its own commit tagged `[Tier 4]`
  </acceptance_criteria>
  <verify>
    <automated>test -z "$(command grep -rlE '^(<<<<<<<|>>>>>>>)' agents/ 2>/dev/null)" && test -z "$(command grep -rl '^skills:' agents/ 2>/dev/null)"</automated>
  </verify>
  <done>All fork agents/ files integrated with upstream functional changes, fork patches and frontmatter preserved, committed per-file as ordinary follow-up commits.</done>
</task>

<task type="auto">
  <name>Task 2: Integrate upstream functional changes into fork commands/gsd/ (per-file)</name>
  <files>commands/gsd/</files>
  <read_first>
    - .planning/phases/69-merge-execution-ordered-conflict-resolution/69-RESEARCH.md (Tier 4 table; Open Question on ~67 commands/gsd; Pitfall 4)
    - .planning/phases/69-merge-execution-ordered-conflict-resolution/69-CONTEXT.md (D-01/D-02/D-03)
  </read_first>
  <action>
    For each fork command file, diff upstream's functional change (`git diff $(git merge-base HEAD 1bb253c9) 1bb253c9 -- commands/gsd/<file>`) and apply it into the fork file per D-01/D-02 — preserve fork patches, no conformance pass. `git add commands/gsd/<file>`, commit per-file (D-03): `git commit -m "merge(69-04a): integrate upstream into commands/gsd/<file> [Tier 4]"`. NEVER `-X theirs`. This is a large set (~67 files) — work through it in batches across invocations, but every file is a separate commit. If upstream made no functional change to a file, note it in deviations and skip.
  </action>
  <acceptance_criteria>
    - No conflict markers remain in commands/gsd/ (grep empty)
    - `git status --porcelain | command grep -E '^(UU|UD|DU|AA|AU) commands/gsd/'` is empty (merge stays closed)
    - Each changed command landed as its own commit tagged `[Tier 4]`
  </acceptance_criteria>
  <verify>
    <automated>test -z "$(command grep -rlE '^(<<<<<<<|>>>>>>>)' commands/gsd/ 2>/dev/null)" && test -z "$(git status --porcelain | command grep -E '^(UU|UD|DU|AA|AU) commands/gsd/')"</automated>
  </verify>
  <done>All fork commands/gsd/ files integrated with upstream functional changes, fork patches preserved, committed per-file as ordinary follow-up commits.</done>
</task>

</tasks>

<verification>
- No conflict markers in agents/ or commands/gsd/
- No agent gained a `skills:` key; Write-tool guardrails preserved
- Merge stays closed (no MERGE_HEAD, no unmerged paths) — ordinary follow-up commits (D-08)
</verification>

<success_criteria>
All Tier-4a fork agents/ and commands/gsd/ files integrated per-file with upstream functional changes, fork patches and frontmatter preserved (D-01/D-02), no conformance pass, committed per-file (D-03) — ready for Tier 4b (69-04b).
</success_criteria>

<output>
Create `.planning/phases/69-merge-execution-ordered-conflict-resolution/69-04a-SUMMARY.md` when done. Merge already closed; ordinary follow-up commits.
</output>
</content>
