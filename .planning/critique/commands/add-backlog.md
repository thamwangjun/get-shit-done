# Critique: `commands/gsd/add-backlog.md`

Guide version referenced: PROMPT_ENGINEERING_GUIDE_V09.md

---

## Strengths

### §5 Instruction Framing — Conditional and sequential branching is explicit

The process uses numbered steps with clear conditionals ("If no 999.x phases exist, start at 999.1", "If the section doesn't exist, create it at the end"). This matches the guide's pattern for conditional instructions: each branch has a single clear action, no ambiguity about what to do at decision points.

### §14 Constraint Enforcement — Ordering rationale is stated

Step 3 includes an inline explanation of *why* ROADMAP.md must be written before creating the directory: `"this ensures directory existence is always a reliable indicator…"`. This matches the guide's precedents pattern (§14) — a known edge-case ruling is embedded where it applies, not buried in a notes section.

### §19 Modularity — Single responsibility

The file handles exactly one concern: adding a backlog item. It does not attempt to discuss, plan, or promote the item. The `<notes>` section explicitly delimits what is out of scope. This is structurally clean per §19's single-responsibility principle.

### §21 Tone and Style — Imperative present tense throughout

All step headers and inline instructions use imperative framing: "Read ROADMAP.md", "Find next backlog number", "Add to ROADMAP.md", "Create the phase directory", "Commit", "Report". This is consistent with §21's active-voice-for-commands rule.

---

## Weaknesses

### Issue 1 — §4 Formatting: Markdown headers used instead of XML tags

**The problem.** The prompt uses `<objective>`, `<process>`, and `<notes>` as the three top-level structural sections but mixes them with markdown bold (`**Read ROADMAP.md**`) and fenced code blocks inside those tags. More critically, `<objective>` and `<notes>` are ad-hoc tag names that do not appear in the guide's XML tag vocabulary (§4, XML tag vocabulary table).

Per §4 Action 2, the guide requires semantically named XML tags from its defined vocabulary: `<task>`, `<context>`, `<output_format>`, `<constraints>`, `<examples>`. The tag `<objective>` should be `<task>`. The tag `<process>` has no guide equivalent — the guide's recommended structure for multi-step workflows is named `<phase>` elements (§16). The tag `<notes>` should be `<context>` (background, helpful but not critical).

Using non-vocabulary tags reduces interoperability with any composed prompt system that parses standard tag names. It also loses semantic meaning that the guide assigns: `<task>` signals "what the model must do" to Claude-class models; `<objective>` is a weaker signal with no assigned meaning.

### Issue 2 — §1 Task Specification: No explicit quality bar or audience encoding

**The problem.** Section §1 Action 1 requires three explicit components in every prompt: (a) what output is requested, (b) why it matters, and (c) what a high-quality response looks like. The command defines (a) adequately (add a backlog item) and gestures at (b) in the notes. But (c) — the quality bar — is entirely absent.

What does a good backlog entry look like? The ROADMAP.md template is given (which helps), but there is no quality criterion for the `description` argument that drives the entry. Is a one-word description acceptable? Should the goal line be populated from the argument, or always left as `[Captured for future planning]`? The model is left to infer this.

§1 Action 2 similarly requires explicit audience encoding. This command is run by a developer using the GSD CLI. That context — that the consumer of this output is both the executing model and a human reading ROADMAP.md later — is never stated. The output format for the Report step (Step 6) would benefit from knowing that a human will read it, not just a downstream agent.

### Issue 3 — §3 Few-Shot Example Construction: No examples for the description argument

**The problem.** The `argument-hint: <description>` frontmatter is the only guidance on what the `$ARGUMENTS` input should look like. The slug and ROADMAP entry title both derive directly from this argument. The guide's §3 Pattern 2 (§22) states: every abstract instruction must be paired with a calibrating example. Without an example, "description" is qualitatively undefined.

Concretely: does `$ARGUMENTS = "auth"` produce `Phase 999.1: Auth (BACKLOG)`? Or is it `$ARGUMENTS = "add OAuth2 authentication with PKCE flow"`? The slug generation (`gsd-sdk query generate-slug`) will behave differently for each. No example anchors the expected level of specificity, making the output non-deterministic in a way that cannot be caught by the model.

---

## Specific Rewrites

### Rewrite 1 — Fix tag vocabulary (Issue 1)

Replace the non-vocabulary tags with guide-standard equivalents:

```xml
<task>
Add a backlog item to the roadmap using 999.x numbering. Backlog items are
unsequenced ideas that aren't ready for active planning — they live outside
the normal phase sequence and accumulate context over time.
</task>

<context>
- 999.x numbering keeps backlog items out of the active phase sequence
- Phase directories are created immediately, so /gsd-discuss-phase and /gsd-plan-phase work on them
- No `Depends on:` field — backlog items are unsequenced by definition
- Sparse numbering is fine (999.1, 999.3) — always uses next-decimal
</context>
```

Then replace `<process>` with numbered `<phase>` elements per §16, or keep the numbered list inside a `<task>` tag. Either is better than the ad-hoc `<process>` wrapper.

### Rewrite 2 — Add quality bar and description examples (Issues 2 and 3)

Add a `<quality_bar>` block and inline examples for the description argument, immediately after the `<task>` tag:

```xml
<quality_bar>
A high-quality backlog entry:
- Has a description that is specific enough to reconstruct intent months later
- Uses noun-phrase form: "OAuth2 login with PKCE", not "auth" or "fix login"
- Does NOT pre-fill requirements — leave Requirements as TBD
- ROADMAP entry Goal line: always use "[Captured for future planning]" verbatim

Good descriptions (use as the $ARGUMENTS input):
- "Stripe webhook retry queue with exponential backoff"
- "Dark mode support for the dashboard"
- "Export user data as CSV from admin panel"

Bad descriptions (too vague to act on later):
- "auth"
- "performance"
- "fix the thing from the meeting"
</quality_bar>
```

This directly addresses §3's requirement for calibrating examples and §1 Action 1's quality-bar component.

### Rewrite 3 — Encode the output_format for Step 6 (Issue 2, partial)

The Report in Step 6 uses an emoji header (`## 📋 Backlog Item Added`) and free-form markdown. Per §7 and §22 Pattern 3, the output format should be specified upfront and completely. The guide also prohibits emojis unless explicitly requested. Replace the inline format template in Step 6 with a dedicated block:

```xml
<output_format>
After completing all steps, report in this exact format:

Backlog item added: Phase {NEXT} — {description}
Directory: .planning/phases/{NEXT}-{slug}/

Next steps:
- /gsd-discuss-phase {NEXT} — explore and add context
- /gsd-review-backlog — promote to active milestone when ready
</output_format>
```

This removes the emoji, consolidates format specification out of the process steps (where it interrupts flow), and makes the expected output parseable if a calling agent needs to extract the phase number.

---

## Overall Verdict

**Adequate.**

The command is functionally correct and internally consistent. The single-responsibility design, conditional branching, and imperative framing are well-executed. The failure modes are structural: non-standard tag vocabulary that will degrade composability, a missing quality bar that leaves description specificity undefined, and no few-shot examples for the one user-supplied input that drives all downstream output. None of these are blocking defects, but the description-ambiguity issue will produce inconsistent ROADMAP entries at scale. Priority fix: Issues 2 and 3 (quality bar + examples), which can be added in fewer than 15 lines without touching the process logic.
