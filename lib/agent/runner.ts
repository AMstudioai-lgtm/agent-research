/**
 * @deprecated Utilisez plutôt `@/lib/agent/runner-service` (executeResearchPlanning)
 * et `@/lib/agent/fallback-policy` (executeWithFallback, createFallbackChain).
 * 
 * Ce fichier est conservé pour la compatibilité ascendante uniquement.
 */

export { executeResearchPlanning } from './runner-service';
export { executeWithFallback, createFallbackChain, defaultClassifyError } from './fallback-policy';
export { parseAndValidatePlan, cleanModelOutput, validatePlanSchema, applyV1Locks } from './plan-parser';

export type { 
  ExecutionResult 
} from './runner-service';

export type { 
  AttemptResult, 
  AttemptError, 
  AttemptOutcome, 
  ModelError, 
  FallbackPolicyOptions 
} from './fallback-policy';

export type { 
  ParsedPlanResult, 
  ParseError, 
  PlanParseOutcome 
} from './plan-parser';

// Re-export des modèles supportés (source unique)
export { 
  SUPPORTED_MODELS, 
  DEFAULT_MODEL_ID, 
  VALID_MODEL_IDS, 
  getModelConfig, 
  normalizeModelId, 
  buildFallbackChain 
} from '@/lib/config/models';

export type { ModelConfig } from '@/lib/config/models';