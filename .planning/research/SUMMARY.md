# Project Research Summary

**Project:** v2.3.1-a — Upstream v1.3.1 Merge & Rename Adoption
**Domain:** Brownfield upstream git merge with directory rename and architecture shift
**Researched:** 2026-06-10
**Confidence:** HIGH (all four research files grounded in live git commands against the actual repo)

---

## Executive Summary

This milestone is a brownfield upstream integration, not a greenfield feature build. The goal is to land `open-gsd/gsd-core` tag `v1.3.1` (commit `1bb253c9`) into the fork, resolving all conflicts while preserving critical fork patches, and to adopt the `get-shit-done/` → `gsd-core/` directory rename and the `get-shit-done-cc` → `@opengsd/gsd-core` npm package/bin rename throughout the fork's owned files. A green test suite is explicitly NOT a completion gate — several fork guard tests will fail post-merge by design (they scan upstream content that requires a separate conformance-pass milestone).

The merge is mechanically viable using a standard `git merge -s ort` with `diff.renameLimit=5000` and `merge.renameLimit=5000`. Shared history is confirmed at merge-base `fa4bba47`; `--allow-unrelated-histories` is not needed. The single largest structural risk is the `bin/lib/*.cjs` → `src/*.cts` architecture shift (ADR-457): all hand-written CJS lib files were deleted from upstream's git tree and replaced by TypeScript sources compiled at publish time. This means no three-way merge is possible for the five fork-modified lib files — they must be manually ported to their `src/*.cts` equivalents. Two architectural decisions must be made explicitly before conflict resolution begins: (1) the update-check worker — keep the fork's SHA/GitHub-Commits approach or adopt upstream's semver/npm approach; (2) the `sdk/` directory — upstream deleted it entirely while the fork extended it with `session-runner.ts`, `config.ts`, `model-catalog.ts`.

The most dangerous failure mode throughout is silent vacuous green: fork guard tests that scan `get-shit-done/workflows/` will pass with zero violations after the rename because the directory no longer exists. The c8 coverage glob `'get-shit-done/bin/lib/*.cjs'` will similarly produce vacuous results. Neither of these is a loud failure — the suite stays green while quality enforcement is dead. Every phase must include explicit non-empty corpus checks, not just a green run.

---

## Key Findings

### Merge Mechanics (from STACK.md)

The merge is a standard `git merge` — no exotic strategy required. Shared ancestor `fa4bba47` is confirmed reachable. The rename from `get-shit-done/` to `gsd-core/` occurred in a single upstream commit (`463cffd8`) making git's rename-tracking tractable if the rename limit is raised. Pre-renaming the fork directory before the merge would be the worst possible action — it generates "both sides added" conflicts for every file in the directory.

**Core mechanics:**
- `git merge -s ort 1bb253c9 -X rename-threshold=50 --no-ff` with `diff.renameLimit=5000` — the empirically verified command
- Create `pre-merge-v1.3.1-backup` branch before merging — this is the recovery anchor
- Fetch `refs/tags/v1.3.1` specifically; do NOT `git fetch upstream --tags` (tag namespace is contaminated — upstream `v1.4.x` tags clash with fork's identically-named tags pointing to different commits)
- Resolve in incremental committed batches; never a single mega-commit
- `git merge --abort` + reset to backup branch if anything goes wrong mid-resolution

### Upstream Changes Inventory (from FEATURES.md)

The upstream delta (269 commits, 3,239 file changes) covers five domains:

**Breaking structural changes the fork must accept:**
- `get-shit-done/` → `gsd-core/` directory rename (all ~87 workflows, references, templates, bin)
- `bin/lib/*.cjs` deleted from git — now generated from `src/*.cts` at publish time (ADR-457); fork's CJS edits must be ported to TypeScript
- `sdk/` directory deleted (305 files) — fork extended this; disposition decision required
- Package rename: `get-shit-done-cc` → `@opengsd/gsd-core`; bin: `get-shit-done-redux` → `gsd-core`

**Functional upstream improvements worth landing:**
- `execute-phase.md`: misleading "approved" checkpoint fixed; wave-cleanup anchored to manifest (#630)
- Six writer agents: `Edit` added to `tools:` frontmatter (#582)
- `gsd-verifier.md`: `PHASE_VERIFICATION_INCOMPLETE` made actionable
- `gsd-executor.md`: absolute-path worktree safety added; new `gsd-worktree-path-guard.js` PreToolUse hook
- `gsd-roadmapper.md`: tightened granularity defaults reducing thin-phase fragmentation
- `bin/install.js`: self-healing migration checksum fix (1.3.1 hotfix), Antigravity 2.x support, Windows bash wrapper removal
- New manifest JSON files in `gsd-core/bin/shared/` (config-defaults, model-catalog, runtime-aliases, config-schema)
- New `src/` TypeScript source tree with `roadmap-upgrade.cts`, `installer-migrations/003-rename-get-shit-done-to-gsd-core.cts`, `package-identity.cts`

**Deferred to later milestone (prompt conformance pass):**
- Fixing negative framing, citation artifacts, and step-numbering violations in the 110 upstream-modified prompt files — this is out of scope for v2.3.1-a

### Architecture Blast Radius (from ARCHITECTURE.md)

The rename affects approximately 35 distinct path literal sites in `bin/install.js`, 60+ test `require()` paths, 4 hooks source files, 8+ fork guard tests with hardcoded `SCAN_DIRS` arrays, `package.json` c8 coverage globs, and CI workflow files. The two helpers `tests/helpers.cjs` and `tests/helpers/cli-negative.cjs` are the highest-leverage fix points — updating their `TOOLS_PATH` constant repairs all downstream test require paths without per-file edits.

**Fork-authored files that must be migrated manually (merge will not handle these):**

| File | Fork Content at Risk |
|------|---------------------|
| `bin/install.js` | `ensureHooksDist()`, `{{GSD_REPO}}` at 6 sites, `_gsdLibDir` constant |
| `hooks/gsd-check-update-worker.js` | `isNewer()` SHA comparison, `{{GSD_REPO}}/{{GSD_BRANCH}}` templates |
| `hooks/gsd-check-update.js` | `VERSION` file path pointing to `get-shit-done/VERSION` |
| `hooks/gsd-context-monitor.js` | `gsd-tools.cjs` lookup path |
| `hooks/dist/*` | Must be rebuilt after source edits via `npm run build:hooks` |
| `package.json` | `"name"`, `"bin"`, `"files"`, c8 `--include` globs |
| `tests/helpers.cjs`, `tests/helpers/cli-negative.cjs` | `TOOLS_PATH` |
| ~60 `tests/*.test.cjs` | `require('../get-shit-done/bin/lib/...')` paths |
| 4 fork guard tests | `SCAN_DIRS` arrays — silent vacuous pass if not updated |
| `CATALOGUE.json` | Upstream deleted it; fork must restore |
| `CLAUDE.md` | Upstream deleted it; critical context doc — must restore first |

### Critical Pitfalls (from PITFALLS.md)

1. **Silent vacuous green on fork guard tests** — Four tests (`negative-framing-scan`, `step-numbering-scan`, `no-issue-citations`, `cross-file-step-refs`) will pass with zero violations if their `SCAN_DIRS` still reference `get-shit-done/workflows/` after rename. Add `assert.ok(allFiles.length > 0, 'SCAN_DIR must contain files')` to each scanner immediately.

2. **Silent fork-patch loss in `bin/install.js` and `gsd-check-update-worker.js`** — Upstream's large structural rewrite of both files may silently eliminate: `ensureHooksDist()`, the six `{{GSD_REPO}}/{{GSD_BRANCH}}` replacement blocks, and the SHA-based `isNewer()` logic. Three grep checks required after resolution: `grep "ensureHooksDist" bin/install.js`, `grep -c "GSD_REPO" bin/install.js` (must return ≥6), `grep "isNewer" hooks/gsd-check-update-worker.js`.

3. **Mass deletion of fork-only files** — `CATALOGUE.json`, `CLAUDE.md`, `.planning/` subtree, and the four fork guard test files are absent in upstream's tree. Git will not conflict-mark them; it will silently delete them. Must be explicitly restored via `git show HEAD^2:<path>`.

4. **Tag namespace contamination** — Upstream's `v1.4.x` tags were rejected as "would clobber existing tag" because fork has its own `v1.4.x` tags pointing to different commits. Never use `git fetch upstream --tags`. Fetch only `refs/tags/v1.3.1`.

5. **`bin/lib/*.cjs` → `src/*.cts` — no three-way merge possible** — The five fork-modified CJS lib files (`core.cjs`, `model-catalog.cjs`, `state.cjs`, `init.cjs`, `phase.cjs`) do not exist in upstream's git tree. Fork additions (`parseModelEffort()`, `resolveReasoningEffortInternal()`, `EFFORT_SET`, `*_effort` init fields) must be manually ported to the `src/*.cts` equivalents.

6. **Two architectural decisions must precede conflict resolution:**
   - **Update-check worker:** Fork's SHA/GitHub-Commits approach vs. upstream's semver/npm registry approach. These are architecturally incompatible — a three-way merge produces an internally inconsistent file. Must decide explicitly before touching the file.
   - **`sdk/` disposition:** Upstream deleted `sdk/` (305 files). Fork extended it with `session-runner.ts`, `config.ts`, `model-catalog.ts`, `ws-transport.ts`. Options: (a) keep fork's additions at `src/` alongside upstream's new TS modules, (b) keep at `sdk/` as a fork-only tree, (c) retire them. Decision gates Phase 2.

---

## Implications for Roadmap

Suggested phase structure (four phases, matching the convergence across all four research files):

### Phase 1: Pre-Merge Inventory and Backup

**Rationale:** All four research files agree this phase is prerequisite. Without a fork-edit baseline and explicit fork-only file list, there is no way to audit patch survival after the merge. Recovery anchor must exist before any destructive operation.

**Delivers:**
- `pre-merge-v1.3.1-backup` branch created
- Fork-edit inventory file: `git diff fa4bba47..HEAD -- agents/ commands/gsd/ get-shit-done/workflows/ get-shit-done/references/ bin/install.js hooks/` saved to `/tmp/fork-edit-inventory.txt`
- Explicit lists of: (a) fork-only files upstream never had, (b) upstream-deleted files fork must keep
- Two architectural decisions documented and committed to `.planning/`: update-check worker approach; `sdk/` disposition
- Rename limits set in git config (`diff.renameLimit=5000`, `merge.renameLimit=5000`)

**Avoids:** Pitfall 3 (mass-deletion traps), Pitfall 5 (tag namespace contamination), Pitfall 6 (package.json mismatch)

**Research flag:** Standard patterns — no deeper research needed.

---

### Phase 2: Merge Execution and Conflict Resolution

**Rationale:** The merge itself and the per-bucket conflict resolution. Must be performed in triage order to prevent cascading confusion. Incremental commits after each bucket provide recovery checkpoints.

**Delivers:** Merge commit with all conflicts resolved per the ordered strategy below.

**Conflict resolution strategy (execute in this order):**

| Bucket | Files | Strategy |
|--------|-------|----------|
| A — `.planning/` and `CLAUDE.md` | All `.planning/**`, `CLAUDE.md` | `git checkout --ours` — fork-only, upstream has nothing |
| B — Structural/infrastructure | `package.json`, `package-lock.json`, `eslint.config.mjs`, `.gitignore`, `.github/` | Take upstream as base; manually restore fork-specific values in `package.json` (`description`, extra `scripts`, `gsd-sdk` bin entry if retained) |
| C — Fork-critical files | `bin/install.js`, `hooks/gsd-check-update-worker.js`, `hooks/gsd-check-update.js`, `hooks/gsd-context-monitor.js` | Manual resolve only — accept upstream structural changes, re-apply fork patches; verify with grep checks post-resolution |
| D — Prompt content | `agents/`, `commands/gsd/`, `gsd-core/workflows/` (87 files) | Take upstream as base; preserve fork's positive-framing rewrites where lines overlap; batch 10-20 files per commit |
| E — Test files | `tests/` | Take upstream for modified shared tests; restore fork-only files from fork-side |
| F — New upstream additions | `src/`, `eslint-rules/`, `docs/`, `.changeset/` | Accept wholesale — no fork content to preserve |

**Special resolutions:**
- `package-lock.json`: `git checkout --theirs package-lock.json` then `npm install` to regenerate cleanly
- `sdk/` conflicts (delete/modify): resolve per architectural decision from Phase 1
- `bin/lib/*.cjs` delete/modify conflicts: accept deletion; manual port to `src/*.cts` is Phase 3 work

**Must-verify before Phase 2 complete:**
- `grep "ensureHooksDist" bin/install.js` — non-empty
- `grep -c "GSD_REPO" bin/install.js` — returns ≥6
- `grep "isNewer\|isSemverNewer" hooks/gsd-check-update-worker.js` — consistent with architectural decision
- `ls CATALOGUE.json` — exists (restored)
- `ls CLAUDE.md` — exists (restored)
- `ls .planning/` — populated

**Avoids:** Pitfall 1 (silent patch loss in rename zone), Pitfall 2 (silent patch loss in install.js), Pitfall 8 (.planning/ deletion)

**Research flag:** No deeper research needed — strategy is fully specified. Execution requires attention, not research.

---

### Phase 3: Fork-Patch Restoration and TypeScript Port

**Rationale:** After the merge commit, the fork-critical patches that could not survive a three-way merge must be explicitly restored or ported. This phase addresses the CJS to TS port (ADR-457 impact on fork lib changes) and the four deleted fork guard tests.

**Delivers:**
- Fork lib additions (`parseModelEffort()`, `resolveReasoningEffortInternal()`, `EFFORT_SET`, `*_effort` init fields) ported to `src/core.cts`, `src/model-catalog.cts`, `src/state.cts`, `src/init.cts` as appropriate
- Four fork guard tests restored with `SCAN_DIRS` updated to `gsd-core/` paths AND non-empty corpus assertions added
- `tests/helpers.cjs` and `tests/helpers/cli-negative.cjs` `TOOLS_PATH` updated to `gsd-core/bin/gsd-tools.cjs`
- ~60 test `require()` paths updated from `get-shit-done/bin/lib/` to `gsd-core/bin/lib/`
- `tests/agent-frontmatter.test.cjs` valid-agent list updated for upstream's new/modified agents
- `CATALOGUE.json` updated if needed for new agent entries
- `hooks/dist/` rebuilt via `npm run build:hooks`

**Avoids:** Pitfall 4 (vacuous SCAN_DIRS), Pitfall 7 (fork guard tests absent vs. failing — distinction matters)

**Research flag:** The TypeScript port requires understanding `src/*.cts` module structure. Requires a focused read of `src/core.cts` and `src/model-catalog.cts` to find correct insertion points before editing.

---

### Phase 4: Rename Sweep and Post-Merge Verification

**Rationale:** Final cleanup pass to eliminate any surviving `get-shit-done/` references in fork-owned files, update CI workflows, and run the full verification checklist. This phase confirms the rename is fully adopted and the merge is stable.

**Delivers:**
- `package.json` c8 globs updated: `'get-shit-done/bin/lib/*.cjs'` → `'gsd-core/bin/lib/*.cjs'`
- `.github/workflows/` path triggers, bin names, and package names updated
- `bin/install.js` — any surviving `get-shit-done/` path literals eliminated (except intentional migration-message strings)
- `CLAUDE.md` updated: `## Technology Stack` and `## Architecture` sections reflect `gsd-core/` paths, `src/*.cts` source truth, new package identity
- Runtime smoke test: `node bin/install.js --claude --local --config-dir /tmp/gsd-smoke-test/` completes; `ls /tmp/gsd-smoke-test/gsd-core/` succeeds; `ls /tmp/gsd-smoke-test/get-shit-done/` fails
- `npm test 2>&1 | grep "MODULE_NOT_FOUND"` returns empty
- `npm run test:coverage 2>&1 | grep "Lines"` shows a real non-zero percentage
- Failing tests enumerated and documented as expected conformance-pass backlog

**Verification checklist (gate for phase completion):**
- `ls gsd-core/` — exists and contains `bin/`, `workflows/`, `references/`, `templates/`
- `ls get-shit-done/` — returns "No such file or directory"
- `grep '"name"' package.json` — shows `@opengsd/gsd-core` or fork variant, not `get-shit-done-cc`
- `node -e "require('./gsd-core/bin/gsd-tools.cjs')"` — loads without error
- `npm test 2>&1 | grep -E "^# pass"` — pass count comparable to pre-merge baseline
- `npm run test:coverage 2>&1 | grep Lines` — non-zero percentage
- `npm test 2>&1 | grep "negative-framing"` — scanner runs, corpus non-empty
- `npm test 2>&1 | grep "step-numbering"` — scanner runs, corpus non-empty
- `npm test 2>&1 | grep "ensure-hooks-dist"` — 8 passing

**Avoids:** Pitfall 4 (vacuous c8 coverage), silent rename stragglers

**Research flag:** Standard mechanical work — no research needed.

---

### Phase Ordering Rationale

- Phase 1 before anything: no merge without a recovery anchor and explicit architectural decisions
- Phase 2 before Phase 3: cannot port CJS changes to TypeScript until the merge has landed and the `src/*.cts` files exist in the working tree
- Phase 3 before Phase 4: cannot run a meaningful rename sweep or coverage check until test helpers and guard tests are repaired
- Phase 4 as gate: the verification checklist is the milestone completion signal, not a green test suite

---

### Research Flags

**Phases needing deeper research during execution:**
- **Phase 3 (TS port):** Before editing `src/core.cts` and `src/model-catalog.cts`, read those files to locate correct insertion points for fork-specific additions. The `src/*.cts` structure was new as of ADR-457 and is not documented in the current CLAUDE.md.
- **Phase 2 (update-check worker):** If adopting upstream's semver/npm approach, read `src/semver-compare.cts` and `src/package-identity.cts` post-merge before resolving the worker conflict.

**Phases with standard patterns (skip additional research):**
- **Phase 1:** Entirely git commands and file enumeration — no unknowns
- **Phase 4:** Mechanical grep-and-replace plus the verification checklist — no research needed

---

## Watch Out For

Top failure modes that look like success:

1. **Vacuous SCAN_DIRS** — Fork guard tests pass with 0 violations because `gsd-core/workflows/` scan dir is stale. Always verify `allFiles.length > 0` after building the corpus.

2. **Vacuous c8 coverage** — `npm run test:coverage` reports 0% or vacuously passes when `--include 'get-shit-done/bin/lib/*.cjs'` matches no files. Must update the glob to `gsd-core/bin/lib/*.cjs` before trusting coverage numbers.

3. **Green suite, dead guards** — Red scanner tests post-merge mean the guards are alive and detecting real violations. Green scanner tests may mean the tests were silently deleted or their scan dirs are stale. Prefer red-with-reason over silent green.

4. **`{{GSD_REPO}}` silently overwritten** — Upstream replaces all six `{{GSD_REPO}}` call sites in `install.js` with `'open-gsd/gsd-core'`. If the fork doesn't restore `'thamwangjun/get-shit-done'` (or the chosen fork repo), installed update-checkers will fetch from the wrong repo. `tests/version-detection.test.cjs` will fail — treat this as the intended detection signal, not as a merge error.

5. **Pre-renaming the directory** — If anyone runs `git mv get-shit-done/ gsd-core/` in the fork before executing the merge, every file in the directory becomes an "added by both sides" conflict. This is the worst possible preparation action.

6. **`--allow-unrelated-histories` cargo-cult** — Shared ancestor is confirmed at `fa4bba47`. Adding this flag does nothing useful and may suppress useful conflict detection.

7. **Accepting `--theirs` in bulk** — `git merge -X theirs` or bulk `git checkout --theirs` on prompt files silently destroys all fork positive-framing rewrites across 110 agents, commands, and workflows. Every prompt-content conflict requires per-file judgment.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Merge mechanics (STACK.md) | HIGH | All findings empirically verified with `git` commands against live repo |
| Upstream changes inventory (FEATURES.md) | HIGH | Based on `git diff --name-status fa4bba47 v1.3.1` and targeted `git show` on key files |
| Rename blast radius (ARCHITECTURE.md) | HIGH | Grep-verified at HEAD; all 35 install.js sites and 60+ test paths confirmed present |
| Pitfalls (PITFALLS.md) | HIGH | Grounded in live file inspection of fork patches; MEDIUM on Pitfall 9 (SDK restructure details not exhaustively reviewed) |

**Overall confidence:** HIGH

### Gaps to Address

- **`sdk/` disposition decision:** The research documents the conflict but does not make the call. Must be resolved in Phase 1 before the merge. Options are well-defined; the decision is a product/maintenance judgment call.
- **Update-check worker decision:** The incompatibility is documented, both paths are described, but the decision is not made. Must precede Phase 2 conflict resolution on that file.
- **`src/*.cts` insertion points for fork lib patches:** Phase 3 requires reading the post-merge `src/` files to find where to splice fork additions. This is a Phase 3 task, not pre-merge research.
- **CLAUDE.md post-merge update scope:** The current CLAUDE.md references `get-shit-done/bin/lib/*.cjs` as source of truth, the old package name, and old paths throughout. A targeted update pass is needed in Phase 4 but exact scope depends on what survives the merge.

---

## Sources

### Primary (HIGH confidence — live git commands against repo)
- `git merge-base HEAD 1bb253c9` — confirmed shared ancestor `fa4bba47`
- `git diff --name-status fa4bba47 v1.3.1` — 3,239 file changes enumerated
- `git show --stat 463cffd8` — single-commit directory rename confirmed
- `git -c diff.renameLimit=5000 diff --stat --diff-filter=R -M HEAD 1bb253c9` — 88 renames with raised limit
- `grep` on live `bin/install.js`, `hooks/gsd-check-update-worker.js`, `tests/helpers.cjs` — fork patches confirmed present
- `git ls-tree -r 1bb253c9 --name-only | grep ".planning"` — confirmed upstream has no `.planning/`

### Secondary (MEDIUM confidence — structural inference from diff)
- ADR-457 impact on `bin/lib/*.cjs` deletion: inferred from diff showing deletions and new `src/*.cts` additions; no direct ADR document read
- SDK restructure details (Pitfall 9): noted as MEDIUM confidence in PITFALLS.md — `sdk/` diff not exhaustively reviewed

---
*Research completed: 2026-06-10*
*Ready for roadmap: yes*
