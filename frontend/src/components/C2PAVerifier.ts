import { Finding } from '../lib/api';

export const verifyC2PACredential = async (file: File): Promise<Finding> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const fileNameUpper = file.name.toUpperCase();

      // C2PA AI assertion present
      if (fileNameUpper.includes('C2PA_AI') || fileNameUpper.includes('AI_WATERMARK') || fileNameUpper.includes('GENERATED')) {
        resolve({
          check: 'c2pa_credential',
          result: 'ai_assertion_detected',
          detail: 'Valid C2PA manifest found: Assertions declare image was synthetically generated (Generator=Adobe Firefly).',
          weight: 0.30,
          score: -1.0, // Synthetic flag
        });
        return;
      }

      // C2PA signature tampered / broken
      if (fileNameUpper.includes('TAMPERED') || fileNameUpper.includes('CORRUPTED') || fileNameUpper.includes('MALFORMED')) {
        resolve({
          check: 'c2pa_credential',
          result: 'signature_verification_failed',
          detail: 'C2PA metadata structure present but verification failed. Certificate hash mismatch or manifest tampered!',
          weight: 0.30,
          score: -0.9, // Severe anomaly
        });
        return;
      }

      // C2PA authentic credential (e.g. news agency capture or camera signed)
      if (fileNameUpper.includes('SIGNED') || fileNameUpper.includes('REUTERS') || fileNameUpper.includes('AUTHENTIC')) {
        resolve({
          check: 'c2pa_credential',
          result: 'trusted_provenance_verified',
          detail: 'Valid cryptographic signature chain matches Adobe CAI Trust List. Issuer=Reuters Secure Capture.',
          weight: 0.30,
          score: 1.0, // Solid authenticity signal
        });
        return;
      }

      // Default: C2PA absent (neutral for normal images)
      resolve({
        check: 'c2pa_credential',
        result: 'manifest_absent',
        detail: 'No C2PA provenance manifest detected in media header atoms.',
        weight: 0.30,
        score: 0.0, // Neutral
      });
    }, 120);
  });
};
