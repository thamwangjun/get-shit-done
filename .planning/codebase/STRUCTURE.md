# Codebase Structure

**Analysis Date:** 2026-04-15

## Directory Layout

```
get-shit-done/                        # Repository root
├── agents/                           # Agent definition files (31 agents)
├── bin/                              # Installer entry point
│   └── install.js                    # Runtime installer (3,400+ lines)
├── commands/                         # User-facing slash command files
│   └── gsd/                          # 73 command .md files
├── docs/                             # Contributor and user documentation
│   ├── ARCHITECTURE.md               # System design deep-dive
│   ├── AGENTS.md                     # All agents with tool requirements
│   ├── CLI-TOOLS.md                  # Full gsd-tools.cjs subcommand reference
│   ├── CONFIGURATION.md              # Complete config.json schema
│   └── ja-JP/, ko-KR/, pt-BR/, zh-CN/  # Localized docs
├── get-shit-done/                    # Core framework source
│   ├── bin/                          # CLI tools
│   │   ├── gsd-tools.cjs             # CLI entry point (subcommand router)
│   │   └── lib/                      # Node.js CommonJS modules (24 files)
│   ├── contexts/                     # Workflow context fragments
│   │   ├── dev.md                    # Dev workflow context
│   │   ├── research.md               # Research workflow context
│   │   └── review.md                 # Review workflow context
│   ├── references/                   # Shared prompt fragments (45+ files)
│   ├── templates/                    # Planning artifact templates (30+ files)
│   │   ├── codebase/                 # Codebase mapping templates
│   │   └── research-project/         # Research project templates
│   └── workflows/                    # Workflow orchestration files (71 files)
├── hooks/                            # Hook source files
│   ├── gsd-statusline.js             # Terminal status line hook
│   ├── gsd-context-monitor.js        # Context exhaustion monitor
│   ├── gsd-check-update.js           # Version check hook
│   ├── gsd-workflow-guard.js         # Workflow file guard hook
│   └── dist/                         # Built hook output (committed; installed from here)
├── plans/                            # Internal GSD development plans
├── scripts/                          # Build and maintenance scripts
│   ├── build-hooks.js                # Hook build/validate script
│   ├── run-tests.cjs                 # Test runner wrapper
│   ├── secret-scan.sh                # Secret scanning script
│   └── prompt-injection-scan.sh      # Prompt injection scan
├── sdk/                              # TypeScript SDK (separate from CLI)
│   ├── src/                          # TypeScript source (phase-runner, plan-parser, etc.)
│   ├── prompts/                      # SDK-specific agent/workflow prompt variants
│   └── docs/                         # SDK documentation
├── tests/                            # Test suite (180+ test files, .cjs)
│   └── helpers.cjs                   # Shared test utilities
├── .planning/                        # GSD state for this repo's own development
├── .github/                          # GitHub Actions CI workflows
├── package.json                      # npm manifest
├── tsconfig.json                     # TypeScript config (for sdk/)
└── vitest.config.ts                  # Vitest config (for sdk/ TypeScript tests)
```

## Directory Purposes

**`agents/`:**
- Purpose: Agent definitions installed into AI tool runtimes at `~/.claude/agents/` (Claude Code) or equivalent
- Contains: 31 `gsd-*.md` files, each with YAML frontmatter (`name`, `description`, `tools`, `color`) and role instructions
- Key files: `gsd-planner.md`, `gsd-executor.md`, `gsd-verifier.md`, `gsd-phase-researcher.md`, `gsd-debugger.md`

**`commands/gsd/`:**
- Purpose: Slash command files that users invoke directly in their AI tool
- Contains: 73 `.md` files with YAML frontmatter and prompt bodies that read matching workflows
- Key files: `do.md` (dispatcher), `plan-phase.md`, `execute-phase.md`, `new-project.md`, `autonomous.md`

**`get-shit-done/bin/lib/`:**
- Purpose: CommonJS modules implementing all CLI tool functionality; tested independently
- Contains: 24 `.cjs` modules, each focused on one domain
- Key files: `state.cjs`, `phase.cjs`, `core.cjs`, `init.cjs`, `roadmap.cjs`, `verify.cjs`, `config.cjs`

**`get-shit-done/workflows/`:**
- Purpose: Orchestration logic; commands reference these files via `@~/.claude/get-shit-done/workflows/` paths
- Contains: 71 `.md` files with `<purpose>`, `<required_reading>`, `<available_agent_types>`, and `<process>` sections
- Key files: `plan-phase.md`, `execute-phase.md`, `new-project.md`, `autonomous.md`, `do.md`

**`get-shit-done/references/`:**
- Purpose: Shared knowledge fragments injected into agent/workflow prompts via `@-reference` syntax
- Contains: 45+ `.md` files covering gates, checkpoints, model profiles, verification patterns, anti-patterns
- Key files: `gates.md`, `model-profiles.md`, `verification-patterns.md`, `agent-contracts.md`, `ui-brand.md`

**`get-shit-done/templates/`:**
- Purpose: Pre-structured Markdown boilerplate for planning artifacts, filled by `gsd-tools.cjs template fill`
- Contains: 30+ `.md` files and a `codebase/` subdirectory with mapper-specific templates
- Key files: `project.md`, `requirements.md`, `roadmap.md`, `state.md`, `phase-prompt.md`, `context.md`, `summary.md`

**`hooks/`:**
- Purpose: Hook source files; edit `.js` files here, then run `npm run build:hooks` to copy to `hooks/dist/`
- Contains: Source `.js` hooks and `.sh` hooks; `dist/` contains identical copies committed to git
- Key files: `gsd-statusline.js`, `gsd-context-monitor.js`, `gsd-workflow-guard.js`

**`tests/`:**
- Purpose: Full test suite for CLI tools and installer behavior
- Contains: 180+ `.test.cjs` files plus `helpers.cjs` shared utilities
- Key files: `helpers.cjs`, `state.test.cjs`, `phase.test.cjs`, `install-hooks-copy.test.cjs`, `agent-frontmatter.test.cjs`

**`sdk/`:**
- Purpose: TypeScript SDK for programmatic GSD usage (separate product from the CLI/prompt framework)
- Contains: TypeScript source in `src/`, SDK-specific prompt variants in `prompts/`, integration tests in `src/*.integration.test.ts`
- Key files: `src/phase-runner.ts`, `src/plan-parser.ts`, `src/cli.ts`, `src/gsd-tools.ts`

**`.planning/`:**
- Purpose: GSD's own project state — GSD uses itself for development
- Contains: `STATE.md`, `ROADMAP.md`, `config.json`, `phases/`, `codebase/` (this document)
- Generated: Yes (by GSD workflows) | Committed: Yes (project state is tracked in git)

## Key File Locations

**Entry Points:**
- `bin/install.js`: Installer — detects runtime, copies files, transforms content per target
- `get-shit-done/bin/gsd-tools.cjs`: CLI entry point — all Bash calls from workflows/agents go here
- `commands/gsd/do.md`: Smart dispatcher command — routes freeform text to correct GSD command

**Configuration:**
- `package.json`: npm manifest, version, test/build scripts
- `tsconfig.json`: TypeScript config for `sdk/` source
- `vitest.config.ts`: Vitest config for SDK TypeScript tests

**Core Logic:**
- `get-shit-done/bin/lib/core.cjs`: Shared utilities, path helpers, lock primitives, `output()`/`error()`
- `get-shit-done/bin/lib/state.cjs`: STATE.md CRUD and checkpoint progression
- `get-shit-done/bin/lib/phase.cjs`: Phase directory operations and decimal phase numbering
- `get-shit-done/bin/lib/init.cjs`: Compound context loading for all workflow `init` commands
- `get-shit-done/bin/lib/roadmap.cjs`: ROADMAP.md parsing and phase update operations
- `get-shit-done/bin/lib/verify.cjs`: Plan structure and phase completeness validation
- `get-shit-done/bin/lib/config.cjs`: `.planning/config.json` CRUD
- `get-shit-done/bin/lib/frontmatter.cjs`: YAML frontmatter CRUD for agent/workflow files
- `get-shit-done/bin/lib/template.cjs`: Template fill operations

**Testing:**
- `tests/helpers.cjs`: Shared utilities — `runGsdTools()`, `createTempProject()`, `createTempGitProject()`, `cleanup()`
- `tests/*.test.cjs`: Per-module and per-feature test files

## Naming Conventions

**Files:**
- Agent definitions: `gsd-{role}.md` — e.g., `gsd-planner.md`, `gsd-executor.md`
- Command files: `{command-name}.md` — matches the slash command name, e.g., `plan-phase.md`
- Workflow files: `{workflow-name}.md` — matches command name exactly, e.g., `execute-phase.md`
- CLI modules: `{domain}.cjs` — e.g., `state.cjs`, `phase.cjs`, `roadmap.cjs`
- Test files: `{module-or-feature}.test.cjs` — e.g., `state.test.cjs`, `bug-1736-local-install-commands.test.cjs`
- Bug regression tests: `bug-{issue-number}-{description}.test.cjs`
- Reference files: `{topic}.md` — e.g., `gates.md`, `verification-patterns.md`
- Hook sources: `gsd-{name}.js` or `gsd-{name}.sh`

**Directories:**
- Phase artifact directories: `phase-N/` or `phase-N.M/` under `.planning/phases/`
- All framework source under `get-shit-done/` to namespace from user project content

## Where to Add New Code

**New Command:**
- Primary: `commands/gsd/{command-name}.md` — YAML frontmatter + prompt that reads matching workflow
- Matching workflow: `get-shit-done/workflows/{command-name}.md`
- If spawning agents: reference existing agent types from `agents/` or add new agent (see below)

**New Agent:**
- Implementation: `agents/gsd-{role}.md` — YAML frontmatter with `name`, `description`, `tools`, `color`
- Must include `# hooks:` commented in frontmatter (required by `agent-frontmatter.test.cjs`)
- If agent writes files: must include `Only use the Write tool` in body (checked case-insensitively)
- Must NOT include `skills:` in frontmatter (breaks Gemini CLI)
- Register the new agent name in `tests/agent-frontmatter.test.cjs` valid agent list

**New CLI Module:**
- Implementation: `get-shit-done/bin/lib/{domain}.cjs`
- Import in `get-shit-done/bin/gsd-tools.cjs` and wire subcommands
- Test file: `tests/{domain}.test.cjs`

**New Workflow:**
- Implementation: `get-shit-done/workflows/{workflow-name}.md`
- Structure: `<purpose>`, `<required_reading>`, `<available_agent_types>`, `<process>` sections
- Init call: `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init {workflow-name} "$PHASE"`

**New Reference Fragment:**
- Shared knowledge: `get-shit-done/references/{topic}.md`
- Inject via `@~/.claude/get-shit-done/references/{topic}.md` in workflow `<required_reading>`

**New Template:**
- Artifact template: `get-shit-done/templates/{artifact-name}.md`
- Fill via: `node gsd-tools.cjs template fill {template-name} [key=value ...]`

**Utilities:**
- Shared CLI helpers: `get-shit-done/bin/lib/core.cjs` — add to existing module if domain fits
- Shared test utilities: `tests/helpers.cjs` — add to existing helpers if broadly useful

## Special Directories

**`.planning/`:**
- Purpose: GSD's own project state (GSD uses itself for its own development)
- Generated: Yes, by GSD workflows
- Committed: Yes — project state, roadmap, and phase plans are tracked in git

**`hooks/dist/`:**
- Purpose: Built hook files ready for installation into AI tool runtimes
- Generated: Yes, by `npm run build:hooks` (copies from `hooks/*.js` and `hooks/*.sh`)
- Committed: Yes — required for npm publish; `install.js` copies from `dist/` not source

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes, by `npm install`
- Committed: No

**`sdk/`:**
- Purpose: Separate TypeScript SDK product — programmatic GSD for CI/automated pipelines
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-04-15*
