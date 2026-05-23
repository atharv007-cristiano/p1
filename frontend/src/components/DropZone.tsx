'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { IconUpload, IconVideo, IconVolume, IconPhoto, IconAlertCircle } from '@tabler/icons-react';
import { Button } from './shared';

interface DropZoneProps {
  onFileAccepted: (file: File) => void;
  isScanning?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileAccepted, isScanning }) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setErrorMsg(null);
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const extension = file.name.split('.').pop()?.toLowerCase();

    // Check sizes
    const max_video = 500 * 1024 * 1024;
    const max_audio = 100 * 1024 * 1024;
    const max_image = 20 * 1024 * 1024;

    const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(extension || '');
    const isAudio = ['mp3', 'wav', 'aac', 'ogg'].includes(extension || '');
    const isVideo = ['mp4', 'mov', 'avi', 'webm'].includes(extension || '');

    if (!isImage && !isAudio && !isVideo) {
      setErrorMsg('Unsupported file extension. Please select a valid Image, Audio, or Video asset.');
      return;
    }

    if (isImage && file.size > max_image) {
      setErrorMsg('Image files are restricted to a maximum size of 20MB.');
      return;
    }
    if (isAudio && file.size > max_audio) {
      setErrorMsg('Audio files are restricted to a maximum size of 100MB.');
      return;
    }
    if (isVideo && file.size > max_video) {
      setErrorMsg('Video assets are restricted to a maximum size of 500MB.');
      return;
    }

    onFileAccepted(file);
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled: isScanning,
  });

  return (
    <div className="w-full flex flex-col gap-4">
      <div
        {...getRootProps()}
        className={`w-full border-2 border-dashed rounded-card p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer select-none bg-transparent hover:bg-neutral-50 dark:hover:bg-[#151515] ${
          isDragActive
            ? 'border-[#0C447C] bg-[#0C447C]/5'
            : 'border-[#E5E5E5] dark:border-[#2D2D2D]'
        } ${isScanning ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />

        <div className="w-12 h-12 rounded-full bg-[#0C447C]/5 flex items-center justify-center mb-4 text-[#0C447C]">
          <IconUpload className="w-6 h-6 stroke-[1.5] animate-bounce" />
        </div>

        <h3 className="text-sm font-medium text-[#111111] dark:text-white leading-none">
          {isDragActive ? 'Drop asset to initialize forensics' : 'Drag & drop media assets'}
        </h3>
        <p className="text-xs text-[#888888] dark:text-[#A0A0A0] mt-1.5 font-normal max-w-[280px] leading-normal">
          Supports video (up to 500MB), audio (up to 100MB), and images (up to 20MB).
        </p>

        <div className="flex items-center gap-4 mt-6 text-[10px] uppercase font-mono tracking-wider text-[#888888]">
          <div className="flex items-center gap-1.5">
            <IconPhoto className="w-3.5 h-3.5 stroke-[1.5]" />
            Images
          </div>
          <div className="w-1 h-1 rounded-full bg-neutral-300"></div>
          <div className="flex items-center gap-1.5">
            <IconVolume className="w-3.5 h-3.5 stroke-[1.5]" />
            Audio
          </div>
          <div className="w-1 h-1 rounded-full bg-neutral-300"></div>
          <div className="flex items-center gap-1.5">
            <IconVideo className="w-3.5 h-3.5 stroke-[1.5]" />
            Video
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 bg-[#A32D2D]/5 border border-[#A32D2D]/20 text-[#A32D2D] text-xs rounded-card font-medium">
          <IconAlertCircle className="w-4 h-4 stroke-[1.5] shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
