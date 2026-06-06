---
status: complete
phase: 56-spawn-template-wiring
source: [56-01-SUMMARY.md, 56-02-SUMMARY.md, 56-03-SUMMARY.md]
started: 2026-06-05T09:16:22Z
updated: 2026-06-05T09:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. resolve-model-effort query emits effort token
expected: New `resolve-model-effort <agent> --raw` CLI query returns a pre-built `effort="..."` carrier token for an effort-bearing config (raw mode never null).
result: pass

### 2. resolve-model-effort emits empty token when no effort applies
expected: For a runtime/agent with no applicable effort (inherit slot / non-effort runtime), the raw query returns an empty string — interpolates to nothing in Agent() blocks.
result: pass

### 3. D-08 medium floor for bare claude adaptive profile
expected: A bare claude adaptive-profile slot (no `;effort` suffix) floors to `medium` instead of returning null — single source of truth in resolveReasoningEffortInternal.
result: pass

### 4. Group A workflows carry effort tokens
expected: All 8 init-fed Group A workflows (execute-phase, execute-plan, plan-phase, quick, new-project, new-milestone, verify-work, map-codebase) carry `effort=`/`_effort_arg` tokens adjacent to their model= lines.
result: pass

### 5. Group B workflows carry resolve-model-effort lines
expected: All 9 Group B standalone-resolve workflows + gsd-debug-session-manager.md carry `resolve-model-effort gsd-<agent>` capture lines adjacent to their model resolution.
result: pass

### 6. Full test suite + fork gates pass
expected: `npm test` passes with 0 failures — including agent-frontmatter, negative-framing, step-numbering, and cross-file-refs fork gates.
result: pass

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
