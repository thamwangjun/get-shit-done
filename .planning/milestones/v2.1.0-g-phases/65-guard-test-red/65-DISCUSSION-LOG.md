# Phase 65: Guard Test (RED) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-09
**Phase:** 65-guard-test-red
**Areas discussed:** Scanner reuse vs inline, Placeholder exemption, Failure output format

---

## Scanner Reuse vs Inline

| Option | Description | Selected |
|--------|-------------|----------|
| Import `scan-citations.cjs` | Reuse Phase 64 scanner in the guard test; single detection source of truth; couples tests/ to scripts/ | |
| Inline detection | Self-contained regex logic in the test itself; mirrors step-numbering-scan.test.cjs; no cross-directory dep | ✓ |

**User's choice:** Inline detection — and raised a further question: can `scan-citations.cjs` be removed entirely if the guard test replaces it?

**Notes:** User proposed removing `scripts/scan-citations.cjs` entirely and using `tests/no-issue-citations.test.cjs` as the single detection artifact. This also requires removing `tests/citation-scan.test.cjs` (673-line Phase 64 Nyquist test that imports the scanner). Both deletions are in scope for Phase 65 — agreed as "clean end state from day one."

---

## Placeholder Exemption

| Option | Description | Selected |
|--------|-------------|----------|
| Exact value allowlist `Set([1, 2, 45, 123])` | Surgical precision; catches #686; matches ALLOWED_INLINE_REFS pattern | ✓ |
| `\d{4+}` digit threshold | Only flag 4+ digit refs; misses #686 (real 3-digit citation) — fatal false negative | |
| File:line explicit skip set | Max precision but brittle on line number drift | |
| Context-aware detection | Distinguishes ordinal "the #1 cause" from issue refs; over-engineered for this corpus | |

**User's choice:** Exact value allowlist — `const PLACEHOLDER_DIGITS = new Set([1, 2, 45, 123])`

**Notes:** Advisor research confirmed `#45` doesn't appear in the corpus (hypothetical from CITE-05 requirements). `#1`/`#2` appear as ordinal references. `#686` at `chain.md:57` is a real 3-digit citation that the digit threshold would miss permanently — rejection of threshold approach was confirmed.

---

## Failure Output Format

| Option | Description | Selected |
|--------|-------------|----------|
| `file:line + matched text + surrounding line` | Full context; reviewer can judge allowlist candidates without opening files | ✓ |
| `file:line + matched text (category)` | Compact; CITE-04 satisfied; reviewer must open file for context | |

**User's choice:** file:line + matched text (category) + surrounding context line + allowlist hint

**Notes:** User specifically raised the upstream merge scenario — when upstream PRs introduce new citations, the failure message needs to communicate enough for a human/agent to decide "real citation or add to PLACEHOLDER_DIGITS." The final failure line "To add an allowlist exemption: add the digit to PLACEHOLDER_DIGITS" was added explicitly for this reviewability requirement.

---

## Claude's Discretion

- Test structure (describe/test layout, unit subtests per pattern, corpus subtest) — follow step-numbering-scan.test.cjs structure
- File collection helper implementation
- Exact RED count assertion approach (assert 0 violations vs assert specific count)

## Deferred Ideas

None — discussion stayed within phase scope.
