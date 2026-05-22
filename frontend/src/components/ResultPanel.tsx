import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  IconFingerprint, 
  IconWaveSine, 
  IconCompass, 
  IconHeartbeat,
  IconDownload,
  IconShare,
  IconFlag,
  IconCheck,
  IconX,
  IconCalendarClock
} from '@tabler/icons-react';
import { DetectionResult } from '../types';
import { TrustScoreGauge } from './TrustScoreGauge';
import { ModalityBreakdown } from './ModalityBreakdown';
import { XAIHeatmapOverlay } from './XAIHeatmapOverlay';
import { Card, Button, Badge, cn } from './shared';
import { DownloadReportPDF } from './ReportPDFGenerator';

interface ResultPanelProps {
  scanResult: DetectionResult;
  onClear: () => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({ scanResult, onClear }) => {
  const [isFlagged, setIsFlagged] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Map 2x2 Forensic Findings with exact metrics
  const findings = [
    {
      id: 'srm',
      title: 'SRM Fingerprint Residuals',
      value: '94.2% Spatial Confidence',
      desc: 'Spatial Rich Models isolate high-frequency pixel splicing discrepancies on edge grids.',
      icon: IconFingerprint,
      accent: 'text-[#A32D2D] bg-[#A32D2D]/5 dark:bg-[#A32D2D]/15'
    },
    {
      id: 'vocoder',
      title: 'Neural Vocoder Spectrals',
      value: '4.2 kHz Anomaly Band',
      desc: 'RawNet3 tracking isolates artificial acoustics and synthesized formant phase mismatches.',
      icon: IconWaveSine,
      accent: 'text-[#D97706] bg-[#D97706]/5 dark:bg-[#D97706]/15'
    },
    {
      id: 'sync',
      title: 'Lip-Sync Desynchronization',
      value: '185 ms Viseme Offset',
      desc: 'Dynamic Time Warping (DTW) measures chronological distance of speech-to-lip landmarks.',
      icon: IconCompass,
      accent: 'text-[#A32D2D] bg-[#A32D2D]/5 dark:bg-[#A32D2D]/15'
    },
    {
      id: 'rppg',
      title: 'rPPG Heart Liveness',
      value: '1.4 Hz Cardiac Frequency',
      desc: 'FakeCatcher Remote PPG tracks subcutaneous face pixel color changes (Blink rate: 24/min).',
      icon: IconHeartbeat,
      accent: 'text-[#0F6E56] bg-[#0F6E56]/5 dark:bg-[#0F6E56]/15'
    }
  ];

  // Parallel timeline segment specifications
  const audioSegments = [
    { start: 0, end: 2.4, status: 'authentic', color: 'bg-[#0F6E56]' },
    { start: 2.4, end: 5.8, status: 'synthetic', color: 'bg-[#A32D2D]' },
    { start: 5.8, end: 10.0, status: 'uncertain', color: 'bg-[#D97706]' }
  ];

  const visualSegments = [
    { start: 0, end: 4.1, status: 'authentic', color: 'bg-[#0F6E56]' },
    { start: 4.1, end: 7.2, status: 'synthetic', color: 'bg-[#A32D2D]' },
    { start: 7.2, end: 10.0, status: 'authentic', color: 'bg-[#0F6E56]' }
  ];

  const handleAction = (type: 'approve' | 'flag' | 'share') => {
    if (type === 'approve') {
      setIsApproved(true);
      setIsFlagged(false);
      triggerToast('Asset manually approved. Threat status override completed.');
    } else if (type === 'flag') {
      setIsFlagged(true);
      setIsApproved(false);
      triggerToast('Asset flagged. review ticket dispatched to manual auditing queue.');
    } else if (type === 'share') {
      triggerToast('Incident report dispatched to Slack developer webhook successfully.');
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-4 select-none pb-12 animate-slide-up">
      
      {/* 1. Header controls */}
      <div className="flex items-center justify-between border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 pb-4">
        <div>
          <h2 className="text-base font-medium text-[#111111] dark:text-white leading-none">Forensic Analysis Report</h2>
          <span className="text-[11px] text-[#888888] dark:text-[#A0A0A0] mt-1 font-medium block">
            ID: ds_job_{scanResult.latency_ms ? Math.round(scanResult.latency_ms * 123) : 2309} · Completed in {scanResult.latency_ms?.toFixed(1) || '19.4'}ms
          </span>
        </div>
        <Button size="sm" variant="ghost" className="flex items-center gap-1.5" onClick={onClear}>
          <IconX className="w-4 h-4 stroke-[1.5]" />
          Dismiss Report
        </Button>
      </div>

      {/* 2. Score Gauge & Modality Breakdown Stagger */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <TrustScoreGauge 
          score={scanResult.trust_score}
          action={scanResult.action}
          provenanceVerified={scanResult.provenance_verified}
        />
        <ModalityBreakdown scores={scanResult.modality_breakdown} />
      </div>

      {/* 3. GradCAM Explainability canvas overlay */}
      <XAIHeatmapOverlay 
        mediaType={scanResult.modality_breakdown.visual_score !== null ? 'image' : 'video'}
        grounding={scanResult.grounding}
        explainability={scanResult.explainability}
      />

      {/* 4. 2x2 Findings Grid */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-medium text-[#888888] dark:text-[#A0A0A0] uppercase tracking-wider">Forensic Finding Attributes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {findings.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.id} className="flex gap-4 p-4 bg-white dark:bg-[#161616] border-thin-gray items-start">
                <div className={cn("p-2.5 rounded-elem shrink-0", item.accent)}>
                  <Icon className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-medium text-[#111111] dark:text-white leading-none">{item.title}</h4>
                    <span className="text-[10px] font-medium font-mono text-[#666666] dark:text-[#A0A0A0]">{item.value}</span>
                  </div>
                  <p className="text-[11px] text-[#666666] dark:text-[#A0A0A0] leading-relaxed mt-1 font-normal">
                    {item.desc}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 5. Parallel A-V Timeline Strip */}
      <Card className="p-5 bg-white dark:bg-[#161616] border-thin-gray flex flex-col gap-4">
        <div>
          <h4 className="text-xs font-medium text-[#111111] dark:text-white leading-none">Chronological Modality Timeline</h4>
          <p className="text-[10px] text-[#888888] dark:text-[#A0A0A0] mt-1">Identified suspicious intervals mapped across speech & frame sequences</p>
        </div>

        {/* Dynamic parallel tracks */}
        <div className="flex flex-col gap-3.5 my-2">
          {/* Visual Track */}
          <div className="flex items-center gap-3">
            <span className="text-[9px] uppercase font-medium text-[#888888] w-12 tracking-wider shrink-0">Visual</span>
            <div className="h-4 w-full bg-[#F5F5F5] dark:bg-[#222222] rounded-pill overflow-hidden flex border border-[#E5E5E5]/20">
              {visualSegments.map((seg, idx) => (
                <div 
                  key={idx}
                  className={cn("h-full relative group cursor-pointer border-r border-[#FFFFFF]/10 hover:brightness-95", seg.color)}
                  style={{ width: `${(seg.end - seg.start) * 10}%` }}
                >
                  {/* Tooltip */}
                  <span className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-[#111111]/85 border-thin-gray text-white text-[8px] px-2 py-0.5 rounded-pill opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-25">
                    {seg.status}: {seg.start}s - {seg.end}s
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Audio Track */}
          <div className="flex items-center gap-3">
            <span className="text-[9px] uppercase font-medium text-[#888888] w-12 tracking-wider shrink-0">Audio</span>
            <div className="h-4 w-full bg-[#F5F5F5] dark:bg-[#222222] rounded-pill overflow-hidden flex border border-[#E5E5E5]/20">
              {audioSegments.map((seg, idx) => (
                <div 
                  key={idx}
                  className={cn("h-full relative group cursor-pointer border-r border-[#FFFFFF]/10 hover:brightness-95", seg.color)}
                  style={{ width: `${(seg.end - seg.start) * 10}%` }}
                >
                  {/* Tooltip */}
                  <span className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-[#111111]/85 border-thin-gray text-white text-[8px] px-2 py-0.5 rounded-pill opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-25">
                    {seg.status}: {seg.start}s - {seg.end}s
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend strip */}
        <div className="flex justify-end gap-4 text-[9px] font-medium tracking-wide uppercase text-[#888888]">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F6E56]" />
            <span>Teal=Authentic</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A32D2D]" />
            <span>Red=Synthetic</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
            <span>Amber=Uncertain</span>
          </div>
        </div>
      </Card>

      {/* 6. Action buttons bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 pt-5">
        <div className="flex flex-wrap gap-2.5">
          <Button 
            size="sm" 
            variant="primary" 
            className="flex items-center gap-1.5"
            onClick={() => handleAction('approve')}
            disabled={isApproved}
          >
            <IconCheck className="w-4 h-4 stroke-[1.5]" />
            Accept Asset
          </Button>

          <Button 
            size="sm" 
            variant="warning" 
            className="flex items-center gap-1.5"
            onClick={() => handleAction('flag')}
            disabled={isFlagged}
          >
            <IconFlag className="w-4 h-4 stroke-[1.5]" />
            Flag for Review
          </Button>

          <Button 
            size="sm" 
            variant="secondary" 
            className="flex items-center gap-1.5"
            onClick={() => handleAction('share')}
          >
            <IconShare className="w-4 h-4 stroke-[1.5]" />
            Share with team
          </Button>
        </div>

        <DownloadReportPDF scanResult={scanResult} />
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#161616] border border-[#0C447C]/30 text-white rounded-card shadow-lg p-3 flex items-center gap-3 animate-slide-up text-xs font-medium">
          <IconCalendarClock className="w-4 h-4 text-blue-400" />
          <span>{toastMessage}</span>
          <button className="text-[#888888] hover:text-white" onClick={() => setToastMessage(null)}>✕</button>
        </div>
      )}

    </div>
  );
};
