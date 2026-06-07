<purpose>
Generate, update, and verify all project documentation. Detect doc structure, assemble work manifest, dispatch parallel doc-writer and doc-verifier agents, review existing docs, identify gaps, fix inaccuracies via bounded loop. All state persists in manifest. Output: Complete, structure-aware documentation verified against live codebase.
</purpose>

<available_agent_types>
- gsd-doc-writer — Writes and updates project documentation files
- gsd-doc-verifier — Verifies factual claims in docs against the live codebase
</available_agent_types>

<process>

<step name="init_context" priority="first">
Load docs-update context:

```bash
GSD_TOOLS="${RUNTIME_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}/get-shit-done/bin/gsd-tools.cjs"
if [ -f "$GSD_TOOLS" ]; then
  GSD_SDK="node $GSD_TOOLS"
elif command -v gsd-sdk >/dev/null 2>&1; then
  GSD_SDK="gsd-sdk"
else
  echo "ERROR: gsd-sdk not found on PATH and $GSD_TOOLS does not exist." >&2
  echo "Run: npx -y @opengsd/get-shit-done-redux@latest --claude --local" >&2
  exit 1
fi
INIT=$($GSD_SDK query docs-init)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
AGENT_SKILLS=$($GSD_SDK query agent-skills gsd-doc-writer)
doc_writer_model_effort_arg=$($GSD_SDK query resolve-model-effort gsd-doc-writer --raw 2>/dev/null || echo "")
```

Extract from init JSON: `doc_writer_model`, `commit_docs`, `existing_docs` (array of `{path, has_gsd_marker}`), `project_type` (boolean signals), `doc_tooling`, `monorepo_workspaces`, `project_root`.
</step>

<step name="classify_project">
Map `project_type` signals to primary type:

| Condition | primary_type |
|-----------|-------------|
| `is_monorepo` | `"monorepo"` |
| `has_cli_bin` AND NOT `has_api_routes` | `"cli-tool"` |
| `has_api_routes` AND NOT `is_open_source` | `"saas"` |
| `is_open_source` AND NOT `has_api_routes` | `"open-source-library"` |
| else | `"generic"` |

Check conditional signals independently:
- `has_api_routes` → Queue API.md
- `is_open_source` → Queue CONTRIBUTING.md
- `has_deploy_config` → Queue DEPLOYMENT.md

Display: `Project type: {primary_type}` and `Conditional docs queued: {list}`
</step>

<step name="build_doc_queue">
Always-on docs (every project):
1. README  2. ARCHITECTURE  3. GETTING-STARTED  4. DEVELOPMENT  5. TESTING  6. CONFIGURATION

Add conditional docs from classify_project. Max 9 docs total.

**Text mode (`workflow.text_mode: true` in config or `--text` flag):** Set `TEXT_MODE=true` if `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is `true`. When TEXT_MODE is active, replace every `AskUserQuestion` call in this workflow with a plain-text numbered list and ask the user to type their choice number. This is required for non-Claude runtimes (OpenAI Codex, Gemini CLI, etc.) where `AskUserQuestion` is unavailable.

**CONTRIBUTING.md confirmation (new file only):**
If CONTRIBUTING.md is conditional AND not in `existing_docs` AND `--force` is absent:

Use AskUserQuestion (or text mode if unavailable):
```
AskUserQuestion([{
  question: "Open source detected. Create CONTRIBUTING.md?",
  options: [
    { label: "Yes, create it" },
    { label: "No, skip it" }
  ]
}])
```
Remove from queue if user selects "No".

**Non-canonical existing docs:**
Scan `existing_docs` for files not matching canonical paths. Add to `review_queue` for accuracy verification.

**Documentation gap detection:**
Analyze codebase for undocumented areas (e.g., `src/components/`, `src/services/`). If gaps found:
```
AskUserQuestion([{
  question: "Found {N} documentation gaps. Which should be created?",
  multiSelect: true,
  options: [{label: "{area}", description: "{reason}"}, ...]
}])
```
Add selected gaps to generation queue with mode = `"create"`.

Present queued docs before proceeding:
```
AskUserQuestion([{
  question: "Doc queue assembled ({N} docs). Proceed?",
  options: [
    { label: "Proceed" },
    { label: "Abort" }
  ]
}])
```
Exit if user selects "Abort".
</step>

<step name="resolve_modes">
For each queued doc, determine create (new) or update (existing) mode.

**Doc type to canonical path mapping:**

| Type | Default Path | Fallback |
|------|-------------|----------|
| readme | README.md | — |
| architecture | docs/ARCHITECTURE.md | ARCHITECTURE.md |
| getting_started | docs/GETTING-STARTED.md | GETTING-STARTED.md |
| development | docs/DEVELOPMENT.md | DEVELOPMENT.md |
| testing | docs/TESTING.md | TESTING.md |
| api | docs/API.md | API.md |
| configuration | docs/CONFIGURATION.md | CONFIGURATION.md |
| deployment | docs/DEPLOYMENT.md | DEPLOYMENT.md |
| contributing | CONTRIBUTING.md | — |

**Structure-aware resolution:**
Detect if project uses grouped subdirectories (e.g., `docs/architecture/`, `docs/api/`) or flat structure.

If grouped: place docs in appropriate subdirectories per resolution table.
If flat: use default paths as-is.

For each queued doc:
1. Check resolved_path in `existing_docs`
2. If found: mode = `"update"`, read file content
3. If not found: mode = `"create"`

Create directories:
```bash
mkdir -p docs/
```

Output mode resolution table showing doc, resolved path, mode, and source.

**Persist work manifest:**
```bash
mkdir -p .planning/tmp
```

Write `.planning/tmp/docs-work-manifest.json`:
```json
{
  "canonical_queue": [
    {
      "type": "readme",
      "resolved_path": "README.md",
      "mode": "create|update|supplement",
      "wave": 1,
      "status": "pending"
    }
  ],
  "review_queue": [{path, type, status}],
  "gap_queue": [{description, output_path, status}],
  "created_at": "{ISO timestamp}"
}
```

Every subsequent step reads this manifest and updates `status`.
</step>

<step name="preservation_check">
Check skip conditions in order:
1. `--force` present → treat all queued docs as mode: regenerate, then continue to `dispatch_wave_1`.
2. `--verify-only` present → jump to `verify_only_report` and run no generation step (no dispatch, sequential_generation, commit, or report).
3. No queued doc has `has_gsd_marker: false` → skip the prompt and continue to `dispatch_wave_1`.

For each queued doc with `has_gsd_marker: false`:
```
AskUserQuestion([{
  question: "{filename} is hand-written. How should it be handled?",
  options: [
    { label: "preserve" },
    { label: "supplement" },
    { label: "regenerate" }
  ]
}])
```

Update queue:
- preserve: remove from queue
- supplement: set mode to `supplement`, include existing_content
- regenerate: set mode to `create`

After recording decisions, continue to `dispatch_wave_1`.

Fallback (no AskUserQuestion): default to `preserve`.
</step>

<step name="dispatch_wave_1" condition="Task tool available">
Read manifest, use items with `wave: 1`.

Spawn 3 parallel agents for README, ARCHITECTURE, CONFIGURATION:

```
Agent(
  subagent_type="gsd-doc-writer",
  model="{doc_writer_model}",
  effort={doc_writer_model_effort_arg}, # omit this line when doc_writer_model_effort_arg == null
  run_in_background=true,
  description="Generate {type}",
  prompt="<doc_assignment>
type: {type}
mode: {mode}
preservation_mode: {value|null}
project_context: {INIT JSON}
{existing_content: ... | (if update/supplement)}
</doc_assignment>

{AGENT_SKILLS}

Write file directly. Return confirmation only."
)
```

Spawn one agent per doc. For CONFIGURATION, add note: `Apply VERIFY markers to undiscoverable infrastructure claims.`

Do NOT generate docs independently while subagents run.

Continue to collect_wave_1.
</step>

<step name="collect_wave_1">
Read manifest, update status after collection.

Call TaskOutput for all 3 agents in parallel:
```
TaskOutput: {task_id}, block=true, timeout=300000
```

Verify files exist:
```bash
ls -la {resolved_path_1} {resolved_path_2} {resolved_path_3} 2>/dev/null
```

Note failures; continue regardless.

Continue to dispatch_wave_2.
</step>

<step name="dispatch_wave_2" condition="Task tool available">
Read manifest, use items with `wave: 2`.

Spawn agents for GETTING-STARTED, DEVELOPMENT, TESTING, and conditional docs (API, DEPLOYMENT, CONTRIBUTING) with `run_in_background=true`.

Each doc_assignment includes `wave_1_outputs: [README.md, docs/ARCHITECTURE.md, docs/CONFIGURATION.md]`.

For DEPLOYMENT, add: `Apply VERIFY markers to undiscoverable infrastructure claims.`

Do NOT generate docs independently while subagents run.

Continue to collect_wave_2.
</step>

<step name="collect_wave_2">
Read manifest, update status.

Call TaskOutput for all Wave 2 agents in parallel.

Verify files exist via bash.

Note failures; continue.

Continue to dispatch_monorepo_packages (if `monorepo_workspaces` non-empty) or commit_docs.
</step>

<step name="dispatch_monorepo_packages" condition="monorepo_workspaces non-empty">
Expand workspace globs:
```bash
for pattern in {monorepo_workspaces}; do
  ls -d $pattern 2>/dev/null
done
```

For each directory with `package.json`:
- If `{dir}/README.md` exists: mode = `update`
- Else: mode = `create`

Spawn agent with `run_in_background=true`:
```
Agent(
  subagent_type="gsd-doc-writer",
  model="{doc_writer_model}",
  effort={doc_writer_model_effort_arg}, # omit this line when doc_writer_model_effort_arg == null
  run_in_background=true,
  description="Generate per-package README for {package_dir}",
  prompt="<doc_assignment>
type: readme
mode: {create|update}
scope: per_package
package_dir: {absolute path}
project_context: {INIT JSON, project_root={package_dir}}
{existing_content: ... | (if update)}
</doc_assignment>

{AGENT_SKILLS}

Write {package_dir}/README.md directly. Return confirmation only."
)
```

Collect via TaskOutput. Note failures.

Continue to commit_docs.
</step>

<step name="sequential_generation" condition="Task tool NOT available">
Read manifest. Generate docs sequentially using file system tools only. Do NOT use browser tools.

Read `agents/gsd-doc-writer.md` once before beginning.

**Wave 1:** README, ARCHITECTURE, CONFIGURATION (in order)
For each, construct doc_assignment, explore codebase, write file.

**Wave 2:** GETTING-STARTED, DEVELOPMENT, TESTING, API (if queued), DEPLOYMENT (if queued), CONTRIBUTING (if queued)
Include `wave_1_outputs` field.

**Per-package READMEs** (if `monorepo_workspaces` non-empty):
After root-level docs, generate per-package READMEs sequentially.

Continue to verify_docs.
</step>

<step name="verify_docs">
Read manifest. Extract `canonical_queue` (completed) and `review_queue` (hand-written). Both verified.

Skip if `--verify-only` already handled this (early exit).

**Phase 1: Verify canonical docs**
For each successful doc:
```xml
<verify_assignment>
doc_path: {relative path}
project_root: {from init JSON}
</verify_assignment>
```

Read result from `.planning/tmp/verify-{filename}.json`.
Update manifest: `status: "verified"`.

**Phase 2: Verify non-canonical docs**
Verify all review_queue docs (not optional).

Non-canonical docs with failures eligible for fix_loop via `fix` mode.

**Phase 3: Summary**
Present combined verification table (canonical + non-canonical):

```
Verification results:

Canonical docs:
| Doc | Claims | Passed | Failed |
|-----|--------|--------|--------|

Existing docs:
| Doc | Claims | Passed | Failed |
|-----|--------|--------|--------|

Total: {total_checked} claims, {total_failed} failures
```

If all pass: skip fix_loop, continue to scan_for_secrets.
If any fail: continue to fix_loop.
</step>

<step name="fix_loop">
Read manifest. Identify all docs (canonical + non-canonical) with `claims_failed > 0`.

Skip if none.

**Iteration tracking:** MAX_FIX_ITERATIONS = 2, iteration = 0, track previously-passed docs.

For each iteration (< MAX_FIX_ITERATIONS and failures exist):

1. For each doc with failures:
   Read current content from disk.
   Spawn agent with fix assignment:
   ```xml
   <doc_assignment>
   type: {original type}
   mode: fix
   doc_path: {relative path}
   project_context: {INIT JSON}
   existing_content: {current content}
   failures:
     - line: {line}
       claim: "{claim}"
       expected: "{expected}"
       actual: "{actual}"
   </doc_assignment>
   ```

2. Re-verify ALL docs (not just fixed ones).
   Read updated result JSONs.

3. **Regression detection:**
   If any previously-passed doc now has failures: HALT immediately.
   ```
   REGRESSION DETECTED — halting fix loop.
   {doc_path} previously passed but now has {count} failures.
   ```
   Continue to scan_for_secrets.

4. Update previously-passed set. Increment iteration.

**After loop exhaustion:**
Present remaining failures table. Continue to scan_for_secrets.
</step>

<step name="verify_only_report">
Reached when `--verify-only` present. Early exit — no dispatch, generation, commit, or report after this.

For each file in `existing_docs`:
```xml
<verify_assignment>
doc_path: {doc.path}
project_root: {project_root}
</verify_assignment>
```

Read result JSONs. Count VERIFY markers via grep for `<!-- VERIFY:`.

Present combined table:
```
--verify-only audit:

| File | Claims Checked | Passed | Failed | VERIFY Markers |
|------|----------------|--------|--------|----------------|

Total: {total_checked} claims, {total_failed} failures, {total_markers} VERIFY markers
```

Show failed claims details if any.

Clean up: remove `.planning/tmp/verify-*.json` files.

End workflow.
</step>

<step name="scan_for_secrets">
Build file list from generation queue (docs actually written).

Detect patterns:
```bash
grep -E '(sk-[a-zA-Z0-9]{20,}|sk_live_[a-zA-Z0-9]+|sk_test_[a-zA-Z0-9]+|ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|glpat-[a-zA-Z0-9_-]+|AKIA[A-Z0-9]{16}|xox[baprs]-[a-zA-Z0-9-]+|-----BEGIN.*PRIVATE KEY|eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.)' \
  {generated files} 2>/dev/null && SECRETS_FOUND=true || SECRETS_FOUND=false
```

If secrets found:
```
SECURITY ALERT: Potential secrets detected in generated documentation!

{show grep output}

AskUserQuestion([{
  question: "How should we proceed?",
  options: [
    { label: "Safe to proceed" },
    { label: "Abort commit" }
  ]
}])
```

If "Abort commit": skip commit_docs. If "Safe to proceed": continue to commit_docs.

If no secrets: continue to commit_docs.
</step>

<step name="commit_docs">
Only run if `commit_docs` is true.

Assemble list of successfully written files (exclude failures/skipped).

```bash
$GSD_SDK query commit "docs: generate project documentation" \
  --files {space-separated list of generated files}
```

Continue to report.
</step>

<step name="report">
Read manifest. Compile summary from canonical_queue, review_queue, gap_queue.

```
Documentation generation complete.

Project type: {primary_type}

Generated docs:
| File | Mode | Lines |
|------|------|-------|

{If per-package READMEs generated:}
Per-package READMEs:
| Package | Mode | Lines |
|---------|------|-------|

{If failures/skipped:}
Skipped / failed:
  - {file}: {reason}

{If preservation_check ran:}
Preservation decisions:
  - {file}: {decision}

{If DEPLOYMENT/CONFIGURATION generated:}
VERIFY markers: {N} placed for infrastructure claims requiring manual review.

{If review_queue non-empty:}
Existing doc accuracy review:
| Doc | Claims Checked | Passed | Failed | Fixed |
|-----|----------------|--------|--------|-------|

{If unfixed failures remain:}
Remaining inaccuracies require manual review.

{If commit_docs true:}
All generated files committed.
```

Remind: Run `/gsd:docs-update --verify-only` to fact-check generated docs.

End workflow.
</step>

</process>

<success_criteria>
- [ ] docs-init JSON loaded, all fields extracted
- [ ] Project type correctly classified from signals
- [ ] Doc queue contains always-on + conditional docs matching signals
- [ ] CHANGELOG.md NOT generated/queued
- [ ] Correct mode per doc (create/update)
- [ ] Wave 1 (README, ARCHITECTURE, CONFIGURATION) completed before Wave 2
- [ ] Generated docs contain zero GSD methodology content
- [ ] DEPLOYMENT/CONFIGURATION use VERIFY markers for undiscoverable claims
- [ ] Files committed if commit_docs true
- [ ] Hand-written docs prompted for preserve/supplement/regenerate (unless --force)
- [ ] --force skipped preservation, regenerated all
- [ ] --verify-only reported status without generating
- [ ] Per-package READMEs generated for monorepos
- [ ] verify_docs checked all generated docs against codebase
- [ ] fix_loop ran max 2 iterations, halted on regression
- [ ] scan_for_secrets ran before commit, blocked on detected patterns
- [ ] --verify-only invoked gsd-doc-verifier for fact-checking
</success_criteria>
