# External Integrations

**Analysis Date:** 2026-05-25

## APIs & External Services

**AI / LLM:**
- Anthropic Claude API — drives all autonomous agent execution
  - SDK/Client: `@anthropic-ai/claude-agent-sdk` ^0.2.84 (npm)
  - Auth: `ANTHROPIC_API_KEY` (consumed internally by the SDK; not referenced in GSD source)
  - Usage: `sdk/src/session-runner.ts` calls `query()` to run GSD plans against Claude

**Web Search:**
- Brave Search API — optional web search for researcher agents
  - SDK/Client: native `fetch()` in `sdk/src/query/websearch.ts`
  - Auth: `BRAVE_API_KEY` env var (also detectable via `~/.gsd/brave_api_key` file)
  - Endpoint: `https://api.search.brave.com/res/v1/web/search`
  - Behavior: returns `{ available: false }` gracefully when key is absent; agents fall back to built-in WebSearch tools

**Web Scraping:**
- Firecrawl — optional scraping/crawling integration
  - SDK/Client: external binary (not an npm package import); detected by env var or key file
  - Auth: `FIRECRAWL_API_KEY` env var (also detectable via `~/.gsd/firecrawl_api_key` file)
  - Detection: `sdk/src/query/config-mutation.ts` line 567; feature flag written to `.planning/config.json` as `firecrawl: true/false`

**Search / Research:**
- Exa Search — optional AI-powered search integration
  - SDK/Client: external tool (not an npm package import); detected by env var or key file
  - Auth: `EXA_API_KEY` env var (also detectable via `~/.gsd/exa_api_key` file)
  - Detection: `sdk/src/query/config-mutation.ts` line 568; feature flag written to `.planning/config.json` as `exa_search: true/false`

**Dependency Audit:**
- Fallow — optional file-level dependency auditing tool
  - SDK/Client: external binary resolved at runtime (`fallow.exe`/`fallow.cmd`/`fallow` depending on OS)
  - Package: `fallow` ^2.70.0 (npm optionalDependency)
  - Integration: `get-shit-done/bin/lib/fallow-runner.cjs`
  - Behavior: absent = feature silently disabled; tested in `tests/feat-3210-fallow-integration.test.cjs`

## Data Storage

**Databases:**
- None — no database clients or server required

**File Storage:**
- Local filesystem only — all project state is stored in `.planning/` as human-readable Markdown and JSON files
- Key files: `.planning/STATE.md` (checkpoint state), `.planning/ROADMAP.md` (plan overview), `.planning/config.json` (config), `.planning/phases/phase-N/PLAN.md` and `SUMMARY.md` (phase artifacts)
- File locking: `.planning/STATE.md.lock` (flock-style) used for parallel-safe writes during wave execution; implemented in `get-shit-done/bin/lib/core.cjs`

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- None — GSD is a local filesystem tool with no user authentication layer
- API keys (Anthropic, Brave, Firecrawl, Exa) are consumed directly from environment variables or `~/.gsd/<service>_api_key` files
- No session management, no JWTs, no OAuth flows

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry, Datadog, or similar)

**Logs:**
- Hooks write runtime events to terminal via `fs.writeSync(1, data)` (synchronous stdout)
- `gsd-statusline.js` hook provides terminal status line updates
- `gsd-context-monitor.js` hook tracks context window exhaustion events
- SDK has a logger module at `sdk/src/logger.ts` for structured internal logging
- No centralized log aggregation

## CI/CD & Deployment

**Hosting:**
- npm registry — published as `get-shit-done-cc` (root) and `@opengsd/gsd-sdk` (SDK)
- GitHub Releases — created by `.github/workflows/release.yml` on manual dispatch
- npm provenance attestation: `npm publish --provenance` used in release workflow

**CI Pipeline:**
- GitHub Actions — `.github/workflows/`
  - `test.yml` — matrix (ubuntu, macos, windows × Node 22 + 24); runs unit, integration, security test suites on every PR; install and slow suites on `main` push only
  - `release.yml` — manual dispatch; validates semver, publishes root and SDK packages to npm with provenance
  - `release-sdk.yml` — SDK-only release workflow
  - `pr-gate.yml` — PR quality gates
  - `install-smoke.yml` — smoke tests for installer
  - `security-scan.yml` — security scanning
  - `discord-changelog.yml` — posts changelog to Discord via webhook (uses `DISCORD_WEBHOOK_URL` secret; `fetch()` to Discord webhook URL)
  - `auto-backmerge.yml`, `auto-branch.yml`, `auto-label-issues.yml`, `branch-cleanup.yml`, `branch-naming.yml`, `changeset-required.yml`, `close-draft-prs.yml`, `dismiss-unauthorized-pr-approvals.yml`, `docs-required.yml`, `hotfix.yml`, `require-issue-link.yml`, `stale.yml`, `test-skip.yml` — automation and governance

## Environment Configuration

**Required env vars:**
- `ANTHROPIC_API_KEY` — required for SDK `query()` calls; consumed by `@anthropic-ai/claude-agent-sdk`

**Optional env vars:**
- `BRAVE_API_KEY` — enables Brave Search
- `FIRECRAWL_API_KEY` — enables Firecrawl scraping
- `EXA_API_KEY` — enables Exa Search
- `GSD_HOME` — override home directory (useful in tests)
- `GSD_AGENTS_DIR` — override agents directory (used in tests)
- `GSD_RUNTIME` — force runtime detection (`claude`|`opencode`|`gemini`|`codex`|`copilot`|`cursor`|`windsurf`|`augment`|`trae`)
- `GSD_WORKSTREAM` — active workstream name
- `GSD_QUERY_FALLBACK` — CJS fallback behavior toggle

**Runtime config dir overrides:**
- `CLAUDE_CONFIG_DIR`, `OPENCODE_CONFIG_DIR`, `GEMINI_CONFIG_DIR`, `CODEX_HOME`, `COPILOT_CONFIG_DIR`, `CURSOR_CONFIG_DIR`, `WINDSURF_CONFIG_DIR`, `AUGMENT_CONFIG_DIR`, `TRAE_CONFIG_DIR`, `ANTIGRAVITY_CONFIG_DIR`, `KILO_CONFIG_DIR` — override install paths per runtime

**Secrets location:**
- Environment variables only (no `.env` file pattern)
- Optional alternative: `~/.gsd/<service>_api_key` files for Brave, Firecrawl, Exa keys
- CI secrets: `NPM_TOKEN` (npm publish), `DISCORD_WEBHOOK_URL` (Discord notification), `GITHUB_TOKEN` (standard Actions token)

## Webhooks & Callbacks

**Incoming:**
- None — no incoming webhook endpoints (GSD is a local CLI tool, not a server)

**Outgoing:**
- Discord webhook — `DISCORD_WEBHOOK_URL` used in `.github/workflows/discord-changelog.yml` to post release changelogs to a Discord channel via `fetch()` POST

---

*Integration audit: 2026-05-25*
