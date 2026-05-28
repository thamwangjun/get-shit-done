# Features Research: Current Reference Map

**Audit date:** 2026-05-28
**Scope:** `commands/gsd/`, `get-shit-done/workflows/`, `agents/`, `get-shit-done/references/`

---

## Summary

- `@` references: **107 total** across **4 layers** (5 in commands, 57 in workflows, 42 in agents, 3 in references)
- `` !`<cmd>` `` references: **117 total**, **entirely in commands/gsd/** (0 in workflows, agents, or references)
- Unique `@` target files: **62** (49 references/, 5 templates/, 7 workflows/, 1 agent)
- Unique `` !`cat` `` static target files: **90** (66 workflows, 19 references, 4 templates)
- Dynamic `.planning/` references via shell injection: **2** (both in `add-tests.md`)

The split is clean by layer: `commands/gsd/` was converted wholesale to `` !`cat $HOME/.claude/...` `` notation (task 260525-o1n, 117 occurrences, 55 files), while `workflows/`, `agents/`, and `references/` use `@` notation exclusively. Four command files were **not** converted and remain on `@` notation. Three command files have **mixed notation** (both `@` and `` !`cat` `` in the same file).

---

## Reference Inventory

### commands/gsd/ — `` !`cat` `` notation (post-conversion)

55 of 67 command files use `` !`cat` ``. All references point to `$HOME/.claude/...` paths.

| File | `` !`cat` `` targets |
|------|---------------------|
| add-tests.md | workflows/add-tests.md, .planning/STATE.md, .planning/ROADMAP.md |
| ai-integration-phase.md | workflows/ai-integration-phase.md, references/ai-frameworks.md, references/ai-evals.md |
| audit-fix.md | workflows/audit-fix.md |
| audit-milestone.md | workflows/audit-milestone.md |
| audit-uat.md | workflows/audit-uat.md |
| autonomous.md | workflows/autonomous.md, references/ui-brand.md |
| capture.md | workflows/add-todo.md, workflows/note.md, workflows/add-backlog.md, workflows/plant-seed.md, workflows/check-todos.md, references/ui-brand.md |
| cleanup.md | workflows/cleanup.md |
| code-review.md | workflows/code-review.md |
| config.md | workflows/settings.md, workflows/settings-advanced.md, workflows/settings-integrations.md |
| debug.md | workflows/debug.md |
| docs-update.md | workflows/docs-update.md |
| eval-review.md | workflows/eval-review.md, references/ai-evals.md |
| execute-phase.md | workflows/execute-phase.md, references/ui-brand.md |
| explore.md | workflows/explore.md |
| extract-learnings.md | workflows/extract-learnings.md **(MIXED — also has `@`)** |
| fast.md | workflows/fast.md |
| forensics.md | workflows/forensics.md |
| health.md | workflows/health.md |
| help.md | workflows/help.md |
| import.md | workflows/import.md, references/ui-brand.md, references/gate-prompts.md, references/doc-conflict-engine.md |
| inbox.md | workflows/inbox.md |
| ingest-docs.md | workflows/ingest-docs.md, references/ui-brand.md, references/gate-prompts.md, references/doc-conflict-engine.md |
| manager.md | workflows/manager.md, references/ui-brand.md |
| map-codebase.md | workflows/map-codebase.md |
| milestone-summary.md | workflows/milestone-summary.md |
| mvp-phase.md | workflows/mvp-phase.md, references/spidr-splitting.md, references/user-story-template.md **(MIXED — also has `@`)** |
| new-milestone.md | workflows/new-milestone.md, references/questioning.md, references/ui-brand.md, templates/project.md, templates/requirements.md |
| new-project.md | workflows/new-project.md, references/questioning.md, references/ui-brand.md, templates/project.md, templates/requirements.md |
| pause-work.md | workflows/pause-work.md |
| phase.md | workflows/add-phase.md, workflows/insert-phase.md, workflows/remove-phase.md, workflows/edit-phase.md |
| plan-phase.md | workflows/plan-phase.md, references/ui-brand.md |
| plan-review-convergence.md | workflows/plan-review-convergence.md, references/revision-loop.md, references/gates.md, references/agent-contracts.md |
| pr-branch.md | workflows/pr-branch.md |
| profile-user.md | workflows/profile-user.md, references/ui-brand.md |
| progress.md | workflows/progress.md, workflows/next.md, workflows/do.md, references/ui-brand.md |
| quick.md | workflows/quick.md |
| resume-work.md | workflows/resume-project.md |
| review.md | workflows/review.md |
| secure-phase.md | workflows/secure-phase.md |
| settings.md | workflows/settings.md |
| ship.md | workflows/ship.md **(MIXED — also has `@`)** |
| sketch.md | workflows/sketch.md, workflows/sketch-wrap-up.md, references/ui-brand.md, references/sketch-theme-system.md, references/sketch-interactivity.md, references/sketch-tooling.md, references/sketch-variant-patterns.md |
| spec-phase.md | workflows/spec-phase.md, templates/spec.md |
| spike.md | workflows/spike.md, workflows/spike-wrap-up.md, references/ui-brand.md |
| stats.md | workflows/stats.md |
| thread.md | workflows/thread.md |
| ui-phase.md | workflows/ui-phase.md, references/ui-brand.md |
| ui-review.md | workflows/ui-review.md, references/ui-brand.md |
| ultraplan-phase.md | workflows/ultraplan-phase.md, references/ui-brand.md |
| undo.md | workflows/undo.md, references/ui-brand.md, references/gate-prompts.md |
| update.md | workflows/update.md, workflows/sync-skills.md, workflows/reapply-patches.md |
| validate-phase.md | workflows/validate-phase.md |
| verify-work.md | workflows/verify-work.md, templates/UAT.md |
| workspace.md | workflows/new-workspace.md, workflows/list-workspaces.md, workflows/remove-workspace.md, references/ui-brand.md |

**Commands NOT converted — still use `@` notation (4 files):**

| File | Notation | `@` targets |
|------|----------|-------------|
| complete-milestone.md | `@` only | workflows/complete-milestone.md, templates/milestone-archive.md |
| extract-learnings.md | MIXED | workflows/extract-learnings.md (both `@` line 23 and `` !`cat` `` line 20) |
| mvp-phase.md | MIXED | workflows/mvp-phase.md (both `@` line 43 and `` !`cat` `` line 27) |
| ship.md | MIXED | workflows/ship.md (both `@` line 24 and `` !`cat` `` line 21) |

The three mixed files each reference the **same workflow** via both notations simultaneously — the `@` reference is a narrative sentence ("Execute X from @~/.claude/...") while the `` !`cat` `` line injects the workflow content. This means the workflow file is mentioned twice, which is redundant and likely unintentional.

---

### get-shit-done/workflows/ — `@` notation only (57 occurrences, 20 files)

| File | `@` targets |
|------|-------------|
| ai-integration-phase.md | references/ai-frameworks.md, references/ai-evals.md |
| discuss-phase.md | references/domain-probes.md, references/gate-prompts.md, references/universal-anti-patterns.md; inline body prose: references/scout-codebase.md |
| discuss-phase/modes/advisor.md | agents/gsd-advisor-researcher.md (unusual — agent file, not a reference fragment) |
| discuss-phase/modes/power.md | workflows/discuss-phase-power.md |
| eval-review.md | references/ai-evals.md |
| execute-phase.md | references/agent-contracts.md, references/context-budget.md, references/gates.md, workflows/execute-plan.md, templates/summary.md, references/checkpoints.md, references/tdd.md, references/worktree-path-safety.md, references/executor-examples.md (conditional) |
| execute-plan.md | references/git-integration.md |
| explore.md | references/questioning.md, references/domain-probes.md |
| mvp-phase.md | references/user-story-template.md, references/spidr-splitting.md, references/planner-mvp-mode.md, references/phase-argument-parsing.md (inline) |
| plan-phase.md | references/ui-brand.md, references/revision-loop.md, references/gate-prompts.md, references/agent-contracts.md, references/gates.md, references/tdd.md (x2), references/skeleton-template.md, references/planner-mvp-mode.md (x2) |
| resume-project.md | references/continuation-format.md |
| secure-phase.md | references/ui-brand.md |
| sketch.md | references/sketch-theme-system.md, references/sketch-variant-patterns.md, references/sketch-interactivity.md, references/sketch-tooling.md |
| transition.md | workflows/graduation.md |
| ui-phase.md | references/ui-brand.md |
| ui-review.md | references/ui-brand.md |
| undo.md | references/ui-brand.md, references/gate-prompts.md |
| validate-phase.md | references/ui-brand.md |
| verify-phase.md | references/verification-patterns.md, templates/verification-report.md |
| verify-work.md | templates/UAT.md, references/verify-mvp-mode.md (inline), workflows/diagnose-issues.md |

---

### agents/ — `@` notation only (42 occurrences, 7 files)

| File | `@` targets |
|------|-------------|
| gsd-debugger.md | references/mandatory-initial-read.md, references/common-bug-patterns.md (x2), references/project-skills-discovery.md, references/debugger-philosophy.md, references/thinking-models-debug.md |
| gsd-executor.md | references/mandatory-initial-read.md, references/project-skills-discovery.md, references/thinking-models-execution.md, references/ios-scaffold.md, references/executor-examples.md, references/checkpoints.md, references/execute-mvp-tdd.md, templates/summary.md |
| gsd-phase-researcher.md | references/mandatory-initial-read.md, references/project-skills-discovery.md, references/thinking-models-research.md |
| gsd-plan-checker.md | references/gates.md, references/thinking-models-planning.md, references/few-shot-examples/plan-checker.md |
| gsd-planner.md | references/mandatory-initial-read.md, references/project-skills-discovery.md, references/planner-source-audit.md (x2), references/planner-antipatterns.md (x2), references/tdd.md, references/planner-mvp-mode.md (x2), references/user-story-template.md, references/skeleton-template.md, workflows/execute-plan.md, templates/summary.md, references/thinking-models-planning.md, references/planner-chunked.md |
| gsd-user-profiler.md | references/user-profiling.md |
| gsd-verifier.md | references/mandatory-initial-read.md, references/verification-overrides.md, references/gates.md, references/project-skills-discovery.md, references/thinking-models-verification.md, references/few-shot-examples/verifier.md, references/verify-mvp-mode.md |

---

### get-shit-done/references/ — `@` notation, cross-references only (3 occurrences, 3 files)

| File | `@` target | Nature |
|------|------------|--------|
| model-profile-resolution.md | references/model-profiles.md | Load directive to sibling file |
| planner-mvp-mode.md | references/skeleton-template.md | Inline prose reference to sibling file |
| verification-patterns.md | references/checkpoints.md | Bold-text inline mention (not a load directive) |

---

## Shared Fragments Inventory

63 total files in `get-shit-done/references/` (including `few-shot-examples/` subdir with 2 files).

| Fragment | Referenced By | Status |
|----------|--------------|--------|
| agent-contracts.md | workflows/plan-phase, commands/plan-review-convergence | Active |
| ai-evals.md | workflows/ai-integration-phase + eval-review, commands/ai-integration-phase + eval-review | Active |
| ai-frameworks.md | workflows/ai-integration-phase, commands/ai-integration-phase | Active |
| artifact-types.md | — | **UNREFERENCED** |
| autonomous-smart-discuss.md | — | Unreferenced via path (may be loaded by prose) |
| checkpoints.md | workflows/execute-phase, agents/gsd-executor, references/verification-patterns (inline mention) | Active |
| common-bug-patterns.md | agents/gsd-debugger (x2) | Active |
| context-budget.md | workflows/execute-phase | Active |
| continuation-format.md | workflows/resume-project | Active |
| debugger-philosophy.md | agents/gsd-debugger | Active |
| decimal-phase-calculation.md | — | **UNREFERENCED** |
| doc-conflict-engine.md | commands/import + ingest-docs | Active |
| domain-probes.md | workflows/discuss-phase + explore | Active |
| execute-mvp-tdd.md | agents/gsd-executor | Active |
| executor-examples.md | workflows/execute-phase (conditional), agents/gsd-executor | Active |
| few-shot-examples/plan-checker.md | agents/gsd-plan-checker | Active |
| few-shot-examples/verifier.md | agents/gsd-verifier | Active |
| gate-prompts.md | workflows/discuss-phase + plan-phase + undo, commands/import + ingest-docs + undo | Active |
| gates.md | workflows/execute-phase + plan-phase, agents/gsd-plan-checker + gsd-verifier, commands/plan-review-convergence | Active |
| git-integration.md | workflows/execute-plan | Active |
| git-planning-commit.md | — | **UNREFERENCED** |
| ios-scaffold.md | agents/gsd-executor | Active |
| mandatory-initial-read.md | agents/gsd-debugger + gsd-executor + gsd-phase-researcher + gsd-planner + gsd-verifier (5 agents) | Active |
| model-profile-resolution.md | Only from within references/ itself | Effectively unreferenced from outside |
| model-profiles.md | references/model-profile-resolution.md | Active (indirect only) |
| mvp-concepts.md | — | Unreferenced via path (may be loaded by prose) |
| phase-argument-parsing.md | workflows/mvp-phase (inline prose) | Active |
| planner-antipatterns.md | workflows/execute-phase (inline), agents/gsd-planner (x2) | Active |
| planner-chunked.md | agents/gsd-planner | Active |
| planner-gap-closure.md | — | Unreferenced via path (may be loaded by prose) |
| planner-graphify-auto-update.md | — | **UNREFERENCED** |
| planner-human-verify-mode.md | — | **UNREFERENCED** |
| planner-interface-context.md | — | Unreferenced via path (may be loaded by prose) |
| planner-mvp-mode.md | workflows/plan-phase (x2) + mvp-phase, agents/gsd-planner (x2), references/planner-mvp-mode (self-ref) | Active |
| planner-reviews.md | — | Unreferenced via path (may be loaded by prose) |
| planner-revision.md | — | Unreferenced via path (may be loaded by prose) |
| planner-source-audit.md | agents/gsd-planner (x2) | Active |
| planning-config.md | — | **UNREFERENCED** |
| project-skills-discovery.md | agents/gsd-debugger + gsd-executor + gsd-phase-researcher + gsd-planner + gsd-verifier (5 agents) | Active |
| questioning.md | workflows/explore, commands/new-milestone + new-project | Active |
| revision-loop.md | workflows/plan-phase, commands/plan-review-convergence | Active |
| scout-codebase.md | workflows/discuss-phase (inline prose) | Active |
| skeleton-template.md | workflows/plan-phase (inline), agents/gsd-planner, references/planner-mvp-mode | Active |
| sketch-interactivity.md | workflows/sketch, commands/sketch | Active |
| sketch-theme-system.md | workflows/sketch, commands/sketch | Active |
| sketch-tooling.md | workflows/sketch, commands/sketch | Active |
| sketch-variant-patterns.md | workflows/sketch, commands/sketch | Active |
| spidr-splitting.md | workflows/mvp-phase, commands/mvp-phase | Active |
| tdd.md | workflows/execute-phase + plan-phase (x2), agents/gsd-planner | Active |
| thinking-models-debug.md | agents/gsd-debugger | Active |
| thinking-models-execution.md | agents/gsd-executor | Active |
| thinking-models-planning.md | agents/gsd-plan-checker + gsd-planner | Active |
| thinking-models-research.md | agents/gsd-phase-researcher | Active |
| thinking-models-verification.md | agents/gsd-verifier | Active |
| thinking-partner.md | — | Unreferenced via path (may be loaded by prose) |
| ui-brand.md | 18 `` !`cat` `` in commands + 7 `@` in workflows = **most-referenced fragment** | Active |
| universal-anti-patterns.md | workflows/discuss-phase | Active |
| user-profiling.md | agents/gsd-user-profiler | Active |
| user-story-template.md | workflows/mvp-phase (x2), agents/gsd-planner, commands/mvp-phase | Active |
| verification-overrides.md | agents/gsd-verifier | Active |
| verification-patterns.md | workflows/verify-phase | Active |
| verify-mvp-mode.md | workflows/verify-work (inline), agents/gsd-verifier | Active |
| workstream-flag.md | — | **UNREFERENCED** |
| worktree-path-safety.md | workflows/execute-phase | Active |

**Confirmed unreferenced via path-based grep (6 files):**
`artifact-types.md`, `decimal-phase-calculation.md`, `git-planning-commit.md`, `planner-graphify-auto-update.md`, `planner-human-verify-mode.md`, `planning-config.md`, `workstream-flag.md`

`model-profile-resolution.md` is only referenced from within `references/` itself (by `model-profiles.md` as its cross-reference), making it unreachable from any workflow, agent, or command.

---

## Static vs Dynamic Analysis

### Truly Static — safe to inline at install time

All 55 active `references/` fragment files contain fixed instructional prose with no runtime interpolation. A template engine can inline these at install time without loss of correctness. Both `@` and `` !`cat` `` produce identical results for this category.

All `templates/` files (project.md, requirements.md, spec.md, UAT.md, summary.md, verification-report.md, milestone-archive.md) are static boilerplate. Content is agent-filled after loading, not by the reference mechanism itself.

Workflow files referenced via `` !`cat` `` from commands (66 unique workflow targets) are static install-time files. They contain no runtime variable substitution at the point of injection by the command.

### Dynamic — must NOT be inlined at install time

**`.planning/STATE.md` and `.planning/ROADMAP.md`** (`commands/gsd/add-tests.md` lines 35-36):

```
!`cat .planning/STATE.md`
!`cat .planning/ROADMAP.md`
```

These are project-specific files that change per-project and per-session. They must remain as runtime shell executions. A template engine must exclude these from any install-time inlining pass and preserve the shell injection form.

**Conditional `@` reference** (`get-shit-done/workflows/execute-phase.md` line 619):

```
${CONTEXT_WINDOW < 200000 ? '' : '@~/.claude/get-shit-done/references/executor-examples.md'}
```

This is a JavaScript template-literal expression inside a workflow prompt string. The `@` reference is conditionally included based on `CONTEXT_WINDOW` resolved at workflow execution time. This is the only conditional `@` reference in the entire codebase. A template engine cannot inline this at install time; the JavaScript conditional expression must be preserved as-is, or the template engine must implement conditional include syntax.

**Agent file reference in a spawn prompt** (`get-shit-done/workflows/discuss-phase/modes/advisor.md`):

```
prompt="First, read @~/.claude/agents/gsd-advisor-researcher.md for your role and instructions.
```

This `@` reference is injected into a dynamically-constructed agent spawn string. It targets an agent definition file in `agents/`, not a reference fragment. Inlining the full agent definition into the workflow prompt would be semantically wrong — the intent is for the spawned subagent to read its own role file, not for the orchestrator to load it.

---

## Coverage Gaps

### Four command files not converted from `@` notation

`complete-milestone.md` was skipped entirely by the conversion task. `extract-learnings.md`, `mvp-phase.md`, and `ship.md` were partially converted — each now has both notations for the same target workflow file. These are the files that need to be fixed in the revert-and-unify milestone.

### Mixed-notation files introduce double-load risk

In `extract-learnings.md`, `mvp-phase.md`, and `ship.md`, the workflow content file is referenced by both an `@` inline-read line and a `` !`cat` `` injection line. At runtime this causes the workflow content to appear twice in the context window, wasting tokens. These three files must have one notation removed.

### 8 unreferenced files in references/

These exist but are not reachable via any formal path reference. They are either: (a) orphaned and can be removed, or (b) loaded via prose instruction without a path (e.g., "read planner-reviews.md"). The template unification work should audit these to determine whether they need `@` or `` !`cat` `` wiring added, or whether they are dead code.

The 8 files: `artifact-types.md`, `decimal-phase-calculation.md`, `git-planning-commit.md`, `model-profile-resolution.md` (external), `planner-graphify-auto-update.md`, `planner-human-verify-mode.md`, `planning-config.md`, `workstream-flag.md`.

### No circular references detected

No file in `references/` chains through more than one level of `@` references. The three intra-references/ cross-references are all leaf references. The `model-profile-resolution.md` → `model-profiles.md` chain is two hops but the second file has no further references.
