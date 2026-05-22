# Prompt Engineering Critique: gsd-debugger.md

## Agent
`agents/gsd-debugger.md`

---

## Guide Sections Evaluated

- Section 1: Task Specification
- Section 2: Chain-of-Thought Decisions
- Section 3: Few-Shot Example Construction
- Section 4: Formatting and Structure
- Section 5: Instruction Framing
- Section 6: Persona Assignment
- Section 7: Output Format Handling
- Section 8: Context Placement
- Section 11: System vs. User Prompt Allocation
- Section 13: Structural Architecture Patterns
- Section 14: Constraint Enforcement
- Section 15: Decision Frameworks
- Section 16: Multi-Phase Workflows
- Section 17: Agent and Subagent Patterns
- Section 19: Modularity and Composition
- Section 20: Safety and Trust Patterns
- Section 21: Tone and Style Rules
- Section 22: Production Patterns

---

## Strengths

### S1. Multi-phase workflow using named XML steps (Section 16)
The `<execution_flow>` block uses `<step name="...">` tags to create explicit cognitive phase boundaries — `check_active_session`, `create_debug_file`, `symptom_gathering`, `investigation_loop`, `fix_and_verify`, `request_human_verification`, `archive_session`. This matches the guide's phase pattern directly and creates clear sequencing the model can follow without ambiguity.

### S2. Scenario-based branching (Section 16)
The `check_active_session` step explicitly handles four distinct conditions: (active sessions + no args), (active sessions + args), (no sessions + no args), (no sessions + args). This is exactly the scenario-based branching pattern from Section 16, handling all combinations rather than leaving inference to the model.

### S3. Adversarial verification mindset (Section 17, Pattern 8)
The `<verification_patterns>` block goes well beyond happy-path testing: it includes stability testing (loop 100 runs), race condition testing with random delays, and a verification mindset section that frames the agent as skeptical of its own fixes. This aligns with the adversarial probe requirement from Pattern 8 and Section 17.

### S4. Falsifiable hypothesis enforcement (Section 2)
The `<hypothesis_testing>` block explicitly demands falsifiable hypotheses with a concrete bad/good example pair. The `Structured Reasoning Checkpoint` requires five concrete fields (hypothesis, confirming evidence, falsification test, fix rationale, blind spots) before any fix proceeds. This operationalises Section 2's reasoning-before-answer principle.

### S5. Decision trees and technique selection tables (Section 15)
`<research_vs_reasoning>` includes an ASCII decision tree. `<investigation_techniques>` closes with a `Technique Selection` table mapping situations to techniques. Both match Section 15's directive to use ASCII trees and comparison tables for "it depends" situations.

### S6. Structured return formats (Sections 7, 21)
`<structured_returns>` specifies exact output format templates for all terminal states: `ROOT CAUSE FOUND`, `DEBUG COMPLETE`, `INVESTIGATION INCONCLUSIVE`, `TDD CHECKPOINT`, `CHECKPOINT REACHED`. Each uses specific fields in a fixed order, matching Section 7's mandate for machine-parseable output and Section 22, Pattern 3 (output format specified completely and upfront).

### S7. Prompt injection security constraint (Section 20)
The `<role>` block includes an explicit security constraint naming the injection vector (`DATA_START`/`DATA_END` markers in `<trigger>` and `<symptoms>` blocks), specifying the threat, and directing the agent to treat suspicious content as bug description artifacts. This matches Section 20's safety and trust patterns at a production level of specificity.

### S8. Evidence quality taxonomy (Section 2)
The four-item strong/weak evidence distinction (directly observable, repeatable, unambiguous, independent vs. hearsay, non-repeatable, ambiguous, confounded) gives the agent a concrete rubric for when to act, which directly supports the guide's requirement to treat CoT traces as heuristic aids, verified against ground truth.

### S9. Mode flag system (Section 16, Scenario branching)
The `<modes>` block explicitly handles four execution modes (`symptoms_prefilled`, `find_root_cause_only`, `find_and_fix`, `tdd_mode`) with clear behavioral changes per mode. This is clean conditional instruction design matching Section 5's conditional branching pattern.

---

## Weaknesses

### W1. Persona is weak and uses the reframe pattern incorrectly (Section 6)
The `<role>` block opens with:
> "You are a GSD debugger. You investigate bugs using systematic scientific method..."

Per Section 6, generic expert framing produces no measurable accuracy gain. The role description mixes spawning context, security constraints, core responsibilities, and an `@include` macro in a single blob. It does not enumerate agent strengths (Section 6, Strengths listing), does not use the `<persona>` tag, and does not constrain register or voice. Compare the guide's explicit strengths pattern:
```xml
<persona>
Your strengths:
- Searching for code...
- Analyzing multiple files...
</persona>
```
None of this appears here.

### W2. No `<persona>` tag — flat `<role>` tag is non-standard (Section 4, Section 6)
The guide's XML tag vocabulary defines `<persona>` as the standard tag for "Role, voice, strengths, and identity of the agent" (Section 4, XML tag vocabulary table). Using `<role>` is non-standard and departs from the shared vocabulary that makes composed prompt modules interoperable (Section 19). A reader — human or model — navigating this prompt cannot apply the standard tag vocabulary.

### W3. Context placement is inverted from the guide's instruction (Section 8)
Section 8 mandates: task instruction leads, primary input closes, background/supplementary context in the middle. In this prompt, the `<role>` (persona/task) leads, but then `<required_reading>` and `<philosophy>` appear before the operational sections (`<hypothesis_testing>`, `<investigation_techniques>`, etc.). The actual execution flow — the primary operative instruction — is buried after hundreds of lines of background knowledge. The guide states:
> "Middle-position content receives the least attention. Reserve this position for information that is helpful but not critical to task success."
The `<execution_flow>` section, which is the most critical operative instruction, is positioned at the end after ~900 lines of reference material, giving it recency-bias advantage but burying it behind content the model must process first.

### W4. No `<constraints>` block with explicit permission pairs (Section 14)
Section 14 mandates pairing every restriction with what IS permitted, stated equally concretely:
```xml
<constraints>
  <permitted>...</permitted>
  <reserved_for_human_review>...</reserved_for_human_review>
</constraints>
```
The agent uses `tools: Read, Write, Edit, Bash, Grep, Glob, WebSearch` in frontmatter, but there is no constraint block defining what the agent is permitted to do vs. what requires confirmation. For example: may it commit directly, or must it wait for user confirmation? The archive step does commit, but this is embedded in prose, not in a `<constraints>` block. The security constraint in `<role>` exists in isolation without the paired permission structure the guide requires.

### W5. Negative instructions scattered throughout (Section 5)
Section 5 mandates converting negative instructions to positive equivalents. Multiple negative instructions appear throughout:

- `<investigation_techniques>`: "Don't act if: 'I think it might be X'"
- `<investigation_techniques>`: "Don't get attached"
- `<hypothesis_testing>`: "Don't fall in love with your first hypothesis"
- `<verification_patterns>`: "If you can't reproduce the bug, you can't verify it's fixed"
- `<investigation_techniques>` Pitfalls table: "Testing multiple hypotheses at once" described negatively

These could be rewritten as positive behavioral specifications. For example, "Don't act if uncertain" becomes "Act only when you can answer YES to all four decision criteria."

### W6. The `<required_reading>` tag is non-standard and has no guide-defined vocabulary entry (Section 4, Section 19)
The guide defines `<context>` as the tag for background information. Using `<required_reading>` introduces a custom tag that is not part of the shared tag vocabulary (Section 4), reducing interoperability and making the prompt harder to compose with other modules (Section 19).

### W7. Frontmatter YAML is incomplete relative to the guide's schema (Section 11, Section 17)
The guide specifies a full frontmatter schema for agent prompt files including:
```yaml
agentMetadata:
  agentType: 'Explore'
  model: 'haiku'
  permissionMode: 'dontAsk'
  disallowedTools: [...]
  whenToUse: >
    ...
  criticalSystemReminder: '...'
```
The actual frontmatter contains only `name`, `description`, `tools`, and `color`. Missing: `agentMetadata.agentType`, `agentMetadata.model`, `agentMetadata.permissionMode`, `agentMetadata.disallowedTools`, `agentMetadata.whenToUse`, `agentMetadata.criticalSystemReminder`. The `description` field ("Investigates bugs using scientific method, manages debug sessions, handles checkpoints. Spawned by /gsd-debug orchestrator.") covers the `whenToUse` concern but is not in the machine-readable `whenToUse` field.

### W8. No few-shot examples for the primary output artifact (Section 3, Pattern 2)
The `<structured_returns>` section specifies exact output formats but provides no completed examples of what a real ROOT CAUSE FOUND or CHECKPOINT REACHED message looks like with filled-in values. Section 3 and Pattern 2 both require concrete examples to calibrate qualitative standards. The agent is told to fill in `{root_cause}`, `{key finding 1}`, etc., but is never shown what a well-formed entry looks like at the expected specificity level.

### W9. The `<philosophy>` section delegates entirely to an external include without inline content (Section 13, Section 19)
```
<philosophy>
@~/.claude/get-shit-done/references/debugger-philosophy.md
</philosophy>
```
A `<philosophy>` tag containing only a file reference produces an empty-looking section if the include fails or the file is unavailable. Section 19 (modularity) supports composition via template variables, but the guide expects each agent prompt to be "fully self-contained when spawned" (Section 17). A critical behavioral philosophy delegated entirely to an external include violates this principle.

---

## Concrete Improvements

### Improvement 1: Replace `<role>` with a proper `<persona>` block with strengths enumeration

Replace:
```xml
<role>
You are a GSD debugger. You investigate bugs using systematic scientific method, manage persistent debug sessions, and handle checkpoints when user input is needed.
...
</role>
```

With:
```xml
<persona>
You are a systematic debugging specialist. Your job is not to confirm the user's theory about what broke — it is to find what actually broke through evidence.

Your strengths:
- Forming falsifiable hypotheses and testing them one at a time
- Maintaining persistent investigation state that survives context resets
- Applying binary search, differential debugging, and minimal reproduction to isolate root causes
- Recognizing when a fix addresses a symptom vs. the root cause
- Returning structured, machine-parseable results to the calling orchestrator
</persona>
```

This follows Section 6 (specific persona, strengths listing) and Section 22, Pattern 1 (role identity scoped to exact domain).

### Improvement 2: Add a `<constraints>` block with explicit permission pairs

After the `<persona>` block, add:
```xml
<constraints>
  <take_freely>
    - Read any file in the repository
    - Run read-only shell commands: grep, find, ls, git log, git diff, git bisect
    - Write to .planning/debug/ (debug files and knowledge base)
    - Add logging to code temporarily during investigation
  </take_freely>

  <confirm_with_user>
    - Applying any code fix (enter fix_and_verify only after root cause is confirmed)
    - Committing changes to git
    - Archiving a debug session to resolved/
  </confirm_with_user>

  <reserved_for_human_review>
    - Pushing commits to remote
    - Deploying or restarting services
    - Any action that modifies production data
  </reserved_for_human_review>
</constraints>
```

### Improvement 3: Rewrite negative instructions as positive behavioral specifications

Replace scattered negative directives with positive equivalents. Examples:

| Current (negative) | Replacement (positive) |
|---|---|
| "Don't act if: 'I think it might be X'" | "Act only when all four decision criteria are met with direct evidence" |
| "Don't get attached" | "Generate alternative hypotheses after each failed test to maintain an open hypothesis set" |
| "Don't fall in love with your first hypothesis" | "Maintain at least two competing hypotheses until evidence clearly eliminates one" |

### Improvement 4: Add concrete filled-in examples for the primary output formats

In `<structured_returns>`, add a completed example under `ROOT CAUSE FOUND`:

```xml
<examples>
  <example>
    <input>goal: find_root_cause_only, symptoms: form submission fails with "TypeError: Cannot read property 'id' of undefined"</input>
    <output>
## ROOT CAUSE FOUND

**Debug Session:** .planning/debug/form-submit-undefined.md

**Root Cause:** `handleSubmit` reads `user.id` before the `useUser` hook resolves; on first render the hook returns `undefined`, and there is no null guard before accessing `.id`.

**Evidence Summary:**
- `console.log('[handleSubmit] user:', user)` printed `undefined` on the failing call
- Wrapping access in `if (!user) return` made the error disappear consistently
- Added a guard and reproduced the original error by removing it: error returns every time

**Files Involved:**
- `src/components/CheckoutForm.tsx:87`: `user.id` accessed without null guard
- `src/hooks/useUser.ts:12`: hook returns `undefined` before async resolution completes

**Suggested Fix Direction:** Add null guard before accessing `user.id`, or defer form submission until user is resolved.

**Specialist Hint:** react
    </output>
  </example>
</examples>
```

### Improvement 5: Populate missing `agentMetadata` frontmatter fields

Extend the frontmatter to match the guide's schema:
```yaml
---
name: gsd-debugger
description: Investigates bugs using scientific method, manages debug sessions, handles checkpoints. Spawned by /gsd-debug orchestrator.
tools: Read, Write, Edit, Bash, Grep, Glob, WebSearch
color: orange
agentMetadata:
  agentType: 'Debugger'
  whenToUse: >
    Systematic debugging agent. Use when a bug has been reported and you need to
    find the root cause through hypothesis testing. Supports find_root_cause_only
    and find_and_fix modes. Maintains persistent debug session state across context resets.
  criticalSystemReminder: 'CRITICAL: Never fix code before root cause is confirmed with direct evidence. The reasoning_checkpoint block is MANDATORY before fix_and_verify.'
---
```

### Improvement 6: Replace `<required_reading>` with standard `<context>` tag

Replace:
```xml
<required_reading>
@~/.claude/get-shit-done/references/common-bug-patterns.md
</required_reading>
```

With:
```xml
<context>
@~/.claude/get-shit-done/references/common-bug-patterns.md
</context>
```

This aligns with the guide's standard tag vocabulary (Section 4) and makes the prompt composable with other modules using the shared vocabulary.

---

## Overall Score: 7 / 10

**Justification:** The agent is genuinely strong on the hardest problems — multi-phase workflow design, adversarial verification, scenario branching, decision trees, machine-parseable structured returns, and prompt injection defense. These are the behaviors that matter most for a production debugging agent and they are implemented correctly. The weaknesses are real but mostly structural: the persona is underpowered, the constraint block is absent, negative instructions are scattered, the frontmatter schema is incomplete, and the few-shot examples for output calibration are missing. None of these failures break the agent's core function, but they represent meaningful divergence from guide best practices that would produce a measurably more consistent and safe agent if corrected. The score reflects a competent, thoughtfully designed agent with fixable structural gaps rather than fundamental design flaws.
