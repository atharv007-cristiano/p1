import torch
import torch.nn as nn
import numpy as np
from sklearn.ensemble import IsolationForest
from typing import Dict, Any, Tuple

class BehavioralAnomalyModule(nn.Module):
    """
    Behavioral Anomaly Detection Module (BADM).
    - BiLSTM tracks sequential 68-point 3D landmarks (eye blinking, head movement).
    - Isolation Forest exposes out-of-distribution movements.
    - Dynamic Time Warping (DTW) calculates lip-synchronization errors.
    """
    def __init__(self, landmark_dim: int = 68 * 3, hidden_dim: int = 128, feature_dim: int = 512):
        super(BehavioralAnomalyModule, self).__init__()
        
        # Bidirectional LSTM to model landmarks sequence trajectories
        self.bilstm = nn.LSTM(
            input_size=landmark_dim,
            hidden_size=hidden_dim,
            num_layers=2,
            batch_first=True,
            bidirectional=True
        )
        
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim * 2, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, feature_dim)
        )
        
        # Isolation Forest instance to track outlier behavior
        # Evaluates raw sequence embeddings in production
        self.isolation_forest = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
        # Fit with seed to initialize
        mock_train_data = np.random.randn(50, feature_dim)
        self.isolation_forest.fit(mock_train_data)
        
        self.classifier = nn.Linear(feature_dim, 1)

    @staticmethod
    def compute_lip_distance(landmarks: np.ndarray) -> np.ndarray:
        """
        Calculates vertical lip aperture over frames using facial landmarks.
        Outer lip top/bottom: landmark 51 and 57 (0-indexed indices: 51, 57)
        Inner lip top/bottom: landmark 62 and 66 (0-indexed indices: 62, 66)
        
        Args:
            landmarks: Shape [Frames, 68, 3]
            
        Returns:
            1D array of lip distances of shape [Frames]
        """
        # Outer/Inner lip distance
        top_lip = landmarks[:, 62, :2] # 2D coordinates (x, y)
        bottom_lip = landmarks[:, 66, :2]
        
        # Euclidean distance per frame
        distance = np.linalg.norm(top_lip - bottom_lip, axis=1)
        return distance

    @staticmethod
    def compute_dtw_distance(s1: np.ndarray, s2: np.ndarray) -> float:
        """
        Calculates Dynamic Time Warping (DTW) alignment distance between 
        vocal energy amplitude (audio) and lip distance variations (video).
        
        Args:
            s1: 1D audio energy sequence
            s2: 1D lip distance sequence
            
        Returns:
            Aligned minimum warp cost
        """
        N = len(s1)
        M = len(s2)
        
        if N == 0 or M == 0:
            return 0.0
            
        # Initialize Cost Matrix
        dtw_matrix = np.zeros((N + 1, M + 1))
        for i in range(N + 1):
            dtw_matrix[i, 0] = np.inf
        for j in range(M + 1):
            dtw_matrix[0, j] = np.inf
        dtw_matrix[0, 0] = 0
        
        for i in range(1, N + 1):
            for j in range(1, M + 1):
                cost = abs(s1[i - 1] - s2[j - 1])
                dtw_matrix[i, j] = cost + min(
                    dtw_matrix[i - 1, j],    # insertion
                    dtw_matrix[i, j - 1],    # deletion
                    dtw_matrix[i - 1, j - 1] # match
                )
                
        return float(dtw_matrix[N, M] / (N + M))

    def evaluate_isolation_forest(self, embedding_np: np.ndarray) -> np.ndarray:
        """
        Evaluates sequence embeddings using the isolation forest.
        
        Returns:
            Outlier score (lower is more anomalous, standard scale [-1, 1])
        """
        # Decision function returns raw anomaly scores
        scores = self.isolation_forest.decision_function(embedding_np)
        return scores

    def forward(self, landmarks: torch.Tensor, audio_energy: torch.Tensor = None) -> Dict[str, torch.Tensor]:
        """
        Args:
            landmarks: Tensor of shape [Batch, Frames, 68, 3] representing coordinates
            audio_energy: Tensor of shape [Batch, Frames] matching temporal alignment
            
        Returns:
            Dictionary containing:
            - "behavioral_embedding": Tensor of shape [Batch, feature_dim]
            - "behavioral_logits": Logits of shape [Batch, 1]
            - "dtw_sync_score": Tensor of shape [Batch]
        """
        B, F, L, C = landmarks.shape
        device = landmarks.device
        
        # Flatten landmark coordinates [Batch, Frames, 68 * 3]
        flat_landmarks = landmarks.view(B, F, -1)
        
        # BiLSTM sequence pass
        lstm_out, _ = self.bilstm(flat_landmarks) # [Batch, Frames, hidden_dim * 2]
        
        # Mean pooling across temporal frames
        pooled = lstm_out.mean(dim=1) # [Batch, hidden_dim * 2]
        embedding = self.fc(pooled) # [Batch, feature_dim]
        
        # Classify normal/abnormal movement
        logits = self.classifier(embedding)
        
        # DTW Sync evaluation loop per batch element
        dtw_scores = []
        landmarks_np = landmarks.detach().cpu().numpy()
        
        if audio_energy is None:
            audio_energy = torch.zeros(B, F, device=device)
        audio_energy_np = audio_energy.detach().cpu().numpy()
        
        for idx in range(B):
            # Calculate lip landmarks aperture distance
            lip_dist = self.compute_lip_distance(landmarks_np[idx])
            # Normalize signals for comparison
            lip_dist_norm = (lip_dist - np.mean(lip_dist)) / (np.std(lip_dist) + 1e-6)
            
            aud_energy = audio_energy_np[idx]
            aud_energy_norm = (aud_energy - np.mean(aud_energy)) / (np.std(aud_energy) + 1e-6)
            
            # Compute alignment warp cost
            dtw_dist = self.compute_dtw_distance(aud_energy_norm, lip_dist_norm)
            dtw_scores.append(dtw_dist)
            
        dtw_scores_tensor = torch.tensor(dtw_scores, dtype=torch.float32, device=device)
        
        return {
            "behavioral_embedding": embedding,
            "behavioral_logits": logits,
            "dtw_sync_score": dtw_scores_tensor
        }
