---
phase: quick-260604-swm
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - get-shit-done/workflows/ship.md
  - get-shit-done/workflows/profile-user.md
  - tests/bug-260604-swm-mktemp-portable-template.test.cjs
autonomous: true
requirements: []
must_haves:
  truths:
    - "Zero workflow .md files contain a mktemp template with a suffix after the trailing X-run"
    - "ship.md PR_BODY_FILE uses the portable form: mktemp template ends in X's, .md appended outside the command substitution"
    - "New regression test FAILS on the bad pattern and PASSES on the portable form"
    - "Full npm test suite passes with no regressions"
  artifacts:
    - path: get-shit-done/workflows/ship.md
      provides: "Portable mktemp invocation for PR body temp file"
    - path: tests/bug-260604-swm-mktemp-portable-template.test.cjs
      provides: "Structural guard against non-portable Xs-before-suffix mktemp"
      contains: "mktemp"
  key_links:
    - from: tests/bug-260604-swm-mktemp-portable-template.test.cjs
      to: get-shit-done/workflows/*.md
      via: "recursive readdir + regex scan"
      pattern: "mktemp[^\\n]*\"[^\"]*X\\{3,\\}[^\"\\s]"
---

<objective>
Fix the BSD/GNU mktemp incompatibility in ship.md and add a structural regression test that fails if any workflow places a literal suffix after the trailing X-run inside a mktemp template.

Purpose: BSD mktemp (macOS) only substitutes a trailing run of X's. A suffix like `.md` after the X's makes BSD leave the X's literal, creating a fixed-name temp file (collision/security risk). The portable form keeps X's trailing and appends the suffix outside the command substitution.
Output: Fixed ship.md (+ profile-user.md, which the new test also flags), and tests/bug-260604-swm-mktemp-portable-template.test.cjs.
</objective>

<context>
@get-shit-done/workflows/ship.md
@get-shit-done/workflows/profile-user.md
@tests/workflow-shell-pinning.test.cjs

Reference (already-fixed portable form in this repo):
- `get-shit-done/workflows/quick.md:691` — `QUICK_WORKTREE_MANIFEST="$(mktemp "${TMPDIR:-/tmp}/gsd-quick-worktree-XXXXXX").json"`
- `get-shit-done/workflows/execute-phase.md:528` — `WAVE_WORKTREE_MANIFEST="$(mktemp "${TMPDIR:-/tmp}/gsd-worktree-wave-XXXXXX").json"`

Known BAD occurrences (`X{3,}` immediately followed by `.`/suffix inside the quoted template — all will be flagged by the new test):
- `ship.md:210` — `PR_BODY_FILE=$(mktemp "${TMPDIR:-/tmp}/gsd-pr-body.XXXXXX.md")`
- `profile-user.md:231` — `ANSWERS_PATH=$(mktemp /tmp/gsd-profile-answers-XXXXXX.json)`
- `profile-user.md:245` — `ANALYSIS_PATH=$(mktemp /tmp/gsd-profile-analysis-XXXXXX.json)`
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix non-portable mktemp templates in ship.md and profile-user.md</name>
  <read_first>get-shit-done/workflows/ship.md, get-shit-done/workflows/profile-user.md</read_first>
  <files>get-shit-done/workflows/ship.md, get-shit-done/workflows/profile-user.md</files>
  <action>
In `get-shit-done/workflows/ship.md` (~line 210), replace
`PR_BODY_FILE=$(mktemp "${TMPDIR:-/tmp}/gsd-pr-body.XXXXXX.md")`
with the portable form
`PR_BODY_FILE="$(mktemp "${TMPDIR:-/tmp}/gsd-pr-body-XXXXXX").md"`.
Note the two changes: (1) drop the `.` before `XXXXXX` so the prefix ends with `-` and the X-run terminates the mktemp template; (2) move `.md` outside the command substitution, mirroring quick.md:691. Downstream usages (`trap`, `printf > "${PR_BODY_FILE}"`, `gh pr create --body-file "${PR_BODY_FILE}"`) only read the path variable, so no other edits are needed in ship.md.

In `get-shit-done/workflows/profile-user.md`, apply the same portable transform to both occurrences so the new test (Task 2) does not flag them — these share the identical BSD bug:
- line ~231: `ANSWERS_PATH=$(mktemp /tmp/gsd-profile-answers-XXXXXX.json)` -> `ANSWERS_PATH="$(mktemp /tmp/gsd-profile-answers-XXXXXX").json"`
- line ~245: `ANALYSIS_PATH=$(mktemp /tmp/gsd-profile-analysis-XXXXXX.json)` -> `ANALYSIS_PATH="$(mktemp /tmp/gsd-profile-analysis-XXXXXX").json"`
(These already end the prefix with `-` before `XXXXXX`, so only the suffix needs moving outside the substitution. Their downstream usages also just read the path variable.)
Leave the bare `mktemp` (code-review.md:372) and trailing-X forms (execute-phase.md:790, quick.md:691) untouched — they are already portable.
  </action>
  <verify>
    <automated>! grep -rnE 'mktemp[^\n]*"[^"]*X{3,}[^"[:space:]]' get-shit-done/workflows/ && ! grep -rnE 'mktemp[^\n]*[^"[:space:]]*X{3,}\.[A-Za-z]' get-shit-done/workflows/</automated>
  </verify>
  <done>No `get-shit-done/workflows/*.md` file contains a mktemp template with a suffix after the trailing X-run. ship.md uses `mktemp "...-XXXXXX").md` and profile-user.md uses the `...-XXXXXX").json` form.</done>
</task>

<task type="auto">
  <name>Task 2: Add regression test for portable mktemp templates</name>
  <read_first>tests/workflow-shell-pinning.test.cjs</read_first>
  <files>tests/bug-260604-swm-mktemp-portable-template.test.cjs</files>
  <action>
Create `tests/bug-260604-swm-mktemp-portable-template.test.cjs` mirroring the header/style of `tests/workflow-shell-pinning.test.cjs`:
- Begin with `'use strict';`, then `process.env.GSD_TEST_MODE = '1';`.
- A JSDoc block explaining the BSD/GNU mktemp incompatibility (BSD substitutes only a trailing X-run; a suffix after the X's is left literal, producing a fixed-name temp file) and what the test guards against.
- `require('node:test')` (`test`, `describe`), `require('node:assert/strict')`, `node:fs`, `node:path`.
- `const REPO_ROOT = path.join(__dirname, '..');` and scan `get-shit-done/workflows/` recursively for `*.md` (write a small `listMarkdownFiles(dir)` recursive readdir helper, ignoring non-`.md` files).
- For each file, read it and scan line-by-line. Flag a line as a violation when an mktemp template puts a suffix AFTER the trailing X-run inside the same quoted/template string. Detection regex (per task brief, refine if needed): `/mktemp[^\n]*"[^"]*X{3,}[^"\s]/` to catch the double-quoted form (ship.md style). Also catch the unquoted form used in profile-user.md (`mktemp /tmp/...-XXXXXX.json`) with a second pattern such as `/mktemp[^\n]*[^"\s]X{3,}\.[A-Za-z]/`. The portable form (`"...-XXXXXX").md`) has the closing quote immediately after the X-run, so neither pattern matches it.
- Collect violations as `{ file: path.relative(REPO_ROOT, f), line: lineNumber, text: trimmedLine }`. The assertion message must name each offending file:line and the offending text, e.g. a multi-line `assert.fail` listing `  ${v.file}:${v.line}  ${v.text}` and explaining the portable form to use.
- One `describe('portable mktemp templates', ...)` with `test('no workflow places a suffix after the trailing mktemp X-run', ...)`. Also assert the scan found at least one workflow file (guard against a broken path) via `assert.ok(files.length > 0, ...)`.
- Optionally also scan `commands/**/*.md` with the same helper; keep it simple if no offenders exist there.
Do not import production lib code — this is a pure structural source scan, matching the style-reference test.
  </action>
  <verify>
    <automated>node --test tests/bug-260604-swm-mktemp-portable-template.test.cjs</automated>
  </verify>
  <done>`node --test tests/bug-260604-swm-mktemp-portable-template.test.cjs` passes after Task 1's fixes. Manual RED check: temporarily reverting any one fix (e.g. ship.md to `...XXXXXX.md")`) makes the test FAIL with a message naming that file:line; restore the fix and the test PASSES again.</done>
</task>

</tasks>

<verification>
- `grep -rnE 'mktemp[^\n]*"[^"]*X{3,}[^"[:space:]]' get-shit-done/workflows/` returns nothing.
- `node --test tests/bug-260604-swm-mktemp-portable-template.test.cjs` passes.
- Full suite: `npm test 2>&1 | tee /tmp/gsd-mktemp-test.txt` then read `/tmp/gsd-mktemp-test.txt` — no regressions.
</verification>

<success_criteria>
- ship.md and profile-user.md use the portable mktemp form (X-run trailing, suffix outside the substitution).
- New regression test exists, named per the `bug-<id>-<desc>.test.cjs` convention, FAILS on the bad pattern and PASSES on the fixed form.
- Each task committed atomically (`fix(quick-260604-swm): ...` for Task 1, `test(quick-260604-swm): ...` for Task 2).
- `npm test` green.
</success_criteria>

<output>
Both tasks committed atomically. No SUMMARY required beyond quick-task close-out.
</output>
