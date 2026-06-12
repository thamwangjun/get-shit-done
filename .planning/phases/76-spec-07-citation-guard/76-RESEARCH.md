# Phase 76: spec-07-citation-guard - Research

**Researched:** 2026-06-12
**Domain:** Behavioral-contract specification authoring — citation-cleanup corpus guard
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01: Invariant decomposition — five numbered invariants, role-based grouping**
Group invariants by behavioral role targeting five numbered invariants (`07-INV-1`..`07-INV-5`), each mapping to an identifiable subtest cluster:
1. Citation detection — inline `#NNN`, parenthetical `(#NNN)`, feat-form `feat-NNNN` (3+ digits); subtest cluster: `scanContent() — inline citation detection` unit block + `corpus scan — no issue citations` describe block.
2. PLACEHOLDER_DIGITS global tier — a digit in `PLACEHOLDER_DIGITS` MUST be exempt everywhere.
3. FILE_ALLOWLIST per-file tier — a FILE_ALLOWLIST digit MUST be exempt only in its listed file(s) and MUST remain a violation in every other file; includes test-backing clause.
4. Exclusion state machines — YAML frontmatter (line-1-only opening `---`) and triple-backtick code fences MUST NOT be scanned; subtest cluster: `scanContent() — exclusion state machines` describe block.
5. Five-directory SCAN_DIRS scope — advisory enumeration; normative claim is the scope shape, not the literal list.
Claude's discretion: whether INV-5 collapses into the detection invariant; exact EARS pattern per invariant.

**D-02: Two allowlist invariants (INV-2, INV-3) distinguished by scope of exemption**
- INV-2 (PLACEHOLDER_DIGITS): a member is exempt everywhere in the corpus — global, illustrative example digits.
- INV-3 (FILE_ALLOWLIST): a digit is exempt only in its listed file(s) and MUST remain flagged in every other corpus file — per-file functional cross-references to real tracked work.
The current member values are a dated advisory enumeration (`current as of 2026-06-12`).

**D-03: FILE_ALLOWLIST test coupling — every entry must be test-backed**
INV-3 carries a normative clause: every FILE_ALLOWLIST entry MUST be backed by a sibling test that requires the cited digit's continued presence in that file. Four current backings (dated advisory): `commands/gsd/config.md` #2439 ← `bug-2439-set-profile-gsd-sdk-preflight.test.cjs`; `get-shit-done/references/thinking-partner.md` #1729 ← `thinking-partner.test.cjs`; `agents/gsd-executor.md` #2924 ← `worktree-cleanup.test.cjs`, #3542 ← `bug-3542-executor-git-stash-prohibition.test.cjs`. All four confirmed present 2026-06-12.

**D-04: Hex-color / deliberate-false-positive policy**
Captured as a settled Key Decision PLUS an Out-of-scope Scope bullet — NOT as an invariant. The guard accepts hex-color false positives in plain prose by design; false negatives (a missed real citation like `owner/repo#NNN`) are worse. Hex colors are protected only inside frontmatter and code fences. The inline regex deliberately has no hex lookbehind (removed in 260610-gku).

**D-05: Two-tier-allowlist refactor recorded as settled (ROADMAP lock)**
The two-tier-allowlist refactor (splitting a single flat allowlist into PLACEHOLDER_DIGITS and FILE_ALLOWLIST) is recorded as a settled Key Decision with consequence of reopening stated.

**D-06: Corpus counts / member values — shape normative, values dated**
Every concrete enumeration (five SCAN_DIRS, PLACEHOLDER_DIGITS members, FILE_ALLOWLIST entries and their backing tests) is recorded as a dated "current as of 2026-06-12" advisory enumeration. The normative claim is always the shape, never the literal values.

### Claude's Discretion

- Exact EARS pattern per invariant (Ubiquitous vs Event-driven vs Unwanted-behavior), provided each is a single falsifiable claim mapping to a subtest.
- Exact subtest/assertion-shape strings in the Acceptance Tests table.
- Whether INV-5 (five-directory scope) stays standalone or folds into the detection invariant.
- Whether to abbreviate the SCAN_DIRS / allowlist enumerations to representative classes vs literal lists.
- Confidence value to stamp in frontmatter when the body is finalized.

### Deferred Ideas (OUT OF SCOPE)

None. The hex-policy placement (D-04), the FILE_ALLOWLIST test-backing clause (D-03), and the two-tier-refactor Key Decision (D-05) are placement/framing decisions within the spec, not deferrals. No INDEX dependency edges or scope additions were proposed; no remediation/normalizer tool exists to spec for this guard (detection-only, by design).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SPEC-07 | `07-citation-guard/SPEC.md` specifies the citation cleanup guard — `no-issue-citations.test.cjs` detection (inline/parenthetical/feat-form), the two-tier allowlist (`PLACEHOLDER_DIGITS` vs `FILE_ALLOWLIST`) with per-tier semantics, and the 5-directory detection scope | Full source audit of `tests/no-issue-citations.test.cjs` completed; all describe/test names extracted verbatim; both regexes confirmed; all constants documented |
| QUAL-01 | Each spec states behavioral invariants as numbered, falsifiable EARS statements with RFC 2119 strength | Sibling pattern confirmed: each invariant is a single testable claim with a direct subtest anchor |
| QUAL-02 | Each spec has an Acceptance-Tests traceability table mapping each MUST-level invariant to a test file and subtest name | All subtests in `no-issue-citations.test.cjs` extracted verbatim; table can be populated mechanically |
| QUAL-03 | Normative behavioral contract separated from advisory implementation notes; current file paths/symbols marked `<!-- advisory -->` | Advisory-marking pattern confirmed in SPEC-05 Code Context; SPEC-07 has no normalizer counterpart so Code Context is simpler |
| QUAL-04 | Each spec cites at least one tier-1 (test) or tier-2 (source) artifact | `tests/no-issue-citations.test.cjs` is the tier-1 source; already named in stub frontmatter |
| QUAL-05 | Each spec has a Key Decisions section recording settled decisions with rationale, marked "settled — do not reopen", with consequence of reopening stated inline | D-03, D-04, D-05 each require a Key Decision entry; sibling pattern confirmed |
</phase_requirements>

---

## Summary

Phase 76 is a narration/specification exercise: the executor reads `tests/no-issue-citations.test.cjs` and narrates its behavioral contract into the pre-existing stub `.planning/spec/07-citation-guard/SPEC.md`. The test is the tier-1 normative source; every invariant and Acceptance Tests row traces directly to a real subtest in that file. The stub already has the correct frontmatter and 7-section skeleton; the only work is authoring the section bodies and advancing Status from `Draft` to `Ready`.

The phase inherits the Phase 69/70/71/74 method: role-based invariant grouping (D-01 five invariants), shape-normative-not-count (D-06), advisory marking of all current paths/symbols, every MUST tracing to a real subtest, and three Key Decisions (D-03 FILE_ALLOWLIST test-coupling, D-04 hex-policy tradeoff, D-05 two-tier-refactor settled). SPEC-07 is simpler than SPEC-05 in one key respect: there is no normalizer or CLI counterpart — the guard is detection-only. This means the Acceptance Tests table is fully direct: every invariant has a dedicated unit subtest cluster with no indirect-coverage ("scanner-GREEN as oracle") rows needed.

The two-tier allowlist (PLACEHOLDER_DIGITS global vs FILE_ALLOWLIST per-file) is the headline non-obvious surface: INV-2 and INV-3 must make the scope-of-exemption contrast unmistakable. The `Depends on: SPEC-08` edge in the stub frontmatter is preserved as-is — this phase neither adds nor removes dependency edges.

**Primary recommendation:** The executor reads `tests/no-issue-citations.test.cjs` once, transcribes the verbatim describe/test names and constants into the spec, then applies the SPEC-05 section shape with the five-invariant decomposition from D-01.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Spec authoring (narration) | `.planning/spec/07-citation-guard/SPEC.md` | — | The spec body is the sole output; no code changes |
| Tier-1 evidence | `tests/no-issue-citations.test.cjs` | — | Test IS the spec for this guard; all invariants trace here |
| Section shape / conventions | `.planning/spec/00-CONVENTIONS.md` | Sibling SPEC-05 | LOCKED 7-section template; executor must not drift |
| Status transition | SPEC.md frontmatter `Status:` field | — | `Draft → Ready` happens when QUAL-01–05 satisfied |

---

## Standard Stack

This phase is documentation-only. No packages are installed. No external libraries are used. The only tools are the Write and Edit tools to author the spec body.

---

## Package Legitimacy Audit

Not applicable — this phase installs no external packages.

---

## Architecture Patterns

### 7-Section Template (LOCKED by 00-CONVENTIONS.md)

The mandatory section order is fixed. No per-spec section drift is permitted. Phase 77 rejects drift. [VERIFIED: .planning/spec/00-CONVENTIONS.md]

```
# SPEC-07: Citation Cleanup Guard
<block-header frontmatter>
---
## Purpose
## Scope
## Invariants
## Acceptance Tests
## Key Decisions
## Code Context
```

Section 1 (frontmatter block) keys in order:
- `**ID:**`, `**Requirement:**`, `**Status:**`, `**Confidence:**`, `**Specced:**`, `**Reimplementation target:**`, `**Depends on:**`, `**Reimplementation evidence (tier-1 test):**`

The block-header frontmatter is NOT YAML — do not use `---\nkey: value\n---` fences.

### Invariant ID Scheme

For SPEC-07: prefix is `07-INV-M` where M is 1, 2, 3, 4, 5. [VERIFIED: .planning/spec/00-CONVENTIONS.md §2]

### Shape-Normative Pattern (inherited from all siblings)

Every concrete enumeration (five SCAN_DIRS, PLACEHOLDER_DIGITS members, FILE_ALLOWLIST entries) is recorded as "current as of 2026-06-12" with a note that the normative claim is the SHAPE, not the literal values. [VERIFIED: .planning/spec/00-CONVENTIONS.md §4; .planning/spec/05-step-numbering/SPEC.md]

### Advisory Marking (Code Context)

The `## Code Context` section opens with `<!-- advisory -->`. All file paths, function names, regex bodies, and line numbers within it are advisory. No normative invariant depends on them. [VERIFIED: .planning/spec/05-step-numbering/SPEC.md; .planning/spec/01-positive-framing/SPEC.md]

### Key Decision Format (inherited)

Each entry in `## Key Decisions`:
1. Decision statement + rationale (one sentence)
2. `**Settled — do not reopen.** Consequence of reopening: <what breaks>`
[VERIFIED: .planning/spec/05-step-numbering/SPEC.md Key Decisions (a)–(d)]

### Acceptance Tests Table Format

| Invariant | Test File | Subtest / Assertion Shape |
|-----------|-----------|--------------------------|

Keyed on `07-INV-M`. Uses real verbatim subtest names from the test file. No `[MISSING]` rows should exist because every invariant has a direct subtest. [VERIFIED: .planning/spec/00-CONVENTIONS.md §5; .planning/spec/05-step-numbering/SPEC.md]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Invariant IDs | Custom naming | `07-INV-M` scheme from 00-CONVENTIONS.md | Phase 77 cross-spec review keys on this exact scheme; deviation causes reconciliation failures |
| Section structure | Custom sections | Exact 7-section template from 00-CONVENTIONS.md | Phase 77 rejects any per-spec section drift |
| Subtest names | Paraphrased descriptions | Verbatim names from `no-issue-citations.test.cjs` | Acceptance Tests rows must be mechanically checkable; invented names break audit |
| Status transition | Any other value | `Draft → Ready` (exact vocabulary from 00-CONVENTIONS.md §3) | Status vocabulary is LOCKED; non-standard values are non-conforming |

---

## Verbatim Source Extraction: `tests/no-issue-citations.test.cjs`

[VERIFIED: tests/no-issue-citations.test.cjs — read directly from codebase]

### Constants

**`SCAN_DIRS`** (five-element array, lines 44–50):
```
'commands'
'get-shit-done/workflows'
'agents'
'get-shit-done/references'
'get-shit-done/templates'
```

**`PLACEHOLDER_DIGITS`** (global Set, line 54):
```javascript
new Set([1, 2, 123])
```
Members: `1`, `2`, `123` — current as of 2026-06-12.

**`FILE_ALLOWLIST`** (per-file map, lines 60–68):
```javascript
{
  'commands/gsd/config.md':                           new Set([2439]),
  'get-shit-done/references/thinking-partner.md':     new Set([1729]),
  'agents/gsd-executor.md':                           new Set([2924, 3542]),
}
```
Current as of 2026-06-12. Each entry is backed by a sibling test (confirmed present).

**`INLINE_RE`** (line 77):
```javascript
const INLINE_RE = /#(\d+)\b/g;
```
Matches `#NNN` in non-frontmatter, non-code-fence prose. No hex lookbehind (removed in 260610-gku).

**`FEAT_FORM_RE`** (line 82):
```javascript
const FEAT_FORM_RE = /\bfeat-(\d{3,})\b/g;
```
Matches `feat-NNNN` with 3+ digit tracker IDs.

### Paren-Context Disambiguation (lines 182–184)

```javascript
const charBefore = matchStart > 0 ? line[matchStart - 1] : '';
const charAfter = matchEnd < line.length ? line[matchEnd] : '';
const category = (charBefore === '(' && charAfter === ')') ? 'parenthetical' : 'inline';
```
Parenthetical detection happens WITHIN the same `INLINE_RE` pass — not a separate regex. The category is `'parenthetical'` when the `#NNN` match is immediately preceded by `(` and followed by `)`.

### Frontmatter State Machine (lines 147–161)

Opening `---` ONLY activates frontmatter when `lineNumber === 1` (the line is the VERY FIRST LINE) AND `!inFrontmatter`. A `---` on any later line is a thematic break, not frontmatter — content after it IS scanned. Both opening and closing `---` lines are skipped (`continue` after toggle).

### Code-Fence State Machine (lines 163–168)

A line matching `/^```/` toggles `inCodeBlock`. The fence line itself is skipped (`continue`). All lines while `inCodeBlock` are skipped.

### Describe/Test Block Names — VERBATIM

#### `describe('scanContent() — inline citation detection', ...)` (line 201)

Unit subtests (lines 202–238):

| Test name (verbatim) | What it asserts |
|----------------------|-----------------|
| `'INLINE_RE positive: #3097 produces one inline hit'` | Inline detection: text `#3097`, category `inline` |
| `'github-style citation: owner/repo#NNN is detected'` | `owner/repo#NNN` trailing `#NNN` matches; category `inline` |
| `'parenthetical category: (#3097) produces one parenthetical hit'` | Paren-context: text `#3097`, category `parenthetical` |
| `'FEAT_FORM_RE positive: feat-3347 produces one feat-form hit'` | Feat-form: text `feat-3347`, category `feat-form` |
| `'hex color exemption (D-11): #e8c170 produces zero hits'` | Hex in code fence (`` `#e8c170` ``) produces zero hits |
| `'PLACEHOLDER_DIGITS exemption (D-04): #1, #2, #123 produce zero hits'` | Placeholder digits globally exempt |

#### `describe('scanContent() — exclusion state machines', ...)` (line 243)

Unit subtests (lines 244–267):

| Test name (verbatim) | What it asserts |
|----------------------|-----------------|
| `'heading marker exemption: ## Section and ### Subsection produce zero hits'` | `##` heading markers are not citations |
| `'frontmatter exclusion (D-09): color: "#A78BFA" inside frontmatter produces zero hits'` | Line-1 frontmatter content not scanned |
| `'code fence exclusion (D-10): #3456 inside fence produces zero hits'` | Content inside triple-backtick fence not scanned |
| `'non-line-1 --- is not frontmatter: #3456 after thematic break produces one hit'` | Later `---` is thematic break; content after it IS scanned |

#### `describe('corpus scan — no issue citations', ...)` (line 271)

Dynamic corpus subtests (lines 272–285):

```
test(`no citations in ${relPath}`, () => { ... })
```
One subtest per file in `ALL_FILES` (all `.md` files collected from SCAN_DIRS). Each subtest asserts `hits === []`. The `relPath` is relative to PROJECT_ROOT, forward-slash normalized.

### Note on hex color test

The "hex color exemption" subtest (`'hex color exemption (D-11): #e8c170 produces zero hits'`) passes because the hex value is inside backticks `` `#e8c170` `` — which is NOT a code fence (triple-backtick). The digit `8170` is treated as `#8170` — wait, let me re-check. The content is `'Use color \`#e8c170\` for highlight nodes'` — this is inline code, not a code fence block. The INLINE_RE matches `#8` with digit `8`, `#e` would not match since `e` is not `\d`. Actually `#e8c170` — the regex `/#(\d+)\b/g` matches `#` followed by digits: scanning `#e8c170`, there is no `#` directly followed by a digit (`e` is not a digit). So `#e8c170` produces zero hits because `e` is not a digit, not because it is inside inline code. This confirms the hex lookbehind removal: the leading `e` in `#e8c170` stops the digit match. A hex like `#8170ff` where the first character after `#` IS a digit WOULD match — that is the accepted false-positive documented in the test header. This distinction is important for the spec.

---

## FILE_ALLOWLIST Backing Test Verification

All four backing tests confirmed present at path (verified by `ls` command):

| FILE_ALLOWLIST Entry | Digits | Backing Test | Present? |
|----------------------|--------|--------------|----------|
| `commands/gsd/config.md` | {2439} | `tests/bug-2439-set-profile-gsd-sdk-preflight.test.cjs` | YES |
| `get-shit-done/references/thinking-partner.md` | {1729} | `tests/thinking-partner.test.cjs` | YES |
| `agents/gsd-executor.md` | {2924, 3542} | `tests/worktree-cleanup.test.cjs` (for 2924) | YES |
| `agents/gsd-executor.md` | {2924, 3542} | `tests/bug-3542-executor-git-stash-prohibition.test.cjs` (for 3542) | YES |

[VERIFIED: direct filesystem ls, 2026-06-12]

No backing test gaps found. No surprises vs CONTEXT.md claims.

---

## Comparison with CONTEXT.md Claims vs Actual Source

[VERIFIED: tests/no-issue-citations.test.cjs — read directly]

| CONTEXT.md Claim | Actual Source | Match? |
|------------------|---------------|--------|
| `PLACEHOLDER_DIGITS = {1, 2, 123}` | `new Set([1, 2, 123])` | YES |
| Four FILE_ALLOWLIST entries | Three file-key entries (commands/gsd/config.md, thinking-partner.md, gsd-executor.md — the executor entry covers two digits 2924+3542) | YES — CONTEXT.md's "four entries" means four digit–file pairs; the map has three file keys but four digit entries total |
| Five SCAN_DIRS | `['commands', 'get-shit-done/workflows', 'agents', 'get-shit-done/references', 'get-shit-done/templates']` | YES |
| `INLINE_RE` / `FEAT_FORM_RE` | `/#(\d+)\b/g` / `/\bfeat-(\d{3,})\b/g` | YES |
| Frontmatter line-1 only | `lineNumber === 1` check confirmed | YES |
| `describe` names: `scanContent() — inline citation detection` / `scanContent() — exclusion state machines` / `corpus scan — no issue citations` | All three confirmed verbatim | YES |
| All four backing tests present | Confirmed by ls | YES |

**No mismatches found.** CONTEXT.md is accurate.

**One clarification for the planner:** The "four FILE_ALLOWLIST entries" phrasing in D-03 refers to four digit-file pairs (2439 in config.md, 1729 in thinking-partner.md, 2924 in gsd-executor.md, 3542 in gsd-executor.md). The actual FILE_ALLOWLIST map has three file keys (three `Set` values), but four unique allowlisted digits across those keys. The spec should describe this accurately — three files are allowlisted, four digits total are exempt per-file.

---

## How SPEC-05 Structures Each Section (Shape to Inherit)

[VERIFIED: .planning/spec/05-step-numbering/SPEC.md — read directly]

### Purpose (SPEC-05 pattern)

One dense paragraph covering:
- What the feature does (the "three-layer pipeline" or in SPEC-07 the "detection guard")
- What breaks if absent
- The tier-1 behavioral authority named explicitly at the end

SPEC-07 is simpler: single test file, detection-only, no normalizer or CLI. The Purpose paragraph needs to cover: what the guard detects (three citation forms), the two-tier allowlist semantic, the exclusion state machines, the corpus scope, and name `no-issue-citations.test.cjs` as the behavioral authority.

### Scope (SPEC-05 pattern)

Two bullet lists:
- **In scope:** One bullet per capability cluster. Each bullet names the feature and parenthesizes "(advisory enumeration, current as of 2026-06-12)" for any enumerated values.
- **Out of scope:** One bullet per deliberate exclusion, with rationale. SPEC-07's out-of-scope must include the hex-false-positive policy (D-04), remediation/cleanup (detection-only), and directories outside SCAN_DIRS.

### Invariants (SPEC-05 pattern — inline the detection shape as advisory table)

Each invariant:
1. Bold `**07-INV-M**` header
2. EARS statement (one falsifiable claim)
3. Advisory detail in blockquote or inline (marked as such, with "current as of 2026-06-12")
4. Blank line + `Consequence of violating this invariant:` sentence
5. Horizontal rule `---` between invariants

The detection branch enumeration (three citation forms for INV-1, PLACEHOLDER_DIGITS members for INV-2, FILE_ALLOWLIST entries for INV-3) is placed as advisory supporting detail with the dated marker — per D-06 and 00-CONVENTIONS.md §4.

### Acceptance Tests (SPEC-05 pattern)

For SPEC-07, no preamble is needed (no indirect-coverage rows like SPEC-05's INV-4/INV-5). Every invariant maps directly to real subtests. The table should list:
- Multiple rows per invariant (one row per named subtest that covers the invariant's claim)
- Corpus describe block rows note the pattern: `corpus describe 'no citations in <file>'` (one subtest per SCAN_FILE)

### Key Decisions (SPEC-05 pattern — lettered sub-headers)

```markdown
### (a) <short title> (D-NN)
<body>
**Settled — do not reopen.** Consequence of reopening: <what breaks>
---
### (b) ...
```

For SPEC-07, the three required Key Decisions are:
- (a) FILE_ALLOWLIST test-backing requirement (D-03)
- (b) Hex-color false-positive tradeoff — inline regex hex lookbehind removed (D-04)
- (c) Two-tier-allowlist refactor as settled design (D-05)

### Code Context (SPEC-05 pattern)

Opening `<!-- advisory -->` line. Then a dated-advisory preamble. Then a symbol table with columns `Symbol | What it does | Line (advisory)`.

For SPEC-07, the Code Context is simpler than SPEC-05 (no normalizer to document):
- Primary source file: `tests/no-issue-citations.test.cjs`
- Key symbols: `SCAN_DIRS`, `PLACEHOLDER_DIGITS`, `FILE_ALLOWLIST`, `INLINE_RE`, `FEAT_FORM_RE`, `scanContent(content, relPath)`, `collectMarkdownFiles(dir)`, `ALL_FILES`
- The four backing test file paths (advisory cross-references for the FILE_ALLOWLIST entries)

---

## SPEC-07 Proposed Invariant → Subtest Mapping

[VERIFIED: tests/no-issue-citations.test.cjs — all names extracted verbatim]

### 07-INV-1: Citation detection (three citation forms)

**Subtest cluster:** `describe('scanContent() — inline citation detection', ...)`

| Subtest name (verbatim) | Supports which claim |
|-------------------------|----------------------|
| `'INLINE_RE positive: #3097 produces one inline hit'` | Inline `#NNN` detection |
| `'github-style citation: owner/repo#NNN is detected'` | `owner/repo#NNN` trailing form detected (deliberate positive) |
| `'parenthetical category: (#3097) produces one parenthetical hit'` | Paren-context disambiguation within same regex pass |
| `'FEAT_FORM_RE positive: feat-3347 produces one feat-form hit'` | Feat-form `feat-NNNN` (3+ digits) detection |

Plus: `corpus describe 'corpus scan — no issue citations'` → `test('no citations in ${relPath}', ...)` (one per SCAN_FILE) — these are the GREEN corpus oracle.

### 07-INV-2: PLACEHOLDER_DIGITS global exemption

**Subtest:** `'PLACEHOLDER_DIGITS exemption (D-04): #1, #2, #123 produce zero hits'`

### 07-INV-3: FILE_ALLOWLIST per-file exemption (with test-backing clause)

**No dedicated unit subtest** exists for the FILE_ALLOWLIST per-file exemption logic itself. The corpus scan subtests (`test('no citations in ${relPath}', ...)`) are the functional oracle — the FILE_ALLOWLIST entries must be correct or the corpus scan would fail RED. The test-backing clause (D-03) is narrated in Purpose + Key Decision, not traced to a dedicated FILE_ALLOWLIST unit test.

**Planner implication:** The Acceptance Tests row for 07-INV-3 should cite the corpus describe block (`'corpus scan — no issue citations'` → `'no citations in commands/gsd/config.md'` etc.) as the functional oracle, with a note that per-file exemption is exercised by the corpus pass.

### 07-INV-4: Exclusion state machines

**Subtest cluster:** `describe('scanContent() — exclusion state machines', ...)`

| Subtest name (verbatim) | Supports which claim |
|-------------------------|----------------------|
| `'heading marker exemption: ## Section and ### Subsection produce zero hits'` | `##` heading markers not cited as violations |
| `'frontmatter exclusion (D-09): color: "#A78BFA" inside frontmatter produces zero hits'` | Frontmatter content (line-1 `---` open) excluded |
| `'code fence exclusion (D-10): #3456 inside fence produces zero hits'` | Triple-backtick fence content excluded |
| `'non-line-1 --- is not frontmatter: #3456 after thematic break produces one hit'` | Later `---` is thematic break; content after it scanned |

### 07-INV-5: Five-directory SCAN_DIRS scope

**No dedicated unit test.** The corpus describe block `'corpus scan — no issue citations'` exercises the scope implicitly: `ALL_FILES` is built from the five SCAN_DIRS, and each file's subtest confirms the scope. The normative claim is the shape (a fixed five-directory set); the literal directory list is advisory.

If INV-5 is kept standalone, its Acceptance Tests row cites the corpus describe block as the oracle (same as 07-INV-1's corpus rows). If INV-5 is folded into INV-1, the detection invariant's corpus oracle row already covers it.

---

## Common Pitfalls

### Pitfall 1: Inventing subtest names instead of citing verbatim

**What goes wrong:** The Acceptance Tests table contains paraphrased or invented subtest names that don't match what the test runner reports.
**Why it happens:** Executor writes from memory instead of reading the test file.
**How to avoid:** Use only the verbatim names from the VERBATIM SOURCE EXTRACTION section above. Every `test('...')` string is an exact match.
**Warning signs:** A subtest name has capital letters or punctuation patterns that differ from the actual file.

### Pitfall 2: Treating FILE_ALLOWLIST as having four file keys

**What goes wrong:** The spec says "four file-path entries in FILE_ALLOWLIST" but the actual map has three file keys (`commands/gsd/config.md`, `get-shit-done/references/thinking-partner.md`, `agents/gsd-executor.md`).
**Why it happens:** CONTEXT.md phrases it as "four current backings" meaning four digit-file pairs; the actual JavaScript object has three keys.
**How to avoid:** State three files are allowlisted, covering four digit exemptions total. The normative claim is the shape (per-file exemption), not the count.

### Pitfall 3: Adding a normative claim to Code Context

**What goes wrong:** Code Context contains a sentence like "The `scanContent()` function MUST accept a `relPath` parameter" — this looks normative.
**Why it happens:** The Code Context section feels like a specification.
**How to avoid:** Every sentence in Code Context is advisory description only. The invariants in §Invariants are the normative contract. Code Context just points reimplementers to the existing implementation.

### Pitfall 4: Section drift from 00-CONVENTIONS.md template

**What goes wrong:** Adding a section like "## Implementation Notes" or reordering sections.
**Why it happens:** Spec feels like it needs an extra section.
**How to avoid:** Strictly follow the 7-section order: Purpose, Scope, Invariants, Acceptance Tests, Key Decisions, Code Context. Phase 77 rejects any drift.

### Pitfall 5: Not advancing Status to Ready

**What goes wrong:** SPEC.md is complete but Status remains `Draft`.
**Why it happens:** Forgetting the final frontmatter update.
**How to avoid:** The last edit to SPEC.md sets `**Status:** Ready` and fills in `**Confidence:**` and `**Specced:** 2026-06-12`.

### Pitfall 6: Missing INV-3 test-backing normative clause

**What goes wrong:** 07-INV-3 states the per-file exemption rule but omits the test-backing requirement (D-03 mandates: every FILE_ALLOWLIST entry MUST be backed by a sibling test).
**Why it happens:** D-03 is a cross-spec concern and easy to overlook.
**How to avoid:** 07-INV-3 explicitly includes a sub-clause: "every FILE_ALLOWLIST entry MUST be backed by a sibling test that requires the cited digit's continued presence in that file."

---

## Stub State Verification

[VERIFIED: .planning/spec/07-citation-guard/SPEC.md — read directly]

The stub has:
- Correct frontmatter: `**Status:** Draft`, `**Depends on:** SPEC-08`, `**Reimplementation evidence (tier-1 test):** tests/no-issue-citations.test.cjs`
- All 7 sections present as HTML comment placeholders
- No body text in any section (all `<!-- to be filled ... -->`)

The executor fills in every placeholder. The Confidence and Specced fields are left blank in the stub — the executor fills them when finalizing.

---

## INDEX.md Consistency Check

[VERIFIED: .planning/spec/INDEX.md — read directly]

The INDEX.md row for SPEC-07:
- Status: `Draft` — must advance to `Ready` in this phase
- Depends On: `SPEC-08` — preserved
- Wave 2 mapping (Phase 76) — correct

The Feature-Status Table in INDEX.md shows `Draft` for SPEC-07. After Phase 76 completes, the executor MUST update this row to `Ready`. This is an integration point: the INDEX.md Feature-Status Table row `| SPEC-07 | Citation Guard | ... | Draft | SPEC-08 |` must become `| SPEC-07 | Citation Guard | ... | Ready | SPEC-08 |`.

---

## Environment Availability

Step 2.6: SKIPPED — no external dependencies. This phase is documentation-only (Write/Edit tools on Markdown files). No CLI tools, services, or runtimes beyond the file system are required.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | — | — | — |

**All claims in this research were verified by direct file read from the codebase. No assumed claims.** The test file, spec stub, conventions, sibling specs, and backing test files were all read directly. No web search or training-data assumptions were needed.

---

## Open Questions

1. **Whether INV-5 (SCAN_DIRS scope) stands alone or folds into INV-1 (detection)**
   - What we know: D-01 lists five invariants with INV-5 as standalone. Claude's Discretion allows folding if it reads cleanly.
   - What's unclear: Whether a standalone INV-5 adds clarity or redundancy given the corpus oracle already implies the scope.
   - Recommendation: Keep INV-5 standalone. A reader scanning invariants should see the scope constraint explicitly stated as its own claim, not embedded in the detection invariant. The corpus describe block row in the Acceptance Tests table provides clean traceability for INV-5 without duplication.

2. **07-INV-3 Acceptance Tests oracle — no dedicated FILE_ALLOWLIST unit test**
   - What we know: There is no unit test that directly exercises the `FILE_ALLOWLIST[relPath]?.has(digit)` branch with an assertion (the PLACEHOLDER_DIGITS test does test the analogous branch). The corpus scan subtests are the functional oracle.
   - What's unclear: Whether to mark INV-3 as having indirect coverage (like SPEC-05 INV-4/INV-5) or cite specific corpus file subtests.
   - Recommendation: Cite corpus file subtests by name: `'no citations in commands/gsd/config.md'`, `'no citations in get-shit-done/references/thinking-partner.md'`, `'no citations in agents/gsd-executor.md'` — these three are the direct oracle for the per-file exemption being correct. No `[MISSING]` row needed; the coverage exists.

---

## Sources

### Primary (HIGH confidence)
- `tests/no-issue-citations.test.cjs` — full source read; all constants, regexes, describe/test names extracted verbatim [VERIFIED: direct codebase read]
- `.planning/spec/00-CONVENTIONS.md` — locked 7-section template, ID scheme, status vocabulary, source-of-truth hierarchy [VERIFIED: direct codebase read]
- `.planning/spec/07-citation-guard/SPEC.md` — stub state confirmed [VERIFIED: direct codebase read]
- `.planning/spec/05-step-numbering/SPEC.md` — closest sibling reference for section shape, invariant format, advisory marking, Key Decisions format [VERIFIED: direct codebase read]
- `.planning/spec/01-positive-framing/SPEC.md` — additional sibling shape reference [VERIFIED: direct codebase read]
- `.planning/spec/INDEX.md` — SPEC-07 row status and dependency edge confirmed [VERIFIED: direct codebase read]
- `.planning/phases/76-spec-07-citation-guard/76-CONTEXT.md` — user decisions D-01..D-06 [VERIFIED: direct codebase read]
- `.planning/REQUIREMENTS.md` — SPEC-07 handle and QUAL-01–05 definitions [VERIFIED: direct codebase read]
- Four backing test files confirmed present by `ls` [VERIFIED: filesystem, 2026-06-12]

### Secondary (MEDIUM confidence)
None needed — all research is codebase-internal.

### Tertiary (LOW confidence)
None.

---

## Metadata

**Confidence breakdown:**
- Test source extraction: HIGH — file read directly, all names verbatim
- Section template shape: HIGH — 00-CONVENTIONS.md and siblings read directly
- Invariant → subtest mapping: HIGH — direct test file read, no inference
- Backing test presence: HIGH — verified by ls

**Research date:** 2026-06-12
**Valid until:** Stable until `tests/no-issue-citations.test.cjs` is edited (any describe/test name change would require updating the Acceptance Tests table; any constant change would update the advisory enumeration only, not the normative contract)
