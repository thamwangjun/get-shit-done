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
- 🚧 **v2.1.0-c Install-Time Content Materialization** — Phases 44–47 (in progress)

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
- [ ] Phase 45: Command Layer Fixes — not started
- [ ] Phase 46: Workflow Layer Fixes — not started
- [ ] Phase 47: Agent Layer Fixes — not started
- [ ] Phase 48: Quality Gate — not started

</details>

### 🚧 v2.1.0-c Install-Time Content Materialization (Phases 44–47)

**Milestone Goal:** Replace runtime `@` and `` !`<bash>` `` content injection with install-time template substitution so every installed file is fully self-contained — no reliance on Claude to inject referenced content at runtime.

- [x] **Phase 44: Resolver Core** — Build and unit-test `resolveIncludes()` in isolation before wiring into the install pipeline; pivoted in Phase 45 to Eta v4 (completed 2026-05-28)
- [ ] **Phase 45: Pipeline Integration** — Wire Eta v4 into install.js; convert ~180 static ref lines to {%~ include() %} tags across 82 files; remove resolveIncludes()
- [ ] **Phase 46: Regression Test Suite** — 6 targeted tests running against installed output (not source files)
- [ ] **Phase 47: Full Runtime Matrix + Verification** — Validate all supported runtimes produce zero unresolved references; `npm test` green

## Phase Details

### Phase 44: Resolver Core

**Goal**: `resolveIncludes()` exists in `bin/install.js` as a correct, fully-tested pure function that handles all edge cases before any integration work begins — the hardest constraint (conditional guard) is validated first
**Depends on**: Nothing (first phase of milestone)
**Requirements**: RESV-01, RESV-02, RESV-03, RESV-04, RESV-05, RESV-06, RESV-07
**Success Criteria** (what must be TRUE):

  1. `resolveIncludes(content, sourceRoot, seen)` is defined in `bin/install.js` and correctly inlines bare-line `@~/.claude/` and `` !`cat ~/.claude/` `` references by reading referenced files at source repo paths
  2. The conditional `@~` expression in `execute-phase.md:619` (inside a `${}` JS template literal) passes through the resolver verbatim — a unit test asserting `${CONTEXT_WINDOW < 200000 ?` survives in output passes
  3. A unit test for circular include detection throws with the full include chain in the error message rather than recursing infinitely
  4. A unit test for a missing referenced file throws with an error naming both the source file and the unresolvable path

> **Pivot note (Phase 45):** Phase 44's `resolveIncludes()` function was built and unit-tested as planned, then removed in Phase 45 when the approach pivoted to Eta v4 as the install-time template engine.

**Plans**: TBD

### Phase 45: Pipeline Integration

**Goal**: Eta v4 is wired as the install-time template engine in both `install.js` copy loops; all ~180 install-time static reference lines across 82 source files are converted to `{%~ include() %}` tags; Phase 44's `resolveIncludes()` is removed; every installed file is fully self-contained with zero surviving `@~/.claude/get-shit-done/` patterns
**Depends on**: Phase 44
**Requirements**: INTG-01, INTG-02, INTG-03, INTG-04, INTG-05, INTG-06
**Success Criteria** (what must be TRUE):

  1. `eta` is in `package.json` `dependencies`; `content = eta.renderString(content, {})` is wired as the first transform in both `copyWithPathReplacement()` and the agent install loop
  2. All 82 source files across `commands/gsd/`, `agents/`, `get-shit-done/workflows/`, `get-shit-done/references/` have bare-line static refs converted to `{%~ include('get-shit-done/X') %}` tags — post-conversion grep returns 0 survivors
  3. Runtime `.planning/` bare-line refs in the agents layer converted to `` !`cat .planning/X` `` form
  4. `resolveIncludes()` removed from `bin/install.js` and `tests/resolve-includes.test.cjs` deleted; `npm test` passes with no new failures

**Plans**: TBD

### Phase 46: Regression Test Suite

**Goal**: Six regression tests running against installed output (not source files) cover every critical failure mode identified in research — the safety net exists before the runtime matrix sweep
**Depends on**: Phase 45
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06
**Success Criteria** (what must be TRUE):

  1. A test file exists in `tests/` that installs to a temp directory and asserts zero unresolved `@~/.claude/` references survive in any installed file
  2. A test asserts the conditional `@~` expression in `execute-phase.md` is preserved verbatim in the Claude runtime installed output
  3. A test installs for a non-Claude runtime (e.g. Copilot) and asserts tool names inside inlined reference content are transformed (`Read` → `read`, `Bash` → `execute`)
  4. Tests for circular include detection and missing-file handling each throw with the correct error message rather than hanging or producing silent failures

**Plans**: TBD

### Phase 47: Full Runtime Matrix + Verification

**Goal**: Every supported runtime install produces fully self-contained files — zero unresolved `@~` or `` !`cat ~/.claude/` `` patterns — and the full `npm test` suite passes with no new regressions
**Depends on**: Phase 46
**Requirements**: GATE-01, GATE-02, GATE-03
**Success Criteria** (what must be TRUE):

  1. `grep -r '@~/.claude/' <install-dir>` run against a fresh install for each of Claude, Copilot, Codex, Gemini, OpenCode, Cursor, and Antigravity returns 0 results
  2. The negative-framing scanner passes at 99/99 after all file edits introduced in this milestone
  3. `npm test` completes with 0 new failures beyond the pre-existing baseline established at v2.1.0-a

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
| 45. Command Layer Fixes | v2.1.0-b | 3/4 | In Progress|  |
| 46. Workflow Layer Fixes | v2.1.0-b | 0/0 | Abandoned | - |
| 47. Agent Layer Fixes | v2.1.0-b | 0/0 | Abandoned | - |
| 48. Quality Gate | v2.1.0-b | 0/0 | Abandoned | - |
| 44. Resolver Core | v2.1.0-c | 1/1 | Complete | 2026-05-28 |
| 45. Pipeline Integration | v2.1.0-c | 3/4 | In Progress | - |
| 46. Regression Test Suite | v2.1.0-c | 0/TBD | Not started | - |
| 47. Full Runtime Matrix + Verification | v2.1.0-c | 0/TBD | Not started | - |

*v1.41.3 shipped 2026-05-19 — see `.planning/milestones/v1.41.3-ROADMAP.md`*
*v1.41.5 shipped 2026-05-24 — see `.planning/milestones/v1.41.5-ROADMAP.md`*
*v2.1.0-a shipped 2026-05-26 — see `.planning/milestones/v2.1.0-a-ROADMAP.md`*
