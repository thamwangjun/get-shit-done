#!/usr/bin/env node
'use strict';

/**
 * Deterministic latest-version check for /gsd-update (#2992).
 *
 * Fetches the latest commit SHA from the GitHub Commits API.
 * The API endpoint is a CONSTANT in code, not a free choice at
 * execution time. The workflow calls it via `node check-latest-version.cjs
 * --json` and parses the structured response.
 *
 * Tests assert on the typed CHECK_REASON enum and the structured result
 * record, never on console prose.
 */

const https = require('https');

// Hardcoded. Do not parameterise — the whole point of this script is that
// the API endpoint is not a runtime choice for the caller.
const GITHUB_API_URL = 'https://api.github.com/repos/thamwangjun/get-shit-done/commits/main';

const CHECK_REASON = Object.freeze({
  OK: 'ok',
  FAIL_FETCH_FAILED: 'fail_fetch_failed',
  FAIL_INVALID_SHA: 'fail_invalid_sha',
});

/**
 * Pure-ish: takes an injected request function so tests don't actually
 * hit the network. In production, defaults to https.get.
 *
 * @param {object} [opts]
 * @param {Function} [opts.request] - Injectable seam for testing
 * @returns {Promise<{ok: boolean, sha?: string, reason: string, detail?: string}>}
 */
async function checkLatestVersion(opts = {}) {
  const requestFn = opts.request || https.get;

  return new Promise((resolve) => {
    let req;
    try {
      req = requestFn(
        GITHUB_API_URL,
        { headers: { 'User-Agent': 'gsd-check-latest-version' } },
        (res) => {
          if (res.statusCode !== 200) {
            resolve({
              ok: false,
              reason: CHECK_REASON.FAIL_FETCH_FAILED,
              detail: `HTTP ${res.statusCode}`,
            });
            return;
          }
          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            let sha;
            try {
              const body = Buffer.concat(chunks.map(c => Buffer.isBuffer(c) ? c : Buffer.from(c))).toString('utf8');
              const parsed = JSON.parse(body);
              sha = parsed && parsed.sha;
            } catch (e) {
              resolve({
                ok: false,
                reason: CHECK_REASON.FAIL_INVALID_SHA,
                detail: 'failed to parse response JSON',
              });
              return;
            }
            if (!sha || !/^[0-9a-f]{7}/i.test(sha)) {
              resolve({
                ok: false,
                reason: CHECK_REASON.FAIL_INVALID_SHA,
                detail: sha ? `sha too short or invalid: ${sha}` : 'sha field missing or empty',
              });
              return;
            }
            resolve({
              ok: true,
              sha: sha.slice(0, 7),
              reason: CHECK_REASON.OK,
            });
          });
        },
      );
    } catch (err) {
      resolve({
        ok: false,
        reason: CHECK_REASON.FAIL_FETCH_FAILED,
        detail: err.message,
      });
      return;
    }

    req.setTimeout(15_000, () => req.destroy(new Error('fetch timed out')));
    req.on('error', (err) => {
      resolve({
        ok: false,
        reason: CHECK_REASON.FAIL_FETCH_FAILED,
        detail: err.message,
      });
    });
  });
}

async function main() {
  const json = process.argv.includes('--json');
  const r = await checkLatestVersion();
  if (json) {
    process.stdout.write(JSON.stringify(r) + '\n');
  } else if (r.ok) {
    process.stdout.write(r.sha + '\n');
  } else {
    process.stderr.write(`check-latest-version: ${r.reason}: ${r.detail}\n`);
  }
  process.exit(r.ok ? 0 : 1);
}

if (require.main === module) main();

module.exports = { checkLatestVersion, CHECK_REASON, GITHUB_API_URL };
