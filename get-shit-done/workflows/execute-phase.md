<purpose>
Execute all plans in a phase using wave-based parallel execution. Orchestrator coordinates; subagents execute.
</purpose>

<core_principle>
Orchestrator: discover plans → analyze deps → group waves → spawn agents → handle checkpoints → collect results.
Subagents load full execute-plan context; orchestrator stays lean (~10-15% for 200k models).
</core_principle>

<runtime_compatibility>
**Claude Code:** Uses `Agent(subagent_type="gsd-executor", ...)` — blocks until complete.
**Copilot:** No reliable completion signals. Use sequential inline execution: read execute-plan.md directly per plan. Only attempt parallel spawning when the user explicitly requests it — and in that case, rely on the spot-check fallback (commits visible + SUMMARY.md exists) to detect completion; do not trust the signal alone.
**Other runtimes:** If Agent unavailable, use sequential inline as fallback. Check at runtime.
**Fallback rule:** If spawned agent finishes (commits visible, SUMMARY.md exists) but signal not received, treat as successful via spot-check. Never block indefinitely — verify via git state.
</runtime_compatibility>

<required_reading>
Read STATE.md before operations.
<%~ include('get-shit-done/references/agent-contracts.md') %>
<%~ include('get-shit-done/references/context-budget.md') %>
<%~ include('get-shit-done/references/gates.md') %>
</required_reading>

<available_agent_types>
- gsd-executor — Execute tasks, commit, create SUMMARY.md
- gsd-verifier — Verify phase completion, check gates
- gsd-planner — Create detailed plans
- gsd-phase-researcher — Research technical approaches
- gsd-plan-checker — Review plan quality
- gsd-debugger — Diagnose and fix issues
- gsd-codebase-mapper — Map structure and dependencies
- gsd-integration-checker — Check cross-phase integration
- gsd-nyquist-auditor — Validate verification coverage
- gsd-ui-researcher — Research UI/UX approaches
- gsd-ui-checker — Review UI implementation
- gsd-ui-auditor — Audit UI vs requirements
</available_agent_types>

<process>

<step name="parse_args" priority="first">
Parse `$ARGUMENTS`:
- First positional → `PHASE_ARG`
- `--wave N` → `WAVE_FILTER`
- `--gaps-only` → keep current meaning
- `--cross-ai` → `CROSS_AI_FORCE=true`
- `--no-cross-ai` → `CROSS_AI_DISABLED=true`
</step>

<step name="initialize" priority="first">
Load context in one call:
```bash
GSD_TOOLS="${RUNTIME_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}/get-shit-done/bin/gsd-tools.cjs"
if [ -f "$GSD_TOOLS" ]; then
  GSD_SDK="node $GSD_TOOLS"
elif command -v gsd-sdk >/dev/null 2>&1; then
  GSD_SDK="gsd-sdk"
else
  echo "ERROR: gsd-sdk not found" >&2; exit 1
fi
INIT=$($GSD_SDK query init.execute-phase "${PHASE_ARG}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
AGENT_SKILLS=$($GSD_SDK query agent-skills gsd-executor)
```

Parse JSON for: `executor_model`, `executor_effort`, `verifier_model`, `verifier_effort`, `parallelization`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `plans`, `incomplete_plans`, `state_exists`.

**Model resolution:** If `executor_model` is `"inherit"`, omit `model=` param — Claude Code inherits orchestrator model. Only set `model=` when explicit (e.g., `"claude-sonnet-4-6"`).

**Effort resolution:**
```bash
executor_model_effort_arg=$([ -n "$executor_effort" ] && [ "$executor_effort" != "null" ] && echo "effort=\"$executor_effort\"" || echo "")
verifier_model_effort_arg=$([ -n "$verifier_effort" ] && [ "$verifier_effort" != "null" ] && echo "effort=\"$verifier_effort\"" || echo "")
```

**If `response_language` is set:** Include `response_language: {value}` in all spawned subagent prompts so any user-facing output stays in the configured language.

Read runtime config; fail if incompatible:
```bash
RUNTIME=$($GSD_SDK query config-get runtime --default claude 2>/dev/null || echo "claude")
USE_WORKTREES=$($GSD_SDK query config-get workflow.use_worktrees 2>/dev/null || echo "true")
EXECUTOR_STALL_INTERVAL_MINUTES=$($GSD_SDK query config-get executor.stall_detect_interval_minutes 2>/dev/null || echo "5")
EXECUTOR_STALL_THRESHOLD_MINUTES=$($GSD_SDK query config-get executor.stall_threshold_minutes 2>/dev/null || echo "10")

if [ "$RUNTIME" = "codex" ] && [ "$USE_WORKTREES" != "false" ]; then
  echo "FATAL: Codex worktree isolation unsupported. Set workflow.use_worktrees=false or use compatible runtime." >&2; exit 1
fi
[ "$USE_WORKTREES" != "false" ] && $GSD_SDK query worktree.reap-orphans 2>/dev/null || true
```

**Submodule handling:** Parse submodule paths once; intersect per-plan with files_modified to decide worktree isolation per-plan.
```bash
if [ -f .gitmodules ]; then
  SUBMODULE_PATHS=$(git config --file .gitmodules --get-regexp '^submodule\..*\.path$' 2>/dev/null | awk '{print $2}')
else
  SUBMODULE_PATHS=""
fi
```
This per-plan intersection avoids blanket worktree disabling that would penalise plans nowhere near a submodule; the decision flows into `execute_waves` step 4 (`USE_WORKTREES_FOR_PLAN`).

**Auto-chain sync (REQUIRED):** If user invoked manually (no `--auto`), clear ephemeral chain flag:
```bash
if [[ ! "$ARGUMENTS" =~ --auto ]]; then
  $GSD_SDK query config-set workflow._auto_chain_active false || true
fi
```

**MVP+TDD mode:**
```bash
MVP_FLAG_ARG=""
[[ "$ARGUMENTS" =~ (^|[[:space:]])--mvp([[:space:]]|$) ]] && MVP_FLAG_ARG="--cli-flag"
MVP_MODE=$($GSD_SDK query phase.mvp-mode "${PHASE_NUMBER}" $MVP_FLAG_ARG --pick active)
TDD_MODE=$($GSD_SDK query config-get workflow.tdd_mode 2>/dev/null || echo "false")
```

**Safe resume gate:** Derive `CURRENT_PLAN_ID` from active incomplete plan, search recent git history. If production commits exist but SUMMARY.md missing, stop and offer recovery (close manually / re-execute / mark-and-skip).

**MVP+TDD gate** runs inside plan execution before implementation steps — same predicate and RED-commit contract.

**Copilot sequential detection:**
Check for `@gsd-executor` pattern or absence of Agent() API. If Copilot, set `COPILOT_SEQUENTIAL=true` and skip `execute_waves` for inline execution.
</step>

<step name="check_blocking_antipatterns" priority="first">
Look for `.continue-here.md` in phase dir. If found, parse "Critical Anti-Patterns" table for `severity = blocking`.

**If blocking anti-patterns found:** Before proceeding, answer for each:
1. What is this anti-pattern?
2. How did it manifest?
3. What structural mechanism prevents recurrence?

If cannot answer from context, stop and ask user.

**If no `.continue-here.md` or no blocking rows:** Proceed to next step.
</step>

<step name="check_interactive_mode">
Parse `--interactive` flag from $ARGUMENTS.

**If present:** Execute plans sequentially inline (no subagent spawning) with user checkpoints between tasks. For each plan:
1. Present plan summary; user chooses Execute / Review / Skip / Stop
2. If Execute: read execute-plan.md inline, execute tasks one by one
3. After each task: pause; user can intervene or continue
4. After plan: show results, commit, create SUMMARY.md
5. Continue to next plan

Skip to handle_branching step after all plans complete.
</step>

<step name="handle_branching">
Check `branching_strategy` from init. **"none":** skip. **"phase" or "milestone":** use `branch_name`.

Fork from origin/HEAD (default branch), not current HEAD (#2916):
```bash
DEFAULT_BRANCH=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||')
DEFAULT_BRANCH=${DEFAULT_BRANCH:-main}

if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
  git switch "$BRANCH_NAME" || { echo "ERROR: Could not switch to '$BRANCH_NAME'." >&2; exit 1; }
else
  git fetch --quiet origin "$DEFAULT_BRANCH" || \
    git show-ref --verify --quiet "refs/remotes/origin/$DEFAULT_BRANCH" || \
    { echo "ERROR: Cannot create branch without origin/$DEFAULT_BRANCH (#2916)." >&2; exit 1; }
  git switch --quiet "$DEFAULT_BRANCH" 2>/dev/null && git merge --ff-only --quiet "origin/$DEFAULT_BRANCH" 2>/dev/null || true
  git checkout -b "$BRANCH_NAME" "origin/$DEFAULT_BRANCH" || \
    { echo "ERROR: Could not create '$BRANCH_NAME' from origin/$DEFAULT_BRANCH (#2916)." >&2; exit 1; }
fi
```
</step>

<step name="validate_phase">
Report: "Found {plan_count} plans in {phase_dir} ({incomplete_count} incomplete)"
Update STATE.md: `$GSD_SDK query state.begin-phase --phase "${PHASE_NUMBER}" --name "${PHASE_NAME}" --plans "${PLAN_COUNT}"`
</step>

<step name="discover_and_group_plans">
```bash
PLAN_INDEX=$($GSD_SDK query phase-plan-index "${PHASE_NUMBER}")
```
Parse JSON for: `phase`, `plans[]` (id, wave, autonomous, objective, files_modified, task_count, has_summary), `waves`, `incomplete`.

Skip plans where `has_summary: true`. If `--gaps-only`: skip non-gap_closure. If `WAVE_FILTER`: skip non-matching waves.

**Wave safety:** If `WAVE_FILTER` set and incomplete plans exist in earlier waves, STOP. Do not skip prerequisites.

Report wave structure with objectives.
</step>

<step name="cross_ai_delegation">
**Skip if** `CROSS_AI_DISABLED=true`. **Force all if** `CROSS_AI_FORCE=true`.

Otherwise: check frontmatter `cross_ai: true` AND config `workflow.cross_ai_execution=true`.

**If no plans marked:** skip to execute_waves.

**If marked but `cross_ai_command` empty:** error — user must set via config.

**For each cross-ai plan:** Extract objective+tasks from PLAN.md. Pipe to external command via stdin (never shell-interpolate). Capture result:
```bash
echo "$TASK_PROMPT" | timeout "${CROSS_AI_TIMEOUT}s" ${CROSS_AI_CMD} > "$CANDIDATE_SUMMARY" 2>"$ERROR_LOG"
```

**Success (exit 0 + valid SUMMARY.md):** Write SUMMARY.md, update STATE/ROADMAP, skip in execute_waves.

**Failure:** Display error. Offer retry / skip-to-fallback / abort.

Remove successful plans from execute_waves list.
</step>

<step name="execute_waves">
**Stream-idle-timeout prevention (#2410):** Emit heartbeat lines `[checkpoint] ...` at wave/plan boundaries (literal text, no tool call).

**For each wave:**

1. **Intra-wave overlap check (BEFORE spawning):** If two plans share files in `files_modified`, flag overlap and force sequential (override `PARALLELIZATION` for this wave). Warn user — planning defect.

2. **Emit wave-start heartbeat:** `[checkpoint] phase {PHASE_NUMBER} wave {N}/{M} starting, {wave_plan_count} plan(s), {P}/{Q} plans done`

3. **Describe what's being built:** Read each plan's `<objective>`. Extract 2-3 sentences per plan explaining what's built and why.

4. **Per-plan worktree decision:** Execute `get-shit-done/workflows/execute-phase/steps/per-plan-worktree-gate.md` for each plan. Append to `WAVE_WORKTREE_PLANS` if not dropped. Set `USE_WORKTREES_FOR_PLAN` per plan.
   The dispatch branches in step 5 MUST gate on `USE_WORKTREES_FOR_PLAN` for the current plan, not on the project-level `USE_WORKTREES`.

5. **Spawn executor agents:**

**Emit plan-start heartbeat before each Agent() dispatch:** `[checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} starting ({P}/{Q} plans done)`

**Worktree mode** (if `USE_WORKTREES_FOR_PLAN` not false):

Capture expected state:
```bash
EXPECTED_BASE=$(git rev-parse HEAD)
DISPATCH_TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EXPECTED_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ -z "${WAVE_WORKTREE_MANIFEST:-}" ]; then
  WAVE_WORKTREE_MANIFEST="$(mktemp "${TMPDIR:-/tmp}/gsd-worktree-wave-XXXXXX").json"
  printf '{"worktrees":[]}\n' > "$WAVE_WORKTREE_MANIFEST"
  export WAVE_WORKTREE_MANIFEST
fi
```

Dispatch one Agent() per message with `run_in_background: true` (sequential dispatch prevents `.git/config.lock` race):

```text
Agent(
  subagent_type="gsd-executor",
  description="Execute plan {plan_number} of phase {phase_number}",
  model="{executor_model}",  # omit when executor_model == "inherit"
  effort={executor_model_effort_arg}  # omit when null
  isolation="worktree",
  prompt="
    <objective>
    Execute plan {plan_number} of phase {phase_number}-{phase_name}.
    Commit each task atomically. Create SUMMARY.md.
    Do NOT update STATE.md or ROADMAP.md — orchestrator owns these.
    </objective>

    <worktree_branch_check>
    FIRST ACTION: HEAD assertion before any reset/checkout. Worktrees use `worktree-agent-<id>` namespace. If HEAD is on protected ref (main/master/develop/trunk/release/*) or detached, HALT — do NOT self-recover via `git update-ref` (#2924).
    ```bash
    HEAD_REF=$(git symbolic-ref --quiet HEAD || echo "DETACHED")
    ACTUAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ "$HEAD_REF" = "DETACHED" ] || echo "$ACTUAL_BRANCH" | grep -Eq '^(main|master|develop|trunk|release/.*)$'; then
      echo "FATAL: worktree HEAD on '$ACTUAL_BRANCH' (expected worktree-agent-*); refusing self-recovery (#2924)." >&2; exit 1
    fi
    if ! echo "$ACTUAL_BRANCH" | grep -Eq '^worktree-agent-[A-Za-z0-9._/-]+$'; then
      echo "FATAL: worktree HEAD not in worktree-agent-* namespace; refusing to commit (#2924)." >&2; exit 1
    fi
    ACTUAL_BASE=$(git merge-base HEAD {EXPECTED_BASE})
    if [ "$ACTUAL_BASE" != "{EXPECTED_BASE}" ]; then
      git reset --hard {EXPECTED_BASE}
      [ "$(git rev-parse HEAD)" != "{EXPECTED_BASE}" ] && { echo "ERROR: could not correct worktree base"; exit 1; }
    fi
    ```
    Per-commit safety: `agents/gsd-executor.md` steps 0/0a/0b + `references/worktree-path-safety.md`.
    </worktree_branch_check>

    <parallel_execution>
    Parallel executor in git worktree. Path safety (cwd-drift, absolute-path guards) in `worktree-path-safety.md` (loaded below).
    Run `git commit` normally — hooks run by default. Do NOT pass `--no-verify` unless `workflow.worktree_skip_hooks=true`.
    Do NOT modify STATE.md or ROADMAP.md. execute-plan.md auto-detects worktree mode and skips shared file updates.
    REQUIRED: SUMMARY.md MUST be committed before return. Worktree mode commits SUMMARY.md and REQUIREMENTS.md only. Do NOT skip.
    REQUIRED ORDER: Write SUMMARY.md → commit → narration. No text between Write and commit (truncation risk; #2070 rescue is not primary defense).
    </parallel_execution>

    <execution_context>
    @~/.claude/get-shit-done/workflows/execute-plan.md
    @~/.claude/get-shit-done/templates/summary.md
    @~/.claude/get-shit-done/references/checkpoints.md
    @~/.claude/get-shit-done/references/tdd.md
    <%~ include('get-shit-done/references/worktree-path-safety.md') %>
    @~/.claude/get-shit-done/references/executor-examples.md
    </execution_context>

    <reference_usage>
    Read `~/.claude/get-shit-done/workflows/execute-plan.md` FIRST — it defines the per-task loop, atomic commit protocol, deviation handling, and worktree auto-detection. Both spawned and inline executors depend on it.
    Consult `checkpoints.md` when plan tasks carry checkpoints. Consult `summary.md` template for SUMMARY.md structure. Consult `tdd.md` for TDD-flagged tasks. Consult `executor-examples.md` for deviations and checkpoints.
    </reference_usage>

    <files_to_read>
    - {phase_dir}/{plan_file} (Plan)
    - .planning/PROJECT.md (Project context)
    - .planning/STATE.md (State)
    - .planning/config.json (Config, if exists)
    - ${phase_dir}/*-CONTEXT.md (User decisions)
    - ${phase_dir}/*-RESEARCH.md (Technical research)
    - ${prior_wave_summaries} (Earlier waves)
    - ./CLAUDE.md (Project instructions)
    - .claude/skills/ or .agents/skills/ (Project skills)
    </files_to_read>

    ${AGENT_SKILLS}

    <mcp_tools>
    If CLAUDE.md references MCP tools, prefer them over Grep/Glob for code navigation.
    </mcp_tools>

    <success_criteria>
    - [ ] All tasks executed
    - [ ] Each task committed individually
    - [ ] SUMMARY.md created in plan directory
    - [ ] No modifications to STATE.md/ROADMAP.md
    </success_criteria>
  "
)
```

Append `{agent_id, worktree_path, branch, expected_base}` to `WAVE_WORKTREE_MANIFEST` after return. If any field missing, stop and ask for recovery.

**Sequential mode** (if `USE_WORKTREES_FOR_PLAN` is false — project-level or per-plan submodule intersection):

Omit `isolation="worktree"`. Replace `<parallel_execution>` block with:
```
<sequential_execution>
Sequential executor on main working tree. Use normal commits with hooks.
REQUIRED ORDER: Write SUMMARY.md → commit → only then any narration. No text between Write and commit (truncation risk; #2070 rescue is not primary defense).
</sequential_execution>
```

Success criteria include STATE.md and ROADMAP.md updates (not deferred).

When plan in wave dropped to sequential, execute affected plan(s) one-at-a-time to avoid concurrent main-tree writes. Parallel plans with worktree isolation can run alongside.

6. **Wait for all agents in wave to complete.**

**Plan-complete heartbeat (#2410):**
```
[checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} complete ({P}/{Q} plans done)
[checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} failed ({P}/{Q} plans done)
[checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} checkpoint ({P}/{Q} plans done)
```

**Completion signal fallback:** If agent doesn't return signal but appears complete, spot-check:
```bash
SUMMARY_EXISTS=$(test -f "{phase_dir}/{plan_number}-{plan_padded}-SUMMARY.md" && echo "true" || echo "false")
COMMITS_FOUND=$(git log --oneline --all --grep="{phase_number}-{plan_padded}" --since="1 hour ago" | head -1)
COMMITS_SINCE_DISPATCH=$(git log "${EXPECTED_BRANCH}" --since="${DISPATCH_TS}" --oneline | head -1)
```

If SUMMARY exists AND commits found → treat as done. If not, check for activity. If no activity for threshold, pause and ask: continue waiting / kill-and-retry / kill-and-inline.

7. **Post-wave hook validation** (parallel mode, if `workflow.worktree_skip_hooks=true` opted out):
```bash
SKIP_HOOKS=$($GSD_SDK query config-get workflow.worktree_skip_hooks 2>/dev/null || echo "false")
if [ "$SKIP_HOOKS" = "true" ]; then
  STASHED=false
  if (! git diff --quiet || ! git diff --cached --quiet) && git stash push -u -m "gsd-post-wave-hook-$$" >/dev/null 2>&1; then STASHED=true; fi
  git hook run pre-commit 2>&1 || echo "⚠ Pre-commit hooks failed"
  [ "$STASHED" = "true" ] && (git stash pop >/dev/null 2>&1 || echo "⚠ Could not pop stash")
fi
```

8. **Worktree cleanup** (when isolation used):

Use manifest as source of truth (#3384). Fail closed:
```bash
[ -n "${WAVE_WORKTREE_MANIFEST:-}" ] && [ -f "$WAVE_WORKTREE_MANIFEST" ] || { echo "BLOCKED: missing WAVE_WORKTREE_MANIFEST (#3384)." >&2; exit 1; }

PRIMARY_WT=$(git worktree list --porcelain | awk '/^worktree /{print substr($0,10); exit}')
[ -z "$PRIMARY_WT" ] && { echo "FATAL: no primary worktree" >&2; exit 1; }
[ "$(pwd -P 2>/dev/null)" != "$(cd "$PRIMARY_WT" 2>/dev/null && pwd -P)" ] && cd "$PRIMARY_WT" || { echo "FATAL: cannot cd to primary" >&2; exit 1; }
ORCH_BRANCH=$(git rev-parse --abbrev-ref HEAD)
[ -z "${EXPECTED_BRANCH:-}" ] || [ "$ORCH_BRANCH" = "$EXPECTED_BRANCH" ] || { echo "FATAL: branch drift before cleanup (#3174)" >&2; exit 1; }

$GSD_SDK query worktree.cleanup-wave --manifest "$WAVE_WORKTREE_MANIFEST" || exit 1
```

**Cleanup-tail** (after custom cross-wave merges):
```bash
PRIMARY_WT=$(git worktree list --porcelain | awk '/^worktree /{print substr($0,10); exit}')
[ -n "$PRIMARY_WT" ] && [ "$(pwd -P 2>/dev/null)" != "$(cd "$PRIMARY_WT" 2>/dev/null && pwd -P)" ] && cd "$PRIMARY_WT" || { echo "FATAL: cannot cd to primary" >&2; exit 1; }
WT_PATHS_FILE=$(mktemp "${TMPDIR:-/tmp}/gsd-worktree-paths-XXXXXX")
node -e 'const fs=require("fs");const p=process.env.WAVE_WORKTREE_MANIFEST;try{if(!p)throw new Error("WAVE_WORKTREE_MANIFEST unset");if(!fs.existsSync(p))throw new Error("manifest missing");const s=fs.readFileSync(p,"utf8");if(!s.trim())throw new Error("manifest empty");const j=JSON.parse(s);for(const w of j.worktrees||[])if(w.worktree_path)console.log(w.worktree_path)}catch(e){console.error(`ERROR: cannot read manifest: ${e.message}`);process.exit(1)}' > "$WT_PATHS_FILE" || { echo "BLOCKED: cannot read WAVE_WORKTREE_MANIFEST (#3384)." >&2; exit 1; }
while IFS= read -r WT; do
  [ -z "$WT" ] && continue
  WT_BRANCH=$(git -C "$WT" rev-parse --abbrev-ref HEAD 2>/dev/null)
  [ -z "$WT_BRANCH" ] || [ "$WT_BRANCH" = "HEAD" ] && continue
  git worktree unlock "$WT" 2>/dev/null || true
  git worktree remove "$WT" --force || { WT_NAME=$(basename "$WT"); echo "⚠ Manual cleanup: git worktree unlock \"$WT\" && git worktree remove \"$WT\" --force && git branch -D \"$WT_BRANCH\""; }
  git branch -D "$WT_BRANCH" 2>/dev/null || true
done < "$WT_PATHS_FILE"
git worktree prune
```

Skip if no worktrees used, or if merged via custom messages.

9. **Post-merge build & test gate:** Execute `get-shit-done/workflows/execute-phase/steps/post-merge-gate.md` after worktree merges. Catches integration issues agents' self-checks miss.

10. **Post-wave shared artifact update** (when worktrees used, skip if tests failed):

Only update tracking when `TEST_EXIT=0`:
```bash
if [ "${TEST_EXIT}" -eq 0 ]; then
  for plan_id in {completed_plan_ids}; do
    $GSD_SDK query roadmap.update-plan-progress "${PHASE_NUMBER}" "${plan_id}" "complete"
  done
  if ! git diff --quiet .planning/ROADMAP.md .planning/STATE.md 2>/dev/null; then
    $GSD_SDK query commit "docs(phase-${PHASE_NUMBER}): update tracking after wave ${N}" --files .planning/ROADMAP.md .planning/STATE.md
  fi
elif [ "${TEST_EXIT}" -eq 124 ]; then
  echo "⚠ Test timeout — skipping tracking. Plans remain in-progress."
else
  echo "⚠ Tests failed (exit ${TEST_EXIT}) — skipping tracking until tests pass."
fi
```

Skip if no worktrees used (sequential agents updated themselves).

11. **Handle test failures:** If `WAVE_FAILURE_COUNT > 0`, present failures and offer Fix now / Continue / Abort. If multiple failures, strongly recommend Fix now.

12. **Wave-close heartbeat (#2410):**
```
[checkpoint] phase {PHASE_NUMBER} wave {N}/{M} complete, {P}/{Q} plans done ({wave_success}/{wave_plan_count} ok)
```

13. **Report completion:** Verify first 2 key-files exist, check git log for commits, check for FAILED marker. Spot-check failures → ask Retry/Continue. If pass, show what was built + deviations.

14. **Handle failures:** Classify via `$GSD_SDK query agent.classify-failure`. Route by class: quota-exceeded (spot-check, offer wait/switch-runtime/abort), classifyHandoffIfNeeded (spot-check, pass=success), unknown (ask Continue/Stop).

15. **Checkpoint plans between waves** — see `<checkpoint_handling>`.

16. **Proceed to next wave.**
</step>

<step name="checkpoint_handling">
Plans with `autonomous: false` require user interaction.

**Auto-mode:** Read config:
```bash
AUTO_MODE=$($GSD_SDK query check auto-mode --pick active 2>/dev/null || echo "false")
```

When executor returns checkpoint AND `AUTO_MODE=true`:
- **human-verify** → Auto-spawn continuation with `{user_response}="approved"`. Log auto-approval.
- **decision** → Auto-spawn continuation with first option. Log selection.
- **human-action** → Present to user (cannot automate).

**Standard flow:** Spawn agent → agent runs until checkpoint → returns structured state (completed tasks, current task, blocker, checkpoint type/details). Present to user. User responds: approved / issue description / decision selection. Spawn continuation agent (fresh, not resume) with explicit state (completed_tasks_table, resume_task_number, resume_task_name, user_response, resume_instructions). Continuation verifies prior commits, continues from resume point. Repeat until plan completes or user stops.

Fresh agent approach more reliable than resume (which breaks with parallel tool calls).
</step>

<step name="aggregate_results">
Report:
```markdown
## Phase {X}: {Name} Execution Complete

**Waves:** {N} | **Plans:** {M}/{total} complete

| Wave | Plans | Status |
|------|-------|--------|
| 1 | {plan_ids} | ✓ Complete |
| CP | {plan_ids} | ✓ Verified |

### Plan Details
{One-liners from SUMMARY.md}

### Issues Encountered
{Aggregate from SUMMARYs}
```

**Security gate:**
```bash
SECURITY_CFG=$($GSD_SDK query config-get workflow.security_enforcement --raw 2>/dev/null || echo "true")
SECURITY_FILE=$(ls "${PHASE_DIR}"/*-SECURITY.md 2>/dev/null | head -1)
```

If `SECURITY_CFG=false`: skip. If `true` AND no SECURITY.md: suggest `/gsd:secure-phase`. If SECURITY.md exists and `threats_open > 0`: block until resolved.
</step>

<step name="tdd_review_checkpoint">
Skip if `TDD_MODE=false`.

Check for `type: tdd` plans:
```bash
TDD_PLANS=$(grep -rl "^type: tdd" "${PHASE_DIR}"/*-PLAN.md 2>/dev/null | wc -l | tr -d ' ')
```

If `TDD_PLANS > 0`: Verify RED/GREEN/REFACTOR gate sequence for each. RED gate: failing test commit exists. GREEN gate: implementation commit exists. REFACTOR gate: optional cleanup. Flag violations.

Present summary table. **Escalation under MVP+TDD:** When both `MVP_MODE=true` AND `TDD_MODE=true`, violations are **blocking** unless overridden with `--force-mvp-gate`.
</step>

<step name="handle_partial_wave_execution">
If `WAVE_FILTER` used, re-run discovery after execution. If incomplete plans remain, STOP — skip phase verification. Present wave-complete summary + commands to continue remaining waves. If no incomplete plans remain, continue to verification.
</step>

<step name="code_review_gate" required="true">
**Config gate:**
```bash
CODE_REVIEW_ENABLED=$($GSD_SDK query config-get workflow.code_review 2>/dev/null || echo "true")
```

If `false`: skip. Otherwise invoke:
```
Skill(skill="gsd-code-review", args="${PHASE_NUMBER}")
```

Check result status. Non-blocking — review failures must never block. Proceed regardless to next step.
</step>

<step name="close_parent_artifacts">
**For decimal phases only** (X.Y pattern, e.g., 4.1):
```bash
if [[ "$PHASE_NUMBER" == *.* ]]; then
  PARENT_PHASE="${PHASE_NUMBER%%.*}"
fi
```

Find parent UAT file. Update gap statuses from `failed` → `resolved`. Update frontmatter `diagnosed` → `resolved`. Resolve referenced debug sessions (move to `resolved/` dir). Commit.

Skip if no decimal or no parent UAT found.
</step>

<step name="regression_gate">
Skip if first phase or no prior VERIFICATION.md files.

Discover prior phases' test files from VERIFICATION.md and prior SUMMARY.md. Resolve test command (config > Makefile > language sniff). Run prior tests. Report results. If fail, offer Fix / Continue anyway / Abort.
</step>

<step name="schema_drift_gate">
Run post-execution schema drift detection:
```bash
SCHEMA_DRIFT=$($GSD_SDK query verify.schema-drift "${PHASE_NUMBER}" 2>/dev/null)
```

Parse for `drift_detected`, `blocking`, `schema_files`, `unpushed_orms`, `message`.

If false: skip. If true AND blocking:
Check override:
```bash
SKIP_SCHEMA=$(echo "${GSD_SKIP_SCHEMA_CHECK:-false}")
```

If skip: display warning + continue. Otherwise: BLOCK verification. Display schema files changed and required push commands. User picks: run-push-now / skip-check / abort. If run-push, re-check drift. If skip, continue.
</step>

<step name="codebase_drift_gate">
Post-execution structural drift detection (non-blocking by contract). Load full step spec from `get-shit-done/workflows/execute-phase/steps/codebase-drift-gate.md`.
</step>

<step name="verify_phase_goal">
Verify phase achieved GOAL, not just completed tasks:

```bash
VERIFIER_SKILLS=$($GSD_SDK query agent-skills gsd-verifier)
```

```
Agent(
  description="Verify phase {phase_number} goal achievement",
  prompt="Verify phase {phase_number} goal achievement. Phase directory: {phase_dir}. Phase goal: {goal from ROADMAP.md}. Phase requirement IDs: {phase_req_ids}. Check must_haves against actual codebase. Cross-reference requirement IDs vs REQUIREMENTS.md — every ID MUST be accounted for. Create VERIFICATION.md.

<files_to_read>
- {phase_dir}/*-PLAN.md (all plans — understand intent, check must_haves)
- {phase_dir}/*-SUMMARY.md (all summaries — cross-reference claimed vs actual)
- .planning/REQUIREMENTS.md (Requirement traceability)
- {phase_dir}/*-CONTEXT.md (User decisions)
- {phase_dir}/*-RESEARCH.md (Known pitfalls)
- Prior VERIFICATION.md files (regression check)
</files_to_read>

${VERIFIER_SKILLS}",
  subagent_type="gsd-verifier",
  model="{verifier_model}",
  effort={verifier_model_effort_arg}
)
```

Read status:
```bash
grep "^status:" "$PHASE_DIR"/*-VERIFICATION.md | cut -d: -f2 | tr -d ' '
```

**If passed:** → update_roadmap.

**If human_needed:** Create `{phase_dir}/{phase_num}-HUMAN-UAT.md` with pending items. Commit. Present to user. If "approved": continue to update_roadmap. If issues: gap closure.

**If gaps_found:** Present gap summary. Offer `/gsd:plan-phase {X} --gaps`. Gap closure cycle: plan-phase creates gap plans → user runs execute-phase --gaps-only → verifier re-runs.
</step>

<step name="update_roadmap">
Mark phase complete:
```bash
COMPLETION=$($GSD_SDK query phase.complete "${PHASE_NUMBER}")
```

Extract: `next_phase`, `is_last_phase`, `warnings`, `has_warnings`.

If `has_warnings`: display warning list (tracked in progress/audit-uat).

Commit:
```bash
$GSD_SDK query commit "docs(phase-{X}): complete phase execution" --files .planning/ROADMAP.md .planning/STATE.md .planning/REQUIREMENTS.md {phase_dir}/*-VERIFICATION.md
```
</step>

<step name="auto_copy_learnings">
**Check config:**
```bash
GL_ENABLED=$($GSD_SDK query config-get features.global_learnings --raw 2>/dev/null || echo "false")
```

If not `true`: skip (disabled by default).

If enabled: Check if LEARNINGS.md exists in phase dir. If yes, copy to global store:
```bash
$GSD_SDK query learnings.copy 2>/dev/null || echo "⚠ Learnings copy failed — continuing"
```

Copy failure is non-blocking.
</step>

<step name="close_phase_todos">
Auto-close todos tagged `resolves_phase: <current-phase>`:
```bash
PHASE_NUM="${PHASE_NUMBER}"
PENDING_DIR=".planning/todos/pending"
COMPLETED_DIR=".planning/todos/completed"
mkdir -p "$COMPLETED_DIR"

CLOSED=()
for TODO_FILE in "$PENDING_DIR"/*.md; do
  [ -f "$TODO_FILE" ] || continue
  RP=$(awk '/^---/{c++;next} c==1 && /^resolves_phase:/{print $2;exit} c==2{exit}' "$TODO_FILE" 2>/dev/null || true)
  if [ "$RP" = "$PHASE_NUM" ] || [ "$RP" = "\"$PHASE_NUM\"" ]; then
    mv "$TODO_FILE" "$COMPLETED_DIR/"
    CLOSED+=("$(basename "$TODO_FILE")")
  fi
done

if [ ${#CLOSED[@]} -gt 0 ]; then
  $GSD_SDK query commit "docs(phase-${PHASE_NUMBER}): auto-close ${#CLOSED[@]} todo(s)" --files .planning/todos/completed/ .planning/STATE.md || true
fi
```

Skip silently if no matching todos.
</step>

<step name="update_project_md">
Update PROJECT.md to reflect phase completion (prevents drift — #956). Move validated requirements from Active → Validated. Update "Current State" section. Commit.

Skip if no PROJECT.md exists.
</step>

<step name="offer_next">
**Exception:** If gaps_found, verify_phase_goal already presents gap-closure path.

**No-transition check:** If `--no-transition` flag present (execute-phase spawned by plan-phase's auto-advance), return completion status to parent and STOP. Do not run transition.

**Auto-advance detection:**
```bash
AUTO_MODE=$($GSD_SDK query check auto-mode --pick active 2>/dev/null || echo "false")
```

If `--auto` flag present OR `AUTO_MODE=true` (AND verification passed, no gaps):
Execute transition workflow inline (orchestrator context ~10-15%, transition needs phase data in context). Pass `--auto` flag for propagation to next phase.

**Otherwise:** STOP. Present options (no `/gsd-transition` command — it is internal only). Check if next phase has CONTEXT.md. If not: suggest discuss-phase. If yes: suggest plan-phase.

Commands:
- `/gsd:progress` — see updated roadmap
- `/gsd:discuss-phase {next}` — discuss next phase (recommended if no CONTEXT.md)
- `/gsd:plan-phase {next}` — plan next (CONTEXT.md present)
- `/gsd:execute-phase {next}` — execute next (skip planning)
</step>

</process>

<context_efficiency>
Orchestrator: ~10-15% context for 200k windows, can use more for 1M+.
Subagents: fresh context each (200k-1M). No polling (Agent blocks). No context bleed.

For 1M+: pass richer context (code snippets, dependency outputs) directly to executors.
</context_efficiency>

<failure_handling>
- **Quota/rate-limit (#3095):** `gsd-sdk query agent.classify-failure` → `class: quota-exceeded`. Do not retry-now; wait-for-reset and resume.
- **classifyHandoffIfNeeded false:** Claude Code bug, not GSD. Spot-check → if pass, treat as success.
- **Agent fails mid-plan:** Missing SUMMARY.md → report, ask user how to proceed.
- **Dependency chain breaks:** Wave 1 fails → Wave 2 dependents likely fail → offer attempt or skip.
- **All agents in wave fail:** Systemic issue → stop, report.
- **Checkpoint unresolvable:** Ask skip / abort → record partial progress in STATE.md.
</failure_handling>

<resumption>
Re-run `/gsd:execute-phase {phase}` → discovery finds completed SUMMARYs → skips them → resumes from first incomplete. STATE.md tracks: last completed plan, current wave, pending checkpoints.
</resumption>
