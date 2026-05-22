# Codebase Concerns

**Analysis Date:** 2026-04-15

## Tech Debt

**Monolithic installer (6,676 lines):**
- Issue: `bin/install.js` is a single 6,676-line file with 152 functions, handling detection, transformation, file copying, and hook registration for 10+ runtimes in one flat namespace.
- Files: `bin/install.js`
- Impact: Any new runtime addition requires reading the entire file to understand context; cross-runtime regressions are hard to isolate; tests cover specific behaviors via string-scanning rather than unit testing individual install logic.
- Fix approach: Extract per-runtime install handlers into `bin/runtimes/<name>.js` modules, keeping `install.js` as a dispatcher.

**Largest lib modules lack decomposition:**
- Issue: `get-shit-done/bin/lib/init.cjs` (1,711 lines, 26 functions) and `get-shit-done/bin/lib/core.cjs` (1,637 lines) combine unrelated concerns. `core.cjs` mixes path utilities, git wrappers, lock primitives, config loading, output helpers, temp file management, markdown normalization, and phase search.
- Files: `get-shit-done/bin/lib/init.cjs`, `get-shit-done/bin/lib/core.cjs`
- Impact: High cognitive load for contributors; any change to a low-level utility requires reading past unrelated functions; import lists from `core.cjs` are already 20+ symbols wide.
- Fix approach: Split `core.cjs` into `path-utils.cjs`, `git-utils.cjs`, `lock.cjs`, and `output.cjs`. Split `init.cjs` into `init-execute.cjs`, `init-plan.cjs`, and `init-workspace.cjs`.

**Silent `catch {}` blocks throughout lib layer:**
- Issue: `core.cjs` has 31 bare `catch {}` blocks, `state.cjs` has 15, `init.cjs` has 31. Most are intentional for best-effort operations, but there is no convention distinguishing "this failure is truly ignorable" from "we suppressed a real error."
- Files: `get-shit-done/bin/lib/core.cjs`, `get-shit-done/bin/lib/state.cjs`, `get-shit-done/bin/lib/init.cjs`
- Impact: Bugs that corrupt state silently (e.g., config write failures at line 314 in `core.cjs`, workstream STATE.md write at line 154 in `workstream.cjs`) are invisible without debug logging.
- Fix approach: Add a structured `SILENT_FAILURE` comment pattern like `catch { /* SILENT: <reason> */ }` and introduce a debug env flag `GSD_DEBUG=1` that routes these to stderr.

**Legacy config formats kept alive indefinitely:**
- Issue: `core.cjs` `loadConfig()` still migrates `multiRepo: true` (boolean) to `sub_repos` array and `depth` to `granularity` on every load. Migration code writes back to disk, mutating user config silently. Both deprecated keys are also allowlisted in `KNOWN_TOP_LEVEL`.
- Files: `get-shit-done/bin/lib/core.cjs` (lines 276–330)
- Impact: Migration logic triggers on every `gsd-tools` invocation for any user who hasn't cleaned up their config; extra disk writes on hot path.
- Fix approach: Add a migration version stamp to `config.json`. Run migration once, stamp it, skip on subsequent loads.

**Non-atomic writes in `workstream.cjs`, `intel.cjs`, `learnings.cjs`, and `milestone.cjs`:**
- Issue: Several modules use raw `fs.writeFileSync` instead of `atomicWriteFileSync` for files that could be written concurrently during wave execution. Specifically: `workstream.cjs` line 154 (STATE.md creation), `intel.cjs` lines 366 and 506 (snapshot and data files), `learnings.cjs` line 128 (learning records), `milestone.cjs` lines 157 and 164 (archive files).
- Files: `get-shit-done/bin/lib/workstream.cjs`, `get-shit-done/bin/lib/intel.cjs`, `get-shit-done/bin/lib/learnings.cjs`, `get-shit-done/bin/lib/milestone.cjs`
- Impact: Parallel agent waves can produce truncated files if two processes write simultaneously; milestone archiving is not crash-safe.
- Fix approach: Replace `fs.writeFileSync` with `atomicWriteFileSync` from `core.cjs` in all these locations. The infrastructure already exists.

**Lazy `require()` calls inside hot functions:**
- Issue: `state.cjs` calls `require('./security.cjs')` inside `cmdStateGet`, `cmdStatePatch`, and `cmdStateUpdate` rather than at module load time. `init.cjs` calls `require('./state.cjs')` and `require('os')` inside functions.
- Files: `get-shit-done/bin/lib/state.cjs` (lines 134, 149, 194), `get-shit-done/bin/lib/init.cjs` (lines 156, 161, 308, 329, 1353)
- Impact: Each call site re-evaluates the require cache lookup; minor performance overhead; makes static analysis of module dependencies inaccurate.
- Fix approach: Move all `require` calls to the top of each module.

## Known Bugs

**`Atomics.wait` behavior differs across environments:**
- Symptoms: Lock retry logic in `core.cjs` and `state.cjs` uses `Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delayMs)` as a cross-platform sleep. In environments where `SharedArrayBuffer` is unavailable (some CI runners, worker threads), the wait silently falls through immediately, causing spin-loops rather than actual backoff.
- Files: `get-shit-done/bin/lib/core.cjs` (line 655), `get-shit-done/bin/lib/state.cjs` (line 903)
- Trigger: Any parallel-agent execution in an environment where `SharedArrayBuffer` is restricted (CSP or cross-origin isolation missing).
- Workaround: None; the function degrades to a busy-wait.

**`atomicWriteFileSync` fallback to direct write on rename failure loses atomicity guarantee:**
- Symptoms: When `fs.renameSync` fails (e.g., on network drives or cross-filesystem temp dirs), the function silently falls back to `fs.writeFileSync`, which is non-atomic. This defeats the purpose of the function.
- Files: `get-shit-done/bin/lib/core.cjs` (lines 1551–1560)
- Trigger: Users with `.planning/` on a network mount or Docker volume where the OS temp dir is a different filesystem.
- Workaround: None; the write succeeds but without atomicity.

**`output()` 50KB threshold is undocumented and brittle:**
- Symptoms: When JSON output exceeds 50,000 bytes, `core.cjs` writes to a temp file and emits `@file:<path>` instead. Callers in workflow/agent `.md` files must detect and handle this path prefix. If a caller does not handle `@file:`, it silently processes the literal string `@file:/tmp/gsd/gsd-<ts>.json` as JSON, producing cryptic parse errors.
- Files: `get-shit-done/bin/lib/core.cjs` (lines 205–212)
- Trigger: Large projects with many phases, long ROADMAP.md entries, or many agents can push `init` payloads past 50KB.
- Workaround: Agents that use `--raw` or `--pick` flags avoid the large payload path.

## Security Considerations

**`sanitizeForPrompt` is called in only one location:**
- Risk: User-supplied text that flows into STATE.md fields, phase plans, or roadmap entries is a potential indirect prompt injection vector. The security module documents this threat model explicitly. However, `sanitizeForPrompt` from `security.cjs` is only imported and called at one location (`commands.cjs` line 259) — in the git commit message path.
- Files: `get-shit-done/bin/lib/security.cjs`, `get-shit-done/bin/lib/commands.cjs` (line 259)
- Current mitigation: `security.cjs` has `validateFieldName` and `validatePath` used in state writes, and `scanForPromptInjection` is available but not called outside tests.
- Recommendations: Apply `sanitizeForPrompt` to user-supplied values written to STATE.md (`cmdStateUpdate`, `cmdStatePatch`), to phase names and slugs derived from user input, and to any PRD content written to `.planning/` files.

**`execSync('git diff --cached --name-only', ...)` uses shell interpolation:**
- Risk: `commands.cjs` line 987 uses `execSync` with a string command rather than `execFileSync` with array args. The `cwd` argument is controlled by caller, not the command string, so direct injection is not possible. However, the inconsistency with the rest of the codebase (which explicitly uses `execFileSync` to prevent shell interpretation, per the comment at `core.cjs` line 438) creates a maintenance trap where future edits could introduce interpolated variables.
- Files: `get-shit-done/bin/lib/commands.cjs` (line 987)
- Current mitigation: The `cwd` option scopes the command; command string itself has no interpolated variables currently.
- Recommendations: Replace with `execFileSync('git', ['diff', '--cached', '--name-only'], { cwd, encoding: 'utf-8' })` for consistency.

**API keys stored in plaintext files under `~/.gsd/`:**
- Risk: `config.cjs` checks for `~/.gsd/brave_api_key`, `~/.gsd/firecrawl_api_key`, and `~/.gsd/exa_api_key` as filesystem alternatives to env vars.
- Files: `get-shit-done/bin/lib/config.cjs` (lines 113–117)
- Current mitigation: Keys are in the user's home directory. No key is logged or emitted in output.
- Recommendations: Document that key files should have `chmod 600` permissions. The installer does not set permissions on these files.

## Performance Bottlenecks

**`buildStateFrontmatter` disk scan — cached per process but not across processes:**
- Problem: `state.cjs` scans all phase directories to build YAML frontmatter on every `STATE.md` write. A `_diskScanCache` Map caches results per `cwd` per process (added in fix #1967), but each `gsd-tools` invocation is a new process, so every wave agent re-scans disk.
- Files: `get-shit-done/bin/lib/state.cjs` (lines 10–13)
- Cause: Multi-agent wave execution spawns many short-lived `gsd-tools` processes in parallel; each does its own disk scan for frontmatter.
- Improvement path: Persist the frontmatter cache to a temp file stamped with a directory mtime hash, invalidated on filesystem change.

**`findProjectRoot` walks the entire ancestor chain on every invocation:**
- Problem: Every `gsd-tools` call invokes `findProjectRoot` which stats `.planning/` existence and reads `config.json` at every ancestor directory up to `$HOME`.
- Files: `get-shit-done/bin/lib/core.cjs` (lines 86–150)
- Cause: No process-level cache; each invocation re-walks.
- Improvement path: Cache result in an env var set by the installer or hook, or memoize using a process-level singleton.

**`loadConfig` detects and syncs `sub_repos` on every load:**
- Problem: `loadConfig` calls `detectSubRepos` (which does `readdirSync` + `existsSync` per child dir) and potentially writes `config.json` on every invocation when `sub_repos` drift from disk.
- Files: `get-shit-done/bin/lib/core.cjs` (lines 299–315)
- Cause: The sync check runs unconditionally for any project with sub_repos configured.
- Improvement path: Guard the sync with a mtime check on `config.json` vs. directory mtime.

## Fragile Areas

**STATE.md regex-based field editing:**
- Files: `get-shit-done/bin/lib/state.cjs` (lines 33–40, 100–127, 163–174, 206–214)
- Why fragile: State fields are located and updated via dynamically constructed `RegExp` objects using `escapeRegex`-protected field names. The code supports two format variants (`**bold:**` and `plain:`). If STATE.md is reformatted by a user or an LLM into a third format variant (e.g., `### Field\nvalue`), updates silently fail and `results.failed` is returned — callers may not check this array.
- Safe modification: Always use `cmdStateUpdate` or `readModifyWriteStateMd`; never write STATE.md directly. Add a test asserting failed-field counts are zero in the success path.
- Test coverage: `tests/state.test.cjs` covers both format variants, but does not test the silent-failure path where a field exists in an unexpected format.

**Lock timeout forces acquisition after 10 seconds:**
- Files: `get-shit-done/bin/lib/core.cjs` (lines 661–663), `get-shit-done/bin/lib/state.cjs` (lines 898–900)
- Why fragile: Both `withPlanningLock` and `acquireStateLock` force-acquire the lock after a timeout by deleting it. If the lock holder is slow (large STATE.md write, slow network volume) rather than dead, force acquisition can cause a split-brain write where both processes write concurrently.
- Safe modification: Use PID liveness check (via `process.kill(pid, 0)`) before force-acquiring, rather than relying purely on age.
- Test coverage: `tests/locking-bugs-1909-1916-1925-1927.test.cjs` tests specific scenarios but not the force-acquire race.

**`@file:` protocol for large outputs is undocumented in agent specs:**
- Files: `get-shit-done/bin/lib/core.cjs` (lines 205–212), `get-shit-done/get-shit-done/workflows/*.md`
- Why fragile: Agents that call `gsd-tools init` must detect the `@file:` prefix and read the temp file rather than parsing stdout directly. This protocol is implemented in the workflow Bash steps but is not documented as a contract. Any new workflow or agent that calls a gsd-tools command returning large payloads will silently receive an unparse-able string.
- Safe modification: When adding a new workflow that calls `gsd-tools`, always implement `@file:` detection using the pattern present in existing workflows.
- Test coverage: No dedicated test for the `@file:` output path; covered only implicitly by large-project integration paths.

**`normalizeMd` applied universally can corrupt non-markdown content:**
- Files: `get-shit-done/bin/lib/core.cjs` (lines 465–545)
- Why fragile: `normalizeMd` enforces blank lines around headings, fenced code blocks, and lists. It is called on every STATE.md, ROADMAP.md, and PLAN.md write. If a file contains intentional dense formatting (e.g., a compact checklist), normalization expands it. The function is correct for standard markdown but could produce unexpected results for files with non-standard structures like YAML-heavy frontmatter followed by dense tables.
- Safe modification: Do not call `normalizeMd` on JSON files or on content that should not be reformatted. The function is already guarded against non-string input.
- Test coverage: `tests/core.test.cjs` has normalization tests, but edge cases with deeply nested or non-standard list structures are not covered.

## Scaling Limits

**`context_window` default of 200K tokens:**
- Current capacity: 200,000 tokens per agent context window (default). Configurable to 1,000,000 for supported models.
- Limit: Large monorepos with many phases, extensive REQUIREMENTS.md, and multi-milestone history can push `init` context payloads past what can be efficiently summarized. The 50KB JSON temp-file workaround in `output()` is a symptom.
- Scaling path: Implement selective context loading — only load phases relevant to the current operation rather than the full planning state.

**Wave parallelism creates N simultaneous `gsd-tools` processes:**
- Current capacity: Unbounded; determined by plan wave size.
- Limit: Each parallel wave agent spawns its own `gsd-tools` process; all compete for the `STATE.md.lock`. With >10 concurrent agents, lock contention increases retry latency (10 retries × 200ms = 2s max wait per agent).
- Scaling path: Batch state updates via a single `state patch` call per wave rather than one `state update` call per agent.

## Dependencies at Risk

**`c8` used only for `test:coverage` — not part of the production CLI:**
- Risk: `c8` is a devDependency with a `^11.0.0` range. Not a production risk. The 70% line coverage floor is the main enforcement mechanism; branch coverage is not checked.
- Impact: Modules like `get-shit-done/bin/lib/docs.cjs` and `get-shit-done/bin/lib/schema-detect.cjs` may have low branch coverage that `c8 --lines 70` does not surface.
- Migration plan: Add `--branches 60` flag to `test:coverage` to enforce branch coverage incrementally.

**No lockfile for devDependencies version pinning:**
- Risk: `package.json` uses `^` ranges for `c8`, `esbuild`, and `vitest`. `vitest` is listed as a devDependency but the test runner is Node's built-in `--test`; `vitest` appears to be unused in active scripts.
- Files: `package.json` (lines 41–44)
- Impact: `npm install` in CI could pick up a breaking minor version of `esbuild` (used by `build:hooks`).
- Migration plan: Run `npm install --save-exact` for devDependencies, or add `package-lock.json` to the published `files` array for reproducible CI installs.

## Missing Critical Features

**No structured error codes from `gsd-tools`:**
- Problem: All errors exit with `process.exit(1)` and a plain string message to stderr. Callers in workflow `.md` files cannot distinguish "STATE.md not found" from "field not found" from "lock timeout" without string-matching stderr.
- Blocks: Automated recovery workflows that need to branch on specific error conditions.

**No per-invocation debug logging:**
- Problem: There is no `GSD_DEBUG` or `--verbose` flag. Silent `catch {}` blocks, temp-file fallbacks, lock retries, and config migrations all happen invisibly. Diagnosing issues in CI or on user machines requires adding temporary `console.error` calls.
- Blocks: Self-serve debugging by users experiencing state corruption or unexpected tool behavior.

## Test Coverage Gaps

**`get-shit-done/bin/lib/docs.cjs` — no dedicated unit tests:**
- What's not tested: `cmdDocsScan` directory walking, file inclusion/exclusion logic, output shape.
- Files: `get-shit-done/bin/lib/docs.cjs`
- Risk: Changes to the docs-update workflow break silently; covered only by integration test in `tests/docs-update.test.cjs` which tests string presence, not correctness.
- Priority: Low (docs-update is a maintenance command, not in the critical path).

**`get-shit-done/bin/lib/schema-detect.cjs` — no dedicated unit tests:**
- What's not tested: Schema file detection heuristics, drift detection logic, edge cases with schema files in unusual locations.
- Files: `get-shit-done/bin/lib/schema-detect.cjs`
- Risk: Schema drift detection reports false positives or misses actual drift silently.
- Priority: Medium (used in `verify` which gates phase completion).

**Non-atomic write paths in `intel.cjs`, `workstream.cjs`, `learnings.cjs`:**
- What's not tested: Concurrent write behavior; all tests run single-threaded so the race condition is not exercised.
- Files: `get-shit-done/bin/lib/intel.cjs` (lines 366, 506), `get-shit-done/bin/lib/workstream.cjs` (line 154), `get-shit-done/bin/lib/learnings.cjs` (line 128)
- Risk: Data loss under parallel wave execution that targets intel or learning files.
- Priority: Medium (intel and learnings are used in multi-agent flows).

**`bin/install.js` runtime transformation logic — tested by string scanning, not unit tests:**
- What's not tested: Transformation correctness for each runtime (tool name mapping, hook event names, agent frontmatter conversion) is tested by reading the install.js source and asserting string presence (`tests/copilot-install.test.cjs`, `tests/kilo-install.test.cjs`). The actual transformation output is not exercised against a real file copy.
- Files: `bin/install.js`, `tests/copilot-install.test.cjs`, `tests/kilo-install.test.cjs`
- Risk: A refactor that changes how transformations are applied can pass string-presence tests while breaking actual installs.
- Priority: High (install correctness is user-facing; regressions cause silent misconfiguration).

**`output()` `@file:` large-payload path — no dedicated test:**
- What's not tested: The code path that writes to `gsd-<ts>.json` and returns `@file:...` when JSON exceeds 50KB.
- Files: `get-shit-done/bin/lib/core.cjs` (lines 205–212)
- Risk: A change to the threshold or path format breaks all large-project workflows without a failing test.
- Priority: Medium.

---

*Concerns audit: 2026-04-15*
