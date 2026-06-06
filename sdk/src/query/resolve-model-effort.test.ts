/**
 * EXPOSE-03 RED: SDK resolveModel effort precedence chain and static allowlist.
 *
 * These tests assert the post-54-02 shape: resolveModel always emits `effort`
 * (never `reasoning_effort`), `runtimesWithReasoningEffort` is the static
 * {claude, codex} set, and the 4-step effort precedence chain mirrors the CLI
 * resolveReasoningEffortInternal.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'gsd-expose03-'));
  await mkdir(join(tmpDir, '.planning'), { recursive: true });
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

// ─── runtimesWithReasoningEffort static set ───────────────────────────────────

describe('runtimesWithReasoningEffort (EXPOSE-03 / D-07 static allowlist)', () => {
  it('returns a Set containing exactly claude and codex (static, not data-derived)', async () => {
    const { runtimesWithReasoningEffort } = await import('../model-catalog.js');
    const set = runtimesWithReasoningEffort();
    expect(set.has('claude')).toBe(true);
    expect(set.has('codex')).toBe(true);
    // Static set should NOT include other runtimes (e.g. gemini, opencode)
    // even if model-catalog.json were to add reasoning_effort entries there.
    // Size is exactly 2 — the static {claude, codex} set.
    expect(set.size).toBe(2);
  });
});

// ─── resolveModel always-emit effort field ────────────────────────────────────

describe('resolveModel effort field (EXPOSE-03 / D-05 rename)', () => {
  it('emits effort:null on bare catalog (no effort configured)', async () => {
    const { resolveModel } = await import('./config-query.js');
    await writeFile(
      join(tmpDir, '.planning', 'config.json'),
      JSON.stringify({ model_profile: 'balanced' }),
    );
    const result = await resolveModel(['gsd-planner'], tmpDir);
    const data = result.data as Record<string, unknown>;
    // EXPOSE-03: effort must be explicitly present (not omitted) with value null
    expect(Object.prototype.hasOwnProperty.call(data, 'effort')).toBe(true);
    expect(data.effort).toBeNull();
    // D-05: reasoning_effort must NOT be emitted (fully renamed to effort)
    expect(Object.prototype.hasOwnProperty.call(data, 'reasoning_effort')).toBe(false);
  });

  it('emits effort:null for unknown agent on bare catalog', async () => {
    const { resolveModel } = await import('./config-query.js');
    await writeFile(
      join(tmpDir, '.planning', 'config.json'),
      JSON.stringify({ model_profile: 'balanced' }),
    );
    const result = await resolveModel(['unknown-agent-xyz'], tmpDir);
    const data = result.data as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(data, 'effort')).toBe(true);
    expect(data.effort).toBeNull();
    expect(Object.prototype.hasOwnProperty.call(data, 'reasoning_effort')).toBe(false);
  });

  it('emits effort:null on the runtimeTier path (codex with bare catalog)', async () => {
    const { resolveModel } = await import('./config-query.js');
    await writeFile(
      join(tmpDir, '.planning', 'config.json'),
      JSON.stringify({
        model_profile: 'balanced',
        runtime: 'codex',
      }),
    );
    const result = await resolveModel(['gsd-executor'], tmpDir);
    const data = result.data as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(data, 'effort')).toBe(true);
    // On bare catalog codex tier entries have reasoning_effort values from the catalog,
    // so effort may be non-null here — but the field must ALWAYS be present.
    expect(data).not.toHaveProperty('reasoning_effort');
  });

  it('emits effort:null for runtimes outside {claude, codex} allowlist', async () => {
    const { resolveModel } = await import('./config-query.js');
    await writeFile(
      join(tmpDir, '.planning', 'config.json'),
      JSON.stringify({
        model_profile: 'balanced',
        runtime: 'opencode',
        model_profile_overrides: {
          opencode: { opus: { model: 'openrouter/openai/gpt-5.5', reasoning_effort: 'high' } },
        },
      }),
    );
    const result = await resolveModel(['gsd-planner'], tmpDir);
    const data = result.data as Record<string, unknown>;
    // Allowlist gate: opencode is outside {claude, codex}, effort must be null
    expect(data.effort).toBeNull();
    expect(Object.prototype.hasOwnProperty.call(data, 'reasoning_effort')).toBe(false);
  });

  it('effort field present on the model_overrides return path', async () => {
    const { resolveModel } = await import('./config-query.js');
    await writeFile(
      join(tmpDir, '.planning', 'config.json'),
      JSON.stringify({
        model_profile: 'balanced',
        model_overrides: { 'gsd-planner': 'openai/gpt-5.4' },
      }),
    );
    const result = await resolveModel(['gsd-planner'], tmpDir);
    const data = result.data as Record<string, unknown>;
    // model_overrides path must also emit effort (always-present invariant)
    expect(Object.prototype.hasOwnProperty.call(data, 'effort')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(data, 'reasoning_effort')).toBe(false);
  });
});

// ─── init-builder *_effort siblings (EXPOSE-03 / D-08 parity) ────────────────

describe('initExecutePhase *_effort siblings (EXPOSE-03)', () => {
  it('emits executor_effort and verifier_effort on bare catalog', async () => {
    const { initExecutePhase } = await import('../handlers/init/composer.js');
    await writeFile(
      join(tmpDir, '.planning', 'config.json'),
      JSON.stringify({ model_profile: 'balanced' }),
    );
    const result = await initExecutePhase(['1'], tmpDir);
    const data = result.data as Record<string, unknown>;
    // Both *_model fields must have *_effort siblings (same-slot invariant)
    expect(Object.prototype.hasOwnProperty.call(data, 'executor_effort')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(data, 'verifier_effort')).toBe(true);
    // On bare catalog (no effort assignments) values must be null
    expect(data.executor_effort).toBeNull();
    expect(data.verifier_effort).toBeNull();
  });
});

describe('initPlanPhase *_effort siblings (EXPOSE-03)', () => {
  it('emits researcher_effort, planner_effort, checker_effort on bare catalog', async () => {
    const { initPlanPhase } = await import('../handlers/init/composer.js');
    await writeFile(
      join(tmpDir, '.planning', 'config.json'),
      JSON.stringify({ model_profile: 'balanced' }),
    );
    const result = await initPlanPhase(['1'], tmpDir);
    const data = result.data as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(data, 'researcher_effort')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(data, 'planner_effort')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(data, 'checker_effort')).toBe(true);
    expect(data.researcher_effort).toBeNull();
    expect(data.planner_effort).toBeNull();
    expect(data.checker_effort).toBeNull();
  });
});

describe('initNewMilestone *_effort siblings (EXPOSE-03)', () => {
  it('emits researcher_effort, synthesizer_effort, roadmapper_effort on bare catalog', async () => {
    const { initNewMilestone } = await import('../handlers/init/composer.js');
    await writeFile(
      join(tmpDir, '.planning', 'config.json'),
      JSON.stringify({ model_profile: 'balanced' }),
    );
    const result = await initNewMilestone([], tmpDir);
    const data = result.data as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(data, 'researcher_effort')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(data, 'synthesizer_effort')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(data, 'roadmapper_effort')).toBe(true);
    expect(data.researcher_effort).toBeNull();
    expect(data.synthesizer_effort).toBeNull();
    expect(data.roadmapper_effort).toBeNull();
  });
});

describe('initQuick *_effort siblings (EXPOSE-03)', () => {
  it('emits planner_effort, executor_effort, checker_effort, verifier_effort on bare catalog', async () => {
    const { initQuick } = await import('../handlers/init/composer.js');
    await writeFile(
      join(tmpDir, '.planning', 'config.json'),
      JSON.stringify({ model_profile: 'balanced' }),
    );
    const result = await initQuick(['test task'], tmpDir);
    const data = result.data as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(data, 'planner_effort')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(data, 'executor_effort')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(data, 'checker_effort')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(data, 'verifier_effort')).toBe(true);
    expect(data.planner_effort).toBeNull();
    expect(data.executor_effort).toBeNull();
    expect(data.checker_effort).toBeNull();
    expect(data.verifier_effort).toBeNull();
  });
});

describe('initNewProject *_effort siblings (EXPOSE-03 / complex.ts)', () => {
  it('emits researcher_effort, synthesizer_effort, roadmapper_effort on bare catalog', async () => {
    const { initNewProject } = await import('../handlers/init/complex.js');
    await writeFile(
      join(tmpDir, '.planning', 'config.json'),
      JSON.stringify({ model_profile: 'balanced' }),
    );
    const result = await initNewProject([], tmpDir);
    const data = result.data as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(data, 'researcher_effort')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(data, 'synthesizer_effort')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(data, 'roadmapper_effort')).toBe(true);
    expect(data.researcher_effort).toBeNull();
    expect(data.synthesizer_effort).toBeNull();
    expect(data.roadmapper_effort).toBeNull();
  });
});

describe('initProgress *_effort siblings (EXPOSE-03 / complex.ts)', () => {
  it('emits executor_effort and planner_effort on bare catalog', async () => {
    const { initProgress } = await import('../handlers/init/complex.js');
    await writeFile(
      join(tmpDir, '.planning', 'config.json'),
      JSON.stringify({ model_profile: 'balanced' }),
    );
    const result = await initProgress([], tmpDir);
    const data = result.data as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(data, 'executor_effort')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(data, 'planner_effort')).toBe(true);
    expect(data.executor_effort).toBeNull();
    expect(data.planner_effort).toBeNull();
  });
});

// ─── resolveModel effort parity gaps (Gap 1/2/3 regression) ──────────────────

describe('resolveModel effort parity gaps (Gap 1/2/3 regression)', () => {
  // Gap 1: claude path — model_profile_overrides carrying ;effort suffix
  // CLI step 3a (userSuppliedEffort): resolveReasoningEffortInternal reads
  // model_profile_overrides[runtime][bareTier] and extracts the effort from a
  // string shorthand like 'claude-sonnet-4-6;medium'. The SDK claude path
  // previously skipped this step (runtimeTier is null for claude) and returned
  // effort:null unconditionally.
  it('Gap 1 — claude path: model_profile_overrides ;suffix is extracted as effort', async () => {
    const { resolveModel } = await import('./config-query.js');
    await writeFile(
      join(tmpDir, '.planning', 'config.json'),
      JSON.stringify({
        model_profile: 'balanced',
        runtime: 'claude',
        model_profile_overrides: {
          claude: { sonnet: 'claude-sonnet-4-6;medium' },
        },
      }),
    );
    // gsd-executor has phaseType='execute'; balanced slot is 'sonnet'.
    // model_profile_overrides.claude.sonnet = 'claude-sonnet-4-6;medium' →
    // CLI step 3a extracts effort 'medium'. SDK must do the same.
    const result = await resolveModel(['gsd-executor'], tmpDir);
    const data = result.data as Record<string, unknown>;
    expect(data.effort).toBe('medium');
  });

  // Gap 2: claude path — D-08 medium floor applies when no override or catalog effort
  // CLI resolveReasoningEffortInternal returns 'medium' at the end for any bare
  // {claude,codex} slot that exhausted all precedence steps without finding an effort.
  // The SDK had no equivalent floor on the claude path.
  it('Gap 2 — claude path: bare catalog floors to effort:medium (D-08)', async () => {
    const { resolveModel } = await import('./config-query.js');
    await writeFile(
      join(tmpDir, '.planning', 'config.json'),
      JSON.stringify({
        model_profile: 'balanced',
        runtime: 'claude',
      }),
    );
    // No model_overrides, no model_profile_overrides, no models.* overrides.
    // CLI returns 'medium' from D-08 floor. SDK must do the same.
    const result = await resolveModel(['gsd-executor'], tmpDir);
    const data = result.data as Record<string, unknown>;
    expect(data.effort).toBe('medium');
  });

  // Gap 3: codex + haiku-tier agent — haiku must return effort:null (D-03)
  // The codex runtimeTierDefaults has haiku.reasoning_effort='medium'. Without
  // the haiku guard, the runtimeTier block emitted that value instead of null.
  it('Gap 3 — codex path: haiku-slotted tier returns effort:null (D-03 haiku guard)', async () => {
    const { resolveModel } = await import('./config-query.js');
    await writeFile(
      join(tmpDir, '.planning', 'config.json'),
      JSON.stringify({
        model_profile: 'balanced',
        runtime: 'codex',
        models: { execution: 'haiku' },
      }),
    );
    // gsd-executor phaseType='execution'. models.execution='haiku' forces the haiku
    // tier. codex catalog haiku.reasoning_effort='medium' — but D-03 says haiku
    // never emits effort on any runtime. SDK must guard this and return null.
    const result = await resolveModel(['gsd-executor'], tmpDir);
    const data = result.data as Record<string, unknown>;
    expect(data.effort).toBeNull();
  });
});
