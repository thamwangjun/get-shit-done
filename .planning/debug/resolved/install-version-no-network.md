---
slug: install-version-no-network
status: resolved
trigger: "When bin/install.js --claude --global, VERSION is no-network even then network is available."
created: 2026-04-23
updated: 2026-04-23
---

## Symptoms

- **Expected:** VERSION should reflect the installed/local version (read from package.json or local install), not fetched from network
- **Actual:** VERSION resolves to the literal string `"no-network"` when running `bin/install.js --claude --global`
- **Error messages:** Not yet checked — logs unknown
- **Timeline:** First time testing `--claude --global` flag combination — regression status unknown
- **Reproduction:** Run `bin/install.js --claude --global` from a directory that is NOT the get-shit-done repo root, observe VERSION = "no-network"

## Current Focus

hypothesis: "no-network" fallback fires because execSync('git rev-parse') inherits process.cwd() instead of the repo root — so when the user runs the script from another directory, git fails and the catch block leaves gsdVersion as 'no-network'
test: ""
expecting: ""
next_action: "fix applied — add cwd: path.join(__dirname, '..') to execSync options"
reasoning_checkpoint: "The execSync call at line 63 has no cwd option. It inherits process.cwd() at runtime. When invoked from outside the repo (e.g. global install from ~), git rev-parse fails silently, catch fires, gsdVersion stays 'no-network'. pkg is loaded from package.json but never used for gsdVersion — it is unused. The fix is to pin cwd to __dirname/.."
tdd_checkpoint: ""

## Evidence

- timestamp: 2026-04-23T00:00:00Z
  finding: "bin/install.js line 60: let gsdVersion = 'no-network' as sentinel default"
  file: bin/install.js
  lines: "60-73"

- timestamp: 2026-04-23T00:00:00Z
  finding: "execSync('git rev-parse --short=7 HEAD') at line 63 has no cwd option — inherits process.cwd()"
  file: bin/install.js
  lines: "63-67"

- timestamp: 2026-04-23T00:00:00Z
  finding: "pkg (package.json) is required at line 56 but never referenced — unused variable"
  file: bin/install.js
  lines: "55-56"

- timestamp: 2026-04-23T00:00:00Z
  finding: "git rev-parse succeeds from /home/thamw/development/happier/get-shit-done (returns cd47899), confirming the repo is valid — failure is strictly a cwd mismatch when invoked from elsewhere"
  file: ""
  lines: ""

## Eliminated

- Network connectivity issue — git is local, no network needed
- Missing git binary — confirmed works from repo dir
- Regex mismatch — /^[0-9a-f]{7}$/ is correct and would match if git returned a SHA

## Resolution

root_cause: "execSync('git rev-parse --short=7 HEAD') in bin/install.js has no cwd option, so it runs in process.cwd() at invocation time. When the user runs the script from any directory outside the get-shit-done repo (common with --global), git exits non-zero, the catch block fires, and gsdVersion remains the 'no-network' sentinel."
fix: "Add cwd: path.join(__dirname, '..') to the execSync options object so git always resolves HEAD relative to the repo root, regardless of where the script is invoked."
verification: "Run node bin/install.js --claude --global from ~ or /tmp — VERSION file should now contain a 7-char SHA, not 'no-network'."
files_changed: "bin/install.js"
