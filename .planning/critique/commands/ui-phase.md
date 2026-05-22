# Critique: `commands/gsd/ui-phase.md`

Reviewed against: Prompt Engineering Guide V09
Date: 2026-04-30

---

## Strengths

### §14 Constraint Enforcement — Explicit permission pairs
The workflow file (which the command delegates to) uses `<permitted>` and `<reserved_for_human_review>` tags paired symmetrically. Every restriction has a concrete counterpart stating what IS allowed. This is a textbook application of the guide's "pair every restriction with what IS permitted" rule.

### §5 Instruction Framing — Priority ordering
The workflow's `<priority_order>` block ranks 5 conditions with an explicit cascade (config gate → phase validity → checker verdict → revision limit → state commit). This removes ambiguity when conditions conflict, exactly as §5 prescribes.

### §16 Multi-Phase Workflows — Named phases with gates
Steps 1–12 in the workflow are numbered, sequenced, and each has a discrete entry/exit condition. Revision loop tracking (`revision_count < 2`) and the escalation path at max iterations follow the guide's scenario-based branching pattern from §16.

### §11 System vs. User Prompt Allocation — YAML frontmatter
The command file uses YAML frontmatter to encode `name`, `description`, `argument-hint`, and `allowed-tools` — the persistent, identity-level properties of the agent. This matches §11's recommended pattern for encapsulating persistent properties in machine-readable frontmatter.

### §20 Safety and Trust — Reversibility-aware escalation
The workflow surfaces remaining issues to the user rather than silently force-approving after max revisions. This respects the irreversibility framework: decisions with lasting design impact require human confirmation (§15, §20).

---

## Weaknesses

### Issue 1 — §1 Task Specification: audience and quality bar absent from the command file itself

The command file (`commands/gsd/ui-phase.md`) contains no `<audience>` tag and no `<quality_bar>` tag at the command level. The `<objective>` tag names the output ("UI-SPEC.md") but does not state who will consume it, what domain knowledge they bring, or what makes a high-quality design contract. The guide's §1 Action 1 requires all three task components — what, why, and what a correct response looks like — to be explicit. The `<quality_bar>` that does exist lives in the workflow file, not in the command file the model reads first.

The `<objective>` block reads:
```
Create a UI design contract (UI-SPEC.md) for a frontend phase.
Orchestrates gsd-ui-researcher and gsd-ui-checker.
Flow: Validate → Research UI → Verify UI-SPEC → Done
```

This is an executive summary of steps, not a task specification. It names the output but not the audience (project planner consuming the spec downstream) and not the quality bar (what a complete, unambiguous spec looks like vs. a deficient one).

### Issue 2 — §4 Formatting and Structure: markdown prose in `<process>` instead of XML phase tags

The `<process>` block in the workflow file is written in numbered markdown (`## 1. Initialize`, `## 2. Parse and Validate Phase`, etc.). The guide's §16 specifies that multi-phase workflows should use `<phase id="N" name="…">` XML tags with explicit `trigger` attributes. Markdown headings give visual structure but not machine-parseable semantic boundaries. The guide states XML tags carry richer signal than delimiters alone because the tag name conveys meaning (§4 Action 2). A numbered markdown heading `## 3. Check Prerequisites` is equivalent to a `---` delimiter — it tells the model where one section ends, not what the section *is* or when it fires.

This matters for conditional triggers: step 7 (checker) is re-entered from step 9 (revision loop), but that re-entry path is expressed in prose ("After researcher returns, re-spawn checker (step 7)"). A `<phase id="7" trigger="after_researcher_return OR after_revision">` would make the re-entry condition structural rather than relying on a prose forward-reference.

### Issue 3 — §6 Persona Assignment: no persona on the orchestrator

The command file has no `<persona>` block, and the workflow file has none either. For a command that makes consequential decisions — choosing between update/view/skip on an existing spec, deciding when to escalate revision failures to the user, composing prompts for two subagents — persona omission is a missed opportunity.

The guide's §6 is clear that personas are appropriate when the task is "open-ended" or "requires a specific voice." Orchestrating design review is open-ended: the model must apply judgment about what constitutes a sufficient spec, when to surface blockers, and how to frame revision feedback. A specific, domain-constrained persona ("UI workflow coordinator — your job is to surface design ambiguities before implementation, not to make design decisions yourself") would bias behavior away from defaulting to generic assistant behavior during the inter-agent coordination steps.

The guide's reframe pattern (§6) is also unused: the orchestrator's implicit prior is to be helpful and complete the task. A reframe like "Your job is not to produce a passing spec as fast as possible — it's to ensure every open design question is resolved before plan-phase runs" would correct this default toward the actual goal.

---

## Specific Rewrites

### Rewrite 1 — Add `<audience>` and `<quality_bar>` to the command file

**Current (commands/gsd/ui-phase.md):**
```xml
<objective>
Create a UI design contract (UI-SPEC.md) for a frontend phase.
Orchestrates gsd-ui-researcher and gsd-ui-checker.
Flow: Validate → Research UI → Verify UI-SPEC → Done
</objective>
```

**Suggested replacement:**
```xml
<task>
Generate a UI design contract (UI-SPEC.md) for a frontend phase.
Orchestrate gsd-ui-researcher and gsd-ui-checker through a validate → research → verify loop.
</task>

<audience>
The downstream consumer is gsd-plan-phase. The plan-phase agent reads UI-SPEC.md to derive
task estimates and implementation constraints. Decisions left ambiguous in UI-SPEC become
ad-hoc styling choices during execution — treat every unresolved design question as a defect.
</audience>

<quality_bar>
A complete UI-SPEC.md answers all 6 checker dimensions with no BLOCKED flags.
Stack decisions (component library, spacing scale, typography) are locked with rationale.
Every decision either references a user-supplied preference or flags that a default was applied.
</quality_bar>
```

This satisfies §1 Action 1 (all three task components explicit) and §1 Action 2 (audience encoded with domain knowledge and assumptions).

---

### Rewrite 2 — Convert `<process>` steps to `<phase>` tags with explicit triggers

**Current (workflow, steps 5–9 excerpt):**
```markdown
## 5. Spawn gsd-ui-researcher
...
## 7. Spawn gsd-ui-checker
...
## 9. Revision Loop (Max 2 Iterations)
...
After researcher returns, re-spawn checker (step 7).
```

**Suggested replacement:**
```xml
<phase id="5" name="Spawn Researcher" trigger="after_prerequisite_checks">
  Build and dispatch gsd-ui-researcher prompt with all available context.
  Null file paths are omitted from <files_to_read>.
</phase>

<phase id="6" name="Handle Researcher Return" trigger="after_researcher_completes">
  If ## UI-SPEC COMPLETE: continue to phase 7.
  If ## UI-SPEC BLOCKED: display blocker details and exit.
</phase>

<phase id="7" name="Spawn Checker" trigger="after_researcher_return OR after_revision_researcher_return">
  Build and dispatch gsd-ui-checker prompt against current UI-SPEC.md.
</phase>

<phase id="8" name="Handle Checker Return" trigger="after_checker_completes">
  If ## UI-SPEC VERIFIED: proceed to phase 10.
  If ## ISSUES FOUND: proceed to phase 9.
</phase>

<phase id="9" name="Revision Loop" trigger="after_checker_blocks">
  <constraints>
    <take_freely>revision_count increments (max 2)</take_freely>
    <confirm_with_user>force-approve after revision_count >= 2</confirm_with_user>
  </constraints>
  If revision_count < 2: re-spawn researcher with revision context, then return to phase 7.
  If revision_count >= 2: surface remaining issues via AskUserQuestion with 3 options.
</phase>
```

This makes the re-entry path from phase 9 back to phase 7 explicit in the `trigger` attribute rather than a prose forward-reference. It also applies the reversibility constraint tags from §15 to the force-approve decision.

---

### Rewrite 3 — Add an orchestrator persona with the reframe pattern

**Current:** No persona anywhere in the command or workflow file.

**Suggested addition** (place before `<process>` in workflow file):
```xml
<persona>
You are a UI workflow coordinator for GSD. Your job is not to produce an approved
UI-SPEC as fast as possible — it is to ensure every open design question is resolved
with a concrete decision before plan-phase runs.

When a checker blocks, treat each blocking issue as a design ambiguity that will become
a developer judgment call during execution. Surface the ambiguity; do not route around it.
</persona>
```

This applies the reframe pattern (§6) to displace the model's default prior (complete the task quickly) with the correct goal (resolve design ambiguity before it propagates downstream). The strength enumeration pattern from §6 is intentionally omitted here — the orchestrator's job is coordination, not domain expertise, so enumerating "strengths" would broaden rather than narrow its identity.

---

## Overall Verdict

**Adequate.**

The command delegates almost all substance to the workflow file, which is well-structured at the process level: constraint pairs are explicit, priority ordering is present, phase sequencing is clear, and the revision loop has a defined limit and escalation path. These are non-trivial gets.

The command file itself, however, is thin to the point of being a stub — it names the output and points at the workflow but provides no audience, no quality bar, and no persona. For a command that orchestrates two agents and makes consequential design-gating decisions, the task specification (§1) is incomplete and the orchestrator has no identity anchor (§6). The structural weakness (markdown process steps instead of XML phase tags with explicit triggers) is a lower-priority issue but creates a real re-entry ambiguity in the revision loop.

Addressing issues 1 and 3 (task specification + persona) would move this to Strong. Issue 2 (phase tags) is a quality-of-life improvement that matters more at scale.
