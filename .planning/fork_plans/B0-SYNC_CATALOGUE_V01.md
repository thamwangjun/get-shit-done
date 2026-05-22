# Plan: Sync CATALOGUE.json with current file state

## Context

`CATALOGUE.json` is the authoritative index of all GSD prompt content files. After pulling upstream changes, new files may have been added or existing files removed. `tests/catalogue-sync.test.cjs` automates the audit — run it first to identify gaps, then use this plan to fix them.

---

## Scope

Five categories tracked in `CATALOGUE.json`:

| Key | Directory |
|---|---|
| `commands` | `commands/gsd/` |
| `workflows` | `get-shit-done/workflows/` |
| `agents` | `agents/` |
| `references` | `get-shit-done/references/` |
| `templates` | `get-shit-done/templates/` |

Templates are user-facing boilerplate — include them in the `templates` key but exclude them from prompt-engineering passes.

---

## Step 1 — Identify Gaps

```bash
npm test -- --test-name-pattern="catalogue"
```

The test output lists:
- **Missing entries**: files on disk not present in the catalogue array
- **Stale entries**: catalogue entries whose file no longer exists on disk

If all subtests pass, CATALOGUE.json is already in sync — stop here.

---

## Step 2 — Update CATALOGUE.json

For each gap the test reports:

**Missing entry (file on disk, not in catalogue):**
1. Read the file to derive a one-sentence description from its primary directive tag (`<persona>` for agents, `<intent>` for commands, `<objective>` for workflows, `<task>` for templates/sub-workflows), or opening prose
2. Add an entry to the correct array in `CATALOGUE.json` using the Edit tool
3. Keep the array sorted alphabetically by `file`

**Stale entry (in catalogue, file deleted):**
1. Remove the entry from the correct array

**After all edits**, update the top-level `counts` object and `total`:

```bash
node -e "
const c = require('./CATALOGUE.json');
const keys = ['commands','workflows','agents','references','templates'];
keys.forEach(k => console.log(k, c[k].length, '(catalogue says', c.counts[k] + ')'));
console.log('total', Object.values(c.counts).reduce((a,b)=>a+b,0), '(catalogue says', c.total + ')');
"
```

Fix any count mismatches before proceeding.

---

## Step 3 — Verify

```bash
npm test -- --test-name-pattern="catalogue"
```

All catalogue subtests must pass. If any still fail, repeat Step 2 for the remaining gaps.

---

## Conventions

- `file` values use repo-relative paths (e.g. `commands/gsd/foo.md`, not absolute paths)
- `description` is a single sentence, present tense, describing what the file does
- Array entries are sorted alphabetically by `file` within each category
- `total` = sum of all five category counts
