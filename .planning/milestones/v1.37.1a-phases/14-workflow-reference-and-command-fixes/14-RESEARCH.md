# Phase 14: Workflow, Reference, and Command Fixes - Research

**Researched:** 2026-04-22
**Domain:** Prompt-engineering / affirmative-framing text edits in markdown files
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 (FRAMING-07):** `Do not reorder phases` → `Preserve the existing phase order — relocate only the dependency field`
- **D-02 (FRAMING-08):** `Do not continue with the steps below` → `Stop here — power mode handles all remaining steps`
- **D-03 (FRAMING-09):** `do not auto-fix pre-existing issues unrelated to current task` → `Scope auto-fixes to issues introduced by the current task only — leave pre-existing issues untouched`
- **D-04 (FRAMING-10):** Convert the full `Anti-Patterns` block — header (`Do NOT:`) AND all 7 list items — to positive imperative form. Each item already contains an em-dash complement; rewrite each as a standalone positive instruction.
- **D-05 (FRAMING-11):** Delete `get-shit-done/workflows/transition.md` line 567 entirely. No replacement.
- **D-06 (FRAMING-12):** Delete `get-shit-done/workflows/transition.md` line 568 entirely. No replacement.
- **D-07 (FRAMING-13):** `Do NOT invent example inputs` → `Source inputs exclusively from actual test fixtures and codebase examples`
- **D-08 (FRAMING-14):** `Do not flag these as MISSING:` → `Treat these as expected and exclude them from MISSING flags:`
- **D-09 (FRAMING-15):** `Do not infer that a flag is active just because it is documented in this prompt` → `` Treat a flag as active only if its literal token is present in `$ARGUMENTS` ``
- **D-10 (FRAMING-16):** Same rewrite as FRAMING-15 — identical phrasing for consistency: `` Treat a flag as active only if its literal token is present in `$ARGUMENTS` ``
- **D-11 (test update):** `tests/execute-phase-active-flags.test.cjs` line 50 — replace assertion string from `Do not infer that a flag is active just because it is documented in this prompt` to `` Treat a flag as active only if its literal token is present in `$ARGUMENTS` ``. No transition safety net.
- **D-12 (FRAMING-17):** `Do not proceed to cleanup until the user confirms they have resolved all unverified hunks.` → `Proceed to Step 6 only after the user confirms all unverified hunks are resolved`

### Claude's Discretion

- Exact wording for FRAMING-07, FRAMING-08, FRAMING-09, FRAMING-13, FRAMING-14, FRAMING-17 within the affirmative-instruction constraint — keep language consistent with the surrounding file style.
- For FRAMING-10 list items, apply the most natural positive imperative for each item — exact phrasing not prescribed.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FRAMING-07 | `analyze-dependencies.md:100` — bare `Do not reorder phases` replaced with positive instruction to preserve phase order | Line confirmed present; surrounding context at lines 97–103 read |
| FRAMING-08 | `discuss-phase.md:172` — bare `Do not continue with the steps below` replaced with positive stop instruction | Line confirmed present; surrounding context at lines 166–177 read |
| FRAMING-09 | `execute-plan.md:203` — bare `do not auto-fix pre-existing issues` replaced with positive scope boundary | Line confirmed present; surrounding context at lines 197–207 read |
| FRAMING-10 | `import.md:276` — list header `Do NOT:` and all 7 list items replaced with affirmative equivalents | Block confirmed at lines 274–283; all 7 items catalogued below |
| FRAMING-11 | `transition.md:567` — bare `Do NOT suggest /gsd-complete-milestone` deleted | Line confirmed; `**Stop here.**` at line 570 covers the intent |
| FRAMING-12 | `transition.md:568` — bare `Do NOT auto-invoke any further slash commands` deleted | Line confirmed; same rationale as FRAMING-11 |
| FRAMING-13 | `verify-phase.md:241` — bare `Do NOT invent example inputs` replaced with positive sourcing instruction | Line confirmed present; surrounding context at lines 235–246 read |
| FRAMING-14 | `planner-source-audit.md:30` — list header `Do not flag these as MISSING:` replaced with affirmative header | Line confirmed present; surrounding context at lines 24–35 read |
| FRAMING-15 | `commands/gsd/docs-update.md:42` — bare `Do not infer that a flag is active` replaced with positive inference rule | Line confirmed present; surrounding context at lines 37–47 read |
| FRAMING-16 | `commands/gsd/execute-phase.md:54` + `tests/execute-phase-active-flags.test.cjs:50` — same fix as FRAMING-15; test assertion updated to match new text | Both lines confirmed; test currently asserts the old negative string |
| FRAMING-17 | `commands/gsd/reapply-patches.md:271` — bare `Do not proceed to cleanup` replaced with positive sequencing gate | Line confirmed present; surrounding context at lines 265–275 read |
</phase_requirements>

---

## Summary

Phase 14 is a targeted text-edit pass: 11 bare "do not" directives are rewritten to affirmative instructions across 10 markdown files, and one test assertion in `tests/execute-phase-active-flags.test.cjs` is updated to match the new wording for FRAMING-16. The methodology is identical to Phase 13, which fixed 6 equivalent violations in agent files.

Every violation is confirmed present at the exact lines specified in REQUIREMENTS.md. The negative-framing scanner (`tests/negative-framing-scan.test.cjs`) currently reports 10 violations: 7 in workflow files, 1 in reference files, and 3 in command files — matching all 11 FRAMING IDs (FRAMING-10 is reported as 1 line by the scanner because only the header line `Do NOT:` is bare; the 7 list items each have em-dash complements that suppress scanner detection, but D-04 requires converting all 7 items anyway per CONTEXT.md). After edits, the scanner must report 0 violations across all scanned directories.

The test file `execute-phase-active-flags.test.cjs` must be updated atomically with `execute-phase.md` so the suite does not enter a broken intermediate state.

**Primary recommendation:** Execute each fix as a separate atomic Edit (read surrounding context → apply single line change → verify). For FRAMING-10, convert the `Anti-Patterns` section as a block rewrite. For FRAMING-11/12, delete both lines in one Edit call. Update the test immediately after FRAMING-16. Gate the task sequence with `npm test` at the end to confirm all 3 failing suites turn green.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Affirmative-framing edit (workflows) | Prompt file (get-shit-done/workflows/) | — | These are AI behavioral directives; no runtime tier |
| Affirmative-framing edit (references) | Prompt file (get-shit-done/references/) | — | Same — reference files are consumed by agents |
| Affirmative-framing edit (commands) | Prompt file (commands/gsd/) | — | Command files are prompt shells for Claude Code slash commands |
| Test assertion sync | Test file (tests/) | — | Node.js test suite; no application runtime involved |

---

## Exact Current Text at Each Target Line

[VERIFIED: direct file read]

### FRAMING-07 — `get-shit-done/workflows/analyze-dependencies.md:100`

```
- Do not reorder phases
```

Surrounding context (lines 97–103):
```
- Locate the phase entry and add or update the `Depends on:` field
- Preserve all other phase content unchanged
- Do not reorder phases

After applying: "ROADMAP.md updated. Run `/gsd-manager` to execute phases in the correct order."
```

**Prescribed replacement (D-01):** `- Preserve the existing phase order — relocate only the dependency field`

Note: the em-dash form is already compliant with the scanner's `hasPositiveComplement()` check, but D-01 uses it as the affirmative rewrite, not as a complement pair — the "do not" text is removed entirely.

---

### FRAMING-08 — `get-shit-done/workflows/discuss-phase.md:172`

```
- Do not continue with the steps below
```

Surrounding context (lines 169–176):
```
**Power mode** — If `--power` is present in ARGUMENTS:
- Skip interactive questioning entirely
- Read and execute @~/.claude/get-shit-done/workflows/discuss-phase-power.md end-to-end
- Do not continue with the steps below
```

**Prescribed replacement (D-02):** `- Stop here — power mode handles all remaining steps`

---

### FRAMING-09 — `get-shit-done/workflows/execute-plan.md:203`

```
- **Scope boundary**: do not auto-fix pre-existing issues unrelated to current task
```

Surrounding context (lines 198–207):
```
## Deviation Rules

Apply deviation rules from the gsd-executor agent definition (single source of truth):
- **Rules 1-3** (bugs, missing critical, blockers): auto-fix, test, verify, track as deviations
- **Rule 4** (architectural changes): STOP, present decision to user, await approval
- **Scope boundary**: do not auto-fix pre-existing issues unrelated to current task
- **Fix attempt limit**: max 3 retries per deviation before escalating
- **Priority**: Rule 4 (STOP) > Rules 1-3 (auto) > unsure → Rule 4
```

**Prescribed replacement (D-03):** `- **Scope boundary**: Scope auto-fixes to issues introduced by the current task only — leave pre-existing issues untouched`

---

### FRAMING-10 — `get-shit-done/workflows/import.md:276` (+ list items 277–283)

Current block (lines 274–283):
```markdown
## Anti-Patterns

Do NOT:
- Use markdown tables (`|---|`) in the conflict detection report — use plain-text [BLOCKER]/[WARNING]/[INFO] labels
- Write PLAN.md files as `PLAN-01.md` or `plan-01.md` — always use `{NN}-{MM}-PLAN.md`
- Use `pbr:plan-checker` or `pbr:planner` — use `gsd-plan-checker` and `gsd-planner`
- Write `.planning/.active-skill` — this is a PBR pattern with no GSD equivalent
- Reference `pbr-tools`, `pbr:`, or `PLAN-BUILD-RUN` anywhere
- Write any PLAN.md file when blockers exist — the safety gate must hold
- Skip path validation on the --from file argument
```

**Prescribed replacement (D-04):** Convert the header and all 7 items to positive imperatives. The scanner only flags the header line (`Do NOT:`) because each list item already has an em-dash complement (which triggers `hasPositiveComplement()`). However, CONTEXT.md D-04 requires converting all 7 items regardless — positive imperative style, not em-dash complement pairs. Example conversions (exact wording at Claude's discretion):

| Current (negative) | Positive imperative form |
|--------------------|--------------------------|
| `Do NOT:` header | `## Correct Patterns` or `## Required Patterns` (rename section heading) |
| `Use markdown tables... — use plain-text [BLOCKER]/[WARNING]/[INFO] labels` | `Use plain-text [BLOCKER]/[WARNING]/[INFO] labels in the conflict detection report` |
| `Write PLAN.md files as PLAN-01.md... — always use {NN}-{MM}-PLAN.md` | `Name PLAN.md files using the {NN}-{MM}-PLAN.md format` |
| `Use pbr:plan-checker or pbr:planner — use gsd-plan-checker and gsd-planner` | `Use gsd-plan-checker and gsd-planner for plan checking and planning` |
| `Write .planning/.active-skill — this is a PBR pattern with no GSD equivalent` | `Omit .planning/.active-skill — this PBR pattern has no GSD equivalent` |
| `Reference pbr-tools, pbr:, or PLAN-BUILD-RUN anywhere` | `Use only GSD-native tool names and prefixes` |
| `Write any PLAN.md file when blockers exist — the safety gate must hold` | `Hold the safety gate: skip PLAN.md creation when blockers exist` |
| `Skip path validation on the --from file argument` | `Validate the --from file argument path before proceeding` |

These are suggestions; the executor has discretion on exact wording per Claude's Discretion in CONTEXT.md.

---

### FRAMING-11 + FRAMING-12 — `get-shit-done/workflows/transition.md:567–568`

Current lines 565–572:
```
---
```

Do NOT suggest `/gsd-complete-milestone` or `/gsd-new-milestone`.
Do NOT auto-invoke any further slash commands.

**Stop here.** The user must explicitly decide what to do next.
```

**Prescribed replacement (D-05, D-06):** Delete lines 567 and 568 entirely. The `**Stop here.**` line at 570 (which becomes 568 after deletion) already covers the intent positively.

Result after deletion:
```
---
```

**Stop here.** The user must explicitly decide what to do next.
```

---

### FRAMING-13 — `get-shit-done/workflows/verify-phase.md:241`

```
   Do NOT invent example inputs.
```

Surrounding context (lines 235–246):
```
1. Check if the command exists and required inputs are available:
   - Look for example files in `templates/`, `fixtures/`, `test/`, `examples/`, or `testdata/`
   - Check if the CLI binary/script exists on PATH or in the project
2. **If no suitable inputs or fixtures exist:** Mark as `? NEEDS HUMAN` with reason
   "No test fixtures available — requires manual verification" and move on.
   Do NOT invent example inputs.
3. If inputs are available: run the command and verify it exits successfully.
```

**Prescribed replacement (D-07):** `   Source inputs exclusively from actual test fixtures and codebase examples.`

---

### FRAMING-14 — `get-shit-done/references/planner-source-audit.md:30`

```
Do not flag these as MISSING:
```

Surrounding context (lines 28–35):
```
### What is NOT a Gap

Do not flag these as MISSING:
- Items in `## Deferred Ideas` in CONTEXT.md — developer chose to defer these
- Items scoped to a different phase via `phase_req_ids` — not assigned to this phase
- Items in RESEARCH.md explicitly marked "out of scope" or "future work" by the researcher
```

**Prescribed replacement (D-08):** `Treat these as expected and exclude them from MISSING flags:`

---

### FRAMING-15 — `commands/gsd/docs-update.md:42`

```
- Do not infer that a flag is active just because it is documented in this prompt
```

Surrounding context (lines 37–47):
```
**Active flags must be derived from `$ARGUMENTS`:**
- `--force` is active only if the literal `--force` token is present in `$ARGUMENTS`
- `--verify-only` is active only if the literal `--verify-only` token is present in `$ARGUMENTS`
- If neither token appears, run the standard full-phase generation flow
- Do not infer that a flag is active just because it is documented in this prompt
```

**Prescribed replacement (D-09):** ``- Treat a flag as active only if its literal token is present in `$ARGUMENTS` ``

---

### FRAMING-16 — `commands/gsd/execute-phase.md:54` + `tests/execute-phase-active-flags.test.cjs:50`

Current line 54:
```
- Do not infer that a flag is active just because it is documented in this prompt
```

Surrounding context (lines 48–57):
```
**Active flags must be derived from `$ARGUMENTS`:**
- `--wave N` is active only if the literal `--wave` token is present in `$ARGUMENTS`
- `--gaps-only` is active only if the literal `--gaps-only` token is present in `$ARGUMENTS`
- `--interactive` is active only if the literal `--interactive` token is present in `$ARGUMENTS`
- If none of these tokens appear, run the standard full-phase execution flow with no flag-specific filtering
- Do not infer that a flag is active just because it is documented in this prompt
```

**Prescribed replacement (D-10):** ``- Treat a flag as active only if its literal token is present in `$ARGUMENTS` ``

**Test update (D-11):** `tests/execute-phase-active-flags.test.cjs` line 50 currently asserts:
```javascript
content.includes('Do not infer that a flag is active just because it is documented in this prompt'),
```
Must become:
```javascript
content.includes('Treat a flag as active only if its literal token is present in `$ARGUMENTS`'),
```
The failure message string on line 51 should also be updated to reflect positive framing:
```javascript
'context should require deriving flag state from $ARGUMENTS literal token'
```

---

### FRAMING-17 — `commands/gsd/reapply-patches.md:271`

```
Do not proceed to cleanup until the user confirms they have resolved all unverified hunks.
```

Surrounding context (lines 265–275):
```
The backup is preserved at: {patches_dir}/{file}
Review the merged file manually, then either:
  (a) Re-merge the missing content by hand, or
  (b) Restore from backup: cp {patches_dir}/{file} {installed_path}
```

Do not proceed to cleanup until the user confirms they have resolved all unverified hunks.

**Only when all rows show `verified: yes`** (or when all files had zero user-added hunks) may execution continue to Step 6.

## Step 6: Cleanup option
```

**Prescribed replacement (D-12):** `Proceed to Step 6 only after the user confirms all unverified hunks are resolved.`

---

## Standard Stack

No new libraries. This phase is pure markdown text editing using:
- **Read tool** — read surrounding context before each edit
- **Edit tool** — targeted single-line or block replacement (preferred over Write for minimal diffs)
- **Bash tool** — run `npm test` to verify the scanner and test suite pass

[VERIFIED: direct inspection of all target files]

---

## Architecture Patterns

### Edit Protocol (applies to every FRAMING ID)

**Pre-edit:** Read the surrounding context window specified in CONTEXT.md canonical_refs before touching the file. This prevents clobbering adjacent content.

**Edit tool use:** Use Edit (not Write) for all changes — Edit sends only the diff, reducing risk of accidental whitespace changes or line-ending mutations.

**FRAMING-10 exception:** The `Anti-Patterns` block (lines 274–283 in import.md) is a cohesive section rewrite. Use Edit with the full block as old_string and the replacement block as new_string to update header + all 7 items atomically.

**FRAMING-11/12 deletion:** Use Edit targeting lines 567–568 as old_string → empty new_string. Verify the surrounding `---` and `**Stop here.**` lines remain intact.

**Atomicity constraint (FRAMING-16):** The source file edit and the test assertion update must be done in the same plan wave or sequential tasks to prevent the test suite entering a broken state where the source has changed but the test still asserts the old string.

### Recommended Task Grouping

Given 11 edits across 10 files + 1 test file, group by file to reduce context-switching:

1. Workflow files (FRAMING-07 through FRAMING-13) — 6 edits across 6 files
2. Reference file (FRAMING-14) — 1 edit
3. Command files + test (FRAMING-15, FRAMING-16 + test, FRAMING-17) — 3 edits + 1 test update
4. Verification: `npm test` gate — confirm 0 failures in all 3 previously-failing suites

### Verification Sequence

```bash
# After all edits
npm test 2>&1 | grep -E "(✓|✖|pass|fail)" | tail -20

# Targeted check for the 4 suites that must pass
npm test 2>&1 | grep -E "no bare DO NOT directives|context explicitly warns"
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Finding the exact violation lines | Shell grep loop | Read tool at specified offsets | Lines are already confirmed — re-reading at offsets is faster and avoids false matches |
| Checking if rewrite introduces new violations | Manual regex | Run `npm test` | `negative-framing-scan.test.cjs` already implements the full detection logic |

---

## Common Pitfalls

### Pitfall 1: Em-dash complement masking scanner violations in FRAMING-10 list items

**What goes wrong:** The scanner's `hasPositiveComplement()` returns `true` for any line containing ` — ` (em-dash with spaces). The 7 list items in import.md all have em-dash complements, so the scanner does NOT flag them — only the `Do NOT:` header is reported as a violation. An executor might therefore rewrite only the header and consider FRAMING-10 done.

**Why it happens:** CONTEXT.md D-04 explicitly says to convert all 7 items, not just the header. The scanner passing ≠ requirement met.

**How to avoid:** Convert the full Anti-Patterns block (header + all 7 items) per D-04. Post-edit, the scanner passes because there are no negative lines left, not because the items were left unchanged.

**Warning signs:** Post-edit `npm test` passes for the workflow suite but the Anti-Patterns block still has em-dash forms like `- Use X — do Y`.

### Pitfall 2: Test suite broken mid-execution for FRAMING-16

**What goes wrong:** Source file is edited (old `Do not infer...` removed) but test is updated in a separate wave/later task. Between the two tasks, `execute-phase-active-flags.test.cjs:50` fails because it asserts the now-deleted string.

**How to avoid:** Update `execute-phase.md` and `execute-phase-active-flags.test.cjs` in the same sequential task batch, or in consecutive tasks within the same wave.

### Pitfall 3: Stray whitespace or line ending changes from Write tool

**What goes wrong:** Using Write to replace a file resets indentation or introduces trailing whitespace, which may affect downstream tests that do exact string matching.

**How to avoid:** Use Edit exclusively for all changes. Read surrounding context first to preserve indentation (some lines in these files use 3-space indentation for sub-bullets).

### Pitfall 4: Deleting wrong lines for FRAMING-11/12

**What goes wrong:** Line numbers shift after upstream edits or if the file has been modified since the context was read. Deleting by line number without reading surrounding context first may remove the wrong lines.

**How to avoid:** Always read lines 562–575 first (per canonical_refs) and use Edit with the exact string match, not line-number-based replacement.

### Pitfall 5: FRAMING-14 header rewrite changes list semantics

**What goes wrong:** The section header `Do not flag these as MISSING:` is a list header. The replacement must still function as a header for the 3 bullet items that follow. A rewrite that adds a colon at end (as `Treat these as expected and exclude them from MISSING flags:`) maintains this structural role.

**How to avoid:** Preserve the colon at the end of the replacement header so the following bullets still attach to it grammatically.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` |
| Config file | none — tests run via `npm test` in package.json |
| Quick run command | `npm test 2>&1 \| grep -E "(pass\|fail)"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FRAMING-07 | No bare DO NOT in workflow files | corpus scan | `npm test 2>&1 \| grep "no bare DO NOT directives in workflow files"` | ✅ (negative-framing-scan.test.cjs) |
| FRAMING-08 | No bare DO NOT in workflow files | corpus scan | same | ✅ |
| FRAMING-09 | No bare DO NOT in workflow files | corpus scan | same | ✅ |
| FRAMING-10 | No bare DO NOT in workflow files | corpus scan | same | ✅ |
| FRAMING-11 | No bare DO NOT in workflow files | corpus scan | same | ✅ |
| FRAMING-12 | No bare DO NOT in workflow files | corpus scan | same | ✅ |
| FRAMING-13 | No bare DO NOT in workflow files | corpus scan | same | ✅ |
| FRAMING-14 | No bare DO NOT in reference files | corpus scan | `npm test 2>&1 \| grep "no bare DO NOT directives in reference files"` | ✅ |
| FRAMING-15 | No bare DO NOT in command files | corpus scan | `npm test 2>&1 \| grep "no bare DO NOT directives in command files"` | ✅ |
| FRAMING-16 | No bare DO NOT in command files + test assertion matches new text | corpus scan + unit | `npm test 2>&1 \| grep -E "(no bare DO NOT directives in command files\|context explicitly warns)"` | ✅ |
| FRAMING-17 | No bare DO NOT in command files | corpus scan | same | ✅ |

### Sampling Rate

- **Per edit:** no intermediate test run required (edits are text-only)
- **Per wave merge:** `npm test` — full suite must pass (4164 pass, 0 fail target)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

None — existing test infrastructure covers all phase requirements. The 3 failing suites already exist and already target the exact lines being fixed.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `npm test` | ✓ | (project default) | — |
| npm | test runner | ✓ | (project default) | — |

Step 2.6: No external tool dependencies beyond the project's own Node.js test suite.

---

## Security Domain

Step 2.6 SKIPPED — this phase makes no security-relevant changes. All edits are prompt-text rewrites in markdown files with no secrets, auth, or data flow changes. ASVS categories do not apply.

---

## Open Questions

None. All 11 violation lines confirmed present at the specified offsets. All prescribed replacement texts are fully specified in CONTEXT.md decisions or have Claude's Discretion for exact wording. The test update is fully specified (D-11).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The 7 list items in FRAMING-10 each have em-dash complements that suppress scanner detection — only the header is flagged | FRAMING-10 exact text | If any list item is also bare (no em-dash), the scanner would already be flagging it; current test output confirms only 1 violation per the workflow count mapping, so assumption is correct [VERIFIED: npm test output shows "6 !== 0" for workflow violations matching exactly the 7 FRAMING IDs 07–13, not 14] |

**Note on A1:** The test output shows `6 !== 0` for workflow violations (7 target lines: FRAMING-07 through FRAMING-13). The scanner counts 6 violations, which means `import.md:276` header contributes 1 and the 7 list items contribute 0 (their em-dash content suppresses detection). This confirms the scanner sees 6 violations: `analyze-dependencies.md:100`, `discuss-phase.md:172`, `execute-plan.md:203`, `import.md:276` (header only), `transition.md:567`, `transition.md:568`, `verify-phase.md:241` — that is 7 lines but the test says 6. Re-reading: the test message lists exactly those 6 files with violation counts. The import.md entry reads "line 276: Do NOT:" — that is 1 violation. Transition.md lists both lines 567 and 568 — that is 2. Total = 1+1+1+1+2+1 = 7. The `actual: 6` means 6 file-groups, not 6 lines. Either way, FRAMING-10 list items are confirmed not separately flagged. [VERIFIED: npm test output]

**All other claims:** Verified by direct file reads in this session.

---

## Sources

### Primary (HIGH confidence)

- Direct file reads of all 10 target files at specified line offsets — current text confirmed [VERIFIED]
- `tests/negative-framing-scan.test.cjs` — scanner logic read in full [VERIFIED]
- `tests/execute-phase-active-flags.test.cjs` — test assertion at line 50 confirmed [VERIFIED]
- `npm test` output — current 3 failing suites confirmed, violation lines listed [VERIFIED]
- `.planning/phases/14-workflow-reference-and-command-fixes/14-CONTEXT.md` — all decisions read [VERIFIED]
- `.planning/REQUIREMENTS.md` — all FRAMING IDs read [VERIFIED]

---

## Metadata

**Confidence breakdown:**
- Target line identification: HIGH — all lines read directly from files
- Replacement wording: HIGH for D-09/D-10/D-11 (fully prescribed); MEDIUM for D-01/D-02/D-03/D-07/D-08/D-12 (prescribed with discretion range); MEDIUM for FRAMING-10 list items (pattern given, exact wording at executor discretion)
- Test impact: HIGH — test file read in full, exact string to replace identified

**Research date:** 2026-04-22
**Valid until:** 2026-05-22 (stable domain — markdown text, no library dependencies)
