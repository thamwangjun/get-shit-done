# Prompt Engineering Guide V10

> This guide is written for an LLM agent whose job is to construct, critique, and refine prompts for instruction-tuned / RLHF models (GPT-4, Claude, Gemini, Llama-3-Instruct class). Each section contains explicit decision rules and actions the agent must execute. Follow them in order when building or reviewing any prompt.
>
> Sources: operational rules from the agent guide (authoritative) merged with structural patterns extracted from 100+ production prompt files.

---

## Table of Contents

1. [Task Specification](#1-task-specification)
2. [Chain-of-Thought Decisions](#2-chain-of-thought-decisions)
3. [Few-Shot Example Construction](#3-few-shot-example-construction)
4. [Formatting and Structure](#4-formatting-and-structure)
5. [Instruction Framing](#5-instruction-framing)
6. [Persona Assignment](#6-persona-assignment)
7. [Output Format Handling](#7-output-format-handling)
8. [Context Placement](#8-context-placement)
9. [Self-Consistency](#9-self-consistency)
10. [Prompt Length and Compression](#10-prompt-length-and-compression)
11. [System vs. User Prompt Allocation](#11-system-vs-user-prompt-allocation)
12. [Optimization Handoff](#12-optimization-handoff)
13. [Structural Architecture Patterns](#13-structural-architecture-patterns)
14. [Constraint Enforcement](#14-constraint-enforcement)
15. [Decision Frameworks](#15-decision-frameworks)
16. [Multi-Phase Workflows](#16-multi-phase-workflows)
17. [Agent and Subagent Patterns](#17-agent-and-subagent-patterns)
18. [Memory and Continuity](#18-memory-and-continuity)
19. [Modularity and Composition](#19-modularity-and-composition)
20. [Safety and Trust Patterns](#20-safety-and-trust-patterns)
21. [Tone and Style Rules](#21-tone-and-style-rules)
22. [Production Patterns](#22-production-patterns)
23. [Quick-Reference Checklist](#23-quick-reference-checklist)

---

## 1. Task Specification

When the user provides a task description, apply these actions before writing any prompt text.

**Action 1 — Extract the three task components.** Identify and make explicit: (a) what output is being requested, (b) why that output matters or how it will be used, and (c) what a correct or high-quality response looks like. Ask for any missing component before proceeding.

**Action 2 — Identify the audience.** Ask or infer who will consume the output. Encode the audience explicitly in the prompt: their domain knowledge, vocabulary level, and any relevant assumptions they bring.

```xml
<task>{what the model must do}</task>
<audience>{who will use the output and in what context}</audience>
<quality_bar>{what makes a good response — format, length, focus}</quality_bar>
```

**Action 3 — Audit constraints for consistency.** List every constraint the prompt places on the output (length, format, scope, tone, depth). Check each pair for conflict. If any two constraints cannot both be satisfied simultaneously, flag the conflict to the user and resolve it before proceeding. A prompt with conflicting constraints degrades unpredictably — emit only prompts with fully compatible constraints.

```xml
<constraint_check>
  Constraint A: "comprehensive analysis"
  Constraint B: "one paragraph"
  Status: CONFLICT — instruct user to choose scope or length, then proceed
</constraint_check>
```

---

## 2. Chain-of-Thought Decisions

Before adding any reasoning trigger to a prompt, classify the task type and apply the corresponding rule.

**Decision tree:**

```
Is the task symbolic reasoning, math, or multi-step logic?
  YES → Add CoT trigger. Use: "Take a deep breath and work on this problem step-by-step."
  NO  → Is the task factual recall, commonsense knowledge, or classification by learned pattern?
          YES → Omit CoT. Use direct answering.
          NO  → Is the task perceptual, visual, or pattern-matching with exceptions?
                  YES → Omit CoT. Use direct answering.
                  NO  → Apply CoT and monitor output quality.
```

**Action — Structure reasoning correctly.** When CoT is included, the prompt must elicit reasoning *before* the answer. Always place the reasoning trace before the answer field or answer token.

```xml
<reasoning>{model works through the problem here}</reasoning>
<answer>{final answer only after reasoning is complete}</answer>
```

Use `<analysis>` as an explicit scratchpad before producing final output:

```
Before providing your final summary, wrap your analysis in <analysis> tags to organize
your thoughts and ensure you've covered all necessary points.
```

This separates reasoning from output — the model "thinks out loud" in the analysis block without polluting the final result.

**Action — Flag CoT traces as heuristic, not ground truth.** When surfacing CoT outputs to downstream systems or users, annotate them as indicative only. Treat CoT traces as exploratory aids only; verify outputs against ground truth or through self-consistency sampling instead.

---

## 3. Few-Shot Example Construction

When building few-shot examples, execute these actions in order.

**Action 1 — Select by similarity.** Retrieve candidate examples semantically closest to the test input using embedding similarity (kNN). Use similarity as the primary retrieval signal, then apply diversity filtering (Action 4) to the candidate set.

```python
# Retrieval logic
query_embedding = embed(test_input)
selected_examples = knn_retrieve(query_embedding, example_pool, k=3)
```

**Action 2 — Enforce count limits.** Use 2–5 examples for most tasks. Stay at or below 5 unless the task has clearly distinct sub-types requiring broader coverage and the target model handles long context without positional degradation. When asked to include more, explain the diminishing return curve:

```
1 example   → large gain
2–3 examples → meaningful gain
4–5 examples → moderate gain
6–8 examples → small marginal gain
8+ examples  → near-zero gain + increased positional degradation risk
```

**Action 3 — Order examples by complexity.** Place the simplest, most clear-cut case first. Place the example most similar to the test input — or the most complex — last. This exploits the model's recency bias in the direction of the most representative case.

```
Example 1: [simplest sub-type]
Example 2: [moderate complexity]
Example 3: [closest to test input, hardest]  ← receives most attention
```

**Action 4 — Prioritize diversity over perfection.** Ensure examples span different sub-types of the task rather than clustering around the most common case. Covering the full output space matters more than polishing any individual example.

**Action 5 — Prioritize format consistency over label correctness.** Ensure every example uses identical formatting. Format and structural consistency have high impact on performance; label correctness matters less than format consistency but is not negligible for instruction-tuned models. When time is limited, audit format first.

**Action 6 — Fix example order before any evaluation run.** Keep example order constant across all evaluation trials. Ordering variance overwhelms small accuracy differences and makes A/B results meaningless.

### Production example patterns

**Arrow notation** (`input → output`) is efficient for transformation examples:

```
For simple commands, keep it brief (5-10 words):
- ls → "List files in current directory"
- git status → "Show working tree status"
- npm install → "Install package dependencies"

For complex commands, add context:
- find . -name "*.tmp" -exec rm {} \; → "Find and delete all .tmp files recursively"
- git reset --hard origin/main → "Discard all local changes and match remote main"
```

**Good/Bad labeled pairs with rationale:**

```
Good: "Reading runAgent.ts"
Good: "Fixing null check in validate.ts"

Bad (past tense): "Analyzed the branch diff"
Bad (too vague): "Investigating the issue"
Bad (too long): "Reviewing full branch diff and AgentTool.tsx integration"
```

The parenthetical rationale explains *why* it's bad, enabling the model to generalize the rule.

**XML-wrapped examples with commentary** for complex agentic behavior:

```xml
<example>
Context: The user is creating a test-runner agent that should be called after code is written.
user: "Please write a function that checks if a number is prime"
assistant: "Here is the relevant function: "
<function call omitted for brevity>
<commentary>
Since a significant piece of code was written, use the ${TASK_TOOL_NAME} tool to launch
the test-runner agent to run the tests.
</commentary>
assistant: "Now let me use the test-runner agent to run the tests"
</example>
```

The `<commentary>` block explains the decision process — not just what to do, but *why* in context.

---

## 4. Formatting and Structure

**Action 1 — Draft the instruction before choosing a format.** Write a clear, complete instruction in plain prose first. Add structure only after the instruction is fully specified. When the instruction is vague, refine it — formatting amplifies clarity in an already-clear instruction; it cannot substitute for specificity.

**Action 2 — Use XML tags to separate prompt sections.** When a prompt contains multiple distinct sections (instruction, context, input, output cue), wrap each in a semantically named XML tag. Tags name what the section *is*, not just where it starts, giving the model richer signal than delimiters alone.

```xml
<task>
You are a document classifier. Classify the document below into one of:
legal, medical, financial, other.
</task>

<document>
{document_text}
</document>

<output_format>
Respond with a single word: the classification label.
</output_format>
```

This is strictly better than markdown headers or `---` delimiters for Claude-class models: the tag name carries semantic meaning, the structure is unambiguous and machine-parseable, and there is no collision with output formatting.

**Action 3 — Generate and test at least 3 format variants.** Formatting changes that preserve meaning — different tag naming, nesting depth, ordering — can produce large accuracy differences that do not correlate across models. For any task that will run at scale, generate 3 candidate formats and evaluate them empirically on the target model before selecting one.

```xml
<!-- Variant A: flat tags -->
<input>{text}</input>
<output_cue>Classify:</output_cue>

<!-- Variant B: nested context -->
<request>
  <input>{text}</input>
  <instruction>Classify into: legal, medical, financial, other.</instruction>
</request>

<!-- Variant C: instruction-first -->
<instruction>Classify the input into: legal, medical, financial, other.</instruction>
<input>{text}</input>
```

Treat each model as requiring its own format validation — results from one model are valid for that model only.

### XML tag naming guide for prompt structure

XML tags work because the tag name carries semantic meaning. Choose names that describe *what the content is*, not just *where it appears*. The tag name should allow a reader or model to infer the role of the content without reading surrounding prose.

**Core naming principle:** Tag names are nouns or noun phrases that describe the *type* of content they contain. Avoid generic names like `<section>`, `<block>`, or `<item>`. Avoid verb forms unless the tag describes an action the model must take (e.g. `<verify>`).

---

**Top-level structural tags** — the root-level skeleton of a prompt or command file

These tags partition a prompt into its major logical sections. Use them to separate *what the model must do* from *what the model must know* from *what the model must produce*. They appear at the root of a prompt or command file, not nested inside other tags.

**Command identity.** A command file needs tags that declare *what it is* before detailing *how it works*. Use a tag whose name describes the command's summary role (`<purpose>`) or its stated goal (`<objective>`). For invocation rules — when the command should and should not be used — name the tag to describe the decision a reader must make: `<when_to_use>` or `<trigger>`. These are read before execution, so their names should signal "consult this first."

**Execution steps.** Name the execution container to signal its structure. Use `<process>` for flat numbered prose steps. Use `<execution_flow>` or `<execution_steps>` when individual steps need to be individually referenceable by name attribute — the container name signals that machine-parseable step identity matters. Within either, individual steps are named `<step name="...">` where the `name` attribute encodes what the step does, not its sequence number.

**Input and output.** The content a model acts on belongs in `<input>`, placed last for recency bias. The response shape belongs in `<output_format>`. When the command must emit verbatim user-facing text (links, formatted blocks, markdown), wrap it in `<output>` to signal it is display content, not instructions. For the set of all file-output artifacts the command writes, use a plural container like `<output_formats>`. For text skeletons the model copies and fills in, use `<templates>`.

**Rules and constraints.** Keep rule-type tags semantically distinct from each other. `<constraints>` scopes permission boundaries and trust. `<critical_rules>` is a "must not forget" checklist of execution safety invariants. `<rules>` is a numbered behavioral list. `<anti_patterns>` is the negative case — explicit "do not" failures. Don't merge these into one tag; the name signals to the model how seriously to weight the content.

**Context and knowledge.** Use `<context>` for background information that is helpful but not critical. Use `<required_reading>` for files or documents the model *must* read before executing — the name signals a hard pre-execution gate. Use `<reference>` for a pointer to a specific external document or for inline verbatim content the model must reproduce.

**Agent identity.** Use `<persona>` for the role, voice, and identity of a conversational agent. Use `<role>` when the description includes explicit responsibilities alongside identity — the term implies duties, not just character.

**Caller-injected parameters.** When a section is a parameter block passed from a calling orchestrator rather than the command's own definition, name it to reflect the caller's intent: `<session_params>` or `<config>` for key-value runtime config, `<files_to_read>` for a file list, `<phase_context>` for phase identity data. These tags signal "the caller provided this" and should stay semantically distinct from the command's own structural tags. When naming a caller-injected container that wraps multiple inputs for one specific subagent type (planner, pattern-mapper, researcher), make the agent type part of the name: `<planning_context>`, `<research_context>`, `<verification_context>`.

**Lifecycle and completion.** Tags that define what "done" looks like should be named to describe their checking role: `<success_criteria>` for verifiable exit conditions, `<partial_completion>` for the procedure when a user advances despite incomplete work. Tags that define checkpoint behavior — when to pause and hand back to a human — should describe the pause point: `<checkpoint_behavior>`.

**Multi-mode commands.** Use a top-level `<modes>` container to catalog all supported execution modes. Name each mode branch with its distinguishing condition as a suffix or qualifier: `<mode_create>`, `<mode_update>`, `<create_mode>`. Use `<auto_mode>` specifically for the `--auto` flag override block. For inline conditional branches within a step, use `<if mode="...">` where the attribute carries the condition.

**Compatibility and notes.** Distinguish the audience of compatibility information. Tags targeting the *executing model* about runtime differences use names like `<runtime_compatibility>`. Tags targeting *operators* about tool substitutions use `<runtime_note>`. Tags documenting OS-level shell constraints use `<platform_notes>`. General model-facing caveats go in `<notes>`. Security-specific invariants go in `<security_notes>`.

**Strategy and policy blocks.** When a command defines a *how-to-think* policy rather than procedural steps, name the tag after the decision domain: `<fix_strategy>` for the approach to applying changes, `<rollback_strategy>` for recovery sequencing, `<tool_strategy>` for tool selection priority. These are distinct from `<process>` (which is sequential steps) — they encode judgment policy.

**Spawning contracts.** When an agent file documents its own caller/consumer interface, name the tags to describe the handoff direction: `<upstream_input>` describes who spawns this agent and what they pass; `<downstream_consumer>` describes who reads this agent's output. Use `<downstream_awareness>` in an orchestrator file to declare which agents consume its outputs — the producer's awareness of its consumers.

**Domain methodology blocks.** When a specialized agent encapsulates a named analytical methodology (goal-backward analysis, coverage validation, gray-area identification), name the tag after the methodology domain. These tags signal "this is a reusable named procedure," not just a list of steps. They are distinct from `<process>` precisely because the name makes the methodology referenceable.

**Stateful workflow blocks.** Commands that manage persistent state across sessions need tags whose names describe the state protocol: `<debug_file_protocol>` for the debug state file spec, `<update_rules>` for write-batching policy, `<tdd_execution>` for the RED/GREEN/REFACTOR gate sequence. Name these after the protocol they define, not just their contents.

---

**Constraint sub-tags** — children of `<constraints>`

Constraints define the permission and trust boundary of an agent. Sub-tags within `<constraints>` distinguish *permission tiers* — what the agent may do freely, what requires confirmation, and what is unconditionally forbidden.

Name constraint children by their **confirmation requirement**. The name should immediately signal which tier an action belongs to. Freely permitted actions get affirmative names. Actions requiring user confirmation get names that make the confirmation explicit. Unconditionally forbidden actions get names that signal no path exists — "reserved" rather than "prohibited," because reserved implies ownership has been assigned elsewhere.

When the authority boundary matters, qualify the name with *who* holds authority. A tag that signals "a human must review this first" differs from one that signals "only a human may ever do this." The distinction belongs in the tag name itself, not in the prose inside it.

Name edge-case overrides and tie-breakers distinctly from the main rules, because they override the general policy rather than implement it. These often appear outside `<constraints>` as peers of it when they govern the whole command's uncertainty policy.

For domain-specific thresholds (confidence levels, minimum impact), name tags to make the threshold type clear. A tag named for the type of scoring it defines tells the reader what dimension it measures before they read the value.

**Example sub-tags** — children of `<examples>` or `<example>`

Few-shot examples teach by demonstration. Sub-tags separate the *input*, *expected output*, and *reasoning* so a model can extract the pattern without needing to parse prose.

Keep example sub-tags short and universal — three slots cover every domain: the content the model acts on, the expected output, and an explanation of the decision process. Don't invent domain-specific sub-tags for individual example types; the same three slots apply everywhere.

The reasoning explanation slot deserves a name that signals it teaches the *why*, not the *what*. A tag called `<commentary>` implies editorial explanation of a decision, which is the correct frame — the model learns the reasoning behind the output, not just what it looks like.

**Reasoning and output tags** — used in responses, not prompts

These tags appear in the model's *response*, not in the prompt itself. They structure internal reasoning and the structured results the model returns to callers.

Use cognitive metaphors for internal-only reasoning — names like "thinking," "reasoning," and "analysis" signal scratchpad content that is never surfaced to users. The model writes into these tags to do its work; the content inside is not part of the answer.

When a tag is used as a *structured result wrapper* — a top-level envelope that an orchestrator parses programmatically — name it to reflect its role as a container for the result, not its role in reasoning. If you use `<analysis>` for both scratchpad and structured output, define which role it plays in each context and use it consistently within a project.

Use `<summary>` for compaction and handoff blocks — content that condenses a session's history for a downstream consumer or a continuation agent. The name signals that the content is distilled for re-use, not primary output.

**Summary and memory sub-tags** — children of `<summary>` or `<memory>`

These tags structure handoff documents — session summaries, continuation files, memory entries — so a future agent (or the same agent after a context reset) can reconstruct what happened without re-reading the full conversation.

Name sub-tags to match the **temporal or causal slot** they fill. A summary document is a map of a session's state: what was requested, what was done, what was discovered, what remains, and what comes next. Each slot should have a tag whose name makes its position in that map obvious.

For **completed state**, use past-tense noun phrases that describe what happened: `<completed_work>`, `<decisions_made>`, `<errors_and_fixes>`. The past tense signals these are records, not instructions.

For **open state**, use present or future-oriented names that describe what exists now or what must happen: `<pending_tasks>`, `<blockers>`, `<next_steps>`. These signal live conditions that the resuming agent must act on.

When two slots might be confused, qualify the name to distinguish them. `<current_work>` means in-progress at the moment of pause; `<current_state>` means a point-in-time snapshot of what has been accomplished. The qualifier makes the distinction readable without opening the tag.

Distinguish singular from plural entry points. A tag that holds a single imperative first step for a resuming agent is different from one that holds a list of remaining actions. Use singular nouns for single-item slots and plural nouns for lists, so the structure of the name matches the structure of the content.

**Workflow and agent sub-tags** — used in multi-phase and agentic prompts

These tags structure the control flow of multi-step workflows: phases, branches, interviews, failure recovery, and scope containers.

**Branching.** Name execution branches by their activating condition, not their sequence. The tag name or its attribute should make the branch condition readable without opening the block. A mode branch should carry the mode name in the tag name itself (e.g. `<mode_create>`, `<mode_update>`), so the boundary between branches is machine-parseable and step content cannot bleed across branches. For inline conditional branches within a step, encode the condition in an attribute rather than the tag name (e.g. `<if mode="yolo">`).

**Containers.** Use structural container names whose plural or collective form signals what they contain. A container named for its children (e.g. `<scenarios>` wrapping `<scenario>` children, `<interview>` wrapping `<round>` children) makes the nesting structure readable before you open the block. For failure-recovery containers, name the container after the recovery concern and each child case after its specific failure type, using a `name` attribute so individual cases are referenceable.

**Steps.** Use a `name` attribute on individual steps rather than relying on sequence numbers. The name makes each step referenceable by orchestration logic and documents what the step accomplishes. A `priority="first"` attribute on an initialization step signals it must run exactly once before anything else, regardless of ordering.

**Universal vs. conditional.** Distinguish steps or strategies that apply in all branches from those that apply only under a specific condition. A tag that signals universality (e.g. "required") tells the model not to skip it based on branching logic. A tag that signals specificity (e.g. "type_specific") tells the model to apply it only when its condition holds.

**Scope boundaries.** When a block defines what is in scope vs. out of scope, structure inclusion and exclusion as named child tags rather than prose. This makes scope rules machine-readable and prevents ambiguity about which content belongs.

**Structured handoffs.** When passing pre-gathered context into a spawned subagent (bug symptoms, checkpoint responses, file paths), name the container tag after the type of data it holds — not after the subagent that receives it. The name should be interpretable without knowing which agent is the destination.

**Agent task decomposition sub-tags** — children of `<task>` in multi-agent prompts

When a task is decomposed across multiple agents, sub-tags within the task block distinguish what is shared across all agents from what is specific to each individual agent.

Distinguish the **shared goal** from the **individual work unit**. The goal describes what the overall system is trying to accomplish; the individual assignment describes this specific agent's slice. Name them to reflect that distinction — the goal tag should read like a purpose statement, the assignment tag should read like a work order.

Use collective nouns for shared conventions that all agents must follow. A tag named `<conventions>` covers rules that apply system-wide, not just to one agent. When instructions are verbatim content that will be copied directly into the agent's prompt, name the tag to signal its mechanical nature — something like `<worker_instructions>` makes clear the content is injected, not authored in context.

---

**Plan document sub-tags** — children of `<tasks>` or `<task>` in PLAN.md output artifacts

Plan documents are consumed by executor agents. Every sub-tag within a task must fill exactly one slot in the executor's mental model: what files are in scope, what to build, how to verify it's done, and what "done" looks like. Don't merge slots.

**One slot per tag.** Scope belongs in one tag, instructions in another, observable outcome in a third, runnable verification command in a fourth. The names should make the distinction immediate: a tag that states what the executor must do reads differently from one that states the runnable command that proves it worked.

**Observable outcome vs. verification command.** These are different things and deserve different names. One is a statement of state ("valid credentials return 200 + JWT"); the other is a shell command. Name them so an executor knows without reading which one to run and which one to check against.

**Imperative form for gates.** Tags that impose a mandatory pre-condition before the executor may proceed should use imperative-style names. A tag named to suggest "read this first" or "verify this before continuing" has different weight than one named after its content type. The mandatory nature belongs in the name.

**TDD-specific slots.** When a task is part of a TDD cycle, it needs a slot for expected behaviors written *before* implementation. Name it to reflect its role in the RED→GREEN cycle, and only add it to TDD tasks — it has no meaning on non-TDD tasks.

**Domain vocabulary for specialized artifacts.** Security analysis blocks, STRIDE threat registers, and cross-cutting phase-level verification sections belong in tags whose names come from their domain. Use the domain name, not a generic term.

---

**Context document sub-tags** — sections of a CONTEXT.md artifact

CONTEXT.md documents capture the *why* of a phase — decisions made, references consulted, scope boundaries — for downstream planners and executors.

Name sections by their **epistemic role**: what kind of knowledge does this section contain? A section that records choices made deserves a tag that signals recorded decisions. A section that lists mandatory references deserves a tag that signals authoritative sources. A section that defines the phase boundary deserves a tag that signals scope.

Use **locking vocabulary** for sections that freeze requirements and prevent downstream re-asking. If requirements are locked by an upstream spec, name the section to signal that status — something that reads as "these requirements cannot be re-opened."

Distinguish **active content** from **deferred content** with contrasting names. Requirements captured during discussion belong in one tag; requirements explicitly postponed for a later phase belong in another. The contrast between the names should make the distinction clear without reading the content.

For codebase-derived content, use a **domain prefix** that signals the source: a tag prefixed with `code_` tells the reader the content came from reading the codebase rather than from user discussion.

---

**Checkpoint task sub-tags** — children of checkpoint task blocks in PLAN.md

Checkpoint tasks pause automated execution and hand control to a human. Sub-tags structure the handoff around the human's cognitive tasks: what do they need to understand, what do they need to do, and how do they resume?

Name sub-tags by the **human's cognitive task at that point in the handoff**, not by the type of content. A tag that orients the human to what was built reads differently from one that gives them numbered verification steps, which reads differently from one that tells them what to type to resume. Each serves a distinct human action.

Use **hyphenated verb phrases** for action-oriented slots. Hyphenation signals instruction rather than data — these tags contain directions for the human, not content the agent wrote. Compare a tag that reads as a question (e.g. "how to verify") to one that reads as a label (e.g. "verification steps") — the former is more directive.

For decision checkpoints, distinguish the **framing of the choice** from the **set of available options**. Options should be individually referenceable by `id` so the human can refer to "option-a" when resuming without re-reading the full block.

---

**TDD plan sub-tags** — children of `<feature>` in TDD PLAN.md documents

TDD plans enforce a RED→GREEN→REFACTOR sequence. Sub-tags within a feature block separate *what to test* from *how to implement*, maintaining the gate between the two phases.

The top-level container should name the **unit under test**, not the phase. It wraps one complete RED→GREEN→REFACTOR cycle for a single feature.

Separate test specification from implementation guidance with distinct tag names. The test spec slot holds expected behaviors written before any implementation exists — its name should signal specification, not implementation. The implementation slot holds build instructions that are present in the document but acted on only after tests are written and failing. Its name — `<implementation>` — signals GREEN-phase work, not RED-phase work.

---

**Context sub-tags** — general children of `<context>`

Keep context sub-tags minimal. `<context>` is already a general-purpose container; if you find yourself adding multiple sub-tags, consider whether the parent tag should be renamed to something more specific that makes the sub-tags unnecessary.

The main exception is a **redirecting caveat** at the top of a context block — content that re-orients the reader before the main body (e.g. "use workflow X instead for case Y in this situation"). Name it something that signals it is an advisory note, not data. This is distinct from the top-level `<notes>` tag (which holds model-facing caveats that appear after `<process>`) — the inline variant is a scoping redirect within context.

---

**Runtime context sub-tags** — children of `<context>` carrying injected shell output

These tags carry live environment data injected at prompt-construction time. Their names should make the data source immediately traceable.

**Mirror the source command.** Name runtime context tags after the shell command that produced them. A reader should be able to look at the tag name and know exactly what shell command generated the content inside. This makes it trivial to re-produce the data and to understand its freshness.

**Use snake_case consistently.** Multi-word runtime tags should use underscores, matching shell variable naming conventions. This visually distinguishes them from prose-named tags and signals programmatic origin.

**Distinguish pointers from content.** When a tag holds a file *path*, append `_path` to its name. When it holds pre-extracted *content*, name it after what the content describes. The suffix makes clear whether the consumer needs to open a file or can use the tag's content directly.

---

**Internal workflow accumulator tags** — named scratchpad slots within step blocks

These are not prompt section tags or output artifact tags. They are structured scratchpad slots — named placeholders the model builds internally across steps and references in later steps. They appear inside `<step>` blocks with instructions like "build internally" or "accumulate as you read."

Name accumulator tags by the **data they accumulate**, not the step that creates them. The tag name is the handle the model uses when scanning back through prior steps — it must be unambiguous.

Use **tense and participle adjectives** to signal processing state. Past-tense or past-participle qualifiers (prior, folded, reviewed) signal data that has already been processed and will not change. Active or present-tense qualifiers (active, current) signal data that is in scope now and may be consumed downstream. This distinction helps the model know whether to treat the accumulator as a fixed record or a live working set.

### Numbered section templates for long-form output

For long-form outputs such as session summaries, specify sections with XML tags rather than numbered prose:

```xml
<summary>
  <primary_request>Capture all of the user's explicit requests...</primary_request>
  <key_concepts>List all important technical concepts...</key_concepts>
  <files_and_code>Enumerate specific files and code sections referenced...</files_and_code>
  <errors_and_fixes>Errors encountered and how they were resolved...</errors_and_fixes>
  <problem_solving>Problems solved and the approaches that worked...</problem_solving>
  <pending_tasks>Tasks explicitly stated but not yet completed...</pending_tasks>
  <current_work>Precise description of what was being worked on...</current_work>
  <next_step>The immediate next action, if clearly applicable.</next_step>
</summary>
```

Mark `<next_step>` as optional in the instruction — include it only when a clear next action exists.

---

## 5. Instruction Framing

**Action 1 — Convert negative instructions to positive equivalents.** Before emitting any prompt, scan for negated instructions ("do not", "avoid", "never" as primary directives). Rewrite each as a positive specification of the desired behavior. Exception: the reframe pattern (Section 6) — the one context where a negative clause is valid.

```
# Conversion table — apply mechanically
"Do not be vague"          → "Be specific: include exact figures, dates, or names"
"Do not repeat yourself"   → "Each sentence should introduce new information"
"Do not use passive voice" → "Use active voice throughout"
"Do not hallucinate"       → "If uncertain, say 'I don't know' rather than guessing"
"Do not use bullet points" → "Write in flowing prose paragraphs"
```

### Priority ordering

When multiple considerations apply, list them with explicit priority:

```xml
<priority_order>
  1. Exact tag matches (highest priority — user explicitly categorized this session)
  2. Partial tag matches or tag-related terms
  3. Title matches (custom titles or first message content)
  4. Branch name matches
  5. Summary and transcript content matches
  6. Semantic similarity and related concepts
</priority_order>
```

Explicit ordering removes ambiguity when signals conflict.

### Tie-breaking instructions

Add explicit tie-breaking when the model might be uncertain. Tie-breaking rules must match the domain's cost asymmetry:

```xml
<!-- Recall-biased context (search): include more -->
<tie_breaking>
  When in doubt, INCLUDE the session. Returning too many results is preferable
  to omitting relevant ones.
</tie_breaking>

<!-- Precision-biased context (memory selection): include less -->
<tie_breaking>
  Include only memories you are certain will be helpful.
  Omit memories where usefulness is unclear. Be selective and discerning.
</tie_breaking>
```

### Conditional instructions

When behavior depends on context, use explicit conditional branching:

```
If no PR number is provided in the args, run `gh pr list` to show open PRs.
If a PR number is provided, run `gh pr view <number>` to get PR details.
```

Template ternary syntax handles runtime conditionals:

```
${IS_SUBAGENT?"When you complete the task, respond with a concise report...":"When you
complete the task simply respond with a detailed writeup."}
```

---

## 6. Persona Assignment

**Action 1 — Classify the task before assigning a persona.** Personas affect output style and register, not factual accuracy or reasoning capability.

```
Task type is open-ended, stylistic, or requires a specific voice?
  YES → Assign a specific, role-constrained persona.
  NO  → Omit persona. It will not improve accuracy.
```

**Action 2 — Make personas specific, not generic.** Generic expert framing ("you are an expert data scientist") produces no measurable accuracy gain. A persona must constrain register, voice, or domain-specific style to be effective.

```xml
<!-- Specific, effective persona -->
<persona>
You are a senior technical writer at a developer tools company.
Write in present tense, active voice, and lead with user benefit.
</persona>

<!-- Generic, ineffective persona — omit this form -->
<persona>
You are an expert with 20 years of experience.
</persona>
```

**Action 3 — Use gender-neutral role descriptions by default.** Gendered personas reflect pretraining biases and introduce inconsistency. Use role titles with neutral pronouns and descriptors unless the task explicitly requires a gendered framing.

### The reframe pattern

Use "Your job is NOT X — it's Y" to correct the model's default assumption when counter-intuitive behavior is required. This is one context where a negative clause is valid: it explicitly displaces a prior the model would otherwise act on.

```xml
<persona>
You are a verification specialist. Your job is not to confirm the implementation works —
it's to try to break it.
</persona>
```

```xml
<constraints>
This is not a general code review — focus ONLY on security implications newly added by this PR.
</constraints>
```

### Role-domain mapping

Match the expert identity to the exact domain, not a broader category:

| Task | Ineffective | Effective |
|------|-------------|-----------|
| Security review | "Code reviewer" | "Senior security engineer conducting a focused security review" |
| Verification | "Tester" | "Verification specialist. Your job is to try to break it." |
| Exploration | "Assistant" | "File search specialist. You excel at thoroughly navigating and exploring codebases." |
| Summarization | "Summarizer" | "You are coming up with a succinct title and git branch name for a coding session." |

### Strengths listing

Explicitly enumerate what the agent is good at. This biases behavior toward those capabilities:

```xml
<persona>
You are a codebase exploration specialist.

Your strengths:
- Searching for code, configurations, and patterns across large codebases
- Analyzing multiple files to understand system architecture
- Investigating complex questions that require exploring many files
- Performing multi-step research tasks
</persona>
```

---

## 7. Output Format Handling

**Action 1 — Default to free-form reasoning, then format.** When structured output (JSON, XML) is required, split the task into two steps: first elicit free-form reasoning, then format the conclusion. Keep reasoning and formatting as separate calls.

```xml
<!-- Step 1 — free reasoning -->
<task>
Analyze this input and identify: (1) the main claim, (2) the supporting evidence,
(3) any logical gaps. Think through each point carefully.
</task>
```

```xml
<!-- Step 2 — structure the output -->
<task>
Format your analysis as JSON:
{
  "main_claim": "...",
  "evidence": "...",
  "gaps": "..."
}
</task>
```

**Action 2 — If single-call structured output is required, order fields reasoning-first.** Place any reasoning or explanation fields before answer or conclusion fields. Token generation is causal — the model commits to earlier tokens first.

```json
{
  "reasoning": "model works through the problem here",
  "answer": "conclusion drawn from the reasoning above",
  "confidence": "high / medium / low"
}
```

**Action 3 — Test free-form output with post-processing before committing to constrained decoding.** Constrained decoding (enforcing valid JSON at the token level) can degrade reasoning performance meaningfully (reported at 10–15% on structured-output benchmarks). Adopt constrained decoding only after prompting for structured output plus post-processing parsing has proven insufficient.

### Machine-parsed output specification

When output is machine-parsed, be explicit and restrictive:

```xml
<output_format>
End your response with a verdict line in exactly this format — it is parsed by the calling agent:

VERDICT: PASS
or
VERDICT: FAIL
or
VERDICT: PARTIAL

Use the literal string `VERDICT: ` followed by exactly one of `PASS`, `FAIL`, or `PARTIAL`.
Output it as plain text: no markdown bold, no punctuation, no wording variation.
</output_format>
```

### Embedding output schema in JSON

When specifying JSON output, embed instructions directly in the schema values so that the schema and its instructions are co-located:

```json
{
  "intro": "1 sentence summarizing friction patterns",
  "categories": [
    {
      "category": "Concrete category name",
      "description": "1-2 sentences explaining this category...",
      "examples": ["Specific example with consequence", "Another example"]
    }
  ]
}
```

### Standard XML output tags

Use these tags consistently for structured sections in free-form output:

```xml
<summary>...</summary>       <!-- compaction and handoff summaries -->
<analysis>...</analysis>     <!-- scratchpad reasoning, internal only -->
<description>...</description> <!-- memory field descriptions -->
<thinking>...</thinking>     <!-- extended chain-of-thought traces -->
```

---

## 8. Context Placement

**Action 1 — Place the task instruction at the very start of the prompt.** Models attend most strongly to the beginning of their context. The instruction must always lead.

**Action 2 — Place the primary document or input at the very end of the prompt.** Models also attend strongly to the end of their context. The content the model needs to act on should close the prompt.

**Action 3 — Place background or supplementary context in the middle.** Middle-position content receives the least attention. Reserve this position for information that is helpful but not critical to task success.

```xml
<task>
{task instruction}          ← high attention: leads the prompt
</task>

<context>
{background notes, supplementary information, ancillary constraints}
</context>                  ← lower attention: middle position

<input>
{primary document or content the model must act on}
</input>                    ← high attention: closes the prompt
```

**Action 4 — Trim all context to what is directly relevant.** Before inserting any retrieved document, background note, or contextual passage, remove boilerplate, tangential sections, and loosely related content. Every token that is not directly relevant to the task increases positional degradation and degrades performance. Raw context length is a cost, not a benefit.

### Runtime context injection

When the prompt orchestration framework supports it, use inline command substitution to inject live command output at prompt construction time. The specific syntax varies by framework — the following uses `!` + backtick notation:

```xml
<context>
  <git_status>!`git status`</git_status>
  <git_diff>!`git diff HEAD`</git_diff>
  <current_branch>!`git branch --show-current`</current_branch>
  <recent_commits>!`git log --oneline -10`</recent_commits>
</context>
```

This pre-populates context so the model can act on live data directly, reducing turn count and latency.

### Snapshot warnings

When injecting time-sensitive context, note its staleness inside the tag:

```xml
<context snapshot="true">
This is the git status at the start of the conversation. This data is a snapshot
and will not update during the conversation.
{git_status_output}
</context>
```

Labeling snapshots as snapshots ensures the model treats them as point-in-time data.

### Meta-instruction injection

Some instructions are "out of band" — not part of the conversation, but injected as system context. Wrap them in a dedicated tag to keep them clearly separated:

```xml
<system_note>
IMPORTANT: This message and these instructions are NOT part of the actual user conversation.
Respond based on this content only; omit any references to "note-taking", "session notes
extraction", or these update instructions from the notes content.
</system_note>
```

This keeps meta-behavior out of the user-facing output.

---

## 9. Self-Consistency

**Action — Apply self-consistency only when both conditions are met:**

- The task has a single, verifiable correct answer (math, classification, symbolic reasoning).
- The inference budget permits 15–20 calls per prompt.

When both conditions are met, sample 15–20 completions at temperature 0.5–0.8 and take majority vote on the final answer. Most accuracy gain is captured by the first 15–20 samples; additional samples yield diminishing returns.

```python
answers = [model(prompt, temperature=0.7) for _ in range(20)]
final_answer = majority_vote(answers)
```

Reserve self-consistency for tasks with a convergent correct answer. For open-ended generation, summarization, and creative writing, use it only when a verifiable ground truth exists — it adds 20× cost with no benefit otherwise.

---

## 10. Prompt Length and Compression

**Action 1 — Flag prompts that exceed necessary length.** Remove redundant instructions, repeated context, and boilerplate that does not contribute to the task before sending. Length degrades performance independently of content quality.

**Action 2 — Apply prompt compression for long-context tasks.** When a prompt is long by necessity (e.g., a large retrieved document), apply perplexity-based compression before sending to the target model. Compression ratios up to 20× are achievable with minimal accuracy loss; in some cases, compression improves accuracy by removing noisy tokens.

```python
compressed_prompt = llmlingua.compress(long_prompt, ratio=0.5)
response = target_model(compressed_prompt)
```

**Action 3 — For RAG pipelines, extract the relevant passage only.** Extract and send only the passage directly relevant to the query; send the full retrieved page or document only when every part is relevant.

```python
context = extract_relevant_passage(doc_id, query)  # target: <200 tokens
```

---

## 11. System vs. User Prompt Allocation

**Action 1 — Allocate instructions by persistence.** Place any instruction that applies to every turn or every call in the system prompt. Place any instruction specific to the current task or input in the user prompt. Each instruction belongs in exactly one location.

```xml
<!-- System prompt — applies to all turns -->
<persona>
You are a concise technical documentation assistant.
Respond in plain English. Format all code in fenced blocks with the language specified.
</persona>
```

```xml
<!-- User prompt — specific to this task -->
<task>Explain what a database index is and when to use one.</task>
```

**Action 2 — Back safety-critical constraints with external validation.** Instruction hierarchy (system > user) is not reliably enforced — user-turn authority cues can override system-level constraints. For any rule that must hold without exception, implement external validation on the model's output, independent of the prompt.

**Action 3 — State each instruction exactly once.** Repeated instructions consume context and add noise without reinforcing compliance. Audit the full prompt before emitting it and consolidate every duplicated instruction to a single canonical location.

### YAML frontmatter as agent configuration

For agent prompt files, encapsulate all persistent properties in frontmatter:

```markdown
<!--
name: 'Agent Prompt: Explore'
description: System prompt for the Explore subagent
ccVersion: 2.0.56
variables:
  - GLOB_TOOL_NAME
  - GREP_TOOL_NAME
agentMetadata:
  agentType: 'Explore'
  model: 'haiku'
  disallowedTools:
    - Agent
    - ExitPlanMode
    - Edit
    - Write
  whenToUse: >
    Fast agent specialized for exploring codebases...
  criticalSystemReminder: 'CRITICAL: This is a READ-ONLY task...'
-->
```

This encodes identity (`agentType`, `model`), permissions (`disallowedTools`), trigger conditions (`whenToUse`), dependencies (`variables`), and safety reminders (`criticalSystemReminder`) in a single, machine-readable location.

---

## 12. Optimization Handoff

**Action 1 — Treat every manually constructed prompt as a draft.** Human-crafted prompts are a starting point. On benchmark tasks, automated optimizers consistently outperform them by 5–50% (effect size varies by model, task domain, and evaluation methodology). Flag every manually constructed prompt as a candidate for optimization after the initial build.

**Action 2 — Route to the correct optimizer based on task structure:**

```
Is the task a multi-stage pipeline with multiple LLM calls?
  YES → Use DSPy MIPROv2. It jointly optimizes instructions and demonstrations
        across all pipeline modules using Bayesian Optimization.

Is the task a single-prompt, single-model call?
  YES → Use OPRO or ProTeGi for instruction-only optimization.

Is the target model smaller than ~13B parameters?
  YES → Automated optimization may yield limited gains. Prioritize carefully selected
        few-shot examples and zero-shot CoT triggers. Test optimization only if
        the few-shot baseline underperforms.
```

**Action 3 — Reserve a held-out test set before any optimization run.** Automated optimizers use a training set and validation set during optimization. A separate test set — never seen by the optimizer — must exist before optimization begins. Validate the final optimized prompt against this held-out set before treating optimization as complete. Prompts validated only on the optimization evaluation set may overfit.

---

## 13. Structural Architecture Patterns

### The modular principle

Well-designed prompt systems decompose large instructions into small, focused atomic units — each file handling one concern. These modules compose at runtime via template variable substitution.

**Example atomic prompt module** (entire content):
```
Create helpers, utilities, and abstractions only for operations used in more than one place.
Design for current requirements. Use the minimum complexity the current task requires —
three similar lines of code is better than a premature abstraction.
```

Each behavioral rule is a separately toggleable unit. This is the key architectural advantage: modules can be included or excluded per configuration without touching other modules.

### Template variable injection

Variables are interpolated via `${VARIABLE_NAME}`:

```xml
<context>
  <log_path>${DEBUG_LOG_PATH}</log_path>
  <log_summary>${DEBUG_LOG_SUMMARY}</log_summary>
</context>
```

Fallback syntax: `${VAR||"(default value)"}` for optional context.

Conditional rendering:

```
${ADDITIONAL_USER_INPUT?"Additional user input: "+ADDITIONAL_USER_INPUT:""}

${IS_TRUSTED_DOMAIN?"Provide a concise response...":
`Provide a concise response based only on the content above. In your response:
 - Enforce a strict 125-character maximum for quotes...`}
```

---

## 14. Constraint Enforcement

### Explicit permission pairs

Pair every restriction with what IS permitted, stated equally concretely. This eliminates ambiguity about what actions remain available:

```xml
<constraints>
  <permitted>
    - Read any file in the repository
    - Run read-only shell commands (grep, find, ls, cat, git log, git diff)
    - Write ephemeral test scripts to /tmp or $TMPDIR only; clean up after use
  </permitted>

  <reserved_for_human_review>
    - Creating, modifying, or deleting files in the project directory
    - Installing dependencies or packages
    - Running git write operations (add, commit, push)
  </reserved_for_human_review>
</constraints>
```

### Hard exclusion lists

For filtering tasks, enumerate what to automatically exclude:

```xml
<exclusions>
  Automatically exclude findings matching these patterns:
  1. Denial of Service (DoS) vulnerabilities or resource exhaustion attacks.
  2. Secrets or credentials stored on disk when otherwise secured.
  3. Rate limiting concerns or service overload scenarios.
  ...
  16. Findings in documentation files only.
  17. Absence of audit logs.
</exclusions>
```

### Precedents (edge case rulings)

After hard exclusions, add precedent-style rulings for known edge cases:

```xml
<precedents>
  1. Logging high value secrets in plaintext is a vulnerability. Logging URLs is assumed safe.
  2. UUIDs can be assumed to be unguessable and treated as validated.
  3. Environment variables and CLI flags are trusted values.
  4. React and Angular are generally secure against XSS. These frameworks handle escaping
     automatically; flag only explicit use of dangerouslySetInnerHTML.
</precedents>
```

Precedents are higher signal-to-noise than additional rules — they resolve specific known disputes.

### Confidence thresholds

For outputs that could have false positives, specify minimum confidence numerically:

```xml
<confidence_scoring>
  - 0.9–1.0: Certain exploit path identified, tested if possible — report
  - 0.8–0.9: Clear vulnerability pattern with known exploitation methods — report
  - 0.7–0.8: Suspicious pattern requiring specific conditions to exploit — report with caveat
  - Below 0.7: Omit (too speculative to report reliably)
</confidence_scoring>
```

Numeric thresholds beat qualitative terms like "high confidence" — they are calibratable.

### Structure preservation rules

When editing templated documents, specify exactly what to preserve vs. what to update:

```xml
<constraints>
  <preserve>
    - The file's exact structure: all sections, headers, and italic descriptions
    - All section headers (lines starting with '#') exactly as written
    - All italic _section description_ lines exactly as written
    - These italic lines are TEMPLATE INSTRUCTIONS — treat them as immutable scaffolding
  </preserve>
  <update>
    - Only the actual content appearing BELOW each italic _section description_
  </update>
</constraints>
```

---

## 15. Decision Frameworks

### ASCII decision trees

For tiered recommendations, ASCII trees are readable and directive:

```
What does your application need?

1. Single LLM call (classification, summarization, extraction, Q&A)
   └── Claude API — one request, one response

2. Does Claude need to read/write files, browse the web, or run shell commands?
   └── Yes → Agent SDK — built-in tools, implement on top of them

3. Workflow (multi-step, code-orchestrated, with your own tools)
   └── Claude API with tool use — you control the loop

4. Open-ended agent (model decides its own trajectory, your own tools)
   └── Claude API agentic loop (maximum flexibility)
```

Trees make "it depends" situations tractable. Each branch has one clear recommendation.

### Criteria checklists before choosing

Before recommending a complex approach, enumerate criteria that must all be true:

```xml
<criteria>
  Before choosing the agent tier, confirm all four:
  - Complexity — Is the task multi-step and hard to fully specify in advance?
  - Value — Does the outcome justify higher cost and latency?
  - Viability — Is Claude capable at this task type?
  - Cost of error — Can errors be caught and recovered from?

  Choose a simpler tier for any "no" answer.
</criteria>
```

### Comparison tables

Use tables when comparing options across multiple dimensions:

| Use Case | Tier | Surface | Why |
|---|---|---|---|
| Classification, summarization, Q&A | Single LLM call | Claude API | One request, one response |
| Multi-step pipelines with code logic | Workflow | Claude API + tool use | You orchestrate the loop |
| AI agent with file/web/terminal access | Agent | Agent SDK | Built-in tools, safety, MCP |

### The reversibility framework

For action-execution contexts, frame decisions around reversibility:

```xml
<constraints>
  <take_freely>
    Local, reversible actions: editing files, running tests
  </take_freely>

  <confirm_with_user>
    - Destructive operations: deleting files/branches, dropping DB tables, rm -rf
    - Hard-to-reverse: force-pushing, git reset --hard, amending published commits
    - Visible to others: pushing code, creating PRs, sending Slack messages
  </confirm_with_user>
</constraints>
```

"Blast radius" is a memorable heuristic — it captures both scope and irreversibility in one concept.

---

## 16. Multi-Phase Workflows

### The phase pattern

For complex multi-step tasks, organize into explicit named phases using XML tags:

```xml
<phase id="1" name="Research and Plan" mode="plan">
  [Instructions for research, decomposition, e2e test recipe, plan writing]
</phase>

<phase id="2" name="Spawn Workers" trigger="after_plan_approval">
  [Instructions for parallel agent spawning]
</phase>

<phase id="3" name="Track Progress">
  [Instructions for status table rendering and completion reporting]
</phase>
```

Phases create cognitive boundaries. The model completes one phase fully before beginning the next.

### Status tables for progress tracking

Use markdown tables to track parallel work:

```
| # | Unit | Status | PR |
|---|------|--------|----|
| 1 | <title> | running | — |
| 2 | <title> | running | — |
```

Re-render the table as agents complete. This provides visible progress and structured output for parsing.

### Round-based interviews

When gathering information interactively, structure as named rounds using XML tags:

```xml
<interview>
  <round id="1" name="High level confirmation">
    - Suggest a name and description. Ask user to confirm or rename.
    - Suggest high-level goals and success criteria.
  </round>

  <round id="2" name="Details">
    - Present high-level steps as numbered list.
    - Ask about arguments, execution context (inline vs forked), save location.
  </round>

  <round id="3" name="Step breakdown">
    For each step, ask:
    - What does this step produce that later steps need?
    - What proves this step succeeded?
    - Should user confirm before proceeding?
  </round>

  <round id="4" name="Final questions">
    - Confirm trigger conditions and phrases.
    - Ask for gotchas or edge cases.
  </round>
</interview>
```

Stop interviewing once you have enough information. Ask only what is needed — for simple processes, one or two rounds is sufficient.

### Required vs. optional steps

Distinguish mandatory from type-specific:

```xml
<required_steps universal="true">
  1. Read the project's CLAUDE.md / README for build/test commands
  2. Run the build (if applicable). A broken build is an automatic FAIL.
  3. Run the project's test suite. Failing tests are an automatic FAIL.
  4. Run linters/type-checkers if configured.
  5. Check for regressions in related code.
</required_steps>

<type_specific_strategy>
  Then apply the type-specific strategy above.
</type_specific_strategy>
```

### Scenario-based branching

Handle multiple scenarios explicitly rather than leaving the model to infer:

```xml
<scenarios>
  <scenario id="1" condition="verifier_skills_exist">
    1. Discover verifiers as described above
    2. Create plan and write to plan file
    3. Trigger each verifier skill sequentially
  </scenario>

  <scenario id="2" condition="no_verifier_skills_found">
    1. Inform the user: "No verifier skills found. Run `/init-verifiers` to create one."
    2. Await verifier skill configuration before proceeding.
  </scenario>

  <scenario id="3" condition="preexisting_plan_provided">
    1. Parse the provided plan
    2. Compare against current git diff
    3. If changes match → reuse the plan as-is
    4. If changes differ → create a fresh plan
  </scenario>
</scenarios>
```

---

## 17. Agent and Subagent Patterns

### Subagent configuration in frontmatter

Define all agent properties in the frontmatter:

```yaml
agentMetadata:
  agentType: 'Explore'
  model: 'haiku'
  permissionMode: 'dontAsk'
  disallowedTools:
    - Agent
    - ExitPlanMode
    - Edit
    - Write
    - NotebookEdit
  whenToUse: >
    Fast agent specialized for exploring codebases. Use this when you need to quickly
    find files by patterns (eg. "src/components/**/*.tsx"), search code for keywords
    (eg. "API endpoints"), or answer questions about the codebase.
  criticalSystemReminder: 'CRITICAL: This is a READ-ONLY task. You CANNOT edit, write, or create files.'
```

`whenToUse` is the trigger description shown to the orchestrating model. Make it action-specific, not capability-generic.

### Self-contained agent prompts

Each agent prompt must be fully self-contained when spawned:

```xml
<task>
  <goal>{the user's overall instruction}</goal>
  <unit_task>{this agent's specific task: title, file list, change description}</unit_task>
  <conventions>{codebase conventions the worker needs to follow}</conventions>
  <e2e_recipe>{the e2e test recipe from the plan}</e2e_recipe>
  <worker_instructions>{worker instructions, copied verbatim}</worker_instructions>
</task>
```

Every agent receives its full operating instructions directly — context inheritance from the parent is unavailable.

### Response format by context (subagent vs. standalone)

```
${IS_SUBAGENT?"When you complete the task, respond with a concise report covering what was
done and any key findings — the caller will relay this to the user, so it only needs the
essentials.":"When you complete the task simply respond with a detailed writeup."}
```

Subagent output is terse (for the orchestrating model). Standalone output is detailed (for the human).

### Absolute paths

Always enforce absolute file paths in agent output:

```xml
<constraints>
Return all file paths as absolute paths.

Agent threads always have their cwd reset between bash calls. Absolute paths remain valid
across all tool calls; relative paths break silently when the working directory changes.
</constraints>
```

### Parallel agent spawning

When spawning parallel workers:

```
spawn one background agent per work unit using the `${AGENT_TOOL_NAME}` tool.
All agents must use `isolation: "worktree"` and `run_in_background: true`.
Launch them all in a single message block so they run in parallel.
```

The single-message requirement ensures true parallelism — sequential spawning reduces throughput.

### Adversarial testing agent

The verification agent pattern uses an adversarial mindset:

```xml
<persona>
You are a verification specialist. Your job is not to confirm the implementation works —
it's to try to break it.

"The code looks correct by inspection" is NOT verification. You must run commands and
produce evidence.

After the required steps, you've confirmed the happy path — that's not enough. The
implementer already ran the happy path. Your value is finding what they didn't think to test:
the second request, the malformed input, the concurrent call, the resource that serves HTML
but whose dependencies 404.
</persona>

<adversarial_probes>
  Adapt to the change type:
  - Concurrency (servers/APIs): parallel requests to create-if-not-exists paths
  - Boundary values: 0, -1, empty string, very long strings, unicode, MAX_INT
  - Idempotency: same mutating request twice — duplicate created? error?
  - Orphan operations: delete/reference IDs that don't exist
</adversarial_probes>
```

---

## 18. Memory and Continuity

### Memory template structure

Memory files use XML tags for each named section, with the tag name serving as the template instruction:

```xml
<memory>
  <session_title>
    <!-- A short and distinctive 5-10 word descriptive title. Super info dense, no filler -->
  </session_title>

  <current_state>
    <!-- What is actively being worked on right now? Pending tasks not yet completed. Immediate next steps. -->
  </current_state>

  <task_specification>
    <!-- What did the user ask to build? Any design decisions or explanatory context -->
  </task_specification>

  <errors_and_corrections>
    <!-- Errors encountered and how they were fixed. What did the user correct? What approaches failed? -->
  </errors_and_corrections>
</memory>
```

The tag names are the template instructions. Only the content between the tags is updated; the tags themselves are immutable scaffolding.

### Compaction summary structure

For context handoff (when summarizing for future continuation):

```xml
<summary>
  <task_overview>
    - The user's core request and success criteria
    - Any clarifications or constraints they specified
  </task_overview>

  <current_state>
    - What has been completed so far
    - Files created, modified, or analyzed (with paths)
  </current_state>

  <discoveries>
    - Technical constraints or requirements uncovered
    - Decisions made and their rationale
    - Errors encountered and how they were resolved
    - Approaches tried that didn't work (and why)
  </discoveries>

  <next_steps>
    - Specific actions needed to complete the task
    - Any blockers or open questions
  </next_steps>

  <context_to_preserve>
    - User preferences or style requirements
    - Any promises made to the user
  </context_to_preserve>
</summary>
```

Err on the side of including information that would prevent duplicate work or repeated mistakes.

### Domain-specific memory instructions

Tailor memory to what the agent naturally discovers. Generic "learn from experience" instructions are less effective than domain-specific enumeration:

```xml
<!-- Codebase agent -->
<memory_instruction>
Update your agent memory as you discover code patterns, style conventions, common issues,
and architectural decisions in this codebase. Examples:
- "Auth uses JWT via src/middleware/auth.ts, validated on every request"
- "Tests use Vitest, run with `bun test`"
- "The team uses named exports exclusively"
</memory_instruction>

<!-- Architecture agent -->
<memory_instruction>
Update your agent memory as you discover codepaths, library locations, key architectural
decisions, and component relationships.
</memory_instruction>

<!-- Test agent -->
<memory_instruction>
Update your agent memory as you discover test patterns, common failure modes, flaky tests,
and testing best practices.
</memory_instruction>
```

### Anti-drift in continuity

Keep next steps directly tied to the most recent explicit user request:

```xml
<constraints>
Ensure that next steps are DIRECTLY in line with the user's most recent explicit requests
and the task in progress immediately before this summary request. List next steps only when
explicitly in line with the user's request — confirm with the user before resuming
tangential or earlier requests.

If there is a next step, include direct quotes from the most recent conversation showing
exactly what task you were working on and where you left off.
</constraints>
```

Direct quoting prevents interpretation drift.

---

## 19. Modularity and Composition

### Prompt files as first-class components

Each prompt component:
1. Has a single responsibility
2. Is independently understandable
3. Can be toggled on/off at runtime
4. References other modules only via template variables

### Explicit scope boundaries

When defining scope, state both what to include and what falls outside scope with equal specificity:

```xml
<scope>
  <include>
    1. Commands that will be commonly used (build, lint, run tests)
    2. High-level code architecture and structure
  </include>

  <exclude>
    - Content already present elsewhere in the prompt
    - Obvious instructions resolvable from context, e.g. "Provide helpful error messages"
    - Exhaustive lists of components or file structure discoverable by reading the code
    - Generic development practices
    - Speculative or invented information
  </exclude>
</scope>
```

The exclusion list is as important as the inclusion list — it narrows the scope to prevent bloat.

---

## 20. Safety and Trust Patterns

### The trust hierarchy

Validate at system boundaries; trust internal interfaces:

```xml
<constraints>
Add error handling and validation at system boundaries only: user input and external APIs.
Trust internal code and framework guarantees for internal interfaces.
</constraints>
```

Internal code is trusted. External input is validated. This keeps defensive code focused and auditable.

### Security censoring pattern

For dual-use capabilities, state what is permitted before what is restricted:

```xml
<constraints>
  <permitted>
    Assist with authorized security testing, defensive security, CTF challenges, and
    educational contexts.
  </permitted>

  <requires_authorization>
    Destructive techniques, DoS attacks, mass targeting, supply chain compromise, and
    detection evasion require explicit authorization context before proceeding. Dual-use
    security tools (C2 frameworks, credential testing, exploit development) require clear
    authorization context: pentesting engagements, CTF competitions, security research,
    or defensive use cases.
  </requires_authorization>
</constraints>
```

Permit-first-then-restrict framing reduces false refusals while still gating genuinely harmful requests.

### Denial handling

When a tool call is denied:

```xml
<constraints>
When the user denies a tool call, interpret the denial as signal: reason about what the
user's concern is and adjust your approach accordingly. Use the ${ASK_USER_QUESTION_TOOL_NAME}
to ask for clarification when the reason is unclear.

Functionally equivalent tools that accomplish the same goal are acceptable alternatives
(e.g. using head instead of cat). Substitutions that achieve the same effect through
a different surface while bypassing the user's evident intent are out of bounds
(e.g. using the test runner to execute non-test actions).
</constraints>
```

### Authorization scope

```xml
<constraints>
A user approving an action (like a git push) once authorizes that specific action.
Unless actions are authorized in advance in durable instructions like CLAUDE.md files,
confirm each action before taking it. Authorization stands for the scope specified;
match the scope of your actions to what was actually requested.
</constraints>
```

Authorization is narrow-scoped by default — confirm before expanding scope.

---

## 21. Tone and Style Rules

### Output efficiency principles

```xml
<output_format>
Lead with the answer or action. Choose the simplest approach that satisfies the requirement.
Be extra concise.

Keep text output brief and direct. Omit filler words, preamble, and unnecessary transitions.
Address the user's request directly. When explaining, include only what is necessary for
understanding.

Prefer one sentence over three when one suffices. Prefer short, direct sentences over long
explanations. Code and tool calls are exempt from these conciseness rules.
</output_format>
```

### Present the final product

```xml
<output_format>
Present only the final product of your reasoning to the user. Reserve working notes,
exploratory chains, and intermediate thinking for <analysis> tags — keep them out of
the user-facing response.
</output_format>
```

Use `<analysis>` tags for internal reasoning; surface only the result.

### Size constraints as hard rules

Numbered limits beat qualitative descriptors:

```xml
<output_format>
Format: 2-12 words, match the user's style. Or nothing.
Keep it short and simple, ideally no more than 6 words.
Describe your most recent action in 3-5 words using present tense (-ing).
Keep under 8 words. Begin directly with the action — omit "I did" or "The assistant".
</output_format>
```

"Brief" means different things; "under 8 words" does not.

### Active voice for commands

Use imperative present tense:

```
"List files in current directory" ✓
"Show working tree status" ✓
"Discard all local changes and match remote main" ✓
```

Passive, past tense, and gerund forms are less directive — use imperative present tense for all instructions.

### Code reference pattern

```
When referencing specific functions or pieces of code include the pattern
file_path:line_number to allow the user to easily navigate to the source code location.
```

---

## 22. Production Patterns

The following patterns each capture a high-leverage design decision distilled from real production prompts. Each is stated as a positive principle, followed by a concrete illustration.

---

### Pattern 1: Role identity scoped to the exact domain

State the agent's identity as a specific expert in the exact domain the task requires. The specificity creates behavioral bias — the model leans into that role rather than defaulting to generic assistant behavior.

```xml
<persona>
You are a software architect and planning specialist for Claude Code. Your role is to explore
the codebase and design implementation plans.
</persona>
```

The identity constrains the register, priorities, and decision-making style of every response that follows. A narrower identity produces more consistent, domain-appropriate outputs than a broad one.

---

### Pattern 2: Every abstract instruction paired with a calibrating example

Accompany each qualitative instruction with at least one concrete example that demonstrates the target standard. Qualitative terms like "concise" and "clear" are subjective; examples make them measurable.

```xml
<task>
Write clear, concise descriptions in active voice. Prefer plain, direct words.

<examples>
  <example>
    <input>ls</input>
    <output>List files in current directory</output>
  </example>
  <example>
    <input>git status</input>
    <output>Show working tree status</output>
  </example>
  <example>
    <input>find . -name "*.tmp" -exec rm {} \;</input>
    <output>Find and delete all .tmp files recursively</output>
  </example>
</examples>
</task>
```

The examples set the bar. The model calibrates against them rather than against its own prior of what "concise" means.

---

### Pattern 3: Output format specified completely and upfront

State the required output structure, field names, ordering, and an example before the model begins its task. Format specification is part of the task definition, not an afterthought.

```xml
<output_format>
Output findings in markdown. For each vulnerability include:
- File and line number
- Severity (HIGH/MEDIUM/LOW)
- Category (e.g., `sql_injection`, `xss`)
- Description
- Exploit scenario
- Fix recommendation

<example>
# Vuln 1: XSS: `foo.py:42`
* Severity: High
* Description: User input from `username` parameter is directly interpolated into HTML...
</example>
</output_format>
```

A fully specified format produces consistent, parseable output. An implicit format produces structure that varies per call.

---

### Pattern 4: Explicit tie-breaking rules matched to the domain's cost asymmetry

Add a tie-breaking rule that reflects the cost structure of the task — whether over-inclusion or under-inclusion is the more expensive error. This anchors behavior at the uncertainty boundary rather than leaving it to the model's priors. See Section 5 for the recall-biased vs. precision-biased examples.

The tie-breaking rule is the instruction that fires at the margin. Getting it wrong in the wrong direction for the domain degrades quality in exactly the cases that matter most.

---

### Pattern 5: Decomposed, single-responsibility prompt modules

Build prompt systems as composed collections of small, focused files — each covering one behavioral concern — rather than as monolithic documents. Each module is independently readable, testable, and togglable.

```
security-constraints.md     (7 words + explanation)
no-premature-abstractions.md (35 words)
action-safety.md             (250 words)
output-efficiency.md         (120 words)
```

Composition at runtime means each configuration includes exactly the modules it needs. A monolithic prompt bundles all concerns together; changing one risks coupling to others, and selective toggling is impossible.

---

### Pattern 6: Confidence thresholds and explicit scope filters on filtering tasks

For tasks that produce a ranked or filtered set of findings, specify both what to include (with a numeric confidence floor) and the categories that are always out of scope. This controls signal-to-noise at the instruction level rather than leaving it to post-hoc review.

```xml
<constraints>
  <reporting_threshold>
    Report only issues where you're >80% confident of actual exploitability.
    Focus on confirmed vulnerabilities; omit theoretical issues, style concerns,
    and low-impact findings.
  </reporting_threshold>

  <exclusions>
    1. DoS vulnerabilities or resource exhaustion attacks
    2. Rate limiting concerns
    ...
  </exclusions>
</constraints>
```

Pick one confidence scale and use it consistently — mixing percentage thresholds with numeric scales in the same block creates exactly the kind of constraint conflict Section 1 warns against.

A report with false-positive filtering built in is credible and actionable. One without it requires the reader to apply the filter manually — which they will do inconsistently, or not at all.

---

### Pattern 7: Domain-specific memory instructions with typed examples

Specify what is worth remembering in terms of the concrete artifact types the agent encounters in its domain, with at least two examples that demonstrate the format and specificity of a useful memory entry.

```xml
<memory_instruction>
Update your agent memory as you discover code patterns, style conventions, common issues,
and architectural decisions in this codebase. Examples:
- "Auth uses JWT via src/middleware/auth.ts, validated on every request"
- "Tests use Vitest, run with `bun test`"
- "The team uses named exports exclusively"
</memory_instruction>
```

Domain-typed examples teach the model what granularity and form a useful memory entry takes. Generic instructions produce generic memories — too vague to act on in a subsequent session.

---

### Pattern 8: Adversarial verification scope with mandatory probe reporting

For verification tasks, define success as evidence produced through active probing — including boundary conditions, concurrency, and idempotency — and require at least one adversarial probe in every report.

```xml
<persona>
You are a verification specialist. Your value is finding what the implementer didn't think
to test. Produce evidence through commands, not inspection.
</persona>

<adversarial_probes>
After confirming the happy path, probe these dimensions:
- Concurrency: parallel requests to create-if-not-exists paths
- Boundary values: 0, -1, empty string, MAX_INT
- Idempotency: same mutating request twice — duplicate created? error?
- Orphan operations: reference IDs that don't exist
</adversarial_probes>

<output_format>
Your report MUST include at least one adversarial probe you ran and its result — even
if the result was "handled correctly."
</output_format>
```

Verification that covers only the happy path duplicates what the implementer already tested. The probe requirement ensures the verification agent reaches the cases that actually matter.

---

### Pattern 9: Tool permissions scoped to minimum required patterns

Express allowed tools as the narrowest patterns that satisfy the task, specifying command prefixes and tool name patterns rather than granting whole-tool access.

```yaml
allowed-tools:
  - Bash(npm:*)
  - Bash(yarn:*)
  - mcp__playwright__*
  - Read
  - Glob
  - Grep
```

Narrow permissions make the skill's intended behavior explicit, limit blast radius if the agent goes off-path, and make permission grants auditable at a glance. Whole-tool grants (e.g. `Bash` with no prefix) leave the permission boundary undefined.

---

## 23. Quick-Reference Checklist

Apply this checklist before emitting any final prompt.

```xml
<checklist>

  <task_specification>
    [ ] Intent, audience, and quality bar are all explicit in the prompt
    [ ] All constraints are compatible — no conflicts between scope, length, or depth
  </task_specification>

  <chain_of_thought>
    [ ] CoT is included only for math, symbolic reasoning, or multi-step logic tasks
    [ ] CoT trigger used: "Take a deep breath and work on this problem step-by-step."
    [ ] Reasoning is elicited before the answer, not after
    [ ] CoT traces are treated as heuristic aids, verified against ground truth downstream
  </chain_of_thought>

  <few_shot_examples>
    [ ] Examples selected by semantic similarity
    [ ] 2–5 examples total (exceed only with strong justification)
    [ ] Ordered simple → complex, with the most representative example last
    [ ] Examples span diverse sub-types of the task
    [ ] Format is consistent across all examples
    [ ] Example order is fixed across all evaluation runs
  </few_shot_examples>

  <formatting>
    [ ] Instruction is complete and clear before any formatting is applied
    [ ] Prompt sections are separated by semantically named XML tags
    [ ] At least 3 format variants will be tested on the target model
  </formatting>

  <instruction_framing>
    [ ] All negative instructions have been converted to positive equivalents
    [ ] Priority order is explicit when multiple criteria apply
    [ ] Tie-breaking rules match the domain's cost asymmetry (recall-biased vs. precision-biased)
  </instruction_framing>

  <persona>
    [ ] Persona is included only for open-ended or stylistic tasks
    [ ] Persona is specific (constrains voice/register), not generic
    [ ] Persona descriptor is gender-neutral
  </persona>

  <output_format>
    [ ] Structured output tasks use a two-step reasoning-then-format approach
    [ ] Single-call JSON places reasoning fields before answer fields
    [ ] Constrained decoding is adopted only after free-form + post-processing has proven insufficient
    [ ] Machine-parsed output uses exact format specification with literal string requirements
  </output_format>

  <context_placement>
    [ ] Task instruction is at the start of the prompt
    [ ] Primary document or input is at the end of the prompt
    [ ] Background context is in the middle
    [ ] All irrelevant context has been removed
    [ ] Time-sensitive injected context is labeled as a snapshot
  </context_placement>

  <self_consistency>
    [ ] Self-consistency is applied only to tasks with a single correct answer
    [ ] Inference budget permits 15–20 samples
  </self_consistency>

  <prompt_length>
    [ ] Redundant instructions and repeated context have been removed
    [ ] Long prompts have been compressed before sending
    [ ] RAG context is the extracted relevant passage only
  </prompt_length>

  <system_user_split>
    [ ] Persistent instructions are in the system prompt
    [ ] Task-specific instructions are in the user prompt
    [ ] Each instruction appears in exactly one location
    [ ] Safety-critical constraints have external validation independent of the prompt
  </system_user_split>

  <agent_subagent>
    [ ] Agent prompts are fully self-contained
    [ ] All file paths in agent output are absolute
    [ ] Parallel agents are launched in a single message block
    [ ] Adversarial probes are specified for verification agents
  </agent_subagent>

  <structural_architecture>
    [ ] Large prompts are decomposed into atomic, single-responsibility modules
    [ ] Template variables use ${VARIABLE_NAME} syntax with fallback where appropriate
    [ ] Modules compose at runtime via variable substitution, not copy-paste
  </structural_architecture>

  <constraint_enforcement>
    [ ] Every restriction is paired with an equally concrete permission
    [ ] Hard exclusion lists are enumerated, not described qualitatively
    [ ] Known edge cases have precedent-style rulings
    [ ] Confidence thresholds are numeric, not qualitative
  </constraint_enforcement>

  <decision_frameworks>
    [ ] Multi-option recommendations use an explicit decision tree or comparison table
    [ ] Criteria checklists gate complex approaches
    [ ] Action permissions are framed around reversibility
  </decision_frameworks>

  <multi_phase_workflows>
    [ ] Complex tasks are organized into explicit named phases
    [ ] Required steps are distinguished from type-specific steps
    [ ] Scenario-based branching handles multiple paths explicitly
  </multi_phase_workflows>

  <memory_and_continuity>
    [ ] Memory templates use XML tags as section labels
    [ ] Compaction summaries include discoveries and failed approaches
    [ ] Next steps are tied to the user's most recent explicit request
  </memory_and_continuity>

  <modularity>
    [ ] Each prompt component has a single responsibility
    [ ] Scope boundaries state both inclusions and exclusions
  </modularity>

  <safety_and_trust>
    [ ] Validation is at system boundaries only; internal interfaces are trusted
    [ ] Dual-use capabilities state permissions before restrictions
    [ ] Authorization is narrow-scoped; each action confirmed before expanding scope
  </safety_and_trust>

  <tone_and_style>
    [ ] Size constraints use numeric limits, not qualitative descriptors
    [ ] Instructions use imperative present tense
    [ ] Working notes are in analysis tags, not user-facing output
  </tone_and_style>

  <optimization>
    [ ] Prompt is flagged as a draft for automated optimization
    [ ] Correct optimizer selected (MIPROv2 for pipelines, OPRO for single prompts)
    [ ] Held-out test set reserved before optimization begins
  </optimization>

</checklist>
```

---

*This guide applies to instruction-tuned / RLHF models. Effect sizes vary by model family, scale, and task domain. Treat all rules as strong priors — validate on your specific task and model.*
