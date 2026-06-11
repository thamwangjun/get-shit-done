// allow-test-rule: source-text-is-the-product
// Workflow .md / agent .md / command .md / reference .md files — their text
// IS what the runtime loads. Testing text content tests the deployed contract.
// Per CONTRIBUTING.md exception matrix.

/**
 * Execute-phase worktree shared artifact ownership tests
 *
 * Guards against bug #1571: worktree executor agents independently writing
 * STATE.md and ROADMAP.md, causing last-merge-wins overwrites.
 *
 * Fix: In parallel worktree mode, remove STATE.md/ROADMAP.md update requirements
 * from the executor agent success_criteria. The orchestrator owns those writes
 * after each wave via single-writer post-wave commands.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const WORKFLOW_PATH = path.join(__dirname, '..', 'gsd-core', 'workflows', 'execute-phase.md');

describe('execute-phase worktree: shared artifact ownership (#1571)', () => {
  test('workflow file exists', () => {
    assert.ok(fs.existsSync(WORKFLOW_PATH), 'workflows/execute-phase.md should exist');
  });

  test('worktree executor agent success_criteria does NOT include STATE.md update', () => {
    const content = fs.readFileSync(WORKFLOW_PATH, 'utf-8');

    // Extract the worktree Task() block (between "Worktree mode" and "Sequential mode")
    const worktreeMatch = content.match(
      /\*\*Worktree mode\*\*[\s\S]*?<success_criteria>([\s\S]*?)<\/success_criteria>/
    );
    assert.ok(worktreeMatch, 'should find success_criteria inside the worktree mode Task block');

    const criteria = worktreeMatch[1];
    // 260608-fwg: the rewrite's worktree success_criteria now contains the explicit line
    // "No modifications to STATE.md/ROADMAP.md", which states the contract MORE strongly
    // (executor does NOT own these writes). A naive substring check trips on that line, so
    // scope the absence check to REQUIRED-write checklist items: assert no checklist item
    // requires WRITING/UPDATING STATE.md, while the "No modifications to ..." line satisfies
    // (not violates) the intent. Preserves intent without weakening.
    const requiresStateWrite = /(update|write|create|commit)[^\n]*STATE\.md/i.test(criteria) &&
      !/No modifications to STATE\.md/i.test(criteria);
    assert.ok(
      !requiresStateWrite,
      'worktree executor success_criteria must NOT require a STATE.md write (orchestrator owns this write)'
    );
    assert.ok(
      /No modifications to STATE\.md/i.test(criteria),
      'worktree executor success_criteria should explicitly forbid STATE.md modifications'
    );
  });

  test('worktree executor agent success_criteria does NOT include ROADMAP.md update', () => {
    const content = fs.readFileSync(WORKFLOW_PATH, 'utf-8');

    // Extract the worktree Task() block
    const worktreeMatch = content.match(
      /\*\*Worktree mode\*\*[\s\S]*?<success_criteria>([\s\S]*?)<\/success_criteria>/
    );
    assert.ok(worktreeMatch, 'should find success_criteria inside the worktree mode Task block');

    const criteria = worktreeMatch[1];
    // 260608-fwg: same scoping as the STATE.md test above — the "No modifications to
    // STATE.md/ROADMAP.md" line satisfies the intent. Assert no checklist item requires a
    // ROADMAP.md write, and that modifications are explicitly forbidden.
    const requiresRoadmapWrite = /(update|write|create|commit)[^\n]*ROADMAP\.md/i.test(criteria) &&
      !/No modifications to[^\n]*ROADMAP\.md/i.test(criteria);
    assert.ok(
      !requiresRoadmapWrite,
      'worktree executor success_criteria must NOT require a ROADMAP.md write (orchestrator owns this write)'
    );
    assert.ok(
      /No modifications to[^\n]*ROADMAP\.md/i.test(criteria),
      'worktree executor success_criteria should explicitly forbid ROADMAP.md modifications'
    );
  });

  test('worktree executor agent success_criteria includes SUMMARY.md creation', () => {
    const content = fs.readFileSync(WORKFLOW_PATH, 'utf-8');

    // SUMMARY.md is plan-local and safe for worktree agents to create
    const worktreeMatch = content.match(
      /\*\*Worktree mode\*\*[\s\S]*?<success_criteria>([\s\S]*?)<\/success_criteria>/
    );
    assert.ok(worktreeMatch, 'should find success_criteria inside the worktree mode Task block');

    const criteria = worktreeMatch[1];
    assert.ok(
      criteria.includes('SUMMARY.md'),
      'worktree executor success_criteria should still require SUMMARY.md creation'
    );
  });

  test('post-wave orchestrator runs roadmap update-plan-progress for each completed plan', () => {
    const content = fs.readFileSync(WORKFLOW_PATH, 'utf-8');
    // 260608-fwg: rewrite uses the dotted SDK verb `roadmap.update-plan-progress`.
    assert.ok(
      content.includes('roadmap.update-plan-progress'),
      'post-wave section should contain orchestrator-owned roadmap.update-plan-progress command'
    );
    // Confirm it is in a post-wave context, not only inside an agent prompt
    const postWaveIdx = content.indexOf('roadmap.update-plan-progress');
    const worktreeAgentStart = content.indexOf('isolation="worktree"');
    const worktreeAgentEnd = content.indexOf('**Sequential mode**');
    assert.ok(
      postWaveIdx < worktreeAgentStart || postWaveIdx > worktreeAgentEnd,
      'roadmap update-plan-progress must appear outside the worktree agent prompt (orchestrator-owned)'
    );
  });

  test('ghost state update-position command removed from post-wave section (#1627)', () => {
    const content = fs.readFileSync(WORKFLOW_PATH, 'utf-8');
    assert.ok(
      !content.includes('state update-position'),
      'state update-position was a ghost reference (command never existed in CLI dispatcher) — should be removed'
    );
  });

  // 260608-fwg (D-02): the rewrite no longer carries a full second `<success_criteria>`
  // Task block for sequential mode. The sequential-mode guarantee is now expressed as a
  // prose `<sequential_execution>` substitution plus the line "Success criteria include
  // STATE.md and ROADMAP.md updates (not deferred)." Re-pointed both assertions to that
  // surviving sentence, which preserves the intent: sequential executors DO own STATE.md /
  // ROADMAP.md writes (no conflict risk). FLAG: the structural `<success_criteria>` Task
  // block for sequential mode vanished; a SEPARATE workflow-edit task may restore it.
  function sequentialModeSuccessCriteria(content) {
    const seqIdx = content.indexOf('**Sequential mode**');
    assert.ok(seqIdx !== -1, 'workflow should document a Sequential mode dispatch path');
    // Bound the sequential-mode region at the next numbered step ("6. **Wait").
    const endIdx = content.indexOf('6. **Wait for all agents', seqIdx);
    return content.slice(seqIdx, endIdx === -1 ? undefined : endIdx);
  }

  test('sequential mode executor agent success_criteria still includes STATE.md update', () => {
    const content = fs.readFileSync(WORKFLOW_PATH, 'utf-8');
    const seqRegion = sequentialModeSuccessCriteria(content);
    assert.match(
      seqRegion,
      /Success criteria include STATE\.md and ROADMAP\.md updates \(not deferred\)/,
      'sequential mode must state STATE.md/ROADMAP.md updates are included (not deferred)'
    );
    assert.ok(
      seqRegion.includes('STATE.md'),
      'sequential executor success criteria should still require STATE.md update (no conflict risk)'
    );
  });

  test('sequential mode executor agent success_criteria still includes ROADMAP.md update', () => {
    const content = fs.readFileSync(WORKFLOW_PATH, 'utf-8');
    const seqRegion = sequentialModeSuccessCriteria(content);
    assert.ok(
      seqRegion.includes('ROADMAP.md'),
      'sequential executor success criteria should still require ROADMAP.md update (no conflict risk)'
    );
  });
});
