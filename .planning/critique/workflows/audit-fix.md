# Critique: audit-fix.md

## Summary

`audit-fix.md` is a well-structured, operationally focused workflow with clear step sequencing, a useful dry-run gate, and a sound pipeline-halt-on-failure strategy. The use of named XML `<step>` tags, a `<purpose>` block, and `<success_criteria>` shows awareness of structural best practices. However, the prompt falls short of the guide's standards in several significant areas: there is no `<persona>` establishing who executes this workflow, no `<output_format>` specifying how the executor agents or the orchestrating model should format their responses, no explicit constraint enforcement using `<permitted>`/`<reserved_for_human_review>` pairs, no tie-breaking rules for the classification heuristics, and the instruction framing mixes positive and negative directive styles. The classification step in particular relies on qualitative language where numeric or categorical precision would reduce ambiguity. These gaps make the prompt less robust at the boundaries where agent judgment is required most.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Named phase pattern.** Each step is wrapped in a semantically named `<step name="...">` tag, creating clear cognitive boundaries and matching the guide's `<phase>` pattern closely.

- **Section 16 — Required vs. optional steps / pipeline halt logic.** The explicit halt-on-first-failure rule in `fix-loop` step (d) mirrors the guide's principle of distinguishing mandatory from type-specific behavior and is well-reasoned.

- **Section 4 (Formatting) — XML tags used to separate sections.** `<purpose>`, `<available_agent_types>`, `<process>`, and `<success_criteria>` all use semantically meaningful tags rather than markdown headers, improving machine parseability.

- **Section 5 (Instruction Framing) — Conditional instructions.** The `--dry-run` early-exit path ("stop here and exit") and the `--source` validation halt are clear conditional branches, consistent with Section 5's guidance on explicit conditional branching.

- **Section 14 (Constraint Enforcement) — Classification heuristics with uncertainty default.** The "err on manual-only when uncertain" rule is a well-formed tie-breaking heuristic. The enumerated auto-fixable and manual-only signal lists provide a structured decision surface.

- **Section 1 (Task Specification) — Success criteria are explicit.** The `<success_criteria>` block enumerates seven concrete pass conditions, functioning as an effective `<quality_bar>` even though it is not labeled as such.

- **Section 17 (Agent and Subagent Patterns) — Executor agent prompt is scoped.** The executor agent `Task()` call includes a "make the minimal change" constraint and a "do not refactor surrounding code" instruction, limiting blast radius as the guide recommends.

---

## Issues

### Issue 1 — No persona defined for the orchestrating agent

**Principle:** Section 6 Action 1–2 — classify and assign a specific, role-constrained persona for open-ended or decision-heavy tasks. Section 22, Pattern 1 — role identity scoped to the exact domain.

**What is missing:** The workflow gives no identity to the orchestrating agent. The classification step (step 3) requires genuine judgment — distinguishing "auto-fixable" from "manual-only" is an open-ended reasoning task where a specific persona would bias behavior toward accuracy and caution.

**Concrete fix:** Add at the top of the file, before `<process>`:

```xml
<persona>
You are an autonomous audit-to-fix pipeline coordinator. Your role is triage and safe
remediation — not comprehensive refactoring. When uncertain about fixability, classify
as manual-only. Your value is reliable, zero-regression commits, not maximizing fix count.
</persona>
```

---

### Issue 2 — No `<output_format>` for executor agent responses or final report format

**Principle:** Section 7 Action 1–2 and Section 22 Pattern 3 — output format must be specified completely and upfront, including field ordering, structure, and an example.

**What is missing:** The executor agent `Task()` call has no `<output_format>` or response structure requirement. The agent may emit verbose prose, code diffs, or a confirmation sentence — all treated identically by the pipeline, with no way to detect partial success. The final report block shows a template but no instruction tells the model to produce exactly that structure.

**Concrete fix:** Add to the `fix-loop` step's executor invocation:

```xml
<output_format>
Respond with exactly:
FIXED: {one sentence describing what was changed}
FILES: {comma-separated list of files modified}

No other text. This output is parsed by the pipeline coordinator.
</output_format>
```

And add before the `<step name="report">` block:

```xml
<output_format>
Render the final report as markdown matching the template in the report step exactly.
Do not add interpretation, caveats, or additional sections beyond those in the template.
</output_format>
```

---

### Issue 3 — Constraint block absent; no `<permitted>` / `<reserved_for_human_review>` pair

**Principle:** Section 14 — every restriction must be paired with what IS permitted, stated equally concretely. Section 15 — the reversibility framework: frame action permissions around reversibility. Section 22 Pattern 9 — tool permissions scoped to minimum required.

**What is missing:** The workflow grants no explicit constraint block. There is no statement of which file operations, git commands, or bash calls the orchestrator may take freely vs. which require confirmation. The `git commit` in the fix-loop and the `git checkout --` revert are irreversible (or hard-to-reverse) operations executed without any constraint framing.

**Concrete fix:**

```xml
<constraints>
  <take_freely>
    - Reading files and running the test suite (read-only operations)
    - Writing to files already identified in {file_refs} for the current finding
    - Running git add and git commit for auto-fixable findings after tests pass
  </take_freely>

  <confirm_with_user>
    - Any file write outside the finding's {file_refs} scope
    - Force-push, branch deletion, or git reset operations
    - Continuing the pipeline after --max is reached without explicit override
  </confirm_with_user>

  <reserved_for_human_review>
    - Manual-only findings — surface in the report; take no action
    - Any finding where classification confidence is below 80%
  </reserved_for_human_review>
</constraints>
```

---

### Issue 4 — Negative instructions not converted to positive equivalents

**Principle:** Section 5 Action 1 — convert negative instructions ("do not", "never", "avoid") to positive specifications of desired behavior before emitting any prompt.

**What is missing:** Two instructions remain in negative form:
- "Do not refactor surrounding code" (fix-loop executor prompt)
- "Do not continue to the next finding" (fix-loop step d)

**Concrete fix:**

Apply the Section 5 conversion table:

| Current (negative) | Replacement (positive) |
|---|---|
| "Do not refactor surrounding code" | "Change only the lines required to resolve this specific finding; leave all surrounding code exactly as written" |
| "do not continue to the next finding" | "Stop the pipeline immediately and proceed to the report step with the finding marked as `fix-failed`" |

---

### Issue 5 — Classification heuristics use qualitative language; no confidence threshold

**Principle:** Section 14 — confidence thresholds should be numeric, not qualitative. Section 22 Pattern 6 — for filtering tasks, specify a numeric confidence floor.

**What is missing:** The auto-fixable / manual-only heuristics are signal lists, not a decision function with a threshold. "When uncertain, always classify as manual-only" is the right direction but gives no guidance on how much uncertainty is acceptable. A finding with one auto-fixable signal and one manual-only signal has no tiebreaker beyond the general rule.

**Concrete fix:** Add a `<confidence_scoring>` block immediately after the classification heuristics:

```xml
<confidence_scoring>
  Count matched signals in each category for the finding:
  - 2+ auto-fixable signals, 0 manual-only → auto-fixable
  - 1 auto-fixable signal, 0 manual-only → auto-fixable
  - Any manual-only signal present → manual-only (manual-only signals dominate)
  - 0 signals in either category → manual-only (default)
</confidence_scoring>
```

This makes the tiebreaker deterministic rather than relying on the model's judgment at the margin.

---

### Issue 6 — No `<audience>` or task component extraction (Section 1 Action 1–2)

**Principle:** Section 1 Action 1 — extract what output is requested, why it matters, and what a correct response looks like. Section 1 Action 2 — encode the audience explicitly.

**What is missing:** The `<purpose>` block states what the workflow does but does not state who invokes it, in what context, or what success looks like from the caller's perspective. The downstream consumer of the report (developer reviewing manual-only findings, CI pipeline parsing commit messages) is never named.

**Concrete fix:** Extend the `<purpose>` block:

```xml
<purpose>
Autonomous audit-to-fix pipeline. Runs an audit, parses findings, classifies each as
auto-fixable vs manual-only, spawns executor agents for fixable issues, runs tests
after each fix, and commits atomically with finding IDs for traceability.

<audience>
Invoked by a developer or CI pipeline after a milestone audit. The developer will review
manual-only findings for design decisions. The CI pipeline may parse commit messages for
finding IDs. Outputs must be both human-readable and unambiguously structured.
</audience>

<quality_bar>
A correct run: zero broken commits, every auto-fixable finding either fixed-and-committed
or cleanly reverted, all manual-only findings surfaced with enough context for a developer
to act on them without re-running the audit.
</quality_bar>
</purpose>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide.

### Task Specification
| Item | Score |
|---|---|
| Intent, audience, and quality bar are all explicit | FAIL — intent is present; audience and quality bar are absent |
| All constraints are compatible — no conflicts | PASS — no constraint conflicts identified |

### Chain-of-Thought
| Item | Score |
|---|---|
| CoT included only for math/symbolic/multi-step logic tasks | N/A — no CoT trigger present; the task is procedural, not symbolic reasoning |
| CoT trigger used correctly | N/A |
| Reasoning elicited before answer | N/A |
| CoT traces flagged as heuristic | N/A |

### Few-Shot Examples
| Item | Score |
|---|---|
| Examples selected by semantic similarity | N/A — no few-shot examples |
| 2–5 examples total | N/A |
| Ordered simple → complex | N/A |
| Examples span diverse sub-types | N/A |
| Format consistent across examples | N/A |
| Example order fixed across evaluation runs | N/A |

### Formatting
| Item | Score |
|---|---|
| Instruction complete before formatting applied | PASS |
| Prompt sections separated by semantically named XML tags | PASS |
| At least 3 format variants tested on target model | FAIL — no evidence of format variant testing |

### Instruction Framing
| Item | Score |
|---|---|
| All negative instructions converted to positive equivalents | FAIL — "do not refactor", "do not continue" remain negative |
| Priority order explicit when multiple criteria apply | FAIL — fix-loop ordering (severity desc) is stated; classification priority when signals conflict is not |
| Tie-breaking rules match domain's cost asymmetry | PARTIAL — "err on manual-only" is correct direction but not formalized as a tie-breaking rule |

### Persona
| Item | Score |
|---|---|
| Persona included only for open-ended/stylistic tasks | FAIL — classification is judgment-heavy; persona is absent |
| Persona is specific (constrains voice/register) | FAIL — absent |
| Persona descriptor is gender-neutral | N/A — absent |

### Output Format
| Item | Score |
|---|---|
| Structured output tasks use two-step reasoning-then-format | FAIL — executor agent has no output format specification |
| Single-call JSON places reasoning fields before answer fields | N/A |
| Constrained decoding only after free-form has failed | N/A |
| Machine-parsed output uses exact format specification | FAIL — commit messages and executor responses are machine-consumed but only partially specified |

### Context Placement
| Item | Score |
|---|---|
| Task instruction at start of prompt | PASS — `<purpose>` leads |
| Primary document or input at end of prompt | PASS — `<success_criteria>` closes |
| Background context in the middle | PASS |
| All irrelevant context removed | PASS |
| Time-sensitive injected context labeled as snapshot | N/A |

### Self-Consistency
| Item | Score |
|---|---|
| Self-consistency applied only to tasks with single correct answer | N/A |
| Inference budget permits 15–20 samples | N/A |

### Prompt Length
| Item | Score |
|---|---|
| Redundant instructions and repeated context removed | PASS — no notable redundancy |
| Long prompts compressed before sending | N/A |
| RAG context is extracted relevant passage only | N/A |

### System/User Split
| Item | Score |
|---|---|
| Persistent instructions in system prompt | N/A — workflow file, not split prompt |
| Task-specific instructions in user prompt | N/A |
| Each instruction in exactly one location | PASS |
| Safety-critical constraints have external validation | FAIL — no external validation of commits or reverts stated |

### Agent and Subagent
| Item | Score |
|---|---|
| Agent prompts are fully self-contained | FAIL — executor `Task()` prompt is minimal; missing conventions, file context format, and output format |
| All file paths in agent output are absolute | FAIL — `{file_refs}` and `{changed_files}` placeholders do not enforce absolute paths |
| Parallel agents launched in a single message block | PASS — sequential by design (halt-on-failure requires it) |
| Adversarial probes specified for verification agents | N/A — this is a fix pipeline, not a verification agent |

### Structural Architecture
| Item | Score |
|---|---|
| Large prompts decomposed into atomic, single-responsibility modules | PASS — steps are well-isolated |
| Template variables use `${VARIABLE_NAME}` syntax | FAIL — uses `{variable}` brace syntax inconsistently; guide standard is `${VARIABLE_NAME}` |
| Modules compose at runtime via variable substitution | N/A |

### Constraint Enforcement
| Item | Score |
|---|---|
| Every restriction paired with equally concrete permission | FAIL — no `<constraints>` block |
| Hard exclusion lists enumerated | FAIL — manual-only category is described, not enumerated as an exclusion list |
| Known edge cases have precedent-style rulings | FAIL — no `<precedents>` block |
| Confidence thresholds are numeric | FAIL — classification uses qualitative signal matching only |

### Decision Frameworks
| Item | Score |
|---|---|
| Multi-option recommendations use explicit decision tree or table | PARTIAL — classification heuristics are a signal list, not a decision tree |
| Criteria checklists gate complex approaches | FAIL — no `<criteria>` block gating the fix-loop entry |
| Action permissions framed around reversibility | FAIL — no reversibility framing |

### Multi-Phase Workflows
| Item | Score |
|---|---|
| Complex tasks organized into explicit named phases | PASS |
| Required steps distinguished from type-specific steps | PASS — dry-run exit is distinguished; halt-on-failure is distinct |
| Scenario-based branching handles multiple paths explicitly | PARTIAL — dry-run and supported-source branches are explicit; classification-ambiguity branch is not |

### Memory and Continuity
| Item | Score |
|---|---|
| Memory templates use XML tags as section labels | N/A |
| Compaction summaries include discoveries and failed approaches | N/A |
| Next steps tied to user's most recent explicit request | N/A |

### Modularity
| Item | Score |
|---|---|
| Each prompt component has a single responsibility | PASS |
| Scope boundaries state both inclusions and exclusions | FAIL — `<available_agent_types>` lists what is available but does not state what agent types are excluded |

### Safety and Trust
| Item | Score |
|---|---|
| Validation at system boundaries; internal interfaces trusted | PARTIAL — test-pass gate before commit is a form of boundary validation; no explicit trust model stated |
| Dual-use capabilities state permissions before restrictions | FAIL — no constraint block; restrictions (halt, revert) are stated without corresponding permissions |
| Authorization narrow-scoped; each action confirmed before expanding scope | FAIL — git commit and revert are taken without explicit user confirmation scope |

### Tone and Style
| Item | Score |
|---|---|
| Size constraints use numeric limits | PASS — `--max N` default 5, `tail -20` are numeric |
| Instructions use imperative present tense | PASS — "Extract flags", "Display the classification table", "Present the final summary" |
| Working notes in analysis tags, not user-facing output | N/A |

### Optimization
| Item | Score |
|---|---|
| Prompt flagged as draft for automated optimization | FAIL |
| Correct optimizer selected | FAIL — multi-step pipeline; MIPROv2 would be appropriate |
| Held-out test set reserved before optimization begins | FAIL |

---

## Recommendations

Listed in priority order by estimated impact on agent reliability.

### 1. Add a `<constraints>` block with reversibility framing (HIGH IMPACT)

The pipeline takes irreversible git actions (commit, checkout revert) without any constraint envelope. This is the highest-risk gap. A `<constraints>` block using `<take_freely>` / `<confirm_with_user>` / `<reserved_for_human_review>` (Section 14, Section 15) would make the blast radius explicit and give the orchestrating agent a clear decision surface for edge cases not covered by the step instructions.

### 2. Add `<output_format>` to the executor agent `Task()` call (HIGH IMPACT)

The executor agent's response is currently unstructured. The pipeline coordinator has no way to distinguish a successful one-line fix from a verbose refactor that incidentally fixes the finding. An exact output format specification (Section 7, Section 22 Pattern 3) makes the agent's output parseable and the pipeline's behavior deterministic.

### 3. Add a `<persona>` for the orchestrating agent (MEDIUM IMPACT)

The classification step is the judgment-heaviest part of the pipeline. A domain-specific persona biasing toward caution and minimum-change philosophy (Section 6, Section 22 Pattern 1) would improve consistency on ambiguous findings — the cases where the current heuristics leave the most room for model variance.

### 4. Formalize classification heuristics with a `<confidence_scoring>` block (MEDIUM IMPACT)

The current signal lists are good but leave the tiebreaker implicit. Converting them to a numeric scoring rule (Section 14, Section 22 Pattern 6) eliminates the model's latitude at the uncertainty boundary — exactly where errors are most likely and most costly.

### 5. Convert negative instructions to positive form and enforce absolute file paths (LOW IMPACT, HIGH CORRECTNESS)

Two negative instructions ("do not refactor", "do not continue") should be converted per Section 5 Action 1. The `{file_refs}` and `{changed_files}` placeholders should be explicitly documented as requiring absolute paths per Section 17, to prevent silent failures when the executor agent's working directory differs from the coordinator's.
