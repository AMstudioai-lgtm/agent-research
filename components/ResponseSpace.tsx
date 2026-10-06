'use client';

import React from 'react';
import { ResearchPlan } from '@/types/agent';
import { PlanView } from './PlanView';
import { TextAnswerCard } from './TextAnswerCard';
import { Target, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ResponseSpaceProps {
  plan: ResearchPlan | null;
  isRunning: boolean;
  onValidateAndRun: () => void;
  onUpdatePlan: (updatedPlan: ResearchPlan) => void;
  toolError: string | null;
}

export const ResponseSpace: React.FC<ResponseSpaceProps> = ({
  plan,
  isRunning,
  onValidateAndRun,
  onUpdatePlan,
  toolError,
}) => {
  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#2A2A2A] bg-[#111111] text-[#737373] shadow-xs">
          <Target className="h-5 w-5 stroke-[1.5] text-[#3B82F6]" />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-white tracking-tight">
          Assistant de Recherche
        </h3>
        <p className="mt-1.5 max-w-sm text-xs text-[#737373] leading-relaxed">
          Posez une question ou indiquez un sujet. Validez le plan pour recevoir la réponse textuelle de l&apos;IA.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      {/* 1. Plan de recherche interactif : Affiché pour consultation et validation par l'utilisateur */}
      {plan.status !== 'TERMINÉ' && (
        <PlanView
          plan={plan}
          isRunning={isRunning}
          onValidateAndRun={onValidateAndRun}
          onUpdatePlan={onUpdatePlan}
        />
      )}

      {/* Message d'erreur éventuel lors de l'exécution */}
      {toolError && (
        <div className="rounded-xl border-l-4 border-[#E11D48] border-y border-r border-[#2A2A2A] bg-[#E11D48]/10 p-3.5 text-xs text-[#E11D48]">
          {toolError}
        </div>
      )}

      {/* Indicateur d'exécution en cours */}
      {isRunning && !plan.answer && (
        <div className="rounded-2xl border border-[#2A2A2A] bg-[#111111] p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-[#3B82F6]">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Investigation approfondie et rédaction du rapport DeepResearch 2026...</span>
          </div>
          <div className="space-y-2 pt-1">
            <div className="h-3 w-full rounded bg-gradient-to-r from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] animate-pulse" />
            <div className="h-3 w-4/5 rounded bg-gradient-to-r from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] animate-pulse" />
          </div>
        </div>
      )}

      {/* 2. RAPPORT STRUCTURÉ DEEPRESEARCH EXCLUSIF : Affiché dès que la recherche est terminée */}
      {plan.status === 'TERMINÉ' && plan.answer && (
        <TextAnswerCard answer={plan.answer} />
      )}
    </motion.div>
  );
};
