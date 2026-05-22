# Critique: `commands/gsd/profile-user.md`

**Guide version**: PROMPT_ENGINEERING_GUIDE_V09  
**Date**: 2026-04-30  
**Verdict**: Needs Work

---

## Strengths

### §4 Formatting — XML tag usage is present and appropriate
The file uses semantically named XML tags (`<objective>`, `<execution_context>`, `<context>`, `<process>`) rather than markdown headers or bare prose. This is aligned with §4 Action 2's directive to "wrap each [section] in a semantically named XML tag." The tags name what the section *is*, not just where it starts.

### §8 Context Placement — instruction leads, context follows
The `<objective>` block appears at the top, `<context>` in the middle, and `<process>` at the end. This broadly respects the §8 layout principle: task instruction at the start, background context in the middle. The `<execution_context>` references (workflow + brand file) are positioned early, which keeps operational context near the top where attention is highest.

### §5 Instruction Framing — conditional branching is explicit
The `<context>` block documents flags (`--questionnaire`, `--refresh`) with their behavioral consequences written as positive descriptions of what each flag does. This is consistent with §5's conditional instruction pattern ("If X, then Y") rather than leaving branch behavior implicit.

---

## Weaknesses

### 1. §1 Task Specification — audience and quality bar are absent

§1 Action 1 requires three explicit components: (a) what output is requested, (b) why it matters or how it will be used, and (c) what a correct/high-quality response looks like. §1 Action 2 additionally requires the audience to be encoded explicitly.

The `<objective>` covers (a) at a surface level but omits (b) and (c) entirely. There is no `<audience>` tag and no `<quality_bar>` tag. The prompt never states who will consume the artifacts (the developer invoking the command? a downstream agent? both?), what domain knowledge to assume, or what makes a good profile vs. a poor one. This leaves the model to infer quality criteria from nothing.

The guide's XML template for task specification is:

```xml
<task>{what the model must do}</task>
<audience>{who will use the output and in what context}</audience>
<quality_bar>{what makes a good response — format, length, focus}</quality_bar>
```

None of these three tags appear in the command file.

### 2. §6 Persona Assignment — no persona, and this task warrants one

The command involves open-ended, stylistic work: synthesizing behavioral signals from session data into a human-readable profile with a report card and highlights. §6 Action 1 specifies: "Task type is open-ended, stylistic, or requires a specific voice? YES → Assign a specific, role-constrained persona."

No `<persona>` tag exists. The model defaults to generic assistant behavior rather than being guided toward a specific voice (e.g., an insightful behavioral analyst writing for a developer audience). §6 Action 2 further warns that generic expert framing is ineffective — the persona must constrain register and domain-specific style.

### 3. §7 Output Format Handling — output format is unspecified

The `<process>` block lists 10 steps but specifies zero output format constraints. §7 and §22 Pattern 3 both require the output structure to be stated "completely and upfront." The command produces multiple artifacts (USER-PROFILE.md, `/gsd-dev-preferences`, CLAUDE.md sections, a report card with highlights), but:

- Field names are not listed.
- Format of the "report card and highlights" is not specified.
- The "dimension diff" for `--refresh` is not described structurally.
- There is no example output for any artifact.

A fully specified format produces consistent, parseable output. §22 Pattern 3 states: "An implicit format produces structure that varies per call."

Additionally, §21's size constraint rule is violated: terms like "highlights" and "report card" are qualitative. No numeric bounds or field-level specifications anchor them.

---

## Specific Rewrites

### Rewrite 1: Add `<audience>` and `<quality_bar>` to satisfy §1

Replace the current `<objective>` block with one that encodes all three task components plus audience:

```xml
<objective>
Generate a developer behavioral profile and produce personalization artifacts
(USER-PROFILE.md, /gsd-dev-preferences skill, CLAUDE.md sections) that configure
Claude to match this developer's working style, communication preferences, and
domain context.

These artifacts are consumed directly by Claude in future sessions — not by the
developer as documentation. Every profile dimension must be actionable as a
configuration signal, not a description.
</objective>

<audience>
The primary consumer is Claude (as a configured agent). The secondary consumer is
the developer reviewing their own profile. Write dimensions in second-person
imperative ("Prefer direct answers over step-by-step walkthroughs") not
third-person observation ("User prefers direct answers").
</audience>

<quality_bar>
A high-quality profile: (1) maps each behavioral dimension to a specific, observable
signal from session data or questionnaire responses; (2) produces at least 5 and no
more than 12 actionable preference dimensions; (3) avoids generic traits ("likes
efficiency") in favor of specific calibrations ("skip preamble — lead with the
answer or the file path").
</quality_bar>
```

### Rewrite 2: Add a scoped `<persona>` tag to satisfy §6

Insert a persona block before `<process>`. The persona must be specific (§6 Action 2), gender-neutral (§6 Action 3), and domain-matched (§22 Pattern 1):

```xml
<persona>
You are a behavioral analyst specializing in developer workflow profiling. Your
output is read by an LLM, not a human — so every insight must be framed as an
actionable configuration directive, not an observation.

Write in present-tense imperative. Prioritize specificity: "answer in under 3
sentences when the question is tactical" beats "be concise."
</persona>
```

### Rewrite 3: Add `<output_format>` with field-level specification to satisfy §7 and §22 Pattern 3

The `<process>` step 7 ("Result display with report card and highlights") and step 8 ("Artifact selection") produce structured output but define no format. Add an `<output_format>` block with concrete field specs:

```xml
<output_format>
After generating the profile, display a report card in this exact structure:

## Developer Profile: [name or "You"]

**Profile completeness**: [N] dimensions from [source: session analysis | questionnaire | both]

### Behavioral Dimensions
For each dimension (5–12 total):
- **[Dimension name]**: [1-sentence actionable directive]

### Highlights
3 bullet points: the three most distinctive or surprising signals found.

### Artifacts generated
Bulleted list of files written and their paths (absolute).

If `--refresh` was used, append a **Dimension diff** section:
- Added: [list of new dimensions]
- Removed: [list of dropped dimensions]
- Changed: [dimension name] — before / after (one line each)
```

---

## Overall Verdict: Needs Work

The command file is structurally sound — it uses XML tags, documents its flags, and defers to a workflow file correctly. But it fails three foundational checklist items from §23:

- `[ ] Intent, audience, and quality bar are all explicit in the prompt` — **FAIL**
- `[ ] Persona is included only for open-ended or stylistic tasks` — **FAIL** (missing, should be present)
- `[ ] Structured output tasks use a two-step reasoning-then-format approach` — **FAIL** (format never specified)

The `<process>` block reads as a table of contents for the workflow file rather than a prompt that could stand alone or guide model behavior in the absence of that workflow. For a command that routes to a separate workflow, this may be intentional — but even a thin routing prompt should declare its audience and quality bar per §1.

The highest-priority fix is the output format specification (Rewrite 3): without it, every invocation of this command risks producing a differently structured profile, making downstream agent consumption of USER-PROFILE.md unreliable.
