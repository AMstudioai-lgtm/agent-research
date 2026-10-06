import { InMemoryRunner } from '@google/adk';
import { researchAgent } from './research-agent';
import { generateFallbackPlan } from './fallback';
import { ResearchPlan } from '@/types/agent';
import { AGENT_MODEL } from '@/lib/config/models';

// Instance unique de l'InMemoryRunner pour gemini-3.5-flash
let runnerInstance: InMemoryRunner | null = null;

function getRunner(): InMemoryRunner {
  if (!runnerInstance) {
    runnerInstance = new InMemoryRunner({
      agent: researchAgent,
      appName: 'research_agent_gemini_3_5_flash_app',
    });
  }
  return runnerInstance;
}

/**
 * Exécute une session de planification agentique via le Google ADK avec Gemini 3.5 Flash.
 * Récupère le plan et le flux de réflexion (thoughts).
 */
export async function executeResearchPlanning(userPrompt: string): Promise<ResearchPlan> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[Runner] Clé GEMINI_API_KEY absente, utilisation du mode de secours.');
    return generateFallbackPlan(userPrompt, 'Clé API GEMINI_API_KEY non configurée.');
  }

  const runner = getRunner();

  try {
    const runStream = runner.runEphemeral({
      userId: `user_${Date.now()}`,
      newMessage: {
        parts: [{ text: userPrompt }],
      },
    });

    let rawOutput = '';
    let errorMessage = '';

    for await (const event of runStream) {
      if (event.errorMessage) {
        errorMessage = event.errorMessage;
      }

      if (event.content?.parts) {
        for (const part of event.content.parts) {
          if (part.text) {
            rawOutput += part.text;
          }
        }
      }
    }

    if (errorMessage && !rawOutput.trim()) {
      console.warn(`[Runner ADK - ${AGENT_MODEL}] Erreur signalée par l'agent :`, errorMessage);
      return generateFallbackPlan(userPrompt, `Signalé par ${AGENT_MODEL} : ${errorMessage}`);
    }

    if (!rawOutput.trim()) {
      console.warn(`[Runner ADK - ${AGENT_MODEL}] Réponse brute vide, utilisation du repli.`);
      return generateFallbackPlan(userPrompt);
    }

    // Nettoyage Markdown éventuel
    let cleanedJson = rawOutput.trim();
    if (cleanedJson.startsWith('```')) {
      cleanedJson = cleanedJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed: ResearchPlan = JSON.parse(cleanedJson);

    // Normalisation des états initiaux
    parsed.status = 'PLANIFIÉ';
    parsed.modelUsed = AGENT_MODEL;

    // S'assurer que les pensées existent
    if (!parsed.thoughts || parsed.thoughts.length === 0) {
      const fallback = generateFallbackPlan(userPrompt);
      parsed.thoughts = fallback.thoughts;
    }

    // Sécurisation de l'action suivante
    if (!parsed.nextAction) {
      parsed.nextAction = {
        action: `Lancer la recherche documentaire sur : "${userPrompt.slice(0, 40)}"`,
        targetTool: 'search_web',
        parameters: { query: userPrompt, limit: 4 },
        isBlocked: false,
        blockReason: "Outil prêt pour exécution automatique.",
      };
    } else {
      parsed.nextAction.isBlocked = false;
      if (!parsed.nextAction.parameters) {
        parsed.nextAction.parameters = { query: userPrompt, limit: 4 };
      }
    }

    return parsed;
  } catch (error: unknown) {
    const errText = error instanceof Error ? error.message : String(error);
    console.warn(`[Runner ADK - ${AGENT_MODEL}] Échec d'exécution, repli vers le plan de secours :`, errText);
    return generateFallbackPlan(userPrompt, `Erreur d'exécution : ${errText}`);
  }
}
