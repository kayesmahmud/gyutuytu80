import { Server } from 'socket.io';
import { prisma } from '@thulobazaar/database';
import type { AuthenticatedSocket, CreateConversationPayload } from '../types.js';

export function initializeConversationHandlers(io: Server, socket: AuthenticatedSocket, onlineUsers: Map<number, string>): void {
  const userId = socket.userId;

  /**
   * Create a new conversation
   */
  socket.on('conversation:create', async (payload: CreateConversationPayload, callback) => {
    try {
      const { participantIds, type = 'direct', title, adId } = payload;

      const allParticipants = [...new Set([userId, ...participantIds])];

      const conversation = await prisma.conversations.create({
        data: {
          type,
          title: title || null,
          ad_id: adId || null,
        },
      });

      await prisma.conversation_participants.createMany({
        data: allParticipants.map((participantId) => ({
          conversation_id: conversation.id,
          user_id: participantId,
        })),
      });

      allParticipants.forEach((pId) => {
        const socketId = onlineUsers.get(pId);
        if (socketId) {
          io.sockets.sockets.get(socketId)?.join(`conversation:${conversation.id}`);
        }
      });

      io.to(`conversation:${conversation.id}`).emit('conversation:created', conversation);

      callback({ success: true, conversation });
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      callback({ error: (error as Error).message });
    }
  });
}

