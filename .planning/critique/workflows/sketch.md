# Critique: sketch.md

## Summary

`sketch.md` is a well-structured, human-readable workflow with a clear process narrative and solid step sequencing. It correctly uses `<step>` tags to delineate phases, provides good qualitative guidance on what makes a sketch useful ("real-ish content, not lorem ipsum"), and includes a checkpoint loop that stops for user feedback before proceeding. However, it reads largely as a prose recipe rather than a precision prompt: it relies on qualitative terms instead of numeric constraints, omits XML structure for its core instructions (using markdown headers and prose instead of the guide's XML vocabulary), has no explicit persona, defines no output format for the model's conversational responses, and provides no tie-breaking rules or constraint audit. Against the guide's checklist it scores moderately on process correctness but poorly on structural rigor, instruction framing, and format specification.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase pattern correctly applied.** Each step is a named `<step>` element with a descriptive `name` attribute. Phases are sequential and clearly bounded, matching the guide's phase-pattern intent.
- **Section 16 — Required vs. optional steps distinguished.** The `--quick` flag path skips mood intake and jumps straight to `decompose`, making conditional branching explicit rather than leaving it to the model to infer.
- **Section 16 — Scenario-based branching present.** The `build_sketches` step handles three explicit feedback scenarios: "pick a direction," "cherry-pick elements," and "want more exploration," matching the guide's `<scenario>` pattern in spirit.
- **Section 1 — Quality bar partially present.** The "Good sketches / Bad sketches" table in `decompose` provides a concrete quality bar by example, satisfying part of Section 1 Action 1's requirement to specify what a high-quality response looks like.
- **Section 8 — Context placement roughly correct.** The `<purpose>` block leads, followed by `<required_reading>`, then the `<process>` body, placing high-level intent before procedural detail.
- **Section 14 — `COMMIT_DOCS` config gate is an effective constraint.** Gating the commit step on a runtime config variable avoids unconditional side-effects — a correct application of reversibility-scoped permissions.
- **Section 21 — Active voice used throughout.** Instructions are imperative present tense: "Create," "Build," "Parse," "Check," "Present." This matches the guide's style rules.

---

## Issues

### Issue 1 — No XML structure for top-level prompt sections
**Principle:** Section 4 Action 2 — Use semantically named XML tags to separate distinct prompt sections. Section 4 XML tag vocabulary — `<task>`, `<persona>`, `<output_format>`, `<constraints>`, `<quality_bar>`, `<audience>`.

**What's wrong:** The prompt's core sections — purpose, required reading, process, success criteria — use a mix of ad-hoc XML tags (`<purpose>`, `<required_reading>`, `<process>`, `<success_criteria>`) and bare markdown. None of the guide's canonical top-level tags are used. The `<purpose>` block is equivalent to `<task>`, `<success_criteria>` is equivalent to `<quality_bar>`, and there is no `<constraints>`, `<audience>`, or `<output_format>` tag at all. The model receives weaker structural signal than the guide demands.

**Concrete fix:** Replace ad-hoc tags with the guide's canonical vocabulary:
```xml
<task>
Explore design directions through throwaway HTML mockups before committing to implementation.
Each sketch produces 2-3 variants for comparison. Save artifacts to `.planning/sketches/`.
</task>

<audience>
A developer or designer who has a rough idea for a UI and wants to rapidly compare visual
directions before writing production code. They are comfortable opening HTML files in a browser.
</audience>

<quality_bar>
Each sketch answers exactly one design question with 2-3 meaningfully different variants.
Variants use real-ish content, not placeholder text. The user can open any variant in a
browser and interact with it without a build step.
</quality_bar>

<constraints>
...
</constraints>
```

---

### Issue 2 — No persona defined
**Principle:** Section 6 Action 1 — Classify the task before assigning a persona. This is an open-ended, stylistic, and collaborative task requiring a specific voice. Section 6 Action 2 — Make personas specific, not generic. Section 6 — Strengths listing biases behavior toward target capabilities.

**What's wrong:** The workflow provides no persona. The model defaults to generic assistant behavior. For a workflow that requires the model to lead a structured design conversation, reflect what it has heard, and propose concrete design directions, an explicit persona constrains register and priorities in a way that meaningfully changes output quality.

**Concrete fix:** Add a `<persona>` block before the `<process>`:
```xml
<persona>
You are a product design collaborator who specializes in rapid visual exploration.
Your role is to surface design tradeoffs quickly through throwaway code, not to produce
polished UI. You ask focused questions, reflect what you hear, and build immediately —
favoring action over deliberation.

Your strengths:
- Translating vague aesthetic instincts ("warm and dense") into concrete layout decisions
- Identifying the single design question each sketch should answer
- Generating meaningfully different variants, not superficial color swaps
- Keeping the conversation moving toward a browser-ready artifact
</persona>
```

---

### Issue 3 — Qualitative size constraints throughout
**Principle:** Section 21 — Size constraints use numeric limits, not qualitative descriptors. "Brief" means different things; "under 8 words" does not.

**What's wrong:** Multiple steps use qualitative length language:
- `mood_intake`: "briefly reflect what you heard" — how many sentences is "briefly"?
- `decompose`: "one-line description" — how many words?
- `create_manifest`: "One paragraph capturing the mood/feel/direction" — how many sentences?
- `report` step: no length constraints on the "Design Direction" or "Key Decisions" sections.

**Concrete fix:** Replace each qualitative descriptor with a numeric bound:
- "briefly reflect what you heard" → "In 1-2 sentences, reflect what you heard."
- "one-line description" → "8-15 word description"
- "One paragraph capturing the mood/feel/direction" → "2-4 sentence paragraph"
- In the `report` step, add: `Design Direction: 2-3 sentences. Key Decisions: bullet list, 4-8 items. Open Questions: bullet list, 0-5 items.`

---

### Issue 4 — No output format specification for conversational responses
**Principle:** Section 7 — Output format handling. Section 22 Pattern 3 — Output format specified completely and upfront. The guide requires an `<output_format>` block that specifies required structure, field names, ordering, and an example.

**What's wrong:** The workflow specifies artifact output formats (the README frontmatter, the MANIFEST table, the commit message pattern) but never specifies the format of the model's conversational responses — the reflections during mood intake, the decompose table presentation, the checkpoint message, or the final report. Each of these is described only in English prose without a format block or example. The checkpoint presentation (lines 176-190) is hardcoded ASCII art inline in step text rather than wrapped in an `<output_format>` block.

**Concrete fix:** Add an `<output_format>` block after `<constraints>`:
```xml
<output_format>
Conversational responses during mood_intake: 1-2 sentences reflecting what you heard,
then one follow-up question. No preamble, no summary of prior turns.

Decompose table: render as a markdown table with columns: Sketch | Design question | Approach | Risk.
Include exactly 2-5 rows. Present the table and ask for alignment before building.

Checkpoint message format (render exactly):
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: Verification Required                           ║
╚══════════════════════════════════════════════════════════════╝
Sketch {NNN}: {name}
Open: `open .planning/sketches/{NNN}-{name}/index.html`
Compare: {what to look for between variants}
→ Which variant feels right? Or cherry-pick elements across variants.

Report format: see <step name="report"> for template. Fields are mandatory; omit "Open Questions"
only if genuinely none exist.
</output_format>
```

---

### Issue 5 — No constraint audit or tie-breaking rules
**Principle:** Section 1 Action 3 — Audit constraints for consistency; flag conflicts. Section 5 — Tie-breaking instructions match the domain's cost asymmetry.

**What's wrong:** The workflow has at least two latent constraint tensions that are unresolved:
1. `mood_intake` says "ask one question at a time" but also lists three questions to cover and says "you may need more or fewer questions." There is no tie-breaking rule for when to stop asking.
2. `decompose` says 2-5 design questions, `success_criteria` says "2-3 variants per sketch," but there is no rule for what to do if the decomposition produces 5 sketches and the user's attention is running out.

No tie-breaking rule is provided for the most common boundary case: the user provides a very detailed upfront brief in `$ARGUMENTS` and the mood intake feels redundant.

**Concrete fix:**
1. Add a stopping rule to `mood_intake`: "Stop after 3 questions or when the user provides a ready signal, whichever comes first. If the user's upfront description already covers feel, references, and core action, skip straight to `decompose`."
2. Add a priority-order block:
```xml
<priority_order>
1. User's explicit preferences and stated feedback (highest priority)
2. Design questions that affect page structure (layout before typography before color)
3. Design questions that affect interaction model
4. Aesthetic refinements (color, spacing, detail)
</priority_order>
```
3. Add a tie-breaking rule: "When uncertain whether to ask another question or begin building, begin building. Showing a sketch is cheaper than prolonged conversation."

---

### Issue 6 — Negative instructions not converted to positive equivalents
**Principle:** Section 5 Action 1 — Convert negative instructions to positive equivalents before emitting any prompt.

**What's wrong:** The "Bad sketches" list in `decompose` is written as a list of prohibitions without positive reframes. The guide requires every "do not" to be converted to a positive specification of desired behavior:
- "Design the whole app" (bad) — no positive equivalent stating what scope is correct
- "Set up the component library" (bad) — no positive equivalent
- "Pick a color palette" (bad) — the positive equivalent ("apply it to UI instead") is present but incomplete

**Concrete fix:** Reframe each bad example as a positive rule:
```
Each sketch answers exactly one design question with a clear, observable output.
- One layout question per sketch: "Does a two-panel layout feel right?"
- One control grouping question per sketch: "How should these form fields be arranged?"
- One interaction question per sketch: "What does this hover state feel like?"
- Apply color choices to actual UI elements, not isolated swatch grids
- Scope each sketch to what the user can evaluate in 60 seconds
```

---

### Issue 7 — `<required_reading>` uses file references without fallback handling
**Principle:** Section 13 — Template variable fallback syntax: `${VAR||"(default value)"}`. Section 19 — Modules reference other modules only via template variables.

**What's wrong:** The `<required_reading>` block uses `@~/.claude/...` file references with no fallback or error path if those files are absent. If `sketch-theme-system.md` or `sketch-interactivity.md` does not exist in a new environment, the workflow silently degrades — the model proceeds without the referenced context and produces lower-quality output. There is no conditional rendering or explicit failure instruction.

**Concrete fix:** Add an explicit handling instruction after the file references:
```xml
<required_reading>
Read all files referenced below before starting. If any file is not found, note it in your
banner output and proceed with built-in defaults for that concern.

@~/.claude/get-shit-done/references/sketch-theme-system.md
@~/.claude/get-shit-done/references/sketch-variant-patterns.md
@~/.claude/get-shit-done/references/sketch-interactivity.md
@~/.claude/get-shit-done/references/sketch-tooling.md
</required_reading>
```

---

## Quick-Reference Checklist Score

Scoring against Section 23 of the guide, applied to `sketch.md` as a workflow prompt.

### Task Specification
- [FAIL] Intent, audience, and quality bar are all explicit in the prompt — audience is absent; quality bar is partial (good/bad sketch examples exist but no `<quality_bar>` tag)
- [N/A] All constraints are compatible — no explicit constraint audit performed; two latent conflicts identified (see Issue 5)

### Chain-of-Thought
- [N/A] CoT is included only for math, symbolic reasoning, or multi-step logic tasks — this workflow does not involve symbolic reasoning; CoT is appropriately absent
- [N/A] CoT trigger used
- [N/A] Reasoning is elicited before the answer
- [N/A] CoT traces treated as heuristic aids

### Few-Shot Examples
- [FAIL] Examples selected by semantic similarity — the good/bad sketch examples are present but embedded in prose, not as `<example>` blocks with `<input>`/`<output>`/`<commentary>` structure
- [N/A] 2–5 examples total
- [N/A] Ordered simple → complex
- [FAIL] Examples span diverse sub-types — good/bad examples all focus on scoping; no example of a well-formed design question vs. a poorly formed one
- [N/A] Format consistent across all examples
- [N/A] Example order fixed across evaluation runs

### Formatting
- [FAIL] Instruction is complete and clear before any formatting is applied — `<purpose>` is clear but uses non-canonical tag naming
- [FAIL] Prompt sections separated by semantically named XML tags — uses `<step>`, `<purpose>`, `<success_criteria>` instead of guide's canonical vocabulary (`<task>`, `<quality_bar>`, `<output_format>`)
- [FAIL] At least 3 format variants will be tested on the target model — no evidence of format testing

### Instruction Framing
- [FAIL] All negative instructions converted to positive equivalents — "Bad sketches" list is not reframed positively (Issue 6)
- [FAIL] Priority order explicit when multiple criteria apply — no `<priority_order>` block (Issue 5)
- [FAIL] Tie-breaking rules match the domain's cost asymmetry — no tie-breaking rules for interview stopping, sketch count, or ambiguous feedback (Issue 5)

### Persona
- [FAIL] Persona included for open-ended or stylistic tasks — this is an open-ended, stylistic, collaborative task; no persona defined (Issue 2)
- [N/A] Persona is specific — not applicable (no persona present)
- [N/A] Persona descriptor is gender-neutral — not applicable

### Output Format
- [FAIL] Structured output tasks use two-step reasoning-then-format approach — no `<output_format>` block for conversational responses (Issue 4)
- [N/A] Single-call JSON places reasoning fields before answer fields — no JSON output in this workflow
- [N/A] Constrained decoding adopted only after free-form + post-processing proven insufficient
- [PASS] Machine-parsed output uses exact format specification — README frontmatter, MANIFEST table, and commit message format are precisely specified

### Context Placement
- [PASS] Task instruction at the start of the prompt — `<purpose>` leads
- [N/A] Primary document or input at the end of the prompt — no primary document; user input is runtime
- [PASS] Background context in the middle — `<required_reading>` and `<process>` steps are correctly ordered
- [PASS] All irrelevant context has been removed — the workflow is lean
- [N/A] Time-sensitive injected context labeled as snapshot — no snapshot context in this workflow

### Self-Consistency
- [N/A] Self-consistency applied only to tasks with a single correct answer — not applicable to this workflow
- [N/A] Inference budget permits 15–20 samples

### Prompt Length
- [PASS] Redundant instructions and repeated context removed — no obvious redundancy
- [N/A] Long prompts compressed before sending — not applicable
- [N/A] RAG context is extracted relevant passage only

### System / User Split
- [N/A] Persistent instructions in system prompt — this is a skill file, not split across system/user
- [N/A] Task-specific instructions in user prompt
- [PASS] Each instruction appears in exactly one location — no duplications found
- [N/A] Safety-critical constraints have external validation

### Agent / Subagent
- [PASS] Agent prompts are fully self-contained — the workflow includes all required context inline or via `<required_reading>`
- [N/A] All file paths in agent output are absolute — file paths in this workflow are relative (`.planning/sketches/`), which is intentional for portability but noted
- [N/A] Parallel agents launched in single message block — not applicable
- [N/A] Adversarial probes specified for verification agents — not applicable

### Structural Architecture
- [PASS] Large prompts decomposed into atomic, single-responsibility modules — the `<required_reading>` references four separate concern files (theme, variants, interactivity, tooling)
- [FAIL] Template variables use `${VARIABLE_NAME}` syntax with fallback — `QUICK_MODE`, `TEXT_MODE`, `COMMIT_DOCS` are set as prose-defined variables, not `${VAR||default}` syntax; no fallback handling for missing referenced files (Issue 7)
- [PASS] Modules compose at runtime via variable substitution — the `--quick` and `--text` flag parsing pattern achieves runtime composition

### Constraint Enforcement
- [FAIL] Every restriction paired with equally concrete permission — the "Bad sketches" prohibitions have no paired "do this instead" permission (Issue 6)
- [FAIL] Hard exclusion lists are enumerated, not described qualitatively — "Bad sketches" is qualitative; no formal `<exclusions>` block
- [N/A] Known edge cases have precedent-style rulings — no explicit precedents needed for this workflow type
- [N/A] Confidence thresholds are numeric, not qualitative — not applicable

### Decision Frameworks
- [PASS] Multi-option recommendations use explicit decision tree or comparison table — the decompose step uses a table; the `build_sketches` step uses a tree of feedback scenarios
- [N/A] Criteria checklists gate complex approaches — not applicable
- [PASS] Action permissions framed around reversibility — `COMMIT_DOCS` gate and the checkpoint loop gate irreversible actions (commits, proceeding past a sketch)

### Multi-Phase Workflows
- [PASS] Complex tasks organized into explicit named phases — all steps are named `<step name="...">` elements
- [PASS] Required steps distinguished from type-specific steps — `--quick` flag correctly skips mood intake; conditional branching is explicit
- [PASS] Scenario-based branching handles multiple paths explicitly — three feedback scenarios are enumerated in `build_sketches`

### Memory and Continuity
- [N/A] Memory templates use XML tags as section labels — this is a workflow, not a memory prompt
- [N/A] Compaction summaries include discoveries and failed approaches
- [N/A] Next steps tied to user's most recent explicit request

### Modularity
- [PASS] Each prompt component has a single responsibility — the four referenced files each handle one concern (theme, variants, interactivity, tooling)
- [FAIL] Scope boundaries state both inclusions and exclusions — `<purpose>` states what the workflow does but has no `<scope><include>` / `<scope><exclude>` structure

### Safety and Trust
- [N/A] Validation at system boundaries only — not applicable (no external API calls)
- [N/A] Dual-use capabilities state permissions before restrictions — not applicable
- [N/A] Authorization narrow-scoped — the `COMMIT_DOCS` gate handles the main side-effect; adequate

### Tone and Style
- [FAIL] Size constraints use numeric limits — multiple qualitative descriptors throughout (Issue 3)
- [PASS] Instructions use imperative present tense — consistently applied
- [N/A] Working notes in analysis tags — not applicable to a workflow definition file

### Optimization
- [FAIL] Prompt flagged as draft for automated optimization — not flagged
- [N/A] Correct optimizer selected
- [N/A] Held-out test set reserved

---

## Recommendations

Listed in priority order by impact on model output quality.

### 1. Add a `<persona>` block (Section 6 Action 2, Section 6 Strengths listing)
This is the highest-leverage missing element. The workflow requires the model to lead a design conversation, propose directions, and make judgment calls about when to stop asking and start building. Without a persona, the model defaults to generic assistant behavior — deferential, verbose, and hesitant to propose directions. A specific persona ("product design collaborator who specializes in rapid visual exploration") + a strengths listing will meaningfully shift register and reduce hedging. Estimated effort: 10-15 lines.

### 2. Replace qualitative size constraints with numeric bounds (Section 21)
Every occurrence of "briefly," "one-line," "one paragraph," and "key decisions" needs a numeric bound. These are scattered across `mood_intake`, `decompose`, `create_manifest`, and `report`. Numeric constraints produce consistent output across invocations; qualitative ones produce variable output that shifts with model temperature and context. Estimated effort: 8-10 targeted edits across the file.

### 3. Add `<output_format>`, `<audience>`, and `<quality_bar>` top-level blocks (Section 4 Action 2, Section 1 Actions 1-2, Section 7)
The canonical XML vocabulary is missing for three of the most important structural tags. `<audience>` encodes who the model is talking to and at what level; `<quality_bar>` extends the good/bad sketch table into a proper acceptance criterion; `<output_format>` moves the checkpoint ASCII art and report template out of inline step prose and into a canonical location. This restructuring also prepares the workflow for format variant testing (Section 4 Action 3). Estimated effort: 20-30 lines of restructuring.

### 4. Add tie-breaking rules and a stopping criterion for mood intake (Section 5 Tie-breaking, Section 1 Action 3)
The mood intake step currently has no upper bound on questions and no explicit stopping signal beyond the user saying "go." Two tie-breaking rules are needed: (a) when the upfront `$ARGUMENTS` already provide enough signal, skip intake; (b) when uncertain whether to ask another question or build, build. Both rules match the domain's cost asymmetry: in a rapid sketching workflow, over-asking is more expensive than under-asking. Estimated effort: 4-6 lines added to `mood_intake`.

### 5. Reframe "Bad sketches" prohibitions as positive specifications (Section 5 Action 1)
The negative examples in `decompose` are useful content but are framed as prohibitions, which the guide requires to be converted to positive equivalents. Reframing them as a "scope each sketch to..." positive rule list preserves the content while complying with the instruction framing principle and eliminating the need for exception handling. Estimated effort: 6-8 lines of rewrite within the `decompose` step.
