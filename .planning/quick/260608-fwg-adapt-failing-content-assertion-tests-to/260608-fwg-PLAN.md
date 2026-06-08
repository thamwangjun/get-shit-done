---
phase: quick-260608-fwg
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/ask-user-questions-fallback.test.cjs
  - tests/bug-2410-stream-checkpoint-heartbeats.test.cjs
  - tests/bug-2772-gitmodules-path-intersection.test.cjs
  - tests/bug-3212-execute-phase-stall-safe-resume.test.cjs
  - tests/bug-3360-codex-execute-phase-worktrees.test.cjs
  - tests/enh-2433-todo-phase-linking.test.cjs
  - tests/execute-phase-step-7-deviation-doc.test.cjs
  - tests/execute-phase-wave.test.cjs
  - tests/execute-phase-worktree-artifacts.test.cjs
  - tests/parallel-dependent-plans.test.cjs
  - tests/worktree-cleanup.test.cjs
  - tests/worktree.test.cjs
autonomous: true
requirements: [FWG-01]
must_haves:
  truths:
    - "D-01: Strictly tests-only — execute-phase.md and all workflow/source files stay READ-ONLY. If a workflow edit looks like the better fix, flag it for a separate task in the commit message; do not act on it here."
    - "D-02: When a guarded guarantee genuinely no longer exists in the rewritten execute-phase.md, re-point the assertion to the closest surviving wording that preserves the spirit AND flag the reinterpretation loudly in the commit message. Never silently delete or weaken an assertion just to go green."
    - "D-03: tests/null-omit-comment-scan.test.cjs is OUT OF SCOPE — a separate restore task owns it. Do not touch it."
    - "Each of the 12 listed test files passes via `node --test <file>` after its task."
    - "Final gate: `npm test` shows 0 failures except tests/null-omit-comment-scan.test.cjs."
  artifacts:
    - path: tests/ask-user-questions-fallback.test.cjs
      provides: "TEXT_MODE plain-text fallback guard adapted to current workflow set"
    - path: tests/execute-phase-step-7-deviation-doc.test.cjs
      provides: "Step-7 cross-wave cleanup-tail assertions re-pointed to current wording"
  key_links:
    - from: "tests/*.test.cjs assertions"
      to: "get-shit-done/workflows/execute-phase.md current wording"
      via: "string/regex match"
      pattern: "fs.readFileSync.*execute-phase\\.md"
---

<objective>
Adapt 12 failing content-assertion test files to the rewritten
`get-shit-done/workflows/execute-phase.md` (and the related `quick.md`,
`per-plan-worktree-gate.md`, `COMMANDS.md` the same tests touch). For each failing
assertion, locate where the new wording expresses the same guarantee the test
intended and update the expected string / regex / snippet to match — preserving the
behavioral INTENT each test guards.

Purpose: The upstream merge rewrite (eb4f074b + partial restores) kept orchestration
behavior intact but moved/renamed the literal text many tests assert. Project rule
`source-text-is-the-product` makes adapting expected strings the correct fix, not a hack.
Output: A green suite (0 failures except the out-of-scope null-omit scan).

CRITICAL CONSTRAINTS (per D-01 / D-02 / D-03):
- Tests-only. NEVER edit execute-phase.md or any workflow/source file (per D-01).
- For any vanished contract, re-point to the nearest surviving wording AND flag it
  loudly in the commit message (per D-02). Never weaken/delete an assertion to pass.
- EXCLUDE tests/null-omit-comment-scan.test.cjs entirely (per D-03).
- Method per assertion: read current execute-phase.md (already the source of truth),
  find the new expression of the same guarantee, update the expected token.
- Work file-by-file. After each task, `node --test <that file>` MUST be green before
  moving to the next.

KNOWN VANISHED-CONTRACT CASE (flag in commit message): the rewritten execute-phase.md
uses `AskUserQuestion` (regression_gate step) but NO LONGER carries a TEXT_MODE
plain-text fallback instruction. This is a real gap the test correctly catches. Per
D-01/D-02: do NOT add the fallback to execute-phase.md. Re-point the
ask-user-questions-fallback assertion to preserve its intent (see Task 1) AND flag in
the commit message that execute-phase.md is missing the TEXT_MODE fallback and should
get one in a SEPARATE workflow-edit task.
</objective>

<context>
!`cat .planning/quick/260608-fwg-adapt-failing-content-assertion-tests-to/260608-fwg-CONTEXT.md`

@get-shit-done/workflows/execute-phase.md
@get-shit-done/workflows/quick.md
@get-shit-done/workflows/execute-phase/steps/per-plan-worktree-gate.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: ask-user-questions-fallback.test.cjs (VANISHED CONTRACT)</name>
  <read_first>
    - tests/ask-user-questions-fallback.test.cjs
    - get-shit-done/workflows/execute-phase.md (confirm: uses AskUserQuestion in regression_gate, NO text_mode/plain-text fallback)
  </read_first>
  <files>tests/ask-user-questions-fallback.test.cjs</files>
  <action>
    Failing test: "every workflow that uses AskUserQuestion includes a TEXT_MODE
    plain-text fallback" — the only violator is execute-phase.md, which uses
    `AskUserQuestion` (regression_gate step ~line 830) but the rewrite dropped its
    TEXT_MODE fallback instruction. This is a genuine vanished contract (per D-02).

    Per D-01, do NOT edit execute-phase.md to restore the fallback. Adapt the TEST so
    it preserves intent while reflecting reality: add `execute-phase.md` to a documented
    KNOWN_MISSING_FALLBACK allow-list constant at the top of the test, and exclude only
    that one file from the violation set — with an inline comment citing 260608-fwg, the
    vanished-contract decision, and that execute-phase.md needs the TEXT_MODE fallback
    added in a SEPARATE workflow-edit task. Keep the assertion strict for ALL OTHER
    workflows (the guard must still fail if any other workflow loses its fallback).
    Do NOT broaden `hasTextModeFallback` or weaken the global check (that would gut the
    contract — forbidden by D-02).

    Flag this reinterpretation loudly in the commit message: execute-phase.md is now an
    explicit exception and must regain a TEXT_MODE fallback via a separate task.
  </action>
  <verify><automated>node --test tests/ask-user-questions-fallback.test.cjs</automated></verify>
  <done>File passes; execute-phase.md is an explicitly-commented exception, all other workflows still strictly guarded; reinterpretation noted for the commit message.</done>
</task>

<task type="auto">
  <name>Task 2: bug-2410-stream-checkpoint-heartbeats.test.cjs</name>
  <read_first>
    - tests/bug-2410-stream-checkpoint-heartbeats.test.cjs
    - get-shit-done/workflows/execute-phase.md (execute_waves step: heartbeat templates + step numbering)
  </read_first>
  <files>tests/bug-2410-stream-checkpoint-heartbeats.test.cjs</files>
  <action>
    4 failing assertions. Map each to current wording:
    (a) "references the stream idle timeout symptom by name" — current file says
    "Stream-idle-timeout prevention" / "stream idle" (not the exact `Stream idle timeout`
    phrase) and may not cite `#2410`. Re-point the `/Stream idle timeout/` regex and the
    `#2410` check to the closest surviving wording in execute_waves. If `#2410` is genuinely
    absent from execute-phase.md, treat as vanished contract (per D-02): re-point to the
    nearest surviving symptom phrase and flag in the commit message.
    (b) "wave-start heartbeat precedes 'Describe what's being built'" — current step 3 is
    titled "Describe what's being built"; the test slices to
    `4. **Spawn executor agents`. Confirm the step-2/3 slice boundaries and the
    "before any further reasoning or spawning" phrasing still match; update the slice
    anchors/literal to the current numbering (wave-start heartbeat is step 2, describe is
    step 3 in the rewrite).
    (c) "plan-start heartbeat is inside the spawn step" — update spawn/wait anchors
    (`4. **Spawn executor agents`, `5. **Wait for all agents`) to current numbering.
    (d) "plan-complete and wave-complete heartbeats inside wait/report steps" — update
    anchors `5. **Wait for all agents`, `6. **Post-wave hook validation`,
    `11. **Report completion`, `12. **Handle failures` to the current step numbers used in
    execute_waves. The literal heartbeat templates (`wave {N}/{M} starting|complete`,
    `plan {plan_id} starting|complete|failed|checkpoint`, `{P}/{Q} plans done`) all still
    exist verbatim — keep those; only the step-boundary anchors need updating.
    Do not touch the COMMANDS.md sub-suite if it already passes.
  </action>
  <verify><automated>node --test tests/bug-2410-stream-checkpoint-heartbeats.test.cjs</automated></verify>
  <done>File passes; heartbeat-literal assertions preserved, step-boundary anchors updated to current numbering; any vanished `#2410`/symptom-phrase flagged for the commit message.</done>
</task>

<task type="auto">
  <name>Task 3: bug-2772-gitmodules-path-intersection.test.cjs</name>
  <read_first>
    - tests/bug-2772-gitmodules-path-intersection.test.cjs
    - get-shit-done/workflows/execute-phase.md (execute_waves dispatch: Worktree mode / Sequential mode headers; "worktrees disabled" prose)
  </read_first>
  <files>tests/bug-2772-gitmodules-path-intersection.test.cjs</files>
  <action>
    3 failing markdown-wiring assertions (the behavioral bash-gate sub-suite passes — leave it):
    (a) `**Worktree mode** (`USE_WORKTREES_FOR_PLAN`` — current header reads
    `**Worktree mode** (if `USE_WORKTREES_FOR_PLAN` not false)`. Update the regex to match
    the current parenthetical wording while still requiring USE_WORKTREES_FOR_PLAN.
    (b) `**Sequential mode** (`USE_WORKTREES_FOR_PLAN`` — current header reads
    `**Sequential mode** (if `USE_WORKTREES_FOR_PLAN` is false ...)`. Update the regex
    to match.
    (c) "worktrees are disabled for a plan" prose — current sequential block says
    "When plan in wave dropped to sequential" / per-plan wording. Re-point the
    `/worktrees are disabled for a plan/i` regex to the nearest surviving per-plan
    sequential phrasing that still proves the rule is expressed PER-PLAN (not project-level).
    Keep both header regexes anchored on `USE_WORKTREES_FOR_PLAN` so the dead-code guard
    intent survives. The per-plan-worktree-gate.md sub-suite passes — do not edit it.
  </action>
  <verify><automated>node --test tests/bug-2772-gitmodules-path-intersection.test.cjs</automated></verify>
  <done>File passes; both dispatch-gate headers and the per-plan sequential rule re-pointed to current wording, still anchored on USE_WORKTREES_FOR_PLAN.</done>
</task>

<task type="auto">
  <name>Task 4: bug-3212-execute-phase-stall-safe-resume.test.cjs</name>
  <read_first>
    - tests/bug-3212-execute-phase-stall-safe-resume.test.cjs (lines ~60-90)
    - get-shit-done/workflows/execute-phase.md ("Safe resume gate" in initialize step; "Configurable stall surveillance" in execute_waves step 5)
  </read_first>
  <files>tests/bug-3212-execute-phase-stall-safe-resume.test.cjs</files>
  <action>
    2 failing assertions:
    (a) "verifies partial-plan drift before dispatch" — test expects a step literally named
    `safe_resume_gate`. The rewrite expresses this as the "Safe resume gate" block inside the
    initialize step (it computes CURRENT_PLAN_ID/SUMMARY_PATH/PLAN_COMMITS, stops before
    spawning when production commits exist but SUMMARY.md is missing, offers close-out
    manually / re-execute / mark-and-skip). The named `<step name="safe_resume_gate">` is
    gone — vanished contract (per D-02). Re-point the assertion to the surviving "Safe resume
    gate" wording / drift-before-dispatch behavior (e.g. match `Safe resume gate` and the
    "stop before spawning a new executor" guarantee) and flag the step-rename in the commit
    message.
    (b) "configurable executor stall surveillance after dispatch" + "offer kill and retry" —
    re-point to the current "Configurable stall surveillance" block (uses
    EXECUTOR_STALL_INTERVAL_MINUTES / EXECUTOR_STALL_THRESHOLD_MINUTES; offers
    "continue waiting / kill-and-retry / kill-and-inline"). Update the kill/retry literal to
    the current `kill-and-retry` wording.
  </action>
  <verify><automated>node --test tests/bug-3212-execute-phase-stall-safe-resume.test.cjs</automated></verify>
  <done>File passes; drift-before-dispatch and stall-surveillance assertions re-pointed to surviving wording; any step rename flagged for the commit message.</done>
</task>

<task type="auto">
  <name>Task 5: bug-3360-codex-execute-phase-worktrees.test.cjs</name>
  <read_first>
    - tests/bug-3360-codex-execute-phase-worktrees.test.cjs (line ~53)
    - get-shit-done/workflows/execute-phase.md (initialize step: RUNTIME read + Codex worktree FATAL guard)
  </read_first>
  <files>tests/bug-3360-codex-execute-phase-worktrees.test.cjs</files>
  <action>
    1 failing assertion ("reads runtime before worktree dispatch and blocks Codex worktree
    mode"). Current file reads `RUNTIME=$($GSD_SDK query config-get runtime ...)` then
    `if [ "$RUNTIME" = "codex" ] && [ "$USE_WORKTREES" != "false" ]; then echo "FATAL: Codex
    worktree isolation unsupported..."; exit 1; fi` in the initialize step. Update the
    expected strings/ordering checks (runtime-read index < worktree-dispatch index; presence
    of the codex+FATAL fail-closed guard) to match the current literal wording and its
    location relative to the dispatch sites.
  </action>
  <verify><automated>node --test tests/bug-3360-codex-execute-phase-worktrees.test.cjs</automated></verify>
  <done>File passes; Codex fail-closed runtime guard assertion matches current wording and ordering.</done>
</task>

<task type="auto">
  <name>Task 6: enh-2433-todo-phase-linking.test.cjs</name>
  <read_first>
    - tests/enh-2433-todo-phase-linking.test.cjs (line ~73-80)
    - get-shit-done/workflows/execute-phase.md (close_phase_todos step)
  </read_first>
  <files>tests/enh-2433-todo-phase-linking.test.cjs</files>
  <action>
    1 failing assertion ("auto-close never blocks phase completion" / "close_phase_todos should
    be non-blocking"). Current close_phase_todos step uses `... || true` on the commit and
    "Skip silently if no matching todos." Re-point the non-blocking assertion to the surviving
    wording that proves auto-close cannot block completion (e.g. `|| true` on the commit and/or
    the "Skip silently" phrase, and that the step runs after verify/update_roadmap). Preserve
    the intent: todo auto-close is best-effort and never gates phase completion.
  </action>
  <verify><automated>node --test tests/enh-2433-todo-phase-linking.test.cjs</automated></verify>
  <done>File passes; non-blocking auto-close assertion re-pointed to current close_phase_todos wording.</done>
</task>

<task type="auto">
  <name>Task 7: execute-phase-step-7-deviation-doc.test.cjs</name>
  <read_first>
    - tests/execute-phase-step-7-deviation-doc.test.cjs (lines ~61-147)
    - get-shit-done/workflows/execute-phase.md (execute_waves step 8 "Worktree cleanup" + "Cleanup-tail" snippet + "When to skip step 8")
  </read_first>
  <files>tests/execute-phase-step-7-deviation-doc.test.cjs</files>
  <action>
    10 failing assertions. The test calls it "step 7" but the rewrite numbers worktree cleanup
    as step 8 with a "Cleanup-tail (after custom cross-wave merges)" snippet and a "When to skip
    step 8" list. Re-point each:
    (a) "standard wave contract" + "cross-wave dependency deviation as supported mode" — match
    the current step-8 / "When to skip step 8" prose (which names the
    "cross-wave-dependency deviation" and "custom messages" merge path). If the literal "standard
    wave contract" phrase vanished, re-point to nearest surviving wording and flag.
    (b) cleanup-tail snippet contains: `git worktree prune`, `git worktree remove ... --force`,
    `git worktree unlock`, `git branch -D` — ALL FOUR exist verbatim in the current Cleanup-tail
    snippet. Update the slice anchor the test uses to locate the snippet (e.g. anchor on
    `**Cleanup-tail**` / "after custom cross-wave merges") so the four greps run against the
    right region.
    (c) skip conditions: "empty-WAVE_WORKTREE_PLANS" and "custom-merge-deviation" — current
    "When to skip step 8" bullets cover `WAVE_WORKTREE_PLANS is empty` and the custom cross-wave
    merge case pointing to the cleanup-tail. Update the expected tokens to match current bullet
    wording.
    (d) "cleanup-tail uses wave manifest instead of agent namespace discovery" + "does not
    rediscover global agent worktrees" — current cleanup-tail reads
    WAVE_WORKTREE_MANIFEST via the node one-liner and iterates `w.worktree_path`. Re-point to
    the manifest-driven wording; assert absence of any global `git worktree list`-based agent
    rediscovery in that snippet.
    Update the test's notion of "step 7" → the actual step number only as needed for slicing;
    do not assert a step number that no longer exists.
  </action>
  <verify><automated>node --test tests/execute-phase-step-7-deviation-doc.test.cjs</automated></verify>
  <done>File passes; cleanup-tail four-command greps, skip-condition tokens, and manifest-driven assertions all re-pointed to the current Cleanup-tail snippet and step-8 prose; vanished phrases flagged.</done>
</task>

<task type="auto">
  <name>Task 8: execute-phase-wave.test.cjs</name>
  <read_first>
    - tests/execute-phase-wave.test.cjs (lines ~58-82)
    - get-shit-done/workflows/execute-phase.md (parse_args `--wave N` → WAVE_FILTER; discover_and_group_plans "Wave safety"; handle_partial_wave_execution)
  </read_first>
  <files>tests/execute-phase-wave.test.cjs</files>
  <action>
    3 failing assertions:
    (a) "parses WAVE_FILTER from arguments" — current parse_args: ``--wave N` → `WAVE_FILTER``.
    Update the expected `--wave N` literal to match current parse_args wording.
    (b) "enforces lower-wave safety" — current discover_and_group_plans has
    "**Wave safety:** If `WAVE_FILTER` set and incomplete plans exist in earlier waves, STOP."
    Re-point the "wave safety check section" assertion to this wording.
    (c) "partial-wave completion guardrail / skip phase verification" — current
    handle_partial_wave_execution: "If incomplete plans remain, STOP — skip phase verification."
    Update the expected "skip phase verification" literal to match.
  </action>
  <verify><automated>node --test tests/execute-phase-wave.test.cjs</automated></verify>
  <done>File passes; WAVE_FILTER parse, wave-safety, and partial-wave skip-verification assertions re-pointed to current wording.</done>
</task>

<task type="auto">
  <name>Task 9: execute-phase-worktree-artifacts.test.cjs</name>
  <read_first>
    - tests/execute-phase-worktree-artifacts.test.cjs (lines ~29-124)
    - get-shit-done/workflows/execute-phase.md (worktree Agent() success_criteria; sequential-mode block; post-wave roadmap.update-plan-progress)
  </read_first>
  <files>tests/execute-phase-worktree-artifacts.test.cjs</files>
  <action>
    5 failing assertions:
    (a)/(b) worktree executor success_criteria must NOT reference STATE.md / ROADMAP.md —
    current worktree Agent() success_criteria block lists only "All tasks executed / Each task
    committed individually / SUMMARY.md created / No modifications to STATE.md/ROADMAP.md".
    The test slices to a `<success_criteria>` block and asserts STATE.md/ROADMAP.md are absent
    as REQUIRED writes — but the block literally contains "No modifications to
    STATE.md/ROADMAP.md", so a naive substring check trips. Update the test to scope its
    STATE.md/ROADMAP.md absence check to the success-criteria CHECKLIST ITEMS only and treat
    the "No modifications to STATE.md/ROADMAP.md" line as satisfying (not violating) the intent
    — the contract is "executor does not OWN these writes", which the current wording asserts
    more explicitly. Preserve intent; do not weaken.
    (c) "post-wave runs roadmap update-plan-progress for each completed plan" — current
    execute_waves step 10 runs
    `$GSD_SDK query roadmap.update-plan-progress "${PHASE_NUMBER}" "${plan_id}" "complete"` in a
    loop. Update the expected command/phrasing to match the current SDK call.
    (d)/(e) sequential-mode success_criteria still includes STATE.md / ROADMAP.md — current
    sequential block says "Success criteria include STATE.md and ROADMAP.md updates (not
    deferred)." The test slices to a sequential-mode `<success_criteria>` Task block. The
    rewrite expresses sequential mode as a prose `<sequential_execution>` substitution plus the
    "Success criteria include STATE.md and ROADMAP.md updates" line rather than a full second
    Task block. Re-point the slice anchor to the current sequential-mode wording and assert the
    "STATE.md and ROADMAP.md updates (not deferred)" guarantee. If the literal
    `<success_criteria>` Task block for sequential mode vanished, re-point to the surviving
    "Success criteria include STATE.md and ROADMAP.md updates" sentence and flag the structural
    change in the commit message.
  </action>
  <verify><automated>node --test tests/execute-phase-worktree-artifacts.test.cjs</automated></verify>
  <done>File passes; worktree-vs-sequential STATE/ROADMAP ownership and post-wave roadmap.update-plan-progress assertions re-pointed to current wording; structural changes flagged.</done>
</task>

<task type="auto">
  <name>Task 10: parallel-dependent-plans.test.cjs</name>
  <read_first>
    - tests/parallel-dependent-plans.test.cjs (line ~123-130)
    - get-shit-done/workflows/execute-phase.md (execute_waves step 1 "Intra-wave overlap check (BEFORE spawning)")
  </read_first>
  <files>tests/parallel-dependent-plans.test.cjs</files>
  <action>
    1 failing assertion ("overlap detection is placed before agent spawning" / "overlap check
    text should exist"). Current execute_waves step 1:
    "**Intra-wave overlap check (BEFORE spawning):** If two plans share files in
    `files_modified`, flag overlap and force sequential...". Re-point the overlap-check literal
    and the ordering check (overlap index < spawn index) to this current wording and its
    position relative to "Spawn executor agents".
  </action>
  <verify><automated>node --test tests/parallel-dependent-plans.test.cjs</automated></verify>
  <done>File passes; intra-wave overlap-before-spawn assertion re-pointed to current step-1 wording.</done>
</task>

<task type="auto">
  <name>Task 11: worktree-cleanup.test.cjs</name>
  <read_first>
    - tests/worktree-cleanup.test.cjs (lines ~480-703)
    - get-shit-done/workflows/execute-phase.md (execute_waves step 8 cleanup + Cleanup-tail snippet: PRIMARY_WT pin, manifest, branch checks)
  </read_first>
  <files>tests/worktree-cleanup.test.cjs</files>
  <action>
    5 failing assertions:
    (a) "handles merge conflicts gracefully" (line ~480) — re-point to the current
    cleanup/merge-conflict handling wording in step 8 / post-merge gate. If the exact phrase
    vanished, re-point to nearest surviving merge-failure handling and flag.
    (b) "cleanup-tail snippet still backs up STATE.md for custom deviations" (line ~543) — the
    rewrite's cleanup-tail no longer shows an explicit STATE.md backup; the post-wave hook-stash
    logic (`git stash push -u -m "gsd-post-wave-hook-$$"`) is the surviving protection. Vanished
    contract (per D-02): re-point to the nearest surviving artifact-protection wording (the
    named-stash backup / orchestrator-owned STATE.md write) and flag that the explicit STATE.md
    backup in cleanup-tail is gone and may warrant a separate workflow-edit task.
    (c) "requires a cleanup manifest instead of global worktree discovery" (line ~661) — current
    cleanup pins on WAVE_WORKTREE_MANIFEST and the
    `atomically append {agent_id, worktree_path, branch, expected_base}` text. The test's
    `/atomically append .../` regex fails because that exact phrasing changed: current wording is
    "Append `{agent_id, worktree_path, branch, expected_base}` to `WAVE_WORKTREE_MANIFEST`".
    Re-point the regex to the current "Append ... to WAVE_WORKTREE_MANIFEST" wording.
    (d) "#3425 helper cleanup pins CWD to primary worktree + checks EXPECTED_BRANCH" (line ~691)
    — current step-8 has `PRIMARY_WT=$(git worktree list --porcelain | awk ...)`,
    `{ echo "FATAL: no primary worktree" >&2; exit 1; }`, and the EXPECTED_BRANCH drift check
    `[ "$ORCH_BRANCH" = "$EXPECTED_BRANCH" ] || { echo "FATAL: branch drift before cleanup"...`.
    The test's regex expects the older literal `FATAL: could not resolve primary worktree before
    cleanup` and a `#3174` comment. Re-point both regexes to the current FATAL strings and
    branch-drift check; if `#3174`/`#3425` comment markers vanished, re-point to nearest
    surviving wording and flag.
    (e) "cleanup-tail carries the same primary-worktree pin before removal" (line ~703) — current
    Cleanup-tail snippet opens with `PRIMARY_WT=$(git worktree list --porcelain | awk ...)` +
    cd-to-primary `{ echo "FATAL: cannot cd to primary" >&2; exit 1; }`. Re-point the
    `/Cleanup-tail: pin orchestrator CWD .../` regex to the current pin wording.
    Preserve every intent (CWD pin, branch check, manifest-driven cleanup); only update literals.
  </action>
  <verify><automated>node --test tests/worktree-cleanup.test.cjs</automated></verify>
  <done>File passes; manifest-append, primary-worktree pin, EXPECTED_BRANCH check, merge-conflict handling, and cleanup-tail pin assertions re-pointed to current wording; vanished STATE.md-backup and issue-number markers flagged for the commit message.</done>
</task>

<task type="auto">
  <name>Task 12: worktree.test.cjs</name>
  <read_first>
    - tests/worktree.test.cjs (lines ~436-476)
    - get-shit-done/workflows/execute-phase.md (Cleanup-tail: git worktree unlock + manual-cleanup warning) and step 8 cleanup
  </read_first>
  <files>tests/worktree.test.cjs</files>
  <action>
    2 failing assertions:
    (a) "has lock-aware detection block" (line ~436) — current cleanup-tail iterates worktrees
    and runs `git worktree unlock "$WT" 2>/dev/null || true` before
    `git worktree remove "$WT" --force`; step 8 runs `$GSD_SDK query worktree.cleanup-wave`.
    Re-point the lock-aware-detection assertion to the surviving `git worktree unlock` /
    lock-handling wording. If the older "lock-aware detection block" literal vanished, re-point to
    nearest surviving unlock/lock handling and flag.
    (b) "user-visible warning when worktree removal fails" (line ~474) — current cleanup-tail
    emits `⚠ Manual cleanup: git worktree unlock ... && git worktree remove ... --force &&
    git branch -D ...` on remove failure. Re-point the user-visible-warning assertion to this
    `⚠ Manual cleanup` wording.
  </action>
  <verify><automated>node --test tests/worktree.test.cjs</automated></verify>
  <done>File passes; lock-aware unlock and ⚠-manual-cleanup warning assertions re-pointed to current cleanup-tail wording; any vanished literal flagged.</done>
</task>

</tasks>

<verification>
After all 12 tasks, run the full suite and confirm the only remaining failure is the
out-of-scope null-omit scan:

```bash
npm test 2>&1 | tee /tmp/gsd-test-output.txt
```

Confirm: 0 failures except tests/null-omit-comment-scan.test.cjs (owned by a separate
restore task — per D-03). No workflow/source file was modified (per D-01):

```bash
git status --porcelain | command grep -vE '^\s*M tests/' || echo "tests-only changes confirmed"
git diff --name-only | command grep -vqE '^tests/' && echo "VIOLATION: non-test file changed" || echo "OK: tests-only"
```
</verification>

<success_criteria>
- All 12 listed test files pass via `node --test <file>`.
- `npm test` shows 0 failures except tests/null-omit-comment-scan.test.cjs.
- Only files under `tests/` were modified; execute-phase.md and all workflow/source files unchanged (per D-01).
- tests/null-omit-comment-scan.test.cjs untouched (per D-03).
- Every vanished/reinterpreted contract (AskUserQuestion TEXT_MODE fallback exception, safe_resume_gate rename, #2410/#3174/#3425 markers, cleanup-tail STATE.md backup, sequential-mode success_criteria structure) is flagged loudly in the commit message (per D-02), with a note that execute-phase.md's missing TEXT_MODE fallback warrants a SEPARATE workflow-edit task.
</success_criteria>

<output>
Update test files under tests/ only. No SUMMARY.md required for quick task (handled by quick.md orchestrator).
</output>
