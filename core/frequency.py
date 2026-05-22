import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import scipy.fftpack as fftpack
from typing import Dict, Any

class FrequencyForensicsBranch(nn.Module):
    """
    Frequency Domain Branch for Visual Forensics.
    Extracts 2D Fast Fourier Transform (FFT) and 2D Discrete Cosine Transform (DCT)
    amplitudes to discover high-frequency artifacts left by GANs, VAEs, or diffusion generators.
    """
    def __init__(self, input_channels: int = 3, feature_dim: int = 128):
        super(FrequencyForensicsBranch, self).__init__()
        # Convolutional layers to process the radial frequency spectrum patterns
        self.conv1 = nn.Conv2d(input_channels, 32, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, stride=2, padding=1)
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, stride=2, padding=1)
        self.pool = nn.AdaptiveAvgPool2d((8, 8))
        
        # Multi-Layer Perceptron (MLP) to output classification and embedding representation
        self.fc = nn.Sequential(
            nn.Linear(128 * 8 * 8, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, feature_dim)
        )
        
        self.anomaly_classifier = nn.Linear(feature_dim, 1)

    def extract_fft_spectrum(self, x: torch.Tensor) -> torch.Tensor:
        """
        Computes the 2D Fast Fourier Transform (FFT) power spectrum.
        Centers the low frequencies and calculates log-amplitude.
        
        Args:
            x: Input tensor of shape [Batch, Channels, Height, Width]
            
        Returns:
            Log power spectrum of shape [Batch, Channels, Height, Width]
        """
        # x is expected to be normalized [0, 1]
        # Perform 2D real FFT (using modern torch.fft APIs)
        fft_complex = torch.fft.fft2(x, norm="ortho")
        fft_shifted = torch.fft.fftshift(fft_complex, dim=(-2, -1))
        
        # Calculate amplitude spectrum
        amplitude = torch.abs(fft_shifted)
        
        # Logarithmic scaling to avoid numerical saturation of low-frequency spikes
        log_spectrum = torch.log1p(amplitude)
        return log_spectrum

    def extract_dct_spectrum(self, x: torch.Tensor) -> torch.Tensor:
        """
        Computes 2D Discrete Cosine Transform (DCT) residuals.
        Approximates a 2D DCT using standard PyTorch operations.
        
        Args:
            x: Input tensor of shape [Batch, Channels, Height, Width]
            
        Returns:
            DCT coefficient maps of shape [Batch, Channels, Height, Width]
        """
        # PyTorch doesn't have a native torch.dct2d, so we implement a clean 2D DCT-II 
        # using the standard 1D DCT formulation via 1D FFT or matrix multiplication.
        B, C, H, W = x.shape
        device = x.device
        
        # Create standard DCT matrices
        def dct_matrix(N: int) -> torch.Tensor:
            n = torch.arange(N, dtype=torch.float32, device=device).unsqueeze(1)
            k = torch.arange(N, dtype=torch.float32, device=device).unsqueeze(0)
            M = torch.cos(np.pi / N * (n + 0.5) * k)
            M[:, 0] = M[:, 0] * np.sqrt(1.0 / N)
            M[:, 1:] = M[:, 1:] * np.sqrt(2.0 / N)
            return M
        
        M_h = dct_matrix(H)
        M_w = dct_matrix(W)
        
        # DCT-II: M_h^T * X * M_w
        # Reshape to perform batch matrix multiplies
        x_reshaped = x.view(B * C, H, W)
        dct_out = torch.bmm(M_h.t().unsqueeze(0).expand(B * C, -1, -1), x_reshaped)
        dct_out = torch.bmm(dct_out, M_w.unsqueeze(0).expand(B * C, -1, -1))
        
        return dct_out.view(B, C, H, W)

    def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        """
        Forward pass for frequency-based forgery classification.
        
        Args:
            x: Input RGB tensor of shape [Batch, Channels, Height, Width]
            
        Returns:
            Dictionary containing:
            - "frequency_embedding": Tensor of shape [Batch, feature_dim]
            - "forgery_logits": Tensor of shape [Batch, 1]
            - "fft_map": FFT amplitude visualization map [Batch, Channels, Height, Width]
            - "dct_map": DCT residual map [Batch, Channels, Height, Width]
        """
        # Extract features
        fft_map = self.extract_fft_spectrum(x)
        dct_map = self.extract_dct_spectrum(x)
        
        # Combine FFT and DCT maps as frequency features (focusing on FFT log amplitudes here)
        out = F.relu(self.conv1(fft_map))
        out = F.relu(self.conv2(out))
        out = F.relu(self.conv3(out))
        out = self.pool(out)
        out = out.view(out.size(0), -1)
        
        embedding = self.fc(out)
        logits = self.anomaly_classifier(embedding)
        
        return {
            "frequency_embedding": embedding,
            "forgery_logits": logits,
            "fft_map": fft_map,
            "dct_map": dct_map
        }
