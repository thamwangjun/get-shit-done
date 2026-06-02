---
phase: 53
slug: unified-effort-resolver
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-02
---

# Phase 53 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| config.json → resolver | User-authored `.planning/config.json` slot/override strings cross into `resolveReasoningEffortInternal` / `resolveTierEntry`. | Local developer-owned config strings (no network/untrusted input) |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-53-01 | Tampering | malformed effort token in config slot/override | mitigate | All slot/override strings route through `parseModelEffort` (core.cjs:1242), which strips unknown suffixes to base model + `effort: null` + one-time stderr warning (D-05/CONFIG-04); resolver never throws on bad input | closed |
| T-53-02 | Elevation of Privilege | effort leak to unsupported runtime via override `;effort` | mitigate | Static `RUNTIMES_WITH_REASONING_EFFORT = new Set(['claude', 'codex'])` (model-catalog.cjs:97) is the outermost gate; 8 null-tier runtimes hard no-op before any override emit | closed |
| T-53-03 | Tampering | `;` in a `model;effort` token reaching a raw shell | accept | The combined string is parsed into separate fields inside `parseModelEffort` and never emitted to a shell on this resolver path; no spawn/install path is touched in this phase | closed |
| T-53-04 | Tampering | malformed effort token in `models.<phase-type>` or `model_profile_overrides` | mitigate | Both sites route through `parseModelEffort` → strip-to-base + `effort: null` + one-time warning; verified by CONFIG-04 cases and `resolveTierEntry` parsing the string shorthand | closed |
| T-53-05 | Repudiation | silent model/effort divergence (#3023 class) | mitigate | The D-08 golden snapshot (`tests/feat-53-config-sites-and-golden.test.cjs`) asserts model+effort derive from the same `_resolveAgentSlot` result for all agents/profiles, locking the invariant against future drift | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-53-01 | T-53-03 | The `model;effort` combined string is parsed into separate fields inside `parseModelEffort` and is never emitted to a shell on the resolver path; no spawn/install path is touched in this phase. Residual shell-injection risk is out of scope for the resolver and accepted. | Tham Wang Jun | 2026-06-02 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-02 | 5 | 5 | 0 | /gsd-secure-phase (orchestrator short-circuit, plan-time register) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-02
