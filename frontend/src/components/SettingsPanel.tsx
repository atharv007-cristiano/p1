import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  IconSettings, 
  IconEye, 
  IconVolume, 
  IconLetterCase, 
  IconActivity, 
  IconHeartbeat,
  IconShieldCheck,
  IconAdjustments,
  IconMail,
  IconCpu,
  IconCheck,
  IconX,
  IconInfoCircle
} from '@tabler/icons-react';
import { useStore, SettingsState } from '../store';
import { Card, Button, Toggle, Badge, cn } from './shared';

// Validation Schema for Settings form using Zod
const settingsSchema = z.object({
  emailWebhook: z.string().url({ message: 'Please enter a valid HTTPS webhook URL' }).or(z.literal('')),
  slackWebhook: z.string().url({ message: 'Please enter a valid Slack webhook URL' }).or(z.literal('')),
  autoRejectThreshold: z.number().min(0.0).max(0.5, { message: 'Must be between 0.0 and 0.5' }),
  humanReviewThreshold: z.number().min(0.3).max(0.7, { message: 'Must be between 0.3 and 0.7' }),
  modelVersion: z.enum(['DeepShield-Full', 'DeepShield-Lite']),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export const SettingsPanel: React.FC = () => {
  const { settings, updateSettings } = useStore();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form hooks setup with Zod resolvers
  const { register, handleSubmit, control, watch, formState: { errors, isDirty } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      emailWebhook: settings.emailWebhook,
      slackWebhook: settings.slackWebhook,
      autoRejectThreshold: settings.autoRejectThreshold,
      humanReviewThreshold: settings.humanReviewThreshold,
      modelVersion: settings.modelVersion,
    }
  });

  const watchReject = watch('autoRejectThreshold', settings.autoRejectThreshold);
  const watchReview = watch('humanReviewThreshold', settings.humanReviewThreshold);

  const onSubmit = (data: SettingsFormValues) => {
    updateSettings(data);
    showToast('Configuration settings updated successfully.');
  };

  const handleTestWebhook = (type: 'email' | 'slack') => {
    showToast(`Sending test payload to ${type.toUpperCase()} webhook endpoint...`);
    setTimeout(() => {
      showToast(`Test payload accepted (Status 200 OK) for ${type.toUpperCase()} Webhook.`);
    }, 1500);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Module checklist definition
  const modules = [
    { id: 'vfm', name: 'Visual Forensics (VFM)', desc: 'EfficientNet-B7 spatial residual SRM checking.', icon: IconEye },
    { id: 'afm', name: 'Audio Forensics (AFM)', desc: 'RawNet3 synthetic voice vocoder tracking.', icon: IconVolume },
    { id: 'nscm', name: 'NLP Semantics (NSCM)', desc: 'Whisper-BERT speech-to-scene cross alignments.', icon: IconLetterCase },
    { id: 'badm', name: 'Behavioral Landmarks (BADM)', desc: 'BiLSTM landmark lip movement viseme DTW.', icon: IconActivity },
    { id: 'rppg', name: 'FakeCatcher rPPG liveness', desc: 'Facetrack remote cardiac liveness sensors.', icon: IconHeartbeat },
    { id: 'c2pa', name: 'C2PA 2.0 provenance checking', desc: 'Secure cryptographic content envelope audits.', icon: IconShieldCheck },
  ] as const;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-4 select-none pb-12 animate-slide-up">
      
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 pb-4">
        <div>
          <h2 className="text-base font-medium text-[#111111] dark:text-white leading-none">System Configuration</h2>
          <p className="text-[11px] text-[#888888] dark:text-[#A0A0A0] mt-1 font-medium">Fine-tune detection pipelines, decision gating levels, and external notifications</p>
        </div>
        
        {isDirty && (
          <Button size="sm" variant="primary" type="submit" className="animate-slide-up">
            Save Configurations
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left: Toggles Checklist */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Module switch checklist */}
          <Card className="bg-white dark:bg-[#161616] p-5 border-thin-gray flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs text-[#333333] dark:text-white font-medium border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 pb-2">
              <IconAdjustments className="w-4 h-4 text-[#0C447C] stroke-[1.5]" />
              <span>Active Forensic Modules</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modules.map((mod) => {
                const Icon = mod.icon;
                const isChecked = (settings as any)[mod.id];
                return (
                  <div 
                    key={mod.id}
                    className={cn(
                      "flex items-start justify-between p-3.5 rounded-elem border-thin-gray transition-colors",
                      isChecked ? "bg-[#FAFAFA] dark:bg-[#1C1C1C]" : "bg-transparent"
                    )}
                  >
                    <div className="flex gap-3 items-start pr-4">
                      <div className={cn("p-1.5 rounded-elem shrink-0 text-[#888888]", isChecked && "text-[#0C447C] dark:text-blue-400 bg-white dark:bg-[#111111] border-thin-gray")}>
                        <Icon className="w-4.5 h-4.5 stroke-[1.5]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-[#111111] dark:text-white leading-tight">{mod.name}</span>
                        <span className="text-[10px] text-[#888888] dark:text-[#A0A0A0] leading-normal mt-0.5 font-normal">{mod.desc}</span>
                      </div>
                    </div>
                    <Toggle 
                      checked={isChecked}
                      onChange={(val) => {
                        updateSettings({ [mod.id]: val });
                        showToast(`Modality: ${mod.name} ${val ? 'enabled' : 'disabled'}.`);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Webhook notification card */}
          <Card className="bg-white dark:bg-[#161616] p-5 border-thin-gray flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs text-[#333333] dark:text-white font-medium border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 pb-2">
              <IconMail className="w-4 h-4 text-[#0F6E56] stroke-[1.5]" />
              <span>Audit Dispatch Webhooks</span>
            </div>

            <div className="flex flex-col gap-4">
              {/* Email webhook URL */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[10px] text-[#888888] font-medium uppercase tracking-wider">
                  <span>Incident Webhook URL</span>
                  <button type="button" onClick={() => handleTestWebhook('email')} className="text-xs text-[#0C447C] dark:text-blue-400 hover:underline capitalize font-normal font-sans">Test Webhook</button>
                </div>
                <input 
                  type="text" 
                  {...register('emailWebhook')}
                  placeholder="https://api.enterprise.security/webhooks/deepshield"
                  className="w-full bg-transparent text-xs rounded-elem border border-[#E5E5E5] dark:border-[#2C2C2C] px-3 py-2 text-[#333333] dark:text-white focus:outline-none focus:border-[#0C447C]"
                />
                {errors.emailWebhook && (
                  <span className="text-[10px] text-[#A32D2D] font-medium">{errors.emailWebhook.message}</span>
                )}
              </div>

              {/* Slack webhook URL */}
              <div className="flex flex-col gap-1.5 border-t border-[#E5E5E5]/40 dark:border-[#2C2C2C]/40 pt-4">
                <div className="flex justify-between items-center text-[10px] text-[#888888] font-medium uppercase tracking-wider">
                  <span>Slack Dev Integration Webhook</span>
                  <button type="button" onClick={() => handleTestWebhook('slack')} className="text-xs text-[#0C447C] dark:text-blue-400 hover:underline capitalize font-normal font-sans">Test Webhook</button>
                </div>
                <input 
                  type="text" 
                  {...register('slackWebhook')}
                  placeholder="https://hooks.slack.com/services/T0000/B0000/XXXX"
                  className="w-full bg-transparent text-xs rounded-elem border border-[#E5E5E5] dark:border-[#2C2C2C] px-3 py-2 text-[#333333] dark:text-white focus:outline-none focus:border-[#0C447C]"
                />
                {errors.slackWebhook && (
                  <span className="text-[10px] text-[#A32D2D] font-medium">{errors.slackWebhook.message}</span>
                )}
              </div>
            </div>
          </Card>

        </div>

        {/* Right: Sliders & Server Config */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Sliders thresholds */}
          <Card className="bg-white dark:bg-[#161616] p-5 border-thin-gray flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs text-[#333333] dark:text-white font-medium border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 pb-2">
              <IconAdjustments className="w-4 h-4 text-[#D97706] stroke-[1.5]" />
              <span>Inference Score Thresholds</span>
            </div>

            <div className="flex flex-col gap-5 mt-1">
              {/* Auto Reject Threshold */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs text-[#333333] dark:text-[#E0E0E0]">
                  <span className="font-normal">Auto-Reject threshold</span>
                  <span className="font-mono font-medium">{watchReject}</span>
                </div>
                <input 
                  type="range"
                  min="0.0"
                  max="0.5"
                  step="0.05"
                  {...register('autoRejectThreshold', { valueAsNumber: true })}
                  className="w-full h-1 bg-[#E5E5E5] dark:bg-[#2C2C2C] rounded-pill appearance-none cursor-pointer accent-[#A32D2D]"
                />
                <span className="text-[9px] text-[#888888] font-normal leading-normal">
                  Scans below this score trigger webhooks and are rejected automatically.
                </span>
                {errors.autoRejectThreshold && (
                  <span className="text-[10px] text-[#A32D2D] font-medium">{errors.autoRejectThreshold.message}</span>
                )}
              </div>

              {/* Human Review Threshold */}
              <div className="flex flex-col gap-2 border-t border-[#E5E5E5]/40 dark:border-[#2C2C2C]/40 pt-4">
                <div className="flex justify-between text-xs text-[#333333] dark:text-[#E0E0E0]">
                  <span className="font-normal">Human-In-Loop bounds</span>
                  <span className="font-mono font-medium">{watchReview}</span>
                </div>
                <input 
                  type="range"
                  min="0.3"
                  max="0.7"
                  step="0.05"
                  {...register('humanReviewThreshold', { valueAsNumber: true })}
                  className="w-full h-1 bg-[#E5E5E5] dark:bg-[#2C2C2C] rounded-pill appearance-none cursor-pointer accent-[#D97706]"
                />
                <span className="text-[9px] text-[#888888] font-normal leading-normal">
                  Scans above reject but below this score are sent to human audit tables.
                </span>
                {errors.humanReviewThreshold && (
                  <span className="text-[10px] text-[#A32D2D] font-medium">{errors.humanReviewThreshold.message}</span>
                )}
              </div>
            </div>
          </Card>

          {/* GPU environments */}
          <Card className="bg-white dark:bg-[#161616] p-5 border-thin-gray flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs text-[#333333] dark:text-white font-medium border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 pb-2">
              <IconCpu className="w-4 h-4 text-[#888888] stroke-[1.5]" />
              <span>Inference Engine Environment</span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Model version dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-[#888888] font-medium uppercase tracking-wider">Model Weights Version</label>
                <select 
                  {...register('modelVersion')}
                  className="w-full bg-[#FFFFFF] dark:bg-[#161616] text-xs rounded-elem border border-[#E5E5E5] dark:border-[#2C2C2C] px-3 py-2 text-[#333333] dark:text-white focus:outline-none focus:border-[#0C447C]"
                >
                  <option value="DeepShield-Full">DeepShield-Full (IEEE Production)</option>
                  <option value="DeepShield-Lite">DeepShield-Lite (Mobile-Optimized)</option>
                </select>
              </div>

              {/* GPU Triton Toggle */}
              <div className="flex items-center justify-between border-t border-[#E5E5E5]/40 dark:border-[#2C2C2C]/40 pt-4 mt-2">
                <div className="flex flex-col pr-4">
                  <span className="text-xs font-medium text-[#111111] dark:text-white leading-none">GPU Inference Acceleration</span>
                  <span className="text-[9px] text-[#888888] mt-1 font-normal leading-normal">Bypass CPU fallback and use Triton model servers</span>
                </div>
                <Toggle 
                  checked={settings.gpuInference}
                  onChange={(val) => {
                    updateSettings({ gpuInference: val });
                    showToast(`Triton Server acceleration ${val ? 'active' : 'disabled (CPU fallback in use)'}.`);
                  }}
                />
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* Floating toast alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#161616] border border-[#0C447C]/30 text-white rounded-card shadow-lg p-3 flex items-center gap-3 animate-slide-up text-xs font-medium">
          <IconCheck className="w-4 h-4 text-emerald-400 font-medium" />
          <span>{toastMessage}</span>
          <button className="text-[#888888] hover:text-white" onClick={() => setToastMessage(null)}>✕</button>
        </div>
      )}

    </form>
  );
};
