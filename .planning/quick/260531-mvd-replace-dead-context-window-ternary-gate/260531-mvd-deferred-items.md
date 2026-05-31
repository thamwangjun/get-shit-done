# Deferred Items — quick-260531-mvd

Out-of-scope failures discovered during execution. NOT caused by this plan's changes.

## INTG-02: bare-line @~ survivors (pre-existing)

`tests/bug-phase45-eta-wiring.test.cjs` "get-shit-done/workflows/ has zero bare-line @~ survivors" fails on the committed HEAD base — independent of this plan. Survivors present in HEAD before any edit here:

- `get-shit-done/workflows/execute-phase.md:603` — `@~/.claude/get-shit-done/templates/summary.md`
- `get-shit-done/workflows/execute-phase.md:604` — `@~/.claude/get-shit-done/references/checkpoints.md`
- `get-shit-done/workflows/execute-phase.md:605` — `@~/.claude/get-shit-done/references/tdd.md`
- `get-shit-done/workflows/execute-plan.md:11` — `@~/.claude/get-shit-done/references/git-integration.md`

These bare-line @~ refs were introduced by prior quick tasks (260531-lpp converting checkpoints.md/git-integration.md, 260531-mg7 converting summary.md/tdd.md) which left INTG-02 red. This plan's added `executor-examples.md` @-ref (line 607) deliberately matches the same established sibling form so it introduces no new pattern. Fixing the bare-line convention across all workflow refs is a separate concern.

## W016 / addAiIntegrationPhaseKey (pre-existing, unrelated)

`tests/verify-health.test.cjs` (and repair counterpart) for `workflow.ai_integration_phase` config-health key fail independently of execute-phase.md content. Not touched by this plan.
