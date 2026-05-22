# Critique: `commands/gsd/validate-phase.md`

Reviewed against: Prompt Engineering Guide V09
Date: 2026-04-30

---

## Strengths

### XML tag structure (§4 Formatting and Structure)
The command uses semantically named XML tags (`<objective>`, `<execution_context>`, `<context>`, `<process>`). This is directionally correct per §4 Action 2, which mandates wrapping distinct prompt sections in semantically named tags rather than markdown headers or `---` delimiters. The tag names name what each section *is*.

### Scenario enumeration in the objective (§16 Multi-Phase Workflows)
The three-state enumeration inside `<objective>` — (A) VALIDATION.md exists, (B) no VALIDATION.md but SUMMARY.md exists, (C) phase not executed — mirrors the scenario-based branching pattern from §16. It pre-empts the model having to infer which code path applies by naming the branches explicitly.

### Argument defaulting (§5 Instruction Framing — Conditional Instructions)
`Phase: $ARGUMENTS — optional, defaults to last completed phase.` applies the conditional instruction pattern from §5: behavior when an argument is absent is stated explicitly rather than left implicit.

---

## Weaknesses

### 1. Instruction body is hollow — the command delegates everything to an external file (§1 Task Specification, §4 Formatting and Structure)

The entire executable content of this command is:

```
Execute @~/.claude/get-shit-done/workflows/validate-phase.md.
Preserve all workflow gates.
```

By §1 Action 1, a prompt must make explicit: (a) what output is being requested, (b) why it matters, and (c) what a correct response looks like. None of these three components appear in the command file itself. The `<objective>` names three entry scenarios and the final deliverables (`VALIDATION.md + generated test files`) but does not specify what constitutes a correct or complete VALIDATION.md, what "Nyquist validation coverage" means in practice, or what the quality bar is for the generated test files.

By §4 Action 1, structure amplifies clarity in an already-clear instruction; it cannot substitute for specificity. The XML tags here impose structure on an instruction that is not fully specified — the actual behavioral specification is hidden in the referenced workflow file. If that file is unavailable, the command produces no usable output.

This also violates §19 (Modularity and Composition): the principle that each module must be independently understandable. A reader of this command cannot determine what the agent will do without reading the workflow file.

### 2. No output format specification (§7 Output Format Handling, §22 Pattern 3)

`<objective>` names the deliverables but specifies no structure for them. By §7 and §22 Pattern 3, output format must be stated completely and upfront: field names, ordering, an illustrative example. The command says nothing about:
- What sections VALIDATION.md must contain
- What format the generated test files must take
- What a passing vs. failing audit verdict looks like and whether it is machine-parseable

The guide's machine-parsed output pattern (§7) requires a literal-string verdict format. If the calling system parses a VERDICT from this agent, the command gives the agent no instruction to emit one in a specific format.

### 3. No persona assigned for an adversarial audit task (§6 Persona Assignment, §17 Agent Patterns — Adversarial Verification)

An audit task — retroactively finding validation gaps in a completed phase — is exactly the domain where an adversarial persona produces measurably different behavior. §17 gives the verification agent pattern:

> "Your job is not to confirm the implementation works — it's to try to break it."

§6 Action 1 specifies: assign a persona when the task is open-ended or requires a specific voice. Retroactive gap-finding is inherently open-ended; the model's default behavior will lean toward confirmation rather than adversarial probing. This command has no `<persona>` tag at all, which leaves the model in generic-assistant mode for a task that specifically benefits from a verification-specialist posture.

---

## Specific Rewrites

### Rewrite 1: Replace the hollow `<process>` block with inline behavioral specification

**Current:**
```xml
<process>
Execute @~/.claude/get-shit-done/workflows/validate-phase.md.
Preserve all workflow gates.
</process>
```

**Proposed:**
```xml
<process>
Load and execute the full workflow defined in
@~/.claude/get-shit-done/workflows/validate-phase.md.
Preserve all workflow gates defined there without modification.

The workflow produces two artifacts:
1. VALIDATION.md — an audit record enumerating each required validation check,
   its current status (PASS / FAIL / MISSING), and the evidence or gap.
2. Generated test files — one per uncovered check, co-located with the phase
   artifacts they validate.

After execution, emit a verdict line parsed by the calling system:

VERDICT: PASS
or
VERDICT: PARTIAL
or
VERDICT: FAIL

Use the literal string `VERDICT: ` followed by exactly one of `PASS`, `PARTIAL`,
or `FAIL`. No markdown bold, no punctuation, no wording variation.
</process>
```

This satisfies §1 Action 1 (output + quality bar) and §7's machine-parsed output specification.

### Rewrite 2: Add a persona scoped to adversarial audit

**Add before `<objective>`:**
```xml
<persona>
You are a validation specialist. Your job is not to confirm that the phase
completed correctly — it is to find every coverage gap the implementer missed.

"The phase appears complete" is not a finding. You must inspect artifacts,
trace each required validation check to concrete evidence, and produce a
structured gap report. Absence of evidence is a gap, not a pass.
</persona>
```

This applies §6 Action 2 (specific, not generic persona), §17's adversarial verification pattern, and the reframe pattern from §6 (`Your job is NOT X — it's Y`).

### Rewrite 3: Add an explicit quality bar for the three entry scenarios

**Current `<objective>` (trimmed):**
```xml
<objective>
Audit Nyquist validation coverage for a completed phase. Three states:
- (A) VALIDATION.md exists — audit and fill gaps
- (B) No VALIDATION.md, SUMMARY.md exists — reconstruct from artifacts
- (C) Phase not executed — exit with guidance
Output: updated VALIDATION.md + generated test files.
</objective>
```

**Proposed:**
```xml
<objective>
Audit Nyquist validation coverage for a completed phase.

<scenarios>
  <scenario id="A" condition="VALIDATION.md exists">
    Read the existing file. Identify every check listed as MISSING or FAIL.
    For each gap: generate a concrete test file and update the check's status.
    A complete audit has zero MISSING entries.
  </scenario>

  <scenario id="B" condition="no VALIDATION.md, SUMMARY.md exists">
    Reconstruct the required check list from SUMMARY.md and phase artifacts.
    Write a new VALIDATION.md with all checks, then apply scenario A.
  </scenario>

  <scenario id="C" condition="phase not executed">
    Exit immediately. Output: one sentence stating the phase has not run
    and the command required to execute it.
  </scenario>
</scenarios>

<quality_bar>
The audit is complete when VALIDATION.md exists, every required check has a
status of PASS or FAIL (none MISSING), and every FAIL entry has a corresponding
generated test file. Partial coverage is not a pass.
</quality_bar>
</objective>
```

This applies §16's `<scenarios>` pattern with explicit `condition` attributes and adds the `<quality_bar>` tag from §1 Action 1 / §4's XML vocabulary.

---

## Overall Verdict

**Needs Work**

The command has the structural skeleton right (XML tags, scenario enumeration, argument defaulting) but defers all substantive content to an external workflow file. As a standalone prompt artifact it satisfies fewer than half the §23 checklist items: there is no task specification meeting the three-component test (§1), no output format (§7), no persona (§6), no quality bar (§1), and no machine-parseable verdict (§7). The three rewrites above address the highest-leverage gaps without requiring changes to the referenced workflow file.
