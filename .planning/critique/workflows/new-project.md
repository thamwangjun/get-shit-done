# Critique: new-project.md

## Summary

`new-project.md` is a sophisticated, production-grade workflow that handles a genuinely complex multi-phase, multi-agent orchestration task. Its structural foundations are strong: explicit phases, named subagents, clear branching, and XML-tagged sections are all present. However, the workflow has a persistent gap between its orchestrator-level instructions and the agent prompts it spawns. The subagent Task() calls are underspecified — they lack quality bars, audience declarations, and output format contracts — which contradicts the workflow's own quality gates. Several instructions remain negatively framed or qualitatively worded where the guide demands positive and numeric specifications. The `<purpose>` block at the top is unusually strong for an orchestrator file but leaves the audience and quality bar implicit. Addressing the subagent prompt completeness issues would have the highest impact.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase pattern applied correctly.** The workflow is organized into numbered, named steps (Setup, Brownfield Offer, Deep Questioning, Write PROJECT.md, etc.) that create clear cognitive boundaries. Each step completes before the next begins, which is the core intent of the phase pattern.

- **Section 16 — Scenario-based branching implemented.** Multiple explicit conditional paths are handled: auto mode vs. interactive mode, brownfield vs. greenfield, research vs. skip research, prior spike/sketch detection, sub-repo detection, and roadmap approval loops. This is precisely the scenario-branching pattern from Section 16.

- **Section 17 (Agent and Subagent Patterns) — Parallel agent spawning in a single message block.** All 4 gsd-project-researcher agents are spawned in a single Task() block with explicit descriptions, model assignments, and subagent types. This satisfies the single-message parallelism requirement.

- **Section 4 (Formatting and Structure) — XML tags used for top-level sections.** `<purpose>`, `<required_reading>`, `<available_agent_types>`, `<auto_mode>`, `<process>`, `<output>`, and `<success_criteria>` are all semantically named XML tags, consistent with Section 4 Action 2.

- **Section 14 (Constraint Enforcement) — Hard exclusions on scope.** The requirements section defines Out of Scope with explicit reasoning per exclusion ("Exclusion 1 — why"), matching the guide's requirement for enumerated exclusion lists.

- **Section 19 (Modularity and Composition) — Template variable injection.** `${AGENT_SKILLS_RESEARCHER}`, `${AGENT_SKILLS_SYNTHESIZER}`, `${AGENT_SKILLS_ROADMAPPER}`, and `${ARGUMENTS}` are used correctly via the `${VARIABLE_NAME}` syntax, with dynamic injection at runtime.

- **Section 11 (System vs. User Prompt Allocation) — YAML frontmatter pattern not needed but config.json used as a structural equivalent.** All persistent agent configuration (model profiles, workflow toggles) is encapsulated in `.planning/config.json` rather than repeated inline, which is the spirit of the single-canonical-location rule.

- **Section 22 Pattern 3 — Output format specified for REQUIREMENTS.md.** The requirements section gives a concrete format example with REQ-ID schema (`[CATEGORY]-[NUMBER]`), checkboxes, and concrete good/bad requirement examples ("Handle authentication" → "User can log in..."), which is an effective application of Pattern 3.

- **Section 5 (Instruction Framing) — Conditional instructions used throughout.** The `If auto mode` / `If interactive mode` conditional branching is explicit and enumerated, avoiding ambiguity, consistent with the conditional instruction pattern in Section 5.

- **Section 16 — Round-based interview structure.** Deep Questioning (Step 3) follows a structured conversation pattern with explicit follow-up triggers, a decision gate ("Ready?"), and a loop-until-approval mechanism — matching the round-based interview pattern from Section 16.

---

## Issues

### Issue 1 — Subagent Task() prompts are not fully self-contained (Section 17)

**Principle:** Section 17 Action "Self-contained agent prompts" states that each agent prompt must include `<goal>`, `<unit_task>`, `<conventions>`, `<e2e_recipe>`, and `<worker_instructions>`. "Every agent receives its full operating instructions directly — context inheritance from the parent is unavailable."

**What's missing:** The 4 researcher Task() prompts contain `<research_type>`, `<milestone_context>`, `<question>`, `<files_to_read>`, `<downstream_consumer>`, `<quality_gate>`, and `<output>` — but no `<goal>` establishing the overall objective, no `<conventions>` for file/output format conventions, and no `<worker_instructions>`. The synthesizer prompt is even more sparse: it omits `<milestone_context>`, `<downstream_consumer>`, `<quality_gate>`, and `<conventions>`. The roadmapper prompt omits all of these except `<instructions>`.

**Concrete fix:** Add to each researcher Task() prompt:
```xml
<goal>
Initialize a new software project. This research phase produces four domain-specific
files that feed directly into requirements definition and roadmap creation.
</goal>
<conventions>
- Write in present tense, active voice
- Use markdown headers for sections
- All file paths are absolute
- Commit each file after writing using: gsd-sdk query commit "..."
</conventions>
```
Add a `<quality_bar>` to the synthesizer and roadmapper prompts defining what a complete output looks like.

---

### Issue 2 — Qualitative size constraints instead of numeric limits (Section 21 / Section 23 Tone and Style)

**Principle:** Section 21 states "Numbered limits beat qualitative descriptors. 'Brief' means different things; 'under 8 words' does not."

**What's missing:** The workflow uses qualitative constraints throughout:
- "brief description" (Step 7 feature options)
- "2–5 success criteria per phase" (Step 8 roadmapper instructions) — this one is numeric and good
- "brief web search" (Step 3 research-before-questions)
- "one option per detected directory" (Step 5.1) — no cap stated
- Success criteria in ROADMAP.md: "Derive 2-5 success criteria per phase" is correct, but "Return ROADMAP CREATED with summary" gives no format or length specification for the summary itself

**Concrete fix:** Replace qualitative terms with numeric bounds:
- "brief description" → "description: 5–10 words, active voice"
- "brief web search" → "1–3 web searches, surface at most 3 findings per topic"
- Roadmap summary return: add `<output_format>Return ROADMAP CREATED followed by: phase count, requirement count, one sentence per phase. Maximum 8 lines total.</output_format>`

---

### Issue 3 — Negative instructions not converted to positive equivalents (Section 5 Action 1)

**Principle:** Section 5 Action 1 requires that all "do not", "avoid", and "never" instructions be rewritten as positive specifications of desired behavior.

**What's missing:** Several instructions use prohibited negative framing:
- "Skip brownfield mapping offer (assume greenfield)" — conditional skip instruction rather than a positive "treat as greenfield"
- "Do not compress. Capture everything gathered." (Step 4) — contains a negative imperative
- "Don't suddenly switch to checklist mode." (Step 3) — direct negative instruction
- "Reject vague requirements." (Step 7) — while brief, this is a negative directive

**Concrete fix:**
- "Do not compress. Capture everything gathered." → "Write the full context as gathered. Include every requirement, decision, and nuance — completeness is the goal."
- "Don't suddenly switch to checklist mode." → "Weave remaining checklist gaps into the natural conversation flow."
- "Reject vague requirements." → "Require specificity: push until each requirement names a user action and a concrete outcome."

---

### Issue 4 — No explicit audience or quality bar in the `<purpose>` block (Section 1 Actions 1–2)

**Principle:** Section 1 Actions 1 and 2 require explicit audience encoding (domain knowledge, vocabulary level, relevant assumptions) and an explicit quality bar (what makes a good response). The canonical XML tags from Section 4 are `<audience>` and `<quality_bar>`.

**What's missing:** The `<purpose>` block describes the workflow's value proposition but contains no `<audience>` or `<quality_bar>`. The audience (a developer or product owner with a new project idea, interacting with an LLM agent) is implicit. The quality bar (what distinguishes a complete run from a failed run) is encoded only in `<success_criteria>` at the bottom — separated from the opening task specification by over 1,300 lines.

**Concrete fix:** Expand the `<purpose>` block:
```xml
<purpose>
Initialize a new project through unified flow: questioning, research (optional),
requirements, roadmap. This is the most leveraged moment in any project.
</purpose>

<audience>
The developer or product owner who invoked this workflow. They have a project idea
and want a structured plan. They may range from first-time builders to experienced
engineers. Treat vague inputs as starting points, not failures.
</audience>

<quality_bar>
A complete run produces: a committed PROJECT.md capturing full context, a config.json
with all workflow settings, REQUIREMENTS.md with REQ-IDs and scope decisions, and
ROADMAP.md with phases, requirement mappings, and success criteria. Every artifact
is committed. The user knows the next command.
</quality_bar>
```

---

### Issue 5 — Constraint enforcement lacks explicit permission pairs for subagent tool access (Section 14 / Section 22 Pattern 9)

**Principle:** Section 14 states "Pair every restriction with what IS permitted, stated equally concretely." Section 22 Pattern 9 states tool permissions should be scoped to the narrowest patterns satisfying the task.

**What's missing:** The subagent Task() calls do not include `<constraints>` blocks defining what the spawned agents may and may not do. There are no `<permitted>` / `<reserved_for_human_review>` pairs. The `gsd-project-researcher` agents are instructed to write files and commit, but no constraint block guards against destructive operations (e.g., overwriting existing research). Similarly, the roadmapper is told to "Write files immediately" with no constraint on overwriting an already-approved roadmap.

**Concrete fix:** Add a constraints block to each subagent prompt:
```xml
<constraints>
  <permitted>
    - Read any file listed in files_to_read
    - Write to the output path specified in the output section
    - Run read-only shell commands (ls, cat, find)
    - Commit the output file using gsd-sdk query commit
  </permitted>
  <reserved_for_human_review>
    - Overwriting files that already contain content
    - Deleting or renaming files
    - Writing to paths outside .planning/research/
  </reserved_for_human_review>
</constraints>
```

---

### Issue 6 — Deep Questioning step delegates technique to an external file without fallback (Section 17 / Section 8 Action 4)

**Principle:** Section 17 states "Each agent prompt must be fully self-contained when spawned." Section 8 Action 4 requires trimming context to what is directly relevant — but the inverse failure is also covered: relying on external context that may be unavailable.

**What's missing:** Step 3 says "Consult `questioning.md` for techniques" and lists topics (Challenge vagueness, Make abstract concrete, Surface assumptions, Find edges, Reveal motivation). This is a reference to an external file that is not guaranteed to be in context when the workflow runs. If `questioning.md` is not loaded, the agent has no guidance on questioning technique.

**Concrete fix:** Inline the core questioning techniques as an abbreviated list directly in Step 3, then reference `questioning.md` for extended detail:
```
Apply these techniques (extended guidance in questioning.md if available):
- Challenge vagueness: ask for a specific example when the user uses abstract terms
- Make abstract concrete: "What would you click to do that?"
- Surface assumptions: "What are you assuming is already solved?"
- Find edges: "What happens when X doesn't exist yet?"
- Reveal motivation: "What problem made you want to build this?"
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide as applied to `new-project.md` as a workflow prompt file.

### Task Specification
| Item | Score | Notes |
|------|-------|-------|
| Intent, audience, and quality bar are all explicit in the prompt | FAIL | Intent is clear in `<purpose>`; audience and quality bar are absent |
| All constraints are compatible — no conflicts between scope, length, or depth | PASS | No detected constraint conflicts |

### Chain-of-Thought
| Item | Score | Notes |
|------|-------|-------|
| CoT is included only for math, symbolic reasoning, or multi-step logic tasks | N/A | This is a workflow orchestrator, not a reasoning prompt |
| CoT trigger used correctly | N/A | Not applicable |
| Reasoning elicited before the answer | N/A | Not applicable |
| CoT traces treated as heuristic aids | N/A | Not applicable |

### Few-Shot Examples
| Item | Score | Notes |
|------|-------|-------|
| Examples selected by semantic similarity | N/A | No few-shot examples in this workflow |
| 2–5 examples total | N/A | |
| Ordered simple → complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format consistent across all examples | PASS | Requirements good/bad examples are consistently formatted |
| Example order fixed across evaluation runs | N/A | |

### Formatting
| Item | Score | Notes |
|------|-------|-------|
| Instruction is complete and clear before formatting is applied | PASS | Each step's instruction is specified before its format |
| Prompt sections separated by semantically named XML tags | PASS | Top-level sections use correct XML vocabulary |
| At least 3 format variants tested on target model | FAIL | No evidence of format variant testing |

### Instruction Framing
| Item | Score | Notes |
|------|-------|-------|
| All negative instructions converted to positive equivalents | FAIL | "Do not compress", "Don't suddenly switch", "Reject vague requirements" remain negative |
| Priority order is explicit when multiple criteria apply | PASS | Auto mode vs. interactive mode precedence is clear throughout |
| Tie-breaking rules match the domain's cost asymmetry | FAIL | No tie-breaking rule for the deep questioning decision gate or requirements scoping |

### Persona
| Item | Score | Notes |
|------|-------|-------|
| Persona included only for open-ended or stylistic tasks | PASS | No persona is declared — appropriate for an orchestrator workflow |
| Persona is specific | N/A | |
| Persona descriptor is gender-neutral | N/A | |

### Output Format
| Item | Score | Notes |
|------|-------|-------|
| Structured output tasks use two-step reasoning-then-format approach | FAIL | Roadmapper and synthesizer subagent prompts have no reasoning step before output |
| Single-call JSON places reasoning fields before answer fields | N/A | No direct JSON output from this orchestrator |
| Constrained decoding adopted only after free-form proven insufficient | N/A | |
| Machine-parsed output uses exact format specification | PASS | `## ROADMAP CREATED` and `## ROADMAP BLOCKED` return tokens are exact |

### Context Placement
| Item | Score | Notes |
|------|-------|-------|
| Task instruction at the start of the prompt | PASS | `<purpose>` leads the file |
| Primary document or input at the end of the prompt | PASS | `<output>` and `<success_criteria>` close the file |
| Background context in the middle | PASS | Config detection, brownfield logic, and agent skill vars are in the middle |
| All irrelevant context removed | PASS | No obvious padding or tangential content |
| Time-sensitive injected context labeled as snapshot | N/A | No time-sensitive context injection at orchestrator level |

### Self-Consistency
| Item | Score | Notes |
|------|-------|-------|
| Self-consistency applied only to tasks with a single correct answer | N/A | Not applicable to this workflow type |
| Inference budget permits 15–20 samples | N/A | |

### Prompt Length
| Item | Score | Notes |
|------|-------|-------|
| Redundant instructions and repeated context removed | FAIL | Auto mode detection and config questions are duplicated across Steps 2a and 5; roadmapper `files_to_read` block appears in two Task() calls with near-identical content |
| Long prompts compressed before sending | N/A | Compression is a pipeline concern, not workflow-level |
| RAG context is extracted relevant passage only | N/A | |

### System / User Split
| Item | Score | Notes |
|------|-------|-------|
| Persistent instructions in system prompt | PASS | Persistent agent config goes to config.json, not repeated inline |
| Task-specific instructions in user prompt | PASS | Step-specific instructions are step-local |
| Each instruction appears in exactly one location | FAIL | Round 2 agent questions appear identically in both Step 2a and Step 5 |
| Safety-critical constraints have external validation | FAIL | No external validation guards on subagent file writes |

### Agent / Subagent
| Item | Score | Notes |
|------|-------|-------|
| Agent prompts are fully self-contained | FAIL | Researcher, synthesizer, and roadmapper prompts are missing goal, conventions, and worker_instructions sections |
| All file paths in agent output are absolute | PASS | Output paths are absolute (`.planning/research/STACK.md`, etc.) |
| Parallel agents launched in single message block | PASS | All 4 researchers launched in one block |
| Adversarial probes specified for verification agents | N/A | No verification agents in this workflow |

### Structural Architecture
| Item | Score | Notes |
|------|-------|-------|
| Large prompts decomposed into atomic modules | PASS | Agent skills are injected via `${AGENT_SKILLS_*}` variables rather than inlined |
| Template variables use `${VARIABLE_NAME}` syntax with fallback | FAIL | No fallback syntax (`${VAR||"default"}`) for any variable; if `AGENT_SKILLS_RESEARCHER` is empty, the prompt silently degrades |
| Modules compose at runtime via variable substitution | PASS | Correct pattern used throughout |

### Constraint Enforcement
| Item | Score | Notes |
|------|-------|-------|
| Every restriction paired with an equally concrete permission | FAIL | Subagent Task() calls contain no `<permitted>` / `<reserved_for_human_review>` pairs |
| Hard exclusion lists enumerated | PASS | Out of Scope section uses enumerated exclusions with reasoning |
| Known edge cases have precedent-style rulings | FAIL | No precedent rulings for edge cases (e.g., what happens if REQUIREMENTS.md already exists) |
| Confidence thresholds are numeric | N/A | No confidence-scored outputs in this workflow |

### Decision Frameworks
| Item | Score | Notes |
|------|-------|-------|
| Multi-option recommendations use explicit decision tree or comparison table | PASS | Round 1 / Round 2 agent comparison table is well-formed |
| Criteria checklists gate complex approaches | PASS | `<success_criteria>` and `<quality_gate>` blocks gate agent outputs |
| Action permissions framed around reversibility | FAIL | No reversibility framing on file-write and commit operations |

### Multi-Phase Workflows
| Item | Score | Notes |
|------|-------|-------|
| Complex tasks organized into explicit named phases | PASS | Steps 1–9 are named and sequenced |
| Required steps distinguished from type-specific steps | PASS | Auto mode vs. interactive mode branches are clearly separated |
| Scenario-based branching handles multiple paths explicitly | PASS | Brownfield, auto, greenfield, sub-repo, and research scenarios are all explicit |

### Memory and Continuity
| Item | Score | Notes |
|------|-------|-------|
| Memory templates use XML tags as section labels | PASS | PROJECT.md Evolution section and Key Decisions table are structured |
| Compaction summaries include discoveries and failed approaches | N/A | No compaction summary in this workflow |
| Next steps tied to user's most recent explicit request | PASS | Step 9 Done section ties the next command directly to the completed roadmap |

### Modularity
| Item | Score | Notes |
|------|-------|-------|
| Each prompt component has a single responsibility | PASS | Setup, Questioning, Requirements, Roadmap are separate steps |
| Scope boundaries state both inclusions and exclusions | FAIL | `<output>` lists inclusions only; no `<exclude>` stating what this workflow does NOT produce |

### Safety and Trust
| Item | Score | Notes |
|------|-------|-------|
| Validation at system boundaries only; internal interfaces trusted | PASS | External inputs (user answers, git state) are validated; internal SDK calls are trusted |
| Dual-use capabilities state permissions before restrictions | N/A | No dual-use capabilities |
| Authorization narrow-scoped; each action confirmed before expanding scope | FAIL | Interactive mode asks for roadmap approval but no equivalent gate exists for requirements commit or config.json write |

### Tone and Style
| Item | Score | Notes |
|------|-------|-------|
| Size constraints use numeric limits | FAIL | "brief description", "brief web search" are qualitative |
| Instructions use imperative present tense | PASS | "Spawn", "Read", "Create", "Display" — consistent imperative present tense throughout |
| Working notes in analysis tags, not user-facing output | PASS | Internal checks like "Check context (background, not out loud)" are correctly scoped |

### Optimization
| Item | Score | Notes |
|------|-------|-------|
| Prompt flagged as draft for automated optimization | FAIL | No optimization flag or note |
| Correct optimizer selected | N/A | |
| Held-out test set reserved | N/A | |

---

## Recommendations

Prioritized by impact on output quality and robustness.

### 1. Make subagent prompts fully self-contained (Section 17 / highest impact)

The 4 researcher prompts, the synthesizer prompt, and the roadmapper prompt all lack `<goal>`, `<conventions>`, and permission constraints. When these agents run, they have no fallback guidance if their specific section is ambiguous. Add a `<goal>` stating the overall project initialization objective, a `<conventions>` block covering file format, commit behavior, and path conventions, and a `<constraints>` block with explicit `<permitted>` / `<reserved_for_human_review>` pairs to each Task() call. This is the largest single correctness gap.

### 2. Add `<audience>` and `<quality_bar>` to the `<purpose>` block (Section 1 Actions 1–2)

The workflow's intent is clear but its audience and quality bar are implicit and buried. Move the quality bar from `<success_criteria>` (bottom) to a co-located `<quality_bar>` tag immediately after `<purpose>`. Add an `<audience>` tag. This gives any agent reading the workflow an immediate calibration point for what "done" means.

### 3. Deduplicate Round 2 agent questions (Section 11 Action 3)

The Research, Plan Check, Verifier, and AI Models questions appear identically in Step 2a (auto mode config) and Step 5 (interactive mode Round 2). This is a direct violation of Section 11 Action 3 ("Each instruction appears in exactly one location"). Extract the question definitions to a shared reference block and include them by reference in both steps, or consolidate the logic so the question block is defined once and invoked conditionally.

### 4. Convert remaining negative instructions to positive equivalents (Section 5 Action 1)

The three clearest violations are: "Do not compress. Capture everything gathered." (Step 4), "Don't suddenly switch to checklist mode." (Step 3), and "Reject vague requirements." (Step 7). Rewrite as positive specifications. This is low effort and removes a class of instruction that systematically underperforms its positive equivalent.

### 5. Add fallback syntax to template variable injections (Section 13)

All `${AGENT_SKILLS_*}` variables are used without fallback. If the SDK query returns empty, the subagent silently receives no skill guidance. Add `${AGENT_SKILLS_RESEARCHER||""}` at minimum, and consider a fallback string that provides bare-minimum guidance: `${AGENT_SKILLS_RESEARCHER||"You are a technical researcher. Produce specific, actionable findings."}`. This prevents silent prompt degradation in environments where skill files are not yet configured.
