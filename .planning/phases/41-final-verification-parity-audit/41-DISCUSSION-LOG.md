# Phase 41: Final Verification & Parity Audit - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 41-final-verification-parity-audit
**Areas discussed:** Diff target & scope, Verification automation, Failure handling

---

## Diff Target & Scope

| Option | Description | Selected |
|--------|-------------|----------|
| `backup-thamw-main-before-squash` + exclude `.planning/` | Authoritative pre-squash HEAD (820 unique commits); exclude `.planning/` via pathspec; document allowlist of expected non-planning diffs | ✓ |
| `backup-thamw-main-with-planning` | Side-branch frozen at Phase 36 planning snapshot — suitable as cross-check only, not primary target | |
| Filtered tree-hash script | Binary pass/fail via scripted tree comparison; overkill for one-shot audit | |

**User's choice:** `backup-thamw-main-before-squash` + exclude `.planning/` via pathspec
**Notes:** Research confirmed `backup-thamw-main-with-planning` is a Phase 36-era snapshot — its 16-file delta from the before-squash branch is 100% `.planning/*`. Both approaches yield the same source-tree comparison; using the before-squash branch as primary preserves the authoritative audit story.

---

## Verification Automation

| Option | Description | Selected |
|--------|-------------|----------|
| Inline commands only | Zero new code; no artifact | |
| Verification script (`verify-parity.cjs`) | Mirrors batch-script pattern; 130-200 lines for a read-only audit | |
| Hybrid: inline commands → VERIFICATION.md | Run diff + npm test inline; capture output into 41-VERIFICATION.md; no new script | ✓ |

**User's choice:** Hybrid: inline commands captured into VERIFICATION.md
**Notes:** Research noted that batch scripts were justified by *mutations* (staging, committing, safety guards). Phase 41 is read-only — no mutations to protect. The `gsd-verifier` VERIFICATION.md format already provides the audit trail; a separate script would add maintenance overhead without adding value.

---

## Failure Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Pure gate for content + inline for `.planning/` only | Diff divergence or test failures in refactored files → stop and document. `.planning/` tracking artifacts → fix inline (don't affect parity). | ✓ |
| Pure gate always | Any failure of any kind triggers a follow-up task | |
| Inline remediation allowed | Fix whatever fails within Phase 41 scope | |

**User's choice:** Pure gate for content + inline for `.planning/` only
**Notes:** REQUIREMENTS.md explicitly places "Making code or prompt content fixes" out of scope — it violates the zero-diff parity guarantee. The distinction is structural: if a fix touches any file in `git diff backup-thamw-main-before-squash HEAD -- . ':!.planning'`, it is a content fix (pure gate). If the fix only touches `.planning/` files, it is a planning update (inline allowed). Specific example: ROADMAP.md Phase 39 progress row shows "Pending" despite Batch 4 commit being confirmed — safe to update inline.

---

## Claude's Discretion

- Exact format for the `41-VERIFICATION.md` artifact (use Phase 40 VERIFICATION.md as reference)
- Whether to run the negative-framing scanner explicitly or rely on `npm test` (which includes it as a subtest)
- Order of verification checks (diff → `npm test` → scanner confirmation recommended)

## Deferred Ideas

- Filtered tree-hash script (`scripts/verify-parity.cjs`) — useful for future milestones but overkill for this audit
- Backup branch deletion after parity confirmation — post-milestone cleanup, not Phase 41 scope
- Phase 35 / Phase 39 missing VERIFICATION.md tech debt — note for milestone retrospective
