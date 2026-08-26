import { Server } from 'socket.io';
import { prisma } from '@thulobazaar/database';
import type { AuthenticatedSocket, SendMessagePayload } from '../types.js';
import { sendMessagePushNotification } from '../../services/pushNotification.js';
import { sendNotification, canSendNotification } from '../../services/notification.service.js';
import { censorProfanity } from '../../utils/profanityFilter.js';
import { isBlockedBetween } from '../../utils/blockCheck.js';
import { isStaffRole } from '../../utils/staffRoles.js';

// Safe callback helper — prevents crashes when client emits without a callback
function safeCallback(callback: unknown, data: Record<string, unknown>) {
  if (typeof callback === 'function') {
    callback(data);
  }
}

export function initializeMessageHandlers(
  io: Server,
  socket: AuthenticatedSocket,
  onlineUsers: Map<number, Set<string>>
): void {
  const userId = socket.userId;

  /**
   * Send a new message
   */
  socket.on('message:send', async (payload: SendMessagePayload, callback) => {
    try {
      const { conversationId, content, type = 'text', attachmentUrl } = payload;

      // Validate conversation membership
      const participant = await prisma.conversation_participants.findFirst({
        where: {
          user_id: userId,
          conversation_id: conversationId,
        },
      });

      if (!participant) {
        return safeCallback(callback, { error: 'Not a member of this conversation' });
      }

      // Block enforcement: reject if either party blocked the other
      const otherParticipant = await prisma.conversation_participants.findFirst({
        where: { conversation_id: conversationId, user_id: { not: userId } },
        select: { user_id: true },
      });
      if (otherParticipant && (await isBlockedBetween(userId, otherParticipant.user_id))) {
        return safeCallback(callback, {
          error: 'You cannot send messages in this conversation because of a block.',
          code: 'BLOCKED',
        });
      }

      // Server-side profanity censoring (safety net)
      const sanitizedContent = censorProfanity(content);

      // Insert message into database
      const message = await prisma.messages.create({
        data: {
          conversation_id: conversationId,
          sender_id: userId,
          content: sanitizedContent,
          type,
          attachment_url: attachmentUrl || null,
        },
      });

      // Get sender info
      const sender = await prisma.users.findUnique({
        where: { id: userId },
        select: { id: true, full_name: true, avatar: true, role: true },
      });

      // Build complete message object
      const messageData = {
        id: message.id,
        conversationId: message.conversation_id,
        senderId: message.sender_id,
        sender: {
          id: sender?.id,
          fullName: sender?.full_name,
          avatar: sender?.avatar,
          isStaff: isStaffRole(sender?.role),
        },
        content: message.content,
        type: message.type,
        attachmentUrl: message.attachment_url,
        createdAt: message.created_at,
      };

      // Broadcast to conversation room (exclude sender — they have optimistic update)
      socket.to(`conversation:${conversationId}`).emit('message:new', messageData);

      // Update last_read_at for sender
      await prisma.conversation_participants.updateMany({
        where: {
          conversation_id: conversationId,
          user_id: userId,
        },
        data: {
          last_read_at: new Date(),
        },
      });

      // Update conversation last_message_at timestamp
      const conversation = await prisma.conversations.update({
        where: { id: conversationId },
        data: { last_message_at: new Date() },
        select: { team_user_id: true },
      });

      // Broadcast conversation update
      io.to(`conversation:${conversationId}`).emit('conversation:updated', {
        conversationId,
        lastMessage: messageData,
        timestamp: new Date(),
      });

      // Team threads also mirror into the shared editor inbox room, so every
      // staff member sees the user's reply — not just the editor who wrote last.
      // Distinct event name: staff sockets also get plain message:new for their
      // own personal chats, and the inbox must not confuse the two.
      if (conversation.team_user_id) {
        io.to('team:inbox').emit('team-inbox:message-new', messageData);
      }

      // Send push notifications to offline participants AND create in-app notifications
      prisma.conversation_participants
        .findMany({
          where: {
            conversation_id: conversationId,
            user_id: { not: userId },
            is_muted: { not: true },
          },
          select: { user_id: true },
        })
        .then(async (participants) => {
          const recipientIds = participants.map((p) => p.user_id);
          const offlineRecipientIds = recipientIds.filter((uid) => !onlineUsers.has(uid));

          // Push notifications for offline users
          if (offlineRecipientIds.length > 0) {
            sendMessagePushNotification({
              senderName: sender?.full_name || 'Someone',
              senderAvatar: sender?.avatar || null,
              messageContent: content,
              messageType: type,
              conversationId,
              recipientUserIds: offlineRecipientIds,
            }).catch((err) => console.error('Push notification error:', err));
          }

          // In-app notifications for ALL recipients (rate-limited: 1 per conversation per 5 min)
          for (const recipientId of recipientIds) {
            const canSend = await canSendNotification(recipientId, 'new_message', conversationId, 5);
            if (canSend) {
              const senderName = sender?.full_name || 'Someone';
              const preview = content.length > 60 ? content.substring(0, 60) + '...' : content;
              sendNotification({
                recipientUserIds: [recipientId],
                type: 'new_message',
                title: `New message from ${senderName}`,
                body: type === 'image' ? `${senderName} sent an image` : preview,
                data: {
                  conversationId: String(conversationId),
                  senderId: String(userId),
                },
                imageUrl: sender?.avatar || null,
                sendPush: false, // Already handled above
                referenceId: conversationId,
              }).catch((err) => console.error('In-app notification error:', err));
            }
          }
        })
        .catch((err) => console.error('Error fetching participants for notifications:', err));

      safeCallback(callback, { success: true, message: messageData });
    } catch (error) {
      console.error('❌ Error sending message:', error);
      safeCallback(callback, { error: (error as Error).message });
    }
  });

  /**
   * Mark messages as read
   */
  socket.on('message:read', async (payload: { conversationId: number }, callback) => {
    try {
      const { conversationId } = payload;

      await prisma.conversation_participants.updateMany({
        where: {
          conversation_id: conversationId,
          user_id: userId,
        },
        data: {
          last_read_at: new Date(),
        },
      });

      socket.to(`conversation:${conversationId}`).emit('message:read', {
        conversationId,
        userId,
        readAt: new Date(),
      });

      safeCallback(callback, { success: true });
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
      safeCallback(callback, { error: (error as Error).message });
    }
  });

  /**
   * Edit a message
   */
  socket.on('message:edit', async (payload: { messageId: number; newContent: string }, callback) => {
    try {
      const { messageId, newContent } = payload;

      const message = await prisma.messages.findFirst({
        where: {
          id: messageId,
          sender_id: userId,
        },
      });

      if (!message) {
        return safeCallback(callback, { error: 'Message not found or unauthorized' });
      }

      const sanitizedNewContent = censorProfanity(newContent);

      await prisma.messages.update({
        where: { id: messageId },
        data: {
          content: sanitizedNewContent,
          is_edited: true,
          edited_at: new Date(),
        },
      });

      io.to(`conversation:${message.conversation_id}`).emit('message:edited', {
        messageId,
        newContent: sanitizedNewContent,
        editedAt: new Date(),
      });

      safeCallback(callback, { success: true });
    } catch (error) {
      console.error('❌ Error editing message:', error);
      safeCallback(callback, { error: (error as Error).message });
    }
  });

  /**
   * Delete a message
   */
  socket.on('message:delete', async (payload: { messageId: number }, callback) => {
    try {
      const { messageId } = payload;

      const message = await prisma.messages.findFirst({
        where: {
          id: messageId,
          sender_id: userId,
        },
      });

      if (!message) {
        return safeCallback(callback, { error: 'Message not found or unauthorized' });
      }

      await prisma.messages.update({
        where: { id: messageId },
        data: {
          is_deleted: true,
          deleted_at: new Date(),
        },
      });

      io.to(`conversation:${message.conversation_id}`).emit('message:deleted', {
        messageId,
        deletedAt: new Date(),
      });

      safeCallback(callback, { success: true });
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      safeCallback(callback, { error: (error as Error).message });
    }
  });
}
