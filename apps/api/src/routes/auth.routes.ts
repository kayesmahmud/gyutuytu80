import { Router, Request, Response } from 'express';
import passport from 'passport';
import config from '../config/index.js';
import { rateLimiters } from '../middleware/rateLimiter.js';
import { catchAsync, ValidationError } from '../middleware/errorHandler.js';
import { formatPhoneNumber } from '../lib/sms.js';
import { generateAccessToken, generateRefreshToken, rotateRefreshToken } from '../lib/token.js';
import {
  sendOtp,
  verifyOtp,
  loginWithPhone,
  registerWithPhone,
  resetPassword,
  type OtpPurposeType,
} from '../services/auth.service';

const router = Router();

// ============================================================================
// Deprecated Routes
// ============================================================================

/**
 * POST /api/auth/register
 * DEPRECATED: Email registration removed. Use phone registration.
 */
router.post(
  '/register',
  rateLimiters.auth,
  catchAsync(async (_req: Request, res: Response) => {
    res.status(400).json({
      success: false,
      message: 'Email registration is no longer supported. Please register using phone number or Google/Facebook.',
    });
  })
);

/**
 * POST /api/auth/login
 * DEPRECATED: Email/password login removed. Use phone OTP or OAuth.
 */
router.post(
  '/login',
  rateLimiters.auth,
  catchAsync(async (_req: Request, res: Response) => {
    res.status(400).json({
      success: false,
      message: 'Email login is no longer supported. Please login using phone number or Google/Facebook.',
    });
  })
);

// ============================================================================
// Token Routes
// ============================================================================

/**
 * POST /api/auth/refresh-token
 * Refresh JWT token using a valid refresh token with rotation
 */
router.post(
  '/refresh-token',
  catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    try {
      const { accessToken, refreshToken: newRefreshToken, user } = await rotateRefreshToken(refreshToken);

      console.log(`🔄 Token rotated for: ${user.email} (userId: ${user.id})`);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: accessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Invalid or expired refresh token',
      });
    }
  })
);

// ============================================================================
// OAuth Routes
// ============================================================================

/**
 * GET /api/auth/google
 * Redirect to Google for authentication
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * GET /api/auth/callback/google
 * Google callback URL
 */
router.get(
  '/callback/google',
  passport.authenticate('google', {
    failureRedirect: `${config.FRONTEND_URL}/en/auth/signin?error=OAuthAccountNotLinked`,
    session: false
  }),
  async (req, res) => {
    const user = req.user;

    if (!user) {
      return res.redirect(`${config.FRONTEND_URL}/en/auth/signin?error=NoUser`);
    }

    // Generate tokens
    const accessToken = generateAccessToken({ id: user.userId, email: user.email, role: user.role });
    const refreshToken = await generateRefreshToken({ id: user.userId });

    console.log(`✅ Google OAuth success for: ${user.email}`);

    res.redirect(`${config.FRONTEND_URL}/api/auth/oauth-callback?token=${accessToken}&refreshToken=${refreshToken}&provider=google`);
  }
);

// ============================================================================
// OTP Routes
// ============================================================================

/**
 * POST /api/auth/send-otp
 * Send OTP to phone number
 */
router.post(
  '/send-otp',
  rateLimiters.auth,
  catchAsync(async (req: Request, res: Response) => {
    const { phone, purpose = 'registration' } = req.body;

    if (!phone) {
      throw new ValidationError('Phone number is required');
    }

    const validPurposes: OtpPurposeType[] = ['registration', 'login', 'password_reset', 'phone_verification'];
    if (!validPurposes.includes(purpose)) {
      throw new ValidationError('Invalid purpose');
    }

    const result = await sendOtp(phone, purpose);

    if (!result.success) {
      const status = result.cooldownRemaining ? 429 : result.error?.includes('not found') ? 404 : 400;
      return res.status(status).json({
        success: false,
        message: result.error,
        cooldownRemaining: result.cooldownRemaining,
      });
    }

    res.json({
      success: true,
      message: 'OTP sent successfully via SMS',
      identifier: result.identifier,
      expiresIn: result.expiresIn,
    });
  })
);

/**
 * POST /api/auth/verify-otp
 * Verify OTP and return verification token
 */
router.post(
  '/verify-otp',
  rateLimiters.auth,
  catchAsync(async (req: Request, res: Response) => {
    const { phone, otp, purpose = 'registration' } = req.body;

    if (!phone) {
      throw new ValidationError('Phone number is required');
    }

    if (!otp || otp.length !== 6) {
      throw new ValidationError('OTP must be 6 digits');
    }

    const result = await verifyOtp(phone, otp, purpose);

    if (!result.success) {
      const status = result.error?.includes('Too many') ? 429 : 400;
      return res.status(status).json({
        success: false,
        message: result.error,
        remainingAttempts: result.remainingAttempts,
      });
    }

    res.json({
      success: true,
      message: 'Phone number verified successfully',
      identifier: result.identifier,
      verificationToken: result.verificationToken,
    });
  })
);

// ============================================================================
// Phone Auth Routes
// ============================================================================

/**
 * POST /api/auth/phone-login
 * Login with phone number and password
 */
router.post(
  '/phone-login',
  rateLimiters.auth,
  catchAsync(async (req: Request, res: Response) => {
    const { phone, password } = req.body;

    if (!phone) {
      throw new ValidationError('Phone number is required');
    }

    if (!password) {
      throw new ValidationError('Password is required');
    }

    const result = await loginWithPhone(phone, password);

    if (!result.success) {
      const status = result.error?.includes('not found') ? 404 :
        result.error?.includes('Invalid password') ? 401 : 403;
      return res.status(status).json({
        success: false,
        message: result.error,
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      token: result.token,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  })
);

/**
 * POST /api/auth/register-phone
 * Register new user with phone number (after OTP verification)
 */
router.post(
  '/register-phone',
  rateLimiters.auth,
  catchAsync(async (req: Request, res: Response) => {
    const { phone, password, fullName, verificationToken } = req.body;

    if (!phone || !password || !fullName) {
      throw new ValidationError('Phone, password, and full name are required');
    }

    if (!verificationToken) {
      throw new ValidationError('Phone verification is required');
    }

    const result = await registerWithPhone(phone, password, fullName, verificationToken);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token: result.token,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  })
);

/**
 * POST /api/auth/reset-password
 * Reset password using OTP verification token
 */
router.post(
  '/reset-password',
  rateLimiters.auth,
  catchAsync(async (req: Request, res: Response) => {
    const { phone, newPassword, verificationToken } = req.body;

    if (!phone || !newPassword) {
      throw new ValidationError('Phone and new password are required');
    }

    if (!verificationToken) {
      throw new ValidationError('Verification token is required');
    }

    if (newPassword.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    const result = await resetPassword(phone, newPassword, verificationToken);

    if (!result.success) {
      const status = result.error?.includes('not found') ? 404 : 400;
      return res.status(status).json({
        success: false,
        message: result.error,
      });
    }

    res.json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.',
    });
  })
);

export default router;
