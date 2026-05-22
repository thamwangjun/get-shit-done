# Critique: list-workspaces.md

## Summary

`list-workspaces.md` is a minimal, functional workflow prompt that successfully communicates its happy-path behavior with concrete output examples. However, it is far below production quality by most guide measures. It lacks XML structural tags, carries no explicit task specification (intent, audience, quality bar), defines no persona, has no constraint block, omits any output format specification, provides no branching instructions beyond the two-branch `workspace_count` check, and makes no provision for error conditions. The prose is readable and the SDK query pattern is idiomatic, but the file reads as a rough internal draft rather than a production-grade workflow prompt.

---

## Strengths

- **Conditional branching is present (Section 5, conditional instructions).** The two-branch structure (count = 0 vs. count > 0) is explicit and unambiguous. Each branch has a clearly stated terminal action.
- **Concrete output examples anchor expected behavior (Section 22, Pattern 2 and Pattern 3).** Both the zero-workspace message and the table format are shown verbatim, giving the model a calibration target rather than a qualitative description.
- **The setup step is imperative and action-oriented (Section 21, active voice).** "Parse JSON for: …" is directive and direct.
- **Scope is implicitly narrow.** The prompt does one thing only (list workspaces), which aligns with the single-responsibility principle (Section 19, modularity).

---

## Issues

### Issue 1 — No XML structural tags separate prompt sections
**Guide reference:** Section 4 Action 2; Section 4 XML tag vocabulary.

**What is wrong:** The entire prompt is written in plain markdown with custom `##`-headed sections (`<purpose>`, `<required_reading>`, `<process>` are XML-like but non-standard and do not follow the guide's defined tag vocabulary). The guide states XML tags are "strictly better than markdown headers or `---` delimiters for Claude-class models: the tag name carries semantic meaning, the structure is unambiguous."

**Concrete fix:** Restructure using standard tags:

```xml
<task>
List all GSD workspaces found in ~/gsd-workspaces/ and display their status.
</task>

<context>
...background on workspace_base and SDK query pattern...
</context>

<process>
...steps...
</process>

<output_format>
...table spec and zero-state message...
</output_format>
```

---

### Issue 2 — No explicit task specification (intent, audience, quality bar)
**Guide reference:** Section 1 Action 1; Section 1 Action 2.

**What is wrong:** The `<purpose>` tag says "List all GSD workspaces … with their status" — this covers the "what" but omits "why that output matters or how it will be used" and "what a correct or high-quality response looks like." There is no audience definition. The consuming context (a developer running `/gsd-list-workspaces` in a Claude Code session) is implicit, not encoded.

**Concrete fix:** Add an `<audience>` and `<quality_bar>` block:

```xml
<audience>
A developer running the /gsd-list-workspaces command inside a Claude Code session.
They are familiar with GSD workflows and need a fast, scannable status snapshot —
not a tutorial.
</audience>

<quality_bar>
A correct response: shows all workspaces in a single table with accurate Name, Repos,
Strategy, and GSD Project fields; or renders the zero-state message if no workspaces
exist. Response is complete in one pass with no follow-up questions.
</quality_bar>
```

---

### Issue 3 — No constraint block; no error-path handling
**Guide reference:** Section 14 (explicit permission pairs); Section 5 (conditional instructions for all runtime paths); Section 1 Action 3 (constraint audit).

**What is wrong:** The workflow runs a Bash SDK query with no instruction on what to do if the query fails, if the JSON is malformed, if `~/gsd-workspaces/` does not exist, or if individual workspace directories are partially corrupted. No `<constraints>` block defines what the agent may or may not do. The guide requires every restriction to be paired with a concrete permission; here, neither is stated.

**Concrete fix:** Add a `<constraints>` block and a third scenario branch:

```xml
<constraints>
  <take_freely>
    Run read-only shell commands to inspect workspace directories (ls, cat, test -d).
  </take_freely>
  <confirm_with_user>
    Do not modify, create, or delete any workspace files or directories.
  </confirm_with_user>
</constraints>
```

Add a third conditional branch in `<process>`:

```
If the SDK query fails or returns malformed JSON:
  Inform the user: "Could not load workspace data. Run `gsd-sdk query init.list-workspaces`
  manually to diagnose."
  Do not proceed.
```

---

### Issue 4 — Output format is partially specified but not enclosed in an `<output_format>` block
**Guide reference:** Section 7; Section 22 Pattern 3.

**What is wrong:** The table column names and example rows are shown inline inside the `## 2. Display` step. There is no `<output_format>` wrapper, no statement of which fields are required vs. optional, no instruction on how to handle a workspace with a missing `WORKSPACE.md` (the Strategy field depends on it), and no size constraint on the response. Pattern 3 requires the output format to be "specified completely and upfront."

**Concrete fix:** Extract all output specification into a top-level `<output_format>` block placed before `<process>`, include fallback values for missing fields, and add a hard size constraint:

```xml
<output_format>
Zero-state (no workspaces): output exactly the two-line message shown below, then stop.
Non-zero state: output the header line, then a markdown table with columns:
  Name | Repos | Strategy | GSD Project
Fallback values: if WORKSPACE.md is missing, Strategy = "unknown". If repo count
is unavailable, Repos = "—".
Follow the table with the two management hints shown in the process section.
No prose commentary beyond what is shown in the examples.
</output_format>
```

---

### Issue 5 — No persona defined for a task that has a specific voice/register requirement
**Guide reference:** Section 6 Action 1 and Action 2; Section 22 Pattern 1.

**What is wrong:** The workflow produces user-facing output (a formatted table and actionable next steps). The guide notes that personas constrain "register, voice, or domain-specific style." A terse, developer-tool register is appropriate here, but it is entirely implicit. Without a persona, the model may add explanatory prose, add greetings, or pad the response.

**Concrete fix:** Add a scoped persona:

```xml
<persona>
You are a workspace status reporter for a developer CLI tool.
Output only what is specified in the output format — no greetings, no summaries,
no unsolicited suggestions beyond the management hints shown.
</persona>
```

---

### Issue 6 — `<required_reading>` instruction is vague and unactionable
**Guide reference:** Section 5 Action 1 (convert negative/vague instructions to specific positive ones); Section 8 Action 4 (trim context to what is directly relevant).

**What is wrong:** "Read all files referenced by the invoking prompt's execution_context before starting" is instruction the agent cannot reliably execute because `execution_context` is undefined within this file's scope. It references an implicit external dependency without stating what files are expected or what to do if they are absent.

**Concrete fix:** Either enumerate the specific files to read (if they are known and stable), or remove the `<required_reading>` block entirely if the SDK query already encapsulates the needed data. If it must remain, make it conditional:

```
If the invoking skill passes an execution_context path via ${EXECUTION_CONTEXT_PATH},
read that file before running the SDK query. Otherwise proceed directly to Setup.
```

---

## Quick-Reference Checklist Score

Scored against Section 23. Items marked N/A where the checklist item is structurally inapplicable to a simple list-and-display workflow.

| Category | Checklist Item | Score |
|---|---|---|
| **Task Specification** | Intent, audience, and quality bar are all explicit | FAIL |
| | All constraints are compatible — no conflicts | PASS (no constraints to conflict) |
| **Chain of Thought** | CoT included only for math/symbolic/multi-step logic tasks | PASS (no CoT present; task does not require it) |
| | CoT trigger used correctly | N/A |
| | Reasoning elicited before answer | N/A |
| | CoT traces treated as heuristic | N/A |
| **Few-Shot Examples** | Examples selected by semantic similarity | N/A |
| | 2–5 examples total | N/A |
| | Ordered simple → complex | N/A |
| | Examples span diverse sub-types | N/A |
| | Format consistent across examples | N/A |
| | Example order fixed across evaluation runs | N/A |
| **Formatting** | Instruction complete and clear before formatting applied | PASS (instruction is clear) |
| | Prompt sections separated by semantically named XML tags | FAIL |
| | At least 3 format variants will be tested | FAIL |
| **Instruction Framing** | All negative instructions converted to positive equivalents | PASS (no negatives present) |
| | Priority order explicit when multiple criteria apply | FAIL (no priority ordering stated) |
| | Tie-breaking rules match domain's cost asymmetry | FAIL (no tie-breaking defined) |
| **Persona** | Persona included only for open-ended or stylistic tasks | FAIL (stylistic task; no persona present) |
| | Persona is specific (constrains voice/register) | FAIL |
| | Persona descriptor is gender-neutral | N/A (no persona) |
| **Output Format** | Structured output tasks use two-step reasoning-then-format | N/A (no structured reasoning needed) |
| | Single-call JSON places reasoning before answer | N/A |
| | Constrained decoding adopted only after free-form proven insufficient | N/A |
| | Machine-parsed output uses exact format spec | FAIL (table format shown by example but not formally specified) |
| **Context Placement** | Task instruction at start of prompt | FAIL (purpose tag is at start but process is not properly ordered) |
| | Primary document or input at end of prompt | N/A (no document input) |
| | Background context in the middle | FAIL (no explicit middle-context block) |
| | All irrelevant context removed | PASS |
| | Time-sensitive injected context labeled as snapshot | N/A |
| **Self-Consistency** | Applied only to tasks with a single correct answer | N/A |
| | Inference budget permits 15–20 samples | N/A |
| **Prompt Length** | Redundant instructions and repeated context removed | PASS |
| | Long prompts compressed before sending | N/A (prompt is short) |
| | RAG context is extracted relevant passage only | N/A |
| **System/User Split** | Persistent instructions in system prompt | N/A (workflow file, not system/user split context) |
| | Task-specific instructions in user prompt | N/A |
| | Each instruction appears in exactly one location | PASS |
| | Safety-critical constraints have external validation | N/A |
| **Agent/Subagent** | Agent prompts are fully self-contained | FAIL (references undefined `execution_context`) |
| | All file paths in agent output are absolute | PASS (~/gsd-workspaces/ path is shown) |
| | Parallel agents launched in single message block | N/A |
| | Adversarial probes specified for verification agents | N/A |
| **Structural Architecture** | Large prompts decomposed into atomic modules | PASS (prompt is already small and focused) |
| | Template variables use ${VARIABLE_NAME} syntax with fallback | FAIL (no template variables used; fields like Strategy have no fallback) |
| | Modules compose at runtime via variable substitution | FAIL |
| **Constraint Enforcement** | Every restriction paired with equally concrete permission | FAIL (no constraints block) |
| | Hard exclusion lists enumerated | N/A |
| | Known edge cases have precedent-style rulings | FAIL (missing: SDK query failure, malformed JSON, missing WORKSPACE.md) |
| | Confidence thresholds are numeric | N/A |
| **Decision Frameworks** | Multi-option recommendations use decision tree or table | N/A |
| | Criteria checklists gate complex approaches | N/A |
| | Action permissions framed around reversibility | FAIL |
| **Multi-Phase Workflows** | Complex tasks organized into explicit named phases | N/A (single-phase workflow) |
| | Required steps distinguished from type-specific steps | N/A |
| | Scenario-based branching handles multiple paths explicitly | FAIL (error path missing) |
| **Memory and Continuity** | Memory templates use XML tags as section labels | N/A |
| | Compaction summaries include discoveries and failed approaches | N/A |
| | Next steps tied to user's most recent explicit request | N/A |
| **Modularity** | Each prompt component has a single responsibility | PASS |
| | Scope boundaries state both inclusions and exclusions | FAIL (no explicit exclusion scope) |
| **Safety and Trust** | Validation at system boundaries only | N/A |
| | Dual-use capabilities state permissions before restrictions | N/A |
| | Authorization narrow-scoped | N/A |
| **Tone and Style** | Size constraints use numeric limits | FAIL (no output size constraint) |
| | Instructions use imperative present tense | PASS |
| | Working notes in analysis tags, not user-facing output | N/A |
| **Optimization** | Prompt flagged as draft for automated optimization | FAIL |
| | Correct optimizer selected | FAIL |
| | Held-out test set reserved | FAIL |

**Summary:** 11 PASS, 17 FAIL, 26 N/A across applicable items.

---

## Recommendations

Listed in priority order from highest to lowest impact.

### 1. Wrap all sections in semantically named XML tags (Section 4 Action 2)

This is the single highest-leverage change. Replacing markdown `##` headers with proper XML tags (`<task>`, `<output_format>`, `<process>`, `<constraints>`) gives Claude-class models unambiguous section boundaries and semantic signal about each section's role. It also creates the structural prerequisite for all other improvements. Estimated effort: 10 minutes.

### 2. Add `<audience>` and `<quality_bar>` to satisfy Section 1 Action 1–2

Without an explicit audience and quality bar, the model cannot self-assess whether its output is complete. Add a four-line audience block (developer, Claude Code context, expects terse output) and a two-line quality bar (table or zero-state message, no prose padding). This prevents the model from adding unsolicited commentary or asking clarifying questions.

### 3. Add a `<constraints>` block with a persona and reversibility framing (Section 14; Section 6; Section 15)

The workflow has no guard against the model taking write actions or asking questions mid-execution. A `<constraints>` block with `<take_freely>` (read-only shell inspection) and `<confirm_with_user>` (no modifications) combined with a terse CLI persona (Section 6 Action 2) will keep execution on rails and output on-register. This also satisfies the reversibility framework requirement from Section 15.

### 4. Add error-path branching for SDK query failure and missing WORKSPACE.md (Section 5, conditional instructions; Section 16, scenario-based branching)

The current prompt only handles two scenarios: zero workspaces and workspaces exist. At minimum two additional branches are needed: (a) SDK query fails or returns malformed JSON, and (b) a workspace directory exists but `WORKSPACE.md` is missing. Define fallback values (Strategy = "unknown") and a clear user-facing failure message for the query error case. Without this, the agent will hallucinate or stall when it hits a real-world edge case.

### 5. Promote the output format to a top-level `<output_format>` block with field-level fallback rules (Section 7; Section 22 Pattern 3)

Move the table specification and zero-state message out of the process steps and into a dedicated `<output_format>` block placed before `<process>`. Add a numeric size constraint ("no prose beyond the table and two management hints"), explicit fallback values for each field, and restate that no additional commentary is permitted. This is a prerequisite for reliable, parseable output across all runtime conditions.
