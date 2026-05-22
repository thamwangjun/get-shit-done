# Prompt Engineering Critique: gsd-security-auditor

- **Agent**: `gsd-security-auditor.md`
- **Critique date**: 2026-04-30
- **Guide version evaluated against**: PROMPT_ENGINEERING_GUIDE_V09

---

## Guide Sections Evaluated

The following guide sections have direct bearing on this agent's design:

- §1 Task Specification
- §4 Formatting and Structure
- §5 Instruction Framing
- §6 Persona Assignment
- §7 Output Format Handling
- §8 Context Placement
- §11 System vs. User Prompt Allocation (YAML frontmatter)
- §13 Structural Architecture Patterns
- §14 Constraint Enforcement
- §16 Multi-Phase Workflows (phase pattern)
- §17 Agent and Subagent Patterns
- §20 Safety and Trust Patterns
- §21 Tone and Style Rules
- §22 Production Patterns (§22 Pattern 3, 6, 9)
- §23 Quick-Reference Checklist

---

## Strengths

**§16 / §4 — Explicit phase structure using named `<step>` tags**
The `<execution_flow>` block uses named, sequenced steps (`load_context`, `analyze_threats`, `verify_and_write`) that create clear cognitive boundaries, closely mirroring the `<phase id="N" name="...">` pattern recommended in §16. Each step has a single responsibility.

**§7 / §22 Pattern 3 — Output format specified completely upfront**
The `<structured_returns>` block pre-defines three mutually exclusive return states — `SECURED`, `OPEN_THREATS`, `ESCALATE` — with full field schemas and markdown table templates for each. This satisfies §7's requirement to specify structure, field names, and ordering before the model begins its task, and directly mirrors §22 Pattern 3.

**§14 — Disposition-to-verification mapping table**
The table mapping `mitigate / accept / transfer` dispositions to their verification methods is a precise, machine-readable constraint that eliminates ambiguity about how each threat type is handled. This is consistent with §14's hard exclusion and structured filtering guidance.

**§17 — Self-contained agent design**
The agent documents what files it must load, where to write output, and what structured result to return — sufficient for it to operate without context inherited from a parent. This matches §17's "self-contained agent prompts" requirement.

**§14 — Explicit write-scope restriction**
`"Implementation files are READ-ONLY. Only create/modify: SECURITY.md."` is a well-scoped, concrete permission boundary consistent with §14's explicit permission pairs guidance. The escalation path (`OPEN_THREATS` or `ESCALATE`) rather than patching code is architecturally sound.

**§5 — Conditional instructions for `threat_flags`**
The agent correctly uses conditional logic: "if maps to existing threat ID → informational. If no mapping → log as `unregistered_flag`." This branching is explicit and deterministic, consistent with §5's conditional instruction pattern.

---

## Weaknesses

### W1 — `<role>` tag instead of `<persona>` (§4, §6)

The agent uses `<role>` as the top-level identity tag. The guide's canonical XML vocabulary (§4) defines `<persona>` as the standard tag for role and identity. Using `<role>` breaks interoperability with any composed prompt system relying on the shared vocabulary.

Additionally, the persona is partially effective but falls short of the specificity required by §6. The current text reads:

> "GSD security auditor. Spawned by /gsd-secure-phase to verify that threat mitigations declared in PLAN.md are present in implemented code."

This describes the agent's origin and mechanical function, but does not constrain register, decision-making posture, or voice. §6 Action 2 states: "A persona must constrain register, voice, or domain-specific style to be effective." The guide's own role-domain mapping table (§6) shows the effective form for a security role is: `"Senior security engineer conducting a focused security review"` — an identity, not a process description.

The "reframe pattern" from §6 is also unused. For this agent — whose job is to verify mitigations exist, not to find new vulnerabilities — the reframe is directly applicable: "Your job is NOT to discover new vulnerabilities — it's to verify declared mitigations are present in code."

### W2 — No `<constraints>` block with paired permissions (§14, §22 Pattern 9)

There is no `<constraints>` block. The permission boundaries are scattered across the `<role>` prose and the `success_criteria` checklist. §14 requires every restriction to be paired with what IS permitted, stated equally concretely, in a dedicated `<constraints>` section. The tool list in the YAML frontmatter (`Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`) is not scoped — `Edit` and `Write` appear without restricting them to SECURITY.md only, and `Bash` is unrestricted (no prefix patterns as §22 Pattern 9 requires).

The guide example for this pattern:
```xml
<constraints>
  <permitted>
    - Read any file in the repository
    - Run read-only shell commands (grep, find, ls, cat, git log)
    - Write to SECURITY.md only
  </permitted>
  <reserved_for_human_review>
    - Modifying implementation files
    - Creating any file other than SECURITY.md
  </reserved_for_human_review>
</constraints>
```

### W3 — No confidence threshold for verification findings (§14, §22 Pattern 6)

The agent classifies every threat as `CLOSED` or `OPEN` with no intermediate confidence level. The guide (§14, §22 Pattern 6) specifically addresses filtering agents: numeric confidence thresholds must be specified for outputs that could produce false positives or false negatives. A grep miss could be a true gap or a file path mismatch; an uncalibrated binary verdict treats both identically.

The missing element:
```xml
<confidence_scoring>
  - Grep pattern found in cited file at expected scope → CLOSED (high confidence)
  - Grep pattern found but in a different file than cited → CLOSED with caveat
  - Grep pattern not found, but cited file path changed → OPEN, flag as path mismatch
  - Grep pattern absent across all plausible files → OPEN (confirmed gap)
</confidence_scoring>
```

### W4 — `<success_criteria>` duplicates information already in `<execution_flow>` (§11, §10)

The `<success_criteria>` checklist at the bottom re-states constraints already expressed in the execution steps:

> `"- [ ] All <required_reading> loaded before any analysis"` — already the first instruction of `<step name="load_context">`.
> `"- [ ] Implementation files never modified"` — already stated in `<role>`.

§11 Action 3 requires: "State each instruction exactly once." The checklist creates redundancy without adding new constraint signal, consuming context budget (§10 Action 1) without benefit.

### W5 — Negative instructions used as primary directives (§5 Action 1)

Several instructions are framed as negations rather than positive specifications:

> `"Does NOT scan blindly for new vulnerabilities."` (in `<role>`)
> `"Do NOT load full AGENTS.md files"` (in `load_context`)
> `"Never patch implementation."` (in `<role>`)

§5 Action 1 requires converting negative instructions to positive equivalents before emitting any prompt. The reframe pattern (§6) is the only valid exception, and it requires explicit displacement framing. These are bare negations, not reframes.

Conversions:
- `"Does NOT scan blindly"` → `"Verify only threats declared in PLAN.md <threat_model>. Skip any issue not in the threat register."`
- `"Do NOT load full AGENTS.md files"` → `"Load SKILL.md (index, ~130 lines) for each skill; load specific rules/*.md files only as each verification step requires them."`
- `"Never patch implementation."` → `"For implementation gaps, write to SECURITY.md only. Route fixes via OPEN_THREATS or ESCALATE return states."`

### W6 — Missing `<audience>` and `<quality_bar>` (§1 Actions 1–2)

§1 requires three explicit task components: what output is requested, why it matters, and what a correct response looks like. The agent defines the output (`SECURITY.md` + structured return) but omits:

- **Audience**: The structured returns are consumed by the `/gsd-secure-phase` orchestrating agent, not a human. This distinction should be stated — it affects how much prose explanation is needed versus machine-parseable tokens.
- **Quality bar**: What constitutes a high-quality audit? e.g., "Every threat in the register has a verdict with cited evidence. No verdict is issued without a grep command run and a result recorded."

### W7 — No CoT trigger for multi-step threat classification logic (§2)

The `analyze_threats` step requires the agent to: (a) read a threat entry, (b) identify its disposition, (c) select the correct verification method, (d) execute the grep/check, and (e) record a classified result. This is multi-step symbolic reasoning — §2's decision tree routes this to a CoT trigger. No CoT trigger is present.

The standard trigger from §2: `"Take a deep breath and work on this problem step-by-step."` should gate each threat verification, or at minimum the classification step within `analyze_threats`.

### W8 — Output format for SECURITY.md body is unspecified (§7, §22 Pattern 3)

The `<structured_returns>` block specifies the agent's return message format precisely. However, the actual content written to `SECURITY.md` — the primary durable artifact — has no format specification. §7 and §22 Pattern 3 require output structure to be fully specified upfront including field names, ordering, and an example. The reader of SECURITY.md (human or downstream agent) has no defined contract for what sections or fields will appear.

---

## Concrete Improvements

### Improvement 1 — Replace `<role>` with `<persona>` using reframe pattern

```xml
<persona>
You are a security verification specialist for the GSD workflow. Your job is not to discover
new vulnerabilities — it's to verify that every threat declared in PLAN.md has been
mitigated, accepted, or transferred in the implemented code.

"The code looks secure by inspection" is not verification. You must run grep commands and
cite file:line evidence for every CLOSED verdict.
</persona>
```

### Improvement 2 — Add a `<constraints>` block with scoped tool permissions

```xml
<constraints>
  <permitted>
    - Read any file in the repository
    - Run read-only shell commands: grep, find, ls, cat, git log
    - Write to SECURITY.md at the path specified in the config block
  </permitted>
  <reserved_for_human_review>
    - Modifying any implementation file
    - Creating any file other than SECURITY.md
    - Installing packages or running build commands
  </reserved_for_human_review>
</constraints>
```

Update frontmatter to scope tool permissions (§22 Pattern 9):
```yaml
tools:
  - Read
  - Glob
  - Grep
  - Bash(grep:*)
  - Bash(find:*)
  - Bash(ls:*)
  - Bash(cat:*)
  - Write(SECURITY.md)
```

### Improvement 3 — Add confidence tiers to threat verification

```xml
<confidence_scoring>
  - Grep pattern found in the exact file cited in the mitigation plan → CLOSED
  - Grep pattern found in a different file, same module → CLOSED with note: "found at {actual_path}, not {cited_path}"
  - Grep pattern not found; cited file path may have changed → OPEN, note: "path mismatch candidate"
  - Grep pattern absent across all plausible files in the module → OPEN (confirmed gap)
  Report confidence tier for every verdict.
</confidence_scoring>
```

### Improvement 4 — Remove `<success_criteria>` duplication; replace with a single CoT anchor

Remove the `<success_criteria>` checklist entirely. Consolidate the constraints it restates into `<constraints>` (Improvement 2 above). Add a CoT anchor to the `analyze_threats` step:

```xml
<step name="analyze_threats">
Take a deep breath and work through each threat step-by-step:
1. Read the threat entry: ID, category, disposition, mitigation plan.
2. Classify the disposition: mitigate / accept / transfer.
3. Select the verification method from the table below.
4. Execute the verification command. Record the raw result.
5. Issue verdict: CLOSED or OPEN with cited evidence.
...
</step>
```

### Improvement 5 — Specify SECURITY.md output structure

Add a `<security_md_format>` section (or embed inside `<output_format>`):

```xml
<output_format>
SECURITY.md must contain these sections in this order:

1. `## Phase {N} Security Audit` — one-line summary
2. `## Threat Verification` — table: Threat ID | Category | Disposition | Verdict | Evidence (file:line)
3. `## Open Threats` — table present only when threats_open > 0
4. `## Accepted Risks` — table: Threat ID | Rationale | Owner
5. `## Unregistered Flags` — list from SUMMARY.md with no threat mapping; empty section if none

All evidence citations use the format `path/to/file.ext:LINE_NUMBER`.
</output_format>
```

### Improvement 6 — Convert negative instructions to positive form

Replace:
- `"Does NOT scan blindly for new vulnerabilities"` → `"Verify only the threats listed in PLAN.md <threat_model>. Treat any issue not in the threat register as out of scope."`
- `"Do NOT load full AGENTS.md files"` → `"Load SKILL.md (index, ~130 lines) per skill. Load rules/*.md files on demand, one file at a time, as each verification step requires."`
- `"Never patch implementation"` → `"Route all implementation gaps to OPEN_THREATS or ESCALATE return states. Write only to SECURITY.md."`

---

## Overall Score: 5 / 10

**Justification:** The agent has a well-structured multi-step execution flow, precise output return states, and a sound read-only/write-only permission split in prose. These reflect solid domain design. However, it diverges from the guide on five categories simultaneously: it uses a non-standard root tag (`<role>` instead of `<persona>`), omits a `<constraints>` block with paired permissions, leaves tool permissions entirely unscoped in the YAML frontmatter, lacks confidence tiers for binary verdicts that can produce false positives, and uses bare negative instructions throughout. The missing CoT trigger for multi-step threat classification and the unspecified SECURITY.md body format round out the gaps. The agent is functionally coherent but does not meet the guide's structural and safety standards for a production agent prompt.
