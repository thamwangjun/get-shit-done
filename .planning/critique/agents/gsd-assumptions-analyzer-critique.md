# Prompt Engineering Critique: gsd-assumptions-analyzer

**Agent:** `gsd-assumptions-analyzer.md`

---

## Guide Sections Evaluated

- §1 Task Specification
- §4 Formatting and Structure
- §5 Instruction Framing
- §6 Persona Assignment
- §7 Output Format Handling
- §8 Context Placement
- §11 System vs. User Prompt Allocation (YAML frontmatter)
- §13 Structural Architecture Patterns
- §14 Constraint Enforcement
- §17 Agent and Subagent Patterns
- §19 Modularity and Composition
- §21 Tone and Style Rules
- §22 Production Patterns (1, 2, 3, 9)

---

## Strengths

**§4 / §17 — Self-contained, well-scoped agent structure.** The prompt defines its role, input contract, process, output format, rules, and anti-patterns as discrete labeled sections. This matches the guide's requirement that each agent prompt be fully self-contained (§17: "Every agent receives its full operating instructions directly — context inheritance from the parent is unavailable").

**§1 — Task components are explicit.** The agent states what output is requested (structured assumptions with confidence levels and evidence), why it matters (spawned by discuss-phase to surface assumptions before planning), and what high quality looks like (calibrated areas, file-path citations, honest confidence levels). All three components from §1 Action 1 are present.

**§14 — Constraint enforcement via anti_patterns block.** The `<anti_patterns>` section pairs restrictions with their positive scoped alternatives. For example, "Do NOT research beyond what the codebase contains" is paired with "flag gaps in 'Needs External Research'" — matching §14's principle of pairing every restriction with what IS permitted.

**§19 — Single responsibility.** The agent does exactly one thing: codebase analysis for one phase, returning structured assumptions. It explicitly defers presentation to the parent workflow ("you return structured output for the main workflow to present and confirm"). This is consistent with §19's modular principle.

**§14 / Rules block — Confidence calibration as a constraint.** Rule 3 ("Confidence levels must be honest — do not inflate Confident when evidence is thin") is a meaningful behavioral guard. Rule 4 ("Minimize Unclear items by reading more files before giving up") gives an actionable positive framing of a quality standard.

**§8 — Context placement is logical.** The `<input>` section describes the five variables the agent receives in order of relevance: phase identity, goal, prior decisions, codebase hints, calibration tier. Task instruction (`<role>`) leads; the variable-driven input (`<input>`) follows.

---

## Weaknesses

### 1. Persona uses a generic "expert" framing (§6)

> `<role>` block: `"You are a GSD assumptions analyzer."`

The guide (§6 Action 2) is explicit: "Generic expert framing ('you are an expert data scientist') produces no measurable accuracy gain. A persona must constrain register, voice, or domain-specific style to be effective." The current role statement names the agent but says nothing about *how* it should reason, what its decision-making biases are, or what voice it should use. Compare to the guide's effective example: "You are a verification specialist. Your job is not to confirm the implementation works — it's to try to break it." That pattern (§6 reframe) explicitly displaces a default prior.

**The `<role>` tag is also non-standard vocabulary.** The guide's tag vocabulary (§4) specifies `<persona>` as the correct tag for "role, voice, strengths, and identity." Using `<role>` loses the semantic clarity the tag vocabulary is designed to provide.

### 2. No XML tag vocabulary compliance — mixed markdown and XML (§4)

The output format uses a fenced markdown code block containing markdown headers (`##`, `###`, `**bold**`) rather than the guide's XML tag vocabulary. The guide (§4 Action 2) states: "Use XML tags to separate prompt sections... Tags name what the section *is*, not just where it starts, giving the model richer signal than delimiters alone." The guide further states this is "strictly better than markdown headers or `---` delimiters for Claude-class models."

The internal prompt sections themselves also mix approaches: `<role>`, `<input>`, `<calibration_tiers>`, `<process>`, `<output_format>`, `<rules>`, `<anti_patterns>` — these use XML tags inconsistently. `<calibration_tiers>` contains raw markdown headers (`### full_maturity`), and `<anti_patterns>` is not in the guide's standard vocabulary (`<constraints>` with `<exclusions>` sub-tags is the correct structure per §14).

### 3. Output format is under-specified — no example, no machine-parse anchor (§7, §22 Pattern 3)

The `<output_format>` section provides a prose template but:
- There is no concrete filled example demonstrating the target standard (§22 Pattern 2: "Accompany each qualitative instruction with at least one concrete example that demonstrates the target standard").
- There is no specification for how the parent workflow parses the output. If this agent's output is machine-parsed by the calling `discuss-phase` workflow, the guide (§7, machine-parsed output) requires an exact format specification: "End your response with a verdict line in exactly this format — it is parsed by the calling agent." No such anchor exists here.
- The calibration tier modifies output shape (number of areas, alternatives, evidence depth) but the output format template does not show variants — the model must infer how the template changes per tier, which is ambiguous.

### 4. Instruction framing contains negative directives not converted to positive equivalents (§5)

The `<rules>` block mixes well-formed positive instructions with negated ones. The guide (§5 Action 1) requires converting all negative instructions to positive equivalents:

> Rule 5: "Do NOT suggest scope expansion -- stay within the phase boundary."
> Rule 6: "Do NOT include implementation details (that's for the planner)."
> Rule 7: "Do NOT pad with obvious assumptions -- only surface decisions that could go multiple ways."

These should be rewritten as positive scoping statements. The `<anti_patterns>` block is entirely negated ("Do NOT present output directly to user", "Do NOT research beyond...") — the guide's §5 conversion table pattern applies throughout.

### 5. YAML frontmatter is missing key agent metadata (§11, §17)

The frontmatter is minimal:
```
name: gsd-assumptions-analyzer
description: Deeply analyzes codebase for a phase...
tools: Read, Bash, Grep, Glob
color: cyan
```

The guide (§11, §17) specifies that agent frontmatter should encode: `agentType`, `model`, `permissionMode`, `disallowedTools`, `whenToUse` (the trigger description for the orchestrating model), and `criticalSystemReminder`. None of these are present. The `whenToUse` field is specifically called out as "the trigger description shown to the orchestrating model. Make it action-specific, not capability-generic." A subagent spawned by `discuss-phase` will be invoked based on this description — its absence means the orchestrator cannot make an informed routing decision.

### 6. No confidence threshold defined numerically (§14)

The `<calibration_tiers>` section defines output *shape* per tier, but the confidence classification system (Confident / Likely / Unclear) has no numeric thresholds defining what constitutes each level. The guide (§14, confidence thresholds) is explicit: "Numeric thresholds beat qualitative terms like 'high confidence' — they are calibratable." The current labels are subjective; different invocations will interpret them differently.

### 7. Process steps are imperative prose but lack phase-tagged structure (§16)

The `<process>` section is an 8-step numbered list. For a multi-step workflow, the guide (§16) recommends organizing into explicit named phases using `<phase>` tags to create cognitive boundaries. While 8 steps is below the threshold where full phase tagging becomes critical, the steps involve distinct operation types (read planning files → search codebase → read source files → classify → return) that would benefit from explicit phase delineation and required-vs-optional step marking (§16, `<required_steps universal="true">`).

---

## Concrete Improvements

### Improvement 1: Replace `<role>` with a specific `<persona>` using the reframe pattern

**Current:**
```xml
<role>
You are a GSD assumptions analyzer. You deeply analyze the codebase for ONE phase...
</role>
```

**Rewrite:**
```xml
<persona>
You are a codebase evidence analyst. Your job is not to suggest what to build — it is to
surface what the code already implies, with honest confidence calibration.

Your strengths:
- Tracing existing patterns across multiple source files to surface structural assumptions
- Distinguishing Confident findings (directly observable in code) from Likely inferences
- Knowing when to stop reading and flag a gap rather than speculate
</persona>
```

This applies §6 Action 2 (specific persona), §6 reframe pattern (displaces default prior), and §6 strengths listing (biases toward desired behaviors).

### Improvement 2: Convert all negative rules to positive equivalents

**Current (Rule 5):**
```
Do NOT suggest scope expansion -- stay within the phase boundary.
```

**Rewrite:**
```
Surface only assumptions directly relevant to the stated phase goal. Scope-expanding
observations belong in "Needs External Research", not in the assumptions list.
```

**Current (anti_patterns block, first item):**
```
Do NOT present output directly to user (main workflow handles presentation)
```

**Rewrite (move into `<constraints>` with `<reserved_for_human_review>`):**
```xml
<constraints>
  <permitted>
    Return structured output to the calling workflow in the exact format specified.
  </permitted>
  <reserved_for_human_review>
    Presenting output directly to the user — the parent discuss-phase workflow handles
    all user-facing presentation.
  </reserved_for_human_review>
</constraints>
```

### Improvement 3: Add a concrete filled example to `<output_format>`

**Add inside `<output_format>` after the template:**
```xml
<example>
## Assumptions

### State Management Approach
- **Assumption:** New feature will use the existing Zustand store pattern rather than
  introducing a new state layer.
  - **Why this way:** `src/store/userStore.ts` and `src/store/sessionStore.ts` use
    identical Zustand slice patterns; no Redux or Context usage found in feature components.
  - **If wrong:** A new state layer creates a split architecture requiring migration of
    existing slices before launch.
  - **Confidence:** Confident

### Data Fetching Pattern
- **Assumption:** API calls will use the existing `useFetch` hook in
  `src/hooks/useFetch.ts` rather than a direct fetch or new library.
  - **Why this way:** All 12 existing data-fetching components import `useFetch`;
    no direct fetch calls found in `src/features/`.
  - **If wrong:** Bypassing `useFetch` loses centralized error handling and retry logic,
    requiring duplicated error boundary work.
  - **Confidence:** Likely

## Needs External Research
- React Query v5 compatibility with the existing useFetch abstraction if caching
  behaviour needs to change.
</example>
```

### Improvement 4: Expand YAML frontmatter with full agent metadata

**Current:**
```yaml
name: gsd-assumptions-analyzer
description: Deeply analyzes codebase for a phase...
tools: Read, Bash, Grep, Glob
color: cyan
```

**Rewrite:**
```yaml
name: gsd-assumptions-analyzer
description: >
  Analyzes the codebase for a single phase and returns structured assumptions with
  file-path evidence and calibrated confidence levels. Spawned by discuss-phase
  assumptions mode; returns to the calling workflow, not the user.
tools: Read, Bash, Grep, Glob
color: cyan
agentMetadata:
  agentType: AssumptionsAnalyzer
  permissionMode: dontAsk
  disallowedTools:
    - Write
    - Edit
    - WebFetch
    - WebSearch
    - Agent
  whenToUse: >
    Use when you need codebase-grounded assumptions for a specific phase before planning.
    Provide phase number, phase goal, prior decisions, codebase hints, and calibration
    tier. Returns a structured assumptions block; does not present to the user directly.
  criticalSystemReminder: >
    CRITICAL: This is a READ-ONLY analysis task. Do not write, edit, or create files.
    Return output to the calling workflow only.
```

### Improvement 5: Add numeric confidence thresholds

**Add to `<calibration_tiers>` or as a new `<confidence_scoring>` block:**
```xml
<confidence_scoring>
  - Confident: Direct evidence in source code — the pattern is observable, not inferred.
    Example: the same import appears in 5+ components; a config file specifies the value.
  - Likely: Consistent indirect evidence — the inference is the natural reading of the
    code, but at least one alternative exists. Example: all similar features use X, so
    this one probably will too.
  - Unclear: Conflicting evidence or absence of evidence after reading 5+ relevant files.
    Do not use Unclear as a default — read more files first.
</confidence_scoring>
```

---

## Overall Score: 6 / 10

**Justification:** The agent is functionally coherent and operationally complete — it defines its inputs, process, output format, and behavioral constraints clearly enough to produce useful output. The calibration tier system and the `<anti_patterns>` block are genuinely thoughtful design decisions that reflect production experience.

However, it misses several high-leverage guide requirements: the persona is generic rather than behaviorally constraining (§6); nearly all negative instructions remain unconverted (§5); the output format lacks a filled example and any machine-parse anchor (§7, §22 Pattern 3); the YAML frontmatter is missing critical agent metadata fields (`whenToUse`, `disallowedTools`, `criticalSystemReminder`) that the guide explicitly requires for subagent prompts (§11, §17); and confidence levels are qualitative labels rather than numerically calibrated thresholds (§14). These are not cosmetic gaps — they directly affect how reliably the model will produce consistent, well-scoped output across invocations.
