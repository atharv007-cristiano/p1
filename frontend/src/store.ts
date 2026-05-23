import { create } from 'zustand';
import { DetectionResult, AuditLog, HumanReviewTicket, SystemStats } from './types';

export interface AlertItem {
  id: string;
  severity: 'critical' | 'review' | 'info';
  message: string;
  timestamp: string;
  read: boolean;
}

export interface SettingsState {
  vfm: boolean;
  afm: boolean;
  nscm: boolean;
  badm: boolean;
  rppg: boolean;
  c2pa: boolean;
  gradcam: boolean;
  autoRejectThreshold: number;
  humanReviewThreshold: number;
  emailWebhook: string;
  slackWebhook: string;
  modelVersion: 'DeepShield-Full' | 'DeepShield-Lite';
  gpuInference: boolean;
}

interface AppStore {
  // Navigation & Theme
  activeTab: 'detect' | 'history' | 'alerts' | 'api' | 'settings';
  theme: 'light' | 'dark';
  onboardingComplete: boolean;
  
  // Scanning state
  isScanning: boolean;
  scanPhase: string;
  activeScan: DetectionResult | null;
  activeJobId: string | null;
  
  // Data lists
  logs: AuditLog[];
  reviewQueue: HumanReviewTicket[];
  alerts: AlertItem[];
  stats: SystemStats | null;
  
  // API key mgmt
  apiKey: string;
  apiUsage: { current: number; limit: number };
  
  // Settings Config
  settings: SettingsState;
  
  // Actions
  setActiveTab: (tab: 'detect' | 'history' | 'alerts' | 'api' | 'settings') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setOnboardingComplete: (complete: boolean) => void;
  setIsScanning: (scanning: boolean) => void;
  setScanPhase: (phase: string) => void;
  setActiveScan: (scan: DetectionResult | null) => void;
  setActiveJobId: (jobId: string | null) => void;
  setLogs: (logs: AuditLog[]) => void;
  setReviewQueue: (queue: HumanReviewTicket[]) => void;
  setAlerts: (alerts: AlertItem[] | ((prev: AlertItem[]) => AlertItem[])) => void;
  setStats: (stats: SystemStats | null) => void;
  regenerateApiKey: () => void;
  updateSettings: (settings: Partial<SettingsState>) => void;
  dismissAlert: (id: string) => void;
  markAllAlertsRead: () => void;
}

export const useStore = create<AppStore>((set) => ({
  activeTab: 'detect',
  theme: typeof window !== 'undefined' ? (localStorage.getItem('theme') as 'light' | 'dark') || 'light' : 'light',
  onboardingComplete: typeof window !== 'undefined' ? localStorage.getItem('onboardingComplete') === 'true' : false,
  
  isScanning: false,
  scanPhase: '',
  activeScan: null,
  activeJobId: null,
  
  logs: [],
  reviewQueue: [],
  alerts: [
    {
      id: '1',
      severity: 'critical',
      message: 'Automatic reject: cfo_financial_report_broadcast.mp4 failed cross-modal sync check with score 0.23',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      read: false,
    },
    {
      id: '2',
      severity: 'review',
      message: 'Human review queued: pr_announcement_deep_spliced.mp3 requires semantic audit (score 0.42)',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      read: false,
    },
    {
      id: '3',
      severity: 'info',
      message: 'Provenance verified: cryptographic_press_release.jpg passed validation (C2PA 2.0 compliant)',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: true,
    }
  ],
  stats: null,
  
  apiKey: 'ds_live_6f237efb7c6ee9b74052f6b8969ea2dfdf9037c22998a4da07ea62f',
  apiUsage: { current: 1420, limit: 10000 },
  
  settings: {
    vfm: true,
    afm: true,
    nscm: true,
    badm: true,
    rppg: true,
    c2pa: true,
    gradcam: true,
    autoRejectThreshold: 0.3,
    humanReviewThreshold: 0.5,
    emailWebhook: 'https://api.enterprise.security/webhooks/deepshield-email',
    slackWebhook: 'https://api.enterprise.security/webhooks/deepshield-slack',
    modelVersion: 'DeepShield-Full',
    gpuInference: true,
  },
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },
  setOnboardingComplete: (complete) => {
    localStorage.setItem('onboardingComplete', String(complete));
    set({ onboardingComplete: complete });
  },
  setIsScanning: (scanning) => set({ isScanning: scanning }),
  setScanPhase: (phase) => set({ scanPhase: phase }),
  setActiveScan: (scan) => set({ activeScan: scan }),
  setActiveJobId: (jobId) => set({ activeJobId: jobId }),
  setLogs: (logs) => set({ logs }),
  setReviewQueue: (queue) => set({ reviewQueue: queue }),
  setAlerts: (newAlerts) => set((state) => ({
    alerts: typeof newAlerts === 'function' ? newAlerts(state.alerts) : newAlerts
  })),
  setStats: (stats) => set({ stats }),
  regenerateApiKey: () => {
    const chars = '0123456789abcdef';
    let key = 'ds_live_';
    for (let i = 0; i < 48; i++) {
      key += chars[Math.floor(Math.random() * chars.length)];
    }
    set({ apiKey: key });
  },
  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),
  dismissAlert: (id) => set((state) => ({
    alerts: state.alerts.filter((a) => a.id !== id)
  })),
  markAllAlertsRead: () => set((state) => ({
    alerts: state.alerts.map((a) => ({ ...a, read: true }))
  }))
}));
