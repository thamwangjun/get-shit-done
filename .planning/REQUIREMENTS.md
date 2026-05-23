# Requirements: GSD Fork Commit History Refactoring

**Defined:** 2026-05-21
**Core Value:** Every agent, command, and workflow file on `thamw-main` meets the fork's prompt engineering quality bar before it ships — upstream content additions are modified, not accepted verbatim.

## v1 Requirements

Requirements for history consolidation and git refactoring.

### Git Operations (GITOPS)

- [x] **GITOPS-01**: Create local branch backup and physical directory backup before starting the refactor.
- [x] **GITOPS-02**: Soft reset the active branch HEAD to tag `v1.41.2` and unstage all files, preserving working directory changes.

### Staging & Commits (STAGE)

- [x] **STAGE-01**: Stage and commit Batch 1: Rules and configuration files (`CATALOGUE.json`, `mise.toml`, `.planning/config.json`, prompt engineering guidelines in `.planning/references/`).
- [x] **STAGE-02**: Stage and commit Batch 2: Scanner logic, audit scripts, and update checkers (`hooks/gsd-read-injection-scanner.js`, `scripts/audit-tags.js`, `hooks/gsd-check-update.js`).
- [x] **STAGE-03**: Stage and commit Batch 3: Workflows, agents, commands, and non-test documentation (`agents/`, `commands/gsd/`, `get-shit-done/workflows/`, root markdown files, non-test docs).
- [ ] **STAGE-04**: Stage and commit Batch 4: Core unit and integration tests and validation runner (`tests/*.test.cjs`, `scripts/run-tests.cjs`).
- [x] **STAGE-05**: Stage and commit Batch 5: Quick tasks, maintenance scripts, run logs, and metadata state files (`.planning/quick/`, `logs/`, `.planning/PROJECT.md`, `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/PROJECT_HISTORY.md`, `.planning/MILESTONES.md`, `.planning/RETROSPECTIVE.md`, codebase/critique/debug/intel/notes/research outputs, installer scripts, update workers).

### Validation (VALID)

- [ ] **VALID-01**: Run a tree diff between the consolidated HEAD and the backup branch to verify 100% byte-for-byte content parity (zero diff).
- [ ] **VALID-02**: Execute `npm test` on the final HEAD to guarantee all 8300+ assertions pass cleanly with zero regressions.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Tooling Automation

- **AUTO-01**: Build a CLI utility to automate classification and staging of files into the 5 batches based on path rules.
- **AUTO-02**: Implement a git pre-commit hook that prevents commits if they violate the zero-diff parity gate.
- **AUTO-03**: Build a warning system that alerts developers when local branch commits exceed a threshold, suggesting a refactor milestone.

## Out of Scope

Explicitly excluded to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Squashing into a single commit | Loses all logical separation of config, scanners, prompts, tests, and logs in git history. |
| Interactive rebase (`git rebase -i`) | Over 800 divergent commits make interactive rebase extremely conflict-prone and inefficient. |
| Making code or prompt content fixes | Changing file contents during history refactoring violates the zero-diff parity gate and increases risk of introducing regression bugs. Defer fixes to quick tasks or next milestones. |
| Running tests on intermediate commits | Category-based batching splits prompt logic from its tests, causing intermediate commits to have failing test suites. Test verification is gated only at the final HEAD. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| GITOPS-01   | Phase 35 | Complete |
| GITOPS-02   | Phase 35 | Complete |
| STAGE-01    | Phase 36 | Complete |
| STAGE-02    | Phase 37 | Complete |
| STAGE-03    | Phase 38 | Complete |
| STAGE-04    | Phase 39 | Pending |
| STAGE-05    | Phase 40 | Complete |
| VALID-01    | Phase 41 | Pending |
| VALID-02    | Phase 41 | Pending |

**Coverage:**
- v1 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0

---
*Requirements defined: 2026-05-21*
*Last updated: 2026-05-21 after initial definition*
