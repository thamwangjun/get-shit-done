---
phase: "04"
slug: fix-background-update-check-hook
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
| worker → GitHub API | Outbound HTTPS GET from `gsd-check-update-worker.js` to `api.github.com` | Public commit SHA (read-only, unauthenticated) |
| GitHub API → cache file | Parsed SHA written to `~/.cache/gsd/gsd-update-check.json`; read by statusline hook | Installed SHA (7-char) + boolean update flag |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-04-01 | Tampering | `gsd-check-update-worker.js` — SHA from GitHub API | mitigate | Validate API response with `/^[0-9a-f]{40}$/` before storing; malformed value discarded, `latest` stays `null` | closed |
| T-04-02 | Spoofing | GitHub API endpoint | accept | Unauthenticated read-only GET; worst case is false "no update" — no auth tokens or write operations involved | closed |
| T-04-03 | Denial of Service | `https.get()` in `gsd-check-update-worker.js` | mitigate | `timeout: 10000`; `req.on('timeout', () => { req.destroy(); writeResult(); })` ensures prompt exit; D-06 silent failure prevents hanging | closed |
| T-04-04 | Information Disclosure | Cache file `~/.cache/gsd/gsd-update-check.json` | accept | Contains only installed SHA (already on disk in VERSION file) and boolean update flag; no credentials or PII | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-04-01 | T-04-02 | GitHub API spoofing: unauthenticated read-only GET, worst case is false "no update" notification. No write operations or auth tokens involved. Risk is low. | thamwangjun | 2026-04-17 |
| AR-04-02 | T-04-04 | Cache file contains only the installed 7-char SHA (already present on disk in the VERSION file) and a boolean update flag. No PII or credentials. Risk is negligible. | thamwangjun | 2026-04-17 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-04-17 | 4 | 4 | 0 | gsd-security-auditor |

### Security Audit 2026-04-17

| Metric | Count |
|--------|-------|
| Threats found | 4 |
| Closed | 4 |
| Open | 0 |

**Evidence:**

- **T-04-01 CLOSED** — `/^[0-9a-f]{40}$/` validation at `hooks/gsd-check-update-worker.js:114`; malformed SHA discarded before `latest` is set
- **T-04-02 CLOSED** — Accepted risk; unauthenticated read-only GET, no auth surface
- **T-04-03 CLOSED** — `timeout: 10000` at line 106; `req.on('timeout', () => { req.destroy(); writeResult(); })` at line 123; `req.on('error', () => writeResult())` at line 122
- **T-04-04 CLOSED** — Accepted risk; cache contains only installed SHA + boolean flag, no PII

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-04-17
