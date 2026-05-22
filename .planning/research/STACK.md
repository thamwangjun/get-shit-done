# Stack Research

**Domain:** Git Commit History Refactoring / Repository Maintenance
**Researched:** 2026-05-21
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Git | 2.54.0 | Version control system for history manipulation. | Standard tool for managing commit histories. Recent versions support robust staging and resetting options safely. |
| Node.js / npm | v24.14.1 / 11.11.0 | Runtime and package manager for tests. | Required to run GSD validation gates (`npm test`) with Node's native test runner to guarantee functional parity. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Custom Scripts | Local | Automation of tag/rules audits and test execution. | Execute `scripts/run-tests.cjs` and `scripts/audit-tags.js` to verify tag compliance and test suite green state. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `git log` / `git diff` | CLI utilities to inspect commit history and file diffs. | Use `git log --oneline` to review commit structures and `git diff` to verify zero-diff against backup branches. |
| VS Code Diff Tool | Interactive visual check of unstaged/staged files. | Recommended for reviewing code differences at a glance before finalizing batch commits. |

## Installation

No external package installations are needed as the core stack is pre-installed. Verify versions using:

```bash
# Verify Git installation
git --version

# Verify Node.js and npm installation
node --version
npm --version

# Ensure all workspace dependencies are up-to-date
npm install
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `git reset <tag>` (mixed reset) followed by `git add <batch>` and `git commit` | `git rebase -i <tag>` (Interactive Rebase) | Interactive rebase is suitable for a small commit count (e.g. < 20). It is **not** recommended here because there are 829 commits since tag `v1.41.2`, which would trigger massive merge conflict overhead. |
| `git reset <tag>` (mixed reset) followed by `git add <batch>` and `git commit` | Squash Merges on branch merges | Squash merges are good when merging feature branches to a clean target branch, but not for post-facto history consolidation where we want 5 distinct, feature-focused commits rather than a single monolithic commit. |
| `git reset <tag>` (mixed reset) followed by `git add <batch>` and `git commit` | `git-filter-repo` / `git filter-branch` | Heavy-duty rewriting tools are useful for deleting large assets or purging directories across historical revisions, but are unnecessarily complex for flattening the current state into structured batches. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `git reset --hard` | Destructive command. It will permanently delete all modifications and additions since tag `v1.41.2`, destroying the current workspace state. | `git reset v1.41.2` (mixed reset) which changes HEAD/index but preserves all file modifications in the working tree. |
| `git rebase -i` over large ranges | High probability of hitting merge conflicts repeatedly across 800+ commits, stalling progress. | Soft/mixed reset to base tag and staging batches from the final state. |
| `git push --force` | Overwrites remote commits blindly; dangerous if other developers have pushed concurrent changes. | `git push --force-with-lease` to check remote state before forcing. |
| `git filter-branch` | Deprecated, slow, and writes a warning to the console. | `git-filter-repo` if rewriting is required. |

## Stack Patterns by Variant

### If Refactoring Git History via Soft/Mixed Reset (Recommended Pattern):
1. **Safety Backup**: Create a backup branch of the current state before executing any reset:
   ```bash
   git branch backup-before-refactor
   ```
2. **Execute Reset**: Run mixed reset to base tag (unstages all files but keeps working directory intact):
   ```bash
   git reset v1.41.2
   ```
3. **Commit in Coherent Batches**: Stage and commit files batch-by-batch using precise git commands:

   * **Batch 1: Rules and configuration files**
     ```bash
     git add .planning/references/ mise.toml
     git commit -m "refactor: rules and configuration files"
     ```
   * **Batch 2: Scanner logic and associated scanner configuration/rules**
     ```bash
     git add hooks/gsd-read-injection-scanner.js scripts/audit-tags.js
     git commit -m "refactor: scanner logic and associated configurations"
     ```
   * **Batch 3: Workflows, agents, commands, and templates**
     ```bash
     git add agents/ commands/gsd/ get-shit-done/workflows/ get-shit-done/bin/lib/ hooks/gsd-statusline.js hooks/gsd-check-update.js hooks/gsd-check-update-worker.js sdk/src/cli.ts docs/ README*.md
     git commit -m "refactor: workflows, agents, commands, and templates"
     ```
   * **Batch 4: Core tests, unit tests, and validation gates**
     ```bash
     git add tests/ scripts/run-tests.cjs
     git commit -m "refactor: core tests, unit tests, and validation gates"
     ```
   * **Batch 5: Quick tasks, maintenance, historical logs, and state updates**
     ```bash
     # Add remaining files (logs, state, quick tasks, catalogue, etc.)
     git add .planning/quick/ .planning/research/ logs/ CATALOGUE.json docs/INVENTORY.md docs/INVENTORY-MANIFEST.json scripts/gen-inventory-manifest.cjs bin/install.js
     # Stage any remaining files if applicable (run git status to check)
     git commit -m "chore: quick tasks, maintenance, historical logs, and state updates"
     ```

4. **Verify Parity**: Run a diff against the backup branch to confirm zero file content differences (expecting no output):
   ```bash
   git diff backup-before-refactor
   ```
5. **Verify Tests**: Execute the complete test suite to ensure all tests pass:
   ```bash
   npm test
   ```

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Git @ 2.54.0 | Git >= 2.23.0 | Compatible with modern commands like `git restore` and `git switch`. |
| Node.js @ v24.14.1 | Node.js >= 18.0.0 | Compatible with built-in Node test runner. |

## Sources

- [Git Reset Official Documentation](https://git-scm.com/docs/git-reset) — Verified mixed reset behavior keeps working tree changes unstaged.
- [Git Add Official Documentation](https://git-scm.com/docs/git-add) — Verified pattern matching for selective staging.
- Local repository checkout — Confirmed Git version is `2.54.0`, Node is `v24.14.1`, and tag `v1.41.2` points to `e35865f33bd8f000cc8a82a04f16147a8eab8463`. Confidence level: HIGH.

---
*Stack research for: Git Commit History Refactoring*
*Researched: 2026-05-21*
