# Requirements: GSD — Prompt-Engineered Fork

**Defined:** 2026-06-09
**Milestone:** v2.1.0-g Citation Cleanup
**Core Value:** Every agent, command, and workflow file on `main` meets the fork's prompt engineering quality bar before it ships

## v2.1.0-g Requirements

Requirements for this milestone. Each maps to a roadmap phase.

### Exploration

- [x] **CITE-01**: Codebase scan identifies all citation formats present in the 5 scoped prompt-content dirs beyond the known `#NNN` pattern (word-form "issue 3668", hyphen-form "feat-3347", code-fence-embedded, etc.)
- [x] **CITE-02**: Exploration findings are documented (file:line, pattern, count) so the guard test detector is scoped correctly

### Guard Test

- [x] **CITE-03**: A new permanent test `tests/no-issue-citations.test.cjs` exists, runs under `npm test`, and covers all citation patterns found in CITE-01
- [x] **CITE-04**: Guard test fails RED before cleanup, enumerating each offending file:line and matched text
- [x] **CITE-05**: Guard test allowlist correctly exempts hex color codes (incl. frontmatter `color:` fields), illustrative placeholders (`#123`, `#45`), and markdown heading markers

### Cleanup

- [x] **CITE-06**: All `#NNN`-form citations removed from `commands/`, `get-shit-done/workflows/`, `agents/`, `get-shit-done/references/`, `get-shit-done/templates/`
- [x] **CITE-07**: All additional citation forms found by CITE-01 (if any) removed from the same scoped dirs
- [x] **CITE-08**: Cleaned sentences read naturally — no double spaces, space-before-punctuation, empty `()`, or dangling connectors (`—`, `,`, `see`, `by`, `in`, `from`)
- [x] **CITE-09**: Agent frontmatter (`name`, `description`, `tools`, `color`, `hooks`) is preserved exactly — no changes to YAML frontmatter blocks

### Verification

- [ ] **CITE-10**: Guard test passes GREEN after cleanup
- [ ] **CITE-11**: `grep -rEn '#[0-9]+' <scoped dirs>` returns only allowlisted hits (hex colors, placeholders, heading markers)
- [ ] **CITE-12**: `npm test` passes with zero failures — agent-frontmatter, negative-framing-scan, and all other content tests unaffected

## Future Requirements

None identified — this is a contained mechanical cleanup milestone.

## Out of Scope

| Feature | Reason |
|---------|--------|
| `docs/`, `CONTEXT.md`, `logs/`, `README.md` | Not prompt content files; citations there are often intentional cross-references |
| `*.cjs`, `*.js`, `*.ts` source code | Existing tests and CLI tools are out of scope as cleanup targets |
| `.planning/` artifacts | Internal planning files; citations there are part of project history |
| Renaming test files with issue numbers in their name (e.g. `bug-3668-*.test.cjs`) | Filenames are not prompt content; renaming would break test infrastructure |
| Weakening or removing existing tests | Fix-forward only: if a removed citation breaks a test assertion, re-point the assertion minimally |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CITE-01 | Phase 64 | Complete |
| CITE-02 | Phase 64 | Complete |
| CITE-03 | Phase 65 | Complete |
| CITE-04 | Phase 65 | Complete |
| CITE-05 | Phase 65 | Complete |
| CITE-06 | Phase 66 | Complete |
| CITE-07 | Phase 66 | Complete |
| CITE-08 | Phase 66 | Complete |
| CITE-09 | Phase 66 | Complete |
| CITE-10 | Phase 67 | Pending |
| CITE-11 | Phase 67 | Pending |
| CITE-12 | Phase 67 | Pending |

**Coverage:**

- v2.1.0-g requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-09*
*Last updated: 2026-06-09 after initial definition*
