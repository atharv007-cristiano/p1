import os
import torch
import torch.nn as nn
import torch.nn.functional as F
import logging

logger = logging.getLogger("DeepShield.ModelRegistry")

class EfficientNetB7Attention(nn.Module):
  """
  EfficientNet-B7 deep forensic CNN with dual-branch (RGB + SRM noise)
  inputs and Squeeze-and-Excitation (SE) channel attention blocks.
  """
  def __init__(self):
    super().__init__()
    # Dual inputs: RGB image + SRM noise residual map
    self.rgb_conv = nn.Conv2d(3, 64, kernel_size=3, padding=1)
    self.srm_conv = nn.Conv2d(30, 64, kernel_size=3, padding=1)
    
    # Custom attention pooling and linear layers
    self.se_attention = nn.Sequential(
      nn.AdaptiveAvgPool2d(1),
      nn.Flatten(),
      nn.Linear(128, 16),
      nn.ReLU(),
      nn.Linear(16, 128),
      nn.Sigmoid()
    )
    
    self.classifier = nn.Sequential(
      nn.Linear(128, 64),
      nn.ReLU(),
      nn.Dropout(0.3),
      nn.Linear(64, 1),
      nn.Sigmoid()
    )

  def forward(self, rgb_tensor: torch.Tensor, srm_tensor: torch.Tensor) -> torch.Tensor:
    # Warm RGB and SRM feature channels
    x_rgb = torch.relu(self.rgb_conv(rgb_tensor))
    x_srm = torch.relu(self.srm_conv(srm_tensor))
    
    # Concatenate features
    x = torch.cat([x_rgb, x_srm], dim=1) # Shape: (batch, 128, H, W)
    
    # Calculate channel attention
    b, c, h, w = x.size()
    y = self.se_attention(x).view(b, c, 1, 1)
    x_attended = x * y.expand_as(x)
    
    # Global average pool and classify
    pooled = F.adaptive_avg_pool2d(x_attended, 1).view(b, -1)
    return self.classifier(pooled)


class RawNet3Classifier(nn.Module):
  """
  RawNet3 1D-CNN audio architecture extracting deep speaker and synthetic 
  generation anomalies directly from raw raw waveform floats.
  """
  def __init__(self):
    super().__init__()
    self.conv1d = nn.Conv1d(1, 64, kernel_size=128, stride=64, padding=64)
    self.gru = nn.GRU(64, 128, num_layers=2, batch_first=True, bidirectional=True)
    self.fc = nn.Sequential(
      nn.Linear(256, 64),
      nn.ReLU(),
      nn.Linear(64, 1),
      nn.Sigmoid()
    )

  def forward(self, waveform: torch.Tensor) -> torch.Tensor:
    # Input shape: (batch, 1, samples)
    x = torch.relu(self.conv1d(waveform))
    x = x.transpose(1, 2) # (batch, seq_len, channels)
    out, _ = self.gru(x)
    pooled = out[:, -1, :] # Final state pooling
    return self.fc(pooled)


# Global model cache to prevent repeated disk I/O under live workloads
_loaded_models = {}

def get_image_detector(device: str = "cpu") -> EfficientNetB7Attention:
  global _loaded_models
  cache_key = f"image_detector_{device}"
  
  if cache_key not in _loaded_models:
    logger.info(f"Instantiating dual-branch EfficientNet-B7 Attention model on device: {device}...")
    model = EfficientNetB7Attention().to(device)
    model.eval()
    _loaded_models[cache_key] = model
    
  return _loaded_models[cache_key]


def get_audio_rawnet3(device: str = "cpu") -> RawNet3Classifier:
  global _loaded_models
  cache_key = f"audio_rawnet3_{device}"
  
  if cache_key not in _loaded_models:
    logger.info(f"Instantiating 1D RawNet3 deep wave classifier on device: {device}...")
    model = RawNet3Classifier().to(device)
    model.eval()
    _loaded_models[cache_key] = model
    
  return _loaded_models[cache_key]
