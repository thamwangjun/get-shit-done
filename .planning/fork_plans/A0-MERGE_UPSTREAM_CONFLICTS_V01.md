# Plan: Upstream Merge — Fork Standards Pass

## Overview

This is the canonical playbook for merging a new upstream version into `thamw-main` and applying the fork's quality bar. Use it every time `upstream/main` advances. Fill in the bracketed placeholders before executing.

**Upstream version being merged:** `[VERSION]` (e.g. `v1.38.0`)  
**Upstream commit SHA:** `[SHA]`  
**Number of conflicted files:** `[N]`

---

## Phase 1 — Pre-Merge Baseline

Before touching anything:

```bash
# Confirm working tree is clean
git status

# Record current test count as a baseline
npm test 2>&1 | grep "pass\|fail"

# Tag the current HEAD for easy diffing later
git tag pre-merge-[VERSION]
```

Expected: working tree clean, 0 failures.

---

## Phase 2 — Merge

```bash
git merge upstream/main
```

If conflicts arise, resolve them per **Phase 3** before proceeding. If no conflicts, skip to **Phase 4**.

### Conflict resolution strategy

**Take upstream feature additions + preserve HEAD structural conventions.**

Fork-owned files (see "Fork-Owned Files" section below) always resolve in favor of HEAD. For all other files, take upstream content additions and re-apply HEAD's structural rules on top.

#### For each conflicted file:

1. Read the full file including conflict markers (use offset/limit on large files — read every section)
2. Resolve each conflict: take upstream additions; preserve HEAD structure
3. Apply fork structural conventions to the entire file, not just the conflict zone
4. Write the complete resolved file — no `<<<<<<<`, `=======`, `>>>>>>>` markers may remain

#### Batch execution

Spawn general-purpose agents (model: sonnet) in parallel by file category:

```bash
# Get the authoritative conflict list
git diff --name-only --diff-filter=U | grep -v "package-lock.json"
```

Batch order: references → agents → workflows → commands (references cascade into everything else).

#### Conflict verification

```bash
grep -r "<<<<<<\|=======\|>>>>>>>" agents/ commands/gsd/ get-shit-done/workflows/ get-shit-done/references/
# Expected: no output
```

---

## Phase 3 — CATALOGUE.json Sync

New upstream files are not in `CATALOGUE.json` until added. Follow `plans/00-SYNC_CATALOGUE_V01.md` to bring it in sync.

```bash
npm test -- --test-name-pattern="catalogue"
```

All catalogue subtests must pass before proceeding.

---

## Phase 4 — Apply Fork Standards to New and Modified Files

### 4a — Identify which files need attention

```bash
# New files added by upstream (not previously in thamw-main)
git diff --name-only --diff-filter=A upstream/main^..upstream/main | grep -E '\.(md)$'

# Files modified by upstream (may have structural regressions)
git diff --name-only --diff-filter=M upstream/main^..upstream/main | grep -E '\.(md)$'
```

### 4b — Per-file standards checklist

Apply these steps to every new prompt file, and to modified files that the negative-framing scanner flags:

1. **Task specification** — is the task explicit? Does it state what output is expected, and what the quality bar is?
2. **Positive framing** — run `npm test -- --test-name-pattern="negative-framing"`; fix all violations (see `plans/05-POSITIVE_FRAMING_PASS_V01.md`)
3. **XML structure** — are sections wrapped in canonical tags (`<task>`, `<intent>`, `<context>`, `<constraints>`, `<persona>`, `<output_format>`, `<quality_bar>`)?
4. **Context placement** — task first, background middle, primary input last
5. **Priority ordering** — explicit ordering when multiple criteria apply; tie-breaking rules present
6. **Persona** — present only for open-ended/stylistic tasks; specific not generic
7. **Chain-of-thought** — present only for multi-step reasoning tasks; absent from thin wrappers
8. **Constraint enforcement** — restrictions paired with positive alternatives; numeric thresholds where applicable
9. **Compression** — no redundancy; every sentence earns its place

### 4c — Agent structural check

New agent files must use `<persona>` (not `<role>`) as the primary directive tag. This is enforced by `agent-frontmatter.test.cjs` — `npm test` will catch any revert.

---

## Phase 5 — Agent-Specific Checks

Run after any agent file changes:

```bash
npm test -- --test-name-pattern="agent-frontmatter"
```

All 155 subtests must pass. Failures indicate:
- `<persona>` tag reverted to `<role>` — re-apply the rename
- `skills:` added to frontmatter — remove it (breaks Gemini CLI runtime)
- `Only use the Write tool` string missing from a file-writing agent — restore it
- YAML frontmatter field added or removed — check `agent-frontmatter.test.cjs` for the expected schema

---

## Phase 6 — Full Test Gate

```bash
npm test
```

All tests must pass. Zero failures. Investigate and fix every failure before closing the merge phase.

If `package-lock.json` caused `npm test` to fail during conflict resolution, use this instead:

```bash
node --test tests/*.test.cjs
```

---

## Fork-Owned Files

These files are maintained by the fork. When a merge conflict appears on them, HEAD wins:

| File | Why fork owns it |
|---|---|
| `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md` | Fork-only; does not exist in upstream |
| `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md` | Fork-only; does not exist in upstream |
| `CATALOGUE.json` | Fork-maintained inventory; upstream does not have this file |
| `hooks/gsd-check-update-worker.js` | Fork runtime: SHA-based update check via GitHub API |
| `hooks/gsd-statusline.js` | Fork runtime: SHA equality comparison, no semver dev-install branch |
| `bin/install.js` | Fork runtime: git SHA version (`gsdVersion`), `ensureHooksDist()`, `cwd` pinned |
| `tests/negative-framing-scan.test.cjs` | Fork-only test |
| `tests/catalogue-sync.test.cjs` | Fork-only test |
| `tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs` | Fork-only test |
| `tests/version-detection.test.cjs` | Fork-only test |
| `scripts/run-tests.cjs` | Fork-modified: serial isolation for `hooks/dist/` mutation tests |
| `plans/` | Fork-only planning directory |

---

## Fork Conventions Quick Reference

These are the invariants that every prompt file on `thamw-main` must satisfy:

| Convention | Rule |
|---|---|
| Agent directive tag | `<persona>` (not `<role>`) — enforced by `agent-frontmatter.test.cjs` |
| Agent frontmatter | `name`, `description`, `tools`, `color` — no `skills:` |
| File-writing agents | Must contain the string `Only use the Write tool` |
| Negative directives | Convert to positive; paired reframes (`Never X — always Y`) are exempt |
| CATALOGUE.json | Must include every `.md` file in the four prompt content directories |
| VERSION file | Contains a 7-char hex SHA (or `no-network` sentinel for offline installs) |

---

## Phase Completion Checklist

Before marking this merge complete:

- [ ] No conflict markers remain in any prompt content file
- [ ] CATALOGUE.json is in sync (`catalogue-sync` subtests pass)
- [ ] Negative framing scanner passes (`negative-framing` subtests pass)
- [ ] Agent frontmatter test passes (`agent-frontmatter` subtests pass)
- [ ] Full test suite passes (`npm test` — zero failures)
- [ ] PROJECT.md Context section updated with new state
- [ ] `pre-merge-[VERSION]` tag deleted (cleanup): `git tag -d pre-merge-[VERSION]`
