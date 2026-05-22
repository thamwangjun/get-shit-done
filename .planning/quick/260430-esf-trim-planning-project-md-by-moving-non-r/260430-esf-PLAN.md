---
phase: quick-260430-esf
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/PROJECT.md
  - .planning/PROJECT_HISTORY.md
autonomous: true
requirements: [TRIM-01]
must_haves:
  truths:
    - "PROJECT.md contains only active-guidance content (What This Is, Core Value, Out of Scope, Active Requirements, Context, Constraints, Key Decisions with load-bearing rows only, Evolution)"
    - "PROJECT_HISTORY.md exists and contains all shipped milestones, the abandoned milestone, all validated requirements, and all historical-only Key Decisions rows"
    - "No information is lost — everything moved to PROJECT_HISTORY.md, nothing deleted"
  artifacts:
    - path: ".planning/PROJECT.md"
      provides: "Trimmed active project reference"
    - path: ".planning/PROJECT_HISTORY.md"
      provides: "Historical archive of shipped milestones, validated requirements, and settled decisions"
  key_links:
    - from: ".planning/PROJECT_HISTORY.md"
      to: ".planning/PROJECT.md"
      via: "Header note in PROJECT_HISTORY.md explaining its source"
---

<objective>
Trim .planning/PROJECT.md by moving historical information into a new .planning/PROJECT_HISTORY.md archive file.

Purpose: PROJECT.md has grown to include validated requirements from multiple completed milestones, shipped milestone delivery records, and implementation-detail Key Decisions that no longer guide future work. Moving these out keeps PROJECT.md focused on active guidance while preserving history.

Output: Slimmed PROJECT.md + new PROJECT_HISTORY.md
</objective>

<execution_context>
@/home/thamw/development/happier/get-shit-done/.planning/quick/260430-esf-trim-planning-project-md-by-moving-non-r/260430-esf-PLAN.md
</execution_context>

<context>
@/home/thamw/development/happier/get-shit-done/.planning/PROJECT.md
@/home/thamw/development/happier/get-shit-done/.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create PROJECT_HISTORY.md with all historical content</name>
  <files>.planning/PROJECT_HISTORY.md</files>
  <action>
Create `.planning/PROJECT_HISTORY.md` as a new file with the following structure and content extracted from PROJECT.md:

```
# GSD Fork — Project History

> This file is the historical archive extracted from `.planning/PROJECT.md`.
> It contains shipped milestones, the abandoned milestone, all validated requirements,
> and Key Decisions that have been fully settled and no longer guide future work.
> For active project state, see `.planning/PROJECT.md`.
```

Then include the following sections transferred verbatim from PROJECT.md:

1. **Abandoned Milestone: v1.37.1c Tag Hierarchy Completion** — the full section as it appears in PROJECT.md (header, Archived date, Goal, Completed before abandonment, Requirements dropped)

2. **Shipped Milestone: v1.37.1b Fork Tag Corpus Tests** — full section (header, Shipped date, Goal, Delivered bullets)

3. **Shipped Milestone: v1.37.1a Do-Not Framing Pass** — full section (header, Shipped date, Goal, Delivered bullets)

4. **Shipped Milestone: v1.37.1 Files** — full section (header, Shipped date, Goal, Delivered bullets)

5. **Validated Requirements** — the full `### Validated` subsection content (all 45 ✓ lines, preserving the header `### Validated`)

6. **Historical Key Decisions** — the Key Decisions rows that are purely historical implementation records and no longer load-bearing for future upstream merge work. Use the heading `## Historical Key Decisions` with a note: `> These decisions are archived because they were specific to completed implementation work. They no longer actively constrain future upstream merge cycles.`

   Rows to move (copy verbatim from the table in PROJECT.md):
   - "Use `spawnSync` (not `execSync`) for on-demand hooks build"
   - "`require('child_process')` scoped inside `ensureHooksDist` function body"
   - "Helper call site placed before the `if (!isCodex && ...)` block"
   - "Serial test isolation via `SERIAL_FILES` in run-tests.cjs"
   - "Outer `describe({ concurrency: false })` wrapper in test file"
   - "Retain `isNewer` function name with SHA equality body in worker"
   - "Replace GitHub API curl in install.js with `git rev-parse --short=7 HEAD`"
   - "Offline fallback writes `no-network` sentinel (not semver)"
   - "Clear `~/.cache/gsd/gsd-update-check.json` in update.md after successful update"
   - "UPD-01 accepted as partial at milestone close"
   - "FORK-CORRUPTION classification (vs UPSTREAM-INTRODUCED) at merge triage"
   - "`<role>` → `<persona>` rename for 24 agents"
   - "Dynamic `FILE_WRITING_AGENTS` list replacing hardcoded fork URL (WR-04)"
   - "MERGE-02 verification command accepted as stale at close"
   - "FRAMING-11 and FRAMING-12 deleted rather than rewritten"
   - "Scope corpus scan subtests by directory across two phases"
   - "`isConditionalOrFactual` improved with broader verb set and relative clause detection"
   - "`<objective>` → `<intent>` conversion for 33 command files"
   - "v1.37.1c milestone abandoned after Phase 20 (Baseline Audit only)"
   - "Global boilerplate replacement done in one sweep across all 13 affected agents"
   - "Modify tests when they conflict with fork standards, not revert fork changes"

   Format as a markdown table with the same columns (Decision | Rationale | Outcome) as in PROJECT.md.

End the file with:
```
---
*Archived from PROJECT.md — 2026-04-30*
```
  </action>
  <verify>
    <automated>test -f /home/thamw/development/happier/get-shit-done/.planning/PROJECT_HISTORY.md && echo "FILE EXISTS" || echo "MISSING"</automated>
  </verify>
  <done>PROJECT_HISTORY.md exists with a clear archive header, all four milestone sections, the full validated requirements list, and the historical Key Decisions table.</done>
</task>

<task type="auto">
  <name>Task 2: Trim PROJECT.md to active-guidance content only</name>
  <files>.planning/PROJECT.md</files>
  <action>
Rewrite `.planning/PROJECT.md` keeping only active-guidance content. The final file must contain these sections in this order:

1. `# GSD — Prompt-Engineered Fork` (title)

2. `## What This Is` — keep verbatim

3. `## Core Value` — keep verbatim

4. `## Active Requirements` — keep the section and its content: `(None — all requirements have been validated or moved to Out of Scope. See PROJECT_HISTORY.md for validated requirements.)` (update the pointer to reference PROJECT_HISTORY.md instead of "See Validated and Out of Scope sections below")

5. `## Requirements` subsection with only `### Active` (keep: "(None — all shipped requirements validated.)")  and `### Out of Scope` (keep verbatim). Remove `### Validated` subsection entirely from PROJECT.md — it is now in PROJECT_HISTORY.md.

6. `## Context` — keep verbatim. Update `Current state` bullet to add a note at the end: `Historical milestone delivery records and validated requirements are in .planning/PROJECT_HISTORY.md.`

7. `## Constraints` — keep verbatim

8. `## Key Decisions` — keep the table but retain ONLY these load-bearing rows (rows that actively constrain how future upstream merge work must be done):
   - "Fork reference files override upstream content decisions"
   - "Tests may be modified when they conflict with fork standards"
   - "`plans/` is the canonical playbook for all recurring work types"
   - "`<intent>` tag in command layer (not `<task>`)"
   - "Scanner-first approach: run negative-framing scanner before any edit" (either instance — keep the v1.37.1 Phase 9 one as it is the clearer statement)
   - "Preserve D-07 SECURITY `Never X — always Y` patterns verbatim"
   - "XML tag hierarchy conversion removed from fork scope"

   Add a footer note below the table: `> Historical Key Decisions (implementation-specific, settled) are archived in .planning/PROJECT_HISTORY.md.`

9. `## Evolution` — keep verbatim

10. Footer: keep the `---` separators and last-updated line verbatim, but update it to: `*Last updated: 2026-04-30 — Trimmed; historical content moved to PROJECT_HISTORY.md*`

Do NOT include the Abandoned Milestone section, any Shipped Milestone sections, or the Validated requirements subsection in the trimmed PROJECT.md — those are now in PROJECT_HISTORY.md.
  </action>
  <verify>
    <automated>grep -c "Shipped Milestone" /home/thamw/development/happier/get-shit-done/.planning/PROJECT.md || true</automated>
  </verify>
  <done>PROJECT.md contains no "Shipped Milestone" or "Abandoned Milestone" sections, no "### Validated" subsection, and is noticeably shorter. Key Decisions table has 7 rows. PROJECT_HISTORY.md pointer note appears in Active Requirements and Context sections.</done>
</task>

</tasks>

<verification>
- `grep -c "Shipped Milestone" .planning/PROJECT.md` returns 0
- `grep -c "Shipped Milestone" .planning/PROJECT_HISTORY.md` returns 3
- `grep "Abandoned Milestone" .planning/PROJECT_HISTORY.md` finds the section
- `grep "Abandoned Milestone" .planning/PROJECT.md` returns nothing
- `grep "### Validated" .planning/PROJECT.md` returns nothing
- `grep "### Validated" .planning/PROJECT_HISTORY.md` finds the section
- `grep "PROJECT_HISTORY" .planning/PROJECT.md` appears at least twice (Active Requirements and Context)
- `wc -l .planning/PROJECT.md` is noticeably less than the original 203 lines
</verification>

<success_criteria>
PROJECT.md is trimmed to active-guidance content (What This Is, Core Value, Active Requirements, Out of Scope, Context, Constraints, 7-row Key Decisions, Evolution). PROJECT_HISTORY.md contains all shipped/abandoned milestones, validated requirements, and historical Key Decision rows. No information is lost.
</success_criteria>

<output>
After completion, create `.planning/quick/260430-esf-trim-planning-project-md-by-moving-non-r/260430-esf-SUMMARY.md` with what was done, files changed, and the line count before/after for PROJECT.md.
</output>
