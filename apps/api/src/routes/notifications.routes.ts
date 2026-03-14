/**
 * FCM Token Management Routes
 * POST /api/users/fcm-token   — register/update a device token
 * DELETE /api/users/fcm-token — remove a device token (on logout)
 */
import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/users/fcm-token
 * Upsert an FCM device token for the authenticated user
 */
router.post('/fcm-token', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { fcmToken, platform } = req.body;

    if (!fcmToken || typeof fcmToken !== 'string') {
      return res.status(400).json({ success: false, message: 'fcmToken is required' });
    }

    const validPlatforms = ['android', 'ios', 'web'];
    const devicePlatform = validPlatforms.includes(platform) ? platform : 'android';

    // Upsert: if token exists (maybe from another user), update ownership
    await prisma.fcm_tokens.upsert({
      where: { token: fcmToken },
      update: {
        user_id: userId,
        platform: devicePlatform,
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        token: fcmToken,
        platform: devicePlatform,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error saving FCM token:', error);
    res.status(500).json({ success: false, message: 'Failed to save FCM token' });
  }
});

/**
 * DELETE /api/users/fcm-token
 * Remove an FCM token (called on logout)
 */
router.delete('/fcm-token', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken || typeof fcmToken !== 'string') {
      return res.status(400).json({ success: false, message: 'fcmToken is required' });
    }

    await prisma.fcm_tokens.deleteMany({
      where: { token: fcmToken },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting FCM token:', error);
    res.status(500).json({ success: false, message: 'Failed to delete FCM token' });
  }
});

export default router;
