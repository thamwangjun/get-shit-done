---
phase: quick-260607-brw
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/bug-2801-ingest-docs-handler.test.cjs
autonomous: true
requirements: [BUG-2801-STALE]
must_haves:
  truths:
    - "node --test tests/bug-2801-ingest-docs-handler.test.cjs passes (0 failures)"
    - "The bug-2801 init-handler dispatch tests (gsd-tools init ingest-docs) remain intact and passing"
    - "Tests accept the #3668 fallback block's legitimate gsd-sdk references while still forbidding a primary literal gsd-sdk query/init invocation"
    - "Only tests/bug-2801-ingest-docs-handler.test.cjs is modified; no workflow file is touched"
  artifacts:
    - path: "tests/bug-2801-ingest-docs-handler.test.cjs"
      provides: "Updated assertions matching the #3668 SDK-resolution fallback convention"
      contains: "ingest-docs"
  key_links:
    - from: "tests/bug-2801-ingest-docs-handler.test.cjs"
      to: "get-shit-done/workflows/ingest-docs.md"
      via: "reads WORKFLOW_FILE and asserts on its bash blocks"
      pattern: "ingest-docs\\.md"
---

<objective>
Update the 3 stale assertions in `tests/bug-2801-ingest-docs-handler.test.cjs` so they accept the
project-wide #3668 SDK-resolution fallback convention now present in `get-shit-done/workflows/ingest-docs.md`.

Purpose: The bug-2801 fix originally assumed `gsd-tools` was the ONLY installed binary and forbade any
`gsd-sdk` reference in the workflow. The newer #3668 change adopted a hybrid resolution block across
nearly all workflows (prefer local `gsd-tools.cjs`, fall back to a global `gsd-sdk` binary on PATH).
The workflow is CORRECT; the tests are stale and fail. Relax the assertions to match the canonical
pattern without weakening the original bug-2801 guarantees.

Output: A passing `tests/bug-2801-ingest-docs-handler.test.cjs`.
</objective>

<context>
@tests/bug-2801-ingest-docs-handler.test.cjs
@get-shit-done/workflows/ingest-docs.md
@get-shit-done/workflows/add-phase.md

The canonical #3668 fallback block (ingest-docs.md lines ~55-67, identical shape in add-phase.md
lines ~32-44) contains these LEGITIMATE `gsd-sdk` references:
- `elif command -v gsd-sdk >/dev/null 2>&1; then`
- `  GSD_SDK="gsd-sdk"`
- `  echo "ERROR: gsd-sdk not found on PATH and $GSD_TOOLS does not exist." >&2`

The actual init invocation is `INIT=$($GSD_SDK init ingest-docs)` — it uses the `$GSD_SDK` shell
variable (which resolves to `node $GSD_TOOLS`), NOT a literal `gsd-sdk init ...`. The original bug
was a literal `gsd-sdk query init.ingest-docs` primary call; that form must still be forbidden.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Relax the "no gsd-sdk" assertion to allow only the #3668 fallback-block references</name>
  <read_first>
    - tests/bug-2801-ingest-docs-handler.test.cjs (lines 103-148, the second describe block)
    - get-shit-done/workflows/ingest-docs.md (lines 50-72, the fallback + init block)
    - get-shit-done/workflows/add-phase.md (lines 28-60, canonical sibling pattern)
  </read_first>
  <action>
    In the `test('no bash code block in ingest-docs.md calls gsd-sdk', ...)` case (currently lines
    104-127), the assertion that ALL `gsd-sdk` references must be absent is stale per #3668. Replace
    the blanket `assert.deepStrictEqual(sdkCalls, [])` with logic that allows the three legitimate
    fallback-block lines while still forbidding a PRIMARY literal `gsd-sdk` invocation.

    Keep the structural bash-block extraction. After collecting lines containing `\bgsd-sdk\b`, filter
    out the canonical fallback-block lines — match them by their distinguishing substrings (per the
    canonical block in add-phase.md / ingest-docs.md):
      - `command -v gsd-sdk` (the PATH-probe line)
      - `GSD_SDK="gsd-sdk"` (the variable assignment fallback)
      - `gsd-sdk not found` (the error-message line)
    Any REMAINING `gsd-sdk` line is an illegitimate primary call. Assert the remaining list is empty,
    with a failure message naming the offending lines (e.g. "primary gsd-sdk invocation found —
    only the #3668 fallback block may reference gsd-sdk").

    Additionally add a positive guard: assert that NO bash line matches a primary literal invocation
    pattern `/\bgsd-sdk\s+(query|init)\b/` (the original bug-2801 form `gsd-sdk query init.ingest-docs`).
    This preserves the original bug guarantee while permitting the fallback block.

    Update the describe block title (currently line 103,
    `'bug-2801: ingest-docs.md workflow calls gsd-tools not gsd-sdk'`) to reflect the reconciled intent,
    e.g. `'bug-2801: ingest-docs.md workflow uses #3668 SDK-resolution (no primary gsd-sdk call)'`.
    Do NOT change the first describe block ('bug-2801: gsd-tools init ingest-docs handler exists',
    lines 49-101) — those dispatch tests stay intact.
  </action>
  <verify>
    <automated>node --test tests/bug-2801-ingest-docs-handler.test.cjs 2>&1 | grep -E "no bash code block|# fail" | head</automated>
  </verify>
  <done>
    The "no gsd-sdk" test passes against the current workflow: it allows the three fallback-block
    references and fails only on a primary `gsd-sdk query|init` invocation. Describe title updated.
    First describe block untouched.
  </done>
</task>

<task type="auto">
  <name>Task 2: Reconcile the canonical-node-path init assertion with the #3668 fallback form</name>
  <read_first>
    - tests/bug-2801-ingest-docs-handler.test.cjs (lines 129-142, the canonical-node-path test)
    - get-shit-done/workflows/ingest-docs.md (lines 54-67, the fallback block and INIT line)
  </read_first>
  <action>
    The `test('ingest-docs.md init step uses canonical node-path gsd-tools.cjs invocation', ...)` case
    (lines 129-142) currently requires a literal
    `node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs init ingest-docs` line. Under #3668 the workflow
    no longer hard-codes that path; it builds `GSD_TOOLS="${RUNTIME_DIR:-...}/get-shit-done/bin/gsd-tools.cjs"`,
    sets `GSD_SDK="node $GSD_TOOLS"`, then runs `INIT=$($GSD_SDK init ingest-docs)`. Update the assertion
    so both the canonical node-path resolution AND the gsd-sdk fallback coexist.

    Require ALL of the following across the (comment-stripped) bash lines, mirroring the canonical block:
      1. The GSD_TOOLS resolution line referencing `get-shit-done/bin/gsd-tools.cjs`
         (regex e.g. `/GSD_TOOLS=.*get-shit-done\/bin\/gsd-tools\.cjs/`).
      2. The `GSD_SDK="node $GSD_TOOLS"` assignment (regex e.g. `/GSD_SDK="node \$GSD_TOOLS"/`).
      3. The init invocation through the resolved variable
         (regex e.g. `/\$GSD_SDK\s+(query\s+)?init.*ingest-docs\b|\$GSD_SDK\s+init\s+ingest-docs\b/`).
    Keep the comment-stripping filter `!/^\s*#/.test(l)`. Assert each is found, with a clear message if
    any is missing. This still proves the workflow resolves the local `gsd-tools.cjs` via node (the
    bug-2801 spirit) rather than calling a bare `gsd-tools`/primary `gsd-sdk`.

    Leave the `cmdInitIngestDocs is exported from init.cjs` test (lines 144-147) unchanged.
  </action>
  <verify>
    <automated>node --test tests/bug-2801-ingest-docs-handler.test.cjs</automated>
  </verify>
  <done>
    Full file `node --test tests/bug-2801-ingest-docs-handler.test.cjs` passes with 0 failures. The
    init-step test recognizes the #3668 node-path resolution form. The init dispatch tests and the
    cmdInitIngestDocs export test remain intact. No workflow file modified
    (`git status --porcelain get-shit-done/workflows/` is empty).
  </done>
</task>

</tasks>

<verification>
- `node --test tests/bug-2801-ingest-docs-handler.test.cjs` exits 0 with all tests passing.
- `git status --porcelain get-shit-done/workflows/ingest-docs.md` is empty (workflow untouched).
- Only `tests/bug-2801-ingest-docs-handler.test.cjs` appears as modified in `git status`.
</verification>

<success_criteria>
- The 3 stale assertions are updated to the #3668 convention, not deleted.
- The bug-2801 dispatch/init-handler tests still pass unchanged.
- A primary literal `gsd-sdk query|init` call in the workflow would still fail the suite.
- Test file is the only modified file.
</success_criteria>

<output>
Modifies `tests/bug-2801-ingest-docs-handler.test.cjs`. No SUMMARY beyond the standard quick-mode summary.
</output>
