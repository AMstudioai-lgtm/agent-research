'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface SuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  disabled?: boolean;
}

export const Suggestions: React.FC<SuggestionsProps> = ({
  suggestions,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 mr-1">
        <Sparkles className="h-3 w-3 text-blue-500" />
        <span>Suggestions :</span>
      </div>

      {suggestions.map((item, index) => (
        <button
          key={index}
          onClick={() => onSelect(item)}
          disabled={disabled}
          className="rounded-full border border-slate-200/90 bg-white/90 px-3 py-1 text-xs text-slate-700 shadow-2xs transition hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:text-blue-300"
        >
          {item}
        </button>
      ))}
    </div>
  );
};
