# Prompt Critique: `gsd:complete-milestone`

**File reviewed:** `commands/gsd/complete-milestone.md`
**Guide version:** PROMPT_ENGINEERING_GUIDE_V09.md
**Date:** 2026-04-30
**Overall verdict:** Adequate

---

## Strengths

### Multi-phase workflow is explicitly structured (§16 Multi-Phase Workflows)

The `<process>` block defines eight numbered phases with named steps and gate conditions. This matches the guide's `<phase>` pattern — cognitive boundaries between stages, explicit readiness checks before advancing, and a gated approval loop (`Wait for confirmation`). The pre-flight check (step 0) that branches on audit status is a strong implementation of scenario-based branching (§16 Scenario-Based Branching).

### Success criteria are enumerated and verifiable (§1 Task Specification)

The `<success_criteria>` block gives a checklist of seven concrete, binary outcomes rather than qualitative descriptions. Each item is testable at execution time. This satisfies §1 Action 1 — the output, why it matters, and what correct looks like are all present.

### Critical rules are isolated and named (§14 Constraint Enforcement)

The `<critical_rules>` block separates behavioral constraints from the process steps. Rules like "Archive before deleting" and "Verify completion" are stated positively and cover specific failure modes. This is directionally correct per §14's guidance on explicit permission-pair and constraint enumeration.

### Workflow delegation is declared upfront (§8 Context Placement)

The `<execution_context>` block appears immediately after `<objective>` and instructs file loading before execution. This respects the guide's high-attention leading position for critical instructions (§8 Action 1).

---

## Weaknesses

### 1. Negative instructions are used as primary directives — violates §5 Action 1

The `<critical_rules>` block contains a rule stated in the negative form as a passive assertion: "Load workflow first" is positive, but several instructions throughout the prompt use negative framing. More critically, the pre-flight check block uses `{If no v{{version}}-MILESTONE-AUDIT.md:}` conditional rendering embedded in a markdown code fence with emoji and prose — not the structured conditional syntax from §5. There is no formal `<priority_order>` block stating what to do when signals conflict (e.g., audit has gaps but user wants to proceed anyway). The guide (§5 Priority Ordering) requires an explicit `<priority_order>` when multiple criteria apply.

The gap check says: "recommend `/gsd-plan-milestone-gaps` first" and "or proceed anyway to accept as tech debt" — two contradictory paths with no tie-breaking rule. The guide (§5 Tie-Breaking Instructions) requires an explicit rule matched to the domain's cost asymmetry. Archiving a milestone prematurely is a high-cost, hard-to-reverse error — the tie-breaker should be precision-biased (block by default, not let through).

### 2. No XML tag vocabulary — uses inconsistent custom tags (§4 Formatting and Structure)

The prompt introduces `<objective>`, `<execution_context>`, `<process>`, `<success_criteria>`, and `<critical_rules>` tags. None of these appear in the guide's canonical tag vocabulary (§4 XML Tag Vocabulary). The guide specifies `<task>`, `<context>`, `<output_format>`, `<constraints>`, and `<quality_bar>` as the standardized top-level structural tags. Using non-standard tags breaks interoperability with other composed prompt modules (§19 Modularity and Composition). Specifically:

- `<objective>` should be split into `<task>` (what to do) and `<quality_bar>` (what correct looks like).
- `<critical_rules>` should be `<constraints>` with child `<reserved_for_human_review>` and `<confirm_with_user>` sub-tags where applicable.
- `<execution_context>` is not in the vocabulary at all — the referenced workflow file should be inlined or its content injected via template variable, not deferred to a load-on-demand pattern that creates an unresolved dependency at runtime.

### 3. No output format specification — violates §7 Output Format Handling and §22 Pattern 3

The prompt instructs the model to "Present milestone scope and stats", "Present summary, confirm", "Present for approval" — but never specifies the format of these presentations. There is no `<output_format>` block. Per §22 Pattern 3, the output structure must be specified completely and upfront. Per §7, when multi-step structured output is required, each step's format should be declared.

The consequence is that the model will invent its own format for the milestone stats summary, the accomplishment list, and the pre-flight check output on every invocation. This produces inconsistent outputs across runs and makes the workflow unpredictable.

---

## Specific Rewrites

### Rewrite 1: Add tie-breaking rule for the audit-gap path (fixes Weakness 1)

Replace the ambiguous "or proceed anyway to accept as tech debt" branch with a structured conditional and an explicit tie-breaker:

**Current (step 0):**
```markdown
- If audit status is `gaps_found`: recommend `/gsd-plan-milestone-gaps` first
```

**Rewritten:**
```xml
<constraints>
  <priority_order>
    1. Audit passed → proceed to step 1
    2. Audit missing → block; instruct user to run /gsd-audit-milestone
    3. Audit has gaps → block by default; require explicit user override to proceed
  </priority_order>

  <tie_breaking>
    When audit has gaps and the user has not explicitly said "proceed anyway",
    BLOCK completion. Premature archiving is irreversible — under-inclusion
    (blocking) is the correct failure mode here. Prompt:
    "Audit found gaps. Proceed anyway and accept as tech debt? (yes/no)"
    Await explicit confirmation before continuing.
  </tie_breaking>
</constraints>
```

This applies §5's precision-biased tie-breaking (block unless certain) to an irreversible operation, and eliminates the ambiguous dual-path that currently leaves the model to infer which path to take.

---

### Rewrite 2: Add `<output_format>` block specifying milestone stats presentation (fixes Weakness 3)

Add a top-level `<output_format>` block before `<process>`. Define the mandatory structure for at least the two user-facing confirmation gates (steps 1 and 3), where inconsistency has the highest impact:

**Add after `<context>`:**
```xml
<output_format>
Present user-facing confirmation gates in this structure:

## Milestone v{{version}} — [Gate Name]

| Field | Value |
|-------|-------|
| Phases | N |
| Plans | N |
| Tasks | N |
| Git range | <sha>..<sha> |
| Files changed | N |
| Timeline | YYYY-MM-DD → YYYY-MM-DD |

**Key accomplishments (4–6 bullets):**
- [verb phrase, past tense, specific outcome]
- ...

**Proceed?** Type `yes` to continue or describe any changes needed.

Do not invent additional fields. Do not use prose summaries in place of this table.
</output_format>
```

This satisfies §22 Pattern 3 (format specified completely upfront) and §7 Action 2 (structured output format declared before execution begins).

---

### Rewrite 3: Replace non-standard tags with canonical vocabulary (fixes Weakness 2)

Replace the top-level tag structure throughout. The most impactful change is splitting `<objective>` into `<task>` + `<quality_bar>`, and replacing `<critical_rules>` with `<constraints>`:

**Current:**
```xml
<objective>
Mark milestone {{version}} complete, archive to milestones/, and update ROADMAP.md and REQUIREMENTS.md.

Purpose: Create historical record of shipped version...
Output: Milestone archived...
</objective>
```

**Rewritten:**
```xml
<task>
Mark milestone {{version}} complete: archive milestone artifacts to `.planning/milestones/`,
update ROADMAP.md to a one-line entry, evolve PROJECT.md, and create a git tag.
</task>

<quality_bar>
Completion is correct when: all phase SUMMARY.md files exist, archive files are created
before originals are modified, git tag v{{version}} is present, and the user has confirmed
at each gate. An incomplete run that archives before verifying readiness is a failure.
</quality_bar>
```

**Current:**
```xml
<critical_rules>
- **Load workflow first:** Read complete-milestone.md before executing
...
</critical_rules>
```

**Rewritten:**
```xml
<constraints>
  <reserved_for_human_review>
    - Deleting .planning/REQUIREMENTS.md
    - Creating the git tag v{{version}}
    - Pushing any tag to remote
  </reserved_for_human_review>

  <take_freely>
    - Reading any .planning/ file
    - Creating archive files in .planning/milestones/
  </take_freely>

  <confirm_with_user>
    Load complete-milestone.md workflow file before executing any step.
    Wait for explicit user confirmation at steps 1, 3, and 7 before proceeding.
    Archive files must exist on disk before modifying or deleting originals —
    verify with a file existence check before each destructive write.
  </confirm_with_user>
</constraints>
```

This uses the reversibility framework from §15 and canonical constraint sub-tags from §4, making the permission model auditable and interoperable with other modules.

---

## Overall Verdict: Adequate

The command has a clear structure and a working multi-phase workflow with audit gates. The process logic is sound and the success criteria are binary and testable. It falls short on three specific guide requirements: no canonical XML tag vocabulary (making it non-composable with other modules), no output format specification for user-facing gates (producing inconsistent presentation across runs), and no tie-breaking rule for the high-stakes audit-gap path (leaving an irreversible branching decision to model inference). All three are fixable with targeted rewrites that do not require structural redesign.
