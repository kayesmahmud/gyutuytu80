import { Server } from 'socket.io';
import { prisma } from '@thulobazaar/database';
import type { AuthenticatedSocket, SendMessagePayload } from '../types.js';

export function initializeMessageHandlers(io: Server, socket: AuthenticatedSocket): void {
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
        return callback({ error: 'Not a member of this conversation' });
      }

      // Insert message into database
      const message = await prisma.messages.create({
        data: {
          conversation_id: conversationId,
          sender_id: userId,
          content,
          type,
          attachment_url: attachmentUrl || null,
        },
      });

      // Get sender info
      const sender = await prisma.users.findUnique({
        where: { id: userId },
        select: { id: true, full_name: true, avatar: true },
      });

      // Build complete message object
      const messageData = {
        id: message.id,
        conversationId: message.conversation_id,
        sender: {
          id: sender?.id,
          fullName: sender?.full_name,
          avatar: sender?.avatar,
        },
        content: message.content,
        type: message.type,
        attachmentUrl: message.attachment_url,
        createdAt: message.created_at,
      };

      // Broadcast to conversation room
      io.to(`conversation:${conversationId}`).emit('message:new', messageData);

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
      await prisma.conversations.update({
        where: { id: conversationId },
        data: { last_message_at: new Date() },
      });

      // Broadcast conversation update
      io.to(`conversation:${conversationId}`).emit('conversation:updated', {
        conversationId,
        lastMessage: messageData,
        timestamp: new Date(),
      });

      callback({ success: true, message: messageData });
    } catch (error) {
      console.error('❌ Error sending message:', error);
      callback({ error: (error as Error).message });
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

      callback({ success: true });
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
      callback({ error: (error as Error).message });
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
        return callback({ error: 'Message not found or unauthorized' });
      }

      await prisma.messages.update({
        where: { id: messageId },
        data: {
          content: newContent,
          is_edited: true,
          edited_at: new Date(),
        },
      });

      io.to(`conversation:${message.conversation_id}`).emit('message:edited', {
        messageId,
        newContent,
        editedAt: new Date(),
      });

      callback({ success: true });
    } catch (error) {
      console.error('❌ Error editing message:', error);
      callback({ error: (error as Error).message });
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
        return callback({ error: 'Message not found or unauthorized' });
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

      callback({ success: true });
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      callback({ error: (error as Error).message });
    }
  });
}


