---
phase: 04
slug: fix-hooks-installation
status: verified
threats_open: 0
asvs_level: 1
created: 2026-04-17
---

# Phase 04 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| installer → subprocess | install.js spawns scripts/build-hooks.js via spawnSync; runs as the same user with no elevated privileges | None — build script reads source files and writes to hooks/dist/ within the package root |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-04-01 | Tampering | `buildScript` path construction (`path.join(src, 'scripts', 'build-hooks.js')`) | accept | `src` is resolved from the package root before any user input is processed; no user-controlled path segment introduced; value is same path already trusted by rest of install.js | closed |
| T-04-02 | Denial of Service | On-demand build blocks installer progress (synchronous spawnSync) | accept | Intentional design decision (D-02); build runs in milliseconds on a cloned repo with all source files present; no timeout needed for a local subprocess | closed |
| T-04-03 | Information Disclosure | Build failure surfaces captured stderr to the terminal | accept | stderr from scripts/build-hooks.js is diagnostic output about the user's own files; no secrets or PII involved | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-04-01 | T-04-01 | Path is constructed entirely from `src` (package root), which is already trusted by install.js throughout its ~6000 lines. No user-supplied segment enters the path. | design-time | 2026-04-17 |
| AR-04-02 | T-04-02 | Synchronous build is an intentional UX trade-off (D-02 in CONTEXT.md): the install is a one-shot operation where blocking for milliseconds is preferable to async complexity | design-time | 2026-04-17 |
| AR-04-03 | T-04-03 | Build stderr is internal toolchain output (esbuild/bundler messages) about the user's own source files. No credential, token, or PII flows through the build subprocess. | design-time | 2026-04-17 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-04-17 | 3 | 3 | 0 | gsd-security-auditor |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-04-17
