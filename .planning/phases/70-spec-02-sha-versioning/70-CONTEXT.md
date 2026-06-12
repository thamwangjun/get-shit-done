# Phase 70: spec-02 SHA Versioning - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase writes the body of `.planning/spec/02-sha-versioning/SPEC.md` — a behavioral-contract specification of the SHA-based versioning system and its coordination topology across the five files that implement it, durable enough that a reimplementer can rebuild the system on a refactored upstream without reading the current source.

The phase fills an existing stub (frontmatter + 7-section skeleton already created in Phase 68). It does NOT modify install.js, the update worker, the statusline, `check-latest-version.cjs`, or `update.md` — it specifies them. The 7-section template, the `NN-INV-M` invariant-ID scheme, the status vocabulary, and the source-of-truth hierarchy are all LOCKED by Phase 68's `00-CONVENTIONS.md` and are inherited verbatim. The only open work is authoring the spec body: Purpose, Scope, Invariants, Acceptance Tests table, Key Decisions, Code Context — and advancing Status from `Draft` to `Ready`.

The system spans: install.js git-SHA emit + `{{GSD_REPO}}`/`{{GSD_BRANCH}}`/`{{GSD_VERSION}}` placeholder substitution; the `no-network` sentinel; the update worker's GitHub Commits API call with `isNewer` SHA-equality; the `check-latest-version.cjs` injectable seam; statusline display; and `update.md`'s SHA-equality migration. The tier-1 normative sources are the version/semver/SHA test files — the tests ARE the spec; the SPEC.md is a faithful, move-proof narration of what they assert.

</domain>

<decisions>
## Implementation Decisions

### Invariant Decomposition
- **D-01:** Group invariants by **behavioral role**, not one-per-test and not a single mega-invariant. Target **~6 numbered invariants** (`02-INV-1`..`02-INV-6`):
  1. **SHA emit at install** — install.js derives the installed version from `git rev-parse --short`; no GitHub API call at install time (tier-1: `version-detection.test.cjs` INST-01).
  2. **no-network sentinel** — when git SHA cannot be derived, install.js initializes the version to a non-SHA sentinel; it MUST NOT fall back to `pkg.version`/semver (INST-02; see D-05).
  3. **SHA-equality comparison** — `isNewer` compares 7-char-truncated SHAs for equality; `null`/`undefined`/empty `latest` yields no false-positive "update available"; it MUST NOT perform semver ordering (`semver-compare.test.cjs`).
  4. **Update source = GitHub Commits API** — the worker fetches the latest SHA from the fork's GitHub Commits API over `https.get`; it MUST NOT contact npmjs.com or reference the upstream npm package (`semver-compare.test.cjs` HOOK-04; `bug-2992` `GITHUB_API_URL`).
  5. **check-latest-version.cjs seam contract** — the seam exposes a constant endpoint and a `CHECK_REASON` enum, returns `{ ok: true, sha }` (7-char-truncated) on success, and `FAIL_FETCH_FAILED` / `FAIL_INVALID_SHA` on the documented error paths (`bug-2992-check-latest-version.test.cjs`).
  6. **Display** — statusline and `update.md` present SHA labels (`Installed SHA:` / `Latest SHA:`) and contain no `parseV()` semver block and no `isDevInstall` dev-install branch (`statusline-sha.test.cjs` STAT-01/02; `update-sha-migration.test.cjs` D-07–D-11).
  - The `{{GSD_REPO}}`/`{{GSD_BRANCH}}`/`{{GSD_VERSION}}` placeholder substitution (INST-03/INST-04) folds into invariant 1 as the emit boundary (see D-06), keeping the count at ~6.
  - Rationale: keeps the Acceptance Tests traceability table legible and move-proof; each invariant maps to an identifiable subtest cluster. Mirrors Phase 69's D-01. Rejected one-per-test (table rots every upstream merge) and single mega-invariant (not falsifiable at subtest granularity — fails the QUAL traceability bar).

### Tier-1 Test Mapping
- **D-02:** **Every MUST invariant traces to a real subtest — no `[MISSING — write test first]` rows.** The stub's two named evidence files (`version-detection.test.cjs`, `semver-compare.test.cjs`) **expand to five tier-1 sources**: add `statusline-sha.test.cjs`, `update-sha-migration.test.cjs`, and `bug-2992-check-latest-version.test.cjs`. The live GitHub network call is never exercised live, but its contract is fully covered via the injectable seam (mocked fetch in `bug-2992`) plus source-grep assertions (HOOK-04) — so no MISSING row is warranted.
- **D-03:** **`gsd-check-update-worker-platform-gate.test.cjs` is EXCLUDED** from this spec's tier-1 mapping. The win32 `shell: true` gating it asserts is a platform-security concern of the spawn primitive, not SHA-versioning behavior. Record it as an explicit Out-of-Scope bullet with that one-line rationale.

### Sentinel & Seam Placement (invariant + Key Decision, the Phase 69 D-04 pattern)
- **D-04:** The **`no-network` sentinel** is both a **MUST invariant** (observable: INST-02 asserts the initial value; `update-sha-migration` D-10 asserts it is never an equality-branch target) **and a locked Key Decision** recording the semantic: *the sentinel signals an invalid install, not an empty string, and is never compared for equality.* Both are required because the observable behavior and the design intent are distinct artifacts.
- **D-05:** The **`check-latest-version.cjs` injectable seam** is a **MUST invariant** for its observable I/O contract (D-01 invariant 5) **plus a locked Key Decision** recording *why it exists*: extracted as an injectable seam so the SHA-check logic is testable deterministically without network access.

### SPEC-04 Boundary
- **D-06:** **SPEC-02 owns the `{{GSD_REPO}}`/`{{GSD_BRANCH}}`/`{{GSD_VERSION}}` placeholder substitution.** These are literal `{{...}}` regex replacements in install.js (INST-03/INST-04) — a *different mechanism* from SPEC-04's Eta `<%~ include() %>` / `@~/` content materialization, so there is no real overlap. Add a one-line Scope note drawing the boundary explicitly ("Eta include materialization is SPEC-04; the literal `{{...}}` repo/branch/version placeholder substitution that wires the SHA into installed hooks is SPEC-02"). **No INDEX dependency edge to SPEC-04** — both remain root nodes in the dependency graph (unchanged from current INDEX).

### Settled Key Decisions mandated by ROADMAP (record as "Settled — do not reopen")
- **D-07:** "**GitHub Commits API, not npmjs.com**" and "**SHA equality, not semver ordering**" are recorded in `## Key Decisions` as settled, each with the consequence of reopening stated (per ROADMAP SC2 / QUAL-05). These are locked by the success criteria, not open for discussion.

### Claude's Discretion
- Exact EARS pattern choice per invariant (Ubiquitous vs Event-driven vs Unwanted-behavior), provided each is a single falsifiable claim mapping to a subtest.
- Exact subtest/assertion-shape strings in the Acceptance Tests table — planner/executor read the actual test files and cite real subtest names.
- Whether placeholder substitution renders as a sub-clause of invariant 1 or warrants splitting to a 7th invariant if the emit invariant becomes overloaded.
- Confidence value to stamp in frontmatter when the body is finalized.
- Whether to update the frontmatter `Reimplementation evidence (tier-1 test):` line to list the expanded set or keep the two primary files with the rest cited in Acceptance Tests.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tier-1 normative sources (the spec narrates these)
- `tests/version-detection.test.cjs` — INST-01 (git rev-parse SHA emit, no install-time GitHub API), INST-02 (no-network sentinel, no semver fallback), INST-03 (`{{GSD_REPO}}`/`{{GSD_BRANCH}}` replacement), INST-04 (`{{GSD_VERSION}}` uses `gsdVersion`, not `pkg.version`).
- `tests/semver-compare.test.cjs` — `isNewer` SHA-equality (7-char truncation, null/undefined/empty safety), HOOK-03 (isNewer defined before use), HOOK-04 (GitHub API endpoint, not npm registry).
- `tests/bug-2992-check-latest-version.test.cjs` — `check-latest-version.cjs` seam contract: `GITHUB_API_URL` constant, `CHECK_REASON` enum, `{ ok, sha }` success + 7-char truncation, `FAIL_FETCH_FAILED` / `FAIL_INVALID_SHA` error paths.
- `tests/statusline-sha.test.cjs` — STAT-01 (no `parseV()` semver block), STAT-02 (no `isDevInstall`/IIFE in stale-hooks logic).
- `tests/update-sha-migration.test.cjs` — D-07 binary SHA equality in `compare_versions`, D-08 no dev-install branch, D-09 SHA labels + up-to-date message, D-10 no-network not an equality-branch target, D-11 three `grep -Eq` SHA patterns.

### Implementation files (advisory — narrate into Code Context)
- `bin/install.js` — git-SHA emit, sentinel init, `{{GSD_REPO}}`/`{{GSD_BRANCH}}`/`{{GSD_VERSION}}` regex replacements.
- `hooks/gsd-check-update-worker.js` — `isNewer`, GitHub Commits API fetch via `https.get`.
- `get-shit-done/bin/check-latest-version.cjs` — the injectable seam.
- `hooks/gsd-statusline.js` — SHA display, post-`parseV` stale-hooks block.
- `get-shit-done/workflows/update.md` — `compare_versions` SHA-equality migration.

### Spec-set conventions (LOCKED — inherited verbatim)
- `.planning/spec/00-CONVENTIONS.md` — the 7-section template, the `NN-INV-M` ID scheme, status vocabulary (`Draft|Ready|Implemented|Verified`), and the source-of-truth hierarchy. The SPEC.md MUST conform exactly — no section drift (Phase 77 rejects drift).
- `.planning/spec/02-sha-versioning/SPEC.md` — the stub being filled (frontmatter + empty section skeleton already present).
- `.planning/spec/INDEX.md` — feature-status manifest; SPEC-02 row, the SPEC-02 → SPEC-03 dependency edge, and the `parseV()` exclusion entry this spec must stay consistent with.

### Milestone scope & requirements
- `.planning/REQUIREMENTS.md` — SPEC-02 handle and the shared QUAL-01–05 quality bars a spec must satisfy to reach `Ready`.
- `.planning/ROADMAP.md` §"Phase 70: spec-02 SHA Versioning" (lines ~811–825) — the three success criteria; also §"Phase 77" for the cross-spec reconciliation this spec must survive.
- `.planning/phases/68-spec-scaffold/68-CONTEXT.md` — Phase 68 decisions (template, ID scheme) that bind this phase.
- `.planning/phases/69-spec-01-positive-framing/69-CONTEXT.md` — sibling Wave-1 spec; its D-01 (role-based invariant grouping), shape-not-count, and advisory-marking patterns are inherited here.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- The five tier-1 test files are fully populated and passing; together they are both the evidence and the structure for the spec. The spec author reads them once and narrates the assertion clusters (INST-*, HOOK-*, STAT-*, D-*, Bug #2992 constants/success/error paths) into invariants and the traceability table.
- Phase 69's completed `01-positive-framing/SPEC.md` is the worked reference for section shape, advisory-marking, and the invariant+Key-Decision split pattern.

### Established Patterns
- The spec is a narration exercise, not a design exercise: the source-of-truth hierarchy puts the tests at tier-1, so any disagreement between a test and a reference doc resolves in favor of the test.
- Advisory marking: every current path/symbol/function name goes under `## Code Context` with `<!-- advisory -->`; no normative claim may rest on it (move-proofing for the upstream refactor).

### Integration Points
- This SPEC.md feeds Phase 73 (SPEC-03 Hooks Build, which depends on SPEC-02) and Phase 77 (Cross-Spec Consistency Review). The Acceptance Tests table must be mechanically checkable (keyed on `02-INV-M`, citing real subtests).
- Status transition `Draft → Ready` happens in this phase and is gated on QUAL-01–05.

</code_context>

<specifics>
## Specific Ideas

- Frontmatter `Reimplementation evidence (tier-1 test):` currently names `version-detection.test.cjs` + `semver-compare.test.cjs`; the body cites five tier-1 files total (D-02).
- The two ROADMAP-mandated Key Decisions are verbatim: "GitHub Commits API, not npmjs.com" and "SHA equality, not semver ordering" (D-07).
- The `no-network` sentinel string appears exactly 3 times in `update.md` and only within `grep -Eq` pattern lines (per `update-sha-migration` D-10) — narrate this as the sentinel's "never an equality branch target" contract, not as a magic count.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. The `gsd-check-update-worker-platform-gate.test.cjs` win32 shell-gating was deliberately excluded (D-03) as a platform-security concern outside the SHA-versioning contract; this is a scope-boundary decision recorded in Out of Scope, not a deferral to a future phase.

</deferred>

---

*Phase: 70-spec-02-sha-versioning*
*Context gathered: 2026-06-12*
