# Phase 70: spec-02-sha-versioning — Research

**Researched:** 2026-06-12
**Domain:** Specification authoring — SHA-based versioning system behavioral contract
**Confidence:** HIGH (all claims derived directly from reading test files and implementation sources in this session)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01 — Invariant decomposition (~6 behavioral-role invariants):**
1. SHA emit at install — install.js derives the installed version from `git rev-parse --short`; no GitHub API call at install time.
2. no-network sentinel — when git SHA cannot be derived, install.js initializes the version to a non-SHA sentinel; MUST NOT fall back to `pkg.version`/semver.
3. SHA-equality comparison — `isNewer` compares 7-char-truncated SHAs for equality; null/undefined/empty `latest` yields no false-positive; MUST NOT perform semver ordering.
4. Update source = GitHub Commits API — worker fetches latest SHA from fork's GitHub Commits API over `https.get`; MUST NOT contact npmjs.com or reference the upstream npm package.
5. check-latest-version.cjs seam contract — exposes a constant endpoint and `CHECK_REASON` enum; returns `{ ok: true, sha }` (7-char-truncated) on success; `FAIL_FETCH_FAILED` / `FAIL_INVALID_SHA` on error paths.
6. Display — statusline and `update.md` present SHA labels (`Installed SHA:` / `Latest SHA:`) and contain no `parseV()` semver block and no `isDevInstall` dev-install branch.
- `{{GSD_REPO}}`/`{{GSD_BRANCH}}`/`{{GSD_VERSION}}` placeholder substitution (INST-03/INST-04) folds into invariant 1 as the emit boundary.

**D-02:** Every MUST invariant traces to a real subtest; tier-1 sources expand from the stub's two named files to five files (add `statusline-sha.test.cjs`, `update-sha-migration.test.cjs`, `bug-2992-check-latest-version.test.cjs`).

**D-03:** `gsd-check-update-worker-platform-gate.test.cjs` is EXCLUDED from tier-1 mapping; it is a platform-security concern, not SHA-versioning behavior. Record as explicit Out-of-Scope.

**D-04:** The `no-network` sentinel is BOTH a MUST invariant AND a locked Key Decision (records semantic: signals invalid install, not empty string, never compared for equality).

**D-05:** The `check-latest-version.cjs` injectable seam is BOTH a MUST invariant (I/O contract) AND a locked Key Decision (records why it exists: testability without network access).

**D-06:** SPEC-02 owns the `{{GSD_REPO}}`/`{{GSD_BRANCH}}`/`{{GSD_VERSION}}` placeholder substitution. Eta `<%~ include() %>` / `@~/` materialization is SPEC-04. Add a one-line Scope note drawing the boundary. No INDEX dependency edge to SPEC-04.

**D-07:** "GitHub Commits API, not npmjs.com" and "SHA equality, not semver ordering" recorded in `## Key Decisions` as settled, each with consequence of reopening stated.

### Claude's Discretion

- Exact EARS pattern choice per invariant (Ubiquitous vs Event-driven vs Unwanted-behavior).
- Exact subtest/assertion-shape strings in Acceptance Tests table.
- Whether placeholder substitution renders as a sub-clause of invariant 1 or splits to a 7th invariant if invariant 1 becomes overloaded.
- Confidence value to stamp in frontmatter when body is finalized.
- Whether to update the frontmatter `Reimplementation evidence (tier-1 test):` line to list the expanded set or keep two primary files with the rest cited in Acceptance Tests.

### Deferred Ideas (OUT OF SCOPE)

None. The `gsd-check-update-worker-platform-gate.test.cjs` win32 shell-gating is explicitly excluded as a scope boundary (D-03), not deferred.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SPEC-02 | `02-sha-versioning/SPEC.md` specifies the SHA-based versioning system — install.js git-SHA emit, `no-network` sentinel semantics, update worker via GitHub Commits API with `isNewer` SHA equality, statusline display, `check-latest-version.cjs` injectable seam, and the `{{GSD_REPO}}`/`{{GSD_BRANCH}}` template placeholder boundary | All six behavioral roles verified against the five tier-1 test files; advisory symbols inventoried from implementation sources. Section 3 (invariant→subtest mapping) and Section 5 (advisory symbol inventory) below enable direct authoring. |
| QUAL-01 | Each spec states behavioral invariants as numbered, falsifiable EARS statements with RFC 2119 strength | Section 3 provides EARS-phraseable claim per invariant; see the mapped assertion shapes. |
| QUAL-02 | Each spec has an Acceptance-Tests traceability table mapping each MUST-level invariant to a test file and subtest name | Section 3 maps each of the 6 invariants to its real subtest names (exact strings from the files). |
| QUAL-03 | Each spec separates normative contract from advisory implementation notes; current file path or symbol marked `<!-- advisory -->` | Section 5 lists all advisory symbols; CONTEXT.md D-04/D-05 clarifies what is normative vs advisory. |
| QUAL-04 | Each spec cites at least one tier-1 (test) or tier-2 (source) artifact | Five tier-1 test files cited; implementation sources cited in Code Context. |
| QUAL-05 | Each spec has a Key Decisions section recording settled decisions with rationale, marked "settled — do not reopen", with the consequence of reopening stated inline | Two ROADMAP-mandated Key Decisions verified and their consequences mapped in Section 4. |

</phase_requirements>

---

## Summary

Phase 70 authors the body of `.planning/spec/02-sha-versioning/SPEC.md`, filling the stub created in Phase 68. This is a narration phase: the five tier-1 test files are the source-of-truth and the SPEC.md faithfully narrates what they assert. No code is written or modified.

The SHA-based versioning system spans five files: `bin/install.js` (git-SHA emit and `{{...}}` placeholder substitution), `hooks/gsd-check-update-worker.js` (SHA equality comparison and GitHub Commits API fetch), `get-shit-done/bin/check-latest-version.cjs` (injectable seam), `hooks/gsd-statusline.js` (display, no-semver assertion), and `get-shit-done/workflows/update.md` (SHA labels and grep-Eq validation). Six behavioral-role invariants cover the system end-to-end with no overlap and no MISSING rows in the traceability table.

The Phase 69 sibling spec (`01-positive-framing/SPEC.md`) is the direct shape reference: section order, EARS phrasing, advisory-marking, and the invariant+Key-Decision split pattern are all inherited from there.

**Primary recommendation:** Read Section 3 of this research to get the exact subtest names; use Phase 69 SPEC.md as the layout template; stamp both ROADMAP Key Decisions as settled with the consequence of reopening; mark all implementation symbols `<!-- advisory -->`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| SHA derivation at install time | Build/install script (`bin/install.js`) | — | `git rev-parse --short=7 HEAD` runs once during `npx get-shit-done` execution; result is written to a VERSION file that all other tiers read |
| Placeholder substitution (`{{GSD_REPO}}` etc.) | Build/install script (`bin/install.js`) | — | Regex replacements applied to every copied hook file at install time; the hooks carry resolved values at runtime |
| no-network sentinel initialization | Build/install script | — | `let gsdVersion = 'no-network'` is the initial value before the git call; if git fails, this propagates to VERSION |
| SHA equality comparison (`isNewer`) | Background worker process (`gsd-check-update-worker.js`) | — | Detached child process; compares installed VERSION against GitHub Commits API response |
| GitHub Commits API fetch | Background worker process | Injectable seam (`check-latest-version.cjs`) | Worker uses `https.get` directly; seam provides a testable extraction of the same logic |
| Injectable seam I/O contract | `check-latest-version.cjs` module | — | Exported constants (`GITHUB_API_URL`, `CHECK_REASON`) and `checkLatestVersion()` function; consumed by the update workflow |
| Statusline display | Statusline hook (`gsd-statusline.js`) | — | Reads the cache file written by the worker; displays update/stale-hooks flags without semver logic |
| Update workflow compare_versions | Workflow (`update.md`) | — | Bash `==` equality comparison for SHAs; no semver ordering; displays SHA labels |

---

## Section 3: Invariant → Subtest Mapping (Core Planner Input)

This section is the primary output for the planner. It maps each of the six behavioral-role invariants from CONTEXT.md D-01 to the exact test describe/test names as they appear in the source files, provides the EARS-phraseable claim, and flags any discrepancy between CONTEXT.md claims and what the tests actually assert.

---

### Invariant 1 — SHA emit at install + placeholder substitution boundary

**EARS claim (Ubiquitous):** The system SHALL derive the installed GSD version from `git rev-parse --short=7 HEAD` at install time and SHALL substitute the resolved SHA into installed hook files via `{{GSD_VERSION}}` regex replacement; it SHALL NOT call the GitHub Commits API during installation.

**Subtest names from `tests/version-detection.test.cjs`:**

| describe block | test name | What it asserts |
|---|---|---|
| `'INST-01: install.js uses git rev-parse for version'` | `'install.js source contains git rev-parse --short'` | `installSrc.includes('git rev-parse')` |
| `'INST-01: install.js uses git rev-parse for version'` | `'install.js module-scope does not call GitHub API for gsdVersion'` | `!moduleScope.includes('api.github.com/repos/thamwangjun/get-shit-done/commits')` |
| `'INST-03: install.js replaces {{GSD_REPO}} and {{GSD_BRANCH}} in hook content'` | `'install.js contains the fork repo literal thamwangjun/get-shit-done'` | `installSrc.includes("'thamwangjun/get-shit-done'")` |
| `'INST-03: install.js replaces {{GSD_REPO}} and {{GSD_BRANCH}} in hook content'` | `'install.js contains the {{GSD_REPO}} regex replacement call'` | `.replace(/\{\{GSD_REPO\}\}/g` or `.replace(/{{GSD_REPO}}/g` |
| `'INST-03: install.js replaces {{GSD_REPO}} and {{GSD_BRANCH}} in hook content'` | `'install.js contains the {{GSD_BRANCH}} regex replacement call with main'` | `'main'` + `{{GSD_BRANCH}}` replacement |
| `'INST-04: all {{GSD_VERSION}} replacements in install.js use gsdVersion (not pkg.version)'` | `'install.js contains at least one {{GSD_VERSION}} replacement using gsdVersion'` | `installSrc.includes('GSD_VERSION') && installSrc.includes('gsdVersion')` |
| `'INST-04: all {{GSD_VERSION}} replacements in install.js use gsdVersion (not pkg.version)'` | `'install.js has no {{GSD_VERSION}} replacements that use pkg.version'` | zero lines matching both `GSD_VERSION` and `.replace(` also contain `pkg.version` |

**EARS pattern recommendation:** Ubiquitous — "The system SHALL..." with sub-clause "and SHALL NOT..." for the API exclusion. The placeholder substitution can render as a sub-clause of this invariant (folded per D-01 guidance) unless the planner finds the invariant overloaded; in that case split INST-03/INST-04 to a separate 02-INV-7.

**Scope note for Scope section (D-06):** "Eta `<%~ include() %>` / `@~/` content materialization is SPEC-04; the literal `{{GSD_REPO}}` / `{{GSD_BRANCH}}` / `{{GSD_VERSION}}` regex replacements that wire the SHA and repo identity into installed hooks are SPEC-02."

---

### Invariant 2 — no-network sentinel

**EARS claim (Unwanted-behavior):** If `git rev-parse` fails or is unavailable at install time, the system SHALL initialize `gsdVersion` to the sentinel string `'no-network'` and SHALL NOT fall back to `pkg.version` or any semver string.

**Subtest names from `tests/version-detection.test.cjs`:**

| describe block | test name | What it asserts |
|---|---|---|
| `'INST-02: install.js fallback is a non-SHA sentinel string'` | `'install.js does not fall back to pkg.version (semver)'` | `!installSrc.includes('let gsdVersion = pkg.version')` |
| `'INST-02: install.js fallback is a non-SHA sentinel string'` | `'install.js has no-network sentinel as initial gsdVersion value'` | `installSrc.includes("'no-network'") \|\| installSrc.includes('"no-network"')` |

**Corroborating evidence from `tests/update-sha-migration.test.cjs` (D-10):**

| describe block | test name | What it asserts |
|---|---|---|
| `'D-10: no-network sentinel is not a conditional branch target'` | `'update.md does not use no-network as an equality branch value'` | no `= "no-network"`, `= 'no-network'`, or `== "no-network"` in update.md |
| `'D-10: no-network sentinel is not a conditional branch target'` | `'no-network appears exactly 3 times and only in grep -Eq pattern lines'` | exactly 3 occurrences of `no-network`; count is normative |
| `'D-10: no-network sentinel is not a conditional branch target'` | `'all no-network occurrences are within grep -Eq pattern lines'` | every `no-network` line also contains `grep -Eq` |

**EARS pattern recommendation:** Unwanted-behavior — "If `git rev-parse` fails, the system SHALL NOT fall back to `pkg.version`; the system SHALL use the sentinel string `'no-network'`." The "never compared for equality as a branch target" aspect is covered by the D-10 tests and should be folded into this invariant or noted in Key Decisions as the KD-sentinel entry per D-04.

---

### Invariant 3 — SHA-equality comparison (`isNewer`)

**EARS claim (Ubiquitous + Unwanted-behavior):** When the update worker compares the installed SHA to the latest fetched SHA, the system MUST truncate the latest value to 7 characters and compare for exact equality; `null`, `undefined`, or empty-string `latest` MUST yield `false` (no false positive). The system SHALL NOT perform semver ordering on SHA values.

**Subtest names from `tests/semver-compare.test.cjs`:**

| describe block | test name | What it asserts |
|---|---|---|
| `'isNewer (SHA equality)'` | `'same 7-char SHA — no update'` | `isNewer('a1b2c3d', 'a1b2c3d') === false` |
| `'isNewer (SHA equality)'` | `'different 7-char SHA — update available'` | `isNewer('b2c3d4e', 'a1b2c3d') === true` |
| `'isNewer (SHA equality)'` | `'full 40-char SHA — truncates to 7 for comparison (match)'` | `isNewer('a1b2c3d4e5f6...', 'a1b2c3d') === false` |
| `'isNewer (SHA equality)'` | `'full 40-char SHA — truncates to 7 for comparison (mismatch)'` | `isNewer('b2c3d4e5f6...', 'a1b2c3d') === true` |
| `'isNewer (SHA equality)'` | `'null latest — no false positive'` | `isNewer(null, 'a1b2c3d') === false` |
| `'isNewer (SHA equality)'` | `'undefined latest — no false positive'` | `isNewer(undefined, 'a1b2c3d') === false` |
| `'isNewer (SHA equality)'` | `'empty string latest — no false positive'` | `isNewer('', 'a1b2c3d') === false` |
| `'isNewer (SHA equality)'` | `'null latest on API failure — no false positive (D-06 fallback)'` | `isNewer(null, 'a1b2c3d') === false` (API unavailable path) |
| `'isNewer (SHA equality)'` | `'installed is unknown — real SHA differs from unknown'` | `isNewer('a1b2c3d', 'unknown') === true` |
| `'HOOK-03: worker source — isNewer defined before use'` | `'worker source contains function isNewer definition'` | `workerSrc.includes('function isNewer')` |
| `'HOOK-03: worker source — isNewer defined before use'` | `'isNewer is defined before writeResult in source order'` | `isNewerPos < writeResultDefPos` |
| `'HOOK-03: worker source — isNewer defined before use'` | `'writeResult definition calls isNewer'` | `bodySlice.includes('isNewer(')` |

**Note on HOOK-03:** The "defined before use" tests are a ReferenceError regression guard. The planner may render this as a sub-clause of invariant 3 (the `isNewer` function's structural contract) rather than a separate invariant, since it is a single falsifiable claim about source order.

**Corroborating evidence from `tests/update-sha-migration.test.cjs` (D-07):**

| describe block | test name | What it asserts |
|---|---|---|
| `'D-07: binary SHA equality in compare_versions'` | `'compare_versions step uses == for SHA comparison'` | `compareVersionsRegion.includes('==')` |
| `'D-07: binary SHA equality in compare_versions'` | `'compare_versions step does not reference semver'` | `!compareVersionsRegion.toLowerCase().includes('semver')` |
| `'D-07: binary SHA equality in compare_versions'` | `'compare_versions step does not implement semver ordering logic (greater-than branch)'` | no `>` ordering, no `semver`, no `compareVersions` |
| `'D-07: binary SHA equality in compare_versions'` | `'compare_versions step does not contain installed > latest semver branch'` | no `'installed > latest'` |
| `'D-07: binary SHA equality in compare_versions'` | `'compare_versions step does not reference dev-install'` | no `dev-install` or `devInstall` |

**EARS pattern recommendation:** Compound: Ubiquitous for the positive equality claim ("The system MUST compare by 7-char truncated equality") + Unwanted-behavior for the null-safety and semver-ordering exclusions.

---

### Invariant 4 — Update source = GitHub Commits API

**EARS claim (Ubiquitous + Unwanted-behavior):** The system SHALL fetch the latest commit SHA from the GitHub Commits API endpoint (`api.github.com/repos/{{GSD_REPO}}/commits/{{GSD_BRANCH}}`) via `https.get`. The system SHALL NOT contact `npmjs.com` or reference the `get-shit-done-cc` npm package name.

**Subtest names from `tests/semver-compare.test.cjs`:**

| describe block | test name | What it asserts |
|---|---|---|
| `'HOOK-04: worker source — GitHub API endpoint, not npm registry'` | `'worker source contains fork GitHub repo URL'` | `workerSrc.includes('{{GSD_REPO}}')` — template present in worker source |
| `'HOOK-04: worker source — GitHub API endpoint, not npm registry'` | `'worker source uses https.get for the fetch call'` | `workerSrc.includes('https.get')` |
| `'HOOK-04: worker source — GitHub API endpoint, not npm registry'` | `'worker source does not contact npmjs.com'` | `!workerSrc.includes('npmjs.com')` |
| `'HOOK-04: worker source — GitHub API endpoint, not npm registry'` | `'worker source does not reference the upstream npm package name'` | `!workerSrc.includes('get-shit-done-cc')` |
| `'HOOK-04: worker source — GitHub API endpoint, not npm registry'` | `'worker source uses the GitHub Commits API path'` | `workerSrc.includes('api.github.com/repos/{{GSD_REPO}}/commits/{{GSD_BRANCH}}')` |

**Important detail:** The worker source contains the literal string `api.github.com/repos/{{GSD_REPO}}/commits/{{GSD_BRANCH}}` — the `{{...}}` placeholders are still present in the source file; they are resolved at install time by `bin/install.js`. The HOOK-04 test asserts the template form, not the resolved URL. This is consistent with INST-03 (invariant 1).

**Corroborating evidence from `tests/bug-2992-check-latest-version.test.cjs`:**

| describe block | test name | What it asserts |
|---|---|---|
| `'Bug #2992: SHA-based latest-version check — constants'` | `'GITHUB_API_URL is the constant GitHub Commits API endpoint'` | `GITHUB_API_URL === 'https://api.github.com/repos/thamwangjun/get-shit-done/commits/main'` |

**EARS pattern recommendation:** Unwanted-behavior for the exclusions ("The system SHALL NOT contact npmjs.com...") plus Ubiquitous for the positive claim about the GitHub API endpoint.

---

### Invariant 5 — check-latest-version.cjs seam contract

**EARS claim (Ubiquitous):** The `check-latest-version.cjs` seam SHALL expose a constant `GITHUB_API_URL`, a `CHECK_REASON` enum with exactly three keys (`OK`, `FAIL_FETCH_FAILED`, `FAIL_INVALID_SHA`), and a `checkLatestVersion({ request })` function that: on success returns `{ ok: true, sha, reason: CHECK_REASON.OK }` with `sha` truncated to 7 characters; on network failure or non-200 response returns `{ ok: false, reason: CHECK_REASON.FAIL_FETCH_FAILED }`; on a missing, malformed, or too-short `sha` field returns `{ ok: false, reason: CHECK_REASON.FAIL_INVALID_SHA }`.

**Subtest names from `tests/bug-2992-check-latest-version.test.cjs`:**

| describe block | test name | What it asserts |
|---|---|---|
| `'Bug #2992: SHA-based latest-version check — constants'` | `'GITHUB_API_URL is the constant GitHub Commits API endpoint'` | `GITHUB_API_URL === 'https://api.github.com/repos/thamwangjun/get-shit-done/commits/main'` |
| `'Bug #2992: SHA-based latest-version check — constants'` | `'CHECK_REASON enum exposes the documented codes'` | `Object.keys(CHECK_REASON).sort()` deep-equals `['FAIL_FETCH_FAILED', 'FAIL_INVALID_SHA', 'OK'].sort()` |
| `'Bug #2992: SHA-based latest-version check — success paths'` | `'returns { ok: true, sha } when GitHub API returns a valid SHA'` | `r` deep-equals `{ ok: true, sha: 'abc1234', reason: CHECK_REASON.OK }` |
| `'Bug #2992: SHA-based latest-version check — success paths'` | `'truncates full 40-char SHA to 7 chars in result'` | `r.sha === 'abc1234'` for a 40-char input |
| `'Bug #2992: SHA-based latest-version check — error paths'` | `'FAIL_FETCH_FAILED when GitHub API returns non-200'` | `r.reason === CHECK_REASON.FAIL_FETCH_FAILED` on HTTP 404 |
| `'Bug #2992: SHA-based latest-version check — error paths'` | `'FAIL_FETCH_FAILED detail names the error when request throws'` | `r.reason === CHECK_REASON.FAIL_FETCH_FAILED` + `r.detail` truthy |
| `'Bug #2992: SHA-based latest-version check — error paths'` | `'FAIL_INVALID_SHA when response body has no sha field'` | `r.reason === CHECK_REASON.FAIL_INVALID_SHA` for `{ version: '1.0.0' }` body |
| `'Bug #2992: SHA-based latest-version check — error paths'` | `'FAIL_INVALID_SHA when response body is empty'` | `r.reason === CHECK_REASON.FAIL_INVALID_SHA` for empty raw body |
| `'Bug #2992: SHA-based latest-version check — error paths'` | `'FAIL_INVALID_SHA when sha field is shorter than 7 chars'` | `r.reason === CHECK_REASON.FAIL_INVALID_SHA` for `{ sha: 'abc12' }` |

**EARS pattern recommendation:** Ubiquitous for the success-path contract; Unwanted-behavior (or Event-driven) for the error paths. The seam's entire observable I/O contract can be expressed in one invariant with three conditions (success / fetch-failed / invalid-sha), or split to two invariants (success path + error paths). Phase 69 used a single overarching invariant with a detail table; either approach satisfies QUAL-01.

---

### Invariant 6 — Display: SHA labels, no semver block, no dev-install branch

**EARS claim (Ubiquitous + Unwanted-behavior):** The statusline SHALL NOT define a `parseV` function or reference an `isDevInstall` variable; the stale-hooks block in the statusline MUST contain exactly one `gsdUpdate +=` assignment with no IIFE. The update workflow SHALL display `Installed SHA:` and `Latest SHA:` labels in both the up-to-date and update-available outputs; it SHALL NOT contain `isDevInstall`, `installed > latest`, semver grep patterns, or semver ordering logic.

**Subtest names from `tests/statusline-sha.test.cjs`:**

| describe block | test name | What it asserts |
|---|---|---|
| `'STAT-01: gsd-statusline.js does not contain the parseV() semver block'` | `'source does not define a parseV function or variable'` | `!src.includes('parseV')` |
| `'STAT-02: stale-hooks condition is simplified — no IIFE, no isDevInstall'` | `'source does not reference isDevInstall variable'` | `!src.includes('isDevInstall')` |
| `'STAT-02: stale-hooks condition is simplified — no IIFE, no isDevInstall'` | `'source does not contain an IIFE (() =>) adjacent to stale_hooks logic'` | stale_hooks region does not contain `(() =>` |
| `'STAT-02: stale-hooks condition is simplified — no IIFE, no isDevInstall'` | `'stale-hooks block has a single gsdUpdate += line (no branching for dev install)'` | exactly 1 `gsdUpdate +=` match in the stale_hooks block region |

**Subtest names from `tests/update-sha-migration.test.cjs`:**

| describe block | test name | What it asserts |
|---|---|---|
| `'D-08: no dev-install warning branch in update.md'` | `'update.md does not contain installed > latest'` | `!updateText.includes('installed > latest')` |
| `'D-08: no dev-install warning branch in update.md'` | `'update.md does not contain isDevInstall'` | `!updateText.includes('isDevInstall')` |
| `'D-09: up-to-date display uses SHA labels and correct message'` | `'update.md contains "Installed SHA:" label'` | `updateText.includes('Installed SHA:')` |
| `'D-09: up-to-date display uses SHA labels and correct message'` | `'update.md contains "Latest SHA:" label'` | `updateText.includes('Latest SHA:')` |
| `'D-09: up-to-date display uses SHA labels and correct message'` | `'update.md contains up-to-date message'` | `updateText.includes("You're already on the latest version")` |
| `'D-11: three grep -Eq SHA patterns present in update.md'` | `'grep -Eq SHA pattern appears exactly 3 times'` | `updateText.split("grep -Eq '^[0-9a-f]{7}|no-network'").length - 1 === 3` |
| `'D-11: three grep -Eq SHA patterns present in update.md'` | `'semver grep pattern is absent from update.md'` | `!updateText.includes("grep -Eq '^[0-9]+\\.[0-9]+\\.[0-9]+'")` |

**EARS pattern recommendation:** Unwanted-behavior invariant for the "no parseV, no isDevInstall, no IIFE" cluster; separate Ubiquitous invariant for the positive "SHALL display SHA labels" claim. These can be one invariant (compound claim) or two (split display-positive and display-negative). Phase 69 combined positive and negative claims into a single invariant with a consequence statement — either form satisfies QUAL-01.

---

## Section 4: Key Decisions — Settled Decisions and Consequences

The two ROADMAP-mandated Key Decisions (D-07) are:

### KD-A: GitHub Commits API, not npmjs.com

**Decision:** The update worker fetches the latest commit SHA from the GitHub Commits API (`api.github.com/repos/<fork>/commits/<branch>`), not from the npm registry (`registry.npmjs.com` / `npmjs.com`).

**Rationale:** The fork is distinguished from the upstream npm package; the fork's HEAD commit SHA is the authoritative version signal and is only available from GitHub, not npm.

**Settled — do not reopen.** Consequence of reopening: switching to the npm registry would return the upstream package version, which never reflects fork-specific commits, breaking the fork's version display and update detection entirely.

**Tier-1 evidence:** `semver-compare.test.cjs` HOOK-04 (`'worker source does not contact npmjs.com'`); `bug-2992-check-latest-version.test.cjs` (`'GITHUB_API_URL is the constant GitHub Commits API endpoint'`).

---

### KD-B: SHA equality, not semver ordering

**Decision:** Version comparison uses exact 7-char SHA equality (`latest.slice(0, 7) !== installed`). There is no ordering relationship between SHAs — a SHA cannot be "greater than" or "less than" another.

**Rationale:** Git SHAs are content-addressable hash values, not ordered version numbers; semver comparison operators are meaningless on hex strings.

**Settled — do not reopen.** Consequence of reopening: applying semver ordering to SHA strings produces undefined behavior (hex strings fail semver parse, or worse produce misleading numeric comparisons), breaking update detection entirely.

**Tier-1 evidence:** `semver-compare.test.cjs` `isNewer (SHA equality)` describe block; `update-sha-migration.test.cjs` D-07 (`'compare_versions step does not reference semver'`).

---

### KD-C: no-network sentinel signals invalid install, not empty string (D-04)

**Decision:** The sentinel value `'no-network'` is used when `git rev-parse` fails at install time; it signals that the install did not capture a valid git SHA. It is never used as an equality branch target in comparisons — update.md validates VERSION files by checking whether they match `^[0-9a-f]{7}|no-network` (valid formats), not by branching on the sentinel value itself.

**Rationale:** A blank or null installed version would cause `isNewer` to produce incorrect results; the sentinel makes the invalid state explicit and recognizable without collapsing it into an update trigger.

**Settled — do not reopen.** Consequence of reopening: replacing the sentinel with an empty string or falling back to `pkg.version` introduces semver strings into the SHA comparison pipeline, causing false-positive update-available signals or `isNewer` to mis-classify versions.

**Tier-1 evidence:** `version-detection.test.cjs` INST-02; `update-sha-migration.test.cjs` D-10.

---

### KD-D: check-latest-version.cjs extracted as an injectable seam (D-05)

**Decision:** The SHA-check logic is extracted into `check-latest-version.cjs` as a module that accepts an injectable `request` function (defaulting to `https.get`). The module exports `checkLatestVersion`, `CHECK_REASON`, and `GITHUB_API_URL`.

**Rationale:** The background worker (`gsd-check-update-worker.js`) runs in a detached child process with no module exports; its `isNewer` function cannot be `require()`d directly. The injectable seam enables deterministic testing without live network access.

**Settled — do not reopen.** Consequence of reopening: inlining the network call with no injectable seam forces tests to either make live network requests (flaky, slow, CI-hostile) or skip coverage of the fetch contract entirely, leaving the GitHub API interaction untested.

**Tier-1 evidence:** `bug-2992-check-latest-version.test.cjs` (the entire test file relies on the injectable seam via `makeFakeRequest`).

---

## Section 5: Advisory Symbol Inventory (Code Context)

All items below are marked `<!-- advisory -->`. Paths and symbols will shift on any upstream refactor.

### bin/install.js — advisory

| Symbol / Pattern | What it does | Line range (advisory) |
|---|---|---|
| `let gsdVersion = 'no-network'` | Initial sentinel value before git call | ~141 |
| `_execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], ...)` | SHA derivation call | ~143–147 |
| `.replace(/\{\{GSD_VERSION\}\}/g, gsdVersion)` | SHA injection into hook content | ~8065, 8870, 8881, 8904, 9222, 9235 (multiple copy paths) |
| `.replace(/\{\{GSD_REPO\}\}/g, 'thamwangjun/get-shit-done')` | Repo placeholder resolution | same lines |
| `.replace(/\{\{GSD_BRANCH\}\}/g, 'main')` | Branch placeholder resolution | same lines |
| `fs.writeFileSync(versionDest, gsdVersion)` | Writes VERSION file | ~8828 |

**Note:** The `{{...}}` replacements appear on multiple copy-path lines (hook content, additional content paths, .sh hooks). This is consistent with INST-03 and INST-04 tests which use `installSrc.includes(...)` (any occurrence suffices).

### hooks/gsd-check-update-worker.js — advisory

| Symbol | What it does |
|---|---|
| `function isNewer(latest, installed)` | `return !!latest && latest.slice(0, 7) !== installed` — the full equality implementation |
| `function writeResult(latest)` | Builds the cache object; calls `isNewer(latest, installed)` |
| `https.get({ host: 'api.github.com', path: '/repos/{{GSD_REPO}}/commits/{{GSD_BRANCH}}', ... })` | The fetch call; `{{...}}` placeholders resolved at install time |
| `// gsd-hook-version: {{GSD_VERSION}}` | Hook version header; also has `{{GSD_VERSION}}` placeholder |
| `MANAGED_HOOKS` constant | Array of managed hook filenames for stale-hooks check |

### get-shit-done/bin/check-latest-version.cjs — advisory

| Symbol | What it does |
|---|---|
| `GITHUB_API_URL` | `'https://api.github.com/repos/thamwangjun/get-shit-done/commits/main'` — hardcoded constant |
| `CHECK_REASON` | Frozen enum: `{ OK: 'ok', FAIL_FETCH_FAILED: 'fail_fetch_failed', FAIL_INVALID_SHA: 'fail_invalid_sha' }` |
| `checkLatestVersion(opts = {})` | Async function; `opts.request` is the injectable seam (defaults to `https.get`) |
| Return shape: success | `{ ok: true, sha: sha.slice(0, 7), reason: CHECK_REASON.OK }` |
| Return shape: fetch error | `{ ok: false, reason: CHECK_REASON.FAIL_FETCH_FAILED, detail: string }` |
| Return shape: invalid SHA | `{ ok: false, reason: CHECK_REASON.FAIL_INVALID_SHA, detail: string }` |
| SHA validation regex | `/^[0-9a-f]{7}/i` — must match at least 7 hex chars at start |
| Timeout | `req.setTimeout(15_000, ...)` — 15-second timeout |

### hooks/gsd-statusline.js — advisory

| Symbol / Pattern | What it does |
|---|---|
| `cache.stale_hooks` | Read from the cache file written by the worker |
| `if (cache.stale_hooks && cache.stale_hooks.length > 0)` | Single `if` guard; one `gsdUpdate +=` assignment |
| `'\x1b[31m⚠ stale hooks — run /gsd:update\x1b[0m │ '` | Stale hooks display string |
| Absence of `parseV` | No semver parsing function anywhere in the file |
| Absence of `isDevInstall` | No dev-install detection variable |

### get-shit-done/workflows/update.md — advisory

| Symbol / Pattern | What it does |
|---|---|
| `<step name="compare_versions">` | The step tag wrapping the SHA equality comparison |
| `if [ "$INSTALLED_VERSION" == "$LATEST_SHA" ]` | Binary SHA equality check (Bash `==`) |
| `**Installed SHA:** {INSTALLED_VERSION}` | SHA label in up-to-date output |
| `**Latest SHA:**    {LATEST_SHA}` | SHA label in up-to-date output |
| `"You're already on the latest version"` | Up-to-date message |
| `grep -Eq '^[0-9a-f]{7}\|no-network'` | VERSION file format validation pattern (appears exactly 3 times) |

---

## Section 6: CONTEXT.md / Test-File Discrepancy Audit

The planner requested explicit flagging of any mismatch between CONTEXT.md's claimed assertions and what the test files actually assert.

**Finding: No material mismatches.** All six behavioral roles described in CONTEXT.md D-01 are faithfully backed by real subtest names in the five tier-1 files. The following minor precision notes apply:

1. **D-10 sentinel count is normative in the test.** CONTEXT.md §Specifics states "the `no-network` sentinel string appears exactly 3 times in `update.md` and only within `grep -Eq` pattern lines — narrate this as the sentinel's 'never an equality branch target' contract, not as a magic count." The test at `tests/update-sha-migration.test.cjs` line 143 (`'no-network appears exactly 3 times and only in grep -Eq pattern lines'`) asserts `occurrences === 3` with `assert.equal` — the count IS normative in the test. The SPEC.md should narrate the exact count as cited in the test, even though the design intent is the "no equality branch" semantic. The spec can note that 3 is the current assertion shape (keyed to the current structure of update.md with 3 VERSION-file validation points) while the behavioral contract is the grep-Eq-only placement. This is the "shape normative" approach from Phase 69 D-02.

2. **HOOK-04 checks `{{GSD_REPO}}` template form, not resolved URL.** The test `'worker source contains fork GitHub repo URL'` asserts `workerSrc.includes('{{GSD_REPO}}')` — it is checking that the template placeholder is present in the worker source, not that the resolved URL is there. The worker is installed with `{{GSD_REPO}}` still in place (it is a source file that gets placeholders resolved at install time). CONTEXT.md's description "worker fetches the latest SHA from the fork's GitHub Commits API" is correct, but the test verifies the template form. The `bug-2992` test separately verifies the resolved URL (`GITHUB_API_URL === 'https://api.github.com/repos/thamwangjun/get-shit-done/commits/main'`). The invariant should note that the worker carries the `{{GSD_REPO}}/{{GSD_BRANCH}}` template and the resolved URL is pinned via `GITHUB_API_URL` in `check-latest-version.cjs`.

3. **HOOK-03 (isNewer defined before use) is not explicitly listed in CONTEXT.md D-01.** CONTEXT.md's canonical_refs section mentions it, but D-01's six invariants do not map HOOK-03 to a named invariant. It naturally folds into invariant 3 (SHA-equality comparison) as a structural property of the `isNewer` function. The planner should include all three HOOK-03 subtests in the Acceptance Tests table under 02-INV-3.

4. **`semver-compare.test.cjs` line 54 test name uses "(D-06 fallback)" internally.** The test `'null latest on API failure — no false positive (D-06 fallback)'` refers to a "D-06" decision in a comment inside that test file. This is an internal test-file decision reference, not the same as CONTEXT.md's D-06 (which concerns the SPEC-04 boundary). No conflict — this is just a naming coincidence in the test file.

5. **`gsd-check-update-worker-platform-gate.test.cjs` confirmed absent from tier-1 mapping.** The file exists (CONTEXT.md D-03 refers to it) but is correctly excluded from this spec per D-03.

---

## Section 7: QUAL-01–05 Satisfaction — Phase 69 Pattern

Phase 69's `01-positive-framing/SPEC.md` established these patterns. The planner should replicate them:

**QUAL-01 (EARS statements with RFC 2119):** Phase 69 used both Ubiquitous ("the system MUST flag any string matching...") and Unwanted-behavior ("MUST NOT flag that occurrence") patterns within a single invariant. Each invariant had exactly one consequence statement. Replicate: one consequence-of-violation sentence at the end of each invariant block, preceded by a `---` separator between invariants.

**QUAL-02 (Acceptance Tests traceability table):** Phase 69 used the three required columns: `Invariant | Test File | Subtest / Assertion Shape`. Each invariant had multiple rows (multiple subtests). The subtest strings were quoted exactly as they appear in the `test(...)` call. Replicate exactly.

**QUAL-03 (Advisory marking):** Phase 69 opened the Code Context section with `<!-- advisory -->` on the section itself, then listed advisory items without repeating the tag per item. The section opened: "The items below are current as of [date]. All file paths, function names, regex bodies, and line numbers are advisory and will shift on any test edit or upstream refactor." Replicate.

**QUAL-04 (Tier-1 citation):** Phase 69 cited `tests/negative-framing-scan.test.cjs` in every row of the Acceptance Tests table. SPEC-02 will cite five tier-1 test files across the table rows — this satisfies QUAL-04 many times over.

**QUAL-05 (Key Decisions with consequence):** Phase 69 used three Key Decision subsections (a), (b), (c), each ending with: `**Settled — do not reopen.** Consequence of reopening: <consequence>.` SPEC-02 has four Key Decisions (KD-A through KD-D above). Replicate the same settled/consequence footer format.

---

## Section 8: Frontmatter Update Notes

The stub's frontmatter currently reads:

```
**Reimplementation evidence (tier-1 test):** tests/version-detection.test.cjs (also tests/semver-compare.test.cjs)
```

Per D-02, the body cites five tier-1 files. The planner has discretion (CONTEXT.md Claude's Discretion) on whether to:
- Update the frontmatter line to list all five files, or
- Keep the two primary files in frontmatter with the remaining three cited in the Acceptance Tests table.

Phase 69 listed only the primary file in frontmatter. For SPEC-02, the five-file expansion is more material (three additional files carry distinct behavioral domains). Recommendation: update the frontmatter line to read:
```
**Reimplementation evidence (tier-1 test):** tests/version-detection.test.cjs; tests/semver-compare.test.cjs; tests/bug-2992-check-latest-version.test.cjs; tests/statusline-sha.test.cjs; tests/update-sha-migration.test.cjs
```
This ensures the frontmatter is complete for Phase 77's cross-spec consistency review, which audits traceability at the frontmatter level.

---

## Open Questions

1. **Invariant count: 6 vs 7.** CONTEXT.md D-01 targets ~6 invariants and folds INST-03/INST-04 placeholder substitution into invariant 1. However, invariant 1 (SHA emit + placeholder substitution + no GitHub API at install time) currently covers 7 subtests across two describe blocks (INST-01 and INST-03/INST-04). If the planner judges this overloaded, splitting placeholder substitution to a separate 02-INV-7 is within Claude's Discretion (CONTEXT.md). Both options satisfy QUAL-01.

2. **HOOK-03 placement.** The three HOOK-03 subtests (isNewer defined before use) naturally fold into 02-INV-3. They could alternatively be a separate 02-INV-7 if "structural property of isNewer" is considered a distinct behavioral claim from "isNewer computes SHA equality correctly." Phase 69 precedent favors folding related claims into one invariant.

3. **D-10 count normative vs shape normative.** The "no-network appears exactly 3 times" assertion uses `assert.equal(occurrences, 3)` — the count is the actual assertion. The spec should cite this count as "current as of 2026-06-12" (per the QUAL-04 shape-normative approach from Phase 69 D-02) so the spec does not falsify on the next update.md restructure that happens to add or remove a VERSION validation point.

---

## Sources

All findings in this research were verified by direct reading of the source files in this session. No web searches or external documentation were required — this is a code-narration phase.

### Primary (HIGH confidence — direct file reads)

- `tests/version-detection.test.cjs` — all INST-01 through INST-04 subtest names and assertion shapes
- `tests/semver-compare.test.cjs` — all `isNewer (SHA equality)`, HOOK-03, and HOOK-04 subtest names
- `tests/bug-2992-check-latest-version.test.cjs` — all constants, success-path, and error-path subtest names
- `tests/statusline-sha.test.cjs` — all STAT-01 and STAT-02 subtest names
- `tests/update-sha-migration.test.cjs` — all D-07 through D-11 subtest names

### Secondary (HIGH confidence — advisory implementation reads)

- `bin/install.js` (lines 130–148, 8065–8067, 8828, 8870–8883, 8904–8906, 9222–9237) — gsdVersion, sentinel, placeholder replacements
- `hooks/gsd-check-update-worker.js` — `isNewer`, `writeResult`, `https.get` call with `{{GSD_REPO}}`/`{{GSD_BRANCH}}`
- `get-shit-done/bin/check-latest-version.cjs` — `GITHUB_API_URL`, `CHECK_REASON`, `checkLatestVersion` full implementation
- `hooks/gsd-statusline.js` (lines 390–407) — stale_hooks display block, confirmed absence of `parseV` / `isDevInstall`
- `get-shit-done/workflows/update.md` (lines 337–395) — `compare_versions` step, SHA labels, `grep -Eq` patterns

### Reference (HIGH confidence — locked conventions read)

- `.planning/spec/00-CONVENTIONS.md` — 7-section template, `NN-INV-M` ID scheme, status vocabulary
- `.planning/spec/01-positive-framing/SPEC.md` — Phase 69 worked reference for section shape and QUAL satisfaction pattern
- `.planning/spec/02-sha-versioning/SPEC.md` — stub frontmatter and section skeleton (what the planner fills)
- `.planning/phases/70-spec-02-sha-versioning/70-CONTEXT.md` — locked decisions D-01 through D-07

---

## Metadata

**Confidence breakdown:**
- Invariant → subtest mapping: HIGH — every subtest name was read verbatim from the test file source
- EARS phrasing: HIGH — derived directly from the assertion shapes; EARS pattern choices within Claude's Discretion
- Advisory symbol inventory: HIGH — all paths/symbols extracted from implementation sources in this session
- CONTEXT.md / test-file discrepancy audit: HIGH — five discrepancy candidates examined; all resolved with precision notes, no material mismatches found

**Research date:** 2026-06-12
**Valid until:** This research is based on static file reads; it remains valid as long as the five test files and implementation sources are unchanged. Any edit to the test files may change subtest names and would require re-reading the relevant file.
