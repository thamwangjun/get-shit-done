# Phase 64: Citation Pattern Exploration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-09
**Phase:** 64-citation-pattern-exploration
**Areas discussed:** Findings format, Citation boundary, Allowlist pre-scoping, Scanning approach

---

## Findings Format

| Option | Description | Selected |
|--------|-------------|----------|
| Phase dir markdown file | 64-FINDINGS.md with table: file:line \| matched text \| category \| notes. Phase 65 reads directly. | ✓ |
| Inline in CONTEXT.md | Embed findings table in context file. Mixes planning decisions with raw scan data. | |
| You decide | Claude picks the format. | |

**User's choice:** Phase dir markdown file

---

| Option | Description | Selected |
|--------|-------------|----------|
| file:line \| matched_text \| category | Minimal 3-column table. Phase 65 derives regex from 'category' column. | ✓ |
| file:line \| matched_text \| category \| regex_candidate | Adds 4th column for proposed detector pattern. | |
| file:line \| matched_text \| category \| context_snippet \| allowlist_candidate | Full 5-column with surrounding context and allowlist flags. | |

**User's choice:** 3-column table (file:line \| matched_text \| category)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — summary section first | Summary block: categories found, count per category, #NNN total confirmed. | ✓ |
| No — table only | Raw data only, no summary. | |

**User's choice:** Summary section first

---

## Citation Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Issue/PR number references only | #NNN, issue NNN, feat-NNNN (tracker IDs). Test filenames and ADR slugs excluded. | ✓ |
| Any numbered identifier in prose | Broader: includes ADR refs, version refs, tracker IDs. | |
| You decide | Claude scopes it. | |

**User's choice:** Issue/PR number references only

---

| Option | Description | Selected |
|--------|-------------|----------|
| Flag it — it's an issue/PR reference | feat-3347 encodes a tracker ID even in filename references. Flag as 'feat-form'. | ✓ |
| Skip it — it's a filename reference | Only flag standalone references, not those embedded in file path strings. | |
| You decide | Claude resolves the edge case. | |

**User's choice:** Flag it — feat-form citations in prose are citations

---

## Allowlist Pre-scoping

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 64 maps them | 64-FINDINGS.md includes Allowlist Candidates section: hex colors, heading markers, placeholders, frontmatter. | ✓ |
| Leave it to Phase 65 | Phase 64 only records what it found; Phase 65 derives allowlist. | |
| You decide | Claude decides based on risk of Phase 65 over-flagging. | |

**User's choice:** Phase 64 maps them

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — confirm presence with grep evidence | Each allowlist pattern verified with a sample hit from scoped dirs. | ✓ |
| No — list candidates without verification | Phase 65 handles verification. | |

**User's choice:** Confirm presence with grep evidence

---

## Scanning Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Inline grep commands in the plan | Exact grep patterns in plan. Simple, auditable. | |
| Small discovery script | scripts/scan-citations.cjs outputs structured findings. More reliable for multi-pattern scans. | ✓ |
| You decide | Claude picks the execution approach. | |

**User's choice:** Small discovery script at scripts/scan-citations.cjs

---

| Option | Description | Selected |
|--------|-------------|----------|
| Structured markdown — write directly to 64-FINDINGS.md | Script writes the findings file in the right format. | |
| JSON to stdout, post-processed to markdown | Script outputs JSON; second step converts to markdown. | ✓ |
| You decide | Claude picks the output format. | |

**User's choice:** JSON to stdout, post-processed to markdown

---

| Option | Description | Selected |
|--------|-------------|----------|
| scripts/scan-citations.cjs | Reusable location alongside other scripts/. Consistent with project's script pattern. | ✓ |
| Throwaway inline script in the plan | Script content embedded in plan step, not committed. | |
| You decide | Claude decides based on project conventions. | |

**User's choice:** scripts/scan-citations.cjs

---

## Claude's Discretion

- Script implementation details (argument parsing, file traversal approach, JSON schema) left to implementer
- If additional citation forms are discovered during scripting that don't match expected categories, add new categories rather than forcing a fit

## Deferred Ideas

None — discussion stayed within phase scope.
