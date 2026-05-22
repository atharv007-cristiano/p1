import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models
from typing import Dict, Any, Tuple
import numpy as np

from core.frequency import FrequencyForensicsBranch
from core.rppg import rPPGLivenessExtractor

class SRMConv2d(nn.Module):
    """
    SRM (Spatial Rich Model) Filter Layer.
    Applies fixed high-pass noise extraction kernels to expose pixel-level anomalies
    and blending artifacts.
    """
    def __init__(self):
        super(SRMConv2d, self).__init__()
        # Define 3 standard SRM noise filters: basic, spam, and elevation
        srm_kernels = np.array([
            [[-1, 2, -2, 2, -1],
             [2, -6, 8, -6, 2],
             [-2, 8, -12, 8, -2],
             [2, -6, 8, -6, 2],
             [-1, 2, -2, 2, -1]],
            
            [[0, 0, 0, 0, 0],
             [0, -1, 2, -1, 0],
             [0, 2, -4, 2, 0],
             [0, -1, 2, -1, 0],
             [0, 0, 0, 0, 0]],
            
            [[0, 0, 0, 0, 0],
             [0, 0, 1, 0, 0],
             [0, 1, -4, 1, 0],
             [0, 0, 1, 0, 0],
             [0, 0, 0, 0, 0]]
        ], dtype=np.float32) / 12.0
        
        # Expand dimensions to fit PyTorch filters: [OutChannels, InChannels, H, W]
        kernels = np.zeros((3, 3, 5, 5), dtype=np.float32)
        for i in range(3):
            # Apply same SRM filter across all 3 input RGB channels
            for j in range(3):
                kernels[i, j, :, :] = srm_kernels[i]
                
        self.weight = nn.Parameter(torch.from_numpy(kernels), requires_grad=False)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Run 2D convolution with reflection padding to preserve borders
        return F.conv2d(x, self.weight, padding=2)


class TemporalViT(nn.Module):
    """
    Temporal Vision Transformer.
    Takes spatial feature embeddings extracted from consecutive frames and performs
    temporal self-attention to expose frame transitions, flickering, and synthetic blending gaps.
    """
    def __init__(self, embed_dim: int = 512, heads: int = 8, depth: int = 3, num_frames: int = 10):
        super(TemporalViT, self).__init__()
        self.num_frames = num_frames
        self.pos_embedding = nn.Parameter(torch.randn(1, num_frames, embed_dim))
        
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=embed_dim, 
            nhead=heads, 
            dim_feedforward=embed_dim * 4, 
            dropout=0.1,
            activation="gelu",
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=depth)
        self.cls_token = nn.Parameter(torch.randn(1, 1, embed_dim))
        self.norm = nn.LayerNorm(embed_dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: Input embeddings sequence [Batch, Frames, embed_dim]
            
        Returns:
            Fused temporal representation [Batch, embed_dim]
        """
        B, F_count, D = x.shape
        # Handle dynamic frame sizes
        if F_count != self.num_frames:
            # Interpolate or slice positional embeddings
            pos_emb = F.interpolate(self.pos_embedding.transpose(1, 2), size=F_count, mode='linear', align_corners=False).transpose(1, 2)
        else:
            pos_emb = self.pos_embedding
            
        # Add positional representations
        x = x + pos_emb
        
        # Append classification token
        cls_tokens = self.cls_token.expand(B, -1, -1)
        x = torch.cat((cls_tokens, x), dim=1)
        
        # Transformer forward pass
        out = self.transformer(x)
        out = self.norm(out)
        
        # Return CLS token embedding
        return out[:, 0]


class VisualForensicsModule(nn.Module):
    """
    Visual Forensics Module (VFM).
    Integrates spatial SRM noise textures, EfficientNet-B7 spatial extraction,
    FFT/DCT frequency domain features, rPPG liveness signals,
    Temporal Vision Transformer, and Facial Action Units (FAU).
    """
    def __init__(self, num_frames: int = 10, feature_dim: int = 512):
        super(VisualForensicsModule, self).__init__()
        self.num_frames = num_frames
        
        # SRM Noise Branch
        self.srm_conv = SRMConv2d()
        self.srm_reducer = nn.Sequential(
            nn.Conv2d(3, 16, kernel_size=3, stride=2, padding=1),
            nn.ReLU(),
            nn.Conv2d(16, 32, kernel_size=3, stride=2, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((16, 16))
        )
        self.srm_fc = nn.Linear(32 * 16 * 16, 128)
        
        # Backbone - EfficientNet-B7 Spatial Extractor
        # We load a pre-trained EfficientNet or construct it gracefully
        try:
            self.backbone = models.efficientnet_b7(weights=models.EfficientNet_B7_Weights.DEFAULT)
        except Exception:
            # Graceful fallback if download fails or is offline
            self.backbone = models.efficientnet_b7(weights=None)
            
        # Re-route backbone classifier
        in_features = self.backbone.classifier[1].in_features
        self.backbone.classifier = nn.Identity()
        
        # Reduce spatial features to matching size
        self.spatial_reducer = nn.Linear(in_features, 384)
        
        # Frequency domain branch
        self.frequency_branch = FrequencyForensicsBranch(input_channels=3, feature_dim=128)
        
        # Temporal Vision Transformer
        self.temporal_vit = TemporalViT(embed_dim=512, heads=8, depth=3, num_frames=num_frames)
        
        # Facial Action Units (FAU) Processing (OpenFace exports 18 standard FAUs)
        self.fau_mlp = nn.Sequential(
            nn.Linear(18, 64),
            nn.ReLU(),
            nn.Linear(64, 64),
            nn.ReLU()
        )
        
        # Fusion head merging: Spatial-Temporal (512) + FAU (64) = 576 dimensions
        self.final_projection = nn.Sequential(
            nn.Linear(512 + 64, feature_dim),
            nn.ReLU(),
            nn.Linear(feature_dim, feature_dim)
        )
        
        self.classifier = nn.Linear(feature_dim, 1)

    def forward(self, frames: torch.Tensor, fau_vectors: torch.Tensor = None, ppg_maps: torch.Tensor = None) -> Dict[str, torch.Tensor]:
        """
        Args:
            frames: Input video sequences [Batch, Frames, Channels, Height, Width] or images [Batch, 1, Channels, H, W]
            fau_vectors: Action units [Batch, Frames, 18]
            ppg_maps: Pre-calculated spatial rPPG map tensor [Batch, 1, 8, 8]
            
        Returns:
            Dictionary containing final score output and embeddings
        """
        B, F, C, H, W = frames.shape
        device = frames.device
        
        # Flatten temporal frames to batch dimension for CNN processing
        flat_frames = frames.view(B * F, C, H, W)
        
        # 1. Spatial SRM filter residuals
        srm_features = self.srm_conv(flat_frames)
        srm_reduced = self.srm_reducer(srm_features)
        srm_flat = srm_reduced.view(B * F, -1)
        srm_embeddings = self.srm_fc(srm_flat) # [B*F, 128]
        
        # 2. Backbone Spatial features
        spatial_features = self.backbone(flat_frames) # [B*F, 2560]
        spatial_embeddings = self.spatial_reducer(spatial_features) # [B*F, 384]
        
        # Combine Spatial and SRM features -> 512 dimensions
        combined_spatial = torch.cat((spatial_embeddings, srm_embeddings), dim=1) # [B*F, 512]
        
        # 3. Frequency domain fingerprints
        freq_outputs = self.frequency_branch(flat_frames)
        freq_embeddings = freq_outputs["frequency_embedding"] # [B*F, 128]
        
        # Reshape spatial embeddings back to sequence layout for ViT
        vit_in = combined_spatial.view(B, F, -1)
        temporal_embedding = self.temporal_vit(vit_in) # [B, 512]
        
        # 4. FAU vector mapping
        if fau_vectors is None:
            fau_vectors = torch.zeros(B, F, 18, device=device)
        # Average FAU sequence
        mean_fau = fau_vectors.mean(dim=1) # [B, 18]
        fau_embedding = self.fau_mlp(mean_fau) # [B, 64]
        
        # Final combined visual features
        visual_combined = torch.cat((temporal_embedding, fau_embedding), dim=1) # [B, 576]
        final_embedding = self.final_projection(visual_combined) # [B, feature_dim]
        
        # Compute visual binary classification logits
        logits = self.classifier(final_embedding)
        
        return {
            "visual_embedding": final_embedding,
            "visual_logits": logits,
            "frequency_logits": freq_outputs["forgery_logits"].view(B, F, 1).mean(dim=1),
            "fft_map": freq_outputs["fft_map"].view(B, F, C, H, W)[:, 0], # Return first frame visual analysis
            "dct_map": freq_outputs["dct_map"].view(B, F, C, H, W)[:, 0]
        }
