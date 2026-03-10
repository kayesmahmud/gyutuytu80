import { prisma } from '@thulobazaar/database';
import bcrypt from 'bcrypt';
import { SignJWT } from 'jose';
import crypto from 'crypto';
import { userSelectForAuth } from './queries';

// Type matching the fields returned by userSelectForAuth
interface AuthUser {
  id: number;
  email: string | null;
  full_name: string;
  phone: string | null;
  role: string;
  avatar: string | null;
  is_active: boolean;
  account_type: string | null;
  shop_slug: string | null;
  custom_shop_slug: string | null;
  business_name: string | null;
  business_verification_status: string | null;
  individual_verified: boolean | null;
  password_hash: string | null;
  is_suspended: boolean | null;
  last_login: Date | null;
  two_factor_enabled: boolean | null;
  two_factor_secret: string | null;
  two_factor_backup_codes: string | null;
  deleted_at: Date | null;
  deletion_requested_at: Date | null;
}

// Constants for account deletion
const RECOVERY_PERIOD_DAYS = 30;

// Find user for credentials authentication (phone only - email login removed)
export async function findUserForAuth(_email?: string, phone?: string) {
  if (!phone) {
    return null;
  }

  let phoneNumber = phone.replace(/\D/g, '');
  if (phoneNumber.startsWith('977')) {
    phoneNumber = phoneNumber.slice(3);
  }
  return prisma.users.findFirst({
    where: { phone: phoneNumber, phone_verified: true },
    select: userSelectForAuth,
  });
}

// Validate user status - returns error message or null
// Also returns special 'PENDING_DELETION' status for accounts that can be reactivated
export function validateUserStatus(user: AuthUser): string | null {
  if (user.is_suspended) return 'Account is suspended';

  // Check if account is pending deletion
  if (user.deleted_at && user.deletion_requested_at) {
    const deletionRequestedAt = new Date(user.deletion_requested_at);
    const daysSinceDeletion = Math.floor(
      (Date.now() - deletionRequestedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // If within recovery period, allow login (will be reactivated)
    if (daysSinceDeletion < RECOVERY_PERIOD_DAYS) {
      return 'PENDING_DELETION'; // Special status that triggers reactivation
    }

    // Past recovery period - account should be permanently deleted
    return 'Account has been permanently deleted';
  }

  if (!user.is_active) return 'Account is deactivated';
  return null;
}

// Reactivate a deleted account
export async function reactivateAccount(userId: number): Promise<void> {
  await prisma.users.update({
    where: { id: userId },
    data: {
      deleted_at: null,
      deletion_requested_at: null,
      is_active: true,
    },
  });
  console.log(`✅ Account ${userId} has been reactivated`);
}

// Verify password
export async function verifyPassword(password: string, hash: string | null): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

// Verify 2FA code
export async function verify2FA(
  user: AuthUser,
  code: string
): Promise<{ valid: boolean; usedBackupCode: boolean }> {
  const speakeasy = require('speakeasy');

  const isValidTotp = speakeasy.totp.verify({
    secret: user.two_factor_secret,
    encoding: 'base32',
    token: code,
    window: 2,
  });

  if (isValidTotp) {
    return { valid: true, usedBackupCode: false };
  }

  // Check backup codes
  if (user.two_factor_backup_codes) {
    const backupCodes = JSON.parse(user.two_factor_backup_codes as string);
    if (backupCodes.includes(code.toUpperCase())) {
      // Remove used backup code
      const updatedBackupCodes = backupCodes.filter(
        (c: string) => c !== code.toUpperCase()
      );
      await prisma.users.update({
        where: { id: user.id },
        data: { two_factor_backup_codes: JSON.stringify(updatedBackupCodes) },
      });
      return { valid: true, usedBackupCode: true };
    }
  }

  return { valid: false, usedBackupCode: false };
}

// Generate backend JWT token
export async function generateBackendToken(user: {
  id: number;
  email: string | null;
  phone: string | null;
  role: string;
}): Promise<string> {
  const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
  );

  return new SignJWT({
    userId: user.id,
    email: user.email || '',
    phone: user.phone,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

// Generate long-lived refresh token
export async function generateRefreshToken(user: { id: number }): Promise<string> {
  const token = crypto.randomBytes(40).toString('hex');
  const days = 30; // Default 30 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  await prisma.refresh_tokens.create({
    data: {
      user_id: user.id,
      token,
      expires_at: expiresAt,
    },
  });

  return token;
}

// Create user return object for NextAuth
export function createUserObject(
  user: AuthUser,
  backendToken: string | null,
  refreshToken: string | null,
  oauthProvider?: string
) {
  return {
    id: user.id.toString(),
    email: user.email,
    name: user.full_name,
    image: user.avatar,
    role: user.role,
    phone: user.phone,
    accountType: user.account_type,
    shopSlug: user.shop_slug,
    customShopSlug: user.custom_shop_slug,
    businessName: user.business_name,
    businessVerificationStatus: user.business_verification_status,
    individualVerified: user.individual_verified,
    lastLogin: user.last_login?.toISOString() || null,
    backendToken,
    refreshToken,
    oauthProvider,
  };
}

// Generate shop slug from name
export function generateShopSlug(name: string, userId: number): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  return `${baseSlug}-${userId}`;
}
