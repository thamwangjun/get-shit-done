# Phase 71 plan-phase — session handoff

**Created:** 2026-06-12
**Workflow:** `/gsd-plan-phase 71` (no flags)
**Resume point:** Step 8 — spawn `gsd-planner`. Research is DONE; all pre-planning gates resolved.

## Status of the plan-phase pipeline

| Step | State |
|------|-------|
| 1. Init | ✅ done (values below) |
| 1.5 Closed-phase gate | ✅ N/A — phase_status=`Pending` |
| 4. Load CONTEXT.md | ✅ exists: `.planning/phases/71-spec-04-eta-materialization/71-CONTEXT.md` |
| 5. Research | ✅ DONE — user chose "Research first"; `71-RESEARCH.md` written, HIGH confidence |
| 5.5 Validation strategy (Nyquist) | ✅ SKIP — `nyquist_validation_enabled=false` |
| 5.55 Security gate | ✅ enforcement=true → planner MUST include a `<threat_model>` block (prose-deliverable model, see sibling 70-01) |
| 5.6 UI gate | ✅ SKIP — `ui_phase=false` AND `ui_safety_gate=false` (both disabled) |
| 5.7 Schema push gate | ✅ SKIP — no ORM/schema files in scope (prose-only phase) |
| 7.8 Pattern mapper | ⏭️ INTENTIONALLY SKIPPED — wrong tool for a single-Markdown prose phase; analog already named (sibling SPEC.md); siblings 69/70 produced no PATTERNS.md (precedent) |
| 7.9 Intel API-SURFACE | ⏭️ INTENTIONALLY SKIPPED — codebase-symbol hint adds nothing; RESEARCH.md §5 already has exact symbols+line numbers |
| 8. Spawn planner | ⬅️ **NEXT ACTION** |
| 10. Plan checker | pending |
| 12. Revision loop | pending |
| 13/13a Coverage gates | pending |
| 13b STATE.md record | pending |
| 13c ROADMAP annotate | pending |
| 13d Commit | pending (`commit_docs=true`) |
| 13e Post-planning gaps | pending (`post_planning_gaps=true`) |
| 14 Present status | pending |

## Resolved init values (phase 71)

- planner_model: `opus;low` · researcher: `sonnet;high` · checker: `sonnet;high`
- granularity: `coarse` → expect a SINGLE plan (mirror siblings)
- mode: `yolo` · commit_docs: `true` · text_mode: `false` · auto_advance/chain: `false`
- nyquist: false · plan_checker_enabled: true · context_coverage_gate: true · post_planning_gaps: true · security_enforcement: true (ASVS L1)
- phase_dir: `.planning/phases/71-spec-04-eta-materialization`
- padded_phase / phase_number: `71`
- phase_req_ids: `SPEC-04 (+ shared QUAL-01–05)`
- Paths: state=`.planning/STATE.md`, roadmap=`.planning/ROADMAP.md`, requirements=`.planning/REQUIREMENTS.md`, context=`…/71-CONTEXT.md`, research=`…/71-RESEARCH.md`
- agent-skills queries returned EMPTY for researcher & planner (no extra skill injection)

## Phase essence

Spec-NARRATION phase: author the body of `.planning/spec/04-eta-materialization/SPEC.md` (stub already has frontmatter + 7-section skeleton from Phase 68). Does NOT modify code — narrates the tier-1 test `tests/install-eta-regression.test.cjs` into the locked 7-section contract and advances Status `Draft → Ready`. Inherits Phase 69/70 method wholesale.

## Locked decisions (CONTEXT.md D-01..D-05) — do NOT reopen

- **D-01:** ~5 role-based invariants `04-INV-1`..`04-INV-5`: (1) copy-path materialization coverage, (2) include inlining, (3) engine config observable, (4) circular-include failure, (5) missing-include failure.
- **D-02:** `04-INV-1` is ONE invariant covering ALL copy paths, naming three explicitly: commands/workflows (`install.js:6515`), agents (`install.js:8731`), **skills wrappedConverter**. Traces to TEST-01 (full-install walk).
- **D-03:** engine config = BOTH a MUST invariant (`04-INV-3`, observable: autoEscape:false, `<%~` raw, resolvePath against views root) AND locked Key Decisions (design intent).
- **D-04:** `ALLOWED_INLINE_REFS` exception normative as a RULE; the ~30 entries are dated advisory enumeration (`current as of 2026-06-12`). Surviving-`<%~` half needs no allowlist (any survivor = bug).
- **D-05:** Key Decisions records as Settled — do not reopen: "Eta v4 over custom `resolveIncludes()`" and "Default Eta delimiters".

## ⚠ CRITICAL correction from researcher (use this, override CONTEXT.md)

CONTEXT.md canonical_refs names `_copyCommandsAsSkillsViaConverter` as the skills pipeline symbol — **that name does NOT exist as a function in current source** (JSDoc-only). The REAL skills copy path is the **`wrappedConverter` closure at `get-shit-done/bin/lib/runtime-artifact-layout.cjs:198` (lines 184–205, inside `skillsKind`)**, which calls `renderEtaContent(content, skillName, etaViewsRoot)` before the per-runtime converter. The planner must use `wrappedConverter` in Code Context (advisory), not `_copyCommandsAsSkillsViaConverter`.

## Researcher's confirmed facts (from 71-RESEARCH.md — read it in full next session)

- Test clusters: TEST-01, TEST-03, TEST-04, TEST-05 (NO TEST-02). TEST-01 has two subtests: TEST-01a (`@~/.claude/` survivor walk) + TEST-01b (`<%~` survivor walk). `04-INV-1` traces to BOTH.
- TEST-03: asserts `rendered.includes('Mandatory Initial Read')` — `gsd-executor.md` inlines fragment from `mandatory-initial-read.md`. → `04-INV-2`.
- TEST-04: `!(err instanceof RangeError)` AND `err.message.includes(fixturePath)` — descriptive Error naming path. → `04-INV-4`.
- TEST-05: `err instanceof EtaFileResolutionError` AND `err.message.includes('nonexistent-path-xyz.md')`. → `04-INV-5`.
- `renderEtaContent` config literals (advisory, `install.js:6452–6460`): `new Eta({ views: viewsRoot, useWith: true, autoEscape: false })` + `resolvePath = (templatePath) => path.join(viewsRoot, templatePath)`. module.exports ~line 11551.
- `ALLOWED_INLINE_REFS`: 30 entries (current as of 2026-06-12), classed `prose` vs `conditional` (`${...}`).
- Open questions (Claude's discretion): whether `04-INV-3` splits resolve-path into a 6th invariant; whether allowlist renders as table or bullets.

## NEXT ACTION — spawn gsd-planner (Step 8)

Spawn ONE `gsd-planner` Agent, `model="opus"`, then STOP and wait. Mirror sibling **`.planning/phases/70-spec-02-sha-versioning/70-01-PLAN.md`** structure EXACTLY:
- Single plan `71-01-PLAN.md`, two `type="auto"` tasks: Task 1 = Purpose + Scope + ~5 `04-INV-M` EARS invariants + Acceptance Tests traceability table; Task 2 = Key Decisions (D-05's two settled) + advisory Code Context + frontmatter Status `Draft → Ready` (Confidence + Specced 2026-06-12).
- Frontmatter: `requirements: [SPEC-04, QUAL-01, QUAL-02, QUAL-03, QUAL-04, QUAL-05]`, `wave: 1`, `depends_on: []`, `files_modified: [.planning/spec/04-eta-materialization/SPEC.md]`, `autonomous: true`, plus `must_haves` (truths/artifacts/key_links).
- Include `<artifacts_this_phase_produces>` (invariant IDs `04-INV-1..5`, the 6 section headers, Status transition) — list PRE-EXISTING symbols as advisory-only.
- Include `<threat_model>` block: prose-deliverable, no meaningful trust boundary; one "mitigate" row (spec inaccuracy → every invariant traces to a real subtest, no MISSING rows) + one "accept" row (advisory-claim drift). No supply-chain row.
- Affirmative-framing (fork standard — state correct behavior, not prohibitions).
- Acceptance Tests table: keyed on `04-INV-M`, columns `Invariant | Test File | Subtest / Assertion Shape`, citing verbatim subtest names from RESEARCH §3; tier-1 file = `tests/install-eta-regression.test.cjs` (single file). No `[MISSING]` rows.

### Planner prompt files_to_read (give these in `<files_to_read>`/`<context>`)
- `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`
- `.planning/phases/71-spec-04-eta-materialization/71-CONTEXT.md` (D-01..D-05 LOCKED)
- `.planning/phases/71-spec-04-eta-materialization/71-RESEARCH.md` (narration map + the wrappedConverter correction)
- `.planning/spec/00-CONVENTIONS.md` (LOCKED 7-section template, NN-INV-M scheme, status vocab, EARS/RFC2119)
- `.planning/spec/04-eta-materialization/SPEC.md` (the stub to fill)
- `.planning/spec/INDEX.md` (SPEC-04 root node, resolveIncludes exclusion entries)
- `.planning/spec/01-positive-framing/SPEC.md` AND `.planning/spec/02-sha-versioning/SPEC.md` (worked sibling SPEC bodies — section shape, advisory marking, invariant+KeyDecision split)
- `.planning/phases/70-spec-02-sha-versioning/70-01-PLAN.md` (the plan-shape template)

Planner banner + ORCHESTRATOR RULE: after Agent() call, stop and wait for return.

## After planner returns
1. Handle return marker (Step 9): `## PLANNING COMPLETE` → step 10. Else filesystem fallback (9a) / split (9b) / source-audit (9c).
2. Spawn `gsd-plan-checker` (`model="sonnet"`) (Step 10). Files: `${PHASE_DIR}/*-PLAN.md`, roadmap, requirements, context, research. phase_req_ids must all be covered.
3. Revision loop max 3 (Step 12) if `## ISSUES FOUND`.
4. Step 13 requirements coverage gate; 13a decision coverage gate (`gsd_run query check.decision-coverage-plan "${PHASE_DIR}" "${CONTEXT_PATH}"` — BLOCKING).
5. 13b: `gsd_run query state.planned-phase --phase 71 --name spec-04-eta-materialization --plans <N>`
6. 13c: `gsd_run query roadmap.annotate-dependencies 71`
7. 13d commit: `gsd_run query commit "docs(71): create phase plan" --files "${PHASE_DIR}"/*-PLAN.md .planning/STATE.md .planning/ROADMAP.md`
8. 13e: `gsd_run gap-analysis --phase-dir "${PHASE_DIR}" --phase-req-ids "SPEC-04 (+ shared QUAL-01–05)"`
9. Step 14: present `<offer_next>` (next = `/gsd-execute-phase 71`).

## gsd_run shim (paste at top of bash in new session)
```bash
G="node /home/thamw/.claude/gsd-core/bin/gsd-tools.cjs"; gsd_run() { node /home/thamw/.claude/gsd-core/bin/gsd-tools.cjs "$@"; }
```

## Open task list (TaskCreate IDs from prior session — recreate if lost)
1. Research Phase 71 — ✅ completed
2. Plan Phase 71 (gsd-planner) — in_progress (NEXT)
3. Verify plans (gsd-plan-checker) — pending
4. Run coverage gates + finalize — pending
