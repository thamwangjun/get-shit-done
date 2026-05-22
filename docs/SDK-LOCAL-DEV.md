# SDK Local Development

How to build `gsd-sdk` from source, link it globally for local testing, and uninstall.

The SDK lives in the `sdk/` subdirectory of the repo. It is a TypeScript ESM package that compiles to `sdk/dist/` via `tsc`.

## Prerequisites

- Node.js >= 20.0.0
- The repo cloned locally (`git clone https://github.com/gsd-build/get-shit-done.git`)

## Build

```bash
cd sdk
npm install
npm run build
```

`npm run build` runs `tsc` and outputs compiled JS + type declarations to `sdk/dist/`. The CLI entry point is `sdk/dist/cli.js`.

## Link globally

After building, link the package so `gsd-sdk` is available on your PATH from your local source:

```bash
# Still inside sdk/
npm link
```

This registers `@gsd-build/sdk` as a global package and creates a `gsd-sdk` binary symlink pointing at `dist/cli.js`. Because it is a symlink, any subsequent `npm run build` is reflected immediately — no re-link required.

Verify the link:

```bash
which gsd-sdk
# e.g. /home/<user>/.local/share/mise/installs/node/<version>/bin/gsd-sdk
```

## Rebuild after source changes

```bash
cd sdk
npm run build   # re-compiles src/ → dist/; the global link picks it up automatically
```

## Uninstall

Remove the global link and restore any previously installed version from npm:

```bash
npm unlink -g @gsd-build/sdk
```

To reinstall the published version:

```bash
npm install -g @gsd-build/sdk
```

## SDK build commands

| Command | Description |
|---------|-------------|
| `npm run build` | Compiles TypeScript (`src/`) to `dist/` |
| `npm test` | Runs unit tests via Vitest |
| `npm run test:unit` | Unit tests only |
| `npm run test:integration` | Integration tests only |
| `npm run prepublishOnly` | Runs `build` before `npm publish` — not for manual use |
