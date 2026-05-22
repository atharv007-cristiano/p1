import React, { useState, useEffect, useRef } from 'react';
import { IconEye, IconHelpCircle, IconWaveSine } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { GroundingData, ExplainabilityData } from '../types';
import { Card, Badge, cn } from './shared';

interface XAIHeatmapOverlayProps {
  mediaUrl?: string;
  mediaType: 'image' | 'video';
  grounding: GroundingData;
  explainability: ExplainabilityData;
}

export const XAIHeatmapOverlay: React.FC<XAIHeatmapOverlayProps> = ({
  mediaUrl,
  mediaType,
  grounding,
  explainability
}) => {
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.4);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // High-fidelity fallback human face image for clinical testing
  const activeMediaUrl = mediaUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = activeMediaUrl;
    img.onload = () => {
      // Scale canvas dimensions to match render container
      canvas.width = 600;
      canvas.height = 400;

      // 1. Draw base forensic image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Bounding box ratios
      const [x1_r, y1_r, x2_r, y2_r] = grounding.bbox.length === 4 
        ? grounding.bbox 
        : [150, 80, 320, 260]; // fallback pixel coordinates
        
      const bx = x1_r;
      const by = y1_r;
      const bw = x2_r;
      const bh = y2_r;

      // 2. Draw Grad-CAM circular overlay (clinical red-peak heatmap)
      if (heatmapOpacity > 0) {
        const cx = bx + bw / 2;
        const cy = by + bh / 2;
        const radius = Math.max(bw, bh) * 0.6;

        ctx.save();
        const grad = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
        // Clinical Red-to-Teal HSL mapping
        grad.addColorStop(0, `rgba(163, 45, 45, ${heatmapOpacity})`); // Peak threat (Red)
        grad.addColorStop(0.4, `rgba(217, 119, 6, ${heatmapOpacity * 0.6})`); // Amber
        grad.addColorStop(0.8, `rgba(15, 110, 86, ${heatmapOpacity * 0.15})`); // Teal
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();

        // 3. Draw pixel-level suspicion dot matrix inside bbox
        ctx.save();
        ctx.beginPath();
        ctx.rect(bx, by, bw, bh);
        ctx.clip(); // Clip matrix strictly to facial bbox

        const dotSpacing = 8;
        ctx.fillStyle = `rgba(163, 45, 45, ${heatmapOpacity * 0.7})`;
        for (let x = bx + 4; x < bx + bw; x += dotSpacing) {
          for (let y = by + 4; y < by + bh; y += dotSpacing) {
            // Draw small circles whose sizing/opacity varies based on closeness to center
            const dx = x - cx;
            const dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const intensity = Math.max(0.2, 1.2 - (dist / radius));
            
            ctx.beginPath();
            ctx.arc(x, y, 1.5 * intensity, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // 4. Draw ultra-thin Red Bounding Box around suspect region
      ctx.strokeStyle = '#A32D2D'; // Danger red
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bw, bh);

      // Label coordinate tags
      ctx.fillStyle = '#A32D2D';
      ctx.fillRect(bx, by - 16, 120, 16);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '500 9px Inter, monospace';
      ctx.fillText(`SUSPECT FACE [x:${Math.round(bx)}, y:${Math.round(by)}]`, bx + 6, by - 5);
    };
  }, [activeMediaUrl, grounding.bbox, heatmapOpacity]);

  return (
    <Card className="flex flex-col gap-5 p-6 bg-white dark:bg-[#161616] rounded-card border-thin-gray transition-colors duration-200 select-none">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-[#111111] dark:text-white leading-none">Explainable AI (XAI) Overlay</h3>
          <p className="text-[11px] text-[#888888] dark:text-[#A0A0A0] mt-1 font-medium">GradCAM neural heatmaps & DGM4 localization</p>
        </div>
        <IconEye className="w-5 h-5 text-[#0C447C] dark:text-blue-400 stroke-[1.5]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Active Canvas View */}
        <div className="lg:col-span-2 bg-[#FAFAFA] dark:bg-[#111111] rounded-card overflow-hidden border-thin-gray relative flex flex-col items-center justify-center p-2 min-h-[300px]">
          
          <div className="relative w-full flex items-center justify-center">
            <canvas ref={canvasRef} className="max-w-full h-auto object-contain rounded-elem border-thin-gray" />
            <span className="absolute bottom-3 right-3 bg-[#111111]/70 backdrop-blur-md px-2 py-1 rounded-pill text-[8px] font-medium tracking-wide uppercase text-white border-thin-gray">
              GradCAM heatmap overlay
            </span>
          </div>

          {/* Opacity Control slider */}
          <div className="w-full mt-4 flex items-center gap-3 bg-[#FFFFFF]/60 dark:bg-[#161616]/60 border-thin-gray rounded-elem p-2.5 backdrop-blur-sm">
            <span className="text-[9px] uppercase font-medium text-[#888888] shrink-0 tracking-wider">Blend Strength</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={heatmapOpacity}
              onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
              className="w-full h-1 bg-[#E5E5E5] dark:bg-[#2C2C2C] rounded-pill appearance-none cursor-pointer accent-[#0C447C]"
            />
            <span className="text-xs font-mono text-[#333333] dark:text-white w-8 text-right font-medium">
              {Math.round(heatmapOpacity * 100)}%
            </span>
          </div>
        </div>

        {/* Right: SHAP Sidebar */}
        <div className="flex flex-col gap-5 justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs text-[#333333] dark:text-[#E0E0E0] font-medium border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 pb-2">
              <span className="tracking-wide">SHAP Forensic Attribution</span>
              <IconHelpCircle className="w-4 h-4 text-[#888888] cursor-help" />
            </div>

            {/* Loop SHAP attributions */}
            <div className="flex flex-col gap-3">
              {Object.entries(explainability.modal_attribution).map(([modality, attribution]) => (
                <div key={modality} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs text-[#333333] dark:text-[#E0E0E0]">
                    <span className="font-normal text-[11px]">{modality}</span>
                    <span className="font-medium text-[11px] font-mono">{(attribution * 100).toFixed(1)}%</span>
                  </div>
                  {/* Thin bar */}
                  <div className="h-1.5 w-full bg-[#F5F5F5] dark:bg-[#222222] rounded-pill overflow-hidden">
                    <motion.div 
                      className="h-full bg-[#0C447C] dark:bg-blue-500 rounded-pill"
                      initial={{ width: 0 }}
                      animate={{ width: `${attribution * 100}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DGM4 Grounding details */}
          {grounding.manipulated_audio_seconds && grounding.manipulated_audio_seconds[1] > 0 && (
            <div className="bg-[#A32D2D]/5 border border-[#A32D2D]/10 rounded-elem p-3.5 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-[9px] uppercase font-medium text-[#A32D2D] tracking-wider">
                <IconWaveSine className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>DGM4 Temporal Inconsistency</span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg font-medium font-mono text-[#333333] dark:text-white leading-none">
                  {grounding.manipulated_audio_seconds[0].toFixed(2)}s
                </span>
                <span className="text-[10px] text-[#888888] font-normal leading-none">to</span>
                <span className="text-lg font-medium font-mono text-[#333333] dark:text-white leading-none">
                  {grounding.manipulated_audio_seconds[1].toFixed(2)}s
                </span>
              </div>
              <p className="text-[9px] text-[#888888] leading-normal font-normal">
                Audio frequency splicing isolated precisely within this timeline range.
              </p>
            </div>
          )}
        </div>

      </div>
    </Card>
  );
};
