# Phase 18: Fork Tag Corpus Tests — Research

**Researched:** 2026-04-28
**Domain:** Node.js test authoring (node:test), corpus file scanning, XML tag enforcement
**Confidence:** HIGH — all findings verified by direct codebase inspection

---

## Summary

Phase 18 adds two new regression test files to enforce the fork's XML tag standards:

1. `tests/fork-persona-tag.test.cjs` — scans all 31 `agents/gsd-*.md` files, asserts `<persona>` present and `<role>` absent (outside code fences)
2. `tests/fork-intent-tag.test.cjs` — scans all `commands/gsd/*.md` files for the fork's `<intent>` tag standard

**Critical design issue surfaced by research:** The requirement for INTENT-01 says "asserts each contains `<intent>` block" — but 32 of 79 command files currently use `<objective>` (not `<intent>`), and 1 (graphify.md) has no primary directive block at all. Only 47 of 79 command files currently have `<intent>`. This gap means the test cannot both (a) pass on the current corpus and (b) assert `<intent>` presence in every file — unless the scope is limited to `<task>`-absence detection only, or 32 files are updated first.

The planner must choose one of two interpretations before writing the plan:

- **Interpretation A (task-absence only):** The test guards against upstream introducing `<task>` blocks. Files with `<objective>` are acceptable. Test passes immediately on current corpus.
- **Interpretation B (full <intent> enforcement):** Every command file must have `<intent>`. Requires fixing 32 `<objective>` files and graphify.md before or alongside the test. This contradicts the "test-only milestone" constraint.

Research strongly favors Interpretation A. The prior research file (`.planning/research/fork-regression-tests-research.md`) describes GAP-2 as: "Assert each that has a primary directive block uses `<intent>` not bare `<task>`" — explicitly framing it as a `<task>`-absence check, not a universal `<intent>`-presence check.

**Primary recommendation:** Write `fork-intent-tag.test.cjs` as a `<task>`-absence guard. Per-file subtests verify no bare `<task>` block opener exists. Separate from `<objective>` files which are a different (upstream) convention not enforced by this phase.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Test file authoring | Test layer (`tests/`) | — | New `.test.cjs` files in `tests/` picked up automatically by `scripts/run-tests.cjs` glob |
| Corpus file scanning | Test runtime | — | Tests read agents/ and commands/ directories at test time; no build step needed |
| Test runner integration | `scripts/run-tests.cjs` | — | Auto-discovers all `tests/*.test.cjs`; no manual registration |

---

## Verified Corpus State

All counts verified by direct filesystem inspection (2026-04-28). [VERIFIED: filesystem]

### Agent Files (PERSONA-01 scope)

| Property | Value |
|----------|-------|
| Total `agents/gsd-*.md` files | 31 |
| Files with `<persona>` tag | 31 (100%) |
| Files with `<role>` tag (anywhere) | 0 |
| Files with `<role>` tag in code fences | 0 |

**Confirmed:** PERSONA-01 test will pass immediately on the current corpus with no agent edits needed.

### Command Files (INTENT-01 scope)

| Property | Value |
|----------|-------|
| Total `commands/gsd/*.md` files | 79 |
| Files with `<intent>` | 47 |
| Files with `<objective>` only | 32 (older upstream pattern) |
| Files with `<task>` | 0 |
| Files with neither directive tag | 1 (`graphify.md`) |
| Files with both `<intent>` and `<objective>` | 2 (`quick.md`, `research-phase.md`) |

**Confirmed:** No command file currently uses `<task>`. Bare `<task>`-absence test passes immediately.

### Current Test Baseline [VERIFIED: npm test run]

| Metric | Value |
|--------|-------|
| Total passing | 4163 |
| Total failing | 2 (pre-existing, `qwen-install.test.cjs` — unrelated to this phase) |
| Failing tests location | `tests/qwen-install.test.cjs:285` and `:307` |

The 2 pre-existing failures are a known leaking-file issue in Qwen install tests and are NOT introduced by this phase. The ROADMAP baseline of "4165/4165" reflects a different run; current state is 4163 pass / 2 fail. TEST-GATE-01 success criterion is that no new failures are introduced — the 2 pre-existing failures are acceptable.

---

## Standard Stack

### Core (test authoring)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:test` | Node.js built-in (v24.14.1) | Test runner | All existing fork tests use this; no external deps |
| `node:assert/strict` | Node.js built-in | Assertions | All existing fork tests use strict assert |
| `fs` (built-in) | — | File reading | Used in every existing corpus scan test |
| `path` (built-in) | — | Path construction | Used in every existing corpus scan test |

**No new npm packages required.** [VERIFIED: existing test files]

---

## Architecture Patterns

### Test Runner Auto-Discovery

`scripts/run-tests.cjs` discovers all `*.test.cjs` files in `tests/` automatically via `readdirSync`. New files dropped in `tests/` with the `.test.cjs` extension are immediately picked up — no registration needed. [VERIFIED: `scripts/run-tests.cjs` lines 11-15]

```
tests/
├── fork-persona-tag.test.cjs   ← NEW: PERSONA-01
├── fork-intent-tag.test.cjs    ← NEW: INTENT-01
├── negative-framing-scan.test.cjs   (existing pattern to follow)
└── agent-size-budget.test.cjs       (existing per-file subtest pattern)
```

### Pattern: Per-File Subtests Inside a Single Describe Block

Used by `agent-size-budget.test.cjs` (per-agent) and `agent-frontmatter.test.cjs` (per-agent). Each file gets an individual `test()` call within a `describe()`. This produces one named subtest per file in `npm test` output — matching the success criteria requirement for "31 agent subtests" and "one subtest per command file".

```javascript
// Source: agent-size-budget.test.cjs (lines 65-78)
describe('SIZE: agent line-count budget', () => {
  for (const agent of ALL_AGENTS) {
    test(`${agent} (${tier}) stays under ${limit} lines`, () => {
      // assertion per file
    });
  }
});
```

### Pattern: Code-Fence Stripping for Tag Checks

The `<role>` absence check must exclude content inside code fences. If any agent file shows `<role>` in a code example (e.g., demonstrating upstream format), the regex would false-positive without fence stripping. [VERIFIED: prior research implementation note]

```javascript
// Strip code fence content before checking for <role>
const withoutFences = content.replace(/```[\s\S]*?```/g, '');
assert.ok(!/<role>/.test(withoutFences), `${file} must not use <role> tag`);
```

### Pattern: Bare Tag Block Detection

"Bare `<task>` as the outermost primary directive block" means: a line where `line.trim() === '<task>'`. This is distinct from `<task>` appearing inside prose, as an XML attribute value, or in code examples. [VERIFIED: prior research implementation note, `.planning/research/fork-regression-tests-research.md`]

```javascript
// Check for bare <task> block opener (not prose or attribute use)
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '<task>') {
    assert.fail(`${file}:${i+1} uses bare <task> block — replace with <intent>`);
  }
}
```

### Pattern: File Collection

```javascript
// Source: agent-frontmatter.test.cjs (lines 20-23)
const ALL_AGENTS = fs.readdirSync(AGENTS_DIR)
  .filter(f => f.startsWith('gsd-') && f.endsWith('.md'))
  .map(f => f.replace('.md', ''));
```

For commands, no filename prefix filter is needed (all `.md` files in `commands/gsd/` are commands):

```javascript
const COMMANDS_DIR = path.join(__dirname, '..', 'commands', 'gsd');
const commands = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.md'));
```

---

## Critical Design Decision: INTENT-01 Test Scope

[VERIFIED: direct file inspection + prior research]

**The problem:** REQUIREMENTS.md says "asserts each contains `<intent>` block" but only 47 of 79 command files contain `<intent>`. The other 32 use `<objective>` (older upstream convention) and 1 uses neither.

**Evidence that Interpretation A (task-absence only) is correct:**

1. Prior research (`.planning/research/fork-regression-tests-research.md`) describes the check as: "Assert each that has a primary directive block uses `<intent>` not bare `<task>`" — explicitly an anti-`<task>` guard, not a universal `<intent>`-presence assertion.
2. The REQUIREMENTS.md "Out of Scope" section explicitly states: "Any new prompt file edits — This milestone is test-only — no changes to prompt content." Converting 32 files from `<objective>` to `<intent>` would be prompt content edits.
3. The upstream changes guide (`.planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md`) confirms the `<task>` → `<intent>` rename was the fork change — upstream commands use `<objective>`, not `<task>`. The regression risk is upstream adding NEW commands with `<task>`, not existing `<objective>` files.
4. Subtest count: prior research estimated "~47–51 subtests" which aligns with the 47 files that have `<intent>` — strongly suggesting the per-file subtests scan only files WITH a directive block for `<intent>` presence.

**Recommended test design for INTENT-01:**

- One global `test()`: scans all 79 command files, asserts no bare `<task>` block opener exists. This is the primary regression guard.
- Optional: per-file subtests for the 47 files that already have `<intent>`, asserting `<intent>` presence. This does NOT fail the 32 `<objective>` files.
- Do NOT assert `<intent>` presence in all 79 files — that would fail immediately and require out-of-scope prompt content edits.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Test discovery | Custom file scanner | `scripts/run-tests.cjs` auto-glob | Already picks up all `.test.cjs` files |
| Code fence stripping | Custom parser | Single regex `replace(/```[\s\S]*?```/g, '')` | Sufficient for this use case; full markdown parser is overkill |
| File collection | Recursive traversal | `fs.readdirSync()` flat filter | `commands/gsd/` and `agents/` are flat directories |

---

## Common Pitfalls

### Pitfall 1: False Positive for `<role>` in Code Fences
**What goes wrong:** An agent file that shows `<role>` in a code example (to demonstrate upstream format) would fail the `<role>` absence check without fence stripping.
**Why it happens:** Simple `content.includes('<role>')` checks don't distinguish code-fence context from live XML.
**How to avoid:** Strip code fence content before checking: `content.replace(/```[\s\S]*?```/g, '')`.
**Warning signs:** Test fails on an agent that merely documents the `<role>` tag in prose.

### Pitfall 2: Asserting `<intent>` in All 79 Command Files
**What goes wrong:** A test that asserts every command file contains `<intent>` will immediately fail on 33 files (32 use `<objective>`, 1 uses neither), producing 33 test failures and blocking TEST-GATE-01.
**Why it happens:** Requirement text "asserts each contains `<intent>` block" is ambiguous — it can mean "each that has a directive block" not "each of the 79 files".
**How to avoid:** Scope the `<intent>`-presence assertion to: (a) the 47 files that already have it, or (b) only assert `<task>` absence across all 79.
**Warning signs:** Running the test immediately fails with errors pointing to `add-backlog.md`, `audit-fix.md`, etc.

### Pitfall 3: `<task>` Detection Matching Prose Uses
**What goes wrong:** A regex like `content.includes('<task>')` would match `<task>` appearing in prose descriptions, code examples, or as part of another tag name.
**Why it happens:** Simple substring match doesn't distinguish tag-opener context.
**How to avoid:** Use `line.trim() === '<task>'` — bare `<task>` block opener only.
**Warning signs:** False positives on files that discuss `<task>` blocks in documentation.

### Pitfall 4: Forgetting the 2 Pre-Existing Test Failures
**What goes wrong:** Test-GATE-01 success is declared only when all tests pass, but there are 2 pre-existing failures in `qwen-install.test.cjs` that are not caused by this phase.
**Why it happens:** Running `npm test` and seeing failures causes alarm, but these failures pre-date Phase 18.
**How to avoid:** TEST-GATE-01 criterion is "no new failures introduced" — the 2 qwen failures are acceptable. Verify by running `npm test` before and after, comparing failure count.
**Warning signs:** Spending time debugging qwen failures that existed before the phase.

### Pitfall 5: Subtest Count Mismatch in PERSONA-01
**What goes wrong:** Success criteria says "31 agent subtests" but test generates 2 subtests per agent (one `<persona>` check + one `<role>` check) = 62 subtests.
**Why it happens:** "31 agent subtests" may mean 31 agents × 2 checks = 62 total, or it may mean a single subtest per agent covering both checks.
**How to avoid:** Either approach is acceptable; the success criterion cares about 0 failures, not exact subtest count. Use 2 subtests per agent (matching `agent-frontmatter.test.cjs` pattern of individual focused tests) for clearer failure messages.

---

## Code Examples

### `fork-persona-tag.test.cjs` — Complete Template

```javascript
// Source: derived from agent-size-budget.test.cjs pattern + prior research
'use strict';

/**
 * Fork Persona Tag Tests
 *
 * Regression guard for the <persona> → <role> upstream revert risk.
 * All 31 agents in agents/gsd-*.md must use <persona> tag, not <role>.
 * Upstream agents use <role>; every upstream merge that touches an agent
 * file risks reverting this fork change silently.
 */

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const AGENTS_DIR = path.join(__dirname, '..', 'agents');

const agents = fs.readdirSync(AGENTS_DIR)
  .filter(f => f.startsWith('gsd-') && f.endsWith('.md'));

describe('PERSONA: agent files use <persona>, not <role>', () => {
  for (const file of agents) {
    test(`${file} contains <persona> tag`, () => {
      const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
      assert.ok(
        content.includes('<persona>'),
        `${file} must contain <persona> tag — upstream merge may have reverted to <role>`
      );
    });

    test(`${file} does not use <role> as persona XML tag`, () => {
      const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
      // Strip code fence content to allow <role> in documentation examples
      const withoutFences = content.replace(/```[\s\S]*?```/g, '');
      assert.ok(
        !/<role>/.test(withoutFences),
        `${file} must not use <role> as persona XML tag (outside code fences) — use <persona> instead`
      );
    });
  }
});
```

### `fork-intent-tag.test.cjs` — Complete Template (Interpretation A)

```javascript
// Source: derived from negative-framing-scan.test.cjs corpus scan pattern + prior research
'use strict';

/**
 * Fork Intent Tag Tests
 *
 * Regression guard for the <task> → <intent> rename in command layer.
 * Upstream commands use <task> for their primary directive block.
 * This fork uses <intent> to disambiguate from workflow <task> blocks.
 *
 * What this guards: upstream adding new commands with <task> block opener.
 * What this does NOT flag: existing <objective> blocks (older upstream convention,
 * not a regression risk since upstream uses neither <objective> nor <task> for commands).
 */

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const COMMANDS_DIR = path.join(__dirname, '..', 'commands', 'gsd');

const commands = fs.readdirSync(COMMANDS_DIR)
  .filter(f => f.endsWith('.md'))
  .sort();

describe('INTENT: no command file uses bare <task> as primary directive block', () => {
  test('no command file uses <task> as outermost directive block', () => {
    const violations = [];
    for (const file of commands) {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, file), 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '<task>') {
          violations.push(`${file}:${i + 1} uses bare <task> block — replace with <intent>`);
        }
      }
    }
    assert.deepEqual(violations, [],
      `Command files with bare <task> blocks:\n${violations.join('\n')}`
    );
  });
});

describe('INTENT: command files that have a directive block use <intent>', () => {
  // Only check files that explicitly have an <intent> block (47 of 79 currently).
  // Files with <objective> are from older upstream convention — not a regression risk.
  const intentFiles = commands.filter(f => {
    const content = fs.readFileSync(path.join(COMMANDS_DIR, f), 'utf-8');
    return content.includes('<intent>');
  });

  for (const file of intentFiles) {
    test(`${file} contains <intent> block`, () => {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, file), 'utf-8');
      assert.ok(
        content.includes('<intent>'),
        `${file} must contain <intent> block — upstream merge may have replaced with <task>`
      );
    });
  }
});
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` (v24.14.1) |
| Config file | None — `scripts/run-tests.cjs` discovers `tests/*.test.cjs` automatically |
| Quick run command | `node --test tests/fork-persona-tag.test.cjs tests/fork-intent-tag.test.cjs` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERSONA-01 | All 31 agents have `<persona>` tag, none have `<role>` outside fences | unit/corpus | `node --test tests/fork-persona-tag.test.cjs` | ❌ Wave 0 |
| INTENT-01 | No command file has bare `<task>` block opener; files with `<intent>` retain it | unit/corpus | `node --test tests/fork-intent-tag.test.cjs` | ❌ Wave 0 |
| TEST-GATE-01 | Full suite green with both new files integrated | integration | `npm test` | ✅ (existing runner) |

### Sampling Rate

- **Per task commit:** `node --test tests/fork-persona-tag.test.cjs tests/fork-intent-tag.test.cjs`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/fork-persona-tag.test.cjs` — covers PERSONA-01
- [ ] `tests/fork-intent-tag.test.cjs` — covers INTENT-01

*(No framework install needed — node:test is built in)*

---

## Environment Availability

Step 2.6: Dependencies are all Node.js built-ins or existing corpus files. No external dependencies.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Test runner | ✓ | v24.14.1 | — |
| `node:test` | Test framework | ✓ | built-in | — |
| `agents/gsd-*.md` (31 files) | PERSONA-01 | ✓ | current | — |
| `commands/gsd/*.md` (79 files) | INTENT-01 | ✓ | current | — |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Agent files use `<role>` tag (upstream) | Fork uses `<persona>` | v1.37.1 Phase 10 | Every upstream agent merge risks revert |
| Command files use `<task>` or `<objective>` (upstream) | Fork uses `<intent>` | Plans phase (pre-v1.36.0) | Upstream new commands arrive with `<task>` |
| No corpus tests for XML tag standards | Two new test files | This phase | Automated regression detection |

---

## Open Questions (RESOLVED)

1. **Per-file subtests vs single test for INTENT-01**
   - What we know: Success criteria says "one subtest per command file passing" (ROADMAP line 95)
   - What's unclear: The bare-`<task>` check can be a single aggregating test OR per-file subtests; per-file subtests for 79 files produce cleaner output but require restructuring the template
   - Recommendation: Use per-file subtests for the `<intent>` presence check (47 files), and a single aggregating test for the `<task>` absence check across all 79. This gives named subtests per file while keeping the anti-`<task>` guard as a single clear assertion.
   - **RESOLVED → Per-file subtests chosen (79 total, one per command file). Each file gets its own `test()` call checking for bare `<objective>` or `<task>` absence.**

2. **INTENT-01 test scope: Interpretation A vs B**
   - What we know: 47 files have `<intent>`, 32 have `<objective>`, 0 have `<task>`, 1 has neither
   - What's unclear: Whether REQUIREMENTS.md "asserts each contains `<intent>` block" means all 79 or just the 47
   - Recommendation: Interpretation A (task-absence guard) — aligns with "test-only milestone" constraint and prior research wording. If Interpretation B is intended, the plan must add a precursor task to convert 32 `<objective>` files, which is out-of-scope prompt content editing.
   - **RESOLVED → Interpretation B (stricter) chosen by user. Test guards against BOTH `<objective>` AND `<task>` as bare outermost blocks. 32 files with `<objective>` will fail — intentional, documented as BY DESIGN. Conversions deferred to a follow-on phase.**

3. **Success criteria subtest count**
   - What we know: ROADMAP says "31 agent subtests" and "one subtest per command file"
   - What's unclear: Does "31 agent subtests" mean 31 or 62 (31 × 2 checks per agent)?
   - Recommendation: Use 2 subtests per agent (62 total for persona test) for cleaner failure messages. "31 agent subtests" in the success criteria is interpreted as "31 agents each verified" not literally 31 test() calls.
   - **RESOLVED → 62 subtests (31 agents × 2 checks: `<persona>` presence + `<role>` absence). "31 agent subtests" in ROADMAP means 31 agents verified, not 31 literal test() calls.**

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | INTENT-01 means `<task>`-absence guard, not `<intent>`-presence for all 79 files | Critical Design Decision section | If wrong, the test immediately fails 33 files; requires out-of-scope file edits |
| A2 | The 2 pre-existing qwen-install failures are acceptable for TEST-GATE-01 pass | Verified Corpus State | If wrong, Phase 18 cannot complete without fixing unrelated Qwen test |

---

## Sources

### Primary (HIGH confidence)

- [VERIFIED: filesystem] — Direct inspection of `agents/gsd-*.md` (31 files), `commands/gsd/*.md` (79 files) via Bash
- [VERIFIED: npm test run] — Current test baseline: 4163 pass / 2 fail
- [VERIFIED: `scripts/run-tests.cjs`] — Auto-discovery of `tests/*.test.cjs` files, lines 11-15
- [VERIFIED: `tests/agent-size-budget.test.cjs`] — Per-file subtest pattern, lines 65-78
- [VERIFIED: `tests/negative-framing-scan.test.cjs`] — Corpus scan + code-fence stripping patterns
- [VERIFIED: `tests/agent-frontmatter.test.cjs`] — File collection pattern, lines 20-28
- [VERIFIED: `.planning/research/fork-regression-tests-research.md`] — Prior research with implementation notes and code templates
- [VERIFIED: `.planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md` lines 68-80] — `<task>` → `<intent>` rename scope and rationale
- [VERIFIED: `package.json`] — `npm test` runs `node scripts/run-tests.cjs`

### Secondary (MEDIUM confidence)

- [CITED: `.planning/REQUIREMENTS.md`] — PERSONA-01, INTENT-01, TEST-GATE-01 requirement text
- [CITED: `.planning/ROADMAP.md` lines 89-98] — Success criteria for Phase 18

---

## Metadata

**Confidence breakdown:**
- Test structure / authoring patterns: HIGH — verified against 3+ existing test files
- Corpus state (file counts, tag presence): HIGH — verified by direct filesystem inspection
- INTENT-01 design interpretation: MEDIUM — prior research supports Interpretation A but requirement text is ambiguous (see A1 in Assumptions Log)
- Test baseline: HIGH — verified by running `npm test`

**Research date:** 2026-04-28
**Valid until:** Until next upstream merge (corpus counts may change if new agent/command files land)
