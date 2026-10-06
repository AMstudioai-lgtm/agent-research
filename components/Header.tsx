'use client';

import React from 'react';
import { Menu, Plus } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  onOpenSidebar: () => void;
  onNewResearch: () => void;
  conversationTitle?: string;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  onNewResearch,
  conversationTitle,
  savedCount,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#2A2A2A] bg-[#111111]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
        {/* À gauche : Burger contenant les conversations */}
        <div className="flex items-center">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onOpenSidebar}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#2A2A2A] bg-transparent text-[#A3A3A3] transition-colors hover:bg-[#1A1A1A] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 focus:ring-offset-[#0A0A0A]"
            title="Burger contenant les conversations"
            aria-label="Ouvrir les conversations"
          >
            <Menu className="h-4 w-4" />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#3B82F6] px-1 font-mono text-[10px] font-bold text-white shadow-xs">
                {savedCount > 9 ? '9+' : savedCount}
              </span>
            )}
          </motion.button>
        </div>

        {/* Au centre : Nom de la conversation (pill horizontal asymétrique avec contour fin) */}
        <div className="flex max-w-[65%] sm:max-w-[75%] items-center justify-center">
          <div className="flex items-center gap-2 rounded-full border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-1.5 text-xs font-medium text-[#E5E5E5] shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
            <span className="truncate max-w-[220px] sm:max-w-[420px]">
              {conversationTitle || 'Nouvelle recherche'}
            </span>
          </div>
        </div>

        {/* À droite : Bouton pour nouvelle recherche */}
        <div className="flex items-center">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onNewResearch}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2A2A2A] bg-transparent text-[#E5E5E5] transition-colors hover:border-[#3B82F6] hover:bg-[#1A1A1A] hover:text-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 focus:ring-offset-[#0A0A0A]"
            title="Nouvelle conversation"
            aria-label="Nouvelle conversation"
          >
            <Plus className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </header>
  );
};
