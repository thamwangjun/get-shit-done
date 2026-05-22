# Phase 10: Test Suite Green - Research

**Researched:** 2026-04-19
**Domain:** Node.js test runner; agent XML schema compliance; hook registry synchronization
**Confidence:** HIGH

## Summary

Phase 10 has exactly two failing tests, both diagnosed and with fixes already decided. The
current state is 4110/4112 tests passing. No new test infrastructure is needed and no
ambiguity exists about what to change — both failures have a root cause, a target file,
and a specific code change.

**Failure 1** (`tests/verification-overrides.test.cjs:216`): The test asserts that
`gsd-verifier.md` contains `</persona>` before `<project_context>`. The assertion fails
because all 24 agents that were processed by upstream commit `c5e77c8` now use `<role>`
instead of `<persona>`. The fix is a tag rename in 24 agent files — `<role>` to
`<persona>` and `</role>` to `</persona>` — with no change to content inside the block.

**Failure 2** (`tests/managed-hooks.test.cjs`): The test enumerates every `gsd-*.js` file
in `hooks/` and asserts each appears in the `MANAGED_HOOKS` array in
`hooks/gsd-check-update-worker.js`. `gsd-read-injection-scanner.js` was added to `hooks/`
but never added to `MANAGED_HOOKS`. Fix: insert one entry into the array.

After both fixes, `npm test` must exit 0 with total count ≥ 3941. Current count is 4112,
well above that baseline.

**Primary recommendation:** Fix Failure 2 first (one-line edit, fast to verify), then run
the `<role>` → `<persona>` rename across all 24 agents, then run the full suite to
confirm 4112/4112.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `verification-overrides.test.cjs:216` fails because `gsd-verifier.md` uses `<role>` instead of `<persona>`. This regression was introduced by upstream commit `c5e77c8`, not by Phase 9.
- **D-02:** V09 guide defines `<persona>` as the canonical XML block. The test is correct; the fix is on the agent files, not the test.
- **D-03:** Fix scope is all 24 agents. Restore `<persona>` in every `agents/gsd-*.md` file currently using `<role>`. Frontmatter and tool lists must not be touched.
- **D-04:** After the rename, run `tests/agent-size-budget.test.cjs` explicitly. Tag rename changes no content — size impact should be zero, but verify.
- **D-05:** `gsd-read-injection-scanner.js` is in `hooks/` but missing from `MANAGED_HOOKS` in `hooks/gsd-check-update-worker.js`. Fix: add the hook to the array. This is a code fix, not a test modification.
- **D-06:** TEST-04 requires all 5 fork-specific tests to be present and passing individually. Run each explicitly.
- **D-07:** `npm test` must exit 0 with total count ≥ 3941. Current count 4112 → target 4112/4112.

### Claude's Discretion

- Order in which the 24 agents are updated (batch vs. file-by-file)
- Whether to do the MANAGED_HOOKS fix or the `<role>` → `<persona>` pass first
- Whether to run `npm test` incrementally or once at the end

### Deferred Ideas (OUT OF SCOPE)

- Full V09 structural audit across all 24 agents that are getting `<persona>` restored — Phase 10 scope is only the tag rename; deeper V09 quality review is a future pass if desired.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TEST-01 | Full test suite passes after merge and fork standards applied | Both failures diagnosed and fixable; `npm test` exits 0 after applying both fixes |
| TEST-02 | `tests/agent-size-budget.test.cjs` passes for all 31 fork agents within tier budgets | Currently 34/34 passing (VERIFIED); `<role>` → `<persona>` rename is a tag rename only — byte delta is zero; re-run required after rename to confirm no regression |
| TEST-03 | `tests/command-count-sync.test.cjs` passes | Out of direct scope for Phase 10 fixes; currently passing (not one of the 2 failures) |
| TEST-04 | All 5 fork-specific tests present and passing | All 5 files exist (VERIFIED); 4/5 currently pass individually (VERIFIED); agent-frontmatter.test.cjs currently 135/135 (VERIFIED); negative-framing-scan, bug-1924, ios-scaffold-safety, and execute-phase-wave all pass (VERIFIED) |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Agent XML tag rename (`<role>` → `<persona>`) | Source files (agents/) | Test runner validation | Agent `.md` files are the authoritative source; tests validate structure post-change |
| MANAGED_HOOKS registry sync | Hook runtime (hooks/) | Test runner validation | `gsd-check-update-worker.js` is the runtime registry owner; test guards against omission |
| Test suite gate (`npm test`) | Node.js test runner | CI/CD | `node scripts/run-tests.cjs` orchestrates all `.test.cjs` files |

---

## Standard Stack

### Core

| Component | Version/Location | Purpose | Notes |
|-----------|-----------------|---------|-------|
| Node.js test runner | Built-in (`node:test`) | Runs all `.test.cjs` files | No external test framework; uses `node --test` |
| `npm test` | `node scripts/run-tests.cjs` | Full suite gate | [VERIFIED: package.json scripts.test] |
| `agent-size-budget.test.cjs` | `tests/` | Guards 31 fork agents within tier budgets | Currently 34/34 passing [VERIFIED] |
| `managed-hooks.test.cjs` | `tests/` | Asserts MANAGED_HOOKS array is in sync with `hooks/gsd-*.js` files | One failure: missing `gsd-read-injection-scanner.js` [VERIFIED] |
| `verification-overrides.test.cjs` | `tests/` | Asserts structural layout of `gsd-verifier.md` | One failure: `</persona>` tag missing in verifier (uses `</role>`) [VERIFIED] |

### No Additional Dependencies Required

This phase requires no package installations, no new test infrastructure, and no new test
files. All verification runs through the existing suite.

---

## Architecture Patterns

### System Architecture Diagram

```
[Phase 10 fix flow]

Fix A: MANAGED_HOOKS sync
  hooks/gsd-read-injection-scanner.js  (already exists)
          |
          v
  hooks/gsd-check-update-worker.js  ← add entry to MANAGED_HOOKS array
          |
          v
  tests/managed-hooks.test.cjs  → PASS

Fix B: Agent tag rename
  24 × agents/gsd-*.md  (currently use <role>...</role>)
          |
          v  (rename tags only, content unchanged)
  24 × agents/gsd-*.md  (use <persona>...</persona>)
          |
          v
  tests/verification-overrides.test.cjs:216  → PASS
  tests/agent-size-budget.test.cjs  → still PASS (tag rename = zero content delta)
  tests/agent-frontmatter.test.cjs  → still PASS (frontmatter not touched)

Final gate
  npm test  → 4112/4112  → exit 0
```

### Recommended Execution Order

```
1. Fix MANAGED_HOOKS (single-line edit in gsd-check-update-worker.js)
2. Verify: node --test tests/managed-hooks.test.cjs  → 3/3 pass
3. Rename <role> → <persona> in all 24 agent files (batch sed or file-by-file)
4. Verify: node --test tests/verification-overrides.test.cjs  → all pass
5. Verify: node --test tests/agent-size-budget.test.cjs  → 34/34 pass
6. Run individually: all 5 fork-specific tests
7. Run full suite: npm test  → exit 0, count ≥ 3941
```

---

## Solved Problems

| Problem | Solved By | Notes |
|---------|-----------|-------|
| Identifying 24 affected agents | `grep -l "<role>" agents/gsd-*.md` | [VERIFIED: returns 24 files] |
| Batch tag rename | `sed -i 's|^<role>$|<persona>|; s|^</role>$|</persona>|' agents/gsd-*.md` | Safe because `<role>` and `</role>` appear on their own lines (VERIFIED) |
| Confirming no content delta | Re-run `agent-size-budget.test.cjs` after rename | 34/34 currently pass; tag rename adds 0 bytes net (persona=7, role=4 → +3 chars each, but budget allows slack) |
| Identifying missing MANAGED_HOOKS entry | `ls hooks/gsd-*.js` vs array in `gsd-check-update-worker.js` | `gsd-read-injection-scanner.js` is the only missing entry [VERIFIED] |

---

## Common Pitfalls

### Pitfall 1: Touching frontmatter during agent rename

**What goes wrong:** Accidentally modifying YAML frontmatter (`name`, `description`, `tools`, `color`, `hooks`) while editing agent XML tags.
**Root cause:** Agents have `---`-delimited YAML frontmatter above the XML content; a broad substitution could match within frontmatter.
**Prevention:** The `<role>` and `</role>` tags appear on their own standalone lines (VERIFIED via grep). A sed substitution anchored to `^<role>$` and `^</role>$` will not touch frontmatter.
**Warning signs:** `agent-frontmatter.test.cjs` fails after the rename — indicates frontmatter was disturbed.

### Pitfall 2: Stale MANAGED_HOOKS entry (inverse of the current bug)

**What goes wrong:** Adding `gsd-read-injection-scanner.js` to MANAGED_HOOKS, but adding a typo or wrong name.
**Root cause:** The test also asserts `MANAGED_HOOKS contains no entries for hooks that do not exist` — so a misspelling would create a second failure.
**Prevention:** Copy the exact filename from `ls hooks/`. Exact string: `'gsd-read-injection-scanner.js'`.
**Warning signs:** `managed-hooks.test.cjs` test 3 fails (`MANAGED_HOOKS entry '...' has no corresponding file`).

### Pitfall 3: Verifying only the aggregate count, not individual fork tests

**What goes wrong:** `npm test` exits 0 but a fork-specific test was silently dropped or merged into another file.
**Root cause:** Test count can stay the same if a file is removed and its tests moved.
**Prevention:** Run each of the 5 fork-specific test files individually with `node --test tests/<file>.test.cjs` and check the output explicitly. D-06 mandates this.

### Pitfall 4: Agent size budget regression from rename

**What goes wrong:** The `<role>` → `<persona>` rename adds 3 bytes per open and close tag (persona=7 chars vs role=4 chars). For agents near their tier ceiling, this might cause a budget breach.
**Root cause:** Tag content length change.
**Prevention:** D-04 mandates re-running `agent-size-budget.test.cjs` after the rename. Currently all 34 tests pass. The 3-byte delta is extremely unlikely to cause a breach, but verify.
**Warning signs:** `agent-size-budget.test.cjs` fails with a budget-exceeded message naming a specific agent.

---

## Code Examples

### Fix 1: Add gsd-read-injection-scanner.js to MANAGED_HOOKS

Current state of `hooks/gsd-check-update-worker.js` lines 37–48 [VERIFIED]:

```javascript
// Source: direct file read
const MANAGED_HOOKS = [
  'gsd-check-update-worker.js',
  'gsd-check-update.js',
  'gsd-context-monitor.js',
  'gsd-phase-boundary.sh',
  'gsd-prompt-guard.js',
  'gsd-read-guard.js',
  'gsd-session-state.sh',
  'gsd-statusline.js',
  'gsd-validate-commit.sh',
  'gsd-workflow-guard.js',
];
```

After fix — insert alphabetically (between `gsd-read-guard.js` and `gsd-session-state.sh`):

```javascript
const MANAGED_HOOKS = [
  'gsd-check-update-worker.js',
  'gsd-check-update.js',
  'gsd-context-monitor.js',
  'gsd-phase-boundary.sh',
  'gsd-prompt-guard.js',
  'gsd-read-guard.js',
  'gsd-read-injection-scanner.js',  // ADD THIS LINE
  'gsd-session-state.sh',
  'gsd-statusline.js',
  'gsd-validate-commit.sh',
  'gsd-workflow-guard.js',
];
```

### Fix 2: Tag rename in agent files

The `<role>` tag appears as a standalone line (VERIFIED via grep). Safe substitution:

```bash
# Dry run first — confirm all 24 agents affected
grep -l "^<role>$" agents/gsd-*.md | wc -l
# Should output: 24

# Apply rename
sed -i 's|^<role>$|<persona>|; s|^</role>$|</persona>|' agents/gsd-*.md

# Verify no <role> tags remain
grep -l "^<role>$" agents/gsd-*.md
# Should output nothing
```

Alternatively, process file-by-file for auditability:

```bash
for f in agents/gsd-advisor-researcher.md agents/gsd-ai-researcher.md \
  agents/gsd-assumptions-analyzer.md agents/gsd-codebase-mapper.md \
  agents/gsd-code-fixer.md agents/gsd-code-reviewer.md \
  agents/gsd-debugger.md agents/gsd-debug-session-manager.md \
  agents/gsd-doc-verifier.md agents/gsd-doc-writer.md \
  agents/gsd-domain-researcher.md agents/gsd-eval-auditor.md \
  agents/gsd-eval-planner.md agents/gsd-executor.md \
  agents/gsd-framework-selector.md agents/gsd-intel-updater.md \
  agents/gsd-pattern-mapper.md agents/gsd-phase-researcher.md \
  agents/gsd-plan-checker.md agents/gsd-planner.md \
  agents/gsd-research-synthesizer.md agents/gsd-security-auditor.md \
  agents/gsd-ui-checker.md agents/gsd-verifier.md; do
  sed -i 's|^<role>$|<persona>|; s|^</role>$|</persona>|' "$f"
done
```

### Individual fork test verification commands

```bash
node --test tests/negative-framing-scan.test.cjs
node --test tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs
node --test tests/ios-scaffold-safety.test.cjs
node --test tests/execute-phase-wave.test.cjs
node --test tests/agent-frontmatter.test.cjs
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js (`node --test`) | All test commands | Yes | Confirmed by `npm test` working | — |
| `npm test` | Full suite gate | Yes | Runs `node scripts/run-tests.cjs` [VERIFIED] | — |
| `sed` (GNU sed) | Batch tag rename | Yes (linux platform) | Standard linux util | Use file-by-file Edit tool calls |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:**
- If `sed -i` is unavailable (non-GNU sed on macOS): use the Edit tool to update each agent file individually, or use `perl -pi -e`.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` |
| Config file | `scripts/run-tests.cjs` (test runner script) |
| Quick run command | `node --test tests/managed-hooks.test.cjs` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-01 | Full suite exits 0 after both fixes | integration | `npm test` | yes |
| TEST-02 | All 31 fork agents within size budgets | unit | `node --test tests/agent-size-budget.test.cjs` | yes |
| TEST-03 | Command count in ARCHITECTURE.md matches actual files | unit | `node --test tests/command-count-sync.test.cjs` | yes |
| TEST-04 | All 5 fork-specific tests present and passing | smoke | `node --test tests/negative-framing-scan.test.cjs && node --test tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs && node --test tests/ios-scaffold-safety.test.cjs && node --test tests/execute-phase-wave.test.cjs && node --test tests/agent-frontmatter.test.cjs` | yes (all 5) |

### Sampling Rate

- **Per fix applied:** Run targeted test for that fix
- **After all fixes:** `npm test` (full suite gate)
- **Phase gate:** `npm test` exits 0, total count 4112/4112 ≥ 3941 baseline

### Wave 0 Gaps

None — all test infrastructure is in place. No new test files need to be created.

---

## Security Domain

Step 2.6: SKIPPED — this phase makes no changes to auth, encryption, or security-sensitive systems. Changes are: (1) XML tag rename in agent markdown files, (2) one array entry addition in a hook script.

---

## Open Questions

None. Both failures are fully diagnosed with exact fix locations and confirmed root causes.
All 5 fork-specific test files are confirmed present. The path to 4112/4112 is unambiguous.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Alphabetical sort order for new MANAGED_HOOKS entry placement | Code Examples | No risk — test does not enforce order, only membership |

**All other claims were verified directly against source files and test runs in this session.**

---

## Sources

### Primary (HIGH confidence — VERIFIED in this session)

- Direct grep of `agents/gsd-*.md` — confirmed 24 files contain `<role>` [VERIFIED]
- Direct read of `hooks/gsd-check-update-worker.js` lines 37–48 — confirmed `gsd-read-injection-scanner.js` absent from MANAGED_HOOKS [VERIFIED]
- `ls hooks/gsd-*.js` — confirmed `gsd-read-injection-scanner.js` is a shipped file [VERIFIED]
- Direct test run `node --test tests/managed-hooks.test.cjs` — confirmed failure message and root cause [VERIFIED]
- Direct test run `node --test tests/verification-overrides.test.cjs` — confirmed `</persona> tag should exist` assertion failure [VERIFIED]
- Direct test run `node --test tests/agent-size-budget.test.cjs` — confirmed 34/34 pass [VERIFIED]
- Direct test run of all 5 fork-specific test files — confirmed all pass [VERIFIED]
- `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md` line 235 — confirmed `<persona>` is the canonical block name [VERIFIED]
- `package.json` scripts.test — confirmed `npm test` runs `node scripts/run-tests.cjs` [VERIFIED]
- `.planning/config.json` — confirmed `nyquist_validation: true`, `commit_docs: true` [VERIFIED]

### Secondary (MEDIUM confidence)

- None required — all claims verified directly.

### Flagged for Validation (LOW confidence)

- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified by direct test run and file inspection
- Architecture: HIGH — two concrete, diagnosed failures with known fixes
- Pitfalls: HIGH — derived from actual test failure messages and code structure

**Research date:** 2026-04-19
**Valid until:** Until the test suite is modified — stable since test runner and test file contents are pinned
