# Phase 10: Test Suite Green - Pattern Map

**Mapped:** 2026-04-19
**Files analyzed:** 26 (24 agent files + 1 hook registry file + 1 verification gate)
**Analogs found:** 26 / 26

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `hooks/gsd-check-update-worker.js` | config/registry | batch | `hooks/gsd-check-update-worker.js` (self) | self — one-line array addition |
| `agents/gsd-verifier.md` | agent config | request-response | `agents/gsd-integration-checker.md` | exact — already uses `<persona>` |
| `agents/gsd-planner.md` | agent config | request-response | `agents/gsd-integration-checker.md` | exact |
| `agents/gsd-pattern-mapper.md` | agent config | request-response | `agents/gsd-integration-checker.md` | exact |
| `agents/gsd-executor.md` | agent config | request-response | `agents/gsd-integration-checker.md` | exact |
| `agents/gsd-debugger.md` | agent config | request-response | `agents/gsd-integration-checker.md` | exact |
| `agents/gsd-phase-researcher.md` | agent config | request-response | `agents/gsd-integration-checker.md` | exact |
| `agents/gsd-plan-checker.md` | agent config | request-response | `agents/gsd-integration-checker.md` | exact |
| `agents/gsd-code-fixer.md` | agent config | request-response | `agents/gsd-integration-checker.md` | exact |
| `agents/gsd-code-reviewer.md` | agent config | request-response | `agents/gsd-integration-checker.md` | exact |
| `agents/gsd-codebase-mapper.md` | agent config | request-response | `agents/gsd-integration-checker.md` | exact |
| `agents/gsd-debug-session-manager.md` | agent config | request-response | `agents/gsd-integration-checker.md` | exact |
| `agents/gsd-doc-verifier.md` | agent config | request-response | `agents/gsd-integration-checker.md` | exact |
| `agents/gsd-doc-writer.md` | agent config | request-response | `agents/gsd-integration-checker.md` | exact |
| `agents/gsd-domain-researcher.md` | agent config | request-response | `agents/gsd-integration-checker.md` | exact |
| `agents/gsd-eval-auditor.md` | agent config | request-response | `agents/gsd-integration-checker.md` | exact |
| `agents/gsd-eval-planner.md` | agent config | request-response | `agents/gsd-integration-checker.md` | exact |
| `agents/gsd-framework-selector.md` | agent config | request-response | `agents/gsd-integration-checker.md` | exact |
| `agents/gsd-intel-updater.md` | agent config | request-response | `agents/gsd-integration-checker.md` | exact |
| `agents/gsd-research-synthesizer.md` | agent config | request-response | `agents/gsd-integration-checker.md` | exact |
| `agents/gsd-security-auditor.md` | agent config | request-response | `agents/gsd-integration-checker.md` | exact |
| `agents/gsd-ui-checker.md` | agent config | request-response | `agents/gsd-integration-checker.md` | exact |
| `agents/gsd-advisor-researcher.md` | agent config | request-response | `agents/gsd-integration-checker.md` | exact |
| `agents/gsd-ai-researcher.md` | agent config | request-response | `agents/gsd-integration-checker.md` | exact |
| `agents/gsd-assumptions-analyzer.md` | agent config | request-response | `agents/gsd-integration-checker.md` | exact |
| `agents/gsd-ui-checker.md` | agent config | request-response | `agents/gsd-integration-checker.md` | exact |

---

## Pattern Assignments

### `hooks/gsd-check-update-worker.js` (config/registry, batch)

**Analog:** `hooks/gsd-check-update-worker.js` (self — the array already exists; this is a one-line insertion)

**Current MANAGED_HOOKS array** (`hooks/gsd-check-update-worker.js` lines 37–48):
```javascript
const MANAGED_HOOKS = [
  'gsd-check-update-worker.js',
  'gsd-check-update.js',
  'gsd-context-monitor.js',
  'gsd-phase-boundary.sh',
  'gsd-prompt-guard.js',
  'gsd-read-guard.js',
  'gsd-session-state.sh',
  'gsd-statusline.js',
  'gsd-validate-commit.sh',
  'gsd-workflow-guard.js',
];
```

**Required change — insert one entry** (between `gsd-read-guard.js` and `gsd-session-state.sh`, alphabetical order):
```javascript
const MANAGED_HOOKS = [
  'gsd-check-update-worker.js',
  'gsd-check-update.js',
  'gsd-context-monitor.js',
  'gsd-phase-boundary.sh',
  'gsd-prompt-guard.js',
  'gsd-read-guard.js',
  'gsd-read-injection-scanner.js',  // ADD THIS LINE
  'gsd-session-state.sh',
  'gsd-statusline.js',
  'gsd-validate-commit.sh',
  'gsd-workflow-guard.js',
];
```

**Exact string that must be added:** `'gsd-read-injection-scanner.js'` — copy from `ls hooks/` output exactly. A misspelling would create a second test failure (the "no entries for hooks that do not exist" assertion in `tests/managed-hooks.test.cjs` line 67).

---

### `agents/gsd-*.md` — all 24 affected agents (agent config, request-response)

**Analog (correct pattern):** `agents/gsd-integration-checker.md` lines 12–14

**The target pattern** — what the tag must look like after the fix:
```markdown
<persona>
You are a GSD [role description here].
[... content unchanged ...]
</persona>
```

**Current broken pattern** in all 24 agents (example from `agents/gsd-verifier.md` line 14, `agents/gsd-planner.md` line 14):
```markdown
<role>
You are a GSD [role description here].
[... content unchanged ...]
</role>
```

**What changes:** Only the XML wrapper tags. `<role>` becomes `<persona>` and `</role>` becomes `</persona>`. Zero content inside the block changes.

**What must NOT change:**
- YAML frontmatter (`---` block at the top with `name`, `description`, `tools`, `color`, `hooks`)
- Any content between the opening and closing tags
- Any other XML blocks in the file (`<required_reading>`, `<project_context>`, `<task>`, etc.)

**Batch rename command (safe — tags are on standalone lines, VERIFIED):**
```bash
sed -i 's|^<role>$|<persona>|; s|^</role>$|</persona>|' agents/gsd-*.md
```

**Verification after rename:**
```bash
# Confirm zero remaining <role> tags across all agents
grep -l "^<role>$" agents/gsd-*.md
# Expected: no output

# Confirm all 24 now have <persona>
grep -l "^<persona>$" agents/gsd-*.md | wc -l
# Expected: at minimum 24 (the 3 agents that already had <persona> bring the total to 27)
```

**Full list of 24 affected agent files:**
- `agents/gsd-advisor-researcher.md`
- `agents/gsd-ai-researcher.md`
- `agents/gsd-assumptions-analyzer.md`
- `agents/gsd-codebase-mapper.md`
- `agents/gsd-code-fixer.md`
- `agents/gsd-code-reviewer.md`
- `agents/gsd-debugger.md`
- `agents/gsd-debug-session-manager.md`
- `agents/gsd-doc-verifier.md`
- `agents/gsd-doc-writer.md`
- `agents/gsd-domain-researcher.md`
- `agents/gsd-eval-auditor.md`
- `agents/gsd-eval-planner.md`
- `agents/gsd-executor.md`
- `agents/gsd-framework-selector.md`
- `agents/gsd-intel-updater.md`
- `agents/gsd-pattern-mapper.md`
- `agents/gsd-phase-researcher.md`
- `agents/gsd-plan-checker.md`
- `agents/gsd-planner.md`
- `agents/gsd-research-synthesizer.md`
- `agents/gsd-security-auditor.md`
- `agents/gsd-ui-checker.md`
- `agents/gsd-verifier.md`

---

## Shared Patterns

### Agent frontmatter preservation
**Source:** `agents/gsd-integration-checker.md` lines 1–6 (already compliant agent)
**Apply to:** All 24 agent files during the `<role>` → `<persona>` rename
```markdown
---
name: gsd-[agent-name]
description: [description text]
tools: Read, Write, Bash, Grep, Glob
color: [color]
---
```
The `---` delimited YAML block appears before all XML content. The `sed` pattern `^<role>$` is anchored to line-start and exact match, so it cannot match inside frontmatter. `agent-frontmatter.test.cjs` (currently 135/135 passing) will catch any frontmatter disturbance immediately.

### Test assertion pattern for MANAGED_HOOKS membership
**Source:** `tests/managed-hooks.test.cjs` lines 47–55
```javascript
test('every shipped gsd-*.js hook is in MANAGED_HOOKS', () => {
  const jsHooks = shippedHooks.filter(f => f.endsWith('.js'));
  for (const hookFile of jsHooks) {
    assert.ok(
      managedHooks.includes(hookFile),
      `${hookFile} is shipped in hooks/ but missing from MANAGED_HOOKS in gsd-check-update-worker.js`
    );
  }
});
```
The fix must satisfy `managedHooks.includes('gsd-read-injection-scanner.js')`. The test parses the array from source text; the entry must appear as a quoted string literal inside the array brackets.

### Test assertion pattern for `</persona>` tag placement
**Source:** `tests/verification-overrides.test.cjs` lines 216–228
```javascript
test('required_reading block is between </persona> and <project_context>', () => {
  const personaEnd = verifierContent.indexOf('</persona>');
  const projectCtx = verifierContent.indexOf('<project_context>');
  const reqReading = verifierContent.indexOf('<required_reading>');
  assert.ok(personaEnd > -1, '</persona> tag should exist');
  // ...
  assert.ok(
    reqReading > personaEnd && reqReading < projectCtx,
    '<required_reading> should appear between </persona> and <project_context>'
  );
});
```
The test only checks `gsd-verifier.md` but the fix scope is all 24 agents (D-03). The assertion is index-based: `</persona>` must appear somewhere before `<required_reading>`. No other structural requirements.

---

## No Analog Found

None. Both fixes have clear source-of-truth files and verified patterns.

---

## Verification Commands (exact, per RESEARCH.md)

| Step | Command | Expected Result |
|------|---------|-----------------|
| After MANAGED_HOOKS fix | `node --test tests/managed-hooks.test.cjs` | 3/3 pass |
| After agent tag rename | `node --test tests/verification-overrides.test.cjs` | all pass |
| After agent tag rename | `node --test tests/agent-size-budget.test.cjs` | 34/34 pass |
| Fork-specific test 1 | `node --test tests/negative-framing-scan.test.cjs` | pass |
| Fork-specific test 2 | `node --test tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs` | pass |
| Fork-specific test 3 | `node --test tests/ios-scaffold-safety.test.cjs` | pass |
| Fork-specific test 4 | `node --test tests/execute-phase-wave.test.cjs` | pass |
| Fork-specific test 5 | `node --test tests/agent-frontmatter.test.cjs` | 135/135 pass |
| Final gate | `npm test` | exit 0, count ≥ 3941 (target: 4112/4112) |

---

## Metadata

**Analog search scope:** `agents/`, `hooks/`, `tests/`
**Files scanned:** 31 agent files, 8 JS hook files, 3 test files (managed-hooks, verification-overrides, agent-size-budget)
**Pattern extraction date:** 2026-04-19
