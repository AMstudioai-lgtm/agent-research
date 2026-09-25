import { LlmAgent } from '@google/adk';
import { Type } from '@google/genai';

/**
 * Schéma formel d'output pour l'agent ADK.
 * Force Gemini à structurer sa réponse selon les 6 composantes demandées.
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
      description: "Catalogue théorique des outils qui seraient requis si des outils étaient disponibles.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "Nom technique de l'outil (ex: search_web, read_document, save_result, query_database).",
          },
          reason: {
            type: Type.STRING,
            description: "Justification claire de pourquoi cet outil est indispensable.",
          },
          parametersNeeded: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Paramètres obligatoires à fournir à cet outil (ex: query, url, limit).",
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
      description: "La toute première action logique à entreprendre dès qu'un outil sera connecté.",
      properties: {
        action: {
          type: Type.STRING,
          description: "Description de la première action à réaliser.",
        },
        targetTool: {
          type: Type.STRING,
          description: "Nom de l'outil requis pour cette première action.",
        },
        isBlocked: {
          type: Type.BOOLEAN,
          description: "Toujours true en V1 car aucun outil n'est connecté.",
        },
        blockReason: {
          type: Type.STRING,
          description: "Explication pédagogique de pourquoi l'action est en attente (aucun outil connecté en V1).",
        },
      },
      required: ["action", "targetTool", "isBlocked"],
    },
    status: {
      type: Type.STRING,
      enum: ["PLANIFIÉ"],
      description: "Statut formel de l'agent. Doit TOUJOURS être 'PLANIFIÉ' en V1.",
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

/**
 * Consigne système stricte pour l'agent de recherche.
 * Verrouille tout comportement d'hallucination ou de fausse exécution.
 */
const SYSTEM_INSTRUCTION = `
Tu es Research Agent, un agent d'élite développé avec le kit agent de Google (Google ADK), spécialisé dans la préparation, l'analyse méthodique et la planification de tâches de recherche.

TA MISSION :
Transformer toute demande utilisateur en un plan de recherche structuré et rigoureux.

RÈGLES ABSOLUES ET SANS EXCEPTION POUR CETTE V1 :
1. PÉDAGOGIE ET ABSENCE D'OUTILS :
   Cette première version est pédagogique. Tu ne disposes d'AUCUN outil externe (pas d'accès Web, pas de moteur de recherche, pas de base de données, pas d'envoi d'e-mail).
   Tu ne dois JAMAIS prétendre avoir effectué une action, consulté un site Web, ou simulé un appel d'outil.

2. ANTI-HALLUCINATION :
   - N'invente JAMAIS de faux résultats de recherche, de fausses données chiffrées ou de faux liens.
   - Ne déclare JAMAIS une tâche comme terminée ou exécutée.
   - Indique clairement et sans hésitation les informations qui manquent dans le tableau 'requiredInformation.missing'.

3. STRUCTURE DE RÉPONSE OBLIGATOIRE :
   Tu dois renvoyer exactement le schéma JSON demandé avec :
   - OBJECTIF : reformulation claire du périmètre de recherche.
   - TÂCHES : 2 à 5 étapes séquentielles concrètes avec leurs livrables attendus.
   - INFORMATIONS NÉCESSAIRES : ce qui est connu (available) vs ce qui manque (missing).
   - OUTILS NÉCESSAIRES : outils théoriques pertinents (ex: search_web, read_document, save_result).
   - CRITÈRE D'ARRÊT : condition explicite marquant l'achèvement de la tâche.
   - ACTION SUIVANTE : première étape logique à lancer quand un outil sera disponible (avec isBlocked: true et blockReason explicite).
   - ÉTAT : 'PLANIFIÉ'.

4. LANGUE :
   Rédige l'intégralité de tes analyses en français, sur un ton professionnel, structuré et pédagogique.
`;

/**
 * Factory pour créer une instance de l'agent au standard Google ADK avec le modèle choisi.
 * L'argument 'tools' est intentionnellement un tableau vide [] en V1 pour éviter toute fausse exécution.
 */
export function createResearchAgent(modelName: string = "gemini-3.6-flash"): LlmAgent {
  return new LlmAgent({
    name: `research_agent_${modelName.replace(/[^a-zA-Z0-9]/g, "_")}`,
    description: "Agent préparateur et planificateur de recherche rigoureux sans outils externes.",
    model: modelName,
    instruction: SYSTEM_INSTRUCTION,
    outputSchema: researchPlanSchema,
    tools: [], // Aucun outil externe n'est déclaré en V1
  });
}

/**
 * Instance par défaut
 */
export const researchAgent = createResearchAgent("gemini-3.6-flash");
