# Critique: map-codebase.md

## Summary

`map-codebase.md` is a well-structured, multi-phase orchestration workflow that handles the common problem of parallel vs. sequential execution fallback cleanly. It demonstrates strong practical engineering instincts: explicit step sequencing, security scanning before commit, scenario-based branching for tool availability, and self-contained agent prompts. However, the workflow falls short of the guide's prompt engineering standards in several areas that matter at scale: the agent sub-prompts lack structured XML sections, no audience or quality bar is declared, negative framing appears in multiple steps, output format for the completion summary is only partially specified, and the workflow is not flagged as a candidate for automated optimization. These are not cosmetic issues — missing `<output_format>` and `<quality_bar>` in sub-agent prompts directly affect consistency of the 7 generated documents across runs.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase pattern applied correctly.** Steps are named, ordered, and carry explicit conditions (`condition="Task tool is available"`, `condition="Task tool is NOT available"`). This is exactly the `<phase>` / `<scenario>` pattern the guide calls for.

- **Section 17 (Agent and Subagent Patterns) — Parallel spawning in a single message block.** The `spawn_agents` step correctly instructs spawning all 4 agents with `run_in_background=true` in one message, fulfilling the guide's single-message requirement for true parallelism.

- **Section 17 — Absolute path discipline.** The `<philosophy>` block explicitly requires backtick-formatted file paths in all generated documents, which aligns with Section 17's constraint on absolute paths in agent output.

- **Section 20 (Safety and Trust Patterns) — `scan_for_secrets` step.** Proactive secret scanning before commit is a well-placed safety gate. The pattern correctly pauses for user confirmation rather than auto-proceeding, respecting Section 20's narrow authorization scope principle.

- **Section 16 — Required-vs-type-specific distinction.** The `verify_output` step includes a concrete verification checklist (`all 7 documents exist`, `each should have >20 lines`) that distinguishes mandatory acceptance criteria from contextual pass/fail — similar in spirit to the guide's `<required_steps universal="true">` pattern.

- **Section 5 (Instruction Framing) — Conditional branching is explicit.** The `detect_runtime_capabilities` step uses explicit `if/then` branching language ("If you do NOT have a Task/task tool... go directly to `sequential_mapping`") matching the guide's conditional instruction pattern.

- **Section 13 (Structural Architecture Patterns) — Template variable injection.** The use of `{mapper_model}`, `{date}`, `{subagent_timeout}`, `${AGENT_SKILLS_MAPPER}` follows the guide's `${VARIABLE_NAME}` substitution pattern for runtime context injection.

---

## Issues

### Issue 1 — Missing `<task>`, `<output_format>`, and `<quality_bar>` in sub-agent prompts

**Principle:** Section 1 Action 1 (extract intent, audience, quality bar); Section 4 Action 2 (XML tags to separate prompt sections); Section 7 / Pattern 3 (output format specified completely and upfront).

**What's wrong:** Each agent sub-prompt (Tech, Architecture, Quality, Concerns) is delivered as unstructured prose. There is no `<task>` wrapper, no `<output_format>` specifying what a well-formed document looks like, and no `<quality_bar>` stating what constitutes a complete, useful mapping document. The phrase "Explore thoroughly. Write documents directly using templates. Return confirmation only." is vague — "thoroughly" is a qualitative term (Section 21: "Brief means different things; under 8 words does not"), and "templates" are referenced but never defined in the sub-prompt (they exist only in the mapper agent's own prompt, which is invisible here).

**Concrete fix:**

```xml
prompt="<task>
You are a codebase mapper. Analyze this codebase for technology stack and external integrations.
Write these two documents to .planning/codebase/:
- STACK.md
- INTEGRATIONS.md
Today's date: {date}. Use it for all [YYYY-MM-DD] placeholders.
</task>

<quality_bar>
Each document must: (1) include actual file paths formatted with backticks, (2) contain at least 20 lines of non-boilerplate content, (3) cover every sub-section in the template. A document with placeholder text or fewer than 20 lines is incomplete.
</quality_bar>

<output_format>
Return confirmation only, in exactly this format:

## Mapping Complete
**Focus:** tech
**Documents written:**
- `.planning/codebase/STACK.md` (N lines)
- `.planning/codebase/INTEGRATIONS.md` (N lines)
</output_format>

${AGENT_SKILLS_MAPPER}"
```

This applies Section 4 Action 2, Section 1 Action 1 (quality bar), and Pattern 3 (output format upfront).

---

### Issue 2 — Negative instructions not converted to positive equivalents

**Principle:** Section 5 Action 1 (convert negatives to positives).

**What's wrong:** Multiple steps use "do not / never / NOT" as primary directives rather than positive specifications:
- `detect_runtime_capabilities`: "Never use `browser_subagent` or `Explore` as a substitute for `Task`."
- `spawn_agents`: "**CRITICAL:** Use the dedicated `gsd-codebase-mapper` agent, NOT `Explore` or `browser_subagent`."
- `sequential_mapping`: "**IMPORTANT:** Do NOT use `browser_subagent`, `Explore`, or any browser-based tool."

The guide's conversion table applies directly here: negative directives should be replaced with what to do instead.

**Concrete fix:**

Replace `detect_runtime_capabilities` negative:
```
BEFORE: Never use `browser_subagent` or `Explore` as a substitute for `Task`.
AFTER:  Use only `Task` for subagent delegation. If `Task` is unavailable, execute mapping sequentially in-context using file system tools (Read, Bash, Write, Grep, Glob).
```

Replace `spawn_agents` negative:
```
BEFORE: NOT `Explore` or `browser_subagent`
AFTER:  The correct agent is `gsd-codebase-mapper`. It writes documents directly; Explore and browser tools do not.
```

---

### Issue 3 — No audience declaration (Section 1 Action 2)

**Principle:** Section 1 Action 2 (identify and encode the audience explicitly).

**What's wrong:** The workflow's `<purpose>` block describes what is produced but not who consumes it or what they will do with it. The 7 generated documents serve different downstream consumers: `STACK.md` and `ARCHITECTURE.md` are read by planning agents; `CONCERNS.md` is read by developers triaging debt; `CONVENTIONS.md` is read by code-generation agents. Without an explicit audience, each sub-agent mapper defaults to a generic documentation register rather than one calibrated to machine or human reader needs.

**Concrete fix:**

Add to `<philosophy>`:
```xml
<audience>
Primary consumers of generated documents:
- Planning agents (STACK.md, ARCHITECTURE.md, STRUCTURE.md) — machine-readable; prefer structured lists, file paths, and short explanations over prose.
- Developers reviewing technical debt (CONCERNS.md) — human-readable; prioritize actionable findings with file paths and estimated effort.
- Code-generation agents (CONVENTIONS.md, TESTING.md) — machine-readable; prefer concrete examples and pattern references over general descriptions.
</audience>
```

This satisfies Section 1 Action 2 and directly improves mapper sub-prompt output quality.

---

### Issue 4 — Persona absent for mapper sub-agents (Section 6)

**Principle:** Section 6 Action 2 (personas must constrain register, voice, or domain-specific style); Pattern 1 (role identity scoped to exact domain).

**What's wrong:** The mapper sub-prompts (`Focus: tech`, `Focus: arch`, etc.) include no persona. Each agent receives a focus label and a vague "explore thoroughly" instruction with no role-framing. The guide's role-domain mapping table gives a concrete example: for Exploration tasks, the effective persona is "File search specialist. You excel at thoroughly navigating and exploring codebases." — not omitting the persona entirely. Per Section 6 Action 1, personas are appropriate here because the mapper task is open-ended (the agent decides what to examine and how to present it).

**Concrete fix:**

Add to each sub-agent prompt preamble:
```xml
<persona>
You are a codebase documentation specialist. Your job is to read code, not summarize what code usually does. Cite actual file paths, real dependency names, and concrete patterns you observe — never describe what a codebase of this type typically contains.
</persona>
```

This uses the reframe pattern (Section 6) to displace the common failure mode of generic, speculative documentation.

---

### Issue 5 — Output format for `offer_next` completion message is partially specified but not machine-parseable

**Principle:** Section 7 / Pattern 3 (output format specified completely and upfront); Section 21 (size constraints as hard rules, numeric not qualitative).

**What's wrong:** The `offer_next` step provides a markdown output template with `[N]` line-count placeholders but no explicit instruction on what to do when a document is missing (partially failed run), and the "Next Up" block uses template variables (`${PROJECT_CODE}`, `${PROJECT_TITLE}`) without a fallback definition (Section 13: `${VAR||"(default value)"}`). Additionally, "Also available" suggestions reference slash commands that may not be valid across all runtimes — no conditional is applied.

**Concrete fix:**

Add explicit fallback to the template variables:
```
${PROJECT_CODE||"[PROJECT]"} ${PROJECT_TITLE||"[Untitled Project]"}
```

Add a missing-document clause before the summary:
```
If any documents are missing (agent failure), list them as:
- MISSING.md — [reason if known, otherwise: agent did not complete]
```

Add a numeric constraint to the line-count display:
```
Show line counts as integers only (e.g., 47, not "~50" or "about 47 lines").
```

---

### Issue 6 — No CoT trigger for the orchestrator's decision logic (Section 2)

**Principle:** Section 2 (chain-of-thought for multi-step logic tasks).

**What's wrong:** The `check_existing` and `detect_runtime_capabilities` steps require the orchestrator to make branching decisions based on runtime state — exactly the kind of multi-step conditional logic the guide marks as appropriate for CoT triggering. There is no reasoning scaffold ("Take a deep breath and work on this problem step-by-step.") or `<analysis>` scratchpad instruction before these decision points. As a result, the orchestrator may misclassify tool availability or misparse the init JSON on edge cases.

**Concrete fix:**

Add to `init_context` step:
```
Before branching on `has_maps`, `codebase_dir_exists`, or tool availability, work through each condition explicitly:
1. What does the init context report for `codebase_dir_exists`?
2. What tools are listed in your available tool set — is `Task` present by name?
3. Only then proceed to the appropriate step.
```

This is a lightweight CoT trigger that does not require `<reasoning>` / `<answer>` XML wrapping — inline numbered reasoning is sufficient for workflow decision steps.

---

### Issue 7 — Prompt not flagged as optimization candidate (Section 12)

**Principle:** Section 12 Action 1 (treat every manually constructed prompt as a draft; flag for automated optimization).

**What's wrong:** This is a manually constructed, multi-LLM-call pipeline — exactly the case the guide assigns to DSPy MIPROv2 optimization. The sub-agent prompts are handcrafted and have never been validated against a benchmark. There is no flag in the file noting this.

**Concrete fix:**

Add to `<purpose>` block or as a comment at the bottom of the file:
```xml
<!-- Optimization candidate: multi-stage pipeline with 4 LLM calls. Candidate for DSPy MIPROv2 joint optimization across sub-agent prompts. Reserve a held-out test set of 3–5 real codebases before running optimization. See PROMPT_ENGINEERING_GUIDE Section 12. -->
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide as applied to `map-codebase.md` in its role as an orchestrator prompt that also contains embedded sub-agent prompts.

### Task Specification
| Item | Score | Notes |
|------|-------|-------|
| Intent, audience, and quality bar are all explicit | FAIL | Intent is clear; audience and quality bar are absent (Issues 3, 1) |
| All constraints are compatible — no conflicts | PASS | No conflicting constraints detected |

### Chain-of-Thought
| Item | Score | Notes |
|------|-------|-------|
| CoT included only for appropriate task types | FAIL | Multi-step conditional decisions have no CoT trigger (Issue 6) |
| Reasoning elicited before answer | N/A | No CoT present to evaluate |
| CoT traces treated as heuristic aids | N/A | |

### Few-Shot Examples
| Item | Score | Notes |
|------|-------|-------|
| Examples selected by semantic similarity | N/A | No few-shot examples present |
| 2–5 examples total | N/A | |
| Ordered simple → complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format consistent across examples | N/A | |
| Example order fixed across evaluation runs | N/A | |

### Formatting
| Item | Score | Notes |
|------|-------|-------|
| Instruction complete before formatting applied | PASS | Steps are fully specified in prose |
| Prompt sections separated by semantically named XML tags | PASS | `<purpose>`, `<philosophy>`, `<process>`, `<step>`, `<success_criteria>` used throughout |
| At least 3 format variants tested on target model | FAIL | No evidence of format variant testing |

### Instruction Framing
| Item | Score | Notes |
|------|-------|-------|
| Negative instructions converted to positives | FAIL | Multiple "never / do not / NOT" primary directives (Issue 2) |
| Priority order explicit when multiple criteria apply | PASS | `priority="first"` on init_context; step ordering is explicit |
| Tie-breaking rules match domain cost asymmetry | N/A | No filtering task requiring tie-breaking |

### Persona
| Item | Score | Notes |
|------|-------|-------|
| Persona included only for open-ended/stylistic tasks | FAIL | Open-ended mapper sub-prompts have no persona (Issue 4) |
| Persona is specific, not generic | N/A | No persona present to evaluate |
| Persona descriptor is gender-neutral | N/A | |

### Output Format
| Item | Score | Notes |
|------|-------|-------|
| Structured output uses two-step reasoning-then-format | N/A | Not a structured JSON output task |
| Single-call JSON places reasoning fields before answer fields | N/A | |
| Constrained decoding adopted only after free-form insufficient | N/A | |
| Machine-parsed output uses exact format specification | FAIL | Confirmation format in `collect_confirmations` is advisory, not enforced in sub-agent prompts (Issue 1) |

### Context Placement
| Item | Score | Notes |
|------|-------|-------|
| Task instruction at start of prompt | PASS | `<purpose>` leads; steps follow |
| Primary document/input at end of prompt | N/A | No dynamic input document |
| Background context in middle | PASS | `<philosophy>` is mid-document background |
| All irrelevant context removed | PASS | Steps are focused; no detectable bloat |
| Time-sensitive injected context labeled as snapshot | FAIL | `{date}` is injected without a snapshot label; `init_context` JSON is not labeled as point-in-time |

### Self-Consistency
| Item | Score | Notes |
|------|-------|-------|
| Applied only to tasks with single correct answer | N/A | Not applicable to this workflow type |
| Inference budget permits 15–20 samples | N/A | |

### Prompt Length
| Item | Score | Notes |
|------|-------|-------|
| Redundant instructions removed | PASS | The "IMPORTANT: Use {date}" instruction appears in every sub-prompt — minor duplication, but intentional for agent self-containment |
| Long prompts compressed before sending | N/A | |
| RAG context is extracted passage only | N/A | |

### System / User Split
| Item | Score | Notes |
|------|-------|-------|
| Persistent instructions in system prompt | PASS | `${AGENT_SKILLS_MAPPER}` carries persistent mapper instructions |
| Task-specific instructions in user prompt | PASS | Focus and date are task-specific |
| Each instruction appears in exactly one location | PASS | |
| Safety-critical constraints have external validation | PASS | `scan_for_secrets` provides external validation independent of the prompt |

### Agent / Subagent
| Item | Score | Notes |
|------|-------|-------|
| Agent prompts are fully self-contained | FAIL | Sub-agent prompts reference "templates" without defining them in the prompt body (Issue 1) |
| All file paths in agent output are absolute | PASS | `<philosophy>` requires backtick-formatted paths; `collect_confirmations` confirms with paths |
| Parallel agents launched in single message block | PASS | Explicitly stated in `spawn_agents` step |
| Adversarial probes specified for verification agents | N/A | No verification agent in this workflow |

### Structural Architecture
| Item | Score | Notes |
|------|-------|-------|
| Large prompts decomposed into atomic modules | PASS | Workflow composes `${AGENT_SKILLS_MAPPER}` as a separate injectable module |
| Template variables use `${VARIABLE_NAME}` syntax with fallback | FAIL | `${PROJECT_CODE}` and `${PROJECT_TITLE}` in `offer_next` lack fallback values (Issue 5) |
| Modules compose at runtime via variable substitution | PASS | |

### Constraint Enforcement
| Item | Score | Notes |
|------|-------|-------|
| Every restriction paired with concrete permission | FAIL | "Do NOT use browser_subagent" has no paired positive permission list (Issue 2) |
| Hard exclusion lists enumerated, not qualitative | PASS | Specific tool names are listed (browser_subagent, Explore) |
| Known edge cases have precedent-style rulings | PASS | The `sequential_mapping` step handles the known edge case of Task tool unavailability |
| Confidence thresholds are numeric, not qualitative | N/A | No filtering task requiring thresholds |

### Decision Frameworks
| Item | Score | Notes |
|------|-------|-------|
| Multi-option recommendations use decision tree or table | PASS | `detect_runtime_capabilities` uses an explicit if/then decision tree |
| Criteria checklists gate complex approaches | PASS | `verify_output` has a concrete checklist |
| Action permissions framed around reversibility | PASS | `scan_for_secrets` gates the irreversible commit action |

### Multi-Phase Workflows
| Item | Score | Notes |
|------|-------|-------|
| Complex tasks organized into explicit named phases | PASS | All steps are named with `name=` attributes |
| Required steps distinguished from type-specific steps | PASS | `verify_output` and `scan_for_secrets` are universal; `spawn_agents` vs `sequential_mapping` are type-specific |
| Scenario-based branching handles multiple paths explicitly | PASS | Conditions on `spawn_agents` and `sequential_mapping` steps |

### Memory and Continuity
| Item | Score | Notes |
|------|-------|-------|
| Memory templates use XML tags as section labels | N/A | Not a memory workflow |
| Compaction summaries include discoveries and failed approaches | N/A | |
| Next steps tied to user's most recent explicit request | PASS | `offer_next` directly follows the task just completed |

### Modularity
| Item | Score | Notes |
|------|-------|-------|
| Each prompt component has a single responsibility | PASS | Each step has one named concern |
| Scope boundaries state both inclusions and exclusions | FAIL | `sequential_mapping` lists what tools to use but does not state what is out of scope for each pass |

### Safety and Trust
| Item | Score | Notes |
|------|-------|-------|
| Validation at system boundaries only | PASS | `scan_for_secrets` validates agent outputs before external action (commit) |
| Dual-use capabilities state permissions before restrictions | FAIL | Secret scanning warning leads with the threat before the permitted action (minor; low severity) |
| Authorization narrow-scoped; each action confirmed before expanding | PASS | Commit is gated behind secret scan and user confirmation |

### Tone and Style
| Item | Score | Notes |
|------|-------|-------|
| Size constraints use numeric limits, not qualitative descriptors | FAIL | "Explore thoroughly" is qualitative; "at least >20 lines" in verify_output is the only numeric constraint (Issue 1) |
| Instructions use imperative present tense | PASS | Steps predominantly use imperative ("Spawn", "Wait", "Verify", "Commit") |
| Working notes in analysis tags, not user-facing output | N/A | No working notes surfaced |

### Optimization
| Item | Score | Notes |
|------|-------|-------|
| Prompt flagged as draft for automated optimization | FAIL | Not flagged (Issue 7) |
| Correct optimizer selected | FAIL | Not selected; multi-stage pipeline suggests MIPROv2 |
| Held-out test set reserved before optimization | FAIL | Not mentioned |

---

## Recommendations

Listed in priority order by impact on output quality and consistency.

### 1. Add `<output_format>` and `<quality_bar>` to every sub-agent prompt (Issues 1, 5)

This is the highest-impact change. The 7 generated documents are the entire deliverable of this workflow. Without an explicit output format enforced in each sub-prompt, document structure varies per agent run, making the maps unreliable as machine-readable planning inputs. Apply Section 1 Action 1 and Pattern 3: add a `<quality_bar>` (minimum 20 lines, all file paths in backticks, all template sections populated) and an exact `<output_format>` for the confirmation message to each of the 4 agent prompts.

### 2. Convert all negative primary directives to positive equivalents (Issue 2)

Three steps use "never / do not / NOT" as the primary directive. Per Section 5 Action 1, rewrite each as a positive specification: instead of "Never use browser_subagent," write "Use only `Task` for subagent delegation; if unavailable, execute mapping sequentially in-context using file system tools." This eliminates ambiguity about what is permitted and reduces the risk of the model fixating on the excluded tool rather than the permitted one.

### 3. Add a persona to each sub-agent prompt (Issue 4)

The mapper agents perform open-ended exploration — the exact task type Section 6 identifies as persona-appropriate. Add a domain-specific persona that constrains the agent to cite only observed facts (file paths, actual dependency names, concrete patterns) and not generic descriptions of what this kind of codebase "typically" contains. Use the reframe pattern: "Your job is not to describe what a typical Node.js project looks like — it's to document what this one actually contains."

### 4. Declare audience in `<philosophy>` (Issue 3)

Different documents serve different consumers (planning agents vs. human developers vs. code-generation agents). Adding a short `<audience>` block to `<philosophy>` will propagate into sub-agent context via `${AGENT_SKILLS_MAPPER}` if that variable is structured to include it, or can be injected per sub-prompt. This directly affects the register and level of detail each mapper agent uses.

### 5. Add optimization flag and fallback syntax for template variables (Issues 5, 7)

These are low-effort, high-correctness fixes. Add `${PROJECT_CODE||"[PROJECT]"}` fallback syntax to prevent broken output when project variables are undefined at runtime (Section 13). Add an HTML comment flagging the workflow as a MIPROv2 optimization candidate (Section 12 Action 1) — this costs nothing and ensures the prompt is treated as a draft rather than a final artifact.
