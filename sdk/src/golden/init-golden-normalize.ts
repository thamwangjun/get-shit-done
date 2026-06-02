/**
 * Normalize `init quick` payloads for golden parity: CJS runs in a subprocess with a
 * different clock than the in-process SDK, so time-derived fields cannot match exactly.
 */

/** Keys derived from `Date` / `quick_id` generation (init.cjs cmdInitQuick). */
export const INIT_QUICK_VOLATILE_KEYS = ['quick_id', 'timestamp', 'branch_name', 'task_dir'] as const;

export function omitInitQuickVolatile(data: Record<string, unknown>): Record<string, unknown> {
  const o = { ...data };
  for (const k of INIT_QUICK_VOLATILE_KEYS) {
    delete o[k];
  }
  return o;
}

// ─── init execute-phase normalization ────────────────────────────────────────

/**
 * Volatile keys for `init execute-phase` payloads.
 * `project_root` is an absolute filesystem path that varies by checkout location.
 * `agents_installed`, `missing_agents`, `project_title` vary by install state.
 *
 * Note: initExecutePhase does not emit `date` or `timestamp` (unlike initQuick
 * which emits `quick_id` + `timestamp`), so those keys are intentionally absent
 * from this volatile list. Adding them here would mask future accidental regressions
 * that cause the handler to start emitting date fields.
 */
export const INIT_EXECUTE_PHASE_VOLATILE_KEYS = [
  'project_root',
  'agents_installed',
  'missing_agents',
  'project_title',
] as const;

/**
 * Strip volatile keys from an `init execute-phase` payload before toEqual comparison.
 * Mirrors omitInitQuickVolatile for the execute-phase builder.
 */
export function omitInitExecutePhaseVolatile(data: Record<string, unknown>): Record<string, unknown> {
  const o = { ...data };
  for (const k of INIT_EXECUTE_PHASE_VOLATILE_KEYS) {
    delete o[k];
  }
  return o;
}
