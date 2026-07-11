import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '@thulobazaar/database';
import config from '../../config/index.js';
import { catchAsync, NotFoundError, ValidationError, AuthenticationError } from '../../middleware/errorHandler.js';
import { authenticateToken } from '../../middleware/auth.js';
import { rateLimiters } from '../../middleware/rateLimiter.js';
import { verifyTwoFactorCode } from '../../services/auth.service.js';

const router = Router();

/**
 * POST /api/editor/auth/login
 * Editor/Admin login
 */
router.post(
  '/login',
  // 🔒 API-2: rate-limit brute-force against the highest-value credentials
  // (editor/admin/super_admin), matching the public auth routes.
  rateLimiters.auth,
  catchAsync(async (req: Request, res: Response) => {
    const { email, password, twoFactorCode } = req.body;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password_hash: true,
        full_name: true,
        role: true,
        is_active: true,
        last_login: true,
        avatar: true,
        two_factor_enabled: true,
        two_factor_secret: true,
        two_factor_backup_codes: true,
      },
    });

    if (!user || !['editor', 'admin', 'super_admin'].includes(user.role || '')) {
      throw new AuthenticationError('Invalid credentials');
    }

    if (!user.is_active) {
      throw new AuthenticationError('Account is deactivated');
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash || '');
    if (!passwordMatch) {
      throw new AuthenticationError('Invalid credentials');
    }

    // 🔒 API-2: staff 2FA must not be bypassable via the API login path. Single-step
    // (email + password + twoFactorCode), matching the web panel's NextAuth flow.
    if (user.two_factor_enabled && user.two_factor_secret) {
      if (!twoFactorCode) {
        return res.status(401).json({
          success: false,
          requires2FA: true,
          message: 'Two-factor authentication code required',
        });
      }
      const codeValid = await verifyTwoFactorCode(
        {
          id: user.id,
          two_factor_secret: user.two_factor_secret,
          two_factor_backup_codes: user.two_factor_backup_codes,
        },
        String(twoFactorCode)
      );
      if (!codeValid) {
        throw new AuthenticationError('Invalid two-factor authentication code');
      }
    }

    const previousLastLogin = user.last_login;

    await prisma.users.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    console.log(`✅ Editor/Admin logged in: ${user.email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          lastLogin: previousLastLogin,
        },
        token,
      },
    });
  })
);

/**
 * GET /api/editor/profile
 * Get current editor's profile
 */
router.get(
  '/profile',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        is_active: true,
        avatar: true,
        last_login: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isActive: user.is_active,
        avatar: user.avatar,
        lastLogin: user.last_login,
        createdAt: user.created_at,
      },
    });
  })
);

export default router;
