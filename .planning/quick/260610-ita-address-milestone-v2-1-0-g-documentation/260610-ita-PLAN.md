---
phase: 260610-ita
plan: "01"
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/phases/67-full-verification/67-VERIFICATION.md
  - .planning/phases/67-full-verification/67-01-SUMMARY.md
  - .planning/phases/66-citation-cleanup/66-04-SUMMARY.md
  - .planning/phases/65-guard-test-red/65-01-SUMMARY.md
autonomous: true
requirements: [DOC-ITA-01, DOC-ITA-02, DOC-ITA-03, DOC-ITA-04, DOC-ITA-05]

must_haves:
  truths:
    - "Phase-level verification file exists at .planning/phases/67-full-verification/67-VERIFICATION.md with header reading 'Phase 67: Full Verification — Phase Verification Report'"
    - "67-01-SUMMARY.md reconciliation table row for commands/gsd/config.md:47 reads the corrected FILE_ALLOWLIST/PLACEHOLDER_DIGITS classification (no longer 'code-fence (bash comment in shell block)')"
    - "66-04-SUMMARY.md frontmatter has requirements-completed: [CITE-06, CITE-07, CITE-08, CITE-09]"
    - "66-04-SUMMARY.md contains a 'Templates/ Dir Coverage' note explaining why no 66-05 plan was needed (sole templates/ hit is PLACEHOLDER_DIGITS-covered illustrative #123)"
    - "65-01-SUMMARY.md references PLACEHOLDER_DIGITS = new Set([1, 2, 123]) (not [1, 2, 45, 123]) with a parenthetical noting 45 was removed as redundant post-phase by quick task 260610-heg"
  artifacts:
    - path: ".planning/phases/67-full-verification/67-VERIFICATION.md"
      provides: "Phase-level verification report (promoted from 67-01-VERIFICATION.md)"
    - path: ".planning/phases/67-full-verification/67-01-SUMMARY.md"
      provides: "Reconciliation table with corrected classification for commands/gsd/config.md:47"
    - path: ".planning/phases/66-citation-cleanup/66-04-SUMMARY.md"
      provides: "Frontmatter requirements-completed field + Templates/ Dir Coverage note"
    - path: ".planning/phases/65-guard-test-red/65-01-SUMMARY.md"
      provides: "PLACEHOLDER_DIGITS reference updated to reflect post-phase removal of 45"
  key_links: []
---

<objective>
Address five documentation tech-debt items left over from the v2.1.0-g Citation Cleanup milestone: promote 67-01-VERIFICATION to a phase-level file, correct one mis-classification in the 67-01 reconciliation table, backfill missing requirements-completed frontmatter and a Templates/ coverage note in 66-04, and update stale PLACEHOLDER_DIGITS documentation in 65-01.

Purpose: Bring milestone v2.1.0-g documentation into a self-consistent, accurate state before milestone close-out — the test suite is GREEN and requirements are satisfied, but the documentation artifacts have known inaccuracies that should be reconciled while the context is fresh.

Output: One new file (67-VERIFICATION.md) and edits to three existing SUMMARY files. No source code changes.
</objective>

<context>
!`cat .planning/STATE.md`

@.planning/phases/67-full-verification/67-01-VERIFICATION.md
@.planning/phases/67-full-verification/67-01-SUMMARY.md
@.planning/phases/66-citation-cleanup/66-04-SUMMARY.md
@.planning/phases/65-guard-test-red/65-01-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Promote 67-01-VERIFICATION.md to phase-level 67-VERIFICATION.md</name>
  <files>.planning/phases/67-full-verification/67-VERIFICATION.md</files>
  <read_first>.planning/phases/67-full-verification/67-01-VERIFICATION.md</read_first>
  <action>
    Create a new file at `.planning/phases/67-full-verification/67-VERIFICATION.md` that is a verbatim copy of `67-01-VERIFICATION.md` with exactly one change: the H1 header on line 9 currently reads `# Phase 67: Full Verification — Verification Report`. Change it to `# Phase 67: Full Verification — Phase Verification Report` (insert the word "Phase" before "Verification Report"). Note: the source file's H1 says "Verification Report" not "Plan 01 Verification Report" — the task spec described intent, not the exact source string. Add the word "Phase" before "Verification Report" so the final header is `# Phase 67: Full Verification — Phase Verification Report`. Preserve everything else exactly (frontmatter, all body content, all tables, all reconciliation notes, the trailing verifier/timestamp lines). Do NOT modify `67-01-VERIFICATION.md` itself — this is a promotion/copy, not a rename.
  </action>
  <verify>
    <automated>test -f .planning/phases/67-full-verification/67-VERIFICATION.md && grep -q "^# Phase 67: Full Verification — Phase Verification Report$" .planning/phases/67-full-verification/67-VERIFICATION.md && test -f .planning/phases/67-full-verification/67-01-VERIFICATION.md</automated>
  </verify>
  <done>
    `67-VERIFICATION.md` exists with the updated H1 header; `67-01-VERIFICATION.md` still exists and is unchanged; the new file's body content (everything below the H1) is byte-identical to the source body.
  </done>
</task>

<task type="auto">
  <name>Task 2: Fix mis-classification in 67-01-SUMMARY.md reconciliation table</name>
  <files>.planning/phases/67-full-verification/67-01-SUMMARY.md</files>
  <read_first>.planning/phases/67-full-verification/67-01-SUMMARY.md</read_first>
  <action>
    In `.planning/phases/67-full-verification/67-01-SUMMARY.md`, locate the row in the "CITE-11 Raw Grep Reconciliation Table" for `commands/gsd/config.md:47`. The row currently reads:

    `| commands/gsd/config.md:47 | `#2439` | code-fence (bash comment in shell block) |`

    Update the third cell (Category) to:

    `FILE_ALLOWLIST prose — `(#2439)` is in plain prose (`**Pre-flight check (#2439):**`), not in a code fence; it survives because it is explicitly listed in `PLACEHOLDER_DIGITS` / `FILE_ALLOWLIST`.`

    Leave the first two cells (File and Hit) untouched. Leave every other row of the table untouched. Do not modify the table header, the "Verdict" line, or anything else in the file.
  </action>
  <verify>
    <automated>grep -q "FILE_ALLOWLIST prose" .planning/phases/67-full-verification/67-01-SUMMARY.md && ! grep -q "commands/gsd/config.md:47 | \`#2439\` | code-fence" .planning/phases/67-full-verification/67-01-SUMMARY.md</automated>
  </verify>
  <done>
    Row for `commands/gsd/config.md:47` no longer contains the "code-fence (bash comment in shell block)" label; it contains the new FILE_ALLOWLIST-prose explanation. No other rows changed.
  </done>
</task>

<task type="auto">
  <name>Task 3: Add requirements-completed frontmatter to 66-04-SUMMARY.md</name>
  <files>.planning/phases/66-citation-cleanup/66-04-SUMMARY.md</files>
  <read_first>.planning/phases/66-citation-cleanup/66-04-SUMMARY.md, .planning/phases/66-citation-cleanup/66-01-SUMMARY.md</read_first>
  <action>
    The frontmatter of `66-04-SUMMARY.md` is missing the `requirements-completed` field that sibling summaries (66-01, 66-02, 66-03) all carry as `requirements-completed: [CITE-06, CITE-07, CITE-08, CITE-09]`. Insert this field into the 66-04 frontmatter.

    Placement: Add the line `requirements-completed: [CITE-06, CITE-07, CITE-08, CITE-09]` immediately after the `decisions:` block and before the `metrics:` block — i.e. as a top-level key in the YAML frontmatter, between `decisions:` and `metrics:`. Keep YAML indentation consistent with the other top-level keys (no indent — flush left). Do not modify any other frontmatter keys, the `---` delimiters, or the body of the file.

    Note: 66-04 uses snake_case keys (`tech_stack`, `key_files`, `dependency_graph`, `metrics`) while sibling summaries use kebab-case (`tech-stack`, `key-files`). Use `requirements-completed` (with hyphen) to match the sibling summaries — that is the canonical SUMMARY field name per the template.
  </action>
  <verify>
    <automated>grep -q "^requirements-completed: \[CITE-06, CITE-07, CITE-08, CITE-09\]$" .planning/phases/66-citation-cleanup/66-04-SUMMARY.md</automated>
  </verify>
  <done>
    `66-04-SUMMARY.md` frontmatter contains `requirements-completed: [CITE-06, CITE-07, CITE-08, CITE-09]` as a top-level YAML key positioned between `decisions:` and `metrics:`. No other frontmatter or body content changed.
  </done>
</task>

<task type="auto">
  <name>Task 4: Add Templates/ Dir Coverage note to 66-04-SUMMARY.md</name>
  <files>.planning/phases/66-citation-cleanup/66-04-SUMMARY.md</files>
  <read_first>.planning/phases/66-citation-cleanup/66-04-SUMMARY.md</read_first>
  <action>
    Add a new top-level section to the body of `66-04-SUMMARY.md` explaining why no 66-05 templates-cleanup plan was needed. Place the section after the existing `## Notes` block (under `## Deviations from Plan`) and before `## Known Stubs`.

    The section must read exactly:

    ```
    ## Templates/ Dir Coverage

    No 66-05 templates-cleanup plan was needed: the sole `templates/` hit, `get-shit-done/templates/codebase/conventions.md:232 #123`, is covered by `PLACEHOLDER_DIGITS` (illustrative placeholder) and was never a guard test violation.
    ```

    Preserve all other body content and the trailing `## Self-Check: PASSED` block exactly.
  </action>
  <verify>
    <automated>grep -q "^## Templates/ Dir Coverage$" .planning/phases/66-citation-cleanup/66-04-SUMMARY.md && grep -q "get-shit-done/templates/codebase/conventions.md:232" .planning/phases/66-citation-cleanup/66-04-SUMMARY.md && grep -q "^## Self-Check: PASSED$" .planning/phases/66-citation-cleanup/66-04-SUMMARY.md</automated>
  </verify>
  <done>
    `66-04-SUMMARY.md` contains a new `## Templates/ Dir Coverage` section between `## Notes` (under Deviations) and `## Known Stubs`, with the one-sentence explanation citing the conventions.md:232 #123 placeholder. The pre-existing `## Self-Check: PASSED` block remains intact at the end of the file.
  </done>
</task>

<task type="auto">
  <name>Task 5: Fix PLACEHOLDER_DIGITS documentation in 65-01-SUMMARY.md</name>
  <files>.planning/phases/65-guard-test-red/65-01-SUMMARY.md</files>
  <read_first>.planning/phases/65-guard-test-red/65-01-SUMMARY.md</read_first>
  <action>
    Two references in `65-01-SUMMARY.md` mention `PLACEHOLDER_DIGITS = new Set([1, 2, 45, 123])`. Both must be updated to reflect the post-phase removal of `45` by quick task `260610-heg`.

    1. In the `key-decisions:` frontmatter block, the line currently reads:

       `- "D-04/D-05: PLACEHOLDER_DIGITS = new Set([1, 2, 45, 123]) as exact-value allowlist"`

       Update to:

       `- "D-04/D-05: PLACEHOLDER_DIGITS = new Set([1, 2, 123]) as exact-value allowlist (45 removed post-phase by quick task 260610-heg as redundant — the sole #45 in corpus is inside a code fence in inbox.md, already excluded by D-10)"`

    2. In the `## Decisions Made` body section, the bullet currently reads:

       `- PLACEHOLDER_DIGITS exact-value Set `[1, 2, 45, 123]` per D-04; `#45` included defensively per D-05 (no corpus hit confirmed)`

       Update to:

       `- PLACEHOLDER_DIGITS exact-value Set `[1, 2, 123]` per D-04; `45` was originally included defensively per D-05 but was removed post-phase by quick task 260610-heg as redundant (the sole `#45` in corpus is inside a code fence in `inbox.md`, already excluded by D-10)`

    Do not modify any other bullets, decisions, or sections of the file.
  </action>
  <verify>
    <automated>! grep -F "[1, 2, 45, 123]" .planning/phases/65-guard-test-red/65-01-SUMMARY.md && grep -c "\[1, 2, 123\]" .planning/phases/65-guard-test-red/65-01-SUMMARY.md | grep -qE "^[2-9]" && grep -q "260610-heg" .planning/phases/65-guard-test-red/65-01-SUMMARY.md</automated>
  </verify>
  <done>
    Both PLACEHOLDER_DIGITS references in `65-01-SUMMARY.md` (frontmatter `key-decisions` bullet and body `## Decisions Made` bullet) now show `[1, 2, 123]` instead of `[1, 2, 45, 123]`, and both include the parenthetical attributing the `45` removal to quick task `260610-heg`. No other content in the file was modified.
  </done>
</task>

</tasks>

<verification>
After all five tasks complete, run this consolidated check:

```bash
# Task 1
test -f .planning/phases/67-full-verification/67-VERIFICATION.md && \
  grep -q "Phase Verification Report" .planning/phases/67-full-verification/67-VERIFICATION.md && \
# Task 2
grep -q "FILE_ALLOWLIST prose" .planning/phases/67-full-verification/67-01-SUMMARY.md && \
# Task 3
grep -q "^requirements-completed: \[CITE-06, CITE-07, CITE-08, CITE-09\]$" .planning/phases/66-citation-cleanup/66-04-SUMMARY.md && \
# Task 4
grep -q "^## Templates/ Dir Coverage$" .planning/phases/66-citation-cleanup/66-04-SUMMARY.md && \
# Task 5
! grep -qF "[1, 2, 45, 123]" .planning/phases/65-guard-test-red/65-01-SUMMARY.md && \
echo "ALL FIVE DOC FIXES LANDED"
```

The phrase `ALL FIVE DOC FIXES LANDED` must appear in stdout.
</verification>

<success_criteria>
- 67-VERIFICATION.md exists at phase level with header `# Phase 67: Full Verification — Phase Verification Report` and body identical to 67-01-VERIFICATION.md
- 67-01-SUMMARY.md reconciliation row for `commands/gsd/config.md:47` shows the FILE_ALLOWLIST-prose classification, not "code-fence"
- 66-04-SUMMARY.md frontmatter carries `requirements-completed: [CITE-06, CITE-07, CITE-08, CITE-09]`
- 66-04-SUMMARY.md has a `## Templates/ Dir Coverage` section explaining the absence of 66-05
- 65-01-SUMMARY.md `[1, 2, 45, 123]` references are both updated to `[1, 2, 123]` with attribution to quick task `260610-heg`
- No source code files modified — `git diff --name-only` shows only `.planning/` files
</success_criteria>

<output>
Create `.planning/quick/260610-ita-address-milestone-v2-1-0-g-documentation/260610-ita-SUMMARY.md` when done.
</output>
