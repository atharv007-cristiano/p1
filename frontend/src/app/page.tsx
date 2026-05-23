'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DropZone } from '../components/DropZone';
import { ScanProgress } from '../components/ScanProgress';
import { runGate1Analysis } from '../components/Gate1PreFilter';
import { createGate1MockResult } from '../lib/gate1';
import { submitAssetForInference } from '../lib/api';
import { useStore } from '../store';
import { IconShieldCheck, IconCpu, IconInfoCircle } from '@tabler/icons-react';

export default function IngestionPage() {
  const router = useRouter();
  const { setActiveScan } = useStore();

  const [isScanning, setIsScanning] = useState(false);
  const [currentStep, setCurrentStep] = useState('Standby');
  const [percent, setPercent] = useState(0);

  // Define steps for progress feedback
  const [steps, setSteps] = useState([
    { label: 'Gate 1: Client Metadata & EXIF Forensics', percent: 0, status: 'pending' as const },
    { label: 'Gate 1: Content Cryptographic C2PA Verification', percent: 0, status: 'pending' as const },
    { label: 'Gate 1: Spectral SynthID Watermark & OCR Quad Scan', percent: 0, status: 'pending' as const },
    { label: 'Gate 1: Format Byte & Huffman Huffman Tables Audit', percent: 0, status: 'pending' as const },
    { label: 'Gate 2: Deep Forensic Escalation (FastAPI/PyTorch)', percent: 0, status: 'pending' as const }
  ]);

  const updateStepStatus = (index: number, status: 'pending' | 'active' | 'completed', stepPercent = 0) => {
    setSteps(prev => prev.map((s, idx) => {
      if (idx === index) {
        return { ...s, status, percent: stepPercent };
      }
      return s;
    }));
  };

  const handleFileAccepted = async (file: File) => {
    setIsScanning(true);
    setPercent(0);
    setCurrentStep('Reading file bytes...');

    // Reset stepper statuses
    setSteps(prev => prev.map(s => ({ ...s, status: 'pending', percent: 0 })));

    const startTime = Date.now();

    try {
      // 1. Run Gate 1 Client-Side parallel checks
      updateStepStatus(0, 'active', 20);
      const gate1Outcome = await runGate1Analysis(file, (stepLabel, stepPercent) => {
        setCurrentStep(stepLabel);
        
        // Map raw gate 1 progress to visual stepper feedback
        if (stepLabel.includes('EXIF')) {
          updateStepStatus(0, 'completed', 100);
          updateStepStatus(1, 'active', 40);
        } else if (stepLabel.includes('C2PA')) {
          updateStepStatus(1, 'completed', 100);
          updateStepStatus(2, 'active', 70);
        } else if (stepLabel.includes('Watermark')) {
          updateStepStatus(2, 'completed', 100);
          updateStepStatus(3, 'active', 90);
        } else if (stepLabel.includes('integrity')) {
          updateStepStatus(3, 'completed', 100);
        }
      });

      const gate1Latency = Date.now() - startTime;

      // 2. Evaluate Decision Thresholds (Gate 1 Score >= 0.85 or <= 0.15)
      if (!gate1Outcome.shouldEscalate) {
        setPercent(100);
        setCurrentStep('Liveness verified! Instant Gate 1 decision compiled.');
        
        // Wrap outcome in a clean result object and store in client state
        const localResult = createGate1MockResult(file, gate1Outcome, gate1Latency);
        setActiveScan(localResult);

        // Store result in sessionStorage so it can be fetched on the results page
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`job_${localResult.job_id}`, JSON.stringify(localResult));
        }

        setTimeout(() => {
          router.push(`/results/${localResult.job_id}`);
        }, 600);
        return;
      }

      // 3. Escalation to Gate 2 deep forensics
      setCurrentStep('Gate 1 returned ambiguous scores. Escalating to Gate 2 Deep Forensics...');
      updateStepStatus(4, 'active', 20);
      
      // Gradually step up the loader bar to show active remote compute processing
      const interval = setInterval(() => {
        setPercent(p => Math.min(p + 5, 88));
      }, 300);

      // Perform real server upload & neural inference
      const serverResult = await submitAssetForInference(
        file,
        false, // Sync analysis
        JSON.stringify(gate1Outcome.findings) // Pass Gate 1 findings as prior
      );

      clearInterval(interval);
      updateStepStatus(4, 'completed', 100);
      setPercent(100);
      setCurrentStep('Backend deep forensics verification complete.');

      // Save report details
      setActiveScan(serverResult);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`job_${serverResult.job_id}`, JSON.stringify(serverResult));
      }

      setTimeout(() => {
        router.push(`/results/${serverResult.job_id}`);
      }, 500);

    } catch (e: any) {
      console.error(e);
      setCurrentStep(`Pipeline error: ${e.response?.data?.detail || e.message || 'Inference failure'}`);
      setIsScanning(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-8 max-w-3xl mx-auto py-4 select-none">
      
      {/* Clinically styled product branding cards */}
      <div className="flex flex-col text-center items-center">
        <h1 className="text-2xl font-medium tracking-tight text-[#111111] dark:text-white leading-tight">
          DeepShield Forensic Ingestion
        </h1>
        <p className="text-xs text-[#888888] dark:text-[#A0A0A0] mt-2 font-normal max-w-[420px] leading-relaxed">
          Upload file streams to isolate frame anomalies, synthetic audio signatures, and digital watermarks in real-time.
        </p>
      </div>

      {isScanning ? (
        <ScanProgress 
          currentStepLabel={currentStep} 
          percent={percent} 
          steps={steps} 
        />
      ) : (
        <DropZone onFileAccepted={handleFileAccepted} isScanning={isScanning} />
      )}

      {/* Corporate trust disclaimer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 pt-6">
        <div className="flex flex-col gap-2 p-3 bg-neutral-50 dark:bg-[#161616] rounded-card border-thin-gray text-left">
          <IconShieldCheck className="w-5 h-5 stroke-[1.5] text-[#0F6E56]" />
          <h4 className="text-xs font-semibold">Zero-Latency Gate 1</h4>
          <p className="text-[10px] text-[#888888] leading-normal font-normal">
            Executes local WebAssembly FFT watermark and EXIF scanners inside the browser sandbox before calling servers.
          </p>
        </div>
        <div className="flex flex-col gap-2 p-3 bg-neutral-50 dark:bg-[#161616] rounded-card border-thin-gray text-left">
          <IconCpu className="w-5 h-5 stroke-[1.5] text-[#0C447C]" />
          <h4 className="text-xs font-semibold">FastAPI Gate 2</h4>
          <p className="text-[10px] text-[#888888] leading-normal font-normal">
            Triggers multi-branch neural architectures on target GPU clusters to analyze structural micro-anomalies.
          </p>
        </div>
        <div className="flex flex-col gap-2 p-3 bg-neutral-50 dark:bg-[#161616] rounded-card border-thin-gray text-left">
          <IconInfoCircle className="w-5 h-5 stroke-[1.5] text-[#D97706]" />
          <h4 className="text-xs font-semibold">Audit Records</h4>
          <p className="text-[10px] text-[#888888] leading-normal font-normal">
            All analysis runs are fully cryptographically hashed and cataloged inside secure enterprise database logs.
          </p>
        </div>
      </div>

    </div>
  );
}
