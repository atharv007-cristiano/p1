import { Finding, DetectionResult } from './api';
import { Gate1Outcome } from '../components/Gate1PreFilter';

export const createGate1MockResult = (
  file: File,
  outcome: Gate1Outcome,
  latencyMs: number
): DetectionResult => {
  const file_type = file.type.includes('video') ? 'video' : 'image';
  
  return {
    job_id: `g1_${Math.random().toString(36).substring(2, 11)}`,
    file_type: file_type as any,
    gate_used: 1,
    trust_score: outcome.confidence,
    verdict: outcome.verdict,
    action: outcome.verdict === 'authentic' ? 'auto_approved' : 'auto_rejected',
    confidence: outcome.confidence >= 0.85 ? outcome.confidence : (1.0 - outcome.confidence),
    gate1_findings: outcome.findings,
    gate2_scores: {
      srm: null,
      frequency: null,
      ela: null,
      gan_cnn: null,
      face_consistency: null,
      rppg: null,
      temporal: null,
      lipsync: null,
      byte_integrity: null,
      spectral: null,
      prosodic: null,
      rawnet3: null,
    },
    grounding: {
      face_bbox: null,
      manipulation_heatmap_url: null,
      audio_segment_ms: null,
      detected_text: outcome.detectedText || null,
    },
    latency_ms: {
      gate1: latencyMs,
      gate2: 0,
      total: latencyMs,
    },
    processing_note: `Gate 1 local analysis completed successfully. Confidence of ${outcome.confidence.toFixed(2)} met instant decision thresholds. Escalation to Gate 2 deep forensics bypassed.`,
  };
};
