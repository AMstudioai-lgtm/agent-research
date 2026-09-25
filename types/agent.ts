// Statuts de l'agent dans son cycle de vie (V1: PLANIFIÉ, V2+: EN_COURS, EN_ATTENTE_INFO, TERMINÉ)
export type AgentStatus = 'PLANIFIÉ' | 'EN_COURS' | 'EN_ATTENTE_INFO' | 'TERMINÉ';

// Tâche individuelle séquentielle identifiée par l'agent
export interface PlannedTask {
  id: number;
  description: string;
  expectedOutput: string;
}

// Outil théorique requis pour accomplir une partie de la recherche
export interface RequiredTool {
  name: string;
  reason: string;
  parametersNeeded: string[];
}

// Analyse des informations nécessaires (connues vs manquantes)
export interface RequiredInformation {
  available: string[];
  missing: string[];
}

// Prochaine action logique que l'agent exécuterait si un outil était disponible
export interface NextAction {
  action: string;
  targetTool: string;
  isBlocked: boolean;
  blockReason?: string;
}

// Plan de recherche complet et structuré généré par le LlmAgent Google ADK
export interface ResearchPlan {
  // 1. Demande originale & Objectif clarifié
  objective: string;
  // 2. Plan découpé en tâches
  tasks: PlannedTask[];
  // 3. Informations nécessaires (disponibles et manquantes)
  requiredInformation: RequiredInformation;
  // 4. Outils nécessaires identifiés
  requiredTools: RequiredTool[];
  // 5. Critère d'arrêt objectif
  stoppingCriteria: string;
  // 6. Action suivante immédiate
  nextAction: NextAction;
  // 7. État officiel de l'agent
  status: AgentStatus;
  // Modèle d'IA utilisé
  modelUsed?: string;
  // Notification facultative si un basculement de modèle a été nécessaire en cas de forte demande
  fallbackNotice?: string;
}

// ==================== V2: Outils réels & Human-in-the-loop ====================

// Outils disponibles pour l'agent
export type ToolName = 'search_web' | 'read_document' | 'save_result' | 'query_database';

// Paramètres d'un appel d'outil
export interface ToolParameters {
  query?: string;
  url?: string;
  limit?: number;
  key?: string;
  data?: unknown;
  [key: string]: unknown;
}

// Appel d'outil en attente d'approbation
export interface PendingToolCall {
  id: string;
  name: ToolName;
  parameters: ToolParameters;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'executing' | 'completed' | 'failed';
  result?: ToolResult;
  error?: string;
  createdAt: number;
  executedAt?: number;
}

// Résultat d'exécution d'un outil
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: {
    source?: string;
    timestamp: number;
    durationMs: number;
  };
}

// Événement d'exécution pour le streaming
export interface ExecutionEvent {
  type: 'plan' | 'tool_call' | 'tool_result' | 'status_change' | 'error' | 'complete';
  timestamp: number;
  data: unknown;
}

// État d'exécution complet (pour polling/streaming)
export interface ExecutionState {
  sessionId: string;
  status: AgentStatus;
  plan?: ResearchPlan;
  pendingToolCalls: PendingToolCall[];
  completedToolCalls: PendingToolCall[];
  currentStep: number;
  totalSteps: number;
  error?: string;
  startedAt: number;
  updatedAt: number;
}

// Payload pour approuver/rejeter un outil
export interface ToolApprovalPayload {
  toolCallId: string;
  approved: boolean;
  modifiedParameters?: ToolParameters;
}

// Payload envoyé par le client à l'API
export interface PlanRequestPayload {
  userPrompt: string;
  model?: string;
}

// Payload pour continuer l'exécution après approbation
export interface ContinueExecutionPayload {
  sessionId: string;
  approvals: ToolApprovalPayload[];
}

// Conversation persistée pour l'historique dans le menu burger
export interface ConversationItem {
  id: string;
  title: string;
  userPrompt: string;
  model: string;
  plan: ResearchPlan;
  createdAt: number;
  // V2: État d'exécution complet
  executionState?: ExecutionState;
}

// Réponse renvoyée par l'API interne
export interface PlanApiResponse {
  success: boolean;
  data?: ResearchPlan;
  error?: string;
  errorCode?: string;
  retryable?: boolean;
  // V2: Session ID pour continuer l'exécution
  sessionId?: string;
  // V2: État initial d'exécution
  executionState?: ExecutionState;
}