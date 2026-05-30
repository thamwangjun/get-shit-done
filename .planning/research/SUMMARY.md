# Project Research Summary

**Project:** GSD Fork -- v2.1.0-d Whole-Integer Step Numbering
**Domain:** Static text analysis, corpus normalization, test tooling
**Researched:** 2026-05-30
**Confidence:** HIGH

## Executive Summary

The v2.1.0-d milestone enforces a whole-integer-only step labeling convention across the GSD fork prompt content files (agents, commands, workflows). Currently, 23 decimal step labels exist across 7 files -- none in the 67 command files, 2 in agents, and 21 across workflows. The work requires three deliverables: a scanner test (STEP-01) that fails on any decimal step label and is added to the permanent test suite, a normalization pass (STEP-02) that manually fixes all known violations while co-updating the 14+ test assertions that pin to the old step text, and a maintenance script (STEP-03) that can be re-run after upstream merges to detect and optionally fix future regressions.

The recommended build order is scanner first, then manual normalization, then maintenance script. Building the scanner before touching any files makes the scanner the ground truth -- normalization is complete when the scanner reports zero violations. The manual normalization step is high risk because whole-integer steps shift significantly (quick.md goes from 8 top-level steps to 15), and at least 14 test files assert on exact step text. Every file rename must be accompanied by co-updated tests in the same commit or the test suite will produce misleading failures.

The primary risk in this milestone is silent test corruption: content.indexOf() returning -1 is truthy in JavaScript, so a renamed step that is not reflected in a test will silently pass rather than fail. The prevention strategy is mandatory test co-update enforced by a GATE-01 requirement (npm test must pass at 0 regressions before the milestone closes). Three open scope decisions -- Pattern C files, Step N.0 treatment, and execute-phase.md nested sub-step labels -- must be resolved before normalization begins, as each decision changes which files and tests are in scope.

## Key Scope Decisions Needed

Before writing a single line of code, the implementer must decide:

**Decision 1: Pattern C files** (plan-phase.md, new-project.md, new-milestone.md use ## N.N. section headings with no "Step" keyword). Body text refers to them as "step N.N". Are these in scope for v2.1.0-d? They have 13+ decimal section headers in plan-phase.md alone, and 6 test files assert on their exact text. **Recommendation: defer Pattern C to a separate milestone** -- different format, dense test coverage, and the scanner regex can simply exclude headings that lack the "Step" keyword.

**Decision 2: Step N.0 treatment** (execute-phase.md has Step 7.0). Is Step 7.0 a violation? The regex /Step\s+\d+\.\d+/i flags it. Semantically it means "the whole step 7". **Recommendation: flag it as a violation** -- the milestone goal is whole-integer-only and decimal points are decimal points regardless of the fractional digit.

**Decision 3: execute-phase.md nested sub-steps** (**Step 7.0 -- ...** through **Step 7.3 -- ...** are indented labels inside list item 7, not peer step headings). Renaming them as Step 8-11 would destroy the parent-child failure-classification structure. **Recommendation: rename to lettered branches** (7a, 7b, etc.) and exclude from the automatic normalizer.

## Violation Inventory

Files requiring changes and their decimal step counts:

| File | Layer | Label Definitions | Inline Cross-Refs | Total |
|------|-------|------------------|-------------------|-------|
| agents/gsd-intel-updater.md | Agent | 1 (Step 6.5) | 0 | 1 |
| agents/gsd-phase-researcher.md | Agent | 4 (Step 1.3, 1.5, 2.5, 2.6) | 2 (line 657, line 776 output string) | 6 |
| get-shit-done/workflows/progress.md | Workflow | 2 (Step 1.5, 1.6) | 1 (line 242, same-file) | 3 |
| get-shit-done/workflows/quick.md | Workflow | 7 (Step 2.5, 4.5, 4.75, 5.5, 5.6, 6.25, 6.5) | 5 (lines 310, 580, 639, 764, 901) | 12 |
| get-shit-done/workflows/execute-phase.md | Workflow | 8 (list items 2.5, 5.5-5.8; sub-steps 7.0-7.3) | 6 (lines 356, 527, 660, 809, 811, 813) | 14 |
| execute-phase/steps/post-merge-gate.md | Sub-step | 0 | 1 ("same as step 5.8", cross-file) | 1 |

**In-scope for v2.1.0-d (excluding Pattern C):** approximately 37 violations across 6 files.

**Pattern C files (recommended deferral):** plan-phase.md (13 heading definitions + 7 cross-refs), new-project.md (3+1), new-milestone.md (4+1) -- approximately 29 additional violations; defer to follow-on milestone.

**Cross-file references requiring updates when primary files are renamed:**

| Source File | Lines | References |
|-------------|-------|-----------|
| execute-plan.md | 143, 369, 475 | execute-phase.md step 5.5 |
| execute-phase/steps/post-merge-gate.md | 60 | execute-phase.md list item 5.8 |
| fast.md | 75, 83 | quick.md Step 7 (comment text only) |

**Test files requiring co-update (minimum 14):**

quick.md renames affect: quick-branching.test.cjs, bug-2432-quick-plan-predispatch-commit.test.cjs, bug-2523-quick-deferred-items.test.cjs, quick-commit-boundary.test.cjs, bug-3805-fast-md-log-to-state-schema.test.cjs, bug-2334-quick-gsd-sdk-preflight.test.cjs, bug-3426-codex-windows-hooks.test.cjs, quick-research.test.cjs

execute-phase.md renames affect: execute-phase-step-5-5-deviation-doc.test.cjs

gsd-phase-researcher.md renames affect: agent-frontmatter.test.cjs (line 344)

## Architecture Recommendation

### Build Order

**STEP-01: Scanner test** (tests/step-number-scan.test.cjs)

Structure mirrors tests/negative-framing-scan.test.cjs exactly: module-scope file collection via inline collectMarkdownFiles, pure scanContent(content) function, unit tests before corpus tests, per-directory describe blocks.

Scan dirs: agents/, get-shit-done/workflows/, commands/gsd/

Detection regexes:
- Pattern A/B/C ("Step" keyword): /Step\s+\d+\.\d+/i
- Pattern D (ordered-list items): /^\s*\d+\.\d+\./

Guards required: code-fence skip (inCodeBlock toggle), indentation check to exclude nested sub-steps (leading 3+ spaces = skip for sub-step classification), letter-suffix exclusion (require \.[0-9] not \.[a-z0-9]).

The scanner starts RED (fails against current corpus). STEP-02 normalization is complete when all corpus tests go green.

**STEP-02: Manual normalization** (edit each in-scope file)

Fix files in order of increasing complexity and test impact:
1. gsd-intel-updater.md (1 violation, no test impact)
2. progress.md (3 violations, no test impact)
3. gsd-phase-researcher.md (6 violations, 1 test file)
4. execute-phase.md (14 violations including nested sub-steps, 1 test file, 3 cross-file refs)
5. quick.md (12 violations, 8 test files -- highest risk, save for last)

For each file: rename heading -> whole-file substitution sweep replacing old label with new label -> update cross-file references -> update co-located tests -> run npm test before moving to next file.

**STEP-03: Maintenance script** (scripts/normalize-step-numbers.cjs)

Build after STEP-02 completes. Structure: --dry-run flag, inline collectMdFiles, TARGET_DIRS array, two-pass per-file algorithm (Pass 1: build rename Map<oldLabel, newLabel>; Pass 2: apply substitutions). Idempotency guard: compare transformed content to original before writing. Print summary of files changed and lines changed.

### Component Design

Scanner function:


Normalizer function:


Both inline the same collectMarkdownFiles ENOENT-tolerant recursive collector. Neither extracted to tests/helpers.cjs (would require updating the helpers test count assertion).

## Critical Pitfalls

**1. Silent test false-passes from indexOf returning -1 (highest risk)**
content.indexOf("Step 2.5") returns -1 when Step 2.5 is renamed. -1 is truthy in JavaScript. assert.ok(content.indexOf("Step 2.5")) passes silently. Every test using indexOf as a positional delimiter will silently produce wrong assertions. Prevention: run npm test after every single file rename and examine which tests now pass that previously located step content by label. Update tests before moving to the next file.

**2. Whole-integer steps shifting by large offsets in quick.md**
quick.md expands from 8 top-level steps to 15. Old Step 3 becomes Step 4, old Step 6 becomes Step 11, old Step 8 becomes Step 15. At least 8 test files pin to the old numbers. These must be co-updated atomically in the same commit as the quick.md edits. Attempting GATE-01 without test updates produces a mixed state where some tests fail for wrong reasons and others silently pass for wrong reasons. Prevention: treat test co-updates as first-class deliverables listed explicitly in the STEP-02 task plan.

**3. Cross-file reference breakage (execute-plan.md -> execute-phase.md step 5.5)**
Three occurrences in execute-plan.md reference execute-phase.md step 5.5 by label. After renaming, these references become stale without any automatic test failure because execute-plan.md tests do not assert on this cross-reference text. Prevention: before normalizing any file, run grep -rn across all three scan dirs to build the cross-file reference index.

**4. Ordered-list decimal items in execute-phase.md are structurally different from step headings**
Items 2.5., 5.5., 5.6., 5.7., 5.8. are ordered-list decimals (Pattern D), not step-heading declarations. The scanner needs a second regex. The normalizer must renumber them as list items, not as **Step N** headings. Step 7.0-7.3 sub-steps are further special-cased: indented branch labels within list item 7 that should become lettered branches (7a, 7b, etc.).

**5. plan-phase.md triple-decimal and sub-step nesting is a scope trap**
plan-phase.md has ## 5.55. (triple-decimal) and ## 8.5.1/## 8.5.2 (sub-sub-steps). Any attempt to normalize it in v2.1.0-d risks breaking 6 test files and requires a sub-step policy decision the current milestone does not cover. Prevention: defer all Pattern C files to a follow-on milestone and exclude them from the STEP-01 scanner via explicit path exclusion.

## Watch Out For

- gsd-phase-researcher.md:776 contains a runtime-emitted literal string ("Step 2.6: SKIPPED ..."). It must be updated or the AI model emits a stale step label at runtime.
- gsd-verifier.md uses Step Nb letter-suffix steps that look decimal to a naive regex. Ensure the scanner requires \.[0-9] not \.[a-z0-9].
- quick.md lines 691 and 706 contain Step 1 and Step 2 inside a code block describing git invariants -- must not be renumbered.
- fast.md lines 75 and 83 reference "quick.md Step 7" in comment text. After quick.md Step 7 becomes Step 14, these comments become stale but cause no test failures.
- Step 0 is a valid label in gsd-verifier.md, gsd-planner.md, and commands/gsd/graphify.md. Do not normalize Step 0 to Step 1.
- ARCHITECTURE.md research covered install.js template resolution (install-time content materialization), which is out of scope for v2.1.0-d. Disregard it for this milestone.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Violation inventory | HIGH | Researcher directly inspected all files; exact line numbers and counts provided |
| Stack / tooling patterns | HIGH | Reusable patterns confirmed by reading negative-framing-scan.test.cjs and maintenance scripts directly |
| Pitfalls / test impact | HIGH | Full test suite grep performed; 14+ affected tests enumerated by file and assertion |
| Architecture (install.js) | NOT APPLICABLE | Covered wrong scope for this milestone |
| Scope decisions | MEDIUM | Three open decisions require human judgment; research provides clear recommendation but not binding decision |

**Overall confidence:** HIGH for in-scope files. The risk is known and enumerated, not unknown.

### Gaps to Address

- **Pattern C decision:** Must be made before STEP-01 scanner is written (affects regex and scan directory inclusions). Recommendation: exclude.
- **execute-phase.md Step 7.0-7.3 decision:** Must be made before STEP-02 normalization for execute-phase.md. Recommendation: rename to lettered branches.
- **Architecture research mis-scope:** ARCHITECTURE.md covered install.js pipeline (relevant to v2.1.0-c, not v2.1.0-d). This does not block execution.

## Sources

### Primary (HIGH confidence)

- Direct file inspection: agents/gsd-phase-researcher.md, agents/gsd-intel-updater.md, get-shit-done/workflows/quick.md, get-shit-done/workflows/execute-phase.md, get-shit-done/workflows/plan-phase.md, get-shit-done/workflows/progress.md, get-shit-done/workflows/new-project.md, get-shit-done/workflows/new-milestone.md
- Test suite grep: tests/quick-branching.test.cjs, tests/bug-2432-quick-plan-predispatch-commit.test.cjs, tests/execute-phase-step-5-5-deviation-doc.test.cjs, tests/agent-frontmatter.test.cjs, tests/quick-research.test.cjs, tests/plan-bounce.test.cjs, tests/enh-2310-chunked-plan-phase.test.cjs, tests/milestone.test.cjs, and 6 more
- Canonical scanner pattern: tests/negative-framing-scan.test.cjs
- Canonical maintenance script pattern: scripts/convert-refs.cjs, scripts/strip-prose-atrefs.cjs

### Secondary (MEDIUM confidence)

- Cross-reference index: grep -rn across full corpus -- confirmed one cross-file reference chain (execute-plan.md -> execute-phase.md step 5.5)
- Format inventory: all 90+ workflow/agent/command files scanned for step heading patterns -- confirmed 4 distinct formats

---
*Research completed: 2026-05-30*
*Ready for roadmap: yes*
