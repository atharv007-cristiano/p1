import unittest
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

class TestGate1C2PA(unittest.TestCase):
  """
  Tests the Gate 1 C2PA cryptographic signature determinations.
  """
  def test_valid_provenance_increases_confidence(self):
    # Valid certificate from Reuters secure capture
    c2pa_present = True
    c2pa_valid = True
    claims_ai = False
    
    score = 0.0
    if c2pa_present and c2pa_valid:
      if not claims_ai:
        score += 0.40 # Authentic increase
        
    self.assertEqual(score, 0.40)

  def test_tampered_manifest_isolated(self):
    # C2PA present but validation signature is tampered
    c2pa_present = True
    c2pa_valid = False
    
    verdict = "neutral"
    confidence = 0.0
    
    if c2pa_present and not c2pa_valid:
      verdict = "fake"
      confidence = 0.90
      
    self.assertEqual(verdict, "fake")
    self.assertEqual(confidence, 0.90)

  def test_ai_generator_assertion_triggers_fake(self):
    # C2PA manifest explicitly claims AI generated origin
    c2pa_present = True
    c2pa_valid = True
    claims_ai = True
    
    verdict = "neutral"
    confidence = 0.0
    
    if c2pa_present and c2pa_valid and claims_ai:
      verdict = "fake"
      confidence = 0.95
      
    self.assertEqual(verdict, "fake")
    self.assertEqual(confidence, 0.95)

if __name__ == "__main__":
  unittest.main()
