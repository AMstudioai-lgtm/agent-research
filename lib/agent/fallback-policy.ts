/**
 * Politique de résilience : retry + fallback entre modèles.
 * Logique pure, sans side-effects, entièrement testable.
 */

import { buildFallbackChain } from '@/lib/config/models';

export interface AttemptResult<T> {
  success: true;
  data: T;
  modelUsed: string;
  isFallback: boolean;
}

export interface AttemptError {
  success: false;
  error: ModelError;
  modelAttempted: string;
  attemptNumber: number;
  isFallback: boolean;
}

export type AttemptOutcome<T> = AttemptResult<T> | AttemptError;

export interface ModelError {
  code: string;
  message: string;
  retryable: boolean;
  originalError?: unknown;
}

export interface FallbackPolicyOptions {
  /** Nombre max de tentatives par modèle (défaut: 2 pour modèle principal, 1 pour fallbacks) */
  maxAttemptsPerModel?: (modelId: string, isFallback: boolean) => number;
  /** Délai entre tentatives en ms (défaut: 1000ms) */
  baseDelayMs?: number;
  /** Facteur de backoff exponentiel (défaut: 1.5) */
  backoffMultiplier?: number;
  /** Délai max en ms (défaut: 10000ms) */
  maxDelayMs?: number;
  /** Fonction pour classifier une erreur brute */
  classifyError?: (error: unknown) => ModelError;
}

/** Options par défaut */
const DEFAULT_OPTIONS: Required<FallbackPolicyOptions> = {
  maxAttemptsPerModel: (_modelId, isFallback) => (isFallback ? 1 : 2),
  baseDelayMs: 1000,
  backoffMultiplier: 1.5,
  maxDelayMs: 10000,
  classifyError: defaultClassifyError,
};

/**
 * Classifie une erreur brute en ModelError structuré.
 * Détecte les codes 503, timeouts, erreurs réseau, quotas, etc.
 */
export function defaultClassifyError(error: unknown): ModelError {
  if (error instanceof Response) {
    // Erreur HTTP brute (fetch)
    const retryable = error.status === 429 || error.status >= 500;
    return {
      code: String(error.status),
      message: `HTTP ${error.status}: ${error.statusText}`,
      retryable,
      originalError: error,
    };
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    // 503 / surcharge explicite
    if (
      msg.includes('503') ||
      msg.includes('high demand') ||
      msg.includes('spikes in demand') ||
      msg.includes('temporarily unavailable') ||
      msg.includes('service unavailable') ||
      msg.includes('overloaded')
    ) {
      return {
        code: '503',
        message: error.message,
        retryable: true,
        originalError: error,
      };
    }

    // Timeout / réseau
    if (
      msg.includes('timeout') ||
      msg.includes('econnreset') ||
      msg.includes('etimedout') ||
      msg.includes('network') ||
      msg.includes('fetch failed')
    ) {
      return {
        code: 'NETWORK_ERROR',
        message: error.message,
        retryable: true,
        originalError: error,
      };
    }

    // Quota / rate limit (429)
    if (msg.includes('429') || msg.includes('quota') || msg.includes('rate limit')) {
      return {
        code: '429',
        message: error.message,
        retryable: true,
        originalError: error,
      };
    }

    // Auth / config (non retryable)
    if (msg.includes('401') || msg.includes('403') || msg.includes('api key') || msg.includes('unauthorized')) {
      return {
        code: 'AUTH_ERROR',
        message: error.message,
        retryable: false,
        originalError: error,
      };
    }

    // Parsing / validation (non retryable)
    if (msg.includes('json') || msg.includes('parse') || msg.includes('schema') || msg.includes('validation')) {
      return {
        code: 'PARSE_ERROR',
        message: error.message,
        retryable: false,
        originalError: error,
      };
    }

    // Erreur générique → retryable par sécurité
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      retryable: true,
      originalError: error,
    };
  }

  // Erreur non-Error (string, null, etc.)
  return {
    code: 'UNKNOWN_ERROR',
    message: String(error),
    retryable: true,
    originalError: error,
  };
}

/**
 * Exécute une fonction avec politique de retry + fallback multi-modèles.
 *
 * @param modelsToTry - Chaîne de modèles à essayer (ordre de priorité)
 * @param executor - Fonction async qui prend un modelId et tente l'opération
 * @param options - Configuration de la politique
 * @returns Résultat du premier succès, ou jette la dernière erreur structurée
 */
export async function executeWithFallback<T>(
  modelsToTry: string[],
  executor: (modelId: string, attemptNumber: number) => Promise<T>,
  options: FallbackPolicyOptions = {}
): Promise<AttemptResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: AttemptError | null = null;

  for (let modelIndex = 0; modelIndex < modelsToTry.length; modelIndex++) {
    const modelId = modelsToTry[modelIndex];
    const isFallback = modelIndex > 0;
    const maxAttempts = opts.maxAttemptsPerModel(modelId, isFallback);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const data = await executor(modelId, attempt);
        return {
          success: true,
          data,
          modelUsed: modelId,
          isFallback,
        };
      } catch (err: unknown) {
        const classified = opts.classifyError(err);
        lastError = {
          success: false,
          error: classified,
          modelAttempted: modelId,
          attemptNumber: attempt,
          isFallback,
        };

        // Si erreur non-retryable, on passe au modèle suivant immédiatement
        if (!classified.retryable) {
          break;
        }

        // Sinon on attend avant de réessayer (sauf si c'était la dernière tentative)
        if (attempt < maxAttempts) {
          const delay = Math.min(
            opts.baseDelayMs * Math.pow(opts.backoffMultiplier, attempt - 1),
            opts.maxDelayMs
          );
          await sleep(delay);
        }
      }
    }
    // Si on sort de la boucle attempts, on passe au modèle suivant
  }

  // Tous les modèles ont échoué
  throw lastError;
}

/** Utilitaire sleep */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper pour créer la chaîne de fallback depuis un modelId utilisateur.
 */
export function createFallbackChain(requestedModelId: string): string[] {
  return buildFallbackChain(requestedModelId);
}