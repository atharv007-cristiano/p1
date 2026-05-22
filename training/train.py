import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from typing import Dict, Any, List
import numpy as np

# Core frameworks
from core.pipeline import DeepShieldPipeline
from training.dataset import MultimodalDeepfakeDataset
from training.losses import DeepShieldCompositeLoss

class GradientReversalLayer(torch.autograd.Function):
    """
    Gradient Reversal Layer (GRL).
    Used in Unsupervised Domain Adaptation. Passes forward inputs unchanged,
    but multiplies back-propagating gradients by a negative scalar (-lambda),
    forcing the feature extractor to learn representations that are invariant 
    across different source/target domains (e.g., social media vs. academic datasets).
    """
    @staticmethod
    def forward(ctx: Any, x: torch.Tensor, alpha: float = 1.0) -> torch.Tensor:
        ctx.alpha = alpha
        return x.view_as(x)

    @staticmethod
    def backward(ctx: Any, grad_output: torch.Tensor) -> Tuple[torch.Tensor, None]:
        return grad_output.neg() * ctx.alpha, None

def grad_reverse(x: torch.Tensor, alpha: float = 1.0) -> torch.Tensor:
    return GradientReversalLayer.apply(x, alpha)


class DomainClassifier(nn.Module):
    """
    Domain Classifier for Domain-Adaptive Deepfake Detection.
    Classifies whether forensic embeddings come from high-quality academic datasets (0)
    or low-quality in-the-wild social media platforms (1).
    """
    def __init__(self, embed_dim: int = 512):
        super(DomainClassifier, self).__init__()
        self.classifier = nn.Sequential(
            nn.Linear(embed_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Linear(128, 1)
        )

    def forward(self, x: torch.Tensor, alpha: float = 1.0) -> torch.Tensor:
        # Reverse gradients during backpropagation to confuse domain alignment
        x_reversed = grad_reverse(x, alpha)
        return self.classifier(x_reversed)


def train_domain_adaptive_pipeline(
    epochs: int = 5,
    batch_size: int = 4,
    learning_rate: float = 1e-4,
    device: str = "cpu"
):
    """
    Complete Domain-Adaptive Fine-Tuning Execution loop.
    Enforces robustness on in-the-wild social media deepfakes (Deepfake-Eval-2024 benchmark).
    """
    device_obj = torch.device(device)
    print(f"Initializing Domain-Adaptive training on device: {device}")
    
    # 1. Instantiate DeepShield Model Orchestrator and Domain classifier
    model = DeepShieldPipeline(device=device)
    domain_classifier = DomainClassifier(embed_dim=512).to(device_obj)
    
    # 2. Instantiate Loss criterions and optimizers
    composite_loss_fn = DeepShieldCompositeLoss()
    optimizer = optim.AdamW(
        list(model.parameters()) + list(domain_classifier.parameters()),
        lr=learning_rate,
        weight_decay=1e-4
    )
    
    # 3. Create simulated multi-domain datasets (Academic vs. Social Media uploads)
    # Source Domain (FaceForensics++/DFDC labelled data)
    source_dataset = MultimodalDeepfakeDataset(
        video_paths=["/data/academic/source_v1.mp4"] * 10,
        audio_paths=["/data/academic/source_a1.wav"] * 10,
        transcript_tokens=[[101, 2005, 1037, 2033, 102]] * 10,
        landmarks_paths=["/data/academic/source_l1.npy"] * 10,
        labels=[1, 0, 1, 0, 1, 0, 1, 0, 1, 0] # 50% authentic, 50% fake
    )
    
    # Target Domain (Unlabelled in-the-wild social media files)
    target_dataset = MultimodalDeepfakeDataset(
        video_paths=["/data/wild/social_v1.mp4"] * 10,
        audio_paths=["/data/wild/social_a1.wav"] * 10,
        transcript_tokens=[[101, 3400, 1045, 102]] * 10,
        landmarks_paths=["/data/wild/social_l1.npy"] * 10,
        labels=[1] * 10 # Labels are ignored during unsupervised domain adaptation
    )
    
    source_loader = DataLoader(source_dataset, batch_size=batch_size, shuffle=True, drop_last=True)
    target_loader = DataLoader(target_dataset, batch_size=batch_size, shuffle=True, drop_last=True)
    
    # 4. Main training loop
    for epoch in range(epochs):
        model.train()
        domain_classifier.train()
        
        epoch_loss = 0.0
        epoch_domain_loss = 0.0
        
        # Zip loaders to process source and target domains concurrently
        for step, (source_batch, target_batch) in enumerate(zip(source_loader, target_loader)):
            # Load source tensors
            s_frames = source_batch["frames"].to(device_obj)
            s_waveform = source_batch["waveform"].to(device_obj)
            s_tokens = source_batch["transcript_tokens"].to(device_obj)
            s_landmarks = source_batch["landmarks"].to(device_obj)
            s_labels = source_batch["label"].to(device_obj)
            
            # Load target tensors
            t_frames = target_batch["frames"].to(device_obj)
            t_waveform = target_batch["waveform"].to(device_obj)
            t_tokens = target_batch["transcript_tokens"].to(device_obj)
            t_landmarks = target_batch["landmarks"].to(device_obj)
            
            optimizer.zero_grad()
            
            # Dynamic alpha calculation for gradient reversal scaling
            p = float(step + epoch * len(source_loader)) / epochs / len(source_loader)
            alpha = 2. / (1. + np.exp(-10 * p)) - 1
            
            # A. Process Source Domain (Enforce classification accuracy)
            # Route VFM spatial and sequence layers
            v_res = model.visual_module(s_frames)
            a_res = model.audio_module(s_waveform)
            t_res = model.nlp_module(s_tokens, v_res["visual_embedding"])
            b_res = model.behavioral_module(s_landmarks)
            
            cmide_res = model.cmide_module(
                v_res["visual_embedding"], 
                a_res["audio_embedding"], 
                t_res["semantic_text_embedding"], 
                b_res["behavioral_embedding"]
            )
            
            gcat_res = model.gcat_fusion(
                v_res["visual_embedding"], 
                a_res["audio_embedding"], 
                t_res["semantic_text_embedding"], 
                b_res["behavioral_embedding"]
            )
            
            # Evaluate source composite losses
            s_losses = composite_loss_fn(
                final_logits=gcat_res["fusion_logits"],
                inconsistency_logits=cmide_res["inconsistency_logits"],
                visual_embeddings=v_res["visual_embedding"],
                audio_embeddings=a_res["audio_embedding"],
                targets=s_labels
            )
            
            s_loss = s_losses["loss"]
            
            # B. Domain Alignment (Source vs Target Domain)
            # Extract target forensic features
            t_v_res = model.visual_module(t_frames)
            t_a_res = model.audio_module(t_waveform)
            t_t_res = model.nlp_module(t_tokens, t_v_res["visual_embedding"])
            t_b_res = model.behavioral_module(t_landmarks)
            
            t_gcat_res = model.gcat_fusion(
                t_v_res["visual_embedding"],
                t_a_res["audio_embedding"],
                t_t_res["semantic_text_embedding"],
                t_b_res["behavioral_embedding"]
            )
            
            # Domain classifications
            source_domain_logits = domain_classifier(gcat_res["fusion_embedding"], alpha)
            target_domain_logits = domain_classifier(t_gcat_res["fusion_embedding"], alpha)
            
            # Target labels: Source = 0, Target = 1
            domain_label_s = torch.zeros(batch_size, 1, device=device_obj)
            domain_label_t = torch.ones(batch_size, 1, device=device_obj)
            
            loss_domain_s = F.binary_cross_entropy_with_logits(source_domain_logits, domain_label_s)
            loss_domain_t = F.binary_cross_entropy_with_logits(target_domain_logits, domain_label_t)
            domain_loss = 0.5 * (loss_domain_s + loss_domain_t)
            
            # Aggregated adversarial training loss
            total_loss = s_loss + 0.1 * domain_loss
            
            total_loss.backward()
            optimizer.step()
            
            epoch_loss += s_loss.item()
            epoch_domain_loss += domain_loss.item()
            
        print(f"Epoch {epoch+1}/{epochs} | Classification Loss: {epoch_loss/len(source_loader):.4f} | Domain Confusion Loss: {epoch_domain_loss/len(source_loader):.4f}")
        
    # 5. Save pre-warmed weights checkpoint
    checkpoint_dir = os.path.join(os.path.dirname(__file__), "..", "checkpoints")
    os.makedirs(checkpoint_dir, exist_ok=True)
    checkpoint_path = os.path.join(checkpoint_dir, "deepshield_domain_adaptive.pth")
    torch.save({
        'model_state_dict': model.state_dict(),
        'domain_classifier_state': domain_classifier.state_dict()
    }, checkpoint_path)
    print(f"Pre-warmed model successfully checkpointed to {checkpoint_path}")

if __name__ == "__main__":
    train_domain_adaptive_pipeline(epochs=1, device="cpu")
