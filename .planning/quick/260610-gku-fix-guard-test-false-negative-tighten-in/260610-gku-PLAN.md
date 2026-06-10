---
phase: 260610-gku
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/no-issue-citations.test.cjs
  - agents/gsd-ai-researcher.md
autonomous: true
requirements:
  - GKU-01
must_haves:
  truths:
    - "D-01: TDD commit order is strict — Commit 1 adds failing unit test (RED), Commit 2 fixes regex (unit GREEN, corpus RED for gsd-ai-researcher.md), Commit 3 removes citation (all GREEN)"
    - "D-02: Lookbehind is removed entirely — INLINE_RE becomes /#(\\d+)\\b/g; hex colors are protected solely by frontmatter (D-09) and code-fence (D-10) exclusions"
    - "D-03: Executor MUST NOT run npm test as a gate between commits 1 and 2; only run npm test after Commit 3"
    - "D-04: Citation removal replaces prose with: '(some AI coding runtimes strip MCP tools from agents that declare a `tools:` frontmatter restriction)'"
    - "Unit test 'github-style citation: owner/repo#NNN is detected' exists in scanContent() inline citation detection describe block"
    - "After Commit 3, full npm test suite passes (all GREEN)"
  artifacts:
    - path: "tests/no-issue-citations.test.cjs"
      provides: "Updated INLINE_RE (no lookbehind), new owner/repo#NNN unit test, updated comments/JSDoc, updated corpus assertion error message"
    - path: "agents/gsd-ai-researcher.md"
      provides: "Line 26 prose without issue citation"
  key_links:
    - from: "tests/no-issue-citations.test.cjs INLINE_RE"
      to: "scanContent() inline citation detection"
      via: "regex match loop"
      pattern: "INLINE_RE.exec\\(line\\)"
---

<objective>
Fix the `INLINE_RE` false negative in `tests/no-issue-citations.test.cjs` that allowed
`anthropics/claude-code#13898` in `agents/gsd-ai-researcher.md:26` to escape detection.

Three atomic commits in strict TDD order:
1. Add failing unit test for `owner/repo#NNN` detection (corpus already GREEN, new unit test RED)
2. Remove the hex lookbehind from INLINE_RE; update comments/JSDoc/error message (unit test GREEN, corpus test for gsd-ai-researcher.md goes RED)
3. Replace the citation in gsd-ai-researcher.md:26 with non-citation prose (all tests GREEN)

Purpose: Tighten the guard test so future `owner/repo#NNN` citations cannot slip through, and eliminate the existing escape.
Output: Updated guard test (regex + new unit test + updated docs), updated agent prose; full test suite GREEN at end.
</objective>

<context>
!`cat .planning/STATE.md`
!`cat .planning/quick/260610-gku-fix-guard-test-false-negative-tighten-in/260610-gku-CONTEXT.md`

@tests/no-issue-citations.test.cjs
@agents/gsd-ai-researcher.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add failing unit test for owner/repo#NNN detection (RED)</name>
  <files>tests/no-issue-citations.test.cjs</files>
  <read_first>
    - tests/no-issue-citations.test.cjs (lines 188-221 — `scanContent() — inline citation detection` describe block)
  </read_first>
  <action>
    Add one new `test()` block inside the `describe('scanContent() — inline citation detection', ...)` block (per D-01 — TDD commit 1, must be RED before regex fix).

    Insert the test immediately after the existing `'INLINE_RE positive: #3097 produces one inline hit'` test (around line 196) so the related positive cases stay grouped:

    ```js
    test('github-style citation: owner/repo#NNN is detected', () => {
      const hits = scanContent('upstream bug anthropics/claude-code#13898 strips MCP tools');
      assert.equal(hits.length, 1, 'should detect one hit');
      assert.equal(hits[0].text, '#13898', 'text should be #13898');
      assert.equal(hits[0].category, 'inline', 'category should be inline');
    });
    ```

    Do NOT change INLINE_RE in this task. Do NOT modify any other code. Do NOT remove the citation in gsd-ai-researcher.md.

    Per D-03, do NOT run `npm test` as a verification gate at the end of this task — the new unit test is intentionally RED at this commit.

    Commit message: `test(260610-gku): add failing unit test for owner/repo#NNN detection`
  </action>
  <verify>
    <automated>grep -F "github-style citation: owner/repo#NNN is detected" tests/no-issue-citations.test.cjs &amp;&amp; grep -F "anthropics/claude-code#13898 strips MCP tools" tests/no-issue-citations.test.cjs</automated>
  </verify>
  <done>
    New unit test block present in `scanContent() — inline citation detection` describe.
    Test asserts hits.length === 1, text === '#13898', category === 'inline'.
    INLINE_RE unchanged (still has `(?<![0-9a-fA-F#])` lookbehind).
    gsd-ai-researcher.md unchanged.
    Commit created with subject `test(260610-gku): add failing unit test for owner/repo#NNN detection`.
  </done>
</task>

<task type="auto">
  <name>Task 2: Remove INLINE_RE lookbehind and update docs (unit GREEN, corpus RED)</name>
  <files>tests/no-issue-citations.test.cjs</files>
  <read_first>
    - tests/no-issue-citations.test.cjs (lines 1-72 — module JSDoc, allowlist comments, INLINE_RE definition)
    - tests/no-issue-citations.test.cjs (lines 113-122 — scanContent JSDoc)
    - tests/no-issue-citations.test.cjs (lines 251-267 — corpus describe block with assertion error message)
  </read_first>
  <action>
    Three edits in this single commit (per D-02 — lookbehind removed entirely; per D-01 — commit 2 of TDD sequence):

    1. **Regex change (line ~67):** Replace
       `const INLINE_RE = /(?<![0-9a-fA-F#])#(\d+)\b/g;`
       with
       `const INLINE_RE = /#(\d+)\b/g;`

    2. **Comment/JSDoc updates (lines ~14-32 module JSDoc, lines ~63-66 inline regex comment, lines ~113-122 scanContent JSDoc):** Update every reference to the D-11 hex lookbehind to reflect that the lookbehind is removed and hex colors are now protected solely by frontmatter (D-09) and code-fence (D-10) exclusions. Specifically:
       - In the module-level JSDoc allowlist policy section, remove or rewrite the `Hex color lookbehind` bullet so it explains hex colors are protected by frontmatter (D-09) and code-fence (D-10) exclusions only.
       - In the inline comment block immediately above `const INLINE_RE`, remove the lookbehind explanation and instead note: the regex matches any `#NNN` in non-frontmatter, non-code-fence prose; hex colors in prose are accepted as false positives by design (user preference: false positives over false negatives — supersedes D-11).
       - In the `scanContent()` JSDoc, change the line `Applies frontmatter exclusion (D-09), code-fence exclusion (D-10), hex lookbehind (D-11), and PLACEHOLDER_DIGITS allowlist (D-04).` to omit the `hex lookbehind (D-11)` clause.

    3. **Assertion error message update (line ~262-264 in the corpus describe block):** Update the `assert.deepStrictEqual(...)` failure message to read (per D-02 — guide agent judgment when corpus goes RED):
       ```
       `Citations in ${relPath}. If this is a hex color, move it to a code fence or add it to PLACEHOLDER_DIGITS with a comment explaining why. If it is an issue or PR citation, remove it.\n${enumerated}\nTo add an allowlist exemption: add the digit to PLACEHOLDER_DIGITS`
       ```

    Note: the existing hex exemption test (`'hex color exemption (D-11): #e8c170 produces zero hits'`) still passes because `#e8c170` starts with `#e`, not `#<digit>`, and `/#(\d+)\b/g` never matches it. Leave that test name as-is for traceability — the D-11 label still documents the decision history even though the lookbehind mechanism is gone.

    Do NOT modify gsd-ai-researcher.md in this task.

    Per D-03, do NOT run `npm test` as a verification gate at the end of this task — the corpus test for `agents/gsd-ai-researcher.md` is intentionally RED at this commit (citation still present).

    Commit message: `fix(260610-gku): remove INLINE_RE hex lookbehind to catch owner/repo#NNN`
  </action>
  <verify>
    <automated>grep -F "const INLINE_RE = /#(\\d+)\\b/g;" tests/no-issue-citations.test.cjs &amp;&amp; ! grep -F "(?<![0-9a-fA-F#])" tests/no-issue-citations.test.cjs &amp;&amp; grep -F "If this is a hex color, move it to a code fence" tests/no-issue-citations.test.cjs</automated>
  </verify>
  <done>
    `INLINE_RE` is exactly `/#(\d+)\b/g` (no lookbehind).
    No remaining `(?<![0-9a-fA-F#])` substring anywhere in the file.
    Module JSDoc, inline regex comment, and scanContent JSDoc no longer describe the hex lookbehind mechanism (D-11 mechanism description removed; D-11 label may remain on the existing hex test).
    Corpus assertion error message contains the new hex-color guidance phrasing.
    gsd-ai-researcher.md unchanged.
    Commit created with subject `fix(260610-gku): remove INLINE_RE hex lookbehind to catch owner/repo#NNN`.
  </done>
</task>

<task type="auto">
  <name>Task 3: Remove citation from gsd-ai-researcher.md and verify full suite GREEN</name>
  <files>agents/gsd-ai-researcher.md</files>
  <read_first>
    - agents/gsd-ai-researcher.md (lines 20-35 — Context7 fallback section containing the citation)
  </read_first>
  <action>
    Per D-04, replace the citation prose on line 26 of `agents/gsd-ai-researcher.md`.

    Current text (spans line 26 and continues to line 27):
    ```
    2. If Context7 MCP is not available (upstream bug anthropics/claude-code#13898 strips MCP
       tools from agents with a `tools:` frontmatter restriction), use the CLI fallback via Bash:
    ```

    New text (preserve indentation and surrounding structure; minimal change — only the parenthetical is rewritten):
    ```
    2. If Context7 MCP is not available (some AI coding runtimes strip MCP tools from agents
       that declare a `tools:` frontmatter restriction), use the CLI fallback via Bash:
    ```

    Per D-01 / D-03, this is the final commit of the TDD sequence — after this edit, the full test suite must be GREEN. Run `npm test 2>&1 | tee /tmp/gsd-test-output.txt` as the verification gate and confirm zero failures.

    Commit message: `docs(260610-gku): remove anthropics/claude-code citation from gsd-ai-researcher`
  </action>
  <verify>
    <automated>! grep -F "anthropics/claude-code#13898" agents/gsd-ai-researcher.md &amp;&amp; grep -F "some AI coding runtimes strip MCP tools from agents" agents/gsd-ai-researcher.md &amp;&amp; npm test 2>&amp;1 | tee /tmp/gsd-test-output.txt | grep -E "^# (pass|fail)" &amp;&amp; ! grep -E "^# fail [1-9]" /tmp/gsd-test-output.txt</automated>
  </verify>
  <done>
    `anthropics/claude-code#13898` no longer appears anywhere in `agents/gsd-ai-researcher.md`.
    Replacement prose `some AI coding runtimes strip MCP tools from agents that declare a \`tools:\` frontmatter restriction` is present on or near line 26.
    `npm test` exits 0 with zero failing tests (full GREEN), including the new `github-style citation: owner/repo#NNN is detected` unit test and the corpus test for `agents/gsd-ai-researcher.md`.
    Commit created with subject `docs(260610-gku): remove anthropics/claude-code citation from gsd-ai-researcher`.
  </done>
</task>

</tasks>

<verification>
After all three tasks complete:

1. Three commits on the current branch with subjects:
   - `test(260610-gku): add failing unit test for owner/repo#NNN detection`
   - `fix(260610-gku): remove INLINE_RE hex lookbehind to catch owner/repo#NNN`
   - `docs(260610-gku): remove anthropics/claude-code citation from gsd-ai-researcher`

2. `npm test 2>&1 | tee /tmp/gsd-test-output.txt` is fully GREEN (zero failures).

3. `grep -n "INLINE_RE" tests/no-issue-citations.test.cjs` shows the definition as `/#(\d+)\b/g` with no lookbehind.

4. `grep -F "anthropics/claude-code" agents/gsd-ai-researcher.md` returns nothing.

5. `grep -F "github-style citation: owner/repo#NNN is detected" tests/no-issue-citations.test.cjs` returns one hit (the new unit test).
</verification>

<success_criteria>
- Three atomic commits exist in the documented TDD order.
- `INLINE_RE` has no lookbehind; documentation references to the D-11 lookbehind mechanism are removed (D-11 label may remain on the existing hex exemption test).
- New unit test `github-style citation: owner/repo#NNN is detected` exists and passes.
- Existing hex exemption test still passes (mechanism is now D-09/D-10 exclusions, not the lookbehind).
- Citation `anthropics/claude-code#13898` no longer present in `agents/gsd-ai-researcher.md`; replacement prose matches D-04 exactly.
- Full `npm test` suite is GREEN after Commit 3.
- Executor did not run `npm test` as a gate after Task 1 or Task 2 (D-03).
</success_criteria>

<output>
Create `.planning/quick/260610-gku-fix-guard-test-false-negative-tighten-in/260610-gku-SUMMARY.md` when done.
</output>
