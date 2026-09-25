import { NextRequest, NextResponse } from 'next/server';
import { executeResearchPlanning, ExecutionResult } from '@/lib/agent/runner-service';
import { 
  PlanApiResponse, 
  PlanRequestPayload,
  ToolApprovalPayload,
  ContinueExecutionPayload,
  ExecutionState 
} from '@/types/agent';
import { ModelError } from '@/lib/agent/fallback-policy';
import { 
  createExecutionSession, 
  getExecutionSession, 
  approveToolCall,
  executeToolCall,
  runExecutionStep,
  isExecutionComplete,
  finalizeExecution 
} from '@/lib/agent/runner-execution-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Mappe un code d'erreur interne vers un code de statut HTTP approprié.
 */
function mapErrorToStatus(error: ModelError): number {
  switch (error.code) {
    case 'INVALID_INPUT':
    case 'INPUT_TOO_LONG':
      return 400;
    case 'MISSING_API_KEY':
    case 'AUTH_ERROR':
    case '401':
    case '403':
      return 500;
    case '429':
    case '503':
      return 503;
    case 'NETWORK_ERROR':
    case 'TIMEOUT':
      return 504;
    case 'PARSE_ERROR':
    case 'SCHEMA_VALIDATION_FAILED':
    case 'INVALID_JSON':
    case 'EMPTY_OUTPUT':
      return 502;
    default:
      return 500;
  }
}

/**
 * Génère un message utilisateur clair et actionnable selon le type d'erreur.
 */
function getUserFriendlyMessage(error: ModelError): string {
  switch (error.code) {
    case '503':
    case 'HIGH_DEMAND':
      return `Le modèle d'IA est temporairement surchargé. Le système a tenté de basculer automatiquement vers un autre modèle, sans succès. Veuillez réessayer dans quelques instants ou changer de modèle via le sélecteur.`;
    case '429':
    case 'QUOTA_EXCEEDED':
      return `Quota API dépassé. Veuillez patienter avant de relancer une recherche.`;
    case 'NETWORK_ERROR':
    case 'TIMEOUT':
      return `Problème de connexion au service d'IA. Vérifiez votre connexion et réessayez.`;
    case 'AUTH_ERROR':
    case '401':
    case '403':
      return `Erreur de configuration du service (clé API invalide). Contactez l'administrateur.`;
    case 'MISSING_API_KEY':
      return `Service non configuré : clé API manquante. Contactez l'administrateur.`;
    case 'PARSE_ERROR':
    case 'SCHEMA_VALIDATION_FAILED':
    case 'INVALID_JSON':
    case 'EMPTY_OUTPUT':
      return `L'IA a retourné une réponse invalide. Cela peut arriver lors de pics de charge. Réessayez ou changez de modèle.`;
    case 'INVALID_INPUT':
      return `Veuillez préciser un sujet de recherche valide.`;
    case 'INPUT_TOO_LONG':
      return `Votre demande est trop longue (maximum 2000 caractères).`;
    default:
      return `Erreur lors de la génération du plan : ${error.message}`;
  }
}

/**
 * POST /api/agent/plan - Génère un plan de recherche (V1) et crée une session d'exécution (V2)
 */
export async function POST(req: NextRequest): Promise<NextResponse<PlanApiResponse>> {
  try {
    const body: PlanRequestPayload = await req.json();
    const { userPrompt, model } = body;

    // Exécution via le service résilient (planification uniquement)
    const result: ExecutionResult = await executeResearchPlanning(userPrompt?.trim() || '', model);

    // V2: Créer une session d'exécution prête pour l'approbation humaine
    const executionState = createExecutionSession(result.plan, result.modelUsed);

    return NextResponse.json({
      success: true,
      data: result.plan,
      sessionId: executionState.sessionId,
      executionState,
    });
  } catch (error: unknown) {
    const modelError: ModelError = error instanceof Error
      ? { 
          code: (error as any).code || 'UNKNOWN_ERROR', 
          message: error.message, 
          retryable: false,
          originalError: error 
        }
      : (error as ModelError);

    const status = mapErrorToStatus(modelError);
    const userMessage = getUserFriendlyMessage(modelError);

    console.error('[API /api/agent/plan] Erreur :', {
      code: modelError.code,
      message: modelError.message,
      modelAttempted: (modelError as any).modelAttempted,
      retryable: modelError.retryable,
      originalError: modelError.originalError,
    });

    return NextResponse.json(
      {
        success: false,
        error: userMessage,
        errorCode: modelError.code,
        retryable: modelError.retryable,
      },
      { status }
    );
  }
}

/**
 * PUT /api/agent/plan - Approuve/rejette un appel d'outil et continue l'exécution
 */
export async function PUT(req: NextRequest): Promise<NextResponse<{ success: boolean; executionState?: ExecutionState; error?: string }>> {
  try {
    const body: ContinueExecutionPayload = await req.json();
    const { sessionId, approvals } = body;

    if (!sessionId || !approvals || !Array.isArray(approvals)) {
      return NextResponse.json(
        { success: false, error: 'Paramètres invalides: sessionId et approvals requis' },
        { status: 400 }
      );
    }

    // Appliquer chaque approbation
    for (const approval of approvals) {
      approveToolCall(sessionId, approval);
    }

    // Pour chaque outil approuvé, l'exécuter
    const state = getExecutionSession(sessionId);
    if (!state) {
      return NextResponse.json(
        { success: false, error: 'Session introuvable' },
        { status: 404 }
      );
    }

    // Exécuter les outils qui viennent d'être approuvés
    for (const approval of approvals) {
      if (approval.approved) {
        await executeToolCall(sessionId, approval.toolCallId);
      }
    }

    // Demander à l'agent la prochaine étape
    const currentState = getExecutionSession(sessionId);
    if (currentState && !isExecutionComplete(currentState)) {
      await runExecutionStep(sessionId, currentState.plan?.objective || '');
    }

    const finalState = getExecutionSession(sessionId);

    return NextResponse.json({
      success: true,
      executionState: finalState,
    });
  } catch (error: unknown) {
    console.error('[API /api/agent/plan PUT] Erreur:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent/plan?sessionId=xxx - Récupère l'état d'exécution
 */
export async function GET(req: NextRequest): Promise<NextResponse<{ success: boolean; executionState?: ExecutionState; error?: string }>> {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId requis' },
        { status: 400 }
      );
    }

    const state = getExecutionSession(sessionId);
    
    if (!state) {
      return NextResponse.json(
        { success: false, error: 'Session introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      executionState: state,
    });
  } catch (error: unknown) {
    console.error('[API /api/agent/plan GET] Erreur:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}