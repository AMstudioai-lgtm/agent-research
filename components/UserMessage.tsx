'use client';

import React from 'react';
import { motion } from 'motion/react';

interface UserMessageProps {
  message: string;
  timestamp?: number;
}

export const UserMessage: React.FC<UserMessageProps> = ({ message, timestamp }) => {
  const timeFormatted = timestamp
    ? new Date(timestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex w-full justify-end"
    >
      <div className="group relative max-w-[85%] sm:max-w-[70%] space-y-1.5">
        <div className="flex items-center justify-end gap-1.5 font-mono text-[11px] text-[#737373]">
          <span className="uppercase tracking-wider">Vous</span>
          {timeFormatted && <span suppressHydrationWarning>• {timeFormatted}</span>}
        </div>
        <div className="rounded-2xl rounded-tr-md border border-[#2A2A2A] bg-[#111111] px-4 py-3 text-sm leading-relaxed text-white shadow-sm">
          <p className="whitespace-pre-wrap break-words">{message}</p>
        </div>
      </div>
    </motion.div>
  );
};
