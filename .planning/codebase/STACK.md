# Technology Stack

**Analysis Date:** 2026-04-15

## Languages

**Primary:**
- JavaScript (CommonJS) — CLI tooling layer at `get-shit-done/bin/lib/*.cjs` and `get-shit-done/bin/gsd-tools.cjs`
- TypeScript 5.7 — SDK at `sdk/src/*.ts`, compiled to ES2022 modules

**Secondary:**
- Bash — hooks at `hooks/gsd-phase-boundary.sh`, `hooks/gsd-session-state.sh`, `hooks/gsd-validate-commit.sh`
- Markdown — command, workflow, and agent definitions at `commands/gsd/*.md`, `get-shit-done/workflows/*.md`, `agents/*.md`

## Runtime

**Environment:**
- Node.js >=22.0.0 (root package); Node.js >=20.0.0 (SDK package)
- CI matrix tests Node 22 and 24 on ubuntu-latest, Node 24 on macos-latest

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present (lockfileVersion 3)

## Frameworks

**Core:**
- None — the root package is a zero-dependency installer and CLI toolkit
- `@anthropic-ai/claude-agent-sdk` ^0.2.84 — SDK layer only, powers `sdk/src/session-runner.ts` via `query()` calls

**Testing (root):**
- Node.js built-in `--test` runner — no external test framework; tests at `tests/*.test.cjs`
- `c8` ^11.0.0 — coverage measurement; target ≥70% line coverage for `get-shit-done/bin/lib/*.cjs`

**Testing (SDK):**
- `vitest` ^3.1.1 (SDK), ^4.1.2 (root devDep for workspace config) — unit and integration test runner
- Config at `vitest.config.ts` (root) and `sdk/vitest.config.ts`

**Build/Dev:**
- `esbuild` ^0.24.0 — hook bundling via `scripts/build-hooks.js`
- `tsc` (TypeScript 5.7) — SDK compilation; config at `sdk/tsconfig.json`

## Key Dependencies

**Critical:**
- `@anthropic-ai/claude-agent-sdk` ^0.2.84 — the only runtime dependency; used in `sdk/src/session-runner.ts` to call `query()` and stream agent messages
- `ws` ^8.20.0 — WebSocket server in `sdk/src/ws-transport.ts` for broadcasting GSD events to external consumers

**Infrastructure:**
- No database clients, no HTTP frameworks, no auth libraries — the system is file-based, operating entirely on `.planning/` Markdown and JSON files

## Configuration

**Environment:**
- `ANTHROPIC_API_KEY` — consumed by `@anthropic-ai/claude-agent-sdk` at runtime; not referenced directly in source (SDK reads it internally)
- `BRAVE_API_KEY` — optional; enables Brave Search in `sdk/src/query/websearch.ts`
- `FIRECRAWL_API_KEY` — optional; enables Firecrawl scraping, detected in `sdk/src/query/config-mutation.ts`
- `EXA_API_KEY` — optional; enables Exa Search, detected in `sdk/src/query/init-complex.ts`
- `GSD_HOME` — overrides home directory resolution in `get-shit-done/bin/lib/core.cjs:399`
- `GSD_AGENTS_DIR` — overrides agents directory path in `get-shit-done/bin/lib/core.cjs:1280`; used in tests
- `HOME` — standard home resolution fallback

**Project config:**
- `.planning/config.json` — per-project config; schema defined in `sdk/src/config.ts`; loaded by `get-shit-done/bin/lib/config.cjs`
- Key fields: `model_profile` (balanced/quality/speed), `parallelization`, `brave_search`, `firecrawl`, `exa_search`, `workflow.*`, `git.*`

**Build:**
- `sdk/tsconfig.json` — TypeScript compiler: target ES2022, module NodeNext, strict mode, outDir `sdk/dist/`
- `tsconfig.json` (root) — references only `sdk/`; no root compilation
- `scripts/build-hooks.js` — validates and copies hook JS files to `hooks/dist/`

## Platform Requirements

**Development:**
- Node.js >=22.0.0
- npm (lockfile present)
- git (used by `gsd-tools.cjs` for commit operations and branch management)

**Production:**
- Distributed via npm as `get-shit-done-cc` package
- Installed globally or via `npx get-shit-done-cc`
- Target runtimes: Claude Code (`~/.claude/`), OpenCode (`~/.config/opencode/`), Gemini CLI (`~/.gemini/`), Codex, Copilot, Antigravity
- No server or database — all state is local filesystem files in `.planning/`

---

*Stack analysis: 2026-04-15*
