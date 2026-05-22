# Critique: `commands/gsd/thread.md`

Critiqued against: PROMPT_ENGINEERING_GUIDE_V09.md
Date: 2026-04-30

---

## Strengths

### 1. Explicit conditional branching (§5 Instruction Framing)

The argument-parsing block uses precise conditional branching for every mode:

```
- "list" or "" (empty) → LIST mode
- "list --open"        → LIST-OPEN mode
- "close <slug>"       → CLOSE mode
...
```

This matches the guide's pattern for conditional instructions exactly (§5, "Conditional instructions"). Each path is unambiguous. The model cannot plausibly conflate LIST with CREATE.

### 2. Hard STOP terminators per mode (§16 Multi-Phase Workflows)

Every mode ends with an explicit `STOP after...` directive. This correctly prevents the model from bleeding into subsequent steps after completing a discrete mode — equivalent in intent to the guide's phase boundary pattern (§16, "The phase pattern") where "the model completes one phase fully before beginning the next."

### 3. Security rules are explicit and enumerated (§14 Constraint Enforcement)

The `<security_notes>` block and the inline SECURITY callout in `<mode_list>` enumerate specific attack vectors with specific mitigations: slug character whitelist `[a-z0-9-]`, max 60 chars, rejection of `..` and `/`, sanitizing readdir output before display. These are hard exclusion-style rules (§14, "Hard exclusion lists") applied to a security context — concrete and auditable.

### 4. Slug sanitization specified positively (§5 Instruction Framing, Action 1)

The sanitization rule for close/status is stated as a positive allowlist: `only [a-z0-9-] allowed`. This follows the guide's conversion rule (§5, Action 1 — "Convert negative instructions to positive equivalents"). The spec says what IS permitted, not just what to reject.

### 5. Template file content is literal and complete (§7 Output Format Handling, §22 Pattern 3)

The CREATE mode includes the exact file template the model should write — including all section headers, frontmatter schema, and placeholder text. This satisfies §22 Pattern 3: "Output format specified completely and upfront." The model has no ambiguity about what to produce.

---

## Weaknesses

### 1. No XML tags for structural sections — uses a mix of ad-hoc tags and markdown (§4 Formatting and Structure)

**Guide rule:** §4, Action 2: "When a prompt contains multiple distinct sections, wrap each in a semantically named XML tag." The tag vocabulary table (§4) defines `<task>`, `<context>`, `<constraints>`, `<output_format>`, and `<examples>` as the canonical top-level tags.

**What the file does:** Uses `<objective>`, `<process>`, `<mode_list>`, `<mode_close>`, `<mode_status>`, `<mode_resume>`, `<mode_create>`, `<notes>`, `<security_notes>`. Some of these (`<objective>`, `<notes>`) are non-standard. Others (`<mode_list>`) conflate structure with content — the tag names the specific mode rather than the structural role of the section (instruction, context, output format, constraints).

**Impact:** The model receives weaker structural signal. `<notes>` is particularly problematic — the guide's vocabulary has no `<notes>` tag; its semantics are ambiguous (is this context? constraints? background?). The content inside is a mix of behavioral rules ("Threads are NOT phase-scoped"), scope notes ("Lighter weight than /gsd-pause-work"), and workflow guidance. Per §4 Action 2, each of these belongs in a different tag.

**Severity:** Moderate. The prompt is still parseable, but the guide is clear that XML tag names carry semantic meaning — non-standard names degrade this.

---

### 2. No `<output_format>` specification for any mode (§7 Output Format Handling, §22 Pattern 3)

**Guide rule:** §22 Pattern 3: "State the required output structure, field names, ordering, and an example before the model begins its task." §7, Action 2: place reasoning before answer fields. §21: "Size constraints use numeric limits, not qualitative descriptors."

**What the file does:** The display format for LIST mode is shown as a code block inline within `<mode_list>`. But it is not wrapped in an `<output_format>` tag, it is not called out as the definitive output spec, and it mixes the instruction with the example. The STATUS mode display template has the same issue — it is a format specification buried inside the operational instruction. The RESUME mode has no display format specification at all: it says "display it as plain text" and "ask what the user wants to work on next" with no format, length, or structure constraints.

**Impact:** The model has no canonical, up-front output format target to anchor against. The guide explicitly warns that an implicit format "produces structure that varies per call" (§22 Pattern 3). RESUME mode's open-ended "display as plain text" violates §21: no numeric length bound, no defined fields to surface, no explicit order of information.

**Severity:** Significant. Inconsistent LIST output (column widths, sort order, truncation) and variable RESUME output are predictable failure modes.

---

### 3. `<notes>` block mixes constraints, context, and scope — and uses negatives (§4, §5, §14)

**Guide rule:** §5 Action 1: negative instructions must be converted to positive equivalents. §4: each section type belongs in its own semantically named tag. §14: constraints should be paired (restriction + permitted equivalent).

**What the `<notes>` block does:**

```
- Threads are NOT phase-scoped — they exist independently of the roadmap
- Lighter weight than /gsd-pause-work — no phase state, no plan context
```

Both are negatively framed ("NOT", "no"). Per §5 Action 1, these should be converted:

- "NOT phase-scoped" → "Threads exist independently of the roadmap and persist across milestone boundaries."
- "no phase state, no plan context" → "Threads store goal, context, and next steps only — no plan file, no phase references."

Additionally, the notes block contains: a comparison to another command (`/gsd-pause-work`), a promotion workflow instruction (`/gsd-add-phase or /gsd-add-backlog`), and a structural observation ("Thread files live in .planning/threads/"). These are at least three distinct concerns — context, constraints, and workflow guidance — collapsed into a single `<notes>` tag with no structural differentiation.

**Severity:** Moderate. Negative framing is a mechanical fix. The structural mixing is a maintainability and signal-clarity problem.

---

## Specific Rewrites

### Rewrite 1: Give RESUME mode an explicit output format (addresses Weakness 2)

**Current:**
```
Resume the thread — load its context into the current session. Read the file content
and display it as plain text. Ask what the user wants to work on next.
```

**Rewritten:**
```xml
<output_format>
Display the thread summary in this format:

  Resuming Thread: {SLUG}
  ─────────────────────────────────────
  Title:   {title}
  Status:  in_progress
  Updated: {today ISO date}

  Goal:
  {content of ## Goal section, verbatim, max 200 words}

  Context (last updated {updated date}):
  {content of ## Context section, verbatim, max 300 words}

  Next Steps:
  {content of ## Next Steps section, verbatim}
  ─────────────────────────────────────

Then ask: "What would you like to work on in this thread?"
</output_format>
```

This gives the model a named template, numeric length caps, and a concrete closing prompt — satisfying §22 Pattern 3 and §21's numeric-limits rule.

---

### Rewrite 2: Replace `<notes>` with structured `<context>` and `<constraints>` tags (addresses Weaknesses 1 and 3)

**Current:**
```xml
<notes>
- Threads are NOT phase-scoped — they exist independently of the roadmap
- Lighter weight than /gsd-pause-work — no phase state, no plan context
- The value is in Context and Next Steps — a cold-start session can pick up immediately
- Threads can be promoted to phases or backlog items when they mature:
  /gsd-add-phase or /gsd-add-backlog with context from the thread
- Thread files live in .planning/threads/ — no collision with phases or other GSD structures
- Thread status values: `open`, `in_progress`, `resolved`
</notes>
```

**Rewritten (split by semantic role):**

```xml
<context>
Threads are independent of the roadmap and persist across milestone boundaries.
They store goal, context, and next steps only — no plan file, no phase references.
Thread files live in .planning/threads/ — separate from phases, plans, and other GSD structures.
Thread status values: open, in_progress, resolved.
</context>

<constraints>
Threads are lighter-weight than /gsd-pause-work. When a thread matures into structured work,
promote it using /gsd-add-phase or /gsd-add-backlog, including context from the thread file.
The value delivered by every thread is in the Context and Next Steps sections — ensure
these are populated before ending a CREATE or RESUME session.
</constraints>
```

Changes applied:
- Negative framing ("NOT phase-scoped", "no phase state") converted to positive (§5 Action 1).
- Structural role of each note made explicit via guide-standard tag names `<context>` and `<constraints>` (§4, tag vocabulary table).
- The promotion workflow note is reframed as a behavioral constraint ("when a thread matures... promote it") rather than a bare fact.

---

### Rewrite 3: Promote the LIST display into a canonical `<output_format>` block (addresses Weakness 2)

**Current:** The display template is embedded inline inside `<mode_list>` prose, preceded by a code block with no framing as a normative format spec.

**Rewritten — add immediately before `</mode_list>`:**

```xml
<output_format id="list">
Display threads in this exact format. Column widths are fixed. Truncate title at 40 chars
with "…" if longer. Sort rows by updated date descending (most recent first).

  Context Threads
  ─────────────────────────────────────────────────────────
  slug                      status        updated      title
  {slug, left-aligned 26}   {status, 12}  {YYYY-MM-DD} {title, max 40 chars}
  ─────────────────────────────────────────────────────────
  {N} threads ({O} open/in_progress, {R} resolved)

If no threads match the filter, output exactly:
  No threads found. Create one with: /gsd-thread <description>
</output_format>
```

This makes the format normative, specifies column alignment, truncation behavior, sort order, and the exact empty-state string — eliminating per-call variation (§22 Pattern 3).

---

## Overall Verdict

**Adequate**

`thread.md` is operationally sound. The mode-dispatch logic is clear, the STOP terminators prevent bleed-through, and the security controls are specific. It will work reliably for its primary happy paths.

Where it falls short of the guide's standard is in output format discipline: RESUME mode has no format spec, the LIST format is embedded rather than canonical, and the `<notes>` block mixes three distinct concern types into one unstructured tag. These are fixable with targeted rewrites (see above) that do not require restructuring the command's logic.

The structural issue (non-standard XML tag vocabulary) is present throughout but unlikely to cause runtime failures on current Claude-class models — it is a maintainability and signal-quality problem more than a correctness problem.
