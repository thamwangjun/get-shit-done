---
phase: 66-citation-cleanup
reviewed: 2026-06-09T08:30:00Z
depth: standard
files_reviewed: 48
files_reviewed_list:
  - commands/gsd/config.md
  - commands/gsd/graphify.md
  - commands/gsd/ns-context.md
  - commands/gsd/ns-ideate.md
  - commands/gsd/ns-manage.md
  - commands/gsd/ns-project.md
  - commands/gsd/ns-review.md
  - commands/gsd/ns-workflow.md
  - commands/gsd/plan-phase.md
  - get-shit-done/workflows/execute-plan.md
  - get-shit-done/workflows/add-backlog.md
  - get-shit-done/workflows/ai-integration-phase.md
  - get-shit-done/workflows/discuss-phase.md
  - get-shit-done/workflows/discuss-phase/modes/advisor.md
  - get-shit-done/workflows/discuss-phase/modes/chain.md
  - get-shit-done/workflows/discuss-phase/templates/context.md
  - get-shit-done/workflows/execute-phase/steps/codebase-drift-gate.md
  - get-shit-done/workflows/execute-phase/steps/per-plan-worktree-gate.md
  - get-shit-done/workflows/help/modes/full.md
  - get-shit-done/workflows/ingest-docs.md
  - get-shit-done/workflows/new-milestone.md
  - get-shit-done/workflows/new-project.md
  - get-shit-done/workflows/plan-phase.md
  - get-shit-done/workflows/quick.md
  - get-shit-done/workflows/reapply-patches.md
  - get-shit-done/workflows/settings-integrations.md
  - get-shit-done/workflows/settings.md
  - get-shit-done/workflows/update.md
  - get-shit-done/workflows/verify-phase.md
  - agents/gsd-code-fixer.md
  - agents/gsd-codebase-mapper.md
  - agents/gsd-executor.md
  - agents/gsd-intel-updater.md
  - agents/gsd-plan-checker.md
  - agents/gsd-verifier.md
  - get-shit-done/references/checkpoints.md
  - get-shit-done/references/git-integration.md
  - get-shit-done/references/model-profiles.md
  - get-shit-done/references/mvp-concepts.md
  - get-shit-done/references/planner-graphify-auto-update.md
  - get-shit-done/references/planner-human-verify-mode.md
  - get-shit-done/references/planning-config.md
  - get-shit-done/references/scout-codebase.md
  - get-shit-done/references/thinking-partner.md
  - get-shit-done/references/worktree-path-safety.md
findings:
  critical: 2
  warning: 2
  info: 1
  total: 5
status: issues_found
---

# Phase 66: Code Review Report

**Reviewed:** 2026-06-09T08:30:00Z
**Depth:** standard
**Files Reviewed:** 48
**Status:** issues_found

## Summary

This phase cleaned 45 Markdown files of `#NNN`, `(#NNN)`, and `feat-NNNN` citation tokens so that the `tests/no-issue-citations.test.cjs` guard test passes GREEN. Review scope: broken prose after removal, unintended content deletions, and remaining citations that should have been removed.

**Guard test confirms 2 BLOCKER failures remain.** Running `node --test tests/no-issue-citations.test.cjs` reports `fail 2` with violations in `agents/gsd-executor.md` (line 555) and `get-shit-done/references/thinking-partner.md` (lines 69, 72). The phase's primary success criterion — guard test GREEN — is not met.

Beyond the failing test, two Warning-level prose issues were also found: a dangling connector left by an incomplete removal in `get-shit-done/workflows/ingest-docs.md`, and a footnote clause in `get-shit-done/references/thinking-partner.md` that was partially cleaned but left semantically incomplete.

---

## Critical Issues

### CR-01: `agents/gsd-executor.md` line 555 — citation `(#2924)` not removed from prose

**File:** `agents/gsd-executor.md:555`
**Issue:** The prose sentence at line 555 retains a parenthetical `(#2924)` citation inside a non-code-fence paragraph. The guard test reports it as a violation and fails the corpus-scan suite:

```
✖ no citations in agents/gsd-executor.md (0.660417ms)
  agents/gsd-executor.md:555 #2924 (parenthetical)
  `develop`, `trunk`, or `release/*`). This is an absolute prohibition (#2924).
```

The 66-03-SUMMARY.md records that `#2924` was removed from `gsd-executor.md`, but only 8 tokens were counted across 6 citations. The sentence at line 555 was missed. Per D-07, the surrounding rationale ("This is an absolute prohibition") has independent meaning and must be kept — only the `(#2924)` token should be stripped.

**Fix:**
```markdown
# Before
`develop`, `trunk`, or `release/*`). This is an absolute prohibition (#2924).
# After
`develop`, `trunk`, or `release/*`). This is an absolute prohibition.
```

---

### CR-02: `get-shit-done/references/thinking-partner.md` lines 69 and 72 — citations `#1729` and `(#1729)` not removed

**File:** `get-shit-done/references/thinking-partner.md:69`
**Issue:** Two `#1729` citations remain in prose lines that are outside frontmatter and outside code fences. The guard test reports both as violations:

```
✖ no citations in get-shit-done/references/thinking-partner.md (0.1585ms)
  thinking-partner.md:69 #1729 (inline)
      ### 3. Explore — Approach Comparison (requires #1729)
  thinking-partner.md:72 #1729 (parenthetical)
      **Note:** This integration point will be added when /gsd:explore (#1729) lands.
```

The 66-04-SUMMARY.md explicitly lists `thinking-partner.md` with `#1729` (line 69) and `(#1729)` (line 72) as "citations removed", but the live files still contain them. Either the edit was not applied or was reverted.

The phase context document (66-CONTEXT.md) confirms that `#1729` is NOT on the protected allowlist (which covers only `#1`, `#2`, `#45`, `#123` per D-10). The Summary's decision to remove `#1729` was correct; the removal was not persisted.

Per D-06: the clause `(requires #1729)` on line 69 has no independent informational content beyond the citation — drop it entirely. The Note on line 72 should retain the prose but lose the parenthetical:

**Fix for line 69:**
```markdown
# Before
### 3. Explore — Approach Comparison (requires #1729)
# After
### 3. Explore — Approach Comparison
```

**Fix for line 72:**
```markdown
# Before
**Note:** This integration point will be added when /gsd:explore (#1729) lands.
# After
**Note:** This integration point will be added when /gsd:explore lands.
```

---

## Warnings

### WR-01: `get-shit-done/workflows/ingest-docs.md` line 318 — citation token embedded inside a string literal used as a commit message template

**File:** `get-shit-done/workflows/ingest-docs.md:318`
**Issue:** The finalize step contains the following bash snippet:

```bash
$GSD_SDK query commit \
  "docs: ingest {N} docs from {SCAN_PATH} (#2387)" --files \
```

The `(#2387)` token appears inside a quoted shell string that will be interpolated as a commit message. This is inside a fenced code block, so the guard test correctly skips it. However, the commit message template is prose that will be emitted verbatim to git history and displayed to users. It is a citation to what was presumably the upstream issue that introduced this feature. This is exactly the class of citation this phase was designed to clean.

The guard test skips code fences (D-09/D-10) by design — this instance is test-clean but semantically inconsistent with the phase goal of removing citations from all user-visible content.

**Fix:**
```bash
$GSD_SDK query commit \
  "docs: ingest {N} docs from {SCAN_PATH}" --files \
```

Note: This is inside a code fence and will not be caught by the guard test. Fixing it is optional but consistent with the phase goal. Leaving it produces a citation in every user's git log.

---

### WR-02: `get-shit-done/references/thinking-partner.md` line 70 — orphaned footnote after partial line cleanup

**File:** `get-shit-done/references/thinking-partner.md:70`
**Issue:** When CR-02 is fixed by removing `(requires #1729)` from the heading on line 69, line 70 currently reads:

```
**When:** During Socratic conversation, when multiple viable approaches emerge.
**Note:** This integration point will be added when /gsd:explore (#1729) lands.
```

After the heading is fixed, the Note on line 72 becomes the only remaining description of this section. The Note itself also requires the CR-02 fix (`(#1729)` removal). Once both edits are applied, the paragraph structure is coherent. This warning is subsidiary to CR-02 — both lines must be fixed together as a unit or neither will be in a clean state.

**Fix:** Apply CR-02 fixes to both lines 69 and 72 atomically.

---

## Info

### IN-01: `agents/gsd-executor.md` line 31 — external GitHub issue URL citation `anthropics/claude-code#13898` in a prose comment

**File:** `agents/gsd-executor.md:31`
**Issue:** Line 31 contains the string `anthropics/claude-code#13898` in a parenthetical:

```
2. If Context7 MCP is not available (upstream bug anthropics/claude-code#13898 strips MCP
```

This is a cross-repository GitHub URL reference, not a local `#NNN` citation. The guard test's `INLINE_RE` and `PARENTHETICAL_RE` patterns specifically match bare `#NNNN` tokens; `anthropics/claude-code#13898` contains a slash and repo prefix so it is not caught by the test. It is not a violation per the guard test's detection rules.

This is purely informational: the citation is a valid upstream bug reference that provides rationale for the fallback path described in the surrounding prose, and it is the only place it appears. No action is required for test compliance; note for future citation-audit passes if external cross-repo references are also targeted.

**Fix:** No action required for guard test compliance.

---

_Reviewed: 2026-06-09T08:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
