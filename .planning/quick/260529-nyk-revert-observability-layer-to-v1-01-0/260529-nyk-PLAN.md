---
quick_id: 260529-nyk
slug: revert-observability-layer-to-v1-01-0
description: Revert observability layer to v1.01.0
date: 2026-05-29
tasks:
  - id: t1
    action: Delete observability source and tests
    files:
      - get-shit-done/bin/lib/observability/event.cjs
      - get-shit-done/bin/lib/observability/logger.cjs
      - get-shit-done/bin/lib/observability/redaction.cjs
      - tests/observability/event.test.cjs
      - tests/observability/hub-logger-integration.test.cjs
      - tests/observability/logger.test.cjs
      - tests/observability/redaction.test.cjs
      - tests/dispatch/trace-correlation.test.cjs
    verify: Files deleted, directories removed
    done: rm + rmdir
  - id: t2
    action: Revert command-routing-hub.cjs to pre-observability state
    files:
      - get-shit-done/bin/lib/command-routing-hub.cjs
      - tests/command-routing-hub.test.cjs
    verify: npm test passes
    done: git show + overwrite
must_haves:
  truths:
    - observability source directory deleted
    - observability test directory deleted
    - trace-correlation test deleted
    - command-routing-hub.cjs has no observability imports
    - npm test passes
---

# Quick Task 260529-nyk: Revert Observability Layer to v1.01.0

Remove all observability layer additions that are not present in upstream v1.01.0:
- Delete `get-shit-done/bin/lib/observability/` source files
- Delete `tests/observability/` test files
- Delete `tests/dispatch/trace-correlation.test.cjs`
- Revert `get-shit-done/bin/lib/command-routing-hub.cjs` to pre-observability state
- Revert `tests/command-routing-hub.test.cjs` accordingly
