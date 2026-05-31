---
phase: quick-260531-qqo
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/ai-evals.test.cjs
  - tests/context-enrichment.test.cjs
  - tests/install-eta-regression.test.cjs
autonomous: true
requirements: [QQO-01]

must_haves:
  truths:
    - "npm test reports 0 failures"
    - "D-01: TEST FILES ONLY — no edits to any file under get-shit-done/, agents/, commands/, or sdk/"
    - "D-02: HEALTH tests use a HOME directory distinct from cwd (fakeHome convention)"
    - "D-03: Obsolete execute-phase.md CONTEXT_WINDOW tests are deleted, not stubbed/skipped"
    - "Surviving tests (config blocks, verifier files_to_read, plan-phase.md block, TEST-01/03/04/05) remain untouched"
  artifacts:
    - path: "tests/ai-evals.test.cjs"
      provides: "W016 + addAiIntegrationPhaseKey tests passing via fakeHome"
    - path: "tests/context-enrichment.test.cjs"
      provides: "execute-phase.md describe block with only the surviving verifier test"
    - path: "tests/install-eta-regression.test.cjs"
      provides: "Eta regression suite without the obsolete TEST-02 conditional block"
  key_links:
    - from: "tests/ai-evals.test.cjs HEALTH blocks"
      to: "runGsdTools HOME/USERPROFILE"
      via: "fakeHome distinct from tmpDir"
      pattern: "HOME: fakeHome"
---

<objective>
Fix 6 npm test failures introduced by recent quick tasks. TEST-ONLY changes — the
diagnosis is complete and confirmed; this plan turns it into surgical edits.

Two independent root causes:
- GROUP A (2 failures in tests/ai-evals.test.cjs): HEALTH tests set HOME == cwd,
  tripping the E010 "CWD is home directory" early-return guard in verify.cjs, so W016
  and repairs never fire. Fix is purely in the test — give HEALTH tests a HOME
  distinct from cwd via the existing fakeHome convention. DO NOT touch verify.cjs (per D-01).
- GROUP B (4 failures): the `mvd` quick task (817348c7) removed all CONTEXT_WINDOW
  ternary gating from execute-phase.md. Tests asserting that removed gating are now
  obsolete and must be deleted (per D-03).

Purpose: Return the test suite to green without altering any shipped product behavior.
Output: Three edited test files; `npm test` reports 0 failures.
</objective>

<context>
@tests/ai-evals.test.cjs
@tests/context-enrichment.test.cjs
@tests/install-eta-regression.test.cjs
@tests/agent-skills.test.cjs
</context>

<tasks>

<task type="auto">
  <name>Task 1: Group A — fakeHome refactor in ai-evals.test.cjs HEALTH blocks</name>
  <files>tests/ai-evals.test.cjs</files>
  <read_first>
    - tests/ai-evals.test.cjs (HEALTH describe blocks at lines 120-201)
    - tests/agent-skills.test.cjs lines 213-227 (fakeHome create/cleanup reference convention)
  </read_first>
  <action>
    Apply the fakeHome convention to BOTH HEALTH describe blocks so HOME is distinct
    from cwd (per D-01 — test-only; per D-02 — fakeHome distinct from tmpDir).

    Block 1 — "HEALTH: W016 — workflow.ai_integration_phase absent" (lines 120-173, 3 tests).
    Block 2 — "HEALTH --repair: addAiIntegrationPhaseKey" (lines 177-201, 1 test).

    In each block:
    - Declare `let fakeHome;` alongside the existing `let tmpDir;`.
    - In `beforeEach`, after `tmpDir = createTempProject();`, add:
      `fakeHome = fs.mkdtempSync(path.join(require('os').tmpdir(), 'gsd-qqo-home-'));`
    - In `afterEach`, after the existing `cleanup(tmpDir);`, add:
      `fs.rmSync(fakeHome, { recursive: true, force: true });`
    - In every `runGsdTools(...)` call inside these two blocks, change the env object
      from `{ HOME: tmpDir, USERPROFILE: tmpDir }` to `{ HOME: fakeHome, USERPROFILE: fakeHome }`.
      This covers all four runGsdTools calls (lines 130, 147, 164, 190).

    `fs` and `path` are already required at the top of the file; `os` is accessed
    inline via `require('os')` per the reference convention. Do NOT change the CONFIG
    describe blocks (lines 58-116) — those legitimately use tmpDir for HOME and pass.
  </action>
  <verify>
    <automated>node --test tests/ai-evals.test.cjs 2>&1 | tail -20</automated>
  </verify>
  <done>
    node --test tests/ai-evals.test.cjs reports 0 failures; both previously-failing
    W016 and addAiIntegrationPhaseKey tests pass; the three negative-assertion tests
    still pass; verify.cjs is unmodified.
  </done>
</task>

<task type="auto">
  <name>Task 2: Group B — delete obsolete CONTEXT_WINDOW tests</name>
  <files>tests/context-enrichment.test.cjs, tests/install-eta-regression.test.cjs</files>
  <read_first>
    - tests/context-enrichment.test.cjs (execute-phase.md describe block, lines 24-105)
    - tests/install-eta-regression.test.cjs (TEST-02 block, lines 200-219)
  </read_first>
  <action>
    Delete the tests that assert the now-removed execute-phase.md CONTEXT_WINDOW
    gating (per D-03 — delete, do not stub or skip). Keep deletions surgical; do not
    reflow surrounding tests or strip file-level `// allow-test-rule:` headers.

    In tests/context-enrichment.test.cjs, inside `describe('execute-phase.md context enrichment', ...)`:
    - Delete the test "contains CONTEXT_WINDOW config-get command" (lines 27-41).
    - Delete the test "contains conditional prior_wave_summaries in executor prompt" (lines 43-61).
    - Delete the test "executor enrichment block includes CONTEXT.md and RESEARCH.md for 1M models" (lines 88-104).
    - KEEP the test "verifier prompt includes files_to_read block" (lines 63-86) — it has
      no CONTEXT_WINDOW reference and still passes. The execute-phase.md describe block
      retains exactly that one test.
    - KEEP the entire `describe('plan-phase.md context enrichment', ...)` block (lines 107-150) untouched.

    In tests/install-eta-regression.test.cjs:
    - Delete the entire `describe('TEST-02: Conditional @~ expression preserved verbatim after Eta rendering', ...)`
      block including its `// ─── TEST-02 ───` banner comment (lines 200-219).
    - Leave TEST-01, TEST-03, TEST-04, TEST-05, the ALLOWED_INLINE_REFS array, and all
      imports intact.
  </action>
  <verify>
    <automated>node --test tests/context-enrichment.test.cjs tests/install-eta-regression.test.cjs 2>&1 | tail -20</automated>
  </verify>
  <done>
    Both files report 0 failures; the surviving verifier test and plan-phase.md block
    remain in context-enrichment.test.cjs; TEST-01/03/04/05 remain in
    install-eta-regression.test.cjs; no source/product file modified.
  </done>
</task>

</tasks>

<verification>
Full suite green:
`npm test 2>&1 | tee /tmp/gsd-qqo-test.txt` reports 0 failures.

Targeted (faster):
`node --test tests/ai-evals.test.cjs tests/context-enrichment.test.cjs tests/install-eta-regression.test.cjs`

Confirm no source files touched:
`git diff --name-only` lists only the three test files under tests/.
</verification>

<success_criteria>
- npm test reports 0 failures.
- Only tests/ai-evals.test.cjs, tests/context-enrichment.test.cjs, and
  tests/install-eta-regression.test.cjs are modified (per D-01).
- No file under get-shit-done/, agents/, commands/, or sdk/ is changed.
- Surviving tests and file-level allow-test-rule headers are intact.
</success_criteria>

<output>
Create .planning/quick/260531-qqo-fix-npm-test-failures-introduced-by-rece/260531-qqo-SUMMARY.md when done
</output>
