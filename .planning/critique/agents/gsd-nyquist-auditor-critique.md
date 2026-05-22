# Prompt Engineering Critique: gsd-nyquist-auditor

**Agent:** `gsd-nyquist-auditor.md`
**Date evaluated:** 2026-04-30
**Guide version:** PROMPT_ENGINEERING_GUIDE_V09

---

## Guide Sections Evaluated

- Section 1: Task Specification
- Section 4: Formatting and Structure
- Section 5: Instruction Framing
- Section 6: Persona Assignment
- Section 7: Output Format Handling
- Section 8: Context Placement
- Section 11: System vs. User Prompt Allocation (YAML frontmatter)
- Section 13: Structural Architecture Patterns
- Section 14: Constraint Enforcement
- Section 16: Multi-Phase Workflows
- Section 17: Agent and Subagent Patterns
- Section 21: Tone and Style Rules
- Section 22: Production Patterns (esp. Patterns 1, 3, 6, 9)
- Section 23: Quick-Reference Checklist

---

## Strengths

### S1 — Multi-phase workflow with named phases (Section 16)
The prompt decomposes execution into explicit named `<step>` tags (`load_context`, `analyze_gaps`, `generate_tests`, `run_and_verify`, `debug_loop`, `report`). This creates cognitive phase boundaries and matches the guide's `<phase id="N" name="...">` pattern, giving the model a sequential execution contract.

### S2 — Decision tables as classification grids (Section 15)
The test-type classification table (Pure function → Unit, API endpoint → Integration, etc.) and the debug failure table (`Import/syntax/fixture error → Fix test`) are concise, directive decision frameworks consistent with Section 15's guidance on ASCII trees and comparison tables. They make conditional behavior explicit rather than leaving it to inference.

### S3 — Structured return format with three discrete outcomes (Section 7, Production Pattern 3)
The `<structured_returns>` block defines three fully specified output schemas — GAPS FILLED, PARTIAL, ESCALATE — each with example markdown tables and field names. This aligns with Section 7's instruction to specify output format completely and upfront, and Production Pattern 3 ("Output format specified completely and upfront"). The format is consistent and parseable by the calling orchestrator.

### S4 — Hard constraint on implementation files (Section 14)
`**Implementation files are READ-ONLY.** Only create/modify: test files, fixtures, VALIDATION.md.` is a clear, enforceable constraint. The debug loop table reinforces it by routing implementation bugs to ESCALATE rather than fix. This follows Section 14's explicit permission pair pattern.

### S5 — Success criteria checklist (Section 23)
The `<success_criteria>` block at the end provides a self-auditing checklist of behavioral invariants. This is a strong guard against partial execution and aligns with Section 23's quick-reference checklist model.

### S6 — Behavioral test naming convention stated explicitly (Section 21)
`Behavioral test names (test_user_can_reset_password), not structural (test_reset_function)` applies the guide's principle of pairing abstract instructions with calibrating examples (Production Pattern 2), using a concrete good/bad pair.

### S7 — Context budget guidance (Section 10)
`Context budget: Load project skills first (lightweight). Read implementation files incrementally — load only what each check requires, not the full codebase upfront.` reflects Section 10's directive to trim context to directly relevant content, reducing positional degradation.

---

## Weaknesses

### W1 — No `<persona>` tag; role defined in non-standard `<role>` tag (Sections 4, 6)

**Guide requirement (Section 4):** Use semantically named XML tags from the canonical vocabulary. `<persona>` is the top-level structural tag for role and voice.

**Guide requirement (Section 6):** Persona must constrain register, voice, and domain-specific style. The reframe pattern ("Your job is NOT X — it's Y") is the correct form for an adversarial/verification specialist.

**Agent text:**
```
<role>
GSD Nyquist auditor. Spawned by /gsd-validate-phase to fill validation gaps...
```

`<role>` is not in the canonical tag vocabulary (Section 4, XML tag vocabulary table). The persona is also sparse — it states identity but does not constrain register, voice, or behavioral priorities. The reframe pattern from Section 6 and Production Pattern 8 (adversarial verification) is absent. The agent should explicitly declare "Your job is not to verify the implementation is correct — it's to produce evidence that the requirement is covered by a passing test."

---

### W2 — No `<task>` wrapper at the top level; instruction does not lead the prompt (Sections 4, 8)

**Guide requirement (Section 8, Action 1):** "Place the task instruction at the very start of the prompt. Models attend most strongly to the beginning of their context."

**Guide requirement (Section 4, Action 2):** Wrap each distinct section in a semantically named XML tag; use `<task>` as the primary instruction container.

The prompt opens with YAML frontmatter, then immediately enters `<role>` without a `<task>` block. The actual task — "for each gap in `<gaps>`, generate minimal behavioral test, run it, debug if failing, report results" — is buried inside `<role>` rather than leading as a standalone `<task>`. There is no top-level `<goal>` or `<task>` tag, which means the primary instruction is mixed with persona definition rather than clearly separated.

---

### W3 — No `<constraints>` block with explicit permission pairs (Section 14)

**Guide requirement (Section 14):** "Pair every restriction with what IS permitted, stated equally concretely."

The READ-ONLY constraint appears inline in `<role>` as a bold sentence:
```
**Implementation files are READ-ONLY.** Only create/modify: test files, fixtures, VALIDATION.md.
```

This is not wrong, but it is not structured using the guide's `<constraints>` / `<permitted>` / `<reserved_for_human_review>` tag vocabulary. The guide mandates the pairing pattern so the model has an unambiguous permission surface. The current form states what is forbidden without a formal `<permitted>` block enumerating allowed write targets. An agent that encounters an unexpected file type has no structured rule to consult.

---

### W4 — Negative instructions not converted to positive equivalents (Section 5)

**Guide requirement (Section 5, Action 1):** "Scan for negated instructions... Rewrite each as a positive specification of the desired behavior."

The agent contains multiple negative-form instructions:
- `"Do NOT load full AGENTS.md files"`
- `"Never mark untested tests as passing"`
- `"Implementation bugs → ESCALATE. Never fix implementation."`

Per the guide's conversion table, these should be rewritten as positive specifications:
- `"Load only SKILL.md (lightweight index) for each skill; skip AGENTS.md entirely"`
- `"Execute every test before recording its status"`
- `"When actual behavior violates a requirement, escalate with evidence; test fixes only"`

The exception ("Your job is NOT X — it's Y") applies only to the reframe persona pattern in Section 6, not to operational instructions.

---

### W5 — No `<output_format>` tag; output format specification is structurally mixed with content (Sections 4, 7)

**Guide requirement (Section 4):** Use `<output_format>` as the canonical tag for required response structure.

**Guide requirement (Section 7, Action 2):** "If single-call structured output is required, order fields reasoning-first."

The three return schemas are embedded inside `<structured_returns>`, which is not a canonical tag. More importantly, there is no instruction telling the model *when* to choose each schema, nor are reasoning fields ordered before answer fields within each schema. The model must infer that ESCALATE is used when all iterations are exhausted, PARTIAL when some pass, and GAPS FILLED when all pass — this logic is implicit rather than codified in an explicit conditional (Section 5's conditional instructions pattern).

---

### W6 — No `<audience>` specification; quality bar is absent (Section 1)

**Guide requirement (Section 1, Actions 1–2):** Explicitly state (a) what output is requested, (b) why it matters, (c) what a correct response looks like, and (d) who will consume the output.

The prompt never states who receives the output (the `/gsd-validate-phase` orchestrator), what the orchestrator does with it, or what the quality bar is. There is no `<audience>` tag and no `<quality_bar>` tag. The structured return formats imply the audience is machine-parsed, but this is not stated — and Section 7 warns that machine-parsed output requires explicit format specification with literal string requirements (e.g., exact field names, no markdown bold on status tokens).

---

### W7 — No `allowed-tools` scoping in YAML frontmatter; tool list is too broad (Section 17, Production Pattern 9)

**Guide requirement (Section 17, Subagent configuration):** `disallowedTools` should be used in frontmatter when tools must be restricted. Production Pattern 9 requires "narrowest patterns that satisfy the task."

The frontmatter grants: `Read, Write, Edit, Bash, Glob, Grep`. For a subagent whose primary restriction is "implementation files are READ-ONLY," Write and Edit with no path constraints are a contradiction. The guide's pattern for scoped permissions would instead use `allowed-tools` with path-restricted patterns (e.g., `Write(tests/**)`, `Edit(tests/**)`) or enumerate `disallowedTools` for production files. The current grant creates a latent risk that a model hallucination could write to implementation files despite the prose constraint.

---

### W8 — No `whenToUse` or `criticalSystemReminder` in frontmatter (Section 17)

**Guide requirement (Section 17):** "`whenToUse` is the trigger description shown to the orchestrating model. Make it action-specific, not capability-generic." `criticalSystemReminder` is for the safety constraint that must survive across calls.

The frontmatter has `name`, `description`, `tools`, and `color` but no `agentMetadata` block. The `description` field (`"Fills Nyquist validation gaps by generating tests and verifying coverage for phase requirements"`) is capability-generic and does not tell an orchestrating model *when* to invoke vs. skip this agent. The READ-ONLY safety constraint is buried in prose and not surfaced as a `criticalSystemReminder`.

---

### W9 — No few-shot examples for test generation (Section 3, Production Patterns 2 and 3)

**Guide requirement (Section 3):** "Select by similarity... 2–5 examples... ordered simple → complex."

**Production Pattern 2:** "Every abstract instruction paired with a calibrating example."

The `generate_tests` step gives framework/runner tables but no concrete example of a well-formed test. The instruction "Write test file. One focused test per requirement behavior. Arrange/Act/Assert." is qualitative. A single concrete example pairing a requirement statement to a generated test body would calibrate the output standard. The behavioral naming convention does provide one good/bad pair, but no full test generation example exists.

---

## Concrete Improvements

### Improvement 1 — Replace `<role>` with `<persona>` using the reframe pattern

```xml
<persona>
You are a Nyquist validation specialist for GSD phases. Your job is not to confirm
that the implementation works — it is to produce executed test evidence that each
specified requirement is covered by a passing automated test.

"The implementation looks correct" is NOT a passing result. You must run tests and
produce pass/fail evidence.

Write targets: test files, fixtures, VALIDATION.md only.
Implementation files: read-only. Route implementation bugs to ESCALATE immediately.
</persona>
```

This applies Section 6's reframe pattern, constrains behavioral register, and moves the READ-ONLY constraint into the persona where it governs all subsequent decisions.

---

### Improvement 2 — Add a `<task>` block leading the prompt

Place before `<execution_flow>`:

```xml
<task>
For each gap listed in `<gaps>`: generate a minimal behavioral test, execute it,
debug if failing (max 3 iterations), and report results using the structured
return format (GAPS FILLED / PARTIAL / ESCALATE).
</task>
```

This satisfies Section 8 (task instruction leads) and Section 4 (canonical `<task>` tag).

---

### Improvement 3 — Replace inline constraint prose with a structured `<constraints>` block

```xml
<constraints>
  <permitted>
    - Read any file in the repository
    - Run read-only shell commands (grep, find, ls, cat, git log)
    - Create or modify test files, test fixtures, and VALIDATION.md
    - Run test commands per the framework table
  </permitted>

  <reserved_for_human_review>
    - Modifying implementation source files
    - Installing or removing dependencies
    - Running git write operations (add, commit, push)
  </reserved_for_human_review>

  <reporting_threshold>
    Report a gap as "green" only after the test has been executed and passed.
    Never mark a test passing without a run result.
  </reporting_threshold>
</constraints>
```

---

### Improvement 4 — Convert negative instructions to positive form (Section 5)

| Current (negative) | Replacement (positive) |
|---|---|
| `Do NOT load full AGENTS.md files` | `Load only SKILL.md for each skill; skip AGENTS.md entirely` |
| `Never mark untested tests as passing` | `Record each test status only after executing it and observing the result` |
| `Never fix implementation` | `When actual behavior violates a requirement, escalate with evidence; fix only the test` |

---

### Improvement 5 — Add `<output_format>` with explicit schema-selection conditionals

```xml
<output_format>
Select the return format based on resolution outcome:

- All gaps resolved → use GAPS FILLED format
- Some gaps resolved, some escalated → use PARTIAL format
- No gaps resolved → use ESCALATE format

Output plain text markdown. Do not bold status tokens (green, ESCALATE) — the
calling agent parses them as literal strings.

Each resolved gap entry MUST include: task_id, requirement text, test file path
(absolute), test command, and status token "green".
Each escalated gap entry MUST include: task_id, requirement text, reason,
iteration count (N/3), and last error message.
</output_format>
```

---

### Improvement 6 — Add `agentMetadata` with `whenToUse` and `criticalSystemReminder` to frontmatter

```yaml
agentMetadata:
  agentType: 'NyquistAuditor'
  whenToUse: >
    Subagent spawned by /gsd-validate-phase to fill specific validation gaps in a
    completed phase. Invoke only when gaps list is provided. Do not invoke for
    general code review or phase planning.
  criticalSystemReminder: >
    CRITICAL: Implementation files are READ-ONLY. Write only to test files,
    fixtures, and VALIDATION.md. Route implementation bugs to ESCALATE — never fix them.
```

---

### Improvement 7 — Add a minimal few-shot example to `generate_tests`

```xml
<examples>
  <example>
    <input>
      Requirement: "User can reset password via email link"
      Implementation: src/auth/reset.ts — exports resetPassword(token, newPassword)
    </input>
    <output>
```typescript
// tests/auth/reset.test.ts
import { resetPassword } from '../../src/auth/reset';

describe('password reset', () => {
  it('test_user_can_reset_password_with_valid_token', async () => {
    const result = await resetPassword('valid-token-123', 'newPass!1');
    expect(result.success).toBe(true);
  });
});
```
    </output>
    <commentary>
      One test per requirement behavior. Behavioral name. AAA structure.
      Test file path mirrors src path under tests/.
    </commentary>
  </example>
</examples>
```

---

## Overall Score: 6 / 10

**Justification:** The agent's core execution logic is well-structured. The multi-step workflow, decision tables for test classification and debug routing, three discrete return schemas, and the success criteria checklist all reflect production-grade thinking. The behavioral test naming example and context budget guidance are genuine strengths.

However, the agent diverges from the guide's structural conventions in several load-bearing areas: the primary instruction does not lead in a `<task>` tag, the persona uses a non-canonical tag and omits the reframe pattern, negative instructions are pervasive, the constraint block is informal prose rather than structured XML, the output format is not wrapped in `<output_format>` with explicit conditional routing, the frontmatter lacks `agentMetadata` entirely, and there are no few-shot test generation examples. These are not cosmetic issues — each one reduces behavioral consistency and machine parseability. Closing gaps W1–W5 and W8 would bring the score to approximately 8.5/10.
