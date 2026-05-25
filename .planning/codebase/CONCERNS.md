# Codebase Concerns

**Analysis Date:** 2026-05-25

## Tech Debt

**Duplicated dotted-command parser between CJS and SDK:**
- Issue: The dotted-command-to-argv split (e.g., `state.load` → `['state', 'load']`) is implemented twice — once inline in `gsd-tools.cjs` (line 437) and once in `sdk/src/query/query-fallback-bridge-adapter.ts`. A `TODO` comment in `gsd-tools.cjs:437` acknowledges this.
- Files: `get-shit-done/bin/gsd-tools.cjs:430-449`, `sdk/src/query/query-fallback-bridge-adapter.ts`
- Impact: Divergence between the two parsers produces different routing behavior depending on whether the SDK or CJS path handles a command.
- Fix approach: Extract shared logic to a helper in `get-shit-done/bin/lib/` and require it from both call sites. The comment already identifies this as the goal.

**`scanForInjection` is exported but never called from `gsd-tools.cjs` or any router:**
- Issue: `security.cjs` exports `scanForInjection` (line 581) and the function exists with comprehensive pattern matching (lines 254–321), but no command router or CLI entrypoint calls it. `sanitizeForPrompt` is called in `commands.cjs:262` only for Brave Search queries; user-supplied text in `state patch`, `roadmap add`, `phase create` etc. is not scanned.
- Files: `get-shit-done/bin/lib/security.cjs:254`, `get-shit-done/bin/lib/commands.cjs:262`, `get-shit-done/bin/gsd-tools.cjs`
- Impact: The injection guard infrastructure exists but is not applied to the majority of user-supplied text that flows into `.planning/` files.
- Fix approach: Call `scanForInjection` in `gsd-tools.cjs` router entry for subcommands that accept free-text args (`state patch`, `state add-blocker`, `roadmap add`, `phase create`).

**`bin/install.js` is a 11,496-line monolith:**
- Issue: The installer is a single file (lines counted: 11,496) with 241 function definitions handling runtime detection, file transformation, path generation, template substitution, migration, and hook bundling. There is no test file covering `bin/install.js` directly — integration smoke tests cover it indirectly via tarball smoke (`tests/release-tarball-smoke.install.test.cjs`).
- Files: `bin/install.js`
- Impact: Any change to one runtime's install path risks breaking another. Hard to trace regressions; the smoke test surface is thin.
- Fix approach: Decompose by extracting per-runtime transformer objects and a shared file-copy pipeline into separate modules under `bin/lib/`. This is a multi-phase refactor; the existing regression tests provide a safety net.

**Generated `.cjs` files tracked in git without a `gen:command-aliases` script in root:**
- Issue: `get-shit-done/bin/lib/command-aliases.generated.cjs` (823 lines) is committed to the repo. The SDK has `gen-command-aliases.ts` in `sdk/scripts/` and a `check:alias-drift` npm script, but no `gen:command-aliases` script is listed in `sdk/package.json`. Other generated files (`secrets`, `decisions`, `phase`, etc.) each have explicit `gen:*` scripts in `sdk/package.json`.
- Files: `get-shit-done/bin/lib/command-aliases.generated.cjs`, `sdk/scripts/gen-command-aliases.ts`
- Impact: Contributors cannot regenerate command aliases without reverse-engineering the gen script invocation. Stale aliases cause silent routing failures.
- Fix approach: Add `"gen:command-aliases": "npm run build && npx tsx scripts/gen-command-aliases.ts"` to `sdk/package.json` scripts alongside the other `gen:*` entries.

**API key file detection duplicated across modules:**
- Issue: The pattern of probing `~/.gsd/brave_api_key`, `~/.gsd/firecrawl_api_key`, and `~/.gsd/exa_api_key` via `fs.existsSync` is duplicated in both `init.cjs:463-472` and `config.cjs:129-134`.
- Files: `get-shit-done/bin/lib/init.cjs:463-472`, `get-shit-done/bin/lib/config.cjs:129-134`
- Impact: Adding a new optional API key integration requires updating two places. One being missed creates inconsistent feature detection between `init` and `config` subcommands.
- Fix approach: Extract a `detectOptionalApiKeys(homedir)` helper into `core.cjs` or a new `api-key-detection.cjs` and call it from both modules.

## Known Bugs

**Lock acquisition for transient filesystem errors is an unbounded tight loop:**
- Symptoms: When `fs.openSync` throws an errno in `ACQUIRE_LOCK_RETRY_ERRNOS` (`EPERM`, `EBUSY`, `EAGAIN`, `EINTR`, `EINVAL`, `EIO`, `ENOENT`, `ESTALE`), the catch block hits `continue` immediately — no sleep and no `maxWaitMs` check. On Docker overlay-fs or NFS with a persistent transient error, this spins the CPU until the process is killed.
- Files: `get-shit-done/bin/lib/state.cjs:972-976`
- Trigger: Persistent `EINVAL`/`EIO`/`ENOENT` from a Docker overlay-fs or NFS mount where the `.planning/` directory lives.
- Workaround: None at runtime. Move `.planning/` to a local filesystem.
- Fix approach: Insert `if (Date.now() - startedAt >= maxWaitMs) throw ...` and a short `Atomics.wait(...)` before `continue` in the `ACQUIRE_LOCK_RETRY_ERRNOS` branch, matching the pattern already used in the `EEXIST` branch (lines 988–995).

**Lock files are not cleaned up on SIGINT/SIGTERM:**
- Symptoms: If a user Ctrl-C's an agent mid-write, `STATE.md.lock` is left on disk. The stale-lock removal in `acquireStateLock` (10-second threshold) handles the next caller, but the 10-second window blocks parallel agents.
- Files: `get-shit-done/bin/lib/state.cjs:35-38`, `get-shit-done/bin/lib/planning-workspace.cjs:37`
- Trigger: Ctrl-C during any STATE.md write operation.
- Workaround: Delete `.planning/STATE.md.lock` manually if parallel agents stall.
- Fix approach: Register `process.on('SIGINT')` and `process.on('SIGTERM')` handlers in `state.cjs` alongside the existing `process.on('exit')` handler at line 35, the same way `install-profiles.cjs:286-295` handles `CLEANUP_SIGNALS` for staged skills.

## Security Considerations

**Prompt injection guard infrastructure exists but is not applied at the CLI boundary:**
- Risk: User-supplied free-text arguments (blockers, phase titles, roadmap entries, config values) flow from CLI args into `.planning/` Markdown files without injection scanning. An agent that later reads these files and processes them as instructions is exposed to indirect prompt injection.
- Files: `get-shit-done/bin/lib/security.cjs:254-321` (scanner), `get-shit-done/bin/gsd-tools.cjs` (router — no scan call)
- Current mitigation: `sanitizeForPrompt` is called for Brave Search query text (`commands.cjs:262`). `validatePath` and `requireSafePath` are applied to file path arguments. The injection patterns themselves are comprehensive (Unicode tag block detection, `<system>` tag stripping, etc.).
- Recommendations: Wire `scanForInjection` at the gsd-tools router for free-text subcommand arguments. At minimum apply it to `state add-blocker`, `state patch`, `phase create --title`, and `roadmap add` text inputs.

**API keys stored as plaintext files in `~/.gsd/`:**
- Risk: `~/.gsd/brave_api_key`, `~/.gsd/firecrawl_api_key`, and `~/.gsd/exa_api_key` are plaintext files on disk. If the home directory is world-readable (common misconfiguration) or backed up without access controls, keys are exposed.
- Files: `get-shit-done/bin/lib/init.cjs:463-472`, `get-shit-done/bin/lib/config.cjs:129-134`
- Current mitigation: `secrets.cjs` module correctly masks secret values in output (`maskSecret`, `maskIfSecret`). Key presence is detected by `fs.existsSync` only — contents are not logged.
- Recommendations: Document `chmod 600 ~/.gsd/*_api_key` in setup guidance. Consider preferring environment variables as primary source (already supported) with the file as fallback, and emit a one-time warning if a key file has world-readable permissions.

## Performance Bottlenecks

**`_diskScanCache` in `state.cjs` has no eviction policy:**
- Problem: `_diskScanCache` is a module-level `Map` that grows without bound over the lifetime of a process. For long-running SDK processes (e.g., multi-phase wave execution) that touch many different `cwd` values, the cache accumulates all previously computed disk scan results.
- Files: `get-shit-done/bin/lib/state.cjs:24`, `state.cjs:807-856`
- Cause: The cache is only invalidated on explicit write (`_diskScanCache.delete(cwd)` at line 1015). No TTL, no max-size, no LRU.
- Improvement path: Add a max-size eviction (e.g., keep only the 20 most-recently-used entries) or a TTL of ~5 seconds. The cache is already correctly invalidated on write; the only gap is unbounded growth across `cwd` keys.

**`Atomics.wait` busy-polling in three synchronous lock paths:**
- Problem: `state.cjs` (line 995), `planning-workspace.cjs` (lines 283, 297), and `installer-migrations.cjs` (lines 222-223) all use `Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)` as a synchronous sleep. Allocating a new `SharedArrayBuffer` and `Int32Array` on every retry iteration is wasteful.
- Files: `get-shit-done/bin/lib/state.cjs:994-995`, `get-shit-done/bin/lib/planning-workspace.cjs:283`, `get-shit-done/bin/lib/installer-migrations.cjs:222-223`
- Cause: Node.js has no synchronous `sleep()` without `Atomics.wait` in the main thread. The per-iteration allocation is the concern.
- Improvement path: Hoist the `SharedArrayBuffer` and `Int32Array` to module-level constants so they are allocated once per process, not once per retry.

## Fragile Areas

**`init.cjs` (2,096 lines) — project context assembly:**
- Files: `get-shit-done/bin/lib/init.cjs`
- Why fragile: This is the largest lib module. It assembles the JSON context blob that every workflow reads at startup. It contains multiple regex-based Markdown parsers for ROADMAP.md, STATE.md, and phase plans. Regex-based Markdown parsing is brittle against edge cases (nested headings, Windows line endings, YAML frontmatter with unusual values).
- Safe modification: Always run `npm test` after any change to `init.cjs`. The `tests/init.test.cjs` covers core paths. Regression tests `bug-1736`, `bug-2388`, `bug-2638`, `bug-3096` guard previously broken paths.
- Test coverage: `tests/init.test.cjs` exists; integration coverage via `tests/init-manager.test.cjs`. The regex parsers lack adversarial fuzz tests.

**`state.cjs` (1,981 lines) — single point of failure for STATE.md writes:**
- Files: `get-shit-done/bin/lib/state.cjs`
- Why fragile: All STATE.md writes flow through `writeStateMd`. The read-modify-write cycle inside `withStateLock` (lines 1017-1043) is non-atomic at the application level — the lock is advisory. A process that reads outside the lock and then writes inside it can still produce stale-read overwrites.
- Safe modification: Any change to `writeStateMd`, `syncStateFrontmatter`, or `buildStateFrontmatter` requires verifying the concurrency tests: `tests/concurrency-safety.test.cjs`, `tests/locking-bugs-1909-1916-1925-1927.test.cjs`.
- Test coverage: Locking tests exist and are comprehensive; the main gap is an adversarial concurrent-write test under Docker overlay-fs conditions.

**`core.cjs` silent `catch {}` blocks (251 total across lib):**
- Files: `get-shit-done/bin/lib/core.cjs` (multiple), `get-shit-done/bin/lib/audit.cjs` (highest density — 30+ blocks)
- Why fragile: Silent catch blocks swallow errors without logging. When a file operation fails silently (e.g., `try { platformWriteSync(...) } catch {}`), the caller receives no indication of failure and continues with stale state.
- Safe modification: Before adding new `catch {}` blocks, consider whether a `process.stderr.write('[gsd] warning: ...')` is appropriate. The pattern is intentional for non-critical paths (lock cleanup, cache invalidation) but over-applied in audit scanning.
- Test coverage: The error paths are largely untested; `tests/feat-3595-fs-fault-injection-atomic-write.test.cjs` covers atomic write failures but not broader silent-catch scenarios.

## Scaling Limits

**Wave execution parallelism is limited by file-based locking:**
- Current capacity: `STATE.md` is locked per-write with a 200ms retry and 30-second timeout. Parallel agents writing to `STATE.md` during a wave serialize at the lock.
- Limit: Beyond ~10 parallel agents writing at similar intervals, the 30-second `maxWaitMs` budget in `acquireStateLock` may be exceeded, causing a thrown error that aborts the agent.
- Scaling path: No architectural change is planned. The lock timeout is configurable at code level in `state.cjs:958-959`. Increasing `maxWaitMs` is a safe stop-gap.

## Dependencies at Risk

**`@anthropic-ai/claude-agent-sdk` at `^0.2.84` — semver minor is pinned too loosely:**
- Risk: The `^` range allows any `0.x.y` patch/minor update. The SDK is the sole runtime dependency and its `query()` API is what `sdk/src/session-runner.ts` wraps. A breaking change in a `0.x` release (pre-1.0 semver stability) would silently update on `npm install`.
- Impact: Breakage in `sdk/src/session-runner.ts:8` and all downstream SDK paths without a lockfile violation.
- Migration plan: Pin to an exact version `"0.2.84"` or add a `overrides` lockfile check. The `package-lock.json` (lockfileVersion 3) mitigates this for exact-install scenarios but not for fresh `npm install` without the lock.

## Missing Critical Features

**No TypeScript coverage thresholds for the SDK layer:**
- Problem: `npm run test:coverage` enforces ≥70% line coverage only over `get-shit-done/bin/lib/*.cjs`. The SDK in `sdk/src/` has no coverage threshold configured in `sdk/vitest.config.ts` or `sdk/package.json`.
- Blocks: Silent coverage regressions in `sdk/src/session-runner.ts`, `sdk/src/phase-runner.ts`, and `sdk/src/query/` as new features are added.

## Test Coverage Gaps

**21 lib modules have no dedicated test file:**
- What's not tested: `artifacts.cjs`, `audit.cjs`, `cjs-command-router-adapter.cjs`, `cjs-sdk-bridge.cjs`, `clusters.cjs`, `decisions.cjs`, `docs.cjs`, `drift.cjs`, `fallow-runner.cjs`, `gap-checker.cjs`, `model-catalog.cjs`, `plan-scan.cjs`, `review-reviewer-selection.cjs`, `runtime-homes.cjs`, `runtime-name-policy.cjs`, `runtime-slash.cjs`, `schema-detect.cjs`, `secrets.cjs`, `shell-command-projection.cjs`, `surface.cjs`, `validate-command-router.cjs`
- Files: `get-shit-done/bin/lib/audit.cjs`, `get-shit-done/bin/lib/drift.cjs`, `get-shit-done/bin/lib/shell-command-projection.cjs`, etc.
- Risk: Changes to these modules produce no immediate test signal. `audit.cjs` and `shell-command-projection.cjs` are high-traffic — `audit.cjs` is called by the `gsd-audit-open` workflow; `shell-command-projection.cjs` wraps all git subprocess calls.
- Priority: High for `audit.cjs` and `shell-command-projection.cjs`; Medium for the rest.

**`fallow-audit.ts` SDK normalization function has no TS test:**
- What's not tested: `normalizeFallowReport()` in `sdk/src/query/fallow-audit.ts` has no TypeScript-level unit test. The `TODO(parity)` comment at line 41 acknowledges this; CJS-side coverage exists in `tests/feat-3210-fallow-integration.test.cjs`.
- Files: `sdk/src/query/fallow-audit.ts:41-44`
- Risk: TypeScript refactors or type changes in `FallowReport` can break normalization silently at the SDK level.
- Priority: Medium.

**`bin/install.js` has no direct unit tests:**
- What's not tested: The 11,496-line installer has no `tests/install.js.test.cjs`. Coverage flows only through smoke tests (`tests/release-tarball-smoke.install.test.cjs`, `tests/install.test.cjs` which tests runtime artifact layout, not the installer logic directly).
- Files: `bin/install.js`
- Risk: Runtime-specific transformation bugs (wrong tool name mapping, missing hook event translation, path prefix errors) are caught only if they produce a broken install rather than a subtly wrong one.
- Priority: High.

---

*Concerns audit: 2026-05-25*
