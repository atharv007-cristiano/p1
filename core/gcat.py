import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Any, List

class GCATFusion(nn.Module):
    """
    Gated Cross-Attention Transformer (GCAT) Fusion Module.
    Dynamically gates and fuses the 4 active modalities based on content quality flags.
    Allows graceful degradation: if audio or behavioral landmaps are missing, the gate is
    attenuated, and the Transformer re-fuses active elements to output a reliable Trust Score.
    """
    def __init__(self, embed_dim: int = 512, heads: int = 8, depth: int = 2):
        super(GCATFusion, self).__init__()
        
        # Modality Gating Weights Projectors
        # Computes dynamic scalar gating values based on incoming channel representations
        self.gate_v = nn.Sequential(nn.Linear(embed_dim, 1), nn.Sigmoid())
        self.gate_a = nn.Sequential(nn.Linear(embed_dim, 1), nn.Sigmoid())
        self.gate_t = nn.Sequential(nn.Linear(embed_dim, 1), nn.Sigmoid())
        self.gate_b = nn.Sequential(nn.Linear(embed_dim, 1), nn.Sigmoid())
        
        # Positional token embeddings for the 4 fused modality slots
        self.modality_embeddings = nn.Parameter(torch.randn(4, embed_dim))
        
        # Multi-Layer Transformer Encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=embed_dim,
            nhead=heads,
            dim_feedforward=embed_dim * 4,
            dropout=0.1,
            activation="gelu",
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=depth)
        
        # Final classification and Trust Score heads
        self.classification_head = nn.Sequential(
            nn.Linear(embed_dim, 128),
            nn.ReLU(),
            nn.Linear(128, 1)
        )

    def forward(
        self, 
        v: torch.Tensor, 
        a: torch.Tensor, 
        t: torch.Tensor, 
        b: torch.Tensor,
        quality_flags: torch.Tensor = None
    ) -> Dict[str, torch.Tensor]:
        """
        Args:
            v: Visual embedding [Batch, embed_dim]
            a: Audio embedding [Batch, embed_dim]
            t: NLP Semantic embedding [Batch, embed_dim]
            b: Behavioral embedding [Batch, embed_dim]
            quality_flags: Quality binary tensors [Batch, 4] denoting validity of [V, A, T, B]
            
        Returns:
            Dictionary containing:
            - "trust_score": Unified Trust Score [Batch] within [0.0, 1.0] (high is authentic)
            - "fusion_embedding": Unified representation [Batch, embed_dim]
            - "gating_weights": Gating coefficients applied [Batch, 4]
        """
        B = v.shape[0]
        device = v.device
        
        if quality_flags is None:
            # Default to all modalities active
            quality_flags = torch.ones(B, 4, device=device)
            
        # 1. Compute input-dependent gating weights
        g_v = self.gate_v(v) * quality_flags[:, 0].unsqueeze(1)
        g_a = self.gate_a(a) * quality_flags[:, 1].unsqueeze(1)
        g_t = self.gate_t(t) * quality_flags[:, 2].unsqueeze(1)
        g_b = self.gate_b(b) * quality_flags[:, 3].unsqueeze(1)
        
        # Apply gate multipliers
        v_gated = v * g_v
        a_gated = a * g_a
        t_gated = t * g_t
        b_gated = b * g_b
        
        # 2. Add structural modality identifiers
        v_tokens = v_gated + self.modality_embeddings[0].unsqueeze(0)
        a_tokens = a_gated + self.modality_embeddings[1].unsqueeze(0)
        t_tokens = t_gated + self.modality_embeddings[2].unsqueeze(0)
        b_tokens = b_gated + self.modality_embeddings[3].unsqueeze(0)
        
        # Stack into sequence of tokens: [Batch, 4, embed_dim]
        tokens = torch.stack((v_tokens, a_tokens, t_tokens, b_tokens), dim=1)
        
        # 3. Fuse tokens using the self-attention transformer
        fused_tokens = self.transformer(tokens) # [Batch, 4, embed_dim]
        
        # Weighted mean pooling based on final gated activity ratios
        gate_sums = (g_v + g_a + g_t + g_b) + 1e-8
        weights = torch.stack((g_v, g_a, g_t, g_b), dim=1) # [Batch, 4, 1]
        
        fused_embedding = torch.sum(fused_tokens * weights, dim=1) / gate_sums # [Batch, embed_dim]
        
        # 4. Compute Unified Trust Score (TS)
        # Logits of 0 or higher indicate safety/authenticity, negative represents fraud.
        logits = self.classification_head(fused_embedding).squeeze(1)
        trust_score = torch.sigmoid(logits)
        
        gating_coefficients = torch.cat((g_v, g_a, g_t, g_b), dim=1) # [Batch, 4]
        
        return {
            "trust_score": trust_score,
            "fusion_embedding": fused_embedding,
            "gating_weights": gating_coefficients,
            "fusion_logits": logits
        }
