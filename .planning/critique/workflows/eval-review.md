# Critique: eval-review.md

## Summary

`eval-review.md` is a functional orchestration workflow that correctly manages state transitions, spawns a subagent, and surfaces a verdict to the user. Its procedural logic is sound. However, it applies almost none of the structural prompt engineering principles from the guide. Sections are delimited with Markdown headers rather than semantically named XML tags, the subagent prompt is assembled inline as a Markdown code block rather than using the XML tag vocabulary, there is no persona assigned to the spawned auditor, there is no output format specification in the spawn prompt, constraint enforcement is entirely absent, and the success criteria at the bottom are not wired to any conditional branching or failure path in the workflow. As a prompt artifact, it reads more as a runbook than a prompt — it controls the orchestrator effectively but delegates all prompt engineering decisions to a separate agent file (`gsd-eval-auditor.md`) without specifying the interface contract between them.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — phase sequencing:** Steps 0 through 6 form a clear linear phase structure with named responsibilities. Each step has one job. This matches the guide's advice to organize complex tasks into explicit named stages.
- **Section 16 — scenario-based branching:** States A, B, and C are enumerated explicitly with conditions and outcomes. State C has a hard exit. This aligns with the guide's `<scenarios>` pattern for handling multiple execution paths.
- **Section 16 — required vs. optional distinction:** The `commit_docs` gate in Step 6 correctly treats git commit as a conditional, not a universal step.
- **Section 5 (Instruction Framing) — conditional instructions:** The `TEXT_MODE` branch is explicit and covers both the flag path and the config path. The conditional is stated as an if/else, not implied.
- **Section 17 (Agent and Subagent Patterns) — self-contained agent spawning:** The spawn prompt in Step 3 includes phase number, name, padded phase, state, and file paths. The subagent receives enough context to act without inheriting parent state.
- **Section 1 (Task Specification) — success criteria present:** The `<success_criteria>` block at the bottom enumerates the intended outcomes as a checklist, which is consistent with the guide's emphasis on making the quality bar explicit.

---

## Issues

### Issue 1 — No XML tag structure for prompt sections
**Principle:** Section 4 Action 2 — "Use XML tags to separate prompt sections. Tags name what the section *is*, not just where it starts."

**What's wrong:** The workflow uses Markdown `##` headers to delimit its sections (Initialize, Detect Input State, Gather Context Paths, etc.). The guide states that XML tags are "strictly better than markdown headers or `---` delimiters for Claude-class models: the tag name carries semantic meaning, the structure is unambiguous and machine-parseable." The entire process block is wrapped in a single `<process>` tag, but within it every section is plain Markdown.

**Concrete fix:** Replace top-level Markdown section headers inside `<process>` with named XML tags from the guide's vocabulary:

```xml
<process>
  <phase id="0" name="Initialize">…</phase>
  <phase id="1" name="Detect Input State">…</phase>
  <phase id="2" name="Gather Context Paths">…</phase>
  <phase id="3" name="Spawn gsd-eval-auditor">…</phase>
  <phase id="4" name="Parse Auditor Result">…</phase>
  <phase id="5" name="Display Summary">…</phase>
  <phase id="6" name="Commit">…</phase>
</process>
```

---

### Issue 2 — Subagent spawn prompt lacks `<persona>`, `<output_format>`, and `<constraints>` sections
**Principle:** Section 6 Action 2 — "Make personas specific, not generic." Section 7 — "Output format specified completely and upfront." Section 14 — "Pair every restriction with what IS permitted."

**What's wrong:** The spawn prompt built in Step 3 contains only `<objective>`, `<files_to_read>`, and `<input>`. It carries no persona to anchor the auditor's register and decision-making style, no `<output_format>` specifying the required structure of EVAL-REVIEW.md (field names, ordering, scoring rubric), and no `<constraints>` telling the auditor what it may or may not do. The guide states that "format specification is part of the task definition, not an afterthought" (Pattern 3, Section 22) and that a fully specified format "produces consistent, parseable output."

**Concrete fix:** Add the missing blocks to the spawn prompt:

```xml
<persona>
You are an AI evaluation auditor. Your job is not to confirm the implementation is complete —
it is to identify gaps between the evaluation strategy in AI-SPEC.md and what was actually
implemented. Produce findings grounded in evidence from the SUMMARY.md files.
</persona>

<output_format>
Write EVAL-REVIEW.md to {phase_dir}/{padded_phase}-EVAL-REVIEW.md.
Required sections in order:
- Overall Score (0–100) and Verdict (PRODUCTION READY | NEEDS WORK | SIGNIFICANT GAPS | NOT IMPLEMENTED)
- Coverage Matrix: each planned eval dimension with status (Implemented / Partial / Missing)
- Critical Gaps: numbered list, each gap with evidence from SUMMARY.md
- Remediation Plan: prioritized actions to close critical gaps

End the file with a machine-parseable verdict line:
VERDICT: <one of PRODUCTION READY | NEEDS WORK | SIGNIFICANT GAPS | NOT IMPLEMENTED>
</output_format>

<constraints>
  <permitted>
    Read AI-SPEC.md, SUMMARY.md, and PLAN.md files listed in files_to_read.
    Write exactly one EVAL-REVIEW.md to the phase_dir.
  </permitted>
  <reserved_for_human_review>
    Do not modify source files, PLAN.md, AI-SPEC.md, or SUMMARY.md files.
  </reserved_for_human_review>
</constraints>
```

---

### Issue 3 — Step 4 parses EVAL-REVIEW.md by free-form reading with no machine-parseable contract
**Principle:** Section 7 — "Machine-parsed output uses exact format specification with literal string requirements."

**What's wrong:** Step 4 says "Read the written EVAL-REVIEW.md. Extract: `overall_score`, `verdict`, `critical_gap_count`." There is no specification in the spawn prompt telling the auditor to emit these fields in a parseable format. The orchestrator is relying on unspecified text extraction from a free-form document. If the auditor uses different field names or formatting, Step 4 silently fails.

**Concrete fix:** Add a machine-parseable verdict block requirement to `<output_format>` (see Issue 2 fix). Then make Step 4 use the literal string contract:

```
## 4. Parse Auditor Result

Extract from the final line of EVAL-REVIEW.md:
- The `VERDICT:` line for `verdict`
- The `Score:` header line for `overall_score`
- Count lines starting with `- [ ]` under Critical Gaps for `critical_gap_count`

If the VERDICT line is absent, treat as parse failure and warn the user.
```

---

### Issue 4 — Negative instructions present without positive conversion
**Principle:** Section 5 Action 1 — "Convert negative instructions to positive equivalents."

**What's wrong:** State C exits with: "Phase {N} not executed. Run /gsd-execute-phase {N} first." While this is an exit message rather than a behavioral instruction, the broader workflow has several implicit negatives: it does not tell the orchestrator what to do on spawn failure, on parse failure in Step 4, or if the commit in Step 6 fails. These gaps manifest as unhandled negative paths rather than explicit positive instructions for those branches.

**Concrete fix:** Add positive fallback instructions for each failure path:

```
If spawn fails: display "Auditor spawn failed. Check AUDITOR_MODEL config. Retry with /gsd-eval-review {N}."
If parse fails (VERDICT line absent): display "EVAL-REVIEW.md written but verdict unparseable. Open {eval_review_path} to review manually."
If commit fails: display "Audit complete. Commit failed — stage manually with: git add {eval_review_path}"
```

---

### Issue 5 — `<success_criteria>` is disconnected from the workflow's conditional logic
**Principle:** Section 1 Action 1 — "Identify what a correct or high-quality response looks like." Section 16 — "Required steps are distinguished from type-specific steps."

**What's wrong:** The `<success_criteria>` block lists seven checkboxes but they are appended after `</process>` with no connection to the workflow steps. There is no instruction telling the orchestrator to evaluate the criteria, no mapping from criteria to steps, and no behavior specified when a criterion is not met. The criteria are declaration without enforcement.

**Concrete fix:** Embed the criteria as exit conditions within the relevant phases, or add an explicit validation phase:

```xml
<phase id="7" name="Validate Completion">
Before reporting complete, confirm all criteria are met:
- Phase execution state was correctly detected (State A / B / C)
- AI-SPEC.md presence was handled appropriately
- gsd-eval-auditor was spawned and returned a result
- EVAL-REVIEW.md exists at {eval_review_path}
- Score and verdict were extracted and displayed
- Next steps were surfaced matching the verdict
- Committed if commit_docs was true

If any criterion is unmet, report which criterion failed and the corrective action.
</phase>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide. N/A items are those where the section does not apply to an orchestration workflow file of this type (e.g., few-shot examples, self-consistency, RAG).

| Checklist Item | Status | Notes |
|---|---|---|
| **Task Specification** | | |
| Intent, audience, and quality bar are explicit | FAIL | `<purpose>` states intent but audience and quality bar are absent |
| All constraints are compatible — no conflicts | PASS | No conflicting constraints detected |
| **Chain of Thought** | | |
| CoT included only for math/symbolic/multi-step logic tasks | N/A | Orchestration workflow, not a reasoning prompt |
| CoT trigger used if applicable | N/A | |
| Reasoning elicited before answer | N/A | |
| CoT traces flagged as heuristic | N/A | |
| **Few-Shot Examples** | | |
| Examples selected by semantic similarity | N/A | No few-shot examples in this workflow type |
| 2–5 examples total | N/A | |
| Ordered simple → complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format consistent across examples | N/A | |
| Example order fixed across evaluation runs | N/A | |
| **Formatting** | | |
| Instruction complete and clear before formatting | PASS | Process steps are clear before structure |
| Prompt sections separated by semantically named XML tags | FAIL | Markdown headers used inside `<process>`; phases are not XML-tagged |
| At least 3 format variants will be tested | FAIL | No mention of format variant testing |
| **Instruction Framing** | | |
| Negative instructions converted to positive equivalents | FAIL | Failure paths (spawn fail, parse fail, commit fail) have no positive instructions |
| Priority order explicit when multiple criteria apply | FAIL | No `<priority_order>` for conflicting signals (e.g., existing EVAL-REVIEW.md re-audit) |
| Tie-breaking rules match domain's cost asymmetry | FAIL | No tie-breaking rules specified anywhere |
| **Persona** | | |
| Persona included only for open-ended or stylistic tasks | PASS | Workflow file correctly omits persona for itself |
| Persona is specific (constrains voice/register) | FAIL | Spawn prompt sent to gsd-eval-auditor has no persona |
| Persona descriptor is gender-neutral | N/A | No persona present in workflow itself |
| **Output Format** | | |
| Structured output tasks use two-step reasoning-then-format | FAIL | Spawn prompt does not separate reasoning from formatting |
| Single-call JSON places reasoning fields before answer fields | N/A | JSON not used |
| Constrained decoding adopted only after free-form proven insufficient | N/A | |
| Machine-parsed output uses exact format specification | FAIL | Step 4 extracts fields with no parseable contract defined in spawn prompt |
| **Context Placement** | | |
| Task instruction at start of prompt | PASS | `<objective>` leads the spawn prompt |
| Primary document or input at end of prompt | FAIL | `<input>` (structured metadata) is at the end but the primary documents (file paths) are in the middle |
| Background context in the middle | PASS | `<files_to_read>` sits between objective and input metadata |
| All irrelevant context removed | PASS | Spawn prompt is lean |
| Time-sensitive injected context labeled as snapshot | N/A | No snapshot context injected |
| **Self-Consistency** | | |
| Applied only to tasks with a single correct answer | N/A | |
| Inference budget permits 15–20 samples | N/A | |
| **Prompt Length** | | |
| Redundant instructions and repeated context removed | PASS | Workflow is concise with no repetition |
| Long prompts compressed before sending | N/A | Prompt is short |
| RAG context is extracted passage only | N/A | |
| **System / User Split** | | |
| Persistent instructions in system prompt | N/A | Workflow files don't directly map to system/user split |
| Task-specific instructions in user prompt | N/A | |
| Each instruction appears in exactly one location | PASS | No duplicated instructions observed |
| Safety-critical constraints have external validation | FAIL | No external validation of auditor output; parse failure is silent |
| **Agent / Subagent** | | |
| Agent prompts are fully self-contained | FAIL | Spawn prompt delegates to `gsd-eval-auditor.md` for instructions; no persona/format/constraints in-prompt |
| All file paths in agent output are absolute | N/A | Paths are passed as variables, not hardcoded |
| Parallel agents launched in single message block | N/A | Only one agent spawned |
| Adversarial probes specified for verification agents | N/A | Not a verification agent |
| **Structural Architecture** | | |
| Large prompts decomposed into atomic, single-responsibility modules | PASS | Workflow delegates deep logic to gsd-eval-auditor.md |
| Template variables use ${VARIABLE_NAME} syntax | PASS | Variable substitution used throughout |
| Modules compose at runtime via variable substitution | PASS | |
| **Constraint Enforcement** | | |
| Every restriction paired with equally concrete permission | FAIL | No `<constraints>` block in spawn prompt |
| Hard exclusion lists enumerated, not described qualitatively | FAIL | No exclusion list for what auditor should not flag |
| Known edge cases have precedent-style rulings | FAIL | No precedents defined |
| Confidence thresholds are numeric, not qualitative | FAIL | Scoring rubric not defined in spawn prompt |
| **Decision Frameworks** | | |
| Multi-option recommendations use explicit decision tree or table | PASS | State A/B/C branching is explicit |
| Criteria checklists gate complex approaches | FAIL | `<success_criteria>` is not enforced within the workflow |
| Action permissions framed around reversibility | FAIL | Commit in Step 6 is irreversible but has no `<confirm_with_user>` gate |
| **Multi-Phase Workflows** | | |
| Complex tasks organized into explicit named phases | FAIL | Steps use Markdown headers, not `<phase id=N name=...>` XML tags |
| Required steps distinguished from type-specific steps | PASS | Conditional commit in Step 6 is clearly optional |
| Scenario-based branching handles multiple paths explicitly | PASS | States A, B, C are explicit with conditions |
| **Memory and Continuity** | | |
| Memory templates use XML tags as section labels | N/A | No memory templates in this file |
| Compaction summaries include discoveries and failed approaches | N/A | |
| Next steps tied to user's most recent explicit request | PASS | Step 5 surfaces next steps matched to the verdict |
| **Modularity** | | |
| Each prompt component has single responsibility | PASS | Each step handles one concern |
| Scope boundaries state both inclusions and exclusions | FAIL | No `<scope>` with explicit `<include>` / `<exclude>` |
| **Safety and Trust** | | |
| Validation at system boundaries only; internal interfaces trusted | PASS | Auditor is trusted; only its output is parsed |
| Dual-use capabilities state permissions before restrictions | N/A | No dual-use capabilities |
| Authorization is narrow-scoped | PASS | Commit gate is conditional on `commit_docs` |
| **Tone and Style** | | |
| Size constraints use numeric limits, not qualitative descriptors | FAIL | No output size constraints specified anywhere |
| Instructions use imperative present tense | PASS | Steps are written imperatively ("Read…", "Spawn…", "Parse…") |
| Working notes in analysis tags, not user-facing output | N/A | |
| **Optimization** | | |
| Prompt flagged as draft for automated optimization | FAIL | No optimization flag |
| Correct optimizer selected | FAIL | Not assessed |
| Held-out test set reserved before optimization | FAIL | Not assessed |

**Summary score: 13 PASS / 20 FAIL / 27 N/A** (of 60 total items)

---

## Recommendations

Ordered by impact on correctness and reliability.

### 1. Define a machine-parseable output contract in the spawn prompt (Critical)
The orchestrator in Step 4 reads the auditor's output to extract `overall_score`, `verdict`, and `critical_gap_count`, but the spawn prompt in Step 3 never specifies the format these fields must appear in. This is the most likely source of silent runtime failures. Add an `<output_format>` block to the spawn prompt specifying exact literal strings (e.g., `VERDICT: PRODUCTION READY`) and field markers the parser can anchor on. See **Section 7** machine-parsed output specification and **Issue 3** above.

### 2. Add `<persona>`, `<output_format>`, and `<constraints>` to the spawn prompt (High)
The spawn prompt sent to `gsd-eval-auditor` carries only objective, file list, and metadata. Without a persona, the auditor defaults to generic assistant behavior. Without `<output_format>`, the structure of EVAL-REVIEW.md is determined solely by `gsd-eval-auditor.md`, which is not visible in this workflow and creates hidden coupling. Without `<constraints>`, there are no permission boundaries. Apply **Section 6 Action 2**, **Section 7**, and **Section 14**. See **Issue 2** for concrete blocks.

### 3. Replace Markdown headers inside `<process>` with `<phase>` XML tags (Medium)
The guide explicitly states XML tags are "strictly better than markdown headers" for Claude-class models. Wrapping each step in `<phase id="N" name="...">` costs one line per step and provides structural signal that markdown headers cannot. Apply **Section 4 Action 2** and **Section 16**. See **Issue 1** for the pattern.

### 4. Add positive failure-path instructions for spawn failure, parse failure, and commit failure (Medium)
The workflow currently has no instruction for what the orchestrator should do when the auditor spawn fails, when Step 4 cannot extract the verdict, or when the Step 6 commit fails. These are predictable failure modes. Adding positive recovery instructions (display a specific message, suggest a corrective action) eliminates silent failures. Apply **Section 5 Action 1**. See **Issue 4** for the three recovery messages.

### 5. Wire `<success_criteria>` into the workflow as an enforced validation phase (Low-Medium)
The seven success criteria are currently declaration only — they are appended after `</process>` with no mechanism for the orchestrator to evaluate them. Embedding them as exit conditions in a final `<phase id="7" name="Validate Completion">` block makes them actionable. Apply **Section 16** (required steps) and **Section 1 Action 1** (quality bar). See **Issue 5** for the pattern.
