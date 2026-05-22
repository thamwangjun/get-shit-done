# Critique: diagnose-issues.md

## Summary

`diagnose-issues.md` is a solid, well-structured orchestration workflow with a clear mental model (UAT gives symptoms → debug agents find root causes → plan-phase --gaps gets precise fixes). Its step sequencing is logical, its parallel-spawning pattern is correct, and the failure-handling and success-criteria sections show production maturity. However, the workflow fails several foundational prompt engineering requirements from the guide: it lacks explicit `<task>`, `<audience>`, and `<quality_bar>` tags; negative instructions appear without positive rewrites; the agent subprompt template has no `<output_format>` specification for machine-parsed output; and there are no tie-breaking rules, no explicit constraint pairs, and no XML-wrapped few-shot example of a correctly diagnosed gap vs. a poorly diagnosed one. These gaps leave meaningful ambiguity in the orchestrator's behavior and in what the spawned debug agents are expected to return.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase pattern applied correctly.** Steps are named, sequenced, and wrapped in `<step name="...">` tags, creating cognitive phase boundaries that match the guide's `<phase>` pattern.
- **Section 17 (Agent and Subagent Patterns) — Parallel spawning in a single message.** The instruction "All agents spawn in single message (parallel execution)" directly satisfies Section 17's requirement that all parallel agents be launched in one message block.
- **Section 16 — Required vs. optional and scenario-based branching.** `<failure_handling>` enumerates three distinct failure scenarios (agent failure, timeout, all agents fail) with explicit fallback paths, matching the guide's `<scenarios>` pattern.
- **Section 17 — Worktree isolation and branch-correction logic.** The `worktree_branch_check` snippet is a concrete safety guard that prevents the known `EnterWorktree` branch-base drift bug — this is operationally mature.
- **Section 14 — Structured agent return format.** The `## ROOT CAUSE FOUND` / `## INVESTIGATION INCONCLUSIVE` protocol for agent returns defines a parseable protocol for the orchestrator — consistent with the machine-parsed output pattern.
- **Section 19 (Modularity) — Single responsibility.** The workflow does exactly one thing: diagnose gaps. It explicitly defers fix planning to `plan-phase --gaps` and defers fix application to debug agents. The scope is enforced by the `<context_efficiency>` element.
- **Section 8 (Context Placement) — Task instruction leads.** `<purpose>` appears at the top of the file and states the orchestrator's job before any operational detail.

---

## Issues

### Issue 1 — Missing explicit task specification tags
**Principle:** Section 1 Action 1 / Section 4 Action 2.
**What's wrong:** The workflow opens with a `<purpose>` block but never uses the guide-specified `<task>`, `<audience>`, or `<quality_bar>` tags. The model cannot distinguish what the orchestrator must produce, who consumes the output, or what good orchestration looks like. The `<purpose>` block is prose description, not an actionable task specification.
**Concrete fix:** Replace or augment the `<purpose>` block:
```xml
<task>
Orchestrate parallel debug agents to diagnose UAT gaps. Parse each gap from UAT.md,
spawn one gsd-debugger agent per gap, collect root causes, and update UAT.md with
diagnoses. Hand off to verify-work when complete.
</task>

<audience>
The orchestrating model running the diagnose-issues workflow. Consumers of its output
are: (1) the verify-work orchestrator that reads the handoff, and (2) the developer
who reads the diagnosis summary table.
</audience>

<quality_bar>
A correct run produces: all gaps parsed, all agents spawned in one message, UAT.md
updated with root_cause + artifacts + missing fields, and a summary table rendered
before handoff. Partial diagnosis (some agents inconclusive) is acceptable; zero
diagnoses or missing UAT.md update is a failure.
</quality_bar>
```

---

### Issue 2 — Agent return format is not machine-parse-safe
**Principle:** Section 7 — Machine-parsed output specification; Section 22 Pattern 3.
**What's wrong:** The `## ROOT CAUSE FOUND` heading is the only parse signal the orchestrator uses, but there is no specification of exact string literals, no prohibition on formatting variation (bold, extra whitespace, markdown variation), and no machine-parse instruction given to the debug agents. If agents vary the heading slightly (`### Root Cause Found`, `**ROOT CAUSE FOUND**`), parsing breaks silently.
**Concrete fix:** Add an `<output_format>` block inside the debug-subagent-prompt template section, following the guide's exact-format pattern:

```xml
<output_format>
End your response with one of these two verdict blocks — parsed by the orchestrator.
Use the exact heading string; no bold, no alternate capitalization:

## ROOT CAUSE FOUND

**Root Cause:** {one sentence}
**Files Involved:** {comma-separated list}
**Suggested Fix Direction:** {one sentence}
**Debug Session:** {absolute path to debug file}

or, if inconclusive:

## INVESTIGATION INCONCLUSIVE

**Remaining Possibilities:** {bullet list}
**Debug Session:** {absolute path to debug file}
</output_format>
```

---

### Issue 3 — Negative instructions not converted to positive equivalents
**Principle:** Section 5 Action 1.
**What's wrong:** Two directives in the workflow are negative:
- `<context_efficiency>`: "Agents only diagnose—plan-phase --gaps handles fixes (no fix application)."
- `<step name="report_results">`: "Do NOT offer manual next steps - verify-work handles the rest."

Negative framing ("no fix application", "Do NOT offer manual next steps") is a primary directive stated negatively, which the guide requires converting to a positive specification.
**Concrete fix:**
- "Agents only diagnose — plan-phase --gaps handles fixes (no fix application)" → "Agents return root cause and evidence only. Fix planning is reserved for plan-phase --gaps."
- "Do NOT offer manual next steps - verify-work handles the rest." → "Return control to verify-work for automatic planning. verify-work drives all subsequent steps."

---

### Issue 4 — No tie-breaking rule for ambiguous or borderline gaps
**Principle:** Section 5 — Tie-breaking instructions; Section 22 Pattern 4.
**What's wrong:** When a gap's `reason` field is sparse or its `severity` is ambiguous, the orchestrator has no instruction on whether to spawn a debug agent anyway (recall-biased) or skip it (precision-biased). Similarly, if two gaps share the same root cause, there is no instruction on whether to merge them or diagnose separately.
**Concrete fix:** Add a `<tie_breaking>` block after `<core_principle>`:
```xml
<tie_breaking>
When in doubt, spawn a debug agent. Missing a diagnosis is more costly than a
redundant agent run. If two gaps share an identical reason field, spawn separate
agents — they may have different root causes despite similar symptoms.
</tie_breaking>
```

---

### Issue 5 — No few-shot example of a correctly diagnosed gap
**Principle:** Section 3 Action 1–5; Section 22 Pattern 2.
**What's wrong:** The `<step name="parse_gaps">` section shows the YAML input format (good) but provides no example of the complete input-to-output mapping: UAT gap YAML in → root cause + updated gap YAML out. Without a calibrating example, agents and the orchestrator have no concrete target for what "good diagnosis" looks like. The guide requires at least one abstract instruction be paired with a concrete example.
**Concrete fix:** Add an `<examples>` block after `<core_principle>`:
```xml
<examples>
  <example>
    <input>
    Gap YAML:
      truth: "Comment appears immediately after submission"
      status: failed
      reason: "works but doesn't show until I refresh the page"
      severity: major

    Agent return:
    ## ROOT CAUSE FOUND
    **Root Cause:** useEffect in CommentList.tsx missing commentCount dependency
    **Files Involved:** src/components/CommentList.tsx
    **Suggested Fix Direction:** Add commentCount to useEffect dependency array
    </input>
    <output>
    Updated gap YAML:
      root_cause: "useEffect in CommentList.tsx missing commentCount dependency"
      artifacts:
        - path: "src/components/CommentList.tsx"
          issue: "useEffect missing dependency"
      missing:
        - "Add commentCount to useEffect dependency array"
        - "Trigger re-render when new comment added"
      debug_session: .planning/debug/comment-not-refreshing.md
    </output>
    <commentary>
    The root_cause is a single, specific, code-level statement — not a symptom restatement.
    artifacts maps to exact files. missing entries are actionable directives for plan-phase.
    </commentary>
  </example>
</examples>
```

---

### Issue 6 — No explicit constraint pair for orchestrator permissions
**Principle:** Section 14 — Explicit permission pairs; Section 22 Pattern 9.
**What's wrong:** The workflow tells the orchestrator what to do but never defines what it is and is not permitted to do. There is no `<constraints>` block specifying that the orchestrator is read-only except for the UAT.md commit, and there is no `<permitted>` / `<reserved_for_human_review>` pair. This matters because the orchestrator runs gsd-sdk shell commands and commits files — these actions should be explicitly bounded.
**Concrete fix:**
```xml
<constraints>
  <permitted>
    - Read UAT.md and STATE.md
    - Spawn gsd-debugger subagents
    - Run: gsd-sdk query config-get, gsd-sdk query agent-skills, gsd-sdk query commit
    - Update UAT.md gaps section with diagnosis fields
  </permitted>

  <reserved_for_human_review>
    - Modifying any file other than the UAT.md gaps section
    - Running git commands directly (use gsd-sdk query commit)
    - Applying fixes — that is plan-phase --gaps's responsibility
  </reserved_for_human_review>
</constraints>
```

---

## Quick-Reference Checklist Score

Scores against Section 23 of the guide.

### Task Specification
| Item | Score |
|------|-------|
| Intent, audience, and quality bar are all explicit in the prompt | FAIL — `<purpose>` covers intent partially; audience and quality bar are absent |
| All constraints are compatible — no conflicts between scope, length, or depth | PASS — no conflicting constraints detected |

### Chain-of-Thought
| Item | Score |
|------|-------|
| CoT is included only for math, symbolic reasoning, or multi-step logic tasks | N/A — this is an orchestration workflow, not a reasoning prompt |
| CoT trigger used correctly | N/A |
| Reasoning is elicited before the answer | N/A |
| CoT traces treated as heuristic aids | N/A |

### Few-Shot Examples
| Item | Score |
|------|-------|
| Examples selected by semantic similarity | FAIL — no examples present |
| 2–5 examples total | FAIL — zero examples |
| Ordered simple → complex | FAIL — zero examples |
| Examples span diverse sub-types | FAIL — zero examples |
| Format is consistent across all examples | FAIL — zero examples |
| Example order is fixed across evaluation runs | N/A |

### Formatting
| Item | Score |
|------|-------|
| Instruction is complete and clear before formatting is applied | PASS — `<purpose>` and `<process>` lead with instruction |
| Prompt sections are separated by semantically named XML tags | PASS — `<purpose>`, `<process>`, `<step>`, `<failure_handling>`, `<success_criteria>` all present |
| At least 3 format variants will be tested on target model | N/A — workflow file, not a single-call prompt |

### Instruction Framing
| Item | Score |
|------|-------|
| All negative instructions converted to positive equivalents | FAIL — "no fix application" and "Do NOT offer manual next steps" remain negative |
| Priority order is explicit when multiple criteria apply | FAIL — no `<priority_order>` block for gap triage when severity conflicts |
| Tie-breaking rules match domain's cost asymmetry | FAIL — no tie-breaking rule present |

### Persona
| Item | Score |
|------|-------|
| Persona included only for open-ended or stylistic tasks | PASS — no persona (correct for orchestration workflow) |
| Persona is specific | N/A |
| Persona descriptor is gender-neutral | N/A |

### Output Format
| Item | Score |
|------|-------|
| Structured output tasks use two-step reasoning-then-format | PASS — agent returns root cause prose first, then structured YAML update |
| Single-call JSON places reasoning fields before answer fields | N/A |
| Constrained decoding adopted only after free-form + post-processing proven insufficient | N/A |
| Machine-parsed output uses exact format specification with literal string requirements | FAIL — `## ROOT CAUSE FOUND` heading has no literal-string constraint or format guard |

### Context Placement
| Item | Score |
|------|-------|
| Task instruction is at the start of the prompt | PASS — `<purpose>` leads the file |
| Primary document or input is at the end | PASS — `<success_criteria>` closes the file as a checklist; agent input is constructed inline |
| Background context is in the middle | PASS — `<core_principle>` and `<context_efficiency>` are mid-file |
| All irrelevant context has been removed | PASS — file is focused; no filler |
| Time-sensitive injected context is labeled as a snapshot | N/A — no runtime snapshot injection |

### Self-Consistency
| Item | Score |
|------|-------|
| Applied only to tasks with a single correct answer | N/A |
| Inference budget permits 15–20 samples | N/A |

### Prompt Length
| Item | Score |
|------|-------|
| Redundant instructions and repeated context removed | PASS — no obvious redundancy |
| Long prompts compressed before sending | N/A |
| RAG context is extracted passage only | N/A |

### System/User Split
| Item | Score |
|------|-------|
| Persistent instructions in system prompt | N/A — workflow file, not a split-prompt system |
| Task-specific instructions in user prompt | N/A |
| Each instruction appears in exactly one location | PASS — no duplicated instructions detected |
| Safety-critical constraints have external validation | FAIL — no external validation of the UAT.md commit or the agent output parse |

### Agent/Subagent
| Item | Score |
|------|-------|
| Agent prompts are fully self-contained | PASS — `<files_to_read>` and AGENT_SKILLS are injected into subprompt |
| All file paths in agent output are absolute | PASS — `${DEBUG_DIR}` resolves to `.planning/debug/`; debug_session field uses that path |
| Parallel agents are launched in a single message block | PASS — explicitly required: "All agents spawn in single message" |
| Adversarial probes are specified for verification agents | N/A — debug agents diagnose, not verify |

### Structural Architecture
| Item | Score |
|------|-------|
| Large prompts decomposed into atomic, single-responsibility modules | PASS — workflow has one responsibility |
| Template variables use `${VARIABLE_NAME}` syntax | PASS — `${DEBUG_DIR}`, `${USE_WORKTREES}`, `${AGENT_SKILLS_DEBUGGER}` all present |
| Modules compose at runtime via variable substitution | PASS — AGENT_SKILLS_DEBUGGER is loaded and injected at spawn time |

### Constraint Enforcement
| Item | Score |
|------|-------|
| Every restriction is paired with an equally concrete permission | FAIL — no `<constraints>` block with `<permitted>` / `<reserved_for_human_review>` pair |
| Hard exclusion lists are enumerated, not described qualitatively | N/A — no filtering task |
| Known edge cases have precedent-style rulings | FAIL — agent timeout and inconclusive cases are noted but no precedent ruling for "what counts as inconclusive" |
| Confidence thresholds are numeric, not qualitative | N/A |

### Decision Frameworks
| Item | Score |
|------|-------|
| Multi-option recommendations use explicit decision tree or comparison table | PASS — `<failure_handling>` presents three branches as explicit scenarios |
| Criteria checklists gate complex approaches | N/A — no complex approach gate needed |
| Action permissions framed around reversibility | FAIL — no reversibility framing for the UAT.md commit |

### Multi-Phase Workflows
| Item | Score |
|------|-------|
| Complex tasks organized into explicit named phases | PASS — five steps, all named |
| Required steps distinguished from type-specific steps | PASS — worktree_branch_check is marked as pre-work; parse_gaps is universal |
| Scenario-based branching handles multiple paths explicitly | PASS — `<failure_handling>` covers three failure paths |

### Memory and Continuity
| Item | Score |
|------|-------|
| Memory templates use XML tags as section labels | N/A |
| Compaction summaries include discoveries and failed approaches | N/A |
| Next steps tied to user's most recent explicit request | PASS — handoff to verify-work is unconditional and explicit |

### Modularity
| Item | Score |
|------|-------|
| Each prompt component has a single responsibility | PASS — workflow is diagnosis-only |
| Scope boundaries state both inclusions and exclusions | FAIL — `<context_efficiency>` states exclusions but there is no `<scope><include>` / `<exclude>` structure |

### Safety and Trust
| Item | Score |
|------|-------|
| Validation is at system boundaries only; internal interfaces trusted | FAIL — no input validation rule for malformed UAT.md gaps |
| Dual-use capabilities state permissions before restrictions | N/A |
| Authorization is narrow-scoped; each action confirmed before expanding scope | FAIL — `gsd-sdk query commit` runs without a confirm gate |

### Tone and Style
| Item | Score |
|------|-------|
| Size constraints use numeric limits, not qualitative descriptors | FAIL — agent return fields like "brief hint" and "specific cause" are qualitative, not bounded |
| Instructions use imperative present tense | PASS — "Read", "Build", "Spawn", "Parse", "Report" throughout |
| Working notes are in analysis tags, not user-facing output | N/A |

### Optimization
| Item | Score |
|------|-------|
| Prompt flagged as draft for automated optimization | FAIL — no optimization flag |
| Correct optimizer selected | N/A |
| Held-out test set reserved before optimization begins | N/A |

---

## Recommendations

Prioritized from highest to lowest impact on output reliability:

1. **Add `<output_format>` with exact literal-string parse guards to the debug-subagent-prompt template (Issue 2, Section 7).** This is the highest-risk gap. If the orchestrator's parse of `## ROOT CAUSE FOUND` fails silently, the entire diagnosis loop produces no UAT.md updates and the handoff to verify-work carries zero information. Add exact-string requirements and disallow formatting variation. Apply Section 22 Pattern 3 fully.

2. **Replace `<purpose>` with `<task>` + `<audience>` + `<quality_bar>` (Issue 1, Section 1 Action 1).** The task specification tags give the orchestrating model a calibrated target. Without `<quality_bar>`, the orchestrator has no way to self-check whether a run was successful before handing off. This is a two-minute edit with high fidelity payoff.

3. **Convert negative instructions to positive equivalents (Issue 3, Section 5 Action 1).** "Do NOT offer manual next steps" and "no fix application" are primary negative directives. Rewrite both as positive scope statements. This is a mechanical conversion per the guide's conversion table and removes ambiguity about what the orchestrator should do instead.

4. **Add a `<tie_breaking>` rule for ambiguous gap handling and an `<examples>` block with one complete input-to-output diagnosis mapping (Issues 4 and 5, Sections 5 and 3).** The tie-breaking rule anchors orchestrator behavior at the uncertainty boundary (sparse reason field, duplicate symptoms). The example teaches the orchestrator and debug agents the correct specificity for root_cause, artifacts, and missing fields — without it, agents calibrate against their own prior of "good diagnosis."

5. **Add a `<constraints>` block with `<permitted>` and `<reserved_for_human_review>` pairs scoping orchestrator actions (Issue 6, Section 14).** The orchestrator runs shell commands and commits files. These actions should be explicitly bounded so that the orchestrator does not inadvertently expand scope into fix application or direct git operations outside the gsd-sdk commit wrapper.
