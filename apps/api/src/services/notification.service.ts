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
import { isEngagementType, hasRecentEngagementPush } from './notificationPolicy.js';
import { TEAM_ACCOUNT_EMAIL } from '../utils/teamAccount.js';
import { SUPPORT_ASSISTANT_EMAIL } from '../utils/supportAssistant.js';

const SYSTEM_ACCOUNT_EMAILS = [TEAM_ACCOUNT_EMAIL, SUPPORT_ASSISTANT_EMAIL];

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
  /**
   * Write one log row per id instead of a single row for `referenceId`.
   *
   * For notifications that collapse several items into one message: the user
   * sees one push, but each underlying item still needs its own cooldown
   * record so it is not re-included in tomorrow's batch. Overrides
   * `referenceId` when provided.
   */
  logReferenceIds?: number[];
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
  logReferenceIds,
}: SendNotificationParams): Promise<void> {
  if (recipientUserIds.length === 0) return;

  const capped = sendPush && isEngagementType(type);

  for (const userId of recipientUserIds) {
    try {
      // Engagement types share one budget per recipient. When it is spent the
      // notification still reaches the in-app centre — it just does not buzz
      // the phone, which is the part users were complaining about.
      const pushAllowed = capped ? !(await hasRecentEngagementPush(userId)) : sendPush;
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
      const pushed = pushAllowed
        ? await sendPushToUser(userId, title, body, { type, ...data })
        : false;

      // 4. Log for dedup/rate limiting. `pushed` reflects whether a device was
      // actually reached, so users with no registered token never burn their
      // own engagement window on a push that went nowhere.
      const referenceIds = logReferenceIds?.length
        ? logReferenceIds
        : [referenceId ?? null];

      await prisma.notification_log.createMany({
        data: referenceIds.map((ref) => ({
          user_id: userId,
          notification_type: type,
          reference_id: ref,
          pushed,
        })),
      }).catch((err) => console.error('Notification log error:', err));
    } catch (error) {
      console.error(`❌ Notification error for user ${userId}:`, error);
    }
  }
}

/**
 * Resolve recipient user IDs for editor/staff operational alerts.
 * Editors are rows in the users table (role = 'editor'). Only editors who
 * installed the editor APK and logged in will actually have FCM tokens, so
 * pushes are naturally scoped to installed devices; the DB notification is
 * still written for the desktop notification center.
 */
export async function getEditorRecipientIds(): Promise<number[]> {
  const rows = await prisma.users.findMany({
    // Seeded system senders (team account, AI support assistant) carry the
    // editor role for display purposes but must never receive staff alerts.
    where: { role: 'editor', email: { notIn: SYSTEM_ACCOUNT_EMAILS } },
    select: { id: true },
  });
  return rows.map((r) => r.id);
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
 * How many times this notification has EVER been sent to the user for a given
 * reference. Cooldowns space repeats out; this is for rules that must stop
 * repeating altogether after N attempts.
 */
export async function countNotificationsSent(
  userId: number,
  type: string,
  referenceId: number
): Promise<number> {
  return prisma.notification_log.count({
    where: {
      user_id: userId,
      notification_type: type,
      reference_id: referenceId,
    },
  });
}

/**
 * Convenience: send an operational alert to all editors (push + DB + socket).
 * Resolves editor recipient IDs and, when cooldownMinutes is set, drops any
 * editor who already got the same (type, referenceId) within the window so a
 * burst on one ticket/ad doesn't spam. Fire-and-forget friendly.
 */
export async function notifyEditors(params: {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  referenceId?: number;
  cooldownMinutes?: number;
}): Promise<void> {
  const { cooldownMinutes, ...rest } = params;
  let recipientUserIds = await getEditorRecipientIds();
  if (recipientUserIds.length === 0) return;

  if (cooldownMinutes && cooldownMinutes > 0) {
    const allowed: number[] = [];
    for (const id of recipientUserIds) {
      if (await canSendNotification(id, rest.type, rest.referenceId, cooldownMinutes)) {
        allowed.push(id);
      }
    }
    recipientUserIds = allowed;
  }
  if (recipientUserIds.length === 0) return;

  await sendNotification({ recipientUserIds, ...rest });
}

/**
 * Send FCM push to a single user's devices.
 * Returns true only when at least one device was actually reached — the
 * engagement frequency cap keys off this, so "no token" and "every token
 * stale" must not count as a delivered push.
 */
async function sendPushToUser(
  userId: number,
  title: string,
  body: string,
  data: Record<string, string>
): Promise<boolean> {
  const messaging = getFirebaseMessaging();
  if (!messaging) return false;

  const tokenRows = await prisma.fcm_tokens.findMany({
    where: { user_id: userId },
    select: { id: true, token: true },
  });

  if (tokenRows.length === 0) return false;

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
    return response.successCount > 0;
  } catch (error) {
    console.error(`❌ FCM error for user ${userId}:`, error);
    return false;
  }
}
