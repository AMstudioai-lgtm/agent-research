'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Brain,
  Sparkles,
  CheckCircle2,
  Search,
  BookOpen,
  FileCheck,
  Compass,
  ListChecks,
  Check,
} from 'lucide-react';
import { AgentThought, ToolExecutionOutput, ResearchPlan } from '@/types/agent';
import { AGENT_MODEL_INFO } from '@/lib/config/models';
import { motion, AnimatePresence } from 'motion/react';

interface AgentThinkingProps {
  statusText: string;
  isLoading: boolean;
  isExecutingTool?: boolean;
  thoughts?: AgentThought[];
  executionHistory?: ToolExecutionOutput[];
  plan?: ResearchPlan | null;
}

export const AgentThinking: React.FC<AgentThinkingProps> = ({
  statusText,
  isLoading,
  isExecutingTool = false,
  thoughts = [],
  executionHistory = [],
  plan = null,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'SEARCH':
        return <Search className="h-3 w-3 text-[#10B981]" />;
      case 'ANALYSIS':
        return <BookOpen className="h-3 w-3 text-[#F59E0B]" />;
      case 'DECISION':
        return <Compass className="h-3 w-3 text-[#E11D48]" />;
      case 'SYNTHESIS':
        return <FileCheck className="h-3 w-3 text-[#10B981]" />;
      default:
        return <Brain className="h-3 w-3 text-[#3B82F6]" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'SEARCH':
        return 'bg-[#0F2A1E] text-[#10B981] border-[#10B981]/30';
      case 'ANALYSIS':
        return 'bg-[#2A1E0F] text-[#F59E0B] border-[#F59E0B]/30';
      case 'DECISION':
        return 'bg-[#2A0F1E] text-[#E11D48] border-[#E11D48]/30';
      case 'SYNTHESIS':
        return 'bg-[#0F2A1A] text-[#10B981] border-[#10B981]/30';
      default:
        return 'bg-[#1E3A5F] text-[#3B82F6] border-[#3B82F6]/30';
    }
  };

  const totalEntries = (plan?.tasks ? plan.tasks.length : 0) + thoughts.length + executionHistory.length;

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#111111] shadow-xs">
      {/* En-tête : Noir Primary (#0A0A0A) avec bordure Gris (#2A2A2A) */}
      <motion.button
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between gap-3 border-b border-[#2A2A2A] bg-[#0A0A0A] p-3.5 text-left transition-colors hover:bg-[#111111]"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1E3A5F]/40 text-[#3B82F6] border border-[#3B82F6]/20">
            {isLoading || isExecutingTool ? (
              <span className="h-2 w-2 rounded-full bg-[#3B82F6] animate-ping" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
          </div>

          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-tight">
                Thinking & Réflexion de l&apos;agent
              </span>
              <span className="rounded-full bg-[#1A1A1A] border border-[#2A2A2A] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#A3A3A3]">
                {totalEntries} étape{totalEntries > 1 ? 's' : ''}
              </span>
            </div>
            <p className="truncate text-[11px] text-[#737373] mt-0.5 font-mono">
              {statusText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="rounded-md border border-[#2A2A2A] bg-[#1A1A1A] px-2 py-0.5 font-mono text-[10px] text-[#A3A3A3]">
            {AGENT_MODEL_INFO.name}
          </span>
          <div className="flex h-6 w-6 items-center justify-center rounded text-[#737373] hover:text-white">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </motion.button>

      {/* Contenu déroulant : Gris Card (#1A1A1A/50) */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="overflow-hidden bg-[#1A1A1A]/40 p-3.5"
          >
            <div className="max-h-80 overflow-y-auto pr-1 space-y-2.5">
              {/* Si aucune pensée, ni plan, ni outil */}
              {!plan && thoughts.length === 0 && executionHistory.length === 0 && (
                <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4 text-xs text-[#A3A3A3]">
                  {isLoading ? (
                    <div className="space-y-2">
                      <div className="h-3.5 w-3/4 rounded bg-gradient-to-r from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] animate-pulse" />
                      <div className="h-3 w-1/2 rounded bg-gradient-to-r from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] animate-pulse" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[#E5E5E5]">
                      <Sparkles className="h-3.5 w-3.5 text-[#3B82F6]" />
                      <span>L&apos;agent est prêt à analyser votre problématique.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Synthèse du plan de recherche et des étapes */}
              {plan && (
                <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#3B82F6]">
                      <ListChecks className="h-3.5 w-3.5" />
                      Plan d&apos;action & Objectif
                    </span>
                    <span className="font-mono text-[10px] text-[#737373]">
                      {plan.status === 'TERMINÉ' ? '✓ Exécuté' : 'En attente / En cours'}
                    </span>
                  </div>
                  <p className="text-[#E5E5E5] text-[11px] font-medium leading-snug">
                    {plan.objective}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {plan.tasks.map((task, idx) => (
                      <div
                        key={task.id || idx}
                        className={`flex items-center gap-2 rounded-lg border px-2 py-1 text-[11px] ${
                          task.isCompleted
                            ? 'border-[#10B981]/30 bg-[#0F2A1E]/30 text-[#10B981]'
                            : 'border-[#2A2A2A] bg-[#1A1A1A] text-[#A3A3A3]'
                        }`}
                      >
                        {task.isCompleted ? (
                          <Check className="h-3 w-3 shrink-0 text-[#10B981]" />
                        ) : (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#737373]" />
                        )}
                        <span className="truncate">{task.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 1. Pensées et raisonnements de l'agent (staggered cascade) */}
              {thoughts.map((th, index) => (
                <motion.div
                  key={th.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.2 }}
                  className="relative rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-3 text-xs shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${getCategoryBadgeClass(
                          th.category
                        )}`}
                      >
                        {getCategoryIcon(th.category)}
                        <span>{th.category}</span>
                      </span>
                      {th.phase && (
                        <span className="text-[11px] font-medium text-[#E5E5E5]">
                          • {th.phase}
                        </span>
                      )}
                    </div>

                    <span className="font-mono text-[10px] text-[#737373]" suppressHydrationWarning>
                      Étape {index + 1}
                    </span>
                  </div>

                  <p className="text-[#E5E5E5] leading-relaxed">
                    {th.content}
                  </p>
                </motion.div>
              ))}

              {/* 2. État d'exécution des outils en direct */}
              {executionHistory.map((item, idx) => (
                <motion.div
                  key={`exec_${idx}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-xl border border-[#10B981]/30 bg-[#0F2A1E] p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#10B981]">
                      <CheckCircle2 className="h-3 w-3" />
                      {item.toolName}() — Action exécutée
                    </span>
                    <span className="font-mono text-[10px] text-[#10B981]/70">
                      Audit vérifié
                    </span>
                  </div>
                  <p className="text-[#E5E5E5]">{item.summary}</p>
                </motion.div>
              ))}

              {/* Shimmer state si exécution en cours */}
              {isExecutingTool && (
                <div className="rounded-xl border border-[#3B82F6]/30 bg-[#1E3A5F]/20 p-3 text-xs text-[#E5E5E5] space-y-2">
                  <div className="flex items-center gap-2 text-[#3B82F6] font-mono text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6] animate-ping" />
                    <span>Interrogation des sources ouvertes et analyse documentaire en cours...</span>
                  </div>
                  <div className="h-2 w-full rounded bg-gradient-to-r from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] animate-pulse" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
