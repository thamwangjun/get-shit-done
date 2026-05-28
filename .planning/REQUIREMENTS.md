# Requirements: GSD — Prompt-Engineered Fork

**Defined:** 2026-05-28
**Core Value:** Every agent, command, and workflow file on `main` meets the fork's prompt engineering quality bar before it ships — upstream content additions are modified, not accepted verbatim.

## v2.1.0-c Requirements

Requirements for the Install-Time Content Materialization milestone. Each maps to roadmap phases.

### Resolver

- [x] **RESV-01**: `resolveIncludes(content, sourceRoot, seen)` function exists in `bin/install.js` and inlines `@~/.claude/` bare-line references by reading and substituting the referenced file content at source repo paths
- [x] **RESV-02**: `resolveIncludes` also inlines `` !`cat $HOME/.claude/...` `` and `` !`cat ~/.claude/...` `` bare-line references (the full backtick-wrapped shell injection form)
- [x] **RESV-03**: Resolver detects and preserves the conditional `@~` expression in `execute-phase.md:619` (`` ${...? '' : '@~/.claude/...'} ``) — only bare-line `@~` references on their own line are expanded
- [x] **RESV-04**: Resolver skips `@~` and `` !`...` `` patterns inside fenced code blocks and `${...}` template expressions
- [x] **RESV-05**: Resolver detects circular include chains via a `seen` Set and aborts with a clear error naming the full include chain rather than recursing infinitely
- [x] **RESV-06**: Resolver aborts with a clear error naming the source file and unresolvable path when a referenced file does not exist
- [x] **RESV-07**: Resolver supports nested includes up to depth 3 (handles the confirmed two-hop chain `model-profile-resolution.md` → `model-profiles.md`); aborts with a descriptive error at depth 4+

### Integration

- [ ] **INTG-01**: Quick task 260525-o1n is reverted — all 117 `` !`cat` `` references introduced in `commands/gsd/` (55 files) are removed and restored to `@~` form
- [ ] **INTG-02**: Three mixed-notation command files (`extract-learnings.md`, `mvp-phase.md`, `ship.md`) are cleaned — duplicate `@` + `` !`cat` `` references for the same target are reduced to a single `@~` reference
- [ ] **INTG-03**: `resolveIncludes()` is wired into `copyWithPathReplacement()` (~line 6432 in `bin/install.js`) as the first transform step — before path substitution and all runtime converters
- [ ] **INTG-04**: `resolveIncludes()` is wired into the agent install loop (~line 8646 in `bin/install.js`) as the first transform step
- [ ] **INTG-05**: Dynamic `.planning/` runtime references in `add-tests.md` (STATE.md, ROADMAP.md) are excluded from resolution
- [ ] **INTG-06**: The `applyRuntimeContentRewritesInPlace` skills path is audited — if skills are staged after command resolution, they inherit inlined content automatically; if staged before, a third resolver call is added

### Tests

- [ ] **TEST-01**: Test verifies that installed output files contain no unresolved `@~/.claude/` references (post-install grep returns zero results)
- [ ] **TEST-02**: Test verifies the conditional `@~` expression in `execute-phase.md` is preserved verbatim in installed output
- [ ] **TEST-03**: Test verifies tool-name transformation applies correctly inside inlined reference content for non-Claude runtimes (e.g. `Read`→`read`, `Bash`→`execute` for Copilot)
- [ ] **TEST-04**: Test verifies circular include detection — a file that includes itself causes a thrown error, not infinite recursion
- [ ] **TEST-05**: Test verifies missing-file handling — an unresolvable reference causes a thrown error with a message naming the source file and missing path
- [ ] **TEST-06**: Installed agent file line counts are verified against the `agent-size-budget.test.cjs` thresholds — test runs against installed output, not source files

### Quality Gate

- [ ] **GATE-01**: Full `npm test` passes after all changes with 0 regressions beyond pre-existing failures
- [ ] **GATE-02**: Negative-framing scanner passes at 99/99 after all file edits
- [ ] **GATE-03**: `grep -r '@~/.claude/' <install-dir>` on a fresh install across all supported runtimes returns 0 results — all references materialized

## Future Requirements

*(None defined — next milestone to be planned)*

## Out of Scope

| Feature | Reason |
|---------|--------|
| Variable substitution (`{{ var }}`) or conditional blocks in source files | Not needed for current scope — only file includes are being replaced |
| External template engine (Nunjucks, LiquidJS, Eta) | Custom `resolveIncludes()` function covers the bounded use case; Eta noted as future option if variable/conditional needs arise |
| Inlining dynamic `.planning/` runtime references | These are project-specific files that vary per session — must stay as runtime references |
| Auditing 8 unreferenced files in `references/` | Determine orphaned vs prose-loaded after main inlining ships |
| Applying changes to `get-shit-done/templates/` | Out of scan scope per established fork policy |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RESV-01 | Phase 44 | Complete |
| RESV-02 | Phase 44 | Complete |
| RESV-03 | Phase 44 | Complete |
| RESV-04 | Phase 44 | Complete |
| RESV-05 | Phase 44 | Complete |
| RESV-06 | Phase 44 | Complete |
| RESV-07 | Phase 44 | Complete |
| INTG-01 | Phase 45 | Pending |
| INTG-02 | Phase 45 | Pending |
| INTG-03 | Phase 45 | Pending |
| INTG-04 | Phase 45 | Pending |
| INTG-05 | Phase 45 | Pending |
| INTG-06 | Phase 45 | Pending |
| TEST-01 | Phase 46 | Pending |
| TEST-02 | Phase 46 | Pending |
| TEST-03 | Phase 46 | Pending |
| TEST-04 | Phase 46 | Pending |
| TEST-05 | Phase 46 | Pending |
| TEST-06 | Phase 46 | Pending |
| GATE-01 | Phase 47 | Pending |
| GATE-02 | Phase 47 | Pending |
| GATE-03 | Phase 47 | Pending |

**Coverage:**

- v2.1.0-c requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-28*
*Last updated: 2026-05-28 after initial definition*
