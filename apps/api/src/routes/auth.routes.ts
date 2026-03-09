import { Router, Request, Response } from 'express';
import passport from 'passport';
import config from '../config/index.js';
import { authenticateToken } from '../middleware/auth.js';
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
  verifyGoogleToken,
  changePassword,
  updatePhone,
  getSessions,
  revokeSession,
  setup2FA,
  verify2FASetup,
  disable2FA,
  verify2FALogin,
  requestAccountDeletion,
  confirmAccountDeletion,
  type OtpPurposeType,
} from '../services/auth.service.js';

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

/**
 * POST /api/auth/google-token
 * Verify Google ID Token from mobile app and return session tokens
 */
router.post(
  '/google-token',
  rateLimiters.auth,
  catchAsync(async (req: Request, res: Response) => {
    const { idToken } = req.body;

    if (!idToken) {
      throw new ValidationError('idToken is required');
    }

    const result = await verifyGoogleToken(idToken);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.error,
      });
    }

    res.json({
      success: true,
      message: 'Google login successful',
      token: result.token,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  })
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

    const validPurposes: OtpPurposeType[] = ['registration', 'login', 'password_reset', 'phone_verification', 'account_deletion'];
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

    // 2FA required — return temp token instead of real tokens
    if (result.requires2FA) {
      return res.json({
        success: true,
        requires2FA: true,
        tempToken: result.tempToken,
        message: 'Two-factor authentication required',
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


// ============================================================================
// Security Routes
// ============================================================================

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post(
  '/change-password',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ValidationError('Current and new password are required');
    }

    if (newPassword.length < 6) {
      throw new ValidationError('New password must be at least 6 characters');
    }

    const result = await changePassword(userId, currentPassword, newPassword);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  })
);

/**
 * POST /api/auth/update-phone
 * Update verified phone number
 */
router.post(
  '/update-phone',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { phone, verificationToken } = req.body;

    if (!phone || !verificationToken) {
      throw new ValidationError('Phone number and verification token are required');
    }

    const result = await updatePhone(userId, phone, verificationToken);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.json({
      success: true,
      message: 'Phone number updated successfully',
    });
  })
);

/**
 * GET /api/auth/sessions
 * Get active sessions
 */
router.get(
  '/sessions',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const result = await getSessions(userId);

    res.json({
      success: true,
      data: result.sessions,
    });
  })
);

/**
 * DELETE /api/auth/sessions/:sessionId
 * Revoke a session
 */
router.delete(
  '/sessions/:sessionId',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const sessionId = parseInt(req.params.sessionId as string);

    const result = await revokeSession(userId, sessionId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error,
      });
    }

    res.json({
      success: true,
      message: 'Session revoked successfully',
    });
  })
);

// ============================================================================
// 2FA Routes
// ============================================================================

/**
 * POST /api/auth/2fa/setup
 * Initiate 2FA setup — returns QR code and secret
 */
router.post(
  '/2fa/setup',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const result = await setup2FA(req.user!.userId);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }
    res.json({
      success: true,
      data: { qrCode: result.qrCode, secret: result.secret },
    });
  })
);

/**
 * POST /api/auth/2fa/verify-setup
 * Verify TOTP code to complete 2FA setup — returns backup codes
 */
router.post(
  '/2fa/verify-setup',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { code } = req.body;
    if (!code || code.length !== 6) {
      throw new ValidationError('A 6-digit verification code is required');
    }
    const result = await verify2FASetup(req.user!.userId, code);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }
    res.json({
      success: true,
      message: 'Two-factor authentication enabled successfully',
      data: { backupCodes: result.backupCodes },
    });
  })
);

/**
 * POST /api/auth/2fa/disable
 * Disable 2FA — requires password + TOTP code
 */
router.post(
  '/2fa/disable',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { password, code } = req.body;
    if (!password || !code) {
      throw new ValidationError('Password and 2FA code are required');
    }
    const result = await disable2FA(req.user!.userId, password, code);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }
    res.json({
      success: true,
      message: 'Two-factor authentication disabled successfully',
    });
  })
);

/**
 * POST /api/auth/2fa/verify-login
 * Verify 2FA code during login (public — uses temp token)
 */
router.post(
  '/2fa/verify-login',
  rateLimiters.auth,
  catchAsync(async (req: Request, res: Response) => {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) {
      throw new ValidationError('Temp token and verification code are required');
    }
    const result = await verify2FALogin(tempToken, code);
    if (!result.success) {
      return res.status(401).json({ success: false, message: result.error });
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

// ============================================================================
// Account Deletion Routes
// ============================================================================

/**
 * POST /api/auth/account/delete-request
 * Request account deletion — sends OTP to verified phone
 */
router.post(
  '/account/delete-request',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const result = await requestAccountDeletion(req.user!.userId);
    if (!result.success) {
      const status = (result as any).cooldownRemaining ? 429 : 400;
      return res.status(status).json({
        success: false,
        message: result.error,
        cooldownRemaining: (result as any).cooldownRemaining,
      });
    }
    res.json({
      success: true,
      message: 'Verification code sent',
      data: { phone: result.phone, expiresIn: result.expiresIn },
    });
  })
);

/**
 * POST /api/auth/account/delete-confirm
 * Confirm account deletion with OTP
 */
router.post(
  '/account/delete-confirm',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { otp } = req.body;
    if (!otp || otp.length !== 6) {
      throw new ValidationError('A 6-digit verification code is required');
    }
    const result = await confirmAccountDeletion(req.user!.userId, otp);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
        remainingAttempts: (result as any).remainingAttempts,
      });
    }
    res.json({
      success: true,
      message: 'Account scheduled for deletion',
      data: { recoveryDeadline: result.recoveryDeadline },
    });
  })
);

export default router;
