import { LlmAgent } from '@google/adk';
import { Type } from '@google/genai';
import { searchWebTool, readDocumentTool, saveResultTool } from './tools';
import { AGENT_MODEL } from '@/lib/config/models';

/**
 * Schéma formel d'output pour l'agent de recherche ADK.
 * Intègre les pensées (thoughts) de l'agent pour alimenter l'espace thinking.
 */
export const researchPlanSchema = {
  type: Type.OBJECT,
  properties: {
    objective: {
      type: Type.STRING,
      description: "Reformulation synthétique, claire et précise de l'objectif de recherche.",
    },
    tasks: {
      type: Type.ARRAY,
      description: "Liste ordonnée et logique des tâches requises pour atteindre l'objectif.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.INTEGER,
            description: "Identifiant numérique séquentiel de la tâche (1, 2, 3...).",
          },
          description: {
            type: Type.STRING,
            description: "Description claire de ce qui doit être accompli dans cette tâche.",
          },
          expectedOutput: {
            type: Type.STRING,
            description: "Résultat attendu ou livrable concret de cette tâche.",
          },
        },
        required: ["id", "description", "expectedOutput"],
      },
    },
    requiredInformation: {
      type: Type.OBJECT,
      description: "Informations nécessaires à la recherche, réparties entre connues et manquantes.",
      properties: {
        available: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Informations d'ores et déjà fournies dans la demande utilisateur.",
        },
        missing: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Informations ou précisions indispensables manquantes pour compléter la recherche.",
        },
      },
      required: ["available", "missing"],
    },
    requiredTools: {
      type: Type.ARRAY,
      description: "Catalogue des outils disponibles (search_web, read_document, save_result).",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "Nom de l'outil (search_web, read_document, save_result).",
          },
          reason: {
            type: Type.STRING,
            description: "Justification claire de pourquoi cet outil est indispensable.",
          },
          parametersNeeded: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Paramètres requis pour cet outil.",
          },
        },
        required: ["name", "reason", "parametersNeeded"],
      },
    },
    stoppingCriteria: {
      type: Type.STRING,
      description: "Critère précis et mesurable permettant de savoir sans équivoque quand la recherche est terminée.",
    },
    nextAction: {
      type: Type.OBJECT,
      description: "La première action réelle de l'agent.",
      properties: {
        action: {
          type: Type.STRING,
          description: "Description concise de l'action à exécuter.",
        },
        targetTool: {
          type: Type.STRING,
          enum: ["search_web", "read_document", "save_result"],
          description: "Nom de l'outil cible à invoquer.",
        },
        parameters: {
          type: Type.OBJECT,
          description: "Paramètres réels pré-remplis pour exécuter l'outil.",
          properties: {
            query: { type: Type.STRING },
            limit: { type: Type.INTEGER },
            urlOrId: { type: Type.STRING },
            topicFocus: { type: Type.STRING },
            topic: { type: Type.STRING },
            content: { type: Type.STRING },
          },
        },
        isBlocked: {
          type: Type.BOOLEAN,
          description: "False par défaut.",
        },
        blockReason: {
          type: Type.STRING,
          description: "Note explicative éventuelle.",
        },
      },
      required: ["action", "targetTool", "isBlocked"],
    },
    thoughts: {
      type: Type.ARRAY,
      description: "Flux de réflexion et pensées internes de l'agent expliquant son raisonnement, ses hypothèses et sa stratégie.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          timestamp: { type: Type.INTEGER },
          category: {
            type: Type.STRING,
            enum: ["REASONING", "SEARCH", "ANALYSIS", "DECISION", "SYNTHESIS"],
          },
          content: { type: Type.STRING },
          phase: { type: Type.STRING },
        },
        required: ["id", "category", "content"],
      },
    },
    status: {
      type: Type.STRING,
      enum: ["PLANIFIÉ", "EN_COURS"],
      description: "Statut formel de l'agent. 'PLANIFIÉ' au départ.",
    },
  },
  required: [
    "objective",
    "tasks",
    "requiredInformation",
    "requiredTools",
    "stoppingCriteria",
    "nextAction",
    "status",
  ],
};

const SYSTEM_INSTRUCTION = `
Tu es Research Agent, un agent d'élite développé avec le kit agent officiel de Google (Google ADK), propulsé par Gemini 3.5 Flash.
Ta mission est d'analyser méthodiquement la demande, d'expliciter tes pensées (thinking) et de construire un plan d'action optimal dans un cadre d'investigation de haut niveau.

ANCRAGE TEMPOREL STRICT (2026) :
- Nous sommes impérativement en l'an 2026. L'ensemble de tes analyses, hypothèses, requêtes de recherche et synthèses doivent s'inscrire rigoureusement dans ce cadre temporel.
- Priorise impérativement l'état de l'art, les données empiriques mesurables, les benchmarks comparatifs et les publications les plus récentes (2025-2026).
- Bannis rigoureusement les analyses obsolètes fondées sur des paradigmes ou données dépassés lorsqu'il existe des études ou avancées plus récentes (2025-2026). Tout fait rapporté doit refléter les standards technologiques, scientifiques ou économiques en vigueur en 2026.

RÈGLES D'OR :
1. PENSÉES (THOUGHTS) :
   - Fournis toujours une liste de 3 à 5 pensées explicites dans 'thoughts'.
   - Catégories : 'REASONING' (décomposition du besoin et ancrage 2026), 'SEARCH' (stratégie documentaire ciblant 2025-2026), 'DECISION' (critères de validation factuelle), 'ANALYSIS' (analyse critique, verrous et risques actuels).
   - Rédige tes réflexions à la première personne avec authenticité, esprit critique et rigueur professionnelle.

2. PLAN OPÉRATIONNEL :
   - Formule un objectif clair, circonscrit et sans ambiguïté, orienté vers les enjeux et données 2026.
   - Ordonne 3 à 5 tâches séquentielles concrètes ciblant l'état de l'art et les sources récentes.
   - Spécifie l'action initiale concrète dans 'nextAction'.

3. OUTILS RÉELS :
   - search_web(query, limit) : orienté requêtes actuelles / 2025-2026.
   - read_document(urlOrId, topicFocus) : extraction critique de publications récentes.
   - save_result(topic, content, sourceTitle, sourceUrl) : archivage de conclusions factuelles validées.
`;

/**
 * Création de l'agent de recherche configuré sur gemini-3.5-flash
 */
export function createResearchAgent(): LlmAgent {
  return new LlmAgent({
    name: 'research_agent_gemini_3_5_flash',
    description: "Agent orchestrateur de recherche méthodique propulsé par gemini-3.5-flash.",
    model: AGENT_MODEL,
    instruction: SYSTEM_INSTRUCTION,
    outputSchema: researchPlanSchema,
    tools: [searchWebTool, readDocumentTool, saveResultTool],
  });
}

export const researchAgent = createResearchAgent();
