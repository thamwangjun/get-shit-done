# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

GSD (Get Shit Done) is a meta-prompting framework that installs slash commands, workflows, agents, and hooks into AI coding tools (Claude Code, OpenCode, Gemini CLI, Codex, Copilot, Antigravity). It solves "context rot" via multi-agent orchestration where each spawned agent gets a fresh context window.

## Commands

```bash
npm test                  # Run all tests
npm run test:coverage     # Run tests with c8 coverage (requires ≥70% line coverage)
npm run build:hooks       # Validate hook syntax and copy to hooks/dist/ (required before npm publish)
```

To run a single test file:
```bash
node --test tests/phase.test.cjs
```

Tests use Node.js built-in `--test` runner (no external test framework). Coverage is measured only against `get-shit-done/bin/lib/*.cjs`. Requires Node.js >=20.

## Architecture

```
User → /gsd-command → commands/gsd/*.md → workflows/*.md → agents/*.md → gsd-tools.cjs → .planning/
```

**Four layers:**

1. **Command layer** (`commands/gsd/*.md`) — 46 user-facing slash commands that read a workflow and forward to it.
2. **Workflow layer** (`get-shit-done/workflows/*.md`) — 52 thin orchestrators. They call `gsd-tools.cjs init <workflow>` to load context, then spawn specialized agents in parallel or sequence.
3. **Agent layer** (`agents/*.md`) — 16 agent definitions with scoped tool permissions. Each agent is spawned with a fresh 200K-token context window.
4. **CLI tools layer** (`get-shit-done/bin/gsd-tools.cjs` + `get-shit-done/bin/lib/*.cjs`) — 14 Node.js CommonJS modules handling state, phase, roadmap, config, frontmatter, templates, etc. These are called by agents via Bash to read/write `.planning/` files.

**State** lives entirely in `.planning/` as human-readable Markdown and JSON. `STATE.md` is file-locked (`.planning/STATE.md.lock`) for parallel-safe writes during **wave execution** — where independent plans are grouped into waves and run in parallel.

## Key Source Files

| Path | Purpose |
|------|---------|
| `bin/install.js` | Installer entry point (3,400+ lines). Detects runtime, copies files, transforms content per target runtime. |
| `get-shit-done/bin/lib/state.cjs` | STATE.md CRUD, checkpoint progression, metrics |
| `get-shit-done/bin/lib/phase.cjs` | Phase directory operations, decimal phase numbering |
| `get-shit-done/bin/lib/verify.cjs` | Plan structure validation |
| `get-shit-done/bin/lib/init.cjs` | Compound context loading for workflows |
| `get-shit-done/bin/lib/commands.cjs` | Slug generation, todos, session stats |
| `get-shit-done/bin/lib/core.cjs` | Low-level file I/O, lock primitives |
| `get-shit-done/bin/lib/milestone.cjs` | Milestone CRUD |
| `get-shit-done/bin/lib/config.cjs` | Config CRUD for `.planning/config.json` |
| `get-shit-done/bin/lib/frontmatter.cjs` | YAML frontmatter CRUD for agent/workflow files |
| `get-shit-done/bin/lib/model-profiles.cjs` | Model profile resolution (balanced/opus/fast) |
| `get-shit-done/bin/lib/profile-output.cjs` | User profile output formatting |
| `get-shit-done/bin/lib/profile-pipeline.cjs` | User profile pipeline orchestration |
| `get-shit-done/bin/lib/roadmap.cjs` | Roadmap/plan CRUD |
| `get-shit-done/bin/lib/template.cjs` | Template fill operations |
| `hooks/` | Source for four hooks: statusline, context-monitor, check-update, workflow-guard. Edit `hooks/*.js`, then run `build:hooks` to copy to `hooks/dist/`. |
| `get-shit-done/references/` | Shared prompt fragments injected into workflows (questioning.md, verification-patterns.md, model-profiles.md, etc.) |
| `get-shit-done/templates/` | Boilerplate markdown files agents fill in via `gsd-tools.cjs template fill` (30+ templates) |
| `tests/helpers.cjs` | Shared test utilities: `runGsdTools()`, `createTempProject()`, `createTempGitProject()`, `cleanup()` |

## Runtime Adaptation

The installer transforms installed files for each target runtime:
- **Tool names**: `Read`→`read`, `Bash`→`execute`, etc.
- **Hook events**: `PostToolUse`↔`AfterTool`
- **Agent frontmatter** format
- **Install paths**: `~/.claude/` (Claude), `~/.config/opencode/` (OpenCode), `~/.gemini/` (Gemini), etc.

When editing command/workflow/agent `.md` files, use Claude Code conventions. The installer handles runtime translation.

## Adding/Modifying Commands or Workflows

- **Commands** in `commands/gsd/` are thin — they set up context and call `Read` on the matching workflow file.
- **Workflows** in `get-shit-done/workflows/` do the orchestration. They follow a strict pattern: init → spawn agents → collect results → update state.
- **Agents** in `agents/` declare tool permissions in YAML frontmatter (`name`, `description`, `tools`, `color`, optional `hooks`). Keep agents focused on a single responsibility. The `agent-frontmatter.test.cjs` validates all agent files — update it when adding agents.
- The `gsd-tools.cjs` CLI is the interface between agents and `.planning/`. Run `node get-shit-done/bin/gsd-tools.cjs help` to see all commands. Key subcommand groups:
  - `scaffold` — create context, uat, verification, phase-dir scaffolding
  - `frontmatter` — CRUD on agent/workflow YAML frontmatter
  - `verify` — plan-structure, phase-completeness, references, commits, artifacts
  - `template fill` — fill templates with project context
  - `validate consistency` / `validate health [--repair]`

## Testing Conventions

- Test files are `tests/*.test.cjs` (CommonJS).
- Each CLI module in `get-shit-done/bin/lib/` has a corresponding test file.
- `tests/helpers.cjs` provides `createTempDir()`, fixture utilities, and assertion helpers — use these rather than reimplementing.
- `agent-frontmatter.test.cjs` validates YAML frontmatter of all agent files. When adding an agent, satisfy all four rules it enforces:
  - **File-writing agents** (any agent with `Write` in `tools:`) must include the string `Only use the Write tool` (positive instruction, checked case-insensitively) and `# hooks:` commented in frontmatter.
  - **No agent** may have `skills:` in frontmatter — breaks Gemini CLI.
  - **Workflow/command files** must spawn agents via `subagent_type:` — no `First, read ~/.claude/agents/gsd-*.md` workarounds.
  - Add the new agent name to the valid agent list in the test.

## Configuration

`config.json` in `.planning/` controls workflow behavior. Key settings:
- `mode`: `yolo` (auto-approve) or `interactive` (confirm)
- `parallelization.enabled`: run independent plans in parallel waves
- Absent keys default to `true` (absent = enabled pattern)

Model profiles (`balanced` default): Opus for planning, Sonnet for execution/verification. Override per project via `model_profile` in config.

## Deep-Dive References

The `docs/` directory has authoritative documentation for complex topics:
- `docs/ARCHITECTURE.md` — system design deep-dive
- `docs/AGENTS.md` — all agents with tool requirements and spawn patterns
- `docs/CLI-TOOLS.md` — full gsd-tools.cjs subcommand reference
- `docs/CONFIGURATION.md` — complete config.json schema
- `docs/FEATURES.md` — feature matrix

<!-- GSD:project-start source:PROJECT.md -->
## Project

**GSD — Prompt-Engineered Fork**

An opinionated fork of the GSD (Get Shit Done) framework that applies systematic prompt engineering improvements to all prompt content files: agents, commands, and workflows. The fork tracks `upstream/main` continuously — each upstream merge is followed by a modification pass that brings new and changed files into conformance with the fork's quality bar. The fork's standards, defined in `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md` and `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md`, take precedence over upstream content decisions.

**Core Value:** Every agent, command, and workflow file on `main` meets the fork's prompt engineering quality bar before it ships — upstream content additions are modified, not accepted verbatim.

### Constraints

- **Frontmatter**: Agent YAML frontmatter (`name`, `description`, `tools`, `color`, `hooks`) must be preserved exactly — `agent-frontmatter.test.cjs` validates all agents on every `npm test` run
- **Test precedence**: Fork reference files take precedence; tests that assert for upstream-style negative framing are modified, not reverted
- **No `skills:` in agent frontmatter** — breaks Gemini CLI runtime; upstream sometimes adds this
- **Positive framing replacement rule**: Negative directives (`do not X`, `never X`, `avoid X`) are replaced with affirmative instructions that state what to do instead — the replacement must specify the correct behavior, not merely delete the prohibition
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- JavaScript (CommonJS) — CLI tooling layer at `get-shit-done/bin/lib/*.cjs` and `get-shit-done/bin/gsd-tools.cjs`
- TypeScript 5.7 — SDK at `sdk/src/*.ts`, compiled to ES2022 modules
- Bash — hooks at `hooks/gsd-phase-boundary.sh`, `hooks/gsd-session-state.sh`, `hooks/gsd-validate-commit.sh`
- Markdown — command, workflow, and agent definitions at `commands/gsd/*.md`, `get-shit-done/workflows/*.md`, `agents/*.md`
## Runtime
- Node.js >=22.0.0 (root package); Node.js >=20.0.0 (SDK package)
- CI matrix tests Node 22 and 24 on ubuntu-latest, Node 24 on macos-latest
- npm
- Lockfile: `package-lock.json` present (lockfileVersion 3)
## Frameworks
- None — the root package is a zero-dependency installer and CLI toolkit
- `@anthropic-ai/claude-agent-sdk` ^0.2.84 — SDK layer only, powers `sdk/src/session-runner.ts` via `query()` calls
- Node.js built-in `--test` runner — no external test framework; tests at `tests/*.test.cjs`
- `c8` ^11.0.0 — coverage measurement; target ≥70% line coverage for `get-shit-done/bin/lib/*.cjs`
- `vitest` ^3.1.1 (SDK), ^4.1.2 (root devDep for workspace config) — unit and integration test runner
- Config at `vitest.config.ts` (root) and `sdk/vitest.config.ts`
- `esbuild` ^0.24.0 — hook bundling via `scripts/build-hooks.js`
- `tsc` (TypeScript 5.7) — SDK compilation; config at `sdk/tsconfig.json`
## Key Dependencies
- `@anthropic-ai/claude-agent-sdk` ^0.2.84 — the only runtime dependency; used in `sdk/src/session-runner.ts` to call `query()` and stream agent messages
- `ws` ^8.20.0 — WebSocket server in `sdk/src/ws-transport.ts` for broadcasting GSD events to external consumers
- No database clients, no HTTP frameworks, no auth libraries — the system is file-based, operating entirely on `.planning/` Markdown and JSON files
## Configuration
- `ANTHROPIC_API_KEY` — consumed by `@anthropic-ai/claude-agent-sdk` at runtime; not referenced directly in source (SDK reads it internally)
- `BRAVE_API_KEY` — optional; enables Brave Search in `sdk/src/query/websearch.ts`
- `FIRECRAWL_API_KEY` — optional; enables Firecrawl scraping, detected in `sdk/src/query/config-mutation.ts`
- `EXA_API_KEY` — optional; enables Exa Search, detected in `sdk/src/query/init-complex.ts`
- `GSD_HOME` — overrides home directory resolution in `get-shit-done/bin/lib/core.cjs:399`
- `GSD_AGENTS_DIR` — overrides agents directory path in `get-shit-done/bin/lib/core.cjs:1280`; used in tests
- `HOME` — standard home resolution fallback
- `.planning/config.json` — per-project config; schema defined in `sdk/src/config.ts`; loaded by `get-shit-done/bin/lib/config.cjs`
- Key fields: `model_profile` (balanced/quality/speed), `parallelization`, `brave_search`, `firecrawl`, `exa_search`, `workflow.*`, `git.*`
- `sdk/tsconfig.json` — TypeScript compiler: target ES2022, module NodeNext, strict mode, outDir `sdk/dist/`
- `tsconfig.json` (root) — references only `sdk/`; no root compilation
- `scripts/build-hooks.js` — validates and copies hook JS files to `hooks/dist/`
## Platform Requirements
- Node.js >=22.0.0
- npm (lockfile present)
- git (used by `gsd-tools.cjs` for commit operations and branch management)
- Distributed via npm as `get-shit-done-cc` package
- Installed globally or via `npx get-shit-done-cc`
- Target runtimes: Claude Code (`~/.claude/`), OpenCode (`~/.config/opencode/`), Gemini CLI (`~/.gemini/`), Codex, Copilot, Antigravity
- No server or database — all state is local filesystem files in `.planning/`
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- Source lib modules: `kebab-case.cjs` (e.g., `core.cjs`, `model-profiles.cjs`, `profile-pipeline.cjs`)
- Test files: `kebab-case.test.cjs` — one test file per lib module plus many integration/regression tests
- Bug regression tests: `bug-<issue-number>-<description>.test.cjs` (e.g., `bug-1891-file-resolution.test.cjs`)
- Helper scripts: `kebab-case.cjs` in `scripts/`
- All functions use `camelCase` (e.g., `findProjectRoot`, `atomicWriteFileSync`, `comparePhaseNum`)
- CLI command handler functions are prefixed with `cmd` (e.g., `cmdPhasesList`, `cmdStateLoad`, `cmdStatePatch`)
- Internal-only helpers are suffixed with `Internal` (e.g., `findPhaseInternal`, `generateSlugInternal`, `resolveModelInternal`)
- Boolean predicates use `is`/`has`/`can` prefix implicitly via natural English (e.g., `stateExists`, `configExists`)
- `camelCase` for local variables
- `SCREAMING_SNAKE_CASE` for module-level constants (e.g., `CONFIG_DEFAULTS`, `WORKSTREAM_SESSION_ENV_KEYS`, `TEST_ENV_BASE`)
- Temporary directory variables named `tmpDir`
- No TypeScript; runtime type checks only
- Module-level constant objects with `SCREAMING_SNAKE_CASE` keys
- `tsconfig.json` and `vitest.config.ts` exist for tooling but the runtime code is all CommonJS
## Code Style
- No Prettier or ESLint config detected in the repository root — formatting is maintained by convention
- 2-space indentation (consistent across all `get-shit-done/bin/lib/*.cjs` files)
- Single quotes for string literals in most places
- Template literals used for multi-token string construction
- CommonJS only (`require`, `module.exports`) — no ES modules in lib or test code
- All lib files: `'use strict'` is implied but not always declared explicitly
- `scripts/run-tests.cjs` uses `'use strict';` explicitly
## Section Organization Within Files
## Import Organization
## Error Handling
## Output
- In raw mode: writes `String(rawValue)` directly
- In JSON mode: serializes `result` as pretty-printed JSON
- For large payloads (>50KB): writes to a temp file and outputs `@file:/path/to/file.json`
- Always uses `fs.writeSync(1, data)` (synchronous, avoids pipe teardown race)
## Concurrency Primitives
## Comments
- Module-level JSDoc block at the top of every lib file naming the module and its purpose
- Section separator banners (`// ─── Section Name ───`) to group related functions
- Inline comments for non-obvious logic, especially around concurrency, OS edge cases, and issue references
- Issue numbers cited inline: `// (#1916)`, `// fix #1967`
- Used on public/exported functions that are called by many consumers
- `@param` and `@returns` tags used on helper functions
## Function Design
- `cwd` (working directory string) is the first parameter for all functions that touch `.planning/`
- `raw` (boolean) is last parameter on CLI-facing functions that control output format
- Options objects used when a command has 3+ optional args (e.g., `cmdPhasesList(cwd, options, raw)`)
- Internal helpers return plain values or `null` for not-found
- CLI command handlers write to stdout via `output()` and return `undefined`
- Functions that can fail return `null` rather than throwing
## Module Design
- Single `module.exports = { ... }` block at the end of each lib file listing all exported names
- Internal helpers not needed by other modules are not exported (not prefixed, not in exports block)
- `get-shit-done/bin/gsd-tools.cjs` is the CLI entry point that requires lib modules and dispatches commands
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Four discrete layers: Commands → Workflows → Agents → CLI Tools
- All state is human-readable Markdown/JSON stored in `.planning/` — no database, no server
- Fresh 200K-token context window per spawned agent (solves "context rot")
- Thin orchestrators: workflows only coordinate, agents do the heavy lifting
- Absent = enabled pattern for all feature flags in `config.json`
## Layers
- Purpose: User-facing entry points that bootstrap workflow execution
- Location: `commands/gsd/*.md`
- Contains: YAML frontmatter (name, description, allowed-tools) + prompt body that reads matching workflow
- Depends on: Workflow layer via `@~/.claude/get-shit-done/workflows/*.md` references
- Used by: AI coding tool runtime (Claude Code slash commands, Codex skills, Copilot slash commands)
- Purpose: Orchestration logic — never does heavy lifting, only coordinates
- Location: `get-shit-done/workflows/*.md`
- Contains: Step-by-step orchestration: init → spawn agents → collect results → update state
- Depends on: CLI tools layer (`gsd-tools.cjs init <workflow>`) and Agent layer (via `Task(subagent_type=...)`)
- Used by: Command layer (commands read and execute workflows)
- Purpose: Specialized task executors, each spawned with a fresh context window
- Location: `agents/*.md` (31 agents), `sdk/prompts/agents/` (SDK variants)
- Contains: YAML frontmatter (`name`, `description`, `tools`, `color`, optional `hooks`) + role instructions
- Depends on: CLI tools layer via Bash calls to `gsd-tools.cjs`, file-based state in `.planning/`
- Used by: Workflow layer orchestrators
- Purpose: Low-level Node.js interface between agents/workflows and `.planning/` state
- Location: `get-shit-done/bin/gsd-tools.cjs` (entry point), `get-shit-done/bin/lib/*.cjs` (modules)
- Contains: State CRUD, phase operations, roadmap parsing, config, template filling, verification
- Depends on: `.planning/` directory on filesystem
- Used by: Workflows (via Bash in init step), agents (via Bash for state reads/writes)
## Data Flow
- STATE.md is the central project checkpoint file at `.planning/STATE.md`
- File-locked via `.planning/STATE.md.lock` for parallel-safe writes during wave execution
- `state.cjs` provides CRUD, checkpoint progression, and metrics
- Lock cleanup registered via `process.on('exit')` to prevent stale locks
## Key Abstractions
- Purpose: Represents a unit of work with a plan, research, and execution artifacts
- Examples: `.planning/phases/phase-1/PLAN.md`, `.planning/phases/phase-1/SUMMARY.md`
- Pattern: Decimal sub-phases supported (e.g., `phase-1.1`, `phase-2.3`). Directories sorted numerically by `comparePhaseNum()` in `get-shit-done/bin/lib/phase.cjs`
- Purpose: Group of plans with no inter-dependencies, safe to execute in parallel
- Examples: Referenced in `get-shit-done/workflows/execute-phase.md`
- Pattern: Workflow performs dependency analysis on `task.depends_on` fields in PLAN.md frontmatter, groups independent tasks into waves, executes each wave's agents in parallel
- Purpose: Mandatory quality checkpoints before progressing between pipeline stages
- Examples: `get-shit-done/references/gates.md`, `get-shit-done/references/gate-prompts.md`
- Pattern: Four canonical gate types — Confirm, Quality, Safety, Transition — wired into `gsd-plan-checker` and `gsd-verifier` agents
- Purpose: Shared knowledge fragments injected via `@-reference` syntax into workflows and agents
- Examples: `get-shit-done/references/verification-patterns.md`, `get-shit-done/references/model-profiles.md`
- Pattern: Workflows include `<required_reading>` blocks; agents read references before acting
- Purpose: Pre-structured Markdown boilerplate for planning artifacts
- Examples: `get-shit-done/templates/project.md`, `get-shit-done/templates/phase-prompt.md`
- Pattern: Filled by `gsd-tools.cjs template fill` with project context
## Entry Points
- Location: `bin/install.js` (3,400+ lines)
- Triggers: `npx get-shit-done` or direct invocation during setup
- Responsibilities: Detect runtime, copy agents/workflows/commands/hooks to runtime-specific install paths, transform tool names/hook events/frontmatter per target runtime
- Location: `get-shit-done/bin/gsd-tools.cjs`
- Triggers: Called via Bash by workflows/agents — e.g., `node ~/.claude/get-shit-done/bin/gsd-tools.cjs state load`
- Responsibilities: Route subcommands (`init`, `state`, `phase`, `roadmap`, `config`, `verify`, `template`, `scaffold`, `frontmatter`, `validate`) to corresponding lib modules
- Location: `hooks/*.js` (source), `hooks/dist/` (built output installed to runtime)
- Triggers: AI tool hook events (PostToolUse / AfterTool depending on runtime)
- Responsibilities: `gsd-statusline.js` (terminal status), `gsd-context-monitor.js` (context exhaustion tracking), `gsd-check-update.js` (version checks), `gsd-workflow-guard.js` (workflow file protection)
## Error Handling
- `error()` in `get-shit-done/bin/lib/core.cjs` calls `process.exit(1)` with message — all lib modules use this
- Lock files tracked in `_heldStateLocks` / `_heldPlanningLocks` Sets, removed on `process.on('exit')`
- Plan revision loop (max 3 iterations) in `plan-phase.md` workflow when `gsd-plan-checker` fails
- Agent fallback: if named subagent type unavailable, workflows detect via `agents_installed` from init JSON and may fall back to inline execution
- Wave execution: if agent completes but signal is lost, workflow verifies via filesystem (commits + SUMMARY.md exist) and continues
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
