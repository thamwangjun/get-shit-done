# Critique: secure-phase.md

## Summary

`secure-phase.md` is a well-structured, multi-phase workflow that covers the core security verification loop competently. Its state-detection logic, threat classification table, auditor spawning pattern, and enforcement gate are all present and functional. However, the workflow relies almost entirely on prose headers and bash fences instead of the guide's XML structural vocabulary, leaving the model to infer section boundaries and precedence rather than having them named semantically. Constraint framing is present but incomplete — restrictions appear without paired permissions, no confidence thresholds govern what the auditor reports, and edge-case precedents are absent. The persona and output format handed to the spawned subagent are thin: the auditor gets an inline prompt string with no explicit persona, quality bar, or output-format specification. These gaps collectively mean the workflow is directive enough to run but not precise enough to run consistently.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase pattern applied.** The workflow is cleanly decomposed into numbered, named steps (0–8) that form a linear state machine with a clear trigger (`phase_dir` existence) and terminal states (block or route forward). The model can complete one step fully before beginning the next.

- **Section 16 — Scenario-based branching.** Step 1 explicitly enumerates three mutually exclusive input states (A, B, C) and maps each to a distinct execution path, matching the guide's `<scenarios>/<scenario condition="...">` pattern in spirit.

- **Section 14 (Constraint Enforcement) — Hard gate on open threats.** Step 6 specifies an enforcement gate that blocks routing when `threats_open > 0`, which is a concrete, binary enforcement rule that removes model discretion at the critical decision point.

- **Section 17 (Agent and Subagent Patterns) — Subagent configuration present.** Step 0 resolves the auditor model via `gsd-sdk query resolve-model` and Step 5 passes `subagent_type`, `model`, and `description` to the spawned agent, satisfying the guide's requirement that agent configuration be explicit rather than assumed.

- **Section 16 — Required vs. type-specific step distinction.** The `<success_criteria>` block at the bottom functions as a binary checklist of mandatory outcomes, which mirrors the guide's `<required_steps universal="true">` pattern for distinguishing non-negotiable gates from optional steps.

- **Section 5 (Instruction Framing) — Conditional branching is explicit.** Text-mode handling (Step 4) uses explicit `if/else` conditional logic rather than leaving the model to infer the branching condition, matching the guide's conditional instruction pattern.

- **Section 20 (Safety and Trust Patterns) — Auditor scope is constrained.** The inline constraint "Never modify implementation files. Verify mitigations exist — do not scan for new threats." correctly limits the subagent's blast radius. This matches the guide's advice to express allowed tools as the narrowest patterns that satisfy the task (Section 22, Pattern 9).

---

## Issues

### Issue 1 — Structural vocabulary: prose headers instead of XML tags
**Guide reference:** Section 4 Action 2; Section 4 XML tag vocabulary table.

**What is wrong:** Every section in the workflow is delimited by markdown headers (`## 0. Initialize`, `## 1. Detect Input State`, etc.) and bash fences. The guide states XML tags are "strictly better than markdown headers or `---` delimiters for Claude-class models: the tag name carries semantic meaning, the structure is unambiguous and machine-parseable." The top-level structural tags defined in the guide (`<task>`, `<context>`, `<constraints>`, `<output_format>`, `<phase>`) are absent. The existing `<purpose>`, `<process>`, and `<success_criteria>` tags are a minimal start but they wrap the entire workflow as monolithic blobs.

**Concrete fix:** Wrap the high-level phases in `<phase id="N" name="...">` tags. Wrap the threat table and options presented to the user in `<output_format>`. Wrap the auditor inline prompt in the `<task>/<unit_task>/<constraints>/<output_format>` sub-tag structure defined in Section 17. Example:

```xml
<phase id="1" name="Detect Input State">
  ...
</phase>

<phase id="5" name="Spawn Auditor" trigger="after_threat_plan_confirmed">
  <task>
    <unit_task>Verify threat mitigations for Phase {N}</unit_task>
    <constraints>Never modify implementation files. Verify mitigations exist — do not scan for new threats.</constraints>
    <output_format>
      Return one of three headers: ## SECURED, ## OPEN_THREATS, or ## ESCALATE.
      List each threat_id under the applicable header with evidence.
    </output_format>
  </task>
</phase>
```

---

### Issue 2 — Auditor subagent has no persona and no quality bar
**Guide reference:** Section 6 Action 2; Section 6 Role-domain mapping table; Section 1 Action 1; Section 22 Pattern 1.

**What is wrong:** The auditor is spawned with a task string and a constraints clause, but no `<persona>` block. The guide's role-domain mapping table maps a security verification task to "Senior security engineer conducting a focused security review" and recommends the reframe pattern: "Your job is NOT to confirm it works — it's to try to break it." Without a persona, the auditor defaults to generic assistant behavior. There is also no `<quality_bar>` specifying what a complete, high-quality audit looks like — what must be present before the auditor can return `## SECURED`.

**Concrete fix:** Add a `<persona>` and `<quality_bar>` to the auditor prompt:

```xml
<persona>
You are a senior security engineer conducting a focused threat mitigation review.
Your job is not to confirm that mitigations look correct by inspection — it is to verify
that each mitigation in the threat register is demonstrably present in the implementation.
"The code looks correct" is not evidence. Find the file and line.
</persona>

<quality_bar>
A complete audit report names the file, function, and line number for each confirmed
mitigation. For each open threat, state exactly what evidence is missing.
</quality_bar>
```

---

### Issue 3 — Constraints block: restrictions without paired permissions
**Guide reference:** Section 14 Explicit permission pairs; Section 14 tag vocabulary (`<permitted>`, `<reserved_for_human_review>`).

**What is wrong:** The auditor's constraint clause lists only restrictions ("Never modify implementation files"). The guide requires every restriction to be paired with an equally concrete permission statement: "Pair every restriction with what IS permitted, stated equally concretely. This eliminates ambiguity about what actions remain available." Without the paired permission, the auditor must infer what it is allowed to do, which degrades consistency.

**Concrete fix:**

```xml
<constraints>
  <permitted>
    - Read any file in the phase directory (PLAN.md, SUMMARY.md, implementation files, SECURITY.md)
    - Run read-only shell commands (grep, find, cat, git log, git diff) to locate evidence
    - Write findings to the audit report only
  </permitted>
  <reserved_for_human_review>
    - Modifying any implementation file
    - Creating new threat entries not present in the threat register
    - Accepting or closing threats on behalf of the user
  </reserved_for_human_review>
</constraints>
```

---

### Issue 4 — No confidence thresholds on auditor findings
**Guide reference:** Section 14 Confidence thresholds; Section 22 Pattern 6.

**What is wrong:** The workflow instructs the auditor to classify threats as CLOSED or OPEN but gives no numeric confidence floor for that classification. The guide specifies: "Numeric thresholds beat qualitative terms like 'high confidence' — they are calibratable." Without a threshold, the auditor's CLOSED/OPEN classification is subjective — it will vary across runs. A threat could be marked CLOSED on weak evidence (e.g., a comment mentioning the mitigation rather than actual implementation code).

**Concrete fix:** Add a `<confidence_scoring>` block to the auditor task:

```xml
<confidence_scoring>
  - 0.9–1.0: Mitigation code found at a specific file and line — mark CLOSED
  - 0.7–0.9: Mitigation pattern strongly implied by surrounding code — mark CLOSED with caveat
  - Below 0.7: Evidence is insufficient — mark OPEN with reason
</confidence_scoring>
```

---

### Issue 5 — No precedents for known edge cases in threat classification
**Guide reference:** Section 14 Precedents; Section 14 Hard exclusion lists.

**What is wrong:** The threat classification table (Step 3) has a single binary rule: CLOSED if "mitigation found OR accepted risk documented OR transfer documented." Security workflows reliably surface known ambiguous cases — e.g., a threat marked "accepted" in PLAN.md but with no documentation in SECURITY.md, or a mitigation that exists only in a test file. Without precedent-style rulings, the auditor resolves these ad hoc, producing inconsistent results across runs.

**Concrete fix:** Add a `<precedents>` block under threat classification:

```xml
<precedents>
  1. A threat disposition of "accepted" in PLAN.md counts as CLOSED only if the acceptance
     rationale appears in SECURITY.md under "Accepted Risks". PLAN.md alone is insufficient.
  2. A mitigation found only in a test file (e.g., __tests__/) does not count as CLOSED —
     the mitigation must be present in production code paths.
  3. A mitigation comment in code without an implementation (e.g., "// TODO: add rate limiting")
     counts as OPEN, not CLOSED.
  4. Transfer of a threat to an external dependency (e.g., "handled by the framework") counts
     as CLOSED only if the dependency version in use is specified and confirmed to address it.
</precedents>
```

---

### Issue 6 — Auditor output format is under-specified
**Guide reference:** Section 7 Machine-parsed output specification; Section 22 Pattern 3.

**What is wrong:** Step 5 says the auditor returns one of three headers (`## SECURED`, `## OPEN_THREATS`, `## ESCALATE`), but does not specify the exact format of what follows each header. The orchestrating workflow then parses these headers to route execution. If the auditor's format drifts (e.g., it returns `## SECURED — all threats closed` instead of `## SECURED`), the routing logic breaks silently. The guide states: "Use the literal string `VERDICT: ` followed by exactly one of... Output it as plain text: no markdown bold, no punctuation, no wording variation."

**Concrete fix:** Replace the implicit header convention with an explicit machine-parseable verdict line and a defined body schema:

```xml
<output_format>
End your report with a verdict line in exactly this format — it is parsed by the calling workflow:

SECURITY_VERDICT: SECURED
or
SECURITY_VERDICT: OPEN_THREATS
or
SECURITY_VERDICT: ESCALATE

Use the literal string `SECURITY_VERDICT: ` followed by exactly one token. No markdown, no
punctuation, no variation.

For each threat in the register, include one row in this table:
| threat_id | status | evidence (file:line or "missing") |
</output_format>
```

---

### Issue 7 — No priority ordering when multiple conditions apply simultaneously
**Guide reference:** Section 5 Priority ordering; Section 5 Tie-breaking instructions.

**What is wrong:** The workflow does not address what the orchestrator should do when the auditor returns `## OPEN_THREATS` but the user has already accepted risks in a prior run (State A re-audit). The enforcement gate fires unconditionally, but the routing logic between "accept all open" and "block" lacks an explicit priority order. The guide requires: "When multiple considerations apply, list them with explicit priority."

**Concrete fix:** Add a `<priority_order>` to the enforcement gate section:

```xml
<priority_order>
  When threats_open > 0 after auditor returns:
  1. If user selects "Accept all open" → document in SECURITY.md accepted risks, set all CLOSED, proceed to Step 6
  2. If user selects "Verify all open threats" → re-spawn auditor scoped to open threats only, await return
  3. If user selects "Cancel" → exit without updating SECURITY.md
  4. If no user selection (non-interactive / text mode) → default to BLOCK; do not auto-accept
</priority_order>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide. Items specific to few-shot examples, self-consistency, RAG, optimization, and memory templates are not applicable to a workflow orchestration file.

| Checklist Item | Score | Notes |
|---|---|---|
| **Task Specification** | | |
| Intent, audience, and quality bar are all explicit | FAIL | Intent is present via `<purpose>`; audience and quality bar are absent |
| All constraints are compatible — no conflicts | PASS | No conflicting constraints detected |
| **Chain of Thought** | | |
| CoT included only for applicable task types | N/A | Workflow orchestration, not a reasoning prompt |
| **Few-Shot Examples** | | |
| Examples selected by semantic similarity | N/A | No few-shot examples in this workflow type |
| 2–5 examples total | N/A | |
| Ordered simple → complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format consistent across all examples | N/A | |
| Example order fixed across evaluation runs | N/A | |
| **Formatting** | | |
| Instruction complete and clear before formatting | PASS | Purpose and process are clear before structural choices |
| Prompt sections separated by semantically named XML tags | FAIL | Markdown headers used throughout instead of `<phase>`, `<constraints>`, `<output_format>`, `<task>` |
| At least 3 format variants tested on target model | FAIL | No evidence of format variant testing |
| **Instruction Framing** | | |
| Negative instructions converted to positive equivalents | PASS | Constraints use "Never modify" — borderline, but paired with positive scope |
| Priority order explicit when multiple criteria apply | FAIL | No `<priority_order>` for enforcement gate or conflict resolution |
| Tie-breaking rules match domain cost asymmetry | FAIL | No tie-breaking rule for auditor borderline CLOSED/OPEN decisions |
| **Persona** | | |
| Persona included only for open-ended or stylistic tasks | FAIL | Security auditor subagent has no persona despite being a domain-specific verification role |
| Persona is specific (constrains voice/register), not generic | FAIL | No persona present |
| Persona descriptor is gender-neutral | N/A | No persona present |
| **Output Format** | | |
| Structured output uses two-step reasoning-then-format | FAIL | Auditor output format is implied by three header strings, not specified |
| Single-call JSON places reasoning before answer fields | N/A | Not a JSON output task |
| Machine-parsed output uses exact format specification | FAIL | `## SECURED` / `## OPEN_THREATS` / `## ESCALATE` headers are not guarded against variation |
| **Context Placement** | | |
| Task instruction is at the start of the prompt | PASS | `<purpose>` leads |
| Primary document or input is at the end of the prompt | PASS | `<success_criteria>` closes the file, acting as the acceptance gate |
| Background context is in the middle | PASS | `<available_agent_types>` and `<required_reading>` are mid-file |
| All irrelevant context has been removed | PASS | File is tightly scoped |
| Time-sensitive injected context labeled as snapshot | N/A | No time-sensitive context injected |
| **Self-Consistency** | | |
| Applied only to tasks with a single correct answer | N/A | |
| Inference budget permits 15–20 samples | N/A | |
| **Prompt Length** | | |
| Redundant instructions and repeated context removed | PASS | No significant redundancy detected |
| Long prompts compressed before sending | N/A | Not a RAG/long-context prompt |
| RAG context is extracted relevant passage only | N/A | |
| **System/User Split** | | |
| Persistent instructions in system prompt | N/A | Workflow file, not a system/user split prompt |
| Task-specific instructions in user prompt | N/A | |
| Each instruction appears in exactly one location | PASS | No duplication detected |
| Safety-critical constraints have external validation | FAIL | Enforcement gate is prompt-only; no external validation independent of the model |
| **Agent/Subagent** | | |
| Agent prompts are fully self-contained | FAIL | Auditor prompt is an inline string; relies on `~/.claude/agents/gsd-security-auditor.md` being complete, but that dependency is invisible to the orchestrator |
| All file paths in agent output are absolute | FAIL | No constraint requiring auditor to return absolute file paths for evidence |
| Parallel agents launched in single message block | N/A | Single sequential auditor spawn |
| Adversarial probes specified for verification agents | FAIL | Auditor is a verification agent; no `<adversarial_probes>` block present |
| **Structural Architecture** | | |
| Large prompts decomposed into atomic, single-responsibility modules | PASS | `secure-phase.md` covers one concern; references auditor agent separately |
| Template variables use `${VARIABLE_NAME}` syntax with fallback | PASS | Variables are used (`${PHASE_ARG}`, `${AUDITOR_MODEL}`, etc.) |
| Modules compose at runtime via variable substitution, not copy-paste | PASS | SDK query pattern handles this |
| **Constraint Enforcement** | | |
| Every restriction paired with an equally concrete permission | FAIL | Auditor constraints have restrictions without paired permissions |
| Hard exclusion lists enumerated, not described qualitatively | FAIL | No exclusion list for what the auditor should not flag |
| Known edge cases have precedent-style rulings | FAIL | No `<precedents>` block |
| Confidence thresholds are numeric, not qualitative | FAIL | No confidence thresholds on threat classification |
| **Decision Frameworks** | | |
| Multi-option recommendations use explicit decision tree or table | PASS | Step 1 state table and Step 4 option list are clear |
| Criteria checklists gate complex approaches | PASS | `<success_criteria>` at end acts as completion gate |
| Action permissions framed around reversibility | FAIL | No reversibility framing (e.g., SECURITY.md write vs. implementation changes) |
| **Multi-Phase Workflows** | | |
| Complex tasks organized into explicit named phases | PASS | Steps 0–8 form a named sequence |
| Required steps distinguished from type-specific steps | PASS | `<success_criteria>` items are universal; state-specific steps are clearly conditional |
| Scenario-based branching handles multiple paths explicitly | PASS | States A/B/C are explicit with distinct paths |
| **Memory and Continuity** | | |
| Memory templates use XML tags as section labels | N/A | Not a memory template |
| Compaction summaries include discoveries and failed approaches | N/A | |
| Next steps tied to user's most recent explicit request | PASS | Step 8 routing is conditional on threat outcome, not generic |
| **Modularity** | | |
| Each prompt component has a single responsibility | PASS | File is focused on security verification only |
| Scope boundaries state both inclusions and exclusions | FAIL | No explicit `<scope>/<include>/<exclude>` block |
| **Safety and Trust** | | |
| Validation at system boundaries only; internal interfaces trusted | PASS | Auditor is the only external call; internal state machine is trusted |
| Dual-use capabilities state permissions before restrictions | FAIL | Restrictions stated before (or without) permissions |
| Authorization narrow-scoped; each action confirmed before expanding | PASS | Step 4 user gate before auditor spawn is a confirmation checkpoint |
| **Tone and Style** | | |
| Size constraints use numeric limits, not qualitative descriptors | PASS | No qualitative size descriptors used |
| Instructions use imperative present tense | PASS | Steps use imperative present tense throughout |
| Working notes in analysis tags, not user-facing output | PASS | Internal SDK calls are not surfaced in output |
| **Optimization** | | |
| Prompt flagged as draft for automated optimization | FAIL | No optimization flag |
| Correct optimizer selected | FAIL | Not addressed |
| Held-out test set reserved before optimization begins | FAIL | Not addressed |

---

## Recommendations

**Priority 1 — Add `<persona>`, `<quality_bar>`, and a precise `<output_format>` to the auditor spawn (Sections 1, 6, 7)**

This is the highest-leverage fix. The subagent doing the real security work has no role identity, no success definition, and no machine-parseable output contract. Add the reframe persona pattern ("Your job is not to confirm mitigations look correct — it is to find where they are missing"), a quality bar that requires file:line evidence for every CLOSED threat, and a `SECURITY_VERDICT:` literal verdict line. This will produce consistent, parseable auditor returns and directly improve the enforcement gate's reliability.

**Priority 2 — Replace markdown headers with XML phase tags and wrap constraints in `<permitted>`/`<reserved_for_human_review>` pairs (Sections 4, 14)**

Migrate the `## N. Step Name` structure to `<phase id="N" name="...">` tags, and convert the auditor's bare restriction string into a full `<constraints>/<permitted>/<reserved_for_human_review>` block. This is a structural refactor with no logic changes, but it gives the model unambiguous semantic signal about section boundaries and permission scope, which reduces execution variance.

**Priority 3 — Add `<adversarial_probes>` and numeric `<confidence_scoring>` to the auditor context (Sections 14, 17, 22 Pattern 8)**

The auditor is explicitly a verification agent (the guide's adversarial testing agent pattern applies directly). Without probe dimensions, the auditor will confirm the happy path and stop. Add boundary-value, idempotency, and trust-boundary probes. Add a numeric confidence floor (e.g., below 0.7 = OPEN) so CLOSED/OPEN classification is calibratable and consistent across runs.

**Priority 4 — Add `<precedents>` for the four known ambiguous threat classification cases (Section 14)**

The CLOSED/OPEN binary rule is too coarse for real-world use. The four cases identified above (accepted-in-PLAN-only, test-file-only mitigation, TODO comment, external-dependency transfer) will appear in production and are currently resolved ad hoc. Precedent rulings eliminate that variance at zero runtime cost.

**Priority 5 — Add a `<priority_order>` to the enforcement gate and an absolute-path constraint to the auditor output (Sections 5, 17)**

The multi-choice enforcement gate (accept / verify / cancel) does not specify what happens in non-interactive mode or when the user's choice is ambiguous. Add an explicit priority order that defaults to BLOCK on no selection. Separately, add a constraint requiring the auditor to return all file references as absolute paths — the guide treats this as a hard requirement for all agent output, and evidence citations without absolute paths are unactionable.
