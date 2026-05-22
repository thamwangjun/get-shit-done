'use strict';

/**
 * Negative Framing Scan
 *
 * Regression guard for the positive framing pass (plans/05-POSITIVE_FRAMING_PASS_V01.md).
 * Verifies that prompt files use positive framing — specifying what to do rather than
 * what not to do — per refs/PROMPT_IMPROVEMENT_GUIDE_V01.md Step 2.
 *
 * What this catches:
 *   - `NEVER [verb]` used as a bare primary directive (e.g. "NEVER use X", "NEVER add Y")
 *   - `DO NOT / Do NOT / do NOT [verb]` used as a primary directive with no positive
 *     complement on the same line
 *
 * What this does NOT flag (legitimate uses preserved by the pass):
 *   - Reframe patterns: "Your job is not to X — it is to Y"
 *   - Constraint pairs: "DO NOT X — use Y instead" or "DO NOT X -- use Y"
 *   - Same-line positive: "DO NOT X. Use Y." (positive sentence follows on same line)
 *   - Parenthetical context: "DO NOT X (use Y instead)" or "DO NOT X (reason)"
 *   - Factual adverb: "it is never called", "never imported", "never archived"
 *   - Conditional branches: lines beginning with "If", "When", "Unless"
 *   - Code block content (inside ``` fences)
 *   - Scope restrictions with embedded spec: "DO NOT X beyond the Y limit"
 */

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');

// Directories containing prompt files to scan
const SCAN_DIRS = [
  'agents',
  'get-shit-done/workflows',
  'get-shit-done/references',
  'commands/gsd',
];

// All markdown files across SCAN_DIRS — collected once at module scope so that
// each corpus describe block can reference ALL_FILES directly, avoiding 10
// identical filesystem traversals and a single point-of-truth for SCAN_DIRS changes.
// (collectMarkdownFiles is a function declaration and is hoisted above this initializer.)
const ALL_FILES = [];
for (const dir of SCAN_DIRS) {
  ALL_FILES.push(...collectMarkdownFiles(path.join(PROJECT_ROOT, dir)));
}

// ─── Detection Helpers ───────────────────────────────────────────────────────

/**
 * Returns true when a line contains a positive complement that makes a
 * "DO NOT X" pattern a valid constraint pair rather than a bare prohibition.
 *
 * Positive complement markers:
 *   "DO NOT X — use Y"   (em-dash)
 *   "DO NOT X -- use Y"  (double-dash)
 *   "DO NOT X. Use Y."   (period then a new sentence on same line)
 *   "DO NOT X (use Y)"   (parenthetical with meaningful content)
 *   "**DO NOT X** Use Y" (bold marker then continuation)
 */
function hasPositiveComplement(line) {
  // Em-dash or double-dash: "DO NOT X — Y" or "DO NOT X -- Y"
  if (/ — | -- /.test(line)) return true;

  // Period followed by uppercase word on same line: "DO NOT X. Use Y."
  // Also handles markdown bold close: "**DO NOT X.** Use Y." where .** precedes the space.
  // Asterisk alone is NOT a sentence-ending punctuation marker.
  if (/[.!]\*{0,2}\s+[A-Z]/.test(line)) return true;

  // Parenthetical with at least a few chars of content
  if (/\([^)]{4,}\)/.test(line)) return true;

  return false;
}

/**
 * Returns true when a line is a reframe pattern — a valid construct that
 * pairs a negative clause with an immediate positive complement to displace
 * a strong model default. Example:
 *   "Your job is not to confirm the implementation works — it's to try to break it."
 */
function isReframePattern(line) {
  return /\bjob is not to\b/i.test(line) ||
         /\bnot to .{1,80}[—–-][—–-]?\s*it is to\b/i.test(line);
}

/**
 * Returns true when the line is a conditional branch or factual description
 * rather than a behavioral directive.
 *
 * Conditional: "If X does not exist", "When Y is not present"
 * Factual: "files that do NOT match any canonical path" (describing a filter condition)
 */
function isConditionalOrFactual(line) {
  // Line starts with a conditional word
  if (/^\s*(if|when|unless|whether|while|after|before)\b/i.test(line)) return true;

  // "do NOT match", "do NOT exist", "does NOT" — describing a state/filter, not a directive
  // Verbs are restricted to state-description verbs; directive-adjacent verbs (include, require,
  // modify, implement, etc.) are intentionally excluded — their factual mid-sentence uses are
  // handled by the subject+verb pattern below.
  if (/\b(do|does|did)\s+not\s+(already\s+)?(match|exist|contain|have|apply|appear|expose|overwrite|support|conflict|depend)\b/i.test(line)) return true;

  // Relative clause: "X that do not Y", "X which do not Y" — factual property description
  if (/\b(that|which)\s+do\s+not\b/i.test(line)) return true;

  // Subject+verb factual: "X do not Y" in the middle of a sentence (not at clause start)
  // e.g. "concurrent sessions do not overwrite each other"
  if (/\w+\s+do\s+not\s+\w/i.test(line) && !/^\s*([-*•\d.]+\s+)?do\s+not\b/i.test(line) && !/^\s*([-*•\d.]+\s+)?\*{0,2}do\s+not\b/i.test(line)) return true;

  return false;
}

/**
 * Returns true when `NEVER` on this line is used as a factual adverb
 * (describing a state), NOT as a primary directive telling the model what to avoid.
 *
 * Factual: "it is never called", "never imported", "have NEVER seen", "tests never run"
 * Directive: "NEVER add X", "NEVER use Y" (at the start of a clause)
 *
 * Heuristic: factual `never` is preceded by an auxiliary/linking verb, a pronoun,
 * or appears in the middle/end of a sentence after a subject phrase.
 */
function isFactualNever(line) {
  // Preceded by auxiliary or linking verbs ("is never", "have NEVER", etc.)
  if (/\b(is|are|was|were|has|have|had|will|would|could|should|can|may|might|do|does|did)\s+(not\s+)?NEVER\b/i.test(line)) return true;

  // Lowercase "never" only — never a directive
  if (!/\bNEVER\b/.test(line)) return true;

  // Uppercase NEVER: subject-phrase factual ("orchestrator NEVER receives")
  if (/\w+\s+NEVER\s+\w/.test(line) && !/^[\s\-*•\d.]+NEVER\s+\w/.test(line)) return true;

  // Uppercase NEVER: parenthetical/table cell
  if (/\(.*NEVER.*\)/.test(line)) return true;

  return false;
}

/**
 * Returns true when `avoid` on this line is used as a clause-initial primary directive
 * (D-01: clause-initial detection only, mirrors isFactualNever design philosophy).
 *
 * Directive: "Avoid X", "- Avoid Y", "**Avoid Z**" (line/bullet start, optional bold)
 * Not directive: "We avoid X", "(avoid this)", mid-sentence uses
 *
 * Note: This helper has OPPOSITE polarity to isFactualNever — it returns true
 * when the line IS a directive (so the pattern check uses `&& isAvoidDirective(line)`,
 * not `&& !isAvoidDirective(line)`).
 */
function isAvoidDirective(line) {
  // Clause-initial: optional whitespace + optional bullet/numeral + optional bold + "avoid"
  // Bullet markers and bold pattern copied from isConditionalOrFactual line 101.
  return /^\s*([-*•\d.]+\s+)?\*{0,2}avoid\b/i.test(line);
}

/**
 * Returns true when `forbidden` on this line is used as a predicate-form directive
 * ("X is forbidden", "Y are forbidden"), as opposed to an adjective-noun form
 * ("forbidden patterns", "forbidden files").
 *
 * Predicate form is structural evidence of a directive about behavior; adjective-noun
 * form names a category and is not a directive.
 *
 * Directive: "Duplicate range reads are forbidden", "what is forbidden is X"
 * Not directive: "## Forbidden Files", "the forbidden patterns list"
 *
 * Note: same polarity as isAvoidDirective — true means IS a directive.
 * CRITICAL: do NOT compose with hasPositiveComplement() — all 3 known corpus TPs
 * (gsd-pattern-mapper.md:121, gsd-planner.md:218, gsd-planner.md:1212) contain
 * unrelated em-dashes that cause hasPositiveComplement() to filter them out,
 * producing zero corpus matches and silently breaking the SCAN-11 RED gate.
 */
function isForbiddenDirective(line) {
  return /\b(is|are)\s+forbidden\b/i.test(line);
}

/**
 * Returns true when `don't` on this line is used as a factual statement
 * (describing a state or capability), NOT as a primary directive.
 *
 * Mirrors isFactualNever shape per D-05. CRITICAL: includes the bullet-start
 * exclusion guard from line 101 — without this, directive bullets like
 * "- Don't include time estimates" would be misclassified as factual because
 * `include` matches the factual-verb list (see bug note 2026-04-22).
 *
 * Factual: "you don't know", "tasks don't achieve the requirement", "I don't recognize"
 * Directive: "- Don't fall in love...", "Don't guess.", "**Don't act if:**"
 */
function isFactualDont(line) {
  // Bullet-start guard — directives in bullet/clause-initial form must NOT be classified
  // as factual. Pattern matches the line 101 template character-for-character with
  // the don't substitution. Per bug note 2026-04-22: this guard is mandatory.
  if (/^\s*([-*•\d.]+\s+)?\*{0,2}don't\b/i.test(line)) return false;

  // Subject precedence: "X don't Y" mid-sentence (e.g., "tasks don't achieve",
  // "you don't know", "I don't recognize"). Mirrors isFactualNever line 126.
  if (/\w+\s+don't\s+\w/i.test(line)) return true;

  // Auxiliary precedence: "they don't", "we don't", etc. — modeled after
  // isFactualNever lines 118-119. Note: per D-07, conversational-filler exclusions
  // (don't worry, don't forget) are deferred. The above two branches handle the
  // common factual cases without an allow-list.

  return false;
}

/**
 * Scan content for negative framing violations.
 *
 * @param {string} content - Full file content
 * @returns {{
 *   violations: {
 *     never: Array<{lineNumber, line}>,
 *     doNot: Array<{lineNumber, line}>,
 *     avoid: Array<{lineNumber, line}>,
 *     dont: Array<{lineNumber, line}>,
 *     antiPatterns: Array<{lineNumber, line}>,
 *     mustNot: Array<{lineNumber, line}>,
 *     shouldNot: Array<{lineNumber, line}>,
 *     prohibited: Array<{lineNumber, line}>,
 *     forbidden: Array<{lineNumber, line}>
 *   },
 *   warnings: {
 *     cannot: Array<{lineNumber, line}>,
 *     wont: Array<{lineNumber, line}>,
 *     willNot: Array<{lineNumber, line}>
 *   }
 * }}
 */
function scanForNegativeFraming(content) {
  const lines = content.split('\n');
  // Hard violations (D-30 violations bucket):
  const neverViolations = [];
  const doNotViolations = [];
  const avoidViolations = [];
  const dontViolations = [];
  const antiPatternsViolations = [];
  const mustNotViolations = [];
  const shouldNotViolations = [];
  // ── NEW for Phase 29 (D-30 extension) ────────────────────────────────────────
  const prohibitedViolations = [];
  const forbiddenViolations = [];
  // ─────────────────────────────────────────────────────────────────────────────
  // Soft warnings (D-30 warnings bucket):
  const cannotViolations = [];
  const wontViolations = [];
  const willNotViolations = [];

  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track code fence state
    if (/^```/.test(trimmed)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // ── NEVER directive check (EXISTING — unchanged) ───────────────────────
    if (/\bNEVER\b/.test(line)) {
      if (!isFactualNever(line) && !isReframePattern(line) && !isConditionalOrFactual(line)) {
        neverViolations.push({ lineNumber: i + 1, line: trimmed });
      }
    }

    // ── DO NOT directive check (EXISTING — unchanged) ──────────────────────
    if (/\bdo not\b/i.test(line)) {
      if (!isConditionalOrFactual(line) &&
          !isReframePattern(line) &&
          !hasPositiveComplement(line)) {
        doNotViolations.push({ lineNumber: i + 1, line: trimmed });
      }
    }

    // ── avoid directive check (NEW — D-01/D-02/D-03/D-04) ──────────────────
    if (/\bavoid\b/i.test(line) && isAvoidDirective(line)) {
      if (!isConditionalOrFactual(line) && !hasPositiveComplement(line)) {
        avoidViolations.push({ lineNumber: i + 1, line: trimmed });
      }
    }

    // ── don't directive check (NEW — D-05/D-06/D-07) ───────────────────────
    if (/\bdon't\b/i.test(line)) {
      if (!isFactualDont(line) && !isConditionalOrFactual(line) && !hasPositiveComplement(line)) {
        dontViolations.push({ lineNumber: i + 1, line: trimmed });
      }
    }

    // ── <anti_patterns> tag check (NEW — D-08/D-09/D-10) ───────────────────
    // Dedupe to 1 violation per block by matching only the opening tag. The
    // pattern /<anti_patterns>/ literally matches `<anti_patterns>` and does NOT
    // match `</anti_patterns>` because the closing tag has a leading slash.
    if (/<anti_patterns>/i.test(line)) {
      antiPatternsViolations.push({ lineNumber: i + 1, line: trimmed });
    }

    // ── must not directive check (NEW — D-11) ──────────────────────────────
    // No factual-exclusion helper per D-11. Matches "must not" / "MUST NOT" /
    // "Must Not" with one or more whitespace chars between `must` and `not`.
    if (/\bmust\s+not\b/i.test(line)) {
      mustNotViolations.push({ lineNumber: i + 1, line: trimmed });
    }

    // ── should not directive check (NEW — D-14) ────────────────────────────
    if (/\bshould\s+not\b/i.test(line)) {
      shouldNotViolations.push({ lineNumber: i + 1, line: trimmed });
    }

    // ── prohibited directive check (NEW — D-01/D-02, Reading A) ──────────────
    // Hard failure. Mirrors mustNot/shouldNot precedent: single regex, no helper,
    // no hasPositiveComplement filter. Reading A (literal mustNot precedent) flags
    // 13 corpus matches including all audit-listed instances (SCAN-11 red gate viable).
    // Per user decision confirmed in planning_context: NO hasPositiveComplement filter.
    if (/\bprohibited\b/i.test(line)) {
      prohibitedViolations.push({ lineNumber: i + 1, line: trimmed });
    }

    // ── forbidden directive check (NEW — D-04/D-05) ───────────────────────────
    // Hard failure. Predicate-form helper only. NO hasPositiveComplement gate —
    // all 3 known TPs (gsd-pattern-mapper.md:121, gsd-planner.md:218,
    // gsd-planner.md:1212) are filtered by hasPositiveComplement due to unrelated
    // em-dashes in the same long sentence, producing zero matches (SCAN-11 break).
    // Per user decision confirmed in planning_context: isForbiddenDirective() alone.
    if (isForbiddenDirective(line)) {
      forbiddenViolations.push({ lineNumber: i + 1, line: trimmed });
    }

    // ── cannot directive check (NEW — D-16/D-17, warn-only bucket) ─────────
    // Per D-16: flag everything; no factual-exclusion helper. Final classification
    // (hard-failure vs warn-only) belongs to Plans 02/03 corpus subtests.
    if (/\bcannot\b/i.test(line)) {
      cannotViolations.push({ lineNumber: i + 1, line: trimmed });
    }

    // ── won't directive check (NEW — D-19/D-20, warn-only bucket) ──────────
    if (/\bwon't\b/i.test(line)) {
      wontViolations.push({ lineNumber: i + 1, line: trimmed });
    }

    // ── will not directive check (NEW — D-22/D-23, warn-only bucket) ───────
    if (/\bwill\s+not\b/i.test(line)) {
      willNotViolations.push({ lineNumber: i + 1, line: trimmed });
    }
  }

  return {
    violations: {
      never: neverViolations,
      doNot: doNotViolations,
      avoid: avoidViolations,
      dont: dontViolations,
      antiPatterns: antiPatternsViolations,
      mustNot: mustNotViolations,
      shouldNot: shouldNotViolations,
      prohibited: prohibitedViolations,   // NEW — D-30 extension
      forbidden: forbiddenViolations,     // NEW — D-30 extension
    },
    warnings: {
      cannot: cannotViolations,
      wont: wontViolations,
      willNot: willNotViolations,
    },
  };
}

// ─── File collection ─────────────────────────────────────────────────────────

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

// ─── Unit tests: scanner logic ───────────────────────────────────────────────

describe('hasPositiveComplement()', () => {
  test('detects em-dash complement', () => {
    assert.ok(hasPositiveComplement('DO NOT use Write tool — use git checkout instead'));
  });

  test('detects double-dash complement', () => {
    assert.ok(hasPositiveComplement('DO NOT guess -- read actual files for evidence'));
  });

  test('detects same-line positive sentence after period', () => {
    assert.ok(hasPositiveComplement('**DO NOT modify source files.** Review is read-only.'));
  });

  test('detects parenthetical complement', () => {
    assert.ok(hasPositiveComplement('DO NOT use Bash for listing (use Glob tool)'));
  });

  test('returns false for bare prohibition', () => {
    assert.ok(!hasPositiveComplement('DO NOT commit'));
  });

  test('returns false for prohibition with only punctuation', () => {
    assert.ok(!hasPositiveComplement('DO NOT skip.'));
  });
});

describe('isReframePattern()', () => {
  test('detects "job is not to" reframe', () => {
    assert.ok(isReframePattern(
      'Your job is not to confirm the implementation works — it is to find gaps.'
    ));
  });

  test('does not flag unrelated lines', () => {
    assert.ok(!isReframePattern('DO NOT commit REVIEW-FIX.md'));
    assert.ok(!isReframePattern('NEVER add placeholder data'));
  });
});

describe('isFactualNever()', () => {
  test('factual: "it is never called"', () => {
    assert.ok(isFactualNever('A component that exists but is never imported is dead code.'));
  });

  test('factual: "have NEVER seen"', () => {
    assert.ok(isFactualNever(
      're-read it as if you have NEVER seen this codebase before'
    ));
  });

  test('factual: "tests never run"', () => {
    assert.ok(isFactualNever('- `pending` — tests never run'));
  });

  test('factual: lowercase never (not a directive)', () => {
    assert.ok(isFactualNever('Binary assets are never archived in milestone history.'));
  });

  test('directive: "NEVER add X" at clause start', () => {
    assert.ok(!isFactualNever('NEVER add placeholder data to the output.'));
  });

  test('directive: "NEVER use X" in bullet', () => {
    assert.ok(!isFactualNever('- NEVER use time estimates in this column.'));
  });
});

describe('isAvoidDirective()', () => {
  test('directive: clause-initial "Avoid X"', () => {
    assert.ok(isAvoidDirective('Avoid unless the spike specifically requires it:'));
  });

  test('directive: bullet-start "- Avoid X"', () => {
    assert.ok(isAvoidDirective('- Avoid introducing more technical debt'));
  });

  test('directive: bold-wrapped "**Avoid X**"', () => {
    assert.ok(isAvoidDirective('**Avoid if:** Fine-grained state management'));
  });

  test('not directive: subject precedence "We avoid X"', () => {
    assert.ok(!isAvoidDirective('We avoid X for performance reasons.'));
  });

  test('not directive: parenthetical "(avoid X)"', () => {
    assert.ok(!isAvoidDirective('Use safe arithmetic (avoid set -e issues from CR-06):'));
  });

  test('not directive: mid-sentence "to avoid X"', () => {
    assert.ok(!isAvoidDirective('Launch execute-phase using the Skill tool to avoid nested Task sessions.'));
  });
});

describe('isForbiddenDirective()', () => {
  test('directive: predicate "X is forbidden"', () => {
    assert.ok(isForbiddenDirective('Duplicate range reads are forbidden.'));
  });

  test('directive: predicate "what is forbidden is X"', () => {
    assert.ok(isForbiddenDirective('what is forbidden is re-reading a range already in context.'));
  });

  test('not directive: adjective-noun "forbidden files"', () => {
    assert.ok(!isForbiddenDirective('## Forbidden Files'));
  });

  test('not directive: adjective-noun "forbidden patterns"', () => {
    assert.ok(!isForbiddenDirective('Apply skill rules to identify required wrappers, and forbidden patterns.'));
  });

  test('not directive: negated predicate "X is not forbidden"', () => {
    assert.ok(!isForbiddenDirective('This approach is not forbidden.'));
  });
});

describe('isFactualDont()', () => {
  test('factual: subject precedence "you don\'t know"', () => {
    assert.ok(isFactualDont("If you change three things and it works, you don't know which one fixed it."));
  });

  test('factual: subject precedence "tasks don\'t achieve"', () => {
    assert.ok(isFactualDont("Tasks exist but don't actually achieve the requirement"));
  });

  test('factual: relative clause "messages I don\'t recognize"', () => {
    assert.ok(isFactualDont("Is this an error message I don't recognize?"));
  });

  test('directive: bullet-start "- Don\'t X" (bug 2026-04-22 regression guard)', () => {
    assert.ok(!isFactualDont("- Don't fall in love with your first hypothesis."));
  });

  test('directive: clause-initial "Don\'t X"', () => {
    assert.ok(!isFactualDont("Don't guess."));
  });

  test('directive: bold-wrapped "**Don\'t X**"', () => {
    assert.ok(!isFactualDont("**Don't act if:** \"I think it might be X\""));
  });
});

describe('isConditionalOrFactual()', () => {
  test('conditional: starts with "If"', () => {
    assert.ok(isConditionalOrFactual('If X does not exist, create it.'));
  });

  test('conditional: starts with "When"', () => {
    assert.ok(isConditionalOrFactual('When no results do NOT match the pattern, exit.'));
  });

  test('factual filter: "do NOT match"', () => {
    assert.ok(isConditionalOrFactual(
      'files that do NOT match any canonical path in the queue'
    ));
  });

  test('not conditional: a directive line', () => {
    assert.ok(!isConditionalOrFactual('DO NOT commit REVIEW-FIX.md'));
  });

  test('not conditional: directive with verb in factual list', () => {
    assert.ok(!isConditionalOrFactual('DO NOT modify source files.'));
    assert.ok(!isConditionalOrFactual('Do not include sensitive data.'));
    assert.ok(!isConditionalOrFactual('Do not require manual steps.'));
    // Factual mid-sentence uses should still pass:
    assert.ok(isConditionalOrFactual('These settings do not include X.'));
    assert.ok(isConditionalOrFactual('Concurrent sessions do not overwrite each other.'));
  });
});

describe('scanForNegativeFraming() — synthetic content', () => {
  test('flags bare NEVER directive', () => {
    const content = [
      '## Rules',
      '',
      'NEVER use time estimates.',
      '',
      'Always derive from scope.',
    ].join('\n');
    const result = scanForNegativeFraming(content);
    assert.equal(result.violations.never.length, 1, 'should detect one NEVER violation');
    assert.ok(result.violations.never[0].line.includes('NEVER use time estimates'));
  });

  test('flags bullet-list NEVER directive', () => {
    const content = [
      '- NEVER add placeholder data -- write verified entries only',
      '- NEVER skip dependency analysis',
    ].join('\n');
    const result = scanForNegativeFraming(content);
    // First line has double-dash positive complement → no never violation, but DO NOT scan doesn't apply
    // Second line: bare NEVER directive
    assert.ok(result.violations.never.some(v => v.line.includes('skip dependency analysis')),
      'bare NEVER in bullet should be flagged');
  });

  test('does not flag factual never (adverb)', () => {
    const content = [
      'A component that exists but is never imported is a broken integration.',
      'Binary assets are never archived.',
    ].join('\n');
    const result = scanForNegativeFraming(content);
    assert.equal(result.violations.never.length, 0, 'factual never should not be flagged');
  });

  test('does not flag NEVER inside code block', () => {
    const content = [
      'Some text.',
      '```',
      'NEVER add X here',
      '```',
      'More text.',
    ].join('\n');
    const result = scanForNegativeFraming(content);
    assert.equal(result.violations.never.length, 0, 'NEVER inside code block should be skipped');
  });

  test('does not flag NEVER in reframe pattern', () => {
    const content = [
      'Your job is not to confirm the implementation works — it is to find gaps.',
    ].join('\n');
    const result = scanForNegativeFraming(content);
    assert.equal(result.violations.never.length, 0, 'reframe pattern should not be flagged');
  });

  test('flags DO NOT without positive complement', () => {
    const content = [
      '**DO NOT trust SUMMARY claims.**',
    ].join('\n');
    const result = scanForNegativeFraming(content);
    assert.equal(result.violations.doNot.length, 1, 'bare DO NOT should be flagged');
  });

  test('does not flag DO NOT with em-dash complement', () => {
    const content = [
      '**DO NOT use Write tool for rollback** — a partial write corrupts the file.',
    ].join('\n');
    const result = scanForNegativeFraming(content);
    assert.equal(result.violations.doNot.length, 0, 'DO NOT with em-dash complement should pass');
  });

  test('does not flag DO NOT with same-line positive sentence', () => {
    const content = [
      '**DO NOT flag style preferences as warnings.** Only flag issues that cause bugs.',
    ].join('\n');
    const result = scanForNegativeFraming(content);
    assert.equal(result.violations.doNot.length, 0, 'DO NOT with follow-on sentence should pass');
  });

  test('does not flag DO NOT with parenthetical complement', () => {
    const content = [
      'DO NOT use Bash for file listing (use Glob tool instead)',
    ].join('\n');
    const result = scanForNegativeFraming(content);
    assert.equal(result.violations.doNot.length, 0, 'DO NOT with parenthetical should pass');
  });

  test('scanner has no multi-line context: bullet DO NOTs after If-line are still flagged', () => {
    const content = [
      'If incomplete plans still remain:',
      '- Do NOT run phase verification',
      '- Do NOT mark the phase complete',
    ].join('\n');
    const result = scanForNegativeFraming(content);
    // Scanner is line-by-line only; bullet items are flagged regardless of preceding If-line.
    assert.equal(result.violations.doNot.length, 2,
      'bullet DO NOTs are flagged even when preceded by a conditional header');
  });

  test('does not flag "do NOT match" factual filter', () => {
    const content = [
      'Scan for files that do NOT match any canonical path in the queue.',
    ].join('\n');
    const result = scanForNegativeFraming(content);
    assert.equal(result.violations.doNot.length, 0, '"do NOT match" factual filter should not be flagged');
  });

  test('return shape: result has violations and warnings buckets', () => {
    const result = scanForNegativeFraming('plain text\n');
    assert.ok(result.violations, 'result must have violations bucket');
    assert.ok(result.warnings, 'result must have warnings bucket');
    for (const k of ['never', 'doNot', 'avoid', 'dont', 'antiPatterns', 'mustNot', 'shouldNot', 'prohibited', 'forbidden']) {
      assert.ok(Array.isArray(result.violations[k]), `violations.${k} must be an Array`);
    }
    for (const k of ['cannot', 'wont', 'willNot']) {
      assert.ok(Array.isArray(result.warnings[k]), `warnings.${k} must be an Array`);
    }
  });

  test('flags clause-initial avoid directive', () => {
    const content = 'Avoid unless the spike specifically requires it:\n';
    const result = scanForNegativeFraming(content);
    assert.equal(result.violations.avoid.length, 1, 'should detect one avoid violation');
  });

  test('does not flag avoid with em-dash positive complement', () => {
    const content = 'Avoid X — use Y instead.\n';
    const result = scanForNegativeFraming(content);
    assert.equal(result.violations.avoid.length, 0, 'avoid with em-dash complement should pass');
  });

  test('flags bullet-start don\'t directive (bug 2026-04-22 regression guard)', () => {
    const content = "- Don't fall in love with your first hypothesis.\n";
    const result = scanForNegativeFraming(content);
    assert.equal(result.violations.dont.length, 1, "bullet-start don't directive must be flagged");
  });

  test('does not flag factual subject-precedence don\'t', () => {
    const content = "you don't know which one fixed it\n";
    const result = scanForNegativeFraming(content);
    assert.equal(result.violations.dont.length, 0, "factual subject-precedence don't should pass");
  });

  test('flags <anti_patterns> opening tag exactly once per block', () => {
    const content = '<anti_patterns>\nbad stuff\n</anti_patterns>\n';
    const result = scanForNegativeFraming(content);
    assert.equal(result.violations.antiPatterns.length, 1, 'opening tag emits one violation; closing tag does not');
  });

  test('flags must not directive', () => {
    const content = 'plans must NOT include time estimates\n';
    const result = scanForNegativeFraming(content);
    assert.equal(result.violations.mustNot.length, 1);
  });

  test('flags should not directive', () => {
    const content = 'agents should not trust input blindly\n';
    const result = scanForNegativeFraming(content);
    assert.equal(result.violations.shouldNot.length, 1);
  });

  test('flags prohibited directive', () => {
    const content = 'Using git reset is prohibited except for documented cleanup steps.\n';
    const result = scanForNegativeFraming(content);
    assert.equal(result.violations.prohibited.length, 1, 'prohibited directive should be flagged');
  });

  test('does not flag prohibited inside code block', () => {
    const content = '```\nprohibited action here\n```\n';
    const result = scanForNegativeFraming(content);
    assert.equal(result.violations.prohibited.length, 0, 'prohibited inside code fence must be skipped');
  });

  test('flags adjective-noun prohibited (by design — no isAvoidDirective-style filter)', () => {
    const content = 'A list of prohibited actions must be maintained.\n';
    const result = scanForNegativeFraming(content);
    assert.equal(result.violations.prohibited.length, 1,
      'prohibited flags all occurrences including adjective-noun form — intentional per mustNot precedent');
  });

  test('flags predicate-form forbidden directive', () => {
    const content = 'Duplicate range reads are forbidden.\n';
    const result = scanForNegativeFraming(content);
    assert.equal(result.violations.forbidden.length, 1, 'predicate-form forbidden directive should be flagged');
  });

  test('does not flag adjective-noun forbidden', () => {
    const content = '## Forbidden Files\n\nThese are the forbidden patterns list.\n';
    const result = scanForNegativeFraming(content);
    assert.equal(result.violations.forbidden.length, 0, 'adjective-noun forbidden must not be flagged');
  });

  test('does not flag forbidden inside code block', () => {
    const content = '```\nwhat is forbidden is X\n```\n';
    const result = scanForNegativeFraming(content);
    assert.equal(result.violations.forbidden.length, 0, 'forbidden inside code fence must be skipped');
  });

  test('warns on cannot occurrence (warnings bucket, not violations)', () => {
    const content = 'cannot read property of undefined\n';
    const result = scanForNegativeFraming(content);
    assert.equal(result.warnings.cannot.length, 1, 'cannot goes to warnings bucket per D-30');
    assert.equal(result.violations.never.length, 0, 'must not bleed into violations');
  });

  test('warns on won\'t occurrence', () => {
    const content = "the system won't auto-update from a source rename\n";
    const result = scanForNegativeFraming(content);
    assert.equal(result.warnings.wont.length, 1);
  });

  test('warns on will not occurrence', () => {
    const content = 'You will NOT be resumed.\n';
    const result = scanForNegativeFraming(content);
    assert.equal(result.warnings.willNot.length, 1);
  });

  test('does not flag patterns inside fenced code blocks', () => {
    const content = [
      'normal text',
      '```',
      'Avoid X',
      "Don't Y",
      '<anti_patterns>',
      'must not Z',
      '```',
      'more text',
    ].join('\n');
    const result = scanForNegativeFraming(content);
    assert.equal(result.violations.avoid.length, 0, 'avoid inside code fence skipped');
    assert.equal(result.violations.dont.length, 0, 'dont inside code fence skipped');
    assert.equal(result.violations.antiPatterns.length, 0, '<anti_patterns> inside code fence skipped');
    assert.equal(result.violations.mustNot.length, 0, 'must not inside code fence skipped');
  });
});

// ─── Corpus scan: DO NOT primary directive (agent files) ─────────────────────
//
// After the v1.37.1a positive framing pass (phase 13), all bare "DO NOT"
// directives in agent files were converted to affirmative instructions.
// This test guards against regressions where someone reintroduces a bare
// "DO NOT" directive in an agent file.
//
// Scope: agent files only (Phase 13). Workflow, reference, and command files
// are addressed in Phase 14 — those subtests are added there.

describe('corpus scan — DO NOT primary directives (case-insensitive)', () => {
  test('no bare DO NOT directives in agent files', () => {
    const agentFiles = ALL_FILES.filter(f => f.includes('/agents/'));
    const violations = [];

    for (const file of agentFiles) {
      const relPath = path.relative(PROJECT_ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const { doNot } = scanForNegativeFraming(content).violations;
      if (doNot.length > 0) {
        violations.push({ file: relPath, lines: doNot });
      }
    }

    assert.equal(violations.length, 0,
      `Bare DO NOT directives found in agent files. Convert to affirmative instructions:\n${
        violations.map(v =>
          `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
        ).join('\n')
      }`
    );
  });

  test('no bare DO NOT directives in command files', () => {
    const commandFiles = ALL_FILES.filter(f => f.includes('/commands/'));
    const violations = [];

    for (const file of commandFiles) {
      const relPath = path.relative(PROJECT_ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const { doNot } = scanForNegativeFraming(content).violations;
      if (doNot.length > 0) {
        violations.push({ file: relPath, lines: doNot });
      }
    }

    assert.equal(violations.length, 0,
      `Bare DO NOT directives found in command files. Add a positive complement or convert to positive framing:\n${
        violations.map(v =>
          `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
        ).join('\n')
      }`
    );
  });
});

// ─── Corpus scan: NEVER primary directive ────────────────────────────────────
//
// After the positive framing pass (plans/05-POSITIVE_FRAMING_PASS_V01.md),
// all NEVER directives were converted to positive framing. Only factual uses
// of "never" (adverb describing state) remain. This test guards against
// regressions where someone introduces a new bare NEVER directive.

describe('corpus scan — NEVER primary directives', () => {
  test('found prompt files to scan', () => {
    assert.ok(ALL_FILES.length > 0, `Expected .md files in: ${SCAN_DIRS.join(', ')}`);
  });

  test('no NEVER primary directives in agent files', () => {
    const agentFiles = ALL_FILES.filter(f => f.includes('/agents/'));
    const violations = [];

    for (const file of agentFiles) {
      const relPath = path.relative(PROJECT_ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const { never } = scanForNegativeFraming(content).violations;
      if (never.length > 0) {
        violations.push({ file: relPath, lines: never });
      }
    }

    assert.equal(violations.length, 0,
      `NEVER directives found in agent files. Run plans/05-POSITIVE_FRAMING_PASS_V01.md to convert:\n${
        violations.map(v =>
          `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
        ).join('\n')
      }`
    );
  });

  test('no NEVER primary directives in workflow files', () => {
    const workflowFiles = ALL_FILES.filter(f => f.includes('/workflows/'));
    const violations = [];

    for (const file of workflowFiles) {
      const relPath = path.relative(PROJECT_ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const { never } = scanForNegativeFraming(content).violations;
      if (never.length > 0) {
        violations.push({ file: relPath, lines: never });
      }
    }

    assert.equal(violations.length, 0,
      `NEVER directives found in workflow files. Run plans/05-POSITIVE_FRAMING_PASS_V01.md to convert:\n${
        violations.map(v =>
          `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
        ).join('\n')
      }`
    );
  });

  test('no NEVER primary directives in command files', () => {
    const commandFiles = ALL_FILES.filter(f => f.includes('/commands/'));
    const violations = [];

    for (const file of commandFiles) {
      const relPath = path.relative(PROJECT_ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const { never } = scanForNegativeFraming(content).violations;
      if (never.length > 0) {
        violations.push({ file: relPath, lines: never });
      }
    }

    assert.equal(violations.length, 0,
      `NEVER directives found in command files. Run plans/05-POSITIVE_FRAMING_PASS_V01.md to convert:\n${
        violations.map(v =>
          `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
        ).join('\n')
      }`
    );
  });
});

// ─── Corpus scan: avoid primary directive ────────────────────────────────────
//
// Phase 25 TDD red gate (D-28): these subtests must be confirmed FAILING
// against unmodified upstream files before Phase 26 fixes any violations.
// D-26 manual TP/FP classification documented in .planning/phases/25-scanner-expansion/25-02-PLAN.md.
//
// Estimated TP count after helper filtering: 5–8 of 35 corpus matches.
// Per inline_classification (25-02-PLAN.md): HARD-FAILURE disposition.
// Per-directory subtest split: agents + workflows (2 largest contributors per RESEARCH.md).

describe('corpus scan — avoid primary directives', () => {
  test('found prompt files to scan', () => {
    assert.ok(ALL_FILES.length > 0, `Expected .md files in: ${SCAN_DIRS.join(', ')}`);
  });

  test('no bare avoid directives in agent files', () => {
    const agentFiles = ALL_FILES.filter(f => f.includes('/agents/'));
    const violations = [];
    for (const file of agentFiles) {
      const relPath = path.relative(PROJECT_ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const { avoid } = scanForNegativeFraming(content).violations;
      if (avoid.length > 0) violations.push({ file: relPath, lines: avoid });
    }
    assert.equal(violations.length, 0,
      `Bare avoid directives found in agent files. Pair with a positive complement (em-dash + use Y) or convert to affirmative framing:\n${
        violations.map(v =>
          `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
        ).join('\n')
      }`
    );
  });

  test('no bare avoid directives in workflow files', () => {
    const workflowFiles = ALL_FILES.filter(f => f.includes('/workflows/'));
    const violations = [];
    for (const file of workflowFiles) {
      const relPath = path.relative(PROJECT_ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const { avoid } = scanForNegativeFraming(content).violations;
      if (avoid.length > 0) violations.push({ file: relPath, lines: avoid });
    }
    assert.equal(violations.length, 0,
      `Bare avoid directives found in workflow files. Pair with a positive complement (em-dash + use Y) or convert to affirmative framing:\n${
        violations.map(v =>
          `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
        ).join('\n')
      }`
    );
  });
});

// ─── Corpus scan: don't primary directive ────────────────────────────────────
//
// Phase 25 TDD red gate (D-28): HARD-FAILURE disposition per inline_classification.
// Estimated TP rate after isFactualDont filtering: 15–25% of 122 corpus matches.
// Per-directory subtest split: agents + workflows (bulk of TPs per RESEARCH.md sample).

describe("corpus scan — don't primary directives", () => {
  test("no bare don't directives in agent files", () => {
    const agentFiles = ALL_FILES.filter(f => f.includes('/agents/'));
    const violations = [];
    for (const file of agentFiles) {
      const relPath = path.relative(PROJECT_ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const { dont } = scanForNegativeFraming(content).violations;
      if (dont.length > 0) violations.push({ file: relPath, lines: dont });
    }
    assert.equal(violations.length, 0,
      `Bare don't directives found in agent files. Convert to affirmative instructions or pair with a positive complement:\n${
        violations.map(v =>
          `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
        ).join('\n')
      }`
    );
  });

  test("no bare don't directives in workflow files", () => {
    const workflowFiles = ALL_FILES.filter(f => f.includes('/workflows/'));
    const violations = [];
    for (const file of workflowFiles) {
      const relPath = path.relative(PROJECT_ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const { dont } = scanForNegativeFraming(content).violations;
      if (dont.length > 0) violations.push({ file: relPath, lines: dont });
    }
    assert.equal(violations.length, 0,
      `Bare don't directives found in workflow files. Convert to affirmative instructions or pair with a positive complement:\n${
        violations.map(v =>
          `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
        ).join('\n')
      }`
    );
  });
});

// ─── Corpus scan: <anti_patterns> tag usage ──────────────────────────────────
//
// Phase 25 TDD red gate (D-28): DEFINITIVE HARD-FAILURE — 10 of 10 corpus
// matches are TPs (100% TP rate). All 10 enumerated in inline_classification
// (25-02-PLAN.md). Counts are deterministic: agents=5, workflows=2, references=3.
// Phase 26 FIX-01/FIX-03 will rename all <anti_patterns> to <expected_patterns>.

describe('corpus scan — <anti_patterns> tag usage', () => {
  test('found prompt files to scan', () => {
    assert.ok(ALL_FILES.length > 0, `Expected .md files in: ${SCAN_DIRS.join(', ')}`);
  });

  test('no <anti_patterns> tags in agent files', () => {
    const agentFiles = ALL_FILES.filter(f => f.includes('/agents/'));
    const violations = [];
    for (const file of agentFiles) {
      const relPath = path.relative(PROJECT_ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const { antiPatterns } = scanForNegativeFraming(content).violations;
      if (antiPatterns.length > 0) violations.push({ file: relPath, lines: antiPatterns });
    }
    assert.equal(violations.length, 0,
      `<anti_patterns> tags found in agent files. Rename to <expected_patterns> and reframe content as affirmative instructions (per Phase 26 FIX-01):\n${
        violations.map(v =>
          `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
        ).join('\n')
      }`
    );
  });

  test('no <anti_patterns> tags in workflow files', () => {
    const workflowFiles = ALL_FILES.filter(f => f.includes('/workflows/'));
    const violations = [];
    for (const file of workflowFiles) {
      const relPath = path.relative(PROJECT_ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const { antiPatterns } = scanForNegativeFraming(content).violations;
      if (antiPatterns.length > 0) violations.push({ file: relPath, lines: antiPatterns });
    }
    assert.equal(violations.length, 0,
      `<anti_patterns> tags found in workflow files. Rename to <expected_patterns> and reframe content as affirmative instructions (per Phase 26 FIX-03):\n${
        violations.map(v =>
          `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
        ).join('\n')
      }`
    );
  });

});

// ─── Corpus scan: must not primary directive ─────────────────────────────────
//
// Phase 25 TDD red gate (D-28): HARD-FAILURE disposition per inline_classification.
// All 15 corpus matches classified: 11 clear TPs + 4 borderline TPs (ships as TP,
// Phase 26 decides reframe-or-whitelist). Full enumeration in 25-02-PLAN.md.
// Per-directory subtest split: agents (7) + workflows (8) = 15 total.

describe('corpus scan — must not primary directives', () => {
  test('found prompt files to scan', () => {
    assert.ok(ALL_FILES.length > 0, `Expected .md files in: ${SCAN_DIRS.join(', ')}`);
  });

  test('no bare must not directives in agent files', () => {
    const agentFiles = ALL_FILES.filter(f => f.includes('/agents/'));
    const violations = [];
    for (const file of agentFiles) {
      const relPath = path.relative(PROJECT_ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const { mustNot } = scanForNegativeFraming(content).violations;
      if (mustNot.length > 0) violations.push({ file: relPath, lines: mustNot });
    }
    assert.equal(violations.length, 0,
      `Bare "must not" directives found in agent files. Convert to affirmative requirements ("MUST X") or pair with explicit allowed-actions:\n${
        violations.map(v =>
          `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
        ).join('\n')
      }`
    );
  });

  test('no bare must not directives in workflow files', () => {
    const workflowFiles = ALL_FILES.filter(f => f.includes('/workflows/'));
    const violations = [];
    for (const file of workflowFiles) {
      const relPath = path.relative(PROJECT_ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const { mustNot } = scanForNegativeFraming(content).violations;
      if (mustNot.length > 0) violations.push({ file: relPath, lines: mustNot });
    }
    assert.equal(violations.length, 0,
      `Bare "must not" directives found in workflow files. Convert to affirmative requirements:\n${
        violations.map(v =>
          `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
        ).join('\n')
      }`
    );
  });
});

// ─── Corpus scan: should not primary directive ───────────────────────────────
//
// Phase 25 TDD red gate (D-28): HARD-FAILURE disposition per inline_classification.
// All 10 corpus matches classified: 9 TPs + 1 FP (commands/gsd/research-phase.md:99
// — interrogative quoted "What should NOT be hand-rolled?" — ships as TP for Phase 26
// to reframe). Full enumeration in 25-02-PLAN.md.
// Per-directory subtest split: agents (3) + workflows (3) + references (3) + commands (1) = 4 dirs.

describe('corpus scan — should not primary directives', () => {
  test('found prompt files to scan', () => {
    assert.ok(ALL_FILES.length > 0, `Expected .md files in: ${SCAN_DIRS.join(', ')}`);
  });

  test('no bare should not directives in agent files', () => {
    const agentFiles = ALL_FILES.filter(f => f.includes('/agents/'));
    const violations = [];
    for (const file of agentFiles) {
      const relPath = path.relative(PROJECT_ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const { shouldNot } = scanForNegativeFraming(content).violations;
      if (shouldNot.length > 0) violations.push({ file: relPath, lines: shouldNot });
    }
    assert.equal(violations.length, 0,
      `Bare "should not" directives found in agent files. Convert to affirmative recommendations ("Prefer X") or pair with reasoning:\n${
        violations.map(v =>
          `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
        ).join('\n')
      }`
    );
  });

  test('no bare should not directives in workflow files', () => {
    const workflowFiles = ALL_FILES.filter(f => f.includes('/workflows/'));
    const violations = [];
    for (const file of workflowFiles) {
      const relPath = path.relative(PROJECT_ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const { shouldNot } = scanForNegativeFraming(content).violations;
      if (shouldNot.length > 0) violations.push({ file: relPath, lines: shouldNot });
    }
    assert.equal(violations.length, 0,
      `Bare "should not" directives found in workflow files. Convert to affirmative recommendations:\n${
        violations.map(v =>
          `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
        ).join('\n')
      }`
    );
  });

  test('no bare should not directives in command files', () => {
    const commandFiles = ALL_FILES.filter(f => f.includes('/commands/'));
    const violations = [];
    for (const file of commandFiles) {
      const relPath = path.relative(PROJECT_ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const { shouldNot } = scanForNegativeFraming(content).violations;
      if (shouldNot.length > 0) violations.push({ file: relPath, lines: shouldNot });
    }
    assert.equal(violations.length, 0,
      `Bare "should not" directives found in command files. Convert to affirmative recommendations:\n${
        violations.map(v =>
          `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
        ).join('\n')
      }`
    );
  });
});

// ─── Corpus scan: cannot occurrences (warn-only) ─────────────────────────────
//
// Phase 25 Plan 03 — WARN-ONLY per D-17. Manual classification (D-26) of 64
// corpus matches found 0% TP rate (all factual: relative clauses, error messages,
// capability descriptions). Shipped as informational console.warn + assert.ok(true).
// Per-directory split: agents + workflows (two highest-volume directories).
// See inline_classification in 25-03-PLAN.md for full TP/FP audit trail.

describe('corpus scan — cannot occurrences (warn-only)', () => {
  test('found prompt files to scan', () => {
    assert.ok(ALL_FILES.length > 0, `Expected .md files in: ${SCAN_DIRS.join(', ')}`);
  });

  test('warn: cannot occurrences in agent files', () => {
    const agentFiles = ALL_FILES.filter(f => f.includes('/agents/'));
    const violations = [];
    for (const file of agentFiles) {
      const relPath = path.relative(PROJECT_ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const { cannot } = scanForNegativeFraming(content).warnings;
      if (cannot.length > 0) violations.push({ file: relPath, lines: cannot });
    }
    if (violations.length > 0) {
      console.warn(
        `[WARN] cannot occurrences in agent files (informational per D-17, not enforced):\n${
          violations.map(v =>
            `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
          ).join('\n')
        }`
      );
    }
    assert.ok(true, 'warn-only — informational subtest per D-17');
  });

  test('warn: cannot occurrences in workflow files', () => {
    const workflowFiles = ALL_FILES.filter(f => f.includes('/workflows/'));
    const violations = [];
    for (const file of workflowFiles) {
      const relPath = path.relative(PROJECT_ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const { cannot } = scanForNegativeFraming(content).warnings;
      if (cannot.length > 0) violations.push({ file: relPath, lines: cannot });
    }
    if (violations.length > 0) {
      console.warn(
        `[WARN] cannot occurrences in workflow files (informational per D-17, not enforced):\n${
          violations.map(v =>
            `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
          ).join('\n')
        }`
      );
    }
    assert.ok(true, 'warn-only — informational subtest per D-17');
  });
});

// ─── Corpus scan: won't occurrences (warn-only) ──────────────────────────────
//
// Phase 25 Plan 03 — WARN-ONLY per D-20. Manual classification (D-26) of 9
// corpus matches found 0 TPs (all factual: informational predictions, descriptive
// outcomes). Combined single subtest — volume is low and per-directory split would
// produce 0-3 match subtests that clutter output.
// See inline_classification in 25-03-PLAN.md for full TP/FP audit trail.

describe("corpus scan — won't occurrences (warn-only)", () => {
  test('found prompt files to scan', () => {
    assert.ok(ALL_FILES.length > 0, `Expected .md files in: ${SCAN_DIRS.join(', ')}`);
  });

  test("warn: won't occurrences across all scanned directories", () => {
    const violations = [];
    for (const file of ALL_FILES) {
      const relPath = path.relative(PROJECT_ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const { wont } = scanForNegativeFraming(content).warnings;
      if (wont.length > 0) violations.push({ file: relPath, lines: wont });
    }
    if (violations.length > 0) {
      console.warn(
        `[WARN] won't occurrences (informational per D-20, not enforced — corpus shows 0/9 are true directives):\n${
          violations.map(v =>
            `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
          ).join('\n')
        }`
      );
    }
    assert.ok(true, 'warn-only — informational subtest per D-20');
  });
});

// ─── Corpus scan: will not occurrences (warn-only) ───────────────────────────
//
// Phase 25 Plan 03 — WARN-ONLY per D-23. Manual classification (D-26) of 9
// corpus matches found 0 clear TPs + 3 borderline ("You will NOT be resumed" —
// second-person address that functions as informational rather than a prohibition
// to reframe). Combined single subtest — same rationale as won't.
// See inline_classification in 25-03-PLAN.md for full TP/FP audit trail.

describe('corpus scan — will not occurrences (warn-only)', () => {
  test('found prompt files to scan', () => {
    assert.ok(ALL_FILES.length > 0, `Expected .md files in: ${SCAN_DIRS.join(', ')}`);
  });

  test('warn: will not occurrences across all scanned directories', () => {
    const violations = [];
    for (const file of ALL_FILES) {
      const relPath = path.relative(PROJECT_ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const { willNot } = scanForNegativeFraming(content).warnings;
      if (willNot.length > 0) violations.push({ file: relPath, lines: willNot });
    }
    if (violations.length > 0) {
      console.warn(
        `[WARN] will not occurrences (informational per D-23, not enforced — corpus shows 0 clear directives + 3 borderline "You will NOT be resumed"):\n${
          violations.map(v =>
            `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
          ).join('\n')
        }`
      );
    }
    assert.ok(true, 'warn-only — informational subtest per D-23');
  });
});

// ─── Corpus scan: prohibited primary directive ────────────────────────────────
//
// Phase 29 TDD red gate (SCAN-11): these subtests MUST be confirmed FAILING
// against unmodified corpus files before Phase 30 applies any fixes.
// D-01/D-02 (Phase 29 CONTEXT.md): hard-failure, single regex, no helper,
// no hasPositiveComplement filter (Reading A — literal mustNot/shouldNot precedent).
// Expected RED: ≥1 violation file in agents, ≥1 in workflows (13 total raw matches).
// Per user decision (planning_context): NO hasPositiveComplement filter.

describe('corpus scan — prohibited primary directives', () => {
  test('found prompt files to scan', () => {
    assert.ok(ALL_FILES.length > 0, `Expected .md files in: ${SCAN_DIRS.join(', ')}`);
  });

  test('no bare prohibited directives in agent files', () => {
    const agentFiles = ALL_FILES.filter(f => f.includes('/agents/'));
    const violations = [];
    for (const file of agentFiles) {
      const relPath = path.relative(PROJECT_ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const { prohibited } = scanForNegativeFraming(content).violations;
      if (prohibited.length > 0) violations.push({ file: relPath, lines: prohibited });
    }
    assert.equal(violations.length, 0,
      `"prohibited" directives found in agent files. Convert to affirmative requirements:\n${
        violations.map(v =>
          `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
        ).join('\n')
      }`
    );
  });

  test('no bare prohibited directives in workflow files', () => {
    const workflowFiles = ALL_FILES.filter(f => f.includes('/workflows/'));
    const violations = [];
    for (const file of workflowFiles) {
      const relPath = path.relative(PROJECT_ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const { prohibited } = scanForNegativeFraming(content).violations;
      if (prohibited.length > 0) violations.push({ file: relPath, lines: prohibited });
    }
    assert.equal(violations.length, 0,
      `"prohibited" directives found in workflow files. Convert to affirmative requirements:\n${
        violations.map(v =>
          `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
        ).join('\n')
      }`
    );
  });
});

// ─── Corpus scan: forbidden predicate-form directive ─────────────────────────
//
// Phase 29 TDD red gate (SCAN-11): this subtest MUST be confirmed FAILING
// against unmodified corpus files before Phase 30 applies any fixes.
// D-04/D-05 (Phase 29 CONTEXT.md): hard-failure, predicate-form helper only.
// NO hasPositiveComplement gate — all 3 named TPs are filtered by it (SCAN-11 break).
// Known TPs: gsd-pattern-mapper.md:121, gsd-planner.md:218, gsd-planner.md:1212.
// Per user decision (planning_context): isForbiddenDirective() alone, no further filter.

describe('corpus scan — forbidden predicate-form directives', () => {
  test('found prompt files to scan', () => {
    assert.ok(ALL_FILES.length > 0, `Expected .md files in: ${SCAN_DIRS.join(', ')}`);
  });

  test('no predicate-form forbidden directives in agent files', () => {
    const agentFiles = ALL_FILES.filter(f => f.includes('/agents/'));
    const violations = [];
    for (const file of agentFiles) {
      const relPath = path.relative(PROJECT_ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const { forbidden } = scanForNegativeFraming(content).violations;
      if (forbidden.length > 0) violations.push({ file: relPath, lines: forbidden });
    }
    assert.equal(violations.length, 0,
      `Predicate-form "is/are forbidden" directives found in agent files. Convert to affirmative requirements:\n${
        violations.map(v =>
          `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
        ).join('\n')
      }`
    );
  });

  test('no predicate-form forbidden directives in workflow files', () => {
    const workflowFiles = ALL_FILES.filter(f => f.includes('/workflows/'));
    const violations = [];
    for (const file of workflowFiles) {
      const relPath = path.relative(PROJECT_ROOT, file);
      const content = fs.readFileSync(file, 'utf-8');
      const { forbidden } = scanForNegativeFraming(content).violations;
      if (forbidden.length > 0) violations.push({ file: relPath, lines: forbidden });
    }
    assert.equal(violations.length, 0,
      `Predicate-form "is/are forbidden" directives found in workflow files. Convert to affirmative requirements:\n${
        violations.map(v =>
          `  ${v.file}:\n${v.lines.map(l => `    line ${l.lineNumber}: ${l.line}`).join('\n')}`
        ).join('\n')
      }`
    );
  });
});
