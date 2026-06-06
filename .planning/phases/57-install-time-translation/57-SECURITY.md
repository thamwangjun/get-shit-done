---
phase: 57
slug: install-time-translation
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-06
---

# Phase 57 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| config.json → resolver | `.planning/config.json` supplies runtime + model/effort overrides consumed by the resolver. Pre-existing boundary; Phase 57 adds a tier comparison + pure string clamp, no new input parsing. | effort/model tier tokens (non-sensitive) |
| agent frontmatter name → Codex TOML | Agent names flow into `generateCodexAgentToml`, JSON.stringify-emitted into TOML. Pre-existing boundary, unchanged by Phase 57. | agent name strings |
| config.json → install-time resolver | `resolveEffort` reads `.planning/config.json` via the already-probed project dir; same input surface as the model resolver. | effort tier token (non-sensitive) |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-57-01 | Tampering | npm/test deps | accept | No new packages; node --test + existing tests/helpers.cjs. Verified `tech_stack.added: []`. | closed |
| T-57-02 | Tampering | npm installs | accept | No new packages; pure in-repo `.cjs` edits to core.cjs. | closed |
| T-57-03 | Injection | translateEffortForCodex output | accept | Output is fixed token set {low,medium,high,xhigh} or null; never derives from free-form text. Verified core.cjs:1278-1281. | closed |
| T-57-04 | Injection | model_reasoning_effort value in TOML | mitigate | Allowlist/null output (core.cjs:1278-1281); JSON.stringify-quoted emit (install.js:2797); null/haiku omitted via `if(codexEffort)` guard (install.js:2796); emit gated on `runtime === 'codex'` (install.js:2787). All three claims verified in code. | closed |
| T-57-05 | Tampering | npm installs | accept | No new packages; pure in-repo `.js` edits to install.js + one test. | closed |
| T-57-06 | Information disclosure | install-time config read | accept | `resolveEffort` reuses existing `probedProjectDir` (install.js:1520); same `.planning/config.json`, no new file/network read. | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-57-01 | T-57-01 | Test-only file; no external input, network, auth, or persisted state. No supply-chain surface. | gsd-security-auditor | 2026-06-06 |
| R-57-02 | T-57-02 | Pure resolver/helper `.cjs` change; no new packages. | gsd-security-auditor | 2026-06-06 |
| R-57-03 | T-57-03 | Fixed-token output ({low,medium,high,xhigh} or null); no free-form text reaches output. | gsd-security-auditor | 2026-06-06 |
| R-57-05 | T-57-05 | Pure in-repo `.js` change; no new packages. | gsd-security-auditor | 2026-06-06 |
| R-57-06 | T-57-06 | Reuses pre-existing config probe; no new file or network read introduced. | gsd-security-auditor | 2026-06-06 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-06 | 6 | 6 | 0 | gsd-security-auditor (opus) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-06
