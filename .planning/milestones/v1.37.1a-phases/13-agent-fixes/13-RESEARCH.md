# Phase 13: Agent Fixes - Research

**Researched:** 2026-04-22
**Domain:** Prompt engineering — positive framing rewrites in agent Markdown files
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 (FRAMING-01):** Rewrite `- Do NOT generate more areas than the calibration tier specifies` to reference the existing `<calibration_tiers>` block already defined above in the same file. Do NOT inline the tier counts — direct the reader to the block (e.g., "Keep area count within the tier limit defined in `<calibration_tiers>` above").
- **D-02 (FRAMING-03):** Delete the `- Do NOT create REVIEW-FIX.md` bullet entirely. It is redundant inside an exit block — the surrounding instruction already tells the agent to exit, which implies nothing is created.
- **D-03 (FRAMING-02, FRAMING-04, FRAMING-05, FRAMING-06):** Apply straightforward affirmative rewrites per REQUIREMENTS.md guidance:
  - FRAMING-02 (code-fixer:138): Positive instruction to always apply the fix regardless of syntax checker availability.
  - FRAMING-04 (code-fixer:344): Positive instruction to commit all changes before continuing (rollback context).
  - FRAMING-05 (doc-verifier:92): Replace list header with affirmative equivalent (e.g., "Skip verification for the following:").
  - FRAMING-06 (user-profiler:88): Positive sequencing gate — load the rubric before proceeding to message analysis.

### Claude's Discretion

- Exact wording for FRAMING-02, FRAMING-04, FRAMING-06 within the affirmative-instruction constraint — the user has not prescribed word-for-word text for these; follow the REQUIREMENTS guidance and keep language consistent with the surrounding file style.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FRAMING-01 | `agents/gsd-assumptions-analyzer.md:111` — bare `Do NOT generate more areas` replaced with positive instruction specifying the correct area count limit | Line 111 confirmed: `- Do NOT generate more areas than the calibration tier specifies`. Calibration tiers block is at lines 39-56. |
| FRAMING-02 | `agents/gsd-code-fixer.md:138` — bare `Do NOT skip the fix` replaced with positive instruction to always apply the fix regardless of syntax checker availability | Line 138 confirmed: `- Do NOT skip the fix just because syntax checking is unavailable`. Surrounding context: Tier 3 Fallback block, lines 135-145. |
| FRAMING-03 | `agents/gsd-code-fixer.md:240` — bare `Do NOT create REVIEW-FIX.md` replaced with positive exit instruction (deletion) | Line 240 confirmed: `- Do NOT create REVIEW-FIX.md`. Context: exit block when status is "clean" or "skipped", lines 238-242. Decision: delete the bullet entirely. |
| FRAMING-04 | `agents/gsd-code-fixer.md:344` — bare `Do NOT leave uncommitted changes` replaced with positive instruction to commit all changes before continuing | Line 344 confirmed: `- Do NOT leave uncommitted changes`. Context: commit-failure rollback block, lines 341-347. |
| FRAMING-05 | `agents/gsd-doc-verifier.md:92` — list header `Do NOT verify the following:` replaced with affirmative equivalent | Line 92 confirmed: `Do NOT verify the following:`. Context: `<skip_rules>` block header, lines 91-101. Replacement: "Skip verification for the following:" |
| FRAMING-06 | `agents/gsd-user-profiler.md:88` — bare `Do not proceed to message analysis` replaced with positive sequencing gate | Line 88 confirmed: `Do not proceed to message analysis until the rubric is loaded.`. Context: step block before `<step name="read_messages">`, lines 84-95. |
</phase_requirements>

---

## Summary

Phase 13 is a surgical text-editing pass over 4 agent files with 6 targeted line replacements (one is a deletion). The domain is prompt engineering style: converting bare negative directives ("do not X") to positive affirmative instructions ("do Y instead"). No new logic, no structural changes, and no new capabilities are introduced.

The test suite is the authoritative correctness gate. The `corpus scan — DO NOT primary directives (case-insensitive)` suite in `tests/negative-framing-scan.test.cjs` currently fails for agent files because these 6 violations exist. Each fixed line must no longer trigger the `scanForNegativeFraming()` scanner. A second gate — `tests/agent-frontmatter.test.cjs` — currently passes and must remain green; it validates YAML frontmatter integrity and is sensitive to accidental YAML corruption.

**Primary recommendation:** Edit exactly the 6 targeted lines using the Edit tool (not Write), verify each change does not introduce a new scanner violation, and confirm both test gates pass before the phase is complete.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Prompt text editing | Source files (agents/*.md) | — | Direct line edits; no runtime tier involved |
| Framing compliance verification | Test suite (node:test) | — | `negative-framing-scan.test.cjs` is the authoritative scanner |
| YAML integrity check | Test suite (node:test) | — | `agent-frontmatter.test.cjs` parses frontmatter after edits |

## Standard Stack

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Edit tool | — | Surgical line replacement in Markdown files | Sends diff only; prevents accidental full-file overwrites |
| node:test | Node.js built-in | Test runner for both test gates | Already in use project-wide; no install required |

### Supporting

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| Grep | — | Verify new line text after edit | Confirm the old "do not" phrase is gone |
| Read | — | Read surrounding context before editing | Required by CONTEXT.md canonical refs |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Edit tool | Write tool (full rewrite) | Write risks accidental corruption of unrelated file sections; Edit is safer for targeted changes |

## Architecture Patterns

### System Architecture Diagram

```
REQUIREMENTS.md
      |
      v (6 violation records with exact file:line)
      |
[Read surrounding context] --> Edit tool --> [modified agent file]
      |                                              |
      v                                              v
  CONTEXT.md                            node --test tests/negative-framing-scan.test.cjs
  (wording guidance)                    node --test tests/agent-frontmatter.test.cjs
                                                     |
                                           [PASS = phase complete]
                                           [FAIL = scanner found new violation or YAML broken]
```

### Recommended Project Structure

No new files. Edits are in-place within:
```
agents/
├── gsd-assumptions-analyzer.md   # line 111
├── gsd-code-fixer.md             # lines 138, 240, 344
├── gsd-doc-verifier.md           # line 92
└── gsd-user-profiler.md          # line 88
```

### Pattern 1: Affirmative Replacement

**What:** Replace a bare "Do NOT X" directive with a positive instruction stating what TO do.
**When to use:** FRAMING-01, FRAMING-02, FRAMING-04, FRAMING-05, FRAMING-06

```markdown
# Before (scanner flags this):
- Do NOT generate more areas than the calibration tier specifies

# After (scanner passes):
- Keep area count within the tier limit defined in `<calibration_tiers>` above
```

```markdown
# Before:
- Do NOT skip the fix just because syntax checking is unavailable

# After (example):
- Apply the fix even when syntax checking is unavailable
```

```markdown
# Before:
Do NOT verify the following:

# After:
Skip verification for the following:
```

```markdown
# Before:
Do not proceed to message analysis until the rubric is loaded.

# After (example):
Load the rubric fully before proceeding to message analysis.
```

### Pattern 2: Bullet Deletion (FRAMING-03)

**What:** Delete the line entirely — no replacement text.
**When to use:** When the surrounding instruction already makes the deleted line redundant.

```markdown
# Before (lines 238-242):
If status is `"clean"` or `"skipped"`:
- Exit with message: "No issues to fix -- REVIEW.md status is {status}."
- Do NOT create REVIEW-FIX.md
- Exit code 0 (not an error, just nothing to do)

# After:
If status is `"clean"` or `"skipped"`:
- Exit with message: "No issues to fix -- REVIEW.md status is {status}."
- Exit code 0 (not an error, just nothing to do)
```

### Anti-Patterns to Avoid

- **Inline tier count duplication (FRAMING-01):** Do not copy tier numbers into the replacement text. The locked decision (D-01) requires a reference to `<calibration_tiers>`, not an inline restatement.
- **Em-dash workaround:** Do not use the em-dash complement pattern ("Do NOT X — use Y") as a shortcut. The REQUIREMENTS.md out-of-scope note explicitly excludes this — the negative phrase must not remain.
- **Write tool for targeted edits:** Using the Write tool on large agent files risks accidentally dropping unrelated content. Use Edit.
- **Editing line numbers without reading context first:** Line numbers are approximate anchors. Always read 5-10 surrounding lines with the Read tool before editing to confirm exact current text.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Framing compliance check | Custom grep script | `tests/negative-framing-scan.test.cjs` | Already implements all exemption rules (conditional branches, factual adverbs, em-dash complements, code blocks) |
| YAML integrity check | Custom YAML parser | `tests/agent-frontmatter.test.cjs` | Already validates all frontmatter fields project-wide |

**Key insight:** Both test gates are already written and authoritative. The phase succeeds when they pass — no additional validation tooling is needed.

## Common Pitfalls

### Pitfall 1: Leaving a "do not" variant the scanner still catches

**What goes wrong:** Replacement text uses lowercase `do not` or a mixed-case form not exempted by `isConditionalOrFactual()` or `hasPositiveComplement()`.
**Why it happens:** The scanner matches `/\bdo not\b/i` case-insensitively, so all capitalizations are caught. Only lines with em-dash/double-dash complements, parenthetical complements, or same-line positive sentences escape.
**How to avoid:** Write fully affirmative replacements with no "do not" phrase of any kind. After editing, run `node --test tests/negative-framing-scan.test.cjs` and confirm 0 violations in agent files.
**Warning signs:** Test reports the old or new line as a violation after the edit.

### Pitfall 2: YAML frontmatter corruption from Edit tool misfire

**What goes wrong:** An Edit pattern accidentally modifies the YAML block at the top of a file (between `---` delimiters), causing `agent-frontmatter.test.cjs` to fail.
**Why it happens:** Edit tool uses string matching. If the old text appears in the frontmatter as well as the body, the wrong instance may be replaced.
**How to avoid:** Verify the old text only appears in the body (not frontmatter) by reading a few lines around line 1 before editing. The frontmatter in these files is standard and does not contain "do not" phrases.
**Warning signs:** `agent-frontmatter.test.cjs` fails after an edit that was otherwise correct.

### Pitfall 3: Reading line numbers as exact without verification

**What goes wrong:** Line numbers in REQUIREMENTS.md are correct at time of writing but may shift if the file was edited between research and implementation.
**Why it happens:** Line numbers are static metadata; file content is dynamic.
**How to avoid:** Before each edit, use Read with `offset` and `limit` to confirm the exact current text matches what is expected. Do not Edit based purely on line number.
**Warning signs:** Edit tool reports no match found.

### Pitfall 4: Introducing a NEVER directive during rewrite

**What goes wrong:** A replacement phrase contains `NEVER` (uppercase) as a directive (e.g., "Always apply the fix; NEVER skip it"), which is also caught by the corpus scan.
**Why it happens:** `NEVER` directives are caught by a separate scanner test (`corpus scan — NEVER primary directives`) that already passes.
**How to avoid:** Do not use uppercase `NEVER` in any replacement text. Use affirmative constructions only.
**Warning signs:** The NEVER corpus scan test, which currently passes, starts failing after an edit.

### Pitfall 5: FRAMING-03 deletion leaving a malformed list

**What goes wrong:** Deleting `- Do NOT create REVIEW-FIX.md` without checking line alignment leaves a blank line or disrupts the list structure.
**Why it happens:** The Edit tool replaces exact text; if the line has a trailing newline, the deletion may leave an extra blank line in the list.
**How to avoid:** After deletion, read lines 238-243 to confirm the list renders correctly (two bullets remaining, no orphan blank lines between them).
**Warning signs:** Unexpected blank line inside the exit block.

## Code Examples

Verified patterns from inspected source files:

### FRAMING-01: gsd-assumptions-analyzer.md:111

```markdown
# Source: agents/gsd-assumptions-analyzer.md lines 106-113 (verified 2026-04-22)
# Current (VIOLATION):
<anti_patterns>
...
- Do NOT generate more areas than the calibration tier specifies
...

# Replacement (D-01 locked decision):
- Keep area count within the tier limit defined in `<calibration_tiers>` above
```

### FRAMING-03: gsd-code-fixer.md:240

```markdown
# Source: agents/gsd-code-fixer.md lines 238-242 (verified 2026-04-22)
# Current:
If status is `"clean"` or `"skipped"`:
- Exit with message: "No issues to fix -- REVIEW.md status is {status}."
- Do NOT create REVIEW-FIX.md
- Exit code 0 (not an error, just nothing to do)

# After deletion (D-02 locked decision):
If status is `"clean"` or `"skipped"`:
- Exit with message: "No issues to fix -- REVIEW.md status is {status}."
- Exit code 0 (not an error, just nothing to do)
```

### FRAMING-05: gsd-doc-verifier.md:92

```markdown
# Source: agents/gsd-doc-verifier.md lines 91-92 (verified 2026-04-22)
# Current:
<skip_rules>
Do NOT verify the following:

# Replacement (sample wording from REQUIREMENTS.md):
<skip_rules>
Skip verification for the following:
```

### FRAMING-06: gsd-user-profiler.md:88

```markdown
# Source: agents/gsd-user-profiler.md line 88 (verified 2026-04-22)
# Current:
Do not proceed to message analysis until the rubric is loaded.

# Replacement (positive sequencing gate per D-03):
Load the rubric fully before proceeding to message analysis.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Bare "do not" as directive | Affirmative "do X" instruction | v1.37.1a milestone | Model follows positive instructions more reliably; scanner passes |

**Deprecated/outdated:**
- Bare `Do NOT X` directives in agent `<anti_patterns>` and `<rules>` blocks: replaced by positive alternatives.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Line numbers in REQUIREMENTS.md match current file content (no edits since 2026-04-22) | Code Examples | Edit tool finds no match; task fails silently |

**All other claims in this research were directly verified by reading the source files.**

## Open Questions

None. All 6 violations confirmed in source. All decisions locked in CONTEXT.md. Scanner logic verified in test file. No ambiguities remain for planning.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| node:test | Test gate | Yes | Node.js built-in | — |
| npm test script | CI gate | Yes | See package.json | `node --test tests/agent-frontmatter.test.cjs` |

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | node:test (built-in) |
| Config file | none (direct node --test invocation) |
| Quick run command | `node --test tests/agent-frontmatter.test.cjs` |
| Full suite command | `npm test -- --test-name-pattern="agent-frontmatter"` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FRAMING-01 | Line 111 no longer matches DO NOT scanner | corpus scan | `node --test tests/negative-framing-scan.test.cjs` | Yes |
| FRAMING-02 | Line 138 no longer matches DO NOT scanner | corpus scan | `node --test tests/negative-framing-scan.test.cjs` | Yes |
| FRAMING-03 | Line 240 deleted; no "Do NOT create" remains | corpus scan | `node --test tests/negative-framing-scan.test.cjs` | Yes |
| FRAMING-04 | Line 344 no longer matches DO NOT scanner | corpus scan | `node --test tests/negative-framing-scan.test.cjs` | Yes |
| FRAMING-05 | Line 92 no longer matches DO NOT scanner | corpus scan | `node --test tests/negative-framing-scan.test.cjs` | Yes |
| FRAMING-06 | Line 88 no longer matches DO NOT scanner | corpus scan | `node --test tests/negative-framing-scan.test.cjs` | Yes |
| (gate) | YAML frontmatter intact after all edits | structural | `node --test tests/agent-frontmatter.test.cjs` | Yes |

### Sampling Rate

- **Per task commit:** `node --test tests/agent-frontmatter.test.cjs`
- **Per wave merge:** `node --test tests/negative-framing-scan.test.cjs && node --test tests/agent-frontmatter.test.cjs`
- **Phase gate:** Both test files green before `/gsd-verify-work`

### Wave 0 Gaps

None — existing test infrastructure covers all phase requirements.

## Security Domain

Not applicable. This phase performs text edits to Markdown prompt files only. No authentication, session management, input validation, cryptography, or access control is involved.

## Sources

### Primary (HIGH confidence)
- `agents/gsd-assumptions-analyzer.md` lines 39-56, 95-113 — calibration_tiers block and anti_patterns block containing FRAMING-01 violation; read directly 2026-04-22 [VERIFIED: local file read]
- `agents/gsd-code-fixer.md` lines 130-148, 233-245, 339-351 — all three FRAMING-02/03/04 violation contexts; read directly 2026-04-22 [VERIFIED: local file read]
- `agents/gsd-doc-verifier.md` lines 85-101 — skip_rules block containing FRAMING-05 violation; read directly 2026-04-22 [VERIFIED: local file read]
- `agents/gsd-user-profiler.md` lines 82-95 — step block containing FRAMING-06 violation; read directly 2026-04-22 [VERIFIED: local file read]
- `tests/negative-framing-scan.test.cjs` — full file read; scanner logic, SCAN_DIRS, exemption rules, and corpus test structure all verified 2026-04-22 [VERIFIED: local file read]
- `tests/agent-frontmatter.test.cjs` — lines 1-60 read; confirms test currently passes (0 failures), validates YAML fields for all agents [VERIFIED: local file read + test run]
- `.planning/REQUIREMENTS.md` — FRAMING-01 through FRAMING-06 with exact line numbers and fix descriptions [VERIFIED: local file read]
- `.planning/phases/13-agent-fixes/13-CONTEXT.md` — locked decisions D-01, D-02, D-03 [VERIFIED: local file read]
- Test run output — `node --test tests/agent-frontmatter.test.cjs` returned 1 pass, 0 fail; `no bare DO NOT directives in agent files` currently fails with 6+ violations confirming pre-edit state [VERIFIED: bash execution 2026-04-22]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no external libraries; only built-in node:test and existing project test files
- Architecture: HIGH — all file paths and line contexts verified by direct file reads
- Pitfalls: HIGH — derived from scanner logic read directly from test file

**Research date:** 2026-04-22
**Valid until:** 2026-05-22 (stable Markdown files; validity window ends if agent files are edited by other phases before this phase executes)
