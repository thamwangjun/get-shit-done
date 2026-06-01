---
phase: quick-260601-bfj
plan: 01
subsystem: infra
tags: [generators, atomic-write, rename, race-condition, sdk, codegen]

requires:
  - phase: quick-260531-rej
    provides: atomic tmp-file + rename precedent in gen-project-root.mjs
provides:
  - All 8 remaining SDK generators write their *.generated.cjs output atomically (tmp-file + rename)
  - Eliminates the write-truncation race behind the flaky `scaffold > scaffolds context file` failure
affects: [sdk-generators, gen-staleness-check, parallel-test-suite]

tech-stack:
  added: []
  patterns: ["Atomic codegen writes: write to unique sibling tmp path, then rename over output (same-fs atomic swap) so concurrent require() readers never see truncated content"]

key-files:
  created: []
  modified:
    - sdk/scripts/gen-configuration.mjs
    - sdk/scripts/gen-plan-scan.mjs
    - sdk/scripts/gen-secrets.mjs
    - sdk/scripts/gen-schema-detect.mjs
    - sdk/scripts/gen-decisions.mjs
    - sdk/scripts/gen-workstream-inventory-builder.mjs
    - sdk/scripts/gen-workstream-name-policy.mjs
    - sdk/scripts/gen-validate.mjs

key-decisions:
  - "Root-cause fix at the writer only — no changes to core.cjs or any *.generated.cjs runtime file (D-02)"
  - "Output content left byte-identical so committed generated files do not change (D-01)"

patterns-established:
  - "All gen-*.mjs scripts use atomic tmp+rename writes, matching the gen-project-root.mjs precedent (#260531-rej)"

requirements-completed: [QUICK-260601-bfj]

duration: ~6min
completed: 2026-06-01
---

# Phase quick-260601-bfj Plan 01: Atomic Generator Writes Summary

**All 8 remaining SDK generators converted to atomic tmp-file + rename writes, eliminating the write-truncation race that caused the flaky `scaffold > scaffolds context file` failure (CONFIG_DEFAULTS=undefined crash at core.cjs:229).**

## Performance

- **Duration:** ~6 min
- **Completed:** 2026-06-01
- **Tasks:** 2
- **Files modified:** 8 (generator scripts)

## Accomplishments
- 7 async generators (gen-plan-scan, gen-secrets, gen-schema-detect, gen-decisions, gen-workstream-inventory-builder, gen-workstream-name-policy, gen-validate) write via `await writeFile(tmp)` + `await rename(tmp, out)` with best-effort `unlink` cleanup on failure.
- 1 sync generator (gen-configuration) writes via `writeFileSync(tmp)` + `renameSync(tmp, out)` with `unlinkSync` cleanup.
- Verified byte-identical regenerated output (D-01) and root-cause-only scope (D-02).

## Task Commits

1. **Task 1: Convert all non-atomic generators to atomic writes** - `60f12a5a` (fix) — committed prior to this executor session; verified in place.
2. **Task 2: Verify race eliminated, suite green, generated files unchanged** - verification only, no commit.

## Files Created/Modified
- `sdk/scripts/gen-configuration.mjs` - sync atomic write (renameSync/unlinkSync)
- `sdk/scripts/gen-plan-scan.mjs` - async atomic write (rename/unlink)
- `sdk/scripts/gen-secrets.mjs` - async atomic write
- `sdk/scripts/gen-schema-detect.mjs` - async atomic write
- `sdk/scripts/gen-decisions.mjs` - async atomic write
- `sdk/scripts/gen-workstream-inventory-builder.mjs` - async atomic write
- `sdk/scripts/gen-workstream-name-policy.mjs` - async atomic write
- `sdk/scripts/gen-validate.mjs` - async atomic write

## Decisions Made
None beyond the plan — followed it as specified. The 8 generator edits (Task 1) were already committed as `60f12a5a` before this executor session began; this session verified Task 1 was correctly in place and executed Task 2 (verification).

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
- The Bash tool executes `/bin/bash`, not the user's fish shell. The reproduction loop was run with bash `for`/`seq` syntax instead of the fish loop from the plan notes; functionally equivalent (15 iterations of the same two test files).

## Verification Results
- **Task 1 grep gate:** all 8 generators match `rename` (count == 8); `node --check` passes for all 8.
- **D-01 (byte-identical):** regenerated all 8 outputs via `npm run gen:*`; `git status --short` shows zero modified `*.generated.cjs` files.
- **D-02 (root-cause-only):** no changes to core.cjs or any *.generated.cjs; only the 8 generator scripts touched.
- **Reproduction loop:** 15/15 green, zero `model_profile` TypeError, zero `scaffolds context` failures.
- **Full suite:** `npm test` → 8299 pass, 0 fail, 11 skipped (tests 8310).

## Self-Check: PASSED
- Generator files exist and verified (8/8 contain atomic rename).
- Task 1 commit `60f12a5a` confirmed present in git log.

## Next Phase Readiness
- Flaky generator-write race eliminated across all generators. No blockers.

---
*Phase: quick-260601-bfj*
*Completed: 2026-06-01*
