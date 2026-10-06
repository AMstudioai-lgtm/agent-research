'use client';

import React from 'react';
import { Target, ShieldCheck, Terminal, Sparkles } from 'lucide-react';
import { AGENT_MODEL_INFO } from '@/lib/config/models';

interface EmptyStateProps {
  onSelectSuggestion: (prompt: string) => void;
  suggestions: string[];
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onSelectSuggestion,
  suggestions,
}) => {
  return (
    <div className="py-8 text-center space-y-8">
      {/* En-tête pédagogique */}
      <div className="mx-auto max-w-2xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Moteur actif : {AGENT_MODEL_INFO.name}</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          Agent de Recherche Méthodique & Orchestrateur
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Transformez n&apos;importe quelle problématique en un plan d&apos;action structuré.
          Chaque outil est soumis à votre validation explicite avant son déclenchement.
        </p>
      </div>

      {/* Les 3 piliers de l'architecture */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-4xl mx-auto">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 mb-3">
            <Target className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            1. Décomposition Méthodique
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Clarification de l&apos;objectif, définition d&apos;un critère d&apos;arrêt mesurable et découpage en tâches séquentielles concrètes.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mb-3">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            2. Contrôle Humain (Human-in-the-loop)
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            L&apos;agent prépare les paramètres exacts de l&apos;action suivante, mais n&apos;exécute aucun outil sans votre autorisation préalable.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mb-3">
            <Terminal className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            3. Outils Réels Connectés
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Recherche web en temps réel (<code className="text-[11px] font-mono">search_web</code>), lecture détaillée (<code className="text-[11px] font-mono">read_document</code>) et archivage de notes (<code className="text-[11px] font-mono">save_result</code>).
          </p>
        </div>
      </div>

      {/* Cartes d'exemples cliquables */}
      <div className="max-w-3xl mx-auto space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Suggestions pour démarrer
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {suggestions.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onSelectSuggestion(prompt)}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-left text-xs font-medium text-slate-700 shadow-xs transition hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-700"
            >
              <span>{prompt}</span>
              <span className="text-blue-500 font-bold ml-2">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
