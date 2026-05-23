'use client';

import React, { useRef, useEffect } from 'react';

interface HeatmapOverlayProps {
  mediaUrl: string;
  faceBbox?: [number, number, number, number] | null; // [x1, y1, x2, y2]
  isAudio?: boolean;
}

export const HeatmapOverlay: React.FC<HeatmapOverlayProps> = ({
  mediaUrl,
  faceBbox,
  isAudio = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (isAudio) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = mediaUrl;
    img.onload = () => {
      // Scale canvas to image dimensions
      canvas.width = img.naturalWidth || 600;
      canvas.height = img.naturalHeight || 400;

      // Draw original image background
      ctx.drawImage(img, 0, 0);

      // Draw bounding box if present
      if (faceBbox && faceBbox.length === 4) {
        const [x1, y1, x2, y2] = faceBbox;
        const width = x2 - x1;
        const height = y2 - y1;

        // Draw outer clinical bracket bounding corners
        ctx.strokeStyle = '#A32D2D'; // Red
        ctx.lineWidth = Math.max(3, Math.round(canvas.width / 200));
        ctx.strokeRect(x1, y1, width, height);

        // Draw corner brackets specifically
        ctx.fillStyle = '#A32D2D';
        const len = Math.max(10, Math.round(width / 6));
        const thickness = Math.max(4, Math.round(canvas.width / 150));
        
        // Top-left
        ctx.fillRect(x1 - thickness/2, y1 - thickness/2, len, thickness);
        ctx.fillRect(x1 - thickness/2, y1 - thickness/2, thickness, len);
        // Top-right
        ctx.fillRect(x2 - len + thickness/2, y1 - thickness/2, len, thickness);
        ctx.fillRect(x2 - thickness/2, y1 - thickness/2, thickness, len);
        // Bottom-left
        ctx.fillRect(x1 - thickness/2, y2 - thickness/2, len, thickness);
        ctx.fillRect(x1 - thickness/2, y2 - len + thickness/2, thickness, len);
        // Bottom-right
        ctx.fillRect(x2 - len + thickness/2, y2 - thickness/2, len, thickness);
        ctx.fillRect(x2 - thickness/2, y2 - len + thickness/2, thickness, len);

        // Draw threat overlay label
        ctx.font = `bold ${Math.max(12, Math.round(canvas.width / 40))}px monospace`;
        ctx.fillStyle = '#A32D2D';
        ctx.fillText('ANOMALOUS TEXTURE SIG', x1, y1 - 8);

        // Draw simulated neural GradCAM heat points inside bbox
        const gradient = ctx.createRadialGradient(
          x1 + width / 2, y1 + height / 2, Math.min(width, height) / 8,
          x1 + width / 2, y1 + height / 2, Math.min(width, height) / 2
        );
        gradient.addColorStop(0, 'rgba(163, 45, 45, 0.45)');
        gradient.addColorStop(0.5, 'rgba(217, 119, 6, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x1, y1, width, height);
      } else {
        // Draw overall image neural anomaly scanning sweep
        ctx.strokeStyle = 'rgba(12, 68, 124, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
      }
    };
    imageRef.current = img;
  }, [mediaUrl, faceBbox, isAudio]);

  if (isAudio) {
    return (
      <div className="w-full flex items-center justify-center p-8 bg-neutral-50 dark:bg-[#161616] rounded-card border border-thin-gray border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 select-none min-h-[220px]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5 justify-center">
            <span className="w-1.5 h-6 rounded bg-[#0C447C] animate-pulse"></span>
            <span className="w-1.5 h-10 rounded bg-[#0C447C] animate-pulse delay-75"></span>
            <span className="w-1.5 h-8 rounded bg-[#0C447C] animate-pulse delay-150"></span>
            <span className="w-1.5 h-12 rounded bg-[#0C447C] animate-pulse delay-100"></span>
            <span className="w-1.5 h-6 rounded bg-[#0C447C] animate-pulse delay-200"></span>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#888888]">
            Audio Waveform Forensics Active
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-full overflow-hidden rounded-card border border-[#E5E5E5]/60 dark:border-[#2D2D2D]/60 select-none shadow-sm flex items-center justify-center bg-black">
      <canvas
        ref={canvasRef}
        className="w-full h-auto object-contain max-h-[420px]"
      />
    </div>
  );
};
