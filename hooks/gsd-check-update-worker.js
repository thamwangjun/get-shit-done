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
const projectVersionFile = process.env.GSD_PROJECT_VERSION_FILE || '';
const globalVersionFile  = process.env.GSD_GLOBAL_VERSION_FILE  || '';

// Check project directory first (local install), then global
let installed = 'unknown';
let configDir = '';
let readError = null;
try {
  if (fs.existsSync(projectVersionFile)) {
    installed = fs.readFileSync(projectVersionFile, 'utf8').trim();
    configDir = path.dirname(path.dirname(projectVersionFile));
  } else if (fs.existsSync(globalVersionFile)) {
    installed = fs.readFileSync(globalVersionFile, 'utf8').trim();
    configDir = path.dirname(path.dirname(globalVersionFile));
  }
} catch (e) {
  readError = e.message;
}

// Check for stale hooks — compare hook version headers against installed VERSION
// Hooks are installed at configDir/hooks/ (e.g. ~/.claude/hooks/) (#1421)
// Only check hooks that GSD currently ships — orphaned files from removed features
// (e.g., gsd-intel-*.js) must be ignored to avoid permanent stale warnings (#1750)
const MANAGED_HOOKS = [
  'gsd-check-update-worker.js',
  'gsd-check-update.js',
  'gsd-update-banner.js',
  'gsd-context-monitor.js',
  'gsd-phase-boundary.sh',
  'gsd-prompt-guard.js',
  'gsd-read-guard.js',
  'gsd-read-injection-scanner.js',
  'gsd-session-state.sh',
  'gsd-statusline.js',
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
            // Normalize both sides to 7-char prefix before comparing so a
            // full 40-char SHA in the VERSION file doesn't cause false positives.
            const norm = (s) => (s && s.length >= 7 ? s.slice(0, 7) : s);
            if (norm(hookVersion) !== norm(installed) && !hookVersion.includes('{{')) {
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

// isNewer with SHA equality semantics (D-01)
// Normalise both sides to 7-char prefix so a full 40-char SHA stored in
// the VERSION file (e.g. future tarball install path) never causes a
// permanent false-positive "update available" — mirrors stale-hook check
// at lines 70-71 which already uses this defensive norm() pattern.
function isNewer(latest, installed) {
  if (!latest) return false;
  const norm = (s) => (s && s.length >= 7 ? s.slice(0, 7) : s);
  return norm(latest) !== norm(installed);
}

let latest = null;
let wrote = false;

function writeResult() {
  if (wrote) return;
  wrote = true;
  const result = {
    update_available: installed !== 'unknown' && latest && isNewer(latest, installed),
    installed,
    latest: latest || 'unknown',
    checked: Math.floor(Date.now() / 1000),
    stale_hooks: staleHooks.length > 0 ? staleHooks : undefined,
    read_error: readError || undefined,
  };
  if (cacheFile) {
    try { fs.writeFileSync(cacheFile, JSON.stringify(result)); } catch (e) {}
  }
}
try {
  const req = https.get(
    'https://api.github.com/repos/{{GSD_REPO}}/commits/{{GSD_BRANCH}}',
    {
      headers: {
        'User-Agent': 'gsd-check-update-worker',
        'Accept': 'application/vnd.github.v3+json',
      },
      timeout: 10000,
    },
    (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const sha = JSON.parse(body).sha;
          if (sha && /^[0-9a-f]{40}$/.test(sha)) {
            latest = sha.slice(0, 7);
          }
        } catch (e) {}
        writeResult();
      });
    }
  );
  req.on('error', () => writeResult());
  req.on('timeout', () => { req.destroy(); writeResult(); });
} catch (e) {
  writeResult();
}
