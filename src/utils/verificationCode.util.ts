import crypto from 'crypto';

/**
 * Generates a cryptographically random, uppercase alphanumeric verification code.
 * Used as a public identifier for document verification.
 *
 * Format: DOC-XXXXXXXX (e.g. DOC-8F4A92BC)
 */
export const generateVerificationCode = (): string => {
  // Generate 4 bytes of random data, resulting in 8 hex characters
  const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `DOC-${randomHex}`;
};
