---
phase: quick-260430-dmj
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/research/STACK.md
  - .planning/research/fork-regression-tests-research.md
  - .planning/fork_plans/C0-POSITIVE_FRAMING_PASS_V01.md
  - .planning/fork_plans/D0-TAG_HIERARCHY_IMPLEMENTATION_V01.md
  - .planning/milestones/v1.36.0-phases/02-apply-fork-standards-to-v1-36-0-files/02-RESEARCH.md
  - .planning/milestones/v1.37.1-phases/12-tech-debt-remediation/12-PATTERNS.md
  - .planning/milestones/v1.37.1-phases/12-tech-debt-remediation/12-RESEARCH.md
  - .planning/milestones/v1.37.1b-phases/018-fork-tag-corpus-tests/018-RESEARCH.md
  - .planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/19-CONTEXT.md
  - .planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/19-REVIEW.md
  - .planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/19-VERIFICATION.md
  - .planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/019-02-PLAN.md
  - .planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/019-02-SUMMARY.md
  - .planning/milestones/v1.37.1c-REQUIREMENTS.md
  - .planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md
autonomous: true
requirements: []

must_haves:
  truths:
    - "All path references to refs/<filename> in active/operational .planning/ docs point to .planning/references/<filename>"
    - "Historical narrative records describing the refs/ -> .planning/references/ migration are left unchanged"
    - "Milestone audit files (historical records written at audit time) are left unchanged"
    - "User quotes containing @refs/* are left unchanged"
  artifacts:
    - path: ".planning/research/STACK.md"
      provides: "Updated path reference"
    - path: ".planning/research/fork-regression-tests-research.md"
      provides: "Updated path references"
    - path: ".planning/fork_plans/D0-TAG_HIERARCHY_IMPLEMENTATION_V01.md"
      provides: "Updated path references"
    - path: ".planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md"
      provides: "Updated self-referential path on line 108"
  key_links:
    - from: "active docs"
      to: ".planning/references/<file>"
      via: "corrected path strings"
      pattern: "\\.planning/references/[A-Z_]+\\.md"
---

<objective>
Replace stale `refs/` path prefix with `.planning/references/` in all active/operational documents under `.planning/`, while preserving historical narrative text that describes the original migration.

Purpose: The `refs/` directory was moved to `.planning/references/` in commit 1d15504e (quick task 260429-esn). Documents that use `refs/<filename>` as a navigational path reference now point to a non-existent location. This update makes those references accurate.

Output: Updated path strings in active documents. No content meaning changed — only the path prefix is corrected.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Identify and replace refs/ path references in active operational documents</name>
  <files>
    .planning/research/STACK.md
    .planning/research/fork-regression-tests-research.md
    .planning/fork_plans/C0-POSITIVE_FRAMING_PASS_V01.md
    .planning/fork_plans/D0-TAG_HIERARCHY_IMPLEMENTATION_V01.md
    .planning/milestones/v1.36.0-phases/02-apply-fork-standards-to-v1-36-0-files/02-RESEARCH.md
    .planning/milestones/v1.37.1-phases/12-tech-debt-remediation/12-PATTERNS.md
    .planning/milestones/v1.37.1-phases/12-tech-debt-remediation/12-RESEARCH.md
    .planning/milestones/v1.37.1b-phases/018-fork-tag-corpus-tests/018-RESEARCH.md
    .planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/19-CONTEXT.md
    .planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/19-REVIEW.md
    .planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/19-VERIFICATION.md
    .planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/019-02-PLAN.md
    .planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/019-02-SUMMARY.md
    .planning/milestones/v1.37.1c-REQUIREMENTS.md
    .planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md
  </files>
  <action>
Read each file listed above. For each file, replace every occurrence of the string `refs/` with `.planning/references/` ONLY when it appears as a file path reference — i.e., immediately followed by a filename (e.g., `refs/UPSTREAM_TO_FORK_CHANGES_GUIDE.md`, `refs/PROMPT_IMPROVEMENT_GUIDE_V01.md`, `refs/PROMPT_ENGINEERING_GUIDE_V09.md`).

**DO replace** in these contexts:
- Backtick-wrapped paths: `` `refs/UPSTREAM_TO_FORK_CHANGES_GUIDE.md` `` → `` `.planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md` ``
- Inline text paths: `refs/PROMPT_IMPROVEMENT_GUIDE_V01.md Step 2` → `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md Step 2`
- YAML frontmatter list entries: `  - refs/UPSTREAM_TO_FORK_CHANGES_GUIDE.md` → `  - .planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md`
- grep/shell command arguments within action/verify blocks: `grep ... refs/UPSTREAM_TO_FORK_CHANGES_GUIDE.md` → `grep ... .planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md`
- Bullet points referencing the file by path: `- refs/UPSTREAM_TO_FORK_CHANGES_GUIDE.md — ...` → `- .planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md — ...`
- must_haves path entries in PLAN frontmatter

**DO NOT replace** in these contexts:
- Sentences describing the historical directory migration itself (e.g., "move plans/ and refs/ into .planning/{fork_plans,references}/", "refs/ → .planning/references/"). These are historical narrative about what was done, not navigational references.
- The `@refs/*` user quote in DISCUSSION-LOG files (preserve user's original words verbatim).
- Any text where `refs/` appears as a standalone noun referring to the old directory name, not followed immediately by a filename (e.g., "the refs/ directory", "top-level refs/ and plans/ directories").

After making replacements in each file, write the updated content back using the Edit tool (or Write if a full rewrite is cleaner). Do not alter any other content.

Files to skip entirely (do not modify):
- .planning/STATE.md — the quick tasks table row for 260429-esn is historical record
- .planning/milestones/v1.37.1b-MILESTONE-AUDIT.md — milestone audit is a historical record written at audit time
- .planning/milestones/v1.36.0-phases/03-align-tests-with-fork-standards/03-DISCUSSION-LOG.md — contains @refs/* as a user quote
- .planning/phases/20-baseline-audit/20-DISCUSSION-LOG.md — discussion of directory options, not path references
- .planning/quick/260429-esn-commit-unstaged-uncommitted-changes-in-g/ — all files describe the migration itself
  </action>
  <verify>
    <automated>grep -rn "refs/" /home/thamw/development/happier/get-shit-done/.planning/ --include="*.md" | grep -v "260429-esn\|v1.37.1b-MILESTONE-AUDIT\|03-DISCUSSION-LOG\|20-DISCUSSION-LOG\|STATE.md" | grep -v "refs/ " | grep -v "refs/\`" | grep -v "move.*refs/" | grep -v "plans/.*refs/" | grep "refs/[A-Z]"</automated>
  </verify>
  <done>
    - No remaining `refs/UPPERCASE_FILENAME.md` patterns in active documents (only historical/narrative/excluded files retain them)
    - All updated files still read correctly — no broken sentence structure
    - grep command above returns zero lines
  </done>
</task>

<task type="auto">
  <name>Task 2: Verify replacement correctness and commit</name>
  <files></files>
  <action>
Run the verification grep to confirm zero stale path references remain in active documents:

```
grep -rn "refs/[A-Z_]" .planning/ --include="*.md" \
  | grep -v "260429-esn" \
  | grep -v "v1.37.1b-MILESTONE-AUDIT" \
  | grep -v "03-DISCUSSION-LOG" \
  | grep -v "20-DISCUSSION-LOG" \
  | grep -v "STATE.md"
```

If any hits remain that are NOT in the excluded files, fix them now (re-apply replacement).

Then confirm the replaced paths are valid — the following files must exist on disk:
- `.planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md`
- `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md`
- `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md`

Commit all modified files:
```
git add .planning/research/STACK.md \
  .planning/research/fork-regression-tests-research.md \
  .planning/fork_plans/C0-POSITIVE_FRAMING_PASS_V01.md \
  .planning/fork_plans/D0-TAG_HIERARCHY_IMPLEMENTATION_V01.md \
  ".planning/milestones/v1.36.0-phases/02-apply-fork-standards-to-v1-36-0-files/02-RESEARCH.md" \
  ".planning/milestones/v1.37.1-phases/12-tech-debt-remediation/12-PATTERNS.md" \
  ".planning/milestones/v1.37.1-phases/12-tech-debt-remediation/12-RESEARCH.md" \
  ".planning/milestones/v1.37.1b-phases/018-fork-tag-corpus-tests/018-RESEARCH.md" \
  ".planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/19-CONTEXT.md" \
  ".planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/19-REVIEW.md" \
  ".planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/19-VERIFICATION.md" \
  ".planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/019-02-PLAN.md" \
  ".planning/milestones/v1.37.1b-phases/19-convert-objective-tags-to-intent-in-skill-files/019-02-SUMMARY.md" \
  .planning/milestones/v1.37.1c-REQUIREMENTS.md \
  .planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md

git commit -m "$(cat <<'EOF'
docs(quick-260430-dmj): update refs/ path prefix to .planning/references/ in active docs

Replace stale `refs/<file>` path strings with `.planning/references/<file>` in
all active operational documents. Historical migration records and milestone
audit files are left unchanged.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```
  </action>
  <verify>
    <automated>git show --stat HEAD | grep "planning/"</automated>
  </verify>
  <done>
    - Commit exists with correct message
    - git show --stat HEAD lists only files from the target set (no unexpected files)
    - .planning/references/ files exist and are accessible
  </done>
</task>

</tasks>

<verification>
After both tasks complete:

1. `grep -rn "refs/[A-Z_]" .planning/ --include="*.md" | grep -v "260429-esn\|v1.37.1b-MILESTONE-AUDIT\|03-DISCUSSION-LOG\|20-DISCUSSION-LOG\|STATE.md"` returns zero lines
2. `ls .planning/references/` shows UPSTREAM_TO_FORK_CHANGES_GUIDE.md, PROMPT_IMPROVEMENT_GUIDE_V01.md, PROMPT_ENGINEERING_GUIDE_V09.md
3. `git log --oneline -1` shows the docs(quick-260430-dmj) commit
</verification>

<success_criteria>
- All `refs/<FILENAME>.md` path references in active operational documents replaced with `.planning/references/<FILENAME>.md`
- Historical narrative text (SUMMARY files describing the migration, STATE.md quick tasks table, MILESTONE-AUDIT, DISCUSSION-LOG user quotes) left untouched
- Single commit containing all changed files
</success_criteria>

<output>
After completion, create `.planning/quick/260430-dmj-in-planning-intelligently-replace-instan/260430-dmj-SUMMARY.md`
</output>
