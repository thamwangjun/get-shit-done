# Roadmap: GSD Prompt-Engineered Fork

## Milestones

- ✓ **v1.36.0 Files** — Phases 1–3 (shipped 2026-04-16)
- ✓ **v1.36.0.b Fix Hooks Installation** — Phases 4–5 (shipped 2026-04-17)
- ✓ **v1.36.0.a Fix Update Functionality** — Phases 4–6 (shipped 2026-04-18)
- ✓ **v1.37.1 Files** — Phases 7–12 (shipped 2026-04-22)
- ✓ **v1.37.1a Do-Not Framing Pass** — Phases 13–17 (shipped 2026-04-23)
- ✓ **v1.37.1b Fork Tag Corpus Tests** — Phases 18–19 (shipped 2026-04-29)
- ✗ **v1.37.1c Tag Hierarchy Completion** — Phases 20–24 (abandoned 2026-04-29, 1/5 phases complete)
- ✅ **v1.37.2 Positive Framing TDD Pass** — Phases 25–27 (shipped 2026-05-02)
- ✅ **v1.38.6 Positive Framing Pass** — Phases 28–31 (shipped 2026-05-03)
- ✅ **v1.41.3 Upstream v1.41.2 Fork Compliance** — Phases 32–34 (shipped 2026-05-19)
- ✅ **v1.41.5 Refactor Git Commit History** — Phases 35–41 (shipped 2026-05-24)
- ✅ **v2.1.0-a SHA Versioning Reimplementation** — Phases 42–43 (shipped 2026-05-26)
- ✗ **v2.1.0-b Workflow Compliance Reinforcement** — Phases 44–48 (abandoned 2026-05-28, 0/5 phases complete)
- ✅ **v2.1.0-c Install-Time Content Materialization** — Phases 44–47.1 (shipped 2026-05-29)
- 🚧 **v2.1.0-d Whole-Integer Step Numbering** — Phases 48–51 (in progress)

## Phases

<details>
<summary>✓ v1.36.0 Files (Phases 1–3) — SHIPPED 2026-04-16</summary>

**Goal:** All prompt files added or changed in the v1.36.0 upstream merge pass the fork's prompt engineering quality bar before it ships. CATALOGUE in sync. Tests updated to reflect fork standards.

- [x] Phase 1: Accurate CATALOGUE (1/1 plans) — completed 2026-04-15
- [x] Phase 2: Apply Fork Standards to v1.36.0 Files (4/4 plans) — completed 2026-04-16
- [x] Phase 3: Align Tests with Fork Standards (2/2 plans) — completed 2026-04-16

Full details: `.planning/milestones/v1.36.0-ROADMAP.md`

</details>

<details>
<summary>✓ v1.36.0.b Fix Hooks Installation (Phases 4–5) — SHIPPED 2026-04-17</summary>

**Goal:** install.js correctly copies hooks even when hooks/dist/ has not been built; regression test prevents silent-skip bug from returning.

- [x] Phase 4: Fix Hooks Installation (1/1 plans) — completed 2026-04-17
- [x] Phase 5: Regression Coverage (1/1 plans) — completed 2026-04-17

Full details: `.planning/milestones/v1.36.0.b-ROADMAP.md`

</details>

<details>
<summary>✓ v1.36.0.a Fix Update Functionality (Phases 4–6) — SHIPPED 2026-04-18</summary>

**Goal:** Fix the /gsd-update command and background update-check hook so update detection works correctly with the fork's SHA-based versioning.

- [x] Phase 4: Fix Background Update-Check Hook (1/1 plans) — completed 2026-04-17
- [x] Phase 5: Fix Version Detection and Update Workflow (2/2 plans) — completed 2026-04-17
- [x] Phase 6: Produce Phase 4 Verification Artifacts (1/1 plans) — completed 2026-04-18

Full details: `.planning/milestones/v1.36.0.a-ROADMAP.md`

</details>

<details>
<summary>✓ v1.37.1 Files (Phases 7–12) — SHIPPED 2026-04-22</summary>

**Goal:** Merge upstream v1.37.1 into main, sync CATALOGUE.json, apply the fork's positive framing and XML structure standards to all new and modified prompt files, and keep the test suite green.

- [x] Phase 7: Merge and Conflict Resolution (2/2 plans) — completed 2026-04-17
- [x] Phase 8: CATALOGUE Sync (1/1 plans) — completed 2026-04-17
- [x] Phase 9: Fork Standards Pass (2/2 plans) — completed 2026-04-18
- [x] Phase 10: Test Suite Green (1/1 plans) — completed 2026-04-19
- [x] Phase 11: Documentation Sync & Nyquist Completion (1/1 plans) — completed 2026-04-21
- [x] Phase 12: Tech Debt Remediation (3/3 plans) — completed 2026-04-21

Full details: `.planning/milestones/v1.37.1-ROADMAP.md`

</details>

<details>
<summary>✓ v1.37.1a Do-Not Framing Pass (Phases 13–17) — SHIPPED 2026-04-23</summary>

**Goal:** Fix all 17 bare "do not" directive violations across agents, workflows, references, and commands; corpus scan 4/4 subtests green; test suite 4168/4168 pass.

- [x] Phase 13: Agent Fixes (3/3 plans) — completed 2026-04-22
- [x] Phase 14: Workflow, Reference, and Command Fixes (2/2 plans) — completed 2026-04-22
- [x] Phase 15: Test Suite Gate (1/1 plans) — completed 2026-04-23
- [x] Phase 16: Nyquist Validation Pass (3/3 plans) — completed 2026-04-23
- [x] Phase 17: Working Tree & Docs Housekeeping (3/3 plans) — completed 2026-04-23

Full details: `.planning/milestones/v1.37.1a-ROADMAP.md`

</details>

<details>
<summary>✓ v1.37.1b Fork Tag Corpus Tests (Phases 18–19) — SHIPPED 2026-04-29</summary>

**Goal:** Add fork-specific corpus test guards for tag consistency and convert all remaining command files to use a consistent primary directive tag.

- [x] Phase 18: Fork Tag Corpus Tests (2/2 plans) — completed 2026-04-28
- [x] Phase 19: Convert objective tags to intent in skill files (3/3 plans) — completed 2026-04-29

Full details: `.planning/milestones/v1.37.1b-ROADMAP.md`

</details>

<details>
<summary>✗ v1.37.1c Tag Hierarchy Completion (Phases 20–24) — ABANDONED 2026-04-29</summary>

**Goal:** *(Abandoned; requirement subsequently dropped 2026-04-30 — see PROJECT.md Key Decisions)*
**Abandoned after:** Phase 20 only (1/5 phases, 1/13 requirements)

- [x] Phase 20: Baseline Audit (1/1 plans) — completed 2026-04-29
- [ ] Phase 21: L1 + L2 Validation — not started
- [ ] Phase 22: L3 Conversion — not started
- [ ] Phase 23: L4 Conversion — not started
- [ ] Phase 24: Gate + Documentation — not started

Full details: `.planning/milestones/v1.37.1c-ROADMAP.md`

</details>

<details>
<summary>✅ v1.37.2 Positive Framing TDD Pass (Phases 25–27) — SHIPPED 2026-05-02</summary>

**Goal:** Re-apply and expand the positive framing quality bar across all prompt content files using TDD — write failing tests first, fix all violations and warnings, full test suite green.

- [x] **Phase 25: Scanner Expansion** (3/3 plans) — completed 2026-05-01
- [x] **Phase 26: Violation Fixes** (3/3 plans) — completed 2026-05-02
- [x] **Phase 27: Quality Gate** (3/3 plans) — completed 2026-05-02

Full details: `.planning/milestones/v1.37.2-ROADMAP.md`

</details>

<details>
<summary>✅ v1.38.6 Positive Framing Pass (Phases 28–31) — SHIPPED 2026-05-03</summary>

**Goal:** Manual read audit of all prompt content files surfaces every negative framing violation; findings drive scanner expansion (TDD red gate); all violations are fixed; then test failures after fixes identify any upstream test assertions that check for outlawed strings — those are disabled and the suite goes green.

- [x] Phase 28: Full Manual Audit (6/6 plans) — completed 2026-05-02
- [x] Phase 29: TDD Scanner Expansion (2/2 plans) — completed 2026-05-03
- [x] Phase 30: Violation Fixes (2/2 plans) — completed 2026-05-03
- [x] Phase 31: Conflicting Test Handling + Final Gate (1/1 plans) — completed 2026-05-03

Full details: `.planning/milestones/v1.38.6-ROADMAP.md`

</details>

<details>
<summary>✅ v1.41.3 Upstream v1.41.2 Fork Compliance (Phases 32–34) — SHIPPED 2026-05-19</summary>

**Milestone Goal:** Resolve all known test failures on thamw-v1.41.2, pass the negative-framing scanner across all upstream-introduced files, fix any new violations, and fast-forward main to thamw-v1.41.3.

- [x] Phase 32: Quick Test Fixes (1/1 plans) — completed 2026-05-13
- [x] Phase 33: Positive Framing Pass (2/2 plans) — completed 2026-05-14
- [x] Phase 34: Gate and Merge (1/1 plans) — completed 2026-05-14

Full details: `.planning/milestones/v1.41.3-ROADMAP.md`

</details>

<details>
<summary>✅ v1.41.5 Refactor Git Commit History (Phases 35–41) — SHIPPED 2026-05-24</summary>

- [x] Phase 35: Backup and Soft Reset (1/1 plans) — completed 2026-05-22
- [x] Phase 36: Stage and Commit Configuration & Rules (1/1 plans) — completed 2026-05-22
- [x] Phase 37: Stage and Commit Scanner Logic (1/1 plans) — completed 2026-05-22
- [x] Phase 38: Stage and Commit Workflows, Agents, & Templates (1/1 plans) — completed 2026-05-22
- [x] Phase 39: Stage and Commit Tests & SDK Validation (1/1 plans) — completed 2026-05-22
- [x] Phase 40: Stage and Commit Maintenance, Logs, & State (1/1 plans) — completed 2026-05-23
- [x] Phase 41: Final Verification & Parity Audit (1/1 plans) — completed 2026-05-23

Full details: `.planning/milestones/v1.41.5-ROADMAP.md`

</details>

<details>
<summary>✅ v2.1.0-a SHA Versioning Reimplementation (Phases 42–43) — SHIPPED 2026-05-26</summary>

- [x] Phase 42: SHA Hook and Install Reimplementation (1/1 plans) — completed 2026-05-25
- [x] Phase 43: Update Workflow SHA Migration + Full Gate (1/1 plans) — completed 2026-05-26

Full details: `.planning/milestones/v2.1.0-a-ROADMAP.md`

</details>

<details>
<summary>✗ v2.1.0-b Workflow Compliance Reinforcement (Phases 44–48) — ABANDONED 2026-05-28</summary>

**Goal:** *(Abandoned before any phase started — milestone scope invalidated by v2.1.0-c decision to address install-time content materialization first)*
**Abandoned after:** 0/5 phases complete

- [x] Phase 44: Investigation — not started (completed 2026-05-28)
- [x] Phase 45: Command Layer Fixes — not started (completed 2026-05-28)
- [x] Phase 46: Workflow Layer Fixes — not started (completed 2026-05-29)
- [ ] Phase 47: Agent Layer Fixes — not started
- [x] Phase 48: Quality Gate — not started (completed 2026-05-30)

</details>

<details>
<summary>✅ v2.1.0-c Install-Time Content Materialization (Phases 44–47.1) — SHIPPED 2026-05-29</summary>

**Milestone Goal:** Replace runtime `@` and `` !`<bash>` `` content injection with install-time template substitution so every installed file is fully self-contained — no reliance on Claude to inject referenced content at runtime.

- [x] **Phase 44: Resolver Core** — Build and unit-test `resolveIncludes()` in isolation; pivoted in Phase 45 to Eta v4 (completed 2026-05-28)
- [x] **Phase 45: Pipeline Integration** — Wire Eta v4 into install.js; convert ~180 static ref lines to `<%~ include() %>` tags across 82 files; remove resolveIncludes() (completed 2026-05-28)
- [x] **Phase 46: Regression Test Suite** — 5 regression tests running against installed output; TEST-06 dropped per D-11 (completed 2026-05-29)
- [x] **Phase 47: Full Runtime Matrix + Verification** — Validate all supported runtimes produce zero unresolved references; `npm test` green (completed 2026-05-29)
- [x] **Phase 47.1: Close Gap INTG-04/GATE-03** — Wire renderEtaContent into skills path; expand TEST-01 to detect `<%~` survivors (completed 2026-05-29)

Full details: `.planning/milestones/v2.1.0-c-ROADMAP.md`

</details>

### 🚧 v2.1.0-d Whole-Integer Step Numbering (In Progress)

**Milestone Goal:** Enforce whole-integer-only step labels across all prompt content files and provide a durable maintenance script to re-enforce after every upstream merge.

- [x] **Phase 48: TDD Red Gate** — Write step-numbering scanner tests confirmed RED against unmodified corpus (completed 2026-05-30)
- [ ] **Phase 49: Survey and Normalization** — Build cross-file reference index then renumber all violating files with test co-updates
- [ ] **Phase 50: Maintenance Script and Cross-Ref Scanner** — Maintenance script (cross-file-aware, idempotent) plus cross-file reference integrity scanner
- [ ] **Phase 51: Quality Gate** — Full npm test at 0 regressions

## Phase Details

### Phase 48: TDD Red Gate

**Goal**: Scanner tests for decimal step labels, letter-suffix step labels (e.g., Step 7a), and out-of-order step numbering exist and fail against the current unmodified corpus
**Depends on**: Nothing (first phase of milestone)
**Requirements**: SCAN-01, SCAN-02
**Success Criteria** (what must be TRUE):

  1. `tests/step-numbering-scan.test.cjs` exists and all corpus subtests fail RED against the unmodified corpus (confirming actual violations are detected)
  2. Scanner correctly detects Pattern A/B (`**Step N.M**` headings), Pattern D (ordered-list decimal items like `2.5.`), and letter-suffix steps (e.g., `Step 7a`) as violations requiring renumbering to whole integers; code-fenced content is excluded
  3. Scanner correctly detects out-of-order step sequences (e.g., Step 1 then Step 3 then Step 2) in each file
  4. Running `npm test -- tests/step-numbering-scan.test.cjs` shows failures attributable to the 6 known violating files (not unrelated files)**Plans**: 1 plan
- [x] 48-01-PLAN.md — Write step-numbering scanner test (tests/step-numbering-scan.test.cjs)

### Phase 49: Survey and Normalization

**Goal**: Every decimal step label across all in-scope prompt content files is renamed to whole-integer sequential numbering; all same-file cross-references and co-located test assertions are updated in the same commits; the Phase 48 scanner goes GREEN
**Depends on**: Phase 48
**Requirements**: MAP-01, NORM-01
**Success Criteria** (what must be TRUE):

  1. A cross-file step reference index exists (produced before any renaming) enumerating every prose reference of the form "filename.md step N" with source file, source line, target file, and target step number
  2. `tests/step-numbering-scan.test.cjs` decimal-label and letter-suffix-label corpus subtests pass GREEN after normalization (0 violations in agents/, commands/gsd/, get-shit-done/workflows/)
  3. All 14+ affected test assertions (quick-branching, execute-phase-step-5-5-deviation-doc, agent-frontmatter, and others) are updated to reference the new whole-integer step labels
  4. Every cross-file reference updated in the same commit as the file rename it corresponds to (execute-plan.md step 5.5 references, post-merge-gate.md step 5.8 reference, fast.md Step 7 comment)
  5. `npm test` passes with 0 new failures after each individual file rename commit

**Plans**: TBD

### Phase 50: Maintenance Script and Cross-Ref Scanner

**Goal**: A cross-file-aware maintenance script can detect and renumber decimal steps on a clean or dirty corpus; a cross-file reference integrity scanner prevents stale step references from surviving future upstream merges
**Depends on**: Phase 49
**Requirements**: NORM-02, XREF-01
**Success Criteria** (what must be TRUE):

  1. `scripts/normalize-step-numbers.cjs --dry-run` exits 0 and reports "no changes needed" on the post-Phase-49 clean corpus
  2. `scripts/normalize-step-numbers.cjs` correctly renumbers a synthetic dirty file (decimal steps introduced) and updates its cross-file references, producing output identical to manual normalization
  3. `tests/cross-file-step-refs.test.cjs` exists and passes GREEN against the clean corpus — detecting any prose reference of the form "filename.md step N" where step N does not exist as a heading in the target file
  4. `tests/cross-file-step-refs.test.cjs` goes RED when a synthetic stale cross-file reference is injected (confirming detection works)

**Known input from Phase 48**: `scanForOutOfOrder` in `tests/step-numbering-scan.test.cjs` uses a line-start anchor (`^\s*\*?\*?`) that misses step labels preceded by list markers (`- **Step N:**`, `1. **Step N:**`) or blockquotes (`>`). No such patterns exist in the corpus as of 2026-05-30, but upstream merges could introduce them. Phase 50 hardening should replace the anchor with `^[\s*]*` and add list-marker stripping. See comment in `tests/step-numbering-scan.test.cjs:scanForOutOfOrder`.

**Plans**: TBD

### Phase 51: Quality Gate

**Goal**: The full test suite passes with 0 regressions and the negative-framing scanner remains at 99/99 after all v2.1.0-d changes
**Depends on**: Phase 50
**Requirements**: GATE-01
**Success Criteria** (what must be TRUE):

  1. `npm test` reports 0 new failures compared to the v2.1.0-c baseline (7459 pass / 49 fail baseline)
  2. Negative-framing scanner remains at 99/99 subtests passing
  3. `tests/step-numbering-scan.test.cjs` and `tests/cross-file-step-refs.test.cjs` both pass in the full suite run

**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Accurate CATALOGUE | v1.36.0 | 1/1 | Complete | 2026-04-15 |
| 2. Apply Fork Standards to v1.36.0 Files | v1.36.0 | 4/4 | Complete | 2026-04-16 |
| 3. Align Tests with Fork Standards | v1.36.0 | 2/2 | Complete | 2026-04-16 |
| 4. Fix Hooks Installation | v1.36.0.b | 1/1 | Complete | 2026-04-17 |
| 5. Regression Coverage | v1.36.0.b | 1/1 | Complete | 2026-04-17 |
| 4. Fix Background Update-Check Hook | v1.36.0.a | 1/1 | Complete | 2026-04-17 |
| 5. Fix Version Detection and Update Workflow | v1.36.0.a | 2/2 | Complete | 2026-04-17 |
| 6. Produce Phase 4 Verification Artifacts | v1.36.0.a | 1/1 | Complete | 2026-04-18 |
| 7. Merge and Conflict Resolution | v1.37.1 | 2/2 | Complete | 2026-04-17 |
| 8. CATALOGUE Sync | v1.37.1 | 1/1 | Complete | 2026-04-17 |
| 9. Fork Standards Pass | v1.37.1 | 2/2 | Complete | 2026-04-18 |
| 10. Test Suite Green | v1.37.1 | 1/1 | Complete | 2026-04-19 |
| 11. Documentation Sync & Nyquist Completion | v1.37.1 | 1/1 | Complete | 2026-04-21 |
| 12. Tech Debt Remediation | v1.37.1 | 3/3 | Complete | 2026-04-21 |
| 13. Agent Fixes | v1.37.1a | 3/3 | Complete | 2026-04-22 |
| 14. Workflow, Reference, and Command Fixes | v1.37.1a | 2/2 | Complete | 2026-04-22 |
| 15. Test Suite Gate | v1.37.1a | 1/1 | Complete | 2026-04-23 |
| 16. Nyquist Validation Pass | v1.37.1a | 3/3 | Complete | 2026-04-23 |
| 17. Working Tree & Docs Housekeeping | v1.37.1a | 3/3 | Complete | 2026-04-23 |
| 18. Fork Tag Corpus Tests | v1.37.1b | 2/2 | Complete | 2026-04-28 |
| 19. Convert objective tags to intent in skill files | v1.37.1b | 3/3 | Complete | 2026-04-29 |
| 20. Baseline Audit | v1.37.1c | 1/1 | Complete    | 2026-04-29 |
| 21. L1 + L2 Validation | v1.37.1c | 0/0 | Abandoned | - |
| 22. L3 Conversion | v1.37.1c | 0/0 | Abandoned | - |
| 23. L4 Conversion | v1.37.1c | 0/0 | Abandoned | - |
| 24. Gate + Documentation | v1.37.1c | 0/0 | Abandoned | - |
| 25. Scanner Expansion | v1.37.2 | 3/3 | Complete    | 2026-05-01 |
| 26. Violation Fixes | v1.37.2 | 3/3 | Complete    | 2026-05-02 |
| 27. Quality Gate | v1.37.2 | 3/3 | Complete    | 2026-05-02 |
| 28. Full Manual Audit | v1.38.6 | 6/6 | Complete | 2026-05-02 |
| 29. TDD Scanner Expansion | v1.38.6 | 2/2 | Complete | 2026-05-03 |
| 30. Violation Fixes | v1.38.6 | 2/2 | Complete | 2026-05-03 |
| 31. Conflicting Test Handling + Final Gate | v1.38.6 | 1/1 | Complete | 2026-05-03 |
| 32. Quick Test Fixes | v1.41.3 | 1/1 | Complete   | 2026-05-13 |
| 33. Positive Framing Pass | v1.41.3 | 2/2 | Complete    | 2026-05-14 |
| 34. Gate and Merge | v1.41.3 | 1/1 | Complete    | 2026-05-14 |
| 35. Backup and Soft Reset | v1.41.5 | 1/1 | Complete | 2026-05-22 |
| 36. Stage and Commit Configuration & Rules | v1.41.5 | 1/1 | Complete | 2026-05-22 |
| 37. Stage and Commit Scanner Logic | v1.41.5 | 1/1 | Complete | 2026-05-22 |
| 38. Stage and Commit Workflows, Agents, & Templates | v1.41.5 | 1/1 | Complete | 2026-05-22 |
| 39. Stage and Commit Tests & SDK Validation | v1.41.5 | 1/1 | Complete | 2026-05-22 |
| 40. Stage and Commit Maintenance, Logs, & State | v1.41.5 | 1/1 | Complete | 2026-05-23 |
| 41. Final Verification & Parity Audit | v1.41.5 | 1/1 | Complete | 2026-05-23 |
| 42. SHA Hook and Install Reimplementation | v2.1.0-a | 1/1 | Complete | 2026-05-25 |
| 43. Update Workflow SHA Migration + Full Gate | v2.1.0-a | 1/1 | Complete | 2026-05-26 |
| 44. Investigation | v2.1.0-b | 1/1 | Complete    | 2026-05-28 |
| 45. Command Layer Fixes | v2.1.0-b | 4/4 | Complete    | 2026-05-28 |
| 46. Workflow Layer Fixes | v2.1.0-b | 2/2 | Complete    | 2026-05-29 |
| 47. Agent Layer Fixes | v2.1.0-b | 0/0 | Abandoned | - |
| 48. Quality Gate | v2.1.0-b | 2/2 | Complete    | 2026-05-30 |
| 44. Resolver Core | v2.1.0-c | 1/1 | Complete | 2026-05-28 |
| 45. Pipeline Integration | v2.1.0-c | 5/5 | Complete | 2026-05-28 |
| 46. Regression Test Suite | v2.1.0-c | 2/2 | Complete | 2026-05-29 |
| 47. Full Runtime Matrix + Verification | v2.1.0-c | 1/1 | Complete | 2026-05-29 |
| 47.1. Close gap: INTG-04/GATE-03 — wire renderEtaContent into skills path | v2.1.0-c | 2/2 | Complete   | 2026-05-29 |
| 48. TDD Red Gate | v2.1.0-d | 0/1 | Not started | - |
| 49. Survey and Normalization | v2.1.0-d | 0/TBD | Not started | - |
| 50. Maintenance Script and Cross-Ref Scanner | v2.1.0-d | 0/TBD | Not started | - |
| 51. Quality Gate | v2.1.0-d | 0/TBD | Not started | - |

*v1.41.3 shipped 2026-05-19 — see `.planning/milestones/v1.41.3-ROADMAP.md`*
*v1.41.5 shipped 2026-05-24 — see `.planning/milestones/v1.41.5-ROADMAP.md`*
*v2.1.0-a shipped 2026-05-26 — see `.planning/milestones/v2.1.0-a-ROADMAP.md`*
*v2.1.0-c shipped 2026-05-29 — see `.planning/milestones/v2.1.0-c-ROADMAP.md`*
