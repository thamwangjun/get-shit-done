# Phase 70: spec-02 SHA Versioning - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-12
**Phase:** 70-spec-02-sha-versioning
**Areas discussed:** Invariant decomposition, Tier-1 test mapping, Sentinel & seam placement, SPEC-04 boundary

---

## Invariant Decomposition

| Option | Description | Selected |
|--------|-------------|----------|
| By behavioral role (~6) | Group invariants by role: emit, sentinel, comparison, source, seam, display | ✓ |
| One-per-test | One invariant per test assertion cluster | |
| Single mega-invariant | One broad versioning invariant | |

**User's choice:** Six role-based invariants (`02-INV-1`..`02-INV-6`), placeholder substitution folded into the emit invariant.
**Notes:** Mirrors Phase 69 D-01. Keeps the traceability table legible and move-proof; rejected per-test (rots every merge) and mega-invariant (not falsifiable at subtest granularity).

---

## Tier-1 Test Mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Expand to 5 tier-1, no MISSING, exclude platform-gate | All invariants trace to real subtests across five test files; win32 shell-gating test excluded as out of scope | ✓ |
| Keep stub's 2 named tests only | Limit evidence to version-detection + semver-compare | |
| Include platform-gate as an invariant | Treat win32 shell-gating as SHA-versioning behavior | |

**User's choice:** Expand stub's two named tests to five tier-1 sources; no `[MISSING]` rows; exclude `gsd-check-update-worker-platform-gate.test.cjs`.
**Notes:** Live GitHub network call covered via injectable seam (mocked) + source-grep, so no MISSING warranted. Platform-gate is a spawn-primitive security concern, recorded as Out of Scope.

---

## Sentinel & Seam Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Invariant + Key Decision (each) | Observable contract as MUST invariant; semantic/design intent as locked Key Decision | ✓ |
| Invariant only | Capture only the testable behavior | |
| Key Decision only | Capture only the design intent | |

**User's choice:** Both `no-network` sentinel and `check-latest-version.cjs` seam get a MUST invariant for the observable contract plus a locked Key Decision for the semantic/design intent.
**Notes:** Phase 69 D-04 pattern. Sentinel = "invalid install, never an equality-branch target"; seam = "injectable for deterministic network-free testing."

---

## SPEC-04 Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| SPEC-02 owns placeholders + boundary note | `{{GSD_REPO}}`/`{{GSD_BRANCH}}`/`{{GSD_VERSION}}` substitution owned here; one-line Scope note; no dependency edge | ✓ |
| Add dependency edge to SPEC-04 | Make SPEC-02 depend on SPEC-04 | |
| Defer placeholders to SPEC-04 | Let Eta materialization spec own them | |

**User's choice:** SPEC-02 owns the literal `{{...}}` placeholder substitution; add a one-line Scope boundary note; no INDEX dependency edge (both stay root nodes).
**Notes:** Literal `{{...}}` regex replacement in install.js is a different mechanism from SPEC-04's Eta `<%~ include() %>` / `@~/` materialization — no real overlap.

---

## Claude's Discretion

- Exact EARS pattern choice per invariant (single falsifiable claim each).
- Exact subtest/assertion-shape strings in the Acceptance Tests table (read real test files).
- Whether placeholder substitution stays a sub-clause of invariant 1 or splits to a 7th invariant.
- Confidence value stamped in frontmatter when finalized.
- Whether to update the frontmatter `Reimplementation evidence` line to the expanded set.

## Deferred Ideas

None — discussion stayed within phase scope. The platform-gate exclusion (D-03) is a scope-boundary decision recorded in Out of Scope, not a deferral.
