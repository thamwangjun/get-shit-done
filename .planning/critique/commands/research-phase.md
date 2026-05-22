# Critique: `commands/gsd/research-phase.md`

Reviewed against: Prompt Engineering Guide V09
Date: 2026-04-30

---

## Overall Verdict

**Adequate** — The command handles orchestration mechanics and downstream consumer framing well, but carries three structural deficiencies that degrade the agent's reliability: negative instruction framing in a high-signal section, absent output format specification for the researcher, and a persona that names a role without constraining behavior.

---

## Strengths

### Downstream consumer section is a standout application of §22 Pattern 2 and §1 Action 1

The `<downstream_consumer>` block in the researcher prompt is the strongest section of the file. It makes explicit (a) what output is being requested, (b) why it matters, and (c) what quality looks like — all three task components from §1 Action 1. It also names the exact sections the consumer expects (`## Standard Stack`, `## Architecture Patterns`, etc.) and pairs each with a concrete behavioral consequence ("Tasks NEVER build custom solutions for listed problems"). This is a textbook application of §22 Pattern 2: every abstract instruction is grounded by a calibrating rule about its effect.

### The `<quality_gate>` checklist operationalizes §23 criteria

The quality gate pre-empts the most common failure mode in research tasks — surface coverage that misses depth. By framing it as a pre-completion checklist with discrete items ("Negative claims verified with official docs", "Multiple sources for critical claims"), the command follows §23's `<checklist>` pattern and §14's constraint enforcement approach. The confidence-level requirement maps directly to §14's confidence thresholds recommendation, even without numeric bounds.

### Checkpoint handling in Step 5 demonstrates §16 scenario-based branching

The three-branch handling of `## RESEARCH COMPLETE`, `## CHECKPOINT REACHED`, and `## RESEARCH INCONCLUSIVE` is correct application of §16's scenario branching pattern. Each branch has a single, named condition and a concrete response action. The model is not left to infer which path applies.

### Orchestrator role separation reflects §17 self-contained agent patterns

The explicit separation between orchestrator responsibilities (validate, gather context, spawn, handle return) and researcher responsibilities (investigate, write output) is consistent with §17's self-contained agent prompt pattern. The orchestrator deliberately avoids inlining file contents ("do not inline file contents in orchestrator context"), which controls context bloat per §10 Action 1.

---

## Weaknesses

### W1: `<key_insight>` uses negative framing as its primary directive — violates §5 Action 1

The most important framing instruction in the researcher prompt is stated negatively:

> "The question is NOT 'which library should I use?'"

§5 Action 1 requires converting negative instructions to positive equivalents. This is not a reframe pattern (§6) use case — the reframe pattern is valid only when displacing a specific, named prior the model would otherwise act on and is followed immediately by the positive replacement. Here, the negative is used as an emphasis device before a list of positive questions, which means the prohibition is the first signal the model receives. The conversion table in §5 Action 1 applies directly:

```
"The question is NOT..." → "The question is: [positive specification only]"
```

The positive questions that follow are the actual instruction. The negative clause is structural noise that the model will partially attend to, degrading the framing.

### W2: No `<output_format>` specification for RESEARCH.md — violates §22 Pattern 3 and §7

The researcher is told to write to a specific file path and to populate named sections (via `<downstream_consumer>`), but there is no `<output_format>` block specifying the structure of RESEARCH.md itself: no field names, no ordering, no length norms per section, no example. §22 Pattern 3 states that output format must be "specified completely and upfront" and that "an implicit format produces structure that varies per call." The `<downstream_consumer>` block names the sections the consumer expects, but names them in reverse (consumer reads them, researcher must infer they are also the required output sections). This indirection is not equivalent to a forward `<output_format>` specification and will produce inconsistent section ordering and variable section depth across research runs.

### W3: Persona is absent — violates §6 Actions 1–2 and §22 Pattern 1

The researcher prompt contains no `<persona>` block. The task is open-ended and stylistic (research synthesis), which is precisely the condition under which §6 Action 1 requires a persona. §22 Pattern 1 states that role identity scoped to the exact domain produces "more consistent, domain-appropriate outputs than a broad one." Without a persona, the researcher defaults to generic assistant behavior. A research synthesis agent should have a persona that constrains its register — specifically, whether it is optimizing for coverage vs. depth, and what its epistemic posture is toward unverified claims (which the quality gate addresses post-hoc, but a persona could establish upfront).

---

## Specific Rewrites

### Rewrite 1: Fix `<key_insight>` — eliminate negative framing (addresses W1)

**Current:**
```markdown
<key_insight>
The question is NOT "which library should I use?"

The question is: "What do I not know that I don't know?"

For this phase, discover:
- What's the established architecture pattern?
...
</key_insight>
```

**Rewrite:**
```markdown
<key_insight>
The central question is: "What do I not know that I don't know?"

For this phase, discover:
- What's the established architecture pattern?
- What libraries form the standard stack?
- What problems do people commonly hit?
- What's SOTA vs what Claude's training thinks is SOTA?
- What should NOT be hand-rolled?
</key_insight>
```

The prohibition on library selection questions is already implicit in the discovery list. Making it explicit via negation adds noise without adding constraint.

---

### Rewrite 2: Add explicit `<output_format>` for RESEARCH.md (addresses W2)

Insert after `<downstream_consumer>`, before `<quality_gate>`:

```markdown
<output_format>
Write RESEARCH.md with these sections in this order. Include all sections even if a section
has limited findings — note "Not applicable" with a one-line reason rather than omitting.

## Standard Stack
List the canonical libraries and tools for this domain. Format: `library-name` — one-line rationale. Minimum 3 entries.

## Architecture Patterns
Name and describe the dominant structural pattern (e.g., "Repository pattern", "Event-driven pipeline"). Include a code-level sketch if the pattern has non-obvious wiring. 2–4 paragraphs.

## Don't Hand-Roll
Enumerate capabilities that exist as mature libraries and must never be reimplemented. Format: bulleted list, one item per capability.

## Common Pitfalls
Name each pitfall, describe the failure mode, and state the mitigation. Format: `### Pitfall: [name]` + 2–3 sentences.

## Code Examples
Provide working snippets for the 1–3 most critical integration points. Each snippet must be self-contained and runnable. Label each with a one-line description.

## Confidence Assessment
For each section, assign: HIGH (verified against official docs or release notes), MEDIUM (multiple secondary sources), LOW (single source or training knowledge).
</output_format>
```

This eliminates the indirection of discovering required sections from `<downstream_consumer>` and produces a consistent file structure across all research runs.

---

### Rewrite 3: Add domain-specific persona (addresses W3)

Insert at the top of the researcher prompt, before `<research_type>`:

```markdown
<persona>
You are a technical research specialist. Your job is not to survey options — it is to
produce a prescriptive implementation brief that a planner can act on without further
investigation.

Your strengths:
- Identifying the canonical solution stack for a given problem domain
- Distinguishing current SOTA from outdated best practices in training data
- Finding the failure modes that official docs understate
- Making a definitive recommendation rather than presenting a menu of options

When evidence conflicts, state your confidence level and commit to a recommendation.
"Use X" is always preferred over "Consider X or Y."
</persona>
```

This constrains register (prescriptive, not exploratory), makes explicit what the agent should be good at (§6 strengths listing pattern), and uses the reframe pattern ("not to survey options — it is to produce...") validly, because it displaces the specific prior that research tasks elicit: comprehensive option enumeration rather than committed prescription.

---

## Checklist Against §23

| Check | Status | Note |
|---|---|---|
| Intent, audience, quality bar explicit | Partial | Quality bar present via `<quality_gate>`; audience explicit in `<downstream_consumer>`; intent partially obscured by negative framing in W1 |
| No conflicting constraints | Pass | No detected conflicts |
| Persona included for open-ended task | Fail | W3 — absent |
| Persona specific, not generic | N/A | Persona absent |
| Negative instructions converted | Fail | W1 — `<key_insight>` opens with negative |
| Output format specified completely | Fail | W2 — no `<output_format>` block |
| Output format includes example | Fail | No example RESEARCH.md section shown |
| Task instruction at start of prompt | Partial | `<objective>` leads but `<research_type>` precedes it |
| Scenario branching for multiple paths | Pass | Step 5 handles three terminal states |
| Agent prompts self-contained | Pass | Files listed in `<files_to_read>`; phase context passed explicitly |
| Single responsibility | Pass | Orchestrator and researcher concerns cleanly separated |
