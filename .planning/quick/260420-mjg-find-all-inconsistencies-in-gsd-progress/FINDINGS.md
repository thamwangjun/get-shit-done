# GSD Progress File Inconsistencies — Findings

**Audited:** 2026-04-20
**Files examined:** STATE.md, ROADMAP.md, REQUIREMENTS.md, MILESTONES.md, v1.37.1-MILESTONE-AUDIT.md
**Total discrepancies found:** 18

## Summary

| # | File(s) | Field / Section | Severity | Short Description |
|---|---------|-----------------|----------|-------------------|
| F-01 | STATE.md | `progress.total_phases` (frontmatter) | STALE | `total_phases: 4` should be 6 (v1.37.1 phases 7–12) |
| F-02 | STATE.md | `progress.completed_phases` (frontmatter) | STALE | `completed_phases: 4` conflicts with 50% body progress bar when percent says 100 |
| F-03 | STATE.md | `progress.total_plans` / `completed_plans` (frontmatter) | STALE | Both `6`; body bar shows 50% — counts only cover completed v1.37.1 plans, not total scope |
| F-04 | STATE.md | `percent: 100` vs body progress bar | CRITICAL | `percent: 100` directly contradicts body `Progress: [██████████··········] 50%` |
| F-05 | STATE.md | `stopped_at` vs body current focus | STALE | `stopped_at: Phase 10 complete` while body says `Current focus: Phase 11` — minor framing mismatch |
| F-06 | STATE.md | Performance Metrics section | STALE | All velocity metrics are placeholder dashes; never populated after 10 completed phases |
| F-07 | STATE.md | Quick Tasks table directory path | FORMATTING | Directory path `260420-m8f-fix-documentation-inconsistencies-in-roa` appears truncated |
| F-08 | ROADMAP.md | Phase 11 `**Plans**: 0 plans` | STALE | Success criteria defined but plan count is 0 — planning gap not yet resolved |
| F-09 | ROADMAP.md | Phase 12 `**Plans**: 0 plans` | STALE | Success criteria defined but plan count is 0 — planning gap not yet resolved |
| F-10 | ROADMAP.md | Phase numbering collision in Progress table | FORMATTING | Two rows numbered "4" and two rows numbered "5" across v1.36.0.b and v1.36.0.a |
| F-11 | ROADMAP.md | v1.37.1 section header format | FORMATTING | Uses plain `###` header; all shipped milestones use `<details>` blocks |
| F-12 | REQUIREMENTS.md | All 38 checkboxes show `[ ]` (Pending) | CRITICAL | Phases 7–10 complete; all 38 requirements confirmed SATISFIED in VERIFICATION.md files and audit |
| F-13 | REQUIREMENTS.md | All traceability rows show "Pending" | CRITICAL | All 38 traceability table rows say "Pending"; should say "Satisfied" |
| F-14 | REQUIREMENTS.md | MAINT-01 / MAINT-02 absent from traceability | STALE | Two v2 requirements exist but have no rows in the Traceability table |
| F-15 | MILESTONES.md | v1.37.1 milestone entry absent | STALE | MILESTONES.md contains only v1.36.0, v1.36.0.b, v1.36.0.a — no v1.37.1 entry |
| F-16 | MILESTONES.md / ROADMAP.md | Milestone ordering direction | FORMATTING | MILESTONES.md newest-first; ROADMAP.md oldest-first — no consistent convention |
| F-17 | REQUIREMENTS.md / v1.37.1-MILESTONE-AUDIT.md | CAT-05 count `~271` vs `270` | STALE | REQUIREMENTS.md says `~271`; audit and ROADMAP.md Phase 8 success criterion confirm `270` |
| F-18 | REQUIREMENTS.md / ROADMAP.md | Phase 1 completed before requirements defined | STALE | Phase 1 completed 2026-04-15; REQUIREMENTS.md `Defined: 2026-04-17` — scope clarification needed |

---

## Detailed Findings

### F-01 — STATE.md `total_phases` count is wrong for scope

**File(s):** `.planning/STATE.md`
**Section:** YAML frontmatter `progress` block, line 10
**Found:** `total_phases: 4`
**Expected:** `6` (v1.37.1 has Phases 7–12; 6 phases in the active milestone) or `12` (all phases across all milestones ever)
**Severity:** STALE
**Fix:** Update `total_phases` to `6` to reflect the 6 phases in the current v1.37.1 milestone, consistent with how `completed_phases: 4` refers to the 4 v1.37.1 phases completed (7–10).

---

### F-02 — STATE.md `completed_phases` inconsistent with progress bar and percent

**File(s):** `.planning/STATE.md`
**Section:** YAML frontmatter `progress` block and body `## Current Position`
**Found:** `completed_phases: 4` (frontmatter) and `Progress: [██████████··········] 50%` (body)
**Expected:** If scope is v1.37.1 (6 phases): 4/6 = 67%, not 50%. If scope is all milestones (12 phases): 10/12 = 83%, not 50%. Neither interpretation produces 50%. The value `4` would be correct for v1.37.1 scope, but must align with `total_phases` and `percent`.
**Severity:** STALE
**Fix:** Set `completed_phases: 4`, `total_phases: 6`, `percent: 67` and update the body progress bar to `[████████············] 67%` for v1.37.1 scope.

---

### F-03 — STATE.md `total_plans` and `completed_plans` cover only v1.37.1 completed plans

**File(s):** `.planning/STATE.md`
**Section:** YAML frontmatter `progress` block, lines 12–13
**Found:** `total_plans: 6` and `completed_plans: 6`
**Expected:** Cross-milestone total is 19 plans (v1.36.0: 7, v1.36.0.b: 2, v1.36.0.a: 4, v1.37.1 completed: 6). If scoped to v1.37.1 only: 6 of 6 defined plans completed, but Phases 11–12 will add more. The body progress bar `50%` is inconsistent with 6/6 (which would imply 100%).
**Severity:** STALE
**Fix:** Scope the counter consistently. For v1.37.1: set `total_plans` to the eventual total when Phases 11–12 plans are created (e.g., `8`), update `completed_plans: 6`, and recalculate `percent`.

---

### F-04 — STATE.md `percent: 100` directly contradicts body progress bar `50%`

**File(s):** `.planning/STATE.md`
**Section:** YAML frontmatter line 14 (`percent: 100`) vs body `## Current Position` (`Progress: [██████████··········] 50%`)
**Found:** `percent: 100` and `Progress: [██████████··········] 50%`
**Expected:** Both fields must agree. The correct value depends on scope: v1.37.1 phases = 4/6 = 67%; all phases = 10/12 = 83%. Neither 100% nor 50% is correct given phases 11–12 are incomplete.
**Severity:** CRITICAL
**Fix:** Update both `percent` in frontmatter and the body progress bar to the same recalculated value (67% for v1.37.1 scope or 83% for all-milestone scope). This is a direct numerical conflict.

---

### F-05 — STATE.md `stopped_at` is stale relative to body "Current focus"

**File(s):** `.planning/STATE.md`
**Section:** YAML frontmatter `stopped_at` (line 6) and body `## Project Reference`
**Found:** `stopped_at: Phase 10 complete` and `**Current focus:** Phase 11 — documentation-sync-and-nyquist-completion`
**Expected:** The `stopped_at` field suggests the session ended after Phase 10, but the body correctly identifies Phase 11 as current. These are logically consistent but create minor ambiguity about whether Phase 11 has started.
**Severity:** STALE
**Fix:** Update `stopped_at` to `Before Phase 11` or `Entering Phase 11` to remove ambiguity about current position.

---

### F-06 — STATE.md Performance Metrics section is entirely placeholder content

**File(s):** `.planning/STATE.md`
**Section:** `## Performance Metrics`
**Found:**
```
- Total plans completed: 6
- Average duration: —
- Total execution time: —
```
and `*Updated after each plan completion*` with no per-phase table entries after 10 completed phases across 4 milestones.
**Expected:** Actual duration data for completed phases, or an explicit acknowledgment that metrics were not tracked.
**Severity:** STALE
**Fix:** Either backfill duration metrics from SUMMARY.md timestamps for Phases 7–10, or replace placeholder content with: "Metrics tracking not retroactively enabled for completed phases."

---

### F-07 — STATE.md Quick Tasks table has a potentially truncated directory path

**File(s):** `.planning/STATE.md`
**Section:** `### Quick Tasks Completed` table, directory column
**Found:** `260420-m8f-fix-documentation-inconsistencies-in-roa` — the path ends in `-roa` which appears truncated.
**Expected:** The actual directory on disk is indeed named `260420-m8f-fix-documentation-inconsistencies-in-roa` (51 characters) — this IS the full directory name. However the suffix `-in-roa` appears to be an abbreviation of `-in-roadmap.md-and-state.md` or similar. The link `[260420-m8f-fix-documentation-inconsistencies-in-roa](./quick/260420-m8f-fix-documentation-inconsistencies-in-roa/)` resolves correctly to the directory on disk.
**Severity:** FORMATTING
**Fix:** The link is functional. If the directory name is intentionally abbreviated, add a comment. If it was accidentally truncated during creation, rename the directory and update the STATE.md link.

---

### F-08 — ROADMAP.md Phase 11 shows `0 plans` despite concrete success criteria

**File(s):** `.planning/ROADMAP.md`
**Section:** `### Phase 11: Documentation Sync & Nyquist Completion` and `## Progress` table
**Found:** `**Plans**: 0 plans` and progress table row: `| 11. Documentation Sync & Nyquist Completion | v1.37.1 | 0/0 | Not started | - |`
**Expected:** Phase 11 has two concrete deliverables requiring plans: (1) update 38 REQUIREMENTS.md checkboxes; (2) complete Phase 08 Nyquist wave_0. At minimum 1 plan is needed.
**Severity:** STALE
**Fix:** Create Phase 11 plan(s) before executing, then update `**Plans**: 1 plan` (or the actual count) and update the progress table row to `0/1 Not started`.

---

### F-09 — ROADMAP.md Phase 12 shows `0 plans` despite concrete success criteria

**File(s):** `.planning/ROADMAP.md`
**Section:** `### Phase 12: Tech Debt Remediation` and `## Progress` table
**Found:** `**Plans**: 0 plans` and progress table row: `| 12. Tech Debt Remediation | v1.37.1 | 0/0 | Not started | - |`
**Expected:** Phase 12 has three named tech debt items (WR-01, IN-01, WR-03) as success criteria. At minimum 1 plan is needed to address them.
**Severity:** STALE
**Fix:** Create Phase 12 plan(s) before executing, then update `**Plans**: 1 plan` and progress table accordingly.

---

### F-10 — ROADMAP.md Progress table has duplicate phase numbers 4 and 5

**File(s):** `.planning/ROADMAP.md`
**Section:** `## Progress` table
**Found:** Two rows numbered `4` and two rows numbered `5`:
```
| 4. Fix Hooks Installation | v1.36.0.b | 1/1 | Complete | 2026-04-17 |
| 5. Regression Coverage | v1.36.0.b | 1/1 | Complete | 2026-04-17 |
| 4. Fix Background Update-Check Hook | v1.36.0.a | 1/1 | Complete | 2026-04-17 |
| 5. Fix Version Detection and Update Workflow | v1.36.0.a | 2/2 | Complete | 2026-04-17 |
```
**Expected:** The Milestone column disambiguates these, so this may be intentional per-milestone numbering. However it is visually confusing and not documented as a convention.
**Severity:** FORMATTING
**Fix:** Add a comment in the ROADMAP.md Progress section header: "Phase numbers restart per milestone; Milestone column provides disambiguation." Or use composite phase identifiers (e.g., "v1.36.0.b-4").

---

### F-11 — ROADMAP.md v1.37.1 section uses plain `###` header; shipped milestones use `<details>` blocks

**File(s):** `.planning/ROADMAP.md`
**Section:** `## Phases` section, v1.37.1 entry
**Found:** `### v1.37.1 Files (In Progress)` — plain level-3 markdown heading
**Expected:** v1.36.0, v1.36.0.b, v1.36.0.a all use `<details><summary>✓ ... SHIPPED ...</summary>` collapsed blocks.
**Severity:** FORMATTING
**Fix:** This is likely intentional — keeping the active milestone visible without collapsing. When v1.37.1 ships, wrap in a `<details>` block following the established pattern. Document the convention: "Active milestones use `###` headers; shipped milestones are collapsed into `<details>` blocks."

---

### F-12 — REQUIREMENTS.md all 38 v1 requirement checkboxes show `[ ]` (Pending)

**File(s):** `.planning/REQUIREMENTS.md`
**Section:** All requirement sections (MERGE-01 through TEST-04)
**Found:** Every checkbox reads `[ ]` — example:
```
- [ ] **MERGE-01**: Fork branch `thamw-main` integrates all upstream v1.37.1 commits via `git merge upstream/main`
```
**Expected:** `[x]` for all 38 — confirmed SATISFIED with live codebase evidence in all 4 VERIFICATION.md files and v1.37.1-MILESTONE-AUDIT.md (38/38 SATISFIED). The audit explicitly states: "All 38 requirements satisfied based on VERIFICATION.md with live command evidence."
**Severity:** CRITICAL
**Fix:** Update all 38 `[ ]` to `[x]` in REQUIREMENTS.md as the primary deliverable of Phase 11.

---

### F-13 — REQUIREMENTS.md all 38 traceability table rows show "Pending"

**File(s):** `.planning/REQUIREMENTS.md`
**Section:** `## Traceability` table (38 rows)
**Found:** All 38 rows have Status value `Pending` — example:
```
| MERGE-01 | Phase 7 | Pending |
| CAT-05 | Phase 8 | Pending |
| TEST-04 | Phase 10 | Pending |
```
**Expected:** All 38 rows should show `Satisfied` or `Complete`. The v1.37.1-MILESTONE-AUDIT.md explicitly identifies this as a documentation gap: "REQUIREMENTS.md traceability table: all 38 requirements still show Pending / [ ] checkboxes."
**Severity:** CRITICAL
**Fix:** Update all 38 traceability table Status cells from `Pending` to `Satisfied` as part of Phase 11 execution.

---

### F-14 — REQUIREMENTS.md MAINT-01 and MAINT-02 are absent from the Traceability table

**File(s):** `.planning/REQUIREMENTS.md`
**Section:** `## v2 Requirements` (requirements exist) vs `## Traceability` (rows absent)
**Found:** `MAINT-01` and `MAINT-02` are defined requirements under `## v2 Requirements / ### Ongoing Maintenance` but appear nowhere in the Traceability table. The Coverage section states:
```
- v1 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0 ✓
```
This silently omits v2 requirements, giving a false impression of complete traceability.
**Expected:** v2 requirements should appear in the Traceability table with a phase or status, or the Coverage section should explicitly note "v2 requirements not yet mapped."
**Severity:** STALE
**Fix:** Add MAINT-01 and MAINT-02 rows to the Traceability table (e.g., `| MAINT-01 | Future | Not started |`) or add a note: "v2 requirements (MAINT-01, MAINT-02) not yet assigned to a phase."

---

### F-15 — MILESTONES.md has no v1.37.1 milestone entry

**File(s):** `.planning/MILESTONES.md`
**Section:** File contents (3 milestone entries only)
**Found:** Entries: `## v1.36.0.a Fix Update Functionality`, `## v1.36.0.b Fix Hooks Installation`, `## v1.36.0 Files` — no v1.37.1 entry.
**Expected:** v1.37.1 is the active in-progress milestone. MILESTONES.md appears to be a "shipped milestones only" log (all 3 entries are shipped). If so, this is intentional. However, the convention is undocumented.
**Severity:** STALE
**Fix:** Add a comment at the top of MILESTONES.md: "This file tracks shipped milestones only. Add entry when milestone ships." Then add v1.37.1 upon shipping.

---

### F-16 — MILESTONES.md milestone ordering is newest-first; ROADMAP.md is oldest-first

**File(s):** `.planning/MILESTONES.md` and `.planning/ROADMAP.md`
**Section:** Milestone list ordering
**Found:** MILESTONES.md order: v1.36.0.a (shipped 2026-04-18), v1.36.0.b (shipped 2026-04-17), v1.36.0 (shipped 2026-04-16) — most recent first. ROADMAP.md order: v1.36.0, v1.36.0.b, v1.36.0.a — chronological oldest-first.
**Expected:** A consistent ordering convention across both files.
**Severity:** FORMATTING
**Fix:** Standardize on chronological (oldest-first) ordering in both files, or explicitly document that MILESTONES.md uses "most recent first" as a reverse-chronological activity log.

---

### F-17 — CAT-05 count: REQUIREMENTS.md says `~271`, audit and ROADMAP.md say `270`

**File(s):** `.planning/REQUIREMENTS.md`, `.planning/v1.37.1-MILESTONE-AUDIT.md`, `.planning/ROADMAP.md`
**Section:** CAT-05 requirement
**Found:**
- REQUIREMENTS.md: `- [ ] **CAT-05**: CATALOGUE.json counts and total updated to reflect actual file count after merge (~271)`
- v1.37.1-MILESTONE-AUDIT.md: `| CAT-05 | 08 | CATALOGUE.json counts updated (total=270) | SATISFIED | total=270; all 5 category counts match array lengths |`
- ROADMAP.md Phase 8 success criterion 4: `total=270, counts: commands=79, references=48, workflows=80, templates=32, agents=31`
**Expected:** The actual delivered and verified value is `270`. The `~271` in REQUIREMENTS.md was an approximation used during requirements definition.
**Severity:** STALE
**Fix:** Update REQUIREMENTS.md CAT-05 text from `(~271)` to `(total=270, counts: commands=79, references=48, workflows=80, templates=32, agents=31)` to match the verified outcome documented in the audit.

---

### F-18 — Phase 1 completed (2026-04-15) before REQUIREMENTS.md was defined (2026-04-17)

**File(s):** `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md`
**Section:** Phase 1 completion date vs REQUIREMENTS.md definition date
**Found:** ROADMAP.md: `- [x] Phase 1: Accurate CATALOGUE (1/1 plans) — completed 2026-04-15`. REQUIREMENTS.md header: `**Defined:** 2026-04-17` and footer: `*Requirements defined: 2026-04-17*`
**Expected:** Requirements are typically defined before the phases that satisfy them. However, REQUIREMENTS.md covers only v1.37.1 requirements (MERGE-xx, CAT-xx, NEW-xx, MOD-xx, TEST-xx) — Phase 1 was part of the earlier v1.36.0 milestone and is not mentioned in this REQUIREMENTS.md. There is no actual v1.36.0 requirement in this document that Phase 1 would satisfy.
**Severity:** STALE
**Fix:** Add a scope clarification note to the REQUIREMENTS.md header: "Scope: These requirements apply to milestone v1.37.1 only (Phases 7–12). Phases 1–6 are covered by their respective milestone roadmaps." This eliminates the chronological confusion.

---

## Recommended Action Order

### 1. CRITICAL items (must fix before Phase 11 executes)

| # | Finding | Action |
|---|---------|--------|
| 1 | F-12 | Update all 38 REQUIREMENTS.md checkboxes from `[ ]` to `[x]` |
| 2 | F-13 | Update all 38 traceability table rows from `Pending` to `Satisfied` |
| 3 | F-04 | Resolve `percent: 100` vs `Progress: 50%` conflict in STATE.md |

### 2. STALE items (fix in Phase 11 as part of documentation sync)

| # | Finding | Action |
|---|---------|--------|
| 4 | F-01 | Correct STATE.md `total_phases: 4` to `6` |
| 5 | F-02 | Recalculate STATE.md `completed_phases` to align with chosen scope |
| 6 | F-03 | Recalculate STATE.md `total_plans`/`completed_plans` for chosen scope |
| 7 | F-05 | Update STATE.md `stopped_at` to `Entering Phase 11` |
| 8 | F-06 | Populate STATE.md Performance Metrics or replace placeholders |
| 9 | F-08 | Create Phase 11 plans; update ROADMAP.md plan count from `0` |
| 10 | F-09 | Create Phase 12 plans; update ROADMAP.md plan count from `0` |
| 11 | F-14 | Add MAINT-01/MAINT-02 to REQUIREMENTS.md traceability or document unmapped |
| 12 | F-15 | Add convention note to MILESTONES.md; add v1.37.1 entry on ship |
| 13 | F-17 | Update REQUIREMENTS.md CAT-05 from `~271` to `270` |
| 14 | F-18 | Add v1.37.1 scope note to REQUIREMENTS.md header |

### 3. FORMATTING items (fix opportunistically)

| # | Finding | Action |
|---|---------|--------|
| 15 | F-07 | Clarify truncated quick task directory name in STATE.md |
| 16 | F-10 | Add per-milestone phase numbering convention note to ROADMAP.md |
| 17 | F-11 | Document active-vs-shipped `###`/`<details>` header convention |
| 18 | F-16 | Standardize milestone ordering direction across MILESTONES.md and ROADMAP.md |
