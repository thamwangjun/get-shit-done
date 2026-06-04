---
phase: quick-260604-qzi
plan: 260604-qzi
type: execute
wave: 1
depends_on: []
files_modified:
  - get-shit-done/workflows/quick.md
autonomous: true
requirements: [QZI-01]
must_haves:
  truths:
    - "The /gsd-quick process opens with an affirmative orchestrator-role boundary stating the orchestrator produces no source-file edits itself and routes all code changes through the spawned gsd-executor"
    - "The boundary names Edit/Write/NotebookEdit on a source file as the self-detection signal that the orchestrator has left the workflow and must re-enter via agent spawn"
    - "A precisely specified task is framed as a reason to spawn the executor with confidence, not a reason to skip orchestration"
    - "The tracking, atomic commits, and STATE.md record are framed as the deliverable independent of diff size, with /gsd-fast as the redirect for tasks too small to warrant /gsd-quick"
    - "npm test passes after the edit"
  artifacts:
    - path: get-shit-done/workflows/quick.md
      provides: "Hardened orchestrator-role boundary in the <process> section"
  key_links:
    - from: get-shit-done/workflows/quick.md
      to: bin/install.js convertClaudeCommandToClaudeSkill
      via: "command include renders the workflow into the installed SKILL.md"
---

<objective>
Harden the /gsd-quick orchestration instructions so an orchestrator cannot silently skip the spawned gsd-planner/gsd-executor and perform source edits inline.

Purpose: A precisely specified task previously let the orchestrator "just do the edit" inline, bypassing agent orchestration. Close that failure mode in the instruction text.
Output: An additive, affirmatively-framed orchestrator-role boundary block in `get-shit-done/workflows/quick.md`.
</objective>

<context>
**Source-of-truth confirmation (already verified during planning):**
- The installed skill at `~/.claude/skills/gsd-quick` is NOT the source. The in-repo source is `commands/gsd/quick.md`, which includes `get-shit-done/workflows/quick.md` (line 43: `<%~ include('get-shit-done/workflows/quick.md') %>`). `bin/install.js` `convertClaudeCommandToClaudeSkill` transforms the rendered command into the installed `SKILL.md`. No manual build step is required for the skill — the installer transform runs at install time.
- The orchestration `<process>` an orchestrator actually follows lives in `get-shit-done/workflows/quick.md`. The RUN subcommand in `commands/gsd/quick.md` is a thin pointer ("Execute end-to-end. Preserve all workflow gates..."). Therefore the hard gate belongs in the workflow's `<process>` — the spawn-executor step (Step 11) is the orchestration step being bypassed.

**Test/build constraints (verified during planning):**
- `tests/step-numbering-scan.test.cjs` scans `get-shit-done/workflows/quick.md` and FAILS on decimal step labels (`Step N.M`) and on out-of-order or gapped numbered-step sequences. The new block MUST be added as a non-numbered framing block placed BEFORE "Step 1" inside `<process>` so it does not introduce or perturb any numbered step. Do NOT renumber existing steps and do NOT add a "Step 0" or "Step N.M".
- `tests/command-contract.test.cjs`, `tests/commands.test.cjs`, and `tests/agent-frontmatter.test.cjs` validate command/workflow structure — the workflow has no frontmatter of its own, so additions to `<process>` prose are safe. No new agent is introduced.

@get-shit-done/workflows/quick.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add affirmative orchestrator-role boundary to quick workflow process</name>
  <files>get-shit-done/workflows/quick.md</files>
  <action>
In `get-shit-done/workflows/quick.md`, insert a new non-numbered framing block immediately after the `<process>` opening tag (line 29) and BEFORE the existing `**Step 1: Parse arguments and get task description**` (line 30). Do NOT renumber, remove, or reorder any existing `**Step N: ...**` heading — the block carries no step number, so the whole-integer step sequence (Step 1, 2, 3, ...) stays intact for `tests/step-numbering-scan.test.cjs`.

Write the block in the fork's positive-framing style (per CLAUDE.md): state what the orchestrator DOES, with the prohibition expressed only as the boundary line. Cover all three additive points:

1. Orchestrator-role hard gate (affirmative): State that the orchestrator's job in /gsd-quick is to spawn agents (gsd-planner, gsd-executor) and manage state, commits, and tracking — it produces no source-file edits of its own, and every code change flows through the spawned gsd-executor (Step 11). Then give the self-detection signal: if the orchestrator finds itself about to use Edit, Write, or NotebookEdit on a source file, that is the signal it has left the workflow; the correct response is to stop and re-enter by spawning the executor. (Editing `.planning/` artifacts — STATE.md, PLAN.md, SUMMARY.md, CONTEXT.md — is the orchestrator's own bookkeeping and remains in-scope; the boundary is about SOURCE-file edits.)

2. Well-specified-task framing (affirmative): State that a precisely specified task is a reason to spawn the executor with confidence — detailed specs make execution faster and lower-risk, not optional. The planner and executor still run; specification quality changes how smoothly orchestration proceeds, never whether it happens.

3. Overhead framing (affirmative): State that the tracking, atomic commits, and STATE.md "Quick Tasks Completed" record ARE the deliverable, independent of how small the diff is — orchestration cost is not weighed against task size. Then give the redirect: if a task genuinely feels too small to warrant /gsd-quick, the correct action is to point the user to /gsd-fast, not to perform /gsd-quick's work inline.

Keep the block self-contained and scoped to these three points. Make no other content changes to the file.
  </action>
  <verify>
    <automated>cd /Users/thamw/development/local/get-shit-done && node -e "const t=require('fs').readFileSync('get-shit-done/workflows/quick.md','utf8'); const proc=t.slice(t.indexOf('<process>'), t.indexOf('**Step 1:')); const checks={role:/spawn/i.test(proc)&&/(Edit|Write|NotebookEdit)/.test(proc)&&/gsd-executor/.test(proc), spec:/(precisely|well-specified|detailed spec)/i.test(proc)&&/confiden/i.test(proc), overhead:/(deliverable)/i.test(proc)&&/gsd-fast/.test(proc), beforeStep1:t.indexOf('<process>')<t.indexOf('**Step 1:')}; const fail=Object.entries(checks).filter(([k,v])=>!v).map(([k])=>k); if(fail.length){console.error('MISSING: '+fail.join(', '));process.exit(1);} console.log('All three additions present and before Step 1.');"</automated>
  </verify>
  <done>The `<process>` section of `get-shit-done/workflows/quick.md` contains, before Step 1, an affirmatively-framed block that (a) defines the orchestrator's spawn-and-manage role and names Edit/Write/NotebookEdit on a source file as the leave-the-workflow signal routed back through gsd-executor, (b) frames a well-specified task as a confidence reason to spawn rather than skip, and (c) frames tracking/commits/STATE.md as the deliverable regardless of diff size with /gsd-fast as the too-small redirect. The verify script passes.</done>
</task>

<task type="auto">
  <name>Task 2: Confirm step numbering intact and full test suite passes</name>
  <files>get-shit-done/workflows/quick.md</files>
  <action>
Run the targeted step-numbering scan and the full test suite to confirm the additive block did not perturb numbered steps or any structural invariant. If `step-numbering-scan` reports a decimal or out-of-order step for `quick.md`, the block was likely written as a numbered step — convert it to a non-numbered framing block (per Task 1). If `commands.test.cjs` / `command-contract.test.cjs` fail, re-check that only `<process>` prose was added. Do not modify tests; fix the workflow content to conform.
  </action>
  <verify>
    <automated>cd /Users/thamw/development/local/get-shit-done && node --test tests/step-numbering-scan.test.cjs tests/commands.test.cjs tests/command-contract.test.cjs 2>&1 | tail -20 && npm test 2>&1 | tail -15</automated>
  </verify>
  <done>`node --test tests/step-numbering-scan.test.cjs tests/commands.test.cjs tests/command-contract.test.cjs` passes and `npm test` reports no failures.</done>
</task>

</tasks>

<verification>
- `get-shit-done/workflows/quick.md` contains the three affirmatively-framed additions, all positioned before Step 1 inside `<process>` (Task 1 verify script).
- Whole-integer step numbering preserved — `tests/step-numbering-scan.test.cjs` still passes.
- Full `npm test` suite passes (no regressions in command/skill structure tests).
</verification>

<success_criteria>
- Orchestrator-role hard gate, well-specified-task framing, and overhead framing are all present in the workflow `<process>`, affirmatively phrased per the fork's positive-framing rule.
- No unrelated skill/workflow content changed; no existing steps renumbered.
- Test suite green.
</success_criteria>

<output>
Create `.planning/quick/260604-qzi-harden-gsd-quick-skill-against-orchestra/260604-qzi-SUMMARY.md` when done.
</output>
