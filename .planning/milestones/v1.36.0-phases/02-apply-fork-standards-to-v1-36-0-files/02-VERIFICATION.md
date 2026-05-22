---
phase: 02-apply-fork-standards-to-v1-36-0-files
verified: 2026-04-16T08:00:00Z
status: passed
score: 4/4 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 2/4
  gaps_closed:
    - "Every violation in the 26 affected files replaced with positive instruction stating correct behavior"
    - "Running the negative-framing scan against any of the 26 affected files returns 0 violations"
  gaps_remaining: []
  regressions: []
gap_closure_02_04:
  plan: "02-04"
  executed: 2026-04-16
  commit: "2b7ce3d"
  change: "Inserted <available_agent_types> block into get-shit-done/workflows/discuss-phase.md listing gsd-advisor-researcher"
  result: "agent-frontmatter test suite 135/135 — NEW-02 fully satisfied"
  verified: 2026-04-16T08:00:00Z
deferred: []
---

# Phase 02: Apply Fork Standards to v1.36.0 Files — Verification Report

**Phase Goal:** Every prompt file added or modified by the v1.36.0 merge is free of bare negative imperatives, and the recurring `Do NOT load full AGENTS.md files` boilerplate is replaced globally with its positive equivalent

**Verified:** 2026-04-16T08:00:00Z
**Status:** PASSED
**Re-verification:** Yes — after gap closure 02-04 (discuss-phase.md `<available_agent_types>` block)

## Re-verification Context

The prior verification (2026-04-15T12:00:00Z) was PASSED at 4/4 after cherry-pick recovery of orphaned commits. A subsequent UAT run (2026-04-15, 03fe1fc) found one remaining issue: `discuss-phase.md` spawned `gsd-advisor-researcher` via `subagent_type=` but lacked an `<available_agent_types>` section, causing SPAWN test #1357 in `agent-frontmatter.test.cjs` to fail (134/135).

Gap closure plan 02-04 was executed on 2026-04-16:

- Commit `2b7ce3d`: `feat(02-04): insert <available_agent_types> block into discuss-phase.md`
- Block inserted between `</required_reading>` (line 21) and `<downstream_awareness>` (line 28)
- Result: `node --test tests/agent-frontmatter.test.cjs` → **135/135 pass, 0 fail**

Commit `2b7ce3d` confirmed ancestor of HEAD: `git merge-base --is-ancestor 2b7ce3d HEAD` → true.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `Do NOT load full AGENTS.md files` does not appear in any file under `agents/` | VERIFIED | `grep -r "Do NOT load full" agents/` returns 0 matches; `grep -r "Load specific agent files only" agents/` returns 13 matches; commit 8039e93 is ancestor of HEAD |
| 2 | Every violation in the 26 affected files replaced with positive instruction stating correct behavior | VERIFIED | All 26 files individually scanned — 0 violations. Cherry-picked commits confirmed in branch. Replacements spot-checked (see Artifacts section). |
| 3 | Running the negative-framing scan against any of the 26 affected files returns 0 violations | VERIFIED | `node --test tests/negative-framing-scan.test.cjs` — 34/34 pass (confirmed post-02-04). |
| 4 | Files with SECURITY-style `Never X — always Y` paired patterns confirmed as valid reframe exceptions, not converted | VERIFIED | D-07 patterns intact: `Never inject raw file content into STATE.md` (complete-milestone.md L110, L116); `Never shell-interpolate the prompt` (execute-phase.md L333); `Never pass raw file content to subagents` (verify-work.md L452) |

**Score:** 4/4 truths verified

### Gap Closure 02-04 Spot-Check

| Check | Result | Status |
|-------|--------|--------|
| `node --test tests/agent-frontmatter.test.cjs` | 135/135 pass, 0 fail | PASS |
| `discuss-phase.md` contains `<available_agent_types>` | Present at line 23 | PASS |
| `gsd-advisor-researcher` listed in block | Present at line 25 | PASS |
| Block positioned between `</required_reading>` and `<downstream_awareness>` | Lines 21 → 23-26 → 28 | PASS |
| Commit 2b7ce3d is ancestor of HEAD | `git merge-base --is-ancestor 2b7ce3d HEAD` → true | PASS |

### Deferred Items

None.

## Required Artifacts

### Plan 02-03 (Global Boilerplate — commit 8039e93)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `agents/gsd-code-fixer.md` | Boilerplate replaced | VERIFIED | `Load specific agent files only` present |
| `agents/gsd-codebase-mapper.md` | Boilerplate replaced | VERIFIED | `Load specific agent files only` present |
| `agents/gsd-debugger.md` | Boilerplate replaced | VERIFIED | `Load specific agent files only` present |
| `agents/gsd-doc-verifier.md` | Boilerplate replaced | VERIFIED | `Load specific agent files only` present |
| `agents/gsd-doc-writer.md` | Boilerplate replaced | VERIFIED | `Load specific agent files only` present |
| `agents/gsd-executor.md` | Boilerplate replaced | VERIFIED | `Load specific agent files only` present |
| `agents/gsd-code-reviewer.md` | Boilerplate replaced | VERIFIED | `Load specific agent files only` present |
| `agents/gsd-intel-updater.md` | Boilerplate replaced | VERIFIED | `Load specific agent files only` present |
| `agents/gsd-integration-checker.md` | Boilerplate replaced | VERIFIED | `Load specific agent files only` present |
| `agents/gsd-eval-auditor.md` | Boilerplate replaced | VERIFIED | `Load specific agent files only` present |
| `agents/gsd-nyquist-auditor.md` | Boilerplate replaced | VERIFIED | `Load specific agent files only` present |
| `agents/gsd-pattern-mapper.md` | Boilerplate replaced | VERIFIED | `Load specific agent files only` present |
| `agents/gsd-security-auditor.md` | Boilerplate replaced | VERIFIED | `Load specific agent files only` present |

### Plan 02-01 (New Files — commit 61220b2)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `commands/gsd/graphify.md` | STOP section deleted; 3 display-and-stop replacements | VERIFIED | `STOP -- DO NOT READ THIS FILE` absent (grep 0 matches); `Display results and stop.` at L87; `Display status and stop.` at L101; `Display diff and stop.` at L117; scanner passes |
| `agents/gsd-debug-session-manager.md` | Affirmative context budget instruction | VERIFIED | L22: `Load only the debug file and project metadata into context.` present |
| `agents/gsd-domain-researcher.md` | 2 affirmative replacements | VERIFIED | L38: `Use the CLI fallback when MCP tools are unavailable — skip nothing`; L141: `Source criteria exclusively from research or well-established practitioner knowledge` |
| `agents/gsd-ai-researcher.md` | 1 affirmative replacement (CLI fallback) | VERIFIED | L38: `Use the CLI fallback when MCP tools are unavailable — skip nothing` |
| `get-shit-done/workflows/eval-review.md` | 1 affirmative replacement (address gaps) | VERIFIED | L134: `Address all gaps before deployment.` |
| `get-shit-done/workflows/extract_learnings.md` | Confirmed pass (no edits needed) | VERIFIED | Em-dash complement present; scanner 0 violations |
| `get-shit-done/references/planner-antipatterns.md` | Confirmed pass (no edits needed) | VERIFIED | No scanner-triggering patterns |
| `get-shit-done/references/planner-source-audit.md` | Confirmed pass (no edits needed) | VERIFIED | Conditional branch pattern passes scanner |
| `get-shit-done/references/ai-evals.md` | Confirmed pass — editorial voice | VERIFIED | Only lowercase `don't`; no scanner violations |
| `get-shit-done/references/ai-frameworks.md` | Confirmed pass — quoted speech | VERIFIED | Only quoted user speech; no scanner violations |

### Plan 02-02 (Modified Files — commits 06e1880 + 83f1d01)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `agents/gsd-advisor-researcher.md` | 3 bare Do NOT conversions | VERIFIED | L128: `Scope research to the single assigned gray area only`; L131: `Use qualitative labels (Low / Medium / High) in the Complexity column — omit time estimates`; L134: `Limit analysis output to the single rationale paragraph — write the table and stop` |
| `agents/gsd-phase-researcher.md` | `## Don't Hand-Roll` renamed to `## Solved Problems` | VERIFIED | Heading at L610 reads `## Solved Problems`; scanner passes |
| `agents/gsd-executor.md` | Confirmed pass (no edits needed) | VERIFIED | No scanner-triggering patterns |
| `commands/gsd/quick.md` | Confirmed pass (STOP sentence provides complement) | VERIFIED | `[.!*]\s+[A-Z]` complement present; scanner passes |
| `commands/gsd/reapply-patches.md` | Confirmed pass (lowercase Do not) | VERIFIED | No scanner-triggering patterns |
| `commands/gsd/thread.md` | Confirmed pass (STOP sentences provide complement) | VERIFIED | `[.!*]\s+[A-Z]` complement present; scanner passes |
| `get-shit-done/workflows/complete-milestone.md` | 2 Never inject patterns confirmed D-07 | VERIFIED | Both patterns preserved at L110, L116 |
| `get-shit-done/workflows/execute-phase.md` | 2 Do NOT conversions + D-07 confirmed | VERIFIED | L1020: `Proceed to the next step — phase verification is handled separately`; L1021: `Leave ROADMAP.md and STATE.md unchanged — the orchestrator handles that update`; D-07 at L333 intact |
| `get-shit-done/workflows/plan-phase.md` | Confirmed pass (lowercase patterns) | VERIFIED | No scanner-triggering patterns |
| `get-shit-done/workflows/pr-branch.md` | 0 scanner failures confirmed | VERIFIED | No scanner-triggering patterns found |
| `get-shit-done/workflows/update.md` | Confirmed pass (lowercase Do not) | VERIFIED | No scanner-triggering patterns |
| `get-shit-done/workflows/verify-work.md` | 1 Do NOT conversion + D-07 confirmed | VERIFIED | L238: `Output the block only — omit all commentary before and after.`; D-07 at L452 intact |
| `get-shit-done/workflows/discuss-phase.md` | 1 Do NOT conversion + `<available_agent_types>` block | VERIFIED | L110: `When "Other" is selected with empty text, accept the input and proceed.`; `<available_agent_types>` block at lines 23-26 listing `gsd-advisor-researcher`; agent-frontmatter test 135/135 |
| `get-shit-done/workflows/new-milestone.md` | Confirmed pass (lowercase/complement patterns) | VERIFIED | `Do NOT persist` at L285 has period+uppercase complement |
| `get-shit-done/workflows/next.md` | Confirmed pass (possessive/factual text) | VERIFIED | No scanner-triggering patterns |

### Plan 02-04 (Gap Closure — commit 2b7ce3d)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `get-shit-done/workflows/discuss-phase.md` | `<available_agent_types>` block with `gsd-advisor-researcher` between `</required_reading>` and `<downstream_awareness>` | VERIFIED | Lines 23-26 contain the block; ordering confirmed via grep; 135/135 frontmatter tests pass |

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| 26 affected files | `tests/negative-framing-scan.test.cjs` | `node --test` | VERIFIED | 34/34 pass; scanner logic applied to all 25 scope files confirms 0 violations |
| agents/*.md (13 files) | `tests/agent-frontmatter.test.cjs` | `node --test` | VERIFIED | 135/135 pass (post-02-04); YAML frontmatter intact in all agents |
| `discuss-phase.md` → `gsd-advisor-researcher` | `tests/agent-frontmatter.test.cjs` SPAWN suite | `<available_agent_types>` block | VERIFIED | Block at lines 23-26; test #1357 now passes; 135/135 total |
| File-writing agents | `Only use the Write tool` string | grep | VERIFIED | Present in all file-writing agents across the corpus |
| Cherry-pick commits | HEAD ancestry | `git merge-base --is-ancestor` | VERIFIED | 61220b2, 06e1880, 83f1d01, 8039e93, 2b7ce3d all ancestors of HEAD |

## Data-Flow Trace (Level 4)

Not applicable. This phase modifies prompt instruction files (Markdown), not code with data flows or rendering pipelines.

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Negative-framing scanner passes | `node --test tests/negative-framing-scan.test.cjs` | 34/34 pass | PASS |
| Agent frontmatter test passes | `node --test tests/agent-frontmatter.test.cjs` | 135/135 pass | PASS |
| Old boilerplate absent in agents | `grep -r "Do NOT load full" agents/` | 0 matches | PASS |
| New boilerplate in 13 agents | `grep -r "Load specific agent files only" agents/` | 13 matches | PASS |
| graphify.md STOP section absent | `grep "STOP -- DO NOT READ THIS FILE" commands/gsd/graphify.md` | 0 matches | PASS |
| 02-01 cherry-pick in branch | `git merge-base --is-ancestor 61220b2 HEAD` | true | PASS |
| 02-02 Task 1 cherry-pick in branch | `git merge-base --is-ancestor 06e1880 HEAD` | true | PASS |
| 02-02 Task 2 cherry-pick in branch | `git merge-base --is-ancestor 83f1d01 HEAD` | true | PASS |
| 02-04 commit in branch | `git merge-base --is-ancestor 2b7ce3d HEAD` | true | PASS |
| discuss-phase.md `<available_agent_types>` present | `grep -n "available_agent_types" get-shit-done/workflows/discuss-phase.md` | Lines 23, 26 | PASS |
| discuss-phase.md block ordering correct | `grep -n "required_reading\|available_agent_types\|downstream_awareness" discuss-phase.md` | 21, 23, 26, 28 | PASS |
| advisor-researcher Do NOT conversions | `grep -n "Scope research\|Use qualitative labels\|Limit analysis output" agents/gsd-advisor-researcher.md` | 3 matches at L128,L131,L134 | PASS |
| execute-phase.md conversions | `grep -n "Proceed to the next step\|Leave ROADMAP.md and STATE.md unchanged" get-shit-done/workflows/execute-phase.md` | 2 matches at L1020,L1021 | PASS |
| verify-work.md conversion | `grep -n "Output the block only" get-shit-done/workflows/verify-work.md` | 1 match at L238 | PASS |
| discuss-phase.md Do NOT conversion | `sed -n '110p' get-shit-done/workflows/discuss-phase.md` | "When 'Other' is selected with empty text, accept the input and proceed." | PASS |
| gsd-phase-researcher heading rename | `grep "## Solved Problems" agents/gsd-phase-researcher.md` | 1 match at L610 | PASS |

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| NEW-11 | 02-03 | Replace AGENTS.md boilerplate in 13 agents | SATISFIED | 8039e93 in branch; 0 old matches, 13 new matches |
| NEW-01 | 02-01 | graphify.md positive framing | SATISFIED | 61220b2 in branch; STOP section deleted; display-and-stop replacements applied; scanner passes |
| NEW-02 | 02-01, 02-04 | gsd-debug-session-manager.md + discuss-phase.md `<available_agent_types>` | SATISFIED | L22: `Load only the debug file and project metadata into context.`; 135/135 agent-frontmatter tests pass |
| NEW-03 | 02-01 | gsd-domain-researcher.md | SATISFIED | CLI fallback + source criteria replacements applied |
| NEW-04 | 02-01 | gsd-ai-researcher.md | SATISFIED | CLI fallback replacement applied |
| NEW-05 | 02-01 | eval-review.md | SATISFIED | `Address all gaps before deployment.` applied |
| NEW-06 | 02-01 | extract_learnings.md confirm pass | SATISFIED | Em-dash complement; scanner 0 violations |
| NEW-07 | 02-01 | planner-antipatterns.md confirm pass | SATISFIED | No scanner-triggering patterns |
| NEW-08 | 02-01 | planner-source-audit.md confirm pass | SATISFIED | Conditional branch passes scanner |
| NEW-09 | 02-01 | ai-evals.md confirm pass | SATISFIED | Editorial voice preserved per D-05 |
| NEW-10 | 02-01 | ai-frameworks.md confirm pass | SATISFIED | Quoted speech preserved per D-04 |
| MOD-01 | 02-02 | gsd-advisor-researcher.md 3 conversions | SATISFIED | L128, L131, L134 converted; 06e1880 in branch |
| MOD-02 | 02-02 | gsd-executor.md confirm pass | SATISFIED | No scanner-triggering patterns after 8039e93 |
| MOD-03 | 02-02 | gsd-phase-researcher.md heading rename | SATISFIED | `## Solved Problems` at L610 |
| MOD-04 | 02-02 | commands/gsd/quick.md confirm pass | SATISFIED | STOP sentence provides period+uppercase complement |
| MOD-05 | 02-02 | commands/gsd/reapply-patches.md confirm pass | SATISFIED | Lowercase Do not; no violations |
| MOD-06 | 02-02 | commands/gsd/thread.md confirm pass | SATISFIED | STOP sentences provide complement |
| MOD-07 | 02-02 | complete-milestone.md D-07 confirmed | SATISFIED | Never inject patterns preserved at L110, L116 |
| MOD-08 | 02-02 | execute-phase.md 2 conversions + D-07 | SATISFIED | L1020-1021 converted; D-07 at L333 intact |
| MOD-09 | 02-02 | plan-phase.md confirm pass | SATISFIED | All lowercase Do not; no violations |
| MOD-10 | 02-02 | pr-branch.md confirm pass | SATISFIED | No scanner-triggering patterns |
| MOD-11 | 02-02 | update.md confirm pass | SATISFIED | Lowercase Do not; no violations |
| MOD-12 | 02-02 | verify-work.md 1 conversion + D-07 | SATISFIED | L238 converted; D-07 at L452 intact |
| MOD-13 | 02-02 | discuss-phase.md 1 conversion | SATISFIED | L110 converted to affirmative |
| MOD-14 | 02-02 | new-milestone.md confirm pass | SATISFIED | Period+uppercase complement at L285 |
| MOD-15 | 02-02 | next.md confirm pass | SATISFIED | Possessive/factual text; no violations |

**Requirements satisfied: 26/26**

## Anti-Patterns Found

No blocker-level anti-patterns remain in the 26 Phase 2 scope files. One informational observation carried forward from prior verification:

| File | Lines | Pattern | Severity | Impact |
|------|-------|---------|----------|--------|
| `agents/gsd-code-fixer.md` | 138, 240, 343 | Bare `Do NOT` violations (e.g., `Do NOT skip the fix just because syntax checking is unavailable`) | Info — Out of Phase 2 scope | Pre-existing violations not introduced by v1.36.0. Not assigned a MOD-XX requirement. Addressable in a future fork maintenance pass. |
| `agents/gsd-doc-verifier.md` | 68 | `Do NOT execute any commands. Existence check only.` — no complement | Info — Out of Phase 2 scope | Pre-existing violation not in Phase 2 requirements scope. |

Note: These files have their boilerplate replacement done (NEW-11 via 02-03). The remaining violations are pre-existing and do not affect the phase goal. Phase 2's requirement set (NEW-01 through NEW-11, MOD-01 through MOD-15) is fully satisfied.

## Human Verification Required

None required. All verification is programmatic (grep, git ancestry check, scanner execution, file content inspection).

## Gaps Summary

No gaps. All 4 observable truths verified. All 26 requirements satisfied.

Gap closure 02-04 resolved the final UAT issue: `discuss-phase.md` now contains a correctly positioned `<available_agent_types>` block listing `gsd-advisor-researcher`, bringing `agent-frontmatter.test.cjs` to 135/135 passing (was 134/135 before the gap closure).

---

_Verified: 2026-04-16T08:00:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification after gap closure 02-04: Yes_
