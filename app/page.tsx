'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  Send,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Cpu,
  Sparkles,
  Check,
  Trash2,
  Plus,
  MessageSquare,
  Clock,
  Lock,
  CheckCircle2,
  ListOrdered,
  FileQuestion,
  Wrench,
  Layers,
  Copy,
  AlertCircle,
  Info,
  CheckSquare,
  Terminal,
  RotateCcw,
} from 'lucide-react';
import { ResearchPlan, PlanApiResponse, ConversationItem } from '@/types/agent';
import { SUPPORTED_MODELS, DEFAULT_MODEL_ID } from '@/lib/config/models';

// Exemples de suggestions cliquables conformes au wireframe
const SUGGESTIONS = [
  "Fusion nucléaire commerciale : état de l'art et jalons 2026",
  "Benchmark Serverless vs Kubernetes pour microservices haute disponibilité",
  "Impact de l'AI Act européen sur les startups d'IA générative",
  "Batteries solides vs Lithium-ion : maturité industrielle",
  "ia les plus performant en raisonnement",
];

// Catalogue des modèles - source unique depuis la config centralisée
const AVAILABLE_MODELS = SUPPORTED_MODELS;

const LOCAL_STORAGE_KEY = 'adk_research_conversations_v1';

function createConversationItem(
  promptText: string,
  modelUsed: string,
  generatedPlan: ResearchPlan
): ConversationItem {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return {
    id: `conv_${timestamp}_${randomSuffix}`,
    title: promptText.length > 40 ? `${promptText.substring(0, 40)}...` : promptText,
    userPrompt: promptText,
    model: modelUsed,
    plan: generatedPlan,
    createdAt: timestamp,
  };
}

/**
 * Retourne un conseil contextuel selon le code d'erreur.
 */
function getErrorHint(errorCode?: string): string {
  switch (errorCode) {
    case '503':
    case 'HIGH_DEMAND':
      return 'Le modèle est temporairement surchargé. Le système a tenté un basculement automatique. Réessayez ou changez de modèle via le sélecteur (bas gauche).';
    case '429':
    case 'QUOTA_EXCEEDED':
      return 'Quota API dépassé. Patientez quelques minutes avant de relancer.';
    case 'NETWORK_ERROR':
    case 'TIMEOUT':
      return 'Problème de connexion. Vérifiez votre réseau et réessayez.';
    case 'AUTH_ERROR':
    case '401':
    case '403':
    case 'MISSING_API_KEY':
      return 'Erreur de configuration serveur. Contactez l\'administrateur.';
    case 'PARSE_ERROR':
    case 'SCHEMA_VALIDATION_FAILED':
    case 'INVALID_JSON':
    case 'EMPTY_OUTPUT':
      return 'Réponse IA invalide. Réessayez ou changez de modèle.';
    case 'INVALID_INPUT':
      return 'Saisissez un sujet de recherche valide.';
    case 'INPUT_TOO_LONG':
      return 'Demande trop longue (max 2000 caractères).';
    default:
      return 'Si le problème persiste, changez de modèle via le sélecteur en bas à gauche.';
  }
}

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL_ID);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<ResearchPlan | null>(null);
  const [error, setError] = useState<{ message: string; errorCode?: string; retryable?: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  // État du Drawer Burger (historique des conversations)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // État du bandeau de Log déployable
  const [isLogExpanded, setIsLogExpanded] = useState(true);

  // État du Mini Popup Sélecteur de Modèle
  const [isModelPopupOpen, setIsModelPopupOpen] = useState(false);
  const modelPopupRef = useRef<HTMLDivElement>(null);

  // Fermer le mini popup de modèle au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modelPopupRef.current && !modelPopupRef.current.contains(event.target as Node)) {
        setIsModelPopupOpen(false);
      }
    }
    if (isModelPopupOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModelPopupOpen]);

  // Sauvegarde des conversations dans le localStorage
  const saveConversation = (promptText: string, modelUsed: string, generatedPlan: ResearchPlan) => {
    const newConv = createConversationItem(promptText, modelUsed, generatedPlan);
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

  // Sélection d'une conversation dans le menu burger
  const handleSelectConversation = (conv: ConversationItem) => {
    setActiveConversationId(conv.id);
    setSubmittedQuery(conv.userPrompt);
    setQuery(conv.userPrompt);
    setSelectedModel(conv.model || 'gemini-3.6-flash');
    setPlan(conv.plan);
    setError(null);
    setIsDrawerOpen(false);
    setIsLogExpanded(false);
  };

  // Réinitialiser vers une nouvelle recherche
  const handleNewConversation = () => {
    setActiveConversationId(null);
    setSubmittedQuery(null);
    setQuery('');
    setPlan(null);
    setError(null);
    setIsDrawerOpen(false);
    setIsLogExpanded(true);
  };

  // Soumission de la demande à l'API interne propulsée par Google ADK
  const handleGeneratePlan = async (promptToUse?: string) => {
    const textToSubmit = (promptToUse ?? query).trim();
    if (!textToSubmit) return;

    setSubmittedQuery(textToSubmit);
    if (promptToUse) {
      setQuery(promptToUse);
    }

    setLoading(true);
    setError(null);
    setIsLogExpanded(true);

    try {
      const response = await fetch('/api/agent/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPrompt: textToSubmit,
          model: selectedModel,
        }),
      });

      const result: PlanApiResponse & { errorCode?: string; retryable?: boolean } = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw {
          message: result.error || "Une erreur est survenue lors de l'exécution de l'agent.",
          errorCode: result.errorCode,
          retryable: result.retryable,
        };
      }

      setPlan(result.data);
      saveConversation(textToSubmit, selectedModel, result.data);
    } catch (err: unknown) {
      const errorObj = err as { message?: string; errorCode?: string; retryable?: boolean } | Error;
      setError({
        message: errorObj.message || "Erreur de communication avec l'agent ADK.",
        errorCode: 'errorCode' in errorObj ? errorObj.errorCode : undefined,
        retryable: 'retryable' in errorObj ? errorObj.retryable : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGeneratePlan();
    }
  };

  const handleCopyPlan = () => {
    if (!plan) return;
    navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentModelObj =
    AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 antialiased flex flex-col justify-between selection:bg-stone-200">
      
      {/* ========================================================================= */}
      {/* 1. TIROIR BURGER (DRAWER) CONTENANT LES CONVERSATIONS */}
      {/* ========================================================================= */}
      {isDrawerOpen && (
        <div
          id="drawer-backdrop"
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 flex"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            id="drawer-content"
            className="w-80 max-w-[85vw] bg-white h-full shadow-2xl border-r border-stone-200 flex flex-col z-50 animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête du tiroir */}
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-stone-700" />
                <h2 className="text-sm font-bold text-stone-900">Conversations</h2>
              </div>
              <button
                id="close-drawer-btn"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition-colors"
                title="Fermer le tiroir"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action Nouvelle recherche */}
            <div className="p-3 border-b border-stone-100">
              <button
                id="new-chat-btn"
                onClick={handleNewConversation}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nouvelle recherche
              </button>
            </div>

            {/* Liste scrollable des conversations */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {conversations.length === 0 ? (
                <div className="text-center py-10 text-xs text-stone-400 px-4 space-y-2">
                  <MessageSquare className="w-8 h-8 text-stone-300 mx-auto" />
                  <p>Aucune conversation enregistrée.</p>
                  <p className="text-[11px] text-stone-400">
                    Vos recherches préparées apparaîtront ici automatiquement.
                  </p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive = conv.id === activeConversationId;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`group relative flex items-center justify-between p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                        isActive
                          ? 'bg-stone-100 border-stone-400 shadow-2xs font-medium'
                          : 'bg-white border-stone-200 hover:bg-stone-50 hover:border-stone-300'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs text-stone-900 truncate">{conv.title}</p>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-stone-400">
                          <Cpu className="w-3 h-3" />
                          <span>{conv.model || 'gemini-3.6-flash'}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-stone-400 hover:text-red-600 transition-all shrink-0"
                        title="Supprimer cette conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bas du tiroir */}
            {conversations.length > 0 && (
              <div className="p-3 border-t border-stone-200 bg-stone-50">
                <button
                  onClick={handleClearAllConversations}
                  className="w-full text-center text-xs text-stone-500 hover:text-red-600 py-1.5 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Effacer tout l&apos;historique
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CONTENEUR PRINCIPAL CALIBRÉ EXACTEMENT SUR LA FRAME DU WIREFRAME */}
      {/* ========================================================================= */}
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col px-3 sm:px-6 py-4 sm:py-6">
        
        {/* FRAME CENTRALE ENCADRÉE (Conforme au croquis) */}
        <div className="bg-white border border-stone-300 rounded-3xl shadow-sm flex-1 flex flex-col p-4 sm:p-6 overflow-hidden relative">

          {/* ======================================================================= */}
          {/* A. HAUT : BURGER (GAUCHE) & MESSAGE ENVOYÉ (DROITE) */}
          {/* ======================================================================= */}
          <div className="flex items-start justify-between gap-4 pb-4">
            
            {/* Burger contenant les conversations (en haut à gauche) */}
            <div className="shrink-0">
              <button
                id="burger-menu-btn"
                onClick={() => setIsDrawerOpen(true)}
                className="inline-flex items-center justify-center p-2.5 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-800 shadow-2xs transition-all active:scale-95"
                title="Ouvrir les conversations"
              >
                <Menu className="w-5 h-5 text-stone-700" />
              </button>
            </div>

            {/* Message envoyé par l'utilisateur (en haut à droite, conforme au croquis) */}
            <div className="flex-1 flex justify-end">
              {submittedQuery ? (
                <div
                  id="sent-message-bubble"
                  className="max-w-md sm:max-w-lg bg-stone-900 text-white rounded-2xl rounded-tr-xs px-4 py-3 shadow-xs space-y-1 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <div className="flex items-center justify-between gap-3 text-[11px] text-stone-300 border-b border-stone-800 pb-1">
                    <span className="font-semibold uppercase tracking-wider">Demande utilisateur</span>
                    <span className="font-mono text-[10px] bg-stone-800 px-1.5 py-0.5 rounded text-stone-200 flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-stone-400" />
                      {selectedModel}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-stone-100">
                    {submittedQuery}
                  </p>
                </div>
              ) : (
                <div className="text-right">
                  <span className="text-[11px] font-mono text-stone-400 bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-full">
                    Prêt pour une nouvelle recherche
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* ======================================================================= */}
          {/* B. LOG DÉPLOYABLE DE L'AGENT (« Ce qu'il est en train de faire ») */}
          {/* ======================================================================= */}
          <div className="my-3">
            <div
              id="agent-deployable-log"
              className="border border-stone-200 rounded-xl overflow-hidden bg-stone-50/80 transition-all shadow-2xs"
            >
              {/* En-tête dépliable */}
              <button
                id="toggle-agent-log-btn"
                type="button"
                onClick={() => setIsLogExpanded(!isLogExpanded)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-stone-100/70 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {loading ? (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                    </span>
                  ) : plan ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-stone-400 shrink-0" />
                  )}

                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-stone-500" />
                    <span className="text-xs font-semibold text-stone-800">
                      {loading
                        ? "Log agent : orchestration Google ADK en cours..."
                        : plan
                        ? "Log agent : 6 étapes de préparation validées"
                        : "Log déployable de l'agent : protocole de structuration V1"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-stone-500 text-xs">
                  <span className="hidden sm:inline text-[11px] text-stone-500">
                    {isLogExpanded ? 'Réduire' : 'Déployer'}
                  </span>
                  {isLogExpanded ? (
                    <ChevronUp className="w-4 h-4 text-stone-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-600" />
                  )}
                </div>
              </button>

              {/* Corps déplié du log */}
              {isLogExpanded && (
                <div className="p-3.5 border-t border-stone-200 bg-white text-xs space-y-2.5 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-stone-50 border border-stone-200">
                      <span className="text-stone-500 block">Framework :</span>
                      <span className="font-mono font-semibold text-stone-800">@google/adk (InMemoryRunner)</span>
                    </div>
                    <div className="p-2 rounded bg-stone-50 border border-stone-200">
                      <span className="text-stone-500 block">Modèle ciblé :</span>
                      <span className="font-mono font-semibold text-stone-800">{plan?.modelUsed || selectedModel}</span>
                    </div>
                    <div className="p-2 rounded bg-stone-50 border border-stone-200">
                      <span className="text-stone-500 block">Mode de sécurité :</span>
                      <span className="font-mono font-semibold text-emerald-700">Verrouillé (tools: [])</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
                      Étapes d&apos;analyse & d&apos;exécution méthodique :
                    </div>
                    <ul className="space-y-1 text-stone-600 text-[11px]">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>1. Cadrage de l&apos;objectif et exclusion stricte des hallucinations</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>2. Décomposition en tâches atomiques avec livrables explicites</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>3. Qualification des informations requises (disponibles vs manquantes)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>4. Détection des signatures d&apos;outils externes indispensables pour la V2</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>5. Verrouillage de la prochaine action immédiate en attente d&apos;outils</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ======================================================================= */}
          {/* C. ESPACE RÉPONSE (ZONE CENTRALE DU WIREFRAME) */}
          {/* ======================================================================= */}
          <div
            id="response-space"
            className="flex-1 overflow-y-auto pr-1 my-2 space-y-6"
            style={{ maxHeight: 'calc(100vh - 380px)', minHeight: '260px' }}
          >
            {/* Notification de basculement de modèle résilient en cas de 503 */}
            {plan?.fallbackNotice && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{plan.fallbackNotice}</span>
              </div>
            )}

            {/* Notification d'erreur */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Impossible de générer le plan</p>
                  <p>{error.message}</p>
                  {error.errorCode && (
                    <p className="text-stone-600 text-[11px] mt-1 font-mono">
                      Code : {error.errorCode} {error.retryable && '(réessayable)'}
                    </p>
                  )}
                  <p className="text-stone-600 text-[11px] mt-1">
                    {getErrorHint(error.errorCode)}
                  </p>
                </div>
              </div>
            )}

            {/* État de chargement en cours */}
            {loading && (
              <div className="py-14 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center mx-auto shadow-md animate-pulse">
                  <Sparkles className="w-6 h-6 text-amber-400 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-stone-900">
                    L&apos;agent Google ADK formalise votre recherche
                  </h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Modèle actif : <span className="font-mono font-semibold text-stone-800">{selectedModel}</span>. Vérification des verrous méthodiques et génération du schéma strict...
                  </p>
                </div>
              </div>
            )}

            {/* État vide initial : invitation claire */}
            {!loading && !plan && !error && (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 shadow-2xs">
                  <Sparkles className="w-7 h-7 text-stone-500" />
                </div>
                <div className="space-y-1 max-w-md">
                  <h3 className="text-base font-bold text-stone-900">
                    Espace réponse prêt
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Saisissez un sujet d&apos;investigation ou choisissez une des suggestions ci-dessous. 
                    L&apos;agent Google ADK décomposera votre sujet en un plan d&apos;action rigoureux, sans aucune hallucination.
                  </p>
                </div>
              </div>
            )}

            {/* État avec plan généré : affichage complet et structuré */}
            {!loading && plan && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                {/* En-tête de la réponse & Bouton Copier */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h3 className="text-sm font-bold text-stone-900">
                      Plan de recherche structuré ({plan.status})
                    </h3>
                    {plan.modelUsed && (
                      <span className="text-[10px] font-mono bg-stone-100 border border-stone-200 px-2 py-0.5 rounded text-stone-700">
                        {plan.modelUsed}
                      </span>
                    )}
                  </div>
                  <button
                    id="copy-json-btn"
                    onClick={handleCopyPlan}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-stone-300 bg-white hover:bg-stone-50 text-xs font-medium text-stone-700 transition-colors self-start sm:self-auto"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copié !' : 'Copier JSON'}</span>
                  </button>
                </div>

                {/* 1. Objectif Clarifié */}
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 block">
                    1. Objectif clarifié par l&apos;agent
                  </span>
                  <p className="text-xs sm:text-sm font-medium text-stone-900 leading-relaxed">
                    {plan.objective}
                  </p>
                </div>

                {/* 2. Tâches Planifiées */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                    <ListOrdered className="w-4 h-4 text-stone-600" />
                    <span>2. Découpage en tâches séquentielles ({plan.tasks.length})</span>
                  </div>
                  <div className="space-y-2">
                    {plan.tasks.map((task, idx) => (
                      <div
                        key={task.id || idx}
                        className="p-3 rounded-lg border border-stone-200 bg-white shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="flex-1 space-y-1">
                            <p className="text-xs font-semibold text-stone-900">
                              {task.description}
                            </p>
                            <div className="flex items-center gap-1.5 text-[11px] text-stone-600">
                              <CheckSquare className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span className="font-medium text-stone-700">Livrable :</span>
                              <span>{task.expectedOutput}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Informations nécessaires (Disponibles vs Manquantes) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>3A. Informations disponibles</span>
                    </div>
                    <ul className="space-y-1 text-xs text-stone-700">
                      {plan.requiredInformation.available.length > 0 ? (
                        plan.requiredInformation.available.map((info, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>{info}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-stone-400 italic text-[11px]">Aucune information préalable fournie.</li>
                      )}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                      <FileQuestion className="w-3.5 h-3.5 text-amber-600" />
                      <span>3B. Informations indispensables manquantes</span>
                    </div>
                    <ul className="space-y-1 text-xs text-stone-700">
                      {plan.requiredInformation.missing.length > 0 ? (
                        plan.requiredInformation.missing.map((info, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-600 font-bold">•</span>
                            <span>{info}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-stone-400 italic text-[11px]">Toutes les informations requises sont disponibles.</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* 4. Outils nécessaires identifiés */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                      <Wrench className="w-4 h-4 text-stone-600" />
                      <span>4. Outils nécessaires identifiés ({plan.requiredTools.length})</span>
                    </div>
                    <span className="text-[11px] text-stone-500">Prévus pour connexion en V2</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {plan.requiredTools.map((tool, i) => (
                      <div key={i} className="p-3 rounded-lg border border-stone-200 bg-stone-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-stone-900 bg-stone-200 px-1.5 py-0.5 rounded">
                            {tool.name}
                          </span>
                          <span title="Verrouillé en V1">
                            <Lock className="w-3.5 h-3.5 text-stone-400" />
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 leading-snug">{tool.reason}</p>
                        <div className="pt-1 border-t border-stone-200 text-[10px] text-stone-500">
                          Params : {tool.parametersNeeded.join(', ') || 'aucun'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5 & 6. Critère d'arrêt & Prochaine action */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-stone-200 bg-white space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                      <Clock className="w-3.5 h-3.5 text-stone-600" />
                      <span>5. Critère d&apos;arrêt mesurable</span>
                    </div>
                    <p className="text-xs text-stone-700 bg-stone-50 p-2.5 rounded border border-stone-200">
                      {plan.stoppingCriteria}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-stone-200 bg-white space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                        <ArrowRight className="w-3.5 h-3.5 text-stone-600" />
                        <span>6. Prochaine action</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                        Verrouillée V1
                      </span>
                    </div>
                    <div className="bg-stone-50 p-2.5 rounded border border-stone-200 space-y-1">
                      <p className="text-xs font-semibold text-stone-900">{plan.nextAction.action}</p>
                      <div className="text-[11px] text-stone-500">
                        Outil cible : <code className="font-mono font-medium text-stone-800">{plan.nextAction.targetTool}</code>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* ======================================================================= */}
          {/* D. SUGGESTIONS (AU-DESSUS DU CHAMP TEXTE, CONFORME AU WIREFRAME) */}
          {/* ======================================================================= */}
          <div className="pt-2 pb-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider shrink-0 mr-1">
                Suggestions :
              </span>
              {SUGGESTIONS.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleGeneratePlan(sug)}
                  disabled={loading}
                  className="shrink-0 px-2.5 py-1 rounded-full border border-stone-200 bg-stone-50 hover:bg-stone-100 text-[11px] text-stone-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* ======================================================================= */}
          {/* E. CHAMP TEXTE AVEC MINI POPUP SÉLECTEUR MODÈLE & BOUTON D'ENVOI */}
          {/* ======================================================================= */}
          <div
            id="unified-input-card"
            className="border border-stone-300 rounded-2xl bg-white shadow-2xs focus-within:border-stone-500 focus-within:ring-2 focus-within:ring-stone-200 transition-all p-3 space-y-2 relative"
          >
            {/* Zone de saisie principale */}
            <textarea
              id="user-query-textarea"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Saisissez votre sujet ou question de recherche... (Entrée pour envoyer)"
              rows={2}
              className="w-full resize-none text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 bg-transparent border-none focus:outline-none focus:ring-0 leading-relaxed"
            />

            {/* Barre inférieure de l'input : Sélecteur de modèle à gauche & Bouton d'envoi à droite */}
            <div className="flex items-center justify-between pt-1 border-t border-stone-100">
              
              {/* ESPACE DE SÉLECTION MODÈLE AVEC LE MINI POPUP */}
              <div className="relative" ref={modelPopupRef}>
                <button
                  id="model-selector-btn"
                  type="button"
                  onClick={() => setIsModelPopupOpen(!isModelPopupOpen)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-mono font-medium transition-colors shadow-2xs disabled:opacity-50"
                  title="Changer de modèle d'IA"
                >
                  <Cpu className="w-3.5 h-3.5 text-stone-500" />
                  <span className="truncate max-w-[130px] sm:max-w-none">
                    {currentModelObj.name}
                  </span>
                  {isModelPopupOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                  )}
                </button>

                {/* MINI POPUP DU SÉLECTEUR DE MODÈLE (FLOTTANT AU-DESSUS) */}
                {isModelPopupOpen && (
                  <div
                    id="mini-model-popup"
                    className="absolute bottom-full left-0 mb-2 w-72 sm:w-80 bg-white border border-stone-200 rounded-2xl shadow-xl p-2.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
                  >
                    <div className="flex items-center justify-between px-2 py-1.5 border-b border-stone-100 mb-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Sélection du modèle Google</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsModelPopupOpen(false)}
                        className="p-1 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {AVAILABLE_MODELS.map((m) => {
                        const isSelected = m.id === selectedModel;
                        return (
                          <div
                            key={m.id}
                            onClick={() => {
                              setSelectedModel(m.id);
                              setIsModelPopupOpen(false);
                            }}
                            className={`p-2 rounded-xl text-left cursor-pointer transition-all border ${
                              isSelected
                                ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                                : 'bg-white border-transparent hover:bg-stone-50 hover:border-stone-200 text-stone-800'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-mono font-bold">
                                {m.name}
                              </span>
                              <span
                                className={`text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded border font-sans font-semibold ${
                                  isSelected
                                    ? 'bg-stone-800 text-stone-200 border-stone-700'
                                    : m.badgeColor
                                }`}
                              >
                                {m.badge}
                              </span>
                            </div>
                            <p
                              className={`text-[11px] leading-snug ${
                                isSelected ? 'text-stone-300' : 'text-stone-500'
                              }`}
                            >
                              {m.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-stone-100 px-2 text-[10px] text-stone-400 flex items-center justify-between">
                      <span>Routé via Google ADK v2.1</span>
                      <span className="font-mono">Flash API</span>
                    </div>
                  </div>
                )}
              </div>

              {/* BOUTON D'ENVOI (FLÈCHE À DROITE, CONFORME AU WIREFRAME) */}
              <button
                id="submit-message-btn"
                type="button"
                onClick={() => handleGeneratePlan()}
                disabled={loading || !query.trim()}
                className="inline-flex items-center justify-center p-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs active:scale-95"
                title="Envoyer la recherche"
              >
                {loading ? (
                  <RotateCcw className="w-4 h-4 animate-spin text-stone-300" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
