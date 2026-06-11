> # Project Continuity Notice
>
> GSD is maintained by the **open-gsd** team at:
> **`open-gsd/get-shit-done-redux`**
>
> Use only these package names:
>
> - npm (main): `@opengsd/get-shit-done-redux`
> - npm (sdk): `@opengsd/gsd-sdk`
>
> The legacy upstream (`gsd-build/*`) is outside open-gsd control. Based on public transition announcements and repository ownership reality, we strongly recommend removing `gsd-build` organization packages and migrating to `@opengsd/*`.
>
> Security status:
>
> - maintainers completed an internal security audit
> - maintainers report an independent review pass
> - no known active exploit was found in tracked source during those passes
>
> See:
>
> - continuity announcement: https://github.com/open-gsd/get-shit-done-redux/discussions/109
> - audit transparency report: https://github.com/open-gsd/get-shit-done-redux/discussions/119
>
> ---


<div align="center">

# GSD Core

**Git. Ship. Done.**

**English** · [Português](README.pt-BR.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja-JP.md) · [한국어](README.ko-KR.md)

**A light-weight meta-prompting, context engineering, and spec-driven development system for Claude Code, OpenCode, Gemini CLI, Kilo, Codex, Copilot, Cursor, Windsurf, and more.**

[![npm version](https://img.shields.io/npm/v/%40opengsd%2Fgsd-core?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/@opengsd/get-shit-done-redux)
[![npm downloads](https://img.shields.io/npm/dm/%40opengsd%2Fgsd-core?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/@opengsd/get-shit-done-redux)
[![Tests](https://img.shields.io/github/actions/workflow/status/open-gsd/get-shit-done-redux/test.yml?branch=main&style=for-the-badge&logo=github&label=Tests)](https://github.com/open-gsd/get-shit-done-redux/actions/workflows/test.yml)
[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/mYgfVNfA2r)
[![GitHub stars](https://img.shields.io/github/stars/open-gsd/get-shit-done-redux?style=for-the-badge&logo=github&color=181717)](https://github.com/open-gsd/get-shit-done-redux)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

</div>

---

## What is GSD Core

GSD Core is a context-engineering and spec-driven development framework that drives AI coding agents (Claude Code, Codex, Gemini CLI, Copilot, Cursor, and more) through a disciplined phase loop. It solves [context rot](docs/explanation/context-engineering.md) — the quality degradation that accumulates as an AI fills its context window — by running all heavy research, planning, and execution work in fresh-context subagents while keeping your main session lean.

---

> [!IMPORTANT]
> **Returning to GSD?**
>
> Run `/gsd-map-codebase` to re-index your codebase, then `/gsd-new-project` to rebuild GSD's planning context. Your code is fine — GSD just needs its context rebuilt. See the [CHANGELOG](CHANGELOG.md) for what's new.

---

## Why We Continue Building GSD

GSD exists to help solo builders and small teams ship reliably with AI: clear specs, controlled context, and verification before release.

In May 2026, maintainers published a continuity announcement and migrated active development to `open-gsd/get-shit-done-redux` after trust and ownership concerns around the former upstream, including a meme-coin rug-pull incident publicly associated with that ecosystem.

The former creator and the `gsd-build` lineage are no longer part of this program. This repository is the maintained continuation under open-gsd governance.

The current team continues release operations, triage, and security hardening in public. Audit status and follow-up security work are documented in Discussion #119 and linked issues.

---

## How it works

Each milestone repeats the same five-step loop, one phase at a time:

1. **Discuss** — capture implementation decisions before anything is planned
2. **Plan** — research, decompose, and verify the plan fits a fresh context window
3. **Execute** — run plans in parallel waves; each executor starts with a clean 200k-token context
4. **Verify** — walk through what was built; diagnose and fix before declaring done
5. **Ship** — create the PR, archive the phase, repeat for the next one

---

## Quickstart

```bash
npx @opengsd/get-shit-done-redux@latest
```

The installer prompts for your runtime (Claude Code, OpenCode, Gemini CLI, Kilo, Codex, Copilot, Cursor, Windsurf, and more) and whether to install globally or locally. The installer is required for cross-runtime compatibility — do not copy files from `agents/` or `commands/` directly.

On another runtime or without Node.js? See [Install on your runtime](docs/how-to/install-on-your-runtime.md).

Once installed, start your first project:

```bash
/gsd-new-project
```

New here? Follow [Your first project](docs/tutorials/your-first-project.md) for a guided walkthrough from install to first shipped phase.

---

## Documentation

**Tutorials** — learning by doing:
- [Your first project](docs/tutorials/your-first-project.md)
- [Onboarding an existing codebase](docs/tutorials/onboarding-an-existing-codebase.md)

**How-to guides** — task-focused recipes:
- [Install on your runtime](docs/how-to/install-on-your-runtime.md)
- [Plan a phase](docs/how-to/plan-a-phase.md)
- [Verify and ship](docs/how-to/verify-and-ship.md)
- … [see all how-to guides](docs/README.md#how-to-guides)

**Reference** — authoritative facts:
- [Commands](docs/COMMANDS.md)
- [Configuration](docs/CONFIGURATION.md)
- [CLI tools](docs/CLI-TOOLS.md)

**Explanation** — concepts and design decisions:
- [Context engineering](docs/explanation/context-engineering.md)
- [The phase loop](docs/explanation/the-phase-loop.md)
- [Architecture](docs/ARCHITECTURE.md)

Full index: [docs/README.md](docs/README.md). Other languages: [日本語](README.ja-JP.md) · [한국어](README.ko-KR.md) · [Português](README.pt-BR.md) · [简体中文](README.zh-CN.md).

---

## Why it works

Most AI-coding setups fail at scale because context bloat silently degrades output quality, there is no shared memory between sessions, and nothing verifies that code actually works. GSD Core solves all three: heavy work runs in fresh subagents, structured artifacts like `STATE.md` and `CONTEXT.md` survive session boundaries, and the verify step walks through what was built and generates fix plans before a phase is declared done. See [docs/explanation/context-engineering.md](docs/explanation/context-engineering.md) for the full reasoning.

Troubleshooting? See [docs/how-to/recover-and-troubleshoot.md](docs/how-to/recover-and-troubleshoot.md).

---

## Community

| Project | Platform |
|---------|----------|
| [gsd-opencode](https://github.com/rokicool/gsd-opencode) | Original OpenCode port |
| [Discord](https://discord.gg/mYgfVNfA2r) | Community support |

---

## Star History

<a href="https://star-history.com/#open-gsd/get-shit-done-redux&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=open-gsd/get-shit-done-redux&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=open-gsd/get-shit-done-redux&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=open-gsd/get-shit-done-redux&type=Date" />
 </picture>
</a>

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Claude Code is powerful. GSD Core makes it reliable.**

</div>
