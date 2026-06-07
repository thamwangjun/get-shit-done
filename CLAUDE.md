# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

GSD (Get Shit Done) is a meta-prompting framework that installs slash commands, workflows, agents, and hooks into AI coding tools (Claude Code, OpenCode, Gemini CLI, Codex, Copilot, Antigravity). It solves "context rot" via multi-agent orchestration where each spawned agent gets a fresh 200K-token context window.

## Commands

```bash
npm test 2>&1 | tee /tmp/gsd-test-output.txt                # Run all tests
npm run test:coverage 2>&1 | tee /tmp/gsd-test-output.txt   # Run tests with c8 coverage (requires ≥70% line coverage)
npm run build:hooks                                         # Validate hook syntax and copy to hooks/dist/ (required before npm publish)
```

Run a single test file: `node --test tests/phase.test.cjs`. Tests use Node.js built-in `--test` runner (no external framework); coverage is measured only against `get-shit-done/bin/lib/*.cjs`. Requires Node.js >=20 (SDK) / >=22 (root).

**Running tests efficiently:** Run once, pipe to `/tmp`, then read the file — avoid re-running just to read output: `npm test 2>&1 | tee /tmp/gsd-test-output.txt`.

## Reading Files

When a file is truncated in tool output, a reference path to the full file is provided (e.g. `@file:/path/to/file`). Always read the full file at that path before continuing — never act on truncated content.

## Architecture

```
User → /gsd-command → commands/gsd/*.md → workflows/*.md → agents/*.md → gsd-tools.cjs → .planning/
```

**Four layers:**

1. **Command layer** (`commands/gsd/*.md`) — user-facing slash commands that read a workflow and forward to it.
2. **Workflow layer** (`get-shit-done/workflows/*.md`) — thin orchestrators that call `gsd-tools.cjs init <workflow>` to load context, then spawn specialized agents in parallel or sequence.
3. **Agent layer** (`agents/*.md`) — agent definitions with scoped tool permissions, each spawned with a fresh 200K-token context window.
4. **CLI tools layer** (`get-shit-done/bin/gsd-tools.cjs` + `get-shit-done/bin/lib/*.cjs`) — Node.js CommonJS modules handling state, phase, roadmap, config, frontmatter, templates, etc. Called by agents via Bash to read/write `.planning/` files.

**State** lives entirely in `.planning/` as human-readable Markdown and JSON. `STATE.md` is file-locked (`.planning/STATE.md.lock`) for parallel-safe writes during **wave execution** — independent plans grouped into waves and run in parallel.

## Key Source Files

| Path | Purpose |
|------|---------|
| `bin/install.js` | Installer entry point (3,400+ lines). Detects runtime, copies files, transforms content per target runtime. |
| `get-shit-done/bin/gsd-tools.cjs` | CLI entry point — requires lib modules and dispatches subcommands. |
| `get-shit-done/bin/lib/state.cjs` | STATE.md CRUD, checkpoint progression, metrics |
| `get-shit-done/bin/lib/phase.cjs` | Phase directory operations, decimal phase numbering |
| `get-shit-done/bin/lib/verify.cjs` | Plan structure validation |
| `get-shit-done/bin/lib/init.cjs` | Compound context loading for workflows |
| `get-shit-done/bin/lib/core.cjs` | Low-level file I/O, lock primitives |
| `get-shit-done/bin/lib/config.cjs` | Config CRUD for `.planning/config.json` |
| `get-shit-done/bin/lib/frontmatter.cjs` | YAML frontmatter CRUD for agent/workflow files |
| `hooks/` | Source for four hooks: statusline, context-monitor, check-update, workflow-guard. Edit `hooks/*.js`, then `build:hooks` to copy to `hooks/dist/`. |
| `get-shit-done/references/` | Shared prompt fragments injected into workflows. |
| `get-shit-done/templates/` | Boilerplate markdown agents fill via `gsd-tools.cjs template fill`. |

## Runtime Adaptation

The installer transforms installed files for each target runtime: tool names (`Read`→`read`, `Bash`→`execute`), hook events (`PostToolUse`↔`AfterTool`), agent frontmatter format, and install paths (`~/.claude/`, `~/.config/opencode/`, `~/.gemini/`, etc.). When editing command/workflow/agent `.md` files, use Claude Code conventions — the installer handles runtime translation.

## Adding/Modifying Commands or Workflows

- **Commands** in `commands/gsd/` are thin — they set up context and `Read` the matching workflow.
- **Workflows** in `get-shit-done/workflows/` orchestrate: init → spawn agents → collect results → update state.
- **Agents** in `agents/` declare tool permissions in YAML frontmatter (`name`, `description`, `tools`, `color`, optional `hooks`). Keep each focused on a single responsibility.
- The `gsd-tools.cjs` CLI is the interface between agents and `.planning/`. Run `node get-shit-done/bin/gsd-tools.cjs help` for all commands. Key groups: `scaffold`, `frontmatter`, `verify`, `template fill`, `validate consistency`/`validate health [--repair]`.

## Testing Conventions

- Test files are `tests/*.test.cjs` (CommonJS); each CLI module in `get-shit-done/bin/lib/` has a corresponding test file.
- `tests/helpers.cjs` provides `createTempDir()`, fixtures, and assertion helpers — use these rather than reimplementing.
- `agent-frontmatter.test.cjs` validates YAML frontmatter of all agent files. When adding an agent, satisfy all four rules:
  - **File-writing agents** (any with `Write` in `tools:`) must include the string `Only use the Write tool` (checked case-insensitively) and a commented `# hooks:` in frontmatter.
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

The `docs/` directory holds authoritative documentation: `ARCHITECTURE.md` (system design), `AGENTS.md` (all agents + spawn patterns), `CLI-TOOLS.md` (full gsd-tools.cjs reference), `CONFIGURATION.md` (config.json schema), `FEATURES.md` (feature matrix).

<!-- GSD:project-start source:PROJECT.md -->
## Project

**GSD — Prompt-Engineered Fork**

An opinionated fork of GSD that applies systematic prompt engineering improvements to all prompt content files (agents, commands, workflows). The fork tracks `upstream/main` continuously — each upstream merge is followed by a modification pass bringing new/changed files into conformance with the fork's quality bar. Fork standards in `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md` and `PROMPT_ENGINEERING_GUIDE_V09.md` take precedence over upstream content decisions.

**Core Value:** Every agent, command, and workflow file on `main` meets the fork's quality bar before it ships — upstream content additions are modified, not accepted verbatim.

### Constraints

- **Frontmatter** must be preserved exactly — `agent-frontmatter.test.cjs` validates all agents on every `npm test`.
- **Test precedence**: Fork reference files win; tests asserting upstream-style negative framing are modified, not reverted.
- **No `skills:` in agent frontmatter** — breaks Gemini CLI; upstream sometimes adds this.
- **Positive framing replacement rule**: Negative directives (`do not X`, `never X`, `avoid X`) are replaced with affirmative instructions that state the correct behavior — not merely deleting the prohibition.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

- **Languages**: JavaScript (CommonJS) for the CLI tooling at `get-shit-done/bin/lib/*.cjs`; TypeScript 5.7 for the SDK at `sdk/src/*.ts` (compiled to ES2022); Bash for `hooks/*.sh`; Markdown for command/workflow/agent definitions.
- **Runtime**: Node.js >=22.0.0 (root), >=20.0.0 (SDK); npm with `package-lock.json` (lockfileVersion 3). CI tests Node 22/24 on ubuntu, Node 24 on macos.
- **Frameworks/tooling**: zero-dependency root installer. Node's built-in `--test` runner (no external framework); `c8` for coverage (≥70% target); `vitest` (SDK); `esbuild` for hook bundling; `tsc` for SDK compilation.
- **Sole runtime dependency**: `@anthropic-ai/claude-agent-sdk` (SDK layer only, powers `sdk/src/session-runner.ts` via `query()`). `ws` provides the WebSocket server in `sdk/src/ws-transport.ts`. No DB clients, HTTP frameworks, or auth libs — the system is file-based over `.planning/`.
- **Env vars/config**: `ANTHROPIC_API_KEY` (consumed by the SDK); optional `BRAVE_API_KEY`/`FIRECRAWL_API_KEY`/`EXA_API_KEY` for search; `GSD_HOME` and `GSD_AGENTS_DIR` override path resolution in `core.cjs`. Per-project config at `.planning/config.json` (schema in `sdk/src/config.ts`, loaded by `config.cjs`); key fields: `model_profile`, `parallelization`, `brave_search`, `firecrawl`, `exa_search`, `workflow.*`, `git.*`.
- **Platform**: requires Node.js >=22, npm, and git. Distributed as the npm package `get-shit-done-cc`; installed globally or via `npx`. Target runtimes: Claude Code, OpenCode, Gemini CLI, Codex, Copilot, Antigravity. No server or database.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

- **Naming**: lib/test/helper files use `kebab-case.cjs` / `kebab-case.test.cjs`; bug regression tests are `bug-<issue>-<desc>.test.cjs`. Functions are `camelCase`; CLI handlers are prefixed `cmd` (e.g. `cmdStateLoad`); internal-only helpers suffixed `Internal`. Locals `camelCase`, module constants `SCREAMING_SNAKE_CASE`, temp dirs named `tmpDir`.
- **Code style**: no Prettier/ESLint config — formatting by convention. 2-space indent, single quotes, template literals for multi-token strings. CommonJS only (`require`/`module.exports`) in lib and test code.
- **Comments**: module-level JSDoc at the top of every lib file; `// ─── Section ───` banners; inline comments for non-obvious logic with issue numbers cited inline (`// (#1916)`); `@param`/`@returns` on public helpers.
- **Function design**: `cwd` is the first param for functions touching `.planning/`; `raw` (output-format boolean) is last on CLI-facing functions; options objects used at 3+ optional args. Helpers return plain values or `null` for not-found rather than throwing; CLI handlers write via `output()` and return `undefined`.
- **Output**: raw mode writes `String(rawValue)`; JSON mode pretty-prints; payloads >50KB are written to a temp file and emitted as `@file:/path.json`. Always `fs.writeSync(1, data)` (synchronous, avoids pipe teardown race).
- **Module design**: single trailing `module.exports = { ... }` per lib file listing all exports; non-shared helpers are not exported.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

(Detail beyond the top-level "## Architecture" summary above.)

- **Key abstractions**: A **phase** is a unit of work (PLAN.md/SUMMARY.md), with decimal sub-phases (`phase-1.1`) sorted by `comparePhaseNum()` in `phase.cjs`. A **wave** groups dependency-free plans for parallel execution — `execute-phase.md` analyzes `depends_on` in PLAN frontmatter. **Gates** are mandatory checkpoints (Confirm/Quality/Safety/Transition) wired into `gsd-plan-checker` and `gsd-verifier`. **References** are shared knowledge fragments injected via `@-reference`; **templates** are boilerplate filled by `template fill`.
- **Entry points**: `bin/install.js` (runtime detection + file copy/transform on `npx get-shit-done`); `gsd-tools.cjs` (routes `init`, `state`, `phase`, `roadmap`, `config`, `verify`, `template`, `scaffold`, `frontmatter`, `validate`); `hooks/*.js` (statusline, context-monitor, check-update, workflow-guard) fired on AI-tool hook events.
- **Error handling**: `error()` in `core.cjs` exits with a message; lock files in `_heldStateLocks`/`_heldPlanningLocks` are removed on `process.on('exit')`. The plan revision loop runs max 3 iterations when `gsd-plan-checker` fails. If a named subagent type is unavailable, workflows fall back to inline execution; if a wave agent's completion signal is lost, the workflow verifies via filesystem (commits + SUMMARY.md) and continues.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills under `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync. Entry points:
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
