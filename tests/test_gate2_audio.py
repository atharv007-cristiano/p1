import unittest
import os
import sys
import asyncio

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from gate2.audio.byte_analyzer import analyze_audio_bytes
from gate2.audio.spectral_analyzer import analyze_audio_spectrum
from gate2.audio.prosodic_analyzer import analyze_audio_prosody
from gate2.audio.rawnet3 import analyze_rawnet3

class TestGate2Audio(unittest.TestCase):
  """
  Asserts Gate 2 audio analysis modules using modern asyncio blocks.
  """
  def setUp(self):
    self.dummy_audio_path = os.path.join(os.path.dirname(__file__), "dummy_test_audio.wav")
    
    with open(self.dummy_audio_path, "wb") as f:
      f.write(b"RIFF\x24\x08\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80\x3e\x00\x00\x00\x7d\x00\x00\x02\x00\x10\x00data\x00\x08\x00\x00\x00\x00\x00\x00")

  def tearDown(self):
    if os.path.exists(self.dummy_audio_path):
      try:
        os.remove(self.dummy_audio_path)
      except Exception:
        pass

  def test_waveform_magic_bytes_validates(self):
    score, anomalies = asyncio.run(analyze_audio_bytes(self.dummy_audio_path))
    self.assertTrue(0.0 <= score <= 1.0)
    self.assertEqual(len(anomalies), 0)

  def test_spectral_vocoder_check_compiles(self):
    score, vocoder = asyncio.run(analyze_audio_spectrum(self.dummy_audio_path))
    self.assertTrue(0.0 <= score <= 1.0)
    self.assertIsNone(vocoder)

  def test_prosodic_pitch_jitter_shimmer_compiles(self):
    score = asyncio.run(analyze_audio_prosody(self.dummy_audio_path))
    self.assertTrue(0.0 <= score <= 1.0)

  def test_rawnet3_neural_inference_compiles(self):
    score = asyncio.run(analyze_rawnet3(self.dummy_audio_path))
    self.assertTrue(0.0 <= score <= 1.0)

if __name__ == "__main__":
  unittest.main()
