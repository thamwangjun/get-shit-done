# Stack Research: Template Engine Evaluation

**Project:** get-shit-done (`bin/install.js`)
**Domain:** Install-time file-content templating for a zero-runtime-dependency Node.js package
**Researched:** 2026-05-28
**Confidence:** HIGH (all version/date data pulled directly from npm registry; feature data confirmed via Context7 official docs)

---

## Recommendation

**Use Eta v4 as a `devDependency`, inlined into `install.js` at build time via `esbuild`.**

Eta is actively maintained (latest release April 2026), has zero runtime dependencies, ships at ~204 KB unpacked (~3.5 KB min+gzip), supports file includes, variable substitution, and conditionals, and uses configurable delimiters so its syntax can be tuned to stay readable inside Markdown source files. Its zero-dependency footprint means it can be bundled directly into `install.js` without any transitive bloat, preserving the package's zero-runtime-dep constraint.

---

## Comparison Table

| Engine | File Includes | Variables | Conditionals | Maintenance (2026) | Unpacked Size | Runtime Deps | Verdict |
|--------|:---:|:---:|:---:|---|---|---|---|
| **Eta v4.6.0** | Yes (`include()` call inside tag) | Yes (`<%= it.var %>`) | Yes (JS inside tags) | **Active** — last release 2026-04-25 | ~204 KB | **0** | **Recommended** |
| **LiquidJS v10.27.0** | Yes (`{% render 'file' %}`) | Yes (`{{ var }}`) | Yes (`{% if %}`) | **Active** — last release 2026-05-15 | ~1.8 MB | 1 (`commander`) | Good but 9x larger; `commander` dep is overhead |
| **Nunjucks v3.2.4** | Yes (`{% include "file" %}`) | Yes (`{{ var }}`) | Yes (`{% if %}`) | **Stale** — last release 2023-04-13 (3+ years) | ~1.7 MB | 3 (`a-sync-waterfall`, `asap`, `commander`) | Skip — unmaintained since 2023 |
| **Mustache v4.2.0** | No (partials require caller to pre-load; no filesystem include) | Yes (`{{ var }}`) | Partial (inverted sections only — no `if`/`else`) | **Dormant** — last release 2021-03-28 (5 years) | ~114 KB | **0** | Skip — no includes; effectively abandoned |
| **Custom Regex** | Manual implementation required | Manual | Manual | N/A — maintenance burden is yours forever | 0 | 0 | Avoid — fragile, escaping edge cases in Markdown |

---

## Detailed Notes Per Engine

### Eta v4 (RECOMMENDED)

- **Confirmed zero dependencies** (npm registry: `dependencies: undefined`)
- **Actively maintained**: v4.6.0 published 2026-04-25
- **Delimiters are fully configurable**: default `<% %>` can be changed to any pair (e.g., `{! !}`) to avoid clashing with Markdown fenced code blocks or Liquid-style `{{ }}` used in agent prompt prose
- **`include()` is a first-class built-in**: `<%~ include('./partials/header.md') %>` — resolves relative to the configured `views` root
- **`useWith: true` option** allows templates to reference variables without the `it.` prefix (`<%= runtime %>` instead of `<%= it.runtime %>`) — cleaner for Markdown files
- **File-reading is synchronous**: `eta.render('./file', ctx)` — fits `install.js`'s synchronous transform pipeline
- **`renderString()` works without a filesystem** if you want to test logic in-memory
- Source: Context7 `/eta-dev/eta`, npm registry

### LiquidJS v10 (viable alternative)

- **Actively maintained**: v10.27.0 published 2026-05-15, used by GitHub Docs, Eleventy, Kibana
- **Syntax is familiar** to anyone who has worked with Shopify/Jekyll Liquid
- **`{% render 'file' %}`** resolves against configured `root` directory — clean API
- **One transitive dependency**: `commander` (CLI parsing) — ships with the package but is only used by the LiquidJS CLI binary, not the Node.js API. Bundle footprint is ~1.8 MB unpacked (9x Eta)
- **`renderFileSync()`** is available for synchronous install pipelines
- **Caveat**: `{{ }}` double-brace syntax conflicts with Mustache-style variable references already present in GSD agent prompt files (many agent `.md` files contain `{{ }}` as literal text for the AI). Using LiquidJS would require escaping those literally.
- Source: Context7 `/harttle/liquidjs`, npm registry

### Nunjucks v3 (do not use)

- **Stale**: last release April 2023; GitHub build failures noted in community; `npm audit` flags in build tooling. Mozilla org has posted a MAINTENANCE.md acknowledging the situation.
- Despite 1.2M+ weekly downloads (inertia from legacy use), no new releases in 3+ years is a red flag for a security-sensitive component used in an installer
- Syntax is excellent (Jinja2-inspired, most readable) but the maintenance risk disqualifies it
- Source: npm registry, GitHub mozilla/nunjucks MAINTENANCE.md

### Mustache v4 (do not use)

- **Dormant**: last release March 2021 — five years without an update
- **No native file includes**: partials must be pre-loaded and passed in as a hash; there is no `{% include 'file.md' %}` equivalent that reads from disk
- Conditionals are limited to inverted/non-inverted sections (`{{#var}}...{{/var}}`); no `if`/`else` branching
- Zero dependencies and 114 KB unpacked are attractive, but the missing include feature makes it unsuitable for this use case without writing a custom file-loading wrapper — at which point you've reinvented what Eta gives you for free
- Source: npm registry

### Custom Regex (do not use)

- Zero external footprint, but:
  - Recursive includes (a partial that includes another partial) require iterative re-application or a stack
  - Markdown source files routinely contain `{`, `}`, `%` characters in code fences, YAML frontmatter, and LaTeX expressions — escaping rules become maintenance burden
  - Conditionals require a custom mini-parser — not a few lines of regex
  - Every edge case discovered in production becomes a bespoke fix in a growing `transformContent()` function
  - `install.js` is already 3,400+ lines; adding a custom template mini-engine increases that burden without paying it down elsewhere
- Source: general engineering judgment; community consensus that regex-based parsers are fragile for structured text (verified via WebSearch)

---

## Recommended Syntax

Below is what Eta-based template notation looks like inside a `.md` source file. The key insight is that Eta's default `<% %>` tags are not valid Markdown syntax and therefore render as literal text in any Markdown preview — they are invisible to readers but processed by the installer.

```markdown
<!-- Source file: agents/gsd-executor.md -->
---
name: gsd-executor
description: Executes planned phases
tools: Bash, Read<% if (it.runtime === 'opencode') { %>, Write<% } %>
---

# GSD Executor

<%~ include('./partials/role-preamble.md') %>

## Runtime: <%= it.runtime %>

<% if (it.runtime === 'claude') { %>
Use the `Task` tool with `subagent_type:` to spawn agents.
<% } else { %>
Use `<execute_command>` blocks to spawn agents.
<% } %>
```

With `useWith: true`, the `it.` prefix can be dropped:

```markdown
## Runtime: <%= runtime %>
<% if (runtime === 'claude') { %>
```

**For file includes specifically**, the recommended notation is:

```
<%~ include('./partials/verification-patterns.md') %>
```

The `~` prefix outputs raw (unescaped) content — correct for Markdown, which should never be HTML-escaped.

**Choosing custom delimiters** to avoid conflicts with existing `{{ }}` in agent prose:

```javascript
const eta = new Eta({
  views: sourceRoot,
  tags: ['{%', '%}'],   // avoids {{ }} collision with existing agent variable refs
  parse: { raw: '~', interpolate: '=', exec: '' },
  useWith: true,
  autoEscape: false,    // Markdown — never HTML-escape
});
```

With custom delimiters:

```markdown
{%~ include('./partials/role-preamble.md') %}
## Runtime: {%= runtime %}
{% if (runtime === 'claude') { %}...{% } %}
```

---

## Dependency Strategy

The root package has a zero-runtime-dependency constraint (`dependencies` in `package.json` may not grow beyond what is shipped to end users). The strategy:

### Option A: `devDependency` + build-time bundle (recommended)

1. Add `eta` to `devDependencies`:
   ```json
   "devDependencies": {
     "c8": "^11.0.0",
     "eta": "^4.6.0"
   }
   ```

2. Add an `esbuild` build step (already used for hooks via `scripts/build-hooks.js`):
   ```json
   "build:installer": "node scripts/build-installer.js"
   ```

3. `scripts/build-installer.js` uses `esbuild` to bundle `bin/install.js` with Eta inlined:
   ```javascript
   require('esbuild').buildSync({
     entryPoints: ['bin/install.js'],
     bundle: true,
     platform: 'node',
     format: 'cjs',
     outfile: 'bin/install.dist.js',
     external: ['fs', 'path', 'os', 'readline', 'crypto'],
   });
   ```
   Eta at ~3.5 KB gzipped adds negligible weight to the bundled installer.

4. `prepublishOnly` script runs `build:installer` before `npm publish`, so the published package ships `bin/install.dist.js` — fully self-contained, zero runtime deps.

### Option B: inline a minimal include+variable resolver (only if bundle step is unacceptable)

Write ~80 lines of Node.js that handle only the two required operations:

- `{{ var }}` → `ctx[var]`  (simple regex replace, one pass)
- `{% include 'file' %}` → read file, recursively resolve, inline (depth-limited to prevent cycles)

**This is acceptable for the specific, bounded use case** of GSD's installer if:
- You never need conditionals in template source files
- You accept no further scope creep in the template syntax

The tradeoff is that you own every edge case forever. Option A (Eta + esbuild bundle) is lower total maintenance cost.

---

## Notes

1. **Conflict with existing `{{ }}` usage**: GSD agent `.md` files already use `{{ }}` notation as literal prose directed at the AI model (e.g., `{{ insert value here }}`). If Eta is configured with default `<% %>` delimiters — or any delimiter pair that does not overlap `{{ }}` — there is zero conflict. Do not configure Eta to use `{{ }}` as its delimiters.

2. **`autoEscape: false` is required**: Markdown content must not be HTML-escaped. Eta defaults to `autoEscape: true` (for web use). Always override this for Markdown source processing.

3. **YAML frontmatter in source `.md` files**: Eta processes the entire file, including frontmatter. The installer already strips/rewrites frontmatter for different runtimes (`bin/install.js` lines 1-100 show existing transformer logic). Ensure the templating pass runs on the body *after* frontmatter is extracted, or configure it to skip lines 1–N of fenced frontmatter.

4. **Eta v3 vs v4**: v3 is the older CommonJS-compatible build; v4 ships ESM-first but includes a CJS build. Since `install.js` is CommonJS (`require()`), verify the CJS export works with `const { Eta } = require('eta')` before adopting. The Context7 docs show ES module imports — test the CJS path explicitly.

5. **Circular include protection**: Eta does not prevent circular includes by default. If `a.md` includes `b.md` which includes `a.md`, Eta will stack-overflow. Add a `Set` of in-progress file paths in the installer's template pass to detect cycles and throw a clear error.

6. **LiquidJS as a fallback**: If the `{{ }}` conflict proves hard to audit across all agent files, LiquidJS with `{% render %}` syntax is the next best choice — actively maintained, good sync API, only one transitive dep (`commander`) that is not used at install runtime. Its 1.8 MB unpacked size is a minor concern for a dev-only bundle step.

---

## Sources

- Eta npm registry: `npm info eta --json` (version 4.6.0, published 2026-04-25, zero dependencies, unpacked 204 KB)
- LiquidJS npm registry: `npm info liquidjs --json` (version 10.27.0, published 2026-05-15, one dep, unpacked 1.8 MB)
- Nunjucks npm registry: `npm info nunjucks --json` (version 3.2.4, published 2023-04-13, three deps, unpacked 1.7 MB)
- Mustache npm registry: `npm info mustache --json` (version 4.2.0, published 2021-03-28, zero deps, unpacked 114 KB)
- Eta documentation via Context7 `/eta-dev/eta`: includes, configuration, CJS/ESM, `useWith`, `autoEscape`, delimiter customization
- LiquidJS documentation via Context7 `/harttle/liquidjs` and `/websites/liquidjs`: `renderFile`, `renderFileSync`, `{% render %}` tag, root config
- Nunjucks documentation via Context7 `/mozilla/nunjucks`: `{% include %}`, variables, conditionals
- Nunjucks maintenance discussion: https://github.com/mozilla/nunjucks/blob/master/MAINTENANCE.md
- Snyk / npm advisor mustache maintenance assessment: https://security.snyk.io/package/npm/mustache
- Zero-dependency npm approach: https://dev.to/axiom_agent/how-to-build-a-zero-dependency-npm-package-in-2026-4ll4
- esbuild bundling strategy for installers: general ecosystem consensus via WebSearch (MEDIUM confidence — standard practice but no single canonical source)
