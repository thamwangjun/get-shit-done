---
phase: 260610-heg
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/no-issue-citations.test.cjs
autonomous: true
requirements:
  - REFACTOR-ALLOWLIST-01
must_haves:
  truths:
    - "PLACEHOLDER_DIGITS contains only illustrative placeholders {1, 2, 45, 123}"
    - "FILE_ALLOWLIST maps each of the three known functional cross-ref files to its exact required digit set"
    - "scanContent() receives relPath from the corpus loop and applies both tiers when filtering"
    - "Functional cross-refs are only allowlisted in the specific files that require them — they are NOT globally exempt"
    - "npm test passes green after the refactor"
  artifacts:
    - path: "tests/no-issue-citations.test.cjs"
      provides: "Two-tier allowlist guard (global placeholders + per-file functional cross-refs)"
      contains: "FILE_ALLOWLIST"
  key_links:
    - from: "corpus describe block loop"
      to: "scanContent()"
      via: "relPath argument"
      pattern: "scanContent\\(content, relPath\\)"
    - from: "INLINE_RE skip logic in scanContent()"
      to: "FILE_ALLOWLIST[relPath]"
      via: "optional-chained Set.has() check"
      pattern: "FILE_ALLOWLIST\\[relPath\\]\\?\\.has"
---

<objective>
Refactor the allowlist in `tests/no-issue-citations.test.cjs` from a single global Set into a two-tier structure: a slimmed-down global `PLACEHOLDER_DIGITS` for illustrative placeholders (1, 2, 45, 123) and a new `FILE_ALLOWLIST` map keyed by relPath for functional cross-references that should only be exempt in the specific files that need them.

Purpose: Tighten the guard — currently #1729, #2439, #2924, and #3542 are globally exempt because they happen to be functional cross-refs in three files. This means new accidental citations of those numbers anywhere in the corpus would slip through. The two-tier structure restricts each functional exemption to the exact file(s) that need it.

Output: Modified `tests/no-issue-citations.test.cjs` with two-tier allowlist, updated `scanContent(content, relPath)` signature, updated JSDoc / inline comments, and a green `npm test`.
</objective>

<context>
!`cat .planning/STATE.md`
!`cat tests/no-issue-citations.test.cjs`
</context>

<tasks>

<task type="auto">
  <name>Task 1: Refactor allowlist to two-tier structure</name>
  <files>tests/no-issue-citations.test.cjs</files>
  <read_first>tests/no-issue-citations.test.cjs</read_first>
  <action>
Modify `tests/no-issue-citations.test.cjs` with the following coordinated edits:

1. **Slim `PLACEHOLDER_DIGITS`** — change from
   `new Set([1, 2, 45, 123, 1729, 2439, 2924, 3542])`
   to
   `new Set([1, 2, 45, 123])`.
   This Set is now strictly for illustrative placeholders used as examples in prompt content.

2. **Add `FILE_ALLOWLIST`** immediately after `PLACEHOLDER_DIGITS`:
   ```js
   // Per-file functional cross-reference allowlist. These digits are exempt ONLY in the
   // specific files listed — they remain flagged anywhere else in the corpus. Each entry
   // is a functional cross-reference validated by another test file; the comment names
   // the test that guarantees the citation's continued presence.
   const FILE_ALLOWLIST = {
     // #2439 — gsd-sdk pre-flight guard contract (bug-2439-set-profile-gsd-sdk-preflight.test.cjs)
     'commands/gsd/config.md':                           new Set([2439]),
     // #1729 — explore-integration deferral decision (thinking-partner.test.cjs)
     'get-shit-done/references/thinking-partner.md':     new Set([1729]),
     // #2924 — worktree HEAD attachment safety ref (worktree-cleanup.test.cjs)
     // #3542 — executor git stash prohibition (bug-3542-executor-git-stash-prohibition.test.cjs)
     'agents/gsd-executor.md':                           new Set([2924, 3542]),
   };
   ```
   Keep the alignment shown above (the colons line up) — it matches the file's existing style for table-like constants.

3. **Update `scanContent()` signature and inline-skip logic**:
   - Change function declaration from `function scanContent(content) {` to `function scanContent(content, relPath) {`.
   - Update JSDoc: add `@param {string} [relPath] - File path relative to PROJECT_ROOT (used to look up file-scoped allowlist; optional for unit tests scanning string literals)`.
   - Inside the `INLINE_RE` while-loop, change the existing skip line
     `if (PLACEHOLDER_DIGITS.has(digit)) continue;`
     to
     `if (PLACEHOLDER_DIGITS.has(digit) || FILE_ALLOWLIST[relPath]?.has(digit)) continue;`
   - Leave the `FEAT_FORM_RE` block unchanged (feat-form citations are not part of either tier).

4. **Update the corpus describe block** so the loop passes `relPath` into the scanner:
   change `const hits = scanContent(content);` to `const hits = scanContent(content, relPath);`.
   The `relPath` variable is already defined one line above as the loop-scoped `path.relative(...)` result.

5. **Update the module-level JSDoc header** (lines 20–32 area, the `Allowlist policy:` block). Replace the current PLACEHOLDER_DIGITS description with a two-tier description:
   - `PLACEHOLDER_DIGITS`: global Set of illustrative placeholder integers (#1, #2, #45, #123) used as examples in prompt content. Exempt everywhere in the corpus.
   - `FILE_ALLOWLIST`: per-file map of relPath → Set of functional cross-reference digits. Each entry is validated by another test file that requires the citation's continued presence; the digit is exempt only in the listed file(s) and remains a violation anywhere else.
   Keep the existing frontmatter (D-09), code-fence (D-10), and hex-color notes intact.

6. **Delete the redundant pre-PLACEHOLDER_DIGITS comment block** (the comment lines from `// Allowlist of illustrative placeholder digits per Phase 64 FINDINGS Allowlist Candidates table.` through `//   #3542 — executor git stash prohibition (bug-3542-executor-git-stash-prohibition.test.cjs)` immediately above the const declaration). Replace it with a tight 2-line comment:
   ```
   // Tier 1: global allowlist of illustrative placeholder digits used as examples
   // in prompt content. Functional cross-refs live in FILE_ALLOWLIST below.
   ```
   The module-level JSDoc (updated in step 5) is the source of truth for the policy.

After edits, do not touch the regex constants, the file collection block, the unit test bodies (they all call `scanContent(literal)` without a relPath, which is fine — `FILE_ALLOWLIST[undefined]?.has(...)` resolves to `undefined`, the optional-chain short-circuits, and the `||` falls through to leave only the `PLACEHOLDER_DIGITS` check, preserving every existing unit test's behavior).
  </action>
  <verify>
    <automated>npm test 2>&amp;1 | tee /tmp/gsd-test-output.txt | tail -50</automated>
  </verify>
  <done>
- `PLACEHOLDER_DIGITS` declaration reads exactly `new Set([1, 2, 45, 123])`
- `FILE_ALLOWLIST` const is defined immediately after `PLACEHOLDER_DIGITS` with the three keyed entries shown
- `scanContent` signature is `function scanContent(content, relPath)` and JSDoc reflects the new param
- Inline skip line reads `if (PLACEHOLDER_DIGITS.has(digit) || FILE_ALLOWLIST[relPath]?.has(digit)) continue;`
- Corpus describe block calls `scanContent(content, relPath)` (relPath is the existing loop variable)
- Module-level JSDoc `Allowlist policy:` section documents both tiers
- `npm test` exits 0 (all unit tests and corpus tests pass green)
  </done>
</task>

</tasks>

<verification>
- `grep -nE "new Set\(\[1, 2, 45, 123\]\)" tests/no-issue-citations.test.cjs` returns exactly one match.
- `grep -nE "FILE_ALLOWLIST\[relPath\]\?\.has\(digit\)" tests/no-issue-citations.test.cjs` returns exactly one match (in the inline skip).
- `grep -nE "scanContent\(content, relPath\)" tests/no-issue-citations.test.cjs` returns exactly one match (in the corpus loop).
- `grep -nE "'commands/gsd/config\.md':\s+new Set\(\[2439\]\)" tests/no-issue-citations.test.cjs` returns one match.
- `grep -nE "'get-shit-done/references/thinking-partner\.md':\s+new Set\(\[1729\]\)" tests/no-issue-citations.test.cjs` returns one match.
- `grep -nE "'agents/gsd-executor\.md':\s+new Set\(\[2924, 3542\]\)" tests/no-issue-citations.test.cjs` returns one match.
- `npm test` exits 0.
</verification>

<success_criteria>
- Two-tier allowlist is in place: `PLACEHOLDER_DIGITS` slimmed to {1, 2, 45, 123}; `FILE_ALLOWLIST` introduced with three file-scoped entries.
- `scanContent()` accepts `relPath` and applies both tiers in its inline-skip check.
- The corpus describe block threads `relPath` into the call.
- JSDoc and inline comments document the two-tier structure.
- `npm test` is green — all unit tests and all corpus tests pass, confirming the refactor preserves behavior for the three files that need functional cross-refs while tightening the guard everywhere else.
</success_criteria>

<output>
Modified file: `tests/no-issue-citations.test.cjs`
</output>
