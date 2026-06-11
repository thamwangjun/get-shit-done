# Phase 69: Merge Execution & Ordered Conflict Resolution - Research

**Researched:** 2026-06-11
**Domain:** Git three-way merge (`-s ort`) of upstream `v1.3.1` (`1bb253c9`) into the fork, ordered per-file conflict resolution
**Confidence:** HIGH (conflict set enumerated by a real trial merge that was aborted cleanly)

## Summary

A non-committing trial merge (`git merge --no-commit --no-ff -s ort 1bb253c9`) was run on `dev` and then aborted (`git merge --abort`) with the tree verified clean and HEAD restored to `982420f7`. This produced the **actual** conflict set, not a guess. The merge stops with **311 unmerged paths** across four conflict classes: 207 both-modified content conflicts (`UU`), 84 modify/delete where upstream deleted (`UD`), 6 delete/modify where upstream deleted a fork-modified file (`DU`), and 14 add/add or add-by-one-side (`AA`/`AU`). Beyond the conflicts, the merge brings **513 added-by-them files** (no conflict, new upstream content) and **183 rename detections**.

**The single most important discovery:** upstream `v1.3.1` has **already performed the `get-shit-done/` → `gsd-core/` directory rename** (and folded `sdk/` into `gsd-core/bin/`). This is why the fork's `get-shit-done/bin/lib/*.cjs` appear as `UD` (deleted by them) while a parallel populated `gsd-core/` tree appears as `UU`/added. Phase 69 must NOT adopt that rename (MERGE-02 forbids pre-renaming; Phase 71 owns it). For Phase 69, fork-owned `get-shit-done/` paths that upstream "deleted" via rename are **fork-only files to RESTORE** (`git checkout --ours` / re-add HEAD version), and the incoming `gsd-core/` tree is **new upstream additions** accepted as-is. The directory reconciliation itself is deferred — Phase 69 only lands a clean, committed merge with both trees present, fork patches preserved.

**Primary recommendation:** Resolve in the locked triage order with **per-file commits** (D-03). Accept `sdk/` deletion wholesale (SDK-01 doc already committed at `.planning/milestones/v2.3.1-a-phases/68-.../68-SDK-CAPABILITY.md`). Restore fork-only `get-shit-done/bin/lib/*.cjs`, `CLAUDE.md`, `CATALOGUE.json`, `.planning/` to their HEAD content. Reconcile `package.json` to upstream base + sacred fork fields, then regenerate the lockfile cleanly.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Prompt-content conflicts (`agents/`, `commands/gsd/`, `get-shit-done/workflows/`, `get-shit-done/references/`) are **hand-merged** per-file — integrate upstream functional changes into the fork file. No bulk `-X theirs` (forbidden by MERGE-03).
- **D-02:** Hand-merge depth = integrate upstream changes while preserving all fork patches. Do **NOT** apply the fork's positive-framing/quality-bar conformance during this merge — that is a separate future milestone, not Phase 69/70/71.
- **D-03:** **Per-file commits everywhere** for conflict resolution across all triage tiers. Triage *order* governs the sequence.
- **D-04:** Fork identity fields are **sacred** on `package.json` conflict: `name` (`get-shit-done-cc`), the `bin` map (`get-shit-done-redux`, `gsd-sdk`, `gsd-tools`), `repository.url`, and fork `version`. Take upstream for genuinely new deps/scripts/engines unless they break the fork. Regenerate the lockfile cleanly (`npm install` exits 0, no churn on a second run).
- **D-05:** **Abort-and-restart before commits.** Any resolution mistake caught before a resolution commit lands → `git merge --abort` and restart. `pre-merge-v1.3.1-backup` is the hard recovery anchor.

### Claude's Discretion
- Exact per-file ordering *within* each triage tier (tier order itself is locked by MERGE-03).
- Mechanics of detecting fork-only deletions vs. real conflicts.
- How the lockfile is regenerated (delete + reinstall vs. targeted) so long as the clean-regeneration criterion (D-04 / MERGE-04) holds.

### Deferred Ideas (OUT OF SCOPE)
- Prompt-quality / positive-framing conformance pass for newly-integrated upstream content — future milestone, not 69/70/71.
- Directory rename adoption (`get-shit-done/` → `gsd-core/`) — Phase 71.
- Fork-patch restoration & TypeScript port of `bin/lib` additions — Phase 70.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MERGE-02 | Merge `v1.3.1` via `git merge -s ort`, renameLimit 5000, shared history (no `--allow-unrelated-histories`, no pre-rename) | Trial merge confirmed shared-history `-s ort` runs; `diff.renameLimit`/`merge.renameLimit` both read `5000`; `1bb253c9` reachable. The merge commit's 2nd parent will be `1bb253c9`. |
| MERGE-03 | Resolve all conflicts in triage order, incremental commits, no mega-commit, no bulk `-X theirs` on prompt content | Per-tier conflict table below assigns every one of the 311 conflicts + 513 additions to a tier. Per-file commits (D-03). |
| MERGE-04 | Reconcile `package.json`/`package-lock.json`; regenerate lockfile cleanly | package.json conflict regions enumerated below; upstream renamed to `@opengsd/gsd-core` v1.3.1 — fork sacred fields documented. |
| PATCH-03 | Restore fork-only files upstream deletes: `CLAUDE.md`, `.planning/`, `CATALOGUE.json` | `CLAUDE.md`/`CATALOGUE.json` are absent from upstream tree → auto-kept (no conflict). `.planning/` is fork-only → no conflict. Explicit `ls` verification still required. |
| SDK-02 | Accept upstream `sdk/` deletion, resolving delete/modify in upstream's favor | 293 staged `sdk/` deletions + 62 `UD` modify/delete + 7 renames into `gsd-core/bin/shared/`. SDK-01 doc committed at `68-SDK-CAPABILITY.md`. |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Merge execution & abort/recovery | Git VCS (local) | — | `-s ort`, shared history, backup branch anchor |
| Conflict resolution ordering | Human/agent triage | Git index | Locked tier order; per-file commits |
| Identity preservation | `package.json` reconciliation | lockfile regen | Fork name/bin/repo/version are sacred |
| Fork-only file survival | Working tree restore | Git index | Restore HEAD content of files upstream "deleted" |

## Standard Stack

This is a git-mechanics phase, not a library-install phase. No external packages are added. Core tools:

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| `git merge -s ort` | git ≥2.34 (ort is default) | Three-way shared-history merge | Required by MERGE-02; `ort` is git's default merge strategy and handles rename detection at scale |
| `git rm` / `git checkout --ours` / `git add` | git | Resolve delete/modify conflicts | Accept-deletion vs restore-fork-file mechanics (see below) |
| `npm install` | npm (Node ≥22) | Clean lockfile regeneration | MERGE-04 clean-regen criterion |

No `## Package Legitimacy Audit` needed — phase installs no external packages.

## Conflict Set (THE planner input) — Per-Tier Breakdown

**Totals from trial merge:** 311 unmerged paths (207 `UU` + 84 `UD` + 6 `DU` + 14 `AA`/`AU`) + 513 added-by-them (new, no conflict) + 183 rename detections.

> Per-file commits (D-03) apply to all *resolved conflicts*. New additions (Tier 6) and clean staged deletions (sdk/) can be batched per-group since they carry no conflict markers — but tier ORDER is still honored.

### Tier 1 — `.planning/` + `CLAUDE.md` (resolve OURS)
| File | Conflict class | Action |
|------|---------------|--------|
| `CONTEXT.md` | `UU` | OURS (fork root CONTEXT.md) |
| `CLAUDE.md` | *not in conflict* — absent from upstream tree, present in HEAD | Auto-kept; verify `ls CLAUDE.md` populated (PATCH-03) |
| `.planning/**` | *not in conflict* — fork-only | Preserved; verify `ls .planning/` populated (PATCH-03) |
| `CATALOGUE.json` | *not in conflict* — absent from upstream tree | Auto-kept; verify `ls CATALOGUE.json` populated (PATCH-03) |

**Key:** PATCH-03 targets are *not* delete/modify conflicts because upstream simply never had them. They survive automatically. The requirement is satisfied by an explicit post-merge `ls` presence + non-empty check, not by conflict resolution.

### Tier 2 — Infrastructure
| File | Conflict class | Action |
|------|---------------|--------|
| `bin/install.js` | `UU` | Hand-merge; preserve fork patches (full port is Phase 70 — here just keep fork patches surviving) |
| `package.json` | `UU` | Reconcile (see dedicated section) |
| `package-lock.json` | `UU` | Regenerate clean (see dedicated section) |
| `hooks/gsd-check-update-worker.js` | `UU` | Hand-merge; KEEP fork SHA worker (PATCH-02 — full re-apply is Phase 70) |
| `hooks/gsd-statusline.js` | `UU` | Hand-merge |
| `.gitignore` | `UU` | Hand-merge |
| `.github/workflows/release.yml`, `test.yml`, `pr-target-validator.yml` | `UU` / `AA` | Hand-merge |
| `scripts/run-tests.cjs`, `scripts/changeset/cli.cjs`, `scripts/setup-branch-protection.sh`, `scripts/lint-test-file-count.allowlist.json` | `UU` / `AA` | Hand-merge / accept |
| `rollout-next-phase1.sh`, `rollout-next-phase2.sh` | `AA` | Resolve add/add |

### Tier 3 — Fork-critical files (fork-only files upstream "deleted" via rename → RESTORE)
> Upstream renamed `get-shit-done/` → `gsd-core/`. These `UD` (deleted-by-them) entries are the fork's live `get-shit-done/bin/lib/*` modules. Phase 69 does NOT adopt the rename → restore HEAD versions.

| File | Conflict class | Action |
|------|---------------|--------|
| `get-shit-done/bin/lib/core.cjs` | `UD` | RESTORE (`git checkout --ours` then `git add`) — fork modules stay at `get-shit-done/` until Phase 71 |
| `get-shit-done/bin/lib/init.cjs` | `UD` | RESTORE |
| `get-shit-done/bin/lib/phase.cjs` | `UD` | RESTORE |
| `get-shit-done/bin/lib/model-catalog.cjs` | `UD` | RESTORE |
| `get-shit-done/bin/lib/command-routing-hub.cjs` | `UD` | RESTORE |
| `get-shit-done/bin/lib/state-document.cjs` | `UD` | RESTORE |
| `get-shit-done/bin/lib/configuration.generated.cjs` | `UD` | RESTORE |
| `get-shit-done/bin/lib/project-root.generated.cjs` | `UD` | RESTORE |
| `get-shit-done/bin/lib/state-document.generated.cjs` | `UD` | RESTORE |
| `get-shit-done/bin/lib/workstream-inventory-builder.generated.cjs` | `UD` | RESTORE |
| `scripts/lint-shared-module-handsync.cjs`, `scripts/shared-module-handsync-allowlist.json` | `UD` | RESTORE (fork-owned) |

*(These 10 `get-shit-done/bin/lib/*` files are the headline restore set; the full `get-shit-done/` corpus — workflows, references, templates — appears as `UU` because upstream's `gsd-core/` rename pairs with them. See Tier 4.)*

### Tier 4 — Prompt content (per-file hand-merge, D-01/D-02)
Two parallel trees conflict because of upstream's rename. **For Phase 69, hand-merge the fork's `get-shit-done/` + `agents/` + `commands/gsd/` files (preserve fork patches), and accept the new `gsd-core/` tree as upstream additions (Tier 6).** The directory reconciliation is Phase 71.

| Group | Count | Conflict class | Action |
|-------|-------|---------------|--------|
| `agents/gsd-*.md` (11 files: debugger, debug-session-manager, doc-writer, executor, intel-updater, phase-researcher, plan-checker, planner, research-synthesizer, user-profiler, verifier) | 11 | `UU` | Hand-merge per-file (D-01) |
| `commands/gsd/*.md` | ~67 | `UU` | Hand-merge per-file |
| `get-shit-done/workflows/*.md` | (paired with `gsd-core/workflows/*` UU) | `UU` | Hand-merge fork file; new `gsd-core/workflows/*` are Tier 6 additions |
| `get-shit-done/references/*.md` | `UU` | Hand-merge per-file |
| `get-shit-done/templates/*.md` | `UU` | Hand-merge per-file |
| `gsd-core/workflows/**`, `gsd-core/references/**`, `gsd-core/templates/**`, `gsd-core/bin/**` | ~150 `UU` + `AU` | Accept upstream (new rename target tree) — Tier 6 |
| `docs/**` (USER-GUIDE, CONFIGURATION, adr/, prd/, agents/, zh-CN/, branching) | ~14 `UU`/`AA` | Hand-merge / accept |
| `README*.md` (en, ja-JP, ko-KR, pt-BR, zh-CN) | 5 | `UU` | Hand-merge |
| `CONTRIBUTING.md` | `UU` | Hand-merge |

### Tier 5 — Tests
| Group | Count | Conflict class | Action |
|-------|-------|---------------|--------|
| Content-conflict test files (`plan-review-convergence`, `semver-compare`, `ultraplan-phase`, `windows-test-parity-guard`, `workflow-size-budget`, `workspace`, `worktree-cleanup`, `worktree-safety`, etc.) | ~12 | `UU` | Hand-merge (tests may fail — verification is structural, not green-suite) |
| `tests/*.test.cjs` deleted-by-them (`bug-3751-init-local-agents`, `cjs-sdk-bridge-integration`, `config-schema-sdk-parity`, `configuration-generator`, `gen-staleness-check`, `lint-shared-module-handsync`, `project-root-generator`, `state-document-generator`, `workstream-inventory-builder-generator`) | 9 | `UD` | RESTORE fork test (these test fork-only `bin/lib` modules) — Phase 70 repairs require paths |
| `tests/*.test.cjs` deleted-by-us / upstream kept (`execute-phase-step-5-5-deviation-doc`) | 1 | `DU` | Decide per-file: accept upstream deletion if fork no longer needs it |
| `tests/bug-*.test.cjs` add/add (`bug-170`, `bug-17`, `bug-224`, `bug-33`) | 4 | `AA` | Resolve add/add |

### Tier 6 — New upstream additions (no conflict — 513 files)
Accept as-is. Includes the entire incoming `gsd-core/` rename tree, new `docs/`, new `tests/bug-*`, new `sdk/`-derived `gsd-core/bin/shared/*.json` (via rename), changeset infra. Batch-stage acceptable (no markers); honor tier order (last).

### Separate: `sdk/` deletion to ACCEPT (SDK-02)
- **293** staged clean deletions (`D `) + **62** `UD` modify/delete + **7** renames (`sdk/shared/*.json` → `gsd-core/bin/shared/*.json`).
- **Action:** Accept all deletions (`git rm` the `UD` paths; the clean `D ` deletions are already staged). After merge: `ls sdk/` must return "No such file or directory".
- SDK-01 documentation already committed: `.planning/milestones/v2.3.1-a-phases/68-pre-merge-inventory-backup-sdk-capture/68-SDK-CAPABILITY.md` — restoration-grade record consulted before accepting deletion. Dependency satisfied.

## package.json / package-lock.json Reconciliation (MERGE-04 / D-04)

**Upstream `1bb253c9` package.json:**
- `"name": "@opengsd/gsd-core"`, `"version": "1.3.1"`
- `"bin": { "gsd-core": "bin/install.js", "gsd-tools": "gsd-core/bin/gsd-tools.cjs" }`
- `"repository.url": "git+https://github.com/open-gsd/gsd-core.git"`, homepage/bugs point at `open-gsd/gsd-core`
- `test:coverage` c8 `--include 'gsd-core/bin/lib/*.cjs'`

**Fork-sacred fields to PRESERVE (D-04) — these win on conflict:**
| Field | Fork value (keep) |
|-------|-------------------|
| `name` | `get-shit-done-cc` |
| `bin` map | `get-shit-done-redux` → `bin/install.js`; `gsd-sdk` → `bin/gsd-sdk.js`; `gsd-tools` → `bin/gsd-sdk.js` |
| `repository.url` | fork URL (current fork value, NOT `open-gsd/gsd-core`) |
| `version` | fork version (NOT `1.3.1`) |

**Reconcile to:** upstream base + the four sacred fork values above. Take upstream's genuinely new dependencies / scripts / engines **unless they break the fork**. NOTE: upstream's c8 `--include 'gsd-core/bin/lib/*.cjs'` and bin path `gsd-core/bin/...` point at the renamed dir — the fork's tools still live at `get-shit-done/bin/` for Phase 69. Keep fork's bin map values (sacred); coverage glob/path repointing is **Phase 71**, not 69. Do not pre-rename to satisfy upstream's paths.

**Lockfile regeneration (clean-regen criterion):**
1. Resolve `package.json` first and commit (per-file, Tier 2).
2. Delete `package-lock.json` (or take one side), run `npm install` → must exit 0.
3. Run `npm install` a **second** time → zero lockfile churn (no diff). This is the MERGE-04 acceptance test.
4. Note `sdk/package.json` + `sdk/package-lock.json` are `UD` (upstream deleted sdk/) → accept deletion; no workspace lockfile to reconcile for the deleted SDK.

## Merge Mechanics — delete/modify resolution (the load-bearing detail)

| Situation | git status code | Meaning | Resolution command |
|-----------|----------------|---------|---------------------|
| Upstream deleted, fork modified, fork file should STAY | `UD` | "deleted by them" | `git checkout --ours <file>` then `git add <file>` (restores HEAD version) — used for `get-shit-done/bin/lib/*`, fork-only tests |
| Upstream deleted, fork modified, ACCEPT deletion | `UD` | "deleted by them" | `git rm <file>` — used for all `sdk/**` `UD` paths |
| Fork deleted, upstream modified | `DU` | "deleted by us" | per-file: `git rm` (keep deletion) or `git checkout --theirs` + `git add` (take upstream) |
| Both added | `AA` | "both added" | hand-merge markers, `git add` |
| Both modified | `UU` | content conflict | hand-merge markers, `git add` |

## Common Pitfalls

### Pitfall 1: Accidentally adopting the `get-shit-done/`→`gsd-core/` rename
**What goes wrong:** Upstream already renamed the dir. Auto-resolving `UD` on `get-shit-done/bin/lib/*` by taking "theirs" silently deletes the fork's live modules; accepting the incoming `gsd-core/` tree as the *only* tree pre-adopts the Phase 71 rename and violates MERGE-02.
**How to avoid:** RESTORE fork `get-shit-done/` files (`--ours`); accept `gsd-core/` as additive. Both trees coexist after Phase 69. `ls get-shit-done/bin/lib/core.cjs` must still succeed post-merge.
**Warning sign:** `get-shit-done/bin/lib/` empty or missing after resolution.

### Pitfall 2: Treating PATCH-03 files as conflicts
**What goes wrong:** Searching for a delete/modify conflict on `CLAUDE.md`/`CATALOGUE.json` and finding none → assuming the requirement is unmet.
**How to avoid:** They're absent from upstream entirely, so they auto-survive. Verify via `ls` + non-empty content check, not conflict resolution.

### Pitfall 3: Lockfile churn on second `npm install`
**What goes wrong:** Resolving the lockfile by hand-merging markers leaves it inconsistent with `package.json`; `npm install` rewrites it, failing the no-churn criterion.
**How to avoid:** Regenerate from scratch after `package.json` is finalized; verify idempotent second run.

### Pitfall 4: Mega-commit / bulk `-X theirs`
**What goes wrong:** Resolving everything then one `git commit` violates MERGE-03; `-X theirs` on prompt content violates D-01.
**How to avoid:** Per-file commits in tier order (D-03). Never pass `-X theirs`.

### Pitfall 5: Expecting a green test suite
**What goes wrong:** Treating failing tests as a blocker. Verification is structural/grep-based (VERIFY-02). Tests referencing renamed paths WILL fail — that's deferred backlog for Phase 70/71.
**How to avoid:** Gate on `git status` (no markers), `ls` presence checks, merge-parent check — never "npm test green".

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Conflict enumeration | manual file listing | `git diff --name-only --diff-filter=U`, `git status --porcelain=v1` codes | Authoritative, scriptable |
| Restore-vs-accept on delete/modify | manual file copy | `git checkout --ours/--theirs` + `git add` / `git rm` | Index-correct, preserves merge state |
| Lockfile regen | hand-editing JSON | `npm install` ×2 | Only way to satisfy clean-regen criterion |

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — pure git merge, no datastore | None |
| Live service config | None | None |
| OS-registered state | None | None |
| Secrets/env vars | None changed by merge | None |
| Build artifacts | `hooks/dist/` becomes stale after merge (Phase 70 rebuilds via `npm run build:hooks`) | Deferred to Phase 70 |
| Git recovery anchor | `pre-merge-v1.3.1-backup` branch present (verified) | Hard rollback for D-05 |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| git (ort strategy) | MERGE-02 | ✓ | renameLimit 5000 set | — |
| upstream remote | merge source | ✓ | `1bb253c9` reachable | — |
| npm / Node ≥22 | lockfile regen (MERGE-04) | ✓ (per CLAUDE.md stack) | — | — |
| `pre-merge-v1.3.1-backup` | D-05 recovery | ✓ | branch exists | — |

**Missing dependencies with no fallback:** None.

## Validation Architecture

> Phase verification is **structural/grep-based, never green-suite** (VERIFY-02). Test framework exists (Node `--test`) but is NOT a Phase 69 gate.

### Phase Gate (structural checks, not test pass/fail)
| Check | Command | Pass Condition |
|-------|---------|----------------|
| Shared-history merge landed | `git log --merges -1 --format=%P` | 2nd parent == `1bb253c9` |
| No unresolved markers | `git status --porcelain` | no `UU`/`UD`/`DU`/`AA` codes |
| Incremental commits | `git log` over merge range | >1 resolution commit, no mega-commit |
| Fork-only files restored | `ls CLAUDE.md CATALOGUE.json .planning/` | all present, non-empty |
| sdk/ deletion accepted | `ls sdk/` | "No such file or directory" |
| Lockfile clean | `npm install` ×2 | exit 0, no churn on 2nd run |

### Wave 0 Gaps
- None — no new test infrastructure. Failing tests are expected deferred backlog (Phase 70/71).

## Security Domain

Not applicable in the threat-modeling sense — no auth/crypto/input-validation surface introduced. One supply-chain note: the merge brings 513 new upstream files + new changeset/CI infra; treat upstream additions as trusted (same shared-history project) but the lockfile regen should be reviewed for unexpected new transitive deps before commit.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Fork `repository.url` and `version` current values are the canonical fork values to preserve (planner/executor should read live `package.json` HEAD at merge time) | package.json reconciliation | Low — read HEAD values directly during resolution |
| A2 | `execute-phase-step-5-5-deviation-doc.test.cjs` (`DU`) — fork wants to keep deletion vs take upstream is a per-file judgment | Tier 5 | Low — single file, decide during resolution |

## Open Questions

1. **Exact count of `commands/gsd/*.md` UU conflicts (~67) vs which are pure-fork-only.**
   - What we know: 67 `commands/gsd/*.md` show `UU`.
   - What's unclear: a few may be fork-only additions with no upstream counterpart (would be `AU` not `UU`); the trial showed all as `UU`, so all have an upstream side.
   - Recommendation: planner produces one per-file commit plan per `UU` file; group the ~150 additive `gsd-core/**` files into a single Tier-6 acceptance step.

## Sources

### Primary (HIGH confidence)
- Trial merge on `dev` (`git merge --no-commit --no-ff -s ort 1bb253c9`, aborted clean) — full conflict set, status codes, counts
- `git show 1bb253c9:package.json` — upstream identity/bin/scripts
- `.planning/REQUIREMENTS.md` (MERGE-02/03/04, PATCH-03, SDK-02), `.planning/ROADMAP.md` Phase 69, `69-CONTEXT.md`
- `git ls-files` — confirmed `68-SDK-CAPABILITY.md` committed (SDK-01 satisfied)

## Metadata

**Confidence breakdown:**
- Conflict set & counts: HIGH — enumerated by real trial merge
- package.json reconciliation: HIGH — upstream values read directly; fork sacred fields from D-04
- Rename/landmine analysis: HIGH — 183 renames identified, no submodules, no binaries
- Per-tier assignment: MEDIUM-HIGH — tier boundaries are clear; exact within-tier ordering is discretion

**Research date:** 2026-06-11
**Valid until:** Until upstream `1bb253c9` or fork HEAD changes (re-run trial merge if either moves)

## RESEARCH COMPLETE

**Phase:** 69 - Merge Execution & Ordered Conflict Resolution
**Confidence:** HIGH

### Key Findings
- Trial merge enumerated **311 conflicts** (207 `UU` + 84 `UD` + 6 `DU` + 14 `AA`/`AU`) + **513 added-by-them** files + **183 renames**; aborted cleanly, HEAD restored to `982420f7`.
- **Upstream v1.3.1 already did the `get-shit-done/`→`gsd-core/` rename** — Phase 69 must RESTORE fork `get-shit-done/` files and accept `gsd-core/` as additive WITHOUT adopting the rename (Phase 71 owns it).
- `sdk/` fully deleted upstream (293 `D` + 62 `UD` + 7 renames) — ACCEPT; SDK-01 doc already committed at `68-SDK-CAPABILITY.md`.
- `CLAUDE.md`/`CATALOGUE.json`/`.planning/` are NOT conflicts — absent from upstream, auto-survive; PATCH-03 satisfied by `ls` presence checks.
- `package.json` reconciles to upstream `@opengsd/gsd-core` v1.3.1 base + 4 sacred fork fields (name/bin/repo/version); lockfile regen via `npm install` ×2 (no-churn gate).

### File Created
`.planning/phases/69-merge-execution-ordered-conflict-resolution/69-RESEARCH.md`

### Ready for Planning
Per-tier conflict table provides the planner a direct mapping for per-file commit plans (D-03) in locked triage order.
