import type { QueryHandler } from './utils.js';
import { agentSkills } from './skills.js';
import { requirementsMarkComplete } from './roadmap.js';
import { todoMatchPhase, statsJson, statsTable, progressBar, progressTable, listTodos, todoComplete } from './progress.js';
import { milestoneComplete } from './phase-lifecycle.js';
import { summaryExtract, historyDigest } from './summary.js';
import { commitToSubrepo } from './commit.js';
import { workstreamGet, workstreamList, workstreamCreate, workstreamSet, workstreamStatus, workstreamComplete, workstreamProgress } from './workstream.js';
import { docsInit } from './docs-init.js';
import { websearch } from './websearch.js';
import { learningsCopy, learningsQuery, learningsListHandler, learningsPrune, learningsDelete, extractMessages, scanSessions, profileSample, profileQuestionnaire } from './profile.js';
import { skillManifest } from './skill-manifest.js';
import { auditOpen } from './audit-open.js';
import { detectCustomFiles } from './detect-custom-files.js';
import { uatRenderCheckpoint, auditUat } from './uat.js';
// D-204 register-by-default: intel.* handlers registered in SDK registry.
// ADR-3524 omission reversed — Phase 55.2 Plan 02 unblocks intel parity rows
// (read-only-golden-rows.ts lines 35-44) and the intel.update golden test.
import {
  intelStatus, intelDiff, intelSnapshot, intelValidate,
  intelQuery, intelExtractExports, intelPatchMeta, intelUpdate,
} from './intel.js';
import { writeProfile, generateClaudeProfile, generateDevPreferences, generateClaudeMd } from './profile-output.js';
import { phaseMvpMode, taskIsBehaviorAdding, userStoryValidate } from './mvp.js';
import { worktreeCleanupWave, worktreeReapOrphans } from './worktree.js';
import { promptBudget } from './prompt-budget.js';

export const DOMAIN_STATIC_CATALOG: ReadonlyArray<readonly [string, QueryHandler]> = [
  ['agent-skills', agentSkills],
  ['requirements.mark-complete', requirementsMarkComplete],
  ['requirements mark-complete', requirementsMarkComplete],
  ['todo.match-phase', todoMatchPhase],
  ['todo match-phase', todoMatchPhase],
  ['list-todos', listTodos],
  ['list.todos', listTodos],
  ['todo.complete', todoComplete],
  ['todo complete', todoComplete],
  ['milestone.complete', milestoneComplete],
  ['milestone complete', milestoneComplete],
  ['summary.extract', summaryExtract],
  ['summary extract', summaryExtract],
  ['summary-extract', summaryExtract],
  ['history.digest', historyDigest],
  ['history digest', historyDigest],
  ['history-digest', historyDigest],
  ['stats', statsJson],
  ['stats.json', statsJson],
  ['stats json', statsJson],
  ['stats.table', statsTable],
  ['stats table', statsTable],
  ['commit-to-subrepo', commitToSubrepo],
  ['progress.bar', progressBar],
  ['progress bar', progressBar],
  ['progress.table', progressTable],
  ['progress table', progressTable],
  ['workstream.get', workstreamGet],
  ['workstream get', workstreamGet],
  ['workstream.list', workstreamList],
  ['workstream list', workstreamList],
  ['workstream.create', workstreamCreate],
  ['workstream create', workstreamCreate],
  ['workstream.set', workstreamSet],
  ['workstream set', workstreamSet],
  ['workstream.status', workstreamStatus],
  ['workstream status', workstreamStatus],
  ['workstream.complete', workstreamComplete],
  ['workstream complete', workstreamComplete],
  ['workstream.progress', workstreamProgress],
  ['workstream progress', workstreamProgress],
  ['worktree.cleanup-wave', worktreeCleanupWave],
  ['worktree cleanup-wave', worktreeCleanupWave],
  ['worktree.reap-orphans', worktreeReapOrphans],
  ['worktree reap-orphans', worktreeReapOrphans],
  ['docs-init', docsInit],
  ['websearch', websearch],
  ['learnings.copy', learningsCopy],
  ['learnings copy', learningsCopy],
  ['learnings.query', learningsQuery],
  ['learnings query', learningsQuery],
  ['learnings.list', learningsListHandler],
  ['learnings list', learningsListHandler],
  ['learnings.prune', learningsPrune],
  ['learnings prune', learningsPrune],
  ['learnings.delete', learningsDelete],
  ['learnings delete', learningsDelete],
  ['skill-manifest', skillManifest],
  ['skill manifest', skillManifest],
  ['audit-open', auditOpen],
  ['audit open', auditOpen],
  ['detect-custom-files', detectCustomFiles],
  ['extract-messages', extractMessages],
  ['extract.messages', extractMessages],
  ['audit-uat', auditUat],
  ['uat.render-checkpoint', uatRenderCheckpoint],
  ['uat render-checkpoint', uatRenderCheckpoint],
  // intel.* entries — registered per D-204 (Phase 55.2 Plan 02).
  ['intel.status', intelStatus],
  ['intel status', intelStatus],
  ['intel.diff', intelDiff],
  ['intel diff', intelDiff],
  ['intel.snapshot', intelSnapshot],
  ['intel snapshot', intelSnapshot],
  ['intel.validate', intelValidate],
  ['intel validate', intelValidate],
  ['intel.query', intelQuery],
  ['intel query', intelQuery],
  ['intel.extract-exports', intelExtractExports],
  ['intel extract-exports', intelExtractExports],
  ['intel.patch-meta', intelPatchMeta],
  ['intel patch-meta', intelPatchMeta],
  ['intel.update', intelUpdate],
  ['intel update', intelUpdate],
  ['generate-claude-profile', generateClaudeProfile],
  ['generate-dev-preferences', generateDevPreferences],
  ['write-profile', writeProfile],
  ['profile-questionnaire', profileQuestionnaire],
  ['profile-sample', profileSample],
  ['scan-sessions', scanSessions],
  ['generate-claude-md', generateClaudeMd],
  // ── MVP umbrella (#2826) — centralized resolution seams ──
  ['phase.mvp-mode', phaseMvpMode],
  ['phase mvp-mode', phaseMvpMode],
  ['task.is-behavior-adding', taskIsBehaviorAdding],
  ['task is-behavior-adding', taskIsBehaviorAdding],
  ['user-story.validate', userStoryValidate],
  ['user-story validate', userStoryValidate],
  ['prompt-budget', promptBudget],
] as const;
