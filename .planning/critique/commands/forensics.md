# Critique: `commands/gsd/forensics.md`

Critiqued against: Prompt Engineering Guide V09
Date: 2026-04-30

---

## Strengths

### 1. Read-only constraint expressed as a positive permission pair (§14 Constraint Enforcement)

The `<critical_rules>` block states what the agent may write (the forensic report, STATE.md tracking) alongside the restriction. This partially satisfies §14's demand that "every restriction is paired with what IS permitted, stated equally concretely." Most command files omit the permitted side entirely.

### 2. Evidence grounding rule (§14 — precedents; §22 Pattern 6)

"Every anomaly must cite specific commits, files, or state data" and "do not fabricate root causes" are domain-specific behavioral rules that directly address the chief failure mode of forensic investigation prompts: speculative diagnosis. This maps to §14's precedent pattern and §22 Pattern 6's confidence-threshold principle.

### 3. Concrete success criteria with enumerated minimums (§1 Task Specification, Action 1)

`<success_criteria>` extracts the three task components required by §1: output ("structured forensic report"), purpose ("diagnose failed or stuck workflows"), and quality bar ("at least 4 anomaly types checked"). The numeric minimum ("at least 4 anomaly types") follows §21's rule that numeric limits beat qualitative descriptors.

### 4. Data sources enumerated explicitly (§8 Context Placement, Action 4)

Listing the exact sources (`git log`, `git status`, specific `.planning/` paths) in `<context>` follows §8 Action 4's trim-to-relevance rule. The agent does not have to discover what to look at; the scope is pre-narrowed.

---

## Weaknesses

### 1. `<objective>` is used where `<task>` belongs — violating the standard XML vocabulary (§4 Formatting and Structure)

The guide defines a strict tag vocabulary (§4, XML tag vocabulary table). `<task>` is the canonical top-level tag for "primary instruction: what the model must do." `<objective>` is not in the vocabulary at all. Using a non-standard tag name reduces semantic signal for Claude-class models, which are trained against the standard tag set. The `<process>` tag is similarly non-canonical — the guide has no `<process>` tag; the correct pattern is `<task>` or `<phase>`.

Additionally, `<execution_context>` is an invented tag. The guide's runtime context sub-tags (§4) use `<git_status>`, `<git_diff>`, `<log_path>`, `<log_summary>` — not a generic wrapper for workflow file references.

**Impact:** Medium. The prompt is readable, but it misses the semantic precision that named XML tags provide to the model.

### 2. No persona — but the task warrants one (§6 Persona Assignment)

§6 Action 1 states: "open-ended, stylistic, or requires a specific voice? YES → assign a specific, role-constrained persona." Forensic investigation is open-ended: the agent must decide what constitutes an anomaly, what constitutes sufficient evidence, and how to frame root-cause language. A generic `gsd:forensics` invocation will default to assistant behavior rather than an investigator's discipline.

§6's role-domain mapping table illustrates the pattern explicitly: "Verification / Tester" maps to "Verification specialist. Your job is to try to break it." The same structure applies here. The guide's adversarial agent pattern (§17, §22 Pattern 8) is directly applicable: forensics is adversarial in the same sense — the agent's job is to find what went wrong, not confirm that things look fine.

The absence of the reframe pattern ("your job is not to confirm things ran correctly — it's to find what broke and why") leaves the model without a behavioral anchor for the hard cases.

**Impact:** High. Without a persona, the model may produce hedged, both-sides analysis rather than committed root-cause findings.

### 3. No `<output_format>` specification — the report structure is undefined (§7 Output Format Handling, §22 Pattern 3)

The `<success_criteria>` block mentions "structured forensic report written to `.planning/forensics/report-{timestamp}.md`" but never specifies the report structure. §7 and §22 Pattern 3 are explicit: "State the required output structure, field names, ordering, and an example before the model begins its task." An implicit format produces structure that varies per call.

The guide provides the direct pattern at §22 Pattern 3:

```xml
<output_format>
Output findings in markdown. For each anomaly include:
- Anomaly type
- Evidence (commit hash, file path, or state value)
- Severity (HIGH/MEDIUM/LOW)
- Root cause hypothesis
- Recommended corrective action
...
</output_format>
```

Without this, every forensic report will have a different shape, making them hard to scan, compare, or machine-parse.

**Impact:** High. This is the single most actionable gap — the report is the primary deliverable of the command.

### 4. `<critical_rules>` uses negated instructions where positive equivalents are required (§5 Instruction Framing, Action 1)

§5 Action 1 requires: "Convert negative instructions to positive equivalents." Three of the four critical rules lead with negation:

- "Do not modify project source files" → negative
- "Strip absolute paths, API keys, tokens" → positive (correct)
- "Every anomaly must cite…" → positive (correct)
- "Do not fabricate root causes" → negative

§5's conversion table gives the exact rewrite pattern: `"Do not hallucinate" → "If uncertain, say 'I don't know' rather than guessing"`. The same logic applies here.

**Impact:** Low-to-medium. The rules are clear enough to be understood, but negative framing is lower precision and violates a checklist requirement (§23).

### 5. `<process>` delegates entirely to an external file with no inline summary (§17 Agent and Subagent Patterns — self-contained prompts)

The entire process is: "Read and execute the forensics workflow from `@~/.claude/get-shit-done/workflows/forensics.md` end-to-end." §17 states that each agent prompt must be "fully self-contained when spawned" and that "context inheritance from the parent is unavailable." While this command is not strictly a subagent prompt, the same principle applies when the workflow file may not be present, may differ across installations, or may be read with variable fidelity. The command file as written is a thin wrapper with no operative content if the workflow file is missing or unreadable.

**Impact:** Structural concern. This may be intentional by design (command file = thin dispatcher), but if so the command file provides no fallback behavior and its success_criteria cannot be verified from the command file alone.

---

## Specific Rewrites

### Rewrite 1: Add a domain-specific persona with reframe framing (addresses Weakness 2)

Replace the current `<objective>` opening (or add before it) with:

```xml
<persona>
You are a forensic investigator for GSD workflow failures. Your job is not to confirm
the workflow ran correctly — it is to find what broke and explain exactly why, grounded
in evidence from git history, planning artifacts, and filesystem state.

"The logs look fine" is not a finding. Every anomaly you report must cite a specific
commit hash, file path, timestamp, or state value. If the data is insufficient to
support a root-cause claim, say so explicitly rather than speculating.
</persona>
```

This applies §6's reframe pattern, §17's adversarial verification persona pattern, and §22 Pattern 8 directly to the forensics context.

### Rewrite 2: Add an `<output_format>` block with a concrete report schema (addresses Weakness 3)

Add after `<success_criteria>`:

```xml
<output_format>
Write the forensic report as markdown. Structure it as follows:

## Forensic Report: {timestamp}

### Summary
1–3 sentences stating what went wrong and the most likely root cause.

### Anomalies Found
For each anomaly:
- **Type:** [stuck-loop | missing-artifact | abandoned-work | crash-interruption | other]
- **Severity:** HIGH | MEDIUM | LOW
- **Evidence:** (specific commit hash, file path, or STATE.md value)
- **Root cause:** (hypothesis grounded in evidence above)
- **Corrective action:** (specific next step)

### Data Sources Checked
Bullet list of sources examined and what each yielded (or "not found").

### Investigation Gaps
Data that was unavailable or insufficient to draw conclusions.
</output_format>
```

This satisfies §7 Action 1, §22 Pattern 3, and the §23 checklist item for machine-parsed output specification.

### Rewrite 3: Convert negated critical rules to positive equivalents (addresses Weakness 4)

Replace current `<critical_rules>` with:

```xml
<constraints>
  <permitted>
    Read any file in the repository and `.planning/` directory.
    Write only to `.planning/forensics/report-{timestamp}.md` and `.planning/STATE.md`
    (session tracking update only).
    Run read-only shell commands: git log, git status, git diff, find, grep, ls.
  </permitted>

  <reserved_for_human_review>
    Modifying project source files.
    Creating or deleting files outside `.planning/forensics/` and `.planning/STATE.md`.
  </reserved_for_human_review>

  <exclusions>
    Report any finding without citing specific evidence (commit hash, file path, or state
    value). If data is insufficient, state the gap — omit the root-cause claim.
    Include absolute paths, API keys, or tokens in reports or GitHub issues.
  </exclusions>
</constraints>
```

This converts two negative rules to positive equivalents (§5 Action 1), structures permissions as explicit pairs (§14), and uses the standard `<constraints>` / `<permitted>` / `<reserved_for_human_review>` vocabulary (§4 tag table).

---

## Overall Verdict

**Needs Work**

The command correctly identifies its data sources, anchors success to numeric minimums, and pairs its read-only restriction with permitted write targets — these are genuine guide-aligned strengths. However, it fails on three structurally important dimensions: no persona leaves the agent without a behavioral anchor for the hardest judgment calls; no output format means the primary deliverable varies per run; and non-canonical XML tags reduce semantic precision throughout. The process delegation to an external file without fallback content is also a structural fragility. These are fixable with targeted additions — none require a full rewrite — but until the output format and persona gaps are closed, the command cannot be considered production-ready by the guide's standards.
