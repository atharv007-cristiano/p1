import os
import torch
import torch.nn as nn
import numpy as np
from typing import Dict, Any, Tuple

from core.c2pa import C2PAVerifier
from core.visual import VisualForensicsModule
from core.audio import AudioForensicsModule
from core.nlp import NLPSemanticModule
from core.behavioral import BehavioralAnomalyModule
from core.cmide import CMIDEModule
from core.gcat import GCATFusion
from core.grounding import GroundingHead
from core.xai import XAIExplainer

class DeepShieldPipeline(nn.Module):
    """
    Unified Orchestrator for DeepShield Multimodal Deepfake Forensic System.
    1. Cryptographic Provenance check (C2PA 2.0). If verified, bypasses neural pipeline.
    2. Modality extraction and ingestion validation (Quality Flags).
    3. Runs parallel neural branches (Visual, Audio, Semantic, Behavioral, rPPG, Frequency).
    4. Cross-Modal Attention Engine (CMIDE) tracks inconsistencies.
    5. Gated Cross-Attention Transformer (GCAT) fuses active networks.
    6. DGM4 Grounding Head regresses coordinates and audio timeline ranges.
    7. Explainability Layer (XAI) overlays spatial Grad-CAM heatmaps.
    """
    def __init__(self, device: str = "cpu"):
        super(DeepShieldPipeline, self).__init__()
        self.device_str = device
        self.device = torch.device(device)
        
        # Instantiate sub-modules
        self.visual_module = VisualForensicsModule(num_frames=10, feature_dim=512)
        self.audio_module = AudioForensicsModule(feature_dim=512)
        self.nlp_module = NLPSemanticModule(embed_dim=512)
        self.behavioral_module = BehavioralAnomalyModule(landmark_dim=68 * 3, hidden_dim=128, feature_dim=512)
        self.cmide_module = CMIDEModule(embed_dim=512)
        self.gcat_fusion = GCATFusion(embed_dim=512, heads=8, depth=2)
        self.grounding_head = GroundingHead(feature_dim=512)
        self.xai_explainer = XAIExplainer()
        
        # Move models to appropriate GPU/CPU environment
        self.to(self.device)
        self.eval()

    def process_media(
        self,
        file_path: str,
        frames: torch.Tensor = None,
        waveform: torch.Tensor = None,
        landmarks: torch.Tensor = None,
        transcript_tokens: torch.Tensor = None,
        audio_energy: torch.Tensor = None,
        fau_vectors: torch.Tensor = None,
        duration_seconds: float = 10.0
    ) -> Dict[str, Any]:
        """
        Executes the DeepShield analysis pipeline on a media asset.
        
        Args:
            file_path: Path to the target media file (image/video/audio)
            frames: Pre-extracted visual sequence tensor [Batch, Frames, C, H, W]
            waveform: Pre-extracted audio waveform tensor [Batch, NumSamples]
            landmarks: Pre-extracted 68-point 3D face landmarks [Batch, Frames, 68, 3]
            transcript_tokens: Pre-extracted text tokens [Batch, SeqLen]
            audio_energy: Pre-extracted audio temporal energy [Batch, Frames]
            fau_vectors: Pre-extracted facial action unit vectors [Batch, Frames, 18]
            duration_seconds: Total duration of the asset in seconds
            
        Returns:
            JSON-serializable Python dictionary containing comprehensive scores and explainability overlays.
        """
        # 1. Cryptographic Provenance bypass check (C2PA 2.0)
        c2pa_authentic, provenance_data = C2PAVerifier.verify_provenance(file_path)
        if c2pa_authentic:
            return {
                "success": True,
                "provenance_verified": True,
                "bypass_inference": True,
                "trust_score": 1.0,
                "status_code": "AUTHENTIC_C2PA",
                "action": "AUTO_APPROVE",
                "message": "Asset bypasses neural inference: verified authentic C2PA credentials.",
                "provenance_details": provenance_data,
                "modality_breakdown": {
                    "visual_score": 1.0,
                    "audio_score": 1.0,
                    "semantic_consistency": 1.0,
                    "behavioral_score": 1.0
                },
                "grounding": {
                    "bbox": [0, 0, 0, 0],
                    "manipulated_audio_seconds": [0.0, 0.0]
                },
                "explainability": {
                    "modal_attribution": {
                        "Visual (VFM)": 0.0,
                        "Audio (AFM)": 0.0,
                        "NLP Semantic (NSCM)": 0.0,
                        "Behavioral (BADM)": 0.0
                    },
                    "rollout_matrix": None
                }
            }

        # 2. Ingestion validation: configure Quality Gating Flags
        # 1.0 indicates that the modality is active; 0.0 indicates absent/corrupted
        batch_size = 1
        q_v = 1.0 if frames is not None else 0.0
        q_a = 1.0 if waveform is not None else 0.0
        q_t = 1.0 if transcript_tokens is not None else 0.0
        q_b = 1.0 if landmarks is not None else 0.0
        
        quality_flags = torch.tensor([[q_v, q_a, q_t, q_b]], dtype=torch.float32, device=self.device)
        
        # Synthesize fallback tensors for missing modalities to prevent torch execution errors
        if frames is None:
            frames = torch.zeros(batch_size, 10, 3, 224, 224, device=self.device)
        else:
            frames = frames.to(self.device)
            
        if waveform is None:
            waveform = torch.zeros(batch_size, 16000 * 5, device=self.device) # 5 seconds of silence
        else:
            waveform = waveform.to(self.device)
            
        if landmarks is None:
            landmarks = torch.zeros(batch_size, 10, 68, 3, device=self.device)
        else:
            landmarks = landmarks.to(self.device)
            
        if transcript_tokens is None:
            transcript_tokens = torch.zeros(batch_size, 10, dtype=torch.long, device=self.device)
        else:
            transcript_tokens = transcript_tokens.to(self.device)
            
        if fau_vectors is None:
            fau_vectors = torch.zeros(batch_size, frames.shape[1], 18, device=self.device)
        else:
            fau_vectors = fau_vectors.to(self.device)
            
        if audio_energy is None:
            audio_energy = torch.zeros(batch_size, frames.shape[1], device=self.device)
        else:
            audio_energy = audio_energy.to(self.device)

        # 3. Parallel Modality Executions
        with torch.no_grad():
            # A. Visual Forensics Module
            v_res = self.visual_module(frames, fau_vectors)
            v_emb = v_res["visual_embedding"]
            v_score = torch.sigmoid(v_res["visual_logits"]).item() if q_v else 1.0
            
            # B. Audio Forensics Module
            # Calculate offline prosodic metrics
            waveform_np = waveform[0].cpu().numpy()
            prosody_np = AudioForensicsModule.extract_prosodic_features(waveform_np)
            prosody_tensor = torch.from_numpy(prosody_np).unsqueeze(0).to(self.device)
            
            a_res = self.audio_module(waveform, prosody_tensor)
            a_emb = a_res["audio_embedding"]
            a_score = torch.sigmoid(a_res["audio_logits"]).item() if q_a else 1.0
            
            # C. NLP Semantic Module
            t_res = self.nlp_module(transcript_tokens, v_emb)
            t_emb = t_res["semantic_text_embedding"]
            t_score = torch.sigmoid(t_res["semantic_logits"]).item() if q_t else 1.0
            cosine_similarity = t_res["cross_modal_similarity"].item() if q_t else 1.0
            
            # D. Behavioral Anomaly Module
            b_res = self.behavioral_module(landmarks, audio_energy)
            b_emb = b_res["behavioral_embedding"]
            b_score = torch.sigmoid(b_res["behavioral_logits"]).item() if q_b else 1.0
            dtw_score = b_res["dtw_sync_score"].item() if q_b else 0.0

            # 4. Cross-Modal Inconsistency Engine (CMIDE)
            cmide_res = self.cmide_module(v_emb, a_emb, t_emb, b_emb)
            inconsistency_logit = cmide_res["inconsistency_logits"].item()
            inconsistency_score = torch.sigmoid(cmide_res["inconsistency_logits"]).item()

            # 5. Modality Fusion Transformer (GCAT)
            gcat_res = self.gcat_fusion(v_emb, a_emb, t_emb, b_emb, quality_flags)
            trust_score = gcat_res["trust_score"].item()
            fusion_emb = gcat_res["fusion_embedding"]
            gating_weights = gcat_res["gating_weights"][0].cpu().numpy()

            # 6. DGM4 Grounding Outputs
            ground_res = self.grounding_head(fusion_emb, duration_seconds)
            bbox = ground_res["bbox_coordinates"][0].cpu().numpy().tolist()
            audio_range = ground_res["audio_timestamp_range"][0].cpu().numpy().tolist()

            # 7. Explainability Layer (XAI SHAP & Rollout)
            rollout_weights = [cmide_res["weights_va"], cmide_res["weights_vt"], cmide_res["weights_vb"]]
            attn_rollout = XAIExplainer.compute_attention_rollout(rollout_weights)
            
            shap_attributions = XAIExplainer.compute_shap_attributions(gating_weights, trust_score)

        # 8. Reality Defender's Tiered Gateway Action Router
        # TS < 0.3 -> Auto-Reject
        # 0.3 <= TS < 0.5 -> Human Review Queue
        # TS >= 0.5 -> Auto-Approve
        if trust_score < 0.3:
            action = "AUTO_REJECT"
        elif 0.3 <= trust_score < 0.5:
            action = "HUMAN_REVIEW"
        else:
            action = "AUTO_APPROVE"

        return {
            "success": True,
            "provenance_verified": False,
            "bypass_inference": False,
            "trust_score": trust_score,
            "status_code": "NEURAL_INFERENCE_COMPLETE",
            "action": action,
            "message": "Full multimodal neural extraction complete.",
            "modality_breakdown": {
                "visual_score": v_score if q_v else None,
                "audio_score": a_score if q_a else None,
                "semantic_consistency": t_score if q_t else None,
                "behavioral_score": b_score if q_b else None,
                "cross_modal_inconsistency_score": inconsistency_score,
                "weighed_audio_visual_sync_dtw": dtw_score if q_b else None,
                "nlp_cosine_similarity": cosine_similarity if q_t else None
            },
            "grounding": {
                "bbox": bbox if q_v else [0, 0, 0, 0],
                "manipulated_audio_seconds": audio_range if q_a else [0.0, 0.0]
            },
            "explainability": {
                "modal_attribution": shap_attributions,
                "rollout_matrix": attn_rollout.tolist()
            }
        }
