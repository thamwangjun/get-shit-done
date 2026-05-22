# CATALOGUE.json Audit

**Audited:** 2026-04-15
**Trigger:** Post-upstream-merge check (v1.36.0)

## Summary

CATALOGUE.json is **out of sync**. The catalogue claims 227 total entries across 5 categories, but 23 files exist on disk that are not listed. There are no stale entries (every file the catalogue lists does exist on disk).

| Category | On Disk | In Catalogue | Missing | Stale |
|----------|---------|--------------|---------|-------|
| commands | 73 | 68 | 5 | 0 |
| workflows | 75 | 72 | 3 | 0 |
| agents | 31 | 24 | 7 | 0 |
| references | 40 | 33 | 7 | 0 |
| templates | 31 | 30 | 1 | 0 |
| **TOTAL** | **250** | **227** | **23** | **0** |

---

## Missing Entries (files on disk, not in catalogue)

### commands (5 missing)

| File | Notes |
|------|-------|
| `commands/gsd/ai-integration-phase.md` | AI integration phase command |
| `commands/gsd/eval-review.md` | Eval review command |
| `commands/gsd/extract_learnings.md` | Extract learnings command (underscore in filename) |
| `commands/gsd/from-gsd2.md` | Migration command from GSD v2 |
| `commands/gsd/graphify.md` | Graphify command |

### workflows (3 missing)

| File | Notes |
|------|-------|
| `get-shit-done/workflows/ai-integration-phase.md` | AI integration phase workflow |
| `get-shit-done/workflows/eval-review.md` | Eval review workflow |
| `get-shit-done/workflows/extract_learnings.md` | Extract learnings workflow (underscore in filename) |

### agents (7 missing)

| File | Notes |
|------|-------|
| `agents/gsd-ai-researcher.md` | AI research agent |
| `agents/gsd-debug-session-manager.md` | Debug session manager agent |
| `agents/gsd-domain-researcher.md` | Domain researcher agent |
| `agents/gsd-eval-auditor.md` | Eval auditor agent |
| `agents/gsd-eval-planner.md` | Eval planner agent |
| `agents/gsd-framework-selector.md` | Framework selector agent |
| `agents/gsd-pattern-mapper.md` | Pattern mapper agent |

### references (7 missing)

| File | Notes |
|------|-------|
| `get-shit-done/references/ai-evals.md` | AI evaluation reference |
| `get-shit-done/references/ai-frameworks.md` | AI frameworks reference |
| `get-shit-done/references/executor-examples.md` | Executor examples reference |
| `get-shit-done/references/gates.md` | Gates reference |
| `get-shit-done/references/ios-scaffold.md` | iOS scaffold reference |
| `get-shit-done/references/planner-antipatterns.md` | Planner antipatterns reference |
| `get-shit-done/references/planner-source-audit.md` | Planner source audit reference |

### templates (1 missing)

| File | Notes |
|------|-------|
| `get-shit-done/templates/AI-SPEC.md` | AI specification template |

---

## Stale Entries (in catalogue but not on disk)

None. All 227 catalogue entries have corresponding files on disk.

---

## Action Required

CATALOGUE.json needs 23 new entries added and the counts/total updated:

- `counts.commands`: 68 → 73
- `counts.workflows`: 72 → 75
- `counts.agents`: 24 → 31
- `counts.references`: 33 → 40
- `counts.templates`: 30 → 31
- `total`: 227 → 250
