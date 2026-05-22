# Tag Hierarchy Baseline Audit — v1.37.1c

Generated: 2026-04-29T06:15:03.011Z
In-scope corpus: upstream/v1.37.1 file set

## Level 1 — Agents

**Canonical tag:** `<persona>`
**Files scanned:** 31
**OK:** 17 | **Anomalies:** 14 (missing: 0, wrong-level: 0, multiple: 14)

| File | Found Tag(s) | Expected | Status |
|------|-------------|----------|--------|
| agents/gsd-advisor-researcher.md | task, persona | persona | multiple |
| agents/gsd-ai-researcher.md | persona | persona | ok |
| agents/gsd-assumptions-analyzer.md | task, persona | persona | multiple |
| agents/gsd-code-fixer.md | task, persona | persona | multiple |
| agents/gsd-code-reviewer.md | task, persona | persona | multiple |
| agents/gsd-codebase-mapper.md | persona | persona | ok |
| agents/gsd-debug-session-manager.md | persona | persona | ok |
| agents/gsd-debugger.md | persona | persona | ok |
| agents/gsd-doc-verifier.md | task, persona | persona | multiple |
| agents/gsd-doc-writer.md | task, persona | persona | multiple |
| agents/gsd-domain-researcher.md | persona | persona | ok |
| agents/gsd-eval-auditor.md | persona | persona | ok |
| agents/gsd-eval-planner.md | persona | persona | ok |
| agents/gsd-executor.md | persona | persona | ok |
| agents/gsd-framework-selector.md | persona | persona | ok |
| agents/gsd-integration-checker.md | task, persona | persona | multiple |
| agents/gsd-intel-updater.md | persona | persona | ok |
| agents/gsd-nyquist-auditor.md | task, persona | persona | multiple |
| agents/gsd-pattern-mapper.md | persona | persona | ok |
| agents/gsd-phase-researcher.md | persona | persona | ok |
| agents/gsd-plan-checker.md | persona | persona | ok |
| agents/gsd-planner.md | persona | persona | ok |
| agents/gsd-project-researcher.md | task, persona | persona | multiple |
| agents/gsd-research-synthesizer.md | persona | persona | ok |
| agents/gsd-roadmapper.md | task, persona | persona | multiple |
| agents/gsd-security-auditor.md | task, persona | persona | multiple |
| agents/gsd-ui-auditor.md | task, persona | persona | multiple |
| agents/gsd-ui-checker.md | persona | persona | ok |
| agents/gsd-ui-researcher.md | task, persona | persona | multiple |
| agents/gsd-user-profiler.md | task, persona | persona | multiple |
| agents/gsd-verifier.md | persona | persona | ok |

## Level 2 — Commands

**Canonical tag:** `<intent>`
**Files scanned:** 79
**OK:** 78 | **Anomalies:** 1 (missing: 1, wrong-level: 0, multiple: 0)

| File | Found Tag(s) | Expected | Status |
|------|-------------|----------|--------|
| commands/gsd/add-backlog.md | intent | intent | ok |
| commands/gsd/add-phase.md | intent | intent | ok |
| commands/gsd/add-tests.md | intent | intent | ok |
| commands/gsd/add-todo.md | intent | intent | ok |
| commands/gsd/ai-integration-phase.md | intent | intent | ok |
| commands/gsd/analyze-dependencies.md | intent | intent | ok |
| commands/gsd/audit-fix.md | intent | intent | ok |
| commands/gsd/audit-milestone.md | intent | intent | ok |
| commands/gsd/audit-uat.md | intent | intent | ok |
| commands/gsd/autonomous.md | intent | intent | ok |
| commands/gsd/check-todos.md | intent | intent | ok |
| commands/gsd/cleanup.md | intent | intent | ok |
| commands/gsd/code-review-fix.md | intent | intent | ok |
| commands/gsd/code-review.md | intent | intent | ok |
| commands/gsd/complete-milestone.md | intent | intent | ok |
| commands/gsd/debug.md | intent | intent | ok |
| commands/gsd/discuss-phase.md | intent | intent | ok |
| commands/gsd/do.md | intent | intent | ok |
| commands/gsd/docs-update.md | intent | intent | ok |
| commands/gsd/eval-review.md | intent | intent | ok |
| commands/gsd/execute-phase.md | intent | intent | ok |
| commands/gsd/explore.md | intent | intent | ok |
| commands/gsd/extract_learnings.md | intent | intent | ok |
| commands/gsd/fast.md | intent | intent | ok |
| commands/gsd/forensics.md | intent | intent | ok |
| commands/gsd/from-gsd2.md | intent | intent | ok |
| commands/gsd/graphify.md | none | intent | missing |
| commands/gsd/health.md | intent | intent | ok |
| commands/gsd/help.md | intent | intent | ok |
| commands/gsd/import.md | intent | intent | ok |
| commands/gsd/inbox.md | intent | intent | ok |
| commands/gsd/insert-phase.md | intent | intent | ok |
| commands/gsd/intel.md | intent | intent | ok |
| commands/gsd/join-discord.md | intent | intent | ok |
| commands/gsd/list-phase-assumptions.md | intent | intent | ok |
| commands/gsd/list-workspaces.md | intent | intent | ok |
| commands/gsd/manager.md | intent | intent | ok |
| commands/gsd/map-codebase.md | intent | intent | ok |
| commands/gsd/milestone-summary.md | intent | intent | ok |
| commands/gsd/new-milestone.md | intent | intent | ok |
| commands/gsd/new-project.md | intent | intent | ok |
| commands/gsd/new-workspace.md | intent | intent | ok |
| commands/gsd/next.md | intent | intent | ok |
| commands/gsd/note.md | intent | intent | ok |
| commands/gsd/pause-work.md | intent | intent | ok |
| commands/gsd/plan-milestone-gaps.md | intent | intent | ok |
| commands/gsd/plan-phase.md | intent | intent | ok |
| commands/gsd/plant-seed.md | intent | intent | ok |
| commands/gsd/pr-branch.md | intent | intent | ok |
| commands/gsd/profile-user.md | intent | intent | ok |
| commands/gsd/progress.md | intent | intent | ok |
| commands/gsd/quick.md | intent | intent | ok |
| commands/gsd/reapply-patches.md | intent | intent | ok |
| commands/gsd/remove-phase.md | intent | intent | ok |
| commands/gsd/remove-workspace.md | intent | intent | ok |
| commands/gsd/research-phase.md | intent | intent | ok |
| commands/gsd/resume-work.md | intent | intent | ok |
| commands/gsd/review-backlog.md | intent | intent | ok |
| commands/gsd/review.md | intent | intent | ok |
| commands/gsd/scan.md | intent | intent | ok |
| commands/gsd/secure-phase.md | intent | intent | ok |
| commands/gsd/session-report.md | intent | intent | ok |
| commands/gsd/set-profile.md | intent | intent | ok |
| commands/gsd/settings.md | intent | intent | ok |
| commands/gsd/ship.md | intent | intent | ok |
| commands/gsd/sketch-wrap-up.md | intent | intent | ok |
| commands/gsd/sketch.md | intent | intent | ok |
| commands/gsd/spec-phase.md | intent | intent | ok |
| commands/gsd/spike-wrap-up.md | intent | intent | ok |
| commands/gsd/spike.md | intent | intent | ok |
| commands/gsd/stats.md | intent | intent | ok |
| commands/gsd/thread.md | intent | intent | ok |
| commands/gsd/ui-phase.md | intent | intent | ok |
| commands/gsd/ui-review.md | intent | intent | ok |
| commands/gsd/undo.md | intent | intent | ok |
| commands/gsd/update.md | intent | intent | ok |
| commands/gsd/validate-phase.md | intent | intent | ok |
| commands/gsd/verify-work.md | intent | intent | ok |
| commands/gsd/workstreams.md | intent | intent | ok |

## Level 3 — Workflows

**Canonical tag:** `<objective>`
**Files scanned:** 80
**OK:** 0 | **Anomalies:** 80 (missing: 0, wrong-level: 60, multiple: 20)

| File | Found Tag(s) | Expected | Status |
|------|-------------|----------|--------|
| get-shit-done/workflows/add-phase.md | purpose | objective | wrong-level |
| get-shit-done/workflows/add-tests.md | task | objective | wrong-level |
| get-shit-done/workflows/add-todo.md | task | objective | wrong-level |
| get-shit-done/workflows/ai-integration-phase.md | purpose | objective | wrong-level |
| get-shit-done/workflows/analyze-dependencies.md | task, purpose | objective | multiple |
| get-shit-done/workflows/audit-fix.md | task, purpose | objective | multiple |
| get-shit-done/workflows/audit-milestone.md | purpose | objective | wrong-level |
| get-shit-done/workflows/audit-uat.md | task, purpose | objective | multiple |
| get-shit-done/workflows/autonomous.md | purpose | objective | wrong-level |
| get-shit-done/workflows/check-todos.md | task | objective | wrong-level |
| get-shit-done/workflows/cleanup.md | task | objective | wrong-level |
| get-shit-done/workflows/code-review-fix.md | task, purpose | objective | multiple |
| get-shit-done/workflows/code-review.md | task, purpose | objective | multiple |
| get-shit-done/workflows/complete-milestone.md | purpose | objective | wrong-level |
| get-shit-done/workflows/debug.md | task | objective | wrong-level |
| get-shit-done/workflows/diagnose-issues.md | task, persona | objective | multiple |
| get-shit-done/workflows/discovery-phase.md | task | objective | wrong-level |
| get-shit-done/workflows/discuss-phase-assumptions.md | task, purpose | objective | multiple |
| get-shit-done/workflows/discuss-phase-power.md | task, purpose | objective | multiple |
| get-shit-done/workflows/discuss-phase.md | purpose | objective | wrong-level |
| get-shit-done/workflows/do.md | purpose | objective | wrong-level |
| get-shit-done/workflows/docs-update.md | task, purpose | objective | multiple |
| get-shit-done/workflows/eval-review.md | purpose | objective | wrong-level |
| get-shit-done/workflows/execute-phase.md | purpose | objective | wrong-level |
| get-shit-done/workflows/execute-plan.md | purpose | objective | wrong-level |
| get-shit-done/workflows/explore.md | task, purpose | objective | multiple |
| get-shit-done/workflows/extract_learnings.md | purpose, objective | objective | multiple |
| get-shit-done/workflows/fast.md | task | objective | wrong-level |
| get-shit-done/workflows/forensics.md | task | objective | wrong-level |
| get-shit-done/workflows/health.md | task | objective | wrong-level |
| get-shit-done/workflows/help.md | task | objective | wrong-level |
| get-shit-done/workflows/import.md | task | objective | wrong-level |
| get-shit-done/workflows/inbox.md | task, purpose | objective | multiple |
| get-shit-done/workflows/insert-phase.md | purpose | objective | wrong-level |
| get-shit-done/workflows/join-discord.md | purpose | objective | wrong-level |
| get-shit-done/workflows/list-phase-assumptions.md | task | objective | wrong-level |
| get-shit-done/workflows/list-workspaces.md | task, purpose | objective | multiple |
| get-shit-done/workflows/manager.md | task, purpose | objective | multiple |
| get-shit-done/workflows/map-codebase.md | purpose | objective | wrong-level |
| get-shit-done/workflows/milestone-summary.md | task | objective | wrong-level |
| get-shit-done/workflows/new-milestone.md | purpose | objective | wrong-level |
| get-shit-done/workflows/new-project.md | purpose | objective | wrong-level |
| get-shit-done/workflows/new-workspace.md | task, purpose | objective | multiple |
| get-shit-done/workflows/next.md | purpose | objective | wrong-level |
| get-shit-done/workflows/node-repair.md | task | objective | wrong-level |
| get-shit-done/workflows/note.md | task | objective | wrong-level |
| get-shit-done/workflows/pause-work.md | purpose | objective | wrong-level |
| get-shit-done/workflows/plan-milestone-gaps.md | purpose | objective | wrong-level |
| get-shit-done/workflows/plan-phase.md | purpose | objective | wrong-level |
| get-shit-done/workflows/plant-seed.md | purpose | objective | wrong-level |
| get-shit-done/workflows/pr-branch.md | task | objective | wrong-level |
| get-shit-done/workflows/profile-user.md | purpose | objective | wrong-level |
| get-shit-done/workflows/progress.md | purpose | objective | wrong-level |
| get-shit-done/workflows/quick.md | purpose | objective | wrong-level |
| get-shit-done/workflows/reapply-patches.md | task, persona | objective | multiple |
| get-shit-done/workflows/remove-phase.md | purpose | objective | wrong-level |
| get-shit-done/workflows/remove-workspace.md | task, purpose | objective | multiple |
| get-shit-done/workflows/research-phase.md | task | objective | wrong-level |
| get-shit-done/workflows/resume-project.md | purpose | objective | wrong-level |
| get-shit-done/workflows/review.md | task | objective | wrong-level |
| get-shit-done/workflows/scan.md | task, purpose | objective | multiple |
| get-shit-done/workflows/secure-phase.md | task, purpose | objective | multiple |
| get-shit-done/workflows/session-report.md | task | objective | wrong-level |
| get-shit-done/workflows/set-profile.md | task | objective | wrong-level |
| get-shit-done/workflows/settings.md | purpose | objective | wrong-level |
| get-shit-done/workflows/ship.md | task | objective | wrong-level |
| get-shit-done/workflows/sketch-wrap-up.md | purpose | objective | wrong-level |
| get-shit-done/workflows/sketch.md | purpose | objective | wrong-level |
| get-shit-done/workflows/spec-phase.md | purpose | objective | wrong-level |
| get-shit-done/workflows/spike-wrap-up.md | purpose | objective | wrong-level |
| get-shit-done/workflows/spike.md | purpose | objective | wrong-level |
| get-shit-done/workflows/stats.md | task | objective | wrong-level |
| get-shit-done/workflows/transition.md | purpose | objective | wrong-level |
| get-shit-done/workflows/ui-phase.md | task | objective | wrong-level |
| get-shit-done/workflows/ui-review.md | task | objective | wrong-level |
| get-shit-done/workflows/undo.md | task, purpose | objective | multiple |
| get-shit-done/workflows/update.md | task | objective | wrong-level |
| get-shit-done/workflows/validate-phase.md | task | objective | wrong-level |
| get-shit-done/workflows/verify-phase.md | purpose | objective | wrong-level |
| get-shit-done/workflows/verify-work.md | purpose | objective | wrong-level |

## Level 4a — Templates

**Canonical tag:** `<task>`
**Files scanned:** 32
**OK:** 0 | **Anomalies:** 32 (missing: 31, wrong-level: 1, multiple: 0)

| File | Found Tag(s) | Expected | Status |
|------|-------------|----------|--------|
| get-shit-done/templates/AI-SPEC.md | none | task | missing |
| get-shit-done/templates/DEBUG.md | none | task | missing |
| get-shit-done/templates/SECURITY.md | none | task | missing |
| get-shit-done/templates/UAT.md | none | task | missing |
| get-shit-done/templates/UI-SPEC.md | none | task | missing |
| get-shit-done/templates/VALIDATION.md | none | task | missing |
| get-shit-done/templates/claude-md.md | none | task | missing |
| get-shit-done/templates/context.md | none | task | missing |
| get-shit-done/templates/continue-here.md | none | task | missing |
| get-shit-done/templates/copilot-instructions.md | none | task | missing |
| get-shit-done/templates/debug-subagent-prompt.md | none | task | missing |
| get-shit-done/templates/dev-preferences.md | none | task | missing |
| get-shit-done/templates/discovery.md | none | task | missing |
| get-shit-done/templates/discussion-log.md | none | task | missing |
| get-shit-done/templates/milestone-archive.md | none | task | missing |
| get-shit-done/templates/milestone.md | none | task | missing |
| get-shit-done/templates/phase-prompt.md | none | task | missing |
| get-shit-done/templates/planner-subagent-prompt.md | none | task | missing |
| get-shit-done/templates/project.md | none | task | missing |
| get-shit-done/templates/requirements.md | none | task | missing |
| get-shit-done/templates/research.md | none | task | missing |
| get-shit-done/templates/retrospective.md | none | task | missing |
| get-shit-done/templates/roadmap.md | none | task | missing |
| get-shit-done/templates/spec.md | none | task | missing |
| get-shit-done/templates/state.md | purpose | task | wrong-level |
| get-shit-done/templates/summary-complex.md | none | task | missing |
| get-shit-done/templates/summary-minimal.md | none | task | missing |
| get-shit-done/templates/summary-standard.md | none | task | missing |
| get-shit-done/templates/summary.md | none | task | missing |
| get-shit-done/templates/user-profile.md | none | task | missing |
| get-shit-done/templates/user-setup.md | none | task | missing |
| get-shit-done/templates/verification-report.md | none | task | missing |

## Level 4b — References

**Canonical tag:** `<task>`
**Files scanned:** 48
**OK:** 29 | **Anomalies:** 19 (missing: 19, wrong-level: 0, multiple: 0)

| File | Found Tag(s) | Expected | Status |
|------|-------------|----------|--------|
| get-shit-done/references/agent-contracts.md | task | task | ok |
| get-shit-done/references/ai-evals.md | none | task | missing |
| get-shit-done/references/ai-frameworks.md | none | task | missing |
| get-shit-done/references/artifact-types.md | task | task | ok |
| get-shit-done/references/autonomous-smart-discuss.md | none | task | missing |
| get-shit-done/references/checkpoints.md | task | task | ok |
| get-shit-done/references/common-bug-patterns.md | task | task | ok |
| get-shit-done/references/context-budget.md | task | task | ok |
| get-shit-done/references/continuation-format.md | none | task | missing |
| get-shit-done/references/debugger-philosophy.md | none | task | missing |
| get-shit-done/references/decimal-phase-calculation.md | task | task | ok |
| get-shit-done/references/domain-probes.md | task | task | ok |
| get-shit-done/references/executor-examples.md | none | task | missing |
| get-shit-done/references/gate-prompts.md | task | task | ok |
| get-shit-done/references/gates.md | none | task | missing |
| get-shit-done/references/git-integration.md | task | task | ok |
| get-shit-done/references/git-planning-commit.md | none | task | missing |
| get-shit-done/references/ios-scaffold.md | none | task | missing |
| get-shit-done/references/mandatory-initial-read.md | none | task | missing |
| get-shit-done/references/model-profile-resolution.md | task | task | ok |
| get-shit-done/references/model-profiles.md | task | task | ok |
| get-shit-done/references/phase-argument-parsing.md | none | task | missing |
| get-shit-done/references/planner-antipatterns.md | none | task | missing |
| get-shit-done/references/planner-gap-closure.md | task | task | ok |
| get-shit-done/references/planner-reviews.md | task | task | ok |
| get-shit-done/references/planner-revision.md | task | task | ok |
| get-shit-done/references/planner-source-audit.md | none | task | missing |
| get-shit-done/references/planning-config.md | none | task | missing |
| get-shit-done/references/project-skills-discovery.md | none | task | missing |
| get-shit-done/references/questioning.md | task | task | ok |
| get-shit-done/references/revision-loop.md | task | task | ok |
| get-shit-done/references/sketch-interactivity.md | none | task | missing |
| get-shit-done/references/sketch-theme-system.md | none | task | missing |
| get-shit-done/references/sketch-tooling.md | none | task | missing |
| get-shit-done/references/sketch-variant-patterns.md | none | task | missing |
| get-shit-done/references/tdd.md | task | task | ok |
| get-shit-done/references/thinking-models-debug.md | task | task | ok |
| get-shit-done/references/thinking-models-execution.md | task | task | ok |
| get-shit-done/references/thinking-models-planning.md | task | task | ok |
| get-shit-done/references/thinking-models-research.md | task | task | ok |
| get-shit-done/references/thinking-models-verification.md | task | task | ok |
| get-shit-done/references/thinking-partner.md | task | task | ok |
| get-shit-done/references/ui-brand.md | task | task | ok |
| get-shit-done/references/universal-anti-patterns.md | task | task | ok |
| get-shit-done/references/user-profiling.md | task | task | ok |
| get-shit-done/references/verification-overrides.md | task | task | ok |
| get-shit-done/references/verification-patterns.md | task | task | ok |
| get-shit-done/references/workstream-flag.md | task | task | ok |
