# Phase 71: spec-04 Eta Materialization - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase writes the body of `.planning/spec/04-eta-materialization/SPEC.md` — a behavioral-contract specification of the Eta v4 install-time content materialization pipeline, durable enough that a reimplementer can rebuild it on a refactored upstream without reading the current source.

The phase fills an existing stub (frontmatter + 7-section skeleton already created in Phase 68). It does NOT modify `bin/install.js`, `renderEtaContent`, the copy paths, or the skills converter — it specifies them. The 7-section template, the `NN-INV-M` invariant-ID scheme, the status vocabulary (`Draft|Ready|Implemented|Verified`), and the source-of-truth hierarchy are all LOCKED by Phase 68's `00-CONVENTIONS.md` and are inherited verbatim. The only open work is authoring the spec body — Purpose, Scope, Invariants, Acceptance Tests table, Key Decisions, Code Context — and advancing Status from `Draft` to `Ready`.

The system being specced: at install time, every `.md` file copied to a target runtime is passed through `renderEtaContent` (Eta v4, `autoEscape: false`, custom `resolvePath`) so that `<%~ include('...') %>` directives — which reference shared fragments by `@~/.claude/`-style paths — are materialized (inlined) into the installed output. The tier-1 normative source is `tests/install-eta-regression.test.cjs`. The test IS the spec; the SPEC.md is a faithful, move-proof narration of what it asserts. This phase inherits the Phase 69/70 method wholesale: role-based invariant grouping, shape-normative-not-count, advisory-marking of current paths, every MUST tracing to a real subtest, and ROADMAP-mandated decisions recorded as "Settled — do not reopen."

</domain>

<decisions>
## Implementation Decisions

### Invariant Decomposition
- **D-01:** Group invariants by **behavioral role**, not one-per-test and not a single mega-invariant. Target **~5 numbered invariants** (`04-INV-1`..`04-INV-5`):
  1. **Copy-path materialization coverage** — Eta rendering runs on **every** install copy path, such that no unrendered `<%~` directive and no non-allowlisted `@~/.claude/` include survives in any installed `.md` file (see D-02 for the all-paths framing, D-04 for the allowlist rule). Tier-1: `install-eta-regression.test.cjs` TEST-01 (both subtests — non-allowlisted `@~/.claude/` walk + surviving-`<%~` walk).
  2. **Include inlining** — a `<%~ include('path') %>` directive resolves the referenced fragment and inlines its content into the rendered output (TEST-03: `gsd-executor.md` inlines "Mandatory Initial Read" from `mandatory-initial-read.md`).
  3. **Engine configuration (observable)** — the engine renders with `autoEscape: false` (included content is NOT HTML-escaped), `<%~` emits raw output verbatim, and a custom `resolvePath` resolves include paths against the views/repo root (see D-03; observable via TEST-03 inlining success + TEST-01 absence of escape artifacts).
  4. **Circular-include failure** — a self-referencing / circular include throws a **descriptive `Error`** naming the offending source path, never a raw `RangeError` (TEST-04).
  5. **Missing-include failure** — an include of a nonexistent file throws **`EtaFileResolutionError`** naming the missing filename (TEST-05).
  - Rationale: keeps the Acceptance Tests traceability table legible and move-proof; each invariant maps to an identifiable TEST-0N cluster. Mirrors Phase 69 D-01 / Phase 70 D-01. Rejected one-per-test (table rots every upstream merge) and single mega-invariant (not falsifiable at subtest granularity — fails the QUAL traceability bar).

### Copy-Path Coverage — the audit-found skills path
- **D-02:** **`04-INV-1` is ONE invariant covering all copy paths, with the skills `wrappedConverter` path named explicitly as a sub-clause.** `renderEtaContent` is currently invoked at two literal call sites — `install.js:6515` (command/workflow files via `copyWithPathReplacement`) and `install.js:8731` (agent files) — while the **skills converter path** is materialized through the wrapped-converter staging pipeline and is covered only by TEST-01's full-install walk (which stages and walks the entire installed skills tree). The invariant text MUST name the three paths (commands/workflows, agents, skills `wrappedConverter`) so the gap that was **found only via post-milestone audit** can never silently reopen. Traced to TEST-01 because a full `installRuntimeArtifacts('claude', …)` exercises every path and the walk asserts no survivor in any of them. Per ROADMAP SC1 ("coverage of every copy path — including the skills `wrappedConverter` — stated as an explicit invariant"). Rejected splitting per-path: TEST-01 walks the whole tree and does not distinguish paths, and a per-path table rots as copy sites are refactored upstream.

### Engine Configuration — invariant + Key Decision split
- **D-03:** The engine config is **both a MUST invariant (observable behavior) and locked Key Decisions (settled choices)** — the Phase 70 D-04/D-05 pattern. `04-INV-3` asserts the *observable* contract (no HTML-escaping, raw `<%~` output, include paths resolve against the views root) because a reimplementer who flips `autoEscape` to `true` ships HTML-escaped garbage with no other failing invariant to catch it. The *design choices* — "Eta v4 over a custom `resolveIncludes()` resolver" and "default Eta delimiters (no custom `tags` config)" — are recorded in `## Key Decisions` as settled (see D-05). Both artifacts are required: the observable behavior and the design intent are distinct.

### Exception List — rule normative, entries dated
- **D-04:** The **`ALLOWED_INLINE_REFS` exception is normative as a behavioral RULE; the ~30 specific entries are a dated, advisory enumeration.** Mirror of Phase 69 D-02/D-03. The durable contract: *an installed `@~/.claude/` reference is permitted only when it is an intentional AI-instruction prose ref (e.g., "Read @~/.claude/…") or a `${…}`-preserved conditional; an Eta `include` ref that should have been inlined, and any surviving `<%~` tag, are violations.* The literal allowlist entries (the ~30 paths enumerated in the test) appear as a **supporting list marked `current as of 2026-06-12`**, not as the contract — they change as prose refs are added/removed across merges. The "surviving `<%~`" half of the rule needs **no allowlist** (any survivor is always a bug — TEST-01b). Rationale: honors `00-CONVENTIONS.md` §4 "shape is normative, not the count." Rejected count/list-as-normative (rots every merge).

### Settled Key Decisions mandated by ROADMAP (record as "Settled — do not reopen")
- **D-05:** Per ROADMAP SC3, `## Key Decisions` records as settled, each with the consequence of reopening:
  - **"Eta v4 over custom `resolveIncludes()`"** — the Phase 45 pivot (v2.1.0-c) to a production-grade zero-config template engine; already recorded in PROJECT.md Key Decisions and INDEX.md exclusion notes. Consequence of reopening: reintroduces the bespoke resolver that Eta superseded.
  - **"Default Eta delimiters"** — `<%`/`%>` with `<%~` for raw output; no custom `tags` configuration. Consequence of reopening: every source `<%~ include() %>` directive would need rewriting and the corpus scanner expectations would break.

### Claude's Discretion
- Exact EARS pattern choice per invariant (Ubiquitous vs Event-driven vs Unwanted-behavior), provided each is a single falsifiable claim mapping to a subtest.
- Exact subtest/assertion-shape strings in the Acceptance Tests table — planner/executor read `tests/install-eta-regression.test.cjs` and cite the real `describe`/`test` names.
- Whether `04-INV-3` renders as one invariant or splits the resolve-path clause to a 6th invariant if the engine-config invariant becomes overloaded.
- Whether the `ALLOWED_INLINE_REFS` supporting enumeration (D-04) renders as a table or a bullet list, and whether to abbreviate the ~30 entries to representative classes.
- Confidence value to stamp in frontmatter when the body is finalized.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tier-1 normative source (the spec narrates this)
- `tests/install-eta-regression.test.cjs` — THE behavioral source. TEST-01 (full Claude install walk: no non-allowlisted `@~/.claude/` ref survives; no unrendered `<%~` survives), TEST-03 (`renderEtaContent` inlines an included fragment), TEST-04 (circular include → descriptive `Error` naming the path), TEST-05 (missing include → `EtaFileResolutionError` naming the file). Also defines `ALLOWED_INLINE_REFS` (the dated allowlist) and exercises `installRuntimeArtifacts` + `renderEtaContent` directly. Every invariant and every Acceptance Tests row must trace to a subtest here.

### Implementation files (advisory — narrate into Code Context, do not rest normative claims on these)
- `bin/install.js` — `renderEtaContent` (defined ~line 6452: `new Eta({ views, useWith: true, autoEscape: false })`, custom `resolvePath`, `RangeError`→descriptive `Error` wrap); call site `:6515` (`copyWithPathReplacement` — command/workflow files); call site `:8731` (agent files); the skills staging / wrapped-converter pipeline (`_copyCommandsAsSkillsViaConverter`, `stageSkillsForProfile`/`stageSkillsForMode`) that constitutes the third (audit-found) copy path; `module.exports` of `renderEtaContent` (~line 11551).

### Spec-set conventions (LOCKED — inherited verbatim)
- `.planning/spec/00-CONVENTIONS.md` — the 7-section template, the `NN-INV-M` ID scheme, status vocabulary, and source-of-truth hierarchy. The SPEC.md MUST conform exactly — no section drift (Phase 77 rejects drift).
- `.planning/spec/04-eta-materialization/SPEC.md` — the stub being filled (frontmatter + empty section skeleton already present; `Depends on: —`, tier-1 evidence already names `install-eta-regression.test.cjs`).
- `.planning/spec/INDEX.md` — feature-status manifest; SPEC-04 row (root node, no deps), and the `resolveIncludes()` / custom-resolver exclusion entries this spec must stay consistent with.

### Milestone scope & requirements
- `.planning/REQUIREMENTS.md` — SPEC-04 handle and the shared QUAL-01–05 quality bars a spec must satisfy to reach `Ready`.
- `.planning/ROADMAP.md` §"Phase 71: spec-04 Eta Materialization" (lines ~828–839) — the three success criteria; also §"Phase 77" for the cross-spec reconciliation this spec must survive.
- `.planning/phases/68-spec-scaffold/68-CONTEXT.md` — Phase 68 decisions (template, ID scheme) that bind this phase.
- `.planning/phases/69-spec-01-positive-framing/69-CONTEXT.md` and `.planning/phases/70-spec-02-sha-versioning/70-CONTEXT.md` — sibling Wave-1 specs; their D-01 (role-based grouping), shape-not-count, advisory-marking, and invariant+Key-Decision split patterns are inherited here.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/install-eta-regression.test.cjs` (~13 KB) — fully populated and passing; it is both the evidence and the structure for the spec. The author reads it once and narrates: the `ALLOWED_INLINE_REFS` array, the `walkDir`/`walkDirEta` full-install walks (TEST-01), and the three direct `renderEtaContent` invocations (TEST-03/04/05).
- Phase 69's `01-positive-framing/SPEC.md` and Phase 70's `02-sha-versioning/SPEC.md` are worked references for section shape, advisory-marking, and the invariant+Key-Decision split pattern.

### Established Patterns
- The spec is a narration exercise, not a design exercise: the source-of-truth hierarchy puts the test at tier-1, so any disagreement between a test and a reference doc resolves in favor of the test.
- Advisory marking: every current path/symbol/function name (`renderEtaContent`, line numbers, `_copyCommandsAsSkillsViaConverter`) goes under `## Code Context` with `<!-- advisory -->`; no normative claim may rest on it (move-proofing for the upstream refactor).
- `renderEtaContent` fires at only two literal call sites today (`:6515`, `:8731`); the skills path is the third, less-obvious copy path — the reason ROADMAP SC1 demands it be named explicitly (D-02).

### Integration Points
- SPEC-04 is a **root node** in the INDEX dependency graph (`Depends on: —`) — no edges added by this phase.
- This SPEC.md feeds Phase 77 (Cross-Spec Consistency Review). The Acceptance Tests table must be mechanically checkable (keyed on `04-INV-M`, citing real subtests).
- Status transition `Draft → Ready` happens in this phase and is gated on QUAL-01–05.

</code_context>

<specifics>
## Specific Ideas

- TEST-01 has two subtests under one `describe`: the non-allowlisted-`@~/.claude/` walk and the surviving-`<%~` walk. `04-INV-1` traces to both.
- The circular-include contract is observable as "descriptive `Error`, NOT raw `RangeError`" — `renderEtaContent` explicitly catches `RangeError` and rethrows `new Error('Circular include detected in: ' + srcPath)` (TEST-04 asserts both the non-`RangeError` type and the path in the message).
- The missing-include contract uses the upstream `EtaFileResolutionError` class (imported from `eta`) — TEST-05 asserts the exact type plus the missing filename in the message.
- `renderEtaContent` config literals to narrate (advisory): `views: viewsRoot`, `useWith: true`, `autoEscape: false`, and the overridden `resolvePath` joining `viewsRoot` + templatePath.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. The engine-config split (D-03) and the exception rule-vs-list framing (D-04) are placement decisions within the spec, not deferrals. No INDEX dependency edges or scope additions were proposed.

</deferred>

---

*Phase: 71-spec-04-eta-materialization*
*Context gathered: 2026-06-12*
