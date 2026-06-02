/**
 * Shared git introspection helpers for init composition handlers.
 *
 * Previously duplicated verbatim in both composer.ts and complex.ts (WR-06).
 * Extracted here so bug fixes propagate to all callers automatically.
 *
 * Keep this implementation behaviour-identical to the CJS originals in
 * get-shit-done/bin/lib/core.cjs (gitWorktreeInfoInternal, detectNestedSubdir).
 */

import { execSync } from 'node:child_process';

/**
 * Bug #3491: detect whether `base` is inside any git worktree, and if so,
 * return the absolute worktree root. Returns { inside: false, worktreeRoot: null }
 * on any error (git unavailable, not a repo, timeout) so callers see the
 * conservative default that preserves pre-fix behaviour for non-git environments.
 */
export function gitWorktreeInfo(base: string): { inside: boolean; worktreeRoot: string | null } {
  try {
    const inside = execSync('git rev-parse --is-inside-work-tree', {
      cwd: base,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf-8',
      timeout: 5000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    }).trim();
    if (inside !== 'true') return { inside: false, worktreeRoot: null };
    try {
      const root = execSync('git rev-parse --show-toplevel', {
        cwd: base,
        stdio: ['ignore', 'pipe', 'ignore'],
        encoding: 'utf-8',
        timeout: 5000,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
      }).trim();
      return { inside: true, worktreeRoot: root || null };
    } catch {
      return { inside: true, worktreeRoot: null };
    }
  } catch {
    return { inside: false, worktreeRoot: null };
  }
}

/**
 * Detect whether `base` is a nested subdirectory within its git worktree root.
 * Uses `git rev-parse --show-prefix` as the primary check; falls back to path
 * comparison against the worktree root when git-prefix is unavailable.
 */
export function detectNestedSubdir(base: string, info: { inside: boolean; worktreeRoot: string | null }): boolean {
  if (!info.inside) return false;
  try {
    const prefix = execSync('git rev-parse --show-prefix', {
      cwd: base,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf-8',
      timeout: 5000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    }).trim().replace(/\\/g, '/');
    if (prefix.length > 0) return prefix !== '.' && prefix !== './';
    return false;
  } catch {}

  if (!info.worktreeRoot) return false;
  const normalize = (p: string) => p.replace(/\\/g, '/').replace(/\/+$/g, '').toLowerCase();
  const root = normalize(info.worktreeRoot);
  const cwd = normalize(base);
  return root !== cwd;
}
