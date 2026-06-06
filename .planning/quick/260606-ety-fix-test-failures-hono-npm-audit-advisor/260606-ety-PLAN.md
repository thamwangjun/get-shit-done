---
type: quick-plan
quick_id: 260606-ety
status: ready
---

# Quick Task 260606-ety: Fix remaining test-suite failures (clusters 2 & 3)

## Context

Full `npm test` aggregate is `fail 2`. Cluster 1 (#1924/#2771) is already green
(verified in isolation AND under full parallel run — the parallelism presumption
did not reproduce). Two confirmed failures remain, each with a user-approved fix:

- **Cluster 2 — `bug-3588-npm-audit-clean`**: `hono@4.12.19` enters the production
  tree transitively via `@anthropic-ai/claude-agent-sdk → @modelcontextprotocol/sdk
  → @hono/node-server + hono`. Advisory covers `hono <=4.12.20`; safe is 4.12.21+
  (latest 4.12.23, same minor). Fix: pin via `overrides` in root `package.json`.
- **Cluster 3 — `bug-phase45-eta-wiring` INTG-02**: single survivor at
  `execute-phase.md:608` → `@~/.claude/get-shit-done/workflows/execute-plan.md`.
  User decision: this is an INTENTIONAL bare-line lazy-load (execute-plan.md is the
  primary execution contract, large; inlining via eta would bloat install-time
  context). Fix = STALE TEST: add this ref to the test's existing ALLOWLIST.
  Do NOT modify the workflow source.

## Tasks

### Task 1 — Cluster 2: hono override
- **files**: `package.json`, `package-lock.json`
- **action**: Add a top-level `"overrides": { "hono": "^4.12.23" }` block to root
  `package.json` (insert after the `dependencies` block, before `devDependencies`).
  Then run `npm install` to update `package-lock.json`. Verify the lockfile delta
  is minimal (hono bumped to 4.12.23, no unrelated churn) via `git diff --stat`.
- **verify**: `npm audit --omit=dev` reports 0 advisories;
  `node --test tests/bug-3588-npm-audit-clean.test.cjs` passes.
- **done**: audit clean, test green, lockfile change scoped to hono.

### Task 2 — Cluster 3: allowlist the intentional bare-line ref
- **files**: `tests/bug-phase45-eta-wiring.test.cjs`
- **action**: In the `ALLOWLIST` object (around lines 114-124), add
  `'@~/.claude/get-shit-done/workflows/execute-plan.md'` to the Set keyed by
  `'get-shit-done/workflows/execute-phase.md'`. Do NOT touch the workflow file.
- **verify**: `node --test tests/bug-phase45-eta-wiring.test.cjs` passes.
- **done**: INTG-02 green; workflow source unchanged.

## Final verification
- `npm test 2>&1 | tee /tmp/gsd-test-output.txt` → confirm aggregate `fail 0`.

## must_haves
- truths: full suite aggregate is `fail 0`; `npm audit --omit=dev` clean on root.
- artifacts: `package.json` overrides block; updated `package-lock.json`;
  one new allowlist entry in `tests/bug-phase45-eta-wiring.test.cjs`.
- key_links: `package.json`, `tests/bug-phase45-eta-wiring.test.cjs`,
  `get-shit-done/workflows/execute-phase.md` (unchanged, reference only).
