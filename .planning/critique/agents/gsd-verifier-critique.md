# Critique: gsd-verifier.md

- **Agent**: `gsd-verifier.md`
- **Guide version evaluated against**: Prompt Engineering Guide V09

---

## Guide Sections Evaluated

- §1 Task Specification
- §4 Formatting and Structure
- §5 Instruction Framing
- §6 Persona Assignment
- §7 Output Format Handling
- §8 Context Placement
- §10 Prompt Length and Compression
- §11 System vs. User Prompt Allocation
- §13 Structural Architecture Patterns
- §14 Constraint Enforcement
- §16 Multi-Phase Workflows
- §17 Agent and Subagent Patterns
- §19 Modularity and Composition
- §21 Tone and Style Rules
- §22 Production Patterns (Pattern 3, 8, 9)
- §23 Quick-Reference Checklist

---

## Strengths

**§16 Multi-Phase Workflows — explicit, named steps with clear triggers.**
The verification process is organized into 10 numbered steps (Step 0 through Step 10), each with a clearly defined purpose and handoff condition. Step 0 explicitly branches on "re-verification mode" vs. "initial mode" and redirects to the correct entry point. This mirrors the guide's phase pattern (`<phase id="..." trigger="...">`).

**§14 Constraint Enforcement — three-level artifact status table plus a four-level extended table.**
The agent provides machine-readable status tables mapping (exists, substantive, wired) to verdict labels (VERIFIED, STUB, MISSING, ORPHANED). The Level 4 extension adds a data-flow dimension with equally precise status labels (FLOWING, STATIC, DISCONNECTED, HOLLOW_PROP). This matches §14's emphasis on numeric and enumerated thresholds over qualitative descriptions.

**§5 Instruction Framing — explicit decision tree for overall status determination.**
Step 9 lists three mutually exclusive conditions evaluated in strict priority order, with the most restrictive checked first. The tie-break is explicit: `passed` is only valid when the human verification section is empty. This implements the priority-order pattern from §5 accurately.

**§6 Persona Assignment — reframe pattern used correctly.**
The `<role>` section states: "Your job: Goal-backward verification. Start from what the phase SHOULD deliver, verify it actually exists and works in the codebase." The `<critical_rules>` section reinforces this with "DO NOT trust SUMMARY claims." This is a correct application of the §6 reframe pattern ("Your job is NOT X — it's Y") to displace the model's default assumption that documented completion equals real completion.

**§17 Agent and Subagent Patterns — adversarial probe scope defined.**
`<stub_detection_patterns>` enumerates React component stubs, API route stubs, and wiring red flags with concrete code patterns. This operationalizes the §17 adversarial probe requirement with domain-specific examples rather than generic instructions.

**§7 Output Format Handling — machine-parsed output format fully specified.**
The YAML frontmatter schema for the output VERIFICATION.md is exhaustively defined: field names, types, optionality conditions, and literal value constraints (`passed | gaps_found | human_needed`). The `<output>` section also specifies the exact return message format for the orchestrator, including conditional blocks per status. This matches §7's machine-parsed output specification pattern closely.

**§16 Scenario-based branching — explicit condition guards.**
Step 7b spot-checks specify hard constraints: "each check must complete in under 10 seconds," "do not start servers," "do not modify state." Numeric limits appear in output size rules too ("2–4 behaviors"). This matches §21's preference for numeric limits over qualitative terms.

**§23 Quick-Reference Checklist — self-audit checklist present.**
The `<success_criteria>` section provides a checkbox list of 17 items the agent must satisfy before completing, covering the full verification pipeline. This is a direct implementation of the guide's pre-emission checklist discipline.

---

## Weaknesses

### W1 — Persona is generic and does not constrain voice or register (§6)

The `<role>` tag provides functional description only:

> "You are a GSD phase verifier. You verify that a phase achieved its GOAL, not just completed its TASKS."

The guide (§6, Action 2) requires that a persona constrain register, voice, or domain-specific style to be effective. "Generic expert framing produces no measurable accuracy gain." The role here names the job but does not specify how the agent communicates: terse or verbose, assertive or hedged, evidence-first or narrative-first. The guide's Role-Domain Mapping table shows the effective form: "Verification specialist. Your job is to try to break it." — the current prompt approximates this structurally but omits any behavioral voice constraints. No strengths enumeration (per §6 Strengths Listing) exists.

### W2 — No XML tags on top-level structural sections; uses ad-hoc tag names that diverge from the guide vocabulary (§4)

The guide specifies a shared XML tag vocabulary: `<task>`, `<persona>`, `<context>`, `<constraints>`, `<output_format>`, `<examples>`. The agent uses `<role>`, `<required_reading>`, `<project_context>`, `<core_principle>`, `<verification_process>`, `<output>`, `<critical_rules>`, `<stub_detection_patterns>`, `<success_criteria>`. None of these map to the canonical vocabulary from §4's "XML tag vocabulary for prompt structure" table.

The consequence is that the agent cannot compose predictably with other modules in the GSD system that assume the standard vocabulary. Section §19 (Modularity and Composition) requires that "modules reference other modules only via template variables" and that tag names follow a shared vocabulary for interoperability.

### W3 — `<critical_rules>` repeats constraints already stated in `<verification_process>` (§11, Action 3)

The guide states (§11, Action 3): "State each instruction exactly once. Repeated instructions consume context and add noise without reinforcing compliance."

Examples of duplication:
- `<critical_rules>`: "DO NOT trust SUMMARY claims." — already stated in `<role>`: "Do NOT trust SUMMARY.md claims."
- `<critical_rules>`: "DO NOT skip key link verification." — Step 5 already mandates this inline.
- `<critical_rules>`: "DO NOT commit." — Step 10 already states "DO NOT COMMIT."
- `<critical_rules>`: "Structure gaps in YAML frontmatter" — Step 10 is entirely dedicated to this.

This is a direct checklist failure under §23: "Each instruction appears in exactly one location."

### W4 — Negative instruction framing throughout `<critical_rules>` and the body (§5, Action 1)

The guide requires converting negative instructions to positive equivalents before emitting any prompt. The conversion is mechanical and explicitly tabulated in §5. The agent contains at least seven negated directives that were not converted:

- "DO NOT trust SUMMARY claims" → "Verify the component against the codebase directly; treat SUMMARY.md as unvalidated metadata"
- "DO NOT assume existence = implementation" → "For artifacts that render dynamic data, require evidence at all four levels: exists, substantive, wired, and data-flowing"
- "DO NOT skip key link verification" → "Run key link verification for every truth, regardless of artifact pass status"
- "DO NOT commit" → "Return the VERIFICATION.md path and status to the orchestrator; leave committing to the orchestrator"
- "Do NOT trust SUMMARY.md claims" (in `<role>`) → same reframe as above

The only valid context for a negative clause per §5 is the reframe pattern in §6. "DO NOT trust" is not the reframe pattern — it is a prohibition that has a direct positive equivalent.

### W5 — No `<audience>` tag; task consumer and quality bar are implicit (§1, Actions 1–2)

The guide (§1, Action 1) requires explicit identification of: (a) what output is requested, (b) why it matters, and (c) what a high-quality response looks like. Action 2 requires encoding the audience's domain knowledge and vocabulary level. The agent identifies the output (VERIFICATION.md) and broadly implies the consumer (the orchestrator and the developer), but neither is stated explicitly. There is no `<audience>` or `<quality_bar>` tag. The quality bar — what separates a good verification from a bad one — is embedded inside the process steps rather than stated upfront as an independent constraint.

### W6 — No `<examples>` block with commentary for the verification judgment call (§3, §22 Pattern 2)

The agent references an external file for calibration examples:

> `@~/.claude/get-shit-done/references/few-shot-examples/verifier.md`

The guide (§3) requires that examples be selected by semantic similarity, ordered simple to complex, span diverse sub-types, and use consistent formatting. More critically, §22 Pattern 2 states: "Accompany each qualitative instruction with at least one concrete example that demonstrates the target standard." The stub detection judgment ("A grep match is a STUB only when...") is the hardest call in this agent — it requires distinguishing real stubs from initial state, test fixtures, and type defaults. This judgment is stated as a rule but has no inline example pair showing a correct STUB call vs. a correct NOT-STUB call. The external reference may contain these, but per §17 ("Each agent prompt must be fully self-contained when spawned"), critical calibration examples must be inline, not externally referenced.

### W7 — Confidence thresholds for stub classification are qualitative, not numeric (§14)

The guide (§14, Confidence Thresholds) states: "Numeric thresholds beat qualitative terms like 'high confidence' — they are calibratable." The agent's stub classification rule uses:

> "A grep match is a STUB only when the value flows to rendering or user-visible output AND no other code path populates it with real data."

This is a qualitative two-condition rule. It does not specify what confidence level is required to call STUB vs. WARNING vs. INFO. The severity categorization (Blocker / Warning / Info) is defined in terms of impact ("prevents goal") but without a numeric confidence floor analogous to §14's 0.7–1.0 scale. A verification agent that cannot distinguish a 90%-certain stub from a 60%-certain stub will produce inconsistent severity classifications across runs.

### W8 — External file references for critical behavioral rules break self-containment (§17)

The agent has four `@`-reference imports:

```
@~/.claude/get-shit-done/references/mandatory-initial-read.md
@~/.claude/get-shit-done/references/verification-overrides.md
@~/.claude/get-shit-done/references/gates.md
@~/.claude/get-shit-done/references/thinking-models-verification.md
```

The guide (§17, Self-contained agent prompts) states: "Every agent receives its full operating instructions directly — context inheritance from the parent is unavailable." External references to files that may not exist in a spawned agent context, or that change independently of this prompt, violate self-containment. The `thinking-models-verification.md` reference is placed at a critical decision point ("At verification decision points, apply structured reasoning") — if that file is unavailable, the agent has no structured reasoning guidance for the hardest calls. This is a reliability gap, not a style issue.

---

## Concrete Improvements

### I1 — Replace `<role>` with a `<persona>` tag that constrains behavioral voice

Current:
```xml
<role>
You are a GSD phase verifier. You verify that a phase achieved its GOAL, not just completed its TASKS.
...
</role>
```

Rewrite:
```xml
<persona>
You are a phase verification specialist. Your job is not to confirm the implementation is done — it is to find what is broken, hollow, or disconnected.

Evidence over assertion: every finding requires a grep match, file check, or command output. "Looks correct by inspection" is not verification.

Your strengths:
- Distinguishing task completion from goal achievement
- Tracing data flow from API through component to render
- Detecting stubs, orphans, and broken wiring in a codebase
- Producing structured, machine-parseable reports for downstream orchestrators
</persona>
```

This constrains voice (evidence-first, skeptical), applies the reframe pattern, and adds the strengths enumeration from §6.

### I2 — Inline one calibrating example for the stub/not-stub judgment

Add inside `<verification_process>`, immediately after the stub classification rule:

```xml
<examples>
  <example>
    <input>
    grep finds: `const [messages, setMessages] = useState([])`
    later in same file: `useEffect(() => { fetch('/api/messages').then(r => r.json()).then(setMessages) }, [])`
    </input>
    <output>NOT A STUB — initial empty state overwritten by fetch. Verify the fetch result renders correctly (Level 3).</output>
    <commentary>The empty array is an initialization value, not a hardcoded final value. The fetch populates it. Skip stub classification; proceed to wiring check.</commentary>
  </example>
  <example>
    <input>
    grep finds: `const [messages, setMessages] = useState([])`
    no fetch, query, or store subscription found in the file
    JSX contains: `{messages.map(m => <Message key={m.id} {...m} />)}`
    </input>
    <output>STUB — state is never populated. Renders empty list. Classify as ✗ MISSING data source.</output>
    <commentary>The component is wired (state rendered) but the data source is absent. Level 4 failure: DISCONNECTED.</commentary>
  </example>
</examples>
```

### I3 — Consolidate `<critical_rules>` into the steps that own each rule; delete the section

Remove the `<critical_rules>` block entirely. Relocate each rule to its point of use:

- "DO NOT trust SUMMARY claims" → already in `<role>`/`<persona>`, remove from `<critical_rules>`
- "DO NOT skip key link verification" → Step 5 preamble
- "Structure gaps in YAML frontmatter" → Step 10 header
- "DO NOT commit" → `<output>` Return to Orchestrator section (already present there)
- "Keep verification fast" → Step 7 and Step 7b constraints (already specified inline)

This eliminates all duplication violations under §11 Action 3.

### I4 — Convert all `DO NOT` directives to positive equivalents

Apply the §5 conversion table mechanically to every negative directive in the file:

| Current (negative) | Replacement (positive) |
|---|---|
| "DO NOT trust SUMMARY claims" | "Verify all claims against the codebase directly. Treat SUMMARY.md as unvalidated metadata." |
| "DO NOT assume existence = implementation" | "Require evidence at all four levels for artifacts rendering dynamic data: exists, substantive, wired, data-flowing." |
| "DO NOT skip key link verification" | "Run key link verification for every truth, even when all artifacts pass." |
| "DO NOT commit" | "Return the VERIFICATION.md path to the orchestrator; committing is the orchestrator's responsibility." |

### I5 — Add numeric confidence thresholds to stub severity classification

Replace the current qualitative severity categories with a numeric scale:

```xml
<constraints>
  <confidence_scoring>
    - 0.9–1.0: Pattern unambiguously matches stub signature AND no data-source path found — classify as Blocker
    - 0.7–0.9: Pattern matches stub signature; data-source path exists but does not reach the rendered variable — classify as Warning
    - 0.5–0.7: Pattern matches but context is ambiguous (could be initialization, test fixture, or type default) — classify as Info; note for human review
    - Below 0.5: Omit from report
  </confidence_scoring>
</constraints>
```

### I6 — Inline critical behavioral content from external references, or provide fallback text

For `@~/.claude/get-shit-done/references/thinking-models-verification.md` specifically — the most critical external dependency — add an inline fallback directly in the verification decision point:

```xml
At verification decision points, apply structured reasoning.
${THINKING_MODELS_VERIFICATION?"@~/.claude/get-shit-done/references/thinking-models-verification.md":"
Before determining each truth status, reason explicitly:
1. What evidence would prove this truth holds?
2. What evidence did I find?
3. Does the evidence found satisfy the proof requirement?
Only after completing steps 1–3, assign a status.
"}
```

This preserves the modular reference while ensuring the agent has fallback reasoning guidance if the file is unavailable.

### I7 — Add `<audience>` and `<quality_bar>` at the top of the prompt

Insert immediately after the frontmatter block:

```xml
<audience>
The orchestrating GSD agent that will parse the VERIFICATION.md frontmatter to decide next steps. A human developer who may read the narrative report to understand what gaps exist and what human testing is needed. Both consumers are technically fluent; no explanation of basic concepts is required.
</audience>

<quality_bar>
A high-quality verification report:
- Assigns a status to every must-have truth with evidence, not assertion
- Includes at least one adversarial probe beyond the happy path
- Structures gaps in YAML frontmatter parseable by /gsd-plan-phase --gaps
- Does not mark status as passed when human verification items exist
- Completes without running the application or modifying any files
</quality_bar>
```

---

## Overall Score

**5 / 10**

The agent demonstrates genuine strengths in multi-phase workflow structure (the 10-step process), machine-parseable output specification, status decision trees with explicit priority ordering, and adversarial stub detection patterns. These are non-trivial implementations of guide principles.

The score is held at 5 by four systemic issues that degrade reliability in production:

1. Self-containment is broken — four critical behavioral references are external files that may not resolve when the agent is spawned in an isolated context (§17).
2. The hardest judgment call (stub vs. not-stub) has no inline calibrating example and no numeric confidence floor, leaving the agent to interpret qualitative rules inconsistently across runs (§3, §14).
3. Instructions are duplicated across `<critical_rules>` and their point-of-use steps, with the duplication taking negated form that the guide explicitly prohibits (§5, §11).
4. The persona constrains function but not voice or register, yielding no behavioral gain over a bare task description (§6).

Fixes I1 through I4 are low-effort and would move the score to approximately 7. Fixes I5 and I6 require moderate effort and would reach 8. Fix I7 is cosmetic but rounds out checklist compliance.
