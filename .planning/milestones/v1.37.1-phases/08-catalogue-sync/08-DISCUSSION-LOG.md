# Phase 8: CATALOGUE Sync - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 08-catalogue-sync
**Areas discussed:** Entry descriptions, Count discrepancy

---

## Entry descriptions

| Option | Description | Selected |
|--------|-------------|----------|
| File metadata | Commands: use YAML `description:` field verbatim. References/workflows: derive 1-line from header subtitle or `<purpose>` tag, trimmed to match existing style. | ✓ |
| Write manually | Author all 20 descriptions by hand after reading each file. More control, more work. | |

**User's choice:** File metadata
**Notes:** None — decision was straightforward given command files already have well-formed `description:` YAML fields.

---

## Count discrepancy

| Option | Description | Selected |
|--------|-------------|----------|
| Disk scan — 20 entries / 270 total | Plan's "21" was likely a miscounting error. Use disk-vs-CATALOGUE diff as authoritative. | |
| Dig deeper first | Search for a possible 21st file before locking the target. | ✓ |

**User's choice:** Dig deeper first

**Investigation findings:**
- `git diff --diff-filter=A` on the upstream merge commit (14ca3f4) revealed **22 new `.md` files** added by v1.37.1.
- 2 of those files are in `docs/` — a directory CATALOGUE.json does not track: `docs/gsd-sdk-query-migration-blurb.md` and `docs/skills/discovery-contract.md`.
- CATALOGUE-relevant new files: exactly **20** (6 commands + 8 references + 5 workflows + 1 template).
- **Conclusion:** The plan's "21 entries / ~271 total" was a miscounting error caused by including the 2 `docs/` files. Authoritative target: 20 entries, total 270.

---

## Claude's Discretion

- Alphabetical insertion position within each CATALOGUE array
- Whether to write all 20 entries in a single atomic write or category-by-category
- Exact phrasing for reference/workflow descriptions (within the file-metadata style constraint)

## Deferred Ideas

None — discussion stayed within phase scope.
