# Critique: `commands/gsd/milestone-summary.md`

Evaluated against: Prompt Engineering Guide V09

---

## Strengths

### 1. Clear audience and purpose declared upfront (§1 Task Specification)

The `<objective>` block explicitly states who the output is for ("new team members"), what the output is ("human-friendly overview"), and how it will be used ("reading one document and asking follow-up questions"). This directly satisfies §1 Action 1 (what/why/quality bar) and Action 2 (audience). Most command files omit one or more of these three components; this one includes all three.

### 2. Structured section tags used throughout (§4 Formatting and Structure)

The file uses semantically named XML tags (`<objective>`, `<execution_context>`, `<context>`, `<process>`, `<success_criteria>`) rather than markdown headers or `---` delimiters. §4 Action 2 calls this "strictly better than markdown headers" for Claude-class models. The tag names carry semantic meaning (e.g. `<success_criteria>` signals verifiable completion criteria, not just aspirational goals).

### 3. Success criteria are concrete and enumerable (§1 Action 1, §22 Pattern 3)

`<success_criteria>` is a checklist of seven discrete verifiable states (version resolved, artifacts read, document written, 7 sections generated, presented inline, Q&A offered, STATE.md updated). This matches §22 Pattern 3's directive to specify the output structure completely and upfront. Each criterion is independently falsifiable, making it possible to determine whether the command succeeded without subjective judgement.

### 4. `$ARGUMENTS` template variable used correctly (§13 Template Variable Injection)

The prompt uses `$ARGUMENTS` for optional version input with a documented fallback behavior ("defaults to current/latest milestone"). This follows the `${VAR||"default"}` fallback pattern from §13 and makes the command composable without breaking on missing input.

---

## Weaknesses

### 1. Deferred execution model: the prompt is a stub, not a prompt (§4 Action 1, §17 Self-Contained Agent Prompts)

The entire `<process>` block reads:

```
Read and execute the milestone-summary workflow from @~/.claude/get-shit-done/workflows/milestone-summary.md end-to-end.
```

This means the command file itself contains zero task instructions. It is a pointer to another file. §17 ("Self-contained agent prompts") is explicit: "Each agent prompt must be fully self-contained when spawned." The referenced workflow file exists at runtime, but:

- If the workflow file is missing, the prompt silently has no instructions.
- The model must make a tool call (read the workflow file) before it can begin the actual task — adding latency and a failure surface.
- The separation of stub from workflow makes it impossible to evaluate this prompt's quality without reading two files.

§4 Action 1 requires drafting the instruction before choosing a format. The current design inverts this: the format (XML stub) exists, but the instruction lives elsewhere.

**This is the single largest structural deficiency.**

### 2. Output format is named but not specified (§7 Output Format Handling, §22 Pattern 3)

`<success_criteria>` says the output will have "7 sections (Overview, Architecture, Phases, Decisions, Requirements, Tech Debt, Getting Started)" but provides no specification of:

- What each section should contain
- Approximate length or depth expected per section
- The ordering of sections within the output document
- Whether the inline presentation matches the written document or is a condensed version

§7 Action 1 instructs: elicit free-form reasoning first, then format the conclusion. §22 Pattern 3 states: "State the required output structure, field names, ordering, and an example before the model begins its task." Neither is satisfied. The section list is a label, not a specification. The model must infer what "Architecture" means in this context, and that inference will vary across runs.

### 3. No conditional branching for missing artifacts (§5 Instruction Framing — Conditional Instructions)

The `<context>` block lists 6 artifact types the command reads, several of which are explicitly marked "(if archived)". There is no instruction for what to do when an artifact is absent:

- What happens if `RETROSPECTIVE.md` does not exist?
- What happens if no phase `SUMMARY.md` files are present?
- Should the model skip the section, note the gap, or halt?

§5 ("Conditional instructions") is explicit: "When behavior depends on context, use explicit conditional branching." The current prompt leaves this ambiguous. The failure mode is silent: the model will silently skip or hallucinate content for missing artifacts depending on its priors, with no predictable behavior.

---

## Specific Rewrites

### Rewrite 1: Replace the deferred `<process>` stub with inline instructions

**Current:**
```xml
<process>
Read and execute the milestone-summary workflow from @~/.claude/get-shit-done/workflows/milestone-summary.md end-to-end.
</process>
```

**Suggested replacement** (inline the core procedure so the prompt is self-contained even if the workflow file is unavailable):
```xml
<process>
Read the workflow definition from @~/.claude/get-shit-done/workflows/milestone-summary.md and execute it end-to-end.

If the workflow file cannot be read, fall back to these steps:
1. Resolve milestone version from $ARGUMENTS, then STATE.md, then the most recent archive in .planning/milestones/.
2. Read all available artifacts listed in <context> — skip missing files without error.
3. Write MILESTONE_SUMMARY-v{version}.md to .planning/reports/ using the 7-section structure in <success_criteria>.
4. Present the summary inline.
5. Offer interactive Q&A.
6. Update STATE.md to record the report was generated.
</process>
```

This gives the model a complete fallback path rather than a dead end if the external file is unreachable.

---

### Rewrite 2: Specify the 7-section output format with descriptions and ordering

**Current (`<success_criteria>` excerpt):**
```
All 7 sections generated (Overview, Architecture, Phases, Decisions, Requirements, Tech Debt, Getting Started)
```

**Suggested addition** — add an `<output_format>` block after `<context>`:
```xml
<output_format>
Write MILESTONE_SUMMARY-v{version}.md with these sections in order:

1. **Overview** — 2–3 sentences: what was built, the milestone version, and when it was completed.
2. **Architecture** — How the system is structured. Key components, their responsibilities, and how they connect. Drawn from CONTEXT.md and phase RESEARCH.md files.
3. **Phases** — One paragraph per phase: what was planned, what was built, and outcome from SUMMARY.md and VERIFICATION.md.
4. **Key Decisions** — Bulleted list of significant technical or product decisions with rationale. Source from RETROSPECTIVE.md and phase CONTEXT.md files.
5. **Requirements** — What the milestone was required to deliver, drawn from REQUIREMENTS.md. Mark each requirement as met, partial, or deferred.
6. **Technical Debt** — Deferred work, known limitations, and follow-on items. Source from RETROSPECTIVE.md and phase SUMMARY.md notes.
7. **Getting Started** — Concrete steps for a new engineer: how to run, test, and orient in the codebase. 5–10 bullet points.

The inline presentation shown to the user is the full document — do not condense it.
</output_format>
```

This satisfies §22 Pattern 3 and eliminates the inference gap on section content.

---

### Rewrite 3: Add conditional branches for missing artifacts

**Current (`<context>` block):**
```xml
- `.planning/milestones/v{version}-ROADMAP.md` (if archived)
- `.planning/milestones/v{version}-REQUIREMENTS.md` (if archived)
- `.planning/phases/*-*/` (SUMMARY.md, VERIFICATION.md, CONTEXT.md, RESEARCH.md)
```

**Suggested addition** — append a `<constraints>` block with explicit missing-artifact handling:
```xml
<constraints>
When reading artifacts:
- If an artifact file does not exist, skip it silently and note its absence in the relevant summary section (e.g., "No RETROSPECTIVE.md found — tech debt section sourced from phase summaries only").
- If no phase directories exist under .planning/phases/, note this in the Phases section and generate Overview, Architecture, and Requirements sections from milestone-level files only.
- If STATE.md cannot be updated (e.g., file is missing), skip the update and note it at the end of the inline output.
- Never invent content for a section when its source artifact is missing. Use only what is present.
</constraints>
```

This addresses §5's conditional branching requirement and eliminates silent hallucination on absent files.

---

## Overall Verdict

**Adequate**

The command demonstrates good structural instincts: it names its audience, lists verifiable success criteria, uses semantic XML tags, and handles optional arguments correctly. These are non-trivial properties that many command files in this codebase lack.

However, the prompt is not self-sufficient. Its core instruction is a single-line file pointer, the output format is named but not defined, and there is no conditional handling for the absent-artifact case that is explicitly expected (files marked "if archived"). These are not cosmetic issues — they are conditions under which the model will behave unpredictably or silently degrade.

The command is adequate as an invocation shim for the workflow file, but inadequate as a standalone prompt. Applying the three rewrites above would lift it to **Strong** by making it evaluable, resilient, and format-complete in its own right.
