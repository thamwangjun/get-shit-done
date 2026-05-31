CLAUDE.
 file provides guidance Code. code repository.
 Project GSD (Get Shit Done) meta-prompting framework installs commands, workflows, agents, hooks into AI coding tools Code, OpenCode, Gemini CLI, Codex, Copilot, Antigravity. solves "context rot multi-agent orchestration each spawned agent gets fresh context window.
 Commands npm test Run tests
 c8 coverage line coverage
 Validate hook syntax copy to hooks/dist before publish
 single test file
 node --test tests.
 use Node. js built-in-test external test framework. Coverage measured against `get-shit-done/bin/lib. Requires Node. js >=20.
 tests, output/tmp, analyze file avoid re output.
/gsd-test-output.
 Read-test-output. analyze results
 Reading Files
 file truncated output, reference path to full file. read full file before continuing never act on truncated content.
 Architecture
 /gsd-command commands. workflows.md agents. gsd-tools. cjs. planning
 layers
. 67 user slash commands read workflow forward.
 2. 90 orchestrators. call `gsd-tools. cjs init <workflow load context, spawn agents.
 3. 33 agent definitions scoped tool permissions. Each agent spawned 200K-token context window.
 4. tools-tools. cjs 79 Node. js CommonJS modules state, phase, roadmap, frontmatter, templates,. called by agents Bash read/write. planning files.
. planning human-readable Markdown JSON. file-locked. parallel-safe writes **wave independent plans grouped waves run parallel.
 Key Source Files
 Path Purpose
/install. js Installer entry point, 400+ lines. Detects runtime, copies files, transforms content target runtime.
/lib/state. cjs STATE. md, checkpoint progression, metrics
/phase. cjs Phase directory operations, decimal phase-shit-done/bin/lib/verify. cjs Plan structure validation
/init. cjs Compound context loading workflows
/commands. Slug generation, session stats
/core. cjs Low-level file I/O, lock primitives
/milestone. cjs Milestone CRUD
/config. Config CRUD. planning/config. json
/frontmatter. YAML frontmatter CRUD agent/workflow files
/model-profiles. Model profile resolution
/profile-output. User profile output formatting
/profile-pipeline. User profile pipeline orchestration
/roadmap. Roadmap/plan CRUD
/template. cjs Template fill operations
 `hooks Source four hooks statusline, context-monitor, check-update, workflow-guard. Edit `hooks/. js, run `build:hooks` copy `hooks/dist/`.
-done/references Shared prompt fragments workflows., verification-patterns., model-profiles.,
 `get-shit-done/templates Boilerplate markdown files agents fill `gsd-tools. cjs template (30+ templates
 `tests/helpers. Shared test utilities `runGsdTools, `createTempProject(, `createTempGitProject, `cleanup()
 Runtime Adaptation
 installer transforms installed files target runtime
 `Read,`execute,.
 `PostToolUse`AfterTool`
 frontmatter** format
. claude,. config/opencode,. gemini,.
 editing command/workflow. files, use Claude Code conventions. installer handles runtime translation.
 Adding/Modifying Commands Workflows
/gsd thin set context call `Read workflow file.
-done/workflows orchestration. init spawn agents collect results update state.
 declare tool permissions YAML frontmatter,. agents focused single responsibility.-frontmatter. validates agent files adding agents.
 `gsd-tools. CLI interface between agents. planning. Run get-shit-done/gsd-tools. cjs help see commands.subcommand groups
 `scaffold create context, phase-dir scaffolding
 `frontmatter CRUD agent/workflow YAML frontmatter
 `verify plan-structure, phase-completeness, artifacts
 `template fill templates project context
 `validate consistency health--repair
 Testing Conventions
 Test files `tests.
 Each CLI module-done/bin/lib corresponding test file.
 `tests/helpers. provides `createTempDir(), fixture utilities, assertion helpers.
 `agent-frontmatter. validates YAML frontmatter agent files. adding agent, four rules
-writing include string `Only use Write tool, hooks frontmatter.
 `skills: frontmatter breaks Gemini CLI.
 **Workflow/command spawn agents `subagent_type:,./agents. workarounds.
 Add new agent name valid agent list test.
 Configuration
 `config. json. controls workflow behavior. settings
 `mode` `interactive
 `parallelization. enabled run independent plans parallel waves
 Absent keys default to `true`
Model profiles Opus planning, Sonnet execution/verification. Override project_profile.
 Deep-Dive References
 `docs/ directory documentation complex topics
/ARCHITECTURE. system design deep-dive
/AGENTS. agents tool requirements spawn patterns
/CLI-TOOLS. full gsd-tools. cjs subcommand reference
/CONFIGURATION. complete. json schema
/FEATURES. feature matrix
! GSD:project-start source:PROJECT.
 Project Prompt-Engineered Fork**
 fork GSD framework applies prompt engineering improvements prompt content files agents, commands, workflows. tracks `upstream/main merge modification pass files fork quality bar. standards, defined./PROMPT_IMPROVEMENT_GUIDE_V01./PROMPT_ENGINEERING_GUIDE_V09., precedence upstream content decisions.
 Value agent, command, workflow file meets fork prompt engineering quality bar before ships upstream content additions modified, not accepted.
 Constraints
 Agent YAML frontmatter, preserved-frontmatter.cjs validates agents `npm test run
 Fork reference files take precedence tests negative framing modified, not reverted
 `skills agent frontmatter** breaks Gemini CLI runtime upstream adds
 **Positive framing replacement Negative directives, replaced with affirmative instructions replacement specify correct behavior, not delete prohibition
! GSD:project-end
!:stack-start source:codebase/STACK.
 Technology Stack
 Languages
 JavaScript (CommonJS) CLI tooling layer-done/bin/lib.-tools.
 TypeScript 5. 7 SDK/src., ES2022 modules
 Bash hooks/gsd-phase-boundary.,-state.,-validate-commit.
 Markdown command, workflow, agent definitions `commands/gsd.,-done/workflows.,.
 Runtime
 Node. js. (root (SDK package
 CI matrix tests Node 22 24-latest, 24 macos-latest
 npm
 Lockfile `package-lock. json 3)
 Frameworks
 root package zero-dependency installer CLI toolkit
@anthropic-ai/claude-agent-sdk`. 84 SDK layer, powers `sdk/src/session-runner. `query() calls
 Node. js built--test runner no external test framework tests `tests/.
. coverage measurement target line coverage/bin/lib/*.
 `vitest`. (SDK,. workspace unit integration test runner
 Config at `vitest. (root/vitest
 `esbuild`. hook bundling `scripts/build-hooks.
 (TypeScript 5. 7) SDK compilation `sdk/tsconfig.
@anthropic-ai/claude-agent-sdk`. 84 only runtime dependency/src/session-runner. call `query() stream agent messages
. WebSocket server/src/ws-transport. broadcasting GSD events external consumers
 No database clients, HTTP frameworks, auth libraries system file-based, on. Markdown JSON files
 `ANTHROPIC_API_KEY` consumed by/claude-agent-sdk` runtime not reads internally
 `BRAVE_API_KEY` optional enables Brave Search `sdk/src/query/websearch.
`FIRECRAWL_API_KEY optional enables Firecrawl scraping,/src/query/config-mutation.
 `EXA_API_KEY optional enables Exa Search,/src/query/init-complex.
 `GSD_HOME overrides home directory resolution.
_AGENTS_DIR overrides agents directory path. used tests
 `HOME standard home resolution
./config. json per-project defined/src/config. loaded.
 Key fields `model_profile/quality/speed, `parallelization, `brave_search, `firecrawl, `exa_search, `workflow.,.
 `sdk/tsconfig. json TypeScript compiler ES2022, NodeNext,
 `tsconfig. json references `sdk no root compilation
/build-hooks. js validates copies files/dist/
 Platform Requirements
 Node. js.
 npm (lockfile
 git-tools. commit operations branch management
 Distributed npm-shit-done-cc package
 Installed globally get-done-cc
 Target runtimes Claude Code., OpenCode./opencode, Gemini CLI., Codex, Copilot, Antigravity
 No server database local filesystem files. planning
! GSD:stack-end
!:conventions-start source:CONVENTIONS.
 Conventions Naming Patterns
 Source lib modules `kebab-case. cjs.,.,-profiles.,-pipeline.
 Test files `kebab-case. cjs one test file per lib module integration/regression tests
 Bug regression tests `bug-<issue-number<description. test cjs,-file-resolution.
 Helper scripts `kebab-case. cjs`
 functions use `camelCase`.,
 CLI command handler functions prefixed with `cmd`.,
 Internal-only helpers suffixed `Internal`.,
 Boolean predicates use `is`has`can` prefix.,
 `camelCase` for local variables
 `SCREAMING_SNAKE_CASE` for module-level constants., `CONFIG_DEFAULTS, `WORKSTREAM_SESSION_ENV_KEYS,_ENV_BASE
 Temporary directory variables `tmpDir
 No TypeScript runtime checks
 Module-level constant objects `SCREAMING_SNAKE_CASE keys
 `tsconfig. json. config. tooling runtime code CommonJS
 No Prettier ESLint repository root formatting maintained convention
 2-space indentation.
 Single quotes string literals
 Template literals multi-token string construction
 CommonJS,. exports no ES modules lib test code
 files'use strict implied not
 `scripts/run-tests. cjs uses'use strict
 Section Organization
 Import
 Error Handling
 Output
 raw mode writes `String(rawValue)
 JSON serializes `result JSON
 large payloads writes temp file outputs. json
. writeSync(1, avoids pipe teardown
 Concurrency Primitives
 Module-level JSDoc block top lib file module purpose
 Section separator banners functions
 Inline comments non-obvious logic, concurrency, cases, issue references
Issue numbers (#1916), fix #1967
 Used public/exported functions called consumers
@param@returns tags helper functions
 Function Design
 `cwd first parameter functions. planning
 `raw last parameter CLI functions output format
 Options objects command 3+ optional args., `cmdPhasesList,
 Internal helpers return plain values or `null not-found
 CLI command handlers stdout return `undefined
 Functions fail return `null`
 Module Design
 Single `module. exports. block end lib file exported names
 Internal helpers not needed not exported,
-shit-done/bin/gsd-tools. CLI entry point lib modules commands
! GSD
!.
 Pattern Overview
 Four layers Commands Workflows Agents CLI Tools
 state human-readable Markdown/JSON. planning no database, server
 200K-token context window per spawned agent
 Thin orchestrators workflows coordinate, agents heavy
 Absent enabled pattern feature flags in `config. json
 User-facing entry points workflow execution
 Location `commands/gsd/*.
 YAML frontmatter, description,-tools prompt body workflow
 Depends Workflow layer./workflows. references
 Used AI coding tool runtime Code, Codex, Copilot commands
 Orchestration logic, coordinates
 Location-done/workflows. md
 Step-step orchestration init spawn agents collect results update state
 Depends CLI tools layer-tools. Agent layer.
 Command layer read execute workflows
 Specialized task executors, spawned fresh context window
 Location `agents. md agents,/prompts/agents
 YAML frontmatter, role instructions
 Depends CLI tools layer Bash calls-tools. cjs, file-based state. planning
 Used Workflow layer orchestrators
 Low-level Node. js interface agents/workflows. planning state
 Location-done/bin/gsd-tools. cjs,. cjs
 Contains State CRUD, phase operations, roadmap parsing, template filling, verification
 Depends. planning directory filesystem
Used Workflows Bash, agents state reads/writes
 Data Flow
 STATE. central project checkpoint file. planning/STATE.
 File-locked. planning/STATE. parallel-safe writes wave execution
 `state. provides CRUD, checkpoint progression, metrics
 Lock cleanup. prevent stale locks
 Represents unit work plan, research, execution artifacts
. planning/phases/phase-1/PLAN.,./SUMMARY
 Decimal sub-phases supported.,.,. Directories sorted `comparePhaseNum(-shit-done/bin/lib/phase.
 Group plans no inter-dependencies, execute parallel
 Referenced `get-done/workflows/execute-phase.
 Workflow performs dependency analysis. fields PLAN., independent tasks waves, executes wave agents parallel
 Mandatory quality checkpoints progressing pipeline stages
 `get-shit-done/references/gates.,.
 Four canonical gate types, `gsd-plan-checker `gsd-verifier agents
 Shared knowledge fragments injected `@-reference syntax workflows agents
Examples-done/references/verification-patterns.,-profiles.
 Workflows include_reading blocks agents read references before acting
 Pre-structured Markdown boilerplate planning artifacts
 Examples-done/templates/project.,-prompt.
 Filled `gsd-tools. cjs template fill project context
 Location `bin/install. js, 400+ lines
 Triggers get-shit-done invocation setup
 Detect runtime, copy agents/workflows/commands runtime-specific install paths, transform tool names events/frontmatter per runtime
 Location `get-shit-done/bin/gsd-tools.
 Called via Bash workflows.,.-done/gsd-tools. state load
 Route subcommands`init, to lib modules
 Location `hooks/. js,/dist/ output runtime
 Triggers AI tool hook events AfterTool depending runtime
 `gsd-statusline. (terminal status,-context-monitor. exhaustion tracking,-check-update.js checks, `gsd-workflow-guard. file protection
 Error Handling
-done/bin/lib/core. calls. exit(1) lib modules use
 Lock files tracked_heldStateLocks_heldPlanningLocks, removed.'exit
 Plan revision loop 3 iterations-phase. workflow `gsd fails
 Agent fallback named subagent unavailable, workflows detect `agents_installed JSON fall back inline execution
 Wave execution agent completes signal lost, workflow verifies filesystem. continues
 Cross-Cutting Concerns
! GSD:architecture-end
!:skills-start
 Project Skills
 No project skills. Add skills./skills,.,.,. github,. index.
! GSD:skills-end
! GSD:workflow-start defaults
 GSD Workflow Enforcement
, file-changing tools, work GSD command planning artifacts execution context sync.
 entry points
/gsd-quick for small fixes, updates, ad-hoc tasks
/gsd-debug investigation bug fixing
-execute-phase planned phase work
repo edits outside GSD workflow unless user bypass.
! GSD:workflow-end
!:profile-start
 Developer Profile
. Run/gsd-profile-user generate developer profile.
 managed by `generate-claude-profile not edit manually.
! GSD:profile-end
