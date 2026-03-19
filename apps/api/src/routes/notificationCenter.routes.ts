/**
 * Notification Center Routes
 * GET    /api/notifications           — paginated list
 * GET    /api/notifications/unread-count — badge count
 * PUT    /api/notifications/:id/read  — mark single as read
 * PUT    /api/notifications/read-all  — mark all as read
 * DELETE /api/notifications/:id       — delete single
 */
import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { authenticateToken } from '../middleware/auth.js';
import { transformDbNotificationToApi } from '@thulobazaar/types';

const router = Router();

/**
 * GET /api/notifications
 * Paginated list of user's notifications, newest first
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notifications.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notifications.count({ where: { user_id: userId } }),
    ]);

    res.json({
      success: true,
      data: notifications.map((n) => transformDbNotificationToApi(n as any)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

/**
 * GET /api/notifications/unread-count
 * Returns unread notification count for badge
 */
router.get('/unread-count', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const count = await prisma.notifications.count({
      where: { user_id: userId, is_read: false },
    });
    res.json({ success: true, count });
  } catch (error) {
    console.error('❌ Error fetching unread count:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read
 */
router.put('/:id/read', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const notificationId = parseInt(req.params.id as string);

    if (isNaN(notificationId)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }

    const notification = await prisma.notifications.updateMany({
      where: { id: notificationId, user_id: userId },
      data: { is_read: true, read_at: new Date() },
    });

    if (notification.count === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    await prisma.notifications.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true, read_at: new Date() },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error marking all as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a single notification
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const notificationId = parseInt(req.params.id as string);

    if (isNaN(notificationId)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }

    const result = await prisma.notifications.deleteMany({
      where: { id: notificationId, user_id: userId },
    });

    if (result.count === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
});

export default router;
