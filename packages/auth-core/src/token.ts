/**
 * Verification tokens issued after a successful OTP check and consumed by the
 * "complete the action" step (e.g. update-phone, reset-password).
 *
 * Format: base64(payload).<hmac-sha256>
 *
 * The HMAC signature is what makes the token trustworthy: without it a client
 * could forge a base64 payload claiming any phone is verified and skip the OTP
 * entirely. The token is signed AND verified within a single flow on the same
 * app, so the two apps don't need a shared secret — each just needs a stable one.
 */

import crypto from 'crypto';

export interface VerificationTokenPayload {
  identifier: string;
  purpose: string;
  verifiedAt: number;
  expiresAt: number;
}

/**
 * Resolve the signing secret from the environment. Prefers a dedicated var,
 * then the API's SESSION_SECRET (keeps in-flight API tokens valid), then
 * NextAuth's secret (so the web has one without extra config).
 */
function getSecret(): string {
  const secret =
    process.env.OTP_TOKEN_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      'No verification-token secret configured. Set OTP_TOKEN_SECRET (or SESSION_SECRET / NEXTAUTH_SECRET).'
    );
  }
  return secret;
}

export function signVerificationToken(payload: VerificationTokenPayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const sig = crypto
    .createHmac('sha256', getSecret())
    .update(encodedPayload)
    .digest('hex');
  return `${encodedPayload}.${sig}`;
}

function verifyAndDecodeToken(token: string): Record<string, unknown> | null {
  const dotIndex = token.lastIndexOf('.');
  if (dotIndex === -1) return null;

  const encodedPayload = token.slice(0, dotIndex);
  const receivedSig = token.slice(dotIndex + 1);
  const expectedSig = crypto
    .createHmac('sha256', getSecret())
    .update(encodedPayload)
    .digest('hex');

  const receivedBuf = Buffer.from(receivedSig, 'hex');
  const expectedBuf = Buffer.from(expectedSig, 'hex');

  // Lengths must match before timingSafeEqual (it throws on mismatch), and the
  // comparison is constant-time to avoid leaking the signature via timing.
  if (receivedBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(receivedBuf, expectedBuf)) return null;

  try {
    return JSON.parse(Buffer.from(encodedPayload, 'base64').toString());
  } catch {
    return null;
  }
}

/**
 * Validate a verification token against the expected phone + purpose.
 * Returns a discriminated result so callers can surface the precise reason.
 */
export function validateVerificationToken(
  token: string,
  expectedPhone: string,
  expectedPurpose: string
): { valid: boolean; error?: string } {
  const tokenData = verifyAndDecodeToken(token);

  if (!tokenData) {
    return { valid: false, error: 'Invalid token signature' };
  }
  if (tokenData.identifier !== expectedPhone) {
    return { valid: false, error: 'Token mismatch' };
  }
  if (tokenData.purpose !== expectedPurpose) {
    return { valid: false, error: 'Invalid token purpose' };
  }
  if (Date.now() > (tokenData.expiresAt as number)) {
    return { valid: false, error: 'Token expired' };
  }

  return { valid: true };
}
