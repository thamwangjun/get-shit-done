---
quick_id: 260526-enb
slug: v2-1-0-a-tech-debt-cleanup
description: Fix 8 tech debt items from v2.1.0-a milestone audit — stale update.md metadata and tracking inconsistencies
status: pending
---

# v2.1.0-a Tech Debt Cleanup

## Overview

8 items left over from the v2.1.0-a milestone. All work is pure metadata/doc edits — no
production logic changes. No tests required. Two logical groups:

- **Group A** (3 items): `get-shit-done/workflows/update.md` still has semver/npm
  references that Phase 43 should have resolved in prose but missed.
- **Group B** (5 items): REQUIREMENTS.md, ROADMAP.md, and SUMMARY.md files have stale
  checkboxes, wrong test counts, and missing frontmatter fields.

Both groups are independent (different files) — execute in parallel or sequentially.

---

## Wave 1 — Two parallel tasks

### Task A: Fix stale semver metadata in update.md

**File:** `get-shit-done/workflows/update.md`

**Three changes, all in the same file:**

**Change 1 — `<purpose>` tag (line 1–3)**

Replace the existing `<purpose>` block:

```
Check for GSD updates via npm, display changelog for versions between installed and
latest, obtain user confirmation, and execute clean installation with cache clearing.
```

With:

```
Check for GSD updates via the GitHub Commits API, compare current installed SHA against
the latest commit SHA on the fork's main branch, obtain user confirmation, and execute
clean installation with cache clearing.
```

**Change 2 — `<success_criteria>` (lines 603–612)**

Locate the `<success_criteria>` block. Replace these two lines:

```
- [ ] Latest version checked via npm
- [ ] Changelog fetched and displayed BEFORE update
```

With:

```
- [ ] Latest commit SHA fetched via GitHub Commits API
- [ ] SHA comparison performed and displayed BEFORE update
```

**Change 3 — `display_result` template (lines 572–583)**

Replace the fenced display block:

```
╔═══════════════════════════════════════════════════════════╗
║  GSD Updated: v1.5.10 → v1.5.15                           ║
╚═══════════════════════════════════════════════════════════╝

⚠️  Restart your runtime to pick up the new commands.

[View full changelog](https://github.com/open-gsd/get-shit-done-redux/blob/main/CHANGELOG.md)
```

With:

```
╔═══════════════════════════════════════════════════════════╗
║  GSD Updated: abc1234 → def5678                           ║
╚═══════════════════════════════════════════════════════════╝

⚠️  Restart your runtime to pick up the new commands.

[View recent commits](https://github.com/thamwangjun/get-shit-done/commits/main)
```

**Verification:** After editing, confirm:

```bash
command grep -c "via npm" get-shit-done/workflows/update.md
# must return 0

command grep -c "open-gsd/get-shit-done-redux" get-shit-done/workflows/update.md
# must return 0

command grep -c "thamwangjun/get-shit-done/commits/main" get-shit-done/workflows/update.md
# must return >= 1
```

**Commit message:**

```
docs(update.md): fix stale semver/npm metadata in purpose, success_criteria, display_result
```

---

### Task B: Fix tracking artifacts (REQUIREMENTS.md, ROADMAP.md, SUMMARY files)

**Five sub-items across four files. Apply all changes in a single commit.**

#### B1 — REQUIREMENTS.md: Mark UPD-01, UPD-02, TEST-03, GATE-01 as complete

File: `.planning/REQUIREMENTS.md`

**Checkbox lines** — change `[ ]` to `[x]` on these four lines:

```
- [ ] **UPD-01**: ...
- [ ] **UPD-02**: ...
- [ ] **TEST-03**: ...
- [ ] **GATE-01**: ...
```

Become:

```
- [x] **UPD-01**: ...
- [x] **UPD-02**: ...
- [x] **TEST-03**: ...
- [x] **GATE-01**: ...
```

**Traceability table** — change `Pending` to `Complete` for these four rows:

```
| UPD-01 | Phase 43 | Pending |
| UPD-02 | Phase 43 | Pending |
| TEST-03 | Phase 43 | Pending |
| GATE-01 | Phase 43 | Pending |
```

Become:

```
| UPD-01 | Phase 43 | Complete |
| UPD-02 | Phase 43 | Complete |
| TEST-03 | Phase 43 | Complete |
| GATE-01 | Phase 43 | Complete |
```

#### B2 — ROADMAP.md progress table: Phase 42 row

File: `.planning/ROADMAP.md`

Locate the progress table row for Phase 42:

```
| 42. SHA Hook and Install Reimplementation | v2.1.0-a | 0/0 | Not started | - |
```

Replace with:

```
| 42. SHA Hook and Install Reimplementation | v2.1.0-a | 1/1 | Complete | 2026-05-25 |
```

#### B3 — ROADMAP.md active milestone section: Phase 42 checkbox

File: `.planning/ROADMAP.md`

Locate the active milestone section. Find:

```
- [ ] **Phase 42: SHA Hook and Install Reimplementation** — Reimplement SHA versioning...
```

Replace with:

```
- [x] **Phase 42: SHA Hook and Install Reimplementation** — Reimplement SHA versioning in the background update-check hook, install.js VERSION writing, and statusline (completed 2026-05-25)
```

#### B4 — 42-01-SUMMARY.md: Fix test counts

File: `.planning/phases/42-sha-hook-and-install-reimplementation/42-01-SUMMARY.md`

Locate the Tests section (around line 51):

```
- `tests/semver-compare.test.cjs`: 21 tests (9 isNewer + 3 HOOK-03 + 4 HOOK-04 static) — all pass
- `tests/version-detection.test.cjs`: 2 tests (INST-01 + INST-02 static assertions) — all pass
```

Replace with:

```
- `tests/semver-compare.test.cjs`: 17 tests (9 isNewer + 3 HOOK-03 + 4 HOOK-04 static) — all pass
- `tests/version-detection.test.cjs`: 9 tests — all pass
```

#### B5 — Add `requirements-completed` frontmatter to both SUMMARY files

**42-01-SUMMARY.md** — add this field to the existing YAML frontmatter block (insert after the `metrics:` block, before the closing `---`):

```yaml
requirements_completed: [HOOK-01, HOOK-02, HOOK-03, HOOK-04, HOOK-05, INST-01, INST-02, INST-03, INST-04, STAT-01, STAT-02, TEST-01, TEST-02]
```

**43-01-SUMMARY.md** (`43-update-workflow-sha-migration-full-gate/43-01-SUMMARY.md`) — add this field to the existing YAML frontmatter block (insert after the `tech_stack:` block, before the closing `---`):

```yaml
requirements_completed: [UPD-01, UPD-02, TEST-03, GATE-01]
```

**Verification for Task B:**

```bash
# UPD-01, UPD-02, TEST-03, GATE-01 all show [x] in REQUIREMENTS.md
command grep -c "\- \[x\] \*\*UPD-01" .planning/REQUIREMENTS.md
# returns 1

# Traceability table has no more Pending for Phase 43
command grep "Phase 43" .planning/REQUIREMENTS.md
# all four rows show Complete

# Phase 42 progress row updated
command grep "42. SHA Hook" .planning/ROADMAP.md
# shows 1/1 | Complete | 2026-05-25

# Phase 42 active milestone checkbox
command grep "Phase 42: SHA Hook" .planning/ROADMAP.md | command grep "\[x\]"
# returns 1 match

# Test counts corrected in 42-01-SUMMARY.md
command grep "17 tests" .planning/phases/42-sha-hook-and-install-reimplementation/42-01-SUMMARY.md
# returns 1

# requirements_completed field present in both SUMMARYs
command grep "requirements_completed" .planning/phases/42-sha-hook-and-install-reimplementation/42-01-SUMMARY.md
command grep "requirements_completed" .planning/phases/43-update-workflow-sha-migration-full-gate/43-01-SUMMARY.md
```

**Commit message:**

```
docs(tracking): mark v2.1.0-a requirements complete, fix phase 42 progress row and test counts
```

---

## Final check after both tasks

Run `npm test` to confirm no regressions. The changeset-cli test (F1) already asserts
SHA-based content in update.md — if the `<purpose>` or `<success_criteria>` edits
inadvertently break any test assertions, fix those tests in the same commit as the
update.md edits.

Expected: test suite exits with the same pre-existing failure count (185 non-ai-evals
failures).
