# Critique: next.md

## Summary

`next.md` is a competent, well-structured workflow prompt with a clear purpose: detect project state and route to the correct GSD command. Its XML-phase structure, explicit routing rules, hard-stop gates, and per-branch instructions represent solid multi-phase workflow design. However, the prompt relies heavily on prose-style instructions where the guide demands structured XML tags, leaves key behavioral boundaries underspecified (no `<constraints>` block, no output format spec, no persona), and contains several negative-instruction phrasings that should be converted to positive equivalents. It would benefit significantly from tighter structural conformance to the guide's architectural patterns.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase pattern applied correctly.** The workflow uses `<step name="...">` tags to create named, discrete stages (`detect_state`, `safety_gates`, `determine_next_action`, `show_and_execute`). Each step completes before the next begins.
- **Section 15 (Decision Frameworks) — Explicit routing tree.** Route 1–8 in `determine_next_action` form a clear, exhaustive decision tree covering all known state conditions. Each branch has a single unambiguous recommendation.
- **Section 16 — Scenario-based branching.** The three-option gate (Stop / Continue-and-defer / Force) in the prior-phase completeness scan maps directly to the guide's `<scenarios>` pattern, with default behavior made explicit (`Choice [S]`).
- **Section 5 (Instruction Framing) — Conditional instructions used.** The `--force` flag behavior is handled with explicit conditional logic ("If `--force` flag was passed, skip all gates…"), consistent with Section 5's conditional-branching guidance.
- **Section 14 (Constraint Enforcement) — Hard-stop gates are enumerated.** The three named gates (unresolved checkpoint, error state, unchecked verification) function as an exclusion list — the workflow halts on first hit. This mirrors the guide's hard exclusion pattern.
- **Section 22, Pattern 3 — Output format shown by example.** The `show_and_execute` step provides a concrete markdown template for the output block, grounding the abstract format requirement.
- **Section 1, Action 1 — Task components extractable.** The `<purpose>` tag makes the output (next GSD command), the why (zero-friction advancement), and the quality bar (correct routing, immediate invocation) legible, even though they are stated in prose rather than the guide's structured XML.

---

## Issues

### Issue 1 — No `<constraints>` block; permissions and exclusions are implicit
**Principle:** Section 14 (Constraint Enforcement) — "Pair every restriction with what IS permitted, stated equally concretely."
**What's missing:** The workflow has behavioral limits (e.g., "do not route" on gate hits, "do not ask for confirmation" in `show_and_execute`) but no formal `<constraints>` block enumerating what the agent may and may not do. There is no `<permitted>` / `<reserved_for_human_review>` pair. The `--force` override is a privilege-escalation path with no stated authorization scope.
**Fix:** Add a top-level `<constraints>` block:
```xml
<constraints>
  <permitted>
    - Read .planning/STATE.md, ROADMAP.md, and any phase directory files
    - Run read-only shell commands: gsd-sdk query, grep, find, ls, git log
    - Write to ROADMAP.md only when user selects "Continue and defer" (C)
    - Invoke one SlashCommand per execution
  </permitted>
  <reserved_for_human_review>
    - Creating, modifying, or deleting phase files
    - Committing to git (except the single deferral commit when user chooses C)
  </reserved_for_human_review>
  <requires_authorization>
    - --force flag must be explicitly passed by the user; the agent must never self-apply it
  </requires_authorization>
</constraints>
```

### Issue 2 — No `<output_format>` specification
**Principle:** Section 7 (Output Format Handling) — "Structured output tasks use a two-step reasoning-then-format approach"; Section 22, Pattern 3 — "Output format specified completely and upfront."
**What's missing:** The only output specification is the inline markdown template in `show_and_execute`, which is buried at the end of the process section. There is no top-level `<output_format>` tag, no field-level description, and no machine-parseable terminal token to confirm the invocation succeeded.
**Fix:** Add an `<output_format>` section after `<process>`:
```xml
<output_format>
Present the status block before invoking the routed command. Format exactly:

## GSD Next

**Current:** Phase [N] — [name] | [progress]%
**Status:** [one-line status description]

▶ **Next step:** `/gsd-[command] [args]`
  [One sentence explaining why this is the next step]

Then invoke the command via SlashCommand with no additional prose.
Do not repeat the status block after the invocation.
</output_format>
```

### Issue 3 — Negative instructions not converted to positive equivalents
**Principle:** Section 5, Action 1 (Instruction Framing) — "Convert negative instructions to positive equivalents. Before emitting any prompt, scan for negated instructions. Rewrite each as a positive specification."
**What's missing / wrong:** The workflow contains at least two negative-primary directives:
- `show_and_execute`: "Do not ask for confirmation — the whole point of `/gsd-next` is zero-friction advancement."
- `spike_sketch_notice`: "If both are 0, skip this notice entirely."
These are valid intent but use the negative form as the primary directive.
**Fix:**
- "Do not ask for confirmation" → "Invoke the determined command immediately after displaying the status block."
- "skip this notice entirely" → "Display the spike/sketch notice only when at least one count exceeds zero."

### Issue 4 — No persona defined despite agentic orchestration role
**Principle:** Section 6, Action 2 (Persona Assignment) — "Make personas specific, not generic." Section 22, Pattern 1 — "Role identity scoped to the exact domain."
**What's missing:** `next.md` orchestrates routing decisions across a complex multi-phase system. No `<persona>` block is present. The guide notes that a specific persona "constrains the register, priorities, and decision-making style of every response." An orchestrator that silently routes without a role identity defaults to generic assistant behavior.
**Fix:** Add a specific persona:
```xml
<persona>
You are a GSD workflow router. Your sole job is to read project state accurately and
advance the user to the correct next command — nothing more. You do not plan, execute,
or verify work. You detect, decide, and delegate.
</persona>
```
This also serves as an implicit reframe (Section 6, the reframe pattern): it explicitly narrows the agent away from taking autonomous action.

### Issue 5 — Prior-phase scan logic embedded in prose, not structured as scenarios
**Principle:** Section 16 (Multi-Phase Workflows) — "Handle multiple scenarios explicitly rather than leaving the model to infer." The guide prescribes `<scenarios>` / `<scenario condition="...">` tags.
**What's missing:** The three-option user choice (S / C / F) in the prior-phase completeness scan is described in prose paragraphs with bold markdown. This is high-stakes branching — each path has different side effects (exit, write+commit, or silent continue). Prose branching is fragile; the model must parse intent rather than follow structure.
**Fix:** Replace the prose with a `<scenarios>` block:
```xml
<scenarios>
  <scenario id="1" condition="user_chooses_stop_or_default">
    Exit without routing. Do not invoke any command.
  </scenario>
  <scenario id="2" condition="user_chooses_continue_defer">
    1. Create backlog entries in ROADMAP.md under ## Backlog using 999.x numbering.
    2. Run: gsd-sdk query commit "docs: defer incomplete Phase {src} items to backlog"
    3. Proceed immediately to determine_next_action.
  </scenario>
  <scenario id="3" condition="user_chooses_force">
    Proceed to determine_next_action without recording any deferral.
  </scenario>
</scenarios>
```

### Issue 6 — `<required_reading>` instruction is vague and circular
**Principle:** Section 10, Action 1 (Prompt Length and Compression) — "Remove redundant instructions and boilerplate"; Section 1, Action 3 — "Audit constraints for consistency."
**What's missing / wrong:** The `<required_reading>` block states: "Read all files referenced by the invoking prompt's execution_context before starting." This is circular — it depends on a context (`execution_context`) that is not defined anywhere in the file, and it provides no actionable list of files. It adds length without contributing task signal.
**Fix:** Either remove it and rely on `detect_state` (which already lists the files to read), or replace it with a concrete list:
```xml
<required_reading>
Before starting, read:
- .planning/STATE.md
- .planning/ROADMAP.md
- .planning/.continue-here.md (if it exists)
</required_reading>
```

### Issue 7 — No explicit tie-breaking rule for ambiguous routing states
**Principle:** Section 5 (Instruction Framing) — "Add explicit tie-breaking when the model might be uncertain. Tie-breaking rules must match the domain's cost asymmetry."
**What's missing:** Routes 1–8 may overlap in edge cases (e.g., a phase has CONTEXT.md, RESEARCH.md, and partially executed plans). The domain's cost asymmetry is clear: false advancement (routing too far forward) is more dangerous than false caution (prompting a discuss step unnecessarily). No tie-breaking instruction encodes this.
**Fix:** Add a tie-breaking rule after the routing table:
```xml
<tie_breaking>
When multiple routes could apply simultaneously, choose the earliest-matching route.
Err toward more context-gathering (discuss) over advancement (execute/complete).
A spurious discuss step costs one interaction; a missed gate can skip verification entirely.
</tie_breaking>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide, applied to `next.md` as a workflow/agent prompt.

**Task Specification**
- [ ] FAIL — Intent and quality bar are present in `<purpose>` but audience is not explicitly encoded (Section 1, Action 2)
- [ ] PASS — Constraints are internally consistent (no detected conflicts between scope, length, or depth)

**Chain-of-Thought**
- [ ] N/A — No CoT trigger needed; task is routing logic, not symbolic reasoning
- [ ] N/A — CoT traces not applicable

**Few-Shot Examples**
- [ ] N/A — No few-shot examples present or required for this routing workflow

**Formatting**
- [ ] FAIL — Prompt sections are not separated by semantically named XML tags at the top level (uses `<step name="...">` but lacks `<task>`, `<constraints>`, `<output_format>`, `<persona>` top-level tags; Section 4, Action 2)
- [ ] PASS — Instructions are complete and clear before formatting is applied
- [ ] N/A — Format variant testing (Section 4, Action 3) is a build-time concern

**Instruction Framing**
- [ ] FAIL — Negative instructions present and not converted ("Do not ask for confirmation"; Section 5, Action 1)
- [ ] FAIL — No explicit priority order when multiple routing rules could overlap (Section 5)
- [ ] FAIL — No tie-breaking rule matched to domain cost asymmetry (Section 5)

**Persona**
- [ ] FAIL — No persona defined despite orchestration role (Section 6, Action 1–2)
- [ ] N/A — Gender-neutral descriptor: N/A (no persona)

**Output Format**
- [ ] FAIL — No top-level `<output_format>` block (Section 7; Section 22, Pattern 3)
- [ ] N/A — No structured JSON output required
- [ ] N/A — Constrained decoding not applicable

**Context Placement**
- [ ] PASS — `<purpose>` leads the prompt; task instruction is at the start
- [ ] PASS — Primary input (state detection) is initiated early in `<process>`
- [ ] PASS — Background context (gate logic) is in the middle
- [ ] PASS — No obviously irrelevant context present

**Self-Consistency**
- [ ] N/A — Task does not have a single verifiable correct answer requiring sampling

**Prompt Length**
- [ ] FAIL — `<required_reading>` is circular boilerplate that adds length without value (Section 10, Action 1)
- [ ] PASS — No redundant repeated instructions detected
- [ ] N/A — No RAG context

**System / User Split**
- [ ] N/A — Workflow file is a slash-command prompt, not a split system/user prompt
- [ ] PASS — Instructions appear once each; no detected duplication

**Agent / Subagent**
- [ ] PASS — Prompt is self-contained (reads its own state files)
- [ ] N/A — No file paths emitted in agent output
- [ ] N/A — No parallel agent spawning
- [ ] N/A — No adversarial verification probes required

**Structural Architecture**
- [ ] FAIL — Top-level structure does not use the guide's standard XML tag vocabulary (`<task>`, `<constraints>`, `<output_format>`, `<persona>`; Section 4, Action 2 and XML vocabulary table)
- [ ] PASS — No template variables used (none required for this workflow)

**Constraint Enforcement**
- [ ] FAIL — No `<permitted>` / `<reserved_for_human_review>` pair (Section 14)
- [ ] PASS — Hard-stop gates function as enumerated exclusions
- [ ] PASS — Edge cases (gate bypass via --force, default choice S) are specified
- [ ] N/A — No confidence thresholds required

**Decision Frameworks**
- [ ] PASS — Route 1–8 form an explicit decision tree (Section 15)
- [ ] N/A — No complex tiered recommendations requiring a comparison table
- [ ] FAIL — Reversibility framework not applied to the deferral commit action (Section 15)

**Multi-Phase Workflows**
- [ ] PASS — Complex task organized into explicit named steps (Section 16)
- [ ] FAIL — Required vs. optional steps not distinguished; all steps are implicitly mandatory (Section 16)
- [ ] FAIL — Three-option branching in prior-phase scan is in prose, not `<scenarios>` tags (Section 16)

**Memory and Continuity**
- [ ] N/A — No memory templates or compaction summaries required

**Modularity**
- [ ] PASS — Workflow has a single clear responsibility (route to next step)
- [ ] FAIL — No `<scope>` block stating explicit inclusions and exclusions (Section 19)

**Safety and Trust**
- [ ] PASS — --force bypass requires explicit user action; agent cannot self-apply it
- [ ] PASS — Authorization is narrow-scoped (each gate must independently pass)

**Tone and Style**
- [ ] FAIL — Negative instructions not rewritten to imperative positive equivalents (Section 21 / Section 5)
- [ ] PASS — Instructions use imperative present tense throughout
- [ ] N/A — No working notes requiring `<analysis>` tags

**Optimization**
- [ ] FAIL — Prompt is not flagged as a draft for automated optimization (Section 12, Action 1)
- [ ] N/A — Optimizer selection not applicable at this stage

---

## Recommendations

Prioritized from highest to lowest impact on prompt reliability and conformance:

**1. Add `<constraints>` with explicit permission pairs (Issue 1 — Section 14)**
This is the highest-risk gap. The workflow can write to ROADMAP.md, commit to git, and invoke arbitrary slash commands, but no permission boundary is stated. Add a `<permitted>` / `<reserved_for_human_review>` block immediately. This also makes the `--force` privilege path auditable.

**2. Add a top-level `<output_format>` block (Issue 2 — Section 7, Section 22 Pattern 3)**
The inline template in `show_and_execute` is the only format spec and it's buried. Elevating it to a dedicated `<output_format>` section makes the contract explicit and upfront, consistent with the guide's requirement that format be specified before the task runs.

**3. Convert negative instructions to positive equivalents (Issue 3 — Section 5, Action 1)**
Two negative-primary directives exist. These are fast, mechanical fixes: "Do not ask for confirmation" → "Invoke the determined command immediately after displaying the status block." Apply the Section 5 conversion table across the full file.

**4. Add a specific `<persona>` block (Issue 4 — Section 6, Actions 1–2)**
The orchestration role needs an explicit identity that narrows the agent away from planning/executing work. A four-line persona (see Issue 4 fix) prevents the model from drifting into autonomous action on ambiguous states.

**5. Replace prose branching in prior-phase scan with `<scenarios>` tags (Issue 5 — Section 16)**
The three-option user-choice block (S / C / F) is the most complex branch in the entire workflow and is currently the least structured. Converting it to `<scenarios>` blocks removes ambiguity about which side effects fire on each path, particularly the write-then-commit path that modifies ROADMAP.md.
