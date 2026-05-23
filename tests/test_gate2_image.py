import unittest
import os
import sys
import asyncio

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from gate2.image.srm_analyzer import analyze_srm_residuals
from gate2.image.frequency_analyzer import analyze_frequency_domain
from gate2.image.ela_analyzer import analyze_ela
from gate2.image.gan_cnn import analyze_gan_artifacts
from gate2.image.face_consistency import analyze_face_consistency

class TestGate2Image(unittest.TestCase):
  """
  Asserts Gate 2 image analysis modules using modern asyncio blocks.
  """
  def setUp(self):
    self.dummy_img_path = os.path.join(os.path.dirname(__file__), "dummy_test_image.jpg")
    
    import cv2
    import numpy as np
    dummy_img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    cv2.imwrite(self.dummy_img_path, dummy_img)

  def tearDown(self):
    if os.path.exists(self.dummy_img_path):
      try:
        os.remove(self.dummy_img_path)
      except Exception:
        pass

  def test_srm_noise_residuals_compiles(self):
    score = asyncio.run(analyze_srm_residuals(self.dummy_img_path))
    self.assertTrue(0.0 <= score <= 1.0)

  def test_frequency_azimuthal_power_compiles(self):
    score = asyncio.run(analyze_frequency_domain(self.dummy_img_path))
    self.assertTrue(0.0 <= score <= 1.0)

  def test_error_level_analysis_compiles(self):
    score = asyncio.run(analyze_ela(self.dummy_img_path))
    self.assertTrue(0.0 <= score <= 1.0)

  def test_gan_cnn_biometrics_compiles(self):
    score = asyncio.run(analyze_gan_artifacts(self.dummy_img_path))
    self.assertTrue(0.0 <= score <= 1.0)

  def test_face_consistencies_compiles(self):
    score = asyncio.run(analyze_face_consistency(self.dummy_img_path))
    self.assertTrue(0.0 <= score <= 1.0)

if __name__ == "__main__":
  unittest.main()
