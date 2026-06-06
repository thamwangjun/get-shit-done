---
phase: 56
slug: spawn-template-wiring
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-05
---

# Phase 56 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| config → resolver → token string → orchestrator | Internal CLI/markdown tooling; no external attack surface | `effort="<enum>"` / `""` token (enum-constrained, never free user input) |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-56-01 | Tampering | effort token interpolated into Agent() pseudocode | accept | Token value enum-constrained by `parseModelEffort` allowlist (`{low, medium, high, xhigh, max}`, V5/PARSE-01); no free-text path | closed |
| T-56-02 | Tampering | npm / package installs | accept | No package-manager installs — pure source edits | closed |
| T-56-A1 | Tampering | effort token in Agent() pseudocode (template) | accept | Enum-constrained, pre-built by Plan 01 query; no free-text path | closed |
| T-56-B1 | Tampering | effort token in Agent() pseudocode + agent file | accept | Enum-constrained, pre-built by Plan 01 query; agent frontmatter untouched (body-only edit) | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-56-01 | T-56-01, T-56-A1, T-56-B1 | Interpolated effort token is enum-constrained by the `parseModelEffort` allowlist; it is a fixed `effort="<enum>"` / `""` string, never free user input. No shell-injection surface. | gsd-secure-phase | 2026-06-05 |
| R-56-02 | T-56-02 | Phase introduces no package-manager installs — source/markdown edits only. | gsd-secure-phase | 2026-06-05 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-05 | 4 | 4 | 0 | gsd-secure-phase |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-05
