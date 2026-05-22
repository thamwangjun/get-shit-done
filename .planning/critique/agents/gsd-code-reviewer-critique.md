# Critique: gsd-code-reviewer.md

**Agent:** `gsd-code-reviewer.md`
**Critique date:** 2026-04-30
**Guide version evaluated against:** PROMPT_ENGINEERING_GUIDE_V09.md

---

## Guide Sections Evaluated

The following sections from the guide are applicable to this agent and were evaluated:

- Section 1: Task Specification
- Section 4: Formatting and Structure
- Section 5: Instruction Framing
- Section 6: Persona Assignment
- Section 7: Output Format Handling
- Section 8: Context Placement
- Section 10: Prompt Length and Compression
- Section 11: System vs. User Prompt Allocation
- Section 13: Structural Architecture Patterns
- Section 14: Constraint Enforcement
- Section 16: Multi-Phase Workflows
- Section 17: Agent and Subagent Patterns
- Section 19: Modularity and Composition
- Section 21: Tone and Style Rules
- Section 22: Production Patterns (Patterns 1–3, 6, 9)
- Section 23: Quick-Reference Checklist

---

## Strengths

### S1. Detailed output format specification (Sections 7, 22 Pattern 3)

The agent provides a complete REVIEW.md schema upfront — YAML frontmatter fields with types, Markdown body structure, section headings, and a concrete example of each finding level (CR-01, WR-01, IN-01). This matches Section 22 Pattern 3's directive: "State the required output structure, field names, ordering, and an example before the model begins its task."

### S2. Explicit scope boundaries with both inclusions and exclusions (Sections 14, 19)

`<review_scope>` enumerates three named categories of issues to detect and explicitly marks performance issues out of scope for v1. `<step name="scope_files">` lists excluded file patterns exhaustively. This matches Section 19's guidance: "state both what to include and what falls outside scope with equal specificity."

### S3. Multi-phase workflow with named steps (Section 16)

`<execution_flow>` decomposes work into five named `<step>` elements — `load_context`, `scope_files`, `review_by_depth`, `classify_findings`, `write_review`. Each step has a clear responsibility and the sequencing is explicit. This closely follows Section 16's phase pattern.

### S4. Fail-closed fallback logic (Section 14, Section 17)

The fallback file discovery includes an explicit error directive: "fail closed with error: 'Cannot determine review scope.'" This is the correct defensive posture for an agent (Section 17: "Every agent receives its full operating instructions directly"). The guard against silent mis-scoping is production-grade.

### S5. Depth validation with defense-in-depth note (Sections 14, 17)

> "Validate depth (defense-in-depth): If depth is not one of `quick`, `standard`, `deep`, warn and default to `standard`. The workflow already validates, but agents should not trust input blindly."

This directly reflects Section 17's "self-contained agent prompts" principle and Section 14's "explicit permission pairs" spirit — the agent validates its own inputs rather than depending on the caller.

### S6. Severity classification with concrete field requirements (Section 14, 22 Pattern 6)

Each severity level (Critical, Warning, Info) has enumerated examples. Every finding is required to include `file`, `line`, `issue`, and `fix`. The distinction between `status: clean` and `status: skipped` is documented with rationale. This is confidence-threshold thinking applied at a structural level (Section 22 Pattern 6).

### S7. YAML frontmatter with agent metadata (Section 11, 17)

The frontmatter encodes `name`, `description`, `tools`, and `color`. The description includes the spawning workflow context. This aligns with Section 11's YAML frontmatter pattern for agent configuration.

---

## Weaknesses

### W1. Persona is generic and role-mismatched (Section 6)

> `<role>` "You are a GSD code reviewer. You analyze source files for bugs, security vulnerabilities, and code quality issues."

The guide (Section 6, Table: Role-domain mapping) states that for code review, "Code reviewer" is the *ineffective* framing and "Senior security engineer conducting a focused security review" is the *effective* framing. The current persona does not constrain voice, register, or domain-specific style. Section 6 Action 2: "Generic expert framing produces no measurable accuracy gain. A persona must constrain register, voice, or domain-specific style to be effective."

The `<role>` tag is also non-standard. The guide's XML vocabulary (Section 4) specifies `<persona>` as the canonical tag for this purpose.

### W2. No positive instruction equivalents for negative rules (Section 5)

`<critical_rules>` contains multiple negative framing instructions:

> "DO NOT modify source files."
> "DO NOT flag style preferences as warnings."
> "DO NOT report issues in test files unless..."
> "Performance issues (O(n²), memory leaks) are out of v1 scope. Do NOT flag them..."

Section 5 Action 1 is unambiguous: "Before emitting any prompt, scan for negated instructions. Rewrite each as a positive specification of the desired behavior." Examples of required rewrites:
- "DO NOT modify source files" → "Review is read-only. Use the Write tool only for REVIEW.md creation."
- "DO NOT flag style preferences as warnings" → "Classify only issues that cause or risk bugs as Warning or Critical."
- "DO NOT report issues in test files unless..." → "Review test files only when findings affect test reliability (e.g., missing assertions, flaky patterns)."

### W3. Missing audience specification (Section 1)

Section 1 Action 2 requires explicitly encoding the audience: "their domain knowledge, vocabulary level, and any relevant assumptions they bring." The agent does not specify who consumes REVIEW.md. The downstream consumer — the `/gsd-code-review-fix` workflow and the human engineer — have different needs. The guide's `<audience>` tag and `<quality_bar>` tag are absent entirely.

### W4. No few-shot examples for finding format (Sections 3, 22 Pattern 2)

Section 22 Pattern 2 states: "Accompany each qualitative instruction with at least one concrete example that demonstrates the target standard. Qualitative terms like 'concise' and 'clear' are subjective; examples make them measurable."

The `<classify_findings>` step describes severity levels in prose but provides no XML-wrapped `<example>` with `<input>` / `<output>` / `<commentary>` blocks showing a complete finding being classified. The guide's `<examples>` container pattern (Section 3, Section 4 XML tag vocabulary) is unused. The REVIEW.md body template does include format examples within the write step, but these are output templates, not few-shot behavior examples showing the classification reasoning chain.

### W5. Weak `<project_context>` step — no CoT elicitation for multi-step reasoning tasks (Section 2)

The review task involves multi-step reasoning (discover context → scope files → select depth → classify findings → write output). Section 2's decision tree indicates that multi-step logic tasks warrant a CoT trigger. No CoT trigger ("Take a deep breath and work on this problem step-by-step") or `<analysis>` scratchpad instruction appears anywhere in the prompt. The guide (Section 2) also specifies that reasoning should be elicited *before* the answer — the agent writes findings directly without an explicit reasoning-separation instruction.

### W6. `<critical_rules>` duplicates constraints already stated in `<execution_flow>` (Section 11)

Section 11 Action 3: "State each instruction exactly once. Repeated instructions consume context and add noise without reinforcing compliance."

Examples of duplication:
- "DO use line numbers. Never 'somewhere in the file'" — this is already implicit in the `<classify_findings>` step's "Each finding MUST include: `line`: Line number or range."
- "DO NOT modify source files" — already stated as "4. Return to orchestrator: DO NOT commit" in `<step name="write_review">`.
- Severity criteria appear in both `<review_scope>` (as issue categories) and `<classify_findings>` (as severity levels) with overlapping content.

### W7. `disallowedTools` not specified in frontmatter (Section 17)

Section 17 (Subagent configuration in frontmatter) shows the `agentMetadata.disallowedTools` list as a first-class field for read-only subagents. The agent's tools are `Read, Write, Bash, Grep, Glob` — the `Write` tool is intentionally limited to REVIEW.md creation only, but there is no `disallowedTools` guard (e.g., `Agent`, `Edit`, `NotebookEdit`). Section 17 also specifies `whenToUse`, `criticalSystemReminder`, and `permissionMode` fields — all absent from the frontmatter. This means the orchestrating model receives no machine-readable trigger description or safety reminder.

### W8. No confidence threshold for findings (Section 14, 22 Pattern 6)

Section 14 states: "Numeric thresholds beat qualitative terms like 'high confidence' — they are calibratable." Section 22 Pattern 6 explicitly calls for a `<reporting_threshold>` specifying minimum confidence for inclusion. The agent has no reporting threshold. There is no instruction distinguishing "I am 95% certain this is a SQL injection" from "this looks suspicious but I'm not sure." This risks false-positive noise in REVIEW.md, which the guide identifies as a quality problem that "requires the reader to apply the filter manually."

### W9. Priority ordering absent for conflicting review signals (Section 5)

The agent may encounter signals that conflict — for example, code that matches a "dangerous function" grep pattern (`eval`) but is actually a safe use in a test harness, or code where CLAUDE.md conventions override default style rules. Section 5 specifies: "When multiple considerations apply, list them with explicit priority." No `<priority_order>` block exists. The agent has no declared rule for what wins when project conventions and built-in checks disagree.

### W10. `<project_context>` section uses mixed tag vocabulary (Section 4)

The section uses both XML tags (`<step>`, `<execution_flow>`) and bold markdown headers (`**Project instructions:**`, `**Project skills:**`, `**1. Read mandatory files:**`) interchangeably within steps. Section 4 Action 2: "When a prompt contains multiple distinct sections, wrap each in a semantically named XML tag. Tags name what the section is, not just where it starts." The `<project_context>` block uses prose with bold markers rather than the guide's XML vocabulary (`<context>`, `<constraints>`, `<task>`). Inconsistent tag use degrades structural clarity.

---

## Concrete Improvements

### Improvement 1: Replace `<role>` with a specific `<persona>` using the reframe pattern

**Current (weak):**
```
<role>
You are a GSD code reviewer. You analyze source files for bugs, security vulnerabilities, and code quality issues.
</role>
```

**Recommended:**
```xml
<persona>
You are a senior software engineer conducting a structured code review. Your job is not to
approve code — it is to find defects the author missed.

Your strengths:
- Identifying logic errors, edge cases, and security vulnerabilities by reading code in context
- Applying language-specific idiom checks (JS/TS, Python, Go, C/C++, Shell)
- Producing precise, actionable findings with file paths, line numbers, and fix snippets
- Distinguishing confirmed defects from style preferences
</persona>
```

This applies Section 6 Action 2 (specific persona), the reframe pattern ("not to approve — to find"), and the strengths-listing pattern.

### Improvement 2: Convert all negative rules in `<critical_rules>` to positive equivalents

**Current (negative):**
```
**DO NOT modify source files.** Review is read-only. Write tool is only for REVIEW.md creation.
**DO NOT flag style preferences as warnings.** Only flag issues that cause or risk bugs.
**DO NOT report issues in test files** unless they affect test reliability...
```

**Recommended:**
```xml
<constraints>
  <permitted>
    - Read any file in the repository using Read, Grep, Glob, or Bash(read-only)
    - Write REVIEW.md to the designated phase directory
    - Run read-only shell commands: grep, find, git diff, git log
  </permitted>
  <reserved_for_human_review>
    - Modifying any source file
    - Running write operations: git add, git commit, npm install
  </reserved_for_human_review>
  <exclusions>
    - Style preferences that do not risk bugs (classify those as Info only if included at all)
    - Test file issues that do not affect test reliability or correctness
    - Performance issues (O(n²), memory leaks) unless they are also correctness defects
    - Issues in generated files: *.min.js, *.bundle.js, dist/, build/
  </exclusions>
</constraints>
```

### Improvement 3: Add a `<reporting_threshold>` with numeric confidence floor

Insert before `<step name="write_review">`:

```xml
<constraints>
  <reporting_threshold>
    Report a finding only when you are >80% confident the issue exists and would cause
    a bug, security vulnerability, or test failure in normal operation.
    - 0.9–1.0: Confirmed defect — report with full detail
    - 0.8–0.9: Clear pattern, plausible exploit path — report with caveat
    - Below 0.8: Omit. Do not report speculative or theoretical issues.

    When uncertain whether a pattern is a defect or a valid idiom, omit it or
    downgrade to Info with a note that manual verification is needed.
  </reporting_threshold>
</constraints>
```

### Improvement 4: Add `<priority_order>` for conflicting signals

```xml
<constraints>
  <priority_order>
    1. Security vulnerabilities (Section: Security in review_scope) — always Critical
    2. Project conventions from CLAUDE.md — override default style rules
    3. Language-specific checks from depth_levels
    4. Generic quality patterns (magic numbers, naming, duplication)
  </priority_order>
  <tie_breaking>
    When a finding matches a built-in check but CLAUDE.md documents it as an accepted
    pattern, omit the finding or downgrade to Info with a reference to the convention.
  </tie_breaking>
</constraints>
```

### Improvement 5: Add `agentMetadata` to YAML frontmatter

**Current frontmatter:**
```yaml
name: gsd-code-reviewer
description: Reviews source files for bugs, security issues, and code quality problems...
tools: Read, Write, Bash, Grep, Glob
color: "#F59E0B"
```

**Recommended addition:**
```yaml
agentMetadata:
  agentType: 'CodeReviewer'
  permissionMode: 'dontAsk'
  disallowedTools:
    - Agent
    - Edit
    - NotebookEdit
    - ExitPlanMode
  whenToUse: >
    Spawned by /gsd-code-review. Analyzes changed source files for bugs, security
    vulnerabilities, and code quality issues. Produces REVIEW.md at the specified
    phase_dir path. Requires config block with depth and files list.
  criticalSystemReminder: 'CRITICAL: READ-ONLY review agent. Never modify source files. Write tool is ONLY for creating REVIEW.md.'
```

### Improvement 6: Add a few-shot classification example

Insert into `<classify_findings>` to anchor the severity calibration:

```xml
<examples>
  <example>
    <input>
      File: src/api/users.ts:47
      Code: const query = `SELECT * FROM users WHERE id = ${req.params.id}`;
    </input>
    <output>
      Severity: Critical
      Issue: SQL injection — user-controlled `req.params.id` is interpolated directly into SQL string without parameterization.
      Fix: Use parameterized query: `db.query('SELECT * FROM users WHERE id = $1', [req.params.id])`
    </output>
    <commentary>
      Direct string interpolation from `req.params` into a SQL string is a confirmed
      injection path regardless of upstream validation. This is >0.95 confidence Critical.
    </commentary>
  </example>
  <example>
    <input>
      File: src/utils/format.ts:12
      Code: export function formatDate(d) { return d.toISOString(); }
    </input>
    <output>
      Severity: Warning
      Issue: Missing null/undefined check — `d.toISOString()` throws if `d` is null or undefined.
      Fix: Add guard: `if (!d) return ''; return d.toISOString();`
    </output>
    <commentary>
      Unguarded method call on a parameter with no type annotation. Confidence ~0.85
      (depends on caller discipline). Classified as Warning, not Critical, because
      it causes a crash rather than a security vulnerability.
    </commentary>
  </example>
</examples>
```

---

## Overall Score: 6 / 10

**Justification:**

The agent is operationally solid. Its execution flow is well-structured with named phases, its output format specification is complete and machine-parseable, its scope boundaries are explicit, and its fail-closed fallback logic shows production discipline. These are non-trivial strengths.

However, the prompt diverges from the guide on several high-leverage dimensions:

1. The persona is generic (Section 6 — the guide's single most actionable improvement for style/voice prompts).
2. The `<critical_rules>` section is full of negative instructions — a Section 5 violation that the guide flags as mechanical to fix.
3. No confidence threshold exists (Section 14 / Pattern 6) — the most important quality control mechanism for a filtering task like code review.
4. The YAML frontmatter lacks `agentMetadata` (Section 17) — meaning the orchestrating model has no machine-readable trigger description or safety boundary.
5. No few-shot examples anchor the severity classification (Section 3 / Pattern 2).

The score of 6 reflects: structurally competent, outputs are parseable and the multi-phase workflow is correctly implemented, but the persona, instruction framing, constraint enforcement, and agent metadata all fall below the guide's standards in ways that are straightforward to remediate.
