# SDK Capability Documentation — Restoration Grade

**Package:** `@opengsd/gsd-sdk` v1.1.0
**Source tree:** `sdk/src/` (approximately 182 non-test TypeScript modules)
**Restoration purpose:** This document is the sole surviving record of what the fork's `sdk/` did. The merge in Phase 69 deletes `sdk/` (~305 files). A future SDKR-01 milestone must be able to rebuild the feature without the original source, using only this document. This doc satisfies SDK-01 and gates SDK-02 (Phase 69 may not accept the `sdk/` deletion until this document exists and is committed).

**External runtime dependencies:**
- `@anthropic-ai/claude-agent-sdk` ^0.2.84 — provides `query()`, the agentic turn loop; `SDKMessage`, `SDKResultMessage`, `SDKResultSuccess`, `SDKResultError` types
- `ws` 8.20.1 — provides `WebSocketServer` and `WebSocket` for the real-time event broadcast transport

**Node builtins used across the SDK:** `node:fs`, `node:fs/promises`, `node:path`, `node:os`, `node:url`, `node:worker_threads`, `node:net`

---

## Named Modules (Restoration-Grade)

### session-runner.ts

**Purpose:** Orchestrates `@anthropic-ai/claude-agent-sdk`'s `query()` function for plan execution. Takes a parsed plan structure or a raw prompt string, builds the executor system-prompt append, configures query options (tools, budget, turns, model, cwd), iterates the message stream, emits GSD events via `GSDEventStream`, and returns a typed `PlanResult`. This is the lowest-level execution bridge between GSD's plan model and the upstream Agent SDK.

**Public surface — exports:**

| Export | Signature | Description |
|--------|-----------|-------------|
| `runPlanSession` | `async (plan: ParsedPlan, config: GSDConfig, options?: SessionOptions, agentDef?: string, eventStream?: GSDEventStream, streamContext?: EventStreamContext, phaseDir?: string): Promise<PlanResult>` | Run a single plan via `query()`. Builds executor prompt from `plan`, resolves model from `options`/`config`, calls `query()` with `bypassPermissions`, streams results, returns `PlanResult`. |
| `runPhaseStepSession` | `async (prompt: string, phaseStep: PhaseStepType, config: GSDConfig, options?: SessionOptions, eventStream?: GSDEventStream, streamContext?: EventStreamContext): Promise<PlanResult>` | Run a raw-prompt phase step session. Tools are scoped by `phaseStep` type via `getToolsForPhase()`. |

**Private helpers (not exported, document for rebuild):**
- `resolveModel(options, config)` — model resolution priority: explicit `options.model` > `config.resolve_model_ids === 'omit'` (returns undefined) > non-Claude runtime (returns undefined) > `config.model_profile` mapped through `resolveRuntimeTierDefault()`. Profile aliases: `quality`→`opus`, `budget`/`speed`→`haiku`, `balanced`/`adaptive`→`sonnet`, `inherit`→undefined.
- `processQueryStream(queryStream, eventStream, streamContext)` — shared stream consumer. Iterates `AsyncIterable<SDKMessage>`, calls `eventStream.mapAndEmit()` on each message, captures the `SDKResultMessage`, calls `extractResult()`, emits a `GSDCostUpdateEvent`. Returns `PlanResult`. On stream error returns error `PlanResult` without throwing.
- `extractResult(msg)` — maps `SDKResultMessage` to `PlanResult`; success/error branches from `msg.subtype`.
- `extractUsage(msg)` — maps SDK `usage` fields to `SessionUsage` camelCase shape.

**Runtime behavior:**
1. `buildExecutorPrompt(plan, { agentDef, phaseDir })` constructs the system-prompt append.
2. `allowedTools` is resolved from `options.allowedTools` → `parseAgentTools(agentDef)` → `DEFAULT_ALLOWED_TOOLS`.
3. `query()` is called with `systemPrompt.type = 'preset'`, `preset = 'claude_code'`, `settingSources = ['project']`, `permissionMode = 'bypassPermissions'`, `allowDangerouslySkipPermissions = true`, default `maxTurns = 50`, default `maxBudgetUsd = 5.0`.
4. All SDK messages flow through `eventStream.mapAndEmit()` for observability.
5. A final `CostUpdate` event is emitted after session completion.

**Integration points:**
- Imports: `@anthropic-ai/claude-agent-sdk` (`query`), `./types.js` (`ParsedPlan`, `PlanResult`, `SessionOptions`, `GSDEventType`, `PhaseStepType`), `./config.js` (`GSDConfig`), `./prompt-builder.js`, `./event-stream.js`, `./tool-scoping.js`, `./query/helpers.js` (`detectRuntime`), `./model-catalog.js` (`resolveRuntimeTierDefault`)
- Consumed by: `index.ts` (GSD class `executePlan()` and `runPhase()`), `phase-runner.ts` (step execution), re-exported from `index.ts`

**External dependencies:** `@anthropic-ai/claude-agent-sdk`

---

### config.ts

**Purpose:** Loads `.planning/config.json`, normalizes legacy key shapes, and merges with canonical defaults. Provides the `GSDConfig` interface (the typed config contract) and the `loadConfig()` async function consumed by all session runners and the GSD class. Delegates deep-merge logic to `sdk/src/config/index.ts` (the Configuration Module, ADR-3524).

**Public surface — exports:**

| Export | Signature | Description |
|--------|-----------|-------------|
| `GSDConfig` (interface) | See fields below | Typed config contract |
| `GitConfig` (interface) | `{ branching_strategy, phase_branch_template, milestone_branch_template, quick_branch_template }` | Git sub-section |
| `WorkflowConfig` (interface) | See fields below | Workflow sub-section |
| `HooksConfig` (interface) | `{ context_warnings: boolean }` | Hooks sub-section |
| `CONFIG_DEFAULTS` | `GSDConfig` | Canonical defaults from `config/index.ts`; cast to GSDConfig |
| `loadConfig` | `async (projectDir: string, workstream?: string): Promise<GSDConfig>` | Load and merge project config |

**GSDConfig fields (non-exhaustive — uses `[key: string]: unknown` index):**
- `model_profile: string` — `'balanced'` (default), `'quality'`, `'budget'`, `'speed'`, `'adaptive'`, `'inherit'`
- `commit_docs: boolean`
- `parallelization: boolean`
- `search_gitignored: boolean`
- `brave_search: boolean`, `firecrawl: boolean`, `exa_search: boolean`
- `git: GitConfig`
- `workflow: WorkflowConfig`
- `hooks: HooksConfig`
- `agent_skills: Record<string, unknown>`
- `project_code?: string | null`
- `mode?: string`

**WorkflowConfig fields:**
`research`, `plan_check`, `verifier`, `nyquist_validation`, `tdd_mode` (all boolean), `human_verify_mode: 'mid-flight' | 'end-of-phase'`, `auto_advance`, `_auto_chain_active?`, `node_repair`, `node_repair_budget`, `ui_phase`, `ui_safety_gate`, `text_mode`, `research_before_questions` (booleans), `discuss_mode: string`, `skip_discuss: boolean`, `max_discuss_passes: number`, `subagent_timeout: number`, `context_coverage_gate: boolean`, `use_worktrees?: boolean | string`

**Runtime behavior of `loadConfig(projectDir, workstream?)`:**
1. Resolves config path via `relPlanningPath(workstream)` — supports per-workstream configs at `.planning/workstreams/<name>/config.json`, falling back to `.planning/config.json`.
2. If config file missing or empty: returns `mergeDefaults({})` (built-in defaults only).
3. On malformed JSON: throws `Error` with path + parse error message.
4. Calls `normalizeLegacyKeys(parsed)` to migrate `branching_strategy` (top-level) → `git.branching_strategy` before merging.
5. Calls `canonicalMergeDefaults(normalized)` — recursive deep-merge; partial nested objects preserve sibling defaults (fixed regression from old shallow per-section spread).

**Integration points:**
- Imports: `node:fs/promises`, `node:path`, `./workstream-utils.js`, `./config/index.js` (`CONFIG_DEFAULTS`, `mergeDefaults`, `normalizeLegacyKeys`)
- Consumed by: `index.ts` (GSD class), `session-runner.ts`, `phase-runner.ts`, and all query handlers that need config state
- Re-exported from `index.ts` as `loadConfig` and `GSDConfig`

**External dependencies:** Node builtins only (`node:fs/promises`, `node:path`)

---

### model-catalog.ts

**Purpose:** Loads the static `shared/model-catalog.json` at module-init time and exposes model resolution utilities. Provides the runtime-tier lookup table (Claude/Codex/Gemini per-tier model IDs + reasoning efforts), per-agent profile slots, the `parseModelEffort()` `model;effort` slot splitter, and the `runtimesWithReasoningEffort()` allowlist. Acts as the single source of truth for model identity in the SDK layer; mirrors `get-shit-done/bin/lib/core.cjs` for CJS parity.

**Public surface — exports:**

| Export | Signature | Description |
|--------|-----------|-------------|
| `catalog` | `ModelCatalog` (const) | Raw JSON catalog loaded from `../shared/model-catalog.json` at import time |
| `VALID_PROFILES` | `string[]` | Profile names from `catalog.profiles` |
| `SUPPORTED_RUNTIMES` | `string[]` | Runtime keys from `catalog.runtimeTierDefaults` |
| `MODEL_PROFILES` | `Record<string, Record<string, string>>` | Per-agent map: `{ [agent]: { quality, balanced, budget, adaptive } }` |
| `AGENT_TO_PHASE_TYPE` | `Record<string, string>` | Maps agent names to their default phase type |
| `AGENT_DEFAULT_TIERS` | `Record<string, string>` | Maps agent names to routing tier (`light`/`standard`/`heavy`) |
| `EFFORT_TOKENS` | `Set<string>` | Valid effort tokens: `{'low', 'medium', 'high', 'xhigh', 'max'}` — MUST stay in sync with CJS core.cjs |
| `getAgentToModelMapForProfile` | `(normalizedProfile: string): Record<string, string>` | Returns per-agent model map for a normalized profile name; falls back to `'balanced'` for unknown profiles |
| `resolveRuntimeTierDefault` | `(runtime: string, alias: 'opus' \| 'sonnet' \| 'haiku'): RuntimeTierEntry \| null` | Looks up `{ model, reasoning_effort? }` for a runtime+tier pair |
| `runtimesWithReasoningEffort` | `(): Set<string>` | Static allowlist `{'claude', 'codex'}` — NOT derived from catalog data (Pitfall D-07) |
| `parseModelEffort` | `(label: string): { model: string \| unknown; effort: string \| null }` | Splits `model;effort` on last `;`. Validates suffix against `EFFORT_TOKENS`. Trailing `;` strips silently (WR-04). Unknown suffix: one-time stderr warning, returns `effort: null`. Non-string passthrough. |
| `_resetEffortWarningCacheForTests` | `(): void` | Test-only: resets internal `_warnedEffortLabels` set |
| `Runtime` | `type` (derived) | Union of `SUPPORTED_RUNTIMES` values |

**Runtime behavior of `parseModelEffort(label)`:**
1. Non-string input: passthrough `{ model: label, effort: null }`.
2. No `;` found: `{ model: label, effort: null }`.
3. Splits on `lastIndexOf(';')` (not first) — provider IDs with `:` are safe.
4. Empty suffix after `;`: returns `{ model: base, effort: null }` (editing artifact).
5. Suffix in `EFFORT_TOKENS`: returns `{ model: base, effort: suffix }`.
6. Unknown suffix: writes one-time stderr warning (WR-01 — message string-identical to CJS); returns `{ model: base, effort: null }`.

**Integration points:**
- Imports: `node:fs` (sync read at module load), `node:url` (`fileURLToPath`)
- Consumed by: `session-runner.ts` (`resolveRuntimeTierDefault` in `resolveModel()`), `query/config-query.ts` (profile resolution), all model-related query handlers
- Parity constraint: `EFFORT_TOKENS` MUST stay identical to CJS `core.cjs` (IN-02); `runtimesWithReasoningEffort()` return value MUST stay identical (D-07)

**External dependencies:** `node:fs`, `node:url`

---

### ws-transport.ts

**Purpose:** Implements the `TransportHandler` interface for broadcasting GSD events over WebSocket. Starts a `WebSocketServer` on a configured port and JSON-serializes each `GSDEvent` to all currently-connected clients. Provides the real-time observability channel for external dashboards and tooling consuming GSD execution events.

**Public surface — exports:**

| Export | Signature | Description |
|--------|-----------|-------------|
| `WSTransportOptions` (interface) | `{ port: number }` | Constructor options |
| `WSTransport` (class) | Implements `TransportHandler` | WebSocket event broadcaster |

**WSTransport class methods:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `constructor` | `(options: WSTransportOptions)` | Stores port; server starts null |
| `start` | `async (): Promise<void>` | Creates `WebSocketServer({ port })`, returns Promise that resolves on `'listening'` event, rejects on `'error'`. No-op if `this.closing` is true. |
| `onEvent` | `(event: GSDEvent): void` | JSON-serializes event; iterates `server.clients`; sends to each `WebSocket.OPEN` client. Never throws (try/catch at both serialization and per-client levels). |
| `close` | `(): void` | Sets `this.closing = true`; terminates all clients; closes server; sets `this.server = null`. Safe to call before `start()`. |

**Runtime behavior:**
1. `start()` must be called before `onEvent()` will send anything (server is null until then).
2. `onEvent()` silently ignores clients not in `OPEN` state and swallows per-client send errors.
3. `close()` calls `client.terminate()` (hard close) not `client.close()` (graceful), then `server.close()`.
4. The `closing` flag prevents `start()` from creating a new server after `close()` has been called.

**Integration points:**
- Imports: `ws` (`WebSocketServer`, `WebSocket`), `./types.js` (`GSDEvent`, `TransportHandler`)
- Consumed by: `index.ts` (re-exported for consumer use), `cli.ts` (CLI entry point creates WSTransport on `--ws-port` flag), `GSD.addTransport()` accepts it as a `TransportHandler`
- Transport contract: `TransportHandler.onEvent` must never throw; `close()` must be safe before `start()`.

**External dependencies:** `ws` 8.20.1

---

## Supporting Modules

The `sdk/src/` tree contains approximately 182 non-test TypeScript modules beyond the four named above. This section enumerates every subdirectory as a subsystem with its responsibility, key entry points, and integration relationships. A future SDKR-01 restorer can use this as a rebuild roadmap.

### Top-level `sdk/src/*.ts` (non-named modules)

**`index.ts`** — Public package entry point. Exports the `GSD` class (the primary user-facing API), all named module exports, all types from `types.ts`, and re-exports from subsystems. The `GSD` class composes `loadConfig`, `parsePlanFile`, `runPlanSession`, `PhaseRunner`, `ContextEngine`, `PromptFactory`, and `GSDTools` into `executePlan()`, `runPhase()`, and `run()` (milestone loop).

**`types.ts`** — All shared TypeScript interfaces and enums. Key types: `ParsedPlan`, `PlanResult`, `SessionOptions`, `GSDOptions`, `GSDConfig`, `GSDEvent` (discriminated union of ~30 event shapes), `TransportHandler`, `PhaseType` (enum), `GSDEventType` (enum, ~30 values), `PhaseStepType` (enum), `PhaseRunnerOptions`, `PhaseRunnerResult`, `MilestoneRunnerOptions`, `MilestoneRunnerResult`, `PhasePlanIndex`, `InitConfig`, `InitResult`, `PlanFrontmatter`, `PlanTask`, `CostTracker`, `HumanGateCallbacks`.

**`plan-parser.ts`** — Parses GSD PLAN.md files from disk. Entry: `parsePlanFile(absolutePath): Promise<ParsedPlan>`, `parsePlan(raw: string): ParsedPlan`. Extracts YAML frontmatter, `<objective>`, `<execution_context>`, context refs, and `<tasks>` XML blocks into the `ParsedPlan` shape.

**`prompt-builder.ts`** — Builds the system-prompt append injected into `query()`. Exports: `buildExecutorPrompt(plan, options): string`, `parseAgentTools(agentDef): string[]`, `DEFAULT_ALLOWED_TOOLS: string[]`. Reads agent definition files to extract tool restrictions.

**`event-stream.ts`** — `GSDEventStream` class: Node.js `EventEmitter` subclass. Holds a `CostTracker`, list of `TransportHandler`s, and maps raw `SDKMessage` variants to typed `GSDEvent`s via `mapAndEmit()`. Exports: `GSDEventStream`, `EventStreamContext` (interface with `phase?`, `planName?`).

**`phase-runner.ts`** — `PhaseRunner` class: implements the full phase lifecycle state machine (discuss → research → plan → plan_check → execute → verify → advance). Dependencies injected via `PhaseRunnerDeps`. Exports: `PhaseRunner`, `PhaseRunnerError`, `PhaseRunnerDeps` (interface), `VerificationOutcome`.

**`phase-prompt.ts`** — `PromptFactory` class: builds raw prompt strings for each phase step by reading workflow/agent markdown files from disk. Exports: `PromptFactory`, `extractBlock`, `extractSteps`, `PHASE_WORKFLOW_MAP`.

**`context-engine.ts`** — `ContextEngine` class: resolves and loads context files (STATE.md, ROADMAP.md, CONTEXT.md, REQUIREMENTS.md, config.json, plan, summary) into structured `ContextFiles`. Exports: `ContextEngine`, `PHASE_FILE_MANIFEST`, `FileSpec`.

**`context-truncation.ts`** — Markdown truncation for large context files. Exports: `truncateMarkdown`, `extractCurrentMilestone`, `DEFAULT_TRUNCATION_OPTIONS`, `TruncationOptions`.

**`gsd-tools.ts`** — `GSDTools` class: provides strongly-typed wrappers over `gsd-tools.cjs` CLI calls, routing through the runtime bridge (native SDK handlers or subprocess fallback). The primary mechanism by which agents call `gsd-sdk query` commands. Exports: `GSDTools`, `GSDToolsError`, `resolveGsdToolsPath`.

**`gsd-transport.ts`** — Transport bridge between `GSDTools` and the event stream; wraps CLI output into `GSDEvent` emissions.

**`gsd-transport-policy.ts`** — Policy layer over `gsd-transport.ts`; selects transport path (native SDK vs subprocess) based on config and capability.

**`init-runner.ts`** — `InitRunner` class: orchestrates the multi-step `/gsd-new-project` workflow (setup, config, project, research-stack, research-features, research-architecture, research-pitfalls, synthesis, requirements, roadmap) as SDK sessions. Exports: `InitRunner`, `InitRunnerDeps`.

**`cli.ts`** — CLI entry point (`gsd-sdk` binary). Parses argv, creates `GSDTools` or `GSD` instance, routes to `query` subcommand dispatch, `execute`, `run`, etc. Creates `WSTransport` on `--ws-port`.

**`cli-transport.ts`** — `CLITransport` class: implements `TransportHandler`. Formats and writes GSD events to stdout for the CLI. Exported from `index.ts`.

**`logger.ts`** — `GSDLogger` class: structured logger with level filtering. Exports: `GSDLogger`, `LogLevel`, `LogEntry`, `GSDLoggerOptions`.

**`tool-scoping.ts`** — Maps `PhaseType` to allowed tool lists. Exports: `getToolsForPhase(phase): string[]`, `PHASE_AGENT_MAP`, `PHASE_DEFAULT_TOOLS`.

**`research-gate.ts`** — Checks whether the research step is required before planning. Exports: `checkResearchGate(tools, config): Promise<ResearchGateResult>`, `ResearchGateResult`.

**`planning-journal.ts`** — `PlanningJournal` class: appends structured planning events to a journal file in `.planning/`. Exports: `PlanningJournal`, `PlanningEvent`, `PlanningEventActor`, `PlanningJournalAppendInput`.

**`planning-runtime.ts`** — `PlanningRuntime` class: thin wrapper combining `GSDTools` + `GSDEventStream` for programmatic invocation patterns. Exported from `index.ts`.

**`errors.ts`** — Legacy error exports (re-exports from `errors/index.ts`).

**`gsd-tools-error.ts`** — `GSDToolsError` class (base error for GSD Tools operations).

**`prompt-sanitizer.ts`** — Sanitizes prompt content before injection into query.

**`runtime-gate.ts`** — Runtime environment validation gate.

**`sdk-package-compatibility.ts`** — Compatibility shim for `@anthropic-ai/claude-agent-sdk` version variance.

**`workstream-utils.ts`** — Workstream path resolution. Exports: `validateWorkstreamName(name): void`, `relPlanningPath(workstream?): string`.

**`workstream-name-policy.ts`** — Name validation rules for workstreams.

**`query-command-executor.ts`**, **`query-execution-policy.ts`**, **`query-failure-classification.ts`**, **`query-gsd-tools-path.ts`**, **`query-gsd-tools-runtime.ts`**, **`query-hotpath-methods.ts`**, **`query-native-direct-adapter.ts`**, **`query-native-hotpath-adapter.ts`**, **`query-raw-output-projection.ts`**, **`query-runtime-bridge.ts`**, **`query-subprocess-adapter.ts`**, **`query-tools-error-factory.ts`** — Supporting infrastructure for the query runtime bridge. These modules form the dispatch/adapter layer: policy selection (native SDK path vs subprocess fallback), hot-path native adapters for high-frequency commands, raw output projection, failure classification, and error factory. All are consumed by `gsd-tools.ts`.

---

### `sdk/src/query/` (the command registry/dispatch subsystem — largest subdir, ~112 modules)

**Responsibility:** The complete native-SDK implementation of every `gsd-sdk query <command>` command. Mirrors the `gsd-tools.cjs` CLI surface with TypeScript native handlers. The registry/manifest/dispatch pipeline replaces subprocess calls for high-frequency query commands when running inside the Claude runtime, providing zero-fork overhead.

**Key entry points:**
- **`registry.ts`** — `QueryRegistry` class: the central command registry. Stores command definitions, resolves aliases, dispatches commands.
- **`registry-assembly.ts`** — Assembles the full registry from domain manifests; calls all `command-manifest.*.ts` loaders.
- **`command-manifest.ts`** — Top-level manifest aggregator. Imports from `command-manifest.state.ts`, `command-manifest.roadmap.ts`, `command-manifest.phase.ts`, `command-manifest.phases.ts`, `command-manifest.init.ts`, `command-manifest.validate.ts`, `command-manifest.verify.ts`, `command-manifest.non-family.ts`.
- **`query/index.ts`** — Exports `createRegistry()` and `normalizeQueryCommand()` — the two public entry points re-exported from `index.ts`.
- **`command-definition.ts`** — `CommandDefinition` interface: shape of a registered command (name, aliases, handler, schema, description, etc.).
- **`query-dispatch.ts`** — Core dispatch logic: resolves command, validates args, invokes handler, formats output.

**Domain command modules:** Each `query/*.ts` file implements one or more `gsd-sdk query` commands natively:
- `state.ts`, `state-mutation.ts`, `state-project-load.ts` — STATE.md read/write operations
- `roadmap.ts`, `roadmap-update-plan-progress.ts` — ROADMAP.md queries and updates
- `phase.ts`, `phase-lifecycle.ts`, `phase-lifecycle-policy.ts`, `phase-filesystem-adapter.ts`, `phase-list-queries.ts`, `phase-ready.ts`, `phase-roadmap-mutation.ts` — phase directory operations
- `init.ts`, `init-complex.ts` — `/gsd-new-project` init context loading
- `config-query.ts`, `config-mutation.ts`, `config-gates.ts`, `config-schema.ts` — config.json CRUD
- `commit.ts` — git commit operations with `commit_docs` gating
- `frontmatter.ts`, `frontmatter-mutation.ts` — YAML frontmatter CRUD
- `validate.ts`, `verify.ts` — plan and phase validation
- `template.ts` — template fill operations
- `summary.ts` — SUMMARY.md operations
- `workstream.ts`, `workstream-inventory.ts`, `active-workstream-store.ts` — workstream routing
- `worktree.ts` — git worktree operations
- `profile.ts`, `profile-extract-messages.ts`, `profile-output.ts`, `profile-questionnaire-data.ts`, `profile-sample.ts`, `profile-scan-sessions.ts` — developer profile generation
- `mvp.ts` — MVP+TDD gate operations
- `uat.ts`, `phase-uat-passed.ts` — UAT pass/fail state
- `decisions.ts`, `check-decision-coverage.ts` — context decision coverage
- `skills.ts`, `skill-manifest.ts` — project skills registry
- `intel.ts`, `websearch.ts` — research/web search integration
- `secrets.ts` — environment secret detection
- `progress.ts` — progress reporting
- `check-gates.ts`, `check-auto-mode.ts`, `check-completion.ts`, `check-ship-ready.ts`, `check-verification-status.ts` — workflow gate checks
- `audit-open.ts`, `fallow-audit.ts` — audit/fallow state
- `route-next-action.ts` — next-action routing
- `plan-scan.ts`, `plan-task-structure.ts` — plan file scanning
- `prompt-budget.ts` — prompt token budget
- `docs-init.ts` — docs initialization
- `detect-phase-type.ts`, `detect-custom-files.ts` — phase type and custom file detection
- `schema-detect.ts` — schema detection
- `workspace.ts` — workspace operations
- `requirements-extract-from-plans.ts` — requirements traceability
- `commands-list.ts`, `command-catalog.ts`, `command-topology.ts`, `command-aliases.generated.ts` — registry introspection
- `helpers.ts` — shared utilities including `detectRuntime()` (reads `GSD_RUNTIME` env, `config.runtime` field, defaults to `'claude'`)
- `utils.ts` — shared low-level utilities
- `pipeline.ts` — query pipeline middleware
- Observability/error: `query-dispatch-contract.ts`, `query-dispatch-error-mapper.ts`, `query-dispatch-formatting.ts`, `query-dispatch-observability.ts`, `query-error-details-schema.ts`, `query-error-taxonomy.ts`, `query-command-diagnosis.ts`, `query-command-resolution-strategy.ts`, `query-command-semantics.ts`, `query-fallback-bridge-adapter.ts`, `query-fallback-executor.ts`, `query-fallback-output-classifier.ts`, `query-fallback-policy.ts`, `query-native-dispatch-adapter.ts`, `query-policy-capability.ts`, `query-runtime-context.ts`, `query-unknown-command-hints.ts`, `query-cli-adapter.ts`, `query-cli-output.ts`, `mutation-event-decorator.ts`, `mutation-event-mapper.ts`

**Integration with named modules:** `config-query.ts` uses `resolveRuntimeTierDefault` from `model-catalog.ts`; `helpers.ts` `detectRuntime()` is used by `session-runner.ts`; all handlers consume `GSDConfig` from `config.ts`.

---

### `sdk/src/handlers/`

**Responsibility:** High-level operation handlers that implement complex multi-step operations against `.planning/` state. These are consumed by `GSDTools` and `gsd-tools.ts` for the native SDK path.

**Subdirectories and entry points:**
- **`handlers/init/index.ts`** — Init workflow handler. Sub-modules: `complex.ts` (complex project init), `composer.ts` (init step composition), `git-helpers.ts` (git state detection for init context). Entry point for `gsd-tools init *` family.
- **`handlers/phase/index.ts`** — Single-phase operations handler.
- **`handlers/phases/index.ts`** — Multi-phase list/query operations.
- **`handlers/roadmap/index.ts`** — ROADMAP.md analysis and mutation handler.
- **`handlers/state/index.ts`** — STATE.md CRUD handler.
- **`handlers/validate/index.ts`** — Plan/phase validation handler.
- **`handlers/verify/index.ts`** — Phase verification handler.

---

### `sdk/src/config/`

**Responsibility:** Canonical configuration module (ADR-3524, #3536). Provides the authoritative default values and deep-merge pipeline consumed by `config.ts`. Separates config concerns from the main config loader.

**Key module:** `config/index.ts` — exports `CONFIG_DEFAULTS` (built from `sdk/shared/config-defaults.manifest.json`), `mergeDefaults(overlay)` (recursive deep-merge), `normalizeLegacyKeys(parsed)` (top-level legacy key migration to nested structure).

---

### `sdk/src/dispatch/`

**Responsibility:** Event dispatch hub for routing GSD tool call events from the SDK query path to the event stream.

**Key module:** `dispatch/hub.ts` — dispatch hub implementation.

---

### `sdk/src/errors/`

**Responsibility:** Structured error taxonomy for the SDK layer.

**Key module:** `errors/index.ts` — exports base error types, `GSDError`, structured error codes.

---

### `sdk/src/golden/`

**Responsibility:** Golden test harness for SDK native parity verification. Captures expected outputs from the CJS CLI and asserts the native SDK path produces identical results.

**Key modules:**
- `golden/capture.ts` — captures golden fixture output from the CJS subprocess
- `golden/golden-policy.ts` — policy rules for what must be golden-tested
- `golden/golden-integration-covered.ts`, `golden/golden-mutation-covered.ts` — coverage tracking for integration/mutation command golden tests
- `golden/registry-canonical-commands.ts` — the canonical set of commands that must be covered
- `golden/read-only-golden-rows.ts` — read-only command golden rows
- `golden/init-golden-normalize.ts` — normalizes init command output for golden comparison
- `golden/fixtures/` — fixture data directory (profile-sample-sessions)

---

### `sdk/src/manifest/`

**Responsibility:** SDK manifest assembly — builds the command manifest from source modules for registry initialization.

**Key module:** `manifest/index.ts` — manifest builder entry point.

---

### `sdk/src/runtime/`

**Responsibility:** Runtime environment utilities.

**Key modules:**
- `runtime/name-policy.ts` — runtime name validation and normalization policy
- `runtime/project-root.ts` — project root resolution for different runtime environments

---

### `sdk/src/runtime-bridge-sync/`

**Responsibility:** Synchronous runtime bridge using `worker_threads`. Allows blocking calls to async SDK query operations from synchronous contexts (e.g., agent tool callbacks that cannot be async). This solves the problem of Claude Code tool handlers being called synchronously.

**Key modules:**
- `runtime-bridge-sync/index.ts` — synchronous bridge entry point; spawns a worker thread and blocks via `Atomics.wait()`
- `runtime-bridge-sync/worker.ts` — the worker thread implementation; handles the async query and posts result back via `SharedArrayBuffer`

---

### `sdk/src/state/`

**Responsibility:** STATE.md read/write operations native to the SDK (without subprocess). Provides the typed state model and mutation functions.

**Key module:** `state/index.ts` — state CRUD entry point.

---

### `sdk/src/workstream/`

**Responsibility:** Workstream build and configuration utilities.

**Key module:** `workstream/builder.ts` — workstream directory structure builder; creates `.planning/workstreams/<name>/` scaffolding.

---

## Full File Enumeration (for cross-check)

The following is the complete list of non-test TypeScript source files in `sdk/src/` as enumerated from the live tree immediately before Phase 69 merge. A SDKR-01 restorer should verify this list against the SDKR-01 spec to ensure no subsystem is silently dropped:

```
sdk/src/cli-transport.ts
sdk/src/cli.ts
sdk/src/config/index.ts
sdk/src/config.ts
sdk/src/context-engine.ts
sdk/src/context-truncation.ts
sdk/src/dispatch/hub.ts
sdk/src/errors/index.ts
sdk/src/errors.ts
sdk/src/event-stream.ts
sdk/src/golden/capture.ts
sdk/src/golden/golden-integration-covered.ts
sdk/src/golden/golden-mutation-covered.ts
sdk/src/golden/golden-policy.ts
sdk/src/golden/init-golden-normalize.ts
sdk/src/golden/read-only-golden-rows.ts
sdk/src/golden/registry-canonical-commands.ts
sdk/src/gsd-tools-error.ts
sdk/src/gsd-tools.ts
sdk/src/gsd-transport-policy.ts
sdk/src/gsd-transport.ts
sdk/src/handlers/init/complex.ts
sdk/src/handlers/init/composer.ts
sdk/src/handlers/init/git-helpers.ts
sdk/src/handlers/init/index.ts
sdk/src/handlers/phase/index.ts
sdk/src/handlers/phases/index.ts
sdk/src/handlers/roadmap/index.ts
sdk/src/handlers/state/index.ts
sdk/src/handlers/validate/index.ts
sdk/src/handlers/verify/index.ts
sdk/src/index.ts
sdk/src/init-runner.ts
sdk/src/logger.ts
sdk/src/manifest/index.ts
sdk/src/model-catalog.ts
sdk/src/phase-prompt.ts
sdk/src/phase-runner.ts
sdk/src/planning-journal.ts
sdk/src/planning-runtime.ts
sdk/src/plan-parser.ts
sdk/src/prompt-builder.ts
sdk/src/prompt-sanitizer.ts
sdk/src/query/active-workstream-store.ts
sdk/src/query/agent-failure-classifier.ts
sdk/src/query/audit-open.ts
sdk/src/query/check-auto-mode.ts
sdk/src/query/check-completion.ts
sdk/src/query/check-decision-coverage.ts
sdk/src/query/check-gates.ts
sdk/src/query/check-ship-ready.ts
sdk/src/query/check-verification-status.ts
sdk/src/query/command-aliases.generated.ts
sdk/src/query/command-catalog.ts
sdk/src/query/command-definition.ts
sdk/src/query-command-executor.ts
sdk/src/query/command-family-handlers.ts
sdk/src/query/command-manifest.init.ts
sdk/src/query/command-manifest.non-family.ts
sdk/src/query/command-manifest.phases.ts
sdk/src/query/command-manifest.phase.ts
sdk/src/query/command-manifest.roadmap.ts
sdk/src/query/command-manifest.state.ts
sdk/src/query/command-manifest.ts
sdk/src/query/command-manifest.types.ts
sdk/src/query/command-manifest.validate.ts
sdk/src/query/command-manifest.verify.ts
sdk/src/query/commands-list.ts
sdk/src/query/command-static-catalog-domain.ts
sdk/src/query/command-static-catalog-foundation.ts
sdk/src/query/command-topology.ts
sdk/src/query/commit.ts
sdk/src/query/config-gates.ts
sdk/src/query/config-mutation.ts
sdk/src/query/config-query.ts
sdk/src/query/config-schema.ts
sdk/src/query/decisions.ts
sdk/src/query/detect-custom-files.ts
sdk/src/query/detect-phase-type.ts
sdk/src/query/docs-init.ts
sdk/src/query-execution-policy.ts
sdk/src/query-failure-classification.ts
sdk/src/query/fallow-audit.ts
sdk/src/query/frontmatter-mutation.ts
sdk/src/query/frontmatter.ts
sdk/src/query-gsd-tools-path.ts
sdk/src/query-gsd-tools-runtime.ts
sdk/src/query/helpers.ts
sdk/src/query-hotpath-methods.ts
sdk/src/query/index.ts
sdk/src/query/init-complex.ts
sdk/src/query/init.ts
sdk/src/query/intel.ts
sdk/src/query/mutation-event-decorator.ts
sdk/src/query/mutation-event-mapper.ts
sdk/src/query/mvp.ts
sdk/src/query-native-direct-adapter.ts
sdk/src/query-native-hotpath-adapter.ts
sdk/src/query/phase-filesystem-adapter.ts
sdk/src/query/phase-lifecycle-policy.ts
sdk/src/query/phase-lifecycle.ts
sdk/src/query/phase-list-queries.ts
sdk/src/query/phase-ready.ts
sdk/src/query/phase-roadmap-mutation.ts
sdk/src/query/phase.ts
sdk/src/query/phase-uat-passed.ts
sdk/src/query/pipeline.ts
sdk/src/query/plan-scan.ts
sdk/src/query/plan-task-structure.ts
sdk/src/query/profile-extract-messages.ts
sdk/src/query/profile-output.ts
sdk/src/query/profile-questionnaire-data.ts
sdk/src/query/profile-sample.ts
sdk/src/query/profile-scan-sessions.ts
sdk/src/query/profile.ts
sdk/src/query/progress.ts
sdk/src/query/prompt-budget.ts
sdk/src/query/query-cli-adapter.ts
sdk/src/query/query-cli-output.ts
sdk/src/query/query-command-diagnosis.ts
sdk/src/query/query-command-resolution-strategy.ts
sdk/src/query/query-command-semantics.ts
sdk/src/query/query-dispatch-contract.ts
sdk/src/query/query-dispatch-error-mapper.ts
sdk/src/query/query-dispatch-formatting.ts
sdk/src/query/query-dispatch-observability.ts
sdk/src/query/query-dispatch.ts
sdk/src/query/query-error-details-schema.ts
sdk/src/query/query-error-taxonomy.ts
sdk/src/query/query-fallback-bridge-adapter.ts
sdk/src/query/query-fallback-executor.ts
sdk/src/query/query-fallback-output-classifier.ts
sdk/src/query/query-fallback-policy.ts
sdk/src/query/query-native-dispatch-adapter.ts
sdk/src/query/query-policy-capability.ts
sdk/src/query/query-runtime-context.ts
sdk/src/query/query-unknown-command-hints.ts
sdk/src/query-raw-output-projection.ts
sdk/src/query/registry-assembly-descriptor.ts
sdk/src/query/registry-assembly-invariants.ts
sdk/src/query/registry-assembly.ts
sdk/src/query/registry.ts
sdk/src/query/requirements-extract-from-plans.ts
sdk/src/query/roadmap.ts
sdk/src/query/roadmap-update-plan-progress.ts
sdk/src/query/route-next-action.ts
sdk/src/query-runtime-bridge.ts
sdk/src/query/schema-detect.ts
sdk/src/query/secrets.ts
sdk/src/query/skill-manifest.ts
sdk/src/query/skills.ts
sdk/src/query/state-mutation.ts
sdk/src/query/state-project-load.ts
sdk/src/query/state.ts
sdk/src/query-subprocess-adapter.ts
sdk/src/query/summary.ts
sdk/src/query/template.ts
sdk/src/query-tools-error-factory.ts
sdk/src/query/uat.ts
sdk/src/query/utils.ts
sdk/src/query/validate.ts
sdk/src/query/verify.ts
sdk/src/query/websearch.ts
sdk/src/query/workspace.ts
sdk/src/query/workstream-inventory.ts
sdk/src/query/workstream.ts
sdk/src/query/worktree.ts
sdk/src/research-gate.ts
sdk/src/runtime-bridge-sync/index.ts
sdk/src/runtime-bridge-sync/worker.ts
sdk/src/runtime-gate.ts
sdk/src/runtime/name-policy.ts
sdk/src/runtime/project-root.ts
sdk/src/sdk-package-compatibility.ts
sdk/src/session-runner.ts
sdk/src/state/index.ts
sdk/src/tool-scoping.ts
sdk/src/types.ts
sdk/src/workstream/builder.ts
sdk/src/workstream-name-policy.ts
sdk/src/workstream-utils.ts
sdk/src/ws-transport.ts
```

---

*Captured: 2026-06-11. This document is self-sufficient — a rebuild should not require the deleted source.*
