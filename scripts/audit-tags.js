'use strict';

/**
 * audit-tags.js
 *
 * Scans all in-scope GSD prompt files across four levels and produces:
 *   - .planning/phases/20-baseline-audit/20-BASELINE-AUDIT.json  (machine-readable)
 *   - .planning/phases/20-baseline-audit/20-BASELINE-AUDIT.md    (human-readable tables)
 *
 * Usage:
 *   node scripts/audit-tags.js
 *
 * Re-runnable by phases 21–24 to verify conversion progress.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// ---------------------------------------------------------------------------
// Level definitions
// ---------------------------------------------------------------------------
const LEVELS = [
  {
    level: 1,
    label: 'Level 1 — Agents',
    dir: path.join(ROOT, 'agents'),
    filter: f => f.startsWith('gsd-') && f.endsWith('.md'),
    canonical: 'persona',
  },
  {
    level: 2,
    label: 'Level 2 — Commands',
    dir: path.join(ROOT, 'commands', 'gsd'),
    filter: f => f.endsWith('.md'),
    canonical: 'intent',
  },
  {
    level: 3,
    label: 'Level 3 — Workflows',
    dir: path.join(ROOT, 'get-shit-done', 'workflows'),
    filter: f => f.endsWith('.md'),
    canonical: 'objective',
  },
  {
    level: 4,
    label: 'Level 4a — Templates',
    dir: path.join(ROOT, 'get-shit-done', 'templates'),
    filter: f => f.endsWith('.md'),
    canonical: 'task',
  },
  {
    level: 5,
    label: 'Level 5 — References',
    dir: path.join(ROOT, 'get-shit-done', 'references'),
    filter: f => f.endsWith('.md'),
    canonical: 'task',
  },
];

// Primary directive tag candidates to detect.
// A "primary directive" is a bare top-level block: line.trim() === '<tagname>'
const PRIMARY_TAGS = ['persona', 'intent', 'objective', 'task', 'role', 'purpose'];

// ---------------------------------------------------------------------------
// detectTags(content) → string[]
// Returns deduplicated list of primary directive tag names found as bare blocks,
// in order of first occurrence. Code fences and inline backticks are stripped
// first to avoid false positives from documentation examples.
// ---------------------------------------------------------------------------
function detectTags(content) {
  const withoutFences = content.replace(/```[\s\S]*?```/g, '');
  const withoutInlineCode = withoutFences.replace(/`[^`]+`/g, '');
  const lines = withoutInlineCode.split('\n');
  const seen = new Set();
  const found = [];
  for (const line of lines) {
    for (const tag of PRIMARY_TAGS) {
      if (line.trim() === '<' + tag + '>') {
        if (!seen.has(tag)) {
          seen.add(tag);
          found.push(tag);
        }
      }
    }
  }
  return found;
}

// ---------------------------------------------------------------------------
// classifyStatus(foundTags, canonical) → 'ok' | 'missing' | 'wrong-level' | 'multiple'
// ---------------------------------------------------------------------------
function classifyStatus(foundTags, canonical) {
  if (foundTags.length === 0) return 'missing';
  if (foundTags.length > 1) return 'multiple';
  if (foundTags[0] === canonical) return 'ok';
  return 'wrong-level';
}

// ---------------------------------------------------------------------------
// Main scan
// ---------------------------------------------------------------------------
if (require.main === module) {
const timestamp = new Date().toISOString();
const levelResults = [];
let grandTotalFiles = 0;
let grandTotalAnomalies = 0;

for (const lvl of LEVELS) {
  const directory = path.relative(ROOT, lvl.dir).replace(/\\/g, '/');

  let filenames;
  try {
    filenames = fs.readdirSync(lvl.dir)
      .filter(f => {
        const full = path.join(lvl.dir, f);
        return fs.statSync(full).isFile() && lvl.filter(f);
      })
      .sort();
  } catch (err) {
    console.warn(`[WARN] Cannot read directory ${lvl.dir}: ${err.message}`);
    levelResults.push({ level: lvl.level, label: lvl.label, directory, canonical_tag: lvl.canonical, total: 0, ok: 0, anomalies: 0, files: [] });
    continue;
  }

  const fileEntries = [];

  for (const filename of filenames) {
    const filePath = path.join(lvl.dir, filename);
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
      console.warn(`[WARN] Cannot read file ${filePath}: ${err.message}`);
      continue;
    }
    const foundTags = detectTags(content);
    const status = classifyStatus(foundTags, lvl.canonical);
    // Relative path from repo root (forward slashes for cross-platform consistency)
    const relPath = path.relative(ROOT, filePath).replace(/\\/g, '/');
    fileEntries.push({
      file: relPath,
      found_tags: foundTags,
      expected_tag: lvl.canonical,
      status,
    });
  }

  const total = fileEntries.length;
  const okCount = fileEntries.filter(e => e.status === 'ok').length;
  const anomalies = total - okCount;
  grandTotalFiles += total;
  grandTotalAnomalies += anomalies;

  levelResults.push({
    level: lvl.level,
    label: lvl.label,
    directory,
    canonical_tag: lvl.canonical,
    total,
    ok: okCount,
    anomalies,
    files: fileEntries,
  });
}

// ---------------------------------------------------------------------------
// Write JSON artifact
// ---------------------------------------------------------------------------
const jsonOutput = {
  generated: timestamp,
  // Omit human-readable `label` from machine output; label lives in the MD artifact only.
  levels: levelResults.map(({ label: _label, ...rest }) => rest),
};

const JSON_OUT_PATH = path.join(ROOT, '.planning', 'phases', '20-baseline-audit', '20-BASELINE-AUDIT.json');
fs.writeFileSync(JSON_OUT_PATH, JSON.stringify(jsonOutput, null, 2) + '\n', 'utf-8');

// ---------------------------------------------------------------------------
// Write Markdown artifact
// ---------------------------------------------------------------------------
const mdLines = [];
mdLines.push('# Tag Hierarchy Baseline Audit — v1.37.1c');
mdLines.push('');
mdLines.push(`Generated: ${timestamp}`);
mdLines.push('In-scope corpus: upstream/v1.37.1 file set');
mdLines.push('');

for (const lvl of levelResults) {
  const missingCount = lvl.files.filter(e => e.status === 'missing').length;
  const wrongLevelCount = lvl.files.filter(e => e.status === 'wrong-level').length;
  const multipleCount = lvl.files.filter(e => e.status === 'multiple').length;

  mdLines.push(`## ${lvl.label}`);
  mdLines.push('');
  mdLines.push(`**Canonical tag:** \`<${lvl.canonical_tag}>\``);
  mdLines.push(`**Files scanned:** ${lvl.total}`);
  mdLines.push(`**OK:** ${lvl.ok} | **Anomalies:** ${lvl.anomalies} (missing: ${missingCount}, wrong-level: ${wrongLevelCount}, multiple: ${multipleCount})`);
  mdLines.push('');
  mdLines.push('| File | Found Tag(s) | Expected | Status |');
  mdLines.push('|------|-------------|----------|--------|');

  for (const entry of lvl.files) {
    const foundDisplay = entry.found_tags.length > 0 ? entry.found_tags.join(', ') : 'none';
    mdLines.push(`| ${entry.file} | ${foundDisplay} | ${entry.expected_tag} | ${entry.status} |`);
  }

  mdLines.push('');
}

const MD_OUT_PATH = path.join(ROOT, '.planning', 'phases', '20-baseline-audit', '20-BASELINE-AUDIT.md');
fs.writeFileSync(MD_OUT_PATH, mdLines.join('\n') + '\n', 'utf-8');

// ---------------------------------------------------------------------------
// Console summary
// ---------------------------------------------------------------------------
console.log(`Audit complete. Files scanned: ${grandTotalFiles}. Anomalies: ${grandTotalAnomalies}.`);
console.log(`Written: .planning/phases/20-baseline-audit/20-BASELINE-AUDIT.json`);
console.log(`Written: .planning/phases/20-baseline-audit/20-BASELINE-AUDIT.md`);
} // end require.main === module
