# SPEC-04: Eta v4 Install-Time Materialization

**ID:** 04
**Requirement:** SPEC-04
**Status:** Ready
**Confidence:** High
**Specced:** 2026-06-12
**Reimplementation target:** v2.1.0-h fork features on refactored upstream
**Depends on:** —
**Reimplementation evidence (tier-1 test):** tests/install-eta-regression.test.cjs

---

## Purpose

The Eta v4 install-time materialization pipeline ensures that every `.md` file copied to a
target runtime is passed through `renderEtaContent` (Eta v4) so that `<%~ include('...') %>`
directives — which reference shared prompt fragments by `@~/.claude/`-style paths — are
resolved and their content inlined into the installed output before it reaches the runtime
config directory. This materialization step is essential because prompt-corpus files in the
source repository use `<%~ include() %>` directives to compose shared fragments (such as
mandatory-read references, checkpoint conventions, and pattern libraries) at authoring time;
if any copy path skips rendering, the installed files contain literal `<%~ include('...') %>`
template syntax or unresolved `@~/.claude/` paths as plain text, producing broken prompt
content that an AI coding tool reads verbatim instead of as composed instructions. An
`@~/.claude/` reference that should have been inlined (an Eta include directive) surviving in
an installed file is equally broken — the path does not resolve at runtime. A third failure
mode is silent: a copy path that skips `renderEtaContent` entirely lets include directives
pass through with no error, so the regression is invisible until the installed files are
inspected. This third path — the skills `wrappedConverter` path in
`get-shit-done/bin/lib/runtime-artifact-layout.cjs` — was found only via a post-milestone
audit, underscoring why all three paths must be named and covered by an explicit invariant.
The behavioral contract of this pipeline — covering all three copy paths, the `<%~ include()`
inlining mechanic, the observable engine configuration (`autoEscape: false`, raw `<%~` output,
views-root include resolution), and the error contracts for circular and missing includes — is
the normative authority of `tests/install-eta-regression.test.cjs` (tier-1 per
`00-CONVENTIONS.md` §4).

## Scope

**In scope:**

- Eta rendering across all three copy paths such that no unrendered `<%~` Eta directive and no
  non-allowlisted `@~/.claude/` reference survives in any installed `.md` file:
  (1) the commands/workflows copy path (`copyWithPathReplacement`, `install.js` call site ~6515),
  (2) the agents copy path (`install.js` call site ~8731), and
  (3) the skills `wrappedConverter` path (`get-shit-done/bin/lib/runtime-artifact-layout.cjs`
      lines ~198–201) — the audit-found path that is invisible to a grep on `renderEtaContent`
      alone because the call is inside the `wrappedConverter` closure.
- The `ALLOWED_INLINE_REFS` exception rule: an installed `@~/.claude/` reference is permitted
  only when it is an intentional AI-instruction prose ref (the model is directed to read a file
  at that path) or a `${...}`-preserved conditional expression; any other `@~/.claude/`
  occurrence and any surviving `<%~` tag are violations.
- `<%~ include()` inlining: a `<%~ include('path') %>` directive resolves the referenced file
  relative to the views root and inlines its full content into the rendered output.
- The observable engine configuration: `autoEscape: false` (included content is emitted verbatim
  without HTML-entity escaping), `<%~` emits raw (unescaped) output, and include paths are
  resolved by joining the views root with the template path.
- Circular-include failure: a self-referencing or transitively circular include throws a
  descriptive `Error` whose message names the offending source path (never a raw `RangeError`).
- Missing-include failure: an include of a nonexistent file throws `EtaFileResolutionError` (the
  upstream Eta v4 class, imported from the `eta` package) whose message names the missing
  filename.

**Out of scope:**

- The literal `{{GSD_REPO}}` / `{{GSD_BRANCH}}` / `{{GSD_VERSION}}` regex placeholder
  substitution that wires fork repo identity and the install-time git SHA into installed hook
  files — that is SPEC-02. The explicit boundary: `<%~ include()` content materialization is
  SPEC-04; `{{...}}` repo/branch/version regex substitution is SPEC-02. Both remain INDEX root
  nodes with no dependency edge between them.
- The bespoke `resolveIncludes()` stepping-stone resolver written in Phase 44 — it was
  superseded by Eta v4 and is listed in `INDEX.md` `## Excluded from Scope`. A reimplementer
  does not carry it forward; its supersession is recorded as a settled Key Decision, not an
  invariant.
- The per-runtime skill converter functions (e.g., `convertClaudeCommandToClaudeSkill`) and the
  profile-staging functions `stageSkillsForProfile` / `stageSkillsForMode` — these run before
  or after Eta rendering in the skills pipeline and are orthogonal to materialization; they
  govern the target format of skill files, not whether include directives are rendered.

## Invariants

**04-INV-1** — The system MUST run `renderEtaContent` on every installed `.md` file across all
three copy paths — commands/workflows (via `copyWithPathReplacement`), agents, and the skills
`wrappedConverter` — such that no non-allowlisted `@~/.claude/` reference and no `<%~` Eta
directive survives in any installed `.md` file.

The `ALLOWED_INLINE_REFS` exception is a normative behavioral rule: an installed `@~/.claude/`
reference is permitted only when it is an intentional AI-instruction prose reference (the model
is directed to read a file at that path — e.g., "Read @~/.claude/…") or a `${...}`-preserved
conditional expression that Eta passes through unrendered. An `@~/.claude/` occurrence that is
not in `ALLOWED_INLINE_REFS` — i.e., an Eta include ref that should have been materialized by
`renderEtaContent` — is a violation. Any surviving `<%~` tag in any installed `.md` file is
always a violation (no allowlist is needed for the `<%~` half — any survivor is a bug).

The following enumeration of `ALLOWED_INLINE_REFS` entries is a dated advisory list, **current
as of 2026-06-12**, reflecting the 30 entries in `tests/install-eta-regression.test.cjs` at
HEAD. The entries are advisory supporting detail, grouped by classification — the durable
contract is the behavioral rule above, not the specific entries:

> **Prose refs** (the model is directed to read a file at the listed `@~/.claude/` path):
>
> | Entry (advisory — current as of 2026-06-12) | Class |
> |----------------------------------------------|-------|
> | `@~/.claude/get-shit-done/references/project-skills-discovery.md` | prose |
> | `@~/.claude/get-shit-done/references/checkpoints.md` | prose |
> | `@~/.claude/agents/gsd-advisor-researcher.md` | prose |
> | `@~/.claude/get-shit-done/templates/spec.md` | prose |
> | (and ~26 additional prose refs) | prose |
>
> **Conditional refs** (inside a `${...}` JS template literal expression, passed through by Eta):
>
> | Entry (advisory — current as of 2026-06-12) | Class |
> |----------------------------------------------|-------|
> | `@~/.claude/get-shit-done/references/executor-examples.md` | conditional |

The three paths must be named explicitly because the skills `wrappedConverter` path was found
only via post-milestone audit; naming it keeps the coverage gap from silently reopening.

Consequence of violating this invariant: an unrendered `<%~ include('...') %>` directive ships
in an installed file as literal template syntax, or an `@~/.claude/` reference that should have
been inlined survives as an unresolved path — both produce broken prompt content in the installed
runtime. If the skills `wrappedConverter` path is omitted from `renderEtaContent`, any `<%~`
include directive in a source command file silently passes through as literal syntax in the
installed SKILL.md.

---

**04-INV-2** — When `renderEtaContent` processes a template containing `<%~ include('path') %>`,
the system MUST resolve the referenced file path relative to the views root and inline its full
content into the rendered output in place of the directive.

Consequence of violating this invariant: include directives pass through unexpanded as literal
`<%~ include('...') %>` template syntax, shipping unrendered template directives to end users
in installed prompt-corpus files.

---

**04-INV-3** — The Eta engine MUST render with `autoEscape: false` so that included content is
emitted verbatim without HTML-entity escaping; `<%~` MUST emit raw (unescaped) output; and
include paths MUST be resolved by joining the views root with the template path (the
`resolvePath` override joins `viewsRoot` and `templatePath`).

This invariant has no standalone test that isolates engine config in a flip-and-observe
manner. Its observable evidence is shared with 04-INV-1 and 04-INV-2: the fact that
`'Full Claude runtime install leaves no unrendered <%~ Eta directives in any installed .md
file'` passes (all `<%~` directives are consumed, confirming the engine is active and
processing them) and the fact that `'Eta rendering of gsd-executor.md inlines "Mandatory
Initial Read" from mandatory-initial-read.md'` passes with real Markdown content intact
(confirming `autoEscape: false` and that the `resolvePath` override resolves the include
correctly). This shared-evidence tracing is acceptable — QUAL-02 requires each MUST invariant
to trace to a real subtest, not a dedicated one. The design choices behind this observable
contract are recorded as Key Decisions (KD-B).

Consequence of violating this invariant: HTML-escapeable characters (`<`, `>`, `&`, `"`) in
included content are corrupted on install, breaking XML/HTML examples and any prompt content
using these characters. Changing the delimiter configuration breaks every existing
`<%~ include() %>` directive in the corpus and invalidates the `<%~` survivor scan in
TEST-01b.

---

**04-INV-4** — When `renderEtaContent` processes a file that directly or transitively includes
itself, the system MUST throw a descriptive `Error` whose message names the offending source
path, and MUST NOT propagate a raw `RangeError`.

The contract is "names the offending source path" — the absolute path of the circular source
file appears in the error message. The exact prefix text of the message (e.g., "Circular
include detected in:") is advisory implementation detail; the behavioral contract is that
the error is a descriptive `Error` (not a `RangeError`) and that the path is present in
the message.

Consequence of violating this invariant: a raw `RangeError` ("Maximum call stack size
exceeded") surfaces with no context, making circular-include bugs opaque to template authors;
or a circular include causes a silent infinite loop with no actionable error at all.

---

**04-INV-5** — When `renderEtaContent` processes a file that includes a nonexistent path, the
system MUST surface an `EtaFileResolutionError` — the upstream Eta v4 class imported from the
`eta` package, not a custom error — whose message names the missing filename.

`EtaFileResolutionError` is not caught and rethrown by `renderEtaContent`. The implementation's
try/catch wraps only `RangeError` (for circular-include detection per 04-INV-4); any other
error, including `EtaFileResolutionError`, is rethrown as-is. This means `EtaFileResolutionError`
bubbles up naturally from the Eta v4 engine's `resolvePath` + file-read layer.

Consequence of violating this invariant: a missing include either produces empty output
silently or throws an opaque generic error with no actionable filename, making typos in
include paths invisible during installation.

## Acceptance Tests

| Invariant | Test File | Subtest / Assertion Shape |
|-----------|-----------|--------------------------|
| 04-INV-1 | tests/install-eta-regression.test.cjs | `'Full Claude runtime install leaves no non-allowlisted @~/.claude/ refs in any installed .md file'` |
| 04-INV-1 | tests/install-eta-regression.test.cjs | `'Full Claude runtime install leaves no unrendered <%~ Eta directives in any installed .md file'` |
| 04-INV-2 | tests/install-eta-regression.test.cjs | `'Eta rendering of gsd-executor.md inlines "Mandatory Initial Read" from mandatory-initial-read.md'` |
| 04-INV-3 | tests/install-eta-regression.test.cjs | `'Eta rendering of gsd-executor.md inlines "Mandatory Initial Read" from mandatory-initial-read.md'` — inlining succeeds with content intact (autoEscape: false, raw <%~ output, resolvePath active) |
| 04-INV-3 | tests/install-eta-regression.test.cjs | `'Full Claude runtime install leaves no unrendered <%~ Eta directives in any installed .md file'` — all <%~ directives consumed (engine active across all copy paths) |
| 04-INV-4 | tests/install-eta-regression.test.cjs | `'Self-referencing include throws Error with fixture path in message'` |
| 04-INV-5 | tests/install-eta-regression.test.cjs | `'Include of nonexistent file throws EtaFileResolutionError naming the missing path'` |

## Key Decisions

### (a) Eta v4 over custom `resolveIncludes()` (KD-A)

The install-time content materialization pipeline uses Eta v4 (`<%~ include() %>` directives,
`renderEtaContent`) rather than the bespoke `resolveIncludes()` resolver written in Phase 44
as a stepping-stone toward a template engine. Eta v4 is a production-grade zero-config
template engine with proper include resolution, well-defined error contracts
(`EtaFileResolutionError` for missing files, descriptive `Error` for circular includes), and
no bespoke edge-case logic to maintain. The `resolveIncludes()` stepping stone is listed in
`INDEX.md` `## Excluded from Scope` — a reimplementer MUST NOT carry it forward. Tier-1
evidence: `tests/install-eta-regression.test.cjs` TEST-01 (full install walk confirms all
three copy paths render correctly) and TEST-03 (direct `renderEtaContent` invocation confirms
inlining behavior).

**Settled — do not reopen.** Consequence of reopening: reintroduces the bespoke resolver that
Eta v4 superseded, losing circular-include detection (TEST-04), proper missing-file errors
(TEST-05), and the zero-config include pipeline; any source files converted from `@~/` refs to
`<%~ include() %>` would need reconversion to the custom resolver's format.

---

### (b) Default Eta delimiters — `<%`/`%>` with `<%~` for raw output (KD-B)

The Eta engine uses its default delimiters (`<%`/`%>`) and raw-output marker (`<%~`) with no
custom `tags` configuration. All source files in the corpus use `<%~ include() %>` syntax
(converted from `@~/` refs in Phase 45 / v2.1.0-c); no custom delimiter was ever applied.
The `autoEscape: false` engine config is the observable complement of this choice: with default
delimiters, `<%~` is the raw-output tag and all included content is emitted verbatim. Tier-1
evidence: TEST-01b scans for the literal string `'<%~'` as its survivor-detection pattern —
having the scan keyed on `'<%~'` is itself a normative assertion that `<%~` is the operative
raw-output marker under the default delimiter configuration.

**Settled — do not reopen.** Consequence of reopening: every `<%~ include() %>` directive in
the source corpus would need rewriting to match the new delimiter; the TEST-01b `<%~` survivor
scan pattern (`line.includes('<%~')`) would need updating; and the corpus-scanner expectations
in `tests/install-eta-regression.test.cjs` would break.

## Code Context

<!-- advisory -->

The items below are current as of 2026-06-12. All file paths, function names, regex bodies,
and line numbers are advisory and will shift on any source edit or upstream refactor. No
normative invariant depends on these paths or symbols — a reimplementer rebuilds the pipeline
from the behavioral contract in §Invariants and §Key Decisions above.

**Correction note:** The symbol `_copyCommandsAsSkillsViaConverter` appears in `bin/install.js`
only as a JSDoc historical name. It is NOT a current function in the codebase. The real skills
copy path is the `wrappedConverter` closure defined in
`get-shit-done/bin/lib/runtime-artifact-layout.cjs` at lines ~198–201.

---

### `bin/install.js` — advisory

| Symbol | What it does | Line (advisory) |
|--------|--------------|-----------------|
| `const _etaSourceRoot = path.join(__dirname, '..')` | Computes the repo root as the views root for Eta at module scope | ~1772 |
| `function renderEtaContent(content, srcPath, viewsRoot)` | Renders a single `.md` file through Eta v4; creates a fresh `Eta` instance per call | ~6452 |
| `new Eta({ views: viewsRoot, useWith: true, autoEscape: false })` | Engine config literals — `autoEscape: false` is the normative observable (04-INV-3) | ~6453–6457 |
| `renderEta.resolvePath = function(templatePath, _options) { return path.join(viewsRoot, templatePath); }` | Custom `resolvePath` override — resolves include paths by joining views root with template path | ~6458–6460 |
| `renderEta.renderString(content, {})` | Actual render call; empty data object (no dynamic vars in templates) | ~6462 |
| `if (e instanceof RangeError) { throw new Error('Circular include detected in: ' + srcPath); }` | Catches Eta's stack-overflow `RangeError` and rethrows a descriptive `Error` naming `srcPath` | ~6464–6466 |
| Call site 1: `content = renderEtaContent(content, srcPath, _etaSourceRoot)` | Inside `copyWithPathReplacement` — commands/workflows copy path | ~6515 |
| Call site 2: `content = renderEtaContent(content, srcPath, _etaSourceRoot)` | Inside the agent-copy loop | ~8731 |
| `module.exports = { ..., renderEtaContent, ... }` | Export; consumed by `runtime-artifact-layout.cjs` via `getInstallExports()` | ~11551 |

---

### `get-shit-done/bin/lib/runtime-artifact-layout.cjs` — advisory (the skills `wrappedConverter` path)

| Symbol | What it does | Line (advisory) |
|--------|--------------|-----------------|
| `function skillsKind(destSubpath, prefix, converterName, runtime, configDir)` | Builder for the skills layout descriptor | ~184 |
| `const etaViewsRoot = path.join(srcCommandsDir, '..', '..')` | Resolves repo root as views root — same root as `_etaSourceRoot` in `install.js` | ~197 |
| `const wrappedConverter = (content, skillName) => { const rendered = installExports.renderEtaContent(content, skillName, etaViewsRoot); return realConverter(rendered, skillName, runtime, cmdNames); }` | Wraps `renderEtaContent` before calling the per-runtime skill converter — this is the skills copy path | ~198–201 |
| `return stageSkillsForRuntimeAsSkills(srcCommandsDir, resolved, wrappedConverter, prefix)` | Stages skills through the `wrappedConverter`, exercising Eta rendering for every skill file | ~202 |
| `skillsKind('skills', 'gsd-', 'convertClaudeCommandToClaudeSkill', 'claude', configDir)` | The Claude global install layout descriptor — uses the `wrappedConverter` path for all skills | ~239 |

**Skills path call chain (advisory):** `installRuntimeArtifacts('claude', configDir, 'global', resolvedProfile)`
→ `resolveRuntimeArtifactLayout('claude', configDir, 'global')` → `skillsKind(...)` descriptor
→ `kind.stage(resolvedProfile)` → `stageSkillsForRuntimeAsSkills(...)` calls `wrappedConverter`
for each command file → `wrappedConverter` calls `renderEtaContent(content, skillName, etaViewsRoot)`
before `convertClaudeCommandToClaudeSkill`. This chain is why the skills path is invisible to a
grep on `renderEtaContent` at the top level of `install.js`.

---

### `tests/install-eta-regression.test.cjs` — advisory

| Symbol | What it does | Line (advisory) |
|--------|--------------|-----------------|
| `const ALLOWED_INLINE_REFS` | Module-scope array of 30 allowlisted `@~/.claude/` paths (30 entries, current as of 2026-06-12) | ~40–96 |
| `const { renderEtaContent } = require('../bin/install.js')` | Direct import of the function under test | ~19 |
| `const { installRuntimeArtifacts } = require('../bin/install.js')` | Full pipeline import for TEST-01 full-install walk | ~20 |
| `const { EtaFileResolutionError } = require('eta')` | Upstream Eta v4 class imported for the TEST-05 type assertion | ~21 |
| `const REPO_ROOT = path.join(__dirname, '..')` | Repo root constant used in TEST-03 direct invocation | ~25 |
| `walkDir(dir)` | Recursive `.md` walker for TEST-01a — checks `@~/.claude/` occurrences against `ALLOWED_INLINE_REFS` | ~113–141 |
| `walkDirEta(dir)` | Recursive `.md` walker for TEST-01b — checks for any line containing `<%~` | ~166–184 |

All line numbers are advisory and shift on any test edit.
