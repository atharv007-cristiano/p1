import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { IconShieldCheck, IconShield } from '@tabler/icons-react';
import { Badge, cn } from './shared';

interface TrustScoreGaugeProps {
  score: number; // [0.0, 1.0]
  action: 'AUTO_APPROVE' | 'AUTO_REJECT' | 'HUMAN_REVIEW';
  provenanceVerified?: boolean;
}

export const TrustScoreGauge: React.FC<TrustScoreGaugeProps> = ({
  score,
  action,
  provenanceVerified = false,
}) => {
  // Animating the score count-up
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest * 100));
  const [displayPercent, setDisplayPercent] = useState(0);

  useEffect(() => {
    // Reset to 0 then animate to the score
    count.set(0);
    const controls = animate(count, score, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplayPercent(Math.round(latest * 100))
    });
    return () => controls.stop();
  }, [score, count]);

  // Determine dynamic colors and texts
  let strokeColor = '#0F6E56'; // Default Teal (Success)
  let verdictLabel = 'Authentic liveness verified';
  let badgeVariant: 'success' | 'danger' | 'warning' | 'info' = 'success';
  let Icon = IconShieldCheck;

  if (score < 0.3) {
    strokeColor = '#A32D2D'; // Red (Danger)
    verdictLabel = 'Synthetic — auto-rejected';
    badgeVariant = 'danger';
    Icon = IconShield;
  } else if (score >= 0.3 && score <= 0.6) {
    strokeColor = '#D97706'; // Amber (Warning - matching clinical branding orange)
    verdictLabel = 'Human review needed';
    badgeVariant = 'warning';
    Icon = IconShield;
  }

  if (provenanceVerified) {
    verdictLabel = 'Authentic — provenance verified';
    badgeVariant = 'success';
  }

  // SVG parameters for standard semi-circle or full arc
  const radius = 70;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  // Arc length: Let's do a full circular arc
  const strokeDashoffset = circumference - (score * circumference);

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-white dark:bg-[#161616] rounded-card border-thin-gray transition-all select-none">
      
      {/* Header title */}
      <div className="w-full flex items-center justify-between">
        <span className="text-xs text-[#888888] dark:text-[#A0A0A0] uppercase tracking-wider font-medium">Verdict Engine</span>
        <Icon className={cn("w-5 h-5 stroke-[1.5]", 
          badgeVariant === 'success' ? 'text-[#0F6E56]' : 
          badgeVariant === 'danger' ? 'text-[#A32D2D]' : 'text-[#D97706]'
        )} />
      </div>

      {/* Dynamic radial SVG arc gauge */}
      <div className="relative flex items-center justify-center w-40 h-40">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="rgba(12, 68, 124, 0.05)"
            strokeWidth={strokeWidth}
          />
          {/* Active colored arc */}
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center score indicator */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-medium tracking-tight text-[#111111] dark:text-white">
            {displayPercent / 100}
          </span>
          <span className="text-[10px] text-[#888888] dark:text-[#A0A0A0] uppercase tracking-wider font-medium mt-0.5">
            Trust Score
          </span>
        </div>
      </div>

      {/* Verdict & Badge summary info */}
      <div className="flex flex-col items-center gap-2 text-center w-full">
        <Badge variant={badgeVariant} className="px-3 py-1 text-xs">
          {verdictLabel}
        </Badge>
        <p className="text-xs text-[#666666] dark:text-[#A0A0A0] max-w-[200px] leading-normal font-normal">
          {badgeVariant === 'success' && 'Media stream exhibits typical physiological and provenance signatures of human recording.'}
          {badgeVariant === 'danger' && 'Forensic engine isolated distinct GAN/Diffusion frame fingerprints and vocoder patterns.'}
          {badgeVariant === 'warning' && 'Borderline consistency detected. Dispatched to Human-In-The-Loop review queue.'}
        </p>
      </div>

      {/* Threshold indicator sliders */}
      <div className="w-full flex flex-col gap-2 border-t border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 pt-4">
        <div className="flex justify-between text-[9px] text-[#888888] font-medium uppercase tracking-wider">
          <span>0.0 Threat</span>
          <span>0.3</span>
          <span>0.6</span>
          <span>1.0 Verified</span>
        </div>
        <div className="h-1.5 w-full rounded-pill bg-[#F5F5F5] dark:bg-[#222222] relative flex overflow-hidden">
          <div className="h-full bg-[#A32D2D]/20 border-r border-[#A32D2D]/10" style={{ width: '30%' }}></div>
          <div className="h-full bg-[#D97706]/20 border-r border-[#D97706]/10" style={{ width: '30%' }}></div>
          <div className="h-full bg-[#0F6E56]/20" style={{ width: '40%' }}></div>
          
          {/* Bounding tick indicator */}
          <motion.div 
            className="absolute w-2 h-2 rounded-full bg-[#111111] dark:bg-white border border-[#E5E5E5] dark:border-[#2C2C2C] shadow-sm -top-[1px] transition-all"
            style={{ left: `calc(${score * 100}% - 4px)` }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>
      
    </div>
  );
};
