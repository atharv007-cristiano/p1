import { Finding, DetectionResult } from '../lib/api';
import { analyzeExifMetadata } from './ExifAnalyzer';
import { verifyC2PACredential } from './C2PAVerifier';
import { scanForWatermarks } from './WatermarkScanner';
import { checkByteIntegrity } from './ByteIntegrityChecker';

export interface Gate1Outcome {
  shouldEscalate: boolean;
  verdict: 'authentic' | 'synthetic' | 'uncertain';
  confidence: number;
  findings: Finding[];
  detectedText?: string[];
  gate1_score: number;
}

export const runGate1Analysis = async (
  file: File,
  onProgress?: (step: string, percent: number) => void
): Promise<Gate1Outcome> => {
  const fileType = file.type;
  
  // =========================================================================
  // AUDIO EXCEPTION: Audio metadata is trivially spoofable. Audio files always proceed
  // directly to Gate 2 backend forensics. No client-side audio pre-filter is applied.
  // =========================================================================
  if (fileType.includes('audio') || file.name.endsWith('.mp3') || file.name.endsWith('.wav') || file.name.endsWith('.aac') || file.name.endsWith('.ogg')) {
    onProgress?.('Bypassing Gate 1: Audio assets routed directly to Gate 2 forensics...', 100);
    return {
      shouldEscalate: true,
      verdict: 'uncertain',
      confidence: 0.0,
      findings: [{
        check: 'audio_bypass',
        result: 'audio_bypass_active',
        detail: 'AUDIO EXCEPTION: Audio files bypass Gate 1 and proceed straight to Gate 2 deep forensics.',
        weight: 0.0,
        score: 0.0
      }],
      gate1_score: 0.5
    };
  }

  // Running parallel checks for image/video keyframes
  onProgress?.('Initializing Gate 1 Parallel Forensic Checks...', 10);
  
  const exifPromise = analyzeExifMetadata(file).then(res => {
    onProgress?.('EXIF Metadata analysis complete.', 35);
    return res;
  });

  const c2paPromise = verifyC2PACredential(file).then(res => {
    onProgress?.('C2PA Content Credential verification complete.', 60);
    return res;
  });

  const watermarkPromise = scanForWatermarks(file).then(res => {
    onProgress?.('Watermark and OCR text analysis complete.', 80);
    return res;
  });

  const integrityPromise = checkByteIntegrity(file).then(res => {
    onProgress?.('Byte formatting integrity check complete.', 95);
    return res;
  });

  const [exif, c2pa, watermark, integrity] = await Promise.all([
    exifPromise,
    c2paPromise,
    watermarkPromise,
    integrityPromise
  ]);

  // Decision Fusion Mathematics
  // gate1_confidence = 0.35 * exif_score + 0.30 * c2pa_score + 0.20 * watermark_score + 0.15 * integrity_score
  // Wait, the scores are signed (-1.0 to +1.0) where -1 is fake, +1 is authentic, 0 is neutral.
  // Let's normalize the final score to a scale of 0 to 1 where 0 is fake, 1 is authentic.
  const exif_score = exif.score;
  const c2pa_score = c2pa.score;
  const watermark_score = watermark.score;
  const integrity_score = integrity.score;

  const weightedScore = (
    0.35 * exif_score +
    0.30 * c2pa_score +
    0.20 * watermark_score +
    0.15 * integrity_score
  );

  // Normalize final confidence to [0, 1] range:
  // -1.0 maps to 0.0 (synthetic)
  // +1.0 maps to 1.0 (authentic)
  const normalizedConfidence = (weightedScore + 1.0) / 2.0;

  onProgress?.('Fusing Gate 1 signals and resolving thresholds...', 100);

  // Threshold conditions:
  // normalizedConfidence >= 0.85 -> AUTHENTIC, skip Gate 2
  // normalizedConfidence <= 0.15 -> FAKE, skip Gate 2
  // Else -> Escalate to Gate 2
  let verdict: 'authentic' | 'synthetic' | 'uncertain' = 'uncertain';
  let shouldEscalate = true;

  if (normalizedConfidence >= 0.85) {
    verdict = 'authentic';
    shouldEscalate = false;
  } else if (normalizedConfidence <= 0.15) {
    verdict = 'synthetic';
    shouldEscalate = false;
  }

  return {
    shouldEscalate,
    verdict,
    confidence: normalizedConfidence,
    findings: [exif, c2pa, watermark, integrity],
    detectedText: watermark.detectedText,
    gate1_score: normalizedConfidence
  };
};
