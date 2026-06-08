# Phase 63: Security Framing Coverage - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Flip one skipped unit test in `tests/debug-session-management.test.cjs` to active, replacing its stale upstream `DATA_START` assertion with two assertions on the fork's hardened security language in `agents/gsd-debugger.md`. The fork's language (`untrusted user input`, `evidence data only`) already exists in the agent file at lines 32–33, so the rewritten test passes without any change to `gsd-debugger.md`.

This phase changes test code only. It does not modify any agent, workflow, or command content.

</domain>

<decisions>
## Implementation Decisions

### Target test identification (CRITICAL — ROADMAP line numbers are stale)
- **D-01:** The test to rewrite is at **line 99–101** of `tests/debug-session-management.test.cjs`:
  ```js
  test('gsd-debugger contains security note about DATA_START', { skip: 'fork intentionally diverges from upstream contract' }, () => {
    assert.ok(gsdDebugger.includes('DATA_START'), 'gsd-debugger.md must contain DATA_START security reference');
  });
  ```
  The ROADMAP success criteria cite "lines 133–139" — that is **incorrect/stale**. Lines 133–139 are a *different, unskipped* test (`gsd-debug-session-manager uses DATA_START/DATA_END for checkpoint responses`) that asserts on the `sessionManager` variable, not `gsdDebugger`. **Leave the line-133 test untouched.** Its DATA_START/DATA_END usage is legitimate fork behavior for the session-manager agent.

### Rewrite specification
- **D-02:** Remove the `{ skip: 'fork intentionally diverges from upstream contract' }` option so the test executes unconditionally.
- **D-03:** Replace the single `gsdDebugger.includes('DATA_START')` assertion entirely with two assertions:
  - `assert.ok(gsdDebugger.includes('untrusted user input'), ...)`
  - `assert.ok(gsdDebugger.includes('evidence data only'), ...)`
- **D-04:** No negative assertion is required (success criterion #4 asks only that the DATA_START assertion be *absent/replaced*, not that the test assert DATA_START is missing from the agent).
- **D-05:** Rename the test title from `'gsd-debugger contains security note about DATA_START'` to something that reflects the new assertions (e.g. `'gsd-debugger asserts fork hardened security framing'`) so the title is not misleading.

### Verification
- **D-06:** `npm test 2>&1 | tee /tmp/gsd-test-output.txt` must pass with 0 new failures, and `debug-session-management.test.cjs` must report **one fewer skipped test** than before (skip count drops by exactly 1).

### Claude's Discretion
- Exact wording of the renamed test title and assertion failure messages.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Test under change
- `tests/debug-session-management.test.cjs` — the skipped test at line 99–101 is the sole target. The unskipped test at line 133–139 is a different agent (`gsd-debug-session-manager`) and is out of scope.

### Source content asserted against
- `agents/gsd-debugger.md` §lines 32–33 — contains the fork's hardened security paragraph (`untrusted user input`, `evidence data only`). No change to this file; it is the assertion target.

### Standards
- `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md`, `PROMPT_ENGINEERING_GUIDE_V09.md` — fork positive-framing standards (context only; this phase touches test code, not prompt content).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `gsdDebugger` module-level variable (line 19 of the test file) already reads `agents/gsd-debugger.md` into scope — the rewritten assertions reuse it directly. No new file reads needed.

### Established Patterns
- Sibling tests in the same `describe` block use `assert.ok(gsdDebugger.includes('...'), 'message')` — follow that exact pattern for consistency.
- Fork convention: upstream-divergent tests are marked `{ skip: 'fork intentionally diverges from upstream contract' }`. This phase removes that marker for one test because the fork now has its *own* positive assertion to make (not merely a divergence to suppress).

### Integration Points
- None beyond the single test file.

</code_context>

<specifics>
## Specific Ideas

Phase is fully specified by ROADMAP success criteria #1–#5 (with the line-number correction in D-01). No discussion gray areas surfaced.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 63-Security Framing Coverage*
*Context gathered: 2026-06-08*
