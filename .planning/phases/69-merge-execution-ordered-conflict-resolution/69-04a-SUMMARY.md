---
phase: 69-merge-execution-ordered-conflict-resolution
plan: 04a
subsystem: prompt-content
tags: [merge, tier-4, prompt-content, agents, commands, fork-preservation, rename-deferred]
dependency_graph:
  requires:
    - phase: 69-03
      provides: confirmed fork modules present, sdk/ deleted, merge stays closed
  provides:
    - fork agents/gsd-*.md and commands/gsd/*.md updated with upstream functional deltas (Write-contract blocks, Edit-tool additions, UAT filename, antigravity review option, config query fix)
    - fork patches preserved (Eta includes, gsd-sdk CLI name, get-shit-done/ paths, positive framing, identity strings)
  affects: [69-04b (get-shit-done/ workflows/references/templates), 69-04c (docs/READMEs), 69-05 (tests), Phase 71 rename sweep]
tech_stack:
  added: []
  patterns:
    - "Tier-4 prompt-content hand-merge: integrate only genuine upstream functional deltas; treat get-shit-done/->gsd-core/ and gsd-sdk->gsd-tools and @opengsd/get-shit-done identity as rename-class (deferred, not adopted)"
key_files:
  created:
    - .planning/phases/69-merge-execution-ordered-conflict-resolution/69-04a-SUMMARY.md
  modified:
    - agents/gsd-debug-session-manager.md
    - agents/gsd-verifier.md
    - agents/gsd-executor.md
    - agents/gsd-planner.md
    - agents/gsd-research-synthesizer.md
    - agents/gsd-phase-researcher.md
    - agents/gsd-doc-writer.md
    - commands/gsd/config.md
    - commands/gsd/review.md
key-decisions:
  - "Correct delta base is the true merge-base fa4bba47 (common ancestor), NOT `git merge-base HEAD 1bb253c9` — that returns 1bb253c9 itself post-merge and yields an empty diff. Used `git diff fa4bba47 1bb253c9 -- <path>`."
  - "Rename-class changes are OUT of scope (MERGE-02, Pitfall 1, Phase 71): get-shit-done/->gsd-core/ paths, gsd-sdk->gsd-tools CLI name, and @opengsd/get-shit-done identity string are all NOT adopted."
  - "Genuine functional deltas integrated: Write-contract/truncation-fallback blocks, Edit-tool frontmatter additions, doc-writer Edit-based fix mode, verifier {phase_num}-UAT.md sink rename, config query subcommand fix, review --agy/--antigravity option."
  - "Fork patches preserved (D-02, no conformance): Eta `<%~ include() %>` references (not upstream @~/.claude runtime refs), positive-framing rule wording, no-issue-citation lines, fork identity strings, fork's richer config pre-flight block."
patterns-established:
  - "Net-addition detection: normalize rename tokens, subtract matched -/+ pairs, then comm against the current fork to isolate genuinely-new upstream content vs fork rewrites that merely look removed."
requirements-completed: [MERGE-03, D-01, D-02]
duration: 25min
completed: 2026-06-11
---

# Phase 69 Plan 04a: Tier 4a Prompt-Content Hand-Merge (agents/ + commands/gsd/) Summary

**Folded upstream v1.3.1 functional deltas into the fork's `agents/gsd-*.md` and `commands/gsd/*.md` per-file — Write-contract blocks, Edit-tool additions, the verifier UAT filename, the antigravity review option, and a config `query` fix — while preserving every fork patch (Eta includes, `gsd-sdk` CLI name, `get-shit-done/` paths, positive framing) and adopting NO rename.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-06-11
- **Tasks:** 2
- **Files modified:** 9 (7 agents + 2 commands)

## Accomplishments

### Task 1 — agents/ (7 integrated, 13 correctly skipped)

Of the 20 agent files upstream touched, 7 had genuine non-rename functional deltas to integrate:

| Agent | Genuine upstream delta integrated |
|-------|-----------------------------------|
| gsd-debug-session-manager.md | Add `Edit` to tools allowlist |
| gsd-verifier.md | UAT sink filename `HUMAN-UAT.md` → `{phase_num}-UAT.md` |
| gsd-executor.md | Write contract block (single-Write default + truncation fallback) in `<summary_creation>` |
| gsd-planner.md | Write contract block before file-naming section |
| gsd-research-synthesizer.md | Rule 6 (large-file/truncation fallback) appended to existing hard-rules block |
| gsd-phase-researcher.md | `Edit` tool + Write contract block in Step 10 |
| gsd-doc-writer.md | `Edit` tool + Edit-based fix mode (surgical replacement, never Write on existing file) + rule 9 |

13 agents skipped — upstream's only change was rename-class or the genuine delta was already present in the fork:
- **Already present:** gsd-ai-researcher, gsd-eval-planner (Edit already in tools); gsd-domain-researcher, gsd-ui-researcher, gsd-project-researcher (Write contract already present); gsd-roadmapper (granularity retune + folding guidance already present).
- **Rename/identity only:** gsd-code-fixer, gsd-debugger, gsd-eval-auditor, gsd-framework-selector, gsd-plan-checker, gsd-user-profiler (pure `get-shit-done/`↔`gsd-core` / `gsd-sdk`↔`gsd-tools`); gsd-intel-updater (`@opengsd/get-shit-done` identity rename — fork keeps its own identity string).

### Task 2 — commands/gsd/ (2 integrated, 59 skipped)

Of 61 command files upstream touched, only 2 had genuine net-new functional content:

| Command | Genuine upstream delta integrated |
|---------|-----------------------------------|
| commands/gsd/config.md | `--profile` table row: add missing `query` subcommand (`gsd-sdk query config-set-model-profile`) |
| commands/gsd/review.md | `--agy` / `--antigravity` Antigravity CLI review option (argument-hint + flag list) |

The other 59 command deltas were entirely rename-class. The fork's command files reference workflows/references via **Eta `<%~ include() %>`** (build-time inlining) rather than upstream's `@~/.claude/...` runtime references — these are fork patches preserved, not missed upstream content. Upstream's condensed config pre-flight one-liner was deliberately NOT adopted (the fork's richer multi-step pre-flight block is a fork patch).

## Task Commits

| # | Commit | File |
|---|--------|------|
| 1 | 77d2398b | agents/gsd-debug-session-manager.md |
| 2 | e0710ce7 | agents/gsd-verifier.md |
| 3 | a862794a | agents/gsd-executor.md |
| 4 | 5513c247 | agents/gsd-planner.md |
| 5 | e158313f | agents/gsd-research-synthesizer.md |
| 6 | 3ed2d37e | agents/gsd-phase-researcher.md |
| 7 | e605fd41 | agents/gsd-doc-writer.md |
| 8 | 6b6a52d5 | commands/gsd/config.md |
| 9 | 530a14b3 | commands/gsd/review.md |

All ordinary single-parent follow-up commits (D-08) — merge stays closed (no MERGE_HEAD).

## Deviations from Plan

### [Plan-mechanics correction] Delta base is the true merge-base, not `git merge-base HEAD 1bb253c9`

- **Found during:** initial diff setup (before Task 1).
- **Issue:** The plan/research prescribe `git diff $(git merge-base HEAD 1bb253c9) 1bb253c9 -- <path>` to see upstream's functional change. Post-merge, `1bb253c9` is an ancestor of HEAD, so `git merge-base HEAD 1bb253c9` returns `1bb253c9` itself and the diff is EMPTY — it would have shown no upstream change for any file.
- **Fix:** Used the true common ancestor `fa4bba478` (= `git merge-base pre-merge-v1.3.1-backup 1bb253c9`) as the diff base: `git diff fa4bba478 1bb253c9 -- <path>`. This surfaces upstream's actual functional deltas.
- **Files modified:** none (diagnostic mechanics only).
- **Commit:** n/a.

### [Scope clarification] `gsd-sdk` → `gsd-tools` treated as rename-class (not adopted)

- **Found during:** Task 1 (agent diffs).
- **Issue:** Upstream renamed the CLI invocation `gsd-sdk` → `gsd-tools` throughout. The fork's sacred bin map (D-04) keeps `gsd-sdk` as the canonical name (it aliases both), and the fork's agents use `gsd-sdk query` (59 occurrences). Adopting the text rename would pre-adopt the Phase 71 rename.
- **Fix:** Classified `gsd-sdk`↔`gsd-tools` alongside `get-shit-done/`↔`gsd-core/` and `@opengsd/get-shit-done` as rename/identity changes — preserved fork form, integrated only genuine functional content.

## Issues Encountered

None blocking. The dominant subtlety was distinguishing genuine upstream additions from fork rewrites that merely *look* like removed upstream lines (Eta includes, positive-framing rewrites, stripped issue citations). Resolved with a normalize→subtract-matched-pairs→comm-against-fork detection pass.

## Requirements Satisfied

| ID | Description | Status |
|----|-------------|--------|
| MERGE-03 | Per-file commits, no mega-commit, no bulk `-X theirs` on prompt content | SATISFIED (9 per-file follow-up commits; all hand-integrated) |
| D-01 | Hand-merge per-file; integrate upstream functional changes | SATISFIED |
| D-02 | Preserve fork patches; no positive-framing/quality conformance pass | SATISFIED |

## Known Stubs

None — prompt-content edits only.

## Threat Flags

None — no network endpoints, auth paths, or file-access surface introduced.

## Next Phase Readiness

Tier-4a (agents + commands) integrated. Ready for 69-04b (`get-shit-done/` workflows/references/templates) and 69-04c (docs/READMEs/CONTRIBUTING). The `get-shit-done/`→`gsd-core/`, `gsd-sdk`→`gsd-tools`, and `@opengsd/get-shit-done` rename adoption remains deferred to Phase 71.

## Self-Check

- [x] All 9 modified files exist on disk and are committed
- [x] No conflict markers in agents/ or commands/gsd/
- [x] No agent gained a `skills:` frontmatter key
- [x] No `gsd-core/` path leaked into touched agent files
- [x] Merge stays closed (no MERGE_HEAD); on branch `dev`; no worktree; no rename adoption

---
*Phase: 69-merge-execution-ordered-conflict-resolution*
*Completed: 2026-06-11*
