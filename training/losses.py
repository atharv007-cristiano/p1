import torch
import torch.nn as nn
import torch.nn.functional as F

class FocalLoss(nn.Module):
    """
    Focal Loss.
    Addresses class imbalance and focuses model training on hard/borderline
    forgery boundaries by down-weighting easy, well-classified examples.
    Formula: L = -alpha * (1 - p_t)^gamma * log(p_t)
    """
    def __init__(self, alpha: float = 0.25, gamma: float = 2.0):
        super(FocalLoss, self).__init__()
        self.alpha = alpha
        self.gamma = gamma

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        probs = torch.sigmoid(logits)
        # Compute focal indicators
        # targets are expected to be 0 (deepfake) or 1 (authentic)
        p_t = probs * targets + (1 - probs) * (1 - targets)
        
        bce_loss = F.binary_cross_entropy_with_logits(logits, targets, reduction='none')
        focal_decay = (1 - p_t) ** self.gamma
        
        loss = self.alpha * focal_decay * bce_loss
        return loss.mean()


class ContrastiveAudioVisualLoss(nn.Module):
    """
    AVoiD-DF Contrastive Audio-Visual Learning Loss.
    Forces the network to learn shared cross-modal representations.
    Calculates positive matches (paired video/voice from the same asset) against 
    negative targets in the active mini-batch.
    """
    def __init__(self, temperature: float = 0.07):
        super(ContrastiveAudioVisualLoss, self).__init__()
        self.temperature = temperature

    def forward(self, visual_embeddings: torch.Tensor, audio_embeddings: torch.Tensor) -> torch.Tensor:
        """
        Args:
            visual_embeddings: Fused spatial representation [Batch, embed_dim]
            audio_embeddings: Fused acoustic representation [Batch, embed_dim]
            
        Returns:
            Scalar contrastive loss
        """
        B = visual_embeddings.shape[0]
        
        # Normalize representations to project onto unit hypersphere
        v_norm = F.normalize(visual_embeddings, p=2, dim=1)
        a_norm = F.normalize(audio_embeddings, p=2, dim=1)
        
        # Compute complete cosine similarity matrix [Batch, Batch]
        similarity_matrix = torch.matmul(v_norm, a_norm.t()) / self.temperature
        
        # Binary target flags: paired diagonal indices represent the authentic cross-modal pairs
        labels = torch.arange(B, device=visual_embeddings.device)
        
        # Loss: cross entropy calculated across both axes
        loss_v = F.cross_entropy(similarity_matrix, labels)
        loss_a = F.cross_entropy(similarity_matrix.t(), labels)
        
        return (loss_v + loss_a) / 2.0


class DeepShieldCompositeLoss(nn.Module):
    """
    Composite Loss function for DeepShield Training.
    Formula: L = 0.5 * L_BCE + 0.3 * L_focal + 0.2 * L_cmide + 0.1 * L_contrastive_AV
    """
    def __init__(self, alpha: float = 0.25, gamma: float = 2.0, temperature: float = 0.07):
        super(DeepShieldCompositeLoss, self).__init__()
        self.focal_loss = FocalLoss(alpha=alpha, gamma=gamma)
        self.contrastive_loss = ContrastiveAudioVisualLoss(temperature=temperature)

    def forward(
        self,
        final_logits: torch.Tensor,
        inconsistency_logits: torch.Tensor,
        visual_embeddings: torch.Tensor,
        audio_embeddings: torch.Tensor,
        targets: torch.Tensor
    ) -> Dict[str, torch.Tensor]:
        """
        Args:
            final_logits: Fused classifier logits [Batch]
            inconsistency_logits: Intermediate CMIDE outputs [Batch]
            visual_embeddings: VFM outputs [Batch, Dim]
            audio_embeddings: AFM outputs [Batch, Dim]
            targets: Label class indices [Batch] (0 or 1)
            
        Returns:
            Dictionary detailing composite sub-scores and aggregated loss values
        """
        # 1. Binary Cross Entropy Loss
        l_bce = F.binary_cross_entropy_with_logits(final_logits, targets)
        
        # 2. Focal Loss
        l_focal = self.focal_loss(final_logits, targets)
        
        # 3. CMIDE Inconsistency Loss
        l_cmide = F.binary_cross_entropy_with_logits(inconsistency_logits, targets)
        
        # 4. Contrastive AV Loss
        l_contrastive = self.contrastive_loss(visual_embeddings, audio_embeddings)
        
        # Synthesize composite loss
        l_composite = (0.5 * l_bce) + (0.3 * l_focal) + (0.2 * l_cmide) + (0.1 * l_contrastive)
        
        return {
            "loss": l_composite,
            "bce_loss": l_bce,
            "focal_loss": l_focal,
            "cmide_loss": l_cmide,
            "contrastive_loss": l_contrastive
        }
