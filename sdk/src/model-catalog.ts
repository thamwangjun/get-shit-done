import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

interface RuntimeTierEntry {
  model: string;
  reasoning_effort?: string;
}

type RuntimeTierTable = Record<string, Record<string, RuntimeTierEntry | null>>;

interface AgentCatalogEntry {
  golden: 'opus' | 'sonnet' | 'haiku';
  balanced: 'opus' | 'sonnet' | 'haiku';
  budget: 'opus' | 'sonnet' | 'haiku';
  phaseType: string;
  routingTier: 'light' | 'standard' | 'heavy';
}

interface ModelCatalog {
  profiles: string[];
  phaseTypes: string[];
  adaptiveTierMap: Record<'light' | 'standard' | 'heavy', 'opus' | 'sonnet' | 'haiku'>;
  runtimeTierDefaults: RuntimeTierTable;
  agents: Record<string, AgentCatalogEntry>;
}

const CATALOG_PATH = new URL('../shared/model-catalog.json', import.meta.url);
export const catalog: ModelCatalog = JSON.parse(readFileSync(fileURLToPath(CATALOG_PATH), 'utf-8'));

export const VALID_PROFILES: string[] = [...catalog.profiles];
export const SUPPORTED_RUNTIMES = Object.keys(catalog.runtimeTierDefaults);
export type Runtime = (typeof SUPPORTED_RUNTIMES)[number];

export const MODEL_PROFILES: Record<string, Record<string, string>> = Object.fromEntries(
  Object.entries(catalog.agents).map(([agent, meta]) => [agent, {
    quality: meta.golden,
    balanced: meta.balanced,
    budget: meta.budget,
    adaptive: catalog.adaptiveTierMap[meta.routingTier],
  }])
);

export const AGENT_TO_PHASE_TYPE: Record<string, string> = Object.fromEntries(
  Object.entries(catalog.agents).map(([agent, meta]) => [agent, meta.phaseType])
);

export const AGENT_DEFAULT_TIERS: Record<string, string> = Object.fromEntries(
  Object.entries(catalog.agents).map(([agent, meta]) => [agent, meta.routingTier])
);

export function getAgentToModelMapForProfile(normalizedProfile: string): Record<string, string> {
  const profile = VALID_PROFILES.includes(normalizedProfile) ? normalizedProfile : 'balanced';
  const out: Record<string, string> = {};
  for (const [agent, profiles] of Object.entries(MODEL_PROFILES)) {
    out[agent] = profile === 'inherit' ? 'inherit' : profiles[profile] ?? profiles.balanced;
  }
  return out;
}

export function resolveRuntimeTierDefault(runtime: string, alias: 'opus' | 'sonnet' | 'haiku'): RuntimeTierEntry | null {
  return catalog.runtimeTierDefaults[runtime]?.[alias] ?? null;
}

// D-07 / Pitfall 1: use the static {claude, codex} allowlist — NOT a
// data-derived scan of runtimeTierDefaults. The data-derived approach would
// silently include any runtime that gains a reasoning_effort entry in the
// catalog, causing effort to leak to runtimes the CLI never supports. The
// static set is the parity source of truth, enforced by the golden harness.
// Mirrors RUNTIMES_WITH_REASONING_EFFORT in get-shit-done/bin/lib/core.cjs.
export function runtimesWithReasoningEffort(): Set<string> {
  return new Set(['claude', 'codex']);
}

// ─── parseModelEffort ─────────────────────────────────────────────────────────
// Mirror of the CJS implementation in get-shit-done/bin/lib/core.cjs.
// Splits a model;effort slot string on the LAST semicolon (lastIndexOf, not greedy
// split), validates the suffix against the EFFORT_TOKENS allowlist, degrades
// invalid suffixes to effort:null with a one-time per-label stderr warning, and
// never treats colons (provider IDs like openrouter:anthropic/...) as delimiters.

// IN-02: this allowlist MUST stay identical to EFFORT_TOKENS in
// get-shit-done/bin/lib/core.cjs. The parity suites assert the two sets match,
// so adding a token here without mirroring it in core.cjs fails the build.
export const EFFORT_TOKENS = new Set(['low', 'medium', 'high', 'xhigh', 'max']);
const _warnedEffortLabels = new Set<string>();

// The public type promises `model: string`, but for non-string input the
// original value passes through unchanged (mirroring the CJS contract). The
// return type widens `model` to `unknown` so callers do not rely on a false
// `string` guarantee for non-string input (IN-01).
export function parseModelEffort(label: string): { model: string | unknown; effort: string | null } {
  if (typeof label !== 'string') return { model: label, effort: null };
  const idx = label.lastIndexOf(';');
  if (idx === -1) return { model: label, effort: null };
  const base = label.slice(0, idx);
  const suffix = label.slice(idx + 1);
  // Trailing semicolon with no suffix (e.g. 'opus;') is an editing artifact,
  // not a typo'd effort token — strip it silently (WR-04).
  if (suffix === '') return { model: base, effort: null };
  if (EFFORT_TOKENS.has(suffix)) return { model: base, effort: suffix };
  if (!_warnedEffortLabels.has(label)) {
    _warnedEffortLabels.add(label);
    // WR-01: message string-identical to the CJS implementation in core.cjs.
    process.stderr.write(
      `gsd: warning — unknown effort suffix "${suffix}" in "${label}". ` +
      `Allowed efforts: ${[...EFFORT_TOKENS].join(', ')}. ` +
      `Ignoring suffix and using model "${base}".\n`
    );
  }
  return { model: base, effort: null };
}

// Internal helper exposed for tests so the module-level effort warn cache can be
// reset between cases that intentionally exercise the warning path repeatedly.
// Mirrors _resetEffortWarningCacheForTests in core.cjs (IN-03).
export function _resetEffortWarningCacheForTests(): void {
  _warnedEffortLabels.clear();
}
