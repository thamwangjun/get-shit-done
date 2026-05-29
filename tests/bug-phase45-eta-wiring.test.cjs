'use strict';

/**
 * Phase 45 — Eta wiring validation tests
 *
 * INTG-01: eta ^4.6.0 in dependencies + Eta instance config in bin/install.js
 * INTG-02: Zero bare-line @~ survivors across commands/gsd/, agents/,
 *          get-shit-done/workflows/, get-shit-done/references/
 * INTG-03: Zero bare-line ^@\.planning/ patterns survive in agents/
 * INTG-06: SKILL.md files contain 0 install-time @~/.claude/get-shit-done/ bare-line refs
 */

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');

// ─── INTG-01: eta in dependencies + Eta instance config ───────────────────────

describe('INTG-01: eta dependency and Eta instance wiring', () => {
  test('eta ^4.6.0 is in dependencies (not devDependencies) in package.json', () => {
    const pkgPath = path.join(REPO_ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    assert.ok(
      pkg.dependencies && pkg.dependencies.eta,
      'eta must be in dependencies, not devDependencies'
    );
    assert.match(
      pkg.dependencies.eta,
      /^\^?4\./,
      `eta version must be ^4.x, got: ${pkg.dependencies.eta}`
    );
    // Must NOT be in devDependencies
    assert.ok(
      !pkg.devDependencies || !pkg.devDependencies.eta,
      'eta must NOT be in devDependencies'
    );
  });

  test('bin/install.js has module-level Eta instance with autoEscape:false', () => {
    const installSrc = fs.readFileSync(path.join(REPO_ROOT, 'bin', 'install.js'), 'utf-8');
    assert.match(
      installSrc,
      /autoEscape\s*:\s*false/,
      'Eta instance must be configured with autoEscape: false'
    );
  });

  test('bin/install.js has Eta instance with useWith:true', () => {
    const installSrc = fs.readFileSync(path.join(REPO_ROOT, 'bin', 'install.js'), 'utf-8');
    assert.match(
      installSrc,
      /useWith\s*:\s*true/,
      'Eta instance must be configured with useWith: true'
    );
  });

  test('bin/install.js Eta instance uses default delimiters — no custom tags config', () => {
    const installSrc = fs.readFileSync(path.join(REPO_ROOT, 'bin', 'install.js'), 'utf-8');
    assert.doesNotMatch(
      installSrc,
      /tags\s*:\s*\[.*'\{%'.*'%}'.*\]/,
      'Eta instance must use default delimiters — custom tags:["{%","%}"] config must be absent (Phase 46 D-01)'
    );
  });

  test('bin/install.js Eta instance uses default raw prefix — no custom parse.raw config', () => {
    const installSrc = fs.readFileSync(path.join(REPO_ROOT, 'bin', 'install.js'), 'utf-8');
    assert.doesNotMatch(
      installSrc,
      /parse\s*:\s*\{[^}]*raw\s*:\s*'~'[^}]*\}/,
      'Eta instance must use default raw prefix — custom parse:{raw:"~"} config must be absent (Phase 46 D-01)'
    );
  });

  test('bin/install.js Eta instance views points to repo root (parent of bin/)', () => {
    const installSrc = fs.readFileSync(path.join(REPO_ROOT, 'bin', 'install.js'), 'utf-8');
    // renderEtaContent creates a fresh Eta instance per call. Verify both halves:
    // 1. A module-level variable (_etaSourceRoot) is assigned path.join(__dirname, '..')
    // 2. renderEtaContent is called with _etaSourceRoot as the viewsRoot argument,
    //    which is then passed as views: viewsRoot inside renderEtaContent
    const definesParentDirVar = /(?:const|let|var)\s+\w+\s*=\s*path\.join\(__dirname,\s*['"]\.\.['"]\s*\)/.test(installSrc);
    const passedToRenderEta = /renderEtaContent\s*\([^)]*_etaSourceRoot\s*\)/.test(installSrc);
    const viewsSetInline = /views\s*:\s*path\.join\(__dirname,\s*['"]\.\.['"]\s*\)/.test(installSrc);
    assert.ok(
      (definesParentDirVar && passedToRenderEta) || viewsSetInline,
      'Eta views root must resolve to path.join(__dirname, "..") — the repo root (one level above bin/). ' +
      '_etaSourceRoot must be defined as path.join(__dirname, "..") and passed to renderEtaContent calls.'
    );
  });
});

// ─── INTG-02: Zero bare-line @~ survivors across 4 source layers ──────────────

describe('INTG-02: zero bare-line @~ survivors across source layers', () => {
  /**
   * A line is "bare" only if the trimmed content starts with the pattern,
   * i.e. the entire trimmed line IS the @~ reference (not inline prose,
   * not backtick-wrapped, not a list-item with trailing prose).
   *
   * D-08-exempt: mid-sentence, backtick-wrapped, or list-item prose refs
   * are NOT flagged.
   */
  function findBareLineAtTildeRefs(dir) {
    const survivors = [];
    const patterns = [
      /^@~\/\.claude\/get-shit-done\//,
      /^@\$HOME\/\.claude\/get-shit-done\//,
    ];

    function walkDir(currentDir) {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split(/\r?\n/);
          for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            for (const pattern of patterns) {
              if (pattern.test(trimmed)) {
                survivors.push({
                  file: path.relative(REPO_ROOT, fullPath),
                  line: i + 1,
                  content: lines[i],
                });
              }
            }
          }
        }
      }
    }

    assert.ok(fs.existsSync(dir), `Source directory must exist for this check: ${dir}`);
    walkDir(dir);
    return survivors;
  }

  const SOURCE_LAYERS = [
    path.join(REPO_ROOT, 'commands', 'gsd'),
    path.join(REPO_ROOT, 'agents'),
    path.join(REPO_ROOT, 'get-shit-done', 'workflows'),
    path.join(REPO_ROOT, 'get-shit-done', 'references'),
  ];

  test('commands/gsd/ has zero bare-line @~ survivors', () => {
    const survivors = findBareLineAtTildeRefs(SOURCE_LAYERS[0]);
    assert.strictEqual(
      survivors.length,
      0,
      `Found ${survivors.length} bare-line @~ survivor(s) in commands/gsd/:\n` +
        survivors.map(s => `  ${s.file}:${s.line}: ${s.content.trim()}`).join('\n')
    );
  });

  test('agents/ has zero bare-line @~ survivors', () => {
    const survivors = findBareLineAtTildeRefs(SOURCE_LAYERS[1]);
    assert.strictEqual(
      survivors.length,
      0,
      `Found ${survivors.length} bare-line @~ survivor(s) in agents/:\n` +
        survivors.map(s => `  ${s.file}:${s.line}: ${s.content.trim()}`).join('\n')
    );
  });

  test('get-shit-done/workflows/ has zero bare-line @~ survivors', () => {
    const survivors = findBareLineAtTildeRefs(SOURCE_LAYERS[2]);
    assert.strictEqual(
      survivors.length,
      0,
      `Found ${survivors.length} bare-line @~ survivor(s) in get-shit-done/workflows/:\n` +
        survivors.map(s => `  ${s.file}:${s.line}: ${s.content.trim()}`).join('\n')
    );
  });

  test('get-shit-done/references/ has zero bare-line @~ survivors', () => {
    const survivors = findBareLineAtTildeRefs(SOURCE_LAYERS[3]);
    assert.strictEqual(
      survivors.length,
      0,
      `Found ${survivors.length} bare-line @~ survivor(s) in get-shit-done/references/:\n` +
        survivors.map(s => `  ${s.file}:${s.line}: ${s.content.trim()}`).join('\n')
    );
  });
});

// ─── INTG-03: @.planning/ bare-line refs in agents/ converted to !cat form ────

describe('INTG-03: zero bare-line @.planning/ refs survive in agents/', () => {
  test('agents/ has zero bare-line ^@\\.planning/ patterns', () => {
    const agentsDir = path.join(REPO_ROOT, 'agents');
    const survivors = [];

    function walkDir(currentDir) {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split(/\r?\n/);
          for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            if (/^@\.planning\//.test(trimmed)) {
              survivors.push({
                file: path.relative(REPO_ROOT, fullPath),
                line: i + 1,
                content: lines[i],
              });
            }
          }
        }
      }
    }

    assert.ok(fs.existsSync(agentsDir), `Source directory must exist for this check: ${agentsDir}`);
    walkDir(agentsDir);

    assert.strictEqual(
      survivors.length,
      0,
      `Found ${survivors.length} bare-line @.planning/ survivor(s) in agents/ — ` +
        'these should be in `!\\`cat .planning/X\\`` form:\n' +
        survivors.map(s => `  ${s.file}:${s.line}: ${s.content.trim()}`).join('\n')
    );
  });
});

// ─── INTG-06: SKILL.md files have no install-time @~ bare-line refs ───────────

describe('INTG-06: SKILL.md files contain zero install-time @~ bare-line refs', () => {
  test('all SKILL.md files in repo (excluding node_modules) have zero bare-line @~ refs', () => {
    const survivors = [];

    function findSkillFiles(dir) {
      const results = [];
      function walk(currentDir) {
        let entries;
        try {
          entries = fs.readdirSync(currentDir, { withFileTypes: true });
        } catch (_) {
          return;
        }
        for (const entry of entries) {
          if (entry.name === 'node_modules') continue;
          const fullPath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            walk(fullPath);
          } else if (entry.isFile() && entry.name === 'SKILL.md') {
            results.push(fullPath);
          }
        }
      }
      walk(dir);
      return results;
    }

    const skillFiles = findSkillFiles(REPO_ROOT);

    // If no SKILL.md files exist the test provides no coverage — return early
    // to make the vacuous-pass visible in test output rather than silently green.
    // When SKILL.md files are added to the repo, remove this guard.
    if (skillFiles.length === 0) {
      // eslint-disable-next-line no-console
      console.warn('INTG-06: no SKILL.md files found outside node_modules — skipping bare-line @~ check');
      return;
    }

    for (const filePath of skillFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (
          /^@~\/\.claude\/get-shit-done\//.test(trimmed) ||
          /^@\$HOME\/\.claude\/get-shit-done\//.test(trimmed)
        ) {
          survivors.push({
            file: path.relative(REPO_ROOT, filePath),
            line: i + 1,
            content: lines[i],
          });
        }
      }
    }

    assert.strictEqual(
      survivors.length,
      0,
      `Found ${survivors.length} bare-line @~ ref(s) in SKILL.md file(s) — ` +
        'applyRuntimeContentRewritesInPlace should not need Eta rendering for SKILL.md:\n' +
        survivors.map(s => `  ${s.file}:${s.line}: ${s.content.trim()}`).join('\n')
    );
  });
});
