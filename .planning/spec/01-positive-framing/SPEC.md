# SPEC-01: Positive Framing Standard

**ID:** 01
**Requirement:** SPEC-01
**Status:** Ready
**Confidence:** High
**Specced:** 2026-06-12
**Reimplementation target:** v2.1.0-h fork features on refactored upstream
**Depends on:** —
**Reimplementation evidence (tier-1 test):** tests/negative-framing-scan.test.cjs

---

## Purpose

The affirmative-framing standard governs how prompt-corpus files (agents, workflows, references,
and commands) state behavioral requirements: negative directives ("do not X", "never X", "avoid X")
are replaced with affirmative instructions that state the correct behavior, not merely deleted or
softened. This replacement rule — sourced from `CLAUDE.md` §"Positive framing replacement rule"
(tier-4 human-authoring guidance) — is enforced at authoring time by a corpus scanner whose
behavioral contract is the tier-1 normative source `tests/negative-framing-scan.test.cjs`. The
scanner detects clause-start negative directives in the prompt-corpus and classifies them into
two severity tiers: hard-failure violations (block-set tokens) and soft warnings (warn-only tokens).
Factual, conditional, reframe, and paired-complement usages are suppressed so the scanner reports
directive violations, not incidental negative-polarity language. Without this scanner, non-conforming
negative directives ship unflagged in corpus files, regressing the fork's quality bar undetected
across upstream merges.

## Scope

**In scope:**

- Detection of clause-start negative directives in scanned prompt-corpus `.md` files across the
  fixed set of four scan directories (agents, get-shit-done/workflows, get-shit-done/references,
  commands/gsd).
- Two-tier severity classification: block-set tokens that produce a hard test failure, and
  warn-only tokens that surface in the warnings bucket without failing the run.
- Exception suppression: the behavioral classes (paired-complement, factual-never,
  conditional-or-factual, reframe, factual-dont, avoid-directive, forbidden-directive) that
  identify non-directive usages and suppress them from flagging.
- Code-fence exclusion: content inside fenced code blocks is never scanned.
- The affirmative-rewrite replacement rule as a human-authoring standard governing how detected
  violations are remediated (documented in Key Decisions; the scanner only flags, it does not
  rewrite).

**Out of scope:**

- Rewriting or remediating detected violations — the scanner flags occurrences; the human author
  performs the affirmative rewrite. The rewrite standard is a Key Decision, not a scanner behavior.
- Non-`.md` files — the scanner operates only on Markdown corpus files; other file types are not
  scanned.
- Runtime or session prompt-content edits — the scanner runs at test time over the committed
  corpus; it does not intercept live prompt construction.
- Tier-4 reference guides (PROMPT_IMPROVEMENT_GUIDE_V01.md, PROMPT_ENGINEERING_GUIDE_V09.md) —
  these are background context for the fork's framing standard; the test file is authoritative
  for all scanner behavior claims.

## Invariants

**01-INV-1** — When the corpus scanner processes a non-fenced line whose clause start carries a
negative-directive token, and none of the exception classes apply, the system MUST record that
line as a violation in the appropriate bucket. The detection shape is normative: a clause-start
negative directive, minus the suppressed exception classes, is flagged. The branch enumeration
below is advisory — supporting detail, not the contract:

> **Block-set tokens (hard-failure violations) — current as of 2026-06-12:**
>
> | Token | Form |
> |-------|------|
> | `never` | uppercase `NEVER`, word-boundary match |
> | `do not` | case-insensitive, `\bdo not\b` |
> | `avoid` | case-insensitive, clause-initial only (subject-precedence and parenthetical forms suppressed) |
> | `don't` | case-insensitive, `\bdon't\b` |
> | `<anti_patterns>` | opening tag, case-insensitive (closing tag not matched) |
> | `must not` | case-insensitive, `\bmust\s+not\b` |
> | `should not` | case-insensitive, `\bshould\s+not\b` |
> | `prohibited` | case-insensitive, `\bprohibited\b` |
> | `forbidden` | predicate form only — "X is/are forbidden" (adjective-noun form not matched) |
>
> **Warn-only tokens (warnings bucket, never fail the run) — current as of 2026-06-12:**
>
> | Token | Form |
> |-------|------|
> | `cannot` | case-insensitive, `\bcannot\b` |
> | `won't` | case-insensitive, `\bwon't\b` |
> | `will not` | case-insensitive, `\bwill\s+not\b` |

Twelve detection branches in total (9 block + 3 warn-only); the branch count is advisory per D-02.
Consequence of violating this invariant: clause-start negative directives ship in corpus files
without detection, regressing the fork's affirmative-framing quality bar undetected.

---

**01-INV-2** — When the scanner records a result, block-set tokens (never, do not, avoid, don't,
`<anti_patterns>`, must not, should not, prohibited, forbidden) MUST appear in `result.violations`
and cause a hard test failure; warn-only tokens (cannot, won't, will not) MUST appear in
`result.warnings` and SHALL NOT cause a test failure. The return shape `{ violations, warnings }`
is the normative API contract: all nine block-bucket keys land under `violations`; all three
warn-only keys land under `warnings`. Consequence of violating this invariant: warn-only tokens
either over-block (treated as hard failures) or the soft-signal intent is lost entirely (collapsed
into violations), both of which are incorrect.

---

**01-INV-3** — When the scanner encounters a matched token, and that token's occurrence is
factual, conditional, a reframe pattern, or paired with an inline positive complement, the system
MUST NOT flag that occurrence. The following behavioral exception classes are normative; an
implementation reproduces all seven:

1. **Paired-complement** — a directive immediately followed by a positive instruction (em-dash,
   double-dash, period+capital, or parenthetical) is not a bare prohibition.
2. **Factual-never** — `never` used as a state-describing adverb ("is never called", lowercase
   "never", subject-phrase "X NEVER receives") is not a directive.
3. **Conditional-or-factual** — lines opening with a conditional word (if/when/unless/whether/
   while/after/before), state-verb constructions ("do not match/exist"), relative clauses
   ("that/which do not"), and mid-sentence subject+verb constructions are factual or conditional,
   not directives.
4. **Reframe** — "your job is not to X — it is to Y" pairs a negative clause with an immediate
   positive complement to displace a model default; this is not a directive violation.
5. **Factual-dont** — `don't` used as a state or capability description ("you don't know",
   "tasks don't achieve") is not a directive; a bullet-start `don't` remains a directive
   regardless (bug 2026-04-22 regression guard).
6. **Avoid-directive** — `avoid` is flagged ONLY when clause-initial (line start, bullet start,
   or bold-wrapped); subject-precedence, parenthetical, and mid-sentence uses are not directives.
7. **Forbidden-directive** — `forbidden` is flagged ONLY in the predicate form "X is/are
   forbidden"; adjective-noun forms ("forbidden files", "forbidden patterns") and negated
   predicates ("is not forbidden") are not directive violations. This exception class is never
   composed with the paired-complement check.

Consequence of violating this invariant: factual, conditional, and contextual negative-polarity
language produces false-positive violations, making the scanner noisy and untrustworthy for
legitimate corpus text.

---

**01-INV-4** — The scanner MUST traverse a fixed set of prompt-corpus directories and scan every
`.md` file within them recursively. The four scan directories (agents, get-shit-done/workflows,
get-shit-done/references, commands/gsd) are advisory supporting detail; the normative claim is
that the scanner targets the fixed prompt-corpus directory set. A missing directory MUST be
silently skipped (ENOENT tolerated); other filesystem errors MUST be propagated. Consequence
of violating this invariant: prompt-corpus files outside the scanned paths accumulate
negative-directive violations undetected.

---

**01-INV-5** — Content inside fenced code blocks (triple-backtick fences) MUST NOT be scanned.
The fence line itself MUST NOT be scanned. All detection branches are bypassed for every line
inside a fence, including lines that contain block-set or warn-only tokens. Consequence of
violating this invariant: code examples and shell commands containing negative-directive token
strings produce false-positive violations against legitimate instructional code.

## Acceptance Tests

| Invariant | Test File | Subtest / Assertion Shape |
|-----------|-----------|--------------------------|
| 01-INV-1 | tests/negative-framing-scan.test.cjs | `'flags bare NEVER directive'` |
| 01-INV-1 | tests/negative-framing-scan.test.cjs | `'flags DO NOT without positive complement'` |
| 01-INV-1 | tests/negative-framing-scan.test.cjs | `'flags clause-initial avoid directive'` |
| 01-INV-1 | tests/negative-framing-scan.test.cjs | `'flags bullet-start don\'t directive (bug 2026-04-22 regression guard)'` |
| 01-INV-1 | tests/negative-framing-scan.test.cjs | `'flags <anti_patterns> opening tag exactly once per block'` |
| 01-INV-1 | tests/negative-framing-scan.test.cjs | `'flags must not directive'` |
| 01-INV-1 | tests/negative-framing-scan.test.cjs | `'flags should not directive'` |
| 01-INV-1 | tests/negative-framing-scan.test.cjs | `'flags prohibited directive'` |
| 01-INV-1 | tests/negative-framing-scan.test.cjs | `'flags predicate-form forbidden directive'` |
| 01-INV-2 | tests/negative-framing-scan.test.cjs | `'return shape: result has violations and warnings buckets'` |
| 01-INV-2 | tests/negative-framing-scan.test.cjs | `'warns on cannot occurrence (warnings bucket, not violations)'` |
| 01-INV-2 | tests/negative-framing-scan.test.cjs | `'warns on won\'t occurrence'` |
| 01-INV-2 | tests/negative-framing-scan.test.cjs | `'warns on will not occurrence'` |
| 01-INV-3 | tests/negative-framing-scan.test.cjs | `'detects em-dash complement'` (hasPositiveComplement describe) |
| 01-INV-3 | tests/negative-framing-scan.test.cjs | `'detects "job is not to" reframe'` (isReframePattern describe) |
| 01-INV-3 | tests/negative-framing-scan.test.cjs | `'factual: "it is never called"'` (isFactualNever describe) |
| 01-INV-3 | tests/negative-framing-scan.test.cjs | `'directive: clause-initial "Avoid X"'` (isAvoidDirective describe) |
| 01-INV-3 | tests/negative-framing-scan.test.cjs | `'directive: predicate "X is forbidden"'` (isForbiddenDirective describe) |
| 01-INV-3 | tests/negative-framing-scan.test.cjs | `'factual: subject precedence "you don\'t know"'` (isFactualDont describe) |
| 01-INV-3 | tests/negative-framing-scan.test.cjs | `'conditional: starts with "If"'` (isConditionalOrFactual describe) |
| 01-INV-3 | tests/negative-framing-scan.test.cjs | `'does not flag factual never (adverb)'` |
| 01-INV-3 | tests/negative-framing-scan.test.cjs | `'does not flag NEVER in reframe pattern'` |
| 01-INV-3 | tests/negative-framing-scan.test.cjs | `'does not flag DO NOT with em-dash complement'` |
| 01-INV-3 | tests/negative-framing-scan.test.cjs | `'does not flag adjective-noun forbidden'` |
| 01-INV-4 | tests/negative-framing-scan.test.cjs | `'found prompt files to scan'` (asserts ALL_FILES.length > 0 across SCAN_DIRS) |
| 01-INV-5 | tests/negative-framing-scan.test.cjs | `'does not flag patterns inside fenced code blocks'` |
| 01-INV-5 | tests/negative-framing-scan.test.cjs | `'does not flag NEVER inside code block'` |
| 01-INV-5 | tests/negative-framing-scan.test.cjs | `'does not flag prohibited inside code block'` |
| 01-INV-5 | tests/negative-framing-scan.test.cjs | `'does not flag forbidden inside code block'` |

## Key Decisions

### (a) Two-tier severity — warn-only token membership (D-04)

The warn-only set (cannot, won't, will not) is fixed and intentionally separate from the
block set. These tokens appear in corpus files in contexts where a hard failure would be
overly strict (capability statements, conditional negations, factual descriptions of
system limitations). They surface as `result.warnings` — visible in test output via
`console.warn` — but never fail the run. The test decisions D-16 and D-17 (cannot),
D-19 and D-20 (won't), D-22 and D-23 (will not) record the rationale for each member.

**Settled — do not reopen.** Consequence of reopening: relocating a warn-only token to
the block set over-blocks legitimate corpus text; removing it from both sets loses the
soft-signal intent and ships the token silently without any visibility.

---

### (b) Affirmative-rewrite replacement rule (D-05)

When a negative directive is detected and the author remediates it, the negative directive
is replaced with an affirmative instruction that states the correct behavior — it is not
merely deleted or softened. This is a human-authoring standard, not a scanner behavior.
The scanner only flags occurrences; it does not rewrite. Because the test
`tests/negative-framing-scan.test.cjs` does not assert rewriting, a MUST invariant for
the rewrite rule would permanently require `[MISSING — write test first]` in the
Acceptance Tests table, which is incorrect here — the rule governs human authoring, not
scanner output. The standard is sourced from `CLAUDE.md` §"Positive framing replacement
rule" (tier-4 background).

**Settled — do not reopen.** Consequence of reopening: downgrading to bare deletion
loses the correct-behavior instruction that the affirmative replacement carries; the
author-facing signal degrades to "remove the bad phrase" with no guidance on what to
write instead, undermining the fork's quality bar.

---

### (c) Shape-normative, not count-normative (D-02)

The detection SHAPE is the normative contract: "a clause-start negative directive, minus
the exception classes, is flagged." The branch count (currently 12) and the explicit token
enumeration in 01-INV-1 are advisory supporting detail, marked `current as of 2026-06-12`.
Every upstream merge that adds a detection branch does not falsify the spec because the
count is not the contract.

**Settled — do not reopen.** Consequence of reopening: making the count normative causes
the traceability table to rot on every upstream merge that adds or removes a detection
branch, and the spec stops surviving the file-move and refactor conditions it is designed
to outlast.

## Code Context

<!-- advisory -->

The items below are current as of 2026-06-12. All file paths, function names, regex bodies,
and line numbers are advisory and will shift on any test edit or upstream refactor. No
normative invariant depends on these paths or symbols — a reimplementer rebuilds the scanner
from the behavioral contract in §Invariants and §Key Decisions above.

**Primary source file:**
- `tests/negative-framing-scan.test.cjs` — tier-1 normative source; 1425 lines. This file
  defines the scanner function, the exception predicates, and the full test suite.

**Scanner entry point:**
- `scanForNegativeFraming(content)` — the single scan function (lines 233–370 advisory).
  Takes a string, returns `{ violations, warnings }` with keys for each detection bucket.

**Scan directory set:**
- `SCAN_DIRS` constant (lines 34–39 advisory) — current values:
  - `'agents'`
  - `'get-shit-done/workflows'`
  - `'get-shit-done/references'`
  - `'commands/gsd'`

**File collection:**
- `collectMarkdownFiles(dir)` (lines 374–392 advisory) — recursive `.md` collector;
  silently skips ENOENT; re-throws other errors.

**Exception predicate functions** (advisory names; behavioral classes are normative):
- `hasPositiveComplement(line)` — paired-complement suppression (lines 63–76 advisory)
- `isReframePattern(line)` — reframe suppression (lines 84–87 advisory)
- `isFactualNever(line)` — factual-never suppression (lines 126–140 advisory)
- `isAvoidDirective(line)` — avoid-directive identification (lines 153–157 advisory)
- `isForbiddenDirective(line)` — forbidden-directive identification (lines 176–178 advisory)
- `isFactualDont(line)` — factual-dont suppression (lines 192–208 advisory)
- `isConditionalOrFactual(line)` — conditional-or-factual suppression (lines 96–114 advisory)

All line numbers are advisory and shift on any test edit.
