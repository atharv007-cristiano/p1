import torch
import torch.nn as nn
import numpy as np
from typing import Dict, Any, List

class rPPGLivenessExtractor(nn.Module):
    """
    Remote Photoplethysmography (rPPG) Forensics Module.
    Inspired by Intel's FakeCatcher. Extracts blood-volume pulse (BVP) signals 
    from facial skin pixels to determine physical liveness. Deepfakes typically
    fail to preserve cohesive spatial-temporal blood flow frequencies.
    """
    def __init__(self, sample_rate: int = 30, window_size: int = 150):
        super(rPPGLivenessExtractor, self).__init__()
        self.sample_rate = sample_rate     # Standard frame rate (fps)
        self.window_size = window_size     # Duration (in frames) to analyze (e.g., 5 seconds @ 30fps)
        
        # Neural classification head for multi-region spatial rPPG correlation maps
        self.feature_extractor = nn.Sequential(
            nn.Conv2d(1, 16, kernel_size=3, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(16, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((4, 4))
        )
        
        self.classifier = nn.Sequential(
            nn.Linear(64 * 4 * 4, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 1)
        )

    def extract_chrom_bvp(self, facial_roi: np.ndarray) -> np.ndarray:
        """
        Extracts Blood Volume Pulse (BVP) from a facial region of interest (ROI)
        using the Chrominance-based (CHROM) method.
        
        Args:
            facial_roi: Numpy array of shape [Frames, Height, Width, Channels] in RGB
            
        Returns:
            1D array of temporal BVP signals of shape [Frames]
        """
        # Average the spatial skin pixels per frame
        # shape -> [Frames, 3]
        mean_rgb = np.mean(facial_roi, axis=(1, 2))
        
        # Temporal bandpass filter wrapper to isolate heart rate (0.7 Hz to 3.0 Hz, 42-180 BPM)
        T = mean_rgb.shape[0]
        if T < self.window_size:
            # Pad signals if too short
            mean_rgb = np.pad(mean_rgb, ((0, self.window_size - T), (0, 0)), mode='edge')
            
        # CHROM method (de Haan & Jeanne)
        # Normalize signals
        w_size = 30 # moving window
        bvp = np.zeros(mean_rgb.shape[0])
        
        for i in range(mean_rgb.shape[0] - w_size):
            chunk = mean_rgb[i:i+w_size]
            mean_chunk = np.mean(chunk, axis=0)
            norm_chunk = chunk / (mean_chunk + 1e-6)
            
            # Chrominance signals
            xs = 3.0 * norm_chunk[:, 0] - 2.0 * norm_chunk[:, 1] # 3R - 2G
            ys = 1.5 * norm_chunk[:, 0] + norm_chunk[:, 1] - 1.5 * norm_chunk[:, 2] # 1.5R + G - 1.5B
            
            # Bandpass filter coefficients in frequency domain (simplified POS/CHROM step)
            # Combine signals using standard deviations
            alpha = np.std(xs) / (np.std(ys) + 1e-6)
            bvp_win = xs - alpha * ys
            bvp[i:i+w_size] += bvp_win
            
        return bvp

    def build_spatial_ppg_map(self, face_frames: np.ndarray, landmarks: np.ndarray = None) -> np.ndarray:
        """
        Extracts independent BVP signals from 8 distinct facial subregions:
        1. Forehead (Center)
        2. Forehead (Left)
        3. Forehead (Right)
        4. Left Cheek
        5. Right Cheek
        6. Nose Bridge
        7. Chin
        8. Upper Lip
        
        Computes pairwise cross-correlation matrices between the 8 signals to map liveness consistency.
        
        Args:
            face_frames: RGB sequence of cropped face images [Frames, Height, Width, 3]
            landmarks: Optional facial landmarks.
            
        Returns:
            An 8x8 correlation matrix (spatial PPG map)
        """
        F, H, W, C = face_frames.shape
        
        # Split facial frame spatially into 8 grids to represent the distinct regions
        regions = {
            "forehead_c": face_frames[:, :H//4, W//3:2*W//3],
            "forehead_l": face_frames[:, :H//4, :W//3],
            "forehead_r": face_frames[:, :H//4, 2*W//3:],
            "left_cheek": face_frames[:, H//3:2*H//3, :W//3],
            "right_cheek": face_frames[:, H//3:2*H//3, 2*W//3:],
            "nose": face_frames[:, H//3:2*H//3, W//3:2*W//3],
            "chin": face_frames[:, 2*H//3:, W//3:2*W//3],
            "mouth_lip": face_frames[:, 3*H//4:, W//4:3*W//4]
        }
        
        bvp_signals = []
        for name, roi in regions.items():
            bvp = self.extract_chrom_bvp(roi)
            bvp_signals.append(bvp)
            
        # Compute 8x8 correlation matrix
        bvp_signals = np.array(bvp_signals) # shape [8, Frames]
        corr_matrix = np.corrcoef(bvp_signals)
        # Handle potential NaNs due to constant color crops
        corr_matrix = np.nan_to_num(corr_matrix, nan=0.0)
        
        return corr_matrix

    def forward(self, ppg_maps: torch.Tensor) -> Dict[str, torch.Tensor]:
        """
        Classifies liveness based on spatial PPG cross-correlation maps.
        
        Args:
            ppg_maps: Spatial PPG map tensor of shape [Batch, 1, 8, 8]
            
        Returns:
            Dictionary containing:
            - "liveness_logits": Logits of shape [Batch, 1] (high = real, low = fake)
            - "ppg_embedding": Extracted feature representations [Batch, 128]
        """
        features = self.feature_extractor(ppg_maps)
        flat_features = features.view(features.size(0), -1)
        embedding = nn.Sequential(*list(self.classifier.children())[:-1])(flat_features)
        logits = self.classifier(flat_features)
        
        return {
            "liveness_logits": logits,
            "ppg_embedding": embedding
        }
