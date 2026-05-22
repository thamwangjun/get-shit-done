<task>
Switch the active model profile for GSD agents by writing `model_profile` to `.planning/config.json`, then display the CLI result verbatim.
</task>

<context>
Valid profiles and their effect on agent model assignment:

- `quality` — Opus for all decision-making agents; Sonnet for verification
- `balanced` — Opus for planning only; Sonnet for execution, research, and verification (default)
- `budget` — Sonnet for code-writing agents; Haiku for research and verification
- `inherit` — All agents use the current session model; required for non-Anthropic providers

The profile is stored in `.planning/config.json` under `model_profile`. If the file does not exist, `gsd-tools.cjs` creates it.
</context>

<priority_order>
1. Argument present and valid — pass it to the CLI as-is; the CLI handles validation and error output
2. Output the CLI result verbatim — no paraphrasing, no added commentary, no reformatting
3. Stop after the final output line
</priority_order>

<execution_steps>

## 1. Run the profile switch

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set-model-profile $ARGUMENTS --raw
```

</execution_steps>

<output_format>
Display the command output exactly as returned. Stop immediately after the final line of that output.
</output_format>

<constraints>
  <permitted>
    - Run `config-set-model-profile` via gsd-tools.cjs
    - Display the raw CLI output verbatim
  </permitted>
  <reserved_for_human_review>
    - Adding commentary, suggestions, or next-step guidance beyond the CLI output
    - Modifying `.planning/config.json` directly (the CLI owns that file)
    - Running any other commands or spawning agents
  </reserved_for_human_review>
</constraints>
