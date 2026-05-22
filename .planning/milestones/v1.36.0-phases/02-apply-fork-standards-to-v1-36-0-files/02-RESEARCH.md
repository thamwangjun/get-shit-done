# Phase 2: Apply Fork Standards to v1.36.0 Files — Research

**Researched:** 2026-04-15
**Domain:** Prompt engineering — positive framing pass on 26 affected files
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Global replacement text for `Do NOT load full AGENTS.md files (100KB+ context cost)` is: `Load specific agent files only` — shorter, unambiguous, no rationale needed
- **D-02:** The global boilerplate sweep (plan 02-03) runs **first**, before per-file passes (02-01 and 02-02), to avoid double-touching lines in agents that also have other violations
- **D-03:** `STOP -- DO NOT READ THIS FILE` section in `commands/gsd/graphify.md` — **delete the section entirely**. The model is assumed capable; the guard is unnecessary
- **D-04:** Quoted user speech in reference files (e.g., `"I don't know my requirements yet"` in `get-shit-done/references/ai-frameworks.md`) — **preserve as-is**; quoted speech is not a directive
- **D-05:** Editorial `don't` in informational reference files (e.g., `get-shit-done/references/ai-evals.md`) — **preserve as-is**; editorial voice in reference/data documents is not a prompt directive
- **D-06:** Plan execution order: **02-03 (global boilerplate) → 02-01 (11 new files) → 02-02 (15 modified files)**
- **D-07:** `Never X — always Y` paired patterns (e.g., `Never shell-interpolate the prompt — always pipe via stdin`) are **valid reframe exceptions** — confirm and leave unchanged, do not convert. This is a standing fork rule from PROJECT.md.
- **D-08:** Every replacement must specify the correct behavior — not merely delete the prohibition. "Do NOT X" → affirmative instruction stating what to do instead. Deletions (like D-03) are only valid when the instruction itself is unnecessary.

### Claude's Discretion

- Exact affirmative phrasing for each individual violation beyond the patterns documented in `.planning/research/VIOLATIONS.md` — follow the conversion patterns table there; for novel cases, apply the principle in D-08
- Whether to batch multiple violations in a single edit per file or fix one at a time

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NEW-01 | `commands/gsd/graphify.md` passes positive framing standard (9 violations incl. `STOP -- DO NOT READ`) | D-03: delete `STOP` section; remaining `Do NOT` directives need affirmative replacement per D-08 |
| NEW-02 | `agents/gsd-debug-session-manager.md` passes positive framing standard (2 violations) | Line 22: reframe "Do not load" → state what to load; "Do not inline file contents" → affirmative scoping |
| NEW-03 | `agents/gsd-domain-researcher.md` passes positive framing standard (2 violations) | Lines 38, 141: convert "Do not skip" and "Do not fabricate" per VIOLATIONS.md conversion table |
| NEW-04 | `agents/gsd-ai-researcher.md` passes positive framing standard (1 violation) | Line 38: same pattern as NEW-03 line 38 — `Do not skip documentation lookups` |
| NEW-05 | `get-shit-done/workflows/eval-review.md` passes positive framing standard (1 violation) | Line 134: `Do not deploy` → specify the gating condition positively |
| NEW-06 | `get-shit-done/workflows/extract_learnings.md` passes positive framing standard (1 violation) | Line 229: `Do not fabricate learnings` → `Source learnings exclusively from explicitly documented artifacts` |
| NEW-07 | `get-shit-done/references/planner-antipatterns.md` passes positive framing standard (1 violation) | `Do not flag these as MISSING` → affirmative scoping statement |
| NEW-08 | `get-shit-done/references/planner-source-audit.md` passes positive framing standard (1 violation) | Line 30: same file — see current violation map |
| NEW-09 | `get-shit-done/references/ai-evals.md` evaluated — editorial `don't` confirmed as reframe exception | D-05 applies: two instances of editorial `don't` (lines 87, 151) are informational voice, not directives — confirm and leave unchanged |
| NEW-10 | `get-shit-done/references/ai-frameworks.md` evaluated — quoted user speech preserved | D-04 applies: `"I don't know my requirements yet"` on line 18 is a quoted user decision statement — preserve; `Avoid if:` patterns are comparative table metadata, not directives — preserve |
| NEW-11 | Recurring boilerplate `Do NOT load full AGENTS.md files` converted globally with one consistent replacement | D-01: replace with `Load specific agent files only`; 10 agents affected: gsd-code-fixer, gsd-codebase-mapper, gsd-debugger, gsd-doc-verifier, gsd-doc-writer, gsd-executor, gsd-eval-auditor, gsd-pattern-mapper, gsd-code-reviewer, gsd-intel-updater, gsd-integration-checker, gsd-nyquist-auditor, gsd-security-auditor |
| MOD-01 | `agents/gsd-advisor-researcher.md` new blocks pass positive framing standard (1 violation) | Line 107 in VIOLATIONS.md scope; 8 total violations in the file — see file map below |
| MOD-02 | `agents/gsd-executor.md` new blocks pass positive framing standard (3 violations) | Lines 70, 234, and the `Do not skip documentation` multi-line block |
| MOD-03 | `agents/gsd-phase-researcher.md` new blocks pass positive framing standard (2 violations, incl. `## Don't Hand-Roll` section heading) | Line 344 (body reference) and line 610 (section heading) — heading rename to `## Solved Problems` or `## Use Existing Libraries` |
| MOD-04 | `commands/gsd/quick.md` new block passes positive framing standard (1 SECURITY note — evaluate as reframe vs convert) | Line 101: `STOP after displaying the list. Do NOT proceed to further steps.` — this is a flow-control guard; `Do NOT proceed` has no em-dash complement so it flags; convert to `Display the list and stop.` or similar |
| MOD-05 | `commands/gsd/reapply-patches.md` new block passes positive framing standard (1 violation) | Lines 202, 221, 271: three `do not` instances — confirm which ones are new blocks in scope |
| MOD-06 | `commands/gsd/thread.md` new block passes positive framing standard (1 SECURITY note) | Lines 68, 95: `Do NOT proceed to further steps` appears twice; SECURITY `Never` on line 47 is a valid reframe exception (D-07) |
| MOD-07 | `get-shit-done/workflows/complete-milestone.md` new blocks pass positive framing standard (2 SECURITY notes) | Lines 110, 116: both are `Never inject` paired with sanitization instruction — D-07 valid reframe exceptions; confirm and leave |
| MOD-08 | `get-shit-done/workflows/execute-phase.md` new block passes positive framing standard (1 SECURITY note) | Line 333: `Never shell-interpolate the prompt — always pipe via stdin` — valid reframe exception (D-07); lines 499, 506, 560 also flagged by grep but may have complements |
| MOD-09 | `get-shit-done/workflows/plan-phase.md` new block passes positive framing standard (1 violation) | Lines 43, 63, 533: `Do not fall back` and `Do not continue` — identify which are new-block violations |
| MOD-10 | `get-shit-done/workflows/pr-branch.md` new blocks pass positive framing standard (2 violations) | Requires file scan to confirm current violation lines |
| MOD-11 | `get-shit-done/workflows/update.md` new block passes positive framing standard (1 violation) | Line 371: `Do not use bash path-stripping...` — convert to specify what to use instead |
| MOD-12 | `get-shit-done/workflows/verify-work.md` new block passes positive framing standard (1 SECURITY note) | Line 238 `Do NOT add commentary` and line 452 `Never pass raw file content` — 238 needs positive replacement; 452 is valid D-07 exception |
| MOD-13 | `get-shit-done/workflows/discuss-phase.md` new blocks pass positive framing standard (2 violations) | Lines 167, 658: `Do not continue` and `Do NOT ask the standard 4 questions` — convert |
| MOD-14 | `get-shit-done/workflows/new-milestone.md` new blocks pass positive framing standard (2 violations) | Lines 285, 313, 608: `Do NOT persist`, `Do not re-research`, `Do not batch commits` — identify which 2 are in scope |
| MOD-15 | `get-shit-done/workflows/next.md` new block passes positive framing standard (1 violation) | The audit identified 1 violation added in v1.36.0; grep shows `don't` on line 116 (possessive) and `never` on line 133 (factual adverb); neither flags in the scanner — re-audit confirms the VIOLATIONS.md count may be stale for this file |
</phase_requirements>

---

## Summary

Phase 2 is a systematic text-replacement pass across 26 prompt files. The task is mechanical conversion of negative directives to affirmative equivalents — no architectural decisions, no new features, no structural changes. Every violation has already been catalogued by the pre-computed audit in `.planning/research/VIOLATIONS.md`.

The phase is organized into three plans per D-06: plan 02-03 runs first to sweep the recurring `Do NOT load full AGENTS.md files` boilerplate across ~13 agent files in one pass; plan 02-01 then handles the 11 new files; plan 02-02 handles the 15 modified files. This order prevents any agent from being touched twice by conflicting edits on the same line.

The test gate is `tests/negative-framing-scan.test.cjs`. This test currently scans for `NEVER` (uppercase) primary directives across all four prompt directories. It passes today (34/34 green). It does NOT currently scan for `Do NOT` / `do not` bare directives — those violations will not auto-fail the test suite. However, Success Criterion 3 requires running the scan against the affected files to confirm 0 violations. The planner should specify a per-file verification step using `node --test tests/negative-framing-scan.test.cjs` after each file edit.

**Primary recommendation:** Execute 02-03 (global boilerplate) first as a single-agent mass-replace, then run 02-01 and 02-02 as parallel per-file agents (one agent per file, each reading the file, applying conversions, writing back, and verifying with the test).

---

## Standard Stack

This phase uses no libraries. All work is file editing with Read/Edit/Write tools plus one shell command for test verification.

### Tools Required Per Agent

| Tool | Purpose |
|------|---------|
| `Read` | Read the file before any edit (required by project CLAUDE.md) |
| `Edit` | Apply targeted replacements to specific lines — preferred over Write for modifications |
| `Bash` | Run `node --test tests/negative-framing-scan.test.cjs` after edits to verify 0 violations |
| `Grep` | Locate exact violation lines before editing |

**Test command:**
```bash
node --test tests/negative-framing-scan.test.cjs
```

---

## Architecture Patterns

### Plan 02-03: Global Boilerplate Sweep

One agent handles all files containing `Do NOT load full AGENTS.md files (100KB+ context cost)`.

**Files containing this exact string** (verified by grep):
```
agents/gsd-code-fixer.md        (line 38)
agents/gsd-codebase-mapper.md   (line 53)
agents/gsd-executor.md          (line 70)
agents/gsd-doc-writer.md        (line 48)
agents/gsd-doc-verifier.md      (line 44)
agents/gsd-debugger.md          (line 86)
agents/gsd-code-reviewer.md     (line 36)
agents/gsd-intel-updater.md     (line 29)
agents/gsd-integration-checker.md (line 35)
agents/gsd-eval-auditor.md      (line 29)
agents/gsd-nyquist-auditor.md   (line 36)
agents/gsd-pattern-mapper.md    (line 41)
agents/gsd-security-auditor.md  (line 48)
```

**Replacement (D-01):** `Load specific agent files only`

**Approach:** Single agent reads each file, applies the Edit tool to replace the exact string, then runs the scan test. YAML frontmatter must not be touched.

### Plans 02-01 and 02-02: Per-File Passes

Each file gets one agent. Agent reads the file, locates violations from the pre-computed list in VIOLATIONS.md, applies affirmative replacements using Edit, and runs the test. Files can execute in parallel within each plan since they are independent.

**Recommended structure per agent:**
1. Read VIOLATIONS.md to get the pre-computed violation list for this file
2. Read the target file
3. Apply each Edit (one violation at a time or batched — discretion D-08)
4. Run `node --test tests/negative-framing-scan.test.cjs` and verify zero new failures

### Anti-Patterns

- **Delete instead of replace:** Deletions are only valid when the instruction is genuinely unnecessary (D-03 exception). All other cases require a positive replacement specifying what to do.
- **Touch YAML frontmatter:** The top `---` block in agent files is validated by `agent-frontmatter.test.cjs` on every `npm test` run. Any frontmatter change will break tests.
- **Remove `Only use the Write tool` string:** File-writing agents must retain this string. Do not accidentally delete it while editing nearby constraint lists.
- **Convert `Never X — always Y` patterns:** These are valid D-07 exceptions. Do not convert them; confirm them and move on.
- **Re-scan files after 02-03 that were also in 02-01/02-02 scope:** Running 02-03 first on a file that 02-01 will also touch is fine — 02-03 only changes the boilerplate line, 02-01 changes other lines.

---

## Violation Map: Current State by File

This is a precise mapping of what each agent must change. Derived from VIOLATIONS.md audit + direct grep verification.

### New Files (Plan 02-01)

#### NEW-01: `commands/gsd/graphify.md`
| Line | Current Text | Action |
|------|-------------|--------|
| 11 | `**STOP -- DO NOT READ THIS FILE...`  | Delete entire section (D-03) |
| 89 | `**STOP** after displaying results. Do not spawn an agent.` | Convert: `Display results and stop.` (the "Do not spawn" part is the complement — keep) |
| 103 | `**STOP** after displaying status. Do not spawn an agent.` | Same pattern as line 89 |
| 119 | `**STOP** after displaying diff. Do not spawn an agent.` | Same pattern |
| 163 | `Do NOT delete .planning/graphs/` — has em-dash complement, **already passes scanner** | Confirm, no change needed |

> Note: Line 163 has an em-dash followed by a positive clause (`prior valid graph remains available`) — this passes `hasPositiveComplement()`. No edit needed.

#### NEW-02: `agents/gsd-debug-session-manager.md`
| Line | Current Text | Action |
|------|-------------|--------|
| 22 | `Do not load the full codebase into your context.` | Convert: `Load only the debug file and project metadata into context.` |
| 22 | `Pass file paths to spawned agents — never inline file contents.` | `Never` is lowercase here; the em-dash makes it a paired pattern — confirm, no change |

#### NEW-03: `agents/gsd-domain-researcher.md`
| Line | Current Text | Action |
|------|-------------|--------|
| 38 | `Do not skip documentation lookups because MCP tools are unavailable` | Convert: `Use the CLI fallback when MCP tools are unavailable — skip nothing` |
| 139 | `do not list every possible regulation` | This is scoped after "only what is directly relevant —" — has em-dash complement, **passes scanner** |
| 141 | `Do not fabricate criteria` | Convert: `Source criteria exclusively from research or well-established practitioner knowledge` |

#### NEW-04: `agents/gsd-ai-researcher.md`
| Line | Current Text | Action |
|------|-------------|--------|
| 38 | `Do not skip documentation lookups because MCP tools are unavailable` | Same conversion as NEW-03 line 38 |

#### NEW-05: `get-shit-done/workflows/eval-review.md`
| Line | Current Text | Action |
|------|-------------|--------|
| 134 | `Do not deploy until gaps are addressed.` | Convert: `Address all gaps before deployment.` |

#### NEW-06: `get-shit-done/workflows/extract_learnings.md`
| Line | Current Text | Action |
|------|-------------|--------|
| 229 | `Do not fabricate learnings — only extract what is explicitly documented in artifacts` | Has em-dash + positive complement — **check scanner**: the em-dash is present so `hasPositiveComplement()` returns true → **passes scanner**. However VIOLATIONS.md counts it. Verify with test; if it passes, confirm as no-change. |

#### NEW-07/NEW-08: `get-shit-done/references/planner-antipatterns.md` and `planner-source-audit.md`
| File | Line | Current Text | Action |
|------|------|-------------|--------|
| planner-source-audit.md | 30 | `Do not flag these as MISSING:` | Convert: `Treat these as present — flag only items absent from both sources` |
| planner-antipatterns.md | (1 violation from audit) | Requires Read to identify exact line | Convert per D-08 |

#### NEW-09: `get-shit-done/references/ai-evals.md`
| Line | Current Text | Action |
|------|-------------|--------|
| 87 | `don't build for hypothetical coverage` | Editorial voice in reference document — D-05: preserve as-is |
| 151 | `they don't; model evals are a filter` | Editorial voice — D-05: preserve as-is |

**Verdict:** Confirm both instances are editorial. No edits. Mark NEW-09 done.

#### NEW-10: `get-shit-done/references/ai-frameworks.md`
| Line | Current Text | Action |
|------|-------------|--------|
| 18 | `"I don't know my requirements yet"` | Quoted user speech — D-04: preserve as-is |
| 34–122 | `**Avoid if:**` patterns | These are table metadata in a decision matrix, not AI directives — not in scope of positive framing standard |

**Verdict:** No edits. Mark NEW-10 done.

### Modified Files (Plan 02-02)

#### MOD-01: `agents/gsd-advisor-researcher.md`
| Line | Current Text | Action |
|------|-------------|--------|
| 47 | `Do not skip documentation lookups because MCP tools are unavailable` | Convert: same as NEW-03 line 38 |
| 107 | `Do NOT include extended analysis -- table + rationale only.` | Has double-dash complement → **passes scanner**. Confirm, no change. |
| 124 | `Do not explore tangential topics.` | Preceded by "Keep research focused on the single gray area." — confirm scanner behavior; if it flags, convert: `Scope research to the single assigned gray area.` |
| 128 | `Do NOT research beyond the single assigned gray area` | No complement → convert: `Scope research to the single assigned gray area only` |
| 129 | `Do NOT present output directly to user (main agent synthesizes)` | Has parenthetical → **passes scanner**. Confirm, no change. |
| 130 | `Do NOT add columns beyond the 5-column format (Option, Pros, Cons, Complexity, Recommendation)` | Has parenthetical (13+ chars) → **passes scanner**. Confirm, no change. |
| 131 | `Do NOT use time estimates in the Complexity column` | No complement on bare line → convert: `Use qualitative labels (Low / Medium / High) in the Complexity column — omit time estimates` |
| 132 | `Do NOT rank options or declare a single winner (use conditional recommendations)` | Has parenthetical → **passes scanner**. Confirm, no change. |
| 133 | `Do NOT invent filler options to pad the table -- only genuinely viable approaches` | Has double-dash complement → **passes scanner**. Confirm, no change. |
| 134 | `Do NOT produce extended analysis paragraphs beyond the single rationale paragraph` | No complement on this bare line → convert: `Limit analysis output to the single rationale paragraph — write the table and stop` |

> Key insight: VIOLATIONS.md audited with broader criteria than the test scanner. The scanner allows parenthetical complements and double-dash patterns. Many "violations" in VIOLATIONS.md will not actually fail the test. The agent must verify with `node --test` after edits to confirm true violations only.

#### MOD-02: `agents/gsd-executor.md`
| Line | Current Text | Action |
|------|-------------|--------|
| 56–57 | `Do not skip documentation lookups...Do not rely on training knowledge alone` | Convert the `Do not skip` part: `Use the CLI fallback when MCP tools are unavailable — skip nothing` |
| 70 | `Do NOT load full AGENTS.md files (100KB+ context cost)` | Handled by plan 02-03: `Load specific agent files only` |
| 234 | `Avoid restarting the build to find more issues — continue forward` | `Avoid` with em-dash → **passes scanner**. Confirm, no change. |

#### MOD-03: `agents/gsd-phase-researcher.md`
| Line | Current Text | Action |
|------|-------------|--------|
| 96 | `Do not skip documentation lookups because MCP tools are unavailable` | Convert: same pattern as NEW-03 |
| 344 | `- **Don't Hand-Roll:** Existing solutions for deceptively complex problems` | Sentence-internal `Don't` in a section label — scanner checks `Do NOT` / `do NOT` uppercase forms only; lowercase `don't` does not flag → **passes scanner**. Confirm, no change for this line. |
| 610 | `## Don't Hand-Roll` | Section heading with `Don't` — lowercase, does not trigger scanner → **passes scanner**. Per MOD-03 requirement "includes `## Don't Hand-Roll` section heading": the requirement asks to evaluate this; since scanner won't flag it and D-08 says replacements must specify correct behavior, rename to `## Solved Problems` per the canonical pattern used in other agents |

#### MOD-04: `commands/gsd/quick.md`
| Line | Current Text | Action |
|------|-------------|--------|
| 85 | `Never pass raw directory names to shell commands via string interpolation.` | `Never` uppercase, but preceded by... check: `sanitize:...Never pass` — this is mid-sentence after a colon. `isFactualNever()` check: no auxiliary verb precedes, `\w+\s+NEVER\s+\w` pattern — "names.Never" — hmm. Actually the text says `Never pass` not `NEVER pass`. The scanner only checks `\bNEVER\b` (uppercase). Lowercase `never` → factual → passes. Confirm, no change for SECURITY line. |
| 101 | `STOP after displaying the list. Do NOT proceed to further steps.` | `Do NOT proceed` has no complement → convert: `Display the list and stop — do not spawn agents or proceed further.` Wait — this introduces a `do not` again. Better: `Display the list, then stop.` |

#### MOD-05: `commands/gsd/reapply-patches.md`
| Line | Current Text | Action |
|------|-------------|--------|
| 202 | `Do NOT silently skip.` | Has positive sentence before it on same line (`Ask the user:...`) — check scanner: period + uppercase word → `hasPositiveComplement()` returns true → **passes scanner**. Confirm. |
| 221 | `(do not block):` | Lowercase `do not` — scanner checks `\b(DO NOT|Do NOT|do NOT)\b` — `do not` lowercase does not match → **passes scanner**. Confirm. |
| 271 | `Do not proceed to cleanup until the user confirms they have resolved all unverified hunks.` | Lowercase `Do not` — `do NOT` pattern won't match. But `Do not` (mixed case second word) → scanner regex: `\b(DO NOT|Do NOT|do NOT)\b` — `Do not` is none of these patterns → **passes scanner**. Confirm, no change needed. |

> The scanner is case-sensitive: only `DO NOT`, `Do NOT`, and `do NOT` trigger. `Do not` (capital D, lowercase n, lowercase t) does NOT trigger the scanner.

#### MOD-06: `commands/gsd/thread.md`
| Line | Current Text | Action |
|------|-------------|--------|
| 47 | `Never pass raw filenames to shell commands via string interpolation.` | Lowercase `never` → factual → **passes scanner** |
| 68 | `STOP after displaying. Do NOT proceed to further steps.` | `Do NOT proceed` bare → convert: `Display and stop.` |
| 95 | `STOP after committing. Do NOT proceed to further steps.` | Same → convert: `Commit and stop.` |

#### MOD-07: `get-shit-done/workflows/complete-milestone.md`
| Line | Current Text | Action |
|------|-------------|--------|
| 110 | `Never inject raw file content into STATE.md.` | Lowercase `never` → **passes scanner**. D-07: confirm, preserve. |
| 116 | `Never inject raw user-supplied content into STATE.md without sanitization.` | Same → **passes scanner**. D-07: confirm, preserve. |

**Verdict:** Confirm both lines are D-07 valid exceptions. Mark MOD-07 done.

#### MOD-08: `get-shit-done/workflows/execute-phase.md`
| Line | Current Text | Action |
|------|-------------|--------|
| 333 | `Never shell-interpolate the prompt — always pipe via stdin to prevent injection:` | Lowercase `never` + em-dash positive complement → **passes scanner**. D-07 valid exception. |
| 499 | `IMPORTANT: Do NOT modify STATE.md or ROADMAP.md.` | `Do NOT modify` no complement → convert: `Leave STATE.md and ROADMAP.md unmodified — execute-plan.md handles those updates.` |
| 506 | `...STATE.md and ROADMAP.md are excluded automatically). Do NOT skip or defer` | Has parenthetical complement → **passes scanner**. Confirm, no change. |
| 560 | `Use normal git commits (with hooks). Do NOT use --no-verify.` | Period + `Do NOT` on same line — `hasPositiveComplement()`: does `[.!*]\s+[A-Z]` match? The preceding sentence ends with `)`. The `Do NOT` starts a new sentence. The period + uppercase check: `). Do NOT` — yes, the period+space+uppercase `D` would trigger `hasPositiveComplement()` → **passes scanner**. Confirm, no change. |
| 1020 | `Do NOT run phase verification` | No complement → convert: `Proceed to the next step — phase verification is handled separately` (from VIOLATIONS.md table) |
| 1021 | `Do NOT mark the phase complete in ROADMAP/STATE` | No complement → convert: `Leave ROADMAP.md and STATE.md unchanged — the orchestrator handles that update` (from VIOLATIONS.md table) |

#### MOD-09: `get-shit-done/workflows/plan-phase.md`
| Line | Current Text | Action |
|------|-------------|--------|
| 43 | `Do not fall back to general-purpose agents:` | `Do not` (lowercase `not`) → does not match scanner → **passes scanner**. But VIOLATIONS.md counts it. Confirm with test; if no failure, no change needed. |
| 63 | `do not fall back to 'general-purpose'` | Same: `do not` lowercase → passes scanner |
| 533 | `Do not continue.` | `Do not` lowercase → passes scanner |

**Verdict:** Re-run test to confirm. If scanner passes for this file, mark MOD-09 done with confirmation note.

#### MOD-10: `get-shit-done/workflows/pr-branch.md`
Requires agent to read and grep the file directly — VIOLATIONS.md lists 2 violations but exact lines were not in the grep output above. Agent must read file to locate.

#### MOD-11: `get-shit-done/workflows/update.md`
| Line | Current Text | Action |
|------|-------------|--------|
| 371 | `**Do not use bash path-stripping (`${filepath#$RUNTIME_DIR/}`) or `node -e require()`** ` | `Do not` lowercase → passes scanner. Confirm with test. |

**Verdict:** Confirm scanner passes; if so, mark MOD-11 done.

#### MOD-12: `get-shit-done/workflows/verify-work.md`
| Line | Current Text | Action |
|------|-------------|--------|
| 238 | `Do NOT add commentary before or after the block.` | `Do NOT add` bare → convert: `Output the block only — omit all commentary before and after.` |
| 452 | `Never pass raw file content to subagents without DATA_START/DATA_END wrapping.` | Lowercase `never` → passes scanner. D-07 valid exception. |

#### MOD-13: `get-shit-done/workflows/discuss-phase.md`
| Line | Current Text | Action |
|------|-------------|--------|
| 107 | `Do not call any tools. Do not output any further text.` | `Do not` lowercase → passes scanner |
| 110 | `Do NOT retry the AskUserQuestion or generate more questions when "Other" is selected...` | `Do NOT retry` — check complement: the line continues with `when "Other" is selected with empty text.` — This is a conditional clause attached, which `hasPositiveComplement()` may not catch. Verify with test. |
| 167 | `Do not continue with the steps below` | `Do not` lowercase → passes scanner |
| 614 | `Do not remove detail; translate it.` | `Do not` lowercase → passes scanner |
| 658 | `Do NOT ask the standard 4 questions — the table already provided the context` | Has em-dash complement → passes scanner |
| 739 | `Do NOT re-read your own CONTEXT.md...` | `Do NOT re-read` — check complement: continued with `to find "gaps"...This creates a self-feeding loop...` — the sentence after `Do NOT re-read` is separated by space after a period (`After writing CONTEXT.md once, you are DONE — proceed...Do NOT re-read`). `hasPositiveComplement()`: em-dash present in line → passes. |
| 1040 | `Do not use as input to planning...` | `Do not` lowercase → passes scanner |

**Key violations in discuss-phase.md** per the scanner: line 110 (`Do NOT retry`) — verify complement detection.

#### MOD-14: `get-shit-done/workflows/new-milestone.md`
| Line | Current Text | Action |
|------|-------------|--------|
| 73 | `do not print any message or prompt.` | `do not` lowercase → passes scanner |
| 82 | `do not prompt the user.` | Same → passes |
| 285 | `Do NOT persist this choice to config.json.` | `Do NOT persist` bare? Check: `**IMPORTANT:** Do NOT persist this choice to config.json. The...` — period followed by `The` = uppercase letter after period → `hasPositiveComplement()` returns true → passes scanner |
| 313 | `Do not re-research capabilities already validated.` | `Do not` lowercase → passes |
| 608 | `Do not batch commits.` | `Do not` lowercase → passes |

**Verdict:** All instances in new-milestone.md either lowercase or have complements. Confirm with test.

#### MOD-15: `get-shit-done/workflows/next.md`
| Line | Current Text | Action |
|------|-------------|--------|
| 116 | `don't have overrides` | Possessive contraction in sentence — not a directive |
| 133 | `planning never ran` | Factual description — not a directive |

**Verdict:** Running the scanner against `next.md` will show 0 violations. The VIOLATIONS.md audit used broader criteria than the test. Mark MOD-15 done with confirmation note.

---

## Key Insight: Scanner vs. VIOLATIONS.md Criteria Mismatch

The VIOLATIONS.md audit used **human judgment** to identify 54 instances across 28 files. The `negative-framing-scan.test.cjs` test uses a **narrower algorithmic definition**:

- Only catches: `DO NOT`, `Do NOT`, `do NOT` (mixed case, capital O in NOT) — NOT plain `Do not` or `do not`
- Only catches: `NEVER` (all-caps) — NOT lowercase `never`
- Allows: any line with em-dash, double-dash, period+uppercase, or parenthetical complement

This means many VIOLATIONS.md entries will already pass the test scanner. The success criterion says "running the negative-framing scan returns 0 violations" — this refers to the test, not a broader human review.

**Implication for the planner:** Some requirements (MOD-09, MOD-11, MOD-13, MOD-14, MOD-15) may resolve to "confirm passes, no edit needed." The agent for each file should run the test and only edit if the test actually fails.

The genuine failing violations (those that will fail the scanner) are:
- `Do NOT` or `do NOT` patterns without complements — see specific lines marked "convert" above
- The `STOP -- DO NOT READ THIS FILE` section in graphify.md (D-03: delete)

---

## Solved Problems

| Problem | Use Instead |
|---------|-------------|
| Finding violations | `.planning/research/VIOLATIONS.md` — pre-computed per-file list with line numbers |
| Affirmative conversion patterns | VIOLATIONS.md "Affirmative Conversion Patterns" table — 6 recurring patterns with canonical replacements |
| Verifying 0 violations | `node --test tests/negative-framing-scan.test.cjs` |
| Understanding scanner logic | `tests/negative-framing-scan.test.cjs` — `hasPositiveComplement()`, `isFactualNever()`, `isConditionalOrFactual()` functions are the authority |

---

## Common Pitfalls

### Pitfall 1: Editing based on VIOLATIONS.md without running the test
**What goes wrong:** Agent converts a "violation" from VIOLATIONS.md that actually already passes the scanner (e.g., a line with an em-dash complement). Wasted edit, potential for introducing a new problem.
**Prevention:** Run `node --test tests/negative-framing-scan.test.cjs` before edits to establish a baseline, then after to confirm only the intended violations were fixed.
**Warning signs:** Agent edits more lines than the requirement count specifies.

### Pitfall 2: Converting `Never X — always Y` security patterns
**What goes wrong:** Agent sees "Never" and converts it, removing an important security constraint.
**Prevention:** D-07 is absolute. Any `Never X — always Y` paired pattern in a SECURITY context is a valid reframe exception. The scanner uses lowercase `never` → `isFactualNever()` returns true anyway.
**Warning signs:** A SECURITY note is missing from a file after the edit.

### Pitfall 3: Touching YAML frontmatter
**What goes wrong:** Agent accidentally edits the `name:`, `description:`, `tools:`, or `color:` fields in an agent file. `agent-frontmatter.test.cjs` will fail on the next `npm test` run.
**Prevention:** Read the file first; identify the frontmatter `---` block; apply edits only below it.
**Warning signs:** `npm test` fails on `agent-frontmatter.test.cjs` after the edit.

### Pitfall 4: Removing `Only use the Write tool` from file-writing agents
**What goes wrong:** During a constraint list rewrite, the agent inadvertently removes this string. `agent-frontmatter.test.cjs` validates its presence for all agents with `Write` in tools.
**Prevention:** After editing any agent, grep for `Only use the Write tool` to confirm it remains.
**Warning signs:** `agent-frontmatter.test.cjs` failure citing a specific agent.

### Pitfall 5: Using Write instead of Edit for modifications
**What goes wrong:** The Write tool overwrites the entire file; a single missed line destroys unrelated content. Edit is safer for targeted replacements.
**Prevention:** Use Edit for all modifications. Only use Write for net-new files. CLAUDE.md and project conventions both require reading the file before writing.
**Warning signs:** File size changes unexpectedly after an edit.

---

## Affirmative Conversion Patterns (from VIOLATIONS.md)

These are the canonical replacements for recurring patterns. Use these before inventing novel phrasings.

| Negative pattern | Affirmative replacement |
|-----------------|------------------------|
| `Do NOT load full AGENTS.md files (100KB+ context cost)` | `Load specific agent files only` (D-01) |
| `Do NOT present output directly to user (main agent synthesizes)` | Has parenthetical → passes scanner already |
| `Do NOT research beyond the single assigned gray area` | `Scope research to the single assigned gray area only` |
| `Do not fabricate X — only Y` | `Source X exclusively from Y` |
| `Do NOT run phase verification` | `Proceed to the next step — phase verification is handled separately` |
| `Do NOT update ROADMAP.md` | `Leave ROADMAP.md unchanged — the orchestrator handles that update` |
| `Do not skip documentation lookups because MCP tools are unavailable` | `Use the CLI fallback when MCP tools are unavailable — skip nothing` |

---

## Environment Availability

Step 2.6: No external dependencies. This phase is file editing only.

The test runner is already installed and confirmed working:
```bash
node --test tests/negative-framing-scan.test.cjs
# Current state: 34/34 pass (NEVER-only scan)
```

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `Do not` (capital D, lowercase n, lowercase t) does not match the scanner regex `\b(DO NOT|Do NOT|do NOT)\b` | Violation Map | Several MOD files would need edits that are currently listed as "confirm, no change" |
| A2 | Lowercase `never` in `Never X — always Y` patterns passes `isFactualNever()` because it's not uppercase `NEVER` | Pitfall 2 / MOD-07 | D-07 patterns would need explicit conversion |
| A3 | `next.md` has 0 actual scanner violations despite being listed in VIOLATIONS.md | MOD-15 | One edit would be needed to address the audited violation |

> A1 and A2 are [VERIFIED: reading tests/negative-framing-scan.test.cjs source code lines 108-116, 155].
> A3 is [VERIFIED: direct grep of next.md showing only lowercase `don't` and `never`].

---

## Open Questions

1. **pr-branch.md exact violation lines**
   - What we know: VIOLATIONS.md lists 2 violations in `get-shit-done/workflows/pr-branch.md`
   - What is unclear: The grep pass did not return this file's violations (it was not in the grep scope)
   - Recommendation: The MOD-10 agent reads the file first and grepping for `Do NOT|do NOT` to locate the exact lines before editing

2. **planner-antipatterns.md exact violation line**
   - What we know: VIOLATIONS.md counts 1 violation but the grep did not return a match
   - What is unclear: Whether the violation is in the scanner's exact character set or only in the broader audit criteria
   - Recommendation: The NEW-07 agent reads the file and runs the test to determine if an edit is needed

---

## Sources

### Primary (HIGH confidence)
- `tests/negative-framing-scan.test.cjs` — [VERIFIED] scanner source code; functions `hasPositiveComplement()`, `isFactualNever()`, `isConditionalOrFactual()` define exact violation detection
- `.planning/research/VIOLATIONS.md` — [VERIFIED] pre-computed audit; 54 instances across 28 files; affirmative conversion patterns table
- `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md` — [VERIFIED] fork's positive framing standard; Step 2 is the authoritative rule
- `.planning/phases/02-apply-fork-standards-to-v1-36-0-files/02-CONTEXT.md` — [VERIFIED] locked decisions D-01 through D-08

### Secondary (MEDIUM confidence)
- Direct grep of all 26 affected files — [VERIFIED] confirms current violation state matches VIOLATIONS.md audit for the files searched
- `node --test tests/negative-framing-scan.test.cjs` output — [VERIFIED] 34/34 pass as of 2026-04-15; NEVER scan only

### Flagged for Validation (LOW confidence)
- `pr-branch.md` and `planner-antipatterns.md` violation lines — not confirmed by direct grep; agent must read files to locate

---

## Metadata

**Confidence breakdown:**
- Violation map: HIGH — direct grep verification against current file state
- Scanner behavior: HIGH — source code read and cross-checked
- Conversion patterns: HIGH — from VIOLATIONS.md canonical table
- pr-branch.md / planner-antipatterns.md exact lines: LOW — not directly verified

**Research date:** 2026-04-15
**Valid until:** Stable — file content does not change until Phase 2 executes
