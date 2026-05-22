# How to Improve an Existing Prompt

> A step-by-step guide derived from the Prompt Engineering Guide V09. Follow these steps in order on any prompt you want to improve. Each step tells you what to look for, why it matters, and how to fix it. The checklist at the end is your exit criterion — the improved prompt must pass every applicable item before it ships.

---

## Before You Begin: What Problem Are You Solving?

Clarify the failure mode before touching the prompt. Misdiagnosing the problem leads to fixes that don't address the root cause.

**Classify the symptom:**

```
Wrong format (structure doesn't match what's needed)?
  → Focus on: Formatting and Structure, Output Format Handling, System/User Split

Wrong content (right structure, wrong information)?
  → Focus on: Task Specification, Instruction Framing, Context Placement

Hallucinations or fabrications?
  → Focus on: Instruction Framing (positive framing), Constraint Enforcement

Constraint violations (model ignores rules)?
  → Focus on: Constraint Enforcement, System/User Split

Inconsistent outputs across runs?
  → Focus on: Few-Shot Examples, Self-Consistency, Format Variants

Off-topic or scope drift?
  → Focus on: Task Specification, Modularity, Constraint Enforcement
```

Collect at least **two example outputs** that demonstrate the problem before proceeding. You cannot reliably diagnose a prompt from the text alone.

---

## Step 1 — Audit Task Specification

**What to check:**  
Does the prompt explicitly state (a) what output is requested, (b) why it matters or how it will be used, and (c) what a correct response looks like?

**How to spot the problem:**  
If any of the three is absent or vague, the model is free to fill the gap with its own assumptions — and it will.

**How to fix it:**  
Add explicit `<task>`, `<audience>`, and `<quality_bar>` blocks:

```xml
<task>Summarize the incident report below into three bullet points.</task>

<audience>
On-call engineers reviewing alerts. Assume familiarity with distributed systems.
Assume no familiarity with this specific service.
</audience>

<quality_bar>
Each bullet is one sentence. Bullets cover: what failed, why it failed, what was done.
Omit speculation. Use precise technical language, not hedging prose.
</quality_bar>
```

**Constraint compatibility check:**  
List every constraint in the prompt (length, format, tone, scope, depth). Check each pair: can both be satisfied simultaneously? A prompt that demands "comprehensive analysis" and "one paragraph" is internally contradictory — the model will resolve the conflict unpredictably.

```xml
<constraint_check>
  Constraint A: "comprehensive analysis"
  Constraint B: "one paragraph"
  Status: CONFLICT — choose: expand length limit OR narrow scope
</constraint_check>
```

Resolve every conflict before moving on.

---

## Step 2 — Convert Negative Instructions to Positive

**What to check:**  
Scan the entire prompt for instructions that use "do not", "avoid", "never", or "don't" as the primary directive. These tell the model what to move away from, not what to move toward — which leaves the destination undefined.

**How to fix it:**  
Convert mechanically using this table:

| Negative (remove this) | Positive (replace with this) |
|---|---|
| "Do not be vague" | "Be specific: include exact figures, dates, or names" |
| "Do not repeat yourself" | "Each sentence introduces new information" |
| "Do not use passive voice" | "Use active voice throughout" |
| "Do not hallucinate" | "If uncertain, say 'I don't know' rather than guessing" |
| "Do not use bullet points" | "Write in flowing prose paragraphs" |
| "Avoid being too long" | "Response must be 150 words or fewer" |
| "Don't be too technical" | "Define every technical term on first use" |

**Exception:** The reframe pattern is the one context where a negative clause is valid and intentional — it displaces a strong model default:

```xml
<persona>
You are a verification specialist. Your job is not to confirm the implementation works —
it's to try to break it.
</persona>
```

This negative clause works because it overrides a specific, predictable default (confirmatory bias). Use it deliberately; don't use it as a substitute for positive instruction.

---

## Step 3 — Apply XML Structure

**What to check:**  
Are prompt sections separated by semantically named XML tags? Or are they separated by markdown headers, dashes, or nothing at all?

**Why it matters:**  
Tag names carry semantic meaning. `<task>` signals the primary instruction in a way `---` cannot. Tags are also unambiguous and machine-parseable, and they do not collide with content that contains markdown.

**How to fix it:**  
Wrap every distinct section in a semantically named tag. Use this vocabulary:

| Tag | Purpose |
|---|---|
| `<task>` | Primary instruction: what the model must do |
| `<context>` | Background information; helpful but not critical |
| `<input>` | The primary content the model must act on |
| `<output_format>` | Required structure, fields, length, and constraints |
| `<constraints>` | Behavioral rules and permission boundaries |
| `<persona>` | Role, voice, and domain identity |
| `<examples>` / `<example>` | Few-shot examples |
| `<audience>` | Who will use the output and at what level |
| `<quality_bar>` | What makes a correct or high-quality response |
| `<analysis>` | Scratchpad reasoning (model-side only, not user-facing) |
| `<reasoning>` | Chain-of-thought trace; must precede `<answer>` |

**Before (unstructured):**
```
You are a helpful assistant. Classify the document below into legal, medical, financial, 
or other. Respond with a single word.

{document_text}
```

**After (structured):**
```xml
<task>
Classify the document below into one of: legal, medical, financial, other.
</task>

<output_format>
Respond with a single word: the classification label.
</output_format>

<input>
{document_text}
</input>
```

---

## Step 4 — Fix Context Placement

**What to check:**  
Where does the task instruction appear? Where does the primary input appear? Where is the background context?

**Why it matters:**  
Models weight content near the start and end of a prompt more heavily than content in the middle. Misplacing elements causes the model to underweight the parts that matter most.

**The correct order:**

```
<task>         ← HIGH attention: leads the prompt
<context>      ← LOWER attention: middle position (background info goes here)
<input>        ← HIGH attention: closes the prompt (the thing to act on)
```

**Common mistake to fix:**  
Background context placed at the top before the task instruction — it displaces the task from the high-attention position. Background context that is irrelevant to the current task at all — remove it entirely. Every token must earn its place.

**Note on injected context:**  
If any context was injected at runtime (e.g., current date, retrieved documents, system state), label it explicitly as a snapshot:

```xml
<context>
  <snapshot timestamp="${TIMESTAMP}">
    ${RETRIEVED_DOCUMENT}
  </snapshot>
</context>
```

---

## Step 5 — Add Explicit Priority and Tie-Breaking

**What to check:**  
When the model must weigh multiple criteria, does the prompt specify their order? When the model is uncertain, does the prompt tell it which direction to err?

**Why it matters:**  
Without priority ordering, the model interpolates between criteria in unpredictable ways. Without tie-breaking, it defaults to a generic heuristic that may not match your domain's cost asymmetry.

**How to fix priority ordering:**

```xml
<priority_order>
  1. Safety constraints (highest priority — never violate)
  2. Accuracy over completeness
  3. Brevity over exhaustiveness
  4. Format compliance
</priority_order>
```

**How to fix tie-breaking — match the rule to your domain's cost:**

```xml
<!-- Recall-biased context (search, retrieval): include more, miss less -->
<tie_breaking>
  When in doubt, INCLUDE. Returning extra results is preferable to missing relevant ones.
</tie_breaking>

<!-- Precision-biased context (recommendations, alerts): include less, be selective -->
<tie_breaking>
  Include only items you are certain will be helpful. Omit anything where usefulness
  is unclear. Be selective.
</tie_breaking>
```

**How to fix conditional behavior:**  
If behavior depends on input state, use explicit branching:

```
If no order ID is present in the input, ask the user for it before proceeding.
If an order ID is present, look it up and summarize the order status.
```

---

## Step 6 — Review the Persona (or Remove It)

**What to check:**  
Does the prompt include a persona? If so, is it actually needed? Is it generic or specific?

**Decision rule:**
```
Task is open-ended, stylistic, or requires a specific voice?
  YES → Keep or add a specific, role-constrained persona.
  NO  → Remove the persona. It will not improve accuracy and adds noise.
```

**Generic personas produce no measurable gain — remove them:**

```xml
<!-- Remove this -->
<persona>You are an expert with 20 years of experience in data science.</persona>
```

**Specific personas constrain voice, register, and style — keep these:**

```xml
<!-- Keep this — constrains voice and output style concretely -->
<persona>
You are a senior technical writer at a developer tools company.
Write in present tense, active voice, and lead with user benefit.
</persona>
```

**Strengths listing biases agent behavior toward specific capabilities:**

```xml
<persona>
You are a codebase exploration specialist.

Your strengths:
- Searching for code, configurations, and patterns across large codebases
- Analyzing multiple files to understand system architecture
- Investigating complex questions that require exploring many files
</persona>
```

**Always use gender-neutral role descriptions.**

---

## Step 7 — Check Chain-of-Thought Usage

**What to check:**  
Does the prompt include a reasoning trigger? Is the task type one that actually benefits from chain-of-thought?

**Decision rule:**
```
Is the task symbolic reasoning, math, or multi-step logic?
  YES → CoT is appropriate. Trigger: "Take a deep breath and work on this problem step-by-step."
  NO  → Is the task factual recall, commonsense, or classification?
          YES → Omit CoT. Direct answering performs better.
          NO  → Is the task perceptual, visual, or pattern-matching?
                  YES → Omit CoT.
                  NO  → Apply CoT and monitor quality.
```

**If CoT is appropriate, reasoning must come before the answer:**

```xml
<reasoning>{model works through the problem here}</reasoning>
<answer>{final answer only after reasoning is complete}</answer>
```

**Scratchpad pattern** — separates internal reasoning from user-facing output:

```
Before providing your final answer, wrap your analysis in <analysis> tags.
```

**Important:** CoT traces are heuristic aids, not ground truth. For any downstream system that consumes CoT output, treat it as indicative and validate against external ground truth.

---

## Step 8 — Audit Constraint Enforcement

**What to check:**  
Does the prompt state only what is prohibited, without stating what is permitted? Are confidence thresholds qualitative ("high confidence") rather than numeric? Are exclusions described in prose rather than enumerated?

**How to fix restriction-only constraints:**  
Pair every restriction with an equally concrete permission:

```xml
<constraints>
  <permitted>
    - Read any file in the repository
    - Run read-only shell commands (grep, find, ls, cat, git log)
    - Write ephemeral test scripts to /tmp only; clean up after use
  </permitted>

  <reserved_for_human_review>
    - Creating, modifying, or deleting project files
    - Installing dependencies
    - Running git write operations (add, commit, push)
  </reserved_for_human_review>
</constraints>
```

**How to fix qualitative confidence thresholds:**

```xml
<!-- Replace this -->
"Only report high-confidence findings."

<!-- With this -->
<confidence_scoring>
  - 0.9–1.0: Report — certain pattern identified
  - 0.8–0.9: Report — clear pattern with known exploitation conditions
  - 0.7–0.8: Report with caveat — suspicious pattern requiring specific conditions
  - Below 0.7: Omit — too speculative to report reliably
</confidence_scoring>
```

**Hard exclusion lists** should enumerate items explicitly, not describe categories qualitatively:

```xml
<exclusions>
  Automatically exclude:
  1. Denial of Service (DoS) vulnerabilities
  2. Rate limiting concerns
  3. Findings in documentation files only
</exclusions>
```

---

## Step 9 — Fix the System/User Split

**What to check:**  
Are persistent instructions (persona, output style, constraints) mixed into the user prompt? Are task-specific instructions mixed into the system prompt? Does any instruction appear in both locations?

**The correct allocation:**

| Belongs in System Prompt | Belongs in User Prompt |
|---|---|
| Persona / role | Task instruction for this request |
| Output style rules | Current input content |
| Behavioral constraints | Task-specific context |
| Domain-specific rules that never change | Dynamic variables |

**Each instruction must appear in exactly one location.** Duplication adds noise without reinforcing compliance.

**Safety-critical constraints** must be backed by external validation independent of the prompt. Instruction hierarchy (system > user) is not reliably enforced — user-turn authority cues can override system-level constraints. If a rule must hold without exception, validate the output programmatically, not just in the prompt.

---

## Step 10 — Remove Redundancy and Compress

**What to check:**  
Are there repeated instructions that say the same thing in different words? Is all the context in the prompt directly relevant to the current task? Are long retrieved documents included in full rather than as extracted relevant passages?

**How to fix it:**

- Audit every instruction. If two instructions say the same thing, consolidate to a single canonical statement in the most appropriate location.
- Remove any context that does not directly support the task. Each token must earn its place.
- For RAG-injected context: extract only the relevant passage (target: under 200 tokens) rather than including the full document.
- For long prompts: consider LLMLingua-2 or similar perplexity-based compression before sending to the model.

---

## Step 11 — Flag for Automated Optimization

**What to check:**  
Is this prompt treated as final, or as a draft to be optimized?

**Why it matters:**  
Manually constructed prompts are starting points. Automated optimizers consistently outperform human-crafted prompts by 5–50% on benchmark tasks. Every manually built prompt is a draft.

**Route to the correct optimizer:**

```
Multi-stage pipeline with multiple LLM calls?
  YES → DSPy MIPROv2 (jointly optimizes instructions and demonstrations across all modules)

Single-prompt, single-model call?
  YES → OPRO or ProTeGi (instruction-only optimization)

Target model smaller than ~13B parameters?
  YES → Skip automated optimization for now. Prioritize carefully selected
        few-shot examples and zero-shot CoT triggers instead.
```

**Reserve a held-out test set before any optimization run.** Never validate the optimized prompt on the same data the optimizer used.

---

## Final Checklist

Run this checklist against the improved prompt before shipping. Every applicable item must pass.

```
TASK SPECIFICATION
[ ] Intent is explicit — what the model must do is unambiguous
[ ] Audience is explicit — domain knowledge level and vocabulary are specified
[ ] Quality bar is explicit — what makes a correct or high-quality response is stated
[ ] All constraints are compatible — no two constraints conflict

INSTRUCTION FRAMING
[ ] Every instruction specifies desired behavior directly (positive framing)
[ ] No "do not" / "avoid" / "never" used as a primary directive without a positive rewrite
[ ] Priority order is explicit when multiple criteria apply
[ ] Tie-breaking rule matches the domain's cost asymmetry (recall vs. precision)
[ ] Conditional behavior uses explicit if/then branching

FORMATTING AND STRUCTURE
[ ] Instruction is complete and clear before any formatting is applied
[ ] All prompt sections are separated by semantically named XML tags
[ ] At least 3 format variants are planned for evaluation (for prompts running at scale)

CONTEXT PLACEMENT
[ ] Task instruction is at the start of the prompt (high-attention position)
[ ] Primary input or document is at the end of the prompt (high-attention position)
[ ] Background context is in the middle (lower-attention position)
[ ] All irrelevant context has been removed — every token earns its place
[ ] Time-sensitive injected context is labeled as a snapshot

PERSONA
[ ] Persona is included only for open-ended or stylistic tasks
[ ] Persona is specific: it constrains voice, register, and domain — not just declares expertise
[ ] Persona descriptor is gender-neutral

CHAIN-OF-THOUGHT
[ ] CoT is included only for math, symbolic reasoning, or multi-step logic
[ ] Reasoning is elicited before the answer (not after)
[ ] CoT traces are treated as heuristic aids — downstream systems verify against ground truth

FEW-SHOT EXAMPLES (if applicable)
[ ] 2–5 examples total
[ ] Ordered simple → complex, with the most representative example last
[ ] Examples span diverse sub-types of the task
[ ] Format is identical across all examples
[ ] Example order is fixed across all evaluation runs

OUTPUT FORMAT
[ ] Structured output tasks use two-step reasoning → format (separate calls) or reasoning fields before answer fields in single-call
[ ] Machine-parsed output uses an exact format specification with literal string requirements
[ ] Constrained decoding is adopted only after free-form + post-processing proved insufficient

SYSTEM / USER SPLIT
[ ] Persistent instructions are in the system prompt
[ ] Task-specific instructions are in the user prompt
[ ] Each instruction appears in exactly one location
[ ] Safety-critical constraints have external validation independent of the prompt

CONSTRAINT ENFORCEMENT
[ ] Every restriction is paired with an equally concrete permission
[ ] Hard exclusion lists are enumerated, not described qualitatively
[ ] Confidence thresholds are numeric, not qualitative
[ ] Known edge cases have precedent-style rulings

COMPRESSION AND REDUNDANCY
[ ] Duplicate instructions have been consolidated to a single canonical statement
[ ] All context is directly relevant to the current task
[ ] RAG-injected context is the extracted relevant passage only (target: under 200 tokens)

OPTIMIZATION
[ ] Prompt is marked as a draft for automated optimization
[ ] Correct optimizer is selected (MIPROv2 for pipelines, OPRO for single prompts)
[ ] Held-out test set is reserved before optimization begins
```

---

*Derived from Prompt Engineering Guide V09. Effect sizes vary by model family, scale, and task domain. Treat all rules as strong priors — validate on your specific task and model.*
