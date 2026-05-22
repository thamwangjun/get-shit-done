# Critique: validate-phase.md

## Summary

`validate-phase.md` is a competently structured orchestration workflow with clear phase sequencing, explicit state branching, and concrete bash commands for each step. It handles the core task — auditing Nyquist validation gaps, spawning a specialized subagent, and writing or updating VALIDATION.md — in a coherent, step-by-step flow. However, the workflow falls short of the guide's standards in several areas: it lacks a formal `<task>`, `<persona>`, and `<output_format>` declaration using semantically named XML tags; the subagent prompt passed via `Task()` is assembled as an ad-hoc concatenated string rather than a structured XML document; constraint enforcement is present but informal (the single `<constraints>` string inside the Task call omits the `<permitted>` / `<reserved_for_human_review>` pairing required by Section 14); and the `<purpose>` block names what the workflow does but not the audience, quality bar, or success shape required by Section 1. The workflow is operationally functional but would benefit significantly from structural hardening against the guide's formatting, constraint, and task-specification rules.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Explicit named phases:** Steps 0–8 create clear cognitive boundaries, each with a single responsibility, mirroring the guide's `<phase id="N" name="...">` pattern even though formal XML phase tags are not used.

- **Section 16 — Scenario-based branching:** State A / B / C detection (Step 1) maps directly to the guide's `<scenarios>` / `<scenario condition="...">` pattern. Each branch has an unambiguous handling path.

- **Section 16 — Required vs. type-specific steps:** The success criteria checklist at the bottom distinguishes universal gates (Nyquist config check, State C exit) from conditional ones (auditor spawning, VALIDATION.md creation vs. update).

- **Section 14 — Concrete exclusions:** The `<constraints>` in the subagent call enumerate three specific prohibitions ("Never modify impl files. Max 3 debug iterations. Escalate impl bugs."), avoiding the qualitative descriptions the guide warns against.

- **Section 17 — Subagent routing with typed agent names:** `subagent_type="gsd-nyquist-auditor"` and the `<available_agent_types>` block enforce using exact subagent names, consistent with the guide's pattern for self-contained agent prompts.

- **Section 15 — Criteria checklist for completion gating:** The `<success_criteria>` block at the end functions as a completion checklist, giving the model a structured self-check before declaring done, aligning with the guide's criteria-before-action principle.

- **Section 16 — Round-based user gate:** Step 4's `AskUserQuestion` call with a numbered option set (Fix / Skip / Cancel) implements exactly the kind of structured interactive checkpoint the guide recommends before consequential actions.

- **Section 4 — Text mode fallback documented:** The inline documentation for `TEXT_MODE` handling shows awareness of runtime variation, which aligns with the guide's principle of handling multiple execution contexts explicitly rather than leaving the model to infer.

---

## Issues

### Issue 1: No formal task specification block
**Principle:** Section 1 (Task Specification), Actions 1–2; Section 4 (Formatting), Action 2.

**What is missing:** The `<purpose>` block names the output ("Audit Nyquist validation gaps... Generate missing tests. Update VALIDATION.md.") but does not state (a) why that output matters or how it will be used, (b) who the audience is (the orchestrating agent? the developer?), or (c) what a correct execution looks like beyond the checklist. The guide requires all three components to be explicit before the prompt is considered specified. The block also does not use the standard `<task>`, `<audience>`, `<quality_bar>` tag vocabulary from Section 4's XML tag table.

**Concrete fix:** Replace the `<purpose>` block with:

```xml
<task>
Audit Nyquist validation gaps for a completed phase. For each uncovered requirement,
generate missing tests using the gsd-nyquist-auditor subagent, then write or update
the phase VALIDATION.md to reflect current coverage status.
</task>

<audience>
An LLM orchestration agent executing a GSD workflow on behalf of a developer.
The developer will review the resulting VALIDATION.md and committed test files.
</audience>

<quality_bar>
Execution is complete when: all requirements are classified as COVERED, PARTIAL, or
MISSING; the user has confirmed the gap plan; VALIDATION.md is written or updated;
and test files are committed. A result with unresolved MISSING items that were not
explicitly moved to Manual-Only is incomplete.
</quality_bar>
```

---

### Issue 2: Subagent prompt constructed as an unstructured concatenated string
**Principle:** Section 4 (Formatting), Action 2; Section 17 (Agent and Subagent Patterns) — Self-contained agent prompts; Section 22, Pattern 3 (Output format specified completely and upfront).

**What is missing:** The `Task()` call in Step 5 constructs the subagent prompt by string concatenation: a hard-coded preamble, then `<files_to_read>`, `<gaps>`, `<test_infrastructure>`, and `<constraints>` tags — but without a wrapping `<task>` root, a `<goal>` / `<unit_task>` decomposition, or a `<persona>` to orient the auditor. The guide (Section 17) mandates that self-contained agent prompts include `<goal>`, `<unit_task>`, `<conventions>`, and `<worker_instructions>` so that the spawned agent has full operating context without inheriting any from the parent. The current structure is close but incomplete and non-standard.

**Concrete fix:** Restructure the Task prompt as a proper XML document matching the guide's Section 17 self-contained agent template:

```xml
<task>
  <goal>Audit Nyquist validation coverage for Phase {N} and fill identified gaps.</goal>
  <unit_task>
    For each gap in {gap list}: write a test targeting the specified requirement,
    verify it runs green, and report the result as GAPS FILLED, PARTIAL, or ESCALATE.
  </unit_task>
  <persona>
    You are a verification specialist. Your job is not to confirm the implementation
    works — it's to produce executable evidence that each requirement is covered.
  </persona>
  <files_to_read>{PLAN, SUMMARY, impl files, VALIDATION.md}</files_to_read>
  <gaps>{gap list}</gaps>
  <test_infrastructure>{framework, config, commands}</test_infrastructure>
  <constraints>
    <take_freely>Reading any file. Writing new test files.</take_freely>
    <confirm_with_user>Modifying existing implementation files — escalate instead.</confirm_with_user>
    <exclusions>
      1. Modifying implementation files is out of scope — escalate as impl bug.
      2. Exceed 3 debug iterations per gap — escalate rather than continue.
    </exclusions>
  </constraints>
  <output_format>
    Begin your response with exactly one of these lines:
    ## GAPS FILLED
    ## PARTIAL
    ## ESCALATE
    Then list each gap with its status and the test file path (absolute).
  </output_format>
</task>
```

---

### Issue 3: Constraint block in Step 5 is not paired with permitted actions
**Principle:** Section 14 (Constraint Enforcement) — Explicit permission pairs; Section 20 (Safety and Trust Patterns).

**What is missing:** The constraints passed to the auditor subagent (`"Never modify impl files. Max 3 debug iterations. Escalate impl bugs."`) enumerate only restrictions. The guide requires every restriction to be paired with an equally concrete statement of what IS permitted, so the model is not left to infer the permission space. The current form creates ambiguity: can the auditor write new files? Run shell commands? Read anything?

**Concrete fix:** Add an explicit `<permitted>` block alongside the restrictions (incorporated in the fix above, but stated here for emphasis):

```xml
<constraints>
  <permitted>
    - Read any file in the repository
    - Run read-only shell commands (grep, find, ls, git log, git diff)
    - Write new test files to the paths specified in the gap list
    - Run the test suite to verify new tests pass
  </permitted>
  <reserved_for_human_review>
    - Modifying or deleting existing implementation files — escalate as impl bug instead
  </reserved_for_human_review>
  <exclusions>
    1. Exceed 3 debug iterations per gap — escalate rather than continue
  </exclusions>
</constraints>
```

---

### Issue 4: No persona assigned for the orchestrator itself
**Principle:** Section 6 (Persona Assignment), Actions 1–2; Section 22, Pattern 1 (Role identity scoped to the exact domain).

**What is missing:** The workflow assigns no persona to the orchestrating agent executing Steps 0–8. This agent is performing a specific, definable role: a validation orchestrator whose job is to detect coverage gaps, gate on user confirmation, and coordinate a specialized auditor. The guide's Section 6 decision tree asks whether the task is open-ended or requires a specific voice — a workflow orchestrator directing subagents does benefit from an identity that biases it toward systematic, gatekeeping behavior rather than free-form assistance. The absence of a persona leaves the model defaulting to generic assistant behavior.

**Concrete fix:** Add a `<persona>` block after the `<task>` declaration:

```xml
<persona>
You are a validation orchestrator for the GSD workflow system. Your role is to
methodically detect test coverage gaps, present findings to the developer for
confirmation, coordinate the gsd-nyquist-auditor agent, and produce a complete
VALIDATION.md. You do not proceed past a user gate without an explicit response.
You do not skip steps.
</persona>
```

---

### Issue 5: Output format for Steps 8 (Results + Routing) is specified qualitatively, not structurally
**Principle:** Section 7 (Output Format Handling); Section 22, Pattern 3; Section 23 checklist item "Machine-parsed output uses exact format specification with literal string requirements."

**What is missing:** Step 8 shows two code blocks for the compliant and partial result banners, but these are written as illustrative examples embedded in the process prose rather than a formal `<output_format>` block. If the calling agent or a downstream tool needs to detect routing state (Nyquist-compliant vs. partial), the lack of a machine-parseable sentinel (like the guide's `VERDICT: PASS/FAIL/PARTIAL` pattern) means parsing relies on the model reproducing the banner text verbatim — which is not guaranteed.

**Concrete fix:** Add a formal `<output_format>` block after the process steps:

```xml
<output_format>
After completing all steps, end your response with a status line in exactly this format —
it is parsed by the calling orchestrator:

VALIDATE_RESULT: COMPLIANT
or
VALIDATE_RESULT: PARTIAL
or
VALIDATE_RESULT: SKIPPED

Use the literal string `VALIDATE_RESULT: ` followed by exactly one of `COMPLIANT`,
`PARTIAL`, or `SKIPPED`. Output as plain text: no markdown bold, no punctuation,
no wording variation. Precede it with the human-readable summary block from Step 8.
</output_format>
```

---

### Issue 6: No negative-to-positive instruction conversion; two negative-framed instructions remain
**Principle:** Section 5 (Instruction Framing), Action 1 — Convert negative instructions to positive equivalents.

**What is missing:** The constraints for the subagent include two negatively framed directives: "Never modify impl files" and "Max 3 debug iterations." The guide requires negative instructions to be rewritten as positive specifications before the prompt is emitted (exception: the reframe pattern from Section 6, which does not apply here).

**Concrete fix:**
- "Never modify impl files" → "Write only to new test file paths specified in the gap list. For any change required in implementation files, escalate instead."
- "Max 3 debug iterations" → "Attempt up to 3 debug iterations per failing test. On the third failure, escalate the gap as an impl bug."

---

## Quick-Reference Checklist Score

Scoring is against Section 23. Items marked N/A are not applicable to this type of orchestration workflow file (e.g., self-consistency, RAG, automated optimization).

### Task Specification
| Checklist Item | Score | Notes |
|---|---|---|
| Intent, audience, and quality bar are all explicit | FAIL | `<purpose>` names intent only; audience and quality bar absent |
| All constraints are compatible — no conflicts | PASS | No conflicting constraints detected |

### Chain of Thought
| Checklist Item | Score | Notes |
|---|---|---|
| CoT included only for math/symbolic/multi-step logic | N/A | Workflow file, not a reasoning prompt |
| CoT trigger used correctly | N/A | |
| Reasoning elicited before answer | N/A | |
| CoT traces flagged as heuristic | N/A | |

### Few-Shot Examples
| Checklist Item | Score | Notes |
|---|---|---|
| Examples selected by semantic similarity | N/A | No few-shot examples in this workflow type |
| 2–5 examples total | N/A | |
| Ordered simple → complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format consistent across examples | N/A | |
| Example order fixed across evaluation runs | N/A | |

### Formatting
| Checklist Item | Score | Notes |
|---|---|---|
| Instruction complete and clear before formatting applied | PASS | Process steps are clear before structure is imposed |
| Prompt sections separated by semantically named XML tags | FAIL | Top-level structure uses `<purpose>`, `<required_reading>`, `<available_agent_types>`, `<process>`, `<success_criteria>` — only `<process>` is semantically appropriate; `<purpose>` should be `<task>`; no `<persona>`, `<audience>`, `<quality_bar>`, or `<output_format>` tags |
| At least 3 format variants tested on target model | FAIL | No evidence of format variant testing |

### Instruction Framing
| Checklist Item | Score | Notes |
|---|---|---|
| All negative instructions converted to positive equivalents | FAIL | "Never modify impl files" and "Max 3 debug iterations" remain as negatives |
| Priority order explicit when multiple criteria apply | PASS | State A/B/C detection provides an implicit priority; could be made explicit |
| Tie-breaking rules match domain's cost asymmetry | FAIL | No tie-breaking rule specified for ambiguous classification (e.g., what constitutes PARTIAL vs. MISSING) |

### Persona
| Checklist Item | Score | Notes |
|---|---|---|
| Persona included only for open-ended or stylistic tasks | FAIL | No persona assigned to the orchestrator; one is warranted here (see Issue 4) |
| Persona is specific (constrains voice/register), not generic | N/A | No persona present |
| Persona descriptor is gender-neutral | N/A | No persona present |

### Output Format
| Checklist Item | Score | Notes |
|---|---|---|
| Structured output tasks use two-step reasoning-then-format approach | N/A | Workflow orchestration, not structured output task |
| Single-call JSON places reasoning fields before answer fields | N/A | |
| Constrained decoding adopted only after free-form proven insufficient | N/A | |
| Machine-parsed output uses exact format specification | FAIL | Step 8 result banners are illustrative examples, not a formal `<output_format>` block with literal string requirements |

### Context Placement
| Checklist Item | Score | Notes |
|---|---|---|
| Task instruction at the start | FAIL | `<purpose>` is at the start but is not a proper `<task>` tag; `<required_reading>` precedes the process instructions |
| Primary document or input at the end | PASS | `<success_criteria>` closes the file; bash commands and inputs are embedded in process steps |
| Background context in the middle | PASS | `<available_agent_types>` and SDK queries are mid-document |
| All irrelevant context removed | PASS | File is tightly scoped |
| Time-sensitive injected context labeled as snapshot | N/A | No time-sensitive context injected at this level |

### Self-Consistency
| Checklist Item | Score | Notes |
|---|---|---|
| Applied only to tasks with a single correct answer | N/A | |
| Inference budget permits 15–20 samples | N/A | |

### Prompt Length
| Checklist Item | Score | Notes |
|---|---|---|
| Redundant instructions and repeated context removed | PASS | No obvious redundancy |
| Long prompts compressed before sending | N/A | |
| RAG context is extracted relevant passage only | N/A | |

### System / User Split
| Checklist Item | Score | Notes |
|---|---|---|
| Persistent instructions in system prompt | N/A | Workflow file, not a split-prompt system |
| Task-specific instructions in user prompt | N/A | |
| Each instruction appears in exactly one location | PASS | No duplicated instructions detected |
| Safety-critical constraints have external validation | FAIL | "Never modify impl files" is enforced only via the prompt string passed to the auditor; no external validation layer |

### Agent / Subagent
| Checklist Item | Score | Notes |
|---|---|---|
| Agent prompts are fully self-contained | PARTIAL | The auditor prompt includes files, gaps, and test infrastructure, but lacks `<goal>`, `<unit_task>`, `<persona>`, and `<output_format>` |
| All file paths in agent output are absolute | FAIL | No instruction requiring absolute paths in either the orchestrator or auditor output |
| Parallel agents launched in a single message block | PASS | Only one auditor spawned; not a parallelism scenario |
| Adversarial probes specified for verification agents | FAIL | The auditor is a verification agent but receives no `<adversarial_probes>` block (Section 17, Pattern 8) |

### Structural Architecture
| Checklist Item | Score | Notes |
|---|---|---|
| Large prompts decomposed into atomic, single-responsibility modules | PASS | Workflow delegates to gsd-nyquist-auditor for the gap-filling concern |
| Template variables use ${VARIABLE_NAME} syntax with fallback | PARTIAL | `${PHASE_ARG}`, `${GSD_WS}`, `${AGENT_SKILLS_AUDITOR}` are used; no fallback syntax visible |
| Modules compose at runtime via variable substitution | PASS | SDK query pattern (`gsd-sdk query`) handles runtime composition |

### Constraint Enforcement
| Checklist Item | Score | Notes |
|---|---|---|
| Every restriction paired with equally concrete permission | FAIL | Auditor constraints list only restrictions; no `<permitted>` block |
| Hard exclusion lists enumerated, not described qualitatively | PASS | Three exclusions are enumerated |
| Known edge cases have precedent-style rulings | FAIL | No `<precedents>` block for known edge cases (e.g., what counts as a failing test vs. an impl bug) |
| Confidence thresholds are numeric, not qualitative | FAIL | COVERED/PARTIAL/MISSING classification criteria in Step 3 use qualitative descriptions ("failing or incomplete") with no numeric threshold |

### Decision Frameworks
| Checklist Item | Score | Notes |
|---|---|---|
| Multi-option recommendations use explicit decision tree or comparison table | PASS | State A/B/C table and gap classification table are present |
| Criteria checklists gate complex approaches | PASS | `<success_criteria>` checklist gates completion |
| Action permissions framed around reversibility | FAIL | No reversibility framing; "Never modify impl files" is a flat prohibition rather than a `<take_freely>` / `<confirm_with_user>` split |

### Multi-Phase Workflows
| Checklist Item | Score | Notes |
|---|---|---|
| Complex tasks organized into explicit named phases | PASS | Steps 0–8 are named and numbered |
| Required steps distinguished from type-specific steps | PARTIAL | Universal gates (State C exit, Nyquist config check) are implicit; the distinction is not formally marked with `<required_steps universal="true">` |
| Scenario-based branching handles multiple paths explicitly | PASS | State A/B/C and auditor return format handling are explicit |

### Memory and Continuity
| Checklist Item | Score | Notes |
|---|---|---|
| Memory templates use XML tags as section labels | N/A | Not a memory-template workflow |
| Compaction summaries include discoveries and failed approaches | N/A | |
| Next steps tied to user's most recent explicit request | N/A | |

### Modularity
| Checklist Item | Score | Notes |
|---|---|---|
| Each prompt component has a single responsibility | PASS | Process steps are tightly scoped |
| Scope boundaries state both inclusions and exclusions | FAIL | No `<scope>` block with `<include>` / `<exclude>` boundaries; scope is implied by the process steps |

### Safety and Trust
| Checklist Item | Score | Notes |
|---|---|---|
| Validation at system boundaries only; internal interfaces trusted | PASS | Auditor return format handling validates the three expected outcomes |
| Dual-use capabilities state permissions before restrictions | FAIL | Constraints in Step 5 state restrictions only, not permissions first |
| Authorization is narrow-scoped; each action confirmed before expanding | PASS | Step 4 user gate confirms before spawning the auditor |

### Tone and Style
| Checklist Item | Score | Notes |
|---|---|---|
| Size constraints use numeric limits, not qualitative descriptors | PARTIAL | "Max 3 debug iterations" is numeric; other quality guidance is absent |
| Instructions use imperative present tense | PASS | Bash commands and step instructions use imperative form |
| Working notes are in analysis tags, not user-facing output | N/A | |

### Optimization
| Checklist Item | Score | Notes |
|---|---|---|
| Prompt flagged as draft for automated optimization | FAIL | No optimization flag |
| Correct optimizer selected | N/A | Not yet at optimization stage |
| Held-out test set reserved before optimization begins | N/A | |

---

## Recommendations

Prioritized from highest to lowest impact:

**1. Add a formal `<task>`, `<audience>`, and `<quality_bar>` block (replaces `<purpose>`).**
This is the highest-leverage fix. The entire prompt engineering system depends on a clear task specification. Without explicit audience and quality bar, the orchestrating model cannot calibrate depth, completeness, or termination conditions. Implement the fix described in Issue 1. Applies: Section 1 Actions 1–2, Section 4 Action 2.

**2. Restructure the `Task()` subagent prompt as a well-formed XML document.**
The auditor is the most consequential actor in this workflow — it writes test files and commits code. An underspecified prompt for it creates the highest operational risk. Add `<goal>`, `<unit_task>`, `<persona>` (using the reframe pattern from Section 6: "your job is not to confirm it works — it's to produce evidence"), `<permitted>` / `<reserved_for_human_review>` constraint pairs, and a formal `<output_format>` with a machine-parseable sentinel. Applies: Section 17, Section 14, Section 7, Section 22 Patterns 3 and 8.

**3. Add `<adversarial_probes>` to the auditor subagent prompt.**
The auditor is explicitly a verification agent. The guide's Section 17 and Pattern 8 (Section 22) require adversarial probe dimensions for this agent type: boundary values, idempotency, and orphan operations. Without them, the auditor defaults to happy-path verification — exactly what the guide warns against. This is a single targeted addition to the subagent prompt.

**4. Convert all negative instructions to positive equivalents and add a tie-breaking rule for gap classification.**
"Never modify impl files" and "Max 3 debug iterations" violate Section 5 Action 1. Rewrite them as positive action specifications. Additionally, the COVERED/PARTIAL/MISSING classification boundary between PARTIAL and MISSING is ambiguous ("failing or incomplete" vs. "no test found") — add a tie-breaking rule stating, for example: "When a test exists but does not target the specified behavior, classify as MISSING rather than PARTIAL." Applies: Section 5 Actions 1 and Tie-breaking instructions.

**5. Add a formal `<output_format>` block with a machine-parseable `VALIDATE_RESULT:` sentinel for Step 8.**
Without a parseable output sentinel, downstream routing (to `/gsd-audit-milestone` or retry) depends on the model reproducing the banner prose verbatim. The guide's Pattern 3 (Section 22) and the checklist item for machine-parsed output both require an exact, literal-string format specification. The fix in Issue 5 above is a minimal addition with high reliability payoff. Applies: Section 7, Section 22 Pattern 3, Section 23 output_format checklist.
