# Critique: `commands/gsd/list-phase-assumptions.md`

**Date:** 2026-04-30
**Guide version:** PROMPT_ENGINEERING_GUIDE_V09
**Verdict:** Needs Work

---

## Strengths

### XML tag structure (§4 Formatting and Structure)
The command uses semantically named XML tags — `<objective>`, `<execution_context>`, `<context>`, `<process>`, `<success_criteria>` — to separate prompt sections. This aligns with §4 Action 2's requirement to wrap each distinct section in a semantically named XML tag rather than using markdown headers or `---` delimiters.

### Numbered process steps (§16 Multi-Phase Workflows)
The `<process>` block enumerates steps in order, which mirrors the phase pattern from §16. Step 1 (validate argument) and step 2 (check roadmap) establish guard rails before the main work begins — consistent with the guide's pattern of required steps before type-specific steps (§16, Required vs. optional steps).

### Explicit success criteria (§1 Task Specification — Action 1)
The `<success_criteria>` block names four concrete outputs, which partially satisfies §1's requirement to make explicit "what a correct or high-quality response looks like." This is better than having no quality bar at all.

---

## Weaknesses

### 1. Task specification is incomplete — audience and quality bar are missing (§1 Action 1, Action 2)

The `<objective>` tag describes *what* the output is but does not answer *why* it matters to the user or *what a high-quality set of assumptions looks like*. The guide requires all three components to be explicit (§1 Action 1: output, purpose, quality bar). The "Purpose" sentence in `<objective>` gestures at the why, but it is buried inside the tag rather than declared as a `<quality_bar>`. There is no `<audience>` tag at all.

The guide's §1 Action 2 requires the audience's domain knowledge and vocabulary level to be encoded explicitly. This command omits it entirely. A developer who has never used GSD and a developer who has planned twenty phases will need different assumption framing — the prompt gives no signal for which to target.

**Impact:** The model has no calibration for depth or vocabulary, so assumption quality and verbosity will vary unpredictably across runs.

---

### 2. Output format is underspecified — the assumption set has no structure (§7 Output Format Handling, §22 Pattern 3)

The command says: *"Assumptions surfaced across five areas."* It names the five areas only inside a sub-clause: *"technical approach, implementation order, scope, risks, dependencies."* It does not specify:

- How many assumptions per area (1? 3? unlimited?)
- What form each assumption takes (declarative statement? hedged claim? confidence level?)
- Whether assumptions are grouped by area or listed flat
- What the output should look like for the closing "What do you think?" prompt

§7 Action 1 requires structured output tasks to specify the output format completely and upfront. §22 Pattern 3 states: *"A fully specified format produces consistent, parseable output. An implicit format produces structure that varies per call."*

This command currently relies entirely on the referenced workflow file (`list-phase-assumptions.md`) for format details. The command file itself gives the model nothing to anchor on if it cannot resolve that reference, and gives a human reviewer no way to evaluate whether the workflow will produce correct output without reading a second file.

**Impact:** Each run may surface assumptions in a different structure, order, or depth — making the output hard to compare across phases and reducing trust in the tool.

---

### 3. Negative and passive instructions not converted (§5 Instruction Framing — Action 1)

The `<objective>` block includes:

> "Output: Conversational output only (no file creation)"

This is a negative instruction ("no file creation") used as a primary constraint directive. §5 Action 1 requires all negative instructions to be converted to positive equivalents before emitting any prompt. The correct framing is a positive specification of what the output IS, not what it must avoid.

Additionally, the `<success_criteria>` block ends with a stray `</output>` closing tag, which is a structurally malformed artifact that will confuse parsing and may cause the model to treat it as a closing boundary for an outer `<output>` block that was never opened.

---

## Specific Rewrites

### Rewrite 1 — Add `<audience>` and `<quality_bar>` to satisfy §1

Replace the current `<objective>` with:

```xml
<objective>
Analyze a phase and surface Claude's assumptions about technical approach, implementation
order, scope boundaries, risk areas, and dependencies — before planning begins. This
enables the user to correct misaligned assumptions early, when changes cost nothing.
</objective>

<audience>
A developer actively working on this project who knows the codebase but wants to verify
that Claude's interpretation of the phase aligns with their intent. They are familiar with
GSD phase numbering and the roadmap format.
</audience>

<quality_bar>
A high-quality response surfaces 3–5 distinct assumptions per area, states each as a
falsifiable claim the user can confirm or correct ("I assume X will be implemented before
Y because Z"), and ends with an open "What do you think?" that invites targeted correction
rather than free-form feedback.
</quality_bar>
```

---

### Rewrite 2 — Specify output format explicitly to satisfy §7 and §22 Pattern 3

Add an `<output_format>` block after `<process>`:

```xml
<output_format>
Present assumptions in five labeled sections using the headings below. Under each heading,
list 3–5 assumptions as declarative statements in present tense. Each assumption must be
falsifiable — the user should be able to say "wrong, because..." without ambiguity.

Sections (in this order):
1. Technical Approach
2. Implementation Order
3. Scope Boundaries
4. Risk Areas
5. Dependencies

After all five sections, write a single closing line:
"What do you think? Are any of these wrong or missing?"

Do not create files. Respond conversationally — no headers beyond the five section labels
listed above, no code blocks unless quoting specific code.
</output_format>
```

---

### Rewrite 3 — Convert negative instruction and fix stray tag to satisfy §5

Replace the current `<objective>` Output line:

```
Output: Conversational output only (no file creation) - ends with "What do you think?" prompt
```

With a positive specification in `<output_format>` (see Rewrite 2 above), and remove the stray `</output>` closing tag at line 47 of the current file.

The constraint becomes: *"Respond conversationally. Deliver findings as prose with five labeled sections. Close with an invitation for correction."* This states what the output IS rather than what it must not be.

---

## Overall Verdict: Needs Work

The command has a sound structural skeleton — XML tags, numbered steps, success criteria — but fails on three guide-critical dimensions: the task specification is missing audience and quality bar (§1), the output format is implicit and delegated entirely to an external workflow file (§7, §22 Pattern 3), and the one explicit behavioral constraint is stated as a negative instruction (§5). The stray `</output>` tag is a latent parsing defect. None of these are cosmetic — they directly reduce output consistency and predictability across runs. The rewrites above address all three issues without increasing prompt length materially.
