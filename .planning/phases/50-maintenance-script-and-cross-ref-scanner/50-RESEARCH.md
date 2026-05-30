# Phase 50: Maintenance Script and Cross-Ref Scanner - Research

**Researched:** 2026-05-30
**Domain:** Markdown step-numbering maintenance tooling + cross-file reference integrity scanner
**Confidence:** HIGH

## Summary

Phase 50 ships three artifacts that make the whole-integer step-numbering invariant (delivered in Phase 49) self-maintaining after upstream merges:

1. **Plan 1 (hardening prerequisite):** Replace the line-start anchor in `scanForOutOfOrder()` at `tests/step-numbering-scan.test.cjs:149` from `^\s*\*?\*?` to `^[\s*]*` and add list-marker stripping so list-prefixed (`- **Step N:**`, `1. **Step N:**`) and blockquote-prefixed (`> **Step N:**`) step labels are also detected. The corpus currently has zero such patterns (verified 2026-05-30), so this change is RED-then-GREEN against a synthetic fixture, GREEN against the real corpus.

2. **Plan 2:** `scripts/normalize-step-numbers.cjs` — a cross-file-aware, idempotent CLI that discovers decimal/letter-suffix step labels across `SCAN_DIRS`, renumbers them to sequential whole integers per section, dynamically discovers cross-file prose references (`<file>.md step N`, `step N in <file>.md`) at runtime via grep, and updates them atomically. `--dry-run` exits 0 and reports "no changes needed" on the post-Phase-49 clean corpus.

3. **Plan 3:** `tests/cross-file-step-refs.test.cjs` — a scanner that detects prose cross-file step references where step N does not exist as a heading or column-0-to-2 ordered-list item in the target file. Skips same-file refs (target file == source file). RED test injects a synthetic stale ref via temp-file fixture.

All three artifacts mirror the structure of `tests/step-numbering-scan.test.cjs` and `tests/negative-framing-scan.test.cjs` — module-scope `ALL_FILES` collection, code-fence skip via `inCodeBlock` toggle, identical `SCAN_DIRS` and `PATTERN_C_EXCLUDES`. The normalize script's CLI shape mirrors `scripts/strip-prose-atrefs.cjs` (arg parsing, `--dry-run` flag, in-place `fs.writeFileSync`, per-file logging).

**Primary recommendation:** Build Plan 1 first as the standalone scanner hardening — gates the scanner before the new artifacts depend on it. Build Plan 3 (cross-file scanner test) before Plan 2 (normalize script) is convenient ordering, but the locked CONTEXT.md D-08 sequences Plan 2 then Plan 3. Honor that sequencing.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Normalize Script: Cross-File Reference Discovery**

- **D-01:** `normalize-step-numbers.cjs` discovers cross-file prose references dynamically by grepping the entire corpus on every run — no pre-built manifest file consumed. This ensures the script remains accurate after any upstream merge that introduces new cross-file refs, without requiring Phase 49's MAP-01.md artifact.
- **D-02:** The script's output reports cross-file ref updates explicitly — each updated cross-file reference is logged alongside file-level rename stats. Transparency makes post-merge verification straightforward.
- **D-03:** `--dry-run` flag exits 0 and reports "no changes needed" on the post-Phase-49 clean corpus (idempotency guarantee). In dry-run mode the script also reports what it *would* change.

**Cross-File Scanner: Detection Pattern**

- **D-04:** `tests/cross-file-step-refs.test.cjs` detects both word-order variants: `filename.md step N` AND `step N in filename.md`. No same-file ref exclusion needed (scanner checks whether the file referenced is the *same* file doing the referencing — if so, skip).
- **D-05:** Step existence check uses prose headings only, skipping content inside code fences — mirrors `step-numbering-scan.test.cjs` behavior. A cross-file ref pointing to a code-fenced step is a false ref (code fences document examples, not real steps).
- **D-06:** The RED test (synthetic stale ref injection) injects a reference in a temporary file (not by modifying corpus files) to confirm detection without dirtying the actual corpus.

**Plan Structure**

- **D-07:** `scanForOutOfOrder` anchor hardening is Plan 1 — a standalone plan that edits `tests/step-numbering-scan.test.cjs` before any new artifacts are built. This ensures the scanner is solid before the normalize script and cross-file test build on top of it.
- **D-08:** Plan 2 builds `scripts/normalize-step-numbers.cjs`. Plan 3 builds `tests/cross-file-step-refs.test.cjs`. Three plans total for Phase 50.

### Claude's Discretion

- Exact output format of the normalize script (tabular, list, or summary counts — Claude decides)
- Whether `normalize-step-numbers.cjs` accepts specific file paths as arguments for targeted single-file runs (useful ergonomic enhancement — Claude decides if it adds complexity)
- Synthetic stale ref injection mechanism in the RED test (temp file creation pattern or inline string fixture)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NORM-02 | `scripts/normalize-step-numbers.cjs` is cross-file-aware — discovers cross-file refs dynamically (D-01 overrides original MAP-01 dependency from REQUIREMENTS.md), updates them simultaneously when renaming, `--dry-run` flag, idempotency guarantee | Plan 2 builds the script; reuses `strip-prose-atrefs.cjs` CLI pattern; cross-file discovery uses the same grep pattern Phase 49 MAP-01 used manually |
| XREF-01 | `tests/cross-file-step-refs.test.cjs` detects prose cross-file step references where target step N does not exist as a heading in the target file — written GREEN against clean post-Phase-49 corpus to lock in for future upstream merges | Plan 3 builds the test; mirrors `step-numbering-scan.test.cjs` structure; uses two detection regexes per D-04; RED test via temp-file fixture per D-06 |

</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Scanner hardening (Plan 1) | Node.js test layer | — | Single regex/anchor change inside `tests/step-numbering-scan.test.cjs` |
| Decimal/letter-suffix detection | Node.js scanner module | — | Reuse `STEP_DECIMAL_RE` from `step-numbering-scan.test.cjs` |
| Cross-file ref discovery (script) | Node.js CLI | Filesystem read | grep-pattern execution + file enumeration |
| In-place file rewriting | Node.js CLI | Filesystem write | `fs.writeFileSync` per file; no temp-file shuffle (`strip-prose-atrefs.cjs` precedent) |
| Cross-file ref integrity validation | Node.js test layer | — | `tests/cross-file-step-refs.test.cjs` discovered by `scripts/run-tests.cjs` |
| Test discovery | `scripts/run-tests.cjs` | — | Auto-discovers `tests/*.test.cjs`; no wiring needed |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `node:test` | 24.14.1 (verified `node --version`) | Test framework | Project-wide standard — every existing test in `tests/` uses it [VERIFIED: codebase grep] |
| Node.js built-in `node:assert/strict` | 24.14.1 | Assertions | Pairs with `node:test`; used by all existing scanners [VERIFIED: codebase grep] |
| Node.js built-in `fs` | 24.14.1 | File I/O | `readFileSync`, `writeFileSync`, `readdirSync` with `withFileTypes` — matches `step-numbering-scan.test.cjs` lines 30, 168–186 [VERIFIED: codebase grep] |
| Node.js built-in `path` | 24.14.1 | Path joins | `path.join`, `path.relative`, `path.sep` — matches existing scanners [VERIFIED: codebase grep] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js built-in `os` | 24.14.1 | Temp dir path | `os.tmpdir()` for RED-test stale-ref injection (D-06) [VERIFIED: codebase grep, used in tests/helpers.cjs] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline regex | A glob library (`fast-glob`, `globby`) | Project is zero-runtime-dep — adding a glob lib breaks the package.json discipline. Use existing `collectMarkdownFiles()` recursion instead. |
| Module-scope state | Per-test setup/teardown | Existing scanners collect `ALL_FILES` at module scope for single filesystem traversal (`step-numbering-scan.test.cjs:55-58`). Match that pattern. |
| Spawning shell `grep` | Pure-JS regex iteration | The reference scripts (`strip-prose-atrefs.cjs`) use pure-JS regex iteration. No shell dependency — runs identically across platforms. |

**Installation:** No new packages required — Phase 50 uses Node.js built-ins exclusively.

**Version verification:**
```bash
node --version    # Verified: v24.14.1
npm --version     # Verified: 11.11.0
```

## Package Legitimacy Audit

> Phase 50 installs NO external packages. Audit table omitted intentionally — only Node.js built-ins are used. All three artifacts (Plan 1 edit, Plan 2 script, Plan 3 test) consume only `node:test`, `node:assert/strict`, `fs`, `path`, `os` — every one is a Node 20+/22+ built-in and ships with the runtime.

**Packages removed due to slopcheck [SLOP] verdict:** N/A (no packages proposed)
**Packages flagged as suspicious [SUS]:** N/A (no packages proposed)

## Architecture Patterns

### System Architecture Diagram

```
                       ┌─────────────────────────────────────────────┐
                       │  Phase 50 Maintenance Cycle (post-upstream-merge) │
                       └─────────────────────────────────────────────┘
                                          │
                                          ▼
   ┌────────────────────────────────────────────────────────────────────┐
   │  Step A: Detect violations                                        │
   │  $ node --test tests/step-numbering-scan.test.cjs                 │
   │  (Phase 48 scanner + Plan 1 anchor hardening)                     │
   └─────────────────────────────┬──────────────────────────────────────┘
                                 │ RED → step B
                                 │ GREEN → step D
                                 ▼
   ┌────────────────────────────────────────────────────────────────────┐
   │  Step B: Renormalize                                              │
   │  $ node scripts/normalize-step-numbers.cjs [--dry-run]            │
   │                                                                    │
   │     ┌─────────────────────────────────────────┐                   │
   │     │ collect SCAN_FILES (= step-scan SCAN_DIRS minus PATTERN_C)│ │
   │     └────────────┬────────────────────────────┘                   │
   │                  ▼                                                 │
   │     ┌─────────────────────────────────────────┐                   │
   │     │ build per-file rename map (old→new step)│                   │
   │     │   using STEP_DECIMAL_RE detection +     │                   │
   │     │   per-section sequential renumbering    │                   │
   │     └────────────┬────────────────────────────┘                   │
   │                  ▼                                                 │
   │     ┌─────────────────────────────────────────┐                   │
   │     │ dynamically grep entire corpus for      │                   │
   │     │ cross-file refs (D-01):                 │                   │
   │     │   <file>.md step N    AND               │                   │
   │     │   step N in <file>.md                   │                   │
   │     └────────────┬────────────────────────────┘                   │
   │                  ▼                                                 │
   │     ┌─────────────────────────────────────────┐                   │
   │     │ apply renames + cross-file ref updates  │                   │
   │     │ in-place via fs.writeFileSync           │                   │
   │     │ (skip writes in --dry-run mode)         │                   │
   │     └────────────┬────────────────────────────┘                   │
   │                  ▼                                                 │
   │     ┌─────────────────────────────────────────┐                   │
   │     │ log per-file rename count + cross-file  │                   │
   │     │ ref updates (D-02) to stdout            │                   │
   │     └────────────┬────────────────────────────┘                   │
   └─────────────────┬┼──────────────────────────────────────────────────┘
                     ▼
   ┌────────────────────────────────────────────────────────────────────┐
   │  Step C: Re-verify scanner (loop until GREEN)                     │
   │  $ node --test tests/step-numbering-scan.test.cjs                 │
   └─────────────────────────────┬──────────────────────────────────────┘
                                 ▼
   ┌────────────────────────────────────────────────────────────────────┐
   │  Step D: Cross-file integrity check                               │
   │  $ node --test tests/cross-file-step-refs.test.cjs                │
   │  (Plan 3 — fails if any prose ref points at a non-existent step)  │
   │                                                                    │
   │     ┌─────────────────────────────────────────┐                   │
   │     │ for each source file: find prose refs   │                   │
   │     │   "X.md step N" / "step N in X.md"      │                   │
   │     └────────────┬────────────────────────────┘                   │
   │                  ▼                                                 │
   │     ┌─────────────────────────────────────────┐                   │
   │     │ skip same-file refs (target == source)  │                   │
   │     └────────────┬────────────────────────────┘                   │
   │                  ▼                                                 │
   │     ┌─────────────────────────────────────────┐                   │
   │     │ open target file, extract real step set │                   │
   │     │ (whole-integer headings + Pattern D     │                   │
   │     │  ordered-list items, code fences excluded)│                 │
   │     └────────────┬────────────────────────────┘                   │
   │                  ▼                                                 │
   │     ┌─────────────────────────────────────────┐                   │
   │     │ assert prose-ref step N ∈ target's set  │                   │
   │     └─────────────────────────────────────────┘                   │
   └────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
scripts/
├── normalize-step-numbers.cjs  # NEW — Plan 2
└── strip-prose-atrefs.cjs       # EXISTING template

tests/
├── cross-file-step-refs.test.cjs   # NEW — Plan 3
├── step-numbering-scan.test.cjs    # MODIFIED — Plan 1 anchor hardening
└── negative-framing-scan.test.cjs  # EXISTING template
```

### Component Responsibilities

| Component | File | Responsibility |
|-----------|------|----------------|
| Scanner core | `tests/step-numbering-scan.test.cjs` | Decimal label detection + out-of-order detection (Plan 1 hardens `scanForOutOfOrder`) |
| Normalize CLI | `scripts/normalize-step-numbers.cjs` | Renumbering + cross-file ref update + dry-run mode (Plan 2) |
| Cross-file integrity test | `tests/cross-file-step-refs.test.cjs` | Validates every prose `<file>.md step N` references a real step (Plan 3) |
| Test runner | `scripts/run-tests.cjs` | Auto-discovers `tests/*.test.cjs` — no wiring changes |

### Pattern 1: Module-scope `ALL_FILES` + per-directory `describe` block

**What:** Collect markdown files once at module scope, then iterate inside `describe` blocks to generate one subtest per file.
**When to use:** Plan 3 cross-file scanner test (corpus subtests).
**Example (from `step-numbering-scan.test.cjs:55-63`):**
```javascript
// Source: tests/step-numbering-scan.test.cjs lines 55-63
const ALL_FILES = [];
for (const dir of SCAN_DIRS) {
  ALL_FILES.push(...collectMarkdownFiles(path.join(PROJECT_ROOT, dir)));
}
const SCAN_FILES = ALL_FILES.filter(f =>
  !PATTERN_C_EXCLUDES.has(path.relative(PROJECT_ROOT, f).split(path.sep).join('/'))
);
```

### Pattern 2: Code-fence skip toggle

**What:** Track `inCodeBlock` state line-by-line; skip all content inside triple-backtick fences.
**When to use:** Plan 2 normalize script (parsing real step labels), Plan 3 scanner (parsing both prose refs and target-file step headings).
**Example (from `step-numbering-scan.test.cjs:83-94`):**
```javascript
// Source: tests/step-numbering-scan.test.cjs lines 83-94
let inCodeBlock = false;
for (let i = 0; i < lines.length; i++) {
  const trimmed = lines[i].trim();
  if (/^```/.test(trimmed)) {
    inCodeBlock = !inCodeBlock;
    continue;
  }
  if (inCodeBlock) continue;
  // detection logic here
}
```

### Pattern 3: CLI with `--dry-run` flag + in-place write

**What:** Parse `--dry-run` from `process.argv`; gate `fs.writeFileSync` on it; log every change either way.
**When to use:** Plan 2 normalize script.
**Example (adapted from `scripts/strip-prose-atrefs.cjs:29, 91`):**
```javascript
// Source: scripts/strip-prose-atrefs.cjs lines 29, 91
const DRY_RUN = process.argv.includes('--dry-run');
// ... compute new content ...
if (result === original) return false;
if (!DRY_RUN) fs.writeFileSync(filePath, result, 'utf-8');
return true;
```

### Pattern 4: `collectMarkdownFiles()` recursion with ENOENT tolerance

**What:** Recursive directory walk; tolerate missing directories (ENOENT) silently; re-throw other errors.
**When to use:** Plans 2 and 3 (file enumeration).
**Example (from `step-numbering-scan.test.cjs:168-186`):**
```javascript
// Source: tests/step-numbering-scan.test.cjs lines 168-186
function collectMarkdownFiles(dir) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...collectMarkdownFiles(fullPath));
      } else if (entry.name.endsWith('.md')) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  return results;
}
```

### Pattern 5: Per-section step counter reset

**What:** Reset the step sequence counter on every `##` or `###` heading. This is how `scanForOutOfOrder` handles files with multiple independent step sequences.
**When to use:** Plan 2 normalize script (must use the same reset logic when computing the rename map, otherwise sequences spanning sections will be renumbered incorrectly).
**Example (from `step-numbering-scan.test.cjs:136-139`):**
```javascript
// Source: tests/step-numbering-scan.test.cjs lines 136-139
if (/^#{2,3}\s/.test(line)) {
  expectedNext = null;  // reset per section
  continue;
}
```

### Anti-Patterns to Avoid

- **Silent truthy `-1` from `indexOf`:** `content.indexOf("Step 2.5")` returns `-1` when the label is renamed. `-1` is truthy in JavaScript — `assert.ok(content.indexOf(...))` passes silently with the stale label. **Use `assert.notEqual(content.indexOf(...), -1, msg)` or `assert.ok(content.includes(...))`.** Carry the warning from STATE.md §Key Risk forward.
- **Hardcoded MAP-01 ingestion:** Do not read `49-MAP-01.md` from the script. Per D-01 the discovery is dynamic-only — pre-built indexes go stale after upstream merges.
- **Spanning sections when renumbering:** Walking the whole file with one counter would renumber `## A: Step 1, ## B: Step 1` to `Step 1, Step 2` — wrong. Honor `##`/`###` reset boundaries per Phase 48 D-04.
- **`set -e` on a regex-driven `grep`:** Discovery in shell would die when grep returns 1 (no matches). Use pure-JS regex iteration over file contents (precedent: `strip-prose-atrefs.cjs`).
- **Treating Step 0 as a violation:** Phase 48 explicitly allows `Step 0` as a starting label. Plan 2 must preserve this — `Step 0, Step 1, Step 2` is a valid sequence, not a renumber target.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown file enumeration | A new traversal helper | `collectMarkdownFiles()` from `step-numbering-scan.test.cjs:168-186` (duplicate inline — keep helpers.cjs untouched per Phase 48 reusable-assets note) | Battle-tested pattern with ENOENT tolerance; same as `negative-framing-scan.test.cjs` |
| Decimal label detection | A new regex | Reuse `STEP_DECIMAL_RE` from Phase 48 (`/(?:^|\s|\*\*)Step\s+\d+(?:\.\d|[a-z])/i`) | Single source of truth for what counts as a violation; identical in script and scanner |
| Code-fence parsing | A markdown AST library | Triple-backtick toggle (Pattern 2 above) | All existing scanners use the toggle; ~5 lines of code; no dep needed |
| CLI arg parsing | A flags library (`yargs`, `commander`) | `process.argv.includes('--dry-run')` per `strip-prose-atrefs.cjs:29` | Project-wide pattern; zero-dep discipline |
| Atomic write | A library wrapping `fs.rename` | Plain `fs.writeFileSync` (matches `strip-prose-atrefs.cjs:91`) | Maintenance script runs from a clean working tree; partial writes are caught by git status pre-flight |
| Test discovery wiring | A `package.json` entry | None — `scripts/run-tests.cjs` already globs `tests/*.test.cjs` | Confirmed by `ls tests/*.test.cjs` showing all existing scanners auto-discovered |

**Key insight:** Phase 50 is a textbook case of leveraging existing patterns. Every helper, regex, file-collection idiom, CLI shape, and test-runner integration has a working template in `tests/step-numbering-scan.test.cjs`, `tests/negative-framing-scan.test.cjs`, or `scripts/strip-prose-atrefs.cjs`. Hand-rolling anything new is a smell.

## Runtime State Inventory

> Not a rename/refactor/migration phase. Phase 50 ADDS three artifacts (1 edit + 2 new files) but does not rename anything in the runtime corpus. Phase 49 already did that work and Phase 49 UAT verified zero stale state.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — Phase 50 writes only to source files in `scripts/` and `tests/` | None |
| Live service config | None — no external services touched | None |
| OS-registered state | None — no Task Scheduler / launchd / systemd entries | None |
| Secrets/env vars | None — script reads no env vars | None |
| Build artifacts | None — `scripts/` files are `.cjs` and require no build step | None |

**Nothing found in category:** Verified by inspecting `scripts/` (no build pipeline for `.cjs` files), `package.json` (no `prepare` or `build` scripts that touch scripts/), and `hooks/dist/` (separate from `scripts/`).

## Common Pitfalls

### Pitfall 1: Out-of-order anchor regression

**What goes wrong:** Replacing `^\s*\*?\*?` with `^[\s*]*` is a permissive widening. A future upstream merge could introduce a new false-positive pattern (e.g., an asterisk-prefixed code-fence line `***Step 5:***`) that the new anchor matches.
**Why it happens:** `[\s*]*` matches any number of whitespace OR asterisks, including arbitrary `***`.
**How to avoid:** After Plan 1, run the full corpus scanner (`node --test tests/step-numbering-scan.test.cjs`) and confirm 629/629 still GREEN. The corpus is currently clean; any new failure means the anchor matched something it shouldn't.
**Warning signs:** Scanner reports out-of-order violations against a file Phase 49 already normalized.

### Pitfall 2: Dynamic discovery missing prose variants

**What goes wrong:** The script's grep pattern misses a prose variant — e.g., `as documented in execute-phase.md (step 7)` with parens, or `execute-phase.md's Step 7`. After normalize runs the corpus passes `step-numbering-scan.test.cjs` but `cross-file-step-refs.test.cjs` fails because the script left a stale ref.
**Why it happens:** Two regexes per D-04 cover the common cases (`X.md step N` and `step N in X.md`) but human-written prose has many forms.
**How to avoid:** Phase 49 MAP-01 enumerated every existing prose variant in the corpus (only 4 cross-file refs total, all matching the two D-04 patterns). The current corpus is the test bed — if Plan 2 + Plan 3 GREEN-pass against it, the coverage is sufficient. Document the two patterns in script header so future upstream merges can extend.
**Warning signs:** Plan 3 cross-file scanner detects stale refs immediately after Plan 2's script ran.

### Pitfall 3: Code-fenced step labels counted as real

**What goes wrong:** `execute-phase.md` line 925 contains `**Step 7 — classify before branching (#3095):**` inside a `12. Handle failures:` block — but it's prose, not a code fence. The cross-file scanner's heading-existence check could match it. Meanwhile, code-fenced examples (e.g., `quick.md Step 7` inside `fast.md:75` is inside a ` ```bash ` block) are NOT real refs and must be skipped.
**Why it happens:** Two distinct rules collide: (a) "skip code-fenced ref candidates" (D-05 entry side) and (b) "skip code-fenced target headings" (D-05 target side). Both must use the same `inCodeBlock` toggle.
**How to avoid:** Apply the code-fence skip on BOTH sides of the lookup: when extracting prose refs from a source file AND when extracting real headings/items from a target file. Verified pattern in Plan 2's normalize script also.
**Warning signs:** `fast.md` lines 75/83 (`quick.md Step 7` inside bash fence) trigger Plan 3 scanner — this means the source-side fence skip is broken.

### Pitfall 4: Same-file refs matched as cross-file

**What goes wrong:** `autonomous.md` references its own `step 3a`, `step 3a.5`, etc. Phase 49 Plan 13 already updated these. Per D-04 the cross-file scanner skips same-file refs by comparing source path to target path. If the comparison is naive (`source.endsWith(target.basename)`), edge cases like `workflows/execute-phase.md` vs `workflows/execute-phase/steps/post-merge-gate.md` (different files, similar basename) could go wrong.
**Why it happens:** Filename basename collisions or path-separator differences (Windows backslash vs POSIX forward-slash).
**How to avoid:** Use `path.relative(PROJECT_ROOT, sourceFile).split(path.sep).join('/').endsWith('/' + targetBasename)` AND require an exact basename equality check on `path.basename(sourceFile) === targetBasename` before classifying as same-file. Both must agree.
**Warning signs:** Cross-file scanner reports zero violations on a corpus where Plan 2 left a known cross-file inconsistency, OR scanner reports the four expected cross-file refs (3× `execute-plan.md → execute-phase.md`, 1× `post-merge-gate.md → execute-phase.md`) as violations when they're already valid.

### Pitfall 5: `--dry-run` outputs zero changes but the script silently misses violations

**What goes wrong:** Detection bug or path bug — the script runs, the dry-run says "no changes needed," but the scanner is still RED.
**Why it happens:** Script doesn't actually run detection (early-return on a bug), or it runs detection but the rename-map logic is no-op for the violation class.
**How to avoid:** Plan 2 acceptance gate is two-step: (a) `node scripts/normalize-step-numbers.cjs --dry-run` exits 0 with "no changes needed" on clean corpus, AND (b) running it against a synthetic dirty test fixture (introduce a single decimal step temporarily, then `git checkout`) shows it would change the file. Plan 2 task definition must include both.
**Warning signs:** Dry-run reports "no changes" but `node --test tests/step-numbering-scan.test.cjs` is RED.

### Pitfall 6: Renumbering crosses ordered-list and `**Step N:**` patterns inconsistently

**What goes wrong:** `execute-phase.md` mixes Pattern A/B (`**Step 7:**` headings) and Pattern D (`7.` ordered-list items at column 0-2). After Phase 49, `execute-phase.md` uses ordered list items (`1.` through `15.` per the grep earlier in Plan 1 verification — `7. **Worktree cleanup**` at line 741). The normalize script must detect and renumber BOTH patterns, not just one.
**Why it happens:** Naive implementation focuses on `**Step N:**` headings and misses Pattern D items.
**How to avoid:** Plan 2 reuses both detection paths from `scanContent()`: `STEP_DECIMAL_RE` for Pattern A/B AND `/^\s{0,2}\d+\.\d+\./` for Pattern D. Renumbering must apply the section-reset rule on both pattern classes.
**Warning signs:** After running normalize, `execute-phase.md` still has decimal Pattern D items (`5.5.` ordered-list items) even though `**Step N.M:**` headings are gone.

## Code Examples

### Example 1: Hardening the out-of-order anchor (Plan 1)

```javascript
// Source: tests/step-numbering-scan.test.cjs line 149 (current)
const stepMatch = line.match(/^\s*\*?\*?Step\s+(\d+)(?![\.\da-z])/i);

// AFTER Plan 1 (proposed change):
// Strip list markers/blockquotes first, then match.
const stripped = line.replace(/^(\s*(?:[-*+]|\d+\.|>)\s*)+/, '');
const stepMatch = stripped.match(/^[\s*]*Step\s+(\d+)(?![\.\da-z])/i);
```

**Verification approach:**
- Add a new unit test fixture that previously fell under the G-01 known limitation: `- **Step 3:** reversed`, `- **Step 1:** also reversed` — now MUST be detected as out-of-order.
- Update the existing G-01 limitation test (`step-numbering-scan.test.cjs:266-270`) — it currently asserts the limitation EXISTS; after Plan 1 it must assert detection works.
- Run full corpus scan and confirm 629/629 still GREEN.

### Example 2: Normalize script skeleton (Plan 2)

```javascript
#!/usr/bin/env node
// scripts/normalize-step-numbers.cjs
//
// Detects decimal/letter-suffix step labels across SCAN_DIRS, renumbers them
// to sequential whole integers per section, and updates cross-file prose refs.
//
// Usage:
//   node scripts/normalize-step-numbers.cjs           # apply changes
//   node scripts/normalize-step-numbers.cjs --dry-run # report only
//
// Idempotent: on a clean corpus, exits 0 with "no changes needed."

'use strict';

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const ROOT = path.join(__dirname, '..');
const SCAN_DIRS = ['agents', 'get-shit-done/workflows', 'commands/gsd'];
const PATTERN_C_EXCLUDES = new Set([
  'get-shit-done/workflows/plan-phase.md',
  'get-shit-done/workflows/new-milestone.md',
  'get-shit-done/workflows/new-project.md',
]);

const STEP_DECIMAL_RE = /(?:^|\s|\*\*)Step\s+\d+(?:\.\d|[a-z])/i;
const PATTERN_D_RE = /^(\s{0,2})(\d+)\.(\d+)\.(\s.*)$/;
// Cross-file ref patterns (D-01: dynamic discovery on every run)
const XREF_PATTERNS = [
  /([a-z0-9_./-]+\.md)\s+step\s+(\d+(?:\.\d|[a-z])?)/gi,
  /step\s+(\d+(?:\.\d|[a-z])?)\s+in\s+([a-z0-9_./-]+\.md)/gi,
];

// collectMarkdownFiles + per-file rename map computation +
// section-aware renumbering + cross-file ref discovery + in-place write
// ... (full implementation per Plan 2)

// At end:
console.log(`\n${renamedFiles} file(s) ${DRY_RUN ? 'would be' : 'were'} renormalized.`);
console.log(`${xrefUpdates} cross-file ref(s) ${DRY_RUN ? 'would be' : 'were'} updated.`);
process.exit(0);
```

### Example 3: Cross-file scanner test (Plan 3)

```javascript
// tests/cross-file-step-refs.test.cjs
'use strict';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJECT_ROOT = path.join(__dirname, '..');
const SCAN_DIRS = ['agents', 'get-shit-done/workflows', 'commands/gsd'];
const PATTERN_C_EXCLUDES = new Set([
  'get-shit-done/workflows/plan-phase.md',
  'get-shit-done/workflows/new-milestone.md',
  'get-shit-done/workflows/new-project.md',
]);

const XREF_PATTERNS = [
  /([a-z0-9_./-]+\.md)\s+step\s+(\d+)/gi,
  /step\s+(\d+)\s+in\s+([a-z0-9_./-]+\.md)/gi,
];

// Extract real step set from target file (whole-int headings + Pattern D items)
function extractStepSet(content) {
  const stepSet = new Set();
  const lines = content.split('\n');
  let inCodeBlock = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^```/.test(trimmed)) { inCodeBlock = !inCodeBlock; continue; }
    if (inCodeBlock) continue;

    // Headings: ## Step N, ### Step N, **Step N:**
    const headingMatch = trimmed.match(/^(?:#{1,6}\s+|\*?\*?)Step\s+(\d+)(?!\d|\.|[a-z])/i);
    if (headingMatch) stepSet.add(parseInt(headingMatch[1], 10));

    // Pattern D ordered-list items at column 0-2
    const listMatch = line.match(/^\s{0,2}(\d+)\.\s/);
    if (listMatch) stepSet.add(parseInt(listMatch[1], 10));
  }
  return stepSet;
}

// Find cross-file refs in a source file (skipping same-file refs)
function findCrossFileRefs(sourceFile, content) {
  const refs = [];
  const sourceBasename = path.basename(sourceFile);
  const lines = content.split('\n');
  let inCodeBlock = false;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (/^```/.test(trimmed)) { inCodeBlock = !inCodeBlock; continue; }
    if (inCodeBlock) continue;

    for (const re of XREF_PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(lines[i])) !== null) {
        // Pattern variants put filename/step in different capture groups
        const targetFile = m[1].endsWith('.md') ? m[1] : m[2];
        const stepNum = m[1].endsWith('.md') ? m[2] : m[1];
        const targetBasename = path.basename(targetFile);
        // Skip same-file refs per D-04
        if (targetBasename === sourceBasename) continue;
        refs.push({ lineNumber: i + 1, targetFile: targetBasename, step: parseInt(stepNum, 10), context: trimmed });
      }
    }
  }
  return refs;
}

// ... corpus describe block + RED-test describe block per D-06
```

### Example 4: RED-test stale-ref injection (Plan 3, D-06)

```javascript
// Per D-06: inject in a temporary file, NOT the corpus.
describe('cross-file scanner — RED test (synthetic stale ref)', () => {
  test('detects a stale cross-file ref pointing at a nonexistent step', () => {
    // Use os.tmpdir() to write a synthetic source file with a stale ref.
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-xref-red-'));
    const synthFile = path.join(tmpDir, 'synthetic-source.md');
    fs.writeFileSync(
      synthFile,
      '# Synthetic test\n\nSee execute-phase.md step 999 for more.\n',
      'utf-8'
    );
    try {
      const targetContent = fs.readFileSync(
        path.join(PROJECT_ROOT, 'get-shit-done/workflows/execute-phase.md'),
        'utf-8'
      );
      const targetSteps = extractStepSet(targetContent);
      assert.ok(!targetSteps.has(999), 'sanity: step 999 must not exist in execute-phase.md');

      const sourceContent = fs.readFileSync(synthFile, 'utf-8');
      const refs = findCrossFileRefs(synthFile, sourceContent);
      const stale = refs.filter(r => !targetSteps.has(r.step));
      assert.equal(stale.length, 1, 'scanner must detect the stale ref to step 999');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pre-built MAP-01 manifest consumed by normalize script (REQUIREMENTS.md NORM-02 original wording) | Dynamic grep on every run (CONTEXT.md D-01 supersedes) | Phase 50 discuss (2026-05-30) | Script survives any upstream merge that introduces new cross-file refs — no manifest sync required |
| List-marker-prefixed step labels go undetected (Phase 48 G-01 known limitation) | Strip list markers/blockquotes before anchor match (Phase 50 Plan 1) | Phase 50 Plan 1 (this phase) | Future upstream merges that introduce `- **Step N:**` patterns are caught immediately |
| Manual cross-file ref audit each upstream merge (Phase 49 MAP-01 approach) | Automated cross-file ref integrity test (Phase 50 Plan 3) | Phase 50 Plan 3 (this phase) | Future merges that introduce stale cross-file refs fail CI immediately |

**Deprecated/outdated:** N/A — Phase 50 is the maintenance layer that locks in v2.1.0-d's invariant. Nothing is replaced; existing scanners are extended.

## Project Constraints (from CLAUDE.md)

| Directive | Compliance Plan |
|-----------|-----------------|
| GSD workflow enforcement (all changes go through a GSD workflow) | Phase 50 IS a GSD workflow phase — compliant by definition |
| `Bash grep override` (Use `command grep` in Bash tool) | Script uses pure-JS regex iteration (no shell `grep` spawning). Any verification commands in plans/tasks must use `command grep`. |
| `Only use the Write tool` for file creation in tests (CLAUDE.md note for agents with Write tool) | Agents executing Plans 2 and 3 must use the `Write` tool for new files (`scripts/normalize-step-numbers.cjs` and `tests/cross-file-step-refs.test.cjs`); Plan 1 modifies an existing file via `Edit` tool. |
| No `skills:` in agent frontmatter | N/A — Phase 50 adds no new agents |
| Project skills | None discovered (`.claude/skills/` and `.agents/skills/` both empty/absent) |
| Test conventions: `tests/*.test.cjs` (CommonJS), use `node:test` runner, helpers via `tests/helpers.cjs` | Plan 3 follows this exactly. Helpers are NOT extended — `collectMarkdownFiles` is duplicated inline per Phase 48 D-06 (avoiding `helpers.test.cjs` count assertion) |
| `npm run test:coverage` requires ≥70% line coverage on `get-shit-done/bin/lib/*.cjs` | N/A — Phase 50 touches `scripts/` and `tests/`, not `get-shit-done/bin/lib/` |
| Positive framing replacement rule | Plan headers and tasks must use affirmative directives (e.g., "Skip code fences" not "Never parse code fences") |
| File-writing agents need `# hooks:` commented in frontmatter | N/A — Phase 50 adds no new agents |
| Run tests once, pipe to `/tmp`, then read the file | Verification tasks in plans should use `npm test 2>&1 | tee /tmp/gsd-test-output.txt; echo "Exit: $?"` pattern |

## Assumptions Log

> The two regex patterns proposed for cross-file ref discovery (D-04 specifies the two word-order variants but exact regex is Claude's call) are the only [ASSUMED] items. Everything else is verified against codebase, official Node.js docs, or Phase 48/49 artifacts.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Two regex variants `/([a-z0-9_./-]+\.md)\s+step\s+(\d+)/gi` and `/step\s+(\d+)\s+in\s+([a-z0-9_./-]+\.md)/gi` cover the cross-file ref variants in the current corpus | Code Examples, Common Pitfalls Pitfall 2 | Plan 2 script misses a variant → Plan 3 test catches it immediately (the patterns are coupled). Mitigation: planner can refine in Plan 3 task definition by running discovery against current corpus and verifying both real refs are matched. [ASSUMED] |
| A2 | The replacement anchor `^[\s*]*` plus list-marker stripping `^(\s*(?:[-*+]|\d+\.|>)\s*)+` is sufficient for Plan 1 hardening | Code Examples (Example 1) | Permissive widening could match unintended patterns. Mitigation: corpus regression test (629/629 must stay GREEN) gates the change. [ASSUMED] |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed. (Two items above.)

## Open Questions

1. **Should the normalize script support `--file <path>` to scope changes to a single file?** (CONTEXT.md Claude's Discretion)
   - What we know: `strip-prose-atrefs.cjs` does not accept file arguments — always scans `commands/gsd/` wholesale.
   - What's unclear: Whether single-file ergonomics is worth the additional CLI parsing.
   - Recommendation: **Skip in Plan 2.** Discretion item says "Claude decides if it adds complexity." It does add complexity (cross-file ref discovery still requires whole-corpus scan; partial runs leak inconsistencies). Defer to a follow-on enhancement if needed.

2. **Should Plan 1 update the unit-test fixture that documents the G-01 limitation (lines 266-270)?**
   - What we know: That test asserts `violations.length === 0` for list-marker steps — i.e., it asserts the limitation EXISTS.
   - What's unclear: After Plan 1, the limitation is fixed; the assertion direction must flip.
   - Recommendation: **Yes — Plan 1 must flip this assertion.** Add it to Plan 1's acceptance criteria. Failing to update it leaves a contradictory test (claims limitation while scanner detects it).

3. **Does Plan 3 need a per-target-file unit test fixture, or are corpus-derived assertions enough?**
   - What we know: `step-numbering-scan.test.cjs` has both unit tests (synthetic strings) AND corpus tests (per-file subtests).
   - What's unclear: Whether Plan 3 needs both layers.
   - Recommendation: **Both.** Unit tests verify the scanner logic in isolation (`extractStepSet`, `findCrossFileRefs`, same-file skip). Corpus tests verify the actual corpus stays GREEN. The RED test (D-06) covers detection-works-when-broken. Three-layer test design matches Phase 48 precedent.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All three plans | ✓ | 24.14.1 (verified via `node --version`) | — |
| npm | Test runner via `npm test` | ✓ | 11.11.0 (verified via `npm --version`) | — |
| git | Verification (`git status`, `git diff`) | ✓ (project is in a git repo per gitStatus context) | — | — |
| Node.js built-in `node:test` | Plans 1 and 3 | ✓ (Node 24) | bundled | — |
| Node.js built-in `node:assert/strict` | Plans 1 and 3 | ✓ | bundled | — |
| Node.js built-in `fs`, `path`, `os` | All plans | ✓ | bundled | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` (Node 24.14.1) |
| Config file | None — `scripts/run-tests.cjs` glob-discovers `tests/*.test.cjs` |
| Quick run command (per-test-file) | `node --test tests/step-numbering-scan.test.cjs` |
| Cross-file scanner quick run | `node --test tests/cross-file-step-refs.test.cjs` |
| Normalize script dry-run | `node scripts/normalize-step-numbers.cjs --dry-run` |
| Full suite command | `npm test 2>&1 | tee /tmp/gsd-test-output.txt; echo "Exit: $?"` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NORM-02 | `--dry-run` exits 0 with "no changes needed" on clean corpus | smoke | `node scripts/normalize-step-numbers.cjs --dry-run` (asserts exit 0 + "no changes" in stdout) | ❌ Wave 1 — Plan 2 creates |
| NORM-02 | Script renormalizes a synthetic dirty file and updates cross-file refs | integration | Inline assertions in Plan 2 task verification (introduce decimal in test fixture → run script → confirm rename + xref update → `git checkout`) | ❌ Wave 1 — Plan 2 creates |
| XREF-01 | Cross-file scanner GREEN against post-Phase-49 corpus | corpus subtest | `node --test tests/cross-file-step-refs.test.cjs` | ❌ Wave 1 — Plan 3 creates |
| XREF-01 | Cross-file scanner RED against synthetic stale-ref injection | unit subtest (RED-test) | Embedded in `tests/cross-file-step-refs.test.cjs` per D-06 (temp file fixture) | ❌ Wave 1 — Plan 3 creates |
| (Plan 1 hardening) | `scanForOutOfOrder` detects list-marker-prefixed step labels | unit subtest | Embedded in `tests/step-numbering-scan.test.cjs` (revised fixture) | ⚠ Wave 1 — Plan 1 modifies existing |
| (Plan 1 regression) | All 629 existing corpus subtests stay GREEN after anchor change | full corpus | `node --test tests/step-numbering-scan.test.cjs` | ✅ Exists (Phase 48) |

### Sampling Rate

- **Per task commit:** `node --test tests/<modified-file>.test.cjs` (quick run on just the touched test)
- **Per wave merge:** `node --test tests/step-numbering-scan.test.cjs tests/cross-file-step-refs.test.cjs` + `node scripts/normalize-step-numbers.cjs --dry-run`
- **Phase gate:** Full `npm test` green before `/gsd-verify-work`

### Wave 0 Gaps

- ❌ `scripts/normalize-step-numbers.cjs` does not exist — created by Plan 2
- ❌ `tests/cross-file-step-refs.test.cjs` does not exist — created by Plan 3
- ⚠ `tests/step-numbering-scan.test.cjs` exists but Plan 1 must modify it (anchor + list-marker stripping + flip G-01 limitation test)
- Framework install: NOT needed — `node:test` is built-in

## Security Domain

> Required when `security_enforcement` is enabled. Phase 50 scope is internal tooling (script + tests, both run only on developer/CI machines against repo-internal files). No network, no auth, no user input, no secrets. Minimal threat surface — analysis included for completeness.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — (script does no authn) |
| V3 Session Management | no | — (no sessions) |
| V4 Access Control | no | — (script reads/writes repo-local files only) |
| V5 Input Validation | partial | Script receives `process.argv` flags only — validate `--dry-run` is the only accepted flag; reject unknown flags with non-zero exit |
| V6 Cryptography | no | — (no crypto operations) |

### Known Threat Patterns for Node.js CLI + filesystem write

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal via crafted file argument | Tampering | Plan 2 hardcodes `SCAN_DIRS` — script does not accept file paths from user input (per Open Question 1 recommendation: no `--file` flag). Eliminates the entire class of path-traversal risks. |
| Partial write corruption mid-rename | Tampering / Availability | `strip-prose-atrefs.cjs` precedent uses plain `fs.writeFileSync` — atomic at the OS level for small markdown files. Pre-flight check: refuse to run if `git status` shows uncommitted changes (safer maintenance protocol). |
| Regex-based catastrophic backtracking on adversarial markdown | Denial of Service | Cross-file ref patterns use bounded character classes (`[a-z0-9_./-]+\.md` — no nested quantifiers). Safe. |
| Code-fence parsing skipping a legitimate violation | Tampering | Code-fence toggle is symmetric (open and close on `^```` ) — same pattern used by negative-framing scanner for 4+ years without incident. Established precedent. |

## Sources

### Primary (HIGH confidence)

- `tests/step-numbering-scan.test.cjs` (lines 1-318) — scanner architecture, `scanContent`, `scanForOutOfOrder`, file collection pattern, code-fence skip, PATTERN_C_EXCLUDES, G-01 known limitation, anchor location for Plan 1 hardening [VERIFIED: codebase grep]
- `scripts/strip-prose-atrefs.cjs` (lines 1-106) — CLI template: `--dry-run` flag, `process.argv`, in-place `fs.writeFileSync`, per-file change logging, recursive file processing [VERIFIED: codebase grep]
- `tests/negative-framing-scan.test.cjs` (lines 1-1425) — scanner structural template: module-scope `ALL_FILES`, per-directory `describe`, per-file subtest pattern, code-fence toggle [VERIFIED: codebase grep]
- `.planning/phases/49-survey-and-normalization/49-MAP-01.md` — actual cross-file ref inventory in the current corpus (4 entries, all matching the two D-04 word-order variants) [VERIFIED: file read]
- `.planning/phases/49-survey-and-normalization/49-13-PLAN.md` — Phase 49 final cross-file refs plan; documents the exact transformation that Plan 2 in Phase 50 must reverse-engineer dynamically [VERIFIED: file read]
- `.planning/REQUIREMENTS.md` §NORM-02 and §XREF-01 — locked requirement definitions [VERIFIED: file read]
- `.planning/phases/48-tdd-red-gate/48-CONTEXT.md` (D-04, D-07, D-08, D-09) — scanner scope and pattern decisions Phase 50 inherits [VERIFIED: file read]
- `.planning/phases/49-survey-and-normalization/49-CONTEXT.md` (D-03, D-05) — commit strategy and plan granularity pattern Phase 50 mirrors [VERIFIED: file read]
- Node.js docs: built-in `node:test` runner, `fs.readdirSync` `withFileTypes` option, `fs.writeFileSync` semantics [CITED: nodejs.org/api/test.html, nodejs.org/api/fs.html]
- Current corpus verification: `node --test tests/step-numbering-scan.test.cjs` → 629/629 GREEN as of 2026-05-30; `command grep -rn "step [0-9]\+\.[0-9]\+\|step [0-9]\+[a-z]" agents/ get-shit-done/workflows/ commands/gsd/` matches only Pattern C files (out of scope) [VERIFIED: tool execution]

### Secondary (MEDIUM confidence)

- `.planning/STATE.md` §Key Risk — silent truthy `-1` from `indexOf` pitfall; carry forward [VERIFIED: file read]
- `.planning/PROJECT.md` §Current Milestone, §Constraints, §Key Decisions — milestone framing [VERIFIED: file read]

### Tertiary (LOW confidence)

- None — every claim is anchored to a verified file or tool execution in this session.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — only Node.js built-ins, all verified via `node --version` and existing codebase usage
- Architecture: HIGH — three established templates (`step-numbering-scan.test.cjs`, `negative-framing-scan.test.cjs`, `strip-prose-atrefs.cjs`) directly inform every component
- Pitfalls: HIGH — five of six pitfalls are documented in Phase 48/49 inline comments or surfaced by the Phase 49 UAT; the sixth (anchor permissive-widening) is a forward-looking risk specific to Plan 1's hardening change
- Cross-file ref discovery patterns: MEDIUM — two regex variants are [ASSUMED] (D-04 explicitly leaves exact regex to Claude); empirical validation against Phase 49 MAP-01's 4 real refs confirms they cover the current corpus

**Research date:** 2026-05-30
**Valid until:** 2026-06-30 (30 days — stack is stable Node.js built-ins; the only freshness risk is a new upstream merge introducing prose ref variants the two regexes don't catch — surfaced by Plan 3 scanner if so)

---

*Phase: 50-Maintenance Script and Cross-Ref Scanner*
*Research completed: 2026-05-30*
