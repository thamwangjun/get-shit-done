<purpose>
Check for GSD updates via the GitHub Commits API, compare current installed SHA against the latest commit SHA on the fork's main branch, obtain user confirmation, and execute clean installation with cache clearing.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="get_installed_version">
Detect the installed GSD version, scope, runtime, and config dir.

First, derive `PREFERRED_CONFIG_DIR` and `PREFERRED_RUNTIME` from the invoking prompt's `execution_context` path:
- If the path contains `/get-shit-done/workflows/update.md`, strip that suffix and store the remainder as `PREFERRED_CONFIG_DIR`
- Path contains `/.codex/` -> `codex`
- Path contains `/.gemini/antigravity-ide/` -> `antigravity`
- Path contains `/.gemini/antigravity-cli/` -> `antigravity`
- Path contains `/.gemini/antigravity/` -> `antigravity`
- Path contains `/.gemini/` -> `gemini`
- Path contains `/.config/kilo/` or `/.kilo/`, or `PREFERRED_CONFIG_DIR` contains `kilo.json` / `kilo.jsonc` -> `kilo`
- Path contains `/.config/opencode/` or `/.opencode/`, or `PREFERRED_CONFIG_DIR` contains `opencode.json` / `opencode.jsonc` -> `opencode`
- Otherwise -> `claude`

Then resolve the install context via the deterministic projection (#498). **Do NOT re-derive scope, runtime, or version by hand** — `update-context` owns that cascade in tested code (`get-shit-done/bin/lib/update-context.cjs`), the same way `check-latest-version` owns the package name (#2992):

```bash
expand_home() {
  case "$1" in
    "~/"*) printf '%s/%s\n' "$HOME" "${1#~/}" ;;
    *) printf '%s\n' "$1" ;;
  esac
}

# Runtime candidates: "<runtime>:<config-dir>" stored as an array.
# Using an array instead of a space-separated string ensures correct
# iteration in both bash and zsh (zsh does not word-split unquoted
# variables by default).
RUNTIME_DIRS=( "claude:.claude" "opencode:.config/opencode" "opencode:.opencode" "antigravity:.gemini/antigravity-ide" "antigravity:.gemini/antigravity-cli" "antigravity:.gemini/antigravity" "gemini:.gemini" "kilo:.config/kilo" "kilo:.kilo" "codex:.codex" )
ENV_RUNTIME_DIRS=()

# PREFERRED_CONFIG_DIR / PREFERRED_RUNTIME should be set from execution_context
# before running this block.
if [ -n "$PREFERRED_CONFIG_DIR" ]; then
  PREFERRED_CONFIG_DIR="$(expand_home "$PREFERRED_CONFIG_DIR")"
  if [ -z "$PREFERRED_RUNTIME" ]; then
    if [ -f "$PREFERRED_CONFIG_DIR/kilo.json" ] || [ -f "$PREFERRED_CONFIG_DIR/kilo.jsonc" ]; then
      PREFERRED_RUNTIME="kilo"
    elif [ -f "$PREFERRED_CONFIG_DIR/opencode.json" ] || [ -f "$PREFERRED_CONFIG_DIR/opencode.jsonc" ]; then
      PREFERRED_RUNTIME="opencode"
    elif [ -f "$PREFERRED_CONFIG_DIR/config.toml" ]; then
      PREFERRED_RUNTIME="codex"
    fi
  fi
fi

# If runtime is still unknown, infer from runtime env vars; fallback to claude.
if [ -z "$PREFERRED_RUNTIME" ]; then
  if [ -n "$CODEX_HOME" ]; then
    PREFERRED_RUNTIME="codex"
  elif [ -n "$ANTIGRAVITY_CONFIG_DIR" ]; then
    PREFERRED_RUNTIME="antigravity"
  elif [ -n "$GEMINI_CONFIG_DIR" ]; then
    PREFERRED_RUNTIME="gemini"
  elif [ -n "$KILO_CONFIG_DIR" ]; then
    PREFERRED_RUNTIME="kilo"
  elif [ -n "$KILO_CONFIG" ]; then
    PREFERRED_RUNTIME="kilo"
  elif [ -n "$OPENCODE_CONFIG_DIR" ] || [ -n "$OPENCODE_CONFIG" ]; then
    PREFERRED_RUNTIME="opencode"
  elif [ -n "$CLAUDE_CONFIG_DIR" ]; then
    PREFERRED_RUNTIME="claude"
  else
    PREFERRED_RUNTIME="claude"
  fi
fi

# If execution_context already points at an installed config dir, trust it first.
# This covers custom --config-dir installs that do not live under the default
# runtime directories.
if [ -n "$PREFERRED_CONFIG_DIR" ] && { [ -f "$PREFERRED_CONFIG_DIR/get-shit-done/VERSION" ] || [ -f "$PREFERRED_CONFIG_DIR/get-shit-done/workflows/update.md" ]; }; then
  INSTALL_SCOPE="GLOBAL"
  # Normalize a path for comparison: on Windows with Git Bash, pwd returns
  # POSIX-style /c/Users/... but PREFERRED_CONFIG_DIR may carry C:/Users/...
  # Convert Windows drive-letter paths to POSIX form so the comparison works
  # on both Windows (Git Bash) and POSIX systems.
  normalize_path() {
    local p="$1"
    case "$p" in
      [A-Za-z]:/*)
        local drive rest
        drive="${p%%:*}"
        rest="${p#?:}"
        p="/$(printf '%s' "$drive" | tr '[:upper:]' '[:lower:]')$rest"
        ;;
    esac
    printf '%s' "$p"
  }
  normalized_preferred="$(normalize_path "$PREFERRED_CONFIG_DIR")"
  for dir in .claude .config/opencode .opencode .gemini/antigravity-ide .gemini/antigravity-cli .gemini/antigravity .gemini .config/kilo .kilo .codex; do
    resolved_local="$(cd "./$dir" 2>/dev/null && pwd)"
    normalized_local="$(normalize_path "$resolved_local")"
    if [ -n "$normalized_local" ] && [ "$normalized_local" = "$normalized_preferred" ]; then
      INSTALL_SCOPE="LOCAL"
      break
    fi
  done

  if [ -f "$PREFERRED_CONFIG_DIR/get-shit-done/VERSION" ] && grep -Eq '^[0-9a-f]{7}|no-network' "$PREFERRED_CONFIG_DIR/get-shit-done/VERSION"; then
    INSTALLED_VERSION="$(cat "$PREFERRED_CONFIG_DIR/get-shit-done/VERSION")"
  else
    INSTALLED_VERSION="0.0.0"
  fi

  echo "$INSTALLED_VERSION"
  echo "$INSTALL_SCOPE"
  echo "${PREFERRED_RUNTIME:-claude}"
  # 4-line output contract: early-return path must also emit
  # GSD_DIR or downstream check_latest_version misreads the install as
  # UNKNOWN. PREFERRED_CONFIG_DIR is the resolved config dir we just
  # validated above (line 95-96); it is the right GSD_DIR value for
  # this fast path.
  echo "$PREFERRED_CONFIG_DIR"
  exit 0
fi

# Absolute global candidates from env overrides (covers custom config dirs).
if [ -n "$CLAUDE_CONFIG_DIR" ]; then
  ENV_RUNTIME_DIRS+=( "claude:$(expand_home "$CLAUDE_CONFIG_DIR")" )
fi
if [ -n "$ANTIGRAVITY_CONFIG_DIR" ]; then
  ENV_RUNTIME_DIRS+=( "antigravity:$(expand_home "$ANTIGRAVITY_CONFIG_DIR")" )
fi
if [ -n "$GEMINI_CONFIG_DIR" ]; then
  ENV_RUNTIME_DIRS+=( "gemini:$(expand_home "$GEMINI_CONFIG_DIR")" )
fi
if [ -n "$KILO_CONFIG_DIR" ]; then
  ENV_RUNTIME_DIRS+=( "kilo:$(expand_home "$KILO_CONFIG_DIR")" )
elif [ -n "$KILO_CONFIG" ]; then
  ENV_RUNTIME_DIRS+=( "kilo:$(dirname "$(expand_home "$KILO_CONFIG")")" )
elif [ -n "$XDG_CONFIG_HOME" ]; then
  ENV_RUNTIME_DIRS+=( "kilo:$(expand_home "$XDG_CONFIG_HOME")/kilo" )
fi
if [ -n "$OPENCODE_CONFIG_DIR" ]; then
  ENV_RUNTIME_DIRS+=( "opencode:$(expand_home "$OPENCODE_CONFIG_DIR")" )
elif [ -n "$OPENCODE_CONFIG" ]; then
  ENV_RUNTIME_DIRS+=( "opencode:$(dirname "$(expand_home "$OPENCODE_CONFIG")")" )
elif [ -n "$XDG_CONFIG_HOME" ]; then
  ENV_RUNTIME_DIRS+=( "opencode:$(expand_home "$XDG_CONFIG_HOME")/opencode" )
fi
if [ -n "$CODEX_HOME" ]; then
  ENV_RUNTIME_DIRS+=( "codex:$(expand_home "$CODEX_HOME")" )
fi

# Reorder entries so preferred runtime is checked first.
ORDERED_RUNTIME_DIRS=()
for entry in "${RUNTIME_DIRS[@]}"; do
  runtime="${entry%%:*}"
  if [ "$runtime" = "$PREFERRED_RUNTIME" ]; then
    ORDERED_RUNTIME_DIRS+=( "$entry" )
  fi
done
ORDERED_ENV_RUNTIME_DIRS=()
for entry in "${ENV_RUNTIME_DIRS[@]}"; do
  runtime="${entry%%:*}"
  if [ "$runtime" = "$PREFERRED_RUNTIME" ]; then
    ORDERED_ENV_RUNTIME_DIRS+=( "$entry" )
  fi
done
for entry in "${ENV_RUNTIME_DIRS[@]}"; do
  runtime="${entry%%:*}"
  if [ "$runtime" != "$PREFERRED_RUNTIME" ]; then
    ORDERED_ENV_RUNTIME_DIRS+=( "$entry" )
  fi
done
for entry in "${RUNTIME_DIRS[@]}"; do
  runtime="${entry%%:*}"
  if [ "$runtime" != "$PREFERRED_RUNTIME" ]; then
    ORDERED_RUNTIME_DIRS+=( "$entry" )
  fi
done
# Last resort: the gsd-tools shim on PATH — resolved to its absolute path and
# invoked via the variable (never a bare `gsd-tools` command; see #2851).
if [ -z "$GSD_TOOLS" ] && command -v gsd-tools >/dev/null 2>&1; then
  GSD_TOOLS="$(command -v gsd-tools)"
fi

# Only treat as LOCAL if the resolved paths differ (prevents misdetection when CWD=$HOME)
IS_LOCAL=false
if [ -n "$LOCAL_VERSION_FILE" ] && [ -f "$LOCAL_VERSION_FILE" ] && [ -f "$LOCAL_MARKER_FILE" ] && grep -Eq '^[0-9a-f]{7}|no-network' "$LOCAL_VERSION_FILE"; then
  if [ -z "$GLOBAL_DIR" ] || [ "$LOCAL_DIR" != "$GLOBAL_DIR" ]; then
    IS_LOCAL=true
  fi
fi

if [ "$IS_LOCAL" = true ]; then
  INSTALLED_VERSION="$(cat "$LOCAL_VERSION_FILE")"
  INSTALL_SCOPE="LOCAL"
  TARGET_RUNTIME="$LOCAL_RUNTIME"
  RESOLVED_GSD_DIR="$LOCAL_DIR"
elif [ -n "$GLOBAL_VERSION_FILE" ] && [ -f "$GLOBAL_VERSION_FILE" ] && [ -f "$GLOBAL_MARKER_FILE" ] && grep -Eq '^[0-9a-f]{7}|no-network' "$GLOBAL_VERSION_FILE"; then
  INSTALLED_VERSION="$(cat "$GLOBAL_VERSION_FILE")"
  INSTALL_SCOPE="GLOBAL"
  TARGET_RUNTIME="$GLOBAL_RUNTIME"
  RESOLVED_GSD_DIR="$GLOBAL_DIR"
elif [ -n "$LOCAL_RUNTIME" ] && [ -f "$LOCAL_MARKER_FILE" ]; then
  # Runtime detected but VERSION missing/corrupt: treat as unknown version, keep runtime target
  INSTALLED_VERSION="0.0.0"
  INSTALL_SCOPE="LOCAL"
  TARGET_RUNTIME="$LOCAL_RUNTIME"
  RESOLVED_GSD_DIR="$LOCAL_DIR"
elif [ -n "$GLOBAL_RUNTIME" ] && [ -f "$GLOBAL_MARKER_FILE" ]; then
  INSTALLED_VERSION="0.0.0"
  INSTALL_SCOPE="GLOBAL"
  TARGET_RUNTIME="$GLOBAL_RUNTIME"
  RESOLVED_GSD_DIR="$GLOBAL_DIR"
else
  # No tool resolvable / projection failed -> treat as a fresh install.
  INSTALLED_VERSION="0.0.0"
  INSTALL_SCOPE="UNKNOWN"
  TARGET_RUNTIME="claude"
  GSD_DIR=""
fi

echo "$INSTALLED_VERSION"
echo "$INSTALL_SCOPE"
echo "$TARGET_RUNTIME"
echo "$GSD_DIR"
```

Parse output:
- Line 1 = installed version (`0.0.0` means unknown version)
- Line 2 = install scope (`LOCAL`, `GLOBAL`, or `UNKNOWN`)
- Line 3 = target runtime (`claude`, `opencode`, `gemini`, `kilo`, `codex`, `antigravity`)
- Line 4 = resolved GSD config dir (e.g. `/Users/me/.claude`, `/Users/me/.gemini`); empty if scope is `UNKNOWN`. Capture this as `GSD_DIR` and pass it to subsequent steps so they don't re-derive the runtime path.
- If scope is `UNKNOWN`, proceed to install using the `--claude --global` fallback.

`update-context` reproduces the previous detection cascade — preferred-config-dir fast path, local-over-global with same-path dedup (so `CWD=$HOME` does not misdetect as LOCAL), env-var overrides (`CLAUDE_CONFIG_DIR`, `OPENCODE_CONFIG_DIR`, `KILO_CONFIG`, `XDG_CONFIG_HOME`, `CODEX_HOME`, …), and semver validation — but as a tested projection rather than ~280 lines of inline bash. Branch coverage lives in `tests/issue-498-update-context.test.cjs`.

If multiple runtime installs are detected and the invoking runtime cannot be determined from execution_context, ask the user which runtime to update before running install.

**If VERSION file missing (version resolves to `0.0.0`):** report the installed version as Unknown and proceed to install (treated as `0.0.0` for comparison).
</step>

<step name="check_latest_version">
Check the latest commit SHA via the deterministic script. **Do NOT run `npm view` or query GitHub directly** — the API endpoint is hardcoded in the script, not a free choice at execution time. Moving the endpoint into a script constant closes the gap where LLM-driven package-name prescriptions produced wrong-package queries.

The `GSD_DIR` value emitted by `get_installed_version` (line 4) resolves to the runtime-specific config dir (`~/.claude/`, `~/.gemini/`, `~/.codex/`, etc.), so the script invocation works for every runtime — not just Claude. If `GSD_DIR` is empty (scope `UNKNOWN`), skip this step and go directly to install.

`LATEST_RESULT` is a JSON document with the documented shape `{ ok: bool, sha: string, reason: string, detail?: string }`. Parse via `jq` ONLY when the script actually ran. When `GSD_DIR` is empty (scope `UNKNOWN`), skip the check entirely and seed the parsed fields with their no-op values so downstream logic does not mistake an unset `LATEST_RESULT` for a failed network check:

```bash
if [ -z "$GSD_DIR" ]; then
  # No install detected — fall through to install step; version-check is skipped.
  LATEST_RESULT=""
  LATEST_STATUS=0
  LATEST_OK=false
  LATEST_SHA=""
  LATEST_REASON="no_install_detected"
else
  LATEST_RESULT="$(node "$GSD_DIR/get-shit-done/bin/check-latest-version.cjs" --json 2>/dev/null)"
  LATEST_STATUS=$?
  # When node is missing or the script doesn't exist, LATEST_RESULT
  # is empty and piping it to `jq` produces a parse error on stderr while
  # leaving LATEST_OK / LATEST_REASON as empty strings. Fail the check with a
  # meaningful reason instead of a blank diagnostic.
  if [ -n "$LATEST_RESULT" ]; then
    LATEST_OK="$(printf '%s' "$LATEST_RESULT" | jq -r '.ok // false')"
    LATEST_SHA="$(printf '%s' "$LATEST_RESULT" | jq -r '.sha // empty')"
    LATEST_REASON="$(printf '%s' "$LATEST_RESULT" | jq -r '.reason // empty')"
  else
    LATEST_OK=false
    LATEST_SHA=""
    LATEST_REASON="script_not_found_or_node_unavailable"
  fi
fi
```

**If `LATEST_OK` is not `true`** (or `LATEST_STATUS` is non-zero):

```text
Couldn't check for updates (reason: {LATEST_REASON}, exit: {LATEST_STATUS}).

To update manually: `npx get-shit-done-cc`
```

Exit.
</step>

<step name="compare_versions">
Compare installed SHA vs latest SHA (binary equality — SHA comparison has no ordering):

**If `INSTALLED_VERSION` == `LATEST_SHA`:**
```
## GSD Update

**Installed SHA:** {INSTALLED_VERSION}
**Latest SHA:**    {LATEST_SHA}

You're already on the latest version.
```

Exit.

**Otherwise:** Proceed to show_changes_and_confirm.
</step>

<step name="show_changes_and_confirm">
**If update available**, show what has changed and confirm before updating:

Display the installed vs latest SHA and a link to the commit history:

```
## GSD Update Available

**Installed SHA:** {INSTALLED_VERSION}
**Latest SHA:**    {LATEST_SHA}

View commits since your install:
  https://github.com/thamwangjun/get-shit-done/commits/main

⚠️  **Note:** The installer performs a clean install of GSD folders:
- `commands/gsd/` will be wiped and replaced
- `get-shit-done/` will be wiped and replaced
- `agents/gsd-*` files will be replaced

(Paths are relative to detected runtime install location:
global: `~/.claude/`, `~/.config/opencode/`, `~/.opencode/`, `~/.gemini/`, `~/.config/kilo/`, or `~/.codex/`
local: `./.claude/`, `./.config/opencode/`, `./.opencode/`, `./.gemini/`, `./.kilo/`, or `./.codex/`)

Your custom files in other locations are preserved:
- Custom commands not in `commands/gsd/` ✓
- Custom agents not prefixed with `gsd-` ✓
- Custom hooks ✓
- Your CLAUDE.md files ✓

If you've modified any GSD files directly, they'll be automatically backed up to `gsd-local-patches/` and can be reapplied with `/gsd:update --reapply` after the update.
```

**Text mode (`workflow.text_mode: true` in config or `--text` flag):** Set `TEXT_MODE=true` if `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is `true`. When TEXT_MODE is active, replace every `AskUserQuestion` call with a plain-text numbered list and ask the user to type their choice number. This is required for non-Claude runtimes (OpenAI Codex, Gemini CLI, etc.) where `AskUserQuestion` is not available.
Use AskUserQuestion:
- Question: "Proceed with update?"
- Options:
  - "Yes, update now"
  - "No, cancel"

**If user cancels:** Exit.
</step>

<step name="backup_custom_files">
Before running the installer, detect and back up any user-added files inside
GSD-managed directories. These are files that exist on disk but are NOT listed
in `gsd-file-manifest.json` — i.e., files the user added themselves that the
installer does not know about and will delete during the wipe.

**Do not use bash path-stripping (`${filepath#$RUNTIME_DIR/}`) or `node -e require()`
inline** — those patterns fail when `$RUNTIME_DIR` is unset and the stripped
relative path may not match manifest key format, which causes CUSTOM_COUNT=0
even when custom files exist. Use `gsd-sdk query detect-custom-files`
when `gsd-sdk` is on `PATH`, or the bundled `gsd-tools.cjs detect-custom-files`
otherwise — both resolve paths reliably with Node.js `path.relative()`.

First, resolve the config directory (`RUNTIME_DIR`) from the install scope
detected in `get_installed_version`:

```bash
# RUNTIME_DIR is the resolved config directory (e.g. ~/.config/opencode, ~/.gemini).
# get_installed_version emits it as GSD_DIR (LOCAL or GLOBAL install dir, or empty
# when scope is UNKNOWN). Empty RUNTIME_DIR skips the backup below.
RUNTIME_DIR="$GSD_DIR"
```

If `RUNTIME_DIR` is empty or does not exist, skip this step (no config dir to
inspect).

Otherwise run `detect-custom-files`:

```bash
CUSTOM_JSON=''
if [ -f "$GSD_TOOLS" ] && [ -n "$RUNTIME_DIR" ]; then
  CUSTOM_JSON=$(node "$GSD_TOOLS" detect-custom-files --config-dir "$RUNTIME_DIR" 2>/dev/null)
fi
if [ -z "$CUSTOM_JSON" ]; then
  CUSTOM_JSON='{"custom_files":[],"custom_count":0}'
fi
CUSTOM_COUNT=$(echo "$CUSTOM_JSON" | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).custom_count);}catch{console.log(0);}})" 2>/dev/null || echo "0")
```

**If `CUSTOM_COUNT` > 0:**

Back up each custom file to `$RUNTIME_DIR/gsd-user-files-backup/` before the
installer wipes the directories:

```bash
BACKUP_DIR="$RUNTIME_DIR/gsd-user-files-backup"
mkdir -p "$BACKUP_DIR"

# Parse custom_files array from CUSTOM_JSON and copy each file
node - "$RUNTIME_DIR" "$BACKUP_DIR" "$CUSTOM_JSON" <<'JSEOF'
const [,, runtimeDir, backupDir, customJson] = process.argv;
const { custom_files } = JSON.parse(customJson);
const fs = require('fs');
const path = require('path');
for (const relPath of custom_files) {
  const src = path.join(runtimeDir, relPath);
  const dst = path.join(backupDir, relPath);
  if (!fs.existsSync(src)) continue;

  try {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    console.log('  Backed up: ' + relPath);
  } catch (err) {
    const code = err && err.code ? String(err.code) : 'ERROR';
    console.log('  Skipped (non-fatal): ' + relPath + ' [' + code + ']');
  }
}
JSEOF
```

Then inform the user:

```
⚠️  Found N custom file(s) inside GSD-managed directories.
    These have been backed up to gsd-user-files-backup/ before the update.
    Restore them after the update if needed.
```

**If `CUSTOM_COUNT` == 0:** No user-added files detected. Continue to install.
</step>

<step name="run_update">
Run the update using the install type detected in step 1:

Build runtime flag from step 1:
```bash
RUNTIME_FLAG="--$TARGET_RUNTIME"
```

**If LOCAL install:**
```bash
npx -y --package=@opengsd/get-shit-done-redux@latest -- get-shit-done-redux "$RUNTIME_FLAG" --local
```

**If GLOBAL install:**
```bash
npx -y --package=@opengsd/get-shit-done-redux@latest -- get-shit-done-redux "$RUNTIME_FLAG" --global
```

**If UNKNOWN install:**
```bash
npx -y --package=@opengsd/get-shit-done-redux@latest -- get-shit-done-redux --claude --global
```

Capture output. If install fails, show error and exit.

Clear the update cache so statusline indicator disappears:

```bash
expand_home() {
  case "$1" in
    "~/"*) printf '%s/%s\n' "$HOME" "${1#~/}" ;;
    *) printf '%s\n' "$1" ;;
  esac
}

# Clear update cache across preferred, env-derived, and default runtime directories
CACHE_DIRS=()
if [ -n "$PREFERRED_CONFIG_DIR" ]; then
  CACHE_DIRS+=( "$(expand_home "$PREFERRED_CONFIG_DIR")" )
fi
if [ -n "$CLAUDE_CONFIG_DIR" ]; then
  CACHE_DIRS+=( "$(expand_home "$CLAUDE_CONFIG_DIR")" )
fi
if [ -n "$GEMINI_CONFIG_DIR" ]; then
  CACHE_DIRS+=( "$(expand_home "$GEMINI_CONFIG_DIR")" )
fi
if [ -n "$KILO_CONFIG_DIR" ]; then
  CACHE_DIRS+=( "$(expand_home "$KILO_CONFIG_DIR")" )
elif [ -n "$KILO_CONFIG" ]; then
  CACHE_DIRS+=( "$(dirname "$(expand_home "$KILO_CONFIG")")" )
elif [ -n "$XDG_CONFIG_HOME" ]; then
  CACHE_DIRS+=( "$(expand_home "$XDG_CONFIG_HOME")/kilo" )
fi
if [ -n "$OPENCODE_CONFIG_DIR" ]; then
  CACHE_DIRS+=( "$(expand_home "$OPENCODE_CONFIG_DIR")" )
elif [ -n "$OPENCODE_CONFIG" ]; then
  CACHE_DIRS+=( "$(dirname "$(expand_home "$OPENCODE_CONFIG")")" )
elif [ -n "$XDG_CONFIG_HOME" ]; then
  CACHE_DIRS+=( "$(expand_home "$XDG_CONFIG_HOME")/opencode" )
fi
if [ -n "$CODEX_HOME" ]; then
  CACHE_DIRS+=( "$(expand_home "$CODEX_HOME")" )
fi
if [ -n "$CURSOR_CONFIG_DIR" ]; then
  CACHE_DIRS+=( "$(expand_home "$CURSOR_CONFIG_DIR")" )
fi
if [ -n "$WINDSURF_CONFIG_DIR" ]; then
  CACHE_DIRS+=( "$(expand_home "$WINDSURF_CONFIG_DIR")" )
fi
if [ -n "$AUGMENT_CONFIG_DIR" ]; then
  CACHE_DIRS+=( "$(expand_home "$AUGMENT_CONFIG_DIR")" )
fi
if [ -n "$TRAE_CONFIG_DIR" ]; then
  CACHE_DIRS+=( "$(expand_home "$TRAE_CONFIG_DIR")" )
fi
if [ -n "$QWEN_CONFIG_DIR" ]; then
  CACHE_DIRS+=( "$(expand_home "$QWEN_CONFIG_DIR")" )
fi
if [ -n "$HERMES_HOME" ]; then
  CACHE_DIRS+=( "$(expand_home "$HERMES_HOME")" )
fi
if [ -n "$CODEBUDDY_CONFIG_DIR" ]; then
  CACHE_DIRS+=( "$(expand_home "$CODEBUDDY_CONFIG_DIR")" )
fi
if [ -n "$CLINE_CONFIG_DIR" ]; then
  CACHE_DIRS+=( "$(expand_home "$CLINE_CONFIG_DIR")" )
fi

for dir in "${CACHE_DIRS[@]}"; do
  if [ -n "$dir" ]; then
    rm -f "$dir/cache/gsd-update-check"*.json
  fi
done

for dir in .claude .config/opencode .opencode .gemini/antigravity-ide .gemini/antigravity-cli .gemini/antigravity .gemini .config/kilo .kilo .codex; do
  rm -f "./$dir/cache/gsd-update-check.json"
  rm -f "$HOME/$dir/cache/gsd-update-check.json"
done

# Clear the shared tool-agnostic cache written by gsd-check-update.js hook.
# The hook uses ~/.cache/gsd/gsd-update-check.json regardless of runtime; clear it
# so the statusline stops showing the stale "⬆ /gsd:update" indicator after update.
rm -f "$HOME/.cache/gsd/gsd-update-check.json"
```

The SessionStart hook (`gsd-check-update.js`) writes to the detected runtime's cache directory, so preferred/env-derived paths and default paths must all be cleared to prevent stale update indicators.
</step>

<step name="display_result">
Format completion message (changelog was already shown in confirmation step):

```
╔═══════════════════════════════════════════════════════════╗
║  GSD Updated: abc1234 → def5678                           ║
╚═══════════════════════════════════════════════════════════╝

⚠️  Restart your runtime to pick up the new commands.

[View recent commits](https://github.com/thamwangjun/get-shit-done/commits/main)
```
</step>


<step name="check_local_patches">
After update completes, check if the installer detected and backed up any locally modified files:

Check for gsd-local-patches/backup-meta.json in the config directory.

**If patches found:**

```
Local patches were backed up before the update.
Run `/gsd:update --reapply` to merge your modifications into the new version.
```

**If no patches:** Continue normally.
</step>
</process>

<success_criteria>
- [ ] Installed version read correctly
- [ ] Latest commit SHA fetched via GitHub Commits API
- [ ] Update skipped if already current
- [ ] SHA comparison performed and displayed BEFORE update
- [ ] Clean install warning shown
- [ ] User confirmation obtained
- [ ] Update executed successfully
- [ ] Restart reminder shown
</success_criteria>
