# Requirements: GSD — Prompt-Engineered Fork

**Defined:** 2026-06-10
**Milestone:** v2.3.1-a Upstream v1.3.1 Merge & Rename Adoption
**Core Value:** Every agent, command, and workflow file on `main` meets the fork's prompt engineering quality bar before it ships

**Milestone goal:** Land the upstream merge to tag `v1.3.1` (`open-gsd/gsd-core`, `1bb253c9`), resolve every conflict preserving critical fork patches, and adopt the `get-shit-done/` → `gsd-core/` directory + npm package/bin rename. A green test suite is **not** a completion gate — failing tests are acceptable and documented as deferred backlog.

## v2.3.1-a Requirements

### Merge Execution

- [x] **MERGE-01**: Before any merge operation, a `pre-merge-v1.3.1-backup` recovery branch exists and a fork-edit inventory (`git diff fa4bba47..HEAD` over fork-owned paths) is captured
- [ ] **MERGE-02**: Upstream tag `v1.3.1` is merged into the fork via `git merge -s ort` with `diff.renameLimit`/`merge.renameLimit` raised to 5000 (shared-history merge — no `--allow-unrelated-histories`, no pre-renaming the directory)
- [ ] **MERGE-03**: All merge conflicts are resolved in documented triage order (`.planning/`+`CLAUDE.md` ours → infrastructure → fork-critical → prompt content per-file → tests → new upstream additions) with incremental committed batches; no single mega-commit and no bulk `-X theirs` on prompt content
- [ ] **MERGE-04**: `package.json` and `package-lock.json` are reconciled (upstream base + fork-specific values preserved) and the lockfile is cleanly regenerated

### Rename Adoption

- [ ] **RENAME-01**: The `get-shit-done/` → `gsd-core/` directory rename is adopted; no stale `get-shit-done/` path literals survive in fork-owned files (except intentional migration-message strings)
- [ ] **RENAME-02**: The npm package/bin rename (`get-shit-done-cc` → `@opengsd/gsd-core`, bin `get-shit-done-redux` → `gsd-core`) is adopted in `package.json`, reconciled against the chosen fork identity
- [ ] **RENAME-03**: c8 coverage globs, CI workflow path triggers, and test require paths / `TOOLS_PATH` helpers (`tests/helpers.cjs`, `tests/helpers/cli-negative.cjs`) are repointed to `gsd-core/`

### Fork-Patch Preservation

- [ ] **PATCH-01**: `bin/install.js` fork patches survive the merge — `ensureHooksDist()`, the six `{{GSD_REPO}}`/`{{GSD_BRANCH}}` replacement sites, and the lib-dir constant — confirmed by grep checks
- [ ] **PATCH-02**: The fork's SHA-based update-check worker (`isNewer()` via GitHub Commits API) is re-applied over upstream's restructured file; upstream's semver/npm approach is **not** adopted
- [ ] **PATCH-03**: Fork-only files that upstream deletes are restored, not silently dropped — `CLAUDE.md`, `.planning/`, `CATALOGUE.json`
- [ ] **PATCH-04**: Fork `bin/lib` additions (`parseModelEffort()`, `resolveReasoningEffortInternal()`, `EFFORT_SET`, `*_effort` init fields) are ported to the corresponding `src/*.cts` TypeScript sources (ADR-457 — no three-way merge possible)

### Guard Integrity

- [ ] **GUARD-01**: The four fork guard tests (`negative-framing-scan`, `step-numbering-scan`, `no-issue-citations`, `cross-file-step-refs`) are restored with `SCAN_DIRS` repointed to `gsd-core/` AND non-empty corpus assertions added to prevent vacuous-green passes
- [ ] **GUARD-02**: `tests/agent-frontmatter.test.cjs` valid-agent list is reconciled with upstream's new/modified agents and `hooks/dist/` is rebuilt via `npm run build:hooks`

### SDK Capability Preservation

- [ ] **SDK-01**: Before accepting upstream's `sdk/` deletion, the fork's `sdk/` capability (`session-runner.ts`, `config.ts`, `model-catalog.ts`, `ws-transport.ts`, and supporting modules) is documented in full detail — purpose, public surface, behavior, and integration points — sufficient for a future milestone to restore the feature compatibly with upstream
- [ ] **SDK-02**: Upstream's `sdk/` deletion is accepted (after SDK-01 documentation is captured), resolving the delete/modify conflicts in upstream's favor

### Verification

- [ ] **VERIFY-01**: The post-merge verification checklist passes — `gsd-core/` exists and is populated, `get-shit-done/` is gone, `node -e "require('./gsd-core/bin/gsd-tools.cjs')"` loads, `npm test` emits no `MODULE_NOT_FOUND`, and the coverage glob reports a real non-zero percentage (no vacuous coverage)
- [ ] **VERIFY-02**: Residual failing tests are enumerated and documented as a deferred conformance-pass backlog; failing tests do not block milestone completion

## Future Requirements

Deferred to later milestones. Tracked but not in this roadmap.

### Prompt Conformance Pass

- **CONF-01**: Apply the fork's positive-framing / no-`skills:` / citation / step-numbering quality bar to the ~110 upstream-modified prompt files merged in v2.3.1-a

### SDK Restoration

- **SDKR-01**: Restore the fork's SDK capability (per SDK-01 documentation) in a form compatible with upstream's post-deletion structure

## Out of Scope

| Feature | Reason |
|---------|--------|
| Green test suite as a completion gate | Explicit milestone constraint — merge correctness is verified structurally, not by test pass count; failing tests are expected and deferred |
| Prompt-quality conformance pass on merged upstream content | Large separate effort; deferred to CONF-01 to keep this milestone scoped to merge + rename |
| Restoring fork `sdk/` features now | Captured as documentation (SDK-01) for a future SDKR-01 milestone; restoring in-merge would balloon scope |
| Adopting upstream's semver/npm update-check worker | Fork deliberately keeps its SHA/GitHub-Commits approach (PATCH-02) |

## Traceability

Which phases cover which requirements. Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MERGE-01 | Phase 68 | Complete |
| MERGE-02 | Phase 69 | Pending |
| MERGE-03 | Phase 69 | Pending |
| MERGE-04 | Phase 69 | Pending |
| RENAME-01 | Phase 71 | Pending |
| RENAME-02 | Phase 71 | Pending |
| RENAME-03 | Phase 70 | Pending |
| PATCH-01 | Phase 70 | Pending |
| PATCH-02 | Phase 70 | Pending |
| PATCH-03 | Phase 69 | Pending |
| PATCH-04 | Phase 70 | Pending |
| GUARD-01 | Phase 70 | Pending |
| GUARD-02 | Phase 70 | Pending |
| SDK-01 | Phase 68 | Pending |
| SDK-02 | Phase 69 | Pending |
| VERIFY-01 | Phase 71 | Pending |
| VERIFY-02 | Phase 71 | Pending |

**Coverage:**
- v2.3.1-a requirements: 17 total
- Mapped to phases: 17 ✓ (Phases 68–71)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-10*
*Last updated: 2026-06-10 — traceability mapped to Phases 68–71 during roadmap creation*
