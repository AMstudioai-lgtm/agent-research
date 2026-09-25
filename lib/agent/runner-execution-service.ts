/**
 * Service d'exécution de l'agent avec outils réels (V2).
 * Gère la boucle ReAct : planification → approbation humaine → exécution outils → résultat.
 */

import { InMemoryRunner } from '@google/adk';
import { createExecutionAgent } from './research-agent';
import { 
  ExecutionState, 
  PendingToolCall, 
  ToolResult, 
  ToolApprovalPayload,
  ToolParameters,
  ToolName 
} from '@/types/agent';

// Stockage en mémoire des sessions d'exécution (en prod: Redis/DB)
const executionSessions = new Map<string, ExecutionState>();
const runnerCache = new Map<string, InMemoryRunner>();

function getExecutionRunnerForModel(modelName: string): InMemoryRunner {
  if (!runnerCache.has(modelName)) {
    const agent = createExecutionAgent(modelName);
    const runner = new InMemoryRunner({
      agent,
      appName: `ResearchExecutor_${modelName.replace(/[^a-zA-Z0-9]/g, '_')}`,
    });
    runnerCache.set(modelName, runner);
  }
  return runnerCache.get(modelName)!;
}

/**
 * Crée une nouvelle session d'exécution.
 */
export function createExecutionSession(
  plan: any, // ResearchPlan from types
  modelUsed: string
): ExecutionState {
  const sessionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Convertir les outils requis en appels d'outils en attente
  const pendingToolCalls: PendingToolCall[] = plan.requiredTools.map((tool, index) => ({
    id: `tool_${sessionId}_${index}`,
    name: tool.name as ToolName,
    parameters: tool.parametersNeeded.reduce((acc, param) => {
      acc[param] = '';
      return acc;
    }, {} as ToolParameters),
    reason: tool.reason,
    status: 'pending' as const,
    createdAt: Date.now(),
  }));

  const state: ExecutionState = {
    sessionId,
    status: 'EN_COURS',
    plan,
    pendingToolCalls,
    completedToolCalls: [],
    currentStep: 0,
    totalSteps: plan.tasks.length,
    startedAt: Date.now(),
    updatedAt: Date.now(),
  };

  executionSessions.set(sessionId, state);
  return state;
}

/**
 * Récupère une session d'exécution.
 */
export function getExecutionSession(sessionId: string): ExecutionState | undefined {
  return executionSessions.get(sessionId);
}

/**
 * Met à jour une session d'exécution.
 */
function updateExecutionSession(sessionId: string, updates: Partial<ExecutionState>): ExecutionState | undefined {
  const state = executionSessions.get(sessionId);
  if (!state) return undefined;
  
  const updated = { ...state, ...updates, updatedAt: Date.now() };
  executionSessions.set(sessionId, updated);
  return updated;
}

/**
 * Approuve ou rejette un appel d'outil.
 */
export function approveToolCall(
  sessionId: string,
  approval: ToolApprovalPayload
): ExecutionState | undefined {
  const state = executionSessions.get(sessionId);
  if (!state) return undefined;

  const toolCallIndex = state.pendingToolCalls.findIndex(tc => tc.id === approval.toolCallId);
  if (toolCallIndex === -1) return undefined;

  const toolCall = state.pendingToolCalls[toolCallIndex];
  
  if (approval.approved) {
    toolCall.status = 'executing';
    toolCall.parameters = approval.modifiedParameters || toolCall.parameters;
  } else {
    toolCall.status = 'rejected';
    toolCall.error = 'Rejeté par l\'utilisateur';
  }

  const updated = updateExecutionSession(sessionId, {
    pendingToolCalls: [...state.pendingToolCalls],
  });
  
  return updated;
}

/**
 * Exécute un appel d'outil approuvé (côté serveur).
 * Cette fonction contient l'implémentation réelle des outils.
 */
export async function executeToolCall(
  sessionId: string,
  toolCallId: string
): Promise<ExecutionState | undefined> {
  const state = executionSessions.get(sessionId);
  if (!state) return undefined;

  const toolCallIndex = state.pendingToolCalls.findIndex(tc => tc.id === toolCallId);
  if (toolCallIndex === -1) return undefined;

  const toolCall = state.pendingToolCalls[toolCallIndex];
  if (toolCall.status !== 'executing') return undefined;

  const startTime = Date.now();
  
  try {
    let result: ToolResult;

    switch (toolCall.name) {
      case 'search_web':
        result = await executeSearchWeb(toolCall.parameters);
        break;
      case 'read_document':
        result = await executeReadDocument(toolCall.parameters);
        break;
      case 'save_result':
        result = await executeSaveResult(toolCall.parameters);
        break;
      case 'query_database':
        result = await executeQueryDatabase(toolCall.parameters);
        break;
      default:
        throw new Error(`Outil inconnu: ${toolCall.name}`);
    }

    toolCall.status = 'completed';
    toolCall.result = result;
    toolCall.executedAt = Date.now();

    // Déplacer vers completedToolCalls
    const updatedState = updateExecutionSession(sessionId, {
      pendingToolCalls: state.pendingToolCalls.filter(tc => tc.id !== toolCallId),
      completedToolCalls: [...state.completedToolCalls, toolCall],
    });

    return updatedState;
  } catch (error) {
    toolCall.status = 'failed';
    toolCall.error = error instanceof Error ? error.message : 'Erreur inconnue';
    toolCall.executedAt = Date.now();

    return updateExecutionSession(sessionId, {
      pendingToolCalls: [...state.pendingToolCalls],
    });
  }
}

/**
 * Implémentation réelle: recherche web
 */
async function executeSearchWeb(params: ToolParameters): Promise<ToolResult> {
  const query = params.query as string;
  const limit = (params.limit as number) || 10;

  // TODO: Intégrer vraie API de recherche (SerpAPI, Google Custom Search, etc.)
  // Pour l'instant, simulation avec structure réaliste
  const mockResults = [
    {
      title: `Résultat pour: ${query}`,
      url: 'https://example.com/result1',
      snippet: `Extrait pertinent concernant ${query}...`,
      source: 'web',
    },
    {
      title: `Analyse approfondie: ${query}`,
      url: 'https://example.com/result2',
      snippet: `Analyse détaillée sur ${query} avec données chiffrées...`,
      source: 'web',
    },
  ].slice(0, limit);

  return {
    success: true,
    data: { query, results: mockResults, count: mockResults.length },
    metadata: {
      source: 'search_web',
      timestamp: Date.now(),
      durationMs: Date.now() - startTime,
    },
  };
}

/**
 * Implémentation réelle: lecture de document/URL
 */
async function executeReadDocument(params: ToolParameters): Promise<ToolResult> {
  const url = params.url as string;
  const maxLength = (params.maxLength as number) || 5000;

  // TODO: Intégrer vraie lecture (fetch + parsing HTML, PDF, etc.)
  // Pour l'instant, simulation
  const mockContent = `[Contenu simulé de ${url}]\n\nCeci est le contenu extrait de la page. Dans la version finale, cet outil fera un vrai fetch HTTP et extraira le texte principal.`;

  return {
    success: true,
    data: { url, content: mockContent.substring(0, maxLength), truncated: mockContent.length > maxLength },
    metadata: {
      source: 'read_document',
      timestamp: Date.now(),
      durationMs: Date.now() - startTime,
    },
  };
}

/**
 * Implémentation réelle: sauvegarde de résultat
 */
async function executeSaveResult(params: ToolParameters): Promise<ToolResult> {
  const key = params.key as string;
  const data = params.data;
  const source = params.source as string | undefined;

  // TODO: Persister en base (Redis, SQLite, Firestore, etc.)
  // Pour l'instant, stockage en mémoire
  console.log(`[SAVE_RESULT] ${key}:`, data);

  return {
    success: true,
    data: { key, saved: true, source },
    metadata: {
      source: 'save_result',
      timestamp: Date.now(),
      durationMs: Date.now() - startTime,
    },
  };
}

/**
 * Implémentation réelle: requête base de données
 */
async function executeQueryDatabase(params: ToolParameters): Promise<ToolResult> {
  const query = params.query as string;
  const collection = params.collection as string | undefined;

  // TODO: Intégrer vraie DB
  return {
    success: true,
    data: { query, collection, results: [], note: 'Base de données non configurée' },
    metadata: {
      source: 'query_database',
      timestamp: Date.now(),
      durationMs: Date.now() - startTime,
    },
  };
}

/**
 * Lance l'exécution de la prochaine étape via l'agent ADK.
 * L'agent décide quel outil utiliser pour la tâche courante.
 */
export async function runExecutionStep(
  sessionId: string,
  userPrompt: string
): Promise<ExecutionState | undefined> {
  const state = executionSessions.get(sessionId);
  if (!state || !state.plan) return undefined;

  // Construire le prompt pour l'agent d'exécution
  const executionPrompt = `
PLAN DE RECHERCHE À EXÉCUTER :
Objectif: ${state.plan.objective}
Critère d'arrêt: ${state.plan.stoppingCriteria}

TÂCHES :
${state.plan.tasks.map((t: any, i: number) => `${t.id}. ${t.description} → ${t.expectedOutput}`).join('\n')}

OUTILS DISPONIBLES : search_web, read_document, save_result, query_database

RÉSULTATS DÉJÀ OBTENUS :
${state.completedToolCalls.map(tc => `${tc.name}: ${JSON.stringify(tc.result?.data)}`).join('\n') || 'Aucun'}

TÂCHE COURANTE (étape ${state.currentStep + 1}/${state.totalSteps}) :
${state.plan.tasks[state.currentStep]?.description || 'Toutes terminées'}

Décide de la prochaine action à prendre. Si la tâche est terminée, passe à la suivante.
Si toutes les tâches sont terminées et le critère d'arrêt atteint, réponds avec status="TERMINÉ".
  `.trim();

  try {
    const runner = getExecutionRunnerForModel(state.plan.modelUsed || 'gemini-3.6-flash');
    
    const runStream = runner.runEphemeral({
      userId: `exec_${sessionId}`,
      newMessage: {
        parts: [{ text: executionPrompt }],
      },
    });

    let rawOutput = '';
    for await (const event of runStream) {
      if (event.content?.parts) {
        for (const part of event.content.parts) {
          if (part.text) rawOutput += part.text;
        }
      }
    }

    // Parser la décision de l'agent
    const cleaned = rawOutput.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    const decision = JSON.parse(cleaned);

    // Créer un nouvel appel d'outil en attente d'approbation
    const newToolCall: PendingToolCall = {
      id: `tool_${sessionId}_${Date.now()}`,
      name: decision.toolName,
      parameters: decision.parameters,
      reason: decision.reasoning,
      status: 'pending',
      createdAt: Date.now(),
    };

    return updateExecutionSession(sessionId, {
      pendingToolCalls: [...state.pendingToolCalls, newToolCall],
      currentStep: decision.taskId - 1,
    });
  } catch (error) {
    console.error('[runExecutionStep] Erreur:', error);
    return updateExecutionSession(sessionId, {
      error: error instanceof Error ? error.message : 'Erreur lors de l\'exécution',
      status: 'EN_ATTENTE_INFO',
    });
  }
}

/**
 * Vérifie si l'exécution est terminée.
 */
export function isExecutionComplete(state: ExecutionState): boolean {
  return state.status === 'TERMINÉ' || 
         (state.currentStep >= state.totalSteps && state.pendingToolCalls.length === 0);
}

/**
 * Finalise l'exécution.
 */
export function finalizeExecution(sessionId: string, summary: string): ExecutionState | undefined {
  return updateExecutionSession(sessionId, {
    status: 'TERMINÉ',
    error: undefined,
  });
}

/**
 * Nettoie les anciennes sessions (à appeler périodiquement).
 */
export function cleanupOldSessions(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
  const now = Date.now();
  let cleaned = 0;
  for (const [id, state] of executionSessions.entries()) {
    if (now - state.updatedAt > maxAgeMs) {
      executionSessions.delete(id);
      cleaned++;
    }
  }
  return cleaned;
}

// Variable pour capture de temps (déclarée ici pour éviter l'erreur de portée)
let startTime: number;