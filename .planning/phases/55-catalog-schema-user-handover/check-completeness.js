/**
 * check-completeness.js — Post-handover completeness check for CATALOG-02
 *
 * Run from the project root:
 *   node .planning/phases/55-catalog-schema-user-handover/check-completeness.js
 *
 * Reads sdk/shared/model-catalog.json and calls the Phase 53 resolver
 * (resolveReasoningEffortInternal from get-shit-done/bin/lib/core.cjs) for
 * every agent that is capable of extended thinking. Haiku agents are exempt:
 * haiku does not support extended thinking, so null effort is correct for them.
 * Exits 0 with a PASS line when all capable agents carry an assigned effort
 * value; exits 1 listing the missing agents otherwise.
 *
 * This script is the CATALOG-02 success criterion 4 audit tool. It must be run
 * AFTER the user has hand-assigned model;effort slot values (CATALOG-02). On
 * the bare catalog it correctly reports capable agents as missing — proving it
 * is live-wired to the resolver before CATALOG-02 lands.
 *
 * Critical detail (Pitfall 2): a temp config.json with { runtime:'claude',
 * model_profile:'balanced' } is written before calling the resolver because
 * the outermost gate in resolveReasoningEffortInternal returns null for any
 * runtime outside { claude, codex }. Without this the script would report
 * false failures on any catalog, bare or fully assigned.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const projectRoot = process.cwd();
const { resolveReasoningEffortInternal, parseModelEffort } = require(
  path.join(projectRoot, 'get-shit-done/bin/lib/core.cjs')
);
const catalog = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'sdk/shared/model-catalog.json'), 'utf-8')
);

// Haiku does not support extended thinking — null effort is correct for these agents.
// Derive the exempt set from the catalog itself so it stays in sync if slots change.
const haikuExempt = new Set(
  Object.entries(catalog.agents)
    .filter(([, entry]) => parseModelEffort(entry.balanced || '').model === 'haiku')
    .map(([name]) => name)
);

if (haikuExempt.size > 0) {
  console.log(`Note: ${haikuExempt.size} agent(s) use haiku (no extended thinking) — exempt from effort requirement:`);
  for (const a of haikuExempt) console.log(`  - ${a}`);
}

// Create a temp dir with minimal config so the allowlist gate passes.
// Pitfall 2: without runtime:'claude' the gate returns null for every agent.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-catalog-check-'));
fs.writeFileSync(
  path.join(tmpDir, 'config.json'),
  JSON.stringify({ runtime: 'claude', model_profile: 'balanced' })
);

// Opus supports max, xhigh, high, medium, low.
// Sonnet supports high, medium, low only — xhigh and max are opus-only.
const SONNET_MAX_EFFORTS = new Set(['low', 'medium', 'high']);
const OPUS_EFFORTS = new Set(['low', 'medium', 'high', 'xhigh', 'max']);

const agents = Object.keys(catalog.agents).filter(a => !haikuExempt.has(a));
const missing = agents.filter(a => resolveReasoningEffortInternal(tmpDir, a) === null);

// Warn on out-of-range effort assignments (non-blocking — advisory only).
const warnings = [];
for (const [agentName, entry] of Object.entries(catalog.agents)) {
  if (haikuExempt.has(agentName)) continue;
  for (const [profile, slotValue] of Object.entries(entry)) {
    if (!slotValue || typeof slotValue !== 'string') continue;
    const { model, effort } = parseModelEffort(slotValue);
    if (!effort) continue;
    if (model === 'sonnet' && !SONNET_MAX_EFFORTS.has(effort)) {
      warnings.push(`  ${agentName}.${profile}: "${slotValue}" — sonnet only supports low/medium/high, not "${effort}"`);
    } else if (model === 'opus' && !OPUS_EFFORTS.has(effort)) {
      warnings.push(`  ${agentName}.${profile}: "${slotValue}" — unrecognized effort "${effort}" for opus`);
    }
  }
}

fs.rmSync(tmpDir, { recursive: true });

if (warnings.length > 0) {
  console.warn(`Warning: ${warnings.length} out-of-range effort assignment(s):`);
  warnings.forEach(w => console.warn(w));
}

if (missing.length > 0) {
  console.error(`FAIL: ${missing.length} agents missing effort assignment:`);
  missing.forEach(a => console.error(`  - ${a}`));
  process.exit(1);
}
console.log(`PASS: all ${agents.length} capable agents have assigned effort values.`);
