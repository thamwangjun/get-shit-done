# Technology Stack

**Analysis Date:** 2026-05-25

## Languages

**Primary:**
- JavaScript (CommonJS) — CLI tooling layer at `get-shit-done/bin/lib/*.cjs` and `get-shit-done/bin/gsd-tools.cjs`; installer at `bin/install.js`; hooks at `hooks/*.js`; test files at `tests/*.test.cjs`
- TypeScript 5.7 — SDK layer at `sdk/src/*.ts`, compiled to ES2022 ES modules; strict mode enabled

**Secondary:**
- Bash — hook shell scripts at `hooks/gsd-phase-boundary.sh`, `hooks/gsd-session-state.sh`, `hooks/gsd-validate-commit.sh`; CI utility scripts at `scripts/check-env.sh`, `scripts/check-npm-integrity.sh`, `scripts/base64-scan.sh`
- Markdown — all command, workflow, and agent definitions at `commands/gsd/*.md`, `get-shit-done/workflows/*.md`, `agents/*.md`; the framework's primary "source code" for orchestration logic

## Runtime

**Environment:**
- Node.js >=22.0.0 (root package `get-shit-done-cc`)
- Node.js >=22.0.0 (SDK package `@opengsd/gsd-sdk`)
- `.nvmrc` pins to `22` for local development

**Package Manager:**
- npm >=10.0.0
- Lockfile: `package-lock.json` present (lockfileVersion 3) at both root and `sdk/`

## Frameworks

**Core:**
- None — root package is a zero-dependency installer and CLI toolkit; no HTTP framework, no database ORM

**SDK Runtime:**
- `@anthropic-ai/claude-agent-sdk` ^0.2.84 — the only runtime dependency; used in `sdk/src/session-runner.ts` via `query()` calls to drive plan execution against Anthropic's API
- `ws` 8.20.1 — WebSocket server in `sdk/src/ws-transport.ts` for broadcasting GSD events to external consumers
- `synckit` ^0.11.12 — Atomics.wait + SharedArrayBuffer + worker_threads bridge used in `sdk/src/runtime-bridge-sync/index.ts` for synchronous cross-thread calls

**Testing:**
- Node.js built-in `--test` runner — root package tests at `tests/*.test.cjs`; no external test framework
- `vitest` ^3.1.1 (SDK devDep) — unit and integration tests at `sdk/src/**/*.test.ts` and `sdk/src/**/*.integration.test.ts`
- `vitest` ^4.1.2 (root devDep) — workspace config only, `vitest.config.ts` at root routes to SDK projects
- `c8` ^11.0.0 — coverage measurement for root package; target ≥70% line coverage over `get-shit-done/bin/lib/*.cjs`

**Build/Dev:**
- `tsc` (TypeScript 5.7) — SDK compilation via `sdk/tsconfig.json`; target ES2022, module NodeNext, outDir `sdk/dist/`
- `esbuild` ^0.24.0 (via `scripts/build-hooks.js`) — hook bundling and validation, copies to `hooks/dist/`
- `tsx` ^4.22.0 — TypeScript execution for SDK gen scripts (`sdk/scripts/gen-*.ts`)

## Key Dependencies

**Critical:**
- `@anthropic-ai/claude-agent-sdk` ^0.2.84 — only runtime dependency; drives the `query()` API in `sdk/src/session-runner.ts`; also required in `sdk/` as direct dependency
- `ws` 8.20.1 — WebSocket broadcast in `sdk/src/ws-transport.ts`; required in both root and SDK `package.json`
- `synckit` ^0.11.12 — synchronous inter-thread bridge at `sdk/src/runtime-bridge-sync/`; required only in `sdk/package.json`

**Infrastructure:**
- `fallow` ^2.70.0 — optional dependency for file-level dependency auditing (`get-shit-done/bin/lib/fallow-runner.cjs`); resolved as an external binary (`fallow.exe`/`fallow` depending on OS); absent = feature disabled

**Dev / Type-checking:**
- `@types/node` ^22.0.0 — Node.js type definitions for SDK TypeScript compilation
- `@types/ws` ^8.18.1 — WebSocket type definitions for `sdk/src/ws-transport.ts`

## Configuration

**Environment (runtime):**
- `ANTHROPIC_API_KEY` — consumed internally by `@anthropic-ai/claude-agent-sdk`; not referenced in source
- `BRAVE_API_KEY` — optional; enables Brave Search in `sdk/src/query/websearch.ts`; falls back gracefully when absent
- `FIRECRAWL_API_KEY` — optional; enables Firecrawl scraping; detected in `sdk/src/query/config-mutation.ts`
- `EXA_API_KEY` — optional; enables Exa Search; detected in `sdk/src/query/config-mutation.ts`
- `GSD_HOME` — overrides home directory resolution in `get-shit-done/bin/lib/core.cjs`
- `GSD_AGENTS_DIR` — overrides agents directory path in `get-shit-done/bin/lib/core.cjs` and `sdk/src/query/validate.ts`; used in tests
- `GSD_RUNTIME` — overrides runtime detection (`claude`|`opencode`|`gemini`|`codex`|`copilot`|`cursor`|`windsurf`|`augment`|`trae`); used in `sdk/src/query/helpers.ts` and `get-shit-done/bin/lib/runtime-slash.cjs`
- `GSD_WORKSTREAM` — active workstream identifier; used in `sdk/src/cli.ts` and `sdk/src/query/query-runtime-context.ts`
- `GSD_QUERY_FALLBACK` — controls CJS fallback behavior in `sdk/src/query/query-cli-adapter.ts`
- `CLAUDE_CONFIG_DIR`, `OPENCODE_CONFIG_DIR`, `OPENCODE_CONFIG`, `GEMINI_CONFIG_DIR`, `CODEX_HOME`, `COPILOT_CONFIG_DIR`, `CURSOR_CONFIG_DIR`, `WINDSURF_CONFIG_DIR`, `AUGMENT_CONFIG_DIR`, `TRAE_CONFIG_DIR`, `ANTIGRAVITY_CONFIG_DIR`, `KILO_CONFIG_DIR`, `KILO_CONFIG`, `XDG_CONFIG_HOME` — per-runtime config directory overrides in `sdk/src/query/helpers.ts`

**Build:**
- `sdk/tsconfig.json` — TypeScript: target ES2022, module NodeNext, strict, outDir `sdk/dist/`
- `tsconfig.json` (root) — project references only `sdk/`; no root compilation
- `vitest.config.ts` (root) — routes `unit` and `integration` vitest projects to `sdk/src/`
- `sdk/vitest.config.ts` — SDK-level vitest config
- `scripts/build-hooks.js` — validates and copies hook JS files to `hooks/dist/`

**Per-project runtime config:**
- `.planning/config.json` — per-project GSD config; schema defined in `sdk/src/config.ts`; loaded by `get-shit-done/bin/lib/config.cjs`
- Key fields: `model_profile` (balanced/quality/speed/budget/inherit), `parallelization`, `runtime`, `resolve_model_ids`, `brave_search`, `firecrawl`, `exa_search`

## Platform Requirements

**Development:**
- Node.js >=22.0.0; npm >=10.0.0
- git (used by `gsd-tools.cjs` for commit operations and branch management)
- `.nvmrc` pins to Node 22

**CI Matrix:**
- ubuntu-latest, macos-latest, windows-latest on Node 22 and 24
- Install + slow test lanes: Linux and macOS only (Windows excluded due to NTFS/Defender timing)

**Production:**
- Distributed via npm as `get-shit-done-cc` package; also as `@opengsd/gsd-sdk`
- Installed globally (`npm install -g get-shit-done-cc`) or via `npx get-shit-done-cc`
- Target runtimes: Claude Code (`~/.claude/`), OpenCode (`~/.config/opencode/`), Gemini CLI (`~/.gemini/`), Codex (`~/.codex/`), Copilot (`~/.copilot/`), Cursor, Windsurf, Augment, Trae
- No server, no database — all state is local filesystem files in `.planning/`

---

*Stack analysis: 2026-05-25*
