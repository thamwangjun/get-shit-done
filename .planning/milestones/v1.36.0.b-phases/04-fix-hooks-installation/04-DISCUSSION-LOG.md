# Phase 4: Fix Hooks Installation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 04-fix-hooks-installation
**Areas discussed:** Build failure handling, Build output visibility, Codex path coverage

---

## Build Failure Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Abort install with error | Print an error message and exit non-zero. User sees exactly what failed and must fix it before retrying. Consistent with how build-hooks.js already behaves (calls process.exit(1) on syntax error). | ✓ |
| Warn and continue without hooks | Print a warning, skip hook installation, but complete the rest of the install. User gets a partial install — skills/agents work but hooks don't fire. | |

**User's choice:** Abort install with error
**Notes:** Consistent with existing build-hooks.js behavior.

---

## Build Output Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Suppress — show one notice only | Show a single notice like '▶ Building hooks from source...' before the build and '✓ Installed hooks (built from source)' after. Keep install output clean. | ✓ |
| Show build output inline | Let build-hooks.js print its own output (✓ Copying gsd-check-update.js... etc.) directly into the install log. More verbose but fully transparent. | |

**User's choice:** Suppress — show one notice only
**Notes:** Two-line notice: one before build starts, one on success. Stderr captured and surfaced on failure.

---

## Codex Path Coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Cover both Claude and Codex paths | Refactor: extract the on-demand build into a helper function called once, then both Claude and Codex paths proceed with hooks/dist/ guaranteed to exist. | ✓ |
| Claude path only | Only fix the Claude path. Accept that Codex dev installs still silently fail on missing hooks/dist/. | |

**User's choice:** Cover both
**Notes:** User asked whether the Codex path uses hooks/dist/ — confirmed it does (same source dir; gsd-check-update.js is referenced in Codex config.toml). Fix refactored as a shared helper called before both copy blocks.

---

## Claude's Discretion

- Exact helper function name (`ensureHooksDist` or similar)
- File placement of the helper within install.js
- `execSync` vs `spawnSync` for subprocess control (stdout suppressed, stderr captured either way)

## Deferred Ideas

None.
