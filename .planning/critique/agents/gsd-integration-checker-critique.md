# Prompt Engineering Critique: gsd-integration-checker

- **Agent**: `gsd-integration-checker.md`
- **Critique date**: 2026-04-30
- **Guide version evaluated against**: PROMPT_ENGINEERING_GUIDE_V09.md

---

## Guide Sections Evaluated

- §1 Task Specification
- §4 Formatting and Structure
- §5 Instruction Framing
- §6 Persona Assignment
- §7 Output Format Handling
- §8 Context Placement
- §10 Prompt Length and Compression
- §11 System vs. User Prompt Allocation
- §13 Structural Architecture Patterns
- §14 Constraint Enforcement
- §17 Agent and Subagent Patterns
- §19 Modularity and Composition
- §21 Tone and Style Rules
- §22 Production Patterns (Patterns 1, 2, 3, 6, 9)
- §23 Quick-Reference Checklist

---

## Strengths

### S1 — Core principle is well-named and memorable (§4, §22 Pattern 1)
The `<core_principle>` block leads with a short, declarative rule ("Existence ≠ Integration") and immediately enumerates the four connection types. This follows §22 Pattern 1's direction to state the agent's identity in domain-specific terms and §4's guidance that structure should amplify an already-clear instruction.

### S2 — Verification process is phase-structured (§16)
The six-step numbered sequence (Build Export/Import Map → Verify Export Usage → Verify API Coverage → Verify Auth Protection → Verify E2E Flows → Compile Report) aligns with §16's phase pattern. Each step is a named cognitive unit; the model can complete one before beginning the next.

### S3 — Wiring and flow output templates are consistent (§22 Pattern 3)
The YAML `wiring:` and `flows:` output templates in Step 6, and the markdown report skeleton in `<output>`, follow §22 Pattern 3: output format is specified completely and upfront with field names and an example. The Requirements Integration Map table is especially concrete — it specifies columns, values, and a conditional field ("—").

### S4 — Bash scripts are concrete and runnable (§22 Pattern 2)
The shell function bodies (`check_export_used`, `check_api_consumed`, `check_auth_protection`) give the model exact commands, not qualitative hints. Each function echoes labeled status strings (`CONNECTED`, `ORPHANED`, `IMPORTED_NOT_USED`), which prevents model-invented label variance. This follows §22 Pattern 2's rule to pair abstract instructions with calibrating examples.

### S5 — Critical rules section converts failure modes into positive tests (§5 Action 1, §14)
"Be specific about breaks" is supported by a concrete positive example: "Dashboard.tsx line 45 fetches /api/users but doesn't await response". This follows §5's instruction-framing guidance. The `<critical_rules>` block is brief and non-redundant.

### S6 — `<success_criteria>` provides a completeness checklist (§1 Action 3)
The checkbox list enumerates every expected output type. This maps to §1's quality-bar concept and gives the model a self-audit mechanism before emitting its report.

---

## Weaknesses

### W1 — Persona is too generic (§6 Action 2, §6 Role-domain mapping)
The agent opens with:

> "You are an integration checker. You verify that phases work together as a system, not just individually."

The guide (§6 Action 2) states: "Generic expert framing produces no measurable accuracy gain. A persona must constrain register, voice, or domain-specific style to be effective." The current framing is a capability description, not a persona. The guide's role-domain mapping table (§6) contrasts "Tester" (ineffective) with "Verification specialist. Your job is to try to break it." (effective). This agent's persona is closer to the ineffective column.

The `<role>` tag is also non-standard. The guide's tag vocabulary (§4) specifies `<persona>` as the correct tag for role/voice/identity content.

### W2 — No reframe pattern applied despite adversarial intent (§6 Reframe pattern)
The agent's purpose is adversarial by nature — it must detect broken connections rather than confirm correct ones. The guide's reframe pattern (§6) prescribes: "Your job is NOT X — it's Y" to displace the model's default confirmatory assumption. The agent hints at this mindset ("Individual phases can pass while the system fails") but never makes it explicit as a persona constraint. A model without this explicit reframe will default to looking for evidence of correctness rather than probing for failure.

### W3 — `<role>` tag is non-standard; XML tag vocabulary is inconsistently applied (§4 Action 2, §4 XML tag vocabulary)
The agent uses `<role>`, `<inputs>`, `<verification_process>`, `<output>`, `<critical_rules>`, and `<success_criteria>`. Of these, only `<output>` is close to a guide-defined tag (`<output_format>`). The guide §4 defines a shared tag vocabulary (`<persona>`, `<task>`, `<context>`, `<input>`, `<output_format>`, `<constraints>`, `<quality_bar>`). Non-standard tags reduce interoperability and lose the semantic signal that the guide says named tags provide.

Specifically:
- `<role>` should be `<persona>`
- `<inputs>` should be `<context>` or `<input>`
- `<critical_rules>` should be `<constraints>`
- `<success_criteria>` should be `<quality_bar>`
- `<output>` should be `<output_format>`

### W4 — No frontmatter `agentMetadata` block (§11 YAML frontmatter, §17 Subagent configuration)
The file has a partial YAML frontmatter (`name`, `description`, `tools`, `color`) but is missing the `agentMetadata` block. The guide §11 and §17 specify that agent prompt files must encode `agentType`, `permissionMode`, `disallowedTools`, `whenToUse`, and `criticalSystemReminder` in frontmatter. Without `disallowedTools`, the agent can call any tool including destructive ones (Write, Edit). Without `whenToUse`, the orchestrating model has only the `description` line to decide when to invoke this agent — insufficient for a specialized checker.

### W5 — Output format is markdown-only with no machine-parseable verdict (§7 Machine-parsed output)
The report returned to the milestone auditor is free-form markdown. The guide §7 specifies that when output is machine-parsed, it must end with an exact verdict line:

> "VERDICT: PASS / FAIL / PARTIAL — Use the literal string `VERDICT: ` followed by exactly one of `PASS`, `FAIL`, or `PARTIAL`. Output it as plain text: no markdown bold, no punctuation, no wording variation."

This agent's report is aggregated by a milestone auditor. Without a machine-parseable verdict, the auditor must interpret prose, leading to inconsistent downstream behavior. The `<output>` block specifies counts (`{N}`) but no verdictable summary.

### W6 — Negative instructions present; not converted to positive equivalents (§5 Action 1)
The prompt contains several negative instructions used as primary directives:

> "Do NOT load full `AGENTS.md` files (100KB+ context cost)"
> "**Check connections, not existence.**"

The guide §5 Action 1 requires converting "do not" / "avoid" forms to positive specifications:

- "Do NOT load full `AGENTS.md` files" → "Load only `SKILL.md` index files and targeted `rules/*.md` files."
- "Check connections, not existence" is already a positive framing but the surrounding `<critical_rules>` block contains directive-style imperatives that mix positive and imperative forms inconsistently.

### W7 — No explicit priority ordering when checks conflict (§5 Priority ordering)
The agent runs six sequential checks, but there is no `<priority_order>` block defining behavior when findings conflict — for example, when an export is orphaned but auth protection is also missing. The guide §5 prescribes explicit priority ordering when multiple criteria apply. Without it, the model will weight findings by its own priors.

### W8 — No tie-breaking rule for ambiguous wiring (§5 Tie-breaking, §22 Pattern 4)
The `check_export_used` function can return `IMPORTED_NOT_USED`. The prompt does not specify what to report in this case: is it an orphan? a partial connection? a warning? The guide §22 Pattern 4 and §5 (Tie-breaking) require an explicit rule that reflects the domain's cost asymmetry. For an integration checker, false negatives (missing a broken connection) are more costly than false positives — the tie-breaking rule should lean toward flagging as ORPHANED or PARTIAL.

### W9 — Context budget instruction is prose, not a structured constraint (§4, §14)
The "Context budget" block is placed as prose before `<core_principle>` and uses bold text rather than an XML constraint tag. Per §4 and §14, behavioral rules and permission boundaries belong in `<constraints>`. Prose placement in an ambiguous position between the header and the core principle reduces its salience — the model may treat it as advisory rather than mandatory.

### W10 — No few-shot examples for report output (§3, §22 Pattern 2)
The output skeleton uses placeholder tokens (`{N}`, `{List each with from/reason}`) but no filled-in example of a complete, correctly-formatted report. The guide §22 Pattern 3 states: "A fully specified format produces consistent, parseable output. An implicit format produces structure that varies per call." The YAML templates in Step 6 partially satisfy this, but the final markdown report block (`## Integration Check Complete`) has no concrete example, only template tokens.

---

## Concrete Improvements

### Improvement 1: Replace `<role>` with a specific `<persona>` using the reframe pattern

**Current:**
```
<role>
You are an integration checker. You verify that phases work together as a system, not just individually.
```

**Rewrite:**
```xml
<persona>
You are a cross-phase integration specialist. Your job is not to confirm that phases are complete — it is to find where they fail to connect.

Your strengths:
- Tracing data flows from producer to consumer across phase boundaries
- Detecting orphaned exports, uncalled APIs, and missing auth checks
- Distinguishing "code exists" from "code is wired and used"
- Producing structured, auditor-ready integration reports
</persona>
```

This applies §6 reframe pattern, §6 strengths listing, and §6 role-domain specificity.

### Improvement 2: Add `agentMetadata` to frontmatter

```yaml
---
name: gsd-integration-checker
description: Verifies cross-phase integration and E2E flows. Checks that phases connect properly and user workflows complete end-to-end.
tools: Read, Bash, Grep, Glob
color: blue
agentMetadata:
  agentType: IntegrationChecker
  permissionMode: dontAsk
  disallowedTools:
    - Write
    - Edit
    - NotebookEdit
    - Agent
  whenToUse: >
    Use after milestone phases are complete to verify that exports are imported,
    APIs have callers, auth protection is present on sensitive routes, and E2E
    user flows complete without breaks. Called by the milestone auditor.
  criticalSystemReminder: 'CRITICAL: READ-ONLY verification. Do not create or modify files.'
---
```

This satisfies §11 and §17 requirements for self-contained agent configuration.

### Improvement 3: Add a machine-parseable verdict to `<output_format>`

Append to the `<output>` block:

```xml
<output_format>
...existing report structure...

End your response with a verdict line in exactly this format — it is parsed by the milestone auditor:

VERDICT: PASS
or
VERDICT: FAIL
or
VERDICT: PARTIAL

Use the literal string `VERDICT: ` followed by exactly one of `PASS`, `FAIL`, or `PARTIAL`.
- PASS: all exports connected, all APIs consumed, all sensitive routes auth-protected, all E2E flows complete
- PARTIAL: some orphaned exports or broken flows but no critical auth failures
- FAIL: any unprotected sensitive route OR any broken critical E2E flow

Output it as plain text: no markdown bold, no punctuation after the verdict word.
</output_format>
```

### Improvement 4: Convert negative instructions and add tie-breaking

**Convert negative to positive (§5 Action 1):**

| Current (negative) | Rewrite (positive) |
|---|---|
| "Do NOT load full `AGENTS.md` files" | "Load only `SKILL.md` index files (~130 lines) and the specific `rules/*.md` files each check requires." |
| "not just individually" | "Focus on cross-boundary connections: what one phase exports and another phase consumes." |

**Add tie-breaking rule (§5 Tie-breaking):**
```xml
<constraints>
  <tie_breaking>
    When a connection's status is ambiguous (e.g., an export is imported but usage cannot be
    confirmed by grep), report it as PARTIAL and flag it for human review. Missing a broken
    connection is more costly than a false positive — err toward flagging.
  </tie_breaking>
</constraints>
```

### Improvement 5: Replace `<critical_rules>` and `<success_criteria>` with standard tags

```xml
<constraints>
  <permitted>
    Read any file in the repository. Run read-only shell commands (grep, find, bash functions defined in this prompt).
  </permitted>
  <reserved_for_human_review>
    Any file creation, modification, or deletion.
  </reserved_for_human_review>
  <priority_order>
    1. Unprotected auth on sensitive routes (highest severity — report as FAIL)
    2. Broken E2E flows (report as FAIL if critical path)
    3. Missing expected cross-phase connections (report as PARTIAL)
    4. Orphaned exports with no callers (informational)
  </priority_order>
</constraints>

<quality_bar>
  - Every finding is specific: file path, line indicator, and exact break point
  - All six verification steps are completed before the report is emitted
  - Requirements Integration Map covers every REQ-ID in scope
  - Report ends with a machine-parseable VERDICT line
</quality_bar>
```

### Improvement 6: Add a filled example to the report output

Add one concrete, filled-in example report instance (even abbreviated) under the `<output_format>` block, following §22 Pattern 3. Replace `{N}` tokens with real-looking values so the model can calibrate against a reference rather than inferring structure from template placeholders alone.

---

## Overall Score: 6 / 10

**Justification:**

The agent earns its score in the mid-range for several reasons. On the positive side, it has a clear domain focus, concrete bash functions with labeled status outputs, a phase-structured verification process, and consistent output templates — these reflect genuine prompt engineering discipline. The YAML wiring/flow templates and the Requirements Integration Map table are production-quality output specifications.

However, four structural weaknesses pull the score down significantly:

1. The persona is generic and misses the adversarial reframe that the guide explicitly prescribes for verification agents (§6).
2. The frontmatter lacks `agentMetadata`, leaving tool permissions unbounded and trigger conditions under-specified for the orchestrating model (§17).
3. The output has no machine-parseable verdict, making it difficult for the calling milestone auditor to act on the result programmatically (§7).
4. Non-standard XML tag names are used throughout, reducing semantic clarity and interoperability with the shared tag vocabulary (§4).

Fixing weaknesses W1 (persona), W4 (frontmatter), W5 (verdict), and W3 (tag vocabulary) would bring the score to approximately 8/10. The underlying verification logic is sound; the prompt engineering scaffolding around it needs alignment with the guide.
