# Critique: `commands/gsd/from-gsd2.md`

Reviewed against: Prompt Engineering Guide V09

---

## Strengths

**§4 Formatting and Structure — Semantic XML tags used appropriately.**
The command correctly wraps its three content sections in semantically named XML tags (`<objective>`, `<process>`, `<notes>`). The tag names describe what each section *is*, not merely where it starts — consistent with the guide's requirement that tags carry semantic meaning rather than acting as bare delimiters.

**§8 Context Placement — Task instruction leads.**
The `<objective>` block appears at the very top of the prompt body, satisfying §8 Action 1 ("Place the task instruction at the very start of the prompt"). The user reads the migration intent before encountering procedural steps.

**§16 Multi-Phase Workflows — Numbered steps with a confirmation gate.**
The four-step `<process>` block implements an implicit phase pattern: dry-run → confirm → execute → report. Placing the confirmation gate (step 2) before any write operations is a sound safety practice, loosely consistent with §15 (reversibility framework) and §16 (required steps before proceeding).

**§5 Instruction Framing — Conditional branching is explicit.**
The command states a concrete error path: "If no `.gsd/` is found, report the error and stop." This matches the guide's pattern of explicit conditional branching rather than leaving failure behavior to the model's defaults (§5, conditional instructions).

---

## Weaknesses

### Weakness 1 — §1 Task Specification: audience and quality bar are absent

The guide (§1 Actions 1–2) requires three components made explicit: what output is requested, why it matters, and what a correct response looks like. It also requires the audience to be encoded.

`from-gsd2.md` has a clear "what" (run the migration and report) but omits:
- **Audience**: is the caller a developer running this interactively, an orchestrating agent, or both? The answer changes whether output should be terse (subagent) or detailed (human).
- **Quality bar**: what does a successful report look like? There is no `<quality_bar>` or output format specification telling the model what fields to include, how verbose to be, or whether the report is machine-parsed or human-read.

The guide's tag vocabulary (`<audience>`, `<quality_bar>`) exists precisely to make these explicit.

### Weakness 2 — §7 Output Format Handling / §21 Tone and Style: no output format specification

The prompt ends with "show the `filesWritten` count, `planningDir` path, and the preview summary" — but this is buried inside a `<notes>` tag (which the guide reserves for background context) and uses qualitative descriptors only. There is no `<output_format>` block specifying:
- Exact fields to report
- Order of presentation
- Whether output is markdown prose, a structured list, or key-value pairs
- Numeric length constraint

Per §21, "Brief" and "show the summary" mean different things to different models. Per §22 Pattern 3, output format must be "specified completely and upfront" before the task begins — not mentioned as a note after the process steps.

Additionally, there is no guidance on tone: if the dry-run produces a large file list, should the model truncate, paginate, or summarize? The silence here means output length and structure are left entirely to the model's priors.

### Weakness 3 — §6 Persona Assignment: no persona, even though one is warranted

This command guides the model through a migration workflow where clear communication to the user (explaining dry-run output, framing the confirmation ask, reporting results) is a primary concern. The guide (§6 Action 1) says: "open-ended, stylistic, or requires a specific voice? YES → Assign a specific, role-constrained persona."

A migration command that presents a dry-run to a human and asks for confirmation is exactly this case — the *way* the model speaks materially affects whether the user understands what they are confirming before destructive writes. No persona is assigned; the model defaults to generic assistant behavior with no register constraint.

---

## Specific Rewrites

### Rewrite 1: Add `<output_format>` block (fixes Weakness 2)

Replace the buried report instruction in `<notes>` with a dedicated `<output_format>` block placed immediately after `<process>`:

```xml
<output_format>
After the migration completes, report in this order:

1. **Status**: one of `Success`, `Dry-run only`, or `Aborted`.
2. **Files written**: integer count (e.g. `14 files written`).
3. **Planning dir**: absolute path to the `.planning/` directory created.
4. **Preview summary**: the dry-run output, reproduced verbatim (do not summarize or truncate).

Keep the report under 200 words. Use markdown. Do not add commentary beyond these four fields unless an error occurred.
</output_format>
```

This satisfies §7 Action 2 (reasoning/fields ordered correctly), §21 (numeric length constraint), and §22 Pattern 3 (format complete and upfront).

### Rewrite 2: Add `<audience>` and `<quality_bar>` (fixes Weakness 1)

Insert immediately after `<objective>`:

```xml
<audience>
A developer running GSD interactively via the Claude Code CLI. They are familiar with GSD
conventions but may not know the internal structure of `.gsd/` directories. Present
migration previews in plain terms they can confirm without reading source code.
</audience>

<quality_bar>
A correct execution: shows a dry-run preview the user can meaningfully confirm,
runs the migration only after explicit confirmation, and reports the four output fields
above. An incorrect execution: writes files without confirmation, silently swallows
errors, or emits a report that omits the planning dir path or file count.
</quality_bar>
```

### Rewrite 3: Add `<persona>` (fixes Weakness 3)

Add before `<process>`:

```xml
<persona>
You are a migration assistant. Your job is to make a potentially destructive file operation
safe: show the user exactly what will happen before it happens, confirm before writing,
and report the outcome precisely.

Write in plain, direct language. Lead with what the user needs to decide or know.
Do not explain the GSD hierarchy mapping unless the user asks.
</persona>
```

This satisfies §6 Action 2 (specific, constrains register and priorities) and §6 reframe pattern (defines what this agent's job is NOT — explaining internal format details unbidden).

---

## Overall Verdict

**Adequate**

The command is structurally sound: it uses XML tags correctly, places the objective first, and includes a confirmation gate before writes. For a short migration workflow prompt it is functional.

However, it is missing the three components the guide treats as foundational for any prompt: explicit audience, explicit quality bar, and explicit output format. The result is a prompt that will produce variable output across model versions or temperature settings — sometimes terse, sometimes verbose, sometimes missing the planning-dir path. These are mechanical omissions, not deep structural problems, which is why the rating is Adequate rather than Needs Work. The rewrites above close all three gaps with additions, not restructuring.
