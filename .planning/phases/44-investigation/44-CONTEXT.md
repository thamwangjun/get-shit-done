# Phase 44: Investigation - Context

**Gathered:** 2026-05-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Produce a structured root cause analysis of compliance failures across all three GSD layers (commands, workflows, agents). The deliverable is `44-FINDINGS.md` — a document specific enough that Phase 45, 46, and 47 implementers can look up which files need changes without additional investigation.

This phase reads and analyzes files; it does not modify any prompt content files.

</domain>

<decisions>
## Implementation Decisions

### Findings Artifact
- **D-01:** Output is a single file: `.planning/phases/44-investigation/44-FINDINGS.md`
- **D-02:** Structure: root cause summary section + one section per failure mode taxonomy category (each with a concrete file:line evidence example) + flat enumeration tables of all affected files per layer
- **D-03:** The enumeration tables are the primary output for Phase 45/46/47 — they serve as checklists so downstream phases know exactly which files to touch

### !cat Audit Scope (INVEST-03)
- **D-04:** Actual `!`cat`` count is **55 out of 67 command files** — the "72" estimate in REQUIREMENTS.md is inaccurate and should be corrected in the findings
- **D-05:** `complete-milestone.md` uses `@`-reference notation instead of `!`cat`` — investigate whether this was a missed conversion from a prior migration pass; include in the count if the investigation finds it was supposed to be converted
- **D-06:** The 9 commands with no `<execution_context>` block at all (ns-*, graphify, review-backlog, workstreams) are likely intentional namespace dispatchers — document as "not affected" with rationale
- **D-07:** `discuss-phase.md` uses lazy `Read` inside `<process>` (no `!cat`) and `surface.md` uses direct state file refs — document both as "not affected by truncation"

### Investigation Execution Model
- **D-08:** Execute as a single-plan task via `/gsd-quick` — the investigation is a contained research task requiring no parallelization
- **D-09:** The plan produces `44-FINDINGS.md` and updates STATE.md; execution is a single agent reading files and writing the output

### Evidence Granularity
- **D-10:** For each of the five failure mode taxonomy categories: provide one concrete file:line example per affected layer (commands, workflows, agents), then enumerate ALL affected files in a flat table
- **D-11:** "At least one example per failure mode" is the success criteria minimum — but downstream phases need the full enumeration table to act without re-investigating
- **D-12:** Comprehensive per-file analysis is out of scope; the enumeration table is a file list, not a per-file annotation

### Claude's Discretion
- The exact format of enumeration tables (columns, grouping) is Claude's choice — optimize for downstream agent readability
- Whether to include a "Root Causes" summary section above the taxonomy categories is Claude's call

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and Roadmap
- `.planning/REQUIREMENTS.md` — INVEST-01, INVEST-02, INVEST-03, CMD-01 through CMD-04, WF-01 through WF-04, AGENT-01 through AGENT-02 definitions
- `.planning/ROADMAP.md` §Phase 44 — Success criteria (4 items) that determine when Phase 44 is complete

### Fork Standards (defines the quality bar violations are measured against)
- `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md` — PEG V10 Section 6 (orchestrator reframe pattern), Section 16 (required_steps universal="true" pattern)
- `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md` — Condensed checklist used during fork modification passes
- `.planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md` — Authoritative record of all fork-vs-upstream change categories; contains the upstream merge checklist

### Files to Audit
- `commands/gsd/` — 67 command files; 55 use `!cat` injection
- `get-shit-done/workflows/` — 90 workflow files
- `agents/` — 33 agent files

</canonical_refs>

<code_context>
## Existing Code Insights

### `!cat` Injection Pattern
- 55 of 67 command files inject workflow content via `!\`cat $HOME/.claude/get-shit-done/workflows/<name>.md\`` inside `<execution_context>` blocks
- All injected workflows are well above 2KiB (execute-phase.md = 82KB, plan-phase.md = 82KB, discuss-phase.md = 27KB) — all are subject to truncation
- Claude Code shows a truncated preview (~2KiB) and a "Full output saved to: …" notice that Claude then ignores

### @-Reference Exemption
- `complete-milestone.md` uses `@~/.claude/get-shit-done/workflows/complete-milestone.md` — this loads the full file via the `@`-reference mechanism (not a shell command truncated by terminal output capture)
- Investigate: was this intentionally not converted, or a missed conversion from a prior pass?

### Commands with No Workflow Loading
- 9 files (ns-*, graphify, review-backlog, workstreams) have no `<execution_context>` block — these are thin dispatchers or special-purpose commands
- `surface.md` and `discuss-phase.md` have `<execution_context>` but use alternative loading patterns

### Workflow Size Distribution
- Largest: execute-phase.md (82KB), plan-phase.md (82KB), new-project.md (54KB)
- 86 of 90 workflows exceed 2KiB — all are effectively truncated when injected via `!cat`

</code_context>

<specifics>
## Specific Ideas

- The "72" vs "55" discrepancy in INVEST-03 needs to be surfaced clearly in the findings so Phase 45's CMD-04 target count is accurate
- The `complete-milestone.md` @-reference investigation is a bounded sub-task within INVEST-03
- PEG V10 Section 6 (orchestrator reframe) and Section 16 (required_steps) are the specific patterns Phase 46 and 47 will apply — FINDINGS.md should cite these by section when classifying failure modes

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 44-Investigation*
*Context gathered: 2026-05-28*
