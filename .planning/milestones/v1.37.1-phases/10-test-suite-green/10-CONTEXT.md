# Phase 10: Test Suite Green - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Drive the full test suite to all-green: `npm test` exits 0 with all 4112 tests passing (≥3941 baseline). The two known failures are diagnosed and the fix approach is decided. Phase 10 closes when `npm test` exits 0 and all 5 fork-specific tests are confirmed present and passing.

Current state entering Phase 10: **4110/4112 pass** (much better than the 4098/4112 expected by Phase 9 — Phase 9 left only 2 failures).

</domain>

<decisions>
## Implementation Decisions

### Failure 1: verification-overrides structural test

- **D-01:** The test `required_reading block is between </persona> and <project_context>` (in `tests/verification-overrides.test.cjs:216`) fails because `gsd-verifier.md` now uses `<role>` instead of `<persona>`. This regression was introduced by upstream commit `c5e77c8` (`feat(agents): enforce size budget + extract duplicated boilerplate`), not by Phase 9.

- **D-02:** The V09 guide (`.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md`) defines `<persona>` as the canonical XML block for agent role/voice/identity. The test is correct per fork standards. The fix is on the agent files, not the test.

- **D-03:** **Fix scope: all 24 agents** — Restore `<persona>` in all agents currently using `<role>` to bring them into V09 compliance. This is the user's explicit decision. The `<role>` → `<persona>` rename applies to every `agents/gsd-*.md` file that uses `<role>` as the top-level block for agent identity/voice. Frontmatter and tool lists must not be touched.

- **D-04:** After the rename, run `tests/agent-size-budget.test.cjs` explicitly. The tag rename changes no content — size budget impact should be zero, but verify to be safe.

### Failure 2: MANAGED_HOOKS sync gap

- **D-05:** `gsd-read-injection-scanner.js` is shipped in `hooks/` but missing from the `MANAGED_HOOKS` array in `hooks/gsd-check-update-worker.js`. The test `every shipped gsd-*.js hook is in MANAGED_HOOKS` is a legitimate registry sync check — the fix is to add the hook to the `MANAGED_HOOKS` list. This is a code fix, not a test modification.

### Fork-specific tests confirmation

- **D-06:** TEST-04 requires all 5 fork-specific tests to be **present** and **passing** individually. The plan must run each of these explicitly (not just rely on the aggregate count):
  - `tests/negative-framing-scan.test.cjs`
  - `tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs`
  - `tests/ios-scaffold-safety.test.cjs`
  - `tests/execute-phase-wave.test.cjs`
  - `tests/agent-frontmatter.test.cjs`

### Test count target

- **D-07:** `npm test` must exit 0 with total test count ≥3941 (roadmap requirement). Current count is 4112 — well above the baseline. Target is 4112/4112.

### Claude's Discretion

- Order in which the 24 agents are updated (batch vs. file-by-file)
- Whether to do the MANAGED_HOOKS fix or the `<role>` → `<persona>` pass first
- Whether to run `npm test` incrementally or once at the end

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Fork Standards
- `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md` — Defines `<persona>` as the canonical XML block for agent role/voice/identity (see table at line ~235). The authoritative reference for the fix approach in D-02 and D-03.

### Test Files (failures to fix)
- `tests/verification-overrides.test.cjs` — Lines 216–228: the failing structural test. Check `</persona>` assertion. **Fix: update agents, not this test.**
- `tests/managed-hooks.test.cjs` — The MANAGED_HOOKS sync test. **Fix: add entry to gsd-check-update-worker.js.**

### File to update (MANAGED_HOOKS)
- `hooks/gsd-check-update-worker.js` — Contains the `MANAGED_HOOKS` array. Add `gsd-read-injection-scanner.js`.

### Fork-specific test files (must be present and passing — TEST-04)
- `tests/negative-framing-scan.test.cjs`
- `tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs`
- `tests/ios-scaffold-safety.test.cjs`
- `tests/execute-phase-wave.test.cjs`
- `tests/agent-frontmatter.test.cjs`

### Phase Requirements
- `.planning/REQUIREMENTS.md` §Test Suite — TEST-01 through TEST-04 define the success checks for this phase
- `.planning/ROADMAP.md` §Phase 10 — Four success criteria with exact verification commands

### Prior Phase Context
- `.planning/phases/07-merge-and-conflict-resolution/07-CONTEXT.md` §D-06, D-07 — Established precedent: tests modified when they conflict with fork standards; upstream-introduced failures are Phase 10 scope
- `.planning/phases/09-fork-standards-pass/09-CONTEXT.md` §D-04 — No-regressions gate; Phase 9 expected 14 failures but left only 2

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `npm test` — Full test suite gate. Currently 4110/4112. Target: 4112/4112.
- `node --test tests/<file>.test.cjs` — Run individual test files for targeted verification.

### Established Patterns
- **Agents use `<role>` today** (24 agents) — the rename to `<persona>` restores V09 compliance; content inside the block is unchanged
- **Tests modified to reflect fork behavior** — established precedent from Phase 7 and Phase 9. Exception here: the `</persona>` test is correct per V09, so the fix is to the agent files
- **Frontmatter preservation** — YAML frontmatter (`name`, `description`, `tools`, `color`, `hooks`) must not be touched during any content edits; `agent-frontmatter.test.cjs` validates on every `npm test` run

### Integration Points
- `agents/gsd-*.md` — 24 files need `<role>` → `<persona>` rename in the block opening and closing tags
- `hooks/gsd-check-update-worker.js` — `MANAGED_HOOKS` array needs one entry added

</code_context>

<specifics>
## Specific Ideas

- The `<role>` → `<persona>` rename is a pure tag rename: `<role>` → `<persona>` and `</role>` → `</persona>`. No content inside the block should change.
- The upstream commit `c5e77c8` that introduced `<role>` is: `feat(agents): enforce size budget + extract duplicated boilerplate (#2361) (#2362)` — this context helps if git blame is needed to understand the change.
- The managed hook file to add is exactly: `gsd-read-injection-scanner.js` (the `.js` extension variant — note the test also checks `.sh` hooks separately and that test passes).

</specifics>

<deferred>
## Deferred Ideas

- Full V09 structural audit across all 24 agents that are getting `<persona>` restored — Phase 10 scope is only the tag rename; deeper V09 quality review is a future pass if desired.

</deferred>

---

*Phase: 10-test-suite-green*
*Context gathered: 2026-04-19*
