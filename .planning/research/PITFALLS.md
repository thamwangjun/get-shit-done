# Pitfalls Research: Step-Number Normalization for Markdown Prompt Corpus

**Domain:** Static text analysis and renumbering of step labels in AI prompt files (`agents/`, `commands/gsd/`, `get-shit-done/workflows/`)
**Researched:** 2026-05-30
**Confidence:** HIGH (based on direct file inspection of all four required files, full test suite grep, and format inventory across 90+ workflow/agent files)

---

## False Positive Risks

Patterns that look like decimal step labels but are NOT step labels and must not be renumbered.

---

### 1. Sub-step Labels Nested Inside a Numbered List Item (execute-phase.md Steps 7.0–7.3)

**What goes wrong:** The scanner finds `**Step 7.0 —`, `**Step 7.1 —`, `**Step 7.2 —`, `**Step 7.3 —` and treats them as peer step headings to be renumbered. They are not: they are sub-steps within numbered list item `7. Handle failures:` inside the `execute_waves` `<step>` block.

**Why it happens:** The scanner looks for the `**Step N.N` pattern in prose. These four lines match. But restructuring them as `**Step 8 —`, `**Step 9 —`, etc. would destroy the parent–child relationship and break the failure classification logic that readers use to navigate.

**Actual text location:** `get-shit-done/workflows/execute-phase.md` lines 925, 934, 947, 949 — all indented inside a numbered list under `7. **Handle failures:**`.

**Prevention:** The scanner regex must require that the step label appears at the start of an unindented line (or as an unindented heading), not indented with spaces. A leading-spaces test (`^\s{3,}`) identifies nested list items to skip.

**Phase flag:** STEP-01 scanner design must include this guard.

---

### 2. Inline Cross-References That Contain a Step Number (Not a Heading)

**What goes wrong:** The scanner matches `Step 3.5` in `"the PRD express path (Step 3.5) creates CONTEXT.md"` (plan-phase.md line 159) as a step heading to renumber. It is a parenthetical cross-reference inside a prose paragraph, not a heading.

**Why it happens:** The regex `Step [0-9]+\.[0-9]` does not distinguish heading context from inline prose context. Renaming the heading `## 3.5.` is correct; renaming the inline reference `(Step 3.5)` is also correct — but they are a pair and must be updated atomically, not matched by two independent regex passes.

**Additional instances:**
- `plan-phase.md:338` — `"step 3.5/3.6"` in a Skip-if guard
- `plan-phase.md:807` — `"Step 7.8 (or Step 8 if pattern mapper is disabled)"`
- `plan-phase.md:1004` — `"proceed to step 8.5 instead"`
- `plan-phase.md:605,619,691` — `"step 5.6"`, `"step 5.7"` in conditional skip text
- `gsd-phase-researcher.md:657` — `"continue to Step 1.5 without graph context"`
- `gsd-phase-researcher.md:776` — `"Step 2.6: SKIPPED"` as a literal string the model emits at runtime

**Prevention:** After renaming a heading, the script must scan the entire file for inline mentions of that exact old step label string and update them too. A single-pass substitution from old label to new label across the whole file (not just heading lines) is the correct approach.

**Phase flag:** STEP-02 normalization must include whole-file inline-reference update per file.

---

### 3. The `Step 2.6: SKIPPED` Emitted String

**What goes wrong:** `gsd-phase-researcher.md:776` contains:

```
output: "Step 2.6: SKIPPED (no external dependencies identified)" and move on.
```

This is a literal string the AI model emits at runtime — not a heading label. Renaming the heading `## Step 2.6` to `## Step 4` (for example) must also update this runtime-emitted string, or the model will emit `"Step 2.6: SKIPPED"` while the heading no longer exists at that number.

**Prevention:** Treat runtime-emitted step label strings the same as inline cross-references: include them in the whole-file substitution sweep.

---

### 4. Plan-Phase Format Uses `## N.N.` Not `## Step N.N`

**What goes wrong:** The scanner looks for `## Step N.N` or `**Step N.N` patterns but misses the `## N.N.` format used in `plan-phase.md`, `new-project.md`, `new-milestone.md`, `audit-milestone.md`, and `plan-review-convergence.md`. These files have decimal steps like `## 1.5.`, `## 5.5.`, `## 5.55.`, `## 7.5`, `## 8.5.`, `## 12.5` — but the scanner never fires because `"## Step"` is not present.

**Example:** `plan-phase.md:595` has `## 5.55. Security Threat Model Gate` — a triple-decimal label that no naive regex will handle without ambiguity.

**Why it happens:** There are four distinct step-heading formats in use:

| Format | Files |
|--------|-------|
| `## Step N[.N]: Title` | `agents/gsd-phase-researcher.md`, `agents/gsd-verifier.md`, `agents/gsd-debug-session-manager.md`, `agents/gsd-integration-checker.md`, `agents/gsd-plan-checker.md`, others |
| `**Step N[.N]: Title**` | `get-shit-done/workflows/quick.md`, `get-shit-done/workflows/progress.md`, `get-shit-done/workflows/plan-phase.md` (inline refs), `get-shit-done/workflows/execute-phase.md` (inline refs) |
| `## N[.N][.N]. Title` | `get-shit-done/workflows/plan-phase.md`, `get-shit-done/workflows/new-project.md`, `get-shit-done/workflows/new-milestone.md`, `get-shit-done/workflows/audit-milestone.md`, `get-shit-done/workflows/plan-review-convergence.md` |
| `<step name="...">` | `get-shit-done/workflows/execute-phase.md`, `get-shit-done/workflows/execute-plan.md`, and ~40 other workflow files |

Files using `<step name=>` are already whole-integer-free by design — `name` is a slug, not a number. They need no renumbering.

**Prevention:** The scanner must handle all three text-based formats. The `<step name=>` files can be excluded from scanning.

**Phase flag:** STEP-01 scanner must register all three heading formats.

---

### 5. Letter-Suffixed Sub-Steps in gsd-verifier.md

**What goes wrong:** `agents/gsd-verifier.md` contains `## Step 3b:`, `## Step 4b:`, `## Step 7b:`, `## Step 7c:`, `## Step 9b:`. These are NOT decimal steps (`3.0` / `3.1`) — they use letter suffixes. A regex like `Step [0-9]+[a-z]` would falsely flag them as decimal violations, or a broad decimal scanner might match `3b` if the pattern is not anchored correctly.

**Additionally:** Two tests (`agent-frontmatter.test.cjs` lines 289–308, `bug-3321-verifier-runs-probes.test.cjs` lines 12–37) assert on the exact text `Step 4b: Data-Flow Trace`, `Step 7b: Behavioral Spot-Checks`, and `Step 7c: Probe Execution`. Renaming these would fail those tests.

**Prevention:** The decimal step pattern must match `Step N.N` (digit DOT digit), not `Step Na` (digit letter). Letter-suffixed steps are intentional sub-steps and must not be touched.

---

### 6. Numeric Patterns in Code Fences That Mention "Step"

**What goes wrong:** Code blocks inside workflow files contain bash comments and inline documentation. For example, `get-shit-done/workflows/execute-phase.md` has a bash comment block like `# ── Step 2.5: Research gate (#1602) ──` inside inline code. (The SDK source at `sdk/src/phase-runner.ts` also has this pattern, but the SDK is out of scope per PROJECT.md `SCAN_DIRS`.)

**Prevention:** Code fence context tracking — lines between ` ``` ` delimiters are skipped by the scanner.

---

### 7. False Positives From Version Numbers and File Names in Proximity to "Step"

**What goes wrong:** A line like `"Proceed to install step (treat as version 0.0.0 for comparison)"` (update.md:289) contains `0.0.0` but not in a step-label format. No false positive risk if the regex requires `Step [0-9]+\.[0-9]+` as a standalone label (preceded by `##`, `###`, `**`, or beginning of a bold inline). However, a naive line-scan for `[0-9]+\.[0-9]+` without anchoring to `Step` would produce false positives from version numbers throughout the corpus.

**Prevention:** Pattern must include the literal word `Step` as a prefix.

---

## Normalization Edge Cases

---

### 1. Whole-Integer Steps Shift When Decimal Inserts Are Renumbered

**What goes wrong:** `quick.md` has 15 steps: `1, 2, 2.5, 3, 4, 4.5, 4.75, 5, 5.5, 5.6, 6, 6.25, 6.5, 7, 8`. If decimal inserts are renumbered to fill gaps, the resulting sequence is `1–15`. The old `Step 3` becomes `Step 4`; the old `Step 6` becomes `Step 11`; the old `Step 8` becomes `Step 15`.

**Tests that break:**
- `tests/bug-2432-quick-plan-predispatch-commit.test.cjs` — asserts `content.indexOf('Step 6:')` is not -1 and is after `Step 5.6` (4 separate assertions)
- `tests/quick-branching.test.cjs` — asserts `content.indexOf('Step 3: Create task directory')` appears after `Step 2.5`
- `tests/bug-2523-quick-deferred-items.test.cjs` — asserts `content.indexOf('Step 8: Final commit')` is not -1
- `tests/quick-commit-boundary.test.cjs` — asserts `Step 8` file list content
- `tests/bug-3805-fast-md-log-to-state-schema.test.cjs` — asserts `quick.md Step 7` column discipline
- `tests/bug-2334-quick-gsd-sdk-preflight.test.cjs` — asserts `Step 2 must exist`
- `tests/bug-3426-codex-windows-hooks.test.cjs` — references `Step 3:` and `Step 6:`
- `tests/quick-research.test.cjs` — asserts on `Step 5:` position

**Prevention:** These tests must be updated in the same commit that renumbers the steps. The test updates are mandatory, not optional.

**Phase flag:** STEP-02 and GATE-01 — the test suite is the gate; these files need co-editing.

---

### 2. Step 0 (Zero-Based Steps Are Valid and Must Not Be Renumbered to 1)

**What goes wrong:** `agents/gsd-verifier.md`, `agents/gsd-planner.md`, and `commands/gsd/graphify.md` use `## Step 0:` as a legitimate pre-condition check that runs before the main numbered sequence. A normalizer that "starts counting at 1" would wrongly rename Step 0 to Step 1.

**Prevention:** Step 0 is a valid label. Normalization must treat it as a semantic marker (pre-condition gate), not a decimal violation. The scanner should not flag `Step 0` as a violation unless the subsequent steps also have `.0` fractions (e.g., `Step 0.5` would be a violation; `Step 0` alone is not).

---

### 3. Non-Sequential Existing Numbering in plan-phase.md

**What goes wrong:** `plan-phase.md` has steps numbered `0, 1, 1.5, 2, 2.5, 3, 3.5, 3.6, 4, 4.5, 5, 5.0, 5.1, 5.5, 5.55, 5.6, 5.7, 6, 7, 7.5, 7.8, 8, 8.5, 8.5.1, 8.5.2, 9, 10, 11, 12, 12.5, 13` — with gaps (no 10.5 between 10 and 11) and a triple-decimal `5.55`.

If a normalizer walks the steps sequentially and renumbers based on occurrence order, it must handle:
- `## 5.55.` — currently sandwiched between `## 5.5.` and `## 5.6.`. Renaming to `## 6.` would place it between steps 5 and 6 regardless of original intent.
- `## 8.5.1` and `## 8.5.2` — these are sub-steps of `## 8.5.`. Renaming 8.5 to 9 but leaving 8.5.1/8.5.2 unchanged would produce `## 9.`, `## 8.5.1.`, `## 8.5.2.` — inconsistent.

**Tests that would break:**
- `tests/plan-bounce.test.cjs` — asserts `content.includes('## 12.5')`
- `tests/enh-2310-chunked-plan-phase.test.cjs` — asserts `content.includes('## 8.5.')` and `content.includes('8.5')` in multiple checks
- `tests/post-planning-gaps-2493.test.cjs` — asserts `content.indexOf('## 14.')` exists with step 13b, 13c, 13d, 13e, 14 ordering
- `tests/bug-2399-commit-docs-plan-phase.test.cjs` — asserts ordering of `## 13b.`, `## 13c.`, `## 14.`
- `tests/ai-evals.test.cjs` — asserts on `plan-phase Step 4.5 AI keyword nudge block`
- `tests/milestone.test.cjs` — asserts `content.slice(content.indexOf('## 3.5'), content.indexOf('## 4.'))` for content between steps 3.5 and 4

**Prevention:** The normalization strategy must be defined per-file format, with a plan for handling sub-steps (8.5.1 → 9.1?) rather than assuming flat linear sequences. Tests must be co-updated.

---

### 4. Conditional Step Labels as Model Output Strings

**What goes wrong:** `gsd-phase-researcher.md:776` instructs the AI to output `"Step 2.6: SKIPPED (no external dependencies identified)"` as a literal console message. After renumbering Step 2.6 to (say) Step 4, the model must emit `"Step 4: SKIPPED"` — but no automatic renaming tool will find this unless it treats instructed-output strings the same as inline cross-references.

**Deeper case:** `agents/gsd-verifier.md` refers to `## Step 0: Check for Previous Verification` both as a heading and in a checklist item at line 899: `- [ ] Previous VERIFICATION.md checked (Step 0)`. The checklist item is an inline reference that must be updated along with the heading.

---

### 5. The `**Step N.N — description**` Dash-Separator Variant in execute-phase.md

**What goes wrong:** Steps 7.0–7.3 in `execute-phase.md` use an em-dash separator: `**Step 7.0 — classify before branching**`. A normalizer handling colons (`Step N.N:`) may miss this dash-separated variant.

**Prevention:** Pattern must handle both `**Step N.N:` and `**Step N.N —` as valid step label delimiters.

---

## Cross-Reference Pitfalls

---

### 1. execute-plan.md Contains Three Cross-File References to execute-phase.md Step 5.5

**What goes wrong:** `get-shit-done/workflows/execute-plan.md` at lines 143, 369, and 475 contains the phrase `execute-phase.md step 5.5`. These are inline cross-file references. After renaming `execute-phase.md`'s step 5.5, these three occurrences in a different file become stale.

**Test impact:** `tests/execute-phase-step-5-5-deviation-doc.test.cjs` locates the step 5.5 block using `content.indexOf('\n5.5.')` and `content.indexOf('\n5.6.')` as delimiters. This test searches the execute-phase.md source directly — it would break if `5.5.` changed to another number. Additionally, the test's comment (`guards that step 5.5 of execute-phase.md documents...`) would become stale documentation but not a test failure.

**Prevention:** The normalization script must:
1. Track all renames performed in each file
2. After renaming, scan the entire corpus for `<filename> step N.N` patterns matching any renamed step
3. Update cross-file references in those other files

This is a two-pass algorithm: first pass renames within each file, second pass updates cross-file references using the rename map.

---

### 2. plan-phase.md and plan-phase.md's Own Inline References Are Self-Referential

**What goes wrong:** `plan-phase.md:338` contains `"step 3.5/3.6"` as a skip-guard cross-reference to the file's own earlier steps. `plan-phase.md:807` contains `"Step 7.8 (or Step 8 if pattern mapper is disabled)"` referencing two of its own steps. `plan-phase.md:605,619` reference `"step 5.6"` as conditional skip targets. All are same-file internal references that must be updated when headings are renamed.

**Additional:** `tests/milestone.test.cjs:662` does `content.slice(content.indexOf('## 3.5'), content.indexOf('## 4.'))` to extract a block for content checking. If `## 3.5` is renumbered, the test produces an empty slice and silent false-pass.

---

### 3. Test Files Assert Exact Step Heading Text — Co-Updating Is Mandatory

**What goes wrong:** At least 12 test files in `tests/` use `content.indexOf('Step N.N')` or `content.includes('## N.N')` to locate sections. Any rename that is not reflected in the corresponding test assertion causes a silent false-pass (indexOf returns -1, assert.ok(-1) passes because -1 is truthy) OR an immediate assertion failure.

**Complete list of test files requiring co-update with specific step renames:**

| Step Label | File | Tests Affected |
|------------|------|----------------|
| `Step 2.5` (quick.md) | `tests/quick-branching.test.cjs` | indexOf assertion + ordering check vs Step 3 |
| `Step 4.75` (quick.md) | `tests/quick-research.test.cjs` | indexOf + ordering checks |
| `Step 5.5` (quick.md) | `tests/bug-2432-quick-plan-predispatch-commit.test.cjs`, `tests/quick-research.test.cjs` | 8 assertions in bug-2432 alone |
| `Step 5.6` (quick.md) | `tests/bug-2432-quick-plan-predispatch-commit.test.cjs` | 4 assertions; also `Step 6:` ordering |
| `Step 6:` (quick.md) | `tests/bug-2432-quick-plan-predispatch-commit.test.cjs`, `tests/bug-3426-codex-windows-hooks.test.cjs` | used as upper-bound delimiter |
| `Step 8:` (quick.md) | `tests/bug-2523-quick-deferred-items.test.cjs`, `tests/quick-commit-boundary.test.cjs`, `tests/bug-3805-fast-md-log-to-state-schema.test.cjs`, `tests/quick-research.test.cjs` | content and existence checks |
| `Step 3:` (quick.md) | `tests/quick-branching.test.cjs`, `tests/bug-3426-codex-windows-hooks.test.cjs`, `tests/state.test.cjs` | ordering relative to Step 2.5 |
| `Step 2.6:` (gsd-phase-researcher.md) | `tests/agent-frontmatter.test.cjs` line 344 | direct includes check |
| `Step 7c:` (gsd-verifier.md) | `tests/bug-3321-verifier-runs-probes.test.cjs` | title string match |
| `Step 4b:`, `Step 7b:` (gsd-verifier.md) | `tests/agent-frontmatter.test.cjs` | direct includes checks |
| `## 12.5` (plan-phase.md) | `tests/plan-bounce.test.cjs` | existence check |
| `## 8.5.` (plan-phase.md) | `tests/enh-2310-chunked-plan-phase.test.cjs` | multiple content checks |
| `## 3.5` (plan-phase.md) | `tests/milestone.test.cjs` | used as slice start |
| `5.5.` / `5.6.` (execute-phase.md) | `tests/execute-phase-step-5-5-deviation-doc.test.cjs` | block extraction by delimiter |

**Prevention:** Treat the test co-update as a first-class deliverable alongside the file edits. The GATE-01 requirement (`npm test` passes at 0 regressions) enforces this automatically — but the test failures will appear as step-heading tests breaking, which may be confusing without prior knowledge that tests assert on step text.

---

### 4. Cross-File Reference Breakage Pattern: File-Level Mentions of "filename step N.N"

**What goes wrong:** The phrase `execute-phase.md step 5.5` appears in `execute-plan.md`. More broadly, any file can mention another file's step number in prose. After renaming step 5.5 in execute-phase.md to (say) step 8, execute-plan.md would silently refer to a non-existent step.

**Scope of problem in this corpus:** Currently confirmed one cross-file reference chain:
- `execute-plan.md` → `execute-phase.md step 5.5` (3 occurrences)

The `new-milestone.md:398` reference `"from step 2.5"` is self-referential (within new-milestone.md itself, where `## 2.5. Scan Planted Seeds` is defined).

**Detection:** Before normalizing a file, build a cross-reference index: `grep -r "filename step N.N"` across the corpus for every step label being renamed. This is O(steps × files) but necessary.

---

## Exclusion Candidates

Files that should be excluded from the decimal step scanner, with justification.

| Path Pattern | Reason |
|---|---|
| `get-shit-done/workflows/execute-phase.md` — `<step name=>` blocks | Uses slug-named steps, not numbered steps. Steps 7.0–7.3 are nested sub-steps inside a numbered list inside a `<step>` block; renumbering them would destroy the step-7 classification hierarchy. Treat as excluded from renaming; only the nested `**Step 7.0 — …**` prose labels need attention. |
| All files where ALL steps use `<step name=>` format | These ~40 files (execute-plan.md, complete-milestone.md, add-phase.md, etc.) have no numeric step labels at all. Exclude them from the scanner pass entirely to reduce false-positive risk. |
| `sdk/src/*.ts` and `sdk/dist/*.js` | Explicitly out of scope per PROJECT.md `SCAN_DIRS` definition. |
| `get-shit-done/templates/` | Explicitly out of scope per PROJECT.md: "user-facing boilerplate, not AI prompts." |
| `get-shit-done/references/` | Explicitly out of scope per PROJECT.md. |
| `tests/` | Test files, not prompt content files. |
| `agents/gsd-verifier.md` — `Step Nb:` labels | Letter-suffix steps (`Step 3b`, `Step 4b`, `Step 7b`, `Step 7c`, `Step 9b`) are not decimal violations. Exclude from renaming; two tests assert these exact strings. |

---

## Prevention Strategies

Actionable rules for the implementation phase, mapped to requirement IDs.

---

### S-01: Two-Format Scanner for STEP-01

The scanner must detect violations in two distinct heading formats:

- Format A: `^\*\*Step ([0-9]+)\.([0-9]+)[:\s—]` (quick.md, progress.md, execute-phase.md prose)
- Format B: `^## ([0-9]+)\.([0-9]+)\.?\s` (plan-phase.md, new-project.md, new-milestone.md, audit-milestone.md)
- Format C: `^## Step ([0-9]+)\.([0-9]+)[:\s]` (gsd-phase-researcher.md, gsd-intel-updater.md, agents using `## Step N` format)

`<step name=>` files are excluded. Letter-suffix steps (`Step Nb`) are excluded. Step 0 without a decimal is excluded.

---

### S-02: Whole-File Substitution, Not Heading-Line-Only Substitution for STEP-02

When a step heading is renamed from old label to new label within a file:
1. Rename the heading line (the declaration)
2. Run a second pass over the entire file replacing all remaining occurrences of the old label string with the new label string — this captures inline cross-references, skip-guard prose, checklist items, and runtime-emitted output strings

This prevents the stale-reference problem for same-file cross-references.

---

### S-03: Cross-File Reference Index for STEP-02

Before normalizing any file, build a global reference index:
```
for each file F being normalized:
  for each step label L in F:
    grep -rn "basename(F) step L" agents/ commands/gsd/ get-shit-done/workflows/ tests/
```

Any hit in a file other than F (especially `execute-plan.md → execute-phase.md step 5.5`) is a cross-file reference that must be updated after the rename.

---

### S-04: Mandatory Test Co-Update for GATE-01

The normalization must include a test-update phase. All 14 affected test assertions identified in the Cross-Reference Pitfalls section must be updated atomically with the file renames they guard. The GATE-01 gate (`npm test` 0 regressions) is the enforcer — do not attempt to pass GATE-01 without updating the tests, or assertions will produce silent false-passes via `indexOf` returning -1.

---

### S-05: Dry-Run Mode for Scripts/Normalize-Step-Numbers.cjs for STEP-03

The maintenance script must support a `--dry-run` flag that prints the rename map without modifying files. This allows verification of the rename plan before applying it, and makes the cross-file reference audit visible before commit.

---

### S-06: Code-Fence Exclusion in All Text Scanners

Both the STEP-01 scanner and the STEP-03 maintenance script must track code fence state (```` ``` ```` toggles). Lines inside a code fence are never treated as step declarations or inline cross-references.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| STEP-01: Scanner implementation | Missing the `## N.N.` format from plan-phase.md (no `Step` keyword) | Include Format B regex; test against plan-phase.md corpus |
| STEP-01: Scanner implementation | Flagging `Step Nb` (letter suffix) as decimal violations | Require `\.[0-9]` specifically, not `\.[a-z0-9]` |
| STEP-01: Scanner implementation | Missing nested `**Step 7.0 —` in execute-phase.md | Decision needed: exclude or include with special handling |
| STEP-02: File normalization | Whole-integer steps in quick.md shifting by 7 positions | Test co-update required; verify with `npm test` after each file |
| STEP-02: File normalization | plan-phase.md triple-decimal `## 5.55.` and sub-steps `## 8.5.1` | Define sub-step policy before normalizing plan-phase.md |
| STEP-02: File normalization | execute-plan.md stale `execute-phase.md step 5.5` (3 occurrences) | Cross-file reference index must catch these |
| STEP-03: Maintenance script | Script run after upstream merge introduces new decimal steps | Script must re-run the test suite after normalizing to confirm no test regressions |
| STEP-03: Maintenance script | Idempotency — running twice on already-whole-integer files | Script must be a no-op when no decimal steps are found |

---

## Sources

- Direct file inspection: `agents/gsd-phase-researcher.md`, `get-shit-done/workflows/quick.md`, `get-shit-done/workflows/execute-phase.md`, `get-shit-done/workflows/plan-phase.md`, `.planning/PROJECT.md`
- Full test suite grep: `tests/quick-branching.test.cjs`, `tests/bug-2432-quick-plan-predispatch-commit.test.cjs`, `tests/execute-phase-step-5-5-deviation-doc.test.cjs`, `tests/agent-frontmatter.test.cjs`, `tests/quick-research.test.cjs`, `tests/plan-bounce.test.cjs`, `tests/enh-2310-chunked-plan-phase.test.cjs`, `tests/milestone.test.cjs`, and 6 more
- Format inventory: all 90+ workflow/agent/command files scanned for step heading patterns
- Cross-reference index: `grep -rn "execute-phase.md step\|step [0-9]+\.[0-9]"` across full corpus
