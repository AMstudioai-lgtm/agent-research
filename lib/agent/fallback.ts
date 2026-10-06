import { ResearchPlan } from '@/types/agent';
import { AGENT_MODEL } from '@/lib/config/models';

/**
 * Module de secours déterministe pour générer un plan de recherche méthodique
 * lorsque l'API distante est inaccessible ou en cas d'erreur de quota.
 * Isolé dans son propre fichier pour assurer une séparation stricte des responsabilités.
 */
export function generateFallbackPlan(userPrompt: string, customReason?: string): ResearchPlan {
  const cleanPrompt = userPrompt.trim();
  const shortTopic = cleanPrompt.length > 60 ? `${cleanPrompt.slice(0, 57)}...` : cleanPrompt;
  const now = Date.now();

  return {
    objective: `Explorer, synthétiser et structurer une analyse rigoureuse de l'état de l'art 2026 autour de : "${shortTopic}".`,
    tasks: [
      {
        id: 1,
        description: `Délimiter le périmètre d'analyse et répertorier l'état de l'art et les publications de référence (2025-2026) sur "${shortTopic}".`,
        expectedOutput: `Cartographie préliminaire des sources primaires et acteurs clés identifiés.`,
        isCompleted: false,
      },
      {
        id: 2,
        description: `Extraire les données factuelles consolidées, métriques récentes (2025-2026) et benchmarks comparatifs.`,
        expectedOutput: `Matrice de synthèse comparative des données et retours d'expérience récents.`,
        isCompleted: false,
      },
      {
        id: 3,
        description: `Confronter les points de vue critiques, limites opérationnelles et verrous technologiques majeurs en 2026.`,
        expectedOutput: `Analyse des biais, incertitudes et verrous majeurs du domaine en 2026.`,
        isCompleted: false,
      },
      {
        id: 4,
        description: `Formuler les conclusions de synthèse, perspectives d'évolution 2026 et livrable d'orientation stratégique.`,
        expectedOutput: `Livrable d'orientation stratégique complet, synthétique et opérationnel.`,
        isCompleted: false,
      },
    ],
    thoughts: [
      {
        id: `th_1_${now}`,
        timestamp: now,
        category: 'REASONING',
        phase: 'Cadrage temporel & intention 2026',
        content: `Nous sommes en 2026. J'analyse la question de l'utilisateur : "${cleanPrompt}". Le sujet exige une approche méthodique ancrée sur l'état de l'art le plus récent (2025-2026), combinant sources primaires, comparatifs et analyse d'impact.`,
      },
      {
        id: `th_2_${now}`,
        timestamp: now + 120,
        category: 'SEARCH',
        phase: 'Stratégie documentaire 2025-2026',
        content: `Pour couvrir le sujet sans biais, je cible les publications 2025-2026, les rapports techniques et les observatoires de référence via l'outil search_web en écartant les données antérieures obsolètes.`,
      },
      {
        id: `th_3_${now}`,
        timestamp: now + 240,
        category: 'ANALYSIS',
        phase: 'Filtrage de crédibilité et métriques',
        content: `Je dois isoler les métriques vérifiables consolidées en 2025-2026 et éliminer les annonces marketing ou spéculatives en exigeant une corroboration par au moins deux sources indépendantes.`,
      },
      {
        id: `th_4_${now}`,
        timestamp: now + 360,
        category: 'DECISION',
        phase: 'Orchestration des étapes 2026',
        content: `Le plan est structuré en 4 jalons logiques alignés sur les exigences de recherche 2026. Dès validation par l'utilisateur, j'activerai search_web pour débuter l'indexation factuelle.`,
      },
    ],
    requiredInformation: {
      available: [
        `Intention de recherche formulée par l'utilisateur : "${cleanPrompt}"`,
        `Périmètre initial thématique défini pour l'investigation 2026`,
      ],
      missing: [
        `Données chiffrées récentes et indicateurs empiriques consolidés pour la période 2025-2026`,
        `Rapports sectoriels récents (2025-2026) et benchmarks industriels tiers`,
        `Critères de priorité spécifiques ou contraintes opérationnelles de l'utilisateur`,
      ],
    },
    requiredTools: [
      {
        name: 'search_web',
        reason: `Indispensable pour requêter les sources ouvertes, articles scientifiques et actualités récentes (2025-2026) sur "${shortTopic}".`,
        parametersNeeded: ['query', 'limit'],
      },
      {
        name: 'read_document',
        reason: `Nécessaire pour extraire le texte intégral, synthèses et métriques des publications et rapports identifiés.`,
        parametersNeeded: ['urlOrId', 'topicFocus'],
      },
      {
        name: 'save_result',
        reason: `Requis pour consigner les extraits fiables et conclusions vérifiées dans le dossier de recherche.`,
        parametersNeeded: ['topic', 'content'],
      },
    ],
    stoppingCriteria: `La recherche s'achève dès qu'au moins 3 sources indépendantes récentes (2025-2026) corroborent les données clés et que les questions du périmètre ont une réponse documentée conforme à l'état de l'art 2026.`,
    nextAction: {
      action: `Exécuter la recherche documentaire 2026 sur search_web : "${cleanPrompt.slice(0, 45)}"`,
      targetTool: 'search_web',
      parameters: {
        query: cleanPrompt,
        limit: 4,
      },
      isBlocked: false,
      blockReason: "Outil prêt pour exécution automatique dans le cadre temporel 2026.",
    },
    status: 'PLANIFIÉ',
    modelUsed: `${AGENT_MODEL} (Mode Résilience)`,
    fallbackNotice: customReason || `Note : Plan généré en mode résilience déterministe (Ancrage temporel 2026) avec le modèle ${AGENT_MODEL}.`,
  };
}
