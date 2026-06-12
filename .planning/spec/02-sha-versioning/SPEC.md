# SPEC-02: SHA Versioning System

**ID:** 02
**Requirement:** SPEC-02
**Status:** Ready
**Confidence:** High
**Specced:** 2026-06-12
**Reimplementation target:** v2.1.0-h fork features on refactored upstream
**Depends on:** —
**Reimplementation evidence (tier-1 test):** tests/version-detection.test.cjs; tests/semver-compare.test.cjs; tests/bug-2992-check-latest-version.test.cjs; tests/statusline-sha.test.cjs; tests/update-sha-migration.test.cjs

---

## Purpose

The SHA-based versioning system makes the fork's HEAD commit SHA — derived at install time via
`git rev-parse --short=7 HEAD` — the authoritative version signal for update detection and display.
This is necessary because the fork diverges from the upstream npm package (`get-shit-done-cc`) in
ways that are never reflected by the npm registry: every fork commit is a distinct HEAD SHA that
the npm registry does not track. If the SHA-based system is absent or incorrect, version display
and update detection revert to the upstream npm package version string, which never advances with
fork-specific commits, causing the fork to perpetually signal "up to date" while diverging from
upstream. If semver ordering is applied to hex SHA strings instead of SHA equality, the comparison
produces undefined behavior — hex strings fail semver parse or produce misleading numeric
comparisons, breaking update detection entirely. The behavioral contract of this system — including
the install-time git-SHA emit, the `no-network` sentinel semantics, the `isNewer` SHA-equality
comparison, the GitHub Commits API fetch, the `check-latest-version.cjs` injectable seam, and the
SHA-label display in the statusline and update workflow — is fully specified by five tier-1 test
files that serve as the normative behavioral authority: `tests/version-detection.test.cjs`,
`tests/semver-compare.test.cjs`, `tests/bug-2992-check-latest-version.test.cjs`,
`tests/statusline-sha.test.cjs`, and `tests/update-sha-migration.test.cjs`.

## Scope

**In scope:**

- Install-time git-SHA emit: `bin/install.js` derives the installed GSD version from
  `git rev-parse --short=7 HEAD` and writes the 7-character SHA to a VERSION file.
- The `no-network` sentinel semantics: when `git rev-parse` fails at install time, the system
  initializes the version to the literal sentinel string `'no-network'` — a signal that the
  install did not capture a valid git SHA, distinct from an empty string or semver fallback.
- `isNewer` SHA-equality comparison: the update worker truncates the fetched latest SHA to 7
  characters and compares for exact string equality against the installed SHA; `null`, `undefined`,
  or empty-string inputs yield `false` (no false positive); no semver ordering is applied.
- GitHub Commits API fetch: the update worker fetches the latest commit SHA from the fork's GitHub
  Commits API endpoint via `https.get`; the npm registry is not consulted.
- The `check-latest-version.cjs` injectable seam I/O contract: the module exposes `GITHUB_API_URL`,
  a three-key `CHECK_REASON` enum, and a `checkLatestVersion({ request })` function with documented
  success and error return shapes.
- Statusline and `update.md` SHA-label display: the statusline presents SHA-based update flags
  without a `parseV` semver block or `isDevInstall` dev-install branch; `update.md` displays
  `Installed SHA:` and `Latest SHA:` labels and compares by binary SHA equality.
- The literal `{{GSD_REPO}}` / `{{GSD_BRANCH}}` / `{{GSD_VERSION}}` placeholder substitution in
  installed hook files: `bin/install.js` applies regex replacements to wire the derived SHA and
  fork repo identity into installed hooks at install time. Eta `<%~ include() %>` / `@~/` content
  materialization is SPEC-04; the literal `{{...}}` repo/branch/version regex substitution that
  wires the SHA into installed hooks is SPEC-02 (no INDEX dependency edge to SPEC-04 — both remain
  root nodes).

**Out of scope:**

- Eta `<%~ include() %>` / `@~/` content materialization — that is SPEC-04; the `{{...}}` literal
  regex substitution that wires SHA and repo identity into hooks is a distinct mechanism governed
  by this spec (SPEC-02).
- The `gsd-check-update-worker-platform-gate.test.cjs` win32 `shell: true` spawn-gating — that
  test asserts a platform-security constraint of the spawn primitive, not SHA-versioning behavior
  (explicit D-03 exclusion).

## Invariants

**02-INV-1** — The system SHALL derive the installed GSD version from `git rev-parse --short=7 HEAD`
at install time and SHALL substitute the resolved SHA into installed hook files via `{{GSD_VERSION}}`,
`{{GSD_REPO}}`, and `{{GSD_BRANCH}}` regex replacements (using the derived `gsdVersion`, not
`pkg.version`). The system SHALL NOT call the GitHub Commits API during installation. Placeholder
substitution — resolving `{{GSD_REPO}}`, `{{GSD_BRANCH}}`, and `{{GSD_VERSION}}` into installed
hook content — is the emit boundary: this wiring happens at install time, not at runtime, and is
part of the SHA-versioning contract because the hook files carry the version identity resolved from
the git-SHA emit. Tier-1 sources: `tests/version-detection.test.cjs` (INST-01, INST-03, INST-04
describe blocks). Consequence of violating this invariant: installed hooks carry either the wrong
version identity (semver from `pkg.version` instead of the fork SHA) or unresolved `{{...}}`
placeholder strings, breaking version display and update detection.

---

**02-INV-2** — If `git rev-parse` fails or is unavailable at install time, the system SHALL
initialize `gsdVersion` to the sentinel string `'no-network'` and SHALL NOT fall back to
`pkg.version` or any semver string. The sentinel is used exclusively as a validity marker — it
signals an invalid install (no captured git SHA) — and MUST NOT appear as an equality branch
target in any comparison. In `update.md`, the sentinel appears only within `grep -Eq` pattern
lines that validate VERSION file format (the pattern `'^[0-9a-f]{7}|no-network'` accepts the
sentinel as a recognized format value, not as a comparison target). The current assertion shape
is that `no-network` appears exactly 3 times in `update.md`, all within `grep -Eq` lines
(current as of 2026-06-12 — the count reflects the current structure of `update.md`'s VERSION
validation points; the behavioral contract is the grep-Eq-only placement, not the count).
Tier-1 sources: `tests/version-detection.test.cjs` (INST-02 describe block);
`tests/update-sha-migration.test.cjs` (D-10 describe block). Consequence of violating this
invariant: an empty string or `pkg.version` fallback introduces semver strings into the SHA
comparison pipeline, causing `isNewer` to mis-classify versions and triggering false-positive
update signals.

---

**02-INV-3** — When the update worker compares the installed SHA to the latest fetched SHA, the
system MUST truncate `latest` to 7 characters and compare for exact string equality; `null`,
`undefined`, or empty-string `latest` MUST yield `false` (no false positive). The system SHALL
NOT perform semver ordering on SHA values. The `isNewer` function MUST be defined in source order
before `writeResult` (which calls it), so that all call sites execute without a ReferenceError.
Tier-1 sources: `tests/semver-compare.test.cjs` (`isNewer (SHA equality)` and `HOOK-03` describe
blocks); `tests/update-sha-migration.test.cjs` (D-07 describe block). Consequence of violating
this invariant: semver ordering applied to hex strings produces undefined behavior or misleading
comparisons; null/undefined inputs produce false-positive update signals; a hoisted `writeResult`
call before `isNewer` is defined throws a ReferenceError at runtime.

---

**02-INV-4** — The update worker SHALL fetch the latest commit SHA from the GitHub Commits API
endpoint (the path `api.github.com/repos/{{GSD_REPO}}/commits/{{GSD_BRANCH}}` in template form,
resolved to the fork repo and branch at install time) via `https.get`. The worker source carries
the `{{GSD_REPO}}` and `{{GSD_BRANCH}}` template placeholders — the HOOK-04 tier-1 test asserts
the template form, not the resolved URL; the resolved URL is pinned by `GITHUB_API_URL` in the
`check-latest-version.cjs` seam (02-INV-5). The system SHALL NOT contact `npmjs.com` or reference
the `get-shit-done-cc` npm package name. Tier-1 sources: `tests/semver-compare.test.cjs` (HOOK-04
describe block); `tests/bug-2992-check-latest-version.test.cjs` (constants describe block).
Consequence of violating this invariant: contacting the npm registry returns the upstream package
version, which never reflects fork-specific commits, breaking fork version display and update
detection entirely.

---

**02-INV-5** — The `check-latest-version.cjs` seam SHALL expose:
(a) a constant `GITHUB_API_URL` set to the resolved GitHub Commits API endpoint for the fork;
(b) a `CHECK_REASON` enum with exactly three keys: `OK`, `FAIL_FETCH_FAILED`, and `FAIL_INVALID_SHA`;
(c) a `checkLatestVersion({ request })` function that accepts an injectable `request` function
(enabling deterministic testing without live network access) and returns:
  - `{ ok: true, sha, reason: CHECK_REASON.OK }` with `sha` truncated to 7 characters on success,
  - `{ ok: false, reason: CHECK_REASON.FAIL_FETCH_FAILED, detail }` on network failure or non-200 HTTP response,
  - `{ ok: false, reason: CHECK_REASON.FAIL_INVALID_SHA, detail }` on a missing, malformed, or too-short (fewer than 7 characters) `sha` field.
Tier-1 source: `tests/bug-2992-check-latest-version.test.cjs` (constants, success-paths, and
error-paths describe blocks). Consequence of violating this invariant: callers cannot distinguish
network failures from invalid SHA responses; the injectable seam cannot be tested without live
network access; the SHA truncation contract is broken and downstream comparisons receive untruncated
40-character SHAs.

---

**02-INV-6** — The statusline SHALL NOT define a `parseV` function or reference an `isDevInstall`
variable; the stale-hooks block in the statusline MUST contain exactly one `gsdUpdate +=`
assignment with no IIFE. The update workflow SHALL display `Installed SHA:` and `Latest SHA:`
labels in both the up-to-date and update-available outputs, and SHALL compare versions using
binary SHA equality (Bash `==`); the update workflow SHALL NOT contain `isDevInstall`, the string
`installed > latest`, semver grep patterns, or semver ordering logic. Tier-1 sources:
`tests/statusline-sha.test.cjs` (STAT-01 and STAT-02 describe blocks);
`tests/update-sha-migration.test.cjs` (D-08, D-09, D-11 describe blocks). Consequence of
violating this invariant: semver logic in the statusline or update workflow causes incorrect
version comparisons on SHA inputs; a dev-install branch produces misleading output for valid fork
installs; the absence of SHA labels breaks user-visible update messaging.

## Acceptance Tests

| Invariant | Test File | Subtest / Assertion Shape |
|-----------|-----------|--------------------------|
| 02-INV-1 | tests/version-detection.test.cjs | `'install.js source contains git rev-parse --short'` |
| 02-INV-1 | tests/version-detection.test.cjs | `'install.js module-scope does not call GitHub API for gsdVersion'` |
| 02-INV-1 | tests/version-detection.test.cjs | `'install.js contains the {{GSD_REPO}} regex replacement call'` |
| 02-INV-1 | tests/version-detection.test.cjs | `'install.js contains the {{GSD_BRANCH}} regex replacement call with main'` |
| 02-INV-1 | tests/version-detection.test.cjs | `'install.js contains at least one {{GSD_VERSION}} replacement using gsdVersion'` |
| 02-INV-1 | tests/version-detection.test.cjs | `'install.js has no {{GSD_VERSION}} replacements that use pkg.version'` |
| 02-INV-2 | tests/version-detection.test.cjs | `'install.js has no-network sentinel as initial gsdVersion value'` |
| 02-INV-2 | tests/version-detection.test.cjs | `'install.js does not fall back to pkg.version (semver)'` |
| 02-INV-2 | tests/update-sha-migration.test.cjs | `'update.md does not use no-network as an equality branch value'` |
| 02-INV-2 | tests/update-sha-migration.test.cjs | `'no-network appears exactly 3 times and only in grep -Eq pattern lines'` |
| 02-INV-2 | tests/update-sha-migration.test.cjs | `'all no-network occurrences are within grep -Eq pattern lines'` |
| 02-INV-3 | tests/semver-compare.test.cjs | `'same 7-char SHA — no update'` |
| 02-INV-3 | tests/semver-compare.test.cjs | `'different 7-char SHA — update available'` |
| 02-INV-3 | tests/semver-compare.test.cjs | `'full 40-char SHA — truncates to 7 for comparison (match)'` |
| 02-INV-3 | tests/semver-compare.test.cjs | `'null latest — no false positive'` |
| 02-INV-3 | tests/semver-compare.test.cjs | `'undefined latest — no false positive'` |
| 02-INV-3 | tests/semver-compare.test.cjs | `'empty string latest — no false positive'` |
| 02-INV-3 | tests/semver-compare.test.cjs | `'worker source contains function isNewer definition'` |
| 02-INV-3 | tests/semver-compare.test.cjs | `'isNewer is defined before writeResult in source order'` |
| 02-INV-3 | tests/semver-compare.test.cjs | `'writeResult definition calls isNewer'` |
| 02-INV-3 | tests/update-sha-migration.test.cjs | `'compare_versions step uses == for SHA comparison'` |
| 02-INV-3 | tests/update-sha-migration.test.cjs | `'compare_versions step does not reference semver'` |
| 02-INV-4 | tests/semver-compare.test.cjs | `'worker source does not contact npmjs.com'` |
| 02-INV-4 | tests/semver-compare.test.cjs | `'worker source does not reference the upstream npm package name'` |
| 02-INV-4 | tests/semver-compare.test.cjs | `'worker source uses https.get for the fetch call'` |
| 02-INV-4 | tests/semver-compare.test.cjs | `'worker source uses the GitHub Commits API path'` |
| 02-INV-4 | tests/bug-2992-check-latest-version.test.cjs | `'GITHUB_API_URL is the constant GitHub Commits API endpoint'` |
| 02-INV-5 | tests/bug-2992-check-latest-version.test.cjs | `'CHECK_REASON enum exposes the documented codes'` |
| 02-INV-5 | tests/bug-2992-check-latest-version.test.cjs | `'returns { ok: true, sha } when GitHub API returns a valid SHA'` |
| 02-INV-5 | tests/bug-2992-check-latest-version.test.cjs | `'truncates full 40-char SHA to 7 chars in result'` |
| 02-INV-5 | tests/bug-2992-check-latest-version.test.cjs | `'FAIL_FETCH_FAILED when GitHub API returns non-200'` |
| 02-INV-5 | tests/bug-2992-check-latest-version.test.cjs | `'FAIL_INVALID_SHA when response body has no sha field'` |
| 02-INV-5 | tests/bug-2992-check-latest-version.test.cjs | `'FAIL_INVALID_SHA when sha field is shorter than 7 chars'` |
| 02-INV-6 | tests/statusline-sha.test.cjs | `'source does not define a parseV function or variable'` |
| 02-INV-6 | tests/statusline-sha.test.cjs | `'source does not reference isDevInstall variable'` |
| 02-INV-6 | tests/statusline-sha.test.cjs | `'stale-hooks block has a single gsdUpdate += line (no branching for dev install)'` |
| 02-INV-6 | tests/update-sha-migration.test.cjs | `'update.md contains "Installed SHA:" label'` |
| 02-INV-6 | tests/update-sha-migration.test.cjs | `'update.md contains "Latest SHA:" label'` |
| 02-INV-6 | tests/update-sha-migration.test.cjs | `'update.md does not contain isDevInstall'` |
| 02-INV-6 | tests/update-sha-migration.test.cjs | `'update.md does not contain installed > latest'` |

## Key Decisions

### (a) GitHub Commits API, not npmjs.com (KD-A)

The update worker fetches the latest commit SHA from the GitHub Commits API
(`api.github.com/repos/<fork>/commits/<branch>`), not from the npm registry
(`registry.npmjs.com` / `npmjs.com`). The fork is distinguished from the upstream npm package;
the fork's HEAD commit SHA is the authoritative version signal and is only available from
GitHub, not npm. Tier-1 evidence: `tests/semver-compare.test.cjs` HOOK-04
(`'worker source does not contact npmjs.com'`); `tests/bug-2992-check-latest-version.test.cjs`
(`'GITHUB_API_URL is the constant GitHub Commits API endpoint'`).

**Settled — do not reopen.** Consequence of reopening: switching to the npm registry returns the
upstream package version, which never reflects fork-specific commits, breaking the fork's version
display and update detection entirely.

---

### (b) SHA equality, not semver ordering (KD-B)

Version comparison uses exact 7-char SHA equality (`latest.slice(0, 7) !== installed`). There is
no ordering relationship between SHAs — a SHA cannot be "greater than" or "less than" another.
Git SHAs are content-addressable hash values, not ordered version numbers; semver comparison
operators are meaningless on hex strings. Tier-1 evidence: `tests/semver-compare.test.cjs`
`isNewer (SHA equality)` describe block; `tests/update-sha-migration.test.cjs` D-07
(`'compare_versions step does not reference semver'`).

**Settled — do not reopen.** Consequence of reopening: applying semver ordering to SHA strings
produces undefined behavior — hex strings fail semver parse, or worse produce misleading numeric
comparisons — breaking update detection entirely.

---

### (c) no-network sentinel signals invalid install, not empty string (KD-C)

The sentinel value `'no-network'` is used when `git rev-parse` fails at install time; it signals
that the install did not capture a valid git SHA. It is never used as an equality branch target
in comparisons — `update.md` validates VERSION files by checking whether they match
`'^[0-9a-f]{7}|no-network'` (a recognized format pattern), not by branching on the sentinel
value itself. An empty string or null installed version would cause `isNewer` to produce incorrect
results; the sentinel makes the invalid state explicit and recognizable without collapsing it into
an update trigger. Tier-1 evidence: `tests/version-detection.test.cjs` INST-02;
`tests/update-sha-migration.test.cjs` D-10.

**Settled — do not reopen.** Consequence of reopening: replacing the sentinel with an empty string
or falling back to `pkg.version` introduces semver strings into the SHA comparison pipeline,
causing `isNewer` to mis-classify versions and triggering false-positive update-available signals.

---

### (d) check-latest-version.cjs extracted as an injectable seam (KD-D)

The SHA-check logic is extracted into `check-latest-version.cjs` as a module that accepts an
injectable `request` function (defaulting to `https.get`). The module exports
`checkLatestVersion`, `CHECK_REASON`, and `GITHUB_API_URL`. The background worker
(`gsd-check-update-worker.js`) runs in a detached child process with no module exports; its
`isNewer` function cannot be `require()`d directly. The injectable seam enables deterministic
testing without live network access. Tier-1 evidence: `tests/bug-2992-check-latest-version.test.cjs`
(the entire test file relies on the injectable seam via `makeFakeRequest`).

**Settled — do not reopen.** Consequence of reopening: inlining the network call with no injectable
seam forces tests to either make live network requests (flaky, slow, CI-hostile) or skip coverage
of the fetch contract entirely, leaving the GitHub API interaction untested.

## Code Context

<!-- advisory -->

The items below are current as of 2026-06-12. All file paths, function names, regex bodies,
and line numbers are advisory and will shift on any test edit or upstream refactor. No
normative invariant depends on these paths or symbols — a reimplementer rebuilds the system
from the behavioral contract in §Invariants and §Key Decisions above.

**bin/install.js** (advisory):

- `let gsdVersion = 'no-network'` — initial sentinel value before the git call (~line 141 advisory)
- `_execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], ...)` — SHA derivation call (~lines 143–147 advisory)
- `.replace(/\{\{GSD_VERSION\}\}/g, gsdVersion)` — SHA injection into hook content (multiple copy-path lines advisory)
- `.replace(/\{\{GSD_REPO\}\}/g, 'thamwangjun/get-shit-done')` — repo placeholder resolution (same lines advisory)
- `.replace(/\{\{GSD_BRANCH\}\}/g, 'main')` — branch placeholder resolution (same lines advisory)
- `fs.writeFileSync(versionDest, gsdVersion)` — writes VERSION file (~line 8828 advisory)

**hooks/gsd-check-update-worker.js** (advisory):

- `function isNewer(latest, installed)` — `return !!latest && latest.slice(0, 7) !== installed` — full equality implementation
- `function writeResult(latest)` — builds the cache object; calls `isNewer(latest, installed)`
- `https.get({ host: 'api.github.com', path: '/repos/{{GSD_REPO}}/commits/{{GSD_BRANCH}}', ... })` — fetch call; `{{...}}` placeholders resolved at install time
- `MANAGED_HOOKS` constant — array of managed hook filenames for stale-hooks check

**get-shit-done/bin/check-latest-version.cjs** (advisory):

- `GITHUB_API_URL` — `'https://api.github.com/repos/thamwangjun/get-shit-done/commits/main'` (hardcoded; resolved at install time in the worker)
- `CHECK_REASON` — frozen enum: `{ OK: 'ok', FAIL_FETCH_FAILED: 'fail_fetch_failed', FAIL_INVALID_SHA: 'fail_invalid_sha' }`
- `checkLatestVersion(opts = {})` — async function; `opts.request` is the injectable seam (defaults to `https.get`)
- SHA validation regex: `/^[0-9a-f]{7}/i` — must match at least 7 hex chars at start
- Timeout: `req.setTimeout(15_000, ...)` — 15-second network timeout

**hooks/gsd-statusline.js** (advisory):

- `cache.stale_hooks` — read from the cache file written by the worker
- Single `if (cache.stale_hooks && cache.stale_hooks.length > 0)` guard with one `gsdUpdate +=` assignment
- No `parseV` function anywhere in the file
- No `isDevInstall` variable anywhere in the file

**get-shit-done/workflows/update.md** (advisory):

- `<step name="compare_versions">` — step wrapping the SHA equality comparison
- `if [ "$INSTALLED_VERSION" == "$LATEST_SHA" ]` — binary SHA equality check (Bash `==`)
- `**Installed SHA:** {INSTALLED_VERSION}` and `**Latest SHA:** {LATEST_SHA}` — SHA labels in output
- `grep -Eq '^[0-9a-f]{7}|no-network'` — VERSION file format validation pattern (appears exactly 3 times, current as of 2026-06-12)
