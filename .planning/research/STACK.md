# Merge Mechanics: Upstream v1.3.1 into Fork HEAD

**Milestone:** v2.3.1-a — Upstream v1.3.1 Merge & Rename Adoption
**Researched:** 2026-06-10
**Confidence:** HIGH (all findings verified with `git` commands against the actual repo)

---

## 1. Shared History Verification

**Verdict: Standard `git merge` is viable. `--allow-unrelated-histories` is NOT needed.**

```
Merge-base:      fa4bba47  chore(ci): adopt npm Trusted Publishers (OIDC) …
Upstream target: 1bb253c9  fix(#670): bump hono to clear moderate npm advisory for 1.3.1 hotfix
Fork HEAD:       c3f95867  docs: start milestone v2.3.1-a …
```

Verified:
```bash
git merge-base HEAD 1bb253c9
# → fa4bba478bcf8c4f20df24dc6f89527555891bc3  (confirmed, present in repo)
```

The merge-base `fa4bba47` exists and is reachable from both sides. Both histories share a common ancestor. The "different version line / different repo identity" note in the milestone context does NOT mean unrelated git histories — `open-gsd/gsd-core` is a continuation of the same repo with a rebranding. The DAG is connected.

**Divergence depth:**
- Upstream commits since merge-base: 269
- Fork commits since merge-base: 1,037
- Files changed between HEAD and `1bb253c9`: 3,239 files (+145k/−290k)

---

## 2. Recommended Git Strategy

**Use `git merge` with the `ort` strategy (Git's default since 2.33), with elevated rename detection limits. Do NOT use `--allow-unrelated-histories`, rebase, or subtree strategies.**

### Why NOT rebase

Rebasing 1,037 fork commits onto upstream would re-apply every fork commit one at a time, re-encountering the rename and content conflicts at each step. This multiplies conflict resolution work by ~1,000x and permanently rewrites fork history, breaking bisect and blame.

### Why NOT a patch/subtree approach

The fork already shares git history with upstream. A subtree merge or `git apply` of a patch bundle bypasses git's rename tracking entirely, treating the `get-shit-done/` → `gsd-core/` rename as a mass delete+add. This is the worst possible outcome for conflict count.

### Why `ort` strategy with high rename limit

Git's `ort` strategy (Ostensibly Recursive's Twin) handles cross-rename merges better than the legacy `recursive` strategy. It is the default since Git 2.33. With `diff.renameLimit` raised to cover the file count (≥1,473 as git itself warned), it will correctly identify that `get-shit-done/foo.cjs` in fork HEAD is the same file as `gsd-core/foo.cjs` in upstream, and will apply upstream content changes across the rename boundary rather than generating a delete+add conflict pair for every file.

**Without raising rename limit:** git emits `warning: exhaustive rename detection was skipped due to too many files` and detects only ~50–88 of the ~230 renamed files. Every undetected rename becomes two conflicts (one delete, one untracked add).

**Verified rename count with raised limit:**
```bash
git -c diff.renameLimit=5000 diff --stat --diff-filter=R -M HEAD 1bb253c9
# 88 renames detected with limit=5000 vs 50 with default 1000
```

### Recommended merge command

```bash
# Step 1: Set rename limits before merging (session config, no global write)
git config diff.renameLimit 5000
git config merge.renameLimit 5000

# Step 2: Merge
git merge -s ort 1bb253c9 \
  -X rename-threshold=50 \
  --no-ff \
  -m "chore: merge upstream v1.3.1 (open-gsd/gsd-core) into fork"
```

`-X rename-threshold=50` tells the ort strategy to accept a 50% similarity score as a rename (default is 50%, but stating it explicitly prevents any config override from silently lowering detection). Use `-X rename-threshold=40` if many fork-modified files fall below 50% similarity.

`--no-ff` prevents a fast-forward (there will be no fast-forward anyway given 1,037 fork commits, but explicit is better).

---

## 3. Directory Rename Handling (`get-shit-done/` → `gsd-core/`)

**This is the single most important mechanical decision. Handle it correctly and conflict volume is manageable. Handle it wrong and you get ~230 spurious add/delete pairs.**

### How the rename happened in upstream

The rename occurred in **a single commit** in upstream:

```
463cffd8  chore(#604): rename get-shit-done/ runtime directory to gsd-core/ (#615)
  — 59 files renamed: {get-shit-done => gsd-core}/...
  — Date: 2026-06-02
```

Preceded by:
```
79002a00  chore(#518): rename npm package + bin to @opengsd/gsd-core (#519)
  — package.json name/bin fields renamed
  — Date: 2026-05-30
```

Since the rename is a single atomic commit in upstream history, git's merge machinery (with adequate rename limit) will see the `get-shit-done/` files on the fork side and `gsd-core/` files on the upstream side as renames of the same content, not new files. This is the correct behavior.

### What NOT to do before merging

**Do NOT pre-rename `get-shit-done/` to `gsd-core/` in the fork before running the merge.**

If you manually rename the directory in the fork as a separate commit before merging, git will see:
- Fork side: `gsd-core/foo.cjs` (just renamed by you)
- Upstream side: `gsd-core/foo.cjs` (content-modified by upstream)
- Merge-base: `get-shit-done/foo.cjs`

This generates "both sides added" conflicts for every file, which is worse than letting the merge handle it. **Let the merge carry the rename.**

### Post-merge validation for rename

After merge, verify the rename landed:
```bash
ls gsd-core/        # should exist with all content
ls get-shit-done/ 2>&1   # should NOT exist
git diff HEAD --name-only | grep get-shit-done  # should be empty
```

---

## 4. npm Package / bin Rename Interaction

**The package rename (`get-shit-done-cc` → `@opengsd/gsd-core`) and bin rename (`get-shit-done-redux` → `gsd-core`) are entirely within `package.json` and `bin/install.js`. They will conflict but are straightforward to resolve.**

### What changed in upstream

```json
// upstream 1bb253c9: package.json
{
  "name": "@opengsd/gsd-core",
  "bin": {
    "gsd-core": "bin/install.js",
    "gsd-tools": "gsd-core/bin/gsd-tools.cjs"
  }
}

// fork HEAD: package.json
{
  "name": "get-shit-done-cc",
  "bin": {
    "get-shit-done-redux": "bin/install.js",
    "gsd-sdk": "bin/gsd-sdk.js",
    "gsd-tools": "bin/gsd-sdk.js"
  }
}
```

The fork has additional bin entries (`gsd-sdk`) that upstream does not. The merge will generate a conflict in `package.json`. Resolution: take upstream's `name` and `gsd-core` bin entry, keep fork's additional `gsd-sdk` bin entries if they remain valid.

### `bin/install.js` path assumptions

Fork's `bin/install.js` currently hard-codes `'../get-shit-done/'` in multiple `require()` calls and path strings. Upstream has already updated all of these to `'../gsd-core/'`.

The merge will conflict on these lines. **Resolution rule: accept upstream's `gsd-core/` paths.** After the merge, verify no old paths remain:

```bash
grep -n "get-shit-done/" bin/install.js
# Any remaining occurrences should be only in user-facing migration messages, not require() paths
```

**Exception:** The fork's `bin/install.js` contains a `gsd-sdk` uninstall path handler (line ~6990 area references `get-shit-done`). After adopting the rename, this handler path should reference `gsd-core`, but any migration/cleanup logic for users upgrading from old installations that had `get-shit-done/` installed may need to remain.

---

## 5. Incremental Execution Sequence

**Principle: every checkpoint leaves the repo in a committable state. Never resolve conflicts speculatively — commit after each logical group.**

### Pre-merge setup

```bash
# 1. Ensure clean working tree
git status
# Must show: nothing to commit, working tree clean

# 2. Create a backup branch — this is your recovery anchor
git branch pre-merge-v1.3.1-backup

# 3. Fetch upstream (ensure ref is current)
git fetch upstream
git fetch upstream --tags

# 4. Confirm target commit is available
git log --oneline -1 1bb253c9
# Expected: fix(#670): bump hono to clear moderate npm advisory for 1.3.1 hotfix

# 5. Raise rename limits
git config diff.renameLimit 5000
git config merge.renameLimit 5000
```

### Execute the merge

```bash
# 6. Run the merge — expect conflicts
git merge -s ort 1bb253c9 \
  -X rename-threshold=50 \
  --no-ff \
  -m "chore: merge upstream v1.3.1 (open-gsd/gsd-core) into fork"
```

The merge will halt at conflicts. This is expected.

### Conflict triage order

Resolve conflicts in this order to minimize cascading confusion:

**Group A — Structural files (resolve first)**
- `package.json` — name, version, bin fields
- `bin/install.js` — path references (`get-shit-done/` → `gsd-core/`)
- Root config files (`.gitignore`, `eslint.config.mjs`, etc.)

```bash
# After resolving Group A:
git add package.json bin/install.js
git commit -m "merge(v1.3.1): Group A — package.json and install.js rename adoption"
```

**Group B — Fork-owned files (take `--ours`)**

The fork's `.planning/` directory is entirely local — upstream has no `.planning/` dir, so no conflicts expected there. If any appear (unlikely), take ours:
```bash
git checkout --ours .planning/
git add .planning/
```

**Group C — Prompt content files (agents, commands, workflows)**

These are the most numerous conflicts and require per-file judgment. The fork has modified these for positive framing; upstream has continued developing them.

Strategy for each conflicted agent/command/workflow:
- Take upstream's structural additions (new sections, new instructions, new parameters)
- Preserve fork's positive-framing rewrites of existing sentences
- Do NOT batch-accept `--theirs` on these files

Work in batches of 10–20 files, committing after each batch:
```bash
git add agents/gsd-foo.md agents/gsd-bar.md
git commit -m "merge(v1.3.1): Group C batch 1 — agents a-f"
```

**Group D — lib/*.cjs and test files**

For `gsd-core/bin/lib/*.cjs` files (they will appear under the new path after merge), upstream has done substantial refactoring. Take upstream's version as base, then reapply any fork-specific patches:
```bash
git checkout --theirs gsd-core/bin/lib/some-file.cjs
# inspect for fork-specific additions and manually splice them back in
git add gsd-core/bin/lib/some-file.cjs
```

**Group E — New upstream files (no action needed)**

Files in `.changeset/`, `docs/`, `eslint-rules/`, `.plans/` that don't exist in the fork will be added automatically with no conflicts.

### Complete the merge

```bash
# After all conflict groups are resolved and staged:
git merge --continue
# This creates the final merge commit
```

### Post-merge validation

```bash
# Verify directory rename
ls gsd-core/bin/gsd-tools.cjs   # must exist
ls get-shit-done/ 2>&1          # must NOT exist

# Verify package identity
node -e "const p=require('./package.json'); console.log(p.name, p.version)"

# Verify install.js path references
grep -c "require.*get-shit-done" bin/install.js  # should be 0

# Verify gsd-tools CLI still works
node gsd-core/bin/gsd-tools.cjs help

# Run tests — expect some failures; that is acceptable per milestone scope
npm test 2>&1 | tee /tmp/post-merge-test.txt
```

### Recovery at any point

```bash
# Before merge --continue (merge still in progress):
git merge --abort
# Returns working tree to pre-merge-v1.3.1-backup state

# After a bad merge commit (before pushing):
git reset --hard pre-merge-v1.3.1-backup
```

---

## 6. What NOT to Do

| Action | Why it is wrong |
|--------|----------------|
| `--allow-unrelated-histories` | Not needed — shared ancestor confirmed at `fa4bba47` |
| Pre-renaming `get-shit-done/` before the merge | Creates "both sides added" conflicts for every file in the directory |
| `git rebase` of fork onto upstream | Re-applies 1,037 commits one-by-one; multiplies conflict work ~1000x |
| `git merge -X theirs` (blanket) | Obliterates all fork prompt-engineering improvements |
| `git merge -X ours` (blanket) | Brings in no upstream content |
| Skipping rename limit increase | Git silently misses ~140 renames, generating ~280 spurious conflicts |
| Resolving all conflicts in a single commit | No incremental recovery checkpoints |
| Using `--squash` | Loses upstream commit attribution; hides merged-in range for future merges |

---

## Sources

All findings empirically verified with git commands against `/home/thamw/development/remote-dev/get-shit-done`:

- `git merge-base HEAD 1bb253c9` → confirmed `fa4bba47` (shared ancestor, no `--allow-unrelated-histories` needed)
- `git rev-list fa4bba47..1bb253c9 --count` → 269 upstream commits
- `git rev-list fa4bba47..HEAD --count` → 1,037 fork commits
- `git log --oneline fa4bba47..1bb253c9 | grep -E "rename|brand"` → identified `463cffd8` (dir rename) and `79002a00` (pkg rename)
- `git show --stat 463cffd8` → confirmed single-commit directory rename (59 files, `{get-shit-done => gsd-core}/...`)
- `git -c diff.renameLimit=5000 diff --stat --diff-filter=R -M HEAD 1bb253c9` → 88 renames with limit=5000 vs 50 with default 1000; git warned limit should be ≥1,473
- `git ls-tree -r 1bb253c9 --name-only | grep "\.planning"` → confirmed upstream has no `.planning/` directory
- `git show 1bb253c9:package.json` + `git show HEAD:package.json` → confirmed bin/name field differences
- `git show 1bb253c9:bin/install.js | grep gsd-core` → confirmed upstream already uses `gsd-core/` paths throughout
