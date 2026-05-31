# Requirements: GSD — Prompt-Engineered Fork

**Defined:** 2026-05-30
**Core Value:** Every agent, command, and workflow file on `main` meets the fork's prompt engineering quality bar before it ships

## v2.1.0-d Requirements

Requirements for whole-integer step numbering enforcement. Each maps to roadmap phases.

### Step Numbering Scanners

- [x] **SCAN-01**: Scanner test (`tests/step-numbering-scan.test.cjs`) detects decimal step labels (e.g. `Step 2.5`, `Step 1.3`, `Step 7.0`) in `agents/`, `commands/gsd/`, and `get-shit-done/workflows/` and fails — confirmed RED against unmodified corpus before any file fixes
- [x] **SCAN-02**: Scanner test detects out-of-order step numbering (e.g., Step 1, Step 3, Step 2) in agents, commands, and workflows and fails

### Cross-File Reference Mapping

- [x] **MAP-01**: Pre-normalization survey produces a cross-file step reference index — enumerates all prose references of the form "filename.md step N" across the corpus, recording source file, source line, target file, and target step number; produced before any step renaming begins

### Normalization

- [x] **NORM-01**: All violating files renumbered to sequential whole integers in original order; same-file inline cross-references and affected test assertions co-updated in the same commit
- [x] **NORM-02**: `scripts/normalize-step-numbers.cjs` is cross-file-aware — uses MAP-01 reference index plus the per-file correlation map (old step → new step) to simultaneously update cross-file references when renaming; `--dry-run` flag; idempotency guarantee (exits 0 on already-clean corpus)

### Cross-File Reference Integrity

- [x] **XREF-01**: Scanner test (`tests/cross-file-step-refs.test.cjs`) detects prose cross-file step references where the referenced step number does not exist as a heading in the target file — written against the clean post-normalization corpus to enforce the invariant for future upstream merges

### Quality Gate

- [x] **GATE-01**: Full `npm test` passes at 0 regressions after all changes; negative-framing scanner remains at 99/99

## Future Requirements

*(None deferred — Pattern C files (`plan-phase.md`, `new-milestone.md`, `new-project.md`) with `## N.N.` section headings that do not use the word "Step" are explicitly out of scope for v2.1.0-d)*

## Out of Scope

| Feature | Reason |
|---------|--------|
| Pattern C files (`plan-phase.md`, `new-milestone.md`, `new-project.md`) | Use `## N.N.` section headings without the word "Step" — different pattern, separate scope decision |
| `get-shit-done/references/` files | Out of fork scan scope per PROJECT.md |
| `get-shit-done/templates/` files | Out of fork scan scope per PROJECT.md |
| `sdk/` and `tests/` files | Out of `SCAN_DIRS` scope |
| Changing GSD core functionality | Fork is prompt content only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCAN-01 | Phase 48 | Complete |
| SCAN-02 | Phase 48 | Complete |
| MAP-01 | Phase 49 | Complete |
| NORM-01 | Phase 49 | Complete |
| NORM-02 | Phase 50 | Complete |
| XREF-01 | Phase 50 | Complete |
| GATE-01 | Phase 51 | Complete |

**Coverage:**

- v2.1.0-d requirements: 7 total
- Mapped to phases: 7
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-30*
*Last updated: 2026-05-30 after roadmap creation (Phases 48–51)*
