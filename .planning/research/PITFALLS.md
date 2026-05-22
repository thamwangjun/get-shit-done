# Pitfalls Research

**Domain:** Git Commit History Refactoring
**Researched:** 2026-05-21
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Destructive Hard Reset (Loss of Code)

**What goes wrong:**
During the initial stage of refactoring, the developer intends to soft reset the branch to the base tag (`v1.41.2`) to consolidate history. However, they execute a destructive hard reset (`git reset --hard`) instead of a soft reset (`git reset --soft`). This immediately deletes all uncommitted modifications and local changes made since the base tag, causing complete loss of the prompt fixes and test updates developed in subsequent version increments.

**Why it happens:**
Muscle memory of using `git reset --hard` to clear local states, or misunderstanding the behavior of reset flags. Developers often use `--hard` to clean up branches without realizing that in a history refactoring context, the "changes" must be preserved in the working directory as uncommitted changes.

**How to avoid:**
1. Back up the active branch to a temporary safety branch before running any reset command:
   ```bash
   git branch backup-v1.41.5-pre-reset
   ```
2. Double-check the command before execution and explicitly write `--soft`:
   ```bash
   git reset --soft v1.41.2
   ```

**Warning signs:**
- `git status` shows "nothing to commit, working tree clean" immediately after reset.
- `git diff` with the backup branch shows massive deletions of files and folders.
- The terminal history shows a command containing `reset --hard` targeted at a previous commit or tag.

**Phase to address:**
Phase 1 (Preparation and Soft Reset)

---

### Pitfall 2: Staging Untracked or Ignored Artifacts (Repository Pollution)

**What goes wrong:**
Untracked files, transient workspace files (such as local `.antigravitycli/` directories, test logs, `.DS_Store` files, or temporary editor backups), or automatically generated directories are staged and committed into the history, polluting the clean repository index.

**Why it happens:**
Using catch-all staging commands like `git add .` or `git add -A` while having untracked files present in the working tree, without checking `git status` or configuring `.gitignore` properly.

**How to avoid:**
1. Avoid blind `git add .` operations.
2. Explicitly stage files by directory, path, or specific patterns (e.g., `git add .antigravity/rules.md`).
3. Run `git status` before committing to verify the list of "Changes to be committed" matches only the expected target files.
4. Clean the workspace or update `.gitignore` prior to the refactoring process.

**Warning signs:**
- Green files under "Changes to be committed" in `git status` that are not listed in the milestone scope (e.g., files in `.antigravitycli/`).
- Commit diffs showing additions of temporary files or editor files.

**Phase to address:**
Phases 1 through 5 (Staging and committing batches)

---

### Pitfall 3: Tree Parity Mismatch (Losing Content Equivalency)

**What goes wrong:**
After completing all batch commits, the final state of the repository has discrepancies compared to the original tree before the reset. Files might be missing, have different content, or contain duplicate lines. The zero-diff guarantee is violated.

**Why it happens:**
Files are skipped or misidentified during staging of the 5 feature-focused batches, or file modifications are accidentally overridden during the batching process.

**How to avoid:**
1. Record the exact commit SHA of the original branch head before starting the reset:
   ```bash
   git log -n 1 --format="%H"
   ```
2. After the final batch commit, run a comparative diff against the original SHA:
   ```bash
   git diff <original-SHA>
   ```
3. Verify that the output of the diff command is completely empty (zero changes).

**Warning signs:**
- `git diff <original-SHA>` prints file additions, deletions, or modifications.
- File count or structure differs when checked against the original head state.

**Phase to address:**
Phase 6 (Verification & Finalization)

---

### Pitfall 4: Staging Classification Misalignment (Incorrect Batch Cohorts)

**What goes wrong:**
Files are staged in the wrong commit batch. For example, scanner logic (Batch 2) is committed in the Rules/Config batch (Batch 1), or unit tests (Batch 4) are committed in the Workflows/Agents batch (Batch 3).

**Why it happens:**
Using imprecise glob patterns for staging (e.g., `git add *.md` when `.md` files exist in rules, workflows, and agents) or failing to review the staged diff before running `git commit`.

**How to avoid:**
1. Define a strict file mapping list for each of the 5 batches.
2. Stage files using explicit paths or specific subdirectories (e.g., `git add agents/` for Batch 3, `git add tests/` for Batch 4).
3. Run `git show --stat HEAD` after each batch commit to audit the list of modified files in that commit.

**Warning signs:**
- `git show --stat HEAD` on a commit reveals files that violate the batch's feature definition.
- A reviewer notes that a test file is nested in a configuration commit.

**Phase to address:**
Phases 1 through 5 (Batch commits)

---

### Pitfall 5: Non-compliant Commit History Messages

**What goes wrong:**
The batch commit messages violate the repository's convention (e.g., conventional commits) or fail to provide meaningful descriptions of the aggregated fork changes, reducing the legibility of the project history.

**Why it happens:**
Developer writes hasty messages on the command line using `git commit -m` without referencing standard templates or conventions.

**How to avoid:**
1. Pre-define the exact commit messages for all 5 batches in the implementation plan.
2. Use conventional commit scopes:
   - Batch 1: `build(config): stage rules and configurations`
   - Batch 2: `refactor(scanner): consolidate negative-framing scanner logic`
   - Batch 3: `docs(prompts): update workflows, agents, and templates`
   - Batch 4: `test(core): stage unit tests and validation gates`
   - Batch 5: `chore(maintenance): stage quick tasks, state updates, and logs`

**Warning signs:**
- `git log` shows unstructured messages like "batch 1" or "squashed changes".
- Automated commit-lint checks fail on push.

**Phase to address:**
Phases 1 through 5 (Batch commits)

---

### Pitfall 6: Dependency Fragmentation (Intermediate Test Breakages)

**What goes wrong:**
While the final HEAD commit compiles and passes all tests, intermediate batch commits in the git history are broken. If someone checks out Batch 2 or Batch 3 to debug, the code is in a non-runnable state because the corresponding tests or configuration files are missing.

**Why it happens:**
Batching commits by file category (e.g., putting rules in commit 1 and tests in commit 4) creates temporary dependency mismatches at intermediate states.

**How to avoid:**
1. Accept this as an inherent trade-off of file-category batching, but document it clearly so future developers do not attempt to run tests on intermediate commits.
2. Ensure that the final batch commit (HEAD) resolves all dependencies and passes 100% of the test suite.
3. If strict atomic commit runnability is required, reorder staging to commit code and tests in the same batch, though this may conflict with the 5-batch requirement. Under the current milestone, prioritize verifying the final HEAD state.

**Warning signs:**
- Checking out a commit in the middle of the batch chain and running `npm test` yields unresolved module errors or failed assertions.

**Phase to address:**
Phase 6 (Verification & Finalization)

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Catch-all Staging (`git add .`) | Saves time during staging | Stages untracked, configuration, or temporary files | Never during a batch-commit refactoring process |
| Temporary/Lazy Commit Messages | Avoids typing long commit logs | Loses context of the fork adjustments in the history | Only in throwaway local research branches |
| Skipping Intermediary Parity Checks | Saves seconds during batch stages | Difficult to find which batch introduced a file mismatch | Never; check status and stat at each batch stage |
| Overwriting history directly on shared branches | Avoids setting up local forks | Destroys branch history for other collaborators, causing merge loops | Never; always rewrite on a user fork or dedicated feature branch |

---

## Integration Gotchas

Common mistakes when connecting to external services or remotes.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GitHub Pull Requests | Force-pushing with `git push --force` and overwriting others' work | Use `git push --force-with-lease` to ensure no upstream commits are overridden. |
| Remote Tracking | Pulling changes from origin after resetting locally, creating merge commits | Set the remote push/pull behavior to rebase, or discard remote divergences if local rewritten history is the source of truth. |
| Pre-commit Hooks | Commit failures because incomplete batches violate lint rules | Temporarily use `--no-verify` if committing incomplete batches, but ensure all verification checks pass on final HEAD. |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Giant working tree diffs | Git diff commands become slow or run out of memory | Keep changes structured; run git commands targeting specific files or folders | Workspace size > 100k files |
| Overlapping interactive rebases | Merge conflict loops when rebasing too many commits | Use a soft reset to squash and batch commit instead of running `git rebase -i` | Rewriting >50 commits with complex diffs |
| Git object bloat | Large `.git` directory size, slow fetches | Run `git gc --prune=now` after squashing and rewriting history | After rewriting large binary blobs or high commit volumes |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Committing credentials in history | Exposing API keys or secrets in intermediate commits even if removed in the final HEAD commit | Use `.gitignore` and dotenv files; run `git-filter-repo` if secrets are accidentally committed. |
| Staging files outside workspace boundaries | Exposing sensitive local configuration files by staging symlinked directories | Ensure all paths staged are strictly inside the git repository root. |
| Using unverified third-party git scripts | Running malicious code during git hook execution | Audit and verify all git hooks and custom scripts before execution. |

---

## UX Pitfalls

Common developer experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Unlabeled feature batches in history | Reviewers cannot distinguish between rule changes and logic changes | Use clear, semantic prefixes in commit messages matching the 5-batch definition. |
| Fragmented commit sequence | PR reviewers face a confusing list of small refactoring commits | Squash and batch the commits into the 5 designated, clean commits before submitting for review. |
| Stale branch divergence | Collaborators face massive merge conflicts | Keep the refactored branch in sync with the base upstream tag `v1.41.2`. |

---

## "Looks Done But Isn't" Checklist

- [ ] **Batch Commit 1 (Rules/Config):** Often misses files like `.planning/config.json` — verify with `git show --stat` that all configurations are staged.
- [ ] **Batch Commit 2 (Scanner):** Often misses scanner test suites or associated scripts — verify that both scanner logic and scanner rules are included.
- [ ] **Batch Commit 3 (Workflows/Agents/Commands):** Often misses templates — verify all prompt templates and workflows are staged here.
- [ ] **Batch Commit 4 (Tests):** Often misses custom tests or helper modules — verify all files under `tests/` are staged.
- [ ] **Batch Commit 5 (Maintenance/Logs):** Often misses state updates or changelogs — verify `.planning/STATE.md` and quick task logs are committed.
- [ ] **Tree Parity:** Looks identical but might have whitespace or empty file discrepancies — run `git diff <original-SHA>` to confirm zero diff.
- [ ] **Test Integrity:** All files staged but intermediate dependency breaks tests — run `npm test` on the final HEAD to ensure all 8300+ tests pass.

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Accidental hard reset | HIGH | Run `git reflog` to locate the SHA before the reset. Run `git reset --hard <SHA>` to restore the working tree. |
| Incorrect batch staging | LOW | Run `git reset HEAD~1` to undo the last commit while keeping modifications unstaged. Re-stage the files correctly. |
| File parity failure at final head | MEDIUM | Run `git diff <original-SHA>` to locate the changed files. Manually restore the correct content using checkout from the backup branch. |
| Stale local branch | LOW | Fetch the latest tags and run `git rebase v1.41.2` or reset local head to the correct base. |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Destructive hard reset | Phase 1 (Preparation) | Verify a safety backup branch exists before running `git reset`. |
| Dirty untracked files | Phase 1 & 5 | Verify `git status` displays no untracked files before committing. |
| File classification error | Phase 2 to 5 | Verify the staged files with `git diff --cached --stat` before each commit. |
| Loss of tree parity | Phase 6 (Finalization) | Verify `git diff <original-head-SHA>` produces no output. |
| Failed tests on head | Phase 6 (Finalization) | Run `npm test` and verify that all 8300+ tests pass. |

---

## Sources

- [Official Git Documentation on Reset and Rebasing](https://git-scm.com/docs)
- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [GSD Project Milestone Requirements for v1.41.5](file:///Users/thamw/development/local/get-shit-done/.planning/PROJECT.md)
- [Git Reflog Recovery Guides](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History)

---
*Pitfalls research for: v1.41.5 Refactor Git Commit History*
*Researched: 2026-05-21*
