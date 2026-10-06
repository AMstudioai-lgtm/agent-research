// Types stricts et propres pour le Research Agent (Google ADK)

export type AgentStatus = 'PLANIFIÉ' | 'EN_COURS' | 'EN_ATTENTE_INFO' | 'TERMINÉ';

// Pensée ou réflexion unitaire de l'agent au cours de son processus
export interface AgentThought {
  id: string;
  timestamp: number;
  category: 'REASONING' | 'SEARCH' | 'ANALYSIS' | 'DECISION' | 'SYNTHESIS';
  content: string;
  phase?: string;
}

// Tâche individuelle séquentielle identifiée par l'agent
export interface PlannedTask {
  id: number;
  description: string;
  expectedOutput: string;
  isCompleted?: boolean;
  executionResult?: string;
}

// Outil requis pour accomplir une partie de la recherche
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

// Prochaine action logique à exécuter
export interface NextAction {
  action: string;
  targetTool: 'search_web' | 'read_document' | 'save_result' | string;
  parameters?: Record<string, unknown>;
  isBlocked: boolean;
  blockReason?: string;
}

// Résultat d'exécution d'un outil
export interface ToolExecutionOutput {
  toolName: string;
  timestamp: number;
  inputParams: Record<string, unknown>;
  status: 'SUCCESS' | 'ERROR';
  data: unknown;
  summary: string;
  error?: string;
}

// Note enregistrée dans le carnet de recherche
export interface SavedResearchNote {
  id: string;
  topic: string;
  sourceUrl?: string;
  sourceTitle?: string;
  content: string;
  savedAt: number;
}

// Plan de recherche complet et structuré
export interface ResearchPlan {
  objective: string;
  tasks: PlannedTask[];
  requiredInformation: RequiredInformation;
  requiredTools: RequiredTool[];
  stoppingCriteria: string;
  nextAction: NextAction;
  status: AgentStatus;
  modelUsed?: string;
  thoughts?: AgentThought[];
  executionHistory?: ToolExecutionOutput[];
  savedNotes?: SavedResearchNote[];
  answer?: string;
  fallbackNotice?: string;
}

// Payload pour générer le plan
export interface PlanRequestPayload {
  userPrompt: string;
}

// Payload pour exécuter un outil
export interface ExecuteToolPayload {
  toolName: 'search_web' | 'read_document' | 'save_result' | string;
  parameters: Record<string, unknown>;
  taskId?: number;
}

// Payload pour générer la réponse textuelle
export interface GenerateAnswerPayload {
  userPrompt: string;
  objective: string;
  contextData?: string;
}

// Conversation persistée pour l'historique
export interface ConversationItem {
  id: string;
  title: string;
  userPrompt: string;
  model: string;
  plan: ResearchPlan;
  createdAt: number;
}

// Réponse renvoyée par l'API de planification
export interface PlanApiResponse {
  success: boolean;
  data?: ResearchPlan;
  error?: string;
}

// Réponse renvoyée par l'API d'exécution d'outil
export interface ExecuteToolApiResponse {
  success: boolean;
  data?: ToolExecutionOutput;
  error?: string;
}

// Réponse renvoyée par l'API de réponse textuelle
export interface AnswerApiResponse {
  success: boolean;
  answer?: string;
  error?: string;
}
