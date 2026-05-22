# Project Research Summary

**Project:** GSD — Prompt-Engineered Fork
**Domain:** Git Commit History Refactoring / Repository Maintenance
**Researched:** 2026-05-21
**Confidence:** HIGH

## Executive Summary

This research outlines the findings and plan for the **v1.41.5 Refactor Git Commit History** milestone. The core objective is to squash and reorganize the fork's commit history since tag `v1.41.2` (comprising 829 commits) into exactly 5 feature-focused commits. Experienced Git practitioners handle large-scale history consolidation using selective staging and branch pointer manipulation (specifically a soft/mixed reset) rather than interactive rebasing when commit counts are extremely high. This avoids massive, repetitive merge conflict overhead.

The recommended approach starts with establishing a dual-layer backup (a local git branch backup and a physical directory copy) to protect against any data loss. Next, a soft reset is executed to tag `v1.41.2`, keeping all modifications unstaged in the working directory. Files are then staged and committed in 5 distinct batches based on logical layers, using precise file and path targeting. Finally, a zero-diff parity audit is run against the backup branch alongside the complete Node.js test runner suite to guarantee zero functional regressions and 100% file content parity.

Key risks include accidental code loss due to destructive hard resets, staging untracked or ignored local files, classification errors (staging files in the wrong batch), and broken intermediate commit states. These are mitigated by avoiding catch-all staging commands like `git add .`, auditing each batch commit with `git show --stat`, running a final comparative diff against the original branch SHA, and executing the test runner suite to ensure all 8300+ tests pass.

## Key Findings

### Recommended Stack

The recommended stack is built on Git (v2.54.0) for history manipulation and Node.js (v24.14.1) / npm (v11.11.0) to run GSD validation gates. No external dependencies are required because the core stack is pre-installed. Local helper scripts automate test execution and tag compliance verification. Standard interactive rebasing (`git rebase -i`) is explicitly rejected because the volume of divergent commits (829) makes merge conflict resolution highly error-prone and time-consuming.

**Core technologies:**
- **Git (v2.54.0):** Version control system for history manipulation — Standard tool for managing commit histories, supporting mixed reset and selective staging options safely.
- **Node.js (v24.14.1) & npm (v11.11.0):** Runtime and package manager for tests — Required to run GSD validation gates (`npm test`) with the native test runner to guarantee functional parity.
- **Custom Scripts (Local):** Automation of tag/rules audits and test execution — Executes `scripts/run-tests.cjs` and `scripts/audit-tags.js` to verify tag compliance and test suite sanity.

### Expected Features

The primary feature set focuses on flattening 800+ commits into 5 distinct, logically grouped, and dependency-ordered commits without changing file contents or causing regressions.

**Must have (table stakes):**
- **Soft Reset to `v1.41.2`:** Moves branch HEAD back to the target upstream release tag without modifying the working tree files.
- **5-Batch Grouping:** Collects related modifications into logical, reviewable blocks.
- **Zero-Diff Content Parity:** The final commit tree must match the original tree with 100% byte-for-byte correctness.
- **Full Test Validation:** All 8300+ tests must pass to verify no regressions were introduced.
- **Coherent Commit Messages:** Each of the 5 commits needs a clear, semantic commit message.

**Should have (competitive):**
- **Dependency-Ordered Commits:** Committing files in their order of dependency (Configs -> Scanners -> Prompts -> Tests -> Logs) preserves logical readability in Git history.
- **Dry-Run Diff Audit:** Verifies the staging boundaries before making final commits using `git diff --cached --name-only`.
- **Automated Staging Script:** Prevents human error in manually staging hundreds of files across 5 complex batches.

**Defer (v2+):**
- **Automated staging CLI tool / Pre-commit validation hook:** A CLI tool or pre-commit hook that automates staging and checks if a commit violates the zero-diff rule.
- **Divergence tracking system:** An automated pipeline that warns when a PR exceeds a commit threshold, alerting maintainers that history consolidation is needed.

### Architecture Approach

The architecture defines a linear, secure history refactoring workflow comprising backup, reset, batch staging, and validation. To protect against data loss, a dual-layer backup is established. The staging pipeline divides the unstaged working tree into 5 distinct batches, which are then passed through three verification gates: custom prompt scanners, the Node.js test runner, and a final zero-diff validation gate against the backup branch.

**Major components:**
1. **Hard Backup:** Safety copy of the full repository tree and git branch to prevent data loss before reset.
2. **Git Soft Reset:** Moves HEAD back to tag `v1.41.2` while keeping all modified files intact in the working tree.
3. **Batch Stager:** Segregates unstaged files into 5 distinct staging batches for clean, coherent commit history.
4. **Custom Scanners:** Verifies prompt compliance with positive framing rules and blocks read-injection risks.
5. **Node.js Runner:** Runs the 8300+ tests concurrently to verify workspace runtime sanity.
6. **Zero-Diff Validator:** Assures that the refactored commits produce 100% file content parity with the original tree.

### Critical Pitfalls

1. **Destructive Hard Reset (Loss of Code):** Executing `git reset --hard` instead of `--soft` which deletes all modifications. Avoid by creating a temporary branch backup and directory copy before reset, and double-checking the command.
2. **Staging Untracked or Ignored Artifacts (Repository Pollution):** Staging temporary local files via catch-all `git add .` commands. Avoid by staging files explicitly using paths and glob patterns, and reviewing `git status` before commit.
3. **Tree Parity Mismatch (Losing Content Equivalency):** Discrepancies between the final commit state and the original tree. Avoid by recording the original HEAD SHA and running `git diff <original-SHA>` after final batch commits to verify zero difference.
4. **Staging Classification Misalignment (Incorrect Batch Cohorts):** Staging files in the wrong batch due to imprecise glob patterns. Avoid by mapping files precisely and running `git show --stat HEAD` after each commit.
5. **Dependency Fragmentation (Intermediate Test Breakages):** Non-runnable states of intermediate commits because of category-based batching. Avoid by documenting it as a known trade-off, and ensuring the final HEAD commit passes 100% of the test suite.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Backup and Soft Reset
**Rationale:** Establishes a safety baseline and resets the HEAD pointer to v1.41.2 while keeping all modified files intact in the working tree.
**Delivers:** Dual-layer backup (branch + physical copy) and an unstaged working tree reset to v1.41.2.
**Addresses:** Soft Reset to v1.41.2.
**Avoids:** Pitfall 1 (Destructive Hard Reset).

### Phase 2: Stage and Commit Configuration & Rules (Batch 1)
**Rationale:** Placed first to establish linting, formatting, and behavioral constraints before code or prompts are staged.
**Delivers:** Commit of rules and configuration files.
**Uses:** Git selective staging commands.
**Implements:** Rules and Config components.

### Phase 3: Stage and Commit Scanner Logic (Batch 2)
**Rationale:** Placed next so custom verification tools are in place to validate all prompt files introduced in subsequent phases.
**Delivers:** Commit of scanner logic, worker hooks, and audit-tags script.
**Uses:** Git selective staging commands.
**Implements:** Custom Scanners component.

### Phase 4: Stage and Commit Workflows, Agents, & Templates (Batch 3)
**Rationale:** Committed third as they represent the core prompt content of the GSD fork, which is immediately scannable by the Batch 2 rules.
**Delivers:** Commit of workflows, agents, commands, and templates.
**Uses:** Git selective staging commands.
**Implements:** Prompts/Workflows/Agents component.

### Phase 5: Stage and Commit Tests & SDK Validation (Batch 4)
**Rationale:** Committed fourth to introduce unit/integration tests and SDK cli helpers that verify the prompt changes.
**Delivers:** Commit of core tests, unit tests, and validation gates.
**Uses:** Git selective staging commands and Node.js.
**Implements:** Node.js Runner component.

### Phase 6: Stage and Commit Maintenance, Logs, & State (Batch 5)
**Rationale:** Placed last to record the final milestone outputs, historical logs, and state metadata.
**Delivers:** Commit of quick tasks, maintenance, logs, and state updates.
**Uses:** Git selective staging commands.
**Implements:** Maintenance & Logs component.

### Phase 7: Final Verification & Parity Audit
**Rationale:** Final gate to verify the entire workspace matches the backup state exactly and passes all tests before shipment.
**Delivers:** Zero-diff validation report and full test suite run results.
**Uses:** Git diff and npm test.
**Implements:** Zero-Diff Validator component.

### Phase Ordering Rationale

- **Dependency-ordered progression:** Configs and rules are staged first as they define the project baseline. The scanner is staged next to scan the workflows/agents staged in the following phase. Tests are staged fifth to verify the workflows/agents. Maintenance and state logs are staged last to reflect the completed state.
- **Logical architectural grouping:** Groups are categorized by GSD layers (Configs -> Scanners -> Prompts -> Tests -> Logs) to keep history clean and logically segmented.
- **Risk mitigation:** Prevents staging classification error by committing one batch at a time and auditing the commit content before moving on; avoids parity mismatch by comparing the final head to the original backup branch.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Batch 1 Configs) & Phase 6 (Batch 5 Logs):** Both contain `.planning/` files. Since configuration files reside in `.planning/config.json` and logs reside in `.planning/quick/` or `.planning/research/`, staging whole directories will cause cross-contamination. Precise path staging rules must be verified.
- **Phase 5 (Batch 4 Tests & SDK):** Unit tests and custom validation gates cross-cut across SDK files (`sdk/src/cli.ts`), runner scripts (`scripts/run-tests.cjs`), and tests (`tests/`). Staging patterns must ensure no test helper is omitted.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Backup & Reset):** Uses standard, well-documented git commands (`git branch`, `cp -R`, `git reset --soft`).
- **Phase 7 (Verification):** Standard GSD validation using `git diff` and `npm test`.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Git, Node, and npm versions are locally verified. |
| Features | HIGH | Batch mappings and MVP criteria are clearly defined. |
| Architecture | HIGH | Backup, reset, and validation gates are standard, well-understood patterns. |
| Pitfalls | HIGH | Critical pitfalls (especially destructive hard reset and staging classification) are mapped with clear recovery strategies. |

**Overall confidence:** HIGH

### Gaps to Address

- **Path Contamination in `.planning/`:** Staging files under `.planning/` requires exact file lists rather than general folders to prevent mixing Batch 1 (configs) and Batch 5 (logs). Handled during planning by writing a strict file-by-file staging map.
- **Dependency breakages at intermediate commits:** Intermediate commits will not pass tests because tests are only committed in Batch 4. Handled by documenting this as a known limitation and only enforcing test gates at the final HEAD.

## Sources

### Primary (HIGH confidence)
- `file:///Users/thamw/development/local/get-shit-done/.planning/research/STACK.md` — Git & Node version specifications and mixed reset alternative verification.
- `file:///Users/thamw/development/local/get-shit-done/.planning/research/FEATURES.md` — 5-batch file classification mappings and zero-diff validation procedure.
- `file:///Users/thamw/development/local/get-shit-done/.planning/research/ARCHITECTURE.md` — Dual-layer backup pattern, validation gates, and directory/batch structures.
- `file:///Users/thamw/development/local/get-shit-done/.planning/research/PITFALLS.md` — Destructive hard reset recovery, classification errors, and tree parity warning signs.
- `file:///Users/thamw/development/local/get-shit-done/.planning/PROJECT.md` — Milestone target definitions and current fork state context.
- Git Reset & Add Docs: `https://git-scm.com/docs` — mixed reset and staging behavior.
- Node.js Test Runner: `https://nodejs.org/api/test.html` — test runner execution.

### Secondary (MEDIUM confidence)
- Conventional Commits: `https://www.conventionalcommits.org/` — commit message conventions.

---
*Research completed: 2026-05-21*
*Ready for roadmap: yes*
