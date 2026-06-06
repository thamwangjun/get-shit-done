---
type: quick-summary
quick_id: 260606-ety
status: complete
---

# Quick Task 260606-ety: Fix remaining test-suite failures (clusters 2 & 3) — Summary

Cleared the two confirmed full-suite failures by pinning `hono` past the npm-audit
advisory via `overrides`, and allowlisting one intentional bare-line `@~` ref in the
eta-wiring stale test. Final full suite is `fail 0` (runner exit 0).

## Changes

### Cluster 2 — hono npm-audit advisory (#3588)
- Added a top-level `"overrides": { "hono": "^4.12.23" }` block to root
  `package.json`, inserted between `dependencies` and `devDependencies` with
  exact 2-space indentation.
- Ran `npm install` to regenerate `package-lock.json`.
- **Lockfile diff scope:** minimal — `git diff --stat` reported
  `1 file changed, 3 insertions(+), 3 deletions(-)`. The only substantive change
  was `node_modules/hono` `resolved`/`version`/`integrity` moving from
  `4.12.19` → `4.12.23`. No unrelated package churn (`npm install` reported
  "changed 1 package").
- **Verification:**
  - `npm audit --omit=dev` → `found 0 vulnerabilities`.
  - `node --test tests/bug-3588-npm-audit-clean.test.cjs` → `pass 2, fail 0`
    (root + sdk production trees both advisory-free).

### Cluster 3 — INTG-02 stale-test allowlist
- Edited `tests/bug-phase45-eta-wiring.test.cjs`: added
  `'@~/.claude/get-shit-done/workflows/execute-plan.md'` to the `Set` keyed by
  `'get-shit-done/workflows/execute-phase.md'` in the `ALLOWLIST` object.
- This is a USER-APPROVED stale-test fix: the bare-line ref in
  `execute-phase.md:608` is an intentional lazy-load of the primary execution
  contract. No file under `get-shit-done/workflows/` was modified.
- **Verification:** `node --test tests/bug-phase45-eta-wiring.test.cjs` →
  `tests 12, pass 12, fail 0` (INTG-02 green).

## Final full-suite verification
- `npm test` → runner **exit 0**; both suite tallies report `ℹ fail 0`
  (unit/security suite: `tests 4239, pass 4220, fail 0, skipped 12`;
  full aggregate: `tests 7888, pass 7876, fail 0, skipped 12`).
- Note: an initial full run surfaced spurious `fail 2` (bug-1924/bug-2136 install
  tests) caused by an orphaned `hooks/dist.bak-test/` scratch directory left by a
  prior interrupted test run. After removing that stale directory the suite is
  fully green; the orphaned state was environmental and unrelated to either cluster.

## Commits
- `e6c023b6` fix(quick-260606-ety): pin hono>=4.12.23 via overrides to clear npm-audit advisory (#3588)
- `930c85d5` test(quick-260606-ety): allowlist intentional execute-plan.md bare-line @~ ref (INTG-02)
