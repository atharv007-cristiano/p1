export interface ModalityBreakdown {
  visual_score: number | null;
  audio_score: number | null;
  semantic_consistency: number | null;
  behavioral_score: number | null;
  cross_modal_inconsistency_score: number;
  weighed_audio_visual_sync_dtw: number | null;
  nlp_cosine_similarity: number | null;
}

export interface GroundingData {
  bbox: number[];
  manipulated_audio_seconds: number[];
}

export interface ExplainabilityData {
  modal_attribution: Record<string, number>;
  rollout_matrix?: number[][];
}

export interface DetectionResult {
  success: boolean;
  provenance_verified: boolean;
  bypass_inference: boolean;
  trust_score: number;
  status_code: string;
  action: 'AUTO_APPROVE' | 'AUTO_REJECT' | 'HUMAN_REVIEW';
  message: string;
  modality_breakdown: ModalityBreakdown;
  grounding: GroundingData;
  explainability: ExplainabilityData;
  latency_ms?: number;
}

export interface AuditLog {
  id: number;
  file_name: string;
  file_hash: string;
  file_type: 'video' | 'audio' | 'image';
  file_size_bytes: number;
  c2pa_status: 'authentic' | 'tampered' | 'absent' | 'error';
  trust_score: number;
  action_taken: 'AUTO_APPROVE' | 'AUTO_REJECT' | 'HUMAN_REVIEW' | 'HUMAN_APPROVED' | 'HUMAN_REJECTED';
  modality_scores: Record<string, any>;
  grounding_data?: Record<string, any>;
  explainability_data?: Record<string, any>;
  latency_ms: number;
  created_at: string;
}

export interface HumanReviewTicket {
  id: number;
  audit_log_id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewer_comments?: string;
  reviewed_at?: string;
  reviewed_by?: number;
  created_at: string;
  audit_log: AuditLog;
}

export interface SystemStats {
  metrics: {
    total_scans: number;
    threat_rate_pct: number;
    auto_approved: number;
    pending_manual: number;
    average_latency_ms: number;
  };
  timeline: {
    timestamp: string;
    trust_score: number;
    file: string;
  }[];
}
