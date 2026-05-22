<!-- generated-by: gsd-doc-writer -->
# Getting Started with GSD

A light-weight, powerful meta-prompting and spec-driven development system for Claude Code, OpenCode, Gemini CLI, Codex, Copilot, Cursor, Windsurf, and more.

---

## Prerequisites

- **Node.js >= 22.0.0** — required by the installer and SDK
- **npm** — bundled with Node.js; used to run `npx get-shit-done-cc`
- An AI coding runtime — one or more of: Claude Code, OpenCode, Gemini CLI, Kilo, Codex, GitHub Copilot, Cursor, Windsurf, Antigravity, Augment, Trae, Qwen Code, CodeBuddy, or Cline

No other global dependencies are required. The installer is self-contained.

---

## Installation Steps

### Option 1: npx (recommended)

Run the interactive installer directly — no clone needed:

```bash
npx get-shit-done-cc@latest
```

The installer will prompt you to choose:

1. **Runtime** — which AI coding environment(s) to install into (interactive multi-select)
2. **Location** — global (all projects, installs to `~/.claude/`, `~/.gemini/`, etc.) or local (current project only, installs to `./.claude/`, etc.)

### Option 2: non-interactive (CI, Docker, scripts)

Pass flags directly to skip all prompts:

```bash
# Claude Code — global
npx get-shit-done-cc --claude --global

# Claude Code — local (current project only)
npx get-shit-done-cc --claude --local

# Gemini CLI — global
npx get-shit-done-cc --gemini --global

# Codex — global
npx get-shit-done-cc --codex --global

# All supported runtimes — global
npx get-shit-done-cc --all --global
```

Use `--sdk` to also install the GSD SDK CLI (`gsd-sdk`) for headless autonomous execution.

### Option 3: development install (source clone)

```bash
git clone https://github.com/gsd-build/get-shit-done.git
cd get-shit-done
npm install
npm run build:hooks
node bin/install.js --claude --local
```

The `npm run build:hooks` step is required — it compiles hook sources into `hooks/dist/`. Without it, hooks will not be installed and you will get hook errors in Claude Code.

---

## First Run

### 1. Verify installation

After installing, confirm GSD is available in your runtime:

- **Claude Code / Gemini / Copilot / Qwen Code:** `/gsd-help`
- **OpenCode / Kilo / Augment / Trae / CodeBuddy:** `/gsd-help`
- **Codex:** `$gsd-help`
- **Cline:** Check that `.clinerules` exists in your project directory

### 2. (Optional) Map an existing codebase

If you already have an existing project, run this first so GSD understands your code:

```
/gsd-map-codebase
```

This spawns parallel agents to analyze your stack, architecture, conventions, and concerns. Subsequent planning commands use this context automatically.

### 3. Initialize a new project

```
/gsd-new-project
```

This single command drives the full project initialization flow:

1. **Questions** — asks until it fully understands your idea (goals, constraints, tech preferences, edge cases)
2. **Research** — spawns parallel agents to investigate the domain (optional but recommended)
3. **Requirements** — extracts what is v1, v2, and out of scope
4. **Roadmap** — creates phases mapped to requirements

You approve the roadmap. Once approved, you are ready to build.

**Files created:** `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, `.planning/research/`

### 4. (Recommended) Run Claude Code without permission prompts

GSD is designed for frictionless automation. Run Claude Code with:

```bash
claude --dangerously-skip-permissions
```

Stopping to approve every `git commit` and `ls` command defeats the purpose of the system.

---

## Common Setup Issues

**Wrong Node.js version**
GSD requires Node.js >= 22.0.0. Check your version with `node --version`. Use a version manager (`nvm`, `fnm`) to install the correct version if needed.

**Hooks not installed (Claude Code errors after install)**
If you installed from source and skipped `npm run build:hooks`, re-run that command then re-run the installer. The build step compiles hook sources that the installer copies into place.

**Commands not available after install**
Verify the install location matches where your runtime looks for commands. For Claude Code 2.1.88+, commands install as skills to `.claude/skills/` (local) or `~/.claude/skills/` (global). For older Claude Code versions, they install to `commands/gsd/`. The installer handles this automatically — re-running `npx get-shit-done-cc@latest` will update to the correct format.

**npm unavailable (restricted environments)**
For environments where npm is not available, see [docs/manual-update.md](manual-update.md) for source-based installation instructions.

---

## Next Steps

- **[docs/DEVELOPMENT.md](DEVELOPMENT.md)** — local development setup, build commands, and code style
- **[docs/USER-GUIDE.md](USER-GUIDE.md)** — full workflow reference: phase lifecycle, commands, troubleshooting, and recovery
- **[docs/COMMANDS.md](COMMANDS.md)** — complete command reference
- **[docs/CONFIGURATION.md](CONFIGURATION.md)** — configuration schema and workflow toggles
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** — how to contribute fixes, enhancements, and features
