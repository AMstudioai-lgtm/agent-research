/**
 * Parsing et validation du plan de recherche - logique pure, sans side-effects.
 * Garantit que la sortie de l'agent ADK respecte le contrat V1 strict.
 */

import { ResearchPlan, PlannedTask, RequiredInformation, RequiredTool, NextAction } from '@/types/agent';

export interface ParsedPlanResult {
  success: true;
  plan: ResearchPlan;
}

export interface ParseError {
  success: false;
  code: 'EMPTY_OUTPUT' | 'INVALID_JSON' | 'SCHEMA_VALIDATION_FAILED' | 'MISSING_REQUIRED_FIELDS';
  message: string;
  rawOutput?: string;
}

export type PlanParseOutcome = ParsedPlanResult | ParseError;

/**
 * Nettoie la sortie brute du modèle (retire les fences markdown, etc.)
 */
export function cleanModelOutput(rawOutput: string): string {
  let cleaned = rawOutput.trim();
  
  // Retirer les fences ```json ... ``` ou ``` ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned
      .replace(/^```(?:json)?\n?/i, '')
      .replace(/\n?```$/, '')
      .trim();
  }
  
  return cleaned;
}

/**
 * Valide que l'objet parsé contient tous les champs requis du schéma V1.
 */
export function validatePlanSchema(obj: unknown): obj is ResearchPlan {
  if (!obj || typeof obj !== 'object') return false;
  
  const plan = obj as Record<string, unknown>;
  
  // Champs obligatoires
  const requiredFields: (keyof ResearchPlan)[] = [
    'objective',
    'tasks',
    'requiredInformation',
    'requiredTools',
    'stoppingCriteria',
    'nextAction',
    'status',
  ];
  
  for (const field of requiredFields) {
    if (!(field in plan)) {
      return false;
    }
  }
  
  // Validation des sous-structures
  if (!Array.isArray(plan.tasks) || !plan.tasks.every(isValidTask)) return false;
  if (!isValidRequiredInformation(plan.requiredInformation)) return false;
  if (!Array.isArray(plan.requiredTools) || !plan.requiredTools.every(isValidTool)) return false;
  if (!isValidNextAction(plan.nextAction)) return false;
  if (plan.status !== 'PLANIFIÉ') return false;
  if (typeof plan.objective !== 'string' || !plan.objective.trim()) return false;
  if (typeof plan.stoppingCriteria !== 'string' || !plan.stoppingCriteria.trim()) return false;
  
  return true;
}

function isValidTask(task: unknown): task is PlannedTask {
  if (!task || typeof task !== 'object') return false;
  const t = task as Record<string, unknown>;
  return (
    typeof t.id === 'number' &&
    typeof t.description === 'string' && t.description.trim() !== '' &&
    typeof t.expectedOutput === 'string' && t.expectedOutput.trim() !== ''
  );
}

function isValidRequiredInformation(info: unknown): info is RequiredInformation {
  if (!info || typeof info !== 'object') return false;
  const i = info as Record<string, unknown>;
  return (
    Array.isArray(i.available) && i.available.every(v => typeof v === 'string') &&
    Array.isArray(i.missing) && i.missing.every(v => typeof v === 'string')
  );
}

function isValidTool(tool: unknown): tool is RequiredTool {
  if (!tool || typeof tool !== 'object') return false;
  const t = tool as Record<string, unknown>;
  return (
    typeof t.name === 'string' && t.name.trim() !== '' &&
    typeof t.reason === 'string' && t.reason.trim() !== '' &&
    Array.isArray(t.parametersNeeded) && t.parametersNeeded.every(v => typeof v === 'string')
  );
}

function isValidNextAction(action: unknown): action is NextAction {
  if (!action || typeof action !== 'object') return false;
  const a = action as Record<string, unknown>;
  return (
    typeof a.action === 'string' && a.action.trim() !== '' &&
    typeof a.targetTool === 'string' && a.targetTool.trim() !== '' &&
    typeof a.isBlocked === 'boolean'
  );
}

/**
 * Applique les verrous défensifs V1 sur un plan validé :
 * - Force status = 'PLANIFIÉ'
 * - Force nextAction.isBlocked = true
 * - Ajoute blockReason si absent
 * - Définit modelUsed
 * - Ajoute fallbackNotice si fourni
 */
export function applyV1Locks(
  plan: ResearchPlan,
  modelUsed: string,
  fallbackNotice?: string
): ResearchPlan {
  const lockedPlan = { ...plan };
  
  // Verrou 1 : Statut toujours PLANIFIÉ en V1
  lockedPlan.status = 'PLANIFIÉ';
  
  // Verrou 2 : Modèle utilisé
  lockedPlan.modelUsed = modelUsed;
  
  // Verrou 3 : Notice de fallback si applicable
  if (fallbackNotice) {
    lockedPlan.fallbackNotice = fallbackNotice;
  }
  
  // Verrou 4 : nextAction bloquée avec raison
  lockedPlan.nextAction = {
    ...lockedPlan.nextAction,
    isBlocked: true,
    blockReason: lockedPlan.nextAction.blockReason || 
      'Outil indisponible dans cette V1 pédagogique (outils réels prévus en V2).',
  };
  
  return lockedPlan;
}

/**
 * Pipeline complet : nettoie → parse JSON → valide schéma → applique verrous V1.
 * Retourne un résultat structuré (succès ou erreur détaillée).
 */
export function parseAndValidatePlan(
  rawOutput: string,
  modelUsed: string,
  fallbackNotice?: string
): PlanParseOutcome {
  // 1. Nettoyage
  const cleaned = cleanModelOutput(rawOutput);
  
  if (!cleaned) {
    return {
      success: false,
      code: 'EMPTY_OUTPUT',
      message: "L'agent n'a produit aucun texte exploitable.",
      rawOutput,
    };
  }
  
  // 2. Parsing JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    return {
      success: false,
      code: 'INVALID_JSON',
      message: `Sortie JSON invalide : ${e instanceof Error ? e.message : 'erreur de parsing'}`,
      rawOutput,
    };
  }
  
  // 3. Validation schéma
  if (!validatePlanSchema(parsed)) {
    return {
      success: false,
      code: 'SCHEMA_VALIDATION_FAILED',
      message: "La structure du plan ne respecte pas le schéma V1 requis.",
      rawOutput,
    };
  }
  
  // 4. Application des verrous V1
  const lockedPlan = applyV1Locks(parsed, modelUsed, fallbackNotice);
  
  return {
    success: true,
    plan: lockedPlan,
  };
}