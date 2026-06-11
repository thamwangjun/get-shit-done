# Phase 68: Architecture Decision Records

**Phase:** 68-pre-merge-inventory-backup-sdk-capture
**Recorded:** 2026-06-11
**Scope:** Phase-local decisions, pre-made before merge execution (Phase 69)

---

## Decision 1: KEEP Fork SHA-Based Update-Check Worker (PATCH-02)

**Decision:** KEEP the fork's SHA-based update-check worker (`isNewer()` via GitHub Commits API) over upstream's semver/npm approach. Upstream's `isSemverNewer` worker is NOT adopted.

**Rationale:** The fork deliberately tracks commits by SHA rather than published npm releases. The fork's `isNewer()` function compares commit SHAs against the GitHub Commits API, which is the correct mechanism for a fork that may diverge from the npm release cadence. Upstream's semver/npm approach assumes the fork is always published to npm at the same version as upstream, which is not guaranteed. Adopting upstream's worker would silently break update notifications for fork users.

**Requirement satisfied:** PATCH-02 — the fork's SHA-based `isNewer` update-check worker must be re-applied after the merge in Phase 70. This decision documents the intent to restore it; Phase 70 criterion 2 verifies restoration via grep (`isNewer` present, `isSemverNewer` absent).

**Impact on Phase 69:** During merge conflict resolution in Phase 69, the upstream `isSemverNewer` change must NOT be accepted for the update-check worker. Prefer the fork side for the relevant file(s).

---

## Decision 2: ACCEPT Upstream `sdk/` Deletion, GATED on SDK-01 (SDK-01 -> SDK-02)

**Decision:** ACCEPT upstream's `sdk/` deletion (305 files) in Phase 69, but only AFTER SDK-01 documentation exists. The gating direction is explicit: SDK-01 must be complete before SDK-02 is accepted.

**Rationale:** Upstream v1.3.1 deletes the entire `sdk/` directory (305 files). The fork has a functioning SDK capability built on `@anthropic-ai/claude-agent-sdk` covering session-runner, config, model-catalog, and WebSocket transport. If the deletion is accepted without documentation, the capability is permanently lost with no recovery path. By requiring restoration-grade documentation (SDK-01, this phase Plan 02) before accepting the deletion (SDK-02, Phase 69), the fork ensures a future SDKR-01 milestone can rebuild the SDK capability compatibly without needing the deleted source.

**Gating relationship:** SDK-01 (document fork `sdk/` capability) → SDK-02 (accept upstream `sdk/` deletion). Phase 69 MUST NOT accept the `sdk/` deletion until SDK-01 documentation exists in the phase directory. SDK-01 is Phase 68 Plan 02; SDK-02 is Phase 69 criterion 5.

**Requirement IDs:** SDK-01 (documentation prerequisite), SDK-02 (deletion acceptance gate)

---

## Summary Table

| ID | Decision | Status | Req IDs |
|----|----------|--------|---------|
| D-ADR-01 | KEEP fork SHA-based `isNewer` / update-check worker; reject upstream `isSemverNewer` | Pre-made | PATCH-02 |
| D-ADR-02 | ACCEPT upstream `sdk/` deletion gated on SDK-01 doc existing first | Pre-made | SDK-01, SDK-02 |

---

*These decisions are phase-local records. No project-wide ADR convention is established by this file.*
