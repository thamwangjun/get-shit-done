# External Integrations

**Analysis Date:** 2026-04-15

## APIs & External Services

**AI / Agent Runtime:**
- Anthropic Claude Agent SDK — powers headless plan execution in `sdk/src/session-runner.ts`
  - SDK/Client: `@anthropic-ai/claude-agent-sdk` ^0.2.84 (`sdk/package.json`)
  - Auth: `ANTHROPIC_API_KEY` (read by SDK internally, not referenced in GSD source)
  - Usage: `query()` function streams `SDKMessage` objects; model resolved from `model_profile` config

**Web Search (optional, all three are independent):**
- Brave Search API — web search for researcher agents in `sdk/src/query/websearch.ts`
  - Auth: `BRAVE_API_KEY` env var or `~/.gsd/brave_api_key` file
  - Endpoint: `https://api.search.brave.com/res/v1/web/search`
  - Enabled via: `brave_search: true` in `.planning/config.json`
- Firecrawl — web scraping integration; detected in `sdk/src/query/config-mutation.ts:352`
  - Auth: `FIRECRAWL_API_KEY` env var or `~/.gsd/firecrawl_api_key` file
  - Enabled via: `firecrawl: true` in `.planning/config.json`
  - Note: detection only in config-mutation; no direct HTTP call found in SDK source (uses Claude tool)
- Exa Search — semantic web search; detected in `sdk/src/query/init-complex.ts:75`
  - Auth: `EXA_API_KEY` env var or `~/.gsd/exa_api_key` file
  - Enabled via: `exa_search: true` in `.planning/config.json`
  - Note: detection only; routes through agent tool, not direct HTTP call

**npm Registry:**
- Package published as `get-shit-done-cc` to the public npm registry
- Release automation in `.github/workflows/release.yml` triggers `npm publish`
- SDK published separately as `@gsd-build/sdk` from `sdk/` directory

## Data Storage

**Databases:**
- None — no database clients or external storage

**File Storage:**
- Local filesystem only — all state lives in `.planning/` directory as Markdown and JSON
- Key files: `.planning/STATE.md`, `.planning/config.json`, `.planning/ROADMAP.md`
- File locking: `.planning/STATE.md.lock` for parallel-safe writes (implemented in `get-shit-done/bin/lib/core.cjs`)

**Caching:**
- None detected

## Authentication & Identity

**Auth Provider:**
- None — no user authentication system
- API keys for optional services (`BRAVE_API_KEY`, `FIRECRAWL_API_KEY`, `EXA_API_KEY`) are plain env vars or files in `~/.gsd/`
- Anthropic auth is handled entirely by `@anthropic-ai/claude-agent-sdk`

## Monitoring & Observability

**Error Tracking:**
- None — no Sentry, Datadog, or similar integration

**Logs:**
- `sdk/src/logger.ts` — internal structured logger for SDK event output
- `sdk/src/cli-transport.ts` — ANSI-colored CLI output with no external dependency (inline escape codes)
- `sdk/src/ws-transport.ts` — JSON event broadcast over WebSocket for external consumers; port configurable via `WSTransportOptions`

## CI/CD & Deployment

**Hosting:**
- npm registry (public) — primary distribution channel for `get-shit-done-cc`
- GitHub Releases — created as part of release workflow

**CI Pipeline:**
- GitHub Actions at `.github/workflows/`
- `test.yml` — runs `npm run test:coverage` on ubuntu-latest (Node 22, 24) and macos-latest (Node 24) on push to main/release/hotfix branches and all PRs
- `release.yml` — manual dispatch workflow; creates release branch, bumps version, publishes to npm
- `hotfix.yml` — patch release workflow
- `security-scan.yml` — runs `scripts/secret-scan.sh`, `scripts/base64-scan.sh`, `scripts/prompt-injection-scan.sh`
- `pr-gate.yml` — PR validation
- `dependabot.yml` — dependency update automation

## Environment Configuration

**Required env vars:**
- `ANTHROPIC_API_KEY` — required for any AI agent execution (read by Anthropic SDK)

**Optional env vars:**
- `BRAVE_API_KEY` — enables Brave Search integration
- `FIRECRAWL_API_KEY` — enables Firecrawl scraping
- `EXA_API_KEY` — enables Exa Search
- `GSD_HOME` — override home directory for agent file resolution (`get-shit-done/bin/lib/core.cjs:399`)
- `GSD_AGENTS_DIR` — override agents directory path (`get-shit-done/bin/lib/core.cjs:1280`)

**Secrets location:**
- No `.env` files detected in repository
- API keys stored as plain env vars or in `~/.gsd/<service>_api_key` files on the user's machine
- CI secrets managed via GitHub Actions secrets (referenced in `.github/workflows/release.yml` for `NPM_TOKEN`)

## Webhooks & Callbacks

**Incoming:**
- None — no webhook endpoints; GSD is a local CLI tool

**Outgoing:**
- Brave Search API: `GET https://api.search.brave.com/res/v1/web/search` (`sdk/src/query/websearch.ts:52`)
- Anthropic API: via `@anthropic-ai/claude-agent-sdk` `query()` (managed by the SDK, not GSD directly)
- WebSocket server: `sdk/src/ws-transport.ts` opens a local `WebSocketServer` for outgoing event broadcast to connected clients; no remote webhook

---

*Integration audit: 2026-04-15*
