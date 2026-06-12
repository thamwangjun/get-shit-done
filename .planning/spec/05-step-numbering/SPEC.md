# SPEC-05: Step Numbering System

**ID:** 05
**Requirement:** SPEC-05
**Status:** Ready
**Confidence:** High
**Specced:** 2026-06-12
**Reimplementation target:** v2.1.0-h fork features on refactored upstream
**Depends on:** SPEC-08
**Reimplementation evidence (tier-1 test):** tests/step-numbering-scan.test.cjs (also tests/cross-file-step-refs.test.cjs)

---

## Purpose

The fork corpus maintains whole-integer step labels (`Step N`) across agents, workflows, and commands. Decimal variants — `Step N.M` (including `Step N.0`) bold or plain headings (Pattern A/B), `N.M.` ordered-list items at columns 0–2 (Pattern D), and `Step Na` letter-suffix labels — as well as out-of-order sequences (reversed or gapped whole-integer numbering within a section) are violations an automated scanner detects and a normalizer CLI repairs. The step-numbering system is a three-layer pipeline with a defined internal ordering: (1) the **corpus scanner** (`tests/step-numbering-scan.test.cjs`) detects violations across `SCAN_DIRS` — this is the CI gate; (2) the **`normalize-step-numbers.cjs` CLI** renumbers violations to sequential whole integers per section and updates cross-file prose references in-place — this is the remediation pass; (3) the **cross-file-ref scanner** (`tests/cross-file-step-refs.test.cjs`) validates that every `<file>.md step N` or `step N in <file>.md` prose reference across `SCAN_DIRS` points at a real Step N in the target file — this is the completeness check, run in CI alongside the scanner. Without the scanner, decimal or out-of-order step labels silently accumulate across upstream merges; without the normalizer, they must be fixed manually file-by-file; without the cross-file-ref scanner, a normalizer run that renumbers steps can strand existing prose references to old step numbers, leaving readers following instructions that point at the wrong step or no step at all. The `## N.N.` section headings used in three plan-phase workflow files (`get-shit-done/workflows/plan-phase.md`, `get-shit-done/workflows/new-milestone.md`, `get-shit-done/workflows/new-project.md`) are document structure, not step sequences, and are intentionally outside the scanner's scope. The behavioral authority for all scanner and cross-file-ref behavior is the two tier-1 test files `tests/step-numbering-scan.test.cjs` and `tests/cross-file-step-refs.test.cjs` (source-of-truth tier 1 per `00-CONVENTIONS.md` §4).

## Scope

**In scope:**

- **Pattern A/B detection** — `**Step N.M**` or `Step N.M` bold or plain headings (including `Step N.0`) and `Step Na` letter-suffix labels across the corpus `SCAN_DIRS`. `Step N.0` is a violation; a whole-integer `Step N` without decimal or letter suffix is not a violation.
- **Pattern D detection** — `N.M.` ordered-list items at columns 0–2 (leading whitespace ≤ 2 characters) across `SCAN_DIRS`.
- **Out-of-order detection** — per-section reversed sequences and gaps in whole-integer step numbering, with the per-section counter reset at every `##` or `###` heading, and list markers (`-`, `*`, `+`, `1.`) and blockquote markers (`>`) stripped before matching. `Step 0` is a valid sequence start.
- **Symmetric code-fence exclusion** — content inside triple-backtick code fences is excluded on both the source-scan side (no violation flagged for fenced steps) and the target-step extraction side (fenced steps not added to the step set) across all three pipeline layers.
- **Normalizer idempotent renumber** — the `normalize-step-numbers.cjs` CLI renumbers decimal and letter-suffix step labels to sequential whole integers per section, reports "No changes needed." on a clean corpus (idempotency), and supports a `--dry-run` mode that reports without writing and exits 0.
- **Dynamic cross-file ref discovery** — the normalizer discovers every `<file>.md step N` and `step N in <file>.md` prose reference across the corpus by grepping on every run; there is no pre-built manifest.
- **Cross-file ref integrity** — every resolved cross-file step reference must point at a real Step N heading or Pattern D ordered-list item in the target file; same-file refs are excluded; basename-collision tolerance applies: a ref is valid if Step N exists in ANY file sharing the target basename (e.g., a thin `commands/gsd/execute-phase.md` delegating to `get-shit-done/workflows/execute-phase.md`).
- **SCAN_DIRS scope** — the corpus directories scanned by both test files and the normalizer CLI are `agents/`, `get-shit-done/workflows/`, and `commands/gsd/` (advisory enumeration, current as of 2026-06-12; the normative claim is the scope shape, not the literal directory list).

**Out of scope:**

- **Pattern C exclusion** — `## N.N.` section-heading numbering (no "Step" keyword) in `get-shit-done/workflows/plan-phase.md`, `get-shit-done/workflows/new-milestone.md`, and `get-shit-done/workflows/new-project.md` are document structure, not step sequences; they are deliberately excluded from all corpus scans and from the normalizer's scan set (`PATTERN_C_EXCLUDES`, current as of 2026-06-12). The settled rationale and consequence of reopening this exclusion are recorded as Key Decision (a).
- **`get-shit-done/references/` and `get-shit-done/templates/`** — outside `SCAN_DIRS` scope (see INDEX.md Excluded from Scope).
- **Step-numbering enforcement in `tests/`, SDK source, or any directory outside `SCAN_DIRS`** — those files are not part of the prompt corpus the step-numbering system governs.
- **The install-time runtime conversion pipeline** — orthogonal to step numbering; governed by SPEC-04.

## Invariants

**05-INV-1** — When the corpus scanner processes a source file, the system MUST flag three violation shapes as requiring renumbering to whole integers: (a) `**Step N.M**` or `Step N.M` bold or plain headings including `Step N.0` (Pattern A/B), (b) `N.M.` ordered-list items at columns 0–2 (Pattern D), and (c) `Step Na` letter-suffix labels. Content inside triple-backtick code fences MUST NOT be flagged on any of the three shapes (symmetric fence skip — normative clause). `Step N.0` IS a violation; a whole-integer `Step N` without decimal or letter suffix MUST NOT be flagged. The detection regex `STEP_DECIMAL_RE` and the Pattern D column guard `/^\s{0,2}\d+\.\d+\./` are advisory supporting detail, current as of 2026-06-12.

Consequence of violating this invariant: decimal or letter-suffix step labels accumulate across upstream merges without detection, requiring manual audit each merge cycle.

---

**05-INV-2** — When the scanner processes a section, the system MUST flag out-of-order whole-integer step sequences — both reversed sequences AND gaps — resetting the per-section counter at every `##` or `###` heading. List markers (`-`, `*`, `+`, `1.`) and blockquote markers (`>`) MUST be stripped before matching so that steps inside list and blockquote contexts are correctly sequenced. Content inside code fences MUST NOT affect the sequence counter. `Step 0` is a valid sequence start — a `Step 0, Step 1, Step 2` sequence MUST NOT be flagged.

Consequence of violating this invariant: out-of-order steps silently accumulate; an agent following a workflow with a gap or reversed sequence receives incorrect sequential instructions.

---

**05-INV-3** — When the cross-file-ref scanner processes a source file, every prose cross-file step reference of the form `<file>.md step N` (Pattern 1) or `step N in <file>.md` (Pattern 2) in `SCAN_DIRS` MUST point at a real Step N heading or Pattern D ordered-list item in the target file. Same-file refs MUST be excluded. Code-fenced refs MUST be excluded on the source-ref extraction side (symmetric fence skip), and code-fenced steps MUST be excluded on the target-step extraction side. The **basename-collision tolerance** MUST be applied: a ref is valid if Step N exists in ANY file sharing the target basename — a reference to `execute-phase.md step 7` is valid if step 7 exists in `commands/gsd/execute-phase.md` OR `get-shit-done/workflows/execute-phase.md`, since multiple files may share the same basename. The two `XREF_PATTERNS` (Pattern 1: `<file>.md step N`; Pattern 2: `step N in <file>.md`) are advisory, current as of 2026-06-12.

Consequence of violating this invariant: a normalizer run that renumbers steps without updating cross-file prose refs silently strands references; a reading agent follows "step N in file.md" and finds a different step than intended or no step at all.

---

**05-INV-4** — When the `normalize-step-numbers.cjs` CLI runs on a corpus containing decimal or letter-suffix step labels, it MUST renumber each to a sequential whole integer per section AND MUST converge — a second run on a corpus the first run processed reports "No changes needed." and exits 0 (idempotent). A `--dry-run` invocation MUST report without writing and exit 0.

This invariant has no dedicated normalizer test (`normalize*.test.cjs` is absent from `tests/` — confirmed by exhaustive directory listing). Its observable evidence is the scanner running GREEN on the post-normalization corpus: after a correct normalizer run, `tests/step-numbering-scan.test.cjs` corpus subtests MUST report zero violations (scanner-GREEN per D-03). This is indirect coverage, not a missing test — the scanner IS the normalizer's acceptance oracle.

Consequence of violating this invariant: decimal and letter-suffix labels persist indefinitely unless manually fixed; the normalizer's primary value is mass-repair after an upstream merge introduces violations.

---

**05-INV-5** — When the normalizer renumbers a step label in a file, it MUST update every cross-file prose reference to that label across the corpus — dynamically discovered on each run by grepping the corpus for `XREF_PATTERNS`, NOT from a pre-built manifest — so that after normalization `tests/cross-file-step-refs.test.cjs` corpus subtests report zero stale refs (scanner-GREEN per D-03). There is NO persisted cross-file map consumed at runtime; the discovery is fully dynamic on every invocation.

This invariant shares the same indirect-coverage pattern as 05-INV-4: its observable acceptance oracle is `tests/cross-file-step-refs.test.cjs` corpus subtests passing GREEN after a normalizer run.

Consequence of violating this invariant: a normalize run that renumbers Step 2.5 → Step 3 leaves any file referencing "execute-phase.md step 2.5" pointing at a now-nonexistent label, which the cross-file-ref scanner then flags.

## Acceptance Tests

INV-4 and INV-5 have no dedicated normalizer test file. Their acceptance oracle is the corpus scanner running GREEN after a normalizer pass, per D-03 (Key Decision (c)): the scanner corpus subtests in `tests/step-numbering-scan.test.cjs` and `tests/cross-file-step-refs.test.cjs` are the indirect evidence — this is shared-evidence coverage, not missing tests.

| Invariant | Test File | Subtest / Assertion Shape |
|-----------|-----------|--------------------------|
| 05-INV-1 | tests/step-numbering-scan.test.cjs | `'flags Pattern A/B "**Step 2.5**" heading'` |
| 05-INV-1 | tests/step-numbering-scan.test.cjs | `'flags Pattern A/B "Step 7.0" (zero fractional digit, D-08)'` |
| 05-INV-1 | tests/step-numbering-scan.test.cjs | `'flags Pattern A/B with indentation (D-05: no indentation guard)'` |
| 05-INV-1 | tests/step-numbering-scan.test.cjs | `'flags letter-suffix step (Step 7a) as violation'` |
| 05-INV-1 | tests/step-numbering-scan.test.cjs | `'does not flag whole-integer step (Step 7)'` |
| 05-INV-1 | tests/step-numbering-scan.test.cjs | `'flags Pattern D ordered-list decimal "5.5. text"'` |
| 05-INV-1 | tests/step-numbering-scan.test.cjs | `'does not flag Pattern D inside code block'` |
| 05-INV-1 | tests/step-numbering-scan.test.cjs | corpus describe `'no decimal Pattern A/B labels in <file>'` (one subtest per SCAN_FILE) |
| 05-INV-1 | tests/step-numbering-scan.test.cjs | corpus describe `'no decimal Pattern D items in <file>'` (one subtest per SCAN_FILE) |
| 05-INV-2 | tests/step-numbering-scan.test.cjs | `'flags reversed sequence Step 1, Step 3, Step 2'` |
| 05-INV-2 | tests/step-numbering-scan.test.cjs | `'flags gap Step 1, Step 3 (missing Step 2)'` |
| 05-INV-2 | tests/step-numbering-scan.test.cjs | `'does not flag sequence Step 0, Step 1, Step 2'` |
| 05-INV-2 | tests/step-numbering-scan.test.cjs | `'resets sequence on ## heading'` |
| 05-INV-2 | tests/step-numbering-scan.test.cjs | `'resets sequence on ### heading'` |
| 05-INV-2 | tests/step-numbering-scan.test.cjs | `'ignores Step references inside code blocks'` |
| 05-INV-2 | tests/step-numbering-scan.test.cjs | `'detects out-of-order steps preceded by dash list markers'` |
| 05-INV-2 | tests/step-numbering-scan.test.cjs | `'detects out-of-order steps preceded by numbered-list markers'` |
| 05-INV-2 | tests/step-numbering-scan.test.cjs | `'detects out-of-order steps preceded by blockquote markers'` |
| 05-INV-2 | tests/step-numbering-scan.test.cjs | `'detects out-of-order steps preceded by asterisk list markers'` |
| 05-INV-2 | tests/step-numbering-scan.test.cjs | corpus describe `'no out-of-order step numbering in <file>'` (one subtest per SCAN_FILE) |
| 05-INV-3 | tests/cross-file-step-refs.test.cjs | `'detects whole-integer **Step N:** heading'` (extractStepSet describe) |
| 05-INV-3 | tests/cross-file-step-refs.test.cjs | `'detects ## Step N heading'` (extractStepSet describe) |
| 05-INV-3 | tests/cross-file-step-refs.test.cjs | `'detects Pattern D ordered-list item at column 0'` (extractStepSet describe) |
| 05-INV-3 | tests/cross-file-step-refs.test.cjs | `'skips Pattern D inside code fence (per D-05)'` (extractStepSet describe) |
| 05-INV-3 | tests/cross-file-step-refs.test.cjs | `'skips **Step N:** inside code fence (per D-05 — symmetric)'` (extractStepSet describe) |
| 05-INV-3 | tests/cross-file-step-refs.test.cjs | `'skips decimal labels (whole-integer only)'` (extractStepSet describe) |
| 05-INV-3 | tests/cross-file-step-refs.test.cjs | `'skips letter-suffix labels (whole-integer only)'` (extractStepSet describe) |
| 05-INV-3 | tests/cross-file-step-refs.test.cjs | `'detects filename.md step N variant'` (findCrossFileRefs describe) |
| 05-INV-3 | tests/cross-file-step-refs.test.cjs | `'detects step N in filename.md variant'` (findCrossFileRefs describe) |
| 05-INV-3 | tests/cross-file-step-refs.test.cjs | `'skips same-file refs (D-04)'` (findCrossFileRefs describe) |
| 05-INV-3 | tests/cross-file-step-refs.test.cjs | `'skips refs inside code fences (per D-05 — symmetric source-side)'` (findCrossFileRefs describe) |
| 05-INV-3 | tests/cross-file-step-refs.test.cjs | corpus describe `'no stale cross-file step refs in <file>'` (one subtest per SCAN_FILE) |
| 05-INV-3 | tests/cross-file-step-refs.test.cjs | `'detects a stale cross-file ref pointing at a nonexistent step'` (RED test describe) |
| 05-INV-4 | tests/step-numbering-scan.test.cjs | corpus subtests `'no decimal Pattern A/B labels in <file>'` + `'no decimal Pattern D items in <file>'` — scanner-GREEN after normalizer run (per D-03) |
| 05-INV-5 | tests/cross-file-step-refs.test.cjs | corpus subtest `'no stale cross-file step refs in <file>'` — scanner-GREEN after normalizer run (per D-03) |

## Key Decisions

### (a) Pattern C exclusion — `## N.N.` section headings are not step labels (D-02)

The `## N.N.` numbered section headings (without the "Step" keyword) in `plan-phase.md`, `new-milestone.md`, and `new-project.md` are document structure, not step sequences, and are deliberately excluded from all corpus scans and from the normalizer's `SCAN_FILES` set. The rule is normative: "`## N.N.` headings without the Step keyword are document structure, excluded from corpus scans." The three-file enumeration (`PATTERN_C_EXCLUDES`) is a dated advisory enumeration, current as of 2026-06-12:

- `get-shit-done/workflows/plan-phase.md`
- `get-shit-done/workflows/new-milestone.md`
- `get-shit-done/workflows/new-project.md`

Rationale: the original v2.1.0-d D-07 deferral identified that these three files use `## N.N.` as section-heading numbering; including them in corpus scans produces mass false-positive violations on every heading, and the normalizer would either corrupt their section structure or block CI on every merge that touches these files.

**Settled — do not reopen.** Consequence of reopening: removing this exclusion causes `plan-phase.md`, `new-milestone.md`, and `new-project.md` to fail the corpus scanner with false-positive violations on every `## N.N.` section heading, and the normalizer would attempt to renumber them as step labels, corrupting document structure and blocking CI on every merge touching those files.

---

### (b) Scanner → normalizer → cross-file-ref-scanner internal ordering (D-04)

The three-layer pipeline is ordered: (1) the scanner detects violations (the gate — run in CI); (2) the normalizer fixes violations in-place (the remediation — run manually or as a maintenance pass); (3) the cross-file-ref scanner validates that remediation did not strand prose references (the completeness check — run in CI alongside the scanner). A reimplementer MUST preserve this sequencing: running the normalizer without the cross-file-ref scanner leaves stranded refs undetected; running the cross-file-ref scanner without the scanner provides no detection gate.

Rationale: the scanner IS the normalizer's acceptance oracle (per Key Decision (c)); the cross-file-ref scanner IS the normalizer's completeness oracle; these relationships define the order.

**Settled — do not reopen.** Consequence of reopening: reversing or conflating the layers breaks the CI feedback loop — detection and validation become coupled in the wrong order, and a broken normalizer run can pass CI silently.

---

### (c) Normalizer traceability — scanner-GREEN as acceptance oracle (D-03)

No dedicated normalizer test (`normalize-step-numbers.test.cjs` or similar) exists, and none is required. The normalizer's correctness is fully observable via the two scanner test files running GREEN on a post-normalization corpus. The Acceptance Tests table cites `tests/step-numbering-scan.test.cjs` and `tests/cross-file-step-refs.test.cjs` corpus subtests for INV-4 and INV-5; these rows carry real subtests (scanner-GREEN per D-03) rather than a missing-test placeholder, because the coverage exists indirectly — the scanner IS the normalizer's acceptance oracle.

Rationale: writing a dedicated normalizer test would duplicate the scanner contract (the scanner already defines what "correct" looks like for every corpus file) and add test maintenance without increasing coverage fidelity.

**Settled — do not reopen.** Consequence of reopening: a dedicated normalizer test would need to assert the same conditions the corpus scanner already asserts, creating a duplicate oracle that rots independently; or it would assert implementation internals (function call counts, intermediate state) that break on any refactor; and inserting a missing-test placeholder for INV-4/INV-5 makes Phase 77 demand a test for a gap that does not exist.

---

### (d) Dynamic cross-file ref discovery — no pre-built manifest (D-01 of v2.1.0-d)

The normalizer discovers cross-file prose references by grepping the entire corpus on every run via `XREF_PATTERNS`. There is no pre-built manifest file read at startup; the discovery is fully dynamic on every invocation.

Rationale: a pre-built manifest would need to be maintained and committed after every corpus change; dynamic discovery eliminates this maintenance burden and ensures the normalizer always sees the current state of the corpus.

**Settled — do not reopen.** Consequence of reopening: a persisted manifest requires a separate "update manifest" step before every normalization run; if the manifest is stale, the normalizer misses cross-file ref updates silently, leaving stranded refs that the cross-file-ref scanner then flags.

## Code Context

<!-- advisory -->

The items below are current as of 2026-06-12. All file paths, function names, regex bodies, and line numbers are advisory and will shift on any test edit or upstream refactor. No normative invariant depends on these paths or symbols — a reimplementer rebuilds the system from the behavioral contract in §Invariants and §Key Decisions above.

---

### `tests/step-numbering-scan.test.cjs` — tier-1 normative source (also the normalizer acceptance oracle)

| Symbol | What it does | Line (advisory) |
|--------|--------------|-----------------|
| `SCAN_DIRS` | Three-element array of corpus directories scanned | 27 |
| `PATTERN_C_EXCLUDES` | `Set` of three file paths excluded from corpus subtests (Pattern C) | 34 |
| `STEP_DECIMAL_RE` | Pattern A/B + letter-suffix detection regex; `(?:^|\|\s|\*\*)Step\s+\d+(?:\.\d|[a-z])/i` | 62 |
| `scanContent(content)` | Returns `{ patternAB, patternD }`; toggles code-fence skip at line 81 | 70 |
| `scanForOutOfOrder(content)` | Returns violations array; strips list/blockquote markers at line 140; resets per-section counter on `##`/`###` at line 127 | 109 |
| `ALL_FILES` / `SCAN_FILES` | All markdown files from `SCAN_DIRS`; filtered set excluding Pattern C | 46 / 52 |
| `collectMarkdownFiles(dir)` | Recursive `.md` collector; tolerates ENOENT silently | 160 |

---

### `tests/cross-file-step-refs.test.cjs` — tier-1 normative source

| Symbol | What it does | Line (advisory) |
|--------|--------------|-----------------|
| `XREF_PATTERNS` | Two-element array: Pattern 1 `(file, step)` and Pattern 2 `(step, file)` word-order variants | 54 |
| `FILES_BY_BASENAME` | `Map` keyed by basename → array of absolute paths; populates from `ALL_FILES` (includes Pattern C files as ref targets); enables basename-collision tolerance | 101 |
| `extractStepSet(content)` | Returns `Set<number>` of valid whole-integer step labels; matches `## Step N`, `**Step N:**` headings and Pattern D ordered-list items; symmetric code-fence skip at line 134 | 124 |
| `findCrossFileRefs(sourceFile, content)` | Returns refs array; same-file skip at lines 210–216; symmetric code-fence skip at line 174 | 165 |

---

### `scripts/normalize-step-numbers.cjs` — advisory implementation file (not tier-1)

The normalizer's behavioral contract is narrated in §Invariants (05-INV-4, 05-INV-5). No normative claim rests on these paths or function names — per D-03, the normalizer invariants trace to scanner-GREEN, not to this file. All line numbers are advisory and shift on any edit.

| Symbol | What it does | Line (advisory) |
|--------|--------------|-----------------|
| `buildRenameMap(content)` | Per-section sequential renumber; `Step 0` preserved as valid start; resets counter on `##`/`###` at line 150; returns `Map<string, string>` | 130 |
| `applyRenameMap(content, renameMap)` | Line-by-line rewrite of decimal/letter-suffix labels per rename map; symmetric code-fence skip at line 213 | 200 |
| `discoverCrossFileRefs(corpusFiles, renameMaps)` | Dynamic corpus-wide ref discovery; merges basename rename maps at line 331; same-file ref exclusion at lines 321–324 | 270 |
| `processFile(filePath, renameMap, xrefUpdates)` | Idempotency write gate at line 426 — no write if result equals original; `--dry-run` gate at line 428 | 382 |
| `STEP_DECIMAL_RE` / `PATTERN_D_RE` / `XREF_PATTERNS` | Advisory regex constants; identical to scanner test file equivalents | 62 / 66 / 70 |
| `--dry-run` flag | Reports without writing; exits 0; "No changes needed." on clean corpus | 41 |
