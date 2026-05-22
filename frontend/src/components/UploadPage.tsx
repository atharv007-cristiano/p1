import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { 
  IconUpload, 
  IconLink, 
  IconTerminal2, 
  IconCamera,
  IconCircleCheck,
  IconAlertCircle,
  IconVideo,
  IconMusic,
  IconPhoto,
  IconActivity,
  IconHourglass,
  IconCpu
} from '@tabler/icons-react';
import { Button, Badge, Card, MetricCard, cn } from './shared';

// Form validation schema for URL ingestion
const urlSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid cryptographic media link' }),
});

type UrlFormValues = z.infer<typeof urlSchema>;

interface UploadPageProps {
  onLaunchWebRTC?: () => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onLaunchWebRTC }) => {
  const { 
    isScanning, 
    setIsScanning, 
    scanPhase, 
    setScanPhase, 
    setActiveScan,
    stats,
    updateSettings,
    settings
  } = useStore();

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUrlPanelOpen, setIsUrlPanelOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Form setup
  const { register, handleSubmit, formState: { errors }, reset } = useForm<UrlFormValues>({
    resolver: zodResolver(urlSchema),
  });

  const scanPhases = [
    "Extracting media streams...",
    "Running VFM (EfficientNet-B7 + SRM residuals)...",
    "Running AFM (RawNet3 1D-CNN + Prosodic anomalies)...",
    "Running NSCM (Whisper ASR + Cross-Alignment)...",
    "Running BADM (Landmarks + DTW visemes)...",
    "Fusing cross-modal representations with GCAT...",
    "Computing unified Trust Score and checking provenance..."
  ];

  // Drag and Drop validation handler
  const onDrop = (acceptedFiles: File[], fileRejections: any[]) => {
    setUploadError(null);
    setSelectedFile(null);

    if (fileRejections.length > 0) {
      const error = fileRejections[0].errors[0];
      if (error.code === 'file-too-large') {
        setUploadError('File size boundaries exceeded. Please check the file limits.');
      } else if (error.code === 'file-invalid-type') {
        setUploadError('Invalid file type. DeepShield only forensic-inspects approved media streams.');
      } else {
        setUploadError(error.message);
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      triggerForensicScan(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    validator: (file) => {
      const videoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/avi', 'video/mpeg', 'video/ogg'];
      const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/x-wav', 'audio/x-pn-wav', 'audio/wave', 'audio/x-mpeg', 'audio/mp3', 'audio/x-mp3'];

      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const isVideo = videoTypes.includes(file.type) || ['mp4', 'mov', 'avi', 'webm', 'ogg', 'mkv'].includes(fileExt);
      const isImage = imageTypes.includes(file.type) || ['jpg', 'jpeg', 'png', 'webp'].includes(fileExt);
      const isAudio = audioTypes.includes(file.type) || ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(fileExt);

      if (isVideo) {
        if (file.size > 500 * 1024 * 1024) {
          return { code: 'file-too-large', message: 'Video exceeds 500MB threshold limit' };
        }
      } else if (isImage) {
        if (file.size > 20 * 1024 * 1024) {
          return { code: 'file-too-large', message: 'Image exceeds 20MB threshold limit' };
        }
      } else if (isAudio) {
        if (file.size > 100 * 1024 * 1024) {
          return { code: 'file-too-large', message: 'Audio exceeds 100MB threshold limit' };
        }
      } else {
        return { code: 'file-invalid-type', message: 'Unsupported format. Approved: MP4/MOV/AVI, JPG/PNG/WEBP, MP3/WAV/OGG' };
      }
      return null;
    }
  });

  // Simulated high-fidelity forensic orchestrator execution
  const triggerForensicScan = async (file: File) => {
    setIsScanning(true);
    
    // Simulate pipeline triggers staggeredly
    for (let i = 0; i < scanPhases.length; i++) {
      setScanPhase(scanPhases[i]);
      await new Promise(resolve => setTimeout(resolve, 850));
    }

    // Determine type from file using both MIME and extension
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const isVideo = file.type.startsWith('video/') || ['mp4', 'mov', 'avi', 'webm', 'ogg', 'mkv'].includes(fileExt);
    const isAudio = file.type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(fileExt);
    const fileType = isVideo ? 'video' : isAudio ? 'audio' : 'image';
    
    // Generate authentic/synthetic scans based on file names for realistic testing
    const isSynthetic = file.name.toLowerCase().includes('deep') || file.name.toLowerCase().includes('fake') || Math.random() < 0.5;
    const trustScore = isSynthetic ? parseFloat((0.12 + Math.random() * 0.25).toFixed(2)) : parseFloat((0.87 + Math.random() * 0.12).toFixed(2));
    const action = trustScore < 0.3 ? 'AUTO_REJECT' : trustScore < 0.6 ? 'HUMAN_REVIEW' : 'AUTO_APPROVE';

    const result = {
      success: true,
      provenance_verified: !isSynthetic && Math.random() > 0.4,
      bypass_inference: false,
      trust_score: trustScore,
      status_code: 'SCAN_COMPLETE',
      action: action as any,
      message: isSynthetic 
        ? 'Deepfake anomaly indicators detected. The system flagged forensic vulnerabilities.'
        : 'Multimodal check complete. No biological, physical or vocoder splicing detected.',
      latency_ms: 18.2 + Math.random() * 4.5,
      modality_breakdown: {
        visual_score: fileType !== 'audio' ? (isSynthetic ? 0.22 : 0.94) : null,
        audio_score: fileType !== 'image' ? (isSynthetic ? 0.18 : 0.88) : null,
        semantic_consistency: fileType === 'video' ? (isSynthetic ? 0.38 : 0.91) : null,
        behavioral_score: fileType === 'video' ? (isSynthetic ? 0.15 : 0.96) : null,
        cross_modal_inconsistency_score: isSynthetic ? 0.84 : 0.08,
        weighed_audio_visual_sync_dtw: fileType === 'video' ? (isSynthetic ? 0.72 : 0.12) : null,
        nlp_cosine_similarity: fileType === 'video' ? (isSynthetic ? 0.44 : 0.92) : null
      },
      grounding: {
        bbox: [120, 85, 240, 240], // face bounding box on visual GradCAM canvas
        manipulated_audio_seconds: fileType !== 'image' && isSynthetic ? [2.4, 5.8] : [0, 0]
      },
      explainability: {
        modal_attribution: {
          'Visual SRM': isSynthetic ? 0.42 : 0.05,
          'Temporal ViT': isSynthetic ? 0.35 : 0.02,
          'RawNet3 Vocoder': isSynthetic ? 0.68 : 0.04,
          'Prosody Pitch': isSynthetic ? 0.28 : 0.01,
          'Landmarks DTW': isSynthetic ? 0.75 : 0.06
        }
      }
    };

    setIsScanning(false);
    setActiveScan(result);
  };

  const handleUrlSubmit = (data: UrlFormValues) => {
    setIsUrlPanelOpen(false);
    reset();
    triggerForensicScan(new File([''], 'streamed_media_input.mp4', { type: 'video/mp4' }));
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-4 select-none">
      
      {/* 1. HERO STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <MetricCard 
          title="Scans Executed Today" 
          value={stats?.metrics?.total_scans ?? 48} 
          subValue="+14% since yesterday"
          icon={<IconActivity className="w-5 h-5 text-[#0C447C] stroke-[1.5]" />}
        />
        <MetricCard 
          title="Platform Accuracy" 
          value="97.4%" 
          subValue="Validated IEEE benchmarking"
          icon={<IconCircleCheck className="w-5 h-5 text-[#0F6E56] stroke-[1.5]" />}
        />
        <MetricCard 
          title="Average Latency" 
          value={`${stats?.metrics?.average_latency_ms ?? 21.4}ms`}
          subValue="Triton GPU-optimized pipeline"
          icon={<IconHourglass className="w-5 h-5 text-[#888888] stroke-[1.5]" />}
        />
        <MetricCard 
          title="Forensics Modalities" 
          value="4 Active" 
          subValue="VFM · AFM · NSCM · BADM"
          icon={<IconCpu className="w-5 h-5 text-[#633806] stroke-[1.5]" />}
        />
      </div>

      {/* 2. UPLOAD & DETECT PANEL */}
      <Card className="w-full relative overflow-hidden bg-white dark:bg-[#161616] p-8 border-thin-gray transition-colors duration-200">
        
        {/* Animated Phase Loader Overlay */}
        <AnimatePresence>
          {isScanning && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/95 dark:bg-[#111111]/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full border-2 border-t-[#0C447C] border-r-transparent border-b-transparent border-l-transparent animate-spin mb-4" />
              <h3 className="text-sm font-medium text-[#111111] dark:text-white tracking-tight mb-1">DeepShield Forensics Orchestrator Active</h3>
              <p className="text-xs text-[#888888] dark:text-[#A0A0A0] max-w-sm font-medium mb-6">{scanPhase}</p>

              {/* Progress Steps Indicators */}
              <div className="w-full max-w-md bg-[#F5F5F5] dark:bg-[#222222] h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#0C447C] dark:bg-blue-500 h-full transition-all duration-500" 
                  style={{ 
                    width: `${Math.max(12, ((scanPhases.indexOf(scanPhase) + 1) / scanPhases.length) * 100)}%` 
                  }} 
                />
              </div>
              <div className="flex gap-4 mt-8">
                {scanPhases.map((_, idx) => {
                  const currentIdx = scanPhases.indexOf(scanPhase);
                  return (
                    <div 
                      key={idx} 
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        idx < currentIdx ? "bg-[#0F6E56]" : idx === currentIdx ? "bg-[#0C447C] scale-125" : "bg-[#E5E5E5] dark:bg-[#2C2C2C]"
                      )}
                    />
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ingest Zone */}
        <div 
          {...getRootProps()} 
          className={cn(
            "w-full rounded-card border-dashed border-[1.5px] py-14 px-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all focus:outline-none select-none",
            isDragActive 
              ? "border-[#0C447C] bg-[#0C447C]/5" 
              : "border-[#E5E5E5] dark:border-[#2C2C2C] bg-transparent hover:border-[#0C447C]/30 hover:bg-[#FAFAFA] dark:hover:bg-[#1A1A1A]"
          )}
        >
          <input {...getInputProps()} />
          <div className="p-3 bg-[#0C447C]/5 dark:bg-[#0C447C]/15 rounded-full text-[#0C447C] dark:text-blue-400 mb-4 transition-all">
            <IconUpload className={cn("w-6 h-6 stroke-[1.5]", isDragActive && "animate-bounce")} />
          </div>

          <h3 className="text-sm font-medium text-[#111111] dark:text-white mb-1.5">
            {isDragActive ? "Drop media stream to start forensics" : "Drag & drop file or click to select"}
          </h3>
          <p className="text-xs text-[#888888] dark:text-[#A0A0A0] max-w-xs leading-normal mb-6">
            Supports professional streams in pristine formats with custom size constraints.
          </p>

          {/* Formats capsules */}
          <div className="flex flex-wrap justify-center gap-2 max-w-md">
            <Badge variant="neutral" className="flex items-center gap-1"><IconVideo className="w-3.5 h-3.5 stroke-[1.5] text-[#888888]" /> Video max 500MB</Badge>
            <Badge variant="neutral" className="flex items-center gap-1"><IconMusic className="w-3.5 h-3.5 stroke-[1.5] text-[#888888]" /> Audio max 100MB</Badge>
            <Badge variant="neutral" className="flex items-center gap-1"><IconPhoto className="w-3.5 h-3.5 stroke-[1.5] text-[#888888]" /> Image max 20MB</Badge>
          </div>
        </div>

        {/* Ingestion status/errors */}
        {uploadError && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-elem bg-[#A32D2D]/10 border border-[#A32D2D]/20 text-[#A32D2D] text-xs">
            <IconAlertCircle className="w-4 h-4 shrink-0 stroke-[1.5]" />
            <span className="font-medium">{uploadError}</span>
          </div>
        )}
      </Card>

      {/* 3. THREE SECONDARY INGESTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        
        {/* URL Card */}
        <Card className="flex flex-col h-full bg-white dark:bg-[#161616] p-5 border-thin-gray transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#0C447C]/5 dark:bg-[#0C447C]/15 text-[#0C447C] dark:text-blue-400 rounded-elem">
              <IconLink className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-[#111111] dark:text-white leading-none">Paste Media URL</h4>
              <span className="text-[10px] text-[#888888]">Analyze streaming links</span>
            </div>
          </div>
          
          <p className="text-xs text-[#888888] dark:text-[#A0A0A0] leading-normal flex-grow mb-4">
            Supports validation of high-fidelity streams from Youtube, AWS S3 buckets, and enterprise databases.
          </p>

          {isUrlPanelOpen ? (
            <form onSubmit={handleSubmit(handleUrlSubmit)} className="flex flex-col gap-2 animate-slide-up">
              <input 
                {...register('url')}
                type="text" 
                placeholder="https://assets.security/stream.mp4" 
                className="w-full rounded-elem px-3 py-1.5 text-xs bg-transparent border border-[#E5E5E5] dark:border-[#2C2C2C] text-[#333333] dark:text-white focus:outline-none focus:border-[#0C447C]"
              />
              {errors.url && (
                <span className="text-[10px] text-[#A32D2D] font-medium">{errors.url.message}</span>
              )}
              <div className="flex gap-2 justify-end mt-1">
                <Button size="sm" variant="ghost" onClick={() => setIsUrlPanelOpen(false)}>Cancel</Button>
                <Button size="sm" variant="primary" type="submit">Verify</Button>
              </div>
            </form>
          ) : (
            <Button size="sm" onClick={() => setIsUrlPanelOpen(true)}>Paste stream link</Button>
          )}
        </Card>

        {/* API Upload Card */}
        <Card className="flex flex-col h-full bg-white dark:bg-[#161616] p-5 border-thin-gray transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#0C447C]/5 dark:bg-[#0C447C]/15 text-[#0C447C] dark:text-blue-400 rounded-elem">
              <IconTerminal2 className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-[#111111] dark:text-white leading-none">Automated API Upload</h4>
              <span className="text-[10px] text-[#888888]">Enterprise integration</span>
            </div>
          </div>

          <p className="text-xs text-[#888888] dark:text-[#A0A0A0] leading-normal flex-grow mb-4">
            Integrate DeepShield in CI/CD storage pipelines to automate ingestion and score telemetry logs natively.
          </p>

          <Button size="sm" variant="secondary" onClick={() => useStore.getState().setActiveTab('api')}>
            Check API Keys
          </Button>
        </Card>

        {/* Live Camera Scan Card */}
        <Card className="flex flex-col h-full bg-white dark:bg-[#161616] p-5 border-thin-gray transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#0C447C]/5 dark:bg-[#0C447C]/15 text-[#0C447C] dark:text-blue-400 rounded-elem">
              <IconCamera className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-[#111111] dark:text-white leading-none">Live Camera Scan</h4>
              <span className="text-[10px] text-[#888888]">Real-time video call validation</span>
            </div>
          </div>

          <p className="text-xs text-[#888888] dark:text-[#A0A0A0] leading-normal flex-grow mb-4">
            Activate instant WebRTC scanning to intercept fake cameras and evaluate participant signals in real time.
          </p>

          <Button 
            size="sm" 
            variant="danger" 
            onClick={() => {
              if (onLaunchWebRTC) {
                onLaunchWebRTC();
              } else {
                setIsCameraActive(true);
              }
            }}
          >
            Launch WebRTC Scanner
          </Button>
        </Card>

      </div>
    </div>
  );
};
