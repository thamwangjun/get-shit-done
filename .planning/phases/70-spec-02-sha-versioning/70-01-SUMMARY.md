---
phase: 70-spec-02-sha-versioning
plan: "01"
subsystem: spec
tags: [spec, sha-versioning, documentation]
dependency_graph:
  requires: []
  provides: [".planning/spec/02-sha-versioning/SPEC.md (Status: Ready)"]
  affects: [".planning/spec/INDEX.md (SPEC-02 row)", ".planning/phases/73-spec-03 (depends on this spec)"]
tech_stack:
  added: []
  patterns: ["behavioral-contract spec", "EARS invariants", "NN-INV-M ID scheme", "advisory Code Context"]
key_files:
  modified: [".planning/spec/02-sha-versioning/SPEC.md"]
decisions:
  - "Six behavioral-role invariants (02-INV-1..02-INV-6) cover the SHA versioning system end-to-end with no MISSING rows"
  - "D-10 sentinel count narrated as shape-normative (current as of 2026-06-12), not a durable magic number"
  - "HOOK-03 isNewer-before-writeResult tests folded into 02-INV-3 as a structural property of isNewer"
  - "Placeholder substitution ({{GSD_REPO}}/{{GSD_BRANCH}}/{{GSD_VERSION}}) kept as sub-clause of 02-INV-1 — invariant not overloaded"
  - "Frontmatter Reimplementation evidence expanded to all five tier-1 files per RESEARCH §8"
metrics:
  duration: "~3 minutes"
  completed: "2026-06-12"
  tasks_completed: 2
  files_modified: 1
---

# Phase 70 Plan 01: spec-02-sha-versioning Summary

**One-liner:** SHA-based versioning contract (git-SHA emit, `no-network` sentinel, `isNewer` equality, GitHub Commits API, injectable seam, SHA-label display) specified in 6 EARS invariants with 41 traceability rows across five tier-1 test files; Status advanced to Ready.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Author normative core — Purpose, Scope, ~6 invariants, Acceptance Tests | 13e4a45a | `.planning/spec/02-sha-versioning/SPEC.md` |
| 2 | Author Key Decisions, Code Context, advance Status Draft -> Ready | ea2a4fb8 | `.planning/spec/02-sha-versioning/SPEC.md` |

## What Was Built

### Task 1 — Normative Core

Filled the first four sections of the SPEC.md stub:

**Purpose:** One paragraph explaining why the SHA-based versioning system is necessary for the fork — the npm registry never reflects fork-specific commits, so the fork's HEAD commit SHA is the only authoritative version signal; absent or wrong, version display and update detection revert to upstream npm versioning or apply undefined semver-ordering to hex strings.

**Scope:** Two bullet lists. In scope: git-SHA emit, `no-network` sentinel, `isNewer` SHA-equality, GitHub Commits API fetch, `check-latest-version.cjs` seam I/O contract, statusline/update.md display, and the `{{GSD_REPO}}`/`{{GSD_BRANCH}}`/`{{GSD_VERSION}}` placeholder substitution. Out of scope: Eta `<%~ include() %>` materialization (SPEC-04), and the win32 `shell: true` spawn-gating test (D-03 exclusion).

**Invariants:** Six EARS statements covering all behavioral roles:
- `02-INV-1` — SHA emit at install + placeholder substitution boundary (Ubiquitous + SHALL NOT sub-clause)
- `02-INV-2` — no-network sentinel semantics (Unwanted-behavior + D-10 shape-normative narration)
- `02-INV-3` — isNewer SHA-equality with null-safety and HOOK-03 source-order structural property (Ubiquitous + Unwanted-behavior)
- `02-INV-4` — GitHub Commits API source, no npmjs.com (Ubiquitous + Unwanted-behavior)
- `02-INV-5` — check-latest-version.cjs seam I/O contract with three return conditions (Ubiquitous)
- `02-INV-6` — Display: SHA labels, no parseV/isDevInstall, binary equality (Ubiquitous + Unwanted-behavior)

**Acceptance Tests:** 41-row traceability table keyed on `02-INV-M`. All five tier-1 files cited. No `[MISSING — write test first]` rows. Anchor verbatim subtest names present: `install.js source contains git rev-parse --short`, `install.js has no-network sentinel as initial gsdVersion value`, `null latest — no false positive`, `worker source does not contact npmjs.com`, `CHECK_REASON enum exposes the documented codes`, `update.md contains "Installed SHA:" label`.

Frontmatter `Reimplementation evidence` expanded to all five tier-1 files.

### Task 2 — Key Decisions, Code Context, Status Ready

**Key Decisions:** Four settled decisions (KD-A..KD-D), each with statement + rationale + "Settled — do not reopen. Consequence of reopening: ...":
- KD-A (ROADMAP-mandated): GitHub Commits API, not npmjs.com
- KD-B (ROADMAP-mandated): SHA equality, not semver ordering
- KD-C: no-network sentinel signals invalid install, not empty string (D-04)
- KD-D: check-latest-version.cjs extracted as injectable seam for testability (D-05)

**Code Context:** Section opened with `<!-- advisory -->` marker and dated advisory header. Symbols grouped by five implementation files: `bin/install.js`, `hooks/gsd-check-update-worker.js`, `get-shit-done/bin/check-latest-version.cjs`, `hooks/gsd-statusline.js`, `get-shit-done/workflows/update.md`. No normative claim rests on any advisory symbol.

**Frontmatter:** `**Status:** Ready`, `**Confidence:** High`, `**Specced:** 2026-06-12`.

## Deviations from Plan

None — plan executed exactly as written. All open questions from RESEARCH resolved:
1. Invariant count: 6 (placeholder substitution folded into 02-INV-1 as a sub-clause — not overloaded)
2. HOOK-03 placement: folded into 02-INV-3 as structural property of `isNewer` (consistent with Phase 69 precedent)
3. D-10 count: narrated as shape-normative with "current as of 2026-06-12" per QUAL-04 approach

## QUAL-01..05 Satisfaction

| Quality Bar | Status | Evidence |
|-------------|--------|----------|
| QUAL-01 (numbered EARS invariants) | Satisfied | 6 numbered `02-INV-M` EARS statements with RFC 2119 MUST/SHALL/SHALL NOT |
| QUAL-02 (traceability table, no MISSING rows) | Satisfied | 41 rows, all 6 MUST invariants traced, 0 MISSING rows |
| QUAL-03 (advisory marking, move-proof) | Satisfied | `## Code Context` opened with `<!-- advisory -->`, D-10 count narrated as "current as of 2026-06-12" |
| QUAL-04 (tier-1 citation) | Satisfied | All five tier-1 test files cited in Acceptance Tests table and frontmatter |
| QUAL-05 (Key Decisions with consequences) | Satisfied | 4 KDs with "Settled — do not reopen. Consequence of reopening: ..." format; both ROADMAP-mandated KDs (npmjs.com, semver ordering) present |

## Known Stubs

None. The SPEC.md is a complete prose artifact — no data stubs, placeholder text, or wired-empty components. All `<!-- to be filled -->` comments replaced.

## Threat Flags

None. This phase authors a static Markdown documentation artifact with no code execution, network surface, or untrusted input. The advisory Code Context section lists implementation symbols under `<!-- advisory -->` as designed — no normative claims rest on them.

## Self-Check: PASSED

Files exist:
- `.planning/spec/02-sha-versioning/SPEC.md` — FOUND

Commits exist:
- `13e4a45a` (Task 1) — present in git log
- `ea2a4fb8` (Task 2) — present in git log

Verification counts:
- `grep -c '02-INV-'` = 47 (>=6 required)
- `grep -cE '^## ...'` = 6 (exactly 6 locked sections)
- All 5 tier-1 files cited — no MISSING TIER-1 FILE lines
- `grep -c 'MISSING — write test first'` = 0
- `grep -c 'Settled — do not reopen'` = 4 (>=4 required)
- `**Status:** Ready` — present
- `**Specced:** 2026-06-12` — present
- `grep -c 'to be filled'` = 0
