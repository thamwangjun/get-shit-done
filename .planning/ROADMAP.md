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
- 🚧 **v2.1.0-b Workflow Compliance Reinforcement** — Phases 44–48 (in progress)

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

### 🚧 v2.1.0-b Workflow Compliance Reinforcement (In Progress)

**Milestone Goal:** Investigate why Claude consistently fails to comply with GSD workflow instructions and apply targeted prompt engineering fixes across all command and workflow files.

- [ ] **Phase 44: Investigation** — Root cause analysis of compliance failures across all three layers
- [ ] **Phase 45: Command Layer Fixes** — Harden spawn mandates and remove inline-fallback loopholes in 67 command files
- [ ] **Phase 46: Workflow Layer Fixes** — Apply orchestrator reframe, high-attention placement, and required-step markers to 93 workflow files
- [ ] **Phase 47: Agent Layer Fixes** — Audit 33 agent files for step-omission patterns and apply PEG V10 fixes
- [ ] **Phase 48: Quality Gate** — npm test green, negative-framing scanner at 99/99

## Phase Details

### Phase 44: Investigation
**Goal**: Produce a structured root cause analysis of compliance failures, with evidence from actual files, that classifies failure modes and gives the next phases a concrete target list
**Depends on**: Nothing (first phase of milestone)
**Requirements**: INVEST-01, INVEST-02
**Success Criteria** (what must be TRUE):
  1. A findings document exists with at least one concrete file:line example per identified failure mode drawn from commands, workflows, and agents
  2. Failure modes are classified into the five taxonomy categories: subagent spawning failures, step omission, premature inline fallback loopholes, buried critical instructions, and `!cat` truncation (Claude receives only ~2KiB of a large workflow file and ignores the "Full output saved to:" read instruction)
  3. All 72 command files using `!cat` workflow injection are enumerated with their workflow target and approximate workflow line count
  4. The findings document is specific enough that Phase 45 and 46 implementers can look up which files need changes without additional investigation
**Plans**: TBD

### Phase 45: Command Layer Fixes
**Goal**: All 67 command files carry an explicit spawn mandate at a high-attention position, none grant silent inline fallbacks, and all 72 `!cat` workflow injections are replaced so Claude receives the full workflow file rather than a ~2KiB truncated preview
**Depends on**: Phase 44
**Requirements**: CMD-01, CMD-02, CMD-03, CMD-04
**Success Criteria** (what must be TRUE):
  1. Every command file that delegates to a subagent workflow restates the spawn mandate explicitly at the start of its `<objective>` or `<process>` block — a reviewer scanning each file can see the mandate without reading the loaded workflow
  2. No command file that invokes a subagent workflow offers inline execution as a silent default fallback — the only inline path requires an explicit user-supplied flag
  3. All 72 `!cat` workflow injection lines are replaced with a mechanism that delivers the full file to Claude (explicit Read instruction or `@`-reference)
  4. The negative-framing scanner still passes at 99/99 after all command file edits
**Plans**: TBD
**UI hint**: no

### Phase 46: Workflow Layer Fixes
**Goal**: All workflows that spawn subagents open with an orchestrator reframe, place critical spawn instructions at high-attention positions, guard inline-fallback blocks, and mark mandatory steps so the model cannot silently skip them
**Depends on**: Phase 44
**Requirements**: WF-01, WF-02, WF-03, WF-04
**Success Criteria** (what must be TRUE):
  1. Every subagent-spawning workflow opens with an orchestrator reframe statement per PEG V10 Section 6 — a reviewer can find it at the top of each workflow file without reading past the first screen
  2. Critical spawn instructions appear at the start or end of each workflow file, not buried in middle sections
  3. Every `<runtime_compatibility>` inline-fallback block is guarded by an explicit user-supplied flag check — inline execution is not the default path
  4. Workflows with mandatory step sequences carry `required_steps universal="true"` markers (per PEG V10 Section 16) on every non-skippable step
**Plans**: TBD
**UI hint**: no

### Phase 47: Agent Layer Fixes
**Goal**: All 33 agent files have been audited for step-omission patterns and every agent with an identified compliance issue carries PEG V10 fixes: required step anchors, adversarial probe mandates, or explicit completion criteria
**Depends on**: Phase 44
**Requirements**: AGENT-01, AGENT-02
**Success Criteria** (what must be TRUE):
  1. An audit record exists confirming each of the 33 agent files was examined for step-omission patterns (executor short-circuiting, verifier probe-skipping, planner read-skipping)
  2. Every agent file with an identified compliance issue has been updated — the update is observable as a new required-step anchor, adversarial probe mandate, or explicit completion criterion in the file
  3. The negative-framing scanner still passes at 99/99 after all agent file edits
**Plans**: TBD
**UI hint**: no

### Phase 48: Quality Gate
**Goal**: All changes from Phases 45–47 pass the full test suite with zero new regressions and the negative-framing scanner holds at 99/99
**Depends on**: Phase 45, Phase 46, Phase 47
**Requirements**: GATE-01, GATE-02
**Success Criteria** (what must be TRUE):
  1. `npm test` completes with 0 failures beyond the pre-existing baseline established at v2.1.0-a (185 non-ai-evals failures)
  2. The negative-framing scanner runs across all agents, commands, and workflows and reports 99/99 subtests passing with 0 violations and 0 warnings
**Plans**: TBD
**UI hint**: no

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
| 44. Investigation | v2.1.0-b | 0/TBD | Not started | - |
| 45. Command Layer Fixes | v2.1.0-b | 0/TBD | Not started | - |
| 46. Workflow Layer Fixes | v2.1.0-b | 0/TBD | Not started | - |
| 47. Agent Layer Fixes | v2.1.0-b | 0/TBD | Not started | - |
| 48. Quality Gate | v2.1.0-b | 0/TBD | Not started | - |

*v1.41.3 shipped 2026-05-19 — see `.planning/milestones/v1.41.3-ROADMAP.md`*
*v1.41.5 shipped 2026-05-24 — see `.planning/milestones/v1.41.5-ROADMAP.md`*
*v2.1.0-a shipped 2026-05-26 — see `.planning/milestones/v2.1.0-a-ROADMAP.md`*
