# Phase 20: Baseline Audit - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 20-baseline-audit
**Areas discussed:** Artifact format, Anomaly detail, Upstream comparison scope, Script disposition

---

## Artifact format

| Option | Description | Selected |
|--------|-------------|----------|
| Both Markdown + JSON | Markdown for humans; JSON for downstream automation | ✓ |
| Markdown only | Human-readable table per level | |
| JSON only | Structured file, great for automation | |

**User's choice:** Both Markdown + JSON

| Option | Description | Selected |
|--------|-------------|----------|
| Phase dir only (.planning/phases/20-baseline-audit/) | Standard GSD location | ✓ |
| Committed to refs/ as permanent artifact | More visible, survives milestone archival | |
| Both — phase dir + refs/ copy | Phase dir canonical; refs/ copy for discoverability | |

**User's choice:** Phase dir only

| Option | Description | Selected |
|--------|-------------|----------|
| One table per level (5 sections) | agents/, commands/gsd/, workflows/, templates/, references/ each get their own section | ✓ |
| Single flat table sorted by directory | All 274 files in one table with a level column | |

**User's choice:** One table per level (5 sections)

---

## Anomaly detail

| Option | Description | Selected |
|--------|-------------|----------|
| Rich — file + current tag + expected tag + anomaly type | Enough for phases 21–24 to target conversions precisely | ✓ |
| Minimal — file + current tag (or "none") | Downstream computes the expected vs actual diff themselves | |
| Rich + line numbers | Adds line number where each tag was found | |

**User's choice:** Rich — file + current tag + expected tag + anomaly type

---

## Upstream comparison scope

**User clarification (freeform):** "This milestone is done with upstream branch as source of truth. Tag conversions are done in this fork."

**Follow-up:** Does the inventory need to show what upstream/v1.37.1 has per file, or does upstream just define which files are in scope?

| Option | Description | Selected |
|--------|-------------|----------|
| Upstream defines scope only — audit documents fork's current state | | ✓ |
| Delta view — show upstream tag + fork current tag per file | | |

**User's choice:** Upstream defines scope only

---

## Script disposition

| Option | Description | Selected |
|--------|-------------|----------|
| Node.js CJS (matches existing test pattern) | Consistent with fork-persona-tag.test.cjs and fork-intent-tag.test.cjs | ✓ |
| Bash script | Simpler for file scanning but inconsistent with toolchain | |

**User's choice:** Node.js CJS — committed as scripts/audit-tags.js

---

## Claude's Discretion

- Exact JSON schema structure
- Column ordering in Markdown tables
- Whether to add an anomaly summary section at the top of the Markdown
- Script invocation interface (flags, stdout vs file output)

## Deferred Ideas

None
