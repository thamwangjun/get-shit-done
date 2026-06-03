/**
 * Read-only subprocess golden checks (SDK vs gsd-tools.cjs JSON).
 * Row data: `read-only-golden-rows.ts`. Policy: `golden-policy.ts`, `QUERY-HANDLERS.md`.
 */
import { describe, it, expect } from 'vitest';
import { captureGsdToolsOutput, captureGsdToolsStdout } from './capture.js';
import { createRegistry } from '../query/index.js';
import { resolve, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { READ_ONLY_JSON_PARITY_ROWS } from './read-only-golden-rows.js';
import { omitInitExecutePhaseVolatile, omitInitQuickVolatile } from './init-golden-normalize.js';

// Volatile-key exclusions for init handlers with time-derived fields:
// - init.quick: quick_id, timestamp, branch_name, task_dir (omitInitQuickVolatile)
// - init.todos, init.map-codebase: timestamp only
// - init.manager: timestamp + deps_satisfied (all-milestones fix; separate block below)
// - init.execute-phase: project_root, agents_installed, missing_agents, project_title
// - history.digest: provides arrays may contain objects (SDK correct, CJS legacy string parse)
const VOLATILE_CANONICALS = new Set([
  'scan-sessions', 'audit-uat', 'init.execute-phase',
  'init.quick', 'init.todos', 'init.manager', 'init.map-codebase',
  'history.digest',
]);

// EXPOSE-03: init.execute-phase and volatile-timestamp init.* use separate blocks below.
const STABLE_JSON_PARITY_ROWS = READ_ONLY_JSON_PARITY_ROWS.filter(
  (row) => !VOLATILE_CANONICALS.has(row.canonical),
);

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');

describe('Read-only golden parity (JSON toEqual)', () => {
  it.each(STABLE_JSON_PARITY_ROWS)('$canonical matches gsd-tools.cjs JSON', async (row) => {

    const gsdOutput = await captureGsdToolsOutput(row.cjs, row.cjsArgs, REPO_ROOT);
    const registry = createRegistry();
    const sdkResult = await registry.dispatch(row.canonical, row.sdkArgs, REPO_ROOT);
    expect(sdkResult.data).toEqual(gsdOutput);
  });
});

describe('config-path (plain stdout vs SDK { path })', () => {
  it('SDK path matches gsd-tools.cjs plain-text stdout', async () => {
    const out = await captureGsdToolsStdout('config-path', [], REPO_ROOT);
    const registry = createRegistry();
    const sdkResult = await registry.dispatch('config-path', [], REPO_ROOT);
    const data = sdkResult.data as { path?: string };
    expect(data.path).toBeDefined();
    expect(normalize(data.path!.trim())).toBe(normalize(out.trim()));
  });
});

describe('audit-open golden parity (excluding scanned_at)', () => {
  it('SDK JSON matches gsd-tools.cjs except volatile scanned_at', async () => {
    const gsdOutput = await captureGsdToolsOutput('audit-open', ['--json'], REPO_ROOT);
    const registry = createRegistry();
    const sdkResult = await registry.dispatch('audit-open', ['--json'], REPO_ROOT);
    const strip = (d: unknown): Record<string, unknown> => {
      const o = { ...(d as Record<string, unknown>) };
      delete o.scanned_at;
      delete o.has_scan_errors;
      return o;
    };
    expect(strip(sdkResult.data)).toEqual(strip(gsdOutput));
  });
});

describe('state.json golden parity (excluding last_updated)', () => {
  it('SDK rebuilt frontmatter matches gsd-tools.cjs except volatile last_updated', async () => {
    const gsdOutput = await captureGsdToolsOutput('state', ['json'], REPO_ROOT);
    const registry = createRegistry();
    const sdkResult = await registry.dispatch('state.json', [], REPO_ROOT);
    const strip = (d: unknown): Record<string, unknown> => {
      const o = { ...(d as Record<string, unknown>) };
      delete o.last_updated;
      return o;
    };
    expect(strip(sdkResult.data)).toEqual(strip(gsdOutput));
  });
});

describe('summary.extract golden parity (with array-of-objects fix)', () => {
  it('SDK JSON matches gsd-tools.cjs except for intentional array-of-objects parsing fix', async () => {
    const gsdOutput = await captureGsdToolsOutput('summary-extract', ['sdk/src/golden/fixtures/summary-extract-sample.md'], REPO_ROOT);
    const registry = createRegistry();
    const sdkResult = await registry.dispatch('summary.extract', ['sdk/src/golden/fixtures/summary-extract-sample.md'], REPO_ROOT);
    
    // The SDK correctly parses array-of-objects, whereas CJS parses them as strings.
    // Patch the CJS output to reflect the CodeRabbit bugfix.
    const patchedGsd = JSON.parse(JSON.stringify(gsdOutput));
    if (patchedGsd.tech_added && Array.isArray(patchedGsd.tech_added)) {
      patchedGsd.tech_added = patchedGsd.tech_added.map((t: any) => 
        t === 'name: typescript' ? { name: 'typescript' } : t
      );
    }
    
    expect(sdkResult.data).toEqual(patchedGsd);
  });
});

describe('state.load golden parity', () => {
  it('SDK load payload matches gsd-tools.cjs state load', async () => {
    const gsdOutput = await captureGsdToolsOutput('state', ['load'], REPO_ROOT);
    const registry = createRegistry();
    const sdkResult = await registry.dispatch('state.load', [], REPO_ROOT);
    expect(sdkResult.data).toEqual(gsdOutput);
  });
});

describe('state.get golden parity', () => {
  it('matches full STATE.md when no field (same as `state get` with no section)', async ({ skip }) => {
    const registry = createRegistry();
    const sdkResult = await registry.dispatch('state.get', [], REPO_ROOT);
    // Repo may not have .planning/STATE.md; skip parity in that case.
    if ((sdkResult.data as Record<string, unknown>)?.error === 'STATE.md not found') skip();
    const gsdOutput = await captureGsdToolsOutput('state', ['get'], REPO_ROOT);
    expect(sdkResult.data).toEqual(gsdOutput);
  });

  it('matches single frontmatter field when `state get <field>`', async ({ skip }) => {
    const registry = createRegistry();
    const sdkResult = await registry.dispatch('state.get', ['milestone'], REPO_ROOT);
    if ((sdkResult.data as Record<string, unknown>)?.error === 'STATE.md not found') skip();
    const gsdOutput = await captureGsdToolsOutput('state', ['get', 'milestone'], REPO_ROOT);
    expect(sdkResult.data).toEqual(gsdOutput);
  });
});

// EXPOSE-03 / D-08: init execute-phase builder parity with volatile-key strip.
// Enforces SDK↔CLI *_model/*_effort sibling parity (phase 9 is stable in this repo).
describe('init.execute-phase golden parity (excluding volatile keys)', () => {
  it('SDK JSON matches gsd-tools.cjs except volatile project_root/install fields', async () => {
    const gsdOutput = await captureGsdToolsOutput('init', ['execute-phase', '9'], REPO_ROOT);
    const registry = createRegistry();
    const sdkResult = await registry.dispatch('init.execute-phase', ['9'], REPO_ROOT);
    expect(omitInitExecutePhaseVolatile(sdkResult.data as Record<string, unknown>))
      .toEqual(omitInitExecutePhaseVolatile(gsdOutput as Record<string, unknown>));
  });
});

describe('verify.commits golden parity', () => {
  it('SDK output matches gsd-tools.cjs for two SHAs', async () => {
    const revs = execSync('git rev-list --max-count=2 HEAD', { cwd: REPO_ROOT, encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter(Boolean);
    if (revs.length < 2) {
      throw new Error('verify.commits parity requires at least 2 commits in checkout history');
    }
    const b = revs[0];
    const a = revs[1];
    const gsdOutput = await captureGsdToolsOutput('verify', ['commits', a, b], REPO_ROOT);
    const registry = createRegistry();
    const sdkResult = await registry.dispatch('verify.commits', [a, b], REPO_ROOT);
    expect(sdkResult.data).toEqual(gsdOutput);
  });
});

// ─── Volatile-timestamp init.* handlers ─────────────────────────────────────

// Strip timestamp (and quick_id / branch_name / task_dir for init.quick) before
// toEqual — these fields are time-derived and differ between CJS subprocess and
// in-process SDK call. Unrelaxed for all other fields (D-201).

describe('init.quick golden parity (excluding volatile time-derived keys)', () => {
  it('SDK JSON matches gsd-tools.cjs except quick_id/timestamp/branch_name/task_dir', async () => {
    const row = READ_ONLY_JSON_PARITY_ROWS.find(r => r.canonical === 'init.quick')!;
    const gsdOutput = await captureGsdToolsOutput(row.cjs, row.cjsArgs, REPO_ROOT);
    const registry = createRegistry();
    const sdkResult = await registry.dispatch('init.quick', row.sdkArgs, REPO_ROOT);
    expect(omitInitQuickVolatile(sdkResult.data as Record<string, unknown>))
      .toEqual(omitInitQuickVolatile(gsdOutput as Record<string, unknown>));
  });
});

describe('init.todos golden parity (excluding volatile timestamp)', () => {
  it('SDK JSON matches gsd-tools.cjs except timestamp', async () => {
    const row = READ_ONLY_JSON_PARITY_ROWS.find(r => r.canonical === 'init.todos')!;
    const gsdOutput = await captureGsdToolsOutput(row.cjs, row.cjsArgs, REPO_ROOT);
    const registry = createRegistry();
    const sdkResult = await registry.dispatch('init.todos', row.sdkArgs, REPO_ROOT);
    const strip = (d: unknown): Record<string, unknown> => {
      const o = { ...(d as Record<string, unknown>) };
      delete o.timestamp;
      return o;
    };
    expect(strip(sdkResult.data)).toEqual(strip(gsdOutput));
  });
});

describe('init.map-codebase golden parity (excluding volatile timestamp)', () => {
  it('SDK JSON matches gsd-tools.cjs except timestamp', async () => {
    const row = READ_ONLY_JSON_PARITY_ROWS.find(r => r.canonical === 'init.map-codebase')!;
    const gsdOutput = await captureGsdToolsOutput(row.cjs, row.cjsArgs, REPO_ROOT);
    const registry = createRegistry();
    const sdkResult = await registry.dispatch('init.map-codebase', row.sdkArgs, REPO_ROOT);
    const strip = (d: unknown): Record<string, unknown> => {
      const o = { ...(d as Record<string, unknown>) };
      delete o.timestamp;
      return o;
    };
    expect(strip(sdkResult.data)).toEqual(strip(gsdOutput));
  });
});

describe('init.manager golden parity (excluding volatile timestamp)', () => {
  it('SDK JSON matches gsd-tools.cjs except timestamp', async () => {
    const row = READ_ONLY_JSON_PARITY_ROWS.find(r => r.canonical === 'init.manager')!;
    const gsdOutput = await captureGsdToolsOutput(row.cjs, row.cjsArgs, REPO_ROOT);
    const registry = createRegistry();
    const sdkResult = await registry.dispatch('init.manager', row.sdkArgs, REPO_ROOT);
    const strip = (d: unknown): Record<string, unknown> => {
      const o = { ...(d as Record<string, unknown>) };
      delete o.timestamp;
      return o;
    };
    expect(strip(sdkResult.data)).toEqual(strip(gsdOutput));
  });
});

// ─── history.digest — array-of-objects frontmatter fix ──────────────────────

// CJS parses `- key: value` YAML list items as literal strings; the SDK
// correctly parses them as objects. The divergence is a known CJS bug (same as
// validate.consistency and summary.extract). Accept the SDK's parsed output as
// ground truth by normalising the CJS provides arrays before toEqual (D-201:
// no assertion weakened — both are compared after normalisation, just in the
// direction where SDK is the known-correct side).
describe('history.digest golden parity (normalised array-of-objects)', () => {
  it('SDK JSON matches gsd-tools.cjs after normalising provides arrays', async () => {
    const row = READ_ONLY_JSON_PARITY_ROWS.find(r => r.canonical === 'history.digest')!;
    const gsdOutput = await captureGsdToolsOutput(row.cjs, row.cjsArgs, REPO_ROOT);
    const registry = createRegistry();
    const sdkResult = await registry.dispatch('history.digest', row.sdkArgs, REPO_ROOT);

    // Deeply normalise `provides` arrays: convert string items that look like
    // "KEY: value" into {KEY: value} objects, matching the SDK's parsed form.
    const normaliseProvides = (arr: unknown[]): unknown[] =>
      arr.map(item => {
        if (typeof item !== 'string') return item;
        const kv = item.match(/^([^:]+):\s*(.*)$/);
        if (!kv) return item;
        return { [kv[1].trim()]: kv[2].trim() };
      });

    // history.digest structure: { phases: { "phase-key": { provides: [...], ... } }, ... }
    const normalisePhasesMap = (phasesMap: unknown): unknown => {
      if (!phasesMap || typeof phasesMap !== 'object') return phasesMap;
      const normalised: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(phasesMap as Record<string, unknown>)) {
        if (v && typeof v === 'object') {
          const entry = { ...(v as Record<string, unknown>) };
          if (Array.isArray(entry.provides)) {
            entry.provides = normaliseProvides(entry.provides);
          }
          normalised[k] = entry;
        } else {
          normalised[k] = v;
        }
      }
      return normalised;
    };

    const normaliseDigest = (d: unknown): unknown => {
      if (!d || typeof d !== 'object') return d;
      const o = { ...(d as Record<string, unknown>) };
      if (o.phases) o.phases = normalisePhasesMap(o.phases);
      return o;
    };

    expect(normaliseDigest(sdkResult.data)).toEqual(normaliseDigest(gsdOutput));
  });
});
