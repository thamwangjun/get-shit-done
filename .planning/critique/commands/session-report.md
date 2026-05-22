# Critique: `commands/gsd/session-report.md`

**Critique date:** 2026-04-30
**Guide version:** PROMPT_ENGINEERING_GUIDE_V09.md
**Files reviewed:**
- `commands/gsd/session-report.md` (the command stub)
- `~/.claude/get-shit-done/workflows/session-report.md` (the referenced workflow, the real prompt)

> Note: the command file is a thin dispatch stub; almost all prompt content lives in the workflow file. This critique covers both, with emphasis on the workflow since that is where the model receives its actual instructions.

---

## Strengths

### §4 Formatting and Structure — XML tag usage is correct and consistent

The workflow uses semantically named XML tags throughout: `<task>`, `<context>`, `<priority_order>`, `<execution_steps>`, `<step>`, `<constraints>`, `<permitted>`, `<reserved_for_human_review>`, `<quality_bar>`. This matches the guide's canonical tag vocabulary (§4 XML tag vocabulary table) and is strictly better than markdown headers for Claude-class models. The constraint sub-tags (`<permitted>` / `<reserved_for_human_review>`) are used correctly and match the guide's explicit permission-pair pattern (§14).

### §14 Constraint Enforcement — Permission pairs are present and concrete

The `<constraints>` block pairs what is allowed (`<permitted>`) with what requires human review (`<reserved_for_human_review>`). Both sides are stated with equal specificity — specific commands, specific directories, specific git operations. This satisfies §14's requirement: "Pair every restriction with what IS permitted, stated equally concretely."

### §8 Context Placement — Task instruction leads

The workflow opens with `<task>` before any other block, matching §8 Action 1: "Place the task instruction at the very start of the prompt."

### §5 Instruction Framing — Priority ordering is explicit

`<priority_order>` provides a numbered, ranked list (Accuracy > Completeness > Brevity). This follows §5's priority ordering pattern and removes ambiguity when the three goals conflict (e.g., a section where data is absent but completeness requires a placeholder).

### §7 Output Format Handling — Output structure is fully specified upfront

The workflow embeds the complete output template (markdown headers, table schema, section names, fallback strings like "None recorded") before the model begins writing. This matches §22 Pattern 3: "Output format specified completely and upfront." The template is concrete enough that format variance across runs should be low.

---

## Weaknesses

### Weakness 1 — §1 Task Specification: audience is absent

The guide's §1 Action 2 requires the audience to be explicitly encoded in the prompt: "their domain knowledge, vocabulary level, and any relevant assumptions they bring." The workflow has no `<audience>` tag. The implied reader (a developer reviewing session activity, or a stakeholder receiving a summary) is never stated.

**Impact:** Without an audience signal, the model's register, vocabulary level, and assumed familiarity with GSD concepts (phases, STATE.md, ROADMAP.md) are left to prior defaults. A technical developer audience would tolerate terse, jargon-dense output; a stakeholder audience would need plain-language framing. The prompt cannot serve both without choosing one.

**Checklist failure:** §23 `[ ] Intent, audience, and quality bar are all explicit in the prompt` — audience is missing (quality bar is present; intent is partially present in `<task>`).

---

### Weakness 2 — §5 Instruction Framing: negative instructions not converted

The `<context>` block contains: "Exact token counts are unavailable without API instrumentation — report observable activity metrics only." This is a negated constraint ("unavailable", "only") rather than a positive specification.

More critically, the `<step name="estimate_usage">` section contains the instruction "Label all values as estimates in the report" — but the *form* this label should take is never specified. Should the model write "(est.)" after each number? A footnote? An italic qualifier? The table template uses `(est.)` in the column header label `[N]` for subagents only, but the instruction applies to all metrics. This is an implicit constraint that the guide warns against (§1 Action 3, §21 "Size constraints as hard rules").

**Impact:** Inconsistent labeling across runs. Some calls will parenthesize "(est.)" inline; others will add a footer note; others will omit it entirely.

**Checklist failure:** §23 `[ ] All negative instructions have been converted to positive equivalents` — partial failure.

---

### Weakness 3 — §4 Formatting and §22 Pattern 3: the output template uses prose-described sections, not XML-structured specification

The report output template is a fenced markdown block inside `<step name="generate_report">`. The guide (§4, "Numbered section templates for long-form output") explicitly recommends specifying long-form output sections with XML tags:

> "For long-form outputs such as session summaries, specify sections with XML tags rather than numbered prose."

The template provides section headers (e.g., `## Work Performed`, `### Key Outcomes`) but describes their content in bracketed prose (`[Bullet list: concrete deliverables — files created, features implemented, bugs fixed]`). This is correct for a markdown output target, but the *specification* of each section's content — what to include, what to exclude, how many items, what format — is left loose. The guide's §4 canonical summary template uses XML sub-tags like `<primary_request>`, `<key_concepts>`, `<errors_and_fixes>` with inline instructions per-tag. The session report template is weaker: it describes section content in brackets rather than specifying it as a constraint.

**Impact:** Sections like "Key Outcomes" and "Decisions Made" have no size constraint, no enumeration limit, and no example. Runs will vary widely in verbosity. "One concrete statement per item" appears in `<priority_order>` (Brevity) but is not co-located with the output template where it would be actionable (§22 Pattern 3 calls for format and inline instructions to be co-located).

**Checklist failure:** §23 `[ ] Structured output tasks use a two-step reasoning-then-format approach` — not applicable here, but `[ ] Machine-parsed output uses exact format specification` is partially violated for the prose sections.

---

### Minor Weakness — §6 Persona Assignment: no persona, no rationale for omission

The guide (§6 Action 1) says to assign a persona when "the task is open-ended, stylistic, or requires a specific voice." Session report generation is a structured summarization task — not stylistic — so omitting a persona is the correct call. However, the guide's checklist (§23) still flags `[ ] Persona is included only for open-ended or stylistic tasks`, implying the decision should be a deliberate omission. There is no comment or system note explaining the absence, making it ambiguous whether persona was intentionally excluded or simply forgotten.

This is low severity — the behavior is correct, the documentation of the decision is absent.

---

### Minor Weakness — §11 System vs. User Prompt Allocation: the command stub adds no information

The command file (`commands/gsd/session-report.md`) contains:
- `<objective>` — restates what the workflow already says in `<task>`
- `<execution_context>` — a file include directive
- `<process>` — "Execute the session-report workflow end-to-end"

The `<objective>` block is a pure duplicate of the workflow's `<task>`. §11 Action 3 says: "State each instruction exactly once." The stub and workflow both describe the goal in nearly identical language. The stub's `<objective>` adds zero information the workflow does not already carry.

---

## Specific Rewrites

### Rewrite 1 — Add `<audience>` tag to the workflow (fixes Weakness 1)

Insert after `<context>`:

```xml
<audience>
The primary reader is the developer who ran this GSD session. They are familiar with
GSD concepts (phases, STATE.md, milestones) and want a quick, factual record of what
was accomplished. Secondary readers may be non-technical stakeholders; keep section
headers self-explanatory but do not define GSD terms inline.
</audience>
```

This gives the model an explicit register target and resolves the ambiguity about how much GSD jargon to assume.

---

### Rewrite 2 — Replace loose bracket descriptions in the output template with inline constraints (fixes Weakness 3)

Current `## Key Outcomes` section in the template:

```markdown
### Key Outcomes
[Bullet list: concrete deliverables — files created, features implemented, bugs fixed]
```

Rewrite as:

```markdown
### Key Outcomes

<!-- max 5 bullets; each bullet: one verb phrase + one concrete artifact or result;
     example: "Implemented auth token refresh in src/auth/refresh.ts"
     omit if no deliverables are evidenced by git log or STATE.md -->
```

Current `## Decisions Made` section:

```markdown
### Decisions Made
[From STATE.md decisions table; "None recorded" if absent]
```

Rewrite as:

```markdown
### Decisions Made

<!-- Copy decisions verbatim from STATE.md decisions table; max 5 entries;
     format: "Decision: [what was decided] — Rationale: [why]";
     write "None recorded" if STATE.md has no decisions table -->
```

This co-locates the specification with the template, satisfying §22 Pattern 3 and adding the numeric size constraint §21 requires.

---

### Rewrite 3 — Convert the "label as estimates" instruction to a positive specification with a canonical form (fixes Weakness 2)

Current instruction in `<step name="estimate_usage">`:

> Label all values as estimates in the report.

Rewrite as:

```xml
<step name="estimate_usage">
Derive activity metrics from observable signals using these heuristics:

- Commits: count from git log output
- Files changed: count from git diff stat
- Plans executed: count .planning/**/SUMMARY*.md files modified in the last 24h
- Subagents spawned: estimate as (commits x 1.5), rounded up

Append " (est.)" to the value cell of every derived metric in the Session Summary table.
Use the exact string "(est.)" — no variation. Example: `12 (est.)` not `~12` or `approx. 12`.
</step>
```

The canonical form removes format variance and satisfies §21's rule: "Size constraints use numeric limits, not qualitative descriptors" — extended here to format constraints on inline strings.

---

## Overall Verdict

**Adequate**

The workflow is structurally sound: it uses the guide's XML tag vocabulary correctly, states constraints as permission pairs, places the task instruction first, specifies the output format upfront, and provides an explicit priority order. These are the highest-leverage decisions and they are done right.

The three weaknesses are real but not critical: the missing `<audience>` tag will cause register drift across different session contexts; the loose output template descriptions will produce verbosity variance in prose sections; the unspecified estimate label format will produce minor formatting inconsistency. None of these failures will produce wrong output — they will produce inconsistent output across runs.

The command stub's `<objective>` duplication (§11 violation) is cosmetic. The prompt would pass most production quality gates as-is; the rewrites above would move it from Adequate to Strong.
