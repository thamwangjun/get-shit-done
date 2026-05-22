# Critique: `commands/gsd/set-profile.md`

Reviewed against: Prompt Engineering Guide V09
Date: 2026-04-30

---

## The Command (full text)

```
---
name: gsd:set-profile
description: Switch model profile for GSD agents (quality/balanced/budget/inherit)
argument-hint: <profile (quality|balanced|budget|inherit)>
model: haiku
allowed-tools:
  - Bash
---

Show the following output to the user verbatim, with no extra commentary:

!`gsd-sdk query config-set-model-profile $ARGUMENTS --raw`
```

---

## Strengths

### Minimal footprint matches task scope (§10 Prompt Length and Compression)

The command is a pure pass-through: it runs a shell command and echoes its output. The prompt is 12 words of instruction plus a shell invocation. For a task this simple — no reasoning, no synthesis, no transformation — a lean body is correct. §10 Action 1 says to remove redundant instructions before sending; there is nothing to remove here because nothing superfluous was added.

### Tool permissions scoped to minimum required (§22 Pattern 9)

`allowed-tools: [Bash]` is the narrowest grant that satisfies the task. No Read, no Edit, no Write. This matches the guide's principle of expressing allowed tools as the narrowest patterns that satisfy the task.

### Single-responsibility (§19 Modularity and Composition)

The file does exactly one thing: route a profile argument to the SDK config command. It does not mix concerns. Each module should have a single responsibility — this one does.

---

## Weaknesses

### 1. The instruction is a negative/prohibition rather than a positive specification (§5 Instruction Framing, Action 1)

> "Show the following output to the user verbatim, with no extra commentary"

"No extra commentary" is a negated constraint. §5 Action 1 requires converting negative instructions to positive equivalents before emitting any prompt. The conversion table gives the mechanical rule:

```
"Do not add commentary"  →  "Output the shell result exactly as returned, character for character"
```

The current form tells the model what not to do. The positive form tells the model precisely what the desired behavior is. These are functionally different: the negative form leaves the model guessing what "extra" means, while the positive form removes ambiguity entirely.

### 2. No explicit output format specification — the format is implied, not declared (§7 Output Format Handling; §22 Pattern 3)

The prompt assumes the model will correctly infer that the output is the raw string result of a shell command, passed through unchanged. There is no `<output_format>` block. §7 and Pattern 3 both require stating the required output structure upfront. For machine-routed or tool-chained outputs especially, §7's machine-parsed output pattern applies:

> "Be explicit and restrictive... Use the literal string... no markdown bold, no punctuation, no wording variation."

Because the output of `gsd-sdk query config-set-model-profile` is consumed directly by the user (and possibly by calling infrastructure), the format needs to be pinned. At minimum, the prompt should declare: output is plain text, no wrapping, no preamble, no trailing newline beyond what the command produces.

### 3. No `<task>` wrapper — the instruction is unstructured prose, not semantically tagged (§4 Formatting and Structure, Action 2)

§4 Action 2 states that when a prompt contains distinct sections, each should be wrapped in a semantically named XML tag. Even a minimal command has two distinct concerns here: (a) the instruction (show the output verbatim) and (b) the invocation template. These run together as a single unstructured block. The guide's preferred structure uses `<task>` for the primary instruction and `<output_format>` for response constraints. Mixing them into one untagged sentence makes the structure opaque to the model — and to anyone reviewing or composing this prompt into a larger system.

---

## Specific Rewrites

### Rewrite 1: Convert the negative instruction to a positive specification (fixes Weakness 1 and 2)

Current:
```
Show the following output to the user verbatim, with no extra commentary:

!`gsd-sdk query config-set-model-profile $ARGUMENTS --raw`
```

Rewrite:
```
<task>
Run the following command and relay its output exactly as returned.
</task>

<output_format>
Print the command's stdout output exactly — no preamble, no explanation, no markdown
formatting. The output is the complete response.
</output_format>

!`gsd-sdk query config-set-model-profile $ARGUMENTS --raw`
```

This converts "no extra commentary" into the positive specification "print the command's stdout output exactly", adds the `<output_format>` tag §7 requires, and keeps the invocation outside the tags so its positional signal is clear.

### Rewrite 2: Add XML structure for composability and semantic clarity (fixes Weakness 3)

The frontmatter is doing some of the structural work (name, description, argument-hint), but the body has no tags at all. A minimal tagged version:

```
<task>
Execute the profile-switch command below and return its output to the user without
modification.
</task>

<output_format>
Return the raw command output as plain text. No formatting, no wrapping, no added words.
</output_format>

!`gsd-sdk query config-set-model-profile $ARGUMENTS --raw`
```

This adds two semantically named sections (§4 Action 2 XML vocabulary: `<task>` and `<output_format>`), making the prompt composable into larger orchestrated prompts without ambiguity about what each part does.

---

## Overall Verdict

**Adequate**

The command is appropriately minimal for its task scope and correctly applies least-privilege tool permissions. The single weakness pattern — an untagged, negation-framed instruction with no explicit output format — is low-severity here because the task is trivially simple and the shell command is authoritative. However, these are mechanical violations of §4, §5, and §7 that would be flagged by the §23 checklist (negative instruction not converted; output format not declared; prompt sections not tagged). Fixing them costs four lines of markup and eliminates the ambiguity. The command does not fail; it is just not finished to production standard.
