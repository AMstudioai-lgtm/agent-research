/**
 * Configuration centralisée des modèles Gemini Flash supportés.
 * Source unique de vérité pour tout l'application.
 */

export interface ModelConfig {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  recommended?: boolean;
}

/**
 * Liste canonique des modèles supportés.
 * Ordre = priorité par défaut (le premier est le défaut global).
 */
export const SUPPORTED_MODELS: ModelConfig[] = [
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    badge: 'Recommandé',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Stable, rapide et hautement équilibré pour la planification.',
    recommended: true,
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    badge: 'Léger & Réactif',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Idéal pour une réponse immédiate et économique.',
  },
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    badge: 'Intermédiaire',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Version intermédiaire polyvalente.',
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    badge: 'Auto-routé',
    badgeColor: 'bg-stone-100 text-stone-800 border-stone-200',
    description: 'Alias optimisé dynamiquement par Google Cloud.',
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    badge: 'Dernière génération',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Capacités avancées (peut être sujet à forte demande ponctuelle).',
  },
];

/** ID du modèle par défaut (premier de la liste) */
export const DEFAULT_MODEL_ID = SUPPORTED_MODELS[0].id;

/** Set des IDs valides pour validation rapide */
export const VALID_MODEL_IDS = new Set(SUPPORTED_MODELS.map((m) => m.id));

/**
 * Retourne la config d'un modèle ou undefined si invalide.
 */
export function getModelConfig(modelId: string): ModelConfig | undefined {
  return SUPPORTED_MODELS.find((m) => m.id === modelId);
}

/**
 * Normalise un modelId utilisateur vers un ID valide.
 * Retourne le défaut si invalide ou non fourni.
 */
export function normalizeModelId(modelId?: string): string {
  if (!modelId) return DEFAULT_MODEL_ID;
  return VALID_MODEL_IDS.has(modelId) ? modelId : DEFAULT_MODEL_ID;
}

/**
 * Ordre de fallback intelligent :
 * 1. Modèle demandé (si valide)
 * 2. Modèle par défaut (si différent du demandé)
 * 3. Alias auto-routé (gemini-flash-latest)
 * 4. Autres modèles stables par ordre de préférence
 * 5. Modèles "risqués" (3.8) en dernier recours
 */
export function buildFallbackChain(requestedModelId: string): string[] {
  const normalized = normalizeModelId(requestedModelId);
  const chain: string[] = [normalized];

  // Ajouter le défaut s'il est différent
  if (DEFAULT_MODEL_ID !== normalized) {
    chain.push(DEFAULT_MODEL_ID);
  }

  // Ordre de fallback prédéfini (sans doublons)
  const fallbackOrder = [
    'gemini-flash-latest',
    'gemini-3.5-flash',
    'gemini-3.7-flash',
    'gemini-3.8-flash',
  ];

  for (const m of fallbackOrder) {
    if (!chain.includes(m)) {
      chain.push(m);
    }
  }

  return chain;
}