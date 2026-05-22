# Plan: Positive Framing Pass — GSD Files

## Context

GSD prompt files accumulate negative framing over time — instructions written as "do not X / never X / avoid X" that tell the model what to move away from without specifying where to move toward. Per `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md` Step 2, these must be converted to positive directives.

Run this plan after each upstream merge pass. `tests/negative-framing-scan.test.cjs` automates identification — it scans all four prompt content directories and reports violations. Use this plan to fix what the test finds.

**Scope:** `agents/`, `get-shit-done/workflows/`, `get-shit-done/references/`, `commands/gsd/`  
**Templates excluded:** user-facing boilerplate, not AI prompts

---

## Step 1 — Identify Violations

```bash
npm test -- --test-name-pattern="negative-framing"
```

The test output lists each violation as: `file:line — matched text`. If all 34 subtests pass, the corpus is clean — stop here.

---

## Step 2 — Convert Negative to Positive

Every negative instruction must be converted to a directive that states **what to do instead** — not merely what to stop doing. The replacement must describe a concrete, affirmative behavior.

Common patterns:

| Negative (remove) | Positive (replace with) |
|---|---|
| `do not fabricate X` | `base X on verified codebase facts` |
| `never X` (behavioral) | `always Y` or `Y only` |
| `never X` (scope) | `X only; treat the choice as settled` |
| `do not return X` (when positive already stated) | Remove the clause — the positive covers it |
| `do not proceed` | `stop here` or `stop and report the blocking condition` |
| `do not skip` | `execute always` or `execute regardless of prior steps` |
| `do not re-ask` | `use existing answers` or `treat prior decisions as authoritative` |
| `never hardcode X` | `always resolve X at runtime via variable` |
| `do not guess` | `look it up first` or `derive from evidence only` |
| `do not auto-invoke` | `present as next steps for the user to choose` |
| `never make multiple changes simultaneously` | `make one change at a time` |
| `never git add -A / git add .` | `stage specific files individually by name` |
| `never assume completion` | `wait for explicit user confirmation before proceeding` |

**Constraint pair rule:** If removing a negative leaves only a prohibition with no positive alternative, add the positive. Both parts must be present.

---

## Step 3 — Preserve Valid Exceptions

The scanner classifies these patterns as non-violations — confirm they remain unchanged after edits:

- **Paired reframe:** `"Your job is not to X — it is to Y"` — displaces a specific model default; paired negative + positive is intentional
- **Security paired:** `"Never X — always Y"` (D-07 patterns) — valid reframe; the negative clause stays because the positive complement is immediately present
- **Factual / conditional:** `"If X does not exist..."` — flow control, not a behavioral directive
- **Teaching content:** Appears inside an example, code block, or anti-patterns table

---

## Step 4 — Verify

```bash
npm test -- --test-name-pattern="negative-framing"
```

All 34 subtests must pass. If any fail, the scanner output identifies the remaining violations — repeat Step 2 for each.

Then run the full suite to catch any accidental structural regressions:

```bash
npm test
```

---

## Conventions to Preserve

- **Agent YAML frontmatter** (`name`, `description`, `tools`, `color`, optional `hooks`): preserve exactly
- **File-writing agents** (any with `Write` in tools): must retain the `Only use the Write tool` instruction string
- **XML tags** (`<persona>`, `<intent>`, `<objective>`, `<task>`, `<constraints>`, etc.): preserve structure; edit only text content inside tags
- **gsd-tools.cjs CLI calls** in workflows: functional code, not prompt content — do not alter
