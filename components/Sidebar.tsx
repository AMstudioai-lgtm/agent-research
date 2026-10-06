'use client';

import React from 'react';
import { X, Clock, Trash2, ArrowRight } from 'lucide-react';
import { ConversationItem } from '@/types/agent';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ConversationItem[];
  activeId: string | null;
  onSelect: (conv: ConversationItem) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onClearAll: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  activeId,
  onSelect,
  onDelete,
  onClearAll,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop avec fade-in */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#0A0A0A]/80 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Drawer Content : Noir Elevated avec bordure Gris */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative z-10 flex h-full w-full max-w-sm flex-col border-r border-[#2A2A2A] bg-[#111111] shadow-2xl"
          >
            {/* En-tête du Drawer */}
            <div className="flex h-16 items-center justify-between border-b border-[#2A2A2A] px-4">
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-[#3B82F6]" />
                <h2 className="text-sm font-semibold text-white tracking-tight">
                  Historique des recherches
                </h2>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="rounded-lg p-1.5 text-[#A3A3A3] transition-colors hover:bg-[#1A1A1A] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                aria-label="Fermer le panneau"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Liste des conversations */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-[#737373]">
                  <Clock className="mb-2 h-7 w-7 text-[#2A2A2A]" />
                  <p className="text-sm font-medium text-[#A3A3A3]">Aucune recherche archivée</p>
                  <p className="mt-1 text-xs text-[#737373]">
                    Vos plans et sessions d&apos;exécution apparaîtront ici.
                  </p>
                </div>
              ) : (
                conversations.map((conv, index) => {
                  const isActive = conv.id === activeId;
                  const dateStr = new Date(conv.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      onClick={() => onSelect(conv)}
                      className={`group relative flex cursor-pointer flex-col rounded-xl border p-3 text-left transition-colors ${
                        isActive
                          ? 'border-[#3B82F6] bg-[#1E3A5F]/20'
                          : 'border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#333333] hover:bg-[#1A1A1A]/90'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-xs font-medium text-white leading-relaxed">
                          {conv.userPrompt}
                        </p>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => onDelete(conv.id, e)}
                          className="opacity-0 transition-opacity group-hover:opacity-100 p-1 text-[#737373] hover:text-[#E11D48]"
                          title="Supprimer cette recherche"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </motion.button>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#737373]">
                        <span className="font-mono" suppressHydrationWarning>{dateStr}</span>
                        <span className="flex items-center gap-1 font-mono text-[10px] text-[#3B82F6]">
                          Ouvrir <ArrowRight className="h-2.5 w-2.5" />
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Pied de tiroir : Destructive button */}
            {conversations.length > 0 && (
              <div className="border-t border-[#2A2A2A] p-4">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onClearAll}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#E11D48]/30 bg-transparent py-2 text-xs font-medium text-[#E11D48] transition-colors hover:bg-[#E11D48]/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Effacer tout l&apos;historique
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
