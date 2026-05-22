# Critique: `commands/gsd/ship.md` + `workflows/ship.md`

**Reviewed against:** Prompt Engineering Guide V09
**Scope:** The entry-point command file (`commands/gsd/ship.md`) is a thin stub that delegates entirely to `workflows/ship.md`. This critique covers both, because the entry point's only job is to invoke the workflow — weaknesses there propagate directly.

---

## Strengths

### 1. Constraint block is well-formed (§14 Constraint Enforcement)

The `<constraints>` block in `workflows/ship.md` uses the exact `<permitted>` / `<reserved_for_human_review>` child-tag pattern the guide specifies. Every restriction has a corresponding permission, stated with equal specificity. The hard line "Overriding a failed verification without explicit user confirmation" is a concrete, auditable boundary — not a vague prohibition. This directly satisfies the guide's rule: "Pair every restriction with what IS permitted, stated equally concretely."

### 2. Priority ordering is explicit (§5 Instruction Framing)

The `<priority_order>` block names four concerns and ranks them unambiguously (preflight > accuracy > state integrity > completeness). The guide calls for explicit priority ordering "when multiple considerations apply" to remove signal conflict. This prompt applies it correctly — the ordering is domain-specific and actionable, not a generic "safety first" boilerplate.

### 3. `<quality_bar>` and `<success_criteria>` are present (§1 Task Specification)

The workflow surfaces both a `<quality_bar>` (qualitative "what good looks like") and a `<success_criteria>` checklist (machine-verifiable booleans). §1 Action 1 requires making explicit what a correct or high-quality response looks like. Having both forms — narrative and checkboxed — satisfies that requirement more thoroughly than most production prompts do.

### 4. Conditional branching is explicit (§5 Instruction Framing)

The `optional_review` step handles three distinct code paths (external review configured vs. not; manual review options; text-mode fallback for non-Claude runtimes) using explicit conditionals and named branch labels. This matches the guide's conditional instruction pattern: "use explicit conditional branching" rather than leaving the model to infer.

### 5. Reversibility framework is applied (§15 Decision Frameworks)

`<reserved_for_human_review>` gates the four highest-blast-radius actions (merging, pushing to main, modifying source files, overriding verification). The guide's reversibility framework maps exactly to this design: irreversible or externally-visible operations require confirmation.

---

## Weaknesses

### 1. Entry-point stub has no `<task>`, audience, or quality bar — violates §1 and §4 (HIGH)

`commands/gsd/ship.md` is the surface the model sees first. Its entire body is:

```
<objective>
Bridge local completion → merged PR. ...
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/ship.md
</execution_context>

Execute the ship workflow from @~/.claude/get-shit-done/workflows/ship.md end-to-end.
```

Per §1 Action 1, every prompt must make explicit: (a) what output is requested, (b) why it matters, and (c) what a correct response looks like. The stub provides only a vague (b). Per §4 Action 2, prompt sections must use semantically named XML tags — `<objective>` is not in the guide's tag vocabulary; the correct tag is `<task>`. Per §8 Action 1, the task instruction must lead the prompt, but the `<execution_context>` reference appears between the instruction and the delegation line, creating an ambiguous ordering.

The stub is too thin to be self-contained and too thin to be meaningful as a routing layer. It neither provides the model with operating context nor defers reliably.

### 2. The review prompt embedded in `optional_review` is an unstructured string blob — violates §4, §7, and §22 Pattern 3 (HIGH)

The review prompt constructed in `optional_review` is a bash heredoc with newline-escaped `\n` concatenation:

```bash
REVIEW_PROMPT="You are reviewing a pull request.\n\nDiff stats:\n${DIFF_STATS}\n\nPhase context:\n${STATE_STATUS}\n\nFull diff:\n${DIFF}\n\nRespond with JSON: { \"verdict\": ... }"
```

This violates multiple guide principles simultaneously:

- **§4 Action 2**: Prompt sections must be separated by semantically named XML tags, not newline strings. A `<task>`, `<context>`, `<input>`, and `<output_format>` structure would make the review prompt parseable and reliable.
- **§7 Machine-parsed output specification**: The guide requires exact format specification with literal string requirements for machine-parsed output. The JSON schema embedded in the heredoc is structurally correct but violates the instruction to specify output format "completely and upfront" in a dedicated `<output_format>` block (§22 Pattern 3). The schema is buried at the tail of a single string.
- **§8 Context Placement**: Task instruction must lead; primary input (the diff) must close the prompt. Here the diff is in the middle of the string, and the instruction to respond with JSON is last. This is the inverse of the correct order — the model commits to tokens in the order they appear, so the format spec should come before or immediately after the task, not after 500 lines of diff.
- **§10 Prompt Length**: The full diff is injected raw with no extraction or compression pass. §10 Action 4 requires trimming to directly relevant content.

### 3. No persona assigned despite the workflow requiring opinionated judgment — violates §6 (MEDIUM)

The workflow asks the model to synthesize a PR body from multiple artifacts, judge verification status, and decide whether to escalate to human review. These are open-ended, judgment-requiring tasks — exactly the task type for which §6 Action 1 says to assign a persona. No persona is present anywhere in `workflows/ship.md`.

The absence is particularly costly in the external review sub-step: the inline review prompt begins with "You are reviewing a pull request." — a generic, ad-hoc identity that §6 Action 2 flags as producing no measurable gain ("Generic expert framing produces no measurable accuracy gain"). A persona constraining register, judgment bias (conservative vs. permissive), and reporting style would produce more consistent code review output.

### 4. Negative instructions are present — violates §5 Action 1 (LOW)

The guide's §5 Action 1 requires converting all negative instructions to positive equivalents before emitting a prompt. Three instances survive in the workflow:

- `<reserved_for_human_review>` items are functionally negative constraints ("do not do X"). These are correctly placed in the constraint vocabulary, but the descriptions inside are still phrased as prohibitions rather than as conditions for proceeding ("Merging or closing the PR" should be "Human confirmation required before merging or closing the PR").
- Step `preflight_checks`: "On missing `origin`: halt" is a negative. The positive form: "A configured `origin` remote is required; verify before proceeding."
- Step `push_branch` report: "Pushed `{branch}` to origin" — this is fine; this note is for the positive case only.

This is a minor readability issue in the constraint sub-section, not a structural defect.

---

## Specific Rewrites

### Rewrite 1: Entry-point stub (addresses Weakness 1)

**Current:**
```markdown
<objective>
Bridge local completion → merged PR. After /gsd-verify-work passes, ship the work: push branch, create PR with auto-generated body, optionally trigger review, and track the merge.

Closes the plan → execute → verify → ship loop.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/ship.md
</execution_context>

Execute the ship workflow from @~/.claude/get-shit-done/workflows/ship.md end-to-end.
```

**Rewrite:**
```markdown
<task>
Execute the ship workflow end-to-end: push the current branch, create a PR body from planning artifacts, optionally trigger code review, and update STATE.md. Read and follow the workflow file below.
</task>

<audience>
Developer who has passed /gsd-verify-work and wants the work merged. Expects a PR URL, diff link, and clear next command on completion.
</audience>

<quality_bar>
All five preflight checks pass, PR body contains all six sections from actual file content (not from memory), and the user leaves with PR number, URL, and precise next step.
</quality_bar>

@~/.claude/get-shit-done/workflows/ship.md
```

Changes: replaces `<objective>` (non-standard tag) with `<task>` (§4 tag vocabulary); adds `<audience>` and `<quality_bar>` to satisfy §1 Action 1; moves the `@include` reference to the end so the task instruction leads (§8 Action 1).

---

### Rewrite 2: External review prompt (addresses Weakness 2)

**Current (condensed):**
```bash
REVIEW_PROMPT="You are reviewing a pull request.\n\nDiff stats:\n${DIFF_STATS}\n\nPhase context:\n${STATE_STATUS}\n\nFull diff:\n${DIFF}\n\nRespond with JSON: { \"verdict\": \"APPROVED\" or \"REVISE\", \"confidence\": 0-100, \"summary\": \"...\", \"issues\": [{...}] }"
```

**Rewrite:**
```bash
REVIEW_PROMPT="<task>
Review this pull request. Identify issues that would cause a REVISE verdict. Report only issues where you are more than 80% confident of actual impact.
</task>

<persona>
You are a senior engineer conducting a focused correctness and safety review. Your job is not to confirm the implementation works — it is to find what the author did not think to check: boundary conditions, error paths, and unhandled states.
</persona>

<context>
<phase_context>${STATE_STATUS}</phase_context>
<diff_stats>${DIFF_STATS}</diff_stats>
</context>

<input>
${DIFF}
</input>

<output_format>
Respond with JSON only. No markdown, no preamble, no trailing text.

{
  \"reasoning\": \"brief assessment of the change before verdict\",
  \"verdict\": \"APPROVED\" or \"REVISE\",
  \"confidence\": 0-100,
  \"summary\": \"one sentence\",
  \"issues\": [
    {
      \"severity\": \"HIGH\" or \"MEDIUM\" or \"LOW\",
      \"file\": \"path/to/file.ts\",
      \"line_range\": \"42-48\",
      \"description\": \"what is wrong\",
      \"suggestion\": \"what to do instead\"
    }
  ]
}
</output_format>"
```

Changes: task instruction leads (§8); `<persona>` uses the reframe pattern for adversarial bias (§6 / §22 Pattern 8); `<context>` and `<input>` sections are XML-tagged with input closing the prompt (§4, §8); `<output_format>` is a dedicated block with literal format requirements and a `reasoning` field placed before `verdict` to exploit causal token ordering (§7 Action 2); confidence threshold added (§14); diff is still injected raw but now occupies the `<input>` position where the model attends most (§8 Action 2).

---

### Rewrite 3: Persona for the orchestrating workflow (addresses Weakness 3)

Add directly after the `<task>` block in `workflows/ship.md`:

```xml
<persona>
You are a release coordinator. Your job is to close the plan-execute-verify-ship loop with zero skipped steps. You are conservative: a preflight failure is a hard stop, not a prompt to continue. You generate PR bodies from file content only — never from memory.
</persona>
```

This is domain-specific (§6 Action 2), uses the reframe pattern to pre-empt the common failure mode of skipping failed checks (§6 reframe pattern), and biases the model toward the precision side of the cost asymmetry (§5 tie-breaking). It does not introduce generic "expert" framing.

---

## Overall Verdict

**Adequate**

The workflow file (`workflows/ship.md`) is structurally competent: constraint blocks, priority ordering, explicit conditionals, and success criteria are all present and correctly formed. It would produce reliable behavior in most executions.

The two high-severity weaknesses — the entry-point stub lacking §1 task components and standard §4 tags, and the embedded review prompt being an unstructured string blob with inverted context placement — are real degradation risks. The review sub-prompt in particular is likely the single highest-variance step in the entire workflow, and it is the least-specified section. Fixing it would materially reduce output inconsistency on code review runs.

The command does not fail the guide's principles on the core shipping path; it fails them specifically on the meta-layer (how it is invoked) and the optional review sub-path (how it constructs an internal prompt). Those are fixable with targeted rewrites rather than a full redesign.
