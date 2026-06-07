# Architecture

**Domain:** Coverage gap closure — adding 6 test changes to existing test files
**Researched:** 2026-06-07
**Confidence:** HIGH (all integration points read directly from source files)

---

## Files Modified vs Created

| Gap | File | Operation | Lines Affected |
|-----|------|-----------|---------------|
| GAP-E | `tests/phase-56-effort-wiring.test.cjs` | MODIFY — append 8 new `test()` entries inside existing `describe` blocks or a new `describe` block | After line 228 (end of file) |
| GAP-H | `tests/bug-3097-3099-executor-worktree-path-safety.test.cjs` | MODIFY — add 1 new `test()` inside existing `describe('bug #3097: ...')` | After line 62 |
| GAP-K | `tests/debug-session-management.test.cjs` | MODIFY — remove `{ skip: ... }` option object from line 133 | Line 133 |
| GAP-M2 | `tests/debug-session-management.test.cjs` | MODIFY — remove `.skip` from `test.skip` at line 184 and add anti-heredoc assertion | Line 184–187 |
| GAP-L | `tests/debug-session-management.test.cjs` OR new file | ADD test — gsd-user-profiler.md structural assertion (see decision below) | New `describe` block |
| GAP-M1 | `tests/step-numbering-scan.test.cjs` | MODIFY — comment-only edit (JSDoc header update) | Lines 1–26 |

**Net file creation: 0 new files required.** All gaps fit into existing files.

---

## Integration Points

### GAP-E: 8 new entries in `phase-56-effort-wiring.test.cjs`

**Pattern.** The file has two shapes, both self-contained and copy-paste-safe:

Shape 1 (Group A — multi-token check):
```js
test('<workflow>.md carries <token_a> and <token_b>', () => {
  const content = read('get-shit-done/workflows/<workflow>.md');
  assert.ok(content.includes('<token_a>'), '<workflow>.md must define/reference <token_a>');
  assert.ok(content.includes('<token_b>'), '<workflow>.md must define/reference <token_b>');
});
```

Shape 2 (Group B — single resolve-model-effort line):
```js
test('<workflow>.md has resolve-model-effort <agent>', () => {
  const content = read('get-shit-done/workflows/<workflow>.md');
  assert.ok(
    content.includes('resolve-model-effort <agent>'),
    '<workflow>.md must contain "resolve-model-effort <agent>"'
  );
});
```

**Data access.** The module-level `read(rel)` helper (lines 29–35) reads from `ROOT` (repo root, one level above `__dirname`). New tests use `read(...)` exactly like existing tests — no import change needed.

**Placement.** New Group-A entries go inside the existing `describe('phase-56 GAP A: ...')` block (before its closing `}`); new Group-B entries go inside `describe('phase-56 GAP B: ...')` block. No new `describe` wrappers needed unless a new GAP letter is introduced.

**No shared helpers are needed.** `read()` is already the shared helper; `helpers.cjs` is not imported by this file at all.

---

### GAP-H: submodule exclusion in `bug-3097-3099-executor-worktree-path-safety.test.cjs`

**Existing mock pattern.** The file does NOT create a fake filesystem. It reads the actual product file at load-time into two module-level constants:
```js
const executorSrc = fs.readFileSync(path.join(ROOT, 'agents', 'gsd-executor.md'), 'utf8');
```
All tests slice into `executorSrc` by finding XML tags (`<task_commit_protocol>`) and doing string pattern matching inside that slice. No temp dirs, no git mocks, no file system setup.

**What the existing tests assert about `.git` file detection.** Current tests (lines 42–50) verify that `rev-parse --git-dir` or `.git/worktrees/` pattern is used for worktree detection. They do NOT assert the submodule exclusion path.

**What the new submodule test needs to assert.** `gsd-executor.md` lines 455–464 (read above) show the product already contains the submodule disambiguation:
```bash
# Distinguish worktree (gitdir: .git/worktrees/...) from submodule (gitdir: ../.git/modules/...)
if echo "$GIT_CONTENT" | command grep -q "^gitdir:.*\.git/worktrees/"; then
  # This is a worktree
else
  # This is a submodule or other non-worktree .git file — skip worktree guards
```

The new test should slice the same `task_commit_protocol` block from `executorSrc` (same pattern as existing tests) and assert the presence of a submodule-distinguishing comment or the `\.git/modules/` pattern. No additional mocking is needed — the assertion is text-only against the product source.

**Suggested test shape:**
```js
test('sentinel distinguishes submodule .git files from worktree .git files', () => {
  const protocolIdx = executorSrc.indexOf('<task_commit_protocol>');
  const protocolEnd = executorSrc.indexOf('</task_commit_protocol>');
  const protocol = executorSrc.slice(protocolIdx, protocolEnd);
  assert.ok(
    protocol.includes('submodule') || protocol.includes('.git/modules/'),
    'task_commit_protocol must explicitly exclude submodule .git files from worktree guards',
  );
});
```

**Placement:** Inside `describe('bug #3097: cwd-drift sentinel in gsd-executor.md', ...)` after the existing 3 tests (after line 62).

---

### GAP-K: unskipping line 133 in `debug-session-management.test.cjs`

**Current state (line 133):**
```js
test('gsd-debugger contains security note about DATA_START', { skip: 'fork intentionally diverges from upstream contract' }, () => {
```
The test body reads `gsd-debugger.md` and asserts `content.includes('DATA_START')`.

**What verification shows.** A grep of `agents/gsd-debugger.md` for `DATA_START` returns no results — the agent does NOT contain the string `DATA_START`. The test was skipped because the fork diverges from the upstream contract. The skip reason is still valid unless the profiler agent or session manager is the right target.

**Decision for GAP-K.** The skip removal is only safe if `gsd-debugger.md` has been updated to include `DATA_START`. Before removing the skip, confirm `DATA_START` is now present in `gsd-debugger.md`. If it is not yet present, GAP-K is blocked on the product file change and the skip should remain.

**If the product file has been updated:** Change line 133 from `{ skip: '...' }` to no options object. The test body already contains the correct assertion. No structural change to the file needed.

---

### GAP-M2: unskipping line 184 in `debug-session-management.test.cjs`

**Current state (lines 184–187):**
```js
test.skip('gsd-debug-session-manager includes anti-heredoc rule', () => {
  const content = fs.readFileSync(path.join(process.cwd(), 'agents', 'gsd-debug-session-manager.md'), 'utf8');
  assert.ok(/only use the write tool/i.test(content), 'session manager missing anti-heredoc rule');
});
```

**What verification shows.** `gsd-debug-session-manager.md` does NOT use `Write` in its `tools:` frontmatter field (tools is not visible from the grep, but the agent is a session manager, not a file writer). The `agent-frontmatter.test.cjs` file-writing agent rule only applies to agents with `Write` in their `tools:` line. If `Write` is NOT listed, the anti-heredoc rule is not required by the frontmatter test, but could still be present as a best practice.

**Decision for GAP-M2.** Check `tools:` in `agents/gsd-debug-session-manager.md` frontmatter. If `Write` is absent, the anti-heredoc text is not contractually required; the unskip would assert something that may not exist. Confirm the product file has had `only use the Write tool` added before removing `.skip`. If the phrase is now present, change `test.skip(` to `test(`.

---

### GAP-L: new test for `gsd-user-profiler.md`

**Best home: `tests/debug-session-management.test.cjs` — NO.**

The file is debug-workflow-specific. `gsd-user-profiler.md` is a profiling agent; putting it there would create a naming mismatch.

**Best home: `tests/agent-skills.test.cjs` — NO.**

That file tests the `agent-skills` gsd-tools CLI subcommand, not agent structural contracts.

**Best home: new dedicated file — PREFERRED.**

The precedent for agent structural contract tests is either:
- `agent-frontmatter.test.cjs` (validates frontmatter shape for all agents — already covers `gsd-user-profiler` automatically because `ALL_AGENTS` is built dynamically from `fs.readdirSync(AGENTS_DIR)`)
- A named regression test like `bug-<N>-<desc>.test.cjs` for a specific contract

Since `agent-frontmatter.test.cjs` already dynamically includes `gsd-user-profiler` in its frontmatter scans (no explicit name list required; `ALL_AGENTS` is built by globbing `agents/gsd-*.md`), the gap is about a content-level assertion, not frontmatter.

**Recommended approach:** Add a new `describe` block at the bottom of `tests/debug-session-management.test.cjs` or, if the contract being asserted is about profiler output format, in a new file `tests/profile-pipeline.test.cjs`. However, `tests/profile-pipeline.test.cjs` already exists (shown in the directory listing). Check its contents before creating a duplicate.

**Minimal-risk placement:** Append a new `describe('gsd-user-profiler structural contract', ...)` block at the end of `tests/debug-session-management.test.cjs`. This is the lowest-friction option: zero new files, same `'use strict'` + `require('node:test')` + `require('node:fs')` imports already present, same `process.cwd()` path convention used by most tests in that file.

**Test shape for GAP-L:**
```js
describe('gsd-user-profiler structural contract', () => {
  test('gsd-user-profiler.md has tools: Read (no Write)', () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), 'agents', 'gsd-user-profiler.md'), 'utf8'
    );
    const toolsMatch = content.match(/^tools:\s*(.+)$/m);
    assert.ok(toolsMatch, 'gsd-user-profiler.md missing tools: frontmatter');
    assert.ok(toolsMatch[1].includes('Read'), 'gsd-user-profiler.md must have Read in tools');
    assert.ok(!toolsMatch[1].includes('Write'), 'gsd-user-profiler.md must not have Write (read-only profiler)');
  });

  test('gsd-user-profiler.md returns output in <analysis> tags', () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), 'agents', 'gsd-user-profiler.md'), 'utf8'
    );
    assert.ok(content.includes('<analysis>'), 'gsd-user-profiler.md must document <analysis> output tags');
  });
});
```

The `path` and `fs` constants are already declared at the top of `debug-session-management.test.cjs`; the new block requires no additional imports.

---

### GAP-M1: comment update in `step-numbering-scan.test.cjs`

**Nature of change.** Lines 1–26 are a module-level JSDoc block describing the scan's expected violation inventory. This is a pure comment — the `describe`/`test` structure and all runtime assertions begin at line 28 (`'use strict'`). Updating the comment (e.g. removing files that have been fixed, or updating the "Phase 48 RED expectation" count) has zero behavioral effect on test outcomes.

**Confirmation:** `scanContent`, `scanForOutOfOrder`, `collectMarkdownFiles`, `SCAN_DIRS`, `PATTERN_C_EXCLUDES`, and `ALL_FILES` are entirely unaffected by JSDoc edits. The corpus scan `describe` blocks at lines 294–337 iterate `SCAN_FILES` dynamically; no hardcoded file list exists in the runtime path.

**This is strictly a comment edit with no behavioral change.**

---

## Build Order

The following order minimizes re-runs of `npm test` and respects file-level dependencies:

| Step | Action | Rationale |
|------|--------|-----------|
| 1 | GAP-M1: edit JSDoc comment in `step-numbering-scan.test.cjs` | Zero risk; no behavioral change; validate `npm test` still passes as baseline |
| 2 | GAP-E: append 8 new `test()` entries to `phase-56-effort-wiring.test.cjs` | Pure additions to an existing file; no shared state; new tests either pass (product has tokens) or fail cleanly with a clear message |
| 3 | GAP-H: add submodule test to `bug-3097-3099-executor-worktree-path-safety.test.cjs` | Reads same `executorSrc` constant; no new mocking needed; pure addition inside existing `describe` |
| 4 | GAP-L: append `gsd-user-profiler` `describe` block to `debug-session-management.test.cjs` | Appends to existing file; all imports already present; does not touch GAP-K or GAP-M2 lines |
| 5 | GAP-K: remove `{ skip: '...' }` from line 133 | Conditional on product-side confirmation that `gsd-debugger.md` now contains `DATA_START`; must run `npm test` after to confirm test passes (not just skips) |
| 6 | GAP-M2: change `test.skip` to `test` at line 184 | Conditional on product-side confirmation that `gsd-debug-session-manager.md` now contains `only use the Write tool`; do after GAP-K so both changes are visible in the same test run |

**Gate:** Run `npm test 2>&1 | tee /tmp/gsd-test-output.txt` after steps 1–4 (the unconditional changes) to establish a green baseline before touching the skip removals in steps 5–6.

**Dependency note:** Steps 5 and 6 are product-file-gated, not test-file-gated. If the product files (`gsd-debugger.md`, `gsd-debug-session-manager.md`) have not been updated to include the asserted content, the unskips will produce NEW TEST FAILURES rather than gap closures. Verify with `grep -n "DATA_START" agents/gsd-debugger.md` and `grep -ni "only use the write tool" agents/gsd-debug-session-manager.md` before proceeding to steps 5–6.
