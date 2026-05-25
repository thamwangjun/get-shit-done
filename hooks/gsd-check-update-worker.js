#!/usr/bin/env node
// gsd-hook-version: {{GSD_VERSION}}
// Background worker spawned by gsd-check-update.js (SessionStart hook).
// Checks for GSD updates and stale hooks, writes result to cache file.
// Receives paths via environment variables set by the parent hook.
//
// Using a separate file (rather than node -e '<inline code>') avoids the
// template-literal regex-escaping problem: regex source is plain JS here.

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const cacheFile = process.env.GSD_CACHE_FILE;
const projectVersionFile = process.env.GSD_PROJECT_VERSION_FILE;
const globalVersionFile = process.env.GSD_GLOBAL_VERSION_FILE;

// SHA-based comparison: true if latest is a non-null SHA differing from installed (first 7 chars)
function isNewer(latest, installed) {
  return !!latest && latest.slice(0, 7) !== installed;
}

// Write result object to cache file
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

// Check project directory first (local install), then global
let installed = 'unknown';
let configDir = '';
try {
  if (fs.existsSync(projectVersionFile)) {
    installed = fs.readFileSync(projectVersionFile, 'utf8').trim();
    configDir = path.dirname(path.dirname(projectVersionFile));
  } else if (fs.existsSync(globalVersionFile)) {
    installed = fs.readFileSync(globalVersionFile, 'utf8').trim();
    configDir = path.dirname(path.dirname(globalVersionFile));
  }
} catch (e) {}

// Check for stale hooks — compare hook version headers against installed VERSION
// Hooks are installed at configDir/hooks/ (e.g. ~/.claude/hooks/) (#1421)
// Only check hooks that GSD currently ships — orphaned files from removed features
// (e.g., gsd-intel-*.js) must be ignored to avoid permanent stale warnings (#1750)
const MANAGED_HOOKS = [
  'gsd-check-update-worker.js',
  'gsd-check-update.js',
  'gsd-context-monitor.js',
  'gsd-graphify-update.sh',
  'gsd-phase-boundary.sh',
  'gsd-prompt-guard.js',
  'gsd-read-guard.js',
  'gsd-read-injection-scanner.js',
  'gsd-session-state.sh',
  'gsd-statusline.js',
  'gsd-update-banner.js',
  'gsd-validate-commit.sh',
  'gsd-workflow-guard.js',
];

let staleHooks = [];
if (configDir) {
  const hooksDir = path.join(configDir, 'hooks');
  try {
    if (fs.existsSync(hooksDir)) {
      const hookFiles = fs.readdirSync(hooksDir).filter(f => MANAGED_HOOKS.includes(f));
      for (const hookFile of hookFiles) {
        try {
          const content = fs.readFileSync(path.join(hooksDir, hookFile), 'utf8');
          // Match both JS (//) and bash (#) comment styles
          const versionMatch = content.match(/(?:\/\/|#) gsd-hook-version:\s*(.+)/);
          if (versionMatch) {
            const hookVersion = versionMatch[1].trim();
            if (isNewer(installed, hookVersion) && !hookVersion.includes('{{')) {
              staleHooks.push({ file: hookFile, hookVersion, installedVersion: installed });
            }
          } else {
            // No version header at all — definitely stale (pre-version-tracking)
            staleHooks.push({ file: hookFile, hookVersion: 'unknown', installedVersion: installed });
          }
        } catch (e) {}
      }
    }
  } catch (e) {}
}

// Fetch latest commit SHA from the fork's GitHub Commits API
// {{GSD_REPO}} and {{GSD_BRANCH}} are replaced at install time
// Full URL: https://api.github.com/repos/{{GSD_REPO}}/commits/{{GSD_BRANCH}}
const req = https.get({
  host: 'api.github.com',
  path: '/repos/{{GSD_REPO}}/commits/{{GSD_BRANCH}}',
  headers: { 'User-Agent': 'gsd-check-update' },
}, (res) => {
  if (res.statusCode !== 200) {
    writeResult(null);
    return;
  }
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      writeResult(JSON.parse(data).sha);
    } catch (e) {
      writeResult(null);
    }
  });
});

req.setTimeout(10000, () => req.destroy());
req.on('error', () => writeResult(null));
