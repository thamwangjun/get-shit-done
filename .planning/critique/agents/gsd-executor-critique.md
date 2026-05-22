# Prompt Engineering Critique: gsd-executor.md

- **Agent**: `gsd-executor.md`
- **Critique date**: 2026-04-30
- **Guide version evaluated against**: PROMPT_ENGINEERING_GUIDE_V09.md

---

## Guide Sections Evaluated

The following guide sections are applicable to this agent file:

| Section | Title | Applicable? |
|---------|-------|-------------|
| §1 | Task Specification | Yes |
| §2 | Chain-of-Thought Decisions | Partial (via @-reference deferral) |
| §3 | Few-Shot Example Construction | Yes |
| §4 | Formatting and Structure | Yes |
| §5 | Instruction Framing | Yes |
| §6 | Persona Assignment | Yes |
| §7 | Output Format Handling | Yes |
| §8 | Context Placement | Yes |
| §10 | Prompt Length and Compression | Yes |
| §11 | System vs. User Prompt Allocation | Yes |
| §13 | Structural Architecture Patterns | Yes |
| §14 | Constraint Enforcement | Yes |
| §15 | Decision Frameworks | Yes |
| §16 | Multi-Phase Workflows | Yes |
| §17 | Agent and Subagent Patterns | Yes |
| §19 | Modularity and Composition | Yes |
| §20 | Safety and Trust Patterns | Yes |
| §21 | Tone and Style Rules | Yes |
| §22 | Production Patterns | Yes |

---

## Strengths

### §4 / §17 — XML structure throughout
The agent uses semantically named XML tags (`<role>`, `<execution_flow>`, `<deviation_rules>`, `<checkpoint_protocol>`, `<task_commit_protocol>`, `<tdd_execution>`, etc.) consistently across all sections. This matches §4's requirement to "wrap each [section] in a semantically named XML tag" and §17's self-contained agent prompt pattern. Tags name *what* each section *is*, not just where it starts.

### §14 — Explicit constraint sub-tags and permission pairs
`<destructive_git_prohibition>` pairs a hard exclusion list ("Prohibited commands in worktree context: …") with the permitted alternative (`git checkout -- path/to/specific/file`). `<deviation_rules>` enumerates four rules with explicit triggers, shared process, and a priority ordering. This matches §14's "pair every restriction with what IS permitted."

### §15 — Decision frameworks and priority ordering
`<deviation_rules>` contains an explicit `RULE PRIORITY` block (numbered 1–3), edge case examples, and a tie-breaking heuristic ("When in doubt: Does this affect correctness, security, or ability to complete task?"). This closely follows §15's criteria checklist and tie-breaking patterns.

### §16 — Multi-phase workflow structure with named steps
`<execution_flow>` organises work into explicitly named `<step>` elements with `priority` and `name` attributes. `<checkpoint_protocol>` distinguishes three checkpoint types (human-verify, decision, human-action) with concrete percentages (90%/9%/1%) and per-type instructions. This follows §16's phase pattern and scenario-based branching recommendations.

### §17 — Frontmatter agent configuration
The file uses YAML frontmatter (`name`, `description`, `tools`, `color`) and the `tools:` field scopes permissions to the minimum required tool set (`Read, Write, Edit, Bash, Grep, Glob, mcp__context7__*`). This matches §17's "subagent configuration in frontmatter" and §22 Pattern 9 on minimum-required tool permission scoping.

### §22 Pattern 3 — Output format specified completely with structured template
`<checkpoint_return_format>` and `<completion_format>` both provide fully specified markdown templates including exact field names, table columns, and placeholder tokens. This matches §22 Pattern 3: "output format specified completely and upfront."

### §20 — Authorization and reversibility in commit protocol
`<task_commit_protocol>` stages files individually by name ("NEVER `git add .` or `git add -A`"), records commit hashes, and runs a post-commit deletion check before proceeding. This reflects §20's trust hierarchy (narrow scope, verify before expanding) and §15's reversibility framework.

### §14 — Hard exclusion list with scope boundary
`<deviation_rules>` closes with an explicit `SCOPE BOUNDARY` section that names what is excluded ("Pre-existing warnings, linting errors, or failures in unrelated files") and what the agent must do instead ("Log out-of-scope discoveries to `deferred-items.md`"). This follows §14's hard exclusion list pattern.

---

## Weaknesses

### W1 — §6 Persona Assignment: persona is generic, not role-constrained

**Guide §6 Action 2:** "Generic expert framing ('you are an expert data scientist') produces no measurable accuracy gain. A persona must constrain register, voice, or domain-specific style to be effective."

The agent's `<role>` block reads:
> "You are a GSD plan executor. You execute PLAN.md files atomically, creating per-task commits, handling deviations automatically, pausing at checkpoints, and producing SUMMARY.md files."

This is a task summary, not a persona. It describes *what* the agent does but does not constrain voice, register, tone, decision-making priorities, or strengths. The guide's `<persona>` pattern (§6 "Strengths listing") enumerates what the agent excels at to bias behavior. No strengths listing is present.

The `<role>` tag is also non-standard — the guide's XML vocabulary (§4) defines `<persona>` as the correct tag for role and identity; `<role>` has no documented meaning in the guide's tag vocabulary.

---

### W2 — §5 Instruction Framing: heavy use of negative instructions not converted to positive equivalents

**Guide §5 Action 1:** "Before emitting any prompt, scan for negated instructions ('do not', 'avoid', 'never' as primary directives). Rewrite each as a positive specification of the desired behavior."

The agent contains numerous negative primaries that are not reformulated:

- `<task_commit_protocol>`: "NEVER `git add .` or `git add -A`"
- `<tdd_execution>`: "Do NOT skip RED by proceeding with a passing test."
- `<summary_creation>`: "never use `Bash(cat << 'EOF')` or heredoc commands"
- `<continuation_handling>`: "DO NOT redo completed tasks"
- `<deviation_rules>`: "Do NOT fix them", "Do NOT re-run builds hoping they resolve themselves"
- `<destructive_git_prohibition>`: "NEVER run `git clean` inside a worktree."

While `<destructive_git_prohibition>` is a safety-critical hard prohibition where the reframe pattern (§6) is valid, most of these are operational directives that have clear positive equivalents. The guide permits negative framing *only* for the reframe pattern. Accumulating NEVER/DO NOT throughout an operational prompt degrades instruction clarity.

**Positive conversions for the weakest examples:**
- "NEVER `git add .`" → "Stage each file individually by name: `git add src/api/auth.ts`"
- "DO NOT redo completed tasks" → "Start from the resume point in the prompt; treat completed tasks as already done"
- "Do NOT re-run builds hoping they resolve themselves" → "Each build re-run must be justified by a specific change that addresses the failure"

---

### W3 — §3 Few-Shot Examples: no examples despite complex behavioral rules

**Guide §3 / §22 Pattern 2:** "Accompany each qualitative instruction with at least one concrete example that demonstrates the target standard." and "Abstract instructions paired with a calibrating example."

`<deviation_rules>` defines four complex rules with trigger conditions and edge cases, but relies entirely on inline lists of scenarios ("Wrong queries, logic errors, type errors…") rather than structured examples showing the decision *process*. The guide specifies:

```xml
<example>
  <input>...</input>
  <output>...</output>
  <commentary>...</commentary>
</example>
```

The agent defers to an @-reference (`@~/.claude/get-shit-done/references/executor-examples.md`) for "Extended examples and edge case guide." While this modularity is architecturally sound (§13, §19), it means the agent file itself contains *zero* worked examples of the core rule-application logic. For a reasoning task as nuanced as rule selection under ambiguity, the absence of in-file examples leaves the model without calibrating anchors in its immediate context window.

---

### W4 — §8 Context Placement: task instruction does not lead the prompt

**Guide §8 Action 1:** "Place the task instruction at the very start of the prompt. Models attend most strongly to the beginning of their context."

The file begins with YAML frontmatter, then opens with `<role>` — which is a persona/identity block, not the primary task instruction. The first operational instruction ("Execute the plan completely, commit each task, create SUMMARY.md, update STATE.md") is buried inside `<role>` after two preamble sentences and an @-reference. The primary task instruction is never separately stated in a `<task>` block.

The guide's canonical structure (§8, §4) is:

```xml
<task>{task instruction}</task>   ← leads
<context>{background}</context>   ← middle
<input>{primary content}</input>  ← closes
```

The agent uses `<role>` to do triple duty: persona, task statement, and spawn context. These should be separated into distinct `<persona>` and `<task>` blocks.

---

### W5 — §11 System vs. User Prompt Allocation: instructions are not deduplicated; same content appears in multiple locations

**Guide §11 Action 3:** "State each instruction exactly once. Audit the full prompt before emitting it and consolidate every duplicated instruction to a single canonical location."

The agent restates the same concepts in multiple locations:

- Commit format is described in `<task_commit_protocol>` and also referenced inside `<tdd_execution>` (with different format strings: `test({phase}-{plan}):`, `feat({phase}-{plan}):`, `refactor({phase}-{plan}):`). The canonical commit type table lives in `<task_commit_protocol>` but TDD-specific commit messages in `<tdd_execution>` partially duplicate and partially extend it without cross-referencing.
- The auto-mode logic is explained in both `<auto_mode_detection>` ("Store the result for checkpoint handling below") and `<checkpoint_protocol>` ("Auto-mode checkpoint behavior (when `AUTO_CFG` is `"true"`)")  — with the detection script and the behavioral rules split across two separate sections.
- The checkpoint return format is described in prose inside `<checkpoint_protocol>` and then again as a full template in `<checkpoint_return_format>`.

---

### W6 — §1 Task Specification: quality bar and audience are absent

**Guide §1 Action 1:** "Identify and make explicit: (a) what output is being requested, (b) why that output matters or how it will be used, and (c) what a correct or high-quality response looks like."
**Guide §1 Action 2:** "Encode the audience explicitly in the prompt."

The agent has no `<quality_bar>` or `<audience>` block. While the agent is machine-spawned (audience = orchestrator), the guide requires encoding this explicitly. The "what makes a good response" criterion is implied by the `<success_criteria>` checklist at the bottom, but success criteria (binary pass/fail) are not the same as a quality bar (what distinguishes excellent from merely adequate execution). For example: what makes a good SUMMARY.md one-liner? What makes deviation documentation high-quality vs. perfunctory? These standards are named in `<summary_creation>` ("Good: 'JWT auth with refresh rotation using jose library'" vs. "Bad: 'Authentication implemented'") but are not collected into a `<quality_bar>` block, making them invisible to the model at context start when behavior is calibrated.

---

### W7 — §4 Formatting: mixed XML and markdown header conventions

**Guide §4 Action 2:** "Use XML tags to separate prompt sections. Tags name what the section *is*... This is strictly better than markdown headers or `---` delimiters for Claude-class models."

`<deviation_rules>` mixes XML structure with markdown headers (`**RULE 1: Auto-fix bugs**`, `**RULE PRIORITY:**`, `**SCOPE BOUNDARY:**`, `**FIX ATTEMPT LIMIT:**`, `**Edge cases:**`). These markdown headers interrupt the XML structure without being wrapped in sub-tags. The guide vocabulary (§4) provides `<scenario>`, `<criteria>`, `<precedents>`, and `<priority_order>` tags precisely for these use cases. The deviation rules would be more machine-readable and structured as:

```xml
<deviation_rules>
  <rule id="1" name="auto-fix-bugs" trigger="...">...</rule>
  <rule id="4" name="ask-architectural" trigger="...">...</rule>
  <priority_order>1. Rule 4 applies → STOP ...</priority_order>
  <exclusions>Only auto-fix issues DIRECTLY caused by...</exclusions>
</deviation_rules>
```

---

## Concrete Improvements

### Improvement 1: Replace `<role>` with separated `<persona>` and `<task>` blocks

Move the task statement to a leading `<task>` block and rewrite `<role>` as a proper `<persona>` block with strengths enumeration per §6:

```xml
<task>
Execute the PLAN.md file provided in your prompt. For each task: run the implementation,
apply deviation rules, commit with the correct format, and update STATE.md and ROADMAP.md.
Pause and return a structured checkpoint message at any checkpoint task. Write SUMMARY.md
after all tasks complete.
</task>

<persona>
You are a GSD plan executor — a specialist in translating structured implementation plans
into committed, verified code changes.

Your strengths:
- Executing multi-task plans atomically with per-task commits
- Detecting and classifying deviations without user interruption
- Pausing precisely at checkpoints and returning full state for continuation agents
- Writing substantive SUMMARY.md files that capture decisions and deviations
</persona>
```

---

### Improvement 2: Convert the five strongest negative directives to positive form

Replace the highest-frequency negative commands:

| Current (negative) | Replacement (positive) |
|---------------------|------------------------|
| "NEVER `git add .` or `git add -A`" | "Stage files individually by explicit name: `git add src/api/auth.ts`" |
| "DO NOT redo completed tasks" | "Begin from the resume point; treat each entry in `<completed_tasks>` as already committed" |
| "Do NOT re-run builds hoping they resolve themselves" | "Each build re-run requires a specific code change that addresses the failure" |
| "Do NOT skip RED by proceeding with a passing test" | "Verify RED phase by confirming the test fails before writing implementation" |
| "never use `Bash(cat << 'EOF')` or heredoc commands for file creation" | "Use the Write tool to create all files" |

Retain NEVER only in `<destructive_git_prohibition>` where the reframe pattern (§6) is appropriate: the prohibition is counter-intuitive and must explicitly displace a prior the model would otherwise act on.

---

### Improvement 3: Add inline worked examples to `<deviation_rules>` for the hardest decision boundary

The Rule 1 vs. Rule 2 vs. Rule 4 decision is the highest-stakes ambiguity in the agent. Add three calibrating examples using the guide's XML example format (§3 / §22 Pattern 2):

```xml
<examples>
  <example>
    <input>Task adds a new API endpoint. During implementation, find there is no rate limiting on
    the route and it handles unauthenticated requests.</input>
    <output>Rule 2: Auto-add. Rate limiting and auth on API routes are correctness requirements
    for secure operation — not optional features.</output>
    <commentary>The missing behavior is required for basic security — it meets Rule 2's
    "required for correct/secure operation" trigger.</commentary>
  </example>
  <example>
    <input>Task adds a new user profile page. During implementation, discover the existing
    users table has no index on email, causing slow lookups.</input>
    <output>Rule 2: Auto-add the index. Missing DB indexes on frequently queried columns
    are correctness requirements for performance.</output>
    <commentary>The plan's threat model also covers performance at data boundaries —
    this is a mitigate disposition applied via Rule 2.</commentary>
  </example>
  <example>
    <input>Task adds a new user profile page. The fix for slow email lookups requires splitting
    the monolithic users table into users and user_profiles as separate tables.</input>
    <output>Rule 4: STOP. This is a schema change affecting multiple services — an architectural
    decision the user must make.</output>
    <commentary>A new table (not a column or index) crosses the Rule 4 threshold: "New DB table
    (not column)" is explicitly listed as a Rule 4 trigger.</commentary>
  </example>
</examples>
```

---

### Improvement 4: Consolidate auto-mode detection and checkpoint behavior into a single section

Move the `AUTO_CHAIN`/`AUTO_CFG` bash snippet from `<auto_mode_detection>` into `<checkpoint_protocol>` directly above the "Auto-mode checkpoint behavior" block. Delete `<auto_mode_detection>` as a standalone section. This eliminates the instruction split (§11 Action 3) and keeps the detection logic co-located with its behavioral consequence.

---

### Improvement 5: Add a `<quality_bar>` block after `<task>`

Surface the quality criteria that are currently scattered through `<summary_creation>` as a unified block visible at context start:

```xml
<quality_bar>
A high-quality execution produces:
- Commits that map 1:1 to plan tasks with substantive messages (not "implement feature")
- A SUMMARY.md one-liner that names the technology, approach, and scope
  (e.g., "JWT auth with refresh rotation using jose library", not "Authentication implemented")
- Deviations documented with rule number, trigger, fix, files, and commit hash
- Self-check PASSED before state updates proceed
- No untracked generated files left in the working tree after final commit
</quality_bar>
```

---

## Overall Score: 6 / 10

**Justification:**

The agent is architecturally strong. It uses XML tags consistently, organises a genuinely complex workflow into distinct named phases, provides concrete output format templates, applies explicit rule priority ordering, and scopes tool permissions correctly in frontmatter. These are non-trivial achievements for a prompt of this scope.

However, it falls short of guide best practices on five structural issues that compound each other:

1. The persona is a task description, not a role with constrained voice and strengths.
2. No in-file calibrating examples exist for the most ambiguous decision (deviation rule selection), which is the agent's core reasoning task.
3. Negative-first instruction framing dominates operational sections, making the prompt harder to comply with than a positive-framed equivalent.
4. The task instruction is not isolated at the prompt's leading position — it is embedded inside a hybrid `<role>` block.
5. The quality bar is never stated explicitly, leaving the model without a target standard at context start.

None of these individually breaks the agent, but together they represent a prompt that relies on the model's inference to fill gaps that the guide explicitly says should be stated. The score reflects solid structural architecture offset by significant framing weaknesses.
