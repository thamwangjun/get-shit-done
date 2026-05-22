# Phase 4: Fix Background Update-Check Hook - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 04-fix-background-update-check-hook
**Areas discussed:** "GSD is up to date" message, Statusline dev-install fix scope, SHA comparison format

---

## "GSD is up to date" message

| Option | Description | Selected |
|--------|-------------|----------|
| Silent when current | No text added — statusline shows nothing update-related when SHA matches. HOOK-01 satisfied by absence of false ⬆ notification. | ✓ |
| Show explicit text | Add 'GSD ✓' or similar indicator when installed SHA matches remote. More visible but adds noise. | |

**User's choice:** Silent when current
**Notes:** HOOK-01 means the system correctly identifies "up to date" — no false update notifications appear.

---

## Statusline dev-install fix scope

| Option | Description | Selected |
|--------|-------------|----------|
| Fix in Phase 4 | Both files change atomically — worker and consumer stay consistent. Keeps Phase 5 focused on install.js and update.md. | ✓ |
| Defer to Phase 5 | Phase 4 touches only gsd-check-update-worker.js. Simpler diff, but ships a known breakage in the stale-hook dev-install path. | |

**User's choice:** Fix in Phase 4
**Notes:** The `isDevInstall` semver check in gsd-statusline.js lines 217–226 silently breaks when `cache.installed` and `cache.latest` become SHAs. Fix atomically with the worker.

---

## SHA comparison format

| Option | Description | Selected |
|--------|-------------|----------|
| Truncate remote to 7 chars | Match today's VERSION format. Compare `remote_sha.slice(0,7) === installed`. No change to VERSION format needed. | ✓ |
| Full 40-char comparison | Compare full SHAs. Requires Phase 5 (INST-01) to expand VERSION to 40-char — otherwise always shows "update available". | |

**User's choice:** Truncate remote to 7 chars
**Notes:** VERSION currently holds 7-char SHAs (e.g., `d895c9c`). Phase 5 can decide whether to expand to full SHA.

**Post-discussion amendment:** Rather than replacing the `isNewer` call with an inline equality check, retain the `isNewer` function interface and add its definition in the worker with SHA semantics: `function isNewer(latest, installed) { return !!latest && latest.slice(0, 7) !== installed; }`. The `update_available: latest && isNewer(latest, installed)` result line stays unchanged. Minimal diff, stable interface.

---

## Claude's Discretion

- GitHub API fetch implementation details (https.get vs promisified)
- Timeout value for API call
- Whether to store truncated or full SHA in cache `latest` field

## Deferred Ideas

None.
