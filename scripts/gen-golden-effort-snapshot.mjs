#!/usr/bin/env node
/**
 * Generator for tests/fixtures/golden-effort-snapshot.json.
 *
 * Drives resolveModelInternal + resolveReasoningEffortInternal over the full
 * agent × profile × runtime matrix and writes a static literal golden fixture.
 * The committed fixture stores resolver output values that the test can compare
 * against — values the resolver cannot shift at test time (D-01 / D-02).
 *
 * Run: node scripts/gen-golden-effort-snapshot.mjs
 * Freshness check: inspect the committed JSON and compare to resolver output.
 *
 * Plan decisions applied:
 *   D-A1: adaptive profile included in the matrix (5 profiles total).
 *   D-A2: codex rows store resolver output (e.g. 'max'), not translated 'xhigh'.
 *   D-02: omitContract holds exactly one row per non-effort runtime (13 rows).
 */

import { writeFile, rename, unlink, mkdir, rm, writeFile as writeFileFs } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const require = createRequire(import.meta.url);

const {
  resolveModelInternal,
  resolveReasoningEffortInternal,
} = require('../get-shit-done/bin/lib/core.cjs');

const {
  MODEL_PROFILES,
  KNOWN_RUNTIMES,
  RUNTIMES_WITH_REASONING_EFFORT,
} = require('../get-shit-done/bin/lib/model-catalog.cjs');

// ─── Matrix dimensions ────────────────────────────────────────────────────────

const agents = Object.keys(MODEL_PROFILES); // 33 agents from catalog
const profiles = ['quality', 'balanced', 'budget', 'adaptive', 'inherit']; // D-A1: adaptive included
const effortRuntimes = [...RUNTIMES_WITH_REASONING_EFFORT]; // ['claude', 'codex'] — static allowlist
const nonEffortRuntimes = [...KNOWN_RUNTIMES].filter(r => !RUNTIMES_WITH_REASONING_EFFORT.has(r)); // 13 runtimes

// ─── Config helpers ───────────────────────────────────────────────────────────

/**
 * Creates a temp project dir with a .planning/config.json set to the given
 * runtime and model_profile. Returns the dir path; caller must clean it up.
 */
async function makeTempProjectDir(runtime, profile) {
  const dir = join(tmpdir(), `gsd-golden-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const planningDir = join(dir, '.planning');
  await mkdir(planningDir, { recursive: true });
  await writeFileFs(
    join(planningDir, 'config.json'),
    JSON.stringify({ runtime, model_profile: profile }, null, 2),
    'utf-8',
  );
  return dir;
}

async function cleanTempDir(dir) {
  await rm(dir, { recursive: true, force: true }).catch(() => {});
}

// ─── Main generation ──────────────────────────────────────────────────────────

async function main() {
  const rows = [];

  // Iterate over all agent × profile × effortRuntime combinations
  for (const agent of agents) {
    for (const profile of profiles) {
      for (const runtime of effortRuntimes) {
        const dir = await makeTempProjectDir(runtime, profile);
        try {
          const expectedModel = resolveModelInternal(dir, agent);
          // D-A2: store resolver output verbatim (e.g. 'max'), NOT translated 'xhigh'
          const expectedEffort = resolveReasoningEffortInternal(dir, agent);
          rows.push({ agent, profile, runtime, expectedModel, expectedEffort });
        } finally {
          await cleanTempDir(dir);
        }
      }
    }
  }

  // omitContract: one row per non-effort runtime (D-02 — NOT 33×profile rows)
  const omitContract = [];
  for (const runtime of nonEffortRuntimes) {
    const sampleAgent = 'gsd-executor';
    const sampleProfile = 'balanced';
    const dir = await makeTempProjectDir(runtime, sampleProfile);
    try {
      const actualEffort = resolveReasoningEffortInternal(dir, sampleAgent);
      if (actualEffort !== null) {
        throw new Error(
          `Non-effort runtime '${runtime}' returned effort '${actualEffort}' — expected null. ` +
          'Update RUNTIMES_WITH_REASONING_EFFORT allowlist or fix the resolver.',
        );
      }
      omitContract.push({ runtime, sampleAgent, sampleProfile, expectedEffort: null });
    } finally {
      await cleanTempDir(dir);
    }
  }

  const fixture = {
    generated: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    description: 'Static post-D-08 golden: agent × profile × runtime',
    rows,
    omitContract,
  };

  // Atomic write: write to a unique sibling temp path in the same directory
  // then rename over the destination (prevents truncated-read race #260531-rej).
  const outPath = fileURLToPath(new URL('../tests/fixtures/golden-effort-snapshot.json', import.meta.url));
  const tmpPath = `${outPath}.tmp-${process.pid}-${Date.now()}`;
  try {
    await writeFile(tmpPath, JSON.stringify(fixture, null, 2), 'utf-8');
    await rename(tmpPath, outPath);
  } catch (err) {
    await unlink(tmpPath).catch(() => {});
    throw err;
  }

  console.log(`Written: ${outPath}`);
  console.log(`  rows: ${rows.length}, omitContract: ${omitContract.length}`);
}

// Only run when invoked directly (not when imported)
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
