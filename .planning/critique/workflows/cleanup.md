# Critique: cleanup.md

## Summary

`cleanup.md` is a functional, readable workflow that accomplishes its narrow goal — archiving phase directories from completed milestones — with a clear sequential structure and good use of XML `<step>` tags. It handles edge cases (already-archived milestones, empty phase sets), includes a dry-run confirmation gate, and commits the result. However, it falls short of guide standards in several structural areas: the task intent and quality bar are implicit rather than stated; XML tag vocabulary diverges from the guide's canonical set; there is no output format specification for the agent's final report; negative framing appears in the dry-run branch; and the inline AskUserQuestion block is poorly placed with unclear text-mode instructions embedded mid-prose. The workflow is a solid draft and would benefit from focused revision in constraint framing, output format specification, and structural tag alignment.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — phase pattern applied well.** The workflow is decomposed into five named `<step>` elements (`identify_completed_milestones`, `determine_phase_membership`, `show_dry_run`, `archive_phases`, `report`), creating clear cognitive boundaries. Each step has a single responsibility.

- **Section 15 (Decision Frameworks) — early-exit guards present.** Both the "all already archived" and "no remaining phases" conditions have explicit stop instructions, preventing unnecessary continuation.

- **Section 14 (Constraint Enforcement) — the dry-run confirmation gate.** The `AskUserQuestion` confirmation before any destructive `mv` operation correctly applies the reversibility framework (Section 15, reversibility framework) — asking before the irreversible action.

- **Section 8 (Context Placement) — task instruction leads the file.** The `<purpose>` block appears at the top, followed by `<required_reading>`, then `<process>`. Instruction-first ordering is correctly observed.

- **Section 19 (Modularity) — single-responsibility scope.** The workflow handles one concern (archiving phase directories) and nothing else. Scope is narrow and coherent.

- **Section 16 — success criteria checklist included.** The `<success_criteria>` block at the end provides a verifiable completion condition, consistent with the guide's phase completion verification patterns.

---

## Issues

### Issue 1 — Missing explicit task intent, audience, and quality bar (Section 1, Actions 1–2)

**Principle:** Section 1 requires every prompt to make explicit: (a) what output is being requested, (b) why it matters / how it will be used, and (c) what a correct or high-quality response looks like. The audience must also be encoded.

**What's wrong:** The `<purpose>` block describes what the workflow does mechanically but omits the "why" (intent) and "quality bar." There is no audience declaration. The prompt gives no signal about what a well-executed run looks like beyond the success criteria checklist (which is output-state-focused, not quality-focused).

**Concrete fix:** Replace or augment `<purpose>` with explicit `<task>`, `<audience>`, and `<quality_bar>` tags:

```xml
<task>
Archive accumulated phase directories from completed milestones into their versioned
archive directories. Identify eligible phases, confirm with the user, then move and commit.
</task>

<audience>
A developer running end-of-milestone housekeeping. They are familiar with the GSD project
structure and expect a clear dry-run summary before any files are moved.
</audience>

<quality_bar>
A correct run: identifies all unarchived completed milestones, shows an accurate dry-run
summary, moves only the confirmed set, and commits with a descriptive message.
A failed run: moves directories without confirmation, skips milestones, or commits
incorrect paths.
</quality_bar>
```

---

### Issue 2 — Non-canonical XML tag vocabulary (Section 4, Action 2 and the XML tag vocabulary table)

**Principle:** Section 4 Action 2 mandates using semantically named XML tags from the guide's canonical vocabulary. The workflow tag `<step>` is not in the canonical set; `<phase>` is (with attributes `id`, `name`, `trigger`).

**What's wrong:** The workflow uses `<step name="...">` throughout. The guide's canonical equivalent is `<phase id="..." name="..." trigger="...">`. Additionally, the surrounding `<process>` wrapper tag is not in the vocabulary (no canonical equivalent). `<required_reading>` has no analogue; `<context>` would serve its role better.

**Concrete fix:** Rename structural tags to align with canonical vocabulary:

```xml
<context>
Required reading before execution:
1. `.planning/MILESTONES.md`
2. `.planning/milestones/` directory listing
3. `.planning/phases/` directory listing
</context>

<phase id="1" name="Identify Completed Milestones">
...
</phase>

<phase id="2" name="Determine Phase Membership">
...
</phase>
```

Use `trigger="after_dry_run_approval"` on the `archive_phases` phase to make the confirmation gate machine-readable.

---

### Issue 3 — Negative instruction framing in the dry-run branch (Section 5, Action 1)

**Principle:** Section 5 Action 1 requires converting negative instructions ("no phase directories remain") to positive specifications of desired behavior.

**What's wrong:** The dry-run step includes:

> "If no phase directories remain to archive (all already moved or deleted): [stop message]. Stop here."

This is a negatively-framed conditional. The instruction is correct in logic but violates the positive-framing rule.

**Concrete fix:** Reframe as a positive check:

```
Check whether at least one phase directory matches a milestone without an existing archive.
If phase directories exist to archive: present the dry-run summary below.
If every eligible phase directory has already been archived or deleted:
  Report: "No phase directories found to archive. Phases may have been removed or archived previously."
  Stop.
```

---

### Issue 4 — Missing output format specification for the final report (Section 7, Action 1; Section 22, Pattern 3)

**Principle:** Section 7 Action 1 and Pattern 3 (Section 22) require that the required output structure be stated completely and upfront.

**What's wrong:** The `<step name="report">` provides a template with `{For each milestone}` placeholder prose, but does not specify the format as a structured output tag. The report format is implicit — the agent may produce verbose preamble or deviate from the template. There is no `<output_format>` block.

**Concrete fix:** Add an explicit `<output_format>` block at the end of the workflow:

```xml
<output_format>
After archiving, output only the following report. No preamble.

Archived:
- v{X.Y}: {N} phase directories → .planning/milestones/v{X.Y}-phases/
[repeat for each milestone]

.planning/phases/ cleaned up.
</output_format>
```

---

### Issue 5 — Text-mode instruction embedded in mid-prose, breaking Section 8 context placement (Section 8, Actions 1–3; Section 11, Action 3)

**Principle:** Section 8 requires background context in the middle and Section 11 Action 3 prohibits repeated or scattered instructions — each instruction belongs in exactly one location.

**What's wrong:** The text-mode fallback block appears inline inside `<step name="show_dry_run">`, interrupting the step narrative mid-flow:

```
**Text mode (`workflow.text_mode: true` in config or `--text` flag):** Set `TEXT_MODE=true` if...
AskUserQuestion: "Proceed with archiving?" with options: "Yes — archive listed phases" | "Cancel"
```

This mixes a meta-configuration concern with a task execution step. The text-mode instruction is a cross-cutting concern that belongs in a `<constraints>` or `<system_note>` block at the top of the file, not inside a step body.

**Concrete fix:** Extract the text-mode note to a top-level block:

```xml
<system_note>
TEXT MODE: If `--text` is present in $ARGUMENTS or `text_mode` is true in the init JSON,
replace all AskUserQuestion calls with a plain-text numbered list. Ask the user to type
their choice number. Required for non-Claude runtimes (OpenAI Codex, Gemini CLI).
</system_note>
```

Then in the step, write only the confirmation call:

```
AskUserQuestion: "Proceed with archiving?" with options: "Yes — archive listed phases" | "Cancel"
If "Cancel": Stop.
```

---

### Issue 6 — No constraint block with permission pairs (Section 14, explicit permission pairs)

**Principle:** Section 14 requires every restriction to be paired with what IS permitted, stated equally concretely. The reversibility framework (Section 15) requires `<take_freely>` / `<confirm_with_user>` for action-execution contexts.

**What's wrong:** The workflow performs destructive file system operations (`mv`) but carries no `<constraints>` block stating what the agent may and may not do autonomously. The boundary between "read freely" and "confirm before acting" is implied by the dry-run step but never made explicit.

**Concrete fix:** Add a `<constraints>` block after `<purpose>`:

```xml
<constraints>
  <take_freely>
    - Read `.planning/MILESTONES.md`, `.planning/milestones/`, `.planning/phases/`
    - Run `ls`, `cat`, `git log` commands
    - Compute dry-run summaries
  </take_freely>

  <confirm_with_user>
    - Moving any directory (`mv`) — irreversible without git revert
    - Committing changes to the repository
  </confirm_with_user>
</constraints>
```

---

## Quick-Reference Checklist Score

Scored against Section 23. Items not applicable to this workflow type are marked N/A.

### Task Specification
| Item | Score |
|------|-------|
| Intent, audience, and quality bar are all explicit in the prompt | FAIL |
| All constraints are compatible — no conflicts between scope, length, or depth | PASS |

### Chain-of-Thought
| Item | Score |
|------|-------|
| CoT is included only for math, symbolic reasoning, or multi-step logic tasks | N/A |
| Reasoning is elicited before the answer | N/A |

### Few-Shot Examples
| Item | Score |
|------|-------|
| Examples selected by semantic similarity | N/A |
| 2–5 examples total | N/A |
| Format consistent across all examples | N/A |

### Formatting
| Item | Score |
|------|-------|
| Instruction is complete and clear before formatting is applied | PASS |
| Prompt sections are separated by semantically named XML tags | FAIL — `<step>`, `<process>`, `<required_reading>` diverge from canonical vocabulary |
| At least 3 format variants will be tested | N/A (workflow file, not a tuned prompt) |

### Instruction Framing
| Item | Score |
|------|-------|
| All negative instructions converted to positive equivalents | FAIL — dry-run "no directories remain" block is negatively framed |
| Priority order is explicit when multiple criteria apply | N/A |
| Tie-breaking rules match domain cost asymmetry | N/A |

### Persona
| Item | Score |
|------|-------|
| Persona included only for open-ended or stylistic tasks | N/A (no persona; correct omission) |

### Output Format
| Item | Score |
|------|-------|
| Structured output tasks use two-step reasoning-then-format approach | N/A |
| Machine-parsed output uses exact format specification | FAIL — final report format is a placeholder template, not a binding specification |

### Context Placement
| Item | Score |
|------|-------|
| Task instruction is at the start of the prompt | PASS |
| Primary document or input is at the end of the prompt | N/A |
| Background context is in the middle | PASS |
| All irrelevant context has been removed | PASS |
| Time-sensitive injected context is labeled as a snapshot | N/A |

### Self-Consistency
| Item | Score |
|------|-------|
| Self-consistency applied only to tasks with single correct answer | N/A |

### Prompt Length
| Item | Score |
|------|-------|
| Redundant instructions and repeated context removed | PASS |
| Long prompts compressed before sending | N/A |

### System/User Split
| Item | Score |
|------|-------|
| Persistent instructions in system prompt | N/A |
| Each instruction appears in exactly one location | FAIL — text-mode instruction embedded inside a step body |
| Safety-critical constraints have external validation | N/A |

### Agent/Subagent
| Item | Score |
|------|-------|
| Agent prompts are fully self-contained | PASS |
| All file paths in agent output are absolute | FAIL — all paths in the workflow are relative (`.planning/phases/`, `.planning/milestones/`) |
| Parallel agents launched in single message block | N/A |
| Adversarial probes specified for verification agents | N/A |

### Structural Architecture
| Item | Score |
|------|-------|
| Large prompts decomposed into atomic modules | PASS |
| Template variables use `${VARIABLE_NAME}` syntax | FAIL — version placeholders use `{X.Y}` not `${X.Y}` |
| Modules compose via variable substitution | N/A |

### Constraint Enforcement
| Item | Score |
|------|-------|
| Every restriction paired with an equally concrete permission | FAIL — no `<constraints>` block present |
| Hard exclusion lists enumerated | N/A |
| Known edge cases have precedent-style rulings | N/A |
| Confidence thresholds are numeric | N/A |

### Decision Frameworks
| Item | Score |
|------|-------|
| Multi-option recommendations use decision tree or comparison table | N/A |
| Criteria checklists gate complex approaches | N/A |
| Action permissions framed around reversibility | FAIL — reversibility boundaries implied, not declared |

### Multi-Phase Workflows
| Item | Score |
|------|-------|
| Complex tasks organized into explicit named phases | PASS — five named steps present |
| Required steps distinguished from type-specific steps | N/A |
| Scenario-based branching handles multiple paths explicitly | PASS — early-exit branches present |

### Memory and Continuity
| Item | Score |
|------|-------|
| Memory templates use XML tags as section labels | N/A |
| Compaction summaries include discoveries and failed approaches | N/A |

### Modularity
| Item | Score |
|------|-------|
| Each prompt component has single responsibility | PASS |
| Scope boundaries state both inclusions and exclusions | FAIL — scope inclusions present (what to archive), but explicit exclusions absent |

### Safety and Trust
| Item | Score |
|------|-------|
| Validation at system boundaries only | PASS |
| Authorization narrow-scoped; each action confirmed before expanding scope | PASS — dry-run gate present |

### Tone and Style
| Item | Score |
|------|-------|
| Size constraints use numeric limits | N/A |
| Instructions use imperative present tense | PASS |
| Working notes in analysis tags, not user-facing output | N/A |

### Optimization
| Item | Score |
|------|-------|
| Prompt flagged as draft for automated optimization | N/A (workflow file) |

**Summary count:** PASS: 13 | FAIL: 9 | N/A: 24

---

## Recommendations

Listed in priority order from highest to lowest impact.

### 1. Add `<task>`, `<audience>`, and `<quality_bar>` blocks (Section 1, Actions 1–2)

This is the highest-leverage fix. Without explicit intent, audience, and quality bar, the agent has no grounding for what success looks like beyond mechanical step completion. Add all three as top-level tags immediately after (or replacing) `<purpose>`. This takes under 15 minutes and resolves the most fundamental gap.

### 2. Add a `<constraints>` block with explicit permission pairs and reversibility framing (Section 14; Section 15 reversibility framework)

The workflow performs irreversible `mv` operations but carries no formal permission boundary. Adding `<take_freely>` and `<confirm_with_user>` sub-tags makes the safety model machine-readable and auditable, and aligns the file with the rest of the GSD workflow corpus.

### 3. Migrate structural tags to canonical vocabulary (Section 4, Action 2)

Replace `<step name="...">` with `<phase id="..." name="...">`, rename `<required_reading>` to `<context>`, and add `trigger` attributes to gate the archive phase on user confirmation. Standardizing the vocabulary makes this workflow interoperable with any orchestration tooling that reads canonical GSD phase structure.

### 4. Add an `<output_format>` block and fix the final report template (Section 7, Action 1; Section 22, Pattern 3)

The current report step is a loose template. Replace it with a binding `<output_format>` block that specifies the exact format, field order, and "no preamble" constraint. This prevents the agent from producing verbose wrap-up text when only the archive summary is needed.

### 5. Relocate the text-mode instruction to a `<system_note>` block and standardize template variable syntax (Section 11, Action 3; Section 13 template variable injection)

Two small fixes that are straightforward to make together: (a) move the inline text-mode block out of the dry-run step into a top-level `<system_note>`; and (b) change version placeholders from `{X.Y}` to `${X.Y}` for consistency with the guide's canonical `${VARIABLE_NAME}` interpolation syntax.
