import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync, NotFoundError, ValidationError } from '../../middleware/errorHandler.js';
import { authenticateToken } from '../../middleware/auth.js';
import { sendNotification } from '../../services/notification.service.js';

const router = Router();

// ============================================================================
// Broadcast — send notification to all (or filtered) users immediately
// ============================================================================

/**
 * POST /api/editor/notifications/broadcast
 * Send a notification to all active users (or a filtered audience)
 */
router.post(
  '/broadcast',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { type, title, body, data, imageUrl, targetAudience } = req.body;

    if (!title || !body) {
      throw new ValidationError('Title and body are required');
    }

    const notificationType = type || 'announcement';

    // Determine recipients based on target_audience
    const where: Record<string, unknown> = { is_active: true };
    if (targetAudience === 'business') {
      where.account_type = 'business';
    } else if (targetAudience === 'individual') {
      where.account_type = 'individual';
    }
    // 'all' → no additional filter

    const users = await prisma.users.findMany({
      where,
      select: { id: true },
    });

    const recipientIds = users.map(u => u.id);

    if (recipientIds.length === 0) {
      return res.json({ success: true, message: 'No recipients matched', recipientCount: 0 });
    }

    await sendNotification({
      recipientUserIds: recipientIds,
      type: notificationType,
      title,
      body,
      data: data || {},
      imageUrl,
    });

    res.json({
      success: true,
      message: `Broadcast sent to ${recipientIds.length} users`,
      recipientCount: recipientIds.length,
    });
  })
);

// ============================================================================
// Scheduled Notifications CRUD
// ============================================================================

/**
 * POST /api/editor/notifications/schedule
 * Create a scheduled notification
 */
router.post(
  '/schedule',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { type, title, body, data, imageUrl, targetAudience, scheduledFor } = req.body;

    if (!title || !body || !scheduledFor) {
      throw new ValidationError('Title, body, and scheduledFor are required');
    }

    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      throw new ValidationError('scheduledFor must be in the future');
    }

    const scheduled = await prisma.scheduled_notifications.create({
      data: {
        created_by: userId,
        type: type || 'announcement',
        title,
        body,
        data: data || undefined,
        image_url: imageUrl || undefined,
        target_audience: targetAudience || 'all',
        scheduled_for: scheduledDate,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: scheduled.id,
        type: scheduled.type,
        title: scheduled.title,
        body: scheduled.body,
        targetAudience: scheduled.target_audience,
        scheduledFor: scheduled.scheduled_for,
        status: scheduled.status,
        createdAt: scheduled.created_at,
      },
    });
  })
);

/**
 * GET /api/editor/notifications/scheduled
 * List all scheduled notifications
 */
router.get(
  '/scheduled',
  authenticateToken,
  catchAsync(async (_req: Request, res: Response) => {
    const items = await prisma.scheduled_notifications.findMany({
      orderBy: { scheduled_for: 'desc' },
      include: { users: { select: { full_name: true } } },
    });

    res.json({
      success: true,
      data: items.map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        body: item.body,
        targetAudience: item.target_audience,
        scheduledFor: item.scheduled_for,
        status: item.status,
        sentAt: item.sent_at,
        recipientCount: item.recipient_count,
        createdBy: item.users?.full_name || 'Unknown',
        createdAt: item.created_at,
      })),
    });
  })
);

/**
 * PUT /api/editor/notifications/scheduled/:id
 * Update a pending scheduled notification
 */
router.put(
  '/scheduled/:id',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, body, data, imageUrl, targetAudience, scheduledFor } = req.body;

    const existing = await prisma.scheduled_notifications.findUnique({
      where: { id: parseInt(id as string) },
    });

    if (!existing) {
      throw new NotFoundError('Scheduled notification not found');
    }

    if (existing.status !== 'pending') {
      throw new ValidationError('Only pending notifications can be edited');
    }

    const updated = await prisma.scheduled_notifications.update({
      where: { id: parseInt(id as string) },
      data: {
        title: title || undefined,
        body: body || undefined,
        data: data !== undefined ? data : undefined,
        image_url: imageUrl !== undefined ? imageUrl : undefined,
        target_audience: targetAudience || undefined,
        scheduled_for: scheduledFor ? new Date(scheduledFor) : undefined,
        updated_at: new Date(),
      },
    });

    res.json({
      success: true,
      data: {
        id: updated.id,
        title: updated.title,
        body: updated.body,
        targetAudience: updated.target_audience,
        scheduledFor: updated.scheduled_for,
        status: updated.status,
      },
    });
  })
);

/**
 * DELETE /api/editor/notifications/scheduled/:id
 * Cancel/delete a scheduled notification
 */
router.delete(
  '/scheduled/:id',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const existing = await prisma.scheduled_notifications.findUnique({
      where: { id: parseInt(id as string) },
    });

    if (!existing) {
      throw new NotFoundError('Scheduled notification not found');
    }

    if (existing.status === 'sent') {
      throw new ValidationError('Cannot delete a notification that has already been sent');
    }

    await prisma.scheduled_notifications.delete({
      where: { id: parseInt(id as string) },
    });

    res.json({ success: true, message: 'Scheduled notification deleted' });
  })
);

export default router;
