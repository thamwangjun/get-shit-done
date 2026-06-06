# SECURITY.md — Phase 57: install-time-translation

**ASVS Level:** 1
**Disposition:** All 6 threats CLOSED (1 mitigate verified in code, 5 accept rationale confirmed).
**Verified:** 2026-06-06

## Threat Verification

| Threat ID | Category | Disposition | Status | Evidence |
|-----------|----------|-------------|--------|----------|
| T-57-01 | Tampering (npm/test deps) | accept | CLOSED | 57-01 adds only `tests/feat-57-install-translation.test.cjs`; no package.json change, uses node --test + tests/helpers.cjs. tech_stack.added: []. |
| T-57-02 | Tampering (npm installs) | accept | CLOSED | 57-02 modifies only get-shit-done/bin/lib/core.cjs (pure .cjs edits); tech_stack.added: []. |
| T-57-03 | Injection (translateEffortForCodex output) | accept | CLOSED | core.cjs:1278-1281 — output is fixed token set (`xhigh`/passthrough of allowlist token) or `null`; never derives from free-form text. |
| T-57-04 | Injection (model_reasoning_effort in TOML) | mitigate | CLOSED | See verification below. |
| T-57-05 | Tampering (npm installs) | accept | CLOSED | 57-03 modifies only bin/install.js + one test file (pure .js edits); tech_stack.added: []. |
| T-57-06 | Information disclosure (install-time config read) | accept | CLOSED | install.js:1520 resolveEffort reuses the existing probedProjectDir walk-up (same .planning/config.json the model resolver reads); no new file/network read. |

## T-57-04 Mitigation Verification (mitigate)

Claim: emitted effort is a fixed allowlist token or omitted; JSON.stringify-quoted, never raw interpolation.

1. **Fixed-token output, no free-form text** — `get-shit-done/bin/lib/core.cjs:1278-1281`:
   ```js
   function translateEffortForCodex(effort) {
     if (effort == null) return null;
     return effort === 'max' ? 'xhigh' : effort;
   }
   ```
   Returns `'xhigh'` for `'max'`, otherwise the resolver token (allowlist-gated upstream), or `null`. No string concatenation, no user text.

2. **JSON.stringify-quoted into TOML, not raw interpolation** — `bin/install.js:2797`:
   ```js
   lines.push(`model_reasoning_effort = ${JSON.stringify(codexEffort)}`);
   ```
   Value is JSON.stringify-quoted — no raw string interpolation reaches the TOML line.

3. **Null/haiku omitted, not emitted empty** — `bin/install.js:2796` guards the push with `if (codexEffort)` (truthy). `null` (haiku tier, returned by the core resolver at core.cjs:1644 and :1663 haiku guards, and `translateEffortForCodex(null) === null`) is omitted entirely. No `model_reasoning_effort = ""` line is ever produced.
   Emit is additionally gated on `runtimeResolver.runtime === 'codex'` (install.js:2787, D-04 — Claude path untouched).

## Accept Rationale Confirmation

- **No new packages (T-57-01/02/05):** all three SUMMARY files report `tech_stack.added: []`; modified files are limited to `.cjs`/`.js`/test files. No package.json or lockfile change.
- **Fixed-token output (T-57-03):** confirmed at core.cjs:1278-1281 (see above).
- **No new file/network read (T-57-06):** resolveEffort (install.js:1520) closes over the existing `probedProjectDir` (Pitfall 3 avoided — no second walk-up); reads the same .planning/config.json the model resolver already reads. No network surface.

## Unregistered Flags

None. All three SUMMARY.md `## Threat Flags` sections report "None — no new trust boundaries." No new attack surface appeared during implementation.

## Accepted Risks Log

- T-57-01, T-57-02, T-57-05: supply-chain risk from new dependencies — accepted; no dependencies added.
- T-57-03: injection via effort output — accepted; output is a fixed allowlist token or null.
- T-57-06: install-time config disclosure — accepted; reuses pre-existing config read, no new surface.
