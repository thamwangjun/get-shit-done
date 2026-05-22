# Critique: plan-milestone-gaps.md

## Summary

`plan-milestone-gaps.md` is a competent procedural workflow that covers the right functional ground — loading audit results, prioritizing gaps, grouping them, confirming with the user, and updating planning artifacts. The step-by-step numbered structure is clear and the gap-to-phase mapping appendix is a genuinely useful calibrating example. However, the workflow falls short of the guide's standards in several structural areas: it uses prose headers and code fences instead of semantic XML tags, supplies no explicit persona or quality bar, relies on vague conditional language where explicit branching is required, omits output format specification for user-facing confirmations, and carries several negative-framing instructions that should be converted to positive equivalents. These are mostly fixable with mechanical rewrites; the underlying logic is sound.

---

## Strengths

- **Section 3 / Pattern 2 — Calibrating examples provided.** The `<gap_to_phase_mapping>` appendix shows three concrete YAML examples (requirement gap, integration gap, flow gap) that demonstrate exactly what a useful input-to-output transformation looks like. This anchors the model's behavior against concrete cases rather than leaving "grouping" abstract.

- **Section 16 — Multi-phase workflow with explicit phases.** The 10-step numbered process creates clear cognitive checkpoints. Steps 5 and 9 ("present plan, wait for confirmation" and "commit") are correctly sequenced gates that prevent premature execution — aligned with the guide's phase pattern.

- **Section 16 — Scenario-based branching (partial).** The early-exit error condition at Step 1 ("If no audit file exists… error:") handles one explicit scenario rather than leaving the model to infer behavior. This is the right instinct, though it is not exhaustive (see Issues).

- **Section 15 — Decision table for prioritization.** The `must / should / nice` priority table in Step 2 is a clean, machine-readable decision framework that makes the model's triage logic explicit and consistent.

- **Section 22, Pattern 2 — Abstract grouping rules paired with examples.** The "Grouping rules" bullet list in Step 3 is immediately followed by a concrete "Example grouping" block. This pattern correctly pairs qualitative instructions with demonstrative output.

- **Section 23 — Success criteria checklist present.** The `<success_criteria>` block at the end is a well-structured completeness gate. Each item is specific and verifiable.

---

## Issues

### Issue 1: No semantic XML structure on prompt sections
**Guide reference:** Section 4 Action 2; Section 4 XML tag vocabulary

**What's wrong:** The entire workflow body is structured with markdown prose headers (`## 1. Load Audit Results`) and code fences rather than semantically named XML tags. The guide states XML tags are "strictly better than markdown headers or `---` delimiters for Claude-class models" because the tag name carries semantic meaning and the structure is unambiguous and machine-parseable. The top-level `<purpose>`, `<required_reading>`, `<process>`, `<gap_to_phase_mapping>`, and `<success_criteria>` tags are a good start — but the content inside `<process>` is flat prose with no tag-level semantic structure for the individual phases.

**Concrete fix:** Wrap the 10 steps as `<phase>` elements with `id` and `name` attributes:

```xml
<phase id="1" name="Load Audit Results">
  ...
</phase>

<phase id="5" name="Present Gap Closure Plan" trigger="after_grouping">
  ...
</phase>
```

This makes phase boundaries machine-parseable and aligns with Section 16's phase pattern.

---

### Issue 2: No persona or quality bar defined
**Guide reference:** Section 1 Action 1–2; Section 6 Action 1–2; Section 22 Pattern 1

**What's wrong:** The workflow contains no `<persona>` block and no `<quality_bar>` block. Section 1 requires that a prompt make explicit what output is being requested, why it matters, and what a correct response looks like. Section 6 Action 2 specifies that a persona must constrain register, voice, or domain-specific style. Without these, the model defaults to generic assistant behavior. For a workflow whose output — gap-closure phases in ROADMAP.md — will gate a milestone, the quality bar for what constitutes a "good" phase grouping is entirely implicit.

**Concrete fix:** Add at the top of the file:

```xml
<persona>
You are a milestone planning specialist. Your role is to translate audit gaps into
well-scoped, dependency-ordered phases that close exactly the identified shortfalls —
no more, no less.
</persona>

<quality_bar>
A correct output is a set of phases where: (1) every must/should gap maps to exactly
one phase task, (2) phases are focused (2–4 tasks each), (3) no gap is double-counted
across phases, and (4) ROADMAP.md and REQUIREMENTS.md are updated atomically.
</quality_bar>
```

---

### Issue 3: Negative instructions not converted to positive equivalents
**Guide reference:** Section 5 Action 1

**What's wrong:** The grouping rules in Step 3 include implicit negatives ("Keep phases focused: 2-4 tasks each" is fine, but the framing of the priority table — "ask user: include or defer?" — leaves undefined what to do when the user says neither). More critically, Step 6's ROADMAP.md update instruction says "Add new phases to current milestone" without specifying what must NOT be touched — making it ambiguous whether existing phase entries should be modified. This is a constraint gap, not a negative instruction, but it produces the same risk: undefined behavior at the margin.

**Concrete fix:** Apply Section 14's structure-preservation pattern:

```xml
<constraints>
  <preserve>
    All existing phase entries in ROADMAP.md exactly as written.
    All existing requirement checkboxes and their current state.
  </preserve>
  <update>
    Only: new gap-closure phase entries appended after the current last phase.
    Only: traceability table rows for REQ-IDs explicitly listed in the audit gaps.
  </update>
</constraints>
```

---

### Issue 4: Scenario branching is incomplete — only the failure path is handled
**Guide reference:** Section 16 — Scenario-based branching; Section 5 — Conditional instructions

**What's wrong:** Step 1 handles the "no audit file" failure scenario with an explicit error message. But the workflow does not handle other equally likely scenarios: (a) the audit file exists but has zero gaps (clean audit), (b) the user responds "adjust" to the confirmation prompt in Step 5, (c) the user responds "defer all optional" with no must/should gaps remaining. These paths are mentioned inline ("yes / adjust / defer all optional") but have no defined behavior branches. The guide (Section 16) requires explicit `<scenario condition="...">` blocks.

**Concrete fix:**

```xml
<scenarios>
  <scenario condition="audit_has_no_gaps">
    Inform the user: "Audit shows no gaps. Milestone is complete — run
    `/gsd-complete-milestone` to archive."
    Stop. Take no further action.
  </scenario>

  <scenario condition="user_responds_adjust">
    Re-present the grouping plan with each proposed phase as an individually
    adjustable item. Accept per-phase changes, then proceed to Step 6.
  </scenario>

  <scenario condition="user_defers_all_optional_and_no_must_gaps_remain">
    Inform the user: "No required gaps remain. Milestone is ready for
    `/gsd-complete-milestone`." Stop.
  </scenario>
</scenarios>
```

---

### Issue 5: Output format for the user-facing confirmation block is underspecified
**Guide reference:** Section 7 — Output Format Handling; Section 22 Pattern 3

**What's wrong:** Step 5's "Gap Closure Plan" markdown template is the primary user-facing output — and its format is correct in broad strokes. However, it omits: (a) what to do when there are zero integration gaps or zero flow gaps (does the section header disappear?), (b) whether phase task counts are mandatory or optional fields, (c) whether the "Deferred" section is omitted if there are no nice-to-have gaps. Unspecified optional fields produce inconsistent output across runs, which degrades downstream parseability.

**Concrete fix:** Add an explicit output format specification using the guide's field-instruction embedding pattern (Section 7):

```xml
<output_format>
Present the Gap Closure Plan using this exact structure. Omit a section entirely
if it has no items — do not render the header with "(none)".

Fields marked [required] must always appear. Fields marked [conditional] appear
only when the condition is true.

- Milestone version [required]
- Gaps to close: N requirements, M integration, K flows [required; use 0 if none]
- Proposed Phases [required; at least one]
  - Phase number and name [required]
  - "Closes:" list of REQ-IDs and gap types [required]
  - Task count [required]
- Deferred section [conditional: only if nice-to-have gaps exist]
- Confirmation prompt line [required]
</output_format>
```

---

### Issue 6: `gsd-sdk query` commands are not real — hallucination risk
**Guide reference:** Section 1 Action 3 — constraint consistency; Section 14 — constraint enforcement

**What's wrong:** Steps 4 and 9 reference `gsd-sdk query phases.list` and `gsd-sdk query commit` commands. These appear to be invented pseudo-API calls that do not correspond to real shell commands. If the model follows these instructions literally, it will attempt to run nonexistent commands and fail silently or error. This is a concrete constraint inconsistency: the workflow instructs bash execution but references commands that are not in the codebase's actual tooling.

**Concrete fix:** Replace pseudo-API calls with the real bash equivalents shown in the guide's runtime context injection pattern (Section 8):

```bash
# Step 4: find highest phase
HIGHEST=$(ls -d .planning/phases/[0-9]* 2>/dev/null | sort -V | tail -1 | xargs basename | cut -d'-' -f1)

# Step 9: commit
git add .planning/ROADMAP.md .planning/REQUIREMENTS.md
git commit -m "docs(roadmap): add gap closure phases ${FIRST}-${LAST}"
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide. Items are scored for the workflow file as-is.

### Task Specification
| Item | Score | Notes |
|------|-------|-------|
| Intent, audience, and quality bar are all explicit | FAIL | Purpose is present; audience and quality bar are absent |
| All constraints are compatible — no conflicts | PASS | No detected constraint conflicts |

### Chain-of-Thought
| Item | Score | Notes |
|------|-------|-------|
| CoT included only for math/symbolic/multi-step logic | N/A | This is a workflow file, not a reasoning prompt |
| CoT trigger used correctly | N/A | |
| Reasoning elicited before answer | N/A | |
| CoT traces treated as heuristic | N/A | |

### Few-Shot Examples
| Item | Score | Notes |
|------|-------|-------|
| Examples selected by semantic similarity | N/A | Examples are illustrative, not retrieval-based |
| 2–5 examples total | PASS | Three gap-to-phase examples provided |
| Ordered simple → complex | FAIL | Examples are ordered by gap type, not complexity |
| Examples span diverse sub-types | PASS | Requirement, integration, and flow gaps covered |
| Format consistent across all examples | PASS | All use the same YAML input → YAML output structure |
| Example order fixed across evaluation runs | N/A | |

### Formatting
| Item | Score | Notes |
|------|-------|-------|
| Instruction complete before formatting applied | PASS | |
| Prompt sections separated by semantically named XML tags | FAIL | Top-level tags exist; internal process steps use markdown headers |
| At least 3 format variants tested on target model | FAIL | No evidence of format variant testing |

### Instruction Framing
| Item | Score | Notes |
|------|-------|-------|
| Negative instructions converted to positive equivalents | FAIL | Preservation constraints for ROADMAP.md are not stated positively |
| Priority order explicit when multiple criteria apply | PASS | must/should/nice table is present |
| Tie-breaking rules match domain cost asymmetry | FAIL | No tie-breaking rule for when to combine vs. split gaps into phases |

### Persona
| Item | Score | Notes |
|------|-------|-------|
| Persona included only for open-ended or stylistic tasks | N/A | No persona present; one is warranted given the judgment required |
| Persona is specific (constrains voice/register) | FAIL | No persona defined |
| Persona descriptor is gender-neutral | N/A | |

### Output Format
| Item | Score | Notes |
|------|-------|-------|
| Structured output tasks use reasoning-then-format approach | N/A | Not a structured-output task |
| Single-call JSON places reasoning before answer fields | N/A | |
| Constrained decoding adopted only after free-form proven insufficient | N/A | |
| Machine-parsed output uses exact format specification | FAIL | Step 5 confirmation template has underspecified optional fields |

### Context Placement
| Item | Score | Notes |
|------|-------|-------|
| Task instruction at start of prompt | PASS | `<purpose>` leads the file |
| Primary document or input at end of prompt | FAIL | `<gap_to_phase_mapping>` and `<success_criteria>` are at the end but the primary input (audit file) is loaded inside the process steps, not placed architecturally last |
| Background context in the middle | PASS | |
| All irrelevant context removed | PASS | File is focused |
| Time-sensitive injected context labeled as snapshot | N/A | |

### Self-Consistency
| Item | Score | Notes |
|------|-------|-------|
| Applied only to tasks with a single correct answer | N/A | |
| Inference budget permits 15–20 samples | N/A | |

### Prompt Length
| Item | Score | Notes |
|------|-------|-------|
| Redundant instructions and repeated context removed | PASS | No obvious duplication |
| Long prompts compressed before sending | N/A | |
| RAG context is extracted relevant passage only | N/A | |

### System/User Split
| Item | Score | Notes |
|------|-------|-------|
| Persistent instructions in system prompt | N/A | Workflow file; not split into system/user |
| Task-specific instructions in user prompt | N/A | |
| Each instruction appears in exactly one location | PASS | |
| Safety-critical constraints have external validation | FAIL | No external validation of ROADMAP.md update correctness |

### Agent/Subagent
| Item | Score | Notes |
|------|-------|-------|
| Agent prompts fully self-contained | PASS | `<required_reading>` references execution context |
| All file paths in agent output are absolute | FAIL | File paths in examples use relative paths (`.planning/phases/...`) |
| Parallel agents launched in single message block | N/A | |
| Adversarial probes specified for verification agents | N/A | |

### Structural Architecture
| Item | Score | Notes |
|------|-------|-------|
| Large prompts decomposed into atomic single-responsibility modules | FAIL | Workflow is monolithic; gap-to-phase mapping could be a separate module |
| Template variables use `${VARIABLE_NAME}` syntax | PASS | `${PROJECT_CODE}`, `${PROJECT_TITLE}` used in Step 10 |
| Modules compose at runtime via variable substitution | N/A | |

### Constraint Enforcement
| Item | Score | Notes |
|------|-------|-------|
| Every restriction paired with equally concrete permission | FAIL | ROADMAP.md preservation constraints not paired with explicit permissions |
| Hard exclusion lists enumerated, not described qualitatively | FAIL | No exclusion list for what gaps should NOT be turned into phases |
| Known edge cases have precedent-style rulings | FAIL | No precedents for ambiguous gap types |
| Confidence thresholds are numeric, not qualitative | N/A | |

### Decision Frameworks
| Item | Score | Notes |
|------|-------|-------|
| Multi-option recommendations use explicit decision tree or comparison table | PASS | Priority table present |
| Criteria checklists gate complex approaches | FAIL | No criteria checklist before gap-to-phase assignment |
| Action permissions framed around reversibility | FAIL | Commit step (Step 9) is irreversible; no confirmation gating |

### Multi-Phase Workflows
| Item | Score | Notes |
|------|-------|-------|
| Complex tasks organized into explicit named phases | FAIL | Steps use prose numbers, not `<phase>` XML tags |
| Required steps distinguished from type-specific steps | FAIL | No `<required_steps universal="true">` distinction |
| Scenario-based branching handles multiple paths explicitly | FAIL | Only one scenario (no audit file) is explicitly handled |

### Memory and Continuity
| Item | Score | Notes |
|------|-------|-------|
| Memory templates use XML tags as section labels | N/A | No memory template in this workflow |
| Compaction summaries include discoveries and failed approaches | N/A | |
| Next steps tied to user's most recent explicit request | PASS | Step 10 offers exactly the next logical command |

### Modularity
| Item | Score | Notes |
|------|-------|-------|
| Each prompt component has a single responsibility | FAIL | `<process>` handles loading, prioritizing, grouping, confirming, updating, and committing — six distinct concerns |
| Scope boundaries state both inclusions and exclusions | FAIL | Only inclusions stated; no explicit exclusions |

### Safety and Trust
| Item | Score | Notes |
|------|-------|-------|
| Validation at system boundaries only; internal interfaces trusted | PASS | |
| Dual-use capabilities state permissions before restrictions | N/A | |
| Authorization narrow-scoped; each action confirmed before expanding | FAIL | Step 6 (ROADMAP update) and Step 7 (REQUIREMENTS reset) execute without per-action confirmation after the single Step 5 gate |

### Tone and Style
| Item | Score | Notes |
|------|-------|-------|
| Size constraints use numeric limits, not qualitative descriptors | PASS | "2–4 tasks each" is numeric |
| Instructions use imperative present tense | PASS | "Parse YAML frontmatter", "Group gaps by priority" |
| Working notes in analysis tags, not user-facing output | N/A | |

### Optimization
| Item | Score | Notes |
|------|-------|-------|
| Prompt flagged as draft for automated optimization | FAIL | Not flagged |
| Correct optimizer selected | FAIL | Not addressed |
| Held-out test set reserved before optimization | FAIL | Not addressed |

---

## Recommendations

Prioritized from highest to lowest impact.

### 1. Add complete scenario branching (Section 16; highest impact)

The missing scenario handlers — clean audit, user "adjust" response, user "defer all optional" — are the most likely failure modes in production. A model that encounters an unhandled path will improvise, producing inconsistent behavior. Add explicit `<scenario condition="...">` blocks for all three missing cases before any other changes.

### 2. Wrap process steps as `<phase>` XML elements (Section 4 Action 2, Section 16)

Converting the 10 prose-numbered steps to `<phase id="N" name="...">` elements is a mechanical rewrite that immediately improves model adherence to phase boundaries and makes the workflow machine-parseable. This is the single formatting change with the broadest effect. While doing this, add `<required_steps universal="true">` for steps that always run (1, 2, 6, 7, 9) to distinguish them from the conditional ones (5, 10).

### 3. Add persona and quality bar (Section 1 Action 1, Section 6 Action 2)

Without a persona, the model has no anchor for what "a good gap-closure plan" looks like in terms of scope and judgment. The quality bar (2–4 tasks per phase, no gap double-counted, atomic commit) is implicit in the body but not stated upfront. These additions take fewer than 10 lines and eliminate ambiguity about the standard being targeted.

### 4. Replace `gsd-sdk query` pseudo-commands with real shell equivalents (Section 1 Action 3)

The invented `gsd-sdk query phases.list` and `gsd-sdk query commit` calls are a latent correctness bug. They look like real commands but are not. Replacing them with the actual bash equivalents (`ls -d .planning/phases/...` and `git commit`) eliminates a failure mode that is silent in testing but will break in the field.

### 5. Specify output format for the Step 5 confirmation block (Section 7, Section 22 Pattern 3)

The confirmation template in Step 5 has unspecified optional fields that will produce output variation across runs. Adding an explicit `<output_format>` block with field-level conditionality rules (omit section if empty, mandatory vs. conditional fields) locks output structure and makes the confirmation parseable downstream.
