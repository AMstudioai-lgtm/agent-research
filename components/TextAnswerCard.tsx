'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';

interface TextAnswerCardProps {
  answer: string;
}

export const TextAnswerCard: React.FC<TextAnswerCardProps> = ({ answer }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!answer) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full rounded-2xl border border-[#2A2A2A] bg-[#111111] p-6 shadow-xl space-y-4"
    >
      <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-[#10B981]" />
          <span className="font-mono text-xs font-semibold text-white tracking-wide uppercase">
            Rapport DeepResearch (2026)
          </span>
          <span className="rounded-md border border-[#2A2A2A] bg-[#1A1A1A] px-2 py-0.5 font-mono text-[10px] text-[#A3A3A3]">
            Synthèse d&apos;expertise
          </span>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-2.5 py-1 text-xs font-mono text-[#A3A3A3] hover:text-white transition-colors"
          title="Copier le rapport"
        >
          {copied ? (
            <>
            <Check className="h-3 w-3 text-[#10B981]" />
              <span className="text-[#10B981]">Copi�é</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copier le rapport</span>
            </>
            )}
        </motion.button>
      </div>

      <div className="prose prose-innert max-w-none text-sm text-[#E5E5E5] leading-relaxed space-y-3 font-sans">
        <Markdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-lg font-bold text-white tracking-tight mt-4 mb-2">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-base font-semibold text-white tracking-tight mt-3 mb-2">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold text-[#E5E5E5] mt-2 mb-1">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="leading-relaxed text-[#E5E5E5] my-2">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-5 my-2 space-y-1" text-[#E5E5E5]">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-5 my-2 space-y-1" text-[#E5E5E5]">
               {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="leading-relaxed">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-white">{children}</strong>
            ),
            code: ({ children }) => (
              <code className="rounded bg-[#1A1A1A] border border-[#2A2A2A] px-1.5 py-0.5 font-mono text-xs text-[#3B82F6]">
                {children}
              </code>
            ),
          }}
        >
          {answer}
        </Markdown>
      </div>
    </motion.div>
  );
};
