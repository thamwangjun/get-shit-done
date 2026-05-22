# Prompt Critique: `commands/gsd/add-phase.md`

**File:** `commands/gsd/add-phase.md`
**Workflow delegate:** `~/.claude/get-shit-done/workflows/add-phase.md`
**Critiqued against:** PROMPT_ENGINEERING_GUIDE_V09.md
**Date:** 2026-04-30

---

## Strengths

### 1. XML structural tags used consistently (§4 Formatting)

The command file uses `<objective>`, `<execution_context>`, `<context>`, and `<process>` — semantically named XML tags that separate prompt sections by role. This aligns with §4 Action 2's directive to wrap each distinct section in a tag that names what it *is*, not just where it starts. The tag vocabulary is coherent and the sections are non-overlapping.

### 2. Enumerated process steps in the workflow (§16 Multi-Phase Workflows)

The delegated workflow (`add-phase.md`) organises execution into named `<step>` tags (`parse_arguments`, `init_context`, `add_phase`, `update_project_state`, `completion`). This directly implements §16's phase pattern: cognitive boundaries force sequential completion and the step names themselves act as progress markers. The `success_criteria` checklist at the end is a concrete quality gate aligned with §1 Action 1's requirement to state what a correct response looks like.

### 3. Error-exit paths specified for missing arguments (§5 Instruction Framing — conditional instructions)

The workflow explicitly handles the "no arguments" case with a formatted error block and an `Exit.` directive, and separately handles the "no roadmap" case the same way. This matches §5's conditional branching pattern (`If no PR number is provided... / If a PR number is provided...`). The branches are unambiguous and mutually exclusive.

### 4. Success criteria acts as a quality bar (§1 Task Specification)

The `<success_criteria>` checklist in the workflow covers five discrete verifiable outcomes: SDK call success, directory creation, roadmap update, STATE.md update, and user notification. This partially satisfies §1 Action 1(c) — "what a correct or high-quality response looks like" — because each item is binary and testable.

---

## Weaknesses

### 1. `<objective>` and `<process>` duplicate the same content with no added signal (§10 Prompt Length, §11 System vs. User Prompt)

The command file's `<objective>` block lists four bullet points describing what the workflow handles. The `<process>` block then re-lists the same eight points verbatim ("1. Argument parsing and validation … 8. STATE.md updates") with a wrapper sentence that says only "Follow the workflow." These two sections carry identical information. Neither adds anything the other does not.

§10 Action 1 is explicit: "Remove redundant instructions, repeated context, and boilerplate that does not contribute to the task before sending." §11 Action 3 reinforces: "Each instruction belongs in exactly one location."

The `<process>` block in the command file should be deleted entirely. Its only function is to summarise the workflow — which the model will read directly via `@~/.claude/get-shit-done/workflows/add-phase.md`. Summarising a document the model is about to read in full is pure token cost with zero benefit.

### 2. No output format specified for the completion message (§7 Output Format Handling, §22 Pattern 3)

The workflow's `completion` step contains a completion summary template — but this lives in the workflow file, not in the command file. More critically, the template mixes concerns: it uses backtick code formatting for slash commands, Markdown headers for section titles, and raw template variables (`${PROJECT_CODE}`, `${PROJECT_TITLE}`) with no fallback syntax. There is no `<output_format>` tag anywhere in the command file.

§7 Action 1 requires structured output to be specified with a two-step reasoning-then-format approach. §22 Pattern 3 states output format must be "specified completely and upfront." The command file provides no output contract at all — the format is buried in the middle of the workflow's `completion` step, meaning format and task instruction are not co-located.

Additionally, `${PROJECT_CODE}` and `${PROJECT_TITLE}` appear without fallback syntax (`${VAR||"(default)"}` per §13). If these variables are not injected at runtime, the model will either hallucinate values, leave the placeholders literal, or silently omit the section.

### 3. Negative framing in the `<context>` section (§5 Instruction Framing — Action 1)

The `<context>` block contains: "Roadmap and state are resolved in-workflow via `init phase-op` and targeted tool calls." This is a passive, explanatory sentence with no instructional value — it tells the model how things work, not what to do. But the more pressing violation is in the `<process>` block: "The workflow handles all logic including:" followed by a list. This frames the instruction around what the workflow *does* rather than what the model *must do*.

§5 Action 1 requires converting negative or evasive framing to positive specifications of desired behavior. The pattern to apply here is direct imperative: "Read the workflow at `@~/.claude/get-shit-done/workflows/add-phase.md` and execute it." The explanatory prose about what the workflow handles is scaffolding the author wrote to help themselves understand the design — it has no value to the model executing the prompt.

---

## Specific Rewrites

### Rewrite 1: Eliminate the redundant `<process>` block (fixes Weakness 1)

**Current:**
```xml
<process>
**Follow the add-phase workflow** from `@~/.claude/get-shit-done/workflows/add-phase.md`.

The workflow handles all logic including:
1. Argument parsing and validation
2. Roadmap existence checking
3. Current milestone identification
4. Next phase number calculation (ignoring decimals)
5. Slug generation from description
6. Phase directory creation
7. Roadmap entry insertion
8. STATE.md updates
</process>
```

**Rewrite (delete the block entirely, or replace with):**
```xml
<process>
Execute the workflow at `@~/.claude/get-shit-done/workflows/add-phase.md` in full.
</process>
```

The numbered list is a description of the workflow's internals — already stated in `<objective>` and fully specified in the workflow file the model will read. One sentence is sufficient.

---

### Rewrite 2: Add an `<output_format>` block and fix template variable fallbacks (fixes Weakness 2)

Add this block to the command file, after `<context>`:

```xml
<output_format>
After the workflow completes, present the completion summary exactly as specified in the
workflow's `completion` step. Use the template verbatim.

If `${PROJECT_CODE}` or `${PROJECT_TITLE}` are not available, omit the "## ▶ Next Up" header
line and begin directly with the phase name.

Do not add commentary, preamble, or explanation before or after the completion block.
</output_format>
```

And in the workflow's `completion` step, apply fallback syntax to the template variables:
```
## ▶ Next Up — ${PROJECT_CODE||""} ${PROJECT_TITLE||"[project]"}
```

This surfaces the format contract at the command level (where the caller sees it), resolves the undefined-variable risk, and eliminates the model's discretion over what to say after execution.

---

### Rewrite 3: Replace evasive `<context>` prose with a direct instruction (fixes Weakness 3)

**Current:**
```xml
<context>
Arguments: $ARGUMENTS (phase description)

Roadmap and state are resolved in-workflow via `init phase-op` and targeted tool calls.
</context>
```

**Rewrite:**
```xml
<context>
Arguments: $ARGUMENTS (phase description)
</context>
```

The second sentence ("Roadmap and state are resolved in-workflow...") is implementation commentary with no behavioral effect. Removing it reduces token cost and removes a sentence the model might interpret as permission to skip those steps if they appear to be "already handled."

---

## Overall Verdict

**Adequate**

The command file correctly delegates to a workflow, uses XML structural tags, and the workflow itself has solid conditional branching and a verifiable success checklist. The core logic is sound and the error cases are handled.

However, the command file carries a redundant `<process>` block that duplicates `<objective>` with no additional signal (a direct §10/§11 violation), provides no `<output_format>` contract (a §7 and §22 Pattern 3 gap), and uses unguarded template variables that will fail silently in environments where those variables are not injected. None of these are structural flaws in the workflow design — they are polish failures in the command file's prompt hygiene. The fixes are mechanical and each is a targeted deletion or two-line addition.
