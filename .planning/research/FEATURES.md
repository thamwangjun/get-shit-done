# Feature Research: Spec Content Dimensions

**Domain:** Reimplementation-ready specification writing for fork features
**Researched:** 2026-06-11
**Confidence:** HIGH

---

## Purpose of This Document

This document answers: *for each class of fork feature, what content dimensions must a spec carry so a fresh implementer on a refactored upstream can rebuild it faithfully?*

The downstream consumer is the requirements step and roadmapper for milestone v2.1.0-h. Every row in the tables below is a candidate acceptance criterion for the spec docs that will live in `.planning/spec/`.

---

## Feature Classes

The fork's features fall into five structural classes:

| Class | Examples |
|-------|---------|
| **Corpus scanner + standard** | Negative-framing scanner, step-numbering scanner, citation guard, cross-file step-ref scanner |
| **Runtime behavior change** | SHA versioning (update worker, statusline, check-latest-version, install.js git-SHA, no-network sentinel) |
| **Install-time transform** | Eta v4 content materialization (`<%~ include() %>` conversion), on-demand hooks build (`ensureHooksDist`) |
| **Data / schema + resolver** | Per-agent thinking effort (`model;effort` labels, `parseModelEffort`, unified resolver, D-08 floor, catalog, init siblings, spawn wiring) |
| **Guard test / test infrastructure** | Citation guard (`no-issue-citations.test.cjs`), effort-wiring guards, scanner-precedence rule, serial test isolation |

---

## Table Stakes (Content Every Spec Must Carry)

These are non-negotiable for any spec class. Missing any of these makes reimplementation require guesswork.

| Dimension | Why Essential | Most Often Lost? |
|-----------|---------------|-----------------|
| **Observable behavior** — stimulus/response pairs at every public boundary | An implementer who cannot observe the system must know exactly what to expect at each boundary; without this they test by intuition | Rarely lost in corpus-scanner specs; frequently lost in resolver and install-transform specs where behavior is internal |
| **Acceptance test contract** — the exact test assertions (file, test name, what is asserted) that define "passing" | These features are largely defined by their tests; the test *is* the spec. Losing this means a reimplementation can pass manual inspection but fail the gate | Most often lost: people describe what the tests *check for* in prose rather than quoting the assertion shape |
| **Input/output signatures** — function names, parameter types, return shapes, error modes | Enables drop-in reimplementation. Without this, every call site must be rediscovered | Lost most often for multi-return helpers (`parseModelEffort` returning `{model, effort}`) and for optional/injectable seams (`opts.request`) |
| **Invariants** — properties that must hold across all inputs, including edge cases | Invariants encode the hard constraints that a naively correct implementation will violate on edge inputs | Lost constantly; implementers document the happy path and discover invariants through failures |
| **Explicit non-goals / exclusions** — what the feature intentionally does not do | Prevents scope creep during reimplementation; a fresh implementer "improving" the design may re-litigate settled decisions | The most commonly missing section in memory-written specs |
| **Rationale / settled decisions** — why key choices were made, not just what they are | Without rationale, implementers re-litigate settled decisions. The fork has explicit Key Decisions for a reason | Nearly always omitted; people document the outcome, not the reasoning |

---

## Differentiators by Feature Class

Content dimensions that vary by class and are the most spec-valuable.

### Class 1: Corpus Scanner + Standard

Corpus scanners are the most test-defined features in the fork. Their spec must capture the detection contract precisely because the test *is* the spec.

| Dimension | Why It Matters for This Class | Commonly Missed? |
|-----------|-------------------------------|-----------------|
| **Pattern taxonomy** — the exact patterns detected (regex or logic), their severity (hard-fail vs warn-only), and the helper function that classifies each | The scanner has distinct detection branches for different violation forms; a reimplementation that merges them or changes severity tiers will break corpus tests | Yes — prose descriptions say "detects negative framing" without enumerating all 10+ patterns and their severity levels |
| **Scope definition** — which directories and file-globs are scanned; which are excluded | `SCAN_DIRS` controls whether SDK, tests, templates, references are in scope. This is a deliberate policy decision, not just code | Yes — "scans prompt content files" hides the explicit exclusion of `sdk/`, `tests/`, `get-shit-done/templates/`, `get-shit-done/references/` |
| **False-positive suppression logic** — helper predicates that exempt conditional/factual/paired uses | `isConditionalOrFactual()`, `isFactualDont()`, paired negative+positive (D-07 SECURITY: `Never X — always Y`) — these are nuanced and took multiple iterations | Yes — specs say "skip conditionals" without documenting the verb set, relative-clause heuristic, or paired-form exception |
| **TDD red-gate protocol** — requirement that tests are written RED against unmodified corpus before any file edits | This is a process invariant, not just a test. It enforces scanner-first discipline | Rarely documented; treated as implementation workflow rather than a spec requirement |
| **Corpus count assertions** — the subtest counts that must pass (e.g., `632/632` step-numbering, `99/99` negative-framing) | These counts lock in the corpus state at spec time; without them a reimplementer cannot verify they have the right corpus | Yes — counts are omitted as "implementation detail" |
| **Replacement rule** — the exact transformation required when a violation is found (not just "fix it") | For negative framing: "rewrite as affirmative instruction specifying correct behavior — do not merely delete the prohibition." This is specific and has failed cases | Almost always lost |

### Class 2: Runtime Behavior Change (SHA Versioning)

Versioning features span multiple files with coordinated contracts. The spec must capture the full coordination topology.

| Dimension | Why It Matters for This Class | Commonly Missed? |
|-----------|-------------------------------|-----------------|
| **Coordination map** — which files participate, what each writes/reads, in what order | The SHA versioning system spans `install.js` (writes VERSION), `gsd-check-update-worker.js` (reads GitHub API, writes cache), `gsd-statusline.js` (reads cache), `check-latest-version.cjs` (reads GitHub API); each file plays a different role | Yes — specs describe one file's behavior without showing how the pieces connect |
| **Comparison semantics** — equality vs ordering, and why | SHA equality (`latest.slice(0,7) !== installed`) is the right semantic because SHAs have no inherent ordering. A semver-minded implementer will try to use `semver.gt()` | Critically lost — the rationale ("SHAs have no ordering") is what prevents the wrong design |
| **Sentinel values and their meaning** — `no-network`, `{{GSD_REPO}}`, `{{GSD_BRANCH}}` | `no-network` is not an error state — it is a deliberate sentinel that prevents downstream comparisons from silently treating an invalid install as "up to date" | Yes — sentinels are treated as error-handling details rather than design decisions |
| **Template placeholder resolution boundary** — which files use `{{}}` placeholders (processed by installer) vs hardcoded values (not processed) | `gsd-check-update-worker.js` uses `{{GSD_REPO}}`/`{{GSD_BRANCH}}` because it is a hook file the installer processes. `check-latest-version.cjs` has hardcoded values because it is a CJS module the installer does not process. This asymmetry is intentional | Almost always lost — the asymmetry looks like inconsistency to a fresh implementer |
| **Injectable seam** — `opts.request` in `check-latest-version.cjs` | Enables deterministic unit tests without network. Without documenting this, a reimplementer writes untestable code | Usually lost — "injectable for testing" is treated as obvious rather than specified |

### Class 3: Install-Time Transform

Install-time transforms are the trickiest to spec because they produce behavior that is only observable in the installed output, not in the source.

| Dimension | Why It Matters for This Class | Commonly Missed? |
|-----------|-------------------------------|-----------------|
| **Transform trigger** — when in the install pipeline the transform fires, and on which files | Eta rendering fires as the *first* transform step in the agent install loop and in `copyWithPathReplacement()` and `wrappedConverter`. Order matters — if another transform runs first, include tags may be corrupted | Yes — "wired into installer" is not enough; the exact call site and order must be specified |
| **Engine configuration** — delimiter choice, `autoEscape`, `useWith`, `views` root | Default `<%`/`%>` delimiters with `autoEscape: false` and `useWith: true`. Custom delimiters caused double-processing artifacts — the default choice is non-obvious | Yes — "uses Eta v4" without specifying the config means a reimplementer may pick different options |
| **Source-file syntax** — the exact tag form used in source files | `<%~ include('path') %>` — the `~` (raw output, no escaping) is required; `<%=` would double-escape. The source file must use this form; the installed output must contain none | Yes — `<%~` vs `<%=` distinction is consistently lost in memory-written specs |
| **Allowlist of legitimate post-install refs** — `ALLOWED_INLINE_REFS` (27 entries) | Some refs survive install intentionally (runtime `.planning/` reads). The allowlist distinguishes intentional survivors from install failures | Lost — the allowlist is treated as a test detail rather than a spec boundary |
| **Error behavior** — circular include detection, missing-file handling | Both are regression-tested. A reimplementation that silently fails circular includes will be hard to debug | Yes |
| **Skills-path coverage** — `wrappedConverter` in `runtime-artifact-layout.cjs` | The skills install path is a separate code route that also needs Eta rendering. This gap was found by audit *after* the main implementation. Must be documented as a required scope item | Almost certainly lost without deliberate documentation |

### Class 4: Data / Schema + Resolver (Per-Agent Thinking Effort)

Schema+resolver features have the most complex spec surface. They involve parsing, resolution logic, multi-runtime branching, and user-handover boundaries.

| Dimension | Why It Matters for This Class | Commonly Missed? |
|-----------|-------------------------------|-----------------|
| **Parse contract** — input format, delimiter, allowlist, return shape, error modes | `parseModelEffort("claude-sonnet-4-5;medium")` returns `{model: "claude-sonnet-4-5", effort: "medium"}`. Bare string returns `{model: "...", effort: null}`. Invalid token triggers one-time warning and returns `effort: null`. 5-token allowlist enforced. | Yes — "parses semicolon-delimited effort" without specifying the allowlist, the backward-compat null case, or the one-time warning behavior |
| **Resolution precedence chain** — the exact order of override, slot, floor | Override takes priority over profile slot, which takes priority over D-08 medium floor. The floor only applies for `{claude, codex}` runtimes; other runtimes always omit effort. Each level must be specified with its fallthrough condition | Yes — "floor of medium" without specifying when the floor applies vs when effort is omitted entirely |
| **Static allowlist** — which runtimes participate, and why static not dynamic | `{claude, codex}` — static, not derived from data. Rationale: data-derived would auto-admit future runtimes; static is auditable and explicit | The rationale (why static) is almost always lost |
| **Per-runtime behavior matrix** — what each runtime receives | Claude: preserve `effort` as-is. Codex: translate via `translateEffortForCodex` (`max` maps to `xhigh`, never `xhigh` for haiku). 8 other runtimes: omit entirely | Yes — matrix is described in prose without tabular completeness |
| **User-handover boundary** (CATALOG-02) — what Claude assigns vs what the user assigns | Claude widens the schema and adds plumbing. The user assigns effort values per agent. This is a deliberate scope boundary, not a task split | Critically lost — without this, a reimplementer will try to auto-assign effort values, which the fork explicitly avoided because of documented overthinking regressions |
| **Backward-compatibility constraint** — bare model strings must continue to work | `effort: null` for bare strings ensures existing configs and templates do not break. This is an invariant | Lost — described as "supports bare strings" without specifying the null-return requirement |
| **Init sibling field naming convention** — `*_effort` suffix on all 20 init-exposed fields | Consistent naming enables template authoring. Without the convention, spawn templates cannot be written uniformly | Yes |
| **rawSlotForRuntime fix** — why pre-strip slot is read in Codex SDK path | Stripping the tier alias before `parseModelEffort` returned null effort, allowing Codex per-tier built-in to override catalog intent. Pre-strip read preserves catalog effort through the strip step | This exact bug fix is what makes the design coherent; a reimplementer without it will reproduce the same bug |

### Class 5: Guard Test / Test Infrastructure

Guard tests are pure test code, but their spec is as important as feature code because they define the ongoing quality contract.

| Dimension | Why It Matters for This Class | Commonly Missed? |
|-----------|-------------------------------|-----------------|
| **Detection scope** — what file-globs are covered, what are excluded | `no-issue-citations.test.cjs` covers 5 dirs. `negative-framing-scan.test.cjs` covers `agents/`, `commands/gsd/`, `get-shit-done/workflows/`. The exclusions are deliberate policy | Yes — "scans prompt content files" without the exact dir list |
| **Allowlist structure** — tiers, entry format, when each tier applies | Citation guard has two tiers: `PLACEHOLDER_DIGITS` (numeric patterns that are not issue references) and `FILE_ALLOWLIST` (files exempt entirely). Both tiers must be reimplemented exactly or the guard produces wrong results | Always lost — "has an allowlist" without specifying the two-tier structure |
| **Pattern specification** — the exact regex or state-machine used | Inline two-pass state-machine for citation detection; 4 unit tests per pattern. Without the state-machine description, a reimplementation uses a simpler regex that misses parenthetical or feat-form citations | Lost |
| **Serial isolation requirement** — which tests must not run concurrently and why | Tests that rename/restore `hooks/dist/` (shared mutable state) must run serially via `SERIAL_FILES` in `run-tests.cjs`. Without this, concurrent runs produce race conditions | Almost always treated as "implementation detail" — but it is a spec constraint on any test runner integration |
| **Outer `describe({ concurrency: false })` wrapper** — why it exists | Node test runner with `--test-concurrency=4` runs top-level describe blocks concurrently within a file. The wrapper is required to serialize blocks that share mutable state | Lost — looks like unnecessary boilerplate to a fresh implementer |
| **Scanner-precedence rule** — when fork tests conflict with upstream tests, the fork test wins | This is a policy decision, not just a code pattern. It must be stated explicitly so a reimplementer does not revert fork test changes to fix upstream assertions | Critically lost — without this rule, the first upstream merge will silently undo fork test changes |

---

## Anti-Features (What to Exclude from Specs)

Content that commonly appears in specs but actively harms reimplementation.

| Anti-Feature | Why Requested | Why Problematic | What to Write Instead |
|--------------|---------------|-----------------|----------------------|
| **Line-number references** ("see line 47 of install.js") | Feels precise | The refactored upstream has different line numbers; every line ref becomes a dead link | Describe the logical location: "the first transform step in the agent install loop, before any other content rewrite" |
| **Current test count as correctness proof** ("632/632 pass") | Seems like a complete gate | Count changes with every upstream merge; asserting a specific count as the spec bakes in corpus state | Spec the *shape* of the count assertion ("all files in SCAN_DIRS pass with 0 violations") and note the current count as a reference point only |
| **Implementation path narrative** (how something was built during the milestone) | Milestone history is available | Describes the development path, not the requirement | Spec the required behavior; leave the implementation to the implementer |
| **Semver comparison logic** for SHA versioning | Familiar to implementers | SHA equality is not semver; importing semver semantics is a design error the fork explicitly corrected | Spec only equality check: `installed !== latest` (7-char prefix) |
| **Auto-assigned effort values** in the catalog | Seems like completing the work | Fork explicitly deferred this to the user (CATALOG-02 boundary); auto-assignment caused overthinking regressions | Document the boundary: schema accepts `model;effort` strings; values are user-assigned, not generated |
| **XML tag hierarchy content** (`<persona>`, `<intent>`, `<objective>`) | Was an early fork goal | Dropped from scope 2026-04-30; overhead outweighs benefit; no longer a fork requirement | Explicitly mark as out-of-scope in every spec that might touch agent/command structure |

---

## Feature Dependencies

```
Corpus scanner (negative-framing)
    └──enables──> Scanner-precedence rule (test infrastructure)
    └──requires──> TDD red-gate protocol (process)

SHA versioning (install.js git-SHA)
    └──enables──> Update worker (GitHub API comparison)
    └──enables──> Statusline SHA display
    └──requires──> Template placeholder resolution ({{GSD_REPO}}/{{GSD_BRANCH}})

Eta v4 install-time transform
    └──requires──> On-demand hooks build (ensureHooksDist)
                       [hooks/dist/ must exist before install walks hook files]
    └──requires──> Skills-path coverage (wrappedConverter)

Per-agent thinking effort (parseModelEffort)
    └──requires──> Unified resolver (resolveReasoningEffortInternal)
    └──requires──> Catalog schema widening
    └──requires──> Init sibling fields (20 *_effort fields)
    └──enables──> Spawn template wiring
    └──enables──> Install.js Codex emit seam

Citation guard
    └──requires──> Two-tier allowlist (PLACEHOLDER_DIGITS + FILE_ALLOWLIST)
    [standalone — no cross-feature dependencies]

Step-numbering scanner
    └──enables──> Cross-file step-ref scanner (validates post-normalization invariant)
    └──enables──> normalize-step-numbers.cjs (normalization tool)
```

---

## MVP Definition (Spec Doc Minimum Viable Content)

### Every Spec Must Contain (launch gate)

- [ ] Observable behavior as stimulus/response pairs — without this the spec is narrative, not contract
- [ ] Acceptance test contract — exact test file name, describe block name, what the assertion checks for
- [ ] Input/output signatures with types and error modes
- [ ] Invariants as numbered, falsifiable statements ("Bare model strings always return `effort: null`")
- [ ] Explicit non-goals with a one-line rationale for each
- [ ] The single most important settled decision with its rationale

### Add Before Roadmapper Consumes (v1.x)

- [ ] Feature dependency map (which other specs must be in an earlier phase)
- [ ] Per-runtime behavior matrix for any cross-runtime feature
- [ ] Allowlist structure (tiers, entry format) for any scanner or guard
- [ ] User-handover boundary if any part of the feature requires human judgment

### Optional — Add If Spec Proves Ambiguous in Implementation (v2+)

- [ ] Worked examples with exact input/output pairs
- [ ] Failure mode catalog (what breaks if invariant is violated)
- [ ] Migration path from current implementation to reimplementation target

---

## Feature Prioritization Matrix

| Spec | Implementation Value | Spec Complexity | Priority |
|------|----------------------|-----------------|----------|
| Negative-framing scanner + standard | HIGH — gate on every merge | MEDIUM — well-tested, patterns enumerable | P1 |
| SHA versioning system | HIGH — update check is user-visible | HIGH — spans 5 files with coordinated contracts | P1 |
| Per-agent thinking effort | HIGH — affects every agent spawn | HIGH — parse + resolve + multi-runtime matrix | P1 |
| Eta v4 install-time transform | HIGH — all installed files depend on it | MEDIUM — pivot decision + skills-path gap documented | P1 |
| Fork test infrastructure (serial isolation, scanner-precedence) | HIGH — policy, not code | LOW — two rules to state explicitly | P1 |
| Citation guard | MEDIUM — quality gate, not user-visible | LOW — standalone, simple allowlist | P2 |
| Step-numbering scanner | MEDIUM — merge hygiene | MEDIUM — three-layer (scanner + normalizer + xref) | P2 |
| On-demand hooks build | MEDIUM — install reliability | LOW — single helper, 8 tests | P2 |
| Fork reference/playbook docs | MEDIUM — process standards | LOW — docs, not code | P3 |

---

## What Is Commonly Lost When Specs Are Written From Memory

Ranked by frequency and severity of downstream impact:

**1. Invariants on edge inputs** — implementers document the happy path. The `effort: null` backward-compat invariant, `no-network` sentinel behavior, and circular-include detection are all edge-case invariants that will be rediscovered through failures rather than spec.

**2. Rationale for non-obvious choices** — `isNewer` uses equality not `semver.gt()` (SHAs have no ordering), `{claude, codex}` allowlist is static not dynamic (explicit and auditable), `<%~` not `<%=` (raw output prevents double-escaping). Each of these looks arbitrary without the rationale.

**3. Exclusions and non-goals** — XML tag hierarchy conversion is explicitly out of scope; `sdk/` and `tests/` are excluded from scanner scope; effort auto-assignment is the user's job. Without explicit non-goals, fresh implementers fill gaps with "improvements" that re-litigate settled decisions.

**4. Acceptance test assertions as primary spec** — these features are primarily defined by their tests. Describing *what* the tests check in prose is not the same as quoting the assertion shape. A spec that says "detects negative framing" without listing all 10+ detection patterns and their severity tiers is underspecified.

**5. Coordination topology for multi-file features** — SHA versioning spans 5 files; thinking effort spans parser + resolver + catalog + init + spawn templates + install.js. Specs written per-file miss the coordination contracts between them.

**6. User-handover boundaries** — the CATALOG-02 boundary (user assigns effort values, Claude does not) is a deliberate design decision that solves a documented problem (overthinking regressions). Memory-written specs describe only what was built, not what was intentionally not built.

**7. Process invariants** (TDD red-gate, scanner-precedence rule) — treated as implementation workflow rather than spec requirements. A reimplementation that skips the red-gate will ship scanners that pass vacuously on the wrong corpus.

---

## Sources

- `.planning/PROJECT.md` — Key Decisions table, Requirements (validated), constraints
- `.planning/PROJECT_HISTORY.md` — historical Key Decisions for shipped milestones
- `.planning/MILESTONES.md` — milestone accomplishments and verification records
- `CLAUDE.md` — technology stack, test conventions, architecture

---
*Feature research for: Spec content dimensions per fork feature class*
*Researched: 2026-06-11*
