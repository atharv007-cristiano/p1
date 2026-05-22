import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import cv2
from typing import Dict, Any, Tuple, List

class XAIExplainer:
    """
    Explainability Layer (XAI).
    Provides:
    - Grad-CAM heatmaps showing which spatial features triggered forgery alerts.
    - Attention Rollout tracking how self-attention blocks weight individual tokens.
    - SHAP-like attribution metrics detailing the impact of each of the 4 modalities.
    """
    def __init__(self, target_layer: nn.Module = None):
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        self.handlers = []

    def _save_gradient(self, grad: torch.Tensor):
        self.gradients = grad

    def _save_activation(self, module: nn.Module, input: Tuple, output: torch.Tensor):
        self.activations = output

    def register_hooks(self, model: nn.Module, target_layer_name: str = "backbone.features"):
        """
        Registers forward and backward hooks to capture feature activations and gradients.
        """
        # Find the target layer by name
        target_layer = dict(model.named_modules()).get(target_layer_name)
        if target_layer is None:
            # Fallback to last block in standard models if name is not found
            target_layer = list(model.modules())[-5]
            
        self.target_layer = target_layer
        
        # Attach hooks
        h1 = self.target_layer.register_forward_hook(self._save_activation)
        h2 = self.target_layer.register_full_backward_hook(lambda m, gi, go: self._save_gradient(go[0]))
        self.handlers.extend([h1, h2])

    def remove_hooks(self):
        for handler in self.handlers:
            handler.remove()
        self.handlers = []

    def generate_gradcam(self, x: torch.Tensor, class_idx: int = 0) -> np.ndarray:
        """
        Computes 2D Grad-CAM heatmap over activations.
        
        Args:
            x: Input RGB tensor [1, 3, H, W]
            class_idx: Index of target classification category
            
        Returns:
            Normalized 2D heatmap numpy array [H, W]
        """
        if self.activations is None or self.gradients is None:
            return np.zeros((x.shape[-2], x.shape[-1]))
            
        # Global average pooling of gradients
        # shapes: activations -> [1, Channels, h, w], gradients -> [1, Channels, h, w]
        weights = torch.mean(self.gradients, dim=(2, 3), keepdim=True) # [1, Channels, 1, 1]
        
        # Weighted sum of feature map activations
        grad_cam = torch.sum(weights * self.activations, dim=1).squeeze(0) # [h, w]
        
        # Pass through ReLU to keep features with positive correlation to deepfake alert
        grad_cam = F.relu(grad_cam)
        
        # Normalize between [0, 1]
        grad_cam_np = grad_cam.detach().cpu().numpy()
        max_val = np.max(grad_cam_np)
        if max_val > 0:
            grad_cam_np = grad_cam_np / max_val
            
        # Resize to original frame resolution
        grad_cam_resized = cv2.resize(grad_cam_np, (x.shape[-1], x.shape[-2]))
        return grad_cam_resized

    @staticmethod
    def overlay_heatmap(image_np: np.ndarray, heatmap: np.ndarray, alpha: float = 0.5) -> np.ndarray:
        """
        Overlays calculated Grad-CAM heatmaps onto raw input image frames.
        
        Args:
            image_np: RGB raw image [H, W, 3] (0 to 255)
            heatmap: 2D normalized array [H, W] (0.0 to 1.0)
            alpha: Transparency factor
            
        Returns:
            Combined RGB image numpy array [H, W, 3]
        """
        # Convert float heatmap to uint8
        heatmap_uint8 = np.uint8(255 * heatmap)
        
        # Apply JET color mapping
        colored_heatmap = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
        # Convert BGR (OpenCV default) to RGB
        colored_heatmap = cv2.cvtColor(colored_heatmap, cv2.COLOR_BGR2RGB)
        
        # Blend input frame with colorized activations map
        blended = cv2.addWeighted(colored_heatmap, alpha, image_np, 1 - alpha, 0)
        return blended

    @staticmethod
    def compute_attention_rollout(all_attn_weights: List[torch.Tensor]) -> np.ndarray:
        """
        Calculates transformer attention rollout to verify path importance.
        
        Args:
            all_attn_weights: List of tensors of shape [Batch, Heads, SeqLen, SeqLen]
            
        Returns:
            Aggregated tokens correlation matrix
        """
        # Identity matrix representation
        if len(all_attn_weights) == 0:
            return np.eye(4)
            
        # Average across attention heads
        rollout = torch.eye(all_attn_weights[0].shape[-1], device=all_attn_weights[0].device)
        
        for attn in all_attn_weights:
            # Mean across multi-heads
            attn_mean = torch.mean(attn, dim=1).squeeze(0) # [SeqLen, SeqLen]
            
            # Add identity matrix to allow self-retention paths
            I = torch.eye(attn_mean.shape[-1], device=attn_mean.device)
            attn_norm = 0.5 * attn_mean + 0.5 * I
            
            # Normalize row-wise to preserve probability weights
            row_sums = torch.sum(attn_norm, dim=-1, keepdim=True)
            attn_norm = attn_norm / row_sums
            
            # Rollout: multiply weights consecutively
            rollout = torch.matmul(attn_norm, rollout)
            
        return rollout.detach().cpu().numpy()

    @staticmethod
    def compute_shap_attributions(gating_weights: np.ndarray, TrustScore: float) -> Dict[str, float]:
        """
        Calculates SHAP-like attribution scores based on GCAT gating weights
        and the unified Trust Score.
        
        Args:
            gating_weights: Gating scores per modality [4] (representing Visual, Audio, NLP, Behavioral)
            TrustScore: Complete network output score
            
        Returns:
            Dict mapping modality names to relative threat contribution percentages
        """
        modalities = ["Visual (VFM)", "Audio (AFM)", "NLP Semantic (NSCM)", "Behavioral (BADM)"]
        
        # Calculate raw relative weight
        weight_sum = np.sum(gating_weights) + 1e-8
        relative_shares = gating_weights / weight_sum
        
        # Deepfakes trigger low trust scores. Threat attribution is the reverse of safety.
        threat_level = 1.0 - TrustScore
        attributions = {}
        
        for name, share in zip(modalities, relative_shares):
            # Attribution represents how much each modality contributed to discovering a fake
            attributions[name] = float(share * threat_level)
            
        return attributions
