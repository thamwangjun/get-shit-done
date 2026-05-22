# Critique: inbox.md

## Summary

`inbox.md` is a well-structured, operationally complete workflow that handles a genuinely complex multi-step triage task. It demonstrates strong process decomposition, concrete checklists, and sensible branching logic. However, it underperforms on core prompt engineering fundamentals from the guide: it uses no XML tag vocabulary for prompt-level structure (instead leaning on `<step>` tags that double as both structure and instruction), it lacks an explicit persona with strengths enumeration, it defines no output format constraints with numeric limits, it contains no few-shot calibrating examples, and several instructions are framed negatively or left underspecified in ways that will produce inconsistent model behavior. The workflow reads as a product specification document rather than a prompt engineered for reliable LLM execution.

---

## Strengths

- **Section 16 — Multi-phase workflow pattern applied correctly.** The workflow decomposes into named, ordered steps (`preflight`, `fetch_issues`, `review_issues`, `fetch_prs`, `review_prs`, `check_gates`, `generate_report`, `auto_actions`, `report`) with clear cognitive boundaries. Each step has a single responsibility and a clear trigger condition.

- **Section 16 — Scenario-based branching.** Flag parsing (`--issues`, `--prs`, `--label`, `--close-incomplete`) drives explicit conditional behavior. The `Skip if REVIEW_ISSUES=false` guards are direct and machine-actionable.

- **Section 15 — Comparison tables used well.** The label-to-template mapping tables (e.g., `feature-request → feature_request.yml`) and body-pattern-to-PR-type tables are correctly structured and reduce ambiguity.

- **Section 5 — Conditional instructions applied.** The flag-parsing logic in `preflight` and the conditional `Skip if` guards follow the guide's conditional instruction pattern cleanly.

- **Section 14 — Concrete checklist criteria.** The per-type review checklists (Feature Request, Enhancement, Bug, Chore, Feature PR, Enhancement PR, Fix PR) enumerate specific required fields rather than describing them qualitatively. This is high-signal for the model.

- **Section 19 — Single-responsibility scope.** The workflow's scope is tightly bounded to triage — it does not attempt to fix the issues it finds, only report and optionally label/close them.

- **Section 22 Pattern 3 — Output format specified upfront.** The `generate_report` step provides a concrete ASCII template for the triage report, eliminating structural ambiguity.

- **Section 20 — Safety gating before destructive actions.** The `auto_actions` step requires explicit user confirmation via `AskUserQuestion` before closing any items, which correctly handles irreversible actions per the reversibility framework (Section 15).

---

## Issues

### Issue 1: No persona defined
**Principle:** Section 6 Action 1–2; Section 22 Pattern 1.

**What's wrong:** The workflow has no `<persona>` block. For a task requiring classification judgment (e.g., "attempt to classify from body content when no label is present"), the model's default behavior will be unpredictable. A persona scoped to the exact role — a contribution compliance reviewer — would bias it toward consistent, rule-bound classification rather than generalist assistant behavior.

**Fix:** Add a persona block as the first element of the prompt, before `<purpose>`:

```xml
<persona>
You are a contribution compliance reviewer for an open-source project.

Your strengths:
- Classifying GitHub issues and PRs against defined templates with consistent criteria
- Identifying missing required fields without inferring or inventing content
- Applying gate rules strictly — a partial approval is not an approval
- Producing structured triage reports that are scannable and actionable
</persona>
```

---

### Issue 2: No `<output_format>` block with numeric size constraints
**Principle:** Section 7 Action 1; Section 21 (size constraints as hard rules); Section 22 Pattern 3.

**What's wrong:** The report format is defined inside the `generate_report` step via an embedded ASCII template. This mixes the task instruction with the output specification. More critically, there are no numeric constraints on field lengths — e.g., how long the "Missing:" line should be, whether titles should be truncated, how many items to show in "Stale Items". Qualitative absence means the model fills gaps with its own priors.

**Fix:** Add a top-level `<output_format>` block specifying: report sections are rendered in the order shown; each "Missing:" entry is one line per field, max 80 characters; issue/PR titles are truncated to 60 characters; the final console summary block uses the exact template shown. Pull the ASCII template out of `generate_report` and into this block.

---

### Issue 3: No few-shot examples for classification judgment calls
**Principle:** Section 3 Action 1–3; Section 22 Pattern 2.

**What's wrong:** The body-content classification heuristics (`Contains "### Feature name" → likely Feature`) are abstract pattern rules with no examples. When a body is ambiguous — e.g., it contains both a feature name section and an enhancement improvement section — the model has no calibrating example to anchor its decision. The instruction for the `needs-triage` fallback is similarly unanchored.

**Fix:** Add an `<examples>` block inside `fetch_issues`, demonstrating the classification decision for at least two representative cases: one clean match and one ambiguous case that falls through to `needs-triage`. Per Section 3 Action 3, order simple → complex, with the ambiguous case last.

```xml
<examples>
  <example>
    <input>Body contains "### Feature name: Dark mode toggle" and label: feature-request</input>
    <output>Type: Feature. Template: feature_request.yml. No triage needed.</output>
    <commentary>Exact label match takes precedence over body inference.</commentary>
  </example>
  <example>
    <input>Body contains both "### What existing feature" and "### Feature name". No labels.</input>
    <output>Type: needs-triage. Cannot determine — two competing section patterns present.</output>
    <commentary>When body signals conflict, always fall through to needs-triage rather than guessing.</commentary>
  </example>
</examples>
```

---

### Issue 4: Negative instructions not converted to positive equivalents
**Principle:** Section 5 Action 1.

**What's wrong:** Several instructions are framed as negatives or passive avoidances:
- `"If no repo detected: error — must be in a git repo..."` — this states what to reject without specifying the positive recovery path.
- The implied instruction behind `check_gates` is essentially "do not proceed if the gate is missing," stated indirectly.
- `"Not using --no-verify or skipping hooks"` (Cross-cutting PR Checks) is a negated behavioral rule.

**Fix:** Apply the Section 5 conversion table mechanically:
- `"Not using --no-verify"` → `"Verify that all commits were made with hooks enabled: confirm the PR body contains no --no-verify flags and no skip-hooks language"`
- `"If no repo detected: error"` → `"Confirm the working directory is a git repo with a GitHub remote before proceeding. If confirmation fails, print setup instructions and stop."`

---

### Issue 5: No `<audience>` or `<quality_bar>` defined
**Principle:** Section 1 Action 1–2; the `<audience>` and `<quality_bar>` XML tags from Section 4.

**What's wrong:** The workflow does not specify who will consume the triage report or what "high quality" looks like. The report is presumably consumed by a project maintainer performing triage. Without this, the model may pitch the report at the wrong level — e.g., over-explaining fields to a non-technical reader, or under-flagging nuanced gate violations that a maintainer would act on.

**Fix:** Add audience and quality bar explicitly near the top of the prompt:

```xml
<audience>
Project maintainers performing weekly contribution triage. They are familiar with the
issue templates and gate rules. They need actionable findings, not explanations of the
templates themselves.
</audience>

<quality_bar>
A high-quality triage report: (1) surfaces gate violations at the top, (2) lists missing
fields by name — not as summaries — so the contributor knows exactly what to add,
(3) produces zero false positives on completeness scoring by checking each required field
literally, not by inference.
</quality_bar>
```

---

### Issue 6: Completeness scoring rubric uses qualitative bands — no tie-breaking rule
**Principle:** Section 5 (tie-breaking rules); Section 14 (confidence thresholds as numeric, not qualitative).

**What's wrong:** The scoring bands (COMPLETE, MOSTLY COMPLETE, INCOMPLETE, REJECT) are defined by percentage ranges (100%, 75–99%, 50–74%, <50%), but there is no tie-breaking rule at the boundary. An issue scoring exactly 75% could be MOSTLY COMPLETE or INCOMPLETE depending on model interpretation. More critically, the guide (Section 22 Pattern 4) requires tie-breaking rules to match the domain's cost asymmetry: in a contribution-gate context, false acceptance (marking COMPLETE when incomplete) is more costly than false rejection.

**Fix:** Add a tie-breaking block:

```xml
<tie_breaking>
When an issue or PR scores exactly on a boundary (e.g., exactly 75%), classify it in
the lower band (INCOMPLETE, not MOSTLY COMPLETE). In a contribution gate context,
under-reporting completeness is safer than over-reporting it.
</tie_breaking>
```

---

### Issue 7: `<step>` tags used as both structure and instruction — non-standard tag vocabulary
**Principle:** Section 4 Action 2; Section 4 XML tag vocabulary.

**What's wrong:** The workflow uses `<step name="...">` tags to organize phases, but `<step>` is not in the guide's tag vocabulary. The guide specifies `<phase id="..." name="..." trigger="...">` for named stages in multi-step workflows (Section 16). Using an off-vocabulary tag means the model cannot leverage its trained understanding of the tag's semantics, and composed prompts using standard tag vocabulary will not interoperate cleanly with this workflow.

**Fix:** Replace `<step name="preflight">` with `<phase id="1" name="Preflight" trigger="always">` and so on for each step, following the Section 16 phase pattern. This also enables the `trigger` attribute to formally encode the `Skip if` conditions currently stated in prose.

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide. N/A items are marked where the checklist item is structurally inapplicable to a workflow-type prompt (e.g., self-consistency, RAG).

### Task Specification
| Item | Status | Notes |
|---|---|---|
| Intent, audience, and quality bar are all explicit | FAIL | `<purpose>` states intent but audience and quality bar are absent |
| All constraints are compatible — no conflicts | PASS | No constraint conflicts detected |

### Chain-of-Thought
| Item | Status | Notes |
|---|---|---|
| CoT included only for math/symbolic/multi-step logic | N/A | No CoT trigger used — appropriate for a process workflow |
| CoT trigger used correctly | N/A | |
| Reasoning elicited before answer | N/A | |
| CoT traces treated as heuristic | N/A | |

### Few-Shot Examples
| Item | Status | Notes |
|---|---|---|
| Examples selected by semantic similarity | FAIL | No examples provided |
| 2–5 examples total | FAIL | Zero examples |
| Ordered simple → complex | FAIL | No examples to order |
| Examples span diverse sub-types | FAIL | No examples |
| Format consistent across examples | N/A | No examples |
| Example order fixed across evaluation runs | N/A | No examples |

### Formatting
| Item | Status | Notes |
|---|---|---|
| Instruction complete before formatting applied | PASS | Prose instructions precede structure |
| Prompt sections separated by semantically named XML tags | FAIL | Uses non-vocabulary `<step>` tags; missing `<phase>`, `<persona>`, `<audience>`, `<output_format>` |
| At least 3 format variants tested | FAIL | No evidence of format variant testing |

### Instruction Framing
| Item | Status | Notes |
|---|---|---|
| Negative instructions converted to positive | FAIL | Multiple negative constructs remain (see Issue 4) |
| Priority order explicit when multiple criteria apply | PASS | Gate violations are explicitly stated as highest priority |
| Tie-breaking rules match domain's cost asymmetry | FAIL | No tie-breaking rule at scoring band boundaries |

### Persona
| Item | Status | Notes |
|---|---|---|
| Persona included only for open-ended/stylistic tasks | FAIL | Classification judgment tasks benefit from persona; none defined |
| Persona is specific (constrains voice/register) | FAIL | No persona |
| Persona descriptor is gender-neutral | N/A | No persona to evaluate |

### Output Format
| Item | Status | Notes |
|---|---|---|
| Structured output uses two-step reasoning-then-format | N/A | Single-workflow execution, not a reasoning task |
| Single-call JSON places reasoning before answer fields | N/A | Output is markdown report, not JSON |
| Constrained decoding adopted only after free-form proven insufficient | N/A | |
| Machine-parsed output uses exact format specification | PASS | ASCII report template is concrete and literal |

### Context Placement
| Item | Status | Notes |
|---|---|---|
| Task instruction at start of prompt | FAIL | `<purpose>` is first but it is a description, not an instruction; no imperative lead |
| Primary document/input at end | N/A | No document input; workflow operates on live API data |
| Background context in middle | PASS | `<required_reading>` (background) precedes `<process>` (instruction) — acceptable ordering |
| Irrelevant context removed | PASS | No padding or tangential content detected |
| Time-sensitive injected context labeled as snapshot | N/A | No injected context |

### Self-Consistency
| Item | Status | Notes |
|---|---|---|
| Applied only to tasks with single correct answer | N/A | Not applicable to a process workflow |
| Inference budget permits 15–20 samples | N/A | |

### Prompt Length
| Item | Status | Notes |
|---|---|---|
| Redundant instructions removed | PASS | No obvious redundancy |
| Long prompts compressed before sending | N/A | Not a long-context task |
| RAG context is extracted passage only | N/A | |

### System/User Split
| Item | Status | Notes |
|---|---|---|
| Persistent instructions in system prompt | N/A | Workflow file, not a split prompt |
| Task-specific instructions in user prompt | N/A | |
| Each instruction in exactly one location | PASS | No duplication observed |
| Safety-critical constraints have external validation | FAIL | Auto-close confirmation relies solely on prompt-level `AskUserQuestion`; no external gate |

### Agent/Subagent
| Item | Status | Notes |
|---|---|---|
| Agent prompts are fully self-contained | PASS | `<required_reading>` ensures context is gathered before execution |
| All file paths in agent output are absolute | FAIL | Report output path `.planning/INBOX-TRIAGE.md` is relative |
| Parallel agents launched in single message block | N/A | No parallel agents |
| Adversarial probes specified for verification agents | N/A | Not a verification agent |

### Structural Architecture
| Item | Status | Notes |
|---|---|---|
| Large prompts decomposed into atomic modules | PASS | Each step is focused |
| Template variables use `${VARIABLE_NAME}` syntax | FAIL | Curly brace placeholders like `{repo}`, `{date}`, `{count}` used in report template — not standard `${VAR}` syntax |
| Modules compose via variable substitution | N/A | Standalone workflow file |

### Constraint Enforcement
| Item | Status | Notes |
|---|---|---|
| Every restriction paired with concrete permission | FAIL | Auto-close restrictions not paired with explicit statement of what IS permitted before asking |
| Hard exclusion lists enumerated | N/A | No filtering task with exclusions |
| Known edge cases have precedent-style rulings | FAIL | No precedents for edge cases (e.g., issue with multiple conflicting type labels) |
| Confidence thresholds are numeric | PASS | Scoring thresholds are numeric (100%, 75–99%, etc.) |

### Decision Frameworks
| Item | Status | Notes |
|---|---|---|
| Multi-option recommendations use decision tree or table | PASS | Mapping tables used for type classification |
| Criteria checklists gate complex approaches | PASS | Per-type checklists before scoring |
| Action permissions framed around reversibility | PASS | Confirm-before-close is correctly used |

### Multi-Phase Workflows
| Item | Status | Notes |
|---|---|---|
| Complex tasks organized into named phases | PASS | Named steps serve as phases |
| Required steps distinguished from type-specific steps | PASS | Cross-cutting PR checks are separated from per-type checklists |
| Scenario-based branching handles multiple paths | PASS | Flag-driven branching is explicit |

### Memory and Continuity
| Item | Status | Notes |
|---|---|---|
| Memory templates use XML tags as section labels | N/A | No memory component |
| Compaction summaries include discoveries and failed approaches | N/A | |
| Next steps tied to most recent explicit request | PASS | `<offer_next>` block correctly links to follow-on commands |

### Modularity
| Item | Status | Notes |
|---|---|---|
| Each prompt component has single responsibility | PASS | Steps are well-scoped |
| Scope boundaries state both inclusions and exclusions | FAIL | `<success_criteria>` lists inclusions only; what this workflow explicitly does NOT do is unstated |

### Safety and Trust
| Item | Status | Notes |
|---|---|---|
| Validation at system boundaries; internal interfaces trusted | PASS | `gh` CLI output is parsed; no internal code is re-validated |
| Dual-use capabilities state permissions before restrictions | PASS | Auto-actions confirm before executing |
| Authorization narrow-scoped; each action confirmed before expanding | PASS | `--label` and `--close-incomplete` must be explicitly passed |

### Tone and Style
| Item | Status | Notes |
|---|---|---|
| Size constraints use numeric limits | FAIL | Report field lengths are unspecified |
| Instructions use imperative present tense | PASS | Most step instructions are imperative |
| Working notes in analysis tags, not user-facing | N/A | No reasoning scratchpad needed |

### Optimization
| Item | Status | Notes |
|---|---|---|
| Prompt flagged as draft for automated optimization | FAIL | No optimization annotation |
| Correct optimizer selected | FAIL | Not evaluated |
| Held-out test set reserved | FAIL | Not referenced |

---

## Recommendations

Listed in priority order by impact on execution reliability.

### 1. Add a `<persona>` block with strengths enumeration (Section 6 Action 2; Section 22 Pattern 1)
The classification judgment steps (body-content inference, multi-label conflict resolution) are the highest-variance operations in this workflow. A scoped persona — "contribution compliance reviewer" with enumerated strengths — directly anchors the model's decision register for these judgment calls. This is the single highest-leverage change.

### 2. Add an `<examples>` block for the classification heuristics (Section 3; Section 22 Pattern 2)
The body-content classification rules are abstract. Two to three examples — covering a clean label match, a body-content inference, and an ambiguous fallthrough — will calibrate the model's behavior at the most error-prone decision point in the workflow. Without examples, classification consistency degrades on ambiguous inputs, which are exactly the inputs this triage workflow is designed to handle.

### 3. Convert negative instructions to positive equivalents and add a tie-breaking rule (Section 5 Action 1; Section 22 Pattern 4)
The scoring band boundary (exactly 75%) and the `--no-verify` instruction are both under-specified for edge cases. Apply the Section 5 conversion table to all negative constructs, and add a single `<tie_breaking>` block that encodes the cost asymmetry (false acceptance is more costly than false rejection in a contribution gate context).

### 4. Replace `<step>` tags with `<phase>` tags and add `<audience>`, `<quality_bar>`, `<output_format>` blocks (Section 4 Action 2; Section 16; Section 1 Action 1–2)
Using the guide's standard tag vocabulary makes this workflow interoperable with composed prompt systems and gives the model richer semantic signal. The `<audience>` and `<quality_bar>` blocks close the task specification gap identified in Issue 5. The `<output_format>` block should also fix the relative path issue (`.planning/INBOX-TRIAGE.md` → absolute path via `${WORKSPACE_ROOT}/.planning/INBOX-TRIAGE.md`) and add numeric field-length constraints to the report template.

### 5. Add an explicit exclusions block for known edge cases and a scope exclusion list (Section 14; Section 19)
The `<success_criteria>` block only lists what the workflow does. Adding what it explicitly does NOT do (e.g., does not modify PR/issue body content, does not evaluate code quality, does not re-run CI) prevents scope creep during execution and makes the workflow's boundaries auditable. Pair this with precedent-style rulings for the two most common edge cases: issues with multiple conflicting type labels, and PRs that link to closed (not open) issues.
