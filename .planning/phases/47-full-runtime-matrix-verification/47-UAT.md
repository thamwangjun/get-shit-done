---
status: partial
phase: 47-full-runtime-matrix-verification
source: 47-01-SUMMARY.md
started: 2026-05-29T09:30:00Z
updated: 2026-05-29T09:45:00Z
---

## Current Test

[testing paused — 1 item blocked]

## Tests

### 1. Eta Regression Test Suite Passes
expected: Run `node tests/install-eta-regression.test.cjs` — all 5 tests pass (TEST-01 through TEST-05), 0 failures, output ends with `pass 5` and `fail 0`.
result: pass

### 2. TEST-01 Uses Full Claude Install Walk
expected: In `tests/install-eta-regression.test.cjs`, TEST-01 runs `installRuntimeArtifacts` to install to a `/tmp` directory, then walks ALL installed `.md` files checking for unexpected `@~/.claude/` refs. An `ALLOWED_INLINE_REFS` array with 27 entries allows intentional prose refs through. TEST-01 passes, confirming zero non-allowlisted refs survive in the Claude install output.
result: pass

### 3. Failure Messages Are Actionable
expected: If an unexpected `@~/.claude/` ref were found by TEST-01, the failure message would include: the file path, line number, the matched string, and two resolution paths (prose ref vs Eta template). Confirm by reading lines ~124–154 of the test file — the `assert.fail` message references `file`, `lineNo`, `match`, and dual resolution text.
result: pass

### 4. TEST-03 Struck Through in REQUIREMENTS.md
expected: Open `.planning/REQUIREMENTS.md`. Line ~35 shows `~~**TEST-03**~~` with rationale explaining it is out-of-scope for v2.1.0-c (tool-name transformation is orthogonal to Eta include resolution).
result: pass

### 5. npm test Has No New Failures
expected: Run `npm test`. The output shows the same 50 pre-existing failures (or fewer) that existed before phase 47. Net new failures: 0. The install-eta-regression tests contribute 5 passes.
result: pass
reported: "49 failures instead of 50 — one pre-existing failure resolved, net new failures: 0"
severity: cosmetic

### 6. GATE-02: Negative-Framing Scanner at 99/99
expected: Run `node get-shit-done/bin/gsd-tools.cjs verify negative-framing`. Output shows 99/99 subtests passing — the same score as before phase 47 (no agent/workflow/command files were modified in this phase).
result: blocked
blocked_by: other
reason: "verify negative-framing subcommand does not exist in gsd-tools (Error: Unknown verify subcommand). Closest available check: tests/phase-30-affirmative-replacements.test.cjs passes 9/9. Phase 47 modified no agent/workflow/command files, so the 99/99 score is structurally unaffected."

### 7. Non-Claude Runtime Install: Zero @~/.claude/ Refs
expected: Install to a non-Claude runtime (e.g., Gemini — run installer with `--gemini` flag to a temp dir). `grep -r '@~/.claude/' <install-dir>` returns 0 results. Path-replacement logic in `install.js` should rewrite `@~/.claude/` to the runtime-specific prefix.
result: pass
reported: "grep -r '@~' found 2 matches in CHANGELOG.md only — both are historical prose in changelog entries describing past fixes, not functional references in prompt content files. Zero @~/.claude/ refs in agent/workflow/command files."

## Summary

total: 7
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 1

## Gaps

[none yet]
