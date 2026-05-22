# Critique: gsd-codebase-mapper.md

**Agent:** `gsd-codebase-mapper.md`

---

## Guide Sections Evaluated

| Section | Applies? | Relevance |
|---------|----------|-----------|
| §1 Task Specification | Yes | Core task, audience, and quality bar |
| §4 Formatting and Structure | Yes | XML tag usage and prompt organization |
| §5 Instruction Framing | Yes | Negative vs. positive framing, priority ordering |
| §6 Persona Assignment | Yes | Role definition |
| §7 Output Format Handling | Yes | Return confirmation spec |
| §8 Context Placement | Yes | Instruction/context/input ordering |
| §10 Prompt Length and Compression | Yes | Document length and redundancy |
| §11 System vs. User Prompt Allocation | Yes | Frontmatter, persistent vs. task-specific config |
| §13 Structural Architecture Patterns | Partial | Modularity of the agent file itself |
| §14 Constraint Enforcement | Yes | `<forbidden_files>`, `<critical_rules>` |
| §17 Agent and Subagent Patterns | Yes | Subagent configuration, self-containedness |
| §19 Modularity and Composition | Yes | Scope boundaries, single responsibility |
| §20 Safety and Trust Patterns | Yes | Secrets handling |
| §21 Tone and Style Rules | Yes | Instruction voice, numeric vs. qualitative limits |
| §22 Production Patterns | Yes | Patterns 1, 2, 3, 9 |

---

## Strengths

### §17 / §11 — Well-structured frontmatter with tool permissions
The YAML frontmatter encodes `name`, `description`, `tools`, and `color` in a single machine-readable block. The `tools` list (`Read, Bash, Grep, Glob, Write`) is a concrete, minimal grant — consistent with §22 Pattern 9 ("tool permissions scoped to minimum required patterns"). It does not hand out blanket `Bash(*)` access.

### §20 — Strong secrets safety block
`<forbidden_files>` is one of the most thorough constraint sections in the file. It enumerates specific file patterns, states the exact behavior required ("Note their EXISTENCE only"), explains the consequence ("Your output gets committed to git. Leaked secrets = security incident"), and mirrors the §14 / §20 permit-then-restrict structure. The enumeration is concrete, not qualitative.

### §14 — Concrete critical rules with rationale
`<critical_rules>` pairs each rule with a brief justification ("Do not return findings to orchestrator. The whole point is reducing context transfer."). This matches §22 Pattern 2 — abstract instructions paired with calibrating rationale. Bold imperative caps signal priority effectively.

### §4 — Consistent XML tag use for process structure
The `<process>`, `<step>`, `<why_this_matters>`, `<philosophy>`, `<templates>`, `<forbidden_files>`, `<critical_rules>`, and `<success_criteria>` tags all carry semantic names. This is consistent with §4's directive to use semantically named XML tags.

### §19 — Explicit scope boundary via downstream context
`<why_this_matters>` documents exactly which other GSD commands consume each document and why, giving the mapper agent a clear scope contract. This is a sound application of §19 scope-boundary thinking.

### §17 — Self-contained subagent design
The agent is designed to receive a focus area in its prompt, explore autonomously, and return only a short confirmation — consistent with §17's requirement that each agent receives its full operating instructions directly, with no context inheritance from a parent.

---

## Weaknesses

### W1 — §6: Persona is generic and role-domain mismatched
**Severity: High**

The `<role>` block opens with:

> "You are a GSD codebase mapper."

The guide (§6 Action 2, Role-domain mapping table) is explicit: generic expert framing produces no measurable behavioral gain. "GSD codebase mapper" is a project-internal label, not a domain-specific identity. It does not constrain register, voice, or behavioral style.

The guide's example for an exploration task is: *"File search specialist. You excel at thoroughly navigating and exploring codebases."* The agent omits the strengths-listing pattern (§6 "Strengths listing") entirely — there is no enumeration of what this agent is good at that would bias it toward thorough, path-referenced, prescriptive output.

**What this costs:** Without a specific persona and strengths list, the agent defaults to generic assistant behavior rather than being pre-tuned toward the prescriptive, file-path-anchored documentation style that `<philosophy>` tries to enforce downstream.

---

### W2 — §5: Instruction framing contains multiple negative directives
**Severity: Medium**

`<critical_rules>` and `<philosophy>` contain several negative-primary instructions that the guide (§5 Action 1) requires be converted to positive equivalents:

- `<critical_rules>`: "Do not return findings to orchestrator."
- `<critical_rules>`: "DO NOT COMMIT."
- `<philosophy>`: "Describe only what IS, never what WAS or what you considered."
- `<philosophy>`: "No temporal language."

The guide's conversion table is clear: every "do not" should be rewritten as a positive specification of desired behavior. For example:
- "Do not return findings to orchestrator" → "Write all findings directly to `.planning/codebase/`. Your response contains only the confirmation block."
- "DO NOT COMMIT" → "Leave all git operations to the orchestrator."

---

### W3 — §1: Audience not explicitly encoded; quality bar is implicit
**Severity: Medium**

§1 Action 2 requires the audience to be explicitly encoded in the prompt with their domain knowledge and vocabulary level. The agent knows its consumers are other Claude instances running `/gsd-plan-phase` and `/gsd-execute-phase`, but this is described as context ("These documents are consumed by other GSD commands") rather than as an audience specification that shapes the agent's writing register. There is no `<audience>` tag.

§1 Action 1 requires the quality bar to be explicit. The `<philosophy>` section implicitly defines quality ("A 200-line TESTING.md with real patterns is more valuable than a 74-line summary") but never uses a `<quality_bar>` tag or states the success criteria in terms the model can self-check against. The `<success_criteria>` checklist at the end is process-oriented, not quality-oriented — it confirms that steps were executed, not that output meets the bar.

---

### W4 — §8: Context placement order is violated
**Severity: Medium**

§8 prescribes: task instruction leads (high attention), background/supplementary context is in the middle (lower attention), primary input closes the prompt (high attention).

The actual prompt ordering is:

1. `<role>` — task instruction (correct)
2. `**Context budget:**` — operational constraint (mid-prose, not tagged)
3. `**Project skills:**` — operational procedure (mid-prose, not tagged)
4. `<why_this_matters>` — rationale/context (should be middle)
5. `<philosophy>` — quality guidance (should be middle)
6. `<process>` — step-by-step procedure (should be closer to top, after role)
7. `<templates>` — primary reference material (should close the prompt per §8 Action 2)
8. `<forbidden_files>` — constraints
9. `<critical_rules>` — constraints
10. `<success_criteria>` — checklist

The `<templates>` block — the primary content the agent acts on — is buried in the middle. Per §8 Action 2, it should be last. The untagged prose blocks (`**Context budget:**`, `**Project skills:**`) between `<role>` and `<why_this_matters>` are mid-document noise that would benefit from XML wrapping and repositioning.

---

### W5 — §4 / §11: Two large untagged prose blocks break the XML discipline
**Severity: Low-Medium**

The "Context budget" paragraph and "Project skills" numbered list (lines 29–38) appear directly after the frontmatter without any XML wrapping. Every other section of the prompt uses tags. These two blocks are also persistent operational instructions (not task-specific), making them candidates for the system-prompt layer per §11 Action 1. Their current placement between `<role>` and `<why_this_matters>` interrupts the structural logic.

---

### W6 — §17: `whenToUse` is absent from frontmatter
**Severity: Medium**

§17 states: "`whenToUse` is the trigger description shown to the orchestrating model. Make it action-specific, not capability-generic." The guide's frontmatter example includes `whenToUse` as a first-class field. This agent's frontmatter contains only `name`, `description`, `tools`, and `color`. The `description` field reads:

> "Explores codebase and writes structured analysis documents. Spawned by map-codebase with a focus area (tech, arch, quality, concerns). Writes documents directly to reduce orchestrator context load."

This doubles as an implicit `whenToUse` but is not structured as a `whenToUse` field, `agentType`, `model`, or `disallowedTools` — all of which the guide treats as mandatory agent metadata.

---

### W7 — §21: Numeric output size constraint absent for the confirmation block
**Severity: Low**

§21 ("Size constraints as hard rules") requires numeric limits rather than qualitative descriptors. The confirmation block specifies:

> "RETURN ONLY CONFIRMATION. Your response should be ~10 lines max."

"~10 lines max" is better than nothing, but `~` introduces ambiguity. The guide's production examples use hard counts: "under 8 words", "2-12 words". A precise bound ("Your response must be 8–12 lines") removes the hedge.

---

## Concrete Improvements

### Improvement 1 — Replace `<role>` with a specific `<persona>` block including strengths

Replace the current opening with:

```xml
<persona>
You are a codebase intelligence specialist. Your job is to navigate large codebases,
surface patterns, and produce prescriptive reference documents that future Claude instances
use to write code correctly without re-reading the codebase.

Your strengths:
- Rapidly identifying architecture layers, naming conventions, and data-flow patterns
- Extracting prescriptive rules from observed code (not just describing what exists)
- Anchoring every finding to an exact file path so downstream agents can navigate directly
- Distinguishing current state from historical artifacts or speculative notes
</persona>
```

This satisfies §6 Action 2 (specific persona), the strengths-listing pattern, and §22 Pattern 1.

---

### Improvement 2 — Convert negative rules to positive equivalents in `<critical_rules>`

Current:
```
**WRITE DOCUMENTS DIRECTLY.** Do not return findings to orchestrator.
**DO NOT COMMIT.** The orchestrator handles git operations.
```

Rewrite as:
```xml
<critical_rules>
**WRITE DOCUMENTS DIRECTLY.** All findings go into `.planning/codebase/` via the Write tool.
Your response contains only the confirmation block defined in `<step name="return_confirmation">`.

**LEAVE GIT TO THE ORCHESTRATOR.** Your scope ends after writing documents. The orchestrator
handles all git operations (stage, commit, push).
...
</critical_rules>
```

Apply the same conversion to the `<philosophy>` block:
- "Describe only what IS, never what WAS or what you considered. No temporal language."
  → "Write in present tense only. Each sentence describes a current fact about the codebase."

---

### Improvement 3 — Add `<audience>` and `<quality_bar>` tags

Add after `<persona>`:

```xml
<audience>
The consumers of your output are other Claude instances running `/gsd-plan-phase` and
`/gsd-execute-phase`. They have no prior knowledge of this codebase. They need documents
that are self-sufficient: complete enough to write correct, convention-matching code without
reading the source files themselves.
</audience>

<quality_bar>
A document meets the bar when:
- Every pattern claim is backed by at least one file path in backticks
- Every naming convention is stated as a rule ("Use camelCase for functions"), not an observation
- A Claude instance with no other context could use it to place a new file in the correct directory
- No section uses "None" or "Not applicable" without a brief explanation of why
</quality_bar>
```

---

### Improvement 4 — Reorder prompt sections to match §8 context placement

Recommended ordering:

1. `<persona>` — leads (task identity, high attention)
2. `<audience>` and `<quality_bar>` — immediately after persona
3. `<constraints>` (wrapping `<forbidden_files>` and tool rules) — persistent rules
4. `<context>` wrapping the "Context budget" and "Project skills" paragraphs
5. `<process>` — step-by-step procedure
6. `<why_this_matters>` — rationale (middle, lower attention)
7. `<philosophy>` — quality guidance (middle)
8. `<critical_rules>` — reinforcement constraints
9. `<success_criteria>` — self-check
10. `<templates>` — closes the prompt (primary reference material, high recency attention)

Moving `<templates>` to last position exploits the recency bias so the agent is closest to the fill-in structures at the moment of writing.

---

### Improvement 5 — Add full `agentMetadata` to frontmatter

Replace the current minimal frontmatter:

```markdown
<!--
name: gsd-codebase-mapper
description: Explores codebase and writes structured analysis documents...
tools: Read, Bash, Grep, Glob, Write
color: cyan
agentMetadata:
  agentType: 'CodebaseMapper'
  model: 'sonnet'
  permissionMode: 'dontAsk'
  disallowedTools:
    - Agent
    - Edit
    - NotebookEdit
  whenToUse: >
    Codebase analysis agent. Use when you need to map a specific focus area (tech, arch,
    quality, or concerns) and write analysis documents to .planning/codebase/. Spawned by
    /gsd-map-codebase. Requires a focus area in the prompt.
  criticalSystemReminder: 'CRITICAL: Write documents to .planning/codebase/ only. Return only the confirmation block — never document contents.'
-->
```

---

### Improvement 6 — Harden the confirmation output format constraint

Replace:

> "RETURN ONLY CONFIRMATION. Your response should be ~10 lines max."

With:

```xml
<output_format>
Return exactly the confirmation block below — no more, no fewer. Maximum 12 lines total.
Do not include document contents, summaries of findings, or exploratory notes.

Format:
## Mapping Complete

**Focus:** {focus}
**Documents written:**
- `.planning/codebase/{DOC1}.md` ({N} lines)
- `.planning/codebase/{DOC2}.md` ({N} lines)

Ready for orchestrator summary.
</output_format>
```

This satisfies §21 numeric size constraints and §22 Pattern 3 (output format specified completely and upfront).

---

## Overall Score

**6 / 10**

**Justification:** The agent demonstrates solid structural thinking — focused scope, self-contained design, comprehensive secrets safety, and concrete templates that give downstream agents actionable reference material. These are meaningful strengths. However, it diverges from the guide on four consequential dimensions: the persona is generic where domain-specific is required (§6); the audience and quality bar are implicit rather than explicit (§1); critical rules rely on negative framing throughout (§5); and context placement puts the primary reference material (templates) in the middle of the prompt rather than last (§8). The missing `whenToUse` and `agentMetadata` fields in the frontmatter are a structural gap given that this is explicitly a subagent file (§17). With the six improvements above applied, this would score 8–9.
