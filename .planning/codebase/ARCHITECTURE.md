<!-- refreshed: 2026-05-25 -->
# Architecture

**Analysis Date:** 2026-05-25

## System Overview

```text
┌──────────────────────────────────────────────────────────────────────┐
│                    User / AI Coding Tool Runtime                     │
│              (Claude Code, OpenCode, Gemini CLI, Codex, etc.)        │
└──────────────────────┬───────────────────────────────────────────────┘
                       │  slash command invocation
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      Command Layer                                   │
│    `commands/gsd/*.md`  — 46+ thin entry-point command files        │
│    YAML frontmatter (name, description, allowed-tools)               │
│    Body: shell-cat `!` notation to read matching workflow file       │
└──────────────────────┬───────────────────────────────────────────────┘
                       │  reads + executes
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      Workflow Layer                                  │
│    `get-shit-done/workflows/*.md`  — 60+ orchestration files        │
│    init → spawn agents → collect results → update state              │
│    Calls gsd-tools.cjs init <workflow> for compound context load     │
└──────────────────────┬───────────────────────────────────────────────┘
                       │  Agent(subagent_type="gsd-*")
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       Agent Layer                                    │
│    `agents/*.md`  — 33 specialized task executors                   │
│    Each spawned with fresh 200K-token context window                 │
│    YAML frontmatter: name, description, tools, color, hooks          │
└──────────────────────┬───────────────────────────────────────────────┘
                       │  Bash: node gsd-tools.cjs <subcommand>
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      CLI Tools Layer                                 │
│    `get-shit-done/bin/gsd-tools.cjs`  — CLI entry point             │
│    `get-shit-done/bin/lib/*.cjs`  — 70+ CommonJS modules            │
│    Routes subcommands to lib modules                                 │
└──────────────────────┬───────────────────────────────────────────────┘
                       │  file I/O
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      State / Planning Store                          │
│    `.planning/`  — all state as human-readable Markdown + JSON      │
│    STATE.md (file-locked), ROADMAP.md, config.json, phases/          │
└──────────────────────────────────────────────────────────────────────┘
```

**Parallel SDK layer** (programmatic access):

```text
SDK Consumer
    │  import { GSD } from '@opengsd/gsd-sdk'
    ▼
`sdk/src/index.ts`  →  GSD class
    │  executePlan() / PhaseRunner / MilestoneRunner
    ▼
`sdk/src/session-runner.ts`  →  query() via @anthropic-ai/claude-agent-sdk
    │
    ▼
`sdk/src/ws-transport.ts`  →  WebSocket broadcast of GSD events
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Installer | Detects runtime, copies/transforms all files to runtime install paths | `bin/install.js` |
| Command files | Thin entry points; forward to matching workflow via shell-cat `!` notation | `commands/gsd/*.md` |
| Workflow files | Orchestration scripts: init → spawn agents → collect results → update state | `get-shit-done/workflows/*.md` |
| Agent files | Specialized executors, each scoped to a single responsibility | `agents/*.md` |
| gsd-tools.cjs | CLI entry point; routes all subcommands to lib modules | `get-shit-done/bin/gsd-tools.cjs` |
| core.cjs | Low-level file I/O, lock primitives, model resolution, git helpers | `get-shit-done/bin/lib/core.cjs` |
| state.cjs | STATE.md CRUD, checkpoint progression, metrics | `get-shit-done/bin/lib/state.cjs` |
| phase.cjs | Phase directory CRUD, decimal phase numbering, lifecycle | `get-shit-done/bin/lib/phase.cjs` |
| planning-workspace.cjs | `.planning/` path resolution, workstream routing, lock primitives | `get-shit-done/bin/lib/planning-workspace.cjs` |
| init.cjs | Compound context loading for workflow bootstrapping | `get-shit-done/bin/lib/init.cjs` |
| roadmap.cjs | ROADMAP.md CRUD, dependency analysis, progress annotation | `get-shit-done/bin/lib/roadmap.cjs` |
| config.cjs | `.planning/config.json` CRUD | `get-shit-done/bin/lib/config.cjs` |
| verify.cjs | Plan structure validation, phase completeness checks | `get-shit-done/bin/lib/verify.cjs` |
| template.cjs | Template fill operations (SUMMARY.md, PLAN.md, VERIFICATION.md) | `get-shit-done/bin/lib/template.cjs` |
| frontmatter.cjs | YAML frontmatter CRUD for agent/workflow files | `get-shit-done/bin/lib/frontmatter.cjs` |
| model-profiles.cjs | Model profile resolution (balanced/quality/speed → model id) | `get-shit-done/bin/lib/model-profiles.cjs` |
| SDK GSD class | Programmatic API: parsePlan → buildPrompt → query() → PlanResult | `sdk/src/index.ts` |
| PhaseRunner | State machine: discuss → research → plan → execute → verify → advance | `sdk/src/phase-runner.ts` |
| session-runner.ts | Drives `query()` calls against @anthropic-ai/claude-agent-sdk | `sdk/src/session-runner.ts` |
| WSTransport | WebSocket server broadcasting GSD events to external consumers | `sdk/src/ws-transport.ts` |
| Hooks | Terminal statusline, context monitor, update checker, workflow guard | `hooks/*.js` (source), `hooks/dist/` (built) |

## Pattern Overview

**Overall:** Four-layer meta-prompting framework with file-based state

**Key Characteristics:**
- All state is human-readable Markdown/JSON stored in `.planning/` — no database, no server
- Fresh 200K-token context window per spawned agent (solves context rot)
- Thin orchestrators: workflow files only coordinate; agents do the heavy lifting
- Absent = enabled pattern for all feature flags in `config.json`
- Runtime adaptation: installer transforms tool names, hook events, frontmatter per target runtime (Claude Code, OpenCode, Gemini CLI, Codex, Copilot, Antigravity)

## Layers

**Command Layer:**
- Purpose: User-facing entry points that bootstrap workflow execution
- Location: `commands/gsd/*.md`
- Contains: YAML frontmatter (name, description, allowed-tools, argument-hint) + `!` shell-cat body that reads matching workflow file
- Depends on: Workflow layer via `!cat $HOME/.claude/get-shit-done/workflows/<name>.md` references
- Used by: AI coding tool runtime (slash command invocation)

**Workflow Layer:**
- Purpose: Orchestration logic — never does heavy lifting, only coordinates agents
- Location: `get-shit-done/workflows/*.md`
- Contains: Step-by-step orchestration: init → spawn agents → collect results → update state
- Depends on: CLI tools layer (`gsd-tools.cjs init <workflow>`) and Agent layer via `Agent(subagent_type=...)`
- Used by: Command layer (commands shell-cat workflow content)

**Agent Layer:**
- Purpose: Specialized task executors, each spawned with a fresh context window
- Location: `agents/*.md` (33 agents), `sdk/prompts/agents/` (SDK variants)
- Contains: YAML frontmatter (`name`, `description`, `tools`, `color`, optional `hooks`) + role instructions
- Depends on: CLI tools layer via Bash calls to `gsd-tools.cjs`, file-based state in `.planning/`
- Used by: Workflow layer orchestrators via `Agent(subagent_type="gsd-*")`

**CLI Tools Layer:**
- Purpose: Low-level Node.js interface between agents/workflows and `.planning/` state
- Location: `get-shit-done/bin/gsd-tools.cjs` (entry point), `get-shit-done/bin/lib/*.cjs` (modules)
- Contains: State CRUD, phase operations, roadmap parsing, config, template filling, verification, model resolution, git operations
- Depends on: `.planning/` directory on filesystem
- Used by: Workflows (via Bash in init step), agents (via Bash for state reads/writes)

**SDK Layer (programmatic):**
- Purpose: TypeScript API for programmatic plan execution via @anthropic-ai/claude-agent-sdk
- Location: `sdk/src/*.ts`
- Contains: GSD class, PhaseRunner, MilestoneRunner, session runner, event stream, WS transport
- Depends on: `@anthropic-ai/claude-agent-sdk`, `gsd-tools.cjs` (via shell invocation), `.planning/` state
- Used by: External consumers, SDK-based automation, CI pipelines

## Data Flow

### Primary Request Path (Interactive)

1. User invokes slash command (e.g., `/gsd-execute-phase 3`) in AI tool runtime
2. Command file `commands/gsd/execute-phase.md` is loaded — YAML frontmatter sets allowed tools, body shell-cats workflow
3. Workflow `get-shit-done/workflows/execute-phase.md` is read and executed by the orchestrator
4. Orchestrator runs `node gsd-tools.cjs init execute-phase <phase>` via Bash → receives compound context JSON
5. Orchestrator analyzes `ROADMAP.md` dependency graph, groups independent plans into waves
6. For each wave: `Agent(subagent_type="gsd-executor", ...)` spawns a fresh agent per plan
7. Each `gsd-executor` agent reads its `PLAN.md`, executes tasks, commits via `gsd-tools.cjs commit`, writes `SUMMARY.md`
8. Orchestrator verifies completeness via filesystem spot-checks (`SUMMARY.md` exists + commits visible)
9. Orchestrator calls `gsd-verifier` agent to gate-check the phase
10. State updated via `gsd-tools.cjs state patch` → `.planning/STATE.md`

### SDK Programmatic Path

1. Consumer creates `new GSD({ projectDir })` → `sdk/src/index.ts`
2. Calls `gsd.executePlan('.planning/phases/01/01-PLAN.md')`
3. `parsePlanFile()` in `sdk/src/plan-parser.ts` extracts frontmatter + task list
4. `buildExecutorPrompt()` in `sdk/src/prompt-builder.ts` constructs agent prompt
5. `runPlanSession()` in `sdk/src/session-runner.ts` calls `query()` via `@anthropic-ai/claude-agent-sdk`
6. Message stream processed; events emitted via `GSDEventStream`
7. Optional: `WSTransport` broadcasts events over WebSocket (`sdk/src/ws-transport.ts`)
8. Returns typed `PlanResult` to caller

### State Management

- `STATE.md` is the central project checkpoint at `.planning/STATE.md`
- File-locked via `.planning/STATE.md.lock` (O_EXCL atomic creation) for parallel-safe writes during wave execution
- Lock files tracked in `_heldStateLocks` / `_heldPlanningLocks` Sets in memory; removed via `process.on('exit')` in `get-shit-done/bin/lib/state.cjs` and `get-shit-done/bin/lib/planning-workspace.cjs`
- `state.cjs` provides CRUD, checkpoint progression, and metrics (`cmdStateLoad`, `cmdStateUpdate`, `cmdStatePatch`)
- Workstream routing: `planningDir()` in `get-shit-done/bin/lib/planning-workspace.cjs` resolves `.planning/` vs `.planning/workstreams/<ws>/` based on `GSD_WORKSTREAM` env or session key

## Key Abstractions

**Phase:**
- Purpose: Represents a unit of work with a plan, research, and execution artifacts
- Examples: `.planning/phases/phase-1/PLAN.md`, `.planning/phases/phase-1/SUMMARY.md`
- Pattern: Decimal sub-phases supported (e.g., `phase-1.1`, `phase-2.3`). Directories sorted numerically by `comparePhaseNum()` in `get-shit-done/bin/lib/phase.cjs`. Canonical plan files match `{padded_phase}-{NN}-PLAN.md` or `PLAN.md`.

**Wave:**
- Purpose: Group of plans with no inter-dependencies, safe to execute in parallel
- Examples: Referenced in `get-shit-done/workflows/execute-phase.md`
- Pattern: Workflow performs dependency analysis on `task.depends_on` fields in PLAN.md frontmatter, groups independent tasks into waves, executes each wave's agents in parallel via `Agent(subagent_type=...)`

**Gate:**
- Purpose: Mandatory quality checkpoints before progressing between pipeline stages
- Examples: `get-shit-done/references/gates.md`, `get-shit-done/references/gate-prompts.md`
- Pattern: Four canonical gate types — Confirm, Quality, Safety, Transition — wired into `gsd-plan-checker` and `gsd-verifier` agents

**Reference:**
- Purpose: Shared prompt fragments injected via `@-reference` syntax into workflows and agents
- Examples: `get-shit-done/references/verification-patterns.md`, `get-shit-done/references/model-profiles.md`, `get-shit-done/references/context-budget.md`
- Pattern: Workflows include `<required_reading>` blocks with `@~/.claude/get-shit-done/references/<file>.md` paths; agents read references before acting

**Template:**
- Purpose: Pre-structured Markdown boilerplate for planning artifacts
- Examples: `get-shit-done/templates/project.md`, `get-shit-done/templates/phase-prompt.md`
- Pattern: Filled by `gsd-tools.cjs template fill` with project context; 30+ templates in `get-shit-done/templates/`

**Workstream:**
- Purpose: Isolated planning workspace within a project for parallel work threads
- Location: `.planning/workstreams/<name>/` for non-default workstreams
- Pattern: Session-scoped via env keys (`GSD_SESSION_KEY`, `CLAUDE_SESSION_ID`, etc.) or explicit `GSD_WORKSTREAM` env; resolved by `planning-workspace.cjs`

## Entry Points

**Installer:**
- Location: `bin/install.js` (3,400+ lines)
- Triggers: `npx get-shit-done` or direct invocation during setup
- Responsibilities: Detect runtime, copy agents/workflows/commands/hooks to runtime-specific install paths, transform tool names/hook events/frontmatter per target runtime

**CLI Tools:**
- Location: `get-shit-done/bin/gsd-tools.cjs`
- Triggers: Called via Bash by workflows/agents — e.g., `node ~/.claude/get-shit-done/bin/gsd-tools.cjs state load`
- Responsibilities: Route subcommands (`init`, `state`, `phase`, `roadmap`, `config`, `verify`, `template`, `scaffold`, `frontmatter`, `validate`, `intel`, `workstream`) to corresponding lib modules

**Hooks:**
- Location: `hooks/*.js` (source), `hooks/dist/` (built output installed to runtime)
- Triggers: AI tool hook events (`PostToolUse` / `AfterTool` depending on runtime)
- Responsibilities: `gsd-statusline.js` (terminal status), `gsd-context-monitor.js` (context exhaustion tracking), `gsd-check-update.js` (version checks), `gsd-workflow-guard.js` (workflow file protection)

**SDK GSD class:**
- Location: `sdk/src/index.ts`
- Triggers: `import { GSD } from '@opengsd/gsd-sdk'` programmatic use
- Responsibilities: `executePlan()`, `runPhase()`, `runMilestone()` — compose plan parsing, prompt building, and session execution

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop for all CLI tools; wave-based parallelism lives at the agent-spawning level (each agent is a separate process/context, not a thread)
- **Global state:** Module-level singletons in `state.cjs` (`_diskScanCache`, `_heldStateLocks`), `planning-workspace.cjs` (`_heldPlanningLocks`, `cachedControllingTtyToken`), `model-profiles.cjs` (`MODEL_PROFILES`). All are process-local.
- **Circular imports:** `core.cjs` is the root dependency imported by almost every other lib module. `state.cjs`, `phase.cjs`, `init.cjs`, `planning-workspace.cjs` all import from `core.cjs`. `phase.cjs` imports `state.cjs`; `state.cjs` does not import `phase.cjs` — no circular dependency at this level.
- **Runtime adaptation:** All command/workflow/agent `.md` files use Claude Code conventions. The installer in `bin/install.js` handles runtime translation (tool names, hook events, frontmatter format, install paths) at install time — not at runtime.
- **No skills: in agent frontmatter:** Prohibited by `tests/agent-frontmatter.test.cjs`; breaks Gemini CLI runtime.
- **cwd as first parameter:** All lib functions that touch `.planning/` accept `cwd` (working directory string) as their first parameter.

## Anti-Patterns

### Direct `.planning/` file writes from agents without gsd-tools.cjs

**What happens:** An agent uses `Write` tool directly on `.planning/STATE.md` or other state files instead of calling `node gsd-tools.cjs state patch`.
**Why it's wrong:** Bypasses file locking (`_heldStateLocks`/`withPlanningLock`), causing concurrent corruption during wave execution. Also skips normalization/migration logic in `state.cjs` and `planning-workspace.cjs`.
**Do this instead:** Always use `node gsd-tools.cjs state patch --field value` or `node gsd-tools.cjs state update <field> <value>` from within agents.

### Non-canonical plan file names

**What happens:** Agent creates a plan file like `01-PLAN-01-foundation.md` instead of `01-foundation-01-PLAN.md`.
**Why it's wrong:** `isCanonicalPlanFile()` in `get-shit-done/bin/lib/phase.cjs` rejects non-canonical names, causing zero plans to be found by `phase-plan-index` and other commands.
**Do this instead:** Name plan files as `{padded_phase}-{NN}-PLAN.md` (e.g., `01-auth-01-PLAN.md`) or use `PLAN.md` for single-plan phases.

### Reading workflows/agents directly into command files

**What happens:** A command file uses `Read` on `~/.claude/agents/gsd-*.md` and re-pastes content inline.
**Why it's wrong:** Breaks the separation of concerns enforced by `agent-frontmatter.test.cjs`; the test validates "no `First, read ~/.claude/agents/gsd-*.md` workarounds" — workflow/command files must spawn agents via `subagent_type:` only.
**Do this instead:** Use `Agent(subagent_type="gsd-executor")` in workflows, or `!cat $HOME/.claude/get-shit-done/workflows/<name>.md` shell-cat in commands.

### Adding `skills:` to agent frontmatter

**What happens:** An agent YAML frontmatter block includes a `skills:` field.
**Why it's wrong:** Breaks Gemini CLI runtime; caught by `tests/agent-frontmatter.test.cjs`.
**Do this instead:** Omit `skills:` entirely from agent frontmatter. The four permitted frontmatter fields are: `name`, `description`, `tools`, `color` (plus optional commented `# hooks:`).

## Error Handling

**Strategy:** Fail-fast with `process.exit(1)` from lib modules; filesystem-based recovery for agent coordination

**Patterns:**
- `error()` in `get-shit-done/bin/lib/core.cjs` writes to stderr and calls `process.exit(1)` — all lib modules use this for unrecoverable errors
- Internal helpers return `null` for not-found conditions rather than throwing
- Lock files (`_heldStateLocks`, `_heldPlanningLocks`) cleaned up via `process.on('exit')` to prevent stale locks on abnormal exit
- Plan revision loop (max 3 iterations) in `get-shit-done/workflows/plan-phase.md` when `gsd-plan-checker` agent fails quality gates
- Wave execution fallback: if agent completes but signal is lost, orchestrator verifies via filesystem (commits + `SUMMARY.md` present) and continues — never blocks indefinitely
- Transient lock retry: `withPlanningLock` retries on `EPERM`, `EBUSY`, `EAGAIN`, `EINTR`, `EINVAL`, `EIO`, `ENOENT`, `ESTALE` (Docker overlay-fs and NFS transients)

## Cross-Cutting Concerns

**Logging:** `get-shit-done/bin/lib/observability/logger.cjs` for CLI layer; `sdk/src/logger.ts` for SDK layer; agents use Bash `echo` or `console.error` for diagnostics
**Validation:** `tests/agent-frontmatter.test.cjs` validates all agent YAML frontmatter on every `npm test` run; `verify.cjs` validates plan structure; `validate.cjs` validates `.planning/` health
**Model resolution:** `model-profiles.cjs` and `model-catalog.cjs` in CLI layer; mirrored in `sdk/src/model-catalog.ts`; runtime-aware resolution in `sdk/src/session-runner.ts` (skips Claude model IDs for non-Claude runtimes)
**Runtime adaptation:** All runtime-specific differences (tool names, hook events, install paths, slash command namespace) handled by `bin/install.js` at install time; source files always use Claude Code conventions

---

*Architecture analysis: 2026-05-25*
