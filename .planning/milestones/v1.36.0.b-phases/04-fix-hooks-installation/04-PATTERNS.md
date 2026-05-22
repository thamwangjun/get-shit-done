# Phase 4: Fix Hooks Installation - Pattern Map

**Mapped:** 2026-04-17
**Files analyzed:** 1 (modified file: `bin/install.js`, new helper function `ensureHooksDist`)
**Analogs found:** 4 / 4 (all patterns sourced from within `bin/install.js` itself)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `bin/install.js` — new `ensureHooksDist(src)` helper | utility (installer helper) | file-I/O + subprocess | `bin/install.js` lines 60–73 (existing `execSync` subprocess block) | exact |
| `bin/install.js` — Claude hooks copy block (lines 5754–5807) | installer | file-I/O | `bin/install.js` lines 5882–5913 (Codex hooks copy block) | exact |
| `bin/install.js` — Codex hooks copy block (lines 5882–5913) | installer | file-I/O | `bin/install.js` lines 5754–5807 (Claude hooks copy block) | exact |

**Note:** This phase modifies a single file (`bin/install.js`). All patterns are sourced from within that file — no external analog needed.

---

## Pattern Assignments

### New helper: `ensureHooksDist(src)` in `bin/install.js`

**Analog:** `bin/install.js` lines 59–73 — existing `execSync` child_process usage

**Critical pitfall — require scope** (lines 60–61):
```javascript
// Source: bin/install.js lines 60–61
// child_process is required INSIDE the try block — it is NOT module-scoped.
// The helper must use its own inline require() call.
try {
  const { execSync } = require('child_process');
```
Action: Inside `ensureHooksDist`, write `const { spawnSync } = require('child_process');` at the top of the function body. Node.js module cache makes this free.

**Subprocess pattern** (lines 60–73):
```javascript
// Source: bin/install.js lines 60–73 — pattern for synchronous subprocess with captured output
try {
  const { execSync } = require('child_process');
  const shaJson = execSync(
    'curl -sS -H "User-Agent: gsd-install" ...',
    { encoding: 'utf8', timeout: 15000, windowsHide: true }
  );
  // use result inline
} catch (e) {
  // handle failure — do not continue silently
}
```
Action: For `ensureHooksDist`, use `spawnSync` instead of `execSync`. `spawnSync` gives direct access to `result.status` and `result.stderr` without requiring a try/catch — cleaner for the abort-on-failure contract (D-03).

**`existsSync` guard pattern** (lines 5756–5757):
```javascript
// Source: bin/install.js line 5756–5757 — filesystem guard pattern used throughout the file
const hooksSrc = path.join(src, 'hooks', 'dist');
if (fs.existsSync(hooksSrc)) {
  // ... proceed
}
// No else branch — this is the bug pattern being fixed; do NOT replicate
```
Action: In `ensureHooksDist`, use `if (fs.existsSync(hooksDist)) return;` as the early-exit guard. This is the affirmative version of the same pattern.

**`path.join` construction pattern** (line 5756):
```javascript
// Source: bin/install.js line 5756
const hooksSrc = path.join(src, 'hooks', 'dist');
```
Action: In `ensureHooksDist`, construct both paths using the same convention:
- `const hooksDist = path.join(src, 'hooks', 'dist');`
- `const buildScript = path.join(src, 'scripts', 'build-hooks.js');`

**Console output patterns** (lines 5796, 5801, 5816):
```javascript
// Source: bin/install.js lines 5796, 5801, 5816 — three output levels used in install.js

// Success
console.log(`  ${green}✓${reset} Installed hooks (bundled)`);

// Warning
console.warn(`  ${yellow}⚠${reset}  Missing expected hook: ${sh}`);

// Failure (before process.exit(1))
console.error(`\n  ${yellow}Installation incomplete!${reset} Failed: ${failures.join(', ')}`);
```
Action: The build notice (D-04) uses `cyan` + `▶` for "in-progress" style. Match indentation: two leading spaces, consistent with all other install.js output lines.

**`process.exit(1)` abort pattern** (line 5817):
```javascript
// Source: bin/install.js line 5815–5818 — abort on install failure
if (failures.length > 0) {
  console.error(`\n  ${yellow}Installation incomplete!${reset} Failed: ${failures.join(', ')}`);
  process.exit(1);
}
```
Action: In `ensureHooksDist`, after a non-zero build result, call `process.exit(1)` directly — same as other failure paths in install.js.

**Helper function placement** — look at the block of utility helpers defined from line 155 onward:
```javascript
// Source: bin/install.js lines 155–170 — first utility helper, shows placement convention
function getDirName(runtime) {
  if (runtime === 'copilot') return '.github';
  // ...
  return '.claude';
}

// Source: bin/install.js lines 178–205 — second helper, shows JSDoc style
/**
 * Get the config directory path relative to home directory for a runtime
 * @param {string} runtime
 * @param {boolean} isGlobal
 */
function getConfigDirFromHome(runtime, isGlobal) {
```
Action: Place `ensureHooksDist(src)` in this same region (after line ~14, color constants block, and before the `CODEX_AGENT_SANDBOX` constant block). Include a JSDoc comment matching this style.

---

### Modified: Claude hooks copy block — `bin/install.js` lines 5754–5807

**What changes:** The `if (fs.existsSync(hooksSrc))` block is unchanged. The only change is that `ensureHooksDist(src)` is called before this block runs, guaranteeing the guard always passes. The success message at line 5796 must be conditioned on whether the on-demand build ran (D-04).

**Current success message** (line 5796):
```javascript
// Source: bin/install.js line 5796 — to be modified
console.log(`  ${green}✓${reset} Installed hooks (bundled)`);
```
Action: Replace with a conditional based on a flag or return value from `ensureHooksDist`. The two required message strings are:
- `✓ Installed hooks (bundled)` — when `hooks/dist/` was already present
- `✓ Installed hooks (built from source)` — when `ensureHooksDist` triggered a build

Simplest mechanism: have `ensureHooksDist` return a boolean (`true` = build was triggered). The call site stores the return value and uses it to select the message.

**Current block structure** (lines 5754–5807) — preserved exactly:
```javascript
// Source: bin/install.js lines 5754–5807 — copy block unchanged except success message
const hooksSrc = path.join(src, 'hooks', 'dist');
if (fs.existsSync(hooksSrc)) {
  const hooksDest = path.join(targetDir, 'hooks');
  fs.mkdirSync(hooksDest, { recursive: true });
  // ... copy loop with template substitution ...
  if (verifyInstalled(hooksDest, 'hooks')) {
    console.log(`  ${green}✓${reset} Installed hooks (bundled)`);  // ← message changes
    // ... sh-hook warnings ...
  } else {
    failures.push('hooks');
  }
}
```

---

### Modified: Codex hooks copy block — `bin/install.js` lines 5882–5913

**What changes:** `ensureHooksDist(src)` is called once before the Claude block (around line 5753). The Codex block at line 5876–5913 benefits implicitly — no code changes needed inside the Codex block itself. The `if (fs.existsSync(codexHooksSrc))` guard at line 5886 will now always pass.

**Current Codex block guard** (lines 5885–5886):
```javascript
// Source: bin/install.js lines 5885–5886 — identical bug pattern in the Codex path
const codexHooksSrc = path.join(src, 'hooks', 'dist');
if (fs.existsSync(codexHooksSrc)) {
```
Action: No change to this block. It reads from the same `hooks/dist/` directory that `ensureHooksDist` guarantees will exist.

---

## Shared Patterns

### child_process subprocess (synchronous, output-captured)
**Source:** `bin/install.js` lines 60–73
**Apply to:** `ensureHooksDist` helper function
```javascript
// Pattern: synchronous subprocess with captured output
// Use spawnSync (not execSync) for direct status/stderr access
const { spawnSync } = require('child_process');
const result = spawnSync(process.execPath, [buildScript], {
  encoding: 'utf8',
  stdio: ['pipe', 'pipe', 'pipe'],   // suppress stdout (D-05), capture stderr
});
if (result.status !== 0) {
  // surface stderr, exit non-zero
}
```

### Console output formatting
**Source:** `bin/install.js` lines 10–14 (color constants) + lines 5796, 5801, 5816 (usage)
**Apply to:** `ensureHooksDist` helper (both the notice and error output)
```javascript
// Color constants — already defined at module scope, no redefinition needed
const cyan  = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const dim   = '\x1b[2m';
const reset  = '\x1b[0m';

// Notice before build (D-04)
console.log(`  ${cyan}▶${reset} Building hooks from source...`);

// Error on build failure (D-05: surface stderr)
console.error(`\n  ${yellow}Build failed!${reset} Could not build hooks/dist/:`);
if (result.stderr) console.error(result.stderr);
process.exit(1);
```

### `fs.existsSync` directory guard (affirmative / early-return)
**Source:** `bin/install.js` lines 5756–5757, 5885–5886
**Apply to:** `ensureHooksDist` — the early-return guard when dist/ already exists
```javascript
const hooksDist = path.join(src, 'hooks', 'dist');
if (fs.existsSync(hooksDist)) return;   // no-op when already built
```

### `process.exit(1)` abort
**Source:** `bin/install.js` line 5817
**Apply to:** `ensureHooksDist` on build failure
```javascript
process.exit(1);  // same contract as all other install.js failure paths
```

---

## No Analog Found

None. Every pattern needed for this phase already exists within `bin/install.js`.

---

## Metadata

**Analog search scope:** `bin/install.js` (primary — sole modified file), `scripts/build-hooks.js` (subprocess target, read-only reference)
**Files scanned:** 2
**Pattern extraction date:** 2026-04-17
