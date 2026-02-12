import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/announcements
 * Get announcements for the current user
 */
router.get(
  '/',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const includeRead = req.query.includeRead === 'true';

    const announcements = await prisma.announcements.findMany({
      where: {
        is_active: true,
        OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      },
      include: {
        announcement_read_receipts: {
          where: { user_id: userId },
          select: { read_at: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const data = announcements
      .map((a) => {
        const readReceipt = a.announcement_read_receipts[0];
        return {
          id: a.id,
          title: a.title,
          content: a.content,
          targetAudience: a.target_audience,
          createdAt: a.created_at,
          expiresAt: a.expires_at,
          isRead: !!readReceipt,
          readAt: readReceipt?.read_at ?? null,
        };
      })
      .filter((a) => includeRead || !a.isRead);

    const unreadCount = data.filter((a) => !a.isRead).length;

    res.json({ success: true, data, unreadCount });
  })
);

/**
 * POST /api/announcements/:id/read
 * Mark an announcement as read
 */
router.post(
  '/:id/read',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const announcementId = parseInt(req.params.id);

    await prisma.announcement_read_receipts.upsert({
      where: { announcement_id_user_id: { announcement_id: announcementId, user_id: userId } },
      create: { announcement_id: announcementId, user_id: userId },
      update: { read_at: new Date() },
    });

    res.json({ success: true });
  })
);

export default router;
