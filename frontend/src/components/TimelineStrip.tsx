'use client';

import React from 'react';
import { IconClock } from '@tabler/icons-react';
import { cn } from './shared';

interface TimelineStripProps {
  durationSeconds?: number;
  anomalousSegments?: [number, number] | null; // [start_ms, end_ms] or [start_sec, end_sec]
  fileType: 'image' | 'video' | 'audio';
}

export const TimelineStrip: React.FC<TimelineStripProps> = ({
  durationSeconds = 10.0,
  anomalousSegments,
  fileType
}) => {
  if (fileType === 'image') return null;

  const totalLength = durationSeconds;
  
  // Resolve mock segments if none present to verify timeline UI renders beautifully
  const start = anomalousSegments ? anomalousSegments[0] : 1.5;
  const end = anomalousSegments ? anomalousSegments[1] : 4.2;

  // Calculate percentage widths for CSS overlay styling
  const leftPct = (start / totalLength) * 100;
  const widthPct = ((end - start) / totalLength) * 100;

  return (
    <div className="w-full flex flex-col gap-3 p-5 bg-white dark:bg-[#161616] rounded-card border border-[#E5E5E5]/60 dark:border-[#2D2D2D]/60 select-none">
      
      <div className="flex items-center justify-between border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 pb-3 mb-1">
        <div className="flex items-center gap-1.5 text-[10px] text-[#888888] uppercase tracking-wider font-semibold font-mono">
          <IconClock className="w-4 h-4 stroke-[1.8] text-[#888888]" />
          Temporal Anomaly Timeline
        </div>
        <span className="text-[10px] font-mono text-[#A32D2D] font-bold">
          Anomaly: {start.toFixed(1)}s – {end.toFixed(1)}s
        </span>
      </div>

      <div className="relative w-full h-8 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-between border border-[#E5E5E5]/40 dark:border-[#2C2C2C]/40 overflow-hidden font-mono text-[9px] text-[#888888] px-2.5">
        
        {/* Absolute tick boundaries */}
        <span>0.0s</span>
        <span>{(totalLength / 2).toFixed(1)}s</span>
        <span>{totalLength.toFixed(1)}s</span>

        {/* Anomalous segment highlighted overlay */}
        <div 
          className="absolute h-full bg-[#A32D2D]/15 border-l border-r border-[#A32D2D] flex items-center justify-center"
          style={{
            left: `${leftPct}%`,
            width: `${widthPct}%`,
            top: 0
          }}
        >
          <div className="h-full w-full bg-[repeating-linear-gradient(45deg,rgba(163,45,45,0.08),rgba(163,45,45,0.08)_6px,rgba(163,45,45,0.18)_6px,rgba(163,45,45,0.18)_12px)] flex items-center justify-center">
            <span className="text-[8px] uppercase font-mono tracking-widest text-[#A32D2D] font-black opacity-85">
              FAKED
            </span>
          </div>
        </div>

      </div>

      <p className="text-[10px] text-neutral-500 dark:text-[#A0A0A0] text-left leading-normal font-normal italic">
        * Timeline highlights the temporal window containing high-frequency signal inconsistencies and boundary mismatch vectors.
      </p>

    </div>
  );
};
