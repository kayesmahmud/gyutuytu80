/**
 * Push Notification Service
 * Sends FCM push notifications to offline users when they receive messages
 */
import { prisma } from '@thulobazaar/database';
import { getFirebaseMessaging } from './firebase.js';

interface SendMessagePushParams {
  senderName: string;
  senderAvatar: string | null;
  messageContent: string;
  messageType: string;
  conversationId: number;
  recipientUserIds: number[];
}

export async function sendMessagePushNotification({
  senderName,
  messageContent,
  messageType,
  conversationId,
  recipientUserIds,
}: SendMessagePushParams): Promise<void> {
  const messaging = getFirebaseMessaging();
  if (!messaging) return;

  if (recipientUserIds.length === 0) return;

  // Get FCM tokens for all offline recipients
  const tokenRows = await prisma.fcm_tokens.findMany({
    where: { user_id: { in: recipientUserIds } },
    select: { id: true, token: true },
  });

  if (tokenRows.length === 0) return;

  const tokens = tokenRows.map((r) => r.token);

  // Build notification body based on message type
  const body =
    messageType === 'image'
      ? '📷 Sent a photo'
      : messageType === 'file'
        ? '📎 Sent a file'
        : messageContent.length > 100
          ? messageContent.slice(0, 97) + '...'
          : messageContent;

  try {
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: senderName,
        body,
      },
      data: {
        type: 'new_message',
        conversationId: String(conversationId),
        senderName,
        route: '/chat',
      },
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
            alert: { title: senderName, body },
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
          const staleToken = tokens[idx];
          const row = tokenRows.find((r) => r.token === staleToken);
          if (row) staleTokenIds.push(row.id);
        }
      });

      if (staleTokenIds.length > 0) {
        await prisma.fcm_tokens.deleteMany({
          where: { id: { in: staleTokenIds } },
        });
        console.log(`🧹 Cleaned ${staleTokenIds.length} stale FCM token(s)`);
      }
    }

    console.log(
      `📱 Push sent: ${response.successCount} success, ${response.failureCount} failed (conversation ${conversationId})`
    );
  } catch (error) {
    console.error('❌ FCM send error:', error);
  }
}
