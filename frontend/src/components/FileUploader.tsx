import React, { useState, useRef } from 'react';
import { Upload, FileVideo, FileAudio, FileImage, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { DetectionResult } from '../types';

interface FileUploaderProps {
  onScanComplete: (result: DetectionResult | { status: string; job_id: string }) => void;
  onScanStart: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onScanComplete, onScanStart }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [asyncMode, setAsyncMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setErrorMessage(null);
    const mime = file.type;
    const size = file.size;

    const maxVideo = 500 * 1024 * 1024;
    const maxAudio = 100 * 1024 * 1024;
    const maxImage = 20 * 1024 * 1024;

    if (mime.includes('video')) {
      if (size > maxVideo) {
        setErrorMessage('Video exceeds maximum size limit of 500MB.');
        return false;
      }
    } else if (mime.includes('audio')) {
      if (size > maxAudio) {
        setErrorMessage('Audio exceeds maximum size limit of 100MB.');
        return false;
      }
    } else if (mime.includes('image')) {
      if (size > maxImage) {
        setErrorMessage('Image exceeds maximum size limit of 20MB.');
        return false;
      }
    } else {
      setErrorMessage('Unsupported file format. Please upload an image, audio, or video asset.');
      return false;
    }
    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const submitFile = async () => {
    if (!selectedFile) return;
    setLoading(true);
    onScanStart();

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('async_processing', asyncMode ? 'true' : 'false');

    try {
      const response = await fetch('/api/v1/detect', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Inference engine failed.');
      }

      const result = await response.json();
      onScanComplete(result);
      setSelectedFile(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Upload connection broke.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Forensic Ingestion Ingest</h2>
          <p className="text-xs text-slate-400">Upload media assets to trigger neural evaluations</p>
        </div>
        
        {/* Toggle options for async processing */}
        <label className="flex items-center gap-2 cursor-pointer bg-slate-900 border border-slate-800 rounded-md px-3 py-1 text-xs">
          <input 
            type="checkbox" 
            checked={asyncMode} 
            onChange={(e) => setAsyncMode(e.target.checked)}
            className="rounded border-slate-800 text-purple-600 bg-slate-950 focus:ring-0 focus:ring-offset-0"
          />
          <span className="text-slate-300">Queue Asynchronously</span>
        </label>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerUpload}
        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 ${
          isDragActive 
            ? 'border-purple-500 bg-purple-500/10' 
            : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,audio/*,video/*"
          onChange={handleChange}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center gap-2">
            {selectedFile.type.includes('video') && <FileVideo className="h-12 w-12 text-blue-500" />}
            {selectedFile.type.includes('audio') && <FileAudio className="h-12 w-12 text-green-500" />}
            {selectedFile.type.includes('image') && <FileImage className="h-12 w-12 text-purple-500" />}
            <span className="text-slate-200 text-sm font-medium mt-2">{selectedFile.name}</span>
            <span className="text-slate-400 text-xs">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
          </div>
        ) : (
          <>
            <div className="p-4 bg-slate-900/60 rounded-full border border-slate-800">
              <Upload className="h-7 w-7 text-slate-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-200">Drag & Drop media here</p>
              <p className="text-xs text-slate-400 mt-1">or click to browse local volumes</p>
            </div>
            <p className="text-[10px] text-slate-500 text-center max-w-sm">
              Supports MP4, MKV (max 500MB), WAV, MP3 (max 100MB), JPG, PNG (max 20MB)
            </p>
          </>
        )}
      </div>

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">{errorMessage}</p>
        </div>
      )}

      {selectedFile && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            submitFile();
          }}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/30"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Executing Neural DeepShield Pipeline...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Ingest & Initialize Forensics
            </span>
          )}
        </button>
      )}
    </div>
  );
};
