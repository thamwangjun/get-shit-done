---
quick_id: 260520-ylc
slug: reinforce-d-nn-citation-in-gsd-planner
description: Reinforce D-NN decision citation in gsd-planner.md action prose using PROMPT_ENGINEERING_GUIDE_V10.md techniques
date: 2026-05-20
status: complete
---

# Quick Task 260520-ylc: Reinforce D-NN Citation in gsd-planner

## Description

`agents/gsd-planner.md` already states "reference the decision ID in task actions for traceability" but provides no format spec, no calibrating examples, and no success-criteria gate. Plans produced by the planner define D-NN truths in `must_haves.truths` but routinely omit the corresponding inline citations in `<action>` prose — leaving executor agents with no signal to apply the constraint at the right moment.

Apply PROMPT_ENGINEERING_GUIDE_V10.md techniques (Pattern 2: calibrating examples, Pattern 3: output format specified upfront, §5: positive framing) to make D-NN citation a concrete, verifiable requirement.

## Tasks

### Task 1: Add citation rule + examples to `<task_breakdown>` action field

- **Action:** After the existing `<action>` field description, add a "Decision citation in action prose" subsection specifying exact `(per D-NN)` format with good/bad calibrating pair and the "untethered truth" consequence statement.
- **Done:** Format spec and examples present at the point where planner authors `<action>` prose.

### Task 2: Add D-NN labeling guidance to `<goal_backward>` Must-Haves format

- **Action:** Before the `must_haves` YAML example, add guidance distinguishing citable D-NN truths (constraints on executor behavior) from plain observable truths, with good/bad examples.
- **Done:** Planner knows to label behavioral constraints as D-NN at the source.

### Task 3: Add D-NN citation check to `<success_criteria>`

- **Action:** Add checklist item: "Each D-NN truth in `must_haves.truths` cited in the `<action>` of the task it constrains."
- **Done:** Self-review gate explicitly catches untethered decisions before the plan is returned.

### Task 4: Verify scanner passes

- **Action:** `node --test tests/negative-framing-scan.test.cjs`
- **Done:** 99/99 pass, 0 fail.
