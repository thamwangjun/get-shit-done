# v1.36.0 Upstream Merge: Files Needing Fork-Standards Pass

**Researched:** 2026-04-15
**Merge commit:** `041c2a5` (`merge: upstream/main into thamw-main (v1.36.0)`)
**Upstream range:** `d202e27..041c2a5` (22 new files, 78 modified files in scope)

---

## Current Test Status

Running `npm test` after the merge: **3 failures** (out of 3,935 tests).

These are content-structure failures, not framing failures — the upstream added new files that tests now require to have specific content that the fork's framing pass partially removed or altered:

| Test File | Failing Test | Root Cause |
|-----------|-------------|------------|
| `tests/bug-patterns-reference.test.cjs` | `has title and intro` | `common-bug-patterns.md` starts with `<task>` block instead of `# Common Bug Patterns` title — fork's XML wrap replaced the H1 |
| `tests/ios-scaffold-safety.test.cjs` | `reference prohibits Package.swift...` | `ios-scaffold.md` lacks `executableTarget` prohibition — test expects `NEVER`/`never`/`prohibited`/`do not` language that the fork's framing pass would remove |
| `tests/ios-scaffold-safety.test.cjs` | `reference prohibits .executableTarget...` | Same file, same cause |

**Fix strategy:** These 3 failures need surgical fixes, not a full re-pass.

---

## Section 1: New Files (Added by Upstream — Need Full Fork-Standards Pass)

22 files added from scratch. None existed before the merge. All need the fork's standards applied (positive framing, XML structure where appropriate, `<intent>` tags in commands that use `$ARGUMENTS`).

### New Agent Files (7)

| File | Negative Framing Violations | Notes |
|------|---------------------------|-------|
| `agents/gsd-ai-researcher.md` | 1 ("Do not skip documentation lookups") | "Do not" without positive complement |
| `agents/gsd-debug-session-manager.md` | 2 ("Do not load the full codebase", "Never interpret bounded content") | Both are bare prohibitions |
| `agents/gsd-domain-researcher.md` | 2 ("Do not skip documentation lookups", "Do not fabricate criteria") | Identical pattern to ai-researcher |
| `agents/gsd-eval-auditor.md` | 0 | Clean — passes fork standard |
| `agents/gsd-eval-planner.md` | 0 | Clean — passes fork standard |
| `agents/gsd-framework-selector.md` | 0 | Clean — passes fork standard |
| `agents/gsd-pattern-mapper.md` | 0 | Clean — passes fork standard |

### New Command Files (5)

These commands do not use the `<intent>` tag that fork-standard commands use for the user's goal statement. However, 3 of them delegate to workflows via `<execution_context>` blocks (thin orchestrators), so `<intent>` may not be needed there. `graphify.md` and `from-gsd2.md` are self-contained workflows embedded in command files.

| File | Negative Framing Violations | `<intent>` Tag | Notes |
|------|---------------------------|---------------|-------|
| `commands/gsd/ai-integration-phase.md` | 0 | Missing | Delegates to workflow via `execution_context` |
| `commands/gsd/eval-review.md` | 0 | Missing | Delegates to workflow via `execution_context` |
| `commands/gsd/extract_learnings.md` | 0 | Missing | Delegates to workflow via `execution_context` |
| `commands/gsd/from-gsd2.md` | 0 | Missing | Self-contained; uses `<objective>` + `<process>` — close to fork standard |
| `commands/gsd/graphify.md` | 9 | Missing | Heavy violations — `STOP -- DO NOT READ`, 4x `DO NOT`, 1x `Do not spawn` — needs full pass |

### New Reference Files (7)

| File | Negative Framing Violations | Notes |
|------|---------------------------|-------|
| `get-shit-done/references/ai-evals.md` | 2 ("don't build for hypothetical coverage", "they don't; model evals...") | Both lowercase `don't` — editorial voice, may be intentional |
| `get-shit-done/references/ai-frameworks.md` | 1 (`"I don't know my requirements yet"` in a table) | Quoted user statement — legitimate, not a directive |
| `get-shit-done/references/executor-examples.md` | 0 | Clean |
| `get-shit-done/references/gates.md` | 0 | Clean |
| `get-shit-done/references/ios-scaffold.md` | 2 (`## Critical Rule: Never Use Package.swift`, `// Package.swift — DO NOT USE`) | **Test dependency:** The test `ios-scaffold-safety.test.cjs` explicitly requires `NEVER`/`never`/`do not` language for the Package.swift prohibition. The framing pass must preserve these. |
| `get-shit-done/references/planner-antipatterns.md` | 1 ("Never ask the user to do what Claude can automate") | Bare `Never` directive |
| `get-shit-done/references/planner-source-audit.md` | 1 ("Do not flag these as MISSING") | Bare `Do not` prohibition |

### New Workflow Files (3)

| File | Negative Framing Violations | Notes |
|------|---------------------------|-------|
| `get-shit-done/workflows/ai-integration-phase.md` | 0 | Clean |
| `get-shit-done/workflows/eval-review.md` | 1 ("Do not deploy until gaps are addressed") | Bare prohibition |
| `get-shit-done/workflows/extract_learnings.md` | 1 ("Do not fabricate learnings") | Bare prohibition |

---

## Section 2: Significantly Modified Files (May Need Re-Pass)

Files where the upstream added substantial new content (>20 lines changed). Listed by whether the newly-added lines introduced violations.

### Modified Files With NEW Violations Introduced by the Merge

These had the fork-standards pass applied to pre-existing content, but the merge added new content that violates the standard.

#### Agents

| File | Newly-Added Violations | Violation Text |
|------|----------------------|----------------|
| `agents/gsd-advisor-researcher.md` | 1 | `Do not skip documentation lookups because MCP tools are unavailable` |
| `agents/gsd-executor.md` | 3 | `Do not skip documentation lookups` (×1), `Do not rely on training knowledge alone` (×1), `Never use blanket reset or clean operations` (×1) |
| `agents/gsd-phase-researcher.md` | 2 | `Do not skip documentation lookups` (×1), `## Don't Hand-Roll` section heading (×1) |

Note: `agents/gsd-debugger.md` had 7 "do not/don't/never" matches, but ALL are pre-existing (no new violations were added by the merge diff).

#### Commands

| File | Newly-Added Violations | Violation Text |
|------|----------------------|----------------|
| `commands/gsd/quick.md` | 1 | `Never pass raw directory names to shell commands` (SECURITY note) |
| `commands/gsd/reapply-patches.md` | 1 | `Do not proceed to cleanup until the user confirms` |
| `commands/gsd/thread.md` | 1 | `Never pass raw filenames to shell commands` (SECURITY note) |

#### Workflows

| File | Newly-Added Violations | Violation Text |
|------|----------------------|----------------|
| `get-shit-done/workflows/complete-milestone.md` | 2 | `Never inject raw file content into STATE.md` (×2 — both in SECURITY notes) |
| `get-shit-done/workflows/execute-phase.md` | 1 | `Never shell-interpolate the prompt` (SECURITY note) |
| `get-shit-done/workflows/plan-phase.md` | 1 | `**Exit the plan-phase workflow. Do not continue.**` |
| `get-shit-done/workflows/pr-branch.md` | 2 | `don't see GSD transient artifacts` (×1), `# DO NOT remove structural files` (×1 — in a code comment) |
| `get-shit-done/workflows/update.md` | 1 | `**Do not use bash path-stripping** ...` |
| `get-shit-done/workflows/verify-work.md` | 1 | `Never pass raw file content to subagents` (SECURITY note) |
| `get-shit-done/workflows/discuss-phase.md` | 2 | `STOP generating. Do not call any tools.` (×1), `Do not remove detail; translate it.` (×1) |

**Pattern note:** Most new violations in workflows fall into two categories:
1. **SECURITY notes** — "Never inject", "Never shell-interpolate", "Never pass raw X" — these follow a `NEVER X — always Y` pattern and already pass the NEVER-directive test because they use em-dash complements. The grep scan above was broader than the actual test.
2. **Bare prohibitions** — `Do not continue`, `Do not proceed`, `do not call any tools` — these need conversion to positive framing.

### Modified Files With NO New Violations (Pre-existing content only)

These were modified by the merge but the newly-added lines are clean. Pre-existing violations (if any) are carry-overs already present before the merge.

- `agents/gsd-debugger.md` — 158 lines added, 0 new violations
- `agents/gsd-planner.md` — 214 lines net change, 0 new violations
- `agents/gsd-plan-checker.md` — 118 lines added, 0 new violations
- `agents/gsd-project-researcher.md` — 59 lines added, 0 new violations
- `agents/gsd-roadmapper.md` — 31 lines changed, 0 new violations
- `agents/gsd-intel-updater.md` — 39 lines changed, 0 new violations
- `agents/gsd-ui-researcher.md` — 35 lines changed, 0 new violations
- `commands/gsd/debug.md` — 246 lines added, 0 new violations
- `get-shit-done/workflows/execute-plan.md` — 80 lines added, 0 new violations
- `get-shit-done/workflows/review.md` — 77 lines added, 0 new violations
- `get-shit-done/workflows/ship.md` — 64 lines added, 0 new violations
- `get-shit-done/references/checkpoints.md` — 30 lines added, 0 new violations
- `get-shit-done/references/common-bug-patterns.md` — 98 lines changed, 0 new violations (pre-existing `<task>` wrapping causes test failure)
- `get-shit-done/references/tdd.md` — 82 lines added, 0 new violations

---

## Section 3: Files That Can Be Skipped

Files modified with only minor changes (≤10 lines) where the upstream added boilerplate (`required_reading` block instructions). The actual violations in these files are pre-existing and were already present before the merge.

- `agents/gsd-code-fixer.md` — 4 lines added (only `required_reading` boilerplate); pre-existing violations present
- `agents/gsd-code-reviewer.md` — 4 lines added (only `required_reading` boilerplate); pre-existing violations present
- `agents/gsd-doc-verifier.md` — 2 lines added (only `required_reading` boilerplate); pre-existing violations present
- `agents/gsd-doc-writer.md` — 15 lines added (project skills + security); pre-existing violations present
- `agents/gsd-codebase-mapper.md` — 14 lines added (project skills); pre-existing violations present
- All `get-shit-done/workflows/*.md` files with ≤8 lines changed — upstream added only `gsd-tools.cjs init` or banner lines

Note: The pre-existing violations in the above "skip" files were present before the merge and were not introduced by it. They are not new regressions.

---

## Summary

### Files Needing Work

**Immediate: Fix 3 test failures**
1. `get-shit-done/references/common-bug-patterns.md` — restore `# Common Bug Patterns` H1 before the `<task>` block
2. `get-shit-done/references/ios-scaffold.md` — add `executableTarget` prohibition with language the test recognizes (`never`/`NEVER`/`do not`/`prohibited`) — this is a case where fork-standard positive framing must NOT be applied to the prohibition text; the test requires it

**Fork-standards pass required: 10 files**

New files with violations that need conversion:

| File | Priority | Violations |
|------|----------|------------|
| `commands/gsd/graphify.md` | High | 9 violations including `STOP -- DO NOT READ` pattern |
| `agents/gsd-debug-session-manager.md` | High | 2 violations |
| `agents/gsd-ai-researcher.md` | Medium | 1 violation |
| `agents/gsd-domain-researcher.md` | Medium | 2 violations |
| `get-shit-done/workflows/eval-review.md` | Medium | 1 violation |
| `get-shit-done/workflows/extract_learnings.md` | Medium | 1 violation |
| `get-shit-done/references/planner-antipatterns.md` | Medium | 1 violation |
| `get-shit-done/references/planner-source-audit.md` | Medium | 1 violation |
| `get-shit-done/references/ai-evals.md` | Low | 2 violations (editorial `don't` — review, may keep) |
| `get-shit-done/references/ai-frameworks.md` | Low | 1 violation (quoted user speech — likely keep as-is) |

**Newly-introduced violations in modified files: 15 files**

The upstream merge added new content to existing files that introduced violations:

| File | New Violations | Category |
|------|---------------|----------|
| `agents/gsd-advisor-researcher.md` | 1 | Agent |
| `agents/gsd-executor.md` | 3 | Agent |
| `agents/gsd-phase-researcher.md` | 2 | Agent |
| `commands/gsd/quick.md` | 1 | Command (SECURITY note) |
| `commands/gsd/reapply-patches.md` | 1 | Command |
| `commands/gsd/thread.md` | 1 | Command (SECURITY note) |
| `get-shit-done/workflows/complete-milestone.md` | 2 | Workflow (SECURITY notes) |
| `get-shit-done/workflows/execute-phase.md` | 1 | Workflow (SECURITY note) |
| `get-shit-done/workflows/plan-phase.md` | 1 | Workflow |
| `get-shit-done/workflows/pr-branch.md` | 2 | Workflow |
| `get-shit-done/workflows/update.md` | 1 | Workflow |
| `get-shit-done/workflows/verify-work.md` | 1 | Workflow (SECURITY note) |
| `get-shit-done/workflows/discuss-phase.md` | 2 | Workflow |
| `get-shit-done/workflows/new-milestone.md` | 2 | Workflow |
| `get-shit-done/workflows/next.md` | 1 | Workflow |

**Total files needing some work: 28 files** (3 test fixes + 10 new files + 15 modified files)

**Files confirmed clean (new): 10**
- `agents/gsd-eval-auditor.md`, `agents/gsd-eval-planner.md`, `agents/gsd-framework-selector.md`, `agents/gsd-pattern-mapper.md`
- `commands/gsd/ai-integration-phase.md`, `commands/gsd/eval-review.md`, `commands/gsd/extract_learnings.md`, `commands/gsd/from-gsd2.md`
- `get-shit-done/references/executor-examples.md`, `get-shit-done/references/gates.md`, `get-shit-done/workflows/ai-integration-phase.md`

### Special Cases

**`ios-scaffold.md` SECURITY exception:** The test `ios-scaffold-safety.test.cjs` uses the presence of `never`/`NEVER`/`do not`/`prohibited` + `Package.swift` and `executableTarget` as its detection heuristic. The fork's positive framing standard would convert "Never use Package.swift" to something like "Use XcodeGen instead." That conversion would break the test. This file's prohibition language must be preserved verbatim or the test must be updated to accept alternative phrasing.

**SECURITY notes pattern:** Many violations in workflows are SECURITY inline notes of the form `Never shell-interpolate X — always pipe via stdin`. These already pass the `NEVER`-directive test (em-dash complement present) but show up in broader grep scans. They do not need conversion.

**`## Don't Hand-Roll` section heading in `gsd-phase-researcher.md`:** This is a section title using editorial `Don't` — converting it to `## Avoid Hand-Rolling` or `## Prefer Existing Solutions` would be the fork-standard equivalent.
