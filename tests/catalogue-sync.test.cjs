/**
 * Phase 08-catalogue-sync verification tests.
 *
 * CAT-01: All 6 new commands appear in CATALOGUE.json commands array.
 * CAT-02: All 8 new references appear in CATALOGUE.json references array.
 * CAT-03: All 5 new workflows appear in CATALOGUE.json workflows array.
 * CAT-04: spec.md appears in CATALOGUE.json templates array.
 * CAT-05: CATALOGUE.json counts and total reflect the 20-entry addition
 *         and array lengths match their counts fields.
 */
'use strict';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const CATALOGUE = require(path.join(ROOT, 'CATALOGUE.json'));

// ---------------------------------------------------------------------------
// CAT-01 — 6 new commands
// ---------------------------------------------------------------------------

describe('CAT-01: new commands appear in CATALOGUE.json commands array', () => {
  const commandFiles = CATALOGUE.commands.map((e) => e.file);

  const expectedCommands = [
    'commands/gsd/inbox.md',
    'commands/gsd/sketch.md',
    'commands/gsd/sketch-wrap-up.md',
    'commands/gsd/spec-phase.md',
    'commands/gsd/spike.md',
    'commands/gsd/spike-wrap-up.md',
  ];

  for (const file of expectedCommands) {
    test(`commands array contains ${file}`, () => {
      assert.ok(
        commandFiles.includes(file),
        `Expected "${file}" to be present in CATALOGUE.json commands array`,
      );
    });
  }
});

// ---------------------------------------------------------------------------
// CAT-02 — 8 new references
// ---------------------------------------------------------------------------

describe('CAT-02: new references appear in CATALOGUE.json references array', () => {
  const referenceFiles = CATALOGUE.references.map((e) => e.file);

  const expectedReferences = [
    'get-shit-done/references/autonomous-smart-discuss.md',
    'get-shit-done/references/debugger-philosophy.md',
    'get-shit-done/references/mandatory-initial-read.md',
    'get-shit-done/references/project-skills-discovery.md',
    'get-shit-done/references/sketch-interactivity.md',
    'get-shit-done/references/sketch-theme-system.md',
    'get-shit-done/references/sketch-tooling.md',
    'get-shit-done/references/sketch-variant-patterns.md',
  ];

  for (const file of expectedReferences) {
    test(`references array contains ${file}`, () => {
      assert.ok(
        referenceFiles.includes(file),
        `Expected "${file}" to be present in CATALOGUE.json references array`,
      );
    });
  }
});

// ---------------------------------------------------------------------------
// CAT-03 — 5 new workflows
// ---------------------------------------------------------------------------

describe('CAT-03: new workflows appear in CATALOGUE.json workflows array', () => {
  const workflowFiles = CATALOGUE.workflows.map((e) => e.file);

  const expectedWorkflows = [
    'get-shit-done/workflows/sketch.md',
    'get-shit-done/workflows/sketch-wrap-up.md',
    'get-shit-done/workflows/spec-phase.md',
    'get-shit-done/workflows/spike.md',
    'get-shit-done/workflows/spike-wrap-up.md',
  ];

  for (const file of expectedWorkflows) {
    test(`workflows array contains ${file}`, () => {
      assert.ok(
        workflowFiles.includes(file),
        `Expected "${file}" to be present in CATALOGUE.json workflows array`,
      );
    });
  }
});

// ---------------------------------------------------------------------------
// CAT-04 — spec.md template
// ---------------------------------------------------------------------------

describe('CAT-04: spec.md appears in CATALOGUE.json templates array', () => {
  const templateFiles = CATALOGUE.templates.map((e) => e.file);

  test('templates array contains get-shit-done/templates/spec.md', () => {
    assert.ok(
      templateFiles.includes('get-shit-done/templates/spec.md'),
      'Expected "get-shit-done/templates/spec.md" to be present in CATALOGUE.json templates array',
    );
  });
});

// ---------------------------------------------------------------------------
// CAT-05 — counts block and array-length consistency
// ---------------------------------------------------------------------------

describe('CAT-05: counts and total reflect the 20-entry addition', () => {
  test('total is 270', () => {
    assert.equal(
      CATALOGUE.total,
      270,
      `Expected CATALOGUE.json total to be 270, got ${CATALOGUE.total}`,
    );
  });

  test('counts.commands is 79', () => {
    assert.equal(
      CATALOGUE.counts.commands,
      79,
      `Expected counts.commands to be 79, got ${CATALOGUE.counts.commands}`,
    );
  });

  test('counts.workflows is 80', () => {
    assert.equal(
      CATALOGUE.counts.workflows,
      80,
      `Expected counts.workflows to be 80, got ${CATALOGUE.counts.workflows}`,
    );
  });

  test('counts.agents is 31', () => {
    assert.equal(
      CATALOGUE.counts.agents,
      31,
      `Expected counts.agents to be 31, got ${CATALOGUE.counts.agents}`,
    );
  });

  test('counts.references is 48', () => {
    assert.equal(
      CATALOGUE.counts.references,
      48,
      `Expected counts.references to be 48, got ${CATALOGUE.counts.references}`,
    );
  });

  test('counts.templates is 32', () => {
    assert.equal(
      CATALOGUE.counts.templates,
      32,
      `Expected counts.templates to be 32, got ${CATALOGUE.counts.templates}`,
    );
  });

  test('commands array length matches counts.commands', () => {
    assert.equal(
      CATALOGUE.commands.length,
      CATALOGUE.counts.commands,
      `commands array has ${CATALOGUE.commands.length} entries but counts.commands says ${CATALOGUE.counts.commands}`,
    );
  });

  test('workflows array length matches counts.workflows', () => {
    assert.equal(
      CATALOGUE.workflows.length,
      CATALOGUE.counts.workflows,
      `workflows array has ${CATALOGUE.workflows.length} entries but counts.workflows says ${CATALOGUE.counts.workflows}`,
    );
  });

  test('references array length matches counts.references', () => {
    assert.equal(
      CATALOGUE.references.length,
      CATALOGUE.counts.references,
      `references array has ${CATALOGUE.references.length} entries but counts.references says ${CATALOGUE.counts.references}`,
    );
  });

  test('templates array length matches counts.templates', () => {
    assert.equal(
      CATALOGUE.templates.length,
      CATALOGUE.counts.templates,
      `templates array has ${CATALOGUE.templates.length} entries but counts.templates says ${CATALOGUE.counts.templates}`,
    );
  });
});
