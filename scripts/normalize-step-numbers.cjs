#!/usr/bin/env node
/**
 * normalize-step-numbers.cjs
 *
 * Cross-file-aware, idempotent CLI that detects decimal/letter-suffix step
 * labels across SCAN_DIRS, renumbers them to sequential whole integers per
 * section, dynamically discovers cross-file prose references, and updates
 * them in-place.
 *
 * Phase 50 / NORM-02 maintenance script. Implements:
 *   D-01: Cross-file refs discovered dynamically by grepping the entire corpus
 *         on every run — no pre-built MAP-01 manifest consumed.
 *   D-02: stdout reports cross-file ref updates explicitly alongside rename stats.
 *   D-03: --dry-run exits 0 and reports "no changes needed" on a clean corpus.
 *
 * Cross-file ref discovery patterns (two word-order variants per D-04):
 *   Pattern 1: "<file>.md step N"      → /([a-z0-9_./-]+\.md)\s+step\s+(\d+(?:\.\d|[a-z])?)/gi
 *   Pattern 2: "step N in <file>.md"   → /step\s+(\d+(?:\.\d|[a-z])?)\s+in\s+([a-z0-9_./-]+\.md)/gi
 *
 * Usage:
 *   node scripts/normalize-step-numbers.cjs           # apply changes in-place
 *   node scripts/normalize-step-numbers.cjs --dry-run # report without writing
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Argument validation ──────────────────────────────────────────────────────

for (const arg of process.argv.slice(2)) {
  if (arg !== '--dry-run') {
    process.stderr.write(`Unknown flag: ${arg}\nUsage: node scripts/normalize-step-numbers.cjs [--dry-run]\n`);
    process.exit(1);
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DRY_RUN      = process.argv.includes('--dry-run');
const PROJECT_ROOT = path.join(__dirname, '..');

// Directories containing prompt files to scan
// (identical to tests/step-numbering-scan.test.cjs SCAN_DIRS)
const SCAN_DIRS = [
  'agents',
  'get-shit-done/workflows',
  'commands/gsd',
];

// Pattern C files excluded from all corpus scans (per CONTEXT.md D-07)
// (identical to tests/step-numbering-scan.test.cjs PATTERN_C_EXCLUDES)
const PATTERN_C_EXCLUDES = new Set([
  'get-shit-done/workflows/plan-phase.md',
  'get-shit-done/workflows/new-milestone.md',
  'get-shit-done/workflows/new-project.md',
]);

// Pattern A/B: bold or plain "Step N.M" decimal labels and "Step Na" letter-suffix labels.
// (identical to tests/step-numbering-scan.test.cjs STEP_DECIMAL_RE line 71)
const STEP_DECIMAL_RE = /(?:^|\s|\*\*)Step\s+\d+(?:\.\d|[a-z])/i;

// Pattern D: ordered-list decimal items at columns 0-2
// Capture groups: (leading whitespace)(integer)(fractional)(trailing text)
const PATTERN_D_RE = /^(\s{0,2})(\d+)\.(\d+)\.(\s.*)$/;

// Cross-file ref discovery patterns (D-01, D-04)
// Both /gi flagged for case-insensitive global match
const XREF_PATTERNS = [
  /([a-z0-9_./-]+\.md)\s+step\s+(\d+(?:\.\d|[a-z])?)/gi,
  /step\s+(\d+(?:\.\d|[a-z])?)\s+in\s+([a-z0-9_./-]+\.md)/gi,
];

// ─── File collection ──────────────────────────────────────────────────────────

/**
 * Recursively collect all .md files under dir.
 * Tolerates missing directories (ENOENT) silently; re-throws unexpected errors.
 * (Duplicated inline from tests/step-numbering-scan.test.cjs:168-186 per Phase 48 D-06)
 *
 * @param {string} dir
 * @returns {string[]}
 */
function collectMarkdownFiles(dir) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...collectMarkdownFiles(fullPath));
      } else if (entry.name.endsWith('.md')) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    // Tolerate missing directories (ENOENT) only — skip them silently.
    // Re-throw unexpected errors so they surface rather than causing silent empty scans.
    if (err.code !== 'ENOENT') throw err;
  }
  return results;
}

// Collect all markdown files from SCAN_DIRS, then filter out Pattern C excludes
// (identical pattern to tests/step-numbering-scan.test.cjs:55-63)
const ALL_FILES = [];
for (const dir of SCAN_DIRS) {
  ALL_FILES.push(...collectMarkdownFiles(path.join(PROJECT_ROOT, dir)));
}

const SCAN_FILES = ALL_FILES.filter(f =>
  !PATTERN_C_EXCLUDES.has(path.relative(PROJECT_ROOT, f).split(path.sep).join('/'))
);

// ─── Rename map computation ───────────────────────────────────────────────────

/**
 * Build a rename map for a single file's content.
 * Scans lines for Pattern A/B decimal step labels and Pattern D ordered-list
 * decimal items, computing the sequential whole-integer replacement per section.
 *
 * Section boundaries (## and ### headings) reset the per-section counter.
 * Code fences are skipped symmetrically (Pitfall 3).
 * Step 0 is preserved as a valid starting label (Phase 48 D-04).
 *
 * @param {string} content
 * @returns {Map<string, string>} Maps old label strings to new label strings
 */
function buildRenameMap(content) {
  const renameMap = new Map();
  const lines = content.split('\n');
  let inCodeBlock = false;
  let sectionCounter = 0;     // sequential counter for Pattern A/B per section
  let patternDCounter = 0;    // sequential counter for Pattern D per section

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code fence toggle (Pattern 2 — symmetric skip)
    if (/^```/.test(trimmed)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Section boundary: ## or ### heading resets the per-section counters (Pattern 5)
    // Reset counters but do NOT continue — heading lines may also contain decimal step labels.
    if (/^#{2,3}\s/.test(line)) {
      sectionCounter = 0;
      patternDCounter = 0;
    }

    // Pattern A/B: "Step N.M" or "Step Na" — any decimal or letter-suffix step label
    // Use a global regex loop to capture ALL matches per line (CR-02: no /g flag was missing)
    if (STEP_DECIMAL_RE.test(line)) {
      const lineRe = /(?:^|\s|\*\*)(Step\s+(\d+)(?:\.(\d+)|([a-z])))/gi;
      let match;
      while ((match = lineRe.exec(line)) !== null) {
        const oldLabel = match[1]; // e.g., "Step 2.5"
        // Each decimal/letter step increments the counter; use counter as target (CR-01)
        sectionCounter++;
        const newNum = sectionCounter;
        const newLabel = oldLabel.replace(/Step\s+\d+(?:\.\d+|[a-z])/i, `Step ${newNum}`);
        if (oldLabel !== newLabel) {
          renameMap.set(oldLabel, newLabel);
        }
      }
    }

    // Pattern D: ordered-list decimal items at columns 0-2 (e.g., "2.5. text")
    const patternDMatch = line.match(PATTERN_D_RE);
    if (patternDMatch) {
      const [, leading, integer, , trailing] = patternDMatch;
      // Use patternDCounter for sequential whole-integer target (CR-01)
      patternDCounter++;
      const newNum = patternDCounter;
      // Store as a positional replacement keyed by the decimal form
      const oldFull = `${integer}.${patternDMatch[3]}.`;
      const newFull = `${newNum}.`;
      renameMap.set(oldFull, newFull);
    }
  }

  return renameMap;
}

// ─── Content rewriting ────────────────────────────────────────────────────────

/**
 * Apply a rename map to file content.
 * Walks content line-by-line with the same fence toggle.
 * Replaces each Pattern A/B or Pattern D label per the rename map.
 *
 * @param {string} content
 * @param {Map<string, string>} renameMap
 * @returns {string}
 */
function applyRenameMap(content, renameMap) {
  if (renameMap.size === 0) return content;

  const lines = content.split('\n');
  let inCodeBlock = false;
  const out = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

    // Code fence toggle (symmetric — Pitfall 3)
    if (/^```/.test(trimmed)) {
      inCodeBlock = !inCodeBlock;
      out.push(line);
      continue;
    }
    if (inCodeBlock) {
      out.push(line);
      continue;
    }

    // Apply Pattern A/B renames
    for (const [oldLabel, newLabel] of renameMap) {
      // Only replace if the line actually contains this label
      if (line.includes(oldLabel)) {
        line = line.split(oldLabel).join(newLabel);
      }
    }

    // Apply Pattern D renames (decimal ordered-list items)
    const patternDMatch = line.match(PATTERN_D_RE);
    if (patternDMatch) {
      const [fullMatch, leading, integer, fractional, trailing] = patternDMatch;
      const oldDecimal = `${integer}.${fractional}.`;
      if (renameMap.has(oldDecimal)) {
        const newNum = renameMap.get(oldDecimal);
        line = `${leading}${newNum}${trailing}`;
      }
    }

    out.push(line);
  }

  return out.join('\n');
}

// ─── Cross-file ref discovery ─────────────────────────────────────────────────

/**
 * Discover cross-file prose references across the entire corpus (D-01).
 * For each source file, scans lines (with fence toggle) applying both
 * XREF_PATTERNS to find references of the form:
 *   "<file>.md step N" or "step N in <file>.md"
 *
 * Same-file refs are excluded: requires BOTH basename equality AND path-suffix
 * agreement (Pitfall 4 — both checks must agree).
 *
 * @param {string[]} corpusFiles  - All files to scan as potential sources
 * @param {Map<string, Map<string, string>>} renameMaps - Per-file rename maps keyed by absolute path
 * @returns {Array<{sourceFile: string, lineNumber: number, targetFile: string, oldStep: string, newStep: string}>}
 */
function discoverCrossFileRefs(corpusFiles, renameMaps) {
  const updates = [];

  for (const sourceFile of corpusFiles) {
    let content;
    try {
      content = fs.readFileSync(sourceFile, 'utf-8');
    } catch (err) {
      continue;
    }

    const lines = content.split('\n');
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Code fence toggle (symmetric — Pitfall 3)
      if (/^```/.test(trimmed)) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;

      // Apply both XREF_PATTERNS
      for (const patternTemplate of XREF_PATTERNS) {
        // Reset lastIndex since we're reusing across iterations
        const re = new RegExp(patternTemplate.source, patternTemplate.flags);
        let m;
        while ((m = re.exec(line)) !== null) {
          // Determine which capture group is the filename vs step number
          // Pattern 1: m[1]=filename, m[2]=step
          // Pattern 2: m[1]=step, m[2]=filename
          let targetFile, oldStep;
          if (m[1] && m[1].endsWith('.md')) {
            targetFile = m[1];
            oldStep    = m[2];
          } else {
            oldStep    = m[1];
            targetFile = m[2];
          }

          const targetBasename = path.basename(targetFile);
          const sourceBasename = path.basename(sourceFile);

          // Same-file ref exclusion (Pitfall 4): both basename equality AND path-suffix must agree
          const isSameBasename = sourceBasename === targetBasename;
          const sourceRelPath  = path.relative(PROJECT_ROOT, sourceFile).split(path.sep).join('/');
          const isSameBySuffix = sourceRelPath === targetFile ||
                                 sourceRelPath.endsWith('/' + targetFile);
          if (isSameBasename && isSameBySuffix) continue;
          if (isSameBasename || isSameBySuffix) {
            // One matches but not the other — treat as same-file (conservative)
            if (isSameBasename) continue;
          }

          // Find the rename map for the target file.
          // Merge rename maps from ALL files sharing the basename (CR-03: 52 basenames
          // are shared across agents/, workflows/, commands/gsd/; first-match-break would
          // pick the wrong map for files appearing later in iteration order).
          const mergedRenameMap = new Map();
          for (const [filePath, rMap] of renameMaps) {
            if (path.basename(filePath) === targetBasename) {
              for (const [k, v] of rMap) mergedRenameMap.set(k, v);
            }
          }

          if (mergedRenameMap.size === 0) continue;

          // Check if this step label is in the rename map
          // The step in the cross-ref is a number like "1.5" or "7a"
          // Match against Pattern A/B rename map keys (which look like "Step 2.5")
          for (const [oldLabel, newLabel] of mergedRenameMap) {
            // Extract the numeric part from oldLabel (e.g., "Step 2.5" → "2.5")
            const labelMatch = oldLabel.match(/Step\s+(\d+(?:\.\d+|[a-z]))/i);
            if (!labelMatch) continue;
            const labelNum = labelMatch[1]; // e.g., "2.5"

            if (oldStep === labelNum || oldStep.replace('.', '.') === labelNum) {
              const newNum = newLabel.match(/Step\s+(\d+)/i);
              if (newNum) {
                updates.push({
                  sourceFile,
                  lineNumber: i + 1,
                  targetFile: targetBasename,
                  oldStep,
                  newStep: newNum[1],
                });
              }
            }
          }
        }
      }
    }
  }

  return updates;
}

// ─── Per-file processing ──────────────────────────────────────────────────────

/**
 * Process a single file: apply rename map and cross-file ref updates.
 * Idempotency: if result equals original, returns { renamed: 0, xref: 0 }.
 * Write is gated on !DRY_RUN (Pattern 3).
 *
 * @param {string} filePath
 * @param {Map<string, string>} renameMap
 * @param {Array<{sourceFile, lineNumber, targetFile, oldStep, newStep}>} xrefUpdates - filtered to this file
 * @returns {{ renamed: number, xref: number }}
 */
function processFile(filePath, renameMap, xrefUpdates) {
  const original = fs.readFileSync(filePath, 'utf-8');

  // Apply same-file rename map
  let result = applyRenameMap(original, renameMap);

  // Apply cross-file ref updates for this source file
  const fileUpdates = xrefUpdates.filter(u => u.sourceFile === filePath);
  let xrefCount = 0;
  if (fileUpdates.length > 0) {
    const lines = result.split('\n');
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (/^```/.test(trimmed)) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;

      // Apply each xref update that matches this line
      for (const upd of fileUpdates) {
        if (upd.lineNumber - 1 !== i) continue; // line numbers are 1-based
        const oldStr = upd.oldStep;
        const newStr = upd.newStep;
        if (lines[i].includes(oldStr)) {
          // Replace the step number in the context of the cross-ref pattern
          // Use targeted replacement to avoid clobbering unrelated numbers
          const before = lines[i];
          // Replace "step <oldStep>" with "step <newStep>" (case-insensitive)
          lines[i] = lines[i].replace(
            new RegExp(`(step\\s+)${oldStr.replace('.', '\\.')}(?=\\b|\\s|[,.]|$)`, 'gi'),
            `$1${newStr}`
          );
          if (lines[i] !== before) xrefCount++;
        }
      }
    }
    result = lines.join('\n');
  }

  // Idempotency: no change → no write
  if (result === original) return { renamed: 0, xref: xrefCount };

  if (!DRY_RUN) fs.writeFileSync(filePath, result, 'utf-8');

  const renamed = renameMap.size > 0 && result !== original ? renameMap.size : 0;
  return { renamed, xref: xrefCount };
}

// ─── Main driver ──────────────────────────────────────────────────────────────

// First pass: build per-file rename maps
const renameMaps = new Map();
for (const filePath of SCAN_FILES) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const rMap = buildRenameMap(content);
  renameMaps.set(filePath, rMap);
}

// Second pass: discover all cross-file ref updates needed (D-01)
const allXrefUpdates = discoverCrossFileRefs(SCAN_FILES, renameMaps);

// Third pass: process each file — apply renames + xref updates
let renamedFilesCount = 0;
let xrefUpdatesCount  = 0;

for (const filePath of SCAN_FILES) {
  const renameMap = renameMaps.get(filePath) || new Map();
  const { renamed, xref } = processFile(filePath, renameMap, allXrefUpdates);

  const relPath = path.relative(PROJECT_ROOT, filePath).split(path.sep).join('/');

  if (renamed > 0 || xref > 0) {
    console.log(`${DRY_RUN ? '[dry]' : 'fixed'}: ${relPath} — ${renamed} rename(s), ${xref} cross-file ref(s)`);
    if (renamed > 0) renamedFilesCount++;
    if (xref > 0) xrefUpdatesCount += xref;
  }
}

// Final summary (D-02, D-03)
console.log(`\n${renamedFilesCount} file(s) ${DRY_RUN ? 'would be' : 'were'} renormalized.`);
console.log(`${xrefUpdatesCount} cross-file ref(s) ${DRY_RUN ? 'would be' : 'were'} updated.`);
if (renamedFilesCount === 0 && xrefUpdatesCount === 0) {
  console.log('No changes needed.');
}

process.exit(0);
