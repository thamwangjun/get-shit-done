# Critique: gsd-user-profiler.md

**Agent**: `gsd-user-profiler.md`

---

## Guide Sections Evaluated

- §1 Task Specification
- §4 Formatting and Structure
- §5 Instruction Framing
- §6 Persona Assignment
- §7 Output Format Handling
- §8 Context Placement
- §10 Prompt Length and Compression
- §11 System vs. User Prompt Allocation
- §13 Structural Architecture Patterns
- §14 Constraint Enforcement
- §16 Multi-Phase Workflows
- §17 Agent and Subagent Patterns
- §19 Modularity and Composition
- §21 Tone and Style Rules
- §22 Production Patterns (Patterns 1, 2, 3, 7)

---

## Strengths

**§4.2 — XML tag structure is used throughout.** The prompt correctly separates `<role>`, `<input>`, `<reference>`, `<process>`, `<output>`, and `<constraints>` into semantically named sections. This is better practice than markdown headers or freeform prose.

**§16 — Multi-phase workflow is explicit and named.** The `<process>` block uses `<step name="...">` tags (`load_rubric`, `read_messages`, `analyze_dimensions`, `filter_sensitive`, `assemble_output`), creating clear cognitive boundaries and ordering. The guide recommends named phases for complex tasks (§16 phase pattern).

**§7 — Output format is fully specified upfront.** The `<output>` section states that JSON must be wrapped in `<analysis>` tags and explains why ("The orchestrator parses the tags programmatically"). This matches §22 Pattern 3: "Output format specified completely and upfront."

**§14 — Constraints section is present and specific.** Sensitive content exclusion patterns are enumerated as a concrete list (`sk-`, `Bearer `, `password`, etc.) rather than described qualitatively. This aligns with §14 hard exclusion lists.

**§5 — Conditional instructions are explicit.** The `claude_instruction` generation rule branches explicitly by confidence level: "For LOW confidence dimensions: include a hedging instruction... For UNSCORED dimensions: use a neutral fallback." This is good conditional framing per §5.

**§17 — Subagent context is acknowledged.** The `<role>` block identifies the spawning context ("spawned by the profile orchestration workflow (Phase 3) or by write-profile during standalone profiling"), providing useful orientation for the orchestrator.

**§1 — Output purpose and consumer are stated.** The prompt identifies what output is requested (structured JSON), who consumes it (the orchestration workflow), and what quality looks like (matches the reference doc schema exactly). All three components from §1 Action 1 are present.

---

## Weaknesses

### W1 — Persona is generic, not specific (§6)

The `<role>` block reads:

> "You are a GSD user profiler. You analyze a developer's session messages to identify behavioral patterns across 8 dimensions."

§6 Action 2 states: "Generic expert framing... produces no measurable accuracy gain. A persona must constrain register, voice, or domain-specific style to be effective." The current persona states what the agent does, not how it reasons or what behavioral biases to adopt. There is no equivalent to the guide's example of enumerating "Your strengths:..." (§6 Strengths listing). No reframe pattern is used despite the adversarial-analytical nature of the task (e.g., "Your job is not to confirm patterns exist — it's to find the *strongest evidence* and flag when data is insufficient").

### W2 — Negative instructions are not converted to positive equivalents (§5 Action 1)

The `<constraints>` block contains multiple negated directives that are never rewritten as positive specifications:

> "Never select evidence quotes containing sensitive patterns..."
> "Never invent evidence or fabricate quotes..."
> "Never rate a dimension HIGH without 10+ signals..."
> "Never invent dimensions beyond the 8 defined in the reference document"

§5 Action 1 requires scanning for negated instructions and converting each: "Do not hallucinate" → "If uncertain, say 'I don't know' rather than guessing." Five of the nine constraints in the block are negatives. These should be reframed as positive behavioral directives.

### W3 — No quality bar or audience specification (§1 Action 2)

The prompt omits explicit audience encoding. §1 Action 2 requires: "Encode the audience explicitly in the prompt: their domain knowledge, vocabulary level, and any relevant assumptions they bring." The consuming orchestrator has specific parsing requirements (it reads `<analysis>` tags programmatically), but the prompt never names or characterizes the downstream consumer. No `<audience>` or `<quality_bar>` tag appears, which are in the guide's standard vocabulary (§4 XML tag vocabulary).

### W4 — Output format uses a fenced code block instead of an XML schema tag (§4, §7)

The `<output>` block wraps the expected response in a markdown fenced code block:

```
Format:
```
<analysis>
{...}
</analysis>
```
```

§4 Action 2 specifies XML tags as strictly better than markdown delimiters for Claude-class models. The format specification itself should use an `<output_format>` tag (listed in §4 XML tag vocabulary), and the example should use `<example>` tags with `<output>` sub-tags per §3 production example patterns. Markdown fencing inside a system prompt is a step down in semantic signal.

### W5 — The reference doc is loaded via an `@` include directive with no fallback or inline summary (§8, §13)

The entire scoring rubric is externalized:

> "@~/.claude/get-shit-done/references/user-profiling.md"

§17 "Self-contained agent prompts" states: "Every agent receives its full operating instructions directly — context inheritance from the parent is unavailable." An `@`-include is a path-dependent runtime dependency. If the reference file is missing, moved, or renamed, the agent silently loses its entire rubric with no fallback. The prompt provides no inline description of what the rubric contains beyond a bullet list in `<step name="load_rubric">`. §13 template variable injection suggests `${VAR||"(default value)"}` for optional context — the same principle applies here: there should be a declared fallback or at minimum a stated dependency that the orchestrator can validate before spawning.

### W6 — Confidence thresholds repeat the reference doc rather than asserting authoritative rules (§14, §22 Pattern 6)

The `<step name="analyze_dimensions">` block re-states the confidence thresholds inline:

> "HIGH: 10+ signals (weighted) across 2+ projects, MEDIUM: 5-9, LOW: <5, UNSCORED: 0"

And the `<step name="load_rubric">` also lists them. This is a §11 Action 3 violation: "State each instruction exactly once." The thresholds appear in three places: `load_rubric`, `analyze_dimensions`, and `constraints`. Pick one canonical location (the `<constraints>` block) and remove the redundant appearances.

### W7 — The `<step name="analyze_dimensions">` sub-instructions use bold markdown inside XML, mixing formatting conventions (§4)

Steps 1–7 inside `analyze_dimensions` use `**bold**` markdown to label sub-steps:

> "1. **Scan for signal patterns**"
> "2. **Count evidence signals**"

The guide recommends XML tags as the primary structural mechanism within prompts (§4 Action 2). Using markdown bold inside XML for structural labeling mixes conventions and reduces parsability. These sub-steps should either use XML sub-tags or plain numbered prose — not markdown formatting.

### W8 — No explicit tie-breaking rule for rating ambiguity (§5, §22 Pattern 4)

Dimensions can receive conflicting signals from different projects. The prompt acknowledges this ("Report context-dependent splits rather than forcing a single rating when contradictory signals exist"), but provides no tie-breaking rule for when signals are ambiguous *within* a single project. §5 recommends explicit tie-breaking matched to the domain's cost asymmetry. For a profiler, the cost of a false HIGH-confidence rating is higher than a false LOW — this precision-biased asymmetry should be stated as a `<tie_breaking>` rule (§4 XML vocabulary), not left implicit.

---

## Concrete Improvements

### Improvement 1 — Replace generic persona with a specific, reframe-pattern persona (fixes W1)

Replace the current `<role>` block with a `<persona>` tag:

```xml
<persona>
You are a behavioral analyst specializing in developer workflow profiling.

Your job is not to confirm that patterns exist — it's to find the strongest available
evidence and accurately flag when data is insufficient.

Your strengths:
- Reading between the lines of terse developer messages to infer behavioral tendencies
- Distinguishing signal from noise in sampled session data
- Calibrating confidence precisely against evidence count thresholds
- Producing machine-consumable structured output with zero schema deviation
</persona>
```

### Improvement 2 — Convert all negative constraints to positive directives (fixes W2)

Replace the `<constraints>` negatives:

```xml
<!-- Before -->
- Never select evidence quotes containing sensitive patterns (sk-, Bearer, password...)
- Never invent evidence or fabricate quotes

<!-- After -->
- Select only quotes free of sensitive patterns (sk-, Bearer, password, secret, token as
  credential, api_key, full file paths with usernames). When all candidates contain
  sensitive content, reduce the evidence count and record the exclusion.
- Ground every quote in an actual session message verbatim. Mark a dimension UNSCORED
  rather than fabricating evidence.
- Rate a dimension HIGH only when 10+ weighted signals appear across 2+ projects.
  When the threshold is not met, downgrade to MEDIUM or LOW.
- Score only the 8 dimensions defined in the reference document. Ignore patterns that
  do not map to those dimensions.
```

### Improvement 3 — Add `<audience>`, `<quality_bar>`, and a precision-biased tie-breaking rule (fixes W3, W8)

Add these blocks after `<persona>`:

```xml
<audience>
The orchestrating profile workflow: a programmatic consumer that extracts the JSON payload
from `<analysis>` tags. It has no tolerance for schema deviation, markdown commentary outside
the tags, or invented field names.
</audience>

<quality_bar>
A high-quality analysis: (1) all 8 dimensions present with all required fields populated,
(2) every evidence quote sourced verbatim from the input messages, (3) confidence levels
calibrated to the exact signal-count thresholds, (4) claude_instruction fields phrased as
imperative directives. An analysis that invents evidence or inflates confidence is worse
than one that returns UNSCORED.
</quality_bar>

<constraints>
  ...existing content...
  <tie_breaking>
    When signals within a single project are ambiguous, choose the lower confidence level.
    A false HIGH-confidence rating that guides Claude toward a wrong behavioral assumption
    is more costly than a LOW rating that prompts Claude to ask. Err toward precision,
    not recall.
  </tie_breaking>
</constraints>
```

### Improvement 4 — Replace the `<output>` format block with a proper `<output_format>` tag and deduplicate thresholds (fixes W4, W6)

```xml
<output_format>
Return one `<analysis>` block containing the complete JSON. No text, markdown commentary,
or explanations outside the tags — the orchestrator parses the tags programmatically and
discards everything outside them.

<example>
  <output>
    <analysis>
    {
      "profile_version": "1.0",
      "analyzed_at": "2024-01-15T10:30:00Z",
      "message_threshold": "full",
      "sensitive_excluded": [],
      "dimensions": {
        "dimension_key": {
          "rating": "...",
          "confidence": "HIGH | MEDIUM | LOW | UNSCORED",
          "evidence_count": 12,
          "cross_project_consistent": true,
          "evidence_quotes": [...],
          "summary": "...",
          "claude_instruction": "..."
        }
      }
    }
    </analysis>
  </output>
</example>

If data is insufficient, return the full schema with UNSCORED dimensions rather than
omitting them. Partial schemas break the orchestrator's field-access logic.
</output_format>
```

Remove the duplicate confidence threshold listings from `<step name="load_rubric">` and `<step name="analyze_dimensions">`. Keep the single authoritative definition in `<constraints>`.

### Improvement 5 — Add a declared dependency and fallback for the external reference include (fixes W5)

Prefix the `<reference>` block with a dependency declaration:

```xml
<reference>
DEPENDENCY: The scoring rubric at `~/.claude/get-shit-done/references/user-profiling.md`
must be readable before analysis begins. If the file cannot be read, halt and return:
{"error": "rubric_unavailable", "path": "~/.claude/get-shit-done/references/user-profiling.md"}
Do not proceed to analyze dimensions without the rubric loaded.

@~/.claude/get-shit-done/references/user-profiling.md
</reference>
```

---

## Overall Score: 6 / 10

**Justification.** The agent demonstrates solid structural discipline — named XML sections, explicit multi-step workflow, concrete exclusion lists, and a fully specified output schema with downstream consumer context. These reflect genuine production-grade thinking. However, several high-leverage guide rules are violated: the persona is generic where it should be specific and adversarially framed; five of nine constraints are negative directives that should be positive; a quality bar and audience tag are absent; the output format block uses markdown fencing instead of XML; thresholds are repeated in three locations instead of one; and the external rubric dependency has no fallback handling. Fixing W1, W2, and W4 alone would raise the score to 8+, as they are the highest-impact deficiencies against the guide's §5, §6, and §4 rules respectively.
