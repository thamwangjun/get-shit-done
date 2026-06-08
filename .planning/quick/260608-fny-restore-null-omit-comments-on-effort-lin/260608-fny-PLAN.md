---
phase: 260608-fny
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - get-shit-done/workflows/execute-phase.md
autonomous: true
requirements: []
must_haves:
  truths:
    - "Line 357 effort={executor_model_effort_arg} carries the canonical '# omit this line when executor_model_effort_arg == null' comment"
    - "Line 889 effort={verifier_model_effort_arg} carries the canonical '# omit this line when verifier_model_effort_arg == null' comment"
    - "node --test tests/null-omit-comment-scan.test.cjs passes with zero violations"
  artifacts:
    - path: "get-shit-done/workflows/execute-phase.md"
      provides: "Two corrected standalone effort= lines with canonical null-omit comments"
  key_links: []
---

<objective>
Restore the two missing/incorrect null-omit comments on standalone `effort=`
lines in `get-shit-done/workflows/execute-phase.md` so they match the canonical
phrasing enforced by `tests/null-omit-comment-scan.test.cjs`.

Purpose: The null-omit comment signals the AI template engine to skip the
`effort=` parameter entirely when the `*_effort_arg` variable is null, rather
than passing a literal null value into the Agent() invocation.
Output: Two corrected lines (357 and 889) in execute-phase.md.
</objective>

<context>
!`cat .planning/STATE.md`

@get-shit-done/workflows/execute-phase.md
@tests/null-omit-comment-scan.test.cjs
</context>

<tasks>

<task type="auto">
  <name>Task 1: Correct the two standalone effort= null-omit comments</name>
  <files>get-shit-done/workflows/execute-phase.md</files>
  <read_first>
    get-shit-done/workflows/execute-phase.md (lines around 357 and 889)
  </read_first>
  <action>
    Make exactly two string edits in get-shit-done/workflows/execute-phase.md.
    Do NOT touch the bash lines (~79-80) that build the *_effort_arg variables —
    only the standalone `effort={...}` lines inside Agent() invocations.

    Edit 1 (line 357): the comment text is wrong. Replace
    `  effort={executor_model_effort_arg}  # omit when null`
    with
    `  effort={executor_model_effort_arg}  # omit this line when executor_model_effort_arg == null`

    Edit 2 (line 889): the comment is missing. Replace
    `  effort={verifier_model_effort_arg}`
    with
    `  effort={verifier_model_effort_arg}  # omit this line when verifier_model_effort_arg == null`

    The canonical phrasing `# omit this line when <var_name> == null` already
    appears in plan-phase.md, audit-fix.md, and map-codebase.md — match it exactly.
    The test requires the literal substring `# omit this line when` on each
    standalone effort= line inside an Agent() call.
  </action>
  <verify>
    <automated>node --test tests/null-omit-comment-scan.test.cjs</automated>
  </verify>
  <done>
    Both edited lines contain the substring `# omit this line when`, the comment
    text on each names the correct variable with `== null`, and
    `node --test tests/null-omit-comment-scan.test.cjs` passes with zero violations.
  </done>
</task>

</tasks>

<verification>
node --test tests/null-omit-comment-scan.test.cjs passes (zero violations).
</verification>

<success_criteria>
- Line 357 comment reads `# omit this line when executor_model_effort_arg == null`
- Line 889 comment reads `# omit this line when verifier_model_effort_arg == null`
- Bash *_effort_arg builder lines (~79-80) untouched
- null-omit-comment-scan test passes
</success_criteria>

<output>
Create `.planning/quick/260608-fny-restore-null-omit-comments-on-effort-lin/260608-fny-SUMMARY.md` when done
</output>
