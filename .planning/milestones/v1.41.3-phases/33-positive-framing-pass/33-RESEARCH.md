# Phase 33: Positive Framing Pass - Research

**Researched:** 2026-05-14
**Domain:** Prompt-content framing fixes + a state-management code bug (`state.cjs`)
**Confidence:** HIGH

## Summary

Phase 33 has two unrelated workstreams. The first is a **negative-framing scanner pass**: convert bare negative directives (`DO NOT`, `NEVER`, `Don't`, `must not`, `<anti_patterns>`) in fork prompt files to affirmative form so the `negative-framing-scan.test.cjs` suite goes green. The second is a **code bug fix** (`#3242` Bug A) in `get-shit-done/bin/lib/state.cjs` so `bug-3242-state-update-progress-trample.test.cjs` passes when its `todo` markers are removed.

The scanner work is well-bounded and verified. Running the full suite (`node scripts/run-tests.cjs`) produces exactly **6 failing leaf subtests, all inside `tests/negative-framing-scan.test.cjs`** — no other test file fails. The scanner itself is the source of truth for SCAN-12: it scans `agents/`, `commands/gsd/`, and `get-shit-done/workflows/` only (`references/` is excluded by `SCAN_DIRS`, matching REQUIREMENTS.md Out-of-Scope). The exact violations are enumerated below — there are **12 distinct lines across 5 files**.

The `#3242` workstream needs more care than CONTEXT.md anticipated. The `state.cjs` source **already contains the full #3242 fix code** (commit `d52f9092`/`6299b918` is an ancestor of HEAD). Bug B is fully fixed — its two `todo` tests pass when activated. **Only Bug A still fails**, and the root cause is NOT where the existing fix lives: `cmdStateUpdate` correctly preserves curated `progress.*` on disk, but `cmdStateJson` (the read path the test uses) unconditionally rebuilds `progress.*` from disk via `buildStateFrontmatter` and only preserves `stopped_at`/`paused_at`/`status` — not `progress`. The fix belongs in `cmdStateJson`.

**Primary recommendation:** Two plans. Plan 01 = scanner framing fixes (TDD: confirm RED subtests, apply 12 affirmative rewrites, confirm GREEN). Plan 02 = `#3242` Bug A fix in `cmdStateJson` + remove the 3 `todo` markers from `bug-3242-state-update-progress-trample.test.cjs`.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Fix ALL current scanner failures, not just the formal FRAME-01/FRAME-02 requirements. The 5 currently-failing subtests (`edit-phase.md`, `secure-phase.md`, `gsd-executor.md`, `gsd-planner.md`, `discuss-phase.md`) are included so Phase 34 starts clean.
- **D-02:** Framing violations only — fix negative language (bare "never", "do not", "do NOT", etc.) to affirmative form. Do NOT apply the structural critique improvements from `.planning/critique/workflows/` (persona rewrites, task block restructuring, canonical `<phase>` tag conversion). Those are deferred.
- **D-03:** Fix `bug-3242-state-update-progress-trample.test.cjs` in Phase 33, not Phase 34. Phase 34 is a pure gate + merge.

### Claude's Discretion

- If scanner tests for debug.md and reapply-patches.md violation types don't already exist, add them as RED gates before fixing (TDD pattern consistent with Phases 25–29).
- For any violation that is semantically load-bearing (e.g., "never as instructions" where the negative is the point), use a `// allow-test-rule` comment rather than changing the prose if a positive rewrite would alter meaning.

### Deferred Ideas (OUT OF SCOPE)

- Structural improvements to `debug.md` and `reapply-patches.md` from `.planning/critique/` — persona rewrites, task block restructuring, canonical `<phase>` tag conversion — belong in a future quality pass phase.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FRAME-01 | `get-shit-done/workflows/debug.md` passes negative-framing scanner at 0 violations, 0 warnings | **Key finding:** the current scanner flags **0 violations and 0 warnings in `debug.md`** already. The CONTEXT.md-listed lines (9, 119, 182, 184, 197) are all excluded by scanner helper logic (`isConditionalOrFactual`, factual-`never`, code fences). FRAME-01 is satisfied by the existing file state — verify with a corpus subtest for `debug.md` (Claude's discretion: add a RED→GREEN guard subtest, which will be GREEN immediately). |
| FRAME-02 | `get-shit-done/workflows/reapply-patches.md` passes negative-framing scanner at 0 violations, 0 warnings | The current scanner flags **1 violation** in `reapply-patches.md`: line 323 `doNot`. It also flags **2 `cannot` warnings** (lines 340, 358) — but `cannot` is a warn-only bucket (`assert.ok(true)`, Phase 25 D-17) and does NOT fail tests. "0 warnings" in the requirement text refers to the hard-failure scanner output; warn-only `cannot` lines are informational and out of fix scope per established precedent. Fix line 323; optionally reframe the 2 `cannot` lines if a clean positive rewrite exists. |
| SCAN-12 | Negative-framing scanner run across all upstream v1.41.2 files; 0 unaddressed violations | The scanner test (`SCAN_DIRS = agents, get-shit-done/workflows, get-shit-done/references, commands/gsd`) IS the SCAN-12 mechanism. `references/` is in `SCAN_DIRS` for unit-test traversal but has **no corpus subtests** — references violations are never asserted (matches REQUIREMENTS.md Out-of-Scope for `references/`). Fix scope = the 12 lines flagged by the 6 failing subtests. |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Negative-framing detection | Test harness (`tests/negative-framing-scan.test.cjs`) | — | Scanner logic + corpus subtests are self-contained in the test file |
| Affirmative rewrite of directives | Prompt content files (`agents/`, `commands/gsd/`, `get-shit-done/workflows/`) | — | Edits are prose-only in markdown prompt files |
| Curated progress preservation on read | `state.cjs` → `cmdStateJson` | `buildStateFrontmatter` | `state json` is the read path; it must not let disk-derived `progress.*` overwrite curated frontmatter |
| Curated progress preservation on write | `state.cjs` → `cmdStateUpdate` + `readModifyWriteStateMd` | — | Already fixed and working (`resync:false` + snapshot/restore) |

## Standard Stack

No new libraries. This phase edits existing files only.

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | v24.14.1 (verified) | Test runtime |
| npm | 11.11.0 (verified) | `npm test` → `node scripts/run-tests.cjs` |
| `node:test` | built-in | Test framework (no external runner) |

**No installation step.** `node scripts/run-tests.cjs` runs all `tests/*.test.cjs` files.

## The Exact Fix Scope (verified by running the scanner)

### Workstream A — Scanner framing violations (6 failing subtests, 12 lines, 5 files)

Run to reproduce: `node --test tests/negative-framing-scan.test.cjs`

| # | File | Line | Bucket | Current text (trimmed) | Suggested affirmative rewrite |
|---|------|------|--------|------------------------|-------------------------------|
| 1 | `agents/gsd-executor.md` | 517 | `doNot` (agent) | `commits landed there, **DO NOT** "recover" by force-rewinding the protected ref —` | The line already has an em-dash but the scanner's `hasPositiveComplement` requires ` — ` (spaces both sides). Verify spacing; if the em-dash is mid-clause, restructure: `**Always HALT and surface a blocker** instead of "recovering" by force-rewinding the protected ref — that silently destroys concurrent commits...` |
| 2 | `commands/gsd/discuss-phase.md` | 33 | `doNot` (command) | `Do not pre-load any workflow files before reading the mode routing instructions.` | `Read the mode routing instructions first; load workflow files only on-demand in the <process> section.` (matches the preceding line's intent) |
| 3 | `agents/gsd-planner.md` | 203 | `never` (agent) | `- NEVER place fenced code blocks (\`\`\`) inside \`<action>\`. Action is directive prose, not implementation code.` | `- Keep \`<action>\` as directive prose only — fenced code blocks belong in \`<read_first>\` source files. Action is directive prose, not implementation code.` (the trailing sentence already provides a positive complement after a period — verify `hasPositiveComplement` matches the `. A` pattern; if it does, only the `NEVER` token needs softening, OR the existing period+capital may already exempt it once `NEVER` → affirmative) |
| 4 | `get-shit-done/workflows/edit-phase.md` | 191 | `mustNot` (workflow) | `- It must not reference itself (phase {target})` | `- It must reference a different phase — self-reference (phase {target}) is invalid.` Note: `mustNot` bucket has NO `hasPositiveComplement` filter — the only fix is removing the literal `must not` token. |
| 5 | `get-shit-done/workflows/edit-phase.md` | 271 | `antiPatterns` (workflow) | `<anti_patterns>` (opening tag) | Rename block `<anti_patterns>` → `<expected_patterns>` (or `<constraints>`) AND its closing tag at line 280. Precedent: Phase 26 FIX-03 renamed `<anti_patterns>` → `<expected_patterns>` and reframed content. |
| 6 | `get-shit-done/workflows/edit-phase.md` | 273 | `dont` (workflow) | `- Don't modify other phases when editing one` | `- Edit only the target phase; leave all other phases untouched.` |
| 7 | `get-shit-done/workflows/edit-phase.md` | 275 | `dont` (workflow) | `- Don't write without showing a diff and getting confirmation` | `- Always show a diff and get confirmation before writing.` |
| 8 | `get-shit-done/workflows/edit-phase.md` | 276 | `dont` (workflow) | `- Don't edit in_progress/completed phases without --force` | `- Edit in_progress/completed phases only when --force is passed.` |
| 9 | `get-shit-done/workflows/edit-phase.md` | 277 | `dont` (workflow) | `- Don't use raw Write on ROADMAP.md without reading it first; always replace section in place` | `- Read ROADMAP.md first, then replace the section in place — never use raw Write on it.` (the `; always` already gives a positive complement after... actually no `; ` is not in `hasPositiveComplement` markers — must rewrite to lead positive) |
| 10 | `get-shit-done/workflows/edit-phase.md` | 278 | `dont` (in `<anti_patterns>` block) | `- Don't modify the phase directory structure — only ROADMAP.md changes` | Has ` — ` complement → `hasPositiveComplement` returns true → **already passes**, but lives inside the `<anti_patterns>` block being renamed. Reframe to affirmative when restructuring the block: `- Change only ROADMAP.md; leave the phase directory structure intact.` |
| 11 | `get-shit-done/workflows/edit-phase.md` | 279 | `dont` (in `<anti_patterns>` block) | `- Don't commit the change — that's the user's decision` | Has ` — ` complement → already passes scanner, but reframe with the block: `- Leave committing to the user — that's their decision.` |
| 12 | `get-shit-done/workflows/secure-phase.md` | 76 | `mustNot` + `doNot` (workflow) | `- If \`threats_open: 0 AND register_authored_at_plan_time: false\` → **do NOT skip**. Empty-by-no-planning must not rubber-stamp a clean SECURITY.md. Proceed to Step 5 in retroactive-STRIDE mode...` | Two tokens on one line. `do NOT skip` is followed by `. Empty` (period + capital) so `doNot` may already be exempt — but `must not rubber-stamp` is a hard `mustNot` hit with no filter. Rewrite: `...→ **always proceed to Step 5 in retroactive-STRIDE mode**. An empty-by-no-planning register requires a real audit, not a rubber-stamp of a clean SECURITY.md. The auditor builds...` |

**Subtest → line mapping (the 6 failing leaf subtests):**
- `no bare DO NOT directives in agent files` → line 1 (gsd-executor.md:517)
- `no bare DO NOT directives in command files` → line 2 (discuss-phase.md:33)
- `no NEVER primary directives in agent files` → line 3 (gsd-planner.md:203)
- `no bare don't directives in workflow files` → lines 6–9 (edit-phase.md:273,275,276,277)
- `no <anti_patterns> tags in workflow files` → line 5 (edit-phase.md:271)
- `no bare must not directives in workflow files` → lines 4, 12 (edit-phase.md:191, secure-phase.md:76)

> **VERIFICATION REQUIRED during planning:** Each rewrite above is a *suggestion*. The planner must instruct the executor to re-run `node --test tests/negative-framing-scan.test.cjs` after edits — `hasPositiveComplement` / `isFactualNever` / `isConditionalOrFactual` have subtle matching rules (e.g., ` — ` requires spaces both sides; `[.!]\*{0,2}\s+[A-Z]` exempts period+capital). The scanner output, not human judgment, is the gate.

### Workstream B — `#3242` Bug A in `state.cjs`

**Test file:** `tests/bug-3242-state-update-progress-trample.test.cjs` (4 active assertions + 3 `todo`-marked tests).

**Current state (verified):**
- The suite **exits 0** because the 3 failing tests carry `{ todo: '...' }` markers — `node:test` reports them as `# todo`, not `# fail`.
- Removing the `todo` markers and running: **Bug B's 2 tests PASS** (the fix exists), **Bug A's 1 test FAILS** (`completed_plans` was 22, got 6).

**Root cause (verified by direct reproduction):**
`cmdStateUpdate` → `readModifyWriteStateMd(..., { resync: false })` correctly snapshots and restores the curated `progress.*` block **on disk** (state.cjs lines 1072–1100). Confirmed: after `state update "Last Activity"`, the STATE.md file on disk still shows `completed_plans: 22`.

But the test reads back via `state json` → `cmdStateJson` (state.cjs lines 1102–1131), which:
```
const built = buildStateFrontmatter(body, cwd);   // rebuilds progress.* from DISK scan
// preserves only: stopped_at, paused_at, status
// does NOT preserve: existingFm.progress
```
So `state json` re-derives `progress.*` from the 6 phase dirs on disk → `completed_plans: 6`, `total_phases: 6`, `percent: 100`, overwriting the curated `22 / 12 / 50`.

**The fix (planner decision required):** `cmdStateJson` must preserve curated `progress.*` from `existingFm` when the frontmatter block is present. The tension to resolve: issue **#1589** (`tests/state.test.cjs:1709`) requires `state json` to reflect *new* SUMMARY files added since the last write — i.e., disk-derived progress is the desired behavior *when the frontmatter has no curated block or the block is stale*. The Bug A test explicitly stores a **curated cross-milestone** `progress.*` block in frontmatter that must be treated as authoritative.

Recommended approach (LOW confidence on exact mechanism — planner should decide):
- **Option 1:** In `cmdStateJson`, if `existingFm.progress` exists, preserve it verbatim (mirror the `stopped_at`/`paused_at` preservation already at lines 1119–1124). Risk: may regress #1589 — must run `tests/state.test.cjs` to confirm. (The #1589 test may not store a frontmatter `progress` block, in which case there's no conflict.)
- **Option 2:** Match `readModifyWriteStateMd`'s established pattern — it already distinguishes "curated block present, preserve it" from "rebuild from disk". `cmdStateJson` could reuse that snapshot/restore logic.

The planner MUST read `tests/state.test.cjs:1706–1800` (#1589 test) before choosing, to verify the chosen fix keeps #1589 green.

**Also required:** Remove all 3 `{ todo: '...' }` markers from `bug-3242-state-update-progress-trample.test.cjs` (lines 107, 201, 295) so the tests become active gates. Bug B's two (lines 201, 295) pass already; Bug A's one (line 107) passes after the `cmdStateJson` fix.

## Architecture Patterns

### Pattern 1: TDD RED→GREEN for scanner subtests (Phases 25–29 precedent)
**What:** For each new violation class, add a corpus subtest that is confirmed FAILING (RED) against unmodified files, then fix the violations until GREEN.
**When to use:** When adding a new guard subtest (e.g., a `debug.md`-specific or `reapply-patches.md`-specific corpus subtest per Claude's discretion).
**Note for this phase:** The 6 currently-failing subtests are *already RED* — no new RED gate needed for them; just apply fixes. New subtests added under Claude's discretion for `debug.md` (which is already clean) will be GREEN immediately — that is acceptable as a regression guard, not a TDD RED gate.

### Pattern 2: Affirmative replacement vocabulary (Phase 30 / v1.37.1a precedent)
**What:** Established conversions used in prior framing passes:
- `DO NOT X` → `Always Y` / `X is invalid` / `Only X when Y`
- `NEVER X` → `Always Y` / `Keep X as Y`
- `Don't X` → imperative affirmative (`Edit only...`, `Read first, then...`)
- `must not X` → `must Y` / `X is invalid`
- `<anti_patterns>` → `<expected_patterns>` / `<constraints>` with content reframed affirmatively (Phase 26 FIX-01/FIX-03)

### Pattern 3: `// allow-test-rule` escape hatch (Claude's discretion)
**What:** When a positive rewrite would change load-bearing meaning, an inline `// allow-test-rule` comment exempts the line.
**When to use:** Reserved for genuinely irreducible cases. In this phase's 12 lines, none obviously require it — all have clean affirmative rewrites. Use only if a rewrite attempt provably alters meaning.

### Anti-Patterns to Avoid
- **Trusting suggested rewrites without re-running the scanner:** `hasPositiveComplement` has exact-match rules (` — ` needs spaces; period+capital exempts). Always verify with `node --test tests/negative-framing-scan.test.cjs`.
- **Fixing `references/` violations:** The corpus subtests never assert against `references/`. REQUIREMENTS.md marks `references/` Out of Scope. Editing them is wasted work and risks scope creep.
- **Treating `cannot` warnings as failures:** `cannot`/`won't`/`will not` are warn-only buckets (`assert.ok(true)`) — they print `[WARN]` but never fail. Do not chase them for SCAN-12.
- **Fixing `#3242` in `cmdStateUpdate`:** The write path is already correct. The bug is in the read path (`cmdStateJson`). Fixing the write path will not make the test pass.
- **Applying structural critique from `.planning/critique/`:** Explicitly deferred by D-02.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Detecting negative framing | A new regex/script | Existing `scanForNegativeFraming` in `tests/negative-framing-scan.test.cjs` | Fully built, 13 violation/warning buckets, code-fence aware, helper-filtered for false positives |
| Verifying a fix worked | Manual eyeballing | `node --test tests/negative-framing-scan.test.cjs` | The scanner's exclusion logic is non-obvious; only the test result is authoritative |
| Preserving curated frontmatter on write | New preservation logic | Existing `readModifyWriteStateMd(..., {resync:false})` snapshot/restore | Already implemented and working — the gap is `cmdStateJson` not reusing the same idea |

## Runtime State Inventory

> This phase is a code/content edit phase with NO renames, migrations, or external state changes. Inventory included for completeness.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no datastores touched. The `#3242` fix changes how `state json` *reads* STATE.md frontmatter; no stored data is migrated. | None |
| Live service config | None — no external services. | None |
| OS-registered state | None. | None |
| Secrets/env vars | None. | None |
| Build artifacts | None — no package renames, no `pyproject.toml`/`package.json` name changes. `state.cjs` edit takes effect immediately (interpreted, no build step). | None |

**Verified:** Phase scope is markdown prose edits in `agents/`/`commands/`/`workflows/`, a logic edit in `get-shit-done/bin/lib/state.cjs`, and `todo`-marker removal in one test file. No runtime state is cached, stored, or registered under any changed identifier.

## Common Pitfalls

### Pitfall 1: Suggested rewrite still trips the scanner
**What goes wrong:** A rewrite "looks affirmative" but still contains a flagged token, or its em-dash lacks surrounding spaces.
**Why it happens:** `hasPositiveComplement` requires literal ` — ` / ` -- ` (spaces both sides); `mustNot`/`shouldNot`/`antiPatterns`/`prohibited`/`forbidden` buckets have NO complement filter — the literal token must be removed entirely.
**How to avoid:** Re-run `node --test tests/negative-framing-scan.test.cjs` after every batch of edits. The fix is done when it reports `# fail 0` for that file.
**Warning signs:** A subtest still RED after an edit that "should" have fixed it.

### Pitfall 2: `#3242` fix regresses `#1589`
**What goes wrong:** Making `cmdStateJson` preserve `existingFm.progress` could stop it reflecting newly-added SUMMARY files (the exact thing #1589 fixed).
**Why it happens:** #1589 wants disk-derived freshness; #3242 Bug A wants curated-block authority. They pull opposite directions in the same function.
**How to avoid:** Read `tests/state.test.cjs:1706–1800` first. Check whether the #1589 test stores a frontmatter `progress` block — if it doesn't, "preserve curated `progress` when present" satisfies both. Run the FULL `tests/state.test.cjs` after the fix, not just `bug-3242-*`.
**Warning signs:** `tests/state.test.cjs` "progress counters correct after plan execution (#1589)" goes red.

### Pitfall 3: Forgetting the `todo` markers
**What goes wrong:** Bug A code is fixed but `bug-3242-*.test.cjs` still shows `# todo 3` — the test never actually gates anything, and Phase 34's "0 failures" gate passes vacuously.
**Why it happens:** A failing `todo` test exits 0; it is easy to "fix the code" and never notice the test isn't enforcing.
**How to avoid:** Plan 02 must explicitly remove `{ todo: '...' }` from all 3 tests (lines 107, 201, 295) and confirm `node --test tests/bug-3242-state-update-progress-trample.test.cjs` reports `# pass 7 # todo 0 # fail 0`.
**Warning signs:** `# todo` count > 0 in the bug-3242 test output after Phase 33.

## Code Examples

### Reproduce the scanner failures
```bash
# Source: tests/negative-framing-scan.test.cjs
node --test tests/negative-framing-scan.test.cjs
# Expect (before fix): 6 failing leaf subtests, all in this file
```

### Reproduce #3242 Bug A directly
```bash
# Source: verified reproduction during research
# state update preserves progress on DISK but `state json` re-derives it from disk scan
node get-shit-done/bin/gsd-tools.cjs state update "Last Activity" "<date>" --cwd "$T"
node get-shit-done/bin/gsd-tools.cjs state json --cwd "$T"   # progress.* wrong here
```

### Confirm full-suite state
```bash
# Source: scripts/run-tests.cjs
node scripts/run-tests.cjs
# Before Phase 33: tests 8307, pass 8297, fail 6, skipped 1, todo 3
# Target after Phase 33: fail 0, skipped 1 (intentional HDOC skip), todo 0
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `<anti_patterns>` XML tag in prompts | `<expected_patterns>` / affirmative-framed block | Phase 26 (FIX-01/FIX-03) | Scanner flags `<anti_patterns>` opening tag as a hard violation |
| `progress.percent = completedPlans / totalPlans` | `computeProgressPercent` = `min(plan_fraction, phase_fraction)` | `#3242` Bug B (commit `d52f9092`, already merged) | Bug B is DONE; only its `todo` marker needs removing |

**Deprecated/outdated:**
- The CONTEXT.md "Current scanner violations" list and "Files requiring scanner test additions" list are **partially stale**. Research re-ran the scanner: `debug.md` has 0 violations (CONTEXT listed 5 lines), `reapply-patches.md` has 1 violation at line 323 (not the lines CONTEXT listed), and `edit-phase.md` has more `dont` violations (273,275,276,277) than CONTEXT's "271, 273–277" implied. **Use the verified table in this RESEARCH.md, not CONTEXT.md's line numbers.**

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `#1589` test does not store a frontmatter `progress` block, so "preserve curated `progress` when present" satisfies both #1589 and #3242 Bug A | Workstream B / Pitfall 2 | If wrong, the `cmdStateJson` fix needs a more nuanced staleness heuristic. Mitigation: planner MUST read `tests/state.test.cjs:1706–1800` and run the full `state.test.cjs` — this converts A1 from assumed to verified. |
| A2 | "0 warnings" in FRAME-02 refers to hard-failure scanner output, and warn-only `cannot` lines are not in fix scope | Phase Requirements / FRAME-02 | If the user intends literal zero `[WARN]` lines, lines 340 & 358 of `reapply-patches.md` also need reframing. Low risk — warn-only buckets are explicitly informational per Phase 25 D-17, and prior phases never chased them. Planner should confirm with the user if ambiguous. |
| A3 | Suggested affirmative rewrites in the fix table are scanner-clean | Workstream A table | Some rewrites may still trip subtle helper rules. Fully mitigated by the mandatory "re-run the scanner" verification step — the scanner output is the gate, not the suggestion. |

## Open Questions

1. **Does the `#3242` Bug A fix in `cmdStateJson` regress `#1589`?**
   - What we know: `state.cjs` line 1116 unconditionally rebuilds `progress` from disk; #1589 wants that freshness; #3242 wants curated-block authority.
   - What's unclear: Whether #1589's test fixture uses a curated frontmatter `progress` block (if not, no conflict).
   - Recommendation: Plan 02 reads `tests/state.test.cjs:1706–1800` first, picks the fix, then runs the FULL `state.test.cjs` as a gate. Treat A1 as resolved only after that run is green.

2. **Should `reapply-patches.md` lines 340 & 358 (`cannot` warnings) be reframed?**
   - What we know: `cannot` is a warn-only bucket — never fails tests. FRAME-02 says "0 warnings."
   - What's unclear: Whether the requirement author meant literal-zero `[WARN]` output or zero hard-failure warnings.
   - Recommendation: Default to NOT fixing them (precedent: warn-only buckets are informational, never chased in Phases 25–32). If the planner wants to be safe, reframe line 340 (`A missing table absent ... cannot bypass this gate` → `Every gate run requires the table to be present...`) — line 358 is a long sentence where reframe is high-effort/low-value.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All tests, `state.cjs` | ✓ | v24.14.1 | — |
| npm | `npm test` wrapper | ✓ | 11.11.0 | — |
| `node:test` | Test framework | ✓ | built-in | — |

**Missing dependencies:** None. This phase is fully self-contained — markdown edits, one `.cjs` logic edit, one test-file marker removal.

## Validation Architecture

> `.planning/config.json` was not found in the working directory; `nyquist_validation` key absent → treated as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `node:test` (built-in, Node v24.14.1) |
| Config file | none — discovery via `scripts/run-tests.cjs` |
| Quick run command | `node --test tests/negative-framing-scan.test.cjs` (scanner workstream) / `node --test tests/bug-3242-state-update-progress-trample.test.cjs` (state workstream) |
| Full suite command | `node scripts/run-tests.cjs` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FRAME-01 | `debug.md` scanner-clean | corpus scan | `node --test tests/negative-framing-scan.test.cjs` (workflow corpus subtests) | ✅ exists |
| FRAME-02 | `reapply-patches.md` scanner-clean | corpus scan | `node --test tests/negative-framing-scan.test.cjs` (workflow corpus subtests) | ✅ exists |
| SCAN-12 | All 6 failing scanner subtests green | corpus scan | `node --test tests/negative-framing-scan.test.cjs` | ✅ exists |
| (D-03) `#3242` Bug A | `state json` preserves curated `progress.*` | integration | `node --test tests/bug-3242-state-update-progress-trample.test.cjs` | ✅ exists (3 `todo` markers must be removed) |

### Sampling Rate
- **Per task commit:** `node --test tests/negative-framing-scan.test.cjs` (Plan 01) / `node --test tests/bug-3242-state-update-progress-trample.test.cjs` + `node --test tests/state.test.cjs` (Plan 02)
- **Per wave merge:** `node scripts/run-tests.cjs`
- **Phase gate:** `node scripts/run-tests.cjs` reports `fail 0`, `todo 0`, `skipped 1` (the one intentional HDOC skip) before `/gsd-verify-work`.

### Wave 0 Gaps
- None — existing test infrastructure covers all phase requirements. `negative-framing-scan.test.cjs` already has the 6 failing subtests (RED gates exist). `bug-3242-*.test.cjs` already has all 3 tests written (just `todo`-marked).
- Optional (Claude's discretion): add a `debug.md`-specific and `reapply-patches.md`-specific guard subtest to `negative-framing-scan.test.cjs`. The `debug.md` one will be GREEN immediately (file is already clean); the `reapply-patches.md` one is RED until line 323 is fixed. These are regression guards, not blocking gaps.

## Security Domain

> `security_enforcement` config could not be read (`.planning/config.json` not in working dir). Phase 33 changes prompt-file prose and one read-path function in `state.cjs`. No new attack surface is introduced.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth code touched |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | No access control logic |
| V5 Input Validation | minimal | `state.cjs` already validates field names via `validateFieldName` (`security.cjs`) — the `#3242` fix is in `cmdStateJson` read logic and does not change input handling. No new validation needed. |
| V6 Cryptography | no | No crypto |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Regex injection via crafted field name in `state` commands | Tampering | Already mitigated — `validateFieldName` in `security.cjs`, `escapeRegex` on field names. The `#3242` fix does not alter this path. |
| Prompt-injection via reframed directive losing a security constraint | Tampering | The `secure-phase.md:76` rewrite must preserve the *meaning* of "an empty register still requires a real audit" — a careless affirmative rewrite could weaken the security gate. Verification: re-read the rewritten line for semantic equivalence; the constraint that no-planning does NOT mean skip-audit must survive. |

## Sources

### Primary (HIGH confidence)
- `tests/negative-framing-scan.test.cjs` — read in full; scanner logic, helper exclusions, all corpus subtests
- `tests/bug-3242-state-update-progress-trample.test.cjs` — read in full; 4 active + 3 `todo` tests
- `get-shit-done/bin/lib/state.cjs` — read `cmdStatePatch`, `cmdStateUpdate`, `readModifyWriteStateMd`, `cmdStateJson`, `buildStateFrontmatter`
- `scripts/run-tests.cjs` — read in full; test aggregation/exit-code behavior
- Direct execution: `node --test tests/negative-framing-scan.test.cjs` (6 fails enumerated), `node scripts/run-tests.cjs` (8307 tests / 6 fail / 1 skip / 3 todo / exit 1), live `state update` + `state json` reproduction of Bug A
- `git log` / `git merge-base` — confirmed commit `d52f9092` (#3242 fix) is an ancestor of HEAD
- `.planning/phases/33-positive-framing-pass/33-CONTEXT.md`, `33-DISCUSSION-LOG.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`

### Secondary (MEDIUM confidence)
- Phase 25–30 precedent (TDD RED gate, affirmative-replacement vocabulary, `<anti_patterns>`→`<expected_patterns>` rename) — referenced via CONTEXT.md canonical refs and inline comments in `negative-framing-scan.test.cjs`

### Tertiary (LOW confidence)
- Exact mechanism of the `cmdStateJson` fix and its interaction with `#1589` — see Assumptions Log A1 / Open Question 1. Must be verified by the planner against `tests/state.test.cjs`.

## Metadata

**Confidence breakdown:**
- Scanner fix scope (12 lines, 5 files, 6 subtests): HIGH — verified by running the scanner directly
- `debug.md` is already clean / CONTEXT line numbers stale: HIGH — verified by running the scanner against the file
- `#3242` Bug A root cause (`cmdStateJson`, not `cmdStateUpdate`): HIGH — verified by direct reproduction
- `#3242` Bug A *fix mechanism*: LOW — the correct change to `cmdStateJson` depends on the `#1589` test fixture; planner must verify
- Suggested affirmative rewrites: MEDIUM — directionally correct, but the scanner output is the authoritative gate

**Research date:** 2026-05-14
**Valid until:** 2026-06-13 (stable — internal fork files, no external dependencies; only invalidated by further edits to these specific files)
