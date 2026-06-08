---
phase: quick
plan: 260608-njm
type: execute
wave: 1
depends_on: []
files_modified:
  - get-shit-done/workflows/execute-phase.md
autonomous: true
requirements: []
must_haves:
  truths:
    - "All 13 items from CONTEXT.md decisions list are restored in execute-phase.md"
    - "npm test passes after all edits"
    - "File line count increases from 761 toward the original 1722 proportionally to restored content"
  artifacts:
    - path: get-shit-done/workflows/execute-phase.md
      provides: "execute-phase workflow with all remaining fidelity losses restored"
  key_links:
    - from: execute-phase.md
      to: original (57a000b1)
      via: clean-rewrite restorations of 13 items
      pattern: "CLASS_JSON|IS_BEHAVIOR_ADDING|CURRENT_PLAN_ID|REVIEW_FILE|CODEX RUNTIME"
---

<objective>
Restore the 13 remaining essential fidelity losses in `get-shit-done/workflows/execute-phase.md`
that were not covered by the prior quick task (260608-msc). HEAD is at 761 lines; the pre-compression
original (57a000b1) was 1722 lines.

Purpose: Executors following HEAD miss behavior-critical instructions — missing bash code blocks,
absent step 12b, stripped safety context, and incomplete parse field lists.

Output: `get-shit-done/workflows/execute-phase.md` with all 13 items restored as clean rewrites
(intent preserved, not verbatim copy). Three atomic commits grouped by document section.
</objective>

<execution_context>
<required_reading>
Read STATE.md before any operation.
Read `get-shit-done/workflows/execute-phase.md` (HEAD) before editing.
Read `/tmp/execute-phase-original.md` for the original content to rewrite from.
Do NOT copy verbatim — write restored content fresh to match the original's intent. Some items
restored by 260608-msc may already be present; verify before editing to avoid duplication.
</required_reading>
</execution_context>

<context>
!`cat .planning/STATE.md`
</context>

<tasks>

<task type="auto">
  <name>Task 1: Restore initialize step — parse fields, error hint, safe_resume_gate bash, MVP+TDD bash block; restore parse_args --wave note</name>
  <files>get-shit-done/workflows/execute-phase.md</files>
  <action>
Make four targeted edits to the `initialize` step and one edit to `parse_args`:

**Edit A — parse_args: restore --wave absent note.**
After the `--no-cross-ai` bullet in `parse_args`, add:

```
If `--wave` is absent, preserve the current behavior of executing all incomplete waves in the phase.
```

**Edit B — initialize: expand JSON parse field list.**
HEAD line currently reads:
`Parse JSON for: \`executor_model\`, \`executor_effort\`, \`verifier_model\`, \`verifier_effort\`, \`parallelization\`, \`phase_found\`, \`phase_dir\`, \`phase_number\`, \`phase_name\`, \`plans\`, \`incomplete_plans\`, \`state_exists\`.`

Replace with the full list from the original:
`Parse JSON for: \`executor_model\`, \`executor_effort\`, \`verifier_model\`, \`verifier_effort\`, \`commit_docs\`, \`parallelization\`, \`branching_strategy\`, \`branch_name\`, \`phase_found\`, \`phase_dir\`, \`phase_number\`, \`phase_name\`, \`phase_slug\`, \`plans\`, \`incomplete_plans\`, \`plan_count\`, \`incomplete_count\`, \`state_exists\`, \`roadmap_exists\`, \`phase_req_ids\`, \`response_language\`.`

**Edit C — initialize: restore npx reinstall hint in gsd-sdk not found error.**
HEAD currently has:
```bash
  echo "ERROR: gsd-sdk not found" >&2; exit 1
```
Replace with two-line error from original:
```bash
  echo "ERROR: gsd-sdk not found on PATH and $GSD_TOOLS does not exist." >&2
  echo "Run: npx -y @opengsd/get-shit-done-redux@latest --claude --local" >&2
  exit 1
```

**Edit D — initialize: replace safe_resume_gate one-liner with bash block.**
HEAD currently has a one-liner:
`**Safe resume gate:** Derive \`CURRENT_PLAN_ID\` from active incomplete plan, search recent git history. If production commits exist but SUMMARY.md missing, stop and offer recovery (close manually / re-execute / mark-and-skip).`

Replace with the `<step name="safe_resume_gate">` bash block from the original (lines 164–178 of /tmp/execute-phase-original.md). Use clean rewrite: preserve the `CURRENT_PLAN_ID`/`SUMMARY_PATH`/`PLAN_COMMITS` bash block and the three recovery options (close out manually / re-execute from scratch / mark-and-skip).

**Edit E — initialize: replace MVP+TDD gate one-liner with bash block.**
HEAD currently has a one-liner:
`**MVP+TDD gate** runs inside plan execution before implementation steps — same predicate and RED-commit contract.`

Replace with the full bash block from the original (lines 180–195 of /tmp/execute-phase-original.md). Preserve: the `if [ "$MVP_MODE" = "true" ] && [ "$TDD_MODE" = "true" ]` guard, the `IS_BEHAVIOR_ADDING` check, the `RED_COMMIT` git log grep, the gate trip logic with `state.update`/`exit 1`, and the final note about pure doc/config/test tasks being exempt.
  </action>
  <verify>
    <automated>
grep -n "npx -y @opengsd/get-shit-done-redux" get-shit-done/workflows/execute-phase.md | head -3
grep -n "commit_docs\|phase_slug\|roadmap_exists" get-shit-done/workflows/execute-phase.md | head -5
grep -n "CURRENT_PLAN_ID\|SUMMARY_PATH\|close out manually" get-shit-done/workflows/execute-phase.md | head -5
grep -n "IS_BEHAVIOR_ADDING\|is-behavior-adding\|RED_COMMIT" get-shit-done/workflows/execute-phase.md | head -5
grep -n "wave.*absent\|executing all incomplete waves" get-shit-done/workflows/execute-phase.md | head -3
    </automated>
  </verify>
  <done>
- All five greps above return at least 1 match.
- `npm test` passes (run after all tasks complete, not per-task).
  </done>
</task>

<task type="auto">
  <name>Task 2: Restore execute_waves step — FIRST ACTION heartbeat emphasis, CODEX RUNTIME rule, step 12b pre-wave dependency check, CLASS_JSON bash block</name>
  <files>get-shit-done/workflows/execute-phase.md</files>
  <action>
Make four targeted edits inside the `execute_waves` step:

**Edit A — wave-start step 2: restore FIRST ACTION / DO NOT SKIP heartbeat emphasis.**
In `execute_waves` step 2 (currently labeled "2. **Emit wave-start heartbeat:**"), restore the
"FIRST ACTION / DO NOT SKIP" preamble from the original. The original reads:

```
**First, emit the wave-start checkpoint heartbeat as a literal assistant-text
line — no tool call (#2410). Do NOT skip this even for single-plan waves; it
is required before any further reasoning or spawning:**
```

This text appears immediately before the heartbeat code block in step 2. Add it as a bolded
paragraph before the `[checkpoint] phase...` line.

**Edit B — executor prompt: restore CODEX RUNTIME rule.**
In the worktree-mode executor Agent() prompt, after the closing `</parallel_execution>` block
and before `<execution_context>`, insert the ORCHESTRATOR RULE from the original (line 662):

```
   > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above to spawn executor agent(s), stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
```

**Edit C — step 12b: restore pre-wave dependency check (entirely absent).**
Between step 12 (wave-close heartbeat) and step 13 (checkpoint plans), insert step 12b. Use
clean rewrite from original (lines 956–962):

```
12b. **Pre-wave dependency check (waves 2+ only):**
    Before wave N+1, run `gsd-sdk query verify.key-links {phase_dir}/{plan}-PLAN.md` for each upcoming plan.
    If any PRIOR-wave artifact link fails, present:
    - `## Cross-Plan Wiring Gap` with plan/link/from/pattern rows
    - Options: investigate+fix before continue, or continue with cascade risk
    Skip key-links that reference files in the CURRENT (upcoming) wave.
```

**Edit D — step 14: restore CLASS_JSON bash block for failure classification.**
HEAD step 14 currently reads (compressed form):
```
14. **Handle failures:** Classify via `$GSD_SDK query agent.classify-failure`. Route by class:
   - quota-exceeded — run step spot-check first; ...
   - classifyHandoffIfNeeded (spot-check, pass=success)
   - unknown (ask Continue/Stop)
```

Replace with the full CLASS_JSON bash block from the original (lines 931–954), as a clean rewrite:
```
12. **Handle failures:**
   **Step 7 — classify before branching (#3095):**
   ```bash
   CLASS_JSON=$($GSD_SDK query agent.classify-failure -- "$AGENT_RETURN_BODY")
   CLASS=$(echo "$CLASS_JSON" | jq -r '.class')
   SENTINEL=$(echo "$CLASS_JSON" | jq -r '.sentinel // empty')
   RETRY_AFTER=$(echo "$CLASS_JSON" | jq -r '.retryAfterSeconds // empty')
   if [ -n "$RETRY_AFTER" ]; then RETRY_HINT="  Provider hinted retry-after: ${RETRY_AFTER}s"; else RETRY_HINT=""; fi
   ```
   One classifier branch handles sentinels across Claude/Copilot/Codex/Gemini. Reference: `docs/research/provider-rate-limit-signals.md`.
   **Step 8 — `class == "quota-exceeded"`:**
   Do not offer "retry now". Run step-5 spot-check first; if SUMMARY.md is missing but commits exist, route to safe-resume (`state.verify-against-disk`) instead of immediate redispatch.
   ...
   **Step 9 — `class == "classify-handoff-bug"`:**
   If error contains `classifyHandoffIfNeeded is not defined`, treat as Claude runtime bug. Run the same step-5 spot-checks; PASS => treat as success, FAIL => fall through.
   **Step 10 — `class == "unknown-failure"`:**
   Report failed plan and ask Continue/Stop; continuing may cascade into dependent plan failures.
```

Keep the existing quota-exceeded offer text (wait-for-reset / switch-runtime / abort) — just wrap it in the CLASS_JSON structure.
  </action>
  <verify>
    <automated>
grep -n "FIRST ACTION\|DO NOT SKIP\|required before any further reasoning" get-shit-done/workflows/execute-phase.md | head -5
grep -n "CODEX RUNTIME\|After calling Agent.*stop working" get-shit-done/workflows/execute-phase.md | head -5
grep -n "12b\|pre-wave dependency\|verify.key-links\|Cross-Plan Wiring" get-shit-done/workflows/execute-phase.md | head -5
grep -n "CLASS_JSON\|RETRY_AFTER\|classify-handoff-bug\|provider-rate-limit-signals" get-shit-done/workflows/execute-phase.md | head -5
    </automated>
  </verify>
  <done>
All four greps above return at least 1 match each. No syntax errors introduced (file is still valid Markdown).
  </done>
</task>

<task type="auto">
  <name>Task 3: Restore handle_branching uncommitted-changes warning, regression_gate test-command resolution, code_review_gate detection block, offer_next GSD_WS + "do not invent commands"</name>
  <files>get-shit-done/workflows/execute-phase.md</files>
  <action>
Make four targeted edits:

**Edit A — handle_branching: restore uncommitted changes warning.**
In the `handle_branching` bash block, after the `git fetch` block and before the `git checkout -b`
line, add the uncommitted changes check from the original (lines 290–294):

```bash
  if [ -n "$(git status --porcelain)" ]; then
    echo "WARNING: Uncommitted changes will be carried onto '$BRANCH_NAME' (branched off origin/$DEFAULT_BRANCH, not previous HEAD)."
  else
    git switch --quiet "$DEFAULT_BRANCH" 2>/dev/null && git merge --ff-only --quiet "origin/$DEFAULT_BRANCH" 2>/dev/null || true
  fi
```

Replace the current unconditional:
```bash
  git switch --quiet "$DEFAULT_BRANCH" 2>/dev/null && git merge --ff-only --quiet "origin/$DEFAULT_BRANCH" 2>/dev/null || true
```
with the conditional version above.

**Edit B — regression_gate: restore full test command resolution bash block.**
HEAD `regression_gate` step currently reads (one-liner):
`Discover prior phases' test files from VERIFICATION.md and prior SUMMARY.md. Resolve test command (config > Makefile > language sniff). Run prior tests. Report results. If fail, offer Fix / Continue anyway / Abort.`

Expand to include the full bash block from the original (lines 1244–1291). Use clean rewrite:
- Step 1: `find .planning/phases/` for VERIFICATION.md files
- Step 2: Extract `REGRESSION_FILES` from prior verifications
- Step 3: Resolve `REG_TEST_CMD` via `config-get workflow.test_command` → Makefile → Justfile → package.json → Cargo.toml → go.mod → pyproject.toml → `true` fallback; run `eval "$REG_TEST_CMD"`
- Step 4: Report pass (`✓ Regression gate: {N} prior-phase test files passed`) or present `## ⚠ Cross-Phase Regression Detected` table with Fix / Continue / Abort options

**Edit C — code_review_gate: restore PADDED/REVIEW_FILE/REVIEW_STATUS detection block + --fix suggestion.**
After the `Skill(skill="gsd-code-review", args="${PHASE_NUMBER}")` line in `code_review_gate`,
add the result-checking block from the original (lines 1151–1165):

```bash
PADDED=$(printf "%02d" "${PHASE_NUMBER}")
REVIEW_FILE="${PHASE_DIR}/${PADDED}-REVIEW.md"
REVIEW_STATUS=$(sed -n '/^---$/,/^---$/p' "$REVIEW_FILE" | grep "^status:" | head -1 | cut -d: -f2 | tr -d ' ')
```

If REVIEW_STATUS is not "clean" and not "skipped" and not empty, display:
```
Code review found issues. Consider running:
/gsd:code-review ${PHASE_NUMBER} --fix
```

Also add: "**Error handling:** If the Skill invocation fails or throws, catch the error, display `Code review encountered an error (non-blocking): {error}` and proceed to next step. Review failures must never block execution."

**Edit D — offer_next: restore ${GSD_WS} workspace suffix + "Do not invent commands" guard.**
In the `offer_next` step, update the two suggested command blocks to include `${GSD_WS}` after
each command (matching the original). For both the "CONTEXT.md does NOT exist" and "CONTEXT.md
exists" variants, append `${GSD_WS}` to every `/gsd:*` command in the list.

Also add this sentence at the end of the step, before `</step>`:
`Only suggest the commands listed above. Do not invent or hallucinate command names.`

Run `npm test` after all edits and verify it passes.
  </action>
  <verify>
    <automated>
grep -n "git status --porcelain\|Uncommitted changes will be carried" get-shit-done/workflows/execute-phase.md | head -3
grep -n "REG_TEST_CMD\|make test\|cargo test\|language sniff\|go test" get-shit-done/workflows/execute-phase.md | head -5
grep -n "PADDED\|REVIEW_FILE\|REVIEW_STATUS\|code-review.*--fix" get-shit-done/workflows/execute-phase.md | head -5
grep -n "GSD_WS\|Do not invent\|hallucinate command" get-shit-done/workflows/execute-phase.md | head -5
    </automated>
  </verify>
  <done>
- All four greps above return at least 1 match each.
- `npm test` passes (exit code 0).
- Three atomic commits created (one per task), each with message format `fix(quick-260608-njm): restore {description}`.
  </done>
</task>

</tasks>

<threat_model>
No external services, user input, or trust boundaries. File-editing task only.
</threat_model>

<verification>
After all three tasks complete:
1. `grep -c "CLASS_JSON\|IS_BEHAVIOR_ADDING\|CURRENT_PLAN_ID\|REVIEW_FILE\|CODEX RUNTIME\|REG_TEST_CMD\|GSD_WS\|12b" get-shit-done/workflows/execute-phase.md` — each pattern should return ≥ 1.
2. `npm test` passes with exit code 0.
3. `wc -l get-shit-done/workflows/execute-phase.md` — line count should be appreciably higher than 761 (closer to 900+).
</verification>

<success_criteria>
All 13 items from CONTEXT.md decisions list restored in execute-phase.md as clean rewrites.
`npm test` passes. Three atomic commits committed to the dev branch.
</success_criteria>

<output>
This is a quick task — no SUMMARY.md is strictly required, but the executor should report completion
with the commit hashes and grep verifications inline.
</output>
