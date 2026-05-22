# Prompt Standards Violation Audit

**Branch:** `thamw-main`
**Audited against:** `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md`, `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md`
**Trigger:** Post-merge audit after upstream v1.36.0 (commit `041c2a5`)
**Date:** 2026-04-15

---

## Summary

| Category | Violation Count | Files Affected | Severity |
|----------|----------------|----------------|----------|
| Negative framing (primary directives) | 54 instances | 28 files | HIGH |
| Command layer `<task>` instead of `<intent>` | 0 | 0 | NONE |
| `/clear` wrapped in `<sub>` tags | 0 | 0 | NONE |
| Missing XML structure entirely | 4 reference files | 4 files | LOW |
| File-writing agents missing "Only use the Write tool" | 0 | 0 | NONE |

**Overall:** 28 files need negative-framing remediation. All other categories are either clean or negligible.

---

## 1. Negative Framing Violations

**Standard:** Primary directives must use positive, affirmative framing. "Do not X" must be converted to its affirmative equivalent ("X only", "Omit X", "Limit to Y", etc.).

**Total:** 54 bullet/numbered/bold directive instances across 28 files.

### Agents (16 files, ~40 instances)

#### `agents/gsd-assumptions-analyzer.md` — 9 violations
```
Line 100: - Do NOT suggest scope expansion -- stay within the phase boundary.
Line 101: - Do NOT include implementation details (that's for the planner).
Line 102: - Do NOT pad with obvious assumptions -- only surface decisions that could go multiple ways.
Line 107: - Do NOT present output directly to user (main workflow handles presentation)
Line 108: - Do NOT research beyond what the codebase contains (flag gaps in "Needs External Research")
Line 109: - Do NOT use web search or external tools (you have Read, Bash, Grep, Glob only)
Line 110: - Do NOT include time estimates or complexity assessments
Line 111: - Do NOT generate more areas than the calibration tier specifies
Line 112: - Do NOT invent assumptions about code you haven't read -- read first, then form opinions
```

#### `agents/gsd-advisor-researcher.md` — 8 violations
```
Line 107: 6. Do NOT include extended analysis -- table + rationale only.
Line 128: - Do NOT research beyond the single assigned gray area
Line 129: - Do NOT present output directly to user (main agent synthesizes)
Line 130: - Do NOT add columns beyond the 5-column format (Option, Pros, Cons, Complexity, Recommendation)
Line 131: - Do NOT use time estimates in the Complexity column
Line 132: - Do NOT rank options or declare a single winner (use conditional recommendations)
Line 133: - Do NOT invent filler options to pad the table -- only genuinely viable approaches
Line 134: - Do NOT produce extended analysis paragraphs beyond the single rationale paragraph
```

#### `agents/gsd-code-fixer.md` — 4 violations
```
Line 38:  4. Do NOT load full `AGENTS.md` files (100KB+ context cost)
Line 138: - Do NOT skip the fix just because syntax checking is unavailable
Line 240: - Do NOT create REVIEW-FIX.md
Line 343: - Do NOT leave uncommitted changes
```

#### `agents/gsd-codebase-mapper.md` — 3 violations
```
Line 45:  - Avoid introducing more technical debt (CONCERNS.md)
Line 53:  4. Do NOT load full `AGENTS.md` files (100KB+ context cost)
Line 631: **Do not mock these:**
```

#### `agents/gsd-executor.md` — 2 violations
```
Line 70:  4. Do NOT load full `AGENTS.md` files (100KB+ context cost)
Line 234: - Avoid restarting the build to find more issues — continue forward
```

#### `agents/gsd-doc-writer.md` — 2 violations
```
Line 48:  4. Do NOT load full `AGENTS.md` files (100KB+ context cost)
Line 92:  8. Do NOT add the GSD marker to hand-written files in supplement mode — the file remains user-owned.
```

#### `agents/gsd-doc-verifier.md` — 2 violations
```
Line 44:  4. Do NOT load full `AGENTS.md` files (100KB+ context cost)
Line 68:  - Do NOT execute any commands. Existence check only.
```

#### `agents/gsd-debugger.md` — 1 violation
```
Line 86:  4. Do NOT load full `AGENTS.md` files (100KB+ context cost)
```

#### `agents/gsd-domain-researcher.md` — 1 violation
```
Line 141: - Do not fabricate criteria — only surface research or well-established practitioner knowledge
```

#### `agents/gsd-code-reviewer.md` — 1 violation
```
Line 36:  4. Do NOT load full `AGENTS.md` files (100KB+ context cost)
```

#### `agents/gsd-intel-updater.md` — 1 violation
```
Line 29:  4. Do NOT load full `AGENTS.md` files (100KB+ context cost)
```

#### `agents/gsd-integration-checker.md` — 1 violation
```
Line 35:  4. Do NOT load full `AGENTS.md` files (100KB+ context cost)
```

#### `agents/gsd-eval-auditor.md` — 1 violation
```
Line 29:  4. Do NOT load full `AGENTS.md` files (100KB+ context cost)
```

#### `agents/gsd-nyquist-auditor.md` — 1 violation
```
Line 36:  4. Do NOT load full `AGENTS.md` files (100KB+ context cost)
```

#### `agents/gsd-pattern-mapper.md` — 1 violation
```
Line 41:  4. Do NOT load full `AGENTS.md` files (100KB+ context cost)
```

#### `agents/gsd-security-auditor.md` — 1 violation
```
Line 48:  4. Do NOT load full `AGENTS.md` files (100KB+ context cost)
```

---

### Workflows (10 files, ~13 instances)

#### `get-shit-done/workflows/execute-phase.md` — 2 violations
```
Line 1020: - Do NOT run phase verification
Line 1021: - Do NOT mark the phase complete in ROADMAP/STATE
```

#### `get-shit-done/workflows/quick.md` — 2 violations
```
Line 594: - Do NOT commit docs artifacts (SUMMARY.md, STATE.md, PLAN.md) — the orchestrator handles the docs commit in Step 8
Line 595: - Do NOT update ROADMAP.md (quick tasks are separate from planned phases)
```

#### `get-shit-done/workflows/discuss-phase.md` — 2 violations
```
Line 167: - Do not continue with the steps below
Line 658:    - Do NOT ask the standard 4 questions — the table already provided the context
```

#### `get-shit-done/workflows/verify-work.md` — 1 violation
```
Line 238: - Do NOT add commentary before or after the block.
```

#### `get-shit-done/workflows/update.md` — 1 violation
```
Line 371: **Do not use bash path-stripping (`${filepath#$RUNTIME_DIR/}`) or `node -e require()`
```

#### `get-shit-done/workflows/pause-work.md` — 1 violation
```
Line 165: **Do not proceed until all boxes are checked.**
```

#### `get-shit-done/workflows/import.md` — 1 violation
```
Line 241: - Do not delete the written file — the user can fix and re-validate manually
```

#### `get-shit-done/workflows/extract_learnings.md` — 1 violation
```
Line 229: - Do not fabricate learnings — only extract what is explicitly documented in artifacts
```

#### `get-shit-done/workflows/analyze-dependencies.md` — 1 violation
```
Line 100: - Do not reorder phases
```

#### `get-shit-done/references/revision-loop.md` — 1 violation
```
Line 65: - Do NOT introduce new issues while fixing existing ones
```

---

### Commands (2 files, 2 instances)

#### `commands/gsd/docs-update.md` — 1 violation
```
Line 42: - Do not infer that a flag is active just because it is documented in this prompt
```

#### `commands/gsd/execute-phase.md` — 1 violation
```
Line 54: - Do not infer that a flag is active just because it is documented in this prompt
```

---

### Affirmative Conversion Patterns

The following patterns appear repeatedly and have standard affirmative equivalents:

| Negative pattern | Affirmative equivalent |
|-----------------|----------------------|
| `Do NOT load full AGENTS.md files (100KB+ context cost)` | `Load only the specific agent file needed — AGENTS.md exceeds 100KB` |
| `Do NOT present output directly to user` | `Return output to the spawning agent only — the orchestrator handles user presentation` |
| `Do NOT research beyond the single assigned gray area` | `Scope research to the single assigned gray area only` |
| `Do not fabricate X — only Y` | `Source X exclusively from Y` |
| `Do NOT run phase verification` | `Proceed to the next step — phase verification is handled separately` |
| `Do NOT update ROADMAP.md` | `Leave ROADMAP.md unchanged — the orchestrator handles that update` |

---

## 2. Command Layer `<task>` Tag Check

**Standard:** Command files must use `<intent>` (not `<task>`) to disambiguate from workflow `<task>` blocks.

**Result: 0 violations.** No `<task>` tags found in `commands/gsd/`. All 47 command files that use XML structure correctly use `<intent>`.

**Note:** 26 of 73 command files use no XML structure at all (see Section 4). These are pre-existing upstream files that have not yet received the fork's XML wrapping treatment. They are not `<task>`-tag violations — they simply lack structure entirely.

The 26 files without any XML:
```
commands/gsd/add-backlog.md
commands/gsd/ai-integration-phase.md
commands/gsd/analyze-dependencies.md
commands/gsd/audit-fix.md
commands/gsd/audit-uat.md
commands/gsd/code-review-fix.md
commands/gsd/code-review.md
commands/gsd/docs-update.md
commands/gsd/eval-review.md
commands/gsd/execute-phase.md
commands/gsd/explore.md
commands/gsd/extract_learnings.md
commands/gsd/forensics.md
commands/gsd/from-gsd2.md
commands/gsd/graphify.md
commands/gsd/import.md
commands/gsd/list-workspaces.md
commands/gsd/manager.md
commands/gsd/milestone-summary.md
commands/gsd/new-workspace.md
commands/gsd/remove-workspace.md
commands/gsd/review-backlog.md
commands/gsd/scan.md
commands/gsd/secure-phase.md
commands/gsd/thread.md
commands/gsd/undo.md
```

---

## 3. `<sub>/clear` Pattern Check

**Standard:** `/clear` must appear as a standalone line before the command in Next Up blocks. It must not be wrapped in `<sub>` tags.

**Result: 0 violations.** No instances of `/clear` wrapped inside `<sub>` tags were found.

The four `<sub>` usages found are all legitimate caption text beneath phase names in Next Up blocks. In each case, the `/clear` line appears after the `<sub>` line, which is the correct pattern:

```
**Phase {N}: {Name}** — {Goal}
<sub>Context gathered, ready to plan</sub>     ← caption for phase line
                                               ← blank line
`/clear` then:                                 ← /clear instruction
                                               ← blank line
`/gsd-plan-phase {N}`                          ← command
```

Files with `<sub>` usage (all conforming):
- `get-shit-done/workflows/progress.md` — line 252
- `get-shit-done/workflows/transition.md` — lines 389, 451
- `get-shit-done/references/continuation-format.md` — line 104 (in example block)

---

## 4. Missing XML Structure

**Standard:** Prompt content files should use XML section tags (`<task>`, `<context>`, `<constraints>`, etc.) to delineate structure.

**Result: 4 reference files have no XML structure.** All are in `get-shit-done/references/` and appear to be data/reference documents rather than prompt templates — they may be intentionally plain Markdown. Flag for author decision.

```
get-shit-done/references/ai-evals.md      — reference table document (no prompt directives)
get-shit-done/references/ai-frameworks.md — decision matrix document (no prompt directives)
get-shit-done/references/gates.md         — taxonomy reference (no prompt directives)
get-shit-done/references/ios-scaffold.md  — scaffold rules document (no prompt directives)
```

`ai-evals.md` and `ai-frameworks.md` were added/modified in the v1.36.0 merge. `gates.md` and `ios-scaffold.md` also came in with that merge (`get-shit-done/references/ios-scaffold.md` is listed as `AM` in the merge commit). These reference files use `---` section separators rather than XML tags, which may be appropriate for reference/data files that are injected into agent contexts verbatim.

**Severity: LOW.** These are informational reference files, not instruction files. XML wrapping is optional for pure data documents.

---

## 5. File-Writing Agents Missing "Only use the Write tool"

**Standard:** Any agent with `Write` in its `tools:` frontmatter must include the instruction "Only use the Write tool" (case-insensitive) in its body.

**Result: 0 violations.** All 22 agents with `Write` in their tools frontmatter include the required instruction.

The 3 agents initially flagged by the grep (`gsd-advisor-researcher`, `gsd-ui-checker`, `gsd-user-profiler`) do NOT have `Write` in their tools frontmatter — the match was on body text, not the tools list. The audit tool (grep on file content for "Write") was a false positive; the correct check is `grep "^tools:.*Write"`.

---

## Overall Severity Assessment

**High priority — 28 files need remediation:**

The negative framing violations are the only substantive finding. 54 instances across 28 files. The bulk are concentrated in:

1. **`gsd-assumptions-analyzer.md`** (9) and **`gsd-advisor-researcher.md`** (8) — both added or substantially modified in the v1.36.0 merge. These are the highest-priority targets.
2. **Recurring `Do NOT load full AGENTS.md`** pattern — appears verbatim in 10+ agents as item 4 in a loading-order list. A single affirmative rewrite applied consistently would clear most of the agent violations.
3. **Workflow step guards** — directives like `Do NOT run phase verification` and `Do NOT update ROADMAP.md` are scope boundaries in executor-style steps; convert to "Scope this step to X only" framing.

**Low priority — 4 reference files, 26 command files:**

The 4 reference files without XML are data documents and likely intentional. The 26 command files without XML structure are pre-existing upstream files not yet touched by the fork's formatting pass — they should be batched into a structural update pass, but are not regressions from the v1.36.0 merge.
