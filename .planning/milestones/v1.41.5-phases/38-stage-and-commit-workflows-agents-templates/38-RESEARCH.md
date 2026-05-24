# Phase 38: Stage and Commit Workflows, Agents, & Templates - Research

**Researched:** 2026-05-22
**Domain:** Git automation and file subset staging validation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Staged files will include all modified and untracked files in the directories `agents/`, `commands/gsd/`, `get-shit-done/workflows/`, root markdown files (`README*.md`), and all documentation under `docs/`.
- **D-02:** Untracked markdown files in these directories (such as `get-shit-done/workflows/join-discord.md`, `get-shit-done/workflows/set-profile.md`, and new `.md` files in `docs/`) will be explicitly staged and committed to achieve the zero-diff goal at the end of the milestone.
- **D-03:** A helper script `scripts/stage-batch-3.cjs` will be created to automate the staging, perform verification that no files outside the Batch 3 scope are staged, and commit the changes with the conventional commit message: `refactor(prompts): refactor workflows, agents, and templates (Batch 3)`.

### the agent's Discretion
- None — all key decisions on file scope, untracked files, and automation were fully selected and agreed upon by the user.

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope.
</user_constraints>

<architectural_responsibility_map>
Single-tier application — all capabilities reside in developer terminal scripts running in Node.js.
</architectural_responsibility_map>

<research_summary>
## Summary

This research establishes the exact list of files and automation logic needed to stage and commit Batch 3 (workflows, agents, commands, non-test documentation, and templates). We build upon the established design pattern of `scripts/stage-batch-2.cjs` to create `scripts/stage-batch-3.cjs`.

Batch 3 contains a large number of prompt files, markdown documentation files, and workflows. Ensuring only files within the designated directories (`agents/`, `commands/gsd/`, `get-shit-done/workflows/`, root `README*.md`, and `docs/`) are staged is critical. The staging script must validate that no test files, code files, or state files outside Batch 3 are inadvertently staged.

**Primary recommendation:** Build `scripts/stage-batch-3.cjs` using the `scripts/stage-batch-2.cjs` blueprint, with the target file list updated to contain all 61 identified Batch 3 files.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js fs | >=22.0.0 | File system existence checking | Built-in, zero external dependencies |
| Node.js path | >=22.0.0 | Cross-platform file path resolution | Built-in, handles OS differences |
| Node.js child_process | >=22.0.0 | Execution of Git CLI commands | Built-in, enables reliable git integration |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw shell script | Node.js script | Node.js provides better cross-platform compatibility (e.g., Mac/Windows/Linux paths) and easier array/Set handling. |
| simple-git package | execFileSync | Using native Node `child_process` preserves zero external dependencies in the root project. |
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
The staging script will be placed at `scripts/stage-batch-3.cjs` and tracked. However, since the script itself is a maintenance utility, it belongs in Batch 5 (`chore(maintenance): refactor quick tasks, logs, and state files (Batch 5)`), so the script itself will remain untracked during Phase 38, just as `stage-batch-2.cjs` was untracked during Phase 37.

### Staging Verification Pattern
The script must perform the following validation steps sequentially:
1. **Branch check:** Verify the current branch is `thamw-main` (unless `ALLOW_ANY_BRANCH=1` is set).
2. **Commit idempotent check:** Verify if the commit has already been made (by checking if the latest commit message matches `refactor(prompts): refactor workflows, agents, and templates (Batch 3)`).
3. **Existence check:** Ensure all expected files exist on disk.
4. **Git reset:** Clear any pre-existing staged changes.
5. **Git add:** Stage all Batch 3 files that have modifications since `v1.41.2` or are untracked.
6. **Subset verification:** List staged files using `git diff --cached --name-only` and assert that every staged file is present in the expected Batch 3 files Set.
7. **Commit:** Commit the changes using the conventional commit message.

### Anti-Patterns to Avoid
- **Hardcoding wildcards like `git add agents/*`**: This can capture new, unrelated files or files that are out of scope. Every file must be explicitly listed or matched against the strict expected Set.
- **Including scripts/stage-batch-3.cjs in the Batch 3 commit**: This helper script must remain untracked until Batch 5 to maintain pristine batch boundaries.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Git Operations | Custom git client wrapper | Native Git binary commands via `execFileSync` | Git CLI is the single source of truth; third-party libs add overhead and risk version drift. |
| Branch detection | Custom parsing of `.git` folder | `git rev-parse --abbrev-ref HEAD` | Git internal structure can change; command-line output is stable. |
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Accidentally Staging Batch 4/5 Files
- **What goes wrong:** Test files or state files are staged and committed alongside Batch 3.
- **Why it happens:** The user or the orchestrator runs a generic `git add .` or fails to verify staged files.
- **How to avoid:** Perform `git reset` at the beginning of the script and run strict subset validation on `git diff --cached --name-only` before committing.

### Pitfall 2: Double Committing
- **What goes wrong:** Running the script multiple times creates duplicate empty commits.
- **Why it happens:** `git commit` is called even when no files are staged or when the commit is already present.
- **How to avoid:** Check if the latest commit message matches the target commit message, and check if `stagedFiles.length === 0` to exit early.
</common_pitfalls>

<code_examples>
## Code Examples

### Staging Validation Logic
```javascript
const expectedFiles = new Set([
  'README.md',
  'README.ja-JP.md',
  // ... and other Batch 3 files ...
]);

// Stage files
for (const file of expectedFiles) {
  if (hasChangesSinceV1_41_2(file, repoRoot) || isUntracked(file, repoRoot)) {
    execFileSync('git', ['add', '-f', file], { cwd: repoRoot });
  }
}

// Verify staged
const stagedOutput = execFileSync('git', ['diff', '--cached', '--name-only'], { encoding: 'utf8', cwd: repoRoot });
const stagedFiles = stagedOutput.split('\n').map(line => line.trim()).filter(Boolean);
for (const file of stagedFiles) {
  if (!expectedFiles.has(file)) {
    console.error(`Unauthorized file staged: ${file}`);
    execFileSync('git', ['reset'], { cwd: repoRoot });
    process.exit(1);
  }
}
```
</code_examples>

<sources>
## Sources

### Primary (HIGH confidence)
- `scripts/stage-batch-2.cjs` - Reference implementation for staging batches.
- `git status` output - Current modifications in workspace.
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Git staging validation
- Ecosystem: Node.js scripts
- Patterns: Automated batch staging

**Confidence breakdown:**
- Standard stack: HIGH
- Architecture: HIGH
- Pitfalls: HIGH
- Code examples: HIGH

**Research date:** 2026-05-22
**Valid until:** 2026-06-22
</metadata>

---

*Phase: 38-stage-and-commit-workflows-agents-templates*
*Research completed: 2026-05-22*
*Ready for planning: yes*
