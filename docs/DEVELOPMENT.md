<!-- generated-by: gsd-doc-writer -->
# Development

This guide covers local development setup, build commands, code style, branch conventions, and the PR process for contributing to GSD.

## Local Setup

```bash
# Fork and clone the repository
git clone https://github.com/gsd-build/get-shit-done.git
cd get-shit-done

# Install dependencies (use npm install, not npm ci, for local development)
npm install

# Copy environment config if needed
# (no .env required — GSD has no runtime environment dependencies)

# Build hook dist files before running tests
npm run build:hooks
```

Node.js >= 22.0.0 is required. Use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) to manage versions.

## Build Commands

| Command | Description |
|---------|-------------|
| `npm run build:hooks` | Validates hook JS syntax and copies hook files to `hooks/dist/` |
| `npm run prepublishOnly` | Runs `build:hooks` before npm publish (lifecycle hook — not for manual use) |
| `npm test` | Runs the full test suite using Node.js built-in test runner |
| `npm run test:coverage` | Runs tests with c8 coverage reporting (requires >=70% line coverage) |

## Code Style

The project has no external linter or formatter configured. Follow these conventions manually:

- **Module format:** CommonJS (`.cjs`) — use `require()`, not ESM `import`. Core library files in `get-shit-done/bin/lib/` must remain `.cjs`.
- **No external dependencies in core:** `gsd-tools.cjs` and all lib files use only Node.js built-ins.
- **Commit messages:** Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `ci:`.
- **Security:** Use `validatePath()` from `security.cjs` for user-provided paths. Use `execFileSync` (array args) instead of `execSync` (string interpolation) to prevent shell injection.
- **GitHub Actions:** Never use `${{ }}` expressions in `run:` blocks — bind to `env:` mappings first.

No `.eslintrc`, `.prettierrc`, or `biome.json` is present. The project relies on developer discipline and code review for style consistency.

## Branch Conventions

The main branch is `main`. All branches must use one of these prefixes:

| Prefix | Use |
|--------|-----|
| `feat/` | New features (require `approved-feature` label on linked issue) |
| `fix/` | Bug fixes (require `confirmed-bug` label on linked issue) |
| `hotfix/` | Urgent production fixes |
| `docs/` | Documentation-only changes |
| `chore/` | Maintenance, dependency updates |
| `refactor/` | Code restructuring without behavior change |
| `test/` | Test-only changes |
| `ci/` | CI/CD configuration changes |
| `perf/` | Performance improvements |
| `revert/` | Reverting a previous commit |
| `release/` | Release preparation branches |

Branch name validation is enforced by the `.github/workflows/branch-naming.yml` CI workflow on every PR. PRs from branches with non-conforming names receive a warning.

## PR Process

**Issue-first rule — no exceptions.** No PR is accepted without a properly-labeled linked issue. Draft PRs are auto-closed.

1. **Open an issue first.** Choose the correct type:
   - Bug fix: open a [Bug Report](https://github.com/gsd-build/get-shit-done/issues/new?template=bug_report.yml), wait for `confirmed-bug` label.
   - Enhancement: open an [Enhancement issue](https://github.com/gsd-build/get-shit-done/issues/new?template=enhancement.yml), wait for `approved-enhancement` label.
   - Feature: open a [Feature Request](https://github.com/gsd-build/get-shit-done/issues/new?template=feature_request.yml), wait for `approved-feature` label.

2. **Use the correct PR template.** Separate templates exist for [Fix](.github/PULL_REQUEST_TEMPLATE/fix.md), [Enhancement](.github/PULL_REQUEST_TEMPLATE/enhancement.md), and [Feature](.github/PULL_REQUEST_TEMPLATE/feature.md).

3. **Link the issue with a closing keyword** in the PR body: `Fixes #NNN`, `Closes #NNN`, or `Resolves #NNN`. The `require-issue-link` CI job will auto-close the PR if no valid link is found.

4. **CI must pass.** All test matrix jobs must be green: Ubuntu × Node 22, Ubuntu × Node 24, and macOS × Node 24. The full matrix runs on every PR to `main`.

5. **Scope matches the approved issue.** One concern per PR — bug fixes, enhancements, and features must be in separate PRs. No drive-by reformatting.

### Canonical Agent Source

When modifying agent definitions, always edit files in `agents/` at the repo root — never `.claude/agents/`, `.cursor/agents/`, or `.github/agents/gsd-*`. Those paths are gitignored install-sync outputs and will be overwritten on next install.

## File Structure

```
bin/install.js              Installer (multi-runtime: Claude Code, Gemini CLI, OpenCode, Codex, Copilot)
get-shit-done/
  bin/lib/                  Core library modules (.cjs) — Node.js built-ins only
  workflows/                Workflow definitions (.md)
  references/               Reference documentation (.md)
  templates/                File templates
agents/                     Agent definitions (.md) — CANONICAL SOURCE
commands/gsd/               Slash command definitions (.md)
hooks/                      Claude Code hook scripts
  dist/                     Built hook output (generated by npm run build:hooks)
scripts/                    Build and test runner scripts
tests/                      Test files (.test.cjs)
  helpers.cjs               Shared test utilities
docs/                       User-facing documentation
```

See [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed testing standards and contribution type requirements.
