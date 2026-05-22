# Critique: docs-update.md

## Summary

`docs-update.md` is a well-engineered, production-grade orchestrator workflow. Its structural architecture is genuinely strong: it uses named `<step>` tags throughout, persists state via a work manifest, handles fallbacks for unavailable runtimes, enforces bounded fix loops with regression detection, and includes a pre-commit secrets scan. The workflow clearly evolved from real operational use. However, it does not apply the guide's prompt-level engineering discipline to the instructions it emits. The agent prompts dispatched to subagents (`gsd-doc-writer`, `gsd-doc-verifier`) are skeletal YAML-style blocks with no persona, no explicit quality bar, no output format specification, and no few-shot examples. The orchestrator itself also lacks a persona and audience declaration, mixes negative instructions into its framing, uses no XML tag vocabulary for top-level structural separation, and provides no tie-breaking rules for its many decision points. These are not cosmetic gaps — they directly affect the consistency and quality of what the spawned agents produce.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase pattern:** The workflow is fully organized into named `<step>` phases with explicit `condition` attributes (`condition="Task tool is available"`, `condition="monorepo_workspaces is non-empty"`). This directly implements the guide's `<phase id name trigger>` pattern.

- **Section 16 — Required vs. type-specific steps:** The always-on doc queue (6 docs, no exceptions) vs. conditional doc queue (up to 3) cleanly maps to the guide's `<required_steps universal="true">` / `<type_specific_strategy>` distinction.

- **Section 16 — Scenario-based branching:** The `sequential_generation` fallback step for runtimes without the `Task` tool is exactly the guide's `<scenarios>` pattern — the orchestrator explicitly handles at least two execution paths rather than leaving inference to the model.

- **Section 17 (Agent and Subagent Patterns) — Parallel spawning in a single message block:** The dispatch steps explicitly require all background agents to be launched in one message (`run_in_background=true` for all three Wave 1 agents simultaneously), matching the guide's single-message-block requirement.

- **Section 13 (Template variable injection):** `{INIT JSON}`, `{doc_writer_model}`, `{AGENT_SKILLS}`, and `$ARGUMENTS` use consistent substitution syntax throughout the workflow.

- **Section 18 (Memory and Continuity):** The `.planning/tmp/docs-work-manifest.json` pattern with mandatory read-at-each-step and status field updates is a strong continuity mechanism that prevents work-item loss across the multi-phase workflow — this matches the spirit of the guide's compaction summary structure.

- **Section 20 (Safety and Trust) — Security check:** The `scan_for_secrets` step before `commit_docs` is a concrete safety gate. It enumerates specific regex patterns, gates on user confirmation, and routes correctly on both outcomes.

- **Section 14 (Constraint Enforcement) — Explicit exclusion:** `CHANGELOG.md is NEVER queued` stated as a hard rule (with the word NEVER) and repeated inline is an effective hard exclusion. The `MAX_FIX_ITERATIONS = 2` cap and regression-halt rule are numeric, bounded constraints.

- **Section 5 (Instruction Framing) — Conditional branching:** Multiple conditional branches use explicit `if/else` prose with literal output templates (`"Abort commit": skip commit_docs`, `"Safe to proceed": continue to commit_docs`), making branching unambiguous.

---

## Issues

### Issue 1: No persona for the orchestrator
**Guide reference:** Section 6 Action 1-2; Section 22 Pattern 1

**What is missing:** The workflow has a `<purpose>` block but no `<persona>` block. There is no role identity, no register constraint, and no strengths listing for the orchestrator agent. The guide states that for open-ended, multi-step orchestration tasks a specific persona biases behavior and prevents defaulting to generic assistant behavior. The orchestrator makes complex judgment calls (gap detection, classification, deciding what counts as a documentation gap) where a domain-specific persona would meaningfully constrain outputs.

**Concrete fix:**
```xml
<persona>
You are a documentation orchestration specialist. Your role is to analyze project structure,
assemble accurate doc queues, and coordinate parallel doc-generation agents.

Your strengths:
- Classifying project types from build signals and file presence
- Detecting documentation coverage gaps by comparing source structure to existing docs
- Managing multi-wave agent dispatch and collecting results without losing work items
- Applying surgical fixes to inaccurate factual claims without restructuring content
</persona>
```

---

### Issue 2: Subagent prompts lack persona, quality bar, and output format specification
**Guide reference:** Section 6 Action 2; Section 7 Action; Section 22 Patterns 2 and 3; Section 1 Action 1

**What is missing:** Every spawned `gsd-doc-writer` agent receives only a `<doc_assignment>` block plus `{AGENT_SKILLS}` and a one-line return instruction. There is no persona defining what a good documentation writer does, no `<quality_bar>` stating what high-quality docs look like, and no `<output_format>` block. The guide requires that structured output tasks specify field names, ordering, constraints, and an example upfront (Pattern 3). Without this, the doc-writer agents calibrate against their own prior of what "documentation" means rather than the project's bar.

**Concrete fix — add to each agent prompt:**
```xml
<persona>
You are a senior technical writer for a developer tools project. Write in present tense,
active voice, and lead every section with the user benefit or the action the reader needs.
Prefer short, scannable prose over exhaustive paragraphs.
</persona>

<quality_bar>
A high-quality doc: (1) contains no claims about the codebase that cannot be verified by
reading the repository, (2) leads with what the reader needs to do or understand, (3) uses
code fences with language tags for all commands, (4) omits internal tooling references.
</quality_bar>

<output_format>
Write the doc file directly to the resolved path. Return a confirmation block only:

## Doc Generation Complete
**Type:** {type}
**Mode:** {mode}
**File written:** `{path}` ({N} lines)
Ready for orchestrator summary.
</output_format>
```

---

### Issue 3: No explicit audience declaration at the workflow level or in agent prompts
**Guide reference:** Section 1 Action 2; Section 4 Action 2 XML tag vocabulary (`<audience>`)

**What is missing:** Neither the orchestrator nor the subagent prompts declare who will consume the generated documentation. The guide requires audience to be encoded explicitly — domain knowledge, vocabulary level, and assumptions. A README for an internal SaaS team reads very differently from one for an open-source library's first-time contributors. The `project_type` signals (e.g., `is_open_source`) are present in the init JSON but the audience derivation is left entirely implicit.

**Concrete fix:** Add audience derivation to the `classify_project` step and propagate it into each `doc_assignment` block:

```xml
<audience>
{Derived from project_type signals:}
- open-source-library: external developers evaluating the project for the first time
- saas: internal engineering team; assume familiarity with the stack
- cli-tool: technical end-users running the tool from a terminal
- monorepo: mixed audience — package consumers for package READMEs, contributors for root docs
</audience>
```

Then include `audience: {derived_value}` as a field in each `<doc_assignment>` block.

---

### Issue 4: Negative instructions used as primary directives throughout
**Guide reference:** Section 5 Action 1

**What is missing:** The workflow uses negative instructions as primary directives in multiple places where positive equivalents should be used. Examples:
- `"CHANGELOG.md is NEVER queued"` — negative exclusion stated as a prohibition
- `"Do NOT use browser_subagent, Explore, or any browser-based tool"`
- `"Agent prompts must contain ONLY the <doc_assignment> block ... Do not include project planning context"`
- `"Do not hardcode a static file list"`
- `"Do not batch multiple docs into one spawn"`

The guide requires converting negative directives to positive specifications of the desired behavior, except for the reframe pattern in Section 6.

**Concrete fix — apply conversion table mechanically:**
```
"Do NOT use browser_subagent, Explore, or browser tools"
→ "Use only file system tools: Read, Bash, Write, Grep, Glob, or runtime equivalents"

"Do not include project planning context in agent prompts"
→ "Agent prompts must contain exactly: the <doc_assignment> block, ${AGENT_SKILLS}, and the return instruction"

"Do not batch multiple docs into one spawn"
→ "Dispatch exactly one agent spawn per doc with failures"

"Do not hardcode a static file list"
→ "Build the file list dynamically from the generation queue — include all docs written to disk"
```

---

### Issue 5: Missing tie-breaking rules for multiple ambiguous decision points
**Guide reference:** Section 5 (Tie-breaking instructions); Section 22 Pattern 4

**What is missing:** The workflow has several decision points where the model must choose between over-inclusion and under-inclusion, but no tie-breaking rule is provided for any of them. Key examples:
1. **Gap detection:** What counts as a "significant" source directory worth documenting? The guide requires a tie-breaking rule matched to the domain's cost asymmetry — in documentation, missing a real gap is more expensive than generating a doc that wasn't strictly needed (recall-biased).
2. **Grouped vs. flat structure detection:** "2+ subdirectories" is the threshold, but what if there is exactly 1 subdirectory with 1 file vs. 3 flat files?
3. **Non-canonical doc identification:** What if a file is at a path that partially matches a canonical path (e.g., `docs/api/v2/API.md`)?

**Concrete fix — add a `<tie_breaking>` block to each ambiguous step. Example for gap detection:**
```xml
<tie_breaking>
When uncertain whether a source directory represents a documentation gap, include it as
a candidate. Surfacing a gap the user chooses to skip is preferable to silently omitting
an area that needed docs. Be inclusive at the detection stage; the user controls selection.
</tie_breaking>
```

---

### Issue 6: No few-shot examples in subagent prompts for the fix mode
**Guide reference:** Section 3 (Few-Shot Example Construction); Section 22 Pattern 2

**What is missing:** The `fix` mode `doc_assignment` block instructs the gsd-doc-writer to make "surgical corrections on specific lines" without showing what a correct vs. incorrect fix looks like. The fix task is a transformation task (failing claim → corrected claim) that is highly amenable to few-shot demonstration. Without examples, the agent has no calibration for what "surgical" means and may restructure or rephrase content beyond the failing claim.

**Concrete fix — add 2-3 few-shot examples to the fix-mode prompt template:**
```xml
<examples>
  <example>
    <input>
    claim: "Run `npm run dev` to start the development server"
    actual: "Script 'dev' not found in package.json"
    </input>
    <output>
    Replace line with: "Run `npm start` to start the development server"
    Change: updated script name only. No other lines modified.
    </output>
  </example>
  <example>
    <input>
    claim: "Configuration lives in `src/config/index.ts`"
    actual: "File not found at src/config/index.ts; found at src/lib/config.ts"
    </input>
    <output>
    Replace line with: "Configuration lives in `src/lib/config.ts`"
    Change: updated path only. No other lines modified.
    </output>
  </example>
</examples>
```

---

### Issue 7: Workflow-level output format is implicit; no `<output_format>` block
**Guide reference:** Section 7 Action; Section 22 Pattern 3

**What is missing:** The `report` step specifies a markdown table format inline using a fenced code block, but this is embedded in prose rather than declared in a formal `<output_format>` block. More critically, the format for what the orchestrator itself outputs to the user — across all the intermediate steps (queue presentation, mode resolution table, verification summary) — is scattered throughout the workflow prose rather than centralized. This makes it harder to audit format consistency and easier for the model to deviate.

**Concrete fix:** Add a top-level `<output_format>` block to the workflow that specifies the orchestrator's output conventions:
```xml
<output_format>
All user-facing output uses markdown. Tables are required for multi-item status displays
(queue, mode resolution, verification results, report). Each table must have a header row.

Confirmation prompts use AskUserQuestion when available; fall back to numbered inline lists
when TEXT_MODE is active. Never present binary choices as open-ended prose.

Internal reasoning and step transitions are not surfaced to the user. Progress is
communicated only through the step-output formats specified in each step.
</output_format>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide, applied to the workflow as a whole (orchestrator + dispatched agent prompts).

### Task Specification
| Item | Score | Notes |
|------|-------|-------|
| Intent, audience, and quality bar are all explicit | FAIL | Intent is in `<purpose>`. Audience and quality bar are absent. |
| All constraints are compatible — no conflicts | PASS | No contradictory constraints detected. |

### Chain-of-Thought
| Item | Score | Notes |
|------|-------|-------|
| CoT included only for appropriate task types | N/A | Orchestrator does not use CoT triggers. |
| CoT trigger phrasing correct | N/A | |
| Reasoning elicited before answer | N/A | |
| CoT traces treated as heuristic only | N/A | |

### Few-Shot Examples
| Item | Score | Notes |
|------|-------|-------|
| Examples selected by semantic similarity | N/A | No examples in orchestrator. |
| 2-5 examples total | FAIL | No examples in dispatched agent prompts for fix mode. |
| Ordered simple to complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format consistent across examples | N/A | |
| Example order fixed across eval runs | N/A | |

### Formatting
| Item | Score | Notes |
|------|-------|-------|
| Instruction complete before formatting applied | PASS | Steps are fully specified before structural details. |
| Prompt sections separated by semantically named XML tags | FAIL | Top-level orchestrator sections use `<step>` tags but lack `<task>`, `<persona>`, `<constraints>`, `<output_format>` vocabulary. Agent prompts use only `<doc_assignment>` with no other structure. |
| At least 3 format variants tested on target model | N/A | No evidence of format testing. |

### Instruction Framing
| Item | Score | Notes |
|------|-------|-------|
| Negative instructions converted to positive equivalents | FAIL | Multiple negative directives used as primary instructions (see Issue 4). |
| Priority order explicit when multiple criteria apply | PASS | Classification table uses "first match wins" ordering. |
| Tie-breaking rules match domain cost asymmetry | FAIL | No tie-breaking rules at any decision point (see Issue 5). |

### Persona
| Item | Score | Notes |
|------|-------|-------|
| Persona included only for appropriate tasks | FAIL | Orchestrator is open-ended and stylistic; persona is absent. |
| Persona specific (constrains voice/register) | FAIL | No persona present. |
| Persona descriptor gender-neutral | N/A | No persona present. |

### Output Format
| Item | Score | Notes |
|------|-------|-------|
| Structured output uses two-step reasoning-then-format | N/A | Not applicable to orchestrator workflow. |
| Single-call JSON places reasoning fields before answer fields | PASS | Manifest JSON schema places metadata before status fields. |
| Constrained decoding adopted only after free-form proven insufficient | N/A | |
| Machine-parsed output uses exact format specification | PASS | Agent return format is specified exactly with literal field labels. |

### Context Placement
| Item | Score | Notes |
|------|-------|-------|
| Task instruction at start of prompt | PASS | `<purpose>` block leads the workflow. |
| Primary document/input at end of prompt | PASS | `project_context: {INIT JSON}` is the last substantive field in each `<doc_assignment>`. |
| Background context in the middle | PASS | Conditional doc logic and path resolution tables appear in middle steps. |
| All irrelevant context removed | PASS | No boilerplate detected. |
| Time-sensitive injected context labeled as snapshot | N/A | No snapshot-style context injected. |

### Self-Consistency
| Item | Score | Notes |
|------|-------|-------|
| Applied only to tasks with a single correct answer | N/A | Not used. |
| Inference budget permits 15-20 samples | N/A | |

### Prompt Length
| Item | Score | Notes |
|------|-------|-------|
| Redundant instructions and repeated context removed | FAIL | The CRITICAL note "Agent prompts must contain ONLY..." appears identically in both `dispatch_wave_1` and `dispatch_wave_2`. Multiple step headers repeat the "Read the work manifest first" instruction verbatim. |
| Long prompts compressed | N/A | |
| RAG context is extracted passage only | PASS | `{INIT JSON}` is passed as structured data, not raw file dumps. |

### System/User Split
| Item | Score | Notes |
|------|-------|-------|
| Persistent instructions in system prompt | N/A | Workflow file serves as the system prompt analog for this orchestrator. |
| Task-specific instructions in user prompt | N/A | |
| Each instruction appears exactly once | FAIL | CRITICAL note duplicated across Wave 1 and Wave 2 dispatch steps. |
| Safety-critical constraints have external validation | PASS | `scan_for_secrets` provides external validation independent of instructions. |

### Agent/Subagent
| Item | Score | Notes |
|------|-------|-------|
| Agent prompts fully self-contained | PASS | Each dispatch block includes full `{INIT JSON}` and `{AGENT_SKILLS}`. |
| All file paths in agent output are absolute | FAIL | `doc_path` and `resolved_path` fields are specified as relative paths in the manifest schema and dispatch blocks (e.g., `README.md`, `docs/ARCHITECTURE.md`). |
| Parallel agents launched in single message block | PASS | Both dispatch steps explicitly require single-message parallel launch. |
| Adversarial probes specified for verification agents | N/A | The verifier is a factual claim checker, not an adversarial agent. |

### Structural Architecture
| Item | Score | Notes |
|------|-------|-------|
| Large prompts decomposed into atomic modules | PASS | The workflow references separate `gsd-doc-writer.md` and `gsd-doc-verifier.md` agents — modular decomposition is implemented. |
| Template variables use `${VARIABLE_NAME}` with fallback | FAIL | Most substitutions use `{curly_brace}` notation without the `$` prefix, inconsistent with the guide's `${VARIABLE_NAME}` syntax. No fallback syntax (`${VAR||"default"}`) is used anywhere. |
| Modules compose at runtime via variable substitution | PASS | `{AGENT_SKILLS}` and `{INIT JSON}` are composed at runtime. |

### Constraint Enforcement
| Item | Score | Notes |
|------|-------|-------|
| Every restriction paired with an equally concrete permission | FAIL | The `scan_for_secrets` step restricts committing on secret detection but does not enumerate what the orchestrator may still do (e.g., generate docs, write manifest). The `dispatch` steps restrict what may appear in agent prompts but do not enumerate permitted content clearly. |
| Hard exclusion lists enumerated, not described qualitatively | PASS | CHANGELOG.md exclusion is explicit. The always-on/conditional doc lists are fully enumerated. |
| Known edge cases have precedent-style rulings | FAIL | No `<precedents>` blocks. Several known edge cases (monorepo + open-source, flat docs/ with exactly one subdirectory, partial path matches) are handled with prose rather than explicit rulings. |
| Confidence thresholds are numeric, not qualitative | N/A | Not applicable to this workflow type. |

### Decision Frameworks
| Item | Score | Notes |
|------|-------|-------|
| Multi-option recommendations use decision tree or comparison table | PASS | Project type classification uses a markdown table with "first match wins" logic. Path resolution uses a prioritized resolution chain. |
| Criteria checklists gate complex approaches | PASS | `<success_criteria>` checklist at the end of the workflow enumerates gate conditions. |
| Action permissions framed around reversibility | FAIL | The `preservation_check` step distinguishes preserve/supplement/regenerate but does not frame these around reversibility (regenerate = destructive, irreversible; preserve = safe). No explicit reversibility framing is used. |

### Multi-Phase Workflows
| Item | Score | Notes |
|------|-------|-------|
| Complex tasks organized into explicit named phases | PASS | All steps use `<step name="...">` tags. |
| Required steps distinguished from type-specific steps | PASS | Always-on (6) vs. conditional doc queue is clearly separated. |
| Scenario-based branching handles multiple paths explicitly | PASS | `sequential_generation` fallback step and `verify_only_report` early-exit are explicit scenario branches. |

### Memory and Continuity
| Item | Score | Notes |
|------|-------|-------|
| Memory templates use XML tags as section labels | PASS | Work manifest JSON schema serves this role; each step updates specific status fields. |
| Compaction summaries include discoveries and failed approaches | PASS | `report` step includes skipped/failed docs and remaining unfixed failures. |
| Next steps tied to user's most recent explicit request | N/A | Workflow is procedural; next steps are step transitions, not session continuity. |

### Modularity
| Item | Score | Notes |
|------|-------|-------|
| Each prompt component has single responsibility | PASS | Orchestrator, doc-writer, and doc-verifier are separate files with distinct roles. |
| Scope boundaries state inclusions and exclusions | PASS | `build_doc_queue` step states both what is always included and what is explicitly excluded (CHANGELOG.md). |

### Safety and Trust
| Item | Score | Notes |
|------|-------|-------|
| Validation at system boundaries only | PASS | Secrets scan validates generated output before external commit action. |
| Dual-use capabilities state permissions before restrictions | FAIL | `scan_for_secrets` states restrictions (SECURITY ALERT, abort path) before permissions (safe-to-proceed path). The `preservation_check` states the danger (regenerate = overwrite) before the safe options. |
| Authorization is narrow-scoped; each action confirmed | PASS | User confirmation gating on: doc queue proceed/abort, CONTRIBUTING.md creation, secrets-found commit decision, preservation per-file. |

### Tone and Style
| Item | Score | Notes |
|------|-------|-------|
| Size constraints use numeric limits | PASS | `MAX_FIX_ITERATIONS = 2`, `timeout: 300000`, max 9 docs, 2-5 count limits. |
| Instructions use imperative present tense | PASS | Steps predominantly use imperative present tense ("Spawn", "Read", "Write", "Present"). |
| Working notes in analysis tags, not user-facing output | FAIL | No `<analysis>` or `<thinking>` tags are used anywhere. Internal orchestration reasoning (e.g., wave sequencing rationale) is embedded in step prose rather than isolated from user-visible output. |

### Optimization
| Item | Score | Notes |
|------|-------|-------|
| Prompt flagged as draft for automated optimization | FAIL | Not flagged. |
| Correct optimizer selected | N/A | Not applicable. |
| Held-out test set reserved | N/A | Not applicable. |

---

## Recommendations

Prioritized by impact on output quality and consistency.

### 1. Add persona and quality bar to all subagent dispatch prompts (High Impact)
**Affects:** Every doc the workflow generates.

The guide's Pattern 2 requires every abstract instruction paired with a calibrating example, and Section 6 Action 2 requires specific personas. Currently, dispatched agents receive no persona and no quality bar — they calibrate against their own prior. Add a `<persona>` block (senior technical writer, active voice, user-benefit-led), a `<quality_bar>` (no unverifiable claims, code-fenced commands, no internal tooling references), and a formal `<output_format>` block specifying the exact confirmation response format to every dispatch template. Apply the same additions to the `fix` mode dispatch, and include 2-3 few-shot examples in fix mode showing surgical claim correction with no surrounding content changed (Section 3 Action 1; Section 22 Patterns 2, 3).

### 2. Add tie-breaking rules to gap detection, structure classification, and path resolution (High Impact)
**Affects:** Correctness of the queue assembly step, which gates everything downstream.

The three most ambiguous decision points — gap detection, grouped-vs-flat structure detection, and non-canonical path matching — each need a `<tie_breaking>` block that reflects the domain's cost asymmetry (Section 5). For gap detection, recall-biased (include uncertain gaps, let user filter). For structure detection, a clear numeric threshold needs a fallback rule for the boundary case. Add these blocks directly inside the affected `<step>` tags rather than as separate sections, keeping them co-located with the logic they govern (Section 22 Pattern 4).

### 3. Convert negative primary directives to positive equivalents throughout (Medium Impact)
**Affects:** Instruction clarity and compliance, particularly in dispatch steps and sequential_generation.

Apply the guide's Section 5 Action 1 conversion table mechanically to every instance of "do not", "never", "must not", and "do NOT" used as a primary directive. The affected locations are: `sequential_generation` (tool restrictions), both `dispatch_wave_*` CRITICAL notes (agent prompt content restrictions), `fix_loop` (batching restriction), and `scan_for_secrets` (hardcoded list restriction). The resulting positive specifications are more directive and less ambiguous.

### 4. Add persona to the orchestrator and deduplicate repeated instructions (Medium Impact)
**Affects:** Orchestrator consistency across classification and gap detection; prompt token efficiency.

Add a `<persona>` block at the top of the workflow defining the orchestrator's role, domain focus, and strengths (Section 6; Section 22 Pattern 1). Separately, the CRITICAL note about agent prompt content appears verbatim in both `dispatch_wave_1` and `dispatch_wave_2` — consolidate it to a single `<constraints>` block at the top level and reference it by name in each dispatch step. This follows Section 11 Action 3 (each instruction exactly once) and reduces prompt length (Section 10 Action 1).

### 5. Switch to absolute paths in agent dispatch blocks and manifest schema (Low Impact, High Reliability)
**Affects:** Agent file write reliability across bash call boundaries.

The guide's Section 17 requires all file paths in agent output to be absolute. The work manifest schema and all `doc_path` / `resolved_path` fields currently use relative paths (e.g., `README.md`, `docs/ARCHITECTURE.md`). These break silently when the working directory changes between agent bash calls. Change all path fields to absolute paths using `{project_root}` as the prefix, and add a note to the manifest schema specifying that all paths are absolute. This is a low-effort change with a clear failure mode that the current design leaves open.
