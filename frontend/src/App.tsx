import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import { ThemeProvider } from './components/ThemeProvider';
import { TopNav } from './components/TopNav';
import { UploadPage } from './components/UploadPage';
import { ResultPanel } from './components/ResultPanel';
import { WebRTCScanner } from './components/WebRTCScanner';
import { HistoryDashboard } from './components/HistoryDashboard';
import { AlertCentre } from './components/AlertCentre';
import { APIDocsPage } from './components/APIDocsPage';
import { SettingsPanel } from './components/SettingsPanel';
import { OnboardingWizard } from './components/OnboardingWizard';
import { LoadingSkeletons } from './components/LoadingSkeletons';
import { Button } from './components/shared';
import { IconArrowLeft } from '@tabler/icons-react';

export default function App() {
  const { 
    activeTab, 
    setActiveTab, 
    activeScan, 
    setActiveScan, 
    isScanning,
    setStats 
  } = useStore();

  const [isWebRTCActive, setIsWebRTCActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Set up mock system statistics on mount so dashboard has high-fidelity clinical data instantly
  useEffect(() => {
    setStats({
      metrics: {
        total_scans: 142,
        threat_rate_pct: 18.3,
        auto_approved: 112,
        pending_manual: 4,
        average_latency_ms: 22.8
      },
      timeline: [
        { timestamp: "08:00 AM", trust_score: 0.96, file: "executive_briefing.mp3" },
        { timestamp: "09:30 AM", trust_score: 0.14, file: "cfo_payout_request.wav" },
        { timestamp: "11:15 AM", trust_score: 0.88, file: "identity_proof_cam.jpg" },
        { timestamp: "01:00 PM", trust_score: 0.05, file: "ceo_scam_brief.mp4" }
      ]
    });

    // Simulate clinical boot check to present high-end skeleton loaders
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [setStats]);

  // Clean-up handler to exit diagnostics and return to ingest zone
  const handleClearReport = () => {
    setActiveScan(null);
  };

  // Switcher rendering view components matching activeTab router state
  const renderTabContent = () => {
    if (isLoading) {
      return <LoadingSkeletons view={activeTab} />;
    }

    switch (activeTab) {
      case 'detect':
        if (activeScan) {
          return (
            <ResultPanel 
              scanResult={activeScan} 
              onClear={handleClearReport} 
            />
          );
        }
        
        if (isWebRTCActive) {
          return (
            <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-4 select-none">
              <div className="flex items-center justify-between border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 pb-4">
                <div>
                  <h2 className="text-base font-medium text-[#111111] dark:text-white leading-none">WebRTC Real-time Shield</h2>
                  <span className="text-[11px] text-[#888888] dark:text-[#A0A0A0] mt-1 font-medium block">
                    Telemetry interception & deep liveness camera mapping
                  </span>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="flex items-center gap-1.5 h-8 text-xs" 
                  onClick={() => setIsWebRTCActive(false)}
                >
                  <IconArrowLeft className="w-4 h-4 stroke-[1.5]" />
                  Return to File Ingestion
                </Button>
              </div>
              <WebRTCScanner />
            </div>
          );
        }

        return (
          <UploadPage 
            onLaunchWebRTC={() => setIsWebRTCActive(true)} 
          />
        );

      case 'history':
        return <HistoryDashboard />;

      case 'alerts':
        return <AlertCentre />;

      case 'api':
        return <APIDocsPage />;

      case 'settings':
        return <SettingsPanel />;

      default:
        return <UploadPage onLaunchWebRTC={() => setIsWebRTCActive(true)} />;
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[#FFFFFF] dark:bg-[#111111] text-[#111111] dark:text-white flex flex-col font-sans transition-colors duration-200 antialiased selection:bg-[#0C447C]/20">
        {/* Onboarding wizard modal overlays */}
        <OnboardingWizard />

        {/* Top Sticky Navigation bar */}
        {isLoading ? (
          <LoadingSkeletons view="nav" />
        ) : (
          <TopNav />
        )}

        {/* Main Application Container */}
        <main className="flex-1 w-full py-8 overflow-y-auto">
          {renderTabContent()}
        </main>

        {/* Institutional Forensic Footer */}
        <footer className="w-full py-6 border-t border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 bg-transparent flex items-center justify-center select-none">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#888888]">
            DeepShield Forensic Ecosystem · IEEE Forensics v1.2.4
          </span>
        </footer>
      </div>
    </ThemeProvider>
  );
}
