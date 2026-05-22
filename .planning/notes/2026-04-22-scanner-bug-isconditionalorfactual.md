---
date: "2026-04-22 11:45"
promoted: false
---

Scanner bug: isConditionalOrFactual() line 91 in tests/negative-framing-scan.test.cjs exempts directive bullets that start with "Do NOT <verb>" when the verb appears in the factual-verb list (include, contain, match, exist, etc.). Fix: add the same bullet-start exclusion guard that line 98 already has (`!/^\s*([-*•\d.]+\s+)?do\s+not\b/i`). Example false negative: `- Do NOT include time estimates` in gsd-assumptions-analyzer.md line 110 passes undetected.
