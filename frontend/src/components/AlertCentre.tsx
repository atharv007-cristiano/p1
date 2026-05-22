import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconBell, 
  IconCheck, 
  IconTrash, 
  IconInbox, 
  IconAlertTriangle,
  IconShieldCheck,
  IconInfoCircle
} from '@tabler/icons-react';
import { useStore, AlertItem } from '../store';
import { Card, Button, Badge, cn } from './shared';

export const AlertCentre: React.FC = () => {
  const { alerts, setAlerts, markAllAlertsRead, dismissAlert } = useStore();
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'review' | 'info'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live polling: Simulating new alerts arriving every 12 seconds if active
  useEffect(() => {
    const timer = setInterval(() => {
      const randomSeed = Math.random();
      if (randomSeed > 0.65) {
        const newAlert: AlertItem = {
          id: `ds_alert_${Date.now()}`,
          severity: randomSeed > 0.85 ? 'critical' : randomSeed > 0.75 ? 'review' : 'info',
          message: randomSeed > 0.85 
            ? 'Threat Alert: CEO voice cloning splice attempts detected on WS endpoint.'
            : randomSeed > 0.75 
              ? 'Verification Warning: Ingestion pipeline received low-resolution frame sequences.'
              : 'Audit Status: Weekly threat intelligence definitions synced successfully.',
          timestamp: new Date().toISOString(),
          read: false
        };
        // Add to global Zustand alerts
        setAlerts(prev => [newAlert, ...prev]);
        setToastMessage('New forensic alert received.');
        setTimeout(() => setToastMessage(null), 3000);
      }
    }, 12000);

    return () => clearInterval(timer);
  }, [setAlerts]);

  // Filtering alerts
  const filteredAlerts = alerts.filter(a => {
    if (activeFilter === 'all') return true;
    return a.severity === activeFilter;
  });

  const getAlertIcon = (severity: AlertItem['severity']) => {
    if (severity === 'critical') return <IconAlertTriangle className="w-5 h-5 text-[#A32D2D]" />;
    if (severity === 'review') return <IconAlertTriangle className="w-5 h-5 text-[#D97706]" />;
    return <IconShieldCheck className="w-5 h-5 text-[#0F6E56]" />;
  };

  const getSeverityLabel = (severity: AlertItem['severity']) => {
    if (severity === 'critical') return <Badge variant="danger">Auto-Rejected</Badge>;
    if (severity === 'review') return <Badge variant="warning">Human Review</Badge>;
    return <Badge variant="success">Provenance Checked</Badge>;
  };

  const getDotColor = (severity: AlertItem['severity']) => {
    if (severity === 'critical') return 'bg-[#A32D2D]';
    if (severity === 'review') return 'bg-[#D97706]';
    return 'bg-[#0F6E56]';
  };

  const getRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const handleMarkAllRead = () => {
    markAllAlertsRead();
    setToastMessage('All alerts successfully marked as read.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteAll = () => {
    setAlerts([]);
    setToastMessage('Alert history database successfully cleared.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-4 select-none animate-slide-up">
      
      {/* 1. Header with Bulk triggers */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 pb-4">
        <div>
          <h2 className="text-base font-medium text-[#111111] dark:text-white leading-none">Security Alert Centre</h2>
          <p className="text-[11px] text-[#888888] dark:text-[#A0A0A0] mt-1 font-medium">Real-time incident dispatch feed from neural API gateways</p>
        </div>

        {alerts.length > 0 && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" className="flex items-center gap-1.5" onClick={handleMarkAllRead}>
              <IconCheck className="w-4 h-4 stroke-[1.5]" />
              Mark all read
            </Button>
            <Button size="sm" variant="ghost" className="flex items-center gap-1.5 hover:text-[#A32D2D] hover:bg-[#A32D2D]/5" onClick={handleDeleteAll}>
              <IconTrash className="w-4 h-4 stroke-[1.5]" />
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* 2. Severity Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#FFFFFF] dark:bg-[#161616] p-4 rounded-card border-thin-gray transition-colors duration-200">
        <div className="flex items-center gap-1 bg-[#F5F5F5] dark:bg-[#222222] p-1 rounded-elem">
          {(['all', 'critical', 'review', 'info'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={cn(
                "px-3 py-1 text-[10px] uppercase tracking-wider rounded-elem font-medium transition-colors select-none",
                activeFilter === tab
                  ? "bg-white dark:bg-[#161616] text-[#111111] dark:text-white shadow-sm"
                  : "text-[#666666] dark:text-[#A0A0A0] hover:text-[#111111] dark:hover:text-white"
              )}
            >
              {tab === 'critical' ? 'critical rejected' : tab === 'review' ? 'human review' : tab === 'info' ? 'verified info' : tab}
            </button>
          ))}
        </div>

        {alerts.filter(a => !a.read).length > 0 && (
          <span className="text-xs font-medium text-[#A32D2D] bg-[#A32D2D]/10 px-2.5 py-1 rounded-pill">
            {alerts.filter(a => !a.read).length} Unread Incident{alerts.filter(a => !a.read).length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* 3. Alerts Feed List */}
      <div className="flex flex-col gap-4">
        {filteredAlerts.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {filteredAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card 
                  className={cn(
                    "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#161616] p-4 border-thin-gray transition-all",
                    !alert.read && "border-l-[3.5px] border-l-[#0C447C]"
                  )}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Color severity status dot */}
                    <div className="flex items-center justify-center shrink-0 mt-1">
                      <span className={cn("relative flex h-2 w-2")}>
                        {!alert.read && <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", getDotColor(alert.severity))}></span>}
                        <span className={cn("relative inline-flex rounded-full h-2 w-2", getDotColor(alert.severity))}></span>
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {getSeverityLabel(alert.severity)}
                        <span className="text-[10px] font-mono text-[#888888] font-medium uppercase tracking-wider">
                          {getRelativeTime(alert.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-[#333333] dark:text-[#E0E0E0] leading-relaxed mt-0.5 font-normal">
                        {alert.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0 self-end md:self-auto">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 text-[11px] font-medium"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          /* Empty state SVG */
          <Card className="flex flex-col items-center justify-center py-20 px-4 text-center border-thin-gray bg-white dark:bg-[#161616]">
            <IconInbox className="w-12 h-12 text-[#888888] dark:text-[#555555] stroke-[1.2] mb-3" />
            <h4 className="text-sm font-medium text-[#111111] dark:text-white mb-1">No Active Incidents</h4>
            <p className="text-xs text-[#888888] dark:text-[#A0A0A0] max-w-xs leading-normal">
              All clear. Forensic check pipelines are running without flagging any anomalies.
            </p>
          </Card>
        )}
      </div>

      {/* Floating Info Notification toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#161616] border border-[#0C447C]/30 text-white rounded-card shadow-lg p-3 flex items-center gap-3 animate-slide-up text-xs font-medium">
          <IconInfoCircle className="w-4 h-4 text-blue-400 font-medium" />
          <span>{toastMessage}</span>
          <button className="text-[#888888] hover:text-white" onClick={() => setToastMessage(null)}>✕</button>
        </div>
      )}

    </div>
  );
};
