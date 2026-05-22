# Critique: `commands/gsd/audit-milestone.md`

Reviewed against: Prompt Engineering Guide V09
Date: 2026-04-30

---

## Overall Verdict: **Needs Work**

The command functions as a thin dispatch stub — it delegates almost all behavior to an external workflow file (`@~/.claude/get-shit-done/workflows/audit-milestone.md`). As a result, it cannot be evaluated as a self-contained prompt; it is closer to a routing shim than a prompt. The issues below are intrinsic to the stub itself, independent of whatever the workflow file contains.

---

## Strengths

### 1. XML section tagging — §4 Formatting and Structure

The command uses `<objective>`, `<execution_context>`, `<context>`, and `<process>` tags to separate distinct sections. This follows §4 Action 2: "wrap each in a semantically named XML tag." The sections are clearly bounded and the tag names are semantically descriptive (they name what the section *is*).

### 2. Explicit orchestrator identity declaration — §22 Pattern 1

The bolded sentence "**This command IS the orchestrator.**" inside `<objective>` establishes an unambiguous role identity for the model at the point where it most needs it. This aligns with §22 Pattern 1: "State the agent's identity as a specific expert in the exact domain the task requires."

### 3. Concrete glob patterns for completed work — §8 Context Placement

The two `Glob:` lines in `<context>` name exact file path patterns rather than describing them abstractly. This is consistent with §8 Action 4: trim context to what is directly relevant and provide precise retrieval targets rather than vague descriptions.

---

## Weaknesses

### Weakness 1: No persona — §6 Persona Assignment (Critical)

The command assigns no persona to the agent executing the audit. The guide (§6 Action 2, §22 Pattern 1) requires that when a command involves judgment calls — determining coverage, assessing integration quality, routing to pass/fail — a specific, domain-scoped persona must constrain the model's register and decision-making style. Generic assistant behavior is the default without a persona, and for an audit command this matters: an auditor and a developer reach different conclusions from the same evidence.

The current `<objective>` block describes *what* the command does but not *who* the model is while doing it.

### Weakness 2: No output format specification — §7 Output Format Handling, §22 Pattern 3 (Critical)

There is no `<output_format>` section anywhere in the command. The guide (§7, §22 Pattern 3) requires output structure, field names, ordering, and an example to be stated before the model begins. An audit command produces a verdict — and if that verdict is used by downstream tooling or by the human to decide whether to archive a milestone, the format must be exact and parseable.

The current command produces whatever structure the workflow file elicits, which will vary across runs. The guide is explicit: "A fully specified format produces consistent, parseable output. An implicit format produces structure that varies per call" (§22 Pattern 3).

### Weakness 3: Deferred behavior with no fallback or scope guard — §16 Multi-Phase Workflows, §5 Instruction Framing

The `<process>` block says "Execute the audit-milestone workflow from @~/.claude/get-shit-done/workflows/audit-milestone.md end-to-end." If that file is missing, inaccessible, or its content has changed, the command gives the model no fallback path, no scope guard, and no conditional branch. The guide (§16 Scenario-based branching) requires explicit `<scenarios>` handling for alternate execution paths. The guide (§5 Conditional instructions) requires: "When behavior depends on context, use explicit conditional branching."

A secondary issue: the `<process>` block repeats the delegation instruction ("Execute the workflow") and then adds "Preserve all workflow gates" — but "preserve" is a maintenance instruction, not a behavioral constraint. This violates §11 Action 3: "State each instruction exactly once." The two sentences partially overlap without resolving what happens if the gates cannot be preserved.

---

## Specific Rewrites

### Rewrite 1: Add a persona (fixes Weakness 1)

Insert before `<objective>`:

```xml
<persona>
You are a milestone audit specialist. Your job is not to confirm the milestone succeeded —
it is to surface any gap between what was originally specified and what was actually delivered.

Your strengths:
- Reading requirement files and verification artifacts to determine coverage
- Identifying cross-phase integration gaps not visible within a single phase's VERIFICATION.md
- Producing a structured, unambiguous verdict that distinguishes confirmed-complete from partially-complete from failed
</persona>
```

This follows §6 Action 2 (specific, role-constrained persona), §6 reframe pattern ("not to confirm… it is to surface"), and §6 Strengths listing.

---

### Rewrite 2: Add an output format section (fixes Weakness 2)

Add after `<process>`:

```xml
<output_format>
End your response with a verdict block in exactly this format — it is used by the caller
to decide whether to proceed with archiving:

## Milestone Audit Verdict

| Dimension | Status | Notes |
|-----------|--------|-------|
| Requirements coverage | PASS / PARTIAL / FAIL | |
| Cross-phase integration | PASS / PARTIAL / FAIL | |
| End-to-end flows | PASS / PARTIAL / FAIL | |
| Tech debt / deferred gaps | [count] items | |

**Overall: PASS / PARTIAL / FAIL**

Use `PASS` only when all four dimensions are PASS.
Use `PARTIAL` when any dimension is PARTIAL and none are FAIL.
Use `FAIL` when any dimension is FAIL.

Do not vary the wording, capitalization, or structure of this block.
</output_format>
```

This follows §7 machine-parsed output specification and §22 Pattern 3 (format specified completely and upfront with an example).

---

### Rewrite 3: Add scenario branching for workflow file availability (fixes Weakness 3)

Replace the current `<process>` block with:

```xml
<process>
<scenarios>
  <scenario condition="workflow_file_accessible">
    Execute the audit-milestone workflow from
    @~/.claude/get-shit-done/workflows/audit-milestone.md end-to-end.
    Preserve all workflow gates: scope determination, verification reading,
    integration check, requirements coverage, and routing.
  </scenario>

  <scenario condition="workflow_file_missing_or_unreadable">
    Proceed with the inline fallback:
    1. Glob .planning/phases/*/*-SUMMARY.md — read all matched files.
    2. Glob .planning/phases/*/*-VERIFICATION.md — read all matched files.
    3. Read the milestone requirements file (REQUIREMENTS.md or equivalent in .planning/).
    4. For each requirement: confirm coverage against at least one VERIFICATION.md entry.
    5. Flag any requirement with no matching verification as a gap.
    6. Produce the output format verdict below.
  </scenario>
</scenarios>
</process>
```

This follows §16 Scenario-based branching and §5 Conditional instructions. It also removes the partially-overlapping "Preserve all workflow gates" maintenance instruction, satisfying §11 Action 3 (each instruction exactly once).

---

## Checklist Against §23

| Check | Status |
|-------|--------|
| Intent, audience, and quality bar explicit | Partial — intent yes, audience and quality bar absent |
| All constraints compatible | N/A — no constraints specified |
| No negative instructions needing conversion | Pass — none present |
| Priority order explicit when multiple criteria apply | Fail — no priority_order tag |
| Persona specific and role-constrained | Fail — no persona |
| Output format specified completely upfront | Fail — no output_format section |
| Task instruction at start of prompt | Pass |
| Scenario-based branching for alternate paths | Fail — no scenarios tag |
| Each instruction appears exactly once | Partial — process block has mild duplication |
| Agent prompt is self-contained | Fail — depends entirely on external file with no fallback |
