/**
 * Auth Service
 * Handles authentication, OTP, and user registration
 */

import bcrypt from 'bcryptjs';
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

// ============================================================================
// Constants
// ============================================================================

const MAX_OTP_ATTEMPTS = 3;
const OTP_COOLDOWN_SECONDS = 60;
const MAX_VERIFY_ATTEMPTS = 5;
const VERIFICATION_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

// ============================================================================
// Types
// ============================================================================

export type OtpPurposeType = 'registration' | 'login' | 'password_reset' | 'phone_verification';

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

  // Generate verification token
  const verificationToken = Buffer.from(
    JSON.stringify({
      identifier: formattedPhone,
      purpose,
      verifiedAt: Date.now(),
      expiresAt: Date.now() + VERIFICATION_TOKEN_EXPIRY_MS,
    })
  ).toString('base64');

  return {
    success: true,
    identifier: formattedPhone,
    verificationToken,
  };
}

// ============================================================================
// Verification Token Functions
// ============================================================================

export function validateVerificationToken(
  token: string,
  expectedPhone: string,
  expectedPurpose: OtpPurposeType
): { valid: boolean; error?: string } {
  try {
    const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());

    if (tokenData.identifier !== expectedPhone) {
      return { valid: false, error: 'Token mismatch' };
    }

    if (tokenData.purpose !== expectedPurpose) {
      return { valid: false, error: 'Invalid token purpose' };
    }

    if (Date.now() > tokenData.expiresAt) {
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

  if (!user.is_active) {
    return { success: false, error: 'Your account has been deactivated. Please contact support.' };
  }

  if (user.is_suspended) {
    return { success: false, error: 'Your account has been suspended. Please contact support.' };
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash!);
  if (!isPasswordValid) {
    return { success: false, error: 'Invalid password' };
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
