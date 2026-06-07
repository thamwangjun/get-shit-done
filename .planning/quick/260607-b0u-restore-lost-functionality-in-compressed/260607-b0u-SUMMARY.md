---
status: complete
---

# Quick Task 260607-b0u: Restore lost functionality in compressed docs-update.md

**Completed:** 2026-06-07
**Commit:** 5c56b40a

## What was done

Reviewed the uncommitted prompt-compression of `get-shit-done/workflows/docs-update.md`
(256 insertions / 895 deletions). All 18 steps and their order were preserved; most of the
compression was safe prose reduction. Three functional regressions were found and restored:

1. **`--verify-only` early-exit routing** — original `preservation_check` jumped `--verify-only`
   straight to `verify_only_report`, bypassing all generation. Compressed version only said
   "skip if `--verify-only`", letting control fall through to `dispatch_wave_1` (would generate
   docs under `--verify-only`). Restored explicit routing to `verify_only_report`.
2. **TEXT_MODE definition** — original defined `TEXT_MODE` detection (`--text` flag or
   `text_mode` init JSON) and the AskUserQuestion→numbered-text substitution for non-Claude
   runtimes. Dropped by compression; restored in `build_doc_queue`.
3. **`--force` = regenerate-all** — original treated `--force` as "regenerate all docs";
   compressed only "skipped preservation". Restored regenerate semantics in `preservation_check`.

Post-check flow routes to the real `dispatch_wave_1` step. The original's references to a
never-defined `detect_runtime_capabilities` step were intentionally NOT reintroduced (latent
bug in the original). Verified absent.

## Notable execution issue

The worktree-isolated executor was based on committed content, where `docs-update.md` is the
*original* (uncompressed) file — the compression lives only as uncommitted working-tree changes,
which worktrees cannot see. The executor therefore edited the wrong content. Its worktree branch
was discarded **without merging** (merging would have destroyed the compression), and the three
fixes were applied directly to the compressed working-tree file instead.

## Verification

- `detect_runtime_capabilities` references: none (confirmed).
- All three restorations present (TEXT_MODE line 60, routing lines 167-168, verify_only_report route).
- `npm test`: pre-existing unrelated failures only (ingest-docs.md, parse-model-effort, Codex TOML,
  gsd-planner golden). No failing test references docs-update.md; this prose edit is test-neutral.
