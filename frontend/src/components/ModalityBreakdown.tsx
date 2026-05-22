import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  IconEye, 
  IconVolume, 
  IconLetterCase, 
  IconActivity, 
  IconRoute, 
  IconInfoCircle 
} from '@tabler/icons-react';
import { ModalityBreakdown as IModalityBreakdown } from '../types';
import { Card, cn } from './shared';

interface ModalityBreakdownProps {
  scores: IModalityBreakdown;
}

interface ModalityItem {
  id: string;
  name: string;
  score: number | null;
  icon: React.ComponentType<any>;
  architecture: string;
  description: string;
}

export const ModalityBreakdown: React.FC<ModalityBreakdownProps> = ({ scores }) => {
  const [hoveredModality, setHoveredModality] = useState<string | null>(null);

  // Map backend scores object to standard UI array of 5 modalities
  const modalities: ModalityItem[] = [
    {
      id: 'visual',
      name: 'Visual Forensics (VFM)',
      score: scores.visual_score,
      icon: IconEye,
      architecture: 'EfficientNet-B7 + SRM Residual ViT',
      description: 'Isolates high-frequency noise discrepancies and spatial manipulation artifacts.',
    },
    {
      id: 'audio',
      name: 'Audio Forensics (AFM)',
      score: scores.audio_score,
      icon: IconVolume,
      architecture: 'RawNet3 1D-CNN + Prosodic Pitch Analyzer',
      description: 'Traces neural vocoder patterns, synthetic vocal splices, and pitch irregularities.',
    },
    {
      id: 'nlp',
      name: 'NLP Semantics (NSCM)',
      score: scores.semantic_consistency !== null ? scores.semantic_consistency : scores.nlp_cosine_similarity,
      icon: IconLetterCase,
      architecture: 'Whisper-Large-v3 ASR + BERT/BLIP-2 Text Correlation',
      description: 'Validates semantic alignment between raw transcribed speech and visual sceneframes.',
    },
    {
      id: 'behavioral',
      name: 'Behavioral Biometrics (BADM)',
      score: scores.behavioral_score,
      icon: IconActivity,
      architecture: '68-point 3D Landmark BiLSTM Sequence model',
      description: 'Tracks physiological biometric flows including blink cadences and lip viseme offsets.',
    },
    {
      id: 'cross_modal',
      name: 'Cross-Modal Engine (CMIDE)',
      // Cross-modal is often an inconsistency score (higher = synthetic). 
      // We invert it here to represent it as a "Trust Score consistency" where higher is better.
      score: scores.cross_modal_inconsistency_score !== undefined 
        ? Math.max(0, 1 - scores.cross_modal_inconsistency_score) 
        : 0.92,
      icon: IconRoute,
      architecture: 'Gated Multi-Head Cross-Attention Fusion',
      description: 'Measures correlation synchronization costs between auditory and visual signals.',
    },
  ];

  // Helper to determine bar colors matching brand design constraints
  const getBarColor = (score: number) => {
    if (score < 0.3) return '#A32D2D'; // Red (Danger)
    if (score >= 0.3 && score <= 0.6) return '#D97706'; // Amber (Warning)
    return '#0F6E56'; // Teal (Success)
  };

  const getBarBgClass = (score: number) => {
    if (score < 0.3) return 'bg-[#A32D2D]/10';
    if (score >= 0.3 && score <= 0.6) return 'bg-[#D97706]/10';
    return 'bg-[#0F6E56]/10';
  };

  return (
    <Card className="flex flex-col gap-5 p-6 bg-white dark:bg-[#161616] rounded-card border-thin-gray transition-colors duration-200 select-none">
      
      {/* Title block */}
      <div>
        <h3 className="text-sm font-medium text-[#111111] dark:text-white leading-none">Multimodal Analysis Breakdown</h3>
        <p className="text-[11px] text-[#888888] dark:text-[#A0A0A0] mt-1">Forensic telemetry across independent neural modalities</p>
      </div>

      {/* Stack of horizontal modality bars */}
      <div className="flex flex-col gap-4">
        {modalities.map((item, index) => {
          const hasScore = item.score !== null;
          const scorePercent = hasScore ? Math.round(item.score! * 100) : 0;
          const activeColor = hasScore ? getBarColor(item.score!) : '#E5E5E5';
          const bgClass = hasScore ? getBarBgClass(item.score!) : 'bg-[#E5E5E5]/20';
          const IconComponent = item.icon;

          return (
            <div 
              key={item.id}
              className="relative flex flex-col gap-1.5"
              onMouseEnter={() => setHoveredModality(item.id)}
              onMouseLeave={() => setHoveredModality(null)}
            >
              
              {/* Header metrics */}
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-[#333333] dark:text-[#E0E0E0] font-medium leading-none">
                  <IconComponent className="w-4 h-4 stroke-[1.5] text-[#888888]" />
                  {item.name}
                </span>
                <span 
                  className="font-medium text-xs font-mono"
                  style={{ color: hasScore ? activeColor : '#888888' }}
                >
                  {hasScore ? `${scorePercent}%` : 'Degraded / NA'}
                </span>
              </div>

              {/* Progress Slider Track */}
              <div className={cn("h-2 w-full rounded-pill overflow-hidden relative", bgClass)}>
                {hasScore ? (
                  <motion.div
                    className="h-full rounded-pill"
                    style={{ backgroundColor: activeColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${scorePercent}%` }}
                    transition={{ duration: 0.8, delay: index * 0.05, ease: 'easeOut' }}
                  />
                ) : (
                  <div className="h-full w-full bg-[#E5E5E5] dark:bg-[#2C2C2C] opacity-40" />
                )}
              </div>

              {/* Custom High-Fidelity Tooltip Overlay on hover */}
              {hoveredModality === item.id && (
                <div className="absolute top-[32px] left-0 right-0 md:-left-2 md:-right-2 bg-white dark:bg-[#1E1E1E] border-thin-gray p-3 rounded-card shadow-lg z-20 animate-slide-up text-xs flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-[#0C447C] dark:text-blue-400 font-medium">
                    <IconInfoCircle className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span>Forensic Engine Attribution</span>
                  </div>
                  <div className="text-[#333333] dark:text-white mt-0.5">
                    <span className="font-medium">Model:</span> <span className="font-mono text-[#0F6E56] dark:text-teal-400">{item.architecture}</span>
                  </div>
                  <p className="text-[#666666] dark:text-[#A0A0A0] text-[10px] leading-relaxed mt-1 font-normal">
                    {item.description}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Color threshold legends and XAI metrics */}
      <div className="flex justify-between items-center border-t border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 pt-4 text-[10px] text-[#888888] font-medium tracking-wide uppercase select-none">
        <span>XAI Alert Bounds:</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#A32D2D]" />
            <span>&lt;30% Threat</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#D97706]" />
            <span>30-60% Review</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#0F6E56]" />
            <span>&gt;60% Secure</span>
          </div>
        </div>
      </div>

    </Card>
  );
};
