'use client';

import React from 'react';
import { ArrowRight, Sparkles, Loader2 } from 'lucide-react';

interface SearchInputProps {
  query: string;
  onChange: (val: string) => void;
  onSubmit: (prompt?: string) => void;
  loading: boolean;
  suggestions: string[];
}

export const SearchInput: React.FC<SearchInputProps> = ({
  query,
  onChange,
  onSubmit,
  loading,
  suggestions,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Zone de saisie principale */}
      <div className="relative rounded-xl border border-slate-300 bg-white p-2 shadow-sm transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900">
        <textarea
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ex : Analysez l'état de l'art sur la fusion nucléaire commerciale et les jalons 2026..."
          rows={3}
          disabled={loading}
          className="w-full resize-none bg-transparent p-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white dark:placeholder-slate-500"
        />

        <div className="flex items-center justify-between border-t border-slate-100 pt-2 px-1 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
            Appuyez sur <kbd className="rounded border bg-slate-50 px-1 py-0.5 font-mono text-[10px] dark:border-slate-700 dark:bg-slate-800">Entrée</kbd> pour lancer
          </span>

          <button
            onClick={() => onSubmit()}
            disabled={loading || !query.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Structuration en cours...</span>
              </>
            ) : (
              <>
                <span>Structurer la recherche</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Suggestions rapides */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Exemples :
        </span>
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              onChange(suggestion);
              onSubmit(suggestion);
            }}
            disabled={loading}
            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 transition hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:text-blue-300"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};
