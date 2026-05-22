# Critique: milestone-summary.md

## Summary

The `milestone-summary.md` workflow is well-structured and functionally complete for its stated purpose of generating a human-friendly onboarding document from milestone artifacts. It handles fallback logic thoroughly (artifact discovery, git statistics, missing files), defines a sensible output template, and closes with an interactive Q&A mode that adds real value. However, it is written as plain markdown prose rather than in the semantically structured XML format mandated by the guide. It lacks an explicit persona, audience declaration, quality bar, and output format specification. Instructions use hedging qualitative language where numeric or imperative constraints would be stronger. These gaps mean the workflow is effective as a human-readable SOP but would perform inconsistently if consumed by an LLM agent without further structuring.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase pattern applied.** The workflow is explicitly divided into nine named steps. Each step has a clear cognitive boundary and the model completes one before beginning the next, which matches the phase pattern recommended in Section 16.

- **Section 5 (Instruction Framing) — Conditional branching is present.** Steps 1 and 2 both contain explicit if/else branches covering the "archived vs. current" and "tag vs. date vs. commit vs. skip" scenarios. This matches the conditional instruction pattern in Section 5 and the scenario-based branching pattern in Section 16.

- **Section 14 (Constraint Enforcement) — Graceful degradation is specified.** The workflow explicitly states "Missing files are fine — the summary adapts to what's available" and treats each git statistics fallback as a non-fatal condition. This prevents the model from erroring on absent artifacts.

- **Section 8 (Context Placement) — Task instruction leads.** The workflow description appears first, and the output template is deferred to Step 5, which is broadly consistent with Section 8 Action 1 (instruction at start).

- **Section 7 (Output Format Handling) — Output schema is embedded.** Step 5 provides a concrete markdown template for the generated summary, including section headers, table formats, and field labels. This aligns with Section 7's requirement for a fully specified output format (Pattern 3).

- **Section 19 (Modularity) — Scope is implicitly bounded.** The workflow is scoped to a single concern (summary generation) and does not try to execute phases or audit requirements — it reads artifacts only.

---

## Issues

### Issue 1 — No `<task>`, `<audience>`, or `<quality_bar>` declaration (Section 1, Actions 1–2; Section 4, Action 2)

**What's missing:** The guide requires explicit extraction of (a) what output is requested, (b) why it matters and how it will be used, and (c) what a correct or high-quality response looks like. It also requires encoding the audience explicitly. The workflow states its purpose in two sentences of prose but never formalizes it. The audience ("a new contributor") is mentioned once in passing, not encoded as a structured directive that constrains vocabulary, depth, or assumed knowledge.

**Concrete fix:** Add a structured header block using guide-prescribed XML tags:

```xml
<task>
Generate a comprehensive milestone summary document that a new contributor can read
to understand the entire project — its purpose, architecture, phases, decisions, and
how to get started.
</task>

<audience>
A developer joining the project for the first time. They are technically proficient
but have zero context on decisions made during the milestone. Write at the level of
an experienced developer reading documentation for the first time.
</audience>

<quality_bar>
The summary is high quality when: (1) a new contributor can onboard without asking
clarifying questions about architecture or setup; (2) all major technical decisions
include a rationale; (3) every section draws only from artifact evidence — no
speculation or invented content.
</quality_bar>
```

---

### Issue 2 — No persona assigned despite open-ended, stylistic output task (Section 6, Actions 1–2; Section 22, Pattern 1)

**What's missing:** The final output is a long-form, human-readable narrative document. This is exactly the kind of open-ended, stylistic task where persona assignment improves register consistency. The workflow assigns no persona, meaning the agent will default to generic assistant behavior with unpredictable tone and depth variation across runs.

**Concrete fix:** Add a persona block that constrains voice and priorities:

```xml
<persona>
You are a senior technical writer producing internal project documentation.
Write in present tense, active voice, and lead with decisions and outcomes — not process.
Assume the reader is a capable developer, not a manager. Omit preamble and meta-commentary.
</persona>
```

---

### Issue 3 — Output format section uses qualitative markers, not numeric constraints (Section 21, Tone and Style; Section 22, Pattern 3)

**What's missing:** Step 5's output template uses implicit scope cues like "{From PROJECT.md: ...}" and descriptive labels but sets no word-count floors or ceilings for any section. The guide (Section 21) specifies that size constraints must use numeric limits, not qualitative descriptors. Without limits, section length will vary unpredictably across runs.

**Concrete fix:** Add numeric constraints per section in the template, for example:

```xml
<output_format>
Each section must follow these length constraints:
- Section 1 (Project Overview): 3–6 sentences
- Section 2 (Architecture Decisions): 3–10 bullet entries; each entry max 2 lines
- Section 3 (Phases Delivered): one table row per phase; one_liner max 12 words
- Section 5 (Key Decisions Log): one entry per decision; rationale max 2 sentences
- Section 6 (Tech Debt): bullet list; max 10 items; each item max 1 sentence
- Section 7 (Getting Started): 4–6 bullets with specific commands or file paths
</output_format>
```

---

### Issue 4 — Negative and hedging language in several instructions (Section 5, Action 1)

**What's missing:** Several instructions use hedging or negative framing where the guide requires positive equivalents. Examples found in the workflow:

- "Missing files are fine" — does not specify what to do when files are missing.
- "This is not an error — the summary continues without the Stats section" — states what not to do but not what to do instead.
- "Do not error — the summary should still capture PROJECT.md and ROADMAP.md content" — negative framing.

**Concrete fix:** Apply the Section 5 conversion table:

```
"Missing files are fine" →
  "When a file is not found, skip that section and note 'Not available' in its place."

"This is not an error" →
  "Treat missing stats as a graceful skip: include a Stats section noting
   'Git statistics unavailable — no tag or date range could be determined.'"

"Do not error" →
  "Generate a minimal summary using only PROJECT.md and ROADMAP.md content.
   Label each section that lacks phase data with 'No phases executed yet.'"
```

---

### Issue 5 — No `<output_format>` block specifying machine-parseable or commit behavior (Section 7, Action 1; Section 22, Pattern 3)

**What's missing:** Step 6 instructs the workflow to commit the output file via `gsd-sdk query commit`. No output format block specifies what exact string the commit message must match, whether a confirmation prompt is required before committing, or what the model should output to the user to signal completion. Without this, the model's terminal output is unpredictable and potentially verbose.

**Concrete fix:** Add a dedicated output format block for the agent-facing completion signal:

```xml
<output_format>
After writing and committing the file, output exactly one confirmation line in this format:

  Summary written: .planning/reports/MILESTONE_SUMMARY-v{VERSION}.md

Then proceed immediately to the interactive mode prompt (Step 8).
Do not narrate intermediate steps or describe what you wrote.
</output_format>
```

---

### Issue 6 — No XML tags separating workflow sections; uses markdown headers only (Section 4, Actions 1–2)

**What's missing:** The guide (Section 4, Action 2) states that XML tags are strictly better than markdown headers for Claude-class models because tag names carry semantic meaning and are unambiguous. The entire workflow uses `## Step N:` markdown headers, which provide weaker structural signal than named XML tags.

**Concrete fix:** Wrap each phase in a semantically named `<phase>` tag per Section 16:

```xml
<phase id="1" name="Resolve Version">
  ...
</phase>

<phase id="2" name="Locate Artifacts">
  ...
</phase>
```

And wrap the top-level sections in guide-standard tags:

```xml
<task>...</task>
<context>...</context>
<output_format>...</output_format>
<constraints>...</constraints>
```

---

### Issue 7 — Interactive mode (Step 8) has no constraints on speculation or scope (Section 14, Constraint Enforcement; Section 19, Modularity)

**What's missing:** Step 8 opens an interactive Q&A mode where the model answers questions "from the artifacts already loaded." However, there is no explicit constraint preventing the model from speculating beyond what the artifacts contain, no tie-breaking rule for what to do when artifacts are ambiguous, and no instruction to flag uncertainty. The guide (Section 14) requires every permission to be paired with an equally concrete restriction.

**Concrete fix:**

```xml
<constraints>
  <permitted>
    Answer questions using only content found in the loaded artifacts:
    CONTEXT.md, SUMMARY.md, VERIFICATION.md, PROJECT.md, ROADMAP.md, REQUIREMENTS.md,
    RETROSPECTIVE.md.
  </permitted>
  <exclusions>
    Do not speculate about decisions, rationale, or implementation details not
    present in the loaded artifacts. If a question cannot be answered from artifacts,
    say: "That information isn't captured in the milestone artifacts."
  </exclusions>
</constraints>
```

---

## Quick-Reference Checklist Score

Scoring against Section 23 of the guide. Items marked N/A are not applicable to this workflow type (e.g., self-consistency sampling, RAG pipelines).

### Task Specification
| Item | Result |
|------|--------|
| Intent, audience, and quality bar are all explicit in the prompt | FAIL — audience is mentioned once in prose; no `<audience>` or `<quality_bar>` tag |
| All constraints are compatible — no conflicts between scope, length, or depth | PASS — no conflicting constraints detected |

### Chain-of-Thought
| Item | Result |
|------|--------|
| CoT is included only for math, symbolic reasoning, or multi-step logic tasks | N/A — no CoT trigger used; this is a procedural workflow |
| CoT trigger used correctly | N/A |
| Reasoning is elicited before the answer, not after | N/A |
| CoT traces treated as heuristic, verified downstream | N/A |

### Few-Shot Examples
| Item | Result |
|------|--------|
| Examples selected by semantic similarity | N/A — no few-shot examples in this workflow |
| 2–5 examples total | N/A |
| Ordered simple → complex | N/A |
| Examples span diverse sub-types | N/A |
| Format is consistent across all examples | N/A |
| Example order is fixed across evaluation runs | N/A |

### Formatting
| Item | Result |
|------|--------|
| Instruction is complete and clear before formatting is applied | PASS — the workflow description precedes the template |
| Prompt sections are separated by semantically named XML tags | FAIL — markdown `## Step N:` headers are used throughout; no XML tags |
| At least 3 format variants will be tested on the target model | FAIL — no mention of format variant testing |

### Instruction Framing
| Item | Result |
|------|--------|
| All negative instructions converted to positive equivalents | FAIL — "Do not error", "Missing files are fine", "This is not an error" remain |
| Priority order is explicit when multiple criteria apply | PASS — git statistics fallback uses explicit Method 1 → 2 → 3 → 4 priority order |
| Tie-breaking rules match the domain's cost asymmetry | FAIL — no tie-breaking rule in the interactive Q&A mode; no rule for ambiguous artifacts |

### Persona
| Item | Result |
|------|--------|
| Persona is included only for open-ended or stylistic tasks | FAIL — this is an open-ended, stylistic output task; no persona is assigned |
| Persona is specific (constrains voice/register) | FAIL — no persona present |
| Persona descriptor is gender-neutral | N/A — no persona present |

### Output Format
| Item | Result |
|------|--------|
| Structured output tasks use two-step reasoning-then-format approach | N/A — output is a document, not structured data |
| Single-call JSON places reasoning fields before answer fields | N/A |
| Constrained decoding adopted only after free-form has proven insufficient | N/A |
| Machine-parsed output uses exact format specification with literal string requirements | FAIL — commit step produces no specified terminal output format |

### Context Placement
| Item | Result |
|------|--------|
| Task instruction is at the start of the prompt | PASS — workflow description leads |
| Primary document or input is at the end of the prompt | PASS — user input (`$ARGUMENTS`) is resolved first and output generation is last |
| Background context is in the middle | PASS — artifact discovery and git stats are in middle steps |
| All irrelevant context has been removed | PASS — no extraneous content found |
| Time-sensitive injected context is labeled as a snapshot | N/A — no runtime context injection |

### Self-Consistency
| Item | Result |
|------|--------|
| Self-consistency applied only to tasks with a single correct answer | N/A |
| Inference budget permits 15–20 samples | N/A |

### Prompt Length
| Item | Result |
|------|--------|
| Redundant instructions and repeated context have been removed | PASS — no noticeable redundancy |
| Long prompts have been compressed before sending | N/A |
| RAG context is the extracted relevant passage only | N/A |

### System / User Split
| Item | Result |
|------|--------|
| Persistent instructions are in the system prompt | N/A — this is a workflow file, not a system/user split prompt |
| Task-specific instructions are in the user prompt | N/A |
| Each instruction appears in exactly one location | PASS — no duplicated instructions found |
| Safety-critical constraints have external validation | N/A |

### Agent / Subagent
| Item | Result |
|------|--------|
| Agent prompts are fully self-contained | PASS — the workflow references only standard GSD SDK calls and relative paths |
| All file paths in agent output are absolute | FAIL — paths like `.planning/reports/...` are relative throughout |
| Parallel agents are launched in a single message block | N/A — no parallel agents spawned |
| Adversarial probes are specified for verification agents | N/A |

### Structural Architecture
| Item | Result |
|------|--------|
| Large prompts are decomposed into atomic, single-responsibility modules | PASS — the workflow is a single-concern file |
| Template variables use `${VARIABLE_NAME}` syntax with fallback | PASS — `${VERSION}` pattern used consistently |
| Modules compose at runtime via variable substitution | PASS |

### Constraint Enforcement
| Item | Result |
|------|--------|
| Every restriction is paired with an equally concrete permission | FAIL — Step 8 interactive mode has no explicit constraint pair |
| Hard exclusion lists are enumerated, not described qualitatively | FAIL — no exclusion list for interactive mode speculation |
| Known edge cases have precedent-style rulings | PASS — overwrite guard (Step 6) is a precedent-style ruling |
| Confidence thresholds are numeric, not qualitative | N/A — no filtering task with confidence scoring |

### Decision Frameworks
| Item | Result |
|------|--------|
| Multi-option recommendations use an explicit decision tree or comparison table | PASS — the git statistics fallback chain is an explicit ordered decision tree |
| Criteria checklists gate complex approaches | N/A |
| Action permissions are framed around reversibility | FAIL — commit in Step 6 is irreversible; no confirmation step is required beyond the overwrite guard |

### Multi-Phase Workflows
| Item | Result |
|------|--------|
| Complex tasks are organized into explicit named phases | PASS — nine named steps |
| Required steps are distinguished from type-specific steps | FAIL — all steps are listed at the same level; no `<required_steps universal="true">` distinction |
| Scenario-based branching handles multiple paths explicitly | PASS — archived vs. current milestone and git statistics fallback are handled |

### Memory and Continuity
| Item | Result |
|------|--------|
| Memory templates use XML tags as section labels | N/A — this workflow writes a report, not a memory file |
| Compaction summaries include discoveries and failed approaches | N/A |
| Next steps are tied to the user's most recent explicit request | PASS — Step 8 close suggests `/gsd-new-milestone`, `/gsd-progress`, or sharing the summary |

### Modularity
| Item | Result |
|------|--------|
| Each prompt component has a single responsibility | PASS |
| Scope boundaries state both inclusions and exclusions | FAIL — Step 8 interactive mode states what to include (artifact-grounded answers) but not what to exclude (speculation) |

### Safety and Trust
| Item | Result |
|------|--------|
| Validation is at system boundaries only; internal interfaces are trusted | PASS |
| Dual-use capabilities state permissions before restrictions | N/A |
| Authorization is narrow-scoped; each action confirmed before expanding scope | FAIL — commit (Step 6) executes without user confirmation; it is an irreversible action |

### Tone and Style
| Item | Result |
|------|--------|
| Size constraints use numeric limits, not qualitative descriptors | FAIL — output template uses no word/line-count limits |
| Instructions use imperative present tense | PASS — most instructions are imperative ("Read all files that exist", "Write to …") |
| Working notes are in analysis tags, not user-facing output | N/A — no analysis tags needed in a workflow file |

### Optimization
| Item | Result |
|------|--------|
| Prompt is flagged as a draft for automated optimization | FAIL — no optimization flag |
| Correct optimizer selected | FAIL — not addressed |
| Held-out test set reserved before optimization begins | FAIL — not addressed |

---

## Recommendations

Listed in priority order by expected impact.

### 1. Add `<task>`, `<audience>`, and `<quality_bar>` tags at the top (Section 1, Actions 1–2; Section 4, Action 2)

This is the highest-leverage fix. Without an explicit audience declaration, the model cannot calibrate vocabulary or depth consistently. Without a quality bar, "correct" output is undefined. Adding these three tags directly beneath the workflow title takes under 15 lines and anchors every subsequent step.

### 2. Assign a specific persona for the report-writing task (Section 6, Actions 1–2; Section 22, Pattern 1)

The output is a long-form narrative document — exactly the task type where persona assignment improves register consistency across runs. A four-line persona block (technical writer, active voice, decisions-first, no preamble) will reduce stylistic variance without changing functional behavior.

### 3. Add numeric length constraints to the output template (Section 21, Tone and Style; Section 22, Pattern 3)

Section 5's output template currently has no word/line constraints. Replace qualitative scope hints like "{From PROJECT.md: ...}" with numeric bounds per section (e.g., "3–10 bullet entries; each rationale max 2 sentences"). This is the change most likely to reduce output length variance across different milestones.

### 4. Convert negative and hedging instructions to positive equivalents (Section 5, Action 1)

Three instructions use negative or passive framing ("Do not error", "Missing files are fine", "This is not an error"). Converting each to an explicit positive directive ("When a file is missing, write 'Not available' in that section and continue") removes ambiguity and removes risk of the model treating the phrase as permission to stop rather than permission to skip.

### 5. Add an explicit constraint block for the Step 8 interactive mode (Section 14, Constraint Enforcement; Issue 7 above)

Step 8 is the highest-risk section for hallucination because it invites open-ended Q&A without bounding what the model may draw on. Adding a `<permitted>` / `<exclusions>` pair (list of allowed source files; instruction to flag unanswerable questions explicitly) closes this gap with roughly ten lines of constraint text.
