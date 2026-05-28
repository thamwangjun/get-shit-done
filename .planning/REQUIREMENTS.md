# Requirements: GSD — Prompt-Engineered Fork

**Defined:** 2026-05-28
**Core Value:** Every agent, command, and workflow file on `main` meets the fork's prompt engineering quality bar before it ships — upstream content additions are modified, not accepted verbatim.

## v2.1.0-b Requirements

Requirements for the Workflow Compliance Reinforcement milestone. Each maps to roadmap phases.

### Investigation

- [ ] **INVEST-01**: Root cause analysis of compliance failures produces a structured findings document with evidence drawn from actual files across all three layers (commands, workflows, agents)
- [ ] **INVEST-02**: Failure mode taxonomy categorizes findings into distinct types: (a) subagent spawning failures, (b) step omission, (c) premature inline fallback loopholes, (d) buried critical instructions lost to the "lost in the middle" effect

### Command Layer

- [ ] **CMD-01**: All 67 command files contain an explicit orchestrator identity or spawn mandate at a high-attention position (start of `<objective>` or `<process>` block)
- [ ] **CMD-02**: `<process>` blocks in commands that use subagents explicitly restate the spawn mandate rather than deferring entirely to the loaded workflow file
- [ ] **CMD-03**: Command files that invoke subagent workflows do not grant inline execution as a default fallback without a user-supplied flag (e.g., `--interactive`)

### Workflow Layer

- [ ] **WF-01**: All workflows that spawn subagents open with an orchestrator reframe pattern per PEG V10 Section 6 ("Your job is NOT to execute directly — it's to spawn X")
- [ ] **WF-02**: Critical spawn instructions are placed at high-attention positions (start or end of workflow), not buried in middle sections where the "lost in the middle" effect causes them to be ignored
- [ ] **WF-03**: `<runtime_compatibility>` inline-fallback blocks are guarded so inline execution requires an explicit user-supplied flag, not an assumption about runtime type
- [ ] **WF-04**: Workflows with mandatory step sequences use explicit required-step markers (per PEG V10 Section 16 `required_steps universal="true"` pattern) that the model cannot silently skip

### Agent Layer

- [ ] **AGENT-01**: All 33 agent files are audited for step-omission patterns — executors short-circuiting task steps, verifiers skipping adversarial probes, planners skipping required reads
- [ ] **AGENT-02**: Agent files with identified compliance issues receive PEG V10 fixes: required step anchors, adversarial probe mandates, explicit completion criteria

### Quality Gate

- [ ] **GATE-01**: Full `npm test` passes after all changes with 0 regressions beyond pre-existing failures
- [ ] **GATE-02**: Negative-framing scanner passes at 99/99 after all workflow, command, and agent edits

## Future Requirements

*(None defined — next milestone to be planned)*

## Out of Scope

| Feature | Reason |
|---------|--------|
| Changing GSD's core functionality or runtime behavior | Fork is prompt content only |
| Fixes to `get-shit-done/templates/` or `get-shit-done/references/` | Out of scan scope per established fork policy |
| Fixes to `sdk/` or `tests/` | Out of scan scope per `SCAN_DIRS` |
| Enforcing XML tag hierarchy on modified files | Dropped from fork scope in v2.1.0-a Key Decisions |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INVEST-01 | Phase 44 | Pending |
| INVEST-02 | Phase 44 | Pending |
| CMD-01 | Phase 45 | Pending |
| CMD-02 | Phase 45 | Pending |
| CMD-03 | Phase 45 | Pending |
| WF-01 | Phase 46 | Pending |
| WF-02 | Phase 46 | Pending |
| WF-03 | Phase 46 | Pending |
| WF-04 | Phase 46 | Pending |
| AGENT-01 | Phase 47 | Pending |
| AGENT-02 | Phase 47 | Pending |
| GATE-01 | Phase 48 | Pending |
| GATE-02 | Phase 48 | Pending |

**Coverage:**
- v2.1.0-b requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-28*
*Last updated: 2026-05-28 after initial definition*
