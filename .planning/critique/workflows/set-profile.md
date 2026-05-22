# Critique: set-profile.md

## Summary

`set-profile.md` is a lean, well-scoped workflow that applies several guide principles correctly: it uses semantically named XML tags to separate sections, pairs a permission block with a restriction block, and keeps scope narrow. However, it misses several high-impact guide requirements. There is no persona, no quality bar, and no audience specification. The `<execution_steps>` section uses a markdown header inside an XML-tagged block, creating a structural inconsistency. Priority ordering is defined but incomplete — the instructions stop at step 3 with "Stop after the final output line," which overlaps with the `<output_format>` constraint and introduces minor redundancy. The most significant gap is the absence of a `<task>` description that states the *why* — what makes a good response in this context — making the workflow's quality standard implicit rather than explicit.

---

## Strengths

- **Section 4 Action 2 — XML tag separation**: The workflow correctly uses semantically named XML tags (`<task>`, `<context>`, `<priority_order>`, `<execution_steps>`, `<output_format>`, `<constraints>`) to separate distinct sections, providing richer signal than markdown delimiters alone.
- **Section 14 — Explicit permission pairs**: The `<constraints>` block pairs `<permitted>` and `<reserved_for_human_review>` explicitly, following the guide's requirement to state what IS permitted alongside what is restricted. Both sides are concrete, not qualitative.
- **Section 8 Action 1 — Task instruction leads**: The `<task>` tag appears at the very start of the prompt, matching the high-attention placement rule.
- **Section 5 — Priority ordering**: A `<priority_order>` block is present and provides an explicit priority ranking, reducing ambiguity when instructions conflict.
- **Section 10 Action 1 — Prompt length**: The workflow is compact and contains no redundant instructions or boilerplate filler. Every section contributes directly to the task.
- **Section 11 Action 3 — Each instruction once**: No instruction is repeated across sections. The output format, constraints, and steps each appear in exactly one location.

---

## Issues

### Issue 1: Missing audience and quality bar (Section 1 Actions 1–2)

**Principle**: Section 1 Action 1 requires making explicit (a) what output is requested, (b) why it matters or how it will be used, and (c) what a correct or high-quality response looks like. Section 1 Action 2 requires encoding the audience explicitly.

**What's missing**: The `<task>` tag states *what* to do ("switch the active model profile… then display the CLI result verbatim") but says nothing about *why* this matters or who is invoking it. There is no `<audience>` tag and no `<quality_bar>` tag specifying what separates a good response from a poor one.

**Concrete fix**: Add the following tags after the closing `</task>` tag:

```xml
<audience>
A developer using GSD who has invoked the set-profile workflow with a profile name argument.
They expect immediate, machine-readable confirmation that the profile was changed, with no
additional commentary.
</audience>

<quality_bar>
A correct response contains only the verbatim CLI output — no added sentences, no preamble,
no reformatting. If the CLI returns an error, that error text is the complete response.
</quality_bar>
```

---

### Issue 2: No persona defined for a workflow that has a specific, constrained voice (Section 6 Action 2)

**Principle**: Section 6 Action 1 states that when a task requires specific, constrained output behavior (not generic assistant behavior), a persona should constrain register and voice. Section 22 Pattern 1 reinforces that role identity scoped to the exact domain produces more consistent outputs.

**What's missing**: This workflow requires highly constrained output behavior — verbatim CLI passthrough with no commentary, no reformatting, and an immediate stop. This is a non-default behavior that benefits from an explicit persona enforcing it. Without a persona, the model falls back to its default tendency to add helpful context and transitions.

**Concrete fix**: Add a `<persona>` block immediately after the `<task>` block:

```xml
<persona>
You are a passthrough relay. Your sole function is to run the specified command and
return its output without modification. You do not add preamble, explanation, next steps,
or error commentary beyond what the CLI returns.
</persona>
```

---

### Issue 3: Structural inconsistency — markdown `##` header inside an XML-tagged block (Section 4 Action 2)

**Principle**: Section 4 Action 2 states that XML tags are strictly better than markdown headers for Claude-class models because the tag name carries semantic meaning, the structure is unambiguous, and there is no collision with output formatting. Using a markdown header (`## 1. Run the profile switch`) inside `<execution_steps>` mixes two delimiter systems, reducing structural clarity.

**What's missing**: The `## 1. Run the profile switch` header inside `<execution_steps>` should either be a nested XML tag or plain prose. Using a `##` header inside an XML block is a structural inconsistency.

**Concrete fix**: Replace the markdown header with a plain prose label or a nested XML tag:

```xml
<execution_steps>
  <step id="1" name="Run the profile switch">
    Run the following command:

    ```bash
    node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set-model-profile $ARGUMENTS --raw
    ```
  </step>
</execution_steps>
```

---

### Issue 4: Priority order item 3 duplicates the output_format constraint (Section 11 Action 3)

**Principle**: Section 11 Action 3 states each instruction should appear in exactly one location. Repeated instructions consume context and add noise without reinforcing compliance.

**What's missing**: `<priority_order>` item 3 reads "Stop after the final output line." This instruction is semantically identical to the `<output_format>` block's "Display the command output exactly as returned. Stop immediately after the final line of that output." The stop-rule is stated twice in two different sections.

**Concrete fix**: Remove item 3 from `<priority_order>` and keep the stop instruction exclusively in `<output_format>`, which is the semantically correct home for output behavior:

```xml
<priority_order>
1. Argument present and valid — pass it to the CLI as-is; the CLI handles validation and error output
2. Output the CLI result verbatim — no paraphrasing, no added commentary, no reformatting
</priority_order>
```

---

### Issue 5: No error-path branching or conditional handling (Section 5 — Conditional Instructions)

**Principle**: Section 5 states that when behavior depends on context, explicit conditional branching must be used. Section 16 covers scenario-based branching for multiple execution paths.

**What's missing**: The workflow does not specify what happens when no argument is passed, or when the CLI returns a non-zero exit code. The `priority_order` says "Argument present and valid — pass it to the CLI as-is" but gives no instruction for the absent-argument case. The CLI presumably handles validation, but the workflow does not confirm this behavior explicitly.

**Concrete fix**: Add a `<scenarios>` block or inline conditional to the `<execution_steps>`:

```xml
<scenarios>
  <scenario condition="argument_present">
    Run: node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set-model-profile $ARGUMENTS --raw
    Display the output verbatim and stop.
  </scenario>

  <scenario condition="no_argument_provided">
    Run the CLI with no argument — the CLI will return usage or an error. Display that
    output verbatim and stop. Do not prompt the user for a profile name.
  </scenario>
</scenarios>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide. Items not applicable to a single-step passthrough workflow are marked N/A.

### Task Specification
| Item | Score |
|------|-------|
| Intent, audience, and quality bar are all explicit in the prompt | FAIL — audience and quality bar are absent |
| All constraints are compatible — no conflicts between scope, length, or depth | PASS |

### Chain of Thought
| Item | Score |
|------|-------|
| CoT is included only for math, symbolic reasoning, or multi-step logic tasks | N/A — this is a passthrough task; CoT is correctly omitted |
| CoT trigger used if applicable | N/A |
| Reasoning elicited before the answer | N/A |
| CoT traces treated as heuristic aids | N/A |

### Few-Shot Examples
| Item | Score |
|------|-------|
| Examples selected by semantic similarity | N/A — no examples used |
| 2–5 examples total | N/A |
| Ordered simple → complex | N/A |
| Examples span diverse sub-types | N/A |
| Format consistent across examples | N/A |
| Example order fixed across evaluation runs | N/A |

### Formatting
| Item | Score |
|------|-------|
| Instruction is complete and clear before formatting is applied | PASS |
| Prompt sections are separated by semantically named XML tags | PASS — with one exception: markdown `##` header inside `<execution_steps>` (see Issue 3) |
| At least 3 format variants will be tested on target model | FAIL — no evidence of format variant testing |

### Instruction Framing
| Item | Score |
|------|-------|
| All negative instructions converted to positive equivalents | PASS — no negative-form instructions present |
| Priority order is explicit when multiple criteria apply | PASS — `<priority_order>` block present |
| Tie-breaking rules match domain's cost asymmetry | N/A — binary passthrough task; no tie-breaking required |

### Persona
| Item | Score |
|------|-------|
| Persona is included only for open-ended or stylistic tasks | FAIL — no persona defined, but constrained passthrough behavior benefits from one (see Issue 2) |
| Persona is specific (constrains voice/register), not generic | N/A — no persona exists to evaluate |
| Persona descriptor is gender-neutral | N/A |

### Output Format
| Item | Score |
|------|-------|
| Structured output tasks use two-step reasoning-then-format approach | N/A — passthrough, not structured output |
| Single-call JSON places reasoning fields before answer fields | N/A |
| Constrained decoding adopted only after free-form + post-processing proven insufficient | N/A |
| Machine-parsed output uses exact format specification with literal string requirements | PASS — "Display the command output exactly as returned" is a clear, literal specification |

### Context Placement
| Item | Score |
|------|-------|
| Task instruction is at the start of the prompt | PASS |
| Primary document or input is at the end of the prompt | N/A — no primary document; `$ARGUMENTS` is inline in the command |
| Background context is in the middle | PASS — `<context>` is positioned between `<task>` and `<priority_order>` |
| All irrelevant context has been removed | PASS |
| Time-sensitive injected context is labeled as a snapshot | N/A |

### Self-Consistency
| Item | Score |
|------|-------|
| Self-consistency applied only to tasks with a single correct answer | N/A |
| Inference budget permits 15–20 samples | N/A |

### Prompt Length
| Item | Score |
|------|-------|
| Redundant instructions and repeated context removed | FAIL — stop instruction appears in both `<priority_order>` and `<output_format>` (see Issue 4) |
| Long prompts compressed before sending | N/A — prompt is already minimal |
| RAG context is extracted relevant passage only | N/A |

### System / User Split
| Item | Score |
|------|-------|
| Persistent instructions are in the system prompt | N/A — workflow file, not a split system/user prompt |
| Task-specific instructions are in the user prompt | N/A |
| Each instruction appears in exactly one location | FAIL — stop-after-output duplicated across two sections |
| Safety-critical constraints have external validation | N/A |

### Agent / Subagent
| Item | Score |
|------|-------|
| Agent prompts are fully self-contained | PASS — the workflow is self-contained |
| All file paths in agent output are absolute | PASS — `$HOME/.claude/get-shit-done/bin/gsd-tools.cjs` uses an absolute path via `$HOME` |
| Parallel agents launched in single message block | N/A |
| Adversarial probes specified for verification agents | N/A |

### Structural Architecture
| Item | Score |
|------|-------|
| Large prompts decomposed into atomic, single-responsibility modules | PASS — this is already a focused, single-responsibility workflow |
| Template variables use `${VARIABLE_NAME}` syntax with fallback | FAIL — `$ARGUMENTS` uses shell-style `$VAR` rather than guide-standard `${VARIABLE_NAME}`; no fallback defined for missing argument |
| Modules compose at runtime via variable substitution, not copy-paste | PASS |

### Constraint Enforcement
| Item | Score |
|------|-------|
| Every restriction paired with an equally concrete permission | PASS |
| Hard exclusion lists enumerated, not qualitative | PASS — `<reserved_for_human_review>` is a concrete list |
| Known edge cases have precedent-style rulings | FAIL — no-argument case and CLI error case are unhandled (see Issue 5) |
| Confidence thresholds are numeric, not qualitative | N/A |

### Decision Frameworks
| Item | Score |
|------|-------|
| Multi-option recommendations use explicit decision tree or comparison table | N/A — single execution path |
| Criteria checklists gate complex approaches | N/A |
| Action permissions framed around reversibility | PASS — `<reserved_for_human_review>` gates the config write to the CLI tool |

### Multi-Phase Workflows
| Item | Score |
|------|-------|
| Complex tasks organized into explicit named phases | N/A — single-step workflow |
| Required steps distinguished from type-specific steps | N/A |
| Scenario-based branching handles multiple paths explicitly | FAIL — no-argument and CLI-error paths are not handled (see Issue 5) |

### Memory and Continuity
| Item | Score |
|------|-------|
| Memory templates use XML tags as section labels | N/A |
| Compaction summaries include discoveries and failed approaches | N/A |
| Next steps tied to user's most recent explicit request | N/A |

### Modularity
| Item | Score |
|------|-------|
| Each prompt component has a single responsibility | PASS |
| Scope boundaries state both inclusions and exclusions | PASS — `<permitted>` and `<reserved_for_human_review>` together define the full scope |

### Safety and Trust
| Item | Score |
|------|-------|
| Validation at system boundaries only; internal interfaces trusted | PASS — validation is delegated to `gsd-tools.cjs`; the workflow trusts its output |
| Dual-use capabilities state permissions before restrictions | PASS — `<permitted>` precedes `<reserved_for_human_review>` |
| Authorization is narrow-scoped; each action confirmed before expanding scope | PASS |

### Tone and Style
| Item | Score |
|------|-------|
| Size constraints use numeric limits, not qualitative descriptors | N/A — no size constraint needed for passthrough |
| Instructions use imperative present tense | PASS — "Run", "Display", "Switch" |
| Working notes are in analysis tags, not user-facing output | N/A |

### Optimization
| Item | Score |
|------|-------|
| Prompt flagged as draft for automated optimization | FAIL — no such flag |
| Correct optimizer selected | FAIL — not addressed |
| Held-out test set reserved before optimization begins | FAIL — not addressed |

---

## Recommendations

Listed in priority order by impact on output quality and reliability.

### 1. Add `<audience>` and `<quality_bar>` (Section 1 Actions 1–2) — HIGH IMPACT

The absence of an explicit quality bar means the model has no calibrating standard for what "verbatim" means at the boundary cases (e.g., CLI output with trailing newlines, ANSI codes, or multi-line error messages). Adding both tags takes four lines and eliminates the most common failure mode for passthrough-style workflows: the model paraphrasing or summarizing instead of relaying.

### 2. Add a passthrough `<persona>` (Section 6, Section 22 Pattern 1) — HIGH IMPACT

The workflow's most important behavioral requirement — no commentary, no next-step guidance, immediate stop — is counter to the model's default assistant instincts. A tightly scoped passthrough persona ("You are a relay, not an assistant") enforces this at the register level rather than relying solely on `<output_format>` and `<priority_order>`.

### 3. Add explicit `<scenarios>` for the no-argument and error-path cases (Section 5, Section 16) — MEDIUM IMPACT

`priority_order` item 1 assumes an argument is present and valid but gives no instruction for the absent-argument case. A two-scenario block (argument present / no argument) covers the full execution space and prevents the model from improvising or prompting the user for input.

### 4. Deduplicate the stop instruction from `<priority_order>` (Section 11 Action 3) — LOW IMPACT

Item 3 of `<priority_order>` ("Stop after the final output line") is semantically identical to the closing sentence of `<output_format>`. Removing item 3 from `<priority_order>` reduces noise and keeps output behavior instructions in their canonical location.

### 5. Fix the `$ARGUMENTS` variable syntax and structural inconsistency in `<execution_steps>` (Section 4 Action 2, Section 13) — LOW IMPACT

Replace `$ARGUMENTS` with `${ARGUMENTS}` (guide-standard `${VARIABLE_NAME}` syntax) and add an empty-argument fallback. Replace the `## 1.` markdown header inside `<execution_steps>` with a `<step id="1">` tag to maintain consistent XML structure throughout the document.
