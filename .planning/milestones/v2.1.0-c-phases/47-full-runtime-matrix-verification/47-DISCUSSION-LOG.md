# Phase 47: Full Runtime Matrix + Verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-29
**Phase:** 47-full-runtime-matrix-verification
**Areas discussed:** GATE-03 interpretation, Runtime matrix breadth, Copilot transformation test

---

## GATE-03 Interpretation

Initial question: How should the test handle the gap between GATE-03's literal `grep -r '@~/.claude/'` and TEST-01's line-anchored `/^@~\/.claude\//m` regex, given 38 intentional inline prose refs survive in installed output?

**First prompt:**

| Option | Description | Selected |
|--------|-------------|----------|
| Update GATE-03 to line-anchored | Align with TEST-01, inline prose refs are intentional, clean | ✓ |
| Accept inline refs as known exceptions | Keep GATE-03 as-is, document 38 inline refs as intentional exceptions | |
| You decide | Claude picks the approach | |

**User's choice:** Update GATE-03 to line-anchored

**Correction (mid-discussion):** User clarified that inline refs should NOT be exempted via line-anchoring. The correct approach is: use a non-line-anchored check (GATE-03 literal), but maintain an explicit exception list (`ALLOWED_INLINE_REFS`) for known valid inline refs. Test failures must be actionable — the agent must be able to determine whether a new failure is a valid exception or a real unresolved template.

**Exception list location:**

| Option | Description | Selected |
|--------|-------------|----------|
| Inline in test file | `ALLOWED_INLINE_REFS` array in install-eta-regression.test.cjs | ✓ |
| Separate fixture file | JSON/text file in tests/fixtures/ | |

**User's choice:** Inline in the test file

**Notes:** The key requirement is actionable failure messages — when a new `@~/.claude/` ref is found outside the allowlist, the test must tell the agent whether to add it to the allowlist or fix it as an unresolved Eta template.

---

## Runtime Matrix Breadth

| Option | Description | Selected |
|--------|-------------|----------|
| Claude + Gemini + Copilot | 3 representative runtimes, distinct path-rewriting branches | |
| Claude only | TEST-01 covers Claude; other runtimes share the same code path | ✓ |
| All 14+ runtimes | Exhaustive but slow, diminishing returns | |

**User's choice:** Claude only

**Notes:** Trust the shared `_applyRuntimeRewrites` code path. Claude-only coverage is sufficient for this milestone.

---

## Copilot Transformation Test

| Option | Description | Selected |
|--------|-------------|----------|
| Add it in Phase 47 | New test for Copilot `Read`→`read` transformation in inlined content | |
| Close as out-of-scope | Update REQUIREMENTS.md, tool-name transformation is a separate concern | ✓ |
| You decide | Claude picks based on milestone coherence | |

**User's choice:** Close as out-of-scope

**Notes:** Tool-name transformation is orthogonal to Eta include resolution. REQUIREMENTS.md TEST-03 gap to be struck through with rationale.

---

## Claude's Discretion

- Exact format of `ALLOWED_INLINE_REFS` entries (string, prefix match, or regex) — use simplest form
- Whether to add per-entry comments explaining why each ref is allowed
- Whether failure message reports count of allowlisted refs or just the unexpected ones

## Deferred Ideas

- Copilot tool-name transformation test — future milestone focused on non-Claude runtime quality
- Non-Claude runtime matrix tests (Gemini, Copilot via `installRuntimeArtifacts`) — deferred, trusted to shared code path
