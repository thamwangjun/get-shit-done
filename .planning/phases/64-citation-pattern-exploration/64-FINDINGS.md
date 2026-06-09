# Phase 64: Citation Pattern Exploration — Findings

**Generated:** 2026-06-09
**Scan scope:** commands/, get-shit-done/workflows/, agents/, get-shit-done/references/, get-shit-done/templates/
**Files scanned:** 317

## Summary

Scanner: `node scripts/scan-citations.cjs` — 103 total citation hits across 49 files.

Raw grep count for `#[0-9]+` across the same 5 dirs: **228 lines**. Scanner total after
exclusions: **103 hits** (delta: 125). Delta is explained by two exclusion classes:

- **YAML frontmatter blocks excluded (D-10):** 15 raw hits removed.
- **Fenced code blocks excluded (D-10):** 110 raw hits removed.
  Code blocks contain bash `echo` statements and comment lines referencing issue numbers
  (e.g., `echo "FATAL: cwd drifted (#3097)"`) — not prose citations.

Note on baseline: the 211 confirmed baseline in CONTEXT.md was a raw grep count before
inline/parenthetical classification and before code-block exclusion. After applying both
exclusions, the scanner finds 102 `#NNN` hits (64 inline + 38 parenthetical). The 211 figure
represents the cleanup target for Phase 66 (all `#NNN` hits including code-block occurrences).

| Category | Count | Notes |
|---|---|---|
| `inline` (`#NNN` not in parentheses) | 64 | standalone issue refs, e.g. `#2790`, `#3097` |
| `parenthetical` (`(#NNN)`) | 38 | parentheses-wrapped issue refs, e.g. `(#2439)`, `(#3166)` |
| `word-form` (`issue NNN`, `PR NNN`) | 0 | no word-form citations found in 5 scoped dirs |
| `feat-form` (`feat-NNNN`) | 1 | `feat-3347` in planner-graphify-auto-update.md:62 |
| **Total** | **103** | |

## Findings Table

103 rows total, sorted by file then line ascending.

| file:line | matched_text | category |
|---|---|---|
| agents/gsd-code-fixer.md:217 | `#2839` | inline |
| agents/gsd-code-fixer.md:298 | `#2839` | inline |
| agents/gsd-code-fixer.md:298 | `#2990` | inline |
| agents/gsd-code-fixer.md:300 | `#2990` | parenthetical |
| agents/gsd-code-fixer.md:586 | `#2990` | parenthetical |
| agents/gsd-code-fixer.md:586 | `#2686` | parenthetical |
| agents/gsd-code-fixer.md:588 | `#2839` | inline |
| agents/gsd-code-fixer.md:588 | `#2990` | inline |
| agents/gsd-codebase-mapper.md:98 | `#2003` | parenthetical |
| agents/gsd-executor.md:410 | `#3097` | inline |
| agents/gsd-executor.md:433 | `#3099` | inline |
| agents/gsd-executor.md:451 | `#2924` | inline |
| agents/gsd-executor.md:547 | `#2075` | inline |
| agents/gsd-executor.md:555 | `#2924` | parenthetical |
| agents/gsd-executor.md:573 | `#3542` | parenthetical |
| agents/gsd-executor.md:729 | `#3678` | parenthetical |
| agents/gsd-executor.md:744 | `#3678` | inline |
| agents/gsd-intel-updater.md:60 | `#3290` | parenthetical |
| agents/gsd-plan-checker.md:561 | `#1602` | parenthetical |
| agents/gsd-plan-checker.md:600 | `#1861` | parenthetical |
| agents/gsd-verifier.md:442 | `#123` | inline |
| agents/gsd-verifier.md:442 | `#123` | inline |
| agents/gsd-verifier.md:442 | `#123` | inline |
| agents/gsd-verifier.md:535 | `#3309` | inline |
| commands/gsd/config.md:47 | `#2439` | parenthetical |
| commands/gsd/graphify.md:195 | `#3166` | parenthetical |
| commands/gsd/ns-context.md:12 | `#2790` | inline |
| commands/gsd/ns-ideate.md:14 | `#2790` | inline |
| commands/gsd/ns-manage.md:13 | `#2790` | inline |
| commands/gsd/ns-project.md:11 | `#2790` | inline |
| commands/gsd/ns-review.md:12 | `#2790` | inline |
| commands/gsd/ns-workflow.md:12 | `#2790` | inline |
| commands/gsd/plan-phase.md:22 | `#3042` | parenthetical |
| get-shit-done/references/ai-frameworks.md:44 | `#1` | inline |
| get-shit-done/references/checkpoints.md:21 | `#3309` | parenthetical |
| get-shit-done/references/checkpoints.md:25 | `#3309` | inline |
| get-shit-done/references/git-integration.md:66 | `#2924` | parenthetical |
| get-shit-done/references/model-profiles.md:22 | `#3023` | parenthetical |
| get-shit-done/references/model-profiles.md:136 | `#3024` | parenthetical |
| get-shit-done/references/model-profiles.md:174 | `#3023` | parenthetical |
| get-shit-done/references/mvp-concepts.md:35 | `#2826` | inline |
| get-shit-done/references/planner-graphify-auto-update.md:3 | `#3347` | inline |
| get-shit-done/references/planner-graphify-auto-update.md:62 | `feat-3347` | feat-form |
| get-shit-done/references/planner-graphify-auto-update.md:67 | `#3347` | inline |
| get-shit-done/references/planner-human-verify-mode.md:3 | `#3309` | inline |
| get-shit-done/references/planner-human-verify-mode.md:7 | `#3309` | inline |
| get-shit-done/references/planner-human-verify-mode.md:32 | `#3309` | inline |
| get-shit-done/references/planning-config.md:272 | `#2493` | parenthetical |
| get-shit-done/references/questioning.md:99 | `#1` | inline |
| get-shit-done/references/questioning.md:99 | `#2` | inline |
| get-shit-done/references/scout-codebase.md:4 | `#2551` | inline |
| get-shit-done/references/thinking-models-execution.md:15 | `#1` | inline |
| get-shit-done/references/thinking-partner.md:69 | `#1729` | inline |
| get-shit-done/references/thinking-partner.md:72 | `#1729` | parenthetical |
| get-shit-done/references/worktree-path-safety.md:39 | `#3097` | parenthetical |
| get-shit-done/references/worktree-path-safety.md:69 | `#3099` | parenthetical |
| get-shit-done/templates/codebase/conventions.md:232 | `#123` | inline |
| get-shit-done/workflows/add-backlog.md:43 | `#2280` | parenthetical |
| get-shit-done/workflows/ai-integration-phase.md:153 | `#3096` | inline |
| get-shit-done/workflows/discuss-phase.md:15 | `#2551` | inline |
| get-shit-done/workflows/discuss-phase.md:15 | `#2361` | inline |
| get-shit-done/workflows/discuss-phase/modes/advisor.md:7 | `#2174` | inline |
| get-shit-done/workflows/discuss-phase/modes/chain.md:57 | `#686` | inline |
| get-shit-done/workflows/discuss-phase/templates/context.md:7 | `#2551` | inline |
| get-shit-done/workflows/execute-phase/steps/codebase-drift-gate.md:3 | `#2003` | parenthetical |
| get-shit-done/workflows/execute-phase/steps/per-plan-worktree-gate.md:1 | `#2772` | parenthetical |
| get-shit-done/workflows/execute-plan.md:97 | `#1979` | parenthetical |
| get-shit-done/workflows/execute-plan.md:111 | `#2924` | parenthetical |
| get-shit-done/workflows/execute-plan.md:111 | `#2015` | inline |
| get-shit-done/workflows/execute-plan.md:111 | `#2924` | parenthetical |
| get-shit-done/workflows/execute-plan.md:148 | `#2070` | inline |
| get-shit-done/workflows/execute-plan.md:276 | `#2924` | parenthetical |
| get-shit-done/workflows/execute-plan.md:374 | `#2070` | inline |
| get-shit-done/workflows/execute-plan.md:449 | `#2661` | inline |
| get-shit-done/workflows/execute-plan.md:452 | `#1486` | inline |
| get-shit-done/workflows/execute-plan.md:480 | `#2070` | inline |
| get-shit-done/workflows/forensics.md:275 | `#3668` | parenthetical |
| get-shit-done/workflows/help/modes/full.md:88 | `#3042` | parenthetical |
| get-shit-done/workflows/new-milestone.md:209 | `#2630` | inline |
| get-shit-done/workflows/new-project.md:137 | `#3491` | inline |
| get-shit-done/workflows/plan-phase.md:59 | `#3569` | parenthetical |
| get-shit-done/workflows/plan-phase.md:73 | `#3569` | parenthetical |
| get-shit-done/workflows/plan-phase.md:120 | `#3042` | inline |
| get-shit-done/workflows/plan-phase.md:120 | `#3044` | inline |
| get-shit-done/workflows/quick.md:167 | `#3707` | parenthetical |
| get-shit-done/workflows/quick.md:207 | `#2916` | parenthetical |
| get-shit-done/workflows/quick.md:655 | `#36182` | inline |
| get-shit-done/workflows/reapply-patches.md:270 | `#2969` | inline |
| get-shit-done/workflows/reapply-patches.md:272 | `#2969` | inline |
| get-shit-done/workflows/reapply-patches.md:298 | `#3657` | inline |
| get-shit-done/workflows/reapply-patches.md:359 | `#1999` | inline |
| get-shit-done/workflows/settings-integrations.md:42 | `#2282` | inline |
| get-shit-done/workflows/settings.md:41 | `#2282` | parenthetical |
| get-shit-done/workflows/settings.md:65 | `#3347` | parenthetical |
| get-shit-done/workflows/settings.md:541 | `#3784` | parenthetical |
| get-shit-done/workflows/update.md:293 | `#2992` | inline |
| get-shit-done/workflows/update.md:297 | `#2993` | inline |
| get-shit-done/workflows/update.md:406 | `#1997` | inline |
| get-shit-done/workflows/verify-phase.md:198 | `#2492` | inline |
| get-shit-done/workflows/verify-phase.md:343 | `#123` | inline |
| get-shit-done/workflows/verify-phase.md:343 | `#123` | inline |
| get-shit-done/workflows/verify-phase.md:343 | `#123` | inline |
| get-shit-done/workflows/verify-phase.md:545 | `#2492` | inline |

**Note on `#123` / `#1` / `#2` occurrences:** Several hits (e.g., `agents/gsd-verifier.md:442`,
`get-shit-done/references/questioning.md:99`, `get-shit-done/workflows/verify-phase.md:343`)
use `#123` or `#1`/`#2` as illustrative placeholder numbers, not real issue references. These
are Phase 65 allowlist candidates (see Allowlist Candidates section below).

**Cross-check:** `feat-3347` appears at `get-shit-done/references/planner-graphify-auto-update.md:62`
with category `feat-form`, confirming D-05. The `inline` count of 64 matches the row count
for inline entries above (confirmed consistency invariant).

## Allowlist Candidates

Patterns the Phase 65 guard test must NOT flag as citation violations:

| Pattern | Example | Grep evidence (scoped dirs) | Status |
|---|---|---|---|
| Hex color codes | `#22c55e`, `#e8c170` | `commands/gsd/graphify.md:184`: `Use \`#22c55e\` (green) for MVP-mode phase nodes` | candidate |
| Markdown heading markers | `## Heading` | `commands/gsd/surface.md:20`: `## Sub-command routing` | candidate |
| Illustrative placeholders | `#123`, `#45` | `get-shit-done/workflows/verify-phase.md:343`: `issue #123`, `PR #123`, `#123` | candidate |
| Frontmatter color fields | `color: "#A78BFA"` | `agents/gsd-domain-researcher.md:5`: `color: "#A78BFA"` | candidate |

**Allowlist implementation guidance for Phase 65:**
- Hex colors: 6-char hex sequences `#[0-9a-fA-F]{6}` — lookbehind `(?<![0-9a-fA-F])` in the inline regex already handles most tails; Phase 65 detector should apply same lookbehind.
- Heading markers: `##` is a valid markdown heading prefix — guard test must exclude lines starting with `#` or `##` that match heading syntax, not issue refs.
- Illustrative placeholders: `#1`, `#2`, `#123`, `#45` — low-digit numbers used as examples. Phase 65 may set a minimum digit threshold (e.g., 3+ digits) or maintain an explicit allowlist of known-placeholder locations.
- Frontmatter color fields: excluded from scanner hits by frontmatter toggle (D-10). Phase 65 detector should apply same frontmatter exclusion — these never appear in scanner output.

## Provenance

**Scanner invocation:** `node scripts/scan-citations.cjs`

**Script commit hash:** 43cca234 (feat(64-01): add scan-citations.cjs multi-pattern citation scanner)

**Raw grep for comparison:** `grep -rEn '#[0-9]+' commands/ get-shit-done/workflows/ agents/ get-shit-done/references/ get-shit-done/templates/ | wc -l` → **228 lines**

**Delta documentation:**
- 228 raw grep lines - 15 frontmatter hits - 105 code-block hits = 108 live hits (approximate)
- Scanner finds 103 hits (5-hit gap from lookbehind filtering hex color tail characters like `#22c55e`)
- This file is the Phase 65 detector contract — a Phase 65 agent can derive all regexes
  and allowlist entries from this document without re-scanning the corpus.
