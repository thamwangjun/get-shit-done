# Critique: ui-review.md

## Summary

`ui-review.md` is a solid operational workflow with a clear purpose and a logical sequence of phases. It handles the most important orchestration concerns well: detecting prior work before overwriting it, building context before spawning a subagent, and presenting a structured score summary after completion. However, it consistently operates at the level of markdown prose and bash pseudocode rather than making full use of the XML structural vocabulary the guide mandates. The subagent prompt is constructed inline as a markdown block rather than a semantically tagged XML document, the workflow's own instructions mix metadata (purpose, required reading) with procedural steps without separation, and several structural concerns — quality bar, audience, constraint pairs, output format specification — are either implicit or absent. The result is a workflow that works in practice but is brittle to extend and weaker than it could be as a prompt surface.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase sequencing applied.** The workflow is decomposed into numbered, named steps (Initialize, Detect Input State, Gather Context, Spawn Auditor, Handle Return, Commit) that form clear cognitive boundaries. The model is directed to complete each step before the next.

- **Section 16 — Scenario-based branching applied.** The "If SUMMARY_FILES empty → exit", "If UI_REVIEW_FILE non-empty → ask user" branching is explicit, covering the main execution paths rather than leaving the model to infer.

- **Section 5 — Conditional instructions used correctly.** The `TEXT_MODE` detection and fallback for non-Claude runtimes (OpenAI Codex, Gemini CLI) is a well-formed conditional with explicit trigger logic.

- **Section 17 (Agent and Subagent Patterns) — Agent type is named and constrained.** `<available_agent_types>` lists the exact subagent type and forbids generic fallback, which narrows blast radius and makes spawning deterministic.

- **Section 13 — Template variable injection used.** Variables like `{phase_number}`, `{phase_name}`, `{padded_phase}`, and `${AGENT_SKILLS_UI_REVIEWER}` follow the `${VARIABLE_NAME}` convention, enabling runtime composition.

- **Section 22 Pattern 3 — Output format specified for the score summary.** The score display block after completion is fully specified: pillar names, score denominator (N/4, total/24), top-fixes count, and file path — making the expected terminal output unambiguous.

- **Section 16 — Status and next-steps block is included.** The "Next" section after audit completion surfaces the two most relevant follow-on commands, preventing the user from having to recall them.

---

## Issues

### Issue 1 — No XML structural tags wrapping prompt sections (Section 4 Action 2)

**Principle:** Section 4 Action 2 requires that "when a prompt contains multiple distinct sections (instruction, context, input, output cue), wrap each in a semantically named XML tag." Section 4 also states this is "strictly better than markdown headers or `---` delimiters for Claude-class models."

**What's wrong:** The workflow file itself uses markdown `##` headers and `<purpose>`, `<required_reading>`, `<available_agent_types>`, `<process>`, `<success_criteria>` tags inconsistently. `<purpose>` and `<required_reading>` are XML tags, but `<process>` wraps a long markdown prose block rather than structuring its phases as XML. `<success_criteria>` uses a markdown checklist inside an XML tag. The workflow-level document has no `<task>`, `<context>`, `<constraints>`, or `<output_format>` wrapper, so the model receives no semantic signal about what type of content it is reading.

**Concrete fix:** Restructure the top-level document with standard vocabulary tags:

```xml
<task>
Orchestrate a retroactive 6-pillar visual audit of an implemented frontend phase.
</task>

<context>
This workflow runs after /gsd-execute-phase. It reads execution summaries,
optionally reads a UI-SPEC.md design contract, then spawns a gsd-ui-auditor
subagent to produce a scored UI-REVIEW.md.
</context>

<constraints>
  <permitted>Read phase dir files, query gsd-sdk, spawn gsd-ui-auditor subagent, commit result.</permitted>
  <reserved_for_human_review>Overwriting an existing UI-REVIEW.md — prompt user first.</reserved_for_human_review>
</constraints>
```

Then wrap each phase using `<phase id="N" name="...">` tags (Section 16) rather than `## N. Name` markdown headers.

---

### Issue 2 — Subagent prompt is prose markdown, not XML-tagged (Section 4 Action 2, Section 17)

**Principle:** Section 4 Action 2 mandates XML tags for prompt sections. Section 17 specifies the canonical subagent task structure: `<task>`, `<goal>`, `<unit_task>`, `<conventions>`, `<e2e_recipe>`, `<worker_instructions>`. Section 22 Pattern 3 requires output format to be specified completely and upfront.

**What's wrong:** The subagent prompt in Step 3 is constructed as a fenced markdown block with a single `<objective>` and `<files_to_read>` tag, then raw variable interpolation. There is no `<task>` wrapper, no `<output_format>` specifying what UI-REVIEW.md must contain, no `<quality_bar>` defining what a complete audit looks like, and no `<constraints>` on what the auditor may or may not do. The subagent is told to "Read ~/.claude/agents/gsd-ui-auditor.md for instructions" — deferring structure to a separate file that is not visible here, making this prompt not self-contained.

**Concrete fix:** Replace the fenced-markdown prompt block with a fully tagged prompt:

```xml
<task>
  <goal>Conduct a 6-pillar visual audit of Phase {phase_number}: {phase_name} and produce a scored UI-REVIEW.md.</goal>
  <unit_task>
    Audit the phase's implemented UI against the 6 pillars: Copywriting, Visuals, Color,
    Typography, Spacing, Experience Design. Score each pillar 0–4. Write findings to
    {phase_dir}/{padded_phase}-UI-REVIEW.md.
    {If UI-SPEC exists: "Audit against UI-SPEC.md design contract."}
    {If no UI-SPEC: "Audit against abstract 6-pillar standards."}
  </unit_task>
  <conventions>{codebase and brand conventions from ui-brand.md}</conventions>
  <worker_instructions>
    Read the following files: {summary_paths}, {plan_paths}, {ui_spec_path}, {context_path}.
    Omit any path that does not exist.
  </worker_instructions>
</task>

<output_format>
Write UI-REVIEW.md to {phase_dir}/{padded_phase}-UI-REVIEW.md.
End your response with the literal line: ## UI REVIEW COMPLETE
This token is parsed by the orchestrator — use it verbatim, no markdown bold, no variation.

Score format per pillar:
  ## {Pillar Name} — {N}/4
  Findings: ...
</output_format>
```

---

### Issue 3 — Intent, audience, and quality bar are not explicit (Section 1 Actions 1–2, Section 23 checklist)

**Principle:** Section 1 Action 1 requires the three task components to be explicit: (a) what output is requested, (b) why it matters, and (c) what a correct/high-quality response looks like. Section 1 Action 2 requires the audience to be encoded in the prompt.

**What's wrong:** `<purpose>` states the output ("scored UI-REVIEW.md with actionable findings") but does not state why it matters (the downstream use — informing design fixes before UAT), who consumes it (a developer or designer reviewing the audit report), or what a high-quality audit looks like (e.g., minimum finding depth, what constitutes a 4/4 vs 2/4 score). The guide's `<quality_bar>` and `<audience>` tags are absent entirely.

**Concrete fix:** Add these blocks near the top of the document:

```xml
<audience>
The developer who implemented the phase. They have full codebase access and will act on
specific, file-referenced findings. They are not a designer — avoid design jargon without
explanation.
</audience>

<quality_bar>
A high-quality audit: (1) cites specific files and line numbers for each finding,
(2) scores each pillar on a 0–4 scale with written justification, (3) distinguishes
must-fix issues from nice-to-have improvements, (4) includes at least one positive
observation per pillar to confirm what is working.
</quality_bar>
```

---

### Issue 4 — No explicit constraint pairs; permissions are implicit (Section 14)

**Principle:** Section 14 requires every restriction to be paired with what IS permitted, stated equally concretely. The guide's `<permitted>` / `<reserved_for_human_review>` pattern makes the permission surface auditable.

**What's wrong:** The workflow implies the auditor may read files and write UI-REVIEW.md, but never states this explicitly. It also implies it should not overwrite an existing review without asking, but this constraint lives in orchestrator logic (the `AskUserQuestion` check) rather than in a `<constraints>` block visible to both the orchestrator and the auditor. The auditor subagent receives no constraints at all in its prompt.

**Concrete fix:** Add a `<constraints>` block to the orchestrator workflow and another in the subagent prompt:

```xml
<!-- In the workflow -->
<constraints>
  <permitted>
    - Query gsd-sdk for phase metadata
    - Read all files in the phase directory
    - Spawn exactly one gsd-ui-auditor subagent per invocation
    - Write {padded_phase}-UI-REVIEW.md to the phase directory
    - Commit via gsd-sdk if commit_docs is true
  </permitted>
  <reserved_for_human_review>
    - Overwriting an existing UI-REVIEW.md without user confirmation
  </reserved_for_human_review>
</constraints>

<!-- In the subagent prompt -->
<constraints>
  <permitted>Read any file listed in files_to_read. Write UI-REVIEW.md to phase_dir.</permitted>
  <reserved_for_human_review>No other file writes. No shell commands beyond file reads.</reserved_for_human_review>
</constraints>
```

---

### Issue 5 — Negative instruction present; no positive reframe (Section 5 Action 1)

**Principle:** Section 5 Action 1 requires converting negative instructions ("do not", "avoid") to positive equivalents before emitting any prompt.

**What's wrong:** Step 3 contains: "Omit null file paths." This is a negative imperative. The guide's conversion table maps this pattern to a positive form.

**Concrete fix:** Replace "Omit null file paths." with:

```
Include only file paths that resolved to existing files. For each path, verify existence before adding it to the files_to_read list.
```

---

### Issue 6 — Completion token is implicit; not machine-parse-safe (Section 7, Section 22 Pattern 3)

**Principle:** Section 7 (Machine-parsed output specification) requires: "be explicit and restrictive... Use the literal string `VERDICT: ` followed by exactly one of... Output it as plain text: no markdown bold, no punctuation, no wording variation."

**What's wrong:** Step 4 keys on `## UI REVIEW COMPLETE` as a return sentinel. This is a markdown `##` heading — the agent could emit `**UI REVIEW COMPLETE**`, `## UI Review Complete`, or `## UI REVIEW COMPLETE\n` and the check would fail silently. There is no instruction to the subagent specifying the literal format requirement. The workflow checks for this token but never tells the subagent it must emit it in exactly this form.

**Concrete fix:** In the subagent `<output_format>`, state the requirement explicitly (as in Issue 2 fix). Additionally, update the orchestrator check to be whitespace-tolerant, or — better — use a delimiter that is less likely to be reformatted, such as a plain-text sentinel on its own line:

```
UI_REVIEW_COMPLETE
```

And in the subagent prompt:
```xml
<output_format>
After writing UI-REVIEW.md, end your response with this exact line (no markdown, no variation):
UI_REVIEW_COMPLETE
</output_format>
```

---

### Issue 7 — Duplicated next-steps block in the completion banner (Section 11 Action 3)

**Principle:** Section 11 Action 3 states: "State each instruction exactly once. Repeated instructions consume context and add noise without reinforcing compliance."

**What's wrong:** The completion banner in Step 4 lists the next-step commands twice, verbatim:

```
- `/gsd-verify-work {N}` — UAT testing
- `/gsd-plan-phase {N+1}` — plan next phase

- `/gsd-verify-work {N}` — UAT testing
- `/gsd-plan-phase {N+1}` — plan next phase
```

**Concrete fix:** Remove the duplicate block. Keep only one instance of the next-steps list.

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide. Items marked N/A are inapplicable to a workflow orchestration file of this type (e.g., self-consistency sampling, RAG passage extraction).

### Task Specification
| Item | Score |
|------|-------|
| Intent, audience, and quality bar are all explicit in the prompt | FAIL |
| All constraints are compatible — no conflicts between scope, length, or depth | PASS |

### Chain-of-Thought
| Item | Score |
|------|-------|
| CoT is included only for math, symbolic reasoning, or multi-step logic tasks | N/A |
| CoT trigger used: "Take a deep breath and work on this problem step-by-step." | N/A |
| Reasoning is elicited before the answer, not after | N/A |
| CoT traces are treated as heuristic aids, verified against ground truth downstream | N/A |

### Few-Shot Examples
| Item | Score |
|------|-------|
| Examples selected by semantic similarity | N/A |
| 2–5 examples total | N/A |
| Ordered simple → complex, most representative last | N/A |
| Examples span diverse sub-types of the task | N/A |
| Format is consistent across all examples | N/A |
| Example order is fixed across all evaluation runs | N/A |

### Formatting
| Item | Score |
|------|-------|
| Instruction is complete and clear before any formatting is applied | PASS |
| Prompt sections are separated by semantically named XML tags | FAIL |
| At least 3 format variants will be tested on the target model | FAIL |

### Instruction Framing
| Item | Score |
|------|-------|
| All negative instructions have been converted to positive equivalents | FAIL |
| Priority order is explicit when multiple criteria apply | N/A |
| Tie-breaking rules match the domain's cost asymmetry | N/A |

### Persona
| Item | Score |
|------|-------|
| Persona is included only for open-ended or stylistic tasks | N/A |
| Persona is specific (constrains voice/register), not generic | N/A |
| Persona descriptor is gender-neutral | N/A |

### Output Format
| Item | Score |
|------|-------|
| Structured output tasks use a two-step reasoning-then-format approach | N/A |
| Single-call JSON places reasoning fields before answer fields | N/A |
| Constrained decoding is adopted only after free-form + post-processing has proven insufficient | N/A |
| Machine-parsed output uses exact format specification with literal string requirements | FAIL |

### Context Placement
| Item | Score |
|------|-------|
| Task instruction is at the start of the prompt | PASS |
| Primary document or input is at the end of the prompt | PASS |
| Background context is in the middle | PASS |
| All irrelevant context has been removed | PASS |
| Time-sensitive injected context is labeled as a snapshot | N/A |

### Self-Consistency
| Item | Score |
|------|-------|
| Self-consistency is applied only to tasks with a single correct answer | N/A |
| Inference budget permits 15–20 samples | N/A |

### Prompt Length
| Item | Score |
|------|-------|
| Redundant instructions and repeated context have been removed | FAIL |
| Long prompts have been compressed before sending | N/A |
| RAG context is the extracted relevant passage only | N/A |

### System / User Split
| Item | Score |
|------|-------|
| Persistent instructions are in the system prompt | N/A |
| Task-specific instructions are in the user prompt | N/A |
| Each instruction appears in exactly one location | FAIL |
| Safety-critical constraints have external validation independent of the prompt | N/A |

### Agent / Subagent
| Item | Score |
|------|-------|
| Agent prompts are fully self-contained | FAIL |
| All file paths in agent output are absolute | N/A |
| Parallel agents are launched in a single message block | N/A |
| Adversarial probes are specified for verification agents | N/A |

### Structural Architecture
| Item | Score |
|------|-------|
| Large prompts are decomposed into atomic, single-responsibility modules | PASS |
| Template variables use ${VARIABLE_NAME} syntax with fallback where appropriate | PASS |
| Modules compose at runtime via variable substitution, not copy-paste | PASS |

### Constraint Enforcement
| Item | Score |
|------|-------|
| Every restriction is paired with an equally concrete permission | FAIL |
| Hard exclusion lists are enumerated, not described qualitatively | N/A |
| Known edge cases have precedent-style rulings | N/A |
| Confidence thresholds are numeric, not qualitative | N/A |

### Decision Frameworks
| Item | Score |
|------|-------|
| Multi-option recommendations use an explicit decision tree or comparison table | N/A |
| Criteria checklists gate complex approaches | N/A |
| Action permissions are framed around reversibility | N/A |

### Multi-Phase Workflows
| Item | Score |
|------|-------|
| Complex tasks are organized into explicit named phases | PASS |
| Required steps are distinguished from type-specific steps | PASS |
| Scenario-based branching handles multiple paths explicitly | PASS |

### Memory and Continuity
| Item | Score |
|------|-------|
| Memory templates use XML tags as section labels | N/A |
| Compaction summaries include discoveries and failed approaches | N/A |
| Next steps are tied to the user's most recent explicit request | PASS |

### Modularity
| Item | Score |
|------|-------|
| Each prompt component has a single responsibility | PASS |
| Scope boundaries state both inclusions and exclusions | FAIL |

### Safety and Trust
| Item | Score |
|------|-------|
| Validation is at system boundaries only; internal interfaces are trusted | PASS |
| Dual-use capabilities state permissions before restrictions | N/A |
| Authorization is narrow-scoped; each action confirmed before expanding scope | PASS |

### Tone and Style
| Item | Score |
|------|-------|
| Size constraints use numeric limits, not qualitative descriptors | PASS |
| Instructions use imperative present tense | PASS |
| Working notes are in analysis tags, not user-facing output | N/A |

### Optimization
| Item | Score |
|------|-------|
| Prompt is flagged as a draft for automated optimization | FAIL |
| Correct optimizer selected | N/A |
| Held-out test set reserved before optimization begins | N/A |

**Summary tally (applicable items only):**
- PASS: 20
- FAIL: 11
- N/A: 32

---

## Recommendations

Prioritized from highest impact to lowest.

### 1. Convert the subagent prompt to a fully tagged, self-contained XML document (Issues 2, 3, 6)

This is the highest-leverage fix. The subagent prompt currently delegates its structure to an external agent file that is not visible in this workflow. Apply Section 4 Action 2 and Section 17 to rewrite the inline prompt block using `<task>`, `<goal>`, `<unit_task>`, `<worker_instructions>`, and `<output_format>` tags. Add an `<output_format>` block that specifies the completion sentinel (`UI_REVIEW_COMPLETE`) as a plain-text literal with an explicit "no markdown, no variation" instruction. This addresses three issues at once: self-containment, machine-parse safety, and output format specification.

### 2. Add `<audience>` and `<quality_bar>` to the workflow (Issue 3)

Section 1 requires all three task components to be explicit. Add a two-to-three sentence `<audience>` block describing the developer consumer and their context, and a `<quality_bar>` block specifying what a complete, high-quality audit contains (file references, per-pillar written justification, must-fix vs. nice-to-have distinction). These blocks belong near the top of the document, after `<purpose>`.

### 3. Add explicit `<constraints>` blocks to both the orchestrator and subagent prompt (Issue 4)

Apply Section 14's permitted/reserved pattern to state what the orchestrator may do (read, spawn, write, commit) and what requires human confirmation (overwriting an existing review). Mirror this in the subagent prompt. This makes the permission surface auditable without changing any current behavior — the implicit permissions become explicit.

### 4. Fix the duplicated next-steps block and convert the one negative instruction (Issues 5, 7)

These are small, high-precision fixes. Remove the duplicate next-step list in the completion banner (Section 11 Action 3). Convert "Omit null file paths." to its positive equivalent per Section 5 Action 1: "Include only file paths that resolved to existing files." Both changes take under a minute and eliminate two concrete guide violations.

### 5. Wrap workflow phases in `<phase>` XML tags rather than `##` markdown headers (Issue 1)

Replace the `## 0. Initialize` through `## 5. Commit` headers with `<phase id="0" name="Initialize">` through `<phase id="5" name="Commit">` tags. This aligns with Section 16's phase pattern, gives the model semantic signal about phase boundaries (rather than relying on markdown heading parsing), and makes the document machine-parseable as a structured workflow definition. This is lower urgency than items 1–4 because the current markdown structure is functional, but it is the architecturally correct form for a workflow document of this type.
