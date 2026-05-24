# Phase 36: Stage and Commit Configuration & Rules - Research

**Researched:** 2026-05-22  
**Domain:** Git History Refactoring & Staging Automation  
**Confidence:** HIGH  

## Summary
This research document details the execution requirements and safety guardrails for Phase 36 of the `v1.41.5 Refactor Git Commit History` milestone `[CITED: .planning/ROADMAP.md]`. This phase focuses on staging and committing the Batch 1 files (Rules and configuration files: `CATALOGUE.json`, `mise.toml`, `.planning/config.json`, and prompt engineering guidelines under `.planning/references/*`) `[CITED: .planning/REQUIREMENTS.md]`.

The primary recommendation is to write a self-verifying Node.js execution script that automatically unstages pre-existing changes, staging only the precise files in Batch 1. A strict subset-matching logic will verify the staged files against a defined list of allowed files before finalizing the commit, ensuring that changes from subsequent batches (Batches 2-5) do not bleed into the git history of this commit `[CITED: .planning/phases/36-stage-and-commit-configuration-rules/36-CONTEXT.md]`.

**Primary recommendation:** Use Git CLI commands within a self-verifying Node.js harness to perform auto-unstaging, selective file staging, subset validation, and conventional committing, ensuring exact-match safety before executing the commit.

## Architectural Responsibility Map
| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| **Auto-unstaging** | Git CLI (`git reset`) | Node.js exec | Git CLI provides native, atomic unstaging capability. `[VERIFIED: git CLI]` |
| **Selective staging** | Git CLI (`git add`) | Node.js exec | Git CLI performs precise staging of targeted paths. `[VERIFIED: git CLI]` |
| **Staging verification** | Node.js script | Git CLI (`git diff --cached`) | Custom script parses the stdout of `git diff` and validates subset membership programmatically. `[ASSUMED]` |
| **Committing** | Git CLI (`git commit`) | Node.js exec | Git CLI writes the commit object to history with conventional metadata. `[VERIFIED: git CLI]` |

## Standard Stack
### Core
| Library | Version | Purpose | Why Standard |
|---|---|---|---|
| **Git CLI** | 2.54.0 | Repository history manipulation, staging, committing, and status query. | Installed globally on system, standard version control CLI. `[VERIFIED: git CLI]` |
| **Node.js** | >=20 | Orchestrator runner and validation execution environment. | Required by the GSD CLI tool and tests. `[CITED: CLAUDE.md]` |

### Supporting
| Library | Version | Purpose | When to Use |
|---|---|---|---|
| **Git Diff parser** | N/A | Parsing `git diff --cached --name-only` output. | Used during staging verification to check that only Batch 1 files are staged. `[ASSUMED]` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|---|---|---|
| **Standard Git CLI** | isomorphic-git / simple-git | Using pure JS/TS library increases package weight and dependencies. Standard Git CLI is more robust and faster. `[ASSUMED]` |
| **Shell-only verification** | `grep` / `awk` filters | Shell filters can be brittle across OS variants. Node.js regex/array methods are cross-platform safe. `[ASSUMED]` |

## Architecture Patterns
### System Architecture Diagram
```mermaid
graph TD
    A[Start Phase 36: HEAD at v1.41.2, unstaged changes in working tree] --> B[Auto-Unstage: git reset]
    B --> C[Stage Batch 1 Files: git add CATALOGUE.json mise.toml .planning/config.json .planning/references/*]
    C --> D[List Staged Files: git diff --cached --name-only]
    D --> E{Staged files ⊆ Expected Batch 1 files?}
    E -- No: Extra files staged --> F[Abort: git reset & exit 1]
    E -- Yes --> G[Commit Batch 1: git commit -m "chore(config)..."]
    G --> H[End Phase 36: Commit created, Batch 2-5 files remain unstaged]
```

### Recommended Project Structure
This phase operates on the root repository files and `.planning/` files directly. No directory structure changes are introduced.

### Pattern 1: Strict Explicit Staging
Instead of staging with wildcards like `git add .planning/`, each Batch 1 target file is staged using its exact relative path to prevent staging unintended files.
Files in `.planning/references/*` are resolved dynamically by finding files matching that glob pattern, and then each is added explicitly.

### Anti-Patterns to Avoid
- **Staging with global wildcards (`git add .` or `git add -A`):** This stages all unstaged changes (Batches 2-5), violating history refactoring boundaries.
- **Hardcoding references:** Ensure the glob resolution for `.planning/references/*` is robust so new references files (if any are added) are staged.

## Don't Hand-Roll
| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| **Git operations integration** | Custom Node-based git engine | Native `git` commands via subprocess exec | Highly optimized, bug-free, and handles git index locks natively. `[ASSUMED]` |

## Runtime State Inventory
### Target files
* `CATALOGUE.json`
* `mise.toml`
* `.planning/config.json`
* `.planning/references/PROMPT_ENGINEERING_GUIDE_V10.md`
* `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md`
* `.planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md`

### State before phase
* **Git HEAD:** tag `v1.41.2`
* **Working tree:** contains unstaged modifications (500+ files)
* **Git Index (Staged):** completely clean (empty)

### State after phase
* **Git HEAD:** 1 commit ahead of `v1.41.2` with message `chore(config): refactor rules and configuration files (Batch 1)`
* **Working tree:** contains unstaged modifications for Batches 2-5
* **Git Index (Staged):** completely clean (empty)

## Common Pitfalls
### Pitfall 1: Case-Sensitivity on macOS
* **Description:** macOS filesystems are case-insensitive by default. If a staging path is specified with wrong casing (e.g. `.planning/config.JSON`), git might fail or create double entries.
* **Mitigation:** Always use the exact casing retrieved from the filesystem or catalog: `.planning/config.json`.

### Pitfall 2: Staging untracked references
* **Description:** Files under `.planning/references/*` are new in this fork and did not exist in `v1.41.2`. `git add` will stage them as untracked additions. If there are other temp files or untracked files in the references directory, they might be staged.
* **Mitigation:** Limit staging to files matching `.planning/references/*.md` and exclude any non-markdown or editor backup files.

## Code Examples
### Staging and Verification Script (Node.js)
```javascript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Expected Batch 1 files
const expectedFiles = new Set([
  'CATALOGUE.json',
  'mise.toml',
  '.planning/config.json'
]);

// Read references directory dynamically
const refsDir = path.join(__dirname, '../.planning/references');
if (fs.existsSync(refsDir)) {
  const files = fs.readdirSync(refsDir);
  for (const file of files) {
    if (file.endsWith('.md')) {
      expectedFiles.add(`.planning/references/${file}`);
    }
  }
}

console.log('Batch 1 Expected Files:', Array.from(expectedFiles));

// 2. Auto-unstage
console.log('Unstaging all changes...');
execSync('git reset', { stdio: 'inherit' });

// 3. Stage Batch 1 files
for (const file of expectedFiles) {
  if (fs.existsSync(file)) {
    console.log(`Staging: ${file}`);
    execSync(`git add "${file}"`);
  } else {
    console.log(`Skipping (does not exist): ${file}`);
  }
}

// 4. Verification
const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean);

console.log('Staged files:', staged);

const extraFiles = staged.filter(f => !expectedFiles.has(f));
if (extraFiles.length > 0) {
  console.error('ERROR: Extra files staged!', extraFiles);
  console.log('Aborting and unstaging all...');
  execSync('git reset', { stdio: 'inherit' });
  process.exit(1);
}

console.log('Staging verified successfully! Committing...');
// 5. Commit
execSync('git commit -m "chore(config): refactor rules and configuration files (Batch 1)"', { stdio: 'inherit' });
console.log('Commit completed successfully.');
```

## State of the Art
| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| Manual `git commit -am` or interactive staging (`git add -i`). | Automating subset validation with path-based safety checks before committing. | Milestone v1.41.5 `[CITED: .planning/REQUIREMENTS.md]` | Prevents accidental bleeding of unrelated changes between logically separated history refactor commits. |

## Assumptions Log
| ID | Claim | Section | Risk if Wrong |
|---|---|---|---|
| **A1** | HEAD is soft-reset to tag `v1.41.2` prior to starting Phase 36. | Summary | Staging will compare against the wrong base commit, resulting in staging errors. |
| **A2** | Files in `.planning/references/*` are the only markdown reference files to be staged. | Common Pitfalls | Other reference files could be missed or excluded. |

## Open Questions
None. The scope of Phase 36 is well-defined and locked in `36-CONTEXT.md` and `REQUIREMENTS.md` `[CITED: .planning/phases/36-stage-and-commit-configuration-rules/36-CONTEXT.md]`.

## Environment Availability
| Dependency | Required By | Available | Version | Fallback |
|---|---|---|---|---|
| **Git CLI** | Staging and committing | Yes | 2.54.0 | None (Git is required) `[VERIFIED: git CLI]` |
| **Node.js** | Verification script | Yes | >=20 | Zsh/bash script equivalent `[CITED: CLAUDE.md]` |

## Validation Architecture
### Test Framework
* Standard Node.js `--test` runner is available for tests. `[CITED: CLAUDE.md]`
* For this phase, validation is executed via git status checks and staged diff verification before history commits are recorded.

### Phase Requirements -> Test Map
| Requirement | Test Scenario | Verification Mechanism |
|---|---|---|
| **STAGE-01** | Only Batch 1 files are committed. | `git diff --cached --name-only` is parsed; execution aborts if any file outside the Batch 1 expected set is staged. |
| **STAGE-01** | Conventional commit message is used. | `git log -n 1 --pretty=format:%s` output matches `chore(config): refactor rules and configuration files (Batch 1)`. |

### Sampling Rate
* 100% of local execution runs are verified by the staging verification gate.

### Wave 0 Gaps
None.

## Security Domain
### Applicable ASVS Categories
* **V14 - Configuration Security:** Verifying that configuration files do not contain unmasked secrets before commit staging.
* **V1 - Architecture, Design and Threat Modeling:** Reviewing commit boundaries to prevent leakage of source code or scanner logic into the configuration commit.

### Known Threat Patterns
* **API Key Leakage:** `.planning/config.json` is audited to ensure all third-party integrations (`brave_search`, `firecrawl`, `exa_search`) are disabled (`false`) and contain no credentials. `[VERIFIED: .planning/config.json]`

## Sources
### Primary (HIGH confidence)
* Git CLI outputs and versioning checks `[VERIFIED: git CLI]`
* `.planning/phases/36-stage-and-commit-configuration-rules/36-CONTEXT.md` `[VERIFIED: context file]`
* `.planning/REQUIREMENTS.md` `[VERIFIED: requirements file]`

### Secondary (MEDIUM confidence)
* `docs/CLI-TOOLS.md` `[CITED: docs/CLI-TOOLS.md]`
* `CLAUDE.md` `[CITED: CLAUDE.md]`

### Tertiary (LOW confidence)
None.

## Metadata
* **Confidence breakdown:**
  * Git CLI commands: 10/10
  * File presence and modifications: 10/10
  * Context Decisions: 10/10
* **Research date:** 2026-05-22
* **Valid until:** End of milestone v1.41.5 execution.
