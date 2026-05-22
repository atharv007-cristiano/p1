import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Any, Tuple

class CrossModalAttention(nn.Module):
    """
    Standard Multi-Head Cross-Attention Layer.
    Computes query vectors from Modality A and matches them against key/value matrices 
    of Modality B to map relational alignment weights.
    """
    def __init__(self, embed_dim: int = 512, heads: int = 8):
        super(CrossModalAttention, self).__init__()
        self.heads = heads
        self.mha = nn.MultiheadAttention(embed_dim=embed_dim, num_heads=heads, batch_first=True)
        self.layer_norm = nn.LayerNorm(embed_dim)

    def forward(self, q: torch.Tensor, kv: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Args:
            q: Query sequence [Batch, Q_Len, embed_dim]
            kv: Key/Value sequence [Batch, KV_Len, embed_dim]
            
        Returns:
            Tuple containing:
            - Fused representation: [Batch, Q_Len, embed_dim]
            - Attention weight map: [Batch, heads, Q_Len, KV_Len]
        """
        # Ensure dimensions match
        # Multi-Head Attention forward pass
        attn_out, attn_weights = self.mha(q, kv, kv)
        
        # Residual addition & layer normalization
        fused = self.layer_norm(attn_out + q)
        return fused, attn_weights


class CMIDEModule(nn.Module):
    """
    Cross-Modal Inconsistency Detection Engine (CMIDE).
    Calculates pairwise attention correlations for four key pairs:
    1. (Visual, Audio)       - Spots vocal-face sync anomalies (AVoiD-DF concept)
    2. (Visual, Text)        - Spots mismatched visual contexts (NSCM)
    3. (Audio, Text)         - Spots vocal text discrepancies
    4. (Visual, Behavioral)  - Spots synthetic expression deviations
    """
    def __init__(self, embed_dim: int = 512):
        super(CMIDEModule, self).__init__()
        self.embed_dim = embed_dim
        
        # Linear projection adapters to align inputs to CMIDE dimensions
        self.v_proj = nn.Linear(embed_dim, embed_dim)
        self.a_proj = nn.Linear(embed_dim, embed_dim)
        self.t_proj = nn.Linear(embed_dim, embed_dim)
        self.b_proj = nn.Linear(embed_dim, embed_dim)
        
        # Pairwise Attention layers
        self.attn_va = CrossModalAttention(embed_dim=embed_dim)
        self.attn_vt = CrossModalAttention(embed_dim=embed_dim)
        self.attn_at = CrossModalAttention(embed_dim=embed_dim)
        self.attn_vb = CrossModalAttention(embed_dim=embed_dim)
        
        # Inconsistency prediction score head
        # Receives the concatenated outputs of the four cross-modal pairs (512 * 4 = 2048 dimensions)
        self.inconsistency_classifier = nn.Sequential(
            nn.Linear(embed_dim * 4, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Linear(128, 1)
        )

    def forward(self, v: torch.Tensor, a: torch.Tensor, t: torch.Tensor, b: torch.Tensor) -> Dict[str, torch.Tensor]:
        """
        Args:
            v: Visual embeddings [Batch, embed_dim]
            a: Audio embeddings [Batch, embed_dim]
            t: Text/Semantic embeddings [Batch, embed_dim]
            b: Behavioral embeddings [Batch, embed_dim]
            
        Returns:
            Dictionary containing inconsistency scores, fused embeddings, and weights
        """
        B = v.shape[0]
        
        # Projects vectors and expand sequence dimensions to [Batch, 1, embed_dim] for Multi-Head Attention
        v_seq = self.v_proj(v).unsqueeze(1)
        a_seq = self.a_proj(a).unsqueeze(1)
        t_seq = self.t_proj(t).unsqueeze(1)
        b_seq = self.b_proj(b).unsqueeze(1)
        
        # 1. Visual-Audio cross attention
        fused_va, weights_va = self.attn_va(v_seq, a_seq)
        
        # 2. Visual-Text cross attention
        fused_vt, weights_vt = self.attn_vt(v_seq, t_seq)
        
        # 3. Audio-Text cross attention
        fused_at, weights_at = self.attn_at(a_seq, t_seq)
        
        # 4. Visual-Behavioral cross attention
        fused_vb, weights_vb = self.attn_vb(v_seq, b_seq)
        
        # Flatten and merge representations
        f_va = fused_va.squeeze(1)
        f_vt = fused_vt.squeeze(1)
        f_at = fused_at.squeeze(1)
        f_vb = fused_vb.squeeze(1)
        
        combined_inconsistencies = torch.cat((f_va, f_vt, f_at, f_vb), dim=1) # [Batch, 2048]
        inconsistency_logits = self.inconsistency_classifier(combined_inconsistencies)
        
        return {
            "inconsistency_logits": inconsistency_logits,
            "fused_va": f_va,
            "fused_vt": f_vt,
            "fused_at": f_at,
            "fused_vb": f_vb,
            "weights_va": weights_va,
            "weights_vt": weights_vt,
            "weights_at": weights_at,
            "weights_vb": weights_vb
        }
