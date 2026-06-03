/**
 * Intel query handlers — .planning/intel/ file management.
 *
 * Ported from get-shit-done/bin/lib/intel.cjs.
 * Provides intel status, diff, snapshot, validate, query, extract-exports,
 * and patch-meta operations for the project intelligence system.
 *
 * @example
 * ```typescript
 * import { intelStatus, intelQuery } from './intel.js';
 *
 * await intelStatus([], '/project');
 * // { data: { files: { ... }, overall_stale: false } }
 *
 * await intelQuery(['AuthService'], '/project');
 * // { data: { matches: [...], term: 'AuthService', total: 3 } }
 * ```
 */

import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

import { planningPaths, resolvePathUnderProject } from './helpers.js';
import type { QueryHandler } from './utils.js';
import { GSDError } from '../errors.js';

// ─── Constants ───────────────────────────────────────────────────────────

const INTEL_FILES: Record<string, string> = {
  files: 'file-roles.json',
  apis: 'api-map.json',
  deps: 'dependency-graph.json',
  arch: 'arch-decisions.json',
  stack: 'stack.json',
};

const STALE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Port of CJS `core.timeAgo` — converts a Date to a human-readable relative string.
 */
function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  if (months < 12) return `${months} months ago`;
  const years = Math.floor(days / 365);
  if (years === 1) return '1 year ago';
  return `${years} years ago`;
}

// ─── Internal helpers ────────────────────────────────────────────────────

function intelDir(projectDir: string): string {
  return join(projectDir, '.planning', 'intel');
}

function isIntelEnabled(projectDir: string): boolean {
  try {
    const cfg = JSON.parse(readFileSync(planningPaths(projectDir).config, 'utf-8'));
    return cfg?.intel?.enabled === true;
  } catch {
    return false;
  }
}

function intelFilePath(projectDir: string, filename: string): string {
  return join(intelDir(projectDir), filename);
}

function safeReadJson(filePath: string): unknown {
  try {
    if (!existsSync(filePath)) return null;
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function hashFile(filePath: string): string | null {
  try {
    if (!existsSync(filePath)) return null;
    const content = readFileSync(filePath);
    return createHash('sha256').update(content).digest('hex');
  } catch {
    return null;
  }
}

/** Max recursion depth when walking JSON for intel queries (avoids stack overflow). */
export const MAX_JSON_SEARCH_DEPTH = 48;

/**
 * Port of CJS `matchesInValue` — recursively checks if a term appears in any string value.
 */
function matchesInValue(value: unknown, lowerTerm: string): boolean {
  if (typeof value === 'string') return value.toLowerCase().includes(lowerTerm);
  if (Array.isArray(value)) return value.some(v => matchesInValue(v, lowerTerm));
  if (value && typeof value === 'object') return Object.values(value as object).some(v => matchesInValue(v, lowerTerm));
  return false;
}

/**
 * Port of CJS `searchJsonEntries` — searches { entries } or flat object for matching keys/values.
 * Returns `{ key, value }` pairs where key contains term or value contains term (case-insensitive).
 */
export function searchJsonEntries(data: unknown, term: string, depth = 0): { key: string; value: unknown }[] {
  if (!data || typeof data !== 'object') return [];
  if (depth > MAX_JSON_SEARCH_DEPTH) return [];

  const entries = (data as Record<string, unknown>)['entries'] ?? data;
  if (!entries || typeof entries !== 'object') return [];

  const lowerTerm = term.toLowerCase();
  const results: { key: string; value: unknown }[] = [];

  for (const [key, value] of Object.entries(entries as Record<string, unknown>)) {
    if (key === '_meta') continue;
    if (key.toLowerCase().includes(lowerTerm)) {
      results.push({ key, value });
      continue;
    }
    if (matchesInValue(value, lowerTerm)) {
      results.push({ key, value });
    }
  }
  return results;
}

function searchArchMd(filePath: string, term: string): string[] {
  if (!existsSync(filePath)) return [];
  const lowerTerm = term.toLowerCase();
  const content = readFileSync(filePath, 'utf-8');
  return content.split('\n').filter(line => line.toLowerCase().includes(lowerTerm));
}

// ─── Handlers ────────────────────────────────────────────────────────────

const INTEL_DISABLED_MSG = 'Intel system disabled. Set intel.enabled=true in config.json to activate.';

export const intelStatus: QueryHandler = async (_args, projectDir, _workstream) => {
  if (!isIntelEnabled(projectDir)) {
    return { data: { disabled: true, message: INTEL_DISABLED_MSG } };
  }
  const now = Date.now();
  const files: Record<string, unknown> = {};
  let overallStale = false;

  for (const [, filename] of Object.entries(INTEL_FILES)) {
    const filePath = intelFilePath(projectDir, filename);
    if (!existsSync(filePath)) {
      files[filename] = { exists: false, updated_at: null, stale: true };
      overallStale = true;
      continue;
    }
    let updatedAt: string | null = null;
    // All intel files are JSON — read _meta.updated_at (matches CJS oracle)
    const data = safeReadJson(filePath) as Record<string, unknown> | null;
    if (data?._meta) {
      updatedAt = (data._meta as Record<string, unknown>).updated_at as string | null;
    }
    const stale = !updatedAt || (now - new Date(updatedAt).getTime()) > STALE_MS;
    if (stale) overallStale = true;
    // Apply timeAgo formatting to updated_at (matches CJS gsd-tools.cjs intel status output)
    const updatedAtDisplay = updatedAt ? timeAgo(new Date(updatedAt)) : null;
    files[filename] = { exists: true, updated_at: updatedAtDisplay, stale };
  }
  return { data: { files, overall_stale: overallStale } };
};

export const intelDiff: QueryHandler = async (_args, projectDir, _workstream) => {
  if (!isIntelEnabled(projectDir)) {
    return { data: { disabled: true, message: INTEL_DISABLED_MSG } };
  }
  const snapshotPath = intelFilePath(projectDir, '.last-refresh.json');
  const snapshot = safeReadJson(snapshotPath) as Record<string, unknown> | null;
  if (!snapshot) return { data: { no_baseline: true } };

  const prevHashes = (snapshot.hashes as Record<string, string>) || {};
  const changed: string[] = [];
  const added: string[] = [];
  const removed: string[] = [];

  for (const [, filename] of Object.entries(INTEL_FILES)) {
    const filePath = intelFilePath(projectDir, filename);
    const currentHash = hashFile(filePath);
    if (currentHash && !prevHashes[filename]) added.push(filename);
    else if (currentHash && prevHashes[filename] && currentHash !== prevHashes[filename]) changed.push(filename);
    else if (!currentHash && prevHashes[filename]) removed.push(filename);
  }
  return { data: { changed, added, removed } };
};

export const intelSnapshot: QueryHandler = async (_args, projectDir, _workstream) => {
  if (!isIntelEnabled(projectDir)) {
    return { data: { disabled: true, message: INTEL_DISABLED_MSG } };
  }
  const dir = intelDir(projectDir);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const hashes: Record<string, string> = {};
  let fileCount = 0;
  for (const [, filename] of Object.entries(INTEL_FILES)) {
    const filePath = join(dir, filename);
    const hash = hashFile(filePath);
    if (hash) { hashes[filename] = hash; fileCount++; }
  }

  const timestamp = new Date().toISOString();
  writeFileSync(join(dir, '.last-refresh.json'), JSON.stringify({ hashes, timestamp, version: 1 }, null, 2), 'utf-8');
  return { data: { saved: true, timestamp, files: fileCount } };
};

export const intelValidate: QueryHandler = async (_args, projectDir, _workstream) => {
  if (!isIntelEnabled(projectDir)) {
    return { data: { disabled: true, message: INTEL_DISABLED_MSG } };
  }
  const errors: string[] = [];
  const warnings: string[] = [];

  const now = Date.now();

  for (const [key, filename] of Object.entries(INTEL_FILES)) {
    const filePath = intelFilePath(projectDir, filename);

    // Check existence (error message matches CJS oracle)
    if (!existsSync(filePath)) {
      errors.push(`${filename}: file does not exist`);
      continue;
    }

    // All intel files are JSON — validate _meta and entries structure
    let raw: string;
    try { raw = readFileSync(filePath, 'utf-8'); } catch { errors.push(`${filename}: file missing`); continue; }
    let data: Record<string, unknown>;
    try { data = JSON.parse(raw) as Record<string, unknown>; } catch (e) {
      errors.push(`${filename}: invalid JSON — ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }

    // Check _meta.updated_at recency (warning format matches CJS oracle)
    if (data._meta && (data._meta as Record<string, unknown>).updated_at) {
      const age = now - new Date((data._meta as Record<string, unknown>).updated_at as string).getTime();
      if (age > STALE_MS) {
        warnings.push(`${filename}: _meta.updated_at is ${Math.round(age / 3600000)} hours old (>24 hr)`);
      }
    } else {
      warnings.push(`${filename}: missing _meta.updated_at`);
    }

    // Validate entries structure (matches CJS oracle spot-check logic)
    if (data.entries && typeof data.entries === 'object') {
      if (key === 'files') {
        for (const [entryPath, entry] of Object.entries(data.entries as Record<string, unknown>)) {
          const e = entry as Record<string, unknown> | null;
          if (e?.exports && Array.isArray(e.exports)) {
            for (const exp of e.exports as unknown[]) {
              if (typeof exp === 'string' && exp.includes(' ')) {
                warnings.push(`${filename}: "${entryPath}" export "${exp}" looks like a description (contains space)`);
              }
            }
          }
        }
        const entryPaths = Object.keys(data.entries as Record<string, unknown>).slice(0, 5);
        for (const ep of entryPaths) {
          if (!existsSync(ep)) {
            warnings.push(`${filename}: entry path "${ep}" does not exist on disk`);
          }
        }
      }
    }
  }
  return { data: { valid: errors.length === 0, errors, warnings } };
};

export const intelQuery: QueryHandler = async (args, projectDir, _workstream) => {
  const term = args[0] || '';
  if (!isIntelEnabled(projectDir)) {
    return { data: { disabled: true, message: INTEL_DISABLED_MSG } };
  }
  const matches: unknown[] = [];
  let total = 0;

  // Search all JSON intel files (matches CJS oracle: JSON only, not .md)
  for (const [, filename] of Object.entries(INTEL_FILES)) {
    const filePath = intelFilePath(projectDir, filename);
    const data = safeReadJson(filePath);
    if (!data) continue;
    const found = searchJsonEntries(data, term);
    if (found.length > 0) { matches.push({ source: filename, entries: found }); total += found.length; }
  }
  return { data: { matches, term, total } };
};

/**
 * Extract exports from a JS/CJS/ESM file — port of `intelExtractExports` in `intel.cjs` (lines 502–614).
 * Returns `{ file, exports, method }` with `file` as a resolved absolute path (matches `gsd-tools.cjs`).
 */
export const intelExtractExports: QueryHandler = async (args, projectDir, _workstream) => {
  const raw = args[0];
  if (!raw) {
    return { data: { file: '', exports: [], method: 'none' } };
  }
  let filePath: string;
  try {
    filePath = await resolvePathUnderProject(projectDir, raw);
  } catch (err) {
    // Only soft-catch GSDError (path traversal). Native errors (ENOENT on projectDir) propagate.
    if (err instanceof GSDError) {
      return { data: { file: raw, exports: [], method: 'none' } };
    }
    throw err;
  }
  if (!existsSync(filePath)) {
    return { data: { file: filePath, exports: [], method: 'none' } };
  }

  const content = readFileSync(filePath, 'utf-8');
  const exports: string[] = [];
  let method = 'none';

  const allMatches = [...content.matchAll(/module\.exports\s*=\s*\{/g)];
  if (allMatches.length > 0) {
    const lastMatch = allMatches[allMatches.length - 1]!;
    const startIdx = lastMatch.index! + lastMatch[0].length;
    let depth = 1;
    let endIdx = startIdx;
    while (endIdx < content.length && depth > 0) {
      if (content[endIdx] === '{') depth++;
      else if (content[endIdx] === '}') depth--;
      if (depth > 0) endIdx++;
    }
    const block = content.substring(startIdx, endIdx);
    method = 'module.exports';
    for (const line of block.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
      const keyMatch = trimmed.match(/^(\w+)\s*[,}:]/) || trimmed.match(/^(\w+)$/);
      if (keyMatch) exports.push(keyMatch[1]!);
    }
  }

  const individualPattern = /^exports\.(\w+)\s*=/gm;
  let im: RegExpExecArray | null;
  while ((im = individualPattern.exec(content)) !== null) {
    if (!exports.includes(im[1]!)) {
      exports.push(im[1]!);
      if (method === 'none') method = 'exports.X';
    }
  }

  const hadCjs = exports.length > 0;

  const esmExports: string[] = [];

  const defaultNamedPattern = /^export\s+default\s+(?:function|class)\s+(\w+)/gm;
  let em: RegExpExecArray | null;
  while ((em = defaultNamedPattern.exec(content)) !== null) {
    if (!esmExports.includes(em[1]!)) esmExports.push(em[1]!);
  }

  const defaultAnonPattern = /^export\s+default\s+(?!function\s|class\s)/gm;
  if (defaultAnonPattern.test(content) && esmExports.length === 0) {
    if (!esmExports.includes('default')) esmExports.push('default');
  }

  const exportFnPattern = /^export\s+(?:async\s+)?function\s+(\w+)\s*\(/gm;
  while ((em = exportFnPattern.exec(content)) !== null) {
    if (!esmExports.includes(em[1]!)) esmExports.push(em[1]!);
  }

  const exportVarPattern = /^export\s+(?:const|let|var)\s+(\w+)\s*=/gm;
  while ((em = exportVarPattern.exec(content)) !== null) {
    if (!esmExports.includes(em[1]!)) esmExports.push(em[1]!);
  }

  const exportClassPattern = /^export\s+class\s+(\w+)/gm;
  while ((em = exportClassPattern.exec(content)) !== null) {
    if (!esmExports.includes(em[1]!)) esmExports.push(em[1]!);
  }

  const exportBlockPattern = /^export\s*\{([^}]+)\}/gm;
  while ((em = exportBlockPattern.exec(content)) !== null) {
    const items = em[1]!.split(',');
    for (const item of items) {
      const trimmed = item.trim();
      if (!trimmed) continue;
      const name = trimmed.split(/\s+as\s+/)[0]!.trim();
      if (name && !esmExports.includes(name)) esmExports.push(name);
    }
  }

  for (const e of esmExports) {
    if (!exports.includes(e)) exports.push(e);
  }

  const hadEsm = esmExports.length > 0;
  if (hadCjs && hadEsm) {
    method = 'mixed';
  } else if (hadEsm && !hadCjs) {
    method = 'esm';
  }

  return { data: { file: filePath, exports, method } };
};

export const intelPatchMeta: QueryHandler = async (args, projectDir, _workstream) => {
  const raw = args[0];
  if (!raw) {
    return { data: { patched: false, error: 'File not found' } };
  }
  let filePath: string;
  try {
    filePath = await resolvePathUnderProject(projectDir, raw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { data: { patched: false, error: msg } };
  }
  if (!existsSync(filePath)) {
    return { data: { patched: false, error: `File not found: ${filePath}` } };
  }
  try {
    const raw = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (!data._meta) data._meta = {};
    const meta = data._meta as Record<string, unknown>;
    const timestamp = new Date().toISOString();
    meta.updated_at = timestamp;
    meta.version = ((meta.version as number) || 0) + 1;
    writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    return { data: { patched: true, file: filePath, timestamp } };
  } catch (err) {
    return { data: { patched: false, error: String(err) } };
  }
};

// ─── intelUpdate ───────────────────────────────────────────────────────────

/**
 * `gsd-tools intel update` entry point: returns the same JSON as `intel.cjs` `intelUpdate`.
 * Does not run the full graph refresh in-process — that work is done by the
 * **gsd-intel-updater** agent after spawn. When `.planning/intel/` is disabled in config,
 * returns `{ disabled: true, message }` so SDK output matches the CJS CLI.
 *
 * Port of `intelUpdate` from `intel.cjs` lines 314–321.
 */
export const intelUpdate: QueryHandler = async (_args, projectDir, _workstream) => {
  if (!isIntelEnabled(projectDir)) {
    return { data: { disabled: true, message: INTEL_DISABLED_MSG } };
  }
  return {
    data: {
      action: 'spawn_agent',
      message: 'Run gsd-tools intel update or spawn gsd-intel-updater agent for full refresh',
    },
  };
};
