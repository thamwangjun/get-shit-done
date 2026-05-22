# Critique: reapply-patches.md

## Summary

`reapply-patches.md` is a well-structured, clearly scoped workflow with a coherent step sequence and good use of XML tags. Its strongest areas are constraint enforcement (explicit permission pairs), a clear process narrative, and a quality bar that doubles as a success checklist. However, it falls short on several guide fundamentals: there is no persona that constrains voice or register beyond a generic role label, the `<task>` block is one run-on sentence that conflates four actions without audience or quality signals at the right structural level, the step elements use a bespoke `<step name="">` pattern rather than the canonical `<phase id="" name="">` tags, negative framing appears in the merge strategy, and no output format is specified with a concrete example. The workflow would benefit most from converting its step wrappers to canonical phase tags, adding a concrete conflict-resolution output example, and splitting the task sentence into atomic task/audience/quality_bar fields.

---

## Strengths

- **Section 14 — Explicit permission pairs.** The `<permitted>` / `<reserved_for_human_review>` split is correctly applied and each side is enumerated concretely, matching the guide's requirement to "pair every restriction with what IS permitted, stated equally concretely."

- **Section 16 — Scenario-based branching.** The merge strategy enumerates three prioritized, mutually exclusive cases (Identical / Clean merge / Conflict) with explicit conditions for each, directly matching the guide's scenario-based branching pattern.

- **Section 8 — Context placement.** The `<context>` block explains the upstream problem (GSD clean-install behavior) without bloating it. Background knowledge is correctly placed in the middle, not at the start or end.

- **Section 1 Action 1 — Quality bar present.** A `<quality_bar>` block exists and enumerates four behavioral invariants, satisfying the guide's requirement that a quality bar be explicit in the prompt.

- **Section 4 Action 2 — XML tags used for sections.** The prompt uses semantically named XML tags (`<task>`, `<persona>`, `<context>`, `<constraints>`, `<process>`, `<quality_bar>`, `<success_criteria>`) consistently throughout.

- **Section 5 — Conditional instructions present.** The TEXT_MODE flag and its behavioral effect are stated as an explicit `if … then` conditional at the top of the `<process>` block, matching the guide's conditional-branching pattern.

---

## Issues

### Issue 1 — Persona is generic, not register-constraining (Section 6 Action 2)

**Principle:** A persona must constrain register, voice, or domain-specific style to be effective. Generic expert framing ("You are a patch-reapply coordinator…") produces no measurable accuracy gain.

**What's wrong:** The current persona states a role title and lists three job responsibilities, but does not constrain voice, tone, or decision-making style. It reads like a job description, not a behavioral bias.

**Concrete fix:**

```xml
<persona>
You are a careful merge coordinator. Write in plain, direct prose. When presenting conflicts,
lead with the specific section that differs — not general context. Prefer minimal explanations
over comprehensive ones: the user knows their codebase.

Your strengths:
- Detecting the diff between two file versions at the section level
- Presenting conflict choices without editorializing
- Writing merged results that preserve original formatting and indentation
</persona>
```

---

### Issue 2 — `<task>` block conflates four actions in one sentence; audience is absent (Section 1 Actions 1–2)

**Principle:** Extract three task components — what, why, and quality bar — and identify audience explicitly. These belong as separate structural elements.

**What's wrong:** The `<task>` block is a single compound sentence ("read both versions, merge the user's changes, resolve conflicts interactively, write the merged result, then report final status"). This conflates task definition with process steps, omits the audience entirely, and duplicates content already in `<process>`. The `<quality_bar>` exists but is not co-located with the task statement; `<audience>` is missing entirely.

**Concrete fix:**

```xml
<task>
Merge locally backed-up GSD file modifications into the newly installed GSD version,
resolving conflicts interactively, and report final status per file.
</task>

<audience>
A developer who has installed a GSD update and wants their local workflow customizations
preserved. They understand git diff semantics and can make conflict-resolution decisions
without hand-holding.
</audience>
```

Move the existing `<quality_bar>` to immediately follow `<audience>` so all three task components are co-located at the top.

---

### Issue 3 — Step wrappers use non-canonical tag pattern; phases have no trigger attributes (Section 16 — The phase pattern)

**Principle:** For complex multi-step tasks, organize into explicit named phases using `<phase id="" name="" trigger="">` XML tags. The guide defines `<phase>` as the canonical tag; `<step name="">` is not part of the shared vocabulary.

**What's wrong:** All five process steps use `<step name="…">` tags. The guide's canonical tag is `<phase id="N" name="…">` with an optional `trigger` attribute. Without `id` attributes, the phases cannot be unambiguously referenced in the report table or success checklist. The `cleanup_offer` and `report` phases have no trigger condition specified, which leaves sequencing implicit.

**Concrete fix:** Replace `<step name="…">` with `<phase id="N" name="…">` throughout. Add trigger attributes on phases that depend on prior completion:

```xml
<phase id="1" name="locate_patches"> … </phase>
<phase id="2" name="show_summary" trigger="after_patches_located"> … </phase>
<phase id="3" name="merge_files" trigger="after_summary_shown"> … </phase>
<phase id="4" name="cleanup_offer" trigger="after_all_merges_complete"> … </phase>
<phase id="5" name="report" trigger="after_cleanup_decision"> … </phase>
```

---

### Issue 4 — Conflict presentation uses negative framing ("--- Your version ---") and lacks a concrete output example (Sections 5 Action 1 and 22 Pattern 3)

**Principle:** Convert negative instructions to positive equivalents. Output format must be specified completely and upfront, with a concrete example (Section 22 Pattern 3).

**What's wrong:** The conflict block uses `---` delimiters with labels "Your version" and "New upstream version," which is informal and fragile — markdown renderers may interpret `---` as a horizontal rule. More critically, no concrete example of a resolved conflict output is provided, which means the model must infer what the merged result looks like when the user chooses "Keep both."

**Concrete fix:** Replace the delimiter format with XML tags and add a concrete example:

```xml
<conflict_presentation>
Present each conflicting section using this format:

```
Conflict in {file_path} — section: {section_heading}

<user_version>
{user_section_text}
</user_version>

<upstream_version>
{upstream_section_text}
</upstream_version>
```

After the user chooses "Keep both (append mine after upstream)", write:

```
{upstream_section_text}

<!-- Local addition: preserved from your patch -->
{user_section_text}
```
</conflict_presentation>
```

---

### Issue 5 — No `<output_format>` block; success checklist duplicates quality bar (Sections 7 and 11 Action 3)

**Principle:** Output format must be specified completely and upfront as a dedicated `<output_format>` block (Section 7, Section 22 Pattern 3). Each instruction should appear in exactly one location (Section 11 Action 3).

**What's wrong:** The final report format is specified inline inside `<step name="report">` as a bare code block, not in a dedicated `<output_format>` block. Additionally, `<quality_bar>` and `<success_criteria>` overlap substantially — both list "no file overwritten without merge comparison first" and "cleanup only on user confirmation." This creates duplicate instructions that the guide explicitly flags as noise.

**Concrete fix:** Add a top-level `<output_format>` block that specifies both the summary table (phase 2) and the final report table (phase 5) with filled-in examples. Consolidate `<quality_bar>` and `<success_criteria>` into one block and remove the overlap:

```xml
<output_format>
Phase 2 — summary table (before any writes):

| # | File | Status |
|---|------|--------|
| 1 | get-shit-done/workflows/foo.md | Pending |

Phase 5 — final report:

| # | File | Status |
|---|------|--------|
| 1 | get-shit-done/workflows/foo.md | Merged |
| 2 | commands/gsd/bar.md | Skipped (already upstream) |
| 3 | gsd-agent-baz.md | Conflict resolved — kept upstream |

End with: "{count} file(s) processed. Your local modifications are active."
</output_format>
```

Remove `<success_criteria>` entirely; its content is fully covered by the updated `<quality_bar>`.

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide. Items marked N/A are not applicable to this workflow type (it is not a classification, RAG, or optimization prompt).

### Task Specification
| Item | Score | Note |
|------|-------|------|
| Intent, audience, and quality bar are all explicit | FAIL | Audience (`<audience>`) is absent |
| All constraints are compatible — no conflicts | PASS | |

### Chain of Thought
| Item | Score | Note |
|------|-------|------|
| CoT included only for appropriate task types | N/A | No CoT trigger needed |
| Reasoning elicited before answer | N/A | |
| CoT traces treated as heuristic | N/A | |

### Few-Shot Examples
| Item | Score | Note |
|------|-------|------|
| Examples selected by semantic similarity | N/A | No few-shot examples |
| 2–5 examples total | FAIL | Zero examples; at least one conflict-resolution example is warranted (Section 22 Pattern 3) |
| Ordered simple → complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format consistent across examples | N/A | |
| Example order fixed across evaluation runs | N/A | |

### Formatting
| Item | Score | Note |
|------|-------|------|
| Instruction complete and clear before formatting | PASS | |
| Prompt sections separated by semantically named XML tags | PASS | |
| At least 3 format variants tested on target model | N/A | Workflow file, not a benchmark prompt |

### Instruction Framing
| Item | Score | Note |
|------|-------|------|
| Negative instructions converted to positive equivalents | FAIL | "without first completing the merge comparison" is a negative constraint; `---` delimiter framing is informal |
| Priority order explicit when multiple criteria apply | PASS | Merge strategy uses "apply in priority order" with numbered cases |
| Tie-breaking rules match domain's cost asymmetry | FAIL | No explicit tie-breaking rule; if a clean merge is ambiguous, behavior is undefined |

### Persona
| Item | Score | Note |
|------|-------|------|
| Persona included only for appropriate tasks | PASS | |
| Persona is specific (constrains voice/register) | FAIL | Generic role label; does not constrain register or decision style |
| Persona descriptor is gender-neutral | PASS | |

### Output Format
| Item | Score | Note |
|------|-------|------|
| Structured output tasks use reasoning-then-format | N/A | |
| Single-call JSON places reasoning fields first | N/A | |
| Constrained decoding only after free-form insufficient | N/A | |
| Machine-parsed output uses exact format specification | FAIL | No `<output_format>` block; table format is inline in a step, not top-level |

### Context Placement
| Item | Score | Note |
|------|-------|------|
| Task instruction at start of prompt | PASS | `<task>` leads |
| Primary document/input at end of prompt | N/A | Input is discovered at runtime, not embedded |
| Background context in the middle | PASS | `<context>` is mid-document |
| All irrelevant context removed | PASS | |
| Time-sensitive injected context labeled as snapshot | N/A | |

### Self-Consistency
| Item | Score | Note |
|------|-------|------|
| Applied only to single-correct-answer tasks | N/A | |
| Inference budget permits 15–20 samples | N/A | |

### Prompt Length
| Item | Score | Note |
|------|-------|------|
| Redundant instructions removed | FAIL | `<quality_bar>` and `<success_criteria>` duplicate each other |
| Long prompts compressed | N/A | Prompt is appropriately sized |
| RAG context is extracted passage only | N/A | |

### System / User Split
| Item | Score | Note |
|------|-------|------|
| Persistent instructions in system prompt | N/A | Workflow file; invoked as skill |
| Task-specific instructions in user prompt | N/A | |
| Each instruction appears in exactly one location | FAIL | Overlap between `<quality_bar>` and `<success_criteria>` |
| Safety-critical constraints have external validation | N/A | |

### Agent / Subagent
| Item | Score | Note |
|------|-------|------|
| Agent prompts are fully self-contained | PASS | All required context is embedded |
| All file paths in agent output are absolute | FAIL | Report table examples use relative paths (`{file_path}` with no absolute-path requirement stated) |
| Parallel agents launched in a single message block | N/A | |
| Adversarial probes specified for verification agents | N/A | |

### Structural Architecture
| Item | Score | Note |
|------|-------|------|
| Large prompts decomposed into single-responsibility modules | PASS | This file handles one concern |
| Template variables use `${VARIABLE_NAME}` syntax | PASS | `$ARGUMENTS` and `$HOME` used correctly |
| Modules compose at runtime via variable substitution | N/A | |

### Constraint Enforcement
| Item | Score | Note |
|------|-------|------|
| Every restriction paired with equally concrete permission | PASS | |
| Hard exclusion lists enumerated, not qualitative | N/A | No exclusion list needed |
| Known edge cases have precedent-style rulings | FAIL | No ruling for edge case: what if `backup-meta.json` is corrupt or missing a baseline? |
| Confidence thresholds are numeric | N/A | |

### Decision Frameworks
| Item | Score | Note |
|------|-------|------|
| Multi-option recommendations use decision tree or table | PASS | Merge strategy is a prioritized decision list |
| Criteria checklists gate complex approaches | N/A | |
| Action permissions framed around reversibility | PASS | `<reserved_for_human_review>` covers irreversible actions |

### Multi-Phase Workflows
| Item | Score | Note |
|------|-------|------|
| Complex tasks organized into explicit named phases | FAIL | Uses `<step name="">` instead of canonical `<phase id="" name="">` |
| Required steps distinguished from type-specific steps | PASS | Merge strategy distinguishes universal vs. conditional paths |
| Scenario-based branching handles multiple paths explicitly | PASS | Three merge scenarios enumerated with conditions |

### Memory and Continuity
| Item | Score | Note |
|------|-------|------|
| Memory templates use XML tags as section labels | N/A | |
| Compaction summaries include discoveries and failed approaches | N/A | |
| Next steps tied to user's most recent explicit request | N/A | |

### Modularity
| Item | Score | Note |
|------|-------|------|
| Each prompt component has a single responsibility | PASS | |
| Scope boundaries state both inclusions and exclusions | FAIL | `<constraints>` states what is permitted and reserved, but no `<scope>` block with explicit exclusions (e.g., "this workflow does not handle binary files") |

### Safety and Trust
| Item | Score | Note |
|------|-------|------|
| Validation at system boundaries only | PASS | |
| Dual-use capabilities state permissions before restrictions | PASS | `<permitted>` leads `<reserved_for_human_review>` |
| Authorization is narrow-scoped; each action confirmed | PASS | Cleanup is gated behind explicit user confirmation |

### Tone and Style
| Item | Score | Note |
|------|-------|------|
| Size constraints use numeric limits, not qualitative | N/A | No size constraints needed |
| Instructions use imperative present tense | PASS | Steps use imperative constructions throughout |
| Working notes in analysis tags, not user-facing output | N/A | |

### Optimization
| Item | Score | Note |
|------|-------|------|
| Prompt flagged as draft for automated optimization | N/A | Workflow file, not a benchmark prompt |
| Correct optimizer selected | N/A | |
| Held-out test set reserved | N/A | |

---

## Recommendations

Prioritized by impact on model reliability:

1. **Add `<audience>` and restructure `<task>` (Section 1 Actions 1–2, HIGH).** The missing audience tag means the model has no signal about how much explanation to give during conflict resolution. A developer who understands diff semantics needs terse output; an end user needs more guidance. Add the `<audience>` block (see Issue 2 fix) and simplify `<task>` to a single declarative sentence.

2. **Convert `<step>` tags to canonical `<phase id="" name="" trigger="">` tags (Section 16, HIGH).** This is the guide's defined vocabulary for multi-phase workflows. Using `<step name="">` creates a non-standard tag that downstream parsing or orchestration tooling will not recognize. Apply the five-phase rename (see Issue 3 fix).

3. **Add a top-level `<output_format>` block with a filled example (Section 22 Pattern 3, HIGH).** The final report table is the only output the user sees at the end of the workflow. Without a concrete example showing all three status variants (Merged / Skipped / Conflict resolved), the model must infer the format from the inline code block inside the step. Promote this to a dedicated `<output_format>` block and include a realistic filled-in example (see Issue 5 fix).

4. **Strengthen the persona to constrain register and enumerate strengths (Section 6 Action 2, MEDIUM).** The current persona is a role label, not a behavioral constraint. Replace it with a register-constraining persona plus a strengths list biased toward diff analysis and terse conflict presentation (see Issue 1 fix).

5. **Add a precedent ruling for a corrupt or incomplete `backup-meta.json` (Section 14 — Precedents, LOW).** The locate-patches step handles the case where the directory is absent, but not the case where the file exists but is malformed or lacks a baseline entry. A single precedent ruling ("If a file entry in backup-meta.json has no baseline recorded, treat the backed-up version as the baseline and perform a two-way merge") prevents undefined behavior in this edge case.
