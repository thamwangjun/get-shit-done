# Critique: `commands/gsd/help.md`

**File under review:** `/home/thamw/development/happier/get-shit-done/commands/gsd/help.md`
**Guide version:** PROMPT_ENGINEERING_GUIDE_V09
**Date:** 2026-04-30

---

## Strengths

### 1. Constraint Framing via Negative Exclusion List (§5 Instruction Framing, §14 Constraint Enforcement)

The `<objective>` block contains a hard exclusion list that is tight and enumerated — not described qualitatively:

```
Do NOT add:
- Project-specific analysis
- Git status or file context
- Next-step suggestions
- Any commentary beyond the reference
```

This aligns with §14's pattern of enumerating hard exclusions explicitly rather than using vague qualitative language like "keep it clean." Each item names a concrete category the model can recognize and exclude. This is the correct approach.

### 2. Separation of Concern via Named XML Tags (§4 Formatting and Structure)

The file uses three semantically named XML tags — `<objective>`, `<execution_context>`, and `<process>` — to separate distinct concerns. The guide (§4 Action 2) requires that "each in a semantically named XML tag" be used for distinct sections. This structure is more signal-rich than markdown headers or `---` delimiters.

### 3. Correct YAML Frontmatter Pattern (§11 System vs. User Prompt Allocation)

The frontmatter encodes persistent properties (`name`, `description`, `allowed-tools`) in a machine-readable location, consistent with §11's YAML frontmatter pattern for agent configuration. Scoping `allowed-tools` to `Read` only is a strong signal alignment with §22 Pattern 9 (tool permissions scoped to minimum required).

---

## Weaknesses

### 1. `<process>` Duplicates `<objective>` Without Adding Information (§10 Prompt Length and Compression, §11 Action 3)

The `<process>` block reads:

```
Output the complete GSD command reference from @~/.claude/get-shit-done/workflows/help.md.
Display the reference content directly — no additions or modifications.
```

This is a near-verbatim restatement of what `<objective>` already establishes. The guide (§11 Action 3) is explicit: "State each instruction exactly once. Repeated instructions consume context and add noise without reinforcing compliance." The guide (§10 Action 1) also requires removing redundant instructions before sending. This block should be removed entirely.

### 2. No Positive Specification of the Desired Behavior (§5 Instruction Framing, Action 1)

The `<objective>` block specifies output behavior entirely through negation ("Do NOT add..."). The guide (§5 Action 1) is unambiguous: "Before emitting any prompt, scan for negated instructions... Rewrite each as a positive specification of the desired behavior." The prompt never states what the model should do in affirmative terms. A compliant rewrite would lead with "Output only the content of the referenced workflow file verbatim" and then enumerate exclusions as a constraint sub-list, not as the primary directive.

The current form places the whole weight of instruction on what to avoid. Negative-primary framing is a known failure mode — the model must infer the positive desired behavior from the list of excluded behaviors rather than having it specified directly.

### 3. Task Specification Is Incomplete: Audience and Quality Bar Are Absent (§1 Task Specification, Actions 1–2)

The guide (§1 Action 1) requires making explicit: (a) what output is being requested, (b) why it matters or how it will be used, and (c) what a high-quality response looks like. The guide (§1 Action 2) additionally requires encoding the audience.

This prompt has (a) implicitly and (c) only via negation. It has neither (b) nor a declared audience. For a help command this may seem trivial, but the guide provides no exception for brevity — the audience here ("a user who has invoked /gsd:help to orient themselves") should be declared, and the quality bar ("verbatim reproduction of the reference file with no interpolation or summarization") should be stated directly, not implied by a list of things not to do.

---

## Specific Rewrites

### Rewrite 1: Convert Negative-Primary Objective to Positive-Primary (Addresses Weakness 2)

**Current:**
```xml
<objective>
Display the complete GSD command reference.

Output ONLY the reference content below. Do NOT add:
- Project-specific analysis
- Git status or file context
- Next-step suggestions
- Any commentary beyond the reference
</objective>
```

**Rewrite:**
```xml
<objective>
Output the complete GSD command reference file verbatim — every line, exactly as written.

<constraints>
  <exclusions>
    Automatically exclude from your response:
    - Project-specific analysis or context
    - Git status or file state
    - Next-step suggestions
    - Any framing, introduction, or commentary
  </exclusions>
</constraints>
</objective>
```

The positive instruction ("output verbatim") now leads. The exclusions are preserved and promoted to a proper `<exclusions>` block per §14, but they are no longer the primary directive.

---

### Rewrite 2: Remove Redundant `<process>` Block (Addresses Weakness 1)

**Current:**
```xml
<process>
Output the complete GSD command reference from @~/.claude/get-shit-done/workflows/help.md.
Display the reference content directly — no additions or modifications.
</process>
```

**Rewrite:** Delete this block entirely. The `<objective>` block already covers this instruction. If a `<process>` tag is retained for structural symmetry with other command files in the system, reduce it to a single non-redundant line:

```xml
<process>
Read and output the file at the path in <execution_context>. No summarization, formatting changes, or additions.
</process>
```

This adds only what `<objective>` does not already say (the explicit instruction not to summarize or reformat), without repeating the core directive.

---

### Rewrite 3: Add Minimal Task Specification Per §1 (Addresses Weakness 3)

Prepend to `<objective>` or add a `<task>` wrapper with `<audience>` and `<quality_bar>`:

```xml
<task>
  <audience>A developer who has invoked the help command to learn what GSD commands exist and what they do.</audience>
  <quality_bar>The output is a verbatim reproduction of the reference file. No line is missing, paraphrased, reformatted, or annotated. The user receives exactly what is in the file.</quality_bar>
</task>
```

This is low overhead for this command and closes the §1 compliance gap cleanly.

---

## Overall Verdict

**Needs Work**

The command is short and structurally reasonable — the frontmatter is correct, the XML sectioning is a step in the right direction, and the exclusion list approach is appropriate for this kind of constraining prompt. However, it fails three guide requirements that are not optional:

1. §5 prohibits negative-primary instruction framing.
2. §11 prohibits instruction repetition — `<process>` fully duplicates `<objective>`.
3. §1 requires explicit audience and quality bar.

None of these are stylistic preferences; all three are decision rules the guide applies mechanically before emitting any prompt. The fixes are low-effort (the command is only 24 lines), making the gap between current state and compliance smaller than the verdict might suggest — but the violations are real and systematic, not incidental.
