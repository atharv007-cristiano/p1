import React, { useState } from 'react';
import { 
  IconShieldCheck, 
  IconKey, 
  IconUpload, 
  IconAdjustments, 
  IconCheck,
  IconArrowRight,
  IconArrowLeft,
  IconCpu
} from '@tabler/icons-react';
import { useStore } from '../store';
import { Card, Button, Badge, Modal, cn } from './shared';

export const OnboardingWizard: React.FC = () => {
  const { onboardingComplete, setOnboardingComplete, apiKey, settings, updateSettings } = useStore();
  const [step, setStep] = useState(1);
  const [copiedKey, setCopiedKey] = useState(false);
  const [simulatedFileUploaded, setSimulatedFileUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  if (onboardingComplete) return null;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleSimulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setSimulatedFileUploaded(true);
    }, 1500);
  };

  const handleComplete = () => {
    setOnboardingComplete(true);
  };

  return (
    <Modal
      isOpen={!onboardingComplete}
      onClose={() => {}}
      title="Configure DeepShield Ecosystem Setup"
      footerActions={
        <div className="flex justify-between items-center w-full select-none text-xs">
          {/* Left: Back button */}
          {step > 1 ? (
            <Button
              size="sm"
              variant="ghost"
              className="flex items-center gap-1 h-8"
              onClick={() => setStep(prev => prev - 1)}
            >
              <IconArrowLeft className="w-3.5 h-3.5" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {/* Right: Next / Finish */}
          {step < 3 ? (
            <Button
              size="sm"
              variant="primary"
              className="flex items-center gap-1 h-8"
              disabled={step === 2 && !simulatedFileUploaded}
              onClick={() => setStep(prev => prev + 1)}
            >
              Next Step
              <IconArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              className="flex items-center gap-1 h-8 bg-[#0F6E56] hover:bg-[#0B5341]"
              onClick={handleComplete}
            >
              <IconCheck className="w-3.5 h-3.5" />
              Activate DeepShield
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-5 select-none py-1">
        
        {/* Step Stepper Header */}
        <div className="flex justify-between items-center bg-[#F5F5F5] dark:bg-[#1A1A1A] px-4 py-2.5 rounded-elem border-thin-gray">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium border-thin-gray",
                step === i ? "bg-[#0C447C] text-white border-transparent" : 
                step > i ? "bg-[#0F6E56] text-white border-transparent" : "text-[#888888] bg-transparent"
              )}>
                {step > i ? <IconCheck className="w-3 h-3" /> : i}
              </span>
              <span className={cn(
                "text-[10px] uppercase tracking-wider font-medium hidden sm:inline",
                step === i ? "text-[#111111] dark:text-white" : "text-[#888888]"
              )}>
                {i === 1 ? 'Credentials' : i === 2 ? 'Verification' : 'Thresholds'}
              </span>
              {i < 3 && <span className="text-[#888888] mx-1 hidden sm:inline">/</span>}
            </div>
          ))}
        </div>

        {/* STEP 1: CONNECT API KEY */}
        {step === 1 && (
          <div className="flex flex-col gap-4 animate-slide-up">
            <div>
              <h4 className="text-xs font-medium text-[#111111] dark:text-white">Step 1: Secure API Key Integration</h4>
              <p className="text-xs text-[#888888] mt-1 font-normal leading-normal">
                DeepShield authenticates SDK scripts and backend workers using secret live credentials tokens. Copy yours below.
              </p>
            </div>

            <div className="flex flex-col gap-1.5 mt-1 bg-[#FAFAFA] dark:bg-[#111111] border-thin-gray p-4 rounded-elem">
              <span className="text-[9px] uppercase text-[#888888] font-medium tracking-wider">Secret API Token</span>
              <div className="flex items-center gap-2 bg-white dark:bg-[#161616] border-thin-gray px-3 py-2 rounded-elem">
                <span className="text-xs font-mono text-[#333333] dark:text-white truncate flex-1">{apiKey}</span>
                <Button size="sm" variant="secondary" className="h-7 text-[10px]" onClick={handleCopyKey}>
                  {copiedKey ? 'Copied!' : 'Copy Key'}
                </Button>
              </div>
            </div>

            <div className="flex gap-2 items-start text-xs text-[#888888] font-normal leading-relaxed mt-2">
              <IconKey className="w-5 h-5 text-[#0C447C] shrink-0 mt-0.5" />
              <span>
                Please treat this key as sensitive information. It authorizes programmatic scans from your external deployment nodes.
              </span>
            </div>
          </div>
        )}

        {/* STEP 2: RUN TEST UPLOAD */}
        {step === 2 && (
          <div className="flex flex-col gap-4 animate-slide-up">
            <div>
              <h4 className="text-xs font-medium text-[#111111] dark:text-white">Step 2: Sample Forensic Verification</h4>
              <p className="text-xs text-[#888888] mt-1 font-normal leading-normal">
                To test connection stability, let's trigger a simulated sample scan using test metadata packages.
              </p>
            </div>

            <Card className="flex flex-col items-center justify-center py-6 border-dashed border-[1.5px] border-[#E5E5E5] dark:border-[#2C2C2C] text-center bg-transparent">
              {isUploading ? (
                <>
                  <div className="w-8 h-8 rounded-full border border-t-[#0C447C] animate-spin mb-3" />
                  <span className="text-xs text-[#111111] dark:text-white font-medium">Running deep inference engines...</span>
                </>
              ) : simulatedFileUploaded ? (
                <>
                  <div className="p-2 bg-[#0F6E56]/10 text-[#0F6E56] rounded-full mb-3">
                    <IconShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-[#0F6E56] font-medium mb-1">Forensic Scan Success (Status 200 OK)</span>
                  <span className="text-[10px] font-mono text-[#888888]">Score: 0.94 (Authentic verified)</span>
                </>
              ) : (
                <>
                  <div className="p-2 bg-[#0C447C]/5 rounded-full mb-3">
                    <IconUpload className="w-6 h-6 text-[#0C447C]" />
                  </div>
                  <Button size="sm" variant="secondary" className="h-8" onClick={handleSimulateUpload}>
                    Upload Sample Asset
                  </Button>
                </>
              )}
            </Card>

            <div className="flex gap-2 items-start text-xs text-[#888888] font-normal leading-relaxed mt-1">
              <IconCpu className="w-5 h-5 text-[#0C447C] shrink-0 mt-0.5" />
              <span>
                Simulated upload validates active connection routes, extracts spatial maps, and tests GPU inference latency bounds.
              </span>
            </div>
          </div>
        )}

        {/* STEP 3: SET THRESHOLDS */}
        {step === 3 && (
          <div className="flex flex-col gap-4 animate-slide-up">
            <div>
              <h4 className="text-xs font-medium text-[#111111] dark:text-white">Step 3: Calibrate Security Gates</h4>
              <p className="text-xs text-[#888888] mt-1 font-normal leading-normal">
                Determine the automated boundaries for blocking deepfakes and dispatching reviews.
              </p>
            </div>

            <div className="flex flex-col gap-5 mt-2 bg-[#FAFAFA] dark:bg-[#111111] p-4 rounded-elem border-thin-gray">
              {/* Slider 1 */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-[#333333] dark:text-white">
                  <span className="font-normal">Auto-Reject threshold</span>
                  <span className="font-mono font-medium">{settings.autoRejectThreshold}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.5"
                  step="0.05"
                  value={settings.autoRejectThreshold}
                  onChange={(e) => updateSettings({ autoRejectThreshold: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-[#E5E5E5] dark:bg-[#2C2C2C] rounded-pill cursor-pointer accent-[#A32D2D]"
                />
              </div>

              {/* Slider 2 */}
              <div className="flex flex-col gap-1.5 border-t border-[#E5E5E5]/40 dark:border-[#2C2C2C]/40 pt-4">
                <div className="flex justify-between text-xs text-[#333333] dark:text-white">
                  <span className="font-normal">Human-In-Loop bounds</span>
                  <span className="font-mono font-medium">{settings.humanReviewThreshold}</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="0.7"
                  step="0.05"
                  value={settings.humanReviewThreshold}
                  onChange={(e) => updateSettings({ humanReviewThreshold: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-[#E5E5E5] dark:bg-[#2C2C2C] rounded-pill cursor-pointer accent-[#D97706]"
                />
              </div>
            </div>

            <div className="flex gap-2 items-start text-xs text-[#888888] font-normal leading-relaxed mt-1">
              <IconAdjustments className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
              <span>
                Calibrating these sliders directly controls the Tiered Gateway pattern. You can refine these limits anytime in Configuration.
              </span>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
};
