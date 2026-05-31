---
phase: 49-survey-and-normalization
reviewed: 2026-05-31T00:00:00Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - agents/gsd-intel-updater.md
  - agents/gsd-phase-researcher.md
  - agents/gsd-verifier.md
  - commands/gsd/graphify.md
  - get-shit-done/workflows/autonomous.md
  - get-shit-done/workflows/discuss-phase-assumptions.md
  - get-shit-done/workflows/execute-phase.md
  - get-shit-done/workflows/execute-phase/steps/post-merge-gate.md
  - get-shit-done/workflows/execute-plan.md
  - get-shit-done/workflows/plan-review-convergence.md
  - get-shit-done/workflows/profile-user.md
  - get-shit-done/workflows/progress.md
  - get-shit-done/workflows/quick.md
  - get-shit-done/workflows/reapply-patches.md
  - tests/agent-frontmatter.test.cjs
  - tests/bug-2410-stream-checkpoint-heartbeats.test.cjs
  - tests/bug-2432-quick-plan-predispatch-commit.test.cjs
  - tests/bug-2523-quick-deferred-items.test.cjs
  - tests/bug-3657-verify-reapply-patches-pristine-drift.test.cjs
  - tests/execute-phase-step-7-deviation-doc.test.cjs
  - tests/quick-branching.test.cjs
  - tests/verification-overrides.test.cjs
findings:
  critical: 3
  warning: 12
  info: 4
  total: 19
status: issues_found
---

# Phase 49: Code Review Report

**Reviewed:** 2026-05-31T00:00:00Z
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Summary

Review covers agents (3), commands (1), workflows (9), and tests (9) from the Phase 49 normalization batch. The files span the full GSD four-layer architecture. Three critical issues were found: a shell injection in the regression gate of the main execution workflow, a malformed grep regex in the verifier agent that inverts match logic, and conflicting MCP tool names in the researcher agent that will cause silent failures. Twelve warnings cover portability violations, destructive operations, uninitialized variables, hardcoded paths, scoping issues, and test gaps. Four info items cover naming, fragile parsing, and skipped test suites.

---

## Critical Issues

### CR-01: Shell Injection via `eval` in execute-phase.md Regression Gate

**File:** `get-shit-done/workflows/execute-phase.md` (regression_gate step)
**Issue:** The regression gate executes the test command with `eval "$REG_TEST_CMD" 2>&1` where `REG_TEST_CMD` is sourced directly from user-controlled config (`workflow.test_command`). Any project whose `.planning/config.json` sets `workflow.test_command` to a value like `true; rm -rf /important/dir` will have that command executed without sanitization. The `eval` is unnecessary here — the command string can be executed directly via `bash -c "$REG_TEST_CMD"` which still has injection risk, but `eval` additionally processes shell substitutions a second time, enabling double-expansion attacks.

**Fix:** Replace `eval` with `bash -c`:
```bash
# Before (vulnerable):
eval "$REG_TEST_CMD" 2>&1

# After (removes double-expansion vector; still validate config input upstream):
timeout 300 bash -c "$REG_TEST_CMD" 2>&1
```
Additionally, the config-loading layer should validate `workflow.test_command` against a whitelist or reject values containing shell metacharacters (`; & | > < $( \`` etc.) before they reach the execution layer. The `post-merge-gate.md` uses `bash -c "$BUILD_CMD"` and `bash -c "$TEST_CMD"` (without `eval`) — this file should follow the same pattern.

---

### CR-02: Malformed Grep Regex Inverts Verification Logic in gsd-verifier.md

**File:** `agents/gsd-verifier.md` (phase completion check)
**Issue:** The grep pattern `grep -E "^| $PHASE_NUM"` is malformed. The `|` operator in ERE creates an alternation: `^` (start of any line) OR ` $PHASE_NUM` (space + phase number). The left branch `^` matches the start of every line in the file, so this grep will always match every line — it effectively becomes a no-op check that can never fail. The intended pattern was almost certainly `grep -E "^\| $PHASE_NUM"` to match Markdown table rows beginning with a pipe character.

**Fix:**
```bash
# Before (matches every line — check always passes):
grep -E "^| $PHASE_NUM"

# After (matches Markdown table rows with the phase number):
grep -E "^\| $PHASE_NUM"
```
This bug means phase completion status is never actually verified against the expected phase number — the verifier will pass even when the target phase is absent from the state table.

---

### CR-03: Conflicting MCP Tool Names in gsd-phase-researcher.md

**File:** `agents/gsd-phase-researcher.md`
**Issue:** Two sections reference different names for the same MCP tool. The `tool_strategy` section specifies `mcp__context7__query-docs` while the `documentation_lookup` section specifies `mcp__context7__get-library-docs`. Only one of these names is correct; the other will produce a tool-not-found error at runtime. Because the failure is silent (the agent will simply skip the tool call or receive an error it may not surface), one documentation lookup path will silently produce no results, degrading research quality without any visible error.

**Fix:** Audit which tool name is correct by checking the Context7 MCP tool manifest, then replace the incorrect name uniformly throughout the file:
```markdown
# Pick one — check Context7 MCP manifest for the correct registered name:
# Option A (if query-docs is correct):
mcp__context7__query-docs

# Option B (if get-library-docs is correct):
mcp__context7__get-library-docs
```
Both occurrences in the file must use the same name.

---

## Warnings

### WR-01: Cross-Platform Claim Violated by Bash-Specific Syntax in gsd-intel-updater.md

**File:** `agents/gsd-intel-updater.md` (Project Scope section, lines 64-70)
**Issue:** The agent's role states "Cross-platform. Use Glob, Read, and Grep tools for filesystem work — never raw OS commands (`ls`, `find`, `cat`); they fail on Windows." However, the layout detection block immediately below this rule uses `ls -d .kilo`, `ls -d .claude/get-shit-done`, and `[[ ... ]]` Bash-specific compound syntax — all three violate the cross-platform rule on Windows. The `ls -d` calls will fail silently with `ENOENT` behavior on Windows PowerShell. The `[[ ... ]]` construct is not available in POSIX sh or PowerShell.

**Fix:** Replace the detection block with `Glob` tool calls:
```bash
# Replace the bash detection block with Glob tool calls:
# Check for .kilo directory:  Glob(".kilo")
# Check for .claude/get-shit-done: Glob(".claude/get-shit-done")
# Use Read tool on package.json instead of jq shell invocation
```

---

### WR-02: Destructive System Package Installation in gsd-phase-researcher.md

**File:** `agents/gsd-phase-researcher.md` (dependency check block)
**Issue:** The agent runs `pip install slopcheck --break-system-packages` to install a code quality tool. The `--break-system-packages` flag bypasses pip's safety check that prevents modifying system Python packages. On macOS with Homebrew-managed Python and on Linux distributions where Python is used by the OS package manager, this can overwrite system-managed packages and leave the Python installation in a broken state. This is a destructive operation that should never be automated without explicit user consent.

**Fix:** Replace with a non-destructive alternative:
```bash
# Use uvx for ephemeral execution (no install, no system modification):
uvx slopcheck <target>

# Or check for existing installation before attempting install:
if ! command -v slopcheck >/dev/null 2>&1; then
  echo "slopcheck not available. Install with: pip install slopcheck"
  echo "Skipping slopcheck analysis."
fi
```

---

### WR-03: WAVE_FAILURE_COUNT Not Initialized in post-merge-gate.md

**File:** `get-shit-done/workflows/execute-phase/steps/post-merge-gate.md` (lines 51, 106)
**Issue:** The step increments `WAVE_FAILURE_COUNT=$((WAVE_FAILURE_COUNT + 1))` in both the build gate and test gate failure paths, but never initializes the variable. The step file is included/sourced by `execute-phase.md` which must set this variable before the step executes. If `execute-phase.md` does not initialize `WAVE_FAILURE_COUNT=0` before including this step (or if the step is called in a context where the parent variable is not set), the arithmetic expansion `$((WAVE_FAILURE_COUNT + 1))` will expand to `1` from empty string — bash arithmetic treats unset as 0, so this won't error, but it means the counter is silently reset on the first failure instead of accumulated. More critically, the `WAVE_FAILURE_COUNT` check in subsequent step logic relies on cumulative accuracy.

**Fix:** Add an explicit initialization guard at the top of the step file:
```bash
# At top of post-merge-gate.md:
WAVE_FAILURE_COUNT=${WAVE_FAILURE_COUNT:-0}
```

---

### WR-04: Profile Backup Hardcodes Non-Portable Path in profile-user.md

**File:** `get-shit-done/workflows/profile-user.md` (step 1, lines 49-51)
**Issue:** The backup command hardcodes the destination as `$HOME/.claude/USER-PROFILE.backup.md`:
```bash
cp "$HOME/.claude/get-shit-done/USER-PROFILE.md" "$HOME/.claude/USER-PROFILE.backup.md"
```
The source uses `$HOME/.claude/get-shit-done/` (correct) but the destination drops into `$HOME/.claude/` (wrong path on non-Claude runtimes). On OpenCode, the profile lives under `$HOME/.config/opencode/get-shit-done/` — the backup would be written to the wrong directory. Additionally, the backup step 10 cleanup reads `BACKUP_PATH="$HOME/.claude/USER-PROFILE.backup.md"` — this hardcoded path means the diff comparison in the refresh path also breaks on non-Claude runtimes.

**Fix:** Use the runtime-resolved profile directory:
```bash
PROFILE_DIR=$(dirname "$PROFILE_PATH")
cp "$PROFILE_PATH" "$PROFILE_DIR/USER-PROFILE.backup.md"
BACKUP_PATH="$PROFILE_DIR/USER-PROFILE.backup.md"
```

---

### WR-05: Hardcoded Path Bypasses Runtime Detection in plan-review-convergence.md

**File:** `get-shit-done/workflows/plan-review-convergence.md` (Step 3)
**Issue:** Step 3 calls `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs"` with a hardcoded path, bypassing the standard SDK resolution pattern used in all other workflows (check for local `gsd-tools.cjs`, fall back to `gsd-sdk`). On OpenCode (installs to `$HOME/.config/opencode/`), Gemini CLI (installs to `$HOME/.gemini/`), or any non-standard install path, this hardcoded path will fail at runtime with "file not found".

**Fix:** Apply the standard SDK resolution pattern used in other workflows:
```bash
GSD_TOOLS="${RUNTIME_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}/get-shit-done/bin/gsd-tools.cjs"
if [ -f "$GSD_TOOLS" ]; then
  GSD_SDK="node $GSD_TOOLS"
elif command -v gsd-sdk >/dev/null 2>&1; then
  GSD_SDK="gsd-sdk"
else
  echo "ERROR: gsd-sdk not found" >&2; exit 1
fi
# Then use: $GSD_SDK <subcommand>
```

---

### WR-06: PLAN_COUNT Scoping Issue in plan-review-convergence.md

**File:** `get-shit-done/workflows/plan-review-convergence.md` (convergence completion step)
**Issue:** The convergence completion message references `$PLAN_COUNT` to display how many plans were finalized. However, `PLAN_COUNT` is only set in the code path that runs initial plan creation. When `has_plans=true` (existing plans detected at startup, planning is skipped), the variable is never set. The convergence path is reachable from both branches, so the completion message will display an empty or undefined count for the skip-planning branch.

**Fix:** Initialize `PLAN_COUNT` before the branch:
```bash
PLAN_COUNT=0
# ... then set in the planning branch:
if [ "$HAS_PLANS" != "true" ]; then
  # ... generate plans ...
  PLAN_COUNT=$(...)
fi
```
Or use a fallback in the completion message: `${PLAN_COUNT:-unknown}`.

---

### WR-07: Progress Bar Shows Phase Number as Denominator in autonomous.md

**File:** `get-shit-done/workflows/autonomous.md` (progress display)
**Issue:** The progress bar is calculated as `N/T` where `N` is the current phase number and `T` is the total count of milestone phases. Because phase numbers are sequential integers (e.g., phase 63 in a milestone with 7 phases), this produces misleading output like "Phase 63/7" — the numerator exceeds the denominator, breaking any percentage calculation and confusing the user.

**Fix:** Track position within the milestone's phase list (1-indexed ordinal), not the phase number:
```bash
# Instead of using phase number as N:
PHASE_ORDINAL=0
for PHASE in "${MILESTONE_PHASES[@]}"; do
  PHASE_ORDINAL=$((PHASE_ORDINAL + 1))
  # Display: "Phase $PHASE_ORDINAL/$TOTAL_PHASES (phase $PHASE_NUM)"
done
```

---

### WR-08: `describe.skip` Disables Entire Anti-Heredoc Test Suite

**File:** `tests/agent-frontmatter.test.cjs`
**Issue:** The entire `HDOC: anti-heredoc instruction` describe block is wrapped in `describe.skip(...)`. This means no test in that suite runs during `npm test`. The anti-heredoc rule (agents must not use `cat << 'EOF'` heredoc patterns) is completely unenforceable while this skip is in place. Any agent added or modified with heredoc patterns will pass the test suite without detection.

**Fix:** Remove the `.skip` modifier and fix the underlying reason the tests were skipped. Per the project memory file `project_skipped_tests.md`, this skip has a documented reason and re-enable condition — check that file for the prerequisite and address it:
```javascript
// Before:
describe.skip('HDOC: anti-heredoc instruction', () => {

// After (once prerequisite is met):
describe('HDOC: anti-heredoc instruction', () => {
```

---

### WR-09: FILE_WRITING_AGENTS Detection Regex Fragile Against Multi-Line YAML

**File:** `tests/agent-frontmatter.test.cjs`
**Issue:** The regex `/^tools:\s*(.+)$/m` used to detect file-writing agents reads the `tools:` value as a single-line string. YAML allows multi-line list syntax:
```yaml
tools:
  - Read
  - Write
  - Bash
```
In this form, the regex captures an empty string after `tools:`, causing `FILE_WRITING_AGENTS` to be incorrectly populated — the agent is not detected as a file-writer even though it has `Write` in its tools. The test would then silently skip the `Only use the Write tool` and `# hooks:` checks for that agent.

**Fix:** Parse multi-line YAML lists explicitly:
```javascript
// Handle both inline and block list forms:
const toolsInlineMatch = content.match(/^tools:\s*\[?(.+?)\]?\s*$/m);
const toolsBlockMatch = content.match(/^tools:\s*\n((?:\s+-\s+\S+\n?)+)/m);
const toolsStr = toolsInlineMatch?.[1] || (toolsBlockMatch ? toolsBlockMatch[1].replace(/\s+-\s+/g, ' ') : '');
const hasWrite = toolsStr.includes('Write');
```

---

### WR-10: Test Assertion Misrepresents Conditional Behavior for `--no-verify`

**File:** `tests/bug-2432-quick-plan-predispatch-commit.test.cjs`
**Issue:** The test asserts `assert.ok(step56Block.includes('--no-verify'), ...)` and the test description implies `--no-verify` is always included in the pre-dispatch commit. However, reading `quick.md` step 10, `--no-verify` is only appended when `SKIP_HOOKS=true`. The test passes only because `--no-verify` appears somewhere in the step block (inside the conditional branch), but the assertion's semantics are wrong — it does not verify that `--no-verify` is always used, it only confirms the string exists anywhere in the block.

**Fix:** Either update the test to correctly assert conditional presence:
```javascript
// Assert the conditional structure exists, not unconditional use:
assert.ok(
  step56Block.includes('if') && step56Block.includes('SKIP_HOOKS') && step56Block.includes('--no-verify'),
  'Step 10 should conditionally add --no-verify when SKIP_HOOKS=true'
);
```
Or if the intent is that `--no-verify` should always be used, update `quick.md` to remove the conditional and add `--no-verify` unconditionally, then fix the test description accordingly.

---

### WR-11: `QUICK_WORKTREE_MANIFEST` Falls Back to Wave Variable Incorrectly

**File:** `get-shit-done/workflows/quick.md` (cleanup step)
**Issue:** The cleanup step uses `QUICK_WORKTREE_MANIFEST=${QUICK_WORKTREE_MANIFEST:-$WAVE_WORKTREE_MANIFEST}`. Quick tasks do not use wave execution — `WAVE_WORKTREE_MANIFEST` is set by the wave orchestration path in `execute-phase.md`. If `QUICK_WORKTREE_MANIFEST` is unset and `WAVE_WORKTREE_MANIFEST` happens to be set in the outer shell environment (e.g., when quick is invoked from within a wave context), the cleanup will delete the wave's worktree manifest, not the quick task's. This would corrupt a running wave execution.

**Fix:** Remove the fallback entirely — if `QUICK_WORKTREE_MANIFEST` is unset, the quick workflow has no worktree to clean up:
```bash
# Before:
QUICK_WORKTREE_MANIFEST=${QUICK_WORKTREE_MANIFEST:-$WAVE_WORKTREE_MANIFEST}

# After:
# Only clean up if QUICK_WORKTREE_MANIFEST was actually set by this workflow:
if [ -n "${QUICK_WORKTREE_MANIFEST:-}" ]; then
  # cleanup logic
fi
```

---

### WR-12: Missing Error Handling for Git Blob Lookup in reapply-patches.md

**File:** `get-shit-done/workflows/reapply-patches.md` (baseline detection)
**Issue:** The workflow walks git history to find the pristine baseline using `git show <hash>:<path>`. If the blob referenced by a historical commit hash no longer exists (shallow clone, partial clone, git gc, or force-pushed history), `git show` will exit non-zero and the workflow will fail with a confusing error. There is no guard for shallow clones or missing blob errors before entering the history walk.

**Fix:** Add a shallow clone check and graceful degradation:
```bash
# Check for shallow clone before history walk:
if git rev-parse --is-shallow-repository 2>/dev/null | grep -q true; then
  echo "⚠ Shallow clone detected — cannot walk git history for baseline. Falling back to questionnaire."
  # route to fallback path
fi

# Wrap git show in error guard:
BLOB=$(git show "$HASH:$PATH" 2>/dev/null) || {
  echo "⚠ Blob $HASH:$PATH not found — skipping commit"
  continue
}
```

---

## Info

### IN-01: `extractStep25Bash` Function Misnamed in quick-branching.test.cjs

**File:** `tests/quick-branching.test.cjs`
**Issue:** The function `extractStep25Bash()` extracts the bash block for Step 3 (as shown by the regex and comment context), not Step 25. The naming mismatch will confuse future maintainers who look for step 25 handling or attempt to add actual step 25 tests.

**Fix:** Rename to match the step it actually extracts:
```javascript
// Before:
function extractStep25Bash(content) { ... }

// After:
function extractStep3Bash(content) { ... }
```

---

### IN-02: `grep -qi "UI hint.*yes"` Fragile String Match in progress.md

**File:** `get-shit-done/workflows/progress.md`
**Issue:** Routing logic uses `grep -qi "UI hint.*yes"` to detect whether a phase uses UI hints. If the format of the UI hint marker ever changes (different casing, extra whitespace, different separator), this grep will silently produce wrong routing — the phase will be treated as non-UI without any error.

**Fix:** Define the UI hint marker as a constant at the top of the workflow and reference it in the grep pattern, or use a structured YAML frontmatter field that can be reliably parsed:
```bash
UI_HINT_MARKER="UI hint: yes"
if grep -qi "$UI_HINT_MARKER" "$PHASE_FILE" 2>/dev/null; then
```

---

### IN-03: `discuss-phase-assumptions.md` Uses Raw `find` Against CLAUDE.md Convention

**File:** `get-shit-done/workflows/discuss-phase-assumptions.md`
**Issue:** Uses `find .planning/phases -name "*-CONTEXT.md"` (a raw OS command) to locate context files. CLAUDE.md instructs that Glob tool should be used for file discovery instead of raw OS commands, as `find` fails on Windows. This is inconsistent with other workflows that correctly use Glob.

**Fix:** Replace with a Glob tool call in the workflow step that reads context files:
```
# Replace: find .planning/phases -name "*-CONTEXT.md"
# With: Glob(".planning/phases/**/*-CONTEXT.md")
```

---

### IN-04: `graphify update .` Assumes Undocumented External CLI in graphify.md

**File:** `commands/gsd/graphify.md` (Step 6)
**Issue:** Step 6 calls `graphify update .` as if a `graphify` CLI binary is available on PATH. The command file does not document how this tool is installed, what package provides it, or what to do if it is absent. Users running this command without the tool installed will receive an opaque "command not found" error.

**Fix:** Add an installation check and documentation:
```bash
# At start of step 6:
if ! command -v graphify >/dev/null 2>&1; then
  echo "graphify CLI not found. Install with: npm install -g graphify-cli"
  echo "Or run: npx graphify update ."
  exit 1
fi
graphify update .
```
Also add the prerequisite to the command's help text or required_reading block.

---

_Reviewed: 2026-05-31T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
