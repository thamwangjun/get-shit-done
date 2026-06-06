---
phase: quick
plan: 260606-tbq
type: execute
wave: 1
depends_on: []
files_modified:
  - sdk/src/query/config-query.ts
  - sdk/src/query/resolve-model-effort.test.ts
autonomous: true
requirements: []

must_haves:
  truths:
    - "runtime:'claude' + catalog slot 'sonnet;medium' resolves effort:'medium', not null"
    - "runtime:'claude' + bare catalog slot 'sonnet' resolves effort:'medium' (D-08 floor)"
    - "runtime:'codex' + haiku-slotted agent resolves effort:null, not 'medium'"
    - "All three gaps are covered by targeted parity tests that confirm RED before GREEN"
    - "cd sdk && npm test passes with fail:0 after the fix"
    - "npm test from root stays green (fail:0)"
  artifacts:
    - path: "sdk/src/query/config-query.ts"
      provides: "resolveModel with corrected effort chain for claude path"
    - path: "sdk/src/query/resolve-model-effort.test.ts"
      provides: "Three targeted parity tests covering gaps 1, 2, and 3"
  key_links:
    - from: "resolveModel (config-query.ts)"
      to: "resolveReasoningEffortInternal (core.cjs)"
      via: "effort precedence chain parity"
      pattern: "return 'medium'"
---

<objective>
Fix three divergences between the SDK resolver (sdk/src/query/config-query.ts resolveModel)
and the CLI resolver (get-shit-done/bin/lib/core.cjs resolveReasoningEffortInternal) so
both return identical model+effort shapes for all runtime/catalog combinations.

Purpose: The SDK is the authoritative query interface for agent spawn wiring. When it
diverges from the CLI, spawned agents receive wrong effort tokens — either missing effort
on claude+sonnet;medium slots (Gap 1), missing the medium floor on bare claude slots (Gap 2),
or a spurious medium on haiku codex slots (Gap 3).

Output: Patched config-query.ts, three new parity tests, all SDK+root tests green.
</objective>

<execution_context>
<purpose>Execute quick task: fix 3 SDK effort resolution gaps.</purpose>

<required_reading>
Read STATE.md before any operation to load project context.
Read config.json for planning behavior settings.
Consult `$HOME/.claude/get-shit-done/references/git-integration.md` before creating any commit.
</required_reading>
</execution_context>

<context>
!`cat .planning/STATE.md`
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add three failing parity tests then patch resolveModel to make them pass</name>
  <files>sdk/src/query/resolve-model-effort.test.ts, sdk/src/query/config-query.ts</files>

  <behavior>
    Gap 1 test — catalog slot effort extracted on claude path:
      - config: { model_profile: 'balanced', runtime: 'claude' }
      - agent: 'gsd-executor' whose balanced slot in MODEL_PROFILES is 'sonnet'
      - BUT model_profile_overrides.claude.sonnet is set to 'claude-sonnet-4-6;medium'
        (simulating a catalog slot with ;effort suffix)
      - Alternatively: directly set model_overrides: { 'gsd-executor': 'sonnet;medium' }
        which already works via the override path — instead target the catalog alias path
        by injecting rawAlias with ;suffix via a config that maps gsd-executor's balanced
        slot through MODEL_PROFILES to a value that includes the ;effort suffix
      - SIMPLEST approach: use model_profile_overrides.claude.sonnet = { model: 'claude-sonnet-4-6', reasoning_effort: 'medium' } is already step 3a; the real Gap 1 is rawAlias itself carrying ;medium
      - Concrete fixture: write config.json with runtime:'claude' and NO model_overrides, NO model_profile_overrides. Directly patch MODEL_PROFILES in the test module, OR use a custom profile. Actually the cleanest path is: use a codex catalog slot (runtime:'codex') where runtimeTier.model is truthy and tier='sonnet;medium' (via models.execute:'sonnet;medium') — then step 3 must extract 'medium' from tier. This IS currently tested but the ;suffix is only possible if phaseTier carries it.
      - Concrete testable scenario for Gap 1: config.runtime='codex', config.models.execute='sonnet;medium', agent='gsd-executor' (AGENT_TO_PHASE_TYPE[gsd-executor]=execute). Then runtimeTier?.model is truthy (codex sonnet entry), tier='sonnet;medium', parseModelEffort(tier).effort='medium'. This SHOULD work in the current code (step 3). Verify this test passes already or fails.
      - ALTERNATIVE Gap 1 path (claude): config.runtime='claude', rawAlias for gsd-executor balanced slot carries ;medium. rawAlias comes from MODEL_PROFILES[agentType][profile]. Since MODEL_PROFILES is imported from a module, to inject ;medium into rawAlias we need model_profile_overrides.claude.sonnet to be a string 'claude-sonnet-4-6;medium' which goes through step 3a (userSuppliedEffort from parseModelEffort(rawOverride).effort). But that's step 3a in the CLI, not step 3. In the SDK on the claude path, runtimeTier is null so we never reach step 3/4. The SDK falls straight to effort:null at line 339. THAT is the real Gap 1.
      - Confirmed Gap 1 scenario: runtime:'claude', agent='gsd-executor', model_profile_overrides.claude.sonnet = 'claude-sonnet-4-6;medium'. CLI step 3a extracts 'medium'. SDK returns null because it never reaches the runtimeTier block.

    Gap 1 test spec:
      input: config { model_profile:'balanced', runtime:'claude', model_profile_overrides:{ claude:{ sonnet:'claude-sonnet-4-6;medium' } } }, agent:'gsd-executor'
      expected: data.effort === 'medium'
      (CLI resolveReasoningEffortInternal would return 'medium' via step 3a userSuppliedEffort)

    Gap 2 test spec (medium floor):
      input: config { model_profile:'balanced', runtime:'claude' }, agent:'gsd-executor'
      (bare catalog, no model_profile_overrides, no model_overrides)
      expected: data.effort === 'medium'
      (CLI returns 'medium' from the D-08 floor at the end of resolveReasoningEffortInternal)

    Gap 3 test spec (haiku null guard):
      input: config { model_profile:'balanced', runtime:'codex' }, agent:'gsd-codebase-mapper'
      (gsd-codebase-mapper is a haiku-slotted agent — verify AGENT_TO_PHASE_TYPE maps it to a haiku profile slot, or use model_overrides:{'gsd-executor':'haiku'} as a simpler proxy since override path already has the guard; use models.execute:'haiku' with runtime:'codex' instead)
      Simplest: config { model_profile:'balanced', runtime:'codex', models:{ execute:'haiku' } }, agent:'gsd-executor'
      Then tier='haiku', resolveRuntimeTier returns a haiku codex entry, runtimeTier.reasoning_effort may be set, but haiku guard must null it out.
      expected: data.effort === null

    TDD sequence:
      1. Write all three tests first — confirm RED (all three fail)
      2. Patch config-query.ts to make them GREEN
      3. Re-run sdk tests to confirm no regressions
  </behavior>

  <action>
    STEP 1 — RED: Add three tests to resolve-model-effort.test.ts in a new describe block
    "resolveModel effort parity gaps (Gap 1/2/3 regression)".

    Gap 1 test (claude path, model_profile_overrides ;suffix):
    Set up config with runtime:'claude', model_profile_overrides.claude.sonnet =
    'claude-sonnet-4-6;medium', call resolveModel(['gsd-executor'], tmpDir).
    Assert data.effort === 'medium'. This will RED because the claude-path fallthrough
    at line 335 and 339 hardcodes effort:null.

    Gap 2 test (claude path, medium floor):
    Set up config with runtime:'claude', no overrides, call resolveModel(['gsd-executor'], tmpDir).
    Assert data.effort === 'medium'. This will RED because there is no floor on the claude path.

    Gap 3 test (haiku guard on codex runtimeTier path):
    Set up config with runtime:'codex', models.execute:'haiku', call resolveModel(['gsd-executor'], tmpDir).
    Assert data.effort === null. This will RED if the codex catalog has a reasoning_effort
    entry for haiku that leaks through without the haiku guard.
    First check: grep the model-catalog.json for haiku codex reasoning_effort — if null/absent,
    Gap 3 may not produce a RED on this fixture. In that case, additionally set
    model_profile_overrides.codex.haiku.reasoning_effort:'medium' to force step 4 to emit
    non-null, making the missing guard visible.

    Run `cd sdk && npm test -- --reporter=verbose 2>&1 | grep -A3 "Gap 1\|Gap 2\|Gap 3"` to confirm RED.

    STEP 2 — GREEN: Patch sdk/src/query/config-query.ts resolveModel function.

    The three fixes all apply inside resolveModel, in the section after the runtimeTier
    block (lines 297-316) that handles the claude/no-runtimeTier case.

    Fix A (Gap 2 — medium floor, applies to BOTH claude path falls and runtimeTier path):
    After the runtimeTier?.model block (line 316) and before the existing fallback returns,
    insert: if the computed effort is null AND effortAllowed, override effort with 'medium'.
    The cleanest placement is just before each `return { data: { model: ..., effort: null } }`
    on the claude-only paths. Instead, restructure the claude fallthrough to compute effort
    from the model_profile_overrides step (step 3a) and apply the floor.

    Specifically — insert a block BEFORE line 318 (after the runtimeTier block) that handles
    the claude runtime path:
    ```
    // Claude path: resolveRuntimeTier returns null for claude — handle effort here.
    if (effortAllowed) {
      // Step 3a: check model_profile_overrides for the resolved tier's ;effort suffix or reasoning_effort
      const bareTier = parseModelEffort(tier).model as string;   // e.g. 'sonnet'
      // D-03: haiku never emits effort
      if (bareTier !== 'haiku') {
        const profileOverrides = (config as Record<string, unknown>).model_profile_overrides as
          Record<string, unknown> | undefined;
        const runtimeOverrides = profileOverrides?.[effectiveRuntime] as Record<string, unknown> | undefined;
        const rawOverride = runtimeOverrides?.[bareTier];
        let slotEffort: string | null = null;
        if (typeof rawOverride === 'string') {
          slotEffort = parseModelEffort(rawOverride).effort ?? null;
        } else if (rawOverride && typeof rawOverride === 'object') {
          slotEffort = (rawOverride as Record<string, string | null>).reasoning_effort ?? null;
        }
        // D-08: floor to 'medium' when no explicit effort found
        const resolvedEffort = slotEffort ?? 'medium';
        // Now return with resolved effort instead of null
        if (isClaudeRuntime && isRuntimeTierName(tier)) { ... apply to claudeDefault path }
        // Fall through to the final alias return with correct effort
      }
    }
    ```

    IMPORTANT: Do not just paste code — the action describes the intent. The actual implementation
    must mirror the CLI's resolveReasoningEffortInternal steps precisely:

    For the claude path (runtimeTier is null because resolveRuntimeTier bails for claude):
    1. Compute bareTier = parseModelEffort(tier).model
    2. If bareTier === 'haiku', effort stays null — return immediately (Gap 3 applies on codex path too)
    3. Check model_profile_overrides[effectiveRuntime][bareTier] for a ;effort string or reasoning_effort field (step 3a of CLI)
    4. If found, that is the effort
    5. If not found, apply D-08 floor: effort = 'medium'
    6. Return { model: alias, profile, effort } on the final alias path

    Also apply the haiku guard + floor to the runtimeTier?.model block for codex (Gap 3):
    Inside the `if (runtimeTier?.model)` block, after computing `effort` via steps 3+4,
    add:
    ```
    const bareTierForGuard = (parseModelEffort(tier).model as string) || tier;
    if (bareTierForGuard === 'haiku') effort = null;  // D-03: haiku never emits effort
    else if (effortAllowed && effort === null) effort = 'medium';  // D-08: floor
    ```
    Place this BEFORE `const result = { model: runtimeTier.model, profile, effort }`.

    The isClaudeRuntime variable is already declared at line 331 — use it in the claude-effort
    block inserted before line 318. The `effectiveRuntime` variable is already set at line 247.

    STEP 3 — VERIFY GREEN: Run `cd sdk && npm test 2>&1 | tail -20` to confirm all three
    new tests pass and zero regressions. Then run `npm test` from root.
  </action>

  <verify>
    <automated>cd /Users/thamw/development/local/get-shit-done/sdk && npm test 2>&1 | tail -30</automated>
  </verify>

  <done>
    - Three new tests in resolve-model-effort.test.ts describe block "resolveModel effort parity gaps" all pass
    - Gap 1: resolveModel with runtime:'claude' + model_profile_overrides.claude.sonnet carrying ;suffix returns effort matching the suffix
    - Gap 2: resolveModel with runtime:'claude' + bare catalog returns effort:'medium' (D-08 floor)
    - Gap 3: resolveModel with runtime:'codex' + haiku-slotted tier returns effort:null (D-03 haiku guard)
    - cd sdk && npm test exits with 0 failures
    - npm test from project root exits with 0 failures
    - No existing test assertions were weakened or deleted
  </done>
</task>

</tasks>

<verification>
cd /Users/thamw/development/local/get-shit-done/sdk && npm test 2>&1 | grep -E "fail|pass|Tests"
npm test 2>&1 | grep -E "fail|pass|Tests"
</verification>

<success_criteria>
- resolve-model-effort.test.ts has 3 new parity tests covering Gaps 1, 2, 3
- config-query.ts resolveModel produces effort:'medium' for runtime:'claude' + bare balanced slot
- config-query.ts resolveModel extracts effort from ;suffix in model_profile_overrides on claude path
- config-query.ts resolveModel returns effort:null for haiku-tier agent on any runtime
- cd sdk && npm test: 0 failures
- npm test from root: 0 failures
</success_criteria>

<output>
Create `.planning/quick/260606-tbq-fix-3-sdk-effort-resolution-gaps-in-sdk-/260606-tbq-SUMMARY.md` when done
</output>
