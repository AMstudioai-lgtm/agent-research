'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu, CheckCircle2, Loader2, Clock, Wrench } from 'lucide-react';
import { ToolExecutionOutput } from '@/types/agent';
import { AGENT_MODEL_INFO } from '@/lib/config/models';

interface AgentLogBarProps {
  statusText: string;
  isLoading: boolean;
  isExecutingTool?: boolean;
  executionHistory?: ToolExecutionOutput[];
}

export const AgentLogBar: React.FC<AgentLogBarProps> = ({
  statusText,
  isLoading,
  isExecutingTool = false,
  executionHistory = [],
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full rounded-xl border border-slate-200/90 bg-slate-100/70 p-2.5 text-xs text-slate-700 shadow-2xs transition dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
      {/* Barre résumé cliquable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-blue-600 shadow-2xs dark:bg-slate-800 dark:text-blue-400">
            {isLoading || isExecutingTool ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
            ) : (
              <Cpu className="h-3.5 w-3.5" />
            )}
          </div>

          <div className="truncate font-medium text-slate-800 dark:text-slate-200">
            <span>{statusText}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 shadow-2xs dark:bg-slate-800 dark:text-slate-400">
            {AGENT_MODEL_INFO.name}
          </span>
          <div className="flex h-5 w-5 items-center justify-center rounded text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </div>
        </div>
      </button>

      {/* Contenu dépliable des logs */}
      {isExpanded && (
        <div className="mt-2.5 border-t border-slate-200/80 pt-2.5 space-y-2 dark:border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Trace d&apos;exécution agentique</span>
            <span>Moteur : Google ADK</span>
          </div>

          {executionHistory.length === 0 ? (
            <div className="rounded-md bg-white p-2.5 text-[11px] text-slate-500 border border-slate-200/60 dark:bg-slate-950 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-3 w-3" />
                <span>Plan de recherche initial généré avec succès.</span>
              </div>
              <p className="mt-1 text-slate-400">
                En attente d&apos;autorisation humaine pour déclencher les outils connectés.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {executionHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-md bg-white p-2 text-[11px] border border-slate-200/60 dark:bg-slate-950 dark:border-slate-800 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 font-mono font-semibold text-blue-600 dark:text-blue-400">
                      <Wrench className="h-2.5 w-2.5" />
                      {item.toolName}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-400" suppressHydrationWarning>
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(item.timestamp).toLocaleTimeString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{item.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
