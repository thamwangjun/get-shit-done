import type { QueryHandler } from '../../query/utils.js';
import {
  verifyPlanStructure, verifyPhaseCompleteness, verifyReferences,
  verifyCommits, verifyArtifacts, verifySchemaDrift, verifyCodebaseDrift,
} from '../../query/verify.js';
import { verifyKeyLinks } from '../../query/validate.js';

export const VERIFY_FAMILY_HANDLERS: Readonly<Record<string, QueryHandler>> = {
  'verify.plan-structure': verifyPlanStructure,
  'verify.phase-completeness': verifyPhaseCompleteness,
  'verify.references': verifyReferences,
  'verify.commits': verifyCommits,
  'verify.artifacts': verifyArtifacts,
  'verify.key-links': verifyKeyLinks,
  'verify.schema-drift': verifySchemaDrift,
  'verify.codebase-drift': verifyCodebaseDrift,
};
