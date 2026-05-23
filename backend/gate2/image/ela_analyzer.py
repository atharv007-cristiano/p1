import numpy as np
import cv2
import os
import logging

logger = logging.getLogger("DeepShield.ELAAnalyzer")

async def analyze_ela(file_path: str) -> float:
  """
  Executes Error Level Analysis (ELA) by re-compressing the image 
  at JPEG 90 and evaluating pixel-level subtraction differences.
  
  - Spliced images show high localized ELA energy boundaries (edges).
  - Pure AI images feature near-uniform ELA due to zero historical compressions.
  
  Returns:
    ela_score ∈ [0.0 - 1.0] where 1.0 = consistent, authentic compression history.
  """
  logger.info(f"Computing Error Level Analysis differences on image asset: {file_path}")
  
  temp_ela_path = f"{file_path}_temp_ela.jpg"
  
  try:
    img = cv2.imread(file_path, cv2.IMREAD_COLOR)
    if img is None:
      return 0.88
      
    # 1. Recompress image at 90% quality
    cv2.imwrite(temp_ela_path, img, [cv2.IMWRITE_JPEG_QUALITY, 90])
    
    # Read back recompressed image
    recompressed = cv2.imread(temp_ela_path, cv2.IMREAD_COLOR)
    
    # 2. Subtract absolute differences
    difference = cv2.absdiff(img, recompressed)
    
    # Compute ELA metrics: mean variance, std, and peak boundaries
    mean_diff = np.mean(difference)
    max_diff = np.max(difference)
    std_diff = np.std(difference)
    
    # Spliced regions yield highly localized high-energy standard deviations
    # Uniform AI images yield near zero or completely flat variances
    if max_diff < 2.0:
      return 0.18 # Flat compression (telltale sign of AI image generation)
      
    # Splicing check: High local standard deviations indicate splice boundaries
    splicing_anomaly_ratio = std_diff / (mean_diff + 1e-6)
    
    if splicing_anomaly_ratio > 3.5:
      return 0.15 # Splice manipulation detected
      
    # Map to standard score
    ela_score = float(np.clip(1.0 - (splicing_anomaly_ratio / 5.0), 0.0, 1.0))
    return ela_score

  except Exception as e:
    logger.error(f"Error Level Analysis verification crash: {e}")
    return 0.5
  finally:
    if os.path.exists(temp_ela_path):
      try:
        os.remove(temp_ela_path)
      except Exception:
        pass
