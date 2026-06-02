/**
 * check-completeness.js — Post-handover completeness check for CATALOG-02
 *
 * Run from the project root:
 *   node .planning/phases/55-catalog-schema-user-handover/check-completeness.js
 *
 * Reads sdk/shared/model-catalog.json and calls the Phase 53 resolver
 * (resolveReasoningEffortInternal from get-shit-done/bin/lib/core.cjs) for
 * every agent. Exits 0 with a PASS line when all agents carry an assigned
 * effort value; exits 1 listing the missing agents otherwise.
 *
 * This script is the CATALOG-02 success criterion 4 audit tool. It must be run
 * AFTER the user has hand-assigned model;effort slot values (CATALOG-02). On
 * the bare catalog it correctly reports all 33 agents as missing — proving it
 * is live-wired to the resolver before CATALOG-02 lands.
 *
 * Critical detail (Pitfall 2): a temp config.json with { runtime:'claude',
 * model_profile:'balanced' } is written before calling the resolver because
 * the outermost gate in resolveReasoningEffortInternal returns null for any
 * runtime outside { claude, codex }. Without this the script would report
 * 33 false failures on any catalog, bare or fully assigned.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const projectRoot = process.cwd();
const { resolveReasoningEffortInternal } = require(
  path.join(projectRoot, 'get-shit-done/bin/lib/core.cjs')
);
const catalog = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'sdk/shared/model-catalog.json'), 'utf-8')
);

// Create a temp dir with minimal config so the allowlist gate passes.
// Pitfall 2: without runtime:'claude' the gate returns null for every agent.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-catalog-check-'));
fs.writeFileSync(
  path.join(tmpDir, 'config.json'),
  JSON.stringify({ runtime: 'claude', model_profile: 'balanced' })
);

const agents = Object.keys(catalog.agents);
const missing = agents.filter(a => resolveReasoningEffortInternal(tmpDir, a) === null);
fs.rmSync(tmpDir, { recursive: true });

if (missing.length > 0) {
  console.error(`FAIL: ${missing.length} agents missing effort assignment:`);
  missing.forEach(a => console.error(`  - ${a}`));
  process.exit(1);
}
console.log(`PASS: all ${agents.length} agents have assigned effort values.`);
