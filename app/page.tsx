'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ResearchPlan,
  PlanApiResponse,
  ConversationItem,
  ExecuteToolApiResponse,
  ToolExecutionOutput,
  AnswerApiResponse,
} from '@/types/agent';
import { AGENT_MODEL } from '@/lib/config/models';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { UserMessage } from '@/components/UserMessage';
import { AgentThinking } from '@/components/AgentThinking';
import { ResponseSpace } from '@/components/ResponseSpace';
import { BottomInput } from '@/components/BottomInput';
import { AlertCircle } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'adk_research_conversations_v2';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<ResearchPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  // État de l'exécution automatique de la recherche
  const [isRunning, setIsRunning] = useState(false);
  const [executionHistory, setExecutionHistory] = useState<ToolExecutionOutput[]>([]);
  const [toolError, setToolError] = useState<string | null>(null);

  // État du tiroir latéral d'historique
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Charger le localStorage côté client
  useEffect(() => {
    const handleInit = () => {
      try {
        const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          setConversations(JSON.parse(stored));
        }
      } catch {
        // Ignore
      }
    };
    const timer = setTimeout(handleInit, 0);
    return () => clearTimeout(timer);
  }, []);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading || isRunning) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [loading, isRunning]);

  // Sauvegarde des conversations dans le localStorage
  const saveConversation = (promptText: string, currentPlan: ResearchPlan) => {
    const newConv: ConversationItem = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: promptText.length > 40 ? `${promptText.substring(0, 40)}...` : promptText,
      userPrompt: promptText,
      model: AGENT_MODEL,
      plan: currentPlan,
      createdAt: Date.now(),
    };

    setConversations((prev) => {
      const updated = [newConv, ...prev.filter((c) => c.userPrompt !== promptText)].slice(0, 30);
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
    setActiveConversationId(newConv.id);
  };

  // Suppression d'une conversation
  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = conversations.filter((c) => c.id !== id);
    setConversations(filtered);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    } catch {
      // Ignore
    }
    if (activeConversationId === id) {
      handleNewConversation();
    }
  };

  // Vider tout l'historique
  const handleClearAllConversations = () => {
    setConversations([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // Ignore
    }
    handleNewConversation();
  };

  // Sélection d'une conversation dans le drawer
  const handleSelectConversation = (conv: ConversationItem) => {
    setActiveConversationId(conv.id);
    setActivePrompt(conv.userPrompt);
    setQuery(conv.userPrompt);
    setPlan(conv.plan);
    setExecutionHistory(conv.plan.executionHistory || []);
    setError(null);
    setToolError(null);
    setIsSidebarOpen(false);
  };

  // Réinitialiser vers une nouvelle recherche
  const handleNewConversation = () => {
    setActiveConversationId(null);
    setActivePrompt(null);
    setQuery('');
    setPlan(null);
    setExecutionHistory([]);
    setError(null);
    setToolError(null);
    setIsSidebarOpen(false);
  };

  // 1. Soumission : entrée du message et création du plan
  const handleGeneratePlan = async (promptToUse?: string) => {
    const textToSubmit = (promptToUse ?? query).trim();
    if (!textToSubmit) return;

    setActivePrompt(textToSubmit);
    if (promptToUse) {
      setQuery(promptToUse);
    }

    setLoading(true);
    setError(null);
    setToolError(null);
    setExecutionHistory([]);

    try {
      const response = await fetch('/api/agent/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPrompt: textToSubmit }),
      });

      const result: PlanApiResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || "Une erreur est survenue lors de la structuration de l'agent.");
      }

      setPlan(result.data);
      saveConversation(textToSubmit, result.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de communication avec l'agent.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // 2. Modification manuelle du plan par l'utilisateur
  const handleUpdatePlan = (updatedPlan: ResearchPlan) => {
    setPlan(updatedPlan);
    if (activePrompt) {
      saveConversation(activePrompt, updatedPlan);
    }
  };

  // 3. Validation du plan : recherche et génération de la réponse textuelle
  const handleValidateAndRun = async (planToExecute?: ResearchPlan) => {
    const currentPlan = planToExecute || plan;
    if (!currentPlan || !activePrompt) return;

    setIsRunning(true);
    setToolError(null);

    try {
      // Étape 1 : Recherche documentaire automatique (search_web)
      const searchRes = await fetch('/api/agent/execute-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: 'search_web',
          parameters: { query: currentPlan.objective, limit: 4 },
        }),
      });

      const searchOutput: ExecuteToolApiResponse = await searchRes.json();
      if (!searchRes.ok || !searchOutput.success || !searchOutput.data) {
        throw new Error(searchOutput.error || "Erreur lors de la recherche web.");
      }

      const historyAfterSearch = [searchOutput.data, ...executionHistory];
      setExecutionHistory(historyAfterSearch);

      // Traitement des données extraites pour le contexte
      const searchData = searchOutput.data.data as {
        results?: Array<{ title: string; url: string; snippet: string; source: string }>;
      };

      const extractedSnippets = searchData?.results
        ? searchData.results.map((r) => `- [${r.title}] (${r.source}) : ${r.snippet}`).join('\n')
        : searchOutput.data.summary;

      // Étape 2 : Lecture / extraction du document clé (read_document)
      const readRes = await fetch('/api/agent/execute-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: 'read_document',
          parameters: {
            urlOrId: searchData?.results?.[0]?.url || 'https://scholar.archive.org/publication',
            topicFocus: currentPlan.objective,
          },
        }),
      });

      const readOutput: ExecuteToolApiResponse = await readRes.json();
      const historyAfterRead = readOutput.data ? [readOutput.data, ...historyAfterSearch] : historyAfterSearch;
      setExecutionHistory(historyAfterRead);

      // Étape 3 : GÉNÉRATION DIRECTE DE LA RÉPONSE TEXTUELLE
      const answerRes = await fetch('/api/agent/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: activePrompt,
          objective: currentPlan.objective,
          contextData: extractedSnippets,
        }),
      });

      const answerData: AnswerApiResponse = await answerRes.json();
      if (!answerRes.ok || !answerData.success || !answerData.answer) {
        throw new Error(answerData.error || "Erreur lors de la génération de la réponse textuelle.");
      }

      const generatedAnswer = answerData.answer;

      // Pensées enrichies
      const finalThoughts = [
        ...(currentPlan.thoughts || []),
        {
          id: `th_exec_1_${Date.now()}`,
          timestamp: Date.now(),
          category: 'SEARCH' as const,
          phase: 'Exploration documentaire',
          content: `Résultats collectés avec succès : ${searchOutput.data?.summary || 'Sources indexées'}.`,
        },
        {
          id: `th_exec_2_${Date.now()}`,
          timestamp: Date.now() + 150,
          category: 'SYNTHESIS' as const,
          phase: 'Réponse formulée',
          content: `Rédaction de la réponse textuelle achevée.`,
        },
      ];

      const completedTasks = currentPlan.tasks.map((t, idx) => ({
        ...t,
        isCompleted: true,
        executionResult: idx === 0 ? searchOutput.data?.summary : 'Étape complétée.',
      }));

      const finishedPlan: ResearchPlan = {
        ...currentPlan,
        status: 'TERMINÉ',
        tasks: completedTasks,
        thoughts: finalThoughts,
        executionHistory: historyAfterRead,
        answer: generatedAnswer,
      };

      setPlan(finishedPlan);
      saveConversation(activePrompt, finishedPlan);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur pendant l'exécution du plan.";
      setToolError(msg);
    } finally {
      setIsRunning(false);
    }
  };

  // Calcul du texte d'état
  const getAgentLogStatus = () => {
    if (loading) return "L'agent prépare le plan de recherche méthodique...";
    if (isRunning) return "Recherche et rédaction de la réponse textuelle en cours...";
    if (!plan) return "L'agent est prêt à recevoir vos instructions.";
    if (plan.status === 'TERMINÉ') return "Réponse générée avec succès.";
    return `Plan prêt (${plan.tasks.length} étapes définies). En attente de validation ou modification.`;
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0A0A0A] text-[#E5E5E5]">
      {/* 1. Header supérieur */}
      <Header
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onNewResearch={handleNewConversation}
        conversationTitle={activePrompt || undefined}
        savedCount={conversations.length}
      />

      {/* Tiroir d'historique des conversations */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={handleSelectConversation}
        onDelete={handleDeleteConversation}
        onClearAll={handleClearAllConversations}
      />

      {/* 2. Zone principale / Feed de conversation */}
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pt-6 pb-36 sm:px-6">
        <div className="space-y-6">
          {/* Message envoyé par l'utilisateur */}
          {activePrompt && <UserMessage message={activePrompt} />}

          {/* Espace thinking de l'agent */}
          {(activePrompt || plan) && (
            <AgentThinking
              statusText={getAgentLogStatus()}
              isLoading={loading}
              isExecutingTool={isRunning}
              thoughts={plan?.thoughts}
              executionHistory={executionHistory}
              plan={plan}
            />
          )}

          {/* Message d'erreur éventuel */}
          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-[#E11D48]/30 border-l-4 border-l-[#E11D48] bg-[#E11D48]/10 p-4 text-xs font-medium text-[#E11D48]">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#E11D48]" />
              <span>{error}</span>
            </div>
          )}

          {/* Espace réponse : Plan + Réponse Textuelle Normale */}
          <ResponseSpace
            plan={plan}
            isRunning={isRunning}
            onValidateAndRun={handleValidateAndRun}
            onUpdatePlan={handleUpdatePlan}
            toolError={toolError}
          />

          <div ref={bottomRef} />
        </div>
      </main>

      {/* 3. Champ texte flottant en bas */}
      <div className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none pb-5 pt-2">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 pointer-events-auto">
          <BottomInput
            value={query}
            onChange={setQuery}
            onSubmit={() => handleGeneratePlan()}
            loading={loading}
            placeholder="Posez une question ou indiquez un sujet de recherche..."
          />
        </div>
      </div>
    </div>
  );
}
