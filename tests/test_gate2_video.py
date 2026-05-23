import unittest
import os
import sys
import asyncio

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from gate2.video.rppg_extractor import extract_rppg_signals
from gate2.video.temporal_analyzer import analyze_temporal_consistency
from gate2.video.lipsync_analyzer import analyze_lipsync

class TestGate2Video(unittest.TestCase):
  """
  Asserts Gate 2 video analysis modules using modern asyncio blocks.
  """
  def setUp(self):
    self.dummy_video_path = os.path.join(os.path.dirname(__file__), "dummy_test_video.mp4")

  def test_rppg_cardiac_pulse_wave_compiles(self):
    score, hr = asyncio.run(extract_rppg_signals(self.dummy_video_path))
    self.assertTrue(0.0 <= score <= 1.0)
    self.assertEqual(hr, 72)

  def test_temporal_flow_consistency_compiles(self):
    score = asyncio.run(analyze_temporal_consistency(self.dummy_video_path))
    self.assertTrue(0.0 <= score <= 1.0)

  def test_lipsync_alignment_aperture_compiles(self):
    score, offset = asyncio.run(analyze_lipsync(self.dummy_video_path))
    self.assertTrue(0.0 <= score <= 1.0)
    self.assertTrue(offset >= 0.0)

if __name__ == "__main__":
  unittest.main()
