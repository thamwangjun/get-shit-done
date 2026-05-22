# Phase 3: Align Tests with Fork Standards - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 03-align-tests-with-fork-standards
**Areas discussed:** ios-scaffold.md fix approach, Exact prohibition language to add, bug-patterns-reference.test.cjs fix scope

---

## ios-scaffold.md fix approach

| Option | Description | Selected |
|--------|-------------|----------|
| Fix the file content (add NEVER/prohibited) | Change ios-scaffold.md to use one of the exact strings the test expects. REQUIREMENTS.md TEST-01 explicitly says the fix is in the content. | |
| Fix the test to accept 'Never' and 'DO NOT' | Make the test case-insensitive or add missing variants. | |
| Fix both — strengthen the file and relax the test | Add NEVER to ios-scaffold.md AND update test to be case-insensitive. | |

**User's choice:** (deferred to follow-up question after noticing the test checks for prohibition language)
**Notes:** User asked "Why is this test looking for negative strings? It goes against @refs/*" — flagging that tests asserting for prohibition language contradict the fork's positive framing standard.

---

## ios-scaffold-safety prohibition assertions

| Option | Description | Selected |
|--------|-------------|----------|
| Keep the prohibition checks — safety rules are valid Never-X exceptions | Fix by adding NEVER or prohibited to the content near code examples. | |
| Remove the prohibition test assertions — rely on the positive checks only | The positive checks (project.yml, xcodegen) already verify correct guidance. | ✓ |

**User's choice:** Remove the prohibition test assertions
**Notes:** Prohibition-language assertions contradict the fork's positive framing standard. Positive checks (project.yml, xcodegen presence) are sufficient to verify the reference provides correct guidance.

---

## ios-scaffold.md content cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Leave ios-scaffold.md as-is — only change the test | Keep `// Package.swift — DO NOT USE for iOS apps` comment. | |
| Also clean up ios-scaffold.md — replace DO NOT USE with a positive form | Remove the prohibition comment and replace with a positive label. | ✓ |

**User's choice:** Also clean up ios-scaffold.md
**Notes:** Replace `// Package.swift — DO NOT USE for iOS apps` code comment with a positive equivalent (e.g., `// Incorrect — produces macOS CLI, not an iOS app`).

---

## bug-patterns-reference.test.cjs fix scope

| Option | Description | Selected |
|--------|-------------|----------|
| Accept both `<task>` opener and `# Common Bug Patterns` heading | Backwards-compatible assertion. | |
| Replace startsWith with includes | Check content.includes instead of startsWith. | |
| Remove the startsWith check entirely — structural tests are sufficient | The categories/bullets/sections tests are enough. | ✓ |

**User's choice:** Remove the startsWith check entirely
**Notes:** The test's remaining structural assertions (at least 5 categories, bold bullets per section) are sufficient to verify file quality. The `startsWith` check is overly specific to a file format the fork no longer uses.

---

## Claude's Discretion

- Exact wording for the replacement code comment in ios-scaffold.md
- Whether to restructure the `has title and intro` test description after removing startsWith

## Deferred Ideas

None.
