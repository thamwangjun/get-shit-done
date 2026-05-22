# Phase 4: Fix Hooks Installation - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Modify `bin/install.js` so that a user running `node bin/install.js --claude --global` (or `--codex`) from a freshly cloned repo gets GSD hooks installed to the target config directory, even when `hooks/dist/` has not been built. The fix triggers an on-demand build of `hooks/dist/` when absent, shows a console notice, and then proceeds through the existing copy logic unchanged.

</domain>

<decisions>
## Implementation Decisions

### Build Trigger Mechanism
- **D-01:** When `hooks/dist/` does not exist at install time, run `scripts/build-hooks.js` on-demand using `child_process` (consistent with existing `execSync` usage at line 61). Extract as a helper function so both the Claude and Codex install paths can call it without duplicating the trigger logic.
- **D-02:** The build runs synchronously and blocks install progress until complete — no async/parallel build.

### Build Failure Handling
- **D-03:** If the on-demand build fails (non-zero exit / thrown error), abort the install with an error message and exit non-zero. Do not continue with a partial install. This is consistent with `build-hooks.js` own behavior (`process.exit(1)` on syntax errors).

### Console Notice Format
- **D-04:** Show a single notice before the build: `▶ Building hooks from source...` (using existing color/reset constants). After a successful build, the normal success message `✓ Installed hooks (built from source)` replaces the usual `✓ Installed hooks (bundled)` to distinguish the path taken.
- **D-05:** Build script output (individual "✓ Copying …" lines from `build-hooks.js`) is suppressed — `stdio: 'pipe'` or equivalent. Only the two notice lines above are shown to the user. On failure, surface the captured stderr so the user knows what went wrong.

### Coverage Scope
- **D-06:** Fix applies to **both** the Claude install path (line 5756) and the Codex install path (line 5885). Both paths read from `hooks/dist/` — a missing `hooks/dist/` breaks Codex's `gsd-check-update.js` reference in `config.toml` just as it silently skips Claude hooks. The helper function is called once before either path runs, guaranteeing `hooks/dist/` exists for both.

### Claude's Discretion
- Exact function name for the build helper (e.g., `ensureHooksDist`) — Claude decides
- Where in the file to place the helper (near top with other helpers, or inline above the hook-copy block) — Claude decides
- Whether to use `execSync` or `spawnSync` for subprocess control, so long as stdout is suppressed and stderr is captured for error reporting

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — FIX-01, FIX-02 requirements for this phase
- `.planning/PROJECT.md` — Bug root cause note and fix approach in Accumulated Context → Decisions

### Source Files
- `bin/install.js` lines 5754–5807 — Claude install path (hooks copy block, `existsSync(hooksSrc)` guard)
- `bin/install.js` lines 5882–5915 — Codex install path (`codexHooksSrc` guard, same pattern)
- `scripts/build-hooks.js` — On-demand build script to run; reads from `hooks/`, writes to `hooks/dist/`

### Existing Pattern Reference
- `bin/install.js` lines 59–73 — Existing `execSync` usage (GitHub API fetch); establishes precedent for `child_process` in install.js

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `child_process.execSync` / `spawnSync`: already required at line 61 for GitHub API version fetch — no new dependency
- `fs.existsSync`: used throughout install.js for all directory guards — same pattern applies here
- Color constants (`cyan`, `green`, `yellow`, `dim`, `reset`): defined at top of install.js — use for the build notice

### Established Patterns
- Silent-skip pattern (guard + no else): `if (fs.existsSync(src)) { ... }` with no else branch — the bug pattern being fixed; do not replicate
- Build script as subprocess: `scripts/build-hooks.js` is a standalone Node.js script that calls `process.exit(1)` on failure — treat exit code as the error signal
- Console output style: `console.log(\`  ${green}✓${reset} ...\`)` for success, `console.warn(\`  ${yellow}⚠${reset} ...\`)` for warnings, `console.error(...)` for failures

### Integration Points
- The on-demand build must complete before `hooksSrc` (`path.join(src, 'hooks', 'dist')`) is read — place the build trigger before the first `existsSync(hooksSrc)` check, or inside an `else` branch on that check
- `src` is the GSD package root (resolved earlier in install.js) — `path.join(src, 'scripts', 'build-hooks.js')` gives the correct build script path

</code_context>

<specifics>
## Specific Ideas

- Extract build trigger as a named helper (e.g., `ensureHooksDist(src)`) so it can be called once before both the Claude and Codex copy blocks, rather than duplicating the trigger inline
- The notice "built from source" vs "bundled" distinguishes dev installs from npm-published installs in the output — useful for debugging

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-fix-hooks-installation*
*Context gathered: 2026-04-17*
