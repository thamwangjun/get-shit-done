---
phase: 50-maintenance-script-and-cross-ref-scanner
slug: maintenance-script-and-cross-ref-scanner
status: verified
threats_open: 0
asvs_level: 1
created: 2026-05-31
audit_mode: retroactive-stride
---

# Phase 50 — Security

> Per-phase security contract: retroactive STRIDE threat register, accepted risks, and audit trail.
> No `<threat_model>` block existed in PLAN files. The register below was reconstructed from the implementation files and verified by direct code inspection. Both Plan 02 and Plan 03 SUMMARY files declared `## Threat Flags: None`; this audit independently validates that disposition.

---

## Scope

Three artifacts audited:

1. `scripts/normalize-step-numbers.cjs` — Node.js CLI that rewrites markdown step numbering across `agents/`, `get-shit-done/workflows/`, `commands/gsd/` (in-place writes when run without `--dry-run`).
2. `tests/cross-file-step-refs.test.cjs` — Node test runner suite that scans corpus markdown and writes one temp file per RED test under `os.tmpdir()`.
3. `tests/step-numbering-scan.test.cjs` — Node test runner suite that only reads corpus markdown (no writes); audited because Plan 01 hardened its `scanForOutOfOrder` regex anchor.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Developer terminal → Node process | `process.argv` flag parsing (`--dry-run` only) | flag string |
| Node process → repo filesystem | Read of `*.md` under `SCAN_DIRS`; conditional write back to same files | utf-8 markdown |
| Node process → OS tmpdir | Test creates a `gsd-xref-red-*` subdir for RED-test fixture | utf-8 markdown |
| Repo filesystem → repo filesystem | None outside `SCAN_DIRS = ['agents', 'get-shit-done/workflows', 'commands/gsd']` |  |
| Network | None — zero external HTTP/DNS calls in any audited file |  |

`SCAN_DIRS` and `PATTERN_C_EXCLUDES` are hardcoded module-level constants. No user input selects scan paths. No `child_process`, no `http(s)`, no `net`, no `dns` requires.

---

## Threat Register (STRIDE — Retroactive)

| Threat ID | Category | Component | Disposition | Mitigation | Evidence | Status |
|-----------|----------|-----------|-------------|------------|----------|--------|
| T-50-01 | Tampering | `scripts/normalize-step-numbers.cjs` — argument parsing | mitigate | Unknown `process.argv` flags rejected with non-zero exit before any FS access | `scripts/normalize-step-numbers.cjs:32-37` — `for (const arg of process.argv.slice(2)) { if (arg !== '--dry-run') { ... process.exit(1); } }` | closed |
| T-50-02 | Tampering | `scripts/normalize-step-numbers.cjs` — file write scope | mitigate | Write target is restricted to `SCAN_FILES` derived from hardcoded `SCAN_DIRS`; no user-controlled path joins | `scripts/normalize-step-numbers.cjs:46-50` (hardcoded `SCAN_DIRS`), `:107-114` (build `SCAN_FILES` from `path.join(PROJECT_ROOT, dir)`), `:451` (loop iterates only `SCAN_FILES`), `:428` (`if (!DRY_RUN) fs.writeFileSync(filePath, result, 'utf-8')` — `filePath` originates from `SCAN_FILES`) | closed |
| T-50-03 | Tampering | `scripts/normalize-step-numbers.cjs` — `--dry-run` gate | mitigate | All write paths gated on `!DRY_RUN`; `processFile` returns idempotently when `result === original` | `scripts/normalize-step-numbers.cjs:41` (`DRY_RUN = process.argv.includes('--dry-run')`), `:426` (idempotency early-return), `:428` (single write gated on `!DRY_RUN`) | closed |
| T-50-04 | Elevation of Privilege | `scripts/normalize-step-numbers.cjs` — path traversal via SCAN_DIRS | mitigate | `collectMarkdownFiles` uses `path.join(dir, entry.name)` recursion starting from `path.join(PROJECT_ROOT, dir)`; no symlink-following hardening but `SCAN_DIRS` is hardcoded and recurses repo-local content only; `path.relative(PROJECT_ROOT, f)` is used purely for display/exclusion comparison | `scripts/normalize-step-numbers.cjs:85-103` (`collectMarkdownFiles`), `:108-110` (scan roots = `path.join(PROJECT_ROOT, dir)` for hardcoded dirs) | closed |
| T-50-05 | Denial of Service | RegExp patterns in normalize script | mitigate | Inspected all regex literals: `STEP_DECIMAL_RE`, `PATTERN_D_RE`, `XREF_PATTERNS[0]`, `XREF_PATTERNS[1]`, `lineRe`, `inline /^(\s*(?:[-*+]|\d+\.|>)\s*)+/`. No nested quantifiers, no overlapping alternations with quantifiers — ReDoS profile is linear. Character classes `[a-z0-9_./-]+` are followed by a literal anchor `\.md` which prevents catastrophic backtracking | `scripts/normalize-step-numbers.cjs:62, 66, 70-73, 158, 165, 229, 415`; `tests/step-numbering-scan.test.cjs:149-150` (Plan 1 hardened anchor — stripping regex `^(\s*(?:[-*+]|\d+\.|>)\s*)+` has a possessive boundary and `match` regex has only single quantifiers) | closed |
| T-50-06 | Denial of Service | `scripts/normalize-step-numbers.cjs` — input file size | accept | Script reads each markdown file fully into memory via `fs.readFileSync(filePath, 'utf-8')`. The repo's `SCAN_DIRS` content is tracked markdown only; no external untrusted input. A maliciously huge tracked file would have to be committed first — that is a separate supply-chain concern caught at review. See accepted risks log. | `scripts/normalize-step-numbers.cjs:383, 439` | closed |
| T-50-07 | Information Disclosure | stdout logging from normalize script | mitigate | `console.log` output is limited to relative paths under `SCAN_DIRS` and integer counters. No file contents, no credentials, no env vars are logged | `scripts/normalize-step-numbers.cjs:458, 465-468` — output only `relPath`, `DRY_RUN` prefix, and integer counters | closed |
| T-50-08 | Repudiation | `scripts/normalize-step-numbers.cjs` — change attribution | mitigate | Idempotent in-place writes are intended to be invoked from developer terminal and committed via git; git provides authoritative audit trail (commit author, signature). Script logs every rewritten file to stdout with `fixed:` / `[dry]` prefix for run-time review | `scripts/normalize-step-numbers.cjs:458`; git log is the authoritative attribution channel for tracked markdown | closed |
| T-50-09 | Tampering | `tests/cross-file-step-refs.test.cjs` — RED test temp file | mitigate | Temp dir created via `fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-xref-red-'))`; writes only inside that mkdtemp-allocated directory; `try/finally` guarantees `fs.rmSync(tmpDir, { recursive: true, force: true })` cleanup on any assertion outcome | `tests/cross-file-step-refs.test.cjs:386-392` (mkdtemp + writeFileSync inside tmpDir), `:393, 416-418` (try/finally with rmSync) | closed |
| T-50-10 | Tampering | `tests/cross-file-step-refs.test.cjs` — corpus mutation during test | mitigate | All corpus access is read-only (`fs.readFileSync`); no `writeFileSync`/`appendFileSync`/`renameSync` against `PROJECT_ROOT` paths | `tests/cross-file-step-refs.test.cjs:329, 348, 394, 407` — only `readFileSync` on corpus files; only writeFileSync target is `synthFile` inside `tmpDir` | closed |
| T-50-11 | Denial of Service | `tests/cross-file-step-refs.test.cjs` — temp dir leak under crash | mitigate | `try/finally` block wraps the test body; `fs.rmSync(tmpDir, { recursive: true, force: true })` runs even when assertions throw | `tests/cross-file-step-refs.test.cjs:393-418` | closed |
| T-50-12 | Spoofing | `tests/cross-file-step-refs.test.cjs` — same-file ref classification | mitigate | Dual-check: `path.basename(sourceFile) === targetBasename` AND `sourceRelPath.endsWith('/' + targetBasename)` must agree; conservative fallback treats basename-only match as same-file to avoid false cross-file reports | `tests/cross-file-step-refs.test.cjs:210-216` (basename+suffix dual check + conservative fallback) | closed |
| T-50-13 | Denial of Service | RegExp patterns in cross-file scanner | mitigate | Inspected all regex literals in the scanner: `XREF_PATTERNS[0]`, `XREF_PATTERNS[1]`, `extractStepSet` heading regex, Pattern D regex. All use single quantifiers on bounded character classes followed by literal anchors; no nested quantifiers; no overlapping alternations | `tests/cross-file-step-refs.test.cjs:54-57, 141, 147` | closed |
| T-50-14 | Tampering | `tests/cross-file-step-refs.test.cjs` — fresh RegExp per call (Plan 50 IN-02 fix) | mitigate | `findCrossFileRefs` constructs a new `RegExp(patternTemplate.source, patternTemplate.flags)` per call rather than mutating the module-level `/g`-flagged regex `lastIndex` — prevents cross-call state leakage across parallel test subtests | `tests/cross-file-step-refs.test.cjs:184-185` (`new RegExp(patternTemplate.source, patternTemplate.flags)` constructed inside the per-line loop) | closed |
| T-50-15 | Tampering | `scripts/normalize-step-numbers.cjs` — escaped regex in `applyRenameMap` (Plan 50 IN-01 fix) | mitigate | `applyRenameMap` escapes `oldLabel` via `oldLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` before constructing the replacement RegExp — prevents regex injection if a rename map key contains metacharacters | `scripts/normalize-step-numbers.cjs:229` (escape) and `:230` (`new RegExp(escaped, 'g')`) | closed |
| T-50-16 | Information Disclosure | Network access | mitigate | No `http`, `https`, `net`, `dns`, `child_process` imports in any audited file. Verified by `require(` grep | `command grep -n "require(" scripts/normalize-step-numbers.cjs tests/cross-file-step-refs.test.cjs` shows only `fs`, `path`, `os`, `node:test`, `node:assert/strict` | closed |
| T-50-17 | Elevation of Privilege | `scripts/normalize-step-numbers.cjs` — shebang invocation | mitigate | Shebang `#!/usr/bin/env node` resolves Node via `PATH`; consistent with repo's other scripts (`scripts/strip-prose-atrefs.cjs` precedent). No `setuid` or privileged context. Script runs as the invoking developer's UID | `scripts/normalize-step-numbers.cjs:1` | closed |
| T-50-18 | Tampering | `tests/step-numbering-scan.test.cjs` — Plan 01 anchor hardening did not loosen detection | mitigate | The hardened `scanForOutOfOrder` strips a bounded prefix `/^(\s*(?:[-*+]|\d+\.|>)\s*)+/` then matches `/^[\s*]*Step\s+(\d+)(?![\.\da-z])/i`. The negative lookahead `(?![\.\da-z])` prevents the permissive `[\s*]*` from matching decimal step labels — verified by the four companion unit tests at lines 267-289 confirming dash, numbered-list, blockquote, and asterisk-list prefixes are detected | `tests/step-numbering-scan.test.cjs:149-150` (strip + match), `:267-289` (four companion assertion tests) | closed |

*Status legend: `open` (mitigation absent) · `closed` (verified in code)*
*Disposition legend: `mitigate` (implementation required and verified) · `accept` (documented risk) · `transfer` (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-50-01 | T-50-06 (file-size DoS via tracked corpus) | Script consumes only repo-tracked markdown via `fs.readFileSync` with no streaming. A maliciously oversized markdown file would have to clear PR review and `npm test` first; the supply-chain control surface is git commit review, not this script. Adding a streaming reader would not change the threat model since RegExp `.test()` and `.replace()` already operate over the full string. | Phase 50 — retroactive STRIDE audit | 2026-05-31 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-05-31 | 18 | 18 | 0 | gsd-security-auditor (retroactive STRIDE) |

---

## Unregistered Flags

`50-02-SUMMARY.md` and `50-03-SUMMARY.md` both declare `## Threat Flags: None`. `50-01-SUMMARY.md` does not include a Threat Flags section. The retroactive STRIDE register above is the complete attack-surface map for the phase; no unregistered flags surfaced during audit.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-05-31
