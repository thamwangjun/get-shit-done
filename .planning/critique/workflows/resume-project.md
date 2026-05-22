# Critique: resume-project.md

## Summary

`resume-project.md` is a well-structured, operationally complete workflow that successfully solves the "where were we?" problem for multi-session projects. Its step-by-step organization, explicit branching logic, and clear success criteria are genuine strengths. However, it under-applies the guide's structural techniques at the prompt-engineering level: instructions are framed in prose paragraphs and bullet lists where XML-tag sectioning, explicit constraint pairs, and positive instruction framing would improve model compliance and robustness. The workflow also lacks an output format specification, a persona, and explicit priority ordering — all of which the guide identifies as high-leverage additions for instruction-tuned models. The core logic is sound; the surface encoding needs hardening.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase pattern applied correctly.** The workflow uses named `<step>` tags (`initialize`, `load_state`, `check_incomplete_work`, `present_status`, `determine_next_action`, `offer_options`, `route_to_workflow`, `update_session`) that create clear cognitive boundaries. Each step is completed before the next begins, exactly as the guide prescribes.

- **Section 15 (Decision Frameworks) — Explicit decision tree in `determine_next_action`.** The "If X → Primary / Option" structure is a readable, directive decision tree that reduces ambiguity at the branching point most likely to produce model drift.

- **Section 16 (Scenario-based branching) — `determine_next_action` handles multiple paths explicitly.** All major resumption scenarios (interrupted agent, HANDOFF.json, .continue-here, incomplete plan, phase transitions) are enumerated rather than left to inference. This matches the guide's `<scenarios>` pattern.

- **Section 8 (Context Placement) — Task instruction leads the prompt.** The `<trigger>` and `<purpose>` tags appear at the top, establishing intent before the procedural steps. Context (STATE.md, PROJECT.md reads) is positioned in the middle. This ordering exploits model attention correctly.

- **Section 14 (Constraint Enforcement) — `check_incomplete_work` step specifies detection logic precisely.** The bash scripts are concrete and executable, not vague directives. The HANDOFF.json deletion rule ("After successful resumption, delete HANDOFF.json") is a specific edge-case ruling consistent with the guide's precedent pattern.

- **Section 21 (Tone and Style) — Active voice and imperative framing used throughout.** Steps are written as present-tense imperatives ("Load all context", "Parse JSON for", "Present complete project status"). This matches the guide's instruction style requirements.

- **Section 18 (Memory and Continuity) — `<reconstruction>` block handles degraded state.** The fallback for missing STATE.md follows a principled recovery sequence from most-structured to least-structured artifact. The `<success_criteria>` checklist at the end mirrors the guide's compaction summary structure.

---

## Issues

### Issue 1 — No XML tag sectioning for structural prompt sections (Section 4, Action 2)

**Principle:** The guide requires semantically named XML tags to separate distinct prompt sections (`<task>`, `<context>`, `<constraints>`, `<output_format>`). It states this is "strictly better than markdown headers or `---` delimiters for Claude-class models."

**What's wrong:** The workflow uses ad-hoc tags (`<trigger>`, `<purpose>`, `<process>`, `<step>`, `<reconstruction>`, `<quick_resume>`, `<success_criteria>`). While `<step>` tags are appropriate for phase sequencing, the top-level prompt is missing the standard vocabulary tags. There is no `<task>` wrapping the primary instruction, no `<constraints>` block, no `<output_format>`, and the `<purpose>` tag is not part of the guide's defined vocabulary.

**Concrete fix:** Restructure the top-level envelope using guide-standard tags:

```xml
<task>
  Restore full project context when resuming a session. Read project state, detect
  incomplete work, present a status summary, and offer the most logical next action.
</task>

<context>
  This workflow runs at session start on existing projects. The model has access to
  .planning/ directory artifacts: STATE.md, PROJECT.md, ROADMAP.md, HANDOFF.json,
  phase directories, and todo files.
</context>

<constraints>
  <take_freely>
    Reading any file in .planning/ or running read-only shell commands (cat, ls, git log).
  </take_freely>
  <confirm_with_user>
    Deleting HANDOFF.json, modifying STATE.md, routing to any destructive workflow.
  </confirm_with_user>
</constraints>

<output_format>
  ...
</output_format>
```

---

### Issue 2 — No `<output_format>` specification (Section 7, Action 1; Section 22, Pattern 3)

**Principle:** "Output format specified completely and upfront" (Pattern 3). The guide requires stating required output structure, field names, ordering, and an example before the model begins its task. Section 7 Action 1 further requires free-form reasoning before any structured output.

**What's wrong:** The `present_status` step includes an ASCII-box template, but it is embedded mid-workflow inside a process step rather than declared as the canonical output format. The workflow never specifies: what happens if STATE.md is empty, what the exact format of the options list must be, or what constitutes a well-formed "route to workflow" response. Format is implicit and will vary across model calls.

**Concrete fix:** Add a dedicated `<output_format>` block at the top level:

```xml
<output_format>
Status presentation uses this fixed structure:

1. ASCII status box (template in step present_status) — always rendered.
2. Warning blocks — rendered only when incomplete work, interrupted agents, blockers,
   or alignment issues exist. Each warning is one bullet per item.
3. Options list — numbered, with the primary action as item 1. Maximum 5 options.
   Use the exact command syntax shown in route_to_workflow.
4. Closing prompt — exactly: "What would you like to do?"

Size constraint: The status box plus warnings must fit in under 30 lines.
Options list: 3–5 items. Do not pad with options the user did not ask for.
</output_format>
```

---

### Issue 3 — Negative instructions not converted to positive equivalents (Section 5, Action 1)

**Principle:** "Convert negative instructions to positive equivalents." The guide requires scanning for "do not", "avoid", "never" and rewriting each as a positive specification.

**What's wrong:** Several instructions are framed as negatives or passive avoidances:
- `"Wait for user selection."` (imperative but implicitly "do not proceed without input")
- `"./transition.md (internal workflow, invoked inline — NOT a user command)"` — the capitalized NOT is a negative constraint with no positive equivalent
- `"Flag divergence"` without specifying what the positive action is after flagging

**Concrete fix:**

```
# Before
./transition.md (internal workflow, invoked inline — NOT a user command)

# After
./transition.md (internal workflow — invoke inline within this session; present
the result directly to the user without surfacing the command name)
```

```
# Before
"Validate uncommitted_files against git status — flag divergence"

# After
"Run git status and compare against uncommitted_files. When they match, proceed.
When they differ, surface the specific divergence to the user before taking action."
```

---

### Issue 4 — No persona assigned (Section 6, Action 1; Section 22, Pattern 1)

**Principle:** For workflows requiring a specific operational register, assign a specific, role-constrained persona. The guide's role-domain mapping table shows that "Assistant" is ineffective; a domain-specific identity produces more consistent outputs.

**What's wrong:** The workflow assigns no persona. The model defaults to generic assistant behavior, which may produce verbose preamble, unnecessary hedging, or failure to lead with the status box. The workflow's core operation (context restoration, triage, decision routing) benefits from a role that primes confidence and decisiveness.

**Concrete fix:**

```xml
<persona>
You are a project continuity specialist. Your job is to restore full working context
from persisted artifacts and immediately orient the developer to where they left off.

Lead with the status box. Surface blockers and incomplete work before options.
Be direct — the developer wants to resume work, not read a summary of your reasoning.
</persona>
```

This matches Section 22 Pattern 1 ("role identity scoped to the exact domain") and Section 6's reframe pattern.

---

### Issue 5 — No explicit priority ordering when signals conflict (Section 5, Priority Ordering)

**Principle:** "When multiple considerations apply, list them with explicit priority." The guide provides the `<priority_order>` tag for exactly this case.

**What's wrong:** The `determine_next_action` step lists five resumption scenarios (interrupted agent, HANDOFF.json, .continue-here, incomplete plan, phase transitions) but does not state an explicit priority when more than one condition is true simultaneously. In practice, a session could have both a HANDOFF.json and an incomplete plan. The model must infer which takes precedence.

**Concrete fix:**

```xml
<priority_order>
  When multiple resumption signals are found, apply in this order:
  1. Interrupted agent (highest — live process may still hold locks or state)
  2. HANDOFF.json (structured handoff from explicit /gsd-pause-work — most complete context)
  3. .continue-here file (mid-plan checkpoint — specific resumption point)
  4. Incomplete plan (PLAN without SUMMARY — execution started, not finished)
  5. Phase transition (all plans done, advance to next phase)
  6. Normal planning cycle (lowest — no incomplete work detected)
</priority_order>
```

---

### Issue 6 — `quick_resume` path bypasses success criteria without justification (Section 1, Action 3)

**Principle:** "Audit constraints for consistency. If any two constraints cannot both be satisfied simultaneously, flag the conflict." Section 14 also requires explicit permission pairs — every restriction paired with what IS permitted.

**What's wrong:** The `<quick_resume>` block instructs the model to "Load state silently — Determine primary action — Execute immediately without presenting options." This conflicts with the `<success_criteria>` checklist item "Contextual next actions offered" and with the `present_status` step's requirement to always render the ASCII status box. The constraint conflict is silent and will produce inconsistent behavior.

**Concrete fix:** Explicitly carve out which success criteria apply in quick-resume mode:

```xml
<quick_resume>
  If user says "continue" or "go":
  - Load state (steps initialize and load_state) — no output during loading.
  - Skip present_status and offer_options.
  - Execute the primary action from determine_next_action directly.
  - Output exactly: "Continuing from [state summary in under 10 words]... [action]"

  Success criteria for quick-resume mode:
  - [ ] STATE.md loaded (or reconstructed)
  - [ ] Incomplete work detected and surfaced if critical (blockers only)
  - [ ] Primary action executed
  Note: offer_options and full status box are skipped in this mode.
</quick_resume>
```

---

## Quick-Reference Checklist Score

Scored against Section 23. Items marked N/A where the guide section does not apply to a workflow document of this type (e.g., self-consistency, RAG context).

### Task Specification
| Item | Score | Notes |
|------|-------|-------|
| Intent, audience, and quality bar are all explicit | FAIL | Intent is implicit in `<purpose>`; audience and quality bar are absent |
| All constraints are compatible — no conflicts between scope, length, or depth | FAIL | `<quick_resume>` conflicts with `<success_criteria>` (Issue 6) |

### Chain-of-Thought
| Item | Score | Notes |
|------|-------|-------|
| CoT included only for math, symbolic reasoning, or multi-step logic | N/A | Not a CoT-eliciting prompt |
| CoT trigger used correctly | N/A | |
| Reasoning elicited before answer | N/A | |
| CoT traces treated as heuristic | N/A | |

### Few-Shot Examples
| Item | Score | Notes |
|------|-------|-------|
| Examples selected by semantic similarity | N/A | No few-shot examples in this workflow |
| 2–5 examples total | N/A | |
| Ordered simple to complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format consistent across examples | N/A | |
| Example order fixed across evaluation runs | N/A | |

### Formatting
| Item | Score | Notes |
|------|-------|-------|
| Instruction is complete and clear before formatting applied | PASS | Steps are fully specified before structure is added |
| Prompt sections are separated by semantically named XML tags | FAIL | Uses non-standard tags (`<purpose>`, `<process>`, `<step>`); missing `<task>`, `<constraints>`, `<output_format>` |
| At least 3 format variants will be tested on the target model | FAIL | No evidence of format variant testing |

### Instruction Framing
| Item | Score | Notes |
|------|-------|-------|
| All negative instructions converted to positive equivalents | FAIL | "NOT a user command" and implicit avoidance patterns remain (Issue 3) |
| Priority order explicit when multiple criteria apply | FAIL | No `<priority_order>` for conflicting resumption signals (Issue 5) |
| Tie-breaking rules match domain's cost asymmetry | FAIL | No tie-breaking specified; quick-resume vs. full resume ambiguity unresolved |

### Persona
| Item | Score | Notes |
|------|-------|-------|
| Persona included only for open-ended or stylistic tasks | N/A | A persona is appropriate here but absent; check does not penalize absence if persona is not needed |
| Persona is specific (constrains voice/register), not generic | FAIL | No persona present; one would be beneficial (Issue 4) |
| Persona descriptor is gender-neutral | N/A | No persona to assess |

### Output Format
| Item | Score | Notes |
|------|-------|-------|
| Structured output tasks use two-step reasoning-then-format approach | FAIL | No `<output_format>` block; format embedded inside process steps (Issue 2) |
| Single-call JSON places reasoning fields before answer fields | N/A | No JSON output in this workflow |
| Constrained decoding adopted only after free-form proven insufficient | N/A | |
| Machine-parsed output uses exact format specification | N/A | Output is human-facing |

### Context Placement
| Item | Score | Notes |
|------|-------|-------|
| Task instruction at start of prompt | PASS | `<trigger>` and `<purpose>` lead the file |
| Primary document or input at end of prompt | PASS | `<success_criteria>` and `<quick_resume>` close the prompt; input (STATE.md) is read mid-process |
| Background context in the middle | PASS | Process steps occupy the middle |
| All irrelevant context has been removed | PASS | No obvious bloat |
| Time-sensitive injected context labeled as snapshot | N/A | Context is read dynamically via bash, not injected at prompt-construction time |

### Self-Consistency
| Item | Score | Notes |
|------|-------|-------|
| Self-consistency applied only to tasks with single correct answer | N/A | Not applicable |
| Inference budget permits 15–20 samples | N/A | |

### Prompt Length
| Item | Score | Notes |
|------|-------|-------|
| Redundant instructions and repeated context removed | PASS | No obvious repetition |
| Long prompts compressed before sending | N/A | |
| RAG context is extracted relevant passage only | N/A | |

### System/User Split
| Item | Score | Notes |
|------|-------|-------|
| Persistent instructions in system prompt | N/A | Workflow file, not a system/user split prompt |
| Task-specific instructions in user prompt | N/A | |
| Each instruction appears in exactly one location | PASS | No duplicated instructions detected |
| Safety-critical constraints have external validation | FAIL | HANDOFF.json deletion has no external validation guard |

### Agent/Subagent
| Item | Score | Notes |
|------|-------|-------|
| Agent prompts are fully self-contained | PASS | `<required_reading>` references the continuation format; reconstruction block handles missing artifacts |
| All file paths in agent output are absolute | FAIL | Bash scripts use relative paths (`.planning/STATE.md`, `.planning/phases/*`) throughout |
| Parallel agents launched in a single message block | N/A | No parallel agent spawning in this workflow |
| Adversarial probes specified for verification agents | N/A | |

### Structural Architecture
| Item | Score | Notes |
|------|-------|-------|
| Large prompts decomposed into atomic, single-responsibility modules | PASS | Each `<step>` has a single responsibility |
| Template variables use `${VARIABLE_NAME}` syntax with fallback | PASS | `${GSD_WS}`, `${PROJECT_CODE}`, `${PROJECT_TITLE}` used correctly |
| Modules compose at runtime via variable substitution | PASS | Variable substitution is used for workspace-scoped commands |

### Constraint Enforcement
| Item | Score | Notes |
|------|-------|-------|
| Every restriction paired with an equally concrete permission | FAIL | No `<constraints>` block; restrictions (e.g., delete HANDOFF.json only after success) are embedded in prose |
| Hard exclusion lists enumerated, not described qualitatively | N/A | No filtering task |
| Known edge cases have precedent-style rulings | PASS | HANDOFF.json one-shot deletion rule is a precedent-style ruling |
| Confidence thresholds are numeric, not qualitative | N/A | No filtering or ranking task |

### Decision Frameworks
| Item | Score | Notes |
|------|-------|-------|
| Multi-option recommendations use explicit decision tree or comparison table | PASS | `determine_next_action` uses an explicit if/then decision tree |
| Criteria checklists gate complex approaches | PASS | `<success_criteria>` checklist gates workflow completion |
| Action permissions framed around reversibility | FAIL | No reversibility framing; HANDOFF.json deletion is irreversible but not flagged as `<confirm_with_user>` |

### Multi-Phase Workflows
| Item | Score | Notes |
|------|-------|-------|
| Complex tasks organized into explicit named phases | PASS | Eight named `<step>` tags with clear responsibilities |
| Required steps distinguished from type-specific steps | FAIL | All steps appear mandatory; conditional steps (reconstruction, quick_resume) are not formally marked as optional |
| Scenario-based branching handles multiple paths explicitly | PASS | `determine_next_action` covers all major branching scenarios |

### Memory and Continuity
| Item | Score | Notes |
|------|-------|-------|
| Memory templates use XML tags as section labels | PASS | `<reconstruction>` and `update_session` follow structured patterns |
| Compaction summaries include discoveries and failed approaches | N/A | This workflow produces a status presentation, not a compaction summary |
| Next steps tied to user's most recent explicit request | PASS | `route_to_workflow` ties every option to a specific user selection |

### Modularity
| Item | Score | Notes |
|------|-------|-------|
| Each prompt component has single responsibility | PASS | Each step is focused on one operation |
| Scope boundaries state both inclusions and exclusions | FAIL | No `<scope>` block; what this workflow does NOT do is not stated |

### Safety and Trust
| Item | Score | Notes |
|------|-------|-------|
| Validation at system boundaries only; internal interfaces trusted | PASS | Bash reads are trusted; HANDOFF.json validation against git status is the boundary check |
| Dual-use capabilities state permissions before restrictions | N/A | No dual-use capabilities |
| Authorization is narrow-scoped; each action confirmed before expanding scope | FAIL | HANDOFF.json deletion and STATE.md update proceed without explicit confirmation step |

### Tone and Style
| Item | Score | Notes |
|------|-------|-------|
| Size constraints use numeric limits, not qualitative descriptors | FAIL | "Brief alignment" and status box have no line/word limits specified beyond the box template |
| Instructions use imperative present tense | PASS | Throughout |
| Working notes in analysis tags, not user-facing output | PASS | Internal bash is enclosed in code blocks; no reasoning traces bleed into user output |

### Optimization
| Item | Score | Notes |
|------|-------|-------|
| Prompt flagged as draft for automated optimization | FAIL | No optimization flag |
| Correct optimizer selected | N/A | |
| Held-out test set reserved | N/A | |

---

## Recommendations

Prioritized by impact-to-effort ratio:

### 1. Add `<task>`, `<constraints>`, and `<output_format>` top-level blocks (Sections 4.2, 7, 14)

This is the highest-leverage structural fix. Adding these three blocks at the top of the file gives the model the standard vocabulary signals it attends to most strongly, replaces implicit output format with a concrete specification, and consolidates all constraints into a `<permitted>`/`<confirm_with_user>` pair. Estimated effort: 30 minutes. Expected gain: more consistent status-box rendering and fewer cases where the model skips the format or adds unrequested preamble.

### 2. Add an explicit `<priority_order>` for resumption signal conflicts (Section 5, Priority Ordering)

When HANDOFF.json, .continue-here, and an incomplete plan all exist simultaneously (a realistic state after an interrupted session), the model currently has no instruction about precedence. A six-item `<priority_order>` block (see Issue 5 fix) costs three lines and eliminates a significant ambiguity at the highest-stakes moment of the workflow.

### 3. Resolve the `<quick_resume>` / `<success_criteria>` constraint conflict (Section 1, Action 3)

The conflict identified in Issue 6 will produce silent inconsistency — in quick-resume mode the model will either render the full status box (satisfying success criteria but violating the "silently" directive) or skip it (violating success criteria). Explicitly scoping the success criteria to the two workflow modes (full resume vs. quick resume) costs five lines and eliminates the conflict entirely.

### 4. Assign a domain-specific persona (Section 6, Action 2; Section 22, Pattern 1)

A two-sentence persona ("project continuity specialist... lead with the status box") primes the register and eliminates the generic hedging that instruction-tuned models produce without a role anchor. This is the lowest-effort fix on the list and has measurable impact on output consistency for conversational-format workflows.

### 5. Replace relative paths in bash scripts with absolute-path discipline (Section 17, Absolute Paths)

All bash scripts use relative paths (`.planning/STATE.md`, `.planning/phases/*`). The guide explicitly states: "Agent threads always have their cwd reset between bash calls. Absolute paths remain valid across all tool calls; relative paths break silently when the working directory changes." The fix is mechanical: replace `.planning/` with `${GSD_PROJECT_ROOT}/.planning/` or equivalent, and add a path resolution step at the top of the `initialize` step.
