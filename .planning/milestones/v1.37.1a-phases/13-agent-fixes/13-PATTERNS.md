# Phase 13: Agent Fixes - Pattern Map

**Mapped:** 2026-04-22
**Files analyzed:** 4 (modified only — no new files)
**Analogs found:** 4 / 4 (self-referential: patterns are extracted from the files being edited)

---

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `agents/gsd-assumptions-analyzer.md` | prompt/agent | transform | Own `<rules>` block (lines 95-104) | exact — same file, positive framing style |
| `agents/gsd-code-fixer.md` | prompt/agent | request-response | Own surrounding step blocks (lines 130-139, 238-241, 341-346) | exact — same file, same block style |
| `agents/gsd-doc-verifier.md` | prompt/agent | transform | Own `<skip_rules>` block (lines 91-101) | exact — same file, list-header style |
| `agents/gsd-user-profiler.md` | prompt/agent | event-driven | Own `<step>` block structure (lines 78-89) | exact — same file, step-sentence style |

---

## Pattern Assignments

### `agents/gsd-assumptions-analyzer.md` — FRAMING-01 (line 111)

**Edit type:** Line replacement

**Current line 111 (violation):**
```markdown
- Do NOT generate more areas than the calibration tier specifies
```

**Style anchor — positive framing in `<rules>` block (lines 95-104):**
```markdown
<rules>
1. Every assumption MUST cite at least one file path as evidence.
2. Every assumption MUST state a concrete consequence if wrong (not vague "could cause issues").
3. Confidence levels must be honest -- use Uncertain or Inferred when evidence is thin, Confident only when evidence is solid.
4. Minimize Unclear items by reading more files before giving up.
5. Do NOT suggest scope expansion -- stay within the phase boundary.
6. Do NOT include implementation details (that's for the planner).
7. Do NOT pad with obvious assumptions -- only surface decisions that could go multiple ways.
8. If prior decisions already lock a choice, mark it as Confident and cite the prior phase.
</rules>
```

**Calibration tiers reference block (lines 39-56) — the block the rewrite must point to:**
```markdown
<calibration_tiers>
The calibration tier controls output shape. Follow the tier instructions exactly.

### full_maturity
- **Areas:** 3-5 assumption areas
...
### standard
- **Areas:** 3-4 assumption areas
...
### minimal_decisive
- **Areas:** 2-3 assumption areas
...
</calibration_tiers>
```

**Full surrounding context (lines 106-113):**
```markdown
<anti_patterns>
- Do NOT present output directly to user (main workflow handles presentation)
- Do NOT research beyond what the codebase contains (flag gaps in "Needs External Research")
- Do NOT use web search or external tools (you have Read, Bash, Grep, Glob only)
- Do NOT include time estimates or complexity assessments
- Do NOT generate more areas than the calibration tier specifies          ← LINE 111 (replace)
- Do NOT invent assumptions about code you haven't read -- read first, then form opinions
</anti_patterns>
```

**Replacement (D-01, locked):**
```markdown
- Keep area count within the tier limit defined in `<calibration_tiers>` above
```

**Scanner check:** Replacement contains no `do not`, `DO NOT`, or `NEVER`. Passes `/\bdo not\b/i`. Safe.

---

### `agents/gsd-code-fixer.md` — FRAMING-02 (line 138)

**Edit type:** Line replacement

**Current line 138 (violation):**
```markdown
- Do NOT skip the fix just because syntax checking is unavailable
```

**Surrounding block context (lines 135-139) — Tier 3 Fallback block:**
```markdown
**Tier 3: Fallback**
If no syntax checker is available for the file type (e.g., `.md`, `.sh`, obscure languages):
- Accept Tier 1 result
- Do NOT skip the fix just because syntax checking is unavailable    ← LINE 138 (replace)
- Proceed to commit if Tier 1 passed
```

**Style anchor — adjacent bullet at line 139 (positive imperative, bare verb phrase):**
```markdown
- Proceed to commit if Tier 1 passed
```

**Replacement (D-03, affirmative rewrite):**
```markdown
- Apply the fix even when syntax checking is unavailable
```

**Scanner check:** No `do not`, `DO NOT`, or `NEVER`. Safe.

---

### `agents/gsd-code-fixer.md` — FRAMING-03 (line 240)

**Edit type:** Line deletion (no replacement)

**Current lines 238-241 (violation at line 240):**
```markdown
If status is `"clean"` or `"skipped"`:
- Exit with message: "No issues to fix -- REVIEW.md status is {status}."
- Do NOT create REVIEW-FIX.md                                          ← LINE 240 (delete)
- Exit code 0 (not an error, just nothing to do)
```

**After deletion — expected shape:**
```markdown
If status is `"clean"` or `"skipped"`:
- Exit with message: "No issues to fix -- REVIEW.md status is {status}."
- Exit code 0 (not an error, just nothing to do)
```

**Rationale (D-02, locked):** The exit instruction already implies nothing is created. The bullet is redundant and its deletion leaves a well-formed two-bullet list.

**Post-edit verification:** Read lines 238-243 after edit to confirm no orphan blank line between the two remaining bullets.

---

### `agents/gsd-code-fixer.md` — FRAMING-04 (line 344)

**Edit type:** Line replacement

**Current line 344 (violation):**
```markdown
- Do NOT leave uncommitted changes
```

**Surrounding block context (lines 341-346) — commit-failure rollback block:**
```markdown
**If commit FAILS after successful edit:**
- Mark as "skipped: commit failed"
- Execute rollback_strategy to restore files to pre-fix state
- Do NOT leave uncommitted changes                                     ← LINE 344 (replace)
- Document commit error in skip reason
- Continue to next finding
```

**Style anchor — adjacent bullet at line 342 (imperative verb phrase):**
```markdown
- Mark as "skipped: commit failed"
```

**Replacement (D-03, affirmative rewrite):**
```markdown
- Commit all changes before continuing, or roll back if commit fails
```

**Scanner check:** No `do not`, `DO NOT`, or `NEVER`. Safe.

**Note on FRAMING-04 wording:** The surrounding block is already a rollback failure block, so the rollback has already been instructed at line 343. A tighter positive alternative that avoids redundancy with the surrounding bullets:
```markdown
- Restore all files to pre-fix state before continuing
```
Both options are valid. The planner chooses the one that best avoids redundancy with line 343 (`Execute rollback_strategy`). The key constraint is no "do not" phrase of any kind.

---

### `agents/gsd-doc-verifier.md` — FRAMING-05 (line 92)

**Edit type:** Line replacement

**Current line 92 (violation):**
```markdown
Do NOT verify the following:
```

**Surrounding block context (lines 91-101):**
```markdown
<skip_rules>
Do NOT verify the following:                                           ← LINE 92 (replace)

- **VERIFY markers**: Claims wrapped in `<!-- VERIFY: ... -->` ...
- **Quoted prose**: Claims inside quotation marks ...
- **Example prefixes**: Any claim immediately preceded by "e.g.", ...
...
</skip_rules>
```

**Style anchor — REQUIREMENTS.md sample phrasing (confirmed in RESEARCH.md):**
```
Skip verification for the following:
```

**Replacement (D-03, from REQUIREMENTS.md sample, locked wording):**
```markdown
Skip verification for the following:
```

**Scanner check:** No `do not`, `DO NOT`, or `NEVER`. Safe.

---

### `agents/gsd-user-profiler.md` — FRAMING-06 (line 88)

**Edit type:** Line replacement

**Current line 88 (violation):**
```markdown
Do not proceed to message analysis until the rubric is loaded.
```

**Surrounding step block context (lines 78-89):**
```markdown
<step name="load_rubric">
Read `get-shit-done/references/user-profiling.md` in full. Load and internalize:
- All 8 dimension definitions with their rating spectrums
- Signal patterns and detection heuristics per dimension
- Confidence scoring thresholds
- Evidence curation rules (combined Signal+Example format, up to 3 quotes per dimension, ~100 char quotes)
- Sensitive content exclusion patterns
- Recency weighting guidelines
- The exact output schema

Do not proceed to message analysis until the rubric is loaded.         ← LINE 88 (replace)
</step>
```

**Style anchor — REQUIREMENTS.md sample phrasing (confirmed in RESEARCH.md):**
```
Load the rubric fully before proceeding to message analysis.
```

**Replacement (D-03, affirmative sequencing gate):**
```markdown
Load the rubric fully before proceeding to message analysis.
```

**Scanner check:** No `do not`, `DO NOT`, or `NEVER`. Safe.

---

## Shared Patterns

### Affirmative Imperative Style
**Source:** `agents/gsd-assumptions-analyzer.md` `<rules>` block (lines 95-104) and `<calibration_tiers>` bullet lists (lines 43-55)
**Apply to:** All 5 replacement lines (FRAMING-01, -02, -04, -05, -06)

The consistent pattern throughout these files is a bare imperative verb phrase at the start of a bullet or sentence:
- "Keep area count within..."
- "Apply the fix even when..."
- "Skip verification for..."
- "Load the rubric fully before..."

No auxiliary preamble ("You should...", "Please..."). No modal hedging ("may", "might"). Direct imperative.

### Scanner Exemption Awareness
**Source:** `tests/negative-framing-scan.test.cjs` lines 15-23
**Apply to:** All replacements

The scanner flags `/\bdo not\b/i` with no positive complement. All replacements must contain zero instances of "do not", "Do NOT", "DO NOT", "do Not", or any capitalisation variant. They must also avoid bare `NEVER [verb]` directives. The replacements identified in this document satisfy both constraints.

### Edit Tool (not Write Tool) Constraint
**Source:** `13-RESEARCH.md` Anti-Patterns section
**Apply to:** All 4 files

Use the Edit tool for each targeted line. Using Write on these large files risks accidentally dropping unrelated content. Read the surrounding 5-10 lines before each edit to confirm the exact current text.

---

## No Analog Found

Not applicable. All 4 files are being modified in-place. The style analogs are drawn from within the same files (positive framing already present in `<rules>` and step blocks). No new files are created; no external code analogs are required.

---

## Metadata

**Analog search scope:** `agents/` directory (4 files read directly; no broader glob search needed — phase scope is exactly these 4 files)
**Files scanned:** 4 agent source files + 1 test file (`negative-framing-scan.test.cjs`)
**Pattern extraction date:** 2026-04-22
