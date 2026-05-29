---
phase: quick
plan: 260529-dxz
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/REQUIREMENTS.md
  - .planning/phases/46-regression-test-suite/46-VERIFICATION.md
autonomous: true
requirements: [INTG-01, INTG-02, TEST-02]

must_haves:
  truths:
    - "REQUIREMENTS.md INTG-01 describes actual default <%/%> delimiters — no mention of {%/%} or parse.raw"
    - "REQUIREMENTS.md INTG-02 references <%~ include( tags — not {%~ include("
    - "46-VERIFICATION.md Gaps Summary contains a post-resolution note clarifying TEST-02 deviation is intentional and accepted"
  artifacts:
    - path: ".planning/REQUIREMENTS.md"
      provides: "Accurate INTG-01 and INTG-02 requirement descriptions"
      contains: "<%`/`%>"
    - path: ".planning/phases/46-regression-test-suite/46-VERIFICATION.md"
      provides: "Phase 46 verification report with resolved-gap annotation"
      contains: "intentional"
  key_links:
    - from: ".planning/REQUIREMENTS.md INTG-01"
      to: "bin/install.js Eta constructor"
      via: "delimiter description matches live code"
      pattern: "<%.*%>"
---

<objective>
Fix documentation-vs-implementation mismatches accumulated across Phase 45 and Phase 46.

Purpose: Keep planning artifacts accurate so future readers and auditors are not misled by
stale delimiter descriptions or unexplained approach deviations.

Output:
- REQUIREMENTS.md INTG-01 and INTG-02 corrected to reflect actual `<%`/`%>` default delimiters
- 46-VERIFICATION.md Gaps Summary annotated with a post-resolution note on TEST-02 deviation
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/REQUIREMENTS.md
@.planning/phases/46-regression-test-suite/46-VERIFICATION.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Correct INTG-01 and INTG-02 delimiter descriptions in REQUIREMENTS.md</name>
  <files>.planning/REQUIREMENTS.md</files>
  <action>
    Edit REQUIREMENTS.md lines 24-25 to replace the wrong `{%`/`%}` delimiter references with the actual
    default `<%`/`%>` delimiters that the live code uses.

    Line 24 (INTG-01) currently reads:
      "a module-level Eta instance configured with `{%`/`%}` delimiters, `autoEscape: false`,
      `useWith: true`, and `views` = repo root exists in `bin/install.js`"

    Replace with:
      "a module-level Eta instance configured with default `<%`/`%>` delimiters (no `tags:` or
      `parse.raw:` overrides), `autoEscape: false`, `useWith: true`, and `views` = repo root
      exists in `bin/install.js`"

    Line 25 (INTG-02) currently reads:
      "converted to `{%~ include('get-shit-done/X') %}` Eta tags"

    Replace with:
      "converted to `<%~ include('get-shit-done/X') %>` Eta tags"

    No other lines require changes. The 45-05-PLAN.md artifact gap was already resolved in
    quick task 260529-c7a (committed at 541b79f2).
  </action>
  <verify>
    <automated>command grep -c "{%" /home/thamw/development/remote-dev/get-shit-done/.planning/REQUIREMENTS.md || true</automated>
  </verify>
  <done>
    REQUIREMENTS.md contains zero `{%` occurrences. INTG-01 description reads "default `&lt;%`/`%>`
    delimiters" and INTG-02 references `&lt;%~ include(` tags.
  </done>
</task>

<task type="auto">
  <name>Task 2: Annotate Phase 46 VERIFICATION.md Gaps Summary with post-resolution note</name>
  <files>.planning/phases/46-regression-test-suite/46-VERIFICATION.md</files>
  <action>
    The Gaps Summary section (lines 106-119) documents two gaps that existed at initial
    verification. Both were resolved by scope decisions before the milestone closed. Add a
    post-resolution annotation block immediately after the existing gap descriptions and before
    the closing `---` separator.

    Append the following block after line 118 (after the TEST-06 paragraph), before the `---`:

    ```
    ---

    ### Post-Resolution Notes (added 2026-05-29)

    **Gap 1 resolved:** TEST-03 (Copilot tool-name transformation) formally deferred to a future
    milestone. REQUIREMENTS.md marks it `[x] ~~TEST-03~~` with rationale; ROADMAP.md updated to
    reflect 5 tests and deferred scope. The gap is accepted scope — not an outstanding deficit.

    **Gap 2 resolved:** TEST-06 drop reflected in REQUIREMENTS.md (`~~TEST-06~~` with D-11 rationale)
    and ROADMAP.md. Tracking artifact integrity gap closed.

    **TEST-02 approach deviation (intentional):** TEST-02 renders `execute-phase.md` via
    `renderEtaContent` on the source file directly rather than via a full `installRuntimeArtifacts`
    call (the ROADMAP SC #2 specification). This deviation is intentional and accepted — the
    behavioral intent (confirming Eta does not corrupt the `${}` conditional expression) is fully
    met by the source-file rendering approach. No code change is needed or desired; this note
    records that the deviation is a deliberate implementation choice, not an oversight.
    ```
  </action>
  <verify>
    <automated>command grep -c "intentional" /home/thamw/development/remote-dev/get-shit-done/.planning/phases/46-regression-test-suite/46-VERIFICATION.md</automated>
  </verify>
  <done>
    46-VERIFICATION.md contains the post-resolution annotation section. The TEST-02 deviation
    is documented as intentional. `grep -c "intentional"` returns >= 1.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| planning artifacts | Markdown files read by humans and agents — no external trust boundary |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-dxz-01 | Tampering | .planning/REQUIREMENTS.md | accept | Documentation-only edits; no code paths affected; reviewed by human on commit |
</threat_model>

<verification>
1. `command grep -c "{%" .planning/REQUIREMENTS.md` returns 0
2. `command grep "<%\`/\`%>" .planning/REQUIREMENTS.md` matches INTG-01 line
3. `command grep "<%~ include" .planning/REQUIREMENTS.md` matches INTG-02 line
4. `command grep -c "intentional" .planning/phases/46-regression-test-suite/46-VERIFICATION.md` returns >= 1
</verification>

<success_criteria>
- REQUIREMENTS.md INTG-01 and INTG-02 accurately describe the live Eta delimiter configuration (`<%`/`%>` defaults)
- 46-VERIFICATION.md Gaps Summary contains a post-resolution annotation explaining that both gaps were closed by scope decisions and that the TEST-02 approach deviation is intentional
- No test code, source code, or executable behavior is changed
</success_criteria>

<output>
Create `.planning/quick/260529-dxz-address-phase-45-and-phase-46-tech-debts/260529-dxz-SUMMARY.md` when done
</output>
