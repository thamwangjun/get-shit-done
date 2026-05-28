---
id: plan-03
title: "Planning Artifact Updates"
phase: "45"
status: pending
depends_on: [plan-02]
requirements: [INTG-01, INTG-02, INTG-03, INTG-04, INTG-05, INTG-06]
wave: 3
autonomous: true
files_modified:
  - .planning/REQUIREMENTS.md
  - .planning/ROADMAP.md

must_haves:
  truths:
    - "D-18: REQUIREMENTS.md RESV-01 through RESV-07 marked as superseded (Eta pivot supersedes custom resolver)"
    - "D-18: INTG-01 through INTG-06 rewritten to reflect actual Eta-based deliverables (not the original !`cat` revert approach)"
    - "D-19: ROADMAP.md Phase 44 and Phase 45 descriptions updated to reflect the pivot from custom resolver to Eta v4"
    - "Traceability table in REQUIREMENTS.md updated to reflect the new INTG definitions"
  artifacts:
    - path: ".planning/REQUIREMENTS.md"
      provides: "Updated requirements reflecting Eta pivot"
      contains: "superseded"
    - path: ".planning/ROADMAP.md"
      provides: "Updated phase descriptions reflecting Eta pivot"
      contains: "Eta"
  key_links:
    - from: ".planning/REQUIREMENTS.md RESV-01..07"
      to: "Phase 44 completion note"
      via: "superseded label"
      pattern: "superseded"
    - from: ".planning/REQUIREMENTS.md INTG-01..06"
      to: "Eta-based implementation plan"
      via: "rewritten requirement text"
      pattern: "Eta"
---

## Goal

Update `.planning/REQUIREMENTS.md` and `.planning/ROADMAP.md` so the planning artifacts accurately reflect the Eta pivot decision — marking Phase 44's resolver requirements as superseded and replacing the original INTG definitions with Eta-accurate ones.

## Context

- **D-18**: Update REQUIREMENTS.md — RESV-01 through RESV-07 superseded; INTG-01 through INTG-06 reflect Eta approach
- **D-19**: Update ROADMAP.md — Phase 44 and Phase 45 descriptions reflect pivot

The original INTG-01..06 in REQUIREMENTS.md describe reverting the `260525-o1n` task and wiring `resolveIncludes()`. These are now obsolete. The Eta approach has a different set of deliverables that need to be recorded accurately for traceability.

## Tasks

### Task 1: Update REQUIREMENTS.md (D-18)

**Files:** `.planning/REQUIREMENTS.md`

**Steps:**

Read `.planning/REQUIREMENTS.md` in full before making changes.

**RESV-01 through RESV-07 (mark superseded):**

Add a `> **Superseded by Eta pivot (Phase 45).** Phase 44 implemented a custom `resolveIncludes()` resolver; Phase 45 replaces it with Eta v4. These requirements are satisfied and then superseded — the implementation they describe no longer exists in the codebase.` note after the RESV section header, and change the status checkboxes from `[x]` to `[~]` (tilde = superseded) for RESV-01 through RESV-07.

**INTG-01 through INTG-06 (rewrite to reflect Eta approach):**

Replace the existing INTG-01..06 definitions with these new definitions:

- **INTG-01**: `eta` v4 added to `dependencies` in `package.json`; a module-level Eta instance configured with `{%`/`%}` delimiters, `autoEscape: false`, `useWith: true`, and `views` = repo root exists in `bin/install.js`
- **INTG-02**: All install-time GSD static refs across `commands/gsd/` (55 files), `agents/` (7 files), `get-shit-done/workflows/` (19 files), and `get-shit-done/references/` (1 file) converted to `{%~ include('get-shit-done/X') %}` Eta tags — a post-conversion grep for bare-line `@~/.claude/get-shit-done/` and `` !`cat $HOME/.claude/get-shit-done/` `` returns 0 results
- **INTG-03**: Runtime `.planning/` bare-line refs in the agents layer (notably `agents/gsd-planner.md` lines 465-467) converted to `` !`cat .planning/X` `` form — cross-runtime compatible; `grep -n '@\.planning/' agents/gsd-planner.md` returns 0 results
- **INTG-04**: Eta renderer wired into `copyWithPathReplacement()` as the first transform step — `content = eta.renderString(content, {})` called immediately after `fs.readFileSync(srcPath, 'utf8')` at line ~6572, before path-substitution regexes
- **INTG-05**: Eta renderer wired into the agent install loop as the first transform step — `content = eta.renderString(content, {})` called immediately after `fs.readFileSync(path.join(agentsSrc, entry.name), 'utf8')` at line ~8786, before path-substitution regexes
- **INTG-06**: Skills path (`applyRuntimeContentRewritesInPlace`) confirmed as not requiring a resolver call — `SKILL.md` files contain 0 install-time include refs; no Eta rendering needed on that code path

Update the status checkboxes: all INTG items currently have `[ ]`; leave them as `[ ]` (they remain pending until execution is complete and verified). The Traceability table does not need status changes — requirements still map to Phase 45.

**Update the Out of Scope table:** The current REQUIREMENTS.md "Out of Scope" section contains a row that reads something like "External template engine (Nunjucks, LiquidJS, Eta)" noting Eta as a future option. Remove that row or update it to reflect that Eta is now in scope as the implemented solution.

**Verification:** `command grep -c "Eta" .planning/REQUIREMENTS.md` returns a number > 5 (confirms multiple Eta references were added).

**Done:** RESV-01..07 are marked as superseded. INTG-01..06 describe Eta-based deliverables. File is syntactically valid Markdown.

---

### Task 2: Update ROADMAP.md Phase 44 and 45 descriptions (D-19)

**Files:** `.planning/ROADMAP.md`

**Steps:**

Read `.planning/ROADMAP.md` in full before making changes. Focus on the Phase 44 and Phase 45 entries under `## Phase Details`.

**Phase 44 description update:**

The current Phase 44 description (`### Phase 44: Resolver Core`) describes building `resolveIncludes()` as the deliverable. Update the description to accurately reflect what was built (Phase 44 did implement `resolveIncludes()` but the result was subsequently pivoted away from). Add a note:

```
> **Pivot note (Phase 45):** Phase 44's `resolveIncludes()` function was built and unit-tested as planned, then removed in Phase 45 when the approach pivoted to Eta v4 as the install-time template engine.
```

**Phase 45 description update:**

The current Phase 45 entry (`### Phase 45: Pipeline Integration`) under `## Phase Details` describes reverting `260525-o1n` and wiring `resolveIncludes()`. This is the pre-pivot description. Replace the **Goal** sentence and **Success Criteria** items to reflect the Eta approach:

New Goal:
```
**Goal**: Eta v4 is wired as the install-time template engine in both `install.js` copy loops; all ~180 install-time static reference lines across 82 source files are converted to `{%~ include() %}` tags; Phase 44's `resolveIncludes()` is removed; every installed file is fully self-contained with zero surviving `@~/.claude/get-shit-done/` patterns
```

New Success Criteria (replace existing 4 items):
1. `eta` is in `package.json` `dependencies`; `content = eta.renderString(content, {})` is wired as the first transform in both `copyWithPathReplacement()` and the agent install loop
2. All 82 source files across `commands/gsd/`, `agents/`, `get-shit-done/workflows/`, `get-shit-done/references/` have bare-line static refs converted to `{%~ include('get-shit-done/X') %}` tags — post-conversion grep returns 0 survivors
3. Runtime `.planning/` bare-line refs in the agents layer converted to `` !`cat .planning/X` `` form
4. `resolveIncludes()` removed from `bin/install.js` and `tests/resolve-includes.test.cjs` deleted; `npm test` passes with no new failures

Also update the v2.1.0-c milestone summary line under the `### 🚧 v2.1.0-c Install-Time Content Materialization` heading — replace the Phase 45 line item description to match:
```
- [ ] **Phase 45: Pipeline Integration** — Wire Eta v4 into install.js; convert ~180 static ref lines to {%~ include() %} tags across 82 files; remove resolveIncludes()
```

**Verification:** `command grep -c "Eta" .planning/ROADMAP.md` returns a number > 3 (confirms Eta references added to roadmap).

**Done:** ROADMAP.md Phase 44 has pivot note. Phase 45 goal and success criteria describe Eta deliverables. The milestone summary line is updated.

## Success Criteria

- `command grep "superseded" .planning/REQUIREMENTS.md` returns at least one match
- `command grep -c "Eta" .planning/REQUIREMENTS.md` returns > 5
- INTG-01 in REQUIREMENTS.md mentions "eta" and "dependencies"
- INTG-02 in REQUIREMENTS.md mentions "include" and "Eta tags"
- INTG-04 and INTG-05 mention "renderString" and the specific wiring points
- `command grep -c "Eta" .planning/ROADMAP.md` returns > 3
- Phase 45 goal sentence in ROADMAP.md mentions "Eta v4" and "install-time"
- Phase 44 pivot note exists in ROADMAP.md

## Verification

```bash
command grep -c "Eta" .planning/REQUIREMENTS.md
command grep -c "Eta" .planning/ROADMAP.md
command grep "superseded" .planning/REQUIREMENTS.md | head -3
command grep "renderString" .planning/REQUIREMENTS.md
```
