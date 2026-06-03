/**
 * Verification query handlers — plan structure, phase completeness, artifact checks.
 *
 * Ported from get-shit-done/bin/lib/verify.cjs.
 * Provides plan validation, phase completeness checking, and artifact verification
 * as native TypeScript query handlers registered in the SDK query registry.
 *
 * @example
 * ```typescript
 * import { verifyPlanStructure, verifyPhaseCompleteness, verifyArtifacts } from './verify.js';
 *
 * const result = await verifyPlanStructure(['path/to/plan.md'], '/project');
 * // { data: { valid: true, errors: [], warnings: [], task_count: 2, ... } }
 * ```
 */

import { readFile, readdir } from 'node:fs/promises';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { GSDError, ErrorClassification } from '../errors.js';
import { extractFrontmatter, parseMustHavesBlock } from './frontmatter.js';
import {
  comparePhaseNum,
  normalizePhaseName,
  phaseTokenMatches,
  planningPaths,
} from './helpers.js';
import type { QueryHandler } from './utils.js';

// ─── verifyPlanStructure ───────────────────────────────────────────────────

/**
 * Validate plan structure against required schema.
 *
 * Port of `cmdVerifyPlanStructure` from `verify.cjs` lines 108-167.
 * Checks required frontmatter fields, task XML elements, wave/depends_on
 * consistency, and autonomous/checkpoint consistency.
 *
 * @param args - args[0]: file path (required)
 * @param projectDir - Project root directory
 * @returns QueryResult with { valid, errors, warnings, task_count, tasks, frontmatter_fields }
 * @throws GSDError with Validation classification if file path missing
 */
export const verifyPlanStructure: QueryHandler = async (args, projectDir) => {
  const filePath = args[0];
  if (!filePath) {
    throw new GSDError('file path required', ErrorClassification.Validation);
  }

  // T-12-01: Null byte rejection on file paths
  if (filePath.includes('\0')) {
    throw new GSDError('file path contains null bytes', ErrorClassification.Validation);
  }

  const fullPath = isAbsolute(filePath) ? filePath : join(projectDir, filePath);

  let content: string;
  try {
    content = await readFile(fullPath, 'utf-8');
  } catch {
    return { data: { error: 'File not found', path: filePath } };
  }

  const fm = extractFrontmatter(content);
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required frontmatter fields
  const required = ['phase', 'plan', 'type', 'wave', 'depends_on', 'files_modified', 'autonomous', 'must_haves'];
  for (const field of required) {
    if (fm[field] === undefined) errors.push(`Missing required frontmatter field: ${field}`);
  }

  // Parse and check task elements
  // T-12-03: Use non-greedy [\s\S]*? to avoid catastrophic backtracking
  const taskPattern = /<task[^>]*>([\s\S]*?)<\/task>/g;
  const tasks: Array<{ name: string; hasFiles: boolean; hasAction: boolean; hasVerify: boolean; hasDone: boolean }> = [];
  let taskMatch: RegExpExecArray | null;
  while ((taskMatch = taskPattern.exec(content)) !== null) {
    const taskContent = taskMatch[1];
    const nameMatch = taskContent.match(/<name>([\s\S]*?)<\/name>/);
    const taskName = nameMatch ? nameMatch[1].trim() : 'unnamed';
    const hasFiles = /<files>/.test(taskContent);
    const hasAction = /<action>/.test(taskContent);
    const hasVerify = /<verify>/.test(taskContent);
    const hasDone = /<done>/.test(taskContent);

    if (!nameMatch) errors.push('Task missing <name> element');
    if (!hasAction) errors.push(`Task '${taskName}' missing <action>`);
    if (!hasVerify) warnings.push(`Task '${taskName}' missing <verify>`);
    if (!hasDone) warnings.push(`Task '${taskName}' missing <done>`);
    if (!hasFiles) warnings.push(`Task '${taskName}' missing <files>`);

    tasks.push({ name: taskName, hasFiles, hasAction, hasVerify, hasDone });
  }

  if (tasks.length === 0) warnings.push('No <task> elements found');

  // Wave/depends_on consistency
  if (fm.wave && parseInt(String(fm.wave), 10) > 1 && (!fm.depends_on || (Array.isArray(fm.depends_on) && fm.depends_on.length === 0))) {
    warnings.push('Wave > 1 but depends_on is empty');
  }

  // Autonomous/checkpoint consistency
  const hasCheckpoints = /<task\s+type=["']?checkpoint/.test(content);
  if (hasCheckpoints && fm.autonomous !== 'false' && fm.autonomous !== false) {
    errors.push('Has checkpoint tasks but autonomous is not false');
  }

  return {
    data: {
      valid: errors.length === 0,
      errors,
      warnings,
      task_count: tasks.length,
      tasks,
      frontmatter_fields: Object.keys(fm),
    },
  };
};

// ─── verifyPhaseCompleteness ───────────────────────────────────────────────

/**
 * Check phase completeness by matching PLAN files to SUMMARY files.
 *
 * Port of `cmdVerifyPhaseCompleteness` from `verify.cjs` lines 169-213.
 * Scans a phase directory for PLAN and SUMMARY files, identifies incomplete
 * plans (no summary) and orphan summaries (no plan).
 *
 * @param args - args[0]: phase number (required)
 * @param projectDir - Project root directory
 * @returns QueryResult with { complete, phase, plan_count, summary_count, incomplete_plans, orphan_summaries, errors, warnings }
 * @throws GSDError with Validation classification if phase number missing
 */
export const verifyPhaseCompleteness: QueryHandler = async (args, projectDir, workstream) => {
  const phase = args[0];
  if (!phase) {
    throw new GSDError('phase required', ErrorClassification.Validation);
  }

  const phasesDir = planningPaths(projectDir, workstream).phases;
  const normalized = normalizePhaseName(phase);

  // Find phase directory (mirror findPhase pattern from phase.ts)
  let phaseDir: string | null = null;
  let phaseNumber: string = normalized;
  try {
    const entries = await readdir(phasesDir, { withFileTypes: true });
    const dirs = entries
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort();
    const match = dirs.find(d => phaseTokenMatches(d, normalized));
    if (match) {
      phaseDir = join(phasesDir, match);
      // Extract phase number from directory name
      const numMatch = match.match(/^(\d+[A-Z]?(?:\.\d+)*)/i);
      if (numMatch) phaseNumber = numMatch[1];
    }
  } catch { /* phases dir doesn't exist */ }

  if (!phaseDir) {
    return { data: { error: 'Phase not found', phase } };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // List plans and summaries
  let files: string[];
  try {
    files = await readdir(phaseDir);
  } catch {
    return { data: { error: 'Cannot read phase directory' } };
  }

  const plans = files.filter(f => /-PLAN\.md$/i.test(f));
  const summaries = files.filter(f => /-SUMMARY\.md$/i.test(f));

  // Extract plan IDs (everything before -PLAN.md / -SUMMARY.md)
  const planIds = new Set(plans.map(p => p.replace(/-PLAN\.md$/i, '')));
  const summaryIds = new Set(summaries.map(s => s.replace(/-SUMMARY\.md$/i, '')));

  // Plans without summaries
  const incompletePlans = [...planIds].filter(id => !summaryIds.has(id));
  if (incompletePlans.length > 0) {
    errors.push(`Plans without summaries: ${incompletePlans.join(', ')}`);
  }

  // Summaries without plans (orphans)
  const orphanSummaries = [...summaryIds].filter(id => !planIds.has(id));
  if (orphanSummaries.length > 0) {
    warnings.push(`Summaries without plans: ${orphanSummaries.join(', ')}`);
  }

  return {
    data: {
      complete: errors.length === 0,
      phase: phaseNumber,
      plan_count: plans.length,
      summary_count: summaries.length,
      incomplete_plans: incompletePlans,
      orphan_summaries: orphanSummaries,
      errors,
      warnings,
    },
  };
};

// ─── verifyArtifacts ───────────────────────────────────────────────────────

/**
 * Verify artifact file existence and content from must_haves.artifacts.
 *
 * Port of `cmdVerifyArtifacts` from `verify.cjs` lines 283-336.
 * Reads must_haves.artifacts from plan frontmatter and checks each artifact
 * for file existence, min_lines, contains, and exports.
 *
 * @param args - args[0]: plan file path (required)
 * @param projectDir - Project root directory
 * @returns QueryResult with { all_passed, passed, total, artifacts }
 * @throws GSDError with Validation classification if file path missing
 */
export const verifyArtifacts: QueryHandler = async (args, projectDir) => {
  const planFilePath = args[0];
  if (!planFilePath) {
    throw new GSDError('plan file path required', ErrorClassification.Validation);
  }

  // T-12-01: Null byte rejection on file paths
  if (planFilePath.includes('\0')) {
    throw new GSDError('file path contains null bytes', ErrorClassification.Validation);
  }

  const fullPath = isAbsolute(planFilePath) ? planFilePath : join(projectDir, planFilePath);

  let content: string;
  try {
    content = await readFile(fullPath, 'utf-8');
  } catch {
    return { data: { error: 'File not found', path: planFilePath } };
  }

  const { items: artifacts } = parseMustHavesBlock(content, 'artifacts');
  if (artifacts.length === 0) {
    return { data: { error: 'No must_haves.artifacts found in frontmatter', path: planFilePath } };
  }

  const results: Array<{ path: string; exists: boolean; issues: string[]; passed: boolean }> = [];

  for (const artifact of artifacts) {
    if (typeof artifact === 'string') continue; // skip simple string items
    const artObj = artifact as Record<string, unknown>;
    const artPath = artObj.path as string | undefined;
    if (!artPath) continue;

    const artFullPath = join(projectDir, artPath);
    let exists = false;
    let fileContent = '';

    try {
      fileContent = await readFile(artFullPath, 'utf-8');
      exists = true;
    } catch {
      // File doesn't exist
    }

    const check: { path: string; exists: boolean; issues: string[]; passed: boolean } = {
      path: artPath,
      exists,
      issues: [],
      passed: false,
    };

    if (exists) {
      const lineCount = fileContent.split('\n').length;

      if (artObj.min_lines && lineCount < (artObj.min_lines as number)) {
        check.issues.push(`Only ${lineCount} lines, need ${artObj.min_lines}`);
      }
      if (artObj.contains && !fileContent.includes(artObj.contains as string)) {
        check.issues.push(`Missing pattern: ${artObj.contains}`);
      }
      if (artObj.exports) {
        const exports = Array.isArray(artObj.exports) ? artObj.exports : [artObj.exports];
        for (const exp of exports) {
          if (!fileContent.includes(String(exp))) {
            check.issues.push(`Missing export: ${exp}`);
          }
        }
      }
      check.passed = check.issues.length === 0;
    } else {
      check.issues.push('File not found');
    }

    results.push(check);
  }

  const passed = results.filter(r => r.passed).length;
  return {
    data: {
      all_passed: results.length > 0 && passed === results.length,
      passed,
      total: results.length,
      artifacts: results,
    },
  };
};

// ─── verifyCommits ────────────────────────────────────────────────────────

/**
 * Verify that commit hashes referenced in SUMMARY.md files actually exist.
 *
 * Port of `cmdVerifyCommits` from `verify.cjs` lines 262-282.
 * Used by gsd-verifier agent to confirm commits mentioned in summaries
 * are real commits in the git history.
 *
 * @param args - One or more commit hashes
 * @param projectDir - Project root directory
 * @returns QueryResult with { all_valid, valid, invalid, total }
 */
export const verifyCommits: QueryHandler = async (args, projectDir) => {
  if (args.length === 0) {
    throw new GSDError('At least one commit hash required', ErrorClassification.Validation);
  }

  const { execGit } = await import('./commit.js');
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const hash of args) {
    const result = execGit(projectDir, ['cat-file', '-t', hash]);
    if (result.exitCode === 0 && result.stdout.trim() === 'commit') {
      valid.push(hash);
    } else {
      invalid.push(hash);
    }
  }

  return {
    data: {
      all_valid: invalid.length === 0,
      valid,
      invalid,
      total: args.length,
    },
  };
};

// ─── verifyReferences ─────────────────────────────────────────────────────

/**
 * Verify that @-references and backtick file paths in a document resolve.
 *
 * Port of `cmdVerifyReferences` from `verify.cjs` lines 217-260.
 *
 * @param args - args[0]: file path (required)
 * @param projectDir - Project root directory
 * @returns QueryResult with { valid, found, missing }
 */
export const verifyReferences: QueryHandler = async (args, projectDir) => {
  const filePath = args[0];
  if (!filePath) {
    throw new GSDError('file path required', ErrorClassification.Validation);
  }

  const fullPath = isAbsolute(filePath) ? filePath : join(projectDir, filePath);

  let content: string;
  try {
    content = await readFile(fullPath, 'utf-8');
  } catch {
    return { data: { error: 'File not found', path: filePath } };
  }

  const found: string[] = [];
  const missing: string[] = [];

  const atRefs = content.match(/@([^\s\n,)]+\/[^\s\n,)]+)/g) || [];
  for (const ref of atRefs) {
    const cleanRef = ref.slice(1);
    const resolved = cleanRef.startsWith('~/')
      ? join(process.env.HOME || '', cleanRef.slice(2))
      : join(projectDir, cleanRef);
    if (existsSync(resolved)) {
      found.push(cleanRef);
    } else {
      missing.push(cleanRef);
    }
  }

  const backtickRefs = content.match(/`([^`]+\/[^`]+\.[a-zA-Z]{1,10})`/g) || [];
  for (const ref of backtickRefs) {
    const cleanRef = ref.slice(1, -1);
    if (cleanRef.startsWith('http') || cleanRef.includes('${') || cleanRef.includes('{{')) continue;
    if (found.includes(cleanRef) || missing.includes(cleanRef)) continue;
    const resolved = join(projectDir, cleanRef);
    if (existsSync(resolved)) {
      found.push(cleanRef);
    } else {
      missing.push(cleanRef);
    }
  }

  return {
    data: {
      valid: missing.length === 0,
      found: found.length,
      missing,
      total: found.length + missing.length,
    },
  };
};

// ─── verifySummary ────────────────────────────────────────────────────────

/**
 * Verify a SUMMARY.md file: existence, file spot-checks, commit refs, self-check section.
 *
 * Port of `cmdVerifySummary` from verify.cjs lines 13-107.
 *
 * @param args - args[0]: summary path (required), args[1]: optional --check-count N
 */
export const verifySummary: QueryHandler = async (args, projectDir) => {
  const summaryPath = args[0];
  if (!summaryPath) {
    throw new GSDError('summary-path required', ErrorClassification.Validation);
  }

  const checkCountIdx = args.indexOf('--check-count');
  const checkCount = checkCountIdx !== -1 ? parseInt(args[checkCountIdx + 1], 10) || 2 : 2;

  const fullPath = join(projectDir, summaryPath);

  if (!existsSync(fullPath)) {
    return {
      data: {
        passed: false,
        checks: {
          summary_exists: false,
          files_created: { checked: 0, found: 0, missing: [] },
          commits_exist: false,
          self_check: 'not_found',
        },
        errors: ['SUMMARY.md not found'],
      },
    };
  }

  const content = readFileSync(fullPath, 'utf-8');
  const errors: string[] = [];

  const mentionedFiles = new Set<string>();
  const patterns = [
    /`([^`]+\.[a-zA-Z]+)`/g,
    /(?:Created|Modified|Added|Updated|Edited):\s*`?([^\s`]+\.[a-zA-Z]+)`?/gi,
  ];
  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(content)) !== null) {
      const filePath = m[1];
      if (filePath && !filePath.startsWith('http') && filePath.includes('/')) {
        mentionedFiles.add(filePath);
      }
    }
  }

  const filesToCheck = Array.from(mentionedFiles).slice(0, checkCount);
  const missing: string[] = [];
  for (const file of filesToCheck) {
    if (!existsSync(join(projectDir, file))) {
      missing.push(file);
    }
  }

  const { execGit } = await import('./commit.js');
  // HEURISTIC LIMITATION (WR-04): this pattern matches any 7–40 char lowercase-hex
  // run, including non-commit tokens (SHA-256 fragments, long hex color codes, IDs).
  // Only the first 3 matches are `cat-file -t`-checked; if none are commits, line 505
  // still pushes a "Referenced commit hashes not found" error — a possible false
  // positive. This mirrors the CJS oracle (verify.cjs line 75) and is kept for
  // byte-parity rather than tightened here.
  const commitHashPattern = /\b[0-9a-f]{7,40}\b/g;
  const hashes = content.match(commitHashPattern) || [];
  let commitsExist = false;
  for (const hash of hashes.slice(0, 3)) {
    const result = execGit(projectDir, ['cat-file', '-t', hash]);
    if (result.exitCode === 0 && result.stdout.trim() === 'commit') {
      commitsExist = true;
      break;
    }
  }

  let selfCheck = 'not_found';
  const selfCheckPattern = /##\s*(?:Self[- ]?Check|Verification|Quality Check)/i;
  if (selfCheckPattern.test(content)) {
    const passPattern = /(?:all\s+)?(?:pass|✓|✅|complete|succeeded)/i;
    const failPattern = /(?:fail|✗|❌|incomplete|blocked)/i;
    const checkSection = content.slice(content.search(selfCheckPattern));
    if (failPattern.test(checkSection)) {
      selfCheck = 'failed';
    } else if (passPattern.test(checkSection)) {
      selfCheck = 'passed';
    }
  }

  if (missing.length > 0) errors.push('Missing files: ' + missing.join(', '));
  if (!commitsExist && hashes.length > 0) errors.push('Referenced commit hashes not found in git history');
  if (selfCheck === 'failed') errors.push('Self-check section indicates failure');

  const passed = missing.length === 0 && selfCheck !== 'failed';
  return {
    data: {
      passed,
      checks: {
        summary_exists: true,
        files_created: { checked: filesToCheck.length, found: filesToCheck.length - missing.length, missing },
        commits_exist: commitsExist,
        self_check: selfCheck,
      },
      errors,
    },
  };
};

// ─── verifyPathExists ─────────────────────────────────────────────────────

/**
 * Check file/directory existence and return type.
 *
 * Port of `cmdVerifyPathExists` from commands.cjs lines 111-132.
 *
 * @param args - args[0]: path to check (required)
 */
export const verifyPathExists: QueryHandler = async (args, projectDir) => {
  const targetPath = args[0];
  if (!targetPath) {
    throw new GSDError('path required for verification', ErrorClassification.Validation);
  }
  if (targetPath.includes('\0')) {
    throw new GSDError('path contains null bytes', ErrorClassification.Validation);
  }

  const fullPath = isAbsolute(targetPath) ? targetPath : join(projectDir, targetPath);

  try {
    const stats = statSync(fullPath);
    const type = stats.isDirectory() ? 'directory' : stats.isFile() ? 'file' : 'other';
    return { data: { exists: true, type } };
  } catch {
    return { data: { exists: false, type: null } };
  }
};

// ─── verifySchemaDrift ────────────────────────────────────────────────────

/**
 * Detect schema drift for a phase — port of `cmdVerifySchemaDrift` from verify.cjs lines 1013–1086.
 */
export const verifySchemaDrift: QueryHandler = async (args, projectDir, workstream) => {
  const phaseArg = args[0];
  const skipFlag = args.includes('--skip');

  if (!phaseArg) {
    throw new GSDError('Usage: verify schema-drift <phase> [--skip]', ErrorClassification.Validation);
  }

  const { checkSchemaDrift } = await import('./schema-detect.js');
  const { execGit } = await import('./commit.js');

  const phasesDir = planningPaths(projectDir, workstream).phases;
  if (!existsSync(phasesDir)) {
    return {
      data: {
        drift_detected: false,
        blocking: false,
        message: 'No phases directory',
      },
    };
  }

  const normalized = normalizePhaseName(phaseArg);
  const dirNames = readdirSync(phasesDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort((a, b) => comparePhaseNum(a, b));

  let phaseDirName = dirNames.find(d => phaseTokenMatches(d, normalized)) ?? null;
  if (!phaseDirName && /^[\d.]+/.test(phaseArg)) {
    const exact = join(phasesDir, phaseArg);
    if (existsSync(exact)) phaseDirName = phaseArg;
  }

  if (!phaseDirName) {
    return {
      data: {
        drift_detected: false,
        blocking: false,
        message: `Phase directory not found: ${phaseArg}`,
      },
    };
  }

  const phaseDir = join(phasesDir, phaseDirName);

  function filesModifiedFromFrontmatter(fm: Record<string, unknown>): string[] {
    const v = fm.files_modified;
    if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean);
    if (typeof v === 'string') {
      const t = v.trim();
      return t ? [t] : [];
    }
    return [];
  }

  const allFiles: string[] = [];
  const planFiles = readdirSync(phaseDir).filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md');
  for (const pf of planFiles) {
    const content = readFileSync(join(phaseDir, pf), 'utf-8');
    const fm = extractFrontmatter(content) as Record<string, unknown>;
    allFiles.push(...filesModifiedFromFrontmatter(fm));
  }

  let executionLog = '';
  const summaryFiles = readdirSync(phaseDir).filter(f => f.endsWith('-SUMMARY.md'));
  for (const sf of summaryFiles) {
    executionLog += readFileSync(join(phaseDir, sf), 'utf-8') + '\n';
  }

  const gitLog = execGit(projectDir, ['log', '--oneline', '--all', '-50']);
  if (gitLog.exitCode === 0) {
    executionLog += '\n' + gitLog.stdout;
  }

  const result = checkSchemaDrift(allFiles, executionLog, { skipCheck: !!skipFlag });

  return {
    data: {
      drift_detected: result.driftDetected,
      blocking: result.blocking,
      schema_files: result.schemaFiles,
      orms: result.orms,
      unpushed_orms: result.unpushedOrms,
      message: result.message,
      skipped: result.skipped || false,
    },
  };
};

// ─── verifyCodebaseDrift ─────────────────────────────────────────────────────

// Drift detection constants (mirrors drift.cjs)
const BARREL_RE_DRIFT = /^(packages|apps)\/[^/]+\/src\/index\.(ts|tsx|js|mjs|cjs)$/;
const MIGRATION_RES_DRIFT = [
  /^supabase\/migrations\/.+\.sql$/,
  /^prisma\/migrations\/.+/,
  /^drizzle\/meta\/.+/,
  /^drizzle\/migrations\/.+/,
  /^src\/migrations\/.+\.(ts|js|sql)$/,
  /^db\/migrations\/.+\.(sql|ts|js)$/,
  /^migrations\/.+\.(sql|ts|js)$/,
];
const ROUTE_RES_DRIFT = [
  /^(apps|packages)\/[^/]+\/src\/routes\/.+\.(ts|tsx|js|jsx|mjs|cjs)$/,
  /^src\/routes\/.+\.(ts|tsx|js|jsx|mjs|cjs)$/,
  /^src\/api\/.+\.(ts|tsx|js|jsx|mjs|cjs)$/,
  /^(apps|packages)\/[^/]+\/src\/api\/.+\.(ts|tsx|js|jsx|mjs|cjs)$/,
];
const CATEGORY_PRIORITY_DRIFT: Record<string, number> = {
  new_dir: 0, barrel: 1, route: 2, migration: 3,
};

function driftClassifyFile(file: string): string | null {
  const norm = file.replace(/\\/g, '/');
  if (MIGRATION_RES_DRIFT.some(r => r.test(norm))) return 'migration';
  if (ROUTE_RES_DRIFT.some(r => r.test(norm))) return 'route';
  if (BARREL_RE_DRIFT.test(norm)) return 'barrel';
  return null;
}

function driftIsPathMapped(file: string, structureMd: string): boolean {
  const norm = file.replace(/\\/g, '/');
  const parts = norm.split('/');
  for (let i = parts.length - 1; i >= 1; i--) {
    const prefix = parts.slice(0, i).join('/');
    if (structureMd.includes(prefix)) return true;
  }
  if (parts.length > 0 && structureMd.includes(parts[0] + '/')) return true;
  if (parts.length > 0 && structureMd.includes('`' + parts[0] + '`')) return true;
  return false;
}

function driftChooseAffectedPaths(paths: string[]): string[] {
  const out = new Set<string>();
  for (const raw of paths) {
    if (typeof raw !== 'string' || !raw) continue;
    const file = raw.replace(/\\/g, '/');
    const parts = file.split('/');
    if (parts.length === 0) continue;
    const top = parts[0];
    if ((top === 'apps' || top === 'packages') && parts.length >= 2) {
      out.add(`${top}/${parts[1]}`);
    } else {
      out.add(top);
    }
  }
  return [...out].sort();
}

function driftReadMappedCommit(filePath: string): string | null {
  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return null;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_][A-Za-z0-9_-]*):\s*(.*)$/);
    if (kv && kv[1] === 'last_mapped_commit') {
      const sha = kv[2].trim();
      return sha.length > 0 ? sha : null;
    }
  }
  return null;
}

function driftFormatSlash(commandName: string, runtime: string): string {
  const rt = runtime.toLowerCase();
  if (rt === 'codex') return `$gsd-${commandName}`;
  return `/gsd-${commandName}`;
}

function driftBuildMessage(
  elements: Array<{ category: string; path: string }>,
  affectedPaths: string[],
  action: string,
  runtime: string,
): string {
  const byCat: Record<string, string[]> = {};
  for (const e of elements) {
    (byCat[e.category] ??= []).push(e.path);
  }
  const lines: string[] = [
    `Codebase drift detected: ${elements.length} structural element(s) since last mapping.`,
    '',
  ];
  const labels: Record<string, string> = {
    new_dir: 'New directories',
    barrel: 'New barrel exports',
    migration: 'New migrations',
    route: 'New route modules',
  };
  for (const cat of ['new_dir', 'barrel', 'migration', 'route']) {
    if (byCat[cat]) {
      lines.push(`${labels[cat]}:`);
      for (const p of byCat[cat]) lines.push(`  - ${p}`);
    }
  }
  lines.push('');
  if (action === 'auto-remap') {
    lines.push(`Auto-remap scheduled for paths: ${affectedPaths.join(', ')}`);
  } else {
    const mapCmd = driftFormatSlash('map-codebase', runtime);
    lines.push(`Run ${mapCmd} --paths ${affectedPaths.join(',')} to refresh planning context.`);
  }
  return lines.join('\n');
}

/**
 * Detect codebase drift since the last `gsd-codebase-mapper` run.
 *
 * Port of `cmdVerifyCodebaseDrift` from `verify.cjs` lines 1331–1459 and
 * `detectDrift`/`readMappedCommit`/`chooseAffectedPaths` from `drift.cjs`.
 * Native implementation avoids the infinite SDK→CLI→SDK recursion that a
 * gsd-tools subprocess stub would create (the CJS verify-command-router now
 * dispatches `verify codebase-drift` direct to `cmdVerifyCodebaseDrift`).
 *
 * @param _args - unused (no positional args for this command)
 * @param projectDir - Project root directory
 */
export const verifyCodebaseDrift: QueryHandler = async (_args, projectDir) => {
  const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';

  try {
    const codebaseDir = join(projectDir, '.planning', 'codebase');
    const structurePath = join(codebaseDir, 'STRUCTURE.md');

    if (!existsSync(structurePath)) {
      return {
        data: {
          skipped: true,
          reason: 'no-structure-md',
          action_required: false,
          directive: 'none',
          elements: [],
        },
      };
    }

    let structureMd: string;
    try {
      structureMd = readFileSync(structurePath, 'utf-8');
    } catch (err) {
      return {
        data: {
          skipped: true,
          reason: 'cannot-read-structure-md: ' + (err instanceof Error ? err.message : String(err)),
          action_required: false,
          directive: 'none',
          elements: [],
        },
      };
    }

    const lastMapped = driftReadMappedCommit(structurePath);

    const { execGit } = await import('./commit.js');

    const revProbe = execGit(projectDir, ['rev-parse', 'HEAD']);
    if (revProbe.exitCode !== 0) {
      return {
        data: {
          skipped: true,
          reason: 'not-a-git-repo',
          action_required: false,
          directive: 'none',
          elements: [],
        },
      };
    }

    let base = lastMapped ?? EMPTY_TREE;
    if (lastMapped) {
      const verify = execGit(projectDir, ['cat-file', '-t', lastMapped]);
      if (verify.exitCode !== 0) base = EMPTY_TREE;
    }

    const diff = execGit(projectDir, ['diff', '--name-status', base, 'HEAD']);
    if (diff.exitCode !== 0) {
      return {
        data: {
          skipped: true,
          reason: 'git-diff-failed',
          action_required: false,
          directive: 'none',
          elements: [],
        },
      };
    }

    const added: string[] = [];
    const modified: string[] = [];
    const deleted: string[] = [];
    for (const line of diff.stdout.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const m = line.match(/^([A-Z])\d*\t(.+?)(?:\t(.+))?$/);
      if (!m) continue;
      const status = m[1];
      const file = m[3] || m[2];
      if (status === 'A' || status === 'R' || status === 'C') added.push(file);
      else if (status === 'M') modified.push(file);
      else if (status === 'D') deleted.push(file);
    }

    // Read config for threshold and action
    const { loadConfig } = await import('../config.js');
    const config = await loadConfig(projectDir);
    const rawConfig = config as unknown as Record<string, unknown>;
    const wf = (rawConfig.workflow ?? {}) as Record<string, unknown>;
    const threshold = Number.isInteger(wf.drift_threshold) && (wf.drift_threshold as number) >= 1
      ? (wf.drift_threshold as number)
      : 3;
    const action = wf.drift_action === 'auto-remap' ? 'auto-remap' : 'warn';

    // Resolve runtime (mirrors resolveRuntime in runtime-slash.cjs)
    const runtime = (process.env.GSD_RUNTIME ?? 'claude').toLowerCase();

    // Run drift detection (inline port of detectDrift from drift.cjs)
    const elements: Array<{ category: string; path: string }> = [];
    const seen = new Map<string, string>();
    for (const rawFile of added) {
      const file = rawFile.replace(/\\/g, '/');
      const specific = driftClassifyFile(file);
      let category = specific;
      if (!category) {
        if (!driftIsPathMapped(file, structureMd)) {
          category = 'new_dir';
        } else {
          continue;
        }
      }
      const prior = seen.get(file);
      if (prior && CATEGORY_PRIORITY_DRIFT[prior] >= CATEGORY_PRIORITY_DRIFT[category!]) continue;
      seen.set(file, category!);
    }
    for (const [file, category] of seen.entries()) {
      elements.push({ category, path: file });
    }
    elements.sort((a, b) =>
      a.category === b.category ? a.path.localeCompare(b.path) : a.category.localeCompare(b.category),
    );

    const actionRequired = elements.length >= threshold;
    let directive = 'none';
    let spawnMapper = false;
    let affectedPaths: string[] = [];
    let message = '';

    if (actionRequired) {
      directive = action;
      affectedPaths = driftChooseAffectedPaths(elements.map(e => e.path));
      if (action === 'auto-remap') spawnMapper = true;
      message = driftBuildMessage(elements, affectedPaths, action, runtime);
    }

    return {
      data: {
        skipped: false,
        reason: null,
        action_required: actionRequired,
        directive,
        spawn_mapper: spawnMapper,
        affected_paths: affectedPaths,
        elements,
        threshold,
        action,
        last_mapped_commit: lastMapped,
        message,
      },
    };
  } catch (err) {
    return {
      data: {
        skipped: true,
        reason: 'exception: ' + (err instanceof Error ? err.message : String(err)),
        action_required: false,
        directive: 'none',
        elements: [],
      },
    };
  }
};
