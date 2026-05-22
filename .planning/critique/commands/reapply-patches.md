# Critique: `commands/gsd/reapply-patches.md`

Evaluated against: Prompt Engineering Guide V09

---

## Strengths

### 1. Explicit critical invariant with a stated logical contradiction (§1, §14)

The `<purpose>` block contains a precise, high-signal constraint: "The workflow must NEVER conclude 'no custom content' for any backed-up file — that is a logical contradiction." This is exactly what §14 (Constraint Enforcement) calls a **precedent-style ruling** for a known edge case. It anticipates the failure mode — a model silently SKIPPING a file — and closes it with a logical argument, not a vague prohibition. The repetition of this invariant at Step 4 ("CRITICAL RULE") further reinforces it at the point of execution. Per §14, this is the correct approach: hard exclusions and precedents co-located with the logic that triggers them.

### 2. Conditional branching is explicit and exhaustive (§5, §16)

Step 2 defines three merge strategies — Option A (git history), Option B (pristine snapshot), Option C (two-way fallback) — and the trigger condition for each is unambiguous. Step 4 then maps each to distinct merge rules. This follows §5's guidance on conditional instructions and §16's scenario-based branching pattern. Every code path has a named strategy; the model is not left to infer what to do when options A and B are unavailable.

### 3. Hard gate with blocking error output (§14, §16)

Step 5 (Hunk Verification Gate) is a **required_steps**-style gate that blocks forward progress if either the Hunk Verification Table is absent or any row shows `verified: no`. The blocking error messages are prescriptive: they tell the user exactly what file and hunk failed, where the backup lives, and what two recovery actions exist. This matches §14's pattern for hard exclusion lists and §22 Pattern 3's requirement that output format be specified completely and upfront.

### 4. Status vocabulary is closed and defined (§7, §14)

Step 4 enumerates exactly three valid status values (`Merged`, `Conflict`, `Incorporated`) and explicitly forbids a fourth (`Never report 'Skipped — no custom content'`). Per §7 and §22 Pattern 3, this is correct: machine-parsed output requires an exact, finite vocabulary with no wording variation.

### 5. Structured output tables are specified with column definitions (§7)

The Hunk Verification Table and the final report table both specify column names, data types, and example values. The Hunk Verification Table goes further by defining each field (`hunk_id`, `signature_line`, `line_count`, `verified`) with an inline description. This aligns with §7's guidance on embedding output schema instructions directly in the format specification.

---

## Weaknesses

### 1. No `<task>` / XML tag structure — prompt sections are demarcated by markdown headers (§4)

The entire prompt is written in markdown with `## Step N:` headers as section delimiters. The guide (§4 Action 2) is explicit: "Use XML tags to separate prompt sections… This is strictly better than markdown headers or `---` delimiters for Claude-class models: the tag name carries semantic meaning, the structure is unambiguous and machine-parseable."

The file uses `<purpose>`, `<process>`, and `<success_criteria>` tags at the top level, which is a partial application. But the interior of `<process>` is structured entirely with markdown headings (`## Step 1`, `### Option A`) rather than XML sub-tags. This is a missed opportunity — tags like `<phase id="1" name="Detect backed-up patches">` (§16) would make the phase boundaries unambiguous and processable.

Additionally, the guide's standard tag vocabulary (§4) includes `<task>`, `<constraints>`, `<output_format>`, and `<quality_bar>`. None of these appear. The `<success_criteria>` block at the bottom performs the role of `<quality_bar>`, but using a non-standard tag reduces interoperability with other prompt modules.

**Impact:** Medium. The prompt is still readable, but the model receives weaker structural signal at section boundaries, and the prompt cannot easily compose with other modules that use the standard tag vocabulary.

### 2. Negative instructions not converted to positive equivalents (§5 Action 1)

The prompt contains several primary directives framed as negations:

- "The workflow must NEVER conclude 'no custom content'"
- "Do NOT silently skip"
- "Never report 'Skipped — no custom content'"
- "Do not block"
- "Do not proceed to cleanup until the user confirms"

§5 Action 1 requires a mechanical conversion of negative directives to positive specifications of the desired behavior. The correct framing for "NEVER conclude 'no custom content'" is: "When a file appears in the backup, classify it as CONFLICT requiring user review." The correct framing for "Do NOT silently skip" is: "Always surface the file to the user with a question."

The exception the guide carves out (§6 reframe pattern) — "Your job is NOT X — it's Y" — is valid only when counter-intuitive behavior is required to displace a strong model prior. The `NEVER conclude 'no custom content'` rule meets this bar, since skipping is likely the model's default when it sees no structural difference. That one negative can stay. The others can be converted.

**Impact:** Low-to-medium. The negative directives are not harmful, but they direct the model toward prohibited behaviors by foregrounding them. Positive rewrites describe what to do.

### 3. No output format specification for the intermediate merge result — only the final report table is specified (§7, §22 Pattern 3)

Step 4 describes the merge logic in rich detail but does not specify what the model should output to the user while merging each file. The user-facing output during Step 4 is unspecified: should the model narrate what it classified as user-changed vs. upstream-changed? Should it present a diff? Summarize in prose?

The only specified output format is:
- The Hunk Verification Table (Step 4 post-merge verification)
- The final report table (Step 7)
- The blocking error messages (Step 5)

For CONFLICT cases, the prompt says "show both, ask user" — but does not specify the format of the diff display. §7 and §22 Pattern 3 require that output format be specified completely and upfront, including what a conflict display looks like. This is a gap: a model that chooses an incoherent conflict presentation format on its own will produce unpredictable UX.

**Impact:** Medium. Unspecified intermediate output format leads to inconsistent behavior across runs.

---

## Specific Rewrites

### Rewrite 1: Convert top-level structure to XML phase tags (addresses Weakness 1)

Replace the `<process>` block's markdown-header structure with `<phase>` tags per §16:

**Current (excerpt):**
```markdown
<process>

## Step 1: Detect backed-up patches
...

## Step 2: Determine baseline for three-way comparison
```

**Rewritten:**
```xml
<process>

<phase id="1" name="Detect backed-up patches">
[bash detection block]

If no patches found, output exactly:
<output_format>
No local patches found. Nothing to reapply.

Local patches are automatically saved when you run /gsd-update
after modifying any GSD workflow, command, or agent files.
</output_format>
Exit.
</phase>

<phase id="2" name="Determine baseline for three-way comparison">
...
</phase>
```

This makes phase boundaries unambiguous and aligns with the guide's standard tag vocabulary.

---

### Rewrite 2: Convert negative directives to positive equivalents (addresses Weakness 2)

**Current (Step 4, two-way merge section):**
```
d. **If ALL differences appear to be mechanical drift → still flag as CONFLICT.** The installer's hash check already proved this file was modified. Ask the user: "This file appears to only have path/variable differences. Were there intentional customizations?" Do NOT silently skip.
```

**Rewritten:**
```
d. When ALL differences appear to be mechanical drift: classify as CONFLICT and ask the
   user directly — "This file appears to only have path/variable differences. Were there
   intentional customizations?" The installer's SHA-256 hash comparison confirmed this file
   was modified; treat user confirmation as the resolution step.
```

**Current (Step 4, final line):**
```
**Never report `Skipped — no custom content`.** If a file is in the backup, it has custom content.
```

**Rewritten:**
```
Every file in the backup has custom content by definition (the installer's hash comparison
confirmed modification). Classify every backed-up file as one of: Merged, Conflict,
or Incorporated.
```

---

### Rewrite 3: Specify conflict display format (addresses Weakness 3)

Add an `<output_format>` block inside the merge step defining what a CONFLICT presentation looks like. Insert after the "Sections changed by both → flag as CONFLICT" bullet:

**Current:**
```
- Sections changed by both → flag as CONFLICT, show both, ask user
```

**Rewritten:**
```
- Sections changed by both → flag as CONFLICT. Display using this format:

<output_format>
### CONFLICT: {file_path} — section near line {N}

**Your version (backed up):**
```
{user_version_hunk}
```

**Upstream version (newly installed):**
```
{upstream_version_hunk}
```

Which version should be used? (a) Keep your version  (b) Accept upstream  (c) Edit manually
</output_format>
```

This gives the model a concrete template to follow for every conflict it surfaces, eliminating per-call format variance.

---

## Overall Verdict

**Adequate.**

The command demonstrates strong domain knowledge and handles the hard edge cases correctly — the critical invariant, the blocking verification gate, and the three-way merge logic are all well-specified. Its weaknesses are structural, not logical: the prompt uses markdown headers where XML phase tags would give cleaner model signal (§4), and it under-specifies the intermediate output format for conflict display (§7 / §22 Pattern 3). The negative instructions are a minor issue. None of the weaknesses produce incorrect behavior in most runs, but they increase variance in output presentation and make the prompt harder to compose with other modules. Promoting the structure to XML phase tags and adding a conflict display format spec would move this to **Strong**.
