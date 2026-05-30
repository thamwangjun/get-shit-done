# Phase 50: Maintenance Script and Cross-Ref Scanner - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 50-Maintenance Script and Cross-Ref Scanner
**Areas discussed:** Normalize script cross-file ref discovery, Cross-file scanner detection pattern breadth, scanForOutOfOrder anchor hardening

---

## Normalize Script: Cross-File Ref Discovery

| Option | Description | Selected |
|--------|-------------|----------|
| Dynamic grep on every run | Grep entire corpus for `filename.md step N` patterns on each run. No manifest needed — always accurate after any upstream merge. | ✓ |
| Read Phase 49's MAP-01.md | Consume `.planning/phases/49-*/49-MAP-01.md`. Simpler but static — won't catch new cross-file refs from future upstream merges. | |
| Build and persist a manifest file | First run produces manifest, subsequent runs read it. Adds file I/O complexity — overkill for a maintenance script. | |

**User's choice:** Dynamic grep on every run
**Notes:** None — accepted recommended option

Follow-up: Cross-file ref updates should be printed in the script's output alongside file-level rename stats (transparency for post-merge verification).

---

## Cross-File Scanner: Detection Pattern Breadth

| Option | Description | Selected |
|--------|-------------|----------|
| `filename.md step N` only | Matches exact corpus pattern from MAP-01. Precise, low false-positive risk. | |
| Both word-order variants | Detects `filename.md step N` AND `step N in filename.md`. Catches reversed forms even if no such patterns exist yet. | ✓ |
| Any co-occurrence of filename.md and step N | Broadest — higher false-positive risk for unrelated proximity. | |

**User's choice:** Both word-order variants
**Notes:** None

Follow-up: Step existence check uses prose headings only (skip code fences) — mirrors `step-numbering-scan.test.cjs` behavior.

---

## scanForOutOfOrder Anchor Hardening

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone plan first | Plan 1 hardens the anchor in `tests/step-numbering-scan.test.cjs` before building new artifacts. Scanner is solid before new work builds on it. | ✓ |
| Bundle with normalize script plan | One plan does anchor hardening + creates `normalize-step-numbers.cjs`. Fewer plans, mixed concerns. | |
| Bundle with cross-file scanner plan | Groups both test changes together. | |

**User's choice:** Standalone plan first
**Notes:** None — accepted recommended option

---

## Claude's Discretion

- Exact output format of normalize script (tabular, list, or summary counts)
- Whether normalize script accepts specific file paths as arguments for targeted runs
- Synthetic stale ref injection mechanism in the RED test (temp file vs. inline fixture)

## Deferred Ideas

None — discussion stayed within phase scope
