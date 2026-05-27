---
quick_id: 260527-g3f
slug: fix-install-banner-sha-instead-of-semver
description: Fix install.js banner to display 7-char SHA instead of semver
status: complete
date: 2026-05-27
files_changed:
  - bin/install.js
---

## Problem

The ASCII banner printed by `node bin/install.js` displayed the npm semver string (`v1.1.0`) sourced from `pkg.version`. GSD tracks version identity via the 7-char SHA computed at module scope (`gsdVersion`, lines 141–148), which runs `git rev-parse --short=7 HEAD` and falls back to `'no-network'`. Using semver in the banner was inconsistent with how every other version reference in the installer works.

## Fix

Single-line change on line 586 of `bin/install.js`:

Before:
```
'  Get Shit Done ' + dim + 'v' + pkg.version + reset + '\n' +
```

After:
```
'  Get Shit Done ' + dim + gsdVersion + reset + '\n' +
```

The `'v'` prefix was dropped because a SHA does not carry a version prefix.

## Verification

```bash
node bin/install.js
```

Banner confirmed to show `383eeab` instead of `v1.1.0`.
