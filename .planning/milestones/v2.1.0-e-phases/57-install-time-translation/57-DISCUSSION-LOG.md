# Phase 57: Install-Time Translation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-05
**Phase:** 57-install-time-translation
**Areas discussed:** Effort sourcing at install, Codex translation shape, Haiku clamp behavior, Claude-side materialization

---

## Effort sourcing at install

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse core resolver | install.js calls the same `resolveReasoningEffortInternal` path as the SDK (Claude-form effort + Phase 56 floor + allowlist); one source of truth. | ✓ |
| Local via resolveTierEntry | install.js reads slots locally and derives effort itself; re-implements floor/allowlist, risks divergence. | |

**User's choice:** Reuse core resolver
**Notes:** User first asked *why the installer needs effort resolution at all*. Clarified: Codex `spawn_agent` has no inline model/effort param (install.js:2643), so the per-agent `.toml` written at install is Codex's only effort surface — unlike Claude, which carries effort via the Phase 56 live-spawn arg. Installer effort resolution exists solely for the Codex static-TOML path.

---

## Codex translation shape

| Option | Description | Selected |
|--------|-------------|----------|
| Shared helper in core.cjs | `translateEffortForCodex(effort)` in core.cjs, invoked only at the Codex TOML emit; resolver stays neutral; unit-testable. | ✓ |
| Inline in generateCodexAgentToml | max→xhigh written inline at the emit site; fewer files but not testable/reusable. | |

**User's choice:** Shared helper in core.cjs
**Notes:** Scope narrowed by the haiku decision below — since haiku is `null` from the resolver, this helper only ever sees opus/sonnet effort.

---

## Haiku clamp behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Clamp xhigh→high (original framing) | Treat as a downgrade when haiku resolves to max/xhigh. | |
| Tier-based omit, no floor (user correction) | Haiku supports no effort at all → omit entirely on every runtime; no medium floor for haiku; overrides Phase 56 D-08 for haiku-tier slots; lives in the core resolver. | ✓ |

**User's choice:** Tier-based omit; no medium floor for haiku
**Notes:** User correction — "haiku do not support effort values at all" — reframed the whole area. Not a clamp; a full omit. Surfaced a gap in Phase 56 D-08 (floor was runtime-gated, not tier-gated); Phase 57 adds the haiku exclusion to the floor in the core resolver.

---

## Claude-side materialization

| Option | Description | Selected |
|--------|-------------|----------|
| Codex-emit-only | install.js changes confined to Codex TOML emit; Claude effort carried by Phase 56 spawn templates; resolver preserves Claude-form effort unchanged. | ✓ |
| Claude path also materializes | Phase 57 also writes effort on the Claude install path. | |

**User's choice:** Codex-emit-only
**Notes:** No Claude install-time per-agent effort surface exists; "Claude effort preserved" = pass-through + Phase 56 live-spawn carrier.

---

## Claude's Discretion

- Exact name/signature/registration of `translateEffortForCodex`.
- Precise wiring point inside `generateCodexAgentToml` (the `entry.reasoning_effort` block at install.js:2748–2749).
- How haiku tier is detected in the resolver.

## Deferred Ideas

None — discussion stayed within phase scope.
