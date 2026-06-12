# Phase 71: spec-04 Eta Materialization — Research

**Researched:** 2026-06-12
**Domain:** Specification authoring — Eta v4 install-time content materialization behavioral contract
**Confidence:** HIGH (all claims derived directly from reading test files and implementation sources in this session)

This is a SPEC-AUTHORING phase, not a code-change phase. There is no external stack to
research, no packages to install, no environment to probe, and no coverage sampling to
design. The single normative source — `tests/install-eta-regression.test.cjs` (271 lines,
fully read this session) — is the evidence and the structure. The standard RESEARCH template
sections for code-building phases (Standard Stack, Package Legitimacy Audit, Don't Hand-Roll,
Environment Availability, Security Domain) are intentionally omitted as not-applicable.
`nyquist_validation` is explicitly `false` in `.planning/config.json`, so the Validation
Architecture section is also omitted.

All line numbers in this file cite `tests/install-eta-regression.test.cjs` at HEAD on branch
`spec`. Tag them `<!-- advisory -->` in `## Code Context` per QUAL-03 — they shift on any
test edit.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 — Invariant decomposition by behavioral role.** Target ~5 numbered invariants
  (`04-INV-1`..`04-INV-5`):
  1. **Copy-path materialization coverage** — Eta rendering runs on every install copy path,
     such that no unrendered `<%~` directive and no non-allowlisted `@~/.claude/` include
     survives in any installed `.md` file (see D-02 for the all-paths framing, D-04 for the
     allowlist rule). Tier-1: TEST-01 (both subtests — non-allowlisted `@~/.claude/` walk +
     surviving-`<%~` walk).
  2. **Include inlining** — a `<%~ include('path') %>` directive resolves the referenced
     fragment and inlines its content into the rendered output (TEST-03: `gsd-executor.md`
     inlines "Mandatory Initial Read" from `mandatory-initial-read.md`).
  3. **Engine configuration (observable)** — the engine renders with `autoEscape: false`
     (included content is NOT HTML-escaped), `<%~` emits raw output verbatim, and a custom
     `resolvePath` resolves include paths against the views/repo root (see D-03; observable
     via TEST-03 inlining success + TEST-01 absence of escape artifacts).
  4. **Circular-include failure** — a self-referencing / circular include throws a
     **descriptive `Error`** naming the offending source path, never a raw `RangeError`
     (TEST-04).
  5. **Missing-include failure** — an include of a nonexistent file throws
     **`EtaFileResolutionError`** naming the missing filename (TEST-05).

- **D-02 — `04-INV-1` is ONE invariant covering all copy paths, with the skills
  `wrappedConverter` path named explicitly as a sub-clause.** `renderEtaContent` is invoked
  at two literal call sites — `install.js:6515` (command/workflow files via
  `copyWithPathReplacement`) and `install.js:8731` (agent files) — while the **skills
  converter path** is materialized through the `wrappedConverter` closure in
  `runtime-artifact-layout.cjs` (the `skillsKind` builder at line 198–201) and is covered
  only by TEST-01's full-install walk. The invariant text MUST name the three paths so the
  gap that was **found only via post-milestone audit** can never silently reopen.

- **D-03 — Engine config is both a MUST invariant (observable behavior) AND locked Key
  Decisions (design intent).** `04-INV-3` asserts the observable contract (`autoEscape:
  false`, raw `<%~` output, include paths resolve against views root). The design choices
  ("Eta v4 over custom `resolveIncludes()`" and "Default Eta delimiters") are recorded in
  `## Key Decisions` as settled.

- **D-04 — `ALLOWED_INLINE_REFS` exception is normative as a behavioral RULE; the ~30
  specific entries are a dated, advisory enumeration.** The durable contract: an installed
  `@~/.claude/` reference is permitted only when it is an intentional AI-instruction prose
  ref or a `${…}`-preserved conditional; an Eta include ref that should have been inlined,
  and any surviving `<%~` tag, are violations. The ~30 entries appear as a supporting list
  marked `current as of 2026-06-12`.

- **D-05 — Key Decisions records "Eta v4 over custom `resolveIncludes()`" and "Default Eta
  delimiters" as Settled — do not reopen.**

### Claude's Discretion

- Exact EARS pattern choice per invariant.
- Exact subtest/assertion-shape strings in the Acceptance Tests table (this RESEARCH.md
  supplies them verbatim).
- Whether `04-INV-3` renders as one invariant or splits the resolve-path clause to a 6th
  invariant if overloaded.
- Whether the `ALLOWED_INLINE_REFS` supporting enumeration renders as a table or bullet
  list, and whether to abbreviate the ~30 entries to representative classes.
- Confidence value to stamp in frontmatter when the body is finalized.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SPEC-04 | `04-eta-materialization/SPEC.md` specifies Eta v4 install-time content materialization — engine config (default delimiters, `autoEscape: false`, `<%~` raw output), `<%~ include() %>` conversion from `@~/` refs, the `ALLOWED_INLINE_REFS` exception list, and coverage of every copy path including the skills `wrappedConverter` | All five behavioral roles verified against `tests/install-eta-regression.test.cjs`; advisory symbols inventoried from implementation sources. Section 3 (invariant→subtest mapping) and Section 5 (advisory symbol inventory) enable direct authoring. |
| QUAL-01 | Each spec states behavioral invariants as numbered, falsifiable EARS statements with RFC 2119 strength | Section 3 provides EARS-phraseable claim per invariant; every invariant maps to a real subtest cluster. |
| QUAL-02 | Each spec has an Acceptance-Tests traceability table mapping each MUST-level invariant to a test file and subtest name | Section 3 maps each of the 5 invariants to real subtest names (exact strings from the file). |
| QUAL-03 | Each spec separates normative contract from advisory implementation notes; current file path or symbol marked `<!-- advisory -->` | Section 5 lists all advisory symbols; D-02/D-04 clarify what is normative vs advisory. |
| QUAL-04 | Each spec cites at least one tier-1 (test) or tier-2 (source) artifact | `tests/install-eta-regression.test.cjs` is cited as tier-1 in every Acceptance Tests row. |
| QUAL-05 | Each spec has a Key Decisions section recording settled decisions with rationale, marked "settled — do not reopen", with the consequence of reopening stated inline | Two ROADMAP-mandated Key Decisions (D-05) verified; their consequences mapped in Section 4. |
</phase_requirements>

---

## Summary

Phase 71 authors the body of `.planning/spec/04-eta-materialization/SPEC.md`, filling the
stub created in Phase 68. This is a narration phase: `tests/install-eta-regression.test.cjs`
is the tier-1 source-of-truth and the SPEC.md faithfully narrates what it asserts. No code
is written or modified.

The Eta v4 materialization pipeline spans three copy paths: command/workflow files (via
`copyWithPathReplacement`, `install.js:6515`), agent files (`install.js:8731`), and the
skills `wrappedConverter` path (defined in
`get-shit-done/bin/lib/runtime-artifact-layout.cjs:198–201` inside the `skillsKind` closure)
— the third path was found only via a post-milestone audit. Five behavioral-role invariants
cover the system end-to-end with no overlap and no MISSING rows in the traceability table.

The Phase 69/70 sibling specs (`01-positive-framing/SPEC.md`, `02-sha-versioning/SPEC.md`)
are the direct shape references: section order, EARS phrasing, advisory-marking, invariant +
Key-Decision split pattern, and the `<!-- advisory -->` Code Context layout are all
inherited from there.

**Primary recommendation:** Read Section 3 to get the exact subtest names; use Phase 69/70
SPEC.md files as the layout template; stamp both ROADMAP Key Decisions as settled with the
consequence of reopening; mark all implementation symbols `<!-- advisory -->`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Eta template rendering | Install script (`bin/install.js` + `runtime-artifact-layout.cjs`) | — | `renderEtaContent` executes at install time, not at runtime; it is a build/install-time step that materializes `.md` files before copying them to the runtime config directory |
| Include path resolution | `renderEtaContent` / Eta v4 engine | — | Custom `resolvePath` override resolves every `include(path)` against `_etaSourceRoot` (the repo root); no runtime component is involved |
| Copy-path coverage gating | `installRuntimeArtifacts` (layout-driven) | `copyWithPathReplacement` (legacy two-call-site path) | The layout-driven path goes through `skillsKind`/`wrappedConverter`; the legacy path uses two inline `renderEtaContent` calls |
| Exception allowlist | Source text + test constant (`ALLOWED_INLINE_REFS`) | — | The allowlist is a test-layer enforcement artifact; the source files carry the prose refs by design |

---

## Section 1: Test Structure — describe/test block names (verbatim)

The entire test file is 271 lines. No TEST-02 block exists in the file — the header comment
mentions TEST-01 through TEST-05, but the test file only implements TEST-01, TEST-03, TEST-04,
and TEST-05. TEST-02 is absent.

### TEST-01 — lines 100–198

**describe:** `'TEST-01: No unexpected @~/.claude/ references survive in full Claude install output'`

Contains two `test` blocks:

**TEST-01a** (line 104):
`'Full Claude runtime install leaves no non-allowlisted @~/.claude/ refs in any installed .md file'`
- Calls `installRuntimeArtifacts('claude', tmpDir, 'global', RESOLVED_CORE)`.
- Walks every `.md` file in `tmpDir` via `walkDir()`.
- For every `@~/.claude/` occurrence, checks if any ALLOWED_INLINE_REFS entry is a
  substring; any non-covered occurrence is collected as `unexpected`.
- `assert.fail(...)` if `unexpected.length > 0`.

**TEST-01b** (line 158):
`'Full Claude runtime install leaves no unrendered <%~ Eta directives in any installed .md file'`
- Calls `installRuntimeArtifacts('claude', tmpDir, 'global', RESOLVED_CORE)` (separate
  temp dir via `createTempDir('gsd-eta-test01b-')`).
- Walks every `.md` file via `walkDirEta()`.
- Any line containing `<%~` is collected as `etaSurvivors`.
- `assert.fail(...)` if `etaSurvivors.length > 0`.

**Key detail for invariant authoring:** both subtests exercise the full installed tree
(commands, workflows, agents, skills) because `installRuntimeArtifacts('claude', ...)` goes
through the layout-driven pipeline that calls all three copy paths. The walk checks every
`.md` file under `tmpDir` without path-filtering.

### TEST-03 — lines 202–219

**describe:** `'TEST-03: Inlined reference content present after Eta rendering of gsd-executor.md'`

**test** (line 203):
`'Eta rendering of gsd-executor.md inlines "Mandatory Initial Read" from mandatory-initial-read.md'`
- Reads `agents/gsd-executor.md` from the repo root (`REPO_ROOT`).
- Calls `renderEtaContent(source, srcPath, REPO_ROOT)` directly.
- Asserts `rendered.includes('Mandatory Initial Read')`.

**Assertion shape:** `assert.ok(rendered.includes('Mandatory Initial Read'), 'Eta rendering
of gsd-executor.md missing "Mandatory Initial Read" — Eta failed to inline
mandatory-initial-read.md')`.

**Why this tests the engine config:** this test exercises the real `renderEtaContent` call
signature. If `autoEscape: false` were changed to `true`, HTML-escaped output would survive
the `includes` check (because "Mandatory Initial Read" contains no HTML-escapeable
characters), but for fragments with `<`, `>`, `&` content, the rendered output would be
corrupted. The `autoEscape: false` contract is observable via the fact that TEST-03 passes
with real included content in place.

### TEST-04 — lines 223–244

**describe:** `'TEST-04: Circular include detection'`

**test** (line 227):
`'Self-referencing include throws Error with fixture path in message'`
- Writes `a.md` containing `<%~ include('a.md') %>` to a temp dir.
- Calls `renderEtaContent(content, fixturePath, tmpDir)`.
- `assert.throws(...)` with a validator that checks:
  1. `!(err instanceof RangeError)` — the error is NOT a raw RangeError.
  2. `err.message.includes(fixturePath)` — the fixture path appears in the message.

**Assertion shapes (verbatim from test):**
- `assert.ok(!(err instanceof RangeError), 'Should be a descriptive Error, not raw RangeError')`
- `assert.ok(err.message.includes(fixturePath), 'Error message should contain fixture path.\nGot: ' + err.message)`

**Critical detail:** the message check is `err.message.includes(fixturePath)` where
`fixturePath` is the absolute path of the fixture file (e.g. `/tmp/gsd-eta-test04-XYZ/a.md`).
The implementation catches `RangeError` and rethrows `new Error('Circular include detected in:
' + srcPath)`. The invariant should state the path is included in the message — "naming the
offending source path" — not the exact prefix text.

### TEST-05 — lines 248–270

**describe:** `'TEST-05: Missing-file include throws EtaFileResolutionError'`

**test** (line 252):
`'Include of nonexistent file throws EtaFileResolutionError naming the missing path'`
- Writes `bad-include.md` containing `<%~ include('nonexistent-path-xyz.md') %>` to temp dir.
- Calls `renderEtaContent(content, fixturePath, tmpDir)`.
- `assert.throws(...)` with a validator that checks:
  1. `err instanceof EtaFileResolutionError` — the upstream Eta class is used directly.
  2. `err.message.includes('nonexistent-path-xyz.md')` — the missing filename is in the message.

**Assertion shapes (verbatim from test):**
- `assert.ok(err instanceof EtaFileResolutionError, 'Expected EtaFileResolutionError, got ' + err.constructor.name)`
- `assert.ok(err.message.includes('nonexistent-path-xyz.md'), 'Error message should contain missing filename.\nGot: ' + err.message)`

**Critical detail:** `EtaFileResolutionError` is imported from `'eta'` at line 21 of the
test file. The invariant must name this specific class (from the Eta v4 public API) — it is
NOT a custom error class, it IS the upstream Eta library's error type.

---

## Section 2: ALLOWED_INLINE_REFS — the dated exception allowlist

Defined as a module-scope `const ALLOWED_INLINE_REFS` array at **lines 40–96**. Count: **30
entries** (current as of 2026-06-12 — advisory per D-04).

Classification comments in the test file group them into two categories:
- `'prose'` — agent/workflow instruction text ("Read @~/.claude/…") — the model is directed
  to read a file at that path; the `@~/.claude/` string is intentional prose.
- `'conditional'` — inside `${...}` JS template literal expression preserved by Eta; the
  `@~/.claude/` is inside a conditional expression that Eta passes through unrendered.

**Representative entries (advisory — current as of 2026-06-12):**

Prose refs: `@~/.claude/get-shit-done/references/project-skills-discovery.md`,
`@~/.claude/get-shit-done/references/checkpoints.md`,
`@~/.claude/agents/gsd-advisor-researcher.md`,
`@~/.claude/get-shit-done/templates/spec.md`, and ~26 more.

Conditional ref (one entry): `@~/.claude/get-shit-done/references/executor-examples.md` —
comment: `get-shit-done/workflows/execute-phase.md (conditional — inside ${...} expression)`.

**The normative rule (per D-04):** an installed `@~/.claude/` reference is permitted when
it is classified as intentional AI-instruction prose or a `${...}`-preserved conditional.
Any `@~/.claude/` occurrence NOT in ALLOWED_INLINE_REFS — i.e., an Eta include ref that
should have been materialized by `renderEtaContent` — is a violation. The list itself is
the dated enumeration; the rule is the durable contract.

**Note for the spec author:** the "surviving `<%~`" half (TEST-01b) needs NO allowlist — any
`<%~` survivor is always a violation. This is stated explicitly in the test file's comment
at line 163: "Any surviving `<%~` tag in installed output is always a bug — no allowlist
needed (D-03)."

---

## Section 3: Invariant → Subtest Mapping (Core Planner Input)

Maps the five D-01 invariants to their backing subtest clusters, with EARS-phraseable
claims and the verbatim subtest names for the Acceptance Tests table.

---

### `04-INV-1` — Copy-path materialization coverage

**EARS claim (Ubiquitous MUST):** The system MUST run `renderEtaContent` on every installed
`.md` file across all copy paths (commands/workflows, agents, and skills `wrappedConverter`)
such that no non-allowlisted `@~/.claude/` reference and no `<%~` Eta directive survives in
the installed output.

**Subtest names from `tests/install-eta-regression.test.cjs`:**

| describe block | test name | What it asserts |
|---|---|---|
| `'TEST-01: No unexpected @~/.claude/ references survive in full Claude install output'` | `'Full Claude runtime install leaves no non-allowlisted @~/.claude/ refs in any installed .md file'` | No `@~/.claude/` occurrence outside ALLOWED_INLINE_REFS survives in any installed `.md` file |
| `'TEST-01: No unexpected @~/.claude/ references survive in full Claude install output'` | `'Full Claude runtime install leaves no unrendered <%~ Eta directives in any installed .md file'` | No `<%~` tag survives in any installed `.md` file (no allowlist needed — any survivor is a bug) |

**Why TEST-01 covers all three copy paths:** `installRuntimeArtifacts('claude', tmpDir,
'global', RESOLVED_CORE)` is the call used in the test. The `claude` + `global` combination
invokes the layout-driven skills path through `skillsKind`/`wrappedConverter` (line 239 of
`runtime-artifact-layout.cjs`). The walk covers the entire `tmpDir` including skills/gsd-*/
SKILL.md files. If the skills wrappedConverter failed to call `renderEtaContent`, any
`<%~` include directive in a source command file would survive as a `<%~` tag in the
installed SKILL.md and TEST-01b would catch it. This is the only invariant that traces to
TEST-01.

**EARS pattern recommendation:** Ubiquitous — "The system MUST…". Sub-clause D-04 rule
(the `ALLOWED_INLINE_REFS` exception) appears as a supporting RULE under this invariant,
marked `current as of 2026-06-12`. See Section 2 for the 30-entry list.

**Consequence of violating:** An unrendered `<%~ include() %>` directive ships in an
installed file, or an `@~/.claude/` reference that should have been inlined survives,
producing broken prompt content with literal template syntax or unresolved paths in the
installed runtime.

---

### `04-INV-2` — Include inlining

**EARS claim (Event-driven MUST):** When `renderEtaContent` processes a template containing
`<%~ include('path') %>`, the system MUST resolve the referenced file path relative to the
views root and inline its full content into the rendered output.

**Subtest names from `tests/install-eta-regression.test.cjs`:**

| describe block | test name | What it asserts |
|---|---|---|
| `'TEST-03: Inlined reference content present after Eta rendering of gsd-executor.md'` | `'Eta rendering of gsd-executor.md inlines "Mandatory Initial Read" from mandatory-initial-read.md'` | `rendered.includes('Mandatory Initial Read')` — content from the included file appears in the output |

**Specific fragment:** `gsd-executor.md` contains `<%~ include('get-shit-done/references/
mandatory-initial-read.md') %>` (test file comment: "Eta resolves the include directive at
line 21"). The assertion checks that the string `'Mandatory Initial Read'` appears in the
rendered output — the title/heading from the referenced fragment.

**EARS pattern recommendation:** Event-driven — "When the renderer processes a source file
containing `<%~ include('path') %>`, the system MUST…".

**Consequence of violating:** Include directives pass through unexpanded as literal template
syntax, shipping `<%~ include('...') %>` text to end users in installed files.

---

### `04-INV-3` — Engine configuration (observable)

**EARS claim (Ubiquitous MUST):** The Eta engine MUST render with `autoEscape: false` so
that included content is emitted verbatim without HTML-entity escaping; `<%~` MUST emit raw
(unescaped) output; and include paths MUST be resolved by joining the views root with the
template path.

**Observable evidence:** TEST-03 (include inlining succeeds with real Markdown content
intact) demonstrates `autoEscape: false` and raw `<%~` output. TEST-01 (no surviving `<%~`
directives in a full install) provides the corpus-level confirmation that `<%~` directives
are consumed by the engine, not passed through.

**Note:** There is no standalone test that flips `autoEscape: true` and proves corruption.
The observable contract is "include directives are consumed and content appears unchanged."
The implementation evidence (the `new Eta({ views, useWith: true, autoEscape: false })` and
`resolvePath` override at `install.js:6452–6468`) is advisory but narrated in Code Context.

**Acceptance Tests row:** This invariant does NOT have a dedicated test asserting just the
engine config in isolation — it shares the TEST-03 and TEST-01 evidence with `04-INV-2` and
`04-INV-1`. The traceability table should cite both:

| Invariant | Test File | Subtest / Assertion Shape |
|-----------|-----------|--------------------------|
| 04-INV-3 | tests/install-eta-regression.test.cjs | `'Eta rendering of gsd-executor.md inlines "Mandatory Initial Read" from mandatory-initial-read.md'` — inlining succeeds (autoEscape: false, raw <%~ output) |
| 04-INV-3 | tests/install-eta-regression.test.cjs | `'Full Claude runtime install leaves no unrendered <%~ Eta directives in any installed .md file'` — all <%~ directives consumed (engine active) |

**EARS pattern recommendation:** Ubiquitous — "The system MUST render with…". Engine config
is also a Key Decision (D-03/D-05 — see Section 4).

**Claude's Discretion note:** If the resolve-path clause makes this invariant feel overloaded,
the planner may split it to `04-INV-6`: "Include paths MUST be resolved by joining the views
root with the template path." Either approach satisfies QUAL-01.

**Consequence of violating:** HTML-escapeable characters in included content (`<`, `>`, `&`,
`"`) are corrupted on install, breaking XML/HTML examples and any prompt content that uses
these characters. Changing delimiters breaks every existing `<%~ include() %>` directive in
the corpus.

---

### `04-INV-4` — Circular-include failure

**EARS claim (Unwanted-behavior MUST NOT):** When `renderEtaContent` encounters a circular
include (a file that, directly or transitively, includes itself), it MUST throw a descriptive
`Error` whose message names the offending source path, and MUST NOT propagate a raw
`RangeError`.

**Subtest names from `tests/install-eta-regression.test.cjs`:**

| describe block | test name | What it asserts |
|---|---|---|
| `'TEST-04: Circular include detection'` | `'Self-referencing include throws Error with fixture path in message'` | `!(err instanceof RangeError)` AND `err.message.includes(fixturePath)` |

**Assertion shapes (verbatim):**
- `assert.ok(!(err instanceof RangeError), 'Should be a descriptive Error, not raw RangeError')`
- `assert.ok(err.message.includes(fixturePath), 'Error message should contain fixture path.\nGot: ' + err.message)`

**What the implementation does (advisory):** `renderEtaContent` catches `e instanceof
RangeError` and rethrows `new Error('Circular include detected in: ' + srcPath)`. The
`RangeError` is Eta v4's stack overflow when include depth exceeds the call-stack limit.

**EARS pattern recommendation:** Unwanted-behavior — "If `renderEtaContent` processes a
file that directly or transitively includes itself, the system MUST throw an `Error` naming
the source path and MUST NOT propagate a raw `RangeError`."

**Consequence of violating:** A raw `RangeError` ("Maximum call stack size exceeded") surfaces
with no context, making circular-include bugs opaque to authors; or a circular include causes
a silent infinite loop.

---

### `04-INV-5` — Missing-include failure

**EARS claim (Unwanted-behavior / Event-driven MUST):** When `renderEtaContent` processes a
file that includes a nonexistent path, the system MUST throw an `EtaFileResolutionError` (the
Eta v4 upstream class, imported from the `eta` package) whose message names the missing
filename.

**Subtest names from `tests/install-eta-regression.test.cjs`:**

| describe block | test name | What it asserts |
|---|---|---|
| `'TEST-05: Missing-file include throws EtaFileResolutionError'` | `'Include of nonexistent file throws EtaFileResolutionError naming the missing path'` | `err instanceof EtaFileResolutionError` AND `err.message.includes('nonexistent-path-xyz.md')` |

**Assertion shapes (verbatim):**
- `assert.ok(err instanceof EtaFileResolutionError, 'Expected EtaFileResolutionError, got ' + err.constructor.name)`
- `assert.ok(err.message.includes('nonexistent-path-xyz.md'), 'Error message should contain missing filename.\nGot: ' + err.message)`

**Critical distinction from `04-INV-4`:** This error is NOT caught and rethrown by
`renderEtaContent` — it is Eta v4's own `EtaFileResolutionError` bubbling up naturally from
the `resolvePath` + file-read layer. The implementation's try/catch only wraps `RangeError`;
any other error (including `EtaFileResolutionError`) is rethrown as-is (`throw e` at
`install.js:6467`). The invariant should state that `EtaFileResolutionError` is the Eta v4
upstream class (imported from `'eta'`), not a custom error.

**EARS pattern recommendation:** Unwanted-behavior or Event-driven — "When the renderer
encounters an include of a nonexistent file, the system MUST surface an
`EtaFileResolutionError` naming the missing filename."

**Consequence of violating:** A missing include either silently produces empty output or
throws an opaque generic error with no actionable filename, making typos in include paths
invisible during installation.

---

## Section 4: Key Decisions — Settled Decisions and Consequences

The two ROADMAP-mandated Key Decisions (D-05) are:

### KD-A: Eta v4 over custom `resolveIncludes()` (from Phase 45 / v2.1.0-c)

**Decision:** The install-time content materialization pipeline uses Eta v4 (`<%~ include()
%>` directives, `renderEtaContent`, production-grade engine) rather than the bespoke
`resolveIncludes()` function written in Phase 44 as a stepping-stone.

**Rationale:** Eta v4 is a production-grade zero-config template engine with proper include
resolution, error handling (`EtaFileResolutionError`), and a well-defined delimiter contract;
the custom resolver had growing edge-case complexity and lacked circular-include detection.

**INDEX.md entry:** The `resolveIncludes()` stepping stone is listed in INDEX.md
`## Excluded from Scope` — a reimplementer MUST NOT carry it forward.

**Settled — do not reopen.** Consequence of reopening: reintroduces the bespoke resolver
that Eta v4 superseded, losing circular-include detection (TEST-04), proper missing-file
errors (TEST-05), and the zero-config include pipeline; any source files converted from
`@~/` refs to `<%~ include() %>` would need reconversion.

**Tier-1 evidence:** All five `renderEtaContent` call-site paths are exercised by
`tests/install-eta-regression.test.cjs` TEST-01 (full install walk) and TEST-03 (direct
invocation).

---

### KD-B: Default Eta delimiters — `<%`/`%>` with `<%~` for raw output

**Decision:** The Eta engine uses its default delimiters (`<%`/`%>`) and raw-output marker
(`<%~`). No custom `tags` configuration is applied.

**Rationale:** All source files in the corpus use `<%~ include() %>` syntax (converted from
`@~/` refs in Phase 45); a custom delimiter would require every include directive to be
rewritten and the TEST-01 `<%~` survivor scan would need a new pattern.

**Settled — do not reopen.** Consequence of reopening: every `<%~ include() %>` directive
in the source corpus would need rewriting to match the new delimiter; the TEST-01b scan
pattern (`line.includes('<%~')`) would need updating; and the corpus scanner expectations
in `tests/install-eta-regression.test.cjs` would break.

**Tier-1 evidence:** TEST-01b scans for `'<%~'` literal — if the delimiter changed, this
scan pattern would also need to change; having the scan keyed on `'<%~'` is itself a
normative assertion that `<%~` is the operative marker.

---

## Section 5: Advisory Symbol Inventory (Code Context)

All items below are marked `<!-- advisory -->`. Paths, symbols, and line numbers will shift
on any upstream refactor.

### `bin/install.js` — advisory

| Symbol | What it does | Line (advisory) |
|--------|--------------|-----------------|
| `const _etaSourceRoot = path.join(__dirname, '..')` | Computes the repo root as the views root for Eta at module scope | ~1772 |
| `function renderEtaContent(content, srcPath, viewsRoot)` | Renders a single file through Eta v4; creates a fresh `Eta` instance per call | 6452 |
| `new Eta({ views: viewsRoot, useWith: true, autoEscape: false })` | Engine config literals | 6453–6457 |
| `renderEta.resolvePath = function(templatePath, _options) { return path.join(viewsRoot, templatePath); }` | Custom resolvePath override | 6458–6460 |
| `if (e instanceof RangeError) { throw new Error('Circular include detected in: ' + srcPath); }` | Circular-include wrapping | 6464–6466 |
| `renderEta.renderString(content, {})` | The actual render call (empty data object — template has no dynamic vars) | 6462 |
| Call site 1: `content = renderEtaContent(content, srcPath, _etaSourceRoot)` | Inside `copyWithPathReplacement` — commands/workflows copy path | 6515 |
| Call site 2: `content = renderEtaContent(content, srcPath, _etaSourceRoot)` | Inside agent-copy loop | 8731 |
| `module.exports = { ..., renderEtaContent, ... }` | Export (used by `runtime-artifact-layout.cjs` via `getInstallExports()`) | ~11551 |

### `get-shit-done/bin/lib/runtime-artifact-layout.cjs` — advisory (the skills wrappedConverter path)

| Symbol | What it does | Line (advisory) |
|--------|--------------|-----------------|
| `function skillsKind(destSubpath, prefix, converterName, runtime, configDir)` | Builder for skills layout descriptor | 184 |
| `const etaViewsRoot = path.join(srcCommandsDir, '..', '..')` | Resolves repo root as views root (same as `_etaSourceRoot`) | 197 |
| `const wrappedConverter = (content, skillName) => { const rendered = installExports.renderEtaContent(content, skillName, etaViewsRoot); return realConverter(rendered, skillName, runtime, cmdNames); }` | Wraps `renderEtaContent` before calling the per-runtime skill converter | 198–201 |
| `return stageSkillsForRuntimeAsSkills(srcCommandsDir, resolved, wrappedConverter, prefix)` | Stages skills with the wrapped converter | 202 |
| `skillsKind('skills', 'gsd-', 'convertClaudeCommandToClaudeSkill', 'claude', configDir)` | The Claude global install layout (uses wrappedConverter path for skills) | 239 |

**Explanation of the skills path (advisory — for Code Context narration):**
1. `installRuntimeArtifacts('claude', configDir, 'global', resolvedProfile)` calls
   `resolveRuntimeArtifactLayout('claude', configDir, 'global')`.
2. For `claude` + `global`, this returns a single `skillsKind` descriptor.
3. When `kind.stage(resolvedProfile)` is called, the `wrappedConverter` closure runs
   `renderEtaContent(content, skillName, etaViewsRoot)` on each command file BEFORE passing
   the rendered content to `convertClaudeCommandToClaudeSkill`.
4. The staged SKILL.md files (in a temp dir) are then path-rewritten by
   `applyRuntimeContentRewritesInPlace` and copied to `destDir`.
5. TEST-01 then walks the entire `destDir` (which includes skills/gsd-*/SKILL.md) and
   confirms no `<%~` survivors.

This three-step chain is why the skills path is "invisible" from a grep-on-`renderEtaContent`
scan — the call is inside `wrappedConverter`, not a top-level `renderEtaContent` invocation.

### `tests/install-eta-regression.test.cjs` — advisory

| Symbol | What it does | Line (advisory) |
|--------|--------------|-----------------|
| `const ALLOWED_INLINE_REFS` | Module-scope array of 30 allowlisted `@~/.claude/` paths | 40–96 |
| `walkDir(dir)` | Recursive walk for TEST-01a (checks `@~/.claude/` occurrences) | 113–141 |
| `walkDirEta(dir)` | Recursive walk for TEST-01b (checks `<%~` occurrences) | 166–184 |
| `const REPO_ROOT = path.join(__dirname, '..')` | Repo root constant for TEST-03 direct invocation | 25 |
| `const { renderEtaContent } = require('../bin/install.js')` | Direct import of the function under test | 19 |
| `const { installRuntimeArtifacts } = require('../bin/install.js')` | Full pipeline import for TEST-01 | 20 |
| `const { EtaFileResolutionError } = require('eta')` | Upstream Eta class imported for TEST-05 assertion | 21 |

---

## Section 6: CONTEXT.md / Test-File Concordance Audit

**Finding: No material mismatches.** All five behavioral roles described in CONTEXT.md D-01
are faithfully backed by real subtest names in the tier-1 file. The following precision notes
apply:

1. **TEST-02 is absent.** CONTEXT.md's canonical_refs and the test file's module comment
   reference TEST-01 through TEST-05, but the file only contains TEST-01, TEST-03, TEST-04,
   and TEST-05. There is no TEST-02 block. The planner should not add a TEST-02 row to the
   Acceptance Tests table.

2. **The skills path is NOT at `_copyCommandsAsSkillsViaConverter`.** CONTEXT.md's
   canonical_refs mention "`_copyCommandsAsSkillsViaConverter`", but this symbol does not
   appear in the current `bin/install.js` source (it appears only in a JSDoc comment as a
   historical name). The actual skills converter path is the `wrappedConverter` closure
   defined in `get-shit-done/bin/lib/runtime-artifact-layout.cjs:198–201`. The planner
   should use the verified symbol name `wrappedConverter` (and file
   `runtime-artifact-layout.cjs`) when authoring Code Context, not
   `_copyCommandsAsSkillsViaConverter`.

3. **`stageSkillsForProfile` and `stageSkillsForMode` are profile-staging functions, not
   Eta rendering.** CONTEXT.md mentions them as part of "the skills staging pipeline." They
   are called before the `wrappedConverter` runs; the Eta rendering happens inside the
   `wrappedConverter` closure during `stageSkillsForRuntimeAsSkills`. The invariant should
   not name these staging functions — they are orthogonal to Eta materialization.

4. **TEST-04 fixture uses `tmpDir` as `viewsRoot`, not `REPO_ROOT`.** This is per the test
   design ("D-09, RESEARCH.md pitfall 2" in the test comment) — the temp dir is the views
   root so the fixture file includes itself. The invariant for circular detection is still
   "names the offending source path" — the path is the fixture's absolute path.

5. **`04-INV-3` has no standalone test.** The engine config invariant must be backed by
   shared subtests from TEST-01 and TEST-03 (see Section 3). This is acceptable — QUAL-02
   only requires that every MUST invariant traces to a real subtest; it does not require a
   dedicated test per invariant.

---

## Section 7: QUAL-01–05 Satisfaction — Phase 69/70 Pattern

Phase 69's `01-positive-framing/SPEC.md` and Phase 70's `02-sha-versioning/SPEC.md` are the
direct shape references. The planner must replicate these patterns:

**QUAL-01 (EARS statements with RFC 2119):** Phase 69/70 used both Ubiquitous ("the system
MUST…") and Unwanted-behavior ("MUST NOT…") patterns within a single invariant. Each
invariant had exactly one consequence-of-violation sentence at the end. Replicate.

**QUAL-02 (Acceptance Tests traceability table):** Phase 69 used three required columns:
`Invariant | Test File | Subtest / Assertion Shape`. Multiple rows per invariant where a
cluster exists. Subtest strings quoted exactly as they appear in the `test(...)` call.
Replicate exactly.

**QUAL-03 (Advisory marking):** Phase 69/70 opened the Code Context section with
`<!-- advisory -->` on the section itself, then used a dated opening sentence: "The items
below are current as of 2026-06-12. All file paths, function names, and line numbers are
advisory and will shift on any test edit or upstream refactor." Replicate.

**QUAL-04 (Tier-1 citation):** This spec cites `tests/install-eta-regression.test.cjs` in
every row of the Acceptance Tests table. One tier-1 file, five invariants. Satisfies QUAL-04.

**QUAL-05 (Key Decisions with consequence):** Phase 69 used subsections (a), (b), (c), each
ending with `**Settled — do not reopen.** Consequence of reopening: <consequence>.` SPEC-04
has two ROADMAP-mandated Key Decisions (KD-A, KD-B). Replicate the format.

---

## Section 8: Frontmatter Update Notes

The stub frontmatter (`04-eta-materialization/SPEC.md`) currently reads:

```
**Status:** Draft
**Confidence:** <!-- set when body is written -->
**Specced:** <!-- set when body is written -->
**Reimplementation evidence (tier-1 test):** tests/install-eta-regression.test.cjs
```

SPEC-04 has only one tier-1 test file (unlike SPEC-02 which had five). The frontmatter
evidence line already names `tests/install-eta-regression.test.cjs` correctly — no expansion
needed. The planner sets `**Status:** Ready`, `**Confidence:** High`, and
`**Specced:** 2026-06-12` when the body is finalized.

---

## Open Questions

1. **`04-INV-3` as one invariant vs split.** Engine config covers three observable claims:
   `autoEscape: false` (no HTML escaping), `<%~` emits raw output, and include paths resolve
   against views root. If the planner judges this overloaded, splitting the resolve-path
   clause to `04-INV-6` is within Claude's Discretion per CONTEXT.md. Both approaches
   satisfy QUAL-01.

2. **ALLOWED_INLINE_REFS rendering.** The 30-entry list can appear as a bullet list or a
   two-column table (path / comment). Recommendation: group by classification (prose vs
   conditional) with a two-column table matching the comment structure in the test file,
   marked `current as of 2026-06-12`.

3. **`04-INV-1` and `04-INV-3` share TEST-01/TEST-03 subtest rows.** The Acceptance Tests
   table will have duplicate test-name rows under different invariant IDs. This is correct
   and mirrors the Phase 70 pattern (HOOK-03 rows appeared under `02-INV-3`). QUAL-02 is
   satisfied by having every MUST invariant traced to at least one real subtest.

---

## Sources

All findings in this research were verified by direct reading of the source files in this
session. No web searches or external documentation were required — this is a code-narration
phase.

### Primary (HIGH confidence — direct file reads)

- `tests/install-eta-regression.test.cjs` (lines 1–271) — the sole tier-1 normative source;
  all subtest names, assertion shapes, ALLOWED_INLINE_REFS entries, and walker logic
  transcribed verbatim.

### Secondary (HIGH confidence — advisory implementation reads)

- `bin/install.js` (lines 1772, 6452–6468, 6515, 8731, 11551) — `renderEtaContent` config
  literals, both literal call sites, `_etaSourceRoot` definition.
- `get-shit-done/bin/lib/runtime-artifact-layout.cjs` (lines 184–205, 239) — `skillsKind`
  builder, `wrappedConverter` definition with `renderEtaContent` call, Claude global layout.
- `get-shit-done/bin/lib/install-profiles.cjs` (lines 378–403) — `stageSkillsForRuntimeAsSkills`
  function signature and `converter(content, skillName)` call.

### Reference (HIGH confidence — locked conventions read)

- `.planning/spec/00-CONVENTIONS.md` — 7-section template, `NN-INV-M` ID scheme, status
  vocabulary, source-of-truth hierarchy.
- `.planning/spec/01-positive-framing/SPEC.md` — Phase 69 worked reference for invariant
  prose shape, consequence-clause format, advisory Code Context layout.
- `.planning/spec/02-sha-versioning/SPEC.md` — Phase 70 worked reference for multi-test-file
  traceability and Key Decision settlement pattern.
- `.planning/phases/71-spec-04-eta-materialization/71-CONTEXT.md` — locked decisions
  D-01..D-05.
- `.planning/spec/04-eta-materialization/SPEC.md` — stub frontmatter and section skeleton
  (what the planner fills).
- `.planning/spec/INDEX.md` — SPEC-04 root-node status; `resolveIncludes()` exclusion entry.
- `.planning/REQUIREMENTS.md` — SPEC-04 handle and QUAL-01..05 quality bars.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | (none) | — | All claims verified directly against the source files read in full this session; subtest names and assertion shapes transcribed verbatim; wrappedConverter location confirmed by reading `runtime-artifact-layout.cjs:184–205`. |

**If this table is empty:** All claims in this research were verified or cited — no user
confirmation needed.

---

## Metadata

**Confidence breakdown:**
- Test structure / subtest names / assertion shapes: HIGH — read verbatim from source.
- ALLOWED_INLINE_REFS count and entries: HIGH — counted and sampled from test file lines 40–96.
- `wrappedConverter` location and mechanics: HIGH — read verbatim from
  `runtime-artifact-layout.cjs:184–205`.
- Implementation advisory symbols (line numbers): HIGH (structure) / advisory (line numbers
  shift on any edit).
- Invariant→subtest grouping: HIGH (structure); planner-discretion (final EARS wording and
  04-INV-3 split decision).

**Research date:** 2026-06-12
**Valid until:** Until `tests/install-eta-regression.test.cjs` or
`get-shit-done/bin/lib/runtime-artifact-layout.cjs` is next edited (subtest names and
behavioral classes are stable; line numbers are the only volatile content).
