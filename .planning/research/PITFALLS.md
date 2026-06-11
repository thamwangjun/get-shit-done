# Pitfalls: Specifying Fork Features for Reimplementation on a Refactored Codebase

**Domain:** Reimplementation-spec authoring — capturing built features from project history for rebuild on a structurally divergent upstream
**Project:** GSD — Prompt-Engineered Fork (v2.1.0-h)
**Date:** 2026-06-11
**Confidence:** HIGH (derived entirely from this project's own history, not generic research)

---

## Critical Pitfalls

---

### Pitfall 1: Over-Coupling Specs to Old File Paths and Module APIs

**What goes wrong:**
A spec describes SHA versioning as "edit `bin/install.js` function `copyWithPathReplacement()`" or the Eta engine as "wire into `wrappedConverter` in `runtime-artifact-layout.cjs:198–201`". On the refactored upstream those symbols may not exist. The implementer either can't locate them, or worse, hunts for the old name and guesses wrong, coupling the reimplementation to a stale mental model.

**Why it happens:**
When reading source to write the spec, concrete paths and function names are the most available facts. They feel authoritative. The spec author reaches for what they can see rather than what the feature abstractly *does*.

**How to avoid:**
Every spec must include a "Source Artifacts (Informational Only)" section listing current paths with an explicit disclaimer: *"These paths are from the current upstream. On the refactored base they will have moved. Use them only to locate the implementation; derive the spec's requirements from behavior, not from symbol names."* The behavioral contract (what the feature does, what invariants it preserves, what test asserts it) must be expressed independent of any file path or function name.

**Warning signs:**
A spec sentence that begins "In `bin/install.js`, the function `X` must..." is a coupling smell. Rewrite it as: "At install time, the installer must write a 7-char git SHA to the installed VERSION file."

**Phase to address:**
Applies to every spec. Enforce at the spec-review gate: reject any requirement whose phrasing would be wrong if the file moved.

**Most threatened features:** SHA versioning (`bin/install.js` git-SHA emit, `gsd-check-update-worker.js` GitHub Commits API), Eta materialization (`copyWithPathReplacement`, `wrappedConverter`), on-demand hooks build (`ensureHooksDist` in `install.js`), per-agent effort (`resolveReasoningEffortInternal` in lib modules).

---

### Pitfall 2: Capturing Implementation Details But Losing the Behavioral Contract and Hidden Invariants

**What goes wrong:**
The spec records *how* something was built (semicolon delimiter, `parseModelEffort`, static `{claude, codex}` allowlist) but omits *why* it must behave that way and what breaks if the invariant is violated. A reimplementer seeing "use semicolon delimiter" without context may switch to colon delimiter, not realizing that provider IDs like `openrouter:anthropic/claude-opus` contain colons and the choice was deliberate. Or they implement the D-08 medium floor as optional, not realizing bare slots that omit effort produce non-deterministic thinking behavior.

**Why it happens:**
Behavioral invariants live in Key Decisions documentation and commit messages, not in test assertions. When writing a spec from source code alone, the *what* is visible but the *why* is invisible unless the author cross-references the decision log.

**How to avoid:**
Every spec feature section must include a "Behavioral Invariants" subsection that states: (a) what the feature guarantees that must hold on the reimplementation, and (b) at least one "If this invariant is violated, X breaks" consequence. Cross-reference the Key Decisions log in `PROJECT.md` explicitly. For each invariant, the spec must cite which decision it encodes.

**Warning signs:**
A spec that describes data formats and control flow without any "must" / "if violated" language has probably lost its invariants.

**Phase to address:**
Per-feature spec authoring phase. The spec review gate should require at least two invariants per feature.

**Most threatened features:** Per-agent thinking effort (D-08 floor, static allowlist, `effort=` on `Agent()` not frontmatter, `max`→`xhigh` Codex cap, never `xhigh` for haiku), SHA versioning (`isNewer` equality not ordering, `no-network` sentinel meaning), Eta materialization (default `<%`/`%>` delimiters not custom, `autoEscape: false`).

---

### Pitfall 3: Losing the "Why" — Settled Decisions Get Reopened or Regressions Are Reintroduced

**What goes wrong:**
The reimplementer sees "use GitHub Commits API instead of npmjs.com" in the spec as an implementation suggestion, treats it as negotiable, and switches back to the npm registry — reintroducing the exact regression the fork fixed in v2.1.0-a. Or they see "static `{claude, codex}` allowlist" and refactor it back to data-derived form for elegance — reintroducing the auto-admit-future-runtimes problem that was consciously rejected.

**Why it happens:**
Without the "why" embedded in the spec, every decision looks reversible. The Key Decisions table in `PROJECT.md` contains the rationale, but a spec that doesn't transclude that rationale will not be read alongside it.

**How to avoid:**
Each spec feature section must include a "Decisions and Rationale" subsection that lists every settled decision for that feature with its rationale inline — not as a pointer to `PROJECT.md`. The spec must be self-contained. Mark decisions explicitly as "settled — do not reopen" with the consequence of reopening stated. Example: "GitHub Commits API, not npmjs.com (settled — update check is tied to fork repo SHA, decoupled from npm publishing cadence; reverting to npmjs breaks SHA semantics entirely)."

**Warning signs:**
A spec that says "uses X" without explaining why X was chosen over obvious alternatives will have those alternatives relitigated.

**Phase to address:**
Per-feature spec authoring. Enforce at review: every non-obvious implementation choice must have a one-sentence rationale and an explicit "do not change" marker.

**Most threatened features:** SHA versioning (GitHub API vs npm, equality not ordering semantics), Eta engine (Eta v4 not custom `resolveIncludes()`, default delimiters not custom), per-agent effort (semicolon not colon, static allowlist not data-derived, `effort=` on spawn not frontmatter), on-demand hooks build (`spawnSync` not `execSync`, scoped `require`).

---

### Pitfall 4: Missing the Test Contracts That Define Correctness

**What goes wrong:**
The spec describes a feature's behavior, but the reimplementation is verified against a vague "it should work" criterion rather than against the actual test assertions that define the fork's correctness bar. The result is a reimplementation that passes basic sanity checks but would fail the fork's actual regression suite — golden snapshot mismatches, scanner false-negative counts wrong, cross-file ref detection not comprehensive.

**Why it happens:**
Tests are seen as verification artifacts, not as specifications. The spec author writes prose requirements from source code reading but doesn't treat the existing test file as the authoritative behavioral specification.

**How to avoid:**
Every spec must include a "Test Contract" section that either: (a) reproduces the key assertions from the existing test files verbatim (with file path + line number as informational source), or (b) restates them as implementation-agnostic behavioral requirements in prose. For features with golden snapshots (330-row effort snapshot, 632-row step-numbering corpus), the spec must describe the snapshot structure and the conditions under which a row appears — not just that a snapshot exists.

**Warning signs:**
A spec feature section that ends at prose requirements without a "how do you know it's correct?" section is incomplete.

**Phase to address:**
Per-feature spec authoring. Treat the test contract as a required section — reject specs that omit it.

**Most threatened features:** Per-agent effort (330-row golden snapshot, 365-test regression suite in `feat-58-regression.test.cjs`), step numbering (632/632 scanner, 219/219 cross-file refs), negative-framing scanner (99/99 corpus scan with violation classification), citation guard (327/327 with two-tier allowlist, `PLACEHOLDER_DIGITS` vs `FILE_ALLOWLIST` semantics), Eta materialization (27-entry `ALLOWED_INLINE_REFS`, circular detection, conditional expression preservation).

---

### Pitfall 5: Specifying Features That Were Later Superseded or Descoped (Stale Scope)

**What goes wrong:**
A spec is written for the XML tag hierarchy (`<persona>`, `<intent>`, `<objective>`) because it was built (v1.37.1b, v1.37.1c abandoned), even though the user explicitly decided to exclude it from the reimplementation scope. Or a spec includes the Phase 44 custom `resolveIncludes()` function that was a stepping stone to Eta v4 (Phase 45) and explicitly deprecated. The implementer builds the superseded feature because it was in the spec.

**Why it happens:**
Project history contains everything that was built, including things later abandoned or superseded. Reading history chronologically picks up dead-ends alongside keepers unless the spec author actively filters.

**How to avoid:**
The spec index must include an explicit "Excluded from scope" section listing features that are intentionally not being carried forward, with a one-sentence reason for each exclusion. Individual feature specs must be dated to their *last active* milestone, not their original introduction. Any feature that was superseded within a single milestone (e.g., `resolveIncludes()` → Eta v4 within v2.1.0-c) must spec the *final form*, not the stepping stone. The spec review gate must check each feature against the PROJECT.md "Out of Scope" and "Abandoned Milestone" sections.

**Warning signs:**
A spec that references v1.37.1b or v1.37.1c features (XML tag tests, `<persona>` corpus tests) is picking up abandoned work. A spec for `resolveIncludes()` that doesn't mention Eta v4 is speccing a superseded stepping stone.

**Phase to address:**
Spec scoping phase (before any per-feature spec is written). Produce the exclusion list first; validate it against PROJECT.md before writing any feature spec.

**Most threatened features:** XML tag hierarchy (explicitly excluded by user), `resolveIncludes()` custom function (superseded by Eta v4 in same milestone), `parseV()` semver dev-install block (removed in v2.1.0-a, not to be reimplemented), `<persona>`/`<role>` corpus test files (deleted 2026-04-30).

---

### Pitfall 6: Losing Interdependencies — Build-Order Hazards Between Features

**What goes wrong:**
A spec describes Eta v4 materialization and install.js SHA versioning as independent features. The reimplementer implements SHA versioning first and doesn't realize that SHA versioning depends on `{{GSD_REPO}}`/`{{GSD_BRANCH}}` template placeholders being processed by the installer's template engine — which is Eta. They wire template replacement as a separate ad-hoc step, producing a fragile coupling instead of using the Eta engine consistently. Or they implement per-agent effort without first implementing the `parseModelEffort` parser and the init siblings, then discover the spawn-wiring phase references both.

**Why it happens:**
Features are described as deliverables, not as a dependency graph. Interdependencies are implicit in the source code (one function calls another) but invisible in a prose feature list.

**How to avoid:**
The spec index must include a dependency matrix: for each feature, list which other features it depends on and which features depend on it. Every per-feature spec must include a "Dependencies" section naming prerequisites. The roadmap must sequence features in dependency order. Features with no dependencies can be specced and implemented in parallel; features with dependencies must be specced and implemented after their prerequisites.

**Warning signs:**
Any feature spec that references another feature by name without declaring a dependency is a missing dependency declaration.

**Phase to address:**
Spec index phase (before individual feature specs) and again at roadmap phase ordering. The dependency matrix drives phase sequencing.

**Critical dependency chains to preserve:**
- Eta v4 materialization → `{{GSD_REPO}}`/`{{GSD_BRANCH}}` template replacement in SHA versioning hooks worker
- `parseModelEffort` parser → init siblings (20 `*_effort` fields) → spawn wiring (Group A/B workflows) → install.js Codex emit seam
- Step-numbering scanner → `normalize-step-numbers.cjs` → cross-file-step-refs scanner (normalization must precede cross-file validation)
- On-demand hooks build (`ensureHooksDist`) → SHA versioning hooks (dist must exist before hooks are installed)
- Negative-framing scanner (corpus tests) → fork test infrastructure (scanner-precedence rule, serial isolation) — scanner tests are the reason the precedence rule exists

---

### Pitfall 7: Relying on Stale Reference Guides Instead of Project History

**What goes wrong:**
The spec author reads `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md` or `PROMPT_IMPROVEMENT_GUIDE_V01.md` as authoritative specifications of the positive-framing standard and derives spec requirements from those documents. But these guides are known-stale (they describe the standard's principles, not its current scanner implementation). The scanner has diverged: it has 12+ detection branches including `prohibited`, `forbidden`, `mustNot`, `antiPatterns`, `wont`, `willNot`, `cannot`, letter-suffix steps — none of which appear in the guides. A spec derived from the guides will underspecify the scanner.

**Why it happens:**
Named reference documents feel authoritative because they were written as standards. The guides predate several scanner expansion milestones. The author reaches for the document rather than reading the test file that actually defines the current behavior.

**How to avoid:**
Establish a hard rule in the spec process: **the source of truth for any feature's current behavior is (in priority order): (1) the existing test file assertions, (2) the source code, (3) project history (PROJECT.md Key Decisions, MILESTONES.md), (4) reference guides.** Reference guides are background context only; they cannot contradict what the test suite asserts. Every spec must cite a primary source from tier 1 or 2, not from tier 4 alone. Where a guide conflicts with the test suite, the test suite wins and the spec must note the discrepancy.

**Warning signs:**
A spec section that cites only `.planning/references/` documents without also citing a test file or source file is relying on stale source.

**Phase to address:**
Applies to every spec, especially the positive-framing standard and scanner. Enforce at review: reject specs with no tier-1 or tier-2 citation.

**Most threatened features:** Positive-framing scanner (guides underspecify the detection branches), fork reference/playbook docs as encoded standards (the guides describe principles, not the enforcement mechanism), citation cleanup guard (no guide describes the two-tier allowlist).

---

## Spec-Process Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems in a reimplementation-spec context.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Copy-paste source code into spec as "the requirement" | Fast, feels complete | Ties spec to old module structure; implementer can't adapt to refactored codebase | Never — paraphrase behavior instead |
| Link to test file instead of extracting key assertions | Keeps spec short | Link rots when test is renamed or restructured; implementer may miss critical assertion | Never for critical contracts; acceptable for full test list supplementing extracted key assertions |
| Write spec from reference guide, not from test suite | Fast, readable | Reference guides are stale; scanner has diverged from documented principles | Never as primary source; acceptable as background context only |
| Describe features in isolation without dependency mapping | Each spec is self-contained | Implementer builds in wrong order; reimplementation fails integration | Never — always include Dependencies section |
| Use "should" instead of "must" for invariants | Softer, less confrontational | Implementer treats invariants as optional | Never for behavioral invariants; acceptable for style guidance |
| Include superseded stepping-stone implementations | Complete historical record | Implementer may build the stepping stone rather than the final form | Never — scope to final shipped form only |

---

## Integration Gotchas

Common mistakes when the reimplemented features are connected to each other and to the refactored upstream.

| Integration Point | Common Mistake | Correct Approach |
|-------------------|----------------|-----------------|
| Eta engine + installer copy loops | Wire Eta into only one copy path (e.g., main agent loop but not skills path `wrappedConverter`) | Wire Eta as the first transform step in every copy path; the v2.1.0-c Phase 47.1 insertion is a canonical example of what happens when one path is missed |
| SHA versioning + hook template placeholders | Process `{{GSD_REPO}}`/`{{GSD_BRANCH}}` in hook files as a separate step rather than via the template engine | Treat hook files as template sources; the installer's template engine handles placeholder replacement for hook files, while `check-latest-version.cjs` hardcodes the URL (the asymmetry is intentional — CJS module is not processed by installer) |
| Per-agent effort + Codex emit seam | Strip tier alias before reading slot effort, losing catalog intent | Read `rawSlotForRuntime` (pre-strip) in the Codex SDK path so catalog effort survives the alias-strip step (EXPOSE-03 fix, b4bc8cc0) |
| Step-numbering normalizer + cross-file ref scanner | Run cross-file ref scanner before normalization completes | Normalizer must run first; cross-file scanner locks in the post-normalization invariant; running in wrong order produces stale-ref false positives |
| On-demand hooks build + serial test isolation | Let `ensureHooksDist` tests run concurrently with other installer-spawning tests | Tests that rename/restore `hooks/dist/` require serial isolation via `SERIAL_FILES` in `run-tests.cjs`; concurrency produces race conditions on the shared mutable directory |

---

## "Looks Done But Isn't" Checklist

Things that appear complete in a spec but are missing critical pieces.

- [ ] **Positive-framing scanner spec:** Often missing the full detection-branch enumeration — verify spec lists all 12+ patterns (`doNot`, `never`, `dont`, `antiPatterns`, `mustNot`, `shouldNot`, `cannot`, `wont`, `willNot`, `prohibited`, `forbidden`, and the warn-only variants) not just the principles from the guide.
- [ ] **SHA versioning spec:** Often missing the `no-network` sentinel semantics — verify spec states that offline install writes `no-network` (not semver, not empty string) so downstream version checks detect invalid state rather than silently treating it as a valid SHA.
- [ ] **Per-agent effort spec:** Often missing the D-08 floor rationale and the `inherit` + bare adaptive entry omission rule — verify spec covers all precedence chain links: override → slot → D-08 medium floor, and that `inherit` profiles and bare adaptive entries explicitly omit effort.
- [ ] **Eta materialization spec:** Often missing the skills-path gap scenario — verify spec requires the engine to be wired into *every* copy path including the skills `wrappedConverter`; the gap was only found via post-milestone audit.
- [ ] **Citation guard spec:** Often missing the two-tier allowlist semantics — verify spec distinguishes `PLACEHOLDER_DIGITS` (digit-sequence allowlist) from `FILE_ALLOWLIST` (whole-file exemptions) and explains why each tier exists.
- [ ] **Fork test infrastructure spec:** Often missing the scanner-precedence rule — verify spec states that when a test conflicts with fork standards, the test is modified to assert fork behavior (not the fork content is reverted), and that this is a standing policy not a one-time decision.
- [ ] **Step-numbering spec:** Often missing the Pattern C exclusion — verify spec explicitly states that `## N.N.` section headings in `plan-phase.md`, `new-milestone.md`, `new-project.md` are out of scanner scope (different semantic pattern).

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Enforcement Mechanism |
|---------|------------------|-----------------------|
| Pitfall 1: File-path coupling | Every per-feature spec | Spec review gate: reject requirements that name file paths or function symbols as normative |
| Pitfall 2: Lost behavioral invariants | Every per-feature spec | Required "Behavioral Invariants" section with "if violated, X breaks" for each invariant |
| Pitfall 3: Lost "why" / reopened decisions | Every per-feature spec | Required "Decisions and Rationale" section; decisions marked "settled — do not reopen" |
| Pitfall 4: Missing test contracts | Every per-feature spec | Required "Test Contract" section; reject specs that omit it |
| Pitfall 5: Stale scope / superseded features | Spec scoping phase (first) | Produce exclusion list from PROJECT.md before writing any per-feature spec |
| Pitfall 6: Lost interdependencies | Spec index + roadmap | Required "Dependencies" section per feature; dependency matrix in spec index drives phase ordering |
| Pitfall 7: Stale reference guides as source | Every per-feature spec | Source-of-truth hierarchy enforced at review: tier 1 (tests) > tier 2 (source) > tier 3 (history) > tier 4 (guides) |

---

## Per-Feature Pitfall Priority

Which features are most at risk from which pitfalls.

| Feature | Highest-Risk Pitfall | Secondary Risk |
|---------|---------------------|----------------|
| SHA versioning | Pitfall 1 (file-path coupling: `bin/install.js`, `gsd-check-update-worker.js`) | Pitfall 3 (GitHub API vs npm — easily reversed without rationale) |
| Eta v4 materialization | Pitfall 6 (integration coupling to every copy path) | Pitfall 3 (default delimiters decision, pivot from custom `resolveIncludes()`) |
| Per-agent thinking effort | Pitfall 2 (D-08 floor, static allowlist, `effort=` on spawn) | Pitfall 4 (330-row golden snapshot defines correctness) |
| Positive-framing scanner | Pitfall 7 (guides underspecify; test suite defines current behavior) | Pitfall 4 (99/99 corpus test is the contract) |
| Step numbering | Pitfall 6 (scanner → normalizer → cross-file-ref ordering) | Pitfall 5 (Pattern C exclusion must be preserved, not "fixed") |
| Citation cleanup guard | Pitfall 4 (two-tier allowlist semantics are non-obvious) | Pitfall 7 (no guide documents the allowlist design) |
| On-demand hooks build | Pitfall 1 (`ensureHooksDist` in `install.js`) | Pitfall 6 (must exist before hooks install; serial test isolation) |
| Fork test infrastructure | Pitfall 3 (scanner-precedence rule is a standing policy, easily missed) | Pitfall 7 (no reference doc describes the precedence rule) |

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Pitfall 1: File-path coupling discovered mid-reimplementation | MEDIUM | Locate the equivalent module in the refactored upstream by behavior (search for git-rev-parse, eta import, etc.); update spec with corrected paths as informational; continue implementation |
| Pitfall 2: Invariant violated, reimplementation produces wrong behavior | HIGH | Diff against the fork's golden snapshot or corpus test output; identify the violated invariant; add it to the spec retroactively; fix the reimplementation |
| Pitfall 3: Settled decision reopened, regression reintroduced | HIGH | Re-read KEY DECISIONS in PROJECT.md; re-close the decision in spec with full rationale; revert the change; establish that decisions need explicit "reopen" approval |
| Pitfall 4: Test contract missing, verification incomplete | MEDIUM | Extract assertions from existing test files; add Test Contract section to spec; run against reimplementation to find gaps before shipping |
| Pitfall 5: Superseded feature built | MEDIUM | Identify which milestone shipped the final form; re-read that milestone's deliverables; replace stepping-stone implementation with final form |
| Pitfall 6: Build-order hazard, integration fails | HIGH | Map the dependency chain from source; re-sequence phases in dependency order; partially built features may need to be refactored after their prerequisites are complete |
| Pitfall 7: Stale guide used, spec underspecifies | MEDIUM | Read the actual test file; extract each assertion; update spec to reflect current behavior; note the guide discrepancy explicitly |

---

*Pitfalls research for: Specifying already-built fork features for reimplementation on a refactored codebase*
*Researched: 2026-06-11*
*Source: Derived from this project's own history (PROJECT.md, PROJECT_HISTORY.md, MILESTONES.md) — HIGH confidence*
