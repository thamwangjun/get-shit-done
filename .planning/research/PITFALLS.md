# Pitfalls Research: Install-Time Template Substitution

**Domain:** Install-time reference inlining for Markdown prompt content files
**Researched:** 2026-05-28
**Confidence:** HIGH (based on direct code inspection of `bin/install.js` and reference/agent corpus)

---

## Critical Failure Modes

Ordered from most to least severe.

---

### 1. Conditional Includes That Require Runtime Values

**Risk:**
`execute-phase.md` contains exactly this pattern at line 619:

```
${CONTEXT_WINDOW < 200000 ? '' : '@~/.claude/get-shit-done/references/executor-examples.md'}
```

This is not a static `@~` reference — it is a JavaScript template expression that evaluates at agent-dispatch time based on the actual context window size. If the resolver treats everything that matches `@~` as inline-able, it will see only the inner `@~` path after some regexes fire, or it will fail to parse the surrounding JS expression, or it will inline unconditionally and strip the condition entirely. Any of those outcomes corrupts the behavior: either executor-examples.md is always inlined (inflating every agent context), or the entire expression is left as a raw string in the installed file (broken syntax in the context passed to the AI), or the conditional is silently dropped.

The same workflow also has a second conditional pattern at lines 623–630:
```
${CONTEXT_WINDOW >= 500000 ? `
- ${phase_dir}/*-CONTEXT.md
- ${phase_dir}/*-RESEARCH.md` : ''}
```

These are not include directives — they are inline JS that happens to live in the same multiline string as `@~` references.

**Prevention:**
The resolver must distinguish "bare `@~` on its own line" from "`@~` embedded inside a `${}` JavaScript template expression." The safe rule: only expand `@~` references that appear alone on a line, with no surrounding `${`, `` ` ``, `?`, or `:` characters on that line. Any `@~` occurrence inside a JS template literal must be treated as opaque — left in place verbatim.

**Which phase should address it:** Phase that implements the resolver. Must be in the detection logic before a single line of inlining code is written.

---

### 2. Circular Reference Chain

**Risk:**
`get-shit-done/references/model-profile-resolution.md` includes `model-profiles.md`. If `model-profiles.md` later gains a back-reference to `model-profile-resolution.md`, or if any future reference file includes a sibling that includes it back, the naive recursive resolver enters an infinite loop and hangs or stack-overflows the Node.js installer process. This is a particularly dangerous failure mode because the installer runs as a user-facing CLI — a hang with no output leaves the user with a partially-written install directory.

The current corpus has one confirmed two-hop chain (`model-profile-resolution.md` → `model-profiles.md`) and three edge cases where references mention `@~` inside prose (not as a live include directive). Any growth of the reference library makes accidental cycles increasingly likely.

**Prevention:**
Maintain a `Set<string>` of absolute resolved paths representing the current include stack. Before recursing into a file, check whether its path is already in the set. If it is, fail loudly with a message that shows the full cycle path:

```
CIRCULAR INCLUDE DETECTED:
  agents/gsd-executor.md
  → references/model-profile-resolution.md
  → references/model-profiles.md
  → references/model-profile-resolution.md  ← cycle here
```

Do not silently skip the cycle — that would produce a file that silently omits content the author intended to include.

**Which phase should address it:** Phase that implements the resolver. The cycle detector is a prerequisite, not an optimization.

---

### 3. Inlined Content That Misses Tool-Name Runtime Transforms

**Risk:**
The installer's per-runtime tool-name substitution (`Read`→`read`, `Bash`→`execute`, `Edit`→`edit` for Copilot, etc.) runs as part of `convertClaudeToCopilotContent`, `convertClaudeToCodexMarkdown`, etc. These transforms are applied to the file being installed. If template inlining happens after these transforms, the inlined content from reference files arrives raw — the reference files were not themselves passed through the transform pipeline.

Concretely: `gsd-executor.md` gets tool-name-transformed for Copilot. But `references/checkpoints.md`, which is inlined into `gsd-executor.md`, would not have been transformed if inlining happens post-transform. The installed file for Copilot would then contain `Read` and `Bash` in the inlined sections instead of `read` and `execute`, which is a behavioral regression for that runtime.

Conversely, if inlining happens before transforms, the tool names in the inlined content arrive as canonical Claude names (`Read`, `Bash`) and get correctly transformed by the existing pipeline. This is the correct order.

**Prevention:**
Template resolution (inlining) must run first, before any per-runtime transform. The resulting expanded content is then the input to the runtime transform. This integrates cleanly with the existing pipeline structure in `copyWithPathReplacement` — inlining is a pre-processing step that produces a fully-expanded string, then that string flows through the existing `convertClaudeTo*` functions unchanged.

**Which phase should address it:** Architecture phase. This is an ordering invariant that must be documented and enforced in the pipeline, not discovered by debugging a Copilot regression after the fact.

---

### 4. Agent Size Budget Violation from Accumulated Inlining

**Risk:**
The project enforces strict per-agent line limits tested in `tests/agent-size-budget.test.cjs`:
- XL agents (`gsd-debugger`, `gsd-planner`): 1,600 lines
- LARGE agents: 1,000 lines
- DEFAULT agents: 500 lines

`gsd-executor.md` (771 lines currently) includes `references/checkpoints.md` (814 lines), `references/executor-examples.md` (referenced conditionally), and several others. Inlining all of them unconditionally would produce a file exceeding 2,000 lines, blowing past the LARGE budget and defeating the entire purpose of the budget enforcement. The agent-size-budget test would start failing after inlining, which surfaces the problem — but only if the test is run against the installed output, not the source.

The size budget test currently runs against `agents/*.md` source files. If inlining produces output only in the install destination, the test would pass on source but the installed file would be oversized.

**Prevention:**
Two strategies, one required and one recommended:
1. (Required) The conditional include for `executor-examples.md` (`${CONTEXT_WINDOW < 200000 ? '' : ...}`) must be respected — it must remain dynamic, not inlined. This alone eliminates the largest include.
2. (Recommended) Add a post-inlining size check during install that warns when an expanded agent file exceeds the budget thresholds. This catches future budget violations at install time rather than silently shipping oversized prompts.

**Which phase should address it:** Phase implementing the resolver, with a follow-on check in the test/verification phase.

---

### 5. Missing Reference File at Install Time

**Risk:**
If a source agent or workflow references a file that does not exist at install time (e.g., a reference file was deleted, renamed, or never committed), the installer must decide: fail the entire install, skip the include, or embed a visible error marker.

Silent skipping is the worst outcome: the installed file is missing a content section with no indication of the gap. The AI agent running from that file behaves incorrectly in ways that are hard to trace back to the installation.

Failing the entire install is maximally safe but has usability cost — a single stale reference in one rarely-used agent blocks all installs for all runtimes.

**Prevention:**
Fail loud for static, unconditional `@~` references. If the source file cannot be resolved, the install should abort with a clear message identifying which agent/workflow has the broken include and which path could not be resolved. For conditional includes (the `${}` pattern), do not attempt resolution at all — leave them as-is, as described in pitfall #1.

**Which phase should address it:** Phase that implements the resolver. Error handling is part of the initial implementation, not a follow-up hardening step.

---

### 6. Template Placeholder Collision with Inlined Content

**Risk:**
The existing `templates/` system uses `{{PLACEHOLDER}}` syntax (double-brace, `SCREAMING_SNAKE_CASE`), filled by `gsd-tools.cjs template fill`. The reference files and agents contain single-brace prose-style placeholders in documentation and example content — e.g., `{phase_dir}`, `{N}`, `{SOURCE}`, `{resolved_model}`, `{EXPECTED_BASE}` — that are intentional literal strings for human readers or for the AI to substitute at runtime.

If the template inlining pass also applies `{{}}` substitution from the templates system, or if any future unified substitution regex is too broad, it will corrupt content in reference files that contain these literal `{word}` patterns. The reference files in scope include:
- `revision-loop.md`: `{N}`, `{blocker_count}`, `{warning_count}`, `{prev_count}`
- `model-profile-resolution.md`: `{resolved_model}`
- `worktree-path-safety.md`: `{EXPECTED_BASE}` (inside a shell script code block)
- `ui-brand.md`: `{Content}`, `{Type}`, `{Identifier}`, `{N}` (inside ASCII art)
- `planner-source-audit.md`: `{SOURCE}`, `{artifact file}`, `{section}`
- `git-planning-commit.md`: `{scope}`, `{description}`

**Prevention:**
Keep the inlining pass strictly separate from the template-fill pass. Inlining resolves `@~` file references and inserts file content verbatim. It does not perform any string substitution on the inserted content. The `{{}}` template-fill system is a separate, later step used only for files in `get-shit-done/templates/`. These two systems must not share a unified substitution loop.

**Which phase should address it:** Architecture phase — the two substitution systems must be designed as non-overlapping from the start.

---

### 7. Rollback / Partial Install on Failure

**Risk:**
The installer currently writes files one at a time with `fs.writeFileSync`. The `atomicWriteFileSync` helper (write to `.tmp-<pid>-<n>`, then `renameSync`) protects individual files from mid-write corruption, but it does not provide transaction-level rollback across a batch of files. If the inlining resolver fails partway through a multi-agent install (e.g., file 12 of 33 agents hits a missing reference and throws), files 1–11 are already installed in expanded form while files 12–33 were not written. The user's installed directory is a mixed state: some agents are expanded, some are not, with no manifest to identify which.

**Prevention:**
Two approaches, in order of implementation cost:
1. (Lightweight) Resolve and expand all files into memory first. If any file fails resolution, abort before writing any file to disk. Write only begins after all expansions succeed.
2. (Heavier) Write to a temp staging directory, validate the staged output, then move the entire staging directory into place atomically. This matches the pattern already used in the installer's `stageSkillsForMode` / `stageAgentsForProfile` staging flow.

Option 1 is sufficient for the initial implementation. The staged-directory approach is worth pursuing if the inlining pass is extended to cover large agent batches with non-trivial failure rates.

**Which phase should address it:** Phase implementing the resolver. The "resolve all in memory first" contract should be explicit in the implementation design.

---

### 8. Nested Include Depth and the Two-Hop Current Maximum

**Risk:**
Current corpus analysis shows one confirmed two-hop chain: `model-profile-resolution.md` includes `model-profiles.md`. No three-hop chains exist today. The practical depth limit for the install-time inliner is lower than it might appear: deeply nested includes multiply file I/O, can produce very large output files, and obscure which source file is responsible for which section of the installed output.

There is no inherent technical reason depth > 2 is needed in this project. Reference files are flat knowledge fragments, not recursive document structures. Depth > 2 is almost certainly an accident or an antipattern when it occurs.

**Prevention:**
Set a hard maximum depth of 3. At depth 4, abort with a message identifying the include stack. This is a conservative limit that allows the one known two-hop chain and any near-future extension to three hops, while preventing unbounded nesting that would complicate debugging and inflate file sizes without design intent.

**Which phase should address it:** Phase implementing the resolver. The depth limit is a single constant, trivial to enforce, and prevents a category of future maintenance problems.

---

## Order-of-Operations Decision

**Template resolution (inlining) must run first, before runtime transforms.**

The existing pipeline in `copyWithPathReplacement` (around line 6440) applies transforms in this order:
1. Path rewriting (`~/.claude/` → runtime-specific path)
2. Attribution injection
3. Namespace normalization (`/gsd-<cmd>`)
4. Runtime format conversion (`convertClaudeTo*`)

Insert inlining at position 0 — before step 1. The expanded content is then a single string that flows through all subsequent steps unchanged.

Rationale: the reference files contain `@~/.claude/` paths, canonical Claude tool names (`Read`, `Bash`), and GSD command names that all need runtime adaptation. Inlining first means all of that content is present when the transform steps run. Inlining after any transform step means the inlined content bypasses those transforms and produces inconsistent installed files.

Concrete example: `references/checkpoints.md` mentions `Read` tool calls. Inlining after Copilot's `convertClaudeToCopilotContent` would leave those as `Read` in the installed file instead of `read`. Inlining before the pipeline means `convertClaudeToCopilotContent` sees `Read` in the inlined content and correctly transforms it.

---

## Test Coverage Requirements

Minimum regression tests needed, in priority order:

1. **No unresolved `@~` references in installed output** — For each runtime, install to a temp dir and assert that no installed `.md` file contains an unresolved `@~/.claude/get-shit-done/references/` pattern. This is the single highest-value test: it catches any reference that was not inlined when it should have been.

2. **Conditional includes preserved verbatim** — Install `execute-phase.md` for any runtime and assert that the installed output still contains the `${CONTEXT_WINDOW < 200000 ?` string. This verifies that the conditional-include guard (pitfall #1) is working.

3. **Tool names transformed inside inlined content** — Install `gsd-executor.md` for Copilot, extract the section that originated from `references/checkpoints.md`, and assert that it contains `read` and `execute` (not `Read` and `Bash`). This verifies the ordering invariant (pitfall #3).

4. **Circular reference detection throws** — Unit test the resolver function with a synthetic two-file circular setup. Assert that it throws a descriptive error containing both file paths.

5. **Missing reference file throws** — Unit test the resolver with a reference path that does not exist. Assert that the error message names the missing file.

6. **Installed agent file line count within budget** — After install, for each `gsd-*.md` agent, assert the line count is within the budget thresholds defined in `agent-size-budget.test.cjs`. This test must run against installed output, not source files, to catch inflation from inlining.

7. **Single-brace placeholders in reference files survive verbatim** — Install a file that includes `references/revision-loop.md` and assert that the string `{N}` appears in the installed output unchanged (verifying pitfall #6, no unintended substitution).

---

## Recommended Guards

Implementation checklist for the resolver:

- [ ] **Bare-line detection rule**: Only expand `@~` occurrences that appear alone on a line (after stripping leading whitespace). Never expand `@~` that appears inside `${}`, `` ` ``, or other expression contexts.
- [ ] **Cycle detector**: Maintain a `visitStack: Set<string>` of absolute paths. Check before every recursive resolution. On cycle, throw with the full chain in the error message.
- [ ] **Max depth guard**: Track recursion depth. Throw at depth > 3 with the include stack.
- [ ] **Missing file guard**: `fs.existsSync()` before every include resolution. On failure, throw with the source file path and the unresolvable reference path.
- [ ] **Memory-first resolution**: Build the entire expanded output string in memory before writing any file to disk. If resolution of any input file fails, write nothing.
- [ ] **Pipeline position**: Call the inliner before step 1 in `copyWithPathReplacement` — path rewriting must happen after inlining, not before.
- [ ] **No substitution on inlined content**: The inliner does not process `{{}}` or `{}` tokens. It inserts file content verbatim.
- [ ] **Conditional-include passthrough test**: Automated assertion that installed `execute-phase.md` retains the `${CONTEXT_WINDOW` conditional string.
- [ ] **Size regression test on installed output**: Post-install agent line count check, not just source-file check.
- [ ] **No-unresolved-references test**: Scan all installed `.md` files for surviving `@~/.claude/get-shit-done/references/` patterns and assert zero matches.

---

## Sources

- Direct inspection of `bin/install.js` (11,522 lines), specifically `copyWithPathReplacement`, `_applyRuntimeRewrites`, `atomicWriteFileSync`, and runtime converters.
- Direct inspection of `agents/*.md` for `@~` usage patterns (39 occurrences across 33 agents).
- Direct inspection of `get-shit-done/workflows/*.md` for `@~` usage patterns (48 occurrences), including the conditional expression at `execute-phase.md:619`.
- Direct inspection of `get-shit-done/references/*.md` for cross-include chains and literal `{placeholder}` patterns.
- `tests/agent-size-budget.test.cjs` for budget thresholds (XL=1600, LARGE=1000, DEFAULT=500 lines).
- `tests/runtime-converters.test.cjs` for transform pipeline structure.
