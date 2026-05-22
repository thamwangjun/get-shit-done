---
updated_at: "2026-05-01T00:00:00.000Z"
---

## Architecture Overview

**Meta-prompting and spec-driven development system for AI coding agents.**

The project is an npm package (`get-shit-done-cc` v1.37.1) that installs into AI agent environments (Claude Code, OpenCode, Gemini CLI, Codex, Copilot) to provide a structured workflow layer. It has two main execution paths:

1. **Legacy CJS tooling** (`get-shit-done/bin/gsd-tools.cjs` + `lib/*.cjs`) — invoked by agents and workflows via `node gsd-tools.cjs <command>`. This is the stable, widely-used path.
2. **TypeScript SDK** (`sdk/` as `@gsd-build/sdk`) — a higher-level programmatic API wrapping the Agent SDK that exposes `GSD`, `PhaseRunner`, and `InitRunner` classes. CLI entry: `gsd-sdk`.

## Key Components

| Component | Path | Responsibility |
|-----------|------|----------------|
| Installer | `bin/install.js` | CLI entry for `npx get-shit-done-cc` — writes agents, commands, hooks to target AI env |
| GSD Tools (legacy) | `get-shit-done/bin/gsd-tools.cjs` | Central CLI utility (~130+ subcommands): state, phase, roadmap, config, template, verify, intel, milestone, audit, uat, websearch, workstream |
| GSD Tools lib | `get-shit-done/bin/lib/*.cjs` | Modular CJS libraries: core, config, state, phase, roadmap, milestone, verify, template, intel, security, etc. (25 modules) |
| SDK entry | `sdk/src/index.ts` | Public API: `GSD` class, `PhaseRunner`, `InitRunner`, all re-exports |
| SDK CLI | `sdk/src/cli.ts` | `gsd-sdk` binary — run/phase/plan/init/auto/query subcommands |
| Query registry | `sdk/src/query/` | 40+ typed query handlers: state, config, phase-lifecycle, roadmap, verify, template, commit, intel, init, skills, summary, workstream, uat, websearch, profile, progress, pipeline |
| Session runner | `sdk/src/session-runner.ts` | Drives `@anthropic-ai/claude-agent-sdk` sessions for plan execution |
| Phase runner | `sdk/src/phase-runner.ts` | State machine: discuss → research → plan → execute → verify → advance |
| Context engine | `sdk/src/context-engine.ts` | Assembles per-phase context files from `.planning/` |
| Prompt factory | `sdk/src/phase-prompt.ts` | Builds step-specific prompts from workflow markdown templates |
| Event stream | `sdk/src/event-stream.ts` | Node EventEmitter-based event bus; transports: CLITransport, WSTransport |
| Agents | `agents/*.md` (31 files) | AI agent definitions: gsd-executor, gsd-planner, gsd-verifier, gsd-debugger, etc. |
| Commands | `commands/gsd/*.md` (79 files) | Slash command definitions for Claude Code and other AI environments |
| Workflows | `get-shit-done/workflows/*.md` (80 files) | Agent-facing workflow prompts (mirrors commands/) |
| References | `get-shit-done/references/*.md` (48 files) | Contextual reference docs loaded by agents at runtime |
| Templates | `get-shit-done/templates/*.md` | Markdown templates for PLAN.md, SUMMARY.md, ROADMAP.md, STATE.md, etc. |
| Hooks | `hooks/*.js` (8 files) | Pre/post tool hooks: prompt guard, workflow guard, read guard, statusline, context monitor, check-update, check-update-worker, read-injection-scanner |
| Tests | `tests/*.test.cjs` | CJS test suite covering commands, agents, bugfixes, install scenarios |

## Data Flow

```
User → /gsd-command → workflow .md → gsd-tools.cjs (or gsd-sdk query) → .planning/ files
                                                                        → git commits
                                                                        → AI agent spawns

gsd-sdk run <prompt> → GSD.run() → PhaseRunner.run() → ContextEngine (reads .planning/)
                                                      → PromptFactory (reads workflows/)
                                                      → SessionRunner → claude-agent-sdk query()
                                                      → GSDTools (writes STATE.md, ROADMAP.md)
```

## Conventions

- **File naming:** agents use `gsd-<role>.md`, commands use kebab-case `.md`, lib modules use `<domain>.cjs`
- **PLAN.md schema:** YAML frontmatter (phase, plan, type, wave, depends_on, must_haves) + XML task blocks
- **STATE.md:** YAML frontmatter tracking current phase, plan, model profile, progress metrics
- **ROADMAP.md:** Markdown with phase table tracking completion status (checkbox `[x]`)
- **Workstream isolation:** `--ws <name>` routes `.planning/` to `.planning/workstreams/<name>/`
- **Multi-runtime support:** Installer adapts agents/commands to Claude Code, Gemini CLI, Codex, Copilot, Cursor, Windsurf, Kilo, Trae, OpenCode
- **Config:** `.planning/config.json` controls model profiles, workflow flags, hooks opt-in
- **Intel files:** `.planning/intel/` — 5 JSON/MD files (stack, files, apis, deps, arch) refreshed by `gsd-intel-updater` agent
- **Phase directory:** `.planning/phases/<N>-<slug>/` contains PLAN.md, SUMMARY.md, CONTEXT.md, VERIFICATION.md
- **Query registry pattern:** `sdk/src/query/index.ts` registers all handlers in `createRegistry()`; both dotted (`state.update`) and space-delimited (`state update`) aliases are registered for CJS compatibility
- **Test naming:** Tests use descriptive names; bug regression tests named `bug-<issue>-<slug>.test.cjs`
