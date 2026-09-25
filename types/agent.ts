// Statuts de l'agent dans son cycle de vie (toujours "PLANIFIÉ" en V1)
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

// Payload envoyé par le client à l'API
export interface PlanRequestPayload {
  userPrompt: string;
  model?: string;
}

// Conversation persistée pour l'historique dans le menu burger
export interface ConversationItem {
  id: string;
  title: string;
  userPrompt: string;
  model: string;
  plan: ResearchPlan;
  createdAt: number;
}

// Réponse renvoyée par l'API interne
export interface PlanApiResponse {
  success: boolean;
  data?: ResearchPlan;
  error?: string;
  errorCode?: string;
  retryable?: boolean;
}
