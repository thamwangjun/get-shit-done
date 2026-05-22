# Feature Research: Git Commit History Refactoring

**Domain:** Repository Consolidation & History Refactoring
**Researched:** 2026-05-21
**Confidence:** HIGH

---

## Feature Landscape

This research outlines the feature landscape for the **v1.41.5 Refactor Git Commit History** milestone. The core objective is to collapse the fork's commit history since `upstream/v1.41.2` into exactly 5 feature-focused commits while ensuring zero functional regressions and 100% file content parity.

### Table Stakes (Users & Maintainers Expect These)

These are the non-negotiable requirements. Missing any of these means the refactor fails its core intent.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Soft Reset to `v1.41.2`** | Moves branch HEAD back to the target upstream release tag without modifying the working tree files. | LOW | Uses `git reset --soft v1.41.2` so changes remain staged/unstaged. |
| **5-Batch Grouping** | Collects related modifications into logical, reviewable blocks. | MEDIUM | Grouping must be precise to avoid path leakage across batches. |
| **Zero-Diff Content Parity** | The final commit tree must match the original tree with 100% byte-for-byte correctness. | HIGH | Checked via `git diff HEAD $ORIGINAL_HEAD` returning nothing. |
| **Full Test Validation** | All 8300+ tests must pass to verify no regressions were introduced. | MEDIUM | Guarded by `npm test` gate. |
| **Coherent Commit Messages** | Each of the 5 commits needs a clear, semantic commit message. | LOW | Defines the purpose and boundaries of the batch. |

### Differentiators (Competitive Advantage)

These features enhance developer efficiency and history sanity beyond the bare minimum.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Dependency-Ordered Commits** | Committing files in their order of dependency (Configs -> Scanners -> Prompts -> Tests -> Logs) preserves logical readability in Git history. | MEDIUM | Ensures that if intermediate commits are checked out, the system remains cohesive. |
| **Automated Staging Script** | Prevents human error in manually staging hundreds of files across 5 complex batches. | MEDIUM | Can be implemented using a Node/Bash script parsing `changed_files.txt`. |
| **Dry-Run Diff Audit** | Verifies the staging boundaries before making final commits. | LOW | Use `git diff --cached --name-only` to review each batch before committing. |

### Anti-Features (Avoid These)

These are tempting shortcuts or features that actually introduce risk, complexity, or history corruption.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Squashing into a single commit** | Extremely simple; requires no staging taxonomy. | Loses all distinction between logic, configuration, tests, and historical logs. | Maintain the 5-batch taxonomy to separate concerns. |
| **Interactive Rebase (`rebase -i`)** | Standard git squashing method. | Hundreds of commits make conflict resolution highly error-prone and time-consuming. | Use `git reset --soft` followed by clean path staging. |
| **Sneaking in code fixes** | Fix minor typos or add new rules during refactoring. | Violates the zero-diff quality gate; makes debugging history consolidation harder. | Keep all file contents 100% identical; defer fixes to next milestone. |
| **Coarse directory-based staging** | Staging `git add .planning/` in one go. | Mixes config files (Batch 1), quick tasks (Batch 5), and references (Batch 1). | Use exact pathnames or targeted glob patterns. |

---

## Feature Dependencies

The 5 batches have strong logical dependencies. Committing them in the correct sequence ensures each step is built on top of its prerequisites.

```
[Batch 1: Rules & Config]
       ├──required by──> [Batch 2: Scanner Logic]
       │                        └──required by──> [Batch 4: Tests & Gates]
       └──required by──> [Batch 3: Workflows & Agents]
                                └──required by──> [Batch 4: Tests & Gates]

[Batch 5: Maintenance & State] ──enhances/documents──> [All Batches]
```

### Dependency Notes

- **Batch 2 (Scanner) requires Batch 1 (Rules & Config):** The scanners rely on rules defined in prompt guides and catalogues to run correctly.
- **Batch 3 (Workflows & Agents) requires Batch 1 (Rules & Config):** Prompt content is governed by configuration limits and references.
- **Batch 4 (Tests) requires Batches 1, 2, and 3:** The test suite verifies agents (Batch 3) using scanner logic (Batch 2) against config structures (Batch 1).
- **Batch 5 (Maintenance & Logs) contains state metadata:** These are self-contained logs, quick plans, and hook scripts that document or automate the workspace.

---

## MVP Definition

### Launch With (v1.41.5)

The minimal feature set required to achieve the milestone objectives safely:

- [ ] **Soft reset** the current branch to `v1.41.2`.
- [ ] **Staging map** categorizing all 690+ changed files into 5 distinct batches.
- [ ] **5 commits** executed sequentially with semantic messages.
- [ ] **Zero-diff validation** verifying parity with the original branch HEAD.
- [ ] **Test validation** ensuring `npm test` finishes with 8300+ green tests.

### Add After Validation (v1.x)

- [ ] **Automated staging CLI tool:** A utility to automatically stage files based on path glob rules.
- [ ] **Git pre-commit validation hook:** A hook that checks if a commit violates the zero-diff rule.

### Future Consideration (v2+)

- [ ] **Divergence tracking system:** An automated pipeline that warns when a PR exceeds a commit threshold, alerting maintainers that history consolidation is needed.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Soft Reset & Unstage | HIGH | LOW | P1 |
| 5-Batch File Classification | HIGH | MEDIUM | P1 |
| Zero-Diff Validation Process | HIGH | LOW | P1 |
| Full Test Suite Gate | HIGH | MEDIUM | P1 |
| Automated Staging Script | MEDIUM | MEDIUM | P2 |

---

## Batch File Mapping

The table below maps the 694 changed files to the 5 batches based on their paths and contents:

| Batch | Description | Representative Files & Paths |
|-------|-------------|------------------------------|
| **Batch 1** | Rules and configuration files | `CATALOGUE.json`, `mise.toml`, `.planning/config.json`, `.planning/references/*` (`PROMPT_ENGINEERING_GUIDE_V10.md`, `PROMPT_IMPROVEMENT_GUIDE_V01.md`, `UPSTREAM_TO_FORK_CHANGES_GUIDE.md`) |
| **Batch 2** | Scanner logic and scanner configs | `hooks/gsd-read-injection-scanner.js`, `scripts/audit-tags.js`, `hooks/gsd-check-update.js` |
| **Batch 3** | Workflows, agents, commands, templates | `agents/*.md`, `commands/gsd/*.md`, `get-shit-done/workflows/*.md`, `README*.md`, `docs/*.md` (excluding test/inventory docs) |
| **Batch 4** | Core tests, unit tests, validation gates | `tests/*.test.cjs`, `scripts/run-tests.cjs` |
| **Batch 5** | Quick tasks, maintenance, logs, state | `.planning/quick/**/*`, `logs/*.md`, `.planning/PROJECT.md`, `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/PROJECT_HISTORY.md`, `.planning/MILESTONES.md`, `.planning/RETROSPECTIVE.md`, `.planning/v1.36.0.a-MILESTONE-AUDIT.md`, `.planning/codebase/*`, `.planning/critique/*`, `.planning/debug/*`, `.planning/intel/*`, `.planning/notes/*`, `.planning/research/*`, `bin/install.js`, `hooks/gsd-check-update-worker.js`, `hooks/gsd-statusline.js`, `sdk/src/cli.ts`, `scripts/gen-inventory-manifest.cjs`, `get-shit-done/bin/lib/security.cjs`, `get-shit-done/bin/lib/state.cjs` |

---

## Zero-Diff Validation Procedure

To ensure 100% file content parity, execute the following script during consolidation:

```bash
# 1. Store the original HEAD SHA
ORIGINAL_HEAD=$(git rev-parse HEAD)

# 2. Reset the branch pointer to v1.41.2
git reset --soft v1.41.2

# 3. Unstage everything to verify files
git reset

# 4. Stage and commit Batch 1
# E.g., git add CATALOGUE.json mise.toml .planning/config.json .planning/references/
git commit -m "feat(rules-config): [Batch 1/5] consolidate fork standards, references, and project configurations"

# 5. Stage and commit Batch 2
# E.g., git add hooks/gsd-read-injection-scanner.js scripts/audit-tags.js hooks/gsd-check-update.js
git commit -m "feat(scanner): [Batch 2/5] consolidate custom injection scanning and tag audit logic"

# 6. Stage and commit Batch 3
# E.g., git add agents/ commands/ get-shit-done/workflows/ README* docs/
git commit -m "feat(prompts-docs): [Batch 3/5] consolidate positive framing refactors across agents, commands, workflows, and documentation"

# 7. Stage and commit Batch 4
# E.g., git add tests/ scripts/run-tests.cjs
git commit -m "test(validation): [Batch 4/5] consolidate test suite and custom regression gates"

# 8. Stage and commit Batch 5
# E.g., git add .planning/quick/ logs/ bin/install.js hooks/ sdk/ scripts/ get-shit-done/bin/
git commit -m "chore(maintenance): [Batch 5/5] consolidate quick tasks, run logs, git state metadata, and installer hooks"

# 9. Perform zero-diff validation
git diff HEAD $ORIGINAL_HEAD

# 10. Run the test suite
npm test
```

If `git diff HEAD $ORIGINAL_HEAD` returns no output and `npm test` passes, the consolidation is successful.

---

## Sources

- `.planning/PROJECT.md`
- Git commit logs (`git log v1.41.2..HEAD`)
- Git diff statistics (`git diff --stat v1.41.2 HEAD`)
- Core test suite runner configurations
- Prior milestone consolidation plans (`v1.36.0` - `v1.41.3`)

---
*Feature research for: Git Commit History Refactoring*
*Researched: 2026-05-21*
