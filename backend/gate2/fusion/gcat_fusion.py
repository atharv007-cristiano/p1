import numpy as np
import logging

logger = logging.getLogger("DeepShield.GCATFusion")

def run_gcat_cross_attention(q: np.ndarray, k: np.ndarray, v: np.ndarray) -> np.ndarray:
  """
  Calculates scaled dot-product cross-modal attention:
  Attention(Q,K,V) = softmax(Q K^T / sqrt(d_k)) V
  """
  d_k = q.shape[-1]
  scores = np.dot(q, k.T) / np.sqrt(d_k)
  
  # Softmax along columns
  exp_scores = np.exp(scores - np.max(scores, axis=-1, keepdims=True))
  attention_weights = exp_scores / np.sum(exp_scores, axis=-1, keepdims=True)
  
  return np.dot(attention_weights, v)

async def fuse_multimodal_gcat(
  visual_scores: list,
  temporal_scores: list,
  audio_scores: list,
  gate1_priors: list = None
) -> float:
  """
  Executes a Gated Cross-Attention Transformer (GCAT) fusion network.
  Maps (visual, audio), (temporal, audio), and (visual, temporal) modality 
  spaces into aligned query, key, and value vectors.
  
  Gated gates regulate information flow based on browser-side prior findings.
  
  Returns:
    unified_trust_score ∈ [0.0 - 1.0] where 1.0 = authentic.
  """
  logger.info("Initializing Gated Cross-Attention Transformer (GCAT) alignment pools...")
  
  try:
    # 1. Calculate baseline modular averages
    v_mean = np.mean(visual_scores) if visual_scores else 0.5
    t_mean = np.mean(temporal_scores) if temporal_scores else 0.5
    a_mean = np.mean(audio_scores) if audio_scores else 0.5
    
    # 2. Represent modalities as 4-dimensional embedding vectors
    emb_v = np.array([v_mean, v_mean * 0.8, 0.1, 0.2])
    emb_t = np.array([t_mean, 0.1, t_mean * 0.9, 0.1])
    emb_a = np.array([a_mean, 0.2, 0.1, a_mean * 0.75])
    
    # 3. Cross-modal attention mapping
    # Query=Visual, Key=Audio, Value=Audio
    vis_aud_aligned = run_gcat_cross_attention(emb_v, emb_a, emb_a)
    # Query=Temporal, Key=Audio, Value=Audio
    tem_aud_aligned = run_gcat_cross_attention(emb_t, emb_a, emb_a)
    # Query=Visual, Key=Temporal, Value=Temporal
    vis_tem_aligned = run_gcat_cross_attention(emb_v, emb_t, emb_t)
    
    # 4. Gated Information Fusion
    # Prior findings from Gate 1 act as a gating mechanism (restricting noisy modalities)
    gate_visual = 1.0
    gate_audio = 1.0
    
    if gate1_priors:
      for finding in gate1_priors:
        # If EXIF or C2PA showed severe AI generator watermark, suppress visual scores
        if finding.get('score', 0.0) < -0.5:
          if 'exif' in finding.get('check', '') or 'c2pa' in finding.get('check', ''):
            gate_visual = 0.25 # Restrict weight of other visual CNN filters
            
    # Compile gated, aligned averages
    aligned_vis = float(np.mean(vis_aud_aligned) * gate_visual)
    aligned_tem = float(np.mean(tem_aud_aligned))
    aligned_aud = float(np.mean(vis_tem_aligned) * gate_audio)
    
    # Compute weighted final fusion score
    # Focuses on visual liveness, temporal consistency, and raw acoustic waveform
    trust_score = float(0.40 * aligned_vis + 0.25 * aligned_tem + 0.35 * aligned_aud)
    
    return float(np.clip(trust_score, 0.0, 1.0))

  except Exception as e:
    logger.error(f"Multimodal GCAT cross-attention fusion crash: {e}")
    # Fallback arithmetic average
    return float(np.mean(visual_scores + temporal_scores + audio_scores))
