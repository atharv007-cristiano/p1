import torch
import torch.nn as nn
from typing import Dict, Any, Tuple

class GroundingHead(nn.Module):
    """
    DGM4 Grounding Head (TPAMI 2024).
    Provides deep neural explainability by generating:
    - Bounding Box [x1, y1, x2, y2] isolating manipulated face areas.
    - Temporal Range [start_seconds, end_seconds] isolating manipulated voice segments.
    """
    def __init__(self, feature_dim: int = 512):
        super(GroundingHead, self).__init__()
        
        # Spatial bounding box regressor (outputs normalized coordinates: xmin, ymin, xmax, ymax)
        self.spatial_bbox_regressor = nn.Sequential(
            nn.Linear(feature_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Linear(128, 4),
            nn.Sigmoid() # Restricts output coordinates to [0, 1] relative to frame sizes
        )
        
        # Temporal boundary estimator (outputs normalized segment percentages: start_ratio, end_ratio)
        self.temporal_range_regressor = nn.Sequential(
            nn.Linear(feature_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Linear(128, 2),
            nn.Sigmoid() # Restricts values to [0, 1]
        )

    def forward(
        self, 
        fusion_embedding: torch.Tensor, 
        duration_seconds: float = 10.0
    ) -> Dict[str, torch.Tensor]:
        """
        Predicts manipulated bounding boxes and timestamp intervals.
        
        Args:
            fusion_embedding: Multi-modal representation tensor [Batch, feature_dim]
            duration_seconds: Total length of the processed file in seconds
            
        Returns:
            Dictionary containing:
            - "bbox_coordinates": [Batch, 4] -> [x_min, y_min, x_max, y_max]
            - "audio_timestamp_range": [Batch, 2] -> [start_second, end_second]
        """
        B = fusion_embedding.shape[0]
        
        # 1. Regress bounding box coordinates
        bboxes = self.spatial_bbox_regressor(fusion_embedding) # [Batch, 4]
        
        # 2. Regress temporal start/end ratios
        temporal_ratios = self.temporal_range_regressor(fusion_embedding) # [Batch, 2]
        
        # Ensure start_ratio is strictly less than or equal to end_ratio
        start_ratio = temporal_ratios[:, 0]
        end_ratio = torch.max(start_ratio + 0.05, temporal_ratios[:, 1])
        end_ratio = torch.clamp(end_ratio, max=1.0)
        
        # Map ratios to physical video durations (seconds)
        start_time = start_ratio * duration_seconds
        end_time = end_ratio * duration_seconds
        
        timestamp_range = torch.stack((start_time, end_time), dim=1) # [Batch, 2]
        
        return {
            "bbox_coordinates": bboxes,
            "audio_timestamp_range": timestamp_range
        }
