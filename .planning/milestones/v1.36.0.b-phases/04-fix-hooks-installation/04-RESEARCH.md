# Phase 4: Fix Hooks Installation - Research

**Researched:** 2026-04-17
**Domain:** Node.js installer script modification — child_process, fs, on-demand build trigger
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** When `hooks/dist/` does not exist at install time, run `scripts/build-hooks.js` on-demand using `child_process` (consistent with existing `execSync` usage at line 61). Extract as a helper function so both the Claude and Codex install paths can call it without duplicating the trigger logic.
- **D-02:** The build runs synchronously and blocks install progress until complete — no async/parallel build.
- **D-03:** If the on-demand build fails (non-zero exit / thrown error), abort the install with an error message and exit non-zero. Do not continue with a partial install.
- **D-04:** Show a single notice before the build: `▶ Building hooks from source...` (using existing color/reset constants). After a successful build, the normal success message `✓ Installed hooks (bundled)` replaces with `✓ Installed hooks (built from source)` to distinguish the path taken.
- **D-05:** Build script output (individual "✓ Copying …" lines from `build-hooks.js`) is suppressed — `stdio: 'pipe'` or equivalent. Only the two notice lines are shown to the user. On failure, surface the captured stderr so the user knows what went wrong.
- **D-06:** Fix applies to **both** the Claude install path (line 5756) and the Codex install path (line 5885). The helper function is called once before either path runs, guaranteeing `hooks/dist/` exists for both.

### Claude's Discretion

- Exact function name for the build helper (e.g., `ensureHooksDist`) — Claude decides
- Where in the file to place the helper (near top with other helpers, or inline above the hook-copy block) — Claude decides
- Whether to use `execSync` or `spawnSync` for subprocess control, so long as stdout is suppressed and stderr is captured for error reporting

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FIX-01 | User running `node bin/install.js --claude --global` from a cloned repo gets all GSD hooks installed to `$HOME/.claude/hooks/` even when `hooks/dist/` has not been built | `ensureHooksDist()` helper detects missing `hooks/dist/` and runs `scripts/build-hooks.js` synchronously; existing copy logic then proceeds unchanged |
| FIX-02 | User sees a console notice when install.js triggers an on-demand build of `hooks/dist/` so the fallback is not silent | `console.log` with `▶ Building hooks from source...` before build; `✓ Installed hooks (built from source)` after success |
</phase_requirements>

---

## Summary

Phase 4 is a targeted modification to a single file: `bin/install.js`. The bug is structural: both the Claude hooks copy block (line 5757) and the Codex hooks copy block (line 5886) guard with `if (fs.existsSync(hooksSrc)) { ... }` with no `else` branch. When `hooks/dist/` is absent (the normal state of a freshly cloned repo — it is gitignored and only built by `prepublishOnly`), the entire hooks copy is silently skipped.

The fix adds a single helper function — `ensureHooksDist(src)` — called once before both guarded blocks. The helper checks for `hooks/dist/`, runs `node scripts/build-hooks.js` synchronously via `child_process` if absent, and aborts with a captured error message if the build fails. After the helper returns, both existing `if (fs.existsSync(hooksSrc))` guards will pass normally.

The implementation has no new dependencies: `child_process` is already `require()`d in install.js (line 61), `fs.existsSync` is used throughout the file, and the color constants (`cyan`, `green`, `yellow`, `dim`, `reset`) are defined at lines 10–14.

**Primary recommendation:** Add `ensureHooksDist(src)` as a named helper near the top of install.js (with other helpers), call it once before the `if (!isCodex && ...)` block that owns the Claude hooks copy, and confirm that the Codex hooks copy block (which runs later under `if (isCodex)`) benefits from the same already-built `hooks/dist/`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| On-demand hooks build trigger | Installer script (CLI) | — | `bin/install.js` is the sole entry point for dev installs; build detection and triggering belong here |
| Build execution | Build script subprocess | — | `scripts/build-hooks.js` owns build logic; install.js delegates via child_process |
| Console notice output | Installer script (CLI) | — | install.js already owns all user-facing output; notice follows existing `console.log` pattern |
| Error reporting / exit | Installer script (CLI) | — | install.js already calls `process.exit(1)` on install failures; on-demand build failure follows same contract |

---

## Standard Stack

### Core (no new dependencies)

| Asset | Location | Purpose | Why Standard |
|-------|----------|---------|--------------|
| `child_process.execSync` | Already required at line 61 | Run `scripts/build-hooks.js` synchronously | Already used in install.js for GitHub API fetch; no new require() needed |
| `child_process.spawnSync` | Node.js built-in | Alternative: subprocess with finer stdio control | Both `execSync` and `spawnSync` work; decision deferred to Claude's discretion |
| `fs.existsSync` | Already used throughout install.js | Guard: detect missing `hooks/dist/` | Consistent with every other directory guard in install.js |
| `path.join` | Already used throughout install.js | Construct `hooks/dist/` and `scripts/build-hooks.js` paths | Same pattern as `hooksSrc` construction at line 5756 |

[VERIFIED: codebase grep — `require('child_process')` at line 61; `fs.existsSync` used at lines 5757, 5886; `path.join` used throughout]

### Supporting — console output constants

| Constant | Value | Already Defined? |
|----------|-------|-----------------|
| `cyan` | `\x1b[36m` | Yes — line 10 |
| `green` | `\x1b[32m` | Yes — line 11 |
| `yellow` | `\x1b[33m` | Yes — line 12 |
| `dim` | `\x1b[2m` | Yes — line 13 |
| `reset` | `\x1b[0m` | Yes — line 14 |

[VERIFIED: codebase Read — install.js lines 10–14]

---

## Architecture Patterns

### System Architecture Diagram

```
node bin/install.js --claude --global
           │
           ▼
  ensureHooksDist(src)
           │
    hooks/dist/ exists?
     ┌─────┴──────┐
    YES            NO
     │              │
     │    console.log("▶ Building hooks from source...")
     │              │
     │    node scripts/build-hooks.js  (stdio: 'pipe')
     │              │
     │       exit code 0?
     │        ┌─────┴──────┐
     │       YES            NO
     │        │              │
     │        │    console.error(stderr)
     │        │    process.exit(1)
     │        │
     └────────┘
           │
           ▼
  if (!isCodex && ...) {
    if (fs.existsSync(hooksSrc)) {   // ← now always true
      ... copy loop ...
      console.log("✓ Installed hooks (built from source OR bundled)")
    }
  }
           │
           ▼
  if (isCodex) {
    if (fs.existsSync(codexHooksSrc)) {  // ← now always true
      ... copy loop ...
    }
  }
```

### Component Responsibilities

| Component | File | Responsibility |
|-----------|------|----------------|
| `ensureHooksDist(src)` | `bin/install.js` (new helper) | Detect missing dist, trigger build, surface errors, emit notice |
| `scripts/build-hooks.js` | Existing — unchanged | Copy hooks from `hooks/` to `hooks/dist/` with syntax validation |
| Claude hooks copy block | `bin/install.js` lines 5754–5807 | Read from `hooks/dist/`, template-substitute, write to `$HOME/.claude/hooks/` |
| Codex hooks copy block | `bin/install.js` lines 5882–5913 | Read from `hooks/dist/`, template-substitute, write to Codex config hooks dir |

### Recommended Helper Placement

Place `ensureHooksDist(src)` near the top of install.js, after the color constants and before the `CODEX_AGENT_SANDBOX` block — consistent with where short utility helpers live in large installer scripts. Call it at the single point in the main install flow where it's needed: just before the `if (!isCodex && !isCopilot && !isCursor && ...)` block that contains the Claude hooks copy.

```javascript
// Source: bin/install.js (to be added)

/**
 * Ensure hooks/dist/ exists. If absent, build it on-demand.
 * Aborts the installer with a non-zero exit if the build fails.
 */
function ensureHooksDist(src) {
  const hooksDist = path.join(src, 'hooks', 'dist');
  if (fs.existsSync(hooksDist)) return;

  console.log(`  ${cyan}▶${reset} Building hooks from source...`);
  const buildScript = path.join(src, 'scripts', 'build-hooks.js');
  const { spawnSync } = require('child_process');
  const result = spawnSync(process.execPath, [buildScript], {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    console.error(`\n  ${yellow}Build failed!${reset} Could not build hooks/dist/:`);
    if (result.stderr) console.error(result.stderr);
    process.exit(1);
  }
}
```

[ASSUMED] — The above uses `spawnSync` because it gives direct access to `result.status` and `result.stderr` without a try/catch. `execSync` would also work (throwing on non-zero exit); both choices are within Claude's discretion per D-01.

**Note on the success message (D-04):** The existing message `✓ Installed hooks (bundled)` is at line 5796. After the helper is in place, this must distinguish the on-demand build path. One approach: `ensureHooksDist` sets a module-scoped flag `builtFromSource = false` that it flips to `true`, and the success message checks that flag. Alternatively, the helper could return a boolean. The exact mechanism is Claude's discretion, but the message distinction is locked (D-04).

### Anti-Patterns to Avoid

- **Calling `ensureHooksDist` twice (once per copy block):** The helper is idempotent, but calling it before the Claude block and again before the Codex block is redundant. Call once before both blocks.
- **Catching the build error and continuing:** D-03 is explicit — abort with non-zero exit on build failure. Do not silently continue.
- **Duplicating the trigger logic inline:** D-01 mandates a helper function so both paths share the same code.
- **Suppressing stderr on failure:** D-05 says suppress stdout (build progress lines) but surface stderr on failure. Always show stderr to the user when the build fails.
- **Using `stdio: 'inherit'`:** This would print all of `build-hooks.js`'s "✓ Copying..." lines to the user — explicitly prohibited by D-05.

---

## Solved Problems

| Problem | Do Not Hand-Roll — Use Instead | Why |
|---------|-------------------------------|-----|
| Synchronous subprocess with captured output | `child_process.spawnSync` or `child_process.execSync` | Already in Node.js stdlib; already imported in install.js; no new dependency |
| Syntax validation of hook files before copy | `scripts/build-hooks.js` — it already calls `vm.Script` for syntax check | The build script validates syntax before copying; the installer must not duplicate this |

---

## Common Pitfalls

### Pitfall 1: `require('child_process')` is inside a try/catch block at line 61

**What goes wrong:** The existing `execSync` require is scoped inside a `try` block (lines 60–73) for the GitHub API version fetch. If you naively reference `execSync` outside that block, it is undefined.

**Root cause:** The top-level `require('child_process')` is only done inside the try block at line 61, not at the module top level.

**Prevention:** In `ensureHooksDist`, add a fresh `const { spawnSync } = require('child_process');` (or `execSync`) inline within the helper function body. Node.js caches modules, so this is not a performance concern.

**Warning signs:** `ReferenceError: spawnSync is not defined` at runtime.

[VERIFIED: codebase Read — install.js lines 60–73, the require is inside try]

### Pitfall 2: `src` variable may not be defined at the helper's call site

**What goes wrong:** The helper `ensureHooksDist(src)` takes `src` as a parameter (the GSD package root). Confirm that `src` is already resolved at the point where the helper is called.

**Root cause:** `src` is resolved earlier in the install flow. If the helper is called before `src` is assigned, the build script path will be wrong.

**Prevention:** The helper call site is just before the Claude hooks copy block (around line 5754) — by then, `src` is fully resolved. Verify by reading the function that sets up `src` before placing the call.

**Warning signs:** `Error: Cannot find module '/path/undefined/scripts/build-hooks.js'`

[VERIFIED: codebase context — `hooksSrc = path.join(src, 'hooks', 'dist')` at line 5756, so `src` is available]

### Pitfall 3: The success message branch requires knowing which path was taken

**What goes wrong:** Line 5796 unconditionally logs `✓ Installed hooks (bundled)`. After this fix, the message must say `(built from source)` when the on-demand build ran.

**Root cause:** The existing code has no concept of "which path was taken."

**Prevention:** The simplest approach is a module-scoped flag `let _builtHooksFromSource = false;` set to `true` inside `ensureHooksDist` when a build is triggered. The log at line 5796 checks the flag. Alternatively, have `ensureHooksDist` return a boolean.

[ASSUMED] — Exact mechanism is Claude's discretion, as long as D-04's message distinction is honoured.

### Pitfall 4: `hooks/dist/` confirmation — verify current state

**What goes wrong:** Tests that assume `hooks/dist/` already exists (e.g., `install-hooks-copy.test.cjs`, `bug-1834-sh-hooks-installed.test.cjs`) call `build-hooks.js` in their `before()` hooks. If the on-demand build changes the state of `hooks/dist/` during test runs, those `before()` hooks may behave differently.

**Root cause:** Tests pre-build `hooks/dist/`; the regression test for this phase must test the *absent* `hooks/dist/` case without breaking other tests.

**Prevention:** The regression test (FIX-03, Phase 5) must use a temp directory and NOT delete the real `hooks/dist/` — it must mock or skip the `existsSync` check by running install.js in an environment where `src` points to a temp tree that lacks a `dist/` directory.

[VERIFIED: codebase Read — `tests/bug-1834-sh-hooks-installed.test.cjs` line 38–42 runs BUILD_SCRIPT in `before()`; `tests/install-hooks-copy.test.cjs` line 47–52 does the same]

---

## Code Examples

### Existing execSync usage in install.js (pattern reference)

```javascript
// Source: bin/install.js lines 60–73
try {
  const { execSync } = require('child_process');
  const shaJson = execSync(
    'curl -sS -H "User-Agent: gsd-install" ...',
    { encoding: 'utf8', timeout: 15000, windowsHide: true }
  );
  // ...
} catch (e) {
  // GitHub API unavailable - gsdVersion remains as the fallback semver
}
```

### Existing existsSync guard pattern (the bug pattern being fixed)

```javascript
// Source: bin/install.js lines 5756–5807 (Claude path)
const hooksSrc = path.join(src, 'hooks', 'dist');
if (fs.existsSync(hooksSrc)) {       // ← silent skip when dist/ absent
  // ... copy loop ...
  console.log(`  ${green}✓${reset} Installed hooks (bundled)`);
}
// No else branch — this is the bug
```

### Existing console output style

```javascript
// Source: bin/install.js lines 10–14 + various usage sites
console.log(`  ${green}✓${reset} Installed hooks (bundled)`);       // success
console.warn(`  ${yellow}⚠${reset}  Missing expected hook: ${sh}`);  // warning
console.error(`\n  ${yellow}Installation incomplete!...`);            // failure
```

### How existing regression tests run the installer (reference for FIX-03 test in Phase 5)

```javascript
// Source: tests/bug-1834-sh-hooks-installed.test.cjs lines 60–69
function runInstaller(configDir) {
  execFileSync(process.execPath, [INSTALL_SCRIPT, '--claude', '--global', '--yes'], {
    encoding: 'utf-8',
    stdio: 'pipe',
    env: {
      ...process.env,
      CLAUDE_CONFIG_DIR: configDir,   // redirect global install target to temp dir
    },
  });
  return path.join(configDir, 'hooks');
}
```

The regression test for FIX-03 (Phase 5) will follow this same pattern but also needs to ensure `hooks/dist/` is absent when the installer runs. The test must NOT delete the real `hooks/dist/` directory — it should simulate absence by pointing `src` at a temp tree, or by using a wrapper that intercepts the `existsSync` call. The cleanest approach: copy only `hooks/*.js` and `hooks/*.sh` source files (not `dist/`) to a temp GSD root, then run install.js pointing at that root.

[VERIFIED: codebase Read — `CLAUDE_CONFIG_DIR` env var redirect confirmed at install.js line 402–403]

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| Silent skip on missing `hooks/dist/` (current bug) | On-demand build trigger with console notice | Users who clone the repo no longer need a manual `npm run build:hooks` before installing |

**Deprecated/outdated:**

- None — this is a targeted bug fix with no library changes.

---

## Runtime State Inventory

Not applicable — this is a greenfield fix to a CLI script, not a rename/refactor/migration phase.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `bin/install.js`, `scripts/build-hooks.js` | Yes (install.js already running) | Same version running install.js | — |
| `child_process` (stdlib) | `ensureHooksDist` helper | Yes — stdlib, always available | N/A | — |
| `scripts/build-hooks.js` | `ensureHooksDist` helper | Yes | Verified present in repo | — |
| `hooks/*.js`, `hooks/*.sh` source files | `scripts/build-hooks.js` | Yes — verified present | See hooks/ directory listing | — |
| `hooks/dist/` | Install copy blocks | **Absent on fresh clone** | — | On-demand build (this fix) |

[VERIFIED: bash — `ls hooks/` confirms all 10 source hooks present; `hooks/dist/` does not exist]

**Missing dependencies with no fallback:** None.

**Blocking condition resolved by this phase:** `hooks/dist/` is absent on fresh clone — blocked by the bug being fixed.

---

## Validation Architecture

> `nyquist_validation` is `false` in `.planning/config.json` — this section is informational only.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (`node:test`) |
| Config file | None — `scripts/run-tests.cjs` discovers all `tests/*.test.cjs` |
| Quick run command | `node --test tests/install-hooks-copy.test.cjs` |
| Full suite command | `npm test` |

### Existing Test Coverage for This Phase

The following test files are relevant to Phase 4's changes:

| Test File | What It Covers | Run Before Commit? |
|-----------|----------------|-------------------|
| `tests/install-hooks-copy.test.cjs` | Hook copy loop correctness, source-level checks for install.js | Yes |
| `tests/bug-1834-sh-hooks-installed.test.cjs` | End-to-end install; runs real installer into temp dir | Yes |

Both files have a `before()` that pre-builds `hooks/dist/` via `BUILD_SCRIPT`. This means they test the *pre-built* path. The regression test for the *absent dist/* path is FIX-03, assigned to Phase 5.

### Source-level assertion that will need updating

`tests/install-hooks-copy.test.cjs` contains source-level string checks for the `✓ Installed hooks (bundled)` message and the `configDirReplacement` anchor. After Phase 4, a new assertion should verify `Built from source` is present in install.js. This is Phase 5 scope (FIX-03).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `spawnSync` is preferable to `execSync` for the helper because it gives direct `result.status` and `result.stderr` access without try/catch | Architecture Patterns — helper code example | Low — `execSync` is equally valid; decision is within Claude's discretion per D-01 |
| A2 | A module-scoped boolean flag is the simplest way to track "built from source" for the success message distinction | Common Pitfalls — Pitfall 3 | Low — any mechanism works; the D-04 message requirement is locked, not the implementation |
| A3 | `ensureHooksDist` should be called once before the Claude hooks block and benefit the Codex block implicitly | Architecture Patterns | Low — the Codex block at line 5885 uses the same `hooks/dist/` path; one build serves both |

---

## Open Questions

1. **`execSync` vs `spawnSync` — which produces cleaner error messages?**
   - What we know: Both are stdlib. `execSync` throws an `Error` with `.stderr` and `.stdout` properties on non-zero exit. `spawnSync` returns a result object with `.status`, `.stderr`, `.stdout` properties.
   - What is unclear: The exact shape of `execSync`'s error vs `spawnSync`'s result object — one requires try/catch, the other does not.
   - Recommendation: Use `spawnSync` — no try/catch needed, direct access to `result.status` and `result.stderr`, matches D-05 more naturally.

2. **Should `ensureHooksDist` be a no-op when `hooks/dist/` was already present?**
   - What we know: `fs.existsSync(hooksDist)` returning `true` means the early return path fires immediately.
   - What is unclear: Nothing — early return is correct per D-06 ("existing path is unaffected").
   - Recommendation: Yes, early return on `existsSync` true is the correct design per Success Criteria 3.

---

## Sources

### Primary (HIGH confidence)

- [VERIFIED: codebase Read] `bin/install.js` lines 1–14 — color constants, child_process require placement
- [VERIFIED: codebase Read] `bin/install.js` lines 5754–5807 — Claude hooks copy block (silent-skip bug)
- [VERIFIED: codebase Read] `bin/install.js` lines 5882–5913 — Codex hooks copy block (same bug)
- [VERIFIED: codebase Read] `scripts/build-hooks.js` — build script API, `process.exit(1)` on error
- [VERIFIED: codebase Read] `tests/install-hooks-copy.test.cjs` — existing test structure, `before()` hook pattern
- [VERIFIED: codebase Read] `tests/bug-1834-sh-hooks-installed.test.cjs` — end-to-end install test pattern, `CLAUDE_CONFIG_DIR` redirect
- [VERIFIED: bash] `hooks/dist/` does not exist in the working tree (confirmed absent)
- [VERIFIED: bash] `hooks/` source directory has all 10 hook files present

### Secondary (MEDIUM confidence)

- [VERIFIED: codebase Read] `.planning/phases/04-fix-hooks-installation/04-CONTEXT.md` — all locked decisions D-01 through D-06

### Flagged for Validation (LOW confidence)

- None.

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new dependencies; all tools verified present in codebase
- Architecture: HIGH — bug location and fix approach verified by direct code reading
- Pitfalls: HIGH — confirmed from direct code inspection (require scope, src variable, test patterns)

**Research date:** 2026-04-17
**Valid until:** Stable indefinitely — this is a targeted fix to a file under direct observation; no external library churn risk.
