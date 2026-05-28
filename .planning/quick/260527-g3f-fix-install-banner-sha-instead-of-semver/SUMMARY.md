---
quick_id: 260527-g3f
slug: fix-install-banner-sha-instead-of-semver
status: complete
date: 2026-05-27
files_changed:
  - bin/install.js
commit: 44ad13c1
---

# Quick Task Summary: fix-install-banner-sha-instead-of-semver

## What was done

Fixed `bin/install.js` banner (line 586) to display the 7-char git SHA via `gsdVersion` instead of `pkg.version` (semver). The `v` prefix was also removed since SHAs do not use it.

## Result

`node bin/install.js` now shows the current HEAD SHA (e.g. `44ad13c`) in the banner instead of `v1.1.0`. Consistent with the SHA-based versioning system from milestone v2.1.0-a.

## Files changed

- `bin/install.js` — line 586: `'v' + pkg.version` replaced with `gsdVersion`
