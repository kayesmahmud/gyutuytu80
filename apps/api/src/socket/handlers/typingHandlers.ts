import { Server } from 'socket.io';
import { prisma } from '@thulobazaar/database';
import type { AuthenticatedSocket } from '../types.js';

export function initializeTypingHandlers(io: Server, socket: AuthenticatedSocket): void {
  const userId = socket.userId;

  /**
   * User is typing
   */
  socket.on('typing:start', async (payload: { conversationId: number }) => {
    try {
      const { conversationId } = payload;

      socket.to(`conversation:${conversationId}`).emit('typing:user-started', {
        conversationId,
        userId,
      });

      const expiresAt = new Date(Date.now() + 5000);
      await prisma.typing_indicators.upsert({
        where: {
          conversation_id_user_id: {
            conversation_id: conversationId,
            user_id: userId,
          },
        },
        create: {
          conversation_id: conversationId,
          user_id: userId,
          expires_at: expiresAt,
        },
        update: {
          started_at: new Date(),
          expires_at: expiresAt,
        },
      });
    } catch (error) {
      console.error('❌ Error handling typing start:', error);
    }
  });

  /**
   * User stopped typing
   */
  socket.on('typing:stop', async (payload: { conversationId: number }) => {
    try {
      const { conversationId } = payload;

      socket.to(`conversation:${conversationId}`).emit('typing:user-stopped', {
        conversationId,
        userId,
      });

      await prisma.typing_indicators.deleteMany({
        where: {
          conversation_id: conversationId,
          user_id: userId,
        },
      });
    } catch (error) {
      console.error('❌ Error handling typing stop:', error);
    }
  });
}

