---
quick_id: 260430-fsy
slug: remove-intent-section-check-from-audit-f
description: Remove intent section check from audit-fix test
date: 2026-04-30
---

# Quick Task 260430-fsy: Remove intent section check from audit-fix test

## Context

Project decision: no conversion to `<intent>` tag. The `has <intent> section` test in
`tests/audit-fix-command.test.cjs` was added anticipating that conversion but it goes against
the project decision.

## Task

**Task 1:** Remove `has <intent> section` test from `tests/audit-fix-command.test.cjs`

- File: `tests/audit-fix-command.test.cjs`
- Action: Delete the `test('has <intent> section', ...)` block (lines 106–110)
- Verify: `npm test` shows `AUDIT-FIX: command file` suite passes
- Done: Test removed, suite green
