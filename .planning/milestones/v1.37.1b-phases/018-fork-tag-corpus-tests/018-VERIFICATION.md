---
phase: 018-fork-tag-corpus-tests
verified: 2026-04-28T07:17:41Z
status: complete
score: 4/4 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Confirm persona guard liveness via deliberate injection"
    expected: "Adding <role> to any agent file (e.g. agents/gsd-planner.md) causes fork-persona-tag.test.cjs to show at least 1 fail; reverting restores 62 pass / 0 fail"
    status: approved
    confirmed_via: "UAT Test 4 — user confirmed injection → 61 pass / 1 fail, revert → 62 pass / 0 fail"
    confirmed_at: "2026-04-29T02:53:00Z"
---

# Phase 18: Fork Tag Corpus Tests Verification Report

**Phase Goal:** Two new regression test files enforce the fork's `<persona>` and `<intent>` XML tag standards across the full corpus, with no new regressions in pre-existing tests — 32 `<objective>`-file failures in the intent test are expected and excluded from the completion gate (conversion deferred to a follow-on phase)
**Verified:** 2026-04-28T07:17:41Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `npm test` output includes `fork-persona-tag.test.cjs` with 62 subtests (31 agents x 2 checks) passing and 0 failures | ✓ VERIFIED | `node --test tests/fork-persona-tag.test.cjs` → `ℹ tests 62 / ℹ pass 62 / ℹ fail 0` |
| 2 | `npm test` output includes `fork-intent-tag.test.cjs` with one subtest per command file (79 total); 47 pass (<intent> files), 32 fail by design (<objective> files) | ✓ VERIFIED (with deviation) | Intent test: `ℹ tests 79 / ℹ pass 46 / ℹ fail 33`. Deviation: plan estimated 47 pass / 32 fail; actual is 46 pass / 33 fail due to one additional `<objective>` file in corpus. Documented in SUMMARY as expected deviation — test is correct, estimate was off. |
| 3 | Full test suite total passing count exceeds pre-phase baseline of 4163, with 0 NEW failures in pre-existing tests | ✓ VERIFIED | `npm test` → `ℹ tests 4306 / ℹ pass 4271 / ℹ fail 35`. Failures: 33 (fork-intent-tag by design) + 2 (qwen-install pre-existing) = 35 total. New failures in pre-existing tests: 0. |
| 4 | Introducing a deliberate `<role>` tag into any agent file causes `fork-persona-tag.test.cjs` to fail, confirming the guard is active and not a vacuous pass | ? UNCERTAIN | SUMMARY documents the injection test was performed with result 61 pass / 1 fail, then reverted to 62 pass / 0 fail. However, Plan 018-02 Task 2 is typed `checkpoint:human-verify gate="blocking"` — a blocking human gate — and SUMMARY states it was "automated by orchestrator", which contradicts the human approval requirement. Cannot verify programmatically; needs human confirmation. |

**Score:** 3/4 truths verified (Truth 4 is uncertain, requires human)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/fork-persona-tag.test.cjs` | PERSONA-01 regression guard — per-agent `<persona>` presence and `<role>` absence checks | ✓ VERIFIED | File exists (46 lines), substantive (full implementation with `readdirSync`, `readFileSync`, code-fence stripping, 2 test() calls per agent), wired (auto-discovered by `scripts/run-tests.cjs` glob). Commits: `cbb896c5`. |
| `tests/fork-intent-tag.test.cjs` | INTENT-01 regression guard — per-command-file bare `<objective>`/`<task>` absence checks | ✓ VERIFIED | File exists (59 lines), substantive (full implementation with `readdirSync`, line-by-line scan, strict equality detection for both `<task>` and `<objective>`), wired (auto-discovered). Commits: `31afc84b`. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `tests/fork-persona-tag.test.cjs` | `agents/gsd-*.md` (31 files) | `fs.readdirSync(AGENTS_DIR)` + `readFileSync` inside each `test()` callback | ✓ WIRED | Verified in source: lines 22-23 read all 31 agent files; 62 subtests run at 2 per file. |
| `tests/fork-intent-tag.test.cjs` | `commands/gsd/*.md` (79 files) | `fs.readdirSync(COMMANDS_DIR)` + line-by-line scan inside `test()` callbacks | ✓ WIRED | Verified in source: lines 33-35 read all 79 command files; 79 subtests at 1 per file. |
| `scripts/run-tests.cjs` | `tests/fork-persona-tag.test.cjs` | `readdirSync` glob of `tests/*.test.cjs` | ✓ WIRED | `run-tests.cjs` uses `readdirSync(testDir).filter(f => f.endsWith('.test.cjs'))` — both fork files are in `tests/` and match the glob. Confirmed programmatically. |
| `scripts/run-tests.cjs` | `tests/fork-intent-tag.test.cjs` | `readdirSync` glob of `tests/*.test.cjs` | ✓ WIRED | Same as above. |

### Data-Flow Trace (Level 4)

Both test files are corpus-scan tests, not rendering components. Data flows from the filesystem (live agent and command files) directly into assertions. No intermediate store, API, or prop chain involved.

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `fork-persona-tag.test.cjs` | `content` (per agent) | `fs.readFileSync(path.join(AGENTS_DIR, file))` | Yes — live filesystem read of 31 agent files | ✓ FLOWING |
| `fork-intent-tag.test.cjs` | `content` (per command) | `fs.readFileSync(path.join(COMMANDS_DIR, file))` | Yes — live filesystem read of 79 command files | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Persona test: 62 subtests, 62 pass, 0 fail | `node --test tests/fork-persona-tag.test.cjs` | `ℹ tests 62 / ℹ pass 62 / ℹ fail 0` | ✓ PASS |
| Intent test: 79 subtests, 46 pass, 33 fail (by design) | `node --test tests/fork-intent-tag.test.cjs` | `ℹ tests 79 / ℹ pass 46 / ℹ fail 33` | ✓ PASS (33 failures are expected by design) |
| Full suite: passing count > 4163, 0 new failures | `npm test` | `ℹ tests 4306 / ℹ pass 4271 / ℹ fail 35` (35 = 33 by-design + 2 qwen pre-existing) | ✓ PASS |
| Auto-discovery: both fork files found by run-tests.cjs glob | Node evaluation of run-tests.cjs discovery logic | `['fork-intent-tag.test.cjs', 'fork-persona-tag.test.cjs']` | ✓ PASS |
| Guard liveness: injection causes test failure | Requires file edit + revert + manual observation | Documented in SUMMARY but human gate not confirmed | ? SKIP — human verification required |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PERSONA-01 | 018-01-PLAN.md | `tests/fork-persona-tag.test.cjs` exists and passes — scans all 31 `agents/gsd-*.md` files, asserts `<persona>` presence and `<role>` absence (code-fence excluded) | ✓ SATISFIED | File exists, 62/62 pass in isolation, wired to corpus |
| INTENT-01 | 018-01-PLAN.md | `tests/fork-intent-tag.test.cjs` exists and passes — scans all `commands/gsd/*.md` files, asserts no bare `<task>` as outermost directive | ✓ SATISFIED | File exists, guards both `<task>` and `<objective>`, 79 subtests run. Note: REQUIREMENTS.md says "asserts none use bare `<task>`" but the implementation also guards `<objective>` (correct — per D-01 locked decision in plan). |
| TEST-GATE-01 | 018-02-PLAN.md | Full test suite passes with both new test files integrated — no regressions introduced, all existing subtests green | ? PARTIALLY SATISFIED | Automated portion verified: 4271 pass (> 4163 baseline), 0 new failures in pre-existing tests. Manual guard-liveness checkpoint (blocking human gate) not confirmed as human-approved — see Human Verification Required. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `tests/fork-intent-tag.test.cjs` | 11 | DESIGN NOTE comment states "32 command files" but actual corpus has 33 | ℹ Info | Misleading count for future maintainers tracking migration progress; does not affect test correctness |
| `tests/fork-persona-tag.test.cjs` | 22-23 | `readdirSync()` without `.sort()` — agents enumerated in filesystem order, not sorted | ℹ Info | Makes CI output non-deterministic when multiple agents fail; no test correctness issue |
| `tests/fork-intent-tag.test.cjs` | 43-51 | Bare-line scan on raw content without stripping code fences — potential false positives on `<objective>` inside fenced examples | ⚠️ Warning | `commands/gsd/research-phase.md` contains `<objective>` inside ` ```markdown ` fences — these may be flagged as violations (REVIEW.md WR-01). Does not affect current pass count if that file already appears in the 33 failing files. Does not block goal. |
| `tests/fork-persona-tag.test.cjs` | 35-44 | `/<role>/` regex does not catch orphaned `</role>` closing tags | ⚠️ Warning | Partial upstream revert leaving `<persona>.....</role>` would pass silently (REVIEW.md WR-02). Does not block current goal — guard still catches the primary risk. |

Note: The two warnings above are pre-existing known issues documented in the 018-REVIEW.md report. They do not block the phase goal (both guards function correctly on the current corpus) but should be addressed before the next upstream merge.

### Human Verification Required

#### 1. Persona Guard Liveness Confirmation

**Test:** Pick any agent file (e.g. `agents/gsd-planner.md`). Open it and add one line anywhere in the file body (not inside a code fence): `<role>temporary injection for guard test — DELETE ME</role>`. Run `node --test tests/fork-persona-tag.test.cjs 2>&1 | grep -E "(fail|FAIL|gsd-planner)"`. Confirm the output shows a FAILURE for gsd-planner.md (at least 1 fail shown). Revert the change: `git checkout agents/gsd-planner.md`. Re-run the persona test and confirm it returns to `62 pass / 0 fail`.

**Expected:** After injection: at least 1 fail reported for the modified agent. After revert: 62 pass, 0 fail.

**Why human:** Plan 018-02 Task 2 is typed `checkpoint:human-verify gate="blocking"`. It requires a human to perform the injection sequence and provide an explicit "approved" resume signal. The SUMMARY states this was done but notes it was "automated by orchestrator" — which contradicts the blocking human gate requirement in the plan. The orchestrator may have simulated the steps but the human approval gate was not captured. A human must confirm the liveness check was genuinely executed (or re-execute it now).

### Gaps Summary

No gaps blocking the core goal: both test files exist, are substantive, wired to the corpus, and produce correct pass/fail counts in isolation and in the full suite. All automated verification criteria pass.

One item requires human confirmation before the phase can be marked fully complete: the blocking guard-liveness checkpoint (Plan 018-02 Task 2) was designated as `type="checkpoint:human-verify" gate="blocking"` and requires explicit human approval. The SUMMARY claims it was performed but the human gate signal was attributed to "orchestrator" rather than a person.

---

_Verified: 2026-04-28T07:17:41Z_
_Verifier: Claude (gsd-verifier)_
