---
phase: quick
plan: 260529-inw
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/quick/260529-inw-compare-test-suite-of-current-branch-vs-/ANALYSIS.md
autonomous: true
requirements: []

must_haves:
  truths:
    - "ANALYSIS.md exists in the quick task directory with findings"
    - "File structure diff is captured (added/removed/renamed test files between HEAD and 13c64e02)"
    - "Test case content diff is captured (describe/it blocks changed within shared test files)"
    - "Upstream ref is fetched before comparison"
  artifacts:
    - path: ".planning/quick/260529-inw-compare-test-suite-of-current-branch-vs-/ANALYSIS.md"
      provides: "Full analysis of test suite differences"
  key_links: []
---

<objective>
Compare the test suite of the current branch (HEAD) against upstream v1.01.0 commit 13c64e02999a41e180fa498085a4ac4674077a2d. Produce a structured ANALYSIS.md covering both dimensions:

1. File structure differences — which test files were added, removed, or renamed relative to upstream
2. Test case content differences — which describe/it blocks changed within files that exist in both branches

Purpose: Give the developer a clear picture of how the fork's test suite has diverged from upstream v1.01.0, to inform future merge and maintenance decisions.

Output: .planning/quick/260529-inw-compare-test-suite-of-current-branch-vs-/ANALYSIS.md
</objective>

<tasks>

<task type="auto">
  <name>Task 1: Fetch upstream ref and capture file structure diff</name>
  <files>.planning/quick/260529-inw-compare-test-suite-of-current-branch-vs-/ANALYSIS.md</files>
  <action>
Run the following steps in sequence:

1. Fetch the upstream remote to ensure the target commit is locally available:
   git fetch upstream 2>/dev/null || git fetch origin

2. Verify the upstream commit is reachable:
   git cat-file -t 13c64e02999a41e180fa498085a4ac4674077a2d
   (If the commit is not found after fetching upstream, also try: git fetch --all)

3. Capture file structure diff — test files only (tests/*.test.cjs pattern):

   a) Files in HEAD but NOT in upstream (added by fork):
      git diff --name-status --diff-filter=A 13c64e02999a41e180fa498085a4ac4674077a2d HEAD -- 'tests/*.test.cjs'

   b) Files in upstream but NOT in HEAD (removed by fork):
      git diff --name-status --diff-filter=D 13c64e02999a41e180fa498085a4ac4674077a2d HEAD -- 'tests/*.test.cjs'

   c) Files renamed between upstream and HEAD:
      git diff --name-status --diff-filter=R 13c64e02999a41e180fa498085a4ac4674077a2d HEAD -- 'tests/*.test.cjs'

4. Capture test case content diff for files that exist in BOTH branches:
   Get the list of files modified (not added/deleted/renamed) in tests/:
   git diff --name-only --diff-filter=M 13c64e02999a41e180fa498085a4ac4674077a2d HEAD -- 'tests/*.test.cjs'

   For each modified file, extract describe/it/test block changes using:
   git diff 13c64e02999a41e180fa498085a4ac4674077a2d HEAD -- <file> | grep -E '^[+-].*\b(describe|it|test)\s*\(' | head -80

   Also capture full diff stats:
   git diff --stat 13c64e02999a41e180fa498085a4ac4674077a2d HEAD -- 'tests/*.test.cjs'

5. Write all findings to ANALYSIS.md with sections:
   - Summary (counts: files added, removed, renamed, modified)
   - Added Test Files (list with brief description from filename)
   - Removed Test Files (list)
   - Renamed Test Files (before → after)
   - Modified Test Files — Content Changes (per-file describe/it block diff)
   - Observations (notable patterns, what the changes indicate about fork divergence)
  </action>
  <verify>
    <automated>test -f .planning/quick/260529-inw-compare-test-suite-of-current-branch-vs-/ANALYSIS.md && echo "ANALYSIS.md exists" && command grep -l "Added Test Files" .planning/quick/260529-inw-compare-test-suite-of-current-branch-vs-/ANALYSIS.md</automated>
  </verify>
  <done>ANALYSIS.md exists containing all four diff categories (added, removed, renamed, modified) plus an Observations section. The file is human-readable and references specific test file names and describe/it block changes.</done>
</task>

</tasks>

<verification>
test -f .planning/quick/260529-inw-compare-test-suite-of-current-branch-vs-/ANALYSIS.md
</verification>

<success_criteria>
ANALYSIS.md written with complete test suite comparison: file structure diff (added/removed/renamed) and test case content diff (describe/it blocks) between HEAD and upstream 13c64e02. No code changes made — read-only analysis only.
</success_criteria>

<output>
Create .planning/quick/260529-inw-compare-test-suite-of-current-branch-vs-/ANALYSIS.md
</output>
