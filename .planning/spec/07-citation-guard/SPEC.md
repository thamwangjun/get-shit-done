# SPEC-07: Citation Cleanup Guard

**ID:** 07
**Requirement:** SPEC-07
**Status:** Ready
**Confidence:** High
**Specced:** 2026-06-12
**Reimplementation target:** v2.1.0-h fork features on refactored upstream
**Depends on:** SPEC-08
**Reimplementation evidence (tier-1 test):** tests/no-issue-citations.test.cjs

---

## Purpose

The citation-cleanup guard is a single corpus scanner that detects issue/PR-number citations accumulated in the five prompt-content directories and keeps illustrative example digits and functional cross-references distinguishable from un-cleaned citations that have no place in shipped prompt content. The guard detects citations in three forms: inline `#NNN` (a bare hash followed by one or more digits), parenthetical `(#NNN)` (the same `INLINE_RE` match categorized as `parenthetical` when the matched text is immediately wrapped by `(` and `)` — the category distinction happens within one regex pass, not via a separate expression), and feat-form `feat-NNNN` with a 3+ digit tracker ID matched by `FEAT_FORM_RE`. The github-style `owner/repo#NNN` form is a deliberate positive: its trailing `#NNN` matches `INLINE_RE` and is flagged by design. The guard applies a two-tier allowlist: `PLACEHOLDER_DIGITS` holds illustrative example digits that are exempt everywhere in the corpus (global tier), while `FILE_ALLOWLIST` holds functional cross-reference digits that are exempt only in their specific listed file and remain flagged in every other corpus file (per-file tier); every `FILE_ALLOWLIST` entry must be backed by a sibling test that requires the cited digit's continued presence in that file. The guard also applies two exclusion state machines: YAML frontmatter (recognized only when the opening `---` is on line 1; a `---` on any later line is a thematic break and content after it is scanned) and triple-backtick code fences (a line matching `/^```/` toggles the fence, and fenced content is skipped). Without the guard, issue/PR citations to ephemeral tracker IDs silently accumulate across upstream merges and ship in prompt content that no longer has access to the referenced issue; a wrong allowlist either over-exempts a real citation in the wrong file (a functional digit slips through corpus-wide) or flags a legitimate illustrative placeholder. The behavioral authority for all detection, allowlist, and exclusion behavior is `tests/no-issue-citations.test.cjs` (source-of-truth tier 1 per `00-CONVENTIONS.md` §4). This guard is detection-only — there is no remediation or normalizer CLI; Phase 66 performed the one-time cleanup manually and the guard ensures the corpus stays clean.

## Scope

**In scope:**

- **Three-form citation detection** — inline `#NNN`, parenthetical `(#NNN)` (paren-context disambiguation within one `INLINE_RE` pass), and feat-form `feat-NNNN` (3+ digit tracker ID, `FEAT_FORM_RE`). The github-style `owner/repo#NNN` form is a deliberate positive detected by its trailing `#NNN` match — it is not an exemption.
- **PLACEHOLDER_DIGITS global exemption tier** — a digit that is a member of `PLACEHOLDER_DIGITS` is exempt everywhere in the corpus. Current members (advisory enumeration, current as of 2026-06-12): `{1, 2, 123}`. The normative claim is the global-exemption shape; the member values are dated.
- **FILE_ALLOWLIST per-file exemption tier** — a digit listed in `FILE_ALLOWLIST` for a given file is exempt only in that listed file and remains a flagged violation in every other corpus file. Every `FILE_ALLOWLIST` entry must be backed by a sibling test that requires the cited digit's continued presence. Current entries (advisory enumeration, current as of 2026-06-12): three file keys covering four allowlisted digits — `commands/gsd/config.md` → `{2439}`, `get-shit-done/references/thinking-partner.md` → `{1729}`, `agents/gsd-executor.md` → `{2924, 3542}`. The normative claim is the per-file-exemption-with-test-backing shape; the specific entries are dated.
- **Two exclusion state machines** — (a) line-1-only YAML frontmatter: the opening `---` activates frontmatter exclusion only when it is on line 1; a `---` on any later line is a thematic break, and content after it is scanned; (b) triple-backtick code fences: a line matching `/^```/` toggles the fence and fenced content is not scanned.
- **Five-directory SCAN_DIRS corpus scope** — the corpus scanned is a fixed five-element `SCAN_DIRS` set. Current directories (advisory enumeration, current as of 2026-06-12): `commands/`, `get-shit-done/workflows/`, `agents/`, `get-shit-done/references/`, `get-shit-done/templates/`. The normative claim is the scope shape (a fixed five-directory set), not the literal directory list.

**Out of scope:**

- **Hex-color deliberate-false-positive policy** — a hex tail in bare prose whose first character after `#` is a digit (e.g., `#8170ff`) is accepted-as-flagged by design, because false negatives (a missed real citation like `owner/repo#NNN`) are worse than false positives (a flagged hex tail an author can move to a fence or allowlist). The inline regex deliberately has no hex lookbehind (removed in 260610-gku). Hex colors inside frontmatter (D-09) and code fences (D-10) are protected by the exclusion state machines (07-INV-4), not by any hex-specific rule. The full settled rationale is in Key Decision (b).
- **Remediation / citation cleanup** — the guard is detection-only; there is no normalizer or repair CLI to spec. Phase 66 performed the one-time cleanup manually and no automated repair tool exists.
- **Directories outside SCAN_DIRS** — `tests/`, `sdk/`, and any path not in the five-directory set are not part of the prompt corpus this guard governs.

## Invariants

**07-INV-1** — When the scanner processes a non-frontmatter, non-code-fence line, the system MUST flag issue/PR-number citations in three forms as a single detection family: (a) inline `#NNN` — a bare hash immediately followed by one or more digits; (b) parenthetical `(#NNN)` — the same `INLINE_RE` match categorized as `parenthetical` when the matched text is immediately preceded by `(` and followed by `)` (the distinction is made within one regex pass via paren-context inspection, not via a separate regex); and (c) feat-form `feat-NNNN` — a `feat-` prefix followed by a 3+ digit tracker ID matched by `FEAT_FORM_RE`. The github-style `owner/repo#NNN` form MUST be detected — its trailing `#NNN` matches `INLINE_RE` and is a deliberate positive, not an exemption. The detection regexes `INLINE_RE` (`/#(\d+)\b/g`) and `FEAT_FORM_RE` (`/\bfeat-(\d{3,})\b/g`) are advisory supporting detail, current as of 2026-06-12.

Consequence of violating this invariant: a citation form not detected by the scanner ships in prompt content undetected; an agent downstream reads a broken reference to a tracker ID that has no accessible context.

---

**07-INV-2** — The system MUST treat any digit that is a member of `PLACEHOLDER_DIGITS` as exempt everywhere in the corpus — global, unconditional exemption for illustrative example digits with no real issue/PR referent. A `PLACEHOLDER_DIGITS` member MUST NOT be flagged in any corpus file. The current members (`{1, 2, 123}`, new Set, advisory enumeration current as of 2026-06-12) are advisory; the normative claim is the global-exemption rule, not the specific member values.

Consequence of violating this invariant: illustrative placeholder digits (used as examples in prompt content) produce false-positive violations on every corpus scan, creating noise that obscures real citations and training authors to ignore warnings.

---

**07-INV-3** — The system MUST treat any digit listed in `FILE_ALLOWLIST` for a given file as exempt ONLY in that listed file, and MUST continue to flag the same digit as a violation in every other corpus file. Per-file exemption is scoped exclusively to the file whose path matches the `FILE_ALLOWLIST` key; the same digit in any other file is a violation regardless of its value. Every `FILE_ALLOWLIST` entry MUST be backed by a sibling test that requires the cited digit's continued presence in that file; an entry without a backing test is indistinguishable from an un-cleaned citation and becomes a silent permanent exemption. The current entries (three file keys / four allowlisted digits: `commands/gsd/config.md` → `{2439}`, `get-shit-done/references/thinking-partner.md` → `{1729}`, `agents/gsd-executor.md` → `{2924, 3542}`) and their four backing tests are advisory, current as of 2026-06-12.

Consequence of violating this invariant: either (a) a functional cross-reference digit is exempted corpus-wide (like a `PLACEHOLDER_DIGITS` member) — a real citation in the wrong file slips through undetected — or (b) an unbacked allowlist entry lets a real un-cleaned citation hide permanently behind a per-file exemption that no test guards, defeating the guard's purpose for that file.

---

**07-INV-4** — Content inside an excluded region MUST NOT be scanned for citations. Two excluded regions apply: (a) YAML frontmatter — the scanner recognizes an opening `---` as the start of a frontmatter block ONLY when that line is line 1 of the file (`lineNumber === 1`); a `---` on any later line is a thematic break, and all content after it IS scanned normally; once the frontmatter block closes (matching closing `---`), scanning resumes for the rest of the file; (b) triple-backtick code fences — a line beginning with ` ``` ` (matching `/^```/`) toggles the fence state, and all lines while the fence is open are not scanned; the fence-toggle line itself is also skipped. The line-1-only frontmatter rule and the thematic-break consequence MUST be preserved by any reimplementation: a later `---` is content, not a frontmatter opener.

Consequence of violating this invariant: frontmatter color values (e.g., `color: '#A78BFA'`) or code examples with `#NNN` strings produce false-positive violations, polluting the corpus scan with noise that makes the guard untrustworthy.

---

**07-INV-5** — The corpus the guard scans MUST be the fixed five-directory `SCAN_DIRS` set; files outside that set MUST NOT be scanned and MUST NOT contribute to the `ALL_FILES` collection. The normative claim is the scope shape (a fixed five-element directory set), not the literal directory list. The current five directories (`commands/`, `get-shit-done/workflows/`, `agents/`, `get-shit-done/references/`, `get-shit-done/templates/`) are advisory, current as of 2026-06-12.

Consequence of violating this invariant: either scanning too few directories misses citations in unscanned prompt-content files (false negatives), or scanning too many directories produces violations in non-corpus files (e.g., `tests/`, `sdk/`) that have different citation-management policies, creating spurious failures.

## Acceptance Tests

07-INV-3 and 07-INV-5 have no dedicated unit tests for their specific branches. Their acceptance oracle is the corpus describe block `'corpus scan — no issue citations'` in `tests/no-issue-citations.test.cjs`: the `FILE_ALLOWLIST` entries and the `SCAN_DIRS` scope must both be correct or the corpus pass would fail RED. This is real indirect coverage, not missing tests.

| Invariant | Test File | Subtest / Assertion Shape |
|-----------|-----------|--------------------------|
| 07-INV-1 | tests/no-issue-citations.test.cjs | `'INLINE_RE positive: #3097 produces one inline hit'` |
| 07-INV-1 | tests/no-issue-citations.test.cjs | `'github-style citation: owner/repo#NNN is detected'` |
| 07-INV-1 | tests/no-issue-citations.test.cjs | `'parenthetical category: (#3097) produces one parenthetical hit'` |
| 07-INV-1 | tests/no-issue-citations.test.cjs | `'FEAT_FORM_RE positive: feat-3347 produces one feat-form hit'` |
| 07-INV-1 | tests/no-issue-citations.test.cjs | corpus describe `'corpus scan — no issue citations'` → `'no citations in <file>'` (one subtest per file in ALL_FILES) |
| 07-INV-2 | tests/no-issue-citations.test.cjs | `'PLACEHOLDER_DIGITS exemption (D-04): #1, #2, #123 produce zero hits'` |
| 07-INV-3 | tests/no-issue-citations.test.cjs | `'no citations in commands/gsd/config.md'` (corpus describe — per-file exemption oracle for FILE_ALLOWLIST entry #2439) |
| 07-INV-3 | tests/no-issue-citations.test.cjs | `'no citations in get-shit-done/references/thinking-partner.md'` (corpus describe — per-file exemption oracle for FILE_ALLOWLIST entry #1729) |
| 07-INV-3 | tests/no-issue-citations.test.cjs | `'no citations in agents/gsd-executor.md'` (corpus describe — per-file exemption oracle for FILE_ALLOWLIST entries #2924, #3542) |
| 07-INV-4 | tests/no-issue-citations.test.cjs | `'heading marker exemption: ## Section and ### Subsection produce zero hits'` |
| 07-INV-4 | tests/no-issue-citations.test.cjs | `'frontmatter exclusion (D-09): color: "#A78BFA" inside frontmatter produces zero hits'` |
| 07-INV-4 | tests/no-issue-citations.test.cjs | `'code fence exclusion (D-10): #3456 inside fence produces zero hits'` |
| 07-INV-4 | tests/no-issue-citations.test.cjs | `'non-line-1 --- is not frontmatter: #3456 after thematic break produces one hit'` |
| 07-INV-5 | tests/no-issue-citations.test.cjs | corpus describe `'corpus scan — no issue citations'` → `'no citations in <file>'` (one subtest per file across the five SCAN_DIRS — scope oracle) |

## Key Decisions

### (a) FILE_ALLOWLIST test-backing requirement (D-03)

Every `FILE_ALLOWLIST` entry exists only because another contract — a sibling test — depends on the cited digit's continued presence in that file; remove the dependency and the citation must go. The allowlist exempts a citation only because another test requires it, so every entry must be backed by a sibling test that asserts the digit's presence. An entry without a backing test is indistinguishable from an un-cleaned citation and becomes a silent permanent exemption that no automated check will ever surface. The four current backing relationships are advisory (current as of 2026-06-12, and will shift on any file rename):

- `commands/gsd/config.md` #2439 ← `tests/bug-2439-set-profile-gsd-sdk-preflight.test.cjs`
- `get-shit-done/references/thinking-partner.md` #1729 ← `tests/thinking-partner.test.cjs`
- `agents/gsd-executor.md` #2924 ← `tests/worktree-cleanup.test.cjs`
- `agents/gsd-executor.md` #3542 ← `tests/bug-3542-executor-git-stash-prohibition.test.cjs`

Rationale: the allowlist is a contract between the citation guard and the tests that depend on those digits — without the backing test, no mechanism enforces that the allowlisted digit is still required, and the exemption silently outlives the reason it was granted.

**Settled — do not reopen.** Consequence of reopening: an unbacked `FILE_ALLOWLIST` entry lets a real un-cleaned citation hide permanently behind a per-file exemption that no test guards — the guard's purpose for that file is defeated, and the corpus silently diverges from the "no citations" contract.

---

### (b) Hex-color deliberate-false-positive tradeoff — inline regex hex lookbehind removed (D-04)

The guard accepts hex-color false positives in plain prose by design, because false negatives (a missed real citation like `owner/repo#NNN` slipping through) are worse than false positives (a flagged hex tail that an author can move to a code fence or add to the allowlist). The inline regex deliberately has no hex lookbehind; it was removed in quick task 260610-gku. The precise mechanics: `#e8c170` produces zero hits in `tests/no-issue-citations.test.cjs` because the character immediately after `#` is `e` — not a digit — so `INLINE_RE` (`/#(\d+)\b/g`) does not match. A hex tail whose first post-`#` character IS a digit (e.g., `#8170ff`) WOULD match and is accepted-as-flagged. Hex colors inside YAML frontmatter (D-09) and code fences (D-10) are fully protected by the exclusion state machines in 07-INV-4 — that protection requires no hex-specific rule.

Rationale: a citation scanner that adds hex-lookahead to avoid prose false positives reintroduces the false-negative path it was built to close — real `owner/repo#NNN`-style citations would slip through undetected.

**Settled — do not reopen.** Consequence of reopening: re-adding a hex lookbehind to suppress prose hex false positives reintroduces the false negative it was removed to fix — real citations of the form `owner/repo#NNN` (where the first digit after `#` is numeric) would slip through the guard undetected.

---

### (c) Two-tier-allowlist refactor as settled design (D-05)

The original single flat allowlist was split into a global `PLACEHOLDER_DIGITS` tier and a per-file `FILE_ALLOWLIST` tier because the two exemption needs are different in kind: illustrative-everywhere placeholders (which have no real issue referent and should be exempt everywhere) versus functional-here-only cross-references (which are required by another test in a specific file and should be flagged everywhere else). The two-tier design is the normative structure; INV-2 and INV-3 are separate invariants precisely because the scope-of-exemption contrast (global vs per-file) is the observable behavioral claim.

Rationale: collapsing both exemption types back into one flat list cannot express "exempt everywhere" and "exempt only here" simultaneously without either over-exempting functional cross-reference digits corpus-wide or burdening illustrative placeholders with per-file entries that require constant maintenance.

**Settled — do not reopen.** Consequence of reopening: a single flat allowlist either leaks functional cross-reference digits into every file (real citations in the wrong file slip through undetected) or forces per-file entries onto every illustrative placeholder digit (needless maintenance burden and churn on every corpus edit); the INV-2/INV-3 scope-of-exemption contrast collapses, leaving a reimplementer unable to reason about which exemptions are global and which are file-scoped.

## Code Context

<!-- advisory -->

The items below are current as of 2026-06-12. All file paths, function names, regex bodies, constant values, and line numbers are advisory and will shift on any test edit or upstream refactor. No normative invariant depends on these paths or symbols — a reimplementer rebuilds the guard from the behavioral contract in §Invariants and §Key Decisions above.

---

### `tests/no-issue-citations.test.cjs` — tier-1 normative source

| Symbol | What it does | Line (advisory) |
|--------|--------------|-----------------|
| `SCAN_DIRS` | Five-element array of corpus directories scanned | 44 |
| `PLACEHOLDER_DIGITS` | `new Set([1, 2, 123])` — global tier of illustrative example digits, exempt everywhere | 54 |
| `FILE_ALLOWLIST` | Per-file map: three file keys / four allowlisted digits — per-file functional cross-reference exemptions | 60 |
| `INLINE_RE` | `/#(\d+)\b/g` — matches `#NNN` in non-frontmatter, non-code-fence prose; no hex lookbehind | 77 |
| `FEAT_FORM_RE` | `/\bfeat-(\d{3,})\b/g` — matches `feat-NNNN` with 3+ digit tracker IDs | 82 |
| `scanContent(content, relPath)` | Paren-context disambiguation for parenthetical vs inline; applies `PLACEHOLDER_DIGITS` + `FILE_ALLOWLIST[relPath]` exemption; frontmatter (line-1-only) + code-fence state machines | 133 |
| `collectMarkdownFiles(dir)` | ENOENT-tolerant recursive `.md` file collector | 93 |
| `ALL_FILES` | All markdown files collected from `SCAN_DIRS` at module scope | 117 |

There is no dedicated `FILE_ALLOWLIST` unit test and no dedicated `SCAN_DIRS`-scope unit test — the corpus describe block `'corpus scan — no issue citations'` (one `'no citations in <file>'` subtest per file) is the functional oracle for 07-INV-3 and 07-INV-5. There is no remediation or normalizer CLI for this guard.

---

### Advisory FILE_ALLOWLIST backing-test cross-references (D-03)

The following cross-references document which sibling test backs each `FILE_ALLOWLIST` entry. These paths are advisory and will shift on any test rename. The test-backing requirement itself is normative (07-INV-3 / Key Decision (a)); these specific test paths are not.

| FILE_ALLOWLIST file | Digit(s) | Backing test (advisory) |
|---------------------|----------|-------------------------|
| `commands/gsd/config.md` | 2439 | `tests/bug-2439-set-profile-gsd-sdk-preflight.test.cjs` |
| `get-shit-done/references/thinking-partner.md` | 1729 | `tests/thinking-partner.test.cjs` |
| `agents/gsd-executor.md` | 2924 | `tests/worktree-cleanup.test.cjs` |
| `agents/gsd-executor.md` | 3542 | `tests/bug-3542-executor-git-stash-prohibition.test.cjs` |
