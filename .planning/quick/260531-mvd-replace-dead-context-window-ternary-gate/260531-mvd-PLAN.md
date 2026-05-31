---
phase: quick-260531-mvd
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [get-shit-done/workflows/execute-phase.md]
autonomous: true
requirements: [QUICK-260531-mvd]
must_haves:
  truths:
    - "No ${CONTEXT_WINDOW ...} ternary or bash variable remains anywhere in execute-phase.md"
    - "Cross-phase context entries (CONTEXT.md, RESEARCH.md, prior-wave SUMMARY.md) are ALWAYS listed in executor and verifier files_to_read blocks"
    - "executor-examples.md is always loaded in the executor <execution_context> and documented in <reference_usage>"
    - "Legitimate substitution vars (${phase_dir}, ${prior_wave_summaries}, ${AGENT_SKILLS}, ${VERIFIER_SKILLS}) are preserved verbatim"
    - "npm test passes and no {%~ eta syntax is introduced"
  artifacts:
    - path: "get-shit-done/workflows/execute-phase.md"
      provides: "Need-based reference loading replacing dead context-window ternary gates"
  key_links: []
---

<objective>
Remove dead `${CONTEXT_WINDOW ... ? ... : ...}` ternary gates from `get-shit-done/workflows/execute-phase.md` and replace context-window-based gating with need-based (functionality-based) reference loading.

Purpose: These ternaries are dead code — neither eta (tag is `<%= %>`, renders with empty data) nor Claude Code substitution evaluates JS ternaries, so they sit as literal text. Removing them eliminates a confusing anti-pattern and makes cross-phase context always available.
Output: Edited `execute-phase.md` with all five ternary sites replaced; legitimate substitution variables preserved.
</objective>

<context>
The orchestrator already investigated and confirmed every decision with the user. The five change sites are pre-identified and exact. Do NOT re-explore or invent alternatives — apply the changes as specified.

Distinction (confirmed): plain substitution variables (`${phase_dir}`, `${plan_file}`, `${prior_wave_summaries}`, `${AGENT_SKILLS}`, `${VERIFIER_SKILLS}`) are LEGITIMATE orchestrator prompt-building variables — preserve them verbatim. Only the CONDITIONAL ternaries (`${CONTEXT_WINDOW ... ? ... : ...}`) are dead code to remove.

@~/.claude/get-shit-done/references/executor-examples.md
@~/.claude/get-shit-done/references/planner-antipatterns.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove CONTEXT_WINDOW bash variable and replace tiering block with need-based note</name>
  <files>get-shit-done/workflows/execute-phase.md</files>
  <read_first>
    - get-shit-done/workflows/execute-phase.md (lines 122-145 — the CONTEXT_WINDOW intro, bash block, and the two tiering paragraphs)
  </read_first>
  <action>
Apply CHANGE 1 and CHANGE 2 at the top of the file (~lines 124-139).

CHANGE 1 — Delete the intro line "Read context window size for adaptive prompt enrichment:" together with its fenced bash block:
```bash
CONTEXT_WINDOW=$($GSD_SDK query config-get context_window 2>/dev/null || echo "200000")
```
Remove the intro, the fence, and the variable assignment entirely. Confirmed safe: after this plan CONTEXT_WINDOW is referenced nowhere else.

CHANGE 2 — Replace the two tiering paragraphs (starting "When `CONTEXT_WINDOW >= 500000`" and "When `CONTEXT_WINDOW < 200000`", through the "~40% while preserving behavioral correctness" bullet) with a concise NEED-BASED reference-loading note in affirmative fork style. The replacement states:

A short paragraph: Cross-phase context files (prior-wave SUMMARY.md, phase CONTEXT.md/RESEARCH.md, REQUIREMENTS.md) are listed in each subagent's files_to_read and read at execution start — they are now always provided, not context-window gated. Reference files load on demand by need, not by model size.

Followed by exactly 2 bullets:
- Executors consult `@~/.claude/get-shit-done/references/executor-examples.md` when handling a deviation from the plan or executing a task that carries a checkpoint (the file holds extended deviation-rule and checkpoint examples).
- Planners consult `@~/.claude/get-shit-done/references/planner-antipatterns.md` when checking a plan for anti-patterns or tightening task specificity (the file holds extended anti-pattern lists and specificity examples).

Keep it tight (short paragraph + 2 bullets). Do NOT mention CONTEXT_WINDOW, 200000, or 500000 anywhere. Use affirmative framing (state correct behavior, no "do not / never / avoid"). Introduce no `{%~` eta syntax.
  </action>
  <verify>
    <automated>command grep -nE '\$\{CONTEXT_WINDOW' get-shit-done/workflows/execute-phase.md; test -z "$(command grep -nE '\$\{CONTEXT_WINDOW' get-shit-done/workflows/execute-phase.md)" && echo NO_TERNARY_NEAR_TOP</automated>
  </verify>
  <done>The CONTEXT_WINDOW bash variable and intro are gone; the tiering block is replaced by a short need-based note (paragraph + 2 bullets) referencing executor-examples.md and planner-antipatterns.md; no mention of CONTEXT_WINDOW/200000/500000 in this region.</done>
</task>

<task type="auto">
  <name>Task 2: Drop ternary wrappers in executor/verifier blocks; document executor-examples.md</name>
  <files>get-shit-done/workflows/execute-phase.md</files>
  <read_first>
    - get-shit-done/workflows/execute-phase.md (lines 613-643 — executor execution_context, reference_usage, files_to_read)
    - get-shit-done/workflows/execute-phase.md (lines 1392-1403 — verifier files_to_read)
  </read_first>
  <action>
Apply CHANGE 3, CHANGE 4, CHANGE 5, and the reference_usage addition. Note line numbers shift after Task 1's deletions — locate by surrounding text, not absolute line.

CHANGE 3 — In the executor `<execution_context>` block, replace the line:
```
       ${CONTEXT_WINDOW < 200000 ? '' : '@~/.claude/get-shit-done/references/executor-examples.md'}
```
with a plain always-load @-ref matching its sibling refs (the `@~/.claude/...summary.md`, `checkpoints.md`, `tdd.md` lines above it):
```
       @~/.claude/get-shit-done/references/executor-examples.md
```
Match the existing indentation of the sibling @-ref lines exactly.

CHANGE 4 — In the executor `<files_to_read>` block, drop the ternary wrapper around the three CONTEXT/RESEARCH/prior-wave entries. Replace:
```
       ${CONTEXT_WINDOW >= 500000 ? `
       - ${phase_dir}/*-CONTEXT.md (User decisions from discuss-phase — honors locked choices)
       - ${phase_dir}/*-RESEARCH.md (Technical research — pitfalls and patterns to follow)
       - ${prior_wave_summaries} (SUMMARY.md files from earlier waves in this phase — what was already built)
       ` : ''}
```
with the three plain bullet lines (no wrapper, no `: ''}`), preserving the `${phase_dir}` and `${prior_wave_summaries}` substitution variables verbatim and matching the indentation of the sibling `-` bullets:
```
       - ${phase_dir}/*-CONTEXT.md (User decisions from discuss-phase — honors locked choices)
       - ${phase_dir}/*-RESEARCH.md (Technical research — pitfalls and patterns to follow)
       - ${prior_wave_summaries} (SUMMARY.md files from earlier waves in this phase — what was already built)
```

CHANGE 5 — In the verifier `<files_to_read>` block, drop the ternary wrapper. Replace:
```
${CONTEXT_WINDOW >= 500000 ? `- {phase_dir}/*-CONTEXT.md (User decisions — verify they were honored)
- {phase_dir}/*-RESEARCH.md (Known pitfalls — check for traps)
- Prior VERIFICATION.md files from earlier phases (regression check)
` : ''}
```
with the three plain bullet lines (no wrapper):
```
- {phase_dir}/*-CONTEXT.md (User decisions — verify they were honored)
- {phase_dir}/*-RESEARCH.md (Known pitfalls — check for traps)
- Prior VERIFICATION.md files from earlier phases (regression check)
```

reference_usage addition — In the executor `<reference_usage>` block (the one documenting checkpoints.md / summary.md / tdd.md), ADD a new paragraph matching the existing prose style for executor-examples.md:
Consult `~/.claude/get-shit-done/references/executor-examples.md` when handling a deviation from the plan or executing a checkpoint-bearing task — it provides worked deviation-rule and checkpoint examples.

Use affirmative framing. Introduce no `{%~` eta syntax. Preserve all surrounding frontmatter and substitution variables exactly.
  </action>
  <verify>
    <automated>test -z "$(command grep -nE '\$\{CONTEXT_WINDOW' get-shit-done/workflows/execute-phase.md)" && test -z "$(command grep -n '{%~' get-shit-done/workflows/execute-phase.md)" && command grep -c 'executor-examples.md' get-shit-done/workflows/execute-phase.md && npm test 2>&1 | tail -20</automated>
  </verify>
  <done>All three ternary wrappers are removed; the three CONTEXT/RESEARCH/prior-wave entries are always listed in both executor and verifier files_to_read; executor-examples.md is always loaded and documented in reference_usage; `${phase_dir}`, `${prior_wave_summaries}`, `${AGENT_SKILLS}`, `${VERIFIER_SKILLS}` preserved verbatim; `command grep -nE '\$\{CONTEXT_WINDOW'` returns nothing; no `{%~` introduced; npm test passes.</done>
</task>

</tasks>

<verification>
- `command grep -nE '\$\{CONTEXT_WINDOW' get-shit-done/workflows/execute-phase.md` returns NOTHING.
- `command grep -n '{%~' get-shit-done/workflows/execute-phase.md` returns NOTHING (eta `{%~` is banned).
- Legitimate substitution vars still present: `command grep -nE '\$\{(phase_dir|prior_wave_summaries|AGENT_SKILLS|VERIFIER_SKILLS)' get-shit-done/workflows/execute-phase.md` returns matches.
- `npm test 2>&1 | tail -20` passes (agent-frontmatter and eta-template-syntax suites included).
</verification>

<success_criteria>
- Only `get-shit-done/workflows/execute-phase.md` modified.
- All five ternary sites replaced per spec; need-based note added near top.
- executor-examples.md always loaded + documented in reference_usage.
- No CONTEXT_WINDOW reference, no `{%~`, frontmatter intact, npm test green.
</success_criteria>

<output>
No SUMMARY.md path change — standard quick-task close-out.
</output>
