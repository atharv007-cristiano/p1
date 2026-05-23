'use client';

import React from 'react';
import { cn } from './shared';

interface GateDecisionBadgeProps {
  gate: 1 | 2;
  processingNote?: string;
  className?: string;
}

export const GateDecisionBadge: React.FC<GateDecisionBadgeProps> = ({
  gate,
  processingNote,
  className
}) => {
  return (
    <div className={cn(
      "flex flex-col gap-1.5 p-3 rounded-card border transition-all select-none text-left",
      gate === 1 
        ? "bg-[#0F6E56]/5 border-[#0F6E56]/20 text-[#0F6E56]" 
        : "bg-[#0C447C]/5 border-[#0C4C8C]/20 text-[#0C447C]",
      className
    )}>
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-2 h-2 rounded-full animate-pulse",
          gate === 1 ? "bg-[#0F6E56]" : "bg-[#0C447C]"
        )} />
        <span className="text-[10px] uppercase font-mono tracking-wider font-semibold">
          {gate === 1 ? "Gate 1: Client Pre-Filter Resolved" : "Gate 2: Escalated Deep Forensics"}
        </span>
      </div>
      <p className="text-[11px] font-normal leading-normal opacity-90 text-[#333333] dark:text-[#E0E0E0]">
        {gate === 1 
          ? "This asset was fully resolved in the browser. Zero server processing overhead was utilized."
          : "Local checks returned ambiguous margins. Scaled to backend FastAPI + PyTorch neural models."}
      </p>
      {processingNote && (
        <span className="text-[10px] italic font-normal opacity-70 mt-1 block">
          Telemetry: {processingNote}
        </span>
      )}
    </div>
  );
};
