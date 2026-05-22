# Critique: `commands/gsd/secure-phase.md`

Reviewed against: Prompt Engineering Guide V09
Date: 2026-04-30

---

## Strengths

### 1. Three-state input detection is well-structured (§16 Multi-Phase Workflows)

The `<objective>` block enumerates three explicit states (A/B/C) with distinct outcomes. This matches the guide's scenario-based branching pattern (§16, Scenario-based branching), which demands handling of multiple paths explicitly rather than leaving the model to infer. State C includes a concrete exit instruction, satisfying the guide's directive to enumerate terminal states clearly.

### 2. Constraint pairing is partially present (§14 Constraint Enforcement)

The workflow's enforcement gate — blocking phase advancement when `threats_open > 0` — is stated positively and paired with a recovery path (`Fix mitigations then re-run` / `Or document accepted risks`). This aligns with the guide's rule that every restriction should be paired with what IS permitted equally concretely (§14, Explicit permission pairs).

### 3. Success criteria checklist serves as a self-contained quality bar (§1 Task Specification)

The `<success_criteria>` block at the bottom of the workflow file gives a concrete, checkable quality bar. This aligns with §1 Action 1c: making explicit what a correct or high-quality response looks like. Each checkbox item is specific and testable, not qualitative.

### 4. Agent spawning includes structured context injection (§17 Agent and Subagent Patterns)

Step 5's `Task()` call passes `<files_to_read>`, `<threat_register>`, `<config>`, and `<constraints>` as tagged sub-sections. This partially follows §17's self-contained agent prompt requirement. The `<constraints>` block correctly scopes the auditor to read-only and specifies the escalation behavior.

---

## Weaknesses

### 1. The command stub (`secure-phase.md`) is a thin redirect with no standalone value (§1 Task Specification, §8 Context Placement)

The command file contains only 36 lines, of which the substantive content is:

```
<objective>    — 5 lines of state summary
<context>      — 1 line (phase argument)
<process>      — 2 lines delegating to a workflow file via @-reference
```

Per §1 Action 1, a prompt must make explicit: (a) what output is being requested, (b) why it matters, and (c) what a correct response looks like. The command stub satisfies (a) minimally but omits (b) and (c) entirely — both live in the workflow file. A reader of the command file alone cannot determine the quality bar or purpose.

Per §8 Action 1, the task instruction must lead the prompt. The `<objective>` block does lead, but it describes three states at a level of abstraction that does not tell the model what to actually do — it is a table of contents, not an instruction.

**More critically**: the `<execution_context>` and `<process>` blocks are structurally identical; both say "execute this workflow file." This duplicates the same instruction in two places, violating §11 Action 3 ("State each instruction exactly once").

### 2. No output format specified in the command file (§7 Output Format Handling, §22 Pattern 3)

The command stub states `Output: updated SECURITY.md` as a one-liner inside `<objective>`. This is insufficient. Per §7 and §22 Pattern 3, the output format must be specified completely and upfront — including structure, field names, and a concrete example. The output spec here defers entirely to the workflow file, meaning if the workflow file is absent or updated, the command file gives the model no guidance whatsoever on what to produce.

The workflow file itself does better (Step 6 shows the audit trail table format), but the command file — the entry point — gives nothing.

### 3. Negative instructions are present and unconverted (§5 Instruction Framing, Action 1)

The workflow file (the executed document) contains negated directives that §5 Action 1 requires be converted to positive equivalents:

- `"Do NOT emit next-phase routing. Stop here."` (Step 6, enforcement gate)
- `"Treat implementation files as read-only."` (Step 5, agent constraints — this is negative framing via implication)

Per the guide's conversion table (§5), these must be rewritten as positive specifications:

| Current | Should be |
|---|---|
| `Do NOT emit next-phase routing` | `Emit only the BLOCKED banner. End response after the banner.` |
| `Treat implementation files as read-only` | `Read implementation files only. Write only to SECURITY.md.` |

### 4. Purpose and context blocks are redundant and add noise (§10 Prompt Length, §11 Action 3)

The workflow file contains three nearly-identical restatements of the same intent:

- `<task>`: "Verify threat mitigations for a completed phase and update SECURITY.md."
- `<context>`: "Confirms PLAN.md threat register dispositions... Update SECURITY.md."
- `<purpose>`: "Verify threat mitigations for a completed phase. Confirm PLAN.md... Update SECURITY.md."

Per §10 Action 1, redundant instructions must be removed before sending. Per §11 Action 3, each instruction appears in exactly one location. These three blocks say the same thing three ways. Only `<task>` should remain; `<purpose>` is identical and should be deleted. `<context>` adds one non-redundant datum (the spawner identity) and should be trimmed to that alone.

### 5. `<required_reading>` of `ui-brand.md` is unexplained and likely irrelevant (§8 Action 4, §10 Action 1)

The workflow file mandates reading `ui-brand.md` before execution. No subsequent step references brand, visual design, or UI style. Per §8 Action 4, every token not directly relevant to the task degrades performance. Including a brand reference file in a security verification workflow adds positional noise with no discernible benefit. If the brand file governs banner/output formatting, that constraint should be stated explicitly inline rather than imported wholesale.

---

## Specific Rewrites

### Rewrite 1: Collapse the duplicate `<execution_context>` and `<process>` blocks; add a minimal output spec

**Current (command file):**

```xml
<execution_context>
@~/.claude/get-shit-done/workflows/secure-phase.md
</execution_context>

<context>
Phase: $ARGUMENTS — optional, defaults to last completed phase.
</context>

<process>
Execute @~/.claude/get-shit-done/workflows/secure-phase.md.
Preserve all workflow gates.
</process>
```

**Rewrite:**

```xml
<context>
Phase: $ARGUMENTS — optional, defaults to last completed phase.
</context>

<output_format>
Produce or update ${PHASE_DIR}/${PADDED_PHASE}-SECURITY.md.
On success: display the THREAT-SECURE banner and next-step routing.
On block: display the SECURITY BLOCKED banner only — no routing.
</output_format>

<process>
@~/.claude/get-shit-done/workflows/secure-phase.md
</process>
```

This eliminates the duplicate execution reference, states the output contract explicitly in the command file itself, and removes the `<execution_context>` tag (which is a non-standard tag not in the guide's vocabulary — §4 XML tag vocabulary).

---

### Rewrite 2: Convert negative instructions to positive in the enforcement gate (§5 Action 1)

**Current (workflow, Step 6 enforcement gate):**

```
GSD > PHASE {N} SECURITY BLOCKED
{K} threats open — phase advancement blocked until threats_open: 0
▶ Fix mitigations then re-run: /gsd-secure-phase {N}
▶ Or document accepted risks in SECURITY.md and re-run.

Do NOT emit next-phase routing. Stop here.
```

**Rewrite:**

```
GSD > PHASE {N} SECURITY BLOCKED
{K} threats open — phase advancement blocked until threats_open: 0
▶ Fix mitigations then re-run: /gsd-secure-phase {N}
▶ Or document accepted risks in SECURITY.md and re-run.

End your response after this banner. The routing block in Step 8 applies only when threats_open: 0.
```

The positive form ("End your response after this banner") gives the model a concrete terminal action. The negative form ("Do NOT emit") names the thing to suppress, which primes the model to represent it before excluding it.

---

### Rewrite 3: Eliminate the redundant `<purpose>` block and trim `<context>` in the workflow file (§10, §11)

**Current (workflow file top matter):**

```xml
<task>
Verify threat mitigations for a completed phase and update SECURITY.md.
</task>

<context>
Confirms PLAN.md threat register dispositions (mitigate/accept/transfer) are resolved. Spawns gsd-security-auditor agent. Spawned by /gsd-secure-phase.
</context>

<purpose>
Verify threat mitigations for a completed phase. Confirm PLAN.md threat register dispositions are resolved. Update SECURITY.md.
</purpose>
```

**Rewrite:**

```xml
<task>
Verify that all PLAN.md threat register dispositions (mitigate/accept/transfer) are resolved for the completed phase. Update SECURITY.md with findings.
</task>

<context>
Invoked by /gsd-secure-phase. Spawns gsd-security-auditor subagent.
</context>
```

`<purpose>` is deleted (identical content to `<task>`). `<context>` is trimmed to the two datums not present in `<task>`: invocation source and subagent identity. Total reduction: ~3 lines of pure noise.

---

## Overall Verdict

**Adequate — tilting toward Needs Work.**

The workflow logic itself is solid: state detection is explicit, the enforcement gate is consequential and correctly implemented, the subagent invocation passes structured context, and the success criteria provide a testable quality bar. These are genuine strengths.

However, the command file (the entry point) is structurally weak: it duplicates its own execution instruction, specifies no output format, and delegates all substance to a file it cannot guarantee will be present. The workflow file compounds this with three restatements of its own purpose, an unexplained brand file import, and two unconverted negative instructions. None of these are hard to fix — they are omissions and redundancies, not architectural problems. A targeted pass against §5 (negative instructions), §10 (length), and §11 (deduplication) would bring this to Strong.
