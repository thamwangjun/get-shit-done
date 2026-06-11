# Phase 70 Context: Fork-Patch Restoration & TypeScript Port

**Phase:** 70
**Date:** 2026-06-11
**Milestone:** v2.3.1-a — Upstream v1.3.1 Merge & Rename Adoption

<domain>
Re-apply or port every fork patch that could not survive the three-way merge of upstream `v1.3.1`, and repair the guard/test infrastructure with non-empty-corpus assertions so it cannot pass vacuously. Scope is **code + test infrastructure**, not prompt content. The five ROADMAP success criteria are precise, grep-based, and locked; this discussion only resolves *how* to implement them across the transitional post-merge tree.

**Tooling caveat (recorded for the planner/executor):** at the start of this phase the GSD CLI is broken in this checkout — `get-shit-done/bin/gsd-tools.cjs` no longer exists; `gsd-core/bin/gsd-tools.cjs` fails (`Cannot find module './lib/core.cjs'` — its `lib/` is unbuilt); and the SDK **query layer** (`gsd-sdk query roadmap.get-phase 70` / `init.phase-op 70`) mis-reports phase 70 as `malformed_roadmap` even though the data is correct. The underlying `cmdRoadmapGetPhase()` works when called directly — only the query/command routing layer is broken. Repairing the runnable tool is part of this phase's job. Do not trust the query-layer CLI for phase resolution while executing Phase 70.
</domain>

<decisions>

## 1. Guard-test SCAN_DIRS — keep `get-shit-done/`, flip to `gsd-core/` in Phase 71

The four guard tests (`negative-framing-scan`, `step-numbering-scan`, `no-issue-citations`, `cross-file-step-refs`) keep `SCAN_DIRS` pointed at the **real fork prompt corpus** at `get-shit-done/workflows`, `get-shit-done/references` (and siblings) for Phase 70. The `gsd-core/` repoint moves to Phase 71's rename sweep, which is when the corpus physically relocates.

- **Why:** the 222-file fork prompt corpus is still at `get-shit-done/` (restored in 69-04b); the directory rename is Phase 71. Pointing `SCAN_DIRS` at `gsd-core/` now would let the non-empty-corpus assertion pass on **upstream's un-forked content** (or an empty/partial tree) — guarding the wrong files and giving a false green.
- **How to apply:** Phase 70 still satisfies the *substance* of criterion 4 — non-empty-corpus assertion present (`assert.ok(ALL_FILES.length > 0, ...)`, already in place) and each scanner reports a non-zero file count. The `gsd-core/` literal in criterion 4 is treated as a **ratified deviation**: deferred to Phase 71, recorded here so the verifier doesn't flag it as an unmet criterion. The verifier should check the scanners run against a non-empty corpus, not the specific directory string.

## 2. TypeScript port — `src/*.cts` is the single source of truth

Port the fork's effort logic into the upstream TypeScript source tree and let `tsc` generate the `.cjs`. The build chain is `build:lib` → `tsc -p tsconfig.build.json` → generated `bin/lib/*.cjs`; therefore `src/*.cts` is canonical and the `.cjs` are build artifacts.

- **Current state:** `src/core.cts` already has `EFFORT_SET` (merged in) but is **missing** `parseModelEffort` and `resolveReasoningEffortInternal`; the `*_effort` init fields are likewise only in the orphaned `get-shit-done/bin/lib/{core,init}.cjs`. Port `parseModelEffort`, `resolveReasoningEffortInternal` into `src/core.cts`, and the `*_effort` init fields into the corresponding `src/init.cts` (or upstream's equivalent init source).
- **Verification beyond grep:** criterion 3 is a grep of `src/`, but the executor must also verify the **tsc-generated** `gsd-core/bin/lib/*.cjs` actually contains the symbols at runtime — so the symbols are real and wired, not just present in source. (The user selected the "Port + verify generated .cjs" intent.)
- **Why:** matches upstream's build architecture; avoids two divergent sources of the effort logic.
- **How to apply:** do **not** dual-keep copies in `get-shit-done/bin/lib`. The orphaned fork lib is the *source* for the port content, then becomes irrelevant — Phase 71 handles its removal as part of the sweep.

## 3. agent-frontmatter valid-agent list — union of fork + upstream agents

Reconcile the `agent-frontmatter.test.cjs` valid-agent list as the **union**: all fork agents plus any new upstream agents present on disk.

- **Why:** most permissive and least likely to break the test when an agent file exists on disk; the merge brought in upstream agents the fork should tolerate.
- **How to apply:** add upstream's new agent names to the existing fork list rather than replacing it. Preserve every fork-specific agent. The four frontmatter rules (`Only use the Write tool` for Write-agents + commented `# hooks:`; no `skills:`; `subagent_type:` spawning; name in valid list) still apply to any newly added agent.

## 4. Phase 70 / Phase 71 boundary — P70 makes-it-run, P71 sweeps

Phase 70 repoints only what's needed for the tools and tests to **execute** against the post-merge tree: `TOOLS_PATH` → `gsd-core/bin/gsd-tools.cjs`, test `require()` paths → `gsd-core/`, `tests/helpers.cjs` + `tests/helpers/cli-negative.cjs`, and `npm run build:hooks` (rebuild `hooks/dist/`). Phase 71 owns the full literal `get-shit-done/` → `gsd-core/` directory rename, c8/CI/package-identity repointing, and residual cleanup.

- **Why:** keeps Phase 70 focused on "patches restored + infra runnable"; the atomic rename is a distinct, verifiable Phase 71 deliverable. A transitional half-state between P70 and P71 is **expected and acceptable** (consistent with VERIFY-02: residual failing tests are documented backlog, not a blocker).
- **How to apply:** the `TOOLS_PATH`/`require()` repointing to `gsd-core/` (criterion 5) is consistent with decision 1 — *generated tool/lib code* lives under `gsd-core/bin`, while *prompt content* (`.md` corpus) stays at `get-shit-done/` until P71. Do not chase the directory rename inside P70.

</decisions>

<carried_forward>
From STATE.md / milestone decisions (locked, do not re-open):
- **PATCH-02:** KEEP the fork's SHA-based update-check worker (`isNewer` present, `isSemverNewer` absent) over upstream's semver/npm approach. Encoded as criterion 2.
- **SDK deletion** already accepted in Phase 69 (SDK-02), documented in Phase 68 (SDK-01). SDK restoration is a *future* milestone — out of scope for Phase 70.
- Verification is **structural/grep-based**, never "all tests pass." Residual failures → VERIFY-02 backlog (Phase 71). A green suite is not a completion gate.
</carried_forward>

<canonical_refs>
Every path relative to repo root `/home/thamw/development/remote-dev/gsd-core`:

- `.planning/ROADMAP.md` — Phase 70 detail section (lines ~367–381): goal, 5 success criteria, requirements (PATCH-01/02/04, GUARD-01/02, RENAME-03). MUST read before planning.
- `.planning/STATE.md` — milestone architecture decisions (PATCH-02 keep SHA worker; structural verification only).
- `bin/install.js` — criterion 1 target: `ensureHooksDist`, `GSD_REPO` (≥6 occurrences), lib-dir constant must survive.
- `hooks/gsd-check-update-worker.js` — criterion 2 target: `isNewer` present / `isSemverNewer` absent.
- `src/core.cts` — port target for `parseModelEffort`, `resolveReasoningEffortInternal` (already has `EFFORT_SET`).
- `src/init.cts` (or upstream equivalent) — port target for `*_effort` init fields.
- `get-shit-done/bin/lib/core.cjs`, `get-shit-done/bin/lib/init.cjs` — orphaned fork source for the effort logic being ported (read-only source of truth for the port).
- `tests/negative-framing-scan.test.cjs`, `tests/step-numbering-scan.test.cjs`, `tests/no-issue-citations.test.cjs`, `tests/cross-file-step-refs.test.cjs` — criterion 4 guard tests (keep `get-shit-done/` SCAN_DIRS per decision 1).
- `tests/helpers.cjs`, `tests/helpers/cli-negative.cjs` — criterion 5 `TOOLS_PATH` repoint to `gsd-core/bin/gsd-tools.cjs`.
- `tests/agent-frontmatter.test.cjs` — criterion 5 valid-agent list reconciliation (union per decision 3).
- `package.json` — build chain: `build:lib` (`tsc -p tsconfig.build.json`), `build:hooks` (`scripts/build-hooks.js`).
- Fork prompt-engineering standards (governing, not directly modified here): `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md`, `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md`.
</canonical_refs>

<code_context>
**Reusable assets / current state discovered during scouting:**
- Build is source-driven: `src/*.cts` → `tsc` → `gsd-core/bin/lib/*.cjs`. Edit `.cts`, never the generated `.cjs`.
- `src/core.cts` already contains `EFFORT_SET` (9 refs) — the merge brought partial effort support; only `parseModelEffort` / `resolveReasoningEffortInternal` / `*_effort` init fields remain to be ported.
- Guard tests already carry the non-empty-corpus assertion (`assert.ok(ALL_FILES.length > 0, ...)` at four call sites) — only the directory-target decision (decision 1) is open.
- Working tool entry for the post-merge tree is `gsd-core/bin/gsd-tools.cjs` (once its `lib/` is built); fork's old `get-shit-done/bin/gsd-tools.cjs` is gone.
- Phase 69 artifacts live in `.planning/phases/69-merge-execution-ordered-conflict-resolution/` for merge-resolution context.
</code_context>

<deferred>
- Full `get-shit-done/` → `gsd-core/` directory rename, c8 coverage globs, CI path triggers, `package.json` name/bin identity reconciliation → **Phase 71** (RENAME-01/02, VERIFY-01/02).
- Enumerate + document residual failing tests as deferred conformance backlog → **Phase 71** (VERIFY-02).
- SDK capability restoration → **future milestone** (out of current scope).
- Fix the SDK **query-layer** roadmap-parsing bug (`malformed_roadmap` false negative for phases whose detail lives under `## Phase Details`) → not required for Phase 70 completion; note as a tooling-debt item. Worth capturing to the backlog so the query CLI matches the working `cmdRoadmapGetPhase`.
</deferred>

<open_questions>
None blocking. The four gray areas above are resolved; remaining specifics (exact symbol placement within `src/core.cts`, precise upstream agent names for the union) are implementation details for research/planning.
</open_questions>
