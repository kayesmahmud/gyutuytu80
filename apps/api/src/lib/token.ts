import jwt from 'jsonwebtoken';
import { prisma } from '@thulobazaar/database';
import config from '../config/index.js';
import crypto from 'crypto';

/**
 * Generate a short-lived access token
 */
export const generateAccessToken = (user: {
    id: number;
    email?: string | null;
    phone?: string | null;
    role?: string | null;
}) => {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
        },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES_IN } as jwt.SignOptions
    );
};

/**
 * Generate a long-lived refresh token and store it in DB
 * Optionally revokes all existing tokens for this user first
 */
export const generateRefreshToken = async (user: {
    id: number;
    ipAddress?: string;
    userAgent?: string;
}, revokeExisting: boolean = true) => {
    // Revoke all existing refresh tokens for this user (clean login)
    if (revokeExisting) {
        await prisma.refresh_tokens.updateMany({
            where: { user_id: user.id, is_revoked: false },
            data: { is_revoked: true },
        });
    }

    // Generate a random token string (opaque)
    const token = crypto.randomBytes(40).toString('hex');

    // Parse expiry (e.g., '7d' -> Date)
    // Simple parsing for 'd' (days)
    const days = parseInt(config.REFRESH_TOKEN_EXPIRES_IN.replace('d', '')) || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // Store in database
    const refreshToken = await prisma.refresh_tokens.create({
        data: {
            user_id: user.id,
            token,
            expires_at: expiresAt,
        },
    });

    return refreshToken.token;
};

/**
 * Verify and rotate a refresh token
 * Returns new tokens if valid, throws error otherwise
 */
export const rotateRefreshToken = async (token: string, ipAddress?: string) => {
    const existingToken = await prisma.refresh_tokens.findUnique({
        where: { token },
        include: { users: true },
    });

    if (!existingToken) {
        throw new Error('Invalid refresh token');
    }

    // Reuse detection: if token was already revoked/replaced, it might be a theft attempt
    if (existingToken.is_revoked || existingToken.replaced_by) {
        // Revoke all tokens for this user family (security measure)
        await prisma.refresh_tokens.updateMany({
            where: { user_id: existingToken.user_id },
            data: { is_revoked: true },
        });
        throw new Error('Refresh token reused - security alert');
    }

    // Check expiry
    if (new Date() > existingToken.expires_at) {
        // Revoke it just to be sure
        await prisma.refresh_tokens.update({
            where: { id: existingToken.id },
            data: { is_revoked: true },
        });
        throw new Error('Refresh token expired');
    }

    // Token is valid! Rotate it.
    // 1. Revoke old token
    // 2. Generate new refresh token
    // 3. Generate new access token

    const newRefreshTokenString = crypto.randomBytes(40).toString('hex');
    const days = parseInt(config.REFRESH_TOKEN_EXPIRES_IN.replace('d', '')) || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // Transaction for rotation
    const [_, newRefreshToken] = await prisma.$transaction([
        prisma.refresh_tokens.update({
            where: { id: existingToken.id },
            data: {
                is_revoked: true,
                replaced_by: newRefreshTokenString
            },
        }),
        prisma.refresh_tokens.create({
            data: {
                user_id: existingToken.user_id,
                token: newRefreshTokenString,
                expires_at: expiresAt,
            },
        }),
    ]);

    const newAccessToken = generateAccessToken(existingToken.users);

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken.token,
        user: existingToken.users
    };
};

/**
 * Revoke a refresh token (logout)
 */
export const revokeRefreshToken = async (token: string) => {
    await prisma.refresh_tokens.updateMany({
        where: { token },
        data: { is_revoked: true },
    });
};
