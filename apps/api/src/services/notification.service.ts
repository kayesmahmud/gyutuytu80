/**
 * Generic Notification Service
 * Handles: DB persistence, real-time socket delivery, and FCM push
 * Used by all notification types (ad approved, verification, payment, etc.)
 */
import { prisma } from '@thulobazaar/database';
import { getFirebaseMessaging } from './firebase.js';
import type { NotificationType } from '@thulobazaar/types';
import { transformDbNotificationToApi } from '@thulobazaar/types';
import { getIO } from '../socket/index.js';

interface SendNotificationParams {
  recipientUserIds: number[];
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string | null;
  saveToDb?: boolean;   // default true
  sendPush?: boolean;   // default true
  referenceId?: number; // for dedup logging (adId, ticketId, etc.)
}

export async function sendNotification({
  recipientUserIds,
  type,
  title,
  body,
  data = {},
  imageUrl = null,
  saveToDb = true,
  sendPush = true,
  referenceId,
}: SendNotificationParams): Promise<void> {
  if (recipientUserIds.length === 0) return;

  for (const userId of recipientUserIds) {
    try {
      // 1. Save to DB (notification center)
      let notificationId: number | undefined;
      if (saveToDb) {
        const notification = await prisma.notifications.create({
          data: {
            user_id: userId,
            type,
            title,
            body,
            data: data as Record<string, unknown>,
            image_url: imageUrl,
          },
        });
        notificationId = notification.id;

        // 2. Emit socket event for real-time badge updates
        const io = getIO();
        if (io) {
          const unreadCount = await prisma.notifications.count({
            where: { user_id: userId, is_read: false },
          });
          io.to(`user:${userId}`).emit('notification:new', {
            notification: transformDbNotificationToApi(notification as any),
            unreadCount,
          });
        }
      }

      // 3. Send FCM push
      if (sendPush) {
        await sendPushToUser(userId, title, body, { type, ...data });
      }

      // 4. Log for dedup/rate limiting
      await prisma.notification_log.create({
        data: {
          user_id: userId,
          notification_type: type,
          reference_id: referenceId ?? null,
        },
      }).catch((err) => console.error('Notification log error:', err));
    } catch (error) {
      console.error(`❌ Notification error for user ${userId}:`, error);
    }
  }
}

/**
 * Check if a notification was already sent (for rate limiting)
 */
export async function canSendNotification(
  userId: number,
  type: string,
  referenceId?: number,
  cooldownMinutes: number = 60
): Promise<boolean> {
  const since = new Date(Date.now() - cooldownMinutes * 60 * 1000);
  const existing = await prisma.notification_log.findFirst({
    where: {
      user_id: userId,
      notification_type: type,
      ...(referenceId != null && { reference_id: referenceId }),
      sent_at: { gte: since },
    },
  });
  return !existing;
}

/**
 * Send FCM push to a single user's devices
 */
async function sendPushToUser(
  userId: number,
  title: string,
  body: string,
  data: Record<string, string>
): Promise<void> {
  const messaging = getFirebaseMessaging();
  if (!messaging) return;

  const tokenRows = await prisma.fcm_tokens.findMany({
    where: { user_id: userId },
    select: { id: true, token: true },
  });

  if (tokenRows.length === 0) return;

  const tokens = tokenRows.map((r) => r.token);

  try {
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data,
      android: {
        priority: 'high',
        notification: {
          channelId: 'thulobazaar_notifications',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            alert: { title, body },
          },
        },
      },
    });

    // Clean up stale tokens
    if (response.failureCount > 0) {
      const staleTokenIds: number[] = [];
      response.responses.forEach((resp, idx) => {
        if (
          resp.error &&
          (resp.error.code === 'messaging/registration-token-not-registered' ||
            resp.error.code === 'messaging/invalid-registration-token')
        ) {
          const row = tokenRows.find((r) => r.token === tokens[idx]);
          if (row) staleTokenIds.push(row.id);
        }
      });

      if (staleTokenIds.length > 0) {
        await prisma.fcm_tokens.deleteMany({
          where: { id: { in: staleTokenIds } },
        });
      }
    }

    console.log(`📱 Push [${data.type}]: ${response.successCount} success, ${response.failureCount} failed (user ${userId})`);
  } catch (error) {
    console.error(`❌ FCM error for user ${userId}:`, error);
  }
}
