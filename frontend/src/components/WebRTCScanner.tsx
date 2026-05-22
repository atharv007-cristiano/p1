import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  IconCamera, 
  IconCameraOff, 
  IconPlayerPause, 
  IconPlayerPlay,
  IconFlag, 
  IconAlertTriangle, 
  IconCheck, 
  IconActivity,
  IconHeartbeat,
  IconCompass,
  IconEye
} from '@tabler/icons-react';
import { Card, Button, Badge, cn } from './shared';

interface Participant {
  id: string;
  name: string;
  initials: string;
  frameIndex: number;
  trustScore: number; // 0.0 to 1.0
  rppg: string; // e.g. "1.2 Hz"
  lipSyncOffset: string; // e.g. "12 ms"
  blinkRate: string; // e.g. "18 bpm"
  verdict: 'Authentic' | 'Deepfake suspected';
  isThreat: boolean;
  avatarBg: string;
}

export const WebRTCScanner: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: '1',
      name: 'Dr. Evelyn Vance (Chief AI Officer)',
      initials: 'EV',
      frameIndex: 124,
      trustScore: 0.94,
      rppg: '1.2 Hz',
      lipSyncOffset: '14 ms',
      blinkRate: '16 bpm',
      verdict: 'Authentic',
      isThreat: false,
      avatarBg: 'bg-[#0C447C]/10 text-[#0C447C]'
    },
    {
      id: '2',
      name: 'Marcus Brody (Finance Director - Spliced Input)',
      initials: 'MB',
      frameIndex: 82,
      trustScore: 0.21,
      rppg: '2.8 Hz',
      lipSyncOffset: '185 ms',
      blinkRate: '4 bpm',
      verdict: 'Deepfake suspected',
      isThreat: true,
      avatarBg: 'bg-[#A32D2D]/10 text-[#A32D2D]'
    },
    {
      id: '3',
      name: 'Sarah Connor (Security Operations)',
      initials: 'SC',
      frameIndex: 144,
      trustScore: 0.98,
      rppg: '1.1 Hz',
      lipSyncOffset: '8 ms',
      blinkRate: '12 bpm',
      verdict: 'Authentic',
      isThreat: false,
      avatarBg: 'bg-[#0F6E56]/10 text-[#0F6E56]'
    }
  ]);

  const [pausedParticipants, setPausedParticipants] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Simulating real-time frame evaluation loops when scanner is active
  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setParticipants(prev => 
        prev.map(p => {
          // If this participant stream is paused, freeze frame index updates
          if (pausedParticipants[p.id]) return p;

          const nextFrame = p.frameIndex + 1;
          
          // Randomize telemetry fluctuations slightly to simulate real measurement streams
          let nextScore = p.trustScore;
          let nextRppg = p.rppg;
          let nextOffset = p.lipSyncOffset;
          let nextBlink = p.blinkRate;

          if (p.isThreat) {
            nextScore = Math.max(0.1, Math.min(0.28, p.trustScore + (Math.random() - 0.5) * 0.03));
            nextRppg = `${(2.6 + Math.random() * 0.4).toFixed(1)} Hz`;
            nextOffset = `${Math.round(170 + Math.random() * 20)} ms`;
            nextBlink = `${Math.round(3 + Math.random() * 2)} bpm`;
          } else {
            nextScore = Math.max(0.9, Math.min(1.0, p.trustScore + (Math.random() - 0.5) * 0.01));
            nextRppg = `${(1.1 + Math.random() * 0.2).toFixed(1)} Hz`;
            nextOffset = `${Math.round(8 + Math.random() * 6)} ms`;
            nextBlink = `${Math.round(14 + Math.random() * 4)} bpm`;
          }

          return {
            ...p,
            frameIndex: nextFrame,
            trustScore: parseFloat(nextScore.toFixed(2)),
            rppg: nextRppg,
            lipSyncOffset: nextOffset,
            blinkRate: nextBlink
          };
        })
      );
    }, 600);

    return () => clearInterval(timer);
  }, [isActive, pausedParticipants]);

  const togglePauseParticipant = (id: string) => {
    setPausedParticipants(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
    const isNowPaused = !pausedParticipants[id];
    showToast(`Participant stream ${isNowPaused ? 'paused' : 'resumed'} successfully.`);
  };

  const reportParticipant = (name: string) => {
    showToast(`Security Incident logged: ${name} flagged to System Response Center.`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-4 select-none">
      
      {/* Section Title */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 pb-4 gap-4">
        <div>
          <h2 className="text-base font-medium text-[#111111] dark:text-white leading-none">Live WebRTC Guard</h2>
          <p className="text-[11px] text-[#888888] dark:text-[#A0A0A0] mt-1">Intercepters deepfake camera injections in active video conferences</p>
        </div>

        <Button 
          size="sm" 
          variant={isActive ? 'danger' : 'primary'} 
          className="flex items-center gap-1.5"
          onClick={() => {
            setIsActive(!isActive);
            showToast(`WebRTC live guard ${!isActive ? 'armed & active' : 'disarmed'}.`);
          }}
        >
          {isActive ? (
            <>
              <IconCameraOff className="w-4 h-4 stroke-[1.5]" />
              Disconnect Live Guard
            </>
          ) : (
            <>
              <IconCamera className="w-4 h-4 stroke-[1.5]" />
              Arm WebRTC Live Guard
            </>
          )}
        </Button>
      </div>

      {/* Grid structure representing call participants */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {participants.map((p) => {
          const isPaused = pausedParticipants[p.id];
          const isSuspect = p.trustScore < 0.3;

          return (
            <Card 
              key={p.id} 
              className={cn(
                "relative flex flex-col justify-between bg-white dark:bg-[#161616] p-5 border-thin-gray transition-all overflow-hidden min-h-[320px]",
                isActive && isSuspect && "border-[#A32D2D]/40 bg-[#A32D2D]/5 dark:bg-[#A32D2D]/5"
              )}
            >
              {/* Header: Name + Frame counter */}
              <div className="flex justify-between items-start gap-2">
                <div className="flex flex-col">
                  <h4 className="text-xs font-medium text-[#111111] dark:text-white leading-tight pr-4 truncate max-w-[180px]">{p.name}</h4>
                  <span className="text-[9px] text-[#888888] font-mono mt-0.5">
                    {isActive 
                      ? `Scanning stream · frame ${isPaused ? p.frameIndex : p.frameIndex} of ∞` 
                      : 'Scanner standby'}
                  </span>
                </div>

                {/* Verdict Badge */}
                {isActive && (
                  <Badge variant={p.isThreat ? 'danger' : 'success'}>
                    {p.verdict}
                  </Badge>
                )}
              </div>

              {/* Video Preview Simulation Box */}
              <div className="my-4 h-28 w-full bg-[#F5F5F5] dark:bg-[#111111] rounded-elem border-thin-gray flex flex-col items-center justify-center relative overflow-hidden">
                {isPaused ? (
                  <span className="text-[10px] text-[#888888] font-medium uppercase tracking-wider">Stream Frozen</span>
                ) : isActive ? (
                  <>
                    {/* Interactive face coordinate tracker frame */}
                    {p.isThreat && (
                      <div className="absolute w-12 h-12 border border-dashed border-[#A32D2D] rounded-elem animate-pulse flex items-center justify-center">
                        <IconAlertTriangle className="w-4 h-4 text-[#A32D2D]" />
                      </div>
                    )}
                    
                    {/* Biological heartbeat symbol mapping */}
                    <div className="absolute top-2 left-2 bg-[#111111]/60 px-2 py-0.5 rounded-pill flex items-center gap-1">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full", 
                        p.isThreat ? "bg-[#A32D2D] animate-ping" : "bg-[#0F6E56]"
                      )} />
                      <span className="text-[8px] text-white font-mono uppercase tracking-wider">Telemetry feed</span>
                    </div>

                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-xs font-medium", p.avatarBg)}>
                      {p.initials}
                    </div>
                  </>
                ) : (
                  <span className="text-[10px] text-[#888888] font-medium uppercase tracking-wider">Feed Standby</span>
                )}
              </div>

              {/* Metric pills list */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                <Badge variant="neutral" className="flex items-center gap-1 text-[9px]">
                  <IconHeartbeat className="w-3.5 h-3.5 stroke-[1.5] text-[#888888]" />
                  rPPG: {isActive ? p.rppg : '-'}
                </Badge>
                <Badge variant="neutral" className="flex items-center gap-1 text-[9px]">
                  <IconCompass className="w-3.5 h-3.5 stroke-[1.5] text-[#888888]" />
                  Viseme: {isActive ? p.lipSyncOffset : '-'}
                </Badge>
                <Badge variant="neutral" className="flex items-center gap-1 text-[9px]">
                  <IconEye className="w-3.5 h-3.5 stroke-[1.5] text-[#888888]" />
                  Blinks: {isActive ? p.blinkRate : '-'}
                </Badge>
              </div>

              {/* Trust Score Cumulative slider progress bar */}
              <div className="flex flex-col gap-1 border-t border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 pt-3">
                <div className="flex justify-between text-[9px] text-[#888888] font-medium uppercase">
                  <span>30-Frame Accumulator</span>
                  <span className="font-mono">{isActive ? `${Math.round(p.trustScore * 100)}%` : '-'}</span>
                </div>
                <div className="h-1.5 w-full bg-[#F5F5F5] dark:bg-[#222222] rounded-pill overflow-hidden">
                  <motion.div 
                    className={cn("h-full rounded-pill", p.isThreat ? "bg-[#A32D2D]" : "bg-[#0F6E56]")}
                    animate={{ width: isActive ? `${p.trustScore * 100}%` : '0%' }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Actions layer */}
              {isActive && (
                <div className="flex gap-2 mt-4">
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="flex-1 text-[10px] py-1 h-7 flex items-center justify-center gap-1"
                    onClick={() => togglePauseParticipant(p.id)}
                  >
                    {isPaused ? <IconPlayerPlay className="w-3 h-3" /> : <IconPlayerPause className="w-3 h-3" />}
                    {isPaused ? 'Resume stream' : 'Pause stream'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="danger" 
                    className="flex-1 text-[10px] py-1 h-7 flex items-center justify-center gap-1"
                    onClick={() => reportParticipant(p.name)}
                  >
                    <IconFlag className="w-3 h-3" />
                    Report threat
                  </Button>
                </div>
              )}

            </Card>
          );
        })}
      </div>

      {/* Incident Toasts */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#161616] border border-[#A32D2D]/30 text-white rounded-card shadow-lg p-3 flex items-center gap-3 animate-slide-up text-xs font-medium">
          <IconAlertTriangle className="w-4 h-4 text-red-400" />
          <span>{toastMessage}</span>
          <button className="text-[#888888] hover:text-white" onClick={() => setToastMessage(null)}>✕</button>
        </div>
      )}

    </div>
  );
};
