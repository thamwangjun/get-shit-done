---
name: execute-phase-context-analysis
quick_id: 260531-l3h
date: 2026-05-31
status: complete
type: analysis
---

# Quick Task 260531-l3h: execute-phase Context Analysis

Investigation into why `/gsd-execute-phase` shows ~80% context usage on the GSD
statusline *before the first wave runs*, and where the tokens actually go. This
is an analysis/notes artifact — no code was changed.

## TL;DR

- **80% on the GSD statusline ≈ 72% raw** in Claude Code's native `/context`
  (the statusline normalizes against the *usable* band, inflating by ~13 pts).
- Ground-truth `/context` before first wave: **143.5k / 200k (72% raw)**.
- The dominant bucket is **`Messages` (88.8k, 44%)** — which is where the
  command invocation + the **build-expanded ~47k workflow prompt** + init JSON +
  ROADMAP/STATE reads + orchestration tool results all land.
- The static system buckets are smaller than first assumed: System tools 31.7k,
  System prompt 7.4k, Memory 12.6k (CLAUDE.md = 9.4k), Skills only 3k, Custom
  agents only 2.8k.
- **Highest-value lever: shrink the ~47k workflow**, specifically the ~26k of
  *subagent* reference material inlined into the orchestrator's copy via eta
  `<%~ include %>`. `checkpoints.md` (~8.1k) is the single biggest piece.

## File sizes

### `execute-phase.md`

| Metric | Source (`get-shit-done/workflows/`) | Installed (`~/.claude/...`) |
|---|--:|--:|
| Lines | 1,718 | 4,258 |
| Bytes | 82,700 | 186,618 |
| Est. tokens | ~20,675 | **~46,654** |
| Unexpanded eta includes | 8 | 0 |

The source is ~20k; the build step expands all eta `<%~ include %>` directives,
producing the ~47k file the orchestrator actually loads at runtime.

### Includes in `execute-phase.md`

All ~26k of reference material arrives via **eta `<%~ include %>`** (one-line
directives in source, fully inlined in the installed artifact). None is
hand-written inline in source.

**`<required_reading>` (orchestrator-facing), L28-30:**

| File | ~Tokens |
|---|--:|
| references/agent-contracts.md | 1,131 |
| references/context-budget.md | 1,561 |
| references/gates.md | 976 |

**Executor spawn-prompt block `<execution_context>`, L614-618:**

| File | ~Tokens |
|---|--:|
| workflows/execute-plan.md | 6,525 |
| └─ references/git-integration.md *(nested in execute-plan)* | 2,264 |
| templates/summary.md | 1,956 |
| references/checkpoints.md | **8,100** |
| references/tdd.md | 2,671 |
| references/worktree-path-safety.md | 912 |

**`@`-references (runtime pointers, NOT inlined — ~1 line each):**

- references/executor-examples.md (~1,037 tok of content; referenced at L136 in
  prose and L619 in the executor spawn block — both conditional, governed by
  `CONTEXT_WINDOW`)
- references/planner-antipatterns.md (~982 tok)

> **Note on `executor-examples.md`:** the two occurrences are NOT duplicated
> inlined content — both are one-line `@`-pointers. The content is read into the
> *executor subagent's* fresh window at runtime, not the orchestrator's. It does
> **not** bloat `execute-phase.md`.

## Statusline math (`hooks/gsd-statusline.js:316-319`)

```
usableRemaining = (remaining − AUTO_COMPACT_BUFFER_PCT) / (100 − AUTO_COMPACT_BUFFER_PCT) × 100
displayed_used  = 100 − usableRemaining          # AUTO_COMPACT_BUFFER_PCT default = 16.5
```

So the meter scales used % against the usable window (excludes the ~16.5%
auto-compact buffer), inflating the displayed number ~13 pts above raw. The hook
itself documents this (`:329-332`, #2451): the bridge file deliberately writes
`rawUsedPct = 100 − remaining` for the context-monitor warnings to avoid the
inflation. **Rule of thumb: 80% displayed ≈ ~67-72% raw.**

## Ground-truth `/context` before first wave

| Category | Tokens | % | Addressable? |
|---|--:|--:|---|
| **Messages** | **88.8k** | 44% | ← workflow prompt + tool outputs live here |
| System tools | 31.7k | 15.9% | No — fixed CC tool schemas |
| Memory files | 12.6k | 6.3% | Partly — CLAUDE.md = 9.4k |
| System prompt | 7.4k | 3.7% | No |
| Skills | 3.0k | 1.5% | No — ~30 tok/skill, ~80 skills |
| Custom agents | 2.8k | 1.4% | No — metadata only |
| (Autocompact buffer) | 33k | 16.5% | Reserved |

## Corrections to earlier hypotheses

- **Skills trimming via `/gsd-surface` is NOT worth it** — the ~80-skill list is
  only ~3k total (names/descriptions, ~30 tok each). Earlier guess of ~40k was
  wrong.
- **Custom agent definitions do NOT load into the orchestrator** — only 2.8k of
  metadata. The 49k `gsd-executor.md` body loads into the *executor's* fresh
  window (context isolation works as designed).
- **init JSON does NOT embed full PLAN.md bodies** — `cmdInitExecutePhase`
  (`init.cjs:150`) returns plan *metadata* (`plans[]` with id/wave/objective/
  files_modified/task_count), not plan content. Wave grouping likewise comes
  from a metadata-only CLI query (workflow L332).
- The big static cost is **System tools (31.7k)** + the **workflow in Messages**,
  not the system prompt.

## `checkpoints.md` deep-dive (the single biggest inlined ref, ~8.1k)

Defines GSD's human-in-the-loop system — when execution pauses for a human vs.
what Claude must automate.

- **3 checkpoint types:** `human-verify` (90%), `decision` (9%),
  `human-action` (1%), plus `tdd-review` (advisory).
- **Golden rule:** if Claude can run it (deploy, start server, set env vars,
  migrations), Claude must — never ask the human to run CLI.
- **Bulk of the file is examples + reference tables**, not rules: service CLI
  cookbook (Vercel/Railway/Fly/Stripe/Supabase/GitHub…), dev-server start/ready
  tables, env-var automation, CLI auto-install rules, ~10 BAD/GOOD XML
  anti-pattern pairs, ASCII checkpoint banners.
- **Default is now `human_verify_mode = end-of-phase` (#3309, L21-25)** — most
  mid-flight checkpoints are suppressed on new projects, yet the full 8.1k is
  inlined into the executor spawn prompt on every run.
- Much of the content is *planner-authoring guidance* and *service-automation
  cookbook* — not what an executor strictly needs at execution time.

## Recommended levers (ranked by payoff)

1. **Trim the ~47k workflow / its ~26k of inlined subagent refs.** Prime
   targets: `checkpoints.md` (8.1k) and `execute-plan.md`+`git-integration.md`
   (8.8k combined). Candidate fix: convert the executor-block eta includes
   (L614-618) to a runtime `@`-pointer the subagent reads itself, so the
   orchestrator stops carrying ~20k it never executes. Win shows up after
   rebuild/reinstall.
2. **Slim `CLAUDE.md` (9.4k)** — helps every command/session, not just
   execute-phase. Much of it is an auto-generated tech-stack/conventions dump.
3. System tools (31.7k) and system prompt (7.4k) are fixed CC overhead — not
   addressable here.

## Open follow-up (not yet verified)

**Does `gsd-executor.md` already deliver the same checkpoints/execute-plan/tdd
content to the subagent?** If so, inlining those into the orchestrator's
spawn-prompt block is pure orchestrator-side waste (~15-20k reclaimable from
`Messages`). This is the one finding that could be a genuine bug rather than
expected cost — worth confirming before any trim.

## Method notes

- File sizes via `wc`; token estimates use bytes/4 (rough). `/context` figures
  are Claude Code's own native reporting (more accurate than bytes/4).
- No source files were modified by this task.
