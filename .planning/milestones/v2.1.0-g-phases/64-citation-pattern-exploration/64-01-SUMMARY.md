---
phase: 64-citation-pattern-exploration
plan: 01
subsystem: testing
tags: [citation, scanner, regex, CommonJS, grep, findings]

# Dependency graph
requires: []
provides:
  - "scripts/scan-citations.cjs: zero-dependency CommonJS multi-pattern citation scanner"
  - "64-FINDINGS.md: Phase 65 detector contract with Summary + Findings Table + Allowlist Candidates"
affects: [65-guard-test-red, 66-citation-cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Citation scanner pattern: collectMarkdownFiles + SCAN_DIRS + frontmatter/code-block toggle per normalize-step-numbers.cjs analog"
    - "JSON stdout output pattern: process.stdout.write(JSON.stringify(hits, null, 2) + newline) + process.exit(0)"

key-files:
  created:
    - scripts/scan-citations.cjs
    - .planning/phases/64-citation-pattern-exploration/64-FINDINGS.md
  modified: []

key-decisions:
  - "D-01 implemented: 64-FINDINGS.md written to .planning/phases/64-citation-pattern-exploration/ — Phase 65 reads it directly"
  - "D-02 implemented: Findings Table has exactly three columns: file:line | matched_text | category"
  - "D-03 implemented: FINDINGS.md opens with Summary section listing categories, counts, and delta from raw grep"
  - "D-04 implemented: Taxonomy includes inline #NNN, parenthetical (#NNN), word-form, feat-form; test filenames/adr-NNN slugs not classified"
  - "D-05 confirmed: feat-3347 in get-shit-done/references/planner-graphify-auto-update.md:62 detected as feat-form"
  - "D-06 implemented: Allowlist Candidates section with 4 rows (hex colors, heading markers, placeholders, frontmatter color)"
  - "D-07 implemented: Each allowlist row carries grep evidence or explicit 'not present' marker"
  - "D-08 implemented: scripts/scan-citations.cjs exists as zero-dependency CommonJS"
  - "D-09 implemented: Script writes JSON to stdout and exits 0"
  - "D-10 implemented: Single-pass scan; YAML frontmatter and fenced code blocks excluded from hits"

requirements-completed: [CITE-01, CITE-02]

# Metrics
duration: 11min
completed: 2026-06-09
---

# Phase 64 Plan 01: Citation Pattern Exploration Summary

**Zero-dependency CommonJS scanner (scan-citations.cjs) plus structured 64-FINDINGS.md contract — 103 citation hits across 317 files with inline/parenthetical/feat-form taxonomy and 4 allowlist candidate rows with grep evidence**

## Performance

- **Duration:** 11 min
- **Started:** 2026-06-09T04:24:18Z
- **Completed:** 2026-06-09T04:35:47Z
- **Tasks:** 2 of 2 completed
- **Files created:** 2

## Accomplishments

- Built `scripts/scan-citations.cjs` — zero-dependency CommonJS multi-pattern citation scanner mirroring `normalize-step-numbers.cjs` structure, with 5 SCAN_DIRS, frontmatter/code-block exclusion, and JSON stdout output
- Confirmed `feat-3347` in `get-shit-done/references/planner-graphify-auto-update.md:62` detected as `feat-form` (D-05 verified)
- Produced `64-FINDINGS.md`: 103-row findings table (sorted by file:line), Summary with category breakdown, and 4 Allowlist Candidates rows with grep evidence — Phase 65 detector contract is complete
- `npm test` baseline unchanged: 8352 tests pass, 0 failures

## Citation Hits Found (Category Breakdown)

| Category | Count | Notes |
|---|---|---|
| `inline` | 64 | Standalone `#NNN` issue refs in prose |
| `parenthetical` | 38 | `(#NNN)` wrapped refs in prose |
| `word-form` | 0 | No "issue NNN" or "PR NNN" found in 5 scoped dirs |
| `feat-form` | 1 | `feat-3347` in planner-graphify-auto-update.md:62 |
| **Total** | **103** | 49 files contain at least one hit |

**Raw grep count vs scanner:** Raw grep finds 228 `#[0-9]+` lines; scanner reports 103 hits. Delta of 125 is explained by YAML frontmatter exclusion (15 hits) and fenced code-block exclusion (110 hits).

**Baseline reconciliation:** CONTEXT.md confirmed baseline of 211 "inline #NNN hits" was a raw grep count (no frontmatter/code-block exclusion, no inline/parenthetical split). After applying D-10 exclusions and D-04 taxonomy, the scanner correctly reports 102 prose `#NNN` hits (64 inline + 38 parenthetical). The 211 figure represents the Phase 66 cleanup target including code-block occurrences.

## Allowlist Candidate Status

| Pattern | Grep evidence in scoped dirs | Status |
|---|---|---|
| Hex color codes (`#22c55e`) | `commands/gsd/graphify.md:184` — 29 hits | candidate |
| Markdown heading markers (`## Heading`) | `commands/gsd/surface.md:20` — many hits | candidate |
| Illustrative placeholders (`#123`, `#45`) | `get-shit-done/workflows/verify-phase.md:343` — 5 hits | candidate |
| Frontmatter color fields (`color: "#A78BFA"`) | `agents/gsd-domain-researcher.md:5` — present | candidate (already excluded by frontmatter toggle) |

## Task Commits

1. **Task 1: Build scripts/scan-citations.cjs multi-pattern scanner** - `43cca234` (feat)
2. **Task 2: Run scanner and write 64-FINDINGS.md** - `d757bb50` (feat)

## Files Created

- `scripts/scan-citations.cjs` — Multi-pattern citation scanner; emits JSON hits `{file, line, text, category}` to stdout; zero-dependency CommonJS; exits 0
- `.planning/phases/64-citation-pattern-exploration/64-FINDINGS.md` — Phase 65 detector contract; Summary + 103-row Findings Table + Allowlist Candidates

## Decisions Made

All 10 decisions (D-01 through D-10) from CONTEXT.md implemented as specified. No new architectural decisions were needed.

## Deviations from Plan

### Auto-fixed / Documented Issues

**1. [Rule 1 - Calibration Bug] Acceptance criterion `inline >= 200` uncachievable as specified**
- **Found during:** Task 1 (scanner implementation and verification)
- **Issue:** The plan's acceptance criterion requires `h.filter(x=>x.category==='inline').length >= 200`. The plan also requires: (a) D-04 parenthetical subcategory separate from inline, and (b) D-10 code-block exclusion. With both constraints applied, the maximum achievable `inline` count is 64 (78 without code-block exclusion — still not 200). The plan's must_haves baseline of "211 inline #NNN hits" was computed from raw grep before inline/parenthetical split and before code-block exclusion.
- **Fix:** Scanner implemented correctly per D-04 and D-10. Actual counts documented in FINDINGS.md with full delta explanation. The criterion is logged as a plan calibration error — not an implementation error. Two fix attempts were made (removing lookbehind, removing code-block exclusion) before concluding the threshold is irreconcilable with the other plan constraints.
- **Files modified:** None — scanner is correct
- **Verification:** Scanner runs cleanly, feat-3347 detected, all other acceptance criteria pass, `npm test` baseline unchanged
- **Impact:** FINDINGS.md accurately documents 103 total hits and provides Phase 65 with correct detector-regex inputs. The calibration error does not affect Phase 65 correctness.

---

**Total deviations:** 1 documented (plan calibration; not an implementation error)
**Impact on plan:** Scanner and FINDINGS.md are both correct. Phase 65 can derive all regexes from the findings document without re-scanning. The only gap is the inline count criterion (64, not 200) which was miscalibrated against the raw grep count.

## Requirements Satisfied

- **CITE-01:** Every citation format in the 5 scoped dirs documented in the Findings Table with category assignment — SATISFIED (103 hits across inline, parenthetical, feat-form; word-form confirmed absent)
- **CITE-02:** Every entry carries `file:line`, `matched_text`, and `category` per D-02 schema — SATISFIED

## Issues Encountered

None beyond the acceptance criterion calibration issue documented in Deviations above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Phase 65 (Guard Test RED) can proceed immediately:
- `64-FINDINGS.md` provides all regexes and allowlist data
- Confirmed taxonomy: 4 categories (inline, parenthetical, word-form, feat-form)
- Confirmed allowlist candidates: hex colors, heading markers, small-digit placeholders, frontmatter color fields
- Confirmed `feat-3347` as a real feat-form hit (not to be allowlisted)
- `scripts/scan-citations.cjs` is the reference implementation for detector regex authoring

---
*Phase: 64-citation-pattern-exploration*
*Completed: 2026-06-09*

## Self-Check

**Files exist:**
- `scripts/scan-citations.cjs`: FOUND
- `.planning/phases/64-citation-pattern-exploration/64-FINDINGS.md`: FOUND

**Commits exist:**
- `43cca234` (Task 1): FOUND
- `d757bb50` (Task 2): FOUND

## Self-Check: PASSED
