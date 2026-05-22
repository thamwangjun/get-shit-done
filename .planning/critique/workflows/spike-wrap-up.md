# Critique: spike-wrap-up.md

## Summary

`spike-wrap-up.md` is a well-structured, purpose-driven workflow that effectively guides an agent through a multi-phase curation process. Its step sequencing is logical, its success criteria are concrete and checkable, and its user-checkpoint design demonstrates genuine awareness of when human judgment is needed. However, the prompt relies almost entirely on prose-inside-XML-steps rather than the richer structural vocabulary the guide prescribes. Key guide requirements are absent: there is no persona, no explicit output format specification for machine-parsed or structured outputs, no XML-tagged `<task>`/`<context>`/`<output_format>` skeleton, no priority ordering, no tie-breaking rules for the include/exclude decision, and no constraint pairs. The workflow also mixes negative instruction patterns (e.g., "Exclude:") without positive counterparts, and several qualitative terms ("core source files", "key code snippets") lack the calibrating examples the guide demands. These gaps mean the prompt will produce inconsistent results across agents and degrade unpredictably at edge cases — particularly the curate step, where ambiguous spikes are most likely.

---

## Strengths

- **Section 16 — Phase pattern applied correctly.** The workflow decomposes work into explicitly named, sequenced `<step>` elements (gather, curate, group, skill_name, copy_sources, synthesize, write_skill, write_summary, update_claude_md, commit, report). Each step is a discrete cognitive unit, reducing interleaving risk.

- **Section 16 — Scenario branching is present.** The `curate` step handles multiple user responses ("Include / Exclude / Partial / Help me UAT this") as explicit conditional branches, matching the guide's scenario-based branching pattern.

- **Section 22 Pattern 3 (partially applied) — Output templates are co-located with their instructions.** The skill provides literal template strings for SKILL.md, reference files, and WRAP-UP-SUMMARY.md, which reduces format variance.

- **Section 13 — Template variable injection is used appropriately.** The workflow references `[project-dir-name]`, `[date]`, `{N}`, etc. as slot variables embedded directly in output templates.

- **Section 23 — Success criteria checklist is present.** The `<success_criteria>` block enumerates verifiable exit conditions, which directly supports evaluation and reduces ambiguous "done" states.

- **Section 8 Action 1 — Task instruction leads the prompt.** The `<purpose>` tag correctly opens the file, establishing intent before any procedural content.

- **Section 5 — Conditional instruction pattern is used.** The `commit_docs` config check and its conditional exit branch ("If no unprocessed spikes exist... Exit.") follow the guide's conditional instruction style.

---

## Issues

### Issue 1 — No persona assigned for a task that requires stylistic judgment
**Guide principle:** Section 6 Action 1–2 — Assign a persona for open-ended or stylistic tasks; make it specific, not generic.

**What's missing:** The curate step requires the agent to "summarize the Results section", identify "grey areas", and write "key findings" — all stylistically open-ended tasks. No persona is defined. The agent defaults to its own prior of what "good summarization" looks like, producing inconsistent register and depth across runs.

**Concrete fix:** Add a `<persona>` block at the top of the workflow:
```xml
<persona>
You are a spike curation specialist. Your job is to distill experimental findings into
actionable implementation knowledge. Write findings in present tense, active voice.
Prioritize specificity over completeness — one concrete constraint is worth more than
three vague observations.
</persona>
```

---

### Issue 2 — No `<task>`, `<context>`, `<output_format>` structural skeleton
**Guide principle:** Section 4 Action 2 — Use semantically named XML tags to separate prompt sections. Section 8 Actions 1–3 — Task leads, input closes, context sits in the middle.

**What's missing:** The entire prompt is organized as `<purpose>` + `<process>` + `<success_criteria>`. The guide's core structural vocabulary (`<task>`, `<context>`, `<constraints>`, `<output_format>`) is absent. The `<process>` tag is non-standard and gives the model no semantic signal about what the section *is* relative to the task. The `<purpose>` tag is also non-standard.

**Concrete fix:** Restructure the top-level tags to match the guide's vocabulary:
```xml
<task>
Curate spike experiment findings and package them into a persistent project skill...
</task>

<context>
Reads from `.planning/spikes/`. Writes skill to `./.claude/skills/spike-findings-[project]/`
and summary to `.planning/spikes/WRAP-UP-SUMMARY.md`. Companion to `/gsd-spike`.
</context>

<constraints>
<permitted>Read any file in the spike directory. Write to .claude/skills/ and .planning/spikes/.</permitted>
<reserved_for_human_review>Include/Exclude/Partial decisions for each spike.</reserved_for_human_review>
</constraints>
```

---

### Issue 3 — Negative instructions not converted to positive equivalents
**Guide principle:** Section 5 Action 1 — Convert negative instructions to positive equivalents before emitting any prompt.

**What's missing:** The `copy_sources` step uses an "Exclude:" list as its primary instruction:
> "Exclude: node_modules/, __pycache__/, .venv/, build artifacts, Lock files, .git/, .DS_Store"

This is a negation-first instruction. There is also no positive statement of what "core source files" means before the exclusion list.

**Concrete fix:** Invert the framing to lead with inclusion, then append the exclusion:
```
Include: scripts, entry-point source files, and configuration files that are
directly required to run the spike. A file qualifies if removing it would break
the spike's execution.

Exclude only: node_modules/, __pycache__/, .venv/, build artifacts, lock files
(package-lock.json, yarn.lock), .git/, .DS_Store.
```

---

### Issue 4 — Qualitative terms without calibrating examples
**Guide principle:** Section 22 Pattern 2 — Pair every abstract instruction with at least one concrete example that demonstrates the target standard.

**What's missing:** Multiple steps use abstract qualitative terms without examples:
- `synthesize`: "include key code snippets extracted from the spike source" — what length? what selection criteria?
- `synthesize`: "Landmines — Things that look right but aren't. Gotchas." — no example of what a landmine entry looks like.
- `curate`: "Grey areas: anything uncertain or partially proven" — no example.
- `write_skill`: "One paragraph from MANIFEST.md" — no example of what a good paragraph looks like vs. a copy-paste.

**Concrete fix (for synthesize step):** Add calibrating examples inline:
```markdown
## Landmines
<!-- Example: "fetch() with keepalive:true silently drops payloads >64KB on Chrome —
use sendBeacon() instead." Format: what it looks like + what actually happens. -->
[Things that look right but aren't. Gotchas. Anti-patterns discovered during spiking.]
```

---

### Issue 5 — No tie-breaking rule for the include/exclude curation decision
**Guide principle:** Section 5 (Tie-breaking instructions) — Add explicit tie-breaking when the model might be uncertain. Match the rule to the domain's cost asymmetry.

**What's missing:** The curate step presents four options (Include / Exclude / Partial / Help me UAT this) but gives no guidance on the default recommendation when the agent is uncertain whether a PARTIAL spike is worth including. In practice, agents interpreting "partial" spikes will vary — some will bias toward inclusion (noisy skill), others toward exclusion (lost knowledge).

**Concrete fix:** Add a tie-breaking rule after the verdict presentation:
```xml
<tie_breaking>
When a spike's verdict is PARTIAL and you are uncertain whether its findings are
actionable enough to include: recommend PARTIAL inclusion with explicit scope notes.
Losing a partial finding is more costly than including a noisy one — the reference
file's "Grey Areas" section is the right place to capture uncertainty.
</tie_breaking>
```

---

### Issue 6 — No priority ordering for curate step when signals conflict
**Guide principle:** Section 5 (Priority ordering) — When multiple considerations apply, list them with explicit priority.

**What's missing:** The curate step asks the agent to present "Key findings" and "Grey areas" from spike READMEs, but gives no ordering when the README content conflicts with the frontmatter verdict, or when findings span multiple feature areas. There is no rule for which source wins.

**Concrete fix:** Add a priority order inside the curate step:
```xml
<priority_order>
1. Frontmatter `verdict` field — authoritative source for VALIDATED / INVALIDATED / PARTIAL
2. README "Results" section — primary source for key findings text
3. README "What to Expect" — secondary source if Results is absent or sparse
4. Frontmatter `tags` — used for grouping only; does not override finding content
</priority_order>
```

---

### Issue 7 — Output format for the curate checkpoint is not specified as machine-parseable
**Guide principle:** Section 7 Action 1 / Section 22 Pattern 3 — Output format should be fully specified. Machine-parsed outputs need exact literal string format.

**What's missing:** The curate step checkpoint box uses decorative ASCII box-drawing characters to render a UI prompt, but does not specify what format the agent should expect *back* from the user or how to parse ambiguous inputs (e.g., "partial — include the WebSocket part"). The checkpoint is interactive and user-facing but its parsing logic is implicit.

**Concrete fix:** Add an explicit parse rule after the checkpoint definition:
```
Parse the user's response as follows:
- "include" or "i" → mark spike as INCLUDED
- "exclude" or "e" → mark spike as EXCLUDED
- "partial" or "p" → prompt for scope notes, then mark as PARTIAL
- "help me uat this" or "uat" → enter UAT sub-flow
- Any other response → ask for clarification before proceeding
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide, applied to `spike-wrap-up.md` as a workflow prompt.

### Task Specification
| Item | Score | Notes |
|------|-------|-------|
| Intent, audience, and quality bar are all explicit | FAIL | Intent is present in `<purpose>`; audience (the invoking agent) is implicit; quality bar is absent — no statement of what a good wrap-up looks like. |
| All constraints are compatible — no conflicts | PASS | No conflicting constraints detected. |

### Chain of Thought
| Item | Score | Notes |
|------|-------|-------|
| CoT included only for math/symbolic/multi-step logic tasks | N/A | No CoT trigger used; appropriate — this is a procedural workflow, not a reasoning task. |
| CoT trigger phrase used | N/A | |
| Reasoning elicited before answer | N/A | |
| CoT traces treated as heuristic | N/A | |

### Few-Shot Examples
| Item | Score | Notes |
|------|-------|-------|
| Examples selected by semantic similarity | FAIL | No examples provided for key qualitative outputs (landmines, grey areas, key findings). |
| 2–5 examples total | FAIL | Zero examples. |
| Ordered simple to complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format consistent across all examples | N/A | |
| Example order fixed across evaluation runs | N/A | |

### Formatting
| Item | Score | Notes |
|------|-------|-------|
| Instruction complete and clear before formatting applied | PASS | Steps are written before output templates are shown. |
| Prompt sections separated by semantically named XML tags | FAIL | Top-level tags (`<purpose>`, `<process>`) are non-standard. Step tags lack the guide's vocabulary (`<task>`, `<context>`, `<output_format>`, `<constraints>`). |
| At least 3 format variants tested on target model | FAIL | No evidence of format variant testing. |

### Instruction Framing
| Item | Score | Notes |
|------|-------|-------|
| Negative instructions converted to positive equivalents | FAIL | `copy_sources` step leads with an "Exclude:" list as the primary instruction. |
| Priority order explicit when multiple criteria apply | FAIL | No priority ordering in the curate step for conflicting sources. |
| Tie-breaking rules match domain's cost asymmetry | FAIL | No tie-breaking rule for partial spike inclusion decisions. |

### Persona
| Item | Score | Notes |
|------|-------|-------|
| Persona included only for open-ended or stylistic tasks | FAIL | Stylistic tasks (summarization, finding synthesis) are present but no persona is defined. |
| Persona is specific (constrains voice/register) | FAIL | No persona present. |
| Persona descriptor is gender-neutral | N/A | No persona present. |

### Output Format
| Item | Score | Notes |
|------|-------|-------|
| Structured output tasks use two-step reasoning-then-format approach | N/A | Output is human-facing documents, not structured data. |
| Single-call JSON places reasoning before answer fields | N/A | No JSON output. |
| Constrained decoding adopted only after free-form proven insufficient | N/A | |
| Machine-parsed output uses exact format specification | FAIL | The curate checkpoint's user response format is implicit — no parse specification. |

### Context Placement
| Item | Score | Notes |
|------|-------|-------|
| Task instruction is at the start of the prompt | PASS | `<purpose>` leads the file. |
| Primary document or input is at the end of the prompt | PASS | `<success_criteria>` closes the file; procedural content precedes it. |
| Background context is in the middle | PASS | Step definitions sit between purpose and success criteria. |
| All irrelevant context has been removed | PASS | No extraneous content detected. |
| Time-sensitive injected context is labeled as a snapshot | N/A | No time-sensitive context injected. |

### Self-Consistency
| Item | Score | Notes |
|------|-------|-------|
| Self-consistency applied only to tasks with a single correct answer | N/A | Not applicable to this workflow type. |
| Inference budget permits 15–20 samples | N/A | |

### Prompt Length
| Item | Score | Notes |
|------|-------|-------|
| Redundant instructions and repeated context removed | PASS | No obvious redundancy detected. |
| Long prompts compressed before sending | N/A | Prompt is not excessively long. |
| RAG context is the extracted relevant passage only | N/A | |

### System/User Split
| Item | Score | Notes |
|------|-------|-------|
| Persistent instructions in the system prompt | N/A | Workflow file; system/user split managed by the harness. |
| Task-specific instructions in the user prompt | N/A | |
| Each instruction appears in exactly one location | PASS | No instruction duplication detected. |
| Safety-critical constraints have external validation | N/A | No safety-critical constraints in scope. |

### Agent/Subagent
| Item | Score | Notes |
|------|-------|-------|
| Agent prompts are fully self-contained | PASS | The workflow is self-contained; it instructs the agent to read its own prerequisite files. |
| All file paths in agent output are absolute | FAIL | Output paths are written as relative (`.planning/spikes/`, `./.claude/skills/`) throughout. |
| Parallel agents launched in single message block | N/A | No parallel agent spawning. |
| Adversarial probes specified for verification agents | N/A | Not a verification agent. |

### Structural Architecture
| Item | Score | Notes |
|------|-------|-------|
| Large prompts decomposed into atomic, single-responsibility modules | PASS | Each `<step>` is focused on one concern. |
| Template variables use `${VARIABLE_NAME}` syntax with fallback | FAIL | Variables use `[bracket]` notation instead of `${VARIABLE_NAME}` syntax; no fallback values. |
| Modules compose at runtime via variable substitution | FAIL | Variable syntax is inconsistent (mix of `[bracket]`, `{brace}`, and `{N}` styles). |

### Constraint Enforcement
| Item | Score | Notes |
|------|-------|-------|
| Every restriction paired with an equally concrete permission | FAIL | `copy_sources` has an exclusion list but no paired permission list for what IS included. |
| Hard exclusion lists are enumerated, not qualitative | PASS | The copy_sources exclusions are enumerated (specific paths and file patterns). |
| Known edge cases have precedent-style rulings | FAIL | No precedents defined (e.g., what to do if a spike README is missing its Results section). |
| Confidence thresholds are numeric, not qualitative | FAIL | No confidence thresholds defined; "grey areas" and "uncertain" are qualitative. |

### Decision Frameworks
| Item | Score | Notes |
|------|-------|-------|
| Multi-option recommendations use an explicit decision tree or comparison table | FAIL | The Include/Exclude/Partial/UAT branch is described in prose, not a decision tree. |
| Criteria checklists gate complex approaches | FAIL | No criteria checklist before the group step or skill write step. |
| Action permissions framed around reversibility | FAIL | No reversibility framing; the commit step is irreversible and has no confirmation gate. |

### Multi-Phase Workflows
| Item | Score | Notes |
|------|-------|-------|
| Complex tasks organized into explicit named phases | PASS | All steps are explicitly named. |
| Required steps distinguished from type-specific steps | FAIL | No `<required_steps universal="true">` distinction; all steps appear equally mandatory. |
| Scenario-based branching handles multiple paths explicitly | PASS | The curate step has explicit branches for each user response. |

### Memory and Continuity
| Item | Score | Notes |
|------|-------|-------|
| Memory templates use XML tags as section labels | FAIL | Output templates use markdown headers (`##`) rather than XML tags as section labels. |
| Compaction summaries include discoveries and failed approaches | FAIL | WRAP-UP-SUMMARY.md template has no "failed approaches" or "discoveries" section. |
| Next steps tied to user's most recent explicit request | PASS | The report step's "Next Up" is directly tied to the workflow's output. |

### Modularity
| Item | Score | Notes |
|------|-------|-------|
| Each prompt component has a single responsibility | PASS | Steps are well-scoped. |
| Scope boundaries state both inclusions and exclusions | FAIL | `copy_sources` states exclusions without a positive inclusion definition. |

### Safety and Trust
| Item | Score | Notes |
|------|-------|-------|
| Validation at system boundaries only; internal interfaces trusted | PASS | File reads are assumed valid; MANIFEST.md parsing is not over-validated. |
| Dual-use capabilities state permissions before restrictions | FAIL | `copy_sources` leads with exclusions before defining what is permitted. |
| Authorization narrow-scoped; confirm before expanding scope | N/A | Not an action-execution context with external side effects beyond file writes. |

### Tone and Style
| Item | Score | Notes |
|------|-------|-------|
| Size constraints use numeric limits, not qualitative descriptors | FAIL | "One paragraph from MANIFEST.md" and "One-line summary" are qualitative; no word/character counts. |
| Instructions use imperative present tense | PASS | Steps consistently use imperative present tense ("Read", "Glob", "Write", "Present"). |
| Working notes in analysis tags, not user-facing output | N/A | No internal reasoning tags needed for this workflow. |

### Optimization
| Item | Score | Notes |
|------|-------|-------|
| Prompt flagged as draft for automated optimization | FAIL | No optimization flag or note. |
| Correct optimizer selected | FAIL | Not selected. |
| Held-out test set reserved before optimization | FAIL | Not mentioned. |

---

## Recommendations

**Priority 1 — Add a persona (Section 6 Action 1–2; Section 22 Pattern 1)**
The curate and synthesize steps require open-ended stylistic judgment — summarization, landmine identification, finding synthesis. Without a persona, output register and granularity will vary unpredictably across runs. A two-sentence persona scoped to "spike curation specialist" with explicit style directives (present tense, specificity over completeness) will anchor all downstream steps.

**Priority 2 — Convert the copy_sources exclusion list to a permission-first pattern, and add a positive inclusion definition (Section 5 Action 1; Section 14 — Explicit permission pairs)**
The step currently leads with what to exclude. Rewrite it to first define what "core source file" means as a positive criterion (e.g., "a file whose removal would break the spike's execution"), then append the exclusion list. Pair this with a `<permitted>` / `<excluded>` tag structure. This is the single cheapest fix with the broadest impact on agent consistency.

**Priority 3 — Add calibrating examples for landmines, key findings, and grey areas (Section 22 Pattern 2)**
The synthesize and curate steps use abstract terms without examples. Add at least one inline example for each qualitative output field (landmine entry, key finding sentence, grey area note). These examples set the calibration bar the agent cannot infer from vocabulary alone.

**Priority 4 — Fix variable syntax inconsistency and add tie-breaking for partial spikes (Section 13 — Template variable injection; Section 5 — Tie-breaking instructions)**
The workflow mixes `[bracket]`, `{brace}`, and `{N}` variable styles. Standardize on `${VARIABLE_NAME}` throughout. Simultaneously, add a tie-breaking rule for PARTIAL spike inclusion that reflects the domain's cost asymmetry (missing a partial finding is more costly than including a noisy one).

**Priority 5 — Replace markdown headers in output templates with XML section tags, and add a "failed approaches" section to WRAP-UP-SUMMARY.md (Section 4 Action 2; Section 18 — Memory and Continuity)**
The SKILL.md and WRAP-UP-SUMMARY.md templates use `##` markdown headers as section labels. The guide recommends XML tags as section labels for structured outputs. Additionally, the WRAP-UP-SUMMARY.md template has no mechanism for capturing what was tried and rejected during curation — a `## Excluded Spike Rationale` or `<discoveries>` section would preserve this knowledge for future sessions.
