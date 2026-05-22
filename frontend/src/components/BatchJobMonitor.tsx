import React, { useState, useEffect } from 'react';
import { RefreshCw, Play, CheckCircle } from 'lucide-react';

interface BatchJobMonitorProps {
  jobId: string | null;
  onJobSuccess: () => void;
}

export const BatchJobMonitor: React.FC<BatchJobMonitorProps> = ({ jobId, onJobSuccess }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('IDLE');
  const [logMessage, setLogMessage] = useState<string>('Awaiting forensic task trigger...');

  useEffect(() => {
    if (!jobId) {
      setProgress(0);
      setStatus('IDLE');
      setLogMessage('Awaiting forensic task trigger...');
      return;
    }

    setStatus('CONNECTING');
    setLogMessage('Handshaking callback sockets...');
    
    // Connect to FastAPI task monitor WS
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `/ws/progress/${jobId}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setProgress(data.progress_percentage || 0);
        setStatus(data.status || 'PROCESSING');
        setLogMessage(data.message || 'Extracting features...');
        
        if (data.status === 'SUCCESS') {
          // Task finished
          setTimeout(() => {
            onJobSuccess();
          }, 1500);
        }
      } catch (err) {
        console.error("Error decoding job monitor message:", err);
      }
    };

    ws.onerror = () => {
      setStatus('ERROR');
      setLogMessage('Task progress socket dropped out.');
    };

    ws.onclose = () => {
      logger_log("Progress WebSocket session closed.");
    };

    return () => {
      ws.close();
    };
  }, [jobId]);

  const logger_log = (msg: string) => {
    console.log(`[BatchJobMonitor] ${msg}`);
  };

  if (!jobId) return null;

  return (
    <div className="glass-panel p-6 flex flex-col gap-5 card-threat-warning">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-200">Async Pipeline Monitor</h2>
          <p className="text-[10px] text-slate-400">Tracking long-running celery tasks</p>
        </div>
        
        {status === 'PROCESSING' && <RefreshCw className="h-4 w-4 text-amber-500 animate-spin" />}
        {status === 'SUCCESS' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
      </div>

      <div className="flex flex-col gap-3 bg-slate-950/60 border border-slate-900 rounded-xl p-4">
        
        {/* Progress percent details */}
        <div className="flex justify-between items-baseline text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
            <Play className="h-3 w-3 text-purple-400" />
            TASK ID: {jobId.substring(0, 12)}...
          </span>
          <span className="font-mono text-amber-400">{progress}%</span>
        </div>

        {/* Dynamic progress fill bar */}
        <div className="h-2 w-full bg-slate-900 border border-slate-800 rounded-full overflow-hidden relative">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 to-amber-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Live log outputs */}
        <div className="bg-slate-950 border border-slate-900 rounded-lg p-2.5 flex gap-2">
          <span className="text-[9px] uppercase font-bold text-slate-500 shrink-0 mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>LOGS</span>
          <p className="text-[11px] text-slate-300 font-mono leading-relaxed truncate">{logMessage}</p>
        </div>
      </div>
    </div>
  );
};
