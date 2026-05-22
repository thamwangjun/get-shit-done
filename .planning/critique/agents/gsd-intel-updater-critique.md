# Critique: gsd-intel-updater.md

- **Agent**: `gsd-intel-updater.md`
- **Date**: 2026-04-30
- **Guide version evaluated against**: PROMPT_ENGINEERING_GUIDE_V09.md

---

## Guide Sections Evaluated

| Section | Applicable? | Reason |
|---------|-------------|--------|
| §1 Task Specification | Yes | Agent has a defined task, audience, and quality bar |
| §4 Formatting and Structure | Yes | Mixed XML/markdown/bold formatting used throughout |
| §5 Instruction Framing | Yes | Contains several negative instructions |
| §6 Persona Assignment | Yes | Uses `<role>` rather than `<persona>` |
| §7 Output Format Handling | Yes | Specifies structured JSON schemas and completion markers |
| §8 Context Placement | Yes | Task instruction and input placement |
| §11 System vs. User Prompt Allocation | Yes | Agent prompt as system prompt; YAML frontmatter usage |
| §13 Structural Architecture Patterns | Yes | Template variable usage and modularity |
| §14 Constraint Enforcement | Yes | Has anti-patterns and forbidden file lists |
| §16 Multi-Phase Workflows | Yes | Uses numbered step-based execution flow |
| §17 Agent and Subagent Patterns | Yes | Subagent, frontmatter config, completion markers |
| §19 Modularity and Composition | Yes | Scope boundaries partially defined |
| §21 Tone and Style Rules | Yes | Instructions throughout; some qualitative, some specific |
| §22 Production Patterns | Yes | Pattern 3 (output format), Pattern 9 (tool permissions) |

---

## Strengths

### §17 — Completion Protocol (Structured Returns)
The `<structured_returns>` block is well-designed. It defines two exact completion markers (`## INTEL UPDATE COMPLETE`, `## INTEL UPDATE FAILED`) and explains the consequence of omitting them ("Orchestrators pattern-match on these markers to route results. Omitting causes silent failures."). This matches the guide's machine-parsed output spec from §7 and Pattern 3 from §22.

### §17 — Subagent Frontmatter Configuration
The YAML frontmatter encodes `name`, `description`, `tools`, and `color`. It aligns with the guide's §11 and §17 guidance that agent identity and permissions belong in frontmatter. The `tools` field scopes the permission set explicitly to `Read, Write, Bash, Glob, Grep`.

### §7 / §22 Pattern 3 — Output Schema Specification
The five JSON schemas (`files.json`, `apis.json`, `deps.json`, `stack.json`) and the `arch.md` template are fully specified upfront with field names, types, constraints, and concrete examples. This is consistent with §22 Pattern 3: "State the required output structure, field names, ordering, and an example before the model begins its task."

### §14 — Constraint Specificity on Exports
The exports constraint is unusually precise: "MUST be real identifiers (e.g., `'configLoad'`, `'stateUpdate'`), NOT descriptions (e.g., `'config operations'`). If an export string contains a space, it is wrong." This is an effective precedent-style ruling (§14) that pre-empts a known failure mode.

### §16 — Explicit Phase Sequencing
The `<execution_flow>` block numbers steps 1–7 with named responsibilities, uses a mandatory self-check (Step 6.5), and includes CLI commands. The step-gating at Step 6.5 ("This step is MANDATORY — do not skip it") is a strong enforcement pattern.

### §8 — Context Budget / Output Budget Tables
The Output Budget table (`files.json <= 2000 tokens / 3000 hard limit`, etc.) and Context Quality Tiers table provide numerically bounded constraints that align with §21 ("Size constraints as hard rules: Numbered limits beat qualitative descriptors").

---

## Weaknesses

### W1 — §4: Mixed and Inconsistent XML Tag Vocabulary
**Guide requirement (§4):** "Use XML tags to separate prompt sections... Tags name what the section *is*, not just where it starts." The guide defines a specific vocabulary: `<task>`, `<persona>`, `<context>`, `<constraints>`, `<output_format>`, etc.

The agent uses non-standard tags that mix with plain markdown:
- `<role>` instead of `<persona>`
- `<upstream_input>` (no guide equivalent; the content is context, not input)
- `<execution_flow>` (not a guide tag; guide uses `<phase>` blocks)
- `<success_criteria>` (guide uses `<quality_bar>` or `<output_format>`)
- `<structured_returns>` (not a guide tag; content belongs in `<output_format>`)
- `<critical_rules>` (not a guide tag; content belongs in `<constraints>`)
- `<anti_patterns>` (not a guide tag; content belongs in `<constraints>`)

Outside these custom tags, the agent also uses `**bold**` prose headers and `>` blockquotes for top-level structural separations ("Default files:", "Context budget:"), creating a three-tier format inconsistency: XML custom tags, markdown headers (`##`), and bold prose. The guide is explicit: XML tags are "strictly better than markdown headers or `---` delimiters for Claude-class models."

**Specific quote from agent:**
```
**Context budget:** Load project skills first (lightweight). Read implementation files incrementally...
```
This instruction lives outside any structural tag and precedes the `<role>` block — violating §8's rule that task instructions must lead and be clearly delimited.

### W2 — §5: Multiple Negative Instructions Remain Unrewritten
**Guide requirement (§5 Action 1):** "Convert negative instructions to positive equivalents. Before emitting any prompt, scan for negated instructions ('do not', 'avoid', 'never' as primary directives). Rewrite each as a positive specification of the desired behavior."

The `<anti_patterns>` block contains eight consecutive negative directives:

> "1. DO NOT guess or assume -- read actual files for evidence"
> "2. DO NOT use Bash for file listing -- use Glob tool"
> "3. DO NOT read files in node_modules, .git, dist, or build directories"
> "4. DO NOT include secrets or credentials in intel output"
> "5. DO NOT write placeholder data -- every entry must be verified"
> "6. DO NOT exceed output budget -- prioritize key files over exhaustive listing"
> "7. DO NOT commit the output -- the orchestrator handles commits"
> "8. DO NOT consume more than 50% context before producing output -- write incrementally"

The guide provides a conversion table for exactly this pattern. For example:
- "DO NOT guess or assume" → "Base every claim on actual file content read in this session"
- "DO NOT use Bash for file listing" → "Use Glob, Read, and Grep for all file operations"
- "DO NOT exceed output budget" → "Prioritize key files; stop at hard token limits"

The "Forbidden Files" section also uses negatives: "NEVER read or include in your output: .env files..."

### W3 — §6: Persona Uses Non-Standard Tag and Generic Framing
**Guide requirement (§6 Action 2):** "Make personas specific, not generic. Generic expert framing produces no measurable accuracy gain. A persona must constrain register, voice, or domain-specific style to be effective."

The agent uses `<role>` instead of `<persona>`. The content inside reads:

> "You are **gsd-intel-updater**, the codebase intelligence agent for the GSD development system. You read project source files and write structured intel to `.planning/intel/`."

This describes the agent's function, not its behavioral register, priorities, or voice. Compare to the guide's "Strengths listing" pattern (§6):

```xml
<persona>
You are a codebase intelligence specialist.

Your strengths:
- Deriving accurate dependency graphs from actual import/export statements
- Producing machine-parseable JSON with zero hallucinated entries
- Prioritizing evidence over inference
</persona>
```

No strengths are enumerated. The guide explicitly states: "Explicitly enumerate what the agent is good at. This biases behavior toward those capabilities."

### W4 — §11: YAML Frontmatter Incomplete
**Guide requirement (§11 and §17):** The frontmatter schema should encode `agentType`, `model`, `disallowedTools`, `whenToUse`, and `criticalSystemReminder`.

The current frontmatter:
```yaml
name: gsd-intel-updater
description: Analyzes codebase and writes structured intel files to .planning/intel/.
tools: Read, Write, Bash, Glob, Grep
color: cyan
# hooks:
```

Missing fields:
- `agentMetadata.agentType` — agent type classification
- `agentMetadata.model` — target model specification
- `agentMetadata.whenToUse` — trigger description for the orchestrating model (§17: "Make it action-specific, not capability-generic")
- `agentMetadata.criticalSystemReminder` — safety or scope reminder

The `tools` field uses an allowlist, but the guide (§22 Pattern 9) recommends scoping to minimum patterns with command prefixes where relevant (e.g., `Bash(gsd-sdk:*)` rather than the broad `Bash`).

### W5 — §1: Audience and Quality Bar Not Explicitly Encoded
**Guide requirement (§1 Actions 1–2):** "Identify and make explicit: (a) what output is being requested, (b) why that output matters or how it will be used, and (c) what a correct or high-quality response looks like... Encode the audience explicitly."

The prompt states purpose implicitly ("Your output becomes the queryable knowledge base that other agents and commands use") but never encodes it in an `<audience>` or `<quality_bar>` tag. The downstream consumers (other agents making decisions from this data) have specific requirements — hallucination-free, machine-parseable, path-verified — that should be explicitly stated as a quality bar rather than scattered across prose.

### W6 — §16: Execution Flow Uses Steps Not `<phase>` Tags
**Guide requirement (§16):** "For complex multi-step tasks, organize into explicit named phases using XML tags: `<phase id='1' name='Research and Plan' mode='plan'>`."

The 7-step execution flow uses prose headers (`### Step 1: Orientation`) inside an `<execution_flow>` tag rather than `<phase>` blocks. This loses the `id`, `name`, and `trigger` attributes that allow orchestrators to reference specific phases by name and enables the "complete one phase fully before beginning the next" cognitive boundary the guide describes.

### W7 — §14: Forbidden Files Block Lacks `<constraints>` Structure
**Guide requirement (§14):** Hard exclusion lists should use `<exclusions>` within `<constraints>`. The "Forbidden Files" section is standalone prose with no enclosing `<constraints>` tag. The anti-patterns block has the same issue — its content is behavioral constraints but is wrapped in a non-standard `<anti_patterns>` tag.

---

## Concrete Improvements

### Improvement 1: Rewrite `<anti_patterns>` as `<constraints>` with positive framing

Replace the current `<anti_patterns>` block with:

```xml
<constraints>
  <take_freely>
    - Use Glob, Read, and Grep for all file discovery and content access
    - Base every claim on actual file content read in this session
    - Write files using the Write tool exclusively
    - Verify each path with Glob before including it in output
    - Write incrementally — produce output before consuming 50% of context budget
  </take_freely>

  <exclusions>
    Automatically exclude from all reads and output:
    1. .env files (exception: .env.example and .env.template are permitted)
    2. *.key, *.pem, *.pfx, *.p12 — private keys and certificates
    3. Files with "credential" or "secret" in their name
    4. *.keystore, *.jks — Java keystores
    5. id_rsa, id_ed25519 — SSH keys
    6. node_modules/, .git/, dist/, build/ directories
  </exclusions>

  <reserved_for_human_review>
    - Committing output to version control (the orchestrator handles commits)
  </reserved_for_human_review>
</constraints>
```

### Improvement 2: Replace `<role>` with `<persona>` using strengths enumeration

```xml
<persona>
You are a codebase intelligence specialist for the GSD development system.

Your strengths:
- Deriving accurate file graphs from actual import/export statements
- Producing machine-parseable JSON with zero hallucinated entries
- Prioritizing evidence over inference — every claim references a verified file path
- Working within strict token budgets by focusing on key files over exhaustive listing
- Detecting and adapting to multi-layout project structures
</persona>
```

### Improvement 3: Expand YAML frontmatter to full guide spec

```yaml
---
name: gsd-intel-updater
description: Analyzes codebase and writes structured intel files to .planning/intel/.
tools: Read, Write, Glob, Grep, Bash(gsd-sdk:*), Bash(ls:*)
color: cyan
agentMetadata:
  agentType: intel-updater
  model: sonnet
  whenToUse: >
    Use when codebase intel files need to be created or refreshed. Triggered by /gsd-intel
    with either a full-refresh or partial --files directive. Produces files.json, apis.json,
    deps.json, stack.json, and arch.md in .planning/intel/.
  criticalSystemReminder: >
    CRITICAL: Every intel entry must reference a verified file path. Do not write placeholder
    data. Do not read .env, *.key, *.pem, or credential files under any circumstances.
---
```

### Improvement 4: Convert execution steps to `<phase>` blocks

Replace `### Step N:` prose headers inside `<execution_flow>` with:

```xml
<execution_flow>
  <phase id="1" name="Orientation">
    Glob for project structure indicators: **/package.json, **/tsconfig.json,
    **/pyproject.toml, **/*.csproj, **/Dockerfile, **/.github/workflows/*,
    and entry points: **/index.*, **/main.*, **/app.*, **/server.*
  </phase>

  <phase id="2" name="Stack Detection">
    Read package.json, configs, and build files. Write stack.json.
    Patch timestamp: gsd-sdk query intel.patch-meta .planning/intel/stack.json --cwd <project_root>
  </phase>

  <phase id="3" name="File Graph">
    Glob source files (exclude node_modules/dist/build). Read key files for imports/exports.
    Focus on entry points, core modules, configs. Write files.json and patch timestamp.
  </phase>

  <phase id="4" name="API Surface">
    Grep for route patterns. Write apis.json (empty entries object if no routes found). Patch timestamp.
  </phase>

  <phase id="5" name="Dependencies">
    Read package.json, requirements.txt, go.mod, Cargo.toml. Write deps.json. Patch timestamp.
  </phase>

  <phase id="6" name="Architecture">
    Synthesize patterns from phases 2-5 into arch.md.
  </phase>

  <phase id="6.5" name="Self-Check" trigger="after_phase_6">
    Run: gsd-sdk query intel.validate --cwd <project_root>
    If valid: true — proceed to Phase 7.
    If errors exist — fix indicated files before proceeding.
    THIS PHASE IS MANDATORY. Do not skip.
  </phase>

  <phase id="7" name="Snapshot">
    Run: gsd-sdk query intel.snapshot --cwd <project_root>
    Do NOT write .last-refresh.json manually.
  </phase>
</execution_flow>
```

### Improvement 5: Add explicit `<audience>` and `<quality_bar>` tags

Add immediately after `<persona>`:

```xml
<audience>
Downstream GSD agents and commands that parse .planning/intel/ files programmatically.
Consumers expect: valid JSON, real symbol names, verified file paths, and zero hallucinated entries.
Incorrect intel silently corrupts all downstream agent decisions.
</audience>

<quality_bar>
A correct intel update satisfies all of:
- All JSON files parse without errors
- Every path in entries/ is verified by a Glob or Read call in this session
- No export symbol name contains a space
- All timestamps are patched via gsd-sdk, not manually written
- .last-refresh.json is written by the snapshot command, not by hand
</quality_bar>
```

### Improvement 6: Move loose pre-role instructions into tagged structure

The two lines before `<role>`:
```
**Context budget:** Load project skills first (lightweight)...
> Default files: .planning/intel/stack.json...
```

Should be folded into a `<context>` or `<system_note>` block with clear structure:

```xml
<system_note>
Context budget: Load project skills first (lightweight). Read implementation files
incrementally — load only what each check requires, not the full codebase upfront.

Default state check: Read .planning/intel/stack.json if it exists before beginning
to understand current intel state.
</system_note>
```

---

## Overall Score: 6 / 10

**Justification:** The agent does the hard structural work well — its output schemas are fully specified, its completion protocol is machine-parseable, its constraints on export symbol names are precise, and its execution flow is numbered and mandatory. These are strong §7, §14, and §22 Pattern 3 implementations.

The score is held at 6 by three compounding weaknesses. First, the formatting is fragmented: the agent uses at least three distinct structural systems (custom XML tags, markdown headers, bold prose) where the guide mandates a single XML vocabulary — this produces ambiguous parsing signal for the model. Second, the `<anti_patterns>` block is eight consecutive DO NOT directives, a direct violation of §5 that the guide provides an explicit conversion table to fix. Third, the `<role>`/`<persona>` block describes function rather than behavioral register, and omits the strengths enumeration that §6 explicitly calls out as a bias mechanism. These are all mechanical fixes that would bring the score to 8+.
