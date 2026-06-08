---
phase: quick
plan: 260608-msc
type: execute
wave: 1
depends_on: []
files_modified:
  - get-shit-done/workflows/execute-phase.md
autonomous: true
requirements: []

must_haves:
  truths:
    - All 17 fidelity losses documented in CONTEXT.md are restored in execute-phase.md
    - Restored prose uses compressed style matching the post-compression file's register
    - No verbatim walls of text copied from the original; semantics preserved, wordcount minimized
    - File applies cleanly with no merge conflicts or broken XML structure
  artifacts:
    - path: get-shit-done/workflows/execute-phase.md
      provides: Restored execute-phase.md with all 17 losses reintegrated
  key_links:
    - from: CONTEXT.md loss list (17 items)
      to: execute-phase.md sections
      via: document-order edits applied task by task
      pattern: Every loss ID has a corresponding restored prose block
---

<objective>
Restore 17 semantic/operational losses from the a619eef4 compression of
`get-shit-done/workflows/execute-phase.md`. The losses are fully documented in
CONTEXT.md with exact semantics to recover. Restore using compressed prose that
matches the post-compression file's register — preserve correctness, not wordcount.

Purpose: The compression removed operationally significant instructions. Executors
following the compressed file miss critical routing logic (response_language propagation,
per-plan worktree gating, truncation order constraints, quota-exceeded routing specifics,
HUMAN-UAT structure, offer_next recommended markers, etc.).

Output: A single updated `get-shit-done/workflows/execute-phase.md` with all 17 losses
restored, committed atomically.
</objective>

<context>
!`cat .planning/quick/260608-msc-review-commit-a619eef4-prompt-compressio/260608-msc-CONTEXT.md`

Pre-compression reference (read on demand during editing):
  git show a619eef4^:get-shit-done/workflows/execute-phase.md

Current file to edit:
  get-shit-done/workflows/execute-phase.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Restore losses in initialize and execute_waves early sections (Losses 1, 2, 3, 4, 6)</name>
  <files>get-shit-done/workflows/execute-phase.md</files>
  <action>
Read the full current file at `get-shit-done/workflows/execute-phase.md` before editing.

Apply the following five restorations in document order. Each edit is an isolated,
targeted addition — do not disturb surrounding text.

**Loss 1 — `response_language` injection (initialize step, ~line 66-67)**

After the line:
```
Parse JSON for: `executor_model`, `executor_effort`, ... `state_exists`.
```

The compressed version already parses `response_language` in the JSON field list — verify
it is present. If absent, add it. Then, after the effort resolution bash block
(`executor_model_effort_arg=...`), add:

```
**If `response_language` is set:** Include `response_language: {value}` in all spawned
subagent prompts so any user-facing output stays in the configured language.
```

(The original was at line ~94 of the pre-compression file. The current compressed file
at line 66-67 parses the field but never injects it into subagent prompts.)

**Loss 6 — Submodule per-plan justification (initialize step, ~line 89-97)**

In the compressed file the submodule bash block appears at lines 91-96 with no
explanation of why the decision is per-plan. After the `SUBMODULE_PATHS` bash block,
add one sentence:

```
This per-plan intersection avoids blanket worktree disabling that would penalise
plans nowhere near a submodule; the decision flows into `execute_waves` step 4
(`USE_WORKTREES_FOR_PLAN`).
```

**Loss 4 — Copilot fallback parallel-with-spot-check (runtime_compatibility, ~line 12)**

The compressed `<runtime_compatibility>` block (lines 10-15) has:
```
Only parallel if user explicitly requests; rely on filesystem spot-checks.
```
Expand the Copilot bullet to match the original's intent:
```
**Copilot:** No reliable completion signals. Use sequential inline execution: read
execute-plan.md directly per plan. Only attempt parallel spawning when the user
explicitly requests it — and in that case, rely on the spot-check fallback (commits
visible + SUMMARY.md exists) to detect completion; do not trust the signal alone.
```

**Loss 2 — Per-plan worktree dispatch gate (execute_waves step 4, ~line 218-226)**

The compressed step 4 (per-plan worktree decision) reads:
```
4. **Per-plan worktree decision:** Execute `.../per-plan-worktree-gate.md` for each plan.
   Append to `WAVE_WORKTREE_PLANS` if not dropped. Set `USE_WORKTREES_FOR_PLAN` per plan.
```
After this bullet, add:
```
   The dispatch branches in step 5 MUST gate on `USE_WORKTREES_FOR_PLAN` for the
   current plan, not on the project-level `USE_WORKTREES`.
```

**Loss 3 — REQUIRED ORDER truncation risk in executor prompt (~line 279)**

In the worktree-mode executor prompt, the compressed file has:
```
REQUIRED ORDER: Write SUMMARY.md → commit → narration. No text between Write and commit (#2070).
```
Append `(truncation risk; #2070 rescue is not primary defense)` to that line so it reads:
```
REQUIRED ORDER: Write SUMMARY.md → commit → narration. No text between Write and
commit (truncation risk; #2070 rescue is not primary defense).
```

Apply the same addition to the sequential-mode executor prompt block that also contains
`REQUIRED ORDER: Write SUMMARY.md → commit → only then any narration.`
</action>
  <verify>
    <automated>grep -c "response_language.*spawned\|configured language" get-shit-done/workflows/execute-phase.md</automated>
    <automated>grep -c "per-plan intersection\|nowhere near a submodule\|penali" get-shit-done/workflows/execute-phase.md</automated>
    <automated>grep -c "spot-check fallback\|do not trust the signal" get-shit-done/workflows/execute-phase.md</automated>
    <automated>grep -c "MUST gate on.*USE_WORKTREES_FOR_PLAN.*not on the project-level" get-shit-done/workflows/execute-phase.md</automated>
    <automated>grep -c "truncation risk" get-shit-done/workflows/execute-phase.md</automated>
  </verify>
  <done>
    - response_language injection instruction is present in initialize step
    - Submodule per-plan justification sentence is present after SUBMODULE_PATHS block
    - Copilot bullet clarifies spot-check-based parallel fallback
    - Dispatch gate note (`MUST gate on USE_WORKTREES_FOR_PLAN`) present in step 4
    - "truncation risk" phrase present in at least one executor prompt REQUIRED ORDER line
    Each automated grep returns >= 1.
  </done>
</task>

<task type="auto">
  <name>Task 2: Restore losses in worktree cleanup, failure handling, and executor reference_usage (Losses 5, 7, 8, 10, 11, 12)</name>
  <files>get-shit-done/workflows/execute-phase.md</files>
  <action>
Read the full current file at `get-shit-done/workflows/execute-phase.md` before editing.

Apply six restorations in document order.

**Loss 5 — Worktree cleanup "when to skip" conditions (execute_waves step 8, ~line 401)**

The compressed step 8 (worktree cleanup) ends with:
```
Skip if no worktrees used, or if merged via custom messages.
```
Replace that single line with the three original conditions:
```
**When to skip step 8:**
- If no plan in this wave used worktree isolation (`WAVE_WORKTREE_PLANS` is empty):
  all agents ran on the main working tree — skip entirely.
- If the orchestrator merged via custom messages (cross-wave-dependency deviation):
  run the cleanup-tail snippet above instead, then continue.
- If at least one plan used worktrees but others did not: still run cleanup — it
  iterates actual `git worktree list` output and only removes worktrees that were created.
```

**Loss 10 — Heartbeat interval vs. threshold distinction (execute_waves completion fallback, ~line 349-357)**

After the spot-check bash block in the completion signal fallback section, the compressed
file collapses interval/threshold into a single stall description. Restore the distinction
by expanding the stall surveillance sentence to:

```
**Configurable stall surveillance:** `EXECUTOR_STALL_INTERVAL_MINUTES` controls how often
to poll for activity; `EXECUTOR_STALL_THRESHOLD_MINUTES` controls how long with no
activity before pausing. Every interval, inspect `git log` for new commits. If no
SUMMARY.md and no new commits appear for the threshold duration, pause and offer:
continue waiting / kill-and-retry / kill-and-inline.
```

(Currently the compressed file at ~line 349-356 has one combined description with no
distinction between the two config values.)

**Loss 7 — Quota-exceeded routing specifics (execute_waves step 14, ~line 434)**

The compressed step 14 reads:
```
quota-exceeded (spot-check, offer wait/switch-runtime/abort)
```
Expand to:
```
quota-exceeded — run step spot-check first; if SUMMARY.md is missing but commits
exist, route to safe-resume (`state.verify-against-disk`) instead of immediate
redispatch. Do not offer "retry now". Offer: wait-for-reset / switch-runtime / abort.
```

**Loss 8 — Dirty working tree warning in cross_ai_delegation (~line 200-204)**

In `<step name="cross_ai_delegation">`, after the cross-AI failure description, add:
```
**After cross-AI failure:** warn the user about uncommitted changes before retry:
"Review `git status` and `git diff` before proceeding — the external command may
have left partial edits."
```

(In the compressed file the failure offer ends at "Offer retry / skip-to-fallback / abort."
with no dirty-tree warning. Locate that sentence and add the warning after it.)

**Loss 11 — Reference file purpose annotations (executor prompt `<reference_usage>`, ~line 292-294)**

The compressed `<reference_usage>` block reads:
```
Read `~/.claude/.../execute-plan.md` FIRST — it defines the per-task loop, atomic
commit protocol, deviation handling, and worktree auto-detection. Both spawned and
inline executors depend on it.
Consult `checkpoints.md` when plan tasks carry checkpoints. Consult `summary.md`
template for SUMMARY.md structure. Consult `tdd.md` for TDD-flagged tasks.
Consult `executor-examples.md` for deviations and checkpoints.
```

Expand each "Consult" bullet to restore when-to-use purpose:
```
Consult `checkpoints.md` when a plan task carries a checkpoint (`human-verify`,
`decision`, or `human-action`): it defines how to segment execution around each
type and which work returns to MAIN vs. continues in the SUBAGENT.
Consult `templates/summary.md` when writing SUMMARY.md: it defines the required
structure, frontmatter fields (requires/provides, subsystem, tags, key-files,
decisions, metrics), and one-liner rules.
Consult `tdd.md` when a plan task is TDD-flagged or behavior-adding: it defines
the red-green-refactor cycle and when TDD improves quality vs. when to skip it.
Consult `executor-examples.md` when handling a plan deviation or a checkpoint-bearing
task — it provides worked deviation-rule and checkpoint examples.
```

**Loss 12 — Worktree auto-detection mechanism (executor prompt `<parallel_execution>`, ~line 276-278)**

In the worktree-mode `<parallel_execution>` block, the compressed line:
```
Do NOT modify STATE.md or ROADMAP.md. execute-plan.md auto-detects worktree mode and skips shared file updates.
```
is already present. Verify it contains "`.git` is a file" to make the detection mechanism explicit. If not, expand to:
```
Do NOT modify STATE.md or ROADMAP.md. execute-plan.md auto-detects worktree mode
(`.git` is a file, not a directory) and skips STATE.md/ROADMAP.md updates automatically.
```
</action>
  <verify>
    <automated>grep -c "WAVE_WORKTREE_PLANS.*empty\|all agents ran on the main working tree" get-shit-done/workflows/execute-phase.md</automated>
    <automated>grep -c "EXECUTOR_STALL_INTERVAL_MINUTES.*how often\|controls how often" get-shit-done/workflows/execute-phase.md</automated>
    <automated>grep -c "EXECUTOR_STALL_THRESHOLD_MINUTES.*how long\|controls how long" get-shit-done/workflows/execute-phase.md</automated>
    <automated>grep -c "state.verify-against-disk\|Do not offer.*retry now" get-shit-done/workflows/execute-phase.md</automated>
    <automated>grep -c "git status.*git diff.*before proceeding\|partial edits" get-shit-done/workflows/execute-phase.md</automated>
    <automated>grep -c "how to segment execution\|which work returns to MAIN" get-shit-done/workflows/execute-phase.md</automated>
    <automated>grep -c "\.git.*is a file.*not a directory\|auto-detects worktree mode" get-shit-done/workflows/execute-phase.md</automated>
  </verify>
  <done>
    - Worktree cleanup skip section lists all three conditions (WAVE_WORKTREE_PLANS empty, custom-merge, partial worktree set)
    - Stall interval config distinction: EXECUTOR_STALL_INTERVAL_MINUTES (how often) and EXECUTOR_STALL_THRESHOLD_MINUTES (how long) are both described
    - Quota-exceeded routing says "Do not offer retry now" and references state.verify-against-disk
    - Dirty working tree warning ("git status and git diff before proceeding") appears after cross-AI failure
    - reference_usage Consult lines include segmentation/MAIN routing note for checkpoints.md
    - worktree auto-detection mentions ".git is a file, not a directory"
    Each automated grep returns >= 1.
  </done>
</task>

<task type="auto">
  <name>Task 3: Restore losses in TDD checkpoint, verify_phase_goal, checkpoint_handling, interactive mode, schema_drift_gate, and offer_next (Losses 9, 13, 14, 15, 16, 17)</name>
  <files>get-shit-done/workflows/execute-phase.md</files>
  <action>
Read the full current file at `get-shit-done/workflows/execute-phase.md` before editing.

Apply six restorations in document order.

**Loss 9 — TDD `--force-mvp-gate` escape hatch (tdd_review_checkpoint, ~line 497)**

The compressed step `tdd_review_checkpoint` ends with:
```
violations are **blocking** unless overridden with `--force-mvp-gate`.
```
After that sentence, add:
```
Override: `/gsd execute-phase {phase} --force-mvp-gate` to ship despite violations
(escape hatch — not yet implemented as a command; included for documentation and
future enforcement). Policy: `MVP_MODE=true` AND `TDD_MODE=true` → violations are
blocking; otherwise advisory and surfaced for review only.
```

**Loss 15 — Interactive mode presenter format (check_interactive_mode, ~line 137-144)**

The compressed `<step name="check_interactive_mode">` presents plans with no format
detail. Expand step 2a to include the exact presenter format:
```
   a. **Present each plan to the user:**
      ```
      ## Plan {plan_id}: {plan_name}
      Objective: {from plan file}
      Tasks: {task_count}
      Options: Execute / Review first / Skip / Stop
      ```
      If "Review first": display the full plan file, then ask again: Execute / Modify / Skip.
```

(Currently the compressed text says "Present plan summary; user chooses Execute / Review / Skip / Stop"
without the exact header format or the "Review first" re-ask flow.)

**Loss 14 — Auto-mode checkpoint type specifics (checkpoint_handling, ~line 449-452)**

The compressed `<step name="checkpoint_handling">` auto-mode block reads:
```
- **human-verify** → Auto-spawn continuation with `{user_response}="approved"`. Log auto-approval.
- **decision** → Auto-spawn continuation with first option. Log selection.
- **human-action** → Present to user (cannot automate).
```
Expand to restore the specific log line text and the auth-gate clarification:
```
- **human-verify** → Auto-spawn continuation agent with `{user_response}` = `"approved"`.
  Log `⚡ Auto-approved checkpoint`.
- **decision** → Auto-spawn continuation agent with `{user_response}` = first option
  from checkpoint details. Log `⚡ Auto-selected: [option]`.
- **human-action** → Present to user. Auth gates cannot be automated — these require
  human credentials or physical interaction.
```

**Loss 16 — Schema drift false-positive explanation (schema_drift_gate, ~line 537-552)**

The compressed `<step name="schema_drift_gate">` begins:
```
Run post-execution schema drift detection:
```
Prepend a one-sentence purpose annotation:
```
Post-execution schema drift detection. Catches false-positive verification where
build/types pass because TypeScript types come from config, not the live database.
```
(The compressed opening line has no explanation of *why* the gate exists. The original
file opened with this explanation. The purpose matters because it tells the executor
why this gate must not be skipped even when compilation succeeds.)

Also: in the user options block (run-push-now / skip-check / abort), annotate
`run-push-now` with `(recommended)`:
Find the line listing user options and change it to:
```
User picks: run-push-now (recommended) / skip-check / abort.
```

**Loss 13 — HUMAN-UAT.md structure (verify_phase_goal human_needed path, ~line 593)**

The compressed `human_needed` branch reads:
```
Create `{phase_dir}/{phase_num}-HUMAN-UAT.md` with pending items. Commit. Present to user.
If "approved": continue to update_roadmap. If issues: gap closure.
```
Expand to restore the 3-step flow and the fields downstream tools depend on:
```
**If human_needed:**

**Step A — Persist:** Create `{phase_dir}/{phase_num}-HUMAN-UAT.md` with frontmatter:
`status: partial`, `phase`, `source`, `started`, `updated` — plus `## Tests` section
listing each `human_verification` item as `### N. {description}` with `expected:` and
`result: [pending]`, and a `## Summary` block (`total`, `passed`, `issues`, `pending`,
`skipped`, `blocked`). These fields are required by `/gsd:progress` and `/gsd:audit-uat`.
Commit: `test({phase_num}): persist human verification items as UAT`.

**Step B — Present:**
```
## Phase {X}: {Name} — Human Verification Required
All automated checks passed. {N} items need human testing.
{items from VERIFICATION.md}
Items saved to `{phase_num}-HUMAN-UAT.md` — visible in /gsd:progress and /gsd:audit-uat.
"approved" → continue | Report issues → gap closure
```

If approved: proceed to `update_roadmap`. HUMAN-UAT.md persists with `status: partial`
until the user runs `/gsd:verify-work` on it.
```

**Loss 17 — offer_next recommended markers and CONTEXT.md branching (offer_next, ~line 675-681)**

The compressed `offer_next` currently:
```
**Otherwise:** STOP. Present options (no `/gsd-transition` command — it is internal only).
Check if next phase has CONTEXT.md. If not: suggest discuss-phase. If yes: suggest plan-phase.

Commands:
- `/gsd:progress` — see updated roadmap
- `/gsd:discuss-phase {next}` — discuss next phase (recommended if no CONTEXT.md)
- `/gsd:plan-phase {next}` — plan next (CONTEXT.md present)
- `/gsd:execute-phase {next}` — execute next (skip planning)
```

Replace with two conditional command lists that show distinct options and
`← recommended` markers:

```
**Otherwise:** STOP. Do not auto-advance. Do not suggest `/gsd-transition` — it is
internal only and does not exist as a user command.

Check whether CONTEXT.md exists for the next phase:
```bash
ls .planning/phases/*{next}*/{next}-CONTEXT.md 2>/dev/null || echo "no-context"
```

**If CONTEXT.md does NOT exist for the next phase:**
```
## Phase {X}: {Name} Complete
/gsd:progress — see updated roadmap
/gsd:discuss-phase {next} — discuss next phase  ← recommended
/gsd:plan-phase {next} — plan next phase (skip discuss)
/gsd:execute-phase {next} — execute next (skip discuss and plan)
```

**If CONTEXT.md exists for the next phase:**
```
## Phase {X}: {Name} Complete
/gsd:progress — see updated roadmap
/gsd:plan-phase {next} — plan next phase (CONTEXT.md present)  ← recommended
/gsd:discuss-phase {next} — re-discuss next phase
/gsd:execute-phase {next} — execute next (skip planning)
```
```

After all six edits, run `npm test 2>&1 | head -30` to confirm no test regressions
(tests do not parse execute-phase.md content, so this is a smoke check only).
</action>
  <verify>
    <automated>grep -c "force-mvp-gate.*escape hatch\|escape hatch" get-shit-done/workflows/execute-phase.md</automated>
    <automated>grep -c "Options: Execute / Review first / Skip / Stop\|Review first.*re-ask\|Ask again: Execute" get-shit-done/workflows/execute-phase.md</automated>
    <automated>grep -c "Auto-approved checkpoint\|Auto-selected:" get-shit-done/workflows/execute-phase.md</automated>
    <automated>grep -c "Auth gates cannot be automated\|require.*human credentials" get-shit-done/workflows/execute-phase.md</automated>
    <automated>grep -c "false-positive verification\|TypeScript types come from config" get-shit-done/workflows/execute-phase.md</automated>
    <automated>grep -c "run-push-now.*recommended\|recommended.*run-push-now" get-shit-done/workflows/execute-phase.md</automated>
    <automated>grep -c "status: partial\|audit-uat\|gsd:audit-uat" get-shit-done/workflows/execute-phase.md</automated>
    <automated>grep -c "recommended\b" get-shit-done/workflows/execute-phase.md</automated>
    <automated>grep -c "no-context\|CONTEXT.md.*next phase\|CONTEXT.md exists" get-shit-done/workflows/execute-phase.md</automated>
  </verify>
  <done>
    - TDD escape hatch documents --force-mvp-gate with advisory vs. blocking policy distinction
    - Interactive presenter shows the exact "## Plan {id}: {name} / Objective: / Tasks: / Options:" format
    - Auto-mode checkpoint bullets show log strings ("Auto-approved checkpoint", "Auto-selected") and auth-gate note
    - Schema drift gate opening mentions false-positive verification (TypeScript config types vs. live DB)
    - Schema drift user options include "(recommended)" on run-push-now
    - HUMAN-UAT.md structure restores status:partial, audit-uat field, Step A/B flow
    - offer_next provides two CONTEXT.md-conditional command lists with "← recommended" markers
    - No gsd-transition is suggested as a user command
    All automated greps return >= 1.
  </done>
</task>

</tasks>

<verification>
After all three tasks complete:

```bash
# Confirm all 17 restoration markers are present (key phrases per loss):
grep -c "response_language.*spawned\|configured language" get-shit-done/workflows/execute-phase.md
grep -c "per-plan intersection\|penali.*submodule" get-shit-done/workflows/execute-phase.md
grep -c "spot-check fallback.*detect completion\|do not trust the signal" get-shit-done/workflows/execute-phase.md
grep -c "MUST gate on.*USE_WORKTREES_FOR_PLAN" get-shit-done/workflows/execute-phase.md
grep -c "truncation risk" get-shit-done/workflows/execute-phase.md
grep -c "WAVE_WORKTREE_PLANS.*empty\|all agents ran on the main working tree" get-shit-done/workflows/execute-phase.md
grep -c "state.verify-against-disk\|Do not offer.*retry now" get-shit-done/workflows/execute-phase.md
grep -c "git status.*git diff.*before proceeding" get-shit-done/workflows/execute-phase.md
grep -c "force-mvp-gate.*escape hatch\|escape hatch" get-shit-done/workflows/execute-phase.md
grep -c "EXECUTOR_STALL_INTERVAL_MINUTES.*how often\|controls how often" get-shit-done/workflows/execute-phase.md
grep -c "how to segment execution\|which work returns to MAIN" get-shit-done/workflows/execute-phase.md
grep -c "\.git.*is a file.*not a directory" get-shit-done/workflows/execute-phase.md
grep -c "status: partial\|gsd:audit-uat" get-shit-done/workflows/execute-phase.md
grep -c "Auto-approved checkpoint\|Auth gates cannot be automated" get-shit-done/workflows/execute-phase.md
grep -c "Options: Execute / Review first / Skip / Stop\|Ask again: Execute" get-shit-done/workflows/execute-phase.md
grep -c "false-positive verification\|TypeScript types come from config" get-shit-done/workflows/execute-phase.md
grep -c "recommended" get-shit-done/workflows/execute-phase.md
```

All commands must return >= 1. Run `npm test 2>&1 | tail -5` for a final smoke check.
</verification>

<success_criteria>
- All 17 losses from CONTEXT.md are restored in get-shit-done/workflows/execute-phase.md
- File parses as valid XML-structured Markdown (no broken tags, no duplicate step names)
- Each restoration uses compressed prose in the same register as the surrounding text
- Three atomic commits, one per task
- npm test passes (no regressions introduced)
</success_criteria>

<output>
Create `.planning/quick/260608-msc-review-commit-a619eef4-prompt-compressio/260608-msc-SUMMARY.md` when done.
</output>
