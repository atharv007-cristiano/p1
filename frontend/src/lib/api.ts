import axios from 'axios';

// Resolve backend URL with dynamic local/production fallbacks
export const API_URL = typeof window !== 'undefined'
  ? (window as any).__ENV_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
  : 'http://127.0.0.1:8000';

export const WS_URL = API_URL.replace(/^http/, 'ws');

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Finding {
  check: string;
  result: string;
  detail: string;
  weight: number;
  score: number;
}

export interface Gate2Scores {
  srm: number | null;
  frequency: number | null;
  ela: number | null;
  gan_cnn: number | null;
  face_consistency: number | null;
  rppg: number | null;
  temporal: number | null;
  lipsync: number | null;
  byte_integrity: number | null;
  spectral: number | null;
  prosodic: number | null;
  rawnet3: number | null;
}

export interface Grounding {
  face_bbox: [number, number, number, number] | null;
  manipulation_heatmap_url: string | null;
  audio_segment_ms: [number, number] | null;
  detected_text: string[] | null;
}

export interface Latency {
  gate1: number;
  gate2: number;
  total: number;
}

export interface DetectionResult {
  job_id: string;
  file_type: 'image' | 'video' | 'audio';
  gate_used: 1 | 2;
  trust_score: number;
  verdict: 'authentic' | 'synthetic' | 'uncertain';
  action: 'auto_approved' | 'auto_rejected' | 'human_review';
  confidence: number;
  gate1_findings: Finding[];
  gate2_scores: Gate2Scores;
  grounding: Grounding;
  latency_ms: Latency;
  processing_note: string;
}

// REST endpoints
export const submitAssetForInference = async (
  file: File,
  asyncProcessing = false,
  priors: string | null = null
): Promise<DetectionResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('async_processing', String(asyncProcessing));
  if (priors) {
    formData.append('gate1_priors', priors);
  }

  const response = await api.post<DetectionResult>('/detect', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getJobDetails = async (jobId: string): Promise<DetectionResult> => {
  const response = await api.get<DetectionResult>(`/jobs/${jobId}`);
  return response.data;
};

export const getSystemStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

export const getHistoryLogs = async (skip = 0, limit = 50) => {
  const response = await api.get(`/history?skip=${skip}&limit=${limit}`);
  return response.data;
};
