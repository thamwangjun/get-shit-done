# Context Decomposition: `execute-phase.md`

**Analyzed:** 2026-06-03
**Target:** `get-shit-done/workflows/execute-phase.md`
**Question:** What is the full decomposition of the context this workflow consumes — including eta includes and nested eta includes?

---

## TL;DR

| Layer | What | Chars | ~Tokens (÷4) |
|-------|------|------:|------:|
| Source file (raw, with `<%~ include %>` tags) | `execute-phase.md` on disk | 83,249 | ~20,800 |
| **Rendered file (installed)** | source + all 5 eta includes inlined | **127,734** | **~31,900** |
| — of which: orchestrator's own reading context | base body + 3 top-level includes | 97,629 | ~24,400 |
| — of which: executor subagent prompt (nested in spawn block) | 2 includes inside `<execution_context>` | 30,105 | ~7,525 |
| Runtime `init.execute-phase` JSON payload | metadata only (paths + inventory) | ~1,643 | ~410 |
| Lazy `@`-reference pointers | **not auto-loaded** (read on demand) | up to ~58,992 | ~14,750 |
| Runtime data files (Read on demand) | STATE.md, ROADMAP.md, PLAN.md(s) | variable | variable |

**Key finding:** "Context consumed" is not a single number. The workflow is rendered **once at install time** (eta includes are expanded then, not at runtime), producing a ~127.7 KB / ~32K-token file. But that rendered text splits into two audiences: ~24.4K tokens the **orchestrator** reads, and ~7.5K tokens that live inside the **executor spawn prompt** and are only ever paid by each spawned subagent (in its own fresh 200K window). On top of the static template sit a small runtime JSON payload and a set of **lazy `@`-references** that are pointers, not inlined content — they cost nothing unless an agent chooses to read them.

---

## 1. How rendering works (eta is install-time, not runtime)

The eta template engine runs inside `bin/install.js` (`const { Eta } = require('eta')`, line ~1749), with the source root set to the repo. When GSD is installed into a target runtime (`~/.claude/`, etc.), every `<%~ include('...') %>` directive in a workflow is **expanded inline** and the resulting fully-rendered Markdown is written to the install location.

Consequences:
- At **runtime**, the orchestrator reads an already-flattened file. There is no runtime template resolution.
- The include directives themselves (`<%~ include('…') %>`) cost ~300 chars total in the source and are **replaced** by the included file contents during render.
- `@~/.claude/...` and `@.planning/...` strings are **plain text pointers**, NOT eta includes. They are never expanded by eta. They cost only the bytes of the pointer line unless an agent actively `Read`s the target.

---

## 2. Eta include tree (static template)

`execute-phase.md` contains **5** `<%~ include %>` directives. There are **no second-level (nested) eta includes** — every included file was checked and none of the 5 contains a further `<%~ include %>`. So the eta tree is exactly one level deep.

```
execute-phase.md  (83,249 chars source)
│
├─ [required_reading — ORCHESTRATOR context, lines 28-30]
│   ├─ <%~ include references/agent-contracts.md      →  4,527 chars
│   ├─ <%~ include references/context-budget.md       →  6,246 chars
│   └─ <%~ include references/gates.md                →  3,907 chars
│                                          subtotal:    14,680 chars  (~3,670 tok)
│
└─ [execution_context — EXECUTOR SUBAGENT prompt, lines 602/606]
    ├─ <%~ include workflows/execute-plan.md          → 26,457 chars
    └─ <%~ include references/worktree-path-safety.md →  3,648 chars
                                               subtotal: 30,105 chars  (~7,525 tok)
```

**Nesting note:** `execute-plan.md` (26,457 chars) is itself a full workflow but contains **zero** eta includes — it does not pull in further fragments. This is the largest single included file and the most important contributor to subagent context. It is inlined into the `<execution_context>` block of the `gsd-executor` spawn prompt, so the orchestrator carries its text (to emit it) but the *cost is incurred by each executor* in its own fresh window.

### Rendered-size arithmetic

```
rendered = source − directive_overhead + Σ(included file sizes)
         = 83,249 − 300 + (4,527 + 6,246 + 3,907 + 26,457 + 3,648)
         = 83,249 − 300 + 44,785
         = 127,734 chars   (~31,900 tokens)
```

---

## 3. Two audiences inside one rendered file

The single rendered file is not all consumed by one context window. It splits:

### 3a. Orchestrator context (~97,629 chars / ~24,400 tok)
The orchestrator reads the **entire** rendered workflow to follow it — including the executor spawn block (it must emit that block verbatim into an `Agent()` call). So in raw terms the orchestrator's reading window holds all 127,734 rendered chars. But the *semantically orchestrator-owned* portion is:
- the workflow body (≈ source minus the 30,105 chars of execution_context includes that belong to the subagent) ≈ 82,949 chars, **plus**
- the 3 top-level `required_reading` includes (14,680 chars).

→ ~97,629 chars are "the orchestrator's instructions." The remaining ~30,105 chars are payload it forwards.

### 3b. Executor subagent context (~30,105 chars / ~7,525 tok, per spawn)
Inlined into the `<execution_context>` of the `gsd-executor` spawn prompt:
- `execute-plan.md` — 26,457 chars
- `worktree-path-safety.md` — 3,648 chars

Each spawned executor gets these in a **fresh 200K-token window** (the GSD "context rot" design). N parallel executors = N × ~7,525 tokens, but never against the orchestrator's budget.

---

## 4. Runtime `init` payload (dynamic, small)

`init.execute-phase` (`bin/lib/init.cjs:150 cmdInitExecutePhase`) returns a **metadata-only JSON object** — models, config flags, phase inventory, file *paths*, and existence booleans. It does **not** inline the contents of STATE.md / ROADMAP.md / PLAN.md.

- Measured payload in this repo (phase 55.2): **1,643 chars (~410 tokens)**.
- Scales with plan count (the `plans` / `incomplete_plans` arrays), not with file contents.

This is the only "compound context loading" at runtime, and it is deliberately lean.

---

## 5. Lazy `@`-reference pointers (NOT auto-loaded)

These appear as plain-text pointers and are read **only on demand** by whichever agent needs them. They contribute their pointer-line bytes to the static file but their *target contents* are never auto-loaded:

| Pointer (where) | Target | Target size | Loaded by |
|-----------------|--------|------------:|-----------|
| `references/executor-examples.md` (line 126, 607) | deviation/checkpoint examples | 4,149 | executor, on deviation/checkpoint |
| `references/planner-antipatterns.md` (line 127) | anti-pattern lists | 3,929 | planner (mentioned, not used here) |
| `templates/summary.md` (line 603) | SUMMARY.md structure | 7,826 | executor, when writing summary |
| `references/checkpoints.md` (line 604) | checkpoint segmentation rules | 32,402 | executor, on checkpoint task |
| `references/tdd.md` (line 605) | red-green-refactor cycle | 10,686 | executor, on TDD/behavior task |
| **Total potential on-demand** | | **58,992** | **~14,750 tok** |

`references/checkpoints.md` alone (32,402 chars) is larger than every eta-inlined fragment combined — keeping it as a lazy pointer rather than an eta include is a deliberate budget decision. If it were inlined it would dominate the executor prompt.

---

## 6. Runtime data files (Read on demand)

Read via the `Read` tool by orchestrator/agents, sizes are project-specific. As a concrete example from this repo:

- `STATE.md` — 6,491 chars (~1,620 tok) — read by orchestrator at start (`required_reading`)
- `ROADMAP.md` — 38,168 chars (~9,540 tok) — read when phase resolution needs it
- `PLAN.md`(s) — one per plan in the phase, variable

These are the most variable component and the reason init returns *paths* rather than contents.

---

## 7. Full decomposition (one view)

```
ORCHESTRATOR WINDOW (one, persistent)
├─ Rendered execute-phase.md it reads ............ 127,734 ch  ~31,900 tok
│   ├─ workflow body (orchestrator-owned) ......... ~82,949 ch
│   ├─ eta: agent-contracts.md .....................  4,527 ch  ┐ top-level
│   ├─ eta: context-budget.md .......................  6,246 ch  │ includes
│   ├─ eta: gates.md ................................  3,907 ch  ┘ (~3,670 tok)
│   └─ executor spawn block it forwards ........... 30,105 ch  (paid by subagent)
│       ├─ eta: execute-plan.md ................... 26,457 ch
│       └─ eta: worktree-path-safety.md ...........  3,648 ch
├─ init.execute-phase JSON .........................  1,643 ch  ~410 tok
├─ STATE.md (Read) ................................. ~6,491 ch  ~1,620 tok
└─ ROADMAP.md / PLAN.md (Read, as needed) ......... variable

EACH EXECUTOR SUBAGENT (fresh 200K window, ×N waves)
├─ execution_context (from spawn block) ........... 30,105 ch  ~7,525 tok
├─ agent-skills payload (runtime) ................. variable (0 here)
├─ PLAN.md for its plan ........................... variable
└─ lazy @-refs IF triggered ...... up to 58,992 ch  ~14,750 tok
    (checkpoints 32,402 · tdd 10,686 · summary 7,826 · executor-examples 4,149)
```

---

## 8. Conclusions

1. **One level of eta nesting, not deep.** `execute-phase.md` → 5 includes → 0 further includes. No nested eta includes exist.
2. **Rendered static template ≈ 32K tokens**, expanded once at install time. The orchestrator does not pay any runtime templating cost.
3. **~24% of the rendered file (the 30,105-char execution_context) is not orchestrator context** — it is executor-subagent payload that the orchestrator merely forwards. Counting it against the orchestrator overstates its budget.
4. **The biggest single inlined contributor is `execute-plan.md` (26.5 KB)** — and it correctly lives in the subagent prompt, not the orchestrator's instructions.
5. **The heaviest reference, `checkpoints.md` (32.4 KB), is deliberately NOT inlined** — it is a lazy `@`-pointer paid only when a checkpoint task occurs. The same applies to `tdd.md`, `summary.md`, and `executor-examples.md` (~59 KB of potential on-demand content kept out of the base budget).
6. **Runtime context is lean by design:** `init` returns metadata + paths (~410 tok), deferring large file contents to on-demand `Read`. This is the core GSD lever for keeping each window under budget.

### Char→token caveat
Token figures use the ~4 chars/token rule of thumb. Markdown with code fences, tables, and paths tends to tokenize slightly denser, so real token counts may run ~5-15% higher. Treat the token columns as estimates, the char columns as exact.
