# Architecture Research

**Domain:** Git Commit Refactoring & Parity Validation
**Researched:** 2026-05-21
**Confidence:** HIGH

## Standard Architecture

### System Overview

This architecture governs the history refactoring workflow for the `v1.41.5 Refactor Git Commit History` milestone. It defines how changes are backed up, how a soft reset is executed, how files are segregated into 5 feature-focused commit batches, and how verification gates (Node.js runner, custom scanner test suite, update hooks) guarantee zero regression and parity.

```
┌─────────────────────────────────────────────────────────────┐
│                 Original Repository State                   │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────┐         ┌─────────────────────┐  │
│  │   Active Workspace    │ ──────> │  Hard Backup/Stash  │  │
│  │   (Divergent Tree)    │         │  (Safety Copy)      │  │
│  └──────────┬────────────┘         └─────────────────────┘  │
│             │                                               │
│             │ git reset --soft v1.41.2                      │
│             ▼                                               │
├─────────────────────────────────────────────────────────────┤
│                 Refactoring & Staging Stage                 │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │               Batch Staging Pipeline                  │  │
│  │  1. Configs ➔ 2. Scanners ➔ 3. Prompts/Workflows     │  │
│  │            ➔ 4. Core Tests ➔ 5. Logs/State           │  │
│  └──────────────────────────┬────────────────────────────┘  │
│                             │                               │
│                             ▼                               │
├─────────────────────────────────────────────────────────────┤
│                 Validation & Parity Gates                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │   Node.js    │  │    Custom    │  │    Zero-Diff      │  │
│  │ Test Runner  │  │   Scanners   │  │ Verification Gate │  │
│  └──────────────┘  └──────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Hard Backup | Safety copy of the full repository tree to prevent data loss before git reset. | Create a temporary branch `backup-v1.41.5` and perform a physical directory copy (`cp -R`) outside the repository. |
| Git Soft Reset | Moves HEAD back to tag `v1.41.2` while keeping all modified files intact in the working tree. | `git reset --soft v1.41.2` followed by unstaging files via `git reset HEAD` or `git restore --staged .`. |
| Batch Stager | Segregates unstaged files into 5 distinct staging batches for clean, coherent commit history. | Staged sequentially via selective `git add` paths/globs, producing 5 distinct commits. |
| Custom Scanners | Verifies prompt compliance with positive framing rules and blocks read-injection risks. | `tests/negative-framing-scan.test.cjs` (positive framing regex analysis) and `hooks/gsd-read-injection-scanner.js` (PostToolUse hook). |
| Node.js Runner | Runs the 8300+ tests concurrently to verify workspace runtime sanity. | `scripts/run-tests.cjs` (Node.js test runner using `execFileSync` to run serial and parallel batches). |
| Zero-Diff Validator | Assures that the refactored commits produce 100% file content parity with the original tree. | `git diff backup-v1.41.5` must return no output (zero difference). |

## Recommended Project Structure

The codebase is organized into directories representing different tiers of the GSD framework. Here is how they correspond to the 5 refactoring batches:

```
get-shit-done/
├── .antigravity/                   # Batch 1: Rules and configuration files
│   └── rules.md
├── .planning/
│   ├── config.json                 # Batch 1: Rules and configuration files
│   └── STATE.md, ROADMAP.md, etc.  # Batch 5: Maintenance and state updates
├── hooks/
│   ├── gsd-read-injection-...js     # Batch 2: Scanner logic and rules
│   └── gsd-check-update-worker.js  # Batch 5: Maintenance and state updates
├── scripts/
│   ├── base64-scan.sh              # Batch 2: Scanner logic and rules
│   ├── lint-*.cjs                  # Batch 4: Core tests and validation gates
│   └── run-tests.cjs               # Batch 4: Core tests and validation gates
├── agents/                         # Batch 3: Workflows, agents, commands
├── commands/                       # Batch 3: Workflows, agents, commands
├── get-shit-done/                  # Batch 3: Workflows, agents, commands
├── tests/
│   ├── negative-framing-scan...   # Batch 2: Scanner logic and rules
│   └── *.test.cjs (other tests)    # Batch 4: Core tests and validation gates
└── sdk/                            # Batch 4: Core tests and validation gates
```

### Structure Rationale

- **Rules and configs (Batch 1):** Placed first to establish linting, formatting, and behavioral constraints before code or prompts are staged.
- **Scanner logic (Batch 2):** Placed second so that the custom verification tools are in place to validate all prompt files introduced in Batch 3.
- **Prompts/Workflows/Agents (Batch 3):** Committed third as they represent the core value/content of the GSD fork. They are immediately scannable by the Batch 2 rules.
- **Tests & SDK (Batch 4):** Committed fourth to introduce unit/integration tests and helpers that verify the prompt changes.
- **Logs, state, and hooks (Batch 5):** Placed last to record the final milestone outputs, historical logs, state files (`STATE.md`), and update banners.

## Architectural Patterns

### Pattern 1: Hard Backup before Reset

**What:** Creating a dual-layer backup prior to destructive git operations.
**When to use:** Before running any soft/hard reset or branch pointer overrides.
**Trade-offs:** Consumes minor storage but eliminates the risk of deleting uncommitted/untracked files.

**Example:**
```bash
# Layer 1: Git Branch Backup
git checkout -b backup-v1.41.5
git checkout thamw-main

# Layer 2: Filesystem Backup
cp -R /Users/thamw/development/local/get-shit-done /Users/thamw/development/local/get-shit-done-backup
```

### Pattern 2: Coherent Batch Staging

**What:** Staging files in isolated groups using precise path targeting.
**When to use:** Refactoring multi-commit history to group changes logically.
**Trade-offs:** Requires careful manual path specification but creates highly readable git history.

**Example:**
```bash
# Staging Batch 1: Rules & Configs
git add .antigravity/rules.md .clinerules .coderabbit.yaml package.json package-lock.json tsconfig.json vitest.config.ts .planning/config.json
git commit -m "refactor: rules and configuration files"
```

### Pattern 3: Zero-Diff Parity Gate

**What:** Standardizing verification against the backup branch to guarantee identical content.
**When to use:** At the very end of the refactoring process before pushing changes.
**Trade-offs:** Hard requirement for ensuring zero regression in codebase content.

**Example:**
```bash
# Final parity check
git diff backup-v1.41.5
# Expected output: completely clean (zero diff)
```

## Data Flow

### Request Flow

The commit refactoring workflow executes along a linear pipeline to ensure state preservation:

```
[Current Branch] ➔ [Create Backup Branch & Directory] ➔ [git reset --soft v1.41.2]
                                                                  │
                                                                  ▼
[Verification Gate Passes] ◄─ [Stage & Commit Batches 1-5] ◄─ [Unstage All Files]
            │
            ▼
[Zero-Diff Check vs Backup] ➔ [Milestone Complete]
```

### State Management

```
[Tracked Files State]
         │
         ▼ (Soft Reset)
[Unstaged Working Tree] ──(Stage Batch)──> [Index] ──(Commit)──> [Refactored Commits]
```

### Key Data Flows

1. **Staging Flow:** Files move from unstaged index to staged index in groups matching the 5 batches. Each batch is committed under a semantic message prefix (`refactor:`, `feat:`, `chore:`).
2. **Validation Flow:** Node.js runner (`scripts/run-tests.cjs`) spawns parallel and serial test files, feeding outputs to standard output/error. Custom scanners read prompt files on disk, ensuring 0 positive-framing violations.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-10 Commits | Direct manual staging using git command line is efficient and quick. |
| 10-100 Commits | Automate staging via batching scripts that define array lists of paths to stage. |
| 100+ Commits | Use automated git rewrite tools (interactive rebase, git filter-repo) to maintain parity. |

### Scaling Priorities

1. **Staging cross-contamination:** Staging files in the wrong batch can occur when directories like `.planning/` contain mixed files (e.g., config vs state files). Solve by targeting exact files instead of whole directories.
2. **Git cache bloat:** Soft resets with thousands of modified files can slow down git. Running `git status` helps keep track of staged vs unstaged files clearly.

## Anti-Patterns

### Anti-Pattern 1: Hard Resetting Without Copy Backup

**What people do:** Run `git reset --hard` assuming git reflog will capture every untracked or ignored file.
**Why it's wrong:** Reflog only tracks committed states. Untracked configuration files or workspace states are permanently deleted.
**Do this instead:** Copy the directory physically to a backup path outside git before reset.

### Anti-Pattern 2: Broad Directory Staging (`git add .planning/`)

**What people do:** Run `git add .planning/` to stage configuration files.
**Why it's wrong:** This mistakenly stages historical logs, research files, and roadmaps, which belong to Batch 5, polluting Batch 1.
**Do this instead:** Stage files individually: `git add .planning/config.json`.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| GitHub API | Outbound HTTPS GET query in update worker hook (`hooks/gsd-check-update-worker.js`). | Checks for newer commits on the fork repository coordinates; replaces traditional npm registry checking. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Test Runner ↔ Test Files | Node.js child_process runner (`scripts/run-tests.cjs`) executes `node --test` targeting specific files. | Runs parallel and serial splits. Serial files include shared filesystem mutation tests. |
| Custom Scanner ↔ Prompt Corpus | `tests/negative-framing-scan.test.cjs` reads files from `SCAN_DIRS`. | Scans `agents/`, `get-shit-done/workflows/`, `get-shit-done/references/`, and `commands/gsd/`. |
| Version System ↔ Installer | `bin/install.js` reads Git HEAD short SHA and writes it to `VERSION`. | Written to user's home runtime directory for offline/online version comparison. |

## Sources

- [GSD UPSTREAM_TO_FORK_CHANGES_GUIDE.md](file:///Users/thamw/development/local/get-shit-done/.planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md)
- [GSD PROJECT.md](file:///Users/thamw/development/local/get-shit-done/.planning/PROJECT.md)
- [Node.js Test Runner Documentation](https://nodejs.org/api/test.html)

---
*Architecture research for: Git Commit History Refactoring*
*Researched: 2026-05-21*
