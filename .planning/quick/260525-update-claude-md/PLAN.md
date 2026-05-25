---
task: Update CLAUDE.md architecture counts to match current project state
slug: update-claude-md
date: 2026-05-25
---

# Plan: Update CLAUDE.md Architecture Counts

## What

Update the manually-maintained architecture section of `CLAUDE.md` to reflect actual current file counts. The counts listed are significantly out of date.

## Changes

### In the Architecture section (lines ~29–37), update:

1. `"46 user-facing slash commands"` → `"67 user-facing slash commands"`
   - Verified: `ls commands/gsd/*.md | wc -l` = 67

2. `"52 thin orchestrators"` → `"90 thin orchestrators"`
   - Verified: `ls get-shit-done/workflows/*.md | wc -l` = 90

3. `"16 agent definitions"` → `"33 agent definitions"`
   - Verified: `ls agents/*.md | wc -l` = 33

4. `"14 Node.js CommonJS modules"` → `"79 Node.js CommonJS modules"`
   - Verified: `ls get-shit-done/bin/lib/*.cjs | wc -l` = 79

### In the GSD:architecture-start section (line ~256), update:

5. `"agents/*.md (31 agents)"` → `"agents/*.md (33 agents)"`
   - Same agents directory, count increased

## Files Changed

- `CLAUDE.md` — 5 string replacements

## Commit

`docs: update CLAUDE.md architecture counts to reflect current project state`
