---
phase: quick-260531-ncu
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/bug-phase45-eta-wiring.test.cjs
  - .planning/quick/260531-mvd-replace-dead-context-window-ternary-gate/260531-mvd-deferred-items.md
autonomous: true
requirements: [INTG-02, W016]

must_haves:
  truths:
    - "D-01: INTG-02 allowlist is precise — it exempts ONLY the 5 known file→ref pairs; any new bare-line @~ ref (different ref, or same ref in a different file) is still flagged as a survivor"
    - "D-02: The 5 deliberate bare-line @~ refs are NOT reverted — the fix is in the test, not the workflow files"
    - "INTG-02 group goes fully green; rest of bug-phase45-eta-wiring.test.cjs still passes"
    - "D-03: W016 (verify-health) is verified green and marked resolved in the deferred-items file rather than left open"
    - "node --test tests/bug-phase45-eta-wiring.test.cjs and node --test tests/verify-health.test.cjs both report fail 0"
  artifacts:
    - path: "tests/bug-phase45-eta-wiring.test.cjs"
      provides: "INTG-02 allowlist filtering deliberate bare-line @~ refs"
      contains: "ALLOWLIST"
    - path: ".planning/quick/260531-mvd-replace-dead-context-window-ternary-gate/260531-mvd-deferred-items.md"
      provides: "Resolved status for INTG-02 TODO and W016"
  key_links:
    - from: "findBareLineAtTildeRefs"
      to: "INTG-02 per-layer survivor assertions"
      via: "allowlist filter applied before survivors.length assertion"
      pattern: "ALLOWLIST"
---

<objective>
Address the two deferred items from quick task 260531-mvd: (1) make INTG-02 in
`tests/bug-phase45-eta-wiring.test.cjs` go green via a precise allowlist for the 5
deliberate bare-line `@~` refs, and (2) verify W016 (verify-health) is no longer
reproducing and mark it resolved in the deferred-items file.

Purpose: Close the open TODO/deferred items so the test suite reflects intentional
@-ref conversions without reverting them, and the deferred-items file no longer
carries stale open concerns.
Output: Updated test with a documented allowlist; updated deferred-items file.
</objective>

<context>
!`cat .planning/quick/260531-mvd-replace-dead-context-window-ternary-gate/260531-mvd-deferred-items.md`

The 5 deliberate bare-line @~ refs (confirmed present, must NOT be reverted):
- get-shit-done/workflows/execute-phase.md:603 — @~/.claude/get-shit-done/templates/summary.md
- get-shit-done/workflows/execute-phase.md:604 — @~/.claude/get-shit-done/references/checkpoints.md
- get-shit-done/workflows/execute-phase.md:605 — @~/.claude/get-shit-done/references/tdd.md
- get-shit-done/workflows/execute-phase.md:607 — @~/.claude/get-shit-done/references/executor-examples.md
- get-shit-done/workflows/execute-plan.md:11 — @~/.claude/get-shit-done/references/git-integration.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add precise INTG-02 allowlist for the 5 deliberate bare-line @~ refs</name>
  <files>tests/bug-phase45-eta-wiring.test.cjs</files>
  <read_first>tests/bug-phase45-eta-wiring.test.cjs (INTG-02 section, lines ~96-190)</read_first>
  <action>
    In the INTG-02 describe block, add a documented module-level allowlist data
    structure (per D-01) mapping relative file path → Set of allowed bare-line ref
    strings. Populate it with exactly the 5 known pairs:
    - "get-shit-done/workflows/execute-phase.md" → { "@~/.claude/get-shit-done/templates/summary.md", "@~/.claude/get-shit-done/references/checkpoints.md", "@~/.claude/get-shit-done/references/tdd.md", "@~/.claude/get-shit-done/references/executor-examples.md" }
    - "get-shit-done/workflows/execute-plan.md" → { "@~/.claude/get-shit-done/references/git-integration.md" }

    Add a clear comment explaining these are intentional need-based runtime-loading
    refs introduced by quick tasks 260531-lpp/mg7/mvd, and that the allowlist is keyed
    by exact relative-file-path + exact trimmed ref string so any NEW bare-line @~ ref
    is still flagged (per D-01).

    Filter survivors against the allowlist inside `findBareLineAtTildeRefs` (or
    immediately after the walk, before returning): drop a survivor only when its
    relative file path matches an allowlist key AND its trimmed line content is in that
    key's Set. Use the same `path.relative(REPO_ROOT, fullPath)` form as the existing
    survivor objects so keys compare with forward-slash separators. Match on the trimmed
    line content (per D-02 — refs are bare-line, the trimmed line IS the ref string).

    Do NOT modify the workflow source files (per D-02) — the deliberate refs stay.
  </action>
  <verify>
    <automated>node --test tests/bug-phase45-eta-wiring.test.cjs 2>&1 | tail -8</automated>
  </verify>
  <done>
    INTG-02 "get-shit-done/workflows/ has zero bare-line @~ survivors" passes; all
    other INTG-02 layer tests still pass; whole file reports fail 0. The 5 workflow
    refs remain unchanged on disk. Allowlist is exact (file path + ref string), so a
    hypothetical new bare-line @~ ref would still fail.
  </done>
</task>

<task type="auto">
  <name>Task 2: Verify W016 green and mark both deferred items resolved</name>
  <files>.planning/quick/260531-mvd-replace-dead-context-window-ternary-gate/260531-mvd-deferred-items.md</files>
  <read_first>.planning/quick/260531-mvd-replace-dead-context-window-ternary-gate/260531-mvd-deferred-items.md</read_first>
  <action>
    First run `node --test tests/verify-health.test.cjs` and confirm fail 0 (per D-03 —
    W016/addAiIntegrationPhaseKey is no longer reproducing).

    Then edit the deferred-items file:
    - Update the "### TODO (address later): add new @-refs to the test exclusion list"
      section to note it is RESOLVED as of 2026-05-31, pointing at the now-implemented
      precise allowlist in tests/bug-phase45-eta-wiring.test.cjs (per quick task
      260531-ncu).
    - Update the "## W016 / addAiIntegrationPhaseKey" section to note it is
      resolved/no-longer-reproducing as of 2026-05-31 (verify-health.test.cjs reports
      fail 0), rather than leaving it as an open concern (per D-03).
  </action>
  <verify>
    <automated>node --test tests/verify-health.test.cjs 2>&1 | tail -6</automated>
  </verify>
  <done>
    verify-health.test.cjs reports fail 0; deferred-items file's INTG-02 TODO section
    points at the implemented allowlist and is marked resolved; W016 section is marked
    resolved/no-longer-reproducing as of 2026-05-31.
  </done>
</task>

</tasks>

<verification>
Both test suites green:
- `node --test tests/bug-phase45-eta-wiring.test.cjs` → fail 0 (INTG-02 fully green)
- `node --test tests/verify-health.test.cjs` → fail 0
The 5 deliberate bare-line @~ refs remain unchanged in the workflow files.
</verification>

<success_criteria>
- INTG-02 passes via a precise, documented allowlist (not a broad regex relaxation)
- No workflow source files reverted
- Both deferred items marked resolved with date and pointer to the implemented fix
- Both named test suites report fail 0
</success_criteria>

<output>
Create `.planning/quick/260531-ncu-address-intg-02-test-exclusion-list-todo/260531-ncu-SUMMARY.md` when done
</output>
