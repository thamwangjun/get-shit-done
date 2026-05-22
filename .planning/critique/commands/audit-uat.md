# Critique: `commands/gsd/audit-uat.md`

Reviewed against: Prompt Engineering Guide V09
Date: 2026-04-30

---

## Strengths

### Semantic XML tagging (§4 Formatting)
The command uses `<objective>`, `<execution_context>`, and `<context>` — all semantically named XML tags rather than markdown headers or `---` delimiters. This is directionally correct per §4's requirement that prompt sections use "semantically named XML tags" to give the model richer signal than delimiters alone.

### Scope is declared (§19 Modularity)
The `<context>` block explicitly declares the Glob patterns the model should target (`.planning/phases/*/*-UAT.md`, `.planning/phases/*/*-VERIFICATION.md`). This aligns with §19's principle that scope boundaries should state what to include explicitly, preventing the model from making arbitrary decisions about search surface.

### Tool permissions are enumerated (§22 Pattern 9)
The frontmatter lists `allowed-tools` as a specific, minimal set (`Read`, `Glob`, `Grep`, `Bash`). This follows §22 Pattern 9's rule that tool permissions should be scoped to the minimum required.

---

## Weaknesses

### Issue 1: Task specification is underdefined — no audience or quality bar (§1 Task Specification)

§1 Action 1 requires three components to be explicit: (a) what output is requested, (b) why it matters / how it will be used, and (c) what a correct or high-quality response looks like. §1 Action 2 requires audience to be encoded explicitly.

The `<objective>` covers (a) at a surface level ("Scan… Produce prioritized human test plan") but:
- **(b) is absent**: There is no statement of why this audit matters or how the test plan will be used (e.g., "so a QA engineer can triage before release").
- **(c) is absent**: There is no quality bar. What makes a good test plan? Should items be ranked by risk? By phase? By blocking status? The model has no calibrating signal.
- **Audience is absent**: "Human test plan" implies a human reader, but the model does not know that reader's domain knowledge, role (developer vs. QA vs. PM), or what level of detail is appropriate.

Without (b), (c), and audience, the model defaults to its own priors about what a "prioritized human test plan" looks like — which will vary across calls.

### Issue 2: Output format is completely unspecified (§7 Output Format Handling, §22 Pattern 3)

§7 and §22 Pattern 3 both require that the output structure, field names, ordering, and an example be stated before the model begins. The command produces no `<output_format>` block whatsoever.

The `<objective>` mentions "prioritized human test plan" but does not specify:
- What sections the plan should contain
- How items should be ordered (by phase? by severity? by blocked status?)
- What fields each item requires (phase, file, status, description, suggested test steps?)
- Whether stale documentation findings are reported separately or inline
- What the staleness detection output looks like

Per §22 Pattern 3: "A fully specified format produces consistent, parseable output. An implicit format produces structure that varies per call." The current command will produce a different document structure on every execution.

### Issue 3: Negative instructions and vague scope words are used where positive specifications are required (§5 Instruction Framing)

The `<objective>` uses the phrase "detect stale documentation" — this is a qualitative specification with no definition of what "stale" means operationally. §5 Action 1 requires converting vague or negative intent into positive specifications of the desired behavior.

Additionally, the status categories (`pending`, `skipped`, `blocked`, `human_needed`) are listed in the objective but never defined. The model must infer what these statuses mean and how to identify them in the UAT files. There are no precedent-style rulings (§14) for edge cases — e.g., what if a UAT item has no explicit status field? What counts as "blocked" vs. "pending"?

The `<context>` block also states "Core planning files are loaded in-workflow via CLI" — this is an opaque instruction that assumes the model understands what "in-workflow via CLI" means in this system. It is not self-contained per §17's requirement that agent prompts be fully self-contained.

---

## Specific Rewrites

### Rewrite 1: Add `<output_format>` block (fixes Issue 2)

Replace the current absent output specification with an explicit format block placed after `<objective>`:

```xml
<output_format>
Produce a markdown document with two sections:

## UAT Audit Summary
A table with one row per outstanding item:
| Phase | File | Status | Item | Stale? | Priority |
|-------|------|--------|------|--------|----------|

- Status values: pending / skipped / blocked / human_needed
- Stale: YES if the referenced code path no longer exists, NO otherwise
- Priority: HIGH (blocks release) / MEDIUM (degrades UX) / LOW (cosmetic)

## Human Test Plan
Numbered list ordered by Priority (HIGH first). For each item:
1. **[Phase X] Item title** — Status: blocked
   - What to test: [one sentence]
   - Expected result: [one sentence]
   - Reason for priority: [one sentence]

Omit items with status `skipped` that have an explicit skip rationale. Include all others.
</output_format>
```

This directly fixes the absent format specification per §22 Pattern 3 and §7.

### Rewrite 2: Add `<audience>` and `<quality_bar>` (fixes Issue 1)

Add these two blocks after `<objective>`:

```xml
<audience>
A QA engineer or developer performing pre-release verification. Assume familiarity with
the codebase but no memory of which UAT items exist or what phase they belong to.
The reader will use this plan to manually test items in a staging environment.
</audience>

<quality_bar>
A correct output covers every UAT and VERIFICATION file matched by the declared globs.
No item with status pending, blocked, or human_needed is silently omitted.
Staleness detection runs a file-existence check for each code path referenced in a UAT item;
an item is stale only if the referenced file or function cannot be located in the codebase.
The test plan is usable without reading any underlying phase files.
</quality_bar>
```

This satisfies §1 Actions 1, 2, and 3 and gives the model an explicit bar to hit.

### Rewrite 3: Define status terms and staleness operationally (fixes Issue 3)

Replace the current vague `<objective>` with a positive, operationally grounded version:

```xml
<objective>
Scan all UAT and VERIFICATION files in the declared scope. For each item found:

1. Extract its status. Recognized statuses: pending (not yet tested), skipped (bypassed
   without rationale), blocked (dependency not met), human_needed (requires manual tester).
   If no status field is present, classify as pending.

2. Determine staleness: search the codebase for any file path or function name referenced
   in the item. Mark the item stale if the reference cannot be found. Mark it current otherwise.

3. Rank each non-skipped item by release impact:
   HIGH — item is blocked or its feature is customer-facing with no workaround
   MEDIUM — item degrades UX but does not block core flows
   LOW — cosmetic or edge-case only

Produce the output defined in <output_format>.
</objective>
```

---

## Overall Verdict

**Needs Work**

The command skeleton is present — it has frontmatter, minimal tool scoping, and XML structure — but it is missing the three components that would make it reliably executable: an output format specification, an audience and quality bar, and operational definitions for the key terms it uses. In its current state, two runs of this command on the same codebase will produce documents with different structure, different item coverage, and different interpretations of "stale" and "priority." The rewrites above are targeted and mechanical — none require rethinking the command's purpose.
