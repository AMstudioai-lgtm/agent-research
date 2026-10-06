/**
 * Configuration unique du modèle pour l'agent de recherche.
 * Modèle unique et exclusif : gemini-3.5-flash (aucun switch ni sélecteur).
 */

export const AGENT_MODEL = 'gemini-3.5-flash';

export const AGENT_MODEL_INFO = {
  id: AGENT_MODEL,
  name: 'Gemini 3.5 Flash',
  version: '3.5',
  badge: 'Modèle Actif',
  badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  description: 'Modèle d’orchestration rapide, précis et économique pour la planification agentique.',
};
