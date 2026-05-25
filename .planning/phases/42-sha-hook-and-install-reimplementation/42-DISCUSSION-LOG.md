# Phase 42: SHA Hook and Install Reimplementation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 42-SHA Hook and Install Reimplementation
**Areas discussed:** Worker async restructuring, Stale hook comparison, install.js VERSION write paths

---

## Worker async restructuring

| Option | Description | Selected |
|--------|-------------|----------|
| writeResult(null) on all failures | Call writeResult(null) on network error, timeout, non-200 — ensures cache always written | ✓ |
| Skip write on failure | Don't write cache on failure — simpler but leaves stale cache | |

**User's choice:** Call writeResult(null) on all failure paths

| Option | Description | Selected |
|--------|-------------|----------|
| Stale hooks computed sync before fetch (closure) | Local file reads stay sync, captured in closure that writeResult uses | ✓ |
| Move stale hooks inside writeResult | Everything self-contained in writeResult, mixes async concerns | |

**User's choice:** Stale hooks computed synchronously before the https.get fetch

| Option | Description | Selected |
|--------|-------------|----------|
| 10s timeout via req.setTimeout | req.setTimeout(10000, () => req.destroy()), destroy triggers error event | ✓ |
| No timeout — rely on OS defaults | Simpler but worker could hang indefinitely | |

**User's choice:** 10s timeout via req.setTimeout(10000, () => req.destroy())

---

## Stale hook comparison

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse isNewer(installed, hookVersion) | With new SHA isNewer: !!installed && installed.slice(0,7) !== hookVersion — correct stale semantics | ✓ |
| Direct comparison hookVersion !== installed | More explicit, adds different comparison pattern | |

**User's choice:** Reuse isNewer(installed, hookVersion) unchanged

| Option | Description | Selected |
|--------|-------------|----------|
| Direct branch: if stale_hooks → show warning | Remove parseV() entirely, any stale_hooks → "stale hooks — run /gsd:update" | ✓ |
| Keep dev-install check with SHA comparison | Replace parseV() with SHA inequality but keep "dev install" branch | |

**User's choice:** Remove parseV() dev-install divergence entirely — direct stale_hooks branch

---

## install.js VERSION write paths

| Option | Description | Selected |
|--------|-------------|----------|
| All VERSION writes use gsdVersion | Every install path (Claude, Codex) writes SHA — consistent | ✓ |
| Only primary path (line 8727) | Simpler but Codex paths still write semver — stale-hooks false positives | |

**User's choice:** All VERSION write locations use gsdVersion

| Option | Description | Selected |
|--------|-------------|----------|
| Module scope — computed once at startup | let gsdVersion = 'no-network'; try { git rev-parse } catch(e) {} — simple, available everywhere | ✓ |
| Inside install() function | Lazy, avoids git at require() time, more complex | |

**User's choice:** Module scope computation

| Option | Description | Selected |
|--------|-------------|----------|
| All {{GSD_VERSION}} replacements use gsdVersion | Hook file headers get SHA — stale detection works end-to-end | ✓ |
| Only VERSION file writes | Hook headers keep semver — stale detection always shows stale | |

**User's choice:** All {{GSD_VERSION}} replacements use gsdVersion

---

## Claude's Discretion

- GitHub Commits API response parsing pattern (chunk accumulation + JSON.parse + `.sha` extraction)
- Exact error handling for malformed JSON (silent catch, call writeResult(null))
- Specific location of {{GSD_REPO}} / {{GSD_BRANCH}} replacement in install.js hook processing loop

## Deferred Ideas

None — discussion stayed within phase scope.
