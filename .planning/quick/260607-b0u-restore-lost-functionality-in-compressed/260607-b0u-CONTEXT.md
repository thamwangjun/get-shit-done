# Quick Task 260607-b0u: Restore lost functionality in compressed docs-update.md workflow - Context

**Gathered:** 2026-06-07
**Status:** Ready for planning

<domain>
## Task Boundary

A prompt-compression pass was applied to `get-shit-done/workflows/docs-update.md` (uncommitted: 256 insertions, 895 deletions). The step structure (all 18 steps, same order) and most behavior are intact, but three functional regressions were introduced by the compression. This task restores those three behaviors WITHOUT undoing the rest of the compression. Scope is limited to `get-shit-done/workflows/docs-update.md`.

</domain>

<decisions>
## Implementation Decisions

### Regression #1 — `--verify-only` early-exit routing (MUST FIX)
- Original `preservation_check` routed `--verify-only` directly to the `verify_only_report` step, bypassing ALL doc generation (dispatch_wave_1/2, sequential_generation).
- Compressed version only says "Skip if `--verify-only` present" in `preservation_check`, so control falls through to `dispatch_wave_1` and would GENERATE docs under `--verify-only` — incorrect.
- Restore explicit routing: when `--verify-only` is present, jump to `verify_only_report` and do not run any generation step. Re-add the original skip-condition ordering in `preservation_check` (force → regenerate; verify-only → jump to verify_only_report; no hand-written docs → skip).

### Regression #2 — TEXT_MODE definition (MUST FIX)
- Original defined TEXT_MODE detection: set `TEXT_MODE=true` if `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is `true`. When active, replace every `AskUserQuestion` call with a plain-text numbered list asking the user to type a choice number. Required for non-Claude runtimes (OpenAI Codex, Gemini CLI, etc.) where `AskUserQuestion` is unavailable.
- Compressed version dropped the definition, leaving only a vague "or text mode if unavailable" mention.
- Restore the TEXT_MODE definition (concise form is fine) early enough that all subsequent `AskUserQuestion` calls are covered — e.g. in `init_context` or `build_doc_queue`.

### Regression #3 — `--force` = regenerate semantics (FIX, per user)
- Original `preservation_check`: `--force` meant "treat all docs as mode: regenerate" (not merely skipping the preservation prompt).
- Compressed version says "Skip if `--force` present", which leaves hand-written docs at their create/update mode rather than forcing regenerate.
- Restore the `--force` → regenerate-all semantics in `preservation_check`.

### Claude's Discretion
- Exact wording/placement of restored fragments — keep them as concise as the surrounding compressed style allows, while being unambiguous. Do not re-expand the rest of the document.
- Whether dangling references to the never-defined `detect_runtime_capabilities` step are reintroduced: do NOT reintroduce them (they were a latent bug in the original — there is no such step). Route to real steps only.

</decisions>

<specifics>
## Specific Ideas

- File: `get-shit-done/workflows/docs-update.md` (only this file).
- Verify against original via `git show HEAD:get-shit-done/workflows/docs-update.md`.
- `agent-frontmatter.test.cjs` and fork prompt-engineering guides apply; prefer positive/affirmative framing for any restored directives.
- The three regressions were confirmed by diffing the uncommitted change against HEAD; step list is identical between versions, so this is purely about re-adding lost routing/definition prose, not restructuring.

</specifics>

<canonical_refs>
## Canonical References

- Original (pre-compression) content: `git show HEAD:get-shit-done/workflows/docs-update.md` — lines ~100 (TEXT_MODE), ~351-353 + 380 (preservation_check skip conditions / routing).

</canonical_refs>
