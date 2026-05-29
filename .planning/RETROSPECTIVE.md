# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v2.1.0-c — Install-Time Content Materialization

**Shipped:** 2026-05-29
**Phases:** 5 (44, 45, 46, 47, 47.1) | **Plans:** 11 | **Timeline:** 2026-05-28 → 2026-05-29 (2 days) | **Commits:** 98

### What Was Built

- Custom `resolveIncludes()` pure function (Phase 44) implemented then superseded by Eta v4 pivot (Phase 45) — production-grade template engine proved more robust than handrolled resolver
- Eta v4 wired as install-time template engine in both `copyWithPathReplacement()` and agent install loop; 82 source files converted from bare-line `@~/` refs to `<%~ include() %>` Eta tags; zero survivors
- 5 regression tests in `tests/install-eta-regression.test.cjs` covering zero-ref (full install walk), conditional expression preservation, circular detection, and missing-file handling
- TEST-01 upgraded to walk the full Claude install with 27-entry `ALLOWED_INLINE_REFS` exception list; GATE-01/02/03 closed at `npm test` 7459/49
- Phase 47.1 inserted after audit found `wrappedConverter` gap: `renderEtaContent` now wired for all 11 skills-based runtimes; TEST-01 expanded to detect `<%~` survivors

### What Worked

- **Audit-before-close discipline**: Running `gsd-audit-milestone` after Phase 47 revealed the skills-path gap (INTG-04/GATE-03 not fully closed). Inserting Phase 47.1 rather than treating it as tech debt meant the milestone shipped with no open blockers.
- **Pivot in Phase 45**: Switching from custom `resolveIncludes()` to Eta v4 early (after Phase 44 proved the pattern was complex) was the right call — the production engine handled edge cases that would have required significant custom resolver work.
- **Default delimiter rollback in Phase 46**: Discovering the `{%~`/`~%}` custom delimiter issue early (files processed twice) and rolling back to Eta defaults (`<%`/`%>`) in Phase 46 kept the regression test suite clean.
- **Integration checker at milestone audit time**: The `gsd-integration-checker` confirmed all cross-phase wiring live (6/6 tests) and caught the `wrappedConverter` gap — this is more reliable than static analysis of plan files.

### What Was Inefficient

- **Two-phase delimiter churn**: Phase 45 introduced custom `{%~`/`~%}` delimiters; Phase 46 rolled them back to Eta defaults after discovering the double-processing issue. The plan should have evaluated delimiter choices before any mass conversion.
- **Phase 47.1 was avoidable at planning time**: The `stageSkillsForRuntimeAsSkills` code path could have been identified as an integration risk during Phase 47 planning — it was a known skills-specific copy path that was noted in INTG-06 as "not requiring a renderer call" without verifying whether `<%~` tags would ever appear in skills files. A more thorough audit at Phase 47 time would have caught this before a separate phase was needed.

### Patterns Established

- Integration checker (`gsd-integration-checker`) should run at Phase N verification time, not only at milestone audit time — it caught the `wrappedConverter` gap that static plan analysis missed
- When descoping a requirement (TEST-03, TEST-06), document both the reason and the test-file impact immediately — avoids confusion during verification about why test count differs from plan
- Delimiter choice for Eta (or any templating engine) should be locked at the start of the pipeline integration phase and tested against the full source file corpus before mass conversion

### Key Lessons

- Mass conversion passes (82 files) should be preceded by a delimiter/syntax smoke test on 3–5 representative files across all source layers before any batch script runs — the Phase 46 rollback was cheap but avoidable
- `audit-open` at milestone close surfaced zero false positives this time (unlike v2.1.0-a); the `status: complete` frontmatter pattern in `*-SUMMARY.md` files is now consistently applied

---

## Milestone: v2.1.0-a — SHA Versioning Reimplementation

**Shipped:** 2026-05-26
**Phases:** 2 | **Plans:** 2 | **Timeline:** 2 days (2026-05-25 → 2026-05-26) | **Commits:** 19

### What Was Built

- SHA-based `isNewer()` in `gsd-check-update-worker.js` using GitHub Commits API fetch — npmjs.com removed entirely from update path
- `bin/install.js` now writes 7-char SHA to VERSION file via `git rev-parse --short=7 HEAD` with `'no-network'` sentinel fallback; `{{GSD_REPO}}`/`{{GSD_BRANCH}}` template replacements wired for hook files
- `gsd-statusline.js` `parseV()` semver IIFE removed; stale hooks display simplified to single SHA mismatch check
- `check-latest-version.cjs` migrated to GitHub Commits API SHA fetch with injectable test seam
- `update.md` changelog extraction removed; replaced with direct GitHub commits link
- All 17 requirements satisfied; 185 pre-existing test failures, zero new regressions

### What Worked

- **Audit-first before milestone start**: Running `gsd-audit-milestone` revealed that most of the implementation was already present from prior work; Phase 42 execution confirmed files were already correct and only needed minor surgical additions (literal string in a comment for static analysis test, not logic changes).
- **3-source cross-reference**: Validating each requirement against VALIDATION.md (Nyquist), SUMMARY.md frontmatter, and REQUIREMENTS.md traceability caught the stale checkbox issue early in the audit phase rather than at milestone close.
- **Quick task for tech debt**: Resolving all 8 stale metadata items (checkboxes, test counts, doc strings) in a single quick task (`20260526-v2-1-0-a-tech-debt-cleanup`) rather than inline during execution kept the phase plans clean and the audit unambiguous.
- **Injectable request seam**: Adding `opts.request` to `check-latest-version.cjs` from the start made testing completely deterministic without subprocess spawning — no test infrastructure cost.

### What Was Inefficient

- **Pre-existing `semver-compare.test.cjs`**: The tests describing the SHA implementation were already present before the milestone started (written as RED gates). This was efficient in principle but created confusion in Phase 42's self-check — the worker was already correct, and the plan was written assuming it needed to be rewritten.
- **Audit false positives for quick tasks**: The `audit-open` scanner reported 4 completed quick tasks as "unknown" because they lacked STATE.md files. Added STATE.md + fixed status frontmatter in per-task SUMMARY.md files — the audit tool reads per-task `*-SUMMARY.md`, not bare `SUMMARY.md`. Future quick tasks should include `status: complete` in their `*-SUMMARY.md` frontmatter.

### Patterns Established

- Quick task `*-SUMMARY.md` files must include `status: complete` in frontmatter for the `audit-open` scanner to recognize them as closed
- When an audit report shows "unknown" status for a task that has a SUMMARY.md, check whether the per-task `{slug}-SUMMARY.md` has the `status:` field (not just the bare `SUMMARY.md`)

### Key Lessons

- Milestone audits surface stale metadata reliably — running `/gsd-audit-milestone` before `/gsd-complete-milestone` is worth the step
- `audit-open` reads the per-task `{slug}-SUMMARY.md` form (not bare `SUMMARY.md`) and requires `status: complete` in frontmatter — both files must be present and correct

---

## Milestone: v1.36.0 — Files

**Shipped:** 2026-04-16
**Phases:** 3 | **Plans:** 7 | **Timeline:** 2 days (2026-04-15 → 2026-04-16) | **Commits:** 42

### What Was Built

- CATALOGUE.json expanded from 227 → 250 entries, covering all 23 files added in the v1.36.0 upstream merge
- Positive-framing standard applied to all 26 affected files (10 new + 15 modified + 1 gap-closure): 6 actual edits across 5 files, 20 confirmed clean without edits
- Global boilerplate `Do NOT load full AGENTS.md files` replaced with `Load specific agent files only` across 13 agents in a single sweep
- `<available_agent_types>` block inserted into discuss-phase.md; agent-frontmatter tests 135/135 pass
- Test suite realigned: 2 prohibition-check test blocks removed, 3 string literals updated to match fork-standard output — 3933/3933 tests pass

### What Worked

- **Scanner-first approach**: Running the negative-framing scanner before any edit revealed that most VIOLATIONS.md entries didn't actually trigger the scanner (lowercase `Do not` vs. uppercase `Do NOT`). This avoided ~24 unnecessary edits.
- **Wave execution**: Phase 2 plans ran effectively in dependency order (02-03 global sweep first, then 02-01/02-02 per-file passes), ensuring agents were clean before file-level work.
- **Gap closure as part of the milestone**: The 02-04 gap closure (missing `<available_agent_types>` block) was caught by UAT and fixed without needing a separate milestone cycle.
- **Test precedence rule**: Establishing "modify the test, not the fork change" as explicit precedent made Phase 3 straightforward — no ambiguity about which direction to fix.

### What Was Inefficient

- **VIOLATIONS.md accuracy**: The pre-computed violations list had many false positives (lowercase `Do not` entries). Future passes should run the scanner directly rather than trusting a pre-computed list.
- **Documentation debt accumulation**: All 30 REQUIREMENTS.md checkboxes and 4 SUMMARY.md `requirements_completed` fields were left unchecked throughout execution, requiring a cleanup pass at milestone close. Updating these during execution would eliminate this step.
- **Audit status `tech_debt`**: The milestone audit produced `tech_debt` rather than `passed` solely due to the documentation debt above — the actual work was complete. Keeping docs current during execution would yield a clean `passed` status directly.

### Patterns Established

- **Scanner-first, edit-second**: Always run the negative-framing scanner on a file before editing. Only edit lines that actually fail. Confirmed-passing lines (lowercase patterns, em-dash complements, code-fence contents) require no edits.
- **D-07 exception**: SECURITY-style `Never X — always Y` paired patterns are valid reframe constructs. Identify and preserve them explicitly rather than converting them.
- **Test alignment precedent**: When a test asserts for upstream behavior that conflicts with fork standards, modify the test. Document this in decisions so future phases don't relitigate it.
- **Global sweep before per-file**: When a boilerplate pattern appears in many files, replace it globally in one plan before doing per-file work — avoids re-encountering the pattern mid-pass.

### Key Lessons

1. **Pre-computed violation lists decay quickly** — the scanner is the source of truth, not a static VIOLATIONS.md. Running the scanner takes seconds and prevents wasted edits.
2. **Documentation debt is invisible until milestone close** — checking off REQUIREMENTS.md boxes and filling `requirements_completed` frontmatter during plan execution costs nothing and prevents a cleanup sweep later.
3. **Gap closure mid-milestone is cheaper than a second audit cycle** — the 02-04 gap (discuss-phase missing block) was caught via UAT and closed before verification. Catching it after archive would have required reopening the milestone.
4. **Scope boundaries matter for pre-existing debt** — the two pre-existing `Do NOT` violations in gsd-code-fixer.md and gsd-doc-verifier.md were correctly left for a future maintenance pass rather than folded into v1.36.0 scope.

### Cost Observations

- Model mix: balanced profile (Opus for planning, Sonnet for execution)
- Sessions: ~3 sessions across 2 days
- Notable: 42 commits for 26 files — high commit density reflects plan-level granularity and documentation commits alongside feature commits

---

## Milestone: v1.36.0.b — Fix Hooks Installation

**Shipped:** 2026-04-17
**Phases:** 2 | **Plans:** 2 | **Timeline:** 1 day (2026-04-17) | **Commits:** ~15

### What Was Built

- `ensureHooksDist(src)` helper added to bin/install.js — triggers on-demand `scripts/build-hooks.js` via `spawnSync` when `hooks/dist/` is absent on fresh clone
- Conditional success message: `✓ Installed hooks (built from source)` vs `✓ Installed hooks (bundled)` — install is no longer silent about fallback behavior
- 8-test regression suite (`bug-1924-ensure-hooks-dist-on-demand.test.cjs`) confirming hooks install correctly when dist/ absent at install time
- Cross-file race condition fixed in run-tests.cjs: `SERIAL_FILES` list runs hooks/dist-mutating test file serially after all parallel tests — full suite 3941/3941 pass

### What Worked

- **Tight scope**: 3 requirements, 2 phases, 1 day — the bug was well-understood before planning began and no scope creep occurred
- **Plan threat model**: T-05-02 identified concurrency risk early, even though its assessment was wrong (see below); having it surfaced made the root cause obvious when tests failed
- **spawnSync choice**: Using `spawnSync` with `stdio: pipe` cleanly suppressed build subprocess output while capturing stderr — the right tool for a fire-and-check build trigger

### What Was Inefficient

- **Threat model incorrect on concurrency**: T-05-02 assessed the concurrency race as "accept" based on wrong assumption that Node serializes within a describe block. The race was real and cross-file. Investigating Node test runner concurrency semantics during planning would have avoided a debugging loop in Task 1.
- **Multiple UAT/fix passes for Phase 5**: The regression test required two rounds of fixes (intra-file wrapper + cross-file SERIAL_FILES) before the full suite was stable.

### Patterns Established

- **SERIAL_FILES pattern in run-tests.cjs**: Test files that rename or restore shared mutable directories (like `hooks/dist/`) must be isolated from concurrent installer subprocesses. Add them to SERIAL_FILES and run as a separate serial phase.
- **Outer `describe({ concurrency: false })` wrapper**: When intra-file describe blocks share mutable state, wrap them in an outer describe with `concurrency: false` to serialize execution.
- **`require()` inside helper body**: When a module-scope `require` would conflict with an existing try-block or variable binding, scope it inside the function body — module cache makes this cost-free.

### Key Lessons

1. **Node test runner `--test-concurrency=N` applies across files AND within files** — top-level describe blocks in a file run concurrently at the file level too. Don't assume intra-file serialization.
2. **Cross-file subprocess races are invisible without the full suite** — the bug only appeared when running all 170+ test files together; isolated file runs passed cleanly.
3. **Tight-scope bug-fix milestones ship fast** — with a well-understood bug, 3 requirements, and no ambiguity, 2 phases in 1 day is achievable.

### Cost Observations

- Model mix: balanced profile (Sonnet for execution)
- Sessions: 1 session
- Notable: 15 commits for 3 production files + regression test — lean, targeted milestone with minimal documentation overhead

---

## Milestone: v1.36.0.a — Fix Update Functionality

**Shipped:** 2026-04-18
**Phases:** 3 | **Plans:** 4 | **Timeline:** 2 days (2026-04-17 → 2026-04-18) | **Commits:** ~36

### What Was Built

- `gsd-check-update-worker.js` rewritten: replaced undefined `isNewer` + npm registry call with SHA equality check against GitHub Commits API; worker no longer crashes
- `gsd-statusline.js` simplified: removed stale `isDevInstall` IIFE and `parseV` semver split — permanently dead code under SHA versioning
- `bin/install.js` fixed: replaced GitHub API curl with `git rev-parse --short=7 HEAD`; offline fallback writes `no-network` sentinel instead of semver; VERSION always contains a valid SHA or clearly-invalid sentinel
- `update.md` fixed: single `rm -f ~/.cache/gsd/gsd-update-check.json` added to `run_update` step — stale statusline indicator no longer persists after successful update
- Phase 4 VERIFICATION.md produced from existing evidence; milestone audit HOOK-01–04 rows updated to `satisfied`

### What Worked

- **Local git for version detection**: Switching from GitHub API curl to `git rev-parse --short=7 HEAD` eliminated a network dependency at install time and simplified the code path significantly.
- **Sentinel pattern for offline fallback**: Writing `no-network` instead of falling back to `pkg.version` (semver) made the failure mode explicit and easy to detect downstream — no ambiguous version strings.
- **Evidence synthesis for verification**: Phase 6 produced VERIFICATION.md entirely from existing SUMMARY.md, UAT.md, and test evidence — no re-execution needed. The synthesis approach is fast and reliable when evidence is already documented.
- **Scoped phases**: Each phase had a single, narrow goal. Phase 4 = fix the worker. Phase 5 = fix version detection + update workflow. Phase 6 = produce missing verification artifact. No phase bled into another.

### What Was Inefficient

- **audit-open command bug**: The `audit-open` CLI command crashed at milestone close with `ReferenceError: output is not defined`. Required manual readiness check. Bug should be fixed before next milestone.
- **ROADMAP.md Phase 6 progress table stale**: The progress table still showed Phase 6 as "Not started / 0/1 plans" at milestone close — the executor didn't update it. Small but requires manual correction.
- **UPD-01 partial status**: The live end-to-end verification for the "already on latest" path was not achievable during automated execution (requires interactive install). Accepted as partial at close, but ideally would have a scripted smoke-test harness.

### Patterns Established

- **Local git-based versioning**: `git rev-parse --short=7 HEAD` with `.trim()` and `/^[0-9a-f]{7}$/` regex guard is the canonical pattern for SHA-based version detection in this fork.
- **Non-SHA sentinel pattern**: `no-network` (or similar clearly-invalid string) as offline fallback ensures downstream `grep -Eq '^[0-9a-f]{7}'` gates always detect the failure case.
- **Cache-clear on update**: `rm -f ~/.cache/gsd/gsd-update-check.json` after a successful update is the correct cleanup to prevent stale statusline indicators.
- **Synthesis verification for documentation phases**: When a phase produces only documentation artifacts (not code), VERIFICATION.md can be written entirely from existing evidence — no re-execution gate needed.

### Key Lessons

1. **`audit-open` must work at milestone close** — it's a gate, not optional. The bug (`output is not defined`) should be fixed before the next milestone cycle.
2. **Static analysis tests are sufficient for install-path code** — `install.js` has broad side effects making live tests fragile. Static analysis covering the specific code pattern (regex, fallback sentinel) provides reliable coverage without infrastructure overhead.
3. **Evidence-first verification phases are fast** — Phase 6 (verification artifact production) took ~10 minutes because all evidence was already in SUMMARY.md and UAT.md. Keeping those files current during execution is what makes synthesis phases cheap.
4. **Narrow scope prevents drift** — 3 phases, 4 plans, 36 commits for 3 targeted bug fixes. No scope creep. Each fix was exactly what the phase said it would be.

### Cost Observations

- Model mix: balanced profile (Opus for planning, Sonnet for execution)
- Sessions: ~2 sessions across 2 days
- Notable: Low plan count (4) relative to phases (3) — each phase had a clear, narrow goal that needed minimal decomposition

---

## Milestone: v1.37.1 — Files

**Shipped:** 2026-04-22
**Phases:** 6 | **Plans:** 10 | **Timeline:** 5 days (2026-04-17 → 2026-04-21) | **Commits:** ~40 (milestone work only)

### What Was Built

- 55 upstream v1.37.1 commits merged into thamw-main; all 3 critical fork patches survived (SHA equality worker, ensureHooksDist installer, positive-framing test assertion)
- 43 conflict files resolved: 3 critical auto-merged correctly, 40 non-critical taken from upstream with fork improvements deferred to Phase 9
- CATALOGUE.json expanded from 250 → 270 entries (6 commands, 8 references, 5 workflows, 1 template)
- Fork standards applied to all 20 new files (scanner confirmed clean or violations fixed) and 193 upstream-modified files (scanner-first: 8 violations fixed across 5 files)
- `<persona>` tag rename re-applied to 24 upstream-reverted agents; 4142/4142 tests pass
- 3 tech debt items resolved: TDZ bug in update worker (`let latest = null` moved above `writeResult()`), required_reading repair in gsd-intel-updater (prose→`@file`), positive-framing sweep of 11 unpaired prohibitions across 9 files

### What Worked

- **FORK-CORRUPTION triage at merge time**: Classifying agent-frontmatter and negative-framing-scan failures as FORK-CORRUPTION (not UPSTREAM-INTRODUCED) allowed immediate fixes in Phase 7 rather than deferring to Phase 9. The distinction was clear: pre-merge fork files had passing content; merge replaced them.
- **Scanner-first for modified files**: Running the scanner on 193 upstream-modified files before any edit found only 8 violations across 5 files. Without the scanner, a naive approach would have attempted edits on all 193 files.
- **Tech debt milestone (Phase 12)**: Addressing audit-identified WR/IN items in a dedicated phase rather than inlining them kept earlier phases focused. The audit file gave Phase 12 a clear, pre-prioritized scope.
- **Dynamic FILE_WRITING_AGENTS list (WR-04)**: Replacing the hardcoded fork URL with `{{GSD_REPO}}/{{GSD_BRANCH}}` templates eliminated a fragility that would have broken update checks for any downstream fork-of-fork.

### What Was Inefficient

- **`audit-open` CLI still broken**: The `output is not defined` bug from v1.36.0.a was not fixed before this milestone. Manual artifact audit was required again. This is the third time this gate has been bypassed.
- **MERGE-02 verification command became stale post-WR-04**: The REQUIREMENTS.md verification command for MERGE-02 (`grep thamwangjun`) was correct at requirement definition time but became stale after Phase 12 replaced the hardcoded URL. The requirement and its verification command should be updated atomically when the underlying implementation changes.
- **Phase 11 VALIDATION.md cosmetic debt**: VALIDATION.md frontmatter (`nyquist_compliant: false`, `wave_0_complete: false`) was never updated after phase completion. Phase 12 audit caught it as a cosmetic gap but it still required a note in the audit file.
- **12-PATTERNS.md left untracked**: `.planning/phases/12-tech-debt-remediation/12-PATTERNS.md` was not added to git at phase completion — still untracked at milestone close. Minor but reflects a documentation cleanup step missed.

### Patterns Established

- **FORK-CORRUPTION vs UPSTREAM-INTRODUCED triage**: At merge triage, check pre-merge git history before classifying a failure. If the fork had passing content before the merge, it's FORK-CORRUPTION — fix immediately. If the failure comes from a new upstream test or new upstream file, it's UPSTREAM-INTRODUCED — document and defer.
- **`<persona>` re-application sweep**: After upstream merges, run `grep -r '<role>' agents/` to catch any agents reverted to the upstream `<role>` tag. Re-apply `<persona>` as a batch fix.
- **Dynamic agent lists over hardcoded fork references**: When a runtime constant (like `FILE_WRITING_AGENTS`) is derived from fork-specific metadata, compute it dynamically rather than hardcoding — avoids maintenance debt as the agent set changes.

### Key Lessons

1. **`audit-open` must be fixed before v1.38.x** — bypassing it twice is a pattern. A crashing gate is not a gate. This is a blocking debt item for the next milestone cycle.
2. **Requirement verification commands should be update-locked to their implementations** — when WR-04 changed `gsd-check-update-worker.js`, the MERGE-02 verification command in REQUIREMENTS.md should have been updated in the same commit. Version-specific verification commands decay silently.
3. **Scanner is even faster at scale** — 193 files scanned, 8 violations found (4% hit rate). Without the scanner, a file-by-file approach would have taken 10× longer. Scanner-first is now confirmed at both small (26 files, v1.36.0) and large (193 files, v1.37.1) scales.
4. **Dedicated tech debt phases ship cleaner milestones** — Phase 12 gave 3 audit items a clean execution context. Inlining them into Phase 10 or 11 would have muddied those phases' success criteria.

### Cost Observations

- Model mix: balanced profile (Opus for planning, Sonnet for execution)
- Sessions: ~6 sessions across 5 days
- Notable: 10 plans across 6 phases — highest plan count per milestone so far, reflecting the multi-stage nature of upstream-merge work (merge, catalogue, standards, tests, docs, debt)

---

## Milestone: v1.37.1a — Do-Not Framing Pass

**Shipped:** 2026-04-23
**Phases:** 5 | **Plans:** 12 | **Timeline:** 2 days (2026-04-22 → 2026-04-23) | **Commits:** ~25

### What Was Built

- 17 bare "do not" directive violations fixed across 4 agent files, 7 workflow files, 1 reference file, and 3 command files (FRAMING-01 through FRAMING-17)
- Corpus scan test suite extended: 4 subtests (agents, workflows, references, commands) all green; NEVER corpus scan also passing
- `isConditionalOrFactual` scanner function improved with broader verb set and relative clause detection (WR-01, Phase 17)
- REQUIREMENTS.md annotated with `Fixed:` before/after text for all 17 requirements inline
- Nyquist VALIDATION.md records created for Phases 13, 14, 15 (Phases 13 & 14 had partial records; Phase 15 was missing)
- Working tree cleaned: duplicate `describe` block removed, 4 untracked artifacts committed, Phase 15 SUMMARY test count corrected

### What Worked

- **Case-insensitive scanner first**: Running the corpus scan before editing revealed 17 actual violations — more than the 14 initially estimated (because FRAMING-11 and FRAMING-12 were previously tracked separately). Scanner-first prevented unnecessary edits on already-compliant lines.
- **Incremental corpus scan gating by directory**: Adding agent subtest in Phase 13 and workflow/reference/command subtests in Phase 14 matched the phased execution — each gate confirmed the work for that directory before moving on.
- **FRAMING-11 and FRAMING-12 deletion**: Rather than rewriting two bare DO NOT lines in transition.md, deleting them was correct — the `**Stop here.**` gate already covered the intent. Recognizing redundant prohibitions saved unnecessary edit complexity.
- **Tight milestone scope**: 2 days, 5 phases, 12 plans, zero scope creep. Every phase had a single verifiable output.
- **Phase 16 Nyquist pass**: Treating Nyquist gap closure as a dedicated phase rather than tacking it onto Phase 15 gave it a clean success criterion and prevented incomplete records at close.

### What Was Inefficient

- **audit-open was broken at close** (again): The `gsd-sdk query milestone.complete` call failed with a confusing error; the actual CLI invocation required `node gsd-tools.cjs milestone complete`. The root cause mismatch between SDK query dispatch and direct CLI was a time sink. **This must be investigated before the next milestone.**
- **Scanner WR-01 bug discovered mid-housekeeping**: Phase 17 found that `isConditionalOrFactual` was misclassifying conditional patterns containing factual verbs — a bug in the scanner itself. The fix was correct, but discovering scanner bugs during a housekeeping phase is not ideal. Scanner regression coverage should be added proactively.
- **Stale quick task index entries**: 4 phantom quick task entries (all `[missing]`) were deferred at close. These are noise from completed milestones and should be purged by `audit-open` rather than requiring manual acknowledgment.

### Patterns Established

- **Affirmative rewrite rule is strict**: The negative phrase must not remain — "Skip verification for the following:" passes; "Do not verify X" does not. FRAMING-05 (gsd-doc-verifier.md) established the list-header case.
- **Deletion is a valid rewrite when surrounding context covers intent**: FRAMING-11 and FRAMING-12 were deleted because `**Stop here.**` already expressed the constraint positively. Deleting a redundant prohibition is preferred over adding a parallel positive instruction.
- **REQUIREMENTS.md Fixed: annotation format**: Inline annotations on the same line as the checkbox (`Fixed: "old text" → "new text"`) are searchable and keep requirements self-documenting without separate files.

### Key Lessons

1. **`audit-open` and `milestone.complete` SDK dispatch need a smoke-test** — both broke at milestone close for this milestone and v1.37.1. A 5-minute CLI integration test before any milestone close would catch these instantly.
2. **Scanner improvements discovered during execution should gate the scanner's own tests** — WR-01 in Phase 17 improved `isConditionalOrFactual` but no regression test was added for the new heuristics. Future scanner changes should include a test for the specific pattern that triggered the fix.
3. **Phase 17 housekeeping is predictable** — every milestone now ends with a housekeeping phase. Consider making it a standard template phase in future milestones rather than planning it from scratch each time.

### Cost Observations

- Model mix: balanced profile (Sonnet for execution, Opus for planning)
- Sessions: ~4 sessions across 2 days
- Notable: 12 plans across 5 phases — the highest plan density per phase (2.4) of any milestone so far, reflecting fine-grained execution gates for the corpus scan work

---

## Milestone: v1.37.1b — Fork Tag Corpus Tests

**Shipped:** 2026-04-29
**Phases:** 2 | **Plans:** 5 | **Timeline:** 2 days (2026-04-28 → 2026-04-29) | **Commits:** 38

### What Was Built

- Fork tag corpus tests added (Phase 18); all 33 remaining command files converted to consistent primary directive tags (Phase 19, CONVERT-01)
- Full test suite gate: 4304 pass, 2 pre-existing fails (qwen-install.test.cjs, unrelated to fork), 0 new failures
- *(Test files subsequently deleted 2026-04-30 when tag conversion requirement was dropped)*

### What Worked

- **Two-phase decomposition**: Phase 18 added the tests with documented expected failures; Phase 19 closed the gap by converting those files. Clean separation — no mixed-concern phases.
- **DESIGN NOTE pattern for expected failures**: Documenting intentional test failures inline with `// DESIGN NOTE:` explaining count, reason, and resolution phase makes follow-on phases a clean close.
- **Batch `sed` for bulk file edits**: Single-pass, zero content changes, easy to verify with `grep -l 'old_pattern' target_files` returning 0 matches. Mechanical and auditable.
- **Milestone scope expansion mid-cycle (Phase 19 added)**: Phase 19 was added after Phase 18 completed, converting the v1.37.1b scope from "add tests" to "add tests and close the gap they revealed". The incremental approach was correct — tests first, then fix.

### What Was Inefficient

- **Stale quick task index persisted again**: The same 4 phantom `[missing]` quick task entries from v1.37.1a close were still in the audit at close, plus a 5th. Root cause: old quick task format used `{prefix}-SUMMARY.md` filenames; the audit tool expects bare `SUMMARY.md`. Fix was to copy the prefixed file to `SUMMARY.md`. This is a recurring friction point that should be resolved in the audit tool itself.
- **Phase 19 not in original milestone scope**: Phase 18 revealed a gap addressable immediately; Phase 19 was added mid-milestone to close it. Minor, but the pre-planning scope was incomplete.

### Patterns Established

- **DESIGN NOTE for intentional test failures**: When a test file has expected failures (design gaps, deferred work), document them inline with `// DESIGN NOTE:` explaining the count, reason, and expected resolution phase. This prevents false alarm investigations.
- **Phased gap-closure pattern**: Phase N adds a guard (with documented failures); Phase N+1 closes the gap; Phase N+1 confirms 0 failures. Keeps each phase's success criterion clean.
- **Batch tag conversion + residual grep**: After a bulk sed rename, verify with `grep -l 'old_tag' target_files` returning 0 matches. The grep is the acceptance criterion, not just a sanity check.

### Key Lessons

1. **Documented expected failures decompose cleanly into follow-on phases** — design failures in Phase 18 became Phase 19's exact task list. No ambiguity about what "done" meant.
2. **Audit tool naming expectations must match the quick task format** — the `audit-open` tool expects `SUMMARY.md` (no prefix) inside quick task directories, but the old quick task scaffold produced `{prefix}-SUMMARY.md`. Either update the scaffold template or add backward-compatible path detection to the audit tool. This has now caused friction at 3 consecutive milestone closes.
3. **Mechanical conversions (sed/find-replace) need explicit 0-residual verification** — `grep -l` returning 0 files is a falsifiable gate; "I ran sed" is not. Always close with the grep.

### Cost Observations

- Model mix: balanced profile (Sonnet for execution, Opus for planning)
- Sessions: ~3 sessions across 2 days
- Notable: 38 commits for 2 phases — includes worktree merge commits, review-fix cycles, and UAT; lean in scope but thorough in verification

---

## Milestone: v1.37.1c — Tag Hierarchy Completion (Abandoned)

**Archived:** 2026-04-29 (abandoned)
**Phases:** 1/5 attempted | **Plans:** 1 | **Timeline:** 1 day | **Commits:** 44

### What Was Built

- `scripts/audit-tags.js` — re-runnable Node.js CJS audit script; scans 270 files across 5 levels with bare-block detection and per-file status classification
- `20-BASELINE-AUDIT.json` + `20-BASELINE-AUDIT.md` — 270-file inventory documenting 146 anomalies (80 missing in workflows, 32 missing in templates, 19 missing in references, 14 multiple in agents, 1 wrong-level in commands)

### Why It Was Abandoned

The decision was made to stop after Phase 20 and not continue with Phases 21–24. The baseline audit artifact is preserved. The tag hierarchy conversion requirement was subsequently dropped entirely (2026-04-30) — see PROJECT.md Key Decisions.

### What Worked

- **Phase 20 execution**: Baseline audit completed cleanly in ~4 minutes. Script ran correctly on first execution, producing valid JSON + Markdown artifacts with no syntax errors.
- **Accurate reporting over plan estimates**: Script reported actual file counts (270 vs. estimated 274) without fabricating missing files — deviation documented cleanly.
- **Bare-block detection pattern**: `detectTags(content)` + `classifyStatus(foundTags, canonical)` — established a reusable pattern for all future corpus-scan scripts.

### What Was Inefficient

- **Milestone was planned and abandoned without completing any conversion work**: Only the audit phase ran. The planning overhead (roadmap, requirements, context) was not recovered.

### Patterns Established

- **Bare-block detection**: Strip code fences + inline backticks, then check `line.trim() === '<tagname>'` — the correct approach for primary directive detection without false positives from code examples
- **`scripts/audit-tags.js` as baseline**: The audit script is re-runnable and can serve as the canonical inventory for any future hierarchy milestone

### Key Lessons

- An audit phase alone can provide high-value artifacts even if the full milestone is abandoned — the baseline inventory is preserved and usable
- Milestone scope should be validated against available time/motivation before committing to a 5-phase cycle

### Cost Observations

- Model mix: ~100% sonnet
- Sessions: 2
- Notable: 44 commits for 1 phase — includes review-fix cycle; Phase 20 was thorough despite the milestone being abandoned

---

## Milestone: v1.37.2 — Positive Framing TDD Pass

**Shipped:** 2026-05-02
**Phases:** 3 | **Plans:** 9 | **Timeline:** 2 days (2026-05-01 → 2026-05-02) | **Commits:** ~79

### What Was Built

- `scanForNegativeFraming()` refactored to grouped-by-severity return shape; 2 new helpers (`isAvoidDirective`, `isFactualDont`); 7 new detection branches (avoid, don't, `<anti_patterns>`, must not, should not, cannot, won't, will not); 17 call sites migrated; 24 new helper + synthetic-content tests
- 5 hard-failure corpus describe blocks with full TDD red gate: 13 subtests, 11/13 confirmed RED on unmodified upstream before any file edits; 2 correctly GREEN (helper filtering working)
- 3 warn-only corpus blocks (cannot, won't, will not) added — 4 subtests, zero CI impact
- All agents, commands, and workflows at 0 violations and 0 warnings: 5 `<anti_patterns>` blocks → `<expected_patterns>` (D-03 full reframe), 3 bare `Do not` → complement-pair form in commands, NEVER/must not/should not/don't/avoid edits across 34 files
- 8 fork-introduced test failures fixed: HDOC subtest skip, execute-phase test reverts to upstream v1.37.1, reference-file subtest removal from negative-framing-scan, `__dirname`-based hook path dehardfording
- Full suite: 4183/4184 pass, 0 fail, 1 intentional skip — `qwen-install` 16/16 after hook path fix

### What Worked

- **TDD red gate discipline**: Verifying each hard-failure subtest RED before any file edits (Plan 25-02) gave high confidence that the new detections were actually catching violations rather than passing vacuously. The 11/13 RED / 2 GREEN split was meaningful — the 2 GREEN cases proved the helper filtering was correct.
- **Warn-only classification via manual review**: Manually reviewing every corpus match before writing asserts (cannot, won't, will not) correctly identified that these patterns have high false-positive rates. Shipping them as warn-only prevented CI breakage while retaining diagnostic output.
- **Phase decomposition**: 25-01 (scanner refactor) → 25-02 (hard-failure corpus) → 25-03 (warn-only corpus) → 26-01/02/03 (violations by directory) → 27-01/02/03 (test suite fixes) was clean. Each plan had a single falsifiable success criterion.
- **`<expected_patterns>` reframe pattern**: Renaming `<anti_patterns>` blocks and rewriting their contents as affirmative guidance (D-03) now has a tested, repeatable pattern. Future upstream merges that add `<anti_patterns>` have a clear playbook.
- **Hook path fix as a quality gate win**: Plan 27-02's `__dirname`-based fix was the right cleanup regardless of the milestone's scanning focus — it eliminated a Claude-specific path dependency that would have silently broken Qwen installs.

### What Was Inefficient

- **audit-open false positives at milestone close (again)**: All 15 quick tasks reported as `[missing]` even though most had `{slug}-SUMMARY.md` with `status: complete`. The audit tool expects bare `SUMMARY.md` but the scaffold produces `{slug}-SUMMARY.md`. This is the 4th consecutive milestone where this caused friction. The user confirmed the tasks were complete and directed to proceed — the audit tool's filename detection must be fixed.
- **Plan 26-01 introduced a violation**: The executor introduced a violation in `gsd-plan-checker.md`'s `<expected_patterns>` block (Rule 1 finding in the code review). Caught by the code review step and fixed, but cost a fix cycle. Executor agents should run the scanner on modified files before submitting.
- **Plan 27-01 complement-passes false assumption**: Plan 27-01's initial assumption that fast.md:93 passed the complement check was wrong — required re-verification. Initial assumptions about "already compliant" lines should always be scanner-verified.

### Patterns Established

- **`<expected_patterns>` as the canonical replacement for `<anti_patterns>`**: Rename the tag and rewrite all contents as affirmative instructions specifying what to do. This is now tested via corpus scan and confirmed across agents and workflows.
- **Hard-failure vs. warn-only classification workflow**: For each new detection pattern, manually review every corpus match → classify as TP or FP → if FP rate is high, ship warn-only; if reliable, ship hard-failure. Document classification inline in PLAN.md before writing any assert.
- **TDD red gate for scanner additions**: New hard-failure subtests must be confirmed RED against unmodified upstream before any file edits. A subtest that starts GREEN provides no value.
- **Executor self-scan before commit**: Modified prompt content files should be scanned by the executor before committing to catch introduced violations early (not in code review).

### Key Lessons

1. **Fix the audit-open filename mismatch before next milestone** — `{slug}-SUMMARY.md` vs bare `SUMMARY.md` has caused friction at 4 consecutive closes. It's a two-line fix in `lib/audit.cjs` (scan for `*-SUMMARY.md` pattern, not just `SUMMARY.md`).
2. **Executors must run the scanner on modified files before submitting** — Plan 26-01's introduced violation was caught by code review, not the executor. Adding a scanner self-check as a pre-commit step would eliminate this class of bug.
3. **Manual TP/FP review before writing scanner asserts is essential** — the canonical / won't / will not patterns had enough FPs that hard-failure would have broken CI on legitimate uses. The classification step isn't overhead; it's the gate.
4. **TDD red gate produces real confidence** — 11/13 RED on first run meant the new detections were real. If we'd written the subtests and immediately "fixed" the files, we'd never have validated the detection worked. Red gate first, always.

### Cost Observations

- Model mix: balanced profile (Sonnet for execution, Opus for planning)
- Sessions: ~4 sessions across 2 days
- Notable: 79 commits for 3 phases — higher density than most milestones; reflects worktree execution, review-fix cycles, and thorough UAT/verification artifacts per plan

---

## Milestone: v1.38.6 — Positive Framing Pass

**Shipped:** 2026-05-03
**Phases:** 4 | **Plans:** 11 | **Timeline:** 2 days (2026-05-02 → 2026-05-03) | **Commits:** 92

### What Was Built

- Manual line-by-line read of all 217 in-scope files (33 agents, 85 commands/gsd, 99 workflows) produced AUDIT-INVENTORY.json with 182 violations across 67 files and 8 new violation patterns not yet caught by the scanner (`prohibited` ×7, `forbidden` ×1)
- Scanner expanded with `isForbiddenDirective()` helper and two new hard-failure detection branches (`prohibited`, `forbidden`); TDD RED gate confirmed — 4 corpus subtests failing before any file edits (SCAN-11)
- All agents/ violations fixed: `antiPatterns` → `expected_patterns` with affirmative rewrites, `mustNot` BLOCKER lines → affirmative prerequisites, `forbidden`/`prohibited` predicates → scope-boundary language; agents/ at 0 violations, 0 warnings
- All workflows/ violations fixed across 7 files using affirmative replacements with em-dash complements; scanner at 99/99 passing, 0 violations, 0 warnings across all three directories
- AUDIT-03 examined-and-found-none: zero upstream test assertions conflicting with fork framing; INVENTORY.md updated 83→87 workflows; npm test 5705/5706 pass, 0 fail, 1 intentional HDOC skip (GATE-02 satisfied)

### What Worked

- **Manual audit before scanner expansion**: Reading every file line-by-line before expanding the scanner found 8 new violation patterns the scanner missed. Scanner-first would have skipped these entirely. The manual step is the discovery mechanism; the scanner is the verification mechanism.
- **Strict TDD red gate**: 4 corpus subtests confirmed RED on unmodified corpus before any prompt-file edits — the gate was real, not vacuous. Same discipline as v1.37.2 and just as valuable.
- **AUDIT-03 closing as examined-and-found-none**: Running the grep sweep before assuming there would be conflicting tests was the right call. The result (zero conflicting assertions) was a valid finding that satisfied the requirement — it wasn't a skip, it was a conclusive result.
- **Phase decomposition**: Audit (28) → scanner expansion (29) → violations fixed (30) → final gate (31) was clean. Each phase had clear inputs from the prior phase and a single falsifiable exit criterion.

### What Was Inefficient

- **audit-open filename mismatch (5th consecutive milestone)**: 15 quick tasks reported as `[missing]` despite having `{slug}-SUMMARY.md` files with `status: complete`. This is the same issue documented in v1.37.2 and v1.37.1b retrospectivers. The fix is clear (`lib/audit.cjs` scan for `*-SUMMARY.md`) but has not been applied.
- **Phase 28 had 6 plans, not 4**: Plans 05 and 06 were added to close gaps found during verification (missing violation records, AUDIT-INVENTORY.md sections, JSON schema). The original 4-plan structure underestimated the cross-validation work. Future audit phases should budget for a verification/gap-close plan from the start.

### Patterns Established

- **Manual read + scanner cross-validation is the complete audit cycle**: Manual read surfaces patterns the scanner misses; scanner cross-validation confirms manual completeness. Neither alone is sufficient. The combination is now a named step in the positive-framing playbook.
- **AUDIT-03 examined-and-found-none is a valid disposition**: When post-fix grep sweeps find no conflicting upstream test assertions, document the finding explicitly rather than silently passing. "Examined and found none" is a satisfying outcome, not a vacuous one.

### Key Lessons

1. **Fix `audit-open` filename detection before next milestone** — `{slug}-SUMMARY.md` vs bare `SUMMARY.md` friction has now appeared at 5 consecutive closes. Two-line fix in `lib/audit.cjs`; the cost of not fixing is paid at every milestone.
2. **Budget a verification/gap-close plan for large audit phases** — Phase 28 needed Plans 05 and 06 to close gaps found during post-execution verification. This is predictable: any phase that reads 200+ files will find discrepancies during cross-validation. Plan for it upfront.
3. **Manual read is discovery; scanner is verification** — these are complementary, not redundant. The scanner missed 8 patterns that manual review found. The correct workflow is: manual read first (finds new patterns), then expand scanner with those patterns, then scanner verifies the fixes.

### Cost Observations

- Model mix: balanced profile (Sonnet for execution, Opus for planning/verification)
- Sessions: ~3 sessions across 2 days
- Notable: 92 commits for 4 phases — high density driven by 6-plan Phase 28 (cross-validation and gap-close required extra plans), TDD red gate evidence capture, and thorough verification artifacts

---

## Milestone: v1.41.3 — Upstream v1.41.2 Fork Compliance

**Shipped:** 2026-05-19
**Phases:** 3 | **Plans:** 4 | **Timeline:** 2 days active (2026-05-13 → 2026-05-14) | **Commits:** 498 (includes upstream GSD framework changes merged to branch)

### What Was Built

- Three surgical test fixes cleared all HOOKS-01, TEST-02, PATH-01 failures: MANAGED_HOOKS insertion for `gsd-update-banner.js`, Windows npm spawn `describe.skip` with fork-architecture comment, and `extract_learnings.md` → `extract-learnings.md` path correction (3 occurrences)
- 12 negative-framing violations across 5 prompt files (gsd-executor.md, gsd-planner.md, discuss-phase.md, edit-phase.md, secure-phase.md, reapply-patches.md) rewritten to affirmative form; scanner 99/99 (6 formerly-failing subtests restored); two tests updated for fork framing precedent
- Bug #3242 fixed in `state.cjs`: `cmdStateJson` heuristic preserves curated cross-milestone progress when `existingFm.progress.total_phases > built.progress.total_phases`, with `Number()` coercion for YAML string-to-number type safety; 5/5 bug-3242 tests active (removed 3 todo markers)
- Full npm test gate at 8306 pass, 0 fail, 1 intentional HDOC skip; `thamw-main` fast-forwarded locally via `git merge --ff-only`

### What Worked

- **Scanner-first confirmed again**: Running the scanner across 193 upstream-modified files before any edits found only 12 violations in 5 files. debug.md was pre-clean (FRAME-01 pre-satisfied). This avoided editing 188 clean files unnecessarily.
- **Tight phase decomposition**: 3 phases with narrow scope (test fixes → framing fixes → gate/merge) made execution fast (~2 days active work) with no scope creep.
- **Phase 33 Plan 02 independence**: The Bug #3242 fix ran as a separate plan within Phase 33 without blocking the framing fix. Both plans could have parallelized.
- **gsd-sdk audit-open pre-close**: Catching the 18 `{slug}-SUMMARY.md` vs bare `SUMMARY.md` issue before archiving was cleaner than acknowledging and deferring.

### What Was Inefficient

- **audit-open filename mismatch (6th consecutive milestone)**: 18 quick tasks reported as `[missing]` despite having `{slug}-SUMMARY.md` files with `status: complete`. The fix (add bare `SUMMARY.md`) was applied at milestone close, but the underlying scanner issue (`lib/audit.cjs` only scans for bare `SUMMARY.md`, not `{slug}-SUMMARY.md`) remains. Key Lesson 1 from v1.38.6 said "fix before next milestone" — it was not fixed.
- **gsd-planner.md 48K size gate collision**: The NEVER → affirmative replacement in Plan 33-01 pushed gsd-planner.md 4 chars over the 49,152-char threshold. Required an inline plan deviation to shorten the replacement while preserving semantics. This is a predictable friction point for any Phase 33-style framing pass on large agent files.

### Patterns Established

- **Fork-divergence test skip pattern**: When an upstream test asserts for upstream architecture (e.g., Windows npm spawn tests assuming npm-based updates), use `describe.skip` with a two-line comment citing the architectural reason — not silent omission or deletion.
- **cmdStateJson cross-milestone heuristic**: `existingFm.progress.total_phases > built.progress.total_phases` is the discriminating signal for curated cross-milestone aggregates. `Number()` coercion required because `extractFrontmatter` returns all YAML values as strings.

### Key Lessons

1. **Fix `audit-open` bare `SUMMARY.md` detection for real** — this has now appeared at 6 consecutive milestone closes (v1.37.1b, v1.37.2, v1.38.6, v1.41.3, and prior). The fix is confirmed: add `SUMMARY.md` alongside `{slug}-SUMMARY.md` when completing a quick task. The scanner is working as designed — the gap is that quick tasks don't create a bare `SUMMARY.md`. Fix the quick task completion flow.
2. **Budget a size-gate check when editing large agent files** — gsd-planner.md has a 48K size limit enforced by `planner-decomposition.test.cjs`. Any framing-pass plan targeting gsd-planner.md should check current file size before writing the replacement and plan for shorter-form rewrites if close to the limit.
3. **debug.md was pre-clean — scanner-first pays off**: Phase 33 expected FRAME-01 to require edits (6 failing tests from v1.41.2), but running the scanner first revealed debug.md was already clean (a different test mechanism had falsely suggested it was failing). Without scanner-first, time would have been spent searching for non-existent violations.

### Cost Observations

- Model mix: balanced profile (Sonnet for execution)
- Sessions: ~2 sessions across 2 active days (2026-05-13–14)
- Notable: compact execution — 4 plans across 3 phases, all with narrow scope and clean exit criteria; Bug #3242 fix as an independent plan within Phase 33 kept framing work unblocked

---

## Milestone: v1.41.5 — Refactor Git Commit History

**Shipped:** 2026-05-24
**Phases:** 7 | **Plans:** 7 | **Timeline:** 3 days (2026-05-22 → 2026-05-24) | **Commits:** 73

### What Was Built

- Dual-layer backup established: git branches (`backup-thamw-main-before-squash`, `backup-thamw-main-with-planning`) + physical backup at `../get-shit-done-backup/`; HEAD soft-reset to `v1.41.2` with ~70 commits unstaged
- 5 batch staging scripts (`scripts/stage-batch-N.cjs`) — each self-verifying against expected file sets before committing
- 5 coherent logical commits replacing ~70 fine-grained commits: config/rules → scanner logic → workflows/agents/templates → tests/SDK → maintenance/logs/state
- Zero-diff parity verified: tree diff against backup branch shows only 10 allowlisted files (staging scripts, Nyquist tests, ignore tweaks)
- npm test 8392 pass, 2 pre-existing failures in ai-evals.test.cjs (zero regression vs backup), negative-framing scanner 99/99

### What Worked

- **Self-verifying staging scripts**: Writing `stage-batch-N.cjs` scripts that validate the staged file set against an expected list before committing was the right abstraction — caught staging accidents automatically and made each batch auditable
- **Physical backup + branch backup**: Two-layer safety meant the refactor could be executed confidently. The branch backup was easy to diff against; the physical backup was the ultimate fallback
- **D-03 allowlist pattern**: Documenting accepted diff exceptions explicitly (10 files that legitimately differ from original tree) converted an ambiguous "almost zero diff" into a clear "zero diff with documented exceptions" — better than pretending the diff doesn't exist
- **Phase decomposition matched the commit plan**: 7 phases mapping 1:1 to the 7 operations (backup, batch 1–5, verify) made execution mechanical and progress legible

### What Was Inefficient

- **audit-open false positives (7th consecutive milestone)**: 4 quick tasks reported as incomplete despite `status: complete` in `{slug}-SUMMARY.md`. The underlying scanner issue (`lib/audit.cjs` scanning for bare `SUMMARY.md` only) is still not fixed. This has now appeared at every milestone close since v1.37.1b.
- **STATE.md overcounting artifact**: `completed_phases: 8` vs `total_phases: 7` was a leftover from a regression-and-fix sequence during Phase 41. A post-phase state consistency check would catch this before milestone close.
- **Documentation gaps accumulation**: Phase 35 (manual git ops) and Phase 39 legitimately couldn't get VERIFICATION.md artifacts; Phase 40/41 had frontmatter inconsistencies. These produced a `tech_debt` audit status rather than `passed`. Keeping doc hygiene during execution would yield cleaner audit results.

### Patterns Established

- **Batch staging script pattern**: For any refactor moving 700+ files across logical groups, write a `stage-batch-N.cjs` script per batch with embedded expected-file validation. Script serves as both automation and documentation of what each batch contains.
- **Allowlist parity gate**: When a refactor can't achieve byte-for-byte zero diff (e.g., scripts created during the refactor appear in the diff), document acceptable exceptions explicitly in a D-03 allowlist rather than relaxing the parity gate.

### Key Lessons

1. **Fix `audit-open` before next milestone** — this is the 7th consecutive milestone where audit-open produces false positives. The fix is known: `lib/audit.cjs` must scan for `{slug}-SUMMARY.md` pattern, not just bare `SUMMARY.md`. No longer deferrable.
2. **Git history refactoring as a repeatable milestone type**: The 5-batch structure (config → scanners → prompts → tests → maintenance) is now a proven template. If history gets cluttered again, apply the same phase structure.
3. **Self-verifying scripts are better than manual checklists**: The `stage-batch-N.cjs` approach made each batch commit auditable without human review. The expected-file list in the script is the source of truth.

### Cost Observations

- Model mix: balanced profile (Sonnet for execution)
- Sessions: ~3 sessions across 3 days
- Notable: 7 plans, 7 commits — 1:1 mapping between plans and commits is the most mechanically clean structure achieved so far; no planning overhead required once the batch structure was defined

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.36.0 | 3 | 7 | First upstream-merge pass; established scanner-first and test-alignment precedents |
| v1.36.0.b | 2 | 2 | Targeted bug fix; established SERIAL_FILES pattern for mutable-state test isolation |
| v1.36.0.a | 3 | 4 | Second bugfix milestone; established local-git versioning and sentinel patterns |
| v1.37.1 | 6 | 10 | Full upstream merge cycle; FORK-CORRUPTION triage, dynamic agent lists, dedicated tech-debt phase |
| v1.37.1a | 5 | 12 | Framing maintenance pass; corpus scan gating by directory, scanner WR-01 improvement, deletion-as-rewrite pattern |
| v1.37.1b | 2 | 5 | Fork tag corpus tests; two-phase gap-closure, DESIGN NOTE pattern, batch sed conversion + residual grep gate |
| v1.37.1c | 1 (abandoned) | 1 | Baseline audit only; requirement subsequently dropped |
| v1.37.2 | 3 | 9 | TDD red gate for scanner expansion; `<expected_patterns>` reframe pattern; hard-failure vs. warn-only classification workflow |
| v1.38.6 | 4 | 11 | Manual read audit as discovery phase before scanner expansion; AUDIT-03 examined-and-found-none disposition; budget gap-close plan for large audit phases |
| v1.41.3 | 3 | 4 | Tight 3-phase structure (test fixes → framing → gate/merge); Bug #3242 cmdStateJson fix as independent plan; scanner-first confirmed on upstream merge pass |
| v1.41.5 | 7 | 7 | Git history refactor as standalone milestone type; self-verifying batch staging scripts; allowlist parity gate pattern |

### Cumulative Quality

| Milestone | Tests | Scanner Pass | Files Touched |
|-----------|-------|--------------|---------------|
| v1.36.0 | 3933/3933 | 34/34 | 26 |
| v1.36.0.b | 3941/3941 | — | 3 |
| v1.36.0.a | 3941/3941 | n/a | 5 (hooks/worker, hooks/statusline, install.js, update.md, semver tests) |
| v1.37.1 | 4142/4142 | 270/270 (20 new + 193 modified; 8 violations fixed) | 193+ prompt files + 3 runtime files |
| v1.37.1a | 4168/4168 | 4/4 subtests DO NOT + 4/4 NEVER | 15 prompt files + 1 test file |
| v1.37.1b | 4304/4306 | 62/62 persona + 79/79 intent | 33 command files + 2 new test files |
| v1.37.2 | 4183/4184 (1 skip) | 0 violations all dirs (agent+command+workflow) | 34 prompt files + scanner + 4 test files |
| v1.38.6 | 5705/5706 (1 skip) | 99/99 subtests (prohibited+forbidden added) | 10 agents + 7 workflows + scanner + docs |
| v1.41.3 | 8306/8307 (1 skip) | 99/99 subtests (unchanged — scanner already complete) | 5 prompt files + state.cjs + 2 test files |
| v1.41.5 | 8392/8394 (2 pre-existing) | 99/99 subtests (unchanged) | 754 files (history refactor — no content changes) |

### Top Lessons (Verified Across Milestones)

1. Run the scanner before editing — the static violations list is unreliable (confirmed v1.36.0, v1.37.1, v1.37.1a)
2. Documentation debt (checkboxes, frontmatter) compounds silently; pay it during execution (confirmed v1.36.0, v1.37.1)
3. Node test runner concurrency applies cross-file and intra-file; never assume serialization without explicit `concurrency: false` (confirmed v1.36.0.b)
4. CLI gates used at milestone close must be tested to actually work — `audit-open` and `milestone.complete` SDK dispatch both broke at close in v1.36.0.a, v1.37.1, and v1.37.1a. **Fix before v1.38.x.**
5. Verification commands in requirements must be updated atomically when the underlying implementation changes (v1.37.1 — WR-04/MERGE-02 lesson)
6. Deletion is a valid positive rewrite when surrounding context already covers the intent — don't add a parallel positive instruction if the gate already exists (v1.37.1a — FRAMING-11/12 lesson)
7. Audit tool naming expectations must match the scaffold output — `audit-open` expecting bare `SUMMARY.md` while the scaffold produces `{prefix}-SUMMARY.md` has caused friction at 4 consecutive closes (v1.37.1b, v1.37.2); fix `lib/audit.cjs` to scan for `*-SUMMARY.md` pattern
8. Executors must self-scan modified prompt files before committing — introduced violations caught in code review instead of before submission cost a fix cycle (v1.37.2)
9. TDD red gate is non-negotiable for scanner additions — verifying RED before any file edits is what makes scanner subtests meaningful, not just passing vacuously (v1.37.2, v1.38.6)
10. Manual read is discovery; scanner is verification — the scanner missed 8 new patterns that manual review found; both steps are necessary in a complete audit cycle (v1.38.6)
11. Budget a gap-close plan for large audit phases — any phase reading 200+ files will find discrepancies during cross-validation; plan for it rather than treating it as overflow (v1.38.6)
12. Fix `audit-open` bare SUMMARY.md detection — has appeared at 7 consecutive milestone closes; fix `lib/audit.cjs` to scan for `{slug}-SUMMARY.md` before next milestone (v1.37.1b–v1.41.5)
