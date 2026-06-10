# Pitfalls: Upstream v1.3.1 Merge & Rename Adoption

**Domain:** Upstream merge — fork of `open-gsd/gsd-core` v1.3.1 into `thamwangjun/get-shit-done`
**Milestone:** v2.3.1-a
**Researched:** 2026-06-10
**Evidence base:** git diff HEAD..refs/tags/v1.3.1 (confirmed 3,239 files: 1,473 D, 903 A, 660 M, ~130 renames); PROJECT.md; MILESTONES.md; live inspect of fork patches.

---

## Critical Pitfalls

### Pitfall 1: Rename-vs-Content Collision — `get-shit-done/` Renamed to `gsd-core/` with Content Changes

**What goes wrong:** Git's rename detection fires for any file above the similarity threshold (~60–100%). Of the 130 rename records, many are not R100 — they are R082–R099, meaning the file was both renamed AND content-modified between merge-base and upstream tip. If git's auto-merge combines the rename detection with three-way content merge, the result is a renamed file with an auto-merged body. The risk: the fork may have applied prompt-quality edits to `get-shit-done/references/*.md` or `get-shit-done/workflows/*.md`, and git will not present a conflict if neither branch's modification overlaps the fork's line changes — it silently picks upstream content.

**Concrete files at risk:** All R08x–R09x renames (R082 `few-shot-examples/verifier.md`, R085 `gsd-tools.cjs`, R089 `few-shot-examples/plan-checker.md`, R093 `git-integration.md`, R095 `model-profile-resolution.md`, R097 `autonomous-smart-discuss.md`, R097 `checkpoints.md`, R099 `artifact-types.md`). Also the 110 modified agents/commands/workflows: git diff shows 110 M-flagged prompt files. Any file the fork edited for positive-framing or step-numbering that upstream also modified in a non-overlapping region will auto-merge silently.

**Warning signs:**
- After merge, running `npm test` shows the negative-framing-scan passing with no violations — but this is because the test was deleted by upstream (see Pitfall 7). Do not use test-green as proof of patch survival.
- `git log --all --follow -- agents/gsd-executor.md` shows two divergent authors making changes to the same file.
- Spot-checking a known fork edit (e.g., the affirmative-rewrite lines in any agent file touched in v1.38.6 or v1.37.1) and finding upstream phrasing restored.

**Prevention strategy:**
1. Before merging, generate a fork-edit inventory: `git diff fa4bba47..HEAD -- agents/ commands/gsd/ get-shit-done/workflows/ get-shit-done/references/` captures every fork-side content change since merge-base. Export to a file. This is the ground truth of what must survive.
2. After merge resolves, diff each file in the inventory against the post-merge tree and verify fork phrases are present.
3. For the rename zone specifically: after `git merge`, for each file that was renamed (R08x–R09x), run `git show HEAD:<new-gsd-core-path>` and compare against the pre-merge fork content.

**Owning phase:** Phase 1 (pre-merge inventory) + Phase 2 (post-resolve audit).

---

### Pitfall 2: Silent Fork-Patch Loss in `bin/install.js` and `hooks/gsd-check-update-worker.js`

**What goes wrong:** Both files are confirmed M (modified) in the upstream diff. `bin/install.js` has structural changes: `get-shit-done/` → `gsd-core/` path literals throughout (dozen+ require() calls), removal of the SHA-based `gsd-version` computation block (replaced by lazy effort catalog loading), removal of `resolveReasoningEffortInternal` import, removal of `translateEffortForCodex` import, and addition of `EFFORT_SET`. The fork's patches are: (a) the `ensureHooksDist` helper; (b) the `{{GSD_REPO}}`/`{{GSD_BRANCH}}` template replacement wired at 6 call sites (lines 8066–9237); (c) SHA-based version computation via `git rev-parse --short=7 HEAD`.

The upstream diff **removes** the SHA-based version block from `install.js` entirely (the `-` lines in the diff above show `gsdVersion = _execFileSync('git', ['rev-parse', ...])`  deleted). If the auto-merge takes the upstream deletion and the fork's addition is in a non-adjacent region, git may accept the deletion silently.

`gsd-check-update-worker.js` is even higher risk: upstream rewrote the file completely, replacing the SHA-based `isNewer()` function (the fork's core patch from v2.1.0-a) with `isSemverNewer()` from a new `semver-compare.cjs` lib. The entire `isNewer` / `writeResult` / SHA comparison logic is gone in upstream's version.

**Warning signs:**
- Post-merge: `command grep -i isNewer hooks/gsd-check-update-worker.js` returns nothing (as noted in PROJECT.md tech debt, this is the current verification command).
- Post-merge: `command grep -n "GSD_REPO\|GSD_BRANCH" bin/install.js` returns fewer than 6 occurrences.
- Post-merge: `command grep "ensureHooksDist" bin/install.js` returns nothing.
- Post-merge: `command grep "rev-parse" bin/install.js` returns nothing (the SHA block was deleted upstream; this absence is expected and correct — but confirm `ensureHooksDist` is still wired).

**Prevention strategy:**
1. Treat both files as manual-resolve-required regardless of whether git presents a conflict marker. After the merge completes, immediately run the three grep checks above.
2. For `install.js`: the upstream refactor is substantial. Accept the upstream structural changes (path renames, effort catalog lazy-load, removal of SHA version block) but manually re-apply: (a) `ensureHooksDist` helper and its call site, (b) the 6 `{{GSD_REPO}}`/`{{GSD_BRANCH}}` replacement blocks. The SHA version block is legitimately removed upstream — do not re-add it blindly; confirm whether the fork's version detection still works under the new upstream model.
3. For `gsd-check-update-worker.js`: the upstream rewrite adopts semver (`isSemverNewer`) from a new shared lib. Fork's `isNewer` SHA approach is now incompatible with this design. Decision needed: adopt upstream semver model (requires accepting new `semver-compare.cjs` dependency) or preserve SHA approach in a compatibility shim. Either way, the decision must be explicit — silent auto-merge will produce whichever side "wins" three-way merge and may be internally inconsistent.

**Owning phase:** Phase 2 (conflict resolution) — these files must be manually validated before the phase is marked complete.

---

### Pitfall 3: Mass-Deletion Traps — 1,473 Deletions, Fork-Authored Files Among Them

**What goes wrong:** The upstream diff shows 621 non-planning deleted files. Among them are confirmed fork-authored files:
- `tests/negative-framing-scan.test.cjs` — fork guard, 99/99 corpus tests
- `tests/step-numbering-scan.test.cjs` — fork guard, 632/632 corpus tests
- `tests/no-issue-citations.test.cjs` — fork guard, built in v2.1.0-g
- `tests/cross-file-step-refs.test.cjs` — fork guard, 219/219 corpus tests
- `tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs` — fork regression guard
- `CATALOGUE.json` — fork-maintained agent catalogue (250→270 entries)
- `get-shit-done/bin/check-latest-version.cjs` — used by the fork's check-update worker

Additionally, 82 `get-shit-done/bin/lib/*.cjs` files are D-flagged because upstream renamed the directory to `gsd-core/bin/lib/`. Only 2 of those appear as new A entries under `gsd-core/bin/lib/` in the diff summary — git is folding most of them into the R (rename) bucket. If the rename detection fails for any file (similarity below git's rename threshold), those will appear as D+A pairs and the content will be the upstream version, not the fork version.

**Warning signs:**
- After merge, `ls tests/ | wc -l` is dramatically smaller than pre-merge — many upstream-deleted test files will be gone.
- `git status` after merge shows a clean tree but `ls tests/negative-framing-scan.test.cjs` returns file-not-found.
- `CATALOGUE.json` is absent from the root.

**Prevention strategy:**
1. Build two file lists before merging: (a) fork-only files (files the fork added that upstream never had), (b) files deleted by upstream that the fork must keep. These are distinct buckets.
2. Fork-guard tests (`negative-framing-scan`, `step-numbering-scan`, `no-issue-citations`, `cross-file-step-refs`) must be explicitly re-added after the merge resolves if git's three-way merge deleted them. These are not in the upstream tree and git will not conflict-mark them — it will silently delete them.
3. `CATALOGUE.json`: upstream deleted this file. If the fork needs to maintain it, it must be restored from the fork branch post-merge and treated as a fork-only artifact.
4. For `get-shit-done/bin/lib/*.cjs` → `gsd-core/bin/lib/*.cjs` renames: run `git diff --diff-filter=D --name-only fa4bba47 HEAD -- get-shit-done/bin/lib/` to find any fork modifications to lib files, then confirm the renamed `gsd-core/bin/lib/` counterparts carry those changes.

**Owning phase:** Phase 1 (pre-merge inventory: classify add/delete/modify buckets) + Phase 3 (post-merge restore of fork-only files).

---

### Pitfall 4: Add/Add and Delete/Modify Conflicts at Scale — Triage Order and Batching

**What goes wrong:** At 3,239 changed files, the resolver will encounter dozens of simultaneous conflict types:
- **Add/add** (both sides added a file at the same path): unlikely at this scale since upstream changed package structure entirely, but possible in `tests/`, `scripts/`, `.github/`.
- **Delete/modify** (one side deleted, other side modified): the fork may have modified a file that upstream deleted. Git presents this as a conflict requiring explicit resolution ("deleted by us" / "deleted by them" markers in `git status`).
- **Rename/modify**: files the fork modified that upstream renamed — git may or may not track these as renames.

With 660 M-flagged files, running `git merge` will produce a large number of conflict markers simultaneously. If the resolver works file-by-file without a plan, they will lose track of which conflicts have been resolved and which have been deferred.

**Warning signs:**
- `git status | command grep "^UU\|^AA\|^DU\|^UD" | wc -l` returns a large number after the merge command.
- Resolver starts accepting `--ours` or `--theirs` in bulk to reduce conflict count, without auditing what "ours" and "theirs" actually contains.

**Prevention strategy (triage order):**
1. **Bucket 1 — Infrastructure files** (resolve first, lowest risk of fork-content loss): `.github/`, `package.json`, `package-lock.json`, `sdk/`, `scripts/`. Accept upstream wholesale except for fork-specific values in `package.json` (name, bin, files array — see Pitfall 6).
2. **Bucket 2 — Fork-critical files** (manual resolve, highest risk): `bin/install.js`, `hooks/gsd-check-update-worker.js`, `hooks/gsd-check-update.js`. Block on these — do not proceed to Bucket 3 until each is verified.
3. **Bucket 3 — Fork-guard tests** (restore, not merge): `tests/negative-framing-scan.test.cjs`, `tests/step-numbering-scan.test.cjs`, `tests/no-issue-citations.test.cjs`, `tests/cross-file-step-refs.test.cjs`. These will be absent from the upstream tree — restore from `git show HEAD^2:<path>` (fork side) after the merge resolves.
4. **Bucket 4 — Prompt content files** (accept upstream, flag for post-merge QA pass): all `agents/`, `commands/gsd/`, `get-shit-done/workflows/` (renamed to `gsd-core/workflows/`). Accept upstream content for the merge; the post-merge prompt-quality conformance pass is explicitly deferred out of this milestone's scope.
5. **Bucket 5 — Deleted .planning/ files**: upstream deleted the entire `.planning/` directory subtree. This is fork-only content. Use `-s ours` strategy or manual restore for all `.planning/` paths.

Use `git rerere` if available to record conflict resolutions and avoid repeating them if the merge is restarted.

**Owning phase:** Phase 2 (conflict resolution) — one plan per bucket to prevent cross-bucket context loss.

---

### Pitfall 5: Unrelated/Rewritten History and Tag Namespace Collision

**What goes wrong:** Upstream's identity changed from `thamwangjun/get-shit-done` (~v1.41.x) to `open-gsd/gsd-core` (v1.x.x). This means upstream's `v1.x.x` tags are on a different version number line than the fork's `v1.x.x` tags. The git fetch already revealed this: tags `v1.4.0`, `v1.4.1`, `v1.4.2`, `v1.4.3` from upstream were rejected as "would clobber existing tag." This means those upstream tags point to different commits than the fork's identically-named tags. The merge-base `fa4bba47` is confirmed reachable from both HEAD and `refs/tags/v1.3.1`, so the history is not fully unrelated — but tags beyond v1.3.1 are unreliable as a version reference system.

The specific risk: if a CI workflow or a `package.json` script references a tag like `v1.4.0` as a version anchor, it will resolve to the fork's v1.4.0 (a different commit) rather than upstream's v1.4.0, producing incorrect behavior silently.

**Warning signs:**
- `git tag --list "v1.4*"` shows local tags that do NOT match upstream's `v1.4.x` hotfix commits.
- CI workflow files reference tag-based version pinning.
- `package.json` `version` field conflicts: fork is `1.1.0`, upstream is `1.3.1` — after merge, this field will conflict and whichever side wins will set the installed package's identity.

**Prevention strategy:**
1. Do not use `git fetch upstream --tags` during or after the merge — the tag namespace is contaminated. Fetch only the specific ref: `git fetch upstream refs/tags/v1.3.1:refs/tags/upstream-v1.3.1` to avoid clobbering.
2. After merge, audit `package.json` version field. The fork's `1.1.0` is a fork-specific version track. Decide: adopt `1.3.1` to align with upstream (changes npm publish identity) or keep fork version. This is a deliberate decision, not a conflict to auto-resolve.
3. The `.github/workflows/release.yml` and `hotfix.yml` almost certainly reference the package name `@opengsd/gsd-core` after upstream's changes. These workflows should be accepted from upstream wholesale but reviewed for any hard-coded repo paths (`open-gsd/gsd-core`) that conflict with the fork's publish destination.

**Owning phase:** Phase 1 (pre-merge: fetch without --tags, verify merge-base) + Phase 2 (package.json version decision).

---

### Pitfall 6: CI Workflows and package.json / Lockfile Conflicts

**What goes wrong:** The package rename is pervasive:
- `"name": "get-shit-done-cc"` (fork) → `"@opengsd/gsd-core"` (upstream)
- `"bin": { "get-shit-done-redux": "bin/install.js", "gsd-sdk": "bin/gsd-sdk.js" }` (fork) → `"bin": { "gsd-core": "bin/install.js", "gsd-tools": "gsd-core/bin/gsd-tools.cjs" }` (upstream)
- `"files"` array: fork includes `"get-shit-done"`, `"sdk/src"`, `"sdk/shared"`, `"sdk/prompts"`, `"sdk/dist"`, `"sdk/package.json"`... upstream uses `"gsd-core"`, `"assets"` (no SDK dist entries)
- `bin/install.js` contains `GSD_CODEX_MARKER` and `GSD_COPILOT_INSTRUCTIONS_MARKER` strings with `"get-shit-done installer"` → `"gsd-core installer"` (confirmed in the diff above)

The `package-lock.json` will have an irreconcilable conflict because it encodes the package name and entire dependency graph. A three-way merge of the lockfile will produce garbage.

**Warning signs:**
- `npm install` fails after merge with "integrity check failed" or "package name mismatch."
- `npm run build:hooks` fails because `package.json` bin entries no longer match the file paths that exist.
- The `"files"` array still references `"get-shit-done"` after rename adoption, causing npm pack to miss the `gsd-core/` directory.

**Prevention strategy:**
1. Accept the lockfile conflict by taking the upstream version wholesale (`git checkout --theirs package-lock.json`) then running `npm install` to regenerate it cleanly after all path renames are adopted.
2. For `package.json`: manually resolve the conflict. Fields to take from upstream: `name`, `bin`, `files`, `version` (decision per Pitfall 5). Fields to verify fork-specifically: `description` (fork has different description), `scripts` (fork may have extra scripts like `build:hooks`).
3. The `GSD_CODEX_MARKER` / `GSD_COPILOT_INSTRUCTIONS_MARKER` string changes in `install.js` are cosmetic for the rename adoption — accept them unless the fork has a strong reason to keep the old installer identity string.
4. After adopting the rename, run `command grep -r "get-shit-done" bin/ gsd-core/ scripts/ --include="*.cjs" --include="*.js" | command grep -v "node_modules"` to find any surviving old path references.

**Owning phase:** Phase 2 (conflict resolution — `package.json` decision) + Phase 4 (rename adoption sweep: verify no `get-shit-done/` path references survive).

---

## Moderate Pitfalls

### Pitfall 7: Fork Guard Tests Will Go Red Post-Merge — Do Not Mistake for Merge Errors

**What goes wrong:** The four fork guard tests (`negative-framing-scan.test.cjs`, `step-numbering-scan.test.cjs`, `no-issue-citations.test.cjs`, `cross-file-step-refs.test.cjs`) are deleted in the upstream tree. If they are correctly restored post-merge (Pitfall 3), they will fail against the merged corpus because:
- Upstream prompt files will contain negative framing (`do not`, `never`, `avoid`) in the 110 modified prompt files — the scanner will find violations.
- Upstream files may have decimal step numbers or citation patterns — the step-numbering and citation guards will fire.
- The `agent-frontmatter.test.cjs` valid-agent list will be out of sync with new/renamed agents upstream added.

These failures are **expected and correct** — the post-merge prompt-quality conformance pass is out of scope for this milestone (confirmed in PROJECT.md). Failing guard tests must not trigger reverting the merge or re-resolving conflicts.

**Warning signs (of incorrect action, not of the failure):**
- Executor reverts a conflict resolution because `npm test` shows a red scanner test.
- Executor modifies 100+ upstream prompt files to pass the framing scanner before the merge is committed.

**Prevention strategy:**
1. In the milestone kickoff, explicitly list the expected-failing tests by name. Commit the merged tree with those tests failing — they are a backlog for the next milestone.
2. The `agent-frontmatter.test.cjs` valid-agent list will need updating for new agents upstream added. This is a one-time fix (update the allowlist array), not a content rewrite — it is low risk and can be done in this milestone.
3. Do not run `npm test` as a merge-completion gate. Run it as an inventory tool: `npm test 2>&1 | command grep "^not ok" > /tmp/merge-failing-tests.txt` to enumerate what needs the conformance pass.

**Owning phase:** Phase 4 (post-merge verification — enumerate failures, confirm they are all in the expected categories, commit).

---

### Pitfall 8: `.planning/` Directory Deleted by Upstream — Needs Explicit Protection

**What goes wrong:** The upstream tree has no `.planning/` directory (it is fork-only). Git's three-way merge will not delete `.planning/` if the fork is "ours" — but the merge strategy matters. If `git merge -X theirs` is used to batch-resolve conflicts, it will delete fork-only files that upstream never had and has now "deleted" relative to some ancestor. The `.planning/` subtree is the largest single block of fork-only files (~1,000+ planning artifacts).

**Warning signs:**
- `ls .planning/` returns nothing after merge.
- `git status` after merge shows hundreds of `.planning/` paths as "deleted by them."

**Prevention strategy:**
1. Use `git merge` without `-X ours` or `-X theirs` flags. Resolve the `.planning/` mass-deletion conflict explicitly: `git checkout --ours .planning/` to restore all fork-only planning files.
2. Add `.planning/` to a `.gitattributes` merge driver (`merge=ours`) before running the merge, or handle it as the first manual resolution step.
3. Same applies to fork-only directories: `docs/` fork additions (not upstream docs), `.planning/references/`.

**Owning phase:** Phase 2 (conflict resolution — first resolution step before any other file).

---

### Pitfall 9: `sdk/` Structural Changes — SDK Directory May Have Moved or Been Restructured

**What goes wrong:** The `sdk/shared/` directory shows changes in the diff (config-defaults.manifest.json moved to `gsd-core/bin/shared/`, runtime-aliases.manifest.json moved). Fork's `package.json` includes `sdk/src`, `sdk/shared`, `sdk/prompts`, `sdk/dist` in the `files` array. If the SDK was restructured by upstream, the fork's Eta wiring in `runtime-artifact-layout.cjs` (Phase 47.1 insert at line 198–201) may reference a path that no longer exists.

**Warning signs:**
- `npm run build:hooks` fails with a missing module.
- The install smoke test (`tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs` if restored) fails.
- `require('../get-shit-done/bin/lib/...')` references survive in any file that wasn't updated to `gsd-core`.

**Prevention strategy:**
1. After merge, run `node -e "require('./bin/install.js')"` (without actually installing) — if the module load fails at require time, it surfaces broken path references immediately.
2. Audit `sdk/` structure changes: `git diff --name-status HEAD..refs/tags/v1.3.1 -- sdk/` to get the full picture. The fork's SDK integration points are `sdk/src/config.ts`, `sdk/src/model-catalog.ts`, and `sdk/src/session-runner.ts` — verify these survive.

**Owning phase:** Phase 4 (post-merge verification).

---

## Minor Pitfalls

### Pitfall 10: `CATALOGUE.json` Deleted Upstream — Fork Maintenance Responsibility

The fork maintains `CATALOGUE.json` (250→270 entries across milestones). Upstream deleted it. The merge will not conflict-mark it — git will simply delete it from the working tree. Must be explicitly restored from the fork-side. Verify after merge with `ls CATALOGUE.json`.

**Prevention:** Bucket 3 in triage (Pitfall 4) — restore from `git show HEAD^2:CATALOGUE.json` after merge.

**Owning phase:** Phase 3 (post-resolve restore of fork-only files).

---

### Pitfall 11: `CLAUDE.md` Deleted by Upstream — Fork's CLAUDE.md Must Survive

Upstream deleted `CLAUDE.md` (confirmed D in the diff). The fork's `CLAUDE.md` contains project-critical guidance including technology stack, testing conventions, architecture, and developer profile constraints. It is the primary context document for every agent spawn.

**Prevention:** Explicitly restore `CLAUDE.md` after merge from `git show HEAD^2:CLAUDE.md`. This is not optional — without CLAUDE.md, all subsequent GSD workflows will run without project context.

**Owning phase:** Phase 3 (post-resolve restore — high priority).

---

### Pitfall 12: Lockfile Version 3 vs Upstream Lockfile Format

Fork uses `lockfileVersion: 3` (confirmed in CLAUDE.md). If upstream uses a different lockfileVersion, the merge conflict in `package-lock.json` produces an unresolvable three-way diff. Accept upstream wholesale and regenerate.

**Prevention:** `git checkout --theirs package-lock.json && npm install` immediately after merge.

**Owning phase:** Phase 2 (conflict resolution).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Pre-merge inventory | Missing fork-edit baseline — no way to audit patch survival post-merge | Run `git diff fa4bba47..HEAD -- agents/ commands/gsd/ get-shit-done/workflows/ get-shit-done/references/ bin/install.js hooks/` and save to file before any merge command |
| Merge execution | `.planning/` mass deletion via `-X theirs` usage | Use bare `git merge`, resolve `.planning/` first with `git checkout --ours .planning/` |
| `install.js` conflict | Silent loss of `ensureHooksDist` and `{{GSD_REPO}}/{{GSD_BRANCH}}` blocks | Manual verify: 3 grep checks post-resolve (see Pitfall 2) |
| `gsd-check-update-worker.js` conflict | SHA `isNewer` replaced by semver `isSemverNewer` — design incompatibility | Explicit decision: adopt upstream semver or preserve SHA; no auto-merge |
| Fork guard test restoration | Tests silently absent post-merge | Verify 4 filenames exist in `tests/` after merge; restore from fork-side if missing |
| `package.json` resolution | Bin entrypoint and files array mismatch post-rename | Manual field-by-field resolution; run `npm install` to regenerate lockfile |
| Post-merge test run | Red scanner tests interpreted as merge errors | Pre-enumerate expected failures; treat them as conformance-pass backlog, not merge bugs |
| `CLAUDE.md` deletion | Agent spawns run without project context | Explicitly restore as first action in Phase 3 |
| Tag references in CI | `v1.4.x` tags resolve to fork's old commits, not upstream hotfixes | Do not fetch upstream tags; use only `refs/tags/v1.3.1` as the merge target |

---

## Sources

- Live `git diff HEAD..refs/tags/v1.3.1` inspection (2026-06-10)
- `.planning/PROJECT.md` — fork patches, test precedence rule, tech debt note (MERGE-02 stale grep)
- `.planning/MILESTONES.md` — v1.37.1 FORK-CORRUPTION pattern; patch-survival history
- `bin/install.js` live content — `{{GSD_REPO}}`/`{{GSD_BRANCH}}` at 6 call sites, `ensureHooksDist` presence confirmed
- `hooks/gsd-check-update-worker.js` live content — `isNewer` SHA function confirmed present on fork HEAD
- MEDIUM confidence on Pitfall 9 (SDK restructure details) — sdk/ diff was not exhaustively reviewed
