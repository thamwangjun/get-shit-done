# Critique: `commands/gsd/insert-phase.md`

Reviewed against: Prompt Engineering Guide V09
Scope: The command file (`commands/gsd/insert-phase.md`) plus the workflow it delegates to (`~/.claude/get-shit-done/workflows/insert-phase.md`), treated as a single logical prompt unit.

---

## Strengths

### XML structural tags used throughout (§4 Formatting and Structure)

The command file correctly uses semantically named XML tags (`<objective>`, `<execution_context>`, `<context>`, `<process>`) rather than markdown headers or `---` delimiters. The workflow file extends this with `<purpose>`, `<step name="...">`, `<anti_patterns>`, and `<success_criteria>`. This aligns directly with §4 Action 2: tags carry semantic meaning and are unambiguous, unlike delimiter-only formatting.

### Anti-patterns named explicitly as a positive exclusion list (§14 Constraint Enforcement)

The `<anti_patterns>` block in the workflow functions as a hard exclusion list — it enumerates six specific behaviors to avoid with operational specificity (e.g., "Don't insert before Phase 1", "Don't create plans yet"). This matches §14's pattern for exclusion lists: concrete, enumerated, not qualitative.

### Named steps with a clear sequential structure (§16 Multi-Phase Workflows)

The workflow organizes execution into five named `<step>` elements with distinct responsibilities: parse, init, insert, update state, complete. This matches §16's phase pattern, where cognitive boundaries prevent the model from skipping ahead. The step names are action-oriented and unambiguous.

### Success criteria defined as a checklist (§1 Task Specification — quality bar)

The `<success_criteria>` block enumerates five concrete, testable completion conditions. This partially satisfies §1 Action 1(c): specifying what a correct response looks like. The checklist format makes verification mechanical rather than subjective.

---

## Weaknesses

### 1. Anti-patterns use negated instruction framing — not converted to positive equivalents (§5 Instruction Framing, Action 1)

The `<anti_patterns>` block contains six "Don't..." instructions. §5 Action 1 is unambiguous: "Before emitting any prompt, scan for negated instructions... Rewrite each as a positive specification of the desired behavior." The guide provides a mechanical conversion table. None of the six anti-pattern lines have been converted.

This matters because negative instructions specify what to avoid, not what to do. The model must infer the permitted behavior. For example, "Don't create plans yet" does not tell the model what to do when a plan-creation request is implicit in the context — it only tells it what not to do. A positive equivalent ("Limit scope to roadmap and STATE.md updates; defer plan creation to `/gsd-plan-phase`") specifies the affirmative constraint.

The exception carved out in §5 is the reframe pattern (§6): "Your job is NOT X — it's Y." None of the anti-patterns are reframe constructions — they are plain negations and do not qualify for the exception.

### 2. No output format specification for the completion summary (§7 Output Format Handling; §22 Pattern 3)

The `<step name="completion">` block defines the completion message as a literal markdown template hardcoded inline. While this gives some structure, it is not wrapped in an `<output_format>` tag and contains no instruction about the format's intent, field semantics, or parsing contract. §22 Pattern 3 states: "State the required output structure, field names, ordering, and an example before the model begins its task."

The template mixes instructional prose (e.g., "indicates urgent work") with output values (`{decimal_phase}`, `{description}`) without distinguishing what is literal output versus what is variable interpolation. The guide's machine-parsed output specification pattern (§7) requires literal string requirements and exact format contracts when the output will be consumed downstream or read by a user following a protocol.

Additionally, the `## Next Up` block uses markdown `##` headers inside what appears to be a code-fenced block, but the outer fence is missing in the actual file — the indented block under `<step name="completion">` is not a fenced code block, creating ambiguity about whether the template is instructional prose or literal output.

### 3. No task specification: audience, quality bar, and intent are implicit (§1 Task Specification, Actions 1–2)

The `<objective>` block describes what the command does ("Insert a decimal phase for urgent work") and why it exists ("Handle urgent work... without renumbering entire roadmap"), but it does not address:

- **Audience**: Who runs this command and what they know. The guide (§1 Action 2) requires encoding the audience's domain knowledge and vocabulary level. The command assumes the user knows what "decimal phase numbering," "milestone," and "ROADMAP.md" mean — a reasonable assumption, but an unstated one. This omission matters for edge-case handling: if the user provides a decimal phase number as the `<after>` argument, the workflow only validates that the first argument is an integer, and exits silently. No guidance exists on what to communicate back to a confused user.

- **Quality bar** (§1 Action 1(c)): What does a correct execution look like beyond the success checklist? The checklist answers whether steps completed, not whether the output was high-quality. For example, the slug generated from the description — is truncation acceptable? Is a slug with numbers acceptable? These are implicit quality judgments the model makes without grounding.

---

## Specific Rewrites

### Rewrite 1: Convert `<anti_patterns>` to positive constraints (fixes Weakness 1)

**Current:**
```
<anti_patterns>
- Don't use this for planned work at end of milestone (use /gsd-add-phase)
- Don't insert before Phase 1 (decimal 0.1 makes no sense)
- Don't renumber existing phases
- Don't modify the target phase content
- Don't create plans yet (that's /gsd-plan-phase)
- Don't commit changes (user decides when to commit)
</anti_patterns>
```

**Suggested rewrite:**
```xml
<constraints>
  <scope>Use this command only for urgent work that must execute between two existing
  integer phases. For work at the end of a milestone, use /gsd-add-phase instead.</scope>

  <permitted>
    - Insert after any existing integer phase (Phase 1 or later)
    - Update ROADMAP.md and STATE.md only
    - Create the phase directory skeleton
  </permitted>

  <reserved_for_human_review>
    - Creating plan files (use /gsd-plan-phase after insertion)
    - Committing changes (user controls commit timing)
    - Renumbering or modifying content of existing phases
  </reserved_for_human_review>
</constraints>
```

This surfaces what is permitted alongside what is not, satisfying §14's explicit permission pairs pattern, and converts every negation to a positive specification.

---

### Rewrite 2: Add an `<output_format>` block to the completion step (fixes Weakness 2)

**Current:** the completion step embeds the output template inline with no format contract.

**Suggested addition** (replace the inline template in `<step name="completion">`):

```xml
<output_format>
Present the completion summary as plain markdown using exactly the structure below.
Variable placeholders ({decimal_phase}, {description}, etc.) are replaced with resolved values.
Do not add prose outside this structure.

---
Phase {decimal_phase} inserted after Phase {after_phase}:
- Description: {description}
- Directory: .planning/phases/{decimal_phase}-{slug}/
- Status: Not planned yet
- Marker: (INSERTED) — indicates urgent, unplanned insertion

Files updated:
- .planning/ROADMAP.md
- .planning/STATE.md

Next step: `/gsd-plan-phase {decimal_phase}`
Also available: Review whether Phase {next_integer} dependencies still apply.
---
</output_format>
```

This separates the format contract from the step logic, makes field semantics explicit, and eliminates the ambiguity between instructional prose and literal output values.

---

### Rewrite 3: Add an `<audience>` and `<quality_bar>` to `<objective>` (fixes Weakness 3)

**Current `<objective>` in `commands/gsd/insert-phase.md`:**
```xml
<objective>
Insert a decimal phase for urgent work discovered mid-milestone...
Purpose: Handle urgent work discovered during execution without renumbering entire roadmap.
</objective>
```

**Suggested rewrite:**
```xml
<objective>
Insert a decimal phase for urgent work discovered mid-milestone between existing integer
phases. Uses decimal numbering (72.1, 72.2, etc.) to preserve roadmap sequence without
renumbering.
</objective>

<audience>
A developer running GSD mid-milestone who has discovered blocking or urgent work.
They know phase numbers, ROADMAP.md structure, and the /gsd-plan-phase workflow.
They are providing an integer phase number and a short description as arguments.
</audience>

<quality_bar>
A correct execution:
- Inserts exactly one decimal phase entry into ROADMAP.md after the specified integer phase
- Creates a phase directory with the correct slug derived from the description
- Adds a single evolution note to STATE.md
- Presents the completion summary with all five fields populated
- Does not create plan files, commit changes, or modify any phase other than the insertion point
</quality_bar>
```

---

## Overall Verdict

**Adequate.**

The command demonstrates solid structural instincts: XML tags are used correctly, the workflow is step-sequenced with named boundaries, exclusions are enumerated rather than vague, and success criteria are testable. These are non-trivial things to get right and align with multiple guide sections.

However, it fails three §23 checklist items that directly affect output reliability: negated instructions are not converted to positive equivalents (§5), the completion output has no format contract (§7/§22 Pattern 3), and the task specification omits audience and quality bar (§1). The anti-pattern issue is the most impactful — six negated instructions remain unresolved throughout both files. The output format issue is the second-highest risk: the completion template is the only user-facing surface, and its ambiguity between prose and literal output will produce inconsistent formatting across runs.

None of these issues are structural — all three are fixable with targeted rewrites as shown above without redesigning the command.
