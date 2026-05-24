# Phase 41: Final Verification & Parity Audit - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase validates that the 5 consolidated batches (Batches 1-5) produce 100% byte-for-byte content parity with the pre-squash state, and that the full test suite passes cleanly. Specifically:

1. **VALID-01**: Run a tree diff between consolidated HEAD and `backup-thamw-main-before-squash` (excluding `.planning/`) to verify zero content divergence in refactored files.
2. **VALID-02**: Execute `npm test` to guarantee all 8300+ assertions pass with zero regressions.
3. **VALID-03** (from ROADMAP.md): Scanner checks and tag audits run cleanly with 0 violations and 0 warnings.

All verification is **read-only** — no staging, no mutations to refactored content.

</domain>

<decisions>
## Implementation Decisions

### Diff Target & Scope
- **D-01:** Use `backup-thamw-main-before-squash` as the canonical diff target — it is the authoritative pre-soft-reset HEAD (820 unique commits). `backup-thamw-main-with-planning` is a side-branch frozen at Phase 36 planning snapshot and is suitable as a cross-check only.
- **D-02:** Exclude `.planning/` from the parity diff via pathspec: `git diff backup-thamw-main-before-squash HEAD -- . ':!.planning'`. Planning artifacts added during this milestone (phase docs, state updates, audit files) are acknowledged expected drift, not parity failures.
- **D-03:** Document an allowlist of expected non-planning diffs in the SUMMARY (`.claudeignore`, `.gitignore` with Antigravity entries, `scripts/stage-batch-*.cjs` development artifacts, Nyquist test files added by gsd-validate-phase). Any diff output outside this allowlist is a real parity failure requiring escalation.

### Verification Automation
- **D-04:** Use the hybrid approach — run `git diff` and `npm test` as inline commands; capture raw output into `41-VERIFICATION.md` following the established VERIFICATION.md format. No new script needed: the audit is read-only, and `gsd-verifier`'s standard artifact format already provides the audit trail.
- **D-05:** `41-VERIFICATION.md` serves as the canonical, reproducible audit record. Anyone re-running can read the artifact for the exact commands used and compare against fresh output.

### Failure Handling
- **D-06:** **Pure gate for refactored content** — If diff shows divergence in refactored files OR `npm test` reports failures rooted in refactored content, stop immediately, document findings in `41-VERIFICATION.md`, mark Phase 41 as failed-gate, and spawn a follow-up quick task. REQUIREMENTS.md explicitly places "Making code or prompt content fixes" out of scope (violation of zero-diff parity guarantee).
- **D-07:** **Inline fix allowed for `.planning/`-only artifacts** — Planning tracking artifacts (e.g., ROADMAP.md progress table showing Phase 39 as "Pending" despite Batch 4 being committed, REQUIREMENTS.md traceability table) are safe to update inline since they fall outside the parity diff scope and do not mutate refactored content.
- **D-08:** Decision rule: if a fix touches any file included in `git diff backup-thamw-main-before-squash HEAD -- . ':!.planning'`, it is a content fix → pure gate. If the fix only touches `.planning/` files, it is a planning update → inline fix allowed.

### Claude's Discretion
- Exact format for the `41-VERIFICATION.md` artifact (follow the Phase 40 VERIFICATION.md format as reference)
- Whether to run the negative-framing scanner explicitly or rely on `npm test` (which includes it as a subtest)
- Order of verification checks (diff first, then `npm test`, then scanner — recommended as it surfaces content failures before spending time on the test run)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — VALID-01 and VALID-02 requirements; "Out of Scope" clause banning content fixes during parity audit
- `.planning/ROADMAP.md` — Phase 41 success criteria (zero diff, 8300+ tests passing, scanner clean)
- `.planning/PROJECT.md` — Fork core values and constraints

### Verification Artifact Format Reference
- `.planning/phases/40-stage-and-commit-maintenance-logs-state/40-VERIFICATION.md` — Reference format for VERIFICATION.md embedded command output tables

### Prior Phase Context
- `.planning/phases/39-stage-and-commit-tests-sdk-validation/39-CONTEXT.md` — Batch 4 decisions (STAGE-04 complete, 3d1e663b)
- `.planning/phases/40-stage-and-commit-maintenance-logs-state/40-CONTEXT.md` — Batch 5 decisions; confirms clean working tree as precondition for Phase 41

### Git References
- Backup branch: `backup-thamw-main-before-squash` — canonical pre-squash HEAD
- Backup branch: `backup-thamw-main-with-planning` — side-branch (cross-check only, not primary diff target)
- Tag: `v1.41.2` — the soft-reset target that began this milestone

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `git diff backup-thamw-main-before-squash HEAD -- . ':!.planning'` — the canonical parity diff command
- `npm test` — full test suite (8306 pass, 0 fail, 1 intentional HDOC skip as of v1.41.3)
- `.planning/phases/40-stage-and-commit-maintenance-logs-state/40-VERIFICATION.md` — reference VERIFICATION.md format

### Established Patterns
- VERIFICATION.md tables: each verification check row includes the command run, expected output, and actual output
- Scanner check is a subtest within `npm test` (negative-framing-scan.test.cjs) — no need to run separately
- Phase 39 ROADMAP progress row shows "Pending" but Batch 4 commit `3d1e663b` is confirmed in git log — update ROADMAP.md inline as a `.planning/`-only fix (D-07)

### Integration Points
- Parity diff success → zero output (empty diff = pass)
- `npm test` success → `8306 pass, 0 fail, 1 intentional skip` (or higher if new tests added)
- After successful verification: update STATE.md, mark Phase 41 complete, prepare for `/gsd-complete-milestone`

</code_context>

<specifics>
## Specific Ideas

- Run verification checks in order: (1) parity diff, (2) `npm test`, (3) scanner subtest confirmation — surfaces content failures before spending time on the full test run
- Document the expected-allowlist items (`.claudeignore`, `.gitignore`, batch scripts, Nyquist tests) in the PLAN.md or VERIFICATION.md preamble so the agent has a clear pass/fail checklist
- ROADMAP.md Phase 39 row showing "Pending" is a `.planning/`-only artifact — safe to fix inline per D-07

</specifics>

<deferred>
## Deferred Ideas

- Filtered tree-hash script (`scripts/verify-parity.cjs`) — useful for future milestones with the same consolidation pattern, but overkill for this one-shot Phase 41 audit
- Whether to delete backup branches after parity is confirmed — leave for post-milestone cleanup (not Phase 41 scope)
- Phase 35 / Phase 39 missing VERIFICATION.md tech debt — out of scope for Phase 41; note for milestone retrospective

</deferred>

---

*Phase: 41-Final Verification & Parity Audit*
*Context gathered: 2026-05-23*
