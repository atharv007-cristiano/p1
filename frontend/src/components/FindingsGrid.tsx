'use client';

import React from 'react';
import { IconCheck, IconAlertTriangle, IconShieldCheck, IconLock } from '@tabler/icons-react';
import { Finding } from '../lib/api';
import { cn } from './shared';

interface FindingsGridProps {
  findings: Finding[];
}

export const FindingsGrid: React.FC<FindingsGridProps> = ({ findings }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full select-none">
      {findings.map((finding, idx) => {
        const isAuthentic = finding.score > 0.3;
        const isSynthetic = finding.score < -0.3;
        const isNeutral = !isAuthentic && !isSynthetic;

        let borderClass = 'border-[#E5E5E5]/60 dark:border-[#2D2D2D]/60';
        let bgClass = 'bg-white dark:bg-[#161616]';
        let textColor = 'text-[#111111] dark:text-white';
        let statusText = 'Neutral Signal';
        let Icon = IconAlertTriangle;
        let iconBg = 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500';

        if (isAuthentic) {
          borderClass = 'border-[#0F6E56]/20';
          bgClass = 'bg-[#0F6E56]/2 dark:bg-[#0F6E56]/1';
          textColor = 'text-[#0F6E56]';
          statusText = 'Verified Human';
          Icon = IconShieldCheck;
          iconBg = 'bg-[#0F6E56]/10 text-[#0F6E56]';
        } else if (isSynthetic) {
          borderClass = 'border-[#A32D2D]/20';
          bgClass = 'bg-[#A32D2D]/2 dark:bg-[#A32D2D]/1';
          textColor = 'text-[#A32D2D]';
          statusText = 'Threat Isolated';
          Icon = IconAlertTriangle;
          iconBg = 'bg-[#A32D2D]/10 text-[#A32D2D]';
        }

        return (
          <div
            key={idx}
            className={cn(
              "p-5 rounded-card border flex gap-4 transition-all text-left",
              borderClass,
              bgClass
            )}
          >
            {/* Left side circular status icon */}
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm", iconBg)}>
              <Icon className="w-5 h-5 stroke-[1.8]" />
            </div>

            {/* Right side textual details */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#888888]">
                    {finding.check.replace('_', ' ')}
                  </span>
                  <span className={cn("text-[9px] uppercase font-mono tracking-wider font-semibold px-2 py-0.5 rounded-pill", iconBg)}>
                    {statusText}
                  </span>
                </div>

                <h4 className="text-xs font-semibold mt-1.5 text-neutral-900 dark:text-neutral-100">
                  {finding.result.replace(/_/g, ' ').toUpperCase()}
                </h4>

                <p className="text-[11px] text-neutral-500 dark:text-[#A0A0A0] mt-1.5 leading-relaxed font-normal">
                  {finding.detail}
                </p>
              </div>

              {/* Attribution and priority weights */}
              <div className="flex items-center gap-4 mt-4 border-t border-[#E5E5E5]/40 dark:border-[#2C2C2C]/40 pt-2.5 text-[9px] text-[#888888] font-mono">
                <span>Weight: {(finding.weight * 100).toFixed(0)}%</span>
                <div className="w-1 h-1 rounded-full bg-neutral-300"></div>
                <span>Score: {finding.score.toFixed(2)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
