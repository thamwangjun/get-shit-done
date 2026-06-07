# Requirements: GSD — Prompt-Engineered Fork

**Defined:** 2026-06-07
**Core Value:** Every agent, command, and workflow file on `main` meets the fork's prompt engineering quality bar before it ships

## v2.1.0-f Requirements

Requirements for the Testing Coverage Gaps milestone. Each maps to a roadmap phase.

### Effort Wiring Coverage

- [ ] **EWC-01**: Test suite asserts `audit-fix.md` contains `resolve-model-effort gsd-executor` and `executor_model_effort_arg`
- [ ] **EWC-02**: Test suite asserts `diagnose-issues.md` contains `resolve-model-effort gsd-debugger` and `debugger_model_effort_arg`
- [ ] **EWC-03**: Test suite asserts `code-review.md` contains `resolve-model-effort gsd-code-reviewer` and `code_reviewer_model_effort_arg`
- [ ] **EWC-04**: Test suite asserts `code-review-fix.md` contains `resolve-model-effort gsd-code-reviewer` and `resolve-model-effort gsd-code-fixer` and their effort args
- [ ] **EWC-05**: Test suite asserts `explore.md` contains `resolve-model-effort gsd-phase-researcher` and `phase_researcher_model_effort_arg`
- [ ] **EWC-06**: Test suite asserts `import.md` contains `resolve-model-effort gsd-plan-checker` and `plan_checker_model_effort_arg`
- [ ] **EWC-07**: Test suite asserts `ingest-docs.md` contains `resolve-model-effort gsd-doc-synthesizer` and `resolve-model-effort gsd-roadmapper` and their effort args
- [ ] **EWC-08**: Test suite asserts `discuss-phase-assumptions.md` contains `resolve-model-effort gsd-assumptions-analyzer` and `assumptions_analyzer_model_effort_arg`

### Worktree Safety Coverage

- [ ] **WSC-01**: Test suite asserts `gsd-executor.md` `<task_commit_protocol>` block contains submodule-exclusion logic distinguishing `.git/worktrees/` paths (guard fires) from submodule paths (guard skipped)

### Security Framing Coverage

- [ ] **SFC-01**: Test suite actively asserts `gsd-debugger.md` contains the fork's hardened security paragraph ("untrusted user input" and "evidence data only") — replacing the previously-skipped `DATA_START` assertion

### Rubric Inlining Coverage

- [ ] **RIC-01**: Test suite asserts `gsd-user-profiler.md` load_rubric step references the Eta-inlined rubric ("included above in the `<reference>` block")

### Documentation Cleanup

- [ ] **DOC-01**: Stale "Phase 48 RED expectation" comment (lines 18–26) removed from `tests/step-numbering-scan.test.cjs`; scanner behavior is unchanged

## Out of Scope

| Feature | Reason |
|---------|--------|
| Source file changes to agents/workflows | This milestone is test-only — no prompt content modifications |
| New test files | All additions go into existing test files |
| Closing gaps in other milestones | Only v2.1.0-e gap report items in scope |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DOC-01 | Phase 59 | Pending |
| EWC-01 – EWC-08 | Phase 60 | Pending |
| WSC-01 | Phase 61 | Pending |
| RIC-01 | Phase 62 | Pending |
| SFC-01 | Phase 63 | Pending |

**Coverage:**

- v2.1.0-f requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-07*
*Last updated: 2026-06-07 after initial definition*
