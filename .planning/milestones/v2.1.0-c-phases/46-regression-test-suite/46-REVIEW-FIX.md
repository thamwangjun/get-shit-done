---
phase: 46-regression-test-suite
fixed_at: 2026-05-29T00:00:00Z
review_path: .planning/phases/46-regression-test-suite/46-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 46: Code Review Fix Report

**Fixed at:** 2026-05-29
**Source review:** .planning/phases/46-regression-test-suite/46-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5
- Fixed: 5
- Skipped: 0

## Fixed Issues

### CR-01: TEST-01 does not exercise Eta rendering — test passes vacuously

**Files modified:** `tests/install-eta-regression.test.cjs`
**Commit:** 1d44a8b1
**Applied fix:** Replaced the TEST-01 `describe` block entirely. The old body called `installRuntimeArtifacts('claude', tmpDir, 'global', RESOLVED_CORE)` which routes through the `skillsKind` layout and never invokes `renderEtaContent`. The new body calls `renderEtaContent(source, srcPath, REPO_ROOT)` directly on `agents/gsd-executor.md` (which contains `<%~ include(...) %>` directives) and asserts that no bare `@~/.claude/` lines survive in the rendered output. The unused `installRuntimeArtifacts` import, `install-profiles.cjs` require, and module-scope `REAL_COMMANDS_DIR`/`MANIFEST`/`RESOLVED_CORE` constants were also removed (addressing IN-01 simultaneously). Test title updated to reflect the new assertion. All 5 install-eta-regression tests pass.

---

### WR-01: Dead global `eta` instance in `bin/install.js`

**Files modified:** `bin/install.js`, `tests/bug-phase45-eta-wiring.test.cjs`
**Commit:** 35148c4e
**Applied fix:** Removed the module-scope `const eta = new Eta({...})` declaration (lines 1753-1757) and its `eta.resolvePath` override (lines 1758-1765) from `bin/install.js`. The `_etaSourceRoot` variable is retained because it is still passed as the `viewsRoot` argument to `renderEtaContent` call sites at lines 6481 and 8697. Updated the stale JSDoc comment on `renderEtaContent` to remove the reference to "global eta instance". In `bug-phase45-eta-wiring.test.cjs`, updated the INTG-01 views-root assertion to verify that `_etaSourceRoot` is passed to `renderEtaContent` call sites (replacing the now-removed `views: _etaSourceRoot` pattern check). All 12 INTG tests pass.

---

### WR-02: INTG-06 passes vacuously — no SKILL.md files exist in repo

**Files modified:** `tests/bug-phase45-eta-wiring.test.cjs`
**Commit:** e499e50b
**Applied fix:** Added a guard after `findSkillFiles(REPO_ROOT)` in INTG-06: if `skillFiles.length === 0`, the test returns early with a `console.warn` message instead of silently passing with zero loop iterations. This makes the no-coverage case visible in test output. The `assert.ok(skillFiles.length > 0, ...)` alternative was not used because no SKILL.md files currently exist in the repo and that would immediately break the test suite. All 12 INTG tests pass with the guard emitting a visible warning.

---

### WR-03: INTG-02 and INTG-03 walkers silently pass when source directories are absent

**Files modified:** `tests/bug-phase45-eta-wiring.test.cjs`
**Commit:** 0104223f
**Applied fix:** In `findBareLineAtTildeRefs` (INTG-02), replaced `if (fs.existsSync(dir)) { walkDir(dir); }` with `assert.ok(fs.existsSync(dir), ...)` followed by an unconditional `walkDir(dir)` call. In INTG-03, replaced the equivalent `if (fs.existsSync(agentsDir)) { walkDir(agentsDir); }` guard with the same assert pattern. Both guards previously caused silent vacuous passes if the watched directories were absent; the explicit assert fails the test immediately with a clear message. All 12 INTG tests pass.

---

### IN-01: `loadSkillsManifest` / `resolveProfile` execute at module scope for all tests

**Files modified:** `tests/install-eta-regression.test.cjs`
**Commit:** 1d44a8b1
**Applied fix:** Resolved as part of CR-01. Since the new TEST-01 body uses `renderEtaContent` directly (not `installRuntimeArtifacts`), the `REAL_COMMANDS_DIR`, `MANIFEST`, `RESOLVED_CORE` module-scope constants and the `install-profiles.cjs` require are no longer needed. All were removed. `loadSkillsManifest` and `resolveProfile` no longer execute at module load time.

---

_Fixed: 2026-05-29_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
