'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconArrowLeft, IconBookOpen, IconAlertCircle } from '@tabler/icons-react';
import { Button, Badge } from '../../../components/shared';
import { TrustScoreGauge } from '../../../components/TrustScoreGauge';
import { GateDecisionBadge } from '../../../components/GateDecisionBadge';
import { ModalityBreakdown } from '../../../components/ModalityBreakdown';
import { TimelineStrip } from '../../../components/TimelineStrip';
import { FindingsGrid } from '../../../components/FindingsGrid';
import { HeatmapOverlay } from '../../../components/HeatmapOverlay';
import { DetectionResult, getJobDetails } from '../../../lib/api';

interface ResultsPageProps {
  params: {
    jobId: string;
  };
}

export default function ResultsPage({ params }: ResultsPageProps) {
  const router = useRouter();
  const jobId = params.jobId;

  const [scanResult, setScanResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        // 1. Try to load from session storage (instant fallback for local Gate 1 or sync runs)
        if (typeof window !== 'undefined') {
          const cached = sessionStorage.getItem(`job_${jobId}`);
          if (cached) {
            setScanResult(JSON.parse(cached));
            setLoading(false);
            return;
          }
        }

        // 2. Fetch from backend API
        const data = await getJobDetails(jobId);
        setScanResult(data);
      } catch (e: any) {
        console.error(e);
        setErrorMsg(e.response?.data?.detail || e.message || 'Failed to retrieve diagnostic job details.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [jobId]);

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto py-12 flex flex-col items-center justify-center gap-4 select-none">
        <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#0C447C] animate-spin" />
        <span className="text-[10px] uppercase font-mono tracking-widest text-[#888888]">
          Compiling Forensic Telemetry...
        </span>
      </div>
    );
  }

  if (errorMsg || !scanResult) {
    return (
      <div className="w-full max-w-md mx-auto py-12 flex flex-col items-center gap-4 text-center select-none">
        <IconAlertCircle className="w-10 h-10 text-[#A32D2D] stroke-[1.5]" />
        <h3 className="text-sm font-semibold">Diagnostic Report Unavailable</h3>
        <p className="text-xs text-[#888888]">{errorMsg || 'Target forensic ID could not be matched.'}</p>
        <Button size="sm" onClick={() => router.push('/')} className="mt-2">
          Return to Ingestion Panel
        </Button>
      </div>
    );
  }

  // Formatting display items
  const isAuthentic = scanResult.verdict === 'authentic';
  const isSynthetic = scanResult.verdict === 'synthetic';

  return (
    <div className="w-full max-w-5xl mx-auto px-4 select-none flex flex-col gap-6 animate-slide-up">
      
      {/* Upper Navigation back button and title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-medium text-[#111111] dark:text-white leading-none">
              Forensic Report: {scanResult.job_id}
            </h2>
            <Badge variant={isAuthentic ? 'success' : isSynthetic ? 'danger' : 'warning'}>
              {scanResult.verdict.toUpperCase()}
            </Badge>
          </div>
          <span className="text-[11px] text-[#888888] mt-1.5 font-medium block">
            Multi-modal verification compiled successfully inside {scanResult.latency_ms.total.toFixed(0)}ms.
          </span>
        </div>
        <Button 
          size="sm" 
          variant="ghost" 
          className="flex items-center gap-1.5 h-8 text-xs border border-[#E5E5E5]/40 dark:border-[#2C2C2C]/40" 
          onClick={() => router.push('/')}
        >
          <IconArrowLeft className="w-4 h-4 stroke-[1.5]" />
          Return to Ingestion Panel
        </Button>
      </div>

      {/* Main Grid content split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Verdict gauges, breakdowns, badges */}
        <div className="lg:col-span-1 flex flex-col gap-6 w-full">
          <TrustScoreGauge 
            score={scanResult.trust_score} 
            action={scanResult.action} 
            provenanceVerified={scanResult.grounding?.detected_text?.includes('C2PA') || false}
          />
          <GateDecisionBadge 
            gate={scanResult.gate_used} 
            processingNote={scanResult.processing_note} 
          />
          <ModalityBreakdown 
            scores={scanResult.gate2_scores} 
            fileType={scanResult.file_type}
          />
        </div>

        {/* Right Side: Heatmaps, evidence grids, timelines */}
        <div className="lg:col-span-2 flex flex-col gap-6 w-full">
          
          <div className="flex flex-col gap-2 text-left">
            <h3 className="text-xs uppercase font-mono tracking-widest text-[#888888] font-semibold">
              Spatial Anomaly Maps (GradCAM Grounding)
            </h3>
            <HeatmapOverlay 
              mediaUrl={scanResult.grounding?.manipulation_heatmap_url || '/placeholder_media.jpg'} 
              faceBbox={scanResult.grounding?.face_bbox} 
              isAudio={scanResult.file_type === 'audio'}
            />
          </div>

          <TimelineStrip 
            durationSeconds={scanResult.file_type === 'video' ? 10.0 : scanResult.file_type === 'audio' ? 5.0 : 1.0}
            anomalousSegments={scanResult.grounding?.audio_segment_ms}
            fileType={scanResult.file_type}
          />

          <div className="flex flex-col gap-3 text-left">
            <h3 className="text-xs uppercase font-mono tracking-widest text-[#888888] font-semibold">
              Gate 1 Local Check Findings
            </h3>
            <FindingsGrid findings={scanResult.gate1_findings} />
          </div>

        </div>

      </div>

    </div>
  );
}
