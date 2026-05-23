'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { IconCircleCheck, IconCircleDot, IconCircle } from '@tabler/icons-react';
import { cn } from './shared';

interface ScanStep {
  label: string;
  percent: number;
  status: 'pending' | 'active' | 'completed';
}

interface ScanProgressProps {
  currentStepLabel: string;
  percent: number;
  steps: ScanStep[];
}

export const ScanProgress: React.FC<ScanProgressProps> = ({
  currentStepLabel,
  percent,
  steps
}) => {
  return (
    <div className="w-full flex flex-col gap-6 p-6 bg-white dark:bg-[#161616] rounded-card border border-[#E5E5E5]/60 dark:border-[#2D2D2D]/60 select-none">
      
      {/* Header telemetry info */}
      <div className="flex items-center justify-between border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 pb-3">
        <span className="text-[10px] text-[#888888] uppercase tracking-wider font-semibold font-mono">
          Orchestration Telemetry
        </span>
        <span className="text-[11px] font-mono font-medium text-[#0C447C]">
          {percent}% Complete
        </span>
      </div>

      {/* Primary diagnostic bar */}
      <div className="w-full h-1.5 rounded-pill bg-[#F5F5F5] dark:bg-[#222222] overflow-hidden relative">
        <motion.div 
          className="h-full bg-[#0C447C] rounded-pill"
          style={{ width: `${percent}%` }}
          initial={{ width: '0%' }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      <div className="text-xs text-[#111111] dark:text-white font-medium text-left leading-normal italic">
        Current thread: <span className="text-[#0C447C] dark:text-blue-400 not-italic font-semibold">{currentStepLabel}</span>
      </div>

      {/* Vertical Stepper list */}
      <div className="flex flex-col gap-4 mt-2">
        {steps.map((step, idx) => {
          let Icon = IconCircle;
          let iconColor = 'text-neutral-300 dark:text-neutral-700';

          if (step.status === 'completed') {
            Icon = IconCircleCheck;
            iconColor = 'text-[#0F6E56]';
          } else if (step.status === 'active') {
            Icon = IconCircleDot;
            iconColor = 'text-[#0C447C] animate-pulse';
          }

          return (
            <div 
              key={idx}
              className={cn(
                "flex items-center gap-3 transition-opacity",
                step.status === 'pending' ? 'opacity-40' : 'opacity-100'
              )}
            >
              <Icon className={cn("w-4.5 h-4.5 stroke-[1.8] shrink-0", iconColor)} />
              <div className="flex-1 flex justify-between items-center text-left text-[11px]">
                <span className={cn(
                  "font-medium",
                  step.status === 'active' ? 'text-[#0C447C] font-semibold' : 'text-[#333333] dark:text-[#CCCCCC]'
                )}>
                  {step.label}
                </span>
                <span className="font-mono text-[9px] text-[#888888]">
                  {step.status === 'completed' && '100%'}
                  {step.status === 'active' && `${step.percent}%`}
                  {step.status === 'pending' && 'Queued'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
