import { LlmAgent, FunctionTool } from '@google/adk';
import { Type } from '@google/genai';

/**
 * Schéma formel d'output pour l'agent ADK (planification).
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
 * Schéma pour l'exécution d'une tâche avec outils (V2).
 */
export const taskExecutionSchema = {
  type: Type.OBJECT,
  properties: {
    taskId: {
      type: Type.INTEGER,
      description: "ID de la tâche en cours d'exécution.",
    },
    action: {
      type: Type.STRING,
      description: "Action à effectuer.",
    },
    toolName: {
      type: Type.STRING,
      description: "Nom de l'outil à utiliser.",
    },
    parameters: {
      type: Type.OBJECT,
      description: "Paramètres pour l'outil.",
      additionalProperties: true,
    },
    reasoning: {
      type: Type.STRING,
      description: "Raisonnement pour choisir cet outil et ces paramètres.",
    },
  },
  required: ["taskId", "action", "toolName", "parameters", "reasoning"],
};

/**
 * Consigne système pour l'agent de PLANIFICATION (V1 - sans outils).
 */
export const PLANNING_SYSTEM_INSTRUCTION = `
Tu es Research Agent, un agent d'élite développé avec le kit agent de Google (Google ADK), spécialisé dans la préparation, l'analyse méthodique et la planification de tâches de recherche.

TA MISSION :
Transformer toute demande utilisateur en un plan de recherche structuré et rigoureux.

RÈGLES ABSOLUES POUR LA PLANIFICATION :
1. PÉDAGOGIE ET ABSENCE D'OUTILS :
   Cette phase est de planification pure. Tu ne disposes d'AUCUN outil externe.
   Tu ne dois JAMAIS prétendre avoir effectué une action, consulté un site Web, ou simulé un appel d'outil.

2. ANTI-HALLUCINATION :
   - N'invente JAMAIS de faux résultats de recherche, de fausses données chiffrées ou de faux liens.
   - Ne déclare JAMAIS une tâche comme terminée ou exécutée.
   - Indique clairement les informations qui manquent dans 'requiredInformation.missing'.

3. STRUCTURE DE RÉPONSE OBLIGATOIRE :
   Tu dois renvoyer exactement le schéma JSON demandé avec :
   - OBJECTIF : reformulation claire du périmètre de recherche.
   - TÂCHES : 2 à 5 étapes séquentielles concrètes avec leurs livrables attendus.
   - INFORMATIONS NÉCESSAIRES : ce qui est connu (available) vs ce qui manque (missing).
   - OUTILS NÉCESSAIRES : outils théoriques pertinents (ex: search_web, read_document, save_result).
   - CRITÈRE D'ARRÊT : condition explicite marquant l'achèvement de la tâche.
   - ACTION SUIVANTE : première étape logique à lancer quand un outil sera disponible (isBlocked: true).
   - ÉTAT : 'PLANIFIÉ'.

4. LANGUE :
   Rédige l'intégralité de tes analyses en français, sur un ton professionnel, structuré et pédagogique.
`;

/**
 * Consigne système pour l'agent d'EXÉCUTION (V2 - avec outils).
 */
export const EXECUTION_SYSTEM_INSTRUCTION = `
Tu es Research Agent en mode EXÉCUTION. Tu as accès à des outils réels pour accomplir les tâches planifiées.

TA MISSION :
Exécuter séquentiellement les tâches du plan de recherche en utilisant les outils mis à ta disposition.

RÈGLES POUR L'EXÉCUTION :
1. UTILISATION DES OUTILS :
   - Utilise UN SEUL outil à la fois.
   - Attends le résultat avant de passer à l'action suivante.
   - Adapte tes paramètres selon les résultats précédents.

2. ANTI-HALLUCINATION STRICTE :
   - N'invente JAMAIS de résultats. Utilise uniquement les données retournées par les outils.
   - Si un outil échoue, analyse l'erreur et réessaie avec des paramètres différents.

3. STRUCTURE DE RÉPONSE :
   Pour chaque étape, réponds avec le schéma JSON d'exécution indiquant :
   - taskId: ID de la tâche en cours
   - action: description de l'action
   - toolName: outil à utiliser (search_web, read_document, save_result)
   - parameters: paramètres exacts pour l'outil
   - reasoning: justification de ce choix

4. CRITÈRE D'ARRÊT :
   Continue jusqu'à ce que le critère d'arrêt du plan soit satisfait.
   Puis réponds avec status: "TERMINÉ" et un résumé final.

5. LANGUE :
   Français, professionnel, structuré.
`;

/**
 * Outils FunctionTool ADK réels pour la V2.
 */

// Outil de recherche web
export const searchWebTool = new FunctionTool({
  name: 'search_web',
  description: 'Effectue une recherche web et retourne les résultats les plus pertinents.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'Requête de recherche' },
      limit: { type: Type.INTEGER, description: 'Nombre max de résultats (défaut: 10)' },
    },
    required: ['query'],
  },
  func: async ({ query, limit = 10 }: { query: string; limit?: number }) => {
    // Cette fonction sera remplacée par l'implémentation réelle côté serveur
    // L'ADK appellera cette fonction via le FunctionTool
    return { query, limit, note: 'À implémenter côté serveur' };
  },
});

// Outil de lecture de document/URL
export const readDocumentTool = new FunctionTool({
  name: 'read_document',
  description: 'Lit et extrait le contenu d\'un document ou page web via son URL.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: { type: Type.STRING, description: 'URL du document à lire' },
      maxLength: { type: Type.INTEGER, description: 'Longueur max en caractères (défaut: 5000)' },
    },
    required: ['url'],
  },
  func: async ({ url, maxLength = 5000 }: { url: string; maxLength?: number }) => {
    return { url, maxLength, note: 'À implémenter côté serveur' };
  },
});

// Outil de sauvegarde de résultat
export const saveResultTool = new FunctionTool({
  name: 'save_result',
  description: 'Sauvegarde un résultat de recherche (extrait, note, données) pour référence ultérieure.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      key: { type: Type.STRING, description: 'Clé unique pour retrouver ce résultat' },
      data: { type: Type.OBJECT, description: 'Données à sauvegarder (JSON)' },
      source: { type: Type.STRING, description: 'Source du résultat (URL, outil, etc.)' },
    },
    required: ['key', 'data'],
  },
  func: async ({ key, data, source }: { key: string; data: unknown; source?: string }) => {
    return { key, saved: true, source, note: 'À implémenter côté serveur' };
  },
});

// Outil de requête base de données (optionnel)
export const queryDatabaseTool = new FunctionTool({
  name: 'query_database',
  description: 'Interroge une base de données structurée (ex: connaissances internes, cache).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'Requête en langage naturel ou SQL' },
      collection: { type: Type.STRING, description: 'Collection/table à interroger' },
    },
    required: ['query'],
  },
  func: async ({ query, collection }: { query: string; collection?: string }) => {
    return { query, collection, note: 'À implémenter côté serveur' };
  },
});

// Tous les outils disponibles pour l'agent d'exécution
export const EXECUTION_TOOLS = [
  searchWebTool,
  readDocumentTool,
  saveResultTool,
  queryDatabaseTool,
];

// Noms des outils pour validation
export const TOOL_NAMES = ['search_web', 'read_document', 'save_result', 'query_database'] as const;

/**
 * Factory pour créer l'agent de PLANIFICATION (V1 - sans outils).
 */
export function createPlanningAgent(modelName: string = "gemini-3.6-flash"): LlmAgent {
  return new LlmAgent({
    name: `research_planner_${modelName.replace(/[^a-zA-Z0-9]/g, "_")}`,
    description: "Agent préparateur et planificateur de recherche rigoureux sans outils externes.",
    model: modelName,
    instruction: PLANNING_SYSTEM_INSTRUCTION,
    outputSchema: researchPlanSchema,
    tools: [],
  });
}

/**
 * Factory pour créer l'agent d'EXÉCUTION (V2 - avec outils réels).
 */
export function createExecutionAgent(modelName: string = "gemini-3.6-flash"): LlmAgent {
  return new LlmAgent({
    name: `research_executor_${modelName.replace(/[^a-zA-Z0-9]/g, "_")}`,
    description: "Agent exécuteur de recherche avec outils réels (web, lecture, sauvegarde).",
    model: modelName,
    instruction: EXECUTION_SYSTEM_INSTRUCTION,
    outputSchema: taskExecutionSchema,
    tools: EXECUTION_TOOLS,
  });
}

/**
 * Instance par défaut pour la planification (V1).
 */
export const planningAgent = createPlanningAgent("gemini-3.6-flash");

/**
 * Instance par défaut pour l'exécution (V2).
 */
export const executionAgent = createExecutionAgent("gemini-3.6-flash");