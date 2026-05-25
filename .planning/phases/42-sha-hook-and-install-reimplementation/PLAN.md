---
phase: "42"
plan: "01"
type: execute
wave: 1
depends_on: []
files_modified:
  - hooks/gsd-check-update-worker.js
  - hooks/gsd-statusline.js
  - bin/install.js
autonomous: true
requirements:
  - HOOK-01
  - HOOK-02
  - HOOK-03
  - HOOK-04
  - HOOK-05
  - INST-01
  - INST-02
  - INST-03
  - INST-04
  - STAT-01
  - STAT-02
  - TEST-01
  - TEST-02

must_haves:
  truths:
    - "D-01: isNewer(latest, installed) uses SHA equality — !!latest && latest.slice(0,7) !== installed — not semver comparison"
    - "D-03: Worker fetches from GitHub Commits API at api.github.com/repos/{{GSD_REPO}}/commits/{{GSD_BRANCH}} via https.get"
    - "D-06: Worker contains no references to npmjs.com, get-shit-done-cc, or get-shit-done-redux as runtime lookup targets"
    - "D-09: install.js has gsdVersion at module scope, initialised to 'no-network', then populated via git rev-parse --short=7 HEAD in try/catch"
    - "D-11/D-12: All six {{GSD_VERSION}} replacement sites in install.js use gsdVersion; {{GSD_REPO}} and {{GSD_BRANCH}} replacements added alongside them"
    - "D-08: gsd-statusline.js stale_hooks branch simplified — parseV() block removed, plain if (cache.stale_hooks && cache.stale_hooks.length > 0) guard retained"
    - "All 7 tests pass: 5 in tests/semver-compare.test.cjs and 2 in tests/version-detection.test.cjs"
  artifacts:
    - path: "hooks/gsd-check-update-worker.js"
      provides: "SHA-based update worker with isNewer before writeResult, GitHub API fetch"
      contains: "function isNewer"
    - path: "hooks/gsd-statusline.js"
      provides: "Simplified stale-hooks display — no parseV() semver block"
    - path: "bin/install.js"
      provides: "SHA-based VERSION writes using gsdVersion from git rev-parse"
      contains: "no-network"
  key_links:
    - from: "hooks/gsd-check-update-worker.js"
      to: "api.github.com/repos/{{GSD_REPO}}/commits/{{GSD_BRANCH}}"
      via: "https.get in worker"
      pattern: "api\\.github\\.com/repos/\\{\\{GSD_REPO\\}\\}/commits/\\{\\{GSD_BRANCH\\}\\}"
    - from: "bin/install.js"
      to: "hooks/gsd-check-update-worker.js (installed copy)"
      via: "{{GSD_VERSION}} / {{GSD_REPO}} / {{GSD_BRANCH}} template replacement"
      pattern: "gsdVersion"
---

<objective>
Replace semver version tracking with SHA-based versioning across three files.

Purpose: The existing worker queries npmjs.com for semver, which is wrong for this fork. Tests assert SHA-equality comparison, GitHub API fetch, no npm registry references, git-derived VERSION writes, and a simplified statusline stale-hooks path.

Output: Modified hooks/gsd-check-update-worker.js, hooks/gsd-statusline.js, and bin/install.js. All 7 failing tests pass.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/42-sha-hook-and-install-reimplementation/42-CONTEXT.md

# Failing tests define exact required patterns — read before touching source
@tests/semver-compare.test.cjs
@tests/version-detection.test.cjs

# Source files being modified
@hooks/gsd-check-update-worker.js
@hooks/gsd-statusline.js
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Rewrite gsd-check-update-worker.js — SHA isNewer + GitHub API fetch</name>
  <files>hooks/gsd-check-update-worker.js</files>
  <behavior>
    - "function isNewer" appears in source before "function writeResult" (HOOK-03 static assertion)
    - writeResult body calls isNewer() within 300 chars of its start (HOOK-03 static assertion)
    - Worker source contains the string api.github.com/repos/{{GSD_REPO}}/commits/{{GSD_BRANCH}} (HOOK-04 static assertion)
    - Worker source contains https.get (HOOK-04 static assertion)
    - Worker source does not contain npmjs.com (HOOK-04 negative assertion)
    - Worker source does not contain get-shit-done-cc (HOOK-04 negative assertion)
    - isNewer(null, 'a1b2c3d') returns false
    - isNewer('a1b2c3d', 'a1b2c3d') returns false (same 7-char SHA)
    - isNewer('b2c3d4e', 'a1b2c3d') returns true (different SHA)
    - isNewer('a1b2c3d4e5f6...40chars', 'a1b2c3d') returns false (full SHA truncated to 7)
  </behavior>
  <action>
Rewrite the bottom half of hooks/gsd-check-update-worker.js (per D-01 through D-06). Keep everything above the staleHooks block intact: shebang, file comment, 'use strict', require block, cacheFile/projectVersionFile/globalVersionFile env-var wiring, installed/configDir read block, MANAGED_HOOKS array, and the staleHooks loop.

Replace the `isNewer` function (currently semver lines 22–30) with the SHA equality version (per D-01):

  function isNewer(latest, installed) {
    return !!latest && latest.slice(0, 7) !== installed;
  }

This function MUST appear before function writeResult in source order (HOOK-03 test assertion).

Then define `writeResult(latest)` (per D-02) immediately after `isNewer`. Keep it compact — the test reads 300 chars from the function start and asserts `isNewer(` is present in that slice. The function must construct the result object, include `update_available: isNewer(latest, installed)`, and write to cacheFile:

  function writeResult(latest) {
    const result = {
      update_available: isNewer(latest, installed),
      installed,
      latest: latest || 'unknown',
      checked: Math.floor(Date.now() / 1000),
      stale_hooks: staleHooks.length > 0 ? staleHooks : undefined,
    };
    if (cacheFile) {
      try { fs.writeFileSync(cacheFile, JSON.stringify(result)); } catch (e) {}
    }
  }

Replace the bottom fetch section (per D-03, D-04, D-05) — remove the entire execFileSync npm view block and replace with an https.get call. Add `const https = require('https');` to the require block at the top if not already present.

The fetch block must:
- Set host: 'api.github.com', path: '/repos/{{GSD_REPO}}/commits/{{GSD_BRANCH}}', headers: { 'User-Agent': 'gsd-check-update' }
- Attach req.setTimeout(10000, () => req.destroy()) for the 10s timeout (per D-04; req.destroy() triggers error event which calls writeResult(null))
- Collect response chunks: data += chunk
- On response.on('end'): try { writeResult(JSON.parse(data).sha); } catch(e) { writeResult(null); }
- On non-200 statusCode: call writeResult(null)
- On req.on('error'): call writeResult(null)
- Source must contain the literal string {{GSD_REPO}} and {{GSD_BRANCH}} (per D-05 — these are template placeholders replaced at install time)

The source file MUST NOT contain npmjs.com, get-shit-done-cc, or get-shit-done-redux after this change (per D-06).
  </action>
  <verify>
    <automated>node --test tests/semver-compare.test.cjs</automated>
  </verify>
  <done>All 5 tests in semver-compare.test.cjs pass. Source contains "function isNewer" before "function writeResult", writeResult calls isNewer() within 300 chars, URL is api.github.com/repos/{{GSD_REPO}}/commits/{{GSD_BRANCH}}, https.get present, no npmjs.com or get-shit-done-cc references.</done>
</task>

<task type="auto">
  <name>Task 2: Simplify gsd-statusline.js stale-hooks display — remove parseV() block</name>
  <files>hooks/gsd-statusline.js</files>
  <action>
Remove the parseV() semver dev-install divergence block from hooks/gsd-statusline.js (per D-07, D-08). Read the file and locate lines 403–416 (the IIFE that defines parseV and computes isDevInstall).

The current block reads approximately:
  if (cache.stale_hooks && cache.stale_hooks.length > 0) {
    const isDevInstall = (() => {
      if (!cache.installed || !cache.latest || cache.latest === 'unknown') return false;
      const parseV = v => v.replace(/^v/, '').split('.').map(Number);
      const [ai, bi, ci] = parseV(cache.installed);
      const [an, bn, cn] = parseV(cache.latest);
      return ai > an || (ai === an && bi > bn) || (ai === an && bi === bn && ci > cn);
    })();
    if (isDevInstall) {
      gsdUpdate += '\x1b[33m⚠ dev install — re-run installer to sync hooks\x1b[0m │ ';
    } else {
      gsdUpdate += '\x1b[31m⚠ stale hooks — run /gsd:update\x1b[0m │ ';
    }
  }

Replace this entire block with (per D-08):
  if (cache.stale_hooks && cache.stale_hooks.length > 0) {
    gsdUpdate += '\x1b[31m⚠ stale hooks — run /gsd:update\x1b[0m │ ';
  }

Do not modify the template sentinel guard in the staleHooks loop inside gsd-check-update-worker.js — that guard (!hookVersion.includes('{{')) lives in the worker, not the statusline, and is retained unchanged (per D-07).
  </action>
  <verify>
    <automated>node -e "const src = require('fs').readFileSync('hooks/gsd-statusline.js','utf8'); const has = src.includes('parseV'); process.exitCode = has ? 1 : 0; if (has) console.error('FAIL: parseV still present'); else console.log('OK: parseV removed');"</automated>
  </verify>
  <done>parseV block removed from gsd-statusline.js. Stale-hooks branch is a simple if (cache.stale_hooks && cache.stale_hooks.length > 0) guard with a single warning string.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Add gsdVersion to install.js — git rev-parse SHA + update all VERSION/template writes</name>
  <files>bin/install.js</files>
  <behavior>
    - installSrc.includes('git rev-parse') returns true (INST-01 static assertion)
    - installSrc does not include 'let gsdVersion = pkg.version' (INST-02 negative assertion)
    - installSrc includes the string 'no-network' (INST-02 static assertion)
    - moduleScope (everything before first \nfunction ) does not include 'api.github.com/repos/thamwangjun/get-shit-done/commits' (INST-01 negative assertion)
  </behavior>
  <action>
Make three changes to bin/install.js (per D-09, D-10, D-11, D-12). Read the file before editing.

**Change 1 — Add gsdVersion at module scope (per D-09).**

After line 134 (`const pkg = require('../package.json');`), insert:

  // SHA-based version: computed once from the installed GSD repo HEAD.
  // Falls back to 'no-network' sentinel (not pkg.version) so that stale-hook
  // detection (SHA equality) never false-positives against a semver string.
  const { execFileSync: _execFileSync } = require('child_process');
  let gsdVersion = 'no-network';
  try {
    gsdVersion = _execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], {
      encoding: 'utf8',
      timeout: 5000,
      cwd: __dirname,
    }).trim();
  } catch (_) {}

The const must NOT be `let gsdVersion = pkg.version` — initialize to `'no-network'` first, then attempt git rev-parse in the try block (INST-02 test assertion). The string literal 'no-network' must be present in source.

Note: `execFileSync` may already be destructured elsewhere in install.js under a different binding name. Use a fresh local `_execFileSync` name to avoid naming collisions with any existing binding.

**Change 2 — Replace pkg.version in VERSION file writes (per D-10).**

Replace `pkg.version` with `gsdVersion` at the following three VERSION write sites:
- Line ~8727: `fs.writeFileSync(versionDest, pkg.version)` → `fs.writeFileSync(versionDest, gsdVersion)`
- Line ~8729: the console.log that prints pkg.version → print gsdVersion
- Lines ~8212/8282: These are Codex rollback snapshot paths — they read/restore the VERSION file as bytes, not as a string derived from pkg.version. Leave those lines unchanged (they restore the pre-install bytes, not write a new version string). Only change the primary write at line ~8727 and its adjacent console.log.

**Change 3 — Replace pkg.version with gsdVersion in all {{GSD_VERSION}} replacement lines, and add {{GSD_REPO}} and {{GSD_BRANCH}} replacements (per D-11, D-12).**

There are six .replace(/{GSD_VERSION}/g, pkg.version) calls at approximately lines 7968, 8769, 8778, 8799, 9115, 9126. For each one, change pkg.version to gsdVersion AND add two adjacent lines immediately after for the new template placeholders:
  content = content.replace(/\{\{GSD_REPO\}\}/g, 'thamwangjun/get-shit-done');
  content = content.replace(/\{\{GSD_BRANCH\}\}/g, 'main');

Pattern for each replacement block (apply to all six sites):
  content = content.replace(/\{\{GSD_VERSION\}\}/g, gsdVersion);
  content = content.replace(/\{\{GSD_REPO\}\}/g, 'thamwangjun/get-shit-done');
  content = content.replace(/\{\{GSD_BRANCH\}\}/g, 'main');

Do not modify any other pkg.version references in install.js (header banner at line ~572, runtime-version reporting at lines ~1880, ~5741, ~7519, ~10606 — these remain pkg.version as they report the npm package version, not the installed GSD SHA).
  </action>
  <verify>
    <automated>node --test tests/version-detection.test.cjs</automated>
  </verify>
  <done>Both tests in version-detection.test.cjs pass. install.js source contains 'git rev-parse', contains 'no-network', does not contain 'let gsdVersion = pkg.version', and module scope does not call GitHub API. All six {{GSD_VERSION}} replacement sites use gsdVersion and are accompanied by {{GSD_REPO}} and {{GSD_BRANCH}} replacements.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>All three source files modified: worker rewritten with SHA isNewer + GitHub API fetch, statusline parseV() block removed, install.js gsdVersion added with all VERSION/template writes updated.</what-built>
  <how-to-verify>
    1. Run the full failing-test suite to confirm all 7 pass:
       node --test tests/semver-compare.test.cjs tests/version-detection.test.cjs
    2. Run the full test suite to confirm no regressions:
       npm test
    3. Visually confirm gsd-check-update-worker.js has `function isNewer` before `function writeResult` and the URL contains {{GSD_REPO}}/{{GSD_BRANCH}}.
    4. Visually confirm gsd-statusline.js stale_hooks block is a single if + gsdUpdate += line with no IIFE.
    5. Visually confirm install.js has `let gsdVersion = 'no-network'` (not `= pkg.version`) near the top.
  </how-to-verify>
  <resume-signal>Type "approved" if all 7 target tests pass and npm test shows no new failures, or describe any issues found.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| worker → GitHub API | Worker makes outbound HTTPS request; response JSON is untrusted |
| install.js → git subprocess | Reads git rev-parse output; HEAD may not exist in non-git environments |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-42-01 | Tampering | gsd-check-update-worker.js: GitHub API response | mitigate | JSON.parse in try/catch; only .sha field extracted; writeResult(null) on parse failure |
| T-42-02 | Denial of Service | gsd-check-update-worker.js: network timeout | mitigate | req.setTimeout(10000, () => req.destroy()) per D-04; destroy triggers error → writeResult(null) |
| T-42-03 | Information Disclosure | bin/install.js: git rev-parse output | accept | Short SHA (7 chars) is already public; written to VERSION file which is shipped intentionally |
| T-42-04 | Elevation of Privilege | bin/install.js: execFileSync git subprocess | accept | git is a trusted system binary; cwd: __dirname scopes the lookup to the installer's directory |
| T-42-SC | Tampering | No new npm/pip/cargo installs in this phase | accept | No new package installs; no slopcheck required |
</threat_model>

<verification>
node --test tests/semver-compare.test.cjs tests/version-detection.test.cjs
npm test
</verification>

<success_criteria>
- All 5 tests in tests/semver-compare.test.cjs pass (isNewer SHA logic + HOOK-03 + HOOK-04 static assertions)
- All 2 tests in tests/version-detection.test.cjs pass (INST-01 + INST-02 static assertions)
- npm test shows no new failures across the full test suite
- hooks/gsd-check-update-worker.js contains no references to npmjs.com or get-shit-done-cc
- bin/install.js contains 'no-network' sentinel and 'git rev-parse' but not 'let gsdVersion = pkg.version'
</success_criteria>

<output>
Create `.planning/phases/42-sha-hook-and-install-reimplementation/42-01-SUMMARY.md` when done
</output>
