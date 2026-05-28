# Architecture Research: install.js Template Integration

**Researched:** 2026-05-28
**Confidence:** HIGH (based on direct source reading)

---

## Current install.js Pipeline

The installer is a single 11,000+ line Node.js CommonJS file. The install flow for prompt content files (agents, commands, workflows) runs as follows:

### Step 1 — Staging

`_stageSkills(commandsDir)` and `_stageAgents(agentsDir)` filter source files into a temporary staging directory based on the active install profile (core vs full). This produces a filtered set of source `.md` files but does not modify their content.

### Step 2 — Content Read + Path Substitution

For **agents** (lines 8643–8719): the loop reads each `.md` file with `fs.readFileSync`, then immediately runs path substitution — replacing `~/.claude/`, `$HOME/.claude/`, etc. with the runtime-specific `pathPrefix`. This happens inline in the install loop.

For **commands/get-shit-done** (lines 6399–6562 in `copyWithPathReplacement`): the same pattern — read file, apply path substitution regex, then hand off to the runtime converter.

For **skills** (layout-driven runtimes via `installRuntimeArtifacts`): staging happens via `kind.stage()`, then `applyRuntimeContentRewritesInPlace(staged, runtime, pathPrefix)` walks the staged directory and applies `_applyRuntimeRewrites()` per-file.

### Step 3 — Runtime-Specific Transform

After path substitution, content is passed through one of these converters depending on runtime:

| Runtime | Converter |
|---------|-----------|
| opencode | `convertClaudeToOpencodeFrontmatter()` |
| kilo | `convertClaudeToKiloFrontmatter()` |
| gemini | `convertClaudeToGeminiMarkdown()` / `convertClaudeToGeminiAgent()` |
| codex | `convertClaudeToCodexMarkdown()` / `convertClaudeAgentToCodexAgent()` |
| copilot | `convertClaudeToCopilotContent()` / `convertClaudeAgentToCopilotAgent()` |
| cursor | `convertClaudeToCursorMarkdown()` / `convertClaudeAgentToCursorAgent()` |
| antigravity | `convertClaudeToAntigravityContent()` / `convertClaudeAgentToAntigravityAgent()` |
| windsurf, augment, trae, codebuddy, cline, qwen, hermes | similar per-runtime converters |

The converters mutate frontmatter (tool name lists, permission schemas) and body (path strings, command namespace `/gsd:` → `/gsd-`).

### Step 4 — Attribution + Namespace Normalization

`processAttribution(content, getCommitAttribution(runtime))` and `normalizeAgentBodyForRuntime(content, runtime, cmdNames)` run after the runtime converter for some paths.

### Step 5 — Write to Destination

`fs.writeFileSync(destPath, content)` writes the final transformed content.

---

## Key Functions / Entry Points

| Function | File Location | Role |
|----------|--------------|------|
| `copyWithPathReplacement(srcDir, destDir, pathPrefix, runtime, isCommand, isGlobal)` | ~line 6399 | Recursive directory copy for commands and get-shit-done subtree. The `.md` file read + transform happens inside the loop at line 6432. |
| `applyRuntimeContentRewritesInPlace(stagedDir, runtime, pathPrefix)` | line 5898 | Walks staged skills dirs and rewrites each `SKILL.md` in place before `_copyStaged` writes to dest. |
| `_applyRuntimeRewrites(content, runtime, pathPrefix)` | line 5926 | Pure function applying per-runtime regex substitutions. Unit-testable. |
| Agent install loop | lines 8639–8727 in `install()` | Directly reads each agent `.md`, applies path substitution and runtime conversion inline. |
| `installRuntimeArtifacts(runtime, configDir, scope, resolvedProfile)` | line 6279 | Orchestrator for layout-driven runtimes: calls `kind.stage()`, then `applyRuntimeContentRewritesInPlace`, then `_copyStaged`. |

**The single best entry point for adding a template resolution step is the content read point**, which occurs in three distinct code sites:

1. `copyWithPathReplacement` at line 6432: `let content = fs.readFileSync(srcPath, 'utf8');` — all commands and the `get-shit-done/` subtree (workflows, references, templates) flow through here.
2. The agent loop at line 8646: `let content = fs.readFileSync(path.join(agentsSrc, entry.name), 'utf8');` — all agents flow through here.
3. `applyRuntimeContentRewritesInPlace` → `_applyRuntimeRewrites` — skills (`SKILL.md`) flow through here, but they are already transformed copies of commands.

---

## Proposed Integration Design

Template resolution must run **before** runtime-specific transforms. The path substitution step (`~/.claude/` → runtime prefix) must also run before resolution, because `@` include paths in source files reference `~/.claude/get-shit-done/references/...` — those paths need to be resolved to actual filesystem paths pointing into the source repo, not the installed destination.

However, the cleaner design is to resolve includes **against the source repo** before any path substitution, using the repo-relative source paths directly. This avoids a chicken-and-egg problem with path rewriting.

### Recommended pipeline order per file

```
1. readFileSync(srcPath)             <- raw source content
2. resolveIncludes(content, srcDir)  <- inline all @ and !`<bash>` references
                                        using source repo paths
3. path substitution regexes         <- ~/.claude/ → pathPrefix
4. runtime-specific converter        <- frontmatter, tool names, etc.
5. processAttribution()              <- attribution line
6. normalizeAgentBodyForRuntime()    <- namespace normalization
7. writeFileSync(destPath, content)  <- write final output
```

### Pseudocode for resolveIncludes()

```javascript
/**
 * Inline all @path and !`<bash>` path include references in content.
 * Paths are resolved relative to sourceRoot (the repo root).
 * @param {string} content      - Raw file content
 * @param {string} sourceRoot   - Absolute path to GSD repo root (path.join(__dirname, '..'))
 * @param {Set<string>} [seen]  - Already-resolved paths for cycle detection
 * @returns {string}            - Content with includes replaced by file content
 */
function resolveIncludes(content, sourceRoot, seen = new Set()) {
  // Matches:
  //   @~/.claude/get-shit-done/references/foo.md
  //   @$HOME/.claude/get-shit-done/references/foo.md
  //   !`cat ~/.claude/get-shit-done/references/foo.md`
  //   !`cat $HOME/.claude/get-shit-done/references/foo.md`
  const INCLUDE_PATTERN = /(?:^|(?<=\s))[@!`cat\s]+~\/\.claude\/|(?:^|(?<=\s))[@!`cat\s]+\$HOME\/\.claude\//;

  // Simpler regex covering the actual patterns:
  const INCLUDE_RE = /@(?:~\/\.claude|(?:\$HOME)\/\.claude)\/([\w\-./]+\.md)/g;
  // !`<bash>` variant — backtick-wrapped shell injection evaluated by Claude Code at message-send time
  const CAT_RE = /!`cat\s+(?:~\/\.claude|\$HOME\/\.claude)\/([\w\-./]+\.md)`/g;

  let result = content;

  for (const [re] of [[INCLUDE_RE], [CAT_RE]]) {
    result = result.replace(re, (match, relPath) => {
      const absPath = path.join(sourceRoot, relPath);
      if (seen.has(absPath)) return match; // cycle guard
      if (!fs.existsSync(absPath)) return match; // missing file — leave as-is

      seen.add(absPath);
      const included = fs.readFileSync(absPath, 'utf8');
      // Recurse to handle nested includes
      const resolved = resolveIncludes(included, sourceRoot, seen);
      seen.delete(absPath); // allow same file in different branches
      return resolved;
    });
  }

  return result;
}
```

### Where to call resolveIncludes()

**Site 1 — `copyWithPathReplacement` (line 6432):**

```javascript
// BEFORE (current):
let content = fs.readFileSync(srcPath, 'utf8');
if (!isCopilot && !isAntigravity) {
  content = content.replace(globalClaudeRegex, pathPrefix);
  // ...
}

// AFTER (with template resolution):
let content = fs.readFileSync(srcPath, 'utf8');
content = resolveIncludes(content, src); // src = path.join(__dirname, '..')
if (!isCopilot && !isAntigravity) {
  content = content.replace(globalClaudeRegex, pathPrefix);
  // ...
}
```

**Site 2 — agent install loop (line 8646):**

```javascript
// BEFORE (current):
let content = fs.readFileSync(path.join(agentsSrc, entry.name), 'utf8');
const dirRegex = /~\/\.claude\//g;
// ...

// AFTER (with template resolution):
let content = fs.readFileSync(path.join(agentsSrc, entry.name), 'utf8');
content = resolveIncludes(content, src); // src is already in scope
const dirRegex = /~\/\.claude\//g;
// ...
```

**Note on skills path (`applyRuntimeContentRewritesInPlace`):** Skills (`SKILL.md` files) are already-converted copies of commands. They should not need separate include resolution if the command path above runs first. However, if the pipeline calls `applyRuntimeContentRewritesInPlace` on content that was staged before include resolution ran, the skill files in the staged directory will still have unresolved `@` references. The safest fix is to also call `resolveIncludes` inside `applyRuntimeContentRewritesInPlace`'s `walkAndRewrite` loop, or to ensure staging occurs after include resolution.

---

## Reference File Format

Reference files in `get-shit-done/references/` are plain Markdown with prose, code blocks, and XML-like semantic tags (e.g. `<philosophy>`, `<core_principle>`, `<anti_patterns>`). Verified examples:

- `questioning.md` — prose sections, XML-style tags, no `@` includes found
- `verification-patterns.md` — bash code blocks, markdown headings, no `@` includes found
- `model-profiles.md` — tables, JSON code blocks, no `@` includes found
- `gates.md` — no `@` includes found
- `agent-contracts.md` — no `@` includes found
- `context-budget.md` — no `@` includes found

**Conclusion:** Reference files are leaf nodes. They do not themselves contain `@~/.claude/` include directives. Recursive resolution is technically required for correctness (the algorithm should handle it), but in practice the current reference corpus is flat — no includes-within-includes exist.

---

## Recursive Include Handling

Recursion is required for safety but the current corpus does not exercise it. The `resolveIncludes` function above handles it via:

1. A `seen` Set passed through recursion for cycle detection (prevents infinite loops if file A includes file B which includes file A).
2. `seen.delete(absPath)` after return so the same file can appear in multiple non-cyclic include chains (diamond includes).
3. Returning the unresolved `match` string if the referenced file does not exist — this is a safe fallback that preserves the original `@` reference in the output rather than silently dropping content.

Depth is bounded in practice by the flat reference file structure. A hard depth limit (e.g. max 10 levels) would be a belt-and-suspenders addition but is not strictly necessary given the current corpus.

---

## Path Resolution Strategy

All `@` include paths in source files use one of two forms:
- `@~/.claude/get-shit-done/references/foo.md`
- `@$HOME/.claude/get-shit-done/references/foo.md`

Both resolve to the same location in the source repo. The resolver maps these to the source repo path by:

```javascript
// Strip the runtime-install prefix, replace with repo source root
const CLAUDE_PREFIX_RE = /^(?:~\/\.claude|\$HOME\/\.claude)\//;
const relPath = includeTarget.replace(CLAUDE_PREFIX_RE, '');
const absPath = path.join(sourceRoot, relPath);
// sourceRoot = path.join(__dirname, '..')
// e.g. "get-shit-done/references/foo.md" → "/path/to/repo/get-shit-done/references/foo.md"
```

This works because the source repo layout mirrors the installed layout exactly — `get-shit-done/references/` exists at the same relative path in both the repo root and `~/.claude/` after install.

**Edge case — conditional includes:** One reference in `execute-phase.md` uses a ternary:
```
${CONTEXT_WINDOW < 200000 ? '' : '@~/.claude/get-shit-done/references/executor-examples.md'}
```
This is a JavaScript template literal evaluated at agent runtime, not a static `@` reference. The include resolver must not attempt to resolve these — the regex pattern `@~/.claude/...` embedded inside `${}` template expressions will not match a line-start-anchored or whitespace-preceded pattern, but the regex needs to be written carefully to avoid matching embedded occurrences inside template literals and code blocks. The safest approach is to apply the resolver only to lines where `@~/.claude/` appears as a standalone include (not inside backtick code blocks or `${...}` expressions).

**Recommendation:** Use a line-by-line pass that skips lines inside fenced code blocks (``` triple-backtick delimited) and skips `@` references inside `${...}` expressions. This avoids mangling documentation examples that show include syntax.

---

## Summary of Integration Points

| Code Site | Lines | Files Affected | Action |
|-----------|-------|---------------|--------|
| `copyWithPathReplacement` — `.md` branch | 6432 | commands/*.md, workflows/*.md, references/*.md, templates/*.md | Add `resolveIncludes(content, src)` immediately after `fs.readFileSync` |
| Agent install loop | 8646 | agents/gsd-*.md | Add `resolveIncludes(content, src)` immediately after `fs.readFileSync` |
| `applyRuntimeContentRewritesInPlace` walk | 5908 | SKILL.md (already-converted commands) | Optional: add resolve step here if skills are staged before include resolution runs elsewhere |

The `resolveIncludes` function itself should be defined near the top of `install.js` (before the first install function), alongside `processAttribution` and `replaceRelativePathReference`, as a pure transform function.
