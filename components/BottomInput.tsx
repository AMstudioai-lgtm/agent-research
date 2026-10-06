'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Cpu, Check, Info } from 'lucide-react';
import { AGENT_MODEL_INFO } from '@/lib/config/models';
import { motion, AnimatePresence } from 'motion/react';

interface BottomInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  loading: boolean;
  placeholder?: string;
}

export const BottomInput: React.FC<BottomInputProps> = ({
  value,
  onChange,
  onSubmit,
  loading,
  placeholder = 'Posez une question ou indiquez un sujet de recherche...',
}) => {
  const [showModelPopup, setShowModelPopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize du textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [value]);

  // Fermer le popup au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowModelPopup(false);
      }
    };
    if (showModelPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModelPopup]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && value.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <div className="relative w-full rounded-2xl border border-[#2A2A2A] bg-[#111111] p-3 shadow-2xl transition-all focus-within:border-[#3B82F6] focus-within:ring-2 focus-within:ring-[#3B82F6]/20">
      {/* Zone de texte (Champ texte) */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
        placeholder={placeholder}
        rows={2}
        className="w-full resize-none bg-transparent text-sm leading-relaxed text-white placeholder-[#737373] focus:outline-none min-h-[50px] max-h-[160px]"
      />

      {/* Ligne inférieure dans le conteneur */}
      <div className="mt-2 flex items-center justify-between pt-1">
        {/* À gauche : Espace de sélection modèle */}
        <div className="relative" ref={popupRef}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setShowModelPopup(!showModelPopup)}
            className="flex items-center gap-1.5 rounded-full border border-[#2A2A2A] bg-[#1A1A1A] px-2.5 py-1 text-xs font-mono text-[#E5E5E5] transition-colors hover:border-[#3B82F6] hover:text-white focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
            title="Modèle d'orchestration actif"
          >
            <Cpu className="h-3 w-3 text-[#3B82F6]" />
            <span>{AGENT_MODEL_INFO.name}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
          </motion.button>

          {/* Mini popup d'information sur le modèle */}
          <AnimatePresence>
            {showModelPopup && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 4 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-0 mb-2 w-64 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-3 shadow-2xl z-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <Cpu className="h-3.5 w-3.5 text-[#3B82F6]" />
                    <span>Modèle de l&apos;Agent</span>
                  </div>
                  <span className="flex items-center gap-0.5 rounded bg-[#0F2A1E] border border-[#10B981]/30 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#10B981]">
                    <Check className="h-2.5 w-2.5" /> Actif
                  </span>
                </div>

                <div className="mt-2 rounded-lg border border-[#2A2A2A] bg-[#111111] p-2 text-[11px] text-[#A3A3A3] space-y-1">
                  <p className="font-semibold text-white">{AGENT_MODEL_INFO.name}</p>
                  <p className="text-[10px] text-[#737373] leading-normal font-sans">
                    {AGENT_MODEL_INFO.description}
                  </p>
                </div>

                <div className="mt-2 flex items-center gap-1 text-[10px] text-[#737373] font-mono">
                  <Info className="h-3 w-3 text-[#3B82F6]" />
                  <span>Modèle unique sans bascule automatique.</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* À droite : Bouton d'envoi Primary (#3B82F6) avec tactile press */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          type="button"
          onClick={onSubmit}
          disabled={loading || !value.trim()}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3B82F6] text-white shadow-xs transition-colors hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:bg-[#1A1A1A] disabled:text-[#737373] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 focus:ring-offset-[#0A0A0A]"
          title="Envoyer la recherche"
          aria-label="Envoyer"
        >
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  );
};
