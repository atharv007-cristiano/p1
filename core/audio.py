import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from typing import Dict, Any

class RawNet3Backbone(nn.Module):
    """
    RawNet3-inspired 1D CNN Backbone.
    Directly processes raw audio waveforms to detect low-level acoustic anomalies,
    splicing, or synthesis artifacts that vocoders fail to reconstruct smoothly.
    """
    def __init__(self, in_channels: int = 1, out_channels: int = 256):
        super(RawNet3Backbone, self).__init__()
        # Initial 1D feature extraction layers (simulated Sinc-convolution or raw 1D filter banks)
        self.conv1 = nn.Conv1d(in_channels, 64, kernel_size=251, stride=3, padding=125)
        self.bn1 = nn.BatchNorm1d(64)
        
        # Residual 1D block stack
        self.layer1 = self._make_layer(64, 128, kernel_size=3, stride=2)
        self.layer2 = self._make_layer(128, 256, kernel_size=3, stride=2)
        
        self.pool = nn.AdaptiveAvgPool1d(1)
        self.fc = nn.Linear(256, out_channels)

    def _make_layer(self, in_c: int, out_c: int, kernel_size: int, stride: int) -> nn.Sequential:
        return nn.Sequential(
            nn.Conv1d(in_c, out_c, kernel_size=kernel_size, stride=stride, padding=1),
            nn.BatchNorm1d(out_c),
            nn.ReLU(),
            nn.Conv1d(out_c, out_c, kernel_size=3, padding=1),
            nn.BatchNorm1d(out_c),
            nn.ReLU()
        )

    def forward(self, waveform: torch.Tensor) -> torch.Tensor:
        """
        Args:
            waveform: Input raw audio tensor of shape [Batch, 1, NumSamples] or [Batch, NumSamples]
            
        Returns:
            Extracted acoustic features of shape [Batch, out_channels]
        """
        if waveform.dim() == 2:
            waveform = waveform.unsqueeze(1)
            
        x = F.relu(self.bn1(self.conv1(waveform)))
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.pool(x).squeeze(-1)
        x = self.fc(x)
        return x


class AudioForensicsModule(nn.Module):
    """
    Audio Forensics Module (AFM).
    Performs dual-branch inspection:
    - Raw waveform analysis using RawNet3 backbone
    - Spectral analysis using Short-Time Fourier Transform (STFT) Mel Spectrograms
    - Mathematical evaluation of prosody (F0 pitch, micro-jitter, shimmer)
    """
    def __init__(self, feature_dim: int = 512):
        super(AudioForensicsModule, self).__init__()
        
        # Raw audio waveform branch
        self.rawnet3 = RawNet3Backbone(in_channels=1, out_channels=256)
        
        # Spectrogram spectral branch
        self.spec_conv = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=3, stride=2, padding=1),
            nn.ReLU(),
            nn.BatchNorm2d(32),
            nn.Conv2d(32, 64, kernel_size=3, stride=2, padding=1),
            nn.ReLU(),
            nn.BatchNorm2d(64),
            nn.AdaptiveAvgPool2d((8, 8))
        )
        self.spec_fc = nn.Linear(64 * 8 * 8, 128)
        
        # Prosodic Feature MLP
        # Receives calculated prosodic descriptors: F0, jitter, shimmer, speech rate
        self.prosody_mlp = nn.Sequential(
            nn.Linear(4, 32),
            nn.ReLU(),
            nn.Linear(32, 64),
            nn.ReLU()
        )
        
        # Unified projection head (256 RawNet + 128 Spectrogram + 64 Prosody = 448 inputs)
        self.final_projection = nn.Sequential(
            nn.Linear(448, feature_dim),
            nn.ReLU(),
            nn.Linear(feature_dim, feature_dim)
        )
        
        self.classifier = nn.Linear(feature_dim, 1)

    def compute_spectrogram(self, waveform: torch.Tensor) -> torch.Tensor:
        """
        Extracts Mel-Spectrogram features from a raw audio waveform using native PyTorch STFT.
        Avoids library dependency crashes.
        """
        B, N = waveform.shape
        # Window size and hop length for standard STFT
        n_fft = 1024
        hop_length = 512
        win = torch.hann_window(n_fft, device=waveform.device)
        
        # Compute STFT
        stft = torch.stft(
            waveform, 
            n_fft=n_fft, 
            hop_length=hop_length, 
            window=win, 
            return_complex=True
        )
        # Power spectrogram
        power_spec = torch.abs(stft) ** 2
        
        # Logarithmic scale mapping
        log_spec = torch.log10(power_spec + 1e-8)
        return log_spec.unsqueeze(1) # [Batch, 1, Freq, Time]

    @staticmethod
    def extract_prosodic_features(waveform_np: np.ndarray, sr: int = 16000) -> np.ndarray:
        """
        Extracts mathematical parameters describing micro-acoustic dynamics:
        1. F0 Pitch Mean
        2. F0 Pitch Jitter (frequency stability)
        3. Shimmer (amplitude stability)
        4. Speech rate anomalies (energy variance)
        
        Args:
            waveform_np: 1D audio array [NumSamples]
            sr: Sampling rate
            
        Returns:
            A numpy array of shape [4] containing prosodic metrics
        """
        # Ensure it is a flat array
        waveform_np = waveform_np.flatten()
        if len(waveform_np) < 512:
            return np.zeros(4)
            
        # 1. Compute fundamental pitch approximation (F0) using autocorrelation
        # Select frame windows
        frame_size = int(0.03 * sr) # 30ms frames
        hop_size = int(0.015 * sr) # 15ms hops
        f0_list = []
        amp_list = []
        
        for i in range(0, len(waveform_np) - frame_size, hop_size):
            frame = waveform_np[i:i+frame_size]
            amp_list.append(np.max(np.abs(frame)))
            
            # Autocorrelation
            corr = np.correlate(frame, frame, mode='full')
            corr = corr[len(corr)//2:]
            
            # Find peaks outside the center (human fundamental frequency 50Hz to 400Hz)
            min_lag = int(sr / 400)
            max_lag = int(sr / 50)
            
            if len(corr) > max_lag:
                peak_lag = np.argmax(corr[min_lag:max_lag]) + min_lag
                f0 = sr / (peak_lag + 1e-6)
                f0_list.append(f0)
            else:
                f0_list.append(0)
                
        f0_list = np.array(f0_list)
        amp_list = np.array(amp_list)
        
        mean_f0 = np.mean(f0_list[f0_list > 0]) if np.any(f0_list > 0) else 0.0
        
        # 2. Jitter: Absolute differences between successive fundamental frequencies
        diff_f0 = np.abs(np.diff(f0_list[f0_list > 0])) if np.any(f0_list > 0) else [0]
        jitter = np.mean(diff_f0) if len(diff_f0) > 0 else 0.0
        
        # 3. Shimmer: Absolute differences between successive frame peak amplitudes
        diff_amp = np.abs(np.diff(amp_list)) if len(amp_list) > 1 else [0]
        shimmer = np.mean(diff_amp) if len(diff_amp) > 0 else 0.0
        
        # 4. Speech energy rhythm variance (proxy for voice continuity)
        energy_variance = np.var(amp_list) if len(amp_list) > 0 else 0.0
        
        return np.array([mean_f0, jitter, shimmer, energy_variance], dtype=np.float32)

    def forward(self, waveform: torch.Tensor, prosodic_features: torch.Tensor = None) -> Dict[str, torch.Tensor]:
        """
        Args:
            waveform: Input raw audio tensor [Batch, NumSamples]
            prosodic_features: Optional manual features tensor [Batch, 4]
            
        Returns:
            Dictionary containing:
            - "audio_embedding": Fused output representation [Batch, feature_dim]
            - "audio_logits": Classification logit [Batch, 1]
        """
        B, N = waveform.shape
        device = waveform.device
        
        # 1. RawNet3 Branch
        rawnet_emb = self.rawnet3(waveform) # [Batch, 256]
        
        # 2. Spectrogram Branch
        spec = self.compute_spectrogram(waveform) # [Batch, 1, Freq, Time]
        spec_feat = self.spec_conv(spec)
        spec_flat = spec_feat.view(B, -1)
        spec_emb = self.spec_fc(spec_flat) # [Batch, 128]
        
        # 3. Prosody Branch
        if prosodic_features is None:
            # Fallback to zero descriptors if not pre-computed offline
            prosodic_features = torch.zeros(B, 4, device=device)
        prosody_emb = self.prosody_mlp(prosodic_features) # [Batch, 64]
        
        # Complete Audio Fusion
        combined = torch.cat((rawnet_emb, spec_emb, prosody_emb), dim=1) # [Batch, 448]
        final_embedding = self.final_projection(combined) # [Batch, feature_dim]
        
        logits = self.classifier(final_embedding)
        
        return {
            "audio_embedding": final_embedding,
            "audio_logits": logits
        }
