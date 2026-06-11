---
phase: 69-merge-execution-ordered-conflict-resolution
plan: 04b
subsystem: prompt-content
tags: [merge, tier-4b, prompt-content, workflows, references, templates, fork-preservation, rename-deferred, corrective-restore]
dependency_graph:
  requires:
    - phase: 69-04a
      provides: fork agents/gsd-*.md and commands/gsd/*.md integrated; Tier-4 hand-merge method established
  provides:
    - fork get-shit-done/{workflows,references,templates,contexts}/ prompt corpus RESTORED at its original paths (corrects 69-01 rename-adoption defect)
    - fork get-shit-done/{workflows,references,templates}/ files updated with upstream functional deltas (parallel doc-writer waves, resume-incomplete-phase Route 0, Drift Guard settings, gpt-5.5 model table, {phase_num}-UAT.md naming, subagent-spawn progress prints, update-context projection)
    - fork patches preserved (Eta <%~ includes, $GSD_SDK/gsd-sdk resolver shim, inline worktree guard, get-shit-done/ paths, @opengsd/get-shit-done-redux package/bin, positive framing)
  affects: [69-04c (docs/READMEs), 69-05 (tests), 69-06 (verification), Phase 71 rename sweep]
tech_stack:
  added: []
  patterns:
    - "Tier-4b prompt-content hand-merge via 3-way git merge-file: base=fa4bba47:get-shit-done/<p>, ours=restored fork HEAD, theirs=1bb253c9:gsd-core/<p> with rename/shim/package tokens reverted to fork form; --ours resolves the uniform resolver-shim conflict (fork resolver is a fork patch), genuine-content hunks fold automatically or by hand"
    - "Rename-revert sed normalizes upstream gsd-core tokens back to fork form (gsd-core/->get-shit-done/, gsd_run->$GSD_SDK, @opengsd/gsd-core->@opengsd/get-shit-done-redux, bin gsd-core->get-shit-done-redux) so only genuine functional deltas survive the merge"
key_files:
  created:
    - .planning/phases/69-merge-execution-ordered-conflict-resolution/69-04b-SUMMARY.md
  modified:
    - get-shit-done/workflows/ (56 files integrated)
    - get-shit-done/references/ (13 files integrated)
    - get-shit-done/templates/ (2 files integrated)
key-decisions:
  - "STEP-1 CORRECTIVE DEVIATION (Option A): 69-01 wrongly adopted upstream's get-shit-done/->gsd-core/ rename, DELETING the entire fork prompt corpus (222 files: workflows/references/templates/contexts). Restored from pre-merge-v1.3.1-backup as ONE corrective commit (1e111b87) BEFORE integration. Merge stays closed (ordinary commit, no MERGE_HEAD reopen). 69-06 verification must account for this restore."
  - "Correct delta base is the true merge-base fa4bba47, NOT `git merge-base HEAD 1bb253c9` (returns 1bb253c9 post-merge = empty diff). Used `git diff fa4bba47:get-shit-done/<p> 1bb253c9:gsd-core/<p>`."
  - "Rename-class OUT of scope (MERGE-02, Phase 71): get-shit-done/->gsd-core/ paths, gsd_run/gsd-tools resolver shim, @opengsd/gsd-core package+bin all reverted to fork form; rename NOT adopted. Files stay at get-shit-done/ paths."
  - "The upstream SDK-resolver shim refactor (gsd_run multi-location fallback) is treated as rename/identity-class, not separable functional behavior — the fork's $GSD_SDK/gsd-sdk resolver block is a fork patch and is preserved (resolved --ours in every conflicting file)."
  - "SKIP get-shit-done/references/worktree-path-safety.md: upstream replaced the inline worktree guard with a reference to a NEW canonical fragment get-shit-done/references/worktree-branch-check.md that does not exist in the fork. Adopting it is a structural reorg (new file + orchestrator-embeds-fragment pattern) beyond functional-only integration. Fork keeps its complete self-contained inline guard."
patterns-established:
  - "Three-tier delta classification: (1) clean merges, (2) shim-only conflicts resolved --ours, (3) non-shim conflicts resolved by hand (ours for shim/structural hunks, theirs for genuine content). Residual-line heuristic (strip rename/shim tokens, count remainder) flags files needing manual review."
requirements-completed: [MERGE-03, D-01, D-02]
duration: 40min
completed: 2026-06-11
---

# Phase 69 Plan 04b: Tier-4b get-shit-done/ Prompt Corpus Integration Summary

Restored the fork `get-shit-done/{workflows,references,templates,contexts}/` prompt corpus that the 69-01 merge wrongly deleted by adopting upstream's `get-shit-done/ -> gsd-core/` rename, then folded upstream functional deltas into 71 of the restored files via 3-way hand-merge — fork patches preserved, rename not adopted (deferred to Phase 71), merge stays closed.

## What Was Built

**Step 1 — Corrective restore (1 commit):** `git checkout pre-merge-v1.3.1-backup -- get-shit-done/{workflows,references,templates,contexts}/` restored 222 fork prompt files deleted by 69-01's rename adoption. Fork patches confirmed back (execute-phase.md: 4 `<%~` markers, 0 banned `{%~`). Additive `gsd-core/` tree left untouched (both coexist per MERGE-02).

**Step 2 — Per-file integration (71 commits):** For each restored file, ran a 3-way merge (`git merge-file`) with the upstream counterpart rename-reverted to fork form. 102 of 113 delta files merged automatically (39 clean + 63 shim-only resolved `--ours`); 11 needed manual review, of which 10 were integrated (7 auto-folded under `--ours` since genuine content sat in non-conflicting hunks, 3 hand-resolved: checkpoints.md, explore.md, docs-update.md) and 1 skipped (worktree-path-safety.md). 41 files reverted to pristine (upstream delta was purely rename/shim → no net change after revert).

Genuine functional content folded in includes: `resume_incomplete_phase`/Route 0 logic (next.md), parallel doc-writer wave dispatch + doc-verifier flow (docs-update.md), Drift Guard settings (settings.md, settings-advanced.md, new-project.md), gpt-5.5 model table (settings-advanced.md), `{phase_num}-UAT.md` naming (checkpoints.md, #3309), subagent-spawn progress prints (explore.md), and the update-context.cjs projection refactor (update.md, #498).

## Integrated Files (71 total)

- workflows/: 56 files
- references/: 13 files
- templates/: 2 files

## Deviations from Plan

### Major: Step-1 Corrective Restore (corrects a 69-01 defect)

**[Rule 1 - Bug] 69-01 deleted the entire fork prompt corpus by adopting the rename**
- **Found during:** Pre-execution state inspection. `get-shit-done/{workflows,references,templates,contexts}/` were entirely MISSING from HEAD; `git diff pre-merge-v1.3.1-backup HEAD -- get-shit-done/` showed 222 `D` (deleted) prompt files.
- **Issue:** 69-01 wrongly adopted upstream's `get-shit-done/ -> gsd-core/` rename, violating MERGE-02 (rename deferred to Phase 71; trees coexist). The 04b plan assumed these files were present at OURS state — they were gone.
- **Fix:** Restored via `git checkout pre-merge-v1.3.1-backup -- <paths>`, committed as ONE corrective commit `fix(69-04b): restore fork prompt corpus...` (1e111b87). Merge stays closed (ordinary single-parent commit, no MERGE_HEAD reopen).
- **Authorized by:** User decision (Option A).
- **Commit:** 1e111b87
- **Impact on 69-06:** Verification must account for this restore — the get-shit-done/ corpus exists because of an explicit corrective commit, not because 69-01 preserved it.

### Auto-handled Skips

**[Skip] get-shit-done/references/worktree-path-safety.md — kept fork inline guard**
- Upstream replaced the inline worktree guard with a reference to a NEW fragment `worktree-branch-check.md` (absent in fork) + an orchestrator-embeds-fragment structural pattern. That is a structural reorg, not functional-only integration. Fork retains its complete self-contained inline guard (all guard logic present). Not committed.

**[Skip] 41 rename/shim-only files** — upstream delta was purely rename/resolver-shim tokens that revert to fork form, yielding no net change. Noted, not committed (no functional content to integrate).

**[Skip] 104 no-delta files** — restored fork content already identical to upstream at the merge base (no upstream functional change). Skipped per plan.

## Self-Check: PASSED

- get-shit-done/{workflows,references,templates,contexts}/ present and populated.
- No conflict markers in the prompt corpus.
- No `gsd_run` / `@opengsd/gsd-core` leak in workflows/references/templates.
- No banned `{%~` Eta syntax; fork `<%~` markers preserved (execute-phase.md: 4).
- Files remain at `get-shit-done/` paths (rename NOT adopted); additive `gsd-core/` tree untouched.
- Merge stays closed: no MERGE_HEAD, no unmerged paths.
- 72 commits total (1 corrective restore + 71 per-file integrations).
