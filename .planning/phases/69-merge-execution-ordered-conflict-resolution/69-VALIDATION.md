---
phase: 69
slug: merge-execution-ordered-conflict-resolution
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-11
---

# Phase 69 — Validation Strategy

> Per-phase validation contract. **This phase is verified STRUCTURALLY (grep/`ls`/`git`-based), never by a green test suite** (VERIFY-02). Tests referencing renamed paths WILL fail post-merge — that is deferred backlog (Phase 70/71), not a Phase 69 gate.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `--test` runner (exists, NOT a phase gate) |
| **Config file** | none |
| **Quick run command** | `git status --porcelain` (structural conflict-marker check) |
| **Full suite command** | structural phase gate below (not `npm test`) |
| **Estimated runtime** | <5 seconds per structural check |

---

## Sampling Rate

- **After every per-file resolution commit:** `git status --porcelain` shows no `UU`/`UD`/`DU`/`AA` for resolved paths
- **After each triage tier:** re-run `git status` to confirm the tier's files are staged/committed
- **Before `/gsd-verify-work`:** all structural phase-gate checks below pass
- **Max feedback latency:** ~5 seconds (git/ls commands)

---

## Structural Phase Gate (replaces Per-Task Test Map)

| Check | Command | Pass Condition | Requirement |
|-------|---------|----------------|-------------|
| Shared-history merge landed | `git log --merges -1 --format=%P` | 2nd parent == `1bb253c9` | MERGE-02 |
| No unresolved markers | `git status --porcelain` | no `UU`/`UD`/`DU`/`AA` codes | MERGE-02/03 |
| Incremental commits | `git log` over merge range | >1 resolution commit, no mega-commit | MERGE-03 |
| Fork-only files restored | `ls CLAUDE.md CATALOGUE.json .planning/` | all present, non-empty | PATCH-03 |
| Fork modules restored | `ls get-shit-done/bin/lib/core.cjs` | present (rename NOT adopted) | MERGE-02 |
| sdk/ deletion accepted | `ls sdk/` | "No such file or directory" | SDK-02 |
| Lockfile clean-regen | `npm install` ×2 | exit 0, no churn on 2nd run | MERGE-04 |

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements — no new test infrastructure. Failing tests are expected deferred backlog (Phase 70/71).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Per-file commit in correct triage tier | MERGE-03 | Triage ordering is a human-judged sequence | Inspect `git log` order: `.planning/`+`CLAUDE.md` → infra → fork-critical → prompt content → tests → upstream additions |
| package.json fork-sacred fields preserved | MERGE-04 / D-04 | Field-level reconciliation judgment | `grep` `name`, `bin` map, `repository.url`, `version` in resolved `package.json` against fork HEAD values |

---

## Validation Sign-Off

- [x] All checks are structural (`git`/`ls`/`grep`) — no green-suite dependency
- [x] Sampling continuity: structural check after every resolution commit
- [x] Wave 0: no new infrastructure required
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-11

---

## Validation Audit 2026-06-11

Re-audit of structural-only validation contract. All 7 structural phase-gate checks re-run and confirmed passing (merge 2nd parent `1bb253c9`, no unresolved markers, fork-only files present, fork module restored, `sdk/` absent). No automated-test gaps exist by design — VERIFY-02 mandates structural verification, not a green suite.

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Manual-only (documented) | 2 |
