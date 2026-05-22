# Critique: `commands/gsd/join-discord.md`

**Reviewed against:** Prompt Engineering Guide V09  
**Date:** 2026-04-30

---

## Strengths

### Output pre-rendered, not generated (§7 Output Format Handling, §22 Pattern 3)

The command hardcodes the final output rather than asking the model to generate it. For a static-data task like displaying a fixed URL, this is exactly correct. There is no reasoning required, no retrieval, and no structured format that could vary — pre-rendering eliminates output variance entirely. This aligns with §22 Pattern 3's principle that output format should be fully specified upfront.

### Zero tool permissions requested (§20 Safety and Trust, §22 Pattern 9)

`allowed-tools: []` is the right call. This task requires no file reads, no shell access, and no external calls. The narrowest-possible permission grant matches §22 Pattern 9's directive to scope tool permissions to the minimum required. No blast radius is possible.

### Task scope is unambiguous (§1 Task Specification — Action 1)

The `<objective>` maps to a single, unambiguous output: display one URL. There is no multi-step logic, no branching, and no constraint that could conflict with another. The simplicity fully satisfies §1 Action 3's constraint-compatibility requirement — because there is effectively only one constraint.

---

## Weaknesses

### 1. Wrong tag for a hardcoded response block (§4 Formatting and Structure — Action 2, XML tag vocabulary)

The prompt wraps the pre-rendered response in `<output>`, which the guide reserves for the *expected output of a few-shot example* (child of `<example>`). The top-level XML tag vocabulary in §4 lists `<output_format>` as the correct tag for "required structure, fields, length, and constraints on the response." Using `<output>` here is a vocabulary violation — it signals the wrong semantic to a Claude-class model and could cause the tag to be treated as an example output rather than a direct rendering instruction.

The correct idiom for a pre-rendered, verbatim response is either a bare Markdown block (no XML wrapper needed at all) or an explicit `<output_format>` tag with a note that the content below is to be reproduced verbatim.

### 2. No instruction framing — the model has nothing to execute (§5 Instruction Framing, §1 Task Specification — Action 1)

The `<objective>` states what the output *is* but contains no imperative directing the model to *do* something. There is no "Respond with the following", "Output the text below verbatim", or equivalent directive. §5 mandates imperative present-tense instructions and §1 Action 1 requires an explicit output request. Without an instruction, the model must infer that it should reproduce the `<output>` block — which it likely will, but this is implicit behavior, not a specified contract.

This matters more than it appears: a model might decide to summarize, paraphrase, or add commentary instead of reproducing the block exactly.

### 3. `<objective>` is a non-standard top-level tag (§4 Formatting and Structure — XML tag vocabulary)

The guide defines a specific vocabulary of top-level structural tags. `<objective>` is not among them. The semantically correct replacement is `<task>`, which the guide defines as "primary instruction: what the model must do." Using a non-standard tag reduces interoperability if this prompt is ever composed with other modules (§19 Modularity and Composition) and breaks the shared vocabulary that makes composed prompts predictable.

---

## Specific Rewrites

### Rewrite 1 — Fix tag vocabulary and add a directive instruction

**Current:**
```xml
<objective>
Display the Discord invite link for the GSD community server.
</objective>

<output>
# Join the GSD Discord
...
</output>
```

**Rewritten:**
```xml
<task>
Reproduce the following response verbatim. Do not add, remove, or rephrase any content.
</task>

<output_format>
# Join the GSD Discord

Connect with other GSD users, get help, share what you're building, and stay updated.

**Invite link:** https://discord.gg/mYgfVNfA2r

Click the link or paste it into your browser to join.
</output_format>
```

This fixes both weaknesses 1 and 2 simultaneously: `<task>` replaces `<objective>` (standard tag), `<output_format>` replaces `<output>` (correct semantic), and the imperative directive "Reproduce the following response verbatim" closes the instruction gap.

### Rewrite 2 — Alternative: eliminate the model entirely via frontmatter

If the framework supports static-output commands (commands that skip model inference for hardcoded responses), the correct engineering choice is to declare the output in frontmatter and bypass the LLM entirely. This is the logical endpoint of §22 Pattern 9 (minimum required capability) and §10 Prompt Length and Compression (tokens that don't contribute to the task are a cost):

```yaml
---
name: gsd:join-discord
description: Join the GSD Discord community
allowed-tools: []
static_output: |
  # Join the GSD Discord

  Connect with other GSD users, get help, share what you're building, and stay updated.

  **Invite link:** https://discord.gg/mYgfVNfA2r

  Click the link or paste it into your browser to join.
---
```

If the framework does not support `static_output`, Rewrite 1 is the correct fallback.

---

## Overall Verdict

**Adequate** — with a narrow scope caveat.

For a static-display command with zero model reasoning required, this prompt achieves its functional goal. The tool permission discipline is exemplary. The weaknesses are structural rather than behavioral: the tag vocabulary is non-standard, the instruction is implicit rather than explicit, and `<output>` is semantically misplaced. None of these will cause the command to fail in practice, but all three violate guide principles that exist to prevent silent failures in more complex compositions. Rewrite 1 resolves all three issues in four lines.

If the framework ever gains static-output support, this command should be the first converted — using a language model to reproduce a hardcoded string is the canonical case for bypassing inference entirely.
