/**
 * Auth Service
 * Handles authentication, OTP, and user registration
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@thulobazaar/database';
import {
  validateNepaliPhone,
  formatPhoneNumber,
  generateOtp,
  sendOtpSms,
  getOtpExpiry,
  type OtpPurpose,
} from '../lib/sms.js';
import { generateAccessToken, generateRefreshToken } from '../lib/token.js';
import { OAuth2Client } from 'google-auth-library';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ============================================================================
// Constants
// ============================================================================

const MAX_OTP_ATTEMPTS = 4;
const OTP_COOLDOWN_SECONDS = 60;
const MAX_VERIFY_ATTEMPTS = 5;
const VERIFICATION_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const RECOVERY_DAYS = 30;

// ============================================================================
// Types
// ============================================================================

export type OtpPurposeType = 'registration' | 'login' | 'password_reset' | 'phone_verification' | 'account_deletion';

export interface SendOtpResult {
  success: boolean;
  error?: string;
  cooldownRemaining?: number;
  identifier?: string;
  expiresIn?: number;
}

export interface VerifyOtpResult {
  success: boolean;
  error?: string;
  remainingAttempts?: number;
  identifier?: string;
  verificationToken?: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  token?: string;
  refreshToken?: string;
  requires2FA?: boolean;
  tempToken?: string;
  user?: {
    id: number;
    email: string | null;
    fullName: string | null;
    phone: string | null;
    phoneVerified: boolean | null;
    role: string | null;
    shopSlug: string | null;
    accountType: string | null;
    avatar: string | null;
  };
}

export interface RegisterResult {
  success: boolean;
  error?: string;
  token?: string;
  refreshToken?: string;
  user?: {
    id: number;
    fullName: string | null;
    phone: string | null;
    phoneVerified: boolean | null;
    role: string | null;
  };
}

// ============================================================================
// OTP Functions
// ============================================================================

export async function sendOtp(phone: string, purpose: OtpPurposeType): Promise<SendOtpResult> {
  const formattedPhone = formatPhoneNumber(phone);

  // Validate phone number
  if (!validateNepaliPhone(formattedPhone)) {
    return { success: false, error: 'Invalid Nepali phone number. Must be 10 digits starting with 97 or 98.' };
  }

  // Purpose-specific validations
  if (purpose === 'registration') {
    const existingUser = await prisma.users.findFirst({
      where: { phone: formattedPhone, phone_verified: true },
    });
    if (existingUser) {
      return { success: false, error: 'This phone number is already registered' };
    }
  }

  if (purpose === 'login') {
    const existingUser = await prisma.users.findFirst({
      where: { phone: formattedPhone, phone_verified: true, is_active: true },
    });
    if (!existingUser) {
      return { success: false, error: 'No account found with this phone number' };
    }
    if (existingUser.is_suspended) {
      return { success: false, error: 'Your account has been suspended. Please contact support.' };
    }
  }

  if (purpose === 'password_reset') {
    const existingUser = await prisma.users.findFirst({
      where: { phone: formattedPhone, is_active: true },
    });
    if (!existingUser) {
      return { success: false, error: 'No account found with this phone number' };
    }
    if (existingUser.is_suspended) {
      return { success: false, error: 'Your account has been suspended. Please contact support.' };
    }
  }

  // Check cooldown
  const recentOtp = await prisma.phone_otps.findFirst({
    where: {
      phone: formattedPhone,
      purpose,
      created_at: { gte: new Date(Date.now() - OTP_COOLDOWN_SECONDS * 1000) },
    },
    orderBy: { created_at: 'desc' },
  });

  if (recentOtp) {
    const secondsRemaining = Math.ceil(
      (OTP_COOLDOWN_SECONDS * 1000 - (Date.now() - recentOtp.created_at.getTime())) / 1000
    );
    return {
      success: false,
      error: `Please wait ${secondsRemaining} seconds before requesting a new OTP`,
      cooldownRemaining: secondsRemaining,
    };
  }

  // Check max attempts in last hour
  const recentAttempts = await prisma.phone_otps.count({
    where: {
      phone: formattedPhone,
      purpose,
      created_at: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });

  if (recentAttempts >= MAX_OTP_ATTEMPTS) {
    return { success: false, error: 'Too many OTP requests. Please try again after 1 hour.' };
  }

  // Invalidate previous OTPs
  await prisma.phone_otps.updateMany({
    where: { phone: formattedPhone, purpose, is_used: false },
    data: { is_used: true },
  });

  // Generate and save new OTP
  const otp = generateOtp();
  const expiresAt = getOtpExpiry();

  await prisma.phone_otps.create({
    data: {
      phone: formattedPhone,
      otp_code: otp,
      purpose,
      expires_at: expiresAt,
    },
  });

  // Send OTP via SMS
  const smsResult = await sendOtpSms(formattedPhone, otp, purpose as OtpPurpose);

  if (!smsResult.success) {
    console.error('Failed to send OTP SMS:', smsResult.error);
    return { success: false, error: 'Failed to send OTP. Please try again.' };
  }

  console.log(`📱 OTP sent to ${formattedPhone} for ${purpose}`);

  return {
    success: true,
    identifier: formattedPhone,
    expiresIn: 600, // 10 minutes
  };
}

export async function verifyOtp(phone: string, otp: string, purpose: OtpPurposeType): Promise<VerifyOtpResult> {
  const formattedPhone = formatPhoneNumber(phone);

  // Find valid OTP
  const otpRecord = await prisma.phone_otps.findFirst({
    where: {
      phone: formattedPhone,
      purpose,
      is_used: false,
      expires_at: { gte: new Date() },
    },
    orderBy: { created_at: 'desc' },
  });

  if (!otpRecord) {
    return { success: false, error: 'OTP expired or not found. Please request a new OTP.' };
  }

  // Check max attempts
  if (otpRecord.attempts >= MAX_VERIFY_ATTEMPTS) {
    await prisma.phone_otps.update({
      where: { id: otpRecord.id },
      data: { is_used: true },
    });
    return { success: false, error: 'Too many failed attempts. Please request a new OTP.' };
  }

  // Verify OTP code
  if (otpRecord.otp_code !== otp) {
    await prisma.phone_otps.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });

    const remainingAttempts = MAX_VERIFY_ATTEMPTS - otpRecord.attempts - 1;
    return {
      success: false,
      error: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
      remainingAttempts,
    };
  }

  // Mark OTP as used (except for password_reset which needs it for the next step)
  if (purpose !== 'password_reset') {
    await prisma.phone_otps.update({
      where: { id: otpRecord.id },
      data: { is_used: true },
    });
  }

  console.log(`✅ OTP verified for ${formattedPhone} (${purpose})`);

  // Generate HMAC-signed verification token (format: base64(payload).hmac)
  const verificationToken = signVerificationToken({
    identifier: formattedPhone,
    purpose,
    verifiedAt: Date.now(),
    expiresAt: Date.now() + VERIFICATION_TOKEN_EXPIRY_MS,
  });

  return {
    success: true,
    identifier: formattedPhone,
    verificationToken,
  };
}

// ============================================================================
// Verification Token Functions
// ============================================================================

// Token format: base64(payload).<hmac-sha256>
// Signing prevents clients from forging tokens with a different phone/purpose.
function signVerificationToken(payload: object): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const sig = crypto
    .createHmac('sha256', config.SESSION_SECRET)
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
    .createHmac('sha256', config.SESSION_SECRET)
    .update(encodedPayload)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(receivedSig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
    return null;
  }

  return JSON.parse(Buffer.from(encodedPayload, 'base64').toString());
}

export function validateVerificationToken(
  token: string,
  expectedPhone: string,
  expectedPurpose: OtpPurposeType
): { valid: boolean; error?: string } {
  try {
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
  } catch {
    return { valid: false, error: 'Invalid verification token' };
  }
}

// ============================================================================
// Login Functions
// ============================================================================

export async function loginWithPhone(phone: string, password: string): Promise<LoginResult> {
  const formattedPhone = formatPhoneNumber(phone);

  if (!validateNepaliPhone(formattedPhone)) {
    return { success: false, error: 'Invalid phone number format' };
  }

  // Find user
  const user = await prisma.users.findFirst({
    where: { phone: formattedPhone, phone_verified: true },
  });

  if (!user) {
    return { success: false, error: 'No account found with this phone number' };
  }

  if (user.is_suspended) {
    return { success: false, error: 'Your account has been suspended. Please contact support.' };
  }

  // Account deletion recovery: allow login within 30-day recovery window
  if (user.deleted_at && user.deletion_requested_at) {
    const daysSinceDeletion = (Date.now() - user.deletion_requested_at.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDeletion >= RECOVERY_DAYS) {
      return { success: false, error: 'This account has been permanently deleted.' };
    }
    // Will reactivate after password verification below
  } else if (!user.is_active) {
    return { success: false, error: 'Your account has been deactivated. Please contact support.' };
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash!);
  if (!isPasswordValid) {
    return { success: false, error: 'Invalid password' };
  }

  // Reactivate account if within recovery window
  if (user.deleted_at && user.deletion_requested_at) {
    await prisma.users.update({
      where: { id: user.id },
      data: {
        deleted_at: null,
        deletion_requested_at: null,
        is_active: true,
      },
    });
    console.log(`🔄 Account reactivated for ${formattedPhone} (userId: ${user.id})`);
  }

  // Check if 2FA is enabled
  if (user.two_factor_enabled && user.two_factor_secret) {
    const tempToken = jwt.sign(
      { userId: user.id, purpose: '2fa' },
      config.JWT_SECRET,
      { expiresIn: '5m' }
    );
    return { success: true, requires2FA: true, tempToken };
  }

  // Update last login
  await prisma.users.update({
    where: { id: user.id },
    data: { last_login: new Date() },
  });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  console.log(`📱 Phone login successful for ${formattedPhone} (userId: ${user.id})`);

  return {
    success: true,
    token: accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      phoneVerified: user.phone_verified,
      role: user.role,
      shopSlug: user.shop_slug,
      accountType: user.account_type,
      avatar: user.avatar,
    },
  };
}

// ============================================================================
// Registration Functions
// ============================================================================

export async function registerWithPhone(
  phone: string,
  password: string,
  fullName: string,
  verificationToken: string
): Promise<RegisterResult> {
  const formattedPhone = formatPhoneNumber(phone);

  // Validate verification token
  const tokenValidation = validateVerificationToken(verificationToken, formattedPhone, 'registration');
  if (!tokenValidation.valid) {
    return {
      success: false,
      error: 'Invalid or expired verification token. Please verify your phone again.',
    };
  }

  // Check if already registered
  const existingUser = await prisma.users.findFirst({
    where: { phone: formattedPhone, phone_verified: true },
  });

  if (existingUser) {
    return { success: false, error: 'This phone number is already registered' };
  }

  // Hash password and create user
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.users.create({
    data: {
      phone: formattedPhone,
      phone_verified: true,
      password_hash: passwordHash,
      full_name: fullName,
      role: 'user',
      is_active: true,
    },
  });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  console.log(`📱 New user registered via phone: ${formattedPhone} (userId: ${user.id})`);

  return {
    success: true,
    token: accessToken,
    refreshToken,
    user: {
      id: user.id,
      fullName: user.full_name,
      phone: user.phone,
      phoneVerified: user.phone_verified,
      role: user.role,
    },
  };
}

// ============================================================================
// Password Reset Functions
// ============================================================================

export async function resetPassword(
  phone: string,
  newPassword: string,
  verificationToken: string
): Promise<{ success: boolean; error?: string }> {
  const formattedPhone = formatPhoneNumber(phone);

  // Validate verification token
  const tokenValidation = validateVerificationToken(verificationToken, formattedPhone, 'password_reset');
  if (!tokenValidation.valid) {
    return {
      success: false,
      error: 'Invalid or expired verification token. Please verify your phone again.',
    };
  }

  // Find user
  const user = await prisma.users.findFirst({
    where: { phone: formattedPhone },
  });

  if (!user) {
    return { success: false, error: 'No account found with this phone number' };
  }

  // Mark OTP as used
  await prisma.phone_otps.updateMany({
    where: { phone: formattedPhone, purpose: 'password_reset', is_used: false },
    data: { is_used: true },
  });

  // Update password
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.users.update({
    where: { id: user.id },
    data: { password_hash: passwordHash },
  });

  console.log(`🔐 Password reset successful for ${formattedPhone}`);

  return { success: true };
}

// ============================================================================
// Google Auth Functions
// ============================================================================

export async function verifyGoogleToken(idToken: string): Promise<LoginResult> {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return { success: false, error: 'Invalid Google Token payload' };
    }

    const { email, name, picture, sub: googleId } = payload;

    // Find user by email or googleId
    let user = await prisma.users.findFirst({
      where: {
        OR: [{ email }, { oauth_provider_id: googleId }],
      },
    });

    if (!user) {
      // Create new user
      user = await prisma.users.create({
        data: {
          email,
          full_name: name || 'User',
          avatar: picture,
          oauth_provider: 'google',
          oauth_provider_id: googleId,
          email_verified: payload.email_verified,
          role: 'user',
          is_active: true,
          // Since we don't have a phone number yet, we leave it null.
          // Password hash is required by schema but nullable in some setups?
          // Let's check schema. Schema says password_hash String @db.VarChar(255) (Not optional?)
          // Wait, viewing schema again...
          password_hash: await bcrypt.hash(Math.random().toString(36), 10), // Random password for OAuth users
        },
      });

      console.log(`✅ New Google user created: ${email} (userId: ${user.id})`);
    } else {
      // Update existing user with Google info if needed (e.g. if they didn't have googleId linked)
      if (!user.oauth_provider_id) {
        await prisma.users.update({
          where: { id: user.id },
          data: {
            oauth_provider: 'google',
            oauth_provider_id: googleId,
            avatar: user.avatar || picture, // Update avatar if missing
          },
        });
      }
    }

    if (user.is_suspended) {
      return { success: false, error: 'Your account has been suspended.' };
    }

    // Account deletion recovery for Google login
    if (user.deleted_at && user.deletion_requested_at) {
      const daysSinceDeletion = (Date.now() - user.deletion_requested_at.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDeletion >= RECOVERY_DAYS) {
        return { success: false, error: 'This account has been permanently deleted.' };
      }
      await prisma.users.update({
        where: { id: user.id },
        data: { deleted_at: null, deletion_requested_at: null, is_active: true },
      });
      console.log(`🔄 Account reactivated via Google login (userId: ${user.id})`);
    } else if (!user.is_active) {
      return { success: false, error: 'Your account has been deactivated.' };
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    return {
      success: true,
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        phoneVerified: user.phone_verified,
        role: user.role,
        shopSlug: user.shop_slug,
        accountType: user.account_type,
        avatar: user.avatar,
      },
    };

  } catch (error) {
    console.error('Google verification failed:', error);
    return { success: false, error: 'Google verification failed' };
  }
}

// ============================================================================
// Security Settings Functions
// ============================================================================

export async function changePassword(userId: number, currentPassword: string, newPassword: string) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (!user.password_hash) {
    return { success: false, error: 'Password change not available for this account type' };
  }

  const isValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValid) {
    return { success: false, error: 'Current password is incorrect' };
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.users.update({
    where: { id: userId },
    data: { password_hash: newHash },
  });

  return { success: true };
}

export async function updatePhone(userId: number, phone: string, verificationToken: string) {
  const formattedPhone = formatPhoneNumber(phone);

  const tokenValidation = validateVerificationToken(verificationToken, formattedPhone, 'phone_verification');
  if (!tokenValidation.valid) {
    return { success: false, error: tokenValidation.error || 'Invalid verification' };
  }

  const existing = await prisma.users.findFirst({
    where: { phone: formattedPhone, phone_verified: true, id: { not: userId } },
  });

  if (existing) {
    return { success: false, error: 'Phone number already in use' };
  }

  await prisma.users.update({
    where: { id: userId },
    data: {
      phone: formattedPhone,
      phone_verified: true,
      phone_verified_at: new Date(),
    },
  });

  return { success: true };
}

export async function getSessions(userId: number) {
  const sessions = await prisma.refresh_tokens.findMany({
    where: { user_id: userId, is_revoked: false },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      created_at: true,
      expires_at: true,
    },
  });

  return { success: true, sessions };
}

export async function revokeSession(userId: number, sessionId: number) {
  const session = await prisma.refresh_tokens.findFirst({
    where: { id: sessionId, user_id: userId },
  });

  if (!session) {
    return { success: false, error: 'Session not found' };
  }

  await prisma.refresh_tokens.update({
    where: { id: sessionId },
    data: { is_revoked: true },
  });

  return { success: true };
}

// ============================================================================
// Two-Factor Authentication (TOTP) Functions
// ============================================================================

const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_LENGTH = 8;
const TWO_FA_APP_NAME = 'Thulo Bazaar';

function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    codes.push(crypto.randomBytes(BACKUP_CODE_LENGTH / 2).toString('hex'));
  }
  return codes;
}

export async function setup2FA(userId: number) {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: 'User not found' };

  if (user.two_factor_enabled) {
    return { success: false, error: '2FA is already enabled. Disable it first to re-setup.' };
  }

  const secret = generateSecret();
  const label = user.phone || user.email || `user-${userId}`;
  const otpauthUri = generateURI({ issuer: TWO_FA_APP_NAME, label, secret });
  const qrCode = await QRCode.toDataURL(otpauthUri);

  // Store secret (not yet enabled until verified)
  await prisma.users.update({
    where: { id: userId },
    data: { two_factor_secret: secret },
  });

  return { success: true, secret, qrCode, otpauthUri };
}

export async function verify2FASetup(userId: number, code: string) {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: 'User not found' };
  if (!user.two_factor_secret) return { success: false, error: 'Please initiate 2FA setup first' };
  if (user.two_factor_enabled) return { success: false, error: '2FA is already enabled' };

  const isValid = verifySync({ secret: user.two_factor_secret, token: code }).valid;
  if (!isValid) return { success: false, error: 'Invalid verification code. Please try again.' };

  // Generate backup codes
  const plaintextCodes = generateBackupCodes();
  const hashedCodes = await Promise.all(
    plaintextCodes.map(c => bcrypt.hash(c, 10))
  );

  await prisma.users.update({
    where: { id: userId },
    data: {
      two_factor_enabled: true,
      two_factor_backup_codes: hashedCodes,
    },
  });

  return { success: true, backupCodes: plaintextCodes };
}

export async function disable2FA(userId: number, password: string, code: string) {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: 'User not found' };
  if (!user.two_factor_enabled) return { success: false, error: '2FA is not enabled' };

  // Verify password
  if (!user.password_hash) return { success: false, error: 'Cannot verify identity' };
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) return { success: false, error: 'Invalid password' };

  // Verify TOTP code
  if (!user.two_factor_secret) return { success: false, error: '2FA secret not found' };
  const isValid = verifySync({ secret: user.two_factor_secret, token: code }).valid;
  if (!isValid) return { success: false, error: 'Invalid 2FA code' };

  await prisma.users.update({
    where: { id: userId },
    data: {
      two_factor_enabled: false,
      two_factor_secret: null,
      two_factor_backup_codes: null as any,
    },
  });

  return { success: true };
}

export async function verify2FALogin(tempToken: string, code: string): Promise<LoginResult> {
  // Validate temp token
  let payload: { userId: number; purpose: string };
  try {
    payload = jwt.verify(tempToken, config.JWT_SECRET) as { userId: number; purpose: string };
  } catch {
    return { success: false, error: 'Invalid or expired 2FA session. Please login again.' };
  }

  if (payload.purpose !== '2fa') {
    return { success: false, error: 'Invalid token purpose' };
  }

  const user = await prisma.users.findUnique({ where: { id: payload.userId } });
  if (!user || !user.two_factor_secret) {
    return { success: false, error: 'User not found or 2FA not configured' };
  }

  // Try TOTP first
  let isValid = verifySync({ secret: user.two_factor_secret, token: code }).valid;

  // If TOTP fails, try backup codes
  if (!isValid && user.two_factor_backup_codes) {
    const backupCodes = user.two_factor_backup_codes as string[];
    for (let i = 0; i < backupCodes.length; i++) {
      const match = await bcrypt.compare(code, backupCodes[i]);
      if (match) {
        isValid = true;
        // Remove used backup code
        const updatedCodes = [...backupCodes];
        updatedCodes.splice(i, 1);
        await prisma.users.update({
          where: { id: user.id },
          data: { two_factor_backup_codes: updatedCodes },
        });
        break;
      }
    }
  }

  if (!isValid) {
    return { success: false, error: 'Invalid verification code' };
  }

  // Update last login
  await prisma.users.update({
    where: { id: user.id },
    data: { last_login: new Date() },
  });

  // Generate real tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  return {
    success: true,
    token: accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      phoneVerified: user.phone_verified,
      role: user.role,
      shopSlug: user.shop_slug,
      accountType: user.account_type,
      avatar: user.avatar,
    },
  };
}

// ============================================================================
// Account Deletion Functions
// ============================================================================

const DELETE_OTP_COOLDOWN_SECONDS = 60;
const DELETE_MAX_OTP_PER_HOUR = 3;

export async function requestAccountDeletion(userId: number) {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: 'User not found' };
  if (user.deleted_at) return { success: false, error: 'Account is already scheduled for deletion' };
  if (user.is_suspended) return { success: false, error: 'Cannot delete a suspended account. Contact support.' };
  if (!user.phone || !user.phone_verified) {
    return { success: false, error: 'A verified phone number is required to delete your account' };
  }

  // Cooldown check
  const recentOtp = await prisma.phone_otps.findFirst({
    where: {
      phone: user.phone,
      purpose: 'account_deletion',
      created_at: { gte: new Date(Date.now() - DELETE_OTP_COOLDOWN_SECONDS * 1000) },
    },
    orderBy: { created_at: 'desc' },
  });

  if (recentOtp) {
    const secondsRemaining = Math.ceil(
      (DELETE_OTP_COOLDOWN_SECONDS * 1000 - (Date.now() - recentOtp.created_at.getTime())) / 1000
    );
    return { success: false, error: `Please wait ${secondsRemaining} seconds`, cooldownRemaining: secondsRemaining };
  }

  // Rate limit check
  const recentAttempts = await prisma.phone_otps.count({
    where: {
      phone: user.phone,
      purpose: 'account_deletion',
      created_at: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });

  if (recentAttempts >= DELETE_MAX_OTP_PER_HOUR) {
    return { success: false, error: 'Too many requests. Please try again after 1 hour.' };
  }

  // Invalidate previous OTPs
  await prisma.phone_otps.updateMany({
    where: { phone: user.phone, purpose: 'account_deletion', is_used: false },
    data: { is_used: true },
  });

  // Generate and send OTP
  const otp = generateOtp();
  const expiresAt = getOtpExpiry();

  await prisma.phone_otps.create({
    data: {
      phone: user.phone,
      otp_code: otp,
      purpose: 'account_deletion',
      expires_at: expiresAt,
    },
  });

  const smsResult = await sendOtpSms(user.phone, otp, 'account_deletion' as OtpPurpose);
  if (!smsResult.success) {
    return { success: false, error: 'Failed to send verification code. Please try again.' };
  }

  // Mask phone: 98XXXX6096
  const maskedPhone = user.phone.slice(0, 2) + '****' + user.phone.slice(-4);

  return { success: true, phone: maskedPhone, expiresIn: 600 };
}

export async function confirmAccountDeletion(userId: number, otp: string) {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: 'User not found' };
  if (!user.phone) return { success: false, error: 'Phone number not found' };
  if (user.deleted_at) return { success: false, error: 'Account is already scheduled for deletion' };

  // Find valid OTP
  const otpRecord = await prisma.phone_otps.findFirst({
    where: {
      phone: user.phone,
      purpose: 'account_deletion',
      is_used: false,
      expires_at: { gte: new Date() },
    },
    orderBy: { created_at: 'desc' },
  });

  if (!otpRecord) return { success: false, error: 'Invalid or expired code. Please request a new one.' };

  if (otpRecord.attempts >= MAX_VERIFY_ATTEMPTS) {
    await prisma.phone_otps.update({ where: { id: otpRecord.id }, data: { is_used: true } });
    return { success: false, error: 'Too many failed attempts. Please request a new code.' };
  }

  if (otpRecord.otp_code !== otp) {
    await prisma.phone_otps.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });
    const remaining = MAX_VERIFY_ATTEMPTS - otpRecord.attempts - 1;
    return { success: false, error: `Invalid code. ${remaining} attempts remaining.`, remainingAttempts: remaining };
  }

  // Soft-delete in transaction
  const now = new Date();
  const recoveryDeadline = new Date(now.getTime() + RECOVERY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.phone_otps.update({
      where: { id: otpRecord.id },
      data: { is_used: true },
    }),
    prisma.users.update({
      where: { id: userId },
      data: {
        deleted_at: now,
        deletion_requested_at: now,
        is_active: false,
      },
    }),
    // Revoke all refresh tokens
    prisma.refresh_tokens.updateMany({
      where: { user_id: userId },
      data: { is_revoked: true },
    }),
  ]);

  return { success: true, recoveryDeadline: recoveryDeadline.toISOString() };
}
