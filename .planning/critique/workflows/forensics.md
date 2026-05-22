# Critique: forensics.md

## Summary

`forensics.md` is a functionally solid investigative workflow with clear, well-ordered steps and good domain coverage. The anomaly-detection logic is specific and grounded in observable signals, and the report template is complete enough to produce consistent output. However, the workflow is written entirely in mixed prose-plus-bash rather than structured XML, which denies the model the richer semantic signal the guide prescribes. Key guide principles are absent or underdeveloped: there is no explicit persona, no `<output_format>` specification, no constraint pair (what is permitted vs. reserved), no confidence thresholds with numeric backing for the anomaly confidence levels, and no `<phase>` tagging to enforce cognitive boundaries across the seven steps. The result is a workflow that works in practice but is not robustly specified — prompt variance across calls is higher than it needs to be, and the model has more interpretive latitude than the task requires.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — step ordering.** The seven-step structure (gather, detect, report, present, investigate, issue, update) creates a logical execution sequence with clear handoffs between stages. Each step has a single responsibility.
- **Section 14 (Constraint Enforcement) — confidence labels.** Stuck-loop detection uses HIGH/MEDIUM confidence labels and explains the distinguishing signals, which is directionally aligned with Section 14's guidance on numeric/calibratable thresholds.
- **Section 16 (Multi-Phase Workflows) — scenario-based branching.** The "missing sources are fine — adapt to what exists" note and the worktree/crash/scope-drift branching logic anticipate multiple execution paths rather than assuming a single happy path.
- **Section 20 (Safety and Trust Patterns) — read-only constraint stated.** The opening principle ("This is a read-only investigation. Do not modify project files.") is a clear constraint, though it is prose rather than a `<constraints>` block.
- **Section 14 (Constraint Enforcement) — redaction rules.** Steps 4 redaction rules (strip `$HOME`, remove credentials, truncate diffs) are concrete and enumerated rather than qualitative.
- **Section 5 (Instruction Framing) — conditional instructions.** Step 7's label check (`BUG_LABEL=$(gh label list ...)`) is a well-formed conditional that handles a missing-label edge case explicitly.

---

## Issues

### Issue 1 — No persona defined
**Guide principle:** Section 6 Action 1–2; Section 22 Pattern 1.

**What is wrong:** The workflow has no `<persona>` block. The model defaults to generic assistant behavior rather than being anchored to the specific investigative register this task requires — reading evidence neutrally, reasoning adversarially, and reporting conservatively.

**Concrete fix:**
```xml
<persona>
You are a forensic investigator for GSD workflow failures. Your role is to reconstruct
what happened from evidence — git history, planning artifacts, and filesystem state —
and produce a structured, evidence-grounded diagnostic report.

Your strengths:
- Reading commit timelines to detect loops, gaps, and scope drift
- Correlating planning state with actual file changes
- Producing hypotheses ranked by evidence weight, not intuition
- Reporting only what the evidence supports; flagging speculation explicitly
</persona>
```

---

### Issue 2 — No `<output_format>` specification; report template is embedded as prose
**Guide principle:** Section 7 Action 1; Section 22 Pattern 3; Section 4 Action 2.

**What is wrong:** The report structure is described inline as a markdown code block within Step 4, not in a dedicated `<output_format>` tag. This means the format spec competes with procedural instructions in the same cognitive space. Per Section 22 Pattern 3, the required output structure should be specified completely and upfront, before the model begins its task — not buried in Step 4 of a seven-step workflow.

**Concrete fix:** Hoist the report structure into a top-level `<output_format>` block immediately after the persona, before Step 1. Keep Step 4 as a reference to it ("Write the report using the format specified in `<output_format>`") rather than re-defining it inline.

---

### Issue 3 — Confidence levels are qualitative, not numeric
**Guide principle:** Section 14 (Confidence thresholds); Section 22 Pattern 6.

**What is wrong:** Anomaly confidence is expressed as `HIGH / MEDIUM / LOW` without numeric definitions. Per Section 14, numeric thresholds beat qualitative terms because they are calibratable. The guide explicitly states: "Numeric thresholds beat qualitative terms like 'high confidence' — they are calibratable."

**Concrete fix:**
```xml
<confidence_scoring>
  - HIGH (0.9–1.0): Same file appears in 3+ consecutive commits AND commit messages
    are near-identical (e.g., three "fix:" messages on the same file)
  - MEDIUM (0.7–0.9): File appears frequently across commits BUT commit messages vary,
    OR one of the three loop signals is present without corroboration
  - LOW (below 0.7): Single signal present with no corroboration — note but do not
    include in Anomalies Detected; append to an "Observations" section instead
</confidence_scoring>
```

---

### Issue 4 — Read-only constraint is not paired with an explicit permission list
**Guide principle:** Section 14 (Explicit permission pairs); Section 20 (Safety and Trust Patterns).

**What is wrong:** The read-only constraint is stated as a prose sentence at the top ("Do not modify project files. Only write the forensic report."). Section 14 requires every restriction to be paired with an equally concrete statement of what IS permitted. Without this pairing, the model must infer what read operations are allowed.

**Concrete fix:**
```xml
<constraints>
  <permitted>
    - Read any file in the repository and `.planning/` directories
    - Run read-only shell commands: git log, git status, git diff, git worktree list,
      ls, cat, grep, find
    - Write only to `.planning/forensics/report-{timestamp}.md`
    - Create the `.planning/forensics/` directory if it does not exist
    - Run `gh issue create` only after explicit user confirmation (Step 7)
  </permitted>

  <reserved_for_human_review>
    - Modifying any existing project file
    - Running git write operations (add, commit, push, reset)
    - Creating files outside `.planning/forensics/`
  </reserved_for_human_review>
</constraints>
```

---

### Issue 5 — No XML `<phase>` tags; cognitive boundaries between steps are informal
**Guide principle:** Section 16 (Multi-Phase Workflows) — the phase pattern.

**What is wrong:** Steps 1–8 are formatted as markdown headers (`## Step N`). The guide prescribes `<phase id="N" name="..." trigger="...">` tags to create explicit cognitive boundaries and ensure the model completes one phase fully before beginning the next. Without phase tags, the model can conflate evidence-gathering with anomaly detection, or begin generating the report before all evidence sources have been checked.

**Concrete fix:** Wrap each step in a `<phase>` tag. Example for Steps 1 and 2:
```xml
<phase id="1" name="Problem Intake" trigger="on_invoke">
  [Step 1 content]
</phase>

<phase id="2" name="Evidence Gathering" trigger="after_problem_confirmed">
  [Step 2 content — all sub-steps 2a–2e must complete before proceeding]
</phase>

<phase id="3" name="Anomaly Detection" trigger="after_evidence_complete">
  [Step 3 content]
</phase>
```

---

### Issue 6 — No `<task>` block; task instruction is not at the start of the prompt
**Guide principle:** Section 8 Action 1; Section 4 Action 2.

**What is wrong:** The workflow opens with a title and a two-sentence description, then jumps directly into Step 1. Per Section 8 Action 1, the task instruction must lead the prompt. Per Section 4 Action 2, prompt sections should be wrapped in semantically named XML tags. Neither is applied here.

**Concrete fix:** Open with:
```xml
<task>
Conduct a post-mortem forensic investigation of a failed or stuck GSD workflow. Gather
evidence from git history, planning artifacts, and filesystem state. Detect anomalies using
the patterns defined below. Generate a structured diagnostic report and offer interactive
follow-up investigation.
</task>
```

---

### Issue 7 — Missing `<audience>` and `<quality_bar>` specification
**Guide principle:** Section 1 Actions 1–2.

**What is wrong:** The workflow does not explicitly identify who will consume the forensic report or what a high-quality report looks like beyond its structural template. This matters because the report's target audience (a developer resuming failed work) requires actionable, terse findings — not comprehensive coverage of all anomaly categories when most show no signals.

**Concrete fix:**
```xml
<audience>
A developer whose GSD workflow has stalled, crashed, or behaved unexpectedly. They need
a terse, actionable diagnosis — not a log dump. They know the GSD system and can act
on specific phase numbers, file paths, and recovery commands without explanation of
how GSD works.
</audience>

<quality_bar>
A high-quality report: (1) identifies at most 3 anomalies, prioritized by confidence;
(2) states a root cause hypothesis in 1–3 sentences tied directly to the evidence;
(3) ends with numbered, runnable remediation steps. A report that lists all six anomaly
categories as "no signal found" is not useful — omit categories with no findings.
</quality_bar>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide as applied to `forensics.md` as a workflow prompt.

### Task Specification
| Item | Score |
|------|-------|
| Intent, audience, and quality bar are all explicit | FAIL — none of the three are formally specified |
| All constraints are compatible — no conflicts | PASS — no internal conflicts detected |

### Chain-of-Thought
| Item | Score |
|------|-------|
| CoT included only for math/symbolic/multi-step logic tasks | N/A — no CoT trigger used; the task is procedural, not symbolic |
| CoT trigger phrasing used | N/A |
| Reasoning elicited before answer | N/A |
| CoT traces treated as heuristic | N/A |

### Few-Shot Examples
| Item | Score |
|------|-------|
| Examples selected by semantic similarity | N/A — no few-shot examples; task is procedural |
| 2–5 examples total | N/A |
| Ordered simple → complex | N/A |
| Examples span diverse sub-types | N/A |
| Format consistent across examples | N/A |
| Example order fixed across evaluation runs | N/A |

### Formatting
| Item | Score |
|------|-------|
| Instruction is complete and clear before formatting is applied | FAIL — format spec (report template) is embedded in Step 4, not upfront |
| Prompt sections separated by semantically named XML tags | FAIL — markdown headers used throughout; no XML structure |
| At least 3 format variants will be tested on target model | FAIL — no indication of format validation |

### Instruction Framing
| Item | Score |
|------|-------|
| Negative instructions converted to positive equivalents | PASS — "Do not modify project files. Only write the forensic report" is partially negative but paired with a positive equivalent in the same sentence |
| Priority order explicit when multiple criteria apply | FAIL — anomaly types are listed without priority ordering; the report template does not specify whether to lead with highest-confidence anomalies |
| Tie-breaking rules match domain cost asymmetry | FAIL — no tie-breaking rule. The domain is recall-biased (missing an anomaly is worse than over-reporting), but this is not stated |

### Persona
| Item | Score |
|------|-------|
| Persona included only for open-ended or stylistic tasks | FAIL — no persona defined; this is an open-ended investigative task that would benefit from one |
| Persona is specific (constrains voice/register) | FAIL — absent |
| Persona descriptor is gender-neutral | N/A — absent |

### Output Format
| Item | Score |
|------|-------|
| Structured output tasks use two-step reasoning-then-format | FAIL — report template is defined in Step 4 alongside procedural instructions; reasoning and formatting are not separated |
| Single-call JSON places reasoning before answer fields | N/A — output is markdown, not JSON |
| Constrained decoding only after free-form proven insufficient | N/A |
| Machine-parsed output uses exact format specification | PASS — the report template uses explicit field names and a table structure for artifact completeness |

### Context Placement
| Item | Score |
|------|-------|
| Task instruction is at the start of the prompt | FAIL — the prompt opens with a title and description, not a formal `<task>` instruction |
| Primary document or input is at the end of the prompt | N/A — the primary "input" is gathered dynamically via bash; no static document |
| Background context is in the middle | N/A |
| All irrelevant context has been removed | PASS — no extraneous context is included |
| Time-sensitive injected context is labeled as a snapshot | FAIL — git status and log outputs gathered during Step 2 are not labeled as point-in-time snapshots |

### Self-Consistency
| Item | Score |
|------|-------|
| Applied only to tasks with a single correct answer | N/A — not applicable to this investigative workflow |
| Inference budget permits 15–20 samples | N/A |

### Prompt Length
| Item | Score |
|------|-------|
| Redundant instructions and repeated context removed | PASS — no significant redundancy detected |
| Long prompts compressed before sending | N/A — prompt is instruction-only, not document-heavy |
| RAG context is extracted relevant passage only | N/A |

### System/User Split
| Item | Score |
|------|-------|
| Persistent instructions in system prompt | N/A — workflow file is invoked as a slash command, not split into system/user prompts |
| Task-specific instructions in user prompt | N/A |
| Each instruction appears in exactly one location | PASS — no duplicated instructions detected |
| Safety-critical constraints have external validation | FAIL — the read-only constraint relies entirely on the prompt instruction with no external enforcement |

### Agent/Subagent
| Item | Score |
|------|-------|
| Agent prompts are fully self-contained | PASS — workflow does not spawn subagents |
| All file paths in agent output are absolute | FAIL — the report template uses relative paths (`.planning/forensics/report-...`); Step 4 redaction rules strip absolute paths to relative, which is intentional but not flagged as a trade-off |
| Parallel agents launched in a single message block | N/A — no parallel agents |
| Adversarial probes specified for verification agents | N/A — forensics is investigative, not a verification agent |

### Structural Architecture
| Item | Score |
|------|-------|
| Large prompts decomposed into atomic, single-responsibility modules | FAIL — the workflow is a monolithic file; persona, constraints, output format, and procedural steps are all co-located |
| Template variables use `${VARIABLE_NAME}` syntax | PASS — `$ARGUMENTS` and `$(date +%Y%m%d-%H%M%S)` follow the convention |
| Modules compose at runtime via variable substitution | PASS — `$ARGUMENTS` is the primary runtime injection point |

### Constraint Enforcement
| Item | Score |
|------|-------|
| Every restriction paired with an equally concrete permission | FAIL — read-only constraint lacks an explicit permission list |
| Hard exclusion lists are enumerated, not qualitative | N/A — no exclusion list applicable |
| Known edge cases have precedent-style rulings | FAIL — the "missing sources are fine" note is the only edge-case ruling; cases like STATE.md not existing, or a repo with no commits, are not addressed |
| Confidence thresholds are numeric, not qualitative | FAIL — HIGH/MEDIUM/LOW used without numeric backing |

### Decision Frameworks
| Item | Score |
|------|-------|
| Multi-option recommendations use decision tree or comparison table | FAIL — Step 6 follow-up options ("Trace anomaly / Read files / Check history") are a bulleted list, not a decision tree |
| Criteria checklists gate complex approaches | N/A |
| Action permissions framed around reversibility | FAIL — Step 7 (issue creation) and Step 8 (STATE.md update) are write operations but not framed in terms of reversibility |

### Multi-Phase Workflows
| Item | Score |
|------|-------|
| Complex tasks organized into explicit named phases | FAIL — markdown headers used, not `<phase>` XML tags |
| Required steps distinguished from type-specific steps | FAIL — no `<required_steps universal="true">` block; all steps appear equally required |
| Scenario-based branching handles multiple paths explicitly | FAIL — branching (e.g., "if anomalies found, offer issue creation") is prose; no `<scenarios>` block |

### Memory and Continuity
| Item | Score |
|------|-------|
| Memory templates use XML tags as section labels | N/A — workflow does not produce memory entries |
| Compaction summaries include discoveries and failed approaches | N/A |
| Next steps tied to user's most recent explicit request | PASS — Step 6 follow-up is explicitly grounded in "the evidence already gathered" |

### Modularity
| Item | Score |
|------|-------|
| Each prompt component has a single responsibility | FAIL — Step 4 conflates "generate report" with "define output format" |
| Scope boundaries state both inclusions and exclusions | FAIL — no `<scope>` block; what the forensics workflow covers vs. excludes (e.g., it does not debug code bugs, only GSD workflow failures) is implied but not stated |

### Safety and Trust
| Item | Score |
|------|-------|
| Validation at system boundaries only; internal interfaces trusted | PASS — the workflow trusts git and GSD SDK output without re-validating |
| Dual-use capabilities state permissions before restrictions | FAIL — the restriction ("read-only") is stated before what is permitted |
| Authorization is narrow-scoped; each action confirmed before expanding | PASS — Step 7 explicitly requires user confirmation before creating a GitHub issue |

### Tone and Style
| Item | Score |
|------|-------|
| Size constraints use numeric limits, not qualitative descriptors | FAIL — the root cause hypothesis ("1–3 sentence hypothesis") uses a numeric limit, but the report's "Recommended Actions" section has no stated limit |
| Instructions use imperative present tense | PASS — most step instructions use imperative form ("Read", "Collect", "Evaluate", "Write") |
| Working notes are in analysis tags, not user-facing output | FAIL — no `<analysis>` tag guidance; the workflow does not distinguish internal reasoning from report output |

### Optimization
| Item | Score |
|------|-------|
| Prompt flagged as a draft for automated optimization | FAIL — no optimization flag |
| Correct optimizer selected | FAIL — not addressed |
| Held-out test set reserved before optimization begins | FAIL — not addressed |

---

## Recommendations

The following are the highest-leverage improvements, ordered by impact on output consistency.

### 1. Add XML structure: `<task>`, `<persona>`, `<constraints>`, `<output_format>`, `<phase>` (Sections 4, 6, 8, 14, 16)

This is the single highest-impact change. The entire workflow is prose-plus-bash. Wrapping sections in semantically named XML tags gives the model structural signal it uses to correctly separate role, instructions, permissions, and output format. The minimal viable change is to add a `<task>` block at the top, a `<persona>` block before Step 1, a `<constraints>` block replacing the current opening principle, and an `<output_format>` block hoisted before Step 1 that contains the report template. This directly addresses Issues 1, 2, 4, and 6.

### 2. Define numeric confidence thresholds for anomaly detection (Section 14; Section 22 Pattern 6)

Replace the qualitative `HIGH/MEDIUM/LOW` labels with a `<confidence_scoring>` block that defines each level in terms of observable signal counts and patterns (see Issue 3 fix above). This is low-effort and directly reduces variance in how the model classifies and reports anomalies — the most consequential output of this workflow.

### 3. Hoist the output format specification to the top and add a `<quality_bar>` (Section 7; Section 1 Action 1; Section 22 Pattern 3)

The report template is currently buried in Step 4. Per Section 22 Pattern 3, output format must be specified completely and upfront. Move the report template to a `<output_format>` block at the top of the file, and add a `<quality_bar>` that constrains the report to the highest-confidence anomalies (capped at 3) and requires that categories with no signal be omitted entirely. This addresses Issues 2 and 7, and prevents the model from producing padded reports that list every anomaly category regardless of evidence.

### 4. Add an explicit tie-breaking rule for anomaly inclusion (Section 5; Section 22 Pattern 4)

The workflow is recall-biased: missing a real anomaly is worse than including a weak signal. Add a `<tie_breaking>` instruction inside `<constraints>`:
```xml
<tie_breaking>
  When uncertain whether a signal qualifies as MEDIUM confidence, include it. A false
  positive that the developer dismisses is less costly than a missed root cause.
  Report LOW-confidence signals in a separate "Weak Signals" section, not in Anomalies Detected.
</tie_breaking>
```

### 5. Wrap steps in `<phase>` tags and add a `<scenarios>` block for branching paths (Section 16)

Convert the eight `## Step N` markdown headers to `<phase id="N" name="..." trigger="...">` blocks. Add a `<scenarios>` block in Step 7 to make the "anomalies found / no anomalies" branch explicit. This prevents the model from blending evidence-gathering with analysis, or skipping to report generation before all evidence sources have been checked.
