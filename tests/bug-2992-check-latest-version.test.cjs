'use strict';
process.env.GSD_TEST_MODE = '1';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const { checkLatestVersion, CHECK_REASON, GITHUB_API_URL } = require(
  path.join(ROOT, 'get-shit-done', 'bin', 'check-latest-version.cjs'),
);

// checkLatestVersion is a pure-ish async function: it fetches the latest
// commit SHA from GitHub API, validates the output, and returns
// { ok, sha | reason }. Tests use a pluggable request fn so no real
// network request is made.

/**
 * Creates a fake https.get-style request function.
 *
 * @param {number} statusCode - HTTP status code to simulate
 * @param {object} bodyObj - Response body to serialize as JSON
 * @param {object} [opts]
 * @param {boolean} [opts.errorOnRequest] - If true, emit an error on the request
 */
function makeFakeRequest(statusCode, bodyObj, opts = {}) {
  return function fakeRequest(url, options, callback) {
    const handlers = {};
    const mockReq = {
      setTimeout(ms, cb) { /* no-op */ },
      destroy(err) {
        if (handlers.error) handlers.error(err || new Error('destroyed'));
      },
      on(event, handler) {
        handlers[event] = handler;
        return mockReq;
      },
    };

    if (opts.errorOnRequest) {
      // Emit error asynchronously so the caller has time to attach .on('error')
      process.nextTick(() => {
        if (handlers.error) {
          handlers.error(new Error('simulated network error'));
        }
      });
      return mockReq;
    }

    const responseHandlers = {};
    const mockRes = {
      statusCode,
      on(event, handler) {
        responseHandlers[event] = handler;
        return mockRes;
      },
    };

    // Invoke callback with mock response
    process.nextTick(() => {
      callback(mockRes);
      // Emit data and end
      process.nextTick(() => {
        if (responseHandlers.data) {
          responseHandlers.data(Buffer.from(JSON.stringify(bodyObj)));
        }
        if (responseHandlers.end) {
          responseHandlers.end();
        }
      });
    });

    return mockReq;
  };
}

/**
 * Creates a fake request that emits a raw string body (no JSON.stringify).
 *
 * @param {number} statusCode
 * @param {string} rawBody
 */
function makeFakeRawRequest(statusCode, rawBody) {
  return function fakeRequest(url, options, callback) {
    const handlers = {};
    const mockReq = {
      setTimeout(ms, cb) { /* no-op */ },
      destroy(err) {
        if (handlers.error) handlers.error(err || new Error('destroyed'));
      },
      on(event, handler) {
        handlers[event] = handler;
        return mockReq;
      },
    };

    const responseHandlers = {};
    const mockRes = {
      statusCode,
      on(event, handler) {
        responseHandlers[event] = handler;
        return mockRes;
      },
    };

    process.nextTick(() => {
      callback(mockRes);
      process.nextTick(() => {
        if (responseHandlers.data && rawBody) {
          responseHandlers.data(Buffer.from(rawBody));
        }
        if (responseHandlers.end) {
          responseHandlers.end();
        }
      });
    });

    return mockReq;
  };
}

describe('Bug #2992: SHA-based latest-version check — constants', () => {
  test('GITHUB_API_URL is the constant GitHub Commits API endpoint', () => {
    assert.equal(
      GITHUB_API_URL,
      'https://api.github.com/repos/thamwangjun/get-shit-done/commits/main',
    );
  });

  test('CHECK_REASON enum exposes the documented codes', () => {
    assert.deepEqual(
      Object.keys(CHECK_REASON).sort(),
      ['FAIL_FETCH_FAILED', 'FAIL_INVALID_SHA', 'OK'].sort(),
    );
  });
});

describe('Bug #2992: SHA-based latest-version check — success paths', () => {
  test('returns { ok: true, sha } when GitHub API returns a valid SHA', async () => {
    const r = await checkLatestVersion({
      request: makeFakeRequest(200, { sha: 'abc1234abcdef' }),
    });
    assert.deepEqual(r, { ok: true, sha: 'abc1234', reason: CHECK_REASON.OK });
  });

  test('truncates full 40-char SHA to 7 chars in result', async () => {
    const fullSha = 'abc1234' + 'a'.repeat(33);
    const r = await checkLatestVersion({
      request: makeFakeRequest(200, { sha: fullSha }),
    });
    assert.equal(r.ok, true);
    assert.equal(r.sha, 'abc1234');
  });
});

describe('Bug #2992: SHA-based latest-version check — error paths', () => {
  test('FAIL_FETCH_FAILED when GitHub API returns non-200', async () => {
    const r = await checkLatestVersion({
      request: makeFakeRequest(404, { message: 'Not Found' }),
    });
    assert.equal(r.ok, false);
    assert.equal(r.reason, CHECK_REASON.FAIL_FETCH_FAILED);
  });

  test('FAIL_FETCH_FAILED detail names the error when request throws', async () => {
    const r = await checkLatestVersion({
      request: makeFakeRequest(200, {}, { errorOnRequest: true }),
    });
    assert.equal(r.ok, false);
    assert.equal(r.reason, CHECK_REASON.FAIL_FETCH_FAILED);
    assert.ok(r.detail, 'detail should be set when request errors');
  });

  test('FAIL_INVALID_SHA when response body has no sha field', async () => {
    const r = await checkLatestVersion({
      request: makeFakeRequest(200, { version: '1.0.0' }),
    });
    assert.equal(r.ok, false);
    assert.equal(r.reason, CHECK_REASON.FAIL_INVALID_SHA);
  });

  test('FAIL_INVALID_SHA when response body is empty', async () => {
    const r = await checkLatestVersion({
      request: makeFakeRawRequest(200, ''),
    });
    assert.equal(r.ok, false);
    assert.equal(r.reason, CHECK_REASON.FAIL_INVALID_SHA);
  });

  test('FAIL_INVALID_SHA when sha field is shorter than 7 chars', async () => {
    const r = await checkLatestVersion({
      request: makeFakeRequest(200, { sha: 'abc12' }),
    });
    assert.equal(r.ok, false);
    assert.equal(r.reason, CHECK_REASON.FAIL_INVALID_SHA);
  });
});
