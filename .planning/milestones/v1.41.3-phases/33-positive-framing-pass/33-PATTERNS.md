# Phase 33: Positive Framing Pass - Pattern Map

**Mapped:** 2026-05-14
**Files analyzed:** 9 (7 modified prompt/content files + 1 modified CJS source + 1 modified test file)
**Analogs found:** 9 / 9

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `agents/gsd-executor.md` | prompt-content | n/a (prose edit) | `agents/gsd-planner.md` | role-match |
| `commands/gsd/discuss-phase.md` | prompt-content | n/a (prose edit) | `agents/gsd-executor.md` | role-match |
| `agents/gsd-planner.md` | prompt-content | n/a (prose edit) | `agents/gsd-executor.md` | role-match |
| `get-shit-done/workflows/edit-phase.md` | prompt-content | n/a (prose edit) | `get-shit-done/workflows/secure-phase.md` | role-match |
| `get-shit-done/workflows/secure-phase.md` | prompt-content | n/a (prose edit) | `get-shit-done/workflows/edit-phase.md` | role-match |
| `get-shit-done/workflows/reapply-patches.md` | prompt-content | n/a (prose edit) | `get-shit-done/workflows/edit-phase.md` | role-match |
| `get-shit-done/workflows/debug.md` | prompt-content | n/a (prose review/guard) | `get-shit-done/workflows/edit-phase.md` | role-match |
| `get-shit-done/bin/lib/state.cjs` | service | request-response (read path) | `get-shit-done/bin/lib/state.cjs` (write path) | exact (same file, different function) |
| `tests/bug-3242-state-update-progress-trample.test.cjs` | test | batch (fixture + assert) | `tests/negative-framing-scan.test.cjs` | role-match |

---

## Pattern Assignments

### Prompt-content files (Workstream A — scanner framing fixes)

All 7 prompt files share the same edit pattern. Their analog is the body of
`tests/negative-framing-scan.test.cjs` (the authoritative scanner) plus Phase 30
affirmative-replacement precedent. There is no architectural import/export pattern
to copy — these are markdown prose edits only.

**Analog for violation type detection:** `tests/negative-framing-scan.test.cjs`

**Violation bucket → required action mapping** (lines 234–370 of the scanner):

| Bucket | Scanner check | Required prose edit |
|--------|--------------|---------------------|
| `doNot` | `/\bdo not\b/i` — flagged unless `isConditionalOrFactual` OR `hasPositiveComplement` | Remove or rewrite so the directive leads with the positive action |
| `never` | `/\bNEVER\b/` — flagged unless `isFactualNever` OR `isReframePattern` OR `isConditionalOrFactual` | Replace `NEVER X` with `Always Y` / `X is required` |
| `dont` | `/\bdon't\b/i` — flagged unless `isFactualDont` OR `isConditionalOrFactual` OR `hasPositiveComplement` | Convert `Don't X` to an imperative affirmative (`Edit only...`, `Read first, then...`) |
| `mustNot` | `/\bmust\s+not\b/i` — NO complement filter; every match is a hard fail | Remove `must not` token entirely; rewrite as `must Y` / `X is invalid` |
| `antiPatterns` | `/<anti_patterns>/i` — opening tag only | Rename `<anti_patterns>` → `<expected_patterns>` (both opening and closing tags); reframe bullet content affirmatively |

**`hasPositiveComplement` rules** (scanner lines 63–76):
- `/ — /` (em-dash WITH spaces both sides) → exempt
- `/ -- /` (double-dash WITH spaces both sides) → exempt
- `/[.!]\*{0,2}\s+[A-Z]/` (period/bang then uppercase, optionally through `**`) → exempt
- `/\([^)]{4,}\)/` (parenthetical ≥ 4 chars) → exempt

**Affirmative-replacement vocabulary** (Phase 30 precedent):
```
DO NOT X      → Always X / X is required / Only X when Y
do not X      → Read the mode routing instructions first; load X only on-demand...
NEVER X       → Always Y / Keep X as Y
Don't X       → X only... / Edit only... / Read first, then...
must not X    → must Y / X is invalid / Proceed to Step Y
<anti_patterns> → <expected_patterns>  (rename tag + reframe bullet content)
```

**Per-file edits (verified by research; scanner is the gate):**

#### `agents/gsd-executor.md` — line 517, bucket `doNot`

Current (trimmed):
```
commits landed there, **DO NOT** "recover" by force-rewinding the protected ref —
```
Note: em-dash exists but check spacing — if ` — ` (spaces both sides) is present, line may
already pass. Research says verify; if spacing is wrong or `DO NOT` still trips, rewrite as:
```
commits landed there — **Always HALT and surface a blocker** instead of "recovering"
by force-rewinding the protected ref, which silently destroys concurrent commits.
```

#### `commands/gsd/discuss-phase.md` — line 33, bucket `doNot`

Current:
```
Do not pre-load any workflow files before reading the mode routing instructions.
```
Rewrite:
```
Read the mode routing instructions first; load workflow files only on-demand in the <process> section.
```

#### `agents/gsd-planner.md` — line 203, bucket `never`

Current:
```
- NEVER place fenced code blocks (```) inside `<action>`. Action is directive prose, not implementation code.
```
Rewrite — two options:
- If the trailing sentence `Action is directive prose, not implementation code.` after period + capital already satisfies `hasPositiveComplement` (it does: `/[.!]\*{0,2}\s+[A-Z]/` matches `. Action`), then only `NEVER` → affirmative token is needed:
  ```
  - Keep `<action>` as directive prose only — fenced code blocks belong in `<read_first>` source files. Action is directive prose, not implementation code.
  ```
- Verify by re-running scanner; the trailing sentence may already exempt it once `NEVER` is removed.

#### `get-shit-done/workflows/edit-phase.md` — lines 191, 271, 273–277, buckets `mustNot` / `antiPatterns` / `dont`

Line 191, bucket `mustNot`:
```
# Current: - It must not reference itself (phase {target})
# Rewrite:
- It must reference a different phase — self-reference (phase {target}) is invalid.
```

Lines 271 / closing tag (antiPatterns block rename):
```
# Current opening: <anti_patterns>
# Current closing: </anti_patterns>
# Rename to:
<expected_patterns>
</expected_patterns>
```
Reframe all bullets inside from negative to affirmative (see lines 273–279 below).

Line 273, bucket `dont`:
```
# Current: - Don't modify other phases when editing one
# Rewrite:
- Edit only the target phase; leave all other phases untouched.
```

Line 275, bucket `dont`:
```
# Current: - Don't write without showing a diff and getting confirmation
# Rewrite:
- Always show a diff and get confirmation before writing.
```

Line 276, bucket `dont`:
```
# Current: - Don't edit in_progress/completed phases without --force
# Rewrite:
- Edit in_progress/completed phases only when --force is passed.
```

Line 277, bucket `dont`:
```
# Current: - Don't use raw Write on ROADMAP.md without reading it first; always replace section in place
# Rewrite (must lead with positive; '; always' is not a hasPositiveComplement marker):
- Read ROADMAP.md first, then replace the section in place using a targeted edit.
```

Lines 278–279 (currently pass scanner but are inside `<anti_patterns>` block being renamed; reframe for consistency):
```
# Line 278 current: - Don't modify the phase directory structure — only ROADMAP.md changes
# Reframe:
- Change only ROADMAP.md; leave the phase directory structure intact.

# Line 279 current: - Don't commit the change — that's the user's decision
# Reframe:
- Leave committing to the user — that's their decision.
```

#### `get-shit-done/workflows/secure-phase.md` — line 76, buckets `mustNot` + `doNot`

Current:
```
- If `threats_open: 0 AND register_authored_at_plan_time: false` → **do NOT skip**. Empty-by-no-planning must not rubber-stamp a clean SECURITY.md. Proceed to Step 5 in retroactive-STRIDE mode...
```
Two tokens on one line. Semantic constraint MUST be preserved: empty-by-no-planning still requires a real audit.
Rewrite:
```
- If `threats_open: 0 AND register_authored_at_plan_time: false` → **always proceed to Step 5 in retroactive-STRIDE mode**. An empty-by-no-planning register requires a real audit — a clean SECURITY.md is not sufficient without one. Proceed to Step 5...
```

#### `get-shit-done/workflows/reapply-patches.md` — line 323, bucket `doNot`

Current (research-verified; CONTEXT.md line refs are stale — use scanner output):
```
[line with doNot violation]
```
Pattern: convert to affirmative using same vocabulary as above. Scanner is the gate.

#### `get-shit-done/workflows/debug.md` — no violations (FRAME-01 already satisfied)

Research confirmed: scanner flags 0 violations and 0 warnings in `debug.md`. No prose edits needed.
Optional guard subtest (Claude's discretion): add a corpus subtest for `debug.md` specifically to
`tests/negative-framing-scan.test.cjs` — it will be GREEN immediately (regression guard, not TDD gate).

---

### `get-shit-done/bin/lib/state.cjs` (service, read path — `cmdStateJson`)

**Analog:** `readModifyWriteStateMd` in the same file (write path, lines 1072–1100) — the exact
pattern to mirror for curated progress preservation.

**Write-path pattern to copy into `cmdStateJson`** (lines 1083–1093):
```javascript
// readModifyWriteStateMd: resync=false snapshot/restore of curated progress block
if (!resync && preFm && preFm.progress) {
  // Re-apply the curated progress block that syncStateFrontmatter just
  // overwrote with disk-derived values.
  const postFm = extractFrontmatter(synced);
  postFm.progress = preFm.progress;
  const yamlStr = reconstructFrontmatter(postFm);
  const body = stripFrontmatter(synced);
  synced = `---\n${yamlStr}\n---\n\n${body}`;
}
```

**Existing preservation pattern in `cmdStateJson`** (lines 1118–1128 — already preserves `stopped_at`/`paused_at`/`status`):
```javascript
// Preserve frontmatter-only fields that cannot be recovered from the body.
if (existingFm && existingFm.stopped_at && !built.stopped_at) {
  built.stopped_at = existingFm.stopped_at;
}
if (existingFm && existingFm.paused_at && !built.paused_at) {
  built.paused_at = existingFm.paused_at;
}
// Preserve existing status when body-derived status is 'unknown'
if (built.status === 'unknown' && existingFm && existingFm.status && existingFm.status !== 'unknown') {
  built.status = existingFm.status;
}
```

**The fix — mirror `stopped_at` pattern for `progress`** (insert after line 1128):
```javascript
// Preserve curated progress block when present (#3242 Bug A).
// Disk-derived progress is correct for fresh builds (no frontmatter block),
// but cross-milestone curated progress.* must be treated as authoritative
// when the frontmatter block is present (mirrors write-path resync:false logic).
if (existingFm && existingFm.progress) {
  built.progress = existingFm.progress;
}
```

**Risk:** may regress issue #1589 (`tests/state.test.cjs` test at lines 1706–1800).
**Mitigation:** planner MUST read `tests/state.test.cjs:1706–1800` to check whether the #1589
test fixture stores a frontmatter `progress` block. If it does NOT (assumption A1), the fix is safe.
Run full `tests/state.test.cjs` after the fix to confirm.

---

### `tests/bug-3242-state-update-progress-trample.test.cjs` (test, todo-marker removal)

**Analog:** existing tests in the same file that are already active (non-todo), e.g., lines 162–183
(`state.update "Last Activity" updates the body field itself`) and lines 254–293
(`all phases realized: percent equals plan fraction`).

**Todo-marker removal pattern** — the 3 tests to activate (lines 107, 201, 295):

Line 107 (Bug A test):
```javascript
// Current (keep todo until code fix is confirmed):
test('state.update "Last Activity" does not overwrite progress.completed_plans',
  { todo: 'fix pending: #3242 Bug A not yet implemented' }, (t) => {

// After fix: remove the todo option entirely
test('state.update "Last Activity" does not overwrite progress.completed_plans', (t) => {
```

Line 201 (Bug B test 1):
```javascript
// Current:
test('12 declared phases / 6 realized / 6/6 plans done → percent is 50, not 100',
  { todo: 'fix pending: #3242 Bug B not yet implemented' }, (t) => {

// After fix (Bug B already passes): remove todo
test('12 declared phases / 6 realized / 6/6 plans done → percent is 50, not 100', (t) => {
```

Line 295 (Bug B test 2):
```javascript
// Current:
test('state sync also reflects phase-fraction-capped percent in body Progress field',
  { todo: 'fix pending: #3242 Bug B not yet implemented' }, () => {

// After fix: remove todo
test('state sync also reflects phase-fraction-capped percent in body Progress field', () => {
```

Active test structure pattern (copied from lines 162–183, same file):
```javascript
test('<description>', () => {        // no options object
  const statePath = path.join(tmpDir, '.planning', 'STATE.md');
  fs.writeFileSync(statePath, buildStateWithCuratedProgress({ ... }));

  const updateResult = runGsdTools(['state', 'update', ...], tmpDir);
  assert.ok(updateResult.success, `state update failed: ${updateResult.error}`);

  const jsonResult = runGsdTools('state json', tmpDir);
  assert.ok(jsonResult.success, `state json failed: ${jsonResult.error}`);
  const fm = JSON.parse(jsonResult.output);

  assert.strictEqual(fm.progress.completed_plans, 22, '...');
});
```

---

### Optional corpus guard subtests for `debug.md` / `reapply-patches.md` (Claude's discretion)

**Analog:** existing corpus subtest blocks in `tests/negative-framing-scan.test.cjs`, e.g., the
`doNot` workflow corpus subtest at lines 835–855, and `mustNot` workflow corpus subtest at lines
1113–1132. These share the same structure:

```javascript
// Pattern for a per-file corpus guard subtest (copy from lines 835–855)
describe('corpus scan — <violation_type> primary directives', () => {
  test('no <violation_type> directives in workflow files', () => {
    const workflowFiles = ALL_FILES.filter(f => f.includes('/workflows/'));
    const violations = [];
    for (const file of workflowFiles) {
      const relPath = path.relative(PROJECT_ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const { <bucket> } = scanForNegativeFraming(content).violations;
      if (<bucket>.length > 0) violations.push({ file: relPath, lines: <bucket> });
    }
    assert.equal(violations.length, 0,
      `<Bucket> directives found in workflow files. Convert to affirmative instructions:\n${
        violations.map(v =>
          `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
        ).join('\n')
      }`
    );
  });
});
```

Note: `debug.md` guard will be GREEN immediately (file already clean). `reapply-patches.md` guard
for the `doNot` bucket will be RED until line 323 is fixed — this is valid as a TDD gate for
that specific file.

---

## Shared Patterns

### Verification gate (both workstreams)
**Apply to:** every task in Plan 01 and Plan 02 after each batch of edits.

Plan 01 (scanner framing fixes):
```bash
node --test tests/negative-framing-scan.test.cjs
# Expected: # fail 0  (all 6 formerly-failing subtests green)
```

Plan 02 (state.cjs fix + todo removal):
```bash
node --test tests/bug-3242-state-update-progress-trample.test.cjs
# Expected: # pass 7, # todo 0, # fail 0

node --test tests/state.test.cjs
# Expected: # fail 0  (regression guard for #1589)
```

Full suite gate (phase close):
```bash
node scripts/run-tests.cjs
# Target: fail 0, skipped 1 (intentional HDOC skip), todo 0
```

### PLAN.md frontmatter structure
**Source:** `.planning/phases/32-quick-test-fixes/32-01-PLAN.md` lines 1–42
**Apply to:** all plan files created in Phase 33.

```yaml
---
phase: 33-positive-framing-pass
plan: 01          # or 02
type: execute
wave: 1
depends_on: []    # or ['33-01'] for Plan 02
files_modified:
  - <list modified files>
autonomous: true
requirements:
  - FRAME-01      # Plan 01
  - FRAME-02      # Plan 01
  - SCAN-12       # Plan 01
  - D-03          # Plan 02 only
---
```

### Task structure in PLAN.md
**Source:** `.planning/phases/32-quick-test-fixes/32-01-PLAN.md` lines 63–100
```xml
<tasks>
  <task type="auto">
    <name>Task N: <short description></name>
    <files><file path(s) to edit></files>
    <read_first>
      - <file> lines X–Y — reason
    </read_first>
    <action>
      Directive prose describing exactly what to change.
      Reference concrete line numbers and replacement text.
    </action>
  </task>
</tasks>
```

---

## No Analog Found

All files have existing analogs. No files in scope require novel patterns.

---

## Metadata

**Analog search scope:** `tests/`, `get-shit-done/bin/lib/`, `.planning/phases/32-quick-test-fixes/`
**Files scanned:** 4 primary analogs read (scanner test, bug-3242 test, state.cjs functions, Phase 32 plan)
**Pattern extraction date:** 2026-05-14
