---
phase: quick-260601-bfj
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - sdk/scripts/gen-configuration.mjs
  - sdk/scripts/gen-plan-scan.mjs
  - sdk/scripts/gen-secrets.mjs
  - sdk/scripts/gen-schema-detect.mjs
  - sdk/scripts/gen-decisions.mjs
  - sdk/scripts/gen-workstream-inventory-builder.mjs
  - sdk/scripts/gen-workstream-name-policy.mjs
  - sdk/scripts/gen-validate.mjs
autonomous: true
requirements: [QUICK-260601-bfj]

must_haves:
  truths:
    - "A concurrent reader of any *.generated.cjs file never observes truncated/partial content during a generator write"
    - "Reproduction loop runs 15/15 green (no model_profile TypeError)"
    - "Full npm test suite passes"
    - "D-01: After edits each *.generated.cjs file byte-matches its committed output — git status shows no modified .generated.cjs files"
    - "D-02: No changes to core.cjs or any *.generated.cjs runtime file (root-cause at the writer only)"
  artifacts:
    - path: "sdk/scripts/gen-configuration.mjs"
      provides: "Atomic sync write (writeFileSync to tmp + renameSync) for configuration.generated.cjs"
      contains: "renameSync"
    - path: "sdk/scripts/gen-validate.mjs"
      provides: "Atomic async write (writeFile tmp + rename) for the validate generated output"
      contains: "rename"
  key_links:
    - from: "sdk/scripts/gen-*.mjs"
      to: "get-shit-done/bin/lib/*.generated.cjs"
      via: "atomic tmp-file + rename write"
      pattern: "rename"
---

<objective>
Eliminate the flaky `scaffold command > scaffolds context file` test failure by making all generator writes atomic.

Purpose: The crash is a write-truncation race: `gen-staleness-check.test.cjs` Subtest C runs generators against the real repo, and their non-atomic `writeFile`/`writeFileSync` truncates a committed `*.generated.cjs` mid-write. A concurrent `gsd-tools.cjs` subprocess `require()`s the half-written `configuration.generated.cjs`, gets `CONFIG_DEFAULTS=undefined`, and crashes at `core.cjs:229`. An atomic tmp-file + rename guarantees readers see either the complete old file or the complete new file — never a truncated one.

Output: 8 generator scripts converted to atomic writes, matching the existing `gen-project-root.mjs` precedent (which already fixed this bug class under #260531-rej). No runtime files touched.
</objective>

<context>
@sdk/scripts/gen-project-root.mjs
@sdk/scripts/gen-configuration.mjs
@.planning/quick/260601-bfj-root-cause-and-fix-the-flaky-scaffolds-c/260601-bfj-RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Convert all non-atomic generators to atomic tmp-file + rename writes</name>
  <files>sdk/scripts/gen-configuration.mjs, sdk/scripts/gen-plan-scan.mjs, sdk/scripts/gen-secrets.mjs, sdk/scripts/gen-schema-detect.mjs, sdk/scripts/gen-decisions.mjs, sdk/scripts/gen-workstream-inventory-builder.mjs, sdk/scripts/gen-workstream-name-policy.mjs, sdk/scripts/gen-validate.mjs</files>
  <read_first>sdk/scripts/gen-project-root.mjs (lines 81-100 — the reference atomic-write block to copy exactly)</read_first>
  <action>
  Convert each listed generator's output write from a direct (truncating) write to an atomic tmp-file + rename, copying the `gen-project-root.mjs` precedent (per D-01 — output content must remain byte-identical, so do NOT alter `content`/`cjsOut` or `outPath`). Per D-02, touch ONLY these 8 generator scripts — leave `core.cjs`, every `*.generated.cjs`, and the already-atomic `gen-project-root.mjs` unmodified.

  For the 7 ASYNC generators (gen-plan-scan, gen-secrets, gen-schema-detect, gen-decisions, gen-workstream-inventory-builder, gen-workstream-name-policy, gen-validate), each imports `writeFile` from `node:fs/promises` and writes via `await writeFile(outPath, content, 'utf-8')`:
  - Extend the `node:fs/promises` import to also bring in `rename` and `unlink` (mirror gen-project-root.mjs line 13: `import { writeFile, rename, unlink } from 'node:fs/promises';`).
  - Replace the single `await writeFile(outPath, content, 'utf-8');` line with the atomic block: compute `const tmpPath = \`${outPath}.tmp-${process.pid}-${Date.now()}\`;`, then in a try block `await writeFile(tmpPath, content, 'utf-8'); await rename(tmpPath, outPath);`, and in a catch block `await unlink(tmpPath).catch(() => {}); throw err;`. Keep the existing `console.log(\`Written: ${outPath}\`)` after the block. Preserve each generator's own variable name for the content payload (some use `content`).
  - Add the same explanatory comment as gen-project-root.mjs lines 86-89 citing #260531-rej so future readers know why the indirection exists.

  For the 1 SYNC generator (gen-configuration.mjs), it imports `{ existsSync, readFileSync, writeFileSync }` from `node:fs` and writes via `writeFileSync(outPath, cjsOut, 'utf-8')` inside the `if (process.argv[1] === _thisFile)` guard:
  - Extend the `node:fs` import to also bring in `renameSync` and `unlinkSync`.
  - Replace `writeFileSync(outPath, cjsOut, 'utf-8');` with the SYNC atomic equivalent: `const tmpPath = \`${outPath}.tmp-${process.pid}-${Date.now()}\`;` then `try { writeFileSync(tmpPath, cjsOut, 'utf-8'); renameSync(tmpPath, outPath); } catch (err) { try { unlinkSync(tmpPath); } catch {} throw err; }`. Keep the existing `console.log(\`Generated: ${outPath}\`)`. Add the same #260531-rej explanatory comment.

  Note: the rationale uses positive framing per CLAUDE.md house style — the comment states what the atomic rename guarantees (readers observe a complete file), not a prohibition.
  </action>
  <verify>
    <automated>cd /home/thamw/development/remote-dev/get-shit-done && command grep -lE "rename" sdk/scripts/gen-configuration.mjs sdk/scripts/gen-plan-scan.mjs sdk/scripts/gen-secrets.mjs sdk/scripts/gen-schema-detect.mjs sdk/scripts/gen-decisions.mjs sdk/scripts/gen-workstream-inventory-builder.mjs sdk/scripts/gen-workstream-name-policy.mjs sdk/scripts/gen-validate.mjs | wc -l | command grep -qx 8 && node --check sdk/scripts/gen-configuration.mjs</automated>
  </verify>
  <done>All 8 generators write via tmp-file + rename (7 async use `rename`/`unlink`, gen-configuration uses `renameSync`/`unlinkSync`). Each file passes `node --check`. No runtime file (core.cjs, *.generated.cjs) modified. Output payload variables and outPath unchanged.</done>
</task>

<task type="auto">
  <name>Task 2: Verify race is eliminated, suite is green, and generated files are unchanged</name>
  <files>(verification only — no edits)</files>
  <action>
  Prove the fix with three checks (per D-01 the generated files must remain byte-identical to their committed versions).

  1. Regenerate to confirm byte-identical output: run the SDK regen scripts for the touched generators (e.g. `cd sdk && npm run gen:configuration && npm run gen:plan-scan && npm run gen:secrets && npm run gen:schema-detect && npm run gen:decisions && npm run gen:workstream-inventory-builder && npm run gen:workstream-name-policy && npm run gen:validate`), then from repo root run `git status --short` and confirm NO `*.generated.cjs` file appears as modified. If any generated file changed, the write logic altered content — fix Task 1.

  2. Reproduction loop (fish): `for i in (seq 1 15); node --test tests/gen-staleness-check.test.cjs tests/commands.test.cjs; end` — must be 15/15 green with no `model_profile` TypeError and no `scaffold context` failure.

  3. Full suite: `npm test` must pass.

  If any check fails, report the exact failing run/test name and escalate rather than masking.
  </action>
  <verify>
    <automated>cd /home/thamw/development/remote-dev/get-shit-done && git status --short | command grep -E '\.generated\.cjs' ; test $status -ne 0 && npm test 2>&1 | tail -5</automated>
  </verify>
  <done>git status shows zero modified `*.generated.cjs` files; the 15-iteration reproduction loop is 15/15 green (no model_profile TypeError); `npm test` passes.</done>
</task>

</tasks>

<verification>
- All 8 generators use atomic tmp+rename writes (`command grep -lE rename ... | wc -l` == 8).
- `node --check` passes for every edited generator.
- `git status --short` shows no modified `*.generated.cjs` files after regen.
- 15/15 green reproduction loop.
- Full `npm test` passes.
</verification>

<success_criteria>
- Flaky `scaffold command > scaffolds context file` failure eliminated at the writer (atomic generator writes).
- No runtime files (core.cjs, *.generated.cjs) modified — root-cause-only fix per D-02.
- Committed generated output byte-unchanged per D-01.
</success_criteria>

<output>
Create `.planning/quick/260601-bfj-root-cause-and-fix-the-flaky-scaffolds-c/260601-bfj-SUMMARY.md` when done.
</output>
