/**
 * Service d'exécution de l'agent ADK - orchestration fine, erreurs typées.
 * Remplace l'ancien runner.ts monolithique.
 */

import { InMemoryRunner } from '@google/adk';
import { createResearchAgent } from './research-agent';
import { executeWithFallback, createFallbackChain, ModelError, AttemptResult } from './fallback-policy';
import { parseAndValidatePlan, PlanParseOutcome } from './plan-parser';
import { ResearchPlan } from '@/types/agent';
import { normalizeModelId } from '@/lib/config/models';

// Cache des runners par modèle (WeakMap pour éviter les fuites mémoire en long-running)
const runnerCache = new Map<string, InMemoryRunner>();

function getRunnerForModel(modelName: string): InMemoryRunner {
  if (!runnerCache.has(modelName)) {
    const agent = createResearchAgent(modelName);
    const runner = new InMemoryRunner({
      agent,
      appName: `ResearchAgent_${modelName.replace(/[^a-zA-Z0-9]/g, '_')}`,
    });
    runnerCache.set(modelName, runner);
  }
  return runnerCache.get(modelName)!;
}

/**
 * Exécute une unique tentative avec un modèle donné.
 * Retourne le texte brut de la réponse de l'agent.
 */
async function executeSingleAttempt(modelId: string, userPrompt: string): Promise<string> {
  const runner = getRunnerForModel(modelId);
  
  const runStream = runner.runEphemeral({
    userId: `user_${Date.now()}`,
    newMessage: {
      parts: [{ text: userPrompt }],
    },
  });

  let rawOutput = '';
  let errorCode = '';
  let errorMessage = '';

  for await (const event of runStream) {
    if (event.errorCode) {
      errorCode = String(event.errorCode);
    }
    if (event.errorMessage) {
      errorMessage = event.errorMessage;
    }

    if (event.content?.parts) {
      for (const part of event.content.parts) {
        if (part.text) {
          rawOutput += part.text;
        }
      }
    }
  }

  // Si erreur sans output, on jette une erreur structurée
  if (errorMessage && !rawOutput.trim()) {
    const err = new Error(errorMessage) as Error & { code?: string };
    err.code = errorCode || 'AGENT_ERROR';
    throw err;
  }

  if (!rawOutput.trim()) {
    throw new Error(`L'agent ADK n'a produit aucun texte exploitable avec ${modelId}.`);
  }

  return rawOutput;
}

/**
 * Résultat final de l'exécution complète (avec fallback).
 */
export interface ExecutionResult {
  plan: ResearchPlan;
  modelUsed: string;
  isFallback: boolean;
  fallbackNotice?: string;
}

/**
 * Exécute la planification complète avec résilience (retry + fallback multi-modèles).
 * 
 * @param userPrompt - La demande utilisateur
 * @param requestedModel - Modèle demandé par l'utilisateur (optionnel)
 * @returns Plan structuré validé + métadonnées d'exécution
 * @throws ModelError structurée si tous les modèles échouent
 */
export async function executeResearchPlanning(
  userPrompt: string,
  requestedModel?: string
): Promise<ExecutionResult> {
  // Validation entrée
  if (!userPrompt || typeof userPrompt !== 'string' || userPrompt.trim().length === 0) {
    throw {
      code: 'INVALID_INPUT',
      message: 'La demande utilisateur est vide ou invalide.',
      retryable: false,
    } as ModelError;
  }

  if (userPrompt.trim().length > 2000) {
    throw {
      code: 'INPUT_TOO_LONG',
      message: 'La demande dépasse la limite autorisée de 2000 caractères.',
      retryable: false,
    } as ModelError;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw {
      code: 'MISSING_API_KEY',
      message: "La clé d'API GEMINI_API_KEY n'est pas configurée dans les variables d'environnement.",
      retryable: false,
    } as ModelError;
  }

  // Normalisation et chaîne de fallback
  const primaryModel = normalizeModelId(requestedModel);
  const modelsToTry = createFallbackChain(primaryModel);

  // Exécution avec politique de fallback
  const attemptResult = await executeWithFallback<string>(
    modelsToTry,
    async (modelId, attemptNumber) => {
      return executeSingleAttempt(modelId, userPrompt.trim());
    },
    {
      // Configuration spécifique ADK
      maxAttemptsPerModel: (_modelId, isFallback) => (isFallback ? 1 : 2),
      baseDelayMs: 1000,
      backoffMultiplier: 1.5,
      maxDelayMs: 10000,
    }
  );

  const { data: rawOutput, modelUsed, isFallback } = attemptResult;

  // Parsing et validation du plan
  const fallbackNotice = isFallback
    ? `Note de résilience : le modèle ${primaryModel} a échoué. L'agent a finalisé avec succès votre plan via ${modelUsed}.`
    : undefined;

  const parseResult: PlanParseOutcome = parseAndValidatePlan(rawOutput, modelUsed, fallbackNotice);

  if (!parseResult.success) {
    throw {
      code: parseResult.code,
      message: parseResult.message,
      retryable: false, // Erreur de parsing = pas la peine de réessayer d'autres modèles
      originalError: parseResult.rawOutput,
    } as ModelError;
  }

  return {
    plan: parseResult.plan,
    modelUsed,
    isFallback,
    fallbackNotice,
  };
}

/**
 * Vide le cache des runners (utile pour tests ou rotation de clés API).
 */
export function clearRunnerCache(): void {
  runnerCache.clear();
}